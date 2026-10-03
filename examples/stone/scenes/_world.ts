// Environments (his note, 2026-10-02: "each scene should still be set in some environment that isn't a powerpoint
// presentation ... seemingly irrelevant background details are symbolic clues to what is going on in the scene or
// foreshadowing for what is to come in the next scene. The bottom of the ocean is a cartoon blueness - with reeds
// rippling and fish swimming randomly by (and a cool shark for no particular reason)").
// Canvas2D in the 1920x1080 logical frame, y down; pure functions of t. Draw `seabed()` behind the characters and
// `seabedFront()` after them (the near reeds and bubbles that pass in front).
import { W, H } from '../engine/gl';
import { h01 } from './_rai';

type C2 = CanvasRenderingContext2D;
const TAU = Math.PI * 2;

export interface SeabedOpts {
  /** 0 bright shallows .. 1 the deep. */
  depth?: number;
  /** Where the sand meets the water (px from the top). */
  floor?: number;
  /** Camera drift in px (parallax), e.g. a slow pan. */
  pan?: number;
  /** Background clues on the sand: a half-buried rai stone (others like her), an anchor (the trader to come), a bottle. */
  clues?: ('stone' | 'anchor' | 'bottle' | 'coin' | 'shells')[];
  /** The shark: on (default) crosses now and then for no particular reason. */
  shark?: boolean;
  seed?: number;
}

/** The sea floor behind everything: water, rays, far reeds, fish, the shark, sand, coral, clues, mid reeds. */
export function seabed(c: C2, t: number, o: SeabedOpts = {}) {
  const depth = o.depth ?? 0.3, fy = o.floor ?? H * 0.74, pan = o.pan ?? 0, seed = o.seed ?? 1;
  // cartoon water: bright turquoise at the top to deep blue at the floor
  const g = c.createLinearGradient(0, 0, 0, fy);
  g.addColorStop(0, mix('#4fd6f2', '#1b5fa8', depth)); g.addColorStop(0.55, mix('#2a9fe0', '#123f86', depth)); g.addColorStop(1, mix('#1764b8', '#0b2a62', depth));
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // the surface far above: a bright wobbling band of light
  c.save();
  c.globalAlpha = 0.5 * (1 - depth);
  c.fillStyle = '#d9fbff';
  c.beginPath(); c.moveTo(0, 0);
  for (let x = 0; x <= W; x += 40) c.lineTo(x, 14 + 8 * Math.sin(x * 0.01 + t * 1.3));
  c.lineTo(W, 0); c.closePath(); c.fill();
  c.restore();
  // god rays
  c.save();
  c.globalCompositeOperation = 'screen';
  for (let k = 0; k < 8; k++) {
    const x = (0.06 + 0.12 * k + 0.03 * Math.sin(t * 0.2 + k * 1.7)) * W - pan * 0.1;
    const sp = (0.04 + 0.03 * h01(k, seed, 3)) * W, a = (0.1 + 0.06 * Math.sin(t * 0.5 + k * 2.1)) * (1 - 0.6 * depth);
    const rg = c.createLinearGradient(0, 0, 0, fy);
    rg.addColorStop(0, `rgba(220,250,255,${a})`); rg.addColorStop(1, 'rgba(220,250,255,0)');
    c.fillStyle = rg;
    c.beginPath(); c.moveTo(x - sp * 0.2, 0); c.lineTo(x + sp * 0.2, 0); c.lineTo(x + sp * 1.6 + 60, fy); c.lineTo(x - sp * 1.0 + 60, fy); c.closePath(); c.fill();
  }
  c.restore();
  // the far layer: a silhouette ridge, far reeds, far fish, and the shark
  c.fillStyle = mix('#2b7fc9', '#123a78', depth);
  c.beginPath(); c.moveTo(0, fy);
  for (let x = 0; x <= W; x += 60) c.lineTo(x, fy - 60 - 50 * Math.sin((x + pan * 0.3) * 0.004 + seed) - 25 * Math.sin((x + pan * 0.3) * 0.013));
  c.lineTo(W, fy); c.closePath(); c.fill();
  for (let i = 0; i < 24; i++) reed(c, ((h01(i, seed, 11) * (W + 200) - pan * 0.3) % (W + 200)) - 100, fy - 40, 70 + 90 * h01(i, seed, 12), t, i, mix('#2f8fb8', '#1d4d80', depth), 9);
  if (o.shark !== false) sharkPass(c, t, fy, pan, depth);
  fishSchool(c, t, fy * 0.35, 0.45, 7, seed + 1, '#ffd23f', pan * 0.4, 0.55);
  // the sand
  const sg = c.createLinearGradient(0, fy - 30, 0, H);
  sg.addColorStop(0, '#f1dc9e'); sg.addColorStop(1, '#c9a96a');
  c.fillStyle = sg;
  c.beginPath(); c.moveTo(0, H);
  for (let x = 0; x <= W; x += 40) c.lineTo(x, fy + 12 * Math.sin((x + pan) * 0.006 + seed) + 6 * Math.sin((x + pan) * 0.021));
  c.lineTo(W, H); c.closePath(); c.fill();
  // caustics: a dancing net of light on the sand
  c.save();
  c.beginPath(); c.rect(0, fy - 10, W, H - fy + 10); c.clip();
  c.globalCompositeOperation = 'screen';
  c.strokeStyle = 'rgba(255,255,230,0.35)'; c.lineWidth = 3;
  for (let j = 0; j < 9; j++) {
    const yy = fy + 14 + j * ((H - fy) / 9);
    c.beginPath();
    for (let x = -20; x <= W + 20; x += 24) {
      const y2 = yy + 9 * Math.sin(x * 0.02 + t * 1.6 + j * 2.3) + 6 * Math.sin(x * 0.047 - t * 1.1 + j);
      x === -20 ? c.moveTo(x, y2) : c.lineTo(x, y2);
    }
    c.stroke();
  }
  c.restore();
  // sand ripples, pebbles and shells
  c.strokeStyle = 'rgba(160,125,70,0.35)'; c.lineWidth = 2;
  for (let i = 0; i < 26; i++) {
    const x = ((h01(i, seed, 21) * (W + 300) - pan) % (W + 300)) - 150, y = fy + 30 + h01(i, seed, 22) * (H - fy - 40);
    c.beginPath(); c.moveTo(x - 40, y); c.quadraticCurveTo(x, y - 8, x + 40, y); c.stroke();
  }
  // coral clumps
  for (let i = 0; i < 6; i++) coral(c, ((h01(i, seed, 31) * (W + 400) - pan * 0.8) % (W + 400)) - 200, fy + 10 + 40 * h01(i, seed, 32), 50 + 50 * h01(i, seed, 33), i, t);
  // clues
  for (const k of o.clues ?? ['stone', 'anchor']) clue(c, k, fy, pan, t, seed);
  // mid reeds and a second school
  for (let i = 0; i < 16; i++) reed(c, ((h01(i, seed, 41) * (W + 300) - pan * 0.8) % (W + 300)) - 150, fy + 8 + 20 * h01(i, seed, 42), 120 + 160 * h01(i, seed, 43), t, i + 50, '#2fae6a', 14);
  fishSchool(c, t, fy * 0.6, 1, 5, seed + 2, '#ff8a2a', pan, 1);
}

