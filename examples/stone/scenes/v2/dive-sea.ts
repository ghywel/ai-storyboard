// v2 "THE DIVER": the shared night set of `dive`, `lantern` and `legend` (all three are one place: the patch of seabed
// where Rai lies, off the end of the jetty), so the plates join. Canvas2D in the 1920x1080 logical frame, y down,
// pure functions of t. The wide shot is zoom 1; every closer shot is a camera on the same world (withCam2), so
// positions here are world positions.
//
//   - the seabed (the shared _world.seabed, at dusk depth) with its "street": ordinary rocks, each with a shell
//     letterbox on a twig post and a house-number pebble (3, 5, Rai is 7, 9, 11); Rai's letterbox is gold and stuffed
//     with post (deeds, wedding invitations: what an unseen stone is still trusted with)
//   - the bottle with its unread note, the crab (the street's postman)
//   - the dark (a soft mask with holes), the torch's volumetric beam with motes in it, bubbles and bokeh
//   - the girl's belt: the toy rai stone on a string and the little mesh purse (three coins in it: legend)
import { W, H, Layer2D, SCALE } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import { clamp, ease } from '../../engine/util';
import { h01 } from '../_rai';
import { FAM, TAU, rgbaHex, mixHex } from '../_motifs';
import { seabed, reed } from '../_world';
import type { GirlAnchors, GirlPose } from './_diver';

type C2 = CanvasRenderingContext2D;
export interface Cam { x?: number; y?: number; zoom?: number; rot?: number }

/** The set, at the wide (zoom 1). */
export const FLOOR = H * 0.74;
export const RAI = { x: 1180, y: 742, R: 104 };                 // her disc's centre: feet on the sand at ~853
export const KNEEL = { x: 760, y: 866, h: 300 };                // the girl kneeling, facing Rai (her knees' ground)
export const TORCH_REST = { x: 905, y: 868 };                   // where her torch lies on the sand, aimed at Rai
export const LETTERBOX = { x: RAI.x + 182, y: 872 };            // Rai's gold letterbox (its post's foot)
export const STREET = [                                         // the neighbours: x, house number, size, seed
  { x: 118, n: 3, s: 0.86, seed: 3 },
  { x: 430, n: 5, s: 1.0, seed: 5 },
  { x: 1560, n: 9, s: 0.95, seed: 9 },
  { x: 1830, n: 11, s: 0.8, seed: 11 },
] as const;
export const BOTTLE = { x: 598, y: 905 };

/** Rai's eyes (canvas px) from her anchors: drawRai puts them 1.2377 R up, 0.322 R either side. */
export function raiEyes(head: { x: number; y: number; r: number }): [{ x: number; y: number }, { x: number; y: number }] {
  const R = head.r / 0.74, ey = head.y - 0.04 * R;
  return [{ x: head.x - 0.322 * R, y: ey }, { x: head.x + 0.322 * R, y: ey }];
}
/** Her mouth, for the bubbles she lets out when she speaks under water. */
export function raiMouth(head: { x: number; y: number; r: number }, sd = false) {
  return sd ? { x: head.x, y: head.y + head.r * 0.38 } : { x: head.x, y: head.y + head.r * 0.36 };
}

// ------------------------------------------------------------------ the camera, for both layers and the dark

export function camApply(k: C2, cam: Cam) {
  k.translate(W / 2, H / 2); k.rotate(cam.rot ?? 0); k.scale(cam.zoom ?? 1, cam.zoom ?? 1); k.translate(-W / 2 - (cam.x ?? 0), -H / 2 - (cam.y ?? 0));
}
/** A camera framing world point (x, y) at the frame's centre with zoom z. */
export const frameOn = (x: number, y: number, z: number, rot = 0): Cam => ({ x: x - W / 2, y: y - H / 2, zoom: z, rot });
export const camMix = (a: Cam, b: Cam, u: number): Cam => {
  const m = (p?: number, q?: number, d = 0) => (p ?? d) + ((q ?? d) - (p ?? d)) * u;
  return { x: m(a.x, b.x), y: m(a.y, b.y), zoom: m(a.zoom, b.zoom, 1), rot: m(a.rot, b.rot) };
};
/** World to screen under a camera. */
export function toScreen(cam: Cam, x: number, y: number) {
  const z = cam.zoom ?? 1, r = cam.rot ?? 0;
  const dx = (x - W / 2 - (cam.x ?? 0)) * z, dy = (y - H / 2 - (cam.y ?? 0)) * z;
  return { x: W / 2 + dx * Math.cos(r) - dy * Math.sin(r), y: H / 2 + dx * Math.sin(r) + dy * Math.cos(r) };
}

// ------------------------------------------------------------------ the dark

/**
 * The deep at dusk: a soft mask laid over the lit scene, with holes where there is light. Half resolution (the holes
 * are soft); `begin` takes the same camera as the scene so the holes are placed in world px.
 */
