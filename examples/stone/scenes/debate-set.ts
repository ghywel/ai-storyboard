// The set for the bridge (`debate`): Yap's beach at dusk, where five voices argue around the stone. Each voice stands
// by a prop that tells their view (a calculator on a crate, a market stall with price tags, a front door, a noticeboard
// with a payslip and a calendar of years, a scoreboard on a pole), with a lantern in their colour that lights when they
// speak. World units: the sand at y = 0 (y down), Rai at x = 0. Canvas2D, pure functions of t.
import { font } from '../engine/type';
import { clamp, ease } from '../engine/util';
import { h01 } from './_rai';
import { FAM, TAU, rgbaHex, type C2 } from './_motifs';
import { cloud, discStone, palmTree } from './_world';

export const SAND = '#e8b98a', SAND_DARK = '#c9925f';

/** Shade a colour towards dusk violet. */
export function dusk(hex: string, k: number): string {
  const p = parseInt(hex.slice(1), 16), q = 0x2a1f4a, v = clamp(k);
  const ch = (s: number) => Math.round(((p >> s) & 255) + (((q >> s) & 255) - ((p >> s) & 255)) * v);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

/**
 * The far layer in screen space (parallax): the dusk sky darkening with `night` (0..1), the sun on the horizon (it
 * sinks as the debate goes on), clouds, the first star, the sea with the sun's path, the steamship far out.
 */
export function duskSky(c: C2, t: number, horizon: number, W: number, H: number, o: { night: number; sunX: number; sunSink: number }) {
  const n = clamp(o.night);
  const g = c.createLinearGradient(0, 0, 0, horizon);
  g.addColorStop(0, dusk('#3b2a7a', 0.2 + 0.6 * n)); g.addColorStop(0.55, dusk('#c4567a', 0.15 + 0.5 * n)); g.addColorStop(1, dusk('#ff9a5a', 0.1 + 0.45 * n));
  c.fillStyle = g; c.fillRect(0, 0, W, horizon + 2);
  // stars come out as it darkens; the first one (Venus) early, low in the west
  for (let i = 0; i < 90; i++) {
    const a = clamp(n * 1.6 - h01(i, 7) * 0.9);
    if (a <= 0) continue;
    c.fillStyle = `rgba(255,255,255,${0.7 * a * (0.5 + 0.5 * Math.sin(t * (1 + 2 * h01(i, 8)) + i))})`;
    c.beginPath(); c.arc(h01(i, 5) * W, h01(i, 6) * horizon * 0.6, 0.8 + 1.2 * h01(i, 9), 0, TAU); c.fill();
  }
  c.save(); c.shadowColor = '#fff6dc'; c.shadowBlur = 16; c.fillStyle = '#fff6dc';
  c.beginPath(); c.arc(W * 0.16, horizon * 0.34, 3.5, 0, TAU); c.fill(); c.restore();
  // the sun, sinking
  const sy = horizon + o.sunSink;
  c.save();
  c.beginPath(); c.rect(0, 0, W, horizon); c.clip();
  const sg = c.createRadialGradient(o.sunX, sy, 40, o.sunX, sy, 420);
  sg.addColorStop(0, 'rgba(255,190,110,0.55)'); sg.addColorStop(1, 'rgba(255,190,110,0)');
  c.fillStyle = sg; c.fillRect(0, 0, W, horizon);
  c.fillStyle = '#ffcf6b'; c.shadowColor = '#ffcf6b'; c.shadowBlur = 60;
  c.beginPath(); c.arc(o.sunX, sy, 110, 0, TAU); c.fill();
  c.restore();
  for (let i = 0; i < 5; i++) {
    const x = ((h01(i, 11) * (W + 600) + t * (6 + 5 * h01(i, 12))) % (W + 600)) - 300, y = horizon * (0.15 + 0.45 * h01(i, 13));
    cloud(c, x, y, 60 + 70 * h01(i, 14), dusk('#ff9fa0', 0.2 + 0.6 * n).replace('rgb', 'rgba').replace(')', ',0.75)'));
  }
  // the sea, with the sun's path and lines of swell
  const se = c.createLinearGradient(0, horizon, 0, H);
  se.addColorStop(0, dusk('#ff9a5a', 0.3 + 0.4 * n)); se.addColorStop(0.08, dusk('#4a3f8f', 0.2 + 0.4 * n)); se.addColorStop(1, dusk('#3a3480', 0.3 + 0.4 * n));
  c.fillStyle = se; c.fillRect(0, horizon, W, H - horizon);
  for (let i = 0; i < 26; i++) {
    const u = h01(i, 21), y = horizon + 6 + (H - horizon) * u * u * 0.8, w = (14 + 70 * h01(i, 22)) * (0.4 + u);
    const x = o.sunX + (h01(i, 23) - 0.5) * (120 + 500 * u) + 10 * Math.sin(t * 1.3 + i);
    c.fillStyle = `rgba(255,214,140,${(0.25 + 0.5 * h01(i, 24)) * (1 - 0.5 * n)})`;
    c.fillRect(x - w / 2, y, w, 2 + 2 * u);
  }
  // the steamship far out: the world of money, watching
  steamer(c, W * 0.82, horizon + 4, 0.3, t, dusk('#5a4f8f', 0.3 + 0.5 * n));
}

function steamer(c: C2, x: number, y: number, k: number, t: number, col: string) {
  c.fillStyle = col;
  c.beginPath(); c.moveTo(x - 300 * k, y - 40 * k); c.lineTo(x + 330 * k, y - 40 * k); c.lineTo(x + 280 * k, y); c.lineTo(x - 260 * k, y); c.closePath(); c.fill();
  c.fillRect(x - 120 * k, y - 80 * k, 220 * k, 40 * k); c.fillRect(x - 20 * k, y - 170 * k, 40 * k, 90 * k);
  for (let i = 0; i < 4; i++) {
    const u = (t * 0.25 + i / 4) % 1;
    c.fillStyle = `rgba(60,50,80,${0.4 * (1 - u)})`;
    c.beginPath(); c.arc(x + u * 140 * k, y - 190 * k - u * 110 * k, (18 + u * 46) * k, 0, TAU); c.fill();
  }
}

/** The sand in world units: from the shoreline (with foam, the tide at `tide`) down past the frame. */
export function beach(c: C2, t: number, shore: number, x0: number, x1: number, night: number, tide = 0) {
  const g = c.createLinearGradient(0, shore, 0, shore + 900);
  g.addColorStop(0, dusk(SAND, 0.08 + 0.3 * night)); g.addColorStop(1, dusk(SAND_DARK, 0.15 + 0.3 * night));
  c.fillStyle = g;
  c.beginPath(); c.moveTo(x0, shore + 2000);
  for (let x = x0; x <= x1; x += 40) c.lineTo(x, shore + 8 * Math.sin(x * 0.004) + 4 * Math.sin(x * 0.019));
  c.lineTo(x1, shore + 2000); c.closePath(); c.fill();
  // wet sand and the foam line, creeping up with the tide
  const fy = shore + tide;
  c.fillStyle = rgbaHex('#7a6a9a', 0.25);
  c.beginPath(); c.moveTo(x0, shore);
  for (let x = x0; x <= x1; x += 40) c.lineTo(x, fy + 10 + 6 * Math.sin(x * 0.01 + t * 1.5));
  c.lineTo(x1, shore); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,240,230,0.8)'; c.lineWidth = 4;
  c.beginPath();
  for (let x = x0; x <= x1; x += 30) { const y = fy + 8 + 6 * Math.sin(x * 0.01 + t * 1.5); x === x0 ? c.moveTo(x, y) : c.lineTo(x, y); }
  c.stroke();
  // ripples and shells
  c.strokeStyle = rgbaHex('#8a5a3a', 0.25); c.lineWidth = 2;
  for (let i = 0; i < 40; i++) {
    const x = x0 + h01(i, 31) * (x1 - x0), y = shore + 60 + h01(i, 32) * 700;
    c.beginPath(); c.moveTo(x - 30, y); c.quadraticCurveTo(x, y - 6, x + 30, y); c.stroke();
  }
}

