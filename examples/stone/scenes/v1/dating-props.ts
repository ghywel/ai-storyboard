// Props for v1's `dating` plate (pre-chorus 2, Pigou's paradox as a TV dating segment, TREATMENT-v1.md): the heart
// partition "SWEET NOTHINGS" that comes down from the flies, wedding bells and confetti, the couple's living room for
// the before/after split screen, the INCOME METER (a giant coin-op meter whose dial measures paid time), coins, the
// slide-whistle squiggle, Rai's host stool and the alarm clock she holds up (it reads 4:00, the woman's hour).
// Canvas2D in the 1920x1080 logical frame, y down, pure functions of t.
import { W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import { clamp, ease, frameIdx } from '../../engine/util';
import { h01 } from '../_rai';
import { FAM, TAU, rgbaHex, mixHex } from '../_motifs';
import { star4 } from '../_manga';
import { cast } from './_cast';
import { ledText, lowerThird, balancedRows } from './_studio';
import type { Line } from '../../engine/lyrics';

type C2 = CanvasRenderingContext2D;

// ------------------------------------------------------------------ the camera on both layers

export interface Cam2 { x?: number; y?: number; zoom?: number; rot?: number }
/** withCam for the main and the glow layer together: (W/2 + x, H/2 + y) lands at the frame's centre, zoomed. */
export function cam2(c: C2, g: C2, cam: Cam2, draw: () => void) {
  for (const k of [c, g]) {
    k.save();
    k.translate(W / 2, H / 2); k.rotate(cam.rot ?? 0); k.scale(cam.zoom ?? 1, cam.zoom ?? 1);
    k.translate(-W / 2 - (cam.x ?? 0), -H / 2 - (cam.y ?? 0));
  }
  draw();
  g.restore(); c.restore();
}
/** A camera centred on the set point (px, py) at `zoom`. */
export const camOn = (px: number, py: number, zoom: number): Cam2 => ({ x: px - W / 2, y: py - H / 2, zoom });

// ------------------------------------------------------------------ the heart partition

/** The classic heart curve, centred, width 2s: points for 0..n (theta 0 = the top notch, pi = the tip). */
export function heartPts(s: number, n = 72): [number, number][] {
  const k = s / 16, out: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const th = (i / n) * TAU;
    const x = 16 * Math.sin(th) ** 3, y = 13 * Math.cos(th) - 5 * Math.cos(2 * th) - 2 * Math.cos(3 * th) - Math.cos(4 * th);
    out.push([x * k, -(y + 2.5) * k]);
  }
  return out;
}

/**
 * The dating segment's partition: a padded pink heart with a chasing bulb border, hung from the flies on two cables,
 * the segment's title "SWEET NOTHINGS" across it. `open` 0..1 slides its halves apart (the couple see each other).
 */
export function heartScreen(c: C2, g: C2, x: number, y: number, s: number, t: number, o: { open?: number; title?: [string, string] } = {}) {
  const open = clamp(o.open ?? 0), pts = heartPts(s), n = pts.length - 1;
  const title = o.title ?? ['SWEET', 'NOTHINGS'];
  // the cables to the flies
  c.strokeStyle = '#2a2236'; c.lineWidth = 4;
  for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(x + sx * s * 0.55 + sx * open * s * 1.4, y - s * 0.75); c.lineTo(x + sx * s * 0.55 + sx * open * s * 0.6, -400); c.stroke(); }
  for (const side of [-1, 1]) {
    const dx = side * open * s * 1.35, rot = side * open * 0.18;
    c.save(); g.save();
    for (const k of [c, g]) { k.translate(x + dx, y); k.rotate(rot); }
    // this half's outline: along the curve from the notch to the tip, then back up the middle
    const half = () => {
      c.beginPath();
      const a = side > 0 ? 0 : n / 2, b = side > 0 ? n / 2 : n;
      for (let i = a; i <= b; i++) { const [px, py] = pts[i]!; i === a ? c.moveTo(px, py) : c.lineTo(px, py); }
      c.closePath();
    };
    // satin: a pink gradient, quilted
    half();
    const gr = c.createLinearGradient(-s, -s, s, s);
    gr.addColorStop(0, '#ff8fc0'); gr.addColorStop(0.5, '#ff4f9a'); gr.addColorStop(1, '#b8226a');
    c.fillStyle = gr; c.fill();
    c.save(); half(); c.clip();
    c.strokeStyle = 'rgba(120,10,60,0.35)'; c.lineWidth = 3;
    for (let k = -6; k <= 6; k++) {
      c.beginPath(); c.moveTo(k * s * 0.3 - s, -s * 1.2); c.lineTo(k * s * 0.3 + s, s * 1.2); c.stroke();
      c.beginPath(); c.moveTo(k * s * 0.3 + s, -s * 1.2); c.lineTo(k * s * 0.3 - s, s * 1.2); c.stroke();
    }
    c.fillStyle = 'rgba(255,240,250,0.9)';
    for (let k = -6; k <= 6; k++) for (let j = -6; j <= 6; j++) { // the buttons of the quilting
      const bx = (k + j) * s * 0.15, by = (j - k) * s * 0.15 * 2;
      c.beginPath(); c.arc(bx, by, 3, 0, TAU); c.fill();
    }
    // the title, split down the middle with the heart
    c.font = font(FAM.hook(), s * 0.36); c.textAlign = 'center'; c.textBaseline = 'middle';
    const k1 = Math.min(1, (s * 1.45) / c.measureText(title[1]).width);
    for (const [i, line] of title.entries()) {
      const fs = s * (i ? 0.36 * k1 : 0.3), yy = -s * 0.42 + i * s * 0.42;
      c.font = font(FAM.hook(), fs);
      c.fillStyle = '#5a0f33'; c.fillText(line, 4, yy + 4);
      c.fillStyle = '#fff4fa'; c.fillText(line, 0, yy);
    }
    c.restore();
    half(); c.strokeStyle = '#7a1446'; c.lineWidth = 6; c.stroke();
    // the bulbs along this half's curve
    const a = side > 0 ? 0 : n / 2, b = side > 0 ? n / 2 : n;
    for (let i = a; i <= b; i += 3) {
      const [px, py] = pts[i]!, chase = 0.55 + 0.45 * Math.sin(t * 11 - i * 0.7);
      c.fillStyle = mixHex('#6a4a3a', HEX.gold, chase); c.beginPath(); c.arc(px, py, 7, 0, TAU); c.fill();
      g.fillStyle = rgbaHex(HEX.gold, 0.45 * chase); g.beginPath(); g.arc(px, py, 15, 0, TAU); g.fill();
    }
    g.restore(); c.restore();
  }
}

