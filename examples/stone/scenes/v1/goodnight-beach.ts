// goodnight's beach (TREATMENT-v1.md, the outro): the show's last segment, a wedding under the palms on the same
// night beach as the festival. One world in 1920x1080 world px that every broadcast camera of the plate looks at
// (the wide, CAM 2 on the arch, the crab gag, the close-up that becomes the living-room TV).
//
// Layers: the night island (sky, moon, sea, sand), the festival's last firework ring fading and a heart firework on
// "weddings", the show's stage standing at the waterline (the ring of bulbs and the rebuilt scoreboard of glows), huts
// and the stone bank, the back palms, a string of paper lanterns, the guests (the cast in leis: the strangers and the
// panellists; the trader carries the stone), the arch of two palms with its garland, the couple (the housekeeper and
// the husband from the dating segment, married at last), the stone on its pole, Rai (drawn by the plate), tiki
// torches, petals.
import { W } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { clamp, ease, frameIdx } from '../../engine/util';
import { h01 } from '../_rai';
import { TAU, rgbaHex, mixHex, stone, person, type Pose, type C2 } from '../_motifs';
import { island, palmTree, hut, stoneBank } from '../_world';
import { sweatDrop, puff } from '../_manga';
import { cast, type Who } from './_cast';
import { bulbRing, signBoard } from './_studio';

/** Where things stand in the beach world. */
export const BW = {
  hz: 500, bch: 690,
  rai: { x: 1330, feet: 872, R: 72 },
  husband: { x: 985, feet: 852 }, bride: { x: 1085, feet: 852 }, coupleH: 228,
  carry: { from: -80, to: 880, ground: 876, r: 40, gap: 165 },
  palmL: { x: 848, y: 846 }, palmR: { x: 1222, y: 846 }, palmH: 450,
  stage: { x: 330, y: 704 },
  crab: { ground: 874 },
};

const SIL = '#0f0b1d', WARM = '#ffb36b';
const FLOWERS = ['#ff4f9a', '#ffd23f', '#fff4e0', '#ff8a5a', '#ff7ac0'];

/** Event times the plate hands the world (all master seconds). */
export interface WedTimes {
  start: number;      // the plate's first frame (the festival's last ring is still fading)
  carry0: number;     // the stone's bearers walk in
  carry1: number;     // ...and arrive by the couple
  stones: number;     // "stones": the stone is set down and its heart lights
  weddings: number;   // "weddings": petals, the couple lean in, the guests cheer
  fw: number;         // the heart firework
  laugh: number;      // the guests laugh at the crab
}

// ------------------------------------------------------------------ small props

/** Flowers along a U (a lei): from (x - w, y) down through (x, y + d) to (x + w, y), flower radius r. */
export function lei(c: C2, x: number, y: number, w: number, d: number, r: number, seed = 0) {
  const n = Math.max(5, Math.round((2.4 * w) / (1.5 * r)));
  for (let i = 0; i < n; i++) {
    const s = i / (n - 1), u = 2 * s - 1, px = x + w * u, py = y + d * (1 - u * u);
    flower(c, px, py, r, FLOWERS[(i + seed) % FLOWERS.length]!);
  }
}

/** One flower: five petals and a centre (a dot when tiny). */
export function flower(c: C2, x: number, y: number, r: number, col: string) {
  c.fillStyle = col;
  if (r < 3) { c.beginPath(); c.arc(x, y, r * 1.1, 0, TAU); c.fill(); return; }
  c.beginPath();
  for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU - Math.PI / 2, px = x + Math.cos(a) * r * 0.55, py = y + Math.sin(a) * r * 0.55; c.moveTo(px + r * 0.55, py); c.arc(px, py, r * 0.55, 0, TAU); }
  c.fill();
  c.fillStyle = col === '#ffd23f' ? '#ff8a2a' : '#ffd23f';
  c.beginPath(); c.arc(x, y, r * 0.33, 0, TAU); c.fill();
}

/** A paper lantern hanging at (x, y) (its top), size s, glowing. */
export function paperLantern(c: C2, g: C2, x: number, y: number, s: number, col: string, t: number, i: number) {
  const sw = 0.06 * Math.sin(t * 1.7 + i * 1.3);
  c.save(); c.translate(x, y); c.rotate(sw);
  c.fillStyle = '#2a1d14'; c.fillRect(-s * 0.32, 0, s * 0.64, s * 0.14);
  c.fillStyle = mixHex(col, '#fff4d6', 0.35);
  c.beginPath(); c.ellipse(0, s * 0.72, s * 0.55, s * 0.62, 0, 0, TAU); c.fill();
  c.strokeStyle = rgbaHex('#7a3a1a', 0.45); c.lineWidth = Math.max(1, s * 0.05);
  for (const k of [-0.28, 0, 0.28]) { c.beginPath(); c.ellipse(0, s * 0.72, Math.abs(k) * s * 1.6 + 0.5, s * 0.6, 0, -Math.PI / 2, Math.PI / 2, k < 0); c.stroke(); }
  c.fillStyle = '#2a1d14'; c.fillRect(-s * 0.28, s * 1.3, s * 0.56, s * 0.12);
  c.restore();
  const fl = 0.85 + 0.15 * Math.sin(t * 9 + i * 2.1);
  g.fillStyle = rgbaHex(col, 0.22 * fl);
  g.beginPath(); g.arc(x, y + s * 0.72, s * 1.05, 0, TAU); g.fill();
  g.fillStyle = rgbaHex('#fff4d6', 0.3 * fl);
  g.beginPath(); g.arc(x, y + s * 0.72, s * 0.4, 0, TAU); g.fill();
}

