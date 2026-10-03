// Props for v1's pitch round (pitch.ts): the iron ship's hatch in the stage-left wing (the set's S.S. IRON HULL plate is
// on its door), the 1 TON crate, the trader's bulk discs (too even: one copy pasted), the conveyor, the bidding paddles,
// the price pedestal, the points board (WHAT MAKES IT WORTH IT?), the buzzer round's scale, loupe and map, the sad
// trombone, and the archive storm clip for the studio screen. Canvas2D, logical 1920x1080, pure functions of t.
import { W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import { clamp, ease, frameIdx } from '../../engine/util';
import { h01 } from '../_rai';
import { FAM, TAU, rgbaHex, mixHex, stone } from '../_motifs';
import { textDots, drawDots, vhs } from './_studio';
import { cast } from './_cast';

type C2 = CanvasRenderingContext2D;

// ------------------------------------------------------------------ small shapes

export function star5(c: C2, x: number, y: number, r: number, rot = 0) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot - Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
    i ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath();
}

function rivets(c: C2, pts: [number, number][], r: number) {
  for (const [x, y] of pts) {
    c.fillStyle = '#5c6270'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.arc(x - r * 0.3, y - r * 0.3, r * 0.4, 0, TAU); c.fill();
  }
}

/** The set's rusted nameplate, exactly as _studio draws it (so the plate on the hatch is the plate on the wall). */
export function nameplate(c: C2, x: number, y: number, rot = -0.05, k = 1) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(k, k);
  c.fillStyle = '#6d4a2c'; c.fillRect(-90, -20, 180, 40);
  c.strokeStyle = '#3d2716'; c.lineWidth = 3; c.strokeRect(-90, -20, 180, 40);
  c.font = font(FAM.monoB(), 20); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#c99a5a';
  c.fillText('S.S. IRON HULL', 0, 1);
  c.restore();
}

// ------------------------------------------------------------------ the hatch

export const HATCH = { x: 150, floor: 800, w: 232, h: 270 };

/**
 * The iron ship's hatch in the stage-left wing: a riveted watertight door in a thick frame, the set's nameplate on it.
 * `open` 0 (shut, flush and dark) .. 1 (swung wide on its left hinge); `glow` the warm light of the hold behind it.
 */
export function hatch(c: C2, g: C2, t: number, open: number, glow: number, spin = 0) {
  const { x, floor, w, h } = HATCH, x0 = x - w / 2, y0 = floor - h, r = 46;
  // the frame (the coaming) and the dark hold behind
  c.fillStyle = '#23262e'; c.beginPath(); c.roundRect(x0 - 22, y0 - 22, w + 44, h + 30, r + 18); c.fill();
  c.strokeStyle = '#3a3f4a'; c.lineWidth = 4; c.stroke();
  rivets(c, Array.from({ length: 14 }, (_, i) => {
    const a = (i / 13) * Math.PI; return [x - Math.cos(a) * (w / 2 + 11), y0 + 40 - Math.sin(a) * 50] as [number, number];
  }).concat(Array.from({ length: 6 }, (_, i) => [[x0 - 11, y0 + 70 + i * 34], [x0 + w + 11, y0 + 70 + i * 34]] as [number, number][]).flat()), 4);
  const hold = c.createLinearGradient(0, y0, 0, floor);
  hold.addColorStop(0, mixHex('#0a0608', '#8a4a1c', glow)); hold.addColorStop(0.6, mixHex('#0a0608', '#d08a44', glow)); hold.addColorStop(1, mixHex('#050304', '#e8b070', glow));
  c.fillStyle = hold; c.beginPath(); c.roundRect(x0, y0, w, h, r); c.fill();
  if (glow > 0.05) {
    // the hold seen through the door: a companionway stair going down, a lamp on a chain
    c.fillStyle = rgbaHex('#6a3a14', 0.55 * glow);
    for (let k = 0; k < 5; k++) c.fillRect(x0 + 40 + k * 14, floor - 24 - k * 34, w - 80 - k * 28, 9);
    c.strokeStyle = rgbaHex('#4a2a10', glow); c.lineWidth = 3; c.beginPath(); c.moveTo(x + 40, y0); c.lineTo(x + 40, y0 + 60); c.stroke();
    c.fillStyle = rgbaHex('#fff4d0', glow); c.beginPath(); c.arc(x + 40, y0 + 68, 10, 0, TAU); c.fill();
    g.fillStyle = rgbaHex('#ffb04a', 0.07 * glow); g.beginPath(); g.roundRect(x0 - 10, y0 - 10, w + 20, h + 14, r); g.fill();
    g.fillStyle = rgbaHex('#ffb04a', 0.12 * glow); g.beginPath(); g.ellipse(x + 150, floor + 6, 220, 30, 0, 0, TAU); g.fill();
  }
  // the door on its left hinge: foreshortened as it swings, its back showing past 90 degrees
  const a = clamp(open) * 1.95, k = Math.cos(a), dw = w * Math.abs(k);
  c.save();
  if (k >= 0) {
    door(c, g, x0, y0, dw, w, h, r, t, spin, true);
  } else {
    c.fillStyle = '#1a1c22'; c.beginPath(); c.roundRect(x0 - dw, y0, dw, h, [r, 0, 0, r]); c.fill();
    c.strokeStyle = '#3a3f4a'; c.lineWidth = 3; c.stroke();
    c.strokeStyle = '#2a2d36'; c.lineWidth = 6;
    for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(x0 - dw, y0 + (i * h) / 4); c.lineTo(x0, y0 + (i * h) / 4); c.stroke(); }
  }
  c.restore();
  // hinges
  c.fillStyle = '#4a4f5a'; c.fillRect(x0 - 8, y0 + 40, 16, 30); c.fillRect(x0 - 8, floor - 70, 16, 30);
}