// ------------------------------------------------------------------ wedding bells, confetti, the ring

/** Two gold wedding bells under a pink bow, swinging against each other, ringing from t0 (ring lines). */
export function weddingBells(c: C2, g: C2, x: number, y: number, s: number, t: number, t0: number) {
  const age = t - t0;
  if (age < 0) return;
  const drop = ease.outBack(clamp(age / 0.3)), yy = y - (1 - drop) * 300;
  c.strokeStyle = '#ff9fc8'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(x, yy - 400); c.lineTo(x, yy - s * 0.6); c.stroke();
  for (const side of [-1, 1]) {
    const sw = side * (0.25 + 0.35 * Math.sin(age * 9) * Math.exp(-age * 0.6)) + side * 0.15;
    c.save(); c.translate(x + side * s * 0.12, yy - s * 0.5); c.rotate(sw);
    const bg = c.createLinearGradient(-s * 0.5, 0, s * 0.5, 0);
    bg.addColorStop(0, '#b8862e'); bg.addColorStop(0.45, '#ffe27a'); bg.addColorStop(1, '#a8741e');
    c.fillStyle = bg;
    c.beginPath(); c.moveTo(-s * 0.08, 0); c.quadraticCurveTo(-s * 0.36, s * 0.15, -s * 0.42, s * 0.85); c.lineTo(s * 0.42, s * 0.85); c.quadraticCurveTo(s * 0.36, s * 0.15, s * 0.08, 0); c.closePath(); c.fill();
    c.fillStyle = '#8a5a14'; c.beginPath(); c.ellipse(0, s * 0.85, s * 0.44, s * 0.08, 0, 0, TAU); c.fill();
    c.fillStyle = '#5a3a0c'; c.beginPath(); c.arc(Math.sin(age * 9 + side) * s * 0.1, s * 0.92, s * 0.08, 0, TAU); c.fill();
    c.restore();
    // ring lines
    const ring = Math.abs(Math.sin(age * 9));
    if (ring > 0.6) {
      c.strokeStyle = rgbaHex(HEX.gold, ring); c.lineWidth = 4; c.lineCap = 'round';
      for (let k = 0; k < 3; k++) {
        const a = side * (0.5 + k * 0.4), r0 = s * 1.0, r1 = s * 1.3;
        c.beginPath(); c.moveTo(x + Math.sin(a) * r0, yy + s * 0.2 - Math.cos(a) * r0 * 0.4); c.lineTo(x + Math.sin(a) * r1, yy + s * 0.2 - Math.cos(a) * r1 * 0.4); c.stroke();
      }
      g.fillStyle = rgbaHex(HEX.gold, 0.25 * ring); g.beginPath(); g.arc(x + side * s * 0.3, yy, s * 0.7, 0, TAU); g.fill();
    }
  }
  // the bow
  c.fillStyle = HEX.pink;
  c.beginPath(); c.ellipse(x - s * 0.18, yy - s * 0.6, s * 0.2, s * 0.11, -0.3, 0, TAU); c.ellipse(x + s * 0.18, yy - s * 0.6, s * 0.2, s * 0.11, 0.3, 0, TAU); c.fill();
  c.beginPath(); c.arc(x, yy - s * 0.6, s * 0.07, 0, TAU); c.fillStyle = '#d93a82'; c.fill();
}

const CONF = [HEX.pink, HEX.yellow, HEX.cyan, '#ffffff', HEX.lime, '#ff8a2a'];
/** Confetti drifting down from t0 (under water: slow, fluttering), across [x0, x1]. */
export function confetti(c: C2, t: number, t0: number, n = 90, x0 = 0, x1 = W, seed = 5, from: [number, number] = [W / 2, H * 0.2]) {
  const age = t - t0;
  if (age < 0) return;
  for (let i = 0; i < n; i++) {
    const d = h01(i, seed) * 0.15, a = age - d;
    if (a < 0) continue;
    // a party-popper burst from `from`, then a slow flutter down
    const b = ease.outCubic(clamp(a / 0.35));
    const tx = x0 + (x1 - x0) * h01(i, seed, 2), ty = -20 + H * 0.6 * h01(i, seed, 6);
    const x = from[0] + (tx - from[0]) * b + 40 * Math.sin(a * 2.5 + i), y = from[1] + (ty - from[1]) * b + a * (90 + 90 * h01(i, seed, 3));
    if (y > H + 30) continue;
    const flip = Math.sin(a * (5 + 4 * h01(i, seed, 4)) + i);
    c.save(); c.translate(x, y); c.rotate(a * 2 + i);
    c.fillStyle = CONF[i % CONF.length]!;
    c.fillRect(-7, -4 * Math.abs(flip) - 1, 14, 8 * Math.abs(flip) + 2);
    c.restore();
  }
}