/** A tiki torch planted in the sand at (x, y), height h, its flame alive. */
function tiki(c: C2, g: C2, x: number, y: number, h: number, t: number, i: number) {
  c.strokeStyle = '#3a2416'; c.lineWidth = h * 0.045; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h); c.stroke();
  c.fillStyle = '#5a3a20'; c.beginPath(); c.roundRect(x - h * 0.05, y - h * 1.08, h * 0.1, h * 0.12, h * 0.02); c.fill();
  const k = Math.floor(frameIdx(t) / 3), fx = x + 3 * Math.sin(t * 7 + i), fy = y - h * 1.08;
  for (let j = 0; j < 3; j++) {
    const s = h * (0.13 - j * 0.035) * (0.9 + 0.2 * h01(k, i, j)), col = ['#ff7a2a', '#ffb34a', '#fff1b0'][j]!;
    c.fillStyle = col;
    c.beginPath(); c.moveTo(fx - s, fy); c.quadraticCurveTo(fx - s * 0.9, fy - s * 1.6, fx + s * 0.25 * Math.sin(t * 11 + j), fy - s * 2.6); c.quadraticCurveTo(fx + s * 0.9, fy - s * 1.6, fx + s, fy); c.closePath(); c.fill();
  }
  g.fillStyle = rgbaHex('#ff9a3a', 0.3); g.beginPath(); g.arc(fx, fy - h * 0.1, h * 0.17, 0, TAU); g.fill();
  c.save(); c.translate(x, y + 4); c.scale(1, 0.2);
  const pg = c.createRadialGradient(0, 0, 0, 0, 0, h * 0.5);
  pg.addColorStop(0, 'rgba(255,154,58,0.28)'); pg.addColorStop(1, 'rgba(255,154,58,0)');
  c.fillStyle = pg; c.beginPath(); c.arc(0, 0, h * 0.5, 0, TAU); c.fill(); c.restore();
}

// ------------------------------------------------------------------ fireworks

/**
 * The festival's great ring (its last shot draws one gold ring round her over the bay), still hanging over the stage
 * as the plate opens: the same gold line and glitter, drooping, breaking into embers and fading.
 */
function emberRing(c: C2, g: C2, t: number, t0: number) {
  const age = t - t0;
  if (age < 0 || age > 3.4) return;
  const fade = Math.pow(1 - age / 3.4, 1.4), x = BW.stage.x, y = BW.stage.y - 150, r = 236, k = frameIdx(t);
  const sag = 26 * age * age, brk = clamp((age - 0.4) / 2);
  c.save(); g.save(); c.lineCap = 'round'; g.lineCap = 'round';
  const n = 90;
  for (let i = 0; i < n; i++) { // the ring as short arcs that part and droop as it breaks up
    const a0 = (i / n) * TAU, a1 = a0 + (TAU / n) * (1 - 0.75 * brk);
    const dy = sag * (0.6 + 0.4 * h01(i, 3)), dr = 18 * brk * (h01(i, 4) - 0.3);
    g.strokeStyle = rgbaHex(HEX.gold, 0.5 * fade); g.lineWidth = 14 * (1 - 0.5 * brk);
    g.beginPath(); g.arc(x, y + dy, r + dr, a0, a1); g.stroke();
    c.strokeStyle = rgbaHex(mixHex(HEX.gold, '#fff6e0', 0.5), fade); c.lineWidth = 3;
    c.beginPath(); c.arc(x, y + dy, r + dr, a0, a1); c.stroke();
  }
  c.fillStyle = rgbaHex('#fff6e0', fade);
  for (let i = 0; i < 70; i++) { // glitter falling off it
    if (h01(i, k, 5) < 0.45) continue;
    const a = h01(i, 6) * TAU, rr = r + (h01(i, k, 9) - 0.5) * 26, fall = (age * 60 * (0.5 + h01(i, 7))) % 120;
    c.beginPath(); c.arc(x + Math.cos(a) * rr, y + Math.sin(a) * rr + sag + fall, 2, 0, TAU); c.fill();
  }
  c.restore(); g.restore();
}

