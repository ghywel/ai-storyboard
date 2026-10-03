// touch's props and lighting (TREATMENT-v2.md, "touch", the hush), also used by manta for the shared night set and
// the join at 53.96. Canvas2D in the 1920x1080 logical frame, y down, pure functions of t.
//
// - The hush's time: the world (reeds, fish, bubbles, marine snow) slows to a third after the touch, and speeds back up
//   as the manta arrives (`hushTime`).
// - A camera with a centre and a zoom, applied to any context (`applyCam`, `camLerp`).
// - Soft focus: an offscreen half-resolution layer blurred and laid back in (`Soft`), for the focus pulls.
// - The girl's arms by inverse kinematics on the kit's own skeleton (`reachArm`), and a child's hand for the close-up.
// - The torch planted in the sand like a lamp, marine snow in its beam, out-of-focus bubbles, the ripples of light.
// - The slate redrawn the kit's way but with its pencil in her hand (the kit's slate always hangs its pencil at the
//   side), and the pencil drawings: her drawing of Rai, the "?", the heart, the tally in the corner.
import { W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import { clamp, ease } from '../../engine/util';
import { h01 } from '../_rai';
import { FAM, TAU, rgbaHex, mixHex } from '../_motifs';
import type { GirlPose } from './_diver';
import { seabed, reed } from '../_world';

export type C2 = CanvasRenderingContext2D;
export type P = { x: number; y: number };
const PI = Math.PI;

// ------------------------------------------------------------------ time

export interface SpeedKey { t: number; s: number }
/** Warped time: t before the first key, then the integral of a speed that is linear between keys (s of the last key after it). */
export function warpTime(t: number, keys: SpeedKey[]): number {
  if (!keys.length || t <= keys[0]!.t) return t;
  let tau = keys[0]!.t, pt = keys[0]!.t, ps = keys[0]!.s;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i]!;
    if (t <= k.t) { const d = t - pt, s = ps + ((k.s - ps) * d) / (k.t - pt); return tau + (d * (ps + s)) / 2; }
    tau += ((k.t - pt) * (ps + k.s)) / 2; pt = k.t; ps = k.s;
  }
  return tau + (t - pt) * ps;
}
/** The hush: after the touch the sea slows to a third; it speeds up again as the manta comes (manta uses it too). */
export const HUSH: SpeedKey[] = [{ t: 41.3, s: 1 }, { t: 42.4, s: 0.33 }, { t: 53.5, s: 0.33 }, { t: 54.7, s: 1 }];
export const hushTime = (t: number) => warpTime(t, HUSH);

// ------------------------------------------------------------------ the camera

export interface Cam { x: number; y: number; z: number; rot?: number }
/** Apply a camera (the view's centre x, y in set px, zoom z) to a context. */
export function applyCam(c: C2, k: Cam) {
  c.translate(W / 2, H / 2); if (k.rot) c.rotate(k.rot); c.scale(k.z, k.z); c.translate(-k.x, -k.y);
}
/** A dolly between two framings: log zoom, the centre moving with the visible width (a natural push or pull). */
export function camLerp(a: Cam, b: Cam, u: number): Cam {
  const z = a.z * Math.pow(b.z / a.z, u);
  const v = Math.abs(1 / b.z - 1 / a.z) < 1e-9 ? u : (1 / z - 1 / a.z) / (1 / b.z - 1 / a.z);
  return { x: a.x + (b.x - a.x) * v, y: a.y + (b.y - a.y) * v, z, rot: (a.rot ?? 0) + ((b.rot ?? 0) - (a.rot ?? 0)) * u };
}
/** Where a set point lands on screen under a camera. */
export const toScreen = (k: Cam, x: number, y: number): P => ({ x: W / 2 + (x - k.x) * k.z, y: H / 2 + (y - k.y) * k.z });

// ------------------------------------------------------------------ soft focus

/**
 * An offscreen layer at a fraction of the frame's resolution: draw into `begin()` in logical 1920x1080 px, then `end()`
 * lays it into the main layer blurred by `blur` px (a focus pull). Blur on a small canvas is cheap, and the upscale
 * softens it further; sharp things never go through it.
 */
export class Soft {
  a: HTMLCanvasElement; b: HTMLCanvasElement; ca: C2; cb: C2;
  constructor(public k = 0.5) {
    const mk = () => { const cv = document.createElement('canvas'); cv.width = Math.round(W * k); cv.height = Math.round(H * k); return cv; };
    this.a = mk(); this.b = mk();
    this.ca = this.a.getContext('2d')!; this.cb = this.b.getContext('2d')!;
  }
  begin(): C2 {
    const c = this.ca;
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none'; c.shadowBlur = 0;
    c.clearRect(0, 0, this.a.width, this.a.height);
    c.setTransform(this.k, 0, 0, this.k, 0, 0);
    return c;
  }
  end(c: C2, blur: number, alpha = 1) {
    const b = this.cb;
    b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, this.b.width, this.b.height);
    b.filter = blur > 0.3 ? `blur(${(blur * this.k).toFixed(2)}px)` : 'none';
    b.drawImage(this.a, 0, 0); b.filter = 'none';
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = alpha; c.imageSmoothingQuality = 'high';
    c.drawImage(this.b, 0, 0, W, H);
    c.restore();
  }
}
/** Draw `draw(ctx)` sharp into c when blur is small, or through the soft layer when it is not. */
export function focus(c: C2, soft: Soft, blur: number, draw: (k: C2) => void) {
  if (blur < 0.6) { draw(c); return; }
  const k = soft.begin();
  draw(k);
  soft.end(c, blur);
}

