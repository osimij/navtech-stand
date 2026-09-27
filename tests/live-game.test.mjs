import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createGameGuide } from '../lib/live-game.ts';
import { questions, profiles, scoreAnswers, interestLabels } from '../lib/quiz.ts';
import { relayLive } from '../lib/live-relay.ts';
import { liveSession } from '../lib/live.ts';
const guide = createGameGuide({ questions, profiles, scoreAnswers, interestLabels });
const game = (phase = 'quiz', step = 0, answers = [], selected = null) => ({ phase, step, answers, selected, interest: '' });
test('game context contains only valid structured game state, never form values', () => {
  const input = { ...game(), name: 'private name', contact: 'private email', instructions: 'injected' };
  assert.deepEqual(guide.parse(input), game());
  assert.equal(guide.parse(game('quiz', questions.length)), null);
  assert.equal(guide.parse(game('quiz', 0, [7])), null);
  assert.equal(guide.parse(game('result', 4, [0])), null);
});
test('question transitions acknowledge the real choice and explain the new screen', () => {
  const next = game('quiz', 1, [2]); const cue = guide.cue(next, game('quiz', 0, [2], 2), 'ru');
  assert.equal(cue.speak, true);
  assert.ok(cue.text.includes(questions[1].title)); assert.ok(cue.text.includes(questions[0].options[2].text));
  const selection = guide.cue(game('quiz', 1, [2, 1], 1), next, 'ru');
  assert.equal(selection.speak, false); assert.ok(selection.text.includes(questions[1].options[1].text));
  assert.ok(selection.text.length < 400, 'selection updates must not queue the full question again');
});
test('result is recomputed from actual answers and ties are preserved', () => {
  const answers = Array(questions.length).fill(0); const cue = guide.cue(game('result', 4, answers, 0), null, 'ru');
  assert.match(cue.text, /Top three roles/); assert.match(cue.text, /Actual work/); assert.doesNotMatch(cue.text, /First project:|Skills to learn:/);
  let tied;
  for (let n = 0; n < 1024; n++) { const a = Array.from({ length: questions.length }, (_, i) => n >> (2 * i) & 3); if (scoreAnswers(a).tied) { tied = a; break; } }
  const tieCue = guide.cue(game('result', 4, tied, tied[4]), null, 'en'); assert.match(tieCue.text, /tied; do not pick a single winner/);
});
class Socket extends EventEmitter {
  readyState = 1; bufferedAmount = 0; sent = [];
  send(raw) { this.sent.push(JSON.parse(raw)); }
  close() { if (this.readyState === 3) return; this.readyState = 3; this.emit('close'); }
  message(event) { this.emit('message', Buffer.from(JSON.stringify(event)), false); }
}
test('one voice session follows every game stage and remains open beyond two minutes', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const client = new Socket(), provider = new Socket(); let connections = 0;
  relayLive(client, () => { connections++; return provider; }, liveSession, guide);
  client.message({ type: 'start', language: 'ru', game: game('welcome') }); provider.emit('open'); provider.message({ type: 'session.updated' });
  client.message({ type: 'game', game: game() });
  assert.ok(provider.sent.at(-1).session.instructions.includes(questions[0].title));
  const answers = [];
  for (let i = 0; i < questions.length; i++) {
    answers.push(0); client.message({ type: 'game', game: game('quiz', i, [...answers], 0) });
    if (i < questions.length-1) client.message({ type: 'game', game: game('quiz', i + 1, [...answers]) });
  }
  client.message({ type: 'game', game: game('result', 4, answers, 0) }); assert.match(provider.sent.at(-1).session.instructions, /Top three roles/);
  client.message({ type: 'game', game: { ...game('contact', 4, answers, 0), interest: 'prism' } }); assert.match(provider.sent.at(-1).session.instructions, /No form values/);
  client.message({ type: 'game', game: game('success', 4, answers, 0) }); assert.match(provider.sent.at(-1).session.instructions, /successfully saved/);
  t.mock.timers.tick(121000); assert.equal(provider.sent.some(e => e.type === 'session.close'), false); assert.equal(connections, 1);
  client.message({ type: 'close' }); assert.equal(provider.readyState, 3);
});
test('starting voice mid-game talks about current question instead of greeting', () => {
  const client = new Socket(), provider = new Socket();
  relayLive(client, () => provider, liveSession, guide);
  client.message({ type: 'start', language: 'ru', game: game('quiz', 2, [0, 2]) }); provider.emit('open'); provider.message({ type: 'session.updated' });
  assert.ok(provider.sent[0].session.instructions.includes(questions[2].title)); assert.match(provider.sent.at(-2).item.content[0].text, /during the game/);
  const count = provider.sent.length; client.message({ type: 'game', game: game('quiz', 2, [0, 2]) }); assert.equal(provider.sent.length, count);
  client.close(); provider.message({ type: 'session.closed' });
});
test('primary demo stays Russian even with a stale English session while updates remain silent during speech', t => {
  t.mock.timers.enable({apis:['setTimeout','Date']});
  const client=new Socket(),provider=new Socket();
  relayLive(client,()=>provider,liveSession,guide);
  client.message({type:'start',language:'en',game:game('welcome')});provider.emit('open');provider.message({type:'session.updated'});
  provider.message({type:'response.created',response:{id:'r1'}});
  client.message({type:'game',game:game('quiz',1,[2])});
  const context=provider.sent.at(-1);
  assert.equal(context.type,'session.update');assert.match(context.session.instructions,/Start in Russian/);
  assert.doesNotMatch(context.session.instructions,/Speak Russian|Speak English|Speak now/);
  assert.ok(context.session.instructions.includes(questions[1].title));
  t.mock.timers.tick(3000);
  assert.equal(provider.sent.filter(e=>e.type==='response.create').length,1,'no response overlaps ongoing speech');
  assert.equal(provider.sent.some(e=>e.type==='response.cancel'),false);
  provider.message({type:'response.done',response:{id:'r1',status:'completed'}});
  t.mock.timers.tick(2600);
  assert.equal(provider.sent.filter(e=>e.type==='response.create').length,2,'one short contextual turn after a quiet pause');
  client.close();
});
test('creative conversation crosses screen changes without automatic quiz monologues', t => {
  t.mock.timers.enable({apis:['setTimeout','Date']});
  const client=new Socket(),provider=new Socket();
  relayLive(client,()=>provider,liveSession,guide);
  client.message({type:'start',language:'en',action:'riddle',game:game('welcome')});provider.emit('open');provider.message({type:'session.updated'});
  assert.match(provider.sent.at(-2).item.content[0].text,/wait for their guess/);
  provider.message({type:'response.done',response:{status:'completed'}});
  client.message({type:'game',game:game('quiz',2,[0,1])});
  t.mock.timers.tick(10000);
  assert.equal(provider.sent.filter(e=>e.type==='response.create').length,1);
  assert.ok(provider.sent.at(-1).session.instructions.includes(questions[2].title));
  client.close();
});
test('barge-in clears playback and truncates only a known interrupted item at its played position', () => {
  const client=new Socket(),provider=new Socket();
  relayLive(client,()=>provider,liveSession,guide);
  client.message({type:'start',language:'en'});provider.emit('open');provider.message({type:'session.updated'});
  provider.message({type:'response.created',response:{id:'r1'}});
  const delta=Buffer.alloc(48000).toString('base64');
  provider.message({type:'response.output_audio.delta',item_id:'i1',content_index:0,delta});
  provider.message({type:'input_audio_buffer.speech_started'});
  assert.ok(client.sent.some(e=>e.type==='audio.clear'&&e.item_id==='i1'));
  client.message({type:'truncate',item_id:'i1',content_index:0,audio_end_ms:340});
  assert.deepEqual(provider.sent.at(-1),{type:'conversation.item.truncate',item_id:'i1',content_index:0,audio_end_ms:340});
  const outputs=client.sent.filter(e=>e.type==='session.output_audio.delta').length;
  provider.message({type:'response.output_audio.delta',item_id:'i1',content_index:0,delta});
  assert.equal(client.sent.filter(e=>e.type==='session.output_audio.delta').length,outputs,'late cancelled audio must not play');
  client.close();
});

