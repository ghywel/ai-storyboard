// v2 DINNER's inserts: close-ups with a shallow focus (the room behind them is warm light out of focus, bokeh).
//   calcInsert   the uncle's thumb on his calculator: 16 x 365 = 5,840 (her hours this year), his napkin of her day
//   dumplingInsert  the aunt's heart-shaped dumpling, priced (the calculator's corner reads £2.40), cracking on "break"
//   raiInsert    chibi Rai in her bubble over the girl's yellow tee, reacting
//   potInsert    the calculator going down in the soup, its display dying; the mother's ladle stirring on, unbothered
import { W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import { clamp, ease } from '../../engine/util';
import { h01 } from '../_rai';
import { FAM, TAU, rgbaHex, mixHex } from '../_motifs';
import { focusLines, speedLines } from '../_manga';
import { pendantRai } from './_diver';
import { calculator, heartDumpling, blur, SIL } from './dinner-room';
import type { RaiOpts } from '../_rai';

type C2 = CanvasRenderingContext2D;
const PI = Math.PI;

/** The warm room out of focus: a dark wood gradient and soft discs of lamplight. */
export function bokeh(c: C2, g: C2, t: number, seed: number, o: { lampX?: number; lampY?: number; warm?: number } = {}) {
  const lx = o.lampX ?? W * 0.5, ly = o.lampY ?? -60;
  const bg = c.createRadialGradient(lx, ly, 40, lx, ly, 1500);
  bg.addColorStop(0, '#a8643a'); bg.addColorStop(0.35, '#5e3420'); bg.addColorStop(1, '#1a0c08');
  c.fillStyle = bg; c.fillRect(-200, -200, W + 400, H + 400);
  for (let i = 0; i < 16; i++) {
    const x = h01(i, seed, 1) * W, y = h01(i, seed, 2) * H * 0.8, r = 30 + 70 * h01(i, seed, 3), a = 0.06 + 0.12 * h01(i, seed, 4);
    const gr = c.createRadialGradient(x, y, r * 0.7, x, y, r);
    gr.addColorStop(0, `rgba(255,200,130,${a})`); gr.addColorStop(1, 'rgba(255,200,130,0)');
    c.fillStyle = gr; c.beginPath(); c.arc(x + 4 * Math.sin(t * 0.7 + i), y, r, 0, TAU); c.fill();
  }
  const lg = g.createRadialGradient(lx, ly, 10, lx, ly, 520);
  lg.addColorStop(0, `rgba(255,190,110,${0.5 * (o.warm ?? 1)})`); lg.addColorStop(1, 'rgba(255,190,110,0)');
  g.fillStyle = lg; g.fillRect(lx - 600, ly - 600, 1200, 1200);
}

/** The wood of the table top, close (grain lines curving round the hole off-frame). */
function woodTop(c: C2, y0: number, seed: number) {
  const tg = c.createLinearGradient(0, y0, 0, H);
  tg.addColorStop(0, '#c9a06a'); tg.addColorStop(1, '#8a5e36');
  c.fillStyle = tg; c.fillRect(-100, y0, W + 200, H - y0 + 100);
  c.strokeStyle = 'rgba(110,64,28,0.28)'; c.lineWidth = 3;
  for (let k = 0; k < 9; k++) { const r = 900 + k * 120 + 40 * h01(k, seed); c.beginPath(); c.ellipse(W * 0.5, y0 - 600, r * 1.4, r * 0.62, 0, 0.2, PI - 0.2); c.stroke(); }
}

export function calcInsert(c: C2, g: C2, t: number, t0: number, taps: number[], text: string, key: number) {
  bokeh(c, g, t, 3, { lampX: W * 0.72, lampY: -40 });
  const lt = t - t0, push = 1 + 0.03 * lt;
  c.save(); c.translate(W / 2, H / 2); c.scale(push, push); c.translate(-W / 2, -H / 2);
  woodTop(c, H * 0.66, 2);
  // his napkin of sums under it: what he is counting is her day
  c.save(); c.translate(W * 0.26, H * 0.82); c.rotate(-0.1);
  c.fillStyle = '#f4f1e6'; c.fillRect(-170, -110, 340, 230);
  c.strokeStyle = 'rgba(80,80,120,0.25)'; c.lineWidth = 2; for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(-160, -80 + k * 36); c.lineTo(160, -80 + k * 36); c.stroke(); }
  c.fillStyle = 'rgba(40,40,80,0.85)'; c.font = font(FAM.mono(), 30); c.textAlign = 'left'; c.textBaseline = 'middle';
  ['4am  ✓', 'soup ✓', 'lunchbox ✓', 'fever ✓'].forEach((r, k) => c.fillText(r, -140, -86 + k * 44));
  c.restore();
  // his arm and hand (silhouette, rim-lit) holding it; the other hand's finger tapping
  const cx = W * 0.56, cy = H * 0.45, s = 7.2;
  c.fillStyle = SIL;
  c.beginPath(); c.moveTo(-100, H * 0.95); c.quadraticCurveTo(W * 0.3, H * 0.9, cx - 80, cy + 230); c.lineTo(cx + 40, cy + 250); c.quadraticCurveTo(W * 0.32, H * 1.05, -100, H * 1.2); c.closePath(); c.fill();
  c.beginPath(); c.ellipse(cx - 40, cy + 220, 120, 80, -0.3, 0, TAU); c.fill();
  calculator(c, g, cx, cy, s, -0.06, text, 1, key);
  // the light on the LCD
  g.fillStyle = 'rgba(200,230,170,0.12)'; g.fillRect(cx - 130, cy - 210, 260, 100);
  // the tapping finger: comes down onto the key on each tap
  let last = -1e9; for (const x of taps) if (x <= t && x > last) last = x;
  const press = clamp(1 - (t - last) / 0.12), kx = key >= 0 ? -17 + (key % 4) * 9.6 + 3.8 : 0, ky = key >= 0 ? -7 + Math.floor(key / 4) * 8 + 3 : 0;
  const tip = { x: cx + (kx * Math.cos(-0.06) - ky * Math.sin(-0.06)) * s, y: cy + (kx * Math.sin(-0.06) + ky * Math.cos(-0.06)) * s - 40 * (1 - press) };
  c.strokeStyle = SIL; c.lineCap = 'round';
  c.lineWidth = 120; c.beginPath(); c.moveTo(W + 160, H * 0.2); c.quadraticCurveTo(W * 0.86, tip.y - 60, tip.x + 120, tip.y - 40); c.stroke();
  c.lineWidth = 46; c.beginPath(); c.moveTo(tip.x + 120, tip.y - 40); c.lineTo(tip.x + 4, tip.y - 6); c.stroke();
  c.strokeStyle = 'rgba(255,200,130,0.75)'; c.lineWidth = 4; c.beginPath(); c.moveTo(tip.x + 116, tip.y - 66); c.lineTo(tip.x + 10, tip.y - 30); c.stroke();
  c.restore();
}