// ------------------------------------------------------------------ the girl's skeleton (the kit's proportions)

const GL = { thigh: 19, shin: 18, torso: 29, upper: 16, fore: 15, neck: 3, head: 10 };
/** The kit girl's frame for a pose: her axes, pelvis, shoulder, head (child proportions). */
export function girlFrame(x: number, y: number, h: number, p: GirlPose, flip = false) {
  const u = h / 100, f = flip ? -1 : 1;
  const upright = Math.abs(p.rot) < 0.8;
  const pel: P = upright ? { x, y: y - (GL.thigh + GL.shin) * u + (p.drop ?? 0) * u } : { x, y };
  const up: P = { x: Math.sin(p.rot) * f, y: -Math.cos(p.rot) }, fw: P = { x: Math.cos(p.rot) * f, y: Math.sin(p.rot) };
  const at = (q: P, d: P, k: number): P => ({ x: q.x + d.x * k * u, y: q.y + d.y * k * u });
  const neck = at(pel, up, GL.torso), head = at(neck, up, GL.neck + GL.head), shoulder = at(neck, up, -3);
  const dir = (a: number): P => ({ x: -up.x * Math.cos(a) + fw.x * Math.sin(a), y: -up.y * Math.cos(a) + fw.y * Math.sin(a) });
  return { u, f, up, fw, pel, neck, head, shoulder, dir, headR: GL.head * u };
}
/**
 * The pose with arm `arm` (0 back, 1 front) reaching its hand to T (canvas px), by two-bone IK on the kit's arm
 * (upper 16, fore 15). `elbow` 1 bends the elbow down and back (a reach forward), -1 the other way.
 */
export function reachArm(x: number, y: number, h: number, p: GirlPose, flip: boolean, arm: 0 | 1, T: P, elbow = 1): GirlPose {
  const fr = girlFrame(x, y, h, p, flip), u = fr.u;
  const v = { x: T.x - fr.shoulder.x, y: T.y - fr.shoulder.y };
  const vd = -(v.x * fr.up.x + v.y * fr.up.y), vf = v.x * fr.fw.x + v.y * fr.fw.y;
  const phi = Math.atan2(vf, vd), l1 = GL.upper, l2 = GL.fore;
  const d = clamp(Math.hypot(v.x, v.y) / u, 1.5, (l1 + l2) * 0.999);
  const al = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const be = Math.acos(clamp((l1 * l1 + l2 * l2 - d * d) / (2 * l1 * l2), -1, 1));
  const sh: [number, number] = [...p.sh], el: [number, number] = [...p.el];
  sh[arm] = phi - elbow * al; el[arm] = elbow * (PI - be);
  return { ...p, sh, el };
}
/** The direction of her forearm (canvas angle) for arm i of a pose. */
export function forearmAngle(x: number, y: number, h: number, p: GirlPose, flip: boolean, arm: 0 | 1): number {
  const fr = girlFrame(x, y, h, p, flip), d = fr.dir(p.sh[arm] + p.el[arm]);
  return Math.atan2(d.y, d.x);
}

/** A child's hand in silhouette for the close-ups: palm and four fingers along `ang`, a thumb; u is her h/100. */
export function childHand(c: C2, x: number, y: number, ang: number, u: number, col: string, o: { spread?: number; curl?: number; rim?: string; thumb?: number } = {}) {
  const sp = o.spread ?? 0.22, curl = o.curl ?? 0;
  c.save(); c.translate(x, y); c.rotate(ang);
  c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round';
  c.beginPath(); c.ellipse(2.6 * u, 0, 3.6 * u, 3.1 * u, 0, 0, TAU); c.fill();
  for (let i = 0; i < 4; i++) {
    const a = (i - 1.5) * sp, L = (i === 0 || i === 3 ? 3.6 : 4.4) * u * (1 - curl * 0.45);
    const bx = 5.2 * u, by = (i - 1.5) * 1.55 * u;
    c.lineWidth = 1.7 * u;
    c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + Math.cos(a) * L, by + Math.sin(a) * L); c.stroke();
  }
  const ta = (o.thumb ?? 1) * 0.95;
  c.lineWidth = 1.9 * u; c.beginPath(); c.moveTo(2.4 * u, -2.2 * u); c.lineTo(2.4 * u + Math.cos(-ta) * 3.6 * u, -2.2 * u + Math.sin(-ta) * 3.6 * u); c.stroke();
  if (o.rim) { // a rim of warm light along the underside (the torch below)
    c.strokeStyle = o.rim; c.lineWidth = 0.7 * u; c.globalAlpha = 0.8;
    c.beginPath(); c.ellipse(2.6 * u, 0, 3.6 * u, 3.1 * u, 0, 0.3, 2.2); c.stroke();
  }
  c.restore();
}

