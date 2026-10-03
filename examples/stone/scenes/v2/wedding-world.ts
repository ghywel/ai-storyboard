// v2 `wedding` (TREATMENT-v2.md): years later, a bright morning under the palms; then the night sea and the credits.
// Canvas2D in the 1920x1080 logical frame, y down, pure functions of t. `c` main layer, `g` the additive glow.
import { W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import { clamp, frameIdx } from '../../engine/util';
import { h01 } from '../_rai';
import { FAM, TAU, rgbaHex, mixHex } from '../_motifs';
import { cloud, palmTree } from '../_world';
import { flower, folk, type FolkOpts, type P } from './dawn-world';

type C2 = CanvasRenderingContext2D;
const PI = Math.PI;

// ------------------------------------------------------------------ the bright morning

/** A bright morning over the lagoon: blue sky, white clouds drifting, turquoise water, white sand. */
export function morning(c: C2, t: number, o: { hz: number; shore: number; pan?: number }) {
  const { hz, shore } = o, pan = o.pan ?? 0;
  const sk = c.createLinearGradient(0, -H * 0.6, 0, hz);
  sk.addColorStop(0, '#2f8fe8'); sk.addColorStop(0.7, '#7cc8fa'); sk.addColorStop(1, '#d6f1ff');
  c.fillStyle = sk; c.fillRect(-W, -H * 0.6, W * 3, hz + H * 0.6 + 2);
  // the sun high up off the top left, its haze
  const sg = c.createRadialGradient(W * 0.1, -H * 0.2, 0, W * 0.1, -H * 0.2, W * 0.7);
  sg.addColorStop(0, 'rgba(255,252,230,0.7)'); sg.addColorStop(1, 'rgba(255,252,230,0)');
  c.fillStyle = sg; c.fillRect(-W, -H * 0.6, W * 3, hz + H * 0.6);
  for (let i = 0; i < 6; i++) {
    const x = ((h01(i, 3, 7) * (W + 800) + t * (6 + 5 * h01(i, 4, 7)) - pan * 0.1) % (W + 800)) - 400, y = hz * (0.12 + 0.55 * h01(i, 5, 7));
    cloud(c, x, y, 60 + 70 * h01(i, 6, 7), 'rgba(255,255,255,0.95)');
  }
  // the lagoon: pale at the horizon, turquoise over the sand
  const sea = c.createLinearGradient(0, hz, 0, shore);
  sea.addColorStop(0, '#1d6fb8'); sea.addColorStop(0.35, '#1f9ad0'); sea.addColorStop(1, '#4fd6e0');
  c.fillStyle = sea; c.fillRect(-W, hz, W * 3, shore - hz + 2);
  c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 2;
  for (let i = 0; i < 16; i++) {
    const u = (i + 1) / 17, y = hz + (shore - hz) * Math.pow(u, 1.5), w = 30 + 160 * u;
    for (let j = 0; j < 6; j++) {
      const x = ((h01(i, j, 33) * (W + 400) + t * 10 * (j % 2 ? 1 : -1) - pan * (0.3 + 0.7 * u)) % (W + 400) + W + 400) % (W + 400) - 200;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + w / 2, y - 2, x + w, y); c.stroke();
    }
  }
  // the sand, white in the sun, the foam's lace
  const sd = c.createLinearGradient(0, shore, 0, H * 1.4);
  sd.addColorStop(0, '#fbeccb'); sd.addColorStop(1, '#ecd09a');
  c.fillStyle = sd;
  c.beginPath(); c.moveTo(-W, H * 2);
  for (let x = -W; x <= W * 2; x += 40) c.lineTo(x, shore + 6 * Math.sin((x + pan) * 0.005 + 1) + 3 * Math.sin((x + pan) * 0.02));
  c.lineTo(W * 2, H * 2); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 4; c.beginPath();
  for (let x = -W; x <= W * 2; x += 30) { const y = shore - 2 + 6 * Math.sin((x + pan) * 0.005 + 1) + 4 * Math.sin(x * 0.03 + t * 2); x === -W ? c.moveTo(x, y) : c.lineTo(x, y); }
  c.stroke();
}

/** The palms' shade dappling the sand: soft blue-violet blots that drift as the fronds move. */
export function dapple(c: C2, t: number, x0: number, y0: number, w: number, h: number, seed = 1) {
  c.fillStyle = 'rgba(80,90,170,0.14)';
  for (let i = 0; i < 18; i++) {
    const x = x0 + h01(i, seed, 1) * w + 10 * Math.sin(t * 0.9 + i), y = y0 + h01(i, seed, 2) * h;
    c.beginPath(); c.ellipse(x, y, 30 + 50 * h01(i, seed, 3), 8 + 10 * h01(i, seed, 4), 0.1, 0, TAU); c.fill();
  }
}