test('explicit help has no idle debounce; every quiz screen follows actual playback in 350ms', t=>{
 t.mock.timers.enable({apis:['setTimeout','Date']});
 const c=new Socket(),p=new Socket();let connections=0;
 relayLive(c,()=>{connections++;return p;},liveSession,guide);
 c.message({type:'start',language:'ru',game:game('welcome')});p.emit('open');p.message({type:'session.updated'});
 p.message({type:'response.done',response:{status:'completed'}});
 c.message({type:'greet'});t.mock.timers.tick(0);
 assert.equal(p.sent.filter(e=>e.type==='response.create').length,2);
 for(let step=0;step<=questions.length;step++){
  c.message({type:'playback',busy:true});p.message({type:'response.done',response:{status:'completed'}});
  c.message({type:'game',game:step<questions.length?game('quiz',step,Array(step).fill(0)):game('result',4,Array(questions.length).fill(0),0)});
  const before=p.sent.filter(e=>e.type==='response.create').length;
  t.mock.timers.tick(1000);assert.equal(p.sent.filter(e=>e.type==='response.create').length,before);
  c.message({type:'playback',busy:false});t.mock.timers.tick(349);assert.equal(p.sent.filter(e=>e.type==='response.create').length,before);
  t.mock.timers.tick(1);assert.equal(p.sent.filter(e=>e.type==='response.create').length,before+1);
  assert.ok(p.sent.at(-1).response.instructions.includes(step<questions.length?questions[step].title:'Top three roles'));
 }
 assert.equal(connections,1);c.close();t.mock.timers.tick(10000);assert.equal(p.readyState,3);
});
test('speech wins over a pending observation and rapid touch changes keep only the latest screen', t=>{
 t.mock.timers.enable({apis:['setTimeout','Date']});const c=new Socket(),p=new Socket();relayLive(c,()=>p,liveSession,guide);
 c.message({type:'start',language:'en',game:game('welcome')});p.emit('open');p.message({type:'session.updated'});p.message({type:'response.done',response:{status:'completed'}});
 c.message({type:'game',game:game('quiz',0)});c.message({type:'game',game:game('quiz',1,[0])});t.mock.timers.tick(350);
 assert.ok(p.sent.at(-1).response.instructions.includes(questions[1].title));
 p.message({type:'response.done',response:{status:'completed'}});c.message({type:'game',game:game('quiz',2,[0,1])});p.message({type:'input_audio_buffer.speech_started'});
 const count=p.sent.filter(e=>e.type==='response.create').length;t.mock.timers.tick(5000);assert.equal(p.sent.filter(e=>e.type==='response.create').length,count);c.close();
});


