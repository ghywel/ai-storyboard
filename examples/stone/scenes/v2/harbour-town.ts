// The harbour plate's own kit (v2, `harbour`): the island's harbour town at night after rain. The quay she surfaces
// at, the bank's cash machine, the phone shop's window, the humming container of mining racks, the big screen, the
// night market under string lights. (The sandy road up to the lit window of home is `fever`'s own hutNight(), drawn
// by harbour.ts's last shot, so the cut at 97.66 is a pure time cut.)
// Canvas2D, logical 1920x1080, y down; pure functions of t.
import { W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import { clamp, ease } from '../../engine/util';
import { h01, drawRai, type RaiOpts } from '../_rai';
import { FAM, TAU, rgbaHex, mixHex, person, type Pose, type Emote } from '../_motifs';
import { palmTree, fish } from '../_world';
import { star4 } from '../_manga';
import { girl, pendantRai, type GirlPose, type GirlAnchors } from './_diver';

type C2 = CanvasRenderingContext2D;
const PI = Math.PI;

const drawRaiChibi = (c: C2, x: number, y: number, R: number, o: RaiOpts) => drawRai(c, x, y, R, { ...o, sd: true });

// ------------------------------------------------------------------ the night's pieces

/** The night sky over the town: deep violet to a glow of town light at the horizon, stars, the moon. */
export function nightSky(c: C2, t: number, o: { hz?: number; moon?: { x: number; y: number; r?: number }; seed?: number } = {}) {
  const hz = o.hz ?? H * 0.45, seed = o.seed ?? 1;
  const g = c.createLinearGradient(0, 0, 0, hz);
  g.addColorStop(0, '#0c0a26'); g.addColorStop(0.7, '#2a1f5a'); g.addColorStop(1, '#4a2f6e');
  c.fillStyle = g; c.fillRect(-200, -200, W + 400, hz + 202);
  for (let i = 0; i < 90; i++) {
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * (0.8 + h01(i, seed, 1)) + i));
    c.fillStyle = `rgba(255,255,255,${tw * (0.25 + 0.55 * h01(i, seed, 2))})`;
    c.beginPath(); c.arc(W * h01(i, seed, 3), hz * 0.8 * h01(i, seed, 4), 0.7 + 1.2 * h01(i, seed, 5), 0, TAU); c.fill();
  }
  if (o.moon) {
    const { x, y } = o.moon, r = o.moon.r ?? 34;
    c.fillStyle = '#f6efd8'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.fillStyle = 'rgba(200,190,170,0.35)'; c.beginPath(); c.arc(x - r * 0.3, y - r * 0.1, r * 0.22, 0, TAU); c.arc(x + r * 0.25, y + r * 0.3, r * 0.15, 0, TAU); c.fill();
  }
}

/** A soft glow (on the glow layer) of colour `col` at (x, y), radius r. */
export function glow(g: C2, x: number, y: number, r: number, col: string, a: number) {
  if (a <= 0) return;
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, rgbaHex(col, a)); gr.addColorStop(1, rgbaHex(col, 0));
  g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
}

/** A light's reflection in the wet street: a smooth streak fading down from `y0` (a soft halo and a brighter core). */
export function reflect(c: C2, x: number, y0: number, w: number, len: number, col: string, a: number, t: number, wob = 6) {
  const dx = wob * 0.4 * Math.sin(t * 1.7 + x * 0.01);
  for (const [k, aa] of [[1, 0.55], [0.35, 1]] as const) {
    const gr = c.createLinearGradient(0, y0, 0, y0 + len);
    gr.addColorStop(0, rgbaHex(col, a * aa)); gr.addColorStop(1, rgbaHex(col, 0));
    c.fillStyle = gr; c.beginPath(); c.moveTo(x - w * k / 2, y0); c.lineTo(x + w * k / 2, y0); c.lineTo(x + w * k * 0.7 + dx, y0 + len); c.lineTo(x - w * k * 0.7 + dx, y0 + len); c.closePath(); c.fill();
  }
}

/** A light's reflection in open water: broken horizontal dashes rocking on the swell, fading with distance. */
export function reflectWater(c: C2, x: number, y0: number, w: number, len: number, col: string, a: number, t: number, seed = 0) {
  const n = 16;
  for (let k = 0; k < n; k++) {
    const u = k / n, y = y0 + len * u ** 1.15, ww = w * (0.5 + 0.9 * h01(k, seed, 1)) * (1 + u * 0.8), dx = Math.sin(t * 2.1 + k * 1.7 + seed) * w * 0.5 * (0.3 + u);
    c.fillStyle = rgbaHex(col, a * (1 - u) * (0.6 + 0.4 * h01(k, seed, 2)));
    c.fillRect(x - ww / 2 + dx, y, ww, 3 + 3 * u);
  }
}

/** A light drizzle: thin slanting streaks, deterministic in t. */
export function drizzle(c: C2, t: number, a = 0.22, n = 90, seed = 3) {
  c.save(); c.strokeStyle = `rgba(200,210,255,${a})`; c.lineWidth = 1.5; c.beginPath();
  for (let i = 0; i < n; i++) {
    const x = ((h01(i, seed, 1) * (W + 200) + t * 120) % (W + 200)) - 100, y = ((h01(i, seed, 2) * H + t * 1400 * (0.8 + 0.4 * h01(i, seed, 3))) % (H + 60)) - 30;
    c.moveTo(x, y); c.lineTo(x - 8, y + 34);
  }
  c.stroke(); c.restore();
}

/** Neon or lit letters: the text on the main layer, its glow on the glow layer. */
export function neon(c: C2, g: C2, text: string, x: number, y: number, size: number, col: string, a = 1, fam = FAM.cond()) {
  c.save(); c.font = font(fam, size); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = mixHex(col, '#ffffff', 0.55); c.globalAlpha = 0.35 + 0.65 * a; c.fillText(text, x, y);
  c.restore();
  if (a > 0) {
    g.save(); g.font = font(fam, size); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.strokeStyle = rgbaHex(col, 0.35 * a); g.lineWidth = size * 0.18; g.lineJoin = 'round'; g.strokeText(text, x, y);
    g.fillStyle = rgbaHex(col, 0.5 * a); g.fillText(text, x, y);
    g.restore();
  }
}

/** A catenary of string lights from (x0, y0) to (x1, y1) sagging `sag`, n bulbs in `cols`, a little sway. */
export function stringLights(c: C2, g: C2, t: number, x0: number, y0: number, x1: number, y1: number, sag: number, n: number, cols: string[], r = 6) {
  const sw = 4 * Math.sin(t * 1.3 + x0 * 0.01);
  const P = (u: number) => ({ x: x0 + (x1 - x0) * u, y: y0 + (y1 - y0) * u + sag * 4 * u * (1 - u) + sw * Math.sin(u * PI) });
  c.strokeStyle = 'rgba(20,14,30,0.9)'; c.lineWidth = 2;
  c.beginPath(); for (let i = 0; i <= 24; i++) { const p = P(i / 24); i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y); } c.stroke();
  for (let i = 0; i < n; i++) {
    const p = P((i + 0.5) / n), col = cols[i % cols.length]!, tw = 0.85 + 0.15 * Math.sin(t * 3 + i * 1.7);
    c.fillStyle = mixHex(col, '#ffffff', 0.5); c.beginPath(); c.arc(p.x, p.y + r, r, 0, TAU); c.fill();
    glow(g, p.x, p.y + r, r * 3, col, 0.28 * tw);
  }
}

// ------------------------------------------------------------------ the girl walking home

