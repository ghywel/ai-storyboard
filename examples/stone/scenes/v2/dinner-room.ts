// v2 DINNER's world (TREATMENT-v2.md, the bridge): the main room of the stilt hut the next evening, a round table under
// a low pendant lamp. The table top is a disc with a hole in its middle and the lamp's cord hangs over it: a stone.
// When the family stand and lift, the table rides up the cord until the lamp sits in its hole and the hole glows like
// Rai's heart. Everything is drawn in "set" pixels (the 1920x1080 wide at camera zoom 1) with a simple oblique
// projection: screen = (TX + X, FY - Y + el * Z), X across, Y up, Z towards the camera; `el` is the camera's height
// (the table's ellipse ry/rx): 0.2 at the dinner, lower as the camera cranes down for the lift.
//
// Clues on the walls (each means something, see dinner.ts): the window onto the jetty where `dive` began, villagers'
// lanterns gathering on the beach (the night dive), the long pole and a coil of rope by the door (tonight's lift), the
// girl's mask and slate by the door (her drawing of Rai on it), a wedding photo with a stone in flowers on the shelf
// (the end), the clock at 7:20 (4:00 was last night).
import { W, H, SCALE } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import { clamp, ease } from '../../engine/util';
import { h01 } from '../_rai';
import { FAM, TAU, rgbaHex, mixHex, person, emote, type Pose, type Emote } from '../_motifs';
import { girl, mother, relative, type GirlPose, type GirlAnchors } from './_diver';

type C2 = CanvasRenderingContext2D;
type P = { x: number; y: number };
const PI = Math.PI;
const outBounce = (x: number) => { const n = 7.5625, d = 2.75; if (x < 1 / d) return n * x * x; if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75; if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375; return n * (x -= 2.625 / d) * x + 0.984375; };

export const D = {
  TX: 960, FY: 905,          // the table's centre, on the floor
  RT: 420, RH: 108, TH: 22,  // the top's radius, the hole's radius, the top's thickness
  HT: 160, RISE: 232,        // the top's height at dinner, and how far they lift it (over their heads)
  LEG: 318,                  // where the three legs stand (radius)
  HOOK: 96,                  // the lamp's hook on the beam (screen y)
  SH_TOP: 471, SH_H: 62, SH_W: 118,   // the shade (its top's screen y at rest): its mouth ends inside the lifted hole
  WALLZ: -900,
};
export type Who = 'uncle' | 'aunt' | 'girl' | 'mother' | 'grandad';
export const WHO: Who[] = ['uncle', 'aunt', 'girl', 'mother', 'grandad'];
/** Where each sits: X across, Z depth (back row negative), standing height h; the ends are seen side-on. */
export const SEAT: Record<Who, { X: number; Z: number; h: number; side?: 1 | -1 }> = {
  uncle: { X: -478, Z: 30, h: 318, side: 1 },     // the left end, facing right (glasses, the calculator)
  aunt: { X: -262, Z: -470, h: 305 },             // back left (headscarf)
  girl: { X: 178, Z: -470, h: 230 },              // back, beside her mother (yellow tee, the pendant)
  mother: { X: 385, Z: -470, h: 308 },            // back right (plait, shawl): she serves
  grandad: { X: 478, Z: 30, h: 318, side: -1 },   // the right end, facing left (cap)
};
/** Where each one's plate is on the table (X, Z). */
export const PLATE: Record<Who, [number, number]> = {
  uncle: [-292, 18], aunt: [-200, -205], girl: [128, -262], mother: [252, -214], grandad: [292, 18],
};
export const POT: [number, number] = [190, -60];
export const PEAS: [number, number] = [262, 168];
export const CUP_G: [number, number] = [352, 96];

export const RIM = 'rgba(255,206,140,0.9)';
export const SIL = '#160d14';

/** A camera on the set: centre (cx, cy) in set px, zoom, and a roll. */
export interface Cam { cx: number; cy: number; zoom: number; rot?: number }
export function withCam(c: C2, g: C2, cam: Cam, draw: () => void) {
  for (const k of [c, g]) {
    k.save(); k.translate(W / 2, H / 2); k.rotate(cam.rot ?? 0); k.scale(cam.zoom, cam.zoom); k.translate(-cam.cx, -cam.cy);
  }
  draw();
  c.restore(); g.restore();
}

// ------------------------------------------------------------------ the room

export interface RoomState {
  t: number;
  el: number;
  elF?: number;          // the floor's own elevation (people's feet, the wall's foot, the rug); the table's is `el`
  rise: number;          // 0..1 the table lifted
  stand: number;         // 0..1 the family on their feet
  swing: number;         // the lamp's swing (radians)
  outside: number;       // 0..1 lanterns gathering on the beach (the night dive coming)
  hit: number;           // the grandad's fist (time), for the jumps
  acts: Record<Who, Act>;
  calc: CalcState;
  crack: number;         // 0..1 the aunt's heart dumpling cracking
  chairTip?: number;     // 0..1 the grandad's chair falls as he stands
  inPot?: number;        // -1, or 0..1 the calculator sinking in the soup
  raiPop?: { pop: number; face: string; arms?: [string, string]; marks?: string[]; markT0?: number; sd?: boolean; glow?: number; s?: number; hop?: number; tilt?: number; shake?: number; blush?: number; look?: number };
}
export interface Act {
  pose?: Pose;
  flip?: boolean;
  emote?: Emote; emoteT0?: number;
  dx?: number; dy?: number;
  /** custom arm targets (set px) for [back arm, front arm]; null keeps the arm tucked */
  arms?: [P | null, P | null];
  /** what the front hand holds */
  hold?: 'spoon' | 'ladle' | 'fist' | 'none';
  /** draw the arms behind the body (both, or just the back one: 'back') */
  behind?: boolean | 'back';
  /** the girl's own pose (she has a rig) */
  gpose?: GirlPose | string;
  glint?: 'plain' | 'spark' | 'droop' | 'wide';
  laugh?: number;        // 0..1 shoulders shaking with laughter
}
export interface CalcState { x: number; y: number; s: number; rot: number; text: string; lit: number; key?: number; show: boolean }

const tTopY = (s: RoomState) => D.FY - (D.HT + D.RISE * s.rise);
/** A point on the table top (with the jump of the fist). */
export function topPt(s: RoomState, X: number, Z: number, jump = 0): P { return { x: D.TX + X, y: tTopY(s) + s.el * Z - jump }; }
/** The jump of the things on the table after the fist (px, up), each with its own lag. */
export function jumpAt(t: number, hit: number, i: number) {
  const u = t - hit - 0.012 * (i % 5);
  if (u < 0 || u > 0.62) return 0;
  if (u < 0.3) return 30 * (0.8 + 0.4 * h01(i, 7)) * Math.sin((PI * u) / 0.3);
  return 7 * Math.sin((PI * (u - 0.3)) / 0.32);
}
/** Where a diner's feet are and how tall: the back row sits lower; standing they rise; the girl kneels up, then stands on her chair. */
export function seatPos(s: RoomState, w: Who): { x: number; y: number; h: number } {
  const q = SEAT[w], st = ease.inOutCubic(clamp(s.stand));
  let y = D.FY + (s.elF ?? s.el) * q.Z;
  if (!q.side) y += w === 'girl' ? -40 - 44 * st : 40 * (1 - st);
  const a = s.acts[w];
  return { x: D.TX + q.X + (a.dx ?? 0), y: y + (a.dy ?? 0), h: q.h };
}
/** A diner's shoulders (set px): [back, front]; their head centre. */
export function bodyPts(s: RoomState, w: Who) {
  const { x, y, h } = seatPos(s, w), u = h / 100, a = s.acts[w], q = SEAT[w];
  const f = a.flip ? -1 : 1;
  if (w === 'girl') {
    const shY = y - 63 * (h / 100);
    return { sh: [{ x: x - 2 * u * f, y: shY }, { x: x + 2 * u * f, y: shY }] as [P, P], head: { x, y: y - 79 * u }, u };
  }
  const seated = q.side && clamp(s.stand) < 0.5 && (a.pose ?? 'seated') === 'seated';
  const shY = y + (seated ? -72 : -74) * u;
  return { sh: [{ x: x - 7 * u * f, y: shY }, { x: x + 7 * u * f, y: shY }] as [P, P], head: { x, y: y + (seated ? -86 : -88) * u }, u };
}

