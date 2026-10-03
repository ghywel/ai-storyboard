// v2, "THE DIVER" (TREATMENT-v2.md): the shared kit, built once and frozen before the plates. The girl (a faceless
// child silhouette with a mask whose glint does the work of eyes), her mother (plait and shawl), the manta, the torch
// and the dark, the heart-lantern's circle, the ledger book with an eye, the bedroom (with the dream's flood), the
// slate, the pebble pendant with chibi Rai, and the lyric that rises into place like bubbles.
//
// Canvas2D in the 1920x1080 logical frame, y down, pure functions of t. Functions take the main layer `c` and, where
// they glow, the additive layer `g`.
import { W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import { clamp, ease } from '../../engine/util';
import { Lyrics, type Line } from '../../engine/lyrics';
import { drawRai, h01, type RaiOpts } from '../_rai';
import { FAM, TAU, rgbaHex, mixHex, person, emote, type Pose, type Emote } from '../_motifs';

type C2 = CanvasRenderingContext2D;
type P = { x: number; y: number };

// ------------------------------------------------------------------ the girl

/** Joint angles (radians). Limb angles are measured from the body's "down" (towards the feet), positive forward. */
export interface GirlPose {
  rot: number;                 // the body's rotation: 0 upright, +PI/2 head pointing the way she faces (swimming)
  hip: [number, number];       // thighs [back leg, front leg]
  knee: [number, number];      // knee bends (negative folds the shin back)
  sh: [number, number];        // upper arms [back arm, front arm]; PI points along the body over the head
  el: [number, number];        // elbow bends (positive folds the forearm forward)
  head?: number;               // head tilt
  drop?: number;               // pelvis lowered (kneeling, sitting), in h/100
}
const PI = Math.PI;
export const GIRL_POSES: Record<string, (t: number) => GirlPose> = {
  stand: (t) => ({ rot: 0, hip: [-0.07, 0.07], knee: [0, 0], sh: [-0.42, 0.5 + 0.03 * Math.sin(t * 2)], el: [-0.15, 0.35] }),
  wave: (t) => ({ rot: 0, hip: [-0.05, 0.05], knee: [0, 0], sh: [-0.12, 2.6 + 0.25 * Math.sin(t * 9)], el: [0.15, 0.5] }),
  run: (t) => ({ rot: 0.12, hip: [0.7 * Math.sin(t * 9), -0.7 * Math.sin(t * 9)], knee: [-0.5 - 0.4 * Math.cos(t * 9), -0.5 + 0.4 * Math.cos(t * 9)], sh: [-0.7 * Math.sin(t * 9), 0.7 * Math.sin(t * 9)], el: [1.2, 1.2] }),
  swim: (t) => ({ rot: PI / 2 - 0.12, hip: [0.22 * Math.sin(t * 8), -0.22 * Math.sin(t * 8)], knee: [-0.25 - 0.15 * Math.sin(t * 8), -0.25 + 0.15 * Math.sin(t * 8)], sh: [PI - 0.7 + 0.6 * Math.sin(t * 3), 1.6 - 0.6 * Math.sin(t * 3)], el: [0.3, 0.5], head: -0.25 }),
  glide: (t) => ({ rot: PI / 2 - 0.08, hip: [0.08 * Math.sin(t * 5), -0.08 * Math.sin(t * 5)], knee: [-0.1, -0.1], sh: [PI - 0.42, PI - 0.22], el: [0.08, 0.05], head: -0.2 }),
  torch: (t) => ({ rot: PI / 2 - 0.35, hip: [0.2 * Math.sin(t * 6), -0.2 * Math.sin(t * 6)], knee: [-0.3, -0.3], sh: [0.4, 2.0], el: [0.6, 0.15], head: -0.15 }),
  float: (t) => ({ rot: 0.05 * Math.sin(t * 1.5), hip: [0.3 * Math.sin(t * 4), -0.3 * Math.sin(t * 4)], knee: [-0.5, -0.4], sh: [-1.2 - 0.3 * Math.sin(t * 3), 1.2 + 0.3 * Math.sin(t * 3)], el: [-0.4, 0.4] }),
  kneel: (t) => ({ rot: 0, hip: [0, 0.05], knee: [-PI / 2, -PI / 2], sh: [-0.1, 0.25 + 0.03 * Math.sin(t * 2)], el: [0.4, 0.6], drop: 18 }),
  reach: (t) => ({ rot: 0.15, hip: [0, 0.05], knee: [-PI / 2, -PI / 2], sh: [-0.2, 1.45 + 0.04 * Math.sin(t * 2)], el: [0.4, 0.1], drop: 18, head: 0.1 }),
  hug: (t) => ({ rot: -0.15, hip: [1.9, 2.0], knee: [-2.5, -2.6], sh: [1.1, 1.2 + 0.02 * Math.sin(t)], el: [0.9, 0.9], drop: 34, head: 0.25 }),
  ride: (t) => ({ rot: 0.05 * Math.sin(t * 2), hip: [PI / 2 - 0.1, PI / 2], knee: [-1.3, -1.2], sh: [0.4, 2.5 + 0.2 * Math.sin(t * 6)], el: [0.3, 0.4], drop: 24 }),
  lie: () => ({ rot: -PI / 2, hip: [0, 0.05], knee: [0, 0], sh: [0.1, 0.15], el: [0.1, 0.1] }),
  sit: (t) => ({ rot: 0, hip: [PI / 2, PI / 2 - 0.05], knee: [-PI / 2, -PI / 2 + 0.1], sh: [0.2, 0.35 + 0.03 * Math.sin(t * 2)], el: [0.6, 0.7], drop: 24 }),
  cheer: (t) => ({ rot: 0, hip: [-0.1, 0.1], knee: [0, 0], sh: [-2.6 - 0.15 * Math.sin(t * 9), 2.6 + 0.15 * Math.sin(t * 9)], el: [-0.3, 0.3] }),
};

export interface GirlOpts {
  t: number;
  col?: string;
  flip?: boolean;              // face left
  /** the mask: on the face (under water), pushed up on the forehead, or none */
  mask?: 'on' | 'up' | 'none';
  /** the mask's glint, which does the work of eyes: 'spark' (delight), 'droop' (sad), 'wide' (surprise), plain */
  glint?: 'plain' | 'spark' | 'droop' | 'wide';
  fins?: boolean;
  snorkel?: boolean;
  torch?: boolean;             // a torch in the front hand (aim it with the pose)
  slate?: boolean;             // the slate hanging at her hip on its cord
  pendant?: boolean;           // the pebble pendant at her chest
  underwater?: boolean;        // her ponytail floats
  grown?: boolean;             // the bride, years later (taller, a flower in her hair, no gear)
  rim?: string;                // a rim light along her back, for readability
  /** her one colour: a yellow swimsuit under water, a yellow tee on land (default), or none */
  outfit?: 'swim' | 'tee' | 'none';
  outfitCol?: string;
  emote?: Emote;
  emoteT0?: number;
  blend?: { from: GirlPose; u: number };
}
export interface GirlAnchors { head: P; chest: P; pelvis: P; hands: [P, P]; feet: [P, P]; torch?: { x: number; y: number; ang: number }; pendant?: P }

const mixPose = (a: GirlPose, b: GirlPose, u: number): GirlPose => {
  const m = (x: number, y: number) => x + (y - x) * u;
  const m2 = (x: [number, number], y: [number, number]): [number, number] => [m(x[0], y[0]), m(x[1], y[1])];
  return { rot: m(a.rot, b.rot), hip: m2(a.hip, b.hip), knee: m2(a.knee, b.knee), sh: m2(a.sh, b.sh), el: m2(a.el, b.el), head: m(a.head ?? 0, b.head ?? 0), drop: m(a.drop ?? 0, b.drop ?? 0) };
};

/**
 * The girl, `h` her standing height, (x, y) the point under her (her feet on the ground when upright; the middle of
 * her body when swimming). `pose` is a preset name or a GirlPose. Returns anchors for her torch, hands, head.
 */
export function girl(c: C2, x: number, y: number, h: number, pose: string | GirlPose, o: GirlOpts): GirlAnchors {
  const t = o.t, u = h / 100, col = o.col ?? '#0d0a18', f = o.flip ? -1 : 1;
  let p = typeof pose === 'string' ? (GIRL_POSES[pose] ?? GIRL_POSES.stand!)(t) : pose;
  if (o.blend) p = mixPose(o.blend.from, p, o.blend.u);
  const grown = !!o.grown;
  const L = grown ? { thigh: 23, shin: 23, torso: 33, upper: 16, fore: 15, head: 8.5, neck: 4 } : { thigh: 19, shin: 18, torso: 29, upper: 16, fore: 15, head: 10, neck: 3 };
  // the pelvis: upright on the ground, or the body's centre when horizontal
  const upright = Math.abs(p.rot) < 0.8;
  const pel: P = upright ? { x, y: y - (L.thigh + L.shin) * u + (p.drop ?? 0) * u } : { x, y };
  // the body's axes: up (to the head) and forward
  const up: P = { x: Math.sin(p.rot) * f, y: -Math.cos(p.rot) };
  const fw: P = { x: Math.cos(p.rot) * f, y: Math.sin(p.rot) };
  const dir = (a: number): P => ({ x: -up.x * Math.cos(a) + fw.x * Math.sin(a), y: -up.y * Math.cos(a) + fw.y * Math.sin(a) });   // angle from "down", + forward
  const add = (a: P, d: P, k: number): P => ({ x: a.x + d.x * k * u, y: a.y + d.y * k * u });
  const neck = add(pel, up, L.torso), head = add(neck, up, L.neck + L.head);
  const shoulder = add(neck, up, -3);
  const limb = (root: P, a1: number, a2: number, l1: number, l2: number) => { const j = add(root, dir(a1), l1); return [j, add(j, dir(a1 + a2), l2)] as [P, P]; };
  const legs = [0, 1].map((i) => limb(pel, p.hip[i as 0 | 1], p.knee[i as 0 | 1], L.thigh, L.shin));
  const arms = [0, 1].map((i) => limb(shoulder, p.sh[i as 0 | 1], p.el[i as 0 | 1], L.upper, L.fore));
  const line = (pts: P[], w: number, cc = col) => { c.strokeStyle = cc; c.lineWidth = w * u; c.beginPath(); c.moveTo(pts[0]!.x, pts[0]!.y); for (const q of pts.slice(1)) c.lineTo(q.x, q.y); c.stroke(); };
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.fillStyle = col;
  // the back limbs first, a shade lighter so the pose reads
  const back = mixHex(col, '#3a3550', 0.25);
  line([pel, legs[0]![0], legs[0]![1]], 7.5, back);
  line([shoulder, arms[0]![0], arms[0]![1]], 5.5, back);
  if (o.fins) fin(c, legs[0]![1], dir(p.hip[0] + p.knee[0]), u, back, t, 0);
  // the hair: under water a ponytail streaming up and back; on land a short tail behind the head; grown, a bun
  const tb = add(add(head, fw, -L.head * 0.85), up, L.head * 0.2);
  c.strokeStyle = col; c.fillStyle = col;
  if (grown) { c.beginPath(); c.arc(tb.x, tb.y, L.head * 0.55 * u, 0, TAU); c.fill(); }
  else if (o.underwater) {
    const sway = 5 * Math.sin(t * 2.4), d: P = { x: -up.x * 0.85 - fw.x * 0.35, y: -up.y * 0.85 - fw.y * 0.35 };
    c.lineWidth = 5 * u; c.beginPath(); c.moveTo(tb.x, tb.y);
    c.quadraticCurveTo(tb.x + d.x * 12 * u + sway * u * 0.3, tb.y + d.y * 12 * u, tb.x + d.x * 20 * u + sway * u, tb.y + d.y * 20 * u + sway * 0.5 * u); c.stroke();
  } else {
    c.lineWidth = 4.5 * u; c.beginPath(); c.moveTo(tb.x, tb.y);
    c.quadraticCurveTo(tb.x - fw.x * 6 * u, tb.y + 4 * u, tb.x - fw.x * 5 * u + Math.sin(t * 2) * 0.6 * u, tb.y + 11 * u); c.stroke();
  }
  // torso: a rounded tapered shape
  c.fillStyle = col;
  const sideA = (q: P, k: number): P => ({ x: q.x + fw.x * k * u, y: q.y + fw.y * k * u });
  c.beginPath();
  const a1 = sideA(pel, -7.5), a2 = sideA(shoulder, -7), b2 = sideA(shoulder, 7), b1 = sideA(pel, 7.5);
  c.moveTo(a1.x, a1.y); c.quadraticCurveTo(sideA(add(pel, up, L.torso * 0.5), -9).x, sideA(add(pel, up, L.torso * 0.5), -9).y, a2.x, a2.y);
  c.lineTo(b2.x, b2.y); c.quadraticCurveTo(sideA(add(pel, up, L.torso * 0.5), 8).x, sideA(add(pel, up, L.torso * 0.5), 8).y, b1.x, b1.y); c.closePath(); c.fill();
  const outfit = o.outfit ?? (grown ? 'none' : o.underwater ? 'swim' : 'tee');
  if (outfit !== 'none') {
    const top = outfit === 'tee' ? shoulder : add(neck, up, -6), bot = outfit === 'tee' ? add(pel, up, 4) : add(pel, up, -2);
    c.fillStyle = o.outfitCol ?? HEX.yellow;
    c.beginPath();
    const q1 = sideA(top, -7.6), q2 = sideA(top, 7.4), q3 = sideA(bot, 7.6), q4 = sideA(bot, -7.6);
    c.moveTo(q1.x, q1.y); c.lineTo(q2.x, q2.y); c.lineTo(q3.x, q3.y); c.lineTo(q4.x, q4.y); c.closePath(); c.fill();
    if (outfit === 'tee') { // the sleeves
      for (const a of arms) { const e = { x: shoulder.x + (a[0].x - shoulder.x) * 0.45, y: shoulder.y + (a[0].y - shoulder.y) * 0.45 }; c.strokeStyle = o.outfitCol ?? HEX.yellow; c.lineWidth = 8 * u; c.beginPath(); c.moveTo(shoulder.x, shoulder.y); c.lineTo(e.x, e.y); c.stroke(); }
    }
  }
  if (grown) { // a white dress: a flared skirt from the waist (a bride), over the legs
    const w0 = add(pel, up, 6);
    c.fillStyle = '#f4efe6';
    c.beginPath(); c.moveTo(sideA(w0, -8).x, sideA(w0, -8).y); c.lineTo(sideA(add(pel, up, -L.thigh * 1.6), -16).x, sideA(add(pel, up, -L.thigh * 1.6), -16).y);
    c.lineTo(sideA(add(pel, up, -L.thigh * 1.6), 16).x, sideA(add(pel, up, -L.thigh * 1.6), 16).y); c.lineTo(sideA(w0, 8).x, sideA(w0, 8).y); c.closePath(); c.fill();
  }
  // head
  c.fillStyle = col;
  c.beginPath(); c.arc(head.x, head.y, L.head * u, 0, TAU); c.fill();
  // the front limbs
  line([pel, legs[1]![0], legs[1]![1]], 7.5);
  if (o.fins) fin(c, legs[1]![1], dir(p.hip[1] + p.knee[1]), u, col, t, 1);
  line([shoulder, arms[1]![0], arms[1]![1]], 5.5);
  c.fillStyle = col;
  for (const a of arms) { c.beginPath(); c.arc(a[1].x, a[1].y, 3.4 * u, 0, TAU); c.fill(); }
  // the snorkel and the mask
  const mask = o.mask ?? (o.underwater ? 'on' : 'none');
  if (o.snorkel !== false && mask === 'on') {
    const s0 = add(head, up, 2), s1 = add(s0, up, 12);
    c.strokeStyle = HEX.coral; c.lineWidth = 2.6 * u; c.beginPath();
    c.moveTo(sideA(s0, -L.head * 0.9).x, sideA(s0, -L.head * 0.9).y); c.lineTo(sideA(s1, -L.head * 0.9).x, sideA(s1, -L.head * 0.9).y); c.stroke();
  }
  if (mask !== 'none') {
    const mc = mask === 'on' ? add(head, fw, L.head * 0.55) : add(head, up, L.head * 0.75);
    const ang = Math.atan2(fw.y, fw.x);
    c.save(); c.translate(mc.x, mc.y); c.rotate(ang + (mask === 'up' ? -0.3 * f : 0));
    // the strap
    c.strokeStyle = HEX.coral; c.lineWidth = 1.6 * u;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(-L.head * 1.5 * u, -1 * u); c.stroke();
    // the lens: dark glass with a coral frame
    c.fillStyle = HEX.coral; c.beginPath(); c.roundRect(-3 * u, -6.4 * u, 9 * u, 12.8 * u, 3 * u); c.fill();
    const lg = c.createLinearGradient(0, -5 * u, 0, 5 * u);
    lg.addColorStop(0, '#2c4f7a'); lg.addColorStop(1, '#0a1428');
    c.fillStyle = lg; c.beginPath(); c.roundRect(-1.6 * u, -5 * u, 6.6 * u, 10 * u, 2.4 * u); c.fill();
    // the glint: her eyes, in effect
    const gl = o.glint ?? 'plain';
    c.fillStyle = 'rgba(235,250,255,0.95)'; c.strokeStyle = 'rgba(235,250,255,0.95)'; c.lineWidth = 1.1 * u;
    if (gl === 'spark') {
      for (const [dx, dy, s] of [[1.2, -2, 1.6], [3.2, 1.4, 1.0]] as const) { c.beginPath(); const k = s * u * (1 + 0.25 * Math.sin(t * 9)); c.moveTo(dx * u, dy * u - k); c.lineTo(dx * u + k * 0.3, dy * u); c.lineTo(dx * u, dy * u + k); c.lineTo(dx * u - k * 0.3, dy * u); c.closePath(); c.fill(); c.beginPath(); c.moveTo(dx * u - k, dy * u); c.lineTo(dx * u + k, dy * u); c.stroke(); }
    } else if (gl === 'droop') {
      c.beginPath(); c.moveTo(0, -1 * u); c.quadraticCurveTo(1.7 * u, 1.5 * u, 3.6 * u, 2.6 * u); c.stroke();
    } else if (gl === 'wide') {
      c.beginPath(); c.arc(1.7 * u, -0.5 * u, 2.2 * u, 0, TAU); c.stroke();
    } else {
      c.beginPath(); c.moveTo(0.2 * u, -3.6 * u); c.lineTo(2.6 * u, -0.4 * u); c.stroke();
    }
    c.restore();
  }
  if (grown) { // a bodice over the white dress, a bouquet at her front hand, a flower in her hair
    c.fillStyle = '#f4efe6';
    c.beginPath(); c.moveTo(sideA(shoulder, -6).x, sideA(shoulder, -6).y); c.lineTo(sideA(shoulder, 6).x, sideA(shoulder, 6).y);
    c.lineTo(sideA(add(pel, up, 6), 7).x, sideA(add(pel, up, 6), 7).y); c.lineTo(sideA(add(pel, up, 6), -7).x, sideA(add(pel, up, 6), -7).y); c.closePath(); c.fill();
    const hb = arms[1]![1];
    for (let k = 0; k < 7; k++) { const a = (k / 7) * TAU; c.fillStyle = [HEX.pink, HEX.yellow, '#fff3f7', HEX.coral][k % 4]!; c.beginPath(); c.arc(hb.x + Math.cos(a) * 3.5 * u, hb.y + Math.sin(a) * 3.5 * u - 2 * u, 2.6 * u, 0, TAU); c.fill(); }
    c.fillStyle = HEX.lime; c.beginPath(); c.arc(hb.x, hb.y + 2 * u, 2 * u, 0, TAU); c.fill();
  }
  if (grown) { // a flower in her hair
    const fl = add(sideA(head, -L.head * 0.6), up, L.head * 0.6);
    for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU + 0.3; c.fillStyle = '#fff3f7'; c.beginPath(); c.arc(fl.x + Math.cos(a) * 2.6 * u, fl.y + Math.sin(a) * 2.6 * u, 2.1 * u, 0, TAU); c.fill(); }
    c.fillStyle = HEX.yellow; c.beginPath(); c.arc(fl.x, fl.y, 1.5 * u, 0, TAU); c.fill();
  }
  // the torch in the front hand
  let torch: GirlAnchors['torch'];
  const hand = arms[1]![1], fd = dir(p.sh[1] + p.el[1]);
  if (o.torch) {
    const tip = { x: hand.x + fd.x * 8 * u, y: hand.y + fd.y * 8 * u };
    c.strokeStyle = '#e8e2d0'; c.lineWidth = 4.2 * u; c.beginPath(); c.moveTo(hand.x - fd.x * 2 * u, hand.y - fd.y * 2 * u); c.lineTo(tip.x, tip.y); c.stroke();
    c.fillStyle = '#fff6c8'; c.beginPath(); c.arc(tip.x, tip.y, 2.4 * u, 0, TAU); c.fill();
    torch = { x: tip.x, y: tip.y, ang: Math.atan2(fd.y, fd.x) };
  }
  // the slate at her hip, the pendant at her chest
  const chest = add(neck, up, -8);
  if (o.slate) {
    const sp = sideA(add(pel, up, 2), 6);
    c.strokeStyle = 'rgba(240,240,240,0.7)'; c.lineWidth = 0.8 * u; c.beginPath(); c.moveTo(sp.x, sp.y); c.lineTo(sp.x + 2 * u, sp.y + 8 * u); c.stroke();
    c.fillStyle = '#eef2f2'; c.save(); c.translate(sp.x + 2 * u, sp.y + 12 * u); c.rotate(p.rot * f * 0.5); c.fillRect(-4 * u, -4 * u, 8 * u, 10 * u); c.restore();
  }
  let pend: P | undefined;
  if (o.pendant) {
    pend = sideA(chest, 4);
    c.strokeStyle = '#c9a24a'; c.lineWidth = 0.8 * u;
    c.beginPath(); c.moveTo(sideA(neck, -3).x, sideA(neck, -3).y); c.lineTo(pend.x, pend.y); c.stroke();
    c.fillStyle = HEX.stone; c.beginPath(); c.arc(pend.x, pend.y, 3 * u, 0, TAU); c.arc(pend.x, pend.y, 1.1 * u, 0, TAU, true); c.fill();
  }
  if (o.rim) {
    c.strokeStyle = o.rim; c.globalAlpha = 0.85; c.lineWidth = 1.6 * u;
    c.beginPath(); c.arc(head.x, head.y, L.head * u, Math.atan2(-fw.y, -fw.x) - 1.2, Math.atan2(-fw.y, -fw.x) + 1.2); c.stroke();
    c.beginPath(); c.moveTo(a1.x, a1.y); c.lineTo(a2.x, a2.y); c.stroke();
    c.globalAlpha = 1;
  }
  if (o.emote) emote(c, head.x, head.y, L.head * u * 1.4, o.emote, t, o.emoteT0 ?? -1e9);
  c.restore();
  return { head, chest, pelvis: pel, hands: [arms[0]![1], arms[1]![1]], feet: [legs[0]![1], legs[1]![1]], torch, pendant: pend };
}