/** Walking: a steady stride (phase from t), arms swinging. */
export const walkPose = (t: number, sp = 6.5): GirlPose => {
  const s = Math.sin(t * sp), k = Math.cos(t * sp);
  return { rot: 0.04, hip: [0.4 * s, -0.4 * s], knee: [-0.12 - 0.5 * Math.max(0, k), -0.12 - 0.5 * Math.max(0, -k)], sh: [-0.38 * s, 0.38 * s], el: [0.35, 0.35] };
};

export interface WalkerOpts {
  rim?: string;
  pose?: GirlPose | string;
  glint?: 'plain' | 'spark' | 'droop' | 'wide';
  /** the pendant's chibi: how far out (0..1), her opts, the bubble's scale, the pebble's glow */
  pop?: number;
  rai?: Partial<RaiOpts>;
  ps?: number;
  glow?: number;
  /** her mask pushed up, her fins carried in her back hand */
  fins?: boolean;
  outfit?: 'swim' | 'tee';
  flip?: boolean;
  emote?: Emote;
  emoteT0?: number;
}
/** The girl walking home (yellow tee, mask up on her head, fins in hand), the pebble pendant on its cord at her chest,
 *  and chibi Rai popping out of it to narrate. Returns her anchors and where the pebble is. */
export function walker(c: C2, g: C2, x: number, y: number, h: number, t: number, o: WalkerOpts = {}): GirlAnchors & { pebble: { x: number; y: number } } {
  const u = h / 100;
  const ga = girl(c, x, y, h, o.pose ?? walkPose(t), { t, mask: 'up', outfit: o.outfit ?? 'tee', rim: o.rim, slate: true, pendant: true, flip: o.flip, glint: o.glint ?? 'plain', emote: o.emote, emoteT0: o.emoteT0 });
  if (o.fins !== false) { // her fins, dangling from her back hand
    const hd = ga.hands[0];
    c.save(); c.translate(hd.x, hd.y); c.rotate(0.15 * Math.sin(t * 6.5));
    c.fillStyle = mixHex('#0d0a18', HEX.coral, 0.55);
    for (const d of [-1, 1]) { c.beginPath(); c.moveTo(d * 2 * u, 0); c.lineTo(d * 7 * u, 22 * u); c.lineTo(d * 1 * u, 24 * u); c.closePath(); c.fill(); }
    c.restore();
  }
  // the pebble on its cord (the kit's pendant), and chibi Rai out of it
  const pb = ga.pendant!;
  pendantRai(c, g, pb.x, pb.y, o.ps ?? u / 3, t, o.pop ?? 0, { face: 'smile', ...o.rai }, o.glow ?? 0.3);
  return { ...ga, pebble: pb };
}

/**
 * The pebble pendant with chibi Rai out of it in a bubble, placed freely (pendantRai's bubble always rises up and to
 * the right at a fixed distance; a close-up needs it clear of her face). The same look: the pebble, a trail of small
 * bubbles, the bubble with its highlight, chibi Rai inside at 0.42 of the bubble's radius.
 */
export function pendantBubble(c: C2, g: C2, p: { x: number; y: number }, pr: number, b: { x: number; y: number }, br: number, t: number, pop: number, rai: Partial<RaiOpts>, glo = 0.6) {
  pendantRai(c, g, p.x, p.y, pr / 9, t, 0, {}, glo);
  if (pop <= 0) return;
  const k = ease.outBack(clamp(pop)), bx = p.x + (b.x - p.x) * k, by = p.y + (b.y - p.y) * k, rr = br * k;
  c.save();
  c.strokeStyle = 'rgba(220,245,255,0.8)'; c.lineWidth = Math.max(2, br * 0.045);
  for (const [u, r] of [[0.3, 0.08], [0.55, 0.13]] as const) { c.beginPath(); c.arc(p.x + (bx - p.x) * u, p.y + (by - p.y) * u, br * r * k, 0, TAU); c.stroke(); }
  c.fillStyle = 'rgba(220,245,255,0.16)'; c.beginPath(); c.arc(bx, by, rr, 0, TAU); c.fill(); c.stroke();
  c.beginPath(); c.arc(bx, by, rr - br * 0.06, 0, TAU); c.clip();
  drawRaiChibi(c, bx, by + rr * 0.19, rr * 0.42, { t, face: 'smile', ...rai } as RaiOpts);
  c.restore();
  c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.arc(bx - rr * 0.45, by - rr * 0.5, rr * 0.12, 0, TAU); c.fill();
}

// ------------------------------------------------------------------ H1: the harbour from the water

/** The harbour at water level: the town along the quay (bank, pharmacy, phone shop, the big screen, the market, the
 *  container stack), home's lit window up on the hill, the quay wall with its ladder, a moored boat, the black water
 *  full of the lights' reflections. `wl` is the waterline (px). */
