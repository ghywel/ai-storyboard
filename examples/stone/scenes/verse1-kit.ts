// verse1's own kit (also used by pre1.ts): the beat-snapped cut, the pop-up page (paper layers folding up with a hard
// cut-paper shadow, the page's gutter and grain), the working silhouettes of the legend (carvers with shell adzes,
// paddlers whose bodies pull on the beat, outrigger canoes, a bamboo raft), weather (clouds, rain, lightning, paper
// waves), small props (chips, hibiscus, sparkles, speech bubbles, a scroll), the TWIST ribbon word, and the centred
// kinetic caption of the rapped lines with its band.
import { W, H } from '../engine/gl';
import { HEX } from '../engine/palette';
import { font } from '../engine/type';
import type { AudioData } from '../engine/audio';
import type { Line, Word } from '../engine/lyrics';
import { clamp, ease, lerp } from '../engine/util';
import { h01 } from './_rai';
import { FAM, TAU, type C2, person, rgbaHex } from './_motifs';

// ------------------------------------------------------------------ the beat grid

/**
 * The cut for a word: on the beat at or before it; when the word is sung a hair before a beat (within `snap` s, the
 * rapper pushing the beat), the cut moves up to the word's own start so the word lands in its shot.
 */
export function cutFor(au: AudioData, w: Word, snap = 0.07): number {
  const b = au.beatAt(w.start + 0.02);
  const next = au.timeOfBeat(Math.ceil(au.beatAt(w.start)));
  if (next > w.start && next - w.start < snap) return w.start - 0.01;
  return au.timeOfBeat(Math.floor(b));
}

/** The word of a line matching re (lowercase), nth match. */
export function wordOf(line: Line, re: RegExp, nth = 0): Word {
  return line.words.filter((w) => re.test(w.w.toLowerCase()))[nth] ?? line.words[0]!;
}

/** The beat phase 0..1 of t on the grid (0 on the beat), offset by `off` beats. */
export const beatPh = (au: AudioData, t: number, off = 0) => { const b = au.beatAt(t) + off; return b - Math.floor(b); };

// ------------------------------------------------------------------ the pop-up page

/** Pop-up hinge: 0 (flat on the page) .. 1 (standing), overshooting, from t0, staggered by i. */
export function popK(t: number, t0: number, i = 0, dur = 0.26): number {
  const u = clamp((t - t0 - 0.05 * i) / dur);
  return u <= 0 ? 0 : ease.outBack(u, 2.0);
}

/** Draw `fn` as a paper layer folded up from the hinge line baseY by k (0..1+), with a hard cut-paper shadow. */
export function layer(c: C2, k: number, baseY: number, fn: () => void, shadow = 0.45) {
  if (k <= 0.002) return;
  c.save();
  c.translate(0, baseY); c.scale(1, k); c.translate(0, -baseY);
  if (shadow > 0) { c.shadowColor = `rgba(6,3,14,${shadow})`; c.shadowOffsetX = 9; c.shadowOffsetY = 7; c.shadowBlur = 0; }
  fn();
  c.restore();
}

/**
 * Camera: zoom z about the frame centre, looking at (cx, cy), rolled by rot. The frame never shows past the scene's
 * edges: a roll raises the zoom just enough to cover the corners, and the look point is clamped.
 */
export function cam(c: C2, z: number, cx = W / 2, cy = H / 2, rot = 0) {
  const zz = Math.max(z, 1, Math.cos(rot) + (W / H) * Math.abs(Math.sin(rot)));
  const hx = W / (2 * zz), hy = H / (2 * zz);
  cx = Math.min(W - hx, Math.max(hx, cx)); cy = Math.min(H - hy, Math.max(hy, cy));
  c.translate(W / 2, H / 2); c.rotate(rot); c.scale(zz, zz); c.translate(-cx, -cy);
}

