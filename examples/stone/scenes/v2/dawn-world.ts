// v2 `dawn` and `wedding` (TREATMENT-v2.md): the island at dawn and its people, built for these two plates. The light
// is one sunrise through the whole final chorus: the sun is below the sea's horizon at the breach (pink above, gold at
// the horizon) and comes up only on the last line, through the hole in Rai's heart. Looking out to sea everything is
// backlit (silhouettes with gold rims, the glitter path); looking inland the western sky is cooler (the pink Belt of
// Venus over the blue earth shadow) and faces take the warm front light.
//
// Canvas2D in the 1920x1080 logical frame, y down, pure functions of t. `c` is the main layer, `g` the additive glow.
import { W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import { clamp, ease, frameIdx } from '../../engine/util';
import { h01 } from '../_rai';
import { FAM, TAU, rgbaHex, mixHex, emote, type Emote } from '../_motifs';
import { discStone } from '../_world';

type C2 = CanvasRenderingContext2D;
export type P = { x: number; y: number };
const PI = Math.PI;

/** A colour shaded towards the dawn's violet shadow (as _world's shade, so our set pieces match the island's). */
export function shade(hex: string, dark: number): string { return mixHex(hex, '#1a1638', dark * 0.7); }

// ------------------------------------------------------------------ sky, clouds, sea, sand

export interface SkyOpts { hz: number; sunX: number; k: number; look: 'sea' | 'land'; top?: number }
/** The dawn sky down to the horizon `hz`. `k` 0..1 is how far the dawn has come (brighter, warmer). */
export function dawnSky(c: C2, g: C2, o: SkyOpts) {
  const { hz, sunX, k } = o, top = o.top ?? -H * 0.6;
  const gr = c.createLinearGradient(0, top, 0, hz);
  if (o.look === 'sea') {
    gr.addColorStop(0, mixHex('#1f1a58', '#34489e', k * 0.8));
    gr.addColorStop(0.36, mixHex('#4d3590', '#7a5cb4', k * 0.6));
    gr.addColorStop(0.64, mixHex('#c84c8c', '#ea6e9c', k * 0.6));
    gr.addColorStop(0.83, mixHex('#ff7e5e', '#ff9a68', k * 0.6));
    gr.addColorStop(1, mixHex('#ffbe66', '#ffe08c', k));
  } else { // inland: the western sky, the Belt of Venus over the earth's shadow
    gr.addColorStop(0, mixHex('#2a2f74', '#4660b4', k * 0.8));
    gr.addColorStop(0.5, mixHex('#6a66ac', '#8c98d0', k * 0.6));
    gr.addColorStop(0.78, mixHex('#e494b2', '#f6b6b6', k * 0.6));
    gr.addColorStop(0.9, mixHex('#c49ac0', '#e8c2bc', k * 0.6));
    gr.addColorStop(1, mixHex('#7a7cae', '#a6a8cc', k * 0.6));
  }
  c.fillStyle = gr; c.fillRect(-W, top, W * 3, hz - top + 2);
  if (o.look === 'sea') { // where the sun will come up: a hot glow hugging the horizon
    // gradients are drawn under the vertical squash, so their centres are given in squashed units
    const R = 1000 + 400 * k, q = 0.5;
    const sg = c.createRadialGradient(sunX, hz / q, 0, sunX, hz / q, R);
    sg.addColorStop(0, rgbaHex('#fff2c0', 0.85)); sg.addColorStop(0.12, rgbaHex('#ffcc6a', 0.5));
    sg.addColorStop(0.45, rgbaHex('#ff8a6a', 0.14)); sg.addColorStop(1, rgbaHex('#ff8a6a', 0));
    c.save(); c.scale(1, q); c.fillStyle = sg; c.fillRect(sunX - R, (hz - R * q) / q, 2 * R, R); c.restore();
    // the hot spot just over the horizon, brighter than white so the bloom catches it (on the main layer: whoever
    // stands in front of it hides it)
    const hs = c.createRadialGradient(sunX, hz / 0.45, 0, sunX, hz / 0.45, 300);
    hs.addColorStop(0, rgbaHex('#fff6d0', 0.4 + 0.3 * k)); hs.addColorStop(1, rgbaHex('#fff6d0', 0));
    c.save(); c.globalCompositeOperation = 'lighter'; c.scale(1, 0.45); c.fillStyle = hs; c.fillRect(sunX - 300, (hz - 135) / 0.45, 600, 300); c.restore();
  }
  void g;
}

/** Long thin dawn clouds, dusk-violet bodies lit gold and pink from underneath (brightest near the sun). */
export function dawnClouds(c: C2, o: { hz: number; sunX: number; k: number; t: number; pan?: number; seed?: number; look: 'sea' | 'land'; n?: number }) {
  const pan = o.pan ?? 0, seed = o.seed ?? 4, n = o.n ?? 7;
  for (let i = 0; i < n; i++) {
    const span = W + 1400;
    const x = ((h01(i, seed, 1) * span + o.t * (5 + 5 * h01(i, seed, 2)) - pan * 0.12) % span + span) % span - 700;
    const y = o.hz * (0.12 + 0.62 * h01(i, seed, 3)), w = 240 + 380 * h01(i, seed, 4), hh = 18 + 22 * h01(i, seed, 5);
    const near = clamp(1 - Math.abs(x - o.sunX) / 1300);
    const body = o.look === 'sea' ? mixHex('#5a3a86', '#8a5aa0', o.k * 0.6) : mixHex('#7a6aa8', '#a090c0', o.k * 0.6);
    const lit = o.look === 'sea' ? mixHex('#ff7aa0', '#ffd27a', near * 0.8 + o.k * 0.2) : mixHex('#f0a0b8', '#ffd0b0', o.k * 0.5);
    const blobs = (dy: number) => {
      c.beginPath();
      for (let j = 0; j < 5; j++) {
        const bx = x + (j - 2) * w * 0.2 + w * 0.05 * Math.sin(j * 2.1 + i), by = y + dy - hh * 0.35 * Math.sin((j / 4) * PI);
        c.moveTo(bx + w * 0.22, by); c.ellipse(bx, by, w * 0.22, hh * (0.7 + 0.3 * Math.sin((j / 4) * PI)), 0, 0, TAU);
      }
      c.fill();
    };
    c.fillStyle = lit; blobs(hh * 0.32);
    c.fillStyle = body; blobs(0);
  }
}

/** The sea from the horizon `hz` down to `y1`, reflecting the dawn, with the sun's glitter path under `sunX`. */
export function dawnSea(c: C2, g: C2, o: { hz: number; y1: number; sunX: number; k: number; t: number; pan?: number; glitter?: number }) {
  const { hz, y1, sunX, k, t } = o, pan = o.pan ?? 0;
  const gr = c.createLinearGradient(0, hz, 0, y1);
  gr.addColorStop(0, mixHex('#ffb070', '#ffd890', k)); gr.addColorStop(0.06, mixHex('#e0708e', '#f08a90', k));
  gr.addColorStop(0.35, mixHex('#6a4698', '#7a62b0', k)); gr.addColorStop(1, mixHex('#2a2a6c', '#33468e', k));
  c.fillStyle = gr; c.fillRect(-W, hz, W * 3, y1 - hz);
  // swell lines, lighter towards the horizon
  c.lineWidth = 2;
  for (let i = 0; i < 22; i++) {
    const u = (i + 1) / 23, y = hz + (y1 - hz) * Math.pow(u, 1.7), w = 30 + 220 * u;
    c.strokeStyle = rgbaHex('#ffd2c0', 0.28 * (1 - u * 0.6));
    for (let j = 0; j < 7; j++) {
      const x = ((h01(i, j, 61) * (W + 400) + t * 14 * (j % 2 ? 1 : -1) - pan * (0.2 + 0.8 * u)) % (W + 400) + W + 400) % (W + 400) - 200;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + w / 2, y - 2 - 2 * u, x + w, y); c.stroke();
    }
  }
  // the glitter path: dashes of gold under the sun, sparkling on twos
  const gl = o.glitter ?? 1, fk = Math.floor(frameIdx(t) / 2);
  if (gl > 0) for (let i = 0; i < 26; i++) {
    const u = (i + 0.5) / 26, y = hz + 2 + (y1 - hz) * Math.pow(u, 1.6), spread = 30 + 520 * u;
    for (let j = 0; j < 4; j++) {
      const x = sunX + (h01(i, j, fk) - 0.5) * spread - pan * (0.2 + 0.8 * u) * 0, ww = 8 + 46 * u * h01(i, j, 71);
      const a = gl * (0.35 + 0.6 * h01(i, j, fk + 1)) * (1 - u * 0.5);
      c.fillStyle = rgbaHex(a > 0.75 ? '#fffbe8' : '#ffe7a8', a); c.fillRect(x - ww / 2, y, ww, 2 + 2 * u);
    }
  }
}

