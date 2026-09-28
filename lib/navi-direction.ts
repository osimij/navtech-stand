// Pure staging helpers for the companion: how Navi travels between seats and where its eyes land on screen.

export type Box = { x: number; y: number; size: number };
export type Point = { x: number; y: number };
export type Fixation = Point & { at: number };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * One axis of a critically damped spring, advanced exactly by dt. Numerical integration of a stiff spring rings or
 * diverges once frames get long (a slow device, a busy start-up), which made Navi jump around its seat; the closed
 * form stays smooth and never overshoots at any frame rate.
 */
export function follow(x: number, v: number, target: number, hz: number, dt: number) {
  const w = 2 * Math.PI * hz, t = Math.max(0, dt), d = x - target, c = v + w * d, e = Math.exp(-w * t);
  const next = { x: target + (d + c * t) * e, v: (v - w * c * t) * e };
  return Number.isFinite(next.x) && Number.isFinite(next.v) ? next : { x: target, v: 0 };
}

/** Anticipation before a hop: a short crouch while the eyes find the destination. */
export const TAKEOFF = .16;

/** Longer hops take a little longer, but never drag. */
export function travelDuration(from: Box, to: Box) {
  return clamp(.6 + Math.hypot(to.x - from.x, to.y - from.y) / 2600 + Math.abs(to.size - from.size) / 900, .6, 1.05);
}

/** Slow out, fast through the middle, soft landing. */
export function easeTravel(p: number) {
  const t = clamp(p, 0, 1);
  return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** A hop is an arc, not a slide: a quadratic curve lifted above the higher of the two seats. */
export function travelPoint(from: Box, to: Box, p: number): Box {
  const e = easeTravel(p), lift = clamp(Math.hypot(to.x - from.x, to.y - from.y) * .22, 24, 150);
  const cx = (from.x + to.x) / 2, cy = Math.min(from.y, to.y) - lift;
  const a = (1 - e) * (1 - e), b = 2 * (1 - e) * e, c = e * e;
  // Size settles a touch earlier than position, so Navi reads as arriving rather than inflating on arrival.
  const s = easeTravel(clamp(p * 1.12, 0, 1));
  return { x: a * from.x + b * cx + c * to.x, y: a * from.y + b * cy + c * to.y, size: from.size + (to.size - from.size) * s };
}

/** Screen point → gaze angles from Navi's eyes. Depth sets how far the eyes turn for an offset on screen. */
export function gazeToward(eye: Point, target: Point, depth = 480) {
  return { yaw: clamp(Math.atan2(target.x - eye.x, depth), -.62, .62), pitch: clamp(Math.atan2(target.y - eye.y, depth), -.5, .5) };
}

/** Reading is saccadic: a few fixations along each line, a return sweep, then the next line. */
export function readingFixations(lines: { left: number; right: number; top: number; bottom: number }[], start = 0): Fixation[] {
  const out: Fixation[] = [];
  let at = start;
  for (const line of lines) {
    const width = line.right - line.left, y = (line.top + line.bottom) / 2;
    const stops = clamp(Math.round(width / 150), 2, 5);
    for (let i = 0; i < stops; i++) {
      out.push({ x: line.left + width * (.08 + .84 * i / (stops - 1)), y, at });
      at += .17;
    }
    at += .06;
  }
  return out;
}

/** Groups a heading's client rects into visual lines. */
export function mergeLines(rects: { left: number; right: number; top: number; bottom: number; width: number; height: number }[]) {
  const lines: { left: number; right: number; top: number; bottom: number }[] = [];
  for (const r of rects) {
    if (r.width < 2 || r.height < 2) continue;
    const line = lines.find(l => Math.abs((l.top + l.bottom) / 2 - (r.top + r.bottom) / 2) < r.height / 2);
    if (line) { line.left = Math.min(line.left, r.left); line.right = Math.max(line.right, r.right); line.top = Math.min(line.top, r.top); line.bottom = Math.max(line.bottom, r.bottom); }
    else lines.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom });
  }
  return lines.sort((a, b) => a.top - b.top);
}
