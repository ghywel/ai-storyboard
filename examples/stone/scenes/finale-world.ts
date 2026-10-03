// The finale's world (finale.ts): Yap at dawn as a small perspective set, so every shot of the final chorus is the
// same place seen from a different camera. A cove: the sun coming up over the sea; palms, stilt huts and the island's
// stone-money bank on the flanks; outrigger canoes drawn up at the waterline; a garland of flowers strung between two
// palms (tonight there is a wedding: remember.ts). On the beach, the great ring of people holding hands around Rai,
// and every carer's stone with its owner beside it, emoting as it lights. World units are metres: X right, Y up,
// Z away from the default camera; the ring is centred on the origin, where Rai stands.
import { W, H } from '../engine/gl';
import { HEX } from '../engine/palette';
import { font } from '../engine/type';
import type { Line } from '../engine/lyrics';
import { clamp } from '../engine/util';
import { drawRai, h01, type RaiOpts } from './_rai';
import type { Anchors } from './_manga';
import { FAM, TAU, gradientV, harmonograph, karaoke, mixHex, person, rgbaHex, stone, type C2, type Emote, type Pose } from './_motifs';
import { cloud, hut, palmTree, stoneBank } from './_world';

/** The four chorus neons, cycled per line (cyan, pink, lime, yellow), and the full set for "every colour at once". */
export const NEON = [HEX.cyan, HEX.pink, HEX.lime, HEX.yellow] as const;
export const NEON_ALL = [HEX.cyan, HEX.pink, HEX.lime, HEX.yellow, HEX.violet, HEX.orange, HEX.coral, HEX.peri] as const;
const CLEAR = 'rgba(0,0,0,0)';

/** A sunburst in every neon at once: rays cycling through `cols` over a `base` fill (optionally only above clipY). */
export function burstAll(c: C2, cx: number, cy: number, base: string, cols: readonly string[], rays = 24, spin = 0, o: { clipY?: number; alpha?: number } = {}) {
  c.save();
  if (o.clipY !== undefined) { c.beginPath(); c.rect(0, 0, W, o.clipY); c.clip(); }
  c.globalAlpha *= o.alpha ?? 1;
  if (base !== CLEAR) { c.fillStyle = base; c.fillRect(0, 0, W, H); }
  const R = Math.hypot(W, H) * 1.2;
  for (let k = 0; k < rays; k++) {
    const col = cols[k % cols.length]!;
    if (col === CLEAR) continue;
    const a0 = (k / rays) * TAU + spin, a1 = a0 + (Math.PI / rays) * 1.05;
    c.beginPath();
    c.moveTo(cx, cy);
    c.lineTo(cx + R * Math.cos(a0), cy + R * Math.sin(a0));
    c.lineTo(cx + R * Math.cos(a1), cy + R * Math.sin(a1));
    c.closePath();
    c.fillStyle = col;
    c.fill();
  }
  c.restore();
}

/** The gold harmonograph as a halo behind Rai, glowing in the base layer (the additive layer would draw over her). */
export function haloBehind(c: C2, x: number, y: number, r: number, t: number, a = 1, width = 4, draw = 1, spin = 0.15) {
  c.save();
  const ph = Math.PI / 2 + spin * Math.sin(t * 0.7);
  c.shadowColor = rgbaHex(HEX.gold, 0.9 * a); c.shadowBlur = 24;
  harmonograph(c, x, y, r, { col: rgbaHex(HEX.gold, 0.95 * a), width, draw, phase: ph });
  c.shadowBlur = 8;
  harmonograph(c, x, y, r, { col: rgbaHex('#fff1c4', 0.8 * a), width: width * 0.45, draw, phase: ph });
  c.restore();
}

// ------------------------------------------------------------------ the karaoke band (the film's: balanced rows, the last at H - 100)

function partition(ws: number[], sp: number, k: number): [number, number][] {
  const n = ws.length;
  const width = (a: number, b: number) => ws.slice(a, b).reduce((x, y) => x + y, 0) + sp * (b - a - 1);
  let best: [number, number][] = [[0, n]], bestW = Infinity;
  if (k <= 1 || n < 2) return best;
  const rec = (start: number, left: number, acc: [number, number][], mx: number) => {
    if (left === 1) { const m = Math.max(mx, width(start, n)); if (m < bestW) { bestW = m; best = [...acc, [start, n]]; } return; }
    for (let e = start + 1; e <= n - left + 1; e++) rec(e, left - 1, [...acc, [start, e]], Math.max(mx, width(start, e)));
  };
  rec(0, Math.min(k, n), [], 0);
  return best;
}

