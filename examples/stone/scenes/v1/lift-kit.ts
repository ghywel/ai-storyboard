// v1 `lift` (and the breach in `festival`): the breakdown's props, in the studio's logical px. The audience as
// carriers (fish, crabs, the anchor, the diving helmet, the old stones, the ship's bell, a jelly), the long pole
// through Rai's heart, the two ratchet posts whose collars click up a notch on each "lift it", the stage-lift lever
// box in the right wing (it stands where the racked pole was: the pole is in use now), the studio screen's depth
// gauge, the octopus's cue card flipping, the sea above the rising wreck, and the line's layout (shared with the
// festival's breach). The smashed scoreboard is `panel`'s own (panel-props), so the two plates show the same wreck.
// Pure functions of t.
import { W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import { clamp, ease, frameIdx } from '../../engine/util';
import { h01 } from '../_rai';
import { FAM, TAU, rgbaHex, mixHex, stone } from '../_motifs';
import { star4, sweatDrop, heart } from '../_manga';
import { SET, scanlines, balancedRows } from './_studio';
import { cast, type Who } from './_cast';
import type { Line } from '../../engine/lyrics';

type C2 = CanvasRenderingContext2D;

// ------------------------------------------------------------------ the line's geometry (the studio wide)

export const LK = {
  R: 115,                       // Rai's disc radius on the pole
  cx: W / 2,
  floor: SET.floor,
  pole0: SET.floor - 150,       // notch 0: on the creatures' heads
  notch: 38,
  posts: [W / 2 - 700, W / 2 + 700] as const,
  humanH: 288,                  // the cast: the pole on their shoulders at notch 2, in their raised hands at notch 4
  critS: 1.45,                  // the creatures' scale
  lever: { x: 1748, y: SET.floor },
  octo: { x: 1808, y: 700, s: 0.72 },
  card: { x: 1770, y: 430 },
};
/** The pole's height (canvas y) at a (fractional) notch. */
export const poleAt = (notch: number) => LK.pole0 - notch * LK.notch;
/** Rai's disc centre for a pole height: the pole runs through the hole that is her heart. */
export const raiOnPole = (poleY: number, R = LK.R) => poleY - 0.12 * R;

// ------------------------------------------------------------------ the creatures

export type Critter = 'fish' | 'crab' | 'anchor' | 'helmet' | 'stone' | 'bell' | 'jelly';
export const FISH_COLS = ['#ffd23f', '#ff8a2a', '#6f8cff', '#78d63a', '#ff4f9a', '#2fe0ff', '#c65cf0'];

export interface CritOpts {
  t: number; seed: number; col?: string;
  /** Hands on the pole at this height (carrying). */
  poleY?: number | null;
  /** Sitting on the pole (riding), fins waving. */
  ride?: boolean;
  /** Fins or claws up (0..1), cheering. */
  cheer?: number;
  /** Straining under the weight (0..1): a stretch, a sweat drop. */
  strain?: number;
  /** A heart's glow (the old stones). */
  heart?: number;
}

function shade(hex: string, k: number) { return mixHex(hex, '#000000', k); }

function eyes(c: C2, x: number, y: number, s: number, gap: number, lookY: number, t: number, seed: number, big = 1) {
  const blink = ((t * 0.7 + h01(seed, 51)) % 1) < 0.035;
  for (const k of [-1, 1]) {
    const ex = x + k * gap * 0.5 * s;
    c.fillStyle = '#ffffff';
    c.beginPath(); c.ellipse(ex, y, 10 * s * big, (blink ? 1.5 : 12) * s * big, 0, 0, TAU); c.fill();
    if (!blink) { c.fillStyle = '#111'; c.beginPath(); c.arc(ex + 1.5 * s, y + lookY * 5 * s, 5 * s * big, 0, TAU); c.fill(); }
  }
}

/** A limb (fin, claw arm, hose, stone arm) from (x0, y0) to (x1, y1), bowing out sideways towards `d` (-1 or 1). */
function limb(c: C2, x0: number, y0: number, x1: number, y1: number, w: number, col: string, d = 1, outline?: string) {
  const mx = (x0 + x1) / 2 + d * 0.22 * Math.hypot(x1 - x0, y1 - y0), my = (y0 + y1) / 2;
  c.lineCap = 'round';
  if (outline) {
    c.strokeStyle = outline; c.lineWidth = w * 1.5;
    c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(mx, my, x1, y1); c.stroke();
  }
  c.strokeStyle = col; c.lineWidth = w;
  c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(mx, my, x1, y1); c.stroke();
}

/** The two hands of a creature: on the pole (carrying), up (cheering), or at rest. Returns the hand points. */
function hands(x: number, sx: number, sy: number, o: CritOpts, s: number, rest: [number, number], reach = 26): [number, number][] {
  const t = o.t;
  if (o.poleY != null && !o.ride) return [[x - reach * s, o.poleY + 4 * s], [x + reach * s, o.poleY + 4 * s]];
  const ch = clamp(o.cheer ?? 0);
  return [-1, 1].map((k) => {
    const wv = Math.sin(t * 9 + k + o.seed) * 8 * s * ch;
    const rx = x + k * rest[0] * s, ry = sy + rest[1] * s;
    const ux = x + k * (sx + 26 * s), uy = sy - 62 * s + wv;
    return [rx + (ux - rx) * ch, ry + (uy - ry) * ch] as [number, number];
  });
}

/**
 * One of the studio audience on its feet (feet at (x, feet), scale s): a fish, a crab, the anchor, the diving
 * helmet (a hermit's eyes in its glass), an old rai stone, the ship's bell or a jelly. Carrying: its hands on the pole
 * at `poleY` (limbs stretch as the pole rises). Riding: sitting on the pole, waving.
 */
export function critter(c: C2, kind: Critter, x: number, feet: number, s: number, o: CritOpts) {
  const t = o.t, st = clamp(o.strain ?? 0), seed = o.seed;
  const carrying = o.poleY != null && !o.ride;
  if (o.ride && o.poleY != null) {
    if (kind === 'bell') { // the bell hangs from the pole by its crown, swinging and ringing
      c.save(); c.translate(x, o.poleY); c.rotate(0.35 * Math.sin(t * 7 + seed));
      bellBody(c, 0, 92 * s, s, t, seed, 'hang');
      c.restore();
      return;
    }
    feet = o.poleY + (kind === 'stone' ? 2 : 6) * s;   // sitting on it
  }
  c.save();
  c.lineJoin = 'round';
  switch (kind) {
    case 'fish': {
      const col = o.col ?? FISH_COLS[seed % FISH_COLS.length]!;
      const k = 1 + 0.14 * st, rx = 40 * s / Math.sqrt(k), ry = 46 * s * k, by = feet - 14 * s - ry;
      // the tail as feet
      c.fillStyle = shade(col, 0.22);
      for (const d of [-1, 1]) { c.beginPath(); c.moveTo(x, feet - 20 * s); c.lineTo(x + d * 26 * s, feet + 1); c.lineTo(x + d * 6 * s, feet - 4 * s); c.closePath(); c.fill(); }
      const hs = hands(x, rx, by, o, s, [44, 6]);
      const fin = shade(col, 0.2);
      for (const [i, [hx, hy]] of hs.entries()) {
        const d = i ? 1 : -1;
        limb(c, x + d * rx * 0.8, by - 6 * s, hx, hy, 13 * s, fin, d);
        c.fillStyle = fin; c.beginPath(); c.ellipse(hx, hy, 9 * s, 12 * s, 0, 0, TAU); c.fill();
      }
      // dorsal fin, body, belly
      c.fillStyle = fin;
      c.beginPath(); c.moveTo(x - 9 * s, by - ry + 5 * s); c.quadraticCurveTo(x, by - ry - 24 * s, x + 13 * s, by - ry + 3 * s); c.fill();
      c.fillStyle = col; c.beginPath(); c.ellipse(x, by, rx, ry, 0, 0, TAU); c.fill();
      c.fillStyle = mixHex(col, '#ffffff', 0.3); c.beginPath(); c.ellipse(x, by + ry * 0.32, rx * 0.65, ry * 0.46, 0, 0, TAU); c.fill();
      eyes(c, x, by - ry * 0.22, s, 30, carrying ? -0.8 : 0.2, t, seed);
      break;
    }
    case 'crab': {
      const col = o.col ?? '#e8553a', claw = '#d0452d';
      const cy = feet - (o.ride ? 18 : 34) * s - 6 * s * st;
      c.strokeStyle = col; c.lineWidth = 6 * s; c.lineCap = 'round';
      if (!o.ride) for (const d of [-1, 1]) for (let k = 0; k < 3; k++) {
        c.beginPath(); c.moveTo(x + d * (26 + 8 * k) * s, cy + 10 * s); c.quadraticCurveTo(x + d * (58 + 8 * k) * s, cy - 6 * s + k * 4 * s, x + d * (52 + 10 * k) * s, feet); c.stroke();
      } else for (const d of [-1, 1]) for (let k = 0; k < 2; k++) { // legs dangling over the pole
        c.beginPath(); c.moveTo(x + d * (20 + 10 * k) * s, cy + 12 * s); c.quadraticCurveTo(x + d * (34 + 10 * k) * s, cy + 30 * s, x + d * (28 + 12 * k) * s, cy + 44 * s + 4 * Math.sin(t * 8 + k + d)); c.stroke();
      }
      const hs = hands(x, 44, cy, o, s, [62, 8], 30);
      for (const [i, [hx, hy]] of hs.entries()) {
        const d = i ? 1 : -1;
        limb(c, x + d * 42 * s, cy - 4 * s, hx, hy + (carrying ? 10 * s : 0), 8 * s, claw, d);
        c.fillStyle = claw;
        if (carrying) { // the pincer gripping the pole: a jaw above it and one below
          c.beginPath(); c.ellipse(hx, hy - 12 * s, 14 * s, 8 * s, 0, 0, TAU); c.fill();
          c.beginPath(); c.ellipse(hx, hy + 8 * s, 13 * s, 7 * s, 0, 0, TAU); c.fill();
        } else {
          const open = 0.35 + 0.25 * Math.sin(t * 10 + d);
          c.beginPath(); c.ellipse(hx, hy, 16 * s, 22 * s, d * 0.3, 0, TAU); c.fill();
          c.fillStyle = '#120d1d'; c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx + d * 18 * s * open, hy - 22 * s); c.lineTo(hx - d * 4 * s, hy - 24 * s); c.closePath(); c.fill();
        }
      }
      c.strokeStyle = col; c.lineWidth = 6 * s;
      c.beginPath(); c.moveTo(x - 14 * s, cy - 18 * s); c.lineTo(x - 18 * s, cy - 46 * s); c.moveTo(x + 14 * s, cy - 18 * s); c.lineTo(x + 18 * s, cy - 46 * s); c.stroke();
      c.fillStyle = col; c.beginPath(); c.ellipse(x, cy, 50 * s, 30 * s * (1 - 0.1 * st), 0, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.ellipse(x - 14 * s, cy - 10 * s, 18 * s, 8 * s, -0.2, 0, TAU); c.fill();
      eyes(c, x, cy - 50 * s, s * 0.9, 36, carrying ? -0.8 : 0.2, t, seed);
      break;
    }
    case 'anchor': {
      const col = '#5a6070', hi = '#8a90a0';
      const top = carrying ? o.poleY! : feet - 132 * s;
      c.strokeStyle = col; c.lineCap = 'round';
      c.lineWidth = 12 * s; c.beginPath(); c.moveTo(x, top + 12 * s); c.lineTo(x, feet - 12 * s); c.stroke();
      c.lineWidth = 10 * s; c.beginPath(); c.moveTo(x - 30 * s, top + 36 * s); c.lineTo(x + 30 * s, top + 36 * s); c.stroke();
      c.fillStyle = col; for (const d of [-1, 1]) { c.beginPath(); c.arc(x + d * 32 * s, top + 36 * s, 7 * s, 0, TAU); c.fill(); }
      c.lineWidth = 12 * s; c.beginPath(); c.arc(x, feet - 52 * s, 40 * s, 0.25, Math.PI - 0.25); c.stroke();
      for (const d of [-1, 1]) { // the flukes
        const fx = x + d * 39 * s, fy = feet - 42 * s;
        c.beginPath(); c.moveTo(fx, fy - 16 * s); c.lineTo(fx + d * 12 * s, fy + 6 * s); c.lineTo(fx - d * 8 * s, fy + 2 * s); c.closePath(); c.fill();
      }
      c.strokeStyle = hi; c.lineWidth = 3 * s; c.beginPath(); c.moveTo(x - 3 * s, top + 20 * s); c.lineTo(x - 3 * s, feet - 30 * s); c.stroke();
      // the ring at the top: hooked over the pole when carrying
      c.strokeStyle = col; c.lineWidth = 7 * s; c.beginPath(); c.arc(x, top, 13 * s, 0, TAU); c.stroke();
      break;
    }
    case 'helmet': {
      const cy = feet - 58 * s - 4 * s * st;
      c.strokeStyle = '#3a3a48'; c.lineWidth = 9 * s; c.lineCap = 'round';
      if (!o.ride) { c.beginPath(); c.moveTo(x - 12 * s, cy + 40 * s); c.lineTo(x - 15 * s, feet - 5 * s); c.moveTo(x + 12 * s, cy + 40 * s); c.lineTo(x + 15 * s, feet - 5 * s); c.stroke(); }
      else { c.beginPath(); c.moveTo(x - 12 * s, cy + 40 * s); c.lineTo(x - 16 * s, cy + 70 * s + 5 * Math.sin(t * 9)); c.moveTo(x + 12 * s, cy + 40 * s); c.lineTo(x + 16 * s, cy + 70 * s + 5 * Math.sin(t * 9 + 2)); c.stroke(); }
      c.fillStyle = '#2a2a33'; for (const d of [-1, 1]) { c.beginPath(); c.ellipse(x + d * 17 * s, o.ride ? cy + 74 * s : feet - 4 * s, 11 * s, 6 * s, 0, 0, TAU); c.fill(); }
      const hs = hands(x, 34, cy, o, s, [44, 20], 24);
      for (const [i, [hx, hy]] of hs.entries()) {
        const d = i ? 1 : -1;
        limb(c, x + d * 32 * s, cy + 6 * s, hx, hy, 9 * s, '#3a3a48', d);
        c.fillStyle = '#2a2a33'; c.beginPath(); c.arc(hx, hy, 8 * s, 0, TAU); c.fill();
      }
      c.fillStyle = '#8a6a2e'; c.fillRect(x - 40 * s, cy + 28 * s, 80 * s, 14 * s);
      c.fillStyle = '#b98a3e'; c.beginPath(); c.arc(x, cy, 37 * s, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,240,200,0.3)'; c.beginPath(); c.ellipse(x - 14 * s, cy - 16 * s, 10 * s, 14 * s, -0.5, 0, TAU); c.fill();
      c.fillStyle = '#10202c'; c.beginPath(); c.arc(x, cy + 2 * s, 18 * s, 0, TAU); c.fill();
      c.strokeStyle = '#d9b070'; c.lineWidth = 5 * s; c.beginPath(); c.arc(x, cy + 2 * s, 18 * s, 0, TAU); c.stroke();
      c.fillStyle = '#d9b070'; for (let k = 0; k < 4; k++) { const a = k * TAU / 4 + 0.78; c.beginPath(); c.arc(x + Math.cos(a) * 26 * s, cy + 2 * s + Math.sin(a) * 26 * s, 3 * s, 0, TAU); c.fill(); }
      eyes(c, x, cy + 2 * s, s * 0.42, 22, carrying ? -0.8 : 0, t, seed); // the hermit inside
      break;
    }
    case 'stone': {
      const r = 42 * s, cy = feet - r * 0.98;
      const hs = hands(x, 30, cy, o, s, [46, 10], 24);
      for (const [i, [hx, hy]] of hs.entries()) {
        const d = i ? 1 : -1;
        limb(c, x + d * r * 0.7, cy - r * 0.2, hx, hy, 0.11 * r * 1.4, '#d9cfb8', d, '#3a2f2a');
        c.fillStyle = '#d9cfb8'; c.strokeStyle = '#3a2f2a'; c.lineWidth = 2 * s; c.beginPath(); c.arc(hx, hy, 7 * s, 0, TAU); c.fill(); c.stroke();
      }
      stone(c, x, cy, r, { seed: 40 + seed, heart: HEX.pink, heartA: 0.2 + 0.75 * clamp(o.heart ?? 0), tilt: 0.05 * Math.sin(t * 2 + seed), glow: (o.heart ?? 0) > 0.3 ? HEX.pink : undefined, glowA: 0.5 * clamp(o.heart ?? 0) });
      break;
    }
    case 'bell': {
      const hs = hands(x, 30, feet - 50 * s, o, s, [40, 10], 22);
      for (const [i, [hx, hy]] of hs.entries()) {
        const d = i ? 1 : -1;
        limb(c, x + d * 26 * s, feet - 52 * s, hx, hy, 7 * s, '#8a6a2e', d);
        c.fillStyle = '#8a6a2e'; c.beginPath(); c.arc(hx, hy, 6 * s, 0, TAU); c.fill();
      }
      bellBody(c, x, feet, s, t, seed, 'stand');
      break;
    }
    case 'jelly': {
      const cy = feet - 70 * s + 6 * s * Math.sin(t * 3 + seed);
      c.strokeStyle = 'rgba(255,170,220,0.75)'; c.lineWidth = 3 * s;
      for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(x + k * 12 * s, cy); c.quadraticCurveTo(x + k * 12 * s + 8 * Math.sin(t * 3 + k), cy + 34 * s, x + k * 12 * s, cy + 60 * s); c.stroke(); }
      c.fillStyle = 'rgba(255,170,220,0.9)'; c.beginPath(); c.arc(x, cy, 40 * s, Math.PI, 0); c.closePath(); c.fill();
      eyes(c, x, cy - 14 * s, s * 0.8, 26, 0, t, seed);
      break;
    }
  }
  // the strain: a sweat drop flicking off
  if (st > 0.3 && kind !== 'anchor' && kind !== 'bell') {
    const u = ((t * 1.6 + h01(seed, 9)) % 1);
    sweatDrop(c, x + 40 * s, feet - 110 * s + u * 30 * s, 9 * s * st);
  }
  c.restore();
}