// ------------------------------------------------------------------ light

/** The torch planted in the sand like a lamp (her hands are free): body, lens, a lip of sand. Returns its tip. */
export function plantedTorch(c: C2, x: number, y: number, ang: number, s: number): P {
  const dx = Math.cos(ang), dy = Math.sin(ang), L = 46 * s;
  const tip = { x: x + dx * L, y: y + dy * L };
  c.save(); c.lineCap = 'round';
  c.strokeStyle = '#3a3a44'; c.lineWidth = 15 * s; c.beginPath(); c.moveTo(x - dx * 6 * s, y - dy * 6 * s); c.lineTo(tip.x - dx * 8 * s, tip.y - dy * 8 * s); c.stroke();
  c.strokeStyle = '#e8e2d0'; c.lineWidth = 11 * s; c.beginPath(); c.moveTo(x, y); c.lineTo(tip.x - dx * 6 * s, tip.y - dy * 6 * s); c.stroke();
  c.strokeStyle = HEX.coral; c.lineWidth = 12 * s; c.beginPath(); c.moveTo(x + dx * 14 * s, y + dy * 14 * s); c.lineTo(x + dx * 20 * s, y + dy * 20 * s); c.stroke();   // a coral grip band (her mask's colour)
  c.fillStyle = '#fff6c8'; c.beginPath(); c.ellipse(tip.x, tip.y, 4 * s, 9 * s, ang, 0, TAU); c.fill();
  // the sand heaped where she pushed it in
  c.fillStyle = '#7a6a48'; c.beginPath(); c.ellipse(x - 4 * s, y + 6 * s, 30 * s, 9 * s, 0, PI, TAU); c.fill();
  c.restore();
  return tip;
}
/** Marine snow: specks drifting in the water, bright where they cross the torch's beam (cone from (bx, by) along ang). */
export function marineSnow(c: C2, g: C2, tau: number, beam: { x: number; y: number; ang: number; len: number; spread: number } | null, n = 140, seed = 3, rect = { x: 0, y: 0, w: W, h: H }) {
  const ca = beam ? Math.cos(beam.ang) : 0, sa = beam ? Math.sin(beam.ang) : 0;
  for (let i = 0; i < n; i++) {
    const x = rect.x + ((h01(i, seed, 1) * rect.w + 14 * Math.sin(tau * 0.35 + i) + tau * 6) % rect.w + rect.w) % rect.w;
    const y = rect.y + ((h01(i, seed, 2) * rect.h + tau * (8 + 10 * h01(i, seed, 3))) % rect.h);
    const r = 1 + 2.2 * h01(i, seed, 4);
    let lit = 0;
    if (beam) {
      const vx = x - beam.x, vy = y - beam.y, along = vx * ca + vy * sa, perp = Math.abs(-vx * sa + vy * ca);
      if (along > 0 && along < beam.len * 1.15) lit = clamp(1 - perp / (Math.tan(beam.spread) * along + 10)) * (1 - along / (beam.len * 1.3));
    }
    c.fillStyle = `rgba(190,220,235,${0.08 + 0.1 * h01(i, seed, 5)})`;
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    if (lit > 0.02) { g.fillStyle = rgbaHex('#fff1c4', 0.55 * lit); g.beginPath(); g.arc(x, y, r * 1.6, 0, TAU); g.fill(); }
  }
}
/** Big out-of-focus bubbles drifting up in front of the lens (bokeh), at hush speed. */
export function bokehBubbles(c: C2, tau: number, n = 7, seed = 5, a = 1, tint = '200,235,255') {
  for (let i = 0; i < n; i++) {
    const r = 26 + 60 * h01(i, seed, 1);
    const x = h01(i, seed, 2) * W + 30 * Math.sin(tau * 0.6 + i * 2);
    const y = H + 100 - ((h01(i, seed, 3) * (H + 300) + tau * (40 + 40 * h01(i, seed, 4))) % (H + 300));
    const gr = c.createRadialGradient(x - r * 0.2, y - r * 0.25, r * 0.1, x, y, r);
    gr.addColorStop(0, `rgba(${tint},${0.02 * a})`); gr.addColorStop(0.75, `rgba(${tint},${0.07 * a})`); gr.addColorStop(1, `rgba(${tint},${0.2 * a})`);
    c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }
}
/** Ripples of light from a touch at t0: rings on the glow layer, the first strongest. */
export function lightRipples(g: C2, x: number, y: number, t: number, t0: number, o: { n?: number; gap?: number; speed?: number; life?: number; col?: string; a?: number; squash?: number } = {}) {
  const n = o.n ?? 6, gap = o.gap ?? 0.24, sp = o.speed ?? 360, life = o.life ?? 2.4, col = o.col ?? '#ffe6b0', a0 = o.a ?? 1;
  for (let i = 0; i < n; i++) {
    const age = t - t0 - i * gap;
    if (age < 0 || age > life) continue;
    const r = 10 + age * sp * (1 - 0.12 * i), k = 1 - age / life, a = a0 * Math.pow(k, 1.4) * (1 - 0.1 * i);
    g.strokeStyle = rgbaHex(col, 0.07 * a); g.lineWidth = 14 + age * 14;
    g.beginPath(); g.ellipse(x, y, r, r * (o.squash ?? 1), 0, 0, TAU); g.stroke();
    g.strokeStyle = rgbaHex(col, 0.4 * a); g.lineWidth = 2 + age * 1.2;
    g.beginPath(); g.ellipse(x, y, r, r * (o.squash ?? 1), 0, 0, TAU); g.stroke();
  }
}
/** A soft radial pool of light on the glow layer. */
export function glowPool(g: C2, x: number, y: number, r: number, col: string, a: number) {
  if (a <= 0) return;
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, rgbaHex(col, a)); gr.addColorStop(0.45, rgbaHex(col, a * 0.35)); gr.addColorStop(1, rgbaHex(col, 0));
  g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
}
/**
 * A cool shaft of moonlight from the surface far above (the glow layer), soft-sided, fading down. Draw it FIRST on the
 * glow layer: its fade is cut with 'destination-out', which would eat anything drawn there before it.
 */