/** A gold ring with a diamond (the wedding ring; the ring motif), at (x, y), radius r. */
export function ring(c: C2, g: C2, x: number, y: number, r: number, t: number) {
  c.strokeStyle = HEX.gold; c.lineWidth = r * 0.28;
  c.beginPath(); c.ellipse(x, y, r, r * 0.8, 0, 0, TAU); c.stroke();
  c.fillStyle = '#dff6ff';
  c.beginPath(); c.moveTo(x, y - r * 0.8 - r * 0.7); c.lineTo(x + r * 0.45, y - r * 0.8 - r * 0.25); c.lineTo(x, y - r * 0.8 + r * 0.05); c.lineTo(x - r * 0.45, y - r * 0.8 - r * 0.25); c.closePath(); c.fill();
  star4(c, x + r * 0.35, y - r * 1.5, r * (0.5 + 0.25 * Math.sin(t * 12)), '#ffffff');
  g.fillStyle = rgbaHex('#ffffff', 0.4); g.beginPath(); g.arc(x, y - r, r * 1.2, 0, TAU); g.fill();
}

// ------------------------------------------------------------------ coins, the slide whistle

/** A gold coin with a £, spinning (spin in radians), radius r. */
export function coin(c: C2, x: number, y: number, r: number, spin: number) {
  const w = Math.abs(Math.cos(spin)) * r + 2;
  c.fillStyle = '#a8741e'; c.beginPath(); c.ellipse(x + 2, y + 2, w, r, 0, 0, TAU); c.fill();
  c.fillStyle = '#ffd23f'; c.beginPath(); c.ellipse(x, y, w, r, 0, 0, TAU); c.fill();
  c.strokeStyle = '#c99a2a'; c.lineWidth = r * 0.12; c.beginPath(); c.ellipse(x, y, w * 0.78, r * 0.78, 0, 0, TAU); c.stroke();
  if (w > r * 0.45) {
    c.save(); c.translate(x, y); c.scale(w / r, 1);
    c.font = font(FAM.hook(), r * 1.1); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#a8741e';
    c.fillText('£', 0, r * 0.06);
    c.restore();
  }
}

/**
 * Coins raining from t0 over `dur` across [x0, x1], landing on floorY (one bounce, then lying there). Under water they
 * fall at a stately pace.
 */
export function coinRain(c: C2, g: C2, t: number, t0: number, o: { n?: number; x0?: number; x1?: number; floorY?: number; dur?: number; r?: number; seed?: number } = {}) {
  const n = o.n ?? 40, x0 = o.x0 ?? 0, x1 = o.x1 ?? W, fy = o.floorY ?? H * 0.75, dur = o.dur ?? 1.5, r0 = o.r ?? 16, seed = o.seed ?? 3;
  for (let i = 0; i < n; i++) {
    const ti = t0 + h01(i, seed) * dur, a = t - ti;
    if (a < 0) continue;
    const r = r0 * (0.7 + 0.6 * h01(i, seed, 1));
    const x = x0 + (x1 - x0) * h01(i, seed, 2), v = 620 + 300 * h01(i, seed, 3);
    const land = (fy + 20 * h01(i, seed, 4) - -60) / v;
    let y: number, spin: number;
    if (a < land) { y = -60 + v * a; spin = a * (8 + 6 * h01(i, seed, 5)) + i; }
    else {
      const b = a - land, hop = 0.32;
      y = fy + 20 * h01(i, seed, 4) - (b < hop ? 4 * 60 * (b / hop) * (1 - b / hop) : 0);
      spin = b < hop ? (land * (8 + 6 * h01(i, seed, 5)) + i) + b * 10 : Math.PI / 2 * 0.85;
    }
    coin(c, x, y, r, spin);
    if (a < land) { g.fillStyle = rgbaHex(HEX.gold, 0.25); g.beginPath(); g.arc(x, y, r * 1.6, 0, TAU); g.fill(); }
  }
}

/** A jackpot: coins shooting up out of (x, y) at t0, arcing and falling to floorY, where they lie. */
export function coinBurst(c: C2, g: C2, t: number, t0: number, x: number, y: number, o: { n?: number; floorY?: number; r?: number; seed?: number; spread?: number } = {}) {
  const n = o.n ?? 30, fy = o.floorY ?? H * 0.72, r0 = o.r ?? 14, seed = o.seed ?? 21, sp = o.spread ?? 1;
  for (let i = 0; i < n; i++) {
    const a = t - t0 - 0.03 * (i % 6);
    if (a < 0) continue;
    const vx = (h01(i, seed) - 0.5) * 900 * sp, vy = -(700 + 500 * h01(i, seed, 1)), gr = 1500;
    const r = r0 * (0.75 + 0.5 * h01(i, seed, 2)), floor = fy + 26 * h01(i, seed, 3);
    // when it lands: y + vy a + gr a^2 / 2 = floor
    const A = gr / 2, B = vy, C0 = y - floor, land = (-B + Math.sqrt(B * B - 4 * A * C0)) / (2 * A);
    const aa = Math.min(a, land), px = x + vx * aa, py = y + vy * aa + A * aa * aa;
    coin(c, px, py, r, a < land ? a * (9 + 5 * h01(i, seed, 4)) + i : Math.PI / 2 * 0.86);
    if (a < land) { g.fillStyle = rgbaHex(HEX.gold, 0.22); g.beginPath(); g.arc(px, py, r * 1.6, 0, TAU); g.fill(); }
  }
}