/** The near layer, drawn after the characters: big dark reeds at the edges and bubbles rising. */
export function seabedFront(c: C2, t: number, o: { floor?: number; pan?: number; seed?: number } = {}) {
  const fy = o.floor ?? H * 0.74, pan = o.pan ?? 0, seed = o.seed ?? 1;
  for (let i = 0; i < 5; i++) {
    const side = i % 2 ? 1 : -1, x = side > 0 ? W - 40 - 90 * h01(i, seed, 51) : 40 + 90 * h01(i, seed, 51);
    reed(c, x - pan * 1.4 * 0.1, H + 20, 260 + 220 * h01(i, seed, 52), t, i + 90, '#13633e', 26);
  }
  c.strokeStyle = 'rgba(220,250,255,0.7)';
  for (let i = 0; i < 18; i++) {
    const x = h01(i, seed, 61) * W + 12 * Math.sin(t * 1.4 + i), r = 4 + 10 * h01(i, seed, 62);
    const y = H - ((h01(i, seed, 63) + t * 0.12 * (0.6 + h01(i, seed, 64))) % 1.15) * H;
    c.lineWidth = 2; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
  }
  void fy;
}

/** A reed or kelp ribbon rooted at (x, y), height h, rippling. */
export function reed(c: C2, x: number, y: number, h: number, t: number, i: number, col: string, w: number) {
  const segs = 10, sway = 0.12 + 0.08 * h01(i, 71);
  c.save();
  c.fillStyle = col;
  const left: [number, number][] = [], right: [number, number][] = [];
  for (let s = 0; s <= segs; s++) {
    const u = s / segs;
    const off = Math.sin(t * 1.4 + i * 0.7 + u * 3.2) * h * sway * u * u;
    const px = x + off, py = y - h * u, ww = w * (1 - u * 0.85);
    left.push([px - ww / 2, py]); right.push([px + ww / 2, py]);
  }
  c.beginPath(); c.moveTo(left[0]![0], left[0]![1]);
  for (const p of left) c.lineTo(p[0], p[1]);
  for (let k = right.length - 1; k >= 0; k--) c.lineTo(right[k]![0], right[k]![1]);
  c.closePath(); c.fill();
  c.restore();
}