/** The line in the bottom band, as turn.ts and the other plates set it, so the seams match. */
export function band(c: C2, line: Line | null | undefined, t: number, o: { sung?: string; unsung?: string; size?: number; dark?: number; maxW?: number; until?: number } = {}) {
  if (!line) return;
  const size = o.size ?? 50, maxW = o.maxW ?? W - 300, until = o.until ?? line.end + 0.35;
  c.save();
  c.font = font(FAM.bold(), size);
  const sp = c.measureText(' ').width, ws = line.words.map((w) => c.measureText(w.w).width);
  c.restore();
  const total = ws.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
  const rows = partition(ws, sp, Math.max(1, Math.ceil(total / maxW)));
  const lh = 1.2 * size, yLast = H - 100, first = line.words[0]!.start;
  const vis = clamp((t - (first - 0.4)) / 0.12) * (1 - clamp((t - until) / 0.2));
  if (vis <= 0) return;
  if ((o.dark ?? 0) > 0) {
    const top = yLast - rows.length * lh - 40;
    const gr = c.createLinearGradient(0, top - 50, 0, H);
    gr.addColorStop(0, rgbaHex(HEX.ink, 0)); gr.addColorStop(0.3, rgbaHex(HEX.ink, (o.dark ?? 0) * vis)); gr.addColorStop(1, rgbaHex(HEX.ink, (o.dark ?? 0) * vis));
    c.fillStyle = gr; c.fillRect(0, top - 50, W, H - top + 50);
  }
  rows.forEach(([a, b], i) => {
    const words = line.words.slice(a, b);
    const sub: Line = { ...line, words, text: words.map((w) => w.w).join(' ') };
    karaoke(c, sub, t, W / 2, yLast - (rows.length - 1 - i) * lh, size, { sung: o.sung, unsung: o.unsung, maxW: 1e5, lead: 0.4 + (words[0]!.start - first), until });
  });
}

// ------------------------------------------------------------------ the camera

export interface Cam { x: number; z: number; h: number; pitch: number; f: number; cy?: number }
export interface P { x: number; y: number; zc: number; s: number }

export function project(cam: Cam, X: number, Y: number, Z: number): P {
  const px = X - cam.x, py = Y - cam.h, pz = Z - cam.z;
  const sp = Math.sin(cam.pitch), cp = Math.cos(cam.pitch);
  const zc = -py * sp + pz * cp, yc = py * cp + pz * sp;
  const s = cam.f / Math.max(0.05, zc);
  return { x: W / 2 + px * s, y: (cam.cy ?? H * 0.5) - yc * s, zc, s };
}
export const horizonY = (cam: Cam) => (cam.cy ?? H * 0.5) - cam.f * Math.tan(cam.pitch);
export const lerpCam = (a: Cam, b: Cam, u: number): Cam => ({
  x: a.x + (b.x - a.x) * u, z: a.z + (b.z - a.z) * u, h: a.h + (b.h - a.h) * u, pitch: a.pitch + (b.pitch - a.pitch) * u,
  f: a.f + (b.f - a.f) * u, cy: (a.cy ?? H / 2) + ((b.cy ?? H / 2) - (a.cy ?? H / 2)) * u,
});

// ------------------------------------------------------------------ the set

export const RING_R = 7;        // the ring of people, radius (m)
export const RING_N = 26;       // how many people
export const RAI_R = 1.15;      // Rai's disc radius (m): about 3.7 m tall, a big rai stone
export const SHORE_Z = 30;      // the waterline

