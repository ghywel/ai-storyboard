// The `today` plate's places (his notes: "every scene is set in a real environment ... seemingly irrelevant background
// details are symbolic clues"). Each is drawn full-frame, back to front, with something alive in it; the caller
// frames it (camera transforms) and puts the people and Rai in. Canvas2D, 1920x1080 logical, pure functions of t.
//
// The family from the bedtime story runs through these rooms: the child's crayon stone is on the dad's fridge, the
// dad's lifeboat jacket hangs in the station, grandad (from the family photo) is in the care home.
import { W, H } from '../engine/gl';
import { HEX } from '../engine/palette';
import { font } from '../engine/type';
import { clamp, ease } from '../engine/util';
import { h01 } from './_rai';
import { FAM, TAU, mixHex, person, rgbaHex, stone, type C2 } from './_motifs';
import { seabed } from './_world';

/** A soft round glow (radial falloff) into the glow layer. */
export function glow(g: C2, x: number, y: number, r: number, col: string, a: number) {
  if (a <= 0) return;
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, rgbaHex(col, a)); gr.addColorStop(0.3, rgbaHex(col, a * 0.22)); gr.addColorStop(1, rgbaHex(col, 0));
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
}

/** Rain streaks over the frame. */
export function rainFx(c: C2, t: number, a = 0.45, n = 170, slant = 0.22, speed = 2100, len = 52) {
  c.strokeStyle = `rgba(190,225,255,${a})`; c.lineWidth = 2;
  c.beginPath();
  for (let i = 0; i < n; i++) {
    const x = h01(i, 911) * (W + 400) - 200, y0 = h01(i, 912) * (H + 200);
    const y = ((y0 + t * speed * (0.8 + 0.4 * h01(i, 913))) % (H + 200)) - 100;
    c.moveTo(x - slant * y, y); c.lineTo(x - slant * (y + len), y + len);
  }
  c.stroke();
}

/** A neon sign: rounded tube text with a glow; `flick` makes it stutter now and then. */
export function neon(c: C2, g: C2, text: string, x: number, y: number, size: number, col: string, t: number, flick = 0, fam = FAM.cond()) {
  const k = Math.floor(t * 12);
  const on = flick > 0 && h01(k, Math.round(x), 921) < 0.08 * flick ? 0.25 : 1;
  c.save();
  c.font = font(fam, size); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = rgbaHex(col, 0.35 + 0.65 * on); c.fillText(text, x, y);
  c.fillStyle = rgbaHex('#ffffff', 0.55 * on); c.fillText(text, x, y - size * 0.02);
  c.restore();
  g.save();
  g.font = font(fam, size); g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = rgbaHex(col, 0.45 * on); g.fillText(text, x, y);
  g.restore();
  glow(g, x, y, size * 2.2, col, 0.12 * on);
}

// ------------------------------------------------------------------ the rainy street

/**
 * A city street at night in the rain: low orange-lit cloud, far towers, a big screen with a lime line chart rising
 * (the chart to come), shopfronts with neon (a noodle bar, OPEN 24H, a pawnbroker's £), lamp posts, a traffic light,
 * the wet road mirroring it all, puddles rippling. `pan` slides the layers (parallax).
 */
export function street(c: C2, g: C2, t: number, o: { pan?: number; road?: number } = {}) {
  const pan = o.pan ?? 0, ry = o.road ?? H * 0.74;
  const sky = c.createLinearGradient(0, 0, 0, ry);
  sky.addColorStop(0, '#0d1030'); sky.addColorStop(0.7, '#3a2350'); sky.addColorStop(1, '#5a2f4a');
  c.fillStyle = sky; c.fillRect(-100, -100, W + 200, ry + 100);
  // far towers with lit windows, and the big screen with the chart
  for (let i = 0; i < 14; i++) {
    const x = ((i * 170 - pan * 0.25) % (W + 340) + W + 340) % (W + 340) - 170, w = 120 + 60 * h01(i, 931), h = 260 + 260 * h01(i, 932);
    c.fillStyle = '#1a1438'; c.fillRect(x, ry - h - 120, w, h + 120);
    c.fillStyle = 'rgba(255,214,140,0.35)';
    for (let wy = ry - h - 100; wy < ry - 140; wy += 22) for (let wx = x + 10; wx < x + w - 14; wx += 18) if (h01(i, Math.round(wx), Math.round(wy)) < 0.22) c.fillRect(wx, wy, 7, 9);
  }
  const sx = 1260 - pan * 0.25, sy = ry - 560;
  c.fillStyle = '#0c0a1c'; c.fillRect(sx - 12, sy - 12, 344, 204);
  c.fillStyle = '#071a10'; c.fillRect(sx, sy, 320, 180);
  c.strokeStyle = HEX.lime; c.lineWidth = 5; c.lineJoin = 'round'; c.beginPath();
  for (let k = 0; k <= 20; k++) { const u = k / 20, yy = sy + 160 - 130 * (0.1 + 0.8 * u * u) + 8 * Math.sin(k * 1.9 + t * 2); k ? c.lineTo(sx + 14 + u * 292, yy) : c.moveTo(sx + 14, yy); }
  c.stroke();
  c.font = font(FAM.monoB(), 18); c.fillStyle = HEX.lime; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText('GDP ▲ 0.3%', sx + 14, sy + 26);
  glow(g, sx + 160, sy + 90, 220, HEX.lime, 0.06);
  // the near shopfronts
  const fronts: [string, string, string][] = [['NOODLES', HEX.pink, '#3a1430'], ['OPEN 24H', HEX.cyan, '#10283a'], ['£ CASH', HEX.yellow, '#33280e'], ['LAUNDRY', HEX.violet, '#26143a']];
  for (let i = 0; i < 6; i++) {
    const x = ((i * 380 - pan * 0.7) % (W + 760) + W + 760) % (W + 760) - 380, f = fronts[i % fronts.length]!;
    c.fillStyle = '#140f2a'; c.fillRect(x, ry - 420, 370, 420);
    c.fillStyle = f[2]; c.fillRect(x + 30, ry - 230, 310, 200);
    c.fillStyle = 'rgba(255,214,150,0.35)'; c.fillRect(x + 40, ry - 220, 290, 180);
    c.fillStyle = '#140f2a'; c.fillRect(x + 180, ry - 230, 8, 200);
    neon(c, g, f[0], x + 185, ry - 300, 64, f[1], t + i, i === 1 ? 1 : 0.3);
    c.fillStyle = '#0d0a1e'; c.fillRect(x, ry - 30, 370, 30);
  }
  // lamp posts and a traffic light
  for (let i = 0; i < 4; i++) {
    const x = ((i * 520 + 140 - pan) % (W + 1040) + W + 1040) % (W + 1040) - 520;
    c.fillStyle = '#0b0818'; c.fillRect(x - 5, ry - 470, 10, 470); c.fillRect(x - 5, ry - 470, 70, 8);
    c.fillStyle = '#ffe2a8'; c.beginPath(); c.ellipse(x + 62, ry - 458, 18, 7, 0, 0, TAU); c.fill();
    glow(g, x + 62, ry - 450, 150, '#ffd08a', 0.14);
    const lg = c.createLinearGradient(0, ry - 450, 0, ry);
    lg.addColorStop(0, 'rgba(255,214,150,0.16)'); lg.addColorStop(1, 'rgba(255,214,150,0)');
    c.fillStyle = lg; c.beginPath(); c.moveTo(x + 50, ry - 450); c.lineTo(x + 74, ry - 450); c.lineTo(x + 170, ry); c.lineTo(x - 46, ry); c.closePath(); c.fill();
  }
  const tx = ((1650 - pan) % (W + 400) + W + 400) % (W + 400) - 200;
  c.fillStyle = '#0b0818'; c.fillRect(tx - 6, ry - 360, 12, 360); c.fillRect(tx - 22, ry - 400, 44, 110);
  const red = Math.floor(t / 2) % 2 === 0;
  c.fillStyle = red ? '#ff4040' : '#3a1010'; c.beginPath(); c.arc(tx, ry - 380, 12, 0, TAU); c.fill();
  c.fillStyle = red ? '#103a18' : '#40ff70'; c.beginPath(); c.arc(tx, ry - 312, 12, 0, TAU); c.fill();
  glow(g, tx, red ? ry - 380 : ry - 312, 90, red ? '#ff4040' : '#40ff70', 0.35);
  // the wet road: dark, with the neon smeared into it, dashes, puddles rippling
  const rg = c.createLinearGradient(0, ry, 0, H);
  rg.addColorStop(0, '#1a1430'); rg.addColorStop(1, '#0a0716');
  c.fillStyle = rg; c.fillRect(-100, ry, W + 200, H - ry + 100);
  c.save(); c.globalCompositeOperation = 'screen';
  for (let i = 0; i < 6; i++) {
    const x = ((i * 380 - pan * 0.7) % (W + 760) + W + 760) % (W + 760) - 380 + 185, col = fronts[i % fronts.length]![1];
    const sg = c.createLinearGradient(0, ry, 0, H);
    sg.addColorStop(0, rgbaHex(col, 0.32)); sg.addColorStop(1, rgbaHex(col, 0));
    c.fillStyle = sg;
    for (let k = 0; k < 7; k++) { const wob = 6 * Math.sin(t * 3 + k + i); c.fillRect(x - 90 + k * 26 + wob, ry + 6, 12, (H - ry) * (0.5 + 0.5 * h01(i, k, 941))); }
  }
  c.restore();
  c.fillStyle = 'rgba(255,230,150,0.55)';
  for (let k = 0; k < 9; k++) { const x = ((k * 260 - pan * 1.3) % (W + 260) + W + 260) % (W + 260) - 130; c.fillRect(x, ry + 110, 120, 10); }
  for (let i = 0; i < 6; i++) {
    const px = ((h01(i, 951) * (W + 400) - pan * 1.3) % (W + 400) + W + 400) % (W + 400) - 200, py = ry + 60 + h01(i, 952) * (H - ry - 80);
    c.fillStyle = 'rgba(120,140,220,0.18)'; c.beginPath(); c.ellipse(px, py, 120, 18, 0, 0, TAU); c.fill();
    for (let k = 0; k < 2; k++) {
      const r = ((t * 90 + k * 50 + i * 30) % 100);
      c.strokeStyle = `rgba(200,220,255,${0.35 * (1 - r / 100)})`; c.lineWidth = 2;
      c.beginPath(); c.ellipse(px + 20 * (k - 0.5), py, r, r * 0.16, 0, 0, TAU); c.stroke();
    }
  }
}

