import test from 'node:test';
import assert from 'node:assert/strict';
import { follow } from '../lib/navi-direction.ts';
import { PACE_SCALES, chooseQuality, createGovernor, liteDevice } from '../lib/navi-quality.ts';

const settle = (dt, seconds = 3, from = 0, to = 500) => {
  let x = from, v = 0, most = -Infinity, least = Infinity;
  for (let t = 0; t < seconds; t += dt) { ({ x, v } = follow(x, v, to, 3.2, dt)); most = Math.max(most, x); least = Math.min(least, x); }
  return { x, v, most, least };
};

test('the seat spring reaches its seat without overshoot at any frame rate, including the long frames of a slow device', () => {
  for (const dt of [1 / 120, 1 / 60, 1 / 30, 1 / 20, .05, .1, .25, 1]) {
    const { x, most, least } = settle(dt);
    assert.ok(Number.isFinite(x), `non-finite at ${dt}s`);
    assert.ok(most <= 500 + 1e-6 && least >= -1e-6, `overshoot at ${dt}s: ${least}..${most}`);
    assert.ok(Math.abs(x - 500) < 1, `did not settle at ${dt}s`);
  }
});

test('the seat spring moves the same way whether frames are short or long', () => {
  const fine = settle(1 / 120, .4), coarse = settle(.1, .4);
  assert.ok(Math.abs(fine.x - coarse.x) < 1, `${fine.x} vs ${coarse.x}`);
});

test('the seat spring shrugs off a non-finite input instead of carrying it', () => {
  assert.deepEqual(follow(NaN, 0, 10, 3.2, 1 / 60), { x: 10, v: 0 });
});

test('low-power devices get the lite tier; an operator override wins', () => {
  const booth = { ua: 'Mozilla/5.0 (Linux; Android 12; rk3566) Chrome/140', cores: 4, memory: 2, gpu: 'Mali-G52' };
  const desk = { ua: 'Mozilla/5.0 (Macintosh) Chrome/140', cores: 12, memory: 8, gpu: 'ANGLE (Apple, ANGLE Metal Renderer: Apple M3)' };
  assert.equal(liteDevice(booth), true);
  assert.equal(liteDevice({ ...desk, gpu: 'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device))' }), true);
  assert.equal(liteDevice(desk), false);
  assert.equal(chooseQuality(null, booth), 'lite');
  assert.equal(chooseQuality('full', booth), 'full');
  assert.equal(chooseQuality('lite', desk), 'lite');
});

const run = (governor, ms, frames) => { let changes = 0; for (let i = 0; i < frames; i++) if (governor.sample(ms)) changes++; return changes; };

test('a device that holds its refresh rate keeps full resolution', () => {
  const governor = createGovernor();
  run(governor, 16.7, 2000);
  assert.deepEqual(governor.pace, { level: 0, scale: 1, half: false });
});

test('sustained missed frames step resolution down, then halve the frame rate', () => {
  const governor = createGovernor();
  run(governor, 16.7, 120); // learn the refresh interval
  run(governor, 33.4, 2000);
  assert.equal(governor.pace.half, true);
  assert.equal(governor.pace.scale, PACE_SCALES.at(-1));
});

test('a single hitch or a paused tab does not lower quality', () => {
  const governor = createGovernor();
  for (let i = 0; i < 600; i++) governor.sample(i % 90 === 0 ? 120 : 16.7);
  governor.sample(4000); governor.sample(NaN);
  assert.equal(governor.pace.level, 0);
});

test('quality comes back after a clean stretch, and a step up that fails is not retried', () => {
  const governor = createGovernor();
  run(governor, 16.7, 120);
  run(governor, 33.4, 200);
  const lowered = governor.pace.level;
  assert.ok(lowered > 0);
  run(governor, 16.7, 40 * 13);
  assert.equal(governor.pace.level, lowered - 1, 'one step back up after a clean stretch');
  run(governor, 33.4, 120);
  assert.equal(governor.pace.level, lowered, 'the failed step is undone');
  run(governor, 16.7, 40 * 40);
  assert.equal(governor.pace.level, lowered, 'and not tried again');
});

test('a 120 Hz panel is judged against its own refresh interval', () => {
  const governor = createGovernor();
  run(governor, 8.33, 200);
  run(governor, 16.7, 200);
  assert.ok(governor.pace.level > 0, 'missing every other frame on 120 Hz counts as struggling');
});