/** A heart-shaped burst over the arch: sparks along a heart curve, expanding, then drooping and fading. */
function heartFirework(c: C2, g: C2, t: number, t0: number, cx: number, cy: number, s: number) {
  const age = t - t0;
  if (age < -0.25 || age > 2.6) return;
  if (age < 0) { // the rocket's trail climbing
    const u = (age + 0.25) / 0.25, y = cy + 420 * (1 - u);
    g.fillStyle = rgbaHex(HEX.gold, 0.9); g.beginPath(); g.arc(cx, y, 5, 0, TAU); g.fill();
    c.strokeStyle = rgbaHex(HEX.gold, 0.5); c.lineWidth = 3; c.beginPath(); c.moveTo(cx, y); c.lineTo(cx, y + 90); c.stroke();
    return;
  }
  const grow = ease.outExpo(clamp(age / 0.45)), fade = age < 1 ? 1 : Math.pow(1 - (age - 1) / 1.6, 1.4), n = 64;
  for (let i = 0; i < n; i++) {
    const v = (i / n) * TAU;
    const hx = 16 * Math.pow(Math.sin(v), 3), hy = -(13 * Math.cos(v) - 5 * Math.cos(2 * v) - 2 * Math.cos(3 * v) - Math.cos(4 * v));
    const x = cx + hx * s * 0.06 * grow, y = cy + hy * s * 0.06 * grow + 30 * Math.max(0, age - 0.4) ** 2;
    const col = i % 2 ? HEX.pink : '#ffd1e6', tw = 0.65 + 0.35 * Math.sin(t * 24 + i * 2.3);
    g.fillStyle = rgbaHex(col, 0.85 * fade * tw); g.beginPath(); g.arc(x, y, 4.5, 0, TAU); g.fill();
    c.fillStyle = rgbaHex('#fff4fa', 0.8 * fade); c.beginPath(); c.arc(x, y, 1.8, 0, TAU); c.fill();
  }
  if (age < 0.12) { g.fillStyle = rgbaHex('#ffffff', 0.6 * (1 - age / 0.12)); g.beginPath(); g.arc(cx, cy, 60, 0, TAU); g.fill(); }
}

// ------------------------------------------------------------------ the far set: the show's stage at the waterline

function farStage(c: C2, g: C2, t: number) {
  const { x, y } = BW.stage;
  // the reflection of its bulbs in the wet sand
  g.fillStyle = rgbaHex(HEX.gold, 0.12); g.beginPath(); g.ellipse(x, y + 22, 170, 16, 0, 0, TAU); g.fill();
  bulbRing(c, g, x, y - 128, 92, t, 0.8, HEX.gold);
  signBoard(c, g, x, y - 262, t, 1, 0.24);
  // the rebuilt scoreboard beside it: three pink glows where numbers were (NIGHTS, MEALS, CARE)
  c.fillStyle = '#0c0a12'; c.beginPath(); c.roundRect(x - 196, y - 150, 74, 92, 6); c.fill();
  c.strokeStyle = '#6a5a3a'; c.lineWidth = 3; c.stroke();
  for (let k = 0; k < 3; k++) {
    const yy = y - 132 + k * 28, a = 0.75 + 0.25 * Math.sin(t * 2 + k);
    c.fillStyle = 'rgba(244,241,234,0.4)'; c.fillRect(x - 188, yy - 2, 28, 4);
    c.fillStyle = mixHex('#3a2030', HEX.pink, a); c.beginPath(); c.arc(x - 142, yy, 7, 0, TAU); c.fill();
    g.fillStyle = rgbaHex(HEX.pink, 0.5 * a); g.beginPath(); g.arc(x - 142, yy, 14, 0, TAU); g.fill();
  }
  // the stage itself, still wet from the sea
  c.fillStyle = '#2a1a24';
  c.beginPath(); c.moveTo(x - 190, y + 6); c.lineTo(x - 168, y - 32); c.lineTo(x + 200, y - 32); c.lineTo(x + 222, y + 6); c.closePath(); c.fill();
  c.fillStyle = '#140c12'; c.fillRect(x - 190, y + 6, 412, 14);
  for (let k = 0; k < 12; k++) {
    const fx = x - 175 + k * 34, on = 0.6 + 0.4 * Math.sin(t * 6 + k);
    c.fillStyle = mixHex('#5a4630', HEX.gold, on); c.beginPath(); c.arc(fx, y + 13, 3.2, 0, TAU); c.fill();
    g.fillStyle = rgbaHex(HEX.gold, 0.3 * on); g.beginPath(); g.arc(fx, y + 13, 7, 0, TAU); g.fill();
  }
  // drips still running off its lip
  c.fillStyle = 'rgba(160,200,255,0.5)';
  for (let k = 0; k < 6; k++) { const u = (t * 1.4 + h01(k, 9)) % 1, dx = x - 160 + k * 66; c.beginPath(); c.arc(dx, y + 22 + u * 18, 2, 0, TAU); c.fill(); }
}

// ------------------------------------------------------------------ the people

interface Guest { who?: Who; x: number; feet: number; h: number; pose: Pose; cheer?: boolean; flip?: boolean; lantern?: string; seed: number }
const GUESTS: Guest[] = [
  { x: 520, feet: 798, h: 168, pose: 'wave', seed: 11, cheer: true },
  { who: 'strangerB', x: 598, feet: 806, h: 196, pose: 'stand', seed: 12, cheer: true },
  { x: 676, feet: 800, h: 184, pose: 'point', lantern: HEX.orange, seed: 13 },
  { who: 'panel3', x: 752, feet: 810, h: 204, pose: 'stand', seed: 14, cheer: true },
  { who: 'panel1', x: 1418, feet: 808, h: 204, pose: 'stand', flip: true, seed: 15, cheer: true },
  { x: 1494, feet: 800, h: 182, pose: 'point', flip: true, lantern: HEX.pink, seed: 16 },
  { who: 'panel2', x: 1570, feet: 808, h: 198, pose: 'stand', flip: true, seed: 17, cheer: true },
  { x: 1652, feet: 800, h: 172, pose: 'point', flip: true, lantern: HEX.yellow, seed: 18 },
  { x: 1726, feet: 804, h: 160, pose: 'wave', flip: true, seed: 19, cheer: true },
];

