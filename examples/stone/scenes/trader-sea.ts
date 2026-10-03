// The trader plate's places (his direction, 2026-10-02: every shot somewhere, with depth and something alive): the
// island's props drawn after the ship (so the ship sails behind the palms), the voyage canoe, the open sea, the storm,
// the reef seen above and below the waterline, the hull close up, the deck, and the trader's post on the beach.
import { W, H } from '../engine/gl';
import { HEX } from '../engine/palette';
import { font } from '../engine/type';
import { clamp, frameIdx, lerp } from '../engine/util';
import { h01 } from './_rai';
import { FAM, TAU, gradientV, person, rgbaHex, stone, type Emote, type Pose } from './_motifs';
import { canoe, cloud, coral, fishSchool, hut, island, palmTree, stoneBank, type TimeOfDay } from './_world';
import { star4 } from './_manga';

type C = CanvasRenderingContext2D;

function mix(a: string, b: string, u: number): string {
  const p = parseInt(a.slice(1), 16), q = parseInt(b.slice(1), 16), v = clamp(u);
  const ch = (s: number) => Math.round(((p >> s) & 255) + (((q >> s) & 255) - ((p >> s) & 255)) * v);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

// ------------------------------------------------------------------ the island, in two passes

export interface IsleOpts { time?: TimeOfDay; horizon?: number; beach?: number; pan?: number; seed?: number; huts?: boolean; bank?: boolean; canoes?: boolean; palms?: boolean }

/** The island's sky, sea and beach (no props), so a ship can sail between the sea and the palms. */
export function isleBack(c: C, t: number, o: IsleOpts = {}) {
  island(c, t, { time: o.time ?? 'sunset', horizon: o.horizon, beach: o.beach, pan: o.pan, seed: o.seed, show: ['clouds'] });
}

/** The island's props, at exactly the places _world.island() puts them (huts, stone bank, canoes, palms). */
export function isleProps(c: C, t: number, o: IsleOpts = {}) {
  const tod = o.time ?? 'sunset', bch = o.beach ?? H * 0.68, pan = o.pan ?? 0, seed = o.seed ?? 3;
  const dark = tod === 'night' ? 0.6 : tod === 'sunset' || tod === 'dawn' ? 0.25 : 0;
  if (o.huts !== false) for (let i = 0; i < 3; i++) hut(c, W * (0.08 + 0.3 * i) + 40 * h01(i, 31, seed) - pan * 0.7, bch + 30, 150 + 40 * h01(i, 32, seed), tod === 'night', dark);
  if (o.bank !== false) stoneBank(c, W * 0.7 - pan * 0.8, bch + 70, 1, dark, seed);
  if (o.canoes !== false) for (let i = 0; i < 2; i++) canoe(c, W * (0.25 + 0.4 * i) - pan * 0.9, bch + 130 + 40 * i, 1 + 0.2 * i, dark);
  if (o.palms !== false) for (let i = 0; i < 5; i++) palmTree(c, W * (0.03 + 0.24 * i) + 60 * h01(i, 41, seed) - pan * 0.9, bch + 40 + 30 * h01(i, 42, seed), 300 + 140 * h01(i, 43, seed), (h01(i, 44, seed) - 0.5) * 0.5, t, i, dark);
}

/** Islanders on the sand, faceless but reacting (dark silhouettes with a warm rim at sunset). */
export interface Islander { x: number; y: number; h: number; pose: Pose; flip?: boolean; emote?: Emote; t0?: number; tilt?: number }
export function islanders(c: C, t: number, list: Islander[], col = '#1d1430', rim = 'rgba(255,170,110,0.9)') {
  list.forEach((p, k) => person(c, p.x, p.y, p.h, p.pose, { col, flip: p.flip, t, seed: k + 3, rim, emote: p.emote, emoteT0: p.t0, headTilt: p.tilt }));
}

// ------------------------------------------------------------------ the voyage canoe

export interface CanoeOpts { tilt?: number; stoneR?: number; paddlers?: number; sail?: number; torn?: number; lantern?: number; tally?: number; silhouette?: string; stone?: boolean; pole?: boolean; emote?: Emote; emoteT0?: number; stoneDX?: number; stoneDY?: number; stoneTilt?: number }

/**
 * The voyage canoe of the old crossings (side view): an outrigger hull, a deck platform carrying the stone on its pole
 * (the pole through the hole in her heart), a crab-claw sail of plaited pandanus, paddlers. (x, y) = the middle of the
 * waterline, s = the hull's length. `silhouette` draws everything in one colour (backlit).
 */
export function voyageCanoe(c: C, x: number, y: number, s: number, t: number, o: CanoeOpts = {}) {
  const sil = o.silhouette, wood = sil ?? '#6a4428', dk = sil ?? '#3e2614', mat = sil ?? '#e9d7a6';
  c.save();
  c.translate(x, y); c.rotate(o.tilt ?? 0);
  c.lineCap = 'round'; c.lineJoin = 'round';
  // the outrigger float and its booms (behind)
  c.strokeStyle = dk; c.lineWidth = s * 0.012;
  for (const bx of [-0.18, 0.16]) { c.beginPath(); c.moveTo(bx * s, -0.05 * s); c.lineTo(bx * s + 0.05 * s, -0.13 * s); c.stroke(); }
  c.fillStyle = dk; c.beginPath(); c.ellipse(0.0, -0.13 * s, 0.32 * s, 0.018 * s, 0, 0, TAU); c.fill();
  // the mast and the crab-claw sail
  const sail = o.sail ?? 1;
  if (sail > 0) {
    const mx = 0.28 * s;
    c.strokeStyle = dk; c.lineWidth = s * 0.012;
    c.beginPath(); c.moveTo(mx, -0.06 * s); c.lineTo(mx - 0.02 * s, -0.62 * s * sail); c.stroke();
    const flap = Math.sin(t * 7) * 0.02 * s * (o.torn ?? 0), billow = 0.04 * s * Math.sin(t * 1.3);
    const A: [number, number] = [mx + 0.02 * s, -0.08 * s], B: [number, number] = [mx - 0.34 * s, -0.7 * s * sail], Cc: [number, number] = [mx + 0.26 * s, -0.66 * s * sail];
    c.beginPath(); c.moveTo(...A);
    c.quadraticCurveTo(mx - 0.22 * s - billow, -0.36 * s * sail, B[0], B[1]);
    c.quadraticCurveTo(mx - 0.02 * s + flap, -0.86 * s * sail, Cc[0], Cc[1]);
    if ((o.torn ?? 0) > 0) { // a ragged edge
      for (let k = 1; k <= 6; k++) { const u = k / 6, px = lerp(Cc[0], A[0], u) + (k % 2 ? 0.03 * s : -0.01 * s) + flap, py = lerp(Cc[1], A[1], u); c.lineTo(px, py); }
    } else c.quadraticCurveTo(mx + 0.14 * s + billow, -0.36 * s * sail, A[0], A[1]);
    c.closePath();
    c.fillStyle = mat; c.fill();
    if (!sil) { // the plait
      c.save(); c.clip();
      c.strokeStyle = 'rgba(150,110,60,0.45)'; c.lineWidth = Math.max(1, s * 0.004);
      for (let k = -20; k < 20; k++) { c.beginPath(); c.moveTo(mx + k * 0.03 * s, 0); c.lineTo(mx + k * 0.03 * s + 0.5 * s, -0.9 * s); c.stroke(); }
      c.restore();
    }
    c.strokeStyle = dk; c.lineWidth = s * 0.01;
    c.beginPath(); c.moveTo(...A); c.quadraticCurveTo(mx - 0.22 * s - billow, -0.36 * s * sail, B[0], B[1]); c.stroke();
    c.beginPath(); c.moveTo(...A); c.quadraticCurveTo(mx + 0.2 * s, -0.36 * s * sail, Cc[0], Cc[1]); c.stroke();
    // the tally of days scratched on the mast
    if ((o.tally ?? 0) > 0) {
      c.strokeStyle = sil ? rgbaHex(HEX.bone, 0.8) : '#f4e2b8'; c.lineWidth = Math.max(1.5, s * 0.004);
      for (let m = 0; m < Math.min(o.tally!, 30); m++) {
        const g = Math.floor(m / 5), j = m % 5, ty = -0.12 * s - g * 0.05 * s;
        if (j < 4) { c.beginPath(); c.moveTo(mx - 0.012 * s + j * 0.007 * s, ty); c.lineTo(mx - 0.012 * s + j * 0.007 * s, ty - 0.03 * s); c.stroke(); }
        else { c.beginPath(); c.moveTo(mx - 0.016 * s, ty - 0.004 * s); c.lineTo(mx + 0.02 * s, ty - 0.026 * s); c.stroke(); }
      }
    }
    // a lantern hung from the mast
    if ((o.lantern ?? 0) > 0) {
      const lx = mx - 0.06 * s, ly = -0.3 * s * sail;
      c.strokeStyle = dk; c.lineWidth = s * 0.003; c.beginPath(); c.moveTo(mx - 0.01 * s, ly - 0.04 * s); c.lineTo(lx, ly - 0.01 * s); c.stroke();
      c.save(); c.shadowColor = '#ffcf6b'; c.shadowBlur = s * 0.08 * o.lantern!;
      c.fillStyle = rgbaHex('#ffcf6b', 0.3 + 0.7 * o.lantern!); c.beginPath(); c.arc(lx, ly + 0.01 * s, s * 0.016, 0, TAU); c.fill();
      c.restore();
    }
  }
  // the stone on its pole (the pole first, so it shows through her hole)
  const sr = o.stoneR ?? 0.16 * s, sx0 = o.stoneDX ?? 0, sy = -0.07 * s - sr * 0.98 + (o.stoneDY ?? 0);
  if (o.stone !== false) {
    c.save(); c.translate(sx0, sy); c.rotate(o.stoneTilt ?? 0);
    if (o.pole !== false) { c.strokeStyle = dk; c.lineWidth = s * 0.016; c.beginPath(); c.moveTo(-sr * 1.6, sr * 0.06); c.lineTo(sr * 1.6, sr * 0.06); c.stroke(); }
    if (sil) { c.fillStyle = sil; c.beginPath(); c.arc(0, 0, sr, 0, TAU); c.moveTo(sr * 0.27, sr * 0.06); c.arc(0, sr * 0.06, sr * 0.26, 0, TAU, true); c.fill(); }
    else stone(c, 0, 0, sr, { seed: 21 });
    c.restore();
  }
  // the deck platform and the hull
  c.fillStyle = wood; c.fillRect(-0.3 * s, -0.08 * s, 0.6 * s, 0.025 * s);
  c.beginPath();
  c.moveTo(-0.52 * s, -0.085 * s); c.quadraticCurveTo(-0.44 * s, 0.03 * s, -0.25 * s, 0.025 * s); c.lineTo(0.25 * s, 0.025 * s);
  c.quadraticCurveTo(0.44 * s, 0.03 * s, 0.52 * s, -0.085 * s); c.lineTo(0.42 * s, -0.06 * s); c.lineTo(-0.42 * s, -0.06 * s); c.closePath();
  c.fillStyle = wood; c.fill();
  if (!sil) { c.strokeStyle = dk; c.lineWidth = Math.max(1, s * 0.004); c.beginPath(); c.moveTo(-0.46 * s, -0.035 * s); c.lineTo(0.46 * s, -0.035 * s); c.stroke(); }
  // the paddlers, fore and aft of the stone
  const n = o.paddlers ?? 4, ph = 0.24 * s;
  const spots = [-0.44, -0.34, 0.36, 0.45].slice(0, n);
  spots.forEach((u, k) => person(c, u * s, -0.06 * s, ph, 'paddle', { col: sil ?? '#24150c', t: t + k * 0.37, seed: k + 1, flip: u > 0, emote: k % 2 ? undefined : o.emote, emoteT0: (o.emoteT0 ?? 0) + k * 0.06 }));
  c.restore();
}

// ------------------------------------------------------------------ the open sea and Palau's cliffs

/** The open sea at a time of day (the island's sky and sea, the beach below the frame). */
export function openSea(c: C, t: number, tod: TimeOfDay, hz = H * 0.5, pan = 0) {
  island(c, t, { time: tod, horizon: hz, beach: H + 90, pan, show: ['clouds'] });
}

/** Palau's limestone cliffs at the left edge, with green on top (where the stones were cut). */
export function cliffs(c: C, x: number, hz: number, k: number, tod: TimeOfDay) {
  const rock = tod === 'dawn' ? '#c9b9a4' : '#a99d8a', green = tod === 'dawn' ? '#3b7a5a' : '#2e5a48';
  c.save();
  c.fillStyle = rock;
  c.beginPath(); c.moveTo(x - 400 * k, hz + 4);
  const pts: [number, number][] = [[-400, -40], [-300, -210], [-220, -260], [-120, -240], [-40, -170], [40, -90], [120, -20], [180, 0]];
  pts.forEach(([px, py]) => c.lineTo(x + px * k, hz + py * k));
  c.closePath(); c.fill();
  c.strokeStyle = 'rgba(90,80,70,0.5)'; c.lineWidth = 3 * k;
  for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(x + (-320 + i * 60) * k, hz - (200 - i * 25) * k); c.lineTo(x + (-300 + i * 60) * k, hz); c.stroke(); }
  c.fillStyle = green;
  c.beginPath(); c.moveTo(x - 330 * k, hz - 200 * k);
  for (let i = 0; i <= 10; i++) { const u = i / 10, px = -330 + 330 * u; c.lineTo(x + px * k, hz - (215 + 40 * Math.sin(u * 9) - 120 * u * u) * k); }
  c.lineTo(x, hz - 150 * k); c.closePath(); c.fill();
  // a quarried disc-shaped hollow in the cliff face: where a stone came from
  c.fillStyle = 'rgba(80,70,60,0.55)'; c.beginPath(); c.ellipse(x - 190 * k, hz - 110 * k, 40 * k, 46 * k, 0, 0, TAU); c.fill();
  c.restore();
}