/** Every carer's stone, on the beach outside the ring, with its owner beside it (k = the order they light in). */
export interface Carer { X: number; Z: number; r: number; col: string; seed: number; k: number; side: number; pose: Pose; emote: Emote }
const ACTS: [Pose, Emote][] = [['cheer', 'joy'], ['hug', 'heart'], ['face', 'tears'], ['hold', 'heart'], ['cheer', 'heart'], ['wave', 'joy']];
export const CARERS: Carer[] = (() => {
  const out: Carer[] = [];
  for (let i = 0; i < 18; i++) {
    const a = (-0.83 + (1.66 * (i + 0.5 * h01(i, 906))) / 18) * Math.PI, d = 10.5 + 4.5 * h01(i, 902);
    out.push({ X: Math.sin(a) * d * 1.25, Z: Math.cos(a) * d, r: 0.55 + 0.4 * h01(i, 903), col: NEON_ALL[i % NEON_ALL.length]!, seed: i, k: 0,
      side: h01(i, 907) < 0.5 ? -1 : 1, pose: ACTS[i % ACTS.length]![0], emote: ACTS[i % ACTS.length]![1] });
  }
  out.slice().sort((p, q) => h01(p.seed, 904) - h01(q.seed, 904)).forEach((s, k) => (s.k = k));
  return out;
})();
// the cove's flanks: palms (X, Z, height, lean), stilt huts (X, Z, height), the stone-money bank, the canoes
const PALMS: [number, number, number, number][] = [[-19, 4, 10, 0.2], [-23, 14, 12, 0.12], [-17, 24, 9, -0.1], [-29, 22, 11, 0.25], [20, 6, 11, -0.2], [25, 17, 10, -0.1], [18, 27, 12, 0.08], [31, 26, 9, -0.25], [-34, 8, 12, 0.3], [35, 10, 12, -0.3], [5, 29, 9, -0.12], [12, 29.5, 10, 0.1]];
const HUTS: [number, number, number][] = [[-26, 18, 5.5], [-21, 29, 5], [27, 22, 5.8]];
const BANK: [number, number] = [-24, 27];
const CANOES: [number, number, number][] = [[10, 26.5, 7], [16, 25, 6], [-6, 27.5, 6.5]];

export interface WorldOpts {
  t: number;
  /** Sky: the dominant neon of the burst and its strength (0 = a plain dawn), and its spin. */
  burst?: string; burstA?: number; spin?: number;
  /** 0..1: the dawn turns to gold (the last line). */
  gold?: number;
  /** The sun's bearing (m at 4 km, + = right) and height above the horizon in px. */
  sunX?: number; sunLift?: number;
  /** Ring person i: pose, hands joined to the next (0..1), the chain's light ([0..1, colour]), a speech bubble, a beam to Rai. */
  pose?: (i: number) => Pose;
  joined?: (i: number) => number;
  chain?: (i: number) => [number, string] | null;
  bubble?: (i: number) => number;
  beam?: (i: number) => number;
  /** Leave out ring people (the front gap). */
  skip?: (i: number) => boolean;
  /** Each carer's stone: how lit (0..1), when it lit (for the owner's emote), and a colour override. */
  lit?: (s: Carer) => number;
  litAt?: (s: Carer) => number;
  stoneCol?: string;
  /** Rai (her opts without t), lifted `lift` m; the halo behind her. */
  rai?: Omit<RaiOpts, 't'> & { lift?: number };
  halo?: number; haloScale?: number;
  /** Drawn just behind Rai (lines of force, speed lines), given her screen centre and radius. */
  beforeRai?: (x: number, y: number, R: number) => void;
  /** Extra things in the depth sort. */
  extras?: { X: number; Z: number; draw: (p: P) => void }[];
}

interface Item { zc: number; draw: () => void }

