// The prologue's night world, shared by `voyage` and `sinking` (both plates draw the same sea, sky, raft and rings,
// so the cut at the summit is seamless): Coprime's 4 : 5 : 6 rhythm as numbers (filmsound/main.swift, fixed), the
// night sky with its star trails, the moon, the sea, the canoe-raft with the stone and three paddlers, the three
// neon rings and their fusion into the gold harmonograph, the title.
//
// Strike times proven 2026-10-02 against takes/v3/audio.wav: the master's onsets in 0-4.2 s fall on
// 0.4 + k / (m * BASE0) within 2 ms for m = 4, 5, 6.
import { W, H } from '../engine/gl';
import { HEX } from '../engine/palette';
import { font } from '../engine/type';
import { clamp, ease } from '../engine/util';
import { h01 } from './_rai';
import { FAM, TAU, harmonograph, person, rgbaHex, type C2, type Emote, type Pose } from './_motifs';

// ------------------------------------------------------------------ the rhythm (Coprime's score)

export const BEAT = 60 / 140;
export const P0 = 0.4;                 // the paddles start
export const RISE0 = P0 + 8 * BEAT;    // 3.8286: the hold ends, the glide begins
export const RISE = 9;
export const SUMMIT = RISE0 + RISE;    // 12.8286: the chord
export const BASE0 = 1 / (4 * BEAT);   // pattern cycles per second at the start
export const BASE1 = 277.18 / 4;
export const VOICES = [4, 5, 6] as const;
export const VCOL = [HEX.cyan, HEX.pink, HEX.yellow];

/** The glide's position in log speed, 0 (the hold) .. 1 (the chord). */
export function glideE(t: number) {
  const u = clamp((t - RISE0) / RISE);
  return 0.5 - 0.5 * Math.cos(Math.PI * u);
}
/** Pattern cycles per second (voice m strikes m times per cycle). */
export function baseRate(t: number) {
  if (t < P0) return 0;
  return BASE0 * Math.pow(BASE1 / BASE0, glideE(t));
}

const DT = 1e-4;
/** Integrated tables: the pattern phase (cycles since P0), the sky's turn and the sea's travel. */
export class Rhythm {
  phiTab: Float64Array; skyTab: Float64Array; seaTab: Float64Array;
  constructor() {
    const n = Math.ceil((SUMMIT + 0.5 - RISE0) / DT) + 2;
    this.phiTab = new Float64Array(n); this.skyTab = new Float64Array(n); this.seaTab = new Float64Array(n);
    let phi = BASE0 * (RISE0 - P0), sky = this.skyOmega(0) * RISE0, sea = RISE0;
    for (let i = 0; i < n; i++) {
      this.phiTab[i] = phi; this.skyTab[i] = sky; this.seaTab[i] = sea;
      const t = RISE0 + i * DT;
      phi += 0.5 * (baseRate(t) + baseRate(t + DT)) * DT;
      sky += 0.5 * (this.skyOmega(t) + this.skyOmega(t + DT)) * DT;
      sea += 0.5 * (this.seaSpeed(t) + this.seaSpeed(t + DT)) * DT;
    }
  }
  private look(tab: Float64Array, t: number) {
    const x = (t - RISE0) / DT, i = Math.floor(x), n = tab.length;
    if (i >= n - 1) return tab[n - 1]! + (tab[n - 1]! - tab[n - 2]!) * (x - (n - 1)); // past the table: keep going
    return tab[i]! + (tab[i + 1]! - tab[i]!) * (x - i);
  }
  /** Pattern cycles since P0 (0 before). */
  phi(t: number) { return t < P0 ? -1e-9 : t <= RISE0 ? BASE0 * (t - P0) : this.look(this.phiTab, t); }
  /** The time at which phi reaches x (x >= 0). */
  timeOfPhi(x: number) {
    if (x <= BASE0 * (RISE0 - P0)) return P0 + x / BASE0;
    let lo = 0, hi = this.phiTab.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (this.phiTab[m]! <= x) lo = m; else hi = m; }
    const a = this.phiTab[lo]!, b = this.phiTab[hi]!;
    return RISE0 + (lo + (x - a) / Math.max(1e-12, b - a)) * DT;
  }
  /** Voice m: strikes so far (k = floor), the age of the last strike, the phase within the stroke. */
  voice(m: number, t: number) {
    const x = m * this.phi(t);
    if (x < 0) return { k: -1, age: 1e9, frac: 0, rate: 0 };
    const k = Math.floor(x);
    return { k, age: t - this.timeOfPhi(k / m), frac: x - k, rate: m * baseRate(t) };
  }
  /** Age of the last strike that hit mark j of ring m (mark j is struck on strikes k = j mod m). */
  markAge(m: number, j: number, t: number) {
    const x = m * this.phi(t);
    if (x < j) return 1e9;
    const k = Math.floor((x - j) / m) * m + j;
    return t - this.timeOfPhi(k / m);
  }
  /** The sky turns faster as the rhythm quickens (rad/s), and its integrated angle. */
  skyOmega(t: number) { return 0.004 * Math.pow(Math.max(1, baseRate(t) / BASE0), 1.45); }
  skyAngle(t: number) { return t <= RISE0 ? this.skyOmega(0) * t : this.look(this.skyTab, t); }
  /** The sea's travel (the canoe surges as the paddles quicken). */
  seaSpeed(t: number) { return 1 + 7 * glideE(t); }
  seaTravel(t: number) { return t <= RISE0 ? t : this.look(this.seaTab, t); }
}

/** The storm's build, shared with `sinking`: 0 until the wind at 8.8 s, 1 at the thunder (14.54). */
export const stormAt = (t: number) => clamp((t - 8.8) / (14.54 - 8.8));
/** The world camera of the prologue's night (a slow push towards the stone's hole, faster as the rhythm climbs). */
export function nightCam(t: number): Cam {
  const e = glideE(t);
  return { s: 1 + 0.02 * clamp(t / SUMMIT) + 0.07 * ease.inCubic(e), cx: HOLE.x, cy: HOLE.y, fx: 960, fy: 560 };
}
export const FUSE0 = SUMMIT - 0.95;

// ------------------------------------------------------------------ the world's geometry (world px = canvas px at zoom 1)

export const HORIZON = 640;
export const DECK = 700;
export const WL = DECK + 26;                          // the waterline at the hull
export const STONE_R = 140;
export const STONE = { x: 960, y: DECK - STONE_R };   // the stone's centre on the raft
export const HOLE = { x: 960, y: STONE.y + STONE_R * 0.08, r: STONE_R * 0.27 };
export const MOON = { x: HOLE.x, y: HOLE.y - 56, r: 178 }; // the moon rises behind the stone and shows through its hole
export const RING_R = [262, 312, 362];
export const KNOT_R = 200;
export const INK_SIL = '#0a0713';