/** A cartoon coral clump: branching rounded fingers. */
export function coral(c: C2, x: number, y: number, s: number, i: number, t: number) {
  const cols = ['#ff7a8a', '#ff9f5a', '#c65cf0', '#ff5fa2'];
  c.save();
  c.strokeStyle = cols[i % cols.length]!; c.lineCap = 'round';
  const branch = (bx: number, by: number, a: number, len: number, d: number) => {
    const ex = bx + Math.cos(a) * len, ey = by + Math.sin(a) * len;
    c.lineWidth = Math.max(4, len * 0.32);
    c.beginPath(); c.moveTo(bx, by); c.lineTo(ex, ey); c.stroke();
    if (d > 0) { branch(ex, ey, a - 0.45 + 0.05 * Math.sin(t + i), len * 0.72, d - 1); branch(ex, ey, a + 0.45, len * 0.72, d - 1); }
  };
  branch(x, y, -Math.PI / 2, s * 0.45, 3);
  c.restore();
}

/** One cartoon fish at (x, y), facing `dir` (1 right, -1 left), size s. */
export function fish(c: C2, x: number, y: number, s: number, col: string, dir: number, t: number, i = 0) {
  c.save();
  c.translate(x, y); c.scale(dir, 1);
  const wag = Math.sin(t * 12 + i) * 0.25;
  c.fillStyle = col;
  c.beginPath(); c.ellipse(0, 0, s, s * 0.55, 0, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(-s * 0.8, 0); c.lineTo(-s * 1.55, -s * (0.55 + wag)); c.lineTo(-s * 1.55, s * (0.55 - wag)); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.55)';
  c.beginPath(); c.ellipse(-s * 0.1, -s * 0.12, s * 0.12, s * 0.42, 0, 0, TAU); c.fill();
  c.fillStyle = '#ffffff'; c.beginPath(); c.arc(s * 0.5, -s * 0.12, s * 0.17, 0, TAU); c.fill();
  c.fillStyle = '#120d1d'; c.beginPath(); c.arc(s * 0.55, -s * 0.12, s * 0.09, 0, TAU); c.fill();
  c.restore();
}

/** A school of fish crossing at height y, drifting with t (deterministic), scale k. */
export function fishSchool(c: C2, t: number, y: number, k: number, n: number, seed: number, col: string, pan = 0, alpha = 1) {
  const dir = h01(seed, 81) < 0.5 ? 1 : -1, speed = 60 + 50 * h01(seed, 82), span = W + 600;
  const x0 = ((h01(seed, 83) * span + t * speed - pan) % span + span) % span - 300;
  c.save(); c.globalAlpha = alpha;
  for (let i = 0; i < n; i++) {
    const fx = dir > 0 ? x0 - i * 46 * k * (0.8 + 0.4 * h01(i, seed, 84)) : W - x0 + i * 46 * k;
    const fy = y + 40 * k * Math.sin(i * 1.7) + 10 * Math.sin(t * 2 + i);
    fish(c, fx, fy, 16 * k * (0.8 + 0.4 * h01(i, seed, 85)), i % 3 ? col : '#ffffff', dir, t, i);
  }
  c.restore();
}

/** The shark: every ~26 s a big cartoon shark glides across the far water, then is gone. For no particular reason. */
export function sharkPass(c: C2, t: number, fy: number, pan: number, depth: number) {
  const period = 26, u = ((t + 9) % period) / 9; // on screen for 9 s of every 26
  if (u > 1) return;
  const pass = Math.floor((t + 9) / period), dir = pass % 2 ? -1 : 1;
  const x = dir > 0 ? -300 + u * (W + 600) : W + 300 - u * (W + 600);
  const y = fy * (0.42 + 0.12 * h01(pass, 91)) + 14 * Math.sin(t * 0.9);
  shark(c, x - pan * 0.2, y, 160, dir, t, mix('#5d86b3', '#33507e', depth));
}

