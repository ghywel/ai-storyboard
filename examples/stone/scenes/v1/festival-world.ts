// v1 `festival`'s world: Yap's beach at night (`island(... 'night')`) with the risen studio standing in the shallows
// (the wreck's hull at the waterline, its ribs, a truss with the anglerfish lamps, the sign, the ring of bulbs), the
// scoreboard rebuilt in bulbs (the smashed frame lashed together with rope, rows that glow pink, no £ and no number),
// the applause meter (that breaks), the island's crowd with lanterns, palms, huts, the stone bank whose old stones'
// hearts are lit tonight, and the fireworks over the bay. The reverse shot (the beach from the stage) and the meter's
// close-up are here too. One world at zoom 1 in the 1920x1080 frame; the plate's cameras look into it with `withCam`.
import { W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import { clamp, ease, frameIdx } from '../../engine/util';
import { h01 } from '../_rai';
import { FAM, TAU, rgbaHex, mixHex, person, type Pose, type Emote } from '../_motifs';
import { star4, heart, puff, popIn } from '../_manga';
import { island, palmTree, hut, stoneBank, canoe } from '../_world';
import { bulbRing, signBoard, textDots, crabCam, octopus } from './_studio';
import { cast, type Who } from './_cast';

type C2 = CanvasRenderingContext2D;

/** The world's layout (zoom 1). */
export const FW = {
  hz: 690, beach: 775, water: 738,       // horizon, the sand's edge, the waterline at the stage
  floor: 600,                             // the stage floor (Rai's feet)
  stageL: 600, stageR: 1320,
  ring: { x: 960, y: 489, r: 96 },
  R: 46,                                  // Rai on the stage
  sign: { x: 960, y: 352, k: 0.28 },
  truss: { l: 650, r: 1270, top: 318 },
  board: { x: 640, y: 446, w: 136, h: 118 },
  meter: { x: 1205, y: 540, r: 50 },
  octo: { x: 1300, y: 566, s: 0.26 },
  great: { x: 960, y: 300, r: 240 },     // the fireworks' great ring, in the sky over the stage
};

// ------------------------------------------------------------------ fireworks

export type BurstKind = 'peony' | 'ring' | 'willow' | 'crackle' | 'palm' | 'heart';
export interface Burst { t0: number; x: number; y: number; r: number; col: string; col2: string; kind: BurstKind; n: number; seed: number; lx: number }

export const FIRE_COLS = [HEX.pink, HEX.yellow, HEX.cyan, HEX.lime, HEX.orange, HEX.violet, HEX.gold, HEX.coral, HEX.peri, '#ffffff'];

/** Where a particle of a burst is at age a (s). */
function particle(b: Burst, i: number, a: number): [number, number] {
  const ring = b.kind === 'ring' || b.kind === 'heart';
  let ang = (i / b.n) * TAU + (ring ? 0 : (h01(i, b.seed, 1) - 0.5) * 0.35);
  let sp = b.r * (ring ? 1 : 0.62 + 0.42 * h01(i, b.seed, 2));
  let dx = Math.cos(ang), dy = Math.sin(ang);
  if (b.kind === 'heart') { // a heart's outline instead of a circle
    const th = ang;
    dx = 16 * Math.pow(Math.sin(th), 3) / 17; dy = -(13 * Math.cos(th) - 5 * Math.cos(2 * th) - 2 * Math.cos(3 * th) - Math.cos(4 * th)) / 17;
    sp = b.r;
  }
  if (b.kind === 'palm') { ang = (Math.floor(i / 6) / Math.ceil(b.n / 6)) * TAU; dx = Math.cos(ang); dy = Math.sin(ang); sp = b.r * (0.5 + 0.5 * ((i % 6) / 5)); }
  const D = 1 - Math.exp(-3.2 * a), grav = b.kind === 'willow' ? 95 : 42;
  return [b.x + dx * sp * D, b.y + dy * sp * D * (ring ? 0.92 : 1) + grav * a * a];
}

/**
 * The fireworks: rockets rising from the bay, then bursts (peonies, rings, willows, crackles, palms, a heart), each
 * a batch of streaks on the main layer and its bloom on the glow layer. Clipped to the sky (above the horizon).
 * Returns the sky's light (0..1) and its colour, for lighting the crowd.
 */
export function fireworks(c: C2, g: C2, t: number, bursts: Burst[], hz = FW.hz): { light: number; col: string } {
  let light = 0, lcol: string = HEX.gold;
  c.save(); c.beginPath(); c.rect(-W, -H, W * 3, hz + H); c.clip();
  g.save(); g.beginPath(); g.rect(-W, -H, W * 3, hz + H); g.clip();
  c.lineCap = 'round'; g.lineCap = 'round';
  for (const b of bursts) {
    const a = t - b.t0, life = b.kind === 'willow' ? 2.8 : b.kind === 'crackle' ? 2.0 : 1.75;
    if (a < -0.55 || a > life) continue;
    if (a < 0) { // the rocket
      const u = 1 + a / 0.55, rx = b.lx + (b.x - b.lx) * u, ry = hz + (b.y - hz) * ease.outQuad(u);
      c.strokeStyle = 'rgba(255,240,210,0.9)'; c.lineWidth = 3;
      const pu = Math.max(0, u - 0.12), px = b.lx + (b.x - b.lx) * pu, py = hz + (b.y - hz) * ease.outQuad(pu);
      c.beginPath(); c.moveTo(px, py); c.lineTo(rx, ry); c.stroke();
      g.fillStyle = 'rgba(255,220,160,0.6)'; g.beginPath(); g.arc(rx, ry, 9, 0, TAU); g.fill();
      continue;
    }
    const fade = Math.pow(1 - a / life, 1.3), trail = b.kind === 'willow' ? 0.16 : 0.08;
    const k = frameIdx(t);
    c.strokeStyle = mixHex(b.col, '#ffffff', 0.35 * fade); c.lineWidth = b.kind === 'palm' ? 4 : 2.6;
    g.strokeStyle = rgbaHex(b.col, 0.5 * fade); g.lineWidth = b.kind === 'palm' ? 12 : 8;
    c.globalAlpha = fade; c.beginPath(); g.beginPath();
    for (let i = 0; i < b.n; i++) {
      if (b.kind === 'crackle' && a > 0.7 && h01(i, k, b.seed) < 0.45) continue;
      const [x1, y1] = particle(b, i, a), [x0, y0] = particle(b, i, Math.max(0, a - trail));
      c.moveTo(x0, y0); c.lineTo(x1, y1);
      g.moveTo(x0, y0); g.lineTo(x1, y1);
    }
    c.stroke(); g.stroke(); c.globalAlpha = 1;
    if (b.col2 && a > 0.35 && b.kind !== 'willow') { // the second colour: glitter at the tips late in the burst
      g.fillStyle = rgbaHex(b.col2, 0.7 * fade);
      g.beginPath();
      for (let i = 0; i < b.n; i += 2) { if (h01(i, k, 7) < 0.5) continue; const [x, y] = particle(b, i, a); g.moveTo(x + 4, y); g.arc(x, y, 4, 0, TAU); }
      g.fill();
    }
    if (a < 0.14) { // the flash
      const f = 1 - a / 0.14;
      g.fillStyle = rgbaHex('#fff6e0', 0.75 * f); g.beginPath(); g.arc(b.x, b.y, b.r * 0.35, 0, TAU); g.fill();
    }
    const l = Math.exp(-a / 0.35);
    if (l > light) { light = l; lcol = b.col; }
  }
  g.restore(); c.restore();
  return { light, col: lcol };
}

/** The bursts' light on the water: a column of reflected colour under each, shimmering. */
export function fireReflections(g: C2, t: number, bursts: Burst[], hz = FW.hz, beach = FW.beach) {
  for (const b of bursts) {
    const a = t - b.t0;
    if (a < 0 || a > 1.4) continue;
    const f = Math.pow(1 - a / 1.4, 2);
    for (let k = 0; k < 6; k++) {
      const y = hz + 4 + k * ((beach - hz) / 6), w = b.r * (0.5 - k * 0.05) * (0.8 + 0.3 * Math.sin(t * 12 + k));
      g.fillStyle = rgbaHex(b.col, 0.32 * f * (1 - k / 7)); g.fillRect(b.x - w / 2, y, w, 3);
    }
  }
}

/**
 * The great ring: two comets launched from the water at its foot run up round it in opposite directions and meet at
 * the top at `t1`, drawing one ring of gold over the bay; it then glitters. Draw behind the stage.
 */
export function greatRing(c: C2, g: C2, t: number, t0: number, t1: number) {
  if (t < t0) return;
  const { x, y, r } = FW.great, u = ease.inOutQuad(clamp((t - t0) / (t1 - t0))), done = clamp((t - t1) / 0.4);
  const a0 = Math.PI / 2, span = Math.PI * u, k = frameIdx(t);
  c.save(); g.save(); c.lineCap = 'round'; g.lineCap = 'round';
  for (const ctx of [c, g]) { // it stands behind the studio: hide what falls behind the stage and its hull
    ctx.beginPath(); ctx.rect(-W, -H, W * 3, H * 3); ctx.rect(FW.stageL - 12, FW.floor - 20, FW.stageR - FW.stageL + 24, 400);
    ctx.moveTo(FW.ring.x + FW.ring.r + 14, FW.ring.y); ctx.arc(FW.ring.x, FW.ring.y, FW.ring.r + 14, 0, TAU, true); ctx.clip('evenodd');
  }
  for (const d of [1, -1]) {
    const start = a0, end = a0 + d * span;
    // the trail: a gold line and glitter along it
    g.strokeStyle = rgbaHex(HEX.gold, 0.32 + 0.2 * done); g.lineWidth = 10 + 6 * done;
    g.beginPath(); g.arc(x, y, r, Math.min(start, end), Math.max(start, end)); g.stroke();
    c.strokeStyle = mixHex(HEX.gold, '#fff6e0', 0.5); c.lineWidth = 2.5;
    c.beginPath(); c.arc(x, y, r, Math.min(start, end), Math.max(start, end)); c.stroke();
    const n = Math.floor(90 * u);
    c.fillStyle = '#fff6e0';
    for (let i = 0; i < n; i++) {
      if (h01(i, k, d + 5) < 0.55) continue;
      const aa = a0 + d * span * (i / Math.max(1, n)), rr = r + (h01(i, k, 9) - 0.5) * 22;
      c.beginPath(); c.arc(x + Math.cos(aa) * rr, y + Math.sin(aa) * rr + 8 * h01(i, k, 3), 2.2, 0, TAU); c.fill();
    }
    if (done < 1) { // the comet head
      const hx = x + Math.cos(end) * r, hy = y + Math.sin(end) * r;
      star4(c, hx, hy, 14, '#fff6e0');
      g.fillStyle = rgbaHex('#fff2c0', 0.55); g.beginPath(); g.arc(hx, hy, 16, 0, TAU); g.fill();
    }
  }
  if (done > 0) { // then it rains gold: sparks dripping from all round it, slowly
    const age = t - t1;
    c.fillStyle = '#ffe9a8'; g.fillStyle = rgbaHex(HEX.gold, 0.5);
    c.beginPath(); g.beginPath();
    for (let i = 0; i < 70; i++) {
      const aa = (i / 70) * TAU + h01(i, 3) * 0.08, ph = (age * (0.35 + 0.25 * h01(i, 4)) + h01(i, 5)) % 1;
      const px = x + Math.cos(aa) * r + 6 * Math.sin(t * 2 + i), py = y + Math.sin(aa) * r + ph * 150;
      const rr = 2.4 * (1 - ph);
      if (rr < 0.3) continue;
      c.moveTo(px + rr, py); c.arc(px, py, rr, 0, TAU); g.moveTo(px + rr * 2.5, py); g.arc(px, py, rr * 2.5, 0, TAU);
    }
    c.fill(); g.fill();
  }
  if (done > 0 && done < 1) { // they meet: a flash at the top
    g.fillStyle = rgbaHex('#fff6e0', 0.9 * (1 - done)); g.beginPath(); g.arc(x, y - r, 70 + 120 * done, 0, TAU); g.fill();
  }
  c.restore(); g.restore();
}

/** The fireworks plan for the plate: on the beats, more at the big moments. */
export function planBursts(beats: number[], from: number, to: number, extra: Burst[]): Burst[] {
  const out: Burst[] = [...extra];
  beats.forEach((bt, i) => {
    if (bt < from || bt > to) return;
    const s = i * 7 + 3;
    if (h01(s, 1) < 0.55) return;
    const kinds: BurstKind[] = ['peony', 'peony', 'crackle', 'peony', 'palm', 'peony', 'ring'];
    const kind = kinds[Math.floor(h01(s, 2) * kinds.length)]!;
    const x = 160 + h01(s, 3) * (W - 320), y = 90 + h01(s, 4) * 300;
    out.push({ t0: bt, x, y, r: 110 + 120 * h01(s, 5), col: FIRE_COLS[Math.floor(h01(s, 6) * FIRE_COLS.length)]!, col2: FIRE_COLS[Math.floor(h01(s, 8) * FIRE_COLS.length)]!, kind, n: kind === 'palm' ? 36 : 54, seed: s, lx: x + (h01(s, 9) - 0.5) * 200 });
  });
  return out;
}

// ------------------------------------------------------------------ the bay, the island

/** The night bay: `island(... 'night')` for the sky, the moon, the sea and the sand, then the far islets, the moon's path. */
export function nightBay(c: C2, g: C2, t: number) {
  island(c, t, { time: 'night', horizon: FW.hz, beach: FW.beach, show: ['ship'], seed: 5 });
  // the far islands on the horizon, with a few lights
  c.fillStyle = '#0c1032';
  c.beginPath(); c.moveTo(-10, FW.hz + 2);
  for (let x = -10; x <= 560; x += 20) c.lineTo(x, FW.hz - 34 * Math.sin(Math.PI * (x + 10) / 570) - 12 * Math.sin(x * 0.03));
  c.lineTo(560, FW.hz + 2); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(1400, FW.hz + 2);
  for (let x = 1400; x <= 1930; x += 20) c.lineTo(x, FW.hz - 46 * Math.sin(Math.PI * (x - 1400) / 530) - 8 * Math.sin(x * 0.05));
  c.lineTo(1930, FW.hz + 2); c.closePath(); c.fill();
  for (let i = 0; i < 9; i++) {
    const x = i < 4 ? 80 + i * 110 : 1450 + (i - 4) * 90, y = FW.hz - 6 - 12 * h01(i, 3);
    g.fillStyle = rgbaHex('#ffcf6b', 0.5 + 0.3 * Math.sin(t * 2 + i)); g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill();
  }
  // the moon's path on the water
  c.fillStyle = 'rgba(255,244,214,0.55)';
  for (let k = 0; k < 9; k++) {
    const y = FW.hz + 4 + k * 8, w = 30 + 10 * k + 14 * Math.sin(t * 3 + k * 1.7);
    c.fillRect(W * 0.78 - w / 2 + 6 * Math.sin(t * 2 + k), y, w, 2.5);
  }
}

/** The beach around the crowd: palms leaning in at the edges, huts with lit windows, the stone bank (its old stones'
 *  hearts lit tonight), a canoe, lantern strings. */
export function beachProps(c: C2, g: C2, t: number) {
  const dk = 0.55;
  hut(c, 330, 812, 150, true, dk);
  hut(c, 1600, 806, 140, true, dk);
  canoe(c, 470, 842, 0.55, dk);
  // the stone bank and its hearts
  const bx = 1430, by = 812, k = 0.5;
  stoneBank(c, bx, by, k, dk, 5);
  [70, 110, 55, 90, 45].forEach((r, i) => {
    const sx = bx - 160 * k + i * 80 * k, sy = by - 26 * k - r * k * 0.95 + r * k * 0.05;
    const a = 0.6 + 0.25 * Math.sin(t * 1.6 + i);
    g.fillStyle = rgbaHex(HEX.pink, 0.3 * a); g.beginPath(); g.arc(sx, sy, r * k * 0.28, 0, TAU); g.fill();
    heart(c, sx, sy + r * k * 0.06, r * k * 0.17, rgbaHex(HEX.pink, 0.95));
  });
  palmTree(c, 70, 880, 560, 0.2, t, 0, 0.62);
  palmTree(c, 250, 830, 430, 0.12, t, 1, 0.62);
  palmTree(c, 1850, 885, 580, -0.22, t, 2, 0.62);
  palmTree(c, 1680, 828, 420, -0.1, t, 3, 0.62);
  // lantern strings from the palms to the huts
  for (const [x0, y0, x1, y1] of [[120, 420, 420, 700], [1800, 410, 1520, 696]] as const) {
    c.strokeStyle = 'rgba(30,20,30,0.9)'; c.lineWidth = 2;
    const mx = (x0 + x1) / 2, my = Math.max(y0, y1) + 40;
    c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(mx, my, x1, y1); c.stroke();
    for (let i = 1; i < 9; i++) {
      const u = i / 9, x = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * mx + u * u * x1, y = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * my + u * u * y1 + 8;
      const col = [HEX.orange, HEX.gold, HEX.pink][i % 3]!, tw = 0.75 + 0.25 * Math.sin(t * 3 + i);
      c.fillStyle = col; c.beginPath(); c.ellipse(x, y, 7, 9, 0, 0, TAU); c.fill();
      g.fillStyle = rgbaHex(col, 0.5 * tw); g.beginPath(); g.arc(x, y, 18, 0, TAU); g.fill();
    }
  }
}

// ------------------------------------------------------------------ the risen studio

export interface StageOpts {
  /** The breach: the whole studio this many px lower (under the water at first). */
  dy?: number;
  /** Seconds since the studio broke the surface (water sheets off it, then drips). */
  wet?: number;
  /** The ring's burst inside it (two colours), and how lit the ring is. */
  burst?: [string, string] | null;
  ring?: number;
  /** The rebuilt board: the header and its three rows' light (0..1 each), and the stars' pulse. */
  board?: { head: number; rows: [number, number, number] } | null;
  /** The applause meter's needle 0..1 (1 = the top); `broke` = the time it broke. */
  meter?: number; broke?: number;
  /** The octopus's card. */
  card?: string | null; cardT0?: number;
  /** Rai (and anything on the stage), drawn between the set and the front of the stage. */
  onStage?: () => void;
  /** The crew at the front of the stage. */
  crew?: boolean;
  /** The anglerfish lamps' beams sweeping the sky. */
  beams?: number;
  /** Hide the board and the meter (the breach). */
  props?: boolean;
}

/** The risen studio standing in the shallows, from its ribs and truss to the water at its hull. */
export function festStage(c: C2, g: C2, t: number, o: StageOpts = {}) {
  const dy = o.dy ?? 0, wet = o.wet ?? 99;
  const L = FW.stageL, R = FW.stageR, F = FW.floor;
  c.save(); g.save();
  if (dy > 0) { // under the water: clip at the waterline, the lights glowing through it
    c.beginPath(); c.rect(-W, -H, W * 3, FW.water + H); c.clip();
    g.beginPath(); g.rect(-W, -H, W * 3, FW.water + H); g.clip();
  }
  c.translate(0, dy); g.translate(0, dy);
  // the ribs of the wreck, curving up either side
  c.strokeStyle = '#1c1024'; c.lineCap = 'round';
  for (const [x0, x1, w] of [[L - 40, L + 40, 22], [L + 30, L + 110, 16], [R + 40, R - 40, 22], [R - 30, R - 110, 16]] as const) {
    c.lineWidth = w;
    c.beginPath(); c.moveTo(x0, FW.water + 6); c.quadraticCurveTo(x0 + (x1 - x0) * 0.2, 470, x1, 290 + (w === 16 ? 40 : 0)); c.stroke();
  }
  // weed hanging from the ribs
  c.strokeStyle = 'rgba(31,122,74,0.85)'; c.lineWidth = 5;
  for (let i = 0; i < 6; i++) {
    const x = i < 3 ? L - 10 + i * 40 : R + 10 - (i - 3) * 40, y = 330 + 60 * h01(i, 4);
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 8 * Math.sin(t * 2 + i), y + 40, x + 2, y + 70 + 20 * h01(i, 5)); c.stroke();
  }
  // the truss and its lamps
  const T = FW.truss;
  c.fillStyle = '#20172a';
  c.fillRect(T.l - 8, T.top, 16, F - T.top); c.fillRect(T.r - 8, T.top, 16, F - T.top);
  c.fillRect(T.l - 20, T.top - 10, T.r - T.l + 40, 16);
  c.strokeStyle = '#2e2238'; c.lineWidth = 3;
  c.beginPath();
  for (let x = T.l; x < T.r; x += 40) { c.moveTo(x, T.top - 10); c.lineTo(x + 20, T.top + 6); c.lineTo(x + 40, T.top - 10); }
  c.stroke();
  for (let i = 0; i < 4; i++) { // the anglerfish lamps, small, their beams sweeping the sky
    const lx = [T.l + 40, T.l + 150, T.r - 150, T.r - 40][i]!, ly = T.top + 22;
    const sw = Math.sin(t * 0.8 + i * 1.9) * 0.5, a = -Math.PI / 2 + (i < 2 ? -0.5 : 0.5) + sw;
    const bg = g.createLinearGradient(lx, ly, lx + Math.cos(a) * 700, ly + Math.sin(a) * 700);
    bg.addColorStop(0, rgbaHex('#fff3c8', 0.11 * (o.beams ?? 1))); bg.addColorStop(1, 'rgba(255,243,200,0)');
    g.fillStyle = bg; g.beginPath(); g.moveTo(lx, ly);
    g.lineTo(lx + Math.cos(a - 0.06) * 700, ly + Math.sin(a - 0.06) * 700); g.lineTo(lx + Math.cos(a + 0.06) * 700, ly + Math.sin(a + 0.06) * 700); g.closePath(); g.fill();
    c.save(); c.translate(lx, ly); c.scale(0.32, 0.32);
    c.fillStyle = '#1b1222'; c.beginPath(); c.ellipse(0, 0, 44, 28, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(38, 0); c.lineTo(64, -16); c.lineTo(64, 16); c.closePath(); c.fill();
    c.fillStyle = '#e8e0f0'; c.beginPath(); c.arc(-24, -6, 6, 0, TAU); c.fill();
    c.fillStyle = '#fff3c8'; c.beginPath(); c.arc(-52, -28, 10, 0, TAU); c.fill();
    c.restore();
    g.fillStyle = rgbaHex('#fff3c8', 0.6); g.beginPath(); g.arc(lx - 17, ly - 9, 9, 0, TAU); g.fill();
  }
  // the sign, hanging from the truss
  c.strokeStyle = '#2a2030'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(FW.sign.x - 140, T.top); c.lineTo(FW.sign.x - 140, FW.sign.y - 18); c.moveTo(FW.sign.x + 140, T.top); c.lineTo(FW.sign.x + 140, FW.sign.y - 18); c.stroke();
  // (laid out at full size and scaled down, so its bulbs keep the letters' shapes: at a small size the S read as an 8)
  for (const k2 of [c, g]) { k2.save(); k2.translate(FW.sign.x, FW.sign.y); k2.scale(FW.sign.k, FW.sign.k); }
  signBoard(c, g, 0, 0, t, 1, 1);
  c.restore(); g.restore();
  // the ring of bulbs (the studio's, at this distance)
  const Rg = FW.ring, k = Rg.r / 292;
  c.save(); g.save(); c.translate(Rg.x, Rg.y); g.translate(Rg.x, Rg.y); c.scale(k, k); g.scale(k, k);
  if (o.burst && (o.ring ?? 1) > 0) {
    c.save(); c.beginPath(); c.arc(0, 0, 282, 0, TAU); c.clip();
    c.globalAlpha = o.ring ?? 1;
    for (let i = 0; i < 18; i++) {
      const a0 = (i / 18) * TAU + t * 0.15;
      c.fillStyle = i % 2 ? o.burst[0] : o.burst[1];
      c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 292, a0, a0 + TAU / 18); c.closePath(); c.fill();
    }
    c.restore();
  }
  bulbRing(c, g, 0, 0, 292, t, o.ring ?? 1, HEX.gold);
  c.restore(); g.restore();
  // the board and the meter on their stands
  if (o.props !== false && o.board !== null) board(c, g, t, o.board);
  if (o.props !== false) meter(c, g, t, o.meter ?? 0.2, o.broke);
  // the stage floor: planks in perspective, the lip with its footlights
  c.fillStyle = '#4a3036';
  c.beginPath(); c.moveTo(L + 30, F - 16); c.lineTo(R - 30, F - 16); c.lineTo(R, F + 4); c.lineTo(L, F + 4); c.closePath(); c.fill();
  c.strokeStyle = '#33202a'; c.lineWidth = 1.5;
  for (let i = 1; i < 3; i++) { const y = F - 16 + i * 7; c.beginPath(); c.moveTo(L + 30 - i * 10, y); c.lineTo(R - 30 + i * 10, y); c.stroke(); }
  // Rai and whoever stands on it
  o.onStage?.();
  if (o.crew !== false) {
    crabCam(c, g, L + 120, F + 2, 0.28, t, { tally: true, flip: true });
    octopus(c, g, FW.octo.x, FW.octo.y, FW.octo.s, t, { card: o.card ?? null, cardT0: o.cardT0 });
  }
  c.fillStyle = '#1c1218'; c.fillRect(L - 4, F + 4, R - L + 8, 18);
  for (let i = 0; i < 18; i++) {
    const fx = L + 16 + i * ((R - L - 32) / 17), on = 0.7 + 0.3 * Math.sin(t * 6 + i);
    c.fillStyle = mixHex('#5a4630', HEX.gold, on); c.beginPath(); c.arc(fx, F + 13, 4, 0, TAU); c.fill();
    g.fillStyle = rgbaHex(HEX.gold, 0.4 * on); g.beginPath(); g.arc(fx, F + 13, 9, 0, TAU); g.fill();
  }
  // the wreck's hull under the stage, down into the water, its portholes lit
  c.fillStyle = '#2a1820';
  c.beginPath(); c.moveTo(L - 10, F + 22); c.lineTo(R + 10, F + 22); c.quadraticCurveTo(R + 4, FW.water + 20, R - 60, FW.water + 40); c.lineTo(L + 60, FW.water + 40); c.quadraticCurveTo(L - 4, FW.water + 20, L - 10, F + 22); c.closePath(); c.fill();
  c.strokeStyle = '#1a0f16'; c.lineWidth = 2;
  for (let i = 1; i < 6; i++) { const y = F + 22 + i * 22; c.beginPath(); c.moveTo(L, y); c.lineTo(R, y); c.stroke(); }
  for (let i = 0; i < 5; i++) {
    const px = L + 110 + i * ((R - L - 220) / 4), py = F + 66;
    c.fillStyle = '#b98a3e'; c.beginPath(); c.arc(px, py, 13, 0, TAU); c.fill();
    c.fillStyle = '#ffcf6b'; c.beginPath(); c.arc(px, py, 9, 0, TAU); c.fill();
    g.fillStyle = rgbaHex('#ffcf6b', 0.22); g.beginPath(); g.arc(px, py, 14, 0, TAU); g.fill();
  }
  // water sheeting off it as it breaches, then dripping
  if (wet < 2.2) {
    const a = Math.pow(1 - wet / 2.2, 1.5);
    c.save(); c.globalAlpha = a;
    for (let i = 0; i < 70; i++) {
      const x = L - 10 + h01(i, 41) * (R - L + 20), y0 = F + 4, y1 = FW.water + 30 - dy, len = y1 - y0;
      if (len <= 0) continue;
      const ph = (t * 3.2 + h01(i, 42)) % 1;
      c.strokeStyle = h01(i, 43) < 0.5 ? 'rgba(220,240,255,0.75)' : 'rgba(150,200,255,0.55)'; c.lineWidth = 2 + 4 * h01(i, 44);
      c.beginPath(); c.moveTo(x, y0 + len * ph * 0.3); c.lineTo(x + 2, y0 + len * (0.3 + ph * 0.7)); c.stroke();
    }
    // from the ring and the sign, thin falls
    for (let i = 0; i < 18; i++) {
      const x = FW.ring.x + (h01(i, 45) - 0.5) * 2 * FW.ring.r, y0 = FW.ring.y + Math.sqrt(Math.max(0, FW.ring.r ** 2 - (x - FW.ring.x) ** 2)), ph = (t * 4 + h01(i, 46)) % 1;
      c.strokeStyle = 'rgba(210,235,255,0.6)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x, y0 + ph * 40); c.lineTo(x, y0 + 30 + ph * 70); c.stroke();
    }
    c.restore();
  }
  // drips from the lip, for a long while after
  c.fillStyle = 'rgba(200,230,255,0.75)';
  for (let i = 0; i < 14; i++) {
    const ph = (t * (0.7 + 0.5 * h01(i, 51)) + h01(i, 52)) % 1, x = L + h01(i, 53) * (R - L);
    c.beginPath(); c.ellipse(x, F + 24 + ph * (FW.water - F - 10), 2, 4, 0, 0, TAU); c.fill();
  }
  c.restore(); g.restore();
  // the waterline across the hull: ripples and foam (not lifted with the stage)
  c.fillStyle = 'rgba(20,26,70,0.85)';
  c.beginPath(); c.moveTo(L - 80, FW.water);
  for (let x = L - 80; x <= R + 80; x += 20) c.lineTo(x, FW.water + 3 * Math.sin(x * 0.05 + t * 3));
  c.lineTo(R + 80, FW.beach + 2); c.lineTo(L - 80, FW.beach + 2); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(230,245,255,0.7)'; c.lineWidth = 2.5;
  c.beginPath();
  for (let x = L - 60; x <= R + 60; x += 16) { const y = FW.water + 3 * Math.sin(x * 0.05 + t * 3); x === L - 60 ? c.moveTo(x, y) : c.lineTo(x, y); }
  c.stroke();
  // the bulbs' light on the water
  for (let k2 = 0; k2 < 5; k2++) {
    const y = FW.water + 8 + k2 * 6, w = 260 - 30 * k2 + 20 * Math.sin(t * 4 + k2);
    g.fillStyle = rgbaHex(HEX.gold, 0.22 - 0.03 * k2); g.fillRect(FW.ring.x - w / 2, y, w, 2.5);
  }
  if (wet > -0.1 && wet < 1.4) { // the breach's spray, thrown up and out from the waterline
    const a = Math.max(0, wet + 0.1), fade = 1 - a / 1.5;
    c.fillStyle = `rgba(235,248,255,${0.85 * fade})`; c.beginPath();
    for (let i = 0; i < 110; i++) {
      const x0 = L - 40 + h01(i, 61) * (R - L + 80), vx = (x0 - (L + R) / 2) * 0.9 + (h01(i, 62) - 0.5) * 300, vy = -(260 + 620 * h01(i, 63));
      const x = x0 + vx * a, y = FW.water + vy * a + 900 * a * a, r = 2 + 6 * h01(i, 64) * fade;
      if (y > FW.water + 4) continue;
      c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU);
    }
    c.fill();
    c.strokeStyle = `rgba(235,248,255,${0.7 * fade})`; c.lineWidth = 6 * fade;
    c.beginPath(); c.ellipse((L + R) / 2, FW.water + 6, (R - L) * (0.55 + 0.5 * a), 22 + 30 * a, 0, 0, TAU); c.stroke();
  }
  if (dy > 0) { // what is still under the water glows up through it
    const gl = c.createRadialGradient(FW.ring.x, FW.water + 4, 10, FW.ring.x, FW.water + 4, 380);
    gl.addColorStop(0, rgbaHex(HEX.gold, 0.7 * clamp(dy / 200))); gl.addColorStop(1, 'rgba(246,196,83,0)');
    c.save(); c.globalCompositeOperation = 'lighter';
    c.fillStyle = gl; c.beginPath(); c.ellipse(FW.ring.x, FW.water + 4, 380, 50, 0, 0, TAU); c.fill();
    c.fillStyle = gl; c.beginPath(); c.ellipse(FW.ring.x, FW.water + 4, 220, 26, 0, 0, TAU); c.fill();
    c.restore();
  }
}

