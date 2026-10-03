// Shared kit for verse 2 and pre-chorus 2 (the plates trader, money, ledger, pre2): cut times from the beat grid,
// shot lookup, the karaoke in the bottom band, and the props these plates share (price tags, speech bubbles,
// stamps, the copy-pasted disc, the steamship and its smoke, mono readouts, Rai's manga cut-in panels). The places
// live in trader-sea.ts, money-places.ts and ledger-rooms.ts.
import type { AudioData } from '../engine/audio';
import type { Line, Word } from '../engine/lyrics';
import { W, H, SCALE } from '../engine/gl';
import { HEX } from '../engine/palette';
import { font } from '../engine/type';
import { clamp, ease } from '../engine/util';
import { FAM, TAU, gradientV, karaoke, rgbaHex, stone } from './_motifs';
import { panels, popIn, reactionBg } from './_manga';
import { h01 } from './_rai';

export type C2 = CanvasRenderingContext2D;

/** The beat (or 1/div beat) at or before t: the guide's cut rule, with its 20 ms tolerance for a pushed vocal. */
export const beatCut = (au: AudioData, t: number, div = 1) => au.timeOfBeat(Math.floor(au.beatAt(t + 0.02) * div) / div);

/** The plate's own lines (first word in the window), plus the previous line if it is still being sung at the cut. */
export function plateLines(all: Line[], start: number, end: number) {
  const own = all.filter((l) => l.words[0]!.start >= start - 0.1 && l.words[0]!.start < end);
  const prev = all.filter((l) => l.words[0]!.start < start - 0.1 && l.end > start + 0.02);
  return { own, band: [...prev, ...own] };
}

/** The nth word matching re across these lines (fails loudly while authoring). */
export function wordOf(lines: Line[], re: RegExp, nth = 0): Word {
  const w = lines.flatMap((l) => l.words).filter((x) => re.test(x.w.toLowerCase()))[nth];
  if (!w) throw new Error(`word not found: ${re} #${nth}`);
  return w;
}

/** The shot at t for ascending cut times: its index, start, end and local time. */
export function shotAt(cuts: number[], t: number, end: number) {
  let i = 0;
  while (i + 1 < cuts.length && t >= cuts[i + 1]!) i++;
  const s0 = cuts[i]!, s1 = cuts[i + 1] ?? end;
  return { i, s0, s1, lt: t - s0, u: clamp((t - s0) / Math.max(1e-3, s1 - s0)) };
}

/** The line for the bottom band: the one being sung, else the next within its lead, else the last until it fades. */
export function bandLine(lines: Line[], t: number, lead = 0.4): Line | null {
  let cur: Line | null = null;
  for (const l of lines) if (t >= l.words[0]!.start) cur = l;
  const next = lines.find((l) => l.words[0]!.start > t) ?? null;
  if (!cur) return next && t >= next.words[0]!.start - lead ? next : null;
  if (t > cur.end && next && t >= next.words[0]!.start - lead) return next;
  return cur;
}

/** Split word widths into n contiguous rows, minimising the widest row (n <= 4, a dozen or two words). */
function splitRows(ws: number[], sp: number, n: number): [number, number][] {
  const m = ws.length;
  const width = (a: number, b: number) => ws.slice(a, b).reduce((x, y) => x + y, 0) + sp * (b - a - 1);
  let best: { cost: number; rows: [number, number][] } = { cost: Infinity, rows: [[0, m]] };
  const rec = (a: number, k: number, rows: [number, number][], worst: number) => {
    if (worst >= best.cost) return;
    if (k === 1) { const w = Math.max(worst, width(a, m)); if (w < best.cost) best = { cost: w, rows: [...rows, [a, m]] }; return; }
    for (let b = a + 1; b <= m - (k - 1); b++) rec(b, k - 1, [...rows, [a, b]], Math.max(worst, width(a, b)));
  };
  rec(0, Math.min(n, m), [], 0);
  return best.rows;
}

/**
 * The karaoke in the bottom band (title-safe: the last row's baseline at H - 92), over a dark band when `dark` > 0.
 * Long lines are split into evenly balanced rows here (each row is drawn by karaoke(), the whole line shown dim from
 * 0.4 s before its first word, as one line).
 */