/** The back of the room: wall, ceiling beams, window, shelf, clock, door corner, floor and rug. */
export function roomBack(c: C2, g: C2, s: RoomState) {
  const t = s.t, elF = s.elF ?? s.el, wb = D.FY + elF * D.WALLZ, lampX = D.TX + Math.sin(s.swing) * 500;
  // the wall: planks, warm where the lamp reaches
  c.fillStyle = '#5e3b24'; c.fillRect(-600, -400, W + 1200, wb + 400);
  for (let i = -9; i < 38; i++) {
    const x = i * 72, k = h01(i, 3);
    c.fillStyle = mixHex('#583620', '#6e4629', k); c.fillRect(x + 2, -400, 68, wb + 400);
    c.fillStyle = 'rgba(30,14,8,0.55)'; c.fillRect(x, -400, 3, wb + 400);
    c.strokeStyle = 'rgba(40,20,10,0.18)'; c.lineWidth = 2;   // grain
    for (let j = 0; j < 3; j++) { const gx = x + 14 + 20 * j + 6 * h01(i, j, 4); c.beginPath(); c.moveTo(gx, -400); c.bezierCurveTo(gx + 6, wb * 0.3, gx - 6, wb * 0.6, gx + 3, wb); c.stroke(); }
  }
  // the skirting
  c.fillStyle = '#3a2214'; c.fillRect(-600, wb - 16, W + 1200, 16);
  // the floor: boards running towards us, a rug of rings under the table
  const fg = c.createLinearGradient(0, wb, 0, H + 300);
  fg.addColorStop(0, '#4a2d1b'); fg.addColorStop(1, '#2b170e');
  c.fillStyle = fg; c.fillRect(-600, wb, W + 1200, H + 600 - wb);
  c.strokeStyle = 'rgba(20,8,4,0.5)'; c.lineWidth = 3;
  for (let i = -14; i <= 14; i++) { const x0 = D.TX + i * 70, x1 = D.TX + i * 200; c.beginPath(); c.moveTo(x0, wb); c.lineTo(x1, H + 400); c.stroke(); }
  const rugY = D.FY + 10, rugRx = 640, rugRy = 640 * s.el;
  c.save(); c.translate(D.TX, rugY); c.scale(1, Math.max(0.02, elF));
  for (let k = 0; k < 6; k++) { c.fillStyle = ['#7a2e24', '#b8642c', '#7a2e24', '#d39a3a', '#8a3a2a', '#5a2018'][k]!; c.beginPath(); c.arc(0, 0, rugRx * (1 - k * 0.13), 0, TAU); c.fill(); }
  c.restore();
  void rugRy;
  // the ceiling: thatch and two beams
  const cg = c.createLinearGradient(0, -200, 0, 170);
  cg.addColorStop(0, '#1a0e09'); cg.addColorStop(1, '#3a2416');
  c.fillStyle = cg; c.fillRect(-600, -400, W + 1200, 570);
  c.strokeStyle = 'rgba(200,150,80,0.12)'; c.lineWidth = 3;
  for (let i = -30; i < 60; i++) { const x = i * 40; c.beginPath(); c.moveTo(x, -400); c.lineTo(x + 140, 165); c.stroke(); }
  for (const [y0, hh] of [[20, 44], [D.HOOK - 22, 40]] as const) {
    c.fillStyle = '#2a170d'; c.fillRect(-600, y0, W + 1200, hh);
    c.fillStyle = 'rgba(255,190,110,0.12)'; c.fillRect(-600, y0 + hh - 6, W + 1200, 6);
  }
  window_(c, g, s, wb);
  // the clock at 7:20 (last night it said 4:00), its second hand ticking
  { const x = 690, y = wb - 470, r = 36;
    c.fillStyle = '#3a2214'; c.beginPath(); c.arc(x, y, r + 6, 0, TAU); c.fill();
    c.fillStyle = '#efe4c8'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.strokeStyle = '#3a2a20'; c.lineCap = 'round';
    for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; c.lineWidth = 2; c.beginPath(); c.moveTo(x + Math.cos(a) * r * 0.82, y + Math.sin(a) * r * 0.82); c.lineTo(x + Math.cos(a) * r * 0.92, y + Math.sin(a) * r * 0.92); c.stroke(); }
    const hand = (a: number, l: number, w: number, col = '#2a1a12') => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(a) * l, y - Math.cos(a) * l); c.stroke(); };
    hand(((7 + 20 / 60) / 12) * TAU, r * 0.5, 4); hand((20 / 60) * TAU, r * 0.75, 3);
    hand((Math.floor(t) / 60) * TAU, r * 0.82, 1.5, '#c03030');
  }
  // the shelf: jars, bowls, and the wedding photo (a stone in flowers between two people)
  { const x0 = 1120, x1 = 1400, y = wb - 418;
    c.fillStyle = '#3a2214'; c.fillRect(x0, y, x1 - x0, 12);
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x0, y + 12, x1 - x0, 8);
    for (let k = 0; k < 3; k++) { const jx = x0 + 22 + k * 40, jh = 46 + 12 * (k % 2); c.fillStyle = ['rgba(240,200,120,0.55)', 'rgba(200,120,80,0.6)', 'rgba(230,220,180,0.5)'][k]!; c.beginPath(); c.roundRect(jx, y - jh, 30, jh, 5); c.fill(); c.fillStyle = '#6a4a2a'; c.fillRect(jx + 3, y - jh - 7, 24, 8); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(jx + 5, y - jh + 6, 4, jh - 14); }
    for (let k = 0; k < 4; k++) { c.fillStyle = k % 2 ? '#d8d0c0' : '#c4baa6'; c.beginPath(); c.ellipse(x0 + 172, y - 4 - k * 7, 30, 6, 0, 0, TAU); c.fill(); }
    // the photo
    const px = x0 + 245, py = y - 44;
    c.fillStyle = '#c9a24a'; c.fillRect(px - 32, py - 38, 64, 76);
    c.fillStyle = '#e8dcc0'; c.fillRect(px - 26, py - 32, 52, 64);
    c.fillStyle = '#d9cfb8'; c.beginPath(); c.arc(px, py + 8, 13, 0, TAU); c.arc(px, py + 8, 4.5, 0, TAU, true); c.fill('evenodd');
    for (let k = 0; k < 7; k++) { const a = PI * (1.05 + k * 0.14); c.fillStyle = [HEX.pink, HEX.yellow, '#ffffff'][k % 3]!; c.beginPath(); c.arc(px + Math.cos(a) * 15, py + 8 + Math.sin(a) * 15, 3, 0, TAU); c.fill(); }
    for (const sx of [-17, 17]) { c.fillStyle = '#4a3a3a'; c.beginPath(); c.arc(px + sx, py - 18, 5, 0, TAU); c.fill(); c.fillRect(px + sx - 5, py - 13, 10, 30); }
    c.fillStyle = '#f4efe6'; c.fillRect(px + 12, py - 13, 10, 30);   // her white dress
  }
  // the door corner: the door, the girl's mask and slate on their hooks, a lantern ready, the long pole and its rope
  { const dx = 1680, dw = 180, top = wb - 470;
    c.fillStyle = '#3e2414'; c.fillRect(dx - 8, top - 8, dw + 16, wb - top + 8);
    for (let k = 0; k < 4; k++) { c.fillStyle = mixHex('#55331d', '#66402a', h01(k, 9)); c.fillRect(dx + k * (dw / 4) + 1, top, dw / 4 - 2, wb - top); }
    c.fillStyle = '#2a170d'; c.fillRect(dx, top + 60, dw, 12); c.fillRect(dx, wb - 90, dw, 12);
    c.fillStyle = '#c9a24a'; c.beginPath(); c.arc(dx + 26, top + 240, 7, 0, TAU); c.fill();
    // the mask on its hook
    const mx = 1468, my = wb - 380;
    c.strokeStyle = '#2a170d'; c.lineWidth = 4; c.beginPath(); c.moveTo(mx, my - 26); c.lineTo(mx, my - 14); c.stroke();
    c.strokeStyle = HEX.coral; c.lineWidth = 4; c.beginPath(); c.arc(mx, my - 4, 20, PI * 1.1, PI * 1.9); c.stroke();
    c.fillStyle = HEX.coral; c.beginPath(); c.roundRect(mx - 26, my - 6, 52, 34, 9); c.fill();
    c.fillStyle = '#1a2a4a'; c.beginPath(); c.roundRect(mx - 20, my, 40, 22, 6); c.fill();
    c.strokeStyle = 'rgba(235,250,255,0.8)'; c.lineWidth = 2; c.beginPath(); c.moveTo(mx - 12, my + 4); c.lineTo(mx - 4, my + 14); c.stroke();
    c.strokeStyle = HEX.coral; c.lineWidth = 5; c.beginPath(); c.moveTo(mx + 30, my + 10); c.lineTo(mx + 30, my - 40); c.stroke();
    // her slate on a nail, with her drawing of Rai and the heart
    const sx = 1470, sy = wb - 252;
    c.save(); c.translate(sx, sy); c.rotate(0.05);
    c.strokeStyle = '#8a8a80'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, -46); c.lineTo(-10, -32); c.moveTo(0, -46); c.lineTo(10, -32); c.stroke();
    c.fillStyle = '#eef2f2'; c.beginPath(); c.roundRect(-30, -34, 60, 76, 6); c.fill();
    c.strokeStyle = '#3a3a44'; c.lineWidth = 2.2;
    c.beginPath(); c.arc(0, 2, 16, 0, TAU); c.stroke(); c.beginPath(); c.arc(0, 4, 5, 0, TAU); c.stroke();
    c.beginPath(); c.arc(0, -20, 10, 0, TAU); c.stroke(); c.beginPath(); c.arc(0, -19, 4, 0.2, PI - 0.2); c.stroke();
    c.fillStyle = HEX.pink; c.beginPath(); c.moveTo(18, 30); c.bezierCurveTo(6, 22, 12, 14, 18, 20); c.bezierCurveTo(24, 14, 30, 22, 18, 30); c.fill();
    c.restore();
    // a paper lantern waiting on a hook (tonight)
    const lx = 1770, ly = wb - 548;
    c.strokeStyle = '#2a170d'; c.lineWidth = 2; c.beginPath(); c.moveTo(lx, ly - 40); c.lineTo(lx, ly - 22); c.stroke();
    c.fillStyle = '#d8743a'; c.beginPath(); c.ellipse(lx, ly, 16, 22, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(80,30,10,0.5)'; c.lineWidth = 1.5; for (let k = -1; k <= 1; k++) { c.beginPath(); c.ellipse(lx, ly, 16 * (1 - Math.abs(k) * 0.3), 22, 0, -PI / 2, PI / 2); c.stroke(); }
    // the long pole leaning in the corner, and a coil of rope at its foot
    c.save(); c.lineCap = 'round';
    c.strokeStyle = '#7a5530'; c.lineWidth = 22; c.beginPath(); c.moveTo(1636, wb + 40); c.lineTo(1572, -120); c.stroke();
    c.strokeStyle = 'rgba(255,210,150,0.3)'; c.lineWidth = 5; c.beginPath(); c.moveTo(1642, wb + 38); c.lineTo(1578, -120); c.stroke();
    c.strokeStyle = '#c9a76a'; c.lineWidth = 4;   // its lashings
    for (const v of [0.3, 0.32, 0.34, 0.8, 0.82]) { const x = 1636 - 64 * v, y = wb + 40 - (wb + 160) * v; c.beginPath(); c.moveTo(x - 12, y - 4); c.lineTo(x + 12, y + 4); c.stroke(); }
    c.restore();
    for (let k = 0; k < 5; k++) { c.strokeStyle = k % 2 ? '#b8935a' : '#a07c46'; c.lineWidth = 7; c.beginPath(); c.ellipse(1600, wb + 30 - k * 6, 60 - k * 4, 16 - k, 0, 0, TAU); c.stroke(); }
  }
  // the lamp's light on the wall: a warm pool, the corners dark
  { const ly = D.SH_TOP + 40;
    const vg = c.createRadialGradient(lampX, ly, 120, lampX, ly, 1250);
    vg.addColorStop(0, 'rgba(12,5,10,0)'); vg.addColorStop(0.55, 'rgba(12,5,10,0.35)'); vg.addColorStop(1, 'rgba(12,5,10,0.86)');
    c.fillStyle = vg; c.fillRect(-600, -400, W + 1200, H + 800);
    const wl = c.createRadialGradient(lampX, ly, 10, lampX, ly, 760);
    wl.addColorStop(0, 'rgba(255,170,90,0.42)'); wl.addColorStop(0.45, 'rgba(255,140,70,0.14)'); wl.addColorStop(1, 'rgba(255,140,70,0)');
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = wl; c.fillRect(lampX - 800, ly - 800, 1600, 1600); c.restore();
  }
}

