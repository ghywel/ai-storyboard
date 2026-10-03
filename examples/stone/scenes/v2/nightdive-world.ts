// v2 NIGHTDIVE's world: the village's divers (adult swimmers in silhouette, masks pushed down, torches), the long
// pole, ropes, flames, the surface seen from below with the canoes and the village's lanterns on it, sand puffs, and
// the night shore the girl leads them down to. Canvas2D, 1920x1080 logical, pure functions of t.
import { W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { clamp, ease } from '../../engine/util';
import { h01 } from '../_rai';
import { TAU, rgbaHex, mixHex } from '../_motifs';
import { island, canoe } from '../_world';
import { villager, lanternGlow, relative } from './_diver';

type C2 = CanvasRenderingContext2D;
type P = { x: number; y: number };
const PI = Math.PI;

export const SIL = '#0b0d1a';
export const RIM = 'rgba(255,196,120,0.85)';

// ------------------------------------------------------------------ the divers

export interface DPose { rot: number; hip: [number, number]; knee: [number, number]; sh: [number, number]; el: [number, number]; head?: number }
export const DIVE: Record<string, (t: number, ph?: number) => DPose> = {
  /** swimming along (horizontal), a flutter kick */
  swim: (t, ph = 0) => ({ rot: PI / 2 - 0.1, hip: [0.25 * Math.sin(t * 7 + ph), -0.25 * Math.sin(t * 7 + ph)], knee: [-0.3, -0.3], sh: [PI - 0.5, 1.4], el: [0.2, 0.2], head: -0.2 }),
  /** going down head first */
  down: (t, ph = 0) => ({ rot: PI * 0.78, hip: [0.22 * Math.sin(t * 7 + ph), -0.22 * Math.sin(t * 7 + ph)], knee: [-0.25, -0.25], sh: [PI - 0.3, 1.2], el: [0.1, 0.2], head: -0.25 }),
  /** upright in the water, treading, holding something in front */
  hold: (t, ph = 0) => ({ rot: 0.12 * Math.sin(t * 1.5 + ph), hip: [0.35 * Math.sin(t * 4 + ph), -0.35 * Math.sin(t * 4 + ph)], knee: [-0.6, -0.5], sh: [1.2, 1.5], el: [0.3, 0.2] }),
  /** rising, kicking hard, arms up the pole */
  haul: (t, ph = 0) => ({ rot: 0.05, hip: [0.5 * Math.sin(t * 9 + ph), -0.5 * Math.sin(t * 9 + ph)], knee: [-0.5 - 0.3 * Math.cos(t * 9 + ph), -0.5 + 0.3 * Math.cos(t * 9 + ph)], sh: [2.5, 2.7], el: [0.2, 0.1] }),
};
export interface DiverOpts { t: number; col?: string; flip?: boolean; mask?: string; torch?: boolean; aim?: P; reach?: [P | null, P | null]; rim?: string; rope?: boolean }
/**
 * An adult diver in silhouette (wetsuit dark, a mask in the village's colours with a glint, fins), (x, y) the middle
 * of the body; h the height. `aim` points the torch arm at a point; `reach` puts the hands on points (the pole).
 * Returns the torch's tip and angle, and the hands.
 */
export function diver(c: C2, x: number, y: number, h: number, pose: DPose, o: DiverOpts) {
  const u = h / 100, f = o.flip ? -1 : 1, col = o.col ?? SIL, t = o.t;
  const L = { thigh: 23, shin: 22, torso: 32, upper: 16, fore: 15, head: 8.5, neck: 4 };
  const p = pose;
  const up: P = { x: Math.sin(p.rot) * f, y: -Math.cos(p.rot) }, fw: P = { x: Math.cos(p.rot) * f, y: Math.sin(p.rot) };
  const dir = (a: number): P => ({ x: -up.x * Math.cos(a) + fw.x * Math.sin(a), y: -up.y * Math.cos(a) + fw.y * Math.sin(a) });
  const add = (a: P, d: P, k: number): P => ({ x: a.x + d.x * k * u, y: a.y + d.y * k * u });
  const pel = add({ x, y }, up, -L.torso * 0.5), neck = add(pel, up, L.torso), head = add(neck, up, L.neck + L.head), sh = add(neck, up, -3);
  const legs = [0, 1].map((i) => { const j = add(pel, dir(p.hip[i]!), L.thigh); return [j, add(j, dir(p.hip[i]! + p.knee[i]!), L.shin)] as [P, P]; });
  // arms: by angles, or reaching for points (two-bone, the elbow out), or the torch aimed
  const armPts = [0, 1].map((i): [P, P] => {
    const T = o.reach?.[i] ?? (i === 1 && o.aim ? o.aim : null);
    if (T) {
      const vx = T.x - sh.x, vy = T.y - sh.y, d0 = Math.hypot(vx, vy) || 1e-3, l1 = L.upper * u, l2 = L.fore * u;
      if (i === 1 && o.aim && !o.reach?.[1]) { const e = { x: sh.x + (vx / d0) * l1, y: sh.y + (vy / d0) * l1 }; return [e, { x: sh.x + (vx / d0) * (l1 + l2), y: sh.y + (vy / d0) * (l1 + l2) }]; }
      const d = Math.min((l1 + l2) * 0.999, d0), a = Math.atan2(vy, vx), ca = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
      const ea = a - f * ca * (i ? 1 : -1);
      const e = { x: sh.x + Math.cos(ea) * l1, y: sh.y + Math.sin(ea) * l1 };
      return [e, { x: sh.x + Math.cos(a) * d, y: sh.y + Math.sin(a) * d }];
    }
    const j = add(sh, dir(p.sh[i]!), L.upper); return [j, add(j, dir(p.sh[i]! + p.el[i]!), L.fore)];
  });
  const line = (pts: P[], w: number, cc: string) => { c.strokeStyle = cc; c.lineWidth = w * u; c.beginPath(); c.moveTo(pts[0]!.x, pts[0]!.y); for (const q of pts.slice(1)) c.lineTo(q.x, q.y); c.stroke(); };
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  const back = mixHex(col, '#2a3048', 0.3);
  line([pel, legs[0]![0], legs[0]![1]], 8, back);
  fin(c, legs[0]![1], dir(p.hip[0] + p.knee[0]), u, mixHex(back, '#1f6f6a', 0.5), t, 0);
  line([sh, armPts[0]![0], armPts[0]![1]], 6, back);
  // torso, the tank-less wetsuit, the head
  const side = (q: P, k: number): P => ({ x: q.x + fw.x * k * u, y: q.y + fw.y * k * u });
  c.fillStyle = col; c.beginPath();
  const a1 = side(pel, -8), a2 = side(sh, -8.5), b2 = side(sh, 8), b1 = side(pel, 8);
  c.moveTo(a1.x, a1.y); c.lineTo(a2.x, a2.y); c.lineTo(b2.x, b2.y); c.lineTo(b1.x, b1.y); c.closePath(); c.fill();
  c.beginPath(); c.arc(head.x, head.y, L.head * u, 0, TAU); c.fill();
  line([pel, legs[1]![0], legs[1]![1]], 8, col);
  fin(c, legs[1]![1], dir(p.hip[1] + p.knee[1]), u, mixHex(col, '#1f6f6a', 0.55), t, 1);
  line([sh, armPts[1]![0], armPts[1]![1]], 6, col);
  for (const a of armPts) { c.fillStyle = col; c.beginPath(); c.arc(a[1].x, a[1].y, 3.2 * u, 0, TAU); c.fill(); }
  // the mask and snorkel
  const mc = add(head, fw, L.head * 0.55), ang = Math.atan2(fw.y, fw.x), mcol = o.mask ?? HEX.cyan;
  c.strokeStyle = mcol; c.lineWidth = 2.4 * u; c.beginPath(); c.moveTo(side(add(head, up, 2), -L.head * 0.9).x, side(add(head, up, 2), -L.head * 0.9).y); c.lineTo(side(add(head, up, 13), -L.head * 0.9).x, side(add(head, up, 13), -L.head * 0.9).y); c.stroke();
  c.save(); c.translate(mc.x, mc.y); c.rotate(ang);
  c.fillStyle = mcol; c.beginPath(); c.roundRect(-3 * u, -6 * u, 9 * u, 12 * u, 3 * u); c.fill();
  c.fillStyle = '#0a1428'; c.beginPath(); c.roundRect(-1.4 * u, -4.6 * u, 6.2 * u, 9.2 * u, 2.2 * u); c.fill();
  c.strokeStyle = 'rgba(235,250,255,0.9)'; c.lineWidth = 1.1 * u; c.beginPath(); c.moveTo(0.2 * u, -3.4 * u); c.lineTo(2.4 * u, -0.4 * u); c.stroke();
  c.restore();
  // a coil of rope over the shoulder
  if (o.rope) { c.strokeStyle = '#b8935a'; c.lineWidth = 2 * u; c.beginPath(); c.ellipse(sh.x, sh.y + 4 * u * fw.y, 7 * u, 9 * u, p.rot, 0, TAU); c.stroke(); }
  // the torch in the front hand
  let torch: { x: number; y: number; ang: number } | undefined;
  if (o.torch) {
    const hnd = armPts[1]![1], e = armPts[1]![0], da = Math.atan2(hnd.y - e.y, hnd.x - e.x), tip = { x: hnd.x + Math.cos(da) * 8 * u, y: hnd.y + Math.sin(da) * 8 * u };
    c.strokeStyle = '#d8d2c0'; c.lineWidth = 4.4 * u; c.beginPath(); c.moveTo(hnd.x - Math.cos(da) * 2 * u, hnd.y - Math.sin(da) * 2 * u); c.lineTo(tip.x, tip.y); c.stroke();
    c.fillStyle = '#fff6c8'; c.beginPath(); c.arc(tip.x, tip.y, 2.6 * u, 0, TAU); c.fill();
    torch = { x: tip.x, y: tip.y, ang: da };
  }
  if (o.rim) { c.strokeStyle = o.rim; c.lineWidth = 1.5 * u; c.globalAlpha = 0.85; c.beginPath(); c.arc(head.x, head.y, L.head * u, ang - 1.4, ang + 0.4); c.stroke(); c.beginPath(); c.moveTo(b1.x, b1.y); c.lineTo(b2.x, b2.y); c.stroke(); c.globalAlpha = 1; }
  c.restore();
  return { torch, hands: [armPts[0]![1], armPts[1]![1]] as [P, P], head };
}
function fin(c: C2, foot: P, d: P, u: number, col: string, t: number, i: number) {
  const k = 1 + 0.15 * Math.sin(t * 8 + i * PI), n: P = { x: -d.y, y: d.x };
  c.fillStyle = col; c.beginPath(); c.moveTo(foot.x - n.x * 2.4 * u, foot.y - n.y * 2.4 * u);
  c.lineTo(foot.x + d.x * 19 * u * k - n.x * 7 * u, foot.y + d.y * 19 * u * k - n.y * 7 * u);
  c.lineTo(foot.x + d.x * 21 * u * k + n.x * 6 * u, foot.y + d.y * 21 * u * k + n.y * 6 * u);
  c.lineTo(foot.x + n.x * 2.4 * u, foot.y + n.y * 2.4 * u); c.closePath(); c.fill();
}

/** The angle to point a girl()'s front arm at T (her rig: angles from "down", + forward). */
export function girlAim(x: number, y: number, h: number, rot: number, flip: boolean, T: P, drop = 0): number {
  const u = h / 100, f = flip ? -1 : 1, upright = Math.abs(rot) < 0.8;
  const pel = upright ? { x, y: y - 37 * u + drop * u } : { x, y };
  const up = { x: Math.sin(rot) * f, y: -Math.cos(rot) }, fw = { x: Math.cos(rot) * f, y: Math.sin(rot) };
  const sh = { x: pel.x + up.x * 26 * u, y: pel.y + up.y * 26 * u };
  const v = { x: T.x - sh.x, y: T.y - sh.y };
  return Math.atan2(v.x * fw.x + v.y * fw.y, -(v.x * up.x + v.y * up.y));
}

// ------------------------------------------------------------------ props

/** The long pole: a straight pale trunk with lashings near the ends. */
export function pole(c: C2, x1: number, y1: number, x2: number, y2: number, w = 18) {
  c.save(); c.lineCap = 'round';
  c.strokeStyle = '#6e4a28'; c.lineWidth = w; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  const nx = -(y2 - y1), ny = x2 - x1, nl = Math.hypot(nx, ny) || 1;
  c.strokeStyle = 'rgba(255,214,150,0.35)'; c.lineWidth = w * 0.25;
  c.beginPath(); c.moveTo(x1 + (nx / nl) * w * 0.25, y1 + (ny / nl) * w * 0.25); c.lineTo(x2 + (nx / nl) * w * 0.25, y2 + (ny / nl) * w * 0.25); c.stroke();
  c.strokeStyle = '#c9a76a'; c.lineWidth = w * 0.2;
  for (const v of [0.06, 0.09, 0.12, 0.88, 0.91, 0.94]) {
    const x = x1 + (x2 - x1) * v, y = y1 + (y2 - y1) * v;
    c.beginPath(); c.moveTo(x + (nx / nl) * w * 0.6 - (x2 - x1) / nl * 3, y + (ny / nl) * w * 0.6); c.lineTo(x - (nx / nl) * w * 0.6 + (x2 - x1) / nl * 3, y - (ny / nl) * w * 0.6); c.stroke();
  }
  c.restore();
}
/** A rope from A to B, sagging by `slack` (px) and buzzing with `twang` (0..1, after it snaps taut). */
export function rope(c: C2, A: P, B: P, slack: number, t: number, twang = 0, w = 4) {
  const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, dx = B.x - A.x, dy = B.y - A.y, l = Math.hypot(dx, dy) || 1;
  const nx = -dy / l, ny = dx / l, vib = twang * 10 * Math.sin(t * 60);
  const sag = slack + vib;
  c.save(); c.lineCap = 'round';
  c.strokeStyle = '#a07c46'; c.lineWidth = w; c.beginPath(); c.moveTo(A.x, A.y); c.quadraticCurveTo(mx + nx * sag + (slack > 0 ? 0 : 0), my + ny * sag + slack * 0.6, B.x, B.y); c.stroke();
  c.strokeStyle = 'rgba(60,40,20,0.6)'; c.lineWidth = w * 0.4; c.setLineDash([w * 1.2, w * 1.4]);
  c.beginPath(); c.moveTo(A.x, A.y); c.quadraticCurveTo(mx + nx * sag, my + ny * sag + slack * 0.6, B.x, B.y); c.stroke();
  c.restore();
  if (twang > 0.05) { // little vibration marks
    c.save(); c.strokeStyle = `rgba(255,230,190,${0.7 * twang})`; c.lineWidth = 2.5;
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(mx + nx * 16 * s - dx / l * 18, my + ny * 16 * s - dy / l * 18); c.lineTo(mx + nx * 16 * s + dx / l * 18, my + ny * 16 * s + dy / l * 18); c.stroke(); }
    c.restore();
  }
}
/** A flaming torch on a stick (the canoes' prows, the shore). Glow on g. */
export function flame(c: C2, g: C2, x: number, y: number, s: number, t: number, i = 0) {
  c.save();
  c.strokeStyle = '#3a2414'; c.lineWidth = 5 * s; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 60 * s); c.stroke();
  const fl = (k: number, col: string, sc: number) => {
    c.fillStyle = col; c.beginPath();
    const w = 12 * s * sc, hgt = (34 + 8 * Math.sin(t * 13 + i + k)) * s * sc, sw = 5 * s * Math.sin(t * 9 + i * 2 + k);
    c.moveTo(x - w, y); c.quadraticCurveTo(x - w, y - hgt * 0.5, x + sw, y - hgt); c.quadraticCurveTo(x + w, y - hgt * 0.5, x + w, y); c.closePath(); c.fill();
  };
  fl(0, '#ff6a2a', 1); fl(1, '#ffb040', 0.7); fl(2, '#fff0b0', 0.38);
  c.restore();
  const gr = g.createRadialGradient(x, y - 14 * s, 2, x, y - 14 * s, 90 * s);
  gr.addColorStop(0, 'rgba(255,170,80,0.6)'); gr.addColorStop(1, 'rgba(255,140,60,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(x, y - 14 * s, 90 * s, 0, TAU); g.fill();
}
/** Sand thrown up from the seabed: soft clouds expanding and settling, from t0. */
export function sandPuff(c: C2, x: number, y: number, w: number, t: number, t0: number, seed = 1) {
  const u = (t - t0) / 1.4;
  if (u < 0 || u > 1) return;
  for (let i = 0; i < 12; i++) {
    const a = PI + (h01(i, seed, 1)) * PI, sp = 0.5 + h01(i, seed, 2), r = (24 + 40 * h01(i, seed, 3)) * (0.6 + u * 1.2);
    const px = x + Math.cos(a) * w * 0.6 * sp * ease.outCubic(u) + (h01(i, seed, 4) - 0.5) * w, py = y + Math.sin(a) * 90 * sp * ease.outCubic(u);
    c.fillStyle = `rgba(214,190,140,${0.45 * (1 - u)})`; c.beginPath(); c.arc(px, py, r, 0, TAU); c.fill();
  }
}