/** A lei on a standing silhouette (feet at x, y; height h), at the neck. */
function neckLei(c: C2, x: number, y: number, h: number, seed: number) {
  const u = h / 100;
  lei(c, x, y - 79 * u, 8.5 * u, 9 * u, 2.4 * u, seed);
}

function guests(c: C2, g: C2, t: number, T: WedTimes) {
  const cheerOn = t >= T.weddings + 0.1, laugh = t >= T.laugh;
  for (const q of GUESTS) {
    const u = q.h / 100, f = q.flip ? -1 : 1;
    const pose: Pose = cheerOn && q.cheer && (Math.floor((t - T.weddings) * 2.3 + q.seed) % 3 !== 0) ? 'cheer' : q.pose;
    const bob = cheerOn && q.cheer ? 6 * Math.abs(Math.sin(t * 7 + q.seed)) : 2.5 * Math.abs(Math.sin(t * 7.33 / 2 + q.seed * 0.7));
    c.fillStyle = 'rgba(20,14,36,0.4)'; c.beginPath(); c.ellipse(q.x, q.feet + 2, 26 * u, 5 * u, 0, 0, TAU); c.fill();
    const o = { col: SIL, flip: q.flip, t, rim: WARM, emote: laugh && q.seed % 2 ? ('joy' as const) : undefined, emoteT0: T.laugh + 0.1 * (q.seed % 4) };
    if (q.who) cast(c, q.who, q.x, q.feet - bob, q.h, pose, o);
    else person(c, q.x, q.feet - bob, q.h, pose, { ...o, seed: q.seed });
    neckLei(c, q.x, q.feet - bob, q.h, q.seed);
    if (q.lantern && pose === 'point') { // a paper lantern on a short cord from the outstretched hand
      const hx = q.x + f * 40 * u, hy = q.feet - bob - 84 * u;
      c.strokeStyle = '#2a1d14'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx, hy + 10 * u); c.stroke();
      paperLantern(c, g, hx, hy + 10 * u, 9 * u, q.lantern, t, q.seed);
    }
  }
}

/** The couple under the arch: the husband (his tie) and the housekeeper (her headscarf), in leis, a veil, hands held. */
function couple(c: C2, g: C2, t: number, T: WedTimes) {
  const h = BW.coupleH, u = h / 100, lean = clamp((t - T.weddings - 0.15) / 0.35);
  const hb = BW.husband, br = BW.bride;
  cast(c, 'husband', hb.x, hb.feet, h, 'hug', { col: SIL, t, rim: WARM, headTilt: 0.32 * lean, emote: lean > 0.5 ? 'heart' : undefined, emoteT0: T.weddings + 0.4 });
  // the bride's veil, behind her: from the crown, falling down her back
  const hx = br.x, hy = br.feet - 88 * u, sway = 4 * Math.sin(t * 1.3);
  c.fillStyle = 'rgba(255,250,240,0.32)';
  c.beginPath(); c.moveTo(hx - 4 * u, hy - 8 * u);
  c.quadraticCurveTo(hx + 26 * u + sway, hy + 10 * u, hx + 24 * u + sway * 1.5, hy + 70 * u);
  c.lineTo(hx + 8 * u, hy + 66 * u); c.quadraticCurveTo(hx + 12 * u, hy + 20 * u, hx + 2 * u, hy + 4 * u); c.closePath(); c.fill();
  cast(c, 'housekeeper', br.x, br.feet, h, 'hug', { col: SIL, flip: true, t, rim: WARM, headTilt: 0.32 * lean, prop: false });
  // a crown of flowers on the bride, leis on both, a flower in his buttonhole
  const tilt = 0.32 * lean;
  for (let k = 0; k < 7; k++) { const a = Math.PI + 0.25 + (k / 6) * (Math.PI - 0.5) + tilt * -1; flower(c, hx + Math.cos(a) * 9.5 * u, hy + Math.sin(a) * 9.5 * u, 2.2 * u, FLOWERS[k % 5]!); }
  neckLei(c, hb.x, hb.feet, h, 1); neckLei(c, br.x, br.feet, h, 3);
  flower(c, hb.x + 5 * u, hb.feet - 70 * u, 2.6 * u, '#fff4e0');
  void g;
}

