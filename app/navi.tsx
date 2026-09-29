"use client";

// Navi as one companion for the whole visit. A single 3D character lives on a fixed stage above the page and travels
// between seats: in-flow placeholders that each screen renders where Navi belongs. Seats keep layout, focus order and
// the tap target; the stage does the drawing. If WebGL is unavailable the seats fall back to the original sprite.
import { createContext, useCallback, useContext, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type Ref } from "react";
import Mascot, { type MascotHandle } from "./mascot";
import type { MotionPoint } from "@/lib/motion";
import { createShuffleBag } from "@/lib/engagement";
import { faceCanLead, touchGazeHold } from "@/lib/mascot-gaze";
import { createNaviRig, GESTURE_POOLS, type NaviGesture, type NaviMood, type NaviRig } from "@/lib/navi-rig";
import { TAKEOFF, follow, gazeToward, mergeLines, readingFixations, travelDuration, travelPoint, type Box, type Fixation, type Point } from "@/lib/navi-direction";
import type { NaviModel } from "@/lib/navi-model";
import { createGovernor, deviceQuality, perfReadout } from "@/lib/navi-quality";

export type NaviCheer = keyof typeof GESTURE_POOLS;
export type NaviHandle = MascotHandle & {
  /** Look at an element, or the first match of a selector, for a while. */
  lookAt: (target: Element | string | null, ms?: number) => void;
  /** Read a heading line by line, then glance at what it asks about. */
  read: (heading: Element | null, then?: Element | string | null) => void;
  cheer: (kind: NaviCheer) => void;
};

type Seat = { id: string; el: HTMLElement; hero: boolean };
type Context = { register: (seat: Seat) => () => void; greet: () => void; fallback: boolean; attachLegacy: (handle: MascotHandle | null) => void; mood: NaviMood; active: boolean };
const NaviContext = createContext<Context | null>(null);

const CANVAS = 400;       // CSS size of the square stage at scale 1
const BODY_SHARE = .8;    // Navi's body height as a share of its seat
const LOOKABLE = '[data-navi-look],.language-option,.intro-start,.question-option,.rank-row,.role-more,.flow-action,.prism-ribbon a,.prism-ribbon button';
const GLANCEABLE = 'h1,.intro-start,.language-option,.question-option,.board-role,.role-more,.flow-action';
const FIELDS = 'input,textarea,select,[role=combobox]';

const center = (el: Element): Point => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
const visible = (el: Element) => { const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2 && r.bottom > 0 && r.top < innerHeight; };
const resolve = (target: Element | string | null | undefined) => typeof target === 'string' ? document.querySelector(target) : target ?? null;
// Resolution ceiling as a multiple of the 400px canvas: lite stays near the panel's own pixels instead of above them.
const MAX_RATIO = { full: 3, lite: 1.75 } as const;

/** Navi is built once the page has its fonts and a quiet moment, so the first screen settles before any 3D work. */
const settled = () => Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise(done => setTimeout(done, 1500))])
  .then(() => new Promise<void>(done => 'requestIdleCallback' in window ? requestIdleCallback(() => done(), { timeout: 700 }) : setTimeout(done, 150)));