export function band(c: C2, lines: Line[], t: number, o: { sung?: string; unsung?: string; dark?: number; size?: number; glow?: string } = {}) {
  const line = bandLine(lines, t);
  const size = o.size ?? 48, maxW = W - 300, fam = FAM.bold(), dk = o.dark ?? 0.75;
  if (dk > 0) {
    gradientV(c, rgbaHex(HEX.ink, 0), rgbaHex(HEX.ink, dk), 0, H - 300, W, 120);
    c.fillStyle = rgbaHex(HEX.ink, dk); c.fillRect(0, H - 181, W, 181);
  }
  if (!line) return;
  c.save();
  c.font = font(fam, size);
  const sp = c.measureText(' ').width;
  const ws = line.words.map((w) => c.measureText(w.w).width);
  c.restore();
  const total = ws.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
  const rows = splitRows(ws, sp, Math.max(1, Math.ceil(total / maxW)));
  const lh = 1.2 * size, first = line.words[0]!.start;
  let y = H - 92 - (rows.length - 1) * lh;
  for (const [a, b] of rows) {
    const words = line.words.slice(a, b);
    const sub: Line = { ...line, words, start: words[0]!.start, end: line.end };
    karaoke(c, sub, t, W / 2, y, size, { sung: o.sung, unsung: o.unsung ?? 'rgba(244,241,234,0.62)', maxW: W, glow: o.glow, lead: words[0]!.start - first + 0.4, until: line.end + 0.35 });
    y += lh;
  }
}

/** A two-row phrase slam (top row smaller), both rows landing at t0. */
export function slam2(slamFn: (...a: any[]) => void, c: C2, a: string, b: string, x: number, y: number, size: number, t: number, t0: number, o: { colA?: string; colB?: string; shadow?: string; rot?: number; t1?: number } = {}) {
  slamFn(c, a, x, y - size * 0.62, size * 0.62, t, t0, { col: o.colA ?? HEX.pink, shadow: o.shadow, rot: o.rot, t1: o.t1 });
  slamFn(c, b, x, y + size * 0.2, size, t, t0 + 0.06, { col: o.colB ?? HEX.bone, shadow: o.shadow, rot: o.rot, t1: o.t1 });
}

// ------------------------------------------------------------------ props

/** One rai disc pre-rendered at output scale, to paste many identical copies (the trader's bulk discs). */
export function discSprite(r: number, seed = 7): { cv: HTMLCanvasElement; r: number } {
  const cv = document.createElement('canvas');
  const k = 1.15 * r;
  cv.width = Math.ceil(2 * k * SCALE); cv.height = Math.ceil(2 * k * SCALE);
  const g = cv.getContext('2d')!;
  g.scale(SCALE, SCALE);
  stone(g, k, k, r, { seed });
  return { cv, r };
}
export function paste(c: C2, sp: { cv: HTMLCanvasElement; r: number }, x: number, y: number, r: number) {
  const k = 1.15 * r;
  c.drawImage(sp.cv, x - k, y - k, 2 * k, 2 * k);
}

/**
 * A price tag hanging from (x, y) on a string of length `len`, swinging by `rot`; its text centred. `strike` (0..1)
 * draws a pink line through the old price; `stamp` is a second price stamped over it in coral.
 */