/** A cartoon shark (side view) at (x, y), length 2s, facing dir; a toothy grin. */
export function shark(c: C2, x: number, y: number, s: number, dir: number, t: number, col = '#5d86b3') {
  c.save();
  c.translate(x, y); c.scale(dir, 1);
  const wag = Math.sin(t * 3) * 0.12;
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(s * 1.1, 0);
  c.quadraticCurveTo(s * 0.6, -s * 0.38, -s * 0.4, -s * 0.22);
  c.quadraticCurveTo(-s * 0.85, -s * 0.12, -s * 1.0, 0);
  c.quadraticCurveTo(-s * 0.85, s * 0.12, -s * 0.4, s * 0.2);
  c.quadraticCurveTo(s * 0.6, s * 0.34, s * 1.1, 0);
  c.fill();
  // tail, dorsal and pectoral fins
  c.beginPath(); c.moveTo(-s * 0.95, 0); c.lineTo(-s * 1.45, -s * (0.45 + wag)); c.lineTo(-s * 1.25, 0); c.lineTo(-s * 1.4, s * (0.32 - wag)); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(s * 0.05, -s * 0.28); c.lineTo(-s * 0.2, -s * 0.72); c.lineTo(-s * 0.35, -s * 0.24); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(s * 0.25, s * 0.2); c.lineTo(-s * 0.05, s * 0.55); c.lineTo(-s * 0.1, s * 0.2); c.closePath(); c.fill();
  // belly, gills, eye, grin
  c.fillStyle = 'rgba(235,245,255,0.75)';
  c.beginPath(); c.moveTo(s * 1.05, s * 0.03); c.quadraticCurveTo(s * 0.4, s * 0.28, -s * 0.5, s * 0.12); c.quadraticCurveTo(s * 0.4, s * 0.12, s * 1.05, s * 0.03); c.fill();
  c.strokeStyle = 'rgba(20,30,60,0.6)'; c.lineWidth = s * 0.02;
  for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(s * (0.45 - i * 0.07), -s * 0.08); c.lineTo(s * (0.42 - i * 0.07), s * 0.1); c.stroke(); }
  c.fillStyle = '#ffffff'; c.beginPath(); c.arc(s * 0.72, -s * 0.1, s * 0.06, 0, TAU); c.fill();
  c.fillStyle = '#120d1d'; c.beginPath(); c.arc(s * 0.74, -s * 0.1, s * 0.03, 0, TAU); c.fill();
  c.strokeStyle = '#120d1d'; c.lineWidth = s * 0.025;
  c.beginPath(); c.moveTo(s * 0.98, s * 0.06); c.quadraticCurveTo(s * 0.78, s * 0.16, s * 0.6, s * 0.08); c.stroke();
  c.fillStyle = '#ffffff';
  for (let i = 0; i < 4; i++) { const tx = s * (0.95 - i * 0.09); c.beginPath(); c.moveTo(tx, s * 0.07); c.lineTo(tx - s * 0.03, s * 0.12); c.lineTo(tx - s * 0.06, s * 0.07); c.fill(); }
  c.restore();
}

