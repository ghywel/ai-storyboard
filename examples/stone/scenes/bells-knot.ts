// Coprime's bells drawing the gold harmonograph (bells.ts; its first two strikes fall in remember.ts). Nine strikes,
// each gap 1.16x the last (fixed: they come from Coprime's score, not from the song's beat grid). Each strike draws one
// lap of the 3:2 knot, like a real harmonograph's pen: every lap a little smaller and a little turned, the pen fast at
// the strike and slowing, and a pulse of light on the strike.
import { HEX } from '../engine/palette';
import { clamp, ease } from '../engine/util';
import { TAU, harmonograph, rgbaHex, type C2 } from './_motifs';

export const STRIKES = [313.52, 313.95, 314.45, 315.02, 315.69, 316.47, 317.37, 318.41, 319.62];
const DECAY = 0.93, TURN = 0.07;

/** The pulse of light from the strikes (1 at a strike, decaying). */
export function strikePulse(t: number, hl = 0.35): number {
  let v = 0;
  for (const s of STRIKES) if (t >= s) v = Math.max(v, Math.pow(0.5, (t - s) / hl));
  return v;
}
/** How far lap k has drawn at t (0..1). */
export function lapProgress(t: number, k: number): number {
  const s = STRIKES[k]!, gap = (STRIKES[k + 1] ?? s + 1.6) - s;
  return ease.outCubic(clamp((t - s) / Math.min(1.5, gap * 0.98)));
}

/**
 * The knot so far at t: centre (cx, cy), outer radius r, overall alpha a. Laps drawn on the strikes; the pen's tip
 * glows while it draws; each strike brightens the whole figure.
 */
export function drawKnot(c: C2, g: C2, t: number, cx: number, cy: number, r: number, a = 1) {
  const pulse = strikePulse(t);
  for (let k = 0; k < STRIKES.length; k++) {
    const p = lapProgress(t, k);
    if (p <= 0) break;
    const rk = r * Math.pow(DECAY, k), ph = Math.PI / 2 + TURN * k;
    const fresh = Math.pow(0.5, Math.max(0, t - STRIKES[k]!) / 0.6);
    harmonograph(c, cx, cy, rk, { draw: 0.5 * p, phase: ph, col: rgbaHex(HEX.gold, a * (0.55 + 0.35 * fresh)), width: 2.2 });
    harmonograph(g, cx, cy, rk, { draw: 0.5 * p, phase: ph, col: rgbaHex(HEX.gold, a * (0.12 + 0.45 * fresh + 0.25 * pulse)), width: 4 });
    if (p < 1) { // the pen
      const s = p * TAU;
      const x = cx + Math.sin(3 * s + ph) * rk * 1.15, y = cy + Math.sin(2 * s) * rk;
      const gr = g.createRadialGradient(x, y, 0, x, y, 40);
      gr.addColorStop(0, rgbaHex('#fff3c9', a)); gr.addColorStop(1, rgbaHex(HEX.gold, 0));
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, 40, 0, TAU); g.fill();
    }
  }
  // the strike's ring of light, spreading from the centre
  for (const s of STRIKES) {
    const dt = t - s;
    if (dt < 0 || dt > 1.2) continue;
    const u = dt / 1.2;
    g.strokeStyle = rgbaHex(HEX.gold, a * 0.35 * (1 - u)); g.lineWidth = 3 + 10 * (1 - u);
    g.beginPath(); g.arc(cx, cy, r * (0.2 + 1.3 * ease.outCubic(u)), 0, TAU); g.stroke();
  }
}
