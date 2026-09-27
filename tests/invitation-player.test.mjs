import assert from 'node:assert/strict';
import test from 'node:test';
import { createInvitationPlayer } from '../lib/invitation-player.ts';

const clip = { id: 'hello', language: 'ru', text: 'Привет.', src: '/audio/hello.mp3', voice: 'Navi' };
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
function harness({ withContext = true } = {}) {
  const frames = new Map(), speech = [], states = [], attempts = [];
  let nextFrame = 0;
  const analyser = { fftSize: 256, sample: 144, connect() {}, disconnects: 0,
    disconnect() { this.disconnects++; }, getByteTimeDomainData(data) { data.fill(this.sample); } };
  const input = { connect() {}, disconnects: 0, disconnect() { this.disconnects++; } };
  const context = { destination: {}, resumes: 0, closes: 0, sources: 0,
    createAnalyser: () => analyser,
    createMediaElementSource() { this.sources++; return input; },
    resume() { this.resumes++; return Promise.resolve(); },
    close() { this.closes++; return Promise.resolve(); } };
  const audio = { paused: true, ended: false, currentTime: 0, src: '',
    play() { this.paused = false; this.ended = false; const attempt = deferred(); attempts.push(attempt); return attempt.promise; },
    pause() { const wasPlaying = !this.paused; this.paused = true; if (wasPlaying) this.onpause?.(); },
    emit(type) {
      if (type === 'playing') { this.paused = false; this.ended = false; }
      if (type === 'ended') { this.ended = true; this.paused = true; }
      if (type === 'pause') this.paused = true;
      this[`on${type}`]?.();
    } };
  const player = createInvitationPlayer({ onSpeech: value => speech.push(value), onState: value => states.push(value) }, {
    createAudio: () => audio, createContext: () => withContext ? context : null,
    requestFrame(callback) { frames.set(++nextFrame, callback); return nextFrame; },
    cancelFrame(id) { frames.delete(id); },
  });
  return { player, audio, context, analyser, input, attempts, speech, states, frames,
    tick(time) { const callbacks = [...frames.values()]; frames.clear(); for (const callback of callbacks) callback(time); } };
}

test('play is synchronous; waiting retains busy and pauses the mouth; resuming and ending update both', async () => {
  const h = harness(); const result = h.player.play(clip);
  assert.equal(h.attempts.length, 1, 'play must stay inside the browser gesture');
  assert.equal(h.context.resumes, 1);
  assert.equal(h.audio.src, clip.src);
  assert.deepEqual(h.player.getState(), { playing: false, busy: true, error: '' });
  h.audio.emit('playing'); h.attempts[0].resolve();
  assert.equal(await result, 'started'); h.tick(100);
  assert.deepEqual(h.speech.at(-1), { speaking: true, level: .875 });
  h.audio.emit('waiting');
  assert.deepEqual(h.player.getState(), { playing: false, busy: true, error: '' });
  assert.deepEqual(h.speech.at(-1), { speaking: false, level: 0 });
  assert.equal(h.frames.size, 0);
  h.audio.emit('playing'); h.tick(200);
  assert.equal(h.player.getState().playing, true);
  h.audio.emit('ended');
  assert.deepEqual(h.player.getState(), { playing: false, busy: false, error: '' });
  assert.deepEqual(h.speech.at(-1), { speaking: false, level: 0 });
  assert.equal(h.frames.size, 0); h.player.dispose();
});

test('stop cancels a stalled request promptly without reporting an error', async () => {
  const h = harness(); const pending = h.player.play(clip);
  h.player.stop(); assert.equal(await pending, 'cancelled');
  h.attempts[0].reject(new DOMException('Interrupted', 'AbortError'));
  await Promise.resolve(); await Promise.resolve();
  assert.deepEqual(h.player.getState(), { playing: false, busy: false, error: '' });
  h.player.dispose();
});

test('superseded request cannot fail the new playback or its voice preference', async () => {
  const h = harness(); let sound = true;
  const rememberFailure = result => { if (result === 'failed') sound = false; return result; };
  const first = h.player.play(clip).then(rememberFailure);
  const second = h.player.play({ ...clip, src: '/audio/second.mp3' }).then(rememberFailure);
  assert.equal(await first, 'cancelled');
  h.audio.onpause?.(); h.audio.onended?.(); // Queued events from the old source.
  assert.equal(h.player.getState().busy, true);
  h.attempts[0].reject(new Error('Old request failed'));
  h.audio.emit('playing'); h.attempts[1].resolve();
  assert.equal(await second, 'started'); assert.equal(sound, true);
  assert.deepEqual(h.player.getState(), { playing: true, busy: true, error: '' });
  assert.equal(h.context.sources, 1, 'reuse the unlocked audio graph'); h.player.dispose();
});

test('actual media and audio-context failures return failed with useful errors', async () => {
  for (const name of ['NotAllowedError', 'NotSupportedError', 'context']) {
    const h = harness();
    if (name === 'context') h.context.resume = () => Promise.reject(new Error('Audio device unavailable'));
    const pending = h.player.play(clip);
    if (name === 'context') h.attempts[0].resolve();
    else h.attempts[0].reject(new DOMException('Cannot play', name));
    assert.equal(await pending, 'failed');
    assert.equal(h.player.getState().busy, false); assert.equal(h.player.getState().playing, false);
    assert.match(h.player.getState().error, name === 'NotAllowedError' ? /разрешить звук/ : /аудиофайл/);
    assert.deepEqual(h.speech.at(-1), { speaking: false, level: 0 }); h.player.dispose();
  }
});

test('media error after playback starts closes mouth activity and reports failure', async () => {
  const h = harness(); const pending = h.player.play(clip);
  h.audio.emit('playing'); h.attempts[0].resolve(); await pending;
  h.audio.emit('error');
  assert.equal(h.player.getState().busy, false); assert.ok(h.player.getState().error);
  assert.equal(h.frames.size, 0);
  assert.deepEqual(h.speech.at(-1), { speaking: false, level: 0 }); h.player.dispose();
});

test('prepared envelope drives the mouth without Web Audio; pause clears speech', async () => {
  const h = harness({ withContext: false });
  const pending = h.player.play({ ...clip, envelope: [.1, .6, .2] });
  h.audio.currentTime = .05; h.audio.emit('playing'); h.attempts[0].resolve(); await pending; h.tick(100);
  assert.deepEqual(h.speech.at(-1), { speaking: true, level: .6 });
  h.audio.emit('pause');
  assert.deepEqual(h.player.getState(), { playing: false, busy: false, error: '' }); h.player.dispose();
});

test('dispose cancels pending playback, releases resources once, and ignores late results', async () => {
  const h = harness(); const pending = h.player.play(clip);
  h.audio.emit('playing'); h.tick(100); const stateCount = h.states.length;
  h.player.dispose(); h.player.dispose(); assert.equal(await pending, 'cancelled');
  h.attempts[0].resolve(); await Promise.resolve(); await Promise.resolve();
  assert.equal(h.states.length, stateCount, 'no React state updates after unmount');
  assert.equal(h.context.closes, 1); assert.equal(h.input.disconnects, 1); assert.equal(h.analyser.disconnects, 1);
  assert.equal(h.audio.onplaying, null); assert.equal(h.audio.paused, true); assert.equal(h.frames.size, 0);
  assert.deepEqual(h.speech.at(-1), { speaking: false, level: 0 });
  assert.equal(await h.player.play(clip), 'cancelled'); assert.equal(h.attempts.length, 1);
});