export function harbourWide(c: C2, g: C2, t: number, o: { wl?: number } = {}) {
  const wl = o.wl ?? H * 0.62, qt = wl - 120;
  nightSky(c, t, { hz: qt, moon: { x: W * 0.12, y: H * 0.12, r: 30 }, seed: 4 });
  // the hill behind, and home's lit window on it (the hut from the jetty at dusk)
  c.fillStyle = '#1e1844'; c.beginPath(); c.moveTo(W * 0.55, qt); c.quadraticCurveTo(W * 0.8, H * 0.14, W + 40, H * 0.2); c.lineTo(W + 40, qt); c.closePath(); c.fill();
  palmTree(c, W * 0.83, H * 0.24, 90, -0.2, t, 1, 0.9); palmTree(c, W * 0.93, H * 0.22, 80, 0.2, t, 2, 0.9);
  c.fillStyle = '#2a2040'; c.fillRect(W * 0.86, H * 0.205, 52, 22); c.beginPath(); c.moveTo(W * 0.86 - 10, H * 0.205); c.lineTo(W * 0.86 + 26, H * 0.18); c.lineTo(W * 0.86 + 62, H * 0.205); c.closePath(); c.fill();
  c.fillStyle = '#ffcf6b'; c.fillRect(W * 0.86 + 18, H * 0.21, 12, 10);
  glow(g, W * 0.86 + 24, H * 0.215, 40, '#ffcf6b', 0.45);
  // the town along the quay
  const town: { x: number; w: number; h: number; col: string }[] = [
    { x: W * 0.02, w: W * 0.17, h: 250, col: '#2c2848' }, { x: W * 0.19, w: W * 0.07, h: 170, col: '#26223e' },
    { x: W * 0.26, w: W * 0.13, h: 210, col: '#2a2444' }, { x: W * 0.4, w: W * 0.14, h: 360, col: '#231f3c' },
    { x: W * 0.55, w: W * 0.16, h: 120, col: '#2e2440' },
  ];
  for (const b of town) {
    c.fillStyle = b.col; c.fillRect(b.x, qt - b.h, b.w, b.h);
    for (let i = 0; i < Math.floor(b.w / 34); i++) for (let j = 0; j < Math.floor(b.h / 50) - 1; j++) {
      const lit = h01(i, j, Math.round(b.x)) < 0.4; if (!lit) continue;
      c.fillStyle = h01(i, j, 7) < 0.5 ? 'rgba(255,200,120,0.8)' : 'rgba(170,200,255,0.6)';
      c.fillRect(b.x + 12 + i * 34, qt - b.h + 24 + j * 50, 14, 20);
    }
  }
  // the bank (brass letters, the cash machine's cyan at its foot) and the pharmacy's green cross
  neon(c, g, 'BANK', W * 0.105, qt - 215, 46, '#f0c060', 0.8, FAM.hook());
  c.fillStyle = '#7ff0ff'; c.fillRect(W * 0.15, qt - 70, 30, 40); glow(g, W * 0.15 + 15, qt - 50, 40, HEX.cyan, 0.45);
  const blink = 0.6 + 0.4 * Math.sin(t * 5);
  c.fillStyle = '#5aff7a'; c.fillRect(W * 0.225 - 6, qt - 140, 12, 36); c.fillRect(W * 0.225 - 18, qt - 128, 36, 12);
  glow(g, W * 0.225, qt - 122, 34, '#5aff7a', 0.4 * blink);
  // the phone shop's window, the big screen, the market's string lights
  c.fillStyle = 'rgba(120,220,255,0.75)'; c.fillRect(W * 0.28, qt - 90, W * 0.09, 70); glow(g, W * 0.325, qt - 55, 90, HEX.cyan, 0.25);
  neon(c, g, 'PHONES', W * 0.325, qt - 130, 30, HEX.cyan, 0.9);
  const sx = W * 0.415, sw = W * 0.11, sy = qt - 330, sh = 150;
  c.fillStyle = '#0a0812'; c.fillRect(sx, sy, sw, sh);
  const sg = c.createRadialGradient(sx + sw / 2, sy + sh / 2, 4, sx + sw / 2, sy + sh / 2, sw * 0.6);
  sg.addColorStop(0, '#fff2a0'); sg.addColorStop(0.3, '#f6c453'); sg.addColorStop(1, '#5a3a10');
  c.fillStyle = sg; c.fillRect(sx + 6, sy + 6, sw - 12, sh - 12);
  glow(g, sx + sw / 2, sy + sh / 2, 130, HEX.gold, 0.35);
  for (let k = 0; k < 3; k++) stringLights(c, g, t, W * 0.55, qt - 110 + k * 22, W * 0.71, qt - 100 + k * 18, 40, 9, [HEX.gold, HEX.pink, '#ffb060'], 4);
  for (let k = 0; k < 4; k++) { c.fillStyle = [HEX.coral, '#3a8a7a', HEX.gold, '#7a4ab0'][k]!; c.beginPath(); c.moveTo(W * (0.56 + k * 0.038), qt - 40); c.lineTo(W * (0.575 + k * 0.038), qt - 70); c.lineTo(W * (0.59 + k * 0.038), qt - 40); c.closePath(); c.fill(); }
  // the container stack on the quay, LEDs blinking, its heat shimmering
  const boxes = [[0.74, 0, '#2f4a54'], [0.84, 0, '#5a2e24'], [0.785, 1, '#3a3060'], [0.9, 0, '#26404a']] as const;
  for (const [bx, row, col] of boxes) {
    const x = W * bx, y = qt - 70 - row * 70;
    c.fillStyle = col; c.fillRect(x, y, W * 0.095, 70);
    c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 2; for (let k = 1; k < 12; k++) { c.beginPath(); c.moveTo(x + k * W * 0.0079, y + 4); c.lineTo(x + k * W * 0.0079, y + 66); c.stroke(); }
  }
  for (let i = 0; i < 10; i++) { const on = Math.sin(t * 9 + i * 2.3) > 0.2; if (!on) continue; const x = W * 0.795 + (i % 5) * 26, y = qt - 120 + Math.floor(i / 5) * 26; c.fillStyle = HEX.lime; c.fillRect(x, y, 6, 6); glow(g, x + 3, y + 3, 16, HEX.lime, 0.6); }
  c.save(); c.strokeStyle = 'rgba(255,180,140,0.18)'; c.lineWidth = 3;
  for (let k = 0; k < 4; k++) { c.beginPath(); for (let j = 0; j <= 10; j++) { const yy = qt - 150 - j * 10 - ((t * 40) % 10), xx = W * (0.8 + k * 0.03) + 6 * Math.sin(yy * 0.08 + t * 4); j ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); }
  c.restore();
  // the quay's lamp posts, and the quay wall: stone blocks, tyres for fenders, the ladder down into the water
  for (const lx of [0.2, 0.52, 0.86]) { c.fillStyle = '#16122a'; c.fillRect(W * lx - 3, qt - 120, 6, 120); c.fillStyle = '#fff0c8'; c.beginPath(); c.arc(W * lx, qt - 124, 7, 0, TAU); c.fill(); glow(g, W * lx, qt - 124, 34, '#ffd9a0', 0.4); }
  c.fillStyle = '#1e1a34'; c.fillRect(0, qt, W, wl - qt);
  c.strokeStyle = 'rgba(10,8,22,0.8)'; c.lineWidth = 3;
  for (let r = 0; r < 4; r++) { const y = qt + r * 30; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); for (let x = (r % 2) * 60; x < W; x += 120) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 30); c.stroke(); } }
  c.fillStyle = 'rgba(160,140,220,0.18)'; c.fillRect(0, qt, W, 4);
  for (const tx of [0.12, 0.66, 0.95]) { c.strokeStyle = '#0c0a16'; c.lineWidth = 16; c.beginPath(); c.arc(W * tx, qt + 60, 26, 0, TAU); c.stroke(); }
  c.strokeStyle = '#8a8fa8'; c.lineWidth = 6;
  for (const d of [-26, 26]) { c.beginPath(); c.moveTo(W * 0.5 + d, qt - 30); c.lineTo(W * 0.5 + d, wl + 60); c.stroke(); }
  c.lineWidth = 5; for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(W * 0.5 - 26, qt + k * 26); c.lineTo(W * 0.5 + 26, qt + k * 26); c.stroke(); }
  // the black water, and every light in it
  const wg = c.createLinearGradient(0, wl, 0, H);
  wg.addColorStop(0, '#141238'); wg.addColorStop(1, '#070616');
  c.fillStyle = wg; c.fillRect(0, wl, W, H - wl);
  const lights: [number, string, number][] = [[W * 0.105, '#f0c060', 0.35], [W * 0.165, HEX.cyan, 0.5], [W * 0.225, '#5aff7a', 0.35], [W * 0.325, HEX.cyan, 0.45], [W * 0.47, HEX.gold, 0.5], [W * 0.63, '#ffb060', 0.45], [W * 0.82, HEX.lime, 0.3], [W * 0.2, '#ffd9a0', 0.4], [W * 0.52, '#ffd9a0', 0.4], [W * 0.86, '#ffd9a0', 0.4]];
  lights.forEach(([x, col, a], i) => reflectWater(c, x, wl + 6, 40, H - wl, col, a * 1.4, t, i));
  c.strokeStyle = 'rgba(180,170,255,0.18)'; c.lineWidth = 2;
  for (let i = 0; i < 26; i++) { const y = wl + 10 + (H - wl) * (i / 26) ** 1.4, x = ((h01(i, 91) * W + t * 20 * (i % 2 ? 1 : -1)) % W + W) % W, w = 40 + 120 * (i / 26); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + w / 2, y - 3, x + w, y); c.stroke(); }
  // the moored fishing boat, bobbing, its lamp lit
  const by = wl + 6 + 6 * Math.sin(t * 1.4);
  c.fillStyle = '#2a1e34'; c.beginPath(); c.moveTo(W * 0.0, by - 40); c.lineTo(W * 0.2, by - 46); c.quadraticCurveTo(W * 0.21, by, W * 0.18, by + 18); c.lineTo(W * 0.01, by + 18); c.closePath(); c.fill();
  c.fillStyle = '#3a2a48'; c.fillRect(W * 0.04, by - 110, 120, 66);
  c.fillStyle = '#ffd27a'; c.fillRect(W * 0.04 + 20, by - 94, 30, 22); glow(g, W * 0.04 + 35, by - 83, 44, '#ffd27a', 0.4);
  c.strokeStyle = '#2a1e34'; c.lineWidth = 4; c.beginPath(); c.moveTo(W * 0.15, by - 46); c.lineTo(W * 0.15, by - 260); c.stroke();
  c.strokeStyle = 'rgba(40,30,50,0.9)'; c.lineWidth = 2; c.beginPath(); c.moveTo(W * 0.19, by - 30); c.quadraticCurveTo(W * 0.24, by - 20, W * 0.12, qt + 50); c.stroke();
  reflectWater(c, W * 0.04 + 35, by + 22, 30, 200, '#ffd27a', 0.5, t, 31);
}