export function priceTag(c: C2, x: number, y: number, w: number, text: string, o: { len?: number; rot?: number; col?: string; ink?: string; strike?: number; stamp?: string; stampA?: number; glow?: string } = {}) {
  const len = o.len ?? w * 0.5, h = w * 0.62;
  c.save();
  c.translate(x, y); c.rotate(o.rot ?? 0);
  c.strokeStyle = rgbaHex(HEX.bone, 0.85); c.lineWidth = Math.max(1.5, w * 0.018);
  c.beginPath(); c.moveTo(0, 0); c.lineTo(0, len); c.stroke();
  c.translate(0, len);
  const cut = w * 0.18;
  c.beginPath();
  c.moveTo(0, 0); c.lineTo(w / 2, cut); c.lineTo(w / 2, cut + h); c.lineTo(-w / 2, cut + h); c.lineTo(-w / 2, cut); c.closePath();
  if (o.glow) { c.shadowColor = o.glow; c.shadowBlur = w * 0.25; }
  c.fillStyle = o.col ?? '#f2e6c9'; c.fill();
  c.shadowBlur = 0;
  c.strokeStyle = 'rgba(80,60,40,0.6)'; c.lineWidth = Math.max(1, w * 0.012); c.stroke();
  c.beginPath(); c.arc(0, cut * 0.75, w * 0.045, 0, TAU); c.fillStyle = HEX.ink; c.fill();
  c.font = font(FAM.hook(), h * 0.62); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = o.ink ?? HEX.ink;
  c.save();
  c.globalAlpha *= 1 - 0.8 * clamp((o.stampA ?? 0) * 1.5); // the old price fades under the new stamp
  c.fillText(text, 0, cut + h * 0.55);
  c.restore();
  if ((o.strike ?? 0) > 0 && (o.stampA ?? 0) < 0.7) {
    const tw = c.measureText(text).width * 0.6 + w * 0.1;
    c.strokeStyle = HEX.pink; c.lineWidth = h * 0.08; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-tw, cut + h * 0.75); c.lineTo(-tw + 2 * tw * clamp(o.strike!), cut + h * 0.75 - h * 0.45 * clamp(o.strike!)); c.stroke();
  }
  if (o.stamp && (o.stampA ?? 0) > 0) {
    const k = 1 + 0.6 * (1 - ease.outBack(clamp(o.stampA!)));
    c.save();
    c.translate(0, cut + h * 0.55); c.rotate(-0.18); c.scale(k, k);
    c.globalAlpha *= clamp(o.stampA! * 3);
    c.font = font(FAM.hook(), h * 0.5);
    const sw = c.measureText(o.stamp).width + w * 0.12;
    c.strokeStyle = HEX.coral; c.lineWidth = h * 0.06;
    c.strokeRect(-sw / 2, -h * 0.34, sw, h * 0.68);
    c.fillStyle = HEX.coral; c.fillText(o.stamp, 0, h * 0.02);
    c.restore();
  }
  c.restore();
}

/** A comic speech bubble (bone, ink text in the slam face), its tail pointing at (tx, ty); scales in from t0. */
export function bubble(c: C2, text: string, x: number, y: number, size: number, tx: number, ty: number, t: number, t0: number, o: { fam?: string; col?: string; ink?: string; t1?: number } = {}) {
  if (t < t0 - 0.02 || (o.t1 !== undefined && t > o.t1)) return;
  const age = t - t0, k = age < 0.18 ? 1 + 0.45 * (1 - ease.outBack(clamp(age / 0.18))) : 1;
  c.save();
  c.font = font(o.fam ?? FAM.hook(), size);
  const tw = c.measureText(text).width, pw = tw + size * 0.9, ph = size * 1.55;
  c.translate(x, y); c.scale(k, k);
  c.fillStyle = HEX.ink;
  c.beginPath(); c.roundRect(-pw / 2 + 10, -ph / 2 + 10, pw, ph, ph * 0.45); c.fill();
  c.beginPath(); c.moveTo(-pw * 0.12, ph * 0.35); c.lineTo((tx - x) / k, (ty - y) / k); c.lineTo(pw * 0.08, ph * 0.35); c.closePath();
  c.fillStyle = o.col ?? HEX.bone; c.fill();
  c.beginPath(); c.roundRect(-pw / 2, -ph / 2, pw, ph, ph * 0.45); c.fill();
  c.fillStyle = o.ink ?? HEX.ink; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(text, 0, size * 0.04);
  c.restore();
}

/** A rubber stamp (bordered text, rotated), thumping in at t0. */
export function stampText(c: C2, text: string, x: number, y: number, size: number, t: number, t0: number, o: { col?: string; rot?: number; fam?: string } = {}) {
  if (t < t0 - 0.02) return;
  const age = t - t0, k = age < 0.14 ? 1 + 0.8 * (1 - ease.outQuad(clamp(age / 0.14))) : 1;
  c.save();
  c.translate(x, y); c.rotate(o.rot ?? -0.12); c.scale(k, k);
  c.globalAlpha *= clamp(age / 0.05) * 0.92;
  c.font = font(o.fam ?? FAM.cond(), size);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  const tw = c.measureText(text).width + size * 0.6;
  c.strokeStyle = o.col ?? HEX.coral; c.lineWidth = size * 0.09;
  c.strokeRect(-tw / 2, -size * 0.62, tw, size * 1.24);
  c.fillStyle = o.col ?? HEX.coral; c.fillText(text, 0, size * 0.04);
  c.restore();
}