// ------------------------------------------------------------------ the rebuilt board

const BOARD_ROWS = ['NIGHTS', 'MEALS', 'CARE'];
const HI = 10; // the dots are laid out 10x large and drawn scaled down, so the letters keep their shape
function starDots(): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i / 10) * TAU, r = i % 2 ? 0.42 : 1;
    const a2 = -Math.PI / 2 + ((i + 1) / 10) * TAU, r2 = (i + 1) % 2 ? 0.42 : 1;
    for (let k = 0; k < 3; k++) { const u = k / 3; pts.push([((1 - u) * Math.cos(a) * r + u * Math.cos(a2) * r2) * 70, ((1 - u) * Math.sin(a) * r + u * Math.sin(a2) * r2) * 70]); }
  }
  pts.push([0, 0]);
  return pts;
}
const STAR = starDots();

function fastDots(c: C2, pts: [number, number][], x: number, y: number, s: number, r: number, col: string, from = 0, to = pts.length) {
  c.fillStyle = col; c.beginPath();
  for (let i = from; i < to; i++) { const [px, py] = pts[i]!; c.moveTo(x + px * s + r, y + py * s); c.arc(x + px * s, y + py * s, r, 0, TAU); }
  c.fill();
}

/** The scoreboard rebuilt in bulbs: the smashed frame lashed with rope, HER SCORE, and three rows that glow pink. */
export function board(c: C2, g: C2, t: number, o: StageOpts['board']) {
  const { x, y, w, h } = FW.board, F = FW.floor;
  c.save();
  // legs
  c.fillStyle = '#20172a'; c.fillRect(x + 16, y + h, 8, F - y - h); c.fillRect(x + w - 24, y + h, 8, F - y - h);
  // the old frame, its broken corner lashed back on with rope
  c.fillStyle = '#0c0a12'; c.beginPath(); c.roundRect(x - 4, y - 4, w + 8, h + 8, 4); c.fill();
  c.strokeStyle = '#6a5a3a'; c.lineWidth = 2; c.stroke();
  c.strokeStyle = 'rgba(210,220,240,0.22)'; c.lineWidth = 0.8;
  c.beginPath(); c.moveTo(x + w * 0.55, y + h * 0.2); c.lineTo(x + w * 0.62, y + h * 0.5); c.lineTo(x + w * 0.5, y + h * 0.8); c.moveTo(x + w * 0.62, y + h * 0.5); c.lineTo(x + w * 0.85, y + h * 0.58); c.stroke();
  c.strokeStyle = '#c9a26a'; c.lineWidth = 1.6;
  for (const [cx, cy] of [[x + w - 6, y + 4], [x + w - 6, y + 20], [x + 6, y + h - 6]] as const) {
    for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(cx - 6, cy - 5 + k * 3); c.lineTo(cx + 6, cy - 1 + k * 3); c.stroke(); }
  }
  // gold bulbs round the frame, chasing
  const n = 30;
  for (let i = 0; i < n; i++) {
    const u = i / n, per = 2 * (w + h), d = u * per;
    const bx = d < w ? x + d : d < w + h ? x + w : d < 2 * w + h ? x + w - (d - w - h) : x;
    const by = d < w ? y : d < w + h ? y + (d - w) : d < 2 * w + h ? y + h : y + h - (d - 2 * w - h);
    const on = 0.5 + 0.5 * Math.sin(t * 9 - i * 0.8);
    c.fillStyle = mixHex('#5a4630', HEX.gold, on); c.beginPath(); c.arc(bx, by, 2.4, 0, TAU); c.fill();
    if (on > 0.5) { g.fillStyle = rgbaHex(HEX.gold, 0.45 * on); g.beginPath(); g.arc(bx, by, 5, 0, TAU); g.fill(); }
  }
  // the rows: dots laid out large, drawn small
  const s = 1 / HI, head = o?.head ?? 0, rows = o?.rows ?? [0, 0, 0];
  const hp = textDots('HER SCORE', FAM.monoB(), 13 * HI, 1.5 * HI);
  fastDots(c, hp, x + w / 2, y + 16, s, 0.55, mixHex('#2a2030', HEX.gold, head));
  if (head > 0.5) fastDots(g, hp, x + w / 2, y + 16, s, 1.2, rgbaHex(HEX.gold, 0.35 * head));
  BOARD_ROWS.forEach((txt, i) => {
    const ry = y + 42 + i * 27, lit = clamp(rows[i]!);
    const pts = textDots(txt, FAM.monoB(), 17 * HI, 1.7 * HI);
    const tx = x + 52;
    fastDots(c, pts, tx, ry, s, 0.62, '#2a2030');
    fastDots(c, STAR, x + w - 22, ry, 0.13, 0.62, '#2a2030');
    if (lit > 0) {
      const m = Math.floor(pts.length * clamp(lit * 1.6)), pulse = 0.8 + 0.2 * Math.sin(t * 4 + i);
      const col = mixHex('#ff9cc8', HEX.pink, 0.4);
      // the row lights left to right; the dots are sorted by x so the wipe reads
      const order = sortedByX(txt, pts);
      c.fillStyle = col; c.beginPath(); g.fillStyle = rgbaHex(HEX.pink, 0.45 * pulse); g.beginPath();
      for (let j = 0; j < m; j++) { const [px, py] = order[j]!; const X = tx + px * s, Y = ry + py * s; c.moveTo(X + 0.62, Y); c.arc(X, Y, 0.62, 0, TAU); g.moveTo(X + 1.6, Y); g.arc(X, Y, 1.6, 0, TAU); }
      c.fill(); g.fill();
      if (lit > 0.6) {
        const sl = clamp((lit - 0.6) / 0.4);
        fastDots(c, STAR, x + w - 22, ry, 0.13 * (0.9 + 0.2 * sl), 0.7, HEX.pink);
        fastDots(g, STAR, x + w - 22, ry, 0.13 * (0.9 + 0.2 * sl), 1.8, rgbaHex(HEX.pink, 0.5 * pulse * sl));
        g.fillStyle = rgbaHex(HEX.pink, 0.25 * sl * pulse); g.beginPath(); g.arc(x + w - 22, ry, 14, 0, TAU); g.fill();
      }
    }
  });
  c.restore();
}
const SORTED = new Map<string, [number, number][]>();
function sortedByX(key: string, pts: [number, number][]) {
  let s = SORTED.get(key);
  if (!s) { s = [...pts].sort((a, b) => a[0] - b[0]); SORTED.set(key, s); }
  return s;
}

