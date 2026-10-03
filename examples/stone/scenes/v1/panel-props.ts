// Props for v1's `panel` plate (the bridge, THE BIG DEBATE, TREATMENT-v1.md): the debate sign in bulbs, three
// podiums with their emblems (a calculator, a heart with a price tag that cracks, a sledgehammer racked on the front),
// the moderator's desk, the MODERATOR picture-in-picture, the studio screen's poll, the scoreboard's smash (LED dots
// everywhere, sparks, glass, the broken frame with dead dots that the lift inherits) and the long pole.
// Canvas2D in the 1920x1080 logical frame, y down, pure functions of t.
import { W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import { clamp, ease, frameIdx } from '../../engine/util';
import { h01 } from '../_rai';
import { FAM, TAU, rgbaHex, mixHex } from '../_motifs';
import { textDots, drawDots, SET, ledText } from './_studio';
import { heartPts } from './dating-props';

type C2 = CanvasRenderingContext2D;

// ------------------------------------------------------------------ the debate set

/** "THE BIG DEBATE" in bulbs on a board hung from the pelmet: pink on the left, cyan on the right, lighting up as
 *  `lit` rises (left to right). */
export function debateSign(c: C2, g: C2, x: number, y: number, t: number, lit: number) {
  const pts = textDots('THE BIG DEBATE', FAM.hook(), 64, 8);
  const minX = Math.min(...pts.map((p) => p[0])), maxX = Math.max(...pts.map((p) => p[0])), w = maxX - minX + 60;
  c.strokeStyle = '#2a2236'; c.lineWidth = 4;
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x + s * w * 0.38, y - 48); c.lineTo(x + s * w * 0.4, y - 220); c.stroke(); }
  c.fillStyle = '#140c1e'; c.beginPath(); c.roundRect(x - w / 2, y - 48, w, 96, 12); c.fill();
  c.strokeStyle = '#b98a3e'; c.lineWidth = 4; c.stroke();
  // a split face: pink | cyan (two sides of an argument)
  c.fillStyle = 'rgba(255,79,154,0.14)'; c.fillRect(x - w / 2 + 6, y - 42, w / 2 - 6, 84);
  c.fillStyle = 'rgba(47,224,255,0.12)'; c.fillRect(x, y - 42, w / 2 - 6, 84);
  const left = pts.map((p) => p[0] < 0);
  for (const side of [true, false]) {
    const sub = pts.filter((_, i) => left[i] === side);
    drawDots(c, g, sub, x, y, 3.2, side ? HEX.pink : HEX.cyan, (i) => {
      const fx = (sub[i]![0] - minX) / (maxX - minX);
      return clamp((lit * 1.25 - fx) / 0.12) * (0.84 + 0.16 * Math.sin(t * 9 + i * 0.41));
    });
  }
}

export type Emblem = 'calc' | 'heart' | 'hammer';

/**
 * A debate podium, its foot on the stage at (x, y): a dark wood lectern with brass trim, a gooseneck mic, and its
 * emblem in a lit panel on the front. `lit` 0..1 (its turn), `sink` 0..1 lowers it into the stage (the trapdoor lift).
 */
