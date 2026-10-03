// The kitchen up the road at 4 am, for v1's outside broadcast (uptheroad.ts). Drawn in grey values for the kit's
// night-vision pass (it tints everything green), so light and dark are what matter: the woman and her child are a dark
// silhouette against the window's streetlight; the wall clock, the fridge door and the bill catch the camera's light.
// Clues: the clock at 4:00 (the wreck's porthole clock stopped at the same hour), the thermometer on the sill, seat C7's
// lunchbox on the counter (the only thing that keeps its colour: see lunchbox()), the bill under a star magnet
// (£82.40), the child's crayon drawing of Rai on the fridge (she watches the show: the last shot's TV), a high chair.
// World coordinates are the 1920x1080 frame; the OB camera zooms in on them.
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import { clamp, ease, frameIdx } from '../../engine/util';
import { h01 } from '../_rai';
import { FAM, TAU, emote, rgbaHex, mixHex } from '../_motifs';
import { puff } from '../_manga';
import { cast } from './_cast';

type C2 = CanvasRenderingContext2D;

/** Where things are in the kitchen (world px): the OB camera's targets. */
export const K = {
  window: { x: 780, y: 140, w: 500, h: 430 },
  clock: { x: 1430, y: 215, r: 66 },
  woman: { x: 1010, y: 940, h: 600 },
  sill: { x: 1210, y: 584 },
  lunchbox: { x: 300, y: 652 },
  fridge: { x: 440, y: 240, w: 290, h: 700 },
  bill: { x: 530, y: 330 },
  drawing: { x: 650, y: 600 },
};

export interface KitchenOpts {
  /** the thermometer's display glows (on "fever") */
  fever?: number;
  /** her sigh and the child's tear, from these times */
  sighT0?: number;
  tearT0?: number;
  /** draw the lunchbox in grey here (the colour pass draws it after the night vision) */
  lunchGrey?: boolean;
}