function bellBody(c: C2, x: number, base: number, s: number, t: number, seed: number, mode: 'stand' | 'hang') {
  const top = base - 86 * s;
  if (mode === 'stand') { c.fillStyle = '#5a4020'; for (const d of [-1, 1]) { c.beginPath(); c.ellipse(x + d * 14 * s, base - 2 * s, 10 * s, 6 * s, 0, 0, TAU); c.fill(); } }
  c.strokeStyle = '#8a6a2e'; c.lineWidth = 6 * s; c.beginPath(); c.arc(x, top - 6 * s, 9 * s, 0, TAU); c.stroke();
  c.fillStyle = '#c9a24a';
  c.beginPath(); c.moveTo(x - 40 * s, base - 10 * s); c.quadraticCurveTo(x - 32 * s, top + 22 * s, x, top); c.quadraticCurveTo(x + 32 * s, top + 22 * s, x + 40 * s, base - 10 * s); c.closePath(); c.fill();
  c.fillStyle = '#a8842e'; c.fillRect(x - 42 * s, base - 16 * s, 84 * s, 8 * s);
  c.fillStyle = 'rgba(255,240,190,0.35)'; c.beginPath(); c.ellipse(x - 14 * s, top + 30 * s, 6 * s, 20 * s, 0.2, 0, TAU); c.fill();
  const sw = mode === 'hang' ? 6 * s * Math.sin(t * 7 + seed + 1) : 0;
  c.fillStyle = '#6a4a20'; c.beginPath(); c.arc(x + sw, base - 2 * s, 8 * s, 0, TAU); c.fill();
}