export function podium(c: C2, g: C2, x: number, y: number, t: number, emblem: Emblem, o: { lit?: number; sink?: number; calc?: string; crack?: number; tag?: number; hammer?: boolean; col?: string } = {}) {
  const lit = o.lit ?? 0, sink = o.sink ?? 0, w = 184, h = 150, top = y - h + sink * (h + 10);
  if (sink >= 1) return;
  c.save();
  c.beginPath(); c.rect(x - w, -2000, 2 * w, y + 2000 - 2); c.clip(); // the stage floor hides what has sunk
  const col = o.col ?? HEX.cyan;
  // the body: a tapering lectern
  const bg = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  bg.addColorStop(0, '#2a1a24'); bg.addColorStop(0.5, '#4a2c3a'); bg.addColorStop(1, '#22141e');
  c.fillStyle = bg;
  c.beginPath(); c.moveTo(x - w / 2, top); c.lineTo(x + w / 2, top); c.lineTo(x + w * 0.42, top + h); c.lineTo(x - w * 0.42, top + h); c.closePath(); c.fill();
  c.fillStyle = '#b98a3e'; c.fillRect(x - w / 2 - 8, top - 12, w + 16, 16);
  c.fillStyle = mixHex('#3a2a20', col, 0.6 * lit + 0.15); c.fillRect(x - w * 0.42, top + h - 14, w * 0.84, 6);
  // the gooseneck mic
  c.strokeStyle = '#2a2a33'; c.lineWidth = 4; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x + w * 0.3, top - 10); c.quadraticCurveTo(x + w * 0.32, top - 50, x + w * 0.16, top - 62); c.stroke();
  c.fillStyle = '#3a3a44'; c.beginPath(); c.ellipse(x + w * 0.14, top - 64, 9, 6, -0.5, 0, TAU); c.fill();
  // the emblem panel
  const e = 100, ex = x, ey = top + 70;
  c.fillStyle = '#0c0a12'; c.beginPath(); c.roundRect(ex - e / 2 - 8, ey - e / 2 - 8, e + 16, e + 16, 14); c.fill();
  c.fillStyle = mixHex('#1a1426', col, 0.12 + 0.22 * lit); c.beginPath(); c.roundRect(ex - e / 2, ey - e / 2, e, e, 10); c.fill();
  if (lit > 0.05) { g.fillStyle = rgbaHex(col, 0.1 * lit); g.beginPath(); g.roundRect(ex - e / 2 - 10, ey - e / 2 - 10, e + 20, e + 20, 16); g.fill(); }
  if (emblem === 'calc') calculator(c, g, ex, ey, e * 0.78, o.calc ?? '0');
  else if (emblem === 'heart') pricedHeart(c, g, ex, ey, e * 0.8, t, o.crack ?? 0, o.tag ?? 0);
  else if (o.hammer !== false) hammer(c, ex, ey, e * 0.9, -0.7);
  else { // where the hammer was: its dashed outline and the two empty clips
    c.save(); c.translate(ex, ey); c.rotate(-0.7);
    c.setLineDash([7, 6]); c.strokeStyle = 'rgba(244,241,234,0.55)'; c.lineWidth = 3;
    c.strokeRect(-e * 0.27, -e * 0.45, e * 0.54, e * 0.23); c.strokeRect(-e * 0.05, -e * 0.22, e * 0.1, e * 0.62);
    c.setLineDash([]); c.fillStyle = '#8a8f9c';
    c.fillRect(-e * 0.12, e * 0.02, e * 0.24, 6); c.fillRect(-e * 0.12, e * 0.24, e * 0.24, 6);
    c.restore();
  }
  c.restore();
}

/** A pocket calculator, its LCD showing `txt`. */
export function calculator(c: C2, g: C2, x: number, y: number, s: number, txt: string) {
  c.fillStyle = '#5a6070'; c.beginPath(); c.roundRect(x - s * 0.36, y - s * 0.5, s * 0.72, s, s * 0.08); c.fill();
  c.fillStyle = '#9fd09a'; c.fillRect(x - s * 0.3, y - s * 0.42, s * 0.6, s * 0.24);
  c.font = font(FAM.monoB(), s * 0.17); c.textAlign = 'right'; c.textBaseline = 'middle'; c.fillStyle = '#1a2a18';
  c.fillText(txt, x + s * 0.27, y - s * 0.3);
  g.fillStyle = 'rgba(159,208,154,0.08)'; g.fillRect(x - s * 0.3, y - s * 0.42, s * 0.6, s * 0.24);
  for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) {
    c.fillStyle = k === 3 ? '#ff8a2a' : '#d8dbe4';
    c.beginPath(); c.roundRect(x - s * 0.29 + k * s * 0.15, y - s * 0.1 + r * s * 0.14, s * 0.12, s * 0.1, s * 0.02); c.fill();
  }
}