/** The slide-whistle squiggle: a wavy line drawn from (x0, y0) down to (x1, y1) as u goes 0 -> 1, with notes. */
export function slideWhistle(c: C2, x0: number, y0: number, x1: number, y1: number, u: number, col: string = HEX.yellow) {
  if (u <= 0) return;
  const n = 80, m = Math.floor(n * clamp(u));
  c.save();
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath();
  for (let i = 0; i <= m; i++) {
    const v = i / n, wob = Math.sin(v * TAU * 5) * 40 * (1 - 0.4 * v);
    const x = x0 + (x1 - x0) * v + wob, y = y0 + (y1 - y0) * ease.inQuad(v);
    i ? c.lineTo(x, y) : c.moveTo(x, y);
  }
  c.strokeStyle = HEX.ink; c.lineWidth = 20; c.stroke();
  c.strokeStyle = col; c.lineWidth = 11; c.stroke();
  c.restore();
  c.font = font(FAM.hook(), 54); c.textAlign = 'center'; c.textBaseline = 'middle';
  for (let k = 0; k < 3; k++) {
    const v = clamp(u * 1.2 - k * 0.25);
    if (v <= 0) continue;
    c.fillStyle = rgbaHex(HEX.yellow, 1 - v * 0.5);
    c.fillText(k % 2 ? '♪' : '♫', x0 + 90 + (x1 - x0) * v * 0.8 + k * 30, y0 + (y1 - y0) * v * 0.7 - 40);
  }
}

// ------------------------------------------------------------------ the INCOME METER

/**
 * The INCOME METER: a giant coin-op meter on a post (a parking meter's cousin: put money in, it counts time). A round
 * dial in £ (needle 0..1 over £0..£25k), a lime LED odometer, a coin slot. `back` > 0 spins the needle the wrong way
 * (anticlockwise, turns), with motion arcs. Feet (the post's base) at (x, y); s = 1 is ~330 px tall.
 */
export function incomeMeter(c: C2, g: C2, x: number, y: number, s: number, t: number, o: { needle?: number; odo?: string; back?: number; odoCol?: string; label?: boolean } = {}) {
  const hy = y - 270 * s, R = 78 * s;
  // the post and its base
  c.fillStyle = '#1a1622'; c.beginPath(); c.ellipse(x, y, 46 * s, 12 * s, 0, 0, TAU); c.fill();
  const pg = c.createLinearGradient(x - 12 * s, 0, x + 12 * s, 0);
  pg.addColorStop(0, '#2e2a38'); pg.addColorStop(0.4, '#6a6478'); pg.addColorStop(1, '#25212e');
  c.fillStyle = pg; c.fillRect(x - 12 * s, hy + R * 0.8, 24 * s, y - hy - R * 0.8);
  // the head: a brass dome housing
  const bg = c.createLinearGradient(x - R * 1.2, 0, x + R * 1.2, 0);
  bg.addColorStop(0, '#7a5a2e'); bg.addColorStop(0.35, '#e0b866'); bg.addColorStop(1, '#6a4a22');
  c.fillStyle = bg;
  c.beginPath(); c.moveTo(x - R * 1.18, hy + R * 1.35); c.lineTo(x - R * 1.18, hy - R * 0.3); c.arc(x, hy - R * 0.3, R * 1.18, Math.PI, 0); c.lineTo(x + R * 1.18, hy + R * 1.35); c.closePath(); c.fill();
  c.strokeStyle = '#4a3214'; c.lineWidth = 3 * s; c.stroke();
  // the dial face
  c.fillStyle = '#f4ecd8'; c.beginPath(); c.arc(x, hy - R * 0.2, R, 0, TAU); c.fill();
  c.strokeStyle = '#4a3214'; c.lineWidth = 4 * s; c.stroke();
  c.strokeStyle = '#2a1d14'; c.lineCap = 'round';
  const A0 = -Math.PI * 0.75, A1 = Math.PI * 0.75; // clockwise from up
  for (let k = 0; k <= 10; k++) {
    const a = A0 + (A1 - A0) * (k / 10), r0 = R * (k % 2 ? 0.82 : 0.74);
    c.lineWidth = (k % 2 ? 2 : 4) * s;
    c.beginPath(); c.moveTo(x + Math.sin(a) * r0, hy - R * 0.2 - Math.cos(a) * r0); c.lineTo(x + Math.sin(a) * R * 0.92, hy - R * 0.2 - Math.cos(a) * R * 0.92); c.stroke();
  }
  c.font = font(FAM.monoB(), 13 * s); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#2a1d14';
  ['£0', '£10k', '£20k'].forEach((lb, i) => { const a = A0 + (A1 - A0) * (i * 0.4); c.fillText(lb, x + Math.sin(a) * R * 0.56, hy - R * 0.2 - Math.cos(a) * R * 0.56); });
  c.fillStyle = '#c0392b'; c.font = font(FAM.monoB(), 11 * s); c.fillText('PAID TIME', x, hy + R * 0.33);
  // the needle
  const back = o.back ?? 0;
  const a = A0 + (A1 - A0) * clamp(o.needle ?? 0) - back * TAU;
  if (back > 0.05) { // the wrong way: motion arcs anticlockwise
    c.strokeStyle = 'rgba(192,57,43,0.45)'; c.lineWidth = 5 * s;
    for (let k = 1; k <= 3; k++) { c.beginPath(); c.arc(x, hy - R * 0.2, R * (0.4 + 0.12 * k), a - Math.PI / 2, a - Math.PI / 2 + 0.5 + 0.2 * k); c.stroke(); }
  }
  c.strokeStyle = '#c0392b'; c.lineWidth = 6 * s;
  c.beginPath(); c.moveTo(x - Math.sin(a) * R * 0.12, hy - R * 0.2 + Math.cos(a) * R * 0.12); c.lineTo(x + Math.sin(a) * R * 0.86, hy - R * 0.2 - Math.cos(a) * R * 0.86); c.stroke();
  c.fillStyle = '#2a1d14'; c.beginPath(); c.arc(x, hy - R * 0.2, 7 * s, 0, TAU); c.fill();
  // glass glint
  c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(x - R * 0.42, hy - R * 0.62, R * 0.22, R * 0.1, -0.6, 0, TAU); c.fill();
  // the LED odometer under the dial
  const ow = R * 1.7, oh = 30 * s, oy = hy + R * 0.95;
  c.fillStyle = '#0c0a12'; c.beginPath(); c.roundRect(x - ow / 2, oy - oh / 2, ow, oh, 5 * s); c.fill();
  ledText(c, g, o.odo ?? '£0', x, oy, 26 * s, o.odoCol ?? HEX.lime, () => 1, Math.max(2, 2.6 * s));
  // the coin slot and a label plate
  c.fillStyle = '#2a1d14'; c.fillRect(x + R * 1.18 - 4 * s, hy + R * 0.25, 8 * s, 30 * s);
  if (o.label !== false) {
    c.fillStyle = '#2a1d14'; c.beginPath(); c.roundRect(x - 62 * s, hy + R * 1.45, 124 * s, 24 * s, 4 * s); c.fill();
    c.font = font(FAM.monoB(), 14 * s); c.fillStyle = HEX.gold; c.fillText('INCOME METER', x, hy + R * 1.45 + 12 * s);
  }
  return { dial: { x, y: hy - R * 0.2, r: R }, slot: { x: x + R * 1.18, y: hy + R * 0.25 } };
}

