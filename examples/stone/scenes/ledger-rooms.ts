// Rooms for the ledger and pre2 plates (his direction, 2026-10-02: "a real, detailed room", with symbolic details):
// the kitchen at 4 am, the statistics office across the road, the home before and after the wedding, its TV, and a
// taxi at night. Canvas2D, 1920x1080 logical, pure functions of t.
import { W, H } from '../engine/gl';
import { HEX } from '../engine/palette';
import { font } from '../engine/type';
import { clamp, frameIdx, lerp } from '../engine/util';
import { h01 } from './_rai';
import { FAM, TAU, emote, gradientV, ledger, person, rgbaHex, type Emote, type LedgerRow } from './_motifs';
import { heart } from './_manga';

type C = CanvasRenderingContext2D;
export const WARM_A = '#ffcf7a', WARM_B = '#e8742c';

let NULL_G: CanvasRenderingContext2D | null = null;
/** A throwaway 2D context, for drawing a room inside a clipped panel without its glows spilling over the frame. */
export function nullCtx(): CanvasRenderingContext2D {
  if (!NULL_G) { const cv = document.createElement('canvas'); cv.width = 2; cv.height = 2; NULL_G = cv.getContext('2d')!; }
  return NULL_G;
}

/** Run `draw` with the same transform (and optional clip) on both the main and the glow layer. */
export function both(c: CanvasRenderingContext2D, g: CanvasRenderingContext2D, xf: (cc: CanvasRenderingContext2D) => void, draw: () => void) {
  c.save(); g.save(); xf(c); xf(g);
  draw();
  g.restore(); c.restore();
}

/** The same round wall clock in every room it hangs in: a wooden rim, a cream face, hands at t (or at a set time). */
export function wallClock(c: C, x: number, y: number, r: number, t: number, o: { hours?: number; rim?: string } = {}) {
  c.save();
  c.fillStyle = o.rim ?? '#6a4428'; c.beginPath(); c.arc(x, y, r * 1.12, 0, TAU); c.fill();
  c.fillStyle = '#f6efdc'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.strokeStyle = '#2a1d14';
  for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU, r0 = r * (k % 3 ? 0.84 : 0.74); c.lineWidth = r * (k % 3 ? 0.03 : 0.06); c.beginPath(); c.moveTo(x + Math.sin(a) * r0, y - Math.cos(a) * r0); c.lineTo(x + Math.sin(a) * r * 0.92, y - Math.cos(a) * r * 0.92); c.stroke(); }
  const hrs = o.hours ?? 10 + t / 60, ha = (hrs / 12) * TAU, ma = (hrs % 1) * TAU, sa = t * TAU / 4;
  c.lineCap = 'round';
  c.lineWidth = r * 0.08; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(ha) * r * 0.5, y - Math.cos(ha) * r * 0.5); c.stroke();
  c.lineWidth = r * 0.05; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(ma) * r * 0.76, y - Math.cos(ma) * r * 0.76); c.stroke();
  c.strokeStyle = HEX.coral; c.lineWidth = r * 0.025; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(sa) * r * 0.82, y - Math.cos(sa) * r * 0.82); c.stroke();
  c.fillStyle = '#2a1d14'; c.beginPath(); c.arc(x, y, r * 0.07, 0, TAU); c.fill();
  c.restore();
}

/** A pendant lamp with its warm pool of light. */
function lamp(c: C, g: C, x: number, y: number, reach: number, a = 0.5) {
  c.strokeStyle = '#1a1014'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, y - 40); c.stroke();
  c.fillStyle = '#3a2a2a'; c.beginPath(); c.moveTo(x - 70, y); c.lineTo(x + 70, y); c.lineTo(x + 26, y - 44); c.lineTo(x - 26, y - 44); c.closePath(); c.fill();
  g.fillStyle = rgbaHex('#ffe2a0', 0.9); g.beginPath(); g.ellipse(x, y + 2, 48, 10, 0, 0, TAU); g.fill();
  c.save(); c.globalCompositeOperation = 'screen';
  const lg = c.createRadialGradient(x, y + 40, 0, x, y + 40, reach);
  lg.addColorStop(0, rgbaHex('#ffd59a', a)); lg.addColorStop(1, rgbaHex('#ffd59a', 0));
  c.fillStyle = lg; c.fillRect(0, 0, W, H); c.restore();
}

/** A silhouette's head position (for a second emote) given person()'s feet and height (standing poses). */
export function headOf(x: number, feet: number, h: number): [number, number, number] { return [x, feet - 0.88 * h, 9 * (h / 100) * 1.5]; }

// ------------------------------------------------------------------ the kitchen at 4 am

export interface KitchenOpts { clock?: string; clockLit?: number; motherX?: number; motherH?: number; emote?: Emote; emoteT0?: number; tear?: number; packing?: number }

/**
 * The kitchen at 4 am, wide: the night window with rain on it, the mother rocking the feverish child, the counter
 * with the half-packed lunchbox and the kettle steaming, the oven clock, the fridge covered in the child's drawings
 * with the bill pinned to it, the calendar with shifts circled, a pendant lamp.
 */
