// onair's first shot: the crab camera's viewfinder with the lens cap still on. The film's first frame is black with
// a thin ring of light leaking round the cap (an eclipse: the ring, the hole in her heart, the zero) inside the
// viewfinder's furniture: corner brackets, REC, a timecode reading the song's own time, a battery, audio meters, and
// a LENS CAP warning blinking. The cap jolts when a claw taps it (TINK), is pried (the claw's tips in the gap), then
// yanked off.
import { W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import { clamp, ease } from '../../engine/util';
import { h01 } from '../_rai';
import { FAM, TAU, rgbaHex } from '../_motifs';
import type { C2 } from './onair-kit';

export const LENS = { x: W / 2, y: H / 2 - 62, r: 392 };

export interface CapState {
  /** The cap's offset from the lens centre (px) and its turn. */
  dx: number; dy: number; rot: number;
  /** The claw prying at the lower right: 0 none .. 1 gripping hard. */
  claw: number;
  /** How bright the light outside is (0..1+), e.g. a kick. */
  light: number;
  /** The tap's flare (0..1) at the lower right. */
  flare: number;
  /** Shadows of things passing outside the lens (angle on the ring, angular width), dimming the leak. */
  shade?: { a: number; w: number }[];
}

/** Who passes the lens outside before the show: a fish over the top, another under, then the crab (the tapper). */
export function passers(t: number, tapT: number): { a: number; w: number }[] {
  const out: { a: number; w: number }[] = [];
  const pass = (t0: number, t1: number, a0: number, a1: number, w: number) => { if (t >= t0 && t <= t1) out.push({ a: a0 + (a1 - a0) * ease.inOutQuad((t - t0) / (t1 - t0)), w }); };
  pass(0.75, 1.75, -2.9, -0.2, 0.32);
  pass(2.85, 3.7, 2.7, 0.9, 0.26);
  pass(tapT - 0.55, tapT - 0.05, 1.6, 0.78, 0.4);
  if (t > tapT - 0.05 && t < tapT + 0.35) out.push({ a: 0.78, w: 0.4 });
  return out;
}

/** The lens cap seen from inside the camera: black, a ring of light where it does not quite fit. */
export function lensCap(c: C2, g: C2, t: number, s: CapState) {
  const { x, y, r } = LENS, rc = r - 7, cx = x + s.dx, cy = y + s.dy;
  c.fillStyle = '#030205'; c.fillRect(0, 0, W, H);
  // the light outside, seen only in the gap
  c.save();
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.clip();
  const lg = c.createRadialGradient(x, y, r * 0.8, x, y, r);
  lg.addColorStop(0, '#ff7fb6'); lg.addColorStop(0.7, '#ffd0a0'); lg.addColorStop(1, '#fff4e2');
  c.fillStyle = lg; c.fillRect(x - r, y - r, 2 * r, 2 * r);
  // the claw's tips round the rim, lower right, outside the cap
  if (s.claw > 0) clawTips(c, x, y, r, s.claw, '#c4402a', '#e8553a');
  for (const sh of s.shade ?? []) { c.strokeStyle = '#05030a'; c.lineWidth = 70; c.beginPath(); c.arc(x, y, r, sh.a - sh.w / 2, sh.a + sh.w / 2); c.stroke(); }
  c.restore();
  // the cap: moulded black plastic, ridged rim, its maker's name backwards (we are inside looking out)
  c.save();
  c.translate(cx, cy); c.rotate(s.rot);
  const cg = c.createRadialGradient(-rc * 0.3, -rc * 0.4, rc * 0.1, 0, 0, rc);
  cg.addColorStop(0, '#16141c'); cg.addColorStop(1, '#060509');
  c.fillStyle = cg; c.beginPath(); c.arc(0, 0, rc, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.035)'; c.lineWidth = 2;
  for (let k = 1; k < 9; k++) { c.beginPath(); c.arc(0, 0, rc * (0.2 + 0.09 * k), 0, TAU); c.stroke(); }
  c.lineWidth = 3;
  for (let k = 0; k < 120; k++) { const a = (k / 120) * TAU; c.beginPath(); c.moveTo(Math.cos(a) * (rc - 4), Math.sin(a) * (rc - 4)); c.lineTo(Math.cos(a) * (rc - 16), Math.sin(a) * (rc - 16)); c.stroke(); }
  c.scale(-1, 1);
  c.font = font(FAM.monoB(), 30); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = 'rgba(255,255,255,0.05)';
  const label = 'CRAB-CAM · 72 mm · SEABED STUDIOS · ';
  for (let i = 0; i < label.length; i++) {
    const a = -Math.PI / 2 + (i / label.length) * TAU;
    c.save(); c.rotate(a); c.translate(0, -rc * 0.78); c.fillText(label[i]!, 0, 0); c.restore();
  }
  c.restore();
  // the leak glows (additive), stronger where the gap is wider; the tap flares at the lower right
  g.save();
  g.beginPath(); g.arc(x, y, r + 2, 0, TAU); g.clip();
  g.beginPath(); g.rect(0, 0, W, H); g.arc(cx, cy, rc, 0, TAU, true);
  g.fillStyle = rgbaHex('#ffb3d0', 0.85 * s.light); g.fill('evenodd');
  g.restore();
  if (s.claw > 0) { // the claw blocks the light: no glow where it is
    g.save(); g.globalCompositeOperation = 'destination-out';
    clawTips(g, x, y, r, s.claw, '#000', '#000');
    g.restore();
  }
  g.save();
  g.strokeStyle = rgbaHex('#ff6fae', 0.22 * s.light); g.lineWidth = 26;
  g.beginPath(); g.arc(x, y, r + 8, 0, TAU); g.stroke();
  g.restore();
  if (s.flare > 0) {
    const fx = x + Math.cos(0.75) * r, fy = y + Math.sin(0.75) * r;
    const fg = g.createRadialGradient(fx, fy, 0, fx, fy, 120);
    fg.addColorStop(0, rgbaHex('#fff2d8', 0.6 * s.flare)); fg.addColorStop(1, rgbaHex('#ff9fc8', 0));
    g.fillStyle = fg; g.beginPath(); g.arc(fx, fy, 120, 0, TAU); g.fill();
  }
  for (const sh of s.shade ?? []) { // a passer's shadow: the leak goes dark there
    g.save(); g.globalCompositeOperation = 'destination-out'; g.strokeStyle = 'rgba(0,0,0,0.92)'; g.lineWidth = 90; g.lineCap = 'round';
    g.beginPath(); g.arc(x, y, r, sh.a - sh.w / 2, sh.a + sh.w / 2); g.stroke(); g.restore();
  }
}

/** The crab's claw tips gripping the cap's rim from outside, lower right (seen only in the gap). */
function clawTips(c: C2, x: number, y: number, r: number, k: number, dark: string, light: string) {
  for (const [a, j] of [[0.6, 0], [0.9, 1]] as const) {
    const d = r + 60 - 100 * k, px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
    c.save(); c.translate(px, py); c.rotate(a + Math.PI + (j ? 0.3 : -0.3)); c.scale(1.5, 1.5);
    c.fillStyle = dark;
    c.beginPath(); c.moveTo(-80, -26); c.quadraticCurveTo(14, -34, 46, 0); c.quadraticCurveTo(10, 8, -80, 22); c.closePath(); c.fill();
    c.fillStyle = light; c.beginPath(); c.ellipse(-50, -4, 36, 18, 0, 0, TAU); c.fill();
    c.restore();
  }
}

const tc = (v: number) => {
  const f = Math.floor((v % 1) * 25), s = Math.floor(v) % 60, m = Math.floor(v / 60);
  return `00:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
};

/** The viewfinder's furniture over the frame. `alpha` fades it; `warn` blinks the LENS CAP warning. */
export function viewfinder(c: C2, g: C2, t: number, o: { alpha?: number; warn?: boolean; lvl?: [number, number]; af?: { x: number; y: number; lock: number; label: string } } = {}) {
  const a = o.alpha ?? 1;
  if (a <= 0) return;
  c.save();
  c.globalAlpha *= a;
  const ink = 'rgba(244,241,234,0.9)';
  c.strokeStyle = ink; c.lineWidth = 4; c.lineCap = 'square';
  // the corner brackets
  for (const [x, y, sx, sy] of [[96, 74, 1, 1], [W - 96, 74, -1, 1], [96, H - 74, 1, -1], [W - 96, H - 74, -1, -1]] as const) {
    c.beginPath(); c.moveTo(x, y + sy * 64); c.lineTo(x, y); c.lineTo(x + sx * 64, y); c.stroke();
  }
  // a small centre mark
  c.lineWidth = 2;
  c.beginPath(); c.moveTo(W / 2 - 18, H / 2 - 20); c.lineTo(W / 2 + 18, H / 2 - 20); c.moveTo(W / 2, H / 2 - 38); c.lineTo(W / 2, H / 2 - 2); c.stroke();
  c.font = font(FAM.monoB(), 30); c.textBaseline = 'middle'; c.textAlign = 'left';
  // REC
  const blink = Math.floor(t * 2) % 2 === 0;
  c.fillStyle = blink ? '#ff3b3b' : '#5a1a1e'; c.beginPath(); c.arc(150, 128, 12, 0, TAU); c.fill();
  if (blink) { g.fillStyle = rgbaHex('#ff3b3b', 0.5 * a); g.beginPath(); g.arc(150, 128, 22, 0, TAU); g.fill(); }
  c.fillStyle = ink; c.fillText('REC', 174, 130);
  c.fillStyle = 'rgba(244,241,234,0.6)'; c.fillText('CAM 1', 270, 130);
  // the timecode (the song's own time) and the battery
  c.textAlign = 'right'; c.fillStyle = ink;
  c.fillText(tc(t), W - 250, 130);
  c.strokeStyle = ink; c.lineWidth = 3; c.strokeRect(W - 214, 114, 62, 30); c.fillStyle = ink; c.fillRect(W - 152, 122, 6, 14);
  for (let k = 0; k < 3; k++) c.fillRect(W - 209 + k * 19, 119, 15, 20);
  // exposure, bottom left; audio meters, bottom right
  c.textAlign = 'left'; c.font = font(FAM.mono(), 24); c.fillStyle = 'rgba(244,241,234,0.7)';
  c.fillText('ISO 800   F2.8   1/50   WB 3200K', 150, H - 126);
  const [l1, l2] = o.lvl ?? [0, 0];
  c.textAlign = 'right'; c.fillText('CH1', W - 520, H - 140); c.fillText('CH2', W - 520, H - 110);
  for (const [k, v] of [[0, l1], [1, l2]] as const) {
    for (let i = 0; i < 16; i++) {
      const on = i / 16 < v, col = i > 13 ? '#ff3b3b' : i > 10 ? HEX.yellow : HEX.lime;
      c.fillStyle = on ? col : 'rgba(244,241,234,0.12)';
      c.fillRect(W - 500 + i * 22, H - 150 + k * 30, 18, 18);
    }
  }
  // the autofocus box, hunting
  if (o.af) {
    const { x, y, lock, label } = o.af, w = 120 - 30 * lock, h = 90 - 20 * lock;
    c.strokeStyle = lock > 0.5 ? HEX.lime : ink; c.lineWidth = 3;
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
      c.beginPath(); c.moveTo(x + sx * w / 2, y + sy * (h / 2 - 18)); c.lineTo(x + sx * w / 2, y + sy * h / 2); c.lineTo(x + sx * (w / 2 - 18), y + sy * h / 2); c.stroke();
    }
    c.font = font(FAM.monoB(), 18); c.textAlign = 'left'; c.fillStyle = lock > 0.5 ? HEX.lime : ink;
    c.fillText(label, x - w / 2, y - h / 2 - 16);
  }
  // LENS CAP, blinking amber
  if (o.warn && Math.floor(t * 2.6) % 2 === 0) {
    c.font = font(FAM.monoB(), 40); c.textAlign = 'left';
    const msg = 'LENS CAP', tw = c.measureText(msg).width, bw = tw + 120, bx = W / 2 - bw / 2, by = H / 2 + 50;
    c.fillStyle = 'rgba(20,12,4,0.8)'; c.fillRect(bx, by, bw, 66);
    c.strokeStyle = '#ffb020'; c.lineWidth = 4; c.strokeRect(bx, by, bw, 66);
    c.fillStyle = '#ffb020';
    c.beginPath(); c.moveTo(bx + 46, by + 14); c.lineTo(bx + 70, by + 54); c.lineTo(bx + 22, by + 54); c.closePath(); c.fill();
    c.fillStyle = '#140c04'; c.fillRect(bx + 44, by + 26, 4, 15); c.fillRect(bx + 44, by + 45, 4, 4);
    c.fillStyle = '#ffb020'; c.fillText(msg, bx + 92, by + 35);
    g.fillStyle = rgbaHex('#ffb020', 0.22 * a); g.fillRect(bx - 6, by - 6, bw + 12, 78);
  }
  c.restore();
}

/** Where the autofocus box is at t: hunting from point to point every few beats (deterministic). */
export function afHunt(t: number, period = 0.43): { x: number; y: number } {
  const k = Math.floor(t / period), u = ease.inOutCubic(clamp((t / period - k) / 0.35));
  const p = (i: number) => ({ x: W * (0.32 + 0.36 * h01(i, 11, 5)), y: H * (0.3 + 0.32 * h01(i, 12, 5)) });
  const a = p(k), b = p(k + 1);
  return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
}