/** The cove at dawn from `cam`, into L (c) and its glow layer (g). Returns Rai's anchors and screen radius. */
export function drawWorld(c: C2, g: C2, cam: Cam, o: WorldOpts): { a: Anchors | null; x: number; y: number; R: number; hy: number } {
  const t = o.t, gold = o.gold ?? 0;
  const hy = horizonY(cam);
  // the sky: the island's dawn (violet to peach), gold for the last line
  const sky = c.createLinearGradient(0, hy - 950, 0, hy);
  sky.addColorStop(0, mixHex('#4a3d9a', '#2a1640', gold)); sky.addColorStop(0.55, mixHex('#d9709a', '#d9673f', gold)); sky.addColorStop(1, mixHex('#ffb38a', '#ffc65a', gold));
  c.fillStyle = sky; c.fillRect(0, 0, W, Math.max(0, hy + 2));
  const sx = W / 2 + (cam.f * (o.sunX ?? -1100)) / 4000 - cam.x * 0.4, sy = hy - (o.sunLift ?? 70);
  if (o.burst && (o.burstA ?? 0) > 0) {
    const cols = [o.burst, ...NEON.filter((x) => x !== o.burst)];
    burstAll(c, sx, sy, CLEAR, cols.flatMap((x) => [x, CLEAR]), 40, o.spin ?? t * 0.08, { clipY: hy, alpha: o.burstA });
  }
  // clouds, lit pink from below
  for (let i = 0; i < 6; i++) {
    const x = ((h01(i, 11) * (W + 700) + t * (7 + 5 * h01(i, 12)) - cam.x * 6) % (W + 700)) - 350, y = hy - (150 + 380 * h01(i, 13)) * (cam.f / 1300);
    if (y < -120) continue;
    cloud(c, x, y, (60 + 60 * h01(i, 14)) * (cam.f / 1300), mixHex('#ffc2b0', '#ffe2a0', gold));
  }
  // the sun
  const sr = 110 + 30 * gold;
  const sg = c.createRadialGradient(sx, sy, 0, sx, sy, sr * 4);
  sg.addColorStop(0, rgbaHex(HEX.gold, 0.6 - 0.15 * gold)); sg.addColorStop(0.3, rgbaHex(HEX.orange, 0.22)); sg.addColorStop(1, rgbaHex(HEX.orange, 0));
  c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = sg; c.fillRect(0, 0, W, Math.max(0, hy)); c.restore();
  c.save(); c.beginPath(); c.rect(0, 0, W, hy); c.clip();
  c.fillStyle = mixHex('#ffe6a8', '#fff3c9', gold); c.beginPath(); c.arc(sx, sy, sr, 0, TAU); c.fill();
  c.restore();
  // the sea, with surf lines and the sun's path
  const shore = project(cam, 0, 0, SHORE_Z).y;
  if (shore > hy) {
    gradientV(c, mixHex('#ff9f8a', '#ffc070', gold), mixHex('#3f6fb0', '#8a5a6a', gold), 0, hy, W, Math.max(1, (shore - hy) * 0.5));
    gradientV(c, mixHex('#3f6fb0', '#8a5a6a', gold), mixHex('#2f5aa0', '#6a4a6a', gold), 0, hy + (shore - hy) * 0.5, W, (shore - hy) * 0.5 + 1);
    c.save(); c.beginPath(); c.rect(0, hy, W, shore - hy); c.clip();
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2;
    for (let i = 0; i < 16; i++) {
      const y = hy + (shore - hy) * Math.pow((i + 1) / 17, 1.6), w = 30 + 140 * (i / 16);
      for (let k = 0; k < 6; k++) {
        const x = ((h01(i, k, 920) * W + t * 12 * (k % 2 ? 1 : -1) - cam.x * 20) % W + W) % W;
        c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + w / 2, y - 3, x + w, y); c.stroke();
      }
    }
    for (let i = 0; i < 50; i++) {
      const u = h01(i, 911), y = hy + (shore - hy) * u * u, x = sx + (h01(i, 912) - 0.5) * (40 + 360 * u);
      const tw = 0.5 + 0.5 * Math.sin(t * 6 + i * 2.1);
      c.fillStyle = rgbaHex('#fff1c4', 0.75 * tw); c.fillRect(x - 10 - 20 * u, y, 20 + 40 * u, 2 + 2 * u);
    }
    c.restore();
  }
  // the beach, and the surf's foam at the waterline
  const sandTop = Math.max(hy, shore);
  gradientV(c, mixHex('#f3d6a4', '#f6cf8a', gold), mixHex('#e2b07e', '#e0a46a', gold), 0, sandTop, W, H - sandTop + 2);
  if (shore > hy && shore < H) {
    c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 3;
    c.beginPath();
    for (let x = 0; x <= W; x += 30) { const y = shore - 2 + 3 * Math.sin(x * 0.03 + t * 2); x ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.stroke();
  }

  const items: Item[] = [];
  const add = (X: number, Y: number, Z: number, minZc: number, f: (p: P) => void) => {
    const p = project(cam, X, Y, Z);
    if (p.zc < minZc) return;
    items.push({ zc: p.zc, draw: () => f(p) });
  };
  // the flanks: palms, stilt huts, the stone bank, canoes, the wedding garland
  PALMS.forEach(([X, Z, hm, lean], i) => add(X, 0, Z, 1.5, (p) => { if (p.x > -500 && p.x < W + 500) palmTree(c, p.x, p.y, hm * p.s, lean, t, i, 0.05); }));
  HUTS.forEach(([X, Z, hm]) => add(X, 0, Z, 2, (p) => { if (p.x > -300 && p.x < W + 300) hut(c, p.x, p.y, (hm / 1.18) * p.s, false, 0.05); }));
  add(BANK[0], 0, BANK[1], 2, (p) => stoneBank(c, p.x, p.y, (6 / 420) * p.s, 0.05, 7));
  CANOES.forEach(([X, Z, len]) => add(X, 0, Z, 2, (p) => outrigger(c, p.x, p.y, len * p.s)));
  add(8.5, 0, 29.7, 2, () => garland(c, cam, t));
  // the carers' stones, each with its owner
  for (const s of CARERS) {
    const lit = o.lit ? o.lit(s) : 0, at = o.litAt ? o.litAt(s) : -1e9;
    add(s.X, s.r, s.Z, 1.5, (p) => {
      const r = s.r * p.s;
      if (p.x < -2 * r || p.x > W + 2 * r || p.y < -r) return;
      const gp = project(cam, s.X, 0, s.Z);
      c.fillStyle = 'rgba(120,70,60,0.28)'; c.beginPath(); c.ellipse(gp.x + r * 0.1, gp.y, r * 1.05, Math.max(2, r * 0.16), 0, 0, TAU); c.fill();
      const col = o.stoneCol ?? s.col;
      stone(c, p.x, p.y, r, { seed: s.seed, tilt: (h01(s.seed, 905) - 0.5) * 0.25, glow: lit > 0 ? col : undefined, glowA: 0.6 * lit, heart: lit > 0 ? col : undefined, heartA: lit });
      if (lit > 0) { g.fillStyle = rgbaHex(col, 0.35 * lit); g.beginPath(); g.ellipse(p.x, p.y + r * 0.06, r * 0.27, r * 0.29, 0, 0, TAU); g.fill(); }
    });
    const ox = s.X + s.side * (s.r + 0.55), hm = 1.6 + 0.25 * h01(s.seed, 908);
    add(ox, 0, s.Z, 1.5, (p) => {
      const h = hm * p.s;
      if (p.x < -h || p.x > W + h) return;
      const on = lit > 0.4;
      const pose: Pose = on ? s.pose : 'stand';
      person(c, p.x, p.y, h, pose, { col: HEX.ink, t, seed: s.seed + 40, flip: s.pose === 'hug' ? s.side > 0 : s.side < 0, emote: on ? s.emote : undefined, emoteT0: at + 0.1, rim: rgbaHex(HEX.orange, 0.8) });
    });
  }
  // the ring of people
  const ppl: { p: P; h: number }[] = [];
  for (let i = 0; i < RING_N; i++) {
    const a = ((i + 0.5) / RING_N) * TAU; // 0 at the back, pi at the front
    const X = Math.sin(a) * RING_R, Z = Math.cos(a) * RING_R;
    const hm = 1.55 + 0.35 * h01(i, 921);
    const p = project(cam, X, 0, Z), ph = project(cam, X, hm, Z);
    ppl.push({ p, h: p.y - ph.y });
  }
  const handAt = (i: number, toward: number): [number, number] => {
    const q = ppl[i]!, u = q.h / 100, side = ppl[toward]!.p.x >= q.p.x ? 1 : -1;
    return [q.p.x + side * 30 * u, q.p.y - 52 * u];
  };
  for (let i = 0; i < RING_N; i++) {
    if (o.skip?.(i)) continue;
    const q = ppl[i]!;
    if (q.p.zc < 0.8) continue;
    const pose = o.pose ? o.pose(i) : 'hands';
    items.push({ zc: q.p.zc, draw: () => {
      person(c, q.p.x, q.p.y, q.h, pose, { col: HEX.ink, t, seed: i, rim: rgbaHex(HEX.orange, 0.85) });
      // links to neighbours already drawn (farther), so the nearer body covers its own hand
      for (const j of [(i + 1) % RING_N, (i + RING_N - 1) % RING_N]) {
        if (o.skip?.(j)) continue;
        const qj = ppl[j]!;
        if (qj.p.zc < q.p.zc || qj.p.zc < 0.8) continue;
        const k = Math.min(o.joined ? o.joined(i) : 1, o.joined ? o.joined(j) : 1);
        if (k <= 0 || pose !== 'hands') continue;
        const [ax, ay] = handAt(i, j), [bx, by] = handAt(j, i);
        if (Math.abs(q.p.x - qj.p.x) < q.h * 0.42) continue; // nearly behind each other: the link would cross a body
        const mx = (ax + bx) / 2, my = (ay + by) / 2 + 8 * k;
        c.strokeStyle = HEX.ink; c.lineCap = 'round'; c.lineWidth = Math.max(2, ((q.h + qj.h) / 2) * 0.055);
        c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax + (mx - ax) * k, ay + (my - ay) * k); c.moveTo(bx, by); c.lineTo(bx + (mx - bx) * k, by + (my - by) * k); c.stroke();
        const ch = o.chain?.(Math.min(i, j) === 0 && Math.max(i, j) === RING_N - 1 ? RING_N - 1 : Math.min(i, j));
        if (ch && ch[0] > 0 && k >= 1) {
          g.strokeStyle = rgbaHex(ch[1], 0.85 * ch[0]); g.lineWidth = Math.max(2, q.h * 0.03);
          g.beginPath(); g.moveTo(ax, ay); g.lineTo(mx, my); g.lineTo(bx, by); g.stroke();
          g.fillStyle = rgbaHex(ch[1], ch[0]); g.beginPath(); g.arc(mx, my, Math.max(3, q.h * 0.045), 0, TAU); g.fill();
        }
      }
      const b = o.bubble?.(i) ?? 0;
      if (b > 0) {
        const bx = q.p.x + q.h * 0.12, by = q.p.y - q.h * 1.22 - 20 * b, s = q.h * 0.26 * Math.min(1, b * 1.4);
        c.fillStyle = rgbaHex(HEX.bone, 0.95); c.beginPath(); c.roundRect(bx - s * 0.75, by - s * 0.6, s * 1.5, s * 1.2, s * 0.35); c.fill();
        c.beginPath(); c.moveTo(bx - s * 0.3, by + s * 0.55); c.lineTo(bx - s * 0.55, by + s * 0.95); c.lineTo(bx, by + s * 0.55); c.fill();
        const col = NEON_ALL[i % NEON_ALL.length]!;
        heartPath(c, bx, by + s * 0.05, s * 0.8); c.fillStyle = col; c.fill();
      }
    } });
  }
  // Rai at the centre (lifted on the last chorus)
  const r = o.rai;
  const rc = project(cam, 0, RAI_R * 1.07 + (r?.lift ?? 0), 0);
  const R = RAI_R * rc.s;
  let anchors: Anchors | null = null;
  if (r) {
    items.push({ zc: rc.zc, draw: () => {
      const halo = o.halo ?? 0;
      if (halo > 0) haloBehind(c, rc.x, rc.y - R * 0.55, R * 2.3 * (o.haloScale ?? 1), t, halo, Math.max(1.5, R * 0.03));
      if (o.beam) for (let i = 0; i < RING_N; i++) {
        const b = o.beam(i);
        if (b <= 0 || o.skip?.(i)) continue;
        const q = ppl[i]!, x0 = q.p.x, y0 = q.p.y - q.h * 1.05, col = NEON_ALL[i % NEON_ALL.length]!;
        const gr = g.createLinearGradient(x0, y0, rc.x, rc.y + R);
        gr.addColorStop(0, rgbaHex(col, 0.85 * b)); gr.addColorStop(1, rgbaHex(col, 0.08 * b));
        g.strokeStyle = gr; g.lineWidth = 3;
        g.beginPath(); g.moveTo(x0, y0); g.lineTo(rc.x + (x0 - rc.x) * 0.08, rc.y + R * 0.9); g.stroke();
      }
      o.beforeRai?.(rc.x, rc.y, R);
      anchors = drawRai(c, rc.x, rc.y, R, { glow: HEX.gold, noBlink: true, ...r, t });
    } });
  }
  for (const e of o.extras ?? []) add(e.X, 0, e.Z, 1, e.draw);
  items.sort((p, q) => q.zc - p.zc).forEach((it) => it.draw());
  return { a: anchors, x: rc.x, y: rc.y, R, hy };
}

