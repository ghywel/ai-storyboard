// The vote's props (TREATMENT-v1.md, pre-chorus 1), also used by number1 where the vote hands over:
// - the applause meter: the S.S. IRON HULL's brass engine-room telegraph, salvaged and relabelled with tape (its old
//   FULL AHEAD legend still shows): worth measured in claps, flown in from the rigging on chains;
// - the audience's scorecards of tiny story pictures (a raft with the pole through the stone, a wedding garland, a
//   handshake, a storm; a heart from C7's neighbour), and their plain backs seen from the stage side;
// - Rai's outline as tiny glowing words: the island's sayings about her, because she was never really stone.
import { W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import { clamp, ease, frameIdx } from '../../engine/util';
import { h01 } from '../_rai';
import { FAM, TAU, rgbaHex, slam } from '../_motifs';
import { sweatDrop, popIn } from '../_manga';
import { octopus, type ScoreRow } from './_studio';

type C2 = CanvasRenderingContext2D;

/** Where the meter hangs on the set: between the ring of bulbs and the studio screen, above stage right. */
export const METER = { x: 1360, y: 318, r: 84 };

/**
 * The applause meter at (x, y), radius r: needle value v (0 = MEH .. 1 = !!!), the claps counter, chains up to `top`.
 */
export function applauseMeter(c: C2, g: C2, x: number, y: number, r: number, t: number, v: number, claps: number, top = -60) {
  c.save();
  // the chains from the flies
  c.strokeStyle = '#2c2634'; c.lineWidth = Math.max(2, r * 0.05); c.lineCap = 'butt';
  c.setLineDash([r * 0.1, r * 0.05]);
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x + s * r * 0.5, top); c.lineTo(x + s * r * 0.5, y - r * 0.86); c.stroke(); }
  c.setLineDash([]);
  // the brass case and its rivets
  const bg = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.02);
  bg.addColorStop(0, '#f6d888'); bg.addColorStop(0.55, '#c9973e'); bg.addColorStop(1, '#6e4a1a');
  c.fillStyle = bg; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.strokeStyle = '#4a3010'; c.lineWidth = r * 0.03; c.stroke();
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * TAU + 0.13;
    c.fillStyle = '#ffe6a8'; c.beginPath(); c.arc(x + Math.cos(a) * r * 0.91, y + Math.sin(a) * r * 0.91, r * 0.032, 0, TAU); c.fill();
  }
  // the face
  const fr = r * 0.8, px = x, py = y + fr * 0.2;
  c.fillStyle = '#f3ead6'; c.beginPath(); c.arc(x, y, fr, 0, TAU); c.fill();
  c.strokeStyle = '#8a6a3a'; c.lineWidth = r * 0.02; c.stroke();
  // five bands across the top
  const bands = ['#9aa0ae', HEX.peri, HEX.yellow, HEX.orange, HEX.pink], labels = ['MEH', 'NICE', 'OOH', 'WOW', '!!!'];
  for (let k = 0; k < 5; k++) {
    const a0 = Math.PI + (k / 5) * Math.PI, a1 = a0 + Math.PI / 5, am = (a0 + a1) / 2;
    c.strokeStyle = bands[k]!; c.lineWidth = fr * 0.17;
    c.beginPath(); c.arc(px, py, fr * 0.68, a0 + 0.025, a1 - 0.025); c.stroke();
    c.save(); c.translate(px + Math.cos(am) * fr * 0.44, py + Math.sin(am) * fr * 0.44); c.rotate(am + Math.PI / 2);
    c.font = font(FAM.monoB(), fr * 0.12); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#2a1d14';
    c.fillText(labels[k]!, 0, 0); c.restore();
  }
  // ticks
  c.strokeStyle = '#2a1d14'; c.lineWidth = r * 0.015;
  for (let k = 0; k <= 20; k++) {
    const a = Math.PI + (k / 20) * Math.PI, r0 = fr * (k % 4 ? 0.79 : 0.76);
    c.beginPath(); c.moveTo(px + Math.cos(a) * r0, py + Math.sin(a) * r0); c.lineTo(px + Math.cos(a) * fr * 0.84, py + Math.sin(a) * fr * 0.84); c.stroke();
  }
  // the old legend, half under the tape: the ship's telegraph (FULL AHEAD), relabelled APPLAUSE
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.save(); c.translate(px, y - fr * 0.8); c.rotate(-0.06);
  c.fillStyle = '#f0e2b0'; c.fillRect(-fr * 0.42, -fr * 0.09, fr * 0.84, fr * 0.18);
  c.font = font(FAM.hook(), fr * 0.13); c.fillStyle = '#b0306a'; c.fillText('APPLAUSE', 0, fr * 0.01);
  c.restore();
  // the claps counter, an odometer under the pivot
  const cw = fr * 0.7, ch = fr * 0.2, cy = py + fr * 0.28;
  c.fillStyle = '#16121c'; c.fillRect(px - cw / 2, cy - ch / 2, cw, ch);
  c.font = font(FAM.monoB(), fr * 0.15); c.fillStyle = '#f4f1ea';
  c.fillText(String(Math.max(0, Math.floor(claps))).padStart(5, '0'), px, cy + fr * 0.01);
  c.font = font(FAM.monoB(), fr * 0.08); c.fillStyle = '#5a3c16'; c.fillText('CLAPS', px, cy + fr * 0.2);
  // the needle
  const a = Math.PI + clamp(v, -0.03, 1.05) * Math.PI;
  c.strokeStyle = '#c8282a'; c.lineWidth = r * 0.045; c.lineCap = 'round';
  c.beginPath(); c.moveTo(px - Math.cos(a) * fr * 0.14, py - Math.sin(a) * fr * 0.14); c.lineTo(px + Math.cos(a) * fr * 0.76, py + Math.sin(a) * fr * 0.76); c.stroke();
  c.fillStyle = '#1a1420'; c.beginPath(); c.arc(px, py, fr * 0.09, 0, TAU); c.fill();
  c.fillStyle = '#e0b860'; c.beginPath(); c.arc(px, py, fr * 0.04, 0, TAU); c.fill();
  // the glass and its glint
  c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = r * 0.05;
  c.beginPath(); c.arc(x, y, fr * 0.88, Math.PI * 1.1, Math.PI * 1.4); c.stroke();
  // the ship's plate under the case (where it came from: the trader's ship)
  c.fillStyle = '#5a3c16'; c.beginPath(); c.roundRect(x - r * 0.62, y + r * 1.02, r * 1.24, r * 0.24, r * 0.05); c.fill();
  c.font = font(FAM.monoB(), r * 0.12); c.fillStyle = '#e8c27a'; c.fillText('S.S. IRON HULL', x, y + r * 1.15);
  c.restore();
  // the top band glows when the needle gets there
  if (v > 0.75) {
    g.strokeStyle = rgbaHex(HEX.pink, 0.6 * clamp((v - 0.75) / 0.2)); g.lineWidth = fr * 0.24;
    g.beginPath(); g.arc(px, py, fr * 0.68, Math.PI * 1.8, Math.PI * 2); g.stroke();
  }
}