// ------------------------------------------------------------------ the doorstep

/** A front door at night (number 4, a porch light, a wreath of rain), the customer's hand taking the bag, the card
 *  machine's screen reading APPROVED £14.50. */
export function doorstep(c: C2, g: C2, t: number, paid: number) {
  c.fillStyle = '#2a1a3e'; c.fillRect(-50, -50, W + 100, H + 100);
  // brick
  c.fillStyle = '#3a2238';
  for (let r = 0; r < 30; r++) for (let k = 0; k < 20; k++) c.fillRect(-60 + k * 110 + (r % 2) * 55, r * 40, 104, 34);
  // the door, a warm fanlight, the number, the porch light
  const dx = 640, dy = 120, dw = 520, dh = 900;
  c.fillStyle = '#1c3a5a'; c.fillRect(dx, dy, dw, dh);
  c.fillStyle = '#ffcf8a'; c.fillRect(dx + 30, dy + 30, dw - 60, 120);
  c.strokeStyle = '#1c3a5a'; c.lineWidth = 10; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(dx + 30 + k * (dw - 60) / 4, dy + 30); c.lineTo(dx + 30 + k * (dw - 60) / 4, dy + 150); c.stroke(); }
  c.strokeStyle = '#13283f'; c.lineWidth = 8; c.strokeRect(dx + 60, dy + 200, dw - 120, 300); c.strokeRect(dx + 60, dy + 540, dw - 120, 300);
  c.font = font(FAM.serifB(), 90); c.fillStyle = HEX.gold; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('4', dx + dw / 2, dy + 350);
  // the door open a crack: a wedge of warm hall light, and the hand coming out of it
  c.fillStyle = '#d89a5a'; c.beginPath(); c.moveTo(dx + dw - 60, dy); c.lineTo(dx + dw, dy); c.lineTo(dx + dw, dy + dh); c.lineTo(dx + dw - 60, dy + dh); c.closePath(); c.fill();
  glow(g, dx + dw - 30, dy + 400, 300, '#ffcf8a', 0.06);
  c.fillStyle = '#ffe2a8'; c.beginPath(); c.arc(dx + dw + 120, dy + 80, 26, 0, TAU); c.fill();
  glow(g, dx + dw + 120, dy + 80, 160, '#ffd08a', 0.18);
  // the bag changing hands
  const hx = dx + dw - 60 + 40 * ease.outCubic(paid);
  c.strokeStyle = '#0d0918'; c.lineWidth = 34; c.lineCap = 'round';
  c.beginPath(); c.moveTo(dx + dw - 40, 560); c.lineTo(hx + 120, 600); c.stroke();
  c.beginPath(); c.moveTo(W + 40, 700); c.lineTo(hx + 300, 640); c.stroke();
  c.fillStyle = 'rgba(244,241,234,0.8)'; c.beginPath(); c.roundRect(hx + 140, 600, 150, 170, 14); c.fill();
  c.strokeStyle = 'rgba(244,241,234,0.9)'; c.lineWidth = 6; c.beginPath(); c.moveTo(hx + 170, 600); c.lineTo(hx + 190, 570); c.moveTo(hx + 260, 600); c.lineTo(hx + 240, 570); c.stroke();
  c.fillStyle = HEX.coral; c.fillRect(hx + 175, 680, 80, 14);
  // the card machine, held out by the rider (left)
  const mx = 330, my = 560;
  c.save(); c.translate(mx, my); c.scale(1.5, 1.5); c.translate(-mx, -my);
  c.strokeStyle = '#0d0918'; c.lineWidth = 34; c.beginPath(); c.moveTo(-40, 780); c.lineTo(mx - 20, my + 80); c.stroke();
  c.fillStyle = '#20202a'; c.beginPath(); c.roundRect(mx - 90, my - 140, 180, 280, 22); c.fill();
  const ok = paid > 0.05;
  c.fillStyle = ok ? '#123a14' : '#122030'; c.fillRect(mx - 70, my - 120, 140, 110);
  c.font = font(FAM.monoB(), 22); c.fillStyle = ok ? HEX.lime : HEX.cyan; c.textAlign = 'center';
  c.fillText(ok ? 'APPROVED' : 'TAP CARD', mx, my - 84); c.font = font(FAM.monoB(), 30); c.fillText('£14.50', mx, my - 44);
  glow(g, mx, my - 64, 160, ok ? HEX.lime : HEX.cyan, 0.25);
  c.fillStyle = '#3a3a48'; for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) c.fillRect(mx - 60 + k * 44, my + 10 + r * 36, 36, 28);
  c.restore();
  rainFx(c, t, 0.35, 120);
}

// ------------------------------------------------------------------ the statistics office

/**
 * The national statistics office at night: a wall screen with the national accounts, desks, a desk lamp, a plant, a
 * window onto the city, and an analyst at the desk. 'up': the lime line climbs and the analyst cheers; 'flat': HOME
 * COOKING lies flat at £0 and the analyst has dozed off.
 */