/** Tonight's wedding, foreshadowed: a garland of flowers strung between the two palms at the water's edge. */
function garland(c: C2, cam: Cam, t: number) {
  const a = project(cam, 5 + 0.9, 7.2, 29), b = project(cam, 12 - 0.6, 7.6, 29.5);
  if (a.zc < 2) return;
  const mx = (a.x + b.x) / 2, my = Math.max(a.y, b.y) + 0.9 * a.s;
  c.strokeStyle = 'rgba(60,40,30,0.8)'; c.lineWidth = Math.max(1, 0.04 * a.s);
  c.beginPath(); c.moveTo(a.x, a.y); c.quadraticCurveTo(mx, my, b.x, b.y); c.stroke();
  const cols = ['#ff7aa8', '#fff3e0', HEX.yellow, HEX.coral];
  for (let i = 1; i < 12; i++) {
    const u = i / 12, x = (1 - u) * (1 - u) * a.x + 2 * u * (1 - u) * mx + u * u * b.x, y = (1 - u) * (1 - u) * a.y + 2 * u * (1 - u) * my + u * u * b.y;
    c.fillStyle = cols[i % cols.length]!; c.beginPath(); c.arc(x, y + Math.sin(t * 2 + i) * 0.03 * a.s, Math.max(1.5, 0.11 * a.s), 0, TAU); c.fill();
  }
}