function createDirector({ layer, canvas, model, rig, bodyRatio, seat, onLost }: {
  layer: HTMLDivElement; canvas: HTMLCanvasElement; model: NaviModel; rig: NaviRig; bodyRatio: number; seat: () => Seat | null; onLost: () => void;
}) {
  const query = matchMedia('(prefers-reduced-motion: reduce)');
  const pick = createShuffleBag<NaviGesture>();
  let reduced = query.matches, dirty = true, mood: NaviMood = 'neutral', active = true, speaking = false;
  let shown: Box | null = null, velocity = { x: 0, y: 0, size: 0 }, opacity = 0, seatId = '', seatHero = false, transform = '';
  // A hop's own clock (seconds since take-off, negative during the crouch) advances at most 1/15 s a frame, so a
  // hitch mid-hop slows the arc a touch instead of teleporting Navi along it.
  let trip: { from: Box; t: number; dur: number; land: NaviGesture } | null = null;
  let queued: NaviCheer | null = null, onArrival: NaviGesture | null = null, greetAt = 0;
  let attention: { fixations: Fixation[]; until: number; el: Element | null } | null = null;
  let hover: Element | null = null, focus: Element | null = null, pointer: (Point & { at: number }) | null = null;
  let face: MotionPoint | null = null, lastInput = 0;
  let glance: { yaw: number; pitch: number; el: Element | null; until: number } | null = null, nextGlance = 4, nextIdle = 12;
  let clock = performance.now() / 1000, last = performance.now(), frame = 0, rimAt = 0, rimKey = '', disposed = false;
  // Frame pacing: the governor trims resolution, then halves the character's frame rate, while frames keep missing.
  const governor = createGovernor();
  let pace = governor.pace, ticks = 0, shownAt = 0, shownOpacity = '';
  const readout = perfReadout() ? document.body.appendChild(Object.assign(document.createElement('div'), { className: 'navi-perf' })) : null;
  let readoutAt = performance.now() + 1000, frames = 0, draws = 0;
  // The page size and browser version the layout and requests actually meet on this device.
  const browser = navigator.userAgent.match(/Chrome\/(\d+)/)?.[1];

  const eye = (): Point => shown ? { x: shown.x, y: shown.y - shown.size * .08 } : { x: innerWidth / 2, y: innerHeight / 2 };
  const settleAt = () => trip ? clock + trip.dur - trip.t + .12 : clock;

  function cheer(kind: NaviCheer) {
    if (!active || reduced || mood === 'reassuring') return;
    if (kind === 'greet' && rig.busy) return;
    if (kind === 'idle' && (rig.busy || speaking)) return;
    const gesture = pick(GESTURE_POOLS[kind]);
    if (trip) onArrival = gesture; else rig.play(gesture);
  }

  function measure(el: HTMLElement): Box | null {
    if (!el.isConnected) return null;
    const r = el.getBoundingClientRect();
    return r.width < 4 || r.height < 4 ? null : { x: r.left + r.width / 2, y: r.top + r.height / 2, size: Math.min(r.width, r.height) };
  }

  function place(target: Box | null, dt: number) {
    if (!target) { opacity = Math.max(0, opacity - dt * 6); return; }
    const current = seat()!;
    if (!shown) {
      // First appearance: rise into the seat and say hello.
      shown = reduced ? { ...target } : { x: target.x, y: target.y + target.size * .35, size: target.size * .8 };
      seatId = current.id; seatHero = current.hero;
      if (current.hero) greetAt = clock + .35;
    } else if (current.id !== seatId) {
      // A new seat: crouch, hop along an arc, land. Returning to the welcome seat means a new visitor, so wave.
      const from = { ...shown };
      trip = reduced ? null : { from, t: -TAKEOFF, dur: travelDuration(from, target), land: current.hero && !seatHero ? 'hello' : 'land' };
      if (reduced) shown = { ...target }; else rig.play('takeoff');
      seatId = current.id; seatHero = current.hero; attention = null; glance = null; dirty = true;
    } else if (opacity < .02 && !trip) shown = { ...target }; // reappearing after being hidden: no slide
    const before = { ...shown };
    if (trip) {
      trip.t += Math.min(dt, 1 / 15);
      const p = trip.t / trip.dur;
      if (p >= 1) {
        shown = { ...target }; velocity = { x: 0, y: 0, size: 0 };
        rig.play(trip.land);
        // A reaction that waited for the hop plays once the landing has settled; a welcome wave needs nothing more.
        if (trip.land === 'land' && onArrival) { const next = onArrival; setTimeout(() => { if (!disposed) rig.play(next); }, 380); }
        onArrival = null; trip = null;
      } else if (p > 0) shown = travelPoint(trip.from, target, p);
    } else if (reduced) shown = { ...target };
    else {
      // Between trips Navi stays attached to its seat as the layout breathes (resizes, entering content), on an exact
      // spring that stays smooth however long a frame takes.
      for (const key of ['x', 'y', 'size'] as const) {
        const next = follow(shown[key], velocity[key], target[key], 3.2, dt);
        shown[key] = next.x; velocity[key] = next.v;
      }
    }
    const body = Math.max(20, shown.size * BODY_SHARE);
    rig.setTravel(dt > 0 ? (shown.x - before.x) / dt / body : 0, dt > 0 ? (shown.y - before.y) / dt / body : 0);
    opacity = reduced ? 1 : Math.min(1, opacity + dt * 3.2);
  }

  function aim() {
    const from = eye();
    if (!active) return { yaw: 0, pitch: 0 };
    const target = seat();
    if (trip && target) { const t = measure(target.el); if (t) return gazeToward(from, t); }
    if (attention && clock < attention.until) {
      const list = attention.fixations;
      let fix: Point = list[0];
      for (const f of list) if (f.at <= clock) fix = f;
      if (list.length === 1 && attention.el?.isConnected) fix = center(attention.el);
      return gazeToward(from, fix);
    }
    attention = null;
    if (focus?.isConnected) return gazeToward(from, center(focus));
    if (hover?.isConnected && visible(hover)) return gazeToward(from, center(hover));
    if (pointer && Date.now() - pointer.at < touchGazeHold) return gazeToward(from, pointer);
    if (face && faceCanLead(Date.now(), lastInput)) return { yaw: face.x * .5, pitch: face.y * .35 };
    // Otherwise Navi keeps eye contact with the visitor and now and then glances at what is on screen.
    if (glance && clock < glance.until) return glance.el?.isConnected ? gazeToward(from, center(glance.el)) : glance;
    glance = null;
    if (clock > nextGlance) {
      const options = [...document.querySelectorAll(GLANCEABLE)].filter(visible);
      const el = options.length && Math.random() < .65 ? options[Math.floor(Math.random() * options.length)] : null;
      glance = { el, yaw: (Math.random() - .5) * .7, pitch: (Math.random() - .6) * .4, until: clock + .7 + Math.random() * .7 };
      nextGlance = clock + 4 + Math.random() * 5;
    }
    return { yaw: 0, pitch: 0 };
  }

  function sampleRim() {
    const glow = document.querySelector('.ambient-glow');
    if (!glow) return;
    const style = getComputedStyle(glow), colour = style.getPropertyValue('--glow-5'), key = colour + style.opacity;
    if (key === rimKey) return;
    const rgb = colour.match(/[\d.]+/g);
    if (!rgb || rgb.length < 3) return;
    rimKey = key;
    const [r, g, b] = rgb.map(Number), hex = '#' + [r, g, b].map(v => Math.round(Math.min(255, v)).toString(16).padStart(2, '0')).join('');
    model.setRim(hex, .2 + .28 * Number(style.opacity || 1));
    dirty = true;
  }

  function adapt(interval: number) {
    // Judge the device only once Navi is on screen and past its entrance.
    if (!shownAt || clock - shownAt < 2.5 || !governor.sample(interval)) return;
    pace = governor.pace;
    // A full-quality device that keeps missing frames at reduced resolution takes the lite materials as well.
    if (pace.level >= 2 && model.quality === 'full') {
      document.documentElement.dataset.perf = 'lite';
      void model.lighten();
    }
  }

  function report(now: number) {
    frames++;
    if (!readout || now < readoutAt) return;
    const seconds = (now - readoutAt + 1000) / 1000;
    readout.textContent = `${model.quality} · ${Math.round(frames / seconds)} fps · Navi ${Math.round(draws / seconds)} · ×${pace.scale}${pace.half ? ' · ½' : ''} · ${canvas.width}px · ${innerWidth}×${innerHeight} @${devicePixelRatio}${browser ? ` · Chrome ${browser}` : ''}`;
    readoutAt = now + 1000; frames = 0; draws = 0;
  }

  function tick(now: number) {
    frame = requestAnimationFrame(tick);
    const interval = now - last;
    const dt = Math.min(.1, Math.max(0, interval / 1000)); last = now; clock = now / 1000;
    adapt(interval); report(now);
    const current = seat(), target = current ? measure(current.el) : null;
    place(target, dt);
    if (shown && !shownAt) shownAt = clock;
    if (queued) { const kind = queued; queued = null; cheer(kind); }
    if (greetAt && clock >= greetAt) { greetAt = 0; if (active && !reduced) rig.play('hello'); }
    if (active && !trip && clock > nextIdle) {
      if (Date.now() - lastInput > 10000) cheer('idle');
      nextIdle = clock + 9 + Math.random() * 7;
    }
    const gaze = aim();
    rig.setGaze(gaze.yaw, gaze.pitch);
    if (clock > rimAt) { rimAt = clock + .25; sampleRim(); }

    if (shown) {
      const scale = shown.size * BODY_SHARE / (bodyRatio * CANVAS);
      const next = `translate3d(${(shown.x - CANVAS / 2).toFixed(2)}px,${(shown.y - CANVAS / 2).toFixed(2)}px,0) scale(${scale.toFixed(4)})`;
      if (next !== transform) { transform = next; layer.style.transform = next; dirty = true; }
      const alpha = opacity.toFixed(3);
      if (alpha !== shownOpacity) { shownOpacity = alpha; layer.style.opacity = alpha; }
      // Draw at the resolution Navi is actually shown at, in coarse steps. The large seat beside the questions shows
      // the canvas at about twice its size, so on a capable device the buffer may grow to three times the canvas;
      // lite stays close to the panel's own pixels, and the governor's scale trims both.
      const scaleOf = (size: number) => size * BODY_SHARE / (bodyRatio * CANVAS);
      const wanted = Math.max(trip ? scaleOf(trip.from.size) : scale, target ? scaleOf(target.size) : scale);
      model.resize(CANVAS, Math.max(.5, Math.ceil(Math.min(MAX_RATIO[model.quality], wanted * 1.08 * devicePixelRatio) * pace.scale * 8) / 8));
    }
    // The rig always advances, so motion keeps its timing; drawing is skipped while Navi is hidden and, at the lowest
    // pace, on every other frame.
    const pose = reduced ? null : rig.update(dt);
    if (opacity <= .001) { dirty = true; return; }
    if (pace.half && ticks++ % 2) return;
    if (pose) model.render(pose);
    else if (dirty) model.render(rig.still());
    else return;
    dirty = false; draws++;
  }

  const onPointerMove = (event: PointerEvent) => { if (event.pointerType === 'touch') return; pointer = { x: event.clientX, y: event.clientY, at: Date.now() }; lastInput = Date.now(); };
  const onPointerDown = (event: PointerEvent) => {
    pointer = { x: event.clientX, y: event.clientY, at: Date.now() }; lastInput = Date.now();
    const el = (event.target as Element | null)?.closest?.(LOOKABLE);
    if (el) attention = { fixations: [{ ...center(el), at: clock }], until: settleAt() + 1.2, el };
  };
  const onPointerOver = (event: PointerEvent) => { if (event.pointerType === 'mouse') hover = (event.target as Element | null)?.closest?.(LOOKABLE) ?? null; };
  const onFocusIn = (event: FocusEvent) => { const el = event.target as Element | null; focus = el?.matches?.(FIELDS) ? el : null; };
  const onFocusOut = () => { focus = null; };
  const onLeave = () => { hover = null; pointer = null; };
  const onVisibility = () => {
    cancelAnimationFrame(frame);
    if (document.hidden) { rig.cancel(); rig.setSpeech(false, 0); speaking = false; }
    else { last = performance.now(); frame = requestAnimationFrame(tick); }
  };
  const onReduced = () => { reduced = query.matches; dirty = true; if (reduced) { trip = null; rig.cancel(); } };
  const onContextLost = (event: Event) => { event.preventDefault(); onLost(); };

  addEventListener('pointermove', onPointerMove, { passive: true });
  addEventListener('pointerdown', onPointerDown, { passive: true });
  addEventListener('pointerover', onPointerOver, { passive: true });
  addEventListener('focusin', onFocusIn); addEventListener('focusout', onFocusOut); addEventListener('blur', onLeave);
  document.documentElement.addEventListener('pointerleave', onLeave);
  document.addEventListener('visibilitychange', onVisibility);
  query.addEventListener('change', onReduced);
  canvas.addEventListener('webglcontextlost', onContextLost);
  frame = requestAnimationFrame(tick);

  const handle: NaviHandle = {
    reset() { face = null; attention = null; glance = null; hover = null; focus = null; rig.cancel(); rig.setSpeech(false, 0); speaking = false; },
    play(action) { cheer(action); },
    notice(point) { if (point && seatHero) cheer('greet'); },
    trackFace(point) { face = point; },
    reactTo(x, y) { lastInput = Date.now(); attention = { fixations: [{ x, y, at: clock }], until: clock + 1.3, el: null }; cheer('answer'); },
    speak(speech) { speaking = speech.speaking; rig.setSpeech(speech.speaking, speech.level); },
    lookAt(target, ms = 1400) {
      const el = resolve(target);
      attention = el ? { fixations: [{ ...center(el), at: settleAt() }], until: settleAt() + ms / 1000, el } : null;
    },
    read(heading, then) {
      if (!heading || reduced) return;
      const range = document.createRange(); range.selectNodeContents(heading);
      const fixations = readingFixations(mergeLines([...range.getClientRects()]), settleAt());
      const next = resolve(then);
      let end = (fixations.at(-1)?.at ?? settleAt()) + .3;
      if (next) { fixations.push({ ...center(next), at: end }); end += 1; }
      if (fixations.length) attention = { fixations, until: end, el: null };
    },
    cheer,
  };

  return {
    ...handle,
    setMood(next: NaviMood) {
      if (next === mood) return;
      mood = next; rig.setMood(next); dirty = true;
      if (next === 'celebrate') queued = 'result';
      if (next === 'reassuring') rig.cancel();
    },
    setActive(next: boolean) { active = next; dirty = true; if (!next) { rig.cancel(); hover = null; attention = null; } },
    greet() { lastInput = Date.now(); cheer('greet'); },
    dispose() {
      disposed = true; cancelAnimationFrame(frame); readout?.remove();
      removeEventListener('pointermove', onPointerMove); removeEventListener('pointerdown', onPointerDown); removeEventListener('pointerover', onPointerOver);
      removeEventListener('focusin', onFocusIn); removeEventListener('focusout', onFocusOut); removeEventListener('blur', onLeave);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      query.removeEventListener('change', onReduced);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      model.dispose();
    },
  };
}
type Director = ReturnType<typeof createDirector>;

