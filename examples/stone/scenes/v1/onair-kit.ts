// The opening plates' own kit (onair, archive, twist; TREATMENT-v1.md): the camera on both layers, the beat grid,
// the lower third that pushes from one rapped line to the next, the host's name strap, the crab stagehand, the pole,
// the trapdoor and its sign, rubber stamps, applause bubbles and confetti. The frozen set (_studio.ts) is untouched:
// these are this segment's props, built on top of it.
import { W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import { clamp, ease } from '../../engine/util';
import type { Line, Word } from '../../engine/lyrics';
import type { AudioData } from '../../engine/audio';
import { h01 } from '../_rai';
import { FAM, TAU, rgbaHex, mixHex } from '../_motifs';
import { lowerThird, balancedRows, type Cam } from './_studio';

export type C2 = CanvasRenderingContext2D;

// ------------------------------------------------------------------ camera and time

/** withCam on several layers at once (the main layer and the glow layer move together). */
export function cam2(cs: C2[], k: Cam, draw: () => void) {
  const z = k.zoom ?? 1;
  for (const c of cs) {
    c.save();
    c.translate(W / 2, H / 2); c.rotate(k.rot ?? 0); c.scale(z, z); c.translate(-W / 2 - (k.x ?? 0), -H / 2 - (k.y ?? 0));
  }
  draw();
  for (const c of cs) c.restore();
}

/** A camera that frames world point (fx, fy) at the screen's centre with zoom z. */
export const frameOn = (fx: number, fy: number, z: number, rot = 0): Cam => ({ x: fx - W / 2, y: fy - H / 2, zoom: z, rot });

/** Blend two cameras. */
export function camMix(a: Cam, b: Cam, u: number): Cam {
  const L = (p?: number, q?: number, d = 0) => (p ?? d) + ((q ?? d) - (p ?? d)) * u;
  return { x: L(a.x, b.x), y: L(a.y, b.y), zoom: L(a.zoom, b.zoom, 1), rot: L(a.rot, b.rot) };
}

/** The beat at or before t (a cut time). */
export const beatFloor = (au: AudioData, t: number) => au.timeOfBeat(Math.floor(au.beatAt(t + 0.02)));
/** The k-th beat after the beat at or before t. */
export const beatFrom = (au: AudioData, t: number, k: number) => au.timeOfBeat(Math.floor(au.beatAt(t + 0.02)) + k);

/** A word of a line by pattern (the nth match), else the first word. */
export function wordOf(line: Line, re: RegExp, nth = 0): Word {
  return line.words.filter((w) => re.test(w.w.toLowerCase()))[nth] ?? line.words[0]!;
}

/** Which shot of a cut list is live at t, and its local time. */
export function shotAt(cuts: number[], t: number): { i: number; t0: number; lt: number } {
  let i = 0;
  for (let k = 0; k < cuts.length; k++) if (t >= cuts[k]!) i = k;
  return { i, t0: cuts[i]!, lt: t - cuts[i]! };
}

/** A quick crash zoom: 0 before t0, eased to 1 over dur (fast out). */
export const crash = (t: number, t0: number, dur = 0.12) => (t < t0 ? 0 : ease.outCubic(clamp((t - t0) / dur)));

// ------------------------------------------------------------------ the lyric

/**
 * The lower third over a run of lines. The rapped lines run into each other (one ends as the next begins), so the
 * kit's lead-in would stack two plates: here the live line is the one whose first word has (nearly) come, and at each
 * change the old plate pushes out to the right as the new one pushes in from the left (a TV lower third's push).
 */
export class LyricBar {
  sw: number[];
  constructor(public lines: Line[]) {
    this.sw = lines.map((l, k) => {
      const first = l.words[0]!.start, prev = lines[k - 1];
      return prev && prev.end + 0.55 > first - 0.4 ? first - 0.03 : first - 0.4;
    });
  }
  /** The live line at t (or null). */
  live(t: number): Line | null {
    let k = -1;
    for (let i = 0; i < this.lines.length; i++) if (t >= this.sw[i]!) k = i;
    const L = this.lines[k];
    return L && t < L.end + 0.55 ? L : null;
  }
  /** Draw the lower third on c; with `g`, clear the glow layer behind the plate so it stays readable. */
  draw(c: C2, t: number, o: { y?: number; sung?: string; g?: C2 } = {}) {
    let k = -1;
    for (let i = 0; i < this.lines.length; i++) if (t >= this.sw[i]!) k = i;
    if (k < 0) return;
    const L = this.lines[k]!, prev = this.lines[k - 1], age = t - this.sw[k]!;
    if (o.g && t < L.end + 0.55) unglowLower(o.g, c, L, o.y ?? H - 112);
    const pushed = prev && this.sw[k] === L.words[0]!.start - 0.03;
    if (pushed && age < 0.2) {
      const u = ease.outCubic(age / 0.2);
      c.save(); c.globalAlpha *= 1 - u; c.translate(170 * u, 0); lowerThird(c, prev!, t, { y: o.y, sung: o.sung, until: t + 1 }); c.restore();
      c.save(); c.globalAlpha *= u; c.translate(-170 * (1 - u), 0); lowerThird(c, L, t, { y: o.y, sung: o.sung }); c.restore();
    } else lowerThird(c, L, t, { y: o.y, sung: o.sung });
  }
}

/** Erase the glow layer over a rect (text drawn on the main layer under it stays readable). */
export function unglow(g: C2, x: number, y: number, w: number, h: number) {
  g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.fillRect(x, y, w, h); g.restore();
}

/** Clear the glow behind a lower third's plate (the kit's layout: Archivo bold 48, balanced rows, the slant). */
export function unglowLower(g: C2, c: C2, line: Line, y = H - 112, size = 48) {
  c.save(); c.font = font(FAM.bold(), size);
  const rows = balancedRows(c, line, W - 360), sp = c.measureText(' ').width;
  const ws = line.words.map((w) => c.measureText(w.w).width);
  const pw = Math.max(...rows.map((r) => r.reduce((a, i) => a + ws[i]!, 0) + sp * (r.length - 1))) + 110;
  const ph = rows.length * size * 1.2 + 34;
  c.restore();
  unglow(g, W / 2 - pw / 2 - 200, y - ph / 2 - 16, pw + 400, ph + 32);
}

/** Clear the glow behind the closed captions (the kit's box, Cormorant 52 at H - 120). */
export function unglowCaption(g: C2, y = H - 120, size = 52) {
  unglow(g, W * 0.15, y - size * 1.05, W * 0.7, size * 1.6);
}

/** A soft dark band at the bottom of the frame, under the lower third, for busy pictures. */
export function band(c: C2, a = 0.6, top = H - 230) {
  const g = c.createLinearGradient(0, top, 0, H);
  g.addColorStop(0, 'rgba(8,6,16,0)'); g.addColorStop(0.5, `rgba(8,6,16,${a * 0.7})`); g.addColorStop(1, `rgba(8,6,16,${a})`);
  c.fillStyle = g; c.fillRect(0, top, W, H - top);
}

// ------------------------------------------------------------------ TV supers

/** The host's name strap, bottom left (a TV super, not the lyric): slides in at t0, out at t1. */
export function nameStrap(c: C2, t: number, t0: number, t1: number, name: string, sub: string) {
  if (t < t0 || t > t1 + 0.25) return;
  const inU = ease.outExpo(clamp((t - t0) / 0.35)), outU = clamp((t - t1) / 0.25);
  const x = 110 - (1 - inU) * 700 - outU * 40, y = H - 210;
  c.save();
  c.globalAlpha *= 1 - outU;
  c.font = font(FAM.hook(), 64);
  const nw = c.measureText(name).width;
  c.font = font(FAM.monoB(), 24);
  const sw = c.measureText(sub).width;
  const w = Math.max(nw + 60, sw + 60);
  c.save(); c.transform(1, 0, -0.18, 1, 0, 0);
  c.fillStyle = HEX.pink; c.fillRect(x + 40, y - 52, nw + 50, 78);
  c.fillStyle = 'rgba(14,10,24,0.92)'; c.fillRect(x + 40, y + 26, w, 44);
  c.fillStyle = HEX.gold; c.fillRect(x + 40, y + 26, w, 4);
  c.restore();
  c.textAlign = 'left'; c.textBaseline = 'middle';
  c.font = font(FAM.hook(), 64); c.fillStyle = HEX.ink; c.fillText(name, x + 58 + 4, y - 12 + 4);
  c.fillStyle = HEX.bone; c.fillText(name, x + 58, y - 12);
  c.font = font(FAM.monoB(), 24); c.fillStyle = HEX.bone; c.fillText(sub, x + 46, y + 50);
  c.restore();
}

/** A rubber stamp's impression: a red rounded box with the words, rotated, slamming down at t0 (scale from big). */
export function stamp(c: C2, text: string, x: number, y: number, size: number, t: number, t0: number, o: { rot?: number; col?: string; sub?: string; fam?: string } = {}) {
  if (t < t0) return;
  const age = t - t0, k = age < 0.09 ? 1.9 - 0.9 * ease.inQuad(age / 0.09) : 1 + 0.04 * Math.exp(-age * 18) * Math.sin(age * 60);
  const col = o.col ?? '#e8323c';
  c.save();
  c.translate(x, y); c.rotate(o.rot ?? -0.16); c.scale(k, k);
  c.globalAlpha *= clamp(age / 0.03);
  c.font = font(o.fam ?? FAM.hook(), size);
  const tw = c.measureText(text).width, bh = size * (o.sub ? 1.75 : 1.25), bw = tw + size * 0.7;
  c.strokeStyle = col; c.lineWidth = size * 0.09; c.lineJoin = 'round';
  c.beginPath(); c.roundRect(-bw / 2, -bh / 2, bw, bh, size * 0.16); c.stroke();
  c.lineWidth = size * 0.03;
  c.beginPath(); c.roundRect(-bw / 2 + size * 0.12, -bh / 2 + size * 0.12, bw - size * 0.24, bh - size * 0.24, size * 0.1); c.stroke();
  c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(text, 0, o.sub ? -size * 0.2 : size * 0.04);
  if (o.sub) { c.font = font(FAM.monoB(), size * 0.32); c.fillText(o.sub, 0, size * 0.52); }
  // worn ink: knock a few specks out of the impression
  c.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 40; i++) {
    c.fillStyle = `rgba(0,0,0,${0.35 + 0.5 * h01(i, 7, 3)})`;
    c.beginPath(); c.arc((h01(i, 1, 3) - 0.5) * bw, (h01(i, 2, 3) - 0.5) * bh, size * (0.01 + 0.03 * h01(i, 4, 3)), 0, TAU); c.fill();
  }
  c.restore();
}

