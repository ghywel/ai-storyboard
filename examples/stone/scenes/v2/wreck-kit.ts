// The wreck plate's own kit (v2, `wreck`): S.S. IRON HULL on the seabed in rust and green murk, its deck and its
// hold of identical discs, the trader's ghost, the paint on its plates; and the girl's crossing at dusk (the moray,
// the razor coral, her hands on the rock, her dive watch), the anchor, the gold coin, the pebble pendant.
// Canvas2D, logical 1920x1080, y down; pure functions of t. Sprites (painted words, a stack of discs) are drawn once
// into cached Layer2Ds at the output scale.
import { W, H, Layer2D, SCALE } from '../../engine/gl';
import { font } from '../../engine/type';
import { clamp, ease } from '../../engine/util';
import { h01 } from '../_rai';
import { FAM, TAU, rgbaHex } from '../_motifs';
import { star4 } from '../_manga';
import type { Line } from '../../engine/lyrics';

type C2 = CanvasRenderingContext2D;
const PI = Math.PI;

// ------------------------------------------------------------------ sprites

const SPR = new Map<string, Layer2D>();
/** A cached sprite: `draw` paints it once into a w x h (logical px) layer at the output scale. */
export function sprite(key: string, w: number, h: number, draw: (c: C2) => void): Layer2D {
  let s = SPR.get(key);
  if (!s) { s = new Layer2D(w, h); s.clear(); draw(s.ctx); SPR.set(key, s); }
  return s;
}
/** Draw a sprite centred at (x, y), `k` its scale. */
export function blit(c: C2, s: Layer2D, x: number, y: number, k = 1, rot = 0, a = 1) {
  c.save(); c.globalAlpha *= a; c.translate(x, y); c.rotate(rot);
  c.drawImage(s.canvas, -s.w * k / 2, -s.h * k / 2, s.w * k, s.h * k);
  c.restore();
}

/** Old paint on iron: the words, with flakes knocked out, rust bleeding through, and drips under the letters. */
function paintWords(c: C2, w: number, h: number, lines: string[], fam: string, size: number, col: string, seed: number, flake = 1, lh = 1.0) {
  c.font = font(fam, size); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = col;
  lines.forEach((l, i) => c.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size * lh));
  // drips of the same paint run down from the letters' feet
  c.strokeStyle = col; c.lineCap = 'round';
  for (let i = 0; i < 14 * flake; i++) {
    const x = w * (0.12 + 0.76 * h01(i, seed, 1)), y0 = h / 2 + size * 0.3 * lines.length * 0.7, l = 10 + 50 * h01(i, seed, 2);
    c.lineWidth = 2 + 3 * h01(i, seed, 3);
    c.beginPath(); c.moveTo(x, y0 - 6); c.lineTo(x, y0 + l); c.stroke();
  }
  // flakes: the paint gone in irregular chips
  c.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 90 * flake; i++) {
    const x = w * h01(i, seed, 4), y = h * h01(i, seed, 5), r = (3 + 13 * h01(i, seed, 6) ** 2) * (size / 120);
    c.beginPath();
    for (let k = 0; k < 7; k++) { const a = (k / 7) * TAU, rr = r * (0.6 + 0.6 * h01(i, k, seed + 7)); k ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    c.closePath(); c.fill();
  }
  // rust bleeding through what is left
  c.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 40 * flake; i++) {
    const x = w * h01(i, seed, 8), y = h * h01(i, seed, 9), r = (10 + 40 * h01(i, seed, 10)) * Math.min(1.4, size / 120);
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(150,62,24,0.55)'); g.addColorStop(1, 'rgba(150,62,24,0)');
    c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  c.globalCompositeOperation = 'source-over';
}

// ------------------------------------------------------------------ light and dark

export type Hole = { x: number; y: number; r: number; soft?: number; a?: number };
let DARK: Layer2D | null = null;
/**
 * The dark of the deep: everything dimmed to `a`, except soft holes of light that ADD up where they overlap (the
 * kit's darkness() draws each hole's feather over its neighbours, a black ring). Holes are in the current transform's
 * coordinates; the dark is drawn on a half-resolution layer (it is all soft) and laid over the frame.
 */
