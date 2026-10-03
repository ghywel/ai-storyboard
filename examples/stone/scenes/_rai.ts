// Rai, the stone at the bottom of the sea, drawn in Canvas2D: a round pebble head with amber eyes and lashes and a
// coral starfish clinging to her crown, on a limestone disc whose hole is her heart; barnacles, a gold harmonograph
// pendant. No hair (his note, 2026-10-02: "Lose the hair entirely - she is a rock"). From the Swift draft he approved
// (film/engine/Mascot.swift).
//
// She ACTS (his notes, 2026-10-02: "big exaggerated cartoon emotions", chibi shifts, lines of force; "cross when she
// is cross, sas when she is sassy"): two-bone arms with poses (hip, point, fists, shrug, cheek, facepalm...),
// squash and stretch, hops, a shake, twenty-one faces, a super-deformed chibi body (`sd`), and
// manga marks (_manga.ts) placed from the anchors she returns.
//
// Geometry is in units of the disc's radius R with y UP about the disc's centre (the canvas is flipped once). The
// hole is real: whatever is behind her shows through it. Every old call (face, wave, glow, heart...) still works.
import { frameIdx } from '../engine/util';
import { drawMarks, type Anchors, type Mark } from './_manga';

export type Face =
  | 'smile' | 'wink' | 'grin' | 'wow' | 'soft' | 'fierce' | 'asleep'
  | 'angry' | 'sassy' | 'cheeky' | 'sad' | 'cry' | 'joy' | 'shock' | 'smug' | 'love' | 'dizzy' | 'deadpan' | 'scheme'
  | 'determined' | 'serious';
export const FACES: Face[] = ['smile', 'wink', 'grin', 'wow', 'soft', 'fierce', 'asleep', 'angry', 'sassy', 'cheeky', 'sad', 'cry', 'joy', 'shock', 'smug', 'love', 'dizzy', 'deadpan', 'scheme', 'determined', 'serious'];

/** Arm poses (for her right arm, on the viewer's right; the left arm mirrors). */
export type ArmPose = 'down' | 'wave' | 'hip' | 'point' | 'up' | 'fist' | 'cross' | 'shrug' | 'cheek' | 'chin' | 'facepalm' | 'reach' | 'hold';
export const ARM_POSES: ArmPose[] = ['down', 'wave', 'hip', 'point', 'up', 'fist', 'cross', 'shrug', 'cheek', 'chin', 'facepalm', 'reach', 'hold'];

export interface RaiOpts {
  t: number;
  face?: Face;
  /** Legacy: the right arm's raise, 0 (down) to 1 (waving). Ignored when `arms` is given. */
  wave?: number;
  /** Arm poses: one for both, or [left, right] (the viewer's left and right). */
  arms?: ArmPose | [ArmPose, ArmPose];
  /** Blend from `armsFrom` to `arms` (0 = from, 1 = to), for a move between poses. */
  armsFrom?: ArmPose | [ArmPose, ArmPose];
  armsU?: number;
  /** Her glow (any CSS colour). */
  glow?: string;
  glowStrength?: number;
  tilt?: number;
  /** 0..1: the hole that is her heart glows (someone is cared for). */
  heart?: number;
  heartColor?: string;
  /** Force the eyes open (no blink) for stills that must show the face. */
  noBlink?: boolean;
  /** -1 (squashed flat and wide) .. 0 .. +1 (stretched tall), about her feet. */
  squash?: number;
  /** Lift off the ground, in R. */
  hop?: number;
  /** A tremble (anger, fright, giggles): 0..1. */
  shake?: number;
  /** Ignored (she had hair once; his call: she is a rock). */
  hairLift?: number;
  /** Super-deformed chibi body: the brief comic shift (pop in and out with _manga.poof). */
  sd?: boolean;
  /** Manga marks around her head, popping in at `markT0`. */
  marks?: Mark[];
  markT0?: number;
  /** Where her pupils look, -1 (left) .. 1 (right). */
  look?: number;
  /** Extra blush (embarrassed, in love, furious): 0..1. */
  blush?: number;
  /** Something held in one hand (side -1 = the viewer's left, 1 = right): `draw` paints it with the origin at the
   *  hand, y down and up the screen as usual, scale in canvas px (`R` is her disc radius). A microphone, a slate... */
  prop?: { side: -1 | 1; draw: (c: C, R: number) => void };
}

/** Where her hands are (canvas px), filled in by drawRai for props and effects. */
export interface Hands { l: { x: number; y: number }; r: { x: number; y: number } }
let HANDS: Hands | null = null, BASE: DOMMatrix | null = null, PROP: RaiOpts['prop'] | null = null;
/** Her hands from the last drawRai call (full body only; the chibi's stubby arms leave them unset). */
export function lastHands(): Hands | null { return HANDS; }

const STONE = '#d9cfb8', STONE_DARK = '#8f8676', RIM = '#6f6656', GOLD = '#f6c453', INK = '#2a1d14', OUT = '#3a2f2a';
const HOLE = { y: -0.12, r: 0.27 };
const EYES = { x: 0.3, y: 0.38 }; // face units (1.45 head radii)
const TAU = Math.PI * 2;

/** Deterministic hash to [0, 1). */
export function h01(a: number, b = 0, c = 0): number {
  let x = Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663) ^ Math.imul(c | 0, 83492791);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