/** The beach from `y0` (the waterline) down: lit sand, the wet strip mirroring the sky, the foam's edge. */
export function dawnSand(c: C2, o: { y0: number; k: number; t: number; pan?: number; look: 'sea' | 'land'; y1?: number; seed?: number; prints?: boolean; dry?: boolean }) {
  const { y0, k, t } = o, pan = o.pan ?? 0, y1 = o.y1 ?? H * 1.6, seed = o.seed ?? 2;
  const edge = (x: number) => y0 + 7 * Math.sin((x + pan) * 0.004 + seed) + 3 * Math.sin((x + pan) * 0.019);
  const gr = c.createLinearGradient(0, y0, 0, Math.min(y1, y0 + 700));
  if (o.look === 'sea') { gr.addColorStop(0, mixHex('#c88a8a', '#e6a88e', k)); gr.addColorStop(1, mixHex('#9a6a74', '#c08a7a', k)); }
  else { gr.addColorStop(0, mixHex('#e0a888', '#f2c49a', k)); gr.addColorStop(1, mixHex('#c88c78', '#e0a882', k)); }
  c.fillStyle = gr;
  c.beginPath(); c.moveTo(-W, y1);
  for (let x = -W; x <= W * 2; x += 40) c.lineTo(x, edge(x));
  c.lineTo(W * 2, y1); c.closePath(); c.fill();
  if (!o.dry) {
  // the wet strip: a sheen of sky
  const wg = c.createLinearGradient(0, y0, 0, y0 + 46);
  wg.addColorStop(0, rgbaHex(o.look === 'sea' ? '#ffc4a0' : '#e8b0c0', 0.5)); wg.addColorStop(1, rgbaHex('#ffc4a0', 0));
  c.fillStyle = wg; c.fillRect(-W, y0, W * 3, 46);
  // foam
  c.strokeStyle = 'rgba(255,240,230,0.85)'; c.lineWidth = 4;
  c.beginPath();
  for (let x = -W; x <= W * 2; x += 30) { const y = edge(x) - 3 + 4 * Math.sin(x * 0.03 + t * 2); x === -W ? c.moveTo(x, y) : c.lineTo(x, y); }
  c.stroke();
  }
  // ripples and shells in the sand
  c.strokeStyle = rgbaHex('#7a4a4a', 0.22); c.lineWidth = 2;
  for (let i = 0; i < 30; i++) {
    const x = ((h01(i, seed, 21) * (W + 600) - pan) % (W + 600) + W + 600) % (W + 600) - 300, y = y0 + 30 + h01(i, seed, 22) * 420;
    c.beginPath(); c.moveTo(x - 36, y); c.quadraticCurveTo(x, y - 7, x + 36, y); c.stroke();
  }
  if (o.prints) { // footprints up the beach: the whole village walked this way
    c.fillStyle = rgbaHex('#6a3a40', 0.25);
    for (let i = 0; i < 40; i++) {
      const x = ((h01(i, seed, 31) * (W + 600) - pan) % (W + 600) + W + 600) % (W + 600) - 300, y = y0 + 40 + h01(i, seed, 32) * 300;
      c.beginPath(); c.ellipse(x, y, 7, 3.5, 0.2, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(x + 16, y + 6, 7, 3.5, 0.2, 0, TAU); c.fill();
    }
  }
}

/** The rising sun (or its first limb): a gold disc with a white core, cut off by the horizon `hz`. */
export function sunDisc(c: C2, g: C2, x: number, y: number, r: number, hz: number, a = 1) {
  if (y - r > hz) return;
  c.save(); c.beginPath(); c.rect(x - r * 2, y - r * 2, r * 4, hz - (y - r * 2)); c.clip();
  const sg = c.createRadialGradient(x, y, 0, x, y, r);
  sg.addColorStop(0, rgbaHex('#fffbe8', a)); sg.addColorStop(0.7, rgbaHex('#ffe9a0', a)); sg.addColorStop(1, rgbaHex('#ffc24a', a));
  c.fillStyle = sg; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.restore();
  g.save(); g.beginPath(); g.rect(x - r * 5, y - r * 5, r * 10, hz - (y - r * 5)); g.clip();
  const gg = g.createRadialGradient(x, y, r * 0.3, x, y, r * 1.5);
  gg.addColorStop(0, rgbaHex('#ffe7a0', 0.7 * a)); gg.addColorStop(1, rgbaHex('#ffc860', 0));
  g.fillStyle = gg; g.fillRect(x - r * 1.5, y - r * 1.5, r * 3, r * 3);
  g.restore();
}

// ------------------------------------------------------------------ the island's set pieces

/** The girl's home, close: the stilt hut from the dive's first shot (thatch, the window still lit after the night), a
 *  porch on the right with steps down to the sand. (x, y) is the ground under its middle; s its scale (~person px). */
export function homeHut(c: C2, g: C2, x: number, y: number, s: number, o: { dark?: number; lit?: number } = {}) {
  const dark = o.dark ?? 0.15, lit = o.lit ?? 1;
  const floor = y - s * 0.42, wallT = floor - s * 0.8, wl = x - s * 0.9, wr = x + s * 0.55;
  c.save(); c.lineCap = 'round';
  // stilts and the ladder of steps to the porch
  c.strokeStyle = shade('#6f4a2a', dark); c.lineWidth = s * 0.05;
  for (const d of [-0.85, -0.3, 0.25, 0.5, 0.95]) { c.beginPath(); c.moveTo(x + d * s, y); c.lineTo(x + d * s, floor); c.stroke(); }
  c.fillStyle = shade('#8a5a32', dark); c.fillRect(wl - s * 0.05, floor - s * 0.02, (x + s * 1.02) - (wl - s * 0.05), s * 0.07);   // the deck
  c.strokeStyle = shade('#6f4a2a', dark); c.lineWidth = s * 0.03;
  for (let k = 0; k < 4; k++) { const sx = x + s * (1.02 + k * 0.1), sy = floor + s * 0.07 + k * s * 0.1; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + s * 0.12, sy); c.stroke(); }
  c.beginPath(); c.moveTo(x + s * 1.02, floor); c.lineTo(x + s * 1.46, y); c.stroke();
  // a rai stone leaning on the stilts (it was there at dusk, in the dive's first shot)
  discStone(c, wl + s * 0.08, y - s * 0.17, s * 0.17, -0.18, dark + 0.1);
  // the walls, planks
  c.fillStyle = shade('#c48a52', dark); c.fillRect(wl, wallT, wr - wl, floor - wallT);
  c.strokeStyle = shade('#9a6a3a', dark); c.lineWidth = 2;
  for (let k = 1; k < 9; k++) { const px = wl + (k / 9) * (wr - wl); c.beginPath(); c.moveTo(px, wallT + 4); c.lineTo(px, floor); c.stroke(); }
  // the window, still lit: the lamp burned all night
  const wx = x - s * 0.5, wy = wallT + s * 0.2, ww = s * 0.28, wh = s * 0.32;
  c.fillStyle = mixHex(shade('#5a3a20', dark), '#ffcf6b', lit); c.fillRect(wx - ww / 2, wy, ww, wh);
  c.strokeStyle = shade('#5a3a20', dark); c.lineWidth = s * 0.025; c.strokeRect(wx - ww / 2, wy, ww, wh);
  c.beginPath(); c.moveTo(wx, wy); c.lineTo(wx, wy + wh); c.moveTo(wx - ww / 2, wy + wh / 2); c.lineTo(wx + ww / 2, wy + wh / 2); c.stroke();
  if (lit > 0) { const lg = g.createRadialGradient(wx, wy + wh / 2, 0, wx, wy + wh / 2, s * 0.5); lg.addColorStop(0, rgbaHex('#ffcf6b', 0.55 * lit)); lg.addColorStop(1, rgbaHex('#ffcf6b', 0)); g.fillStyle = lg; g.fillRect(wx - s * 0.5, wy + wh / 2 - s * 0.5, s, s); }
  // the door, open, warm inside
  const dx = x + s * 0.12, dw = s * 0.3, dh = s * 0.62;
  const dg = c.createLinearGradient(0, floor - dh, 0, floor);
  dg.addColorStop(0, mixHex('#3a2418', '#ffc070', 0.8 * lit)); dg.addColorStop(1, mixHex('#3a2418', '#ff9a50', 0.6 * lit));
  c.fillStyle = dg; c.fillRect(dx - dw / 2, floor - dh, dw, dh);
  if (lit > 0) { const lg2 = g.createRadialGradient(dx, floor - dh * 0.5, 0, dx, floor - dh * 0.5, s * 0.4); lg2.addColorStop(0, rgbaHex('#ffb060', 0.35 * lit)); lg2.addColorStop(1, rgbaHex('#ffb060', 0)); g.fillStyle = lg2; g.fillRect(dx - s * 0.4, floor - dh * 0.5 - s * 0.4, s * 0.8, s * 0.8); }
  c.strokeStyle = shade('#5a3a20', dark); c.lineWidth = s * 0.03; c.strokeRect(dx - dw / 2, floor - dh, dw, dh);
  // the roof: thatch, deep eaves
  c.fillStyle = shade('#d9b25e', dark);
  const pk = (wl + wr) / 2;   // the dive's hut: a steep thatch, its slopes bellied a little
  c.beginPath(); c.moveTo(wl - s * 0.3, wallT + s * 0.06); c.quadraticCurveTo(pk - s * 0.08, wallT - s * 0.64, pk, wallT - s * 0.74);
  c.quadraticCurveTo(pk + s * 0.08, wallT - s * 0.64, wr + s * 0.3, wallT + s * 0.06); c.closePath(); c.fill();
  c.strokeStyle = shade('#a8843a', dark); c.lineWidth = 2;
  for (let k = 0; k < 26; k++) { const u = k / 25, px = wl - s * 0.28 + u * (wr - wl + s * 0.56); c.beginPath(); c.moveTo(px, wallT + s * 0.05); c.lineTo(px + (u - 0.5) * 8, wallT + s * 0.12); c.stroke(); }
  for (let k = 1; k < 5; k++) { // thatch courses
    const u = k / 5, y = wallT - s * 0.72 + u * s * 0.78, half = ((wr - wl) / 2 + s * 0.3) * u;
    c.beginPath(); c.moveTo((wl + wr) / 2 - half, y); c.lineTo((wl + wr) / 2 + half, y); c.stroke();
  }
  c.restore();
  return { door: { x: dx, y: floor }, porch: { x: x + s * 0.82, y: floor }, window: { x: wx, y: wy + wh / 2 } };
}