/** The wedding arch: two bamboo posts bound with fronds, a bow of palm leaves woven with hibiscus and frangipani. On
 *  its left post hang the old dive mask and the slate with its faded heart (the night it all began). */
export function arch(c: C2, x: number, base: number, half: number, top: number, t: number) {
  c.save(); c.lineCap = 'round';
  for (const s of [-1, 1]) { // bamboo posts with joints
    const px = x + s * half;
    c.strokeStyle = '#c9a25a'; c.lineWidth = 16; c.beginPath(); c.moveTo(px, base); c.lineTo(px, top + 40); c.stroke();
    c.strokeStyle = '#8a6a34'; c.lineWidth = 3;
    for (let k = 1; k < 7; k++) { const y = base - (base - top) * (k / 7); c.beginPath(); c.moveTo(px - 8, y); c.lineTo(px + 8, y); c.stroke(); }
  }
  // the bow: palm leaves along a curve, flowers woven through
  const bow = (u: number): P => ({ x: x - half - 20 + u * (half * 2 + 40), y: top + 40 - Math.sin(u * PI) * 90 });
  for (let k = 0; k <= 26; k++) {
    const u = k / 26, p = bow(u), a = (u - 0.5) * 1.2 + (k % 2 ? 0.9 : -0.9) + 0.05 * Math.sin(t * 1.4 + k);
    c.strokeStyle = k % 3 ? '#3cb35a' : '#78d63a'; c.lineWidth = 12;
    c.beginPath(); c.moveTo(p.x, p.y); c.quadraticCurveTo(p.x + Math.cos(a - PI / 2) * 30, p.y + Math.sin(a - PI / 2) * 30, p.x + Math.cos(a - PI / 2) * 70, p.y + Math.sin(a - PI / 2) * 50 + 20); c.stroke();
  }
  for (let k = 0; k <= 16; k++) { const p = bow(k / 16); flower(c, p.x + 6 * Math.sin(k * 2.3), p.y + 4 * Math.cos(k * 1.7), 13, t * 0.3 + k, [HEX.pink, HEX.yellow, HEX.coral, '#ff7ac0'][k % 4]!, k % 3 === 1); }
  // down the posts, garlands
  for (const s of [-1, 1]) for (let k = 0; k < 7; k++) flower(c, x + s * half + 10 * Math.sin(k * 1.9), top + 70 + k * ((base - top - 120) / 7), 10, k, [HEX.pink, '#ffffff', HEX.yellow][k % 3]!, k % 3 === 1);
  // the old mask on a nail, and the slate under it
  const mx = x - half + 2, my = top + 210;
  c.strokeStyle = '#5a4a3a'; c.lineWidth = 2; c.beginPath(); c.moveTo(mx, my - 26); c.lineTo(mx - 12, my - 2); c.moveTo(mx, my - 26); c.lineTo(mx + 14, my - 2); c.stroke();
  c.fillStyle = HEX.coral; c.beginPath(); c.roundRect(mx - 30, my - 6, 60, 40, 12); c.fill();
  const lg = c.createLinearGradient(0, my, 0, my + 30); lg.addColorStop(0, '#2c4f7a'); lg.addColorStop(1, '#0a1428');
  c.fillStyle = lg; c.beginPath(); c.roundRect(mx - 23, my, 46, 28, 9); c.fill();
  c.strokeStyle = 'rgba(235,250,255,0.9)'; c.lineWidth = 3; c.beginPath(); c.moveTo(mx - 12, my + 6); c.lineTo(mx - 2, my + 18); c.stroke();
  c.strokeStyle = HEX.coral; c.lineWidth = 4; c.beginPath(); c.moveTo(mx + 30, my + 8); c.quadraticCurveTo(mx + 46, my + 60, mx + 20, my + 74); c.stroke();
  // the slate, weathered, its pencil heart still there
  const sx = mx + 2, sy = my + 120;
  c.strokeStyle = '#5a4a3a'; c.lineWidth = 2; c.beginPath(); c.moveTo(mx, my + 34); c.lineTo(sx, sy - 44); c.stroke();
  c.save(); c.translate(sx, sy); c.rotate(0.06);
  c.fillStyle = '#e6eaea'; c.beginPath(); c.roundRect(-30, -40, 60, 80, 7); c.fill();
  c.strokeStyle = '#b8c2c2'; c.lineWidth = 2; c.stroke();
  c.strokeStyle = 'rgba(224,48,110,0.55)'; c.lineWidth = 3; c.beginPath();
  for (let k = 0; k <= 40; k++) { const a = PI / 2 + (k / 40) * TAU, hx = 16 * Math.pow(Math.sin(a), 3), hy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)); k ? c.lineTo(hx * 1.4, hy * 1.4 + 2) : c.moveTo(hx * 1.4, hy * 1.4 + 2); }
  c.stroke();
  c.strokeStyle = 'rgba(42,42,51,0.3)'; c.lineWidth = 1.5;
  for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-20, -22 + k * 20); c.lineTo(20, -22 + k * 20 + 2); c.stroke(); }
  c.restore();
  c.restore();
}