// ------------------------------------------------------------------ the pole, the posts, the lever

/** The long pole, wood with gold end bands, from x0 to x1 at y. */
export function pole(c: C2, g: C2 | null, x0: number, x1: number, y: number, glow = 0) {
  c.save(); c.lineCap = 'round';
  c.strokeStyle = '#3c2614'; c.lineWidth = 26; c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
  c.strokeStyle = '#a07a4a'; c.lineWidth = 19; c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
  c.strokeStyle = '#e0bb80'; c.lineWidth = 5; c.beginPath(); c.moveTo(x0 + 6, y - 5); c.lineTo(x1 - 6, y - 5); c.stroke();
  c.strokeStyle = HEX.gold; c.lineWidth = 22;
  for (const bx of [x0 + 18, x0 + 34, x1 - 34, x1 - 18]) { c.beginPath(); c.moveTo(bx - 3, y); c.lineTo(bx + 3, y); c.stroke(); }
  c.restore();
  if (g && glow > 0.01) {
    g.save(); g.lineCap = 'round'; g.strokeStyle = rgbaHex(HEX.gold, 0.5 * glow); g.lineWidth = 34;
    g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); g.restore();
  }
}

/**
 * A ratchet post at x (side -1 left, 1 right): an iron column with teeth on its inner edge, a brass collar holding the
 * pole's end at poleY, and on each click (times) a spark and a "CLICK!".
 */