/** Where the stones of `stoneBank` (from _world, Yap's stone-money bank) stand, so their hearts can light. */
export function bankStones(x: number, y: number, k: number): { x: number; y: number; r: number }[] {
  return [70, 110, 55, 90, 45].map((r, i) => ({ x: x - 160 * k + i * 80 * k, y: y - 26 * k - r * k * 0.95 + r * k * 0.05, r: r * k }));
}
/** A stone's heart lighting: warm light in its hole and a glow around it. */
export function stoneHeart(c: C2, g: C2, x: number, y: number, r: number, a: number, col = HEX.gold) {
  if (a <= 0) return;
  const hr = r * 0.25;
  const hg = c.createRadialGradient(x, y, 0, x, y, hr);
  hg.addColorStop(0, rgbaHex('#fff4e0', a)); hg.addColorStop(1, rgbaHex(col, a * 0.8));
  c.fillStyle = hg; c.beginPath(); c.ellipse(x, y, hr * 0.94, hr, 0, 0, TAU); c.fill();
  const gg = g.createRadialGradient(x, y, 0, x, y, r * 0.9);
  gg.addColorStop(0, rgbaHex(col, 0.55 * a)); gg.addColorStop(1, rgbaHex(col, 0));
  g.fillStyle = gg; g.beginPath(); g.arc(x, y, r * 0.9, 0, TAU); g.fill();
}

/** An outrigger canoe afloat, side on: the hull on the waterline `y` (its keel under the water), the booms reaching
 *  back to the float, a lantern on a post at the stern (still burning from the night). `len` is its length in px. */
export function seaCanoe(c: C2, g: C2, x: number, y: number, len: number, o: { dark?: number; flip?: boolean; lantern?: number; t?: number } = {}) {
  const k = len / 340, dark = o.dark ?? 0.6, f = o.flip ? -1 : 1, t = o.t ?? 0;
  c.save(); c.translate(x, y); c.scale(f, 1);
  // the float, behind and smaller, and the booms
  c.fillStyle = shade('#7a5030', dark + 0.15); c.beginPath(); c.ellipse(-10 * k, -26 * k, 120 * k, 7 * k, 0, 0, TAU); c.fill();
  c.strokeStyle = shade('#6f4a2a', dark); c.lineWidth = 5 * k; c.lineCap = 'round';
  for (const d of [-60, 50]) { c.beginPath(); c.moveTo(d * k, -14 * k); c.lineTo(d * k - 6 * k, -28 * k); c.stroke(); }
  // the hull
  c.fillStyle = shade('#8a5a32', dark);
  c.beginPath(); c.moveTo(-170 * k, -40 * k);
  c.quadraticCurveTo(-150 * k, 10 * k, -60 * k, 12 * k); c.lineTo(60 * k, 12 * k);
  c.quadraticCurveTo(150 * k, 10 * k, 172 * k, -42 * k); c.quadraticCurveTo(140 * k, -16 * k, 100 * k, -14 * k);
  c.lineTo(-100 * k, -14 * k); c.quadraticCurveTo(-140 * k, -16 * k, -170 * k, -40 * k); c.closePath(); c.fill();
  c.strokeStyle = shade('#c48a52', dark); c.lineWidth = 3 * k;
  c.beginPath(); c.moveTo(-150 * k, -22 * k); c.quadraticCurveTo(0, -10 * k, 150 * k, -24 * k); c.stroke();
  // the lantern at the stern
  if (o.lantern !== undefined) {
    c.strokeStyle = shade('#5a3a20', dark); c.lineWidth = 3 * k; c.beginPath(); c.moveTo(-140 * k, -20 * k); c.lineTo(-150 * k, -110 * k); c.stroke();
    const ly = -118 * k + 2 * k * Math.sin(t * 2.2);
    c.fillStyle = HEX.orange; c.beginPath(); c.ellipse(-150 * k, ly, 10 * k, 13 * k, 0, 0, TAU); c.fill();
    c.fillStyle = rgbaHex('#fff0c8', 0.6 + 0.4 * o.lantern); c.beginPath(); c.ellipse(-150 * k, ly, 5 * k, 8 * k, 0, 0, TAU); c.fill();
    g.save(); g.translate(x, y); g.scale(f, 1);
    const lg = g.createRadialGradient(-150 * k, ly, 0, -150 * k, ly, 60 * k); lg.addColorStop(0, rgbaHex('#ffb050', 0.6 * o.lantern)); lg.addColorStop(1, rgbaHex('#ffb050', 0));
    g.fillStyle = lg; g.fillRect(-210 * k, ly - 60 * k, 120 * k, 120 * k); g.restore();
  }
  c.restore();
}