/** A torch's beam in water: soft-edged (three nested cones), brightest at the lamp, fading along its length. */
export function softBeam(g: C2, x: number, y: number, ang: number, len: number, spread = 0.16, a = 1, maxY = H - 360) {
  if (Math.sin(ang) > 0.05) len = Math.min(len, Math.max(40, (maxY - y) / Math.sin(ang)));
  const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len, nx = -Math.sin(ang), ny = Math.cos(ang);
  for (let j = 0; j < 12; j++) {
    const k = 1.9 - j * 0.15, al = 0.022 + 0.004 * j;
    const w = Math.tan(spread * k) * len, gr = g.createLinearGradient(x, y, ex, ey);
    gr.addColorStop(0, rgbaHex('#fff1c0', al * a * 2.2)); gr.addColorStop(0.35, rgbaHex('#ffdc90', al * a)); gr.addColorStop(1, rgbaHex('#ffcf7a', 0));
    g.fillStyle = gr; g.beginPath(); g.moveTo(x + nx * 3, y + ny * 3); g.lineTo(ex + nx * w, ey + ny * w); g.lineTo(ex - nx * w, ey - ny * w); g.lineTo(x - nx * 3, y - ny * 3); g.closePath(); g.fill();
  }
  const hg = g.createRadialGradient(x, y, 0, x, y, 26);
  hg.addColorStop(0, rgbaHex('#fff6d0', 0.8 * a)); hg.addColorStop(1, rgbaHex('#ffd890', 0));
  g.fillStyle = hg; g.beginPath(); g.arc(x, y, 26, 0, TAU); g.fill();
}

