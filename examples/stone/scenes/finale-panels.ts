// The finale's COUNT page (finale.ts, line 77): "count the nights, count the meals, count the care, or don't count".
// A comic page builds a panel per "count", each a lit room where the uncounted work happens:
//   NIGHTS  a hut at night: the parent walking the floor with the baby, the cot and its mobile, the lamp, the moon in
//           the window, and the wall clock at three (the lift to the doctor "at three" was the line before)
//   MEALS   a kitchen at dawn: the dad at the hob stirring, the pot steaming, a tower of washed bowls, a bill pinned
//           to the fridge (the woman's "bill" from verse 2, still unpaid by any ledger)
//   CARE    the care home: the daughter beside her father's armchair, the radio playing his old songs (verse 3), a
//           photo of the two of them on the wall, flowers on the sill
// Each has its tally tag (the invented numbers), and a COUNT stamped across it like a sound effect. Then "or don't
// count": chibi Rai stomps in front of the page and the COUNTs fall off.
import { W, H } from '../engine/gl';
import { HEX } from '../engine/palette';
import { font } from '../engine/type';
import { clamp, ease } from '../engine/util';
import { h01 } from './_rai';
import { panels, popIn } from './_manga';
import { FAM, TAU, gradientV, person, rgbaHex, type C2 } from './_motifs';

export const QUADS: [number, number][][] = [
  [[110, 150], [700, 132], [682, 800], [96, 815]],
  [[732, 132], [1300, 150], [1290, 806], [714, 800]],
  [[1332, 150], [1822, 134], [1834, 816], [1322, 806]],
];
const BOX = QUADS.map((q) => { const xs = q.map((p) => p[0]), ys = q.map((p) => p[1]); return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }; });
export const PANEL_CENTRE = BOX.map((b) => [b.x + b.w / 2, b.y + b.h / 2] as [number, number]);
const NOUNS = ['THE NIGHTS', 'THE MEALS', 'THE CARE'];
const TALLY = ['NIGHTS 3,650', 'MEALS 10,950', 'CARE ∞'];
export const COUNT_COLS = [HEX.cyan, HEX.yellow, HEX.pink];

/**
 * The page at t: panel i appears at `at[i]` (popping in), its COUNT stamp at `stamp[i]`. `fall` (seconds since the
 * stomp, or < 0) knocks the stamps off and turns the tallies to hearts.
 */
export function countPage(c: C2, g: C2, t: number, at: number[], stamp: number[], fall: number) {
  const shown = QUADS.map((_, i) => t >= at[i]! - 0.02);
  const quads = QUADS.filter((_, i) => shown[i]);
  const idx = QUADS.map((_, i) => i).filter((i) => shown[i]);
  // each panel pops: drawn scaled about its centre while it settles
  idx.forEach((i) => {
    const p = popIn(t, at[i]!, 0.22), [cx, cy] = PANEL_CENTRE[i]!;
    c.save(); c.translate(cx, cy); c.scale(0.85 + 0.15 * p, 0.85 + 0.15 * p); c.translate(-cx, -cy);
    panels(c, [QUADS[i]!], () => room(c, g, i, t, fall), { bw: 7 });
    c.restore();
  });
  void quads;
  // the stamps and the captions, over the panels
  idx.forEach((i) => {
    const b = BOX[i]!, [cx] = PANEL_CENTRE[i]!;
    // the caption box, top left of the panel
    c.save(); c.translate(b.x + 26, b.y + 30); c.rotate(-0.02);
    c.font = font(FAM.bold(), 38); const tw = c.measureText(NOUNS[i]!).width;
    c.fillStyle = HEX.yellow; c.fillRect(0, 0, tw + 36, 58); c.strokeStyle = HEX.ink; c.lineWidth = 4; c.strokeRect(0, 0, tw + 36, 58);
    c.fillStyle = HEX.ink; c.textBaseline = 'middle'; c.fillText(NOUNS[i]!, 18, 31);
    c.restore();
    // the tally tag, top right: the number, or a heart once the counting stops
    c.save(); c.translate(b.x + b.w - 30, b.y + 118); c.rotate(0.04);
    c.font = font(FAM.monoB(), 26); c.textAlign = 'right'; c.textBaseline = 'middle';
    const txt = fall >= 0.05 ? '♥' : TALLY[i]!, w2 = c.measureText(txt).width;
    c.fillStyle = HEX.bone; c.fillRect(-w2 - 22, -22, w2 + 32, 44); c.strokeStyle = HEX.ink; c.lineWidth = 3; c.strokeRect(-w2 - 22, -22, w2 + 32, 44);
    c.fillStyle = fall >= 0.05 ? HEX.pink : HEX.ink; c.fillText(txt, -6, 2);
    c.restore();
    // COUNT stamped across the panel's floor like a sound effect; knocked off by the stomp
    if (t >= stamp[i]! - 0.02) {
      const age = t - stamp[i]!, k = age < 0.16 ? 1 + 0.5 * (1 - ease.outBack(clamp(age / 0.16))) : 1;
      const fx = fall > 0 ? (i - 1) * 220 * fall : 0, fy = fall > 0 ? 1600 * fall * fall - 300 * fall : 0, fr = fall > 0 ? (i - 1 || 1) * 2.2 * fall : 0;
      c.save(); c.translate(cx + fx, b.y + b.h - 110 + fy); c.rotate([-0.07, 0.05, -0.04][i]! + fr); c.scale(k, k);
      c.font = font(FAM.hook(), 96); c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = HEX.ink; c.fillText('COUNT', 7, 7);
      c.fillStyle = COUNT_COLS[i]!; c.fillText('COUNT', 0, 0);
      c.restore();
    }
  });
}