function fin(c: C2, foot: P, d: P, u: number, col: string, t: number, i: number) {
  const k = 1 + 0.15 * Math.sin(t * 8 + i * PI);
  const n: P = { x: -d.y, y: d.x };
  c.fillStyle = mixHex(col, HEX.coral, 0.55);
  c.beginPath(); c.moveTo(foot.x - n.x * 2 * u, foot.y - n.y * 2 * u);
  c.lineTo(foot.x + d.x * 16 * u * k - n.x * 6 * u, foot.y + d.y * 16 * u * k - n.y * 6 * u);
  c.lineTo(foot.x + d.x * 18 * u * k + n.x * 5 * u, foot.y + d.y * 18 * u * k + n.y * 5 * u);
  c.lineTo(foot.x + n.x * 2 * u, foot.y + n.y * 2 * u); c.closePath(); c.fill();
}

// ------------------------------------------------------------------ the mother

/**
 * The mother: a faceless person() with a long plait down her back and a shawl over her shoulders (not v1's woman: a
 * different person, a different look). `old` (the wedding, years later) adds a walking stick and a stoop.
 */
export function mother(c: C2, x: number, y: number, h: number, pose: Pose = 'stand', o: { col?: string; flip?: boolean; t?: number; old?: boolean; rim?: string; emote?: Emote; emoteT0?: number; headTilt?: number; shawl?: string } = {}) {
  const col = o.col ?? '#120d1d', u = h / 100, f = o.flip ? -1 : 1, t = o.t ?? 0;
  const slump = pose === 'slump' || pose === 'face' || o.old ? 1 : 0, seated = pose === 'seated';
  const shY = (seated ? -76 : -78) + slump * 6, hx = x + f * slump * 10.4 * u, hy = y + (shY - 10 + slump * 5) * u;
  // the plait, behind
  c.save(); c.strokeStyle = col; c.lineWidth = 4 * u; c.lineCap = 'round';
  c.beginPath(); c.moveTo(hx - f * 7 * u, hy); c.quadraticCurveTo(hx - f * 12 * u, hy + 16 * u, hx - f * 9 * u + Math.sin(t * 1.3) * u, hy + 34 * u); c.stroke();
  c.restore();
  person(c, x, y, h, o.old && pose === 'stand' ? 'slump' : pose, { col, flip: o.flip, t, rim: o.rim, emote: o.emote, emoteT0: o.emoteT0, headTilt: o.headTilt, seed: 7 });
  // the shawl: a drape over the shoulders and down the back
  c.save(); c.fillStyle = o.shawl ?? mixHex(col, HEX.violet, 0.35);
  const sx = x + f * slump * 8 * u, sy = y + shY * u;
  c.beginPath(); c.moveTo(sx - 13 * u, sy + 3 * u); c.quadraticCurveTo(sx, sy - 6 * u, sx + 13 * u, sy + 3 * u);
  c.lineTo(sx + 11 * u, sy + 22 * u); c.quadraticCurveTo(sx, sy + 30 * u, sx - 11 * u, sy + 22 * u); c.closePath(); c.fill();
  c.restore();
  if (o.old) { // the walking stick
    c.save(); c.strokeStyle = '#6a4a2c'; c.lineWidth = 2.4 * u; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x + f * 20 * u, y - 46 * u); c.lineTo(x + f * 24 * u, y); c.stroke();
    c.beginPath(); c.arc(x + f * 17 * u, y - 46 * u, 3 * u, PI, TAU); c.stroke();
    c.restore();
  }
}