/** A wooden pole from (x0, y0) to (x1, y1), sagging `sag` px in the middle (a stone hangs from it). */
export function pole(c: C2, x0: number, y0: number, x1: number, y1: number, sag: number, w: number, dark = 0) {
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + sag * 2;
  c.save(); c.lineCap = 'round';
  c.strokeStyle = shade('#6a4426', dark); c.lineWidth = w;
  c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(mx, my, x1, y1); c.stroke();
  c.strokeStyle = shade('#b07a46', dark); c.lineWidth = w * 0.35;
  c.beginPath(); c.moveTo(x0, y0 - w * 0.22); c.quadraticCurveTo(mx, my - w * 0.22, x1, y1 - w * 0.22); c.stroke();
  c.restore();
}

// ------------------------------------------------------------------ the village, faceless (person()'s proportions)

export type FolkArms = 'down' | 'carry' | 'cheer' | 'wave' | 'throw' | 'clap' | 'reach' | 'heart' | 'point' | 'face' | 'hold';
export interface FolkOpts {
  t: number; col?: string; seed?: number; flip?: boolean;
  /** walking: the stride's phase (radians); undefined stands */
  walk?: number;
  /** 0..1 the head dipped forward (a nod) */
  nod?: number;
  arms?: FolkArms | [P, P];
  /** how far through a throw / wave (for 'throw', 0..1 of the swing) */
  swing?: number;
  rim?: string; rimSide?: 1 | -1;
  acc?: boolean; garland?: boolean; kid?: boolean;
  emote?: Emote; emoteT0?: number;
  hop?: number;
}
/** A villager in silhouette, drawn like _motifs' person() (same proportions and weights) but able to walk, nod and
 *  carry: feet at (x, y), standing height h. Returns the head and hands in canvas px. */
export function folk(c: C2, x: number, y: number, h: number, o: FolkOpts): { head: P; hands: [P, P] } {
  const col = o.col ?? '#1a1024', t = o.t, s = o.seed ?? 0, f = o.flip ? -1 : 1;
  const u = h / 100, breathe = Math.sin(t * 2 + s) * 0.8 * u;
  const walking = o.walk !== undefined, wp = o.walk ?? 0;
  const bob = walking ? -2.2 * u * Math.abs(Math.cos(wp)) : 0, hop = (o.hop ?? 0) * u;
  c.save();
  c.translate(x, y + bob - hop); if (f < 0) c.scale(-1, 1);
  c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round';
  // legs: two bones when walking (the forward leg's knee bends as it swings through)
  c.lineWidth = 7.5 * u;
  if (walking) {
    for (const i of [0, 1]) {
      const ph = wp + i * PI, a = 0.42 * Math.sin(ph), kb = Math.max(0, Math.sin(ph + 1.2)) * 0.7;
      const hx = (i ? 3 : -3) * u, hy = -44 * u;
      const kx = hx + Math.sin(a) * 22 * u, ky = hy + Math.cos(a) * 22 * u;
      const fx = kx + Math.sin(a - kb) * 22 * u, fy = ky + Math.cos(a - kb) * 22 * u;
      c.beginPath(); c.moveTo(hx, hy); c.lineTo(kx, ky); c.lineTo(fx, Math.min(fy, -bob + hop)); c.stroke();
    }
  } else {
    c.beginPath(); c.moveTo(-5 * u, 0); c.lineTo(-3 * u, -44 * u); c.moveTo(5 * u, 0); c.lineTo(3 * u, -44 * u); c.stroke();
  }
  const lean = (o.nod ?? 0) * 1.5 * u, hipY = -42 * u, shY = -78 * u + (o.nod ?? 0) * 2.5 * u;
  c.beginPath(); c.moveTo(-10 * u, hipY); c.quadraticCurveTo(-12 * u, (hipY + shY) / 2, -7 * u + lean, shY);
  c.lineTo(7 * u + lean, shY); c.quadraticCurveTo(12 * u, (hipY + shY) / 2, 10 * u, hipY); c.closePath(); c.fill();
  const nod = o.nod ?? 0, hx = lean * 1.3 + breathe * 0.3 + nod * 2 * u, hy = shY - 10 * u + nod * 8 * u;
  c.beginPath(); c.arc(hx, hy, 9 * u, 0, TAU); c.fill();
  // arms
  c.lineWidth = 6 * u;
  const sh = { x: lean, y: shY + 4 * u };
  const sw = o.swing ?? 0.5;
  let hands: [P, P];
  const A = o.arms ?? 'down';
  if (Array.isArray(A)) hands = A;
  else switch (A) {
    case 'carry': hands = [{ x: -6, y: -14 }, { x: 6, y: -14 }]; break;
    case 'cheer': hands = [{ x: -22, y: -34 + Math.sin(t * 9 + s) * 3 }, { x: 22, y: -34 + Math.cos(t * 9 + s) * 3 }]; break;
    case 'wave': hands = [{ x: -12, y: 30 }, { x: 20 + Math.sin(t * 8 + s) * 6, y: -26 }]; break;
    case 'throw': { const a = -0.6 + sw * 2.6; hands = [{ x: -14, y: 26 }, { x: Math.cos(-PI / 2 - 1.2 + a) * 30, y: Math.sin(-PI / 2 - 1.2 + a) * 30 }]; break; }
    case 'clap': { const k = Math.abs(Math.sin(t * 7 + s)); hands = [{ x: 4 - 6 * k, y: 6 }, { x: 14 + 4 * k, y: 4 }]; break; }
    case 'reach': hands = [{ x: -10, y: 28 }, { x: 34, y: 2 }]; break;
    case 'heart': hands = [{ x: 2, y: 12 }, { x: 7, y: 10 }]; break;
    case 'point': hands = [{ x: -14, y: 30 }, { x: 40, y: -10 }]; break;
    case 'hold': hands = [{ x: 8, y: 16 }, { x: 14, y: 14 }]; break;
    case 'face': hands = [{ x: -2 + nod * 5, y: hy / u - sh.y / u + 2 }, { x: 4 + nod * 5, y: hy / u - sh.y / u + 2 }]; break;
    default: hands = [{ x: -12, y: 30 }, { x: 12, y: 30 }];
  }
  const arm = (dx: number, e: P) => { c.beginPath(); c.moveTo(sh.x + dx * u, sh.y); c.quadraticCurveTo(sh.x + (dx + e.x) / 2 * u, sh.y + e.y / 2 * u + 4 * u, sh.x + e.x * u, sh.y + e.y * u); c.stroke(); };
  arm(-8, hands[0]); arm(8, hands[1]);
  // a seeded accessory, a garland
  if (o.acc !== false) {
    const k = h01(s, 77);
    if (k < 0.22) { c.beginPath(); c.ellipse(hx, hy - 6 * u, 14 * u, 4 * u, 0, 0, TAU); c.fill(); }
    else if (k < 0.42) { c.beginPath(); c.arc(hx - 7 * u, hy - 4 * u, 5 * u, 0, TAU); c.fill(); }
    else if (k < 0.6) { c.fillStyle = [HEX.pink, HEX.yellow, HEX.coral][s % 3]!; c.beginPath(); c.arc(hx + 6 * u, hy - 6 * u, 3 * u, 0, TAU); c.fill(); c.fillStyle = col; }
  }
  if (o.garland) for (let j = 0; j < 7; j++) { const a = PI * (0.15 + 0.7 * j / 6); c.fillStyle = [HEX.pink, HEX.yellow, '#fff3f7', HEX.coral][(j + s) % 4]!; c.beginPath(); c.arc(sh.x + Math.cos(a) * 9 * u, shY + 2 * u + Math.sin(a) * 8 * u, 2.4 * u, 0, TAU); c.fill(); }
  if (o.rim) { // the light's edge down one side (rimSide in screen space)
    const rs = (o.rimSide ?? 1) * f;
    c.save(); c.strokeStyle = o.rim; c.lineWidth = 2.2 * u; c.globalAlpha = 0.9;
    c.beginPath(); c.arc(hx, hy, 9 * u, rs > 0 ? -1.9 : PI - 0.2, rs > 0 ? 0.2 : PI + 1.9); c.stroke();
    c.beginPath(); c.moveTo(rs * 7 * u + lean, shY); c.quadraticCurveTo(rs * 12 * u, (hipY + shY) / 2, rs * 10 * u, hipY); c.stroke();
    c.restore();
  }
  c.restore();
  const sx = (px: number) => x + f * px;
  const head = { x: sx(hx), y: y + bob - hop + hy };
  const hp = (dx: number, e: P): P => ({ x: sx(sh.x + e.x * u + 0 * dx), y: y + bob - hop + sh.y + e.y * u });
  if (o.emote) emote(c, head.x, head.y, 9 * u * 1.5, o.emote, t, o.emoteT0 ?? -1e9);
  return { head, hands: [hp(-8, hands[0]), hp(8, hands[1])] };
}

