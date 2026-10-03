// Props for v1's quick-fire round (quickfire.ts): the contestant podiums, and the three contestants on them, which are
// modern money's machines: a printing press stamping notes (PRINT), two phones with a lightning arrow between them
// (WIRE), a server rack chipped at by a tiny pickaxe (MINE). Then the phone held up whose pledge turns into a gold
// trophy, and GENIUS in bulbs. Canvas2D, logical 1920x1080, pure functions of t.
import { W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import { clamp, ease, frameIdx } from '../../engine/util';
import { h01 } from '../_rai';
import { FAM, TAU, rgbaHex, mixHex } from '../_motifs';
import { star4 } from '../_manga';
import { textDots, drawDots, ledText } from './_studio';

type C2 = CanvasRenderingContext2D;

/**
 * A contestant podium, bottom-centre (x, y), width w (height 0.9 w): a curved front with chasing bulbs, a name panel,
 * a red buzzer on top. `lit` 0..1 lights it in `col`.
 */
export function podium(c: C2, g: C2, x: number, y: number, w: number, t: number, lit: number, label: string, col: string) {
  const h = w * 0.9, top = y - h;
  c.save();
  // the body: a trapezoid, darker sides
  c.fillStyle = '#1c1426';
  c.beginPath(); c.moveTo(x - w * 0.5, top + h * 0.08); c.lineTo(x + w * 0.5, top + h * 0.08); c.lineTo(x + w * 0.42, y); c.lineTo(x - w * 0.42, y); c.closePath(); c.fill();
  const face = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  face.addColorStop(0, mixHex('#24183a', col, 0.25 * lit)); face.addColorStop(0.5, mixHex('#3a2a56', col, 0.55 * lit)); face.addColorStop(1, mixHex('#24183a', col, 0.25 * lit));
  c.fillStyle = face;
  c.beginPath(); c.moveTo(x - w * 0.44, top + h * 0.12); c.lineTo(x + w * 0.44, top + h * 0.12); c.lineTo(x + w * 0.37, y - h * 0.04); c.lineTo(x - w * 0.37, y - h * 0.04); c.closePath(); c.fill();
  // the desk top
  c.fillStyle = '#b98a3e'; c.beginPath(); c.roundRect(x - w * 0.54, top, w * 1.08, h * 0.09, 6); c.fill();
  // bulbs round the face, chasing when lit
  const n = 16;
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1), bx = x - w * 0.4 + u * w * 0.8;
    for (const by of [top + h * 0.17, y - h * 0.09]) {
      const on = lit * (0.55 + 0.45 * Math.sin(t * 14 - i * 0.9 + (by > top + h / 2 ? 2 : 0)));
      c.fillStyle = mixHex('#4a3a30', HEX.gold, on); c.beginPath(); c.arc(bx, by, w * 0.014, 0, TAU); c.fill();
      if (on > 0.4) { g.fillStyle = rgbaHex(HEX.gold, 0.35 * on); g.beginPath(); g.arc(bx, by, w * 0.03, 0, TAU); g.fill(); }
    }
  }
  // the name panel
  c.fillStyle = '#0c0a12'; c.beginPath(); c.roundRect(x - w * 0.32, top + h * 0.3, w * 0.64, h * 0.34, 8); c.fill();
  c.strokeStyle = mixHex('#4a3a30', col, lit); c.lineWidth = 3; c.stroke();
  ledText(c, g, label, x, top + h * 0.47, w * 0.17, lit > 0.3 ? col : '#3a3046', undefined, Math.max(3, Math.round(w * 0.012)));
  if (lit > 0.3) { g.fillStyle = rgbaHex(col, 0.05 * lit); g.beginPath(); g.ellipse(x, top + h * 0.47, w * 0.36, h * 0.2, 0, 0, TAU); g.fill(); }
  c.restore();
}

