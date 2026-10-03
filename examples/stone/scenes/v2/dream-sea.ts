// `dream`'s pieces that are not the room: the word STONE in pink bubbles, the storybooks flying off the shelf like a
// shoal (their pictures glowing), and the pink ring (the ledger's 0) on its way to Rai's heart.
import { HEX } from '../../engine/palette';
import { clamp, ease } from '../../engine/util';
import { h01 } from '../_rai';
import { TAU, rgbaHex } from '../_motifs';
import { SPINES, RM, openBook } from './fever-room';

type C2 = CanvasRenderingContext2D;

/** The word in bubbles: each bubble rises into its place from below (staggered from t0), wobbles, and pops at tPop. */
export function wordBubbles(c: C2, g: C2, t: number, pts: [number, number][], t0: number, tPop: number) {
  pts.forEach(([x, y], i) => {
    const ti = t0 + 0.12 * (x - 400) / 500 + 0.25 * h01(i, 81), a = clamp((t - ti) / 0.45);
    if (a <= 0) return;
    const pop = tPop + 0.25 * h01(i, 82), pu = (t - pop) / 0.2;
    if (pu > 1) return;
    const r = 5.5 + 2.5 * h01(i, 83), rise = (1 - ease.outCubic(a)) * 120;
    const bx = x + 3 * Math.sin(t * 2.3 + i), by = y + rise + 2 * Math.sin(t * 1.9 + i * 1.3) - (t - ti) * 6;
    if (pu > 0) { // pop: a ring flying out and fading
      c.strokeStyle = rgbaHex(HEX.pink, 0.8 * (1 - pu)); c.lineWidth = 1.5; c.beginPath(); c.arc(bx, by, r * (1 + pu * 1.4), 0, TAU); c.stroke();
      return;
    }
    c.fillStyle = rgbaHex(HEX.pink, 0.22 * a); c.strokeStyle = rgbaHex('#ffd0e6', 0.95 * a); c.lineWidth = 1.8;
    c.beginPath(); c.arc(bx, by, r, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = rgbaHex('#ffffff', 0.8 * a); c.beginPath(); c.arc(bx - r * 0.35, by - r * 0.35, r * 0.22, 0, TAU); c.fill();
    g.fillStyle = rgbaHex(HEX.pink, 0.18 * a); g.beginPath(); g.arc(bx, by, r * 1.6, 0, TAU); g.fill();
  });
}

/**
 * The storybooks lift off the shelf one after another and swim out into the flooded room in a slow ring, flapping
 * their covers like wings; `glow` lights their pictures. Room coordinates.
 */
export function flyingBooks(c: C2, g: C2, t: number, t0: number, glowT: number) {
  SPINES.forEach(([bx, w, h, col, icon], i) => {
    const sx = bx + w / 2, sy = RM.shelf.y - h / 2;
    const u = ease.inOutCubic(clamp((t - t0 - 0.12 * i) / 1.3));
    const ang = (i / SPINES.length) * TAU + t * 0.22, ox = 640 + Math.cos(ang) * 330, oy = 330 + Math.sin(ang) * 120;
    const x = sx + (ox - sx) * u + 8 * Math.sin(t * 1.4 + i) * u, y = sy + (oy - sy) * u - Math.sin(u * Math.PI) * 60 + 6 * Math.sin(t * 1.7 + i * 2);
    const flap = u <= 0 ? 0 : 0.55 + 0.4 * Math.sin(t * 4.2 + i * 1.3), op = Math.min(1, u * 3) * flap;
    const gl = clamp((t - glowT - 0.08 * i) / 0.4);
    if (u <= 0) return;
    openBook(c, g, t, x, y, 0.9 + 0.5 * u, Math.sin(t * 1.1 + i) * 0.25 * u, Math.max(0.12, op), gl, i, col, icon);
  });
}

/** The pink ring (the ledger's 0, lifted off its page): a glowing ellipse of radius r at (x, y). */
export function pinkRing(c: C2, g: C2, x: number, y: number, r: number, t: number, a = 1, w = 0.24) {
  if (a <= 0 || r <= 0.5) return;
  const ry = r * 1.0, rx = r * 0.78, lw = Math.max(2, r * w);
  c.save(); c.strokeStyle = rgbaHex(HEX.pink, a); c.lineWidth = lw; c.lineCap = 'round';
  c.beginPath(); c.ellipse(x, y, rx, ry, 0.08 * Math.sin(t * 1.3), 0, TAU); c.stroke();
  c.strokeStyle = rgbaHex('#ffd0e6', 0.7 * a); c.lineWidth = lw * 0.3;
  c.beginPath(); c.ellipse(x, y, rx, ry, 0.08 * Math.sin(t * 1.3), -2.2, -1.2); c.stroke();
  c.restore();
  g.strokeStyle = rgbaHex(HEX.pink, 0.5 * a); g.lineWidth = lw * 2.4;
  g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.stroke();
  for (let k = 0; k < 6; k++) { // sparkles trailing round it
    const an = t * 2 + (k / 6) * TAU, sx = x + Math.cos(an) * rx * 1.3, sy = y + Math.sin(an) * ry * 1.3;
    g.fillStyle = rgbaHex('#ffe0f0', 0.5 * a * (0.5 + 0.5 * Math.sin(t * 7 + k))); g.beginPath(); g.arc(sx, sy, 2.5, 0, TAU); g.fill();
  }
}
