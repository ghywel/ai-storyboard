// v1's recurring cast (TREATMENT-v1.md): faceless person() silhouettes, each with one telling accessory, so the same
// people read as the same people from plate to plate (the trader in pitch and the lift, the woman in the outside
// broadcast, chorus 2, the lift and the living room...). Rai is the only face.
import { HEX } from '../../engine/palette';
import { person, type Pose, type Emote } from '../_motifs';

type C2 = CanvasRenderingContext2D;
const TAU = Math.PI * 2;

export type Who = 'trader' | 'woman' | 'child' | 'housekeeper' | 'husband' | 'strangerA' | 'strangerB' | 'panel1' | 'panel2' | 'panel3';
export interface CastOpts { col?: string; flip?: boolean; t?: number; headTilt?: number; rim?: string; emote?: Emote; emoteT0?: number; prop?: boolean }

/** Where person()'s head is for a pose, relative to the feet (units of h/100). */
function headOf(pose: Pose): { x: number; y: number } {
  const slump = pose === 'slump' || pose === 'face' ? 1 : 0, seated = pose === 'seated';
  const shY = (seated ? -76 : -78) + slump * 6;
  return { x: slump * 8 * 1.3, y: shY - 10 + slump * 5 };
}

/**
 * One of the cast, feet at (x, y), height h. The woman in 'hold' carries her child; `prop` (default on) draws the
 * trader's crate-pushing hands free, the housekeeper's mop, stranger A's parcel and stranger B's coin.
 */
export function cast(c: C2, who: Who, x: number, y: number, h: number, pose: Pose = 'stand', o: CastOpts = {}) {
  const col = o.col ?? HEX.ink, u = h / 100, hd = headOf(pose), f = o.flip ? -1 : 1;
  const hx = x + f * hd.x * u, hy = y + hd.y * u;
  const prop = o.prop !== false;
  // props behind the body
  if (who === 'housekeeper' && prop) { // the mop, leaning on her shoulder
    c.save(); c.strokeStyle = '#8a6a44'; c.lineWidth = 3 * u; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x + f * 16 * u, y - 96 * u); c.lineTo(x + f * 30 * u, y); c.stroke();
    c.fillStyle = '#d9cfb8'; c.beginPath(); c.ellipse(x + f * 30 * u, y - 3 * u, 12 * u, 5 * u, 0, 0, TAU); c.fill();
    c.restore();
  }
  person(c, x, y, h, pose, { col, flip: o.flip, t: o.t, headTilt: o.headTilt, rim: o.rim, emote: o.emote, emoteT0: o.emoteT0, seed: who.length });
  c.save(); c.fillStyle = col; c.strokeStyle = col;
  switch (who) {
    case 'trader': // a peaked captain's cap and a long coat's hem
      c.beginPath(); c.ellipse(hx, hy - 6 * u, 11 * u, 5 * u, 0, 0, TAU); c.fill();
      c.fillRect(hx - 9 * u, hy - 12 * u, 18 * u, 7 * u);
      c.beginPath(); c.moveTo(hx + f * 4 * u, hy - 3 * u); c.lineTo(hx + f * 17 * u, hy - 1 * u); c.lineTo(hx + f * 4 * u, hy + 1 * u); c.fill();
      c.fillStyle = HEX.gold; c.fillRect(hx - 3 * u, hy - 10 * u, 6 * u, 3 * u);
      break;
    case 'woman': // a bun at the back of the head
      c.beginPath(); c.arc(hx - f * 9 * u, hy - 3 * u, 5.5 * u, 0, TAU); c.fill();
      break;
    case 'child': // two bunches
      c.beginPath(); c.arc(hx - 9 * u, hy - 5 * u, 4.5 * u, 0, TAU); c.arc(hx + 9 * u, hy - 5 * u, 4.5 * u, 0, TAU); c.fill();
      break;
    case 'housekeeper': // a headscarf knot
      c.beginPath(); c.moveTo(hx - f * 7 * u, hy - 3 * u); c.lineTo(hx - f * 16 * u, hy - 9 * u); c.lineTo(hx - f * 15 * u, hy + 1 * u); c.closePath(); c.fill();
      break;
    case 'husband': // a tie
      c.fillStyle = HEX.coral;
      c.beginPath(); c.moveTo(x + f * 1 * u, y - 72 * u); c.lineTo(x + f * 4 * u, y - 72 * u); c.lineTo(x + f * 5 * u, y - 56 * u); c.lineTo(x + f * 2.5 * u, y - 52 * u); c.lineTo(x, y - 56 * u); c.closePath(); c.fill();
      break;
    case 'strangerA': // a backpack, and a parcel held out
      c.beginPath(); c.roundRect(x - f * 18 * u - (f < 0 ? -0 : 0), y - 76 * u, 10 * u, 24 * u, 3 * u); c.fill();
      if (prop) { c.fillStyle = '#c99a5a'; c.fillRect(x + f * 18 * u - 7 * u, y - 70 * u, 14 * u, 11 * u); c.strokeStyle = '#7a5a2e'; c.lineWidth = 1.2 * u; c.strokeRect(x + f * 18 * u - 7 * u, y - 70 * u, 14 * u, 11 * u); }
      break;
    case 'strangerB': // a bobble hat, and a coin held up
      c.beginPath(); c.arc(hx, hy - 4 * u, 9.5 * u, Math.PI, 0); c.fill();
      c.beginPath(); c.arc(hx, hy - 15 * u, 3.5 * u, 0, TAU); c.fill();
      if (prop) { c.fillStyle = HEX.gold; c.beginPath(); c.arc(x + f * 20 * u, y - 82 * u, 4.5 * u, 0, TAU); c.fill(); }
      break;
    case 'panel1': // glasses glinting
      c.strokeStyle = '#cfd6e6'; c.lineWidth = 1.4 * u;
      c.beginPath(); c.arc(hx + f * 3 * u, hy, 3 * u, 0, TAU); c.arc(hx + f * 9 * u, hy, 3 * u, 0, TAU); c.stroke();
      break;
    case 'panel2': // a bob
      c.beginPath(); c.arc(hx, hy - 1 * u, 11 * u, Math.PI * 0.95, Math.PI * 2.05); c.lineTo(hx + 11 * u, hy + 6 * u); c.lineTo(hx - 11 * u, hy + 6 * u); c.closePath(); c.fill();
      break;
    case 'panel3': // a tall quiff
      c.beginPath(); c.moveTo(hx - 7 * u, hy - 6 * u); c.quadraticCurveTo(hx + f * 2 * u, hy - 24 * u, hx + f * 12 * u, hy - 9 * u); c.closePath(); c.fill();
      break;
  }
  c.restore();
}