export function ratchetPost(c: C2, g: C2, x: number, floor: number, poleY: number, t: number, clicks: number[], side: -1 | 1) {
  const top = floor - 380, dir = -side, ix = x + dir * 13;
  c.save();
  c.fillStyle = '#1e1826'; c.fillRect(x - 36, floor - 14, 72, 16);
  c.fillStyle = '#3b3446'; c.fillRect(x - 13, top, 26, floor - top - 14);
  c.fillStyle = '#5a5068'; c.fillRect(x - 9, top, 4, floor - top - 14);
  c.fillStyle = '#2a2433';
  c.beginPath();
  for (let k = -3; k <= 9; k++) {
    const y = LK.pole0 - k * LK.notch + 10;
    if (y < top + 10 || y > floor - 20) continue;
    c.moveTo(ix, y - 12); c.lineTo(ix + dir * 10, y); c.lineTo(ix, y);
  }
  c.fill();
  c.fillStyle = HEX.gold; c.beginPath(); c.arc(x, top - 6, 11, 0, TAU); c.fill();
  // the collar and its pawl
  c.fillStyle = '#b98a3e'; c.beginPath(); c.roundRect(x - 24, poleY - 20, 48, 40, 6); c.fill();
  c.strokeStyle = '#6a4a20'; c.lineWidth = 3; c.stroke();
  c.fillStyle = '#e8c27a'; for (const [dx, dy] of [[-16, -12], [16, -12], [-16, 12], [16, 12]]) { c.beginPath(); c.arc(x + dx!, poleY + dy!, 3, 0, TAU); c.fill(); }
  c.strokeStyle = '#6a4a20'; c.lineWidth = 6; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x + dir * 20, poleY + 14); c.lineTo(ix + dir * 6, poleY + 26); c.stroke();
  c.restore();
  for (const tc of clicks) {
    const age = t - tc;
    if (age < 0 || age > 0.45) continue;
    const u = age / 0.45, sx = ix + dir * 18, sy = poleY + 10;
    for (let i = 0; i < 6; i++) { // sparks
      const a = -Math.PI / 2 + dir * (0.2 + i * 0.25) + (h01(i, Math.round(tc * 10), 3) - 0.5) * 0.4, d = 20 + 90 * ease.outCubic(u) * (0.6 + 0.6 * h01(i, 4));
      star4(g, sx + Math.cos(a) * d, sy + Math.sin(a) * d + 60 * u * u, 9 * (1 - u), HEX.yellow);
    }
    c.save();
    const k = age < 0.12 ? 0.6 + 0.4 * ease.outBack(age / 0.12) : 1;
    c.globalAlpha = 1 - clamp((u - 0.6) / 0.4);
    c.translate(sx + dir * 60, sy - 50 - 30 * u); c.rotate(dir * 0.12); c.scale(k, k);
    c.font = font(FAM.hook(), 34); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = 7; c.strokeStyle = HEX.ink; c.lineJoin = 'round'; c.strokeText('CLICK!', 0, 0);
    c.fillStyle = HEX.yellow; c.fillText('CLICK!', 0, 0);
    c.restore();
  }
}

