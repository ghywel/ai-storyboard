// The studio scoreboard (the ledger) for v1's "nothing" beat (uptheroad.ts), as LEDs: HER SCORE across the top, the
// woman with her child in lime dots (the live feed's image, rocking), and on the right the ledger's eye, which forms,
// looks at her, blinks, closes, and writes a pink zero in its place; a red minus flickers before the zero and is wiped.
// The same board appears full frame and small in the wide shot (the kit's scoreboard on the set), so both are drawn
// from one description at two LED resolutions.
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import { clamp } from '../../engine/util';
import { FAM, TAU } from '../_motifs';
import { cast } from './_cast';
import { LedMatrix } from './pitch-kit';

type C2 = CanvasRenderingContext2D;

export interface BoardState {
  /** HER SCORE lit 0..1, and her figure lit 0..1 (rocking by herT) */
  title: number;
  her: number;
  herT: number;
  /** the eye: formed 0..1, pupils -1 (at her) .. 1, lids 0 open .. 1 shut */
  eye: number;
  look: number;
  blink: number;
  /** the scan line sweeping across her, 0..1 (outside that, none) */
  scan: number;
  /** the zero written 0..1 */
  zero: number;
  /** the minus showing (0/1) and the wipe across it 0..1 (-1 none yet) */
  minus: number;
  wipe: number;
}

export const BOARD_FULL = { cols: 120, rows: 67 };
export const BOARD_SMALL = { cols: 64, rows: 36 };

interface Layout { title: [number, number, number]; her: [number, number, number]; eye: [number, number, number, number]; zero: [number, number, number, number, number]; minus: [number, number, number, number] }
const FULL: Layout = { title: [60, 8, 12], her: [32, 55, 38], eye: [84, 32, 23, 12], zero: [84, 32, 11, 17, 3.6], minus: [60, 32, 10, 3.2] };
// the small board's matrix sits under its own HER SCORE (the kit's ledText), 64 x 36 LEDs
const SMALL: Layout = { title: [32, 4, 7], her: [16, 34, 30], eye: [45, 16, 14, 8], zero: [45, 16, 8, 13, 3], minus: [30, 16, 7, 2.6] };