function window_(c: C2, g: C2, s: RoomState, wb: number) {
  const t = s.t, x0 = 250, x1 = 580, y0 = wb - 545, y1 = wb - 300, hz = y0 + (y1 - y0) * 0.56;
  c.save();
  c.beginPath(); c.rect(x0, y0, x1 - x0, y1 - y0); c.clip();
  const sk = c.createLinearGradient(0, y0, 0, hz);
  sk.addColorStop(0, '#1d1d4e'); sk.addColorStop(0.65, '#5a3c78'); sk.addColorStop(1, '#e48a64');
  c.fillStyle = sk; c.fillRect(x0, y0, x1 - x0, hz - y0);
  for (let i = 0; i < 18; i++) { c.fillStyle = `rgba(255,255,255,${0.3 + 0.5 * h01(i, 21) * (0.6 + 0.4 * Math.sin(t * 2 + i))})`; c.beginPath(); c.arc(x0 + h01(i, 22) * (x1 - x0), y0 + h01(i, 23) * (hz - y0) * 0.6, 1.3, 0, TAU); c.fill(); }
  c.fillStyle = '#fff4d6'; c.beginPath(); c.arc(x1 - 70, y0 + 46, 13, 0, TAU); c.fill();
  g.fillStyle = 'rgba(255,244,214,0.25)'; g.beginPath(); g.arc(x1 - 70, y0 + 46, 26, 0, TAU); g.fill();
  const sg = c.createLinearGradient(0, hz, 0, y1);
  sg.addColorStop(0, '#6a4a7a'); sg.addColorStop(0.2, '#26306a'); sg.addColorStop(1, '#141a42');
  c.fillStyle = sg; c.fillRect(x0, hz, x1 - x0, y1 - hz);
  c.strokeStyle = 'rgba(255,200,170,0.35)'; c.lineWidth = 1.5;
  for (let k = 0; k < 7; k++) { const yy = hz + 6 + k * 9, xx = x0 + ((h01(k, 31) * 300 + t * 10 * (k % 2 ? 1 : -1)) % 300 + 300) % 300; c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx + 26 + k * 4, yy); c.stroke(); }
  // the jetty where the dive began
  c.fillStyle = '#120c1c';
  c.fillRect(x0, hz + 34, 200, 6);
  for (let k = 0; k < 6; k++) c.fillRect(x0 + 12 + k * 34, hz + 34, 5, 26);
  // the beach in front, and the village's lanterns gathering on it
  c.fillStyle = '#1c1426'; c.beginPath(); c.moveTo(x0, y1); c.lineTo(x0, y1 - 34); c.quadraticCurveTo(x0 + 160, y1 - 52, x1, y1 - 30); c.lineTo(x1, y1); c.closePath(); c.fill();
  const n = Math.round(3 + 11 * clamp(s.outside));
  for (let i = 0; i < n; i++) {
    const lx = x0 + 30 + ((h01(i, 41) * 260 + t * (6 + 6 * h01(i, 42))) % 270), ly = y1 - 34 - 10 * h01(i, 43) + 2 * Math.sin(t * 3 + i);
    c.fillStyle = '#ffcf7a'; c.beginPath(); c.arc(lx, ly, 2.6, 0, TAU); c.fill();
    g.fillStyle = 'rgba(255,170,80,0.35)'; g.beginPath(); g.arc(lx, ly, 9, 0, TAU); g.fill();
  }
  c.restore();
  // the frame, the sill, the curtains
  c.strokeStyle = '#2e1a0e'; c.lineWidth = 16; c.strokeRect(x0, y0, x1 - x0, y1 - y0);
  c.lineWidth = 8; c.beginPath(); c.moveTo((x0 + x1) / 2, y0); c.lineTo((x0 + x1) / 2, y1); c.stroke();
  c.fillStyle = '#3a2214'; c.fillRect(x0 - 26, y1 + 4, x1 - x0 + 52, 14);
  c.fillStyle = '#2a4a2a'; c.beginPath(); c.ellipse(x0 + 40, y1 - 12, 20, 22, 0, 0, TAU); c.fill();   // a potted plant
  c.fillStyle = '#8a4a2a'; c.fillRect(x0 + 28, y1 - 6, 24, 12);
  for (const sd of [-1, 1]) {
    const cx = sd < 0 ? x0 - 18 : x1 + 18, sw = 4 * Math.sin(t * 0.8 + sd);
    c.fillStyle = '#a8562a';
    c.beginPath(); c.moveTo(cx - 40 * sd * -1, y0 - 26); c.lineTo(cx + 42 * sd, y0 - 26); c.quadraticCurveTo(cx + 30 * sd + sw, (y0 + y1) / 2, cx + 46 * sd + sw, y1 + 30); c.lineTo(cx - 14 * sd, y1 + 30); c.quadraticCurveTo(cx - 6 * sd, (y0 + y1) / 2, cx - 40 * sd * -1, y0 - 26); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(60,20,10,0.4)'; c.lineWidth = 3; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(cx + (k * 14 - 10) * sd, y0 - 20); c.quadraticCurveTo(cx + (k * 12) * sd + sw, (y0 + y1) / 2, cx + (k * 14 + 4) * sd + sw, y1 + 26); c.stroke(); }
  }
  c.fillStyle = '#2a170d'; c.fillRect(x0 - 70, y0 - 34, x1 - x0 + 140, 10);
}

// ------------------------------------------------------------------ the table

/** The floor under the table (its shadow and the ring of light through the hole) and the back leg. */
export function tableUnder(c: C2, g: C2, s: RoomState) {
  const r = s.rise, ty = tTopY(s);
  // the table's shadow on the rug, softer as it lifts
  c.save(); c.translate(D.TX, D.FY + 6); c.scale(1, Math.max(0.03, s.elF ?? s.el));
  const sh = c.createRadialGradient(0, 0, 100, 0, 0, D.RT * (1.1 + 0.25 * r));
  sh.addColorStop(0, `rgba(10,4,6,${0.55 - 0.25 * r})`); sh.addColorStop(1, 'rgba(10,4,6,0)');
  c.fillStyle = sh; c.beginPath(); c.arc(0, 0, D.RT * (1.1 + 0.25 * r), 0, TAU); c.fill();
  // the ring of lamplight that falls through the hole
  const rr = D.RH * (1.25 + 0.5 * r);
  c.globalCompositeOperation = 'lighter';
  const lr = c.createRadialGradient(0, 0, rr * 0.4, 0, 0, rr * 1.25);
  lr.addColorStop(0, 'rgba(255,190,100,0)'); lr.addColorStop(0.65, `rgba(255,190,100,${0.5 + 0.2 * r})`); lr.addColorStop(1, 'rgba(255,190,100,0)');
  c.fillStyle = lr; c.beginPath(); c.arc(0, 0, rr * 1.3, 0, TAU); c.fill();
  c.restore();
  // the back leg
  leg(c, s, PI * 1.5, ty);
}
function leg(c: C2, s: RoomState, a: number, ty: number) {
  const X = Math.cos(a) * D.LEG, Z = Math.sin(a) * D.LEG;
  const top = ty + s.el * Z + D.TH - 2, len = D.HT - D.TH;
  const x = D.TX + X;
  c.fillStyle = Z < 0 ? '#3a2212' : '#5a3620';
  c.beginPath(); c.moveTo(x - 13, top); c.lineTo(x + 13, top); c.lineTo(x + 9, top + len); c.lineTo(x - 9, top + len); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,200,140,0.18)'; c.fillRect(x + 4, top, 5, len - 4);
  c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x - 9, top + len - 8, 18, 8);
}
/** Seen from below (the camera under the lifted table): the near edge, the underside, the lamp's mouth in the hole. */
function tableFromBelow(c: C2, g: C2, s: RoomState) {
  const el = s.el, ty = tTopY(s), yb = ty + D.TH, rx = D.RT, ry = Math.max(3, D.RT * -el), hrx = D.RH, hry = Math.max(2, D.RH * -el);
  leg(c, s, PI * 0.2, ty); leg(c, s, PI * 0.62, ty);
  // the near edge (above the underside on screen), lit warm from the lamp in the hole
  c.fillStyle = '#8a5530'; c.beginPath(); c.ellipse(D.TX, ty, rx, ry, 0, 0, TAU); c.fill();
  const eg = c.createLinearGradient(D.TX - rx, 0, D.TX + rx, 0);
  eg.addColorStop(0, 'rgba(0,0,0,0.5)'); eg.addColorStop(0.5, 'rgba(255,200,130,0.25)'); eg.addColorStop(1, 'rgba(0,0,0,0.5)');
  c.fillStyle = eg; c.fill();
  // the underside: dark wood, the bearers, the rings round the hole
  c.save();
  c.beginPath(); c.ellipse(D.TX, yb, rx, ry, 0, 0, TAU); c.ellipse(D.TX, yb, hrx, hry, 0, 0, TAU);
  const ug = c.createRadialGradient(D.TX, yb, 20, D.TX, yb, rx);
  ug.addColorStop(0, '#7a4a28'); ug.addColorStop(0.4, '#4e2c18'); ug.addColorStop(1, '#2a160c');
  c.fillStyle = ug; c.fill('evenodd'); c.clip('evenodd');
  c.strokeStyle = 'rgba(20,8,4,0.6)'; c.lineWidth = 10;
  for (const dx of [-200, 200]) { c.beginPath(); c.moveTo(D.TX + dx, yb - ry); c.lineTo(D.TX + dx, yb + ry); c.stroke(); }
  c.strokeStyle = 'rgba(255,190,120,0.12)'; c.lineWidth = 1.5;
  for (let k = 0; k < 8; k++) { const rk = D.RH + 30 + k * 36; c.beginPath(); c.ellipse(D.TX, yb, rk, rk * -el, 0, 0, TAU); c.stroke(); }
  c.restore();
  // the hole: the lamp's mouth sits in it, shining down at us
  c.save(); c.beginPath(); c.ellipse(D.TX, yb, hrx, hry, 0, 0, TAU); c.clip();
  c.fillStyle = '#8a5a30'; c.fillRect(D.TX - hrx, yb - hry, 2 * hrx, 2 * hry);
  const mg = c.createRadialGradient(D.TX, yb - hry * 0.4, 2, D.TX, yb - hry * 0.4, hrx);
  mg.addColorStop(0, '#fffbe8'); mg.addColorStop(0.45, '#ffe2a0'); mg.addColorStop(0.75, '#f0a050'); mg.addColorStop(1, '#a85a28');
  c.fillStyle = mg; c.beginPath(); c.ellipse(D.TX, yb - hry * 0.3, D.SH_W / 2, hry * 0.7, 0, 0, TAU); c.fill();
  c.restore();
  c.strokeStyle = 'rgba(255,200,130,0.8)'; c.lineWidth = 2.5; c.beginPath(); c.ellipse(D.TX, yb, hrx, hry, 0, 0, TAU); c.stroke();
  g.save(); g.translate(D.TX, yb); g.scale(1, Math.max(0.08, -el * 1.6));
  const hg = g.createRadialGradient(0, 0, 10, 0, 0, D.RH * 2.4);
  hg.addColorStop(0, 'rgba(255,220,150,0.95)'); hg.addColorStop(0.35, 'rgba(255,180,90,0.45)'); hg.addColorStop(1, 'rgba(255,170,80,0)');
  g.fillStyle = hg; g.beginPath(); g.arc(0, 0, D.RH * 2.4, 0, TAU); g.fill(); g.restore();
  // its light falling on them and the floor below
  g.save(); g.globalAlpha = 0.5;
  const cone = g.createLinearGradient(0, yb, 0, D.FY);
  cone.addColorStop(0, 'rgba(255,200,120,0.35)'); cone.addColorStop(1, 'rgba(255,200,120,0)');
  g.fillStyle = cone; g.beginPath(); g.moveTo(D.TX - hrx * 0.6, yb); g.lineTo(D.TX + hrx * 0.6, yb); g.lineTo(D.TX + 300, D.FY); g.lineTo(D.TX - 300, D.FY); g.closePath(); g.fill();
  g.restore();
}