/** Fade the glow layer out above the lyric band (no hard edge where clearGlowBand cuts it), from y0 to y1. */
export function fadeGlowAbove(g: C2, y0 = H - 380, y1 = H - 241) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-out';
  const gr = g.createLinearGradient(0, y0, 0, y1);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
  g.fillStyle = gr; g.fillRect(0, y0, W, y1 - y0); g.fillStyle = '#000'; g.fillRect(0, y1, W, H - y1);
  g.restore();
}

// ------------------------------------------------------------------ the surface from below

/** A canoe's hull seen from below at the surface (a dark spindle with its outrigger), and a lantern hanging off it. */
export function hullBelow(c: C2, g: C2, x: number, y: number, k: number, t: number, i: number, lantern = true) {
  c.save(); c.translate(x, y + 3 * Math.sin(t * 1.2 + i)); c.scale(k, k);
  c.fillStyle = '#05070f';
  c.beginPath(); c.moveTo(-190, -4); c.quadraticCurveTo(0, 34, 190, -4); c.quadraticCurveTo(0, 6, -190, -4); c.fill();
  c.beginPath(); c.moveTo(-120, 2); c.lineTo(-100, -40); c.moveTo(80, 2); c.lineTo(100, -40); c.strokeStyle = '#05070f'; c.lineWidth = 6; c.stroke();
  c.beginPath(); c.ellipse(0, -44, 130, 8, 0, 0, TAU); c.fill();
  c.restore();
  if (lantern) {
    const lx = x + 120 * k, ly = y - 34 * k + 4 * Math.sin(t * 2 + i);
    c.fillStyle = '#ffcf7a'; c.beginPath(); c.ellipse(lx, ly, 8 * k, 10 * k, 0, 0, TAU); c.fill();
    const gr = g.createRadialGradient(lx, ly, 2, lx, ly, 40 * k);
    gr.addColorStop(0, 'rgba(255,190,100,0.42)'); gr.addColorStop(1, 'rgba(255,150,60,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(lx, ly, 40 * k, 0, TAU); g.fill();
  }
}
/**
 * The night surface seen from below: above the line at y the sky's dim window with the moon smeared through it, the
 * line itself bright and wobbling, the village's lanterns floating on it (warm dots, their light streaking down).
 */
export function surfaceBelow(c: C2, g: C2, t: number, y: number, o: { lanterns?: number; moonX?: number; seed?: number; glow?: number } = {}) {
  const n = o.lanterns ?? 40, seed = o.seed ?? 3, mx = o.moonX ?? W * 0.66;
  const wob = (x: number) => y + 6 * Math.sin(x * 0.012 + t * 1.6) + 3 * Math.sin(x * 0.037 - t * 2.3);
  const sk = c.createLinearGradient(0, y - 400, 0, y);
  sk.addColorStop(0, '#0a1030'); sk.addColorStop(1, '#22306a');
  c.fillStyle = sk; c.beginPath(); c.moveTo(-200, -600); c.lineTo(W + 200, -600);
  for (let x = W + 200; x >= -200; x -= 24) c.lineTo(x, wob(x)); c.closePath(); c.fill();
  // the moon, smeared by the ripples
  for (let k = 0; k < 5; k++) { c.fillStyle = `rgba(240,236,214,${0.18 + 0.1 * k})`; c.beginPath(); c.ellipse(mx + 6 * Math.sin(t * 2 + k), y - 60 - k * 2, 60 - k * 9, 18 - k * 2, 0.05 * Math.sin(t + k), 0, TAU); c.fill(); }
  // the line
  c.strokeStyle = 'rgba(190,220,255,0.55)'; c.lineWidth = 3; c.beginPath();
  for (let x = -200; x <= W + 200; x += 24) x === -200 ? c.moveTo(x, wob(x)) : c.lineTo(x, wob(x)); c.stroke();
  // the lanterns floating on it
  for (let i = 0; i < n; i++) {
    const x = (h01(i, seed, 1) * (W + 300) - 150), yy = wob(x) - 6 - 26 * h01(i, seed, 2), on = clamp((o.glow ?? 1) * 1.4 - h01(i, seed, 3) * 0.4);
    if (on <= 0) continue;
    c.fillStyle = mixHex('#a85a28', '#ffcf7a', on); c.beginPath(); c.ellipse(x, yy, 7, 9, 0, 0, TAU); c.fill();
    c.fillStyle = `rgba(255,236,190,${0.9 * on})`; c.beginPath(); c.ellipse(x, yy + 1, 3, 4.5, 0, 0, TAU); c.fill();
    const gr = g.createRadialGradient(x, yy, 1, x, yy, 24);
    gr.addColorStop(0, `rgba(255,190,100,${0.3 * on})`); gr.addColorStop(1, 'rgba(255,150,60,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, yy, 24, 0, TAU); g.fill();
    // its light shimmering on the underside of the surface
    c.fillStyle = `rgba(255,190,110,${0.35 * on})`;
    for (let k = 0; k < 3; k++) { c.beginPath(); c.ellipse(x + 3 * Math.sin(t * 3 + i + k), y + 8 + k * 9, 9 - k * 2, 2, 0, 0, TAU); c.fill(); }
  }
}

/** Deep water at night: a dark gradient, motes drifting. */
export function nightWater(c: C2, t: number, top = '#0f2448', bottom = '#02040c') {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top); g.addColorStop(1, bottom);
  c.fillStyle = g; c.fillRect(-300, -300, W + 600, H + 600);
  for (let i = 0; i < 90; i++) {
    const px = h01(i, 41) * W, py = ((h01(i, 42) - t * 0.008 * (0.5 + h01(i, 43))) % 1 + 1) % 1;
    c.fillStyle = `rgba(170,210,255,${0.06 + 0.12 * h01(i, 45)})`; c.beginPath(); c.arc(px, py * H, 1 + 2 * h01(i, 44), 0, TAU); c.fill();
  }
}
/** A warm wash inside each pool of torchlight (the light is warm; the deep is blue). */
export function warmPools(c: C2, holes: { x: number; y: number; r: number }[], a = 0.5) {
  c.save(); c.globalCompositeOperation = 'multiply';
  for (const h of holes) {
    const gr = c.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.r);
    gr.addColorStop(0, `rgba(255,214,160,${a})`); gr.addColorStop(1, 'rgba(255,214,160,0)');
    c.fillStyle = gr; c.beginPath(); c.arc(h.x, h.y, h.r, 0, TAU); c.fill();
  }
  c.restore();
}
/** Bubbles rising in a column from (x, y). */
export function bubbleTrail(c: C2, x: number, y: number, t: number, n: number, seed: number, spread = 30, height = 400) {
  c.strokeStyle = 'rgba(210,240,255,0.65)'; c.lineWidth = 2;
  for (let i = 0; i < n; i++) {
    const u = ((t * (0.6 + 0.5 * h01(i, seed, 1)) + h01(i, seed, 2)) % 1), r = 3 + 7 * h01(i, seed, 3);
    c.beginPath(); c.arc(x + (h01(i, seed, 4) - 0.5) * spread + 8 * Math.sin(t * 3 + i), y - u * height, r * (0.6 + 0.4 * u), 0, TAU); c.stroke();
  }
}