/**
 * The stage-lift control in the right wing: a brass box on legs with a dial (seabed .. surface) and a big lever.
 * `pull` 0 (up) .. 1 (yanked down); `dial` 0 (seabed) .. 1 (the surface, a moon).
 */
export function liftLever(c: C2, g: C2, x: number, floor: number, t: number, pull: number, dial: number) {
  c.save();
  const top = floor - 262;
  c.fillStyle = '#2a1d14'; c.fillRect(x - 40, floor - 16, 80, 18);
  c.fillStyle = '#5a3c20'; c.beginPath(); c.roundRect(x - 34, top, 68, floor - top - 14, 8); c.fill();
  c.strokeStyle = '#b98a3e'; c.lineWidth = 4; c.stroke();
  c.fillStyle = '#7a5530'; for (let k = 0; k < 4; k++) c.fillRect(x - 30, top + 90 + k * 36, 60, 4);
  // the plate
  c.fillStyle = '#c99a5a'; c.fillRect(x - 28, top + 58, 56, 22);
  c.font = font(FAM.monoB(), 12); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#3d2716';
  c.fillText('LIFT', x, top + 69);
  // the dial on top
  const dy = top - 6, r = 36;
  c.fillStyle = '#b98a3e'; c.beginPath(); c.arc(x, dy, r + 6, Math.PI, 0); c.closePath(); c.fill();
  c.fillStyle = '#f4efe1'; c.beginPath(); c.arc(x, dy, r, Math.PI, 0); c.closePath(); c.fill();
  c.strokeStyle = '#3d2716'; c.lineWidth = 2;
  for (let k = 0; k <= 6; k++) { const a = Math.PI + (k / 6) * Math.PI; c.beginPath(); c.moveTo(x + Math.cos(a) * r * 0.78, dy + Math.sin(a) * r * 0.78); c.lineTo(x + Math.cos(a) * r * 0.95, dy + Math.sin(a) * r * 0.95); c.stroke(); }
  c.fillStyle = '#e8c27a'; c.beginPath(); c.arc(x + r * 0.62, dy - r * 0.5, 7, 0, TAU); c.fill();         // the moon at the surface end
  c.fillStyle = '#f4efe1'; c.beginPath(); c.arc(x + r * 0.62 + 3.5, dy - r * 0.5 - 2, 6, 0, TAU); c.fill();
  c.fillStyle = '#c9a26a'; c.fillRect(x - r * 0.85, dy - 6, 12, 5);                                         // the sand at the seabed end
  const na = Math.PI + clamp(dial) * Math.PI * 0.94 + 0.03 * Math.PI;
  c.strokeStyle = '#c0302a'; c.lineWidth = 3; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, dy); c.lineTo(x + Math.cos(na) * r * 0.85, dy + Math.sin(na) * r * 0.85); c.stroke();
  c.fillStyle = '#3d2716'; c.beginPath(); c.arc(x, dy, 4, 0, TAU); c.fill();
  // the lever on its left side
  const px = x - 34, py = top + 150, a = -2.2 - 1.5 * clamp(pull) - Math.PI, L = 120;
  c.strokeStyle = '#2a2a33'; c.lineWidth = 11;
  c.beginPath(); c.moveTo(px, py); c.lineTo(px - Math.sin(-a) * 0 + Math.cos(a + Math.PI) * L, py + Math.sin(a + Math.PI) * L); c.stroke();
  const kx = px + Math.cos(a + Math.PI) * L, ky = py + Math.sin(a + Math.PI) * L;
  c.fillStyle = '#e0302a'; c.beginPath(); c.arc(kx, ky, 15, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.45)'; c.beginPath(); c.arc(kx - 4, ky - 5, 5, 0, TAU); c.fill();
  c.fillStyle = '#b98a3e'; c.beginPath(); c.arc(px, py, 10, 0, TAU); c.fill();
  c.restore();
  g.fillStyle = rgbaHex('#fff3c8', 0.12); g.beginPath(); g.arc(x, dy, r + 10, Math.PI, 0); g.fill();
}
/** Where the lever's knob is, for the octopus's tentacle. */
export function leverKnob(x: number, floor: number, pull: number): [number, number] {
  const top = floor - 262, px = x - 34, py = top + 150, a = -2.2 - 1.5 * clamp(pull);
  return [px + Math.cos(a) * 120, py + Math.sin(a) * 120];
}

