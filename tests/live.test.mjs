import test from 'node:test';
import assert from 'node:assert/strict';
import { handleLive, liveSession } from '../lib/live.ts';
import { createLiveVoice } from '../lib/live-client.ts';

const request = (body = { sdp: 'v=0\r\no=offer', language: 'ru' }, origin = 'http://localhost:5173') => new Request('http://localhost:5173/api/live', { method: 'POST', headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
test('readiness exposes the active model but never the credential', async () => {
  const ready = await handleLive(new Request('http://localhost:5173/api/live'), 'test-secret');
  assert.deepEqual(await ready.json(), { configured: true, model: 'gpt-realtime-1.5' });
  assert.equal((await handleLive(new Request('https://example.com/api/live'), 'key')).status, 403);
  assert.equal((await handleLive(request(undefined, 'https://evil.example'), 'key')).status, 403);
  assert.equal((await handleLive(request(), 'key')).status, 410, 'the silent legacy WebRTC endpoint is retired');
});
test('Realtime config keeps the primary demo Russian across screen updates', () => {
  const session = liveSession('en');
  assert.equal(session.type, 'realtime'); assert.equal(session.model, 'gpt-realtime-1.5');
  assert.equal(Object.hasOwn(session, 'reasoning'), false, 'previous-generation voice model must not receive reasoning configuration');
  assert.equal(session.audio.input.turn_detection.interrupt_response, true);
  assert.match(session.instructions, /entirely in Russian/); assert.match(session.instructions, /Preserve Russian across/);
  assert.match(session.instructions, /riddle/); assert.match(session.instructions, /not a validated personality/);
});

class Channel extends EventTarget {
  readyState = 'open'; sent = []; closed = false;
  send(data) { this.sent.push(JSON.parse(data)); }
  message(event) { this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(event) })); }
  close() { this.closed = true; this.dispatchEvent(new Event('close')); }
}
class Track extends EventTarget { kind = 'audio'; stopped = false; stop() { this.stopped = true; } }
class Peer extends EventTarget {
  channel = new Channel(); iceGatheringState = 'complete'; connectionState = 'connected'; closed = false;
  createDataChannel(label) { assert.equal(label, 'oai-events'); return this.channel; }
  addTrack() {} async createOffer() { return { type: 'offer', sdp: 'v=0\r\no=offer' }; }
  async setLocalDescription(offer) { this.localDescription = offer; }
  async setRemoteDescription(answer) { this.answer = answer; }
  close() { this.closed = true; }
}
function fixture({ microphone, fetch: fetchOverride } = {}) {
  const peers = [], tracks = [], states = [], captions = [], frames = [], contexts = [], requests = [], audios = [];
  let level = 128;
  const fake = {
    peer: () => { const p = new Peer(); peers.push(p); return p; },
    microphone: microphone || (async () => { const t = new Track(); tracks.push(t); return { getTracks: () => [t] }; }),
    audio: () => {
      const audio = new EventTarget(); Object.assign(audio, { paused: true, muted: false, srcObject: null, removed: false, block: false, plays: 0,
        async play() { this.plays++; if (this.block) throw new DOMException('Blocked', 'NotAllowedError'); this.paused = false; },
        pause() { this.paused = true; }, remove() { this.removed = true; } });
      audios.push(audio); return audio;
    },
    context: () => {
      const ctx = { closed: false, destination: {}, resume: async () => {}, close: async () => { ctx.closed = true; },
        createMediaStreamSource: () => ({ connect() {}, disconnect() {} }),
        createGain: () => ({ gain: { value: 1 }, connect() {}, disconnect() {} }),
        createAnalyser: () => ({ fftSize: 256, connect() {}, disconnect() {}, getByteTimeDomainData: samples => samples.fill(level) }) };
      contexts.push(ctx); return ctx;
    },
    fetch: async (url, options) => { requests.push(options); return fetchOverride ? fetchOverride(url, options) : Response.json(options?.method === 'POST' ? { transport: { sdp: 'v=0\r\nanswer' } } : { configured: true }); },
  };
  const voice = createLiveVoice({ onState: state => states.push(state), onCaption: text => captions.push(text), onSpeech: frame => frames.push(frame) }, fake);
  return { voice, peers, tracks, audios, states, captions, frames, contexts, requests, setLevel: n => { level = n; } };
}
const flush = () => new Promise(resolve => setImmediate(resolve));
test('no commands before started; live greeting, captions, delegation and graceful close', async () => {
  const f = fixture(); await f.voice.start('ru');
  const p = f.peers[0], ch = p.channel;
  assert.equal(ch.sent.length, 0); assert.equal(f.requests.length, 2);
  ch.message({ type: 'session.started' });
  assert.equal(f.states.at(-1).phase, 'ready');
  assert.equal(ch.sent[0].type, 'session.instructions.append');
  ch.message({ type: 'session.instructions.appended', client_event_id: ch.sent[0].event_id });
  ch.message({ type: 'session.output_transcript.delta', delta: 'Привет' });
  ch.message({ type: 'session.output_transcript.delta', delta: ', гость!' });
  assert.equal(f.captions.at(-1), 'Привет, гость!');
  ch.message({ type: 'session.delegation.created', delegation: { id: 'd1' } });
  ch.message({ type: 'session.delegation.created', delegation: { id: 'd1' } });
  assert.equal(ch.sent.filter(e => e.type === 'session.commentary.append').length, 1);
  f.voice.stop();
  assert.equal(ch.sent.at(-1).type, 'session.close'); assert.equal(f.tracks[0].stopped, true);
  assert.equal(p.closed, false); assert.equal(f.frames.at(-1).speaking, false);
  ch.message({ type: 'session.closed' });
  assert.equal(p.closed, true); assert.equal(f.contexts[0].closed, true); assert.equal(f.states.at(-1).phase, 'idle');
  f.voice.dispose();
});
test('permission cancelled mid-flight stops late microphone and makes no paid request', async () => {
  let grant; const track = new Track();
  const f = fixture({ microphone: () => new Promise(resolve => { grant = resolve; }) });
  const pending = f.voice.start('en'); await flush();
  f.voice.stop(); grant({ getTracks: () => [track] }); await pending;
  assert.equal(track.stopped, true); assert.equal(f.requests.length, 1); assert.equal(f.peers[0].closed, true);
  f.voice.dispose();
});
test('missing configuration never asks for microphone', async () => {
  const f = fixture({ microphone: () => { throw Error('should never ask'); }, fetch: async () => Response.json({ configured: false }) });
  await f.voice.start('ru'); assert.equal(f.states.at(-1).phase, 'error'); assert.match(f.states.at(-1).error, /ключ/); assert.equal(f.requests.length, 1); assert.equal(f.contexts[0].closed, true); f.voice.dispose();
});
test('connection failure releases microphone and duplicate starts do not create sessions', async () => {
  const f = fixture(); const first = f.voice.start('en'); await f.voice.start('en'); await first;
  assert.equal(f.peers.length, 1);
  f.peers[0].connectionState = 'failed'; f.peers[0].dispatchEvent(new Event('connectionstatechange'));
  assert.equal(f.tracks[0].stopped, true); assert.equal(f.states.at(-1).phase, 'error');
  await f.voice.start('ru'); assert.equal(f.peers.length, 2);
  f.peers[0].channel.message({ type: 'session.started' }); assert.equal(f.peers[1].channel.sent.length, 0);
  f.voice.dispose();
});
test('mouth follows actual remote stream levels and closes on silence and shutdown', async () => {
  const original = globalThis.MediaStream; globalThis.MediaStream = class { constructor(tracks) { this.tracks = tracks; } };
  const f = fixture();
  try {
    await f.voice.start('ru'); const event = new Event('track'); event.track = new Track();
    f.peers[0].dispatchEvent(event); f.setLevel(150);
    await new Promise(resolve => setTimeout(resolve, 65)); assert.equal(f.frames.at(-1).speaking, true); assert.ok(f.frames.at(-1).level > 0);
    f.setLevel(128); await new Promise(resolve => setTimeout(resolve, 65)); assert.equal(f.frames.at(-1).speaking, false);
    f.voice.stop(); assert.equal(f.frames.at(-1).level, 0);
  } finally { f.voice.dispose(); globalThis.MediaStream = original; }
});
test('session limit stops capture and requests graceful completion', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const f = fixture(); await f.voice.start('ru'); const ch = f.peers[0].channel;
  ch.message({ type: 'session.started' });
  ch.message({ type: 'session.instructions.appended', client_event_id: ch.sent[0].event_id });
  t.mock.timers.tick(120000);
  assert.equal(f.tracks[0].stopped, true); assert.equal(ch.sent.at(-1).type, 'session.close');
  assert.equal(f.states.at(-1).phase, 'closing');
  ch.message({ type: 'session.closed' }); assert.equal(f.states.at(-1).phase, 'idle'); f.voice.dispose();
});
test('unacknowledged greeting ends session, preserving error through finalization', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const f = fixture(); await f.voice.start('ru'); const ch = f.peers[0].channel;
  ch.message({ type: 'session.started' }); t.mock.timers.tick(12000);
  assert.equal(f.tracks[0].stopped, true); assert.equal(ch.sent.at(-1).type, 'session.close');
  ch.message({ type: 'session.closed' }); assert.equal(f.states.at(-1).phase, 'error');
  assert.match(f.states.at(-1).error, /не ответил/); f.voice.dispose();
});
test('local diagnostics retain only bounded connection metadata', async () => {
  const { liveDiagnostics } = await import('../lib/live-diagnostics.ts');
  const post = (body, origin = 'http://localhost:5173') => new Request('http://localhost:5173/api/live/diagnostics', { method: 'POST', headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  assert.equal((await liveDiagnostics(post({ event: 'audio.track', details: { context: 'running', muted: true, transcript: 'private words', sdp: 'secret offer', key: 'secret key' } }))).status, 204);
  const entries = await (await liveDiagnostics(new Request('http://localhost:5173/api/live/diagnostics'))).json();
  assert.deepEqual(entries.at(-1).details, { context: 'running', muted: true });
  assert.equal((await liveDiagnostics(post({ event: 'x' }, 'https://example.com'))).status, 403);
  assert.equal((await liveDiagnostics(new Request('https://example.com/api/live/diagnostics'))).status, 403);
});
test('native audio player handles blocked playback and recovers within the same session', async () => {
  const f = fixture(); await f.voice.start('ru');
  const audio = f.audios[0]; audio.block = true;
  const stream = {}; const event = new Event('track'); event.track = new Track(); event.streams = [stream];
  f.peers[0].dispatchEvent(event); await flush();
  assert.equal(audio.srcObject, stream);
  assert.equal(f.states.at(-1).playbackBlocked, true);
  assert.equal(f.tracks[0].stopped, false);
  const requestsBefore = f.requests.length;
  audio.block = false; f.voice.resumePlayback(); await flush();
  assert.equal(audio.paused, false); assert.equal(f.states.at(-1).playbackBlocked, false);
  assert.equal(f.requests.length, requestsBefore, 'resuming sound must not create another billed session');
  f.voice.stop(); assert.equal(audio.paused, true); assert.equal(audio.srcObject, null); assert.equal(audio.removed, true);
  f.voice.dispose();
});
test('analyser failure cannot prevent native audio playback', async () => {
  const f = fixture(); await f.voice.start('ru');
  f.contexts[0].createAnalyser = () => { throw Error('Unavailable analyser'); };
  const event = new Event('track'); event.track = new Track(); event.streams = [{}];
  f.peers[0].dispatchEvent(event); await flush();
  assert.equal(f.audios[0].paused, false); assert.equal(f.states.at(-1).phase, 'connecting');
  assert.equal(f.tracks[0].stopped, false); f.voice.dispose();
});
test('late playback completion after cancellation remains silent', async () => {
  const f = fixture(); await f.voice.start('ru'); let complete;
  f.audios[0].play = () => new Promise(resolve => { complete = () => { f.audios[0].paused = false; resolve(); }; });
  const event = new Event('track'); event.track = new Track(); event.streams = [{}];
  f.peers[0].dispatchEvent(event); f.voice.stop(); complete(); await flush();
  assert.equal(f.audios[0].paused, true); assert.equal(f.audios[0].srcObject, null); f.voice.dispose();
});
test('mouth uses decoded stream levels when embedded browser analyser is silent', async () => {
  const f = fixture(); await f.voice.start('ru');
  let audioLevel = .12;
  f.peers[0].getStats = async () => new Map([['audio', { type: 'inbound-rtp', kind: 'audio', audioLevel }]]);
  const event = new Event('track'); event.track = new Track(); event.streams = [{}];
  f.peers[0].dispatchEvent(event);
  try {
    await new Promise(resolve => setTimeout(resolve, 220));
    assert.equal(f.frames.at(-1).speaking, true);
    audioLevel = 0;
    await new Promise(resolve => setTimeout(resolve, 220));
    assert.equal(f.frames.at(-1).speaking, false);
  } finally { f.voice.dispose(); }
});

test('only Russian and English are available; stale language starts safely in Russian',()=>{
 for(const value of ['tg','invalid',undefined,null])assert.match(liveSession(value).instructions,/Start in Russian/);
 assert.match(liveSession('en').instructions,/Start in Russian/);assert.match(liveSession('en','hiring').instructions,/Start in English/);
 for(const language of ['ru','en'])assert.match(liveSession(language).instructions,/entirely in Russian/);
});