// ------------------------------------------------------------------ water: the breach

/** The breach's water at age `age` (s): the crown of spray at the waterline `wl`, droplets flung up and falling back
 *  (backlit gold), the foam ring spreading. (x) is where she came up, R her disc radius. */
export function breachSplash(c: C2, g: C2, x: number, wl: number, R: number, age: number, t: number) {
  if (age < 0 || age > 3) return;
  // the foam ring
  const fr = R * (1.1 + 2.6 * ease.outCubic(clamp(age / 2.2))), fa = 0.9 * (1 - clamp(age / 2.6));
  c.strokeStyle = rgbaHex('#fff4ea', fa); c.lineWidth = 5;
  c.beginPath(); c.ellipse(x, wl + 4, fr, fr * 0.1, 0, 0, TAU); c.stroke();
  c.lineWidth = 2; c.beginPath(); c.ellipse(x, wl + 8, fr * 1.25, fr * 0.13, 0, 0, TAU); c.stroke();
  // the crown: sheets of water thrown up around her, rising then falling
  const env = age < 0.22 ? ease.outCubic(age / 0.22) : Math.max(0, 1 - Math.pow((age - 0.22) / 0.9, 2));
  if (env > 0) {
    for (let i = 0; i < 22; i++) {
      const side = i % 2 ? 1 : -1, j = Math.floor(i / 2);
      const bx = x + side * R * (0.55 + 0.09 * j + 0.1 * h01(i, 3)), hgt = R * (0.6 + 1.3 * h01(i, 4)) * env * (1 - j * 0.06);
      const lean = side * R * (0.25 + 0.45 * h01(i, 5)) * (0.4 + age);
      const w = R * (0.08 + 0.06 * h01(i, 6));
      const gr = c.createLinearGradient(0, wl, 0, wl - hgt);
      gr.addColorStop(0, 'rgba(225,240,255,0.85)'); gr.addColorStop(1, 'rgba(255,236,190,0.15)');
      c.fillStyle = gr;
      c.beginPath(); c.moveTo(bx - w, wl + 4); c.quadraticCurveTo(bx + lean * 0.3, wl - hgt * 0.6, bx + lean, wl - hgt); c.quadraticCurveTo(bx + lean * 0.4 + w, wl - hgt * 0.5, bx + w, wl + 4); c.closePath(); c.fill();
    }
  }
  // droplets: ballistic, backlit gold, glinting
  const G = 2600;
  for (let i = 0; i < 110; i++) {
    const t0 = 0.12 * h01(i, 11), a = age - t0;
    if (a < 0) continue;
    const vx = (h01(i, 12) - 0.5) * 1500, vy = -(700 + 1300 * h01(i, 13));
    const px = x + (h01(i, 14) - 0.5) * R * 1.6 + vx * a, py = wl - R * 0.3 + vy * a + 0.5 * G * a * a;
    if (py > wl + 12) continue;
    const r = 2.5 + 7 * h01(i, 15), gold = h01(i, 16);
    c.fillStyle = gold > 0.45 ? rgbaHex('#ffe6a8', 0.95) : rgbaHex('#e6f4ff', 0.9);
    c.beginPath(); c.ellipse(px, py, r * 0.8, r * (1 + Math.min(1.5, Math.abs(vy + G * a) / 1600)), 0, 0, TAU); c.fill();
    if (gold > 0.8) { g.fillStyle = rgbaHex('#ffd27a', 0.35); g.beginPath(); g.arc(px, py, r * 1.5, 0, TAU); g.fill(); }
  }
  void t;
}

/** Water sheeting off her as she comes up: streams running off the disc's edges and the head, thinning with `age`. */
export function sheeting(c: C2, x: number, y: number, R: number, age: number, t: number) {
  if (age < 0 || age > 2.2) return;
  const a = 1 - clamp(age / 2.2);
  c.save(); c.lineCap = 'round';
  for (let i = 0; i < 26; i++) {
    const head = i % 3 === 0, side = i % 2 ? 1 : -1;
    const ang = head ? 0.15 + 0.5 * h01(i, 25) : PI * (0.05 + 0.9 * (i / 25));
    const ox = head ? x + side * Math.cos(ang) * R * 0.72 : x + Math.cos(ang) * R * 0.98;
    const oy = head ? y - 1.2 * R + Math.sin(ang) * R * 0.72 : y + Math.sin(ang) * R * 0.75;
    const len = R * (0.4 + 1.1 * h01(i, 21)) * (0.5 + age) * a;
    const wob = Math.sin(t * 20 + i) * 2;
    c.strokeStyle = rgbaHex('#e8f6ff', 0.7 * a); c.lineWidth = 3 + 5 * h01(i, 22) * a;
    c.beginPath(); c.moveTo(ox, oy); c.quadraticCurveTo(ox + wob, oy + len * 0.5, ox + wob * 2, oy + len); c.stroke();
    const dy = ((age * 900 + h01(i, 23) * 300) % (len + 60));
    c.fillStyle = rgbaHex('#fff4dc', 0.9 * a); c.beginPath(); c.arc(ox + wob * 2, oy + dy, 3 + 2 * h01(i, 24), 0, TAU); c.fill();
  }
  // a gleam of wet stone
  c.restore();
}

