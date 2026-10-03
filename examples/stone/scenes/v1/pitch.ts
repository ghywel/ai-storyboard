// PITCH (v1, 75.07-88.78; verse 2's first half, lines 19-22): the pitch round. Cuts every two beats on the grid (a rapped
// verse), each a new camera; the line is the lower third throughout.
//   19 "Then a trader sailed in with an iron hull, said "why paddle? I'll bring you a ton","
//     P1 CAM 1 wide: the stage-left wall's iron hatch (the set's S.S. IRON HULL plate on its door) spins open on
//        "trader"; the hold's lamps glow; the trader in his cap pushes out a crate. Rai turns from it, deadpan, arms
//        crossed. P2 close on the hatch: "iron hull", the crate clangs on the frame. P3 two-shot: "WHY PADDLE?" he
//        mimes rowing and laughs; Rai side-eyes him. P4 Rai close: on "ton" the 1 TON crate drops beside her, THUD;
//        she hops with the floor and does not blink (a sweat drop).
//   20 "he shipped us in bulk and the island said thanks, then priced his at a fraction of one;"
//     P5 the crate feeds a conveyor of identical discs (one copy pasted; BULK x1,000 on the readout); Rai at the end,
//        chin in hand, unimpressed. P6 CAM 1 wide: a perfect row of them on the stage, the trader waving, the octopus
//        holding THANKS!, the fish cheering. P7 the price game: GUESS THE PRICE!, one disc turning on a pedestal, the
//        tag spinning "£ ?", Rai presenting it, smug. P8 over the trader's shoulder: every paddle in the house flips up
//        1/10 on "fraction" (except seat C7's lunchbox, which has no one to hold one); on "one" he slumps, sad trombone.
//   21 "'cause value's the crossing, the risk and the reef, the hands and the hours it cost,"
//     P9 the points board drops from the flies, WHAT MAKES IT WORTH IT?; CROSSING 400 km lights on "crossing", a raft
//        rides the route icon; Rai points, determined. P10 close: RISK, five stars pop; the reef and a fin on "reef".
//        P11 the board: HANDS 30 (thirty little hands), HOURS 6,000 (the hourglass flips); on "cost" the board blazes and
//        she punches the air.
//   22 "not how heavy you are and not how you shine, but the voyage, and what could be lost."
//     P12 buzzer round: the crate on a weighing scale, the needle slams to 1 TON on "heavy": BZZT, a red cross; Rai
//        wags a finger, sassy. P13 a jeweller's loupe over a chrome-polished disc: under the glass it says MADE IN BULK
//        (the shine hides the copy); BZZT on "shine", another wag. P14 the voyage map (Palau to Yap, 400 km, the raft):
//        DING, a gold tick on "voyage", the route lights, Rai pops chibi with joy (the one shake). P15 CAM 1 wide: the
//        house cheers, the trader slumps by his crate; on "lost" the studio screen plays the archive storm and Rai
//        softens, her heart lit (she is what could be lost).
// Clues: the hatch's nameplate is the wreck's own (the studio is built in the trader's sunken ship); the scale's dial
// is marked in TONS only; C7's empty paddle; the storm on the screen.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../../engine/scene';
import { Layer2D, W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import type { Line, Word } from '../../engine/lyrics';
import { clamp, ease, lerp } from '../../engine/util';
import { drawRai, h01, type Face, type ArmPose, type RaiOpts } from '../_rai';
import { FAM, TAU, rgbaHex, mixHex } from '../_motifs';
import { focusLines, poof, puff, star4, speedLines } from '../_manga';
import { caKick, hitShake, mergePost, punch } from '../_post';
import { cast, type CastOpts } from './_cast';
import type { Pose } from '../_motifs';
import {
  SET, studio, studioFront, audience, seatPos, seatKind, octopus, crabCam, liveBug, camTag, micProp, closeBackdrop, withCam,
  textDots, drawDots, ledText, type StudioOpts,
} from './_studio';
import { plateLines, wordOf, shotAt, lyricBand, bubble, sfx, verdict, cam2, backdrop } from './pitch-kit';
import {
  HATCH, hatch, crate, bulkDisc, conveyor, paddle, pedestal, priceTag, pointsBoard, weighScale, loupe, voyageMap, wahWah,
  stormClip, type PointRow,
} from './pitch-props';

type C2 = CanvasRenderingContext2D;
const RX = W * 0.6, RR = 150, RY = SET.floor - 1.07 * RR;   // Rai's mark in the wide
const SIL = '#120d1d';
const MIC = { side: 1 as const, draw: micProp };

export default class Pitch extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  band: Line[] = [];
  cuts: number[] = [];
  w: Record<string, Word> = {};
  bt: (k: number) => number = (k) => k;

  override init() {
    const { lyrics, audio: au, start, end } = this.ctx;
    const { own, band } = plateLines(lyrics.lines, start, end);
    this.band = band;
    const q = (re: RegExp, n = 0) => wordOf(own, re, n);
    this.w = {
      trader: q(/^trader/), iron: q(/^iron/), hull: q(/^hull/), why: q(/^why/), paddle: q(/^paddle/), ton: q(/^ton/),
      shipped: q(/^shipped/), bulk: q(/^bulk/), island: q(/^island/), thanks: q(/^thanks/), priced: q(/^priced/),
      fraction: q(/^fraction/), one: q(/^one/), values: q(/^value/), crossing: q(/^crossing/), risk: q(/^risk/),
      reef: q(/^reef/), hands: q(/^hands/), hours: q(/^hours/), cost: q(/^cost/), heavy: q(/^heavy/), shine: q(/^shine/),
      voyage: q(/^voyage/), lost: q(/^lost/),
    };
    // a hard cut every two beats (three where a phrase needs the room), from the plate's first beat
    const b0 = Math.round(au.beatAt(start));
    this.bt = (k: number) => au.timeOfBeat(b0 + k);
    this.cuts = [0, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 24, 26, 28, 30].map(this.bt);
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, end } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t;
    this.L.clear(HEX.ink); this.G.clear();
    const s = shotAt(this.cuts, t, end);
    let post: PostOverrides = { bloom: 0.65 };
    const draw = [this.p1, this.p2, this.p3, this.p4, this.p5, this.p6, this.p7, this.p8, this.p9, this.p10, this.p11, this.p12, this.p13, this.p14, this.p15][s.i]!;
    post = mergePost(post, draw.call(this, c, g, t, s.s0, s.s1) ?? {});
    lyricBand(c, this.band, t);
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    return mergePost(post, { zoom: 1 + 0.006 * f.a.kick });
  }

  // ------------------------------------------------------------------ shared pieces

  /** The studio as the pitch round dresses it: curtain closed, sign lit, ON AIR, the scoreboard's state for the time. */
  set(c: C2, g: C2, t: number, o: StudioOpts = {}) {
    const w = this.w, priced = t >= w.fraction!.start;
    studio(c, g, t, {
      curtain: 0, ring: 0, sign: 1, onAir: true, house: 0.55, cue: null,
      score: priced ? [{ text: 'HIS STONE', col: HEX.bone }, { text: '1/10', col: HEX.lime }] : [{ text: 'PITCH', col: HEX.bone }, { text: 'ROUND', col: HEX.gold }],
      ...o,
    });
  }

  /** The trader (cap, faceless), feet at (x, y), leaning `lean` radians from his feet. */
  trader(c: C2, x: number, y: number, h: number, pose: Pose, t: number, o: CastOpts & { lean?: number } = {}) {
    c.save();
    c.translate(x, y); c.rotate(o.lean ?? 0); c.translate(-x, -y);
    cast(c, 'trader', x, y, h, pose, { col: SIL, t, rim: HEX.gold, ...o });
    c.restore();
  }

  /**
   * The trader and his crate in the wide, by time: the door opens halfway on "trader" and he squeezes out behind the
   * crate until it wedges against the door; on "hull" the crate clangs the door wide and he lurches out to centre-left.
   */
  traderPath(t: number) {
    const w = this.w, t0 = w.trader!.start + 0.15, clang = w.hull!.start;
    const x = t < clang ? lerp(HATCH.x - 10, HATCH.x + 62, ease.outCubic(clamp((t - t0) / (clang - t0))))
      : lerp(HATCH.x + 62, 470, ease.outCubic(clamp((t - clang) / 1.1)));
    const door = t < clang ? 0.45 * ease.outBack(clamp((t - w.trader!.start) / 0.3), 1.6) : 0.45 + 0.55 * ease.outBack(clamp((t - clang) / 0.16), 1.3);
    return { x, crateX: x + 112, walking: t > t0 && t < clang + 1.1, u: clamp((t - t0) / 0.2), door };
  }

  /** Rai, mic in hand, with a finger wag helper: a wag arm swings between chin and point. */
  rai(c: C2, x: number, y: number, R: number, o: Partial<RaiOpts> & { t: number }) {
    return drawRai(c, x, y, R, { glow: HEX.bone, heart: 0.35, prop: MIC, ...o });
  }

  wag(t: number, t0: number): { armsU: number } {
    const age = t - t0;
    return { armsU: age < 0 ? 0 : 0.35 + 0.22 * Math.sin(age * 22) };
  }

  // ------------------------------------------------------------------ 19: the trader

  p1(c: C2, g: C2, t: number, s0: number): PostOverrides {
    const w = this.w, tp = this.traderPath(t), open = tp.door / 0.45;
    this.set(c, g, t, { spots: [{ x: HATCH.x + 260, col: '#ffd9a0', a: 0.15 + 0.35 * clamp(open), r: 120 }, { x: 0, a: 0 }, { x: RX, col: HEX.pink, a: 0.75 }] });
    hatch(c, g, t, tp.door, clamp(open), (t - s0) * 9 * (1 - clamp(open)));
    this.steam(c, t, w.trader!.start);
    if (tp.u > 0) {
      crate(c, tp.crateX, HATCH.floor, 130);
      this.trader(c, tp.x, HATCH.floor + 2 - (tp.walking ? 3 * Math.abs(Math.sin(t * 9)) : 0), 205, 'hug', t, { lean: 0.16 });
    }
    // Rai turns from the camera to the noise, then folds her arms: deadpan
    const turned = t > w.trader!.start + 0.15, crossT = w.trader!.start + 0.5;
    this.rai(c, RX, RY, RR, {
      t, face: turned ? (t > crossT ? 'deadpan' : 'serious') : 'smile', look: turned ? -1 : 0,
      arms: t > crossT ? ['cross', 'cross'] : ['down', 'down'], armsFrom: ['down', 'down'], armsU: clamp((t - crossT) / 0.2),
      marks: t > crossT + 0.3 ? ['sweat'] : [], markT0: crossT + 0.3, tilt: turned ? -0.04 : 0,
    });
    crabCam(c, g, W * 0.88, H * 0.93, 0.9, t, { tally: true, flip: true });
    studioFront(c, g, t, { crowd: 1, mood: 'calm' });
    liveBug(c, g, t);
    camTag(c, 'CAM 1', t, s0);
    return {};
  }

  /** Steam and bubbles rolling out of the opened hold, from t0. */
  steam(c: C2, t: number, t0: number) {
    const age = t - t0;
    if (age <= 0) return;
    for (let i = 0; i < 9; i++) {
      const u = ((age * 0.7 + i / 9) % 1), px = HATCH.x + 40 + u * 220 + 20 * Math.sin(i * 3 + t), py = HATCH.floor - 90 - u * 150 - 40 * h01(i, 2);
      puff(c, px, py, 16 + 28 * u, `rgba(230,230,240,${0.4 * (1 - u) * clamp(age * 3)})`);
    }
  }

  p2(c: C2, g: C2, t: number, s0: number, s1: number): PostOverrides {
    const w = this.w, tp = this.traderPath(t), z = lerp(2.2, 2.32, (t - s0) / (s1 - s0));
    const clang = w.hull!.start, jolt = t > clang ? Math.exp(-(t - clang) * 9) * Math.sin((t - clang) * 60) : 0;
    cam2(c, g, { zoom: z, x: 245 - W / 2, y: 700 - H / 2 }, () => {
      this.set(c, g, t, { spots: [{ x: HATCH.x + 260, col: '#ffd9a0', a: 0.4, r: 120 }] });
      hatch(c, g, t, tp.door, 0.8, 0);
      this.steam(c, t, w.trader!.start);
      crate(c, tp.crateX, HATCH.floor, 130, { tilt: t < clang ? -0.03 : 0.05 * jolt });
      this.trader(c, tp.x, HATCH.floor + 2 - (t < clang ? 0 : 4 * Math.abs(Math.sin(t * 9))), 205, 'hug', t, { lean: 0.2 + 0.08 * jolt, emote: t < clang ? 'sweat' : undefined, emoteT0: s0 + 0.1 });
      if (t > clang && t < clang + 0.3) { // sparks off the iron
        for (let i = 0; i < 12; i++) {
          const a = -2.8 + i * 0.25, d = (t - clang) * (300 + 200 * h01(i, 9));
          star4(c, HATCH.x - HATCH.w / 2 + 120 + Math.cos(a) * d, HATCH.floor - 110 + Math.sin(a) * d, 6, '#fff3a0');
        }
      }
    });
    sfx(c, 'CLANG!', W * 0.7, H * 0.28, 140, t, clang, { col: '#c9d4e6', rot: 0.1, hold: 0.42 });
    liveBug(c, g, t);
    camTag(c, 'CAM 2', t, s0);
    return mergePost(punch(t, [clang], 0.025), hitShake(t, [clang], 3, 0.22));
  }

  p3(c: C2, g: C2, t: number, s0: number, s1: number): PostOverrides {
    const w = this.w, cx = 600, cy = 662, z = lerp(2.3, 2.42, (t - s0) / (s1 - s0)), tx = 470;
    cam2(c, g, { zoom: z, x: cx - W / 2, y: cy - H / 2 }, () => {
      this.set(c, g, t, { spots: [{ x: tx, col: '#ffd9a0', a: 0.45 }] });
      hatch(c, g, t, 1, 0.8, 0);
      crate(c, tx + 140, HATCH.floor, 130);
      // he mimes paddling, laughing at the idea (a bob on each stroke)
      this.trader(c, tx, HATCH.floor + 2 - 6 * Math.abs(Math.sin(t * 7)), 205, t > w.why!.start ? 'paddle' : 'stand', t, { lean: -0.05, emote: t > w.paddle!.start + 0.2 ? 'music' : undefined, emoteT0: w.paddle!.start + 0.2 });
    });
    const hx = (tx - cx) * z + W / 2, hy = (HATCH.floor - 215 - cy) * z + H / 2;
    bubble(c, hx + 330, hy - 70, 'WHY PADDLE?', hx + 70, hy + 20, t, Math.max(s0 + 0.02, w.why!.start), { size: 70, rot: -0.05 });
    // Rai at the edge of the shot: arms folded, side-eye, a drop of sweat
    this.rai(c, 1700, 860, 190, { t, face: 'deadpan', look: -1, arms: ['cross', 'cross'], marks: ['sweat'], markT0: s0 + 0.25, tilt: -0.05 });
    liveBug(c, g, t);
    return punch(t, [Math.max(s0 + 0.02, w.why!.start)], 0.02);
  }

  p4(c: C2, g: C2, t: number, s0: number, s1: number): PostOverrides {
    const w = this.w, thud = w.ton!.start, z = lerp(1.42, 1.5, (t - s0) / (s1 - s0));
    const fall = clamp((t - (thud - 0.14)) / 0.14), cy = lerp(-300, SET.floor + 18, ease.inQuad(fall));
    const age = t - thud, landed = age >= 0;
    const hop = landed && age < 0.3 ? 0.16 * Math.sin((age / 0.3) * Math.PI) : 0;
    cam2(c, g, { zoom: z, x: RX + 120 - W / 2, y: 560 - H / 2 }, () => {
      this.set(c, g, t, { spots: [{ x: 0, a: 0 }, { x: 0, a: 0 }, { x: RX, col: HEX.pink }] });
      if (fall > 0) {
        if (!landed) { c.save(); c.globalAlpha = 0.5; speedLines(c, Math.PI / 2, 'rgba(255,255,255,0.6)', t, { n: 16, band: [RX + 200 - 960, RX + 520 - 960] }); c.restore(); }
        crate(c, RX + 360, cy, 210, { tilt: landed ? 0.02 * Math.exp(-age * 8) * Math.sin(age * 50) : -0.04 });
      }
      this.rai(c, RX, RY, RR, {
        t, face: 'deadpan', look: landed ? 1 : 0, arms: ['cross', 'cross'], hop, squash: landed && age < 0.12 ? -0.25 : 0,
        marks: landed ? ['sweat'] : [], markT0: thud + 0.12,
      });
      if (landed && age < 0.6) for (let i = 0; i < 10; i++) { // the sand thrown up by the landing
        const a = Math.PI + (i / 9) * Math.PI, d = age * (260 + 140 * h01(i, 4));
        puff(c, RX + 360 + Math.cos(a) * d * 1.3, SET.floor + 10 + Math.sin(a) * d * 0.35, 22 + 30 * age, `rgba(200,180,140,${0.6 * (1 - age / 0.6)})`);
      }
    });
    sfx(c, 'THUD!', W * 0.8, H * 0.24, 150, t, thud, { col: HEX.orange, rot: -0.08, hold: 0.4 });
    liveBug(c, g, t);
    camTag(c, 'CAM 3', t, s0);
    return mergePost(hitShake(t, [thud], 6, 0.3), punch(t, [thud], 0.03), caKick(t, [thud], 3));
  }

  // ------------------------------------------------------------------ 20: bulk, thanks, the price

  p5(c: C2, g: C2, t: number, s0: number): PostOverrides {
    const w = this.w;
    backdrop(c, g, t, '#3a2440', 14, 1);
    // the stage floor
    c.fillStyle = '#3a2430'; c.fillRect(0, 760, W, H - 760);
    c.strokeStyle = '#24161e'; c.lineWidth = 3;
    for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(0, 790 + k * 34); c.lineTo(W, 790 + k * 34); c.stroke(); }
    const by = 690, v = 420, x0 = 290, x1 = 1440;
    conveyor(c, x0, x1, by, t, v);
    // the discs: the same disc, over and over, at exactly the same spacing (a paste, not a quarry)
    const gap = 175, off = ((t - s0) * v) % gap;
    for (let x = x0 + 40 + off - gap; x < x1 - 30; x += gap) if (x > x0 + 20) bulkDisc(c, x, by - 66, 62);
    crate(c, 190, 760, 170, { lid: 0.9 });
    // the readout: BULK x count, climbing
    const n = Math.min(1000, Math.round(Math.pow(1000, clamp((t - w.shipped!.start) / 0.7))));
    c.fillStyle = '#0c0a12'; c.beginPath(); c.roundRect(560, 120, 720, 190, 14); c.fill();
    c.strokeStyle = '#6a5a3a'; c.lineWidth = 5; c.stroke();
    ledText(c, g, `BULK ×${n.toLocaleString('en-GB')}`, 920, 215, 104, HEX.lime, undefined, undefined, FAM.monoB());
    // Rai at the end of the line: chin in hand, one eyebrow up
    this.rai(c, 1650, 760 - 1.07 * 140, 140, { t, face: 'sassy', look: -1, arms: ['chin', 'hip'], marks: ['?'], markT0: w.bulk!.start, tilt: 0.08 });
    liveBug(c, g, t);
    camTag(c, 'CAM 2', t, s0);
    return punch(t, [w.bulk!.start], 0.015);
  }

  p6(c: C2, g: C2, t: number, s0: number): PostOverrides {
    const w = this.w, thanks = Math.max(s0 + 0.05, w.island!.start);
    this.set(c, g, t, {
      house: 0.7, cue: 'APPLAUSE', cueT0: thanks,
      spots: [{ x: 700, col: HEX.yellow, a: 0.6 }, { x: 980, col: HEX.cyan, a: 0.4 }, { x: RX + 200, col: HEX.pink }],
    });
    // the row of bulk discs along the back of the stage, all identical
    for (let k = 0; k < 9; k++) bulkDisc(c, 360 + k * 84, SET.floor - 66, 40);
    this.trader(c, 700, HATCH.floor + 4 - 8 * Math.abs(Math.sin(t * 6)), 205, 'cheer', t, { emote: 'joy', emoteT0: thanks });
    this.rai(c, RX + 200, RY, RR, { t, face: 'smug', look: -1, arms: ['hip', 'down'], marks: ['shine'], markT0: thanks + 0.15, tilt: 0.05 });
    octopus(c, g, 250, SET.floor + 10, 0.78, t, { card: 'THANKS!', cardT0: thanks });
    studioFront(c, g, t, { crowd: 1, mood: t > thanks ? 'cheer' : 'calm' });
    liveBug(c, g, t);
    camTag(c, 'CAM 1', t, s0);
    return {};
  }

  p7(c: C2, g: C2, t: number, s0: number): PostOverrides {
    const w = this.w;
    backdrop(c, g, t, '#46204a', 16, 2);
    c.fillStyle = '#2e1a26'; c.fillRect(0, 820, W, H - 820);
    // GUESS THE PRICE! in bulbs over the pedestal
    const pts = textDots('GUESS THE PRICE!', FAM.hook(), 120, 12);
    drawDots(c, g, pts, 860, 140, 4.4, HEX.gold, (i) => 0.75 + 0.25 * Math.sin(t * 12 - i * 0.3));
    // the spot on the pedestal
    const sg = g.createRadialGradient(860, 640, 20, 860, 640, 380);
    sg.addColorStop(0, 'rgba(255,243,200,0.1)'); sg.addColorStop(1, 'rgba(255,243,200,0)');
    g.fillStyle = sg; g.fillRect(400, 200, 920, 700);
    pedestal(c, g, 860, 840, t, 1.05);
    // the tag flicking through prices until the paddles answer
    const k = Math.floor(t * 14), price = t > w.priced!.start ? `£${[87, 412, 9, 3150, 60, 999, 24][k % 7]}` : '£ ?';
    priceTag(c, 1130, 250, 1.1, t, price);
    this.trader(c, 420, 840, 400, 'point', t, { emote: '!', emoteT0: s0 + 0.1 });
    this.rai(c, 1560, 840 - 1.07 * 150, 150, { t, face: 'smug', look: -1, arms: ['reach', 'hip'], armsFrom: ['down', 'hip'], armsU: clamp((t - s0) / 0.2), marks: ['shine'], markT0: w.priced!.start });
    liveBug(c, g, t);
    camTag(c, 'CAM 3', t, s0);
    return {};
  }

  p8(c: C2, g: C2, t: number, s0: number): PostOverrides {
    const w = this.w, flip = Math.max(s0 + 0.03, w.fraction!.start), one = w.one!.start;
    audience(c, g, t, { mood: t > one ? 'gasp' : 'calm', dim: 0.1 });
    // every creature in the house raises a paddle: 1/10 (the sunken things have no hands; C7 is empty)
    for (const row of ['D', 'C', 'B', 'A']) for (let col = 1; col <= 12; col++) {
      const kind = seatKind(row, col);
      if (kind !== 'fish' && kind !== 'crab' && kind !== 'jelly') continue;
      const p = seatPos(row, col), j = 0.05 * h01(col, row.charCodeAt(0), 3);
      paddle(c, p.x + 40 * p.s, p.y - 20 * p.s, p.s * 0.95, clamp((t - flip - j) / 0.14), '1/10', t, col);
    }
    // the trader's back in the foreground; on "one" he slumps
    this.trader(c, 360, 1290, 860, t > one ? 'slump' : 'stand', t, { emote: t > one ? 'sweat' : undefined, emoteT0: one + 0.05, rim: rgbaHex(HEX.peri, 0.5) });
    wahWah(c, 760, 170, t, one + 0.04);
    this.rai(c, 1640, 1000 - 1.07 * 165, 165, { t, face: 'smug', look: -1, arms: ['hip', 'down'], marks: ['shine'], markT0: one, tilt: 0.06 });
    liveBug(c, g, t);
    camTag(c, 'CAM 4', t, s0);
    return punch(t, [flip], 0.02);
  }

  // ------------------------------------------------------------------ 21: the points board

  rows(t: number): PointRow[] {
    const w = this.w;
    return [
      { label: 'CROSSING', lit: clamp((t - w.crossing!.start) / 0.08), t0: w.crossing!.start },
      { label: 'RISK', lit: clamp((t - w.risk!.start) / 0.08), t0: w.risk!.start },
      { label: 'HANDS', lit: clamp((t - w.hands!.start) / 0.08), t0: w.hands!.start },
      { label: 'HOURS', lit: clamp((t - w.hours!.start) / 0.08), t0: w.hours!.start },
    ];
  }
  boardFlash(t: number) {
    const a = t - this.w.cost!.start;
    return a < 0 ? 0 : a < 0.6 ? (Math.floor(a * 14) % 2 ? 0.55 : 1) : 0.35;
  }

  p9(c: C2, g: C2, t: number, s0: number): PostOverrides {
    const drop = ease.outBack(clamp((t - s0) / 0.28), 1.2), by = lerp(-720, 172, drop);
    this.set(c, g, t, { spots: [{ x: 0, a: 0 }, { x: 0, a: 0 }, { x: 1620, col: HEX.pink }] });
    pointsBoard(c, g, 500, by, 880, 560, t, this.rows(t));
    const pt = t > this.w.crossing!.start;
    this.rai(c, 1620, SET.floor - 1.07 * 140, 140, {
      t, face: 'determined', look: -1, arms: [pt ? 'point' : 'down', 'hip'], armsFrom: ['down', 'hip'], armsU: clamp((t - this.w.crossing!.start + 0.1) / 0.15),
      hop: pt && t - this.w.crossing!.start < 0.2 ? 0.08 * Math.sin(((t - this.w.crossing!.start) / 0.2) * Math.PI) : 0,
    });
    studioFront(c, g, t, { crowd: 1, mood: 'calm' });
    liveBug(c, g, t);
    camTag(c, 'CAM 1', t, s0);
    return mergePost(punch(t, [s0 + 0.2], 0.02));
  }

  p10(c: C2, g: C2, t: number, s0: number, s1: number): PostOverrides {
    const w = this.w, z = lerp(1.68, 1.76, (t - s0) / (s1 - s0));
    cam2(c, g, { zoom: z, x: 960 - W / 2, y: 430 - H / 2 }, () => {
      this.set(c, g, t, { spots: [] });
      pointsBoard(c, g, 500, 172, 880, 560, t, this.rows(t), { reef: clamp((t - w.reef!.start) / 0.15) });
    });
    // Rai leans into the shot from the right, pointing at the stars
    this.rai(c, 1830, 900, 165, { t, face: 'determined', look: -1, arms: ['point', 'hip'], tilt: -0.14, marks: t > w.reef!.start ? ['!'] : [], markT0: w.reef!.start });
    liveBug(c, g, t);
    return punch(t, [w.risk!.start, w.reef!.start], 0.015);
  }

  p11(c: C2, g: C2, t: number, s0: number): PostOverrides {
    const w = this.w, cost = w.cost!.start, flash = this.boardFlash(t);
    cam2(c, g, { zoom: 1.55, x: 980 - W / 2, y: 478 - H / 2, rot: -0.02 }, () => {
      this.set(c, g, t, { spots: [] });
      pointsBoard(c, g, 500, 172, 880, 560, t, this.rows(t), { reef: 1, flash });
    });
    const punchUp = t > cost;
    if (punchUp) focusLines(c, 1700, 470, 330, 'rgba(255,240,200,0.35)', t, { n: 44 });
    this.rai(c, 1720, 720, 165, {
      t, face: punchUp ? 'fierce' : 'determined', look: punchUp ? 0 : -1, arms: punchUp ? ['fist', 'up'] : ['point', 'hip'],
      armsFrom: ['point', 'hip'], armsU: clamp((t - cost) / 0.12), hop: punchUp && t - cost < 0.3 ? 0.2 * Math.sin(((t - cost) / 0.3) * Math.PI) : 0,
      marks: punchUp ? ['sparkle'] : [], markT0: cost,
    });
    liveBug(c, g, t);
    camTag(c, 'CAM 3', t, s0);
    return mergePost(punch(t, [cost], 0.03), caKick(t, [cost], 2.5));
  }

  // ------------------------------------------------------------------ 22: the buzzer round

  buzzerSet(c: C2, g: C2, t: number, col: string) {
    backdrop(c, g, t, col, 12, 3);
    c.fillStyle = '#2e1a26'; c.fillRect(0, 860, W, H - 860);
    const pts = textDots('BUZZER ROUND', FAM.hook(), 72, 7);
    drawDots(c, g, pts, W / 2, 92, 2.7, HEX.gold, (i) => 0.7 + 0.3 * Math.sin(t * 10 - i * 0.5));
  }

  p12(c: C2, g: C2, t: number, s0: number): PostOverrides {
    const w = this.w, heavy = w.heavy!.start, bz = heavy + 0.08;
    this.buzzerSet(c, g, t, '#3a2050');
    const v = t < heavy ? 0.05 : Math.min(1, ease.outBack(clamp((t - heavy) / 0.18), 2));
    weighScale(c, g, 700, 880, 1.0, v, t);
    crate(c, 700, 826, 210, { tilt: t > heavy && t < heavy + 0.2 ? 0.02 * Math.sin(t * 60) : 0 });
    verdict(c, g, 'x', 1080, 330, 110, t, bz);
    sfx(c, 'BZZT!', 1080, 520, 110, t, bz, { col: '#ff3b3b', rot: 0.08, hold: 0.5 });
    this.rai(c, 1520, 880 - 1.07 * 150, 150, {
      t, face: 'sassy', look: -1, arms: ['point', 'hip'], armsFrom: ['chin', 'hip'], ...this.wag(t, bz), tilt: 0.08,
      marks: t > bz ? ['shine'] : [], markT0: bz,
    });
    liveBug(c, g, t);
    camTag(c, 'CAM 2', t, s0);
    return punch(t, [bz], 0.02);
  }

  p13(c: C2, g: C2, t: number, s0: number): PostOverrides {
    const w = this.w, bz = w.shine!.start + 0.06;
    this.buzzerSet(c, g, t, '#20304a');
    // the polished disc: chrome, sparkling
    const dx = 1040, dy = 520, dr = 250;
    bulkDisc(c, dx, dy, dr, { shine: 1, t });
    for (let i = 0; i < 6; i++) {
      const a = i * 1.1 + 0.3, tw = 0.5 + 0.5 * Math.sin(t * 8 + i * 2);
      star4(c, dx + Math.cos(a) * dr * 0.85, dy + Math.sin(a) * dr * 0.85, 14 + 18 * tw, '#ffffff');
      g.fillStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); g.arc(dx + Math.cos(a) * dr * 0.85, dy + Math.sin(a) * dr * 0.85, 22 * tw, 0, TAU); g.fill();
    }
    // the loupe drifts to the stamp: under the glass, MADE IN BULK
    const lx = lerp(1320, 1150, ease.outCubic(clamp((t - s0) / 0.5))), ly = lerp(420, 690, ease.outCubic(clamp((t - s0) / 0.5))), lr = 150;
    loupe(c, g, lx, ly, lr, t, (cc) => {
      cc.save(); cc.translate(lx, ly); cc.scale(2.6, 2.6); cc.translate(-lx, -ly);
      bulkDisc(cc, dx, dy, dr, { shine: 0.6, t });
      cc.font = font(FAM.monoB(), 13); cc.textAlign = 'center'; cc.fillStyle = 'rgba(40,40,52,0.95)';
      cc.fillText('MADE IN', lx, ly - 16); cc.fillText('BULK', lx, ly); cc.fillText('COPY #1,000', lx, ly + 16);
      cc.restore();
    });
    verdict(c, g, 'x', 1560, 250, 100, t, bz);
    sfx(c, 'BZZT!', 1560, 430, 100, t, bz, { col: '#ff3b3b', rot: -0.08, hold: 0.5 });
    this.rai(c, 360, 880 - 1.07 * 150, 150, {
      t, face: 'sassy', look: 1, arms: ['hip', 'point'], armsFrom: ['hip', 'chin'], ...this.wag(t, bz), tilt: -0.08,
      prop: { side: -1, draw: micProp }, marks: t > bz ? ['shine'] : [], markT0: bz,
    });
    liveBug(c, g, t);
    return punch(t, [bz], 0.02);
  }

  p14(c: C2, g: C2, t: number, s0: number): PostOverrides {
    const w = this.w, ding = w.voyage!.start + 0.03, lit = clamp((t - ding) / 0.25);
    this.buzzerSet(c, g, t, '#4a3010');
    const u = lerp(0.2, 0.85, ease.inOutQuad(clamp((t - s0) / 0.8)));
    if (t > ding) focusLines(c, 1600, 300, 150, 'rgba(255,230,150,0.45)', t, { n: 70 });
    voyageMap(c, g, 190, 170, 1260, 680, t, u, lit);
    verdict(c, g, 'tick', 1600, 300, 130, t, ding);
    sfx(c, 'DING!', 1600, 500, 120, t, ding, { col: HEX.gold, rot: 0.06, hold: 0.55 });
    // Rai pops in chibi, overjoyed
    if (t > ding) {
      drawRai(c, 1620, 790, 95, { t, face: 'joy', sd: true, arms: ['up', 'up'], marks: ['sparkle'], markT0: ding, hop: 0.25 * Math.abs(Math.sin((t - ding) * 9)), glow: HEX.gold, heart: 1 });
      poof(c, 1620, 760, 160, t, ding);
    } else {
      this.rai(c, 1640, 880 - 1.07 * 140, 140, { t, face: 'wow', look: -1, arms: ['cheek', 'cheek'] });
    }
    for (let i = 0; i < 26 && t > ding; i++) { // gold confetti bubbles
      const a = h01(i, 5) * TAU, d = (t - ding) * (300 + 500 * h01(i, 6));
      const px = 1600 + Math.cos(a) * d, py = 300 + Math.sin(a) * d + (t - ding) ** 2 * 400;
      c.fillStyle = [HEX.gold, HEX.pink, HEX.cyan][i % 3]!; c.beginPath(); c.arc(px, py, 7, 0, TAU); c.fill();
    }
    liveBug(c, g, t);
    camTag(c, 'CAM 1', t, s0);
    return mergePost(hitShake(t, [ding], 5, 0.3), punch(t, [ding], 0.035), caKick(t, [ding], 4));
  }

  p15(c: C2, g: C2, t: number, s0: number): PostOverrides {
    const w = this.w, lost = w.lost!.start;
    this.set(c, g, t, {
      house: 0.75, cue: 'APPLAUSE', cueT0: s0,
      spots: [{ x: W * 0.42, col: HEX.yellow }, { x: W * 0.5, col: HEX.cyan, a: 0.7 }, { x: W * 0.5, col: HEX.pink }],
      screen: t > lost - 0.05 ? (cc, gg, x, y, ww, hh) => stormClip(cc, gg, x, y, ww, hh, t) : null,
    });
    crate(c, 470, HATCH.floor + 4, 120);
    this.trader(c, 360, HATCH.floor + 4, 205, 'slump', t, { emote: 'sweat', emoteT0: s0 });
    const soft = t > lost;
    this.rai(c, W / 2, RY, RR, {
      t, face: soft ? 'soft' : 'joy', look: soft ? 1 : 0, arms: soft ? ['down', 'cheek'] : ['up', 'up'], armsFrom: ['up', 'up'], armsU: soft ? clamp((t - lost) / 0.25) : 1,
      hop: soft ? 0 : 0.18 * Math.abs(Math.sin((t - s0) * Math.PI * 140 / 60)), heart: soft ? 1 : 0.5, heartColor: HEX.pink,
      marks: soft ? [] : ['sparkle'], markT0: s0,
    });
    crabCam(c, g, W * 0.88, H * 0.93, 0.9, t, { tally: true, flip: true });
    studioFront(c, g, t, { crowd: 1, mood: 'cheer' });
    liveBug(c, g, t);
    camTag(c, 'CAM 1', t, s0);
    return {};
  }
}
