// v1, "WHAT'S IT WORTH?" (TREATMENT-v1.md): the shared set. Rai's live variety show is filmed in a studio built inside
// a shipwreck on the seabed. This file holds the set, the crew, the audience, the LED scoreboard (the film's ledger)
// and the TV graphics package (the lyric as a lower third, captions, the LIVE bug, archive VHS, the night-vision feed,
// a channel-flip of static). Built once and frozen before the plates (his orchestration rule): plates add their own
// props in their own files.
//
// Canvas2D in the 1920x1080 logical frame, y down, pure functions of t. Most functions take the main layer `c` and the
// glow layer `g` (composited additively, so it blooms).
import { W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import { clamp, ease, frameIdx } from '../../engine/util';
import { Lyrics, type Line } from '../../engine/lyrics';
import { h01 } from '../_rai';
import { FAM, TAU, karaoke, rgbaHex, mixHex, stone } from '../_motifs';
import { fish } from '../_world';

type C2 = CanvasRenderingContext2D;

// ------------------------------------------------------------------ dots: the bulbs and LEDs

const DOTS = new Map<string, [number, number][]>();
/**
 * The dot grid of a text: where a `pitch`-spaced grid of bulbs or LEDs falls inside the glyphs of `text` set in `fam`
 * at `size`, centred on (0, 0). Cached.
 */
export function textDots(text: string, fam: string, size: number, pitch: number): [number, number][] {
  const key = `${text}|${fam}|${size}|${pitch}`;
  const hit = DOTS.get(key);
  if (hit) return hit;
  const probe = new OffscreenCanvas(8, 8).getContext('2d')!;
  probe.font = font(fam, size);
  const tw = Math.ceil(probe.measureText(text).width) + 8, th = Math.ceil(size * 1.4);
  const oc = new OffscreenCanvas(tw, th), o = oc.getContext('2d', { willReadFrequently: true })!;
  o.font = font(fam, size); o.textBaseline = 'middle'; o.textAlign = 'center'; o.fillStyle = '#fff';
  o.fillText(text, tw / 2, th / 2);
  const img = o.getImageData(0, 0, tw, th).data, pts: [number, number][] = [];
  for (let y = pitch / 2; y < th; y += pitch) for (let x = pitch / 2; x < tw; x += pitch) {
    const i = (Math.floor(y) * tw + Math.floor(x)) * 4 + 3;
    if (img[i]! > 110) pts.push([x - tw / 2, y - th / 2]);
  }
  DOTS.set(key, pts);
  return pts;
}

/** Draw dots (bulbs or LEDs) at (x, y): unlit ones dim on `c`, lit ones bright on `c` and glowing on `g`. */
export function drawDots(c: C2, g: C2 | null, pts: [number, number][], x: number, y: number, r: number, col: string, lit: (i: number) => number) {
  c.fillStyle = 'rgba(40,30,50,0.85)';
  c.beginPath();
  for (const [px, py] of pts) { c.moveTo(x + px + r, y + py); c.arc(x + px, y + py, r, 0, TAU); }
  c.fill();
  const on: [number, number, number][] = [];
  pts.forEach(([px, py], i) => { const a = lit(i); if (a > 0.02) on.push([x + px, y + py, a]); });
  for (const [px, py, a] of on) {
    c.fillStyle = mixHex('#2a2030', col, a);
    c.beginPath(); c.arc(px, py, r, 0, TAU); c.fill();
  }
  if (g) {
    g.fillStyle = rgbaHex(col, 0.55);
    g.beginPath();
    for (const [px, py, a] of on) if (a > 0.5) { g.moveTo(px + r * 1.6, py); g.arc(px, py, r * 1.6, 0, TAU); }
    g.fill();
  }
}

// ------------------------------------------------------------------ the camera

export interface Cam { x?: number; y?: number; zoom?: number; rot?: number }
/** Run `draw` under a 2D camera: pan by (x, y) px and zoom about the frame's centre. */
export function withCam(c: C2, cam: Cam, draw: () => void) {
  c.save();
  c.translate(W / 2, H / 2);
  c.rotate(cam.rot ?? 0);
  c.scale(cam.zoom ?? 1, cam.zoom ?? 1);
  c.translate(-W / 2 - (cam.x ?? 0), -H / 2 - (cam.y ?? 0));
  draw();
  c.restore();
}

// ------------------------------------------------------------------ the set

export type Cue = 'APPLAUSE' | 'OOOH' | 'QUIET' | 'LIFT!' | 'LAUGH' | 'EVERYBODY!';
export type Mood = 'calm' | 'cheer' | 'freeze' | 'sway' | 'gasp';
export interface Spot { x: number; y?: number; col?: string; a?: number; r?: number }
export interface ScoreRow { text: string; col?: string }
export interface StudioOpts {
  /** The kelp curtain: 0 closed .. 1 open (the ring of bulbs behind it). */
  curtain?: number;
  /** The ring of bulbs: 0 dark .. 1 blazing; `ringCol` its colour, `burst` a sunburst inside it (two colours). */
  ring?: number;
  ringCol?: string;
  burst?: [string, string] | null;
  /** The show's sign "WHAT'S IT WORTH?": 0 dark .. 1 lit (bulbs light left to right as it rises). */
  sign?: number;
  /** The ON AIR light. */
  onAir?: boolean;
  /** The floor manager's cue sign, lit, from cueT0. */
  cue?: Cue | null;
  cueT0?: number;
  /** House lights 0 (dark) .. 1. */
  house?: number;
  /** Spotlights from the anglerfish lamps, landing at stage x (and y). */
  spots?: Spot[];
  /** The LED scoreboard's rows (null: dark), or `scoreDraw` to draw on it yourself (e.g. the eye). */
  score?: ScoreRow[] | null;
  scoreDraw?: (c: C2, g: C2, x: number, y: number, w: number, h: number) => void;
  /** The studio screen (a CRT in a porthole frame): draw into it (clipped), null to leave it showing the show's logo. */
  screen?: ((c: C2, g: C2, x: number, y: number, w: number, h: number) => void) | null;
  /** The audience's heads in the foreground, and what they do. */
  crowd?: number;
  mood?: Mood;
  seed?: number;
}

/** Where things are on the set (logical px, before any camera). */
export const SET = {
  floor: H * 0.715,              // the stage floor where Rai stands (her feet)
  stageL: W * 0.14, stageR: W * 0.86,
  ring: { x: W * 0.5, y: H * 0.4, r: H * 0.27 },
  score: { x: W * 0.035, y: H * 0.17, w: W * 0.2, h: H * 0.29 },
  screen: { x: W * 0.765, y: H * 0.17, w: W * 0.2, h: H * 0.29 },
  sign: { x: W * 0.5, y: H * 0.085 },
};

/** The whole set behind the performers: water, the wreck, portholes, rays, lamps, sign, ring, curtain, boards, stage. */
export function studio(c: C2, g: C2, t: number, o: StudioOpts = {}) {
  const house = o.house ?? 0.6, seed = o.seed ?? 1;
  // the water around the wreck
  const wg = c.createLinearGradient(0, 0, 0, H);
  wg.addColorStop(0, mixHex('#0d1640', '#1d3f86', 0.5 * house)); wg.addColorStop(1, mixHex('#070a22', '#14204a', 0.5 * house));
  c.fillStyle = wg; c.fillRect(-W, -H, W * 3, H * 3);
  // god rays through the broken deck far above
  c.save(); c.globalCompositeOperation = 'screen';
  for (let k = 0; k < 6; k++) {
    const x = W * (0.15 + 0.14 * k) + 30 * Math.sin(t * 0.25 + k * 2.1), a = 0.05 + 0.03 * Math.sin(t * 0.6 + k);
    const rg = c.createLinearGradient(0, 0, 0, H * 0.7);
    rg.addColorStop(0, `rgba(170,220,255,${a})`); rg.addColorStop(1, 'rgba(170,220,255,0)');
    c.fillStyle = rg;
    c.beginPath(); c.moveTo(x - 20, -10); c.lineTo(x + 30, -10); c.lineTo(x + 140, H * 0.7); c.lineTo(x - 60, H * 0.7); c.closePath(); c.fill();
  }
  c.restore();
  // the hull: planks curving up the back wall, with ribs
  const wood = mixHex('#24152b', '#4a2c3c', house), plank = mixHex('#1a0f22', '#38202f', house);
  c.fillStyle = wood;
  c.beginPath(); c.moveTo(-W, H); c.lineTo(-W, H * 0.12);
  for (let x = -W; x <= W * 2; x += 60) c.lineTo(x, H * 0.12 + 0.00004 * (x - W / 2) ** 2);
  c.lineTo(W * 2, H); c.closePath(); c.fill();
  c.strokeStyle = plank; c.lineWidth = 3;
  for (let j = 0; j < 14; j++) {
    c.beginPath();
    for (let x = -W; x <= W * 2; x += 60) { const y = H * (0.16 + j * 0.045) + 0.00004 * (x - W / 2) ** 2 * (1 - j / 16); x === -W ? c.moveTo(x, y) : c.lineTo(x, y); }
    c.stroke();
  }
  // a broken gap in the deck above, where the light comes in
  c.fillStyle = mixHex('#0d1640', '#1d3f86', 0.5 * house);
  c.beginPath(); c.moveTo(W * 0.38, 0); c.lineTo(W * 0.43, H * 0.05); c.lineTo(W * 0.47, H * 0.025); c.lineTo(W * 0.53, H * 0.06); c.lineTo(W * 0.6, 0); c.closePath(); c.fill();
  // ribs
  c.strokeStyle = mixHex('#140a19', '#2a1820', house); c.lineWidth = 26;
  for (const rx of [-0.3, 0.02, 0.29, 0.71, 0.98, 1.3]) {
    c.beginPath(); c.moveTo(W * rx, H); c.quadraticCurveTo(W * rx + (rx < 0.5 ? 60 : -60), H * 0.4, W * rx + (rx < 0.5 ? 140 : -140), H * 0.08); c.stroke();
  }
  // portholes: brass rings, glowing glass (the sea outside, and on one a stopped clock: 4:00, a clue)
  for (const [px, py, k] of [[W * 0.29, H * 0.12, 0], [W * 0.71, H * 0.12, 1], [-W * 0.15, H * 0.3, 2], [W * 1.15, H * 0.3, 3]] as const) {
    c.fillStyle = '#b98a3e'; c.beginPath(); c.arc(px, py, 38, 0, TAU); c.fill();
    c.fillStyle = k === 1 ? '#f4efe1' : mixHex('#1a4f7a', '#3fb6d8', 0.5 + 0.3 * Math.sin(t + k));
    c.beginPath(); c.arc(px, py, 28, 0, TAU); c.fill();
    if (k === 1) { // the clock stopped at 4:00
      c.strokeStyle = '#2a1d14'; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(px, py); c.lineTo(px, py - 20); c.moveTo(px, py); c.lineTo(px + 13 * Math.sin(TAU * 4 / 12), py - 13 * Math.cos(TAU * 4 / 12)); c.stroke();
    } else {
      g.fillStyle = rgbaHex(HEX.cyan, 0.18); g.beginPath(); g.arc(px, py, 30, 0, TAU); g.fill();
    }
  }
  // the ship's nameplate (the trader's ship: a clue for verse 2), rusted, on the left wall
  c.save(); c.translate(W * 0.075, H * 0.6); c.rotate(-0.05);
  c.fillStyle = '#6d4a2c'; c.fillRect(-90, -20, 180, 40);
  c.strokeStyle = '#3d2716'; c.lineWidth = 3; c.strokeRect(-90, -20, 180, 40);
  c.font = font(FAM.monoB(), 20); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#c99a5a';
  c.fillText('S.S. IRON HULL', 0, 1);
  c.restore();
  // the pole and the coil of rope racked in the wings (the breakdown, a clue)
  c.strokeStyle = '#8a6a44'; c.lineWidth = 14; c.lineCap = 'round';
  c.beginPath(); c.moveTo(W * 0.885, H * 0.25); c.lineTo(W * 0.915, H * 0.69); c.stroke();
  c.strokeStyle = '#c9a26a'; c.lineWidth = 6;
  for (let k = 0; k < 4; k++) { c.beginPath(); c.ellipse(W * 0.95, H * 0.665 - k * 9, 34, 12, 0, 0, TAU); c.stroke(); }

  // the anglerfish lamps hanging from the beams, and their beams on the stage
  const spots = o.spots ?? [];
  const lampsX = [W * 0.04, W * 0.14, W * 0.86, W * 0.96];
  spots.forEach((s, i) => {
    const lx = lampsX[i % 4]! - 52, ly = H * 0.04 - 28, tx = s.x, ty = s.y ?? SET.floor, col = s.col ?? '#fff3c8', a = s.a ?? 1, r = s.r ?? 150;
    const bg = g.createLinearGradient(lx, ly, tx, ty);
    bg.addColorStop(0, rgbaHex(col, 0.32 * a)); bg.addColorStop(1, rgbaHex(col, 0.1 * a));
    g.fillStyle = bg;
    g.beginPath(); g.moveTo(lx - 10, ly); g.lineTo(lx + 10, ly); g.lineTo(tx + r, ty); g.lineTo(tx - r, ty); g.closePath(); g.fill();
    g.fillStyle = rgbaHex(col, 0.28 * a); g.beginPath(); g.ellipse(tx, ty, r, r * 0.22, 0, 0, TAU); g.fill();
  });
  lampsX.forEach((lx, i) => anglerLamp(c, g, lx, H * 0.04, t, i, spots[i] ? 1 : 0.35));

  // the ring of bulbs, behind the curtain
  const ring = o.ring ?? 0, R = SET.ring;
  if (o.burst && ring > 0) {
    c.save(); c.beginPath(); c.arc(R.x, R.y, R.r - 10, 0, TAU); c.clip();
    c.globalAlpha = ring;
    for (let k = 0; k < 18; k++) {
      const a0 = (k / 18) * TAU + t * 0.15, a1 = a0 + TAU / 36;
      c.fillStyle = k % 2 ? o.burst[0] : o.burst[1];
      c.beginPath(); c.moveTo(R.x, R.y); c.arc(R.x, R.y, R.r, a0, a1 + TAU / 36); c.closePath(); c.fill();
    }
    c.restore();
  }
  bulbRing(c, g, R.x, R.y, R.r, t, ring, o.ringCol ?? HEX.gold);
  kelpCurtain(c, t, o.curtain ?? 0, house);

  // the sign
  signBoard(c, g, SET.sign.x, SET.sign.y, t, o.sign ?? 0);
  // the scoreboard and the studio screen on the walls
  scoreboard(c, g, SET.score.x, SET.score.y, SET.score.w, SET.score.h, t, o.score ?? null, o.scoreDraw);
  studioScreen(c, g, SET.screen.x, SET.screen.y, SET.screen.w, SET.screen.h, t, o.screen ?? null);
  // the ON AIR light and the cue sign
  if (o.onAir !== undefined) onAirLight(c, g, SET.score.x + SET.score.w / 2, H * 0.125, o.onAir);
  if (o.cue) cueSign(c, g, SET.screen.x + SET.screen.w / 2, H * 0.125, o.cue, t, o.cueT0 ?? -1e9);

  // the stage: planks on sand, the footlights along its edge
  c.fillStyle = mixHex('#2a1a24', '#5a3a3a', house);
  c.beginPath(); c.moveTo(SET.stageL - 60, H * 0.77); c.lineTo(SET.stageL, SET.floor - 30); c.lineTo(SET.stageR, SET.floor - 30); c.lineTo(SET.stageR + 60, H * 0.77); c.closePath(); c.fill();
  c.strokeStyle = mixHex('#1a0f16', '#3c2626', house); c.lineWidth = 2;
  for (let k = 1; k < 5; k++) { const y = SET.floor - 30 + k * ((H * 0.77 - SET.floor + 30) / 5); c.beginPath(); c.moveTo(SET.stageL - 60 * k / 5, y); c.lineTo(SET.stageR + 60 * k / 5, y); c.stroke(); }
  c.fillStyle = mixHex('#140c12', '#2a1a1a', house); c.fillRect(SET.stageL - 60, H * 0.77, SET.stageR - SET.stageL + 120, 26);
  for (let k = 0; k < 22; k++) {
    const fx = SET.stageL - 40 + k * ((SET.stageR - SET.stageL + 80) / 21), on = 0.7 + 0.3 * Math.sin(t * 6 + k);
    c.fillStyle = mixHex('#5a4630', HEX.gold, on); c.beginPath(); c.arc(fx, H * 0.77 + 12, 6, 0, TAU); c.fill();
    g.fillStyle = rgbaHex(HEX.gold, 0.35 * on); g.beginPath(); g.arc(fx, H * 0.77 + 12, 11, 0, TAU); g.fill();
  }
  // sand in front of the stage
  c.fillStyle = mixHex('#3a3250', '#8a7a5a', house * 0.6);
  c.fillRect(-W, H * 0.77 + 26, W * 3, H);
  void seed;
}

/** What stands in front of the performers: the audience's heads and fins in silhouette, rising bubbles. */
export function studioFront(c: C2, g: C2, t: number, o: StudioOpts = {}) {
  const crowd = o.crowd ?? 1, mood = o.mood ?? 'calm';
  if (crowd > 0) {
    c.save(); c.globalAlpha = crowd;
    for (let i = 0; i < 26; i++) {
      const x = -40 + i * 78 + 18 * h01(i, 3), base = H + 30 - 30 * h01(i, 4), kind = h01(i, 5);
      const bob = mood === 'cheer' ? 18 * Math.abs(Math.sin(t * 7 + i)) : mood === 'sway' ? 10 * Math.sin(t * 2.2 + i * 0.5) : mood === 'freeze' ? 0 : 4 * Math.sin(t * 1.5 + i);
      const y = base - 120 - bob, col = '#07060f';
      c.fillStyle = col;
      if (kind < 0.6) { // a fish's round head and dorsal fin
        c.beginPath(); c.ellipse(x, y + 40, 46, 56, 0, 0, TAU); c.fill();
        c.beginPath(); c.moveTo(x - 14, y - 6); c.quadraticCurveTo(x + 4, y - 40 - (mood === 'cheer' ? 14 : 0), x + 22, y + 2); c.fill();
        if (mood === 'cheer') { // fins up
          c.beginPath(); c.ellipse(x - 52, y + 6, 12, 30, -0.6, 0, TAU); c.fill();
          c.beginPath(); c.ellipse(x + 52, y + 6, 12, 30, 0.6, 0, TAU); c.fill();
        }
      } else if (kind < 0.85) { // a crab: shell and eye stalks
        c.beginPath(); c.ellipse(x, y + 60, 60, 40, 0, 0, TAU); c.fill();
        c.lineWidth = 7; c.strokeStyle = col;
        c.beginPath(); c.moveTo(x - 16, y + 30); c.lineTo(x - 22, y + 2); c.moveTo(x + 16, y + 30); c.lineTo(x + 22, y + 2); c.stroke();
        c.beginPath(); c.arc(x - 22, y, 9, 0, TAU); c.arc(x + 22, y, 9, 0, TAU); c.fill();
        if (mood === 'cheer') { c.beginPath(); c.ellipse(x - 70, y + 10, 18, 26, -0.4, 0, TAU); c.ellipse(x + 70, y + 10, 18, 26, 0.4, 0, TAU); c.fill(); }
      } else { // a jellyfish bell
        c.beginPath(); c.arc(x, y + 50, 44, Math.PI, 0); c.fill();
      }
      if (mood === 'sway' && kind >= 0.6) { // jellyfish lighters held up (chorus 2)
        const lx = x + 30, ly = y - 40 + 8 * Math.sin(t * 2.2 + i);
        g.fillStyle = rgbaHex(HEX.pink, 0.55); g.beginPath(); g.arc(lx, ly, 20, 0, TAU); g.fill();
        c.fillStyle = HEX.pink; c.beginPath(); c.arc(lx, ly, 9, Math.PI, 0); c.fill();
      }
    }
    c.restore();
  }
  // bubbles rising through the shot
  c.strokeStyle = 'rgba(200,235,255,0.5)'; c.lineWidth = 2;
  for (let i = 0; i < 14; i++) {
    const x = h01(i, 71) * W + 10 * Math.sin(t * 1.3 + i), r = 3 + 8 * h01(i, 72);
    const y = H - ((h01(i, 73) + t * 0.1 * (0.6 + h01(i, 74))) % 1.1) * H;
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
  }
}

function anglerLamp(c: C2, g: C2, x: number, y: number, t: number, i: number, on: number) {
  const sw = 6 * Math.sin(t * 0.9 + i * 1.7);
  c.strokeStyle = '#120a14'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(x, -20); c.lineTo(x + sw, y - 14); c.stroke();
  c.save(); c.translate(x + sw, y); c.rotate(0.05 * Math.sin(t + i));
  c.fillStyle = '#1b1222';
  c.beginPath(); c.ellipse(0, 0, 44, 28, 0, 0, TAU); c.fill();       // body
  c.beginPath(); c.moveTo(38, 0); c.lineTo(64, -16); c.lineTo(64, 16); c.closePath(); c.fill();   // tail
  c.fillStyle = '#e8e0f0'; c.beginPath(); c.arc(-24, -6, 6, 0, TAU); c.fill();                     // eye
  c.fillStyle = '#120a14'; c.beginPath(); c.arc(-25, -6, 3, 0, TAU); c.fill();
  c.strokeStyle = '#e8e0f0'; c.lineWidth = 2;                                                      // teeth
  c.beginPath(); for (let k = 0; k < 5; k++) { c.moveTo(-42 + k * 6, 10); c.lineTo(-39 + k * 6, 16); } c.stroke();
  c.strokeStyle = '#1b1222'; c.lineWidth = 3;                                                      // the lure
  c.beginPath(); c.moveTo(-14, -24); c.quadraticCurveTo(-30, -60, -52, -30); c.stroke();
  c.fillStyle = mixHex('#6a5a30', '#fff3c8', on); c.beginPath(); c.arc(-52, -28, 9, 0, TAU); c.fill();
  c.restore();
  g.fillStyle = rgbaHex('#fff3c8', 0.6 * on); g.beginPath(); g.arc(x + sw - 52, y - 28, 22, 0, TAU); g.fill();
}

/** The ring of bulbs (the ring motif): bulbs on a dark band, chasing when lit. */
export function bulbRing(c: C2, g: C2, x: number, y: number, r: number, t: number, lit: number, col: string) {
  c.strokeStyle = '#1a1226'; c.lineWidth = 30;
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
  c.strokeStyle = '#3a2a44'; c.lineWidth = 4;
  c.beginPath(); c.arc(x, y, r + 15, 0, TAU); c.stroke(); c.beginPath(); c.arc(x, y, r - 15, 0, TAU); c.stroke();
  const n = 44;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU - Math.PI / 2, bx = x + Math.cos(a) * r, by = y + Math.sin(a) * r;
    const chase = 0.65 + 0.35 * Math.sin(t * 10 - i * 0.9);
    const on = clamp(lit * 1.4 - (i / n) * 0.4) * chase;
    c.fillStyle = mixHex('#3a2c2a', col, on); c.beginPath(); c.arc(bx, by, 9, 0, TAU); c.fill();
    if (on > 0.1) { g.fillStyle = rgbaHex(col, 0.5 * on); g.beginPath(); g.arc(bx, by, 18, 0, TAU); g.fill(); }
  }
}

