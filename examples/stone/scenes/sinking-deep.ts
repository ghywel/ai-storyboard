// The deep, shared by `sinking` (the descent and the rest) and `hello` (Rai wakes where the stone came to rest).
//   - The descent's layers by world depth D (px below the surface): the surface seen from below; open water (fish
//     schools, the shark); the reef (walls of rock with coral and reeds on their ledges); the dark (specks of
//     bioluminescence); then the seabed rising into view.
//   - The rest: the cartoon seabed (_world's seabed(), with its clues: a half-buried other stone, the anchor), and
//     what the years leave on her: barnacles, a drift of sand, reeds grown up beside her, a starfish come to stay.
import { W, H } from '../engine/gl';
import { clamp, ease, smoothstep } from '../engine/util';
import { h01 } from './_rai';
import { TAU, rgbaHex, type C2 } from './_motifs';
import { coral, fishSchool, reed, seabed, shark } from './_world';
import { drawMarks } from './_manga';

/** Where the stone rests (screen px at the rest framing), and its radius: Rai's disc in `hello` sits exactly here. */
export const REST = { x: 960, y: 668, r: 150 };
/** The seabed at the rest: shared so `hello` wakes in the same place. */
export const FLOOR = 792;
export const BED_DEPTH = 0.6;
export const bedOpts = (o: { depth?: number; pan?: number } = {}) => ({ floor: FLOOR, clues: ['stone', 'anchor'] as ('stone' | 'anchor')[], depth: o.depth ?? BED_DEPTH, pan: o.pan ?? 0, seed: 1 });

// ------------------------------------------------------------------ the descent

const WATER: [number, string][] = [[0, '#63ddf4'], [450, '#34ade6'], [1000, '#1d74c6'], [1500, '#164f9f'], [1900, '#0c2c66'], [2300, '#081b45'], [2700, '#071535']];
function hexToRgb(h: string) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
/** The water's colour at world depth D. */
export function waterAt(D: number): string {
  let i = 0;
  while (i < WATER.length - 2 && D > WATER[i + 1]![0]) i++;
  const [d0, a] = WATER[i]!, [d1, b] = WATER[i + 1]!;
  const u = clamp((D - d0) / (d1 - d0)), p = hexToRgb(a), q = hexToRgb(b);
  return `rgb(${Math.round(p[0]! + (q[0]! - p[0]!) * u)},${Math.round(p[1]! + (q[1]! - p[1]!) * u)},${Math.round(p[2]! + (q[2]! - p[2]!) * u)})`;
}

/** World depth D to screen y, while the camera follows the stone (at depth ds, drawn at screen y ys). */
const scr = (D: number, ds: number, ys: number) => ys + D - ds;

/** The reef walls' inner edges at world depth D (left and right); they close in from where the reef begins. */
const REEF0 = 1150;
const reefL = (D: number) => 130 + 110 * Math.sin(D * 0.0042 + 1) + 55 * Math.sin(D * 0.013) - 260 * (1 - smoothstep(REEF0, REEF0 + 300, D));
const reefR = (D: number) => W - (140 + 100 * Math.sin(D * 0.0037 + 2) + 50 * Math.sin(D * 0.011 + 1)) + 280 * (1 - smoothstep(REEF0 + 120, REEF0 + 420, D));

/**
 * The water she falls through, behind her: its colour by depth, the god rays thinning out, the surface while it is
 * in sight (lightning flickering through it), marine snow, fish schools, the reef walls with coral and reeds, the
 * dark's specks of light (to `g`). The shark is drawn separately (it passes close).
 */