/** The stone on its pole, carried by the trader (front) and stranger A (behind), then set down by the couple. */
function bearers(c: C2, g: C2, t: number, T: WedTimes) {
  const K = BW.carry, h = 214, u = h / 100;
  const p = ease.outCubic(clamp((t - T.carry0) / (T.carry1 - T.carry0)));
  if (t < T.carry0 - 0.01) return;
  const fx = K.from + (K.to - K.from) * p, bx = fx - K.gap, walking = p < 1;
  const step = walking ? Math.abs(Math.sin((t - T.carry0) * 9)) * 6 : 0;
  const down = ease.inOutCubic(clamp((t - T.carry1) / 0.35)), done = down >= 1;
  const poleY0 = K.ground - 88 * u - step, rest = K.ground - K.r * 0.98;
  const sy = poleY0 + 4 + (rest - poleY0 - 4) * down, mx = (fx + bx) / 2 + 6 * u;
  // the pole (behind the stone: it shows through the hole)
  if (!done) {
    c.strokeStyle = '#8a6a44'; c.lineWidth = 7; c.lineCap = 'round';
    c.beginPath(); c.moveTo(bx - 30, sy - 4); c.lineTo(fx + 6 * u + 30, sy - 4); c.stroke();
  } else { // pulled out and laid on the sand
    c.strokeStyle = '#6f5436'; c.lineWidth = 7; c.lineCap = 'round';
    c.beginPath(); c.moveTo(bx - 40, K.ground + 6); c.lineTo(fx - 40, K.ground + 10); c.stroke();
  }
  const lit = clamp((t - T.stones) / 0.5);
  stone(c, mx, sy, K.r, { seed: 7, tilt: 0.05 * Math.sin(t * 3) * (1 - down), heart: lit > 0 ? HEX.pink : undefined, heartA: 0.9 * lit, glow: lit > 0 ? HEX.pink : undefined, glowA: 0.6 * lit });
  if (lit > 0) { g.fillStyle = rgbaHex(HEX.pink, 0.35 * lit); g.beginPath(); g.arc(mx, sy, K.r * 0.9, 0, TAU); g.fill(); }
  const pose: Pose = done ? 'cheer' : 'carry';
  c.fillStyle = 'rgba(20,14,36,0.4)'; c.beginPath(); c.ellipse(bx, K.ground + 2, 50, 9, 0, 0, TAU); c.ellipse(fx, K.ground + 2, 50, 9, 0, 0, TAU); c.fill();
  cast(c, 'strangerA', bx, K.ground - step * 0.5, h * 0.96, pose, { col: SIL, t, rim: WARM, prop: false });
  cast(c, 'trader', fx, K.ground - step, h, pose, { col: SIL, t, rim: WARM });
  neckLei(c, bx, K.ground - step * 0.5, h * 0.96, 2); neckLei(c, fx, K.ground - step, h, 4);
}

// ------------------------------------------------------------------ the crab (the gag)

export interface CrabOpts {
  t: number;
  /** walk: scuttling sideways; grip: claws on her; strain: heaving; flat: on its back, legs in the air. */
  pose: 'walk' | 'grip' | 'strain' | 'flat';
  /** Where the claws grip (canvas px, for grip and strain). */
  gx?: number; gy?: number;
  /** 0..1 the effort (redder, shaking, squeezed eyes, sweat). */
  effort?: number;
  /** 0..1 the white flag of surrender raised (flat). */
  flag?: number;
}