type C = CanvasRenderingContext2D;
function ell(c: C, x: number, y: number, w: number, h: number) {
  c.ellipse(x + w / 2, y + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, TAU);
}
function fillEll(c: C, x: number, y: number, w: number, h: number, col: string) {
  c.beginPath(); ell(c, x, y, w, h); c.fillStyle = col; c.fill();
}
function circle(c: C, x: number, y: number, r: number) {
  c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU);
}
function withAlpha(col: string, a: number): string {
  if (col.startsWith('#')) {
    const n = parseInt(col.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a))})`;
  }
  return col;
}

// ------------------------------------------------------------------ the arms

/** Hand targets for each pose (her right arm, in R about the disc's centre, y up), drawn in front or behind. */
const ARM: Record<ArmPose, { x: number; y: number; front: boolean; bend: number; hand: 'round' | 'fist' | 'palm' | 'point' }> = {
  down: { x: 1.08, y: -0.5, front: false, bend: 1, hand: 'round' },
  wave: { x: 1.35, y: 1.45, front: false, bend: -1, hand: 'palm' },
  hip: { x: 0.97, y: -0.12, front: false, bend: 1, hand: 'fist' },
  point: { x: 1.85, y: 0.62, front: false, bend: -1, hand: 'point' },
  up: { x: 1.2, y: 1.95, front: false, bend: -1, hand: 'palm' },
  fist: { x: 1.3, y: 1.3, front: false, bend: -1, hand: 'fist' },
  cross: { x: -0.35, y: 0.2, front: true, bend: 1, hand: 'round' },
  shrug: { x: 1.45, y: 0.7, front: false, bend: 1, hand: 'palm' },
  cheek: { x: 0.55, y: 0.98, front: true, bend: 1, hand: 'palm' },
  chin: { x: 0.18, y: 0.82, front: true, bend: 1, hand: 'round' },
  facepalm: { x: 0.12, y: 1.28, front: true, bend: 1, hand: 'palm' },
  reach: { x: 1.75, y: 1.0, front: false, bend: -1, hand: 'palm' },
  hold: { x: 0.4, y: -0.3, front: true, bend: 1, hand: 'round' },
};
const L1 = 0.55, L2 = 0.5; // upper arm and forearm (R)

function armTarget(p: ArmPose, side: number, t: number): { x: number; y: number } {
  const a = ARM[p];
  let x = a.x, y = a.y;
  if (p === 'wave') { x += 0.16 * Math.sin(t * 14); y += 0.05 * Math.cos(t * 14); }
  if (p === 'fist') y += 0.14 * Math.abs(Math.sin(t * 9));
  if (p === 'shrug') y += 0.05 * Math.sin(t * 6);
  return { x: side * x, y };
}

/** Draw one arm (side -1 = viewer's left) from its shoulder to a target, with an elbow by two-bone IK. */
function drawArm(c: C, R: number, side: number, pose: ArmPose, from: ArmPose | null, u: number, t: number) {
  const sx = side * 0.86 * R, sy = 0.25 * R;
  let tg = armTarget(pose, side, t);
  if (from && u < 1) { const f = armTarget(from, side, t); tg = { x: f.x + (tg.x - f.x) * u, y: f.y + (tg.y - f.y) * u }; }
  let tx = tg.x * R - sx, ty = tg.y * R - sy;
  const reach = (L1 + L2) * R * 0.999, d = Math.min(reach, Math.hypot(tx, ty)) || 1e-6;
  const ang = Math.atan2(ty, tx);
  tx = Math.cos(ang) * d; ty = Math.sin(ang) * d;
  const cosA = (L1 * L1 * R * R + d * d - L2 * L2 * R * R) / (2 * L1 * R * d);
  const bend = ARM[pose].bend * side;
  const ea = ang + bend * Math.acos(Math.max(-1, Math.min(1, cosA)));
  const ex = sx + Math.cos(ea) * L1 * R, ey = sy + Math.sin(ea) * L1 * R;
  const hx = sx + tx, hy = sy + ty;
  if (BASE) {
    const p = BASE.multiply(c.getTransform()).transformPoint(new DOMPoint(hx, hy));
    HANDS = HANDS ?? { l: { x: 0, y: 0 }, r: { x: 0, y: 0 } };
    HANDS[side < 0 ? 'l' : 'r'] = { x: p.x, y: p.y };
  }
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = OUT; c.lineWidth = 0.15 * R;
  c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.lineTo(hx, hy); c.stroke();
  c.strokeStyle = STONE; c.lineWidth = 0.1 * R;
  c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.lineTo(hx, hy); c.stroke();
  const kind = ARM[pose].hand, hr = (kind === 'fist' ? 0.15 : 0.12) * R;
  c.fillStyle = STONE; c.strokeStyle = OUT; c.lineWidth = 0.03 * R;
  c.beginPath();
  if (kind === 'fist') c.roundRect(hx - hr, hy - hr * 0.9, 2 * hr, 1.8 * hr, hr * 0.5);
  else circle(c, hx, hy, hr);
  c.fill(); c.stroke();
  if (kind === 'palm') { // three little fingers
    const fa = Math.atan2(hy - ey, hx - ex);
    for (const k of [-0.6, 0, 0.6]) {
      c.beginPath(); circle(c, hx + Math.cos(fa + k) * hr * 1.05, hy + Math.sin(fa + k) * hr * 1.05, hr * 0.42); c.fill(); c.stroke();
    }
  } else if (kind === 'point') {
    const fa = Math.atan2(hy - ey, hx - ex);
    c.lineWidth = 0.07 * R; c.strokeStyle = OUT;
    c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx + Math.cos(fa) * hr * 2.1, hy + Math.sin(fa) * hr * 2.1); c.stroke();
    c.lineWidth = 0.045 * R; c.strokeStyle = STONE;
    c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx + Math.cos(fa) * hr * 2.0, hy + Math.sin(fa) * hr * 2.0); c.stroke();
  }
  if (PROP && PROP.side === side) { // held: drawn in canvas orientation (y down) at the hand
    c.save(); c.translate(hx, hy); c.scale(1, -1);
    PROP.draw(c, R);
    c.restore();
  }
}

function poses(o: RaiOpts): { now: [ArmPose, ArmPose]; from: [ArmPose, ArmPose] | null } {
  const pair = (a: ArmPose | [ArmPose, ArmPose]): [ArmPose, ArmPose] => (Array.isArray(a) ? a : [a, a]);
  if (o.arms) return { now: pair(o.arms), from: o.armsFrom ? pair(o.armsFrom) : null };
  const w = o.wave ?? 0;
  return { now: ['down', w > 0.5 ? 'wave' : 'down'], from: null };
}

// ------------------------------------------------------------------ Rai

/**
 * Draw Rai with her disc's centre at (x, y) (canvas px) and disc radius R. She is about 3.2 R tall: feet at
 * y + 1.07 R, the top of her hair at about y - 2.1 R. Returns her anchors (head, heart, feet) in canvas px, for marks,
 * speech bubbles and effects.
 */
export function drawRai(c: C, x: number, y: number, R: number, o: RaiOpts): Anchors {
  const t = o.t, face = o.face ?? 'smile', glow = o.glow ?? '#2fe0ff', gs = o.glowStrength ?? 1;
  const sq = Math.max(-1, Math.min(1, o.squash ?? 0)), sx = 1 - sq * 0.22, sy = 1 + sq * 0.25;
  const hop = (o.hop ?? 0) * R, k = frameIdx(t);
  const jx = (o.shake ?? 0) * R * 0.05 * (h01(k, 1, 7) - 0.5), jy = (o.shake ?? 0) * R * 0.05 * (h01(k, 2, 7) - 0.5);
  HANDS = null; PROP = o.prop ?? null;
  BASE = c.getTransform().inverse();
  c.save();
  c.translate(x + jx, y - hop + jy);
  c.scale(1, -1);
  c.rotate(-(o.tilt ?? 0));
  c.translate(0, -1.07 * R); c.scale(sx, sy); c.translate(0, 1.07 * R);
  c.lineCap = 'round'; c.lineJoin = 'round';

  if (o.sd) {
    drawChibi(c, R, o, face, glow, gs);
  } else {
    drawFull(c, R, o, face, glow, gs);
  }
  c.restore();
  BASE = null; PROP = null;

  const headLocal = o.sd ? 0.55 : 1.2, headR = (o.sd ? 0.95 : 0.74) * R * (sx + sy) / 2;
  const toCanvasY = (ly: number) => y - hop + jy - (-1.07 * R + (ly + 1.07 * R) * sy);
  const anchors: Anchors = {
    head: { x: x + jx - Math.sin(o.tilt ?? 0) * headLocal * R, y: toCanvasY(headLocal * R), r: headR },
    heart: { x: x + jx, y: toCanvasY((o.sd ? -0.6 : HOLE.y) * R), r: (o.sd ? 0.13 : HOLE.r) * R },
    feet: { x: x + jx, y: y - hop + jy + 1.07 * R },
  };
  if (o.marks?.length) drawMarks(c, anchors, o.marks, t, o.markT0 ?? -1e9);
  return anchors;
}

function drawFull(c: C, R: number, o: RaiOpts, face: Face, glow: string, gs: number) {
  const t = o.t, { now, from } = poses(o), u = o.armsU ?? 1;

  // the arms that are behind her, and her feet
  for (const i of [0, 1]) if (!ARM[now[i]!].front) drawArm(c, R, i ? 1 : -1, now[i]!, from ? from[i]! : null, u, t);
  for (const s of [-1, 1]) fillEll(c, s * 0.32 * R - 0.16 * R, -1.07 * R, 0.32 * R, 0.16 * R, STONE_DARK);

  // the disc with its hole, glowing at every edge
  const hr = HOLE.r * R, hy = HOLE.y * R;
  const body = () => { c.beginPath(); circle(c, 0, 0, R); circle(c, 0, hy, hr); };
  c.save();
  c.shadowColor = glow; c.shadowBlur = 0.45 * R * gs;
  body(); c.fillStyle = STONE; c.fill('evenodd');
  c.restore();
  const stoneGrad = (cx: number, cy: number, r: number) => {
    const g = c.createRadialGradient(cx - 0.35 * r, cy + 0.45 * r, 0, cx, cy, 1.05 * r);
    g.addColorStop(0, '#f3ecdc'); g.addColorStop(0.55, '#d4c9b1'); g.addColorStop(1, '#a99d86');
    return g;
  };
  c.save();
  body(); c.clip('evenodd');
  c.fillStyle = stoneGrad(0, 0, R); c.fillRect(-1.1 * R, -1.1 * R, 2.2 * R, 2.2 * R);
  for (let i = 0; i < 140; i++) { // limestone: speckles and pits
    const a = h01(i, 71) * TAU, d = Math.sqrt(h01(i, 72)) * 0.95, s = (0.012 + 0.03 * h01(i, 73)) * R;
    fillEll(c, Math.cos(a) * d * R - s, Math.sin(a) * d * R - s, 2 * s, 2 * s, h01(i, 74) < 0.7 ? 'rgba(125,115,95,0.35)' : 'rgba(255,255,255,0.4)');
  }
  // barnacles, in clusters on the shoulders, around the base and one low on her front (his note: barnacles, not moss)
  const clusters = [0.62, 1.15, 2.05, 2.55, 3.85, 4.65, 5.45].map((a) => [Math.cos(a) * 0.84 * R, Math.sin(a) * 0.84 * R]);
  clusters.push([-0.52 * R, -0.5 * R]);
  clusters.forEach(([cx, cy], ci) => {
    const n = 3 + Math.floor(h01(ci, 81) * 4);
    for (let i = 0; i < n; i++) {
      const a = h01(ci, i, 82) * TAU, d = h01(ci, i, 83) * 0.13 * R;
      barnacle(c, cx! + Math.cos(a) * d, cy! + Math.sin(a) * d, (0.038 + 0.05 * h01(ci, i, 84)) * R, ci * 10 + i);
    }
  });
  c.restore();
  // the rims: the disc's edge, and the hole's inner wall (the stone's thickness, lit from above)
  c.strokeStyle = RIM; c.lineWidth = 0.035 * R;
  c.beginPath(); circle(c, 0, 0, R); c.stroke();
  c.save();
  c.beginPath(); circle(c, 0, hy, hr); c.clip();
  const heart = o.heart ?? 0;
  if (heart > 0) { // her heart glows: light inside the hole
    const g = c.createRadialGradient(0, hy, 0, 0, hy, hr * 1.1);
    const hc = o.heartColor ?? '#ff4f9a';
    g.addColorStop(0, withAlpha(hc, 0.95 * heart)); g.addColorStop(0.6, withAlpha(hc, 0.55 * heart)); g.addColorStop(1, withAlpha(hc, 0.1 * heart));
    c.fillStyle = g; c.fillRect(-hr, hy - hr, 2 * hr, 2 * hr);
  }
  c.beginPath(); circle(c, 0, hy, hr); circle(c, 0, hy - 0.09 * R, hr * 0.98);
  c.fillStyle = '#5b5345'; c.fill('evenodd');
  c.restore();
  c.strokeStyle = '#4a4337'; c.lineWidth = 0.03 * R;
  c.beginPath(); circle(c, 0, hy, hr); c.stroke();
  if (heart > 0) {
    c.save(); c.shadowColor = o.heartColor ?? '#ff4f9a'; c.shadowBlur = 0.4 * R * heart;
    c.strokeStyle = withAlpha(o.heartColor ?? '#ff4f9a', 0.6 * heart); c.lineWidth = 0.02 * R;
    c.beginPath(); circle(c, 0, hy, hr * 0.98); c.stroke(); c.restore();
  }

  // the head: a round pebble of the same stone, resting on the disc, its shadow on the disc below it
  const Hr = 0.74 * R, hcx = 0, hcy = 1.2 * R;
  c.save();
  body(); c.clip('evenodd');
  fillEll(c, -0.7 * Hr, hcy - Hr - 0.12 * Hr, 1.4 * Hr, 0.36 * Hr, 'rgba(58,51,40,0.3)');
  c.restore();

  // a fine gold chain and Coprime's 3:2 harmonograph knot as the pendant, above the hole that is her heart
  c.save();
  c.shadowColor = 'rgba(255,213,106,0.95)'; c.shadowBlur = 0.08 * R;
  c.strokeStyle = GOLD; c.lineWidth = 0.02 * R;
  c.beginPath(); c.moveTo(-0.62 * R, 0.7 * R); c.quadraticCurveTo(0, 0.08 * R, 0.62 * R, 0.7 * R); c.stroke();
  const pcy = 0.29 * R, ps = 0.085 * R;
  c.lineWidth = 0.026 * R;
  c.beginPath();
  for (let i = 0; i <= 160; i++) {
    const v = (i / 160) * TAU;
    const px = Math.sin(3 * v + Math.PI / 2) * ps * 1.2, py = pcy + Math.sin(2 * v) * ps;
    if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
  }
  c.stroke();
  c.restore();

  // the head's glow falls only outside the disc (inside it reads as a collar)
  const outsideDisc = () => { c.beginPath(); c.rect(-4 * R, -4 * R, 8 * R, 8 * R); circle(c, 0, 0, R * 0.99); c.clip('evenodd'); };
  c.save(); outsideDisc();
  c.shadowColor = glow; c.shadowBlur = 0.35 * R * gs;
  fillEll(c, hcx - Hr, hcy - Hr, 2 * Hr, 2 * Hr, STONE);
  c.restore();
  fillEll(c, hcx - Hr, hcy - Hr, 2 * Hr, 2 * Hr, STONE);
  c.save();
  c.beginPath(); circle(c, hcx, hcy, Hr); c.clip();
  c.fillStyle = stoneGrad(hcx, hcy, Hr); c.fillRect(hcx - 1.1 * Hr, hcy - 1.1 * Hr, 2.2 * Hr, 2.2 * Hr);
  for (let i = 0; i < 60; i++) {
    const a = h01(i, 91) * TAU, d = Math.sqrt(h01(i, 92)) * 0.95, s = (0.01 + 0.02 * h01(i, 93)) * R;
    fillEll(c, hcx + Math.cos(a) * d * Hr - s, hcy + Math.sin(a) * d * Hr - s, 2 * s, 2 * s, h01(i, 94) < 0.7 ? 'rgba(125,115,95,0.25)' : 'rgba(255,255,255,0.35)');
  }
  [0.45, 0.6, 0.78, 2.35, 2.55, 2.7, 1.35, 1.57, 1.8, 1.1, 2.05].forEach((a0, i) => { // barnacles over the crown, clear of the face
    const a = a0 + 0.05 * h01(i, 95);
    barnacle(c, hcx + Math.cos(a) * 0.86 * Hr, hcy + Math.sin(a) * 0.86 * Hr, (0.026 + 0.026 * h01(i, 96)) * R, 200 + i);
  });
  for (let i = 0; i < 6; i++) { // a few pits and cracks of an old rock on her brow
    const px = hcx + (h01(i, 97) - 0.5) * 1.1 * Hr, py = hcy + (0.55 + 0.25 * h01(i, 98)) * Hr;
    fillEll(c, px - 0.025 * R, py - 0.018 * R, 0.05 * R, 0.036 * R, 'rgba(110,100,82,0.4)');
  }
  c.restore();
  c.strokeStyle = RIM; c.lineWidth = 0.035 * R;
  c.beginPath(); circle(c, hcx, hcy, Hr); c.stroke();

  // the face (face units: 1.45 head radii, eyes a little above the head's centre)
  c.save();
  c.translate(hcx, hcy - 0.5 * Hr);
  drawFace(c, 1.45 * Hr, t, face, o);
  c.restore();
  starfish(c, hcx + 0.5 * Hr, hcy + 0.72 * Hr, 0.19 * Hr, Hr);

  // the arms in front of her (crossed, at the cheeks, the chin, a facepalm, holding)
  for (const i of [0, 1]) if (ARM[now[i]!].front) drawArm(c, R, i ? 1 : -1, now[i]!, from ? from[i]! : null, u, t);
}

/** A barnacle seen from the front: a pale cone of plates around a dark opening, lit from the top left. */
function barnacle(c: C, x: number, y: number, s: number, seed: number) {
  const q = 0.84;
  fillEll(c, x - 1.05 * s, y - q * s - 0.14 * s, 2.1 * s, 2 * q * s, 'rgba(58,53,45,0.35)');
  fillEll(c, x - s, y - q * s, 2 * s, 2 * q * s, '#d3ccbd');
  fillEll(c, x - 0.82 * s, y - 0.05 * s, 1.05 * s, 0.8 * q * s, 'rgba(247,244,236,0.75)');
  c.strokeStyle = 'rgba(143,135,120,0.85)'; c.lineWidth = 0.075 * s;
  c.beginPath();
  for (let kk = 0; kk < 6; kk++) {
    const a = (kk / 6) * TAU + 0.4 * h01(seed, kk, 7);
    c.moveTo(x + Math.cos(a) * 0.42 * s, y + Math.sin(a) * 0.42 * q * s);
    c.lineTo(x + Math.cos(a) * 0.95 * s, y + Math.sin(a) * 0.95 * q * s);
  }
  c.stroke();
  c.beginPath(); ell(c, x - 0.36 * s, y - 0.2 * s, 0.72 * s, 0.46 * s);
  c.fillStyle = '#2c2823'; c.fill();
  c.strokeStyle = '#ece8de'; c.lineWidth = 0.08 * s; c.stroke();
}

// ------------------------------------------------------------------ the starfish on her crown

function starfish(c: C, sx: number, sy: number, sr: number, Hr: number) {
  c.beginPath();
  for (let kk = 0; kk < 10; kk++) {
    const a = (kk * Math.PI) / 5 + 0.35 + Math.PI / 2, r = kk % 2 === 0 ? sr : sr * 0.45;
    const x = sx + Math.cos(a) * r, y = sy + Math.sin(a) * r;
    if (kk === 0) c.moveTo(x, y); else c.lineTo(x, y);
  }
  c.closePath();
  c.lineWidth = 0.07 * Hr; c.strokeStyle = '#ff7a6b'; c.fillStyle = '#ff7a6b'; c.fill(); c.stroke();
  for (let kk = 0; kk < 5; kk++) {
    const a = (kk * 2 * Math.PI) / 5 + 0.35 + Math.PI / 2;
    for (const d of [0.3, 0.55]) fillEll(c, sx + Math.cos(a) * sr * d - 0.018 * Hr, sy + Math.sin(a) * sr * d - 0.018 * Hr, 0.036 * Hr, 0.036 * Hr, '#ffd2c4');
  }
}

// ------------------------------------------------------------------ the face

type EyeK = 'open' | 'big' | 'happy' | 'sleep' | 'half' | 'angry' | 'sparkle' | 'heart' | 'spiral' | 'dot' | 'white' | 'teary' | 'cry' | 'shadow' | 'flat';
type MouthK = 'smile' | 'grin' | 'o' | 'soft' | 'smirk' | 'teeth' | 'wail' | 'wobble' | 'flat' | 'tongue' | 'evil' | 'cat' | 'drop';
type BrowK = 'none' | 'soft' | 'angry' | 'raised' | 'up' | 'firm' | 'sad' | 'level';
interface FaceDef { l: EyeK; r: EyeK; m: MouthK; b: BrowK; blush?: number; tears?: 'drop' | 'stream'; lines?: boolean; glint?: boolean }
const FACE_DEF: Record<Face, FaceDef> = {
  smile: { l: 'open', r: 'open', m: 'smile', b: 'none' },
  wink: { l: 'open', r: 'happy', m: 'smirk', b: 'none' },
  grin: { l: 'happy', r: 'happy', m: 'grin', b: 'none' },
  wow: { l: 'big', r: 'big', m: 'o', b: 'up' },
  soft: { l: 'open', r: 'open', m: 'soft', b: 'soft' },
  fierce: { l: 'open', r: 'open', m: 'grin', b: 'firm' },
  asleep: { l: 'sleep', r: 'sleep', m: 'o', b: 'none' },
  angry: { l: 'angry', r: 'angry', m: 'teeth', b: 'angry', blush: 1 },
  sassy: { l: 'half', r: 'half', m: 'smirk', b: 'raised' },
  cheeky: { l: 'open', r: 'happy', m: 'tongue', b: 'none' },
  sad: { l: 'teary', r: 'teary', m: 'wobble', b: 'sad', tears: 'drop' },
  cry: { l: 'cry', r: 'cry', m: 'wail', b: 'sad', tears: 'stream' },
  joy: { l: 'sparkle', r: 'sparkle', m: 'grin', b: 'up' },
  shock: { l: 'white', r: 'white', m: 'drop', b: 'up', lines: true },
  smug: { l: 'half', r: 'half', m: 'cat', b: 'firm' },
  love: { l: 'heart', r: 'heart', m: 'smile', b: 'none', blush: 1 },
  dizzy: { l: 'spiral', r: 'spiral', m: 'wobble', b: 'none' },
  deadpan: { l: 'dot', r: 'dot', m: 'flat', b: 'none' },
  scheme: { l: 'shadow', r: 'shadow', m: 'evil', b: 'angry' },
  determined: { l: 'open', r: 'open', m: 'soft', b: 'firm', glint: true },
  serious: { l: 'open', r: 'open', m: 'flat', b: 'level' },
};

function drawFace(c: C, R: number, t: number, face: Face, o: RaiOpts) {
  const def = FACE_DEF[face];
  const ex = EYES.x * R, ey = EYES.y * R, look = (o.look ?? 0) * 0.025 * R;
  const blink = !o.noBlink && t % 3.7 < 0.12;
  // cheeks
  const blush = Math.min(1, (def.blush ?? 0.5) + (o.blush ?? 0));
  for (const s of [-1, 1]) fillEll(c, s * 0.5 * R - 0.1 * R, 0.2 * R - 0.05 * R, 0.2 * R, 0.1 * R, `rgba(255,122,168,${face === 'angry' ? 0.75 : 0.5 * blush + 0.1})`);
  if (blush > 0.7) { // embarrassed hatching
    c.strokeStyle = 'rgba(230,70,120,0.7)'; c.lineWidth = 0.012 * R;
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
      const bx = s * 0.5 * R - 0.06 * R + i * 0.05 * R;
      c.beginPath(); c.moveTo(bx, 0.17 * R); c.lineTo(bx + 0.03 * R, 0.23 * R); c.stroke();
    }
  }
  if (def.lines) { // shock: blue lines over the upper face
    c.save();
    c.beginPath(); c.arc(0, 0.345 * R, 0.66 * R, 0, TAU); c.clip();
    c.strokeStyle = 'rgba(70,90,200,0.7)'; c.lineWidth = 0.012 * R;
    for (let i = 0; i < 11; i++) {
      const lx = -0.42 * R + i * 0.084 * R;
      c.beginPath(); c.moveTo(lx, 1.0 * R); c.lineTo(lx, (0.62 + 0.05 * Math.sin(i * 1.7)) * R); c.stroke();
    }
    c.restore();
  }
  const blinkable = (k: EyeK) => k === 'open' || k === 'big' || k === 'half' || k === 'teary' || k === 'sparkle' || k === 'angry';
  for (const s of [-1, 1]) {
    const k = s < 0 ? def.l : def.r;
    eye(c, R, s, s * ex, ey, blink && blinkable(k) ? 'sleep' : k, t, look, def.glint ?? false);
  }
  brows(c, R, def.b, ex, ey);
  mouth(c, R, def.m, t);
  if (def.tears === 'drop') tearDrop(c, R, -ex, ey, t);
  if (def.tears === 'stream') for (const s of [-1, 1]) tearStream(c, R, s * ex, ey, t, s);
}

/** Open-eye body (the iris, pupils, highlights, lid and lashes), shared by several eye kinds. */
function openEye(c: C, R: number, s: number, cx: number, cy: number, w: number, h: number, look: number, o: { pupil?: number; sparkle?: boolean; teary?: number; glint?: boolean } = {}) {
  const rx = cx - w / 2, ry = cy - h / 2;
  fillEll(c, rx, ry, w, h, INK);
  const ix = rx + w * 0.12 + look, iy = ry + h * 0.06, iw = w * 0.76, ih = h * 0.8;
  c.save();
  c.beginPath(); ell(c, ix, iy, iw, ih); c.clip();
  const g = c.createLinearGradient(0, iy + ih, 0, iy);
  g.addColorStop(0, '#7a3a0c'); g.addColorStop(1, '#fab852');
  c.fillStyle = g; c.fillRect(ix, iy, iw, ih);
  c.restore();
  const pr = o.pupil ?? 0.32;
  fillEll(c, ix + iw * pr, iy + ih * pr, iw * (1 - 2 * pr), ih * (1 - 2 * pr), INK);
  if (o.sparkle) { // star highlights: joy
    for (const [hx, hy2, hs] of [[0.3, 0.7, 0.3], [0.72, 0.28, 0.16]] as const) {
      const px = rx + w * hx, py = ry + h * hy2, ss = w * hs;
      c.beginPath();
      for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU, r = i % 2 === 0 ? ss : ss * 0.3; i ? c.lineTo(px + Math.cos(a) * r, py + Math.sin(a) * r) : c.moveTo(px + r, py); }
      c.closePath(); c.fillStyle = '#ffffff'; c.fill();
    }
  } else {
    fillEll(c, rx + w * 0.18, ry + h - h * 0.42, w * 0.36, w * 0.36, '#ffffff');
    fillEll(c, rx + w - w * 0.36, ry + h * 0.18, w * 0.14, w * 0.14, '#ffffff');
  }
  if (o.teary) { // tears welling: a bright wobbling band low in the eye
    c.save();
    c.beginPath(); ell(c, rx, ry, w, h); c.clip();
    c.fillStyle = `rgba(190,235,255,${0.55 * o.teary})`;
    c.beginPath();
    c.moveTo(rx, ry + h * 0.38);
    for (let i = 0; i <= 8; i++) c.lineTo(rx + (w * i) / 8, ry + h * (0.38 + 0.04 * Math.sin(t0() * 9 + i)));
    c.lineTo(rx + w, ry); c.lineTo(rx, ry); c.closePath(); c.fill();
    c.restore();
  }
  if (o.glint) { // determination: a glint across the eye
    c.save(); c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = w * 0.06;
    c.beginPath(); c.moveTo(rx + w * 0.15, ry + h * 0.85); c.lineTo(rx + w * 0.85, ry + h * 0.55); c.stroke(); c.restore();
  }
  lidAndLashes(c, R, s, rx, ry, w, h);
}
let T_NOW = 0;
const t0 = () => T_NOW;

function lidAndLashes(c: C, R: number, s: number, rx: number, ry: number, w: number, h: number) {
  c.save();
  c.translate(rx + w / 2, ry + h / 2); c.scale(1, h / w);
  c.beginPath(); c.arc(0, 0, w * 0.53, 0.2, Math.PI - 0.2, false);
  c.restore();
  c.strokeStyle = INK; c.lineWidth = 0.042 * R; c.stroke();
  [0.18, 0.5, 0.85].forEach((a, k) => {
    const ang = s > 0 ? a : Math.PI - a;
    const px = rx + w / 2 + Math.cos(ang) * w * 0.53, py = ry + h / 2 + Math.sin(ang) * h * 0.53;
    const len = (0.075 - 0.012 * k) * R;
    c.lineWidth = 0.026 * R;
    c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo(px + s * len * 0.25, py + len * 0.65, px + s * len * 0.9, py + len * (0.55 + 0.25 * k)); c.stroke();
  });
}

function eye(c: C, R: number, s: number, cx: number, cy: number, k: EyeK, t: number, look: number, glint: boolean) {
  T_NOW = t;
  const w = 0.2 * R, h = 0.27 * R;
  c.strokeStyle = INK; c.lineCap = 'round';
  switch (k) {
    case 'open': openEye(c, R, s, cx, cy, w, h, look, { glint }); break;
    case 'big': openEye(c, R, s, cx, cy, 0.24 * R, 0.3 * R, look, { pupil: 0.18 }); break;
    case 'sparkle': openEye(c, R, s, cx, cy, 0.24 * R, 0.31 * R, look, { pupil: 0.22, sparkle: true }); break;
    case 'teary': openEye(c, R, s, cx, cy, 0.23 * R, 0.3 * R, look, { pupil: 0.24, teary: 1 }); break;
    case 'half': { // half-lidded: the top 45% hidden under a heavy lid, sliding a little
      c.save();
      c.beginPath(); c.rect(cx - w, cy - h, 2 * w, h * 1.05); c.clip();
      openEye(c, R, s, cx, cy, w, h, look + s * 0.02 * R);
      c.restore();
      c.strokeStyle = INK; c.lineWidth = 0.05 * R;
      c.beginPath(); c.moveTo(cx - w * 0.6, cy + h * 0.06 - s * 0.01 * R); c.lineTo(cx + w * 0.6, cy + h * 0.06 + s * 0.01 * R); c.stroke();
      c.lineWidth = 0.026 * R;
      c.beginPath(); c.moveTo(cx + s * w * 0.55, cy + h * 0.06); c.lineTo(cx + s * w * 0.85, cy + h * 0.2); c.stroke();
      break;
    }
    case 'angry': { // open, with a hard lid slanting down to the nose
      const inner = -s;
      c.save();
      c.beginPath();
      c.moveTo(cx - w, cy - h); c.lineTo(cx + w, cy - h);
      c.lineTo(cx + w, cy + h * (inner > 0 ? -0.05 : 0.35)); c.lineTo(cx - w, cy + h * (inner > 0 ? 0.35 : -0.05)); c.closePath();
      c.clip();
      openEye(c, R, s, cx, cy, w, h * 0.95, look, { pupil: 0.3 });
      c.restore();
      c.strokeStyle = INK; c.lineWidth = 0.055 * R;
      c.beginPath(); c.moveTo(cx - w * 0.6, cy + h * (inner > 0 ? -0.02 : 0.32)); c.lineTo(cx + w * 0.6, cy + h * (inner > 0 ? 0.32 : -0.02)); c.stroke();
      break;
    }
    case 'happy': { // ^ with a lash
      const y0 = cy - 0.02 * R;
      c.lineWidth = 0.045 * R;
      c.beginPath(); c.moveTo(cx - 0.1 * R, y0); c.quadraticCurveTo(cx, y0 + 0.13 * R, cx + 0.1 * R, y0); c.stroke();
      c.lineWidth = 0.024 * R;
      c.beginPath(); c.moveTo(cx + s * 0.1 * R, y0); c.lineTo(cx + s * 0.16 * R, y0 + 0.035 * R); c.stroke();
      break;
    }
    case 'sleep': { // a closed curve with lashes resting along it
      const y0 = cy - 0.02 * R;
      c.lineWidth = 0.045 * R;
      c.beginPath(); c.moveTo(cx - 0.1 * R, y0); c.quadraticCurveTo(cx, y0 - 0.1 * R, cx + 0.1 * R, y0); c.stroke();
      c.lineWidth = 0.024 * R;
      for (const u of [0.35, 0.6, 0.85]) {
        const x = cx + s * (u - 0.5) * 0.2 * R, yc = y0 - 0.2 * R * u * (1 - u);
        c.beginPath(); c.moveTo(x, yc); c.lineTo(x + s * 0.02 * R, yc - 0.045 * R); c.stroke();
      }
      break;
    }
    case 'cry': { // squeezed shut: > <
      c.lineWidth = 0.05 * R;
      const d = -s * 0.1 * R;
      c.beginPath(); c.moveTo(cx - d, cy + 0.08 * R); c.lineTo(cx + d, cy); c.lineTo(cx - d, cy - 0.08 * R); c.stroke();
      break;
    }
    case 'white': { // shock: white eyes, pin pupils
      fillEll(c, cx - 0.13 * R, cy - 0.16 * R, 0.26 * R, 0.32 * R, '#ffffff');
      c.lineWidth = 0.035 * R; c.beginPath(); ell(c, cx - 0.13 * R, cy - 0.16 * R, 0.26 * R, 0.32 * R); c.stroke();
      fillEll(c, cx - 0.022 * R + Math.sin(t * 40) * 0.008 * R, cy - 0.022 * R, 0.044 * R, 0.044 * R, INK);
      break;
    }
    case 'dot': fillEll(c, cx - 0.035 * R, cy - 0.035 * R, 0.07 * R, 0.07 * R, INK); break;
    case 'flat': c.lineWidth = 0.045 * R; c.beginPath(); c.moveTo(cx - 0.09 * R, cy); c.lineTo(cx + 0.09 * R, cy); c.stroke(); break;
    case 'heart': {
      const hs = 0.15 * R * (1 + 0.1 * Math.sin(t * 10));
      c.save(); c.translate(cx, cy); c.scale(1, -1);
      c.beginPath();
      c.moveTo(0, hs * 0.55); c.bezierCurveTo(-hs * 1.2, -hs * 0.3, -hs * 0.55, -hs * 1.1, 0, -hs * 0.45);
      c.bezierCurveTo(hs * 0.55, -hs * 1.1, hs * 1.2, -hs * 0.3, 0, hs * 0.55);
      c.fillStyle = '#ff4f9a'; c.fill(); c.lineWidth = 0.02 * R; c.strokeStyle = '#a3164f'; c.stroke();
      fillEll(c, -hs * 0.55, -hs * 0.65, hs * 0.3, hs * 0.22, 'rgba(255,255,255,0.85)');
      c.restore();
      break;
    }
    case 'spiral': {
      c.lineWidth = 0.025 * R;
      c.beginPath();
      for (let i = 0; i <= 60; i++) {
        const a = (i / 60) * TAU * 2.5 + t * 8 * s, r = (i / 60) * 0.13 * R;
        const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
        i ? c.lineTo(px, py) : c.moveTo(px, py);
      }
      c.stroke();
      break;
    }
    case 'shadow': { // Team Rocket scheming: eyes in shadow, two gleaming slits
      fillEll(c, cx - 0.15 * R, cy - 0.12 * R, 0.3 * R, 0.26 * R, 'rgba(40,10,50,0.85)');
      c.save();
      c.shadowColor = '#ffffff'; c.shadowBlur = 0.06 * R;
      c.fillStyle = '#ffffff';
      c.beginPath(); c.ellipse(cx, cy + 0.01 * R, 0.08 * R, 0.022 * R, s * 0.35, 0, TAU); c.fill();
      c.restore();
      break;
    }
  }
}

function brows(c: C, R: number, b: BrowK, ex: number, ey: number) {
  if (b === 'none') return;
  const pairs: Record<Exclude<BrowK, 'none'>, [number, number, number]> = { // inner, outer (in R above the eye centre), thickness
    soft: [0.24, 0.2, 0.026], angry: [0.13, 0.28, 0.045], raised: [0.22, 0.22, 0.03], up: [0.33, 0.31, 0.03],
    firm: [0.16, 0.24, 0.035], sad: [0.31, 0.17, 0.03], level: [0.22, 0.22, 0.034],
  };
  for (const s of [-1, 1]) {
    let [inner, outer, th] = pairs[b];
    if (b === 'raised' && s > 0) { inner = 0.33; outer = 0.31; }
    c.strokeStyle = INK; c.lineWidth = th * R; c.lineCap = 'round';
    const ax = s * (ex - 0.09 * R), ay = ey + inner * R, bx = s * (ex + 0.11 * R), by = ey + outer * R;
    c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo((ax + bx) / 2, Math.max(ay, by) + 0.035 * R, bx, by); c.stroke();
  }
}

function mouth(c: C, R: number, k: MouthK, t: number) {
  const my = 0.12 * R;
  c.strokeStyle = '#8a3446'; c.lineWidth = 0.032 * R; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath();
  switch (k) {
    case 'smile': c.moveTo(-0.09 * R, my + 0.03 * R); c.quadraticCurveTo(0, my - 0.07 * R, 0.09 * R, my + 0.03 * R); c.stroke(); break;
    case 'grin': {
      c.moveTo(-0.12 * R, my + 0.04 * R); c.lineTo(0.12 * R, my + 0.04 * R); c.quadraticCurveTo(0, my - 0.16 * R, -0.12 * R, my + 0.04 * R);
      c.fillStyle = '#6b1f2a'; c.fill();
      c.save(); c.clip(); fillEll(c, -0.06 * R, my - 0.1 * R, 0.12 * R, 0.08 * R, '#ff7a8a'); c.restore();
      break;
    }
    case 'o': fillEll(c, -0.045 * R, my - 0.06 * R, 0.09 * R, 0.11 * R, '#6b1f2a'); break;
    case 'soft': c.moveTo(-0.05 * R, my); c.quadraticCurveTo(0, my - 0.03 * R, 0.05 * R, my); c.stroke(); break;
    case 'smirk': c.moveTo(-0.1 * R, my); c.quadraticCurveTo(0.02 * R, my - 0.06 * R, 0.11 * R, my + 0.05 * R); c.stroke(); break;
    case 'flat': c.moveTo(-0.07 * R, my); c.lineTo(0.07 * R, my); c.stroke(); break;
    case 'cat': // :3
      c.moveTo(-0.08 * R, my + 0.02 * R); c.quadraticCurveTo(-0.04 * R, my - 0.05 * R, 0, my + 0.01 * R);
      c.quadraticCurveTo(0.04 * R, my - 0.05 * R, 0.08 * R, my + 0.02 * R); c.stroke(); break;
    case 'wobble': {
      for (let i = 0; i <= 10; i++) {
        const x = -0.09 * R + (i / 10) * 0.18 * R, y = my + 0.012 * R * Math.sin(i * 1.9 + t * 14);
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.stroke();
      break;
    }
    case 'teeth': { // gritted
      c.roundRect(-0.13 * R, my - 0.05 * R, 0.26 * R, 0.09 * R, 0.03 * R);
      c.fillStyle = '#ffffff'; c.fill(); c.lineWidth = 0.022 * R; c.strokeStyle = '#6b1f2a'; c.stroke();
      c.beginPath(); c.moveTo(-0.13 * R, my - 0.005 * R); c.lineTo(0.13 * R, my - 0.005 * R);
      for (const x of [-0.065, 0, 0.065]) { c.moveTo(x * R, my - 0.05 * R); c.lineTo(x * R, my + 0.04 * R); }
      c.lineWidth = 0.012 * R; c.stroke();
      break;
    }
    case 'evil': { // a wide crescent of teeth, corners up
      c.moveTo(-0.2 * R, my + 0.06 * R); c.quadraticCurveTo(0, my - 0.16 * R, 0.2 * R, my + 0.06 * R);
      c.quadraticCurveTo(0, my - 0.04 * R, -0.2 * R, my + 0.06 * R);
      c.fillStyle = '#ffffff'; c.fill(); c.lineWidth = 0.02 * R; c.strokeStyle = '#3a1020'; c.stroke();
      c.beginPath();
      for (let i = -3; i <= 3; i++) { const x = i * 0.05 * R; c.moveTo(x, my + 0.02 * R - Math.abs(i) * 0.0 * R); c.lineTo(x, my - 0.06 * R + Math.abs(i) * 0.012 * R); }
      c.lineWidth = 0.01 * R; c.stroke();
      break;
    }
    case 'tongue': {
      c.moveTo(-0.08 * R, my + 0.02 * R); c.quadraticCurveTo(0, my - 0.06 * R, 0.08 * R, my + 0.02 * R); c.stroke();
      fillEll(c, 0.0, my - 0.11 * R, 0.07 * R, 0.09 * R, '#ff7a8a');
      c.strokeStyle = '#c94a65'; c.lineWidth = 0.008 * R; c.beginPath(); c.moveTo(0.035 * R, my - 0.03 * R); c.lineTo(0.035 * R, my - 0.09 * R); c.stroke();
      break;
    }
    case 'wail': { // a big wavering open mouth
      const wob = 0.01 * R * Math.sin(t * 20);
      c.moveTo(-0.14 * R, my + 0.04 * R); c.lineTo(0.14 * R, my + 0.04 * R + wob);
      c.quadraticCurveTo(0.1 * R, my - 0.2 * R, 0, my - 0.2 * R - wob); c.quadraticCurveTo(-0.1 * R, my - 0.2 * R, -0.14 * R, my + 0.04 * R);
      c.fillStyle = '#6b1f2a'; c.fill();
      c.save(); c.clip(); fillEll(c, -0.07 * R, my - 0.22 * R, 0.14 * R, 0.1 * R, '#ff7a8a'); c.restore();
      break;
    }
    case 'drop': { // the jaw drops
      c.ellipse(0, my - 0.12 * R, 0.07 * R, 0.17 * R, 0, 0, TAU);
      c.fillStyle = '#6b1f2a'; c.fill();
      c.save(); c.clip(); fillEll(c, -0.05 * R, my - 0.3 * R, 0.1 * R, 0.08 * R, '#ff7a8a'); c.restore();
      break;
    }
  }
}

function tearDrop(c: C, R: number, cx: number, cy: number, t: number) {
  const u = (t % 1.6) / 1.6, y = cy - 0.12 * R - u * 0.45 * R, s = 0.035 * R * (1 - 0.3 * u);
  c.save(); c.globalAlpha = 1 - u * 0.6;
  c.beginPath(); c.moveTo(cx, y + s * 1.8); c.quadraticCurveTo(cx + s, y, cx, y - s); c.quadraticCurveTo(cx - s, y, cx, y + s * 1.8);
  c.fillStyle = '#bfe9ff'; c.fill(); c.lineWidth = 0.008 * R; c.strokeStyle = '#3b8fd6'; c.stroke();
  c.restore();
}

function tearStream(c: C, R: number, cx: number, cy: number, t: number, s: number) {
  // two comedy waterfalls arcing out and down from the eyes
  c.save();
  const g = c.createLinearGradient(0, cy, 0, cy - 0.9 * R);
  g.addColorStop(0, 'rgba(190,235,255,0.95)'); g.addColorStop(1, 'rgba(190,235,255,0.2)');
  c.strokeStyle = g; c.lineCap = 'round';
  for (let j = 0; j < 3; j++) {
    c.lineWidth = (0.05 - j * 0.012) * R;
    c.beginPath();
    c.moveTo(cx + s * 0.04 * R, cy - 0.04 * R);
    c.quadraticCurveTo(cx + s * (0.25 + 0.04 * j) * R, cy - 0.05 * R, cx + s * (0.3 + 0.05 * j + 0.02 * Math.sin(t * 20 + j)) * R, cy - 0.9 * R);
    c.stroke();
  }
  c.restore();
}

// ------------------------------------------------------------------ chibi (super-deformed)

const SD_EYES: Record<Face, EyeK> = {
  smile: 'open', wink: 'happy', grin: 'happy', wow: 'white', soft: 'open', fierce: 'angry', asleep: 'sleep', angry: 'cry',
  sassy: 'half', cheeky: 'happy', sad: 'teary', cry: 'flat', joy: 'happy', shock: 'white', smug: 'half', love: 'heart',
  dizzy: 'spiral', deadpan: 'dot', scheme: 'shadow', determined: 'angry', serious: 'flat',
};

/** The chibi: a huge head on a tiny disc, flat colours and a thick outline (the comic shift). */
function drawChibi(c: C, R: number, o: RaiOpts, face: Face, glow: string, gs: number) {
  const t = o.t, def = FACE_DEF[face];
  const line = 0.05 * R;
  const outline = (fill: string) => { c.fillStyle = fill; c.fill(); c.lineWidth = line; c.strokeStyle = OUT; c.stroke(); };
  // stubby arms
  const { now } = poses(o);
  for (const i of [0, 1]) {
    const side = i ? 1 : -1, tg = armTarget(now[i]!, side, t);
    const sx = side * 0.45 * R, sy = -0.45 * R, hx = sx + (tg.x * R - side * 0.86 * R) * 0.45, hy = sy + (tg.y * R - 0.25 * R) * 0.45;
    c.lineCap = 'round'; c.strokeStyle = OUT; c.lineWidth = 0.17 * R;
    c.beginPath(); c.moveTo(sx, sy); c.lineTo(hx, hy); c.stroke();
    c.strokeStyle = STONE; c.lineWidth = 0.1 * R; c.stroke();
    c.beginPath(); circle(c, hx, hy, 0.1 * R); outline(STONE);
  }
  // feet and the little disc with its hole
  for (const s of [-1, 1]) { c.beginPath(); ell(c, s * 0.22 * R - 0.14 * R, -1.07 * R, 0.28 * R, 0.16 * R); outline(STONE_DARK); }
  c.save();
  c.shadowColor = glow; c.shadowBlur = 0.3 * R * gs;
  c.beginPath(); circle(c, 0, -0.55 * R, 0.5 * R); circle(c, 0, -0.6 * R, 0.13 * R);
  c.fillStyle = STONE; c.fill('evenodd');
  c.restore();
  c.beginPath(); circle(c, 0, -0.55 * R, 0.5 * R); c.lineWidth = line; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); circle(c, 0, -0.6 * R, 0.13 * R); c.stroke();
  if ((o.heart ?? 0) > 0) { c.beginPath(); circle(c, 0, -0.6 * R, 0.1 * R); c.fillStyle = withAlpha(o.heartColor ?? '#ff4f9a', o.heart!); c.fill(); }
  for (let i = 0; i < 4; i++) { c.beginPath(); circle(c, (-0.3 + i * 0.2) * R, (-0.85 + 0.05 * (i % 2)) * R, 0.035 * R); c.fillStyle = '#ece8de'; c.fill(); }
  // the big head
  const hy = 0.55 * R, Hr = 0.95 * R;
  c.save();
  c.shadowColor = glow; c.shadowBlur = 0.3 * R * gs;
  c.beginPath(); circle(c, 0, hy, Hr); c.fillStyle = STONE; c.fill();
  c.restore();
  c.beginPath(); circle(c, 0, hy, Hr); outline(STONE);
  for (let i = 0; i < 5; i++) { // barnacles on the chibi crown
    const a = 0.7 + i * 0.42;
    c.beginPath(); circle(c, Math.cos(a) * 0.82 * R, hy + Math.sin(a) * 0.82 * R, 0.06 * R); outline('#ece8de');
    c.beginPath(); circle(c, Math.cos(a) * 0.82 * R, hy + Math.sin(a) * 0.82 * R, 0.02 * R); c.fillStyle = OUT; c.fill();
  }
  // face
  c.save();
  c.translate(0, hy - 0.15 * R);
  const ex = 0.36 * R, ey = 0.05 * R, F = 1.7 * R; // face unit for the chibi eye drawers
  const blush = Math.min(1, (def.blush ?? 0.5) + (o.blush ?? 0));
  for (const s of [-1, 1]) fillEll(c, s * 0.55 * R - 0.12 * R, -0.12 * R, 0.24 * R, 0.12 * R, `rgba(255,122,168,${0.35 + 0.4 * blush})`);
  const k = SD_EYES[face];
  for (const s of [-1, 1]) {
    const kk = face === 'wink' && s < 0 ? 'open' : face === 'cheeky' && s < 0 ? 'open' : k;
    if (kk === 'open' || kk === 'teary') { // the chibi eye: a tall glossy oval
      fillEll(c, s * ex - 0.11 * R, ey - 0.17 * R, 0.22 * R, 0.34 * R, INK);
      fillEll(c, s * ex - 0.07 * R, ey + 0.02 * R, 0.08 * R, 0.08 * R, '#ffffff');
      fillEll(c, s * ex + 0.02 * R, ey - 0.1 * R, 0.04 * R, 0.04 * R, '#ffffff');
      if (kk === 'teary') { c.fillStyle = 'rgba(190,235,255,0.6)'; c.fillRect(s * ex - 0.11 * R, ey - 0.17 * R, 0.22 * R, 0.1 * R); }
    } else if (kk === 'cry') { // > <  (angry chibi)
      c.strokeStyle = INK; c.lineWidth = 0.07 * R; c.lineCap = 'round';
      const d = -s * 0.12 * R;
      c.beginPath(); c.moveTo(s * ex - d, ey + 0.1 * R); c.lineTo(s * ex + d, ey); c.lineTo(s * ex - d, ey - 0.1 * R); c.stroke();
    } else {
      eye(c, F, s, s * ex, ey, kk, t, 0, false);
    }
  }
  if (face === 'cry') for (const s of [-1, 1]) tearStream(c, F, s * ex, ey, t, s);
  if (face === 'angry') { // a fang in a shouting mouth
    c.beginPath(); c.moveTo(-0.14 * R, -0.28 * R); c.lineTo(0.14 * R, -0.28 * R); c.lineTo(0, -0.48 * R); c.closePath();
    c.fillStyle = '#6b1f2a'; c.fill();
    c.beginPath(); c.moveTo(0.05 * R, -0.28 * R); c.lineTo(0.1 * R, -0.28 * R); c.lineTo(0.075 * R, -0.34 * R); c.closePath(); c.fillStyle = '#ffffff'; c.fill();
  } else {
    c.translate(0, -0.32 * R);
    mouth(c, F * 0.9, def.m, t);
  }
  c.restore();
  starfish(c, 0.5 * R, hy + 0.7 * R, 0.24 * R, R);
}