/** The kelp curtain across the back of the stage, parting to both sides as `open` goes 0 -> 1. */
export function kelpCurtain(c: C2, t: number, open: number, house = 0.6) {
  const u = ease.inOutCubic(clamp(open)), L = SET.stageL + 20, Rr = SET.stageR - 20, mid = (L + Rr) / 2, top = H * 0.1, bot = SET.floor - 26;
  const n = 30;
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1), side = f < 0.5 ? -1 : 1;
    const home = L + f * (Rr - L);
    const away = side < 0 ? L + (f / 0.5) * (Rr - L) * 0.12 : Rr - ((1 - f) / 0.5) * (Rr - L) * 0.12;
    const x = home + (away - home) * u;
    const col = mixHex(i % 3 === 0 ? '#0f4a2e' : i % 3 === 1 ? '#1f7a4a' : '#17603a', '#2fae6a', 0.25 * house);
    c.fillStyle = col;
    c.beginPath();
    const wv = (y: number) => 10 * Math.sin(t * 1.6 + i * 0.7 + y * 0.012) * (1 - 0.6 * u);
    c.moveTo(x - 24 + wv(top), top);
    for (let y = top; y <= bot; y += 30) c.lineTo(x - 24 + wv(y) + (y - top) * 0.02 * side * u * 3, y);
    for (let y = bot; y >= top; y -= 30) c.lineTo(x + 24 + wv(y) + (y - top) * 0.02 * side * u * 3, y);
    c.closePath(); c.fill();
  }
  // the pelmet: a beam of the wreck with a fringe of weed
  c.fillStyle = '#1a0f16'; c.fillRect(L - 30, top - 26, Rr - L + 60, 30);
  void mid;
}