/** A camera on the world: zoom s about the focus point, which lands at (fx, fy) on screen. */
export interface Cam { s: number; cx: number; cy: number; fx: number; fy: number; rot?: number; sx?: number; sy?: number }
export function applyCam(c: C2, cam: Cam) {
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.translate(cam.fx + (cam.sx ?? 0), cam.fy + (cam.sy ?? 0));
  if (cam.rot) c.rotate(cam.rot);
  c.scale(cam.s, cam.s);
  c.translate(-cam.cx, -cam.cy);
}
export const toScreen = (cam: Cam, x: number, y: number): [number, number] => [cam.fx + (x - cam.cx) * cam.s, cam.fy + (y - cam.cy) * cam.s];

// ------------------------------------------------------------------ sky, moon, stars, clouds

/** The night: indigo to violet, a moon glow low behind the raft; `lit` (0..1) is the lightning on the clouds. */
export function sky(c: C2, t: number, rh: Rhythm, o: { storm?: number; moon?: number } = {}) {
  const storm = o.storm ?? 0, moonA = o.moon ?? 1;
  const g = c.createLinearGradient(0, -400, 0, HORIZON);
  g.addColorStop(0, '#06040c'); g.addColorStop(0.42, '#120d26'); g.addColorStop(0.78, '#2f1c59'); g.addColorStop(1, '#55307f');
  c.fillStyle = g; c.fillRect(-600, -600, W + 1200, HORIZON + 600);
  // the moon's glow on the sky
  const mg = c.createRadialGradient(MOON.x, MOON.y, MOON.r * 0.8, MOON.x, MOON.y, MOON.r * 3.4);
  mg.addColorStop(0, rgbaHex('#ffd9a8', 0.42 * moonA)); mg.addColorStop(0.35, rgbaHex('#c65cf0', 0.16 * moonA)); mg.addColorStop(1, 'rgba(198,92,240,0)');
  c.fillStyle = mg; c.fillRect(-600, -600, W + 1200, HORIZON + 600);
  // stars, turning about the moon: points, then trails, then rings as the rhythm quickens
  c.save();
  c.beginPath(); c.rect(-600, -600, W + 1200, HORIZON + 600); c.clip();
  const psi = rh.skyAngle(t), span = Math.min(TAU, rh.skyOmega(t) * 1.6);
  const starA = 1 - 0.75 * storm;
  for (let i = 0; i < 420; i++) {
    const rho = 250 + Math.sqrt(h01(i, 301)) * 1250, a = h01(i, 302) * TAU + psi;
    const tw = 0.55 + 0.45 * Math.sin(t * (1 + 2.5 * h01(i, 303)) + h01(i, 304) * 6);
    const br = (0.35 + 0.65 * h01(i, 305) ** 2) * starA;
    if (span < 0.02) {
      const x = MOON.x + Math.cos(a) * rho, y = MOON.y + Math.sin(a) * rho;
      if (y > HORIZON) continue;
      c.fillStyle = `rgba(240,236,255,${br * tw})`;
      c.beginPath(); c.arc(x, y, 0.9 + 2.1 * h01(i, 306) ** 2, 0, TAU); c.fill();
    } else {
      c.strokeStyle = `rgba(232,228,255,${br * (0.5 + 0.5 * tw) * clamp(0.35 + 0.08 / span)})`;
      c.lineWidth = 0.9 + 1.4 * h01(i, 306);
      c.beginPath(); c.arc(MOON.x, MOON.y, rho, a - span, a); c.stroke();
    }
  }
  c.restore();
  // the moon
  if (moonA > 0) {
    c.save();
    c.globalAlpha = moonA;
    const d = c.createRadialGradient(MOON.x - 60, MOON.y - 70, 10, MOON.x, MOON.y, MOON.r);
    d.addColorStop(0, '#fffaf0'); d.addColorStop(0.7, '#f6ead0'); d.addColorStop(1, '#ead6ae');
    c.fillStyle = d; c.beginPath(); c.arc(MOON.x, MOON.y, MOON.r, 0, TAU); c.fill();
    for (let i = 0; i < 9; i++) { // maria, faint
      const a = h01(i, 311) * TAU, r = Math.sqrt(h01(i, 312)) * MOON.r * 0.75;
      c.fillStyle = 'rgba(196,178,150,0.22)';
      c.beginPath(); c.arc(MOON.x + Math.cos(a) * r, MOON.y + Math.sin(a) * r, MOON.r * (0.06 + 0.12 * h01(i, 313)), 0, TAU); c.fill();
    }
    c.restore();
  }
}

/** Storm clouds rolling in from the top (`storm` 0..1 covers the sky), lit from below by the moon, or white by lightning. */
export function clouds(c: C2, t: number, storm: number, lit = 0) {
  if (storm <= 0) return;
  const reach = -200 + 520 * storm; // the cloud base's lowest point
  for (let layer = 0; layer < 3; layer++) {
    const n = 9, base = reach - layer * 90;
    const col = lit > 0 ? `rgba(${Math.round(30 + 200 * lit)},${Math.round(22 + 190 * lit)},${Math.round(50 + 205 * lit)},${0.92})` : ['#1a1430', '#221a3c', '#2b2149'][layer]!;
    c.fillStyle = col;
    c.beginPath();
    c.rect(-600, -600, W + 1200, base - 40 + 600);
    for (let i = 0; i < n; i++) {
      const x = -300 + ((i + 0.5) / n) * (W + 600) + ((t * (30 + 25 * layer) + h01(i, layer, 321) * 400) % 400) - 200;
      const y = base - 60 * h01(i, layer, 322);
      const r = 110 + 90 * h01(i, layer, 323);
      c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU);
    }
    c.fill();
    // the moonlit underside
    c.strokeStyle = rgbaHex(lit > 0 ? '#ffffff' : '#7d68b8', (lit > 0 ? 0.25 : 0.2) * (1 - layer * 0.3));
    c.lineWidth = 3;
    for (let i = 0; i < n; i++) {
      const x = -300 + ((i + 0.5) / n) * (W + 600) + ((t * (30 + 25 * layer) + h01(i, layer, 321) * 400) % 400) - 200;
      const y = base - 60 * h01(i, layer, 322), r = 110 + 90 * h01(i, layer, 323);
      c.beginPath(); c.arc(x, y, r, 0.35, Math.PI - 0.35); c.stroke();
    }
  }
}