// ------------------------------------------------------------------ H2: the bank's cash machine

/** The bank at night: a stone front, brass BANK letters, the cash machine glowing cyan and spitting a note (`note`
 *  0..1 how far out), the pharmacy's green cross next door, the wet pavement reflecting them. */
export function bankFront(c: C2, g: C2, t: number, o: { note?: number; pan?: number } = {}) {
  const pan = o.pan ?? 0, gy = H * 0.8;
  nightSky(c, t, { hz: H * 0.3, seed: 6 });
  // the building next door (the pharmacy) and the bank's stone front
  c.fillStyle = '#251f3a'; c.fillRect(-100 - pan, 0, W * 0.32, gy);
  c.fillStyle = '#3a3350'; c.fillRect(W * 0.3 - pan, 0, W * 0.8, gy);
  c.strokeStyle = 'rgba(16,12,30,0.55)'; c.lineWidth = 3;
  for (let r = 0; r < 14; r++) { const y = r * 62; c.beginPath(); c.moveTo(W * 0.3 - pan, y); c.lineTo(W * 1.1, y); c.stroke(); for (let x = W * 0.3 + (r % 2) * 70; x < W * 1.1; x += 140) { c.beginPath(); c.moveTo(x - pan, y); c.lineTo(x - pan, y + 62); c.stroke(); } }
  // pilasters and the cornice
  for (const px of [0.33, 0.93]) { c.fillStyle = '#463e5e'; c.fillRect(W * px - 40 - pan, 0, 80, gy); c.fillStyle = 'rgba(255,255,255,0.05)'; c.fillRect(W * px - 40 - pan, 0, 12, gy); }
  c.fillStyle = '#4c4466'; c.fillRect(W * 0.3 - pan, H * 0.06, W * 0.8, 40);
  neon(c, g, 'BANK', W * 0.63 - pan, H * 0.14, 110, '#f0c060', 0.75, FAM.hook());
  // the pharmacy's green cross, blinking, OPEN 24H
  const bl = Math.sin(t * 6) > -0.3 ? 1 : 0.4, px = W * 0.13 - pan, py = H * 0.22;
  c.fillStyle = '#5aff7a'; c.fillRect(px - 18, py - 60, 36, 120); c.fillRect(px - 60, py - 18, 120, 36);
  glow(g, px, py, 190, '#5aff7a', 0.55 * bl);
  neon(c, g, 'PHARMACY · OPEN 24H', px, py + 100, 26, '#5aff7a', 0.8 * bl, FAM.mono());
  c.fillStyle = 'rgba(255,220,160,0.55)'; c.fillRect(px - 120, py + 150, 240, 180);   // its lit shop window
  c.fillStyle = 'rgba(60,40,60,0.5)'; for (let k = 0; k < 4; k++) c.fillRect(px - 110 + k * 58, py + 220, 44, 8);
  // the cash machine in the wall
  const ax = W * 0.64 - pan, ay = H * 0.47;
  c.fillStyle = '#1a1626'; c.beginPath(); c.roundRect(ax - 210, ay - 230, 420, 460, 18); c.fill();
  c.fillStyle = '#5a6278'; c.beginPath(); c.roundRect(ax - 190, ay - 210, 380, 420, 14); c.fill();
  c.fillStyle = '#7a8298'; c.fillRect(ax - 190, ay - 210, 380, 10);
  const scr = c.createLinearGradient(0, ay - 170, 0, ay - 20);
  scr.addColorStop(0, '#9ff6ff'); scr.addColorStop(1, '#3ad0f0');
  c.fillStyle = scr; c.fillRect(ax - 140, ay - 170, 280, 150);
  c.fillStyle = '#0a3a48'; c.font = font(FAM.monoB(), 26); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText((o.note ?? 0) > 0.05 ? 'PLEASE TAKE' : 'PRINTING', ax, ay - 118); c.fillText((o.note ?? 0) > 0.05 ? 'YOUR CASH' : '. . .', ax, ay - 82);
  c.font = font(FAM.mono(), 16); c.fillText('NEW NOTE · 0 IN STOCK', ax, ay - 40);
  glow(g, ax, ay - 95, 260, HEX.cyan, 0.5);
  // keypad and card slot
  for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) { c.fillStyle = '#c8ccd8'; c.beginPath(); c.roundRect(ax - 66 + k * 46, ay + 10 + r * 34, 38, 26, 4); c.fill(); }
  c.fillStyle = '#ff6a5a'; c.beginPath(); c.roundRect(ax + 80, ay + 112, 38, 26, 4); c.fill();
  c.fillStyle = '#0a0a12'; c.fillRect(ax + 76, ay + 30, 60, 8);
  // the cash slot and the note it spits
  c.fillStyle = '#0a0a12'; c.fillRect(ax - 110, ay + 166, 220, 14);
  const n = clamp(o.note ?? 0);
  if (n > 0) {
    c.save(); c.beginPath(); c.rect(ax - 140, ay + 172, 280, 200); c.clip();
    const ny = ay + 172 + 130 * ease.outCubic(n) - 130, w = 190, h = 130;
    c.fillStyle = '#d8e6c0'; c.fillRect(ax - w / 2, ny, w, h);
    c.strokeStyle = '#5a7a4a'; c.lineWidth = 3; c.strokeRect(ax - w / 2 + 8, ny + 8, w - 16, h - 16);
    c.fillStyle = '#4a6a3a'; c.font = font(FAM.hook(), 44); c.fillText('20', ax + 50, ny + h - 34);
    c.beginPath(); c.arc(ax - 40, ny + h - 50, 26, 0, TAU); c.fill();
    c.font = font(FAM.mono(), 11); c.fillText('I PROMISE TO PAY', ax - 10, ny + 22);
    c.restore();
    if (n < 0.9) { c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 3; for (let k = 0; k < 3; k++) { const yy = ay + 200 + k * 30; c.beginPath(); c.moveTo(ax - 150, yy); c.lineTo(ax - 120, yy); c.moveTo(ax + 120, yy); c.lineTo(ax + 150, yy); c.stroke(); } }
  }
  // the pavement: wet, the lights in it
  const pg = c.createLinearGradient(0, gy, 0, H);
  pg.addColorStop(0, '#2a2440'); pg.addColorStop(1, '#141024');
  c.fillStyle = pg; c.fillRect(0, gy, W, H - gy);
  c.fillStyle = '#4c4466'; c.fillRect(0, gy - 8, W, 10);
  reflect(c, ax, gy + 4, 300, 260, HEX.cyan, 0.35, t, 8);
  reflect(c, px, gy + 4, 120, 260, '#5aff7a', 0.3 * bl, t, 8);
  reflect(c, W * 0.63 - pan, gy + 4, 380, 200, '#f0c060', 0.12, t, 8);
  c.fillStyle = 'rgba(120,110,180,0.18)'; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(W * h01(i, 51), gy + 40 + 160 * h01(i, 52), 120 + 120 * h01(i, 53), 14, 0, 0, TAU); c.fill(); }
  // the cyan light falling on the pavement in front of the machine
  c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(60,200,240,0.12)'; c.beginPath(); c.ellipse(ax, gy + 40, 360, 60, 0, 0, TAU); c.fill(); c.restore();
}