export function office(c: C2, g: C2, t: number, mode: 'up' | 'flat', draw: number) {
  const bg = c.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#16213e'); bg.addColorStop(1, '#0c1024');
  c.fillStyle = bg; c.fillRect(-50, -50, W + 100, H + 100);
  // the window onto the city (left)
  c.fillStyle = '#0a0d22'; c.fillRect(60, 120, 360, 520);
  for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(255,214,140,${0.2 + 0.5 * h01(i, 961)})`; c.fillRect(70 + h01(i, 962) * 340, 300 + h01(i, 963) * 330, 5, 7); }
  c.strokeStyle = '#2a3460'; c.lineWidth = 12; c.strokeRect(60, 120, 360, 520); c.beginPath(); c.moveTo(240, 120); c.lineTo(240, 640); c.stroke();
  // the wall screen
  const x0 = 560, x1 = 1780, y0 = 110, y1 = 600;
  c.fillStyle = '#080b18'; c.fillRect(x0 - 20, y0 - 20, x1 - x0 + 40, y1 - y0 + 40);
  c.fillStyle = '#0d1430'; c.fillRect(x0, y0, x1 - x0, y1 - y0);
  c.strokeStyle = 'rgba(111,140,255,0.18)'; c.lineWidth = 2;
  for (let k = 0; k <= 10; k++) { const x = x0 + 40 + (x1 - x0 - 80) * k / 10; c.beginPath(); c.moveTo(x, y0 + 70); c.lineTo(x, y1 - 30); c.stroke(); }
  for (let k = 0; k <= 5; k++) { const y = y0 + 70 + (y1 - y0 - 100) * k / 5; c.beginPath(); c.moveTo(x0 + 40, y); c.lineTo(x1 - 40, y); c.stroke(); }
  c.font = font(FAM.monoB(), 26); c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = 'rgba(154,163,199,0.95)';
  c.fillText(mode === 'up' ? 'NATIONAL INCOME  (£ bn)' : 'HOME COOKING  (£ bn)', x0 + 40, y0 + 48);
  const col = mode === 'up' ? HEX.lime : HEX.pink;
  c.strokeStyle = col; c.lineWidth = 9; c.lineJoin = 'round'; c.beginPath();
  const n = 60, upto = Math.floor(n * clamp(draw));
  let hx = x0 + 40, hy = y1 - 30;
  for (let i = 0; i <= upto; i++) {
    const v = i / n, x = x0 + 40 + (x1 - x0 - 80) * v;
    const y = mode === 'up' ? y1 - 30 - (y1 - y0 - 100) * (0.12 + 0.7 * v * v + 0.04 * Math.sin(i * 1.7)) : y1 - 32;
    i ? c.lineTo(x, y) : c.moveTo(x, y);
    hx = x; hy = y;
  }
  c.stroke();
  glow(g, hx, hy, 60, col, 0.8);
  if (mode === 'flat') { c.font = font(FAM.monoB(), 34); c.fillStyle = HEX.pink; c.textAlign = 'right'; c.fillText('£0', x1 - 50, y1 - 50); }
  glow(g, (x0 + x1) / 2, (y0 + y1) / 2, 650, mode === 'up' ? HEX.lime : HEX.pink, 0.035);
  // the desk: a lamp, a mug, papers, a plant, a monitor; the analyst
  c.fillStyle = '#1e2448'; c.fillRect(-50, 800, W + 100, 300);
  c.fillStyle = '#2a3260'; c.fillRect(380, 760, 1100, 40);
  c.fillStyle = '#141838'; c.fillRect(420, 800, 30, 260); c.fillRect(1410, 800, 30, 260);
  c.fillStyle = '#0c0f24'; c.fillRect(1100, 610, 260, 150); c.fillStyle = '#1a2a50'; c.fillRect(1112, 622, 236, 126);
  c.fillStyle = '#0c0f24'; c.fillRect(1220, 760 - 2, 40, 6);
  c.strokeStyle = '#3a4270'; c.lineWidth = 8; c.beginPath(); c.moveTo(520, 760); c.lineTo(560, 650); c.lineTo(640, 640); c.stroke();
  c.fillStyle = '#3a4270'; c.beginPath(); c.moveTo(620, 630); c.lineTo(680, 640); c.lineTo(660, 680); c.closePath(); c.fill();
  glow(g, 660, 680, 180, '#ffd08a', 0.12);
  c.fillStyle = '#e8e4f0'; c.fillRect(760, 744, 150, 16); c.fillRect(780, 734, 140, 12);
  c.fillStyle = '#c65cf0'; c.fillRect(960, 712, 40, 48);
  c.fillStyle = '#6b3a2a'; c.fillRect(1380, 722, 40, 38);
  c.fillStyle = '#3f8f5a'; for (let k = 0; k < 6; k++) { c.beginPath(); c.ellipse(1400 + (k - 2.5) * 9, 700 - 10 * Math.abs(k - 2.5), 6, 22, (k - 2.5) * 0.35, 0, TAU); c.fill(); }
  if (mode === 'up') person(c, 1000, 1020, 330, 'cheer', { col: '#06070f', t, rim: rgbaHex(HEX.lime, 0.8), emote: 'joy' });
  else person(c, 1000, 1020, 330, 'slump', { col: '#06070f', t, rim: rgbaHex(HEX.pink, 0.6), emote: 'zzz' });
}

// ------------------------------------------------------------------ the dad's kitchen

/**
 * The dad's kitchen at night: tiles, a rainy window, the hob (blue flames, a pan steaming, the extractor hood),
 * cupboards, the fridge (the child's crayon stone from the bedroom, a bill pinned under a magnet), the clock at 20:40,
 * the hall door with the kids' shoes in a row, a hi-vis vest and work lanyard over a chair, a lunchbox, the table.
 */
export function kitchen(c: C2, g: C2, t: number) {
  c.fillStyle = '#3a2a2e'; c.fillRect(-50, -50, W + 100, H + 100);
  // tiles behind the counter
  c.fillStyle = '#4a3238'; c.fillRect(700, 330, 1220, 320);
  c.strokeStyle = 'rgba(255,220,200,0.08)'; c.lineWidth = 2;
  for (let y = 330; y < 650; y += 40) { c.beginPath(); c.moveTo(700, y); c.lineTo(1920, y); c.stroke(); }
  for (let x = 700; x < 1920; x += 40) { c.beginPath(); c.moveTo(x, 330); c.lineTo(x, 650); c.stroke(); }
  // the window over the sink: rain on the glass, the dark garden
  c.fillStyle = '#0d1430'; c.fillRect(1420, 110, 380, 300);
  c.save(); c.beginPath(); c.rect(1420, 110, 380, 300); c.clip();
  for (let i = 0; i < 30; i++) { const x = 1420 + h01(i, 971) * 380, y = 110 + ((h01(i, 972) * 300 + t * 120 * (0.5 + h01(i, 973))) % 300); c.fillStyle = 'rgba(180,210,255,0.4)'; c.beginPath(); c.ellipse(x, y, 2.5, 5, 0, 0, TAU); c.fill(); }
  c.restore();
  c.strokeStyle = '#5a3a3a'; c.lineWidth = 14; c.strokeRect(1420, 110, 380, 300); c.beginPath(); c.moveTo(1610, 110); c.lineTo(1610, 410); c.stroke();
  // upper cupboards and the hood
  c.fillStyle = '#5a3f3a'; c.fillRect(700, 90, 680, 200);
  c.strokeStyle = '#3a2826'; c.lineWidth = 6; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(700 + k * 170, 90); c.lineTo(700 + k * 170, 290); c.stroke(); }
  c.fillStyle = '#6a6a78'; c.beginPath(); c.moveTo(980, 290); c.lineTo(1200, 290); c.lineTo(1250, 380); c.lineTo(930, 380); c.closePath(); c.fill();
  glow(g, 1090, 400, 220, '#ffd08a', 0.1);
  // the counter, the hob with its blue flames, the pan steaming
  c.fillStyle = '#2a1e22'; c.fillRect(700, 680, 1220, 400);
  c.fillStyle = '#6a5048'; c.fillRect(690, 650, 1240, 34);
  for (const fx of [1010, 1170]) {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU, fl = 10 + 5 * Math.sin(t * 20 + i * 2.3);
      g.fillStyle = 'rgba(80,150,255,0.85)'; g.beginPath(); g.ellipse(fx + Math.cos(a) * 30, 646 - fl * 0.4, 3.5, fl * 0.5, 0, 0, TAU); g.fill();
    }
  }
  c.fillStyle = '#3a3550'; c.beginPath(); c.roundRect(940, 590, 140, 52, 10); c.fill();
  c.strokeStyle = '#3a3550'; c.lineWidth = 12; c.lineCap = 'round'; c.beginPath(); c.moveTo(1076, 606); c.lineTo(1170, 590); c.stroke();
  c.strokeStyle = 'rgba(244,241,234,0.45)'; c.lineWidth = 6;
  for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(1010 + k * 30, 580); c.bezierCurveTo(1010 + k * 30 + 20 * Math.sin(t * 3 + k), 520, 990 + k * 30, 480, 1010 + k * 30 + 12 * Math.sin(t * 2 + k), 420); c.stroke(); }
  // the lunchbox, a tin of something, the kettle
  c.fillStyle = '#3aa0e0'; c.fillRect(1300, 600, 100, 50); c.fillStyle = '#2a7ab0'; c.fillRect(1300, 600, 100, 12);
  c.fillStyle = '#c8c0d0'; c.beginPath(); c.roundRect(1470, 560, 90, 90, 18); c.fill();
  // the fridge (left of the counter): the child's drawing of a stone with a face, a bill under a magnet
  c.fillStyle = '#d8dce8'; c.beginPath(); c.roundRect(430, 160, 250, 880, 18); c.fill();
  c.fillStyle = '#b0b6c8'; c.fillRect(430, 480, 250, 6); c.fillRect(640, 260, 10, 160); c.fillRect(640, 540, 10, 200);
  c.save(); c.translate(470, 200); c.rotate(-0.04);
  c.fillStyle = '#f6f0e2'; c.fillRect(0, 0, 150, 116);
  c.strokeStyle = '#3a8ee8'; c.lineWidth = 3; for (let k = 0; k < 3; k++) { c.beginPath(); for (let x = 6; x < 146; x += 8) c.lineTo(x, 48 + k * 18 + 3 * Math.sin(x * 0.3 + k)); c.stroke(); }
  c.fillStyle = '#d6c8a8'; c.beginPath(); c.arc(60, 94, 15, 0, TAU); c.fill();
  c.fillStyle = '#f6f0e2'; c.beginPath(); c.arc(60, 98, 4.5, 0, TAU); c.fill();
  c.fillStyle = '#2a1d14'; c.beginPath(); c.arc(55, 89, 1.5, 0, TAU); c.arc(65, 89, 1.5, 0, TAU); c.fill();
  c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(20, 20, 10, 0, TAU); c.fill();
  c.fillStyle = HEX.coral; c.beginPath(); c.arc(75, -2, 8, 0, TAU); c.fill();
  c.restore();
  c.save(); c.translate(500, 560); c.rotate(0.05);
  c.fillStyle = '#fff6e8'; c.fillRect(0, 0, 120, 150);
  c.font = font(FAM.monoB(), 16); c.fillStyle = '#c0303a'; c.textAlign = 'left'; c.fillText('FINAL', 10, 26); c.fillText('NOTICE', 10, 46);
  c.fillStyle = 'rgba(40,30,50,0.4)'; for (let k = 0; k < 5; k++) c.fillRect(10, 62 + k * 16, 70 + 20 * h01(k, 974), 6);
  c.font = font(FAM.monoB(), 18); c.fillStyle = '#2a1d14'; c.fillText('£186.40', 10, 142);
  c.fillStyle = HEX.lime; c.beginPath(); c.arc(60, -4, 9, 0, TAU); c.fill();
  c.restore();
  // the hall door (far left) with the kids' shoes, the vest on the chair
  c.fillStyle = '#2a1c22'; c.fillRect(-50, 900, 760, 200);
  c.fillStyle = '#1a1220'; c.fillRect(40, 140, 300, 760);
  c.fillStyle = '#5a3a2a'; c.fillRect(40, 140, 300, 14); c.fillRect(40, 140, 14, 760); c.fillRect(326, 140, 14, 760);
  const shoes: [number, string][] = [[80, '#ff4f9a'], [150, '#2fe0ff'], [220, '#ffd23f'], [270, '#3a3a48']];
  shoes.forEach(([x, col], i) => { const sz = i < 3 ? 22 : 34; c.fillStyle = col; c.beginPath(); c.ellipse(x, 900, sz, sz * 0.42, 0, Math.PI, TAU); c.fill(); c.beginPath(); c.ellipse(x + sz * 1.1, 902, sz, sz * 0.42, 0, Math.PI, TAU); c.fill(); });
  // the table and chair (front right)
  c.fillStyle = '#5a3a2e'; c.fillRect(1500, 860, 460, 26);
  c.fillStyle = '#3a2620'; c.fillRect(1520, 886, 20, 200); c.fillRect(1920, 886, 20, 200);
  c.fillStyle = '#3a2620'; c.fillRect(1380, 760, 18, 330); c.fillRect(1380, 900, 120, 18); c.fillRect(1480, 900, 18, 190);
  c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(1360, 770); c.lineTo(1420, 770); c.lineTo(1430, 900); c.lineTo(1350, 900); c.closePath(); c.fill();
  c.fillStyle = '#c0c0c8'; c.fillRect(1360, 820, 70, 8); c.fillRect(1360, 852, 70, 8);
  c.fillStyle = '#2a6ab0'; c.fillRect(1395, 760, 6, 70);
  c.fillStyle = '#efe8dc'; c.fillRect(1380, 740, 40, 26);
}

/** The kitchen's wall clock, at h hours (pass a time to show), centre and radius. */
export function wallClock(c: C2, x: number, y: number, r: number, hours: number, face = '#efe8dc', ink = '#2a1d14') {
  c.fillStyle = face; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.strokeStyle = ink; c.lineWidth = r * 0.07; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
  c.lineCap = 'round';
  for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; c.lineWidth = r * (k % 3 ? 0.03 : 0.06); c.beginPath(); c.moveTo(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8); c.lineTo(x + Math.cos(a) * r * 0.92, y + Math.sin(a) * r * 0.92); c.stroke(); }
  const ha = (hours / 12) * TAU - Math.PI / 2, ma = hours * TAU - Math.PI / 2;
  c.lineWidth = r * 0.09; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(ha) * r * 0.5, y + Math.sin(ha) * r * 0.5); c.stroke();
  c.lineWidth = r * 0.055; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(ma) * r * 0.78, y + Math.sin(ma) * r * 0.78); c.stroke();
  c.fillStyle = HEX.coral; c.beginPath(); c.arc(x, y, r * 0.08, 0, TAU); c.fill();
}

// ------------------------------------------------------------------ the drive to the care home

/** The coast road at night in the rain: the sea beside it with the lighthouse from the bedroom window, a road sign
 *  (CARE HOME 1), cat's eyes rushing past. `run` scrolls the road. */
export function coastRoad(c: C2, g: C2, t: number, run: number) {
  const hz = H * 0.46;
  const sky = c.createLinearGradient(0, 0, 0, hz);
  sky.addColorStop(0, '#0e1236'); sky.addColorStop(1, '#2c2a6a');
  c.fillStyle = sky; c.fillRect(-50, -50, W + 100, hz + 50);
  for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(255,248,230,${0.2 + 0.5 * h01(i, 981)})`; c.beginPath(); c.arc(h01(i, 982) * W, h01(i, 983) * hz * 0.8, 1 + h01(i, 984), 0, TAU); c.fill(); }
  const sea = c.createLinearGradient(0, hz, 0, H * 0.62);
  sea.addColorStop(0, '#24306e'); sea.addColorStop(1, '#141a46');
  c.fillStyle = sea; c.fillRect(-50, hz, W + 100, H * 0.62 - hz);
  c.strokeStyle = 'rgba(160,190,255,0.25)'; c.lineWidth = 2;
  for (let k = 0; k < 8; k++) { const y = hz + 8 + k * 18; c.beginPath(); for (let x = -20; x < W + 20; x += 30) c.lineTo(x, y + 3 * Math.sin(x * 0.02 + t * 1.5 + k)); c.stroke(); }
  // the headland and its lighthouse (the one from the bedroom window), the beam turning
  c.fillStyle = '#0c0f2c'; c.beginPath(); c.moveTo(1300, hz + 6); c.quadraticCurveTo(1520, hz - 60, 1760, hz - 40); c.lineTo(1960, hz + 6); c.closePath(); c.fill();
  const lx = 1640, ly = hz - 48;
  c.fillStyle = '#e8e0f8'; c.beginPath(); c.moveTo(lx - 14, ly); c.lineTo(lx - 8, ly - 80); c.lineTo(lx + 8, ly - 80); c.lineTo(lx + 14, ly); c.closePath(); c.fill();
  c.fillStyle = '#ff5a5f'; c.fillRect(lx - 10, ly - 56, 20, 16);
  const bv = Math.cos(t * 1.6);
  const bg = c.createLinearGradient(lx, ly - 86, lx + 800 * bv, ly - 120);
  bg.addColorStop(0, `rgba(255,246,200,${0.4 * Math.abs(bv)})`); bg.addColorStop(1, 'rgba(255,246,200,0)');
  c.fillStyle = bg; c.beginPath(); c.moveTo(lx, ly - 86); c.lineTo(lx + 900 * bv, ly - 150); c.lineTo(lx + 900 * bv, ly - 40); c.closePath(); c.fill();
  glow(g, lx, ly - 86, 80, '#fff6c8', 0.6);
  // the verge, the road, the barrier posts
  c.fillStyle = '#16112e'; c.fillRect(-50, H * 0.62, W + 100, 40);
  const rg = c.createLinearGradient(0, H * 0.62 + 40, 0, H);
  rg.addColorStop(0, '#1e1838'); rg.addColorStop(1, '#0c0a1c');
  c.fillStyle = rg; c.fillRect(-50, H * 0.62 + 40, W + 100, H);
  for (let k = 0; k < 12; k++) {
    const x = ((k * 220 - run * 2200) % (W + 300) + W + 300) % (W + 300) - 150;
    c.fillStyle = '#d8d0e8'; c.fillRect(x, H * 0.62 - 30, 10, 56); c.fillStyle = HEX.coral; c.fillRect(x, H * 0.62 - 26, 10, 8);
    c.fillStyle = HEX.yellow; c.fillRect(x - 40, H * 0.84, 110, 9);
  }
  // the road sign
  const sx = ((1500 - run * 900) % (W + 600) + W + 600) % (W + 600) - 300;
  c.fillStyle = '#2a2a3a'; c.fillRect(sx - 5, H * 0.38, 10, H * 0.26);
  c.fillStyle = '#1e5a3a'; c.beginPath(); c.roundRect(sx - 130, H * 0.3, 260, 90, 10); c.fill();
  c.strokeStyle = '#e8e8e8'; c.lineWidth = 4; c.beginPath(); c.roundRect(sx - 122, H * 0.3 + 8, 244, 74, 8); c.stroke();
  c.font = font(FAM.bold(), 30); c.fillStyle = '#f4f1ea'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('CARE HOME  1', sx, H * 0.3 + 45);
}