// ------------------------------------------------------------------ the storm

/** Rolling sea waves: a filled band whose crest is a sum of travelling sines, foam on the peaks. */
export function waves(c: C, t: number, y0: number, amp: number, wl: number, speed: number, col: string, foam = 0.7, seed = 1) {
  const crest = (x: number) => y0 - amp * (0.6 * Math.sin(x / wl + t * speed + seed) + 0.3 * Math.sin(x / (wl * 0.43) - t * speed * 1.3 + seed * 2) + 0.1 * Math.sin(x / (wl * 0.17) + t * 2.1));
  c.fillStyle = col;
  c.beginPath(); c.moveTo(-20, H + 20);
  for (let x = -20; x <= W + 20; x += 16) c.lineTo(x, crest(x));
  c.lineTo(W + 20, H + 20); c.closePath(); c.fill();
  if (foam > 0) {
    c.strokeStyle = rgbaHex('#eaf6ff', foam); c.lineWidth = 4;
    c.beginPath();
    let on = false;
    for (let x = -20; x <= W + 20; x += 12) {
      const y = crest(x), up = crest(x - 12) > y && crest(x + 12) >= y - amp * 0.08;
      const peak = y < y0 - amp * 0.45;
      if (peak) { on ? c.lineTo(x, y + 3) : c.moveTo(x, y + 3); on = true; } else on = false;
      void up;
    }
    c.stroke();
  }
  return crest;
}