/** A bed of flowers on the sand where she will stand (hibiscus, frangipani, petals), centred at (x, y). */
export function flowerBed(c: C2, x: number, y: number, rx: number, t: number, bounce = 0, seed = 5) {
  for (let i = 0; i < 40; i++) {
    const a = h01(i, seed, 1) * TAU, d = Math.sqrt(h01(i, seed, 2));
    const px = x + Math.cos(a) * rx * d, py = y + Math.sin(a) * rx * 0.18 * d - bounce * (0.4 + h01(i, seed, 3)) * 60;
    flower(c, px, py, 10 + 6 * h01(i, seed, 4), h01(i, seed, 5) * TAU + bounce * 4, [HEX.pink, HEX.coral, HEX.yellow, '#ff7ac0', '#ffffff'][i % 5]!, i % 5 === 4);
  }
}

/** Flowers ringing the hole of her heart (someone wove them round it for the wedding). (x, y) the hole, r its radius. */
export function heartWreath(c: C2, x: number, y: number, r: number, t: number) {
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU + 0.2, rr = r * 1.3;
    flower(c, x + Math.cos(a) * rr, y + Math.sin(a) * rr, r * 0.3, a + t * 0.2, [HEX.pink, HEX.yellow, '#ffffff', HEX.coral][i % 4]!, i % 4 === 2);
  }
}

/** One of the two old men who were divers that night: a stooped silhouette with grey hair and his old mask pushed up
 *  on his forehead (cyan for diver1, lime for diver2, as in the kit). Built on folk() so he can carry and bend. */
export function oldDiver(c: C2, who: 1 | 2, x: number, y: number, h: number, o: FolkOpts) {
  const a = folk(c, x, y, h, { ...o, nod: Math.max(0.35, o.nod ?? 0), acc: false });
  const u = h / 100, { x: hx, y: hy } = a.head;
  c.save();
  c.strokeStyle = 'rgba(235,235,235,0.9)'; c.lineWidth = 1.8 * u; c.beginPath(); c.arc(hx, hy, 9.5 * u, PI * 1.1, PI * 1.9); c.stroke();
  c.fillStyle = who === 1 ? HEX.cyan : HEX.lime; c.beginPath(); c.roundRect(hx - 5 * u, hy - 12 * u, 11 * u, 6 * u, 2 * u); c.fill();
  c.restore();
  return a;
}

// ------------------------------------------------------------------ the night sea

/** The night sea at the surface, split at the waterline `wl`: stars over the island's low lights on the horizon; below,
 *  the dark water going down, motes drifting. Returns nothing; the caller adds the glow far below. */