export function dumplingInsert(c: C2, g: C2, t: number, t0: number, crack: number, brk: number, price: string) {
  bokeh(c, g, t, 7, { lampX: W * 0.4, lampY: -80 });
  const lt = t - t0, k = ease.outExpo(clamp((t - brk) / 0.12)) * (1 - ease.inOutQuad(clamp((t - brk - 0.15) / 0.5)));
  const z = 1 + 0.02 * lt + 0.06 * k;
  c.save(); c.translate(W / 2, H * 0.55); c.scale(z, z); c.translate(-W / 2, -H * 0.55);
  // the aunt behind, out of focus: her hands at her chest, her orange headscarf
  c.save(); blur(c, 14);
  c.fillStyle = SIL; c.beginPath(); c.ellipse(W * 0.5, H * 0.05, 330, 360, 0, 0, TAU); c.fill();
  c.fillStyle = HEX.orange; c.beginPath(); c.arc(W * 0.5, -H * 0.42, 260, 0, PI); c.fill();
  c.fillStyle = '#1d1218'; c.beginPath(); c.ellipse(W * 0.46, H * 0.2, 110, 70, -0.3, 0, TAU); c.fill(); c.beginPath(); c.ellipse(W * 0.56, H * 0.22, 100, 60, 0.3, 0, TAU); c.fill();
  c.restore();
  woodTop(c, H * 0.5, 5);
  // her plate, close
  c.save(); c.translate(W * 0.5, H * 0.72); c.scale(1, 0.42);
  c.fillStyle = 'rgba(60,30,10,0.35)'; c.beginPath(); c.arc(20, 50, 470, 0, TAU); c.fill();
  c.fillStyle = '#f2f0ea'; c.beginPath(); c.arc(0, 0, 470, 0, TAU); c.fill();
  c.strokeStyle = '#4a7ab8'; c.lineWidth = 30; c.beginPath(); c.arc(0, 0, 404, 0, TAU); c.stroke();
  c.fillStyle = '#e4e0d6'; c.beginPath(); c.arc(0, 0, 310, 0, TAU); c.fill();
  c.restore();
  // the dumpling: a shadow, then the heart
  c.fillStyle = 'rgba(80,50,20,0.3)'; c.beginPath(); c.ellipse(W * 0.5 + 20, H * 0.76, 230, 50, 0, 0, TAU); c.fill();
  heartDumpling(c, W * 0.5, H * 0.56, 8.4, crack, t);
  // the calculator's corner, pricing it
  c.save(); c.translate(W * 0.15, H * 0.3); c.rotate(0.25); blur(c, 3);
  calculator(c, g, 0, 0, 7.5, 0, price, 1);
  c.restore();
  c.restore();
  if (k > 0.05) focusLines(c, W / 2, H * 0.52, 360, rgbaHex('#ffffff', 0.5 * k), t, { n: 70 });
}