/** A heart with a price tag on a string; `crack` 0..1 splits it (a zigzag down the middle, the halves parting). */
export function pricedHeart(c: C2, g: C2, x: number, y: number, s: number, t: number, crack: number, tag: number) {
  const pts = heartPts(s * 0.5, 48), n = pts.length - 1;
  const zig: [number, number][] = [];
  for (let i = 0; i <= 6; i++) { const v = i / 6; zig.push([(i % 2 ? 1 : -1) * s * 0.06 * (i > 0 && i < 6 ? 1 : 0), -s * 0.3 + v * s * 0.78]); }
  if (crack <= 0) {
    c.beginPath(); pts.forEach(([px, py], i) => (i ? c.lineTo(x + px, y + py) : c.moveTo(x + px, y + py))); c.closePath();
    c.fillStyle = HEX.pink; c.fill(); c.strokeStyle = '#7a1446'; c.lineWidth = 3; c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.45)'; c.beginPath(); c.ellipse(x - s * 0.2, y - s * 0.18, s * 0.08, s * 0.05, -0.6, 0, TAU); c.fill();
  }
  for (const side of crack > 0 ? [-1, 1] : []) {
    c.save();
    c.translate(x + side * crack * s * 0.16, y + crack * s * 0.05); c.rotate(side * crack * 0.25);
    c.beginPath();
    const a = side > 0 ? 0 : n / 2, b = side > 0 ? n / 2 : n;
    for (let i = a; i <= b; i++) { const [px, py] = pts[i]!; i === a ? c.moveTo(px, py) : c.lineTo(px, py); }
    const zz = side > 0 ? [...zig].reverse() : zig;
    for (const [zx, zy] of zz) c.lineTo(zx, zy);
    c.closePath();
    c.fillStyle = crack > 0 ? '#e0306f' : HEX.pink; c.fill();
    c.strokeStyle = '#7a1446'; c.lineWidth = 3; c.stroke();
    c.restore();
  }
  if (crack <= 0) { g.fillStyle = rgbaHex(HEX.pink, 0.1); g.beginPath(); g.arc(x, y, s * 0.4, 0, TAU); g.fill(); }
  // the price tag, swinging in on its string (tag 0..1)
  if (tag > 0) {
    const sw = 0.5 * Math.sin(t * 7) * Math.exp(-2 * tag) + (crack > 0 ? 0.9 * crack : 0);
    const k = ease.outBack(clamp(tag));
    c.save(); c.translate(x - s * 0.2, y - s * 0.22 - (1 - k) * s * 0.8 + crack * s * 0.4); c.rotate(-0.4 + sw);
    c.strokeStyle = '#f4f1ea'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(-s * 0.18, s * 0.22); c.stroke();
    c.translate(-s * 0.18, s * 0.22); c.rotate(0.5);
    c.fillStyle = '#e9c98e'; c.beginPath(); c.moveTo(-s * 0.08, 0); c.lineTo(s * 0.08, 0); c.lineTo(s * 0.12, s * 0.34); c.lineTo(-s * 0.12, s * 0.34); c.closePath(); c.fill();
    c.strokeStyle = '#8a5a34'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#2a1d14'; c.beginPath(); c.arc(0, s * 0.05, s * 0.025, 0, TAU); c.fill();
    c.font = font(FAM.hook(), s * 0.16); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('£', 0, s * 0.2);
    c.restore();
  }
}

/** A sledgehammer: handle and steel head, rotated by `rot`, centred on its handle. */
export function hammer(c: C2, x: number, y: number, s: number, rot: number) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.strokeStyle = '#3a2410'; c.lineWidth = s * 0.13; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, s * 0.45); c.lineTo(0, -s * 0.3); c.stroke();
  c.strokeStyle = '#a8763e'; c.lineWidth = s * 0.08; c.stroke();
  const hg = c.createLinearGradient(0, -s * 0.5, 0, -s * 0.22);
  hg.addColorStop(0, '#d8dbe4'); hg.addColorStop(1, '#6a6f7c');
  c.fillStyle = hg; c.beginPath(); c.roundRect(-s * 0.3, -s * 0.5, s * 0.6, s * 0.26, s * 0.04); c.fill();
  c.strokeStyle = '#2a2a33'; c.lineWidth = 2; c.stroke();
  c.restore();
}

