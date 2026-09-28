// Navi's animation brain. Pure and renderer-free: it turns mood, gaze, speech, travel and gestures into one pose per
// frame. Everything moves through damped springs, so any change of intent eases in with a little follow-through.

export type NaviMood = 'neutral' | 'thinking' | 'acknowledge' | 'celebrate' | 'reassuring';
export type NaviGesture =
  | 'wave' | 'bow' | 'lean' | 'nod' | 'pop' | 'peek' | 'celebrate' | 'rise' | 'pleased' | 'stretch' | 'ponder'
  | 'swoop' | 'shuffle' | 'wink' | 'boop' | 'delight' | 'shy' | 'curious' | 'hello' | 'goodbye' | 'takeoff' | 'land';

export const CHANNELS = [
  'x', 'y', 'sx', 'sy', 'roll', 'pitch', 'yaw', 'eyeYaw', 'eyePitch', 'browL', 'browR', 'tiltL', 'tiltR',
  'smile', 'open', 'width', 'happy', 'armLLift', 'armLFwd', 'armRLift', 'armRFwd',
] as const;
export type Channel = typeof CHANNELS[number];
type Values = Record<Channel, number>;
type Delta = Partial<Values> & { closeL?: number; closeR?: number; spin?: number };

/** Everything the renderer needs. Angles are radians; x/y are body units (the body is two units tall). */
export type NaviPose = Values & { eyeOpenL: number; eyeOpenR: number; spin: number };

const REST: Values = {
  x: 0, y: 0, sx: 1, sy: 1, roll: 0, pitch: 0, yaw: 0, eyeYaw: 0, eyePitch: 0, browL: 0, browR: 0, tiltL: 0, tiltR: 0,
  smile: .55, open: 0, width: 1, happy: 0, armLLift: 0, armLFwd: 0, armRLift: 0, armRFwd: 0,
};

const MOODS: Record<NaviMood, Partial<Values>> = {
  neutral: {},
  thinking: { smile: .42, browL: .1, browR: .1, pitch: .03 },
  acknowledge: { smile: .82, browL: .18, browR: .18 },
  celebrate: { smile: .9, open: .1, browL: .22, browR: .22 },
  reassuring: { smile: .32, tiltL: .38, tiltR: .38, browL: .16, browR: .16, roll: .07, armLFwd: .75, armRFwd: .75, armLLift: -.3, armRLift: -.3 },
};

// Frequency (Hz) and damping ratio per channel. Low damping on squash and arms gives soft follow-through.
const SPRINGS: Record<Channel, [number, number]> = {
  x: [3.6, .62], y: [4.2, .5], sx: [4.8, .32], sy: [4.8, .32], roll: [3, .58], pitch: [3.2, .6], yaw: [2.6, .72],
  eyeYaw: [13, .92], eyePitch: [13, .92], browL: [6, .7], browR: [6, .7], tiltL: [6, .75], tiltR: [6, .75],
  smile: [7, .8], open: [16, .82], width: [9, .8], happy: [9, .85],
  armLLift: [3.4, .42], armLFwd: [3.4, .5], armRLift: [3.4, .42], armRFwd: [3.4, .5],
};