/** Wind: thin streaks driven across the frame. */
export function wind(c: C2, t: number, amount: number) {
  if (amount <= 0) return;
  c.save();
  c.strokeStyle = `rgba(190,180,255,${0.16 * amount})`;
  c.lineWidth = 1.4;
  for (let i = 0; i < 46; i++) {
    const y = h01(i, 331) * H * 0.95, L = 80 + 200 * h01(i, 332);
    const x = W + 300 - ((t * (900 + 700 * h01(i, 333)) + h01(i, 334) * 3000) % (W + 800));
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + L, y - L * 0.08); c.stroke();
  }
  c.restore();
}

// ------------------------------------------------------------------ the sea

/** The sea from the horizon down: dark indigo, the moon's path, wave lines travelling (`travel`), `rough` 0..1. */
export function sea(c: C2, t: number, travel: number, rough: number, o: { moon?: number } = {}) {
  const moonA = o.moon ?? 1;
  const g = c.createLinearGradient(0, HORIZON, 0, H + 200);
  g.addColorStop(0, '#2a1a52'); g.addColorStop(0.25, '#150e2e'); g.addColorStop(1, '#06040b');
  c.fillStyle = g; c.fillRect(-600, HORIZON, W + 1200, H + 600);
  // the horizon's glow under the moon
  const hg = c.createRadialGradient(MOON.x, HORIZON, 0, MOON.x, HORIZON, 520);
  hg.addColorStop(0, rgbaHex('#ffd9a8', 0.35 * moonA)); hg.addColorStop(1, 'rgba(255,217,168,0)');
  c.fillStyle = hg; c.fillRect(MOON.x - 600, HORIZON, 1200, 120);
  // the moon's path: glints in rows, wider towards us
  for (let row = 0; row < 34; row++) {
    const v = row / 34, y = HORIZON + 4 + (H + 60 - HORIZON) * v * v;
    const spread = 40 + 340 * v;
    for (let k = 0; k < 5; k++) {
      const s = h01(row, k, 341), x = MOON.x + (s - 0.5) * 2 * spread;
      const tw = 0.5 + 0.5 * Math.sin(t * (2 + 3 * h01(row, k, 342)) + travel * 2 + row);
      const a = moonA * tw * (1 - Math.abs(s - 0.5) * 1.6) * (0.9 - 0.5 * v);
      if (a <= 0.02) continue;
      c.fillStyle = rgbaHex('#ffe7c2', a);
      c.fillRect(x - (8 + 30 * v), y, 2 * (8 + 30 * v), 1.5 + 3 * v);
    }
  }
  // wave lines
  c.lineCap = 'round';
  for (let i = 0; i < 24; i++) {
    const v = i / 24, y = HORIZON + 6 + (H + 80 - HORIZON) * v * v;
    const amp = (1.5 + 14 * v) * (0.5 + 2.2 * rough);
    c.strokeStyle = rgbaHex('#8f7fe0', 0.1 + 0.35 * v);
    c.lineWidth = 1 + 2.2 * v;
    c.beginPath();
    for (let x = -620; x <= W + 620; x += 22) {
      const yy = y + Math.sin(x * (0.011 - 0.007 * v) + travel * (1.4 + 2 * v) + i * 1.7) * amp
        + Math.sin(x * 0.0041 - travel * 0.7 + i) * amp * rough * 1.6;
      if (x === -620) c.moveTo(x, yy); else c.lineTo(x, yy);
    }
    c.stroke();
  }
}

// ------------------------------------------------------------------ the vessel

/** The stone as a silhouette (a disc with its hole), the moon's rim light on it. */
export function stoneSil(c: C2, x: number, y: number, r: number, o: { rot?: number; rim?: number; col?: string } = {}) {
  c.save();
  c.translate(x, y); c.rotate(o.rot ?? 0);
  c.beginPath(); c.arc(0, 0, r, 0, TAU); c.moveTo(r * 0.27, r * 0.08); c.arc(0, r * 0.08, r * 0.27, 0, TAU);
  c.fillStyle = o.col ?? INK_SIL; c.fill('evenodd');
  if (o.rim) {
    c.strokeStyle = rgbaHex('#ffe7c2', 0.55 * o.rim); c.lineWidth = 2.5;
    c.beginPath(); c.arc(0, 0, r - 1, 0, TAU); c.stroke();
    c.beginPath(); c.arc(0, r * 0.08, r * 0.27 + 1, 0, TAU); c.stroke();
  }
  c.restore();
}

export interface Figure { pose: Pose; emote?: Emote; emoteT0?: number; flip?: boolean; headTilt?: number }
export interface VesselOpts {
  /** The deck's tilt about its centre (radians; positive lifts the right side). */
  tilt?: number;
  /** The stone on the deck: offset along the deck (px), its own roll; `stone: false` when it has left. */
  stone?: boolean; slide?: number; roll?: number;
  /** Stroke phase per paddler (0 = the catch), or null to hold the paddles still. */
  strokes?: (number | null)[];
  /** Per paddler: a pose instead of paddling (the storm: they react, they emote). */
  figures?: (Figure | null)[];
  /** The navigator at the stern. */
  navigator?: Figure;
  bob?: number;
  t?: number;
}

/** The bow lantern (world px, before the deck's tilt). */
export const LANTERN = { x: 1356, y: DECK - 74 };

/**
 * The canoe with the bamboo raft lashed on, all in silhouette against the moon: the hull with its notched,
 * upswept ends, the outrigger float on its booms, a mast with the crab-claw sail furled on its yard and its stays,
 * the bamboo deck, the stone upright in its frame with ropes run through its hole, a lantern at the bow, the
 * navigator at the stern pointing the way by the stars, three paddlers.
 */