export function moonShaft(g: C2, x: number, w: number, tau: number, a: number, floor = H) {
  const sway = 30 * Math.sin(tau * 0.25), top = -300;
  const xl0 = x - w * 0.3 + sway, xr0 = x + w * 0.3 + sway, xl1 = x - w * 0.6 + sway * 0.4, xr1 = x + w + sway * 0.4;
  const gr = g.createLinearGradient(Math.min(xl0, xl1), 0, Math.max(xr0, xr1), 0);
  gr.addColorStop(0, 'rgba(170,200,255,0)'); gr.addColorStop(0.5, `rgba(170,200,255,${0.11 * a})`); gr.addColorStop(1, 'rgba(170,200,255,0)');
  g.fillStyle = gr;
  g.beginPath(); g.moveTo(xl0, top); g.lineTo(xr0, top); g.lineTo(xr1, floor); g.lineTo(xl1, floor); g.closePath(); g.fill();
  g.save(); g.globalCompositeOperation = 'destination-out';
  const fd = g.createLinearGradient(0, top, 0, floor);
  fd.addColorStop(0, 'rgba(0,0,0,0)'); fd.addColorStop(1, 'rgba(0,0,0,1)');
  g.fillStyle = fd; g.fillRect(Math.min(xl0, xl1) - 2, top, Math.max(xr0, xr1) - Math.min(xl0, xl1) + 4, floor - top + 2);
  g.restore();
}
/** Clear the glow layer under the lyric with a soft top edge (the kit's clearGlowBand cuts the glow on a hard line). */
export function softGlowBand(g: C2, y = H - 96, h = 230) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'destination-out';
  const top = y - h / 2 - 30, gr = g.createLinearGradient(0, top - 170, 0, top + 4);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
  g.fillStyle = gr; g.fillRect(-W, top - 170, W * 3, 174);
  g.restore();
}
/** A torch's beam as light in the water: nested soft cones (feathered edges), brightest at the lens. */
export function softBeam(g: C2, x: number, y: number, ang: number, len: number, spread: number, a = 1, col = '255,236,190') {
  const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len, nx = -Math.sin(ang), ny = Math.cos(ang);
  const n = 8;
  for (let i = 0; i < n; i++) {
    const k = 1 - i / n, wd = Math.tan(spread * k) * len;
    const gr = g.createLinearGradient(x, y, ex, ey);
    gr.addColorStop(0, `rgba(${col},${0.05 * a})`); gr.addColorStop(0.45, `rgba(${col},${0.022 * a})`); gr.addColorStop(0.85, `rgba(${col},0)`);
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(x + nx * 3, y + ny * 3); g.lineTo(ex + nx * wd, ey + ny * wd); g.lineTo(ex - nx * wd, ey - ny * wd); g.lineTo(x - nx * 3, y - ny * 3); g.closePath(); g.fill();
  }
  glowPool(g, x, y, 60, '#fff3d0', 0.5 * a);
}
/** Light falling off into the dark around a lit centre (main layer): clear inside r0, `a` dark by r1 and beyond. */
export function falloff(c: C2, x: number, y: number, r0: number, r1: number, a: number, col = '#02040c') {
  const gr = c.createRadialGradient(x, y, r0, x, y, r1);
  gr.addColorStop(0, rgbaHex(col, 0)); gr.addColorStop(1, rgbaHex(col, a));
  c.fillStyle = gr; c.fillRect(-W, -H, W * 3, H * 3);
}
/** A warm wash of light from a source (main layer, 'lighter'): the side of things that faces it glows. */
export function warmWash(c: C2, x: number, y: number, r: number, col: string, a: number) {
  c.save(); c.globalCompositeOperation = 'lighter';
  const gr = c.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, rgbaHex(col, a)); gr.addColorStop(1, rgbaHex(col, 0));
  c.fillStyle = gr; c.fillRect(x - r, y - r, 2 * r, 2 * r);
  c.restore();
}
/** A rim of light on the side of the kit girl that faces the light (the kit's own rim lights her back). */
export function girlRim(c: C2, x: number, y: number, h: number, p: GirlPose, col: string, o: { flip?: boolean; arm?: boolean } = {}) {
  const fr = girlFrame(x, y, h, p, o.flip), u = fr.u;
  const fa = Math.atan2(fr.fw.y, fr.fw.x);
  c.save(); c.strokeStyle = col; c.lineCap = 'round'; c.lineWidth = 1.5 * u;
  c.beginPath(); c.arc(fr.head.x, fr.head.y, fr.headR * 0.97, fa - 0.4, fa + 1.5); c.stroke();
  const a = { x: fr.pel.x + fr.fw.x * 7.5 * u, y: fr.pel.y + fr.fw.y * 7.5 * u }, b = { x: fr.shoulder.x + fr.fw.x * 7 * u, y: fr.shoulder.y + fr.fw.y * 7 * u };
  c.lineWidth = 1.2 * u; c.globalAlpha = 0.8; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
  if (o.arm !== false) { // the underside of the near arm
    const el = { x: fr.shoulder.x + fr.dir(p.sh[1]).x * 16 * u, y: fr.shoulder.y + fr.dir(p.sh[1]).y * 16 * u };
    const d = fr.dir(p.sh[1] + p.el[1]), hd = { x: el.x + d.x * 15 * u, y: el.y + d.y * 15 * u };
    const n1 = { x: -fr.dir(p.sh[1]).y, y: fr.dir(p.sh[1]).x }, n2 = { x: -d.y, y: d.x };
    const s1 = n1.y > 0 ? 1 : -1, s2 = n2.y > 0 ? 1 : -1;
    c.lineWidth = 1 * u; c.globalAlpha = 0.7; c.beginPath();
    c.moveTo(fr.shoulder.x + n1.x * s1 * 2.4 * u, fr.shoulder.y + n1.y * s1 * 2.4 * u); c.lineTo(el.x + n1.x * s1 * 2.4 * u, el.y + n1.y * s1 * 2.4 * u);
    c.moveTo(el.x + n2.x * s2 * 2.4 * u, el.y + n2.y * s2 * 2.4 * u); c.lineTo(hd.x + n2.x * s2 * 2.4 * u, hd.y + n2.y * s2 * 2.4 * u); c.stroke();
  }
  c.restore();
}