/** Inside the car: the windscreen with rain and a wiper sweeping, streetlights streaking by, the dashboard's glow, a
 *  photo clipped to the visor (him with a guitar, her small), flowers on the passenger seat. */
export function carInterior(c: C2, g: C2, t: number, lt: number) {
  c.fillStyle = '#070816'; c.fillRect(-50, -50, W + 100, H + 100);
  const wx = 0, wy = 70, ww = W, wh = 560;
  c.save(); c.beginPath(); c.moveTo(wx + 80, wy); c.lineTo(wx + ww - 80, wy); c.lineTo(wx + ww, wy + wh); c.lineTo(wx, wy + wh); c.closePath(); c.clip();
  const sk = c.createLinearGradient(0, wy, 0, wy + wh);
  sk.addColorStop(0, '#1b2266'); sk.addColorStop(1, '#5a4aa8');
  c.fillStyle = sk; c.fillRect(wx, wy, ww, wh);
  for (let i = 0; i < 14; i++) {
    const x = ((h01(i, 991) * W * 1.6 - lt * 2600) % (W * 1.6) + W * 1.6) % (W * 1.6) - W * 0.3, y = wy + 90 + 120 * h01(i, 992);
    glow(g, x, y, 60, HEX.orange, 0.3); c.fillStyle = '#ffd98a'; c.beginPath(); c.arc(x, y, 8, 0, TAU); c.fill();
  }
  // the road ahead converging, its centre dashes rushing
  c.fillStyle = '#141030'; c.beginPath(); c.moveTo(W * 0.46, wy + 330); c.lineTo(W * 0.54, wy + 330); c.lineTo(W * 0.9, wy + wh); c.lineTo(W * 0.1, wy + wh); c.closePath(); c.fill();
  for (let k = 0; k < 6; k++) { const u = ((k / 6 + lt * 1.8) % 1), y = wy + 330 + u * u * (wh - 330), hw = 2 + 8 * u; c.fillStyle = HEX.yellow; c.fillRect(W / 2 - hw, y, hw * 2, 10 + 30 * u); }
  // rain on the glass and the wiper
  for (let i = 0; i < 70; i++) { const x = h01(i, 993) * W, y = wy + ((h01(i, 994) * wh + t * 40) % wh); c.fillStyle = 'rgba(200,220,255,0.35)'; c.beginPath(); c.ellipse(x, y, 3, 5, 0, 0, TAU); c.fill(); }
  const wa = -0.3 - 1.9 * (0.5 + 0.5 * Math.sin(t * 3.2));
  c.strokeStyle = '#06060e'; c.lineWidth = 12; c.lineCap = 'round';
  c.beginPath(); c.moveTo(W * 0.62, wy + wh); c.lineTo(W * 0.62 + Math.cos(wa) * 700, wy + wh + Math.sin(wa) * 700); c.stroke();
  c.restore();
  // the frame, the visor with the photo, the dashboard
  c.fillStyle = '#0b0a18'; c.fillRect(-50, -50, W + 100, wy + 50);
  c.beginPath(); c.moveTo(-50, wy); c.lineTo(80, wy); c.lineTo(0, wy + wh); c.lineTo(-50, wy + wh); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(W + 50, wy); c.lineTo(W - 80, wy); c.lineTo(W, wy + wh); c.lineTo(W + 50, wy + wh); c.closePath(); c.fill();
  c.fillStyle = '#1a1730'; c.fillRect(1280, 40, 400, 90);
  c.save(); c.translate(1520, 70); c.rotate(0.06);
  c.fillStyle = '#efe4c8'; c.fillRect(0, 0, 110, 84);
  c.fillStyle = '#c9a060'; c.fillRect(6, 6, 98, 72);
  person(c, 40, 76, 60, 'seated', { col: '#4a2a12' }); c.fillStyle = '#4a2a12'; c.beginPath(); c.arc(56, 52, 9, 0, TAU); c.fill(); c.fillRect(58, 48, 30, 4);
  person(c, 86, 76, 30, 'stand', { col: '#4a2a12' });
  c.restore();
  c.fillStyle = '#100e20'; c.fillRect(-50, wy + wh, W + 100, H);
  c.fillStyle = '#1a1830'; c.beginPath(); c.moveTo(0, wy + wh + 20); c.quadraticCurveTo(W / 2, wy + wh - 30, W, wy + wh + 20); c.lineTo(W, wy + wh + 80); c.lineTo(0, wy + wh + 80); c.closePath(); c.fill();
  c.fillStyle = '#123040'; c.fillRect(860, wy + wh + 30, 200, 40);
  c.font = font(FAM.monoB(), 26); c.fillStyle = HEX.cyan; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('19:52', 960, wy + wh + 50);
  glow(g, 960, wy + wh + 50, 120, HEX.cyan, 0.12);
  // flowers on the passenger seat (right)
  c.fillStyle = '#2f6a3a'; for (let k = 0; k < 7; k++) { c.save(); c.translate(1560, 900); c.rotate(-0.8 + k * 0.22); c.fillRect(-3, -150, 6, 150); c.restore(); }
  ['#ff4f9a', '#ffd23f', '#ff8a2a', '#f4f1ea', '#c65cf0'].forEach((col, k) => { const a = -0.8 + k * 0.33; c.fillStyle = col; c.beginPath(); c.arc(1560 + Math.sin(a) * 150, 900 - Math.cos(a) * 150, 20, 0, TAU); c.fill(); });
  c.fillStyle = '#f0e0f0'; c.beginPath(); c.moveTo(1500, 870); c.lineTo(1620, 870); c.lineTo(1590, 960); c.lineTo(1530, 960); c.closePath(); c.fill();
}