/** The kitchen and the woman rocking her feverish child, in grey values. */
export function kitchen(c: C2, t: number, o: KitchenOpts = {}) {
  const k = frameIdx(t);
  // the back wall and the floor
  c.fillStyle = '#4a4a4a'; c.fillRect(-400, -400, 2720, 1880);
  c.fillStyle = '#3a3a3a'; c.fillRect(-400, 940, 2720, 600);
  c.strokeStyle = '#2e2e2e'; c.lineWidth = 3;
  for (let x = -400; x < 2320; x += 120) { c.beginPath(); c.moveTo(x, 940); c.lineTo(x - 140, 1480); c.stroke(); }
  // the tiled splashback behind the counter
  c.fillStyle = '#585858'; c.fillRect(-400, 380, 840, 270);
  c.strokeStyle = '#4a4a4a'; c.lineWidth = 2;
  for (let y = 380; y < 650; y += 45) { c.beginPath(); c.moveTo(-400, y); c.lineTo(440, y); c.stroke(); }
  for (let x = -400; x < 440; x += 60) { c.beginPath(); c.moveTo(x, 380); c.lineTo(x, 650); c.stroke(); }
  // upper cabinets
  c.fillStyle = '#5e5e5e'; c.fillRect(-400, 90, 820, 270);
  c.strokeStyle = '#3c3c3c'; c.lineWidth = 4;
  for (let x = -400; x < 400; x += 205) { c.strokeRect(x + 10, 100, 190, 250); c.fillStyle = '#7a7a7a'; c.fillRect(x + 172, 300, 12, 40); }

  // the window: the street at night outside, a streetlight, rain running down the glass
  const Wn = K.window;
  c.fillStyle = '#6e6e6e'; c.fillRect(Wn.x - 26, Wn.y - 26, Wn.w + 52, Wn.h + 52);
  const out = c.createRadialGradient(Wn.x + Wn.w * 0.78, Wn.y + Wn.h * 0.2, 10, Wn.x + Wn.w * 0.7, Wn.y + Wn.h * 0.4, Wn.w * 0.9);
  out.addColorStop(0, '#f2f2f2'); out.addColorStop(0.25, '#bdbdbd'); out.addColorStop(1, '#5a5a5a');
  c.fillStyle = out; c.fillRect(Wn.x, Wn.y, Wn.w, Wn.h);
  // houses opposite in silhouette, one window lit (someone else awake)
  c.fillStyle = '#4a4a4a';
  c.beginPath(); c.moveTo(Wn.x, Wn.y + Wn.h * 0.62);
  for (const [dx, dy] of [[0.12, 0.5], [0.22, 0.42], [0.3, 0.5], [0.46, 0.5], [0.56, 0.38], [0.64, 0.48], [0.82, 0.48], [1, 0.4]]) c.lineTo(Wn.x + Wn.w * dx!, Wn.y + Wn.h * dy!);
  c.lineTo(Wn.x + Wn.w, Wn.y + Wn.h); c.lineTo(Wn.x, Wn.y + Wn.h); c.closePath(); c.fill();
  c.fillStyle = '#d8d8d8'; c.fillRect(Wn.x + Wn.w * 0.36, Wn.y + Wn.h * 0.6, 22, 26);
  // the streetlight's post
  c.fillStyle = '#3a3a3a'; c.fillRect(Wn.x + Wn.w * 0.86, Wn.y + Wn.h * 0.25, 8, Wn.h * 0.75);
  // rain on the glass
  c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2;
  for (let i = 0; i < 26; i++) {
    const rx = Wn.x + h01(i, 61) * Wn.w, ry = Wn.y + ((h01(i, 62) * Wn.h + t * (90 + 120 * h01(i, 63))) % Wn.h), l = 14 + 30 * h01(i, 64);
    c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx - 2, Math.min(Wn.y + Wn.h, ry + l)); c.stroke();
  }
  // the half-drawn blind and the frame's cross
  c.fillStyle = '#7e7e7e'; c.fillRect(Wn.x, Wn.y, Wn.w, Wn.h * 0.16);
  c.strokeStyle = '#5e5e5e'; c.lineWidth = 2; for (let y = Wn.y + 8; y < Wn.y + Wn.h * 0.16; y += 9) { c.beginPath(); c.moveTo(Wn.x, y); c.lineTo(Wn.x + Wn.w, y); c.stroke(); }
  c.fillStyle = '#6e6e6e'; c.fillRect(Wn.x + Wn.w / 2 - 9, Wn.y, 18, Wn.h); c.fillRect(Wn.x, Wn.y + Wn.h * 0.5 - 9, Wn.w, 18);
  // the sill, and the thermometer on it, its display glowing on "fever"
  c.fillStyle = '#7a7a7a'; c.fillRect(Wn.x - 40, Wn.y + Wn.h + 6, Wn.w + 80, 22);
  const fev = clamp(o.fever ?? 0);
  c.save(); c.translate(K.sill.x, K.sill.y); c.rotate(-0.12);
  c.fillStyle = '#9a9a9a'; c.beginPath(); c.roundRect(-46, -12, 92, 24, 10); c.fill();
  c.fillStyle = mixHex('#3a3a3a', '#ffffff', 0.3 + 0.7 * fev * (0.8 + 0.2 * Math.sin(t * 9))); c.fillRect(-32, -7, 46, 14);
  c.fillStyle = '#2a2a2a'; c.font = font(FAM.monoB(), 12); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('39.4', -9, 1);
  c.restore();

  // the counter and its cabinets
  c.fillStyle = '#6a6a6a'; c.fillRect(-400, 650, 850, 24);
  c.fillStyle = '#525252'; c.fillRect(-400, 674, 840, 266);
  c.strokeStyle = '#3a3a3a'; c.lineWidth = 4;
  for (let x = -400; x < 400; x += 165) { c.strokeRect(x + 10, 690, 150, 230); c.fillStyle = '#7a7a7a'; c.fillRect(x + 132, 710, 10, 40); }
  // the kettle, steaming (she has just boiled it), and a mug
  c.fillStyle = '#7c7c7c'; c.beginPath(); c.moveTo(60, 650); c.lineTo(70, 560); c.quadraticCurveTo(120, 535, 170, 560); c.lineTo(180, 650); c.closePath(); c.fill();
  c.strokeStyle = '#7c7c7c'; c.lineWidth = 10; c.beginPath(); c.arc(120, 560, 46, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
  c.beginPath(); c.moveTo(70, 590); c.lineTo(30, 560); c.stroke();
  for (let i = 0; i < 4; i++) { const u = (t * 0.5 + i / 4) % 1; puff(c, 32 + 10 * Math.sin(t + i), 540 - u * 120, 10 + 18 * u, `rgba(220,220,220,${0.35 * (1 - u)})`); }
  c.fillStyle = '#8a8a8a'; c.fillRect(186, 604, 40, 46); c.strokeStyle = '#8a8a8a'; c.lineWidth = 7; c.beginPath(); c.arc(228, 626, 11, -1.2, 1.2); c.stroke();
  if (o.lunchGrey !== false) lunchbox(c, K.lunchbox.x, K.lunchbox.y, 1.6, 0);

  // the wall clock at 4:00, its second hand still going
  const C = K.clock;
  c.fillStyle = '#6a6a6a'; c.beginPath(); c.arc(C.x, C.y, C.r + 10, 0, TAU); c.fill();
  c.fillStyle = '#d6d6d6'; c.beginPath(); c.arc(C.x, C.y, C.r, 0, TAU); c.fill();
  c.strokeStyle = '#3a3a3a'; c.lineWidth = 4;
  for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; c.beginPath(); c.moveTo(C.x + Math.cos(a) * C.r * 0.82, C.y + Math.sin(a) * C.r * 0.82); c.lineTo(C.x + Math.cos(a) * C.r * 0.94, C.y + Math.sin(a) * C.r * 0.94); c.stroke(); }
  c.lineCap = 'round'; c.lineWidth = 8;
  c.beginPath(); c.moveTo(C.x, C.y); c.lineTo(C.x + Math.sin((TAU * 4) / 12) * C.r * 0.5, C.y - Math.cos((TAU * 4) / 12) * C.r * 0.5); c.stroke();   // hour at 4
  c.lineWidth = 5; c.beginPath(); c.moveTo(C.x, C.y); c.lineTo(C.x, C.y - C.r * 0.78); c.stroke();                                                  // minute at 12
  const sa = (Math.floor(t) / 60) * TAU;
  c.strokeStyle = '#1a1a1a'; c.lineWidth = 2; c.beginPath(); c.moveTo(C.x, C.y); c.lineTo(C.x + Math.sin(sa) * C.r * 0.86, C.y - Math.cos(sa) * C.r * 0.86); c.stroke();
  c.fillStyle = '#2a2a2a'; c.beginPath(); c.arc(C.x, C.y, 6, 0, TAU); c.fill();

  // the fridge: the bill under a star magnet, the child's drawing, a photo
  const F = K.fridge;
  c.fillStyle = '#8e8e8e'; c.beginPath(); c.roundRect(F.x, F.y, F.w, F.h, 18); c.fill();
  c.strokeStyle = '#6a6a6a'; c.lineWidth = 4; c.beginPath(); c.moveTo(F.x, F.y + F.h * 0.3); c.lineTo(F.x + F.w, F.y + F.h * 0.3); c.stroke();
  c.fillStyle = '#6a6a6a'; c.fillRect(F.x + 22, F.y + 60, 12, 110); c.fillRect(F.x + 22, F.y + F.h * 0.3 + 40, 12, 160);
  bill(c, K.bill.x, K.bill.y, 1);
  crayonRai(c, K.drawing.x, K.drawing.y, 1, t);
  c.fillStyle = '#b4b4b4'; c.save(); c.translate(F.x + 80, F.y + F.h * 0.62); c.rotate(-0.06); c.fillRect(0, 0, 80, 62); c.fillStyle = '#5a5a5a'; c.beginPath(); c.arc(28, 30, 12, 0, TAU); c.arc(52, 34, 9, 0, TAU); c.fill(); c.restore();

  // the door to the hall, ajar on the dark; her coat and a small one on the hooks, small wellies
  c.fillStyle = '#5a5a5a'; c.fillRect(1590, 190, 300, 760);
  c.fillStyle = '#222222'; c.fillRect(1610, 210, 260, 730);
  c.fillStyle = '#626262'; c.beginPath(); c.moveTo(1610, 210); c.lineTo(1800, 240); c.lineTo(1800, 920); c.lineTo(1610, 940); c.closePath(); c.fill();
  c.fillStyle = '#8a8a8a'; c.beginPath(); c.arc(1770, 590, 9, 0, TAU); c.fill();
  c.fillStyle = '#7a7a7a'; c.fillRect(1500, 330, 60, 8);
  c.fillStyle = '#3e3e3e';
  c.beginPath(); c.moveTo(1508, 338); c.lineTo(1488, 560); c.lineTo(1540, 560); c.lineTo(1524, 338); c.closePath(); c.fill();     // her coat
  c.beginPath(); c.moveTo(1540, 338); c.lineTo(1528, 450); c.lineTo(1562, 450); c.lineTo(1552, 338); c.closePath(); c.fill();     // the child's
  c.fillStyle = '#2e2e2e'; c.beginPath(); c.roundRect(1500, 900, 22, 40, 4); c.roundRect(1526, 900, 22, 40, 4); c.fill();          // wellies

  // a high chair by the window (a small child lives here)
  c.strokeStyle = '#2a2a2a'; c.lineWidth = 9; c.lineCap = 'round';
  const hx = 1340, hy = 940;
  c.beginPath(); c.moveTo(hx - 50, hy); c.lineTo(hx - 20, hy - 220); c.moveTo(hx + 50, hy); c.lineTo(hx + 20, hy - 220); c.stroke();
  c.fillStyle = '#2a2a2a'; c.fillRect(hx - 52, hy - 236, 104, 18); c.fillRect(hx - 40, hy - 330, 12, 100); c.fillRect(hx + 28, hy - 330, 12, 100);
  c.fillRect(hx - 80, hy - 270, 70, 10);

  // the woman, rocking her child by the window
  const W0 = K.woman, rock = 0.045 * Math.sin(t * 2.4);
  c.save(); c.translate(W0.x, W0.y); c.rotate(rock); c.translate(-W0.x, -W0.y);
  const sighing = o.sighT0 !== undefined && t > o.sighT0;
  cast(c, 'woman', W0.x, W0.y, W0.h, 'hold', { col: '#0a0a0a', t, headTilt: 0.18 + (sighing ? 0.12 : 0), emote: sighing ? 'sigh' : undefined, emoteT0: o.sighT0 });
  // the child in her arms: bunches, and a tear on the cheek (the fever)
  const u = W0.h / 100, chx = W0.x + 13 * u, chy = W0.y - 77 * u;
  c.fillStyle = '#0a0a0a'; c.beginPath(); c.arc(chx - 5.5 * u, chy - 4 * u, 2.6 * u, 0, TAU); c.arc(chx + 5.5 * u, chy - 4 * u, 2.6 * u, 0, TAU); c.fill();
  if (o.tearT0 !== undefined && t > o.tearT0) emote(c, chx - 2 * u, chy, 6 * u, 'tear', t, o.tearT0);
  c.restore();
  void k;
}