// ------------------------------------------------------------------ light and dark under water

/** The torch's beam from (x, y) along `ang`: a warm cone on the glow layer and a lit pool at its end. */
export function torchBeam(g: C2, x: number, y: number, ang: number, len: number, spread = 0.22, a = 1) {
  const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len, w = Math.tan(spread) * len;
  const nx = -Math.sin(ang), ny = Math.cos(ang);
  const gr = g.createLinearGradient(x, y, ex, ey);
  gr.addColorStop(0, rgbaHex('#fff1b8', 0.55 * a)); gr.addColorStop(1, rgbaHex('#ffd27a', 0.08 * a));
  g.fillStyle = gr;
  g.beginPath(); g.moveTo(x, y); g.lineTo(ex + nx * w, ey + ny * w); g.lineTo(ex - nx * w, ey - ny * w); g.closePath(); g.fill();
}
/** Where the torch's beam lands: the circle the darkness leaves open. */
export function beamSpot(x: number, y: number, ang: number, len: number, spread = 0.22) {
  return { x: x + Math.cos(ang) * len, y: y + Math.sin(ang) * len, r: Math.tan(spread) * len * 1.15 };
}
/**
 * The dark of the deep at night: everything dimmed to `a` except soft-edged holes of light (the torch's pool, a
 * heart-glow). Draw after the scene, before the glow layer.
 */