/** A price tag on a string: "1 UNSEEN STONE" (or anything), swinging in at t0. */
export function priceTag(c: C2, x: number, y: number, s: number, t: number, t0: number, top: string, big: string) {
  if (t < t0) return;
  const age = t - t0, sw = 0.5 * Math.exp(-age * 4) * Math.sin(age * 12);
  c.save();
  c.translate(x, y); c.rotate(-0.12 + sw); c.scale(s, s);
  c.globalAlpha *= clamp(age / 0.06);
  c.strokeStyle = '#d9cfb8'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -60); c.lineTo(0, 0); c.stroke();
  c.fillStyle = HEX.yellow;
  c.beginPath(); c.moveTo(-20, 0); c.lineTo(20, 0); c.lineTo(150, 0); c.lineTo(150, 120); c.lineTo(-150, 120); c.lineTo(-150, 0); c.closePath(); c.fill();
  c.strokeStyle = HEX.ink; c.lineWidth = 4; c.stroke();
  c.fillStyle = HEX.ink; c.beginPath(); c.arc(0, 18, 8, 0, TAU); c.fill();
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = font(FAM.monoB(), 20); c.fillText(top, 0, 48);
  c.font = font(FAM.hook(), 34); c.fillText(big, 0, 90);
  c.restore();
}