// ------------------------------------------------------------------ Rai's host stool and alarm clock

/** A chrome bar stool with a pink cushion: the seat's top at (x, y), the base on floorY. */
export function hostStool(c: C2, x: number, y: number, floorY: number, s = 1) {
  c.strokeStyle = '#9aa0b0'; c.lineWidth = 9 * s; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, y + 10 * s); c.lineTo(x, floorY - 8 * s); c.stroke();
  c.lineWidth = 4 * s; c.beginPath(); c.ellipse(x, y + (floorY - y) * 0.55, 30 * s, 8 * s, 0, 0, TAU); c.stroke();
  c.fillStyle = '#6a7080'; c.beginPath(); c.ellipse(x, floorY - 4 * s, 44 * s, 10 * s, 0, 0, TAU); c.fill();
  c.fillStyle = '#d93a82'; c.beginPath(); c.ellipse(x, y + 6 * s, 52 * s, 16 * s, 0, 0, TAU); c.fill();
  c.fillStyle = HEX.pink; c.beginPath(); c.ellipse(x, y, 50 * s, 14 * s, 0, 0, TAU); c.fill();
}

/**
 * Rai's alarm clock (a drawRai prop: origin at her hand, R her disc radius): a red twin-bell alarm clock held up, its
 * face at 4:00 (the woman's hour, the stopped clock on the wreck), ringing (the bells shiver, ring lines) when `ring`.
 */
export function alarmClock(t: number, ring: boolean, size = 0.42) {
  return (c: C2, R: number) => {
    const r = size * R, k = frameIdx(t);
    c.save();
    c.translate(0, -r * 1.05);
    if (ring) c.rotate(0.09 * (h01(k, 3) - 0.5) * 2);
    // legs and bells
    c.strokeStyle = '#7a1414'; c.lineWidth = r * 0.12; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-r * 0.55, r * 0.75); c.lineTo(-r * 0.75, r * 1.05); c.moveTo(r * 0.55, r * 0.75); c.lineTo(r * 0.75, r * 1.05); c.stroke();
    for (const s of [-1, 1]) {
      const jig = ring ? 0.12 * Math.sin(t * 70 + s) : 0;
      c.save(); c.translate(s * r * 0.62, -r * 0.88); c.rotate(s * 0.5 + jig);
      c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(0, 0, r * 0.38, Math.PI, 0); c.closePath(); c.fill();
      c.strokeStyle = '#a8741e'; c.lineWidth = r * 0.06; c.stroke();
      c.restore();
    }
    c.strokeStyle = '#2a1d14'; c.lineWidth = r * 0.08; c.beginPath(); c.moveTo(0, -r * 1.0); c.lineTo(ring ? r * 0.2 * Math.sin(t * 60) : 0, -r * 1.25); c.stroke();
    // the body and face
    c.fillStyle = '#e8322a'; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.strokeStyle = '#7a1414'; c.lineWidth = r * 0.08; c.stroke();
    c.fillStyle = '#fff8e8'; c.beginPath(); c.arc(0, 0, r * 0.78, 0, TAU); c.fill();
    c.strokeStyle = '#2a1d14';
    for (let h = 0; h < 12; h++) { const a = (h / 12) * TAU; c.lineWidth = r * (h % 3 ? 0.03 : 0.06); c.beginPath(); c.moveTo(Math.sin(a) * r * 0.6, -Math.cos(a) * r * 0.6); c.lineTo(Math.sin(a) * r * 0.7, -Math.cos(a) * r * 0.7); c.stroke(); }
    c.lineWidth = r * 0.09; c.lineCap = 'round';
    const ha = (4 / 12) * TAU; // 4:00
    c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(ha) * r * 0.4, -Math.cos(ha) * r * 0.4); c.moveTo(0, 0); c.lineTo(0, -r * 0.58); c.stroke();
    c.strokeStyle = '#c0392b'; c.lineWidth = r * 0.03; // the second hand, ticking forwards
    const sa = Math.floor(t * 2) / 60 * TAU;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(sa) * r * 0.66, -Math.cos(sa) * r * 0.66); c.stroke();
    c.fillStyle = '#2a1d14'; c.beginPath(); c.arc(0, 0, r * 0.07, 0, TAU); c.fill();
    if (ring) { // ring lines
      c.strokeStyle = '#fff6c8'; c.lineWidth = r * 0.07;
      for (const s of [-1, 1]) for (let j = 0; j < 3; j++) {
        const a = -Math.PI / 2 + s * (0.55 + j * 0.32), r0 = r * 1.45, r1 = r * (1.75 + 0.1 * Math.sin(t * 40 + j));
        c.beginPath(); c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); c.stroke();
      }
    }
    c.restore();
  };
}

// ------------------------------------------------------------------ the couple's room (the split screen)