// ------------------------------------------------------------------ the applause meter

const METER_A0 = Math.PI * 1.15, METER_A1 = Math.PI * 1.85;
/** The applause meter on its stand (stage right): a brass dial, words not numbers, a red needle; broken after `broke`. */
export function meter(c: C2, g: C2, t: number, v: number, broke?: number) {
  const { x, y, r } = FW.meter, F = FW.floor;
  c.save();
  c.fillStyle = '#20172a'; c.fillRect(x - 4, y + 14, 8, F - y - 14);
  c.fillStyle = '#7a5a2e'; c.beginPath(); c.roundRect(x - r - 8, y - r - 8, 2 * r + 16, r + 26, 10); c.fill();
  c.fillStyle = '#f4efe1'; c.beginPath(); c.arc(x, y + 8, r, Math.PI, 0); c.closePath(); c.fill();
  c.lineWidth = 6; c.strokeStyle = 'rgba(224,48,42,0.85)'; c.beginPath(); c.arc(x, y + 8, r * 0.8, METER_A0 + (METER_A1 - METER_A0) * 0.8, METER_A1); c.stroke();
  c.lineWidth = 1.2; c.strokeStyle = '#3d2716';
  for (let k = 0; k <= 8; k++) { const a = METER_A0 + (METER_A1 - METER_A0) * k / 8; c.beginPath(); c.moveTo(x + Math.cos(a) * r * 0.86, y + 8 + Math.sin(a) * r * 0.86); c.lineTo(x + Math.cos(a) * r * 0.96, y + 8 + Math.sin(a) * r * 0.96); c.stroke(); }
  const isBroken = broke !== undefined && t >= broke;
  const a = METER_A0 + (METER_A1 - METER_A0) * (isBroken ? 1.12 : clamp(v, 0, 1.1));
  c.strokeStyle = '#c0302a'; c.lineWidth = 2.5; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, y + 8); c.lineTo(x + Math.cos(a) * r * (isBroken ? 1.18 : 0.9), y + 8 + Math.sin(a) * r * (isBroken ? 1.18 : 0.9)); c.stroke();
  c.fillStyle = '#3d2716'; c.beginPath(); c.arc(x, y + 8, 4, 0, TAU); c.fill();
  if (isBroken) { // the glass cracked, a spring out of the top
    c.strokeStyle = 'rgba(40,30,30,0.5)'; c.lineWidth = 1;
    const ix = x + Math.cos(METER_A1) * r, iy = y + 8 + Math.sin(METER_A1) * r;
    c.beginPath(); for (let k = 0; k < 6; k++) { const aa = Math.PI * 0.6 + k * 0.32; c.moveTo(ix, iy); c.lineTo(ix + Math.cos(aa) * r * 0.6, iy + Math.sin(aa) * r * 0.6); } c.stroke();
    c.strokeStyle = '#c0c4cc'; c.lineWidth = 1.6;
    c.beginPath(); for (let k = 0; k <= 24; k++) { const u = k / 24; c.lineTo(ix + 10 * u + 4 * Math.cos(u * 20), iy - 8 - 26 * u + 4 * Math.sin(u * 20) + 3 * Math.sin(t * 9) * u); } c.stroke();
  }
  c.font = font(FAM.hook(), 9); c.fillStyle = '#3d2716'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('APPLAUSE', x, y + 2);
  c.restore();
  g.fillStyle = rgbaHex('#fff3c8', 0.1); g.beginPath(); g.arc(x, y + 8, r, Math.PI, 0); g.fill();
}