/** The storm's sky: bruised clouds racing, slanted rain; `bolt` 0..1 lights it from inside. */
export function stormSky(c: C, t: number, hz: number, bolt = 0) {
  gradientV(c, mix('#151632', '#8f8fc0', bolt * 0.6), mix('#3a3a66', '#c9c9ff', bolt * 0.6), 0, 0, W, hz + 4);
  for (let i = 0; i < 9; i++) {
    const x = ((h01(i, 71) * (W + 800) + t * (90 + 60 * h01(i, 72))) % (W + 800)) - 400, y = hz * (0.08 + 0.55 * h01(i, 73));
    cloud(c, x, y, 120 + 120 * h01(i, 74), bolt > 0.3 ? 'rgba(170,170,220,0.85)' : 'rgba(30,30,60,0.85)');
  }
}

export function rain(c: C, t: number, alpha = 0.5, n = 140) {
  const k = frameIdx(t) >> 1;
  c.save(); c.strokeStyle = rgbaHex('#c9d8ff', alpha); c.lineWidth = 2;
  c.beginPath();
  for (let i = 0; i < n; i++) {
    const x = h01(i, k, 81) * (W + 200) - 100, y = h01(i, k, 82) * H, l = 30 + 30 * h01(i, 83);
    c.moveTo(x, y); c.lineTo(x - l * 0.35, y + l);
  }
  c.stroke(); c.restore();
}