// ------------------------------------------------------------------ H3: the phone shop's window

/** The phone shop's window: four phones on stands, a transfer arrow (a coin with a tail) flying from one screen to
 *  the next (`u` 0..1 along the row), SEND MONEY HOME on the glass, the neon over the door, the wet pavement. */
export function phoneShop(c: C2, g: C2, t: number, o: { u?: number } = {}) {
  const gy = H * 0.82, u = clamp(o.u ?? 0);
  c.fillStyle = '#1c1830'; c.fillRect(0, 0, W, gy);
  // the window: a deep shop interior lit cold
  const wx = W * 0.08, wy = H * 0.14, ww = W * 0.84, wh = H * 0.58;
  const ig = c.createLinearGradient(0, wy, 0, wy + wh);
  ig.addColorStop(0, '#16304a'); ig.addColorStop(1, '#0c1a2c');
  c.fillStyle = ig; c.fillRect(wx, wy, ww, wh);
  c.fillStyle = 'rgba(80,160,220,0.12)'; for (let k = 0; k < 4; k++) c.fillRect(wx + 30 + k * ww / 4, wy + 30, ww / 4 - 60, 16);   // the shelves at the back
  // the counter
  c.fillStyle = '#26324a'; c.fillRect(wx, wy + wh * 0.72, ww, wh * 0.28);
  c.fillStyle = 'rgba(160,220,255,0.25)'; c.fillRect(wx, wy + wh * 0.72, ww, 6);
  // four phones on stands
  const xs = [0.2, 0.4, 0.6, 0.8].map((k) => wx + ww * k), py = wy + wh * 0.42;
  xs.forEach((x, i) => {
    c.fillStyle = '#3a3a4a'; c.fillRect(x - 10, py + 120, 20, wh * 0.72 - 120 - (py - wy) + 20);
    c.fillStyle = '#0c0c14'; c.beginPath(); c.roundRect(x - 78, py - 150, 156, 290, 22); c.fill();
    const lit = 0.55 + 0.45 * clamp(1 - Math.abs(u * 3 - i + 0.0) * 1.2);
    const sg = c.createLinearGradient(0, py - 136, 0, py + 126);
    sg.addColorStop(0, mixHex('#2a6a9a', '#9ff6ff', lit * 0.6)); sg.addColorStop(1, mixHex('#16304a', '#3ad0f0', lit * 0.5));
    c.fillStyle = sg; c.beginPath(); c.roundRect(x - 68, py - 136, 136, 262, 14); c.fill();
    c.fillStyle = 'rgba(10,30,50,0.85)'; c.font = font(FAM.monoB(), 18); c.textAlign = 'center'; c.textBaseline = 'middle';
    const recv = u * 3 > i - 0.15;
    c.fillText(i === 0 ? 'SEND' : recv ? 'RECEIVED' : 'WAITING', x, py - 100);
    c.font = font(FAM.monoB(), 34); c.fillText('£20', x, py - 40);
    c.font = font(FAM.mono(), 13); c.fillText(i === 0 ? 'TO: ANYONE' : recv ? '✓ 0.3 SEC' : '· · ·', x, py + 10);
    c.fillStyle = recv ? HEX.lime : 'rgba(10,30,50,0.4)'; c.beginPath(); c.arc(x, py + 70, 22, 0, TAU); c.fill();
    glow(g, x, py, 170, HEX.cyan, 0.22 * lit);
  });
  // the transfer: a coin with a streaking tail hopping screen to screen
  if (u > 0 && u < 1) {
    const seg = Math.min(2, Math.floor(u * 3)), v = u * 3 - seg, x0 = xs[seg]!, x1 = xs[seg + 1]!;
    const x = x0 + (x1 - x0) * ease.inOutQuad(v), y = py - 40 - 120 * Math.sin(v * PI);
    for (let k = 1; k <= 8; k++) { const vv = Math.max(0, v - k * 0.03), xx = x0 + (x1 - x0) * ease.inOutQuad(vv), yy = py - 40 - 120 * Math.sin(vv * PI); c.fillStyle = rgbaHex(HEX.gold, 0.5 * (1 - k / 9)); c.beginPath(); c.arc(xx, yy, 18 * (1 - k / 12), 0, TAU); c.fill(); }
    c.fillStyle = '#ffe07a'; c.beginPath(); c.arc(x, y, 22, 0, TAU); c.fill();
    c.strokeStyle = '#c08a24'; c.lineWidth = 4; c.stroke();
    c.fillStyle = '#c08a24'; c.font = font(FAM.serifB(), 26); c.fillText('£', x, y + 1);
    glow(g, x, y, 90, HEX.gold, 0.7);
  }
  // the glass: SEND MONEY HOME in the corner, reflections, the frame
  c.fillStyle = 'rgba(255,255,255,0.06)'; c.beginPath(); c.moveTo(wx + ww * 0.1, wy); c.lineTo(wx + ww * 0.24, wy); c.lineTo(wx + ww * 0.06, wy + wh); c.lineTo(wx - ww * 0.08, wy + wh); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(wx + ww * 0.62, wy); c.lineTo(wx + ww * 0.68, wy); c.lineTo(wx + ww * 0.5, wy + wh); c.lineTo(wx + ww * 0.44, wy + wh); c.closePath(); c.fill();
  c.font = font(FAM.hook(), 30); c.fillStyle = 'rgba(255,240,200,0.85)'; c.textAlign = 'left'; c.fillText('SEND MONEY HOME', wx + 30, wy + wh - 40);
  c.font = font(FAM.mono(), 18); c.fillText('fees from 0.99', wx + 32, wy + wh - 12);
  c.strokeStyle = '#0e0c1a'; c.lineWidth = 26; c.strokeRect(wx, wy, ww, wh);
  neon(c, g, 'PHONES · TOP UP', W * 0.5, H * 0.07, 64, HEX.cyan, 0.9);
  // the pavement
  const pg = c.createLinearGradient(0, gy, 0, H);
  pg.addColorStop(0, '#22203a'); pg.addColorStop(1, '#100e20');
  c.fillStyle = pg; c.fillRect(0, gy, W, H - gy);
  for (const x of xs) reflect(c, x, gy + 4, 120, 220, HEX.cyan, 0.22, t, 6);
  reflect(c, W * 0.5, gy + 4, 500, 140, HEX.cyan, 0.1, t, 6);
}

// ------------------------------------------------------------------ H4: the humming container

/** A shipping container on the quay, humming: IRON HULL LINES stencilled on its side, vents blinking lime with the
 *  mining racks behind them, a door ajar on the racks' fans, heat haze rising off it, cables to a pole; a cat on top. */