/** Draw the board's state into a matrix of the full or the small size. */
export function boardMatrix(m: LedMatrix, st: BoardState, small = false) {
  const L = small ? SMALL : FULL, x = m.cx as unknown as C2;
  m.clear();
  x.save();
  // HER SCORE
  if (st.title > 0) {
    x.globalAlpha = clamp(st.title);
    x.font = font(FAM.monoB(), L.title[2]); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = HEX.bone;
    x.fillText('HER SCORE', L.title[0], L.title[1]);
    x.globalAlpha = 1;
  }
  // her, with her child, rocking (the feed's picture, in the ledger's own lime)
  if (st.her > 0) {
    x.save(); x.globalAlpha = clamp(st.her);
    const [hx, hy, hh] = L.her, rock = 0.045 * Math.sin(st.herT * 2.4);
    x.translate(hx, hy); x.rotate(rock); x.translate(-hx, -hy);
    cast(x, 'woman', hx, hy, hh, 'hold', { col: HEX.lime, t: st.herT, headTilt: 0.3 });
    x.restore();
  }
  // the scan line sweeping over her
  if (st.scan > 0 && st.scan < 1) {
    const [hx, hy, hh] = L.her, sx = hx + hh * 0.45 - st.scan * hh * 0.9;
    x.fillStyle = HEX.bone; x.fillRect(sx, hy - hh * 1.02, small ? 1 : 1.4, hh * 1.02);
  }
  // the eye
  if (st.eye > 0.01) {
    const [ex, ey, ew, eh0] = L.eye, eh = eh0 * (1 - clamp(st.blink));
    x.save();
    x.beginPath(); x.arc(ex, ey, (ew + 6) * clamp(st.eye), 0, TAU); x.clip();   // it forms from the middle out
    x.strokeStyle = HEX.bone; x.lineWidth = small ? 1.4 : 2;
    x.beginPath(); x.moveTo(ex - ew, ey); x.quadraticCurveTo(ex, ey - eh * 1.7, ex + ew, ey); x.quadraticCurveTo(ex, ey + eh * 1.7, ex - ew, ey); x.stroke();
    if (eh > 1) {
      x.save();
      x.beginPath(); x.moveTo(ex - ew, ey); x.quadraticCurveTo(ex, ey - eh * 1.7, ex + ew, ey); x.quadraticCurveTo(ex, ey + eh * 1.7, ex - ew, ey); x.clip();
      const ix = ex + st.look * ew * 0.42, ir = eh0 * 0.78;
      x.fillStyle = HEX.lime; x.beginPath(); x.arc(ix, ey, ir, 0, TAU); x.fill();
      x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.arc(ix, ey, ir * 0.45, 0, TAU); x.fill();
      x.globalCompositeOperation = 'source-over';
      x.fillStyle = HEX.bone; x.beginPath(); x.arc(ix + ir * 0.35, ey - ir * 0.35, ir * 0.18, 0, TAU); x.fill();   // the glint
      x.restore();
    }
    // lashes
    x.strokeStyle = HEX.bone; x.lineWidth = small ? 1 : 1.5;
    for (const k of [-0.5, 0, 0.5]) { const lx = ex + k * ew * 0.9, ly = ey - eh * 1.25 * (1 - k * k * 0.6); x.beginPath(); x.moveTo(lx, ly); x.lineTo(lx + k * 3, ly - (small ? 3 : 4.5)); x.stroke(); }
    x.restore();
  }
  // the zero, written stroke by stroke from the top
  if (st.zero > 0) {
    const [zx, zy, rx, ry, lw] = L.zero;
    x.strokeStyle = HEX.pink; x.lineWidth = lw; x.lineCap = 'round';
    x.beginPath(); x.ellipse(zx, zy, rx, ry, 0, -Math.PI / 2, -Math.PI / 2 + clamp(st.zero) * TAU); x.stroke();
  }
  // the minus before it, and the wipe that takes it away
  if (st.minus > 0 || (st.wipe >= 0 && st.wipe < 1)) {
    const [mx, my, mw, mh] = L.minus, wx = mx - mw / 2 - 2 + clamp(st.wipe < 0 ? 0 : st.wipe) * (mw + 4);
    x.save();
    if (st.wipe >= 0) { x.beginPath(); x.rect(wx, 0, 999, 999); x.clip(); }
    if (st.minus > 0) { x.fillStyle = '#ff3b3b'; x.fillRect(mx - mw / 2, my - mh / 2, mw, mh); }
    x.restore();
    if (st.wipe >= 0 && st.wipe < 1) { x.fillStyle = HEX.bone; x.fillRect(wx - 0.5, my - mh * 2.6, small ? 1 : 1.5, mh * 5.2); }
  }
  x.restore();
}

/** The full-frame board's bezel over the LED field: a dark frame with brass trim and rivets, a glass sheen. */
export function bezel(c: C2, w: number, h: number) {
  c.save();
  c.fillStyle = '#0c0a12';
  c.beginPath(); c.rect(-40, -40, w + 80, h + 80); c.roundRect(26, 22, w - 52, h - 44, 18); c.fill('evenodd');
  c.strokeStyle = '#6a5a3a'; c.lineWidth = 6; c.beginPath(); c.roundRect(26, 22, w - 52, h - 44, 18); c.stroke();
  c.fillStyle = '#b98a3e';
  for (let i = 0; i < 16; i++) { const px = 60 + i * ((w - 120) / 15); c.beginPath(); c.arc(px, 11, 4, 0, TAU); c.arc(px, h - 11, 4, 0, TAU); c.fill(); }
  const sh = c.createLinearGradient(0, 0, w, h);
  sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(0.35, 'rgba(255,255,255,0.035)'); sh.addColorStop(0.4, 'rgba(255,255,255,0)');
  c.fillStyle = sh; c.fillRect(0, 0, w, h);
  c.restore();
}