/** A forked lightning bolt from the sky to (x1, y1), seeded. */
export function lightning(c: C, x0: number, x1: number, y1: number, seed: number, col: string, w = 6) {
  c.save(); c.strokeStyle = col; c.lineWidth = w; c.lineJoin = 'miter';
  c.shadowColor = col; c.shadowBlur = 30;
  c.beginPath(); c.moveTo(x0, -10);
  let x = x0;
  for (let i = 1; i <= 9; i++) { x = lerp(x0, x1, i / 9) + (h01(i, seed, 91) - 0.5) * 90; c.lineTo(x, (y1 * i) / 9); if (i === 5) { c.moveTo(x, (y1 * i) / 9); c.lineTo(x + 80, (y1 * i) / 9 + 90); c.moveTo(x, (y1 * i) / 9); } }
  c.stroke(); c.restore();
}

// ------------------------------------------------------------------ the reef, above and below the waterline

/** A split view: dawn sky and sea above the line wl, the reef below it (coral heads, fish, light); surf where the
 *  coral breaks the surface. `pan` drifts the reef. Returns the surface height function. */
export function reefSplit(c: C, t: number, wl: number, pan = 0) {
  island(c, t, { time: 'day', horizon: wl - 150, beach: H + 90, show: ['clouds'] });
  // under water
  const g = c.createLinearGradient(0, wl, 0, H);
  g.addColorStop(0, '#3fd0e6'); g.addColorStop(0.5, '#1f8fc9'); g.addColorStop(1, '#155a9e');
  c.fillStyle = g;
  const surf = (x: number) => wl + 6 * Math.sin(x * 0.012 + t * 2) + 3 * Math.sin(x * 0.031 - t * 1.4);
  c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 20) c.lineTo(x, surf(x)); c.lineTo(W, H); c.closePath(); c.fill();
  // light from above
  c.save(); c.globalCompositeOperation = 'screen';
  for (let k = 0; k < 6; k++) {
    const x = (0.1 + 0.16 * k) * W + 30 * Math.sin(t * 0.4 + k);
    const rg = c.createLinearGradient(0, wl, 0, H); rg.addColorStop(0, 'rgba(220,255,255,0.22)'); rg.addColorStop(1, 'rgba(220,255,255,0)');
    c.fillStyle = rg; c.beginPath(); c.moveTo(x - 20, wl); c.lineTo(x + 20, wl); c.lineTo(x + 140, H); c.lineTo(x - 60, H); c.closePath(); c.fill();
  }
  c.restore();
  fishSchool(c, t, wl + (H - wl) * 0.35, 0.9, 6, 12, '#ffd23f', pan * 0.5, 0.9);
  // the reef: rock heads (some breaking the surface), coral on them
  for (let i = 0; i < 9; i++) {
    const x = ((i * 260 + 80 - pan) % (W + 400) + W + 400) % (W + 400) - 200, top = wl + (i % 3 === 1 ? -14 : 40 + 110 * h01(i, 3));
    const w = 160 + 120 * h01(i, 4);
    c.fillStyle = i % 2 ? '#2b6d78' : '#356f6a';
    c.beginPath(); c.moveTo(x - w / 2, H + 10);
    c.bezierCurveTo(x - w * 0.45, top + 30, x - w * 0.2, top, x, top); c.bezierCurveTo(x + w * 0.25, top, x + w * 0.45, top + 40, x + w / 2, H + 10); c.closePath(); c.fill();
    for (let j = 0; j < 3; j++) coral(c, x - w * 0.25 + j * w * 0.25, Math.max(top + 30, wl + 30) + 30 * j, 40 + 30 * h01(i, j, 5), i + j, t);
    if (top < wl) { // surf breaking on the head
      for (let j = 0; j < 7; j++) { const a = (j / 7) * Math.PI, r = 30 + 20 * Math.sin(t * 6 + j); c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.arc(x + Math.cos(a) * r * 1.6, wl - Math.sin(a) * r * 0.6 - 6, 12 + 6 * h01(j, i, 6), 0, TAU); c.fill(); }
    }
  }
  // the surface's bright edge
  c.strokeStyle = 'rgba(235,255,255,0.85)'; c.lineWidth = 4;
  c.beginPath(); for (let x = 0; x <= W; x += 20) x ? c.lineTo(x, surf(x)) : c.moveTo(x, surf(x)); c.stroke();
  return surf;
}

