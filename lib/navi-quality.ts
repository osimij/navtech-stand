// How much drawing the device can afford. The booth screen is a low-power Android panel, so Navi and the page pick a
// rendering tier once (the GPU, core count and memory), then a frame governor trims resolution and frame rate if the
// device still misses frames. Pure and DOM-free apart from the small storage helpers at the end.

export type NaviQuality = 'full' | 'lite';

/** Mobile and embedded GPUs, and software rasterisers: the physical shading layers cost them too much per pixel. */
const LITE_GPU = /mali|adreno|powervr|vivante|videocore|immortalis|maleoon|xclipse|swiftshader|llvmpipe|softpipe|software|basic render/i;

export function liteDevice({ ua = '', cores = 8, memory = 8, gpu = '' }: { ua?: string; cores?: number; memory?: number; gpu?: string }) {
  return /android/i.test(ua) || cores <= 4 || memory <= 4 || LITE_GPU.test(gpu);
}

/** An operator override wins; otherwise the device decides. */
export function chooseQuality(override: NaviQuality | null, device: Parameters<typeof liteDevice>[0]): NaviQuality {
  return override ?? (liteDevice(device) ? 'lite' : 'full');
}

// The governor watches frame intervals in windows. Sustained misses step the canvas resolution down, then halve the
// character's frame rate (a steady 30 reads smoother than an uneven 40-60). A long clean stretch steps back up; a step
// up that fails soon after is not tried again, so the booth never oscillates.
export const PACE_SCALES = [1, .85, .72, .6] as const;
export type Pace = { level: number; scale: number; half: boolean };

export function createGovernor({ window = 40, badWindows = 2, goodWindows = 12 } = {}) {
  const samples: number[] = [];
  const top = PACE_SCALES.length; // the last level: lowest resolution at half rate
  let level = 0, best = 0, bad = 0, good = 0, windows = 0, raisedAt = -Infinity, vsync = 1000 / 60;
  const pace = (): Pace => ({ level, scale: PACE_SCALES[Math.min(level, top - 1)], half: level >= top });
  return {
    get pace() { return pace(); },
    get vsync() { return vsync; },
    /** One frame interval in ms. Returns true when the pace changed. */
    sample(ms: number) {
      // A hidden tab, a garbage-collection pause or a long task is not a verdict on the device.
      if (!(ms > 0) || ms > 250) return false;
      samples.push(ms);
      if (samples.length < window) return false;
      const sorted = samples.splice(0).sort((a, b) => a - b);
      const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))];
      windows++;
      // The display's refresh interval: 60 Hz unless frames show a faster panel.
      vsync = Math.max(6.5, Math.min(vsync, at(.1)));
      if (at(.5) > vsync * 1.35) {
        good = 0;
        if (++bad >= badWindows && level < top) {
          if (windows - raisedAt <= 4) best = level + 1; // the last step up did not hold
          level++; bad = 0;
          return true;
        }
      } else if (at(.9) < vsync * 1.2) {
        bad = 0;
        if (++good >= goodWindows && level > best) { level--; good = 0; raisedAt = windows; return true; }
      } else { bad = 0; good = 0; }
      return false;
    },
  };
}
export type Governor = ReturnType<typeof createGovernor>;

// Operator switches, typed into the URL once on the booth device and remembered there:
// ?navi=lite | full | auto chooses the tier; ?perf=1 | 0 shows or hides a small frame-rate readout.
export const QUALITY_KEY = 'navi-quality';
export const PERF_KEY = 'navi-perf';

function stored(key: string, param: string, allowed: string[]) {
  try {
    const value = new URLSearchParams(location.search).get(param);
    if (value !== null) {
      if (allowed.includes(value)) localStorage.setItem(key, value); else localStorage.removeItem(key);
    }
    return localStorage.getItem(key);
  } catch { return null; }
}
export const qualityOverride = () => stored(QUALITY_KEY, 'navi', ['lite', 'full']) as NaviQuality | null;
export const perfReadout = () => stored(PERF_KEY, 'perf', ['1']) === '1';

/** The same decision the inline head script makes (app/layout.tsx), refined with the GPU name once WebGL is up. */
export function deviceQuality(gpu = '') {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return chooseQuality(qualityOverride(), { ua: nav.userAgent, cores: nav.hardwareConcurrency || 8, memory: nav.deviceMemory || 8, gpu });
}