function door(c: C2, g: C2, x0: number, y0: number, dw: number, w: number, h: number, r: number, t: number, spin: number, front: boolean) {
  const sx = dw / w;
  c.save(); c.translate(x0, y0); c.scale(Math.max(0.02, sx), 1);
  const plate = c.createLinearGradient(0, 0, w, 0);
  plate.addColorStop(0, '#3b404b'); plate.addColorStop(0.5, '#4c525e'); plate.addColorStop(1, '#2e323b');
  c.fillStyle = plate; c.beginPath(); c.roundRect(0, 0, w, h, r); c.fill();
  c.strokeStyle = '#22252c'; c.lineWidth = 4; c.stroke();
  // rust streaks
  for (let i = 0; i < 7; i++) {
    const rx = w * (0.1 + 0.8 * h01(i, 31)), ry = h * (0.15 + 0.6 * h01(i, 32));
    c.fillStyle = rgbaHex('#8a4a22', 0.35); c.fillRect(rx, ry, 4 + 3 * h01(i, 33), 30 + 50 * h01(i, 34));
  }
  rivets(c, Array.from({ length: 8 }, (_, i) => [[14, 30 + i * 30], [w - 14, 30 + i * 30]] as [number, number][]).flat(), 3.5);
  // the porthole (the hold's glow shows through it)
  const pr = 26, px = w / 2, py = 38;
  c.fillStyle = '#b98a3e'; c.beginPath(); c.arc(px, py, pr + 7, 0, TAU); c.fill();
  c.fillStyle = '#ffcf7a'; c.beginPath(); c.arc(px, py, pr, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.4)'; c.beginPath(); c.arc(px - 8, py - 8, 7, 0, TAU); c.fill();
  // the nameplate (as on the wall: the trader's ship)
  nameplate(c, w / 2 - 6, 118, -0.05, Math.min(1, (w - 30) / 180));
  // the wheel that dogs the door shut
  c.save(); c.translate(w / 2, h - 70); c.rotate(spin);
  c.strokeStyle = '#8a1e1e'; c.lineWidth = 9; c.beginPath(); c.arc(0, 0, 40, 0, TAU); c.stroke();
  c.lineWidth = 6; for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI; c.beginPath(); c.moveTo(Math.cos(a) * 40, Math.sin(a) * 40); c.lineTo(-Math.cos(a) * 40, -Math.sin(a) * 40); c.stroke(); }
  c.fillStyle = '#5a1414'; c.beginPath(); c.arc(0, 0, 9, 0, TAU); c.fill();
  c.restore();
  c.restore();
  void g; void t; void front;
}

// ------------------------------------------------------------------ the crate and the bulk discs

/** The trader's shipping crate, bottom-centre at (x, y), width s: planks, iron corners, a "1 TON" stencil. */
export function crate(c: C2, x: number, y: number, s: number, o: { lid?: number; tilt?: number } = {}) {
  const w = s, h = s * 0.78;
  c.save(); c.translate(x, y); c.rotate(o.tilt ?? 0);
  c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(0, 0, w * 0.6, w * 0.06, 0, 0, TAU); c.fill();
  c.fillStyle = '#9a6a3a'; c.fillRect(-w / 2, -h, w, h);
  c.strokeStyle = '#6a4424'; c.lineWidth = Math.max(2, s * 0.012);
  for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(-w / 2, -h + (i * h) / 5); c.lineTo(w / 2, -h + (i * h) / 5); c.stroke(); }
  c.lineWidth = s * 0.05; c.strokeStyle = '#7a5230';
  c.beginPath(); c.moveTo(-w / 2 + s * 0.04, -h + s * 0.04); c.lineTo(w / 2 - s * 0.04, -s * 0.04); c.moveTo(w / 2 - s * 0.04, -h + s * 0.04); c.lineTo(-w / 2 + s * 0.04, -s * 0.04); c.stroke();
  c.strokeStyle = '#4a4f5a'; c.lineWidth = s * 0.06; c.strokeRect(-w / 2 + s * 0.03, -h + s * 0.03, w - s * 0.06, h - s * 0.06);
  // the stencil
  c.fillStyle = HEX.ink; c.font = font(FAM.hook(), s * 0.3); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = 'rgba(18,13,29,0.85)'; c.fillRect(-w * 0.36, -h * 0.68, w * 0.72, h * 0.4);
  c.fillStyle = HEX.bone; c.fillText('1 TON', 0, -h * 0.48);
  c.font = font(FAM.monoB(), s * 0.075); c.fillStyle = 'rgba(30,18,8,0.8)'; c.fillText('IRON HULL CO. · BULK', 0, -h * 0.14);
  if (o.lid) { // the lid swung up
    c.save(); c.translate(-w / 2, -h); c.rotate(-o.lid * 2.0);
    c.fillStyle = '#8a5a30'; c.fillRect(0, -s * 0.06, w, s * 0.06); c.restore();
  }
  c.restore();
}