/** The table top (a disc with a hole) and its front legs, then the dishes. */
export function tableTop(c: C2, g: C2, s: RoomState) {
  if (s.el < 0) { tableFromBelow(c, g, s); return; }
  const t = s.t, el = s.el, ty = tTopY(s), rx = D.RT, ry = Math.max(4, D.RT * el), hrx = D.RH, hry = Math.max(2, D.RH * el);
  // the front legs, dangling when it rises
  leg(c, s, PI * 0.2, ty); leg(c, s, PI * 0.62, ty);
  // the edge: the near half, extruded down by its thickness
  c.fillStyle = '#7a4a26';
  c.beginPath(); c.ellipse(D.TX, ty, rx, ry, 0, 0, PI); c.lineTo(D.TX - rx, ty + D.TH); c.ellipse(D.TX, ty + D.TH, rx, ry, 0, PI, 0, true); c.closePath(); c.fill();
  const eg = c.createLinearGradient(D.TX - rx, 0, D.TX + rx, 0);
  eg.addColorStop(0, 'rgba(0,0,0,0.45)'); eg.addColorStop(0.5, 'rgba(255,190,120,0.18)'); eg.addColorStop(1, 'rgba(0,0,0,0.45)');
  c.fillStyle = eg; c.fill();
  // the top, pale and warm, with the hole
  c.save();
  c.beginPath(); c.ellipse(D.TX, ty, rx, ry, 0, 0, TAU); c.ellipse(D.TX, ty, hrx, hry, 0, 0, TAU);
  const tg = c.createRadialGradient(D.TX, ty, 40, D.TX, ty, rx * 1.05);
  tg.addColorStop(0, '#e6c48e'); tg.addColorStop(0.5, '#cfa46c'); tg.addColorStop(1, '#8e623a');
  c.fillStyle = tg; c.fill('evenodd');
  c.clip('evenodd');
  // the grain: rings around the hole, like the growth rings of the tree it was (and like a stone's)
  c.strokeStyle = 'rgba(120,70,30,0.22)'; c.lineWidth = 1.6;
  for (let k = 0; k < 11; k++) { const rk = D.RH + 18 + k * 27 + 6 * h01(k, 61); c.beginPath(); c.ellipse(D.TX + 4 * Math.sin(k), ty, rk, rk * el, 0, 0, TAU); c.stroke(); }
  c.restore();
  c.strokeStyle = 'rgba(70,35,15,0.65)'; c.lineWidth = 2; c.beginPath(); c.ellipse(D.TX, ty, rx, ry, 0, 0, TAU); c.stroke();
  // the hole: its inner wall, the dark under the table, and the lit floor below
  c.save();
  c.beginPath(); c.ellipse(D.TX, ty, hrx, hry, 0, 0, TAU); c.clip();
  c.fillStyle = '#20120a'; c.fillRect(D.TX - hrx, ty - hry, hrx * 2, hry * 2 + 2);
  c.globalCompositeOperation = 'lighter';
  const fr = c.createRadialGradient(D.TX, ty + hry * 0.8, 2, D.TX, ty + hry * 0.8, hrx * 0.9);
  fr.addColorStop(0, `rgba(255,190,100,${0.15 + 0.5 * (1 - s.rise)})`); fr.addColorStop(1, 'rgba(255,190,100,0)');
  c.fillStyle = fr; c.fillRect(D.TX - hrx, ty - hry, hrx * 2, hry * 2);
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = '#8a5a30';   // the far side of the hole's inner wall
  c.beginPath(); c.ellipse(D.TX, ty, hrx, hry, 0, PI, TAU); c.ellipse(D.TX, ty + D.TH * 0.9, hrx, hry, 0, TAU, PI, true); c.closePath(); c.fill();
  c.restore();
  c.strokeStyle = 'rgba(70,35,15,0.6)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(D.TX, ty, hrx, hry, 0, 0, TAU); c.stroke();
  // the lamp's pool on the top
  c.save(); c.globalCompositeOperation = 'lighter';
  c.translate(D.TX + Math.sin(s.swing) * 500, ty); c.scale(1, Math.max(0.03, el));
  const pg = c.createRadialGradient(0, 0, D.RH * 0.9, 0, 0, rx * 0.95);
  pg.addColorStop(0, 'rgba(255,180,100,0.22)'); pg.addColorStop(1, 'rgba(255,180,100,0)');
  c.fillStyle = pg; c.beginPath(); c.arc(0, 0, rx * 0.95, 0, TAU); c.fill();
  c.restore();
  if (el > 0.03) dishes(c, g, s);
  else if (s.calc.show) calculator(c, g, s.calc.x, s.calc.y, s.calc.s, s.calc.rot, s.calc.text, s.calc.lit, s.calc.key);
  void t;
}

// ------------------------------------------------------------------ the dishes

