// Shared helpers for v1's verse-2 plates (pitch, quickfire, uptheroad): cut times on the beat grid, shot lookup, the
// lower third that swaps line by line (the kit's lowerThird, slid in on each new line), comic bubbles and sound-effect
// lettering, the buzzer marks (✗ / ✓), and a dot-matrix renderer that turns any small drawing into LEDs (the
// scoreboard's eye and zero). Only these three plates use this file.
import type { AudioData } from '../../engine/audio';
import type { Line, Word } from '../../engine/lyrics';
import { W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import { clamp, ease } from '../../engine/util';
import { FAM, TAU, rgbaHex } from '../_motifs';
import { h01 } from '../_rai';
import { lowerThird, withCam, closeBackdrop, type Cam } from './_studio';

export type C2 = CanvasRenderingContext2D;

/** The beat at or before t (the guide's cut rule, with its 20 ms tolerance for a pushed vocal). */
export const beatCut = (au: AudioData, t: number) => au.timeOfBeat(Math.floor(au.beatAt(t + 0.02)));

/** The plate's own lines (first word in the window) and the band's lines (plus the previous line still sung at the cut). */
export function plateLines(all: Line[], start: number, end: number) {
  const own = all.filter((l) => l.words[0]!.start >= start - 0.1 && l.words[0]!.start < end);
  const prev = all.filter((l) => l.words[0]!.start < start - 0.1 && l.end > start + 0.02);
  return { own, band: [...prev, ...own] };
}

/** The nth word whose letters (quotes and punctuation stripped) match re. Fails loudly while authoring. */
export function wordOf(lines: Line[], re: RegExp, nth = 0): Word {
  const w = lines.flatMap((l) => l.words).filter((x) => re.test(x.w.toLowerCase().replace(/[^a-z0-9'’]/g, '')))[nth];
  if (!w) throw new Error(`word not found: ${re} #${nth}`);
  return w;
}

/** The shot at t for ascending cut times: index, start, end, local time and progress. */
export function shotAt(cuts: number[], t: number, end: number) {
  let i = 0;
  while (i + 1 < cuts.length && t >= cuts[i + 1]!) i++;
  const s0 = cuts[i]!, s1 = cuts[i + 1] ?? end;
  return { i, s0, s1, lt: t - s0, u: clamp((t - s0) / Math.max(1e-3, s1 - s0)) };
}

/** The band's line at t: the one being sung, else the next within its lead, else the last until it fades. */
function bandLine(lines: Line[], t: number, lead = 0.4): { line: Line | null; since: number } {
  let cur: Line | null = null, ci = -1;
  lines.forEach((l, i) => { if (t >= l.words[0]!.start) { cur = l; ci = i; } });
  const next = lines[ci + 1] ?? null;
  if (!cur) return { line: next && t >= next.words[0]!.start - lead ? next : null, since: -1e9 };
  const c = cur as Line;
  if (t > c.end && next && t >= next.words[0]!.start - lead) return { line: next, since: next.words[0]!.start - lead };
  return { line: c, since: ci === 0 ? -1e9 : c.words[0]!.start };
}

/**
 * The lyric as the show's lower third, line by line: the line being sung, its plate sliding in from the left as the
 * line takes over (the kit's lowerThird does the karaoke and the plate). The first line of the plate is already in.
 */
export function lyricBand(c: C2, lines: Line[], t: number, o: { sung?: string } = {}) {
  const { line, since } = bandLine(lines, t);
  if (!line) return;
  const u = clamp((t - since) / 0.2);
  c.save();
  c.globalAlpha *= Math.min(1, u * 2.5);
  c.translate(-(1 - ease.outExpo(u)) * 140, 0);
  lowerThird(c, line, t, { until: line.end + 2, sung: o.sung });
  c.restore();
}

/** A comic speech bubble with a tail pointing at (tx, ty), popping in at t0 (overshoot), the text in Archivo heavy. */
export function bubble(c: C2, x: number, y: number, text: string, tx: number, ty: number, t: number, t0: number, o: { size?: number; col?: string; ink?: string; rot?: number; t1?: number } = {}) {
  if (t < t0) return;
  if (o.t1 !== undefined && t > o.t1 + 0.12) return;
  const size = o.size ?? 54, k = ease.outBack(clamp((t - t0) / 0.18), 2.4), fade = o.t1 !== undefined ? 1 - clamp((t - o.t1) / 0.12) : 1;
  c.save();
  c.globalAlpha *= fade;
  c.font = font(FAM.hook(), size);
  const tw = c.measureText(text).width, bw = tw + size * 1.1, bh = size * 1.7;
  c.translate(x, y); c.rotate(o.rot ?? -0.04); c.scale(k, k);
  const lx = tx - x, ly = ty - y;
  const path = () => {
    c.beginPath(); c.ellipse(0, 0, bw / 2, bh / 2, 0, 0, TAU);
    const a = Math.atan2(ly, lx), bx = Math.cos(a) * bw * 0.36, by = Math.sin(a) * bh * 0.36;
    c.moveTo(bx - Math.sin(a) * size * 0.35, by + Math.cos(a) * size * 0.35);
    c.lineTo(lx * 0.75, ly * 0.75);
    c.lineTo(bx + Math.sin(a) * size * 0.35, by - Math.cos(a) * size * 0.35);
  };
  c.lineJoin = 'round';
  path(); c.strokeStyle = o.ink ?? HEX.ink; c.lineWidth = size * 0.22; c.stroke();
  path(); c.fillStyle = o.col ?? HEX.bone; c.fill();
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = o.ink ?? HEX.ink;
  c.fillText(text, 0, size * 0.04);
  c.restore();
}

/** Comic sound-effect lettering (CLANG! THUD! BZZT! DING!): outlined, tilted, popping in at t0 and fading by t0 + hold. */
export function sfx(c: C2, text: string, x: number, y: number, size: number, t: number, t0: number, o: { col?: string; ink?: string; rot?: number; hold?: number } = {}) {
  const age = t - t0, hold = o.hold ?? 0.6;
  if (age < 0 || age > hold + 0.15) return;
  const k = 1 + 0.45 * (1 - ease.outBack(clamp(age / 0.14), 3)), a = 1 - clamp((age - hold) / 0.15);
  c.save();
  c.globalAlpha *= a;
  c.translate(x, y); c.rotate(o.rot ?? -0.12); c.scale(k, k);
  c.font = font(FAM.hook(), size); c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  c.lineWidth = size * 0.2; c.strokeStyle = o.ink ?? HEX.ink; c.strokeText(text, 0, 0);
  c.fillStyle = o.col ?? HEX.yellow; c.fillText(text, 0, 0);
  c.restore();
}

/** The buzzer's verdict: a big red ✗ or a gold ✓ in a lit disc, stamped in at t0 (radius r). */
export function verdict(c: C2, g: C2, kind: 'x' | 'tick', x: number, y: number, r: number, t: number, t0: number) {
  const age = t - t0;
  if (age < 0) return;
  const k = ease.outBack(clamp(age / 0.16), 2.6), col = kind === 'x' ? '#ff3b3b' : HEX.gold;
  const flick = age < 0.5 ? (Math.floor(age * 16) % 2 ? 0.75 : 1) : 1;
  c.save(); c.translate(x, y); c.scale(k, k);
  c.fillStyle = HEX.ink; c.beginPath(); c.arc(0, 0, r * 1.08, 0, TAU); c.fill();
  c.strokeStyle = col; c.lineWidth = r * 0.1; c.globalAlpha *= flick; c.beginPath(); c.arc(0, 0, r * 0.95, 0, TAU); c.stroke();
  c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = r * 0.26;
  c.beginPath();
  if (kind === 'x') { c.moveTo(-r * 0.45, -r * 0.45); c.lineTo(r * 0.45, r * 0.45); c.moveTo(r * 0.45, -r * 0.45); c.lineTo(-r * 0.45, r * 0.45); }
  else { c.moveTo(-r * 0.5, r * 0.02); c.lineTo(-r * 0.12, r * 0.4); c.lineTo(r * 0.52, -r * 0.42); }
  c.stroke();
  c.restore();
  g.save(); g.translate(x, y); g.scale(k, k);
  g.fillStyle = rgbaHex(col, 0.35 * flick * (age < 0.8 ? 1 : 0.6)); g.beginPath(); g.arc(0, 0, r * 1.25, 0, TAU); g.fill();
  g.restore();
}

/** The kit's withCam on both layers at once (the glow layer must move with the picture). */
export function cam2(c: C2, g: C2, cam: Cam, draw: () => void) {
  withCam(c, cam, () => withCam(g, cam, draw));
}

/**
 * A close shot's stage backdrop: the kit's closeBackdrop without its glow-layer bulbs (they would sit on top of the
 * foreground), with the out-of-focus bulbs painted behind instead.
 */
export function backdrop(c: C2, g: C2, t: number, col: string, n = 16, seed = 0) {
  closeBackdrop(c, g, t, { col, bulbs: 0 });
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const x = h01(i, 31 + seed) * W, y = h01(i, 32 + seed) * H * 0.7, r = 20 + 40 * h01(i, 33 + seed), a = 0.1 + 0.08 * Math.sin(t * 3 + i);
    const col2 = i % 3 ? HEX.gold : HEX.pink;
    const gr = c.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, rgbaHex(col2, a)); gr.addColorStop(0.8, rgbaHex(col2, a * 0.8)); gr.addColorStop(1, rgbaHex(col2, 0));
    c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }
  c.restore();
}

/** A soft dark vignette band at the top of the frame, so bugs and tags read on bright pictures. */
export function topShade(c: C2, a = 0.45) {
  const gr = c.createLinearGradient(0, 0, 0, 170);
  gr.addColorStop(0, `rgba(8,6,16,${a})`); gr.addColorStop(1, 'rgba(8,6,16,0)');
  c.fillStyle = gr; c.fillRect(0, 0, W, 170);
}

// ------------------------------------------------------------------ the dot-matrix renderer

const LED_PAL: [number, number, number, string][] = [
  [244, 241, 234, HEX.bone], [255, 79, 154, HEX.pink], [120, 214, 58, HEX.lime], [255, 59, 59, '#ff3b3b'], [246, 196, 83, HEX.gold],
];
export const LED = { bone: HEX.bone, pink: HEX.pink, lime: HEX.lime, red: '#ff3b3b', gold: HEX.gold };

/**
 * A low-resolution drawing turned into LEDs: `src` is a canvas one pixel per LED (cols x rows); each lit pixel becomes a
 * bright dot of its nearest palette colour at (x, y) + pitch-spaced grid, unlit pixels stay dim. Glow on `g`.
 */
export class LedMatrix {
  cv: OffscreenCanvas;
  cx: OffscreenCanvasRenderingContext2D;
  constructor(public cols: number, public rows: number) {
    this.cv = new OffscreenCanvas(cols, rows);
    this.cx = this.cv.getContext('2d', { willReadFrequently: true })!;
  }
  clear() { this.cx.setTransform(1, 0, 0, 1, 0, 0); this.cx.clearRect(0, 0, this.cols, this.rows); }
  /** Draw the matrix: grid origin (x, y), dot spacing `pitch`, dot radius r (default 0.36 pitch). */
  draw(c: C2, g: C2 | null, x: number, y: number, pitch: number, o: { r?: number; unlit?: string | null; glow?: number } = {}) {
    const r = o.r ?? pitch * 0.36, img = this.cx.getImageData(0, 0, this.cols, this.rows).data;
    if (o.unlit !== null) {
      c.fillStyle = o.unlit ?? '#1d1826';
      c.beginPath();
      for (let j = 0; j < this.rows; j++) for (let i = 0; i < this.cols; i++) {
        const px = x + (i + 0.5) * pitch, py = y + (j + 0.5) * pitch;
        c.moveTo(px + r, py); c.arc(px, py, r, 0, TAU);
      }
      c.fill();
    }
    // bucket the lit dots by palette colour and three brightness levels, one path each
    const buckets = new Map<string, [number, number][]>();
    for (let j = 0; j < this.rows; j++) for (let i = 0; i < this.cols; i++) {
      const k = (j * this.cols + i) * 4, a = img[k + 3]! / 255;
      if (a < 0.2) continue;
      const R = img[k]!, G = img[k + 1]!, B = img[k + 2]!;
      let best = 0, bd = 1e9;
      LED_PAL.forEach(([pr, pg, pb], pi) => { const d = (pr - R) ** 2 + (pg - G) ** 2 + (pb - B) ** 2; if (d < bd) { bd = d; best = pi; } });
      const lvl = a > 0.8 ? 2 : a > 0.5 ? 1 : 0;
      const key = `${best}|${lvl}`;
      const arr = buckets.get(key) ?? []; arr.push([x + (i + 0.5) * pitch, y + (j + 0.5) * pitch]); buckets.set(key, arr);
    }
    for (const [key, pts] of buckets) {
      const [pi, lvl] = key.split('|').map(Number) as [number, number];
      const col = LED_PAL[pi]![3], a = [0.45, 0.75, 1][lvl]!;
      c.fillStyle = rgbaHex(col, a);
      c.beginPath(); for (const [px, py] of pts) { c.moveTo(px + r, py); c.arc(px, py, r, 0, TAU); } c.fill();
      if (g && lvl >= 1) {
        g.fillStyle = rgbaHex(col, (o.glow ?? 0.5) * a);
        g.beginPath(); for (const [px, py] of pts) { g.moveTo(px + r * 1.7, py); g.arc(px, py, r * 1.7, 0, TAU); } g.fill();
      }
    }
  }
}