/** "WHAT'S IT WORTH?" in bulbs on a dark board, lighting left to right as `lit` rises. */
export function signBoard(c: C2, g: C2 | null, x: number, y: number, t: number, lit: number, scale = 1) {
  const pts = textDots("WHAT'S IT WORTH?", FAM.hook(), 92 * scale, 11 * scale);
  const minX = Math.min(...pts.map((p) => p[0])), maxX = Math.max(...pts.map((p) => p[0]));
  c.fillStyle = '#140c1e';
  c.beginPath(); c.roundRect(x + minX - 30 * scale, y - 62 * scale, maxX - minX + 60 * scale, 124 * scale, 14 * scale); c.fill();
  c.strokeStyle = '#b98a3e'; c.lineWidth = 4 * scale; c.stroke();
  drawDots(c, g, pts, x, y, 3.6 * scale, HEX.gold, (i) => {
    const fx = (pts[i]![0] - minX) / (maxX - minX);
    return clamp((lit * 1.25 - fx) / 0.12) * (0.82 + 0.18 * Math.sin(t * 9 + i * 0.37));
  });
}

/** The LED scoreboard (the ledger): rows of dot-matrix text, or a custom drawing. */
export function scoreboard(c: C2, g: C2, x: number, y: number, w: number, h: number, t: number, rows: ScoreRow[] | null, draw?: StudioOpts['scoreDraw']) {
  c.fillStyle = '#0c0a12'; c.beginPath(); c.roundRect(x - 10, y - 10, w + 20, h + 20, 10); c.fill();
  c.strokeStyle = '#6a5a3a'; c.lineWidth = 5; c.stroke();
  // the dark LED field
  c.fillStyle = '#18141f';
  const pitch = 6;
  c.beginPath();
  for (let yy = y + pitch / 2; yy < y + h; yy += pitch) for (let xx = x + pitch / 2; xx < x + w; xx += pitch) { c.moveTo(xx + 1.9, yy); c.arc(xx, yy, 1.9, 0, TAU); }
  c.fill();
  if (draw) { c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); draw(c, g, x, y, w, h); c.restore(); return; }
  if (!rows) return;
  const rh = h / Math.max(rows.length, 1);
  rows.forEach((r, i) => {
    // as big as the row allows and the width fits (mono: ~0.6 em a character), never under 10 dots to the em
    const size = Math.max(10 * pitch, Math.min(rh * 0.8, (w - 24) / (0.62 * Math.max(1, r.text.length))));
    // big glyphs get denser dots (16 to the em): at 10 a lone "?" lost its dot and read as a 7
    ledText(c, g, r.text, x + w / 2, y + rh * (i + 0.5), size, r.col ?? HEX.lime, () => 1, Math.max(pitch, Math.round(size / 16)));
  });
}