function plate(c: C2, x: number, y: number, r: number, el: number, rot = 0) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(1, Math.max(0.05, el * 1.15));
  c.fillStyle = 'rgba(60,30,10,0.35)'; c.beginPath(); c.arc(4, 8, r, 0, TAU); c.fill();
  c.fillStyle = '#f2f0ea'; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
  c.strokeStyle = '#4a7ab8'; c.lineWidth = r * 0.07; c.beginPath(); c.arc(0, 0, r * 0.86, 0, TAU); c.stroke();
  c.fillStyle = '#e4e0d6'; c.beginPath(); c.arc(0, 0, r * 0.66, 0, TAU); c.fill();
  c.restore();
}
function bowl(c: C2, x: number, y: number, r: number, el: number, fill: string) {
  const ry = r * Math.max(0.08, el * 1.2);
  c.fillStyle = 'rgba(60,30,10,0.35)'; c.beginPath(); c.ellipse(x + 3, y + r * 0.5, r * 0.8, ry * 0.8, 0, 0, TAU); c.fill();
  c.fillStyle = '#e9eef0'; c.beginPath(); c.ellipse(x, y, r, ry, 0, 0, PI); c.lineTo(x - r * 0.6, y + r * 0.55); c.quadraticCurveTo(x, y + r * 0.75, x + r * 0.6, y + r * 0.55); c.closePath(); c.fill();
  c.strokeStyle = '#4a7ab8'; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y + r * 0.18, r * 0.92, ry, 0, 0.2, PI - 0.2); c.stroke();
  c.fillStyle = '#d8dcde'; c.beginPath(); c.ellipse(x, y, r, ry, 0, 0, TAU); c.fill();
  c.fillStyle = fill; c.beginPath(); c.ellipse(x, y + ry * 0.1, r * 0.86, ry * 0.8, 0, 0, TAU); c.fill();
}
/** A tin cup (enamel, a blue rim); `flip` 0..1 turns it over (rotation in radians given separately). */
function cup(c: C2, x: number, y: number, s: number, rot: number, upside: boolean, el: number) {
  c.save(); c.translate(x, y); c.rotate(rot);
  const w = 15 * s, h = 22 * s, ry = Math.max(1.5, w * el * 1.2);
  c.fillStyle = '#eef2f2';
  c.beginPath(); c.rect(-w, -h, 2 * w, h); c.fill();
  c.beginPath(); c.ellipse(0, 0, w, ry, 0, 0, PI); c.fill();
  c.strokeStyle = '#eef2f2'; c.lineWidth = 4 * s; c.beginPath(); c.arc(w + 4 * s, -h * 0.5, 6 * s, -PI / 2, PI / 2); c.stroke();
  c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(w * 0.3, -h, w * 0.7, h);
  if (!upside) { c.fillStyle = '#4a7ab8'; c.beginPath(); c.ellipse(0, -h, w, ry, 0, 0, TAU); c.fill(); c.fillStyle = '#5a3a24'; c.beginPath(); c.ellipse(0, -h, w * 0.82, ry * 0.75, 0, 0, TAU); c.fill(); }
  else { c.fillStyle = '#4a7ab8'; c.fillRect(-w, -h, 2 * w, 3 * s); c.fillStyle = '#dfe6e6'; c.beginPath(); c.ellipse(0, -h, w, ry, 0, 0, TAU); c.fill(); }
  c.restore();
}
/** The aunt's heart-shaped dumpling (pleated), cracking in two on "break". */
export function heartDumpling(c: C2, x: number, y: number, s: number, crack: number, t: number) {
  const half = (side: number) => {
    c.save();
    const k = ease.outCubic(clamp((crack - 0.35) / 0.65));
    c.translate(side * 7 * s * k, 3 * s * k); c.rotate(side * 0.28 * k);
    c.beginPath(); c.rect(side < 0 ? -40 * s : 0, -40 * s, 40 * s, 80 * s); c.clip();
    // the body
    c.fillStyle = '#f4ead4';
    c.beginPath(); c.moveTo(0, 14 * s);
    c.bezierCurveTo(-26 * s, 2 * s, -24 * s, -20 * s, -11 * s, -21 * s); c.bezierCurveTo(-4 * s, -21 * s, -1 * s, -15 * s, 0, -11 * s);
    c.bezierCurveTo(1 * s, -15 * s, 4 * s, -21 * s, 11 * s, -21 * s); c.bezierCurveTo(24 * s, -20 * s, 26 * s, 2 * s, 0, 14 * s); c.fill();
    c.fillStyle = 'rgba(200,150,90,0.35)';
    c.beginPath(); c.moveTo(0, 14 * s); c.bezierCurveTo(-20 * s, 4 * s, -22 * s, -4 * s, -18 * s, -2 * s); c.bezierCurveTo(-12 * s, 6 * s, 12 * s, 6 * s, 18 * s, -2 * s); c.bezierCurveTo(22 * s, -4 * s, 20 * s, 4 * s, 0, 14 * s); c.fill();
    // the pleats along the top
    c.strokeStyle = 'rgba(170,130,80,0.6)'; c.lineWidth = 1.2 * s;
    for (let i = 0; i < 7; i++) { const u = i / 6, px = -16 * s + u * 32 * s, py = -16 * s + Math.abs(u - 0.5) * 2 * -2 * s + (Math.abs(u - 0.5) < 0.1 ? 5 * s : 0); c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo(px + 2 * s, py + 5 * s, px + 1 * s, py + 9 * s); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); c.ellipse(-8 * s, -12 * s, 4 * s, 2 * s, -0.5, 0, TAU); c.fill();
    c.restore();
  };
  c.save(); c.translate(x, y);
  half(-1); half(1);
  if (crack > 0) { // the crack running down from the dip: a jagged line, then a gap
    const u = clamp(crack / 0.35), pts: [number, number][] = [[0, -11], [-3, -5], [2, 0], [-2, 5], [1, 10], [0, 14]];
    c.strokeStyle = '#7a5a3a'; c.lineWidth = 1.8 * s; c.lineJoin = 'miter';
    c.beginPath(); const n = Math.max(1, Math.round(u * (pts.length - 1)));
    for (let i = 0; i <= n; i++) { const p = pts[i]!; i ? c.lineTo(p[0] * s, p[1] * s) : c.moveTo(p[0] * s, p[1] * s); } c.stroke();
    // a puff of steam escaping, heart-shaped, splitting
    const v = clamp((crack - 0.3) / 0.7);
    if (v > 0 && v < 1) for (const sd of [-1, 1]) {
      c.fillStyle = `rgba(255,255,255,${0.55 * (1 - v)})`;
      const hx = sd * 10 * s * v, hy = -24 * s - 30 * s * v, hs = 9 * s * (0.6 + v);
      c.beginPath(); c.arc(hx, hy, hs * 0.6, 0, TAU); c.arc(hx + sd * hs * 0.4, hy - hs * 0.3, hs * 0.45, 0, TAU); c.fill();
    }
  }
  c.restore();
  void t;
}
/** The soup pot (iron, the soup, steam); the calculator may be sinking in it. */
function pot(c: C2, g: C2, x: number, y: number, s: number, el: number, t: number, sink = -1) {
  const r = 46 * s, ry = Math.max(4, r * el * 1.25);
  c.fillStyle = 'rgba(40,20,10,0.4)'; c.beginPath(); c.ellipse(x + 4, y + 40 * s, r * 1.05, ry, 0, 0, TAU); c.fill();
  c.fillStyle = '#2a2624';
  c.beginPath(); c.ellipse(x, y, r, ry, 0, 0, PI); c.lineTo(x - r * 0.96, y + 34 * s); c.ellipse(x, y + 34 * s, r * 0.96, ry, 0, PI, 0, true); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,180,110,0.2)'; c.fillRect(x - r * 0.6, y, r * 0.2, 32 * s);
  for (const sd of [-1, 1]) { c.strokeStyle = '#1e1a18'; c.lineWidth = 5 * s; c.beginPath(); c.arc(x + sd * r * 1.02, y + 10 * s, 7 * s, -PI / 2, PI / 2, sd < 0); c.stroke(); }
  c.fillStyle = '#3a3330'; c.beginPath(); c.ellipse(x, y, r, ry, 0, 0, TAU); c.fill();
  c.fillStyle = '#d0582a'; c.beginPath(); c.ellipse(x, y + ry * 0.12, r * 0.88, ry * 0.8, 0, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,200,120,0.4)'; for (let k = 0; k < 5; k++) { c.beginPath(); c.ellipse(x + (h01(k, 71) - 0.5) * r * 1.2, y + (h01(k, 72) - 0.5) * ry, 4 * s, 2 * s, 0, 0, TAU); c.fill(); }
  if (sink >= 0) { // the calculator's corner poking out of the soup
    c.save(); c.beginPath(); c.ellipse(x, y + ry * 0.12, r * 0.88, ry * 0.8, 0, 0, TAU); c.clip();
    c.translate(x + 8 * s, y - 2 * s + sink * 10 * s); c.rotate(0.5);
    c.fillStyle = '#c9c4b4'; c.fillRect(-12 * s, -16 * s * (1 - sink), 24 * s, 16 * s); c.restore();
  }
  // steam, curling up
  for (let k = 0; k < 3; k++) {
    const u = ((t * 0.45 + k / 3) % 1);
    c.strokeStyle = `rgba(255,245,230,${0.35 * Math.sin(PI * u)})`; c.lineWidth = 6 * s; c.lineCap = 'round';
    c.beginPath();
    for (let i = 0; i <= 10; i++) { const v = i / 10, px = x + (k - 1) * 14 * s + Math.sin(v * 5 + t * 2 + k) * 8 * s, py = y - 8 * s - (u * 70 + v * 40) * s; i ? c.lineTo(px, py) : c.moveTo(px, py); }
    c.stroke();
  }
  void g;
}
function peaBowlAndPeas(c: C2, s: RoomState) {
  const t = s.t, el = s.el, p = topPt(s, PEAS[0], PEAS[1], jumpAt(t, s.hit, 3));
  bowl(c, p.x, p.y, 34, el, '#5aa83a');
  c.fillStyle = '#7ac84a';
  for (let k = 0; k < 9; k++) { c.beginPath(); c.arc(p.x + (h01(k, 81) - 0.5) * 44, p.y - 2 + (h01(k, 82) - 0.5) * 34 * el, 4.5, 0, TAU); c.fill(); }
  // after the fist: the peas fly (parabolas from the bowl), bounce on the table, some roll off
  const u = t - s.hit;
  if (u > 0) {
    const base = topPt(s, PEAS[0], PEAS[1]);
    for (let i = 0; i < 34; i++) {
      const vx = (h01(i, 91) - 0.5) * 900, vy = -(520 + 520 * h01(i, 92)), gg = 2600, tt = u - 0.02 * (i % 4);
      if (tt < 0) continue;
      let x = base.x + vx * tt, y = base.y - 6 + vy * tt + 0.5 * gg * tt * tt;
      const land = base.y + (h01(i, 93) - 0.5) * 120 * el + (h01(i, 95) - 0.6) * 60;
      const tl = (-vy + Math.sqrt(vy * vy + 2 * gg * (land - base.y + 6))) / gg;
      if (tt > tl) { // bounced: a small hop, then rest
        const t2 = tt - tl, v2 = -vy * 0.28;
        x = base.x + vx * tl + vx * 0.3 * Math.min(t2, 0.5);
        y = land - Math.max(0, v2 * t2 - 0.5 * gg * t2 * t2);
      }
      c.fillStyle = '#7ac84a'; c.beginPath(); c.arc(x, y, 5, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.arc(x - 1.5, y - 1.5, 1.6, 0, TAU); c.fill();
    }
  }
}

export function dishes(c: C2, g: C2, s: RoomState) {
  const t = s.t, el = s.el;
  const items: { Z: number; draw: () => void }[] = [];
  WHO.forEach((w, i) => {
    const [X, Z] = PLATE[w];
    items.push({ Z, draw: () => {
      const jp = jumpAt(t, s.hit, i), p = topPt(s, X, Z, jp), rot = jp > 0 ? 0.02 * Math.sin(i * 2.1) * jp : 0;
      plate(c, p.x, p.y, w === 'girl' ? 34 : 42, el, rot);
      if (w === 'aunt') heartDumpling(c, p.x + 2, p.y - 12 - 4 * (1 - el / 0.2), 1.05, s.crack, t);
      else if (w === 'uncle') { c.fillStyle = '#f6f2e6'; c.beginPath(); c.ellipse(p.x - 6, p.y - 4, 22, 10 * el * 5, 0, 0, TAU); c.fill(); c.fillStyle = '#c86a3a'; c.beginPath(); c.ellipse(p.x + 12, p.y - 2, 12, 6 * el * 5, 0.3, 0, TAU); c.fill(); }
      else if (w === 'grandad') { c.fillStyle = '#f6f2e6'; c.beginPath(); c.ellipse(p.x + 4, p.y - 4, 22, 10 * el * 5, 0, 0, TAU); c.fill(); c.fillStyle = '#5aa83a'; for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(p.x - 16 + k * 6, p.y + 2, 3.5, 0, TAU); c.fill(); } }
      else { c.fillStyle = '#f6f2e6'; c.beginPath(); c.ellipse(p.x, p.y - 3, 16, 7 * el * 5, 0, 0, TAU); c.fill(); c.fillStyle = '#d0582a'; c.beginPath(); c.ellipse(p.x + 10, p.y, 8, 4 * el * 5, 0, 0, TAU); c.fill(); }
    } });
  });
  // the soup pot near the mother (she serves), the fish on its platter in front, the dumplings' dish
  items.push({ Z: POT[1], draw: () => { const p = topPt(s, POT[0], POT[1], jumpAt(t, s.hit, 6) * 0.4); pot(c, g, p.x, p.y - 30, 1, el, t, s.inPot ?? -1); } });
  items.push({ Z: 250, draw: () => {
    const p = topPt(s, -40, 250, jumpAt(t, s.hit, 8));
    c.save(); c.translate(p.x, p.y); c.scale(1, Math.max(0.06, el * 1.2));
    c.fillStyle = 'rgba(60,30,10,0.35)'; c.beginPath(); c.ellipse(5, 10, 110, 52, 0, 0, TAU); c.fill();
    c.fillStyle = '#e9e2cf'; c.beginPath(); c.ellipse(0, 0, 110, 52, 0, 0, TAU); c.fill();
    c.strokeStyle = '#b88a3a'; c.lineWidth = 5; c.beginPath(); c.ellipse(0, 0, 100, 44, 0, 0, TAU); c.stroke();
    c.restore();
    // the fish (drawn upright, a little raised: it has a body)
    const fy = p.y - 8;
    c.fillStyle = '#b8642c'; c.beginPath(); c.ellipse(p.x - 6, fy, 70, 20, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(p.x + 56, fy); c.lineTo(p.x + 90, fy - 18); c.lineTo(p.x + 86, fy + 16); c.closePath(); c.fill();
    c.strokeStyle = '#6a3214'; c.lineWidth = 3; for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(p.x - 40 + k * 18, fy - 16); c.lineTo(p.x - 30 + k * 18, fy + 14); c.stroke(); }
    c.fillStyle = '#f4efe1'; c.beginPath(); c.arc(p.x - 58, fy - 5, 5, 0, TAU); c.fill(); c.fillStyle = '#1a1010'; c.beginPath(); c.arc(p.x - 58, fy - 5, 2.4, 0, TAU); c.fill();
    c.fillStyle = HEX.lime; c.beginPath(); c.arc(p.x + 40, fy + 22, 9, PI, TAU); c.fill();
  } });
  items.push({ Z: 120, draw: () => peaBowlAndPeas(c, s) });
  items.push({ Z: -150, draw: () => { const p = topPt(s, -170, -60, jumpAt(t, s.hit, 9)); plate(c, p.x, p.y, 38, el); for (let k = 0; k < 3; k++) { c.save(); c.translate(p.x - 16 + k * 16, p.y - 8 - (k % 2) * 4); c.fillStyle = '#f4ead4'; c.beginPath(); c.ellipse(0, 0, 10, 8, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(170,130,80,0.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-6, -4); c.lineTo(6, -4); c.stroke(); c.restore(); } } });
  // cups: the grandad's flips on the fist
  const cups: [number, number, number][] = [[-370, -90, 0], [-120, -250, 1], [40, -300, 2], [300, -250, 3], [CUP_G[0], CUP_G[1], 4]];
  cups.forEach(([X, Z, i]) => items.push({ Z, draw: () => {
    const base = topPt(s, X, Z);
    if (i === 4) {
      const u = (t - s.hit - 0.03) / 0.5;
      if (u > 0 && u < 1) { const k = ease.outCubic(u); cup(c, base.x - 40 * k, base.y - 150 * Math.sin(PI * u), 1, PI * ease.inOutCubic(u), false, el); return; }
      if (u >= 1) { cup(c, base.x - 40, base.y - 22, 1, PI, true, el); return; }
      cup(c, base.x, base.y, 1, 0, false, el); return;
    }
    const jp = jumpAt(t, s.hit, i + 10); cup(c, base.x, base.y - jp, 1, jp > 0 ? 0.004 * jp * (i % 2 ? 1 : -1) : 0, false, el);
  } }));
  // the uncle's napkin of sums (what he is counting: her day)
  items.push({ Z: 70, draw: () => {
    const p = topPt(s, -330, 90, jumpAt(t, s.hit, 2) * 0.5);
    c.save(); c.translate(p.x, p.y); c.scale(1, Math.max(0.1, el * 3)); c.rotate(-0.12);
    c.fillStyle = '#f4f1e6'; c.fillRect(-36, -26, 72, 52);
    c.fillStyle = 'rgba(60,60,90,0.8)'; c.font = font(FAM.mono(), 8.5); c.textAlign = 'left'; c.textBaseline = 'middle';
    ['4am  ✓', 'soup ✓', 'lunch ✓', 'fever ✓'].forEach((r, k) => c.fillText(r, -30, -16 + k * 11));
    c.restore();
  } });
  items.sort((a, b) => a.Z - b.Z).forEach((it) => it.draw());
  // the calculator, in a hand or in flight
  if (s.calc.show) calculator(c, g, s.calc.x, s.calc.y, s.calc.s, s.calc.rot, s.calc.text, s.calc.lit, s.calc.key);
}

/** The uncle's calculator: a beige body, an LCD, keys. (x, y) its centre, s scale (1 = 46x66 px). */
export function calculator(c: C2, g: C2, x: number, y: number, s: number, rot: number, text: string, lit = 1, key = -1) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.fillStyle = 'rgba(30,15,5,0.35)'; c.beginPath(); c.roundRect(-21, -31, 46, 66, 6); c.fill();
  c.fillStyle = '#d6cfbd'; c.beginPath(); c.roundRect(-23, -33, 46, 66, 6); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(-21, -31, 42, 2);
  c.fillStyle = '#3a3a3a'; c.beginPath(); c.roundRect(-19, -28, 38, 16, 2); c.fill();
  c.fillStyle = mixHex('#5a6650', '#b8c8a0', lit); c.beginPath(); c.roundRect(-17, -26, 34, 12, 1.5); c.fill();
  if (lit > 0.05) {
    c.fillStyle = `rgba(20,30,20,${0.9 * lit})`; c.font = font(FAM.monoB(), 9); c.textAlign = 'right'; c.textBaseline = 'middle';
    c.fillText(text, 15.5, -19.5);
  }
  for (let r = 0; r < 5; r++) for (let k = 0; k < 4; k++) {
    const kx = -17 + k * 9.6, ky = -7 + r * 8, id = r * 4 + k, down = id === key;
    c.fillStyle = k === 3 ? '#c86a3a' : r === 0 ? '#8a8478' : '#efe9da';
    c.beginPath(); c.roundRect(kx, ky + (down ? 1 : 0), 7.6, 6.2, 1.2); c.fill();
    if (!down) { c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(kx, ky + 5.4, 7.6, 1); }
  }
  c.restore();
  void g;
}