export function nightSea(c: C2, g: C2, t: number, wl: number, a = 1) {
  const sk = c.createLinearGradient(0, -200, 0, wl);
  sk.addColorStop(0, '#03040f'); sk.addColorStop(0.7, '#0b0f2c'); sk.addColorStop(1, '#1a2050');
  c.fillStyle = sk; c.fillRect(-W, -200, W * 3, wl + 202);
  // the stars, twinkling, and the faint river of the galaxy
  c.save(); c.globalAlpha = a;
  // the galaxy: a soft drift of fine stars along a diagonal, no edges
  for (let i = 0; i < 420; i++) {
    const v = h01(i, 21, 91), along = -0.1 + 1.2 * v, off = (h01(i, 22, 91) + h01(i, 23, 91) - 1) * 0.16;
    const x = W * (0.05 + 0.9 * along) + off * W * 0.4, y = (wl - 10) * (along * 0.95) - off * W * 0.25;
    if (y < -10 || y > wl - 8) continue;
    c.fillStyle = `rgba(220,215,255,${0.12 + 0.3 * h01(i, 24, 91)})`; c.fillRect(x, y, 1.6, 1.6);
  }
  const fk = Math.floor(frameIdx(t) / 4);
  for (let i = 0; i < 380; i++) {
    const x = h01(i, 1, 91) * W * 1.1 - W * 0.05, y = h01(i, 2, 91) * (wl - 20) - 10, s = 0.6 + 1.8 * Math.pow(h01(i, 3, 91), 3);
    const tw = 0.55 + 0.45 * Math.sin(t * (1 + 2 * h01(i, 4, 91)) + i) * (h01(i, fk, 5) < 0.97 ? 1 : 0.4);
    c.fillStyle = `rgba(255,250,235,${(0.35 + 0.6 * h01(i, 5, 91)) * tw})`; c.beginPath(); c.arc(x, y, s, 0, TAU); c.fill();
  }
  c.restore();
  // the island low on the horizon, its lights: windows, a lantern, one of them home
  c.fillStyle = '#05060f';
  c.beginPath(); c.moveTo(W * 0.08, wl + 2); c.quadraticCurveTo(W * 0.2, wl - 34, W * 0.36, wl - 22); c.quadraticCurveTo(W * 0.5, wl - 30, W * 0.62, wl + 2); c.closePath(); c.fill();
  for (let i = 0; i < 7; i++) { const px = W * (0.12 + 0.48 * h01(i, 7, 3)), ph = 34 + 30 * h01(i, 8, 3); c.strokeStyle = '#05060f'; c.lineWidth = 3; c.beginPath(); c.moveTo(px, wl - 14); c.quadraticCurveTo(px + 4, wl - ph * 0.6, px + 8, wl - ph); c.stroke(); for (let k = 0; k < 5; k++) { const fa = -PI / 2 + (k - 2) * 0.55; c.beginPath(); c.moveTo(px + 8, wl - ph); c.quadraticCurveTo(px + 8 + Math.cos(fa) * 9, wl - ph + Math.sin(fa) * 7 - 2, px + 8 + Math.cos(fa) * 16, wl - ph + Math.sin(fa) * 8 + 6); c.stroke(); } }
  const lights = [[0.17, 16], [0.22, 20], [0.29, 22], [0.33, 18], [0.41, 20], [0.47, 17], [0.53, 12]];
  lights.forEach(([lx, ly], i) => {
    const x = W * lx!, y = wl - ly!, fl = 0.85 + 0.15 * Math.sin(t * (2 + i) + i);
    c.fillStyle = rgbaHex('#ffcf6b', fl); c.fillRect(x - 2, y - 2, 4, 3.5);
    const lg = g.createRadialGradient(x, y, 0, x, y, 7); lg.addColorStop(0, rgbaHex('#ffb050', 0.3 * fl)); lg.addColorStop(1, rgbaHex('#ffb050', 0)); g.fillStyle = lg; g.fillRect(x - 7, y - 7, 14, 14);
    c.fillStyle = rgbaHex('#ffcf6b', 0.35 * fl); c.fillRect(x - 1.5, wl + 3, 3, 10 + 6 * Math.sin(t * 3 + i));   // its trembling reflection
  });
  // below: the deep at night
  const dg = c.createLinearGradient(0, wl, 0, H + 40);
  dg.addColorStop(0, '#0e1a44'); dg.addColorStop(0.3, '#070d28'); dg.addColorStop(1, '#020309');
  c.fillStyle = dg;
  c.beginPath(); c.moveTo(-W, H * 2);
  for (let x = -W; x <= W * 2; x += 30) c.lineTo(x, wl + 4 * Math.sin(x * 0.01 + t * 1.6) + 2 * Math.sin(x * 0.037 - t * 2.3));
  c.lineTo(W * 2, H * 2); c.closePath(); c.fill();
  // the surface seen from just under it: a silver skin, the stars' light trembling in it
  c.strokeStyle = 'rgba(180,200,255,0.55)'; c.lineWidth = 2; c.beginPath();
  for (let x = -W; x <= W * 2; x += 24) { const y = wl + 4 * Math.sin(x * 0.01 + t * 1.6) + 2 * Math.sin(x * 0.037 - t * 2.3); x === -W ? c.moveTo(x, y) : c.lineTo(x, y); }
  c.stroke();
  // motes drifting in the dark water
  for (let i = 0; i < 60; i++) {
    const x = h01(i, 11, 4) * W + 20 * Math.sin(t * 0.3 + i), y = wl + 20 + ((h01(i, 12, 4) * (H - wl) - t * (6 + 8 * h01(i, 13, 4))) % (H - wl) + (H - wl)) % (H - wl);
    c.fillStyle = `rgba(170,190,255,${0.08 + 0.18 * h01(i, 14, 4)})`; c.beginPath(); c.arc(x, y, 1 + 1.5 * h01(i, 15, 4), 0, TAU); c.fill();
  }
}

