// Shared drawing for the bridge (`debate`), the breakdown (`lift`) and verse 4 (`turn`): the carrier (a faceless
// silhouette with a pole across the shoulders, person()'s proportions), a rim light for silhouettes on the glow
// layer, the five emblems of the bridge in neon line, a world camera, and the karaoke band placed title-safe.
import { W, H } from '../engine/gl';
import { HEX } from '../engine/palette';
import { font } from '../engine/type';
import type { Line } from '../engine/lyrics';
import { clamp, ease } from '../engine/util';
import { h01 } from './_rai';
import { FAM, TAU, karaoke, rgbaHex, type C2 } from './_motifs';

// ------------------------------------------------------------------ the carrier

export interface CarrierOpts {
  col?: string;
  t?: number;
  seed?: number;
  /** 0 arms down .. 1 hands on the pole at the shoulders. */
  arms?: number;
  /** 0 pole on the shoulders .. 1 pole pushed overhead at arm's length. */
  up?: number;
  /** Lean (radians), for a push. */
  lean?: number;
}

/** The pole's height above the feet (px) for a carrier of height h with `up`. */
export const poleY = (h: number, up = 0) => h * (0.79 + 0.5 * up);

/**
 * A carrier in silhouette, feet at (x, y), standing height h, facing us; the pole (drawn by the caller, before)
 * rests across the shoulders behind the neck, or overhead with `up`. Body shape varies with `seed` (build, hair,
 * a skirt) so a crowd reads as many different people. No face: Rai is the only face.
 */
export function carrier(c: C2, x: number, y: number, h: number, o: CarrierOpts = {}) {
  const col = o.col ?? HEX.ink, t = o.t ?? 0, s = o.seed ?? 0;
  const u = (h / 100) * (0.94 + 0.12 * h01(s, 1));
  const wide = 0.88 + 0.3 * h01(s, 2), hair = Math.floor(h01(s, 3) * 4), skirt = h01(s, 4) < 0.3;
  const sway = Math.sin(t * 1.6 + s) * 0.8 * u;
  c.save();
  c.translate(x, y); c.rotate(o.lean ?? 0);
  c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round';
  // legs
  c.lineWidth = 7.5 * u;
  c.beginPath(); c.moveTo(-6 * u * wide, 0); c.lineTo(-3 * u + sway, -44 * u); c.moveTo(6 * u * wide, 0); c.lineTo(3 * u + sway, -44 * u); c.stroke();
  // torso (a skirt flares it down to the knees)
  c.beginPath();
  if (skirt) { c.moveTo(-15 * u * wide + sway, -22 * u); c.lineTo(-9 * u * wide + sway, -60 * u); }
  else c.moveTo(-10 * u * wide + sway, -42 * u);
  c.quadraticCurveTo(-12 * u * wide + sway, -70 * u, -8 * u * wide + sway, -78 * u);
  c.lineTo(8 * u * wide + sway, -78 * u);
  c.quadraticCurveTo(12 * u * wide + sway, -70 * u, skirt ? 9 * u * wide + sway : 10 * u * wide + sway, skirt ? -60 * u : -42 * u);
  if (skirt) c.lineTo(15 * u * wide + sway, -22 * u);
  c.closePath(); c.fill();
  // head and hair
  const hx = sway, hy = -88 * u;
  c.beginPath(); c.arc(hx, hy, 9 * u, 0, TAU); c.fill();
  if (hair === 1) { c.beginPath(); c.arc(hx + 2 * u, hy - 9 * u, 4.5 * u, 0, TAU); c.fill(); }                    // a bun
  else if (hair === 2) { c.beginPath(); c.ellipse(hx, hy + 4 * u, 11 * u, 13 * u, 0, 0, TAU); c.fill(); }           // long hair
  else if (hair === 3) { c.lineWidth = 4 * u; c.beginPath(); c.moveTo(hx + 7 * u, hy - 4 * u); c.quadraticCurveTo(hx + 15 * u, hy + 2 * u, hx + 12 * u, hy + 12 * u); c.stroke(); } // a ponytail
  // arms: from the shoulders to the pole (or down)
  const arms = clamp(o.arms ?? 1), up = clamp(o.up ?? 0);
  c.lineWidth = 6 * u;
  for (const sd of [-1, 1]) {
    const sx = sway + sd * 8 * u * wide, sy = -74 * u;
    // down: hand at the hip; on the pole: elbow out and down, hand up at the pole beside the head; up: arms overhead
    const hdx = sd * (12 + (24 - 12) * arms - 8 * up) * u, hdy = (-44 + (-79 + 44) * arms - 49 * up * arms) * u;
    const ex = sway + sd * (14 + 10 * arms - 6 * up) * u, ey = (-58 - 6 * arms - 40 * up * arms) * u;
    c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(ex, ey, sway + hdx, hdy); c.stroke();
  }
  c.restore();
}