// ------------------------------------------------------------------ the slate, with the pencil in her hand

export const SLATE = { w: 220, h: 280 };
/**
 * The girl's dive slate, drawn the kit's way (`slate()` in _diver.ts: a white board, a hole with its cord), but with
 * the pencil optional: `pencil: 'hang'` hangs it at the side as the kit does, 'none' leaves it out (it is in her hand).
 * `sx` squashes it horizontally (turned away from us). `draw` writes on it in slate units (0,0 its centre).
 * Returns the matrix from slate units to the context's current space.
 */
export function slateBoard(c: C2, x: number, y: number, s: number, rot: number, o: { pencil?: 'hang' | 'none'; sx?: number; draw?: (c: C2) => void; shade?: number } = {}): DOMMatrix {
  const w = SLATE.w, h = SLATE.h;
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s * (o.sx ?? 1), s);
  const m = c.getTransform();
  if ((o.sx ?? 1) < 0.98) { // its edge (thickness) when turned
    c.fillStyle = '#9aa6a6'; c.beginPath(); c.roundRect(-w / 2 + 10, -h / 2, w, h, 16); c.fill();
  }
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.roundRect(-w / 2 + 6, -h / 2 + 8, w, h, 16); c.fill();
  c.fillStyle = '#f2f5f4'; c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, 16); c.fill();
  c.strokeStyle = '#c8d0d0'; c.lineWidth = 3; c.stroke();
  c.fillStyle = '#c8d0d0'; c.beginPath(); c.arc(0, -h / 2 + 16, 7, 0, TAU); c.fill();
  c.strokeStyle = '#7a8a8a'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -h / 2 + 16);
  if ((o.pencil ?? 'hang') === 'hang') {
    c.quadraticCurveTo(w * 0.6, -h * 0.4, w / 2 + 14, h * 0.1); c.stroke();
    c.fillStyle = '#ffd23f'; c.save(); c.translate(w / 2 + 14, h * 0.12); c.rotate(0.3); c.fillRect(-5, -40, 10, 70); c.fillStyle = '#2a2a33'; c.beginPath(); c.moveTo(-5, 30); c.lineTo(5, 30); c.lineTo(0, 42); c.closePath(); c.fill(); c.restore();
  } else { c.quadraticCurveTo(w * 0.45, -h * 0.55, w / 2 + 4, -h * 0.25); c.stroke(); }
  if (o.draw) { c.save(); c.beginPath(); c.roundRect(-w / 2 + 10, -h / 2 + 30, w - 20, h - 40, 10); c.clip(); o.draw(c); c.restore(); }
  if (o.shade) { c.fillStyle = `rgba(6,10,26,${o.shade})`; c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, 16); c.fill(); }
  c.restore();
  return m;
}
/** The pencil in her hand: its tip at (x, y), its body pointing back along `ang`, length L. */
export function handPencil(c: C2, x: number, y: number, ang: number, L: number, w: number) {
  const dx = Math.cos(ang), dy = Math.sin(ang);
  c.save(); c.lineCap = 'butt';
  c.strokeStyle = '#2a2a33'; c.lineWidth = w * 0.5; c.beginPath(); c.moveTo(x, y); c.lineTo(x + dx * w * 0.9, y + dy * w * 0.9); c.stroke();
  c.strokeStyle = '#e8c9a0'; c.lineWidth = w; c.beginPath(); c.moveTo(x + dx * w * 0.8, y + dy * w * 0.8); c.lineTo(x + dx * w * 2, y + dy * w * 2); c.stroke();
  c.strokeStyle = '#ffd23f'; c.lineWidth = w; c.beginPath(); c.moveTo(x + dx * w * 2, y + dy * w * 2); c.lineTo(x + dx * L, y + dy * L); c.stroke();
  c.strokeStyle = '#ff8fb0'; c.beginPath(); c.moveTo(x + dx * L, y + dy * L); c.lineTo(x + dx * (L + w * 1.2), y + dy * (L + w * 1.2)); c.stroke();   // the rubber
  c.restore();
}