/** A cast-iron printing press on (x, y) (its base), size s; the platen slams down at each of `hits`, a note flies out. */
export function press(c: C2, g: C2, x: number, y: number, s: number, t: number, hits: number[]) {
  let last = -1e9; for (const h of hits) if (h <= t && h > last) last = h;
  const age = t - last, down = age < 0.08 ? age / 0.08 : age < 0.25 ? 1 : Math.max(0, 1 - (age - 0.25) / 0.2);
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = '#2a2a33';
  c.fillRect(-120, -26, 240, 26);                      // base
  c.fillRect(-110, -230, 26, 210); c.fillRect(84, -230, 26, 210);   // the frame's posts
  c.beginPath(); c.roundRect(-120, -260, 240, 40, 10); c.fill();      // the crown
  c.fillStyle = '#e8e2d0'; c.fillRect(-80, -46, 160, 20);             // the paper on the bed
  // the screw and its wheel
  c.strokeStyle = '#8a8f9c'; c.lineWidth = 12; c.beginPath(); c.moveTo(0, -300); c.lineTo(0, -190 + 60 * down); c.stroke();
  c.save(); c.translate(0, -300); c.rotate(down * 1.2);
  c.strokeStyle = '#b98a3e'; c.lineWidth = 8; c.beginPath(); c.ellipse(0, 0, 70, 16, 0, 0, TAU); c.stroke();
  c.restore();
  // the platen
  c.fillStyle = '#3c3c48'; c.fillRect(-90, -190 + 140 * down, 180, 30);
  c.fillStyle = '#1a1a22'; c.fillRect(-90, -164 + 140 * down, 180, 6);
  c.restore();
  // the printed note flying out to the right
  if (age > 0.12 && age < 1.2) {
    const u = (age - 0.12) / 1.08, nx = x + (110 + 520 * u) * s, ny = y - (40 + 260 * u - 220 * u * u) * s, rot = u * 5;
    note(c, nx, ny, 70 * s, rot);
  }
  if (age >= 0 && age < 0.2) { g.fillStyle = rgbaHex(HEX.lime, 0.4 * (1 - age / 0.2)); g.beginPath(); g.ellipse(x, y - 40 * s, 160 * s, 30 * s, 0, 0, TAU); g.fill(); }
}

/** A banknote (lime, £), centre (x, y), width w, rotated. */
export function note(c: C2, x: number, y: number, w: number, rot: number) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.fillStyle = '#9ad86a'; c.fillRect(-w / 2, -w * 0.26, w, w * 0.52);
  c.strokeStyle = '#3a6a2a'; c.lineWidth = w * 0.04; c.strokeRect(-w / 2 + w * 0.05, -w * 0.21, w * 0.9, w * 0.42);
  c.fillStyle = '#3a6a2a'; c.font = font(FAM.hook(), w * 0.32); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('£', 0, w * 0.02);
  c.restore();
}

/** A smartphone, centre (x, y), height h, its screen drawn by `screen` (clipped). */
export function phone(c: C2, x: number, y: number, h: number, rot: number, screen: (c: C2, x: number, y: number, w: number, h: number) => void) {
  const w = h * 0.5;
  c.save(); c.translate(x, y); c.rotate(rot);
  c.fillStyle = '#16161c'; c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, w * 0.14); c.fill();
  c.strokeStyle = '#4a4a56'; c.lineWidth = h * 0.012; c.stroke();
  c.save(); c.beginPath(); c.roundRect(-w / 2 + w * 0.07, -h / 2 + h * 0.05, w * 0.86, h * 0.9, w * 0.08); c.clip();
  screen(c, -w / 2 + w * 0.07, -h / 2 + h * 0.05, w * 0.86, h * 0.9);
  c.restore();
  c.fillStyle = '#16161c'; c.beginPath(); c.roundRect(-w * 0.15, -h / 2 + h * 0.06, w * 0.3, h * 0.025, h * 0.012); c.fill();
  c.restore();
}