/** Clues on the sand. */
function clue(c: C2, k: string, fy: number, pan: number, t: number, seed: number) {
  if (k === 'stone') { // another rai stone, half buried and tilted: others like her down here
    const x = W * 0.16 - pan * 0.8, y = fy + 30;
    c.save(); c.translate(x, y); c.rotate(-0.25);
    c.beginPath(); c.arc(0, 0, 70, 0, TAU); c.moveTo(19, 4); c.arc(0, 4, 19, 0, TAU);
    c.fillStyle = '#cfc4ad'; c.fill('evenodd'); c.lineWidth = 3; c.strokeStyle = '#6f6656'; c.stroke();
    c.restore();
    c.fillStyle = '#e6cf91'; c.beginPath(); c.ellipse(x, y + 52, 110, 34, 0, 0, TAU); c.fill();
  } else if (k === 'anchor') { // an old ship's anchor, rusted: the iron hull that will come
    const x = W * 0.82 - pan * 0.8, y = fy + 40;
    c.save(); c.translate(x, y); c.rotate(0.35);
    c.strokeStyle = '#7a4e33'; c.lineCap = 'round'; c.lineWidth = 12;
    c.beginPath(); c.moveTo(0, -90); c.lineTo(0, 20); c.stroke();
    c.beginPath(); c.arc(0, -10, 50, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    c.lineWidth = 10; c.beginPath(); c.moveTo(-28, -70); c.lineTo(28, -70); c.stroke();
    c.lineWidth = 6; c.beginPath(); c.arc(0, -102, 13, 0, TAU); c.stroke();
    c.restore();
    c.fillStyle = '#e6cf91'; c.beginPath(); c.ellipse(x + 10, y + 28, 90, 22, 0, 0, TAU); c.fill();
  } else if (k === 'bottle') { // a bottle with a note (a message nobody has read)
    const x = W * 0.62 - pan * 0.8, y = fy + 70;
    c.save(); c.translate(x, y); c.rotate(-0.4);
    c.fillStyle = 'rgba(120,200,160,0.7)'; c.beginPath(); c.roundRect(-34, -14, 68, 28, 12); c.fill();
    c.fillRect(30, -6, 18, 12);
    c.fillStyle = '#f4e7c4'; c.fillRect(-18, -6, 36, 12);
    c.restore();
  } else if (k === 'coin') { // a coin glinting in the sand
    const x = W * 0.42 - pan * 0.8, y = fy + 90;
    c.fillStyle = '#f6c453'; c.beginPath(); c.ellipse(x, y, 16, 7, 0, 0, TAU); c.fill();
    const tw = 0.5 + 0.5 * Math.sin(t * 3);
    c.fillStyle = `rgba(255,255,255,${tw})`; c.beginPath(); c.arc(x + 6, y - 3, 3, 0, TAU); c.fill();
  } else if (k === 'shells') {
    for (let i = 0; i < 8; i++) {
      const x = h01(i, seed, 101) * W - pan * 0.8, y = fy + 40 + h01(i, seed, 102) * (H - fy - 60);
      c.fillStyle = i % 2 ? '#ffd2c4' : '#fff1d6';
      c.beginPath(); c.arc(x, y, 9, Math.PI, 0); c.closePath(); c.fill();
    }
  }
}

function mix(a: string, b: string, u: number): string {
  const p = parseInt(a.slice(1), 16), q = parseInt(b.slice(1), 16), v = Math.max(0, Math.min(1, u));
  const ch = (s: number) => Math.round(((p >> s) & 255) + (((q >> s) & 255) - ((p >> s) & 255)) * v);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

// ------------------------------------------------------------------ the island (Yap, cartoon, never costume detail)

export type TimeOfDay = 'dawn' | 'day' | 'sunset' | 'night';
export interface IslandOpts {
  time?: TimeOfDay;
  /** The horizon's height (px from the top). */
  horizon?: number;
  /** Where the beach starts (px from the top). */
  beach?: number;
  pan?: number;
  /** What stands on the island: stilt huts, coloured palms, a stone-money bank (rai stones on a raised platform, as
   *  on Yap), outrigger canoes on the sand, a path, wedding lanterns, a steamship far out (the trader to come). */
  show?: ('huts' | 'palms' | 'bank' | 'canoes' | 'path' | 'lanterns' | 'ship' | 'clouds')[];
  seed?: number;
}

const SKY: Record<TimeOfDay, [string, string, string, string]> = { // sky top, sky horizon, sea near, sand
  dawn: ['#5a4aa8', '#ffb38a', '#3f6fb0', '#f0cf9a'],
  day: ['#3fa9f5', '#bfeaff', '#1f8fc9', '#f6dfa4'],
  sunset: ['#3b2a7a', '#ff8a5a', '#4a3f8f', '#e8b98a'],
  night: ['#0b0f2e', '#2b2f6a', '#141a46', '#5b5a7a'],
};

/** The island: sky, sun or moon, clouds, the sea, the beach, palms, huts, the stone bank, canoes. */
export function island(c: C2, t: number, o: IslandOpts = {}) {
  const tod = o.time ?? 'day', hz = o.horizon ?? H * 0.5, bch = o.beach ?? H * 0.68, pan = o.pan ?? 0, seed = o.seed ?? 3;
  const show = new Set(o.show ?? ['palms', 'huts', 'bank', 'canoes', 'clouds']);
  const [top, low, sea, sand] = SKY[tod];
  const g = c.createLinearGradient(0, 0, 0, hz);
  g.addColorStop(0, top); g.addColorStop(1, low);
  c.fillStyle = g; c.fillRect(0, 0, W, hz + 2);
  // sun or moon
  if (tod === 'night') {
    for (let i = 0; i < 160; i++) { c.fillStyle = `rgba(255,255,255,${0.3 + 0.6 * h01(i, 5, seed)})`; c.beginPath(); c.arc(h01(i, 6, seed) * W, h01(i, 7, seed) * hz * 0.9, 0.8 + 1.4 * h01(i, 8, seed), 0, TAU); c.fill(); }
    c.fillStyle = '#fff4d6'; c.shadowColor = '#fff4d6'; c.shadowBlur = 40;
    c.beginPath(); c.arc(W * 0.78 - pan * 0.05, hz * 0.3, 46, 0, TAU); c.fill(); c.shadowBlur = 0;
  } else {
    const sy = tod === 'day' ? hz * 0.22 : hz - 10, sx = W * (tod === 'dawn' ? 0.7 : tod === 'sunset' ? 0.3 : 0.75) - pan * 0.05;
    c.save(); c.shadowColor = '#fff2b0'; c.shadowBlur = 80;
    c.fillStyle = tod === 'day' ? '#fff6c8' : '#ffd36b'; c.beginPath(); c.arc(sx, sy, tod === 'day' ? 60 : 110, 0, TAU); c.fill();
    c.restore();
  }
  if (show.has('clouds')) for (let i = 0; i < 6; i++) {
    const x = ((h01(i, 11, seed) * (W + 600) + t * (8 + 6 * h01(i, 12, seed)) - pan * 0.1) % (W + 600)) - 300, y = hz * (0.12 + 0.5 * h01(i, 13, seed));
    cloud(c, x, y, 70 + 70 * h01(i, 14, seed), tod === 'night' ? 'rgba(80,90,150,0.6)' : tod === 'day' ? 'rgba(255,255,255,0.92)' : 'rgba(255,190,170,0.8)');
  }
  // the sea, with a sun path and surf lines
  const sg = c.createLinearGradient(0, hz, 0, bch);
  sg.addColorStop(0, low); sg.addColorStop(0.15, sea); sg.addColorStop(1, sea);
  c.fillStyle = sg; c.fillRect(0, hz, W, bch - hz + 2);
  c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2;
  for (let i = 0; i < 18; i++) {
    const y = hz + (bch - hz) * Math.pow((i + 1) / 19, 1.6), w = 40 + 160 * (i / 18);
    for (let k = 0; k < 6; k++) {
      const x = ((h01(i, k, seed + 20) * W + t * 12 * (k % 2 ? 1 : -1)) % W + W) % W - pan * 0.4;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + w / 2, y - 3, x + w, y); c.stroke();
    }
  }
  if (show.has('ship')) steamship(c, W * 0.86 - pan * 0.2, hz + 6, 0.35, t, tod === 'night' ? '#2b2f6a' : '#4f5d9a');
  // the beach with a foam line
  c.fillStyle = sand;
  c.beginPath(); c.moveTo(0, H);
  for (let x = 0; x <= W; x += 40) c.lineTo(x, bch + 10 * Math.sin((x + pan) * 0.004 + seed) + 4 * Math.sin((x + pan) * 0.02));
  c.lineTo(W, H); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 4;
  c.beginPath();
  for (let x = 0; x <= W; x += 30) { const y = bch - 4 + 10 * Math.sin((x + pan) * 0.004 + seed) + 5 * Math.sin(x * 0.03 + t * 2); x ? c.lineTo(x, y) : c.moveTo(x, y); }
  c.stroke();
  const dark = tod === 'night' ? 0.6 : tod === 'sunset' || tod === 'dawn' ? 0.25 : 0;
  if (show.has('path')) {
    c.fillStyle = 'rgba(150,120,80,0.35)';
    c.beginPath(); c.moveTo(W * 0.45 - pan, H); c.quadraticCurveTo(W * 0.5 - pan, bch + 60, W * 0.6 - pan, bch + 10); c.lineTo(W * 0.64 - pan, bch + 10); c.quadraticCurveTo(W * 0.56 - pan, bch + 60, W * 0.55 - pan, H); c.fill();
  }
  if (show.has('huts')) for (let i = 0; i < 3; i++) hut(c, W * (0.08 + 0.3 * i) + 40 * h01(i, 31, seed) - pan * 0.7, bch + 30, 150 + 40 * h01(i, 32, seed), tod === 'night', dark);
  if (show.has('bank')) stoneBank(c, W * 0.7 - pan * 0.8, bch + 70, 1, dark, seed);
  if (show.has('canoes')) for (let i = 0; i < 2; i++) canoe(c, W * (0.25 + 0.4 * i) - pan * 0.9, bch + 130 + 40 * i, 1 + 0.2 * i, dark);
  if (show.has('palms')) for (let i = 0; i < 5; i++) palmTree(c, W * (0.03 + 0.24 * i) + 60 * h01(i, 41, seed) - pan * 0.9, bch + 40 + 30 * h01(i, 42, seed), 300 + 140 * h01(i, 43, seed), (h01(i, 44, seed) - 0.5) * 0.5, t, i, dark);
  if (show.has('lanterns')) {
    c.strokeStyle = 'rgba(40,30,30,0.8)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(W * 0.15 - pan, bch - 160); c.quadraticCurveTo(W * 0.5 - pan, bch - 80, W * 0.85 - pan, bch - 170); c.stroke();
    for (let i = 0; i <= 14; i++) {
      const u = i / 14, x = W * (0.15 + 0.7 * u) - pan, y = (1 - u) * (1 - u) * (bch - 160) + 2 * (1 - u) * u * (bch - 80) + u * u * (bch - 170) + 8;
      const tw = 0.8 + 0.2 * Math.sin(t * 3 + i);
      c.fillStyle = `rgba(255,214,120,${tw})`; c.shadowColor = '#ffd678'; c.shadowBlur = 18;
      c.beginPath(); c.arc(x, y, 7, 0, TAU); c.fill();
    }
    c.shadowBlur = 0;
  }
}

/** A puffy cartoon cloud. */
export function cloud(c: C2, x: number, y: number, s: number, col: string) {
  c.fillStyle = col;
  c.beginPath();
  for (const [dx, dy, r] of [[-0.6, 0.1, 0.45], [-0.2, -0.15, 0.6], [0.3, -0.05, 0.5], [0.7, 0.12, 0.38], [0, 0.18, 0.5]] as const) {
    c.moveTo(x + dx * s + r * s, y + dy * s); c.arc(x + dx * s, y + dy * s, r * s, 0, TAU);
  }
  c.fill();
}

/** A coloured palm (trunk rings, fronds), rooted at (x, y). `dark` 0..1 shades it towards dusk. */
export function palmTree(c: C2, x: number, y: number, h: number, lean: number, t: number, i: number, dark = 0) {
  const tx = x + Math.sin(lean) * h, ty = y - Math.cos(lean) * h;
  c.save();
  c.lineCap = 'round';
  c.strokeStyle = shade('#9a6b3f', dark); c.lineWidth = h * 0.06;
  c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.sin(lean) * h * 0.2, y - h * 0.55, tx, ty); c.stroke();
  c.strokeStyle = shade('#6f4a2a', dark); c.lineWidth = 2;
  for (let k = 1; k < 10; k++) { const u = k / 10, px = x + (tx - x) * u * u + Math.sin(lean) * h * 0.2 * 2 * u * (1 - u), py = y + (ty - y) * u; c.beginPath(); c.moveTo(px - h * 0.025, py); c.lineTo(px + h * 0.025, py - 4); c.stroke(); }
  for (let k = 0; k < 7; k++) {
    const a = -Math.PI / 2 + (k - 3) * 0.5 + 0.05 * Math.sin(t * 1.3 + k + i), L = h * (0.4 + 0.08 * Math.sin(k * 2.3));
    const ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * 0.55 + L * 0.35;
    c.strokeStyle = shade(k % 2 ? '#2e9a4a' : '#3cb35a', dark); c.lineWidth = h * 0.045;
    c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx + Math.cos(a) * L * 0.5, ty + Math.sin(a) * L * 0.6 - L * 0.15, ex, ey); c.stroke();
  }
  c.fillStyle = shade('#7a5130', dark);
  for (const d of [-1, 1]) { c.beginPath(); c.arc(tx + d * 8, ty + 10, h * 0.025, 0, TAU); c.fill(); }
  c.restore();
}

