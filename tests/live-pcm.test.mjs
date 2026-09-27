import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createLiveVoice } from '../lib/live-pcm-client.ts';
import { relayLive } from '../lib/live-relay.ts';
import { liveSession } from '../lib/live.ts';

class Socket extends EventTarget {
  readyState = 1; bufferedAmount = 0; sent = []; closed = false;
  send(data) { this.sent.push(JSON.parse(data)); }
  message(event) { this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(event) })); }
  close() { if (this.closed) return; this.closed = true; this.readyState = 3; this.dispatchEvent(new Event('close')); }
}
class Track extends EventTarget { stopped = false; stop() { this.stopped = true; } }
function fixture(microphone) {
  const states = [], frames = [], sockets = [], nodes = [], contexts = [], tracks = [];
  const env = {
    context() {
      const ctx = new EventTarget(); Object.assign(ctx, { state: 'running', sampleRate: 24000, destination: {}, audioWorklet: { async addModule() {} },
        async resume() { this.state = 'running'; }, async close() { this.state = 'closed'; }, createMediaStreamSource() { return { connect() {}, disconnect() {} }; } }); contexts.push(ctx); return ctx;
    },
    node() { const n = { connected: false, connect() { this.connected = true; }, disconnect() { this.connected = false; }, port: { messages: [], postMessage(data) { this.messages.push(data); }, close() {} } }; nodes.push(n); return n; },
    microphone: microphone || (async () => { const track = new Track(); tracks.push(track); return { getTracks: () => [track] }; }),
    socket() { const s = new Socket(); sockets.push(s); return s; },
    fetch: async () => Response.json({ configured: true }),
  };
  const voice = createLiveVoice({ onState: s => states.push(s), onSpeech: s => frames.push(s) }, env);
  return { voice, states, frames, sockets, nodes, contexts, tracks };
}
test('PCM voice streams microphone, queues output, and closes capture immediately', async () => {
  const f = fixture(); await f.voice.start('ru'); const ws = f.sockets[0], node = f.nodes[0];
  ws.dispatchEvent(new Event('open')); assert.deepEqual(ws.sent[0], { type: 'start', language: 'ru' });
  const pcm = new Int16Array([1200, -500]);
  node.port.onmessage({ data: { type: 'input', buffer: pcm.buffer } }); assert.equal(ws.sent.length, 1);
  ws.message({ type: 'session.started' });
  node.port.onmessage({ data: { type: 'input', buffer: pcm.buffer } });
  assert.deepEqual([...Buffer.from(ws.sent.at(-1).audio, 'base64')], [...new Uint8Array(pcm.buffer)]);
  ws.message({ type: 'session.output_audio.delta', delta: Buffer.from(pcm.buffer).toString('base64') });
  assert.deepEqual([...new Int16Array(node.port.messages.at(-1).buffer)], [...pcm]);
  node.port.onmessage({ data: { type: 'level', level: .1 } }); assert.equal(f.frames.at(-1).speaking, true);
  f.voice.stop(); assert.equal(f.tracks[0].stopped, true); assert.equal(node.connected, false); assert.equal(f.frames.at(-1).speaking, false);
  assert.equal(ws.sent.at(-1).type, 'close'); ws.message({ type: 'session.closed' });
  assert.equal(f.contexts[0].state, 'closed'); assert.equal(f.states.at(-1).phase, 'idle'); f.voice.dispose();
});
test('cancelled microphone prompt cannot create a late voice session', async () => {
  let grant; const track = new Track();
  const f = fixture(() => new Promise(resolve => { grant = resolve; }));
  const pending = f.voice.start('en'); await new Promise(resolve => setImmediate(resolve));
  f.voice.stop(); grant({ getTracks: () => [track] }); await pending;
  assert.equal(track.stopped, true); assert.equal(f.sockets.length, 0); f.voice.dispose();
});
test('output PCM is cleared and microphone is released on provider error', async () => {
  const f = fixture(); await f.voice.start('ru'); const ws = f.sockets[0];
  ws.message({ type: 'session.started' }); ws.message({ type: 'error', error: { code: 'quota' } });
  assert.equal(f.tracks[0].stopped, true); assert.equal(f.nodes[0].port.messages.at(-1).type, 'clear');
  ws.message({ type: 'session.closed' }); assert.equal(f.states.at(-1).phase, 'error'); f.voice.dispose();
});
test('real audio worklet plays signed PCM, captures mono frames and clears its queue', () => {
  let Processor;
  const sandbox = { AudioWorkletProcessor: class { constructor() { this.port = { sent: [], postMessage(data) { this.sent.push(data); } }; } },
    registerProcessor: (_name, cls) => { Processor = cls; }, Int16Array, Math };
  vm.runInNewContext(readFileSync(new URL('../public/audio/live-pcm-worklet.js', import.meta.url), 'utf8'), sandbox);
  const p = new Processor(); p.port.onmessage({ data: { type: 'audio', buffer: new Int16Array([16384, -16384]).buffer } });
  const output = new Float32Array(128); p.process([[new Float32Array(128).fill(.25)]], [[output]]);
  assert.equal(output[0], .5); assert.equal(output[1], -.5); assert.equal(output[2], 0);
  for (let i = 0; i < 19; i++) p.process([[new Float32Array(128).fill(.25)]], [[output]]);
  const captured = new Int16Array(p.port.sent.find(e => e.type === 'input').buffer); assert.equal(captured.length, 480); assert.equal(captured[0], 8192);
  p.port.onmessage({ data: { type: 'audio', buffer: new Int16Array([32767]).buffer } });
  p.port.onmessage({ data: { type: 'clear' } }); p.process([[]], [[output]]); assert.equal(output[0], 0);
});
class RelaySocket extends EventEmitter {
  readyState = 1; bufferedAmount = 0; sent = [];
  send(data) { this.sent.push(JSON.parse(data)); }
  close() { if (this.readyState === 3) return; this.readyState = 3; this.emit('close'); }
  message(data) { this.emit('message', Buffer.from(JSON.stringify(data)), false); }
}
test('local relay fixes model and format, relays real audio events and finalizes on disconnect', () => {
  const client = new RelaySocket(), upstream = new RelaySocket(); let connects = 0;
  relayLive(client, () => { connects++; return upstream; }, liveSession);
  client.message({ type: 'start', language: 'ru', model: 'injected' }); upstream.emit('open');
  assert.equal(upstream.sent[0].session.model, 'gpt-realtime-1.5'); assert.deepEqual(upstream.sent[0].session.audio.input.format, { type: 'audio/pcm', rate: 24000 });
  upstream.message({ type: 'session.updated', session: { instructions: 'private configuration' } });
  assert.deepEqual(client.sent[0], { type: 'session.started' }); assert.equal(upstream.sent[1].type, 'conversation.item.create');
  client.message({ type: 'audio', audio: 'AAAAAA==' }); assert.equal(upstream.sent.at(-1).type, 'input_audio_buffer.append');
  upstream.message({ type: 'response.output_audio.delta', item_id: 'item1', content_index: 0, delta: 'AAAAAA==' }); assert.equal(client.sent.at(-1).delta, 'AAAAAA==');
  client.close(); assert.equal(upstream.readyState, 3);
  upstream.message({ type: 'session.closed' }); assert.equal(upstream.readyState, 3); assert.equal(connects, 1);
});
test('untrusted client cannot send arbitrary model instructions through relay', () => {
  const client = new RelaySocket(); let connects = 0;
  relayLive(client, () => { connects++; return new RelaySocket(); }, liveSession);
  client.message({ type: 'session.start', session: { model: 'wrong' } });
  assert.equal(connects, 0); assert.equal(client.sent[0].error.code, 'invalid_command'); assert.equal(client.readyState, 3);
});
test('game changes preserve the socket and ongoing speech, and seed mid-game starts', async () => {
  const f = fixture(); const first = { phase: 'quiz', step: 1, answers: [2], selected: null, interest: '' };
  f.voice.updateGame(first); await f.voice.start('ru'); const ws = f.sockets[0];
  ws.dispatchEvent(new Event('open')); assert.deepEqual(ws.sent[0].game, first);
  ws.message({ type: 'session.started' });
  const next = { ...first, step: 2, answers: [2, 1] }; f.voice.updateGame(next);
  assert.deepEqual(ws.sent.at(-1), { type: 'game', game: next }); assert.equal(f.nodes[0].port.messages.some(e=>e.type==='clear'), false);
  assert.equal(f.tracks[0].stopped, false); assert.equal(f.sockets.length, 1);
  const count = ws.sent.length; f.voice.updateGame(next); assert.equal(ws.sent.length, count);
  f.voice.stop(); ws.message({ type: 'session.closed' }); f.voice.dispose();
});
test('Realtime bursts preserve the start of a sentence and interrupt at the played sample', () => {
  let Processor;
  vm.runInNewContext(readFileSync(new URL('../public/audio/live-pcm-worklet.js', import.meta.url), 'utf8'), {
    AudioWorkletProcessor: class { constructor() { this.port = { sent: [], postMessage(e) { this.sent.push(e); } }; } },
    registerProcessor: (_name, cls) => { Processor = cls; }, Int16Array, Math,
  });
  const p = new Processor();
  for (let i = 0; i < 10; i++) p.port.onmessage({ data: { type: 'audio', item_id: 'i1', buffer: new Int16Array(2400).fill((i+1) * 1000).buffer } });
  assert.equal(p.queued, 24000);
  const out = new Float32Array(128); p.process([[]], [[out]]);
  assert.equal(out[0], 1000 / 32768);
  p.port.onmessage({data:{type:'interrupt',item_id:'i1',content_index:0}});
  assert.equal(p.queued,0);
  const truncation=p.port.sent.find(e=>e.type==='truncated');
  assert.equal(truncation.audio_end_ms,5);
  p.process([[]],[[out]]);assert.equal(out[0],0);
});
test('demo revisions clear queued speech and reject old audio before the relay acknowledges the change',async()=>{
  const f=fixture(),initial={kind:'hiring',phase:'case',choice:null,revision:0,language:'en'};
  f.voice.updateDemo(initial);await f.voice.start('en');const old=f.sockets[0],node=f.nodes[0];old.dispatchEvent(new Event('open'));
  assert.deepEqual(old.sent[0].demo,initial);assert.equal(old.sent[0].game,undefined);old.message({type:'session.started'});
  const pcm=Buffer.from(new Int16Array([1000]).buffer).toString('base64');
  old.message({type:'session.output_audio.delta',delta:pcm,demo_revision:0,demo_phase:'case'});
  f.voice.updateDemo({...initial,phase:'result',choice:'week',revision:1});assert.equal(node.port.messages.at(-1).type,'clear');
  const count=node.port.messages.length;old.message({type:'session.output_audio.delta',delta:pcm,demo_revision:0,demo_phase:'case'});assert.equal(node.port.messages.length,count);
  old.message({type:'session.output_audio.delta',delta:pcm,demo_revision:1,demo_phase:'result'});assert.equal(node.port.messages.at(-1).type,'audio');
  f.voice.stop();old.message({type:'session.closed'});f.voice.updateDemo(initial);await f.voice.start('en');
  const fresh=f.nodes[1];old.message({type:'session.output_audio.delta',delta:pcm,demo_revision:0,demo_phase:'case'});assert.equal(fresh.port.messages.length,0);
  f.voice.stop();f.sockets[1].message({type:'session.closed'});f.voice.dispose();
});