/** A guest crab in a bow tie and a tiny lei, at (x, ground y), scale s (its shell is about 90 s wide). */
export function crab(c: C2, x: number, y: number, s: number, o: CrabOpts) {
  const t = o.t, k = frameIdx(t), eff = o.effort ?? 0;
  const jx = o.pose === 'strain' ? 3 * s * (h01(k >> 1, 1, 61) - 0.5) * eff : 0, jy = o.pose === 'strain' ? 2 * s * (h01(k >> 1, 2, 61) - 0.5) * eff : 0;
  const shell = mixHex('#e8553a', '#ff2a3a', eff), claw = mixHex('#d0452d', '#ff2a3a', eff);
  c.save();
  c.translate(x + jx, y + jy);
  if (o.pose === 'flat') { // on its back: legs wiggling in the air, dizzy eyes
    c.fillStyle = 'rgba(30,20,40,0.3)'; c.beginPath(); c.ellipse(0, 4 * s, 52 * s, 9 * s, 0, 0, TAU); c.fill();
    c.strokeStyle = shell; c.lineWidth = 5 * s; c.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const side = i < 3 ? -1 : 1, j = i % 3, wig = 8 * s * Math.sin(t * 16 + i * 1.7);
      const bx = side * (14 + j * 12) * s, by = -18 * s;
      c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + side * 12 * s, by - 26 * s + wig); c.lineTo(bx + side * 18 * s + wig * 0.3, by - 44 * s); c.stroke();
    }
    c.fillStyle = shell; c.beginPath(); c.ellipse(0, -14 * s, 44 * s, 22 * s, 0, 0, TAU); c.fill();
    c.fillStyle = '#ffd9c8'; c.beginPath(); c.ellipse(0, -20 * s, 30 * s, 12 * s, 0, 0, TAU); c.fill();   // its pale belly
    for (const side of [-1, 1]) { // eyes on stalks flopped sideways, spiralling
      const ex = side * 52 * s, ey = -6 * s;
      c.strokeStyle = shell; c.lineWidth = 4 * s; c.beginPath(); c.moveTo(side * 30 * s, -10 * s); c.lineTo(ex, ey); c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(ex, ey, 8 * s, 0, TAU); c.fill();
      c.strokeStyle = '#120d1d'; c.lineWidth = 1.6 * s; c.beginPath();
      for (let i = 0; i <= 24; i++) { const a = (i / 24) * TAU * 2 + t * 10 * side, r = (i / 24) * 6 * s; i ? c.lineTo(ex + Math.cos(a) * r, ey + Math.sin(a) * r) : c.moveTo(ex, ey); }
      c.stroke();
    }
    // a claw up, waving a tiny white flag
    const fl = clamp(o.flag ?? 0);
    if (fl > 0) {
      const ax = 34 * s, ay = -30 * s - 30 * s * ease.outBack(fl);
      c.strokeStyle = claw; c.lineWidth = 6 * s; c.beginPath(); c.moveTo(20 * s, -24 * s); c.lineTo(ax, ay); c.stroke();
      c.strokeStyle = '#d9cfb8'; c.lineWidth = 2 * s; c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax + 2 * s, ay - 46 * s); c.stroke();
      const wv = 5 * s * Math.sin(t * 12);
      c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(ax + 2 * s, ay - 46 * s); c.quadraticCurveTo(ax + 18 * s, ay - 44 * s + wv, ax + 34 * s, ay - 40 * s); c.lineTo(ax + 2 * s, ay - 30 * s); c.closePath(); c.fill();
      c.fillStyle = claw; c.beginPath(); c.ellipse(ax, ay, 8 * s, 6 * s, -0.6, 0, TAU); c.fill();
    }
    c.restore();
    return;
  }
  const strain = o.pose === 'strain';
  const lean = strain ? 0.28 * eff : 0;
  // legs: three a side, scuttling or braced
  c.strokeStyle = shell; c.lineWidth = 5 * s; c.lineCap = 'round'; c.lineJoin = 'round';
  for (let i = 0; i < 6; i++) {
    const side = i < 3 ? -1 : 1, j = i % 3;
    const ph = o.pose === 'walk' ? Math.sin(t * 22 + i * 2.1) * 6 * s : 0;
    const brace = strain ? 10 * s : 0;
    const bx = side * (16 + j * 9) * s, by = -26 * s;
    c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + side * (20 + j * 4) * s + ph, by - 10 * s); c.lineTo(bx + side * (30 + j * 6) * s + ph + brace, -1 * s); c.stroke();
  }
  // the body, leaning back as it heaves
  c.save(); c.translate(0, -28 * s); c.rotate(lean);
  c.fillStyle = shell; c.beginPath(); c.ellipse(0, 0, 42 * s, 26 * s, 0, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.25)'; c.beginPath(); c.ellipse(-12 * s, -10 * s, 14 * s, 7 * s, -0.3, 0, TAU); c.fill();
  // a bow tie and a tiny lei: it is a wedding guest
  lei(c, 0, -2 * s, 26 * s, 8 * s, 3.2 * s, 2);
  c.fillStyle = '#120d1d';
  c.beginPath(); c.moveTo(0, 12 * s); c.lineTo(-10 * s, 6 * s); c.lineTo(-10 * s, 18 * s); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(0, 12 * s); c.lineTo(10 * s, 6 * s); c.lineTo(10 * s, 18 * s); c.closePath(); c.fill();
  c.beginPath(); c.arc(0, 12 * s, 3 * s, 0, TAU); c.fill();
  // eye stalks
  for (const side of [-1, 1]) {
    const ex = side * 12 * s, ey = -50 * s;
    c.strokeStyle = shell; c.lineWidth = 4.5 * s; c.beginPath(); c.moveTo(side * 8 * s, -18 * s); c.lineTo(ex, ey); c.stroke();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(ex, ey, 9 * s, 0, TAU); c.fill();
    if (strain && eff > 0.3) { // squeezed shut: > <
      c.strokeStyle = '#120d1d'; c.lineWidth = 2.4 * s;
      const d = -side * 5 * s;
      c.beginPath(); c.moveTo(ex - d, ey - 5 * s); c.lineTo(ex + d, ey); c.lineTo(ex - d, ey + 5 * s); c.stroke();
    } else {
      c.fillStyle = '#120d1d'; c.beginPath(); c.arc(ex - 3 * s, ey + 1 * s, 4.2 * s, 0, TAU); c.fill();
    }
  }
  c.restore();
  // the claws: raised while walking, gripping her while heaving
  const sh = [{ x: -30 * s, y: -34 * s }, { x: -22 * s, y: -18 * s }];
  sh.forEach((p, i) => {
    let tx: number, ty: number;
    if ((o.pose === 'grip' || strain) && o.gx !== undefined && o.gy !== undefined) { tx = o.gx - x - jx; ty = o.gy - y - jy + i * 16 * s; }
    else { tx = -50 * s - i * 6 * s; ty = -64 * s + i * 10 * s + 5 * s * Math.sin(t * 8 + i); }
    c.strokeStyle = claw; c.lineWidth = 7 * s;
    const ex = (p.x + tx) / 2 + 6 * s, ey = (p.y + ty) / 2 + 14 * s;
    c.beginPath(); c.moveTo(p.x, p.y); c.quadraticCurveTo(ex, ey, tx, ty); c.stroke();
    c.fillStyle = claw;
    c.beginPath(); c.ellipse(tx, ty, 14 * s, 10 * s, -0.4, 0, TAU); c.fill();
    c.fillStyle = mixHex(claw, '#000000', 0.25);
    c.beginPath(); c.moveTo(tx - 14 * s, ty - 2 * s); c.lineTo(tx - 4 * s, ty + 1 * s); c.lineTo(tx - 12 * s, ty + 6 * s); c.closePath(); c.fill();
  });
  c.restore();
  // the effort: sweat flying off, steam
  if (strain && eff > 0.2) {
    for (let i = 0; i < 4; i++) {
      const u = ((t * 1.6 + i * 0.27) % 1), side = i % 2 ? 1 : -1;
      c.save(); c.globalAlpha = 1 - u;
      sweatDrop(c, x + side * (30 + 60 * u) * s, y - (70 + 40 * Math.sin(u * Math.PI)) * s + 50 * u * u * s, 7 * s);
      c.restore();
    }
    const u = (t * 2.2) % 1;
    puff(c, x + 28 * s, y - (86 + 30 * u) * s, (10 + 8 * u) * s, `rgba(255,255,255,${0.8 * (1 - u)})`);
  }
}