/**
 * One of the trader's bulk discs: machine-made, so perfectly round, flat grey, a perfectly concentric hole, a cast seam
 * and a serial stamp. Every one is the same (they are copies), which is the point.
 */
export function bulkDisc(c: C2, x: number, y: number, r: number, o: { shine?: number; t?: number } = {}) {
  const hr = r * 0.27, th = r * 0.16;
  c.save(); c.translate(x, y);
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(th * 0.5, r * 0.98, r * 0.9, r * 0.12, 0, 0, TAU); c.fill();
  c.fillStyle = '#6e6c6a'; c.beginPath(); c.arc(th, 0, r, 0, TAU); c.fill();
  const shine = o.shine ?? 0;
  const face = c.createLinearGradient(-r, -r, r, r);
  face.addColorStop(0, mixHex('#b4b1ab', '#f4f6fa', shine)); face.addColorStop(0.5, mixHex('#9d9a94', '#c8ccd6', shine)); face.addColorStop(1, mixHex('#85827c', '#8a90a0', shine));
  c.fillStyle = face; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.moveTo(hr, 0); c.arc(0, 0, hr, 0, TAU); c.fill('evenodd');
  c.strokeStyle = '#5a5854'; c.lineWidth = Math.max(1, r * 0.03);
  c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); c.beginPath(); c.arc(0, 0, hr, 0, TAU); c.stroke();
  c.strokeStyle = 'rgba(80,78,74,0.5)'; c.beginPath(); c.arc(0, 0, r * 0.68, 0, TAU); c.stroke();   // the mould's ring
  c.beginPath(); c.moveTo(-r, 0); c.lineTo(-hr, 0); c.moveTo(hr, 0); c.lineTo(r, 0); c.stroke();   // the cast seam
  c.fillStyle = 'rgba(60,58,54,0.7)'; c.font = font(FAM.monoB(), Math.max(6, r * 0.16)); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('BULK', 0, r * 0.5);
  if (shine > 0) { // a chrome glint sweeping across
    const u = (((o.t ?? 0) * 0.8) % 1.6) - 0.3;
    c.save(); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.clip();
    c.fillStyle = rgbaHex('#ffffff', 0.55 * shine);
    c.beginPath(); c.moveTo(-r + u * 2 * r, -r); c.lineTo(-r + u * 2 * r + r * 0.25, -r); c.lineTo(-r + u * 2 * r - r * 0.35, r); c.lineTo(-r + u * 2 * r - r * 0.6, r); c.closePath(); c.fill();
    c.restore();
  }
  c.restore();
}

/** A conveyor belt from x0 to x1 with its top at y, chevrons running at v px/s; rollers and legs. */
export function conveyor(c: C2, x0: number, x1: number, y: number, t: number, v: number) {
  c.fillStyle = '#2a2a33'; c.fillRect(x0 - 10, y, x1 - x0 + 20, 34);
  c.fillStyle = '#16161c'; c.fillRect(x0, y + 4, x1 - x0, 24);
  c.strokeStyle = '#3c3c48'; c.lineWidth = 4;
  const off = (t * v) % 60;
  for (let x = x0 - 60 + off; x < x1; x += 60) { if (x < x0) continue; c.beginPath(); c.moveTo(x, y + 8); c.lineTo(x + 12, y + 16); c.lineTo(x, y + 24); c.stroke(); }
  for (let x = x0; x <= x1; x += (x1 - x0) / 8) {
    c.fillStyle = '#4a4a56'; c.beginPath(); c.arc(x, y + 17, 12, 0, TAU); c.fill();
    c.fillStyle = '#2a2a33'; c.beginPath(); c.arc(x, y + 17, 4, 0, TAU); c.fill();
  }
  c.fillStyle = '#23232b';
  for (const lx of [x0 + 40, (x0 + x1) / 2, x1 - 40]) c.fillRect(lx - 8, y + 34, 16, 110);
  c.fillStyle = '#e8c24a'; // hazard stripes on the side rail
  for (let x = x0; x < x1; x += 40) { c.beginPath(); c.moveTo(x, y + 30); c.lineTo(x + 20, y + 30); c.lineTo(x + 10, y + 36); c.lineTo(x - 10, y + 36); c.closePath(); c.fill(); }
}

// ------------------------------------------------------------------ the bidding paddles

/** An auction paddle at its handle's end (x, y), raised by `up` (0 down out of sight .. 1 up), the card reading text. */
export function paddle(c: C2, x: number, y: number, s: number, up: number, text: string, t: number, i: number) {
  if (up <= 0.01) return;
  const a = (1 - ease.outBack(clamp(up), 2.2)) * 1.6 + 0.06 * Math.sin(t * 5 + i);
  c.save(); c.translate(x, y); c.rotate(a * (i % 2 ? 1 : -1));
  c.strokeStyle = '#7a5a3a'; c.lineWidth = 7 * s; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -60 * s); c.stroke();
  c.fillStyle = '#f4f1ea'; c.strokeStyle = HEX.ink; c.lineWidth = 4 * s;
  c.beginPath(); c.ellipse(0, -100 * s, 50 * s, 44 * s, 0, 0, TAU); c.fill(); c.stroke();
  c.fillStyle = HEX.ink; c.font = font(FAM.hook(), 38 * s); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(text, 0, -98 * s);
  c.restore();
}