/** A lantern on a post in a voice's colour; lit 0..1 (it flickers like a flame). */
export function lantern(c: C2, g: C2, x: number, y: number, h: number, col: string, lit: number, t: number, night: number) {
  c.strokeStyle = dusk('#5a3a20', 0.2 + 0.3 * night); c.lineWidth = h * 0.03; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h); c.lineTo(x + h * 0.14, y - h); c.stroke();
  const lx = x + h * 0.14, ly = y - h + h * 0.13, s = h * 0.09;
  c.strokeStyle = dusk('#3a2a20', 0.4); c.lineWidth = h * 0.012; c.beginPath(); c.moveTo(lx, y - h); c.lineTo(lx, ly - s); c.stroke();
  const fl = lit * (0.85 + 0.15 * Math.sin(t * 13 + x) * Math.sin(t * 7.3 + x));
  c.fillStyle = lit > 0.02 ? rgbaHex(col, 0.35 + 0.65 * fl) : dusk('#8a7a6a', 0.4);
  c.beginPath(); c.roundRect(lx - s * 0.7, ly - s, s * 1.4, s * 2, s * 0.4); c.fill();
  c.strokeStyle = dusk('#3a2a20', 0.3); c.lineWidth = h * 0.01; c.stroke();
  if (lit > 0.02) {
    const rg = g.createRadialGradient(lx, ly, 0, lx, ly, h * 0.28);
    rg.addColorStop(0, rgbaHex(col, 0.32 * fl)); rg.addColorStop(1, rgbaHex(col, 0));
    g.fillStyle = rg; g.fillRect(lx - h * 0.3, ly - h * 0.3, h * 0.6, h * 0.6);
  }
}