/** Two phones on stands with a lightning arrow between them (WIRE); the bolt zaps at `zap`, carrying a £ across. */
export function wire(c: C2, g: C2, x: number, y: number, s: number, t: number, zap: number) {
  const age = t - zap;
  for (const side of [-1, 1]) {
    const px = x + side * 130 * s, py = y - 130 * s;
    c.fillStyle = '#2a2a33'; c.fillRect(px - 30 * s, y - 20 * s, 60 * s, 20 * s); c.fillRect(px - 6 * s, y - 60 * s, 12 * s, 40 * s);
    phone(c, px, py, 170 * s, side * -0.12, (cc, sx, sy, sw, sh) => {
      cc.fillStyle = side < 0 ? '#1e3a5a' : '#2a1e4a'; cc.fillRect(sx, sy, sw, sh);
      cc.fillStyle = HEX.bone; cc.font = font(FAM.monoB(), sw * 0.2); cc.textAlign = 'center'; cc.textBaseline = 'middle';
      const got = side > 0 && age > 0.25;
      cc.fillText(side < 0 ? 'SEND' : got ? '+£' : '...', sx + sw / 2, sy + sh * 0.35);
      cc.fillStyle = side < 0 ? HEX.cyan : got ? HEX.lime : '#5a5a6a';
      cc.beginPath(); cc.roundRect(sx + sw * 0.15, sy + sh * 0.6, sw * 0.7, sh * 0.16, sw * 0.05); cc.fill();
    });
  }
  if (age >= 0 && age < 0.6) {
    const u = clamp(age / 0.25), k = Math.floor(frameIdx(t) / 2);
    c.save(); c.strokeStyle = HEX.yellow; c.lineWidth = 10 * s; c.lineJoin = 'round'; c.lineCap = 'round';
    c.beginPath();
    const x0 = x - 75 * s, x1 = x - 75 * s + 150 * s * u, yy = y - 150 * s;
    c.moveTo(x0, yy);
    for (let i = 1; i <= 6; i++) { const xx = x0 + ((x1 - x0) * i) / 6; c.lineTo(xx, yy + (i % 2 ? -1 : 1) * (14 + 8 * h01(i, k, 3)) * s); }
    c.stroke();
    // the arrow head
    c.fillStyle = HEX.yellow; c.beginPath(); c.moveTo(x1 + 22 * s, yy); c.lineTo(x1 - 6 * s, yy - 20 * s); c.lineTo(x1 - 6 * s, yy + 20 * s); c.closePath(); c.fill();
    c.restore();
    g.fillStyle = rgbaHex(HEX.yellow, 0.18 * (1 - age / 0.6)); g.beginPath(); g.ellipse(x, y - 150 * s, 100 * s, 36 * s, 0, 0, TAU); g.fill();
  }
}

/** A server rack (MINE) on (x, y), size s: blinking LEDs; a tiny pickaxe swings at it on each of `hits`, binary chips fly. */
export function rack(c: C2, g: C2, x: number, y: number, s: number, t: number, hits: number[]) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = '#121218'; c.beginPath(); c.roundRect(-80, -300, 160, 300, 8); c.fill();
  c.strokeStyle = '#3a3a48'; c.lineWidth = 4; c.stroke();
  const k = Math.floor(frameIdx(t) / 3);
  for (let r = 0; r < 7; r++) {
    c.fillStyle = '#22222c'; c.fillRect(-68, -284 + r * 40, 136, 30);
    for (let i = 0; i < 6; i++) {
      const on = h01(r, i, k) > 0.45, col = i % 3 === 0 ? HEX.lime : i % 3 === 1 ? HEX.cyan : HEX.orange;
      c.fillStyle = on ? col : '#2e2e38'; c.beginPath(); c.arc(-52 + i * 14, -269 + r * 40, 3.5, 0, TAU); c.fill();
    }
    c.fillStyle = '#0c0c10'; c.fillRect(30, -276 + r * 40, 30, 14);
  }
  c.restore();
  for (let r = 0; r < 7; r++) for (let i = 0; i < 6; i++) if (h01(r, i, k) > 0.7) {
    g.fillStyle = rgbaHex(HEX.lime, 0.25); g.beginPath(); g.arc(x + (-52 + i * 14) * s, y + (-269 + r * 40) * s, 6 * s, 0, TAU); g.fill();
  }
  // the pickaxe, swinging at the rack's side
  let last = -1e9; for (const h of hits) if (h <= t && h > last) last = h;
  const age = t - last, swing = age < 0.1 ? -1.2 + (age / 0.1) * 1.6 : age < 0.35 ? 0.4 - ((age - 0.1) / 0.25) * 1.6 : -1.2;
  c.save(); c.translate(x + 150 * s, y - 170 * s); c.rotate(swing);
  c.strokeStyle = '#8a6a44'; c.lineWidth = 9 * s; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(-70 * s, 0); c.stroke();
  c.strokeStyle = '#9aa0ac'; c.lineWidth = 8 * s; c.beginPath(); c.moveTo(-70 * s, -36 * s); c.quadraticCurveTo(-82 * s, 0, -70 * s, 36 * s); c.stroke();
  c.restore();
  // chips of binary flying off
  if (age >= 0 && age < 0.8) for (let i = 0; i < 9; i++) {
    const a = -0.4 - 1.6 * h01(i, Math.round(last * 10), 5), d = age * (240 + 220 * h01(i, 7)) * s;
    c.font = font(FAM.monoB(), 26 * s); c.textAlign = 'center'; c.fillStyle = rgbaHex(i % 2 ? HEX.lime : HEX.cyan, 1 - age / 0.8);
    c.fillText(i % 2 ? '1' : '0', x + 80 * s + Math.cos(a) * d, y - 170 * s + Math.sin(a) * d + age * age * 300 * s);
  }
}