/**
 * A rim light on the glow layer: the shape drawn offset towards the light, then the shape itself cut out, so only
 * a crescent of colour remains on the lit edges (it blooms). The cut-out also hides any glow drawn behind the figure.
 */
export function rimmed(g: C2, draw: (c: C2, col: string) => void, col: string, dx: number, dy: number, alpha = 1) {
  if (alpha > 0.01) {
    g.save(); g.globalAlpha = alpha; g.translate(dx, dy); draw(g, col); g.restore();
  }
  g.save(); g.globalCompositeOperation = 'destination-out'; draw(g, '#000'); g.restore();
}

// ------------------------------------------------------------------ the emblems (neon line icons)

/** Neon line style: a bright core on the main layer, its bloom on the glow layer (both with the same path). */
export function neon(c: C2, g: C2 | null, col: string, lit: number, w: number, path: (k: C2) => void) {
  const off = rgbaHex(HEX.bone, 0.09);
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = lit > 0.02 ? col : off; c.globalAlpha *= lit > 0.02 ? 0.35 + 0.65 * lit : 1; c.lineWidth = w;
  c.beginPath(); path(c); c.stroke();
  c.restore();
  if (g && lit > 0.02) {
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = rgbaHex(col, 0.55 * lit); g.lineWidth = w * 2.2;
    g.beginPath(); path(g); g.stroke();
    g.restore();
  }
}

/** Neon flicker as a tube strikes on at t0 (deterministic in frameIdx). */
export function strike(t: number, t0: number, dur = 0.28): number {
  if (t < t0) return 0;
  const a = (t - t0) / dur;
  if (a >= 1) return 1;
  const k = Math.round(t * 60);
  return h01(k, 977) < 0.35 + 0.6 * a ? 0.4 + 0.6 * a : 0.05;
}

export type EmblemKind = 'calc' | 'tag' | 'house' | 'years' | 'board';
/** Event times for an emblem's own motion: a = the key word (count / price / numbers / pay / smash), b = the second
 * (seen / break / home / years / down). */
export interface EmblemEv { a: number; b: number; beat: number }