export function kitchen(c: C, g: C, t: number, o: KitchenOpts = {}) {
  const fl = H * 0.82;
  // the back wall, the tiles above the counter
  gradientV(c, '#3a2a40', '#2a1d30', 0, 0, W, fl);
  c.strokeStyle = 'rgba(255,220,180,0.06)'; c.lineWidth = 2;
  for (let x = 0; x < W; x += 34) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, fl); c.stroke(); }
  c.fillStyle = '#4a3a50'; c.fillRect(0, H * 0.42, 600, H * 0.17);
  c.strokeStyle = 'rgba(20,10,20,0.35)'; c.lineWidth = 2;
  for (let y = H * 0.42; y < H * 0.59; y += 40) { c.beginPath(); c.moveTo(0, y); c.lineTo(600, y); c.stroke(); }
  for (let x = 0; x < 600; x += 50) { c.beginPath(); c.moveTo(x, H * 0.42); c.lineTo(x, H * 0.59); c.stroke(); }
  // the window: night, the moon, a street lamp, rain on the glass
  const wx = 640, wy = 120, ww = 460, wh = 340;
  c.save(); c.beginPath(); c.rect(wx, wy, ww, wh); c.clip();
  gradientV(c, '#0b0f2e', '#24285e', wx, wy, ww, wh);
  c.fillStyle = '#fff4d6'; c.beginPath(); c.arc(wx + ww * 0.75, wy + 70, 30, 0, TAU); c.fill();
  c.fillStyle = '#141236'; for (let i = 0; i < 6; i++) c.fillRect(wx + i * 80 - 10, wy + wh - 90 - 60 * h01(i, 3), 70, 200);
  c.fillStyle = 'rgba(255,214,120,0.7)'; c.fillRect(wx + 170, wy + wh - 60, 12, 14);
  const k = frameIdx(t) >> 1;
  c.strokeStyle = 'rgba(200,220,255,0.35)'; c.lineWidth = 2;
  for (let i = 0; i < 26; i++) { const x = wx + h01(i, 41) * ww, y = wy + ((h01(i, 42) * wh + t * 160 * (0.6 + h01(i, 43))) % wh); c.beginPath(); c.moveTo(x, y); c.lineTo(x - 3, y + 16); c.stroke(); }
  void k;
  c.restore();
  c.strokeStyle = '#d9c7a8'; c.lineWidth = 14; c.strokeRect(wx, wy, ww, wh);
  c.lineWidth = 8; c.beginPath(); c.moveTo(wx + ww / 2, wy); c.lineTo(wx + ww / 2, wy + wh); c.moveTo(wx, wy + wh / 2); c.lineTo(wx + ww, wy + wh / 2); c.stroke();
  c.fillStyle = '#d9c7a8'; c.fillRect(wx - 20, wy + wh, ww + 40, 16);
  // a little plant on the sill
  c.fillStyle = '#b8603a'; c.fillRect(wx + 30, wy + wh - 40, 44, 40);
  c.fillStyle = '#3c8a4a'; for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(wx + 52 + (i - 2) * 10, wy + wh - 60, 8, 24, (i - 2) * 0.35, 0, TAU); c.fill(); }
  // the calendar with shifts circled
  const cx0 = 1160, cy0 = 150;
  c.fillStyle = '#f2ead6'; c.fillRect(cx0, cy0, 170, 210);
  c.fillStyle = HEX.coral; c.fillRect(cx0, cy0, 170, 36);
  c.font = font(FAM.monoB(), 18); c.fillStyle = '#f2ead6'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('SHIFTS', cx0 + 85, cy0 + 18);
  c.strokeStyle = 'rgba(60,40,40,0.35)'; c.lineWidth = 1.5;
  for (let r = 0; r < 5; r++) for (let q = 0; q < 7; q++) {
    const bx = cx0 + 8 + q * 22.5, by = cy0 + 46 + r * 31;
    c.strokeRect(bx, by, 20, 28);
    if (h01(r, q, 7) < 0.45) { c.strokeStyle = 'rgba(220,60,90,0.85)'; c.lineWidth = 2.5; c.beginPath(); c.arc(bx + 10, by + 14, 9, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(60,40,40,0.35)'; c.lineWidth = 1.5; }
  }
  // the fridge with the child's drawings, magnets, the bill pinned up
  const fx = 1380, fy0 = 160, fw = 300, fh = fl - fy0;
  c.fillStyle = '#d8d2cc'; c.beginPath(); c.roundRect(fx, fy0, fw, fh, 18); c.fill();
  c.fillStyle = '#c4beb8'; c.fillRect(fx, fy0 + fh * 0.36, fw, 8);
  c.fillStyle = '#9a948e'; c.fillRect(fx + fw - 30, fy0 + 60, 12, 120); c.fillRect(fx + fw - 30, fy0 + fh * 0.36 + 40, 12, 160);
  drawings(c, fx + 24, fy0 + 30);
  billPaper(c, fx + 150, fy0 + 330, 1, -0.06);
  // the counter on the left: the oven with its clock, the kettle steaming, the lunchbox, the thermometer
  c.fillStyle = '#5a4250'; c.fillRect(0, H * 0.59, 640, fl - H * 0.59);
  c.fillStyle = '#7a5e6a'; c.fillRect(0, H * 0.585, 660, 22);
  c.fillStyle = '#2a2030'; c.fillRect(200, H * 0.62, 280, fl - H * 0.62 - 10);
  c.fillStyle = '#120c18'; c.fillRect(230, H * 0.71, 220, 110);
  c.fillStyle = '#0a0610'; c.fillRect(250, H * 0.635, 180, 50);
  c.font = font(FAM.monoB(), 34); c.textAlign = 'center'; c.textBaseline = 'middle';
  const lit = o.clockLit ?? 0;
  c.fillStyle = lit > 0 ? HEX.pink : rgbaHex(HEX.pink, 0.8); c.fillText(o.clock ?? '03:59', 340, H * 0.635 + 26);
  g.fillStyle = rgbaHex(HEX.pink, 0.25 + 0.4 * lit); g.fillRect(250, H * 0.635, 180, 50);
  // kettle and its steam
  c.fillStyle = '#b8bcc8'; c.beginPath(); c.moveTo(70, H * 0.585); c.lineTo(80, H * 0.52); c.quadraticCurveTo(115, H * 0.49, 150, H * 0.52); c.lineTo(160, H * 0.585); c.closePath(); c.fill();
  c.strokeStyle = '#8a8e9a'; c.lineWidth = 6; c.beginPath(); c.moveTo(160, H * 0.54); c.lineTo(185, H * 0.52); c.stroke();
  for (let i = 0; i < 6; i++) { const u = ((t * 0.6 + i / 6) % 1); c.fillStyle = `rgba(255,255,255,${0.35 * (1 - u)})`; c.beginPath(); c.arc(188 + 20 * Math.sin(u * 6 + i), H * 0.51 - u * 160, 10 + 22 * u, 0, TAU); c.fill(); }
  // the lunchbox, open, half packed
  lunchbox(c, 520, H * 0.585, 0.75, o.packing ?? 0.5);
  // the thermometer on the counter
  c.save(); c.translate(380, H * 0.575); c.rotate(-0.1);
  c.fillStyle = '#f4f1ea'; c.beginPath(); c.roundRect(-60, -10, 120, 20, 10); c.fill();
  c.fillStyle = '#2a2a3a'; c.fillRect(-36, -7, 44, 14); c.font = font(FAM.monoB(), 12); c.fillStyle = HEX.pink; c.fillText('39.4', -14, 1);
  c.restore();
  // the floor
  gradientV(c, '#3a2c34', '#1a1218', 0, fl, W, H - fl);
  c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 2;
  for (let k2 = -14; k2 <= 14; k2++) { c.beginPath(); c.moveTo(W / 2 + k2 * 80, fl); c.lineTo(W / 2 + k2 * 200, H); c.stroke(); }
  // the lamp
  lamp(c, g, 880, 100, 900, 0.42);
  // the mother, rocking the feverish child by the window
  const mx = o.motherX ?? 900, mh = o.motherH ?? 600, feet = H + 40;
  const rock = Math.sin(t * 2.2) * 0.035;
  c.save(); c.translate(mx, feet); c.rotate(rock);
  person(c, 0, 0, mh, 'hold', { col: '#1c0f1c', t, headTilt: 0.22, rim: 'rgba(255,207,122,0.85)', emote: o.emote, emoteT0: o.emoteT0 });
  c.restore();
  if ((o.tear ?? 0) > 0) { const [hx, hy, hr] = headOf(mx + Math.sin(rock) * mh * 0.88, feet, mh); emote(c, hx, hy, hr, 'tear', t, -1e9); }
  // the child's fever: a faint warm aura round the child on her shoulder
  const kx = mx + mh * 0.13, ky = feet - mh * 0.74;
  c.strokeStyle = rgbaHex(HEX.coral, 0.75); c.lineWidth = 3; c.lineCap = 'round';
  for (let i = 0; i < 3; i++) { const u = (t * 0.8 + i / 3) % 1; c.globalAlpha = 1 - u; c.beginPath(); for (let j = 0; j <= 8; j++) { const yy = ky - mh * 0.08 - u * mh * 0.12 - j * 4, xx = kx - 14 + i * 14 + 5 * Math.sin(j * 1.4 + t * 6); j ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); }
  c.globalAlpha = 1;
  return { fl, window: [wx, wy, ww, wh] as const, fridge: [fx, fy0, fw, fh] as const };
}

/** The child's drawings on the fridge: a sun, a house, the family, and a round grey stone with a heart. */
export function drawings(c: C, x: number, y: number, k = 1) {
  const sheet = (sx: number, sy: number, w: number, h: number, rot: number, draw: () => void) => {
    c.save(); c.translate(sx, sy); c.rotate(rot);
    c.fillStyle = '#fbf8ee'; c.fillRect(0, 0, w, h);
    c.fillStyle = HEX.coral; c.beginPath(); c.arc(w / 2, -2, 6 * k, 0, TAU); c.fill();
    c.lineWidth = 3 * k; c.lineCap = 'round'; draw(); c.restore();
  };
  sheet(x, y, 120 * k, 96 * k, -0.06, () => {
    c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(28 * k, 28 * k, 14 * k, 0, TAU); c.fill();
    c.strokeStyle = '#e8742c'; c.strokeRect(60 * k, 44 * k, 40 * k, 34 * k);
    c.beginPath(); c.moveTo(56 * k, 46 * k); c.lineTo(80 * k, 24 * k); c.lineTo(104 * k, 46 * k); c.stroke();
  });
  sheet(x + 135 * k, y + 12 * k, 110 * k, 96 * k, 0.08, () => {
    c.strokeStyle = '#3b6fd6';
    for (const [px, h] of [[26, 40], [56, 32], [84, 22]] as const) { c.beginPath(); c.arc(px * k, (80 - h) * k, 7 * k, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(px * k, (87 - h) * k); c.lineTo(px * k, 82 * k); c.stroke(); }
  });
  sheet(x + 30 * k, y + 120 * k, 120 * k, 100 * k, 0.04, () => {
    c.fillStyle = '#b8b0a0'; c.beginPath(); c.arc(60 * k, 52 * k, 34 * k, 0, TAU); c.fill();
    c.fillStyle = '#fbf8ee'; c.beginPath(); c.arc(60 * k, 56 * k, 10 * k, 0, TAU); c.fill();
    heart(c, 60 * k, 58 * k, 7 * k, HEX.pink);
    c.fillStyle = '#3c8a4a'; c.fillRect(0, 88 * k, 120 * k, 8 * k);
  });
}

/** The electricity bill pinned up by a magnet: AMOUNT DUE £86.40, a red FINAL stamp. */
export function billPaper(c: C, x: number, y: number, k: number, rot = 0) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(k, k);
  c.fillStyle = '#fbfaf4'; c.fillRect(-60, 0, 120, 160);
  c.fillStyle = '#3a4a8a'; c.fillRect(-60, 0, 120, 22);
  c.font = font(FAM.monoB(), 11); c.fillStyle = '#fbfaf4'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ELECTRICITY', 0, 11);
  c.fillStyle = 'rgba(40,40,60,0.35)'; for (let i = 0; i < 6; i++) c.fillRect(-48, 34 + i * 12, 60 + 30 * h01(i, 9), 4);
  c.font = font(FAM.mono(), 10); c.fillStyle = '#2a2a3a'; c.textAlign = 'left'; c.fillText('AMOUNT DUE', -48, 118);
  c.font = font(FAM.monoB(), 18); c.textAlign = 'right'; c.fillText('£86.40', 50, 138);
  c.save(); c.translate(18, 70); c.rotate(-0.3); c.strokeStyle = '#d63a4a'; c.lineWidth = 3; c.strokeRect(-36, -12, 72, 24);
  c.font = font(FAM.monoB(), 14); c.fillStyle = '#d63a4a'; c.textAlign = 'center'; c.fillText('FINAL', 0, 1); c.restore();
  c.fillStyle = HEX.lime; c.beginPath(); c.arc(0, -2, 10, 0, TAU); c.fill();
  c.restore();
}

/** The child's lunchbox, open: a sandwich, an apple, and a folded note with a heart on it (`fill` 0..1 packed). */
export function lunchbox(c: C, x: number, y: number, k: number, fill: number) {
  c.save(); c.translate(x, y); c.scale(k, k);
  c.fillStyle = '#1aa9d6'; c.beginPath(); c.moveTo(-110, -80); c.lineTo(110, -80); c.lineTo(96, -150); c.lineTo(-96, -150); c.closePath(); c.fill();
  c.fillStyle = HEX.cyan; c.beginPath(); c.roundRect(-120, -80, 240, 80, 14); c.fill();
  c.fillStyle = '#0d6a8a'; c.fillRect(-110, -78, 220, 10);
  if (fill > 0.2) { c.fillStyle = '#f2e6c9'; c.fillRect(-90, -100, 100, 40); c.fillStyle = '#d9b07a'; c.fillRect(-90, -100, 100, 9); }
  if (fill > 0.5) { c.fillStyle = HEX.coral; c.beginPath(); c.arc(50, -88, 24, 0, TAU); c.fill(); c.fillStyle = HEX.lime; c.beginPath(); c.ellipse(58, -114, 8, 5, 0.5, 0, TAU); c.fill(); }
  if (fill > 0.8) { c.fillStyle = '#fbf8ee'; c.save(); c.translate(-10, -118); c.rotate(-0.25); c.fillRect(-28, -18, 56, 36); heart(c, 0, 2, 9, HEX.pink); c.restore(); }
  c.restore();
}

// ------------------------------------------------------------------ the statistics office across the road

/**
 * The national accounts office at 4 am: dark desks with sleeping monitors, a water cooler bubbling, a clock at 04:00,
 * the cleaner's mop and bucket by a WET FLOOR sign (paid work, counted), the Ledger board on the wall, and the big
 * window on the street with her kitchen window lit across the road. Returns where her window is.
 */
export function office(c: C, g: C, t: number, rows: LedgerRow[], o: { look?: number; lid?: number; board?: [number, number, number] } = {}) {
  const fl = H * 0.8;
  gradientV(c, '#141a30', '#0c1022', 0, 0, W, fl);
  c.fillStyle = 'rgba(80,100,160,0.08)'; for (let x = 0; x < W; x += 180) c.fillRect(x, 0, 2, fl);
  // the window on the street: her building, her lit kitchen window
  const wx = 1140, wy = 110, ww = 700, wh = 520;
  c.save(); c.beginPath(); c.rect(wx, wy, ww, wh); c.clip();
  gradientV(c, '#0b0f2e', '#2b2f6a', wx, wy, ww, wh);
  c.fillStyle = '#2a1f3f'; c.fillRect(wx + 60, wy + 90, 560, wh);
  for (let r = 0; r < 4; r++) for (let q = 0; q < 4; q++) { c.fillStyle = '#171230'; c.fillRect(wx + 100 + q * 130, wy + 130 + r * 120, 80, 70); }
  const hx = wx + 100 + 130, hy = wy + 130 + 120;
  const lg = c.createLinearGradient(0, hy, 0, hy + 70); lg.addColorStop(0, WARM_A); lg.addColorStop(1, WARM_B);
  c.fillStyle = lg; c.fillRect(hx, hy, 80, 70);
  c.save(); c.beginPath(); c.rect(hx, hy, 80, 70); c.clip();
  c.translate(hx + 36, hy + 86); c.rotate(Math.sin(t * 2.2) * 0.04); person(c, 0, 0, 74, 'hold', { col: '#24101c', t, headTilt: 0.2 }); c.restore();
  g.fillStyle = rgbaHex('#ffb060', 0.35); g.fillRect(hx - 8, hy - 8, 96, 86);
  c.restore();
  c.strokeStyle = '#2a3050'; c.lineWidth = 16; c.strokeRect(wx, wy, ww, wh);
  c.lineWidth = 8; c.beginPath(); c.moveTo(wx + ww / 2, wy); c.lineTo(wx + ww / 2, wy + wh); c.stroke();
  // the clock: 04:00
  wallClock(c, 1020, 140, 46, t, { hours: 4 + (t % 60) / 3600, rim: '#3a4060' });
  // the Ledger board on the wall
  const [bx, by, bw] = o.board ?? [110, 120, 860];
  ledger(c, t, bx, by, bw, rows, { title: 'NATIONAL ACCOUNTS  ·  HOUSEHOLD 4471', blink: 1, rowH: 74, size: 32 });
  boardLights(c, g, bx + bw - 140, by + 44, 22, o.look ?? 0, o.lid ?? 0);
  // the floor and the desks with sleeping monitors
  gradientV(c, '#1a2038', '#0a0c16', 0, fl, W, H - fl);
  for (let i = 0; i < 3; i++) {
    const dx = 200 + i * 420, dy = fl - 10;
    c.fillStyle = '#232a44'; c.fillRect(dx, dy - 90, 300, 18); c.fillRect(dx + 10, dy - 72, 12, 80); c.fillRect(dx + 278, dy - 72, 12, 80);
    c.fillStyle = '#0c0f1c'; c.fillRect(dx + 90, dy - 210, 140, 100); c.fillRect(dx + 150, dy - 110, 20, 22);
    c.fillStyle = 'rgba(80,120,200,0.25)'; c.fillRect(dx + 98, dy - 202, 124, 84);
    const led = frameIdx(t) % 60 < 30; c.fillStyle = led ? HEX.lime : '#2a3a2a'; c.beginPath(); c.arc(dx + 226, dy - 116, 4, 0, TAU); c.fill();
  }
  // the water cooler, bubbling
  const qx = 1060, qy = fl;
  c.fillStyle = '#d8dce8'; c.fillRect(qx - 40, qy - 200, 80, 200);
  c.fillStyle = 'rgba(120,190,255,0.55)'; c.beginPath(); c.roundRect(qx - 44, qy - 330, 88, 130, 30); c.fill();
  for (let i = 0; i < 5; i++) { const u = (t * 0.7 + i / 5) % 1; c.strokeStyle = `rgba(230,250,255,${0.8 * (1 - u)})`; c.lineWidth = 2; c.beginPath(); c.arc(qx + 10 * Math.sin(i * 2), qy - 210 - u * 110, 5 + 4 * u, 0, TAU); c.stroke(); }
  // the cleaner's mop and bucket, the WET FLOOR sign: work in here is paid, and counted
  c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(1760, fl + 60); c.lineTo(1800, fl - 70); c.lineTo(1840, fl + 60); c.closePath(); c.fill();
  c.font = font(FAM.monoB(), 13); c.fillStyle = '#120d1d'; c.textAlign = 'center'; c.fillText('WET', 1800, fl - 6); c.fillText('FLOOR', 1800, fl + 12);
  c.fillStyle = '#3a6ad6'; c.fillRect(1650, fl - 10, 80, 70);
  c.strokeStyle = '#9a6a3a'; c.lineWidth = 8; c.beginPath(); c.moveTo(1690, fl); c.lineTo(1720, fl - 230); c.stroke();
  return { her: [hx + 40, hy + 35] as [number, number], window: [wx, wy, ww, wh] as const };
}

/** The board's two indicator lights (its only "eyes"): rings with a dot that looks (-1 right .. 1 left); lid 0..1. */
export function boardLights(c: C, g: C, x: number, y: number, r: number, look: number, lid: number) {
  for (const dx of [0, r * 2.8]) {
    const cx = x + dx;
    c.save();
    c.beginPath(); c.ellipse(cx, y, r, r * Math.max(0.06, 1 - lid), 0, 0, TAU);
    c.fillStyle = '#0a1a10'; c.fill();
    c.strokeStyle = HEX.lime; c.lineWidth = r * 0.16; c.stroke();
    c.clip();
    c.fillStyle = HEX.lime; c.beginPath(); c.arc(cx - look * r * 0.45, y, r * 0.38, 0, TAU); c.fill();
    c.restore();
    g.fillStyle = rgbaHex(HEX.lime, 0.35 * (1 - lid)); g.beginPath(); g.arc(cx, y, r * 1.3, 0, TAU); g.fill();
  }
}

// ------------------------------------------------------------------ the home (pre-chorus 2), before and after

export interface HomeOpts { after?: boolean; night?: number; tv?: (c: C, x: number, y: number, w: number, h: number) => void }

/**
 * The living room of the house with the housekeeper: warm floorboards gleaming (the same floors), a rug, a sofa, the
 * same wall clock over the mantel, a window with a curtain stirring, a TV in the corner. After the wedding: a wedding
 * photo on the mantel and confetti on the floor; nothing else changes.
 */
export function livingRoom(c: C, g: C, t: number, o: HomeOpts = {}) {
  const fl = H * 0.66, night = o.night ?? 0;
  // the wall, wainscot below
  gradientV(c, mixc('#e9cfa4', '#3a2a48', night), mixc('#d9b88a', '#2a1d38', night), 0, 0, W, fl);
  c.fillStyle = mixc('#b8875a', '#2a1a2a', night); c.fillRect(0, fl - 150, W, 150);
  c.strokeStyle = 'rgba(80,50,30,0.35)'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, fl - 150); c.lineTo(W, fl - 150); c.stroke();
  for (let x = 40; x < W; x += 160) c.strokeRect(x, fl - 130, 120, 110);
  // the window with a curtain stirring
  const wx = 120, wy = 90, ww = 380, wh = 360;
  gradientV(c, night > 0.5 ? '#0b0f2e' : '#8fd0f0', night > 0.5 ? '#2b2f6a' : '#e8f6ff', wx, wy, ww, wh);
  if (night < 0.5) { c.fillStyle = '#5aa05a'; c.beginPath(); c.arc(wx + 120, wy + wh, 120, Math.PI, 0); c.arc(wx + 300, wy + wh, 90, Math.PI, 0); c.fill(); }
  else { c.fillStyle = '#fff4d6'; c.beginPath(); c.arc(wx + 280, wy + 80, 26, 0, TAU); c.fill(); }
  c.strokeStyle = '#f4ead6'; c.lineWidth = 14; c.strokeRect(wx, wy, ww, wh);
  c.lineWidth = 8; c.beginPath(); c.moveTo(wx + ww / 2, wy); c.lineTo(wx + ww / 2, wy + wh); c.stroke();
  const sway = 12 * Math.sin(t * 1.3);
  c.fillStyle = mixc('#c64a5a', '#5a1a2a', night);
  c.beginPath(); c.moveTo(wx - 50, wy - 30); c.lineTo(wx + 90, wy - 30); c.quadraticCurveTo(wx + 60 + sway, wy + wh * 0.5, wx + 80 + sway * 1.5, wy + wh + 40); c.lineTo(wx - 50, wy + wh + 40); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(wx + ww + 50, wy - 30); c.lineTo(wx + ww - 70, wy - 30); c.quadraticCurveTo(wx + ww - 50 - sway, wy + wh * 0.5, wx + ww - 60 - sway, wy + wh + 40); c.lineTo(wx + ww + 50, wy + wh + 40); c.closePath(); c.fill();
  // the mantel and fireplace, the same clock above it
  const mx = 980;
  c.fillStyle = mixc('#efe2c8', '#4a3a48', night); c.fillRect(mx - 240, fl - 330, 480, 330);
  c.fillStyle = '#1a1014'; c.fillRect(mx - 130, fl - 220, 260, 220);
  for (let i = 0; i < 5; i++) { const fx = mx - 70 + i * 35, fh = 50 + 30 * Math.sin(t * 7 + i * 1.7); c.fillStyle = i % 2 ? '#ff8a2a' : '#ffd23f'; c.beginPath(); c.moveTo(fx - 18, fl - 10); c.quadraticCurveTo(fx, fl - 10 - fh * 1.4, fx + 18, fl - 10); c.fill(); }
  { const fg = g.createRadialGradient(mx, fl - 50, 0, mx, fl - 50, 150); fg.addColorStop(0, 'rgba(255,140,60,0.22)'); fg.addColorStop(1, 'rgba(255,140,60,0)'); g.fillStyle = fg; g.fillRect(mx - 150, fl - 200, 300, 200); }
  c.fillStyle = mixc('#d9c7a4', '#3a2a38', night); c.fillRect(mx - 280, fl - 350, 560, 26);
  wallClock(c, mx, fl - 520, 80, t);
  // on the mantel: a vase of flowers, and the photo frame (after the wedding: the wedding photo)
  c.fillStyle = '#4a6ab8'; c.fillRect(mx - 220, fl - 420, 50, 70);
  for (let i = 0; i < 5; i++) { c.fillStyle = ['#ff4f9a', '#ffd23f', '#ff8a2a', '#c65cf0', '#ff5a5f'][i]!; c.beginPath(); c.arc(mx - 230 + i * 18, fl - 440 - 14 * Math.sin(i * 1.3), 12, 0, TAU); c.fill(); }
  c.fillStyle = '#c9a44a'; c.fillRect(mx + 120, fl - 460, 120, 110);
  c.fillStyle = o.after ? '#f4ead6' : '#8fb88a'; c.fillRect(mx + 130, fl - 450, 100, 90);
  if (o.after) { // the wedding photo: two figures under an arch
    c.strokeStyle = '#c9a44a'; c.lineWidth = 3; c.beginPath(); c.arc(mx + 180, fl - 380, 36, Math.PI, 0); c.stroke();
    person(c, mx + 166, fl - 366, 56, 'stand', { col: '#2a1d30' }); person(c, mx + 196, fl - 366, 50, 'stand', { col: '#2a1d30', flip: true });
    heart(c, mx + 181, fl - 430, 7, HEX.pink);
  } else { c.fillStyle = '#5a8a5a'; c.beginPath(); c.moveTo(mx + 130, fl - 380); c.lineTo(mx + 170, fl - 420); c.lineTo(mx + 230, fl - 380); c.fill(); }
  // the TV in the corner
  const tx = 1560, ty = fl - 420, tw = 300, th = 190;
  c.fillStyle = '#3a2a20'; c.fillRect(tx - 10, fl - 200, tw + 20, 200);
  c.fillStyle = '#141018'; c.beginPath(); c.roundRect(tx, ty, tw, th, 10); c.fill();
  c.fillStyle = '#0c1430'; c.fillRect(tx + 12, ty + 12, tw - 24, th - 24);
  if (o.tv) { c.save(); c.beginPath(); c.rect(tx + 12, ty + 12, tw - 24, th - 24); c.clip(); o.tv(c, tx + 12, ty + 12, tw - 24, th - 24); c.restore(); }
  g.fillStyle = 'rgba(80,140,255,0.06)'; g.fillRect(tx + 12, ty + 12, tw - 24, th - 24);
  // the floor: warm boards, gleaming
  gradientV(c, mixc('#a8693a', '#3a2418', night), mixc('#6a3a1c', '#1a0f0a', night), 0, fl, W, H - fl);
  c.strokeStyle = 'rgba(40,20,8,0.45)'; c.lineWidth = 2;
  for (let k = -18; k <= 18; k++) { c.beginPath(); c.moveTo(W / 2 + k * 70, fl); c.lineTo(W / 2 + k * 220, H); c.stroke(); }
  for (let i = 0; i < 7; i++) { const y = fl + (H - fl) * Math.pow((i + 1) / 8, 1.5); c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  c.save(); c.globalCompositeOperation = 'screen';
  const sh = c.createLinearGradient(0, fl, 0, H); sh.addColorStop(0, `rgba(255,240,210,${0.25 * (1 - night)})`); sh.addColorStop(1, 'rgba(255,240,210,0)');
  c.fillStyle = sh; c.beginPath(); c.moveTo(wx, fl); c.lineTo(wx + ww, fl); c.lineTo(wx + ww + 300, H); c.lineTo(wx - 100, H); c.closePath(); c.fill();
  c.restore();
  // the rug and the sofa
  c.fillStyle = mixc('#4a6ab8', '#1a2240', night); c.beginPath(); c.ellipse(W * 0.5, fl + 150, 560, 80, 0, 0, TAU); c.fill();
  c.strokeStyle = mixc('#ffd23f', '#5a4a20', night); c.lineWidth = 6; c.beginPath(); c.ellipse(W * 0.5, fl + 150, 520, 64, 0, 0, TAU); c.stroke();
  sofa(c, 1260, fl + 40, mixc('#3c8a6a', '#1a3a30', night));
  if (o.after) for (let i = 0; i < 40; i++) { c.fillStyle = ['#ff4f9a', '#ffd23f', '#2fe0ff', '#f4f1ea'][i % 4]!; c.save(); c.translate(h01(i, 61) * W, fl + 30 + h01(i, 62) * (H - fl - 60)); c.rotate(h01(i, 63) * 6); c.fillRect(-6, -3, 12, 6); c.restore(); }
  return { fl, clock: [mx, fl - 520, 80] as [number, number, number], tv: [tx, ty, tw, th] as [number, number, number, number] };
}

function sofa(c: C, x: number, y: number, col: string) {
  c.fillStyle = col;
  c.beginPath(); c.roundRect(x - 220, y - 170, 440, 120, 30); c.fill();
  c.beginPath(); c.roundRect(x - 240, y - 80, 480, 90, 24); c.fill();
  c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(x - 200, y - 60, 400, 6);
  c.fillStyle = '#2a1a10'; c.fillRect(x - 220, y + 10, 16, 30); c.fillRect(x + 204, y + 10, 16, 30);
}

/** The housekeeper's label, hanging over her: a role and a wage (or 0). */
export function roleLabel(c: C, x: number, y: number, role: string, pay: string, payCol: string, a = 1) {
  c.save(); c.globalAlpha *= a;
  c.font = font(FAM.monoB(), 28);
  const w = Math.max(c.measureText(role).width, c.measureText(pay).width) + 50;
  c.fillStyle = 'rgba(18,13,29,0.88)'; c.beginPath(); c.roundRect(x - w / 2, y - 44, w, 92, 14); c.fill();
  c.strokeStyle = rgbaHex(HEX.bone, 0.5); c.lineWidth = 2; c.stroke();
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = HEX.bone; c.fillText(role, x, y - 18);
  c.fillStyle = payCol; c.fillText(pay, x, y + 20);
  c.beginPath(); c.moveTo(x - 12, y + 48); c.lineTo(x + 12, y + 48); c.lineTo(x, y + 64); c.closePath(); c.fillStyle = 'rgba(18,13,29,0.88)'; c.fill();
  c.restore();
}

/** The mop in a person's hands (drawn after them): a shaft and a head on the floor, swishing. */
export function mop(c: C, x: number, feet: number, h: number, t: number, col: string) {
  const sw = Math.sin(t * 4) * h * 0.08;
  c.strokeStyle = col; c.lineWidth = h * 0.025; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x + h * 0.06, feet - h * 0.62); c.lineTo(x + h * 0.32 + sw, feet - h * 0.02); c.stroke();
  c.fillStyle = col; c.beginPath(); c.ellipse(x + h * 0.34 + sw, feet, h * 0.12, h * 0.03, 0, 0, TAU); c.fill();
}