export function descent(c: C2, g: C2, t: number, ds: number, ys: number) {
  const top = ds - ys, bot = top + H;
  const gr = c.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, waterAt(top)); gr.addColorStop(1, waterAt(bot));
  c.fillStyle = gr; c.fillRect(0, 0, W, H);
  // god rays from the surface, thinning with depth
  const ra = clamp(1 - top / 1500);
  if (ra > 0) {
    c.save(); c.globalCompositeOperation = 'screen';
    for (let k = 0; k < 8; k++) {
      const x = (0.06 + 0.12 * k + 0.03 * Math.sin(t * 0.2 + k * 1.7)) * W, sp = (0.04 + 0.03 * h01(k, 3, 3)) * W;
      const a = (0.1 + 0.06 * Math.sin(t * 0.5 + k * 2.1)) * ra;
      const rg = c.createLinearGradient(0, 0, 0, H);
      rg.addColorStop(0, `rgba(220,250,255,${a})`); rg.addColorStop(1, 'rgba(220,250,255,0)');
      c.fillStyle = rg;
      c.beginPath(); c.moveTo(x - sp * 0.2, 0); c.lineTo(x + sp * 0.2, 0); c.lineTo(x + sp * 1.6 + 60, H); c.lineTo(x - sp + 60, H); c.closePath(); c.fill();
    }
    c.restore();
  }
  // the surface from below, the storm still flickering through it
  const ySurf = scr(0, ds, ys);
  if (ySurf > -160) {
    const p = (x: number, hl: number) => (t >= x ? Math.pow(0.5, (t - x) / hl) : 0);
    const flick = 0.7 * p(15.85, 0.06) + 0.5 * p(16.6, 0.05);
    const sg = c.createLinearGradient(0, ySurf - 140, 0, ySurf + 70);
    sg.addColorStop(0, 'rgba(235,252,255,0.95)'); sg.addColorStop(0.6, `rgba(190,240,255,${0.55 + 0.4 * flick})`); sg.addColorStop(1, 'rgba(120,210,240,0)');
    c.fillStyle = sg; c.fillRect(0, ySurf - 160, W, 230);
    c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 3;
    c.beginPath();
    for (let x = 0; x <= W; x += 30) { const yy = ySurf + 10 * Math.sin(x * 0.012 + t * 4) + 5 * Math.sin(x * 0.031 - t * 3); if (x) c.lineTo(x, yy); else c.moveTo(x, yy); }
    c.stroke();
  }
  // marine snow, fixed in the water (it rises past as she sinks)
  const TILE = H + 120;
  for (let i = 0; i < 130; i++) {
    const x = h01(i, 501) * W + 10 * Math.sin(t * 0.4 + i);
    const y = (((h01(i, 502) * TILE + 12 * t - top) % TILE) + TILE) % TILE - 60;
    c.fillStyle = `rgba(220,245,255,${0.12 + 0.3 * h01(i, 504)})`;
    c.beginPath(); c.arc(x, y, 0.8 + 2.2 * h01(i, 503) ** 2, 0, TAU); c.fill();
  }
  // open water: schools at their depths
  const schools: [number, number, number, string, number][] = [[520, 0.8, 9, '#ffd23f', 11], [760, 1.1, 7, '#ff8a2a', 12], [1020, 0.7, 11, '#bfefff', 13], [1420, 1.0, 6, '#ffd23f', 14], [1760, 0.9, 8, '#ff5fa2', 15]];
  for (const [D, k, n, col, seed] of schools) {
    const y = scr(D, ds, ys);
    if (y < -120 || y > H + 120) continue;
    fishSchool(c, t, y, k, n, seed, col, 0, D > 1600 ? 0.75 : 1);
  }
  // the reef: walls of rock closing in, coral and reeds on their ledges
  reefWalls(c, t, ds, ys);
  // the dark: specks of living light
  const dk = smoothstep(1700, 2200, (top + bot) / 2);
  if (dk > 0) {
    for (let i = 0; i < 70; i++) {
      const x = h01(i, 521) * W + 18 * Math.sin(t * 0.7 + i), y = (((h01(i, 522) * TILE - top * 0.9) % TILE) + TILE) % TILE - 60;
      const tw = 0.5 + 0.5 * Math.sin(t * (1.5 + 2 * h01(i, 523)) + i);
      g.fillStyle = rgbaHex(i % 3 ? '#2fe0ff' : '#ff4f9a', 0.5 * dk * tw);
      g.beginPath(); g.arc(x, y, 1.5 + 2.5 * h01(i, 524), 0, TAU); g.fill();
    }
  }
}