// ------------------------------------------------------------------ the price pedestal

/** A game-show turntable on a column, a velvet cushion, a disc turning on it; centre-bottom (x, y). */
export function pedestal(c: C2, g: C2, x: number, y: number, t: number, s = 1) {
  c.fillStyle = '#2a1830'; c.beginPath(); c.moveTo(x - 80 * s, y); c.lineTo(x - 60 * s, y - 180 * s); c.lineTo(x + 60 * s, y - 180 * s); c.lineTo(x + 80 * s, y); c.closePath(); c.fill();
  c.fillStyle = HEX.gold;
  for (let k = 0; k < 6; k++) { const yy = y - 20 * s - k * 28 * s; c.beginPath(); c.arc(x - 66 * s + k * 3 * s, yy, 5 * s, 0, TAU); c.arc(x + 66 * s - k * 3 * s, yy, 5 * s, 0, TAU); c.fill(); }
  c.fillStyle = '#b98a3e'; c.beginPath(); c.ellipse(x, y - 182 * s, 110 * s, 20 * s, 0, 0, TAU); c.fill();
  c.fillStyle = '#7a1e3a'; c.beginPath(); c.ellipse(x, y - 196 * s, 80 * s, 18 * s, 0, 0, TAU); c.fill();
  // the disc, turning (its face foreshortened, its edge showing)
  const turn = Math.cos(t * 2.2), r = 90 * s;
  c.save(); c.translate(x, y - 196 * s - r); c.scale(0.35 + 0.65 * Math.abs(turn), 1);
  bulkDisc(c, 0, 0, r);
  c.restore();
  g.fillStyle = rgbaHex('#fff3c8', 0.18); g.beginPath(); g.ellipse(x, y - 190 * s, 150 * s, 40 * s, 0, 0, TAU); g.fill();
}

/** A price tag on a string, swinging from (x, y), its face reading `text`. */
export function priceTag(c: C2, x: number, y: number, s: number, t: number, text: string) {
  const a = 0.18 * Math.sin(t * 3.1);
  c.save(); c.translate(x, y); c.rotate(a);
  c.strokeStyle = '#d9cfb8'; c.lineWidth = 2 * s; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 60 * s); c.stroke();
  c.translate(0, 60 * s); c.rotate(-0.25);
  c.fillStyle = '#f4f1ea'; c.strokeStyle = HEX.ink; c.lineWidth = 3 * s;
  c.beginPath(); c.moveTo(-20 * s, 0); c.lineTo(20 * s, 0); c.lineTo(60 * s, 30 * s); c.lineTo(60 * s, 110 * s); c.lineTo(-60 * s, 110 * s); c.lineTo(-60 * s, 30 * s); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = HEX.ink; c.beginPath(); c.arc(0, 16 * s, 6 * s, 0, TAU); c.fill();
  c.font = font(FAM.hook(), 40 * s); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 0, 70 * s);
  c.restore();
}

// ------------------------------------------------------------------ the points board

export interface PointRow { label: string; lit: number; t0: number }

/**
 * The points board, "WHAT MAKES IT WORTH IT?": a wooden game-show board on chains, its header in gold bulbs and four
 * rows that light on the beat (CROSSING 400 km, RISK five stars, HANDS 30, HOURS 6,000). (x, y) top-left, w x h.
 * `flash` 0..1 makes the whole board blaze (the DING).
 */