/**
 * The octopus's cue card, held up on a tentacle from the octopus at (ox, oy), flipping from `a` to `b` over 0.22 s
 * from t0 (the card turns on its vertical axis; the new side shows from half way).
 */
export function cueCard(c: C2, ox: number, oy: number, cx: number, cy: number, s: number, t: number, a: string, b: string, t0: number, col = '#c65cf0') {
  const u = clamp((t - t0) / 0.22), text = u < 0.5 ? a : b, sx = Math.max(0.04, Math.abs(Math.cos(u * Math.PI)));
  const bob = 4 * Math.sin(t * 3);
  c.save();
  c.strokeStyle = col; c.lineWidth = 12 * s; c.lineCap = 'round';
  c.beginPath(); c.moveTo(ox - 30 * s, oy - 20 * s); c.quadraticCurveTo(ox - 60 * s, cy + 70 * s, cx + 10 * s, cy + 34 * s + bob); c.stroke();
  c.translate(cx, cy + bob); c.rotate(0.05 * Math.sin(t * 2.6));
  const pop = t >= t0 && t < t0 + 0.35 ? 1 + 0.12 * Math.sin(clamp((t - t0) / 0.35) * Math.PI) : 1;
  c.scale(sx * pop, pop);
  c.font = font(FAM.hook(), 40 * s);
  const tw = Math.max(170 * s, c.measureText(text).width + 44 * s);
  c.fillStyle = u >= 0.5 && b.startsWith('LIFT') ? '#fff3c8' : '#f4f1ea';
  c.beginPath(); c.roundRect(-tw / 2, -44 * s, tw, 88 * s, 9 * s); c.fill();
  c.strokeStyle = '#2a1d14'; c.lineWidth = 4 * s; c.stroke();
  c.fillStyle = u >= 0.5 && b.startsWith('LIFT') ? '#c0302a' : '#120d1d'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(text, 0, 3 * s);
  c.restore();
}

// ------------------------------------------------------------------ the studio screen: the depth gauge

export interface DepthOpts { depth: number; level: number; msg?: string | null; msgCol?: string; flash?: number }
/** For `studio({ screen })`: STAGE LIFT, a gauge from the seabed to the moonlit surface, the depth, a message. */
export function depthScreen(o: DepthOpts, t: number) {
  return (c: C2, g: C2, x: number, y: number, w: number, h: number) => {
    const bg = c.createLinearGradient(x, y, x, y + h);
    bg.addColorStop(0, '#0e2a4a'); bg.addColorStop(1, '#06101e');
    c.fillStyle = bg; c.fillRect(x, y, w, h);
    c.font = font(FAM.monoB(), 22); c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillStyle = HEX.cyan;
    c.fillText('STAGE LIFT', x + 76, y + 34);
    // the gauge: sand at the bottom, a moon at the top, the stage's marker between
    const gx = x + 44, g0 = y + h - 44, g1 = y + 66;
    c.strokeStyle = 'rgba(47,224,255,0.45)'; c.lineWidth = 3; c.beginPath(); c.moveTo(gx, g0); c.lineTo(gx, g1); c.stroke();
    for (let k = 0; k <= 8; k++) { const yy = g0 + (g1 - g0) * k / 8; c.beginPath(); c.moveTo(gx - 7, yy); c.lineTo(gx + 7, yy); c.stroke(); }
    c.fillStyle = '#c9a26a'; c.fillRect(gx - 18, g0 + 8, 36, 8);
    c.fillStyle = '#f4efe1'; c.beginPath(); c.arc(gx, g1 - 18, 10, 0, TAU); c.fill();
    c.fillStyle = '#0e2a4a'; c.beginPath(); c.arc(gx + 5, g1 - 21, 9, 0, TAU); c.fill();
    const my = g0 + (g1 - g0) * clamp(o.level);
    c.fillStyle = HEX.yellow; c.beginPath(); c.roundRect(gx - 16, my - 7, 32, 14, 3); c.fill();
    g.fillStyle = rgbaHex(HEX.yellow, 0.5); g.beginPath(); g.arc(gx, my, 18, 0, TAU); g.fill();
    // the depth
    c.font = font(FAM.mono(), 20); c.fillStyle = 'rgba(154,200,230,0.9)'; c.textAlign = 'center';
    c.fillText('DEPTH', x + w * 0.56, y + 84);
    const num = `${Math.max(0, Math.round(o.depth))} m`;
    c.font = font(FAM.monoB(), 78); c.fillStyle = mixHex(HEX.cyan, '#ffffff', clamp(o.flash ?? 0));
    c.fillText(num, x + w * 0.56, y + 150);
    g.font = c.font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = rgbaHex(HEX.cyan, 0.35 + 0.4 * clamp(o.flash ?? 0)); g.fillText(num, x + w * 0.56, y + 150);
    if (o.msg && Math.floor(t * 5) % 2 === 0) {
      c.font = font(FAM.hook(), 28); c.fillStyle = o.msgCol ?? HEX.yellow;
      const k = Math.min(1, (w - 110) / c.measureText(o.msg).width);
      c.font = font(FAM.hook(), 28 * k);
      c.fillText(o.msg, x + w * 0.56, y + 214);
    }
    scanlines(c, x, y, w, h, 0.12, 4);
  };
}