const LIMITS: Partial<Record<Channel, [number, number]>> = {
  smile: [-.6, 1], open: [0, .9], width: [.6, 1.3], happy: [0, 1], eyeYaw: [-.62, .62], eyePitch: [-.5, .5],
  browL: [-.6, 1], browR: [-.6, 1], sx: [.8, 1.25], sy: [.78, 1.25],
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smooth = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
/** A soft hump from a to b on normalised time p. */
const bell = (p: number, a = 0, b = 1) => p <= a || p >= b ? 0 : Math.sin(Math.PI * (p - a) / (b - a));
/** Rises over the first `attack` of p, holds, and falls over the last `release`. */
const hold = (p: number, attack: number, release: number) => smooth(0, attack, p) * (1 - smooth(1 - release, 1, p));
const wave = (e: number, hz: number, phase = 0) => Math.sin(2 * Math.PI * hz * e + phase);
/** A ballistic hop between a and b: quick rise, hang, quick fall. */
const hop = (p: number, a = 0, b = 1) => { const t = clamp((p - a) / (b - a), 0, 1); return 4 * t * (1 - t); };

type Spec = { dur: number; fn: (p: number, e: number) => Delta };
const both = (lift: number, fwd = 0): Delta => ({ armLLift: lift, armRLift: lift, armLFwd: fwd, armRFwd: fwd });

export const GESTURES: Record<NaviGesture, Spec> = {
  wave: { dur: 1.5, fn: (p, e) => { const k = hold(p, .16, .24); return { armRLift: k * (1.95 + .38 * wave(e, 2.4)), armRFwd: .34 * k, roll: -.09 * k, smile: .35 * k, open: .22 * k, browL: .3 * k, browR: .3 * k, y: .04 * k }; } },
  goodbye: { dur: 1.3, fn: (p, e) => { const k = hold(p, .18, .26); return { armRLift: k * (1.8 + .34 * wave(e, 2.6)), armRFwd: .3 * k, roll: -.07 * k, smile: .25 * k, browL: .2 * k, browR: .2 * k, tiltL: .15 * k, tiltR: .15 * k }; } },
  hello: { dur: 2.1, fn: (p, e) => { const k = hold(p, .2, .2), pop = bell(p, 0, .22); return { sy: .07 * pop, sx: -.04 * pop, armRLift: k * (1.95 + .38 * wave(e, 2.4)), armRFwd: .34 * k, roll: -.1 * k, smile: .38 * k, open: .28 * k, browL: .38 * k, browR: .38 * k, y: .05 * k }; } },
  nod: { dur: .62, fn: p => ({ pitch: .2 * bell(p, 0, .5) - .05 * bell(p, .5, 1), smile: .25 * bell(p), sy: -.03 * bell(p, 0, .5) }) },
  pleased: { dur: .9, fn: p => ({ pitch: .16 * bell(p, 0, .55), happy: .95 * hold(p, .15, .3), smile: .35 * bell(p), sy: -.03 * bell(p, 0, .5) }) },
  pop: { dur: .6, fn: p => ({ sy: -.09 * bell(p, 0, .32) + .07 * bell(p, .28, .7), sx: .06 * bell(p, 0, .32) - .035 * bell(p, .28, .7), browL: .4 * bell(p, .15, 1), browR: .4 * bell(p, .15, 1), ...both(.45 * bell(p, .2, .85)) }) },
  delight: { dur: 1.05, fn: (p, e) => { const k = hold(p, .12, .22); return { y: .17 * hop(p, .08, .55), sy: -.08 * bell(p, 0, .1) - .07 * bell(p, .55, .72), happy: k, smile: .4 * k, open: .32 * k, roll: .08 * wave(e, 2.2) * k, ...both(1.15 * k) }; } },
  wink: { dur: 1.05, fn: p => { const k = hold(p, .2, .3); return { closeR: bell(p, .22, .72) > .2 ? 1 : 0, roll: .09 * k, smile: .3 * k, browR: -.28 * k, browL: .18 * k }; } },
  boop: { dur: .85, fn: p => ({ sy: -.1 * bell(p, 0, .28) + .06 * bell(p, .28, .62), sx: .07 * bell(p, 0, .28), closeL: bell(p, .04, .3) > .3 ? 1 : 0, closeR: bell(p, .04, .3) > .3 ? 1 : 0, open: .22 * bell(p, .3, .95), width: -.32 * bell(p, .3, .95), smile: -.3 * bell(p, .3, .95), browL: .35 * bell(p, .25, 1), browR: .35 * bell(p, .25, 1) }) },
  shy: { dur: 1.7, fn: p => { const k = hold(p, .2, .25); return { roll: .14 * k, pitch: .1 * k, eyeYaw: .3 * k, eyePitch: .24 * k, smile: .3 * k, ...both(-.35 * k, .85 * k) }; } },
  curious: { dur: 1.7, fn: p => { const k = hold(p, .2, .25); return { roll: -.17 * k, browL: .5 * k, browR: -.08 * k, open: .1 * k, width: -.28 * k, smile: -.2 * k, eyeYaw: -.16 * k, y: .03 * k }; } },
  peek: { dur: .95, fn: p => { const k = hold(p, .25, .3); return { x: .12 * k, roll: -.14 * k, eyeYaw: .3 * k, browL: .15 * k }; } },
  lean: { dur: 1.2, fn: p => { const k = hold(p, .25, .3); return { roll: -.19 * k, eyeYaw: -.24 * k, x: -.05 * k }; } },
  stretch: { dur: 1.7, fn: p => { const k = hold(p, .25, .3); return { ...both(2.1 * k, .2 * k), sy: .075 * k, sx: -.035 * k, happy: .9 * k, open: .32 * k, width: -.22 * k, pitch: -.1 * k, y: .05 * k }; } },
  celebrate: { dur: 1.5, fn: (p, e) => { const k = hold(p, .1, .22); return { y: .42 * hop(p, .1, .6), sy: -.1 * bell(p, 0, .12) - .09 * bell(p, .6, .76) + .05 * bell(p, .12, .3), spin: 2 * Math.PI * smooth(.12, .58, p), happy: k, open: .52 * k, smile: .45 * k, browL: .38 * k, browR: .38 * k, ...both(k * (2.05 + .3 * wave(e, 3)), .25 * k) }; } },
  rise: { dur: 1.2, fn: p => { const k = hold(p, .25, .3); return { y: .2 * k, ...both(1.75 * k, .2 * k), smile: .3 * k, happy: .6 * hold(p, .3, .35) }; } },
  bow: { dur: 1.15, fn: p => ({ pitch: .36 * bell(p, .08, .82), ...both(0, .6 * bell(p, .08, .82)), happy: .55 * bell(p, .25, .75), y: -.03 * bell(p, .08, .82) }) },
  ponder: { dur: 1.9, fn: p => { const k = hold(p, .16, .2), aha = bell(p, .7, .96); return { armRFwd: 1.9 * k, armRLift: .2 * k, eyeYaw: -.24 * k, eyePitch: -.3 * k, browL: .42 * k + .3 * aha, browR: -.08 * k + .3 * aha, tiltR: .2 * k, smile: -.25 * k, width: -.2 * k, roll: -.09 * k, y: .05 * aha }; } },
  swoop: { dur: 1.6, fn: p => ({ x: -.45 * bell(p, 0, .55) + .34 * bell(p, .45, 1), roll: .18 * bell(p, 0, .55) - .14 * bell(p, .45, 1), y: .07 * Math.sin(Math.PI * p), happy: .4 * bell(p, .2, .8), ...both(.5 * bell(p)) }) },
  shuffle: { dur: 1.6, fn: (p, e) => { const k = hold(p, .1, .2); return { x: .2 * wave(e, 1.9) * k, roll: .1 * wave(e, 1.9, .5) * k, sy: -.03 * Math.abs(wave(e, 3.8)) * k, smile: .3 * k }; } },
  takeoff: { dur: .2, fn: p => ({ sy: -.12 * bell(p, 0, 1.2), sx: .07 * bell(p, 0, 1.2), ...both(-.25 * bell(p, 0, 1.2)), browL: .25 * p, browR: .25 * p }) },
  land: { dur: .55, fn: p => ({ sy: -.12 * bell(p, 0, .34), sx: .07 * bell(p, 0, .34), ...both(.55 * bell(p, 0, .45)), smile: .2 * bell(p) }) },
};

export const GESTURE_POOLS = {
  greet: ['wave', 'wink', 'boop', 'shy'],
  answer: ['nod', 'pop', 'wink', 'delight', 'pleased'],
  result: ['celebrate'],
  idle: ['curious', 'stretch', 'peek', 'shy'],
  riddle: ['ponder', 'peek'],
  story: ['swoop', 'wave'],
  words: ['shuffle', 'pop'],
} as const satisfies Record<string, readonly NaviGesture[]>;

type Spring = { x: number; v: number };
type Active = { name: NaviGesture; start: number };

export function createNaviRig(random: () => number = Math.random) {
  const springs = Object.fromEntries(CHANNELS.map(c => [c, { x: REST[c], v: 0 } satisfies Spring])) as Record<Channel, Spring>;
  let mood: NaviMood = 'neutral';
  let gaze = { yaw: 0, pitch: 0 }, lastGaze = { yaw: 0, pitch: 0 };
  let micro = { yaw: 0, pitch: 0 }, nextMicro = 0;
  let speech = 0, speaking = false;
  let travel = { vx: 0, vy: 0 };
  let gestures: Active[] = [];
  let blinkAt = 1.2 + random() * 2, blinkStart = -1, doubleBlink = false, lastBlink = -10;
  let time = 0;

  const blinkClosure = (now: number) => {
    if (blinkStart < 0) return 0;
    const p = (now - blinkStart) / .17;
    if (p >= 1) { blinkStart = -1; return 0; }
    return p < .38 ? p / .38 : p < .52 ? 1 : 1 - (p - .52) / .48;
  };
  const blink = (now: number) => { if (blinkStart < 0) { blinkStart = now; lastBlink = now; } };

  function target(now: number): { values: Values; closeL: number; closeR: number; spin: number } {
    const v: Values = { ...REST, ...MOODS[mood] };
    // Breathing and hovering: never perfectly still.
    const breath = Math.sin(now * 2 * Math.PI / 3.8);
    v.sy += .014 * breath; v.sx -= .007 * breath;
    v.y += .035 * Math.sin(now * 2 * Math.PI / 4.6) ;
    v.roll += .022 * Math.sin(now * 2 * Math.PI / 6.3 + 1);
    v.armLLift += .06 * Math.sin(now * 2 * Math.PI / 3.8 - .6); v.armRLift += .06 * Math.sin(now * 2 * Math.PI / 3.8 - .9);

    // Gaze: the eyes lead, the body turns part of the way. Small fixational jumps keep a held look alive.
    if (now >= nextMicro) { micro = { yaw: (random() - .5) * .07, pitch: (random() - .5) * .05 }; nextMicro = now + .5 + random() * 1.3; }
    const gy = gaze.yaw + micro.yaw, gp = gaze.pitch + micro.pitch;
    v.yaw += .36 * gaze.yaw; v.pitch += .28 * gaze.pitch;
    v.eyeYaw = gy; v.eyePitch = gp;

    // Travel: lean into the direction of flight, stretch with speed, arms trail.
    const speed = Math.hypot(travel.vx, travel.vy);
    v.roll += clamp(-travel.vx * .05, -.32, .32);
    v.sy += clamp(speed * .018, 0, .09); v.sx -= clamp(speed * .009, 0, .045);
    v.armLLift += clamp(travel.vy * .12 + speed * .05, -.5, .9); v.armRLift += clamp(travel.vy * .12 + speed * .05, -.5, .9);

    // Speech: the mouth follows the actual output level; louder syllables lift the brows and the head.
    if (speaking) {
      const open = clamp((speech - .035) * 1.9, 0, .72);
      v.open = Math.max(v.open, open); v.width -= open * .16; v.smile -= open * .15;
      v.browL += speech * .22; v.browR += speech * .22; v.pitch -= speech * .05; v.y += speech * .02;
    }

    let closeL = 0, closeR = 0, spin = 0;
    gestures = gestures.filter(g => now - g.start < GESTURES[g.name].dur);
    for (const g of gestures) {
      const spec = GESTURES[g.name], e = now - g.start, d = spec.fn(e / spec.dur, e);
      for (const key in d) {
        if (key === 'closeL') closeL = Math.max(closeL, d.closeL!);
        else if (key === 'closeR') closeR = Math.max(closeR, d.closeR!);
        else if (key === 'spin') spin += d.spin!;
        else v[key as Channel] += d[key as Channel]!;
      }
    }
    for (const c of CHANNELS) { const l = LIMITS[c]; if (l) v[c] = clamp(v[c], l[0], l[1]); }
    return { values: v, closeL, closeR, spin };
  }

  function pose(values: Values, closeL: number, closeR: number, spin: number, blinkClose: number): NaviPose {
    // The eyes turn inside a body that is itself turning, so they compensate for the body's current yaw.
    const out = { ...values } as NaviPose;
    out.eyeYaw = clamp(values.eyeYaw - springs.yaw.x * .9, -.62, .62);
    out.eyePitch = clamp(values.eyePitch - springs.pitch.x * .6, -.5, .5);
    out.eyeOpenL = 1 - Math.max(blinkClose, closeL);
    out.eyeOpenR = 1 - Math.max(blinkClose, closeR);
    out.spin = spin;
    return out;
  }

  return {
    setMood(next: NaviMood) { mood = next; },
    get mood() { return mood; },
    /** Gaze in radians: positive yaw looks right, positive pitch looks down. */
    setGaze(yaw: number, pitch: number) {
      const next = { yaw: clamp(yaw, -.62, .62), pitch: clamp(pitch, -.5, .5) };
      // A large shift of attention often carries a blink, as it does in people.
      if (Math.hypot(next.yaw - lastGaze.yaw, next.pitch - lastGaze.pitch) > .32 && time - lastBlink > 1.2 && random() < .45) blink(time);
      if (Math.hypot(next.yaw - lastGaze.yaw, next.pitch - lastGaze.pitch) > .02) lastGaze = next;
      gaze = next;
    },
    setSpeech(active: boolean, level: number) { speaking = active; speech = active ? speech * .35 + clamp(level, 0, 1) * .65 : 0; },
    setTravel(vx: number, vy: number) { travel = { vx: Number.isFinite(vx) ? vx : 0, vy: Number.isFinite(vy) ? vy : 0 }; },
    play(name: NaviGesture) {
      // Body-level gestures replace each other; the landing squash can overlap whatever comes next.
      gestures = gestures.filter(g => g.name === 'land' || g.name === 'takeoff');
      gestures.push({ name, start: time });
    },
    get busy() { return gestures.some(g => g.name !== 'land' && g.name !== 'takeoff'); },
    cancel() { gestures = []; },
    reset() {
      gestures = []; speech = 0; speaking = false; travel = { vx: 0, vy: 0 }; gaze = { yaw: 0, pitch: 0 }; mood = 'neutral';
    },
    /** Advances the simulation by dt seconds and returns the pose to draw. */
    update(dt: number): NaviPose {
      // Up to 10 fps the rig keeps real time (substeps keep it stable), so gestures stay in step with the hops.
      const step = clamp(dt, 0, 1 / 10);
      time += step;
      if (time >= blinkAt) {
        blink(time);
        blinkAt = time + (doubleBlink ? .26 : 2.2 + random() * 3.6);
        doubleBlink = !doubleBlink && random() < .2;
      }
      const { values, closeL, closeR, spin } = target(time);
      for (const c of CHANNELS) {
        const s = springs[c], [hz, zeta] = SPRINGS[c], w = 2 * Math.PI * hz;
        // Semi-implicit Euler is stable while w·h stays well under 2, so stiff channels (eyes, mouth) take more
        // substeps when frames arrive slowly. A throttled tab or a busy machine can never make Navi explode.
        const n = Math.max(1, Math.ceil(step * w / .35)), h = step / n;
        for (let i = 0; i < n; i++) { s.v += (w * w * (values[c] - s.x) - 2 * zeta * w * s.v) * h; s.x += s.v * h; }
        if (!Number.isFinite(s.x) || !Number.isFinite(s.v)) { s.x = values[c]; s.v = 0; }
      }
      const current = Object.fromEntries(CHANNELS.map(c => [c, springs[c].x])) as Values;
      return pose(current, closeL, closeR, spin, blinkClosure(time));
    },
    /** A still, finished pose for reduced motion: the mood's expression, eyes open, looking at the visitor. */
    still(): NaviPose {
      const v: Values = { ...REST, ...MOODS[mood] };
      for (const c of CHANNELS) { springs[c].x = v[c]; springs[c].v = 0; }
      return { ...v, eyeOpenL: 1, eyeOpenR: 1, spin: 0 };
    },
  };
}

export type NaviRig = ReturnType<typeof createNaviRig>;