/** The needle over the vote: up from the meter's arrival to the top on "say", then wobbling at the top. */
export function meterValue(t: number, k: { worth: number; what: number; say: number }) {
  if (t < k.worth) return 0.03;
  const u = clamp((t - k.worth) / (k.say + 0.25 - k.worth));
  const base = 0.03 + 0.92 * (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
  const jit = 0.03 * Math.sin(t * 17) + 0.02 * Math.sin(t * 31 + 1);
  const top = t > k.say ? 0.06 * Math.sin((t - k.say) * 9) + 0.025 * Math.sin(t * 23) : 0;
  return base + jit * u + top;
}
export const clapsAt = (t: number, k: { worth: number; say: number }) =>
  t < k.worth ? 0 : 3 + 2417 * Math.pow(clamp((t - k.worth) / (k.say + 0.6 - k.worth)), 1.7) + (t > k.say + 0.6 ? (t - k.say - 0.6) * 140 : 0);

// ------------------------------------------------------------------ scorecards

export type Pic = 'raft' | 'garland' | 'hands' | 'storm' | 'heart' | 'back';
export const PICS: Pic[] = ['raft', 'garland', 'hands', 'storm'];

/** A glowing scorecard on a stick, centred (x, y), scale s, showing a tiny picture instead of a number. */
export function scorecard(c: C2, g: C2, x: number, y: number, s: number, pic: Pic, t: number, rot = 0) {
  const w = 84 * s, h = 64 * s;
  // the glow is a halo around the card, never over its face (the glow layer is added on top)
  g.strokeStyle = 'rgba(255,226,160,0.42)'; g.lineWidth = 9 * s;
  g.beginPath(); g.roundRect(x - w / 2 - 6 * s, y - h / 2 - 6 * s, w + 12 * s, h + 12 * s, 11 * s); g.stroke();
  c.save(); c.translate(x, y); c.rotate(rot);
  c.strokeStyle = '#7a5a3a'; c.lineWidth = 5 * s; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, h / 2); c.lineTo(0, h / 2 + 46 * s); c.stroke();
  c.fillStyle = '#efe3c6'; c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, 7 * s); c.fill();
  c.strokeStyle = '#c9a26a'; c.lineWidth = 2.5 * s; c.stroke();
  drawPic(c, pic, s, t);
  c.restore();
}