/**
 * LED text anywhere (the scoreboard, or a full-frame board): `text` centred at (x, y), in dots about a tenth of the
 * size apart (fewer dots than that and the letters stop reading).
 */
export function ledText(c: C2, g: C2 | null, text: string, x: number, y: number, size: number, col: string, lit: (i: number, n: number) => number = () => 1, pitch = Math.max(4, Math.round(size / 10)), fam?: string) {
  // Plex Mono's zero is dotted (it read as a theta): numbers in Archivo, words in Plex Mono
  const pts = textDots(text, fam ?? (/^[-−£0-9.,/ %]+$/.test(text) ? FAM.bold() : FAM.monoB()), size, pitch);
  drawDots(c, g, pts, x, y, pitch * 0.34, col, (i) => lit(i, pts.length));
}

/** The studio screen: a CRT in a brass porthole frame; draw into it (clipped), else the show's logo. */
export function studioScreen(c: C2, g: C2, x: number, y: number, w: number, h: number, t: number, draw: StudioOpts['screen']) {
  c.fillStyle = '#7a5a2e'; c.beginPath(); c.roundRect(x - 16, y - 16, w + 32, h + 32, 26); c.fill();
  c.strokeStyle = '#c99a5a'; c.lineWidth = 4; c.stroke();
  for (let k = 0; k < 10; k++) { // rivets
    const a = k / 10, px = k < 5 ? x - 6 + a * 2 * (w + 12) : x - 6 + (a - 0.5) * 2 * (w + 12);
    c.fillStyle = '#d9b070'; c.beginPath(); c.arc(px, k < 5 ? y - 7 : y + h + 7, 4, 0, TAU); c.fill();
  }
  c.save();
  c.beginPath(); c.roundRect(x, y, w, h, 18); c.clip();
  c.fillStyle = '#0b0f18'; c.fillRect(x, y, w, h);
  if (draw) draw(c, g, x, y, w, h);
  else {
    const bg = c.createLinearGradient(x, y, x, y + h);
    bg.addColorStop(0, '#2f1c59'); bg.addColorStop(1, '#120d1d');
    c.fillStyle = bg; c.fillRect(x, y, w, h);
    c.font = font(FAM.hook(), 40); c.textAlign = 'center'; c.textBaseline = 'middle';
    const k = Math.min(1, (w - 40) / c.measureText("WHAT'S IT WORTH?").width);
    c.font = font(FAM.hook(), 40 * k);
    c.fillStyle = HEX.ink; c.fillText("WHAT'S IT WORTH?", x + w / 2 + 3, y + h / 2 + 3);
    c.fillStyle = HEX.gold; c.fillText("WHAT'S IT WORTH?", x + w / 2, y + h / 2);
  }
  scanlines(c, x, y, w, h, 0.18);
  const vg = c.createRadialGradient(x + w / 2, y + h / 2, h * 0.2, x + w / 2, y + h / 2, w * 0.7);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
  c.fillStyle = vg; c.fillRect(x, y, w, h);
  c.restore();
}

function onAirLight(c: C2, g: C2, x: number, y: number, on: boolean) {
  c.fillStyle = '#1a0c10'; c.beginPath(); c.roundRect(x - 80, y - 28, 160, 56, 10); c.fill();
  c.strokeStyle = '#5a2a2a'; c.lineWidth = 3; c.stroke();
  c.font = font(FAM.hook(), 32); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = on ? '#ff3b3b' : '#4a1a1e'; c.fillText('ON AIR', x, y + 2);
  if (on) { g.fillStyle = 'rgba(255,59,59,0.5)'; g.beginPath(); g.roundRect(x - 84, y - 30, 168, 60, 12); g.fill(); }
}

/** The floor manager's cue sign (lit box): APPLAUSE, OOOH, QUIET, LIFT!... popping on at t0. */
export function cueSign(c: C2, g: C2, x: number, y: number, cue: Cue, t: number, t0: number) {
  const on = t >= t0 ? (Math.floor((t - t0) * 4) % 2 === 0 || t - t0 > 1.2 ? 1 : 0.5) : 0.15;
  c.font = font(FAM.hook(), 30);
  const tw = c.measureText(cue).width + 40;
  c.fillStyle = '#100c1a'; c.beginPath(); c.roundRect(x - tw / 2, y - 28, tw, 56, 10); c.fill();
  c.strokeStyle = '#6a5a3a'; c.lineWidth = 3; c.stroke();
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = mixHex('#3a2a20', HEX.yellow, on); c.fillText(cue, x, y + 2);
  if (on > 0.6) { g.fillStyle = rgbaHex(HEX.yellow, 0.35); g.beginPath(); g.roundRect(x - tw / 2 - 4, y - 30, tw + 8, 60, 12); g.fill(); }
}

// ------------------------------------------------------------------ the crew and the audience

