// UPTHEROAD (v1, 96.07-102.92; lines 25-26): the outside broadcast, the ledger's look, and the "nothing" beat. The
// film's heart, so the compositor stays out of it: no shakes, no punches, no kick zoom. Three shots.
//   25 "but up the road there's a woman awake at four with a fever, a lunchbox, a bill,"
//     U1 the quick-fire clock hits zero and the channel flips: static, CH 04, then LIVE · UP THE ROAD, a night-vision
//        feed of a kitchen at 4 am, rain on the window. One OB camera, its operator snap-zooming to each thing on its
//        word with focus brackets: the woman rocking her child by the window (she sighs on "awake"); the wall clock at
//        4:00 on "four"; the child's tear and the thermometer glowing 39.4 on "fever"; the lunchbox on the counter on
//        "lunchbox", which blooms into its own red (the only colour in the feed: seat C7's lunchbox); the bill under a
//        star magnet on "bill", DUE £82.40. Rai watches from the studio in a picture-in-picture: serious, soft, sad,
//        then "!" when she knows the lunchbox.
//   26 "and your ledger looks right at her, blinks, and writes zero. Not minus. Just nothing. Still."
//     U2 the studio scoreboard full frame, in LEDs: HER SCORE, the woman in lime dots (the feed's picture), and the
//        ledger's eye forming on "looks", turning to her, a scan line passing over her on "right at her", a blink on
//        "blinks"; it closes on "writes" and the stroke becomes a pink 0 on "zero". On "Not" a red minus flickers in
//        front of the 0; on "minus." a wipe takes it away.
//     U3 the wide studio, FROZEN (the set drawn at the instant of the cut): the fish in the front row mid-bob, one
//        holding popcorn that keeps drifting down, the octopus holding QUIET, the cue sign QUIET, the crab at its
//        camera. Only the feed on the studio screen still moves (she is still rocking her child) and Rai: frozen in her
//        showbiz pose, her face falls on "nothing." (deadpan, arms down), then on "Still." she is cross (a vein, steam,
//        fists on hips), and one bubble rises out of the hole that is her heart.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../../engine/scene';
import { Layer2D, W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import type { Line, Word } from '../../engine/lyrics';
import { clamp, ease, lerp, frameIdx } from '../../engine/util';
import { drawRai, h01, type Face, type RaiOpts } from '../_rai';
import { FAM, TAU, rgbaHex } from '../_motifs';
import { SET, studio, studioFront, octopus, crabCam, liveBug, micProp, nightVision, staticFlip, scanlines, ledText } from './_studio';
import { plateLines, wordOf, lyricBand, backdrop, LedMatrix } from './pitch-kit';
import { K, kitchen, lunchbox, brackets } from './uptheroad-kitchen';
import { BOARD_FULL, BOARD_SMALL, boardMatrix, bezel, type BoardState } from './uptheroad-board';

type C2 = CanvasRenderingContext2D;
interface CamKey { t: number; x: number; y: number; z: number }

export default class UpTheRoad extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  band: Line[] = [];
  w: Record<string, Word> = {};
  cutBoard = 0;
  cutWide = 0;
  keys: CamKey[] = [];
  full = new LedMatrix(BOARD_FULL.cols, BOARD_FULL.rows);
  small = new LedMatrix(BOARD_SMALL.cols, BOARD_SMALL.rows);

  override init() {
    const { lyrics, audio: au, start, end } = this.ctx;
    const { own, band } = plateLines(lyrics.lines, start, end);
    this.band = band;
    const q = (re: RegExp, n = 0) => wordOf(own, re, n);
    this.w = {
      road: q(/^road/), woman: q(/^woman/), awake: q(/^awake/), four: q(/^four/), fever: q(/^fever/), lunchbox: q(/^lunchbox/),
      bill: q(/^bill/), ledger: q(/^ledger/), looks: q(/^looks/), right: q(/^right/), her: q(/^her$/), blinks: q(/^blinks/),
      writes: q(/^writes/), zero: q(/^zero/), not: q(/^not$/), minus: q(/^minus/), just: q(/^just/), nothing: q(/^nothing/), still: q(/^still/),
    };
    const b0 = Math.round(au.beatAt(start));
    this.cutBoard = au.timeOfBeat(b0 + 8);    // the beat before "and your ledger"
    this.cutWide = au.timeOfBeat(b0 + 13);    // the beat before "Just nothing."
    const w = this.w;
    // the OB camera's snap-zooms, one per thing, on its word
    this.keys = [
      { t: start, x: 960, y: 540, z: 1.0 },
      { t: w.woman!.start - 0.05, x: 1010, y: 520, z: 1.14 },
      { t: w.four!.start - 0.04, x: 1230, y: 330, z: 1.65 },
      { t: w.fever!.start - 0.04, x: 1120, y: 450, z: 2.15 },
      // the list is fast ("a lunchbox, a bill"): the lunchbox on the counter and the bill on the fridge beside it share
      // one framing from the article before "lunchbox"; on "bill" the camera leans to the fridge as the brackets move
      { t: w.lunchbox!.start - 0.15, x: 410, y: 520, z: 2.15 },
      { t: w.bill!.start - 0.06, x: 480, y: 470, z: 2.2 },
    ];
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t;
    this.L.clear(HEX.ink); this.G.clear();
    if (t < this.cutBoard) this.feed(c, g, t);
    else if (t < this.cutWide) this.board(c, g, t);
    else this.wide(c, g, t);
    lyricBand(c, this.band, t);
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    return { bloom: 0.6 };   // no shake, no punch, no kick: the stillness is the hit
  }

  // ------------------------------------------------------------------ 25: the outside broadcast

  /** The OB camera at t: snap-zooms between keys (0.18 s each), a slow push in between. */
  cam(t: number) {
    const ks = this.keys, snap = 0.14;
    let i = 0;
    while (i + 1 < ks.length && t >= ks[i + 1]!.t) i++;
    const k = ks[i]!, p = ks[i - 1];
    const u = p ? ease.inOutCubic(clamp((t - k.t) / snap)) : 1, drift = 1 + 0.025 * Math.max(0, t - k.t - snap);
    const from = p ?? k;
    return { x: lerp(from.x, k.x, u), y: lerp(from.y, k.y, u), z: lerp(from.z, k.z, u) * (i === 0 ? 1 + 0.1 * clamp((t - k.t) / (ks[1]!.t - k.t)) : drift) };
  }

  /** The kitchen feed, night vision, in the rect (x, y, w, h) of the frame (full frame, or the studio screen). */
  kitchenFeed(c: C2, t: number, cam: { x: number; y: number; z: number }, rect: [number, number, number, number], lunchCol: number) {
    const [rx, ry, rw, rh] = rect, s = Math.max(rw / W, rh / H), ox = rx + (rw - W * s) / 2, oy = ry + (rh - H * s) / 2;
    const w = this.w;
    c.save();
    c.beginPath(); c.rect(rx, ry, rw, rh); c.clip();
    c.translate(ox, oy); c.scale(s, s);
    c.translate(W / 2, H / 2); c.scale(cam.z, cam.z); c.translate(-cam.x, -cam.y);
    kitchen(c, t, { fever: clamp((t - w.fever!.start) / 0.15), sighT0: w.awake!.start, tearT0: w.fever!.start + 0.05, lunchGrey: true });
    c.restore();
    nightVision(c, t, rx, ry, rw, rh);
    if (lunchCol > 0) { // the lunchbox keeps its colour (the same one as seat C7's)
      c.save(); c.beginPath(); c.rect(rx, ry, rw, rh); c.clip();
      c.translate(ox, oy); c.scale(s, s);
      c.translate(W / 2, H / 2); c.scale(cam.z, cam.z); c.translate(-cam.x, -cam.y);
      c.globalAlpha = lunchCol;
      lunchbox(c, K.lunchbox.x, K.lunchbox.y, 1.6, 1);
      c.restore();
    }
  }

  /** World point to screen through the OB camera. */
  toScreen(cam: { x: number; y: number; z: number }, x: number, y: number) { return { x: (x - cam.x) * cam.z + W / 2, y: (y - cam.y) * cam.z + H / 2 }; }

  feed(c: C2, g: C2, t: number) {
    const w = this.w, { start } = this.ctx, cam = this.cam(t);
    const lunchCol = ease.inOutQuad(clamp((t - w.lunchbox!.start) / 0.22));
    this.kitchenFeed(c, t, cam, [0, 0, W, H], lunchCol);
    if (lunchCol > 0) {
      const p = this.toScreen(cam, K.lunchbox.x, K.lunchbox.y - 40);
      g.fillStyle = rgbaHex('#ff5a5f', 0.04 * lunchCol); g.beginPath(); g.arc(p.x, p.y, 60 * cam.z, 0, TAU); g.fill();
    }
    // the operator's focus brackets, snapping to each thing on its word
    const box = (x: number, y: number, bw: number, bh: number, t0: number, t1: number) => {
      if (t < t0 || t > t1) return;
      const a = this.toScreen(cam, x - bw / 2, y - bh / 2), b = this.toScreen(cam, x + bw / 2, y + bh / 2);
      brackets(c, a.x, a.y, b.x - a.x, b.y - a.y, t, t0);
    };
    box(K.woman.x + 20, K.woman.y - 300, 320, 620, w.woman!.start + 0.12, w.four!.start - 0.05);
    box(K.clock.x, K.clock.y, 180, 180, w.four!.start + 0.14, w.fever!.start - 0.05);
    box(K.woman.x + 80, K.woman.y - 470, 180, 160, w.fever!.start + 0.14, w.lunchbox!.start - 0.05);
    box(K.lunchbox.x, K.lunchbox.y - 40, 150, 120, w.lunchbox!.start, w.bill!.start - 0.04);
    box(K.bill.x, K.bill.y + 70, 170, 200, w.bill!.start - 0.04, 1e9);
    // the broadcast furniture: LIVE · UP THE ROAD, the feed's own clock, CH 04 as the channel comes in, Rai's PIP
    liveBug(c, g, t, 'LIVE · UP THE ROAD');
    const ss = 7 + Math.floor(t - start);
    c.font = font(FAM.monoB(), 26); c.textAlign = 'right'; c.textBaseline = 'middle'; c.fillStyle = 'rgba(220,255,220,0.85)';
    c.fillText(`04:00:${String(ss).padStart(2, '0')}`, W - 70, H - 230);
    if (t < w.woman!.start) {
      c.font = font(FAM.monoB(), 64); c.fillStyle = '#7dff7d'; c.textAlign = 'right';
      c.fillText('CH 04', W - 80, 100);
    }
    this.pip(c, g, t);
    // the channel flip: the quick-fire clock hit zero
    staticFlip(c, t, start - 0.1, 0.34);
  }

  /** Rai in the studio, picture-in-picture, top right: watching the feed. */
  pip(c: C2, g: C2, t: number) {
    const w = this.w, t0 = w.woman!.start - 0.05, u = ease.outCubic(clamp((t - t0) / 0.25));
    if (u <= 0) return;
    const bw = 420, bh = 236, bx = W - 60 - bw + (1 - u) * (bw + 80), by = 40;
    const face: Face = t > w.bill!.start ? 'serious' : t > w.lunchbox!.start + 0.1 ? 'wow' : t > w.fever!.start ? 'sad' : 'soft';
    c.save();
    c.beginPath(); c.roundRect(bx, by, bw, bh, 10); c.clip();
    c.translate(bx, by); c.scale(bw / W, bh / H);
    backdrop(c, g, t, '#2a1a40', 10, 21);
    drawRai(c, 960, 1080 - 1.07 * 330 + 120, 330, {
      t, face, look: -1, arms: face === 'wow' ? ['cheek', 'down'] : ['down', 'down'], prop: { side: 1, draw: micProp }, glow: HEX.bone, heart: face === 'sad' ? 0.8 : 0.35,
      marks: face === 'wow' ? ['!'] : face === 'sad' ? ['sweat'] : [], markT0: face === 'wow' ? w.lunchbox!.start + 0.1 : w.fever!.start,
    });
    c.restore();
    c.strokeStyle = HEX.gold; c.lineWidth = 4; c.beginPath(); c.roundRect(bx, by, bw, bh, 10); c.stroke();
    c.fillStyle = 'rgba(10,8,16,0.8)'; c.fillRect(bx + 12, by + bh - 44, 128, 32);
    c.fillStyle = HEX.pink; c.fillRect(bx + 12, by + bh - 44, 6, 32);
    c.font = font(FAM.monoB(), 20); c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillStyle = HEX.bone;
    c.fillText('STUDIO', bx + 28, by + bh - 27);
  }

  // ------------------------------------------------------------------ 26: the ledger looks, blinks, writes zero

  boardState(t: number, frozen = false): BoardState {
    const w = this.w, b0 = this.cutBoard;
    if (frozen) return { title: 0, her: 1, herT: this.cutWide, eye: 0, look: -1, blink: 0, scan: 0, zero: 1, minus: 0, wipe: 1 };
    const looks = w.looks!.start, blinks = w.blinks!.start, writes = w.writes!.start, not = w.not!.start, minus = w.minus!.start;
    const blink = t < blinks ? 0 : t < blinks + 0.08 ? (t - blinks) / 0.08 : t < blinks + 0.16 ? 1 - (t - blinks - 0.08) / 0.08 : 0;
    const shut = clamp((t - writes) / 0.1);
    const flick = Math.floor(frameIdx(t) / 3) % 2 === 0 ? 1 : 0;
    return {
      title: t - b0 < 0.15 ? (Math.floor(frameIdx(t) / 2) % 2 ? 1 : 0.3) : 1,
      her: clamp((t - b0 - 0.08) / 0.12), herT: t,
      eye: clamp((t - looks + 0.02) / 0.2) * (1 - clamp((t - writes - 0.08) / 0.1)),
      look: t < looks + 0.1 ? 0.6 : -1 * ease.outCubic(clamp((t - looks - 0.1) / 0.2)),
      blink: Math.max(blink, shut),
      scan: clamp((t - w.right!.start) / (blinks - w.right!.start - 0.04)),
      zero: ease.inOutQuad(clamp((t - writes - 0.05) / Math.max(0.2, w.zero!.start + 0.08 - writes))),
      minus: t >= not && t < minus + 0.2 ? (t < not + 0.12 || t > minus ? 1 : flick) : 0,
      wipe: t < minus ? -1 : clamp((t - minus) / 0.12),
    };
  }

  board(c: C2, g: C2, t: number) {
    const z = lerp(1.0, 1.05, ease.inOutQuad(clamp((t - this.cutBoard) / (this.cutWide - this.cutBoard))));
    c.save(); g.save();
    for (const x of [c, g]) { x.translate(W / 2, H / 2); x.scale(z, z); x.translate(-W / 2, -H / 2); }
    c.fillStyle = '#0c0a12'; c.fillRect(0, 0, W, H);
    boardMatrix(this.full, this.boardState(t));
    this.full.draw(c, g, 0, 4, 16, { unlit: '#1c1726', glow: 0.45 });
    bezel(c, W, H);
    c.restore(); g.restore();
  }

  // ------------------------------------------------------------------ the nothing: the wide, frozen

  wide(c: C2, g: C2, t: number) {
    const w = this.w, tf = this.cutWide;   // the set is drawn at the instant of the cut: everyone stops
    const kitchenCam = { x: 960, y: 540, z: 1.0 };
    studio(c, g, tf, {
      curtain: 0, ring: 0, sign: 1, onAir: true, house: 0.5, cue: 'QUIET', cueT0: tf - 2,
      spots: [],
      scoreDraw: (cc, gg, x, y, ww, hh) => {
        ledText(cc, gg, 'HER SCORE', x + ww / 2, y + hh * 0.15, 60, HEX.bone);
        boardMatrix(this.small, this.boardState(t, true), true);
        this.small.draw(cc, gg, x, y + 16 * 6, 6, { unlit: null, glow: 0.55 });
      },
      // the feed on the studio screen still runs: she is still rocking her child
      screen: (cc, _gg, x, y, ww, hh) => this.kitchenFeed(cc, t, kitchenCam, [x, y, ww, hh], 1),
    });
    // a pool of light from straight above on her mark (the beams themselves are frozen out of shot)
    const pool = g.createRadialGradient(W / 2, SET.floor, 10, W / 2, SET.floor, 260);
    pool.addColorStop(0, rgbaHex(HEX.pink, 0.28)); pool.addColorStop(1, rgbaHex(HEX.pink, 0));
    g.fillStyle = pool; g.beginPath(); g.ellipse(W / 2, SET.floor, 260, 60, 0, 0, TAU); g.fill();
    octopus(c, g, 300, SET.floor - 20, 0.85, tf, { card: 'QUIET', cardT0: tf - 2 });
    crabCam(c, g, W * 0.88, H * 0.93, 0.9, tf, { tally: true, flip: true });
    // Rai: the only one who moves. Frozen mid-showbiz, then her face falls, then she is cross
    const nothing = w.nothing!.start, still = w.still!.start;
    const fall = t > nothing, cross = t > still;
    const R = 160, ry = SET.floor - 1.07 * R;
    const anchors = drawRai(c, W / 2, ry, R, {
      t, face: cross ? 'angry' : fall ? 'deadpan' : 'grin', look: 0, noBlink: !fall,
      arms: cross ? ['hip', 'hip'] : fall ? ['down', 'down'] : ['up', 'wave'], armsFrom: fall ? (cross ? ['down', 'down'] : ['up', 'wave']) : undefined,
      armsU: cross ? clamp((t - still) / 0.15) : fall ? ease.inQuad(clamp((t - nothing) / 0.35)) : 1,
      wave: 0, prop: { side: 1, draw: micProp }, glow: HEX.bone, heart: 0.3,
      marks: cross ? ['vein', 'steam'] : [], markT0: still, blush: cross ? 0.5 : 0,
    });
    // one bubble, out of the hole that is her heart
    const b0 = nothing + 0.05;
    if (t > b0) {
      const u = t - b0, bx = anchors.heart.x + 8 * Math.sin(u * 5), by = anchors.heart.y - u * 300, br = 13 + 5 * Math.min(1, u * 1.5);
      c.fillStyle = 'rgba(200,235,255,0.18)'; c.beginPath(); c.arc(bx, by, br, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(225,245,255,0.95)'; c.lineWidth = 3; c.beginPath(); c.arc(bx, by, br, 0, TAU); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.95)'; c.beginPath(); c.arc(bx - br * 0.38, by - br * 0.38, br * 0.25, 0, TAU); c.fill();
      g.fillStyle = 'rgba(200,235,255,0.12)'; g.beginPath(); g.arc(bx, by, br * 1.6, 0, TAU); g.fill();
    }
    studioFront(c, g, tf, { crowd: 1, mood: 'freeze' });
    this.popcorn(c, t, tf);
    liveBug(c, g, tf);
  }

  /** One fish in the front row holds a box of popcorn, frozen; a few pieces keep drifting down through the stillness. */
  popcorn(c: C2, t: number, tf: number) {
    const fx = 1560, fy = 960;
    c.fillStyle = '#07060f';
    c.beginPath(); c.ellipse(fx, fy + 40, 52, 62, 0, 0, TAU); c.fill();                    // a fish's head in the front row
    c.beginPath(); c.moveTo(fx - 16, fy - 16); c.quadraticCurveTo(fx + 4, fy - 52, fx + 24, fy - 10); c.fill();
    c.fillStyle = '#f4f1ea'; c.beginPath(); c.ellipse(fx - 16, fy + 20, 10, 13, 0, 0, TAU); c.ellipse(fx + 16, fy + 20, 10, 13, 0, 0, TAU); c.fill();
    c.fillStyle = '#111'; c.beginPath(); c.arc(fx - 16, fy + 22, 5, 0, TAU); c.arc(fx + 16, fy + 22, 5, 0, TAU); c.fill();   // staring, frozen
    c.fillStyle = '#07060f';
    c.beginPath(); c.ellipse(fx + 40, fy - 70, 18, 46, 0.5, 0, TAU); c.fill();   // a fin, held up
    c.save(); c.translate(fx + 62, fy - 118); c.rotate(0.12);
    c.fillStyle = '#d83a3a'; c.beginPath(); c.moveTo(-26, -30); c.lineTo(26, -30); c.lineTo(18, 30); c.lineTo(-18, 30); c.closePath(); c.fill();
    c.fillStyle = '#f4f1ea'; for (let k = -2; k <= 2; k += 2) { c.beginPath(); c.moveTo(-26 + (k + 2) * 13, -30); c.lineTo(-26 + (k + 3) * 13, -30); c.lineTo(-22 + (k + 3) * 11, 30); c.lineTo(-22 + (k + 2) * 11, 30); c.closePath(); c.fill(); }
    c.fillStyle = '#fff6d8'; for (let k = 0; k < 7; k++) { c.beginPath(); c.arc(-20 + k * 7, -34 - 6 * h01(k, 3), 7, 0, TAU); c.fill(); }
    c.restore();
    for (let k = 0; k < 3; k++) {
      const u = t - tf - k * 0.3;
      if (u < 0) continue;
      const px = fx + 70 + 22 * k + 8 * Math.sin(u * 3 + k), py = fy - 150 + u * 90, rot = u * 1.5 + k;
      c.save(); c.translate(px, py); c.rotate(rot);
      c.fillStyle = '#fff6d8'; c.beginPath(); c.arc(0, 0, 7, 0, TAU); c.arc(6, -3, 5, 0, TAU); c.arc(-4, 5, 5, 0, TAU); c.fill();
      c.restore();
    }
  }
}

export { scanlines, ledText };