export interface RoomOpts {
  /** 0..1: the floor's gleam sweeping across (on "floors"). */
  gleam?: number;
  /** When the couple's hearts pop (on "love"). */
  loveT0?: number;
  /** When the clock's tick lands (on "clock"): the hands jump and the clock rings. */
  tickT0?: number;
}

/**
 * The couple's living room, inside the rect (x, y, w, h): wallpaper, a window on the evening sea with a rai stone in
 * the garden, the wall clock, their photo, a lamp, the sofa where he reads the paper (GDP on its front page), and her
 * mopping the floor with a bucket. Drawn identically in both halves of the split: only the strip under it differs.
 */
export function room(c: C2, g: C2, x: number, y: number, w: number, h: number, t: number, o: RoomOpts = {}) {
  const s = h / 700, fy = y + h * 0.74;
  c.save();
  c.beginPath(); c.rect(x, y, w, h); c.clip();
  // the wall: warm striped paper, a picture rail
  const wg = c.createLinearGradient(0, y, 0, fy);
  wg.addColorStop(0, '#e9c98e'); wg.addColorStop(1, '#d6a96a');
  c.fillStyle = wg; c.fillRect(x, y, w, fy - y);
  c.fillStyle = 'rgba(190,120,70,0.22)';
  for (let k = 0; k < w / (44 * s); k++) c.fillRect(x + k * 44 * s, y, 16 * s, fy - y);
  c.fillStyle = '#8a5a34'; c.fillRect(x, y + h * 0.16, w, 8 * s);
  // the window: the evening sea, a palm, and a rai stone leaning by the garden path (a clue: her worth, like a stone's, is agreed)
  const wx = x + w * 0.2, wy = y + h * 0.24, ww = w * 0.2, wh = h * 0.3;
  const sky = c.createLinearGradient(0, wy, 0, wy + wh);
  sky.addColorStop(0, '#3b2f78'); sky.addColorStop(0.55, '#ff8a6a'); sky.addColorStop(0.56, '#2a5a8a'); sky.addColorStop(1, '#1a3a5a');
  c.fillStyle = sky; c.fillRect(wx, wy, ww, wh);
  c.fillStyle = '#1a1020'; // palm and stone in silhouette
  c.beginPath(); c.moveTo(wx + ww * 0.78, wy + wh); c.quadraticCurveTo(wx + ww * 0.7, wy + wh * 0.5, wx + ww * 0.82, wy + wh * 0.22); c.lineTo(wx + ww * 0.86, wy + wh * 0.24); c.quadraticCurveTo(wx + ww * 0.76, wy + wh * 0.5, wx + ww * 0.84, wy + wh); c.fill();
  for (let k = 0; k < 5; k++) { const a = -2.6 + k * 0.55; c.beginPath(); c.ellipse(wx + ww * 0.84 + Math.cos(a) * ww * 0.12, wy + wh * 0.22 + Math.sin(a) * ww * 0.06 + ww * 0.03, ww * 0.13, ww * 0.03, a, 0, TAU); c.fill(); }
  c.fillStyle = '#9a8c74'; c.beginPath(); c.ellipse(wx + ww * 0.3, wy + wh * 0.84, ww * 0.15, ww * 0.17, -0.12, 0, TAU); c.fill();
  c.fillStyle = '#c9bb9c'; c.beginPath(); c.ellipse(wx + ww * 0.29, wy + wh * 0.835, ww * 0.13, ww * 0.15, -0.12, 0, TAU); c.fill();
  c.fillStyle = '#2a5a8a'; c.beginPath(); c.arc(wx + ww * 0.29, wy + wh * 0.83, ww * 0.04, 0, TAU); c.fill();
  c.strokeStyle = '#f4efe1'; c.lineWidth = 8 * s; c.strokeRect(wx, wy, ww, wh);
  c.lineWidth = 4 * s; c.beginPath(); c.moveTo(wx + ww / 2, wy); c.lineTo(wx + ww / 2, wy + wh); c.moveTo(wx, wy + wh / 2); c.lineTo(wx + ww, wy + wh / 2); c.stroke();
  c.fillStyle = '#c0392b'; // curtains
  for (const sx of [-1, 1]) {
    const cx = sx < 0 ? wx - 14 * s : wx + ww + 14 * s;
    c.beginPath(); c.moveTo(cx - 22 * s, wy - 16 * s); c.lineTo(cx + 22 * s, wy - 16 * s); c.quadraticCurveTo(cx + 8 * s * sx, wy + wh * 0.6, cx + 26 * s, wy + wh + 30 * s); c.lineTo(cx - 26 * s, wy + wh + 30 * s); c.quadraticCurveTo(cx - 8 * s * sx, wy + wh * 0.6, cx - 22 * s, wy - 16 * s); c.fill();
  }
  // the wall clock (the same clock: its tick lands on "clock")
  const kx = x + w * 0.56, ky = y + h * 0.3, kr = 54 * s;
  const tick = o.tickT0 !== undefined && t >= o.tickT0 ? 1 : 0, ring = o.tickT0 !== undefined && t >= o.tickT0 && t < o.tickT0 + 0.6;
  c.fillStyle = '#5a3a24'; c.beginPath(); c.arc(kx, ky, kr + 8 * s, 0, TAU); c.fill();
  c.fillStyle = '#fbf3e0'; c.beginPath(); c.arc(kx, ky, kr, 0, TAU); c.fill();
  c.strokeStyle = '#2a1d14';
  for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; c.lineWidth = (k % 3 ? 2 : 4) * s; c.beginPath(); c.moveTo(kx + Math.sin(a) * kr * 0.78, ky - Math.cos(a) * kr * 0.78); c.lineTo(kx + Math.sin(a) * kr * 0.92, ky - Math.cos(a) * kr * 0.92); c.stroke(); }
  const mins = 50 + tick * 5, hr = 2 + mins / 60; // ten to three, then five to: the working day ticking on
  c.lineCap = 'round';
  c.lineWidth = 6 * s; c.beginPath(); c.moveTo(kx, ky); c.lineTo(kx + Math.sin(hr / 12 * TAU) * kr * 0.5, ky - Math.cos(hr / 12 * TAU) * kr * 0.5); c.stroke();
  c.lineWidth = 4 * s; c.beginPath(); c.moveTo(kx, ky); c.lineTo(kx + Math.sin(mins / 60 * TAU) * kr * 0.78, ky - Math.cos(mins / 60 * TAU) * kr * 0.78); c.stroke();
  const sec = Math.floor(t * 2.333) / 60 * TAU; // the second hand on the beat
  c.strokeStyle = '#c0392b'; c.lineWidth = 2 * s; c.beginPath(); c.moveTo(kx, ky); c.lineTo(kx + Math.sin(sec) * kr * 0.85, ky - Math.cos(sec) * kr * 0.85); c.stroke();
  if (ring) {
    c.strokeStyle = 'rgba(42,29,20,0.7)'; c.lineWidth = 4 * s;
    for (const sx of [-1, 1]) for (let j = 0; j < 2; j++) { c.beginPath(); c.arc(kx, ky, kr * (1.35 + 0.25 * j), sx < 0 ? Math.PI * 0.85 : -Math.PI * 0.15, sx < 0 ? Math.PI * 1.15 : Math.PI * 0.15); c.stroke(); }
  }
  // their photo on the wall: two silhouettes and a heart (the same love, before and after)
  const px = x + w * 0.78, py = y + h * 0.3;
  c.fillStyle = '#b98a3e'; c.fillRect(px - 44 * s, py - 54 * s, 88 * s, 108 * s);
  c.fillStyle = '#f4dcc8'; c.fillRect(px - 36 * s, py - 46 * s, 72 * s, 92 * s);
  c.fillStyle = '#3a2a3a';
  for (const sx of [-1, 1]) { c.beginPath(); c.arc(px + sx * 14 * s, py - 6 * s, 9 * s, 0, TAU); c.fill(); c.beginPath(); c.ellipse(px + sx * 14 * s, py + 28 * s, 14 * s, 22 * s, 0, 0, TAU); c.fill(); }
  c.fillStyle = HEX.pink; c.font = font(FAM.hook(), 22 * s); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('♥', px, py - 30 * s);
  // the floor: honey boards, gleaming
  c.fillStyle = '#b97a3e'; c.fillRect(x, fy, w, y + h - fy);
  c.strokeStyle = 'rgba(90,50,20,0.5)'; c.lineWidth = 2 * s;
  for (let k = 1; k < 7; k++) { const yy = fy + (y + h - fy) * (k / 7) ** 1.4; c.beginPath(); c.moveTo(x, yy); c.lineTo(x + w, yy); c.stroke(); }
  for (let k = 0; k < 12; k++) { const xx = x + w * (k / 12) + (k % 2) * 30 * s; c.beginPath(); c.moveTo(xx, fy); c.lineTo(xx + (xx - (x + w / 2)) * 0.3, y + h); c.stroke(); }
  c.fillStyle = '#6a3a1a'; c.fillRect(x, fy - 12 * s, w, 14 * s);
  const gl = o.gleam ?? 0;
  if (gl > 0 && gl < 1) { // a gleam sweeping across the clean floor
    const gx = x + w * (-0.2 + 1.4 * gl);
    const sg = c.createLinearGradient(gx - 80 * s, 0, gx + 80 * s, 0);
    sg.addColorStop(0, 'rgba(255,255,240,0)'); sg.addColorStop(0.5, 'rgba(255,255,240,0.55)'); sg.addColorStop(1, 'rgba(255,255,240,0)');
    c.fillStyle = sg; c.beginPath(); c.moveTo(gx - 60 * s, fy); c.lineTo(gx + 20 * s, fy); c.lineTo(gx + 120 * s, y + h); c.lineTo(gx - 10 * s, y + h); c.closePath(); c.fill();
    star4(c, x + w * 0.42, fy + 70 * s, 22 * s * Math.sin(gl * Math.PI), '#ffffff');
    star4(c, x + w * 0.66, fy + 120 * s, 16 * s * Math.sin(gl * Math.PI), '#ffffff');
  }
  // the lamp, glowing
  const lx = x + w * 0.93;
  c.strokeStyle = '#3a2a24'; c.lineWidth = 6 * s; c.beginPath(); c.moveTo(lx, fy + 10 * s); c.lineTo(lx, fy - 300 * s); c.stroke();
  c.fillStyle = '#ffd98a'; c.beginPath(); c.moveTo(lx - 40 * s, fy - 300 * s); c.lineTo(lx + 40 * s, fy - 300 * s); c.lineTo(lx + 26 * s, fy - 350 * s); c.lineTo(lx - 26 * s, fy - 350 * s); c.closePath(); c.fill();
  g.fillStyle = 'rgba(255,200,120,0.08)'; g.beginPath(); g.arc(lx, fy - 310 * s, 90 * s, 0, TAU); g.fill();
  // the sofa, and him on it, reading the paper (GDP on its front page)
  const sx0 = x + w * 0.56, sx1 = x + w * 0.88, sy = fy + 40 * s;
  c.fillStyle = '#7a2a4a';
  c.beginPath(); c.roundRect(sx0, sy - 150 * s, sx1 - sx0, 90 * s, 24 * s); c.fill();
  c.fillStyle = '#922f58'; c.beginPath(); c.roundRect(sx0 - 10 * s, sy - 80 * s, sx1 - sx0 + 20 * s, 60 * s, 16 * s); c.fill();
  c.fillStyle = '#6a2240'; c.beginPath(); c.roundRect(sx0 - 24 * s, sy - 110 * s, 40 * s, 92 * s, 14 * s); c.roundRect(sx1 - 16 * s, sy - 110 * s, 40 * s, 92 * s, 14 * s); c.fill();
  const hx = x + w * 0.7, hh = 300 * s;
  cast(c, 'husband', hx, sy + 40 * s, hh, 'seated', { col: '#241a2a', t, emote: o.loveT0 !== undefined ? 'heart' : undefined, emoteT0: o.loveT0 });
  // the newspaper held open before him
  c.save(); c.translate(hx + 30 * s, sy + 40 * s - hh * 0.6); c.rotate(-0.06);
  c.fillStyle = '#f4f1ea'; c.fillRect(-46 * s, -40 * s, 92 * s, 70 * s);
  c.fillStyle = '#2a1d14'; c.font = font(FAM.hook(), 20 * s); c.textAlign = 'center'; c.fillText('GDP', 0, -20 * s);
  c.fillStyle = 'rgba(42,29,20,0.45)'; for (let k = 0; k < 4; k++) c.fillRect(-38 * s, -4 * s + k * 9 * s, 76 * s, 3 * s);
  c.strokeStyle = 'rgba(42,29,20,0.4)'; c.lineWidth = 1.5 * s; c.beginPath(); c.moveTo(0, -40 * s); c.lineTo(0, 30 * s); c.stroke();
  c.restore();
  // her: the headscarf, mopping (hand for hand the same in both halves), and her bucket
  const mx = x + w * 0.34, mh = 320 * s, stroke = Math.sin(t * Math.PI * 2.333);
  c.fillStyle = '#5a6a7a'; c.beginPath(); c.moveTo(mx - 95 * s, fy + 112 * s); c.lineTo(mx - 140 * s, fy + 112 * s); c.lineTo(mx - 146 * s, fy + 50 * s); c.lineTo(mx - 89 * s, fy + 50 * s); c.closePath(); c.fill();
  c.strokeStyle = '#3a4a5a'; c.lineWidth = 3 * s; c.beginPath(); c.arc(mx - 117 * s, fy + 50 * s, 28 * s, Math.PI, 0); c.stroke();
  const mopX = mx + 46 * s + stroke * 40 * s, mopY = fy + 120 * s;
  c.strokeStyle = '#8a6a44'; c.lineWidth = 7 * s; c.lineCap = 'round';
  c.beginPath(); c.moveTo(mx + 14 * s, fy + 120 * s - mh * 0.62); c.lineTo(mopX, mopY); c.stroke();
  c.fillStyle = '#e8e0cc'; c.beginPath(); c.ellipse(mopX, mopY + 4 * s, 34 * s, 10 * s, 0, 0, TAU); c.fill();
  c.fillStyle = 'rgba(160,210,240,0.35)'; c.beginPath(); c.ellipse(mopX, mopY + 14 * s, 60 * s, 8 * s, 0, 0, TAU); c.fill();
  cast(c, 'housekeeper', mx, fy + 120 * s, mh, 'hug', { col: '#241a2a', t, prop: false, emote: o.loveT0 !== undefined ? 'heart' : 'music', emoteT0: o.loveT0 ?? -1e9 });
  c.restore();
}