// ------------------------------------------------------------------ the iron hull close up

/** Riveted periwinkle plates above a slapping waterline, the load line's ring painted on, a hawse hole with chain. */
export function hullClose(c: C, t: number, drift: number) {
  const wl = H * 0.72;
  gradientV(c, '#3b2a7a', '#ff8a5a', 0, 0, W, H * 0.12);
  c.save();
  c.beginPath(); c.rect(0, H * 0.1, W, wl - H * 0.1 + 30); c.clip();
  c.translate(-drift, 0);
  const pw = 460, ph = 210;
  for (let r = 0; r < 4; r++) for (let k = -1; k < 7; k++) {
    const x = k * pw + (r % 2 ? pw / 2 : 0), y = H * 0.1 + r * ph;
    const gr = c.createLinearGradient(0, y, 0, y + ph);
    gr.addColorStop(0, '#9fb1ff'); gr.addColorStop(0.5, HEX.peri); gr.addColorStop(1, '#4152b0');
    c.fillStyle = gr; c.fillRect(x, y, pw, ph);
    c.strokeStyle = '#25306e'; c.lineWidth = 5; c.strokeRect(x, y, pw, ph);
    for (let i = 0; i < 15; i++) for (const yy of [y + 16, y + ph - 16]) {
      const rx = x + 16 + i * ((pw - 32) / 14);
      c.fillStyle = '#25306e'; c.beginPath(); c.arc(rx + 2, yy + 2, 6, 0, TAU); c.fill();
      c.fillStyle = '#c4cfff'; c.beginPath(); c.arc(rx, yy, 5, 0, TAU); c.fill();
    }
  }
  // the hawse hole and its chain
  const hx = W * 0.2, hy = H * 0.26;
  c.fillStyle = '#1a2050'; c.beginPath(); c.arc(hx, hy, 46, 0, TAU); c.fill();
  c.strokeStyle = '#7d89c9'; c.lineWidth = 8; c.beginPath(); c.arc(hx, hy, 46, 0, TAU); c.stroke();
  c.strokeStyle = '#2a2f55'; c.lineWidth = 10;
  for (let i = 0; i < 9; i++) { c.beginPath(); c.ellipse(hx + 6, hy + 30 + i * 34, 12, 20, 0, 0, TAU); c.stroke(); }
  // the load line: a ring with a bar through it (how heavy she may ride)
  const lx = W * 0.82, ly = H * 0.5;
  c.strokeStyle = '#f4f1ea'; c.lineWidth = 10;
  c.beginPath(); c.arc(lx, ly, 52, 0, TAU); c.stroke();
  c.beginPath(); c.moveTo(lx - 90, ly); c.lineTo(lx + 90, ly); c.stroke();
  c.font = font(FAM.monoB(), 30); c.fillStyle = '#f4f1ea'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('L', lx - 72, ly - 32); c.fillText('R', lx + 72, ly - 32);
  c.restore();
  // the waterline, slapping; the sunset in the water
  const sea = c.createLinearGradient(0, wl, 0, H);
  sea.addColorStop(0, '#5a4aa0'); sea.addColorStop(1, '#241a4a');
  c.fillStyle = sea;
  c.beginPath(); c.moveTo(0, H);
  for (let x = 0; x <= W; x += 16) c.lineTo(x, wl + 12 * Math.sin(x * 0.012 + t * 3) + 6 * Math.sin(x * 0.04 - t * 4));
  c.lineTo(W, H); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,190,140,0.6)'; c.lineWidth = 3;
  for (let i = 0; i < 10; i++) { const y = wl + 30 + i * 22, x = ((h01(i, 5) * W + t * 40) % W); c.beginPath(); c.moveTo(x, y); c.lineTo(x + 120, y); c.stroke(); }
  // spray where the water slaps the iron
  for (let i = 0; i < 14; i++) {
    const u = ((t * 1.6 + h01(i, 7)) % 1), x = h01(i, 8) * W, y = wl - 60 * Math.sin(u * Math.PI) - 4;
    c.fillStyle = `rgba(240,248,255,${0.8 * (1 - u)})`; c.beginPath(); c.arc(x, y, 4 + 5 * h01(i, 9), 0, TAU); c.fill();
  }
}