// ------------------------------------------------------------------ the crab stagehand

export type CrabPose = 'walk' | 'carry' | 'push' | 'up' | 'clap';
/**
 * The crab stagehand (dot eyes, no mouth; the crew's black cap and a headset), feet at (x, y), scale s (1 = about
 * 190 px wide). Facing left by default (`flip` faces right). Returns its claws' tips in canvas px.
 */
export function crabHand(c: C2, x: number, y: number, s: number, t: number, o: { pose?: CrabPose; flip?: boolean; look?: number; sweat?: boolean; walk?: number } = {}) {
  const f = o.flip ? -1 : 1, pose = o.pose ?? 'walk', step = o.walk ?? 0;
  const bob = (pose === 'walk' || pose === 'carry' ? 4 * Math.abs(Math.sin(step * 9)) : 2 * Math.sin(t * 3)) * s;
  const shell = '#e8553a', dark = '#b8402a', claw = '#d0452d';
  c.save();
  c.translate(x, y - bob); c.scale(f * s, s);
  // legs: three a side, scuttling
  c.strokeStyle = dark; c.lineCap = 'round'; c.lineWidth = 9;
  for (let k = 0; k < 3; k++) for (const sd of [-1, 1]) {
    const ph = step * 9 + k * 1.3 + (sd > 0 ? Math.PI : 0), lift = pose === 'walk' || pose === 'carry' ? 10 * Math.max(0, Math.sin(ph)) : 0;
    const bx = sd * (30 + k * 16), ex = sd * (62 + k * 18);
    c.beginPath(); c.moveTo(bx, -40); c.quadraticCurveTo(sd * (56 + k * 18), -64 - k * 4, ex, -6 - lift + bob / s); c.stroke();
  }
  // the shell
  c.fillStyle = shell; c.beginPath(); c.ellipse(0, -58, 74, 48, 0, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.ellipse(-22, -78, 30, 14, -0.2, 0, TAU); c.fill();
  c.strokeStyle = dark; c.lineWidth = 3;
  c.beginPath(); c.arc(0, -40, 54, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
  // the eye stalks and dot eyes, peering where it looks
  const lk = (o.look ?? 0) * 4;
  c.strokeStyle = shell; c.lineWidth = 8;
  c.beginPath(); c.moveTo(-18, -96); c.lineTo(-24, -132); c.moveTo(18, -96); c.lineTo(22, -134); c.stroke();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(-24, -138, 12, 0, TAU); c.arc(22, -140, 12, 0, TAU); c.fill();
  c.fillStyle = '#111'; c.beginPath(); c.arc(-27 + lk, -138, 5.5, 0, TAU); c.arc(19 + lk, -140, 5.5, 0, TAU); c.fill();
  // the crew's black cap (backwards) and a headset mic
  c.fillStyle = '#1a1622'; c.beginPath(); c.ellipse(0, -100, 44, 16, 0, Math.PI, 0); c.fill();
  c.fillRect(-44, -104, 88, 8); c.beginPath(); c.ellipse(46, -98, 20, 6, 0.1, 0, TAU); c.fill();
  c.strokeStyle = '#1a1622'; c.lineWidth = 4; c.beginPath(); c.moveTo(-60, -70); c.quadraticCurveTo(-76, -50, -58, -38); c.stroke();
  c.fillStyle = '#1a1622'; c.beginPath(); c.arc(-56, -38, 5, 0, TAU); c.fill();
  // the claws
  const arms: Record<CrabPose, [number, number, number, number]> = { // [left dx, dy, right dx, dy] of the claw tips
    walk: [-96, -60, 96, -60], carry: [-70, -128, 66, -128], push: [-150, -78, -130, -40], up: [-90, -170, 90, -170], clap: [-34, -120, 34, -120],
  };
  let [lx, ly, rx, ry] = arms[pose];
  if (pose === 'clap') { const k = Math.abs(Math.sin(t * 14)); lx -= 22 * k; rx += 22 * k; }
  if (pose === 'up') { ly += 8 * Math.sin(t * 9); ry += 8 * Math.cos(t * 9); }
  const clawAt = (sx: number, sy: number, ex: number, ey: number, side: number) => {
    c.strokeStyle = dark; c.lineWidth = 12;
    c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo((sx + ex) / 2 + side * 10, Math.min(sy, ey) - 18, ex, ey); c.stroke();
    const a = Math.atan2(ey - sy, ex - sx);
    c.save(); c.translate(ex, ey); c.rotate(a);
    c.fillStyle = claw; c.beginPath(); c.ellipse(14, 0, 26, 17, 0, 0, TAU); c.fill();
    c.fillStyle = shell; c.beginPath(); c.moveTo(26, -6); c.quadraticCurveTo(52, -16, 46, 2); c.lineTo(30, 2); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(26, 6); c.quadraticCurveTo(48, 16, 44, 4); c.lineTo(30, 4); c.closePath(); c.fill();
    c.restore();
  };
  clawAt(-56, -54, lx, ly, -1);
  clawAt(56, -54, rx, ry, 1);
  if (o.sweat) {
    c.fillStyle = '#9fdcff'; c.strokeStyle = '#2b6fb8'; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(52, -160); c.quadraticCurveTo(64, -140, 52, -132); c.quadraticCurveTo(40, -140, 52, -160); c.fill(); c.stroke();
  }
  c.restore();
  const tip = (dx: number, dy: number) => ({ x: x + f * s * (dx + 40 * Math.sign(dx || 1)), y: y - bob + s * dy });
  return { l: tip(lx, ly), r: tip(rx, ry) };
}

// ------------------------------------------------------------------ the pole, the trapdoor

/**
 * A long wooden pole from (x0, y0) (far end, width w0) to (x1, y1) (near end, width w1): the taper is the perspective
 * of a pole running through her heart towards us. Rope lashings near each end.
 */
export function pole(c: C2, x0: number, y0: number, x1: number, y1: number, w0: number, w1: number) {
  const a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a), ny = Math.cos(a), len = Math.hypot(x1 - x0, y1 - y0);
  c.save();
  const g = c.createLinearGradient(x0 + nx * w0, y0 + ny * w0, x0 - nx * w0, y0 - ny * w0);
  g.addColorStop(0, '#5e4127'); g.addColorStop(0.35, '#b88a55'); g.addColorStop(0.6, '#9a6f42'); g.addColorStop(1, '#4e3520');
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(x0 + nx * w0 / 2, y0 + ny * w0 / 2); c.lineTo(x1 + nx * w1 / 2, y1 + ny * w1 / 2);
  c.lineTo(x1 - nx * w1 / 2, y1 - ny * w1 / 2); c.lineTo(x0 - nx * w0 / 2, y0 - ny * w0 / 2); c.closePath(); c.fill();
  c.strokeStyle = '#3b2716'; c.lineWidth = 2; c.stroke();
  // the cut ends
  c.fillStyle = '#d8b07a';
  c.beginPath(); c.ellipse(x1, y1, w1 * 0.22, w1 / 2, a, 0, TAU); c.fill(); c.stroke();
  // grain
  c.strokeStyle = 'rgba(60,38,20,0.35)'; c.lineWidth = 1.5;
  for (let k = -1; k <= 1; k++) {
    c.beginPath(); c.moveTo(x0 + nx * w0 * 0.2 * k, y0 + ny * w0 * 0.2 * k); c.lineTo(x1 + nx * w1 * 0.2 * k, y1 + ny * w1 * 0.2 * k); c.stroke();
  }
  // rope lashings
  c.strokeStyle = '#d9c08a'; c.lineWidth = Math.max(2, w1 * 0.08);
  for (const u of [0.08, 0.11, 0.89, 0.92]) {
    const px = x0 + (x1 - x0) * u, py = y0 + (y1 - y0) * u, w = w0 + (w1 - w0) * u;
    c.beginPath(); c.moveTo(px + nx * w * 0.55, py + ny * w * 0.55); c.lineTo(px - nx * w * 0.55, py - ny * w * 0.55); c.stroke();
  }
  c.restore();
  void len;
}

/**
 * The trapdoor in the stage floor at (x, y) (the floor line), width w: `open` 0 shut (a seam and hinges) .. 1 open (the
 * flap swung down, the dark shaft below). Draw before Rai.
 */
export function trapdoor(c: C2, x: number, y: number, w: number, open: number, t: number) {
  const d = w * 0.2; // its depth on the floor (perspective)
  c.save();
  if (open <= 0.01) {
    c.strokeStyle = 'rgba(20,10,16,0.75)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(x - w / 2, y - d / 2); c.lineTo(x + w / 2, y - d / 2); c.lineTo(x + w / 2 + 6, y + d / 2); c.lineTo(x - w / 2 - 6, y + d / 2); c.closePath(); c.stroke();
    c.fillStyle = '#8a6a44';
    for (const s of [-1, 1]) { c.fillRect(x + s * w * 0.3 - 8, y - d / 2 - 2, 16, 5); }
  } else {
    const u = ease.outBack(clamp(open), 2);
    c.fillStyle = '#05030a';
    c.beginPath(); c.moveTo(x - w / 2, y - d / 2); c.lineTo(x + w / 2, y - d / 2); c.lineTo(x + w / 2 + 6, y + d / 2); c.lineTo(x - w / 2 - 6, y + d / 2); c.closePath(); c.fill();
    // the shaft's inner wall
    c.fillStyle = '#1c1018'; c.fillRect(x - w / 2, y - d / 2, w, d * 0.35);
    // the flap swinging down from the near edge (seen from above: it shrinks as it hangs)
    const fh = d * (1 - u) + 4;
    c.fillStyle = '#6a4a3a'; c.fillRect(x - w / 2 - 6, y + d / 2, w + 12, fh);
    c.strokeStyle = '#2a1a1a'; c.lineWidth = 2; c.strokeRect(x - w / 2 - 6, y + d / 2, w + 12, fh);
    // bubbles out of the shaft
    for (let i = 0; i < 8; i++) {
      const v = ((t * 0.8 + h01(i, 61)) % 1), bx = x + (h01(i, 62) - 0.5) * w * 0.8, by = y - v * 260;
      c.strokeStyle = `rgba(200,235,255,${0.6 * (1 - v)})`; c.lineWidth = 2;
      c.beginPath(); c.arc(bx + 8 * Math.sin(t * 3 + i), by, 4 + 6 * h01(i, 63), 0, TAU); c.stroke();
    }
  }
  c.restore();
}

/** The little sign by the trapdoor: DO NOT STAND HERE, an arrow pointing down at the spot. */
export function standSign(c: C2, x: number, y: number, s: number, t: number, wobble = 0) {
  c.save();
  c.translate(x, y); c.scale(s, s); c.rotate(0.04 * Math.sin(t * 2) + wobble);
  c.strokeStyle = '#2a2a33'; c.lineWidth = 6; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -120); c.stroke();
  c.fillStyle = '#2a2a33'; c.beginPath(); c.ellipse(0, 0, 26, 7, 0, 0, TAU); c.fill();
  c.fillStyle = HEX.yellow; c.beginPath(); c.roundRect(-74, -176, 148, 70, 6); c.fill();
  c.strokeStyle = HEX.ink; c.lineWidth = 3; c.stroke();
  c.fillStyle = HEX.ink; c.font = font(FAM.monoB(), 17); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('DO NOT', 0, -158); c.fillText('STAND HERE', 0, -138);
  c.beginPath(); c.moveTo(-50, -122); c.lineTo(-30, -122); c.lineTo(-40, -112); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(30, -122); c.lineTo(50, -122); c.lineTo(40, -112); c.closePath(); c.fill();
  c.restore();
}