/** The care home at night: a long low building, warm windows (one with an old man in a chair, the TV's flicker
 *  next door), a garden bench under a lamp, a wet path; the car pulling in. */
export function careHomeOutside(c: C2, g: C2, t: number) {
  const sky = c.createLinearGradient(0, 0, 0, H * 0.7);
  sky.addColorStop(0, '#0f1438'); sky.addColorStop(1, '#2a2860');
  c.fillStyle = sky; c.fillRect(-50, -50, W + 100, H + 100);
  for (let i = 0; i < 50; i++) { c.fillStyle = `rgba(255,248,230,${0.2 + 0.5 * h01(i, 1001)})`; c.beginPath(); c.arc(h01(i, 1002) * W, h01(i, 1003) * H * 0.35, 1 + h01(i, 1004), 0, TAU); c.fill(); }
  // trees behind
  c.fillStyle = '#121636';
  for (let i = 0; i < 9; i++) { const x = i * 240 + 60 * h01(i, 1005); c.beginPath(); c.arc(x, H * 0.4, 110 + 40 * h01(i, 1006), 0, TAU); c.fill(); }
  // the building
  const bx = 260, by = H * 0.36, bw = 1400, bh = H * 0.34;
  c.fillStyle = '#3a3050'; c.fillRect(bx, by, bw, bh);
  c.fillStyle = '#2a2240'; c.beginPath(); c.moveTo(bx - 40, by); c.lineTo(bx + bw / 2, by - 140); c.lineTo(bx + bw + 40, by); c.closePath(); c.fill();
  c.fillStyle = '#4a3e64'; c.fillRect(bx, by, bw, 10);
  for (let k = 0; k < 9; k++) {
    const x = bx + 60 + k * 150, y = by + 60, w = 90, h = 120, lit = h01(k, 1007) < 0.75;
    c.fillStyle = lit ? '#ffcf8a' : '#1e1a34'; c.fillRect(x, y, w, h);
    if (k === 3) { c.fillStyle = 'rgba(140,180,255,0.45)'; c.fillRect(x, y, w, h); c.fillStyle = `rgba(200,230,255,${0.2 + 0.2 * Math.sin(t * 9)})`; c.fillRect(x, y, w, h); }
    if (k === 5) { c.fillStyle = '#5a3a2a'; c.fillRect(x + 10, y + 60, 70, 60); person(c, x + 46, y + h, 80, 'seated', { col: '#2a1830', headTilt: 0.3 }); }
    if (lit) glow(g, x + w / 2, y + h / 2, 130, '#ffcf8a', 0.07);
    c.strokeStyle = '#2a2240'; c.lineWidth = 6; c.strokeRect(x, y, w, h); c.beginPath(); c.moveTo(x + w / 2, y); c.lineTo(x + w / 2, y + h); c.stroke();
  }
  // the entrance with its porch light and sign
  c.fillStyle = '#ffd9a0'; c.fillRect(bx + bw / 2 - 60, by + bh - 170, 120, 170);
  glow(g, bx + bw / 2, by + bh - 190, 200, '#ffd08a', 0.14);
  c.fillStyle = '#f4f1ea'; c.fillRect(bx + bw / 2 - 160, by + 20, 320, 34);
  c.font = font(FAM.bold(), 24); c.fillStyle = '#2a2240'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('HARBOUR VIEW CARE HOME', bx + bw / 2, by + 37);
  // the lawn, the path, the bench and lamp
  c.fillStyle = '#16301e'; c.fillRect(-50, by + bh, W + 100, H);
  c.fillStyle = '#2a2a3e'; c.beginPath(); c.moveTo(bx + bw / 2 - 60, by + bh); c.lineTo(bx + bw / 2 + 60, by + bh); c.lineTo(bx + bw / 2 + 300, H); c.lineTo(bx + bw / 2 - 300, H); c.closePath(); c.fill();
  c.fillStyle = '#3a2620'; c.fillRect(1700, H * 0.78, 160, 14); c.fillRect(1700, H * 0.74, 160, 10); c.fillRect(1710, H * 0.79, 10, 50); c.fillRect(1840, H * 0.79, 10, 50);
  c.fillStyle = '#0b0818'; c.fillRect(1660, H * 0.48, 10, H * 0.4);
  c.fillStyle = '#ffe2a8'; c.beginPath(); c.arc(1665, H * 0.48, 18, 0, TAU); c.fill();
  glow(g, 1665, H * 0.48, 160, '#ffd08a', 0.16);
  rainFx(c, t, 0.3, 130);
}

/**
 * The care home room: muted floral wallpaper, framed photos (his wedding, a young man with a guitar, a baby), a
 * record player on a side table with a stack of records, a lamp, a rainy window; his armchair. `play` 0..1 spins the
 * record (notes come from the caller).
 */