/** The crab cameraman with a studio camera; `tally` lights the red light (this camera is live). */
export function crabCam(c: C2, g: C2, x: number, y: number, s: number, t: number, o: { tally?: boolean; flip?: boolean } = {}) {
  c.save(); c.translate(x, y); c.scale(o.flip ? -s : s, s);
  // the tripod and camera
  c.strokeStyle = '#2a2a33'; c.lineWidth = 8; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, -60); c.lineTo(-40, 40); c.moveTo(0, -60); c.lineTo(40, 40); c.moveTo(0, -60); c.lineTo(0, 40); c.stroke();
  c.fillStyle = '#34343f'; c.beginPath(); c.roundRect(-70, -130, 120, 70, 10); c.fill();
  c.fillStyle = '#22222a'; c.beginPath(); c.roundRect(-110, -118, 44, 46, 8); c.fill();   // lens hood
  c.fillStyle = '#5ac8fa'; c.beginPath(); c.arc(-104, -95, 12, 0, TAU); c.fill();            // glass
  c.fillStyle = o.tally ? '#ff3b3b' : '#4a1a1e'; c.beginPath(); c.arc(30, -138, 9, 0, TAU); c.fill();
  if (o.tally) { g.save(); g.translate(x, y); g.scale(o.flip ? -s : s, s); g.fillStyle = 'rgba(255,59,59,0.6)'; g.beginPath(); g.arc(30, -138, 20, 0, TAU); g.fill(); g.restore(); }
  // the crab behind it: shell, eye stalks peering into the viewfinder, a claw on the handle
  const bob = 3 * Math.sin(t * 3);
  c.fillStyle = '#e8553a';
  c.beginPath(); c.ellipse(70, -40 + bob, 56, 38, 0, 0, TAU); c.fill();
  c.strokeStyle = '#e8553a'; c.lineWidth = 7;
  c.beginPath(); c.moveTo(56, -70 + bob); c.lineTo(48, -104); c.moveTo(80, -72 + bob); c.lineTo(84, -108); c.stroke();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(48, -108, 9, 0, TAU); c.arc(84, -112, 9, 0, TAU); c.fill();
  c.fillStyle = '#111'; c.beginPath(); c.arc(45, -108, 4, 0, TAU); c.arc(81, -112, 4, 0, TAU); c.fill();
  c.fillStyle = '#d0452d'; c.beginPath(); c.ellipse(40, -64 + bob, 18, 12, -0.5, 0, TAU); c.fill();  // claw on the handle
  for (const k of [0, 1, 2]) { c.strokeStyle = '#c24a33'; c.lineWidth = 6; c.beginPath(); c.moveTo(100, -30 + k * 10 + bob); c.lineTo(132, -10 + k * 16); c.stroke(); }
  c.restore();
}