export function pointsBoard(c: C2, g: C2, x: number, y: number, w: number, h: number, t: number, rows: PointRow[], o: { reef?: number; flash?: number } = {}) {
  const flash = o.flash ?? 0;
  // the chains up into the flies
  c.strokeStyle = '#6a5a3a'; c.lineWidth = 6; c.setLineDash([14, 8]);
  for (const cx of [x + w * 0.15, x + w * 0.85]) { c.beginPath(); c.moveTo(cx, y - 900); c.lineTo(cx, y); c.stroke(); }
  c.setLineDash([]);
  c.fillStyle = '#3a2416'; c.beginPath(); c.roundRect(x, y, w, h, 18); c.fill();
  c.strokeStyle = '#b98a3e'; c.lineWidth = 8; c.stroke();
  // the bulb border, chasing
  const nb = 34;
  for (let i = 0; i < nb; i++) {
    const per = 2 * (w + h), d = (i / nb) * per;
    const [bx, by] = d < w ? [x + d, y] : d < w + h ? [x + w, y + d - w] : d < 2 * w + h ? [x + w - (d - w - h), y + h] : [x, y + h - (d - 2 * w - h)];
    const on = Math.max(flash, 0.55 + 0.45 * Math.sin(t * 10 - i * 0.8));
    c.fillStyle = mixHex('#5a4630', HEX.gold, on); c.beginPath(); c.arc(bx, by, 7, 0, TAU); c.fill();
    if (on > 0.6) { g.fillStyle = rgbaHex(HEX.gold, 0.4 * on); g.beginPath(); g.arc(bx, by, 14, 0, TAU); g.fill(); }
  }
  // the header in bulbs
  const hs = headerSize(w * 0.86), pts = textDots('WHAT MAKES IT WORTH IT?', FAM.bold(), hs, Math.max(4, Math.round(hs / 10)));
  drawDots(c, g, pts, x + w / 2, y + h * 0.11, Math.max(1.7, hs / 30), HEX.gold, (i) => Math.max(flash, 0.8 + 0.2 * Math.sin(t * 8 + i * 0.4)));
  // the rows
  const top = y + h * 0.22, rh = (h * 0.74) / 4;
  rows.forEach((r, i) => {
    const ry = top + i * rh, lit = clamp(Math.max(r.lit, flash)), age = t - r.t0;
    c.fillStyle = mixHex('#1e130c', '#6a3e14', lit * (0.75 + 0.25 * flash)); c.beginPath(); c.roundRect(x + w * 0.04, ry + 6, w * 0.92, rh - 12, 10); c.fill();
    c.strokeStyle = mixHex('#4a3020', HEX.gold, lit); c.lineWidth = 3; c.stroke();
    if (lit > 0.5) { g.fillStyle = rgbaHex(HEX.gold, 0.14 * lit); g.beginPath(); g.roundRect(x + w * 0.04, ry + 6, w * 0.92, rh - 12, 10); g.fill(); }
    const fs = rh * 0.42, iy = ry + rh / 2;
    rowIcon(c, i, x + w * 0.1, iy, rh * 0.3, t, lit, age);
    c.font = font(FAM.monoB(), fs * 0.82); c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillStyle = lit > 0.3 ? HEX.bone : 'rgba(244,241,234,0.3)'; c.fillText(r.label, x + w * 0.17, iy + 2);
    // the value, on the right
    const vx = x + w * 0.92;
    c.textAlign = 'right';
    if (lit <= 0.02 && flash <= 0) return;
    const pop = age < 0 ? 1 : 1 + 0.35 * (1 - ease.outBack(clamp(age / 0.16), 2.5));
    c.save(); c.translate(vx, iy); c.scale(pop, pop);
    c.font = font(FAM.hook(), fs); c.fillStyle = HEX.gold;
    if (i === 0) { const v = Math.round(400 * ease.outCubic(clamp(age / 0.4))); c.fillText(`${v} km`, 0, 2); }
    else if (i === 1) {
      for (let k = 0; k < 5; k++) {
        const ka = clamp((age - k * 0.07) / 0.12);
        if (ka <= 0 && flash <= 0) continue;
        const sk = Math.max(ka, flash) * (1 + 0.4 * (1 - ease.outBack(clamp((age - k * 0.07) / 0.14), 3)));
        c.save(); c.translate(-fs * 0.5 - (4 - k) * fs * 0.95, 0); c.scale(sk, sk);
        star5(c, 0, 0, fs * 0.45); c.fillStyle = HEX.gold; c.fill(); c.strokeStyle = HEX.ink; c.lineWidth = 2; c.stroke();
        c.restore();
        g.fillStyle = rgbaHex(HEX.gold, 0.12 * ka); g.beginPath(); g.arc(vx - fs * 0.5 - (4 - k) * fs * 0.95, iy, fs * 0.42, 0, TAU); g.fill();
      }
    } else if (i === 2) {
      c.fillText('30', 0, 2);
    } else {
      const v = Math.round(6000 * ease.outQuart(clamp(age / 0.5)));
      c.fillText(v.toLocaleString('en-GB'), 0, 2);
    }
    c.restore();
    // row extras: the reef beside RISK, thirty little hands beside HANDS
    if (i === 1 && (o.reef ?? 0) > 0) reefIcon(c, x + w * 0.5, iy, rh * 0.36, t, o.reef!);
    if (i === 2) {
      const n = Math.floor(30 * clamp(age / 0.3));
      for (let k = 0; k < n; k++) {
        const hx = x + w * 0.36 + (k % 10) * rh * 0.2, hy = iy - rh * 0.2 + Math.floor(k / 10) * rh * 0.2;
        tinyHand(c, hx, hy, rh * 0.075, HEX.bone);
      }
    }
  });
}

/** The header's font size so it spans `maxW` (Archivo heavy). */
const HS = new Map<number, number>();
function headerSize(maxW: number) {
  const k = Math.round(maxW);
  if (!HS.has(k)) {
    const p = new OffscreenCanvas(8, 8).getContext('2d')!;
    p.font = font(FAM.bold(), 100);
    HS.set(k, Math.min(80, (100 * maxW) / p.measureText('WHAT MAKES IT WORTH IT?').width));
  }
  return HS.get(k)!;
}