/** Draw an emblem centred at (x, y), size s (about its height), in col, lit 0..1. */
export function emblem(c: C2, g: C2 | null, kind: EmblemKind, x: number, y: number, s: number, col: string, lit: number, t: number, ev: EmblemEv) {
  const w = Math.max(2, s * 0.035);
  c.save(); g?.save();
  c.translate(x, y); g?.translate(x, y);
  const both = (fn: (k: C2) => void) => { fn(c); if (g) fn(g); };
  const fillText = (txt: string, px: number, py: number, size: number, fam: string, a = 1, color = col) => {
    if (lit < 0.02) return;
    c.save(); c.font = font(fam, size); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.globalAlpha *= a * lit; c.fillStyle = color; c.fillText(txt, px, py); c.restore();
    if (g) { g.save(); g.font = font(fam, size); g.textAlign = 'center'; g.textBaseline = 'middle'; g.globalAlpha *= 0.5 * a * lit; g.fillStyle = color; g.fillText(txt, px, py); g.restore(); }
  };
  if (kind === 'calc') {
    // a calculator: on "count" the display rolls up and settles on 1, with a little figure: she is seen
    const bw = s * 0.62, bh = s;
    neon(c, g, col, lit, w, (k) => { k.roundRect(-bw / 2, -bh / 2, bw, bh, s * 0.07); });
    neon(c, g, col, lit, w * 0.8, (k) => { k.roundRect(-bw / 2 + s * 0.06, -bh / 2 + s * 0.07, bw - s * 0.12, s * 0.24, s * 0.03); });
    for (let r = 0; r < 4; r++) for (let q = 0; q < 3; q++) {
      const bx = -bw / 2 + s * 0.1 + q * (bw - s * 0.2) / 2.0 - s * 0.045, by = -bh / 2 + s * 0.42 + r * s * 0.13;
      neon(c, g, col, lit * 0.8, w * 0.7, (k) => { k.roundRect(bx, by, s * 0.09, s * 0.07, s * 0.015); });
    }
    const roll = clamp((t - ev.a) / Math.max(0.3, ev.b - ev.a));
    const txt = t < ev.a ? '0' : roll < 1 ? String(Math.floor(h01(Math.round(t * 30), 5) * 9000 + 1000)) : '1';
    fillText(txt, s * 0.12, -bh / 2 + s * 0.19, s * 0.15, FAM.monoB(), 1, roll >= 1 ? HEX.bone : col);
    if (roll >= 1) { // the little figure in the display
      const fx = -bw / 2 + s * 0.16, fy = -bh / 2 + s * 0.26;
      c.save(); c.globalAlpha *= lit; c.fillStyle = HEX.bone;
      c.beginPath(); c.arc(fx, fy - s * 0.1, s * 0.022, 0, TAU); c.fill();
      c.fillRect(fx - s * 0.02, fy - s * 0.075, s * 0.04, s * 0.07); c.restore();
    }
  } else if (kind === 'tag') {
    // a price tag (£) that tears in two on "break"
    const tw = s * 0.95, th = s * 0.52;
    const tear = ease.outCubic(clamp((t - ev.b) / 0.5));
    const outline = (k: C2) => {
      k.moveTo(-tw / 2, 0); k.lineTo(-tw / 2 + th / 2, -th / 2); k.lineTo(tw / 2, -th / 2); k.lineTo(tw / 2, th / 2);
      k.lineTo(-tw / 2 + th / 2, th / 2); k.closePath();
      k.moveTo(-tw / 2 + th * 0.42 + s * 0.04, 0); k.arc(-tw / 2 + th * 0.42, 0, s * 0.04, 0, TAU);
    };
    const zig = (k: C2) => { k.moveTo(s * 0.08, -th / 2 - 2); for (let i = 1; i <= 6; i++) k.lineTo(s * 0.08 + (i % 2 ? -1 : 1) * s * 0.035, -th / 2 + (th * i) / 6); };
    // the string
    neon(c, g, col, lit * 0.7, w * 0.6, (k) => { k.moveTo(-tw / 2 + th * 0.42, 0); k.quadraticCurveTo(-tw * 0.7, -th * 0.9, -tw * 0.62, -th * 1.25); });
    for (const side of [-1, 1]) {
      const sh = tear * side;
      const half = (k: C2) => {
        k.beginPath();
        k.moveTo(side * tw, -th); k.lineTo(s * 0.08, -th);
        for (let i = 0; i <= 6; i++) k.lineTo(s * 0.08 + (i % 2 ? -1 : 1) * s * 0.035, -th / 2 + (th * i) / 6);
        k.lineTo(s * 0.08, th); k.lineTo(side * tw, th); k.closePath(); k.clip();
        k.translate(sh * s * 0.12, sh * sh * s * 0.06); k.rotate(sh * 0.22);
      };
      c.save(); g?.save();
      half(c); if (g) half(g);
      neon(c, g, col, lit, w, outline);
      c.restore(); g?.restore();
    }
    if (tear > 0) neon(c, g, col, lit * (1 - tear) * 0.8, w * 0.6, zig);
    fillText('£', s * 0.22 + tear * s * 0.12, s * 0.01 + tear * s * 0.06, s * 0.32, FAM.hook(), 1 - tear);
  } else if (kind === 'house') {
    // a house; numbers float to the door; on "home" the door shuts and they bounce away, the window warm
    const hw = s * 0.78, hh = s * 0.5, base = s * 0.42;
    neon(c, g, col, lit, w, (k) => { k.moveTo(-hw / 2, base); k.lineTo(-hw / 2, base - hh); k.lineTo(0, base - hh - s * 0.36); k.lineTo(hw / 2, base - hh); k.lineTo(hw / 2, base); k.closePath(); });
    const shut = ease.outBack(clamp((t - ev.b) / 0.2));
    const dw = s * 0.17, dh = s * 0.3, dx = -s * 0.12;
    neon(c, g, col, lit, w * 0.8, (k) => { k.rect(dx - dw / 2, base - dh, dw, dh); });
    // the door leaf: open (a thin sliver) until it shuts
    if (lit > 0.02) {
      c.save(); c.globalAlpha *= lit; c.fillStyle = rgbaHex(col, 0.85);
      const lw = dw * (0.12 + 0.88 * clamp(shut));
      c.fillRect(dx - dw / 2, base - dh, lw, dh); c.restore();
      // the window, lit warm inside
      c.save(); c.globalAlpha *= lit; c.fillStyle = rgbaHex(HEX.yellow, 0.75); c.fillRect(s * 0.1, base - hh + s * 0.08, s * 0.16, s * 0.13); c.restore();
      if (g) { g.save(); g.globalAlpha *= lit; g.fillStyle = rgbaHex(HEX.yellow, 0.35); g.fillRect(s * 0.1, base - hh + s * 0.08, s * 0.16, s * 0.13); g.restore(); }
    }
    // the numbers drifting in from the right (from "numbers"), bounced off by the shut door
    const glyphs = ['7', '£', '%', '3', '0', '9'];
    for (let i = 0; i < glyphs.length; i++) {
      const t0 = ev.a + i * 0.12;
      if (t < t0) continue;
      const fly = clamp((t - t0) / 0.9), bounce = clamp((t - ev.b) / 0.8);
      const sx = s * (0.95 + 0.25 * h01(i, 61)), sy = base - s * (0.1 + 0.5 * h01(i, 62));
      let px = sx + (dx - sx) * ease.outCubic(fly) * 0.8, py = sy + (base - dh / 2 - sy) * fly * 0.6;
      if (t > ev.b) { px += bounce * s * (0.8 + 0.4 * h01(i, 63)); py += bounce * bounce * s * 0.9 - bounce * s * 0.3; }
      fillText(glyphs[i]!, px, py, s * 0.13, FAM.monoB(), 1 - 0.7 * bounce, HEX.bone);
    }
  } else if (kind === 'years') {
    // a coin drops on "pay"; a calendar of years flips on the beats from "years"
    const cw = s * 0.62, ch = s * 0.66, cy0 = s * 0.08;
    neon(c, g, col, lit, w, (k) => { k.roundRect(-cw / 2, cy0 - ch / 2, cw, ch, s * 0.04); });
    neon(c, g, col, lit, w * 0.8, (k) => { k.moveTo(-cw / 2, cy0 - ch / 2 + s * 0.16); k.lineTo(cw / 2, cy0 - ch / 2 + s * 0.16); });
    for (const rx of [-cw * 0.25, cw * 0.25]) neon(c, g, col, lit, w * 0.8, (k) => { k.moveTo(rx, cy0 - ch / 2 - s * 0.06); k.lineTo(rx, cy0 - ch / 2 + s * 0.05); });
    fillText('YEARS', 0, cy0 - ch / 2 + s * 0.085, s * 0.08, FAM.monoB(), 0.9);
    const flips = t < ev.b ? 0 : Math.floor((t - ev.b) / ev.beat) + 1;
    fillText(String(flips), 0, cy0 + s * 0.1, s * 0.3, FAM.hook(), 1, flips > 0 ? HEX.bone : col);
    if (t >= ev.a - 0.3) { // the coin
      const drop = ease.outBack(clamp((t - ev.a) / 0.35));
      const px = cw * 0.55, py = cy0 - ch / 2 - s * 0.5 + drop * s * 0.38;
      neon(c, g, col, lit, w, (k) => { k.moveTo(px + s * 0.13, py); k.arc(px, py, s * 0.13, 0, TAU); });
      fillText('£', px, py + s * 0.01, s * 0.15, FAM.hook(), clamp((t - ev.a + 0.3) / 0.3));
    }
  } else if (kind === 'board') {
    // a scoreboard; a hammer swings in and cracks it on "smash"; on "down" it topples
    const fall = ease.inCubic(clamp((t - ev.b) / 0.6));
    const bw = s * 0.9, bh = s * 0.5;
    c.save(); g?.save();
    both((k) => { k.translate(-bw / 2, bh / 2); k.rotate(-fall * 0.5); k.translate(bw / 2, -bh / 2 + fall * s * 0.1); });
    neon(c, g, col, lit * (1 - 0.6 * fall), w, (k) => { k.rect(-bw / 2, -bh / 2, bw, bh); k.moveTo(-bw / 2, -bh / 2 + s * 0.13); k.lineTo(bw / 2, -bh / 2 + s * 0.13); });
    fillText('SCORE', 0, -bh / 2 + s * 0.068, s * 0.08, FAM.monoB(), 0.9 * (1 - fall));
    fillText('000', 0, s * 0.07, s * 0.22, FAM.monoB(), 1 - fall);
    if (t >= ev.a) { // the cracks from the impact
      const cr = clamp((t - ev.a) / 0.12);
      neon(c, g, HEX.bone, lit * cr * (1 - fall), w * 0.6, (k) => {
        const ix = bw * 0.3, iy = -bh * 0.05;
        for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + 0.3; k.moveTo(ix, iy); k.lineTo(ix + Math.cos(a) * s * 0.12 * cr, iy + Math.sin(a) * s * 0.1 * cr); k.lineTo(ix + Math.cos(a + 0.2) * s * 0.24 * cr, iy + Math.sin(a + 0.2) * s * 0.18 * cr); }
      });
    }
    c.restore(); g?.restore();
    // the hammer: raised until the swing, down on the board at "smash"
    const sw = t < ev.a - 0.25 ? 0 : t < ev.a ? ease.inCubic((t - ev.a + 0.25) / 0.25) : 1 - 0.15 * ease.outCubic(clamp((t - ev.a) / 0.4));
    const ang = -1.4 + 1.25 * sw;
    c.save(); g?.save();
    both((k) => { k.translate(bw * 0.72, bh * 0.6); k.rotate(ang); });
    neon(c, g, col, lit, w, (k) => { k.moveTo(0, 0); k.lineTo(-s * 0.5, -s * 0.05); });
    neon(c, g, col, lit, w, (k) => { k.rect(-s * 0.6, -s * 0.16, s * 0.12, s * 0.22); });
    c.restore(); g?.restore();
  }
  c.restore(); g?.restore();
}