function drawPic(c: C2, pic: Pic, s: number, t: number) {
  c.lineCap = 'round'; c.lineJoin = 'round';
  switch (pic) {
    case 'raft': { // the raft with the stone lashed upright, the pole through its heart, on a wave
      c.fillStyle = '#3fb6d8';
      c.beginPath(); c.moveTo(-36 * s, 20 * s);
      for (let k = 0; k <= 8; k++) c.lineTo(-36 * s + k * 9 * s, 16 * s + 3 * s * Math.sin(k * 1.6 + t * 3));
      c.lineTo(36 * s, 28 * s); c.lineTo(-36 * s, 28 * s); c.closePath(); c.fill();
      c.fillStyle = '#8a5a34'; c.fillRect(-26 * s, 8 * s, 52 * s, 9 * s);
      c.strokeStyle = '#5a3a22'; c.lineWidth = 1.5 * s;
      for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(-26 * s + k * 10.4 * s, 8 * s); c.lineTo(-26 * s + k * 10.4 * s, 17 * s); c.stroke(); }
      c.fillStyle = '#d9cfb8'; c.beginPath(); c.arc(0, -6 * s, 14 * s, 0, TAU); c.fill();
      c.strokeStyle = '#6f6656'; c.lineWidth = 1.8 * s; c.stroke();
      c.fillStyle = '#3a2f2a'; c.beginPath(); c.arc(0, -6 * s, 4.5 * s, 0, TAU); c.fill();
      c.strokeStyle = '#7a5a3a'; c.lineWidth = 3.4 * s;
      c.beginPath(); c.moveTo(-24 * s, -6 * s); c.lineTo(24 * s, -6 * s); c.stroke();
      break;
    }
    case 'garland': { // a wedding garland: a ring of flowers
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * TAU, fx = Math.cos(a) * 17 * s, fy = Math.sin(a) * 17 * s;
        c.fillStyle = k % 2 ? '#3a9a4a' : ['#ff4f9a', '#ffd23f', '#ffffff'][(k / 2) % 3 | 0]!;
        c.beginPath(); c.arc(fx, fy, (k % 2 ? 3.5 : 5.5) * s, 0, TAU); c.fill();
      }
      c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(0, 0, 3 * s, 0, TAU); c.fill();
      break;
    }
    case 'hands': { // a handshake: two sleeves meeting, the hands clasped
      c.strokeStyle = HEX.peri; c.lineWidth = 11 * s;
      c.beginPath(); c.moveTo(-38 * s, 20 * s); c.lineTo(-10 * s, 2 * s); c.stroke();
      c.strokeStyle = HEX.coral;
      c.beginPath(); c.moveTo(38 * s, 20 * s); c.lineTo(10 * s, 2 * s); c.stroke();
      c.fillStyle = '#e6c9a2'; c.beginPath(); c.ellipse(0, -1 * s, 13 * s, 8.5 * s, -0.15, 0, TAU); c.fill();
      c.strokeStyle = '#a5805a'; c.lineWidth = 1.6 * s;
      for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(-6 * s + k * 5 * s, -7 * s); c.lineTo(-3 * s + k * 5 * s, 5 * s); c.stroke(); }
      break;
    }
    case 'storm': { // a storm: a dark cloud, the bolt, rain
      c.fillStyle = '#4a4f66';
      c.beginPath(); c.arc(-12 * s, -10 * s, 11 * s, 0, TAU); c.arc(2 * s, -15 * s, 13 * s, 0, TAU); c.arc(15 * s, -9 * s, 10 * s, 0, TAU); c.fill();
      c.fillRect(-22 * s, -10 * s, 46 * s, 10 * s);
      c.fillStyle = HEX.yellow;
      c.beginPath(); c.moveTo(2 * s, 0); c.lineTo(-7 * s, 14 * s); c.lineTo(0, 14 * s); c.lineTo(-5 * s, 27 * s); c.lineTo(10 * s, 9 * s); c.lineTo(3 * s, 9 * s); c.lineTo(8 * s, 0); c.closePath(); c.fill();
      c.strokeStyle = '#3fb6d8'; c.lineWidth = 2 * s;
      for (let k = 0; k < 4; k++) { const rx = -20 * s + k * 13 * s; c.beginPath(); c.moveTo(rx, 4 * s); c.lineTo(rx - 3 * s, 12 * s); c.stroke(); }
      break;
    }
    case 'heart': {
      c.fillStyle = HEX.pink;
      c.beginPath(); c.moveTo(0, 18 * s);
      c.bezierCurveTo(-30 * s, -2 * s, -14 * s, -24 * s, 0, -9 * s);
      c.bezierCurveTo(14 * s, -24 * s, 30 * s, -2 * s, 0, 18 * s); c.fill();
      break;
    }
    case 'back': { // the back of a card: the show's gold star
      c.fillStyle = HEX.gold;
      c.beginPath();
      for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k / 10) * TAU, rr = (k % 2 ? 8 : 19) * s; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      c.closePath(); c.fill();
      break;
    }
  }
}