// ------------------------------------------------------------------ the trader's ship



/**
 * An iron-hulled steamship of the 1870s in periwinkle silhouette, bow to the left: (x, y) is the middle of its
 * waterline, s its length in px. Two masts with yards and rigging, one tall funnel. Returns the funnel top.
 */
export function steamship(c: C2, x: number, y: number, s: number, t: number, o: { col?: string; dark?: string; rivets?: boolean; flip?: boolean } = {}): [number, number] {
  const col = o.col ?? HEX.peri, dark = o.dark ?? '#3a4aa8';
  const P = (u: number, v: number): [number, number] => [x + (o.flip ? -u : u) * s, y + v * s];
  c.save();
  c.lineJoin = 'round'; c.lineCap = 'round';
  // masts, yards and rigging (behind the hull)
  c.strokeStyle = dark; c.lineWidth = Math.max(1.5, s * 0.006);
  for (const mu of [-0.27, 0.27]) {
    const [bx, by] = P(mu, -0.1), [tx, ty] = P(mu + 0.01, -0.46);
    c.beginPath(); c.moveTo(bx, by); c.lineTo(tx, ty); c.stroke();
    for (const [v, w] of [[-0.4, 0.07], [-0.32, 0.09]] as const) { const [a, b] = P(mu - w, v), [d, e] = P(mu + w, v); c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke(); }
  }
  c.lineWidth = Math.max(1, s * 0.0025);
  const rig: [number, number, number, number][] = [[-0.26, -0.46, -0.52, -0.13], [-0.26, -0.46, -0.05, -0.12], [0.28, -0.46, 0.05, -0.12], [0.28, -0.46, 0.49, -0.11], [-0.26, -0.44, 0.28, -0.44]];
  for (const [a, b, d, e] of rig) { const [p, q] = P(a, b), [r, w] = P(d, e); c.beginPath(); c.moveTo(p, q); c.lineTo(r, w); c.stroke(); }
  // the funnel, with a band
  const fw = 0.045, [f0x, f0y] = P(0.03 - fw / 2, -0.12), [f1x] = P(0.03 + fw / 2, -0.12), [, ftY] = P(0, -0.34);
  c.fillStyle = dark; c.fillRect(Math.min(f0x, f1x), ftY, Math.abs(f1x - f0x), f0y - ftY);
  c.fillStyle = HEX.ink; c.fillRect(Math.min(f0x, f1x), ftY + s * 0.02, Math.abs(f1x - f0x), s * 0.025);
  // the deckhouse
  { const [a, b] = P(-0.12, -0.155), [d] = P(0.16, -0.155); c.fillStyle = col; c.fillRect(Math.min(a, d), b, Math.abs(d - a), s * 0.05); }
  // the hull: a raked bow, a rounded counter stern
  const hull = () => {
    c.beginPath();
    c.moveTo(...P(-0.52, -0.12));
    c.quadraticCurveTo(...P(-0.47, -0.05), ...P(-0.45, 0.012));
    c.lineTo(...P(0.42, 0.012));
    c.quadraticCurveTo(...P(0.5, 0.0), ...P(0.5, -0.11));
    c.lineTo(...P(-0.52, -0.12));
    c.closePath();
  };
  hull();
  const g = c.createLinearGradient(0, y - 0.12 * s, 0, y + 0.012 * s);
  g.addColorStop(0, '#9fb1ff'); g.addColorStop(0.35, col); g.addColorStop(1, dark);
  c.fillStyle = g; c.fill();
  // portholes and rivets
  c.fillStyle = rgbaHex(HEX.yellow, 0.85);
  for (let k = 0; k < 14; k++) { const [px, py] = P(-0.36 + k * 0.055, -0.075); c.beginPath(); c.arc(px, py, s * 0.006, 0, TAU); c.fill(); }
  if (o.rivets ?? s > 900) {
    c.fillStyle = 'rgba(30,40,110,0.55)';
    for (const v of [-0.108, -0.045, -0.01]) for (let k = 0; k < 60; k++) { const [px, py] = P(-0.44 + k * 0.0148, v); c.beginPath(); c.arc(px, py, s * 0.0016, 0, TAU); c.fill(); }
    c.strokeStyle = 'rgba(30,40,110,0.4)'; c.lineWidth = Math.max(1, s * 0.0012);
    for (let k = 0; k < 12; k++) { const [px, py] = P(-0.4 + k * 0.075, -0.115); c.beginPath(); c.moveTo(px, py); c.lineTo(px, py + 0.12 * s); c.stroke(); }
  }
  // the bow wave
  c.strokeStyle = rgbaHex(HEX.bone, 0.7); c.lineWidth = Math.max(1.5, s * 0.004);
  for (let k = 0; k < 3; k++) {
    const [a, b] = P(-0.45 - 0.02 * k, 0.012 + 0.006 * k), [d, e] = P(-0.3 + 0.05 * k, 0.02 + 0.004 * k);
    c.beginPath(); c.moveTo(a, b); c.quadraticCurveTo((a + d) / 2, b - s * (0.01 + 0.004 * Math.sin(t * 6 + k)), d, e); c.stroke();
  }
  c.restore();
  return P(0.03, -0.34);
}