test('narration opens output without requesting a microphone or sending even synthetic input', async () => {
 let captures=0;const f=fixture(async()=>{captures++;throw Error('Microphone must never be requested');});
 await f.voice.start('en',undefined,{narration:true,voice:'cedar'});const ws=f.sockets[0],node=f.nodes[0];
 assert.equal(captures,0);assert.equal(f.tracks.length,0);assert.equal(node.connected,true);
 ws.dispatchEvent(new Event('open'));assert.deepEqual(ws.sent[0],{type:'start',language:'en',narration:true,voice:'cedar'});
 ws.message({type:'session.started'});node.port.onmessage({data:{type:'input',buffer:new Int16Array([2000]).buffer}});
 assert.equal(ws.sent.some(x=>x.type==='audio'),false);
 ws.message({type:'session.output_audio.delta',delta:Buffer.from(new Int16Array([1000]).buffer).toString('base64')});
 assert.equal(node.port.messages.at(-1).type,'audio');node.port.onmessage({data:{type:'level',level:.1}});assert.equal(f.frames.at(-1).speaking,true);
 f.voice.updateGame({phase:'quiz',step:1,answers:[2],selected:null,interest:''});assert.equal(node.port.messages.at(-1).type,'clear');assert.equal(f.frames.at(-1).speaking,false);
 f.voice.stop();ws.message({type:'session.closed'});assert.equal(f.contexts[0].state,'closed');f.voice.dispose();
});
test('narration session fixes selected voice and language, disables VAD, and rejects audio input',()=>{
 const client=new RelaySocket(),provider=new RelaySocket();
 relayLive(client,()=>provider,liveSession);client.message({type:'start',language:'en',narration:true,voice:'cedar'});provider.emit('open');
 const session=provider.sent[0].session;assert.equal(session.audio.output.voice,'cedar');assert.equal(session.audio.input.turn_detection,null);
 assert.match(session.instructions,/Speak only English/);assert.match(session.instructions,/no microphone/);
 provider.message({type:'session.updated'});client.message({type:'audio',audio:'AAAAAA=='});
 assert.equal(provider.sent.some(x=>x.type==='input_audio_buffer.append'),false);assert.ok(client.sent.some(x=>x.error?.code==='audio_input_disabled'));
});
test('invalid voice is rejected before a paid provider connection',()=>{
 const client=new RelaySocket();let connections=0;relayLive(client,()=>{connections++;return new RelaySocket();},liveSession);
 client.message({type:'start',language:'ru',narration:true,voice:'invented'});assert.equal(connections,0);assert.ok(client.sent.some(x=>x.error?.code==='invalid_voice'));
});
