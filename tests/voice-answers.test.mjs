import test from 'node:test';
import assert from 'node:assert/strict';
import {matchSpokenAnswer} from '../lib/voice-answer-match.ts';
import {questions} from '../lib/quiz.ts';
import {taskPreviews,englishTaskPreviews} from '../lib/work-context.ts';

const candidates=(step,language)=>questions[step].options.map((option,index)=>({heading:(language==='en'?englishTaskPreviews:taskPreviews)[step][index].title,text:language==='en'?option.en:option.text}));
const pick=(said,step=0,language='ru')=>matchSpokenAnswer(said,candidates(step,language))?.index??null;

test('every answer heading and full answer text, read aloud, selects that answer in both languages',()=>{
 for(const language of ['ru','en'])questions.forEach((_,step)=>candidates(step,language).forEach((candidate,index)=>{
  assert.equal(pick(candidate.heading,step,language),index,`${language} q${step+1} heading ${candidate.heading}`);
  assert.equal(pick(candidate.text,step,language),index,`${language} q${step+1} text ${candidate.text}`);
 }));
});
test('everyday phrasings, inflections and recognition punctuation still select the intended answer',()=>{
 assert.equal(pick('Я бы посмотрел, где уходят покупатели.'),0);
 assert.equal(pick('Посмотрю на цены'),1);
 assert.equal(pick('Путь покупателя!'),0);
 assert.equal(pick('ну, наверное, работа оплаты'),3);
 assert.equal(pick('I would check whether the prices changed',0,'en'),1);
 assert.equal(pick('The payment one.',0,'en'),3);
 assert.equal(pick('Customer experience, I think',0,'en'),2);
});
test('an answer can be named by its position',()=>{
 for(const [said,index] of [['Второй',1],['номер три',2],['давайте последний',3],['первый вариант',0],['не первый, а второй',1],['Три.',2]])assert.equal(pick(said),index,said);
 for(const [said,index] of [['The second one',1],['number four',3],['Option two',1],['Three',2],['the last one',3]])assert.equal(pick(said,0,'en'),index,said);
});
test('unclear or unrelated speech selects nothing, so the visitor is asked again',()=>{
 for(const said of ['','...','Хм, дайте подумать','первый или второй?','Один мой знакомый работает в банке','Сколько это стоит?'])assert.equal(pick(said),null,said);
 for(const said of ['Hmm, let me think','first or second?','One of my friends works here','Where is the coffee?'])assert.equal(pick(said,0,'en'),null,said);
});