// ------------------------------------------------------------------ the audience's applause, confetti

/** Applause underwater: bubbles bursting up from the crowd (a fountain from each seat), strength k. */
export function applause(c: C2, g: C2 | null, t: number, k: number, y0 = H, n = 70, seed = 3) {
  if (k <= 0) return;
  c.save();
  for (let i = 0; i < n; i++) {
    const x = h01(i, seed, 1) * W, sp = 0.6 + 0.8 * h01(i, seed, 2), v = (t * 0.55 * sp + h01(i, seed, 3)) % 1;
    const y = y0 - v * (y0 + 40) * 0.85, r = (3 + 9 * h01(i, seed, 4)) * (0.6 + 0.6 * v);
    const a = k * (v < 0.1 ? v / 0.1 : 1 - (v - 0.1) / 0.9) * 0.8;
    c.strokeStyle = `rgba(210,240,255,${a})`; c.lineWidth = 2;
    c.beginPath(); c.arc(x + 14 * Math.sin(t * 2.6 + i), y, r, 0, TAU); c.stroke();
    if (r > 8 && g) { g.fillStyle = rgbaHex('#bfefff', 0.12 * a); g.beginPath(); g.arc(x, y, r * 1.6, 0, TAU); g.fill(); }
  }
  c.restore();
}