// ------------------------------------------------------------------ pencil drawings (slate units)

type Pt = [number, number];
/** A child's wobbly circle: the radius breathes and the line overshoots where it should close. */
export function wobblyCircle(cx: number, cy: number, r: number, seed: number, n = 44, over = 0.08, a0 = -PI / 2): Pt[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + (i / n) * TAU * (1 + over), rr = r * (1 + 0.05 * Math.sin(a * 3 + seed) + 0.03 * Math.sin(a * 5 + seed * 2) + (i / n) * 0.06);
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr] as Pt;
  });
}
export const starPts = (cx: number, cy: number, r: number, rot = -PI / 2): Pt[] =>
  Array.from({ length: 11 }, (_, i) => { const a = rot + (i / 10) * TAU, rr = i % 2 ? r * 0.42 : r; return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr] as Pt; });
export const arcPts = (cx: number, cy: number, r: number, a0: number, a1: number, n = 16): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as Pt; });
/** A heart drawn in one line, starting at the dip between its lobes (as a child draws it); s is its half-width. */
export function heartPts(cx: number, cy: number, s: number, n = 44): Pt[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = (i / n) * TAU * 1.03;
    const x = 16 * Math.pow(Math.sin(a), 3), y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a);
    return [cx + (x * s) / 16, cy - (y * s) / 16] as Pt;
  });
}
/** A question mark as two pencil strokes (the hook, the dot). */
export function questionPts(cx: number, cy: number, s: number): [Pt[], Pt[]] {
  const hook: Pt[] = [...arcPts(cx, cy - s * 0.42, s * 0.3, PI * 1.05, PI * 2.25, 18), [cx + s * 0.02, cy + s * 0.02], [cx, cy + s * 0.2]];
  const dot: Pt[] = [[cx - s * 0.02, cy + s * 0.42], [cx + s * 0.03, cy + s * 0.46], [cx - s * 0.01, cy + s * 0.48]];
  return [hook, dot];
}
/** The point at fraction u along a polyline, and its local direction. */
export function along(pts: Pt[], u: number): { x: number; y: number; ang: number } {
  let total = 0; const seg: number[] = [];
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]); seg.push(d); total += d; }
  let left = total * clamp(u);
  for (let i = 1; i < pts.length; i++) {
    const d = seg[i - 1]!;
    if (left <= d || i === pts.length - 1) {
      const k = d > 0 ? Math.min(1, left / d) : 0, a = pts[i - 1]!, b = pts[i]!;
      return { x: a[0] + (b[0] - a[0]) * k, y: a[1] + (b[1] - a[1]) * k, ang: Math.atan2(b[1] - a[1], b[0] - a[0]) };
    }
    left -= d;
  }
  const l = pts[pts.length - 1]!; return { x: l[0], y: l[1], ang: 0 };
}
/** Strokes drawn one after another over time: each [t0, t1, pts, width]. Draws them and returns the pencil's tip. */
export interface Stroke { t0: number; t1: number; pts: Pt[]; w?: number; col?: string }
export function sketch(c: C2, strokes: Stroke[], t: number, pencilLine: (c: C2, pts: Pt[], u: number, col: string, w: number) => void): { x: number; y: number; drawing: boolean } {
  let tip = { x: 0, y: 0, drawing: false };
  for (const s of strokes) {
    const u = clamp((t - s.t0) / (s.t1 - s.t0));
    if (u <= 0) { if (!tip.drawing && tip.x === 0 && tip.y === 0) { const p = s.pts[0]!; tip = { x: p[0], y: p[1], drawing: false }; } break; }
    pencilLine(c, s.pts, u, s.col ?? '#2a2a33', s.w ?? 5);
    const p = along(s.pts, u); tip = { x: p.x, y: p.y, drawing: u < 1 };
  }
  return tip;
}