/** The moderator's desk at (x, y) (its foot on the stage): a curved front with the show's bulbs and a mic. */
export function hostDesk(c: C2, g: C2, x: number, y: number, t: number) {
  const w = 230, h = 118, top = y - h;
  c.fillStyle = '#3a2232';
  c.beginPath(); c.moveTo(x - w / 2, top); c.lineTo(x + w / 2, top); c.quadraticCurveTo(x + w / 2 + 10, y - h / 2, x + w / 2 - 12, y); c.lineTo(x - w / 2 + 12, y); c.quadraticCurveTo(x - w / 2 - 10, y - h / 2, x - w / 2, top); c.fill();
  c.fillStyle = '#b98a3e'; c.fillRect(x - w / 2 - 10, top - 10, w + 20, 14);
  for (let k = 0; k < 9; k++) {
    const bx = x - w * 0.4 + k * (w * 0.8 / 8), on = 0.6 + 0.4 * Math.sin(t * 8 - k);
    c.fillStyle = mixHex('#5a4630', HEX.gold, on); c.beginPath(); c.arc(bx, top + 30, 5, 0, TAU); c.fill();
    g.fillStyle = rgbaHex(HEX.gold, 0.3 * on); g.beginPath(); g.arc(bx, top + 30, 10, 0, TAU); g.fill();
  }
  c.font = font(FAM.monoB(), 18); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = rgbaHex(HEX.bone, 0.75);
  c.fillText('MODERATOR', x, top + 70);
  c.strokeStyle = '#2a2a33'; c.lineWidth = 4; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x - w * 0.3, top - 6); c.quadraticCurveTo(x - w * 0.32, top - 44, x - w * 0.18, top - 56); c.stroke();
  c.fillStyle = '#3a3a44'; c.beginPath(); c.ellipse(x - w * 0.16, top - 58, 9, 6, 0.5, 0, TAU); c.fill();
}

/** The studio screen's poll during the debate: COUNT / PRICE / SMASH, then one bar, CARRY 100%. */
export function pollScreen(c: C2, g: C2, x: number, y: number, w: number, h: number, t: number, carry: number, smashed: number) {
  const bg = c.createLinearGradient(x, y, x, y + h);
  bg.addColorStop(0, '#1d1236'); bg.addColorStop(1, '#0b0718');
  c.fillStyle = bg; c.fillRect(x, y, w, h);
  c.font = font(FAM.hook(), 30); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = HEX.gold; c.fillText(carry > 0.5 ? 'TONIGHT’S RESULT' : 'COUNT HER?', x + w / 2, y + 36);
  const rows: [string, number, string][] = carry > 0.5 ? [['CARRY', 100, HEX.gold]] : [['COUNT', 33, HEX.cyan], ['PRICE', 33, HEX.pink], ['SMASH', 34 + Math.round(30 * smashed), HEX.yellow]];
  c.font = font(FAM.monoB(), 20);
  rows.forEach(([lb, v, col], i) => {
    const ry = y + 80 + i * 56 + (carry > 0.5 ? 40 : 0), bw = (w - 190) * (v / 100) * (carry > 0.5 ? clamp((carry - 0.5) * 4) : 1);
    c.textAlign = 'left'; c.fillStyle = '#f4f1ea'; c.fillText(lb, x + 18, ry);
    c.fillStyle = col; c.fillRect(x + 104, ry - 12, bw, 24);
    g.fillStyle = rgbaHex(col, 0.25); g.fillRect(x + 104, ry - 12, bw, 24);
    c.textAlign = 'right'; c.fillStyle = '#f4f1ea'; c.fillText(`${v}%`, x + w - 12, ry);
  });
}

// ------------------------------------------------------------------ the moderator's picture-in-picture