export function darkness(c: C2, a: number, holes: { x: number; y: number; r: number; soft?: number }[], col = '#03050f') {
  c.save();
  c.fillStyle = rgbaHex(col, a);
  c.beginPath(); c.rect(-W, -H, W * 3, H * 3);
  for (const h of holes) { c.moveTo(h.x + h.r, h.y); c.arc(h.x, h.y, h.r, 0, TAU, true); }
  c.fill();
  for (const h of holes) { // a feathered edge
    const s = h.soft ?? 0.35, gr = c.createRadialGradient(h.x, h.y, h.r * (1 - s), h.x, h.y, h.r);
    gr.addColorStop(0, rgbaHex(col, 0)); gr.addColorStop(1, rgbaHex(col, a));
    c.fillStyle = gr; c.beginPath(); c.arc(h.x, h.y, h.r, 0, TAU); c.fill();
  }
  c.restore();
}

// ------------------------------------------------------------------ the heart-lantern

/**
 * Rai's heart throws a circle of warm light onto the dark water, like a magic lantern: a beam from her heart (hx, hy)
 * to a circle at (cx, cy) radius r. `draw` paints an ordinary full 1920x1080 frame (an island, a storm...); it is
 * fitted so the frame's height fills the circle, graded warm and flickering. `on` 0..1 opens the circle.
 */
export function heartLantern(c: C2, g: C2, hx: number, hy: number, cx: number, cy: number, r: number, t: number, on: number, draw: (c: C2) => void) {
  if (on <= 0) return;
  const rr = r * ease.outBack(clamp(on));
  const flick = 0.92 + 0.08 * Math.sin(t * 23) * Math.sin(t * 7.1);
  // the beam
  const bg = g.createLinearGradient(hx, hy, cx, cy);
  bg.addColorStop(0, rgbaHex(HEX.gold, 0.5 * on)); bg.addColorStop(1, rgbaHex(HEX.gold, 0.06 * on));
  g.fillStyle = bg;
  const ang = Math.atan2(cy - hy, cx - hx), nx = -Math.sin(ang), ny = Math.cos(ang);
  g.beginPath(); g.moveTo(hx + nx * 8, hy + ny * 8); g.lineTo(cx + nx * rr, cy + ny * rr); g.lineTo(cx - nx * rr, cy - ny * rr); g.lineTo(hx - nx * 8, hy - ny * 8); g.closePath(); g.fill();
  // the picture
  c.save();
  c.beginPath(); c.arc(cx, cy, rr, 0, TAU); c.clip();
  c.save();   // the picture is a full 1920x1080 frame, fitted so its height fills the circle (the sides are cropped)
  const k = (2 * rr) / H;
  c.translate(cx, cy); c.scale(k, k); c.translate(-W / 2, -H / 2);
  draw(c);
  c.restore();
  c.globalCompositeOperation = 'multiply';
  c.fillStyle = mixHex('#ffffff', '#ffc870', 0.45); c.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
  c.globalCompositeOperation = 'source-over';
  const vg = c.createRadialGradient(cx, cy, rr * 0.55, cx, cy, rr);
  vg.addColorStop(0, 'rgba(20,8,0,0)'); vg.addColorStop(1, `rgba(20,8,0,${0.65 * flick})`);
  c.fillStyle = vg; c.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
  c.restore();
  // its rim glows
  g.strokeStyle = rgbaHex(HEX.gold, 0.5 * on * flick); g.lineWidth = 10;
  g.beginPath(); g.arc(cx, cy, rr, 0, TAU); g.stroke();
}

// ------------------------------------------------------------------ the manta

/** A giant manta ray seen from above and behind, banking by `bank` (-1..1), wings beating on `beat` (phase). */
export function manta(c: C2, g: C2, x: number, y: number, s: number, t: number, o: { bank?: number; beat?: number; col?: string } = {}) {
  const flap = Math.sin(o.beat ?? t * 3), bank = o.bank ?? 0, col = o.col ?? '#1d2a4a';
  c.save(); c.translate(x, y); c.rotate(bank * 0.35); c.scale(s, s);
  // the tail
  c.strokeStyle = col; c.lineWidth = 5; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, 60); c.quadraticCurveTo(10 * Math.sin(t * 2), 160, -20 * Math.sin(t * 1.6), 260); c.stroke();
  // the wings
  for (const side of [-1, 1]) {
    const tipY = -10 - 70 * flap * side * (1 + 0.3 * bank * side) * 0.5 - 40 * flap;
    c.fillStyle = col;
    c.beginPath(); c.moveTo(0, -60);
    c.quadraticCurveTo(side * 160, -70 + tipY * 0.3, side * 300, tipY);
    c.quadraticCurveTo(side * 180, 40, 0, 70); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(200,230,255,0.35)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(side * 30, -50); c.quadraticCurveTo(side * 160, -60 + tipY * 0.3, side * 296, tipY); c.stroke();
  }
  // the body ridge and the cephalic fins
  c.fillStyle = mixHex(col, '#000000', 0.3); c.beginPath(); c.ellipse(0, 0, 40, 70, 0, 0, TAU); c.fill();
  c.fillStyle = col;
  for (const side of [-1, 1]) { c.beginPath(); c.ellipse(side * 34, -72, 10, 26, side * 0.4, 0, TAU); c.fill(); }
  // pale spots on the back
  c.fillStyle = 'rgba(230,240,255,0.25)';
  for (let k = 0; k < 6; k++) { c.beginPath(); c.arc((h01(k, 3) - 0.5) * 120, (h01(k, 4) - 0.5) * 60, 6 + 6 * h01(k, 5), 0, TAU); c.fill(); }
  c.restore();
  void g;
}

// ------------------------------------------------------------------ the ledger book