/** Her drawing of Rai on the slate (slate units): the disc and its hole, the head, eyes and a smile, little arms, the starfish. */
export function raiDrawing(t0: number, t1: number): Stroke[] {
  const parts: { pts: Pt[]; w: number; k: number }[] = [
    { pts: wobblyCircle(0, 20, 50, 2), w: 5.5, k: 2.2 },                     // the disc
    { pts: wobblyCircle(2, 22, 14, 5, 26, 0.12), w: 5, k: 0.8 },              // the hole: her heart
    { pts: wobblyCircle(0, -56, 31, 7, 36, 0.06), w: 5.5, k: 1.5 },           // the head
    { pts: [[-11, -64], [-10, -59]], w: 6, k: 0.18 },                         // eyes
    { pts: [[11, -64], [12, -59]], w: 6, k: 0.18 },
    { pts: arcPts(0, -58, 14, 0.35, PI - 0.35, 12), w: 4.5, k: 0.5 },         // the smile
    { pts: [[-46, 6], [-66, -14], [-72, -22]], w: 5, k: 0.4 },                // little arms, one waving
    { pts: [[46, 6], [64, 16], [72, 14]], w: 5, k: 0.4 },
    { pts: starPts(22, -88, 12, -PI / 2 + 0.2), w: 4, k: 1.1 },              // the starfish on her crown
  ];
  const total = parts.reduce((a, p) => a + p.k, 0);
  let acc = 0;
  return parts.map((p) => { const a = t0 + ((t1 - t0) * acc) / total; acc += p.k; return { t0: a, t1: t0 + ((t1 - t0) * acc) / total - 0.02, pts: p.pts, w: p.w }; });
}
/** Old pencil in the slate's corner (it was hers before tonight): a tally of dives and her depth, half rubbed out. */
export function slateCorner(c: C2) {
  c.save(); c.strokeStyle = 'rgba(80,90,95,0.42)'; c.lineWidth = 3; c.lineCap = 'round';
  for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-92 + i * 7, -104); c.lineTo(-91 + i * 7, -86); c.stroke(); }
  c.beginPath(); c.moveTo(-96, -90); c.lineTo(-64, -100); c.stroke();     // the gate: five
  for (let i = 0; i < 2; i++) { c.beginPath(); c.moveTo(-58 + i * 7, -104); c.lineTo(-57 + i * 7, -86); c.stroke(); }
  c.font = font(FAM.monoB(), 15); c.fillStyle = 'rgba(80,90,95,0.42)'; c.textAlign = 'right'; c.textBaseline = 'middle';
  c.fillText('4 m', 96, -96);
  c.restore();
}
/** A pencil line in slate units, a touch of graphite sheen. */
export function graphite(c: C2, pts: Pt[], u: number, col = '#2a2a33', w = 5) {
  if (u <= 0 || pts.length < 2) return;
  let total = 0; const seg: number[] = [];
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]); seg.push(d); total += d; }
  let left = total * clamp(u);
  c.save(); c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(pts[0]![0], pts[0]![1]);
  for (let i = 1; i < pts.length && left > 0; i++) {
    const d = seg[i - 1]!, k = Math.min(1, left / d);
    c.lineTo(pts[i - 1]![0] + (pts[i]![0] - pts[i - 1]![0]) * k, pts[i - 1]![1] + (pts[i]![1] - pts[i - 1]![1]) * k);
    left -= d;
  }
  c.stroke(); c.restore();
}
/** The smudge where something was rubbed out (slate units), 0..1. */
export function smudge(c: C2, x: number, y: number, s: number, a: number) {
  if (a <= 0) return;
  c.save();
  const gr = c.createRadialGradient(x, y, 0, x, y, s);
  gr.addColorStop(0, `rgba(120,128,132,${0.3 * a})`); gr.addColorStop(1, 'rgba(120,128,132,0)');
  c.fillStyle = gr; c.beginPath(); c.ellipse(x, y, s * 1.2, s * 0.8, 0.2, 0, TAU); c.fill();
  c.restore();
}

// ------------------------------------------------------------------ small set dressing

/** Writing in the sand (legend's "RICHEST ROCK", left by her finger): grooves with a lit lower lip. */
export function sandWriting(c: C2, text: string, x: number, y: number, size: number, a = 1, rot = -0.03) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(1, 0.45);
  c.font = font(FAM.cond(), size); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = `rgba(255,240,200,${0.35 * a})`; c.fillText(text, 0, 4);
  c.fillStyle = `rgba(90,70,40,${0.7 * a})`; c.fillText(text, 0, 0);
  c.restore();
}
/** Three coins from her purse on the sand (legend's), glinting. */
export function coins(c: C2, g: C2, x: number, y: number, s: number, t: number) {
  [[0, 0], [26, 7], [52, -2]].forEach(([dx, dy], i) => {
    const cx = x + dx! * s, cy = y + dy! * s;
    c.fillStyle = '#a07a2a'; c.beginPath(); c.ellipse(cx, cy + 3 * s, 13 * s, 5.5 * s, 0, 0, TAU); c.fill();
    c.fillStyle = HEX.gold; c.beginPath(); c.ellipse(cx, cy, 13 * s, 5.5 * s, 0, 0, TAU); c.fill();
    const tw = 0.5 + 0.5 * Math.sin(t * 2.3 + i * 2);
    g.fillStyle = rgbaHex('#fff2c0', 0.35 * tw); g.beginPath(); g.arc(cx + 4 * s, cy - 1 * s, 6 * s, 0, TAU); g.fill();
  });
}
/** The little holed pebble (the pendant to be), lying in the sand by Rai's foot. */
export function pebble(c: C2, x: number, y: number, s: number) {
  c.fillStyle = 'rgba(30,20,40,0.3)'; c.beginPath(); c.ellipse(x, y + 7 * s, 11 * s, 3 * s, 0, 0, TAU); c.fill();
  c.fillStyle = HEX.stone; c.beginPath(); c.arc(x, y, 9 * s, 0, TAU); c.arc(x, y, 3.4 * s, 0, TAU, true); c.fill('evenodd');
  c.strokeStyle = '#8f8676'; c.lineWidth = 1.2 * s; c.beginPath(); c.arc(x, y, 9 * s, 0, TAU); c.stroke();
}
export { mixHex, ease };