// ------------------------------------------------------------------ the five stations

/** A wooden crate with a big desk calculator on it: on "count" the display rolls up and settles on 1 and a little
 *  figure appears (she is seen). Beside it, a child's pair of shoes, polished (the care nobody counts). */
export function calcCrate(c: C2, g: C2, x: number, y: number, s: number, t: number, tCount: number, tSeen: number, col: string, night: number) {
  // the crate
  c.fillStyle = dusk('#b07a48', 0.12 + 0.3 * night); c.fillRect(x - s * 0.5, y - s * 0.55, s, s * 0.55);
  c.strokeStyle = dusk('#7a5030', 0.12 + 0.3 * night); c.lineWidth = s * 0.02;
  for (let i = 1; i < 3; i++) { c.beginPath(); c.moveTo(x - s * 0.5, y - s * 0.55 * i / 3); c.lineTo(x + s * 0.5, y - s * 0.55 * i / 3); c.stroke(); }
  c.strokeRect(x - s * 0.5, y - s * 0.55, s, s * 0.55);
  // chalk tally on the crate: four and a strike
  c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = s * 0.012;
  for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(x - s * 0.38 + i * s * 0.035, y - s * 0.12); c.lineTo(x - s * 0.37 + i * s * 0.035, y - s * 0.26); c.stroke(); }
  c.beginPath(); c.moveTo(x - s * 0.41, y - s * 0.15); c.lineTo(x - s * 0.24, y - s * 0.24); c.stroke();
  // the calculator
  const cw = s * 0.62, ch = s * 0.5, cx = x + s * 0.05, cy = y - s * 0.55 - ch;
  c.fillStyle = '#2b2f45'; c.beginPath(); c.roundRect(cx - cw / 2, cy, cw, ch, s * 0.04); c.fill();
  c.fillStyle = '#1a2a22'; c.fillRect(cx - cw * 0.42, cy + ch * 0.08, cw * 0.84, ch * 0.24);
  for (let r = 0; r < 3; r++) for (let q = 0; q < 4; q++) {
    c.fillStyle = q === 3 ? '#ff8a2a' : '#c9cbd8';
    c.beginPath(); c.roundRect(cx - cw * 0.4 + q * cw * 0.21, cy + ch * 0.42 + r * ch * 0.18, cw * 0.16, ch * 0.13, s * 0.01); c.fill();
  }
  const roll = clamp((t - tCount) / Math.max(0.3, tSeen - tCount));
  const txt = t < tCount ? '0' : roll < 1 ? String(Math.floor(h01(Math.round(t * 24), 5) * 90000 + 10000)) : '1';
  for (const k of [c, g]) {
    k.save(); k.font = font(FAM.monoB(), ch * 0.2); k.textAlign = 'right'; k.textBaseline = 'middle';
    k.fillStyle = k === g ? rgbaHex(col, 0.6) : col; k.fillText(txt, cx + cw * 0.38, cy + ch * 0.2); k.restore();
  }
  if (roll >= 1) { // the little figure in the display: she is seen
    const fx = cx - cw * 0.3, fy = cy + ch * 0.27;
    c.fillStyle = col; c.beginPath(); c.arc(fx, fy - ch * 0.12, ch * 0.035, 0, TAU); c.fill(); c.fillRect(fx - ch * 0.03, fy - ch * 0.085, ch * 0.06, ch * 0.08);
  }
  // the child's shoes
  for (const d of [0, 1]) {
    c.fillStyle = '#d94a6a'; c.beginPath(); c.ellipse(x + s * 0.68 + d * s * 0.13, y - s * 0.03, s * 0.06, s * 0.03, 0, 0, TAU); c.fill();
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x + s * 0.7 + d * s * 0.13, y - s * 0.05, s * 0.008, 0, TAU); c.fill();
  }
}