/** The storybook page over a legend shot: paper grain, the gutter's shadow at the left, a deckled edge. */
export function paperPage(c: C2, t: number, tint = 'rgba(255,240,210,0.07)') {
  c.fillStyle = tint; c.fillRect(0, 0, W, H);
  // grain: fine fibres
  c.strokeStyle = 'rgba(80,50,30,0.07)'; c.lineWidth = 1.2;
  c.beginPath();
  for (let i = 0; i < 90; i++) { const x = h01(i, 801) * W, y = h01(i, 802) * H, a = h01(i, 803) * TAU; c.moveTo(x, y); c.lineTo(x + Math.cos(a) * 26, y + Math.sin(a) * 26); }
  c.stroke();
  // the gutter: the book's spine at the left edge
  const g = c.createLinearGradient(0, 0, 90, 0);
  g.addColorStop(0, 'rgba(20,10,5,0.4)'); g.addColorStop(0.4, 'rgba(20,10,5,0.12)'); g.addColorStop(1, 'rgba(20,10,5,0)');
  c.fillStyle = g; c.fillRect(0, 0, 90, H);
  void t;
}

/** Print dots: a light halftone wash so flat colour reads as print. */
export function print(c: C2, col: string, step = 22) {
  c.fillStyle = col;
  c.beginPath();
  let row = 0;
  for (let y = 0; y < H + step; y += step * 0.866, row++) {
    for (let x = row % 2 ? step / 2 : 0; x < W + step; x += step) { const r = step * 0.16; c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); }
  }
  c.fill();
}

// ------------------------------------------------------------------ skies, seas, weather

/** A dawn or dusk sky: rays from the sun at the horizon, darkening upward, and the sun's disc. */
export function sky(c: C2, t: number, sx: number, sy: number, top: string, rayA: string, rayB: string, sun: string, sunR = 110, spin = 0.05) {
  const R = Math.hypot(W, H) * 1.3;
  c.fillStyle = rayB; c.fillRect(-W, -H, 3 * W, 3 * H);
  c.beginPath();
  for (let k = 0; k < 18; k++) {
    const a0 = (k / 18) * TAU + t * spin, a1 = a0 + Math.PI / 18;
    c.moveTo(sx, sy); c.lineTo(sx + R * Math.cos(a0), sy + R * Math.sin(a0)); c.lineTo(sx + R * Math.cos(a1), sy + R * Math.sin(a1)); c.closePath();
  }
  c.fillStyle = rayA; c.fill();
  const g = c.createLinearGradient(0, -H * 0.2, 0, sy);
  g.addColorStop(0, top); g.addColorStop(1, rgbaHex(top, 0));
  c.fillStyle = g; c.fillRect(-W, -H, 3 * W, sy + H);
  c.save(); c.shadowColor = sun; c.shadowBlur = 60;
  c.fillStyle = sun; c.beginPath(); c.arc(sx, sy, sunR, 0, TAU); c.fill(); c.restore();
}