// ------------------------------------------------------------------ flowers

/** A hibiscus (five round petals and a stamen) or, with `frangi`, a frangipani (white with a yellow heart). */
export function flower(c: C2, x: number, y: number, s: number, rot: number, col: string, frangi = false) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.fillStyle = frangi ? '#fff8f0' : col;
  for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU; c.beginPath(); c.ellipse(Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.55, s * 0.55, s * 0.36, a, 0, TAU); c.fill(); }
  c.fillStyle = frangi ? HEX.yellow : '#fff0a0'; c.beginPath(); c.arc(0, 0, s * 0.24, 0, TAU); c.fill();
  c.restore();
}
const FLOWER_COLS = [HEX.pink, HEX.coral, HEX.yellow, '#ff7ac0', HEX.orange];

/** Flowers thrown at t0 from `from` points towards `to`, arcing, spinning, landing scattered (each a little later). */
export function flowerToss(c: C2, t: number, t0: number, from: P[], to: P, o: { n?: number; seed?: number; spread?: number; size?: number; arc?: number; stagger?: number } = {}) {
  const n = o.n ?? 30, seed = o.seed ?? 5, spread = o.spread ?? 260, size = o.size ?? 14, arcH = o.arc ?? 380, st = o.stagger ?? 0.9;
  for (let i = 0; i < n; i++) {
    const ti = t0 + st * h01(i, seed, 1), dur = 0.9 + 0.5 * h01(i, seed, 2), u = (t - ti) / dur;
    if (u < 0) continue;
    const a = from[i % from.length]!, bx = to.x + (h01(i, seed, 3) - 0.5) * spread * 2, by = to.y + (h01(i, seed, 4) - 0.5) * spread * 0.6;
    const v = Math.min(1, u), px = a.x + (bx - a.x) * v, py = a.y + (by - a.y) * v - arcH * 4 * v * (1 - v) * (0.6 + 0.6 * h01(i, seed, 5));
    const rot = (t - ti) * (4 + 6 * h01(i, seed, 6)) * (h01(i, seed, 7) < 0.5 ? -1 : 1);
    const fade = u > 1 ? clamp(1 - (u - 1) * 0.6) : 1;
    if (fade <= 0) continue;
    c.save(); c.globalAlpha *= fade;
    flower(c, px, py, size * (0.7 + 0.6 * h01(i, seed, 8)), rot, FLOWER_COLS[i % FLOWER_COLS.length]!, h01(i, seed, 9) < 0.3);
    c.restore();
  }
}

/** Big soft petals drifting across the lens (the foreground, out of focus): depth for a shot. */
export function lensPetals(c: C2, t: number, o: { n?: number; seed?: number; a?: number; size?: number; wind?: number } = {}) {
  const n = o.n ?? 8, seed = o.seed ?? 9, size = o.size ?? 60, wind = o.wind ?? 1;
  for (let i = 0; i < n; i++) {
    const span = W + 400, x = ((h01(i, seed, 1) * span + t * (120 + 140 * h01(i, seed, 2)) * wind) % span + span) % span - 200;
    const y = ((h01(i, seed, 3) * (H + 300) + t * (60 + 80 * h01(i, seed, 4))) % (H + 300)) - 150;
    c.save(); c.globalAlpha *= (o.a ?? 0.55) * (0.6 + 0.4 * h01(i, seed, 5));
    const s = size * (0.6 + 0.8 * h01(i, seed, 7));
    // out of focus: a soft halo of its colour behind a faint flower
    const col = FLOWER_COLS[i % FLOWER_COLS.length]!, hg = c.createRadialGradient(x, y, 0, x, y, s * 1.3);
    hg.addColorStop(0, rgbaHex(col, 0.5)); hg.addColorStop(1, rgbaHex(col, 0));
    c.fillStyle = hg; c.fillRect(x - s * 1.3, y - s * 1.3, s * 2.6, s * 2.6);
    c.globalAlpha *= 0.6; flower(c, x, y, s, t * (0.8 + h01(i, seed, 6)) + i, col, h01(i, seed, 8) < 0.3);
    c.restore();
  }
}

/** A garland (lei) hung round Rai's neck: flowers along a U from beside her head down over her chest and back. */
export function lei(c: C2, x: number, y: number, R: number, t: number, drop = 1) {
  for (let i = 0; i <= 16; i++) {
    const th = (i / 16) * PI, px = x + Math.cos(th) * 0.66 * R, py = y - 0.92 * R + Math.sin(th) * 0.5 * R * drop;
    flower(c, px, py, 0.085 * R, t * 0.2 + i, [HEX.pink, HEX.yellow, '#fff3f7', HEX.coral][i % 4]!, i % 4 === 2);
  }
}

// ------------------------------------------------------------------ the slate's night (her arithmetic for eight years)

export interface SlateNight { lit: [number, number, number]; scribble: number; heart: number; t: number; glowCol?: string }
/** What the girl wrote on her slate: three rows, NIGHTS 2,920 / MEALS 8,760 / CARE ∞, her working in the margin, her
 *  old drawing of Rai in the corner. Rows light (0..1) as they are counted; `scribble` crosses the numbers out;
 *  `heart` draws one big heart over all of it. Origin at the slate's centre (slate units: the board is 220 x 280). */