/** The meter in close-up, full frame: brass, glass, words for a scale; at `broke` the needle smashes past the top. */
export function meterECU(c: C2, g: C2, t: number, v: number, broke: number) {
  // the night behind it, out of focus: lantern and firework bokeh
  const bg = c.createRadialGradient(W / 2, H * 0.4, 100, W / 2, H * 0.5, W * 0.7);
  bg.addColorStop(0, '#2a1a40'); bg.addColorStop(1, '#0a0716');
  c.fillStyle = bg; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 26; i++) {
    const x = h01(i, 61) * W, y = h01(i, 62) * H, r = 30 + 70 * h01(i, 63), col = FIRE_COLS[i % FIRE_COLS.length]!;
    g.fillStyle = rgbaHex(col, 0.05 + 0.04 * Math.sin(t * 3 + i)); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
  const x = W / 2, y = 760, r = 560, br = t >= broke, age = t - broke;
  c.save();
  // the case
  c.fillStyle = '#5a3c20'; c.beginPath(); c.roundRect(x - r - 60, y - r - 50, 2 * r + 120, r + 150, 40); c.fill();
  c.strokeStyle = '#b98a3e'; c.lineWidth = 14; c.stroke();
  for (let k = 0; k < 8; k++) { const px = x - r - 30 + k * ((2 * r + 60) / 7); c.fillStyle = '#e8c27a'; c.beginPath(); c.arc(px, y - r - 26, 7, 0, TAU); c.fill(); }
  // the face
  c.fillStyle = '#f4efe1'; c.beginPath(); c.arc(x, y, r, Math.PI, 0); c.closePath(); c.fill();
  c.lineWidth = 46; c.strokeStyle = 'rgba(224,48,42,0.85)'; c.beginPath(); c.arc(x, y, r * 0.8, METER_A0 + (METER_A1 - METER_A0) * 0.8, METER_A1); c.stroke();
  c.strokeStyle = '#3d2716';
  for (let k = 0; k <= 16; k++) {
    const a = METER_A0 + (METER_A1 - METER_A0) * k / 16, l = k % 4 === 0 ? 0.82 : 0.88;
    c.lineWidth = k % 4 === 0 ? 7 : 3;
    c.beginPath(); c.moveTo(x + Math.cos(a) * r * l, y + Math.sin(a) * r * l); c.lineTo(x + Math.cos(a) * r * 0.96, y + Math.sin(a) * r * 0.96); c.stroke();
  }
  c.font = font(FAM.monoB(), 34); c.fillStyle = '#3d2716'; c.textAlign = 'center'; c.textBaseline = 'middle';
  (['polite', 'warm', 'LOUD'] as const).forEach((wd, k) => { const a = METER_A0 + (METER_A1 - METER_A0) * (0.12 + k * 0.33); c.save(); c.translate(x + Math.cos(a) * r * 0.66, y + Math.sin(a) * r * 0.66); c.rotate(a + Math.PI / 2); c.fillText(wd, 0, 0); c.restore(); });
  c.font = font(FAM.hook(), 64); c.fillText('APPLAUSE', x, y - 120);
  // the needle: up the scale, then through the top
  const vv = br ? 1.12 : clamp(v, 0, 1.06), a = METER_A0 + (METER_A1 - METER_A0) * vv;
  c.strokeStyle = '#c0302a'; c.lineCap = 'round'; c.lineWidth = 16;
  const L = br ? r * 0.98 : r * 0.9;
  c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); c.stroke();
  c.fillStyle = '#b98a3e'; c.beginPath(); c.arc(x, y, 40, 0, TAU); c.fill();
  c.fillStyle = '#7a5a2e'; c.beginPath(); c.arc(x, y, 18, 0, TAU); c.fill();
  // the glass over the face
  c.fillStyle = 'rgba(255,255,255,0.08)'; c.beginPath(); c.ellipse(x - r * 0.35, y - r * 0.6, r * 0.32, r * 0.12, -0.4, 0, TAU); c.fill();
  if (br) {
    const ix = x + Math.cos(METER_A1 + 0.05) * r, iy = y + Math.sin(METER_A1 + 0.05) * r;
    // cracks from the impact
    c.strokeStyle = 'rgba(30,24,36,0.65)'; c.lineWidth = 3;
    c.beginPath();
    for (let k = 0; k < 9; k++) {
      let px = ix, py = iy; c.moveTo(px, py);
      const aa = Math.PI * 0.55 + k * 0.17;
      for (let j = 0; j < 4; j++) { px += Math.cos(aa + (h01(k, j, 3) - 0.5) * 0.6) * 70; py += Math.sin(aa + (h01(k, j, 4) - 0.5) * 0.6) * 70; c.lineTo(px, py); }
    }
    c.stroke();
    // the tip of the needle flying off, spinning
    const fx = ix + 420 * age, fy = iy - 380 * age + 900 * age * age;
    c.save(); c.translate(fx, fy); c.rotate(age * 14); c.strokeStyle = '#c0302a'; c.lineWidth = 16; c.beginPath(); c.moveTo(-60, 0); c.lineTo(60, 0); c.stroke(); c.restore();
    // a spring boinging out of the top
    const sp = ease.outElastic(clamp(age / 0.6));
    c.strokeStyle = '#c0c4cc'; c.lineWidth = 7;
    c.beginPath(); for (let k = 0; k <= 40; k++) { const u = k / 40; c.lineTo(ix - 30 + 40 * Math.cos(u * 28), iy - 20 - 230 * sp * u + 14 * Math.sin(u * 28)); } c.stroke();
    // sparks
    if (age < 0.5) for (let i = 0; i < 14; i++) {
      const aa = -Math.PI * 0.9 + i * 0.16, d = 60 + 420 * ease.outCubic(age / 0.5) * (0.5 + 0.5 * h01(i, 7));
      star4(c, ix + Math.cos(aa) * d, iy + Math.sin(aa) * d + 300 * age * age, 22 * (1 - age / 0.5), HEX.yellow);
    }
  }
  c.restore();
}