/** Seat C7's lunchbox (the same one: red, a yellow star sticker, a blank white name label), at (x, y), scale s. `col` 0
 *  draws it in grey (night vision), 1 in its own colours. */
export function lunchbox(c: C2, x: number, y: number, s: number, col: number) {
  const red = mixHex('#7a7a7a', '#ff5a5f', col), handle = mixHex('#4a4a4a', '#8a2a2e', col), star = mixHex('#c8c8c8', HEX.yellow, col);
  const yy = y - 38 * s;   // sits on y
  c.fillStyle = red; c.beginPath(); c.roundRect(x - 34 * s, yy - 10 * s, 68 * s, 48 * s, 8 * s); c.fill();
  c.strokeStyle = handle; c.lineWidth = 6 * s; c.beginPath(); c.arc(x, yy - 10 * s, 16 * s, Math.PI, 0); c.stroke();
  c.fillStyle = star; c.beginPath(); c.arc(x - 12 * s, yy + 12 * s, 9 * s, 0, TAU); c.fill();
  c.fillStyle = '#ffffff'; c.fillRect(x + 4 * s, yy + 4 * s, 22 * s, 12 * s);
}

/** The bill under a star-shaped magnet: DUE £82.40. */
function bill(c: C2, x: number, y: number, s: number) {
  c.save(); c.translate(x, y); c.rotate(0.05); c.scale(s, s);
  c.fillStyle = '#e6e6e6'; c.fillRect(-60, -10, 120, 160);
  c.fillStyle = '#5a5a5a'; c.font = font(FAM.monoB(), 14); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('ENERGY', 0, 20);
  for (let i = 0; i < 4; i++) { c.fillStyle = '#a0a0a0'; c.fillRect(-46, 38 + i * 14, 92 - (i % 2) * 30, 5); }
  c.fillStyle = '#2a2a2a'; c.font = font(FAM.monoB(), 13); c.fillText('DUE', -26, 112);
  c.font = font(FAM.bold(), 26); c.fillText('£82.40', 6, 132);
  c.restore();
  c.save(); c.translate(x - 4, y - 8); c.rotate(0.3);
  c.fillStyle = '#c8c8c8';
  c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 9 : 20; i ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill();
  c.restore();
}