export function vessel(c: C2, t: number, o: VesselOpts = {}) {
  const tilt = o.tilt ?? 0, bob = o.bob ?? 0;
  c.save();
  c.translate(960, DECK + bob); c.rotate(-tilt); c.translate(-960, -DECK);
  c.fillStyle = INK_SIL; c.strokeStyle = INK_SIL; c.lineCap = 'round'; c.lineJoin = 'round';
  // the mast, its stays and the furled crab-claw sail on its yard
  c.lineWidth = 6;
  c.beginPath(); c.moveTo(1128, DECK); c.lineTo(1128, DECK - 318); c.stroke();
  c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(1128, DECK - 316); c.lineTo(1372, DECK - 36); c.stroke();
  c.lineWidth = 5;
  c.beginPath(); c.moveTo(1036, DECK - 26); c.lineTo(1196, DECK - 352); c.stroke();
  c.beginPath(); // the furled sail: a fat bundle along the yard, bound at intervals
  for (let k = 0; k < 7; k++) {
    const u0 = 0.12 + k * 0.11, u1 = u0 + 0.1;
    const ax = 1036 + 160 * u0, ay = DECK - 26 - 326 * u0, bx = 1036 + 160 * u1, by = DECK - 26 - 326 * u1;
    const nx = 0.9, ny = 0.44, w = 9 + 4 * Math.sin(k * 1.7);
    c.moveTo(ax - nx * 3, ay - ny * 3); c.quadraticCurveTo((ax + bx) / 2 + nx * w, (ay + by) / 2 + ny * w, bx - nx * 3, by - ny * 3);
    c.lineTo(bx + nx * 2, by + ny * 2); c.quadraticCurveTo((ax + bx) / 2 - nx * 4, (ay + by) / 2 - ny * 4, ax + nx * 2, ay + ny * 2);
  }
  c.fill();
  // the stone's frame: two braces leaning in behind it
  c.lineWidth = 7;
  c.beginPath(); c.moveTo(820, DECK); c.lineTo(905, DECK - 110); c.moveTo(1100, DECK); c.lineTo(1015, DECK - 110); c.stroke();
  // the stone, with the ropes run through its hole and down to the deck
  if (o.stone !== false) {
    const sx = STONE.x + (o.slide ?? 0);
    stoneSil(c, sx, STONE.y, STONE_R, { rot: o.roll ?? 0, rim: 1 });
    if (!o.slide) { // guy ropes from her shoulders down to the deck's ends
      c.strokeStyle = INK_SIL; c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(sx - STONE_R * 0.86, STONE.y - STONE_R * 0.5); c.quadraticCurveTo(sx - STONE_R * 1.5, STONE.y + 20, 700, DECK - 4);
      c.moveTo(sx + STONE_R * 0.86, STONE.y - STONE_R * 0.5); c.quadraticCurveTo(sx + STONE_R * 1.5, STONE.y + 20, 1220, DECK - 4);
      c.stroke();
    }
  }
  // the hull: a long canoe, upswept at both ends, each end notched like a claw
  c.beginPath();
  c.moveTo(556, DECK - 46); c.lineTo(566, DECK - 30); c.lineTo(574, DECK - 44);
  c.quadraticCurveTo(604, DECK + 4, 700, DECK + 10);
  c.lineTo(1220, DECK + 10);
  c.quadraticCurveTo(1326, DECK + 4, 1366, DECK - 46); c.lineTo(1374, DECK - 32); c.lineTo(1388, DECK - 50);
  c.quadraticCurveTo(1326, DECK + 40, 1200, DECK + 40);
  c.lineTo(720, DECK + 40);
  c.quadraticCurveTo(596, DECK + 38, 556, DECK - 46);
  c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,231,194,0.3)'; c.lineWidth = 1.5; // the sheer line, moonlit
  c.beginPath(); c.moveTo(590, DECK + 4); c.quadraticCurveTo(960, DECK + 14, 1340, DECK + 2); c.stroke();
  // the raft: bamboo laid along, pole ends showing, lashed (lighter ticks)
  c.fillStyle = INK_SIL;
  c.fillRect(660, DECK - 6, 600, 14);
  c.strokeStyle = 'rgba(255,231,194,0.22)';
  for (let x = 684; x < 1250; x += 38) { c.beginPath(); c.moveTo(x, DECK - 5); c.lineTo(x, DECK + 7); c.stroke(); }
  c.fillStyle = 'rgba(126,104,170,0.7)';
  for (const x of [662, 1258]) for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(x, DECK - 3 + k * 5, 2.6, 0, TAU); c.fill(); }
  // the outrigger: two curved booms out to a float riding in front of the hull
  c.strokeStyle = INK_SIL; c.lineWidth = 5;
  c.beginPath(); c.moveTo(800, DECK + 2); c.quadraticCurveTo(790, DECK + 30, 770, WL + 14); c.moveTo(1150, DECK + 2); c.quadraticCurveTo(1160, DECK + 30, 1170, WL + 14); c.stroke();
  c.fillStyle = INK_SIL;
  c.beginPath(); c.ellipse(970, WL + 16, 260, 7, 0, 0, TAU); c.fill();
  // the bow lantern on its pole
  c.lineWidth = 3; c.beginPath(); c.moveTo(1334, DECK - 14); c.quadraticCurveTo(1340, DECK - 80, 1356, DECK - 92); c.stroke();
  const fl = 0.85 + 0.15 * Math.sin(t * 13) * Math.sin(t * 7.3);
  c.fillStyle = `rgba(255,${Math.round(190 + 30 * fl)},110,1)`;
  c.beginPath(); c.roundRect(LANTERN.x - 7, LANTERN.y - 10, 14, 20, 3); c.fill();
  c.fillStyle = INK_SIL; c.fillRect(LANTERN.x - 8, LANTERN.y - 12, 16, 4); c.fillRect(LANTERN.x - 8, LANTERN.y + 9, 16, 3);
  // the navigator at the stern, pointing the way
  const nv = o.navigator ?? { pose: 'point' as Pose };
  person(c, 626, DECK - 8, 112, nv.pose, { col: INK_SIL, t, seed: 7, emote: nv.emote, emoteT0: nv.emoteT0, flip: nv.flip, headTilt: nv.headTilt ?? -0.15 });
  // the paddlers
  PADDLER_X.forEach((x, i) => {
    const fg = o.figures?.[i];
    if (fg) person(c, x, DECK - 2, 124, fg.pose, { col: INK_SIL, t, seed: i * 1.3, emote: fg.emote, emoteT0: fg.emoteT0, flip: fg.flip, headTilt: fg.headTilt });
    else paddler(c, x, DECK - 2, 124, o.strokes?.[i] ?? null, t, i);
  });
  c.restore();
}