/** A MODERATOR cam box at (x, y, w, h): her reaction, live, in the corner; `draw` paints her inside (clipped). */
export function pip(c: C2, g: C2, x: number, y: number, w: number, h: number, t: number, a: number, draw: () => void) {
  if (a <= 0) return;
  c.save(); c.globalAlpha *= a;
  c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(x + 8, y + 10, w, h);
  c.save();
  c.beginPath(); c.rect(x, y, w, h); c.clip();
  const bg = c.createRadialGradient(x + w / 2, y + h * 0.4, 20, x + w / 2, y + h / 2, w * 0.7);
  bg.addColorStop(0, '#4a2a6a'); bg.addColorStop(1, '#120a22');
  c.fillStyle = bg; c.fillRect(x, y, w, h);
  for (let i = 0; i < 9; i++) { // out-of-focus bulbs behind her
    const bx = x + h01(i, 71) * w, by = y + h01(i, 72) * h * 0.7, r = 10 + 20 * h01(i, 73);
    c.fillStyle = rgbaHex(i % 2 ? HEX.gold : HEX.pink, 0.18 + 0.08 * Math.sin(t * 3 + i)); c.beginPath(); c.arc(bx, by, r, 0, TAU); c.fill();
  }
  draw();
  c.restore();
  c.strokeStyle = HEX.pink; c.lineWidth = 5; c.strokeRect(x, y, w, h);
  c.font = font(FAM.monoB(), 20); c.textAlign = 'left'; c.textBaseline = 'middle';
  const tw = c.measureText('MODERATOR').width;
  c.fillStyle = HEX.pink; c.fillRect(x - 3, y + h - 34, tw + 30, 34);
  c.fillStyle = '#f4f1ea'; c.fillText('MODERATOR', x + 12, y + h - 16);
  c.restore();
  void g;
}

// ------------------------------------------------------------------ the smash

/** Where the hammer lands on the scoreboard (set px). */
export const IMPACT = { x: SET.score.x + SET.score.w * 0.78, y: SET.score.y + SET.score.h * 0.42 };

/**
 * The scoreboard's LED dots blown out of it at t0 (set px): they burst away from the impact, slow in the water, sink
 * and settle on the stage (dead, a few still glowing pink for a moment). `r` scales the dots.
 */
export function shatterDots(c: C2, g: C2, t: number, t0: number, o: { n?: number; r?: number } = {}) {
  const a0 = t - t0;
  if (a0 < 0) return;
  const n = o.n ?? 260, R = o.r ?? 1, S = SET.score, k = 2.6;
  for (let i = 0; i < n; i++) {
    const x0 = S.x + S.w * h01(i, 401), y0 = S.y + S.h * h01(i, 402);
    const dx = x0 - IMPACT.x, dy = y0 - IMPACT.y, d = Math.hypot(dx, dy) + 30;
    const sp = (900 + 900 * h01(i, 403)) * (120 / d) + 260 * h01(i, 404);
    const vx = (dx / d) * sp + (h01(i, 405) - 0.5) * 500, vy = (dy / d) * sp - 260 * h01(i, 406);
    const a = Math.max(0, a0 - 0.01 * (i % 5));
    const e = (1 - Math.exp(-k * a)) / k, sink = 120 + 160 * h01(i, 407);
    let x = x0 + vx * e, y = y0 + vy * e + sink * a;
    const floor = SET.floor - 6 + 70 * h01(i, 408);
    if (y > floor) y = floor;
    const r = (2.4 + 3.2 * h01(i, 409)) * R, pinkish = h01(i, 410) < 0.35;
    const glow = pinkish ? Math.max(0, 1 - a / 1.6) : 0;
    c.fillStyle = mixHex('#3a3242', HEX.pink, glow);
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    if (glow > 0.2) { g.fillStyle = rgbaHex(HEX.pink, 0.45 * glow); g.beginPath(); g.arc(x, y, r * 2.2, 0, TAU); g.fill(); }
  }
}