export interface BookOpts {
  /** 0 closed (its cover showing) .. 1 open (the spread showing) */
  open?: number;
  /** the eye on the cover: 0 shut .. 1 open; `look` -1..1; `blink` 0..1 (lid down) */
  eye?: number;
  look?: number;
  blink?: number;
  /** on the open spread: the 0 being written (0..1 of its stroke), the minus (0..1), the blot over the minus (0..1) */
  zero?: number;
  minus?: number;
  blot?: number;
  /** the 0 lifting off the page (the dream), 0..1 */
  lift?: number;
}
/** The old ledger book, a creature: a bound account book with an eye on its cover; open, it writes. (x, y) is its centre. */
export function ledgerBook(c: C2, g: C2, x: number, y: number, s: number, t: number, o: BookOpts = {}) {
  const open = clamp(o.open ?? 0);
  c.save(); c.translate(x, y); c.scale(s, s);
  if (open < 0.5) {
    // closed, its cover: squashes horizontally as it starts to open
    const k = 1 - open * 2;
    c.save(); c.scale(Math.max(0.05, k), 1);
    c.fillStyle = '#d9cfb8'; c.fillRect(-92, -122, 190, 248);     // page block
    c.fillStyle = '#20402e'; c.beginPath(); c.roundRect(-100, -128, 200, 256, 10); c.fill();
    c.strokeStyle = '#c9a24a'; c.lineWidth = 4; c.strokeRect(-84, -112, 168, 224);
    c.fillStyle = '#c9a24a';
    for (const [cx, cy] of [[-100, -128], [100, -128], [-100, 128], [100, 128]]) { c.beginPath(); c.moveTo(cx!, cy!); c.lineTo(cx! - Math.sign(cx!) * 30, cy!); c.lineTo(cx!, cy! - Math.sign(cy!) * 30); c.closePath(); c.fill(); }
    c.font = font(FAM.monoB(), 26); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('LEDGER', 0, -78);
    // the eye
    const eo = clamp(o.eye ?? 0) * (1 - clamp(o.blink ?? 0));
    c.fillStyle = '#132a1e'; c.beginPath(); c.ellipse(0, 12, 62, 34, 0, 0, TAU); c.fill();
    if (eo > 0.02) {
      c.save(); c.beginPath(); c.ellipse(0, 12, 58, 30 * eo, 0, 0, TAU); c.clip();
      c.fillStyle = '#f4efe0'; c.fillRect(-60, -30, 120, 90);
      const lx = 26 * (o.look ?? 0);
      c.fillStyle = '#6a4ac0'; c.beginPath(); c.arc(lx, 12, 22, 0, TAU); c.fill();
      c.fillStyle = '#0a0612'; c.beginPath(); c.arc(lx, 12, 10, 0, TAU); c.fill();
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(lx - 7, 5, 5, 0, TAU); c.fill();
      c.restore();
      g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = rgbaHex(HEX.violet, 0.22 * eo); g.beginPath(); g.ellipse(0, 12, 70, 40, 0, 0, TAU); g.fill(); g.restore();
    }
    // the lid line, heavy and bureaucratic
    c.strokeStyle = '#c9a24a'; c.lineWidth = 5; c.beginPath(); c.ellipse(0, 12, 62, 34 * Math.max(0.15, eo), 0, PI, TAU); c.stroke();
    c.restore();
  } else {
    // open: the spread with ruled columns, and what the nib writes
    const k = (open - 0.5) * 2;
    c.save(); c.scale(Math.max(0.05, k), 1);
    c.fillStyle = '#20402e'; c.beginPath(); c.roundRect(-210, -134, 420, 268, 10); c.fill();
    for (const side of [-1, 1]) {
      c.fillStyle = '#efe6cc'; c.beginPath(); c.moveTo(0, -126); c.quadraticCurveTo(side * 100, -136, side * 200, -124); c.lineTo(side * 200, 126); c.quadraticCurveTo(side * 100, 118, 0, 126); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(80,120,170,0.45)'; c.lineWidth = 1.5;
      for (let r = -100; r <= 110; r += 18) { c.beginPath(); c.moveTo(side * 12, r); c.lineTo(side * 192, r); c.stroke(); }
      c.strokeStyle = 'rgba(200,60,60,0.5)';
      for (const col of [60, 130]) { c.beginPath(); c.moveTo(side * col, -116); c.lineTo(side * col, 118); c.stroke(); }
    }
    c.fillStyle = 'rgba(40,40,60,0.55)'; c.font = font(FAM.mono(), 13); c.textAlign = 'left';
    ['FARE 2.10', 'WAGES 410.00', 'FUEL 38.50', 'RENT 600.00', 'TAX 81.20'].forEach((r, i) => c.fillText(r, -186, -84 + i * 18));
    c.restore();
    // the 0, written in pink ink by the nib on the right page (it can lift off as a ring)
    const z = clamp(o.zero ?? 0), lift = clamp(o.lift ?? 0);
    if (z > 0 && k > 0.6) {
      const zx = 100, zy = 4 - lift * 300, zr = 48 + lift * 30;
      c.save(); c.strokeStyle = HEX.pink; c.lineWidth = 12; c.lineCap = 'round'; c.globalAlpha = 1 - lift * 0.3;
      c.beginPath(); c.ellipse(zx, zy, zr * 0.72, zr, 0, -PI / 2, -PI / 2 + TAU * z); c.stroke(); c.restore();
      g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = rgbaHex(HEX.pink, 0.5 * z); g.lineWidth = 22;
      g.beginPath(); g.ellipse(zx, zy, zr * 0.72, zr, 0, -PI / 2, -PI / 2 + TAU * z); g.stroke(); g.restore();
      if (z < 1) nib(c, zx + Math.cos(-PI / 2 + TAU * z) * zr * 0.72, zy + Math.sin(-PI / 2 + TAU * z) * zr);
    }
    const m = clamp(o.minus ?? 0), bl = clamp(o.blot ?? 0);
    if (m > 0 && k > 0.6) {
      c.strokeStyle = HEX.pink; c.lineWidth = 10; c.lineCap = 'round';
      c.beginPath(); c.moveTo(18, 4); c.lineTo(18 + 30 * m, 4); c.stroke();
      if (m < 1 && bl === 0) nib(c, 18 + 30 * m, 4);
      if (bl > 0) { c.fillStyle = '#efe6cc'; c.beginPath(); c.ellipse(33, 4, 26 * bl, 16 * bl, 0.2, 0, TAU); c.fill(); c.fillStyle = 'rgba(60,40,80,0.25)'; c.beginPath(); c.ellipse(33, 4, 26 * bl, 16 * bl, 0.2, 0, TAU); c.fill(); }
    }
  }
  c.restore();
}
function nib(c: C2, x: number, y: number) {
  c.save(); c.translate(x, y); c.rotate(-0.7);
  c.fillStyle = '#2a2a33'; c.fillRect(-4, -70, 8, 56);
  c.fillStyle = '#c9a24a'; c.beginPath(); c.moveTo(-5, -14); c.lineTo(5, -14); c.lineTo(0, 2); c.closePath(); c.fill();
  c.restore();
}

// ------------------------------------------------------------------ the slate and the pendant

/** The girl's dive slate (white board, a pencil on its cord) at (x, y), rotation `rot`; `draw` writes on it (0,0 = its centre). */
export function slate(c: C2, x: number, y: number, s: number, rot: number, draw?: (c: C2, w: number, h: number) => void) {
  const w = 220, h = 280;
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.roundRect(-w / 2 + 6, -h / 2 + 8, w, h, 16); c.fill();
  c.fillStyle = '#f2f5f4'; c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, 16); c.fill();
  c.strokeStyle = '#c8d0d0'; c.lineWidth = 3; c.stroke();
  c.fillStyle = '#c8d0d0'; c.beginPath(); c.arc(0, -h / 2 + 16, 7, 0, TAU); c.fill();
  c.strokeStyle = '#7a8a8a'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -h / 2 + 16); c.quadraticCurveTo(w * 0.6, -h * 0.4, w / 2 + 14, h * 0.1); c.stroke();
  c.fillStyle = '#ffd23f'; c.save(); c.translate(w / 2 + 14, h * 0.12); c.rotate(0.3); c.fillRect(-5, -40, 10, 70); c.fillStyle = '#2a2a33'; c.beginPath(); c.moveTo(-5, 30); c.lineTo(5, 30); c.lineTo(0, 42); c.closePath(); c.fill(); c.restore();
  if (draw) { c.save(); c.beginPath(); c.roundRect(-w / 2 + 10, -h / 2 + 30, w - 20, h - 40, 10); c.clip(); draw(c, w - 20, h - 40); c.restore(); }
  c.restore();
}