/** A market stall: a striped awning, a counter of fruit and fish with price tags on sticks, and one cake under a
 *  cloth with a heart where the price should be (not everything is for sale). The pink tag tears on "break". */
export function stall(c: C2, x: number, y: number, s: number, t: number, tBreak: number, col: string, night: number) {
  const d = 0.12 + 0.3 * night;
  // posts and awning
  c.fillStyle = dusk('#8a5a32', d);
  c.fillRect(x - s * 0.62, y - s * 1.15, s * 0.05, s * 1.15); c.fillRect(x + s * 0.57, y - s * 1.15, s * 0.05, s * 1.15);
  for (let i = 0; i < 8; i++) {
    c.fillStyle = i % 2 ? dusk('#ffffff', d) : dusk(col, d * 0.8);
    c.beginPath(); c.moveTo(x - s * 0.7 + i * s * 0.175, y - s * 1.25); c.lineTo(x - s * 0.7 + (i + 1) * s * 0.175, y - s * 1.25);
    c.lineTo(x - s * 0.7 + (i + 1) * s * 0.175, y - s * 1.08); c.quadraticCurveTo(x - s * 0.7 + (i + 0.5) * s * 0.175, y - s * 1.0, x - s * 0.7 + i * s * 0.175, y - s * 1.08); c.closePath(); c.fill();
  }
  // the counter
  c.fillStyle = dusk('#b07a48', d); c.fillRect(x - s * 0.62, y - s * 0.5, s * 1.24, s * 0.5);
  c.fillStyle = dusk('#d9a46a', d); c.fillRect(x - s * 0.66, y - s * 0.54, s * 1.32, s * 0.06);
  // baskets: mangoes, fish, the cake
  const basket = (bx: number) => { c.fillStyle = dusk('#9a6b3f', d); c.beginPath(); c.ellipse(bx, y - s * 0.56, s * 0.14, s * 0.05, 0, 0, Math.PI); c.fill(); };
  basket(x - s * 0.4);
  for (let i = 0; i < 5; i++) { c.fillStyle = dusk(i % 2 ? '#ffb02e' : '#ff8a2a', d); c.beginPath(); c.arc(x - s * 0.49 + i * s * 0.045, y - s * 0.6 - (i % 2) * s * 0.03, s * 0.035, 0, TAU); c.fill(); }
  basket(x);
  for (let i = 0; i < 3; i++) { c.fillStyle = dusk('#6f8cff', d); c.beginPath(); c.ellipse(x - s * 0.06 + i * s * 0.06, y - s * 0.6 - i * s * 0.01, s * 0.05, s * 0.022, 0.3, 0, TAU); c.fill(); }
  // the cake under its cloth, a heart tag
  c.fillStyle = dusk('#f4e7c4', d); c.beginPath(); c.ellipse(x + s * 0.4, y - s * 0.6, s * 0.13, s * 0.08, 0, Math.PI, 0); c.fill();
  c.fillStyle = '#ff4f9a'; heartShape(c, x + s * 0.4, y - s * 0.69, s * 0.04);
  // price tags on sticks
  const tagAt = (tx: number, txt: string, tear: number) => {
    c.strokeStyle = dusk('#5a3a20', d); c.lineWidth = s * 0.01; c.beginPath(); c.moveTo(tx, y - s * 0.6); c.lineTo(tx, y - s * 0.78); c.stroke();
    for (const side of [-1, 1]) {
      c.save();
      c.translate(tx + side * tear * s * 0.05, y - s * 0.83 + tear * tear * s * 0.08); c.rotate(side * tear * 0.5);
      c.beginPath(); side < 0 ? c.rect(-s * 0.09, -s * 0.045, s * 0.09, s * 0.09) : c.rect(0, -s * 0.045, s * 0.09, s * 0.09); c.clip();
      c.fillStyle = tear > 0 ? col : '#f7f1e3'; c.beginPath(); c.roundRect(-s * 0.09, -s * 0.045, s * 0.18, s * 0.09, s * 0.015); c.fill();
      c.fillStyle = '#2a1d14'; c.font = font(FAM.monoB(), s * 0.05); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, 0, 0);
      c.restore();
    }
  };
  tagAt(x - s * 0.4, '£2', 0);
  tagAt(x, '£5', ease.outCubic(clamp((t - tBreak) / 0.4)));
}