export function dark(c: C2, a: number, holes: Hole[], col = '#020a0c') {
  if (!DARK) DARK = new Layer2D(W, H, SCALE * 0.5);
  const d = DARK.ctx, m = c.getTransform(), k = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
  DARK.clear();
  d.fillStyle = rgbaHex(col, a); d.fillRect(0, 0, W, H);
  d.globalCompositeOperation = 'destination-out';
  for (const h of holes) {
    const p = m.transformPoint({ x: h.x, y: h.y }), r = h.r * k, s = h.soft ?? 0.5;
    const gr = d.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    gr.addColorStop(0, `rgba(0,0,0,${h.a ?? 1})`); gr.addColorStop(clamp(1 - s, 0, 0.99), `rgba(0,0,0,${h.a ?? 1})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    d.fillStyle = gr; d.fillRect(p.x - r, p.y - r, 2 * r, 2 * r);
  }
  d.globalCompositeOperation = 'source-over';
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(DARK.canvas, 0, 0, W, H); c.restore();
}

/** A torch beam with a feathered edge (four nested cones, brightest at the axis), on the glow layer. */
export function softBeam(g: C2, x: number, y: number, ang: number, len: number, spread = 0.2, a = 1, col = '#ffe7b0') {
  const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len, nx = -Math.sin(ang), ny = Math.cos(ang);
  for (let i = 0; i < 9; i++) {
    const k = 1 - i * 0.1, aa = 0.028 + 0.004 * i;
    const w = Math.tan(spread * k) * len;
    const gr = g.createLinearGradient(x, y, ex, ey);
    gr.addColorStop(0, rgbaHex(col, aa * a * 1.6)); gr.addColorStop(0.6, rgbaHex(col, aa * a * 0.7)); gr.addColorStop(1, rgbaHex(col, aa * a * 0.25));
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(x + nx * 3, y + ny * 3); g.lineTo(ex + nx * w, ey + ny * w); g.lineTo(ex - nx * w, ey - ny * w); g.lineTo(x - nx * 3, y - ny * 3); g.closePath(); g.fill();
  }
  // the pool where it lands
  const r = Math.tan(spread) * len * 1.1, pg = g.createRadialGradient(ex, ey, 0, ex, ey, r);
  pg.addColorStop(0, rgbaHex(col, 0.2 * a)); pg.addColorStop(1, rgbaHex(col, 0));
  g.fillStyle = pg; g.fillRect(ex - r, ey - r, 2 * r, 2 * r);
  // the lamp itself
  const lg = g.createRadialGradient(x, y, 0, x, y, 40);
  lg.addColorStop(0, rgbaHex('#fffbe8', 0.9 * a)); lg.addColorStop(1, rgbaHex('#fffbe8', 0));
  g.fillStyle = lg; g.fillRect(x - 40, y - 40, 80, 80);
  return { x: ex, y: ey, r: r * 1.15, soft: 0.65 } as Hole;
}

/**
 * Fade the glow layer out towards the lyric band before clearGlowBand cuts it (a hard cut shows as a line across a
 * torch's pool); after this the band is already empty, so the cut is invisible.
 */
export function featherGlow(g: C2, y0 = H - 400, y1 = H - 241) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-out';
  const gr = g.createLinearGradient(0, y0, 0, y1);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
  g.fillStyle = gr; g.fillRect(0, y0, W, H - y0);
  g.restore();
}

// ------------------------------------------------------------------ the lyric's lines for a rapped plate

/**
 * A rapped plate's lines for the rising lyric. Each line's last word is timed in the data to run on to the next line's
 * first word, so a 0.4 s lead (currentLine) swaps the next line in before the last word is sung ("ton", "gold"). Here
 * the last word ends 0.15 s before the next line, and the line ahead of the plate is carried in while its last word
 * is still being sung across the cut (wreck's "lost." into harbour).
 */
export function plateLines(all: Line[], start: number, end: number): Line[] {
  const own = all.filter((l) => l.words[0]!.start >= start - 0.1 && l.words[0]!.start < end);
  if (!own.length) return own;
  const clampLast = (l: Line): Line => {
    const nx = all[all.indexOf(l) + 1], last = l.words[l.words.length - 1]!;
    if (!nx || last.end <= nx.words[0]!.start - 0.15) return l;
    const cut = Math.max(last.start + 0.08, nx.words[0]!.start - 0.15);
    return { ...l, end: cut, words: l.words.map((w, k) => (k === l.words.length - 1 ? { ...w, end: cut } : w)) };
  };
  const i0 = all.indexOf(own[0]!), prev = i0 > 0 ? clampLast(all[i0 - 1]!) : undefined;
  const lines = own.map(clampLast);
  return prev && prev.words[prev.words.length - 1]!.end > start + 0.05 ? [prev, ...lines] : lines;
}
/** The line to show at t: the next line takes over at the later of its 0.4 s lead and the last word's (clamped) end. */
export function lyricAt(lines: Line[], t: number): Line | null {
  let cur: Line | null = null;
  lines.forEach((l, i) => {
    const sw = i === 0 ? -1e9 : Math.max(l.words[0]!.start - 0.4, lines[i - 1]!.words[lines[i - 1]!.words.length - 1]!.end);
    if (t >= sw) cur = l;
  });
  return cur;
}

// ------------------------------------------------------------------ the murk

/** The green murk round the wreck: water dropping from teal to near black, dusk shafts, far kelp, the silt floor. */
export function murk(c: C2, t: number, o: { pan?: number; floor?: number; rays?: number; seed?: number; far?: boolean } = {}) {
  const pan = o.pan ?? 0, fy = o.floor ?? H * 0.84, seed = o.seed ?? 1, rays = o.rays ?? 1;
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#2f6e63'); g.addColorStop(0.3, '#18493f'); g.addColorStop(0.7, '#0c2b29'); g.addColorStop(1, '#071718');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // the surface far above, a dull glow
  const sg = c.createRadialGradient(W * 0.45 - pan * 0.05, -H * 0.4, 0, W * 0.45, -H * 0.4, H * 1.1);
  sg.addColorStop(0, 'rgba(200,230,170,0.35)'); sg.addColorStop(1, 'rgba(200,230,170,0)');
  c.fillStyle = sg; c.fillRect(0, 0, W, H);
  // shafts of the last dusk light, slanting down through the murk
  if (rays > 0) {
    c.save(); c.globalCompositeOperation = 'screen';
    for (let k = 0; k < 7; k++) {
      const x = (0.05 + 0.15 * k + 0.02 * Math.sin(t * 0.25 + k * 1.3)) * W - pan * 0.15, sp = (0.03 + 0.03 * h01(k, seed, 3)) * W;
      const a = rays * (0.07 + 0.04 * Math.sin(t * 0.6 + k * 2.1));
      const rg = c.createLinearGradient(0, 0, 0, fy);
      rg.addColorStop(0, `rgba(190,235,190,${a})`); rg.addColorStop(1, 'rgba(190,235,190,0)');
      c.fillStyle = rg;
      c.beginPath(); c.moveTo(x - sp * 0.15, 0); c.lineTo(x + sp * 0.15, 0); c.lineTo(x + sp * 1.3 + 260, fy); c.lineTo(x - sp * 0.9 + 260, fy); c.closePath(); c.fill();
    }
    c.restore();
  }
  // far kelp and rocks in the haze
  if (o.far !== false) {
    c.fillStyle = '#123a35';
    c.beginPath(); c.moveTo(0, fy);
    for (let x = 0; x <= W; x += 60) c.lineTo(x, fy - 50 - 40 * Math.sin((x + pan * 0.3) * 0.005 + seed) - 18 * Math.sin((x + pan * 0.3) * 0.017));
    c.lineTo(W, fy); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(30,80,62,0.8)'; c.lineCap = 'round';
    for (let i = 0; i < 16; i++) {
      const x = ((h01(i, seed, 13) * (W + 300) - pan * 0.3) % (W + 300) + W + 300) % (W + 300) - 150, h = 160 + 260 * h01(i, seed, 14);
      c.lineWidth = 5 + 5 * h01(i, seed, 15);
      c.beginPath(); c.moveTo(x, fy - 40);
      for (let s = 1; s <= 8; s++) { const u = s / 8; c.lineTo(x + Math.sin(t * 1.1 + i + u * 3) * 22 * u, fy - 40 - h * u); }
      c.stroke();
    }
  }
  // the silt floor
  const fg = c.createLinearGradient(0, fy - 20, 0, H);
  fg.addColorStop(0, '#2a3f33'); fg.addColorStop(1, '#152219');
  c.fillStyle = fg;
  c.beginPath(); c.moveTo(0, H);
  for (let x = 0; x <= W; x += 40) c.lineTo(x, fy + 8 * Math.sin((x + pan) * 0.006 + seed) + 5 * Math.sin((x + pan) * 0.019));
  c.lineTo(W, H); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(120,150,110,0.18)'; c.lineWidth = 2;
  for (let i = 0; i < 22; i++) {
    const x = ((h01(i, seed, 21) * (W + 300) - pan) % (W + 300) + W + 300) % (W + 300) - 150, y = fy + 20 + h01(i, seed, 22) * (H - fy - 30);
    c.beginPath(); c.moveTo(x - 40, y); c.quadraticCurveTo(x, y - 7, x + 40, y); c.stroke();
  }
}

/** Marine snow: specks drifting down and sideways (near ones larger, faster); `n` of them. */
export function snow(c: C2, t: number, n = 70, seed = 5, near = 1, pan = 0) {
  c.fillStyle = 'rgba(210,240,220,0.5)';
  c.beginPath();
  for (let i = 0; i < n; i++) {
    const d = 0.3 + 0.7 * h01(i, seed, 1), r = (0.8 + 2.2 * d) * near;
    const x = ((h01(i, seed, 2) * W + 20 * Math.sin(t * 0.5 + i) - pan * d) % W + W) % W;
    const y = ((h01(i, seed, 3) * H + t * 22 * d) % H + H) % H;
    c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU);
  }
  c.fill();
}

// ------------------------------------------------------------------ the hull

/** Hull-local landmarks (px at scale 1): the stem's foot, the bow's top, the paint, the hawse pipe, the hatch. */
export const HULL = {
  foot: { x: 120, y: 0 }, bow: { x: -180, y: -760 }, name: { x: 470, y: -650 }, ton: { x: 360, y: -330 },
  hawse: { x: 70, y: -560 }, hatch: { x: 660, y: -700 }, ports: [560, 860, 1160, 1460, 1760, 2060, 2360, 2660],
};
/** The deck line's height at hull-local x (the sheer rises to the bow). */
export const deckY = (x: number) => -700 - 60 * clamp((600 - x) / 780) ** 2;

export interface HullOpts {
  /** 1 TON under the rust: 0 covered .. 1 rubbed clean, about `rub` (hull-local) */
  ton?: number;
  rub?: { x: number; y: number };
  /** the deck's furniture in silhouette above the deck line */
  gear?: boolean;
  /** the anchor chain out of the hawse pipe, down to the anchor at hull-local (ax, ay) */
  chain?: { x: number; y: number };
  /** the light from the surface along the top edge */
  rim?: number;
}

/**
 * S.S. IRON HULL's bow and side, lying on the seabed: riveted plates in rust, portholes, the hawse pipe and its chain,
 * the name and 1 TON painted on the bow, kelp hanging from the rail, the deck's furniture above. (x, y) is the stem's
 * foot on the floor; `s` its scale; `rot` a list.
 */
export function hull(c: C2, g: C2, x: number, y: number, s: number, rot: number, t: number, o: HullOpts = {}) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  const outline = () => {
    c.beginPath(); c.moveTo(120, 80); c.lineTo(120, 0);
    c.bezierCurveTo(40, -260, -110, -560, -180, -760 - 34);
    for (let px = -180; px <= 3400; px += 40) c.lineTo(px, deckY(px) - 34);
    c.lineTo(3400, 80); c.closePath();
  };
  // the deck's furniture behind the rail
  if (o.gear !== false) deckGear(c, t);
  // the plating
  outline();
  const pg = c.createLinearGradient(0, -800, 0, 80);
  pg.addColorStop(0, '#5a3d2e'); pg.addColorStop(0.5, '#3a2820'); pg.addColorStop(1, '#1b1416');
  c.fillStyle = pg; c.fill();
  c.save(); outline(); c.clip();
  // rust mottling
  for (let i = 0; i < 34; i++) {
    const px = -150 + 3500 * h01(i, 3, 1), py = -760 + 820 * h01(i, 3, 2), r = 50 + 150 * h01(i, 3, 3);
    const rg = c.createRadialGradient(px, py, 0, px, py, r);
    rg.addColorStop(0, `rgba(${h01(i, 3, 4) < 0.5 ? '158,70,30' : '120,58,34'},0.5)`); rg.addColorStop(1, 'rgba(140,60,30,0)');
    c.fillStyle = rg; c.fillRect(px - r, py - r, 2 * r, 2 * r);
  }
  // the boot-topping, red anti-fouling gone to brown
  c.fillStyle = 'rgba(108,36,32,0.55)'; c.fillRect(-300, -60, 3800, 140);
  // strakes (the plates' lapped edges), butt seams and rivets
  const strakes = [-620, -500, -380, -260, -140, -20];
  c.lineCap = 'butt';
  for (const sy of strakes) {
    c.strokeStyle = 'rgba(18,10,8,0.7)'; c.lineWidth = 4; c.beginPath(); c.moveTo(-300, sy); c.lineTo(3400, sy + 6); c.stroke();
    c.strokeStyle = 'rgba(214,130,74,0.22)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-300, sy + 4); c.lineTo(3400, sy + 10); c.stroke();
  }
  c.strokeStyle = 'rgba(18,10,8,0.55)'; c.lineWidth = 3;
  strakes.forEach((sy, i) => { for (let px = -100 + (i % 2) * 160; px < 3400; px += 320) { c.beginPath(); c.moveTo(px, sy - 120); c.lineTo(px, sy); c.stroke(); } });
  c.fillStyle = 'rgba(20,12,10,0.75)';
  c.beginPath();
  for (const sy of strakes) for (let px = -280; px < 3400; px += 28) { c.moveTo(px + 3.6, sy - 9); c.arc(px, sy - 9, 3.6, 0, TAU); }
  strakes.forEach((sy, i) => { for (let px = -100 + (i % 2) * 160; px < 3400; px += 320) for (let ry = sy - 110; ry < sy; ry += 26) { c.moveTo(px - 9 + 3.4, ry); c.arc(px - 9, ry, 3.4, 0, TAU); } });
  c.fill();
  c.fillStyle = 'rgba(232,150,92,0.32)';
  c.beginPath();
  for (const sy of strakes) for (let px = -280; px < 3400; px += 28) { c.moveTo(px - 1 + 1.3, sy - 10.5); c.arc(px - 1, sy - 10.5, 1.3, 0, TAU); }
  c.fill();
  // rust streaks bleeding down from the seams, the portholes and the hawse
  const streak = (sx: number, sy: number, len: number, w: number, a: number) => {
    const sg = c.createLinearGradient(0, sy, 0, sy + len);
    sg.addColorStop(0, `rgba(196,92,38,${a})`); sg.addColorStop(1, 'rgba(196,92,38,0)');
    c.fillStyle = sg; c.beginPath(); c.moveTo(sx - w / 2, sy); c.lineTo(sx + w / 2, sy); c.lineTo(sx + w * 0.2, sy + len); c.lineTo(sx - w * 0.2, sy + len); c.closePath(); c.fill();
  };
  for (let i = 0; i < 60; i++) {
    const row = strakes[Math.floor(h01(i, 5, 1) * strakes.length)]!;
    streak(-120 + 3400 * h01(i, 5, 2), row - 6, 60 + 180 * h01(i, 5, 3), 6 + 12 * h01(i, 5, 4), 0.25 + 0.3 * h01(i, 5, 5));
  }
  for (const px of HULL.ports) streak(px, -560, 260, 34, 0.5);
  streak(HULL.hawse.x, HULL.hawse.y + 30, 420, 60, 0.55);
  // the paint: the name along the sheer, and 1 TON on the bow under the rust
  const name = sprite('wreck-name', 760, 150, (k) => paintWords(k, 760, 150, ['S.S. IRON HULL'], FAM.cond(), 100, '#e9e1c8', 11, 0.8));
  blit(c, name, HULL.name.x, HULL.name.y, 1, Math.atan2(deckY(HULL.name.x + 200) - deckY(HULL.name.x - 200), 400), 0.92);
  const ton = sprite('wreck-ton', 900, 320, (k) => { k.font = font(FAM.hook(), 220); const fs = Math.min(220, 220 * 820 / k.measureText('1 TON').width); paintWords(k, 900, 320, ['1 TON'], FAM.hook(), fs, '#efe8d2', 23, 0.3); });
  const tv = clamp(o.ton ?? 0);
  blit(c, ton, HULL.ton.x, HULL.ton.y, 0.8, -0.04, 0.22 + 0.78 * tv);
  // the rust over 1 TON, rubbed away from `rub` outward as `ton` grows
  const rub = o.rub ?? HULL.ton, rr = tv * 520;
  for (let i = 0; i < 70; i++) {
    const px = HULL.ton.x - 330 + 660 * h01(i, 9, 1), py = HULL.ton.y - 160 + 320 * h01(i, 9, 2), r = 40 + 60 * h01(i, 9, 3);
    const d = Math.hypot(px - rub.x, py - rub.y), a = clamp((d - rr) / 120);
    if (a <= 0.02) continue;
    const rg = c.createRadialGradient(px, py, 0, px, py, r);
    rg.addColorStop(0, `rgba(118,52,26,${0.8 * a})`); rg.addColorStop(1, 'rgba(118,52,26,0)');
    c.fillStyle = rg; c.fillRect(px - r, py - r, 2 * r, 2 * r);
  }
  // portholes: verdigris rims, dark glass, a fish living in one
  for (const [i, px] of HULL.ports.entries()) {
    const py = -590;
    c.fillStyle = '#0a1716'; c.beginPath(); c.arc(px, py, 34, 0, TAU); c.fill();
    c.strokeStyle = '#5f6b44'; c.lineWidth = 12; c.stroke();
    c.strokeStyle = 'rgba(140,200,160,0.35)'; c.lineWidth = 3; c.beginPath(); c.arc(px, py, 41, PI * 1.1, PI * 1.6); c.stroke();
    c.fillStyle = 'rgba(180,230,210,0.18)'; c.beginPath(); c.ellipse(px - 10, py - 12, 12, 6, -0.6, 0, TAU); c.fill();
    if (i === 2) { // a small fish at home in the porthole, peeking out
      const fx = px + 6 * Math.sin(t * 2), fy = py + 4;
      c.fillStyle = '#ff9a3a'; c.beginPath(); c.ellipse(fx, fy, 14, 9, 0, 0, TAU); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(fx + 6, fy - 2, 3.5, 0, TAU); c.fill();
      c.fillStyle = '#111'; c.beginPath(); c.arc(fx + 7, fy - 2, 1.8, 0, TAU); c.fill();
    }
  }
  // the hawse pipe
  c.fillStyle = '#0b0807'; c.beginPath(); c.ellipse(HULL.hawse.x, HULL.hawse.y, 46, 36, -0.3, 0, TAU); c.fill();
  c.strokeStyle = '#6e3a1f'; c.lineWidth = 14; c.stroke();
  // barnacles and weed low on the bow
  for (let i = 0; i < 70; i++) {
    const px = -60 + 700 * h01(i, 13, 1) ** 1.5, py = -120 + 140 * h01(i, 13, 2) - (px < 100 ? 0 : 0), r = 4 + 7 * h01(i, 13, 3);
    c.fillStyle = 'rgba(205,200,180,0.75)'; c.beginPath(); c.arc(px, py, r, 0, TAU); c.fill();
    c.fillStyle = 'rgba(40,34,30,0.8)'; c.beginPath(); c.arc(px, py, r * 0.4, 0, TAU); c.fill();
  }
  c.restore();
  // the rail's cap and the light from the surface along it
  c.strokeStyle = '#2a1b16'; c.lineWidth = 12;
  c.beginPath(); for (let px = -180; px <= 3400; px += 40) px === -180 ? c.moveTo(px, deckY(px) - 34) : c.lineTo(px, deckY(px) - 34); c.stroke();
  const rim = o.rim ?? 0.6;
  if (rim > 0) {
    c.strokeStyle = `rgba(150,220,190,${0.4 * rim})`; c.lineWidth = 4;
    c.beginPath(); for (let px = -180; px <= 3400; px += 40) px === -180 ? c.moveTo(px, deckY(px) - 40) : c.lineTo(px, deckY(px) - 40); c.stroke();
    c.beginPath(); c.moveTo(-178, -794); c.bezierCurveTo(-110, -560, 40, -260, 120, 0); c.strokeStyle = `rgba(150,220,190,${0.25 * rim})`; c.lineWidth = 5; c.stroke();
  }
  // kelp hanging from the rail, swaying
  for (let i = 0; i < 9; i++) {
    const px = 200 + 340 * i + 80 * h01(i, 17, 1), py = deckY(px) - 30, len = 120 + 160 * h01(i, 17, 2);
    c.strokeStyle = i % 2 ? '#2f6a3a' : '#3f7f45'; c.lineWidth = 10; c.lineCap = 'round';
    c.beginPath(); c.moveTo(px, py);
    for (let k = 1; k <= 8; k++) { const u = k / 8; c.lineTo(px + Math.sin(t * 1.3 + i + u * 2.5) * 26 * u + 30 * u, py + len * u); }
    c.stroke();
  }
  // the anchor chain from the hawse to the anchor on the floor
  if (o.chain) chain(c, HULL.hawse.x + 10, HULL.hawse.y + 26, o.chain.x, o.chain.y, t);
  c.restore();
  void g;
}

/** The deck's furniture above the rail (hull-local): the mast stump, the open cargo hatch, a ventilator, the wheelhouse, the funnel. */
function deckGear(c: C2, t: number) {
  const iron = '#2c1f1b', edge = '#7a4024';
  c.lineJoin = 'round';
  // the foremast, broken off, with a wire trailing
  c.fillStyle = iron; c.beginPath(); c.moveTo(330, deckY(330)); c.lineTo(352, deckY(330) - 330); c.lineTo(372, deckY(330) - 300); c.lineTo(366, deckY(330) - 350); c.lineTo(384, deckY(330)); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(80,60,50,0.9)'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(360, deckY(330) - 320); c.quadraticCurveTo(470 + 10 * Math.sin(t), deckY(330) - 150, 600, deckY(600) - 40); c.stroke();
  // the round hatch on the foredeck: a riveted drum of a coaming, the dark hold inside, its lid thrown back on its hinge
  const hx = HULL.hatch.x, hy = deckY(hx) - 34;
  c.fillStyle = iron; c.fillRect(hx - 110, hy - 70, 220, 70);
  c.fillStyle = '#1a1210'; c.beginPath(); c.ellipse(hx, hy, 110, 20, 0, 0, PI); c.fill();
  c.fillStyle = '#050403'; c.beginPath(); c.ellipse(hx, hy - 70, 110, 22, 0, 0, TAU); c.fill();
  c.strokeStyle = edge; c.lineWidth = 6; c.beginPath(); c.ellipse(hx, hy - 70, 110, 22, 0, 0, TAU); c.stroke();
  c.fillStyle = 'rgba(232,150,92,0.5)'; for (let k = 0; k < 9; k++) { c.beginPath(); c.arc(hx - 96 + k * 24, hy - 40, 3.5, 0, TAU); c.fill(); }
  c.save(); c.translate(hx + 108, hy - 74); c.rotate(-1.2);
  c.fillStyle = '#231815'; c.beginPath(); c.ellipse(110, 0, 110, 22, 0, 0, TAU); c.fill();
  c.strokeStyle = edge; c.lineWidth = 5; c.stroke(); c.restore();
  // a ventilator cowl
  const vx = 1120, vy = deckY(vx);
  c.fillStyle = iron; c.fillRect(vx - 18, vy - 180, 36, 180);
  c.beginPath(); c.ellipse(vx + 14, vy - 196, 46, 38, -0.5, 0, TAU); c.fill();
  c.fillStyle = '#0c0807'; c.beginPath(); c.ellipse(vx + 26, vy - 196, 26, 26, -0.5, 0, TAU); c.fill();
  // the wheelhouse, its windows empty
  const wx = 1560, wy = deckY(wx);
  c.fillStyle = iron; c.fillRect(wx, wy - 280, 420, 280);
  c.fillStyle = '#2f221d'; c.fillRect(wx - 20, wy - 300, 460, 26);
  c.fillStyle = '#0c0807'; for (let k = 0; k < 4; k++) c.fillRect(wx + 30 + k * 98, wy - 240, 64, 70);
  c.strokeStyle = edge; c.lineWidth = 4; c.strokeRect(wx, wy - 280, 420, 280);
  // the funnel, leaning, with a band
  c.save(); c.translate(2260, deckY(2260)); c.rotate(0.12);
  c.fillStyle = iron; c.fillRect(-70, -420, 140, 420);
  c.fillStyle = '#5a2a1c'; c.fillRect(-70, -380, 140, 60);
  c.fillStyle = '#0c0807'; c.beginPath(); c.ellipse(0, -420, 70, 18, 0, 0, TAU); c.fill();
  c.restore();
}

/** An anchor chain from (x0, y0) sagging to (x1, y1): links alternating face-on and edge-on. */
export function chain(c: C2, x0: number, y0: number, x1: number, y1: number, t: number, k = 1) {
  const n = Math.max(6, Math.round(Math.hypot(x1 - x0, y1 - y0) / (34 * k)));
  const sag = Math.min(260, Math.abs(x1 - x0) * 0.25) * k;
  c.save(); c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n, px = x0 + (x1 - x0) * u + 3 * Math.sin(t * 1.5 + i * 0.3), py = y0 + (y1 - y0) * u + sag * 4 * u * (1 - u);
    const u2 = (i + 1.5) / n, ang = Math.atan2(y0 + (y1 - y0) * u2 + sag * 4 * u2 * (1 - u2) - py, x0 + (x1 - x0) * u2 - px);
    c.save(); c.translate(px, py); c.rotate(ang);
    if (i % 2) { c.strokeStyle = '#4a2a1c'; c.lineWidth = 9 * k; c.beginPath(); c.moveTo(-18 * k, 0); c.lineTo(18 * k, 0); c.stroke(); }
    else { c.strokeStyle = '#6a3a22'; c.lineWidth = 7 * k; c.beginPath(); c.ellipse(0, 0, 20 * k, 11 * k, 0, 0, TAU); c.stroke(); }
    c.restore();
  }
  c.restore();
}

// ------------------------------------------------------------------ the deck (the ghost's shot)

/**
 * On the deck, low and close: the rotten planking running away, the open hatch at left, the wheelhouse wall at right
 * with WHY PADDLE? painted on it in a speech balloon (the trader's own slogan on his ship), lit to `lit`.
 */
export function deckView(c: C2, g: C2, t: number, o: { lit?: number; pan?: number } = {}) {
  const pan = o.pan ?? 0, hz = H * 0.42;
  // the murk beyond the rail
  const bg = c.createLinearGradient(0, 0, 0, hz);
  bg.addColorStop(0, '#2c665b'); bg.addColorStop(1, '#123b35');
  c.fillStyle = bg; c.fillRect(0, 0, W, hz + 4);
  c.save(); c.globalCompositeOperation = 'screen';
  for (let k = 0; k < 5; k++) {
    const x = W * (0.1 + 0.2 * k) - pan * 0.2, rg = c.createLinearGradient(0, 0, 0, hz);
    rg.addColorStop(0, `rgba(190,235,190,${0.08 + 0.03 * Math.sin(t + k)})`); rg.addColorStop(1, 'rgba(190,235,190,0)');
    c.fillStyle = rg; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 60, 0); c.lineTo(x + 260, hz); c.lineTo(x + 120, hz); c.closePath(); c.fill();
  }
  c.restore();
  // the far rail and the mast against the murk
  c.strokeStyle = '#1c1512'; c.lineWidth = 8;
  c.beginPath(); c.moveTo(-50, hz - 60); c.lineTo(W + 50, hz - 40); c.stroke();
  c.lineWidth = 5; for (let x = -pan * 0.6 % 90; x < W + 90; x += 90) { c.beginPath(); c.moveTo(x, hz - 58 + x * 0.01); c.lineTo(x, hz); c.stroke(); }
  c.fillStyle = '#1c1512'; c.fillRect(W * 0.22 - pan * 0.5, 0, 36, hz);
  c.strokeStyle = 'rgba(40,30,26,0.9)'; c.lineWidth = 3; c.beginPath(); c.moveTo(W * 0.22 + 18 - pan * 0.5, 40); c.quadraticCurveTo(W * 0.4, hz * 0.5, W * 0.58, hz - 10); c.stroke();
  // the deck: planks running to the vanishing point, rotten, iron showing through
  const dg = c.createLinearGradient(0, hz, 0, H);
  dg.addColorStop(0, '#2a2620'); dg.addColorStop(1, '#3d2e22');
  c.fillStyle = dg; c.fillRect(0, hz, W, H - hz);
  const vx = W * 0.5 - pan * 0.3;
  c.strokeStyle = 'rgba(15,10,8,0.6)'; c.lineWidth = 3;
  for (let k = -14; k <= 14; k++) { c.beginPath(); c.moveTo(vx + k * 18, hz); c.lineTo(vx + k * 260, H + 40); c.stroke(); }
  for (let i = 0; i < 9; i++) { // gaps where the planks have rotted to the iron
    const x = vx + (h01(i, 31, 1) - 0.5) * 1600, y = hz + 60 + (H - hz) * h01(i, 31, 2) ** 1.4, w = 60 + 140 * h01(i, 31, 3);
    c.fillStyle = 'rgba(110,52,26,0.55)'; c.beginPath(); c.ellipse(x, y, w, w * 0.18, 0, 0, TAU); c.fill();
  }
  // silt drifted in the corners
  c.fillStyle = 'rgba(70,90,72,0.5)'; c.beginPath(); c.ellipse(W * 0.1, H * 0.98, 520, 90, 0, 0, TAU); c.fill();
  // the round hatch at left, open on the black hold
  const hx = W * 0.14 - pan * 0.8, hy = H * 0.74;
  c.fillStyle = '#3a2a20'; c.beginPath(); c.ellipse(hx, hy + 26, 250, 86, 0, 0, TAU); c.fill();      // the coaming's side
  c.fillStyle = '#060404'; c.beginPath(); c.ellipse(hx, hy, 230, 72, 0, 0, TAU); c.fill();           // the hold below
  c.strokeStyle = '#6a3a22'; c.lineWidth = 16; c.stroke();
  // the wheelhouse wall at right, with its painted balloon
  const wx = W * 0.5 - pan, wy = H * 0.66;
  c.fillStyle = '#3a2820'; c.beginPath(); c.moveTo(wx, hz - 200); c.lineTo(W + 80, hz - 260); c.lineTo(W + 80, wy + 60); c.lineTo(wx, wy); c.closePath(); c.fill();
  c.save(); c.beginPath(); c.moveTo(wx, hz - 200); c.lineTo(W + 80, hz - 260); c.lineTo(W + 80, wy + 60); c.lineTo(wx, wy); c.closePath(); c.clip();
  for (let i = 0; i < 18; i++) {
    const px = wx + 1100 * h01(i, 41, 1), py = hz - 200 + 600 * h01(i, 41, 2), r = 60 + 120 * h01(i, 41, 3);
    const rg = c.createRadialGradient(px, py, 0, px, py, r); rg.addColorStop(0, 'rgba(150,64,28,0.45)'); rg.addColorStop(1, 'rgba(150,64,28,0)');
    c.fillStyle = rg; c.fillRect(px - r, py - r, 2 * r, 2 * r);
  }
  c.fillStyle = 'rgba(18,10,8,0.7)';
  c.beginPath(); for (let k = 0; k < 4; k++) for (let j = 0; j < 22; j++) { const px = wx + 30 + j * 46, py = hz - 180 + k * 190 - j * 2.4; c.moveTo(px + 4, py); c.arc(px, py, 4, 0, TAU); } c.fill();
  c.restore();
  // a porthole in the wall, and the door frame
  c.fillStyle = '#0a0808'; c.fillRect(wx + 30, hz - 120, 120, 330);
  c.strokeStyle = '#6a3a22'; c.lineWidth = 10; c.strokeRect(wx + 30, hz - 120, 120, 330);
  const lit = o.lit ?? 0;
  const bal = sprite('wreck-balloon', 760, 420, (k) => paintBalloon(k, 760, 420, 'WHY', 'PADDLE?', 29));
  blit(c, bal, wx + 560, hz + 10, 0.92, -0.05, 0.25 + 0.75 * lit);
  void g;
}

/** The speech balloon of flaking paint (the trader's slogan): a white balloon with its tail down-left, two words. */
function paintBalloon(c: C2, w: number, h: number, a: string, b: string, seed: number) {
  c.fillStyle = '#e4dbc2';
  c.beginPath(); c.ellipse(w * 0.55, h * 0.42, w * 0.42, h * 0.36, 0, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(w * 0.3, h * 0.6); c.lineTo(w * 0.06, h * 0.96); c.lineTo(w * 0.42, h * 0.7); c.closePath(); c.fill();
  c.strokeStyle = '#3a1a10'; c.lineWidth = 8;
  c.beginPath(); c.ellipse(w * 0.55, h * 0.42, w * 0.42, h * 0.36, 0, 0.62 * PI, 2.48 * PI); c.stroke();
  c.font = font(FAM.hook(), 104); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#4a1e10';
  c.fillText(a, w * 0.55, h * 0.3); c.font = font(FAM.hook(), 92); c.fillText(b, w * 0.55, h * 0.53);
  // flakes off the white and the letters, rust where they were
  c.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 70; i++) {
    const x = w * h01(i, seed, 1), y = h * h01(i, seed, 2), r = 6 + 26 * h01(i, seed, 3) ** 2;
    c.fillStyle = h01(i, seed, 4) < 0.6 ? 'rgba(122,52,24,0.95)' : 'rgba(80,40,26,0.9)';
    c.beginPath();
    for (let k = 0; k < 7; k++) { const an = (k / 7) * TAU, rr = r * (0.55 + 0.7 * h01(i, k, seed)); k ? c.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr) : c.moveTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); }
    c.closePath(); c.fill();
  }
  for (let i = 0; i < 26; i++) { // rust runs
    const x = w * (0.15 + 0.75 * h01(i, seed, 6)), y = h * (0.2 + 0.5 * h01(i, seed, 7)), l = 30 + 90 * h01(i, seed, 8);
    const rg = c.createLinearGradient(0, y, 0, y + l); rg.addColorStop(0, 'rgba(150,60,24,0.7)'); rg.addColorStop(1, 'rgba(150,60,24,0)');
    c.fillStyle = rg; c.fillRect(x - 3, y, 6, l);
  }
  c.globalCompositeOperation = 'source-over';
}

// ------------------------------------------------------------------ the trader's ghost

export interface GhostOpts {
  /** 0..1 how formed he is (silt spiralling in, then the figure) */
  a: number;
  /** his gesturing arm: 0 at his side .. 1 flung up and out ("why paddle?") .. 2 pointing at his ship ("a ton") */
  arm?: number;
  /** the ledger under his other arm */
  ledger?: boolean;
  flip?: boolean;
  /** an islander's ghost instead of the trader (no cap, a bow of thanks 0..1) */
  islander?: { bow: number; seed: number };
  col?: string;
}

/**
 * The trader's ghostly memory in the torchlight: a faceless silhouette in a captain's cap, translucent and wavering,
 * his legs a trail of silt; one arm makes the big gesture, the other holds his ledger. Feet (the trail's end) at (x, y).
 */
export function ghost(c: C2, g: C2, x: number, y: number, h: number, t: number, o: GhostOpts) {
  const a = clamp(o.a);
  if (a <= 0) return;
  const u = h / 100, f = o.flip ? -1 : 1, col = o.col ?? '#b6fff0';
  const wv = (px: number, py: number): [number, number] => [x + f * px * u + Math.sin(py * 0.09 + t * 4.2) * 1.6 * u * (1.2 - a * 0.4), y + py * u];
  const isl = o.islander, bow = isl ? clamp(isl.bow) : 0, lean = bow * 18;
  const hd: [number, number] = [lean * 0.9, -88 + bow * 12];
  const body: [number, number][] = [[-3, 0], [-9, -18], [-12, -40], [-13, -60], [-12 + lean * 0.6, -76 + bow * 8], [12 + lean * 0.6, -76 + bow * 8], [13, -58], [11, -38], [6, -16], [3, 0]];
  const arm = o.arm ?? 0;
  const ang = arm <= 1 ? lerpN(1.45, -0.75, ease.outBack(clamp(arm))) : lerpN(-0.75, 0.1, clamp(arm - 1));
  const sh: [number, number] = [9 + lean * 0.6, -72 + bow * 8];
  const el: [number, number] = [sh[0] + Math.cos(ang) * 16, sh[1] + Math.sin(ang) * 16];
  const ang2 = ang - (arm <= 1 ? 0.5 * clamp(arm) : 0);
  const front: [number, number][] = isl ? [sh, [sh[0] + 6, sh[1] + 14], [sh[0] + 12 + bow * 6, sh[1] + 26]] : [sh, el, [el[0] + Math.cos(ang2) * 15, el[1] + Math.sin(ang2) * 15]];
  const back: [number, number][] = isl ? [[-7 + lean * 0.6, -72 + bow * 8], [-2 + lean, -60 + bow * 6], [8 + bow * 10, -50 + bow * 4]] : [[-9, -72], [-19, -60], [-11, -48]];
  const poly = (k: C2, pts: [number, number][], close: boolean) => { k.beginPath(); pts.forEach(([px, py], i) => { const [qx, qy] = wv(px, py); i ? k.lineTo(qx, qy) : k.moveTo(qx, qy); }); if (close) k.closePath(); };
  const fig = (k: C2, fa: number, la: number, lw: number) => {
    k.save(); k.lineJoin = 'round'; k.lineCap = 'round';
    k.fillStyle = rgbaHex(col, fa); k.strokeStyle = rgbaHex(col, la); k.lineWidth = lw * u;
    poly(k, body, true); k.fill(); k.stroke();
    const [hx, hy] = wv(hd[0], hd[1]);
    k.beginPath(); k.arc(hx, hy, 9 * u, 0, TAU); k.fill(); k.stroke();
    if (!isl) { // the captain's cap: crown, peak, badge
      k.beginPath(); k.ellipse(hx - f * 1 * u, hy - 8 * u, 12 * u, 5 * u, 0, 0, TAU); k.fill(); k.stroke();
      k.beginPath(); k.moveTo(hx + f * 4 * u, hy - 5 * u); k.quadraticCurveTo(hx + f * 15 * u, hy - 5 * u, hx + f * 17 * u, hy - 1 * u); k.lineTo(hx + f * 5 * u, hy - 2.5 * u); k.closePath(); k.fill(); k.stroke();
      k.beginPath(); k.arc(hx + f * 3 * u, hy - 8 * u, 1.8 * u, 0, TAU); k.stroke();
      if (o.ledger !== false) { poly(k, [[-20, -70], [-6, -70], [-6, -52], [-20, -52]], true); k.fill(); k.stroke(); }
    }
    // the arms, as thick translucent strokes
    k.strokeStyle = rgbaHex(col, Math.min(1, fa * 2.2)); k.lineWidth = 6 * u;
    poly(k, front, false); k.stroke(); poly(k, back, false); k.stroke();
    k.strokeStyle = rgbaHex(col, la); k.lineWidth = lw * u;
    const [hnx, hny] = wv(front[2]![0], front[2]![1]);
    k.beginPath(); k.arc(hnx, hny, 3.6 * u, 0, TAU); k.fill(); k.stroke();
    if (!isl) { // a double row of coat buttons
      k.fillStyle = rgbaHex(col, la * 0.9);
      for (let r = 0; r < 3; r++) for (const s of [-1, 1]) { const [bx, by] = wv(s * 4, -66 + r * 7); k.beginPath(); k.arc(bx, by, 1.3 * u, 0, TAU); k.fill(); }
    }
    k.restore();
  };
  fig(c, 0.2 * a, 0.75 * a, 1.1);
  fig(g, 0.1 * a, 0.45 * a, 3.2);
  // silt spiralling in as he forms
  if (a < 1) {
    c.fillStyle = rgbaHex('#d9fff4', 0.7 * (1 - a));
    c.beginPath();
    for (let i = 0; i < 40; i++) {
      const an = h01(i, 61) * TAU + t * 3 * (0.5 + h01(i, 62)), rr = (20 + 60 * h01(i, 63)) * u * (1 - a * 0.8);
      const px = x + Math.cos(an) * rr, py = y - 50 * u + Math.sin(an) * rr * 0.9, s = (1 + 2 * h01(i, 64)) * u * 0.6;
      c.moveTo(px + s, py); c.arc(px, py, s, 0, TAU);
    }
    c.fill();
  }
}
const lerpN = (a: number, b: number, u: number) => a + (b - a) * u;

// ------------------------------------------------------------------ the hold

/** A rai disc made in bulk: perfectly round, perfectly flat, the same chip on every one, the trader's stamp. */
function bulkDisc(c: C2, x: number, y: number, rx: number, ry: number, th: number) {
  c.fillStyle = '#6d6a62';
  c.beginPath(); c.ellipse(x, y + th, rx, ry, 0, 0, PI); c.lineTo(x - rx, y); c.ellipse(x, y, rx, ry, 0, PI, 0, true); c.closePath(); c.fill();
  const tg = c.createLinearGradient(x - rx, y - ry, x + rx, y + ry);
  tg.addColorStop(0, '#b9b5aa'); tg.addColorStop(1, '#8f8b80');
  c.fillStyle = tg; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill();
  c.fillStyle = '#4c4943'; c.beginPath(); c.ellipse(x, y, rx * 0.22, ry * 0.22, 0, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(60,58,52,0.5)'; c.lineWidth = Math.max(1, rx * 0.02); c.beginPath(); c.ellipse(x, y, rx * 0.62, ry * 0.62, 0, 0, TAU); c.stroke();
  // the same chip, in the same place, on every one
  c.fillStyle = '#5a574f'; c.beginPath(); c.moveTo(x + rx * 0.62, y - ry * 0.74); c.lineTo(x + rx * 0.86, y - ry * 0.46); c.lineTo(x + rx * 0.7, y - ry * 0.4); c.closePath(); c.fill();
}
/** The sprite of one stack of bulk discs (11 high, stacked like coins), 220 x 340 logical. */
export function discStack(): Layer2D {
  return sprite('wreck-stack', 220, 340, (c) => {
    c.fillStyle = 'rgba(0,0,0,0.4)'; c.beginPath(); c.ellipse(110, 304, 104, 28, 0, 0, TAU); c.fill();
    for (let i = 0; i < 11; i++) bulkDisc(c, 110, 282 - i * 22, 96, 30, 20);
  });
}

/** The hold's grid: (X, Z) of every stack, in rows down both sides of the aisle. */
const STACKS: [number, number][] = [];
for (let r = 0; r < 14; r++) for (const X of [-2.5, -1.9, -1.3, -0.7, 0.7, 1.3, 1.9, 2.5]) STACKS.push([X, 1.3 + r * 0.6]);

/**
 * Inside the hold: frames (the ship's ribs) curving overhead, holes in the deck letting green light fall in, the
 * bulkhead at the far end with IRON HULL CO. stencils and 1/10 EACH, and the stacks of identical discs in a grid
 * down both sides of an aisle, rows and rows of them. `z`, `x` move the camera; `stencil` 0..1 lights the 1/10.
 */
export function hold(c: C2, g: C2, t: number, o: { z?: number; x?: number; vp?: { x: number; y: number }; stencil?: number } = {}) {
  const vp = o.vp ?? { x: W * 0.5, y: H * 0.4 }, cz = o.z ?? 0, cx = o.x ?? 0, F = 760;
  const P = (X: number, Y: number, Z: number) => { const z = Math.max(0.3, Z - cz); return { x: vp.x + (X - cx) * F / z, y: vp.y + Y * F / z, k: F / z }; };
  const bg = c.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#10241f'); bg.addColorStop(1, '#070d0c');
  c.fillStyle = bg; c.fillRect(0, 0, W, H);
  // the bulkhead at the far end
  const Zb = 10, b0 = P(-3, -1.8, Zb), b1 = P(3, 1, Zb), bw = b1.x - b0.x, bh = b1.y - b0.y;
  c.fillStyle = '#33251d'; c.fillRect(b0.x, b0.y, bw, bh);
  c.save(); c.beginPath(); c.rect(b0.x, b0.y, bw, bh); c.clip();
  for (let i = 0; i < 14; i++) {
    const px = b0.x + bw * h01(i, 71, 1), py = b0.y + bh * h01(i, 71, 2), r = bw * (0.05 + 0.12 * h01(i, 71, 3));
    const rg = c.createRadialGradient(px, py, 0, px, py, r); rg.addColorStop(0, 'rgba(150,64,28,0.5)'); rg.addColorStop(1, 'rgba(150,64,28,0)');
    c.fillStyle = rg; c.fillRect(px - r, py - r, 2 * r, 2 * r);
  }
  c.strokeStyle = 'rgba(14,8,6,0.8)'; c.lineWidth = Math.max(2, bw * 0.01);
  for (let k = 1; k < 8; k++) { c.beginPath(); c.moveTo(b0.x + bw * k / 8, b0.y); c.lineTo(b0.x + bw * k / 8, b1.y); c.stroke(); }
  c.fillStyle = 'rgba(14,8,6,0.75)'; c.beginPath();
  for (let k = 1; k < 8; k++) for (let j = 0; j < 14; j++) { const rx = b0.x + bw * k / 8 - bw * 0.012, ry = b0.y + bh * (j + 0.5) / 14, rr = Math.max(1, bw * 0.004); c.moveTo(rx + rr, ry); c.arc(rx, ry, rr, 0, TAU); }
  c.fill();
  const st = clamp(o.stencil ?? 0);
  const sten = sprite('wreck-110', 760, 420, (k) => stencil(k, 760, 420));
  blit(c, sten, b0.x + bw * 0.5, b0.y + bh * 0.4, bw / 760 * 0.62, 0, 0.3 + 0.7 * st);
  const co = sprite('wreck-co', 640, 130, (k) => { k.font = font(FAM.monoB(), 56); k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillStyle = '#d8d0b8'; k.fillText('IRON HULL CO.', 320, 42); k.font = font(FAM.monoB(), 36); k.fillText('BULK · DO NOT ROLL', 320, 100); });
  blit(c, co, b0.x + bw * 0.5, b0.y + bh * 0.8, bw / 760 * 0.5, 0, 0.45 + 0.3 * st);
  c.restore();
  // ribs: frames curving from the floor over the top
  for (let i = 9; i >= 0; i--) {
    const Z = 1.0 + i * 1.0; if (Z - cz < 0.35) continue;
    const l0 = P(-3.0, 1, Z), l1 = P(-3.4, -0.6, Z), top = P(0, -1.9, Z), r1 = P(3.4, -0.6, Z), r0 = P(3.0, 1, Z);
    c.strokeStyle = '#1f1612'; c.lineWidth = Math.max(4, 0.18 * l0.k);
    c.beginPath(); c.moveTo(l0.x, l0.y); c.quadraticCurveTo(l1.x, l1.y - 0.4 * l1.k, top.x - 1.4 * top.k, top.y);
    c.lineTo(top.x + 1.4 * top.k, top.y); c.quadraticCurveTo(r1.x, r1.y - 0.4 * r1.k, r0.x, r0.y); c.stroke();
    c.strokeStyle = 'rgba(170,84,40,0.4)'; c.lineWidth = Math.max(1, 0.035 * l0.k); c.stroke();
  }
  // the floor of silt
  const fz = P(0, 1, Zb);
  const fg = c.createLinearGradient(0, fz.y, 0, H);
  fg.addColorStop(0, '#1a2c25'); fg.addColorStop(1, '#2c3c30');
  c.fillStyle = fg; c.beginPath(); c.moveTo(P(-3, 1, Zb).x, fz.y); c.lineTo(P(3, 1, Zb).x, fz.y); c.lineTo(W * 3, H * 3); c.lineTo(-W * 2, H * 3); c.closePath(); c.fill();
  // light falling through holes in the deck above: slanting shafts
  c.save(); c.globalCompositeOperation = 'screen';
  for (let i = 0; i < 3; i++) {
    const Z = 2.8 + i * 2.4, X = -1.8 + i * 1.6; if (Z - cz < 0.5) continue;
    const top = P(X, -1.9, Z), bot = P(X + 0.7, 1, Z + 0.5), w0 = 0.22 * top.k, w1 = 0.55 * bot.k;
    const a = 0.14 + 0.05 * Math.sin(t * 0.9 + i * 2);
    const rg = c.createLinearGradient(top.x, top.y, bot.x, bot.y); rg.addColorStop(0, `rgba(170,240,210,${a})`); rg.addColorStop(1, `rgba(170,240,210,${a * 0.25})`);
    c.fillStyle = rg; c.beginPath(); c.moveTo(top.x - w0, top.y); c.lineTo(top.x + w0, top.y); c.lineTo(bot.x + w1, bot.y); c.lineTo(bot.x - w1, bot.y); c.closePath(); c.fill();
  }
  c.restore();
  // the stacks, far to near
  const stack = discStack();
  for (let i = STACKS.length - 1; i >= 0; i--) {
    const [X, Z] = STACKS[i]!; if (Z - cz < 0.5) continue;
    const p = P(X, 1, Z), k = p.k / 760 * 0.95;
    if (p.x < -200 || p.x > W + 200) continue;
    blit(c, stack, p.x, p.y - 150 * k, k);
  }
  void g;
}
/** The stencilled marking 1/10 EACH: sprayed paint with its overspray, in a stencilled frame, rust over it. */
function stencil(c: C2, w: number, h: number) {
  c.fillStyle = '#efe6cc'; c.strokeStyle = '#efe6cc';
  c.save(); c.shadowColor = 'rgba(239,230,204,0.6)'; c.shadowBlur = 10;
  c.font = font(FAM.cond(), 250); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('1/10', w / 2, h * 0.4);
  c.font = font(FAM.monoB(), 62); c.fillText('EACH', w / 2, h * 0.82);
  c.lineWidth = 10; c.strokeRect(20, 16, w - 40, h - 32);
  c.restore();
  c.globalCompositeOperation = 'destination-out';
  for (const fx of [0.33, 0.58, 0.72]) c.fillRect(w * fx, h * 0.12, 9, h * 0.08);   // a few stencil bridges
  for (let i = 0; i < 50; i++) { const x = w * h01(i, 81, 1), y = h * h01(i, 81, 2), r = 2 + 6 * h01(i, 81, 3); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
  c.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 14; i++) { const x = w * h01(i, 82, 1), y = h * h01(i, 82, 2), r = 30 + 60 * h01(i, 82, 3); const rg = c.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, 'rgba(150,64,28,0.55)'); rg.addColorStop(1, 'rgba(150,64,28,0)'); c.fillStyle = rg; c.fillRect(x - r, y - r, 2 * r, 2 * r); }
  c.globalCompositeOperation = 'source-over';
}
/** One bulk disc's top, big (the tap's close-up). */
export function bulkTop(c: C2, x: number, y: number, rx: number, ry: number, th: number) { bulkDisc(c, x, y, rx, ry, th); }

// ------------------------------------------------------------------ her crossing at dusk

/** Dusk under water near the surface: a warm band of evening light above, violet water dropping to ink, warm rays. */
export function duskWater(c: C2, t: number, o: { pan?: number; surface?: number } = {}) {
  const pan = o.pan ?? 0, sy = o.surface ?? H * 0.08;
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#ff9a6a'); g.addColorStop(0.12, '#c8607a'); g.addColorStop(0.4, '#5a3f8f'); g.addColorStop(0.8, '#231c52'); g.addColorStop(1, '#120d2a');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // the surface seen from under: a bright wobbling skin with the sky's orange
  c.fillStyle = 'rgba(255,214,160,0.55)';
  c.beginPath(); c.moveTo(0, 0);
  for (let x = 0; x <= W; x += 30) c.lineTo(x, sy + 9 * Math.sin((x + pan) * 0.012 + t * 1.6) + 5 * Math.sin((x + pan) * 0.031 - t));
  c.lineTo(W, 0); c.closePath(); c.fill();
  c.save(); c.globalCompositeOperation = 'screen';
  for (let k = 0; k < 8; k++) {
    const x = (0.04 + 0.13 * k) * W - (pan * 0.3) % (W * 0.13) + 30 * Math.sin(t * 0.3 + k), sp = 30 + 40 * h01(k, 91);
    const rg = c.createLinearGradient(0, sy, 0, H * 0.9);
    rg.addColorStop(0, `rgba(255,190,140,${0.16 + 0.05 * Math.sin(t * 0.7 + k * 2)})`); rg.addColorStop(1, 'rgba(255,190,140,0)');
    c.fillStyle = rg; c.beginPath(); c.moveTo(x - sp * 0.2, sy); c.lineTo(x + sp * 0.2, sy); c.lineTo(x + sp * 2 + 200, H * 0.9); c.lineTo(x - sp + 200, H * 0.9); c.closePath(); c.fill();
  }
  c.restore();
}

/** The reef at dusk in silhouette layers: far ridges, coral heads, fans and fingers in violet and coral. */
export function duskReef(c: C2, t: number, o: { pan?: number; floor?: number; seed?: number } = {}) {
  const pan = o.pan ?? 0, fy = o.floor ?? H * 0.78, seed = o.seed ?? 2;
  c.fillStyle = '#2c2466';
  c.beginPath(); c.moveTo(0, fy);
  for (let x = 0; x <= W; x += 40) c.lineTo(x, fy - 90 - 70 * Math.sin((x + pan * 0.3) * 0.004 + seed) - 30 * Math.sin((x + pan * 0.3) * 0.015));
  c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
  c.fillStyle = '#1d1748';
  c.beginPath(); c.moveTo(0, H);
  for (let x = 0; x <= W; x += 40) c.lineTo(x, fy + 10 * Math.sin((x + pan) * 0.007 + seed) - 30 * Math.max(0, Math.sin((x + pan) * 0.0025 + seed * 2)));
  c.lineTo(W, H); c.closePath(); c.fill();
  // coral heads and fans in dusk colours
  for (let i = 0; i < 12; i++) {
    const x = ((h01(i, seed, 1) * (W + 400) - pan) % (W + 400) + W + 400) % (W + 400) - 200, y = fy + 10 + 30 * h01(i, seed, 2), s = 40 + 60 * h01(i, seed, 3);
    const col = ['#c85a7a', '#e07a5a', '#7a4ab0', '#d06aa0'][i % 4]!;
    if (i % 3 === 0) { // a fan
      c.strokeStyle = col; c.lineWidth = 3;
      for (let k = 0; k < 9; k++) { const a = -PI / 2 + (k - 4) * 0.18 + 0.03 * Math.sin(t + i); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a) * s * 0.6, y + Math.sin(a) * s * 0.6, x + Math.cos(a) * s * 1.3, y + Math.sin(a) * s * 1.3); c.stroke(); }
    } else { // a brain-coral mound
      c.fillStyle = col; c.beginPath(); c.ellipse(x, y, s, s * 0.6, 0, PI, TAU); c.fill();
      c.strokeStyle = 'rgba(40,20,60,0.35)'; c.lineWidth = 3;
      for (let k = 1; k < 4; k++) { c.beginPath(); c.ellipse(x, y, s * k / 4, s * 0.6 * k / 4, 0, PI, TAU); c.stroke(); }
    }
  }
}

/** The moray eel, lunging out of its hole at (x, y) towards `ang`: `out` 0..1 how far, `jaw` 0..1 how open. */
export function moray(c: C2, x: number, y: number, s: number, ang: number, out: number, jaw: number, t: number) {
  const n = 22, L = 420 * s * clamp(out);
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, d = L * u - 60 * s, wig = Math.sin(u * 6 - t * 8) * 18 * s * (1 - u) * clamp(out * 2);
    pts.push([x + Math.cos(ang) * d - Math.sin(ang) * wig, y + Math.sin(ang) * d + Math.cos(ang) * wig]);
  }
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = '#4a5a2a'; c.lineWidth = 46 * s;
  c.beginPath(); pts.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py))); c.stroke();
  c.strokeStyle = '#6b7d34'; c.lineWidth = 34 * s; c.stroke();
  c.fillStyle = 'rgba(40,50,20,0.6)';   // spots
  for (let i = 2; i < n; i += 2) { const [px, py] = pts[i]!; c.beginPath(); c.arc(px + 6 * s, py - 5 * s, 5 * s, 0, TAU); c.fill(); }
  // the head with its jaws
  const [hx, hy] = pts[n]!, ha = Math.atan2(hy - pts[n - 2]![1], hx - pts[n - 2]![0]);
  c.translate(hx, hy); c.rotate(ha);
  const j = clamp(jaw) * 0.55;
  c.fillStyle = '#6b7d34';
  c.save(); c.rotate(-j); c.beginPath(); c.moveTo(-10 * s, -20 * s); c.quadraticCurveTo(40 * s, -26 * s, 70 * s, -4 * s); c.lineTo(-10 * s, 4 * s); c.closePath(); c.fill();
  c.fillStyle = '#f4f1ea'; for (let k = 0; k < 6; k++) { const tx = 4 * s + k * 10 * s; c.beginPath(); c.moveTo(tx, -1 * s); c.lineTo(tx + 4 * s, 9 * s); c.lineTo(tx + 8 * s, -2 * s); c.fill(); }
  c.fillStyle = '#ffe14a'; c.beginPath(); c.arc(28 * s, -14 * s, 6 * s, 0, TAU); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.arc(30 * s, -14 * s, 3 * s, 0, TAU); c.fill();
  c.restore();
  c.save(); c.rotate(j); c.fillStyle = '#5c6b2c'; c.beginPath(); c.moveTo(-10 * s, -2 * s); c.lineTo(62 * s, 2 * s); c.quadraticCurveTo(30 * s, 18 * s, -10 * s, 16 * s); c.closePath(); c.fill();
  c.fillStyle = '#f4f1ea'; for (let k = 0; k < 5; k++) { const tx = 6 * s + k * 11 * s; c.beginPath(); c.moveTo(tx, 3 * s); c.lineTo(tx + 4 * s, -7 * s); c.lineTo(tx + 8 * s, 3 * s); c.fill(); }
  c.restore();
  c.restore();
}

/** A rock with a dark hole (the moray's home), at (x, y) radius r. */
export function rockHole(c: C2, x: number, y: number, r: number) {
  c.fillStyle = '#3a2d5a';
  c.beginPath(); for (let k = 0; k <= 16; k++) { const a = (k / 16) * TAU, rr = r * (0.85 + 0.2 * h01(k, 101)); k ? c.lineTo(x + Math.cos(a) * rr * 1.3, y + Math.sin(a) * rr) : c.moveTo(x + Math.cos(a) * rr * 1.3, y + Math.sin(a) * rr); } c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,170,130,0.18)'; c.beginPath(); c.ellipse(x - r * 0.3, y - r * 0.5, r * 0.9, r * 0.35, -0.2, 0, TAU); c.fill();
  c.fillStyle = '#0a0716'; c.beginPath(); c.ellipse(x + r * 0.35, y + r * 0.05, r * 0.42, r * 0.34, 0.2, 0, TAU); c.fill();
}

/** Razor coral: sharp blades and spikes rising from (x, y), height h, in the dusk's coral and violet. */
export function razorCoral(c: C2, x: number, y: number, h: number, seed: number, t: number, col = '#d0506a', dark = '#5a2050') {
  c.save();
  for (let i = 0; i < 11; i++) {
    const a = -PI / 2 + (h01(i, seed, 1) - 0.5) * 1.5, l = h * (0.45 + 0.6 * h01(i, seed, 2)), w = h * (0.06 + 0.05 * h01(i, seed, 3));
    const bx = x + (h01(i, seed, 4) - 0.5) * h * 0.9, sway = 0.02 * Math.sin(t + i);
    const tx = bx + Math.cos(a + sway) * l, ty = y + Math.sin(a + sway) * l;
    c.fillStyle = i % 2 ? col : dark;
    c.beginPath(); c.moveTo(bx - w, y); c.lineTo(tx, ty); c.lineTo(bx + w, y); c.closePath(); c.fill();
    // side spikes
    for (let k = 1; k < 4; k++) {
      const u = k / 4, px = bx + (tx - bx) * u, py = y + (ty - y) * u, s = (k % 2 ? 1 : -1);
      c.beginPath(); c.moveTo(px - w * (1 - u) * 0.5, py); c.lineTo(px + s * w * 2.4 * (1 - u * 0.5), py - w * 1.6); c.lineTo(px + w * (1 - u) * 0.5, py - w * 0.4); c.closePath(); c.fill();
    }
  }
  c.restore();
}

/** One of her hands, gripping a ledge at (x, y): a silhouette palm with four fingers curled over the edge, the arm going `ang`. */
export function hand(c: C2, x: number, y: number, s: number, ang: number, grip: number, col = '#0d0a18', rim = 'rgba(255,190,140,0.7)') {
  c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
  c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round';
  // the forearm, off down the angle
  c.lineWidth = 46; c.beginPath(); c.moveTo(0, 40); c.lineTo(0, 400); c.stroke();
  // the palm
  c.beginPath(); c.ellipse(0, 10, 34, 44, 0, 0, TAU); c.fill();
  // fingers curled over the ledge
  c.lineWidth = 17;
  for (let k = 0; k < 4; k++) {
    const fx = -24 + k * 16, l1 = 30 - Math.abs(k - 1.5) * 4;
    c.beginPath(); c.moveTo(fx, -20); c.lineTo(fx, -20 - l1); c.lineTo(fx + 2, -20 - l1 - 14 * (1 - grip) + 16 * grip); c.stroke();
  }
  c.lineWidth = 16; c.beginPath(); c.moveTo(30, 18); c.lineTo(46, -6); c.stroke();   // the thumb
  c.strokeStyle = rim; c.lineWidth = 3;
  c.beginPath(); c.moveTo(-34, 30); c.lineTo(-34, 10); c.lineTo(-30, -50); c.stroke();
  c.restore();
}

/** Her dive watch at (x, y) on a wrist going `ang`: a chunky bezel, an LCD counting the breath held, in seconds. */
export function diveWatch(c: C2, g: C2, x: number, y: number, s: number, ang: number, secs: number, beep: number, t: number) {
  c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
  // the wrist and the strap
  c.fillStyle = '#0d0a18'; c.fillRect(-150, -520, 300, 1100);
  c.fillStyle = '#26232e'; c.beginPath(); c.roundRect(-170, -130, 340, 260, 30); c.fill();
  c.strokeStyle = 'rgba(255,190,140,0.5)'; c.lineWidth = 4; c.beginPath(); c.moveTo(-150, -520); c.lineTo(-150, 560); c.stroke();
  for (let k = -3; k <= 3; k++) { c.fillStyle = '#1a1820'; c.fillRect(-170, k * 120 - 6, 340, 4); }
  // the case and bezel
  c.fillStyle = '#ff8a2a'; c.beginPath(); c.arc(0, 0, 200, 0, TAU); c.fill();
  c.fillStyle = '#2a2730';
  for (let k = 0; k < 60; k++) { const a = (k / 60) * TAU, r0 = k % 5 ? 182 : 168; c.save(); c.rotate(a); c.fillRect(-2.5, -196, 5, 196 - r0); c.restore(); }
  c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(0, -194); c.lineTo(-14, -172); c.lineTo(14, -172); c.closePath(); c.fill();
  c.fillStyle = '#16141c'; c.beginPath(); c.arc(0, 0, 162, 0, TAU); c.fill();
  // the LCD
  const lit = 0.75 + 0.25 * clamp(beep);
  c.fillStyle = `rgba(150,220,180,${lit})`; c.beginPath(); c.roundRect(-128, -84, 256, 168, 18); c.fill();
  c.fillStyle = 'rgba(20,40,30,0.9)'; c.font = font(FAM.monoB(), 26); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('BREATH', 0, -58);
  const m = Math.floor(secs / 60), sc = Math.floor(secs % 60);
  c.font = font(FAM.monoB(), 104); c.fillText(`${m}:${String(sc).padStart(2, '0')}`, 0, 16);
  c.font = font(FAM.monoB(), 22); c.fillText('DIVE  ▲', 0, 66);
  // the glass's reflection
  c.fillStyle = 'rgba(255,255,255,0.12)'; c.beginPath(); c.ellipse(-60, -90, 90, 30, -0.5, 0, TAU); c.fill();
  c.restore();
  if (beep > 0) { // the beep: a ring of light
    g.save(); g.strokeStyle = rgbaHex('#b8ffd6', 0.6 * beep); g.lineWidth = 10;
    g.beginPath(); g.arc(x, y, 220 * s * (1.1 + (1 - beep) * 0.6), 0, TAU); g.stroke(); g.restore();
  }
  void t;
}

// ------------------------------------------------------------------ the anchor, the coin, the pendant

/** An old admiralty anchor, rusted, its crown buried at (x, y): shank, stock and ring up, arms and flukes in the silt. */
export function anchor(c: C2, x: number, y: number, s: number, rot: number) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.lineCap = 'round';
  const body = (col: string, w: number) => {
    c.strokeStyle = col; c.fillStyle = col;
    c.lineWidth = 34 * w; c.beginPath(); c.moveTo(0, 20); c.lineTo(0, -380); c.stroke();
    c.lineWidth = 30 * w; c.beginPath(); c.arc(0, -40, 150, 0.12 * PI, 0.88 * PI); c.stroke();
    for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 148, 4); c.lineTo(sd * 200, -70); c.lineTo(sd * 118, -30); c.closePath(); c.fill(); }
    c.lineWidth = 26 * w; c.beginPath(); c.moveTo(-160, -330); c.lineTo(160, -340); c.stroke();
    c.lineWidth = 16 * w; c.beginPath(); c.arc(0, -410, 34, 0, TAU); c.stroke();
  };
  body('#2a140c', 1.25);   // a dark outline
  body('#7a3a1e', 1);
  // the lit edge (from above) and the rust blooms
  c.strokeStyle = 'rgba(232,140,74,0.7)'; c.lineWidth = 7;
  c.beginPath(); c.moveTo(-12, 0); c.lineTo(-12, -370); c.stroke();
  c.beginPath(); c.arc(0, -40, 162, 0.2 * PI, 0.8 * PI); c.stroke();
  c.beginPath(); c.moveTo(-160, -342); c.lineTo(160, -352); c.stroke();
  for (let i = 0; i < 10; i++) { const py = -40 - 320 * h01(i, 114); c.fillStyle = 'rgba(190,96,44,0.8)'; c.beginPath(); c.arc((h01(i, 115) - 0.5) * 24, py, 6 + 8 * h01(i, 116), 0, TAU); c.fill(); }
  for (let i = 0; i < 14; i++) { const py = -40 - 300 * h01(i, 111), px = (h01(i, 112) - 0.5) * 20; c.fillStyle = 'rgba(215,210,190,0.85)'; c.beginPath(); c.arc(px, py, 4 + 4 * h01(i, 113), 0, TAU); c.fill(); }
  c.restore();
}

/** A gold coin half in the silt at (x, y), radius r, glinting. */
export function goldCoin(c: C2, g: C2, x: number, y: number, r: number, t: number, glint = 1) {
  c.save();
  c.fillStyle = '#a8761c'; c.beginPath(); c.ellipse(x + r * 0.08, y + r * 0.06, r, r * 0.42, -0.2, 0, TAU); c.fill();
  const cg = c.createLinearGradient(x - r, y - r, x + r, y + r);
  cg.addColorStop(0, '#fff2a8'); cg.addColorStop(0.45, '#f6c453'); cg.addColorStop(1, '#c08a24');
  c.fillStyle = cg; c.beginPath(); c.ellipse(x, y, r, r * 0.42, -0.2, 0, TAU); c.fill();
  c.strokeStyle = '#b07a1c'; c.lineWidth = r * 0.06; c.beginPath(); c.ellipse(x, y, r * 0.8, r * 0.33, -0.2, 0, TAU); c.stroke();
  c.fillStyle = '#c08a24'; c.font = font(FAM.serifB(), r * 0.5); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.save(); c.translate(x, y); c.scale(1, 0.42); c.rotate(-0.2); c.fillText('£', 0, 0); c.restore();
  // the silt over its lower edge
  c.fillStyle = '#2a3f33'; c.beginPath(); c.ellipse(x - r * 0.2, y + r * 0.42, r * 1.3, r * 0.22, 0, 0, TAU); c.fill();
  c.restore();
  if (glint > 0) {
    const tw = 0.6 + 0.4 * Math.sin(t * 11);
    star4(c, x + r * 0.45, y - r * 0.2, r * 0.5 * tw * glint, '#ffffff');
    star4(c, x - r * 0.5, y + r * 0.05, r * 0.25 * (1 - tw * 0.5) * glint, '#fff6c8');
    const gg = g.createRadialGradient(x, y, 0, x, y, r * 2.2);
    gg.addColorStop(0, rgbaHex('#ffd970', 0.5 * glint)); gg.addColorStop(1, rgbaHex('#ffd970', 0));
    g.fillStyle = gg; g.fillRect(x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4);
  }
}

/** The pebble pendant: a little holed stone (a chip of Rai's own barnacled limestone) on a cord, at (x, y). */
export function pebble(c: C2, g: C2, x: number, y: number, r: number, glow = 0, cord?: { x: number; y: number }[]) {
  if (cord && cord.length > 1) {
    c.strokeStyle = '#c9a24a'; c.lineWidth = Math.max(1.2, r * 0.12); c.lineCap = 'round';
    c.beginPath(); cord.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y))); c.stroke();
  }
  c.fillStyle = '#d9cfb8'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.arc(x, y - r * 0.05, r * 0.36, 0, TAU, true); c.fill('evenodd');
  c.strokeStyle = '#8f8676'; c.lineWidth = Math.max(1, r * 0.08); c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
  c.fillStyle = 'rgba(125,115,95,0.5)'; for (let i = 0; i < 6; i++) { const a = h01(i, 121) * TAU, d = r * (0.55 + 0.35 * h01(i, 122)); c.beginPath(); c.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, r * 0.07, 0, TAU); c.fill(); }
  c.fillStyle = '#e4dccb'; c.beginPath(); c.arc(x + r * 0.62, y - r * 0.5, r * 0.18, 0, TAU); c.fill();   // a barnacle of hers
  c.fillStyle = '#4f473b'; c.beginPath(); c.arc(x + r * 0.62, y - r * 0.5, r * 0.07, 0, TAU); c.fill();
  if (glow > 0) {
    const gg = g.createRadialGradient(x, y, 0, x, y, r * 3);
    gg.addColorStop(0, rgbaHex('#ff4f9a', 0.6 * glow)); gg.addColorStop(1, rgbaHex('#ff4f9a', 0));
    g.fillStyle = gg; g.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
  }
}

/** A sound ring (a dull tap is one grey ring that dies fast; a ring that sings is several, bright). */
export function soundRing(c: C2, x: number, y: number, r: number, u: number, col: string, n = 1) {
  if (u <= 0 || u >= 1) return;
  c.save(); c.strokeStyle = col; c.lineCap = 'round';
  for (let k = 0; k < n; k++) {
    const v = clamp(u * 1.4 - k * 0.2); if (v <= 0 || v >= 1) continue;
    c.globalAlpha = (1 - v) * 0.9; c.lineWidth = 4 * (1 - v) + 1;
    c.beginPath(); c.ellipse(x, y, r * (0.4 + v), r * (0.4 + v) * 0.4, 0, 0, TAU); c.stroke();
  }
  c.restore();
}