/** Sparks (bright streaks that fall) and glass shards, from the impact at t0 (set px). */
export function sparks(c: C2, g: C2, t: number, t0: number, o: { n?: number; x?: number; y?: number; seed?: number; s?: number } = {}) {
  const a0 = t - t0;
  if (a0 < 0 || a0 > 1.4) return;
  const n = o.n ?? 46, x0 = o.x ?? IMPACT.x, y0 = o.y ?? IMPACT.y, sd = o.seed ?? 7, s = o.s ?? 1;
  g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const life = 0.35 + 0.7 * h01(i, sd), a = a0 - 0.02 * (i % 4);
    if (a < 0 || a > life) continue;
    const ang = h01(i, sd, 1) * TAU, sp = (500 + 900 * h01(i, sd, 2)) * s;
    const p = (u: number) => [x0 + Math.cos(ang) * sp * u, y0 + Math.sin(ang) * sp * u + 900 * s * u * u] as const;
    const [x1, y1] = p(a), [x2, y2] = p(Math.max(0, a - 0.05));
    const fade = 1 - a / life;
    g.strokeStyle = rgbaHex(i % 3 ? '#ffe9a0' : '#ffffff', fade); g.lineWidth = (2 + 2 * h01(i, sd, 3)) * s;
    g.beginPath(); g.moveTo(x2, y2); g.lineTo(x1, y1); g.stroke();
  }
  for (let i = 0; i < 16; i++) { // shards of the board's glass
    const a = a0;
    const ang = -Math.PI * 0.9 + h01(i, sd, 5) * Math.PI * 1.3, sp = (400 + 500 * h01(i, sd, 6)) * s;
    const x = x0 + Math.cos(ang) * sp * a, y = y0 + Math.sin(ang) * sp * a + 500 * s * a * a;
    if (y > SET.floor + 80) continue;
    c.save(); c.translate(x, y); c.rotate(a * (6 + 6 * h01(i, sd, 7)) + i);
    c.globalAlpha *= Math.max(0, 1 - a / 1.4);
    c.fillStyle = 'rgba(200,235,255,0.75)'; c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 1.5;
    const q = (8 + 14 * h01(i, sd, 8)) * s;
    c.beginPath(); c.moveTo(-q, -q * 0.4); c.lineTo(q, -q * 0.7); c.lineTo(q * 0.2, q); c.closePath(); c.fill(); c.stroke();
    c.restore();
  }
}

/**
 * The scoreboard after the smash, drawn over the set's board (set px): cracks from the impact, the hole, the lower
 * panel fallen out (`fallen` 0..1: 0 hanging, 1 gone, the frame's interior bare with wires), a bent corner, a few
 * dead dots that still flicker, a dangling cable that sparks. What the lift inherits: a broken frame with dead dots.
 */
export function brokenBoard(c: C2, g: C2, t: number, fallen: number) {
  const S = SET.score, k = frameIdx(t);
  c.save();
  // the lower panel gone: the bare interior
  const cut = S.y + S.h * 0.58;
  if (fallen > 0) {
    c.save(); c.beginPath(); c.rect(S.x, cut - 6, S.w, S.y + S.h - cut + 6); c.clip();
    c.fillStyle = '#050308'; c.fillRect(S.x, cut - 6, S.w, S.y + S.h - cut + 6);
    c.strokeStyle = '#3a3040'; c.lineWidth = 3;
    for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(S.x + 20 + i * 70, cut); c.quadraticCurveTo(S.x + 40 + i * 70, cut + 60, S.x + 10 + i * 75, S.y + S.h); c.stroke(); }
    c.restore();
    // its ragged top edge
    c.fillStyle = '#18141f'; c.beginPath(); c.moveTo(S.x, cut);
    for (let i = 0; i <= 12; i++) c.lineTo(S.x + (S.w * i) / 12, cut + (i % 2 ? 14 : -4) + 6 * h01(i, 77));
    c.lineTo(S.x + S.w, cut - 10); c.lineTo(S.x, cut - 10); c.closePath(); c.fill();
  }
  // cracks radiating from the impact
  c.strokeStyle = 'rgba(210,235,255,0.7)'; c.lineWidth = 2.5; c.lineJoin = 'miter';
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU + 0.3 * h01(i, 81);
    c.beginPath(); c.moveTo(IMPACT.x, IMPACT.y);
    let x = IMPACT.x, y = IMPACT.y;
    for (let j = 1; j <= 4; j++) { x += Math.cos(a + (h01(i, j, 82) - 0.5) * 0.7) * 40; y += Math.sin(a + (h01(i, j, 83) - 0.5) * 0.7) * 40; c.lineTo(x, y); }
    c.stroke();
  }
  // the hole where it hit
  c.fillStyle = '#050308'; c.beginPath();
  for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU, r = (i % 2 ? 18 : 34) + 8 * h01(i, 84); i ? c.lineTo(IMPACT.x + Math.cos(a) * r, IMPACT.y + Math.sin(a) * r) : c.moveTo(IMPACT.x + Math.cos(a) * r, IMPACT.y + Math.sin(a) * r); }
  c.closePath(); c.fill();
  // the bent top corner of the frame
  c.fillStyle = '#0c0a12'; c.beginPath(); c.moveTo(S.x + S.w - 60, S.y - 12); c.lineTo(S.x + S.w + 14, S.y - 12); c.lineTo(S.x + S.w + 14, S.y + 50); c.closePath(); c.fill();
  c.strokeStyle = '#6a5a3a'; c.lineWidth = 5; c.beginPath(); c.moveTo(S.x + S.w - 62, S.y - 10); c.lineTo(S.x + S.w + 22, S.y + 34); c.stroke();
  // a few dead dots that still try
  for (let i = 0; i < 14; i++) {
    const on = h01(i, Math.floor(k / 5), 85) < 0.25;
    if (!on) continue;
    const x = S.x + 20 + h01(i, 86) * (S.w - 40), y = S.y + 20 + h01(i, 87) * (S.h * 0.5);
    c.fillStyle = rgbaHex(HEX.pink, 0.6); c.beginPath(); c.arc(x, y, 2.2, 0, TAU); c.fill();
  }
  // a dangling cable that sparks
  const cx = S.x + S.w * 0.3, cy = fallen > 0 ? cut : S.y + S.h, sway = 6 * Math.sin(t * 2.1);
  c.strokeStyle = '#1a1622'; c.lineWidth = 5; c.beginPath(); c.moveTo(cx, cy); c.quadraticCurveTo(cx + 10 + sway, cy + 50, cx + 18 + sway * 1.6, cy + 92); c.stroke();
  if (h01(Math.floor(k / 4), 88) < 0.35) {
    g.fillStyle = 'rgba(255,240,180,0.9)'; g.beginPath(); g.arc(cx + 18 + sway * 1.6, cy + 94, 7, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,230,150,0.9)'; g.lineWidth = 2;
    for (let j = 0; j < 4; j++) { const a = h01(k, j, 89) * TAU; g.beginPath(); g.moveTo(cx + 18 + sway * 1.6, cy + 94); g.lineTo(cx + 18 + sway * 1.6 + Math.cos(a) * 18, cy + 94 + Math.sin(a) * 18); g.stroke(); }
  }
  c.restore();
}