// ------------------------------------------------------------------ the taxi at night

/** Inside a taxi at night in the rain: the windscreen with city lights and wipers, the dash, the fare meter. */
export function taxi(c: C, g: C, t: number, fare: string, o: { glitch?: number; meterX?: number; meterY?: number; meterW?: number; layer?: 'back' | 'front' | 'all' } = {}) {
  const layer = o.layer ?? 'all';
  if (layer !== 'front') {
  gradientV(c, '#0b0f2e', '#1a1440');
  // the city through the windscreen: bokeh lights, rain
  for (let i = 0; i < 40; i++) {
    const x = ((h01(i, 3) * (W + 400) - t * 140 * (0.5 + h01(i, 4))) % (W + 400) + W + 400) % (W + 400) - 200, y = H * (0.18 + 0.32 * h01(i, 5));
    const col = ['#ffd23f', '#ff4f9a', '#2fe0ff', '#ff8a2a', '#f4f1ea'][i % 5]!;
    c.save(); c.globalCompositeOperation = 'screen'; c.fillStyle = rgbaHex(col, 0.35); c.beginPath(); c.arc(x, y, 18 + 24 * h01(i, 6), 0, TAU); c.fill(); c.restore();
  }
  c.strokeStyle = 'rgba(200,220,255,0.3)'; c.lineWidth = 2;
  for (let i = 0; i < 60; i++) { const x = h01(i, 11) * W, y = ((h01(i, 12) * H * 0.6 + t * 200 * (0.5 + h01(i, 13))) % (H * 0.6)); c.beginPath(); c.moveTo(x, y); c.lineTo(x - 2, y + 12); c.stroke(); }
  // the wipers sweeping
  const wa = -1.2 + 1.1 * (0.5 + 0.5 * Math.sin(t * 3.4));
  c.strokeStyle = '#05030b'; c.lineWidth = 12; c.lineCap = 'round';
  for (const px of [W * 0.25, W * 0.62]) { c.beginPath(); c.moveTo(px, H * 0.62); c.lineTo(px + Math.cos(wa) * 520, H * 0.62 + Math.sin(wa) * 520); c.stroke(); }
  }
  if (layer === 'back') return;
  // the frame of the windscreen and the dash
  c.fillStyle = '#07050d'; c.beginPath(); c.moveTo(0, 0); c.lineTo(W, 0); c.lineTo(W, 60); c.quadraticCurveTo(W * 0.5, 20, 0, 60); c.closePath(); c.fill();
  gradientV(c, '#1a1424', '#0a070f', 0, H * 0.6, W, H * 0.4);
  c.fillStyle = '#2a2234'; c.beginPath(); c.moveTo(0, H * 0.6); c.quadraticCurveTo(W * 0.5, H * 0.56, W, H * 0.6); c.lineTo(W, H * 0.64); c.quadraticCurveTo(W * 0.5, H * 0.6, 0, H * 0.64); c.closePath(); c.fill();
  // the meter on the dash
  const mx = o.meterX ?? W * 0.72, my = o.meterY ?? H * 0.5, mw = o.meterW ?? 520, mh = mw * 0.5;
  c.fillStyle = '#120e1a'; c.beginPath(); c.roundRect(mx - mw / 2, my - mh / 2, mw, mh, mw * 0.05); c.fill();
  c.strokeStyle = HEX.peri; c.lineWidth = mw * 0.012; c.stroke();
  c.fillStyle = HEX.coral; c.fillRect(mx - mw * 0.1, my - mh / 2 - mw * 0.1, mw * 0.2, mw * 0.08);
  c.font = font(FAM.monoB(), mw * 0.035); c.fillStyle = '#120d1d'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('HIRED', mx, my - mh / 2 - mw * 0.06);
  c.fillStyle = '#05030b'; c.fillRect(mx - mw * 0.42, my - mh * 0.32, mw * 0.84, mh * 0.48);
  let txt = fare;
  const gl = o.glitch ?? 0;
  if (gl > 0 && frameIdx(t) % 4 < 2) txt = txt.split('').map((ch, i) => (h01(i, frameIdx(t)) < 0.45 * gl && /\d/.test(ch) ? String(Math.floor(h01(i, frameIdx(t), 2) * 10)) : ch)).join('');
  c.font = font(FAM.monoB(), mh * 0.36); c.textAlign = 'right'; c.fillStyle = HEX.lime;
  c.fillText(txt, mx + mw * 0.38, my - mh * 0.08);
  c.font = font(FAM.mono(), mh * 0.1); c.textAlign = 'left'; c.fillStyle = rgbaHex(HEX.bone, 0.6);
  c.fillText('FARE', mx - mw * 0.4, my + mh * 0.32); c.fillText('EXTRAS £0.00', mx, my + mh * 0.32);
  g.fillStyle = rgbaHex(HEX.lime, 0.2); g.fillRect(mx - mw * 0.42, my - mh * 0.32, mw * 0.84, mh * 0.48);
}

function mixc(a: string, b: string, u: number): string {
  const p = parseInt(a.slice(1), 16), q = parseInt(b.slice(1), 16), v = clamp(u);
  const ch = (s: number) => Math.round(((p >> s) & 255) + (((q >> s) & 255) - ((p >> s) & 255)) * v);
  return '#' + [ch(16), ch(8), ch(0)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

void lerp;
