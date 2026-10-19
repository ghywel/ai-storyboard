// The medium kit: paint the frame like a painter, not like a vector app.
//
// Ported to TypeScript from huashu-art-motion by alchaincyf (花叔), MIT licence (Copyright (c) 2026 alchaincyf):
// https://github.com/alchaincyf/huashu-art-motion (scripts/engine/lib/paint.js, brush.js, post.js, render.js, medium.js).
// Adapted for this engine: every helper works in logical px (1920x1080) at any output scale, offscreen canvases are
// sized in physical px like Layer2D, randomness is seeded (a frame is a pure function of time), and slow per-pixel work
// is cached once per key. The craft rules behind each helper are in CRAFT.md.
//
// The order that makes a frame read as painted (CRAFT.md §2):
//   1. ground: paper() or a flat underpainting that sets composition and values;
//   2. big areas through one renderer: watercolor() washes, or brokenColour() over the whole plate;
//   3. props on their own layer with finer settings (big strokes smash small things);
//   4. characters: flat fill, then the SAME medium via textureInside(), then clean contour (cel() does all three);
//   5. light: lightMap() + applyLight() over the whole frame, a separation light behind dark-side silhouettes;
//   6. the living motifs (2-4 small loops), then the post grade.
import { W, H, SCALE, scaleContext2D } from '../engine/gl';
import { mulberry32, fbm2, clamp, lerp } from '../engine/util';

export type RGB = [number, number, number];
export type Pt = [number, number];
type Ctx = CanvasRenderingContext2D;

// ---------- offscreen canvases (physical px, drawn in logical px) ----------
const CACHE = new Map<string, HTMLCanvasElement>();

/** A canvas the size of the frame in physical px whose context draws in logical px. */
export function canvas(w = W, h = H): { canvas: HTMLCanvasElement; ctx: Ctx } {
  const cv = document.createElement('canvas');
  cv.width = Math.round(w * SCALE);
  cv.height = Math.round(h * SCALE);
  return { canvas: cv, ctx: scaleContext2D(cv.getContext('2d', { willReadFrequently: false })!, SCALE) };
}
/** Draw once, keep for the whole render: use for anything static (paper, a painted backdrop, a light map that never moves). */
export function cached(key: string, draw: (g: Ctx, cv: HTMLCanvasElement) => void, w = W, h = H): HTMLCanvasElement {
  let cv = CACHE.get(key);
  if (!cv) { const o = canvas(w, h); draw(o.ctx, o.canvas); cv = o.canvas; CACHE.set(key, cv); }
  return cv;
}
/** A reusable scratch canvas, cleared on every call. */
export function scratch(key: string): { canvas: HTMLCanvasElement; ctx: Ctx } {
  let cv = CACHE.get('scratch:' + key);
  if (!cv) { cv = canvas().canvas; CACHE.set('scratch:' + key, cv); }
  const ctx = scaleContext2D(cv.getContext('2d')!, SCALE);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  ctx.clearRect(0, 0, W, H);
  return { canvas: cv, ctx };
}
/** Draw a full-frame offscreen canvas onto a context at 1:1 physical px. */
export const blit = (c: Ctx, cv: CanvasImageSource) => c.drawImage(cv, 0, 0, W, H);