function reefWalls(c: C2, t: number, ds: number, ys: number) {
  const top = ds - ys;
  if (top + H < REEF0) return;
  for (const side of [-1, 1]) {
    const edge = side < 0 ? reefL : reefR;
    c.beginPath();
    let started = false;
    for (let y = -60; y <= H + 60; y += 24) {
      const D = top + y;
      if (D < REEF0) continue;
      const x = edge(D);
      if (!started) { c.moveTo(side < 0 ? -40 : W + 40, y); started = true; }
      c.lineTo(x, y);
    }
    if (!started) continue;
    c.lineTo(side < 0 ? -40 : W + 40, H + 60); c.closePath();
    const rg = c.createLinearGradient(0, 0, 0, H);
    rg.addColorStop(0, waterMix(top, '#4a3f9a')); rg.addColorStop(1, waterMix(top + H, '#33297a'));
    c.fillStyle = rg; c.fill();
    c.strokeStyle = 'rgba(170,200,255,0.4)'; c.lineWidth = 3; c.stroke();
    // ledges: coral clumps and reeds, rooted on the wall's edge
    for (let k = 0; k < 16; k++) {
      const D = REEF0 + 120 + k * 105 + 30 * h01(k, side + 2, 531);
      const y = scr(D, ds, ys);
      if (y < -200 || y > H + 300) continue;
      const x = edge(D) - side * 10;
      if (k % 3 === 1) reed(c, x, y, 110 + 90 * h01(k, side + 2, 532), t, k + (side > 0 ? 40 : 0), '#2fae6a', 13);
      else coral(c, x, y, 50 + 40 * h01(k, side + 2, 533), k + (side > 0 ? 2 : 0), t);
    }
  }
}
function waterMix(D: number, rock: string) {
  // the rock fades into the water's colour with depth
  const w = hexToRgb(rock), cs = waterAt(D).match(/\d+/g)!.map(Number), u = 0.25 + 0.45 * clamp(D / 2400);
  return `rgb(${Math.round(w[0]! + (cs[0]! - w[0]!) * u)},${Math.round(w[1]! + (cs[1]! - w[1]!) * u)},${Math.round(w[2]! + (cs[2]! - w[2]!) * u)})`;
}

/**
 * The shark passes close in open water, for no particular reason, right to left over [t0, t1] at world depth D; its
 * head turns as it passes the falling stone (at x stoneX), and a !? pops over it.
 */
export function passingShark(c: C2, t: number, ds: number, ys: number, t0: number, t1: number, D: number, stoneX: number) {
  if (t < t0 || t > t1) return;
  const u = (t - t0) / (t1 - t0), x = W + 460 - u * (W + 920), y = scr(D, ds, ys) + 16 * Math.sin(t * 1.3);
  const take = clamp(1 - Math.abs(x - 190 - stoneX) / 280);
  c.save();
  c.translate(x, y); c.rotate(-0.1 * take);
  shark(c, 0, 0, 210, -1, t, '#5d86b3');
  c.restore();
  const tPass = t0 + ((W + 460 - (stoneX + 190)) / (W + 920)) * (t1 - t0);
  if (t >= tPass && t < tPass + 1.0) drawMarks(c, { head: { x: x - 150, y: y - 70, r: 70 }, heart: { x, y, r: 10 }, feet: { x, y } }, ['!?'], t, tPass);
}

// ------------------------------------------------------------------ the rest, and the years

/** Rai's barnacle clusters on her disc (drawRai's), in units of R about the disc's centre, canvas y down. */
export const BARNACLE_SPOTS: [number, number, number][] = (() => {
  const out: [number, number, number][] = [];
  [0.62, 1.15, 2.05, 2.55, 3.85, 4.65, 5.45].forEach((a, ci) => {
    const n = 3 + Math.floor(h01(ci, 81) * 4);
    for (let i = 0; i < n; i++) {
      const b = h01(ci, i, 82) * TAU, d = h01(ci, i, 83) * 0.13;
      out.push([Math.cos(a) * 0.84 + Math.cos(b) * d, -(Math.sin(a) * 0.84 + Math.sin(b) * d), 0.038 + 0.05 * h01(ci, i, 84)]);
    }
  });
  return out;
})();