/** The strip under one half of the split: a mono label and an LED value. */
export function strip(c: C2, g: C2, x: number, y: number, w: number, h: number, label: string, value: string, col: string, lit = 1) {
  c.fillStyle = '#0c0a12'; c.beginPath(); c.roundRect(x, y, w, h, 8); c.fill();
  c.strokeStyle = rgbaHex(col, 0.7); c.lineWidth = 3; c.stroke();
  c.font = font(FAM.monoB(), Math.round(h * 0.3)); c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillStyle = 'rgba(244,241,234,0.85)';
  c.fillText(label, x + h * 0.3, y + h / 2);
  ledText(c, g, value, x + w * 0.76, y + h / 2, h * 0.62, col, () => lit);
}

// ------------------------------------------------------------------ the lyric

/**
 * The plate's sung lines as the show's lower third, one at a time: each from its lead until the next line's first
 * word, where the next plate slides in. The line before the cut is carried while its tail still rings over the cut
 * (it continues from the plate before, so it does not slide); the plate's first own line slides in at the cut at the
 * latest.
 */
export function lyricSeq(c: C2, t: number, start: number, lines: Line[], prev: Line | null, g?: C2) {
  const carry = prev && prev.end + 0.35 > start ? prev : null;
  const seq = [...(carry ? [carry] : []), ...lines];
  const on = (k: number) => (k === 0 ? (carry ? -1e9 : Math.max(seq[0]!.words[0]!.start - 0.4, start)) : seq[k]!.words[0]!.start - 0.06);
  let i = -1;
  for (let k = 0; k < seq.length; k++) if (t >= on(k)) i = k;
  if (i < 0) return;
  const swap = on(i), u = clamp((t - swap) / 0.18), dx = -(1 - ease.outExpo(u)) * 120;
  if (g) { // nothing glows over the lower third: clear the glow layer under its plate (lowerThird's own geometry)
    c.save(); c.font = font(FAM.bold(), 48);
    const line = seq[i]!, sp = c.measureText(' ').width, ws = line.words.map((x) => c.measureText(x.w).width);
    const rows = balancedRows(c, line, W - 360), rw = Math.max(...rows.map((r) => r.reduce((a, k) => a + ws[k]!, 0) + sp * (r.length - 1))), ph = rows.length * 48 * 1.2 + 34;
    c.restore();
    g.clearRect(W / 2 + dx - rw / 2 - 55 - 30 - ph * 0.2, H - 112 - ph / 2 - 8, rw + 110 + 60 + ph * 0.4, ph + 16);
  }
  c.save();
  c.globalAlpha = clamp((t - swap) / 0.03);
  c.translate(dx, 0);
  lowerThird(c, seq[i]!, t, { until: i < seq.length - 1 ? seq[i + 1]!.words[0]!.start : undefined });
  c.restore();
}