/** A paddler (person(), 'paddle') with a long paddle reaching the water; `phase` 0 is the catch (the strike). */
function paddler(c: C2, x: number, y: number, h: number, phase: number | null, t: number, i: number) {
  const u = h / 100, s = i * 1.3;
  // person()'s paddle angle is sin(pt * 3.4 + s) * 0.5: drive it from the stroke phase
  const want = phase === null ? 0 : -Math.cos(TAU * phase);
  const pt = (Math.asin(clamp(want, -1, 1)) - s) / 3.4;
  // the body leans into the catch
  const lean = phase === null ? 0 : 0.07 * Math.cos(TAU * phase);
  c.save(); c.translate(x, y); c.rotate(lean); c.translate(-x, -y);
  person(c, x, y, h, 'paddle', { col: INK_SIL, t: pt, seed: s });
  const a = Math.sin(pt * 3.4 + s) * 0.5;
  const p0x = x - 26 * u, p0y = y - 70 * u, p1x = x + (30 + 10 * a) * u, p1y = y - 14 * u;
  const k = (WL + 10 - p0y) / (p1y - p0y), tx = p0x + (p1x - p0x) * k, ty = WL + 10;
  c.strokeStyle = INK_SIL; c.lineWidth = 3.2 * u;
  c.beginPath(); c.moveTo(p1x, p1y); c.lineTo(tx, ty); c.stroke();
  const ang = Math.atan2(ty - p0y, tx - p0x);
  c.translate(tx, ty); c.rotate(ang);
  c.fillStyle = INK_SIL; c.beginPath(); c.ellipse(-8 * u, 0, 14 * u, 5 * u, 0, 0, TAU); c.fill();
  c.restore();
}

/** Where paddler i's blade meets the water (world px). */
export const PADDLER_X = [710, 800, 1226];
export const BLADE_X = PADDLER_X.map((x) => x + 82);

// ------------------------------------------------------------------ the rings (the rhythm), the knot

/** Harmonograph point (the motif's formula): s in [0, 2pi) traces the whole 3:2 knot. */
export const knotPt = (cx: number, cy: number, r: number, s: number): [number, number] =>
  [cx + Math.sin(3 * s + Math.PI / 2) * r * 1.15, cy + Math.sin(2 * s) * r];

/**
 * The three rings about the stone's hole: each pulses on its voice's strikes, its m marks flare when the sweeping
 * hand passes them (a strike), the hand's trail lengthening until the pulses fuse into steady light. `fuse` 0..1
 * morphs the rings into the gold knot.
 */