import {createVoiceAnswers} from '../lib/voice-answers-client.ts';
const tick=()=>new Promise(r=>setImmediate(r));
function listenFixture({token=async()=>'single-use',microphone}={}){
 const log={states:[],finals:[],partials:[],levels:[],sockets:[],tracks:[],contexts:[]};let clock=1000;
 const env={
  token,now:()=>clock,
  microphone:microphone||(async()=>{const track={stopped:false,stop(){this.stopped=true;}};log.tracks.push(track);return {getTracks:()=>[track]};}),
  context(){const c={state:'running',destination:{},closed:false,async resume(){},audioWorklet:{async addModule(){}},createMediaStreamSource:()=>({connect(){}}),createGain:()=>({gain:{value:1},connect(){}}),async close(){this.closed=true;}};log.contexts.push(c);return c;},
  node(){return log.node={port:{onmessage:null},connect(){},disconnect(){}};},
  socket(url){const s={url,readyState:1,sent:[],closed:false,send(m){this.sent.push(JSON.parse(m));},close(){this.closed=true;}};log.sockets.push(s);return s;},
 };
 const voice=createVoiceAnswers({onState:(s,e)=>log.states.push([s,e]),onFinal:t=>log.finals.push(t),onPartial:t=>log.partials.push(t),onLevel:l=>log.levels.push(l)},env);
 return {voice,log,advance:ms=>{clock+=ms;},audio:bytes=>log.node.port.onmessage({data:{type:'audio',buffer:new Uint8Array(bytes).buffer,level:.2}}),server:message=>log.sockets[0].onmessage({data:JSON.stringify(message)})};
}
test('spoken answers stream the microphone straight to realtime recognition with the chosen language and answer headings',async()=>{
 const f=listenFixture();await f.voice.start('en',['Customer journey','Payment reliability','The numbers behind it']);await tick();
 const url=new URL(f.log.sockets[0].url);
 assert.equal(url.origin+url.pathname,'wss://api.elevenlabs.io/v1/speech-to-text/realtime');
 assert.equal(url.searchParams.get('language_code'),'en');assert.equal(url.searchParams.get('token'),'single-use');assert.equal(url.searchParams.get('commit_strategy'),'vad');
 assert.deepEqual(url.searchParams.getAll('keyterms'),['Customer journey','Payment reliability']);
 f.log.sockets[0].onopen();assert.deepEqual(f.log.states.at(-1),['listening','']);
 f.audio([1,2,3,4]);const chunk=f.log.sockets[0].sent[0];
 assert.equal(chunk.message_type,'input_audio_chunk');assert.equal(chunk.sample_rate,16000);assert.deepEqual([...Buffer.from(chunk.audio_base_64,'base64')],[1,2,3,4]);
 f.server({message_type:'partial_transcript',text:'the payment'});f.server({message_type:'committed_transcript',text:' The payment one. '});f.server({message_type:'committed_transcript',text:'  '});
 assert.deepEqual(f.log.partials,['the payment']);assert.deepEqual(f.log.finals,['The payment one.']);
 f.voice.stop();
});
test('while Navi speaks and briefly after, silence is sent instead of the microphone',async()=>{
 const f=listenFixture();await f.voice.start('ru');await tick();f.log.sockets[0].onopen();
 f.voice.naviSpeaking(true);f.audio([9,9,9,9]);f.advance(500);f.audio([9,9,9,9]);f.advance(300);f.audio([7,7,7,7]);
 const sent=f.log.sockets[0].sent.map(m=>[...Buffer.from(m.audio_base_64,'base64')]);
 assert.deepEqual(sent,[[0,0,0,0],[0,0,0,0],[7,7,7,7]]);assert.deepEqual(f.log.levels.slice(0,2),[0,0]);f.voice.stop();
});
test('stopping releases the microphone, recognition and audio, and ignores late results',async()=>{
 const f=listenFixture();await f.voice.start('ru');await tick();f.log.sockets[0].onopen();
 const socket=f.log.sockets[0];f.voice.stop();
 assert.ok(f.log.tracks.every(t=>t.stopped));assert.equal(socket.closed,true);assert.equal(f.log.contexts[0].closed,true);assert.deepEqual(f.log.states.at(-1),['off','']);
 socket.onmessage?.({data:JSON.stringify({message_type:'committed_transcript',text:'второй'})});assert.deepEqual(f.log.finals,[]);
});
test('failures turn listening off with a reason and never reconnect on their own',async()=>{
 const exhausted=listenFixture();await exhausted.voice.start('ru');await tick();exhausted.server({message_type:'quota_exceeded',error:'PRIVATE'});
 assert.equal(exhausted.log.states.at(-1)[0],'error');assert.match(exhausted.log.states.at(-1)[1],/кредиты/);assert.ok(!exhausted.log.states.at(-1)[1].includes('PRIVATE'));assert.equal(exhausted.log.sockets.length,1);
 const dropped=listenFixture();await dropped.voice.start('en');await tick();dropped.log.sockets[0].onclose();assert.match(dropped.log.states.at(-1)[1],/disconnected/);assert.equal(dropped.log.sockets.length,1);
 const unconfigured=listenFixture({token:async()=>{throw Error('Распознавание речи не настроено.');}});await unconfigured.voice.start('ru');await tick();
 assert.deepEqual(unconfigured.log.states.at(-1),['error','Распознавание речи не настроено.']);assert.equal(unconfigured.log.sockets.length,0);assert.ok(unconfigured.log.tracks.every(t=>t.stopped));
 const denied=listenFixture({microphone:async()=>{throw new DOMException('no','NotAllowedError');}});await denied.voice.start('en');await tick();assert.match(denied.log.states.at(-1)[1],/Microphone access is blocked/);
});