// ------------------------------------------------------------------ the deck

/** The steamship's deck at sunset, seen along its length: planks in perspective, the rail, the island beyond. */
export function deck(c: C, t: number, deckY: number) {
  openSea(c, t, 'sunset', deckY - 140);
  // the island on the horizon, small
  c.fillStyle = '#2b1f45';
  c.beginPath(); c.moveTo(W * 0.04, deckY - 136); c.quadraticCurveTo(W * 0.18, deckY - 190, W * 0.34, deckY - 136); c.fill();
  for (let i = 0; i < 4; i++) palmTree(c, W * (0.08 + 0.07 * i), deckY - 150, 70 + 20 * h01(i, 3), (h01(i, 4) - 0.5) * 0.6, t, i, 0.9);
  // the rail
  c.fillStyle = '#3a4aa8'; c.fillRect(0, deckY - 70, W, 12);
  for (let x = 20; x < W; x += 70) c.fillRect(x, deckY - 70, 7, 70);
  // the planks, in perspective to a far point
  const g = c.createLinearGradient(0, deckY, 0, H);
  g.addColorStop(0, '#8a5a32'); g.addColorStop(1, '#5a3a20');
  c.fillStyle = g; c.fillRect(0, deckY, W, H - deckY);
  c.strokeStyle = 'rgba(40,24,12,0.6)'; c.lineWidth = 3;
  for (let k = -14; k <= 14; k++) { c.beginPath(); c.moveTo(W / 2 + k * 60, deckY); c.lineTo(W / 2 + k * 240, H); c.stroke(); }
  c.strokeStyle = 'rgba(255,190,120,0.25)'; c.lineWidth = 2;
  for (let i = 1; i < 6; i++) { const y = deckY + (H - deckY) * Math.pow(i / 6, 1.6); c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
}

/** A cargo crate with a stencil. */
export function crate(c: C, x: number, y: number, w: number, h: number, label: string) {
  c.fillStyle = '#9a6a3a'; c.fillRect(x, y, w, h);
  c.strokeStyle = '#5a3a20'; c.lineWidth = 6; c.strokeRect(x, y, w, h);
  c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y + h); c.moveTo(x + w, y); c.lineTo(x, y + h); c.stroke();
  c.fillStyle = 'rgba(244,236,214,0.92)'; c.fillRect(x + w * 0.08, y + h * 0.36, w * 0.84, h * 0.3);
  c.font = font(FAM.monoB(), h * 0.2); c.fillStyle = '#3a2614'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(label, x + w / 2, y + h * 0.52);
}

// ------------------------------------------------------------------ the trader's post on the beach