/** Confetti bubbles: coloured flakes and bubbles falling and tumbling from t0 (a celebration). */
export function confetti(c: C2, t: number, t0: number, n = 120, seed = 9) {
  if (t < t0) return;
  const age = t - t0;
  const cols = [HEX.pink, HEX.yellow, HEX.cyan, HEX.lime, HEX.gold, HEX.violet];
  for (let i = 0; i < n; i++) {
    const delay = h01(i, seed, 1) * 0.4, a = age - delay;
    if (a < 0) continue;
    const x0 = W * (0.1 + 0.8 * h01(i, seed, 2)), vx = (h01(i, seed, 3) - 0.5) * 500;
    const x = x0 + vx * Math.min(a, 0.5) + 30 * Math.sin(a * 4 + i), y = -40 + 260 * a + 40 * a * a + 120 * h01(i, seed, 4);
    if (y > H + 40) continue;
    c.save(); c.translate(x, y); c.rotate(a * (3 + 6 * h01(i, seed, 5)) + i);
    c.fillStyle = cols[i % cols.length]!;
    if (i % 4 === 0) { c.strokeStyle = 'rgba(220,245,255,0.7)'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 7, 0, TAU); c.stroke(); }
    else { c.scale(1, Math.abs(Math.cos(a * 7 + i))); c.fillRect(-7, -4, 14, 8); }
    c.restore();
  }
}

/** A comic sound effect word (TINK, BZZT, OW...), popped at t0 with a hard offset shadow, gone at t1. */
export function sfx(c: C2, text: string, x: number, y: number, size: number, t: number, t0: number, t1: number, o: { col?: string; rot?: number; stroke?: string } = {}) {
  if (t < t0 || t > t1) return;
  const age = t - t0, k = ease.outBack(clamp(age / 0.12), 3), fade = 1 - clamp((t - (t1 - 0.12)) / 0.12);
  c.save();
  c.translate(x, y); c.rotate(o.rot ?? -0.1); c.scale(k, k);
  c.globalAlpha *= fade;
  c.font = font(FAM.hook(), size); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.lineJoin = 'round'; c.lineWidth = size * 0.16; c.strokeStyle = o.stroke ?? HEX.ink; c.strokeText(text, 0, 0);
  c.fillStyle = o.col ?? HEX.yellow; c.fillText(text, 0, 0);
  c.restore();
}

/** Mix helper re-exported for the plates. */
export { mixHex };