/** Scalloped paper waves: strips from y0 to the bottom, back to front, cols[i] each, rocking with t. */
export function waves(c: C2, t: number, y0: number, cols: string[], amp = 18, o: { y1?: number; speed?: number; lambda?: number; shadow?: boolean; x0?: number; x1?: number; crest?: string } = {}) {
  const n = cols.length, y1 = o.y1 ?? H + 40, sp = o.speed ?? 1, lam = o.lambda ?? 180, x0 = o.x0 ?? -W, x1 = o.x1 ?? 2 * W;
  for (let i = 0; i < n; i++) {
    const u = n > 1 ? i / (n - 1) : 1, y = y0 + (y1 - y0 - 60) * u * 0.85, a = amp * (0.6 + 0.8 * u);
    const ph = t * sp * (1 + 0.3 * i) * (i % 2 ? 1 : -1) + i * 1.9;
    c.save();
    if (o.shadow !== false) { c.shadowColor = 'rgba(6,3,14,0.45)'; c.shadowOffsetY = -6; c.shadowOffsetX = 0; }
    c.beginPath();
    c.moveTo(x0, y1 + 400);
    for (let x = x0; x <= x1; x += lam / 2) {
      const k = Math.round((x - x0) / (lam / 2));
      const yy = y + Math.sin(ph + k * 0.9) * a * 0.4;
      c.lineTo(x, yy);
      c.quadraticCurveTo(x + lam / 4, yy - a, x + lam / 2, y + Math.sin(ph + (k + 1) * 0.9) * a * 0.4);
    }
    c.lineTo(x1, y1 + 400); c.closePath();
    c.fillStyle = cols[i]!; c.fill();
    c.restore();
    if (o.crest) { // foam on the crests
      c.strokeStyle = o.crest; c.lineWidth = 3;
      c.beginPath();
      for (let x = Math.max(x0, -60); x <= Math.min(x1, W + 60); x += lam / 2) {
        const k = Math.round((x - x0) / (lam / 2)), yy = y + Math.sin(ph + k * 0.9) * a * 0.4;
        c.moveTo(x + lam * 0.12, yy - a * 0.55); c.quadraticCurveTo(x + lam / 4, yy - a * 0.98, x + lam * 0.38, yy - a * 0.55);
      }
      c.stroke();
    }
  }
}

/** Storm clouds hanging from the top edge (popped down by k). */
export function clouds(c: C2, t: number, k: number, col: string, y = 0, seed = 5, rim?: string) {
  layer(c, k, y - 10, () => {
    c.fillStyle = col; c.beginPath();
    for (let i = 0; i < 14; i++) {
      const x = -60 + i * 150 + 30 * Math.sin(t * 0.7 + i), r = 110 + 70 * h01(i, seed);
      const cy = y + 60 + 80 * h01(i, seed, 1);
      c.moveTo(x + r, cy); c.arc(x, cy, r, 0, TAU);
    }
    c.rect(-80, y - 200, W + 160, 260);
    c.fill();
    if (rim) {
      c.save(); c.shadowColor = 'transparent'; c.strokeStyle = rim; c.lineWidth = 4;
      for (let i = 0; i < 14; i++) { const x = -60 + i * 150 + 30 * Math.sin(t * 0.7 + i), r = 110 + 70 * h01(i, seed), cy = y + 60 + 80 * h01(i, seed, 1); c.beginPath(); c.arc(x, cy, r, 0.3, 2.6); c.stroke(); }
      c.restore();
    }
  });
}

/** A lightning bolt (glow layer), seeded. */
export function bolt(g: C2, x0: number, y0: number, x1: number, y1: number, seed: number, a = 1) {
  if (a <= 0.01) return;
  g.save(); g.lineJoin = 'miter';
  const pts: [number, number][] = [[x0, y0]];
  for (let i = 1; i <= 9; i++) { const u = i / 9; pts.push([x0 + (x1 - x0) * u + (i < 9 ? 90 * (h01(i, seed) - 0.5) : 0), y0 + (y1 - y0) * u]); }
  for (const [w, col] of [[16, `rgba(198,92,240,${0.5 * a})`], [7, `rgba(255,247,214,${a})`], [3, `rgba(255,255,255,${a})`]] as const) {
    g.strokeStyle = col; g.lineWidth = w; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
  }
  // a fork
  const m = pts[4]!;
  g.strokeStyle = `rgba(255,247,214,${a * 0.8})`; g.lineWidth = 4; g.beginPath(); g.moveTo(m[0], m[1]);
  g.lineTo(m[0] + 70, m[1] + 60); g.lineTo(m[0] + 40, m[1] + 140); g.lineTo(m[0] + 110, m[1] + 210); g.stroke();
  g.restore();
}