// ------------------------------------------------------------------ petals

function petals(c: C2, t: number, t0: number) {
  const age = t - t0;
  if (age < 0) return;
  for (let i = 0; i < 64; i++) {
    const d = 0.5 * h01(i, 41), a = age - d;
    if (a < 0) continue;
    const x0 = 640 + 900 * h01(i, 42), vy = 120 + 90 * h01(i, 43);
    const y = 470 + 220 * h01(i, 44) - 300 * (1 - Math.exp(-a * 4)) * Math.exp(-a * 1.2) + vy * a * a * 0.6;
    if (y > 980) continue;
    const x = x0 + 26 * Math.sin(a * (2 + 2 * h01(i, 45)) + i) + 60 * (h01(i, 46) - 0.5) * a;
    const rot = a * (3 + 4 * h01(i, 47)) + i;
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(1, 0.45 + 0.55 * Math.abs(Math.sin(rot * 1.3)));
    c.fillStyle = FLOWERS[i % FLOWERS.length]!;
    c.beginPath(); c.ellipse(0, 0, 7, 4, 0, 0, TAU); c.fill();
    c.restore();
  }
}

// ------------------------------------------------------------------ the sand

/** The beach at night: wind ripples, shells, flowers dropped from the leis, footprints to the arch. */
function sand(c: C2, t: number) {
  const y0 = BW.bch + 14;
  const sg = c.createLinearGradient(0, y0, 0, 1080);
  sg.addColorStop(0, 'rgba(90,86,130,0)'); sg.addColorStop(1, 'rgba(30,24,52,0.55)');
  c.fillStyle = sg; c.fillRect(0, y0, W, 1080 - y0);
  c.strokeStyle = 'rgba(40,34,70,0.35)'; c.lineWidth = 2;
  for (let i = 0; i < 40; i++) {
    const x = h01(i, 71) * W, y = y0 + 20 + h01(i, 72) * 360, w = 30 + 50 * h01(i, 73);
    c.beginPath(); c.moveTo(x - w, y); c.quadraticCurveTo(x, y - 6, x + w, y); c.stroke();
  }
  for (let i = 0; i < 26; i++) {
    const x = h01(i, 74) * W, y = y0 + 30 + h01(i, 75) * 340;
    if (i % 3 === 0) flower(c, x, y, 5, FLOWERS[i % 5]!);
    else { c.fillStyle = i % 2 ? '#e8d8c8' : '#f4e2d8'; c.beginPath(); c.arc(x, y, 5, Math.PI, 0); c.closePath(); c.fill(); }
  }
  c.fillStyle = 'rgba(30,24,52,0.4)';    // footprints up the aisle
  for (let i = 0; i < 9; i++) { const u = i / 8, x = 1030 + (i % 2 ? 14 : -14), y = 1060 - u * 190; c.beginPath(); c.ellipse(x, y, 7, 12 - 3 * u, 0, 0, TAU); c.fill(); }
  void t;
}

/** The aisle: two rows of candles in jars on the sand, leading to the arch. */
function aisle(c: C2, g: C2, t: number) {
  for (let i = 0; i < 7; i++) {
    const u = i / 6, y = 1060 - u * 180, s = 1 - 0.45 * u;
    for (const side of [-1, 1]) {
      const x = 1035 + side * (190 - 120 * u);
      const fl = 0.85 + 0.15 * Math.sin(t * 11 + i * 1.9 + side);
      c.fillStyle = 'rgba(200,220,255,0.35)'; c.beginPath(); c.roundRect(x - 9 * s, y - 22 * s, 18 * s, 22 * s, 4 * s); c.fill();
      c.fillStyle = '#fff1b0'; c.beginPath(); c.ellipse(x, y - 16 * s, 3 * s, 6 * s * fl, 0, 0, TAU); c.fill();
      const cg = c.createRadialGradient(x, y - 14 * s, 0, x, y - 14 * s, 26 * s);   // on the main layer: the caption box covers it
      cg.addColorStop(0, rgbaHex('#ffcf7a', 0.55 * fl)); cg.addColorStop(1, rgbaHex('#ffb34a', 0));
      c.fillStyle = cg; c.beginPath(); c.arc(x, y - 14 * s, 26 * s, 0, TAU); c.fill();
      void g;
    }
  }
}