/** A barnacle seen from the front (pale cone, dark mouth), popping in as `pop` goes 0 -> 1. */
export function barnacle(c: C2, x: number, y: number, s: number, pop: number) {
  if (pop <= 0) return;
  const k = ease.outBack(clamp(pop), 2.4);
  c.save(); c.translate(x, y); c.scale(k, k);
  c.fillStyle = 'rgba(58,53,45,0.35)'; c.beginPath(); c.ellipse(0, s * 0.12, s * 1.05, s * 0.86, 0, 0, TAU); c.fill();
  c.fillStyle = '#d3ccbd'; c.beginPath(); c.ellipse(0, 0, s, s * 0.84, 0, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(143,135,120,0.85)'; c.lineWidth = s * 0.08;
  c.beginPath(); for (let k2 = 0; k2 < 6; k2++) { const a = (k2 / 6) * TAU; c.moveTo(Math.cos(a) * s * 0.42, Math.sin(a) * s * 0.36); c.lineTo(Math.cos(a) * s * 0.95, Math.sin(a) * s * 0.8); } c.stroke();
  c.fillStyle = '#2c2823'; c.beginPath(); c.ellipse(0, 0, s * 0.36, s * 0.23, 0, 0, TAU); c.fill();
  c.restore();
}

/** The drift of sand banked against her base over the years (0..1). Drawn in front of her. */
export function sandDrift(c: C2, years: number) {
  if (years <= 0) return;
  const h = 30 * years, w = REST.r * 1.3;
  c.fillStyle = '#efd99a';
  c.beginPath(); c.ellipse(REST.x, REST.y + REST.r + 10, w, h + 4, 0, Math.PI, TAU); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(160,125,70,0.35)'; c.lineWidth = 2;
  c.beginPath(); c.ellipse(REST.x, REST.y + REST.r + 10, w * 0.7, h * 0.6 + 2, 0, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
}
/** The reeds that grew up either side of her (0..1 of their grown height). */
export function restReeds(c: C2, t: number, years: number) {
  if (years <= 0) return;
  reed(c, REST.x - 250, FLOOR + 34, 40 + 250 * years, t, 77, '#2fae6a', 16);
  reed(c, REST.x - 296, FLOOR + 44, 30 + 170 * years, t, 78, '#27985c', 12);
  reed(c, REST.x + 270, FLOOR + 38, 40 + 300 * years, t, 79, '#2fae6a', 16);
}

/** A little coral starfish, crawling (its arms rippling) at (x, y), turned by rot. */
export function starfish(c: C2, x: number, y: number, s: number, rot: number, t: number) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.beginPath();
  for (let k = 0; k < 10; k++) {
    const a = (k * Math.PI) / 5 - Math.PI / 2, r = k % 2 === 0 ? s * (1 + 0.1 * Math.sin(t * 6 + k)) : s * 0.45;
    if (k === 0) c.moveTo(Math.cos(a) * r, Math.sin(a) * r); else c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  c.closePath(); c.fillStyle = '#ff7a6b'; c.fill(); c.lineJoin = 'round'; c.lineWidth = s * 0.25; c.strokeStyle = '#ff7a6b'; c.stroke();
  c.fillStyle = '#ffd2c4';
  for (let k = 0; k < 5; k++) { const a = (k * 2 * Math.PI) / 5 - Math.PI / 2; c.beginPath(); c.arc(Math.cos(a) * s * 0.45, Math.sin(a) * s * 0.45, s * 0.1, 0, TAU); c.fill(); }
  c.restore();
}

/** The seabed at the rest (shared by sinking's rest and hello). */
export function restBed(c: C2, t: number, o: { depth?: number } = {}) { seabed(c, t, bedOpts(o)); }

// ------------------------------------------------------------------ time on the seabed (the time-lapse)

/** The rest's time-lapse: the world runs up to 12x fast while the years pass, then slows back to real time. */
export const TL0 = 21.4;
const lapseBell = (t: number) => smoothstep(22.2, 23.8, t) * (1 - smoothstep(27.0, 28.3, t));
const LAPSE_DT = 0.005, LAPSE_N = Math.ceil((29.0 - TL0) / LAPSE_DT) + 1;
const LAPSE: Float64Array = (() => {
  const a = new Float64Array(LAPSE_N);
  for (let i = 1; i < LAPSE_N; i++) { const t = TL0 + i * LAPSE_DT; a[i] = a[i - 1]! + 11 * 0.5 * (lapseBell(t - LAPSE_DT) + lapseBell(t)) * LAPSE_DT; }
  return a;
})();
/** The extra seconds the time-lapse runs the world ahead by (constant after it ends): `hello` adds it to keep pace. */
export const TL_OFF = LAPSE[LAPSE_N - 1]!;
/** World time on the seabed: real time plus the time-lapse's lead. */
export function tlOf(t: number) {
  if (t <= TL0) return t;
  const x = (t - TL0) / LAPSE_DT, i = Math.floor(x);
  if (i >= LAPSE_N - 1) return t + TL_OFF;
  return t + LAPSE[i]! + (LAPSE[i + 1]! - LAPSE[i]!) * (x - i);
}
/** How far the years have gone (0..1), for the barnacles, the drift, the reeds. */
export const yearsOf = (t: number) => smoothstep(22.3, 28.2, t);