// ------------------------------------------------------------------ the crowd

export interface Folk { x: number; feet: number; h: number; seed: number; lantern: boolean; who?: Who; col: string }

/** The island's crowd from behind (backs to us), facing the stage: rows, nearer rows bigger; heads near the horizon. */
export function crowdLayout(): Folk[] {
  const rows: [number, number, number][] = [[60, 786, 30], [95, 818, 21], [150, 872, 13], [240, 962, 8], [380, 1112, 5]];
  const out: Folk[] = [];
  rows.forEach(([h, feet, n], ri) => {
    for (let i = 0; i < n; i++) {
      let x = (i + 0.5) * (W / n) + (h01(ri, i, 3) - 0.5) * (W / n) * 0.6;
      if (ri >= 3 && Math.abs(x - W / 2) < 150 + 60 * (ri - 3)) x += (x < W / 2 ? -1 : 1) * (200 + 60 * (ri - 3));   // a gap down the middle for the view
      out.push({ x, feet: feet + 8 * h01(ri, i, 4), h: h * (0.9 + 0.2 * h01(ri, i, 5)), seed: ri * 40 + i, lantern: h01(ri, i, 6) < 0.6, col: mixHex('#08060f', '#1a1430', ri / 5) });
    }
  });
  return out.sort((a, b) => a.feet - b.feet);
}