export class Dark {
  L = new Layer2D(W, H, SCALE * 0.5);
  get m() { return this.L.ctx; }
  begin(a: number, cam: Cam = {}, col = '#03050f') {
    const m = this.m;
    this.L.clear();
    m.setTransform(1, 0, 0, 1, 0, 0);
    m.fillStyle = rgbaHex(col, a); m.fillRect(0, 0, W, H);
    m.globalCompositeOperation = 'destination-out';
    camApply(m, cam);
  }
  /** A soft elliptical hole, `a` how much light (0..1), rotated by `rot`. */
  hole(x: number, y: number, rx: number, ry: number, a: number, rot = 0, core = 0.55) {
    if (a <= 0 || rx < 1 || ry < 1) return;
    const m = this.m;
    m.save(); m.translate(x, y); m.rotate(rot); m.scale(1, ry / rx);
    const gr = m.createRadialGradient(0, 0, 0, 0, 0, rx);
    gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(core, `rgba(0,0,0,${a * 0.85})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    m.fillStyle = gr; m.fillRect(-rx, -rx, 2 * rx, 2 * rx);
    m.restore();
  }
  /** A crisp disc of light with a short feathered edge (the torch's circle, the ring). */
  disc(x: number, y: number, r: number, a: number, feather = 0.12) {
    if (a <= 0 || r < 1) return;
    const m = this.m, gr = m.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1 - feather, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    m.fillStyle = gr; m.beginPath(); m.arc(x, y, r, 0, TAU); m.fill();
  }
  /** The torch's cone: light along the beam, growing towards its end. */
  cone(x: number, y: number, ang: number, len: number, spread: number, a: number) {
    if (a <= 0) return;
    const m = this.m, ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len, w = Math.tan(spread) * len;
    const nx = -Math.sin(ang), ny = Math.cos(ang);
    const gr = m.createLinearGradient(x, y, ex, ey);
    gr.addColorStop(0, `rgba(0,0,0,${0.35 * a})`); gr.addColorStop(1, `rgba(0,0,0,${0.8 * a})`);
    m.fillStyle = gr;
    m.beginPath(); m.moveTo(x - nx * 4, y - ny * 4); m.lineTo(ex + nx * w, ey + ny * w); m.lineTo(ex - nx * w, ey - ny * w); m.lineTo(x + nx * 4, y + ny * 4); m.closePath(); m.fill();
  }
  apply(c: C2) {
    this.m.globalCompositeOperation = 'source-over';
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(this.L.canvas, 0, 0, W, H); c.restore();
  }
}

// ------------------------------------------------------------------ the torch's beam

/** Where a beam from (x, y) at `ang` meets the sand line y = floor (or `max` px, whichever is first). */
export function beamLen(x: number, y: number, ang: number, floor: number, max = 2400) {
  const s = Math.sin(ang);
  return s > 0.02 ? Math.min(max, (floor - y) / s) : max;
}

/**
 * The torch's beam on the glow layer: a warm cone, brighter at its core, and the motes of the sea lit inside it
 * (marine snow catching the light). `a` its strength.
 */
export function beam(g: C2, x: number, y: number, ang: number, len: number, spread: number, t: number, a = 1, seed = 1) {
  if (a <= 0) return;
  const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len, w = Math.tan(spread) * len;
  const nx = -Math.sin(ang), ny = Math.cos(ang);
  g.save();
  for (let q = 0; q < 10; q++) {   // nested cones, wide and faint to a bright core (fine steps: no banding)
    const k = 1 - q * 0.085, al = 0.028 + 0.006 * q;
    const gr = g.createLinearGradient(x, y, ex, ey);
    gr.addColorStop(0, rgbaHex('#fff1c4', al * a)); gr.addColorStop(0.6, rgbaHex('#ffd994', al * a * 0.45)); gr.addColorStop(1, rgbaHex('#ffc870', al * a * 0.12));
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(x - nx * 3, y - ny * 3); g.lineTo(ex + nx * w * k, ey + ny * w * k); g.lineTo(ex - nx * w * k, ey - ny * w * k); g.lineTo(x + nx * 3, y + ny * 3); g.closePath(); g.fill();
  }
  // the lens flare at the torch
  const fl = g.createRadialGradient(x, y, 0, x, y, 40);
  fl.addColorStop(0, rgbaHex('#fff8e0', 0.75 * a)); fl.addColorStop(1, rgbaHex('#ffd994', 0));
  g.fillStyle = fl; g.fillRect(x - 40, y - 40, 80, 80);
  // motes drifting through the beam: deterministic points in a box around it, lit if inside the cone
  const n = 70;
  for (let i = 0; i < n; i++) {
    const u = h01(i, seed, 1), v = h01(i, seed, 2) * 2 - 1;
    const d = len * u, half = Math.tan(spread) * d;
    const drift = ((t * (6 + 10 * h01(i, seed, 3)) + h01(i, seed, 4) * 50) % 50) - 25;
    const px = x + Math.cos(ang) * d + nx * (v * half) + 3 * Math.sin(t * 0.9 + i);
    const py = y + Math.sin(ang) * d + ny * (v * half) + drift * 0.6;
    const edge = 1 - Math.abs(v), fall = 1 - u * 0.6;
    const tw = 0.6 + 0.4 * Math.sin(t * (2 + 3 * h01(i, seed, 5)) + i);
    g.fillStyle = rgbaHex('#fff6dc', 0.75 * a * edge * fall * tw);
    g.beginPath(); g.arc(px, py, 1.1 + 1.8 * h01(i, seed, 6), 0, TAU); g.fill();
  }
  g.restore();
}

/** The pool where the beam lands on the sand: a warm ellipse on the glow layer. */
export function pool(g: C2, x: number, y: number, rx: number, ry: number, a = 1) {
  if (a <= 0) return;
  g.save(); g.translate(x, y); g.scale(1, ry / rx);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
  gr.addColorStop(0, rgbaHex('#ffe2a8', 0.32 * a)); gr.addColorStop(0.7, rgbaHex('#ffc878', 0.12 * a)); gr.addColorStop(1, rgbaHex('#ffc878', 0));
  g.fillStyle = gr; g.fillRect(-rx, -rx, 2 * rx, 2 * rx);
  g.restore();
}

/** Aim a girl's torch arm (her front arm) at screen angle `ang`. */
export function aim(p: GirlPose, ang: number, flip = false): GirlPose {
  const el = p.el[1];
  const a = flip ? ang - Math.PI / 2 + p.rot : Math.PI / 2 + p.rot - ang;
  return { ...p, sh: [p.sh[0], a - el], el: [p.el[0], el] };
}

// ------------------------------------------------------------------ bubbles, bokeh, the sea's motes

/** One bubble: a thin bright rim, a highlight, the faintest fill. */
export function bubble(c: C2, x: number, y: number, r: number, a = 1, col = '220,250,255') {
  if (a <= 0 || r <= 0.3) return;
  c.save();
  c.fillStyle = `rgba(${col},${0.08 * a})`; c.strokeStyle = `rgba(${col},${0.75 * a})`; c.lineWidth = Math.max(1, r * 0.1);
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.stroke();
  c.fillStyle = `rgba(255,255,255,${0.85 * a})`;
  c.beginPath(); c.ellipse(x - r * 0.36, y - r * 0.38, r * 0.22, r * 0.14, -0.6, 0, TAU); c.fill();
  c.restore();
}

/** A soft out-of-focus bubble for the foreground (bokeh): a faint disc with a brighter rim, on the glow layer. */
export function bokeh(g: C2, x: number, y: number, r: number, col: string, a: number) {
  if (a <= 0) return;
  const gr = g.createRadialGradient(x, y, r * 0.55, x, y, r);
  gr.addColorStop(0, rgbaHex(col, 0.02 * a)); gr.addColorStop(0.8, rgbaHex(col, 0.09 * a)); gr.addColorStop(0.92, rgbaHex(col, 0.13 * a)); gr.addColorStop(1, rgbaHex(col, 0));
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
}

/** Foreground bokeh bubbles drifting up across the frame (screen space), for depth. */
export function foreBokeh(g: C2, t: number, n: number, seed: number, col = '#bfe8ff', a = 1) {
  for (let i = 0; i < n; i++) {
    const x = h01(i, seed, 1) * W + 30 * Math.sin(t * 0.7 + i), r = 20 + 46 * h01(i, seed, 2);
    const y = H + 120 - ((h01(i, seed, 3) + t * 0.06 * (0.5 + h01(i, seed, 4))) % 1) * (H + 240);
    if (y > H - 260) continue;   // never over the lyric
    bokeh(g, x, y, r, col, a * (0.4 + 0.6 * h01(i, seed, 5)));
  }
}

/**
 * Clear the glow layer softly under the lyric (an ellipse around the line's words), so the bloom never washes over
 * them: the kit's clearGlowBand, feathered and only as wide as the words.
 */
export function clearUnderLyric(g: C2, w: number, rows = 1, y = H - 96) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'destination-out';
  const rx = w / 2 + 140, ry = 70 + rows * 34;
  g.translate(W / 2, y); g.scale(1, ry / rx);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
  gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.72, 'rgba(0,0,0,0.95)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(-rx, -rx, 2 * rx, 2 * rx);
  g.restore();
}

/** How wide a lyric line sits (its widest row, as bubbleLyric lays it out) and how many rows. */
export function lyricExtent(c: C2, words: string[], spoken: boolean, maxW = W - 260): { w: number; rows: number } {
  c.save(); c.font = font(spoken ? FAM.serif() : FAM.bold(), spoken ? 58 : 50);
  const sp = c.measureText(' ').width, ws = words.map((x) => c.measureText(x).width);
  c.restore();
  const total = ws.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
  const rows = Math.max(1, Math.ceil(total / maxW));
  return { w: Math.min(total, maxW), rows };
}

/** Marine snow: faint specks everywhere, drifting down slowly. */
export function snow(c: C2, t: number, n: number, seed: number, a = 1, col = '210,235,255') {
  for (let i = 0; i < n; i++) {
    const x = (h01(i, seed, 1) * W + 8 * Math.sin(t * 0.5 + i)) % W;
    const y = ((h01(i, seed, 2) * H + t * (4 + 8 * h01(i, seed, 3))) % H);
    c.fillStyle = `rgba(${col},${a * (0.1 + 0.25 * h01(i, seed, 4))})`;
    c.fillRect(x, y, 1.5 + 1.5 * h01(i, seed, 5), 1.5 + 1.5 * h01(i, seed, 5));
  }
}

/**
 * Bubbles let out on each time in `times` from a moving source (her mouth): a little cluster rises, wobbling, and
 * thins out. `src(t)` gives the mouth at time t (so a bubble starts where she was when she spoke).
 */
export function talkBubbles(c: C2, t: number, times: number[], src: (t: number) => { x: number; y: number }, o: { n?: number; size?: number; life?: number; seed?: number; a?: number } = {}) {
  const n = o.n ?? 3, size = o.size ?? 9, life = o.life ?? 1.6, seed = o.seed ?? 5;
  for (let k = 0; k < times.length; k++) {
    const t0 = times[k]!, age = t - t0;
    if (age < 0 || age > life) continue;
    const s = src(t0);
    for (let i = 0; i < n; i++) {
      const d = age - i * 0.06;
      if (d < 0) continue;
      const r = size * (0.45 + 0.8 * h01(k, i, seed)), rise = d * (90 + 60 * h01(k, i, seed + 1)) + d * d * 40;
      const x = s.x + (h01(k, i, seed + 2) - 0.5) * 18 + 5 * Math.sin(d * 9 + i), y = s.y - rise;
      bubble(c, x, y, r * Math.min(1, d / 0.08), (o.a ?? 1) * (1 - clamp((d - life * 0.6) / (life * 0.4))));
    }
  }
}

// ------------------------------------------------------------------ the set

/** An ordinary lumpy rock (a neighbour on the street), its base at (x, y). */
export function rock(c: C2, x: number, y: number, s: number, seed: number) {
  const w = 120 * s, h = 92 * s;
  c.save();
  c.fillStyle = 'rgba(20,30,50,0.35)'; c.beginPath(); c.ellipse(x + 8 * s, y + 4 * s, w * 0.62, 12 * s, 0, 0, TAU); c.fill();
  c.beginPath();
  for (let i = 0; i <= 24; i++) {
    const a = Math.PI + (i / 24) * Math.PI, k = 1 + 0.1 * Math.sin(a * 3 + seed) + 0.06 * Math.sin(a * 7 + seed * 2);
    const px = x + Math.cos(a) * w * 0.55 * k, py = y + Math.sin(a) * h * k;
    i ? c.lineTo(px, py) : c.moveTo(px, py);
  }
  c.closePath();
  const gr = c.createLinearGradient(x - w * 0.4, y - h, x + w * 0.3, y);
  gr.addColorStop(0, '#8d8a80'); gr.addColorStop(1, '#4f4c48');
  c.fillStyle = gr; c.fill();
  c.strokeStyle = '#34322f'; c.lineWidth = 2.5 * s; c.stroke();
  // algae on top, a barnacle, a crack
  c.fillStyle = 'rgba(90,150,90,0.55)';
  c.beginPath(); c.ellipse(x - w * 0.12, y - h * 0.9, w * 0.3, h * 0.12, -0.15, 0, TAU); c.fill();
  c.fillStyle = '#ddd6c6'; c.beginPath(); c.arc(x + w * 0.22, y - h * 0.45, 7 * s, 0, TAU); c.fill();
  c.fillStyle = '#3a3630'; c.beginPath(); c.arc(x + w * 0.22, y - h * 0.45, 2.6 * s, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(40,36,32,0.6)'; c.lineWidth = 2 * s;
  c.beginPath(); c.moveTo(x - w * 0.25, y - h * 0.55); c.lineTo(x - w * 0.12, y - h * 0.35); c.lineTo(x - w * 0.18, y - h * 0.15); c.stroke();
  c.restore();
}

/**
 * A letterbox on a twig post: a scallop shell turned on its side with a slot (gold for Rai, stuffed with letters).
 * (x, y) is the post's foot.
 */
export function letterbox(c: C2, x: number, y: number, s: number, t: number, o: { gold?: boolean; letters?: number; flag?: boolean } = {}) {
  const gold = !!o.gold, top = y - 120 * s;
  c.save(); c.lineCap = 'round';
  c.strokeStyle = gold ? '#7a5a2a' : '#5a4a3a'; c.lineWidth = 7 * s;
  c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x - 4 * s, (y + top) / 2, x + 2 * s, top + 10 * s); c.stroke();
  // the shell: a fan of ribs
  const cx = x + 2 * s, cy = top - 6 * s, r = 34 * s;
  const base = gold ? '#f6c453' : '#e9d8c4', rib = gold ? '#b8862a' : '#b8a48c';
  c.fillStyle = base;
  c.beginPath(); c.moveTo(cx, cy + r * 0.55);
  for (let i = 0; i <= 10; i++) { const a = Math.PI * (1.05 + 0.9 * i / 10); c.lineTo(cx + Math.cos(a) * r * (i % 2 ? 1 : 0.94), cy + Math.sin(a) * r * 0.9); }
  c.closePath(); c.fill();
  c.strokeStyle = rib; c.lineWidth = 2 * s;
  for (let i = 1; i < 10; i++) { const a = Math.PI * (1.05 + 0.9 * i / 10); c.beginPath(); c.moveTo(cx, cy + r * 0.5); c.lineTo(cx + Math.cos(a) * r * 0.92, cy + Math.sin(a) * r * 0.82); c.stroke(); }
  c.fillStyle = gold ? '#a8761e' : '#9a8670'; c.beginPath(); c.roundRect(cx - 12 * s, cy + r * 0.42, 24 * s, 9 * s, 3 * s); c.fill();   // the hinge
  c.fillStyle = '#1a1410'; c.fillRect(cx - 16 * s, cy - r * 0.12, 32 * s, 4.5 * s);   // the slot
  // letters sticking out of the slot (Rai's: a deed with a palm, an invitation with a heart, more)
  const n = o.letters ?? 0;
  for (let i = 0; i < n; i++) {
    const lx = cx - 14 * s + i * (28 * s / Math.max(1, n - 1)), lift = 10 + 8 * h01(i, 41) + 1.5 * Math.sin(t * 2 + i);
    c.save(); c.translate(lx, cy - r * 0.1); c.rotate((h01(i, 42) - 0.5) * 0.7);
    c.fillStyle = i % 3 === 1 ? '#ffe7f0' : '#f8f2e4'; c.fillRect(-7 * s, -lift * s - 14 * s, 14 * s, 18 * s);
    c.fillStyle = i % 3 === 1 ? HEX.pink : i % 3 === 2 ? '#c03030' : '#3a8a4a';
    c.beginPath(); c.arc(0, -lift * s - 6 * s, 2.6 * s, 0, TAU); c.fill();
    c.restore();
  }
  if (gold) { c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.ellipse(cx - r * 0.4, cy - r * 0.45, 6 * s, 3 * s, -0.5, 0, TAU); c.fill(); }
  c.restore();
}

/** A flat house-number pebble lying in the sand, its number painted white (gold for Rai's). */
export function numberPebble(c: C2, x: number, y: number, s: number, n: number | string, gold = false) {
  c.save();
  c.fillStyle = 'rgba(20,30,50,0.3)'; c.beginPath(); c.ellipse(x + 3 * s, y + 6 * s, 30 * s, 9 * s, 0, 0, TAU); c.fill();
  c.fillStyle = gold ? '#f0b93a' : '#7d7a73'; c.beginPath(); c.ellipse(x, y, 30 * s, 16 * s, -0.05, 0, TAU); c.fill();
  c.fillStyle = gold ? '#ffd877' : '#99958c'; c.beginPath(); c.ellipse(x - 3 * s, y - 3 * s, 25 * s, 11 * s, -0.05, 0, TAU); c.fill();
  c.font = font(FAM.monoB(), 20 * s); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = gold ? '#6a4410' : '#f4f1ea'; c.fillText(String(n), x - 2 * s, y - 2 * s);
  c.restore();
}

/** A bottle half-buried in the sand with a rolled note inside (a message nobody has read). */
export function bottle(c: C2, x: number, y: number, s: number) {
  c.save(); c.translate(x, y); c.rotate(-0.3); c.scale(s, s);
  c.fillStyle = 'rgba(120,200,170,0.75)'; c.beginPath(); c.roundRect(-40, -16, 80, 32, 14); c.fill();
  c.fillRect(34, -7, 24, 14);
  c.fillStyle = '#8a5a3a'; c.fillRect(56, -6, 8, 12);
  c.fillStyle = '#f4e7c4'; c.beginPath(); c.roundRect(-22, -7, 44, 14, 6); c.fill();
  c.strokeStyle = '#c03030'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -7); c.lineTo(0, 7); c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.ellipse(-12, -10, 18, 3, 0, 0, TAU); c.fill();
  c.restore();
  c.fillStyle = '#d9c38a'; c.beginPath(); c.ellipse(x - 30 * s, y + 12 * s, 46 * s, 12 * s, 0, 0, TAU); c.fill();
}

/**
 * The crab: orange, eyes on stalks, claws up `claws` (0..1, raised when the light hits it), scuttling sideways.
 * `letter` gives it a letter to carry in one claw (the street's postman).
 */
export function crab(c: C2, x: number, y: number, s: number, t: number, o: { claws?: number; walk?: number; letter?: boolean } = {}) {
  const cl = clamp(o.claws ?? 0), walk = o.walk ?? 0;
  c.save(); c.translate(x, y); c.scale(s, s);
  c.strokeStyle = '#c4501e'; c.lineWidth = 4; c.lineCap = 'round';
  for (let i = 0; i < 4; i++) for (const sd of [-1, 1]) {   // legs
    const ph = Math.sin(walk * 14 + i * 1.3 + (sd > 0 ? 1.5 : 0)) * 5;
    c.beginPath(); c.moveTo(sd * 14, -8 + i * 3); c.lineTo(sd * (30 + i * 4), -14 + i * 4 + ph); c.lineTo(sd * (36 + i * 5), 4 + ph * 0.4); c.stroke();
  }
  c.fillStyle = '#ff6a2a'; c.beginPath(); c.ellipse(0, -12, 26, 16, 0, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,220,180,0.5)'; c.beginPath(); c.ellipse(-6, -18, 12, 5, -0.2, 0, TAU); c.fill();
  for (const sd of [-1, 1]) { // claws
    const ax = sd * 30, ay = -18 - 26 * cl, wob = Math.sin(t * 10 + sd) * 3 * cl;
    c.strokeStyle = '#ff6a2a'; c.lineWidth = 6; c.beginPath(); c.moveTo(sd * 18, -16); c.quadraticCurveTo(sd * 30, -20, ax, ay + wob); c.stroke();
    c.fillStyle = '#ff6a2a'; c.beginPath(); c.ellipse(ax, ay + wob - 6, 9, 12, sd * 0.3, 0, TAU); c.fill();
    c.fillStyle = '#ff8a4a'; c.beginPath(); c.moveTo(ax, ay + wob - 6); c.lineTo(ax + sd * 10, ay + wob - 20 - 6 * cl); c.lineTo(ax + sd * 2, ay + wob - 8); c.fill();
    if (o.letter && sd > 0) { c.fillStyle = '#f8f2e4'; c.save(); c.translate(ax + 6, ay + wob - 18); c.rotate(0.3); c.fillRect(-11, -8, 22, 15); c.strokeStyle = 'rgba(120,100,80,0.6)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-11, -8); c.lineTo(0, 0); c.lineTo(11, -8); c.stroke(); c.restore(); }
  }
  for (const sd of [-1, 1]) { // eyes on stalks
    c.strokeStyle = '#c4501e'; c.lineWidth = 3; c.beginPath(); c.moveTo(sd * 7, -24); c.lineTo(sd * 9, -36 - 4 * cl); c.stroke();
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(sd * 9, -38 - 4 * cl, 5.5, 0, TAU); c.fill();
    c.fillStyle = '#120d1d'; c.beginPath(); c.arc(sd * 9 + 1.5, -38 - 4 * cl, 2.6, 0, TAU); c.fill();
  }
  c.restore();
}

/** The night seabed, the street, the bottle (the crab and the characters are drawn by the plates). */
export function seaSet(c: C2, t: number, o: { pan?: number; seed?: number; neighbours?: boolean; letterbox?: boolean; letters?: number; pebble?: boolean } = {}) {
  seabed(c, t, { depth: 0.82, floor: FLOOR, clues: ['shells'], shark: false, seed: o.seed ?? 7, pan: o.pan ?? 0 });
  if (o.neighbours !== false) for (const r of STREET) {
    const y = FLOOR + 92 + 22 * h01(r.seed, 3);
    rock(c, r.x, y, r.s, r.seed);
    letterbox(c, r.x + 92 * r.s, y + 6, 0.85 * r.s, t, { letters: 0 });
    numberPebble(c, r.x - 30 * r.s, y + 34, 0.9 * r.s, r.n);
  }
  bottle(c, BOTTLE.x, BOTTLE.y, 0.9);
  if (o.letterbox !== false) letterbox(c, LETTERBOX.x, LETTERBOX.y, 1, t, { gold: true, letters: o.letters ?? 5 });
  if (o.pebble !== false) numberPebble(c, LETTERBOX.x + 70, 918, 1, 7, true);
  // a little holed pebble by Rai's foot (what becomes the girl's pendant)
  c.fillStyle = 'rgba(20,30,50,0.3)'; c.beginPath(); c.ellipse(1150, 868, 11, 3.5, 0, 0, TAU); c.fill();
  c.fillStyle = '#a8a094'; c.beginPath(); c.ellipse(1148, 863, 10, 6.5, -0.1, 0, TAU); c.fill();
  c.fillStyle = '#3a342c'; c.beginPath(); c.ellipse(1148, 863, 3, 2, -0.1, 0, TAU); c.fill();
  // sea grass tufts along the street
  for (let i = 0; i < 9; i++) reed(c, 60 + i * 225 + 40 * h01(i, 71), FLOOR + 70 + 30 * h01(i, 72), 70 + 50 * h01(i, 73), t, i + 300, '#2b8a5a', 10);
}

// ------------------------------------------------------------------ the girl's belt

/** The toy rai stone on a string and the mesh purse at her belt, from her anchors. */
export function girlBelt(c: C2, a: GirlAnchors, h: number, t: number, o: { flip?: boolean; purse?: boolean; toy?: boolean; under?: boolean } = {}) {
  const u = h / 100, upx = a.chest.x - a.pelvis.x, upy = a.chest.y - a.pelvis.y, L = Math.hypot(upx, upy) || 1;
  const up = { x: upx / L, y: upy / L }, fw = o.flip ? { x: up.y, y: -up.x } : { x: -up.y, y: up.x };
  const belt = { x: a.pelvis.x + up.x * 3 * u, y: a.pelvis.y + up.y * 3 * u };
  c.save();
  if (o.toy !== false) { // the toy stone hangs from the back of her belt, swinging (floating up a little under water)
    const sw = Math.sin(t * 2.2) * 0.35, hang = { x: (o.under ? 0.3 : 0) * -up.x + Math.sin(sw) * 0.5, y: 1 };
    const p0 = { x: belt.x - fw.x * 6 * u, y: belt.y - fw.y * 6 * u };
    const p1 = { x: p0.x + hang.x * 10 * u - fw.x * 2 * u, y: p0.y + hang.y * 10 * u * (o.under ? 0.7 : 1) };
    c.strokeStyle = 'rgba(240,230,210,0.85)'; c.lineWidth = 0.7 * u; c.beginPath(); c.moveTo(p0.x, p0.y); c.lineTo(p1.x, p1.y); c.stroke();
    c.fillStyle = HEX.stone; c.beginPath(); c.arc(p1.x, p1.y + 3.2 * u, 3.6 * u, 0, TAU); c.arc(p1.x, p1.y + 3.4 * u, 1.3 * u, 0, TAU, true); c.fill('evenodd');
    c.strokeStyle = '#6f6656'; c.lineWidth = 0.5 * u; c.beginPath(); c.arc(p1.x, p1.y + 3.2 * u, 3.6 * u, 0, TAU); c.stroke();
  }
  if (o.purse !== false) { // the little mesh purse, three coins in it
    const p = { x: belt.x - fw.x * 1 * u + up.x * -3 * u, y: belt.y - fw.y * 1 * u - up.y * 3 * u };
    c.fillStyle = 'rgba(255,90,95,0.9)'; c.beginPath(); c.ellipse(p.x, p.y + 2 * u, 3.4 * u, 4.2 * u, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(120,20,30,0.7)'; c.lineWidth = 0.45 * u;
    for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(p.x + k * 1.6 * u, p.y - 1.5 * u); c.lineTo(p.x + k * 1.6 * u, p.y + 5.6 * u); c.stroke(); }
    c.fillStyle = HEX.gold; c.beginPath(); c.arc(p.x + 0.8 * u, p.y + 1.6 * u, 1.1 * u, 0, TAU); c.fill();
  }
  c.restore();
}

/** Mix two hex colours (re-export for the plates). */
export const mix = mixHex;
export { ease };

/**
 * The heart-lantern's beam, drawn here instead of by the kit (whose wedge lies over the picture and over Rai): a soft
 * gold cone from her heart to the circle's tangent points, motes in it, stopping at the circle's edge; then the rim.
 * Call after heartLantern (given a scratch glow layer).
 */
export function lanternBeam(g: C2, hx: number, hy: number, cx: number, cy: number, r: number, t: number, on: number, flick = 1) {
  if (on <= 0) return;
  const rr = r * ease.outBack(clamp(on));
  const dx = hx - cx, dy = hy - cy, d = Math.hypot(dx, dy);
  if (d > rr + 4) {
    const th = Math.atan2(dy, dx), al = Math.acos(Math.min(1, rr / d));
    const t1 = { x: cx + rr * Math.cos(th + al), y: cy + rr * Math.sin(th + al) }, t2 = { x: cx + rr * Math.cos(th - al), y: cy + rr * Math.sin(th - al) };
    const nx = -dy / d, ny = dx / d;
    for (let q = 0; q < 12; q++) {
      const k = 1 - q * 0.07, a = 0.008 + 0.0016 * q;
      const gr = g.createLinearGradient(hx, hy, cx, cy);
      gr.addColorStop(0, rgbaHex('#ffd98a', a * 2.2 * on * flick)); gr.addColorStop(0.5, rgbaHex(HEX.gold, a * on * flick)); gr.addColorStop(1, rgbaHex(HEX.gold, a * 0.5 * on * flick));
      g.fillStyle = gr;
      const m1 = { x: hx + (t1.x - hx) * 1, y: hy + (t1.y - hy) * 1 }, m2 = { x: hx + (t2.x - hx), y: hy + (t2.y - hy) };
      const c1 = { x: (m1.x + m2.x) / 2, y: (m1.y + m2.y) / 2 };
      g.beginPath(); g.moveTo(hx + nx * 6, hy + ny * 6);
      g.lineTo(c1.x + (m1.x - c1.x) * k, c1.y + (m1.y - c1.y) * k); g.lineTo(c1.x + (m2.x - c1.x) * k, c1.y + (m2.y - c1.y) * k);
      g.lineTo(hx - nx * 6, hy - ny * 6); g.closePath(); g.fill();
    }
    for (let i = 0; i < 40; i++) { // motes in the beam
      const u = h01(i, 501), v = h01(i, 502) * 2 - 1, px = hx + (cx - hx) * u + nx * v * rr * u * 0.85, py = hy + (cy - hy) * u + ny * v * rr * u * 0.85 + 6 * Math.sin(t + i);
      g.fillStyle = rgbaHex('#fff2c8', 0.5 * on * (1 - Math.abs(v)) * (0.5 + 0.5 * Math.sin(t * 3 + i)));
      g.beginPath(); g.arc(px, py, 1.2 + 1.6 * h01(i, 503), 0, TAU); g.fill();
    }
  }
  // the beam stops at the screen: clear the glow inside the circle, then its rim and a soft halo on the water round it
  g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.beginPath(); g.arc(cx, cy, rr - 2, 0, TAU); g.fill(); g.restore();
  const hg = g.createRadialGradient(cx, cy, rr, cx, cy, rr * 1.18);
  hg.addColorStop(0, rgbaHex(HEX.gold, 0.014 * on * flick)); hg.addColorStop(1, rgbaHex(HEX.gold, 0));
  g.fillStyle = hg; g.beginPath(); g.arc(cx, cy, rr * 1.18, 0, TAU); g.arc(cx, cy, rr, 0, TAU, true); g.fill();
  g.strokeStyle = rgbaHex('#ffd98a', 0.22 * on * flick); g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, rr, 0, TAU); g.stroke();
}

/**
 * The girl placed by her pelvis (world px), whatever her pose: the kit's girl() takes her feet when she is upright and
 * her middle when she is horizontal, so blends across the two jump; this keeps the pelvis where it is asked to be.
 */
export function girlPelvis(pel: { x: number; y: number }, pose: GirlPose, h: number) {
  const upright = Math.abs(pose.rot) < 0.8;
  return { x: pel.x, y: upright ? pel.y + (37 - (pose.drop ?? 0)) * h / 100 : pel.y };
}
/** Blend two girl poses (u 0..1). */
export function blendPose(a: GirlPose, b: GirlPose, u: number): GirlPose {
  const m = (x: number, y: number) => x + (y - x) * u, m2 = (x: [number, number], y: [number, number]): [number, number] => [m(x[0], y[0]), m(x[1], y[1])];
  return { rot: m(a.rot, b.rot), hip: m2(a.hip, b.hip), knee: m2(a.knee, b.knee), sh: m2(a.sh, b.sh), el: m2(a.el, b.el), head: m(a.head ?? 0, b.head ?? 0), drop: m(a.drop ?? 0, b.drop ?? 0) };
}

/**
 * Foreground reeds right by the lens (screen space), defocused by `blur` px: a focus pull is this blur moving while the
 * subject stays sharp. `side` -1 left edge, 1 right edge, 0 both.
 */
export function lensReeds(c: C2, t: number, blur: number, side: -1 | 0 | 1 = 0, seed = 1, a = 1) {
  c.save();
  if (blur > 0.5) c.filter = `blur(${blur.toFixed(1)}px)`;
  c.globalAlpha = a;
  for (let i = 0; i < 4; i++) {
    const s = side === 0 ? (i % 2 ? 1 : -1) : side;
    const x = s > 0 ? W - 30 - 110 * i * 0.6 - 60 * h01(i, seed, 1) : 30 + 110 * i * 0.6 + 60 * h01(i, seed, 1);
    reed(c, x, H + 40, 520 + 300 * h01(i, seed, 2), t * 0.8, i + 700 + seed, i % 2 ? '#0a2a22' : '#0d3328', 46 - 6 * i);
  }
  c.restore();
}

/** Her torch pushed into the sand like a lamp, aimed along `ang` (the look of touch's planted torch). Returns its lens. */
export function plantedTorch(c: C2, x: number, y: number, ang: number, s: number) {
  const dx = Math.cos(ang), dy = Math.sin(ang), L = 46 * s, tip = { x: x + dx * L, y: y + dy * L };
  c.save(); c.lineCap = 'round';
  c.strokeStyle = '#3a3a44'; c.lineWidth = 15 * s; c.beginPath(); c.moveTo(x - dx * 6 * s, y - dy * 6 * s); c.lineTo(tip.x - dx * 8 * s, tip.y - dy * 8 * s); c.stroke();
  c.strokeStyle = '#e8e2d0'; c.lineWidth = 11 * s; c.beginPath(); c.moveTo(x, y); c.lineTo(tip.x - dx * 6 * s, tip.y - dy * 6 * s); c.stroke();
  c.strokeStyle = HEX.coral; c.lineWidth = 12 * s; c.beginPath(); c.moveTo(x + dx * 14 * s, y + dy * 14 * s); c.lineTo(x + dx * 20 * s, y + dy * 20 * s); c.stroke();
  c.fillStyle = '#fff6c8'; c.beginPath(); c.ellipse(tip.x, tip.y, 4 * s, 9 * s, ang, 0, TAU); c.fill();
  c.fillStyle = '#7a6a48'; c.beginPath(); c.ellipse(x - 4 * s, y + 6 * s, 30 * s, 9 * s, 0, Math.PI, TAU); c.fill();
  c.restore();
  return tip;
}

/** Her torch laid on the sand, aimed at Rai. */
export function torchOnSand(c: C2, x: number, y: number) {
  const ang = Math.atan2(RAI.y - 20 - y, RAI.x - x) * 0.3;
  c.save(); c.translate(x, y); c.rotate(ang);
  c.fillStyle = 'rgba(10,20,40,0.4)'; c.beginPath(); c.ellipse(-8, 10, 40, 6, 0, 0, TAU); c.fill();
  c.fillStyle = '#e8e2d0'; c.beginPath(); c.roundRect(-44, -8, 46, 16, 5); c.fill();
  c.fillStyle = '#b8b2a0'; c.fillRect(-12, -10, 12, 20);
  c.fillStyle = '#fff6c8'; c.beginPath(); c.ellipse(2, 0, 4, 9, 0, 0, TAU); c.fill();
  c.restore();
}