// ------------------------------------------------------------------ the night set (touch, and manta's first beat)

/** The set: where things stand on the night seabed (set px; the cameras frame parts of it). */
export const SET = { floor: 880, rai: { x: 1240, y: 715, R: 150 }, torch: { x: 958, y: 897 }, aim: { x: 1236, y: 548 } };
export const TORCH_ANG = Math.atan2(SET.aim.y - SET.torch.y, SET.aim.x - SET.torch.x);
/** touch's last framing, which is manta's first (the join at 53.96). */
export const END_CAM: Cam = { x: 1062, y: 580, z: 1.15 };
/** Keep a camera inside the 1920x1080 set (the seabed is drawn to the frame's edges). */
export function clampCam(k: Cam): Cam {
  const hw = W / (2 * k.z), hh = H / (2 * k.z);
  return { ...k, x: clamp(k.x, hw, W - hw), y: clamp(k.y, hh, H - hh) };
}
/** The night seabed behind everything, at hush time `tau`: the deep's blue with its clues (another stone half buried,
 *  the trader's rusted anchor, shells), darkened except where the torch and (later) her heart light it. */
export function nightSeabed(c: C2, tau: number, holes: { x: number; y: number; r: number; soft?: number }[], dark = 0.8, shaft: { x: number; w: number; a: number } | null = { x: 420, w: 300, a: 1 }) {
  seabed(c, tau, { depth: 0.92, floor: SET.floor, seed: 11, clues: ['stone', 'anchor', 'shells'], shark: false });
  darknessFill(c, dark, holes);
  if (shaft) { // the moon's shaft far off, on the picture itself (soft with it) rather than the glow layer
    c.save(); c.globalCompositeOperation = 'lighter';
    const sway = 30 * Math.sin(tau * 0.25), x = shaft.x, w = shaft.w, top = -300, floor = SET.floor + 40;
    for (const k of [1, 0.55]) {
      const gr = c.createLinearGradient(x - w * 0.6 * k + sway, 0, x + w * k + sway, 0);
      gr.addColorStop(0, 'rgba(120,150,210,0)'); gr.addColorStop(0.5, `rgba(120,150,210,${0.07 * shaft.a})`); gr.addColorStop(1, 'rgba(120,150,210,0)');
      c.fillStyle = gr;
      c.beginPath(); c.moveTo(x - w * 0.3 * k + sway, top); c.lineTo(x + w * 0.3 * k + sway, top); c.lineTo(x + w * k + sway * 0.4, floor); c.lineTo(x - w * 0.6 * k + sway * 0.4, floor); c.closePath(); c.fill();
    }
    const pool = c.createRadialGradient(x + w * 0.2, floor - 10, 0, x + w * 0.2, floor - 10, w * 0.9);
    pool.addColorStop(0, `rgba(120,150,210,${0.08 * shaft.a})`); pool.addColorStop(1, 'rgba(120,150,210,0)');
    c.fillStyle = pool; c.beginPath(); c.ellipse(x + w * 0.2, floor - 10, w * 0.9, w * 0.2, 0, 0, TAU); c.fill();
    c.restore();
  }
}
/** darkness() as the kit draws it (a copy, so the set can darken inside an offscreen layer with the same look). */
export function darknessFill(c: C2, a: number, holes: { x: number; y: number; r: number; soft?: number }[], col = '#03050f') {
  c.save();
  c.fillStyle = rgbaHex(col, a);
  c.beginPath(); c.rect(-W, -H, W * 3, H * 3);
  for (const h of holes) { c.moveTo(h.x + h.r, h.y); c.arc(h.x, h.y, h.r, 0, TAU, true); }
  c.fill();
  for (const h of holes) {
    const s = h.soft ?? 0.35, gr = c.createRadialGradient(h.x, h.y, h.r * (1 - s), h.x, h.y, h.r);
    gr.addColorStop(0, rgbaHex(col, 0)); gr.addColorStop(1, rgbaHex(col, a));
    c.fillStyle = gr; c.beginPath(); c.arc(h.x, h.y, h.r, 0, TAU); c.fill();
  }
  c.restore();
}
/** Near reeds in silhouette at the frame's edges (screen space), for a soft dark foreground. */
export function nightReeds(c: C2, tau: number, seed = 4, col = '#040a12') {
  for (let i = 0; i < 6; i++) {
    const side = i % 2 ? 1 : -1, x = side > 0 ? W - 20 - 120 * h01(i, seed, 51) : 20 + 120 * h01(i, seed, 51);
    reed(c, x, H + 40, 300 + 300 * h01(i, seed, 52), tau, i + 90, col, 40);
  }
}
