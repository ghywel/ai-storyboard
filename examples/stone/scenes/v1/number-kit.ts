// Helpers shared by v1's two production numbers (number1, number2) and the vote before them (TREATMENT-v1.md):
// cameras on the frozen set, the sung lines as lower thirds handed over cleanly, TV tags for what the spotlight
// finds, a picture-in-picture, the fish chorus line, the jellyfish lighters, the front row seen from behind, the
// woman's memory in the ring, and the host's stool. Canvas2D in the 1920x1080 logical frame, pure functions of t.
import { W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import { clamp, ease, lerp } from '../../engine/util';
import type { Line, Word } from '../../engine/lyrics';
import type { AudioData } from '../../engine/audio';
import { h01 } from '../_rai';
import { FAM, TAU, rgbaHex, mixHex } from '../_motifs';
import { fish } from '../_world';
import { cast } from './_cast';
import { lowerThird, withCam, scanlines, balancedRows, type Cam } from './_studio';

export type C2 = CanvasRenderingContext2D;

// ------------------------------------------------------------------ time

/** The beat at or before t: cuts land on it. */
export const beatCut = (au: AudioData, t: number) => au.timeOfBeat(Math.floor(au.beatAt(t + 0.02)));

const normW = (s: string) => s.toLowerCase().replace(/[^a-z']/g, '').replace(/^'+|'+$/g, '');
/** The nth word of a line that matches `w` exactly (normalised), else the line's first word. */
export function wordOf(line: Line, w: string, nth = 0): Word {
  return line.words.filter((x) => normW(x.w) === w)[nth] ?? line.words[0]!;
}

// ------------------------------------------------------------------ the camera

/** A camera that centres the set point (qx, qy) at zoom z. */
export const camOn = (qx: number, qy: number, zoom = 1, rot = 0): Cam => ({ x: qx - W / 2, y: qy - H / 2, zoom, rot });
export const camMix = (a: Cam, b: Cam, u: number): Cam => ({
  x: lerp(a.x ?? 0, b.x ?? 0, u), y: lerp(a.y ?? 0, b.y ?? 0, u),
  zoom: (a.zoom ?? 1) * Math.pow((b.zoom ?? 1) / (a.zoom ?? 1), u), rot: lerp(a.rot ?? 0, b.rot ?? 0, u),
});
/** Keep a camera inside a frame-sized backdrop (the audience's wall ends at the frame's edges). */
export function camClamp(cam: Cam, m = 0): Cam {
  const z = cam.zoom ?? 1, hw = W / (2 * z) + m, hh = H / (2 * z) + m;
  const cx = clamp(W / 2 + (cam.x ?? 0), hw, W - hw), cy = clamp(H / 2 + (cam.y ?? 0), hh, H - hh);
  return { ...cam, x: cx - W / 2, y: cy - H / 2 };
}
/** Where a set point lands on screen under `cam`. */
export function toScreen(cam: Cam, px: number, py: number) {
  const z = cam.zoom ?? 1, r = cam.rot ?? 0;
  const dx = (px - W / 2 - (cam.x ?? 0)) * z, dy = (py - H / 2 - (cam.y ?? 0)) * z;
  return { x: W / 2 + dx * Math.cos(r) - dy * Math.sin(r), y: H / 2 + dx * Math.sin(r) + dy * Math.cos(r), s: z };
}
/** Draw under one camera on both layers (the glow must move with the picture). */
export function shoot(c: C2, g: C2, cam: Cam, draw: () => void) {
  withCam(c, cam, () => withCam(g, cam, draw));
}

/** A glow layer that goes nowhere: for kit calls whose glows must not show (a house with its lights down). */
export const NULL_G = new OffscreenCanvas(4, 4).getContext('2d') as unknown as C2;

// ------------------------------------------------------------------ the lyric

/**
 * Which sung lines this plate shows as lower thirds, and until when: the lines whose first word falls in the plate's
 * window [start, end). Back-to-back lines hand over (the old plate fades from `until` as the next slides in 0.4 s
 * ahead of its first word, so two plates never sit on each other); the plate's last line stays to the cut, where the
 * next plate's first line takes over (a graphics change on a cut, as on TV).
 */
function bandLines(all: Line[], t: number, start: number, end: number): { l: Line; until: number }[] {
  const out: { l: Line; until: number }[] = [];
  for (let i = 0; i < all.length; i++) {
    const l = all[i]!, first = l.words[0]!.start;
    if (first < start - 0.1 || first >= end) continue;
    if (first > t + 0.5 || l.end < t - 2) continue;
    const next = all[i + 1], nf = next ? next.words[0]!.start : 1e9;
    const until = nf < end ? Math.min(l.end + 0.35, nf - 0.58) : l.end + 0.35;
    if (t < first - 0.4 || t > until + 0.2) continue;
    out.push({ l, until });
  }
  return out;
}

/** Every sung line of the plate as the show's lower third (see bandLines). */
export function lyricBand(c: C2, all: Line[], t: number, start: number, end: number) {
  for (const { l, until } of bandLines(all, t, start, end)) lowerThird(c, l, t, { until });
}

/**
 * Clear the glow layer under the lower third (the glow is added on top of the picture, so a spotlight's beam would
 * wash the lyric out): the plate's own slanted shape, as faded as the plate. Call before compositing the glow.
 */
export function plateMask(g: C2, all: Line[], t: number, start: number, end: number) {
  const size = 48, y = H - 112, lh = size * 1.2;
  for (const { l, until } of bandLines(all, t, start, end)) {
    const first = l.words[0]!.start;
    g.save();
    g.font = font(FAM.bold(), size);
    const sp = g.measureText(' ').width, ws = l.words.map((w) => g.measureText(w.w).width);
    const rows = balancedRows(g, l, W - 360);
    const rowWs = rows.map((r) => r.reduce((a, j) => a + ws[j]!, 0) + sp * (r.length - 1));
    const ph = rows.length * lh + 34, pw = Math.max(...rowWs) + 110;
    const inA = clamp((t - (first - 0.4)) / 0.18), outA = 1 - clamp((t - until) / 0.2);
    const slide = (1 - ease.outExpo(inA)) * 120;
    g.globalCompositeOperation = 'destination-out';
    g.globalAlpha = Math.min(inA * 2, 1) * outA;
    g.translate(W / 2 - slide, y); g.transform(1, 0, -0.18, 1, 0, 0);
    g.fillStyle = '#000'; g.beginPath(); g.roundRect(-pw / 2 - 40, -ph / 2 - 16, pw + 56, ph + 26, 10); g.fill();
    g.restore();
  }
}

// ------------------------------------------------------------------ TV graphics

/** A small chyron beside something the spotlight found: a leader line, a seat number and an invented fact. */
export function seatTag(c: C2, sx: number, sy: number, a: string, b: string, t: number, t0: number, t1: number, side = 1) {
  if (t < t0 || t > t1 + 0.2) return;
  const p = ease.outBack(clamp((t - t0) / 0.16)), fade = 1 - clamp((t - t1) / 0.2);
  c.save();
  c.globalAlpha *= clamp((t - t0) / 0.06) * fade;
  const tx = sx + side * 120, ty = sy - 96;
  c.strokeStyle = rgbaHex(HEX.gold, 0.9); c.lineWidth = 3;
  c.beginPath(); c.moveTo(sx + side * 30, sy - 26); c.lineTo(tx - side * 6, ty + 22); c.stroke();
  c.fillStyle = HEX.gold; c.beginPath(); c.arc(sx + side * 30, sy - 26, 5, 0, TAU); c.fill();
  c.translate(tx, ty); c.scale(p, p);
  c.font = font(FAM.monoB(), 24);
  const wa = c.measureText(a).width;
  c.font = font(FAM.mono(), 19);
  const wb = c.measureText(b).width, w = Math.max(wa, wb) + 36, h = 70;
  const x0 = side > 0 ? 0 : -w;
  c.fillStyle = 'rgba(14,10,24,0.92)'; c.fillRect(x0, -h / 2, w, h);
  c.fillStyle = HEX.gold; c.fillRect(x0, -h / 2 - 4, w, 4);
  c.fillStyle = HEX.pink; c.fillRect(side > 0 ? x0 - 10 : x0 + w, -h / 2 - 4, 10, h + 4);
  c.textAlign = 'left'; c.textBaseline = 'middle';
  c.font = font(FAM.monoB(), 24); c.fillStyle = HEX.bone; c.fillText(a, x0 + 18, -13);
  c.font = font(FAM.mono(), 19); c.fillStyle = HEX.gold; c.fillText(b, x0 + 18, 17);
  c.restore();
}

/**
 * A picture-in-picture box (another camera's feed) at (x, y, w, h): `draw` paints a full 1920x1080 frame, scaled
 * into the box on both layers; a tally light and a label in the corner.
 */
export function pip(c: C2, g: C2, x: number, y: number, w: number, h: number, t: number, label: string, a: number, draw: () => void) {
  if (a <= 0) return;
  c.save(); c.globalAlpha *= a;
  c.fillStyle = '#07060c'; c.fillRect(x - 8, y - 8, w + 16, h + 16);
  c.strokeStyle = HEX.gold; c.lineWidth = 3; c.strokeRect(x - 8, y - 8, w + 16, h + 16);
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.translate(x, y); c.scale(w / W, h / H);
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.translate(x, y); g.scale(w / W, h / H);
  draw();
  g.restore();
  c.restore();
  scanlines(c, x, y, w, h, 0.12, 3);
  c.fillStyle = 'rgba(10,8,16,0.75)'; c.fillRect(x, y + h - 34, 128, 34);
  c.fillStyle = '#ff3b3b'; c.beginPath(); c.arc(x + 18, y + h - 17, 7, 0, TAU); c.fill();
  c.font = font(FAM.monoB(), 20); c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillStyle = HEX.bone;
  c.fillText(label, x + 34, y + h - 16);
  c.restore();
}

// ------------------------------------------------------------------ the chorus line

/** A chorus-line fish in a top hat with a gold band, facing right; `kick` (0..1) tips its nose up and its tail high. */
export function hatFish(c: C2, x: number, y: number, s: number, col: string, t: number, i: number, kick: number) {
  c.save();
  c.translate(x, y); c.rotate(-0.42 * kick);
  fish(c, 0, 0, s, col, 1, t, i);
  // a gold bow tie under the chin, a top hat cocked on the head
  c.fillStyle = HEX.gold;
  c.beginPath(); c.moveTo(s * 0.55, s * 0.36); c.lineTo(s * 0.4, s * 0.24); c.lineTo(s * 0.4, s * 0.48); c.closePath();
  c.moveTo(s * 0.55, s * 0.36); c.lineTo(s * 0.7, s * 0.24); c.lineTo(s * 0.7, s * 0.48); c.closePath(); c.fill();
  c.save(); c.translate(s * 0.42, -s * 0.46); c.rotate(-0.18 + 0.1 * kick);
  c.fillStyle = '#120d1d';
  c.fillRect(-s * 0.4, -s * 0.06, s * 0.8, s * 0.1);
  c.fillRect(-s * 0.26, -s * 0.62, s * 0.52, s * 0.58);
  c.fillStyle = HEX.gold; c.fillRect(-s * 0.26, -s * 0.18, s * 0.52, s * 0.09);
  c.restore();
  c.restore();
}

// ------------------------------------------------------------------ lights the audience holds

/** A pink jellyfish held up like a lighter: a glowing bell and trailing tentacles, swaying by `sway` radians. */
export function jellyLighter(c: C2, g: C2, x: number, y: number, s: number, t: number, i: number, a = 1, sway = 0) {
  if (a <= 0.01) return;
  c.save(); c.globalAlpha *= a;
  c.translate(x, y); c.rotate(sway);
  c.fillStyle = 'rgba(255,170,215,0.95)';
  c.beginPath(); c.arc(0, 0, 17 * s, Math.PI, 0);
  c.quadraticCurveTo(10 * s, 5 * s, 0, 3 * s); c.quadraticCurveTo(-10 * s, 5 * s, -17 * s, 0); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.ellipse(-6 * s, -8 * s, 4 * s, 6 * s, -0.4, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(255,150,205,0.8)'; c.lineWidth = 2.2 * s; c.lineCap = 'round';
  for (let k = -2; k <= 2; k++) {
    c.beginPath(); c.moveTo(k * 6 * s, 3 * s);
    c.quadraticCurveTo(k * 6 * s + 6 * s * Math.sin(t * 3 + k + i), 16 * s, k * 5 * s, 30 * s + 4 * s * Math.sin(t * 2 + k));
    c.stroke();
  }
  c.restore();
  g.save(); g.translate(x, y);
  const rg = g.createRadialGradient(0, -4 * s, 0, 0, -4 * s, 46 * s);
  rg.addColorStop(0, rgbaHex(HEX.pink, 0.7 * a)); rg.addColorStop(1, rgbaHex(HEX.pink, 0));
  g.fillStyle = rg; g.beginPath(); g.arc(0, -4 * s, 46 * s, 0, TAU); g.fill();
  g.restore();
}

/**
 * The front row from behind (the camera over their heads, looking at the stage): big dark silhouettes of fish, crabs
 * and jellies along the bottom of the frame, each holding something up on a fin: `item(i, x, y, s)` draws it at the
 * top of the raised fin. `lift(i)` 0..1 raises it; `rim` lights their upper edges from the stage.
 */
export function frontRow(c: C2, t: number, lift: (i: number) => number, item: (i: number, x: number, y: number) => void, o: { rim?: string; xs?: number[]; sway?: (i: number) => number } = {}) {
  const xs = o.xs ?? [110, 400, 690, 1230, 1520, 1810];
  xs.forEach((x, i) => {
    const kind = h01(i, 4, 77), s = 1.05 + 0.25 * h01(i, 5, 77), bob = 6 * Math.sin(t * 1.6 + i);
    const y = H + 30 - 20 * h01(i, 6, 77) + bob, col = '#06050c';
    const up = clamp(lift(i)), side = i < xs.length / 2 ? 1 : -1, sw = o.sway ? o.sway(i) : 0;
    // the raised fin or claw (a long limb up to the item), behind the head
    const hx = x + side * 70 * s + sw * 120, hy = y - 250 * s - 70 * up;
    c.strokeStyle = col; c.lineCap = 'round'; c.lineWidth = 26 * s;
    const ax = lerp(x + side * 50 * s, hx, up), ay = lerp(y - 60 * s, hy, up);
    c.beginPath(); c.moveTo(x + side * 30 * s, y - 110 * s); c.quadraticCurveTo(x + side * 90 * s, y - 150 * s, ax, ay + 20); c.stroke();
    if (up > 0.05) item(i, ax, ay);
    c.fillStyle = col;
    if (kind < 0.5) { // a fish: a round head and a dorsal fin
      c.beginPath(); c.ellipse(x, y - 80 * s, 95 * s, 110 * s, 0, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(x - 30 * s, y - 180 * s); c.quadraticCurveTo(x + 10 * s, y - 250 * s, x + 46 * s, y - 176 * s); c.fill();
    } else if (kind < 0.8) { // a crab: a shell and two eye stalks
      c.beginPath(); c.ellipse(x, y - 50 * s, 120 * s, 80 * s, 0, 0, TAU); c.fill();
      c.lineWidth = 12 * s; c.strokeStyle = col;
      c.beginPath(); c.moveTo(x - 30 * s, y - 110 * s); c.lineTo(x - 42 * s, y - 170 * s); c.moveTo(x + 30 * s, y - 110 * s); c.lineTo(x + 42 * s, y - 170 * s); c.stroke();
      c.beginPath(); c.arc(x - 42 * s, y - 176 * s, 17 * s, 0, TAU); c.arc(x + 42 * s, y - 176 * s, 17 * s, 0, TAU); c.fill();
    } else { // a jellyfish's bell
      c.beginPath(); c.arc(x, y - 40 * s, 100 * s, Math.PI, 0); c.closePath(); c.fill();
    }
    if (o.rim) { // the stage's light on their crowns
      c.strokeStyle = rgbaHex(o.rim, 0.55); c.lineWidth = 4;
      c.beginPath();
      if (kind < 0.5) c.ellipse(x, y - 80 * s, 95 * s, 110 * s, 0, Math.PI * 1.15, Math.PI * 1.85);
      else if (kind < 0.8) c.ellipse(x, y - 50 * s, 120 * s, 80 * s, 0, Math.PI * 1.15, Math.PI * 1.85);
      else c.arc(x, y - 40 * s, 100 * s, Math.PI * 1.15, Math.PI * 1.85);
      c.stroke();
    }
  });
}

// ------------------------------------------------------------------ the woman's memory, the stool

/**
 * The woman with her child on her hip, rocking on the beat, as a memory inside a circle of soft pink light (the
 * outside broadcast's last image, remembered): centre (x, y), radius r. `a` fades it; `rock` is the beat's sway;
 * `hum`: she hums to the child (notes rise), as Rai sings.
 */
export function memory(c: C2, g: C2, x: number, y: number, r: number, t: number, a: number, rock: number, hum = false) {
  if (a <= 0.01) return;
  c.save(); c.globalAlpha *= a;
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.clip();
  const bg = c.createRadialGradient(x, y - r * 0.1, r * 0.05, x, y, r);
  bg.addColorStop(0, '#ffc2dc'); bg.addColorStop(0.5, '#d9508f'); bg.addColorStop(1, '#3a0f2e');
  c.fillStyle = bg; c.fillRect(x - r, y - r, 2 * r, 2 * r);
  // the kitchen remembered: a window frame with the night outside, a clock at four, a counter
  const col = '#3a0f2e';
  c.strokeStyle = rgbaHex(col, 0.55); c.lineWidth = r * 0.025;
  c.strokeRect(x - r * 0.7, y - r * 0.62, r * 0.42, r * 0.5);
  c.beginPath(); c.moveTo(x - r * 0.49, y - r * 0.62); c.lineTo(x - r * 0.49, y - r * 0.12); c.moveTo(x - r * 0.7, y - r * 0.37); c.lineTo(x - r * 0.28, y - r * 0.37); c.stroke();
  c.beginPath(); c.arc(x + r * 0.5, y - r * 0.45, r * 0.11, 0, TAU); c.stroke();
  c.beginPath(); c.moveTo(x + r * 0.5, y - r * 0.45); c.lineTo(x + r * 0.5, y - r * 0.53);
  c.moveTo(x + r * 0.5, y - r * 0.45); c.lineTo(x + r * 0.5 + r * 0.065 * Math.sin(TAU / 3), y - r * 0.45 - r * 0.065 * Math.cos(TAU / 3)); c.stroke();
  c.fillStyle = rgbaHex(col, 0.45); c.fillRect(x + r * 0.2, y + r * 0.28, r * 0.9, r * 0.1);
  // the woman holding her child, rocking about her feet
  const fy = y + r * 0.66, h = r * 0.95;
  c.save(); c.translate(x, fy); c.rotate(0.06 * rock); c.translate(-x, -fy);
  cast(c, 'woman', x, fy, h, 'hold', { col, t, headTilt: 0.18 + 0.05 * rock, emote: hum ? 'music' : undefined });
  c.restore();
  scanlines(c, x - r, y - r, 2 * r, 2 * r, 0.1, 4);
  c.restore();
  g.save();
  const gg = g.createRadialGradient(x, y, r * 0.6, x, y, r * 1.05);
  gg.addColorStop(0, rgbaHex(HEX.pink, 0)); gg.addColorStop(1, rgbaHex(HEX.pink, 0.25 * a));
  g.fillStyle = gg; g.beginPath(); g.arc(x, y, r * 1.05, 0, TAU); g.fill();
  g.restore();
}

/** The host's stool (from the dating segment): a ship's-timber seat on three legs with a brass footring. */
export function stool(c: C2, x: number, floor: number, h: number, tilt = 0) {
  c.save(); c.translate(x, floor); c.rotate(tilt);
  c.strokeStyle = '#4a2c1c'; c.lineWidth = h * 0.06; c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-h * 0.22, -h * 0.98); c.lineTo(-h * 0.34, 0);
  c.moveTo(h * 0.22, -h * 0.98); c.lineTo(h * 0.34, 0);
  c.moveTo(0, -h * 0.98); c.lineTo(0, -h * 0.02);
  c.stroke();
  c.strokeStyle = '#c9973e'; c.lineWidth = h * 0.03;
  c.beginPath(); c.ellipse(0, -h * 0.36, h * 0.27, h * 0.05, 0, 0, TAU); c.stroke();
  c.fillStyle = '#6d4228'; c.beginPath(); c.ellipse(0, -h, h * 0.36, h * 0.08, 0, 0, TAU); c.fill();
  c.fillStyle = '#8a5a34'; c.beginPath(); c.ellipse(0, -h * 1.02, h * 0.34, h * 0.06, 0, 0, TAU); c.fill();
  c.restore();
}

/**
 * A spotlight beam and its pool drawn into the picture itself (additively), behind whoever stands in it: the kit's
 * beams live on the glow layer, which lies over everything, so a seated Rai would be washed by her own pool.
 */
export function beam(c: C2, lx: number, ly: number, tx: number, ty: number, r: number, col: string, a: number) {
  if (a <= 0) return;
  c.save(); c.globalCompositeOperation = 'lighter';
  const bg = c.createLinearGradient(lx, ly, tx, ty);
  bg.addColorStop(0, rgbaHex(col, 0.3 * a)); bg.addColorStop(1, rgbaHex(col, 0.1 * a));
  c.fillStyle = bg;
  c.beginPath(); c.moveTo(lx - 10, ly); c.lineTo(lx + 10, ly); c.lineTo(tx + r, ty); c.lineTo(tx - r, ty); c.closePath(); c.fill();
  c.fillStyle = rgbaHex(col, 0.26 * a); c.beginPath(); c.ellipse(tx, ty, r, r * 0.22, 0, 0, TAU); c.fill();
  c.restore();
}
/** Where the kit's anglerfish lamp i hangs its lure (the beam's source). */
export const lampLure = (i: number) => ({ x: [W * 0.04, W * 0.14, W * 0.86, W * 0.96][i % 4]! - 52, y: H * 0.04 - 28 });

/** Feather the hard edge of the kit's spotlight hole (the house dimmed to `a` outside it): a soft-edged pool. */
export function featherSpot(c: C2, x: number, y: number, r: number, a: number) {
  const gr = c.createRadialGradient(x, y, r * 0.7, x, y, r);
  gr.addColorStop(0, 'rgba(4,3,10,0)'); gr.addColorStop(1, `rgba(4,3,10,${a})`);
  c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
}

/** A dark radial pool around (x, y) in screen space: the house lights down, a spot on the subject. */
export function spotPool(c: C2, x: number, y: number, r: number, a: number, col = '4,3,10') {
  const gr = c.createRadialGradient(x, y, r * 0.35, x, y, r * 1.6);
  gr.addColorStop(0, `rgba(${col},0)`); gr.addColorStop(1, `rgba(${col},${a})`);
  c.fillStyle = gr; c.fillRect(0, 0, W, H);
}

/** Applause as bubbles: `n` bubbles streaming up through (x0..x1), denser with `k` (0..1). */
export function applauseBubbles(c: C2, t: number, x0: number, x1: number, k: number, seed = 5) {
  if (k <= 0) return;
  c.strokeStyle = 'rgba(210,240,255,0.75)'; c.lineWidth = 2.5;
  c.fillStyle = 'rgba(210,240,255,0.12)';
  const n = Math.floor(70 * k);
  for (let i = 0; i < n; i++) {
    const sp = 0.35 + 0.5 * h01(i, seed, 2), x = x0 + (x1 - x0) * h01(i, seed, 1) + 14 * Math.sin(t * 3 + i);
    const y = H * 1.1 - ((h01(i, seed, 3) + t * sp) % 1.25) * H, r = 4 + 12 * h01(i, seed, 4);
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.stroke();
  }
}

export { mixHex };