/** A stilt hut with a thatched roof; lit windows at night. */
export function hut(c: C2, x: number, y: number, s: number, night: boolean, dark = 0) {
  c.save();
  c.strokeStyle = shade('#6f4a2a', dark); c.lineWidth = s * 0.04;
  for (const d of [-0.35, 0, 0.35]) { c.beginPath(); c.moveTo(x + d * s, y); c.lineTo(x + d * s, y - s * 0.35); c.stroke(); }
  c.fillStyle = shade('#c48a52', dark); c.fillRect(x - s * 0.42, y - s * 0.72, s * 0.84, s * 0.38);
  c.fillStyle = night ? '#ffcf6b' : shade('#5a3a20', dark); c.fillRect(x - s * 0.08, y - s * 0.6, s * 0.16, s * 0.26);
  if (night) { c.save(); c.shadowColor = '#ffcf6b'; c.shadowBlur = 30; c.fillRect(x - s * 0.08, y - s * 0.6, s * 0.16, s * 0.26); c.restore(); }
  c.fillStyle = shade('#d9b25e', dark);
  c.beginPath(); c.moveTo(x - s * 0.62, y - s * 0.66); c.lineTo(x, y - s * 1.18); c.lineTo(x + s * 0.62, y - s * 0.66); c.closePath(); c.fill();
  c.strokeStyle = shade('#a8843a', dark); c.lineWidth = 2;
  for (let k = 0; k < 14; k++) { const u = k / 13, px = x - s * 0.6 + u * s * 1.2; c.beginPath(); c.moveTo(px, y - s * 0.66); c.lineTo(px + (u - 0.5) * 6, y - s * 0.6); c.stroke(); }
  c.restore();
}

