// Sparse RGB comparison stays on the device. This is motion, not person detection.
export type MotionPoint = { x: number; y: number };

export function motionPosition(previous: Uint8ClampedArray, current: Uint8ClampedArray, width = 64): MotionPoint | null {
  if (previous.length !== current.length || !current.length || width < 1 || !Number.isInteger(width) || current.length % (width * 4)) return null;
  const height = current.length / (width * 4);
  let moving = 0, samples = 0, x = 0, y = 0;
  for (let i = 0; i + 2 < current.length; i += 16) {
    samples++;
    if (Math.abs(current[i] - previous[i]) + Math.abs(current[i + 1] - previous[i + 1]) + Math.abs(current[i + 2] - previous[i + 2]) > 90) {
      moving++;
      x += (i / 4) % width + .5;
      y += Math.floor(i / 4 / width) + .5;
    }
  }
  return moving / samples > .09 ? { x: x / moving / width * 2 - 1, y: y / moving / height * 2 - 1 } : null;
}

export function motionDetected(previous: Uint8ClampedArray, current: Uint8ClampedArray): boolean {
  return motionPosition(previous, current) !== null;
}