// ------------------------------------------------------------------ her outline in words

const SAYINGS = "WE KNOW SHE'S DOWN THERE · SHE PAID FOR THE WEDDING · OUR GREAT-GRANDMOTHER'S STONE · SHE SETTLED THE FEUD · STILL OURS · ";
const HEART_WORDS = 'STILL OURS · ';

/**
 * Rai's outline as tiny glowing words: her disc's rim, her head's and the hole that is her heart, each a ring of the
 * island's sayings about her. (x, y) her disc's centre, R its radius (drawRai's), a the strength (it flickers).
 */
export function outlineWords(c: C2, g: C2, x: number, y: number, R: number, t: number, a: number) {
  if (a <= 0.01) return;
  const size = R * 0.1, step = size * 0.66, k2 = Math.floor(frameIdx(t) / 2);
  const ring = (cx: number, cy: number, rr: number, text: string, off: number, dir: number) => {
    const n = Math.floor((TAU * rr) / step);
    g.strokeStyle = rgbaHex(HEX.gold, 0.1 * a); g.lineWidth = size * 1.1;
    g.beginPath(); g.arc(cx, cy, rr, 0, TAU); g.stroke();
    c.font = font(FAM.monoB(), size); c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let i = 0; i < n; i++) {
      const ch = text[(i + Math.floor(off)) % text.length]!;
      if (ch === ' ') continue;
      const ang = -Math.PI / 2 + dir * ((i / n) * TAU + t * 0.25);
      const fl = h01(i, k2, 7) < 0.12 ? 0.35 : 1;
      c.save();
      c.globalAlpha *= a * fl;
      c.translate(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr); c.rotate(ang + Math.PI / 2);
      c.fillStyle = i % 9 === 0 ? '#fff6d8' : HEX.gold;
      c.fillText(ch, 0, 0);
      c.restore();
    }
  };
  ring(x, y, R, SAYINGS, 0, 1);
  ring(x, y - 1.2 * R, 0.74 * R + size * 0.3, SAYINGS, 41, 1);
  ring(x, y + 0.12 * R, 0.27 * R + size * 0.2, HEART_WORDS, 0, 1);
}