// ------------------------------------------------------------------ the shore at night

/** The procession down to the shore (the wide): the island at night, the village with lanterns winding down the path,
 *  the pole on the divers' shoulders, canoes pushed out with torches. `pan` in px. */
export function shoreWide(c: C2, g: C2, t: number, pan: number, o: { pushed: number }) {
  const hz = H * 0.46, bch = H * 0.64;
  island(c, t, { time: 'night', horizon: hz, beach: bch, pan, show: ['huts', 'palms', 'clouds'], seed: 5 });
  // the moon's path on the sea
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 14; k++) { const yy = hz + 8 + k * ((bch - hz - 10) / 14), w = 30 + k * 14; c.fillStyle = `rgba(255,240,200,${0.18 - k * 0.009})`; c.fillRect(W * 0.78 - pan * 0.05 - w / 2 + 10 * Math.sin(t * 2 + k), yy, w, 3); }
  c.restore();
  // the canoes in the surf, pushed out, torches at their prows
  const canoes = [[W * 0.86, bch - 70, 0.42], [W * 0.72, bch - 34, 0.55], [W * 0.96, bch - 8, 0.7]] as const;
  canoes.forEach(([x0, y0, k], i) => {
    const push = ease.inOutCubic(clamp(o.pushed - i * 0.12)), x = x0 - pan * 0.9 + 180 * push, y = y0 - 20 * push + 4 * Math.sin(t * 1.5 + i);
    canoe(c, x, y, k, 0.55);
    c.fillStyle = 'rgba(20,26,70,0.55)'; c.fillRect(x - 200 * k, y + 2, 400 * k, 60 * k);   // sitting in the water
    c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 190 * k, y + 2); c.quadraticCurveTo(x, y + 8 + 3 * Math.sin(t * 3 + i), x + 190 * k, y + 2); c.stroke();
    flame(c, g, x + 150 * k, y - 60 * k, 0.8 * k, t, i);
    // the reflection of its torch
    g.fillStyle = 'rgba(255,160,70,0.18)'; g.fillRect(x + 150 * k - 4, y + 10, 8, 80 * k);
    // two silhouettes pushing at the stern
    for (let j = 0; j < 2; j++) villager(c, x - 170 * k - j * 46 * k, y + 70 * k, 230 * k, 'hands', 30 + i * 2 + j, { t, col: SIL, flip: false });
  });
  // the procession: lanterns winding down from the huts to the water
  const path = (v: number): P => ({ x: W * 0.01 + v * W * 0.2 - pan * 0.85, y: bch + 24 + 120 * v });
  for (let i = 0; i < 9; i++) {
    const v = ((i / 9 + t * 0.03) % 1), p = path(v), h = 110 + 90 * v, bob = 2.5 * Math.abs(Math.sin(t * 6 + i));
    if (i % 7 === 3) continue;
    villager(c, p.x, p.y - bob, h, i % 5 === 0 ? 'carry' : 'stand', i, { t, lantern: true, col: SIL, rim: RIM });
    lanternGlow(g, p.x, p.y - bob, h, i, t, 0.9);
  }
  return { path };
}
/** The pole on the divers' shoulders, walking down the beach (x0..x1 at ground y). */
export function poleBearers(c: C2, g: C2, t: number, x0: number, x1: number, y: number, h: number) {
  const n = 4, u = h / 100, bob = (i: number) => 3 * Math.abs(Math.sin(t * 6 + i * 1.3));
  const sy = y - 78 * u;
  for (let i = 0; i < n; i++) {
    const x = x0 + ((x1 - x0) * (i + 0.5)) / n;
    relative(c, i % 2 ? 'diver2' : 'diver1', x, y - bob(i), h, 'carry', { t, col: SIL, rim: RIM, flip: false });
  }
  pole(c, x0 - 40, sy - bob(0) - 4, x1 + 40, sy - bob(3) - 4, 12 * u / 2.2);
  // a coil of rope on the last man's shoulder
  c.strokeStyle = '#b8935a'; c.lineWidth = 3; c.beginPath(); c.ellipse(x1 - (x1 - x0) / (2 * n), sy + 14, 16, 20, 0.3, 0, TAU); c.stroke();
  void g;
}
export { rgbaHex };