export function slateNight(c: C2, o: SlateNight) {
  const ink = '#2a2a33', rows: [string, string, string, number][] = [['NIGHTS', '2,920', '365 × 8 yrs', -46], ['MEALS', '8,760', '3 a day', 14], ['CARE', '', 'all of it', 74]];
  c.save(); c.textBaseline = 'middle';
  // her drawing of Rai from the reef, top left: a pebble head on a disc with a hole, a smile, a starfish
  pencilPath(c, ringPts(-72, -97, 7), ink, 2.2, 0.6);
  pencilPath(c, ringPts(-72, -79, 11), ink, 2.4, 0.6);
  pencilPath(c, ringPts(-72, -79, 3.5, 14), ink, 1.8, 0.6);
  pencilPath(c, [[-75, -95], [-72, -93.5], [-69, -95]], ink, 1.6, 0.6);
  c.fillStyle = rgbaHex(HEX.coral, 0.8); c.beginPath(); c.arc(-67, -104, 3, 0, TAU); c.fill();
  c.font = font(FAM.monoB(), 13); c.fillStyle = rgbaHex(ink, 0.6); c.textAlign = 'left'; c.fillText('FOR MUM', -52, -90);
  rows.forEach(([label, num, work, y], i) => {
    const L = clamp(o.lit[i]!);
    if (L > 0) { // the dawn catches the row: a band of warm light across it
      const bg = c.createLinearGradient(-100, 0, 100, 0);
      bg.addColorStop(0, rgbaHex('#ffd27a', 0)); bg.addColorStop(0.5, rgbaHex(o.glowCol ?? '#ffd27a', 0.55 * L)); bg.addColorStop(1, rgbaHex('#ffd27a', 0));
      c.fillStyle = bg; c.fillRect(-100, y - 24, 200, 44);
    }
    c.globalAlpha = 0.35 + 0.65 * L;
    c.font = font(FAM.cond(), 24); c.fillStyle = ink; c.textAlign = 'left';
    c.save(); c.translate(-90, y); c.rotate(-0.03 + 0.02 * i); c.fillText(label, 0, 0); c.restore();
    c.font = font(FAM.cond(), 34 + 3 * L); c.textAlign = 'right';
    if (num) { c.save(); c.translate(92, y + 1); c.rotate(0.02 - 0.015 * i); c.fillText(num, 0, 0); c.restore(); }
    else infinity(c, 62, y + 1, 24 + 3 * L, ink);
    c.globalAlpha = 0.45 + 0.35 * L; c.font = font(FAM.mono(), 12); c.textAlign = 'right'; c.fillText(work, 90, y + 24);
    c.globalAlpha = 1;
    if (L >= 1) { pencilPath(c, [[-90, y + 15], [-26, y + 17]], '#c9a24a', 3, 0.9); }
  });
  // or don't count: the numbers scribbled out, one after another
  const sc = clamp(o.scribble);
  rows.forEach(([, , , y], i) => {
    const u = clamp(sc * 3 - i);
    if (u <= 0) return;
    const pts: [number, number][] = [];
    for (let k = 0; k <= 12; k++) pts.push([8 + k * 7, y + (k % 2 ? -14 : 12) + h01(i, k, 3) * 4]);
    pencilPath(c, pts, ink, 4.5, 1, u);
  });
  // one big heart over all of it
  if (o.heart > 0) {
    const pts: [number, number][] = [];
    for (let k = 0; k <= 60; k++) {
      const a = PI / 2 + (k / 60) * TAU, hx = 16 * Math.pow(Math.sin(a), 3), hy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
      pts.push([hx * 5.6 + h01(k, 9) * 1.5, hy * 5.6 + 6]);
    }
    pencilPath(c, pts, '#e0306e', 8, 1, clamp(o.heart));
  }
  c.restore();
}
function infinity(c: C2, x: number, y: number, s: number, col: string) {
  const pts: [number, number][] = [];
  for (let k = 0; k <= 40; k++) { const a = (k / 40) * TAU, d = 1 + Math.sin(a) * Math.sin(a); pts.push([x + (s * Math.cos(a)) / d, y + (s * Math.sin(a) * Math.cos(a)) / d * 1.1]); }
  pencilPath(c, pts, col, 4.5, 1);
}
const ringPts = (cx: number, cy: number, r: number, n = 28): [number, number][] => Array.from({ length: n + 1 }, (_, i) => [cx + Math.cos(-PI / 2 + (i / n) * TAU) * r, cy + Math.sin(-PI / 2 + (i / n) * TAU) * r]);
/** A pencil stroke along pts, revealed to `u`. */
export function pencilPath(c: C2, pts: [number, number][], col: string, w: number, a = 1, u = 1) {
  if (u <= 0 || pts.length < 2) return;
  let total = 0; const seg: number[] = [];
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]); seg.push(d); total += d; }
  let left = total * clamp(u);
  c.save(); c.globalAlpha *= a; c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(pts[0]![0], pts[0]![1]);
  for (let i = 1; i < pts.length && left > 0; i++) {
    const d = seg[i - 1]!, k = Math.min(1, left / d);
    c.lineTo(pts[i - 1]![0] + (pts[i]![0] - pts[i - 1]![0]) * k, pts[i - 1]![1] + (pts[i]![1] - pts[i - 1]![1]) * k);
    left -= d;
  }
  c.stroke(); c.restore();
}

/** The tip of the girl's pencil on the heart / scribble at the same `u` (for her hand). */
export function slatePencilTip(scribble: number, heart: number): [number, number] | null {
  if (heart > 0 && heart < 1) {
    const a = PI / 2 + heart * TAU, hx = 16 * Math.pow(Math.sin(a), 3), hy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
    return [hx * 5.6, hy * 5.6 + 6];
  }
  if (scribble > 0 && scribble < 1) {
    const i = Math.min(2, Math.floor(scribble * 3)), u = scribble * 3 - i, y = [-46, 14, 74][i]!;
    const k = u * 12; return [8 + k * 7, y + (Math.floor(k) % 2 ? -14 : 12)];
  }
  return null;
}

// ------------------------------------------------------------------ hands and light on the stone

/** A villager's arm reaching in from (x0, y0) to lay a hand at (x1, y1): a silhouette with a lit edge. */
export function reachArm(c: C2, x0: number, y0: number, x1: number, y1: number, w: number, col: string, rim?: string) {
  const a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a), ny = Math.cos(a);
  c.save(); c.lineCap = 'round';
  c.strokeStyle = col; c.lineWidth = w;
  const mx = (x0 + x1) / 2 + nx * w * 0.6, my = (y0 + y1) / 2 + ny * w * 0.6;
  c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(mx, my, x1, y1); c.stroke();
  // the hand: a palm and four splayed fingers
  c.fillStyle = col;
  c.beginPath(); c.ellipse(x1, y1, w * 0.75, w * 0.62, a, 0, TAU); c.fill();
  c.lineWidth = w * 0.26;
  for (let k = 0; k < 4; k++) { const fa = a + (k - 1.5) * 0.32; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 + Math.cos(fa) * w * 1.25, y1 + Math.sin(fa) * w * 1.25); c.stroke(); }
  if (rim) { c.strokeStyle = rim; c.lineWidth = w * 0.12; c.globalAlpha = 0.85; c.beginPath(); c.moveTo(x0 - nx * w * 0.45, y0 - ny * w * 0.45); c.quadraticCurveTo(mx - nx * w * 0.45, my - ny * w * 0.45, x1 - nx * w * 0.5, y1 - ny * w * 0.5); c.stroke(); }
  c.restore();
}

/** Light running round her rim from each touch: two comets per touch (both ways round) at angle a from time t0,
 *  and when `ring` > 0 the whole rim glowing. (x, y) her disc's centre, R its radius. */
export function rimRipple(c: C2, g: C2, x: number, y: number, R: number, t: number, touches: { a: number; t0: number }[], ring = 0) {
  g.save(); c.save(); g.lineCap = 'round'; c.lineCap = 'round';
  for (const tc of touches) {
    const age = t - tc.t0;
    if (age < 0 || age > 1.6) continue;
    const fade = 1 - age / 1.6, run = ease.outCubic(clamp(age / 1.2)) * PI;
    // the touch's flash
    if (age < 0.4) { const fl = g.createRadialGradient(x + Math.cos(tc.a) * R, y + Math.sin(tc.a) * R, 0, x + Math.cos(tc.a) * R, y + Math.sin(tc.a) * R, R * 0.4); fl.addColorStop(0, rgbaHex('#fff0b0', 0.8 * (1 - age / 0.4))); fl.addColorStop(1, rgbaHex('#fff0b0', 0)); g.fillStyle = fl; g.fillRect(x + Math.cos(tc.a) * R - R * 0.4, y + Math.sin(tc.a) * R - R * 0.4, R * 0.8, R * 0.8); }
    for (const dir of [-1, 1]) {
      const head = tc.a + dir * run, tail = tc.a + dir * Math.max(0, run - 0.9);
      g.strokeStyle = rgbaHex(HEX.gold, 0.85 * fade); g.lineWidth = R * 0.09;
      g.beginPath(); g.arc(x, y, R * 1.01, Math.min(head, tail), Math.max(head, tail)); g.stroke();
      c.strokeStyle = rgbaHex('#fff6d0', 0.9 * fade); c.lineWidth = R * 0.025;
      c.beginPath(); c.arc(x, y, R * 1.0, Math.min(head, tail), Math.max(head, tail)); c.stroke();
    }
  }
  if (ring > 0) {
    g.strokeStyle = rgbaHex(HEX.gold, 0.7 * ring); g.lineWidth = R * 0.12; g.beginPath(); g.arc(x, y, R * 1.01, 0, TAU); g.stroke();
    c.strokeStyle = rgbaHex('#fff6d0', 0.8 * ring); c.lineWidth = R * 0.03; c.beginPath(); c.arc(x, y, R, 0, TAU); c.stroke();
  }
  c.restore(); g.restore();
}