/** The house lights' level over the vote's opening: up for the end of the twist, then dropped on the first word. */
export const houseAt = (t: number, drop: number) => (t < drop ? 0.72 : 0.72 - 0.62 * clamp((t - drop) / 0.55));


// ------------------------------------------------------------------ the floor manager, the "?", the board

/** The octopus floor manager's mark at stage left (in front of the curtain). */
export const OCT = { x: W * 0.2, y: H * 0.6 };
/** The scoreboard as the twist left it. */
export const NET_WORTH: ScoreRow[] = [{ text: 'NET WORTH', col: HEX.bone }, { text: 'AGREED', col: HEX.gold }];

/** The "?" that ends the vote and opens number1 (number1 blows it away when the curtain opens). */
export const BIG_Q = { x: W / 2 + 40, y: 330, size: 620, rot: 0.07 };
/** The giant "?" behind her (set space, the CAM 1 wide): slammed on "me?"; number1 blows it away at `t1`. */
export function bigQ(c: C2, t: number, t0: number, t1?: number) {
  slam(c, '?', BIG_Q.x, BIG_Q.y, BIG_Q.size, t, t0, { col: HEX.yellow, shadow: HEX.ink, shadowOff: 0.05, rot: BIG_Q.rot, t1, exit: 0.12 });
}

/** The floor manager, unsure: YES in one tentacle, NO in the other, leaning from one to the other. */
export function octoUnsure(c: C2, g: C2, t: number, t0: number, q = true) {
  const lean = 0.13 * Math.sin((t - t0) * 7.5), up2 = ease.outBack(clamp((t - t0 - 0.12) / 0.25));
  c.save();
  c.translate(OCT.x, OCT.y + 110); c.rotate(lean); c.translate(-OCT.x, -(OCT.y + 110));
  // the NO card in the left tentacles (the kit's card holds YES on the right)
  c.save(); c.translate(OCT.x, OCT.y);
  c.save(); c.translate(-120, -40 - 50 * up2 + 14 * Math.sin((t - t0) * 7.5)); c.rotate(-0.08 * Math.sin(t * 3));
  c.strokeStyle = '#c65cf0'; c.lineWidth = 12; c.lineCap = 'round';
  c.beginPath(); c.moveTo(90, 110 + 50 * up2); c.quadraticCurveTo(60, 60, 50, 30); c.stroke();
  if (up2 > 0) {
    c.font = font(FAM.hook(), 36);
    c.fillStyle = '#f4f1ea'; c.beginPath(); c.roundRect(-75, -40, 150, 80, 8); c.fill();
    c.strokeStyle = '#2a1d14'; c.lineWidth = 4; c.stroke();
    c.fillStyle = '#120d1d'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('NO', 0, 2);
  }
  c.restore();
  c.restore();
  octopus(c, g, OCT.x, OCT.y, 1, t, { card: 'YES', cardT0: t0 });
  c.restore();
  // a sweat drop and a question
  const sp = popIn(t, t0 + 0.25);
  if (sp > 0) sweatDrop(c, OCT.x + 54, OCT.y - 52, 20 * sp);
  const qp = q ? popIn(t, t0 + 0.4) : 0;
  if (qp > 0) {
    c.save(); c.translate(OCT.x, OCT.y - 168); c.scale(qp, qp);
    c.font = font(FAM.hook(), 64); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = HEX.ink; c.fillText('?', 4, 4); c.fillStyle = HEX.bone; c.fillText('?', 0, 0);
    c.restore();
  }
}