/** Inside the trader's post at dusk: plank walls, a window on the anchored ship, shelves, copra sacks, a lantern. */
export function tradingPost(c: C, t: number, o: { floorY?: number; lantern?: number } = {}) {
  const fy = o.floorY ?? H * 0.82;
  // plank walls
  c.fillStyle = '#5e3c22'; c.fillRect(0, 0, W, fy);
  for (let x = 0; x < W; x += 74) {
    c.fillStyle = h01(x, 3) < 0.5 ? '#6a4428' : '#593820'; c.fillRect(x, 0, 72, fy);
    c.fillStyle = 'rgba(30,16,8,0.6)'; c.fillRect(x + 72, 0, 2, fy);
    c.fillStyle = 'rgba(40,22,10,0.5)'; c.beginPath(); c.arc(x + 20, 40 + h01(x, 4) * fy * 0.8, 4, 0, TAU); c.fill();
  }
  // the window: the sunset sea with the steamship at anchor (the trader is never far from his ship)
  const wx = W * 0.62, wy = H * 0.1, ww = 420, wh = 260;
  c.save(); c.beginPath(); c.rect(wx, wy, ww, wh); c.clip();
  gradientV(c, '#3b2a7a', '#ff8a5a', wx, wy, ww, wh * 0.62);
  gradientV(c, '#4a3f8f', '#2b2360', wx, wy + wh * 0.62, ww, wh * 0.38);
  c.fillStyle = '#ffd36b'; c.beginPath(); c.arc(wx + ww * 0.3, wy + wh * 0.62, 40, Math.PI, 0); c.fill();
  c.fillStyle = '#4f5d9a';
  const sx = wx + ww * 0.68, sy = wy + wh * 0.64;
  c.fillRect(sx - 80, sy - 14, 170, 14); c.fillRect(sx - 30, sy - 26, 60, 12); c.fillRect(sx - 6, sy - 60, 12, 36);
  c.fillRect(sx - 64, sy - 80, 3, 66); c.fillRect(sx + 56, sy - 80, 3, 66);
  for (let i = 0; i < 4; i++) { const u = (t * 0.3 + i / 4) % 1; c.fillStyle = `rgba(60,60,70,${0.5 * (1 - u)})`; c.beginPath(); c.arc(sx + u * 50, sy - 64 - u * 40, 6 + u * 14, 0, TAU); c.fill(); }
  c.restore();
  c.strokeStyle = '#3a2210'; c.lineWidth = 14; c.strokeRect(wx, wy, ww, wh);
  c.lineWidth = 8; c.beginPath(); c.moveTo(wx + ww / 2, wy); c.lineTo(wx + ww / 2, wy + wh); c.stroke();
  // a shelf of tins and bottles
  c.fillStyle = '#3a2210'; c.fillRect(W * 0.06, H * 0.2, 520, 16);
  const cols = ['#b84a3a', '#d9a441', '#4a7a9a', '#6a8a4a', '#c97a3a', '#8a5aa0'];
  for (let i = 0; i < 9; i++) {
    const x = W * 0.06 + 20 + i * 56, hgt = 50 + 40 * h01(i, 11);
    c.fillStyle = cols[i % cols.length]!;
    if (i % 3 === 2) { c.fillRect(x + 10, H * 0.2 - hgt, 22, hgt); c.fillRect(x + 16, H * 0.2 - hgt - 20, 10, 20); }
    else { c.fillRect(x, H * 0.2 - hgt, 42, hgt); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(x + 4, H * 0.2 - hgt * 0.7, 34, hgt * 0.3); }
  }
  // copra sacks along the wall: what he really came for
  for (let i = 0; i < 4; i++) {
    const x = W * 0.05 + i * 120, y = fy - 10, s = 100 + 10 * h01(i, 21);
    c.fillStyle = i % 2 ? '#c9b07a' : '#bfa46c';
    c.beginPath(); c.moveTo(x - s * 0.5, y); c.quadraticCurveTo(x - s * 0.6, y - s * 0.9, x - s * 0.2, y - s * 1.1); c.lineTo(x + s * 0.2, y - s * 1.1); c.quadraticCurveTo(x + s * 0.6, y - s * 0.9, x + s * 0.5, y); c.closePath(); c.fill();
    c.font = font(FAM.monoB(), 24); c.fillStyle = '#5a3a20'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('COPRA', x, y - s * 0.45);
  }
  // the floor
  gradientV(c, '#4a2e18', '#2a180c', 0, fy, W, H - fy);
  c.strokeStyle = 'rgba(20,10,4,0.5)'; c.lineWidth = 2;
  for (let k = -10; k <= 10; k++) { c.beginPath(); c.moveTo(W / 2 + k * 90, fy); c.lineTo(W / 2 + k * 260, H); c.stroke(); }
  // the lantern hanging from a beam, swinging a little (the light moves with it)
  const sw = 0.12 * Math.sin(t * 1.8), lx = W * 0.47 + Math.sin(sw) * 160, ly = 30 + Math.cos(sw) * 160;
  c.strokeStyle = '#2a1608'; c.lineWidth = 3; c.beginPath(); c.moveTo(W * 0.47, 0); c.lineTo(lx, ly - 30); c.stroke();
  c.save(); c.globalCompositeOperation = 'screen';
  const lg = c.createRadialGradient(lx, ly, 0, lx, ly, W * 0.45);
  lg.addColorStop(0, `rgba(255,200,120,${0.45 * (o.lantern ?? 1)})`); lg.addColorStop(1, 'rgba(255,200,120,0)');
  c.fillStyle = lg; c.fillRect(0, 0, W, H);
  c.restore();
  c.fillStyle = '#2a1608'; c.fillRect(lx - 22, ly - 32, 44, 10); c.fillRect(lx - 18, ly + 26, 36, 8);
  c.save(); c.shadowColor = '#ffcf6b'; c.shadowBlur = 40; c.fillStyle = '#ffe2a0'; c.beginPath(); c.ellipse(lx, ly, 18, 26, 0, 0, TAU); c.fill(); c.restore();
  return { fy, lantern: [lx, ly] as [number, number] };
}

/** The open ledger book on a counter (columns of figures): the Ledger to come. */
export function ledgerBook(c: C, x: number, y: number, w: number, rot = -0.06) {
  c.save(); c.translate(x, y); c.rotate(rot);
  const h = w * 0.62;
  c.fillStyle = '#3a2a40'; c.fillRect(-w / 2 - 8, -h / 2 - 6, w + 16, h + 12);
  c.fillStyle = '#efe4c6'; c.fillRect(-w / 2, -h / 2, w, h);
  c.strokeStyle = 'rgba(120,90,60,0.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -h / 2); c.lineTo(0, h / 2); c.stroke();
  c.strokeStyle = 'rgba(80,120,160,0.4)'; c.lineWidth = 1.5;
  for (let i = 1; i < 9; i++) { const yy = -h / 2 + (i * h) / 9; c.beginPath(); c.moveTo(-w / 2 + 8, yy); c.lineTo(w / 2 - 8, yy); c.stroke(); }
  c.font = font(FAM.mono(), h * 0.07); c.fillStyle = '#4a3020'; c.textAlign = 'right'; c.textBaseline = 'middle';
  for (let i = 1; i < 8; i++) { c.fillText(String(Math.floor(10 + 90 * h01(i, 31))) + '.' + String(Math.floor(10 + 89 * h01(i, 32))), -w * 0.06, -h / 2 + (i + 0.5) * h / 9); c.fillText(i < 5 ? String(Math.floor(1 + 9 * h01(i, 33))) : '', w / 2 - 14, -h / 2 + (i + 0.5) * h / 9); }
  c.restore();
}