/**
 * Coal smoke from a moving funnel: puff k is born at tb = (n - k)/rate where n = floor(t*rate); it leaves the
 * funnel where the funnel was at tb (funnelAt(tb)) and drifts with the wind, growing and thinning.
 */
export function smoke(c: C2, t: number, funnelAt: (tb: number) => [number, number], o: { rate?: number; life?: number; size?: number; wind?: [number, number]; col?: string } = {}) {
  const rate = o.rate ?? 9, life = o.life ?? 2.4, size = o.size ?? 30, wind = o.wind ?? [160, -60];
  const n = Math.floor(t * rate), N = Math.ceil(life * rate);
  c.save();
  for (let k = N; k >= 0; k--) {
    const tb = (n - k) / rate, age = t - tb;
    if (age < 0 || age > life) continue;
    const u = age / life, [fx, fy] = funnelAt(tb);
    const x = fx + wind[0] * age + 30 * Math.sin(n - k + age * 2) * u, y = fy + wind[1] * age - 40 * Math.sqrt(age);
    const r = size * (0.5 + 2.4 * Math.sqrt(u)) * (0.8 + 0.4 * h01(n - k, 61));
    c.fillStyle = rgbaHex(o.col ?? '#2a2140', 0.75 * (1 - u));
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }
  c.restore();
}


/** A mono LED readout box (meters, counters): label above, value large. */
export function readout(c: C2, x: number, y: number, w: number, h: number, label: string, value: string, o: { col?: string; frame?: string; dim?: number; size?: number } = {}) {
  c.save();
  c.fillStyle = 'rgba(8,6,16,0.95)';
  c.strokeStyle = o.frame ?? rgbaHex(HEX.peri, 0.6); c.lineWidth = 4;
  c.beginPath(); c.roundRect(x, y, w, h, 18); c.fill(); c.stroke();
  c.font = font(FAM.mono(), 22); c.fillStyle = rgbaHex(HEX.bone, 0.6); c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.fillText(label, x + 26, y + 42);
  c.font = font(FAM.monoB(), o.size ?? h * 0.5); c.textAlign = 'right'; c.textBaseline = 'middle';
  c.fillStyle = rgbaHex(o.col ?? HEX.lime, 1 - (o.dim ?? 0) * 0.75);
  c.shadowColor = o.col ?? HEX.lime; c.shadowBlur = 24 * (1 - (o.dim ?? 0));
  c.fillText(value, x + w - 30, y + h * 0.6);
  c.restore();
}

// ------------------------------------------------------------------ Rai's reaction cut-ins

/**
 * A manga cut-in panel (a slanted quad with a white gutter and an ink border) that pops in at t0, its background a
 * reaction screen; `draw` paints inside it (full-frame coordinates, clipped).
 */
export function cutIn(c: C2, t: number, t0: number, quad: [number, number][], bg: [kind: 'stripes' | 'tone' | 'rays' | 'flat', a: string, b: string], draw: () => void) {
  const p = popIn(t, t0, 0.2);
  if (p <= 0) return;
  const cx = quad.reduce((a, q) => a + q[0], 0) / quad.length, cy = quad.reduce((a, q) => a + q[1], 0) / quad.length;
  c.save();
  c.translate(cx, cy); c.scale(p, p); c.translate(-cx, -cy);
  panels(c, [quad], () => { reactionBg(c, bg[0], bg[1], bg[2], t); draw(); }, { bw: 7 });
  c.restore();
}