function heartShape(c: C2, x: number, y: number, s: number) {
  c.beginPath(); c.moveTo(x, y + s * 0.35);
  c.bezierCurveTo(x - s * 1.1, y - s * 0.35, x - s * 0.5, y - s * 1.05, x, y - s * 0.45);
  c.bezierCurveTo(x + s * 0.5, y - s * 1.05, x + s * 1.1, y - s * 0.35, x, y + s * 0.35); c.fill();
}

/** A front door in a hut's wall: a lit window with a kettle steaming, a child's drawing taped to the door, a doormat;
 *  numbers drift in from the right from `tNum`, bounce off on `tOut`; the door shuts on `tHome`. */
export function frontDoor(c: C2, g: C2, x: number, y: number, s: number, t: number, tNum: number, tOut: number, tHome: number, col: string, night: number) {
  const d = 0.12 + 0.3 * night;
  // the wall and roof
  c.fillStyle = dusk('#c48a52', d); c.fillRect(x - s * 0.9, y - s * 1.3, s * 1.8, s * 1.3);
  c.strokeStyle = dusk('#a06a38', d); c.lineWidth = s * 0.012;
  for (let i = 1; i < 9; i++) { c.beginPath(); c.moveTo(x - s * 0.9, y - s * 1.3 * i / 9); c.lineTo(x + s * 0.9, y - s * 1.3 * i / 9); c.stroke(); }
  c.fillStyle = dusk('#d9b25e', d);
  c.beginPath(); c.moveTo(x - s * 1.1, y - s * 1.22); c.lineTo(x, y - s * 1.85); c.lineTo(x + s * 1.1, y - s * 1.22); c.closePath(); c.fill();
  // the window, lit warm, a kettle's steam
  const wx = x + s * 0.45, wy = y - s * 0.95;
  c.fillStyle = '#ffcf6b'; c.fillRect(wx - s * 0.2, wy - s * 0.15, s * 0.4, s * 0.3);
  const rg = g.createRadialGradient(wx, wy, 0, wx, wy, s * 0.4);
  rg.addColorStop(0, 'rgba(255,207,107,0.22)'); rg.addColorStop(1, 'rgba(255,207,107,0)');
  g.fillStyle = rg; g.fillRect(wx - s * 0.4, wy - s * 0.4, s * 0.8, s * 0.8);
  c.fillStyle = '#3a2a3a'; c.beginPath(); c.ellipse(wx - s * 0.05, wy + s * 0.1, s * 0.07, s * 0.05, 0, Math.PI, 0); c.fill();
  for (let i = 0; i < 3; i++) {
    const u = (t * 0.6 + i / 3) % 1;
    c.fillStyle = `rgba(255,255,255,${0.6 * (1 - u)})`;
    c.beginPath(); c.arc(wx - s * 0.05 + Math.sin(u * 6 + i) * s * 0.03, wy + s * 0.02 - u * s * 0.12, s * (0.02 + 0.03 * u), 0, TAU); c.fill();
  }
  c.strokeStyle = dusk('#7a5030', d); c.lineWidth = s * 0.02; c.strokeRect(wx - s * 0.2, wy - s * 0.15, s * 0.4, s * 0.3);
  c.beginPath(); c.moveTo(wx, wy - s * 0.15); c.lineTo(wx, wy + s * 0.15); c.stroke();
  // the doorway: warm light inside, the door swinging shut on "home"
  const dx = x - s * 0.3, dw = s * 0.42, dh = s * 0.85;
  c.fillStyle = '#ffd48a'; c.fillRect(dx - dw / 2, y - dh, dw, dh);
  const shut = ease.outBack(clamp((t - tHome) / 0.18));
  c.fillStyle = dusk('#7a4a2a', d);
  const lw = dw * (0.18 + 0.82 * clamp(shut));
  c.fillRect(dx - dw / 2, y - dh, lw, dh);
  if (shut > 0.6) { // the child's drawing taped to the door: a house, three figures
    c.fillStyle = '#f7f1e3'; c.fillRect(dx - dw * 0.25, y - dh * 0.7, dw * 0.5, dw * 0.38);
    c.strokeStyle = '#ff4f9a'; c.lineWidth = s * 0.008;
    c.beginPath(); c.moveTo(dx - dw * 0.15, y - dh * 0.5); c.lineTo(dx, y - dh * 0.62); c.lineTo(dx + dw * 0.15, y - dh * 0.5); c.stroke();
    for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(dx - dw * 0.12 + i * dw * 0.12, y - dh * 0.43, s * 0.008, 0, TAU); c.stroke(); }
    c.fillStyle = '#f6c453'; c.beginPath(); c.arc(dx + dw * 0.1, y - dh * 0.4, s * 0.012, 0, TAU); c.fill();
  }
  c.strokeStyle = dusk('#5a3a20', d); c.lineWidth = s * 0.03; c.strokeRect(dx - dw / 2, y - dh, dw, dh);
  // the doormat
  c.fillStyle = dusk('#9a6b3f', d); c.fillRect(dx - dw * 0.6, y - s * 0.02, dw * 1.2, s * 0.06);
  // numbers drifting in to the door, bounced off
  const glyphs = ['7', '£', '%', '3', '0', '9', '£'];
  for (let i = 0; i < glyphs.length; i++) {
    const t0 = tNum + i * 0.1;
    if (t < t0) continue;
    const fly = clamp((t - t0) / 1.1), bounce = clamp((t - tOut) / 0.9);
    const sx = x + s * (1.4 + 0.5 * h01(i, 61)), sy = y - s * (0.4 + 0.9 * h01(i, 62));
    let px = sx + (dx + dw - sx) * ease.outCubic(fly) * 0.75, py = sy + (y - dh * 0.5 - sy) * fly * 0.4;
    if (t > tOut) { px += bounce * s * (1.2 + 0.6 * h01(i, 63)); py += bounce * bounce * s * 1.1 - bounce * s * 0.5; }
    c.save(); c.globalAlpha = 1 - bounce; c.font = font(FAM.hook(), s * 0.26); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.translate(px, py); c.rotate((h01(i, 64) - 0.5) * 0.6 + bounce * 3 * (h01(i, 65) - 0.3));
    c.fillStyle = '#1a1230'; c.fillText(glyphs[i]!, 5, 5); c.fillStyle = '#f4f1ea'; c.fillText(glyphs[i]!, 0, 0); c.restore();
  }
}