/** A gold trophy cup, bottom-centre (x, y), height h. */
export function trophy(c: C2, g: C2, x: number, y: number, h: number, t: number) {
  c.save(); c.translate(x, y);
  const gold = c.createLinearGradient(-h * 0.35, 0, h * 0.35, 0);
  gold.addColorStop(0, '#b8862a'); gold.addColorStop(0.35, '#ffe39a'); gold.addColorStop(0.6, '#f6c453'); gold.addColorStop(1, '#a8781e');
  c.fillStyle = '#5a4020'; c.fillRect(-h * 0.24, -h * 0.12, h * 0.48, h * 0.12);
  c.fillStyle = gold;
  c.fillRect(-h * 0.16, -h * 0.2, h * 0.32, h * 0.08);
  c.beginPath(); c.moveTo(-h * 0.05, -h * 0.2); c.lineTo(-h * 0.04, -h * 0.42); c.lineTo(h * 0.04, -h * 0.42); c.lineTo(h * 0.05, -h * 0.2); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(-h * 0.3, -h); c.lineTo(h * 0.3, -h); c.quadraticCurveTo(h * 0.3, -h * 0.45, 0, -h * 0.42); c.quadraticCurveTo(-h * 0.3, -h * 0.45, -h * 0.3, -h); c.closePath(); c.fill();
  c.strokeStyle = gold; c.lineWidth = h * 0.045;
  for (const sd of [-1, 1]) { c.beginPath(); c.arc(sd * h * 0.32, -h * 0.82, h * 0.12, sd < 0 ? Math.PI * 0.4 : -Math.PI * 0.6, sd < 0 ? Math.PI * 1.6 : Math.PI * 0.6, sd > 0); c.stroke(); }
  c.fillStyle = '#fff6d0'; c.beginPath(); c.ellipse(-h * 0.12, -h * 0.78, h * 0.04, h * 0.14, 0.2, 0, TAU); c.fill();
  c.fillStyle = '#a8781e'; c.font = font(FAM.hook(), h * 0.16); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('£', 0, -h * 0.72);
  c.restore();
  g.fillStyle = rgbaHex(HEX.gold, 0.35); g.beginPath(); g.ellipse(x, y - h * 0.7, h * 0.45, h * 0.4, 0, 0, TAU); g.fill();
  for (let i = 0; i < 5; i++) {
    const a = i * 1.3 + t * 0.6, tw = 0.5 + 0.5 * Math.sin(t * 9 + i * 2);
    star4(c, x + Math.cos(a) * h * 0.45, y - h * 0.7 + Math.sin(a) * h * 0.4, h * (0.03 + 0.04 * tw), '#fff6c8');
  }
}

/**
 * The phone held up turning into a gold trophy: u 0 (the pledge on its screen) .. 1 (gold), dissolving in blocky
 * pixels with a shimmer. The phone is centred at (x, y) with height h; the trophy stands where its foot was.
 */