// ------------------------------------------------------------------ camera and type

/** Apply a world camera: (cx, cy) world point at the frame's centre, zoom z. Call inside save/restore. */
export function camera(k: C2, cx: number, cy: number, z: number, sx = W / 2, sy = H / 2) {
  k.translate(sx, sy); k.scale(z, z); k.translate(-cx, -cy);
}

/**
 * The karaoke band: the line at the bottom, its last row's baseline title-safe (H - 100), with an optional dark
 * band behind it for busy backgrounds. Long lines are split into balanced rows here (each row its own karaoke call,
 * all timed to the whole line), so the block's height is known before it is drawn.
 */
export function band(c: C2, line: Line | null | undefined, t: number, o: { sung?: string; unsung?: string; size?: number; dark?: number; glow?: string; maxW?: number } = {}) {
  if (!line) return;
  const size = o.size ?? 50, maxW = o.maxW ?? W - 300;
  c.save();
  c.font = font(FAM.bold(), size);
  const sp = c.measureText(' ').width;
  const ws = line.words.map((w) => c.measureText(w.w).width);
  c.restore();
  const total = ws.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
  const k = Math.max(1, Math.ceil(total / maxW));
  const rows = partition(ws, sp, k);
  const lh = 1.2 * size;
  const yLast = H - 100;
  const first = line.words[0]!.start;
  const vis = clamp((t - (first - 0.4)) / 0.12) * (1 - clamp((t - line.end - 0.35) / 0.2));
  if ((o.dark ?? 0) > 0 && vis > 0) {
    const top = yLast - rows.length * lh - 40;
    const gr = c.createLinearGradient(0, top - 50, 0, H);
    gr.addColorStop(0, rgbaHex(HEX.ink, 0)); gr.addColorStop(0.3, rgbaHex(HEX.ink, (o.dark ?? 0) * vis)); gr.addColorStop(1, rgbaHex(HEX.ink, (o.dark ?? 0) * vis));
    c.fillStyle = gr; c.fillRect(0, top - 50, W, H - top + 50);
  }
  rows.forEach(([a, b], i) => {
    const words = line.words.slice(a, b);
    const sub: Line = { ...line, words, text: words.map((w) => w.w).join(' ') };
    const y = yLast - (rows.length - 1 - i) * lh;
    karaoke(c, sub, t, W / 2, y, size, { sung: o.sung, unsung: o.unsung, glow: o.glow, maxW: 1e5, lead: 0.4 + (words[0]!.start - first), until: line.end + 0.35 });
  });
}