/** A noticeboard on two posts: a payslip (£) and a calendar of years that counts up on the beats from `tYears`;
 *  a coin drops into the payslip's box on `tPay`. Beside it an empty rocking chair: the years of her own. */
export function noticeboard(c: C2, x: number, y: number, s: number, t: number, tPay: number, tYears: number, beat: number, col: string, night: number) {
  const d = 0.12 + 0.3 * night;
  c.fillStyle = dusk('#7a5030', d); c.fillRect(x - s * 0.5, y - s * 1.3, s * 0.05, s * 1.3); c.fillRect(x + s * 0.45, y - s * 1.3, s * 0.05, s * 1.3);
  c.fillStyle = dusk('#c49a5e', d); c.fillRect(x - s * 0.58, y - s * 1.45, s * 1.16, s * 0.72);
  c.strokeStyle = dusk('#7a5030', d); c.lineWidth = s * 0.025; c.strokeRect(x - s * 0.58, y - s * 1.45, s * 1.16, s * 0.72);
  // the payslip
  c.save(); c.translate(x - s * 0.25, y - s * 1.1); c.rotate(-0.06);
  c.fillStyle = '#f7f1e3'; c.fillRect(-s * 0.2, -s * 0.27, s * 0.4, s * 0.52);
  c.fillStyle = 'rgba(40,30,20,0.5)'; for (let i = 0; i < 5; i++) c.fillRect(-s * 0.15, -s * 0.15 + i * s * 0.07, s * (0.18 + 0.1 * h01(i, 3)), s * 0.02);
  c.font = font(FAM.monoB(), s * 0.08); c.fillStyle = t >= tPay ? '#3a8a2a' : 'rgba(40,30,20,0.5)'; c.textAlign = 'center';
  c.fillText(t >= tPay ? '£ PAID' : '£ 0', 0, s * 0.2);
  c.fillStyle = '#d94a4a'; c.beginPath(); c.arc(0, -s * 0.24, s * 0.02, 0, TAU); c.fill();
  c.restore();
  // the calendar of years
  const flips = t < tYears ? 0 : Math.floor((t - tYears) / beat) + 1;
  c.save(); c.translate(x + s * 0.25, y - s * 1.1); c.rotate(0.05);
  c.fillStyle = '#f7f1e3'; c.fillRect(-s * 0.18, -s * 0.24, s * 0.36, s * 0.48);
  c.fillStyle = col; c.fillRect(-s * 0.18, -s * 0.24, s * 0.36, s * 0.1);
  c.font = font(FAM.monoB(), s * 0.05); c.fillStyle = '#1a1230'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('YEARS', 0, -s * 0.19);
  c.font = font(FAM.hook(), s * 0.18); c.fillText(String(flips), 0, s * 0.06);
  c.fillStyle = '#d94a4a'; c.beginPath(); c.arc(0, -s * 0.26, s * 0.02, 0, TAU); c.fill();
  c.restore();
  // the coin
  if (t >= tPay - 0.35) {
    const drop = ease.outBack(clamp((t - tPay + 0.35) / 0.35));
    const cx = x - s * 0.25, cy = y - s * 1.75 + drop * s * 0.5;
    c.fillStyle = '#f6c453'; c.beginPath(); c.arc(cx, cy, s * 0.07, 0, TAU); c.fill();
    c.strokeStyle = '#b8862a'; c.lineWidth = s * 0.012; c.stroke();
    c.fillStyle = '#b8862a'; c.font = font(FAM.hook(), s * 0.08); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('£', cx, cy + s * 0.005);
  }
  // the empty rocking chair
  const rx = x + s * 0.95, rock = Math.sin(t * 1.4) * 0.06;
  c.save(); c.translate(rx, y); c.rotate(rock);
  c.strokeStyle = dusk('#8a5a32', d); c.lineWidth = s * 0.03; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-s * 0.22, -s * 0.02); c.quadraticCurveTo(0, s * 0.04, s * 0.22, -s * 0.02); c.stroke();
  c.beginPath(); c.moveTo(-s * 0.15, 0); c.lineTo(-s * 0.15, -s * 0.3); c.lineTo(s * 0.15, -s * 0.3); c.lineTo(s * 0.15, 0); c.stroke();
  c.beginPath(); c.moveTo(-s * 0.15, -s * 0.3); c.lineTo(-s * 0.2, -s * 0.7); c.moveTo(-s * 0.18, -s * 0.5); c.lineTo(s * 0.0, -s * 0.5); c.stroke();
  c.restore();
}