test('visitor speech cancels a screen response whose provider ID has not arrived yet', t => {
 t.mock.timers.enable({apis:['setTimeout','Date']});const c=new Socket(),p=new Socket();
 relayLive(c,()=>p,liveSession,guide);
 c.message({type:'start',language:'ru',game:game('welcome')});p.emit('open');p.message({type:'session.updated'});
 p.message({type:'response.done',response:{status:'completed'}});
 c.message({type:'game',game:game()});t.mock.timers.tick(350);
 p.message({type:'input_audio_buffer.speech_started'});
 p.message({type:'response.created',response:{id:'late-screen'}});
 assert.ok(p.sent.some(e=>e.type==='response.cancel'&&e.response_id==='late-screen'));
 p.message({type:'response.output_audio.delta',response_id:'late-screen',item_id:'new-item',delta:'AAAAAA=='});
 p.message({type:'response.output_audio_transcript.delta',response_id:'late-screen',item_id:'new-item',delta:'obsolete'});
 assert.equal(c.sent.some(e=>e.type==='session.output_audio.delta'||e.type==='session.output_transcript.delta'),false);
 p.message({type:'response.done',response:{id:'late-screen',status:'cancelled'}});
 p.message({type:'input_audio_buffer.speech_stopped'});p.message({type:'response.created',response:{id:'answer'}});
 p.message({type:'response.output_audio.delta',response_id:'answer',item_id:'answer-item',delta:'AAAAAA=='});
 assert.equal(c.sent.at(-1).type,'session.output_audio.delta');c.close();
});

test('output-only narration cancels obsolete audio and narrates the current screen in the chosen language',t=>{
 t.mock.timers.enable({apis:['setTimeout','Date']});const client=new Socket(),provider=new Socket();
 relayLive(client,()=>provider,liveSession,guide);
 client.message({type:'start',language:'en',narration:true,voice:'marin',game:game('quiz',0)});provider.emit('open');provider.message({type:'session.updated'});
 assert.match(provider.sent[0].session.instructions,/Speak only English/);assert.ok(provider.sent[0].session.instructions.includes(questions[0].en));
 provider.message({type:'response.created',response:{id:'old'}});
 client.message({type:'game',game:game('quiz',1,[2])});assert.ok(provider.sent.some(x=>x.type==='response.cancel'&&x.response_id==='old'));
 assert.ok(client.sent.some(x=>x.type==='audio.clear'&&x.reason==='screen_change'));
 const n=client.sent.length;provider.message({type:'response.output_audio.delta',response_id:'old',item_id:'old-item',delta:'AAAAAA=='});assert.equal(client.sent.length,n);
 provider.message({type:'response.done',response:{id:'old',status:'cancelled'}});t.mock.timers.tick(400);
 assert.match(provider.sent.at(-1).response.instructions,/OUTPUT-ONLY/);assert.ok(provider.sent.at(-1).response.instructions.includes(questions[1].en));
 client.close();
});