export function raiInsert(c: C2, g: C2, t: number, t0: number, rai: Partial<RaiOpts>, fx: 'focus' | 'speed' | 'none') {
  // her yellow tee fills the frame, the cord, the pebble; the bubble big
  const tg = c.createLinearGradient(0, 0, W, H);
  tg.addColorStop(0, '#f6c83a'); tg.addColorStop(1, '#c8902a');
  c.fillStyle = tg; c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(150,100,20,0.35)'; c.lineWidth = 8;
  for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(-50, 200 + k * 260); c.quadraticCurveTo(W * 0.5, 120 + k * 260 + 60 * Math.sin(k), W + 50, 240 + k * 250); c.stroke(); }
  c.fillStyle = SIL; c.beginPath(); c.ellipse(W * 0.2, -120, 520, 300, 0.1, 0, TAU); c.fill();   // her chin and neck
  c.strokeStyle = 'rgba(255,220,150,0.6)'; c.lineWidth = 6; c.beginPath(); c.ellipse(W * 0.2, -120, 520, 300, 0.1, 0.2, 1.4); c.stroke();
  const px = W * 0.33, py = H * 0.86;
  c.strokeStyle = '#c9a24a'; c.lineWidth = 6; c.beginPath(); c.moveTo(W * 0.12, 0); c.quadraticCurveTo(W * 0.2, H * 0.6, px, py - 40); c.stroke();
  const lt = t - t0;
  if (fx === 'focus') focusLines(c, px + 70 * 4.2, py - 90 * 4.2, 300, 'rgba(255,255,255,0.75)', t, { n: 90 });
  if (fx === 'speed') speedLines(c, 0.2, 'rgba(255,255,255,0.55)', t, { n: 50 });
  pendantRai(c, g, px, py, 4.2, t, clamp(0.85 + lt * 2), rai, 0.4);
}

