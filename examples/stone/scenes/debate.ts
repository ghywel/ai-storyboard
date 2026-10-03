// DEBATE (the bridge, lines 57-62, sung, darker and calmer than the choruses). Yap's beach at dusk: five voices argue
// around the stone, each by a prop that tells their view, each with a lantern in their colour that lights when they
// speak. Rai stands in the middle with a pole through her heart (nobody mentions it). Each line is the voice's shot,
// then a two-beat cut-in of Rai reacting; the last line is the reveal.
//   1 "count her, or she's never seen" (cyan): a calculator on a crate counts her; a little figure appears: seen.
//     Rai thinks (chin, ?).
//   2 "price it and you'll break what it means" (pink): a market stall; the tag tears on "break"; the voice's hands
//     go to their face. Rai nods.
//   3 "keep your numbers out of my home" (orange): a front door; numbers drift at it and bounce off; it shuts on
//     "home". Rai: wow.
//   4 "pay her, give her years of her own" (lime): a payslip and a calendar of years on a noticeboard; a coin drops;
//     the years count up; the voice cheers. Rai: determined.
//   5 "smash the scoreboard down" (yellow): a sledgehammer cracks a GDP scoreboard; it topples on "down", and the sun
//     it was hiding comes through. Rai: serious, as the dust reaches her.
//   6 "and every one of them is carrying the stone": each voice leaves their prop and takes hold of the pole, one per
//     word; on "carrying" they lift together, the pole lights gold, she rises off the sand: joy.
// No side is taken: every voice gets the same light, size, time and dignity.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { HEX } from '../engine/palette';
import type { Line, Word } from '../engine/lyrics';
import { clamp, ease, lerp } from '../engine/util';
import { drawRai, h01, type ArmPose, type Face } from './_rai';
import { TAU, person, rgbaHex, slam, emote, type Emote, type Pose } from './_motifs';
import { puff, type Mark } from './_manga';
import { stoneBank, hut } from './_world';
import { caKick, hitShake, mergePost, punch } from './_post';
import { band, camera, carrier, poleY, rimmed, strike } from './debate-kit';
import { beach, calcCrate, duskSky, frontDoor, hammerAt, lantern, noticeboard, palms, sandStone, scoreboard, stall } from './debate-set';

const R = 175;                    // Rai's disc radius (world px)
const HV = (0.95 * R) / 0.79;     // a voice's height: their shoulders at her heart
const FEET = -40;                 // Rai's feet (world y; the front sand is at 0..80)
const POLE = FEET - 0.95 * R;     // the pole's height: through her heart
const DISC = FEET - 1.07 * R;
const SHORE = -230;               // the shoreline (world y)
const POLE_X0 = -840, POLE_X1 = 1080;
const SUN_X = 1793;               // the sun's place in the parallax sky: behind the scoreboard
const BODY = '#1a1230';

interface Voice {
  col: string; x: number; y: number; px: number; flip: boolean; seed: number;
  word: string; key: RegExp; key2: RegExp; key3?: RegExp; camX: number; lantern: [number, number];
}
const VOICES: Voice[] = [
  { col: HEX.cyan, x: -1190, y: 70, px: -700, flip: true, seed: 3, word: 'COUNT HER', key: /count/, key2: /seen/, key3: /never/, camX: -1260, lantern: [-1420, 60] },
  { col: HEX.pink, x: -670, y: 80, px: -420, flip: true, seed: 8, word: 'PRICE IT', key: /price/, key2: /break/, camX: -760, lantern: [-960, 30] },
  { col: HEX.orange, x: 600, y: -110, px: 420, flip: false, seed: 5, word: 'OUT OF MY HOME', key: /numbers/, key2: /home/, key3: /^out/, camX: 760, lantern: [880, -110] },
  { col: HEX.lime, x: 960, y: 80, px: 680, flip: false, seed: 14, word: 'PAY HER', key: /pay/, key2: /years/, key3: /own/, camX: 1080, lantern: [1250, 40] },
  { col: HEX.yellow, x: 1470, y: 80, px: 940, flip: false, seed: 21, word: 'SMASH', key: /smash/, key2: /down/, key3: /scoreboard/, camX: 1560, lantern: [1800, 50] },
];