export function careRoom(c: C2, g: C2, t: number, play: number) {
  c.fillStyle = '#5a4a62'; c.fillRect(-50, -50, W + 100, H + 100);
  c.fillStyle = 'rgba(255,220,230,0.07)';
  for (let j = 0; j < 14; j++) for (let i = 0; i < 26; i++) { const x = i * 80 + (j % 2) * 40, y = j * 70; c.beginPath(); c.arc(x, y, 9, 0, TAU); c.arc(x + 10, y + 8, 6, 0, TAU); c.fill(); }
  c.fillStyle = '#4a3a50'; c.fillRect(-50, 690, W + 100, 16);
  c.fillStyle = '#3a2e44'; c.fillRect(-50, 830, W + 100, H);
  // the window with the rainy night garden
  c.fillStyle = '#121a3a'; c.fillRect(1380, 140, 420, 420);
  c.save(); c.beginPath(); c.rect(1380, 140, 420, 420); c.clip();
  c.fillStyle = '#16301e'; c.fillRect(1380, 470, 420, 90);
  for (let i = 0; i < 40; i++) { const x = 1380 + h01(i, 1011) * 420, y = 140 + ((h01(i, 1012) * 420 + t * 120 * (0.5 + h01(i, 1013))) % 420); c.fillStyle = 'rgba(180,210,255,0.4)'; c.beginPath(); c.ellipse(x, y, 2.5, 5, 0, 0, TAU); c.fill(); }
  c.restore();
  c.strokeStyle = '#eae0ee'; c.lineWidth = 14; c.strokeRect(1380, 140, 420, 420); c.beginPath(); c.moveTo(1590, 140); c.lineTo(1590, 560); c.stroke();
  c.fillStyle = '#8a5a7a'; c.fillRect(1330, 110, 60, 520); c.fillRect(1790, 110, 60, 520);
  // the photos: a wedding (a ring of light at the stone), a young man with a guitar, a baby
  const frame = (x: number, y: number, w: number, h: number, draw: () => void) => {
    c.fillStyle = '#c9a65a'; c.fillRect(x, y, w, h); c.fillStyle = '#e9dcc0'; c.fillRect(x + 8, y + 8, w - 16, h - 16);
    c.save(); c.beginPath(); c.rect(x + 8, y + 8, w - 16, h - 16); c.clip(); draw(); c.restore();
  };
  frame(260, 150, 170, 210, () => { c.fillStyle = '#d9c9a0'; c.fillRect(268, 158, 154, 194); person(c, 315, 352, 140, 'stand', { col: '#4a3a2a' }); person(c, 370, 352, 150, 'stand', { col: '#4a3a2a' }); c.fillStyle = '#f4f1ea'; c.beginPath(); c.moveTo(300, 340); c.lineTo(330, 340); c.lineTo(325, 280); c.closePath(); c.fill(); stone(c, 395, 330, 18, { seed: 11 }); });
  frame(470, 180, 150, 180, () => { c.fillStyle = '#c99a60'; c.fillRect(478, 188, 134, 164); person(c, 545, 350, 150, 'stand', { col: '#4a2a12' }); c.fillStyle = '#4a2a12'; c.beginPath(); c.arc(560, 285, 20, 0, TAU); c.fill(); c.fillRect(562, 276, 52, 7); });
  frame(660, 210, 120, 120, () => { c.fillStyle = '#e8c8c8'; c.fillRect(668, 218, 104, 104); c.fillStyle = '#4a3a2a'; c.beginPath(); c.arc(720, 270, 20, 0, TAU); c.fill(); c.beginPath(); c.ellipse(720, 312, 30, 18, 0, 0, TAU); c.fill(); });
  // the lamp
  c.fillStyle = '#2a2030'; c.fillRect(1180, 520, 12, 310); c.fillStyle = '#e8c890'; c.beginPath(); c.moveTo(1130, 520); c.lineTo(1242, 520); c.lineTo(1216, 440); c.lineTo(1156, 440); c.closePath(); c.fill();
  glow(g, 1186, 520, 280, '#ffd08a', 0.13);
  // the side table with the record player and a stack of records
  c.fillStyle = '#5a3a2a'; c.fillRect(860, 640, 300, 20); c.fillRect(880, 660, 16, 170); c.fillRect(1124, 660, 16, 170);
  c.fillStyle = '#2a2020'; c.beginPath(); c.roundRect(880, 580, 260, 64, 8); c.fill();
  c.save(); c.translate(980, 600); c.scale(1, 0.32);
  c.fillStyle = '#0c0c10'; c.beginPath(); c.arc(0, 0, 80, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 2; for (let k = 1; k < 5; k++) { c.beginPath(); c.arc(0, 0, 20 + k * 14, t * 3 * play, t * 3 * play + 1.2); c.stroke(); }
  c.fillStyle = HEX.coral; c.beginPath(); c.arc(0, 0, 22, 0, TAU); c.fill();
  c.restore();
  c.strokeStyle = '#c0c0c8'; c.lineWidth = 5; c.beginPath(); c.moveTo(1100, 590); c.lineTo(1080, 570); c.lineTo(1030 - 12 * play, 596); c.stroke();
  c.fillStyle = '#3a2a4a'; for (let k = 0; k < 4; k++) c.fillRect(1166 + k * 4, 560 + k * 18, 14, 260 - k * 18);
}

/** The flashback, in sepia: years ago, a living room, a lamp; drawn by the caller over this ground. */
export function sepiaRoom(c: C2, g: C2, t: number) {
  const bg = c.createRadialGradient(W * 0.45, H * 0.45, 100, W * 0.5, H * 0.5, W * 0.75);
  bg.addColorStop(0, '#f2d79a'); bg.addColorStop(1, '#8a5a2a');
  c.fillStyle = bg; c.fillRect(-50, -50, W + 100, H + 100);
  c.fillStyle = 'rgba(90,60,30,0.25)'; c.fillRect(-50, 820, W + 100, H);
  c.fillStyle = '#7a4a22'; c.beginPath(); c.roundRect(300, 620, 820, 220, 40); c.fill();
  c.fillStyle = '#8a5a2a'; c.beginPath(); c.roundRect(280, 520, 120, 320, 40); c.fill(); c.beginPath(); c.roundRect(1020, 520, 120, 320, 40); c.fill();
  c.fillStyle = '#6a3a1a'; c.fillRect(1400, 380, 14, 460); c.fillStyle = '#f6e0a8'; c.beginPath(); c.moveTo(1350, 380); c.lineTo(1464, 380); c.lineTo(1440, 290); c.lineTo(1374, 290); c.closePath(); c.fill();
  glow(g, 1407, 380, 300, '#ffe0a0', 0.12);
  // film grain specks and a vignette
  c.fillStyle = 'rgba(60,40,20,0.35)';
  for (let i = 0; i < 40; i++) { const k = Math.floor(t * 12); c.fillRect(h01(i, k, 1021) * W, h01(i, k, 1022) * H, 2, 2 + 6 * h01(i, k, 1023)); }
}

// ------------------------------------------------------------------ the lifeboat station

/**
 * The lifeboat station at night in the storm: the boathouse doors open on its lit hall, the slipway running down
 * into the surf, a blue light turning, the crew's noticeboard (VOLUNTEERS ON CALL, pay: nothing) and a donation box
 * by the door, an orange jacket missing from its peg. `launch` 0..1 slides the boat down the slip.
 */
export function lifeboatStation(c: C2, g: C2, t: number) {
  const sky = c.createLinearGradient(0, 0, 0, H * 0.6);
  sky.addColorStop(0, '#0a0e2a'); sky.addColorStop(1, '#22306a');
  c.fillStyle = sky; c.fillRect(-50, -50, W + 100, H + 100);
  for (let k = 0; k < 6; k++) { c.fillStyle = 'rgba(20,24,60,0.8)'; c.beginPath(); c.arc(k * 380 + 100 * Math.sin(t * 0.3 + k), 90, 220, 0, TAU); c.fill(); }
  // the sea, rough
  c.fillStyle = '#1a2766';
  c.beginPath(); c.moveTo(-50, H); for (let x = -50; x <= W + 50; x += 20) c.lineTo(x, H * 0.62 + 24 * Math.sin(x * 0.01 + t * 2) + 10 * Math.sin(x * 0.03 - t * 3)); c.lineTo(W + 50, H); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(220,235,255,0.5)'; c.lineWidth = 3;
  for (let k = 0; k < 5; k++) { c.beginPath(); for (let x = -50; x <= W + 50; x += 20) c.lineTo(x, H * 0.66 + k * 40 + 16 * Math.sin(x * 0.012 + t * 2.4 + k)); c.stroke(); }
  // the boathouse on the left, its doors open on the lit hall
  c.fillStyle = '#2a2e48'; c.fillRect(-40, 200, 820, 560);
  c.fillStyle = '#20243a'; c.beginPath(); c.moveTo(-60, 200); c.lineTo(370, 60); c.lineTo(800, 200); c.closePath(); c.fill();
  const hl = c.createLinearGradient(0, 330, 0, 760);
  hl.addColorStop(0, '#c88a52'); hl.addColorStop(1, '#8a5a3a');
  c.fillStyle = hl; c.fillRect(180, 330, 380, 430);
  glow(g, 370, 540, 380, '#ffcf8a', 0.08);
  c.fillStyle = '#c0c4d8'; c.beginPath(); c.moveTo(180, 330); c.lineTo(110, 350); c.lineTo(110, 760); c.lineTo(180, 760); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(560, 330); c.lineTo(630, 350); c.lineTo(630, 760); c.lineTo(560, 760); c.closePath(); c.fill();
  // inside: the pegs (one jacket gone), the noticeboard, the donation box
  for (let k = 0; k < 5; k++) { c.fillStyle = '#5a3a2a'; c.fillRect(214 + k * 40, 370, 8, 10); if (k !== 2) { c.fillStyle = HEX.orange; c.beginPath(); c.moveTo(204 + k * 40, 380); c.lineTo(230 + k * 40, 380); c.lineTo(236 + k * 40, 450); c.lineTo(198 + k * 40, 450); c.closePath(); c.fill(); } }
  c.fillStyle = '#e8d8b0'; c.fillRect(420, 360, 120, 140);
  c.font = font(FAM.monoB(), 12); c.fillStyle = '#2a1d14'; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText('ON CALL', 428, 378);
  for (let k = 0; k < 5; k++) { c.fillStyle = 'rgba(40,30,50,0.5)'; c.fillRect(428, 390 + k * 18, 60, 6); c.fillStyle = HEX.pink; c.fillText('£0', 500, 397 + k * 18); }
  c.fillStyle = '#c0303a'; c.fillRect(470, 640, 60, 80); c.fillStyle = '#f4f1ea'; c.fillRect(486, 650, 28, 5);
  c.font = font(FAM.bold(), 11); c.fillStyle = '#f4f1ea'; c.textAlign = 'center'; c.fillText('DONATE', 500, 690);
  // the slipway down to the surf
  c.fillStyle = '#3a3a52'; c.beginPath(); c.moveTo(180, 760); c.lineTo(560, 760); c.lineTo(1500, H + 20); c.lineTo(1000, H + 20); c.closePath(); c.fill();
  c.strokeStyle = '#5a5a72'; c.lineWidth = 4; for (let k = 0; k < 10; k++) { const u = k / 10; c.beginPath(); c.moveTo(180 + 820 * u, 760 + 340 * u); c.lineTo(560 + 940 * u, 760 + 340 * u); c.stroke(); }
  // the blue light turning on the roof
  const bl = 0.5 + 0.5 * Math.sin(t * 9);
  c.fillStyle = '#4a8aff'; c.beginPath(); c.arc(370, 70, 14, 0, TAU); c.fill();
  glow(g, 370, 70, 300, '#4a8aff', 0.45 * bl);
}

// ------------------------------------------------------------------ the code and its keeper

/**
 * The coder's desk at midnight: a dark room, the monitor full of code (its glow the only light), a mug of coffee
 * gone cold (a skin, no steam), a small plant, sticky notes on the bezel ("fix #4012", "sleep?", a heart someone
 * sent), a clock reading 00:00, a window on the dark city with one other lit window, a cat asleep on the desk.
 */
export function coderDesk(c: C2, g: C2, t: number, code: (x: number, y: number, w: number, h: number) => void) {
  c.fillStyle = '#080a1a'; c.fillRect(-50, -50, W + 100, H + 100);
  // the window on the dark city
  c.fillStyle = '#0c1030'; c.fillRect(1240, 90, 560, 420);
  for (let i = 0; i < 9; i++) { const x = 1250 + i * 64, h = 120 + 200 * h01(i, 1031); c.fillStyle = '#060818'; c.fillRect(x, 510 - h, 58, h); }
  c.fillStyle = '#ffcf8a'; c.fillRect(1250 + 4 * 64 + 20, 510 - 160, 14, 18);
  glow(g, 1250 + 4 * 64 + 27, 510 - 151, 40, '#ffcf8a', 0.4);
  c.strokeStyle = '#1a1e40'; c.lineWidth = 12; c.strokeRect(1240, 90, 560, 420);
  // the desk
  c.fillStyle = '#161a36'; c.fillRect(-50, 760, W + 100, 30); c.fillStyle = '#0c0e22'; c.fillRect(-50, 790, W + 100, H);
  // the monitor
  const mx = 560, my = 250, mw = 640, mh = 400;
  c.fillStyle = '#05060e'; c.beginPath(); c.roundRect(mx - 20, my - 20, mw + 40, mh + 40, 14); c.fill();
  c.fillStyle = '#0a1428'; c.fillRect(mx, my, mw, mh);
  code(mx + 14, my + 14, mw - 28, mh - 28);
  c.fillStyle = '#05060e'; c.fillRect(mx + mw / 2 - 30, my + mh + 20, 60, 70); c.fillRect(mx + mw / 2 - 120, my + mh + 86, 240, 14);
  glow(g, mx + mw / 2, my + mh / 2, 460, HEX.cyan, 0.05);
  // the sticky notes
  const note = (x: number, y: number, col: string, txt: string, rot: number) => { c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = col; c.fillRect(0, 0, 90, 80); c.font = font(FAM.bold(), 16); c.fillStyle = '#2a1d14'; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; txt.split('\n').forEach((l, k) => c.fillText(l, 8, 26 + k * 20)); c.restore(); };
  note(mx - 70, my + 30, '#ffe066', 'fix\n#4012', -0.08);
  note(mx + mw - 20, my + 60, '#ff9ac8', 'sleep?', 0.1);
  note(mx + mw - 10, my + 170, '#9fe6a0', 'thank\nyou ♥', -0.05);
  // the cold coffee
  c.fillStyle = '#e8e4f0'; c.beginPath(); c.roundRect(1330, 640, 90, 110, 10); c.fill();
  c.strokeStyle = '#e8e4f0'; c.lineWidth = 12; c.beginPath(); c.arc(1425, 690, 26, -1.2, 1.2); c.stroke();
  c.fillStyle = '#4a2e1e'; c.beginPath(); c.ellipse(1375, 646, 40, 8, 0, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(200,180,160,0.5)'; c.lineWidth = 2; c.beginPath(); c.ellipse(1372, 646, 22, 4, 0, 0, TAU); c.stroke();
  // the plant
  c.fillStyle = '#6b3a2a'; c.fillRect(380, 690, 70, 70);
  c.fillStyle = '#3f8f5a'; for (let k = 0; k < 7; k++) { c.beginPath(); c.ellipse(415 + (k - 3) * 12, 660 - 14 * (3 - Math.abs(k - 3)), 9, 34, (k - 3) * 0.32 + 0.04 * Math.sin(t + k), 0, TAU); c.fill(); }
  // the clock
  const blink = Math.floor(t * 2) % 2 === 0;
  c.fillStyle = '#05060e'; c.beginPath(); c.roundRect(1500, 680, 200, 80, 10); c.fill();
  c.font = font(FAM.monoB(), 48); c.fillStyle = HEX.pink; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(blink ? '00:00' : '00 00', 1600, 722);
  glow(g, 1600, 722, 120, HEX.pink, 0.3);
  // the cat, asleep on the desk (breathing)
  const cb = 1 + 0.03 * Math.sin(t * 2.2);
  c.fillStyle = '#04050c'; c.beginPath(); c.ellipse(250, 740, 110, 40 * cb, 0, Math.PI, TAU); c.fill();
  c.beginPath(); c.arc(170, 722, 30, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(150, 700); c.lineTo(156, 676); c.lineTo(170, 696); c.moveTo(176, 694); c.lineTo(190, 676); c.lineTo(194, 702); c.fill();
  c.strokeStyle = '#04050c'; c.lineWidth = 14; c.lineCap = 'round'; c.beginPath(); c.moveTo(356, 740); c.quadraticCurveTo(400, 760, 380, 776); c.stroke();
  c.strokeStyle = rgbaHex(HEX.cyan, 0.6); c.lineWidth = 3; c.beginPath(); c.ellipse(250, 740, 110, 40 * cb, 0, Math.PI * 1.15, Math.PI * 1.95); c.stroke();
  c.beginPath(); c.arc(170, 722, 30, Math.PI * 1.2, Math.PI * 1.9); c.stroke();
}

/** The block of flats at night: one lit window among the dark ones (a figure at a screen in it). */
export function flats(c: C2, g: C2, t: number, lx: number, ly: number) {
  const sky = c.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#060818'); sky.addColorStop(1, '#141a40');
  c.fillStyle = sky; c.fillRect(-50, -50, W + 100, H + 100);
  c.fillStyle = '#0c0f26'; c.fillRect(lx - 560, ly - 420, 1120, H);
  for (let r = 0; r < 12; r++) for (let k = 0; k < 10; k++) {
    const x = lx - 520 + k * 106, y = ly - 380 + r * 90, me = Math.abs(x + 30 - lx) < 50 && Math.abs(y + 28 - ly) < 40;
    c.fillStyle = me ? '#2fe0ff' : h01(r, k, 1041) < 0.03 ? '#4a3a2a' : '#141838'; c.fillRect(x, y, 60, 56);
    if (me) { glow(g, x + 30, y + 28, 110, HEX.cyan, 0.22); person(c, x + 30, y + 56, 46, 'seated', { col: '#02030a', flip: true, headTilt: 0.2 }); }
  }
}

// ------------------------------------------------------------------ the machines

/** A data-centre aisle in one-point perspective: racks either side blinking, cable trays above, a raised floor of
 *  tiles, cold blue light; a technician at the far end with a laptop. */
export function dataAisle(c: C2, g: C2, t: number, zoom = 0) {
  const vx = W / 2, vy = H * 0.45;
  c.fillStyle = '#060a1c'; c.fillRect(-50, -50, W + 100, H + 100);
  // floor tiles converging
  c.strokeStyle = 'rgba(111,140,255,0.22)'; c.lineWidth = 2;
  for (let k = -10; k <= 10; k++) { c.beginPath(); c.moveTo(vx, vy); c.lineTo(vx + k * 260, H + 40); c.stroke(); }
  for (let k = 1; k < 14; k++) { const y = vy + (H - vy) * Math.pow(k / 14, 2.2); c.beginPath(); c.moveTo(-50, y); c.lineTo(W + 50, y); c.stroke(); }
  // the racks, rows of them receding on both sides
  for (const side of [-1, 1]) {
    for (let k = 14; k >= 0; k--) {
      const d = (k + (zoom % 1)) / 14, s = Math.pow(1 - d, 2.2) * 0.95 + 0.05;
      const xn = vx + side * (80 + 900 * s), w = 260 * s, h = 700 * s, y = vy - h * 0.45;
      const x = side > 0 ? xn : xn - w;
      c.fillStyle = mixHex('#05081a', '#232a64', s); c.fillRect(x, y, w, h);
      c.strokeStyle = rgbaHex('#6f8cff', 0.25 + 0.4 * s); c.lineWidth = Math.max(1, 2 * s); c.strokeRect(x, y, w, h);
      const n = 10;
      for (let r = 0; r < n; r++) for (let j = 0; j < 4; j++) {
        if (h01(k + side * 100, r, j + Math.floor(t * (5 + 7 * h01(k, r, 1051)))) > 0.55) continue;
        const lx = x + w * (0.15 + j * 0.2), ly = y + h * (r + 0.5) / n, col = j === 0 ? HEX.lime : j === 1 ? HEX.cyan : HEX.yellow;
        c.fillStyle = col; c.fillRect(lx, ly, Math.max(1.5, 5 * s), Math.max(1.5, 4 * s));
        if (s > 0.3) glow(g, lx, ly, 14 * s, col, 0.5);
      }
    }
  }
  // the cable trays above
  c.strokeStyle = 'rgba(111,140,255,0.35)'; c.lineWidth = 6;
  for (const side of [-1, 1]) { c.beginPath(); c.moveTo(vx + side * 20, vy - 120); c.lineTo(vx + side * 1100, -80); c.stroke(); }
  glow(g, vx, vy, 600, HEX.peri, 0.12);
  person(c, vx + 10, vy + 70, 110, 'read', { col: '#02030a', rim: rgbaHex(HEX.cyan, 0.8) });
}

// ------------------------------------------------------------------ the record and who keeps it

/** The archive: tall shelves of ledger books receding, a long table with an open ledger under a green banker's lamp,
 *  handwritten rows (who did what for whom). */
export function archive(c: C2, g: C2, t: number) {
  c.fillStyle = '#1c1428'; c.fillRect(-50, -50, W + 100, H + 100);
  const spines = ['#7a2a2a', '#2a4a7a', '#2a6a4a', '#7a5a2a', '#4a2a6a'];
  for (let s = 0; s < 6; s++) for (const side of [-1, 1]) {
    const k = 1 - s * 0.14, x0 = side < 0 ? 0 : W - 420 * k, w = 420 * k, y0 = 60 + s * 30;
    c.fillStyle = mixHex('#140c1e', '#3a2618', k); c.fillRect(x0, y0, w, H * 0.72 - y0);
    for (let r = 0; r < 7; r++) {
      const y = y0 + 20 + r * 92 * k;
      c.fillStyle = '#2a1a12'; c.fillRect(x0, y + 74 * k, w, 8);
      for (let b = 0; b < 16; b++) { const bw = (w - 20) / 16; c.fillStyle = mixHex(spines[(b + r + s) % 5]!, '#140c1e', 1 - k + 0.2); c.fillRect(x0 + 10 + b * bw, y + 10 * k * h01(b, r, s), bw - 2, 64 * k); }
    }
  }
  c.fillStyle = '#2a1a14'; c.fillRect(-50, H * 0.72, W + 100, H);
  // the long table, the open ledger, the lamp
  c.fillStyle = '#4a2e1e'; c.beginPath(); c.moveTo(560, 700); c.lineTo(1360, 700); c.lineTo(1500, 860); c.lineTo(420, 860); c.closePath(); c.fill();
  c.fillStyle = '#f2e6c8'; c.beginPath(); c.moveTo(760, 720); c.lineTo(960, 712); c.lineTo(970, 820); c.lineTo(740, 830); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(960, 712); c.lineTo(1160, 720); c.lineTo(1180, 830); c.lineTo(970, 820); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(60,40,30,0.55)'; c.lineWidth = 2;
  for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(770, 736 + k * 15); c.lineTo(950, 730 + k * 15); c.moveTo(980, 730 + k * 15); c.lineTo(1160, 736 + k * 15); c.stroke(); }
  c.fillStyle = '#2f6a3a'; c.beginPath(); c.ellipse(1260, 640, 70, 26, 0, Math.PI, TAU); c.fill();
  c.fillStyle = '#c9a65a'; c.fillRect(1256, 640, 8, 70); c.fillRect(1220, 706, 80, 8);
  glow(g, 1260, 660, 300, '#ffe0a0', 0.14);
}

/**
 * The record room seen from the dark corridor: a doorway of warm light; inside, the long table with the keepers in
 * suits (seated, faceless) and the Ledger on the wall. The door swings shut as `open` goes from 1 to 0.
 */
export function recordRoom(c: C2, g: C2, t: number, open: number, inside: (x: number, y: number, w: number, h: number) => void) {
  const cg = c.createLinearGradient(0, 0, 0, H);
  cg.addColorStop(0, '#140c26'); cg.addColorStop(1, '#2a1a44');
  c.fillStyle = cg; c.fillRect(-50, -50, W + 100, H + 100);
  c.fillStyle = '#22163a'; c.fillRect(-50, 900, W + 100, H);
  c.strokeStyle = 'rgba(198,92,240,0.12)'; c.lineWidth = 2; for (let k = 0; k < 9; k++) { c.beginPath(); c.moveTo(-50, 912 + k * k * 4); c.lineTo(W + 50, 912 + k * k * 4); c.stroke(); }
  const dx = 300, dy = 150, dw = 560, dh = 750;
  c.save(); c.beginPath(); c.rect(dx, dy, dw, dh); c.clip();
  const lg = c.createLinearGradient(0, dy, 0, dy + dh);
  lg.addColorStop(0, '#f6e7b8'); lg.addColorStop(1, '#d8b878');
  c.fillStyle = lg; c.fillRect(dx, dy, dw, dh);
  inside(dx, dy, dw, dh);
  c.restore();
  // the spill of light on the corridor floor
  c.fillStyle = `rgba(246,231,184,${0.22 * open + 0.03})`;
  c.beginPath(); c.moveTo(dx, dy + dh); c.lineTo(dx + dw * Math.max(0.02, open), dy + dh); c.lineTo(dx + dw * open + 260 * open, H + 40); c.lineTo(dx - 200 * open, H + 40); c.closePath(); c.fill();
  if (open > 0.02) glow(g, dx + dw / 2, dy + dh / 2, 500, '#f6e7b8', 0.04 * open);
  // the door leaf, swinging shut from the left hinge
  const leaf = dw * (1 - open);
  c.fillStyle = '#1c1030';
  c.beginPath(); c.moveTo(dx, dy - 6); c.lineTo(dx + leaf, dy + 8 * open); c.lineTo(dx + leaf, dy + dh - 8 * open); c.lineTo(dx, dy + dh + 6); c.closePath(); c.fill();
  if (open < 1) { c.fillStyle = HEX.gold; c.beginPath(); c.arc(dx + leaf - 30, dy + dh * 0.52, 7, 0, TAU); c.fill(); }
  c.strokeStyle = '#2a1a44'; c.lineWidth = 18; c.strokeRect(dx - 9, dy - 9, dw + 18, dh + 18);
  // a brass plate by the door
  c.fillStyle = '#c9a65a'; c.fillRect(dx + dw + 40, dy + 300, 150, 60);
  c.font = font(FAM.bold(), 18); c.fillStyle = '#2a1d14'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('THE RECORD', dx + dw + 115, dy + 330);
}
