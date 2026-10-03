// archive's studio gags (shared with twist, which picks up the trapdoor shot across the cut): the pole through her
// heart, the trapdoor drop and the pop back up, and the archive feed on the studio screen.
import { W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { clamp, ease } from '../../engine/util';
import { drawRai } from '../_rai';
import { speedLines } from '../_manga';
import { rgbaHex } from '../_motifs';
import { SET, studio, studioFront, liveBug, micProp, vhs } from './_studio';
import { pole, cam2, trapdoor, standSign, applause, sfx, type C2 } from './onair-kit';
import { showSpots, raiAt } from './onair-show';
import { storm } from './archive-reels';

// ------------------------------------------------------------------ the pole through the hole in her heart

/** The pole's axis: from the near end (front right, towards us) through her heart to the far end (back left). */
export const POLE_DIR = (() => { const x = -600, y = -60, l = Math.hypot(x, y); return { x: x / l, y: y / l }; })();
const poleW = (s: number) => clamp(36 - 0.03 * s, 14, 64);

/**
 * The pole with its tip `sTip` px past her heart along the axis (negative: not there yet), length `len`. Draw the
 * 'back' part (past the hole, behind her) before Rai and the 'front' part after her. Returns the near end (the
 * stagehand's grip).
 */
export function poleThrough(c: C2, hole: { x: number; y: number }, sTip: number, len: number, part: 'back' | 'front') {
  const at = (s: number) => ({ x: hole.x + POLE_DIR.x * s, y: hole.y + POLE_DIR.y * s });
  const sTail = sTip - len;
  if (part === 'back' && sTip > 0) {
    const a = at(Math.max(0, sTail)), b = at(sTip);
    pole(c, b.x, b.y, a.x, a.y, poleW(sTip), poleW(Math.max(0, sTail)));
  }
  if (part === 'front' && sTail < 0) {
    const a = at(Math.min(0, sTip)), b = at(sTail);
    pole(c, a.x, a.y, b.x, b.y, poleW(Math.min(0, sTip)), poleW(sTail));
  }
  return at(sTail);
}

// ------------------------------------------------------------------ the trapdoor

/** The trapdoor's opening (0..1) at t: opens on "bottom", shuts once she is back out. */
export const trapOpen = (t: number, tOpen: number, tUp: number) => clamp((t - tOpen) / 0.08) * (1 - clamp((t - tUp - 0.3) / 0.1));

/**
 * Her vertical offset (px, down positive) through the gag: still until tOpen, then she drops through (gone by
 * +0.3 s), and at tUp she shoots back up out of the hole, peaks, and lands at tUp + 0.45. `R` scales the hop.
 */
export function trapDrop(t: number, tOpen: number, tUp: number, R: number): { dy: number; squash: number; airborne: boolean } {
  if (t < tOpen + 0.05) return { dy: 0, squash: 0, airborne: false };
  if (t < tUp) { const a = t - tOpen - 0.05; return { dy: Math.min(4 * R, 0.5 * 12000 * a * a), squash: 0.35, airborne: true }; }
  const a = t - tUp;
  if (a < 0.2) return { dy: 3.4 * R + (-0.75 * R - 3.4 * R) * ease.outQuad(a / 0.2), squash: 0.3, airborne: true };
  if (a < 0.45) return { dy: -0.75 * R + 0.75 * R * ease.inQuad((a - 0.2) / 0.25), squash: 0.1, airborne: true };
  const l = a - 0.45;
  return { dy: 0, squash: l < 0.18 ? -0.4 * Math.sin((l / 0.18) * Math.PI) : 0, airborne: false };
}

// ------------------------------------------------------------------ the archive on the studio screen

/**
 * A StudioOpts.screen drawer that plays a full-frame reel shrunk into the CRT (letterboxed 16:9, so a push into the
 * screen lands exactly on the full-frame shot), with the VHS look on the picture.
 */
export function feed(t: number, draw: (c: C2, g: C2) => void, label = 'ARCHIVE') {
  return (c: C2, g: C2, x: number, y: number, w: number, h: number) => {
    const k = w / W, ph = H * k, py = y + (h - ph) / 2;
    c.fillStyle = '#05060a'; c.fillRect(x, y, w, h);
    c.save(); g.save();
    c.beginPath(); c.rect(x, py, w, ph); c.clip();
    g.beginPath(); g.rect(x, py, w, ph); g.clip();
    for (const cc of [c, g]) { cc.translate(x, py); cc.scale(k, k); }
    draw(c, g);
    c.restore(); g.restore();
    vhs(c, t, x, py, w, ph, label);
  };
}

/** The screen's rect on the set and the camera that fills the frame with its 16:9 picture. */
export function screenPush(S: { x: number; y: number; w: number; h: number }) {
  return { x: S.x + S.w / 2 - W / 2, y: S.y + S.h / 2 - H / 2, zoom: W / S.w };
}

// ------------------------------------------------------------------ the trapdoor shot (archive's last, twist's first)

export interface TrapTimes { t0: number; went: number; tOpen: number; tUp: number }

/**
 * The wide on the trapdoor gag, one function for both sides of the archive -> twist cut so the frames match: the
 * tragic beat ("I went to the"), the drop on "bottom" (LAUGH), the pop back up on "sea" (dizzy), the landing on the
 * shut trapdoor, and the dust-off (grin). `t0` is the shot's start (archive's cut), the storm feed on the screen
 * re-strikes there.
 */
export function trapShot(c: C2, g: C2, t: number, k: TrapTimes, vocal: number) {
  const R = raiAt(150), signX = R.x - 250, { tOpen, tUp } = k;
  const drop = trapDrop(t, tOpen, tUp, R.R), open = trapOpen(t, tOpen, tUp);
  const landed = t >= tUp + 0.45;
  cam2([c, g], { zoom: 1 }, () => {
    studio(c, g, t, {
      curtain: 0, ring: 0, sign: 1, onAir: true, house: 0.72, spots: showSpots(t), score: null,
      cue: t >= tOpen ? 'LAUGH' : null, cueT0: tOpen + 0.1,
      screen: feed(t, (cc, gg) => storm(cc, gg, t, { bolt: k.t0, tilt: 0.3, slide: 1, face: 'shock' })),
    });
    trapdoor(c, R.x, SET.floor - 4, 250, open, t);
    standSign(c, signX, SET.floor + 6, 0.8, t, t > tOpen && t < tOpen + 0.6 ? 0.1 * Math.sin((t - tOpen) * 30) * (1 - (t - tOpen) / 0.6) : 0);
    c.save();
    if (drop.dy > 0) { c.beginPath(); c.rect(-W, -H, W * 3, SET.floor + 16 + H); c.clip(); }
    const tragic = t < tOpen, dust = landed ? Math.sin((t - tUp - 0.45) * 22) : 0;
    drawRai(c, R.x, R.y + drop.dy, R.R, {
      t, glow: HEX.gold, glowStrength: 0.6, heart: 0.35 + 0.4 * vocal, prop: { side: 1, draw: micProp },
      face: tragic ? 'sad' : t < tUp ? 'shock' : landed && t > tUp + 0.6 ? 'grin' : 'dizzy',
      arms: tragic ? ['cheek', 'chin'] : landed ? ['shrug', 'chin'] : ['up', 'up'], armsFrom: ['hip', 'chin'], armsU: clamp((t - k.t0) / 0.2),
      marks: tragic ? ['gloom'] : landed && t > tUp + 0.6 ? ['sparkle'] : t >= tUp ? ['sweat'] : [], markT0: tragic ? k.went : landed ? tUp + 0.6 : tUp,
      tilt: t >= tUp && !landed ? 0.15 * Math.sin((t - tUp) * 14) : landed ? 0.04 * dust : 0, squash: drop.squash,
    });
    c.restore();
    if (landed && t < tUp + 1.0) { // dust off: puffs from where she patted
      for (let i = 0; i < 6; i++) {
        const a = (t - tUp - 0.45) / 0.55, px = R.x + (i - 2.5) * 40, py = R.y + 0.4 * R.R - a * 60 - (i % 2) * 20;
        c.fillStyle = `rgba(230,220,200,${0.5 * (1 - a)})`; c.beginPath(); c.arc(px, py, 10 + 20 * a, 0, Math.PI * 2); c.fill();
      }
    }
    if (t >= tOpen && t < tUp) { // the whistle-fall: speed lines into the hole and a falling squiggle
      c.save(); c.beginPath(); c.rect(R.x - 220, 0, 440, SET.floor); c.clip();
      speedLines(c, Math.PI / 2, 'rgba(255,255,255,0.6)', t, { n: 26, speed: 2600, band: [R.x - 200 - (W / 2 - H / 2), R.x + 200 - (W / 2 - H / 2)] });
      c.restore();
      whistle(c, R.x + 40, SET.floor - 420, clamp((t - tOpen) / 0.5));
    }
    if (t >= tUp && t < tUp + 0.4) applause(c, g, t, 1, SET.floor, 30, 8);
    if (open > 0.01) { // the shaft is dark: no spotlight pool glowing over the hole
      const tw = 250, d = tw * 0.2, y = SET.floor - 4;
      g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = `rgba(0,0,0,${0.9 * open})`;
      g.beginPath(); g.moveTo(R.x - tw / 2, y - d / 2); g.lineTo(R.x + tw / 2, y - d / 2); g.lineTo(R.x + tw / 2 + 6, y + d / 2); g.lineTo(R.x - tw / 2 - 6, y + d / 2); g.closePath(); g.fill();
      g.restore();
    }
    studioFront(c, g, t, { crowd: 1, mood: t >= tOpen + 0.15 ? 'cheer' : 'calm' });
  });
  liveBug(c, g, t, 'LIVE');
  sfx(c, 'THUD', R.x + 160, SET.floor - 30, 56, t, tOpen + 0.38, tOpen + 0.75, { col: HEX.bone, rot: 0.1 });
}

/** The falling whistle as a picture: a squiggle that stretches as it drops. */
function whistle(c: C2, x: number, y: number, u: number) {
  c.save(); c.strokeStyle = rgbaHex('#ffffff', 0.85 * (1 - u * 0.5)); c.lineWidth = 5; c.lineCap = 'round';
  c.beginPath();
  for (let i = 0; i <= 40; i++) { const v = i / 40, yy = y + v * 380 * (0.3 + u), xx = x + Math.sin(v * 14) * (24 - 16 * v); i ? c.lineTo(xx, yy) : c.moveTo(xx, yy); }
  c.stroke(); c.restore();
}