/** Diagonal rain streaks. */
export function rain(c: C2, t: number, col: string, n = 140, slant = 0.35, speed = 1) {
  c.strokeStyle = col; c.lineWidth = 2;
  c.beginPath();
  for (let i = 0; i < n; i++) {
    const x = ((h01(i, 31) * 1.4 - 0.2) * W + t * 900 * slant * speed) % (W * 1.3) - W * 0.1;
    const y = ((h01(i, 32) + t * speed * (1.8 + h01(i, 33))) % 1.1) * H - 60;
    c.moveTo(x, y); c.lineTo(x - 26 * slant, y + 60);
  }
  c.stroke();
}

// ------------------------------------------------------------------ the people of the legend, working

/** An islander with a shell adze (silhouette), striking on every beat (au's grid): feet at (x, y). */
export function carver(c: C2, au: AudioData, t: number, x: number, y: number, h: number, col: string, flip = false, off = 0) {
  person(c, x, y, h, 'carry', { col, flip, t, seed: x });
  const ph = beatPh(au, t, off);
  // raised (back) through the beat, a fast strike at the beat
  const a = ph < 0.12 ? -0.9 + 2.1 * ease.outQuad(ph / 0.12) : 1.2 - 2.1 * ease.inOutQuad((ph - 0.12) / 0.88);
  const u = h / 100;
  c.save(); c.translate(x, y - 88 * u); if (flip) c.scale(-1, 1); c.rotate(a);
  c.strokeStyle = col; c.lineWidth = 4.5 * u; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -38 * u); c.stroke();
  // the shell blade, pale
  c.fillStyle = '#efe2c8'; c.beginPath(); c.moveTo(-2 * u, -40 * u); c.quadraticCurveTo(10 * u, -46 * u, 18 * u, -36 * u); c.lineTo(14 * u, -27 * u); c.lineTo(-2 * u, -31 * u); c.closePath(); c.fill();
  c.restore();
}

/** Chips flying from (x, y) after each beat (deterministic in t). */
export function chips(c: C2, au: AudioData, t: number, x: number, y: number, col: string, n = 8, dir = 1, off = 0) {
  const b = Math.floor(au.beatAt(t) + off), age = t - au.timeOfBeat(b - off);
  if (age < 0 || age > 0.5) return;
  c.fillStyle = col;
  for (let i = 0; i < n; i++) {
    const vx = dir * (120 + 380 * h01(i, b, 1)), vy = -(200 + 420 * h01(i, b, 2));
    const px = x + vx * age, py = y + vy * age + 1400 * age * age, s = 3 + 7 * h01(i, b, 3);
    c.save(); c.translate(px, py); c.rotate(age * 12 * (h01(i, b, 4) - 0.5));
    c.fillRect(-s / 2, -s / 2, s, s * 0.7); c.restore();
  }
}

/**
 * A paddler seated in a canoe (silhouette), feet/hips at (x, y), facing +x: the body leans into the catch and pulls
 * back through the stroke, the paddle's blade dipping in the water and lifting out. `ph` 0..1 (0 = the catch).
 */