/** A scoreboard on a pole (GDP digits ticking up), cracked on `tSmash`, toppling on `tDown`. It hides the sun until
 *  it falls; behind it, a hopscotch in the sand (play nobody scores). */
export function scoreboard(c: C2, x: number, y: number, s: number, t: number, tSmash: number, tDown: number, col: string, night: number) {
  const d = 0.12 + 0.3 * night;
  // the hopscotch
  c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = s * 0.012;
  for (let i = 0; i < 4; i++) c.strokeRect(x - s * 0.9 + i * s * 0.16, y + s * 0.02 - (i % 2) * s * 0.04, s * 0.15, s * 0.1);
  const fall = ease.inCubic(clamp((t - tDown) / 0.55));
  c.save(); c.translate(x, y); c.rotate(-fall * 1.35);
  c.fillStyle = dusk('#6a6a7a', d); c.fillRect(-s * 0.03, -s * 1.3, s * 0.06, s * 1.3);
  c.fillStyle = '#1a1a26'; c.fillRect(-s * 0.5, -s * 1.75, s * 1.0, s * 0.5);
  c.strokeStyle = dusk('#9a9aaa', d); c.lineWidth = s * 0.02; c.strokeRect(-s * 0.5, -s * 1.75, s * 1.0, s * 0.5);
  c.font = font(FAM.monoB(), s * 0.07); c.fillStyle = '#c9cbd8'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('SCORE  (GDP)', 0, -s * 1.67);
  const v = t < tSmash ? Math.floor(((t * 7) % 1) * 100) + 1000 * Math.floor(t * 3 % 10) : 0;
  c.font = font(FAM.monoB(), s * 0.2); c.fillStyle = t < tSmash ? '#ff5a5f' : 'rgba(255,90,95,0.35)';
  c.fillText(t < tSmash ? String(v).padStart(5, '0') : '-----', 0, -s * 1.47);
  if (t >= tSmash) { // cracks from the blow
    const cr = clamp((t - tSmash) / 0.1);
    c.strokeStyle = '#f4f1ea'; c.lineWidth = s * 0.012;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU + 0.4, ix = s * 0.18, iy = -s * 1.5;
      c.beginPath(); c.moveTo(ix, iy); c.lineTo(ix + Math.cos(a) * s * 0.14 * cr, iy + Math.sin(a) * s * 0.1 * cr); c.lineTo(ix + Math.cos(a + 0.25) * s * 0.3 * cr, iy + Math.sin(a + 0.25) * s * 0.2 * cr); c.stroke();
    }
  }
  c.restore();
  void col;
}

/** A hammer held at (x, y) (the hand), pointing along `rot` (0 = head up). */
export function hammerAt(c: C2, x: number, y: number, s: number, rot: number) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.fillStyle = '#9a6b3f'; c.fillRect(-s * 0.04, -s * 0.75, s * 0.08, s * 0.85);
  c.fillStyle = '#5b6070'; c.beginPath(); c.roundRect(-s * 0.24, -s * 0.9, s * 0.48, s * 0.2, s * 0.03); c.fill();
  c.restore();
}

/** Palms in world units, shaded towards dusk. */
export function palms(c: C2, t: number, spots: [number, number, number, number][], night: number) {
  spots.forEach(([x, y, h, lean], i) => palmTree(c, x, y, h, lean, t, i, 0.2 + 0.35 * night));
}

/** A rai stone on the sand (set dressing), darker at dusk. */
export function sandStone(c: C2, x: number, y: number, r: number, tilt: number, night: number) {
  discStone(c, x, y - r * 0.95, r, tilt, 0.2 + 0.35 * night);
}