// ---------- colour ----------
export const hex = (h: string): RGB => {
  let s = h.replace('#', ''); if (s.length === 3) s = s.split('').map((x) => x + x).join('');
  const n = parseInt(s, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const css = (c: RGB, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
export const mix = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/**
 * A region palette: richness without losing the value structure. Each call picks one of the region's 7-8 colours and
 * mixes `mixBase` (0.30-0.45) of the underlying colour back in, so strokes vary in hue but the region keeps its value.
 * (huashu 07 #6: region palettes beat random colour jitter, which muddies values.)
 */
export function swatch(hexes: string[], mixBase = 0.35) {
  const cs = hexes.map(hex);
  return (base: RGB, rnd: () => number): RGB => mix(cs[(rnd() * cs.length) | 0]!, base, mixBase);
}

// ---------- grounds ----------
/**
 * Paper, plaster or wall: a base colour with low-frequency mottle and fine grain. Cached per key. The mottle is computed
 * at quarter resolution and smoothed up (it is low-frequency anyway); the grain is a small seeded tile repeated, so a 4K
 * ground costs well under a second once.
 */
export function paper(key: string, base: string, { mottle = 22, scale = 0.004, grain = 12, dark, seed = 1 }: { mottle?: number; scale?: number; grain?: number; dark?: string; seed?: number } = {}) {
  return cached('paper:' + key, (g) => {
    const qw = Math.ceil(W / 4), qh = Math.ceil(H / 4);
    const low = document.createElement('canvas'); low.width = qw; low.height = qh;
    const lg = low.getContext('2d')!, im = lg.createImageData(qw, qh), d = im.data, b = hex(base), dk = dark ? hex(dark) : null;
    for (let y = 0; y < qh; y++) for (let x = 0; x < qw; x++) {
      const n = fbm2(x * 4 * scale + seed * 13.7, y * 4 * scale, 5, seed);
      const c = dk ? mix(b, dk, clamp(n * 1.2 + 0.25, 0, 1)) : b, i = (y * qw + x) * 4;
      d[i] = c[0] + n * mottle; d[i + 1] = c[1] + n * mottle; d[i + 2] = c[2] + n * mottle * 0.8; d[i + 3] = 255;
    }
    lg.putImageData(im, 0, 0);
    g.imageSmoothingQuality = 'high'; g.drawImage(low, 0, 0, W, H);
    if (grain > 0) {
      const T = 256, tile = document.createElement('canvas'); tile.width = T; tile.height = T;
      const tg = tile.getContext('2d')!, ti = tg.createImageData(T, T), td = ti.data, r = mulberry32(seed * 7919 + 3);
      for (let i = 0; i < T * T; i++) { const v = (r() - 0.5) * grain * 2; td[i * 4] = td[i * 4 + 1] = td[i * 4 + 2] = 128 + v; td[i * 4 + 3] = 255; }
      tg.putImageData(ti, 0, 0);
      g.save(); g.setTransform(1 / SCALE, 0, 0, 1 / SCALE, 0, 0);   // grain per physical px, like film
      g.globalCompositeOperation = 'overlay'; g.fillStyle = g.createPattern(tile, 'repeat')!; g.fillRect(0, 0, W * SCALE, H * SCALE);
      g.restore();
    }
  });
}

// ---------- watercolour washes ----------
/** Midpoint displacement: each round pushes every edge's midpoint along its normal (roughly Gaussian), amp ×0.6 per round. */
export function deform(pts: Pt[], depth: number, amp: number, rnd: () => number): Pt[] {
  let out = pts;
  for (let k = 0; k < depth; k++) {
    const n: Pt[] = [];
    for (let i = 0; i < out.length; i++) {
      const a = out[i]!, b = out[(i + 1) % out.length]!, len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const gg = (rnd() + rnd() + rnd() - 1.5) * amp * Math.min(1, len / 80);
      n.push(a, [(a[0] + b[0]) / 2 - ((b[1] - a[1]) / len) * gg, (a[1] + b[1]) / 2 + ((b[0] - a[0]) / len) * gg]);
    }
    out = n; amp *= 0.6;
  }
  return out;
}
const tracePts = (g: Ctx, pts: Pt[]) => { g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.closePath(); };
export const rectPts = (x: number, y: number, w: number, h: number): Pt[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
export const ellipsePts = (cx: number, cy: number, rx: number, ry: number, n = 18): Pt[] =>
  Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * Math.PI * 2) * rx, cy + Math.sin((i / n) * Math.PI * 2) * ry]);

/**
 * One watercolour wash: the shape is deformed, then laid down in `layers` translucent multiply passes, each re-deformed
 * and stroked at alpha `edge` so pigment pools at the rim (the tide-line). Measured settings (huashu 25_ghibli):
 *   big walls layers 5, alpha 0.4, amp 12 · colour blooms layers 3, alpha <= 0.045, amp 40 (more reads as mould) ·
 *   timber layers 3, alpha 0.5, amp 3, edge 0.14 · large darks: amp 60 polygons, never abutting rectangles (seams).
 * Opaque whites (cloud, cloth, window frames): blend 'source-over', alpha 0.9.
 */
export function watercolor(g: Ctx, pts: Pt[], color: string, { layers = 7, alpha = 0.13, amp = 10, seed = 1, edge = 0.1, blend = 'multiply' as GlobalCompositeOperation, fill }: { layers?: number; alpha?: number; amp?: number; seed?: number; edge?: number; blend?: GlobalCompositeOperation; fill?: string | CanvasGradient } = {}) {
  const r = mulberry32(seed * 7919 + 13), base = deform(pts, 3, amp, r);
  g.save(); g.globalCompositeOperation = blend; g.lineJoin = 'round';
  for (let k = 0; k < layers; k++) {
    const q = deform(base, 2, amp * 0.55, r);
    tracePts(g, q); g.globalAlpha = alpha; g.fillStyle = fill ?? color; g.fill();
    if (edge) { g.globalAlpha = edge; g.strokeStyle = color; g.lineWidth = 1.6; g.stroke(); }
  }
  g.restore();
}

// ---------- the same medium on characters ----------
/**
 * Texture inside a silhouette. `shape` is an offscreen canvas holding only the character (transparent elsewhere);
 * `drawTex` paints paper, grain or washes onto a scratch layer, which is cut to the silhouette with destination-in and
 * multiplied back. (source-atop paints the paper's own colour over the figure and whitens it: huashu migration test B.)
 * A character that skips the frame's medium reads as a pasted sticker (huashu 07 #8, the weakest point across 36 styles).
 */
export function textureInside(c: Ctx, shape: HTMLCanvasElement, drawTex: (g: Ctx) => void, { op = 'multiply' as GlobalCompositeOperation, alpha = 1, key = 'texInside' } = {}) {
  const s = scratch(key);
  drawTex(s.ctx);
  s.ctx.globalCompositeOperation = 'destination-in'; blit(s.ctx, shape);
  c.save(); c.globalCompositeOperation = op; c.globalAlpha = alpha; blit(c, s.canvas); c.restore();
}

/** Lost edges (huashu 32_rembrandt): the layer blurred and opaque, then a sharp copy on top at `sharp` alpha. */
export function lostEdges(c: Ctx, layer: HTMLCanvasElement, { blur = 2.4, sharp = 0.62 } = {}) {
  c.save(); c.filter = `blur(${blur}px)`; blit(c, layer); c.filter = 'none'; c.globalAlpha = sharp; blit(c, layer); c.restore();
}

// ---------- cel light: a shadow band from the shape minus its shifted self ----------
const BIG = () => { const p = new Path2D(); p.rect(-60, -60, W + 120, H + 120); return p; };
/** Clip to path ∩ ¬translate(path, dx, dy): the band on the side away from the light. */
export function clipBeside(c: Ctx, path: Path2D, dx: number, dy: number) {
  const m = new Path2D(); m.addPath(BIG()); m.addPath(path, new DOMMatrix().translate(dx, dy));
  c.clip(path); c.clip(m, 'evenodd');
}
/**
 * Cel-shade one part: base fill, a hard shadow band (width sd) on the side away from the light, a rim (width rw) on the
 * lit side, then a thin line. Draw parts back to front and occlusion is right for free. Light (lx, ly) points away from
 * the source: (-1, -0.55) = light from the upper left. Widths (huashu 35_shinkai): sd 22-30 big parts, 10 a face,
 * 8 small parts; rw 3-9. Never a pure-black line: a dark warm brown (#6a4632) at 2.2 px.
 */
export function cel(c: Ctx, p: Path2D, base: string, shade?: string, rim?: string, { sd = 22, rw = 7, line = '#6a4632', lw = 2.2, lx = -1, ly = -0.55 } = {}) {
  c.fillStyle = base; c.fill(p);
  if (shade) { c.save(); clipBeside(c, p, lx * sd, ly * sd); c.fillStyle = shade; c.fill(p); c.restore(); }
  if (rim) { c.save(); clipBeside(c, p, -lx * rw, -ly * rw); c.fillStyle = rim; c.fill(p); c.restore(); }
  if (lw) { c.strokeStyle = line; c.lineWidth = lw; c.lineJoin = 'round'; c.stroke(p); }
}

// ---------- one light for the whole frame ----------
/** A pool of light: a radial falloff in 'r,g,b' at alpha a, added with 'lighter' inside lightMap(). */
export function pool(g: Ctx, x: number, y: number, r: number, rgb: string, a: number) {
  const rg = g.createRadialGradient(x, y, 0, x, y, r);
  rg.addColorStop(0, `rgba(${rgb},${a})`); rg.addColorStop(0.45, `rgba(${rgb},${a * 0.55})`); rg.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = rg; g.fillRect(x - r, y - r, 2 * r, 2 * r);
}
/**
 * A light map: the ambient colour (how dark the unlit world is: chiaroscuro about rgb(30,21,13), moonlight a cool
 * rgb(40,52,80)), then pools added in `draw`. Multiply the finished, fully lit plate by it with applyLight(). One light
 * map for the whole frame unifies the lighting far better than shading each object (huashu render.js).
 * Add a separation light behind the dark side of a silhouette so it never merges into the ground.
 */
export function lightMap(key: string, ambient: string, draw: (g: Ctx) => void) {
  const s = scratch('light:' + key);
  s.ctx.fillStyle = ambient; s.ctx.fillRect(0, 0, W, H);
  s.ctx.globalCompositeOperation = 'lighter'; draw(s.ctx); s.ctx.globalCompositeOperation = 'source-over';
  return s.canvas;
}
export function applyLight(c: Ctx, map: HTMLCanvasElement) { c.save(); c.globalCompositeOperation = 'multiply'; blit(c, map); c.restore(); }

/**
 * Long cast shadows: each layer's silhouettes are drawn black into one buffer through a shear (so overlaps never
 * darken twice), then laid on the ground below clipY. kx larger = longer (evening). [groundY, draw] per layer.
 */
export function castShadow(c: Ctx, layers: [number, (g: Ctx) => void][], { kx = 1, ky = 0.22, clipY = 0, alpha = 0.55, blur = 1.5, key = 'castShadow' } = {}) {
  const s = scratch(key), g = s.ctx;
  g.fillStyle = '#000'; g.strokeStyle = '#000';
  for (const [yg, draw] of layers) { g.setTransform(1, 0, -kx, ky, kx * yg, yg * (1 - ky)); draw(g); }
  g.setTransform(1, 0, 0, 1, 0, 0);
  c.save(); c.beginPath(); c.rect(0, clipY, W, H); c.clip(); c.globalAlpha = alpha; if (blur) c.filter = `blur(${blur}px)`; blit(c, s.canvas); c.restore();
}

// ---------- broken colour: an impressionist re-stroke of a finished plate ----------
/**
 * Repaint a clean canvas as short, bent, tapered strokes (huashu medium.js MEDIUM.broken). Each stroke takes the plate's
 * colour there, pushed warm where it is lit and cool where it is dark (complementary, not just lighter and darker); 10%
 * of points are skipped so the blurred ground shows through; stroke order is shuffled so thick strokes overlap thin.
 * Expensive: call it once per static plate and cache the result (never re-seed a full frame per frame: at 8 fps that
 * reads as flicker; boil only line art, huashu 04).
 */
export function brokenColour(src: HTMLCanvasElement, { cell = 9, len = 26, wid = 8, passes = 2, angle = ((_x: number, _y: number) => 0) as (x: number, y: number) => number, seed = 1, warm = [255, 226, 160] as RGB, cool = [120, 120, 190] as RGB, jit = 22, skip = 0.1, sat = 1.06, base = true } = {}): HTMLCanvasElement {
  const out = canvas(), g = out.ctx, pw = src.width, ph = src.height, sx = pw / W, sy = ph / H;
  const d = src.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, pw, ph).data, r = mulberry32(seed * 977);
  if (base) { g.filter = 'blur(6px)'; g.drawImage(src, -14, -14, W + 28, H + 28); g.filter = 'none'; }   // overscan, so no faint ring at the edges
  g.lineCap = 'round';
  for (let pass = 0; pass < passes; pass++) {
    const cs = cell * (pass ? 0.62 : 1), L = len * (pass ? 0.6 : 1), Wd = wid * (pass ? 0.6 : 1), pts: Pt[] = [];
    for (let y = 0; y < H + cs; y += cs) for (let x = 0; x < W + cs; x += cs) pts.push([x + (r() - 0.5) * cs, y + (r() - 0.5) * cs]);
    for (let i = pts.length - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0; [pts[i], pts[j]] = [pts[j]!, pts[i]!]; }
    for (const [x, y] of pts) {
      if (r() < skip) continue;
      const k = ((clamp((y * sy) | 0, 0, ph - 1)) * pw + clamp((x * sx) | 0, 0, pw - 1)) * 4;
      if (d[k + 3]! < 8) continue;
      let R = d[k]!, G = d[k + 1]!, B = d[k + 2]!;
      const lum = (R * 0.3 + G * 0.59 + B * 0.11) / 255, t2 = (r() - 0.5) * 2;
      const tint = lum > 0.55 ? warm : cool, tm = Math.abs(t2) * 0.22 * (lum > 0.55 ? lum : 1 - lum);
      R = lerp(R, tint[0], tm) + t2 * jit * 0.5; G = lerp(G, tint[1], tm) + t2 * jit * 0.45; B = lerp(B, tint[2], tm) + t2 * jit * 0.4;
      const mx = (R + G + B) / 3; R = mx + (R - mx) * sat; G = mx + (G - mx) * sat; B = mx + (B - mx) * sat;
      const a = angle(x, y) + (r() - 0.5) * 0.35, l = L * (0.6 + r() * 0.8), wd = Wd * (0.6 + r() * 0.7), bend = (r() - 0.5) * 0.5 * l;
      const cx = Math.cos(a), sn = Math.sin(a);
      g.strokeStyle = `rgb(${clamp(R, 0, 255) | 0},${clamp(G, 0, 255) | 0},${clamp(B, 0, 255) | 0})`; g.globalAlpha = 0.9; g.lineWidth = wd;
      g.beginPath(); g.moveTo(x - (cx * l) / 2, y - (sn * l) / 2); g.quadraticCurveTo(x - sn * bend, y + cx * bend, x + (cx * l) / 2, y + (sn * l) / 2); g.stroke();
    }
  }
  g.globalAlpha = 1;
  return out.canvas;
}