/** An outrigger canoe drawn up on the sand, seen side-on from the beach: the hull, and the float low behind it. */
function outrigger(c: C2, x: number, y: number, L: number) {
  const h = L * 0.09;
  c.save();
  c.strokeStyle = '#5a3a20'; c.lineWidth = Math.max(1, L * 0.012); c.lineCap = 'round';
  for (const d of [-0.22, 0.18]) { c.beginPath(); c.moveTo(x + d * L, y - h * 0.9); c.lineTo(x + d * L + L * 0.03, y - h * 1.5); c.stroke(); }
  c.fillStyle = '#7a5130'; c.beginPath(); c.ellipse(x - L * 0.02, y - h * 1.55, L * 0.33, h * 0.18, 0, 0, TAU); c.fill();
  c.fillStyle = '#8a5a32';
  c.beginPath(); c.moveTo(x - L * 0.5, y - h * 1.1); c.quadraticCurveTo(x - L * 0.3, y + h * 0.15, x, y + h * 0.15); c.quadraticCurveTo(x + L * 0.3, y + h * 0.15, x + L * 0.5, y - h * 1.1);
  c.lineTo(x + L * 0.42, y - h * 0.75); c.lineTo(x - L * 0.42, y - h * 0.75); c.closePath(); c.fill();
  c.fillStyle = '#6f4426'; c.fillRect(x - L * 0.42, y - h * 0.82, L * 0.84, h * 0.14);
  c.restore();
}

/** A heart path, centred at (x, y), size s (about its width). */
export function heartPath(c: C2, x: number, y: number, s: number) {
  const k = s / 2;
  c.beginPath();
  c.moveTo(x, y + k * 0.9);
  c.bezierCurveTo(x - k * 1.4, y - k * 0.1, x - k * 0.75, y - k * 1.15, x, y - k * 0.45);
  c.bezierCurveTo(x + k * 0.75, y - k * 1.15, x + k * 1.4, y - k * 0.1, x, y + k * 0.9);
  c.closePath();
}

/** 0..1 ramp from t0 over d seconds. */
export const ramp = (t: number, t0: number, d = 0.3) => clamp((t - t0) / d);