export function minerBox(c: C2, g: C2, t: number, o: { pan?: number } = {}) {
  const pan = o.pan ?? 0, gy = H * 0.8;
  nightSky(c, t, { hz: H * 0.62, moon: { x: W * 0.84 - pan * 0.2, y: H * 0.16, r: 36 }, seed: 8 });
  // the harbour behind: the water, a crane in silhouette, the far lights
  c.fillStyle = '#0e0c26'; c.fillRect(0, H * 0.6, W, gy - H * 0.6);
  for (let i = 0; i < 12; i++) reflectWater(c, W * h01(i, 61) - pan * 0.3, H * 0.62, 18, 80, h01(i, 62) < 0.5 ? '#ffd9a0' : HEX.cyan, 0.4, t, i);
  c.strokeStyle = '#18142e'; c.lineWidth = 14;
  c.beginPath(); c.moveTo(W * 0.1 - pan * 0.3, H * 0.62); c.lineTo(W * 0.1 - pan * 0.3, H * 0.12); c.lineTo(W * 0.32 - pan * 0.3, H * 0.12); c.stroke();
  c.lineWidth = 3; c.beginPath(); c.moveTo(W * 0.3 - pan * 0.3, H * 0.12); c.lineTo(W * 0.3 - pan * 0.3, H * 0.3); c.stroke();
  // the container: corrugated steel, violet-teal, rust at the corners
  const x0 = W * 0.36 - pan, y0 = H * 0.3, w = W * 0.62, h = gy - y0;
  // heat haze above it: the sky behind wobbles (warm streaks)
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 9; k++) {
    c.strokeStyle = `rgba(255,150,90,${0.08 + 0.04 * Math.sin(t * 3 + k)})`; c.lineWidth = 10;
    c.beginPath();
    for (let j = 0; j <= 14; j++) { const yy = y0 - 10 - j * 16 - ((t * 60) % 16), xx = x0 + 40 + k * (w - 80) / 8 + 9 * Math.sin(yy * 0.05 + t * 5 + k); j ? c.lineTo(xx, yy) : c.moveTo(xx, yy); }
    c.stroke();
  }
  c.restore();
  c.fillStyle = '#2c3a52'; c.fillRect(x0, y0, w, h);
  for (let k = 0; k < 40; k++) { c.fillStyle = k % 2 ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.04)'; c.fillRect(x0 + k * w / 40, y0, w / 80, h); }
  c.fillStyle = '#20283c'; c.fillRect(x0, y0, w, 16); c.fillRect(x0, y0 + h - 18, w, 18); c.fillRect(x0, y0, 22, h); c.fillRect(x0 + w - 22, y0, 22, h);
  for (const [rx, ry] of [[x0, y0], [x0 + w - 60, y0], [x0, y0 + h - 60]] as const) { const rg = c.createRadialGradient(rx + 30, ry + 30, 0, rx + 30, ry + 30, 90); rg.addColorStop(0, 'rgba(160,70,30,0.6)'); rg.addColorStop(1, 'rgba(160,70,30,0)'); c.fillStyle = rg; c.fillRect(rx - 60, ry - 60, 180, 180); }
  // the stencil: the trader's shipping line, still at it
  c.font = font(FAM.cond(), 64); c.fillStyle = 'rgba(230,224,200,0.75)'; c.textAlign = 'left'; c.textBaseline = 'middle';
  c.fillText('IRON HULL LINES', x0 + w * 0.3, y0 + 70);
  c.font = font(FAM.monoB(), 22); c.fillText('IHLU 100001 0 · MAX GROSS 1 TON', x0 + w * 0.3 + 2, y0 + 120);
  // the vents: rows of slits, each glowing lime from the racks inside, blinking
  for (let r = 0; r < 3; r++) for (let k = 0; k < 9; k++) {
    const vx = x0 + w * 0.22 + k * 58, vy = y0 + 180 + r * 60, on = 0.5 + 0.5 * Math.sin(t * (6 + (k % 3)) + k * 2.1 + r * 1.3);
    c.fillStyle = '#0a0a12'; c.fillRect(vx, vy, 42, 34);
    c.fillStyle = rgbaHex(HEX.lime, 0.4 + 0.6 * on); for (let s = 0; s < 4; s++) c.fillRect(vx + 4, vy + 4 + s * 8, 34, 3);
    glow(g, vx + 21, vy + 17, 40, HEX.lime, 0.3 * on);
  }
  // the door ajar: the racks inside, rows of blinking LEDs and fans turning
  const dx = x0 + w * 0.68, dw = w * 0.26;
  c.fillStyle = '#05060c'; c.fillRect(dx, y0 + 24, dw, h - 46);
  for (let r = 0; r < 6; r++) {
    const ry = y0 + 50 + r * 62;
    c.fillStyle = '#141a24'; c.fillRect(dx + 20, ry, dw - 40, 46);
    for (let k = 0; k < 10; k++) { const on = Math.sin(t * 11 + k * 1.9 + r * 2.7) > 0; c.fillStyle = on ? HEX.lime : '#2a3a20'; c.fillRect(dx + 30 + k * (dw - 70) / 10, ry + 8, 8, 6); }
    c.save(); c.translate(dx + dw - 60, ry + 23); c.rotate(t * 30 + r); c.strokeStyle = '#3a4a5a'; c.lineWidth = 4; for (let b = 0; b < 3; b++) { c.rotate(TAU / 3); c.beginPath(); c.moveTo(0, 0); c.lineTo(16, 0); c.stroke(); } c.restore();
  }
  glow(g, dx + dw / 2, y0 + h / 2, 300, HEX.lime, 0.28);
  c.fillStyle = '#3a4a62'; c.fillRect(dx + dw, y0 + 20, 26, h - 40);   // the open door leaf
  // the cables to the pole, and its transformer humming
  const pxp = W * 0.24 - pan;
  c.fillStyle = '#16122a'; c.fillRect(pxp - 8, H * 0.15, 16, gy - H * 0.15);
  c.fillStyle = '#2a2a3a'; c.fillRect(pxp - 40, H * 0.28, 80, 70);
  c.strokeStyle = '#0a0812'; c.lineWidth = 5;
  for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(pxp + 30, H * 0.32 + k * 14); c.quadraticCurveTo((pxp + x0) / 2, H * 0.42 + k * 30, x0 + 10, y0 + 40 + k * 20); c.stroke(); }
  c.strokeStyle = 'rgba(200,255,140,0.6)'; c.lineWidth = 2;
  for (let k = 0; k < 3; k++) { const a = (t * 2 + k / 3) % 1; c.beginPath(); c.arc(pxp, H * 0.31, 50 + a * 60, -0.8, 0.8); c.globalAlpha = 1 - a; c.stroke(); } c.globalAlpha = 1;
  // a cat on top, warming itself
  const cx = x0 + w * 0.3, cy = y0;
  c.fillStyle = '#0c0a14'; c.beginPath(); c.ellipse(cx, cy - 22, 46, 22, 0, 0, TAU); c.fill();
  c.beginPath(); c.arc(cx + 44, cy - 36, 18, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(cx + 34, cy - 50); c.lineTo(cx + 38, cy - 66); c.lineTo(cx + 46, cy - 52); c.fill(); c.beginPath(); c.moveTo(cx + 50, cy - 52); c.lineTo(cx + 58, cy - 64); c.lineTo(cx + 60, cy - 48); c.fill();
  c.strokeStyle = '#0c0a14'; c.lineWidth = 8; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx - 44, cy - 16); c.quadraticCurveTo(cx - 80, cy - 10 + 8 * Math.sin(t * 2), cx - 70, cy + 30); c.stroke();
  c.fillStyle = HEX.lime; c.beginPath(); c.arc(cx + 50, cy - 38, 2.5, 0, TAU); c.fill();
  // the quay: wet concrete
  const pg = c.createLinearGradient(0, gy, 0, H);
  pg.addColorStop(0, '#24203a'); pg.addColorStop(1, '#100e20');
  c.fillStyle = pg; c.fillRect(0, gy, W, H - gy);
  reflect(c, dx + dw / 2, gy + 4, dw, 220, HEX.lime, 0.25, t, 6);
  reflect(c, x0 + w * 0.3, gy + 4, w * 0.5, 160, HEX.lime, 0.12, t, 6);
}

// ------------------------------------------------------------------ H5: a pledge on a screen