/** A pencil line on the slate, revealed to `u` (0..1) along its length: pts in slate units. */
export function pencil(c: C2, pts: [number, number][], u: number, col = '#2a2a33', w = 5) {
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
/** A circle as pencil points (for drawings on the slate). */
export const circlePts = (cx: number, cy: number, r: number, n = 40, a0 = -PI / 2): [number, number][] =>
  Array.from({ length: n + 1 }, (_, i) => [cx + Math.cos(a0 + (i / n) * TAU) * r, cy + Math.sin(a0 + (i / n) * TAU) * r]);

/**
 * The pebble pendant (a little holed stone) and chibi Rai popping out of it in a bubble to narrate on land. (x, y) is
 * the pebble; `pop` 0..1 how far she is out; `rai` sets her face, arms, marks.
 */
export function pendantRai(c: C2, g: C2, x: number, y: number, s: number, t: number, pop: number, rai: Partial<RaiOpts> = {}, glow = 0) {
  c.fillStyle = HEX.stone; c.beginPath(); c.arc(x, y, 9 * s, 0, TAU); c.arc(x, y, 3.4 * s, 0, TAU, true); c.fill('evenodd');
  if (glow > 0) { g.fillStyle = rgbaHex(HEX.pink, 0.5 * glow); g.beginPath(); g.arc(x, y, 18 * s, 0, TAU); g.fill(); }
  if (pop <= 0) return;
  const k = ease.outBack(clamp(pop)), bx = x + 70 * s * k, by = y - 90 * s * k, br = 62 * s * k;
  c.save();
  c.fillStyle = 'rgba(220,245,255,0.18)'; c.strokeStyle = 'rgba(220,245,255,0.8)'; c.lineWidth = 3 * s;
  c.beginPath(); c.arc(bx, by, br, 0, TAU); c.fill(); c.stroke();
  c.beginPath(); c.arc(x + 22 * s * k, y - 26 * s * k, 7 * s * k, 0, TAU); c.stroke();
  c.beginPath(); c.arc(x + 40 * s * k, y - 52 * s * k, 11 * s * k, 0, TAU); c.stroke();
  c.beginPath(); c.arc(bx, by, br - 4 * s, 0, TAU); c.clip();
  drawRai(c, bx, by + 12 * s * k, 26 * s * k, { t, face: 'smile', sd: true, ...rai } as RaiOpts);
  c.restore();
  c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.arc(bx - br * 0.45, by - br * 0.5, br * 0.12, 0, TAU); c.fill();
}

// ------------------------------------------------------------------ the bedroom

export interface BedroomOpts {
  /** the lamp's warm light 0..1, the window's moon */
  lamp?: number;
  /** what the bedside clock says */
  clock?: string;
  /** the girl in bed: feverish (a pink flush and a sweat drop), asleep, or looking up */
  girl?: 'fever' | 'asleep' | 'awake' | 'none';
  /** the mother on the chair */
  mom?: { pose?: Pose; emote?: Emote; emoteT0?: number; asleep?: boolean } | null;
  /** the clues: the lunchbox on the chair's side, the bill on the dresser, the mask on the bedpost, the pendant */
  lunchbox?: boolean; bill?: boolean; mask?: boolean;
  pendant?: { pop?: number; rai?: Partial<RaiOpts>; glow?: number };
  /** the ledger book on the shelf */
  book?: BookOpts;
  /** the dream: the room flooding into the sea, 0..1 */
  flood?: number;
  /** camera: pan and zoom about a point (the doll's house shots push in on the dresser) */
  cam?: { x?: number; y?: number; zoom?: number };
}
/** Where things are in the bedroom (logical px, before any camera). */
export const ROOM = {
  bed: { x: W * 0.36, y: H * 0.74 }, chair: { x: W * 0.64, y: H * 0.86 }, table: { x: W * 0.5, y: H * 0.7 },
  shelf: { x: W * 0.2, y: H * 0.3 }, book: { x: W * 0.27, y: H * 0.255 }, dollhouse: { x: W * 0.84, y: H * 0.62 },
  window: { x: W * 0.62, y: H * 0.3 }, clock: { x: W * 0.5 + 18, y: H * 0.665 }, pendant: { x: W * 0.5 + 62, y: H * 0.69 },
};

/** The girl's bedroom at night (fever, dollhouse, dream). */
export function bedroom(c: C2, g: C2, t: number, o: BedroomOpts = {}) {
  const lamp = o.lamp ?? 1, flood = clamp(o.flood ?? 0), cam = o.cam ?? {};
  c.save(); g.save();
  for (const k of [c, g]) { k.translate(W / 2, H / 2); k.scale(cam.zoom ?? 1, cam.zoom ?? 1); k.translate(-W / 2 - (cam.x ?? 0), -H / 2 - (cam.y ?? 0)); }
  // walls and floor
  const wall = c.createLinearGradient(0, 0, 0, H * 0.78);
  wall.addColorStop(0, mixHex('#1b1430', '#3a2a40', lamp * 0.6)); wall.addColorStop(1, mixHex('#24183a', '#5a3a3a', lamp * 0.6));
  c.fillStyle = wall; c.fillRect(-W, -H, W * 3, H * 1.78 + H * 0.78);
  c.fillStyle = 'rgba(255,220,180,0.05)';   // wallpaper: little stars
  for (let i = 0; i < 60; i++) { const x = h01(i, 1) * W, y = h01(i, 2) * H * 0.7; c.beginPath(); c.arc(x, y, 3, 0, TAU); c.fill(); }
  c.fillStyle = mixHex('#2a1c1c', '#5a3a2a', lamp * 0.5); c.fillRect(-W, H * 0.78, W * 3, H);
  c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 2;
  for (let k = 0; k < 8; k++) { c.beginPath(); c.moveTo(-W, H * (0.8 + k * 0.03)); c.lineTo(W * 2, H * (0.8 + k * 0.03)); c.stroke(); }
  // the rug
  c.fillStyle = mixHex('#3a2a5a', '#7a4a6a', lamp * 0.4); c.beginPath(); c.ellipse(W * 0.48, H * 0.9, 420, 60, 0, 0, TAU); c.fill();
  // the window: night sky, the moon, the sea, the lit hut across the bay
  const wx = ROOM.window.x, wy = ROOM.window.y;
  c.fillStyle = '#0a1030'; c.fillRect(wx - 140, wy - 120, 280, 230);
  c.fillStyle = '#f4efe1'; c.beginPath(); c.arc(wx + 60, wy - 60, 26, 0, TAU); c.fill();
  g.fillStyle = 'rgba(244,239,225,0.25)'; g.beginPath(); g.arc(wx + 60, wy - 60, 50, 0, TAU); g.fill();
  c.fillStyle = '#16235a'; c.fillRect(wx - 140, wy + 30, 280, 80);
  c.strokeStyle = 'rgba(244,239,225,0.5)'; c.lineWidth = 2;
  for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(wx + 30 - k * 10, wy + 40 + k * 14); c.lineTo(wx + 90 + k * 10, wy + 40 + k * 14); c.stroke(); }
  c.strokeStyle = '#3a2a2a'; c.lineWidth = 12; c.strokeRect(wx - 140, wy - 120, 280, 230);
  c.lineWidth = 6; c.beginPath(); c.moveTo(wx, wy - 120); c.lineTo(wx, wy + 110); c.moveTo(wx - 140, wy - 5); c.lineTo(wx + 140, wy - 5); c.stroke();
  // curtains
  c.fillStyle = mixHex('#3a1a3a', '#8a3a5a', lamp * 0.4);
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(wx + s * 150, wy - 140); c.quadraticCurveTo(wx + s * 190 + 6 * Math.sin(t), wy, wx + s * 175, wy + 130); c.lineTo(wx + s * 215, wy + 130); c.lineTo(wx + s * 215, wy - 140); c.closePath(); c.fill(); }
  // the shelf with storybooks, the ledger book, a toy rai stone
  const sx = ROOM.shelf.x, sy = ROOM.shelf.y;
  c.fillStyle = '#4a3020'; c.fillRect(sx - 200, sy + 50, 400, 14);
  const bookCols = ['#c65cf0', '#ff8a2a', '#2fe0ff', '#78d63a', '#ff4f9a', '#ffd23f'];
  for (let i = 0; i < 6; i++) { c.fillStyle = bookCols[i]!; c.fillRect(sx - 190 + i * 26, sy - 40 + (i % 2) * 8, 22, 90 - (i % 2) * 8); }
  // the ledger book stands at the shelf's right end (ROOM.book): drawn by ledgerBook
  ledgerBook(c, g, ROOM.book.x, ROOM.book.y - 2, 0.36, t, o.book ?? {});
  c.fillStyle = HEX.stone; c.beginPath(); c.arc(sx + 150, sy + 30, 20, 0, TAU); c.arc(sx + 150, sy + 30, 7, 0, TAU, true); c.fill('evenodd');
  // the dresser with the doll's house and the bill
  const dx = ROOM.dollhouse.x, dy = ROOM.dollhouse.y;
  c.fillStyle = '#4a3020'; c.fillRect(dx - 170, dy + 90, 340, 190);
  c.fillStyle = '#3a2418'; for (let k = 0; k < 3; k++) c.fillRect(dx - 150, dy + 110 + k * 56, 300, 44);
  dollhouse(c, g, dx, dy, 1, t, lamp);
  if (o.bill !== false) {
    c.save(); c.translate(dx - 120, dy + 82); c.rotate(-0.08);
    c.fillStyle = '#f4f1ea'; c.fillRect(-36, -10, 72, 22);
    c.fillStyle = '#c03030'; c.font = font(FAM.monoB(), 13); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('£82.40', 0, 1);
    c.restore();
  }
  // the bed: the headboard, the girl, the quilt
  const bx = ROOM.bed.x, by = ROOM.bed.y;
  c.fillStyle = '#5a3a2a'; c.fillRect(bx - 330, by - 170, 24, 220); c.fillRect(bx + 290, by - 90, 22, 140);
  c.fillStyle = '#5a3a2a'; c.beginPath(); c.roundRect(bx - 330, by - 200, 60, 60, 20); c.fill();
  c.fillStyle = '#e8e0d4'; c.beginPath(); c.roundRect(bx - 300, by - 60, 590, 70, 14); c.fill();
  c.fillStyle = '#f4efe6'; c.beginPath(); c.ellipse(bx - 240, by - 70, 70, 34, 0, 0, TAU); c.fill();   // pillow
  if (o.girl !== 'none') {
    const gx = bx - 230, gy = by - 82;
    c.fillStyle = '#0d0a18'; c.beginPath(); c.arc(gx, gy, 30, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(gx - 28, gy - 10, 22, 12, -0.5, 0, TAU); c.fill();   // her ponytail on the pillow
    if (o.girl === 'fever') { // a flush on her cheek, and the sweat
      g.fillStyle = rgbaHex(HEX.pink, 0.2 + 0.06 * Math.sin(t * 2)); g.beginPath(); g.ellipse(gx + 12, gy + 8, 16, 10, 0, 0, TAU); g.fill();
      emote(c, gx, gy, 30, 'sweat', t);
    } else if (o.girl === 'asleep') emote(c, gx, gy, 30, 'zzz', t);
  }
  // the quilt over her, patterned with little fish
  const qg = c.createLinearGradient(0, by - 90, 0, by + 20);
  qg.addColorStop(0, mixHex('#3a5aa0', '#5a8ae0', lamp * 0.5)); qg.addColorStop(1, '#2a3a7a');
  c.fillStyle = qg; c.beginPath(); c.moveTo(bx - 200, by - 70); c.quadraticCurveTo(bx, by - 120 + 3 * Math.sin(t * 1.5), bx + 290, by - 70); c.lineTo(bx + 300, by + 20); c.lineTo(bx - 210, by + 20); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,210,63,0.5)';
  for (let k = 0; k < 9; k++) { const qx = bx - 150 + k * 52, qy = by - 50 + (k % 2) * 30; c.beginPath(); c.ellipse(qx, qy, 12, 6, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(qx + 10, qy); c.lineTo(qx + 18, qy - 6); c.lineTo(qx + 18, qy + 6); c.fill(); }
  // the mask on the bedpost
  if (o.mask !== false) {
    c.fillStyle = HEX.coral; c.beginPath(); c.roundRect(bx - 342, by - 150, 46, 32, 8); c.fill();
    c.fillStyle = '#1a2a4a'; c.beginPath(); c.roundRect(bx - 336, by - 145, 34, 22, 6); c.fill();
    c.strokeStyle = HEX.coral; c.lineWidth = 4; c.beginPath(); c.arc(bx - 318, by - 150, 18, PI, TAU); c.stroke();
  }
  // the bedside table: the lamp, the clock, the thermometer, the pendant
  const tx = ROOM.table.x, ty = ROOM.table.y;
  c.fillStyle = '#4a3020'; c.fillRect(tx - 80, ty - 4, 160, 18); c.fillRect(tx - 70, ty + 14, 12, 110); c.fillRect(tx + 58, ty + 14, 12, 110);
  const lx = tx - 45;
  c.fillStyle = '#7a5a3a'; c.fillRect(lx - 4, ty - 80, 8, 76);
  c.fillStyle = mixHex('#6a4a3a', '#ffd9a0', lamp); c.beginPath(); c.moveTo(lx - 40, ty - 80); c.lineTo(lx + 40, ty - 80); c.lineTo(lx + 24, ty - 130); c.lineTo(lx - 24, ty - 130); c.closePath(); c.fill();
  if (lamp > 0) { // the lamp's pool: warm on the walls (main layer), a soft bloom at the shade (glow layer)
    const wl = c.createRadialGradient(lx, ty - 100, 20, lx, ty - 100, 760);
    wl.addColorStop(0, rgbaHex('#ffb060', 0.32 * lamp)); wl.addColorStop(0.5, rgbaHex('#ff9050', 0.1 * lamp)); wl.addColorStop(1, rgbaHex('#ff9050', 0));
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = wl; c.fillRect(lx - 800, ty - 900, 1600, 1600); c.restore();
    const lg = g.createRadialGradient(lx, ty - 100, 4, lx, ty - 100, 130); lg.addColorStop(0, rgbaHex('#ffd9a0', 0.4 * lamp)); lg.addColorStop(1, rgbaHex('#ffd9a0', 0));
    g.fillStyle = lg; g.fillRect(lx - 140, ty - 240, 280, 280);
  }
  c.fillStyle = '#1a1420'; c.beginPath(); c.roundRect(ROOM.clock.x - 32, ROOM.clock.y - 18, 64, 34, 6); c.fill();
  c.fillStyle = HEX.coral; c.font = font(FAM.monoB(), 22); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(o.clock ?? '4:00', ROOM.clock.x, ROOM.clock.y);
  g.fillStyle = rgbaHex(HEX.coral, 0.18); g.beginPath(); g.arc(ROOM.clock.x, ROOM.clock.y, 30, 0, TAU); g.fill();
  if (o.pendant) pendantRai(c, g, ROOM.pendant.x, ROOM.pendant.y - 8, 1, t, o.pendant.pop ?? 0, o.pendant.rai ?? {}, o.pendant.glow ?? 0);
  // the chair and the mother
  const cx = ROOM.chair.x, cy = ROOM.chair.y;
  c.fillStyle = '#3a2418'; c.fillRect(cx - 50, cy - 200, 14, 200); c.fillRect(cx - 50, cy - 70, 110, 14); c.fillRect(cx + 46, cy - 70, 12, 70);
  if (o.mom !== null) {
    const m = o.mom ?? {};
    mother(c, cx, cy, 330, m.pose ?? 'seated', { t, flip: true, col: '#0e0a16', emote: m.asleep ? 'zzz' : m.emote, emoteT0: m.emoteT0, headTilt: m.asleep ? 0.5 : 0.15, rim: rgbaHex('#ffd9a0', 0.95 * Math.max(0.4, lamp)), shawl: '#5a3a6a' });
  }
  if (o.lunchbox !== false) {
    c.fillStyle = '#2fb8a0'; c.beginPath(); c.roundRect(cx + 70, cy - 46, 64, 46, 8); c.fill();
    c.strokeStyle = '#1a6a5a'; c.lineWidth = 5; c.beginPath(); c.arc(cx + 102, cy - 46, 14, PI, TAU); c.stroke();
  }
  // the dream: the sea rising through the room
  if (flood > 0) {
    const lvl = H * (1.05 - 1.15 * ease.inOutCubic(flood));
    c.save();
    c.beginPath(); c.moveTo(-W, H * 2);
    for (let x = -W; x <= W * 2; x += 30) c.lineTo(x, lvl + 10 * Math.sin(x * 0.01 + t * 2));
    c.lineTo(W * 2, H * 2); c.closePath(); c.clip();
    c.fillStyle = rgbaHex('#2fa8e0', 0.38); c.fillRect(-W, -H, W * 3, H * 3);
    c.globalCompositeOperation = 'screen';
    c.strokeStyle = 'rgba(220,250,255,0.18)'; c.lineWidth = 3;
    for (let j = 0; j < 14; j++) { c.beginPath(); for (let x = -40; x <= W + 40; x += 30) { const y = j * 80 + 14 * Math.sin(x * 0.02 + t * 1.4 + j); x === -40 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); }
    c.restore();
  }
  c.restore(); g.restore();
}