/** Split word widths into k rows [start, end) minimising the widest row. */
function partition(ws: number[], sp: number, k: number): [number, number][] {
  const n = ws.length;
  const width = (a: number, b: number) => ws.slice(a, b).reduce((x, y) => x + y, 0) + sp * (b - a - 1);
  let best: [number, number][] = [[0, n]], bestW = width(0, n);
  if (k <= 1 || n < 2) return best;
  bestW = Infinity;
  const rec = (start: number, left: number, acc: [number, number][], mx: number) => {
    if (left === 1) {
      const m = Math.max(mx, width(start, n));
      if (m < bestW) { bestW = m; best = [...acc, [start, n]]; }
      return;
    }
    for (let e = start + 1; e <= n - left + 1; e++) rec(e, left - 1, [...acc, [start, e]], Math.max(mx, width(start, e)));
  };
  rec(0, Math.min(k, n), [], 0);
  return best;
}

/** A calm word for the bridge: fades and rises into place (no bounce), optionally leaving at t1. */
export function calmWord(c: C2, text: string, x: number, y: number, size: number, t: number, t0: number, o: { fam?: string; col?: string; align?: CanvasTextAlign; t1?: number; rot?: number } = {}) {
  if (t < t0) return;
  const a = clamp((t - t0) / 0.35) * (o.t1 !== undefined ? 1 - clamp((t - o.t1) / 0.3) : 1);
  if (a <= 0) return;
  c.save();
  c.globalAlpha *= a;
  c.translate(x, y + (1 - ease.outCubic(clamp((t - t0) / 0.5))) * 24);
  c.rotate(o.rot ?? 0);
  c.font = font(o.fam ?? FAM.cond(), size); c.textAlign = o.align ?? 'center'; c.textBaseline = 'middle';
  c.fillStyle = o.col ?? HEX.bone; c.fillText(text, 0, 0);
  c.restore();
}