/** A Yap stone-money bank: a raised stone platform with rai stones of different sizes standing on it. */
export function stoneBank(c: C2, x: number, y: number, k: number, dark: number, seed: number) {
  c.save();
  c.fillStyle = shade('#8c8a80', dark);
  c.beginPath(); c.roundRect(x - 210 * k, y - 26 * k, 420 * k, 40 * k, 8); c.fill();
  c.fillStyle = shade('#a8a597', dark);
  for (let i = 0; i < 12; i++) { c.beginPath(); c.ellipse(x - 190 * k + i * 34 * k, y - 22 * k, 16 * k, 8 * k, 0, 0, TAU); c.fill(); }
  const sizes = [70, 110, 55, 90, 45];
  sizes.forEach((r, i) => {
    const sx = x - 160 * k + i * 80 * k, sy = y - 26 * k - r * k * 0.95;
    discStone(c, sx, sy, r * k, -0.08 + 0.16 * h01(i, seed, 51), dark);
  });
  c.restore();
}

/** A rai stone as set dressing (front on, its thickness showing; no glow). */
export function discStone(c: C2, x: number, y: number, r: number, tilt: number, dark = 0) {
  c.save();
  c.translate(x, y); c.rotate(tilt);
  c.fillStyle = shade('#8f8676', dark); c.beginPath(); c.ellipse(r * 0.12, 0, r * 0.94, r, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(0, 0, r * 0.94, r, 0, 0, TAU); c.moveTo(r * 0.26, r * 0.05); c.ellipse(0, r * 0.05, r * 0.25, r * 0.27, 0, 0, TAU);
  c.fillStyle = shade('#d9cfb8', dark); c.fill('evenodd');
  c.strokeStyle = shade('#6f6656', dark); c.lineWidth = Math.max(1.5, r * 0.04); c.stroke();
  c.restore();
}

/** An outrigger canoe drawn up on the sand, seen from the beach: a hull with upswept prow and stern, two curved
 *  booms reaching forward to the float lying on the sand nearer us, a furled mast laid along the hull. */
export function canoe(c: C2, x: number, y: number, k: number, dark = 0) {
  c.save();
  // the float, nearer us and lower, resting on the sand
  c.fillStyle = 'rgba(60,40,30,0.25)'; c.beginPath(); c.ellipse(x - 10 * k, y + 52 * k, 120 * k, 9 * k, 0, 0, TAU); c.fill();
  c.fillStyle = shade('#a4744a', dark); c.beginPath(); c.ellipse(x - 10 * k, y + 44 * k, 110 * k, 9 * k, 0, 0, TAU); c.fill();
  c.strokeStyle = shade('#6f4a2a', dark); c.lineWidth = 2; c.stroke();
  // the booms, curving down from the hull to the float
  c.strokeStyle = shade('#6f4a2a', dark); c.lineWidth = 5 * k; c.lineCap = 'round';
  for (const d of [-55, 45]) { c.beginPath(); c.moveTo(x + d * k, y - 6 * k); c.quadraticCurveTo(x + d * k - 4 * k, y + 18 * k, x + d * k - 8 * k, y + 40 * k); c.stroke(); }
  // the hull's shadow and the hull: a long boat with upswept, pointed ends
  c.fillStyle = 'rgba(60,40,30,0.3)'; c.beginPath(); c.ellipse(x, y + 10 * k, 160 * k, 10 * k, 0, 0, TAU); c.fill();
  c.fillStyle = shade('#8a5a32', dark);
  c.beginPath();
  c.moveTo(x - 170 * k, y - 34 * k);
  c.quadraticCurveTo(x - 150 * k, y + 8 * k, x - 60 * k, y + 8 * k);
  c.lineTo(x + 60 * k, y + 8 * k);
  c.quadraticCurveTo(x + 150 * k, y + 8 * k, x + 172 * k, y - 36 * k);
  c.quadraticCurveTo(x + 140 * k, y - 12 * k, x + 100 * k, y - 10 * k);
  c.lineTo(x - 100 * k, y - 10 * k);
  c.quadraticCurveTo(x - 140 * k, y - 12 * k, x - 170 * k, y - 34 * k);
  c.closePath(); c.fill();
  c.strokeStyle = shade('#5a3a20', dark); c.lineWidth = 2.5; c.stroke();
  c.strokeStyle = shade('#c48a52', dark); c.lineWidth = 3 * k;   // the gunwale
  c.beginPath(); c.moveTo(x - 150 * k, y - 18 * k); c.quadraticCurveTo(x, y - 6 * k, x + 150 * k, y - 20 * k); c.stroke();
  // the furled mast and sail laid along the hull
  c.strokeStyle = shade('#5a3a20', dark); c.lineWidth = 4 * k;
  c.beginPath(); c.moveTo(x - 120 * k, y - 16 * k); c.lineTo(x + 110 * k, y - 26 * k); c.stroke();
  c.fillStyle = shade('#e8d4a8', dark); c.beginPath(); c.ellipse(x - 5 * k, y - 22 * k, 90 * k, 6 * k, -0.04, 0, TAU); c.fill();
  c.restore();
}

/** An 1870s iron steamship in silhouette with smoke (side view), scale k, at waterline y. */
export function steamship(c: C2, x: number, y: number, k: number, t: number, col: string) {
  c.save();
  c.fillStyle = col;
  c.beginPath(); c.moveTo(x - 300 * k, y - 40 * k); c.lineTo(x + 330 * k, y - 40 * k); c.lineTo(x + 280 * k, y); c.lineTo(x - 260 * k, y); c.closePath(); c.fill();
  c.fillRect(x - 120 * k, y - 80 * k, 220 * k, 40 * k);
  c.fillRect(x - 20 * k, y - 170 * k, 40 * k, 90 * k);
  c.lineWidth = 6 * k; c.strokeStyle = col;
  for (const d of [-220, 200]) { c.beginPath(); c.moveTo(x + d * k, y - 40 * k); c.lineTo(x + d * k, y - 220 * k); c.stroke(); }
  for (let i = 0; i < 5; i++) {
    const u = ((t * 0.3 + i / 5) % 1);
    c.fillStyle = `rgba(60,60,70,${0.5 * (1 - u)})`;
    c.beginPath(); c.arc(x + u * 160 * k, y - 190 * k - u * 120 * k, (20 + u * 50) * k, 0, TAU); c.fill();
  }
  c.restore();
}

function shade(hex: string, dark: number): string { return mix(hex, '#1a1638', dark * 0.7); }