/** Far below: a soft pink glow (a stone's heart, still down there), opening to a ring as it fades. `ring` 0..1. */
export function deepHeart(c: C2, g: C2, x: number, y: number, r: number, t: number, a: number, ring: number) {
  if (a <= 0) return;
  const pulse = 0.85 + 0.15 * Math.sin(t * 1.8);
  // light reaching up through the water
  const up = c.createRadialGradient(x, y, 0, x, y, r * 6);
  up.addColorStop(0, rgbaHex(HEX.pink, 0.22 * a * pulse)); up.addColorStop(1, rgbaHex(HEX.pink, 0));
  c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = up; c.fillRect(x - r * 6, y - r * 6, r * 12, r * 12); c.restore();
  // the glow, closing to a ring
  const inner = r * 0.7 * ring;
  const gg = g.createRadialGradient(x, y, inner, x, y, r * 1.6);
  gg.addColorStop(0, rgbaHex(HEX.pink, 0.75 * a * pulse * (1 - 0.6 * ring))); gg.addColorStop(0.45, rgbaHex(HEX.pink, 0.35 * a * pulse)); gg.addColorStop(1, rgbaHex(HEX.pink, 0));
  g.fillStyle = gg; g.save(); g.scale(1, 0.75); g.beginPath(); g.arc(x, y / 0.75, r * 1.6, 0, TAU); g.fill(); g.restore();
  c.save(); c.globalCompositeOperation = 'lighter';
  for (const [w, al] of [[0.5, 0.12], [0.3, 0.2], [0.14, 0.4]] as const) { // a soft ring of light, feathered by layering
    c.strokeStyle = rgbaHex('#ff9ccc', al * a * pulse); c.lineWidth = r * w;
    c.beginPath(); c.ellipse(x, y, r * 0.8, r * 0.6, 0, 0, TAU); c.stroke();
  }
  c.restore();
  if (ring < 0.9) { c.fillStyle = rgbaHex('#ffd6e8', 0.6 * a * (1 - ring) * pulse); c.beginPath(); c.ellipse(x, y, r * 0.55 * (1 - ring), r * 0.42 * (1 - ring), 0, 0, TAU); c.fill(); }
}

// ------------------------------------------------------------------ the credits

export interface Credit { label: string; text: string; t0: number }
/** The credits over the stars: each line a mono label and its words in Cormorant italic, faded up in turn, held
 *  together, then faded out from `out`. Centred on x; rows from y. Shrinks a row to the title-safe width. */
export function credits(c: C2, rows: Credit[], t: number, x: number, y: number, out: number, outDur = 0.5) {
  const fo = 1 - clamp((t - out) / outDur);
  if (fo <= 0) return;
  const gap = 96;
  rows.forEach((r, i) => {
    const a = clamp((t - r.t0) / 0.7) * fo;
    if (a <= 0) return;
    let lsz = 26, tsz = 52;
    c.save();
    c.font = font(FAM.mono(), lsz); const lw = c.measureText(r.label).width;
    c.font = font(FAM.serif(), tsz); let tw = c.measureText(r.text).width;
    const sp = 22, maxW = W - 220;
    if (lw + sp + tw > maxW) { const k = (maxW - lw - sp) / tw; tsz *= k; tw *= k; }
    const total = lw + sp + tw, x0 = x - total / 2, yy = y + i * gap + (1 - a) * 10;
    c.globalAlpha = a; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
    c.font = font(FAM.mono(), lsz); c.fillStyle = rgbaHex('#f6d48a', 0.9); c.fillText(r.label, x0, yy);
    c.font = font(FAM.serif(), tsz); c.fillStyle = '#f4f1ea'; c.fillText(r.text, x0 + lw + sp, yy);
    c.restore();
    void lsz;
  });
}

/** A soft dark band under the spoken outro, so the Cormorant reads on the bright sand. */
export function spokenBand(c: C2, a: number) {
  if (a <= 0) return;
  const bg = c.createLinearGradient(0, H - 230, 0, H);
  bg.addColorStop(0, 'rgba(20,14,30,0)'); bg.addColorStop(0.55, `rgba(20,14,30,${0.42 * a})`); bg.addColorStop(1, `rgba(20,14,30,${0.6 * a})`);
  c.fillStyle = bg; c.fillRect(0, H - 230, W, 230);
}

export { mixHex, palmTree };