export function paddler(c: C2, x: number, y: number, h: number, ph: number, col: string, flip = false) {
  const u = h / 100, pull = ph < 0.5, q = pull ? ph / 0.5 : (ph - 0.5) / 0.5;
  const lean = pull ? lerp(0.4, -0.18, ease.inOutQuad(q)) : lerp(-0.18, 0.4, ease.inOutQuad(q));
  c.save(); c.translate(x, y); if (flip) c.scale(-1, 1);
  c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round';
  const shx = Math.sin(lean) * 34 * u, shy = -Math.cos(lean) * 34 * u;
  // torso and head
  c.lineWidth = 15 * u; c.beginPath(); c.moveTo(0, -4 * u); c.lineTo(shx, shy); c.stroke();
  c.beginPath(); c.arc(shx + Math.sin(lean) * 13 * u, shy - Math.cos(lean) * 13 * u, 8.5 * u, 0, TAU); c.fill();
  // the paddle: blade forward and deep through the pull, back and up through the recovery
  const bx = pull ? lerp(44, -16, q) * u : lerp(-16, 44, q) * u, by = pull ? 40 * u : lerp(30, 14, Math.sin(q * Math.PI)) * u;
  const gx = shx + bx * 0.2 - 2 * u, gy = shy - 22 * u;
  const hx = gx + (bx - gx) * 0.5, hy = gy + (by - gy) * 0.5;
  c.lineWidth = 3.4 * u; c.beginPath(); c.moveTo(gx, gy); c.lineTo(bx, by); c.stroke();
  c.beginPath(); c.ellipse(bx, by, 4 * u, 10 * u, Math.atan2(by - gy, bx - gx) - Math.PI / 2, 0, TAU); c.fill();
  c.lineWidth = 6 * u;
  c.beginPath(); c.moveTo(shx, shy + 2 * u); c.lineTo(gx, gy); c.stroke();
  c.beginPath(); c.moveTo(shx, shy + 4 * u); c.lineTo(hx, hy); c.stroke();
  c.restore();
}

/** An outrigger canoe (side view, silhouette): hull from x - w/2 to x + w/2 at waterline y, the float behind it. */
export function canoe(c: C2, x: number, y: number, w: number, col: string, flip = false) {
  c.save(); c.translate(x, y); if (flip) c.scale(-1, 1);
  c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round';
  // the outrigger: a thin float behind, joined by two booms
  c.lineWidth = w * 0.01;
  for (const d of [-0.22, 0.18]) { c.beginPath(); c.moveTo(d * w, -w * 0.035); c.lineTo(d * w + w * 0.05, -w * 0.06); c.stroke(); }
  c.save(); c.globalAlpha *= 0.75; c.beginPath(); c.ellipse(0.03 * w, -w * 0.055, w * 0.26, w * 0.014, 0, 0, TAU); c.fill(); c.restore();
  // the hull, its ends swept up
  c.beginPath();
  c.moveTo(-w / 2, -w * 0.09); c.quadraticCurveTo(-w * 0.42, w * 0.02, -w * 0.25, w * 0.035);
  c.lineTo(w * 0.25, w * 0.035); c.quadraticCurveTo(w * 0.42, w * 0.02, w / 2, -w * 0.09);
  c.quadraticCurveTo(w * 0.36, -w * 0.035, w * 0.25, -w * 0.03); c.lineTo(-w * 0.25, -w * 0.03); c.quadraticCurveTo(-w * 0.36, -w * 0.035, -w / 2, -w * 0.09);
  c.closePath(); c.fill();
  c.restore();
}

/** A bamboo raft in side view: lashed poles, its deck line at (x, y), width w. */
export function raft(c: C2, x: number, y: number, w: number, col: string, tilt = 0, lash = '#c9a36b') {
  c.save(); c.translate(x, y); c.rotate(tilt);
  c.fillStyle = col;
  c.beginPath(); c.roundRect(-w / 2, 0, w, w * 0.06, w * 0.03); c.fill();
  for (let i = 0; i < 11; i++) { c.beginPath(); c.arc(-w / 2 + (i + 0.5) * (w / 11), w * 0.06, w * 0.03, 0, TAU); c.fill(); }
  c.strokeStyle = lash; c.lineWidth = Math.max(2, w * 0.008);
  for (const d of [-0.36, 0, 0.36]) { c.beginPath(); c.moveTo(d * w - w * 0.015, -1); c.lineTo(d * w + w * 0.015, w * 0.07); c.moveTo(d * w + w * 0.015, -1); c.lineTo(d * w - w * 0.015, w * 0.07); c.stroke(); }
  c.restore();
}

// ------------------------------------------------------------------ props

