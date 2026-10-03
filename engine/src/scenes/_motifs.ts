// Shared motifs: backgrounds (sunbursts, halftone, gradients, stars, under water), the type voices (slams, kinetic
// words, karaoke, the serif of spoken parts), a ledger board, faceless silhouettes that emote, point clouds and morphs,
// bubbles. Canvas2D, in the 1920x1080 logical frame (y down). Use these so a motif looks the same in every plate.
// A few are from the worked example (examples/stone): stone() and ledger() are that film's motifs, kept as samples.
import { W, H } from '../engine/gl';
import { HEX } from '../engine/palette';
import { F, font } from '../engine/type';
import { Lyrics, type Line, type Word } from '../engine/lyrics';
import { clamp, ease } from '../engine/util';
import { h01 } from './_hash';
import { veinMark } from './_manga';

export type C2 = CanvasRenderingContext2D;
export const TAU = Math.PI * 2;

/** #rrggbb + alpha -> rgba(). */
export function rgbaHex(hex: string, a = 1): string {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${clamp(a, 0, 1)})`;
}
/** Mix two #rrggbb colours. */
export function mixHex(a: string, b: string, u: number): string {
  const p = parseInt(a.slice(1), 16), q = parseInt(b.slice(1), 16), v = clamp(u, 0, 1);
  const ch = (s: number) => Math.round(((p >> s) & 255) + (((q >> s) & 255) - ((p >> s) & 255)) * v);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

// ------------------------------------------------------------------ backgrounds

export function gradientV(c: C2, top: string, bottom: string, x = 0, y = 0, w = W, h = H) {
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, top); g.addColorStop(1, bottom);
  c.fillStyle = g; c.fillRect(x, y, w, h);
}

/** Rays from a point in two alternating colours ("Other Agents"' sunburst). */
export function sunburst(c: C2, cx: number, cy: number, a: string, b: string, rays = 16, spin = 0) {
  c.fillStyle = b; c.fillRect(0, 0, W, H);
  const R = Math.hypot(W, H);
  c.beginPath();
  for (let k = 0; k < rays; k++) {
    const a0 = (k / rays) * TAU + spin, a1 = a0 + Math.PI / rays;
    c.moveTo(cx, cy);
    c.lineTo(cx + R * Math.cos(a0), cy + R * Math.sin(a0));
    c.lineTo(cx + R * Math.cos(a1), cy + R * Math.sin(a1));
    c.closePath();
  }
  c.fillStyle = a; c.fill();
}

/** A halftone dot field, the dots growing towards one edge (dir 'down' = bigger at the bottom). */
export function halftone(c: C2, color: string, step = 26, dir: 'down' | 'up' | 'radial' = 'down', cx = W / 2, cy = H / 2) {
  c.fillStyle = color;
  c.beginPath();
  let row = 0;
  for (let y = 0; y < H + step; y += step * 0.866, row++) {
    for (let x = row % 2 ? step / 2 : 0; x < W + step; x += step) {
      const u = dir === 'down' ? y / H : dir === 'up' ? 1 - y / H : Math.min(1, Math.hypot(x - cx, y - cy) / (0.6 * W));
      const r = step * 0.42 * Math.max(0.08, u);
      c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU);
    }
  }
  c.fill();
}

/** Stars over the top part of the frame, twinkling. */
export function stars(c: C2, t: number, n = 220, yMax = H * 0.6, seed = 11) {
  for (let i = 0; i < n; i++) {
    const x = h01(i, seed) * W, y = h01(i, seed + 1) * yMax;
    const tw = 0.5 + 0.5 * Math.sin(t * (1 + 3 * h01(i, seed + 2)) + h01(i, seed + 3) * 6);
    const r = 0.6 + 1.6 * h01(i, seed + 4);
    c.fillStyle = `rgba(255,255,255,${0.2 + 0.7 * tw * h01(i, seed + 5)})`;
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }
}

/** Under water: god rays from the surface and drifting motes; depth 0 (near the top) .. 1 (the bottom). */
export function underwater(c: C2, t: number, depth: number, top = '#1f6e8c', bottom = '#05101f') {
  gradientV(c, mixHex(top, bottom, depth * 0.85), bottom);
  c.save();
  c.globalCompositeOperation = 'screen';
  for (let k = 0; k < 7; k++) {
    const x = (0.1 + 0.13 * k + 0.04 * Math.sin(t * 0.15 + k * 1.7)) * W;
    const spread = (0.05 + 0.03 * h01(k, 3)) * W;
    const a = 0.12 * (1 - depth) * (0.6 + 0.4 * Math.sin(t * 0.4 + k * 3));
    c.fillStyle = `rgba(159,227,255,${Math.max(0, a)})`;
    c.beginPath();
    c.moveTo(x - spread * 0.2, 0); c.lineTo(x + spread * 0.2, 0);
    c.lineTo(x + spread * 2.2, H); c.lineTo(x - spread * 1.4, H); c.closePath(); c.fill();
  }
  c.restore();
  for (let i = 0; i < 160; i++) {
    const px = h01(i, 41), py = (h01(i, 42) - t * 0.01 * (0.5 + h01(i, 43))) % 1;
    const s = 1 + 3 * h01(i, 44);
    c.fillStyle = `rgba(207,246,255,${0.12 + 0.22 * h01(i, 45)})`;
    c.beginPath(); c.arc((px + 0.01 * Math.sin(t * 0.3 + i)) * W, ((py + 1) % 1) * H, s, 0, TAU); c.fill();
  }
}

/** Bubbles rising (rings), deterministic in t. */
export function bubbles(c: C2, t: number, n = 30, seed = 3, speed = 0.18, color = 'rgba(191,244,255,0.6)') {
  c.strokeStyle = color;
  for (let i = 0; i < n; i++) {
    const x = h01(i, seed) * W + 14 * Math.sin(t * 1.3 + i);
    const y = H - ((h01(i, seed + 1) + t * speed * (0.6 + 0.8 * h01(i, seed + 2))) % 1.1) * H;
    const r = 3 + 12 * h01(i, seed + 3);
    c.lineWidth = 1.5 + r * 0.08;
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.5)';
    c.beginPath(); c.arc(x - r * 0.35, y - r * 0.35, r * 0.18, 0, TAU); c.fill();
  }
}

// ------------------------------------------------------------------ type

export const FAM = {
  hook: () => F.archivo(125, 900),    // the slams
  bold: () => F.archivo(100, 800),    // karaoke, kinetic words
  cond: () => F.archivo(62, 900),     // tall condensed stacks
  serif: () => F.serif(400, true),    // the spoken voice
  serifB: () => F.serif(600, true),
  mono: () => F.mono(500),            // the Ledger, machines
  monoB: () => F.mono(700),
};

/**
 * One word slammed in at t0: an overshooting scale-in (back-out), a hard offset shadow (the sticker look of
 * "Other Agents"), held, optionally leaving at t1. (x, y) is the word's centre.
 */
export function slam(c: C2, text: string, x: number, y: number, size: number, t: number, t0: number, o: {
  fam?: string; col?: string; shadow?: string; shadowOff?: number; rot?: number; t1?: number; exit?: number; align?: CanvasTextAlign; maxW?: number;
} = {}) {
  if (t < t0 - 0.02) return;
  { // shrink to fit (the slams ran off the frame): by default the title-safe width, 96 px each side
    c.font = font(o.fam ?? FAM.hook(), size);
    const w = c.measureText(text).width, maxW = o.maxW ?? W - 192;
    if (w > maxW) size *= maxW / w;
  }
  const exit = o.exit ?? 0.15;
  if (o.t1 !== undefined && t > o.t1 + exit) return;
  const age = t - t0;
  const k = age < 0.2 ? 1 + 0.5 * (1 - ease.outBack(clamp(age / 0.2))) : 1;
  const fade = o.t1 !== undefined ? 1 - clamp((t - o.t1) / exit) : 1;
  c.save();
  c.globalAlpha *= clamp(age / 0.04) * fade;
  c.translate(x, y);
  c.rotate(o.rot ?? 0);
  c.scale(k, k);
  c.font = font(o.fam ?? FAM.hook(), size);
  c.textAlign = o.align ?? 'center';
  c.textBaseline = 'middle';
  const off = (o.shadowOff ?? 0.06) * size;
  if (o.shadow) { c.fillStyle = o.shadow; c.fillText(text, off, off); }
  c.fillStyle = o.col ?? HEX.bone;
  c.fillText(text, 0, 0);
  c.restore();
}

/**
 * Karaoke: a line, shown dim from `lead` seconds before its first word, each word filling with `sung` as it is
 * sung (never ahead of the voice). Long lines wrap into rows no wider than `maxW`, the block centred on y.
 * align: 0 left, 0.5 centre, 1 right of x. Returns the number of rows.
 */
export function karaoke(c: C2, line: Line, t: number, x: number, y: number, size: number, o: {
  fam?: string; sung?: string; unsung?: string; align?: number; lead?: number; until?: number; glow?: string; maxW?: number; lineH?: number;
} = {}): number {
  const lead = o.lead ?? 0.4;
  const first = line.words[0]!.start;
  if (t < first - lead) return 0;
  const until = o.until ?? line.end + 0.35;
  if (t > until + 0.2) return 0;
  const fade = 1 - clamp((t - until) / 0.2);
  c.save();
  c.globalAlpha *= clamp((t - (first - lead)) / 0.12) * fade;
  c.font = font(o.fam ?? FAM.bold(), size);
  c.textBaseline = 'alphabetic';
  c.textAlign = 'left';
  const sp = c.measureText(' ').width;
  const ws = line.words.map((w) => c.measureText(w.w).width);
  // rows by width, balanced: as few rows as fit, then words spread evenly across them
  const maxW = o.maxW ?? W - 240, total = ws.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
  const nRows = Math.max(1, Math.ceil(total / maxW)), target = total / nRows;
  const rows: number[][] = [[]];
  let acc = 0;
  ws.forEach((w, i) => {
    if (rows[rows.length - 1]!.length && acc + w > target * 1.04 && rows.length < nRows + 1) { rows.push([]); acc = 0; }
    rows[rows.length - 1]!.push(i); acc += w + sp;
  });
  const lh = (o.lineH ?? 1.2) * size;
  let cy = y - ((rows.length - 1) * lh) / 2;
  for (const row of rows) {
    const rw = row.reduce((a, i) => a + ws[i]!, 0) + sp * (row.length - 1);
    let cx = x - rw * (o.align ?? 0.5);
    for (const i of row) {
      const w = line.words[i]!, p = Lyrics.wordProgress(w, t);
      c.fillStyle = o.unsung ?? 'rgba(244,241,234,0.62)';
      c.fillText(w.w, cx, cy);
      if (p > 0) {   // a left-to-right fill across the word as it is sung
        c.save();
        c.beginPath(); c.rect(cx - 2, cy - size * 1.2, (ws[i]! + 4) * p, size * 1.6); c.clip();
        if (o.glow) { c.shadowColor = o.glow; c.shadowBlur = 18; }
        c.fillStyle = o.sung ?? HEX.yellow;
        c.fillText(w.w, cx, cy);
        c.restore();
      }
      cx += ws[i]! + sp;
    }
    cy += lh;
  }
  c.restore();
  return rows.length;
}

/**
 * Kinetic words for the rapped verses: each word of a line slams in at its sung start, laid out in rows that fit
 * `maxW`, the block anchored at (x, y) (top-left). Accent words (lowercase match in `accents`) are bigger and coloured.
 */
export function kinetic(c: C2, line: Line, t: number, x: number, y: number, size: number, o: {
  fam?: string; col?: string; accent?: string; accents?: string[]; maxW?: number; shadow?: string; until?: number; lineH?: number;
} = {}) {
  const until = o.until ?? line.end + 0.25;
  if (t < line.words[0]!.start - 0.02 || t > until + 0.15) return;
  const fade = 1 - clamp((t - until) / 0.15);
  const fam = o.fam ?? FAM.bold(), maxW = o.maxW ?? W - 2 * x, lh = (o.lineH ?? 1.08) * size;
  c.save();
  c.globalAlpha *= fade;
  c.textBaseline = 'alphabetic';
  let cx = x, cy = y + size;
  for (const w of line.words) {
    const key = w.w.toLowerCase().replace(/[^a-z']/g, '');
    const acc = (o.accents ?? []).includes(key);
    const s = acc ? size * 1.3 : size;
    c.font = font(fam, s);
    const ww = c.measureText(w.w + ' ').width;
    if (cx + ww > x + maxW && cx > x) { cx = x; cy += lh; }
    const age = t - w.start;
    if (age >= -0.02) {
      const k = age < 0.16 ? 1 + 0.4 * (1 - ease.outBack(clamp(age / 0.16))) : 1;
      c.save();
      c.globalAlpha *= clamp(age / 0.04);
      const tw = c.measureText(w.w).width;
      c.translate(cx + tw / 2, cy - s * 0.35); c.scale(k, k); c.translate(-tw / 2, s * 0.35);
      if (o.shadow) { c.fillStyle = o.shadow; c.fillText(w.w, s * 0.05, s * 0.05); }
      c.fillStyle = acc ? (o.accent ?? HEX.yellow) : (o.col ?? HEX.bone);
      c.fillText(w.w, 0, 0);
      c.restore();
    }
    cx += ww;
  }
  c.restore();
}

/** The spoken voice: a line in Cormorant italic, each word fading up as it is said. */
export function spoken(c: C2, line: Line, t: number, x: number, y: number, size: number, o: { col?: string; align?: number; until?: number } = {}) {
  karaoke(c, line, t, x, y, size, { fam: FAM.serif(), sung: o.col ?? HEX.bone, unsung: 'rgba(244,241,234,0.0)', align: o.align ?? 0.5, lead: 0.05, until: o.until });
}

// ------------------------------------------------------------------ the Ledger

export interface LedgerRow { label: string; value: string; care: boolean; t?: number; lit?: number }

/**
 * The national accounts as a board (the Ledger): a dark rounded panel with a mono header and rows; paid rows in lime
 * with their £, care rows at 0 in pink (blinking when `blink` > 0), each row appearing at its t. `lit` (0..1) turns a
 * care row's 0 into a warm glow (verse 4).
 */
export function ledger(c: C2, t: number, x: number, y: number, w: number, rows: LedgerRow[], o: { title?: string; blink?: number; rowH?: number; size?: number } = {}) {
  const rh = o.rowH ?? 64, size = o.size ?? 30, h = 110 + rows.length * rh;
  c.save();
  c.shadowColor = rgbaHex(HEX.peri, 0.6); c.shadowBlur = 40;
  c.beginPath(); c.roundRect(x, y, w, h, 26); c.fillStyle = 'rgba(14,11,26,0.94)'; c.fill();
  c.restore();
  c.strokeStyle = rgbaHex(HEX.peri, 0.35); c.lineWidth = 2;
  c.beginPath(); c.roundRect(x, y, w, h, 26); c.stroke();
  c.font = font(FAM.mono(), 20); c.fillStyle = 'rgba(154,163,199,0.9)'; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  c.fillText(o.title ?? 'NATIONAL ACCOUNTS', x + 36, y + 52);
  c.strokeStyle = 'rgba(154,163,199,0.25)'; c.beginPath(); c.moveTo(x + 36, y + 70); c.lineTo(x + w - 36, y + 70); c.stroke();
  rows.forEach((r, i) => {
    const t0 = r.t ?? -1e9;
    if (t < t0) return;
    const a = clamp((t - t0) / 0.15);
    const ry = y + 70 + rh * (i + 0.75);
    c.save();
    c.globalAlpha *= a;
    c.font = font(FAM.mono(), size); c.textAlign = 'left'; c.fillStyle = HEX.bone;
    c.fillText(r.label, x + 36, ry);
    c.textAlign = 'right';
    if (r.care) {
      const lit = r.lit ?? 0;
      const blink = (o.blink ?? 0) > 0 && Math.floor(t * 4) % 2 === 0 ? 0.35 : 1;
      if (lit > 0) {
        c.shadowColor = HEX.gold; c.shadowBlur = 30 * lit;
        c.fillStyle = mixHex(HEX.pink, HEX.gold, lit);
        c.fillText(lit > 0.5 ? '♥' : '0', x + w - 36, ry);
      } else {
        c.shadowColor = HEX.pink; c.shadowBlur = 16;
        c.globalAlpha *= blink;
        c.fillStyle = HEX.pink; c.fillText(r.value || '0', x + w - 36, ry);
      }
    } else {
      c.fillStyle = HEX.lime; c.fillText(r.value, x + w - 36, ry);
    }
    c.restore();
  });
}

// ------------------------------------------------------------------ stones, people, places

/**
 * A plain rai stone (no face): a limestone disc standing a little turned, so its thickness shows as a darker slab
 * edge; grounded on a contact shadow, with lichen and a barnacle or two. When `heart` is set the hole fills with warm
 * light and a small glowing heart (concentric rings around a dark hole read as eyeballs at small sizes; a lit heart in
 * the hole does not). `glow` for the dim waiting stones.
 */
export function stone(c: C2, x: number, y: number, r: number, o: { glow?: string; glowA?: number; heart?: string; heartA?: number; tilt?: number; seed?: number } = {}) {
  const s = o.seed ?? 1, hr = r * 0.26, hy = r * 0.04, th = r * 0.24, sq = 0.88;
  const rim = (k: number) => { // an irregular outline, a little narrower than tall (turned)
    c.beginPath();
    for (let i = 0; i <= 30; i++) {
      const a = (i / 30) * TAU, rr = r * (1 + 0.04 * Math.sin(a * 3 + s) + 0.025 * Math.sin(a * 7 + s * 2));
      const px = Math.cos(a) * rr * sq + k, py = Math.sin(a) * rr;
      i ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    c.closePath();
  };
  c.save();
  c.translate(x, y); c.rotate(o.tilt ?? 0);
  // the contact shadow on the ground
  c.fillStyle = 'rgba(30,20,40,0.28)';
  c.beginPath(); c.ellipse(th * 0.5, r * 0.96, r * 0.95, r * 0.16, 0, 0, TAU); c.fill();
  // the slab's edge: the same outline offset, darker, with a lit top edge
  rim(th); c.fillStyle = '#857b6b'; c.fill(); c.strokeStyle = '#4f473b'; c.lineWidth = Math.max(1, r * 0.035); c.stroke();
  // the face of the disc, with its hole (a real hole: what is behind shows through)
  rim(0); c.moveTo(hr * sq * 0.95 + 0, hy); c.ellipse(0, hy, hr * sq * 0.95, hr, 0, 0, TAU);
  if (o.glow) { c.shadowColor = rgbaHex(o.glow, o.glowA ?? 0.8); c.shadowBlur = r * 0.45; }
  const g = c.createRadialGradient(-0.35 * r, -0.45 * r, 0, 0, 0, 1.05 * r);
  g.addColorStop(0, '#f1e9d6'); g.addColorStop(0.55, '#d2c6ad'); g.addColorStop(1, '#a3967d');
  c.fillStyle = g; c.fill('evenodd');
  c.shadowBlur = 0;
  c.strokeStyle = '#5f5646'; c.lineWidth = Math.max(1, r * 0.035); c.stroke();
  // texture: pits, lichen, a barnacle or two (an old stone, not a ball)
  for (let i = 0; i < 34; i++) {
    const a = h01(i, s, 5) * TAU, d = Math.sqrt(h01(i, s, 6)) * 0.86 * r, q = (0.012 + 0.024 * h01(i, s, 7)) * r;
    const px = Math.cos(a) * d * sq, py = Math.sin(a) * d;
    if (Math.hypot(px, py - hy) < hr * 1.25) continue;
    c.fillStyle = h01(i, s, 8) < 0.55 ? 'rgba(120,108,88,0.4)' : h01(i, s, 8) < 0.8 ? 'rgba(160,170,90,0.45)' : 'rgba(255,255,255,0.4)';
    c.beginPath(); c.arc(px, py, q, 0, TAU); c.fill();
  }
  for (let i = 0; i < 2; i++) {
    const a = 2.2 + i * 1.9 + h01(i, s, 9), px = Math.cos(a) * 0.72 * r * sq, py = Math.sin(a) * 0.72 * r, q = r * 0.07;
    c.fillStyle = '#e4dccb'; c.beginPath(); c.arc(px, py, q, 0, TAU); c.fill();
    c.fillStyle = '#4f473b'; c.beginPath(); c.arc(px, py, q * 0.38, 0, TAU); c.fill();
  }
  // the hole's inner wall (the slab's thickness again, inside)
  c.save();
  c.beginPath(); c.ellipse(0, hy, hr * sq * 0.95, hr, 0, 0, TAU); c.clip();
  if (o.heart) {
    const a = o.heartA ?? 0.9;
    const hg = c.createRadialGradient(0, hy, 0, 0, hy, hr);
    hg.addColorStop(0, rgbaHex('#fff4e0', a)); hg.addColorStop(1, rgbaHex(o.heart, a * 0.85));
    c.fillStyle = hg; c.fillRect(-hr, hy - hr, 2 * hr, 2 * hr);
  } else {
    c.fillStyle = 'rgba(80,70,58,0.9)'; c.beginPath(); c.ellipse(-hr * 0.5, hy, hr * 0.62, hr, 0, 0, TAU); c.fill();
  }
  c.restore();
  if (o.heart) { // a small glowing heart in the hole
    const a = o.heartA ?? 0.9, hs = hr * 0.62, cy = hy + hs * 0.12;
    c.save();
    c.shadowColor = rgbaHex(o.heart, 1); c.shadowBlur = r * 0.5 * a;
    c.fillStyle = rgbaHex(o.heart, Math.min(1, a * 1.1));
    c.beginPath(); c.moveTo(0, cy + hs * 0.55);
    c.bezierCurveTo(-hs * 1.15, cy - hs * 0.2, -hs * 0.55, cy - hs * 1.05, 0, cy - hs * 0.4);
    c.bezierCurveTo(hs * 0.55, cy - hs * 1.05, hs * 1.15, cy - hs * 0.2, 0, cy + hs * 0.55);
    c.fill();
    c.restore();
  }
  c.restore();
}

export type Pose = 'stand' | 'point' | 'carry' | 'hold' | 'sit' | 'paddle' | 'wave' | 'hands'
  | 'slump' | 'seated' | 'lean' | 'hug' | 'face' | 'cheer' | 'read';

export type Emote = 'tear' | 'tears' | 'sweat' | 'sigh' | 'heart' | 'zzz' | 'music' | 'anger' | '!' | '?' | 'joy';

/**
 * A person in silhouette (no face: one character keeps the only face), but they emote (the director's note: "a tear
 * drop down a cheek"): standing height h, feet at (x, y).
 * Poses: stand, point, carry (a pole on the shoulder), hold (a child), sit (legacy), paddle, wave, hands (holding
 * hands in a ring), slump (head down, shoulders forward), seated (on a chair or bed edge, side-on), lean (on a door
 * frame, arms crossed), hug, face (hands to the face), cheer (arms up), read (a book open in front).
 * `headTilt` tips the head (radians), `rim` adds a light rim on one side (readability on dark), `emote` adds a sign.
 */
export function person(c: C2, x: number, y: number, h: number, pose: Pose = 'stand', o: { col?: string; flip?: boolean; t?: number; seed?: number; headTilt?: number; rim?: string; emote?: Emote; emoteT0?: number } = {}) {
  const col = o.col ?? HEX.ink, t = o.t ?? 0, s = o.seed ?? 0;
  c.save();
  c.translate(x, y); if (o.flip) c.scale(-1, 1);
  c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round';
  const u = h / 100, breathe = Math.sin(t * 2 + s) * 0.8 * u;
  const slump = pose === 'slump' || pose === 'face' ? 1 : 0;
  const seated = pose === 'seated' ? 1 : 0;
  // legs
  c.lineWidth = 7.5 * u;
  if (seated) {
    c.beginPath(); c.moveTo(-4 * u, -40 * u); c.lineTo(18 * u, -40 * u); c.lineTo(20 * u, 0); c.stroke();
    c.beginPath(); c.moveTo(-2 * u, -38 * u); c.lineTo(14 * u, -36 * u); c.lineTo(14 * u, 0); c.stroke();
  } else {
    c.beginPath(); c.moveTo(-5 * u, 0); c.lineTo(-3 * u, -44 * u); c.moveTo(5 * u, 0); c.lineTo(3 * u, -44 * u); c.stroke();
  }
  // torso (leaning forward when slumped)
  const lean = slump * 8 * u, hipY = seated ? -40 * u : -42 * u, shY = (seated ? -76 : -78) * u + slump * 6 * u;
  c.beginPath(); c.moveTo(-10 * u, hipY); c.quadraticCurveTo(-12 * u, (hipY + shY) / 2, -7 * u + lean, shY);
  c.lineTo(7 * u + lean, shY); c.quadraticCurveTo(12 * u, (hipY + shY) / 2, 10 * u, hipY); c.closePath(); c.fill();
  // head
  const hx = lean * 1.3 + breathe * 0.3, hy = shY - 10 * u + slump * 5 * u, tilt = (o.headTilt ?? 0) + slump * 0.5;
  c.save(); c.translate(hx, hy); c.rotate(tilt);
  c.beginPath(); c.arc(0, 0, 9 * u, 0, TAU); c.fill();
  c.restore();
  // arms
  c.lineWidth = 6 * u;
  const sh = { x: lean, y: shY + 4 * u };
  const arm = (dx: number, ex: number, ey: number) => { c.beginPath(); c.moveTo(sh.x + dx, sh.y); c.quadraticCurveTo(sh.x + (dx + ex) / 2, sh.y + ey / 2 + 4 * u, sh.x + ex, sh.y + ey); c.stroke(); };
  switch (pose) {
    case 'point': arm(-8 * u, -14 * u, 30 * u); arm(8 * u, 40 * u, -10 * u); break;
    case 'carry': arm(-8 * u, -6 * u, -14 * u); arm(8 * u, 6 * u, -14 * u); break;
    case 'hold':
      arm(-8 * u, 4 * u, 18 * u); arm(8 * u, 10 * u, 16 * u);
      c.beginPath(); c.ellipse(sh.x + 8 * u, sh.y + 12 * u, 9 * u, 14 * u, 0.4, 0, TAU); c.fill();
      c.beginPath(); c.arc(sh.x + 13 * u, sh.y - 3 * u, 6 * u, 0, TAU); c.fill();
      break;
    case 'sit': arm(-8 * u, -10 * u, 26 * u); arm(8 * u, 12 * u, 26 * u); break;
    case 'seated': arm(-6 * u, 14 * u, 30 * u); arm(6 * u, 20 * u, 28 * u); break;
    case 'paddle': {
      const a = Math.sin(t * 3.4 + s) * 0.5;
      arm(-8 * u, -20 * u, 14 * u); arm(8 * u, 18 * u, 18 * u);
      c.lineWidth = 3 * u; c.beginPath(); c.moveTo(sh.x - 26 * u, sh.y + 4 * u); c.lineTo(sh.x + 30 * u + a * 10 * u, sh.y + 60 * u); c.stroke();
      break;
    }
    case 'wave': arm(-8 * u, -14 * u, 30 * u); arm(8 * u, 20 * u + Math.sin(t * 8) * 6 * u, -26 * u); break;
    case 'hands': arm(-8 * u, -30 * u, 22 * u); arm(8 * u, 30 * u, 22 * u); break;
    case 'slump': arm(-6 * u, -6 * u, 34 * u); arm(6 * u, 8 * u, 34 * u); break;
    case 'lean': // arms crossed, the body tipped against a frame on the right
      arm(-8 * u, 8 * u, 14 * u); arm(8 * u, -6 * u, 16 * u); break;
    case 'hug': arm(-8 * u, 16 * u, 6 * u); arm(8 * u, 22 * u, 10 * u); break;
    case 'face': arm(-8 * u, -2 * u, -12 * u + hy - sh.y + 10 * u); arm(8 * u, 4 * u, -12 * u + hy - sh.y + 10 * u); break;
    case 'cheer': arm(-8 * u, -22 * u, -34 * u + Math.sin(t * 9) * 3 * u); arm(8 * u, 22 * u, -34 * u + Math.cos(t * 9) * 3 * u); break;
    case 'read':
      arm(-8 * u, 6 * u, 16 * u); arm(8 * u, 14 * u, 16 * u);
      c.save(); c.translate(sh.x + 10 * u, sh.y + 14 * u); c.rotate(-0.15);
      c.fillStyle = '#f4f1ea'; c.fillRect(-12 * u, -8 * u, 24 * u, 14 * u);
      c.strokeStyle = col; c.lineWidth = 1.5 * u; c.beginPath(); c.moveTo(0, -8 * u); c.lineTo(0, 6 * u); c.stroke();
      c.restore();
      break;
    default: arm(-8 * u, -12 * u, 30 * u); arm(8 * u, 12 * u, 30 * u);
  }
  if (o.rim) { // a rim of light down one side of the head and shoulders
    c.save(); c.strokeStyle = o.rim; c.lineWidth = 2.2 * u; c.globalAlpha = 0.9;
    c.beginPath(); c.arc(hx, hy, 9 * u, -1.9, 0.2); c.stroke();
    c.beginPath(); c.moveTo(7 * u + lean, shY); c.quadraticCurveTo(12 * u, (hipY + shY) / 2, 10 * u, hipY); c.stroke();
    c.restore();
  }
  // the emote, at the head (drawn unflipped so text and drops read the right way)
  if (o.emote) {
    c.save();
    if (o.flip) c.scale(-1, 1);
    const ex = (o.flip ? -1 : 1) * hx, ey = hy;
    emote(c, ex, ey, 9 * u * 1.5, o.emote, t, o.emoteT0 ?? -1e9);   // signs a size up from the head, so they read in a wide shot
    c.restore();
  }
  c.restore();
}

/** A silhouette's emotion sign at its head (centre ex, ey, head radius hr). */
export function emote(c: C2, ex: number, ey: number, hr: number, e: Emote, t: number, t0 = -1e9) {
  const a = clamp((t - t0) / 0.15);
  if (a <= 0) return;
  c.save();
  c.globalAlpha *= a;
  const drop = (dx: number, phase: number) => { // a tear sliding down the cheek
    const u = ((t + phase) % 1.4) / 1.4, yy = ey + hr * (0.1 + u * 1.6), s = hr * 0.32;
    c.fillStyle = '#bfe9ff'; c.strokeStyle = '#3b8fd6'; c.lineWidth = hr * 0.06;
    c.beginPath(); c.moveTo(ex + dx, yy - s * 1.6); c.quadraticCurveTo(ex + dx + s, yy, ex + dx, yy + s * 0.6); c.quadraticCurveTo(ex + dx - s, yy, ex + dx, yy - s * 1.6);
    c.fill(); c.stroke();
  };
  switch (e) {
    case 'tear': drop(hr * 0.75, 0); break;
    case 'tears': drop(hr * 0.75, 0); drop(-hr * 0.75, 0.6); break;
    case 'sweat': {
      const s = hr * 0.45; c.fillStyle = '#9fdcff'; c.strokeStyle = '#2b6fb8'; c.lineWidth = hr * 0.08;
      c.beginPath(); c.moveTo(ex + hr * 1.2, ey - hr - s); c.quadraticCurveTo(ex + hr * 1.2 + s, ey - hr + s * 0.5, ex + hr * 1.2, ey - hr + s * 0.9);
      c.quadraticCurveTo(ex + hr * 1.2 - s, ey - hr + s * 0.5, ex + hr * 1.2, ey - hr - s); c.fill(); c.stroke();
      break;
    }
    case 'sigh': { // a curling wisp of breath drifting out and up
      const u = (t % 2) / 2;
      c.strokeStyle = `rgba(255,255,255,${0.8 * (1 - u)})`; c.lineWidth = hr * 0.18; c.lineCap = 'round';
      const bx = ex + hr * (1.3 + u * 1.4), by = ey + hr * (0.4 - u * 1.2);
      c.beginPath();
      for (let i = 0; i <= 16; i++) {
        const v = i / 16, xx = bx + v * hr * 1.6, yy = by - v * hr * 0.6 + Math.sin(v * 9 + t * 3) * hr * 0.22;
        i ? c.lineTo(xx, yy) : c.moveTo(xx, yy);
      }
      c.stroke();
      break;
    }
    case 'heart': {
      const u = (t % 1.6) / 1.6, s = hr * 0.5, hx = ex, hy = ey - hr * (1.6 + u * 1.5);
      c.fillStyle = `rgba(255,79,154,${1 - u})`;
      c.beginPath(); c.moveTo(hx, hy + s * 0.35);
      c.bezierCurveTo(hx - s * 1.1, hy - s * 0.35, hx - s * 0.5, hy - s * 1.05, hx, hy - s * 0.45);
      c.bezierCurveTo(hx + s * 0.5, hy - s * 1.05, hx + s * 1.1, hy - s * 0.35, hx, hy + s * 0.35); c.fill();
      break;
    }
    case 'anger': veinMark(c, ex + hr * 1.1, ey - hr * 1.1, hr * 0.7 * (1 + 0.12 * Math.sin(t * 18))); break;
    case 'zzz': case 'music': case '!': case '?': case 'joy': {
      const txt = e === 'zzz' ? 'z' : e === 'music' ? '♪' : e === 'joy' ? '✦' : e;
      const u = (t % 1.5) / 1.5;
      c.font = font(F.archivo(100, 900), hr * (e === '!' || e === '?' ? 2.4 : 1.6));
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = e === 'music' || e === 'joy' ? '#ffd23f' : e === 'zzz' ? '#c6dcff' : '#f4f1ea';
      const yy = e === 'zzz' || e === 'music' ? ey - hr * (1.8 + u * 1.5) : ey - hr * 2.4;
      if (e === 'zzz' || e === 'music') c.globalAlpha *= 1 - u;
      c.fillText(txt, ex + hr * 1.3, yy);
      break;
    }
  }
  c.restore();
}

/** A palm in silhouette, rooted at (x, y), height h, leaning `lean` (radians). */
export function palm(c: C2, x: number, y: number, h: number, lean = 0.12, o: { col?: string; t?: number } = {}) {
  const col = o.col ?? HEX.ink, t = o.t ?? 0;
  c.save();
  c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round';
  const tx = x + Math.sin(lean) * h, ty = y - Math.cos(lean) * h;
  c.lineWidth = h * 0.045;
  c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.sin(lean) * h * 0.2, y - h * 0.55, tx, ty); c.stroke();
  for (let k = 0; k < 7; k++) {
    const a = -Math.PI / 2 + (k - 3) * 0.48 + 0.04 * Math.sin(t * 1.3 + k);
    const L = h * (0.42 + 0.08 * Math.sin(k * 2.3));
    const ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * 0.6 + L * 0.35;
    c.lineWidth = h * 0.02;
    c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx + Math.cos(a) * L * 0.5, ty + Math.sin(a) * L * 0.6 - L * 0.12, ex, ey); c.stroke();
    for (let j = 1; j < 9; j++) {
      const u = j / 9, px = tx + (ex - tx) * u, py = ty + (ey - ty) * u - Math.sin(u * Math.PI) * L * 0.12;
      const len = h * 0.07 * (1 - u * 0.6);
      c.lineWidth = h * 0.012;
      c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(a + 1.2) * len, py + Math.sin(a + 1.2) * len + len * 0.5); c.stroke();
      c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(a - 1.2) * len, py + Math.sin(a - 1.2) * len + len * 0.5); c.stroke();
    }
  }
  c.restore();
}

/** The sea's surface: layered wave lines to the horizon, `rough` 0 calm .. 1 storm. */
export function seaSurface(c: C2, t: number, horizon: number, col: string, rough = 0.2, lines = 26) {
  c.strokeStyle = col;
  for (let i = 0; i < lines; i++) {
    const u = i / lines, y = horizon + (H - horizon) * u * u;
    const amp = (2 + 18 * u) * (0.4 + 1.6 * rough);
    c.globalAlpha = 0.25 + 0.6 * u;
    c.lineWidth = 1 + 2.5 * u;
    c.beginPath();
    for (let x = -20; x <= W + 20; x += 24) {
      const yy = y + Math.sin(x * (0.012 - 0.008 * u) + t * (1 + rough * 2) + i * 1.7) * amp;
      if (x === -20) c.moveTo(x, yy); else c.lineTo(x, yy);
    }
    c.stroke();
  }
  c.globalAlpha = 1;
}

// ------------------------------------------------------------------ the ring of points

/** n points filling a ring (inner..outer radius, px) about (cx, cy). */
export function ringPoints(cx: number, cy: number, inner: number, outer: number, n: number, seed = 1): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = h01(i, seed, 1) * TAU, r = Math.sqrt(inner * inner + h01(i, seed, 2) * (outer * outer - inner * inner));
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return out;
}

/** n points sampled from a word's ink (centred at cx, cy), via an offscreen canvas. */
export function textPointsAt(text: string, fam: string, size: number, cx: number, cy: number, n: number, seed = 1): [number, number][] {
  const cw = Math.ceil(size * text.length * 0.9 + 40), ch = Math.ceil(size * 1.4);
  const oc = new OffscreenCanvas(cw, ch), g = oc.getContext('2d')!;
  g.font = font(fam, size); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff';
  g.fillText(text, cw / 2, ch / 2);
  const data = g.getImageData(0, 0, cw, ch).data;
  const ink: number[] = [];
  for (let y = 0; y < ch; y += 2) for (let x = 0; x < cw; x += 2) if (data[(y * cw + x) * 4 + 3]! > 128) ink.push(x, y);
  const out: [number, number][] = [];
  const m = ink.length / 2;
  for (let i = 0; i < n && m > 0; i++) {
    const k = Math.floor(h01(i, seed, 3) * m);
    out.push([cx - cw / 2 + ink[2 * k]! + h01(i, seed, 4) * 2, cy - ch / 2 + ink[2 * k + 1]! + h01(i, seed, 5) * 2]);
  }
  return out;
}

/**
 * Pour points from A to B as u goes 0 -> 1 (each point on its own eased, slightly delayed path, swirling), drawn as
 * glowing dots coloured from colA to colB.
 */
export function morph(c: C2, A: [number, number][], B: [number, number][], u: number, colA: string, colB: string, r = 2.2) {
  const n = Math.min(A.length, B.length);
  c.save();
  for (let i = 0; i < n; i++) {
    const d = h01(i, 77) * 0.35, v = ease.inOutCubic(clamp((u - d) / (1 - d + 1e-6)));
    const [ax, ay] = A[i]!, [bx, by] = B[i]!;
    const sw = Math.sin(v * Math.PI) * 60 * (h01(i, 78) - 0.5);
    const x = ax + (bx - ax) * v + sw, y = ay + (by - ay) * v - Math.sin(v * Math.PI) * 40 * h01(i, 79);
    c.fillStyle = mixHex(colA, colB, v);
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }
  c.restore();
}

/** A 3:2 harmonograph (Lissajous) knot: drawn up to fraction `draw` (0..1), at (cx, cy) radius r. */
export function harmonograph(c: C2, cx: number, cy: number, r: number, o: { draw?: number; col?: string; width?: number; phase?: number; decay?: number } = {}) {
  const n = 900, upto = Math.floor(n * clamp(o.draw ?? 1)), ph = o.phase ?? Math.PI / 2, dec = o.decay ?? 0;
  c.save();
  c.strokeStyle = o.col ?? HEX.gold; c.lineWidth = o.width ?? 3; c.lineCap = 'round';
  c.beginPath();
  for (let i = 0; i <= upto; i++) {
    const s = (i / n) * TAU * 2, e = Math.exp(-dec * s);
    const x = cx + Math.sin(3 * s + ph) * r * 1.15 * e, y = cy + Math.sin(2 * s) * r * e;
    if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
  }
  c.stroke();
  c.restore();
}

// ------------------------------------------------------------------ helpers

/** The current line among those of the scene (by content), or null. */
export function lineNow(lines: Line[], t: number, lead = 0.4): Line | null {
  let best: Line | null = null;
  for (const l of lines) if (t >= l.words[0]!.start - lead) best = l;
  return best;
}
/** All words of these lines, in order. */
export const wordsOf = (lines: Line[]): Word[] => lines.flatMap((l) => l.words);