export function potInsert(c: C2, g: C2, t: number, t0: number, down: number, ladleT: number) {
  bokeh(c, g, t, 11, { lampX: W * 0.5, lampY: -200, warm: 0.8 });
  const lt = t - t0, z = 1 + 0.025 * lt;
  c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2);
  woodTop(c, H * 0.62, 9);
  // the pot, from above at an angle
  const cx = W * 0.5, cy = H * 0.5, r = 560, ry = 300;
  c.fillStyle = 'rgba(30,15,5,0.45)'; c.beginPath(); c.ellipse(cx + 30, cy + 120, r * 1.05, ry * 1.05, 0, 0, TAU); c.fill();
  c.fillStyle = '#2a2624'; c.beginPath(); c.ellipse(cx, cy + 60, r, ry, 0, 0, TAU); c.fill();
  c.fillStyle = '#3a3330'; c.beginPath(); c.ellipse(cx, cy, r, ry, 0, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(255,190,120,0.35)'; c.lineWidth = 6; c.beginPath(); c.ellipse(cx, cy, r - 3, ry - 3, 0, PI * 1.1, PI * 1.6); c.stroke();
  c.save(); c.beginPath(); c.ellipse(cx, cy + 14, r * 0.9, ry * 0.86, 0, 0, TAU); c.clip();
  const sg = c.createRadialGradient(cx - 120, cy - 60, 30, cx, cy, r);
  sg.addColorStop(0, '#f08a4a'); sg.addColorStop(1, '#a8401c');
  c.fillStyle = sg; c.fillRect(cx - r, cy - ry, 2 * r, 2 * ry);
  // bits in the soup: greens, a slice of carrot
  for (let k = 0; k < 14; k++) { const a = h01(k, 31) * TAU, d = Math.sqrt(h01(k, 32)); c.fillStyle = k % 3 ? 'rgba(120,180,60,0.8)' : 'rgba(255,170,60,0.9)'; c.beginPath(); c.ellipse(cx + Math.cos(a + lt * 0.3) * d * r * 0.8, cy + 14 + Math.sin(a + lt * 0.3) * d * ry * 0.75, 18, 9, a, 0, TAU); c.fill(); }
  // the calculator, going down: tilting, sinking on "down", the display dying
  const sink = ease.inOutCubic(clamp(down));
  c.save(); c.translate(cx + 60, cy + 10 + 60 * sink); c.rotate(0.35 + 0.25 * sink);
  c.globalAlpha = 1 - 0.75 * sink;
  const flick = (Math.floor(t * 30) % 3) ? 1 : 0.4;
  const txt = sink < 0.25 ? '8.8.8.8.' : sink < 0.6 ? 'Err' : '';
  calculator(c, g, 0, 0, 6.2, 0, txt, (1 - sink) * flick, -1);
  c.restore();
  c.fillStyle = 'rgba(200,80,30,0.55)'; c.beginPath(); c.ellipse(cx + 60, cy + 150, 240, 60 + 30 * sink, 0, 0, TAU); c.fill();   // soup closing over it
  // rings and bubbles where it went
  for (let k = 0; k < 3; k++) { const u = ((lt * 0.9 + k / 3) % 1); c.strokeStyle = `rgba(255,220,180,${0.45 * (1 - u)})`; c.lineWidth = 5; c.beginPath(); c.ellipse(cx + 60, cy + 40, 160 + 260 * u, 50 + 80 * u, 0, 0, TAU); c.stroke(); }
  for (let k = 0; k < 6; k++) { const u = ((lt * 1.6 + h01(k, 41)) % 1); c.strokeStyle = 'rgba(255,230,200,0.6)'; c.lineWidth = 3; c.beginPath(); c.arc(cx + 60 + (h01(k, 42) - 0.5) * 200, cy + 40 - u * 20, 8 + 10 * h01(k, 43), 0, TAU); c.stroke(); }
  c.restore();
  // the mother's ladle stirring on (she does not even look)
  const a = ladleT * 2.2, lx = cx - 160 + Math.cos(a) * 180, ly = cy + 20 + Math.sin(a) * 70;
  c.strokeStyle = '#b8b8b0'; c.lineWidth = 22; c.lineCap = 'round'; c.beginPath(); c.moveTo(lx, ly); c.lineTo(W * 0.1, -80); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 6; c.beginPath(); c.moveTo(lx + 6, ly - 4); c.lineTo(W * 0.1 + 6, -84); c.stroke();
  c.fillStyle = '#9a9a92'; c.beginPath(); c.ellipse(lx, ly + 8, 70, 30, 0, 0, TAU); c.fill();
  c.fillStyle = SIL; c.beginPath(); c.ellipse(W * 0.06, -60, 120, 90, 0.6, 0, TAU); c.fill();   // her hand at the top of the frame
  // steam
  for (let k = 0; k < 4; k++) {
    const u = ((t * 0.4 + k / 4) % 1);
    c.strokeStyle = `rgba(255,245,230,${0.3 * Math.sin(PI * u)})`; c.lineWidth = 36; c.lineCap = 'round';
    c.beginPath(); for (let i = 0; i <= 10; i++) { const v = i / 10, px = cx - 300 + k * 200 + Math.sin(v * 5 + t * 2 + k) * 40, py = cy - 100 - (u * 400 + v * 200); i ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke();
  }
  c.restore();
  void mixHex;
}
