import test from 'node:test';
import assert from 'node:assert/strict';
import { CHANNELS, GESTURES, GESTURE_POOLS, createNaviRig } from '../lib/navi-rig.ts';
import { easeTravel, gazeToward, mergeLines, readingFixations, travelDuration, travelPoint } from '../lib/navi-direction.ts';

const seeded = (seed = 7) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const finite = pose => Object.entries(pose).every(([, v]) => Number.isFinite(v));

test('every gesture stays bounded and finite at booth frame rates and when frames are throttled', () => {
  for (const dt of [1 / 120, 1 / 60, 1 / 20, 1 / 4]) {
    for (const name of Object.keys(GESTURES)) {
      const rig = createNaviRig(seeded());
      rig.setGaze(.5, -.4); rig.setSpeech(true, .9); rig.setTravel(40, -40); rig.play(name);
      for (let t = 0; t < GESTURES[name].dur + 1; t += dt) {
        const pose = rig.update(dt);
        assert.ok(finite(pose), `${name} at ${dt}s produced a non-finite pose`);
        assert.ok(pose.sx > .6 && pose.sx < 1.5 && pose.sy > .6 && pose.sy < 1.5, `${name} squash out of range at ${dt}s`);
        assert.ok(pose.open >= -.1 && pose.open < 1.1, `${name} mouth out of range at ${dt}s`);
        assert.ok(Math.abs(pose.eyeYaw) <= .62 && Math.abs(pose.eyePitch) <= .5, `${name} gaze out of range`);
      }
    }
  }
});

test('gestures end and the rig settles back to a calm, eyes-open pose', () => {
  const rig = createNaviRig(seeded());
  rig.play('celebrate');
  assert.equal(rig.busy, true);
  let pose;
  for (let t = 0; t < 4; t += 1 / 60) pose = rig.update(1 / 60);
  assert.equal(rig.busy, false);
  assert.ok(Math.abs(pose.spin) < 1e-9, 'a finished spin leaves no residual turn');
  assert.ok(pose.happy < .05 && pose.open < .05);
});

test('a celebration turns Navi exactly once around', () => {
  const rig = createNaviRig(seeded());
  rig.play('celebrate');
  let most = 0;
  for (let t = 0; t < GESTURES.celebrate.dur - .02; t += 1 / 60) most = Math.max(most, rig.update(1 / 60).spin);
  assert.ok(Math.abs(most - 2 * Math.PI) < .01);
});

test('reduced motion gets a still, finished expression that looks at the visitor', () => {
  const rig = createNaviRig(seeded());
  rig.setMood('celebrate'); rig.setGaze(.6, .4); rig.play('wave');
  const still = rig.still();
  assert.equal(still.eyeYaw, 0); assert.equal(still.eyePitch, 0); assert.equal(still.spin, 0);
  assert.equal(still.eyeOpenL, 1); assert.equal(still.eyeOpenR, 1);
  assert.ok(still.smile > .8, 'the mood still reads without motion');
});

test('speech opens the mouth with the actual level and silence closes it', () => {
  const rig = createNaviRig(seeded());
  let pose;
  rig.setSpeech(true, .8);
  for (let t = 0; t < .3; t += 1 / 60) { rig.setSpeech(true, .8); pose = rig.update(1 / 60); }
  assert.ok(pose.open > .4);
  rig.setSpeech(false, 0);
  for (let t = 0; t < .4; t += 1 / 60) pose = rig.update(1 / 60);
  assert.ok(pose.open < .05);
});

test('Navi blinks on its own, never for long', () => {
  const rig = createNaviRig(seeded(3));
  let closed = 0, longest = 0, run = 0;
  for (let t = 0; t < 20; t += 1 / 60) {
    const pose = rig.update(1 / 60);
    if (pose.eyeOpenL < .5) { closed++; run++; longest = Math.max(longest, run); } else run = 0;
  }
  assert.ok(closed > 0, 'blinks happen');
  assert.ok(longest / 60 < .2, 'a blink is brief');
});

test('the eyes lead and the body follows only part of the way', () => {
  const rig = createNaviRig(seeded());
  rig.setGaze(.5, 0);
  let pose;
  for (let t = 0; t < 3; t += 1 / 60) pose = rig.update(1 / 60);
  assert.ok(pose.yaw > .12 && pose.yaw < .25, `body turns partly (${pose.yaw})`);
  assert.ok(pose.eyeYaw + pose.yaw > .35, 'eyes plus body reach the target');
});

test('pools only name real gestures', () => {
  for (const pool of Object.values(GESTURE_POOLS)) for (const name of pool) assert.ok(GESTURES[name], name);
  assert.ok(CHANNELS.length > 10);
});

test('a hop starts and ends exactly on its seats and arcs above them', () => {
  const from = { x: 680, y: 240, size: 170 }, to = { x: 90, y: 700, size: 90 };
  assert.deepEqual(travelPoint(from, to, 0), from);
  const end = travelPoint(from, to, 1);
  for (const key of ['x', 'y', 'size']) assert.ok(Math.abs(end[key] - to[key]) < 1e-9);
  let highest = Infinity;
  for (let p = 0; p <= 1; p += .02) highest = Math.min(highest, travelPoint(from, to, p).y);
  assert.ok(highest < from.y, 'the path rises above the higher seat before descending');
  assert.equal(easeTravel(0), 0); assert.equal(easeTravel(1), 1); assert.ok(easeTravel(.5) > .45 && easeTravel(.5) < .55);
  assert.ok(travelDuration(from, to) >= .6 && travelDuration(from, to) <= 1.05);
  assert.equal(travelDuration(from, from), .6);
});

test('gaze angles point toward screen targets and stay within the eye range', () => {
  const eye = { x: 500, y: 300 };
  const right = gazeToward(eye, { x: 800, y: 300 }), below = gazeToward(eye, { x: 500, y: 600 });
  assert.ok(right.yaw > 0 && Math.abs(right.pitch) < 1e-9);
  assert.ok(below.pitch > 0 && Math.abs(below.yaw) < 1e-9);
  const far = gazeToward(eye, { x: -9000, y: 9000 });
  assert.ok(far.yaw >= -.62 && far.pitch <= .5);
});

test('reading visits each line left to right, top to bottom', () => {
  const lines = mergeLines([
    { left: 100, right: 300, top: 100, bottom: 140, width: 200, height: 40 },
    { left: 300, right: 700, top: 102, bottom: 138, width: 400, height: 36 },
    { left: 180, right: 620, top: 150, bottom: 190, width: 440, height: 40 },
  ]);
  assert.equal(lines.length, 2);
  const fixations = readingFixations(lines, 1);
  assert.equal(fixations[0].at, 1);
  for (let i = 1; i < fixations.length; i++) assert.ok(fixations[i].at > fixations[i - 1].at);
  const first = fixations.filter(f => f.y < 145), second = fixations.filter(f => f.y > 145);
  assert.ok(first.length >= 2 && second.length >= 2);
  assert.ok(first.every((f, i) => i === 0 || f.x > first[i - 1].x));
  assert.ok(Math.max(...first.map(f => f.at)) < Math.min(...second.map(f => f.at)));
});