/** The big screen on a building over the square: `mode` 'pledge' (a promise to pay, signed as it scrolls) or 'gold' (a
 *  hand holding a gold coin up like a trophy, confetti, a ticker); the crowd below looking up; `zoom` frames it. */
export function bigScreen(c: C2, g: C2, t: number, o: { mode: 'pledge' | 'gold'; u?: number; wide?: boolean }) {
  const wide = !!o.wide, gy = wide ? H * 0.86 : H * 1.2;
  nightSky(c, t, { hz: H * 0.7, seed: 10 });
  // the building
  const bx = wide ? W * 0.28 : W * 0.06, bw = wide ? W * 0.5 : W * 0.88, top = wide ? H * 0.04 : -40;
  c.fillStyle = '#1e1a34'; c.fillRect(bx - 40, top, bw + 80, gy - top);
  for (let i = 0; i < 18; i++) { const x = bx - 20 + (bw + 40) * h01(i, 71), y = (wide ? H * 0.64 : H * 0.9) + 60 * h01(i, 72); if (h01(i, 73) < 0.5) { c.fillStyle = 'rgba(255,200,120,0.6)'; c.fillRect(x, y, 16, 22); } }
  if (wide) for (const sx of [0.08, 0.84]) { c.fillStyle = '#16122a'; c.fillRect(W * sx, H * 0.3, W * 0.12, gy - H * 0.3); for (let k = 0; k < 6; k++) if (h01(k, sx * 100) < 0.5) { c.fillStyle = 'rgba(255,200,120,0.5)'; c.fillRect(W * sx + 30 + (k % 2) * 80, H * 0.36 + Math.floor(k / 2) * 90, 26, 34); } }
  // the screen
  const sx = bx, sy = wide ? H * 0.1 : H * 0.02, sw = bw, sh = wide ? H * 0.5 : H * 0.72;
  c.fillStyle = '#05040a'; c.fillRect(sx - 14, sy - 14, sw + 28, sh + 28);
  c.save(); c.beginPath(); c.rect(sx, sy, sw, sh); c.clip();
  const u = clamp(o.u ?? 0), k = sw / 1700;
  if (o.mode === 'pledge') {
    const bg = c.createLinearGradient(0, sy, 0, sy + sh); bg.addColorStop(0, '#1a2a5a'); bg.addColorStop(1, '#0a1230');
    c.fillStyle = bg; c.fillRect(sx, sy, sw, sh);
    // the promise, typed out as it scrolls, then signed
    const lines = ['I PROMISE', 'TO PAY THE BEARER', 'ON DEMAND'];
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#e8f0ff';
    lines.forEach((l, i) => { const n = Math.floor(clamp(u * 4 - i * 0.7) * l.length); c.font = font(FAM.monoB(), (i === 0 ? 120 : 84) * k); c.fillText(l.slice(0, n), sx + sw / 2, sy + sh * (0.22 + 0.18 * i)); });
    const sg = clamp(u * 2.6 - 1.4);
    if (sg > 0) {
      c.strokeStyle = '#7ff0ff'; c.lineWidth = 8 * k; c.lineCap = 'round'; c.beginPath();
      for (let i = 0; i <= 60 * sg; i++) { const v = i / 60, x = sx + sw * (0.3 + 0.4 * v), y = sy + sh * 0.78 + 40 * k * Math.sin(v * 18) * (1 - v * 0.5) - 30 * k * v; i ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke();
      glow(g, sx + sw / 2, sy + sh * 0.78, 300 * k, HEX.cyan, 0.4 * sg);
    }
    c.fillStyle = 'rgba(232,240,255,0.5)'; c.font = font(FAM.mono(), 30 * k); c.fillText('— on a screen near you —', sx + sw / 2, sy + sh * 0.92);
    glow(g, sx + sw / 2, sy + sh / 2, sw * 0.5, '#4a7aff', 0.25);
  } else {
    // gold: rays, a hand raising a coin like a trophy, confetti, the ticker
    const cx = sx + sw / 2, cy = sy + sh * 0.42;
    const bg = c.createRadialGradient(cx, cy, 10, cx, cy, sw * 0.7); bg.addColorStop(0, '#7a4a10'); bg.addColorStop(1, '#2a1404');
    c.fillStyle = bg; c.fillRect(sx, sy, sw, sh);
    c.fillStyle = 'rgba(255,210,90,0.18)';
    for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU + t * 0.4; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * sw, cy + Math.sin(a) * sw); c.lineTo(cx + Math.cos(a + 0.12) * sw, cy + Math.sin(a + 0.12) * sw); c.closePath(); c.fill(); }
    const lift = ease.outBack(clamp(u * 1.6)), r = 150 * k, coinY = cy + 120 * k * (1 - lift);
    // the arm and the hand from below
    c.fillStyle = '#c88a5a'; c.beginPath(); c.moveTo(cx - 60 * k, sy + sh + 20); c.lineTo(cx - 40 * k, coinY + r * 1.1); c.lineTo(cx + 40 * k, coinY + r * 1.1); c.lineTo(cx + 70 * k, sy + sh + 20); c.closePath(); c.fill();
    c.beginPath(); c.ellipse(cx, coinY + r * 1.05, 80 * k, 50 * k, 0, 0, TAU); c.fill();
    for (let f = 0; f < 4; f++) { c.beginPath(); c.roundRect(cx - 74 * k + f * 38 * k, coinY + r * 0.55, 30 * k, 70 * k, 14 * k); c.fill(); }
    const cg = c.createLinearGradient(cx - r, coinY - r, cx + r, coinY + r); cg.addColorStop(0, '#fff6b0'); cg.addColorStop(0.5, '#f6c453'); cg.addColorStop(1, '#b07a1c');
    c.fillStyle = cg; c.beginPath(); c.arc(cx, coinY, r, 0, TAU); c.fill();
    c.strokeStyle = '#a06a14'; c.lineWidth = 10 * k; c.beginPath(); c.arc(cx, coinY, r * 0.82, 0, TAU); c.stroke();
    c.fillStyle = '#a06a14'; c.font = font(FAM.serifB(), 170 * k); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('£', cx, coinY + 8 * k);
    star4(c, cx + r * 0.5, coinY - r * 0.5, 40 * k * (0.7 + 0.3 * Math.sin(t * 9)), '#ffffff');
    glow(g, cx, coinY, r * 3, HEX.gold, 0.6);
    for (let i = 0; i < 40; i++) { const x = sx + sw * h01(i, 81), y = sy + ((h01(i, 82) * sh + t * 240 * (0.5 + h01(i, 83))) % sh), s = (6 + 6 * h01(i, 84)) * k; c.fillStyle = [HEX.gold, '#fff6b0', HEX.pink, '#ffffff'][i % 4]!; c.save(); c.translate(x, y); c.rotate(t * 4 + i); c.fillRect(-s, -s / 2, 2 * s, s); c.restore(); }
    c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(sx, sy + sh - 70 * k, sw, 70 * k);
    c.fillStyle = '#ffe07a'; c.font = font(FAM.monoB(), 38 * k); c.textAlign = 'left';
    const tick = 'GOLD ▲ 2,431.60   ·   AS GOOD AS GOLD   ·   GOLD ▲ 2,431.60   ·   AS GOOD AS GOLD   ·   ';
    c.fillText(tick, sx + 20 - ((t * 180 * k) % (900 * k)), sy + sh - 34 * k);
  }
  // scanlines, the LED grid
  c.fillStyle = 'rgba(0,0,0,0.18)'; for (let y = sy; y < sy + sh; y += 6) c.fillRect(sx, y, sw, 2);
  c.restore();
  if (wide) {
    // the square below: wet, the screen in it, the crowd looking up
    const pg = c.createLinearGradient(0, gy, 0, H); pg.addColorStop(0, '#2a2040'); pg.addColorStop(1, '#120e22');
    c.fillStyle = pg; c.fillRect(0, gy, W, H - gy);
    reflect(c, sx + sw / 2, gy + 4, sw * 0.8, 160, o.mode === 'gold' ? HEX.gold : '#4a7aff', 0.25, t, 8);
  }
}