/** A hibiscus (five petals). */
export function hibiscus(c: C2, x: number, y: number, r: number, col: string, rot = 0) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.fillStyle = col;
  for (let k = 0; k < 5; k++) { c.save(); c.rotate((k / 5) * TAU); c.beginPath(); c.ellipse(0, -r * 0.55, r * 0.38, r * 0.55, 0, 0, TAU); c.fill(); c.restore(); }
  c.fillStyle = HEX.yellow; c.beginPath(); c.arc(0, 0, r * 0.18, 0, TAU); c.fill();
  c.restore();
}

/** A four-point sparkle (for the glow layer). */
export function sparkle(g: C2, x: number, y: number, r: number, col: string, a = 1) {
  if (a <= 0 || r <= 0) return;
  g.fillStyle = rgbaHex(col, a);
  g.beginPath();
  g.moveTo(x, y - r); g.quadraticCurveTo(x, y, x + r, y); g.quadraticCurveTo(x, y, x, y + r); g.quadraticCurveTo(x, y, x - r, y); g.quadraticCurveTo(x, y, x, y - r);
  g.fill();
}

/** A speech bubble with its tail pointing to (tx, ty). */
export function speech(c: C2, x: number, y: number, w: number, h: number, tx: number, ty: number, fill: string = HEX.bone, stroke?: string) {
  c.fillStyle = fill;
  c.beginPath(); c.roundRect(x, y, w, h, h * 0.3);
  c.moveTo(x + w * 0.2, y + h - 2); c.lineTo(tx, ty); c.lineTo(x + w * 0.36, y + h - 2);
  c.fill();
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = 5; c.stroke(); }
}

/** A word twisted like a ribbon: a twist runs along it once, letter by letter, then it settles readable. */
export function twisted(c: C2, text: string, x: number, y: number, size: number, t: number, t0: number, col: string, shadow: string) {
  if (t < t0 - 0.02) return;
  const age = t - t0, k = age < 0.22 ? 1 + 0.6 * (1 - ease.outBack(clamp(age / 0.22))) : 1;
  c.save();
  c.font = font(FAM.hook(), size); c.textAlign = 'center'; c.textBaseline = 'middle';
  const ws = [...text].map((ch) => c.measureText(ch).width), tw = ws.reduce((a, b) => a + b, 0);
  c.translate(x, y); c.scale(k, k); c.globalAlpha *= clamp(age / 0.05);
  let cx = -tw / 2;
  [...text].forEach((ch, i) => {
    const u = clamp((age - 0.06 * i) / 0.45), ph = TAU * (1 - ease.outCubic(u)) + 0.25 * Math.sin(age * 6 + i);
    const sx = Math.cos(ph), sy = 1 + 0.15 * Math.sin(ph);
    c.save(); c.translate(cx + ws[i]! / 2, 0); c.rotate(0.12 * Math.sin(i + age * 3)); c.scale(Math.max(0.08, Math.abs(sx)) * Math.sign(sx || 1), sy);
    c.fillStyle = shadow; c.fillText(ch, size * 0.06, size * 0.06);
    c.fillStyle = sx < 0 ? HEX.bone : col; c.fillText(ch, 0, 0);
    c.restore();
    cx += ws[i]!;
  });
  c.restore();
}

// ------------------------------------------------------------------ type: the caption, centred low

/** Break words (widths ws, space sp) into n rows (n <= 3) minimising the widest row. */
export function balance(ws: number[], sp: number, n: number): number[][] {
  const idx = ws.map((_, i) => i), m = ws.length;
  if (n <= 1 || m < 2) return [idx];
  const width = (a: number, b: number) => { let s = 0; for (let i = a; i < b; i++) s += ws[i]!; return s + sp * Math.max(0, b - a - 1); };
  let best: number[] = [], bestW = Infinity;
  if (n === 2 || m < 3) {
    for (let a = 1; a < m; a++) { const v = Math.max(width(0, a), width(a, m)); if (v < bestW) { bestW = v; best = [a]; } }
  } else {
    for (let a = 1; a < m - 1; a++) for (let b = a + 1; b < m; b++) { const v = Math.max(width(0, a), width(a, b), width(b, m)); if (v < bestW) { bestW = v; best = [a, b]; } }
  }
  const cuts = [0, ...best, m];
  return cuts.slice(0, -1).map((a, i) => idx.slice(a, cuts[i + 1]));
}