/** A soft streak of lens flare along a line through (x, y) (the sun's), for the loudest light. */
export function flare(g: C2, x: number, y: number, a: number, len = W * 0.9) {
  if (a <= 0) return;
  const gr = g.createLinearGradient(x - len, y, x + len, y);
  gr.addColorStop(0, rgbaHex('#ffcf7a', 0)); gr.addColorStop(0.5, rgbaHex('#fff0c0', 0.5 * a)); gr.addColorStop(1, rgbaHex('#ffcf7a', 0));
  g.fillStyle = gr; g.fillRect(x - len, y - 3, len * 2, 6);
  for (let k = 1; k <= 3; k++) { // ghosts of the aperture along the line to the frame's centre
    const gx = x + (W / 2 - x) * (0.5 + k * 0.4), gy = y + (H / 2 - y) * (0.5 + k * 0.4), r = 24 + 22 * k;
    g.fillStyle = rgbaHex(k % 2 ? '#ff9ac0' : '#ffd27a', 0.08 * a); g.beginPath(); g.arc(gx, gy, r, 0, TAU); g.fill();
  }
}

// ------------------------------------------------------------------ the mother, closer (over the kit's mother())

/** The kit's mother() at (x, y, h, pose, flip) draws her shawl as a plain drape; at close range it gets its weave: a
 *  fringe along its hem and two bands (call after mother(), same arguments). */
export function shawlTrim(c: C2, x: number, y: number, h: number, pose: string, o: { flip?: boolean; old?: boolean; col?: string } = {}) {
  const u = h / 100, f = o.flip ? -1 : 1, slump = pose === 'slump' || pose === 'face' || o.old ? 1 : 0, seated = pose === 'seated';
  const shY = (seated ? -76 : -78) + slump * 6, sx = x + f * slump * 8 * u, sy = y + shY * u;
  c.save();
  c.beginPath(); c.moveTo(sx - 13 * u, sy + 3 * u); c.quadraticCurveTo(sx, sy - 6 * u, sx + 13 * u, sy + 3 * u);
  c.lineTo(sx + 11 * u, sy + 22 * u); c.quadraticCurveTo(sx, sy + 30 * u, sx - 11 * u, sy + 22 * u); c.closePath(); c.clip();
  c.strokeStyle = o.col ?? 'rgba(255,190,120,0.55)'; c.lineWidth = 1.2 * u;
  for (const dy of [9, 14]) { c.beginPath(); c.moveTo(sx - 14 * u, sy + dy * u); c.quadraticCurveTo(sx, sy + (dy + 6) * u, sx + 14 * u, sy + dy * u); c.stroke(); }
  c.restore();
  c.save(); c.strokeStyle = o.col ?? 'rgba(255,190,120,0.55)'; c.lineWidth = 0.7 * u; c.lineCap = 'round';
  for (let k = 0; k <= 10; k++) { const v = k / 10, px = sx - 11 * u + v * 22 * u, py = sy + 22 * u + Math.sin(v * PI) * 8 * u; c.beginPath(); c.moveTo(px, py); c.lineTo(px + 0.5 * u, py + 3 * u); c.stroke(); }
  c.restore();
}
/** Her plait over her back, for when we see her from behind (the kit draws it behind her). */
export function plaitOver(c: C2, x: number, y: number, h: number, t: number, col: string, flip = false) {
  const u = h / 100, f = flip ? -1 : 1, hx = x, hy = y + (-78 - 10) * u;
  c.save(); c.strokeStyle = col; c.lineWidth = 4 * u; c.lineCap = 'round';
  c.beginPath(); c.moveTo(hx, hy + 4 * u); c.quadraticCurveTo(hx + f * 2 * u, hy + 18 * u, hx + Math.sin(t * 1.3) * u, hy + 40 * u); c.stroke();
  c.strokeStyle = 'rgba(255,200,140,0.35)'; c.lineWidth = 0.8 * u;
  for (let k = 1; k < 8; k++) { const v = k / 8, px = hx + f * 2 * u * Math.sin(v * PI) + Math.sin(t * 1.3) * u * v, py = hy + 4 * u + v * 36 * u; c.beginPath(); c.moveTo(px - 1.8 * u, py - 1.5 * u); c.lineTo(px + 1.8 * u, py + 1.5 * u); c.stroke(); }
  c.restore();
}
/** Two hands held over a face (head centre hx, hy, head radius r): palms and fingers, lit at the edge. */
export function palmsOnFace(c: C2, hx: number, hy: number, r: number, col: string, rim: string) {
  for (const s of [-1, 1]) {
    c.save(); c.translate(hx + s * r * 0.42, hy + r * 0.2); c.rotate(s * 0.25);
    c.fillStyle = col; c.beginPath(); c.ellipse(0, 0, r * 0.5, r * 0.62, 0, 0, TAU); c.fill();
    c.lineCap = 'round'; c.strokeStyle = col; c.lineWidth = r * 0.2;
    for (let k = 0; k < 4; k++) { const fx = (k - 1.5) * r * 0.2; c.beginPath(); c.moveTo(fx, -r * 0.3); c.lineTo(fx * 1.1, -r * 0.95 + Math.abs(k - 1.5) * r * 0.12); c.stroke(); }
    c.strokeStyle = rim; c.lineWidth = r * 0.07; c.beginPath(); c.ellipse(0, 0, r * 0.5, r * 0.62, 0, s > 0 ? -1.2 : PI - 0.6, s > 0 ? 0.6 : PI + 1.2); c.stroke();
    c.restore();
  }
}

/** The glow layer faded out softly above the lyric's band and cleared under it (clearGlowBand's hard edge shows
 *  when a glow crosses it). Call outside any camera transform. */
export function fadeGlowBand(g: C2, y = H - 96, h = 230) {
  const top = y - h / 2 - 30, fade = 140;
  g.save(); g.globalCompositeOperation = 'destination-out';
  const gr = g.createLinearGradient(0, top - fade, 0, top);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
  g.fillStyle = gr; g.fillRect(-W, top - fade, W * 3, fade);
  g.restore();
  g.clearRect(-W, top, W * 3, H * 2);
}

/** Light in the water under the surface: warm shafts slanting down from the dawn above. */
export function underRays(c: C2, wl: number, t: number, a = 1) {
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 7; k++) {
    const x = W * (0.05 + 0.15 * k) + 30 * Math.sin(t * 0.7 + k), w = 50 + 60 * h01(k, 41);
    const gr = c.createLinearGradient(0, wl, 0, wl + 420);
    gr.addColorStop(0, rgbaHex('#ffb88a', 0.16 * a)); gr.addColorStop(1, rgbaHex('#ffb88a', 0));
    c.fillStyle = gr; c.beginPath(); c.moveTo(x - w * 0.3, wl); c.lineTo(x + w * 0.3, wl); c.lineTo(x + w * 1.2 + 120, wl + 420); c.lineTo(x - w * 0.6 + 120, wl + 420); c.closePath(); c.fill();
  }
  c.restore();
}