function rowIcon(c: C2, i: number, x: number, y: number, s: number, t: number, lit: number, age: number) {
  c.save(); c.translate(x, y);
  const col = lit > 0.3 ? HEX.bone : 'rgba(244,241,234,0.3)';
  c.strokeStyle = col; c.fillStyle = col; c.lineWidth = s * 0.12; c.lineCap = 'round'; c.lineJoin = 'round';
  if (i === 0) { // the route: two islands and a dotted crossing, a raft riding it
    c.beginPath(); c.arc(-s * 0.9, s * 0.4, s * 0.25, 0, TAU); c.arc(s * 0.9, -s * 0.4, s * 0.25, 0, TAU); c.fill();
    c.setLineDash([s * 0.15, s * 0.15]); c.beginPath(); c.moveTo(-s * 0.7, s * 0.3); c.quadraticCurveTo(0, -s * 0.6, s * 0.7, -s * 0.3); c.stroke(); c.setLineDash([]);
    const u = lit > 0.3 ? clamp(age / 0.6) : 0, rx = -s * 0.7 + u * s * 1.4, ry = s * 0.3 - u * s * 0.6 - Math.sin(u * Math.PI) * s * 0.45;
    c.fillStyle = HEX.gold; c.fillRect(rx - s * 0.2, ry - s * 0.08, s * 0.4, s * 0.16);
  } else if (i === 1) { // a storm cloud with a bolt
    c.beginPath(); c.arc(-s * 0.35, -s * 0.15, s * 0.35, 0, TAU); c.arc(s * 0.2, -s * 0.3, s * 0.42, 0, TAU); c.arc(s * 0.55, -s * 0.05, s * 0.3, 0, TAU); c.fill();
    c.fillStyle = lit > 0.3 ? HEX.yellow : col;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(-s * 0.2, s * 0.5); c.lineTo(s * 0.05, s * 0.45); c.lineTo(-s * 0.1, s * 0.95); c.lineTo(s * 0.3, s * 0.3); c.lineTo(s * 0.05, s * 0.35); c.lineTo(s * 0.2, 0); c.closePath(); c.fill();
  } else if (i === 2) {
    tinyHand(c, 0, 0, s * 0.6, col);
  } else { // an hourglass, flipping as the row lights
    const rot = lit > 0.3 ? Math.PI * ease.inOutCubic(clamp(age / 0.35)) : 0;
    c.rotate(rot);
    c.beginPath(); c.moveTo(-s * 0.45, -s * 0.8); c.lineTo(s * 0.45, -s * 0.8); c.lineTo(-s * 0.45, s * 0.8); c.lineTo(s * 0.45, s * 0.8); c.closePath(); c.stroke();
    c.fillStyle = HEX.gold; c.beginPath(); c.moveTo(-s * 0.3, s * 0.7); c.lineTo(s * 0.3, s * 0.7); c.lineTo(0, s * 0.25); c.closePath(); c.fill();
  }
  c.restore();
}

/** A tiny open hand (palm and four fingers and a thumb). */
export function tinyHand(c: C2, x: number, y: number, s: number, col: string) {
  c.save(); c.translate(x, y); c.fillStyle = col;
  c.beginPath(); c.roundRect(-s * 0.55, -s * 0.2, s * 1.1, s * 1.0, s * 0.35); c.fill();
  for (let k = 0; k < 4; k++) { c.beginPath(); c.roundRect(-s * 0.55 + k * s * 0.29, -s * 0.95, s * 0.24, s * 0.85, s * 0.12); c.fill(); }
  c.save(); c.translate(-s * 0.55, s * 0.15); c.rotate(-0.7); c.beginPath(); c.roundRect(-s * 0.12, -s * 0.6, s * 0.24, s * 0.6, s * 0.12); c.fill(); c.restore();
  c.restore();
}

/** The reef beside RISK: a jagged coral line, a breaking wave and a shark's fin circling. */
function reefIcon(c: C2, x: number, y: number, s: number, t: number, a: number) {
  c.save(); c.globalAlpha *= clamp(a); c.translate(x, y);
  c.fillStyle = '#ff7a8a';
  c.beginPath(); c.moveTo(-s * 2, s * 0.8);
  for (let k = 0; k <= 8; k++) c.lineTo(-s * 2 + k * s * 0.5, s * (k % 2 ? 0.1 : 0.8) - (k === 4 ? s * 0.4 : 0));
  c.lineTo(s * 2, s * 0.8); c.closePath(); c.fill();
  c.strokeStyle = HEX.cyan; c.lineWidth = s * 0.14;
  c.beginPath(); c.moveTo(-s * 2.2, s * 0.9); for (let k = 0; k <= 20; k++) c.lineTo(-s * 2.2 + k * s * 0.22, s * 0.9 + Math.sin(k * 1.2 + t * 6) * s * 0.12); c.stroke();
  const fx = Math.cos(t * 3) * s * 1.3;
  c.fillStyle = '#6a8ab0'; c.beginPath(); c.moveTo(fx - s * 0.3, s * 0.6); c.lineTo(fx + s * 0.05, -s * 0.5); c.lineTo(fx + s * 0.35, s * 0.6); c.closePath(); c.fill();
  c.font = font(FAM.monoB(), s * 0.6); c.fillStyle = HEX.bone; c.textAlign = 'center'; c.fillText('REEF', 0, -s * 0.85);
  c.restore();
}

// ------------------------------------------------------------------ the buzzer round's items