export function NaviStage({ ref, mood, active, children }: { ref?: Ref<NaviHandle>; mood: NaviMood; active: boolean; children: ReactNode }) {
  const layer = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const director = useRef<Director | null>(null), legacy = useRef<MascotHandle>(null);
  const seats = useRef<Seat[]>([]);
  const [fallback, setFallback] = useState(false);
  const state = useRef({ mood, active });

  useLayoutEffect(() => { state.current = { mood, active }; director.current?.setMood(mood); director.current?.setActive(active); }, [mood, active]);
  useEffect(() => {
    if (fallback) return;
    let disposed = false, model: NaviModel | null = null;
    // Load, build and link every shader before Navi appears: a first frame that stalls on shader compilation is what
    // made the entrance jump on the booth panel.
    Promise.all([import('@/lib/navi-model'), settled()]).then(async ([{ createNaviModel, BODY_HEIGHT, VIEW_HEIGHT }]) => {
      if (disposed || !layer.current || !canvas.current) return;
      model = createNaviModel(canvas.current, { quality: deviceQuality });
      document.documentElement.dataset.perf = model.quality;
      await model.warm();
      if (disposed || !layer.current || !canvas.current) return;
      const next = createDirector({ layer: layer.current, canvas: canvas.current, model, rig: createNaviRig(), bodyRatio: BODY_HEIGHT / VIEW_HEIGHT, seat: () => seats.current.at(-1) ?? null, onLost: () => setFallback(true) });
      next.setMood(state.current.mood); next.setActive(state.current.active);
      director.current = next;
    }).catch(() => {
      if (!director.current) { model?.dispose(); model = null; }
      if (!disposed) setFallback(true);
    });
    return () => {
      disposed = true;
      if (director.current) director.current.dispose(); else model?.dispose();
      director.current = null; model = null;
    };
  }, [fallback]);

  const register = useCallback((seat: Seat) => {
    seats.current = [...seats.current.filter(s => s.el !== seat.el), seat];
    return () => { seats.current = seats.current.filter(s => s.el !== seat.el); };
  }, []);
  const greet = useCallback(() => director.current?.greet(), []);
  const attachLegacy = useCallback((handle: MascotHandle | null) => { legacy.current = handle; }, []);

  useImperativeHandle(ref, () => {
    const target = (): NaviHandle | MascotHandle | null => fallback ? legacy.current : director.current;
    return {
      reset: () => target()?.reset(),
      play: action => target()?.play(action),
      notice: point => target()?.notice(point),
      trackFace: point => target()?.trackFace(point),
      reactTo: (x, y, bounds) => target()?.reactTo(x, y, bounds),
      speak: frame => target()?.speak(frame),
      lookAt: (el, ms) => { if (!fallback) director.current?.lookAt(el, ms); },
      read: (heading, then) => { if (!fallback) director.current?.read(heading, then); },
      cheer: kind => { if (!fallback) director.current?.cheer(kind); },
    };
  }, [fallback]);

  const context = useMemo(() => ({ register, greet, fallback, attachLegacy, mood, active }), [register, greet, fallback, attachLegacy, mood, active]);
  return <NaviContext.Provider value={context}>
    {children}
    {!fallback && <div ref={layer} className="navi-stage" style={{ width: CANVAS, height: CANVAS }} aria-hidden="true"><canvas ref={canvas} /></div>}
  </NaviContext.Provider>;
}

/** Where Navi belongs on the current screen. Seats with the same id are the same place, so Navi stays put. */
export function NaviSeat({ id, hero = false, label, hint, onGreet }: { id: string; hero?: boolean; label: string; hint?: string; onGreet?: () => void }) {
  const context = useContext(NaviContext);
  const button = useRef<HTMLButtonElement>(null);
  const { register, greet, fallback = false, attachLegacy, mood = 'neutral', active = true } = context ?? {};
  useLayoutEffect(() => {
    if (!register || fallback || !button.current) return;
    return register({ id, el: button.current, hero });
  }, [register, fallback, id, hero]);
  if (!register) return null;
  if (fallback) return <Mascot ref={attachLegacy} compact={!hero} mood={mood} active={active} label={label} hint={hint} onGreet={onGreet} />;
  return <button ref={button} type="button" className={`navi-seat ${hero ? 'navi-seat-hero' : ''}`} aria-label={label} disabled={!active}
    onClick={() => { greet?.(); onGreet?.(); }}>
    {hero && hint && <span className="mascot-hint" aria-hidden="true">{hint}</span>}
  </button>;
}