/** The octopus floor manager: headset, clipboard, a cue card held up (text) from cardT0. */
export function octopus(c: C2, g: C2, x: number, y: number, s: number, t: number, o: { card?: string | null; cardT0?: number; col?: string } = {}) {
  const col = o.col ?? '#c65cf0';
  c.save(); c.translate(x, y); c.scale(s, s);
  // tentacles
  c.strokeStyle = col; c.lineCap = 'round';
  for (let k = 0; k < 8; k++) {
    const a = -0.4 + (k / 7) * (Math.PI + 0.8), ph = t * 2 + k;
    c.lineWidth = 16 - k % 2 * 3;
    c.beginPath(); c.moveTo(Math.cos(a) * 30, 30);
    c.quadraticCurveTo(Math.cos(a) * 80 + 20 * Math.sin(ph), 70 + 10 * Math.cos(ph), Math.cos(a) * 110 + 26 * Math.sin(ph * 1.3), 110 + 16 * Math.sin(ph));
    c.stroke();
  }
  // the head
  c.fillStyle = col; c.beginPath(); c.ellipse(0, -30, 62, 74, 0, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.ellipse(-20, -60, 18, 26, -0.3, 0, TAU); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(-20, -10, 11, 0, TAU); c.arc(20, -10, 11, 0, TAU); c.fill();
  c.fillStyle = '#111'; c.beginPath(); c.arc(-18, -9, 5, 0, TAU); c.arc(22, -9, 5, 0, TAU); c.fill();
  // the headset
  c.strokeStyle = '#222'; c.lineWidth = 6;
  c.beginPath(); c.arc(0, -30, 66, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
  c.fillStyle = '#222'; c.beginPath(); c.arc(-62, -20, 12, 0, TAU); c.fill();
  c.lineWidth = 4; c.beginPath(); c.moveTo(-62, -14); c.quadraticCurveTo(-56, 10, -30, 12); c.stroke();
  // the cue card, held up on two tentacles
  if (o.card) {
    const age = t - (o.cardT0 ?? -1e9), up = age < 0 ? 0 : ease.outBack(clamp(age / 0.25));
    c.save(); c.translate(120, -40 - 50 * up); c.rotate(0.08 * Math.sin(t * 3));
    c.strokeStyle = col; c.lineWidth = 12; c.beginPath(); c.moveTo(-90, 110 + 50 * up); c.quadraticCurveTo(-60, 60, -50, 30); c.stroke();
    c.font = font(FAM.hook(), 36);
    const tw = Math.max(150, c.measureText(o.card).width + 40);
    c.fillStyle = '#f4f1ea'; c.beginPath(); c.roundRect(-tw / 2, -40, tw, 80, 8); c.fill();
    c.strokeStyle = '#2a1d14'; c.lineWidth = 4; c.stroke();
    c.fillStyle = '#120d1d'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(o.card, 0, 2);
    c.restore();
  }
  c.restore();
  void g;
}

export type SeatKind = 'fish' | 'crab' | 'jelly' | 'anchor' | 'helmet' | 'bell' | 'stone' | 'lunchbox' | 'empty';
export interface AudienceOpts {
  mood?: Mood;
  /** A spotlight on the seats at (x, y) (px), and how much the house is dimmed elsewhere (0..1). */
  spot?: { x: number; y: number; r?: number; a?: number } | null;
  dim?: number;
  /** Override what sits in a seat, keyed "C7". */
  seats?: Record<string, SeatKind>;
  /** Seat C7's lunchbox gets a neighbour's fin over it (chorus 2). */
  hug?: number;
  pan?: number;
  zoom?: number;
}

const ROWS = ['A', 'B', 'C', 'D'];
/** Where a seat is in the reverse shot (the audience facing camera): row A at the front. */
export function seatPos(row: string, col: number, pan = 0): { x: number; y: number; s: number } {
  const r = ROWS.indexOf(row), s = 1 - 0.16 * r;
  return { x: W / 2 + (col - 6.5) * 150 * s - pan * s, y: H * (0.86 - 0.19 * r), s };
}
/** What sits in each seat by default: creatures, and among them the sunken things that are waiting. */
export function seatKind(row: string, col: number): SeatKind {
  const key = `${row}${col}`;
  const fixed: Record<string, SeatKind> = { C7: 'lunchbox', B3: 'anchor', D9: 'helmet', B11: 'bell', C2: 'stone', D5: 'stone', A10: 'stone' };
  if (fixed[key]) return fixed[key]!;
  const v = h01(ROWS.indexOf(row), col, 901);
  return v < 0.55 ? 'fish' : v < 0.82 ? 'crab' : 'jelly';
}

/** The reverse shot: the audience on three tiers of clam-shell seats, facing the camera. */
export function audience(c: C2, g: C2, t: number, o: AudienceOpts = {}) {
  const mood = o.mood ?? 'calm', pan = o.pan ?? 0;
  // the wreck's far wall behind the stands
  const bg = c.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0b0f2a'); bg.addColorStop(1, '#1d1430');
  c.fillStyle = bg; c.fillRect(0, 0, W, H);
  c.strokeStyle = '#1a1226'; c.lineWidth = 3;
  for (let j = 0; j < 10; j++) { c.beginPath(); c.moveTo(0, H * 0.06 * j); c.lineTo(W, H * 0.06 * j + 30); c.stroke(); }
  c.strokeStyle = '#140d1c'; c.lineWidth = 30;
  for (const rx of [0.08, 0.36, 0.64, 0.92]) { c.beginPath(); c.moveTo(W * rx - pan * 0.3, H); c.quadraticCurveTo(W * rx - pan * 0.3 + 40, H * 0.4, W * rx - pan * 0.3 + 10, 0); c.stroke(); }
  for (let k = 0; k < 5; k++) { // portholes with the sea behind them, and lanterns strung between
    const px = W * (0.12 + 0.19 * k) - pan * 0.3, py = H * 0.14;
    c.fillStyle = '#7a5a2e'; c.beginPath(); c.arc(px, py, 30, 0, TAU); c.fill();
    c.fillStyle = mixHex('#1a4f7a', '#3fb6d8', 0.5 + 0.3 * Math.sin(t + k)); c.beginPath(); c.arc(px, py, 21, 0, TAU); c.fill();
  }
  c.strokeStyle = '#2a2030'; c.lineWidth = 2;
  c.beginPath(); for (let x = 0; x <= W; x += 40) { const y = H * 0.25 + 30 * Math.sin((x / W) * Math.PI * 3); x === 0 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke();
  for (let k = 0; k < 12; k++) {
    const x = (k + 0.5) * (W / 12), y = H * 0.25 + 30 * Math.sin(((k + 0.5) / 12) * Math.PI * 3) + 10;
    const col = [HEX.gold, HEX.pink, HEX.cyan][k % 3]!;
    c.fillStyle = col; c.beginPath(); c.arc(x, y, 8, 0, TAU); c.fill();
    g.fillStyle = rgbaHex(col, 0.4); g.beginPath(); g.arc(x, y, 18, 0, TAU); g.fill();
  }
  for (let ri = ROWS.length - 1; ri >= 0; ri--) {
    const row = ROWS[ri]!;
    // the tier's step
    const p0 = seatPos(row, 0, pan);
    c.fillStyle = mixHex('#2a1d3a', '#3a2a4a', ri / 4);
    c.fillRect(0, p0.y + 40 * p0.s, W, 60 * p0.s);
    for (let col = 1; col <= 12; col++) {
      const p = seatPos(row, col, pan);
      if (p.x < -120 || p.x > W + 120) continue;
      seatShell(c, p.x, p.y, p.s);
      const kind = o.seats?.[`${row}${col}`] ?? seatKind(row, col);
      seatOccupant(c, g, kind, p.x, p.y - 30 * p.s, p.s, t, mood, ri * 13 + col, `${row}${col}`, o.hug ?? 0);
      // the seat number on the shell's lip
      c.font = font(FAM.monoB(), 15 * p.s); c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = 'rgba(255,240,210,0.55)'; c.fillText(`${row}${col}`, p.x, p.y + 52 * p.s);
    }
  }
  // the house lights down, a spotlight on the seats
  if (o.dim) {
    c.save();
    c.fillStyle = `rgba(4,3,10,${0.75 * o.dim})`;
    c.beginPath(); c.rect(0, 0, W, H);
    if (o.spot) c.arc(o.spot.x, o.spot.y, o.spot.r ?? 170, 0, TAU, true);
    c.fill('evenodd');
    c.restore();
  }
  if (o.spot) {
    const a = o.spot.a ?? 1;
    const sg = g.createRadialGradient(o.spot.x, o.spot.y, 0, o.spot.x, o.spot.y, o.spot.r ?? 170);
    sg.addColorStop(0, rgbaHex('#fff3c8', 0.3 * a)); sg.addColorStop(1, rgbaHex('#fff3c8', 0));
    g.fillStyle = sg; g.beginPath(); g.arc(o.spot.x, o.spot.y, o.spot.r ?? 170, 0, TAU); g.fill();
  }
}

function seatShell(c: C2, x: number, y: number, s: number) {
  c.fillStyle = '#e9c9a8';
  c.beginPath(); c.moveTo(x - 62 * s, y + 40 * s);
  c.quadraticCurveTo(x - 70 * s, y - 70 * s, x, y - 80 * s); c.quadraticCurveTo(x + 70 * s, y - 70 * s, x + 62 * s, y + 40 * s); c.closePath(); c.fill();
  c.strokeStyle = '#c9a07e'; c.lineWidth = 3 * s;
  for (let k = -3; k <= 3; k++) { c.beginPath(); c.moveTo(x, y + 36 * s); c.lineTo(x + k * 18 * s, y - 70 * s + Math.abs(k) * 8 * s); c.stroke(); }
  c.fillStyle = '#b07f5e'; c.fillRect(x - 64 * s, y + 36 * s, 128 * s, 26 * s);
}

const FISH_COLS = ['#ffd23f', '#ff8a2a', '#6f8cff', '#78d63a', '#ff4f9a', '#2fe0ff', '#c65cf0'];
function seatOccupant(c: C2, g: C2, kind: SeatKind, x: number, y: number, s: number, t: number, mood: Mood, i: number, key: string, hug: number) {
  const cheer = mood === 'cheer', freeze = mood === 'freeze';
  const bob = freeze ? 0 : cheer ? 12 * s * Math.abs(Math.sin(t * 7 + i)) : 3 * s * Math.sin(t * 1.8 + i);
  const yy = y - bob;
  if (kind === 'fish') {
    const col = FISH_COLS[i % FISH_COLS.length]!;
    c.fillStyle = col;
    c.beginPath(); c.ellipse(x, yy, 40 * s, 46 * s, 0, 0, TAU); c.fill();
    c.fillStyle = mixHex(col, '#ffffff', 0.3); c.beginPath(); c.ellipse(x, yy + 14 * s, 26 * s, 22 * s, 0, 0, TAU); c.fill();
    const fin = cheer ? -0.9 : mood === 'gasp' ? -0.4 : 0.4;
    c.fillStyle = mixHex(col, '#000000', 0.2);
    c.beginPath(); c.ellipse(x - 44 * s, yy + 4 * s, 10 * s, 24 * s, -fin, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(x + 44 * s, yy + 4 * s, 10 * s, 24 * s, fin, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(x - 8 * s, yy - 42 * s); c.quadraticCurveTo(x, yy - 66 * s, x + 12 * s, yy - 44 * s); c.fill();
    eyes(c, x, yy - 10 * s, s, mood, t, i);
    if (mood === 'freeze' && i % 9 === 4) { // the popcorn, drifting down from a frozen fin
      c.fillStyle = '#fff6d8';
      for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(x + 40 * s + k * 9 * s, yy + 40 * s + ((t * 30 + k * 20) % 60) * s, 5 * s, 0, TAU); c.fill(); }
    }
  } else if (kind === 'crab') {
    c.fillStyle = '#e8553a';
    c.beginPath(); c.ellipse(x, yy + 10 * s, 50 * s, 32 * s, 0, 0, TAU); c.fill();
    c.strokeStyle = '#e8553a'; c.lineWidth = 6 * s;
    c.beginPath(); c.moveTo(x - 14 * s, yy - 14 * s); c.lineTo(x - 18 * s, yy - 40 * s); c.moveTo(x + 14 * s, yy - 14 * s); c.lineTo(x + 18 * s, yy - 40 * s); c.stroke();
    eyes(c, x, yy - 44 * s, s * 0.9, mood, t, i, 36);
    const up = cheer ? -40 : 0;
    c.fillStyle = '#d0452d';
    c.beginPath(); c.ellipse(x - 58 * s, yy + (6 + up) * s, 16 * s, 22 * s, -0.3, 0, TAU); c.ellipse(x + 58 * s, yy + (6 + up) * s, 16 * s, 22 * s, 0.3, 0, TAU); c.fill();
  } else if (kind === 'jelly') {
    c.fillStyle = 'rgba(255,170,220,0.85)';
    c.beginPath(); c.arc(x, yy, 38 * s, Math.PI, 0); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,170,220,0.7)'; c.lineWidth = 3 * s;
    for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(x + k * 12 * s, yy); c.quadraticCurveTo(x + k * 12 * s + 8 * Math.sin(t * 3 + k), yy + 24 * s, x + k * 12 * s, yy + 40 * s); c.stroke(); }
    eyes(c, x, yy - 12 * s, s * 0.8, mood, t, i, 26);
    if (mood === 'sway') { g.fillStyle = rgbaHex(HEX.pink, 0.4); g.beginPath(); g.arc(x, yy - 10 * s, 50 * s, 0, TAU); g.fill(); }
  } else if (kind === 'anchor') {
    c.strokeStyle = '#5a6070'; c.lineWidth = 12 * s; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, yy - 50 * s); c.lineTo(x, yy + 30 * s); c.moveTo(x - 30 * s, yy - 30 * s); c.lineTo(x + 30 * s, yy - 30 * s); c.stroke();
    c.beginPath(); c.arc(x, yy + 4 * s, 34 * s, 0.2, Math.PI - 0.2); c.stroke();
    c.beginPath(); c.arc(x, yy - 60 * s, 10 * s, 0, TAU); c.stroke();
  } else if (kind === 'helmet') {
    c.fillStyle = '#b98a3e'; c.beginPath(); c.arc(x, yy - 6 * s, 42 * s, 0, TAU); c.fill();
    c.fillStyle = '#123'; c.beginPath(); c.arc(x, yy - 6 * s, 20 * s, 0, TAU); c.fill();
    c.strokeStyle = '#d9b070'; c.lineWidth = 5 * s; c.beginPath(); c.arc(x, yy - 6 * s, 20 * s, 0, TAU); c.stroke();
    c.fillStyle = '#8a6a2e'; c.fillRect(x - 46 * s, yy + 28 * s, 92 * s, 16 * s);
  } else if (kind === 'bell') {
    c.fillStyle = '#c9a24a';
    c.beginPath(); c.moveTo(x - 36 * s, yy + 34 * s); c.quadraticCurveTo(x - 30 * s, yy - 40 * s, x, yy - 44 * s); c.quadraticCurveTo(x + 30 * s, yy - 40 * s, x + 36 * s, yy + 34 * s); c.closePath(); c.fill();
    c.fillStyle = '#8a6a2e'; c.beginPath(); c.arc(x, yy + 38 * s, 8 * s, 0, TAU); c.fill();
  } else if (kind === 'stone') {
    stone(c, x, yy, 42 * s, { seed: i, heart: HEX.pink, heartA: 0.25 + 0.15 * Math.sin(t * 1.3 + i), tilt: 0.1 });
  } else if (kind === 'lunchbox') {
    // a child's lunchbox (the woman's), alone in seat C7; in chorus 2 a neighbour's fin rests on it
    c.fillStyle = '#ff5a5f'; c.beginPath(); c.roundRect(x - 34 * s, yy - 10 * s, 68 * s, 48 * s, 8 * s); c.fill();
    c.strokeStyle = '#8a2a2e'; c.lineWidth = 6 * s; c.beginPath(); c.arc(x, yy - 10 * s, 16 * s, Math.PI, 0); c.stroke();
    c.fillStyle = HEX.yellow; c.beginPath(); c.arc(x - 12 * s, yy + 12 * s, 9 * s, 0, TAU); c.fill();   // a star sticker
    c.fillStyle = '#ffffff'; c.fillRect(x + 4 * s, yy + 4 * s, 22 * s, 12 * s);                          // a name label, blank
    if (hug > 0) {
      c.save(); c.globalAlpha = clamp(hug);
      c.fillStyle = FISH_COLS[(i + 1) % FISH_COLS.length]!;
      c.beginPath(); c.ellipse(x + 30 * s, yy - 16 * s, 12 * s, 30 * s, 1.1, 0, TAU); c.fill();
      c.restore();
    }
  }
  void key;
}

function eyes(c: C2, x: number, y: number, s: number, mood: Mood, t: number, i: number, gap = 30) {
  const blink = !(mood === 'freeze') && ((t * 0.7 + h01(i, 51)) % 1) < 0.04;
  const big = mood === 'gasp' || mood === 'freeze' ? 1.35 : 1;
  for (const k of [-1, 1]) {
    const ex = x + k * gap * 0.5 * s;
    c.fillStyle = '#ffffff';
    c.beginPath(); c.ellipse(ex, y, 10 * s * big, (blink ? 1.5 : 12) * s * big, 0, 0, TAU); c.fill();
    if (!blink) { c.fillStyle = '#111'; c.beginPath(); c.arc(ex + (mood === 'freeze' ? 0 : 2 * s), y + 2 * s, 5 * s, 0, TAU); c.fill(); }
  }
}

/** A fish swimming past in profile (the chorus line), from _world. */
export const swimmer = fish;

// ------------------------------------------------------------------ the TV graphics package

/**
 * Rows for a line at most `maxW` wide, balanced by the midpoint rule (a word goes to the next row when more than half
 * of it would pass the row's share of the line), so a line never leaves a one-word orphan the way the shared
 * karaoke's 4% rule can. Returns word indices per row.
 */
export function balancedRows(c: C2, line: Line, maxW: number): number[][] {
  const sp = c.measureText(' ').width, ws = line.words.map((w) => c.measureText(w.w).width);
  const total = ws.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
  const n = Math.max(1, Math.ceil(total / maxW)), target = total / n;
  const rows: number[][] = [[]];
  let acc = 0;
  ws.forEach((w, i) => {
    if (rows[rows.length - 1]!.length && acc + w / 2 > target * rows.length && rows.length < n) rows.push([]);
    rows[rows.length - 1]!.push(i); acc += w + sp;
  });
  return rows;
}

/**
 * The lyric as the show's lower third: a slanted ink plate with a gold rule and a pink tab, the line in Archivo bold
 * with each word filling yellow as it is sung (pdoom's karaoke rules: never ahead of the voice; unsung at 62%).
 */
export function lowerThird(c: C2, line: Line, t: number, o: { y?: number; size?: number; sung?: string; maxW?: number; until?: number } = {}) {
  const lead = 0.4, first = line.words[0]!.start, until = o.until ?? line.end + 0.35;
  if (t < first - lead || t > until + 0.2) return;
  const size = o.size ?? 48, y = o.y ?? H - 112, maxW = o.maxW ?? W - 360, lh = size * 1.2;
  c.font = font(FAM.bold(), size);
  const sp = c.measureText(' ').width, ws = line.words.map((w) => c.measureText(w.w).width);
  const rows = balancedRows(c, line, maxW);
  const rowWs = rows.map((r) => r.reduce((a, i) => a + ws[i]!, 0) + sp * (r.length - 1));
  const ph = rows.length * lh + 34, pw = Math.max(...rowWs) + 110;
  const inA = clamp((t - (first - lead)) / 0.18), outA = 1 - clamp((t - until) / 0.2);
  const slide = (1 - ease.outExpo(inA)) * 120;
  c.save();
  c.globalAlpha *= Math.min(inA * 2, 1) * outA;
  c.translate(W / 2 - slide, y);
  c.save();
  c.transform(1, 0, -0.18, 1, 0, 0);   // the slant
  c.fillStyle = 'rgba(14,10,24,0.9)'; c.beginPath(); c.roundRect(-pw / 2, -ph / 2, pw, ph, 6); c.fill();
  c.fillStyle = HEX.gold; c.fillRect(-pw / 2, -ph / 2 - 6, pw, 6);
  c.fillStyle = HEX.pink; c.fillRect(-pw / 2 - 26, -ph / 2 - 6, 26, ph + 6);
  c.restore();
  c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  let cy = -((rows.length - 1) * lh) / 2 + size * 0.36;
  rows.forEach((row, ri) => {
    let cx = -rowWs[ri]! / 2 + 10 + 0.18 * (size * 0.36 - cy);   // follow the slant
    for (const i of row) {
      const w = line.words[i]!, p = Lyrics.wordProgress(w, t);
      c.fillStyle = 'rgba(244,241,234,0.62)'; c.fillText(w.w, cx, cy);
      if (p > 0) {
        c.save(); c.beginPath(); c.rect(cx - 2, cy - size * 1.2, (ws[i]! + 4) * p, size * 1.6); c.clip();
        c.fillStyle = o.sung ?? HEX.yellow; c.fillText(w.w, cx, cy); c.restore();
      }
      cx += ws[i]! + sp;
    }
    cy += lh;
  });
  c.restore();
}

/** Closed captions for the spoken parts: Cormorant italic on a black box, each word appearing as it is said. */
export function captions(c: C2, line: Line, t: number, o: { y?: number; size?: number; until?: number } = {}) {
  const first = line.words[0]!.start, until = o.until ?? line.end + 0.6;
  if (t < first - 0.05 || t > until + 0.2) return;
  const size = o.size ?? 52, y = o.y ?? H - 120;
  c.font = font(FAM.serif(), size);
  const tw = c.measureText(line.text).width;
  c.save();
  c.globalAlpha *= 1 - clamp((t - until) / 0.2);
  c.fillStyle = 'rgba(0,0,0,0.78)';
  c.fillRect(W / 2 - tw / 2 - 24, y - size * 0.95, tw + 48, size * 1.35);
  karaoke(c, line, t, W / 2, y, size, { fam: FAM.serif(), sung: HEX.bone, unsung: 'rgba(244,241,234,0)', lead: 0.05, until });
  c.restore();
}

/** The LIVE bug, top left: a red dot and a label; the show's small logo top right. */
export function liveBug(c: C2, g: C2 | null, t: number, label = 'LIVE', o: { logo?: boolean } = { logo: false }) {
  const on = Math.floor(t * 1.5) % 2 === 0;
  c.font = font(FAM.monoB(), 28); c.textAlign = 'left'; c.textBaseline = 'middle';
  const tw = c.measureText(label).width;
  c.fillStyle = 'rgba(10,8,16,0.7)'; c.beginPath(); c.roundRect(60, 50, tw + 70, 48, 8); c.fill();
  c.fillStyle = on ? '#ff3b3b' : '#6a1a1e'; c.beginPath(); c.arc(86, 74, 10, 0, TAU); c.fill();
  if (on && g) { g.fillStyle = 'rgba(255,59,59,0.5)'; g.beginPath(); g.arc(86, 74, 18, 0, TAU); g.fill(); }
  c.fillStyle = '#f4f1ea'; c.fillText(label, 106, 75);
  if (o.logo) {
    c.font = font(FAM.hook(), 26); c.textAlign = 'right';
    c.fillStyle = rgbaHex(HEX.gold, 0.85); c.fillText("WHAT'S IT WORTH?", W - 64, 76);
  }
}

/** A camera tag in the corner ("CAM 2"), as a multi-camera cut shows it for a beat. */
export function camTag(c: C2, label: string, t: number, t0: number) {
  const a = 1 - clamp((t - t0 - 0.6) / 0.3);
  if (t < t0 || a <= 0) return;
  c.save(); c.globalAlpha *= a;
  c.font = font(FAM.monoB(), 24); c.textAlign = 'right'; c.textBaseline = 'middle';
  c.fillStyle = 'rgba(10,8,16,0.7)'; c.fillRect(W - 210, H - 230, 150, 40);
  c.fillStyle = '#ff3b3b'; c.fillRect(W - 210, H - 230, 8, 40);
  c.fillStyle = '#f4f1ea'; c.fillText(label, W - 76, H - 209);
  c.restore();
}

/** Scanlines over a rect. */
export function scanlines(c: C2, x: number, y: number, w: number, h: number, a = 0.2, pitch = 4) {
  c.fillStyle = `rgba(0,0,0,${a})`;
  for (let yy = y; yy < y + h; yy += pitch) c.fillRect(x, yy, w, pitch / 2);
}

/**
 * The archive look over a rect (draw the footage first): VHS scanlines, a rolling tracking band, chroma fringes, a
 * timecode and the ARCHIVE label.
 */
export function vhs(c: C2, t: number, x = 0, y = 0, w = W, h = H, label = 'ARCHIVE') {
  c.save();
  c.beginPath(); c.rect(x, y, w, h); c.clip();
  c.globalCompositeOperation = 'screen';
  c.fillStyle = 'rgba(255,60,120,0.08)'; c.fillRect(x + 3, y, w, h);
  c.fillStyle = 'rgba(60,200,255,0.06)'; c.fillRect(x - 3, y, w, h);
  c.globalCompositeOperation = 'source-over';
  scanlines(c, x, y, w, h, 0.22, 4);
  const band = y + ((t * 0.18) % 1.2) * h - 0.1 * h;
  c.fillStyle = 'rgba(255,255,255,0.06)'; c.fillRect(x, band, w, 26);
  const k = frameIdx(t);
  c.fillStyle = 'rgba(255,255,255,0.25)';
  for (let i = 0; i < 6; i++) c.fillRect(x + h01(k, i, 1) * w, y + h01(k, i, 2) * h, 30 + 120 * h01(k, i, 3), 1.5);
  const s = Math.max(14, h * 0.035);
  c.font = font(FAM.monoB(), s); c.textBaseline = 'top'; c.textAlign = 'left';
  c.fillStyle = 'rgba(244,241,234,0.9)';
  c.fillText(`▶ ${label}`, x + s, y + s);
  c.textAlign = 'right';
  const tc = (v: number) => `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(Math.floor(v % 60)).padStart(2, '0')}:${String(Math.floor((v % 1) * 25)).padStart(2, '0')}`;
  c.fillText(tc(t), x + w - s, y + h - 2.2 * s);
  c.restore();
}

/** The night-vision outside broadcast over a rect (draw the scene first): green, grain, scanlines, a vignette. */
export function nightVision(c: C2, t: number, x = 0, y = 0, w = W, h = H) {
  c.save();
  c.beginPath(); c.rect(x, y, w, h); c.clip();
  c.globalCompositeOperation = 'color';
  c.fillStyle = '#6cff6c'; c.fillRect(x, y, w, h);
  c.globalCompositeOperation = 'multiply';
  c.fillStyle = '#7fd07f'; c.fillRect(x, y, w, h);
  c.globalCompositeOperation = 'source-over';
  const k = frameIdx(t);
  c.fillStyle = 'rgba(200,255,200,0.12)';
  for (let i = 0; i < 260; i++) c.fillRect(x + h01(k, i, 11) * w, y + h01(k, i, 12) * h, 2, 2);
  scanlines(c, x, y, w, h, 0.18, 3);
  const vg = c.createRadialGradient(x + w / 2, y + h / 2, h * 0.3, x + w / 2, y + h / 2, w * 0.62);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,10,0,0.75)');
  c.fillStyle = vg; c.fillRect(x, y, w, h);
  c.restore();
}