// ------------------------------------------------------------------ the family

/** A two-bone arm from S to T (elbow bent to `bend` side), width w, in the silhouette colour; a hand at T. */
export function arm(c: C2, S: P, T: P, L1: number, L2: number, w: number, col: string, bend = 1, hand = true) {
  const dx = T.x - S.x, dy = T.y - S.y, d = Math.min((L1 + L2) * 0.999, Math.hypot(dx, dy)) || 1e-3;
  const a = Math.atan2(dy, dx), cosA = (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d);
  const ea = a + bend * Math.acos(clamp(cosA, -1, 1));
  const E = { x: S.x + Math.cos(ea) * L1, y: S.y + Math.sin(ea) * L1 }, Hn = { x: S.x + Math.cos(a) * d, y: S.y + Math.sin(a) * d };
  c.save(); c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(S.x, S.y); c.lineTo(E.x, E.y); c.lineTo(Hn.x, Hn.y); c.stroke();
  if (hand) { c.fillStyle = col; c.beginPath(); c.arc(Hn.x, Hn.y, w * 0.62, 0, TAU); c.fill(); }
  c.restore();
  return Hn;
}

/** Solve the girl's arm angles (her rig: angles from "down", + forward) so her hand reaches T from shoulder S. */
function girlArm(S: P, T: P, L1: number, L2: number, f: number): [number, number] {
  const vx = (T.x - S.x) * f, vy = T.y - S.y, d = Math.min((L1 + L2) * 0.999, Math.hypot(vx, vy)) || 1e-3;
  const a = Math.atan2(vx, vy);
  const alpha = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const beta = Math.acos(clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
  return [a - alpha, PI - beta];
}

/** One of the family at the table, with their custom arms. Returns the head (for emotes, bubbles) and, for the girl, her anchors. */
export function diner(c: C2, s: RoomState, w: Who): { head: P; girl?: GirlAnchors } {
  const t = s.t, a = s.acts[w], q = SEAT[w];
  const { x, y, h } = seatPos(s, w), u = h / 100;
  const flip = a.flip ?? (q.side ? q.side < 0 : false);
  const laughY = a.laugh ? -Math.abs(Math.sin(t * 17)) * 3 * u * a.laugh : 0;
  if (w === 'girl') {
    const f = flip ? -1 : 1;
    const shoulder = { x, y: y - 63 * u + laughY };
    let pose: GirlPose = typeof a.gpose === 'object' ? a.gpose : { rot: 0, hip: [-0.07, 0.07], knee: [0, 0], sh: [-0.3, 0.3], el: [0.6, 0.9] };
    if (a.arms) {
      const sh: [number, number] = [...pose.sh] as [number, number], elb: [number, number] = [...pose.el] as [number, number];
      a.arms.forEach((T, i) => { if (T) { const [s1, e1] = girlArm(shoulder, T, 16 * u, 15 * u, f); sh[i] = s1; elb[i] = e1; } });
      pose = { ...pose, sh, el: elb };
    }
    const an = girl(c, x, y + laughY, h, pose, { t, flip, mask: 'none', pendant: true, outfit: 'tee', rim: RIM, col: SIL, glint: a.glint, emote: a.emote, emoteT0: a.emoteT0 });
    return { head: an.head, girl: an };
  }
  const pose: Pose = a.pose ?? (q.side ? 'seated' : 'carry');
  const o = { t, flip, col: SIL, rim: RIM, emote: a.emote, emoteT0: a.emoteT0 };
  const bp = bodyPts(s, w);
  const drawArm = (T: P | null, i: number) => {
    if (!T) return;
    const S = { x: bp.sh[i]!.x, y: bp.sh[i]!.y + laughY };
    const L = (s.stand > 0.5 ? 21 : 17) * u;
    const Hn = arm(c, S, T, L, L, 6 * u, SIL, (i ? 1 : -1) * (flip ? -1 : 1) * (T.y < S.y - 10 * u ? -1 : 1));
    if (i === 1 && a.hold === 'ladle') ladle(c, Hn, u, t);
    if (i === 1 && a.hold === 'spoon') { c.strokeStyle = '#d8d8d0'; c.lineWidth = 1.6 * u; c.beginPath(); c.moveTo(Hn.x, Hn.y); c.lineTo(Hn.x + 8 * u * (flip ? -1 : 1), Hn.y - 4 * u); c.stroke(); }
    if (i === 1 && a.hold === 'fist') { c.fillStyle = SIL; c.beginPath(); c.roundRect(Hn.x - 6.5 * u, Hn.y - 6 * u, 13 * u, 12 * u, 4 * u); c.fill(); c.strokeStyle = RIM; c.lineWidth = 1.4 * u; c.beginPath(); c.arc(Hn.x, Hn.y, 6.5 * u, -2.4, -0.4); c.stroke(); }
  };
  const back = a.behind === true || a.behind === 'back';
  if (a.arms && back) drawArm(a.arms[0], 0);
  if (a.arms && a.behind === true) drawArm(a.arms[1], 1);
  if (w === 'mother') mother(c, x, y + laughY, h, pose, { ...o, shawl: '#6a3a5a' });
  else relative(c, w, x, y + laughY, h, pose, o);
  if (a.arms && !back) drawArm(a.arms[0], 0);
  if (a.arms && a.behind !== true) drawArm(a.arms[1], 1);
  return { head: { x: bp.head.x, y: bp.head.y + laughY } };
}
function ladle(c: C2, Hn: P, u: number, t: number) {
  c.save(); c.strokeStyle = '#b8b8b0'; c.lineWidth = 1.8 * u; c.lineCap = 'round';
  c.beginPath(); c.moveTo(Hn.x, Hn.y); c.lineTo(Hn.x - 4 * u, Hn.y + 16 * u); c.stroke();
  c.fillStyle = '#b8b8b0'; c.beginPath(); c.arc(Hn.x - 4 * u, Hn.y + 18 * u, 4 * u, 0, PI); c.fill();
  c.restore(); void t;
}

/** The chairs: the ends' chairs seen side-on (the grandad's tips over when he jumps up), the back row's backs. */
export function chairs(c: C2, s: RoomState, front: boolean) {
  for (const w of WHO) {
    const q = SEAT[w];
    if (!!q.side !== front) continue;
    const x = D.TX + q.X, y = D.FY + (s.elF ?? s.el) * q.Z, u = q.h / 100;
    c.save(); c.fillStyle = '#4a2a16'; c.strokeStyle = '#4a2a16'; c.lineCap = 'round';
    if (q.side) {
      const tip = w === 'grandad' ? outBounce(clamp(s.chairTip ?? 0)) : 0;
      const bx = x - q.side * 22 * u;
      c.translate(bx, y); c.rotate(-q.side * tip * PI * 0.48); c.translate(-bx, -y);
      c.lineWidth = 3.4 * u;
      c.beginPath(); c.moveTo(bx, y); c.lineTo(bx, y - 92 * u); c.stroke();
      c.beginPath(); c.moveTo(bx, y - 38 * u); c.lineTo(bx + q.side * 26 * u, y - 38 * u); c.lineTo(bx + q.side * 26 * u, y); c.stroke();
      c.lineWidth = 2.2 * u; c.beginPath(); c.moveTo(bx, y - 62 * u); c.lineTo(bx - q.side * 2 * u, y - 62 * u); c.stroke();
      c.fillStyle = 'rgba(255,200,140,0.2)'; c.fillRect(bx - 1.5 * u, y - 92 * u, 1.2 * u, 54 * u);
    } else {
      const seatY = y + (w === 'girl' ? -40 : 40), top = seatY - (w === 'girl' ? 0.62 : 0.72) * q.h;
      c.lineWidth = 2.4 * u;
      for (const dx of [-12, 12]) { c.beginPath(); c.moveTo(x + dx * u, top); c.lineTo(x + dx * u, top + 0.3 * q.h); c.stroke(); }
      c.lineWidth = 4 * u; c.beginPath(); c.moveTo(x - 14 * u, top + 3 * u); c.lineTo(x + 14 * u, top + 3 * u); c.stroke();
      c.lineWidth = 2 * u; c.beginPath(); c.moveTo(x - 12 * u, top + 12 * u); c.lineTo(x + 12 * u, top + 12 * u); c.stroke();
    }
    c.restore();
  }
}

/** The lamp: the cord from the beam, the shade, its light. When the table is lifted the shade sits in the hole. */
export function lamp(c: C2, g: C2, s: RoomState) {
  const pivot = { x: D.TX, y: D.HOOK }, L = D.SH_TOP - D.HOOK, a = s.swing;
  const top = { x: pivot.x + Math.sin(a) * L, y: pivot.y + Math.cos(a) * L };
  const ty = tTopY(s), hry = Math.max(2, D.RH * s.el);
  // the cord, twisted
  c.strokeStyle = '#1a1210'; c.lineWidth = 4; c.beginPath(); c.moveTo(pivot.x, pivot.y); c.lineTo(top.x, top.y); c.stroke();
  c.strokeStyle = 'rgba(255,200,140,0.25)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(pivot.x + 1, pivot.y); c.lineTo(top.x + 1, top.y); c.stroke();
  c.fillStyle = '#2a1a10'; c.beginPath(); c.arc(pivot.x, pivot.y, 6, 0, TAU); c.fill();
  const drawShade = () => {
    c.save(); c.translate(top.x, top.y); c.rotate(-a);
    c.fillStyle = '#c9a24a'; c.beginPath(); c.roundRect(-9, -4, 18, 14, 3); c.fill();
    const sg = c.createLinearGradient(-D.SH_W / 2, 0, D.SH_W / 2, 0);
    sg.addColorStop(0, '#4a1c0e'); sg.addColorStop(0.3, '#a8401c'); sg.addColorStop(0.5, '#d65e2c'); sg.addColorStop(0.62, '#b84a22'); sg.addColorStop(1, '#3e160a');
    c.fillStyle = sg;
    c.beginPath(); c.moveTo(-14, 8); c.lineTo(14, 8); c.quadraticCurveTo(30, 20, D.SH_W / 2, D.SH_H); c.lineTo(-D.SH_W / 2, D.SH_H); c.quadraticCurveTo(-30, 20, -14, 8); c.closePath(); c.fill();
    c.fillStyle = '#fff2c8'; c.beginPath(); c.ellipse(0, D.SH_H, D.SH_W / 2, 6, 0, 0, PI); c.fill();
    c.fillStyle = '#ffd890'; c.beginPath(); c.ellipse(0, D.SH_H + 2, D.SH_W / 2 - 6, 4, 0, 0, PI); c.fill();
    c.restore();
  };
  // the part of the shade below the top's plane shows only through the hole
  const bottom = top.y + D.SH_H;
  if (bottom > ty - hry) {
    c.save(); c.beginPath(); c.rect(-600, -400, W + 1200, ty + 400 - 0.5); c.ellipse(D.TX, ty, D.RH, hry, 0, 0, TAU); c.clip('nonzero'); drawShade(); c.restore();
  } else drawShade();
  // its light: a cone down onto the table (glow), a bloom at its mouth, and in the hole when it sits there
  const mouth = { x: top.x - Math.sin(a) * D.SH_H, y: bottom };
  const into = clamp((bottom - (ty - hry)) / 30);
  g.save();
  g.beginPath(); g.rect(-600, mouth.y - 3, W + 1200, H + 600); g.clip();
  const cone = g.createLinearGradient(0, mouth.y, 0, ty + 40);
  cone.addColorStop(0, `rgba(255,200,120,${0.13 * (1 - into)})`); cone.addColorStop(1, 'rgba(255,200,120,0)');
  g.fillStyle = cone; g.beginPath(); g.moveTo(mouth.x - D.SH_W / 2 + 6, mouth.y); g.lineTo(mouth.x + D.SH_W / 2 - 6, mouth.y); g.lineTo(D.TX + 260, ty + 40); g.lineTo(D.TX - 260, ty + 40); g.closePath(); g.fill();
  const bl = g.createRadialGradient(mouth.x, mouth.y, 4, mouth.x, mouth.y, 110 + 50 * into);
  bl.addColorStop(0, `rgba(255,214,150,${0.32 + 0.25 * into})`); bl.addColorStop(1, 'rgba(255,214,150,0)');
  g.fillStyle = bl; g.beginPath(); g.arc(mouth.x, mouth.y, 170, 0, TAU); g.fill();
  if (into > 0) { // the hole glows like a heart
    g.save(); g.translate(D.TX, ty); g.scale(1, Math.max(0.05, s.el));
    const hg = g.createRadialGradient(0, 0, D.RH * 0.4, 0, 0, D.RH * 1.3);
    hg.addColorStop(0, `rgba(255,190,90,${0.7 * into})`); hg.addColorStop(0.7, `rgba(255,170,70,${0.35 * into})`); hg.addColorStop(1, 'rgba(255,170,70,0)');
    g.fillStyle = hg; g.beginPath(); g.arc(0, 0, D.RH * 1.3, 0, TAU); g.fill(); g.restore();
  }
  g.restore();
  // moths about the light
  for (let k = 0; k < 2; k++) {
    const ph = s.t * (2.2 + k * 0.7) + k * 2, mx = top.x + Math.cos(ph) * (70 + 20 * k), my = top.y + 20 + Math.sin(ph * 1.3) * 24;
    c.fillStyle = 'rgba(240,220,190,0.85)'; const fl = Math.abs(Math.sin(s.t * 40 + k)) * 4 + 1.5;
    c.beginPath(); c.ellipse(mx - 3, my, 4, fl, 0.4, 0, TAU); c.ellipse(mx + 3, my, 4, fl, -0.4, 0, TAU); c.fill();
  }
}

/** The whole room for one frame (everything but the inserts and the overhead). Returns the girl's anchors. */
export function room(c: C2, g: C2, s: RoomState): { heads: Record<Who, P>; girl: GirlAnchors } {
  roomBack(c, g, s);
  chairs(c, s, false);
  tableUnder(c, g, s);
  const heads = {} as Record<Who, P>;
  let ga!: GirlAnchors;
  // the back row, then the ends (whose knees go under the table), then the table over them
  for (const w of ['aunt', 'girl', 'mother'] as Who[]) { const r = diner(c, s, w); heads[w] = r.head; if (r.girl) ga = r.girl; }
  chairs(c, s, true);
  for (const w of ['uncle', 'grandad'] as Who[]) heads[w] = diner(c, s, w).head;
  if (s.el < 0) { lamp(c, g, s); tableTop(c, g, s); }
  else { tableTop(c, g, s); lamp(c, g, s); }
  return { heads, girl: ga };
}

/** Blur for a soft foreground (set in screen px): canvas filters ignore the transform, so scale by the backing. */
export const blur = (c: C2, px: number) => { c.filter = px > 0.2 ? `blur(${(px * SCALE).toFixed(2)}px)` : 'none'; };

// ------------------------------------------------------------------ the overhead (the stone)

export interface TopPerson { who: Who; ang: number; laugh: number; joyT0: number }
/** Looking straight down past the lamp's cord: the table is a disc with a hole, the lamp's glow in it like a heart, and
 *  every one of them holding its rim. (cx, cy) the table's centre on screen, R its radius. */
export function overhead(c: C2, g: C2, t: number, cx: number, cy: number, R: number, rot: number, people: TopPerson[], o: { crack: number; peas: number }) {
  c.save(); c.translate(cx, cy); c.rotate(rot);
  g.save(); g.translate(cx, cy); g.rotate(rot);
  // the floor: boards, lit from the middle
  c.fillStyle = '#3a2214'; c.fillRect(-2200, -2200, 4400, 4400);
  for (let i = -30; i < 30; i++) { c.fillStyle = mixHex('#3e2416', '#4e2f1c', h01(i, 5)); c.fillRect(i * 74 + 2, -2200, 70, 4400); }
  c.save(); c.scale(1, 1);
  for (let k = 0; k < 6; k++) { c.fillStyle = ['#5a2a20', '#8a5228', '#5a2a20', '#a07a34', '#6a3022', '#4a1c14'][k]!; c.beginPath(); c.arc(0, 0, R * 1.75 * (1 - k * 0.13), 0, TAU); c.fill(); }
  c.restore();
  // people's shadows thrown outwards by the light in the middle
  for (const p of people) {
    const a = p.ang, d = R + 150;
    c.save(); c.rotate(a); c.fillStyle = 'rgba(15,6,8,0.5)'; c.beginPath(); c.ellipse(d + 110, 0, 190, 80, 0, 0, TAU); c.fill(); c.restore();
  }
  // the chairs pushed back
  for (const p of people) { c.save(); c.rotate(p.ang + 0.25); c.fillStyle = '#4a2a16'; c.fillRect(R + 210, -46, 84, 92); c.fillStyle = '#5a3620'; c.fillRect(R + 280, -52, 16, 104); c.restore(); }
  // the table top, its rings, the hole
  const tg = c.createRadialGradient(0, 0, R * 0.25, 0, 0, R);
  tg.addColorStop(0, '#f6dcaa'); tg.addColorStop(0.55, '#d9b47c'); tg.addColorStop(1, '#a8784a');
  c.fillStyle = 'rgba(10,4,6,0.5)'; c.beginPath(); c.arc(10, 14, R + 6, 0, TAU); c.fill();
  c.beginPath(); c.arc(0, 0, R, 0, TAU); c.arc(0, 0, R * 0.257, 0, TAU, true); c.fillStyle = tg; c.fill('evenodd');
  c.strokeStyle = 'rgba(120,70,30,0.22)'; c.lineWidth = 2;
  for (let k = 0; k < 11; k++) { c.beginPath(); c.arc(4 * Math.sin(k), 0, R * 0.257 + 16 + k * (R * 0.068) + 4 * h01(k, 61), 0, TAU); c.stroke(); }
  c.strokeStyle = 'rgba(70,35,15,0.7)'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.stroke();
  // the dishes, seen from above: plates, the cracked heart, the upturned cup, the pot with the calculator, scattered peas
  const plateAt = (ang: number, d: number, r: number) => { const x = Math.cos(ang) * d, y = Math.sin(ang) * d; c.fillStyle = 'rgba(60,30,10,0.3)'; c.beginPath(); c.arc(x + 4, y + 5, r, 0, TAU); c.fill(); c.fillStyle = '#f2f0ea'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.strokeStyle = '#4a7ab8'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, r * 0.86, 0, TAU); c.stroke(); return { x, y }; };
  for (const p of people) {
    const q = plateAt(p.ang, R * 0.68, p.who === 'girl' ? 30 : 38);
    if (p.who === 'aunt') { c.save(); c.translate(q.x, q.y); c.rotate(p.ang + PI / 2); heartDumpling(c, 0, 0, 1.0, o.crack, t); c.restore(); }
    else { c.fillStyle = '#f6f2e6'; c.beginPath(); c.arc(q.x - 6, q.y, 14, 0, TAU); c.fill(); c.fillStyle = p.who === 'grandad' ? '#5aa83a' : '#d0582a'; c.beginPath(); c.arc(q.x + 10, q.y + 4, 7, 0, TAU); c.fill(); }
  }
  { // the pot (the calculator's corner in the soup) between the girl and her mother
    const a = (people.find((p) => p.who === 'mother')!.ang + people.find((p) => p.who === 'girl')!.ang) / 2, x = Math.cos(a) * R * 0.5, y = Math.sin(a) * R * 0.5;
    c.fillStyle = 'rgba(30,15,5,0.4)'; c.beginPath(); c.arc(x + 6, y + 8, 46, 0, TAU); c.fill();
    c.fillStyle = '#2a2624'; c.beginPath(); c.arc(x, y, 46, 0, TAU); c.fill();
    c.fillStyle = '#d0582a'; c.beginPath(); c.arc(x, y, 38, 0, TAU); c.fill();
    c.save(); c.translate(x + 8, y - 4); c.rotate(0.6); c.fillStyle = '#c9c4b4'; c.fillRect(-12, -9, 24, 16); c.fillStyle = '#5a6650'; c.fillRect(-9, -6, 18, 5); c.restore();
  }
  { // the upturned cup by the grandad, the fish
    const ga = people.find((p) => p.who === 'grandad')!.ang;
    const x = Math.cos(ga + 0.35) * R * 0.78, y = Math.sin(ga + 0.35) * R * 0.78;
    c.fillStyle = '#dfe6e6'; c.beginPath(); c.arc(x, y, 15, 0, TAU); c.fill(); c.strokeStyle = '#4a7ab8'; c.lineWidth = 3; c.stroke();
    const fa = ga + 0.9, fx = Math.cos(fa) * R * 0.62, fy = Math.sin(fa) * R * 0.62;
    c.save(); c.translate(fx, fy); c.rotate(fa + PI / 2);
    c.fillStyle = '#e9e2cf'; c.beginPath(); c.ellipse(0, 0, 100, 48, 0, 0, TAU); c.fill();
    c.fillStyle = '#b8642c'; c.beginPath(); c.ellipse(-4, 0, 64, 18, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(52, 0); c.lineTo(84, -16); c.lineTo(80, 14); c.closePath(); c.fill();
    c.restore();
  }
  c.fillStyle = '#7ac84a';
  for (let i = 0; i < Math.round(30 * o.peas); i++) { const a = h01(i, 501) * TAU, d = R * (0.3 + 0.68 * h01(i, 502)); c.beginPath(); c.arc(Math.cos(a) * d, Math.sin(a) * d, 5, 0, TAU); c.fill(); }
  // the hole: the lamp's shade from above in the middle, the gold ring of its light around it
  const hr = R * 0.257;
  c.fillStyle = '#1a0e08'; c.beginPath(); c.arc(0, 0, hr, 0, TAU); c.fill();
  const ring = c.createRadialGradient(0, 0, hr * 0.5, 0, 0, hr);
  ring.addColorStop(0, 'rgba(255,214,130,1)'); ring.addColorStop(0.75, 'rgba(240,150,60,1)'); ring.addColorStop(1, 'rgba(150,70,25,1)');
  c.fillStyle = ring; c.beginPath(); c.arc(0, 0, hr, 0, TAU); c.fill();
  const shR = hr * 0.52;
  const sg = c.createRadialGradient(-shR * 0.3, -shR * 0.3, 2, 0, 0, shR);
  sg.addColorStop(0, '#b84a22'); sg.addColorStop(1, '#3e160a');
  c.fillStyle = sg; c.beginPath(); c.arc(0, 0, shR, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(255,230,170,0.9)'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, shR + 2, 0, TAU); c.stroke();
  c.fillStyle = '#c9a24a'; c.beginPath(); c.arc(0, 0, shR * 0.28, 0, TAU); c.fill();
  const gl = g.createRadialGradient(0, 0, hr * 0.4, 0, 0, hr * 2.6);
  gl.addColorStop(0, 'rgba(255,200,110,0.5)'); gl.addColorStop(0.4, 'rgba(255,170,80,0.16)'); gl.addColorStop(1, 'rgba(255,170,80,0)');
  g.fillStyle = gl; g.beginPath(); g.arc(0, 0, hr * 2.6, 0, TAU); g.fill();
  // the people around the rim
  for (const p of people) topPerson(c, p, R, t);
  // the warm light from the middle, the room dark at the edges
  const vg = c.createRadialGradient(0, 0, R * 0.6, 0, 0, R * 2.4);
  vg.addColorStop(0, 'rgba(10,4,8,0)'); vg.addColorStop(1, 'rgba(10,4,8,0.85)');
  c.fillStyle = vg; c.fillRect(-2200, -2200, 4400, 4400);
  c.restore(); g.restore();
}

const PS = 1.6;   // the people's scale in the overhead
function topPerson(c: C2, p: TopPerson, R: number, t: number) {
  const kid = p.who === 'girl', k = (kid ? 0.78 : 1) * PS, lb = p.laugh * Math.abs(Math.sin(t * 16 + p.ang * 3)) * 0.05;
  const d = R + 70 * k;
  c.save(); c.rotate(p.ang); c.translate(d, 0); c.scale(k * (1 + lb), k * (1 + lb));
  // local frame: +x points away from the table, -x towards it; y along the rim
  // the arms reaching to the rim
  const hands: P[] = [{ x: -70 - 2 / k, y: -46 }, { x: -70 - 2 / k, y: 46 }];
  c.strokeStyle = p.who === 'girl' ? HEX.yellow : SIL; c.lineCap = 'round';
  for (const [i, hnd] of hands.entries()) {
    const sh = { x: 4, y: (i ? 1 : -1) * 40 };
    c.strokeStyle = SIL; c.lineWidth = 19; c.beginPath(); c.moveTo(sh.x, sh.y); c.quadraticCurveTo((sh.x + hnd.x) / 2 + 10, (sh.y + hnd.y) / 2 + (i ? 14 : -14), hnd.x, hnd.y); c.stroke();
    if (kid) { c.strokeStyle = HEX.yellow; c.lineWidth = 21; c.beginPath(); c.moveTo(sh.x, sh.y); c.lineTo(sh.x - 14, sh.y + (i ? 3 : -3)); c.stroke(); }
    c.fillStyle = SIL; c.beginPath(); c.arc(hnd.x, hnd.y, 12, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,200,130,0.7)'; c.lineWidth = 3; c.beginPath(); c.arc(hnd.x, hnd.y, 12, PI * 0.6, PI * 1.4); c.stroke();
  }
  // the shoulders
  const sw = p.who === 'mother' ? '#6a3a5a' : kid ? HEX.yellow : SIL;
  c.fillStyle = SIL; c.beginPath(); c.ellipse(8, 0, 30, 52, 0, 0, TAU); c.fill();
  if (sw !== SIL) { c.fillStyle = sw; c.beginPath(); c.ellipse(8, 0, 28, 50, 0, 0, TAU); c.fill(); }
  // the head and what tells them apart
  const hx = 2, hr = 27;
  if (p.who === 'mother') { // the plait down her back
    c.strokeStyle = SIL; c.lineWidth = 10; c.beginPath(); c.moveTo(hx + 18, 0); c.quadraticCurveTo(hx + 50, 8, hx + 74, -4); c.stroke();
    c.strokeStyle = 'rgba(255,200,140,0.35)'; c.lineWidth = 2; for (let k2 = 0; k2 < 5; k2++) { c.beginPath(); c.moveTo(hx + 28 + k2 * 9, -4); c.lineTo(hx + 32 + k2 * 9, 5); c.stroke(); }
  }
  if (p.who === 'girl') { c.strokeStyle = SIL; c.lineWidth = 11; c.beginPath(); c.moveTo(hx + 18, 0); c.quadraticCurveTo(hx + 36, 10 * Math.sin(t * 3), hx + 46, 4); c.stroke(); }
  c.fillStyle = SIL; c.beginPath(); c.arc(hx, 0, hr, 0, TAU); c.fill();
  if (p.who === 'aunt') { c.fillStyle = HEX.orange; c.beginPath(); c.arc(hx, 0, hr + 1, 0, TAU); c.fill(); c.beginPath(); c.moveTo(hx + 20, -8); c.lineTo(hx + 44, -14); c.lineTo(hx + 40, 6); c.closePath(); c.fill(); c.fillStyle = HEX.gold; for (const sy of [-1, 1]) { c.beginPath(); c.arc(hx - 2, sy * (hr + 3), 4, 0, TAU); c.fill(); } }
  if (p.who === 'grandad') { c.fillStyle = '#2e2a30'; c.beginPath(); c.arc(hx + 3, 0, hr + 2, 0, TAU); c.fill(); c.beginPath(); c.ellipse(hx - 22, 0, 14, 24, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(80,75,85,0.9)'; c.lineWidth = 2; c.beginPath(); c.arc(hx + 3, 0, hr - 6, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(240,240,240,0.85)'; c.lineWidth = 3; c.beginPath(); c.arc(hx - 4, 0, hr - 2, PI * 0.7, PI * 1.3); c.stroke(); }
  if (p.who === 'uncle') { c.strokeStyle = '#cfd6e6'; c.lineWidth = 3; c.beginPath(); c.moveTo(hx - 22, -14); c.lineTo(hx - 26, 14); c.stroke(); c.beginPath(); c.moveTo(hx - 22, -14); c.lineTo(hx + 4, -hr + 1); c.moveTo(hx - 26, 14); c.lineTo(hx + 4, hr - 1); c.stroke(); }
  if (p.who === 'mother') { c.strokeStyle = 'rgba(255,210,160,0.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(hx - hr + 4, 0); c.lineTo(hx + hr - 4, 0); c.stroke(); }
  // the lamp's rim light on the side towards the table
  c.strokeStyle = 'rgba(255,200,130,0.8)'; c.lineWidth = 3; c.beginPath(); c.arc(hx, 0, hr + (p.who === 'aunt' ? 1 : p.who === 'grandad' ? 2 : 0), PI * 0.7, PI * 1.3); c.stroke();
  c.beginPath(); c.ellipse(8, 0, 30, 52, 0, PI * 0.62, PI * 1.38); c.stroke();
  c.restore();
  // the laugh: a sign at the head, upright on screen
  if (p.laugh > 0) {
    const m = c.getTransform(), hp = m.transformPoint(new DOMPoint(0, 0));
    void hp;
  }
}
/** Where a top-view person's head is (in the overhead's rotated frame → caller's frame). */
export function topHead(cx: number, cy: number, rot: number, R: number, p: TopPerson): P {
  const k = (p.who === 'girl' ? 0.78 : 1) * PS, d = R + 70 * k + 2 * k, a = p.ang + rot;
  return { x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d };
}
export function topEmote(c: C2, hp: P, t: number, t0: number, kid: boolean) {
  emote(c, hp.x - 10, hp.y + 10, kid ? 20 : 26, 'joy', t, t0);
}
void person;