/** The doll's house on the dresser: a cutaway with three rooms, a cuckoo clock and a coin meter on the parlour wall. */
export function dollhouse(c: C2, g: C2, x: number, y: number, s: number, t: number, lamp = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = '#c9a06a'; c.beginPath(); c.moveTo(-130, -40); c.lineTo(0, -130); c.lineTo(130, -40); c.closePath(); c.fill();   // roof
  c.fillStyle = '#e8d8b8'; c.fillRect(-120, -40, 240, 130);
  c.fillStyle = mixHex('#5a4a6a', '#f4d8a8', lamp * 0.6); c.fillRect(-110, -30, 105, 55); c.fillRect(5, -30, 105, 55); c.fillRect(-110, 32, 220, 52);
  c.strokeStyle = '#8a6a44'; c.lineWidth = 4; c.strokeRect(-120, -40, 240, 130);
  c.beginPath(); c.moveTo(0, -40); c.lineTo(0, 28); c.moveTo(-120, 28); c.lineTo(120, 28); c.stroke();
  // the cuckoo clock (upstairs right) and the coin meter (the parlour)
  c.fillStyle = '#6a4a2c'; c.fillRect(60, -24, 22, 30); c.fillStyle = '#f4efe1'; c.beginPath(); c.arc(71, -12, 7, 0, TAU); c.fill();
  c.fillStyle = '#8a8f9c'; c.fillRect(70, 40, 26, 34); c.fillStyle = '#111'; c.fillRect(74, 46, 18, 8);
  c.restore();
  void g; void t;
}

// ------------------------------------------------------------------ the lyric, rising like bubbles

/** Balanced rows by the midpoint rule (no one-word orphans). */
export function balancedRows(c: C2, line: Line, maxW: number): number[][] {
  const sp = c.measureText(' ').width, ws = line.words.map((w) => c.measureText(w.w).width);
  const total = ws.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
  const n = Math.max(1, Math.ceil(total / maxW)), target = total / n;
  const rows: number[][] = [[]];
  let acc = 0;
  ws.forEach((w, i) => {
    if (rows[rows.length - 1]!.length && acc + w / 2 > target * rows.length && rows.length < n) rows.push([]);
    rows[rows.length - 1]!.push(i); acc += w + sp;
  });
  return rows;
}

/**
 * v2's karaoke: the line rises into place word by word like bubbles during its 0.4 s lead (a drift up, a wobble),
 * then each word fills as it is sung (never ahead of the voice; unsung at 62%), with a small pop. A soft dark band
 * behind it when `band` (default on). Spoken lines: pass `spoken` for Cormorant, each word appearing as it is said.
 */
export function bubbleLyric(c: C2, line: Line, t: number, o: { y?: number; size?: number; sung?: string; band?: boolean; spoken?: boolean; until?: number; maxW?: number } = {}) {
  const lead = o.spoken ? 0.05 : 0.4, first = line.words[0]!.start, until = o.until ?? line.end + (o.spoken ? 0.8 : 0.35);
  if (t < first - lead || t > until + 0.25) return;
  const size = o.size ?? (o.spoken ? 58 : 50), y = o.y ?? H - 96, lh = size * 1.2, fam = o.spoken ? FAM.serif() : FAM.bold();
  const out = 1 - clamp((t - until) / 0.25);
  if (o.band !== false && !o.spoken) {
    const bg = c.createLinearGradient(0, y - 150, 0, H);
    bg.addColorStop(0, 'rgba(6,10,26,0)'); bg.addColorStop(0.5, `rgba(6,10,26,${0.5 * out})`); bg.addColorStop(1, `rgba(6,10,26,${0.75 * out})`);
    c.fillStyle = bg; c.fillRect(0, y - 150, W, H - y + 150);
  }
  c.save(); c.font = font(fam, size); c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  const sp = c.measureText(' ').width, ws = line.words.map((w) => c.measureText(w.w).width);
  const rows = balancedRows(c, line, o.maxW ?? W - 260);
  let cy = y - ((rows.length - 1) * lh) / 2 + size * 0.36, wi = 0;
  for (const row of rows) {
    const rw = row.reduce((a, i) => a + ws[i]!, 0) + sp * (row.length - 1);
    let cx = W / 2 - rw / 2;
    for (const i of row) {
      const w = line.words[i]!, p = Lyrics.wordProgress(w, t);
      // the rise: staggered across the lead (spoken words rise as they are said)
      const t0 = o.spoken ? w.start - 0.08 : first - lead + 0.25 * (wi / Math.max(1, line.words.length - 1)) * lead;
      const r = clamp((t - t0) / 0.3), rise = (1 - ease.outBack(r)) * 26, wob = (1 - r) * 4 * Math.sin(t * 14 + i);
      if (r > 0) {
        c.save(); c.globalAlpha = r * out;
        const px = cx + wob, py = cy + rise;
        c.fillStyle = o.spoken ? '#f4f1ea' : 'rgba(244,241,234,0.62)';
        c.fillText(w.w, px, py);
        if (!o.spoken && p > 0) {
          const pop = p < 1 ? 1 + 0.06 * Math.sin(p * PI) : 1;
          c.save(); c.translate(px + ws[i]! / 2, py - size * 0.35); c.scale(pop, pop); c.translate(-(px + ws[i]! / 2), -(py - size * 0.35));
          c.beginPath(); c.rect(px - 2, py - size * 1.2, (ws[i]! + 4) * p, size * 1.6); c.clip();
          c.fillStyle = o.sung ?? HEX.yellow; c.fillText(w.w, px, py); c.restore();
        }
        c.restore();
      }
      cx += ws[i]! + sp; wi++;
    }
    cy += lh;
  }
  c.restore();
}