/** A warehouse platform scale: the platform on the floor, a column, the dial at the top; `needle` 0..1 of its sweep. */
export function platformScale(c: C, x: number, floorY: number, k: number, needle: number) {
  c.save();
  c.fillStyle = '#3a3f5a'; c.fillRect(x - 210 * k, floorY - 34 * k, 420 * k, 34 * k);
  c.fillStyle = '#5a6080'; c.fillRect(x - 210 * k, floorY - 40 * k, 420 * k, 10 * k);
  const cx = x + 250 * k, top = floorY - 520 * k;
  c.fillStyle = '#3a3f5a'; c.fillRect(cx - 18 * k, top, 36 * k, 520 * k);
  const dy = top - 10 * k, R = 120 * k;
  c.fillStyle = '#2a2f45'; c.beginPath(); c.arc(cx, dy, R + 16 * k, 0, TAU); c.fill();
  c.fillStyle = '#f4f1ea'; c.beginPath(); c.arc(cx, dy, R, 0, TAU); c.fill();
  const a0 = Math.PI * 0.75, a1 = Math.PI * 2.25;
  c.lineWidth = 18 * k; c.strokeStyle = HEX.coral; c.beginPath(); c.arc(cx, dy, R * 0.8, a0 + (a1 - a0) * 0.78, a1); c.stroke();
  c.strokeStyle = '#120d1d';
  for (let i = 0; i <= 20; i++) { const a = a0 + (a1 - a0) * (i / 20), r0 = R * (i % 5 ? 0.86 : 0.76); c.lineWidth = (i % 5 ? 2 : 4) * k; c.beginPath(); c.moveTo(cx + Math.cos(a) * r0, dy + Math.sin(a) * r0); c.lineTo(cx + Math.cos(a) * R * 0.94, dy + Math.sin(a) * R * 0.94); c.stroke(); }
  c.font = font(FAM.monoB(), 26 * k); c.fillStyle = '#120d1d'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('KG', cx, dy + R * 0.45);
  const na = a0 + (a1 - a0) * clamp(needle, 0, 1.02);
  c.strokeStyle = '#120d1d'; c.lineWidth = 8 * k; c.lineCap = 'round';
  c.beginPath(); c.moveTo(cx, dy); c.lineTo(cx + Math.cos(na) * R * 0.82, dy + Math.sin(na) * R * 0.82); c.stroke();
  c.fillStyle = '#120d1d'; c.beginPath(); c.arc(cx, dy, 12 * k, 0, TAU); c.fill();
  c.restore();
  return { dial: [cx, dy] as [number, number], R };
}

/** A stack of gold coins (the trader's money), glinting. */
export function coinStack(c: C, x: number, y: number, r: number, n: number, glint: number) {
  for (let i = 0; i < n; i++) {
    const yy = y - i * r * 0.22;
    c.fillStyle = '#a8741c'; c.beginPath(); c.ellipse(x, yy + r * 0.1, r, r * 0.34, 0, 0, TAU); c.fill();
    c.fillStyle = i === n - 1 ? '#ffd86b' : '#e8b84a'; c.beginPath(); c.ellipse(x, yy, r, r * 0.34, 0, 0, TAU); c.fill();
  }
  if (glint > 0) star4(c, x + r * 0.4, y - (n - 1) * r * 0.22 - r * 0.1, r * (0.4 + 1.6 * glint), '#fffbe0');
}

/** The steamship's silhouette passing over the surface, seen from the seabed: a long dark keel, the screw churning. */
export function hullFromBelow(c: C, t: number, x: number, y: number, s: number) {
  c.save();
  c.fillStyle = 'rgba(14,18,40,0.92)';
  c.beginPath(); c.moveTo(x - s * 0.5, y); c.quadraticCurveTo(x - s * 0.42, y + s * 0.07, x - s * 0.2, y + s * 0.08);
  c.lineTo(x + s * 0.38, y + s * 0.08); c.quadraticCurveTo(x + s * 0.5, y + s * 0.06, x + s * 0.5, y); c.closePath(); c.fill();
  // the screw and its wash of bubbles
  const px = x + s * 0.47, py = y + s * 0.06, a = t * 20;
  c.fillStyle = 'rgba(14,18,40,0.95)';
  for (let k = 0; k < 3; k++) { const aa = a + (k * TAU) / 3; c.beginPath(); c.ellipse(px + Math.cos(aa) * s * 0.02, py + Math.sin(aa) * s * 0.03, s * 0.012, s * 0.03, aa, 0, TAU); c.fill(); }
  c.strokeStyle = 'rgba(220,250,255,0.7)'; c.lineWidth = 2;
  for (let i = 0; i < 16; i++) { const u = ((t * 1.5 + h01(i, 3)) % 1), bx = px + s * 0.05 + u * s * 0.4, by = py - u * s * 0.06 + 20 * Math.sin(i + t * 4) * u; c.beginPath(); c.arc(bx, by, 3 + 8 * u, 0, TAU); c.stroke(); }
  c.restore();
}
