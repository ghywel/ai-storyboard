// The show's lighting states shared by onair, archive and twist (so the cuts between them match): the spots crossing
// on the stage once the show is on, a single spot from directly above (the reveal), and the studio screen switched
// off before ON AIR.
import { W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { rgbaHex, TAU } from '../_motifs';
import { SET, type Spot, scanlines } from './_studio';
import type { C2 } from './onair-kit';

/** The three spots crossing on the stage once the show is on (pink, yellow, cyan), swinging slowly. */
export function showSpots(t: number, x = W / 2, a = 1): Spot[] {
  return [
    { x: x - 60 + 70 * Math.sin(t * 1.1), col: HEX.pink, a, r: 160 },
    { x: x + 90 * Math.sin(t * 0.8 + 2), col: HEX.yellow, a: 0.8 * a, r: 150 },
    { x: x + 60 + 70 * Math.sin(t * 1.3 + 4), col: HEX.cyan, a, r: 160 },
  ];
}

/**
 * One spotlight straight down from the rigging onto stage point (x, floor). The cone is screened onto the main layer
 * (draw this BEFORE the performer, so she stands in it rather than under a pink wash); the pool glows.
 */
export function topSpot(c: C2, g: C2, x: number, col: string, a = 1, r = 175, floor = SET.floor) {
  c.save(); c.globalCompositeOperation = 'screen';
  const cg = c.createLinearGradient(x, -40, x, floor);
  cg.addColorStop(0, rgbaHex(col, 0.08 * a)); cg.addColorStop(1, rgbaHex(col, 0.42 * a));
  c.fillStyle = cg;
  c.beginPath(); c.moveTo(x - 26, -40); c.lineTo(x + 26, -40); c.lineTo(x + r, floor); c.lineTo(x - r, floor); c.closePath(); c.fill();
  c.restore();
  g.fillStyle = rgbaHex(col, 0.34 * a); g.beginPath(); g.ellipse(x, floor, r, r * 0.2, 0, 0, TAU); g.fill();
}

/** The studio screen before the show goes on air: a dark CRT with a standby dot. */
export function screenOff(c: C2, g: C2, x: number, y: number, w: number, h: number) {
  c.fillStyle = '#07090f'; c.fillRect(x, y, w, h);
  c.fillStyle = 'rgba(120,140,170,0.06)'; c.beginPath(); c.ellipse(x + w * 0.35, y + h * 0.3, w * 0.3, h * 0.18, -0.3, 0, TAU); c.fill();
  c.fillStyle = '#ff3b3b'; c.beginPath(); c.arc(x + w - 22, y + h - 20, 4, 0, TAU); c.fill();
  g.fillStyle = 'rgba(255,59,59,0.35)'; g.beginPath(); g.arc(x + w - 22, y + h - 20, 9, 0, TAU); g.fill();
  scanlines(c, x, y, w, h, 0.1);
}

/** Rai's standard place on the wide set: her disc's centre for radius R with her feet on the stage floor. */
export const raiAt = (R = 150, x = W / 2) => ({ x, y: SET.floor - 1.07 * R, R });

export { H };