// ------------------------------------------------------------------ the world

export interface WorldDraw {
  /** Rai and anything at her depth (drawn after the couple and the bearers, before the torches and petals). */
  front?: (c: C2, g: C2) => void;
}

/** The whole beach world at time t (world px; put a camera on it). */
export function beachWorld(c: C2, g: C2, t: number, T: WedTimes, o: WorldDraw = {}) {
  island(c, t, { time: 'night', horizon: BW.hz, beach: BW.bch, show: ['clouds'] });
  // the moon's path on the sea
  c.save(); c.globalCompositeOperation = 'screen';
  for (let i = 0; i < 16; i++) {
    const y = BW.hz + 8 + i * 11, w = 30 + i * 9, x = 1498 + 18 * Math.sin(t * 1.2 + i * 1.9);
    c.fillStyle = `rgba(255,244,214,${0.28 - i * 0.014})`; c.fillRect(x - w / 2, y, w, 3);
  }
  c.restore();
  emberRing(c, g, t, T.start - 0.15);
  heartFirework(c, g, t, T.fw, 1050, 420, 96);
  sand(c, t);
  farStage(c, g, t);
  // huts and the stone bank, lit windows
  hut(c, 1560, 724, 130, true, 0.6); hut(c, 1810, 732, 150, true, 0.6);
  stoneBank(c, 1690, 770, 0.5, 0.6, 3);
  // back palms
  palmTree(c, 70, 790, 380, 0.12, t, 1, 0.65); palmTree(c, 620, 770, 300, -0.08, t, 2, 0.7); palmTree(c, 1900, 800, 420, -0.15, t, 3, 0.65);
  // a string of paper lanterns across the beach
  c.strokeStyle = 'rgba(30,20,20,0.8)'; c.lineWidth = 2;
  const sx0 = 430, sx1 = 1760, sy0 = 470, sy1 = 478, sag = 70;
  const at = (u: number) => [sx0 + (sx1 - sx0) * u, (1 - u) * sy0 + u * sy1 + sag * 4 * u * (1 - u)] as const;
  c.beginPath(); for (let i = 0; i <= 30; i++) { const [x, y] = at(i / 30); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
  for (let i = 0; i < 13; i++) { const [x, y] = at((i + 0.5) / 13); paperLantern(c, g, x, y, 13, [HEX.orange, HEX.pink, HEX.yellow][i % 3]!, t, i); }
  guests(c, g, t, T);
  // the arch: two palms leaning together, a garland of flowers between their crowns
  const { palmL: pl, palmR: pr, palmH: ph } = BW;
  palmTree(c, pl.x, pl.y, ph, 0.21, t, 4, 0.35); palmTree(c, pr.x, pr.y, ph, -0.21, t, 5, 0.35);
  const ax0 = pl.x + Math.sin(0.21) * ph, ax1 = pr.x - Math.sin(0.21) * ph, ay = pl.y - Math.cos(0.21) * ph + 22;
  for (let i = 0; i <= 22; i++) {
    const u = i / 22, x = ax0 + (ax1 - ax0) * u, y = ay + 70 * 4 * u * (1 - u) + 3 * Math.sin(t * 1.5 + i);
    flower(c, x, y, 9, FLOWERS[i % FLOWERS.length]!);
  }
  for (const u of [0.18, 0.5, 0.82]) { const x = ax0 + (ax1 - ax0) * u, y = ay + 70 * 4 * u * (1 - u); paperLantern(c, g, x, y + 8, 16, u === 0.5 ? HEX.pink : HEX.orange, t, Math.round(u * 10)); }
  // contact shadows on the sand for the couple and Rai
  c.fillStyle = 'rgba(20,14,36,0.45)';
  c.beginPath(); c.ellipse(BW.husband.x, BW.husband.feet + 2, 40, 8, 0, 0, TAU); c.ellipse(BW.bride.x, BW.bride.feet + 2, 40, 8, 0, 0, TAU); c.ellipse(BW.rai.x, BW.rai.feet + 2, 70, 11, 0, 0, TAU); c.fill();
  aisle(c, g, t);
  couple(c, g, t, T);
  bearers(c, g, t, T);
  o.front?.(c, g);
  tiki(c, g, 500, 960, 250, t, 1); tiki(c, g, 1660, 966, 260, t, 2);
  petals(c, t, T.weddings);
}

/** Rai's flower lei, drawn over her (full body: disc centre (x, cy), radius R; chibi: its own smaller one). */
export function raiLei(c: C2, x: number, cy: number, R: number, o: { hop?: number; sd?: boolean; tilt?: number } = {}) {
  c.save();
  c.translate(x, cy - (o.hop ?? 0) * R); c.rotate(o.tilt ?? 0);
  if (o.sd) lei(c, 0, 0.3 * R, 0.55 * R, 0.14 * R, 0.09 * R, 1);
  else lei(c, 0, -0.66 * R, 0.64 * R, 0.28 * R, 0.085 * R, 1);
  c.restore();
}
