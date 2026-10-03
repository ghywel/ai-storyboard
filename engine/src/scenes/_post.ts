// The compositor's touches (the director's note: "full frame post-processing effects. Screen shakes, motion blurs -
// anything an awesome animator compositor might add for fun. But don't over do it - a very shaky scene can be
// painful to watch even at 60fps"). Each helper returns post overrides to merge into a scene's return value.
//
// The rules, built in:
// - Shakes are smooth (two sines, not random jitter), decay within dur, and are capped at 8 px (1080p logical); a
//   shake always brings a zoom just big enough that the frame's edge never shows.
// - At most one shake per bar, and only on real hits (a slam, a thunderclap, a stomp); never a continuous shake.
// - Punch-ins on hits are small (zoom +1–4 %), with a fast attack and an eased release.
// - Motion blur is free: the final render averages sub-frames over a 0.2 shutter, so fast moves streak by themselves.
//   Whips and slams need no blur of their own.
import type { PostOverrides } from '../engine/scene';

const MAX_SHAKE = 8;

/** A smooth, decaying shake from the most recent hit time in `hits` (seconds), amplitude amp px (≤ 8), over dur. */
export function hitShake(t: number, hits: number[], amp = 5, dur = 0.32): PostOverrides {
  let h = -1e9;
  for (const x of hits) if (x <= t && x > h) h = x;
  const age = t - h;
  if (age < 0 || age > dur) return {};
  const a = Math.min(MAX_SHAKE, amp) * Math.pow(1 - age / dur, 2);
  const sx = a * (0.7 * Math.sin(age * 71) + 0.3 * Math.sin(age * 133 + 1.3));
  const sy = a * (0.7 * Math.cos(age * 63 + 0.4) + 0.3 * Math.sin(age * 117));
  return { shake: [sx, sy], zoom: 1 + (2.2 * Math.hypot(sx, sy)) / 1080 };
}

/** A punch-in on each hit: zoom up by amt with a 40 ms attack, easing back over dur. */
export function punch(t: number, hits: number[], amt = 0.025, dur = 0.35): PostOverrides {
  let z = 0;
  for (const h of hits) {
    const age = t - h;
    if (age < -0.04 || age > dur) continue;
    const v = age < 0 ? 1 + age / 0.04 : 1 - (age / dur) * (age / dur) * (3 - 2 * (age / dur));
    z = Math.max(z, amt * Math.max(0, Math.min(1, v)));
  }
  return z ? { zoom: 1 + z } : {};
}

/** A chromatic aberration kick on impacts (the colour fringes split, then settle). */
export function caKick(t: number, hits: number[], amt = 5, dur = 0.25): PostOverrides {
  let k = 0;
  for (const h of hits) { const age = t - h; if (age >= 0 && age < dur) k = Math.max(k, 1 - age / dur); }
  return k ? { ca: 1.2 + amt * k * k } : {};
}

/** A whip-pan entrance at t0: the scene slides in from `dir` (-1 left, 1 right) over dur; returns a px offset to
 *  translate the scene's layers by (the final render's sub-frames streak it). 0 after dur. */
export function whipIn(t: number, t0: number, dir = 1, dur = 0.14, dist = 1920): number {
  const u = (t - t0) / dur;
  if (u >= 1 || u < 0) return 0;
  return dir * dist * Math.pow(1 - u, 3);
}

/** Merge post overrides: zooms multiply, shakes add, cas and flashes take the max, the rest last-wins. */
export function mergePost(...ps: (PostOverrides | undefined | void)[]): PostOverrides {
  const out: PostOverrides = {};
  for (const p of ps) {
    if (!p) continue;
    for (const [k, v] of Object.entries(p) as [keyof PostOverrides, any][]) {
      if (k === 'zoom') out.zoom = (out.zoom ?? 1) * (v as number);
      else if (k === 'shake') { const s = out.shake ?? [0, 0]; out.shake = [s[0] + v[0], s[1] + v[1]]; }
      else if (k === 'ca' || k === 'flash') (out as any)[k] = Math.max((out as any)[k] ?? 0, v as number);
      else (out as any)[k] = v;
    }
  }
  return out;
}