// ------------------------------------------------------------------ the open sea above (the rise)

/**
 * Above the wreck as it rises: the water lightening to the surface at `sy` (canvas y, above the set), the moon's
 * blur through it and its shafts of light coming down. Draw before the set (the set covers its lower part).
 */
export function seaAbove(c: C2, g: C2, t: number, sy: number, glow: number) {
  const top = sy - 400;
  const gr = c.createLinearGradient(0, top, 0, 0);
  gr.addColorStop(0, '#9fc8ff'); gr.addColorStop(0.32, '#5a8ad6'); gr.addColorStop(0.6, '#2a4a9a'); gr.addColorStop(1, '#0d1640');
  c.fillStyle = gr; c.fillRect(-W, top, W * 3, -top + 4);
  // the surface seen from below: a bright rippling band, Snell's window round the moon
  c.fillStyle = 'rgba(220,236,255,0.85)';
  c.beginPath(); c.moveTo(-W, sy);
  for (let x = -W; x <= W * 2; x += 40) c.lineTo(x, sy + 10 * Math.sin(x * 0.012 + t * 2.4) + 5 * Math.sin(x * 0.031 - t * 3.1));
  c.lineTo(W * 2, top); c.lineTo(-W, top); c.closePath(); c.fill();
  const mx = W * 0.68, my = sy - 30;
  const mg = g.createRadialGradient(mx, my, 0, mx, my, 360);
  mg.addColorStop(0, rgbaHex('#fff4d6', 0.9 * glow)); mg.addColorStop(0.25, rgbaHex('#cfe6ff', 0.35 * glow)); mg.addColorStop(1, 'rgba(160,200,255,0)');
  g.fillStyle = mg; g.beginPath(); g.arc(mx, my, 360, 0, TAU); g.fill();
  c.save(); c.globalCompositeOperation = 'screen';
  for (let k = 0; k < 7; k++) {
    const a = 0.18 * (k - 3) + 0.05 * Math.sin(t * 0.8 + k), L = 1400, x0 = mx + (k - 3) * 30;
    const rg = c.createLinearGradient(x0, my, x0 + Math.sin(a) * L, my + L);
    rg.addColorStop(0, `rgba(220,236,255,${0.22 * glow})`); rg.addColorStop(1, 'rgba(220,236,255,0)');
    c.fillStyle = rg;
    c.beginPath(); c.moveTo(x0 - 14, my); c.lineTo(x0 + 14, my); c.lineTo(x0 + Math.sin(a) * L + 90, my + L); c.lineTo(x0 + Math.sin(a) * L - 90, my + L); c.closePath(); c.fill();
  }
  c.restore();
}

/** Bubbles streaming down past the camera as the studio rises (speed px/s); ring outlines with a glint. */
export function bubblesDown(c: C2, t: number, n: number, speed: number, seed = 5, y0 = -200, y1 = H + 100) {
  c.save(); c.strokeStyle = 'rgba(200,235,255,0.6)';
  for (let i = 0; i < n; i++) {
    const x = h01(i, seed, 1) * W + 12 * Math.sin(t * 2 + i), r = 4 + 12 * h01(i, seed, 2);
    const span = y1 - y0, y = y0 + ((h01(i, seed, 3) * span + t * speed * (0.6 + 0.7 * h01(i, seed, 4))) % span);
    c.lineWidth = 1.5 + r * 0.08; c.beginPath(); c.ellipse(x, y, r * 0.8, r * 1.25, 0, 0, TAU); c.stroke();
  }
  c.restore();
}

/** A small heart over a creature's head (joy at riding). */
export function joyHeart(c: C2, x: number, y: number, s: number, t: number, t0: number) {
  const age = t - t0;
  if (age < 0) return;
  const u = (age % 1.4) / 1.4;
  heart(c, x, y - 30 * u, 12 * s * (1 - 0.3 * u), `rgba(255,79,154,${1 - u})`);
}

/**
 * Erase the glow layer under the lower third's plate (the glow is added over everything, and nothing may sit on top of
 * the lyric): the same geometry as `lowerThird` (size 48 at H - 112, rows by `balancedRows`, the slant).
 */
export function cutLowerThird(g: C2, line: Line | undefined, t: number, size = 48, y = H - 112) {
  if (!line || t < line.words[0]!.start - 0.4) return;
  g.save();
  g.font = font(FAM.bold(), size);
  const sp = g.measureText(' ').width, ws = line.words.map((w) => g.measureText(w.w).width);
  const rows = balancedRows(g, line, W - 360);
  const rowWs = rows.map((r) => r.reduce((a, i) => a + ws[i]!, 0) + sp * (r.length - 1));
  const ph = rows.length * size * 1.2 + 34, pw = Math.max(...rowWs) + 110;
  g.setTransform(1, 0, 0, 1, 0, 0);
  const m = new DOMMatrix().translateSelf(W / 2, y).multiplySelf(new DOMMatrix([1, 0, -0.18, 1, 0, 0]));
  g.globalCompositeOperation = 'destination-out'; g.globalAlpha = 1; g.fillStyle = '#000';
  g.beginPath();
  const pts = [[-pw / 2 - 40, -ph / 2 - 14], [pw / 2 + 140, -ph / 2 - 14], [pw / 2 + 140, ph / 2 + 10], [-pw / 2 - 40, ph / 2 + 10]];
  pts.forEach(([px, py], i) => { const q = m.transformPoint(new DOMPoint(px, py)); i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y); });
  g.closePath(); g.fill();
  g.restore();
}