// ------------------------------------------------------------------ H7: the night market

/** The night market under string lights: stalls with striped awnings (fish on ice, fruit, lanterns, tin lunchboxes),
 *  steam from a food stall, a crowd in silhouette; the two strangers in front are drawn by the scene. */
export function nightMarket(c: C2, g: C2, t: number, o: { pan?: number } = {}) {
  const pan = o.pan ?? 0, gy = H * 0.84;
  nightSky(c, t, { hz: H * 0.5, seed: 12 });
  c.fillStyle = '#1c1630'; c.fillRect(0, H * 0.18, W, gy - H * 0.18);
  for (let i = 0; i < 14; i++) { const x = (i * 160 - pan * 0.3) % (W + 160) - 80; c.fillStyle = h01(i, 91) < 0.5 ? 'rgba(255,200,120,0.5)' : 'rgba(255,170,120,0.35)'; c.fillRect(x, H * 0.24 + 70 * h01(i, 92), 30, 40); }
  // stalls
  const stalls = [
    { x: 0.04, col: HEX.coral, kind: 'fish' }, { x: 0.27, col: '#3a8a7a', kind: 'lunch' }, { x: 0.52, col: HEX.gold, kind: 'fruit' }, { x: 0.76, col: '#7a4ab0', kind: 'lantern' },
  ] as const;
  for (const s of stalls) {
    const x = W * s.x - pan, w = W * 0.21, ay = H * 0.38;
    c.fillStyle = '#2a2236'; c.fillRect(x, ay + 40, w, gy - ay - 40);
    c.fillStyle = '#ffd9a0'; c.globalAlpha = 0.25; c.fillRect(x + 10, ay + 50, w - 20, 120); c.globalAlpha = 1;   // the stall's lamp-lit back
    for (let k = 0; k < 8; k++) { c.fillStyle = k % 2 ? s.col : '#f4ead0'; c.beginPath(); c.moveTo(x + k * w / 8, ay); c.lineTo(x + (k + 1) * w / 8, ay); c.lineTo(x + (k + 1) * w / 8 + 4, ay + 46); c.quadraticCurveTo(x + (k + 0.5) * w / 8, ay + 60, x + k * w / 8 - 4, ay + 46); c.closePath(); c.fill(); }
    c.fillStyle = '#3a2c3a'; c.fillRect(x, gy - 150, w, 24);
    const tx = x + w / 2, ty = gy - 160;
    if (s.kind === 'fish') { c.fillStyle = 'rgba(220,240,255,0.7)'; c.fillRect(x + 20, ty - 20, w - 40, 26); for (let k = 0; k < 5; k++) fish(c, x + 50 + k * 60, ty - 22, 20, ['#ff9a5a', '#c0d0e0', '#ff7a7a'][k % 3]!, 1, 0, k); }
    if (s.kind === 'lunch') for (let k = 0; k < 4; k++) { c.fillStyle = '#2fb8a0'; c.beginPath(); c.roundRect(x + 30 + k * 82, ty - 50, 66, 46, 8); c.fill(); c.strokeStyle = '#1a6a5a'; c.lineWidth = 5; c.beginPath(); c.arc(x + 63 + k * 82, ty - 50, 14, PI, TAU); c.stroke(); }
    if (s.kind === 'fruit') for (let k = 0; k < 12; k++) { c.fillStyle = ['#ffb030', '#ff6a3a', '#9ad23a'][k % 3]!; c.beginPath(); c.arc(x + 40 + (k % 6) * 56, ty - 16 - Math.floor(k / 6) * 26, 18, 0, TAU); c.fill(); }
    if (s.kind === 'lantern') for (let k = 0; k < 5; k++) { const lx = x + 40 + k * 70, ly = ay + 90 + 6 * Math.sin(t * 2 + k); c.fillStyle = [HEX.orange, HEX.pink, HEX.gold][k % 3]!; c.beginPath(); c.ellipse(lx, ly, 22, 30, 0, 0, TAU); c.fill(); glow(g, lx, ly, 70, [HEX.orange, HEX.pink, HEX.gold][k % 3]!, 0.35); }
    glow(g, tx, ay + 80, 160, '#ffcf8a', 0.16);
    void ty;
  }
  // steam from the food stall
  for (let k = 0; k < 6; k++) { const u = ((t * 0.5 + k / 6) % 1); c.fillStyle = `rgba(255,240,230,${0.18 * (1 - u)})`; c.beginPath(); c.arc(W * 0.62 - pan + 30 * Math.sin(t + k), H * 0.5 - u * 200, 30 + 50 * u, 0, TAU); c.fill(); }
  // the crowd behind, in silhouette
  for (let i = 0; i < 9; i++) {
    const x = W * (0.05 + 0.11 * i) - pan * 0.8 + 20 * Math.sin(t * 0.5 + i), h = 200 + 50 * h01(i, 93);
    if (Math.abs(x - W * 0.52) < W * 0.12) continue;   // leave the middle to the two strangers
    person(c, x, gy - 70, h, (['stand', 'hold', 'stand', 'point', 'stand', 'read'] as Pose[])[i % 6]!, { col: '#1a1426', t, seed: i, flip: h01(i, 94) < 0.5, rim: 'rgba(255,200,140,0.3)' });
  }
  // the string lights overhead, zigzagging across the street
  for (let k = 0; k < 3; k++) stringLights(c, g, t, -60, H * (0.04 + k * 0.08), W + 60, H * (0.08 + k * 0.07), 110 + 40 * k, 18, [HEX.gold, '#fff0c8', HEX.pink, '#ffb060'], 6);
  // the wet street
  const pg = c.createLinearGradient(0, gy, 0, H); pg.addColorStop(0, '#3a2a3a'); pg.addColorStop(1, '#160e1a');
  c.fillStyle = pg; c.fillRect(0, gy, W, H - gy);
  for (let i = 0; i < 10; i++) reflect(c, W * (0.05 + 0.1 * i) - pan * 0.5, gy + 4, 40, 160, i % 2 ? HEX.gold : HEX.pink, 0.25, t, 6);
}

// ------------------------------------------------------------------ H6, H8: bokeh behind the pendant

/** Out-of-focus town lights (bokeh discs) on a night street, in a palette; for the pendant close-ups. */
export function bokehStreet(c: C2, g: C2, t: number, cols: string[], o: { seed?: number; drift?: number } = {}) {
  const seed = o.seed ?? 1, drift = o.drift ?? 0;
  const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#120e2a'); bg.addColorStop(1, '#2a1c3c');
  c.fillStyle = bg; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 46; i++) {
    const x = ((W * h01(i, seed, 1) - drift * (0.5 + h01(i, seed, 2))) % W + W) % W, y = H * (0.05 + 0.75 * h01(i, seed, 3)), r = 30 + 90 * h01(i, seed, 4) ** 2;
    const col = cols[i % cols.length]!, a = 0.12 + 0.18 * h01(i, seed, 5) + 0.05 * Math.sin(t * 2 + i);
    c.fillStyle = rgbaHex(col, a); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.strokeStyle = rgbaHex(col, a * 1.4); c.lineWidth = 2; c.stroke();
    if (r > 70) glow(g, x, y, r, col, 0.06);
  }
}