/** A channel flip: a burst of static that covers the frame for `dur` from t0 (draw last). */
export function staticFlip(c: C2, t: number, t0: number, dur = 0.16) {
  const u = (t - t0) / dur;
  if (u < 0 || u > 1) return;
  const k = frameIdx(t), a = Math.sin(u * Math.PI);
  c.save();
  c.globalAlpha = 0.9 * a;
  c.fillStyle = '#111'; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 900; i++) {
    const v = h01(k, i, 21);
    c.fillStyle = v < 0.5 ? '#ddd' : '#555';
    c.fillRect(h01(k, i, 22) * W, h01(k, i, 23) * H, 6 + 40 * h01(k, i, 24), 3);
  }
  c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(0, H * h01(k, 9, 25), W, 30);
  c.restore();
}

/** Rai's microphone, for drawRai's `prop`: a silver handheld mic tilted up towards her mouth. */
export function micProp(c: C2, R: number) {
  c.save(); c.rotate(-0.35); c.scale(1.3, 1.3);
  c.fillStyle = '#2a2a33'; c.beginPath(); c.roundRect(-0.045 * R, -0.42 * R, 0.09 * R, 0.5 * R, 0.03 * R); c.fill();
  c.fillStyle = '#d8dbe4'; c.beginPath(); c.arc(0, -0.48 * R, 0.1 * R, 0, TAU); c.fill();
  c.strokeStyle = '#8a8f9c'; c.lineWidth = 0.012 * R;
  for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(-0.09 * R, -0.48 * R + k * 0.035 * R); c.lineTo(0.09 * R, -0.48 * R + k * 0.035 * R); c.stroke(); }
  c.fillStyle = HEX.pink; c.fillRect(-0.05 * R, -0.36 * R, 0.1 * R, 0.05 * R);
  c.restore();
}