// ------------------------------------------------------------------ plate helpers (lessons from v1's authors)

/**
 * The line to show at t from a plate's lines: the last whose first word is within `lead` s (one line at a time, so
 * back-to-back rapped lines hand over instead of stacking). Null before the first.
 */
export function currentLine(lines: Line[], t: number, lead = 0.4): Line | null {
  // a line hands over to the next one `lead` s before the next's first word, but never before its own last word has
  // had 0.2 s to fill (rapped lines run back to back: the 0.4 s lead used to swap a line out before its last word
  // was sung)
  let cur: Line | null = null;
  lines.forEach((l, i) => {
    const prev = lines[i - 1];
    const lastStart = prev ? prev.words[prev.words.length - 1]!.start : -1e9;
    const at = Math.min(l.words[0]!.start, Math.max(l.words[0]!.start - lead, lastStart + 0.2));
    if (at <= t) cur = l;
  });
  return cur;
}

/** Clear the glow layer under the lyric band (the additive glow otherwise washes over the words). */
export function clearGlowBand(g: C2, y = H - 96, h = 230) {
  g.clearRect(-W, y - h / 2 - 30, W * 3, h + 60);   // call outside any camera transform
}

/** A camera on BOTH layers: pan by (x, y), zoom and rotate about the frame's centre, then draw. */
export function withCam2(c: C2, g: C2, cam: { x?: number; y?: number; zoom?: number; rot?: number }, draw: () => void) {
  for (const k of [c, g]) {
    k.save(); k.translate(W / 2, H / 2); k.rotate(cam.rot ?? 0); k.scale(cam.zoom ?? 1, cam.zoom ?? 1); k.translate(-W / 2 - (cam.x ?? 0), -H / 2 - (cam.y ?? 0));
  }
  draw();
  c.restore(); g.restore();
}

// ------------------------------------------------------------------ the family and the village

export type Relative = 'uncle' | 'aunt' | 'grandad' | 'diver1' | 'diver2';
/**
 * The girl's relatives and the village, each a faceless person() with one telling accessory:
 * the uncle's glasses (he brings the calculator), the aunt's headscarf and earrings, the grandad's flat cap and
 * white beard line, and two divers (later the old men at the wedding: `old` adds a stoop and grey).
 */
export function relative(c: C2, who: Relative, x: number, y: number, h: number, pose: Pose = 'stand', o: { col?: string; flip?: boolean; t?: number; rim?: string; emote?: Emote; emoteT0?: number; old?: boolean; headTilt?: number } = {}) {
  const col = o.col ?? '#120d1d', u = h / 100, f = o.flip ? -1 : 1, t = o.t ?? 0;
  const slump = pose === 'slump' || pose === 'face' || o.old ? 1 : 0, seated = pose === 'seated';
  const shY = (seated ? -76 : -78) + slump * 6, hx = x + f * slump * 10.4 * u, hy = y + (shY - 10 + slump * 5) * u;
  person(c, x, y, h, o.old && pose === 'stand' ? 'slump' : pose, { col, flip: o.flip, t, rim: o.rim, emote: o.emote, emoteT0: o.emoteT0, headTilt: o.headTilt, seed: who.length * 3 });
  c.save(); c.fillStyle = col; c.strokeStyle = col;
  if (who === 'uncle') {
    c.strokeStyle = '#cfd6e6'; c.lineWidth = 1.4 * u;
    c.beginPath(); c.rect(hx + f * 1 * u, hy - 3 * u, 5 * u, 4 * u); c.rect(hx + f * 7 * u, hy - 3 * u, 4 * u * f, 4 * u); c.stroke();
  } else if (who === 'aunt') {
    c.fillStyle = HEX.orange; c.beginPath(); c.arc(hx, hy - 1 * u, 10.5 * u, PI * 1.05, PI * 1.95); c.lineTo(hx - f * 12 * u, hy + 6 * u); c.closePath(); c.fill();
    c.fillStyle = HEX.gold; c.beginPath(); c.arc(hx + f * 2 * u, hy + 8 * u, 1.6 * u, 0, TAU); c.fill();
  } else if (who === 'grandad') {
    c.beginPath(); c.ellipse(hx + f * 2 * u, hy - 7 * u, 11 * u, 4.5 * u, 0, PI, TAU); c.fill();
    c.beginPath(); c.moveTo(hx + f * 2 * u, hy - 7 * u); c.lineTo(hx + f * 15 * u, hy - 5 * u); c.lineTo(hx + f * 2 * u, hy - 4 * u); c.fill();
    c.strokeStyle = 'rgba(240,240,240,0.85)'; c.lineWidth = 1.8 * u; c.beginPath(); c.arc(hx + f * 3 * u, hy + 2 * u, 7 * u, 0.2, 1.6); c.stroke();
  } else { // the divers: a mask pushed up on the forehead (and a snorkel)
    c.fillStyle = who === 'diver1' ? HEX.cyan : HEX.lime;
    c.beginPath(); c.roundRect(hx - 5 * u, hy - 12 * u, 11 * u, 6 * u, 2 * u); c.fill();
    if (o.old) { c.strokeStyle = 'rgba(230,230,230,0.8)'; c.lineWidth = 1.5 * u; c.beginPath(); c.arc(hx, hy, 9.5 * u, PI * 1.1, PI * 1.9); c.stroke(); }
  }
  c.restore();
}

/** A villager (the crowd at night, at dawn, at the wedding): a person() with a seeded accessory and a lantern or garland. */
export function villager(c: C2, x: number, y: number, h: number, pose: Pose, i: number, o: { col?: string; t?: number; lantern?: boolean; garland?: boolean; rim?: string; emote?: Emote; emoteT0?: number; flip?: boolean } = {}) {
  const col = o.col ?? '#120d1d', u = h / 100, t = o.t ?? 0, k = h01(i, 77);
  person(c, x, y, h * (0.86 + 0.22 * h01(i, 78)), pose, { col, t, seed: i, rim: o.rim, emote: o.emote, emoteT0: o.emoteT0, flip: o.flip ?? h01(i, 79) < 0.5 });
  const hh = h * (0.86 + 0.22 * h01(i, 78)), hy = y - 88 * hh / 100;
  c.save(); c.fillStyle = col;
  if (k < 0.25) { c.beginPath(); c.ellipse(x, hy - 6 * hh / 100, 14 * hh / 100, 4 * hh / 100, 0, 0, TAU); c.fill(); }          // a wide hat
  else if (k < 0.45) { c.beginPath(); c.arc(x - 7 * hh / 100, hy - 4 * hh / 100, 5 * hh / 100, 0, TAU); c.fill(); }            // a bun
  else if (k < 0.6) { c.fillStyle = [HEX.pink, HEX.yellow, HEX.coral][i % 3]!; c.beginPath(); c.arc(x + 6 * hh / 100, hy - 6 * hh / 100, 3 * hh / 100, 0, TAU); c.fill(); }   // a flower
  if (o.garland) { for (let j = 0; j < 7; j++) { const a = PI * (0.15 + 0.7 * j / 6); c.fillStyle = [HEX.pink, HEX.yellow, '#fff3f7', HEX.coral][j % 4]!; c.beginPath(); c.arc(x + Math.cos(a) * 9 * hh / 100, y - 76 * hh / 100 + Math.sin(a) * 8 * hh / 100, 2.4 * hh / 100, 0, TAU); c.fill(); } }
  c.restore();
  if (o.lantern) { // a paper lantern on a short pole, bobbing
    const lx = x + 18 * u, ly = y - 92 * u + 3 * u * Math.sin(t * 2 + i);
    c.strokeStyle = '#3a2a20'; c.lineWidth = 1.6 * u; c.beginPath(); c.moveTo(x + 10 * u, y - 60 * u); c.lineTo(lx, ly - 8 * u); c.stroke();
    c.fillStyle = HEX.orange; c.beginPath(); c.ellipse(lx, ly, 6 * u, 8 * u, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,240,200,0.8)'; c.beginPath(); c.ellipse(lx, ly, 3 * u, 5 * u, 0, 0, TAU); c.fill();
  }
}
/** A lantern's glow for the glow layer, matching villager(…, {lantern}) at the same x, y, h, i, t. */
export function lanternGlow(g: C2, x: number, y: number, h: number, i: number, t: number, a = 1) {
  const u = h / 100, lx = x + 18 * u, ly = y - 92 * u + 3 * u * Math.sin(t * 2 + i);
  const gr = g.createRadialGradient(lx, ly, 0, lx, ly, 34 * u);
  gr.addColorStop(0, rgbaHex('#ffb050', 0.55 * a)); gr.addColorStop(1, rgbaHex('#ffb050', 0));
  g.fillStyle = gr; g.beginPath(); g.arc(lx, ly, 34 * u, 0, TAU); g.fill();
}