export function pledgeToGold(c: C2, g: C2, x: number, y: number, h: number, t: number, u: number) {
  const cell = h * 0.06;
  const drawPhone = () => phone(c, x, y, h, -0.06, (cc, sx, sy, sw, sh) => {
    cc.fillStyle = '#f4f1ea'; cc.fillRect(sx, sy, sw, sh);
    cc.fillStyle = '#1a3a6a'; cc.fillRect(sx, sy, sw, sh * 0.16);
    cc.fillStyle = HEX.bone; cc.font = font(FAM.monoB(), sw * 0.11); cc.textAlign = 'center'; cc.textBaseline = 'middle';
    cc.fillText('MY BANK', sx + sw / 2, sy + sh * 0.08);
    cc.fillStyle = HEX.ink; cc.font = font(FAM.serifB(), sw * 0.13);
    ['I promise', 'to pay', 'the bearer', 'on demand'].forEach((ln, i) => cc.fillText(ln, sx + sw / 2, sy + sh * (0.3 + i * 0.09)));
    cc.font = font(FAM.hook(), sw * 0.3); cc.fillStyle = '#1a3a6a'; cc.fillText('£100', sx + sw / 2, sy + sh * 0.76);
  });
  if (u <= 0) { drawPhone(); return; }
  if (u >= 1) { trophy(c, g, x, y + h * 0.5, h * 1.05, t); return; }
  // a blocky dissolve: each cell flips from phone to trophy at its own threshold, a gold shimmer on the flipping edge
  const x0 = x - h * 0.6, y0 = y - h * 0.65, nx = Math.ceil((h * 1.2) / cell), ny = Math.ceil((h * 1.25) / cell);
  c.save();
  c.beginPath();
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) if (h01(i, j, 77) > u) c.rect(x0 + i * cell, y0 + j * cell, cell + 0.5, cell + 0.5);
  c.clip(); drawPhone(); c.restore();
  c.save();
  c.beginPath();
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) if (h01(i, j, 77) <= u) c.rect(x0 + i * cell, y0 + j * cell, cell + 0.5, cell + 0.5);
  c.clip(); trophy(c, g, x, y + h * 0.5, h * 1.05, t); c.restore();
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const v = h01(i, j, 77);
    if (Math.abs(v - u) < 0.06) { g.fillStyle = rgbaHex('#fff3a0', 0.6); g.fillRect(x0 + i * cell, y0 + j * cell, cell, cell); }
  }
}

/** GENIUS in gold bulbs, centre (x, y), lighting letter by letter from t0, then chasing. */
export function geniusSign(c: C2, g: C2, x: number, y: number, size: number, t: number, t0: number) {
  const pts = textDots('GENIUS', FAM.hook(), size, Math.round(size / 11));
  const minX = Math.min(...pts.map((p) => p[0])), maxX = Math.max(...pts.map((p) => p[0]));
  c.fillStyle = '#140c1e';
  c.beginPath(); c.roundRect(x + minX - size * 0.3, y - size * 0.62, maxX - minX + size * 0.6, size * 1.24, size * 0.14); c.fill();
  c.strokeStyle = '#b98a3e'; c.lineWidth = size * 0.04; c.stroke();
  // a border of bigger bulbs
  const bw = maxX - minX + size * 0.6, bh = size * 1.24, n = 28;
  for (let i = 0; i < n; i++) {
    const d = (i / n) * 2 * (bw + bh);
    const [bx, by] = d < bw ? [x + minX - size * 0.3 + d, y - size * 0.62] : d < bw + bh ? [x + minX - size * 0.3 + bw, y - size * 0.62 + d - bw] : d < 2 * bw + bh ? [x + minX - size * 0.3 + bw - (d - bw - bh), y + size * 0.62] : [x + minX - size * 0.3, y + size * 0.62 - (d - 2 * bw - bh)];
    const on = t < t0 ? 0.15 : 0.5 + 0.5 * Math.sin(t * 16 - i * 0.7);
    c.fillStyle = mixHex('#4a3a30', HEX.pink, on); c.beginPath(); c.arc(bx, by, size * 0.035, 0, TAU); c.fill();
    if (on > 0.5) { g.fillStyle = rgbaHex(HEX.pink, 0.4 * on); g.beginPath(); g.arc(bx, by, size * 0.07, 0, TAU); g.fill(); }
  }
  drawDots(c, g, pts, x, y, size / 30, HEX.gold, (i) => {
    const fx = (pts[i]![0] - minX) / (maxX - minX);
    return t < t0 ? 0 : clamp((t - t0) / 0.32 * 1.3 - fx) > 0 ? 0.85 + 0.15 * Math.sin(t * 11 + i * 0.3) : 0;
  });
}

/** An LED countdown clock (the quick-fire clock), centre (x, y): whole seconds left of `left`. */
export function countdown(c: C2, g: C2, x: number, y: number, size: number, left: number) {
  const s = Math.max(0, Math.floor(left));
  c.fillStyle = '#0c0a12'; c.beginPath(); c.roundRect(x - size * 1.6, y - size * 0.62, size * 3.2, size * 1.24, size * 0.14); c.fill();
  c.strokeStyle = '#6a5a3a'; c.lineWidth = 3; c.stroke();
  ledText(c, g, `0:0${s}`, x, y, size, s <= 2 ? '#ff3b3b' : HEX.gold, undefined, undefined, FAM.bold());
}

export { W, H };