// ------------------------------------------------------------------ the pole

/** The long carrying pole from x0 to x1 at height y: the wood racked in the wings, gold bands near its ends (as the
 *  lift draws it, so the cut into the lift keeps the same pole). */
export function pole(c: C2, x0: number, x1: number, y: number) {
  c.save(); c.lineCap = 'round';
  c.strokeStyle = '#3c2614'; c.lineWidth = 26; c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
  c.strokeStyle = '#a07a4a'; c.lineWidth = 19; c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
  c.strokeStyle = '#e0bb80'; c.lineWidth = 5; c.beginPath(); c.moveTo(x0 + 6, y - 5); c.lineTo(x1 - 6, y - 5); c.stroke();
  c.strokeStyle = HEX.gold; c.lineWidth = 22;
  for (const bx of [x0 + 18, x0 + 34, x1 - 34, x1 - 18]) { c.beginPath(); c.moveTo(bx - 3, y); c.lineTo(bx + 3, y); c.stroke(); }
  c.restore();
}

export { ledText };

/** An overhead spot from the flies onto (x, floor): a soft vertical cone and its pool (on the glow layer). */
export function overhead(g: C2, x: number, top: number, floor: number, col: string, a: number, r = 140) {
  if (a <= 0.01) return;
  const gr = g.createLinearGradient(0, top, 0, floor);
  gr.addColorStop(0, rgbaHex(col, 0)); gr.addColorStop(0.25, rgbaHex(col, 0.13 * a)); gr.addColorStop(1, rgbaHex(col, 0.07 * a));
  g.fillStyle = gr;
  g.beginPath(); g.moveTo(x - 24, top); g.lineTo(x + 24, top); g.lineTo(x + r, floor); g.lineTo(x - r, floor); g.closePath(); g.fill();
  g.fillStyle = rgbaHex(col, 0.22 * a); g.beginPath(); g.ellipse(x, floor, r, r * 0.2, 0, 0, TAU); g.fill();
}