/** A full-frame stage backdrop when a plate cuts close (a close-up of Rai): the curtain, bokeh of bulbs, a spot. */
export function closeBackdrop(c: C2, g: C2, t: number, o: { col?: string; bulbs?: number; curtain?: boolean } = {}) {
  const bg = c.createRadialGradient(W / 2, H * 0.45, 50, W / 2, H * 0.5, W * 0.7);
  bg.addColorStop(0, mixHex('#2a1a40', o.col ?? '#3a2a5a', 0.6)); bg.addColorStop(1, '#0a0716');
  c.fillStyle = bg; c.fillRect(0, 0, W, H);
  if (o.curtain !== false) {
    for (let i = 0; i < 18; i++) {
      const x = i * (W / 17), col = i % 2 ? '#0f3a26' : '#14482e';
      c.fillStyle = col;
      c.beginPath(); c.moveTo(x - 50, 0);
      for (let y = 0; y <= H; y += 40) c.lineTo(x - 50 + 12 * Math.sin(t * 1.4 + i + y * 0.01), y);
      for (let y = H; y >= 0; y -= 40) c.lineTo(x + 50 + 12 * Math.sin(t * 1.4 + i + y * 0.01), y);
      c.closePath(); c.fill();
    }
    c.fillStyle = 'rgba(10,6,20,0.45)'; c.fillRect(0, 0, W, H);
  }
  const n = o.bulbs ?? 18;
  for (let i = 0; i < n; i++) { // out-of-focus bulbs
    const x = h01(i, 31) * W, y = h01(i, 32) * H * 0.7, r = 20 + 40 * h01(i, 33), a = 0.15 + 0.15 * Math.sin(t * 3 + i);
    g.fillStyle = rgbaHex(i % 3 ? HEX.gold : HEX.pink, a); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
}