/** Room i, drawn in full-frame coordinates inside its panel's clip. */
function room(c: C2, g: C2, i: number, t: number, fall: number) {
  const b = BOX[i]!, x0 = b.x, y0 = b.y, w = b.w, h = b.h, floor = y0 + h * 0.8;
  if (i === 0) {
    // the night nursery
    gradientV(c, '#2a2358', '#1a1538', x0, y0, w, h);
    c.fillStyle = '#3a2a3a'; c.fillRect(x0, floor, w, h - (floor - y0));
    c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 2;
    for (let k = 1; k < 8; k++) { c.beginPath(); c.moveTo(x0, floor + k * 18); c.lineTo(x0 + w, floor + k * 18); c.stroke(); }
    // the window: night sky, the moon, stars
    const wx = x0 + 60, wy = y0 + 130, ww = 210, wh = 230;
    c.fillStyle = '#0c0f33'; c.fillRect(wx, wy, ww, wh);
    for (let k = 0; k < 14; k++) { c.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(t * 3 + k)})`; c.beginPath(); c.arc(wx + 10 + h01(k, 21) * (ww - 20), wy + 10 + h01(k, 22) * (wh - 20), 1.8, 0, TAU); c.fill(); }
    c.fillStyle = '#fff3c9'; c.beginPath(); c.arc(wx + 140, wy + 70, 34, 0, TAU); c.arc(wx + 154, wy + 60, 30, 0, TAU, true); c.fill('evenodd');
    c.strokeStyle = '#5a3a2a'; c.lineWidth = 10; c.strokeRect(wx, wy, ww, wh);
    c.lineWidth = 6; c.beginPath(); c.moveTo(wx + ww / 2, wy); c.lineTo(wx + ww / 2, wy + wh); c.moveTo(wx, wy + wh / 2); c.lineTo(wx + ww, wy + wh / 2); c.stroke();
    // the wall clock, at three
    const kx = x0 + w - 110, ky = y0 + 250;
    c.fillStyle = HEX.bone; c.beginPath(); c.arc(kx, ky, 46, 0, TAU); c.fill(); c.strokeStyle = HEX.ink; c.lineWidth = 6; c.stroke();
    c.lineWidth = 3; for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; c.beginPath(); c.moveTo(kx + Math.cos(a) * 36, ky + Math.sin(a) * 36); c.lineTo(kx + Math.cos(a) * 42, ky + Math.sin(a) * 42); c.stroke(); }
    c.lineWidth = 6; c.beginPath(); c.moveTo(kx, ky); c.lineTo(kx + 26, ky); c.stroke();
    c.lineWidth = 4; c.beginPath(); c.moveTo(kx, ky); c.lineTo(kx, ky - 36); c.stroke();
    c.strokeStyle = HEX.coral; c.lineWidth = 2; const sa = -Math.PI / 2 + ((Math.floor(t) % 60) / 60) * TAU;
    c.beginPath(); c.moveTo(kx, ky); c.lineTo(kx + Math.cos(sa) * 38, ky + Math.sin(sa) * 38); c.stroke();
    // the lamp's warm pool
    const lx = x0 + 120, ly = floor - 140;
    const lg = c.createRadialGradient(lx, ly, 0, lx, ly, 330);
    lg.addColorStop(0, 'rgba(255,190,110,0.55)'); lg.addColorStop(1, 'rgba(255,190,110,0)');
    c.fillStyle = lg; c.fillRect(x0, y0, w, h);
    c.fillStyle = '#5a3a2a'; c.fillRect(lx - 40, floor - 80, 80, 80); c.fillRect(lx - 4, ly - 10, 8, 70);
    c.fillStyle = '#ffd99a'; c.beginPath(); c.moveTo(lx - 34, ly); c.lineTo(lx + 34, ly); c.lineTo(lx + 22, ly - 44); c.lineTo(lx - 22, ly - 44); c.closePath(); c.fill();
    g.fillStyle = 'rgba(255,170,80,0.35)'; g.beginPath(); g.arc(lx, ly - 10, 60, 0, TAU); g.fill();
    // the cot and its turning mobile
    const cx = x0 + w - 150, cy = floor - 10;
    c.strokeStyle = '#e8d8c0'; c.lineWidth = 6;
    c.strokeRect(cx - 90, cy - 110, 180, 100);
    for (let k = 1; k < 8; k++) { c.beginPath(); c.moveTo(cx - 90 + k * 22.5, cy - 110); c.lineTo(cx - 90 + k * 22.5, cy - 10); c.stroke(); }
    c.beginPath(); c.moveTo(cx - 90, cy - 10); c.lineTo(cx - 90, cy); c.moveTo(cx + 90, cy - 10); c.lineTo(cx + 90, cy); c.stroke();
    c.lineWidth = 2; c.beginPath(); c.moveTo(cx, cy - 230); c.lineTo(cx, cy - 190); c.stroke();
    for (let k = 0; k < 4; k++) {
      const a = t * 0.8 + (k / 4) * TAU, mx = cx + Math.cos(a) * 50;
      c.beginPath(); c.moveTo(cx, cy - 190); c.lineTo(mx, cy - 170); c.stroke();
      c.fillStyle = [HEX.yellow, HEX.pink, HEX.cyan, HEX.lime][k]!; c.beginPath(); c.arc(mx, cy - 160, 9, 0, TAU); c.fill();
    }
    // the parent walking the floor with the baby, swaying, tired
    const px = x0 + w * 0.42 + 26 * Math.sin(t * 1.4), sway = 0.08 * Math.sin(t * 2.8);
    person(c, px, floor + 6, 330, 'hold', { col: HEX.ink, t, seed: 3, headTilt: 0.15 + sway, rim: 'rgba(255,190,110,0.9)', emote: 'sigh', emoteT0: 0 });
  } else if (i === 1) {
    // the kitchen at dawn
    gradientV(c, '#f4e6c8', '#e6cfa4', x0, y0, w, h);
    c.strokeStyle = 'rgba(160,130,90,0.25)'; c.lineWidth = 2;
    for (let yy = y0 + 160; yy < floor - 60; yy += 34) { c.beginPath(); c.moveTo(x0, yy); c.lineTo(x0 + w, yy); c.stroke(); }
    for (let xx = x0; xx < x0 + w; xx += 34) { c.beginPath(); c.moveTo(xx, y0 + 160); c.lineTo(xx, floor - 60); c.stroke(); }
    c.fillStyle = '#9a6b3f'; c.fillRect(x0, floor, w, h - (floor - y0));
    // the window: dawn outside
    const wx = x0 + w - 230, wy = y0 + 150;
    gradientV(c, '#ffb38a', '#ffe0a8', wx, wy, 170, 170);
    c.fillStyle = '#ffd36b'; c.beginPath(); c.arc(wx + 60, wy + 130, 30, 0, TAU); c.fill();
    c.strokeStyle = '#6f4a2a'; c.lineWidth = 9; c.strokeRect(wx, wy, 170, 170);
    // the counter and the hob, the pot steaming
    c.fillStyle = '#6f4a2a'; c.fillRect(x0, floor - 70, w * 0.62, 70);
    c.fillStyle = '#2f2f3a'; c.fillRect(x0 + 40, floor - 84, 220, 16);
    const potx = x0 + 150, poty = floor - 84;
    c.fillStyle = '#4a4f5f'; c.beginPath(); c.roundRect(potx - 70, poty - 80, 140, 80, 12); c.fill();
    c.fillStyle = '#3a3f4f'; c.fillRect(potx - 80, poty - 86, 160, 12);
    g.fillStyle = 'rgba(255,120,60,0.5)'; g.fillRect(potx - 70, poty + 2, 140, 6);
    c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 9; c.lineCap = 'round';
    for (let k = 0; k < 3; k++) {
      c.beginPath();
      for (let yy = 0; yy <= 150; yy += 10) { const xx = potx - 40 + 40 * k + 14 * Math.sin(yy * 0.05 - t * 5 + k * 2); yy ? c.lineTo(xx, poty - 96 - yy) : c.moveTo(xx, poty - 96 - yy); }
      c.globalAlpha = 0.85; c.stroke(); c.globalAlpha = 1;
    }
    // the tower of washed bowls (a tally of its own)
    for (let k = 0; k < 7; k++) {
      const by = floor - 70 - k * 22, bx = x0 + w * 0.5;
      c.fillStyle = k % 2 ? '#ffffff' : '#eaf2ff'; c.beginPath(); c.ellipse(bx, by, 52, 12, 0, 0, Math.PI); c.fill();
      c.strokeStyle = '#7a8aa8'; c.lineWidth = 2; c.stroke();
    }
    // the fridge with a bill pinned to it
    const fx = x0 + w - 150, fy = floor - 330;
    c.fillStyle = '#e8eef4'; c.beginPath(); c.roundRect(fx, fy, 130, 330, 14); c.fill(); c.strokeStyle = '#9aa8b8'; c.lineWidth = 3; c.stroke();
    c.beginPath(); c.moveTo(fx, fy + 120); c.lineTo(fx + 130, fy + 120); c.stroke();
    c.save(); c.translate(fx + 66, fy + 200); c.rotate(0.08);
    c.fillStyle = '#fffdf2'; c.fillRect(-36, -44, 72, 88); c.fillStyle = HEX.coral; c.beginPath(); c.arc(0, -44, 7, 0, TAU); c.fill();
    c.fillStyle = 'rgba(40,40,60,0.6)'; for (let k = 0; k < 5; k++) c.fillRect(-26, -26 + k * 12, 40 + (k % 2) * 12, 4);
    c.font = font(FAM.monoB(), 14); c.fillStyle = HEX.coral; c.textAlign = 'center'; c.fillText('DUE', 0, 38);
    c.restore();
    // the dad at the hob, stirring, humming
    const dx = x0 + 260, stir = Math.sin(t * 5);
    person(c, dx, floor + 4, 340, 'stand', { col: HEX.ink, t, seed: 7, flip: true, headTilt: -0.12, emote: 'music', emoteT0: 0 });
    c.strokeStyle = HEX.ink; c.lineWidth = 18; c.lineCap = 'round';
    c.beginPath(); c.moveTo(dx - 20, floor - 250); c.quadraticCurveTo(dx - 70, floor - 230, potx + 20 + 18 * stir, poty - 90); c.stroke();
    c.lineWidth = 6; c.beginPath(); c.moveTo(potx + 20 + 18 * stir, poty - 90); c.lineTo(potx + 6 + 12 * stir, poty - 20); c.stroke();
  } else {
    // the care home
    gradientV(c, '#cfe6d2', '#b4d4bc', x0, y0, w, h);
    c.fillStyle = '#c8a87a'; c.fillRect(x0, floor, w, h - (floor - y0));
    // the window and its flowers
    const wx = x0 + 40, wy = y0 + 150;
    gradientV(c, '#8fd3ff', '#d8f2ff', wx, wy, 190, 190);
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(wx + 60, wy + 60, 26, 0, TAU); c.arc(wx + 92, wy + 52, 32, 0, TAU); c.fill();
    c.strokeStyle = '#ffffff'; c.lineWidth = 10; c.strokeRect(wx, wy, 190, 190);
    c.fillStyle = '#7a5a8a'; c.fillRect(wx + 70, wy + 160, 50, 34);
    for (let k = 0; k < 5; k++) { c.fillStyle = [HEX.pink, HEX.yellow, HEX.coral, '#ffffff', HEX.violet][k]!; c.beginPath(); c.arc(wx + 74 + k * 10, wy + 146 - 12 * Math.sin(k * 1.7), 9, 0, TAU); c.fill(); }
    // the photo of the two of them, years ago
    const px = x0 + w - 170, py = y0 + 170;
    c.fillStyle = '#6f4a2a'; c.fillRect(px - 8, py - 8, 136, 116); c.fillStyle = '#fff1d6'; c.fillRect(px, py, 120, 100);
    person(c, px + 44, py + 96, 80, 'hold', { col: '#8a7a6a', t: 0, seed: 1 });
    // the radio, playing his old songs
    const rx = x0 + w - 120, ry = floor - 120;
    c.fillStyle = '#6f4a2a'; c.fillRect(rx - 60, floor - 60, 120, 60);
    c.fillStyle = '#c0503a'; c.beginPath(); c.roundRect(rx - 50, ry - 10, 100, 60, 10); c.fill();
    c.fillStyle = '#f4e6c8'; c.beginPath(); c.arc(rx - 18, ry + 20, 16, 0, TAU); c.fill();
    for (let k = 0; k < 4; k++) {
      const a = (t * 0.7 + k * 0.25) % 1;
      c.font = font(FAM.hook(), 44); c.fillStyle = `rgba(90,60,140,${1 - a})`; c.textAlign = 'center';
      c.fillText(k % 2 ? '♪' : '♫', rx - 60 - a * 120 + 10 * Math.sin(t * 4 + k), ry - 30 - a * 200);
    }
    // the father in his armchair, the daughter beside him
    const ax = x0 + w * 0.36;
    c.fillStyle = '#8a4a5a'; c.beginPath(); c.roundRect(ax - 90, floor - 230, 200, 230, 30); c.fill();
    c.fillStyle = '#a45a6a'; c.beginPath(); c.roundRect(ax - 110, floor - 130, 50, 120, 16); c.roundRect(ax + 80, floor - 130, 50, 120, 16); c.fill();
    person(c, ax, floor, 300, 'seated', { col: HEX.ink, t, seed: 11, headTilt: 0.18 + 0.08 * Math.sin(t * 2.2), emote: 'music', emoteT0: 0 });
    c.fillStyle = '#d9b25e'; c.beginPath(); c.roundRect(ax - 10, floor - 125, 100, 70, 10); c.fill();
    person(c, ax + 230, floor, 310, 'seated', { col: HEX.ink, t, seed: 12, flip: true, headTilt: -0.25, emote: 'tear', emoteT0: 0, rim: 'rgba(255,255,255,0.8)' });
  }
  void fall;
}

/** The page's ground: the every-neon burst (lime this line) with a screentone. */
export function pageGround(c: C2, t: number) {
  c.fillStyle = '#3d7a1c'; c.fillRect(0, 0, W, H);
  c.save();
  const cx = W / 2, cy = H * 0.48, R = Math.hypot(W, H);
  const cols = [HEX.lime, HEX.cyan, HEX.lime, HEX.yellow, HEX.lime, HEX.pink];
  for (let k = 0; k < 36; k++) {
    if (k % 2) continue;
    const a0 = (k / 36) * TAU + t * 0.15, a1 = a0 + Math.PI / 36 * 1.05;
    c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + R * Math.cos(a0), cy + R * Math.sin(a0)); c.lineTo(cx + R * Math.cos(a1), cy + R * Math.sin(a1)); c.closePath();
    c.fillStyle = cols[(k / 2) % cols.length]!; c.fill();
  }
  c.restore();
  c.fillStyle = rgbaHex(HEX.ink, 0.14);
  c.beginPath();
  for (let y = 0; y < H + 20; y += 22) for (let x = (y / 22) % 2 ? 11 : 0; x < W + 22; x += 22) { const r = 2 + 6 * Math.hypot(x - cx, y - cy) / W; c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); }
  c.fill();
}