/** The child's crayon drawing of Rai (round head, the disc with its hole, a starfish, a big smile) on the fridge. */
function crayonRai(c: C2, x: number, y: number, s: number, t: number) {
  c.save(); c.translate(x, y); c.rotate(-0.07); c.scale(s, s);
  c.fillStyle = '#e2e2e2'; c.fillRect(-62, -80, 124, 150);
  c.strokeStyle = '#4a4a4a'; c.lineWidth = 3.5; c.lineCap = 'round';
  c.beginPath(); c.arc(0, -30, 20, 0, TAU); c.stroke();                         // the head
  c.beginPath(); c.arc(0, 20, 30, 0, TAU); c.stroke();                          // the disc
  c.beginPath(); c.arc(0, 18, 9, 0, TAU); c.stroke();                           // the hole, coloured in (the heart)
  c.fillStyle = '#9a9a9a'; c.beginPath(); c.arc(0, 18, 7, 0, TAU); c.fill();
  c.beginPath(); c.arc(0, -28, 10, 0.3, Math.PI - 0.3); c.stroke();             // the smile
  c.fillStyle = '#4a4a4a'; c.beginPath(); c.arc(-7, -35, 2.5, 0, TAU); c.arc(7, -35, 2.5, 0, TAU); c.fill();
  c.strokeStyle = '#6a6a6a'; c.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i / 5) * TAU; c.moveTo(12, -48); c.lineTo(12 + Math.cos(a) * 9, -48 + Math.sin(a) * 9); } c.stroke();  // the starfish
  c.strokeStyle = '#7a7a7a'; c.lineWidth = 2; c.beginPath(); c.moveTo(-50, 62); for (let i = 0; i < 10; i++) c.lineTo(-50 + i * 11, 62 + (i % 2 ? -5 : 0)); c.stroke();   // the sea
  c.restore();
  c.fillStyle = '#c8c8c8'; c.beginPath(); c.arc(x, y - 78, 8, 0, TAU); c.fill();   // its magnet
  void t;
}

/** OB camera corner brackets around a target box (screen px), snapping in from bigger at t0. */
export function brackets(c: C2, x: number, y: number, w: number, h: number, t: number, t0: number, col = 'rgba(220,255,220,0.9)') {
  const age = t - t0;
  if (age < 0) return;
  const k = 1 + 0.5 * (1 - ease.outCubic(clamp(age / 0.16))), cx = x + w / 2, cy = y + h / 2, hw = (w / 2) * k, hh = (h / 2) * k, l = Math.min(w, h) * 0.22;
  c.save(); c.strokeStyle = col; c.lineWidth = 4; c.globalAlpha *= age < 0.3 && Math.floor(age * 20) % 2 ? 0.4 : 1;
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
    c.beginPath(); c.moveTo(cx + sx * hw, cy + sy * hh - sy * l); c.lineTo(cx + sx * hw, cy + sy * hh); c.lineTo(cx + sx * hw - sx * l, cy + sy * hh); c.stroke();
  }
  c.restore();
}

export { rgbaHex };