/** A paper lantern at (x, y), size s, glowing. */
export function lantern(c: C2, g: C2, x: number, y: number, s: number, t: number, seed: number, glow = 1) {
  const col = [HEX.orange, HEX.gold, '#ff9a5a', HEX.pink][seed % 4]!, sw = 0.12 * Math.sin(t * 2.2 + seed);
  c.save(); c.translate(x, y); c.rotate(sw);
  c.fillStyle = mixHex(col, '#fff3c8', 0.3); c.beginPath(); c.ellipse(0, s * 0.9, s * 0.62, s * 0.8, 0, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(120,60,20,0.6)'; c.lineWidth = Math.max(1, s * 0.08);
  for (const k of [-0.3, 0, 0.3]) { c.beginPath(); c.moveTo(k * s, s * 0.15); c.quadraticCurveTo(k * s * 1.6, s * 0.9, k * s, s * 1.65); c.stroke(); }
  c.fillStyle = '#3a2418'; c.fillRect(-s * 0.3, s * 0.05, s * 0.6, s * 0.16); c.fillRect(-s * 0.3, s * 1.62, s * 0.6, s * 0.14);
  c.restore();
  g.fillStyle = rgbaHex(col, 0.22 * glow); g.beginPath(); g.arc(x, y + s * 0.9, s * 1.7, 0, TAU); g.fill();
  g.fillStyle = rgbaHex('#fff3c8', 0.3 * glow); g.beginPath(); g.arc(x, y + s * 0.9, s * 0.5, 0, TAU); g.fill();
}

/**
 * The crowd from behind. `raise` 0..1 lifts every lantern together (AGREE), `cheer` puts arms up, `gasp` hands to
 * faces; `light` and `lightCol` rim them with the fireworks' light.
 */
export function crowdBack(c: C2, g: C2, t: number, folk: Folk[], o: { raise?: number; cheer?: number; gasp?: number; light?: number; lightCol?: string; emote?: Emote; emoteT0?: number } = {}) {
  const raise = clamp(o.raise ?? 0), rim = o.light && o.light > 0.15 ? mixHex(o.lightCol ?? HEX.gold, '#ffffff', 0.3) : undefined;
  for (const f of folk) {
    const pose: Pose = (o.gasp ?? 0) > 0.5 && h01(f.seed, 1) < 0.6 ? 'face' : raise > 0.5 || ((o.cheer ?? 0) > 0.5 && h01(f.seed, 2) < 0.7) ? 'cheer' : 'stand';
    const bob = pose === 'cheer' ? Math.abs(Math.sin(t * 7 + f.seed)) * f.h * 0.03 : 0;
    person(c, f.x, f.feet - bob, f.h, pose, { col: f.col, t, seed: f.seed, rim, emote: o.emote && h01(f.seed, 9) < 0.35 ? o.emote : undefined, emoteT0: (o.emoteT0 ?? 0) + 0.2 * h01(f.seed, 8) });
    if (f.lantern && (f.h < 200 || h01(f.seed, 11) < 0.3)) {
      const u = f.h / 100, hand = pose === 'cheer' ? f.feet - bob - 108 * u : f.feet - 46 * u;
      const lx = f.x + (pose === 'cheer' ? 22 * u : 12 * u), up = raise * 26 * u * (0.9 + 0.2 * h01(f.seed, 4));
      c.strokeStyle = f.col; c.lineWidth = 1.2 * u;
      c.beginPath(); c.moveTo(lx, hand); c.lineTo(lx, hand - 22 * u - up); c.stroke();
      lantern(c, g, lx, hand - 22 * u - up, 5.5 * u, t, f.seed, 0.8 + 0.5 * raise);
    }
  }
}

// ------------------------------------------------------------------ the reverse shot: the beach from the stage

export interface BeachFolk { x: number; feet: number; h: number; seed: number; who?: Who; pose?: Pose; lantern: boolean; flip?: boolean }
export function beachLayout(): BeachFolk[] {
  const out: BeachFolk[] = [];
  const rows: [number, number, number][] = [[105, 600, 15], [175, 700, 11]];
  rows.forEach(([h, feet, n], ri) => {
    for (let i = 0; i < n; i++) out.push({ x: (i + 0.5) * (W / n) + (h01(ri, i, 13) - 0.5) * 60, feet: feet + 10 * h01(ri, i, 14), h: h * (0.9 + 0.2 * h01(ri, i, 15)), seed: 200 + ri * 30 + i, lantern: h01(ri, i, 16) < 0.6 });
  });
  // the front row: islanders and, among them, the cast
  const front: [number, Who | undefined, Pose?][] = [[120, 'panel1'], [300, undefined], [470, 'strangerB'], [640, 'trader', 'point'], [800, 'husband'], [880, 'housekeeper'], [1110, 'woman', 'hold'], [1330, 'strangerA'], [1500, undefined], [1650, 'panel2'], [1810, 'panel3']];
  front.forEach(([x, who, pose], i) => out.push({ x, feet: 900 + 10 * h01(i, 21), h: who === 'woman' ? 300 : 290 + 20 * h01(i, 22), seed: 300 + i, who, pose, lantern: !who && h01(i, 23) < 0.8, flip: who === 'trader' ? false : x > W / 2 }));
  return out;
}

/** The far side: the island at night behind the crowd (hills, palms, huts, the stone bank with lit hearts), the sand. */
export function beachBackdrop(c: C2, g: C2, t: number, flash: number, flashCol: string) {
  const sky = c.createLinearGradient(0, 0, 0, 470);
  sky.addColorStop(0, '#0b0f2e'); sky.addColorStop(1, mixHex('#2b2f6a', flashCol, 0.25 * flash));
  c.fillStyle = sky; c.fillRect(0, 0, W, 480);
  for (let i = 0; i < 70; i++) { c.fillStyle = `rgba(255,255,255,${0.3 + 0.5 * h01(i, 5, 9)})`; c.beginPath(); c.arc(h01(i, 6, 9) * W, h01(i, 7, 9) * 300, 0.8 + 1.2 * h01(i, 8, 9), 0, TAU); c.fill(); }
  c.fillStyle = '#0e1230';
  c.beginPath(); c.moveTo(0, 480); c.lineTo(0, 400);
  for (let x = 0; x <= W; x += 30) c.lineTo(x, 330 + 70 * Math.cos((x / W) * TAU * 1.3 + 0.6) + 20 * Math.sin(x * 0.01));
  c.lineTo(W, 480); c.closePath(); c.fill();
  for (let i = 0; i < 14; i++) { const x = h01(i, 31) * W, y = 360 + 70 * h01(i, 32); g.fillStyle = rgbaHex('#ffcf6b', 0.55); g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill(); }
  // the sand
  const sg = c.createLinearGradient(0, 470, 0, 920);
  sg.addColorStop(0, '#3a3858'); sg.addColorStop(1, '#6a6488');
  c.fillStyle = sg; c.fillRect(0, 470, W, 460);
  palmTree(c, 150, 520, 360, 0.08, t, 4, 0.65);
  palmTree(c, 1780, 520, 380, -0.08, t, 5, 0.65);
  palmTree(c, 560, 500, 300, -0.05, t, 6, 0.7);
  hut(c, 330, 515, 130, true, 0.55);
  hut(c, 1560, 512, 120, true, 0.55);
  const bx = 1250, by = 520, k = 0.5;
  stoneBank(c, bx, by, k, 0.5, 9);
  [70, 110, 55, 90, 45].forEach((r, i) => {
    const sx = bx - 160 * k + i * 80 * k, sy = by - 26 * k - r * k * 0.95 + r * k * 0.05;
    g.fillStyle = rgbaHex(HEX.pink, 0.25 + 0.1 * Math.sin(t * 1.6 + i)); g.beginPath(); g.arc(sx, sy, r * k * 0.28, 0, TAU); g.fill();
    heart(c, sx, sy + r * k * 0.06, r * k * 0.17, rgbaHex(HEX.pink, 0.95));
  });
  // a lantern string across
  c.strokeStyle = 'rgba(30,20,30,0.9)'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(150, 260); c.quadraticCurveTo(W / 2, 400, 1780, 250); c.stroke();
  for (let i = 1; i < 16; i++) {
    const u = i / 16, x = (1 - u) * (1 - u) * 150 + 2 * (1 - u) * u * (W / 2) + u * u * 1780, y = (1 - u) * (1 - u) * 260 + 2 * (1 - u) * u * 400 + u * u * 250 + 8;
    const col = [HEX.orange, HEX.gold, HEX.pink][i % 3]!;
    c.fillStyle = col; c.beginPath(); c.ellipse(x, y, 7, 9, 0, 0, TAU); c.fill();
    g.fillStyle = rgbaHex(col, 0.45); g.beginPath(); g.arc(x, y, 18, 0, TAU); g.fill();
  }
}

/** The beach's shallow water in the foreground (the stage's side), the lanterns' light on it. */
export function beachWater(c: C2, g: C2, t: number) {
  const wg = c.createLinearGradient(0, 905, 0, H);
  wg.addColorStop(0, '#1a2050'); wg.addColorStop(1, '#0b0f2e');
  c.fillStyle = wg;
  c.beginPath(); c.moveTo(0, H);
  for (let x = 0; x <= W; x += 30) c.lineTo(x, 915 + 6 * Math.sin(x * 0.01 + t * 1.5));
  c.lineTo(W, H); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(230,245,255,0.6)'; c.lineWidth = 2.5;
  c.beginPath(); for (let x = 0; x <= W; x += 20) { const y = 915 + 6 * Math.sin(x * 0.01 + t * 1.5); x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
  for (let i = 0; i < 18; i++) {
    const x = h01(i, 71) * W, w = 30 + 50 * h01(i, 72);
    for (let k = 0; k < 5; k++) { g.fillStyle = rgbaHex(HEX.gold, 0.18 - k * 0.03); g.fillRect(x - w / 2 + 5 * Math.sin(t * 3 + k + i), 935 + k * 22, w, 3); }
  }
}

/** A speech bubble with one small word and a heart, popping in at t0, its tail to (tx, ty). */
export function bubble(c: C2, x: number, y: number, word: string, tx: number, ty: number, t: number, t0: number, g?: C2) {
  const p = popIn(t, t0, 0.22);
  if (p <= 0) return;
  c.save();
  c.translate(x, y); c.scale(p, p);
  c.font = font(FAM.hook(), 54);
  const w = c.measureText(word).width + 60, h = 94;
  c.fillStyle = '#f4f1ea'; c.strokeStyle = HEX.ink; c.lineWidth = 5;
  c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, 30); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-12, h / 2 - 3); c.lineTo((tx - x) * 0.4, (ty - y) * 0.6); c.lineTo(14, h / 2 - 3); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(-12, h / 2); c.lineTo((tx - x) * 0.4, (ty - y) * 0.6); c.lineTo(14, h / 2); c.stroke();
  c.fillStyle = HEX.ink; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(word, 0, 3);
  heart(c, w / 2 - 6, -h / 2 + 4, 22, HEX.pink);
  c.restore();
  if (g) { // nothing glows through it
    g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000';
    g.translate(x, y); g.scale(p, p); g.beginPath(); g.roundRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8, 32); g.fill();
    g.restore();
  }
}