export function rings(g: C2, t: number, rh: Rhythm, o: { alpha?: number; fuse?: number } = {}) {
  const A = o.alpha ?? 1, fuse = o.fuse ?? 0;
  if (A <= 0 || t < P0 - 0.02) return;
  const cx = HOLE.x, cy = HOLE.y, phi = rh.phi(t), e = glideE(t);
  const on = clamp((t - P0 + 0.02) / 0.06);
  g.save();
  g.lineCap = 'round';
  if (fuse < 1) {
    for (let i = 0; i < 3; i++) {
      const m = VOICES[i]!, R = RING_R[i]!, col = VCOL[i]!;
      const v = rh.voice(m, t), p = Math.exp(-v.age / 0.12);
      const lobes = 2 * m, wob = 9 * clamp((e - 0.55) / 0.35) * (1 - fuse);
      const a0 = A * on * (1 - fuse);
      // the ring itself (a standing wave of 2m lobes once the rhythm has become a tone)
      g.strokeStyle = rgbaHex(col, a0 * (0.28 + 0.72 * p));
      g.lineWidth = 2.2 + 4.5 * p + 3 * e;
      g.beginPath();
      for (let k = 0; k <= 240; k++) {
        const th = (k / 240) * TAU, r = R + wob * Math.sin(lobes * th + t * 3 * (i + 1));
        const x = cx + Math.cos(th) * r, y = cy + Math.sin(th) * r;
        if (k === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.stroke();
      // the strike's ripple
      if (v.age < 0.5 && v.rate < 9) {
        const q = v.age / 0.5;
        g.strokeStyle = rgbaHex(col, a0 * 0.55 * (1 - q));
        g.lineWidth = 2;
        g.beginPath(); g.arc(cx, cy, R + 46 * ease.outCubic(q), 0, TAU); g.stroke();
      }
      // the marks
      for (let j = 0; j < m; j++) {
        const th = -Math.PI / 2 + (TAU * j) / m, pj = Math.exp(-rh.markAge(m, j, t) / 0.16);
        const x = cx + Math.cos(th) * R, y = cy + Math.sin(th) * R;
        g.fillStyle = rgbaHex(col, a0 * (0.45 + 0.55 * pj));
        g.beginPath(); g.arc(x, y, 4 + 13 * pj, 0, TAU); g.fill();
        if (pj > 0.05) {
          g.strokeStyle = rgbaHex(col, a0 * 0.8 * pj); g.lineWidth = 2;
          g.beginPath(); g.moveTo(cx + Math.cos(th) * (R - 26 * pj), cy + Math.sin(th) * (R - 26 * pj)); g.lineTo(cx + Math.cos(th) * (R + 30 * pj), cy + Math.sin(th) * (R + 30 * pj)); g.stroke();
        }
      }
      // the hand's trail on this ring
      const head = -Math.PI / 2 + TAU * phi, span = clamp(TAU * baseRate(t) * 0.22, 0.25, TAU);
      const N = 28;
      for (let k = 0; k < N; k++) {
        const a1 = head - (span * k) / N, a2 = head - (span * (k + 1)) / N;
        g.strokeStyle = rgbaHex(HEX.bone, a0 * 0.75 * (1 - k / N) * (span >= TAU ? 0.45 : 1));
        g.lineWidth = 4 - 2.5 * (k / N);
        g.beginPath(); g.arc(cx, cy, R, a2, a1); g.stroke();
      }
    }
    // the hand itself while it can still be followed
    const handA = A * on * (1 - fuse) * clamp(1 - (baseRate(t) - 1.2) / 1.5);
    if (handA > 0) {
      const head = -Math.PI / 2 + TAU * phi;
      g.strokeStyle = rgbaHex(HEX.bone, 0.35 * handA); g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(cx + Math.cos(head) * (RING_R[0]! - 30), cy + Math.sin(head) * (RING_R[0]! - 30));
      g.lineTo(cx + Math.cos(head) * (RING_R[2]! + 30), cy + Math.sin(head) * (RING_R[2]! + 30)); g.stroke();
    }
  }
  if (fuse > 0) fuseCurve(g, cx, cy, fuse, A);
  g.restore();
}

/** The rings pouring into the knot: ring i's points flow onto the knot's i-th third. */
export function fuseCurve(g: C2, cx: number, cy: number, fuse: number, A = 1, width = 5) {
  const u = ease.inOutCubic(clamp(fuse));
  for (let i = 0; i < 3; i++) {
    g.strokeStyle = mixCol(VCOL[i]!, HEX.gold, u, A);
    g.lineWidth = width + 3 * (1 - u);
    g.beginPath();
    const N = 160;
    for (let k = 0; k <= N; k++) {
      const v = k / N, th = -Math.PI / 2 + TAU * v;
      const R = RING_R[i]!;
      const ax = cx + Math.cos(th) * R, ay = cy + Math.sin(th) * R;
      const [bx, by] = knotPt(cx, cy, KNOT_R, (TAU * (i + v)) / 3);
      const x = ax + (bx - ax) * u, y = ay + (by - ay) * u;
      if (k === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.stroke();
  }
}
function mixCol(a: string, b: string, u: number, alpha: number) {
  const p = parseInt(a.slice(1), 16), q = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((p >> s) & 255) + (((q >> s) & 255) - ((p >> s) & 255)) * u);
  return `rgba(${ch(16)},${ch(8)},${ch(0)},${alpha})`;
}

/** The finished knot, gold (the harmonograph() motif), with a glow copy for the bloom layer. */
export function knot(c: C2, g: C2 | null, a = 1, width = 5) {
  if (a <= 0) return;
  c.save(); c.globalAlpha *= a;
  c.shadowColor = HEX.gold; c.shadowBlur = 18;
  harmonograph(c, HOLE.x, HOLE.y, KNOT_R, { col: HEX.gold, width, draw: 0.5 });
  c.restore();
  if (g) { g.save(); g.globalAlpha *= a * 0.7; harmonograph(g, HOLE.x, HOLE.y, KNOT_R, { col: HEX.gold, width: width + 4, draw: 0.5 }); g.restore(); }
}

// ------------------------------------------------------------------ splashes

/** Paddle splashes: a burst of drops and a ripple on each strike; above ~6 strokes a second, a steady spray. */
export function splashes(c: C2, t: number, rh: Rhythm, alpha = 1) {
  for (let i = 0; i < 3; i++) {
    const m = VOICES[i]!, v = rh.voice(m, t), bx = BLADE_X[i]!, col = VCOL[i]!;
    if (v.k < 0) continue;
    const spray = clamp((v.rate - 5) / 6);
    // the latest few strikes' drops
    for (let back = 0; back < 3; back++) {
      const k = v.k - back;
      if (k < 0) break;
      const age = t - rh.timeOfPhi(k / m);
      if (age > 0.45) break;
      const q = age / 0.45;
      for (let d = 0; d < 9; d++) {
        const vx = (h01(k, d, 351 + i) - 0.65) * 260, vy = -(160 + 220 * h01(k, d, 352 + i));
        const x = bx + vx * age, y = WL + vy * age + 900 * age * age;
        if (y > WL + 4) continue;
        c.fillStyle = rgbaHex('#dff6ff', alpha * (1 - q) * (1 - spray * 0.6));
        c.beginPath(); c.arc(x, y, 2.6 * (1 - q * 0.5), 0, TAU); c.fill();
      }
      if (back === 0) {
        c.strokeStyle = rgbaHex(col, alpha * 0.7 * (1 - q) * (1 - spray));
        c.lineWidth = 2;
        c.beginPath(); c.ellipse(bx, WL + 6, 10 + 70 * ease.outCubic(q), 3 + 12 * ease.outCubic(q), 0, 0, TAU); c.stroke();
      }
    }
    if (spray > 0) { // continuous white water
      for (let d = 0; d < 26; d++) {
        const age = ((t * 3.1 + h01(d, i, 361)) % 1) * 0.35;
        const vx = (h01(d, i, 362) - 0.75) * 300, vy = -(120 + 260 * h01(d, i, 363));
        const x = bx + vx * age, y = WL + vy * age + 900 * age * age;
        c.fillStyle = rgbaHex('#e8f8ff', alpha * spray * 0.7 * (1 - age / 0.35));
        c.beginPath(); c.arc(x, y, 2.2, 0, TAU); c.fill();
      }
    }
  }
}

// ------------------------------------------------------------------ the title

export const TITLE = ['THE STONE AT THE', 'BOTTOM OF THE SEA'];
/** Title layout: two lines centred over the sea, each word with its own box (so the words can fall in `sinking`). */
export function titleWords(c: C2) {
  const out: { w: string; x: number; y: number; size: number; fam: string; col: string }[] = [];
  const rows = [{ text: TITLE[0]!, size: 96, fam: FAM.cond(), col: HEX.bone, y: 842 }, { text: TITLE[1]!, size: 112, fam: FAM.hook(), col: HEX.gold, y: 948 }];
  for (const r of rows) {
    c.font = font(r.fam, r.size);
    const sp = c.measureText(' ').width, ws = r.text.split(' '), wd = ws.map((w) => c.measureText(w).width);
    let x = W / 2 - (wd.reduce((a, b) => a + b, 0) + sp * (ws.length - 1)) / 2;
    ws.forEach((w, i) => { out.push({ w, x: x + wd[i]! / 2, y: r.y, size: r.size, fam: r.fam, col: r.col }); x += wd[i]! + sp; });
  }
  return out;
}

// ------------------------------------------------------------------ the world of the voyage: where she came from, what is coming

/** How far Palau has fallen behind, 0 (just left) .. 1 (gone under the horizon), from the sea's travel. */
export const recede = (travel: number) => clamp(travel / 40);

/**
 * Palau's Rock Islands behind them on the left: limestone islets undercut by the sea into mushrooms, jungle on top,
 * and the big cliff with the round scar where she was cut out (the clue: the quarry, verse 1's first line). They
 * shrink towards the left horizon as the canoe pulls away.
 */
export function palau(c: C2, t: number, travel: number) {
  const r = recede(travel), k = 1 / (1 + 2.6 * r);       // perspective scale
  const vx = -260;                                        // the vanishing point, off the left edge on the horizon
  const isles: [number, number, number][] = [[120, 150, 210], [330, 60, 92], [430, 74, 116], [520, 40, 64], [250, 36, 52]];
  c.save();
  // the big cliff with the quarry's round scar
  const cx = vx + (180 - vx) * k, w = 420 * k, h = 190 * k;
  c.fillStyle = '#1b1234';
  c.beginPath();
  c.moveTo(cx - w * 0.6, HORIZON + 2);
  c.lineTo(cx - w * 0.52, HORIZON - h * 0.86); c.quadraticCurveTo(cx - w * 0.3, HORIZON - h * 1.05, cx, HORIZON - h);
  c.quadraticCurveTo(cx + w * 0.3, HORIZON - h * 1.08, cx + w * 0.44, HORIZON - h * 0.9);
  c.lineTo(cx + w * 0.5, HORIZON - h * 0.2); c.quadraticCurveTo(cx + w * 0.47, HORIZON - h * 0.06, cx + w * 0.54, HORIZON + 2);
  c.closePath(); c.fill();
  // jungle on the cliff top
  c.beginPath();
  for (let i = 0; i < 9; i++) { const x = cx - w * 0.5 + (i / 8) * w * 0.94, y = HORIZON - h * (0.93 + 0.06 * Math.sin(i * 2.1)); c.moveTo(x + w * 0.07, y); c.arc(x, y, w * 0.07, 0, TAU); }
  c.fill();
  // the moonlit cliff face and the scar where a disc was cut out of it
  c.strokeStyle = 'rgba(160,140,220,0.35)'; c.lineWidth = Math.max(1, 2 * k);
  c.beginPath(); c.moveTo(cx + w * 0.44, HORIZON - h * 0.9); c.lineTo(cx + w * 0.5, HORIZON - h * 0.2); c.stroke();
  // the quarry: a round cut in the face, pale fresh limestone where a disc was prised out, chisel marks round it
  const sr = h * 0.26, sx = cx + w * 0.12, sy = HORIZON - h * 0.48;
  c.fillStyle = '#4a3c78'; c.beginPath(); c.arc(sx, sy, sr, 0, TAU); c.fill();
  c.fillStyle = '#2c2152'; c.beginPath(); c.arc(sx - sr * 0.18, sy + sr * 0.1, sr * 0.86, 0, TAU); c.fill(); // its depth in shadow
  c.strokeStyle = 'rgba(244,231,200,0.5)'; c.lineWidth = Math.max(1, 2.2 * k);
  c.beginPath(); c.arc(sx, sy, sr, -2.2, 0.7); c.stroke();
  c.strokeStyle = 'rgba(244,231,200,0.28)'; c.lineWidth = Math.max(1, 1.4 * k);
  c.beginPath();
  for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU + 0.2, r1 = sr * 1.08, r2 = sr * (1.22 + 0.1 * h01(i, 451)); c.moveTo(sx + Math.cos(a) * r1, sy + Math.sin(a) * r1); c.lineTo(sx + Math.cos(a) * r2, sy + Math.sin(a) * r2); }
  c.stroke();
  // the mushroom islets
  for (const [i, [x0, w0, h0]] of isles.entries()) {
    const x = vx + (x0 - vx) * k, iw = w0 * k, ih = h0 * k;
    c.fillStyle = i % 2 ? '#20163c' : '#181030';
    c.beginPath();
    c.moveTo(x - iw * 0.28, HORIZON + 2);
    c.quadraticCurveTo(x - iw * 0.22, HORIZON - ih * 0.3, x - iw * 0.55, HORIZON - ih * 0.55);
    c.quadraticCurveTo(x - iw * 0.62, HORIZON - ih * 1.02, x, HORIZON - ih);
    c.quadraticCurveTo(x + iw * 0.62, HORIZON - ih * 1.02, x + iw * 0.55, HORIZON - ih * 0.55);
    c.quadraticCurveTo(x + iw * 0.22, HORIZON - ih * 0.3, x + iw * 0.28, HORIZON + 2);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(160,140,220,0.3)'; c.lineWidth = Math.max(1, 1.6 * k);
    c.beginPath(); c.moveTo(x + iw * 0.3, HORIZON - ih * 0.98); c.quadraticCurveTo(x + iw * 0.62, HORIZON - ih * 0.9, x + iw * 0.55, HORIZON - ih * 0.55); c.stroke();
    // the sea's notch at the waterline, glinting
    c.strokeStyle = 'rgba(255,231,194,0.25)';
    c.beginPath(); c.moveTo(x - iw * 0.5, HORIZON + 1); c.lineTo(x + iw * 0.5, HORIZON + 1); c.stroke();
  }
  c.restore();
  void t;
}

/** Distant lightning inside the storm bank, silent, long before the storm (a clue). */
const FAR_FLASH = [2.75, 5.95, 7.72, 9.6, 10.9, 11.95];
export function farFlash(t: number) { let v = 0; for (const x of FAR_FLASH) if (t >= x && t < x + 0.35) v = Math.max(v, Math.pow(0.5, (t - x) / 0.05) + 0.5 * Math.pow(0.5, Math.abs(t - x - 0.13) / 0.03)); return Math.min(1, v); }

/** The storm bank's puffs: cumulus towers on the right horizon, tallest in the middle, growing with `grow`. */
function bankPuffs(t: number, grow: number): [number, number, number][] {
  const base = HORIZON + 4, x0 = 1290 - 170 * grow, x1 = W + 220, out: [number, number, number][] = [];
  for (let i = 0; i < 22; i++) {
    const u = (i + 0.5 * h01(i, 433)) / 22, x = x0 + u * (x1 - x0);
    const tower = Math.exp(-(((u - 0.5) / 0.3) ** 2));
    const r = (30 + 34 * h01(i, 431)) * (0.75 + 0.55 * grow) * (0.65 + 0.5 * tower);
    const lift = (40 + 300 * grow) * tower * (0.6 + 0.4 * h01(i, 432));
    out.push([x, base - 26 - lift * (i % 3 === 0 ? 1 : 0.62) + 4 * Math.sin(t * 0.4 + i), r]);
    if (i % 3 === 0) out.push([x + r * 0.5, base - 26 - lift * 0.3, r * 1.1]);
  }
  return out;
}
function bankPath(c: C2, t: number, grow: number) {
  const base = HORIZON + 4, x0 = 1290 - 170 * grow;
  c.beginPath();
  c.rect(x0 + 30, base - 46, W + 300 - x0, 50);
  for (const [x, y, r] of bankPuffs(t, grow)) { c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); }
  // the anvil spreading off the tallest towers
  if (grow > 0.25) {
    const top = base - 26 - (40 + 300 * grow) - 40, ax = x0 + 0.5 * (W + 220 - x0), sp = 120 + 260 * grow;
    c.moveTo(ax - sp, top + 34); c.quadraticCurveTo(ax, top - 40 * grow, ax + sp * 1.2, top + 26); c.quadraticCurveTo(ax, top + 40, ax - sp, top + 34);
  }
}

/**
 * The storm massing on the right horizon from the first frame: a bank of cumulus towers, an anvil spreading as it
 * grows, its moon side lit, flaring from inside now and then with silent lightning (the clue: what is coming).
 */
export function stormBank(c: C2, t: number, grow: number) {
  const flash = farFlash(t);
  c.save();
  bankPath(c, t, grow);
  c.fillStyle = flash > 0 ? `rgb(${Math.round(42 + 140 * flash)},${Math.round(34 + 125 * flash)},${Math.round(76 + 160 * flash)})` : '#2a2148';
  c.fill();
  // the moon side of each puff, lit
  c.strokeStyle = rgbaHex('#8f7fe0', 0.42); c.lineWidth = 2.2;
  for (const [x, y, r] of bankPuffs(t, grow)) { c.beginPath(); c.arc(x, y, r - 1, Math.PI * 1.05, Math.PI * 1.55); c.stroke(); }
  c.restore();
}

/** The far lightning's glow, confined to the bank (for the additive layer). */
export function bankGlow(g: C2, t: number, grow: number) {
  const ff = farFlash(t);
  if (ff <= 0.02) return;
  g.save();
  bankPath(g, t, grow); g.clip();
  const cx = 1520 + 120 * h01(Math.floor(t * 3), 441), cy = HORIZON - 80 - 150 * grow;
  const gr = g.createRadialGradient(cx, cy, 0, cx, cy, 260);
  gr.addColorStop(0, rgbaHex('#e6dcff', 0.6 * ff)); gr.addColorStop(1, rgbaHex('#b9a6ff', 0.05 * ff));
  g.fillStyle = gr; g.fillRect(1000, HORIZON - 600, 1100, 640);
  g.restore();
}

/** A school following the canoe just under the moonlit surface; they glint when they turn into the moon's path. */
export function seaFish(c: C2, g: C2 | null, t: number, travel: number, alpha = 1) {
  for (let i = 0; i < 16; i++) {
    const lane = h01(i, 411), depthY = WL + 40 + 170 * h01(i, 412) ** 1.3;
    const x = 620 + 760 * lane + 60 * Math.sin(t * (0.5 + 0.4 * h01(i, 413)) + i) + 30 * Math.sin(travel * 0.3 + i);
    const dir = Math.cos(t * (0.5 + 0.4 * h01(i, 413)) + i) >= 0 ? 1 : -1;
    const s = 9 + 7 * h01(i, 414), y = depthY + 6 * Math.sin(t * 1.7 + i * 2);
    c.save(); c.translate(x, y); c.scale(dir, 1);
    c.fillStyle = `rgba(150,160,230,${0.32 * alpha})`;
    c.beginPath(); c.ellipse(0, 0, s, s * 0.32, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(-s * 0.8, 0); c.lineTo(-s * 1.4, -s * 0.35); c.lineTo(-s * 1.4, s * 0.35); c.closePath(); c.fill();
    c.restore();
    // the glint: a flank turning to the moon (brighter in the moon's path)
    const inPath = 1 - clamp(Math.abs(x - MOON.x) / 420);
    const gl = Math.pow(Math.max(0, Math.sin(t * (1.9 + 1.3 * h01(i, 415)) + i * 2.3)), 18) * (0.35 + 0.65 * inPath);
    if (g && gl > 0.03) {
      g.fillStyle = rgbaHex('#fff4dc', gl * alpha);
      g.beginPath(); g.ellipse(x, y - 1, s * 0.9, s * 0.22, 0, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(x - s * 1.4 * gl, y); g.lineTo(x + s * 1.4 * gl, y); g.moveTo(x, y - s * gl); g.lineTo(x, y + s * gl);
      g.strokeStyle = rgbaHex('#fff4dc', gl * alpha); g.lineWidth = 1.5; g.stroke();
    }
  }
}

/** A flying fish leaps across the moon's path (once, at t0). */
export function flyingFish(c: C2, t: number, t0: number) {
  const u = (t - t0) / 0.75;
  if (u < -0.1 || u > 1.15) return;
  const x0 = 1430, x1 = 1640, ys = WL + 30;
  const uu = clamp(u), x = x0 + (x1 - x0) * uu, y = ys - 120 * 4 * uu * (1 - uu);
  if (u >= 0 && u <= 1) {
    const ang = Math.atan2(-120 * 4 * (1 - 2 * uu), x1 - x0);
    c.save(); c.translate(x, y); c.rotate(ang);
    c.fillStyle = INK_SIL;
    c.beginPath(); c.ellipse(0, 0, 18, 5, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(4, -2); c.lineTo(-10, -20 - 4 * Math.sin(t * 40)); c.lineTo(-14, -3); c.closePath(); c.fill(); // a wing-fin
    c.beginPath(); c.moveTo(-16, 0); c.lineTo(-26, -7); c.lineTo(-26, 7); c.closePath(); c.fill();
    c.restore();
  }
  for (const [tx, ta] of [[x0, t0], [x1, t0 + 0.75]] as const) { // the spray where it leaves and lands
    const a = t - ta;
    if (a < 0 || a > 0.4) continue;
    for (let d = 0; d < 8; d++) {
      const vx = (h01(d, 421) - 0.5) * 160, vy = -(80 + 140 * h01(d, 422));
      const px = tx + vx * a, py = ys + vy * a + 700 * a * a;
      if (py > ys + 2) continue;
      c.fillStyle = rgbaHex('#e8f4ff', 0.8 * (1 - a / 0.4));
      c.beginPath(); c.arc(px, py, 2.2, 0, TAU); c.fill();
    }
  }
}

/**
 * The whole night world behind the canoe (shared by voyage and sinking's title): the sky, the storm bank on the
 * horizon, Palau receding, the clouds coming over, the sea and its fish; glints and the lantern's glow go to `g`.
 */
export function nightWorld(c: C2, g: C2, t: number, rh: Rhythm, o: { storm: number; starStorm?: number; rough: number; moon?: number; bank?: number; lit?: number; bob?: number }) {
  const travel = rh.seaTravel(t);
  sky(c, t, rh, { storm: o.starStorm ?? o.storm, moon: o.moon });
  stormBank(c, t, o.bank ?? clamp(t / 11));
  if (recede(travel) < 1) palau(c, t, travel);
  clouds(c, t, o.storm, o.lit ?? 0);
  sea(c, t, travel, o.rough, { moon: o.moon });
  seaFish(c, g, t, travel, 1 - 0.7 * o.storm);
  // the far lightning's glow inside the bank, and the bow lantern
  bankGlow(g, t, o.bank ?? clamp(t / 11));
  const fl = 0.8 + 0.2 * Math.sin(t * 13) * Math.sin(t * 7.3), ly = LANTERN.y + (o.bob ?? 0);
  const lg = g.createRadialGradient(LANTERN.x, ly, 0, LANTERN.x, ly, 42);
  lg.addColorStop(0, rgbaHex('#ffcf6b', 0.4 * fl)); lg.addColorStop(1, rgbaHex('#ffcf6b', 0));
  g.fillStyle = lg; g.fillRect(LANTERN.x - 42, ly - 42, 84, 84);
}