/** The size at which `text` fits maxW. */
export function fitSize(c: C2, text: string, size: number, maxW: number, fam = FAM.hook()): number {
  c.save(); c.font = font(fam, size); const w = c.measureText(text).width; c.restore();
  return w > maxW ? Math.floor(size * (maxW / w)) : size;
}

const keyOf = (w: Word) => w.w.toLowerCase().replace(/[‘’]/g, "'").replace(/[^a-z']/g, '');

/**
 * The rapped line, centred low (the "Other Agents" karaoke position): the whole line waits at 60 % (up to `lead` s
 * early), each word slams in at its sung start (an overshooting pop, full white, a hard ink shadow); accent words are
 * bigger and coloured. Rows balanced to `maxW`; `y` is the last row's baseline.
 */
export function caption(c: C2, line: Line, t: number, o: { size?: number; y?: number; accents?: string[]; accent?: string; col?: string; maxW?: number; until?: number; lead?: number } = {}) {
  const size = o.size ?? 50, lead = o.lead ?? 0.4, first = line.words[0]!.start;
  if (t < first - lead) return;
  const until = o.until ?? line.end + 0.3;
  if (t > until + 0.12) return;
  const fam = FAM.bold(), acc = line.words.map((w) => (o.accents ?? []).includes(keyOf(w)));
  c.save();
  c.globalAlpha *= clamp((t - (first - lead)) / 0.1) * (1 - clamp((t - until) / 0.12));
  c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  c.font = font(fam, size);
  const sp = c.measureText(' ').width;
  const ws = line.words.map((w, i) => { c.font = font(fam, acc[i] ? size * 1.16 : size); return c.measureText(w.w).width; });
  const maxW = o.maxW ?? W - 300, total = ws.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
  const rows = balance(ws, sp, Math.max(1, Math.ceil(total / maxW)));
  const lh = size * 1.22;
  let cy = (o.y ?? H - 104) - (rows.length - 1) * lh;
  for (const row of rows) {
    const rw = row.reduce((a, i) => a + ws[i]!, 0) + sp * (row.length - 1);
    let cx = W / 2 - rw / 2;
    for (const i of row) {
      const w = line.words[i]!, s = acc[i] ? size * 1.16 : size, age = t - w.start;
      c.font = font(fam, s);
      if (age < 0) {
        c.fillStyle = 'rgba(244,241,234,0.6)'; c.fillText(w.w, cx, cy);
      } else {
        const k = age < 0.14 ? 1 + 0.22 * (1 - ease.outBack(clamp(age / 0.14))) : 1;
        c.save();
        c.translate(cx + ws[i]! / 2, cy - s * 0.35); c.scale(k, k); c.translate(-ws[i]! / 2, s * 0.35);
        c.fillStyle = HEX.ink; c.fillText(w.w, s * 0.06, s * 0.06);
        c.fillStyle = acc[i] ? (o.accent ?? HEX.yellow) : (o.col ?? '#ffffff');
        c.fillText(w.w, 0, 0);
        c.restore();
      }
      cx += ws[i]! + sp;
    }
    cy += lh;
  }
  c.restore();
}

/** The dark band behind the caption. */
export function band(c: C2, a = 0.8, top = H - 270) {
  const g = c.createLinearGradient(0, top, 0, H);
  g.addColorStop(0, 'rgba(10,8,22,0)'); g.addColorStop(0.45, `rgba(10,8,22,${a * 0.78})`); g.addColorStop(1, `rgba(10,8,22,${a})`);
  c.fillStyle = g; c.fillRect(0, top, W, H - top);
}