/** The beach crowd facing us, lit by the fireworks behind the camera; the cast among them in the front row. */
export function beachCrowd(c: C2, g: C2, t: number, folk: BeachFolk[], o: { light: number; lightCol: string; lift?: (f: BeachFolk) => boolean; emotes?: Record<string, [Emote, number]> }) {
  const rim = mixHex(o.lightCol, '#ffffff', 0.35);
  for (const f of folk) {
    const lifting = o.lift?.(f) ?? false;
    const pose: Pose = lifting ? 'cheer' : f.pose ?? (h01(f.seed, 3) < 0.35 ? 'cheer' : 'stand');
    const col = f.who ? '#0a0812' : mixHex('#0a0812', '#1d1834', f.feet < 650 ? 0.5 : 0.2);
    const rimC = f.who ? (o.light > 0.2 ? rim : '#ffb36a') : o.light > 0.3 ? rim : undefined;
    const em = f.who ? o.emotes?.[f.who] : undefined;
    if (f.who) cast(c, f.who, f.x, f.feet, f.h, pose, { col, t, rim: rimC, flip: f.flip, emote: em?.[0], emoteT0: em?.[1] });
    else person(c, f.x, f.feet - (pose === 'cheer' ? Math.abs(Math.sin(t * 6 + f.seed)) * 4 : 0), f.h, pose, { col, t, seed: f.seed, rim: rimC, flip: f.flip });
    if (f.who === 'woman') { // her child holds the lunchbox from seat C7
      const u = f.h / 100;
      c.fillStyle = '#ff5a5f'; c.beginPath(); c.roundRect(f.x - (f.flip ? 1 : -1) * 22 * u - 6 * u, f.feet - 64 * u, 13 * u, 9 * u, 2 * u); c.fill();
      c.strokeStyle = '#8a2a2e'; c.lineWidth = 1.5 * u; c.beginPath(); c.arc(f.x - (f.flip ? 1 : -1) * 22 * u + 0.5 * u, f.feet - 64 * u, 3 * u, Math.PI, 0); c.stroke();
      c.fillStyle = HEX.yellow; c.beginPath(); c.arc(f.x - (f.flip ? 1 : -1) * 22 * u - 2.5 * u, f.feet - 60 * u, 1.6 * u, 0, TAU); c.fill();
    }
    if (f.lantern && (f.h < 200 || h01(f.seed, 11) < 0.45)) {
      const u = f.h / 100, hand = pose === 'cheer' ? f.feet - 108 * u : f.feet - 46 * u, lx = f.x + (pose === 'cheer' ? 22 * u : 12 * u);
      c.strokeStyle = col; c.lineWidth = 1.2 * u; c.beginPath(); c.moveTo(lx, hand); c.lineTo(lx, hand - 20 * u); c.stroke();
      lantern(c, g, lx, hand - 20 * u, 5.5 * u, t, f.seed);
    }
  }
}