/** A brass platform scale with a big dial; the needle at `v` (0..1 of the dial), the crate on its platform. Bottom-centre. */
export function weighScale(c: C2, g: C2, x: number, y: number, s: number, v: number, t: number) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = '#5a4020'; c.beginPath(); c.roundRect(-170, -40, 340, 40, 8); c.fill();
  c.fillStyle = '#b98a3e'; c.beginPath(); c.roundRect(-180, -54, 360, 20, 6); c.fill();
  c.fillStyle = '#8a6a34'; c.fillRect(-18, -54, 36, -200 + 54);
  c.fillRect(-14, -330, 28, 120);
  // the dial
  const dy = -420;
  c.fillStyle = '#b98a3e'; c.beginPath(); c.arc(0, dy, 120, 0, TAU); c.fill();
  c.fillStyle = '#f4ecd6'; c.beginPath(); c.arc(0, dy, 104, 0, TAU); c.fill();
  c.strokeStyle = HEX.ink; c.lineWidth = 3;
  for (let k = 0; k <= 10; k++) { const a = Math.PI * (0.8 + k * 0.14); c.beginPath(); c.moveTo(Math.cos(a) * 92, dy + Math.sin(a) * 92); c.lineTo(Math.cos(a) * 80, dy + Math.sin(a) * 80); c.stroke(); }
  c.fillStyle = '#ff3b3b'; c.beginPath(); c.arc(0, dy, 92, Math.PI * 2.0, Math.PI * 2.2); c.arc(0, dy, 78, Math.PI * 2.2, Math.PI * 2.0, true); c.closePath(); c.fill();
  c.font = font(FAM.monoB(), 22); c.fillStyle = HEX.ink; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('WEIGHT', 0, dy + 40);
  c.font = font(FAM.hook(), 24); c.fillStyle = '#c02a2a'; c.fillText('1 TON', 52, dy - 34);
  const a = Math.PI * (0.8 + clamp(v) * 1.42) + (v > 0.95 ? 0.04 * Math.sin(t * 40) : 0);
  c.strokeStyle = '#c02a2a'; c.lineWidth = 6; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, dy); c.lineTo(Math.cos(a) * 86, dy + Math.sin(a) * 86); c.stroke();
  c.fillStyle = HEX.ink; c.beginPath(); c.arc(0, dy, 9, 0, TAU); c.fill();
  c.restore();
  void g;
}

/** A jeweller's glass held over (x, y): a brass-rimmed lens that magnifies what `inside` draws, its handle down-right. */
export function loupe(c: C2, g: C2, x: number, y: number, r: number, t: number, inside: (c: C2) => void) {
  // the handle
  c.save(); c.translate(x, y); c.rotate(0.75);
  c.fillStyle = '#2a1a12'; c.beginPath(); c.roundRect(-r * 0.13, r * 1.05, r * 0.26, r * 1.4, r * 0.1); c.fill();
  c.fillStyle = '#b98a3e'; c.fillRect(-r * 0.15, r * 0.98, r * 0.3, r * 0.16);
  c.restore();
  c.save();
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.clip();
  inside(c);
  const gl = c.createRadialGradient(x - r * 0.3, y - r * 0.4, 0, x, y, r);
  gl.addColorStop(0, 'rgba(255,255,255,0.28)'); gl.addColorStop(0.45, 'rgba(255,255,255,0)'); gl.addColorStop(1, 'rgba(120,160,200,0.22)');
  c.fillStyle = gl; c.fillRect(x - r, y - r, 2 * r, 2 * r);
  c.restore();
  c.strokeStyle = '#b98a3e'; c.lineWidth = r * 0.12; c.beginPath(); c.arc(x, y, r * 1.04, 0, TAU); c.stroke();
  c.strokeStyle = '#f0c870'; c.lineWidth = r * 0.03; c.beginPath(); c.arc(x, y, r * 1.08, -2.5, -1.2); c.stroke();
  g.fillStyle = 'rgba(200,230,255,0.06)'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  void t;
}

/** The archive map: Palau to Yap, 400 km of open ocean, the dotted route, the raft riding it (u 0..1). Rect x, y, w, h. */
export function voyageMap(c: C2, g: C2, x: number, y: number, w: number, h: number, t: number, u: number, lit: number) {
  c.save();
  c.fillStyle = '#cfb27a'; c.beginPath(); c.roundRect(x, y, w, h, 14); c.fill();
  const vg = c.createRadialGradient(x + w / 2, y + h / 2, h * 0.2, x + w / 2, y + h / 2, w * 0.7);
  vg.addColorStop(0, 'rgba(255,240,200,0.25)'); vg.addColorStop(1, 'rgba(90,50,20,0.45)');
  c.fillStyle = vg; c.fillRect(x, y, w, h);
  c.strokeStyle = '#8a6a3a'; c.lineWidth = 6; c.stroke();
  c.beginPath(); c.roundRect(x, y, w, h, 14); c.clip();
  // the sea's wave marks and a compass rose
  c.strokeStyle = 'rgba(40,80,120,0.5)'; c.lineWidth = 3;
  for (let i = 0; i < 26; i++) {
    const wx = x + w * h01(i, 41), wy = y + h * h01(i, 42);
    c.beginPath(); c.arc(wx, wy, 10, Math.PI * 1.1, Math.PI * 1.9); c.arc(wx + 18, wy, 10, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
  }
  const cxr = x + w * 0.86, cyr = y + h * 0.78;
  c.strokeStyle = 'rgba(90,60,30,0.7)'; c.lineWidth = 2;
  for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; c.beginPath(); c.moveTo(cxr, cyr); c.lineTo(cxr + Math.cos(a) * (k % 2 ? 26 : 46), cyr + Math.sin(a) * (k % 2 ? 26 : 46)); c.stroke(); }
  c.font = font(FAM.monoB(), 20); c.fillStyle = 'rgba(90,60,30,0.8)'; c.textAlign = 'center'; c.fillText('N', cxr, cyr - 56);
  // the islands
  const P = { x: x + w * 0.16, y: y + h * 0.7 }, Y = { x: x + w * 0.8, y: y + h * 0.28 };
  for (const [I, name] of [[P, 'PALAU'], [Y, 'YAP']] as const) {
    c.fillStyle = '#5f8a3e'; c.beginPath(); c.ellipse(I.x, I.y, 96, 52, -0.3, 0, TAU); c.fill();
    c.strokeStyle = '#2f4a22'; c.lineWidth = 4; c.stroke();
    for (let p = 0; p < 3; p++) { c.fillStyle = '#2f5a22'; c.beginPath(); c.arc(I.x - 30 + p * 28, I.y - 8 + (p % 2) * 10, 12, 0, TAU); c.fill(); }
    c.font = font(FAM.monoB(), 34); c.fillStyle = '#3a2410'; c.textAlign = 'center'; c.fillText(name, I.x, I.y + 92);
  }
  // the route, dotted, drawing itself to u
  const pt = (v: number) => ({ x: P.x + (Y.x - P.x) * v, y: P.y + (Y.y - P.y) * v - Math.sin(v * Math.PI) * h * 0.22 });
  c.fillStyle = mixHex('#8a2a1a', '#ffd23f', lit);
  for (let k = 0; k <= 40; k++) { const v = k / 40; if (v > Math.max(u, lit)) break; const p = pt(v); c.beginPath(); c.arc(p.x, p.y, 8, 0, TAU); c.fill(); }
  if (lit > 0) for (let k = 0; k <= 40; k += 2) { const p = pt(k / 40); g.fillStyle = rgbaHex(HEX.gold, 0.3 * lit); g.beginPath(); g.arc(p.x, p.y, 12, 0, TAU); g.fill(); }
  const mid = pt(0.5);
  c.font = font(FAM.hook(), 60); c.fillStyle = '#5a2a1a'; c.textAlign = 'center'; c.fillText('400 KM', mid.x, mid.y + 110);
  // the raft and its crew, riding the route
  const rp = pt(clamp(u)), bob = 4 * Math.sin(t * 5);
  c.save(); c.translate(rp.x, rp.y - 18 + bob); c.rotate(0.06 * Math.sin(t * 3)); c.scale(1.6, 1.6);
  c.fillStyle = '#6a4424'; c.fillRect(-46, 0, 92, 14);
  stone(c, 0, -34, 30, { seed: 3, heart: HEX.pink, heartA: 0.5 + 0.4 * lit });
  for (const px of [-36, 36]) cast(c, 'trader', px, 2, 40, 'paddle', { col: '#3a2410', t, prop: false });
  c.restore();
  c.restore();
}