/** Rai's reaction to each voice (the cut-ins). */
const REACT: { face: Face; arms: [ArmPose, ArmPose]; marks: Mark[]; look: number }[] = [
  { face: 'soft', arms: ['down', 'chin'], marks: ['?'], look: -1 },
  { face: 'smile', arms: ['down', 'down'], marks: [], look: -1 },
  { face: 'wow', arms: ['cheek', 'cheek'], marks: ['!'], look: 1 },
  { face: 'determined', arms: ['down', 'fist'], marks: ['sparkle'], look: 1 },
  { face: 'serious', arms: ['cross', 'cross'], marks: ['sweat'], look: 1 },
];

interface Shot { kind: 'voice' | 'rai' | 'reveal'; k: number; s0: number; s1: number }

export default class Debate extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  lines: Line[] = [];
  shots: Shot[] = [];
  beat = 0.43;

  override init() {
    const { lyrics, audio: au, start, end } = this.ctx;
    this.lines = lyrics.lines.filter((l) => l.words[0]!.start >= start - 0.1 && l.words[0]!.start < end).slice(0, 6);
    this.beat = 60 / au.bpm;
    const cuts = this.lines.map((l, i) => (i === 0 ? start : au.timeOfBeat(Math.floor(au.beatAt(l.words[0]!.start + 0.02)))));
    for (let k = 0; k < 5; k++) {
      const b1 = Math.round(au.beatAt(cuts[k + 1]!));
      const ins = au.timeOfBeat(b1 - 2);           // Rai's cut-in: the last two beats before the next voice
      this.shots.push({ kind: 'voice', k, s0: cuts[k]!, s1: ins });
      this.shots.push({ kind: 'rai', k, s0: ins, s1: cuts[k + 1]! });
    }
    this.shots.push({ kind: 'reveal', k: 5, s0: cuts[5]!, s1: end });
  }

  word(line: Line, re: RegExp, nth = 0): Word {
    return line.words.filter((w) => re.test(w.w.toLowerCase()))[nth] ?? line.words[0]!;
  }
  kt(k: number, re: RegExp | undefined) { return re ? this.word(this.lines[k]!, re).start : this.lines[k]!.words[0]!.start; }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, start, end } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t;
    this.L.clear(HEX.ink); this.G.clear();
    let shot = this.shots[0]!;
    for (const s of this.shots) if (t >= s.s0) shot = s;
    const lt = t - shot.s0, sp = clamp(lt / (shot.s1 - shot.s0));
    const last = this.lines[5]!;
    const every = this.word(last, /every/).start, them = this.word(last, /them/).start, carry = this.word(last, /carrying/).start, stoneT = this.word(last, /stone/).start;
    const night = 0.08 + 0.4 * clamp((t - start) / (end - start));
    const lift = shot.kind === 'reveal' ? 34 * ease.outBack(clamp((t - carry) / 0.45)) : 0;

    // ---- the camera
    let cx: number, cy: number, z: number;
    if (shot.kind === 'voice') {
      z = lerp(1.62, 1.72, ease.inOutQuad(sp));
      cx = VOICES[shot.k]!.camX; cy = -150;
    } else if (shot.kind === 'rai') {
      const r = REACT[shot.k]!;
      z = lerp(1.5, 1.56, sp);
      cx = (r.look < 0 ? -250 : 250) / z; cy = DISC - 0.45 * R;   // she stands to one side, looking across at the voice
    } else {
      const pull = ease.inOutCubic(clamp((t - shot.s0) / (them + 0.3 - shot.s0)));
      const push = ease.inOutQuad(clamp((t - stoneT) / 2.2));
      z = Math.exp(lerp(Math.log(1.35), Math.log(0.98), pull)) * (1 + 0.07 * push);
      cx = lerp(0, 110, pull); cy = lerp(DISC - 0.3 * R, -300, pull) - 10 * push;
    }
    const toSY = (wy: number) => (wy - cy) * z + H / 2;

    // ---- the far layer: dusk sky and sea (parallax), the sun sinking behind the scoreboard
    const shoreS = toSY(SHORE), horizon = shoreS - 60 - 70 * z;
    const sunX = W / 2 + (SUN_X - cx) * z * 0.3;
    const downT = this.kt(4, /down/);
    duskSky(c, t, horizon, W, H, { night, sunX, sunSink: lerp(-70, 70, clamp((t - start) / (end - start))) });
    if (t > downT + 0.4) { // the sun the scoreboard was hiding floods the beach
      const k2 = clamp((t - downT - 0.4) / 0.8) * (shot.kind === 'reveal' ? 0.9 : 1);
      const sg = g.createRadialGradient(sunX, horizon, 0, sunX, horizon, 700);
      sg.addColorStop(0, rgbaHex('#ffb060', 0.14 * k2)); sg.addColorStop(1, rgbaHex('#ffb060', 0));
      g.fillStyle = sg; g.fillRect(0, 0, W, H);
    }

    // ---- the world
    c.save(); g.save();
    camera(c, cx, cy, z); camera(g, cx, cy, z);
    const x0 = cx - W / (2 * z) - 200, x1 = cx + W / (2 * z) + 200;
    // the tide creeps up the sand line by line (the sea will take her back down)
    const tide = 26 * this.lines.filter((l) => t >= l.words[0]!.start).length;
    beach(c, t, SHORE, x0, x1, night, tide);
    // the back row: palms, Yap's stone-money bank (the island's own way of keeping count), a stilt hut
    palms(c, t, [[-1550, -200, 420, -0.15], [-980, -215, 380, 0.12], [-120, -225, 300, -0.2], [1200, -210, 400, 0.2], [2000, -200, 430, -0.1]], night);
    stoneBank(c, -420, -165, 0.7, 0.2 + 0.35 * night, 7);
    hut(c, 1330, -170, 150, night > 0.4, 0.2 + 0.35 * night);
    sandStone(c, 300, -150, 34, 0.2, night);
    // station C's front door stands in the back row
    const vC = VOICES[2]!;
    frontDoor(c, g, vC.x + 160, vC.y - 10, 230, t, this.kt(2, /numbers/), this.kt(2, /^out/), this.kt(2, /home/), vC.col, night);
    // the lanterns: each lights as its voice speaks, and stays lit
    VOICES.forEach((v, k) => {
      const t0 = this.lines[k]!.words[0]!.start - 0.15;
      lantern(c, g, v.lantern[0], v.lantern[1], 330, v.col, strike(t, t0), t, night);
    });

    // the pole through her heart: dark wood, lit gold from her heart outwards on "carrying"
    const py = POLE - lift;
    const poleLit = shot.kind === 'reveal' ? clamp((t - carry) / 0.7) : 0;
    c.lineCap = 'round';
    c.strokeStyle = '#2a1a10'; c.lineWidth = 22; c.beginPath(); c.moveTo(POLE_X0, py); c.lineTo(POLE_X1, py); c.stroke();
    c.strokeStyle = '#8a5a32'; c.lineWidth = 16; c.beginPath(); c.moveTo(POLE_X0, py); c.lineTo(POLE_X1, py); c.stroke();
    c.strokeStyle = 'rgba(255,220,170,0.5)'; c.lineWidth = 4; c.beginPath(); c.moveTo(POLE_X0, py - 4); c.lineTo(POLE_X1, py - 4); c.stroke();
    if (poleLit > 0) {
      const reach = ease.outCubic(poleLit);
      const xa = lerp(0, POLE_X0, reach), xb = lerp(0, POLE_X1, reach);
      c.strokeStyle = HEX.gold; c.lineWidth = 16; c.beginPath(); c.moveTo(xa, py); c.lineTo(xb, py); c.stroke();
      g.strokeStyle = rgbaHex(HEX.gold, 0.75); g.lineWidth = 30; g.lineCap = 'round'; g.beginPath(); g.moveTo(xa, py); g.lineTo(xb, py); g.stroke();
    }

    // Rai, in the middle
    this.rai(c, g, t, shot, lift, { every, them, carry, stoneT });

    // the stations of A, B, D, E (front row) and the voices
    const vA = VOICES[0]!, vB = VOICES[1]!, vD = VOICES[3]!, vE = VOICES[4]!;
    calcCrate(c, g, vA.x - 150, vA.y - 8, 200, t, this.kt(0, /count/), this.kt(0, /seen/), vA.col, night);
    stall(c, vB.x - 140, vB.y - 50, 260, t, this.kt(1, /break/), vB.col, night);
    noticeboard(c, vD.x + 130, vD.y - 40, 230, t, this.kt(3, /pay/), this.kt(3, /years/), this.beat, vD.col, night);
    scoreboard(c, vE.x + 160, vE.y - 30, 270, t, this.kt(4, /smash/), downT, vE.col, night);
    // depth order: the back-row voice first
    [2, 0, 1, 3, 4].forEach((k) => this.voice(c, g, t, k, shot, lift));
    c.restore(); g.restore();
    // the dust when the scoreboard comes down: it billows into her cut-in from the right
    if (t > downT + 0.2 && t < downT + 1.6) {
      const u = (t - downT - 0.2) / 1.4;
      for (let i = 0; i < 9; i++) {
        const dx = W + 120 - 900 * Math.sqrt(u) * (0.5 + 0.5 * h01(i, 4)), dy = H * (0.55 + 0.3 * h01(i, 5)) - 120 * u;
        puff(c, dx, dy, (60 + 110 * u) * (0.7 + 0.5 * h01(i, 6)), `rgba(240,205,175,${0.7 * (1 - u)})`);
      }
    }

    // dusk deepens over the frame (the light is going)
    c.fillStyle = rgbaHex('#1a1240', 0.03 + 0.12 * night); c.fillRect(0, 0, W, H);

    // ---- type
    let post: PostOverrides = { bloom: 0.65, vignette: 0.4 + 0.15 * night };
    if (shot.kind === 'voice') {
      const v = VOICES[shot.k]!, ln = this.lines[shot.k]!;
      const kw = this.word(ln, shot.k === 2 ? /^out/ : v.key);
      const wx = shot.k === 4 ? 520 : W / 2 + (v.flip ? 200 : -200);
      slam(c, v.word, wx, 150, 130, t, kw.start, { col: v.col, shadow: HEX.ink, rot: v.flip ? 0.03 : -0.03, maxW: 1100 });
      if (shot.k === 1) slam(c, 'BREAK', wx, 290, 96, t, this.kt(1, /break/), { col: HEX.bone, shadow: HEX.ink, rot: -0.05 });
      if (shot.k === 3) slam(c, 'YEARS OF HER OWN', wx, 285, 80, t, this.kt(3, /years/), { col: HEX.bone, shadow: HEX.ink });
      if (shot.k === 4) slam(c, 'THE SCOREBOARD', wx, 285, 80, t, this.kt(4, /scoreboard/), { col: HEX.bone, shadow: HEX.ink });
      band(c, ln, t, { sung: v.col, dark: 0.62, size: 50 });
      post = mergePost(post, punch(t, [kw.start], 0.015));
      if (shot.k === 4) post = mergePost(post, hitShake(t, [this.kt(4, /smash/)], 4, 0.28), punch(t, [this.kt(4, /smash/)], 0.03));
    } else if (shot.kind === 'rai') {
      band(c, this.lines[shot.k]!, t, { sung: VOICES[shot.k]!.col, dark: 0.62, size: 50 });
    } else {
      slam(c, 'EVERY ONE OF THEM', W / 2, 140, 96, t, every, { col: HEX.bone, shadow: HEX.ink, t1: carry - 0.06, exit: 0.1 });
      slam(c, 'CARRYING THE STONE', W / 2, 140, 112, t, carry, { col: HEX.gold, shadow: HEX.ink });
      g.save(); g.globalAlpha = 0.35; slam(g, 'CARRYING THE STONE', W / 2, 140, 112, t, carry, { col: HEX.gold }); g.restore();
      band(c, last, t, { sung: HEX.gold, dark: 0.62, size: 50 });
      post = mergePost(post, punch(t, [carry], 0.03), caKick(t, [carry], 3), punch(t, [stoneT], 0.015));
    }

    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    return mergePost(post, { zoom: 1 + 0.004 * f.a.kick });
  }

  /** Rai: soft by default; her reaction in each cut-in; on the reveal, wow then joy. */
  rai(c: CanvasRenderingContext2D, g: CanvasRenderingContext2D, t: number, shot: Shot, lift: number, e: { every: number; them: number; carry: number; stoneT: number }) {
    let face: Face = 'soft', arms: ArmPose | [ArmPose, ArmPose] = 'down', marks: Mark[] = [], markT0 = shot.s0 + 0.12, look = 0, squash = 0, tilt = 0, glow = '#ffcf9a', gs = 0.35;
    let heart = 0.2, heartColor: string = HEX.pink;
    if (shot.kind === 'rai') {
      const r = REACT[shot.k]!, lt = t - shot.s0;
      face = r.face; arms = r.arms; marks = r.marks; look = r.look;
      if (shot.k === 1) squash = 0.07 * Math.sin(lt * Math.PI * 2 * 2.3);   // nodding
      if (shot.k === 0) tilt = -0.05;
      if (shot.k === 4 && t > this.kt(4, /down/) + 0.5) { marks = ['sweat', '!']; markT0 = this.kt(4, /down/) + 0.5; }
    } else if (shot.kind === 'reveal') {
      if (t < e.every + 0.3) { face = 'soft'; look = Math.sin(t * 3) * 0.8; }
      else if (t < e.carry) { face = 'wow'; arms = ['cheek', 'cheek']; marks = ['!']; markT0 = e.every + 0.3; look = Math.sin(t * 4); }
      else { face = 'joy'; arms = ['up', 'up']; marks = t > e.stoneT ? ['sparkle', 'hearts'] : ['sparkle']; markT0 = t > e.stoneT ? e.stoneT : e.carry; squash = 0.06 * Math.sin((t - e.carry) * 9); glow = HEX.gold; gs = 0.9; heart = 0.4 + 0.6 * clamp((t - e.stoneT) / 0.5); heartColor = HEX.gold; }
    }
    drawRai(c, 0, DISC - lift, R, { t, face, arms, armsFrom: 'down', armsU: clamp((t - shot.s0) / 0.18), marks, markT0, look, squash, tilt, glow, glowStrength: gs, heart, heartColor });
    // she hides the pole's glow behind her (her heart's hole stays open)
    g.save(); g.globalCompositeOperation = 'destination-out';
    g.beginPath(); g.arc(0, DISC - lift, R, 0, TAU); g.moveTo(0.27 * R, DISC - lift + 0.12 * R); g.arc(0, DISC - lift + 0.12 * R, 0.27 * R, 0, TAU); g.fill('evenodd');
    g.beginPath(); g.arc(0, DISC - lift - 1.2 * R, 0.8 * R, 0, TAU); g.fill();
    g.restore();
  }

  /** A voice: acting at their station; on the reveal, walking to the pole and carrying it. */
  voice(c: CanvasRenderingContext2D, g: CanvasRenderingContext2D, t: number, k: number, shot: Shot, lift: number) {
    const v = VOICES[k]!, ln = this.lines[k]!;
    const ta = this.word(ln, v.key).start, tb = this.word(ln, v.key2).start, tc = v.key3 ? this.word(ln, v.key3).start : tb;
    // the reveal: each takes hold of the pole on a word of "every one of them is"
    const last = this.lines[5]!;
    const ws = [this.word(last, /every/).start, this.word(last, /^one/).start, this.word(last, /^of/).start, this.word(last, /them/).start, this.word(last, /^is/).start];
    const go = shot.kind === 'reveal' ? ws[k]! - 0.12 : 1e9;
    const dist = Math.hypot(v.px - v.x, FEET - v.y), dur = 0.22 + dist / 1200;
    const w = clamp((t - go) / dur);
    if (w > 0) {
      const u = ease.inOutQuad(w), x = lerp(v.x, v.px, u), y = lerp(v.y, FEET, u);
      if (w < 1) {
        const bob = Math.abs(Math.sin(w * Math.PI * 4)) * 8;
        person(c, x, y - bob, HV, 'stand', { col: BODY, t, seed: v.seed, flip: v.px < v.x, rim: v.col });
      } else {
        const draw = (k2: CanvasRenderingContext2D, col: string) => carrier(k2, x, y, HV, { col, t, seed: v.seed, arms: 1, up: lift / (0.5 * HV) });
        draw(c, BODY);
        rimmed(g, draw, v.col, -3, -4, 0.55);
        const joyT = this.word(last, /carrying/).start;
        if (t > joyT) emote(c, x, y - lift - HV * 0.88, HV * 0.09 * 1.5, 'joy', t, joyT + k * 0.05);
      }
      return;
    }
    // acting at the station
    let pose: Pose = 'stand', em: Emote | undefined, emT0 = -1e9, tilt = 0;
    if (k === 0) { // count her, or she's never seen
      if (t >= ta) { pose = 'point'; em = '!'; emT0 = ta; }
      if (t >= tc) { pose = 'hands'; em = 'heart'; emT0 = tc; }
    } else if (k === 1) { // price it and you'll break what it means
      pose = 'hands';
      if (t >= ta) { pose = 'point'; em = '?'; emT0 = ta; }
      if (t >= tb) { pose = 'face'; em = 'sweat'; emT0 = tb; }
    } else if (k === 2) { // keep your numbers out of my home
      pose = 'lean'; tilt = 0.08;
      if (t >= ta) { em = '!'; emT0 = ta; }
      if (t >= tc) { em = 'anger'; emT0 = tc; }
    } else if (k === 3) { // pay her, give her years of her own
      if (t >= ta) { pose = 'point'; em = '!'; emT0 = ta; }
      if (t >= tb) { pose = 'cheer'; em = 'joy'; emT0 = tb; }
    } else { // smash the scoreboard down
      pose = 'cheer';
      if (t >= ta) { em = '!'; emT0 = ta; }
      if (t >= tb + 0.6) { pose = 'stand'; em = 'sigh'; emT0 = tb + 0.6; }
    }
    person(c, v.x, v.y, HV, pose, { col: BODY, t, seed: v.seed, flip: v.flip, headTilt: tilt, rim: v.col, emote: em, emoteT0: emT0 });
    if (k === 4 && pose === 'cheer') { // the sledgehammer: raised behind, swung onto the board on "smash"
      const u = HV / 100, swing = t < ta - 0.22 ? 0 : t < ta ? ease.inCubic((t - ta + 0.22) / 0.22) : 1;
      const rot = lerp(-0.9 + 0.08 * Math.sin(t * 3), 0.52, swing);
      hammerAt(c, v.x + 22 * u, v.y - 108 * u, 175, rot);
    }
    void poleY;
  }
}