// ------------------------------------------------------------------ props

/** Rai's tally clicker, for drawRai's `prop`: a silver counter with a ring; `press` 0..1 pushes the button. */
export function clickerProp(press: number) {
  return (c: C2, R: number) => {
    c.save(); c.rotate(-0.2);
    c.fillStyle = '#c0c4cc'; c.beginPath(); c.arc(0, -0.2 * R, 0.17 * R, 0, TAU); c.fill();
    c.strokeStyle = '#6a6f7a'; c.lineWidth = 0.025 * R; c.stroke();
    c.fillStyle = '#2a2a33'; c.fillRect(-0.09 * R, -0.25 * R, 0.18 * R, 0.08 * R);
    c.fillStyle = '#e0302a'; c.fillRect(-0.04 * R, -0.42 * R + 0.04 * R * press, 0.08 * R, 0.07 * R);
    c.strokeStyle = '#8a8f9c'; c.lineWidth = 0.03 * R; c.beginPath(); c.arc(0, -0.02 * R, 0.08 * R, 0, Math.PI); c.stroke();
    c.restore();
  };
}

/** Confetti and streamers falling (screen space), for the big moments. */
export function confetti(c: C2, t: number, t0: number, n = 60) {
  const a = t - t0;
  if (a < 0 || a > 3) return;
  for (let i = 0; i < n; i++) {
    const x = h01(i, 81) * W + 60 * Math.sin(t * 2 + i), y = -40 + (a * (260 + 220 * h01(i, 82)) + h01(i, 83) * 200) % (H + 80);
    c.save(); c.translate(x, y); c.rotate(t * 5 + i); c.scale(1, Math.sin(t * 7 + i));
    c.fillStyle = FIRE_COLS[i % FIRE_COLS.length]!; c.fillRect(-7, -4, 14, 8);
    c.restore();
  }
  void puff;
}