/** The front row of the stands seen from the stage, empty now: dark clam-shell backs, a popcorn tub left on one. */
export function emptySeats(c: C2, t: number) {
  c.save();
  for (let i = 0; i < 14; i++) {
    const x = -30 + i * 152 + 10 * h01(i, 3), top = H - 150 + 16 * h01(i, 4);
    c.fillStyle = '#140d1d';
    c.beginPath(); c.moveTo(x - 76, H + 20); c.quadraticCurveTo(x - 84, top, x, top - 12); c.quadraticCurveTo(x + 84, top, x + 76, H + 20); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(233,201,168,0.16)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(x - 70, top + 30); c.quadraticCurveTo(x, top - 18, x + 70, top + 30); c.stroke();
    if (i === 3) { // a popcorn tub left behind, a few pieces on the seat
      c.fillStyle = '#f4f1ea'; c.beginPath(); c.moveTo(x + 20, top + 6); c.lineTo(x + 64, top + 6); c.lineTo(x + 58, top + 56); c.lineTo(x + 26, top + 56); c.closePath(); c.fill();
      c.fillStyle = '#e0302a'; c.fillRect(x + 28, top + 10, 6, 44); c.fillRect(x + 44, top + 10, 6, 44);
      c.fillStyle = '#fff6d8'; for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(x + 26 + k * 7, top + 2 - 4 * Math.sin(k * 2), 6, 0, TAU); c.fill(); }
    }
    if (i === 10) { // a foam finger dropped on the seat
      c.save(); c.translate(x - 20, top + 30); c.rotate(-0.5);
      c.fillStyle = HEX.yellow; c.beginPath(); c.roundRect(-14, -50, 28, 64, 8); c.fill(); c.beginPath(); c.roundRect(-8, -86, 16, 44, 7); c.fill();
      c.restore();
    }
  }
  c.restore();
  void t;
}

/** A warm backlight along the line at chest height, so the silhouettes read against the dark wreck. */
export function backlight(c: C2, y: number, a: number, col = '#ffb36a') {
  if (a <= 0.01) return;
  c.save();
  const gr = c.createRadialGradient(W / 2, y, 40, W / 2, y, 900);
  gr.addColorStop(0, rgbaHex(col, 0.42 * a)); gr.addColorStop(0.6, rgbaHex(col, 0.2 * a)); gr.addColorStop(1, rgbaHex(col, 0));
  c.fillStyle = gr; c.beginPath(); c.ellipse(W / 2, y, 980, 230, 0, 0, TAU); c.fill();
  c.restore();
}

// ------------------------------------------------------------------ the line (shared with festival's breach)

/** Who stands where under the pole (dx from the centre): a creature first, then the person who takes its place. */
export const LINE: { dx: number; crit: Critter; seed: number; col?: string; human?: Who }[] = [
  { dx: -165, crit: 'fish', seed: 1, col: FISH_COLS[4], human: 'strangerB' },
  { dx: 165, crit: 'helmet', seed: 2, human: 'woman' },
  { dx: -280, crit: 'stone', seed: 3, human: 'strangerA' },
  { dx: 280, crit: 'crab', seed: 4, human: 'husband' },
  { dx: -395, crit: 'fish', seed: 5, col: FISH_COLS[0], human: 'trader' },
  { dx: 395, crit: 'stone', seed: 6, human: 'housekeeper' },
  { dx: -510, crit: 'crab', seed: 7, col: '#ff7a4a', human: 'panel1' },
  { dx: 510, crit: 'fish', seed: 8, col: FISH_COLS[5], human: 'panel2' },
  { dx: -625, crit: 'anchor', seed: 9 },
  { dx: 625, crit: 'bell', seed: 10, human: 'panel3' },
];
export const RIMS: Record<string, string> = { panel1: HEX.cyan, panel2: HEX.pink, panel3: HEX.gold, trader: HEX.gold, housekeeper: HEX.pink, husband: HEX.cyan, strangerA: HEX.lime, strangerB: HEX.yellow, woman: HEX.pink };
export const humanH = (who: Who) => LK.humanH * (who === 'woman' ? 0.97 : 1) * (who === 'panel3' ? 1.03 : 1);

/**
 * The whole line at the end of the lift, in the studio's coordinates: the posts, the pole at `poleY`, Rai (drawn by
 * `rai`), everyone holding it up with their arms raised and the creatures cheering at their feet.
 */
export function finalLine(c: C2, g: C2, t: number, poleY: number, rai: () => void, clicks: number[] = []) {
  LK.posts.forEach((px, i) => ratchetPost(c, g, px, LK.floor, poleY, t, clicks, i ? 1 : -1));
  pole(c, g, LK.posts[0] - 34, LK.posts[1] + 34, poleY, 0.2);
  rai();
  for (const sl of LINE) {
    const x = LK.cx + sl.dx;
    if (sl.human) cast(c, sl.human, x, LK.floor, humanH(sl.human), 'cheer', { col: HEX.ink, t, rim: RIMS[sl.human], flip: sl.dx > 0 && sl.human !== 'woman' });
    else critter(c, sl.crit, x, LK.floor, LK.critS, { t, seed: sl.seed, col: sl.col, poleY });
  }
  for (const sl of LINE) if (sl.human) critter(c, sl.crit, LK.cx + sl.dx + Math.sign(sl.dx) * 57, LK.floor + 50, LK.critS * 0.78, { t, seed: sl.seed, col: sl.col, cheer: 1, heart: 1 });
}