/** The sad trombone: a drooping squiggle and its "wah wah waaah", from (x, y) down-right, from t0. */
export function wahWah(c: C2, x: number, y: number, t: number, t0: number) {
  const age = t - t0;
  if (age < 0 || age > 1.2) return;
  const a = 1 - clamp((age - 0.9) / 0.3);
  c.save(); c.globalAlpha *= a;
  c.strokeStyle = HEX.bone; c.lineWidth = 9; c.lineCap = 'round';
  const n = Math.floor(clamp(age / 0.5) * 60);
  c.beginPath();
  for (let k = 0; k <= n; k++) { const v = k / 60; const px = x + v * 560, py = y + 60 + v * v * 220 + Math.sin(v * 28) * 22 * (1 - v * 0.5); k ? c.lineTo(px, py) : c.moveTo(px, py); }
  c.stroke();
  const words = ['wah', 'wah', 'waaah'];
  words.forEach((wd, i) => {
    const wt = i * 0.16;
    if (age < wt) return;
    const s = 80 - i * 8, px = x + 90 + i * 190, py = y - 50 + i * 70 + i * i * 14;
    c.font = font(FAM.hook(), s); c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    c.lineWidth = s * 0.2; c.strokeStyle = HEX.ink; c.strokeText(wd, px, py);
    c.fillStyle = HEX.peri; c.fillText(wd, px, py);
  });
  c.restore();
}

/** The archive storm on the studio screen: lightning over a black sea, the raft tilting, the stone sliding. */
export function stormClip(c: C2, g: C2, x: number, y: number, w: number, h: number, t: number) {
  const k = frameIdx(t), flash = (k % 47 < 3) || (k % 31 === 0) ? 1 : 0;
  c.fillStyle = flash ? '#5a6a8a' : '#141a2a'; c.fillRect(x, y, w, h);
  c.fillStyle = '#0a0f1a';
  c.beginPath(); c.moveTo(x, y + h * 0.62);
  for (let i = 0; i <= 20; i++) c.lineTo(x + (i / 20) * w, y + h * 0.62 + Math.sin(i * 1.3 + t * 4) * h * 0.06);
  c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.closePath(); c.fill();
  if (flash) { c.strokeStyle = '#f4f1ea'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + w * 0.7, y); c.lineTo(x + w * 0.62, y + h * 0.25); c.lineTo(x + w * 0.68, y + h * 0.3); c.lineTo(x + w * 0.58, y + h * 0.55); c.stroke(); }
  const tilt = 0.35 * Math.sin(t * 2.5);
  c.save(); c.translate(x + w * 0.45, y + h * 0.6); c.rotate(tilt);
  c.fillStyle = '#3a2a1a'; c.fillRect(-w * 0.18, -6, w * 0.36, 12);
  c.restore();
  stone(c, x + w * 0.45 + Math.sin(t * 2.5) * w * 0.12, y + h * 0.5, h * 0.12, { seed: 3, tilt });
  vhs(c, t, x, y, w, h, 'ARCHIVE');
  void g;
}

export { W, H };
