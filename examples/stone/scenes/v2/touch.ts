// v2 "THE DIVER": touch (40.68–53.96), the hush. The pre-chorus dip in D minor, the most tender minute so far, lines
// 10–13, sung in pink. One night set on the seabed: the girl's torch planted in the sand like a lamp, aimed up at Rai's
// face; everything else is the deep's dark. After the touch the sea slows to a third (the reeds, the snow in the beam,
// the bubbles), and it stays slow until the manta comes. Shots, each cut on the beat at or before its line:
//
//   A "'Cause I was never really stone," (40.68) The two-shot from legend's end (RICHEST ROCK in the sand, her three
//     coins): the girl pushes off the sand and drifts up to Rai's face as the camera pushes in to a close-up. Her hand
//     reaches into the torchlight; on "never" it touches Rai's cheek and rings of light ripple out from it, across
//     her face and into the water. Rai: a small wow as the hand comes, then soft, leaning into it, her own hand to her
//     other cheek, eyes closing on "stone". The sea slows.
//   B "I'm the story that you keep;" (43.68) She kneels in the sand, unhooks her slate and draws Rai in pencil: the
//     disc and its hole, the head, a smile, little arms, the starfish. Rai leans in over it: love, hands to her
//     cheeks, hearts on "keep". The slate's corner has old pencil: a tally of her dives (she counts things).
//   C1 "I'm worth exactly what you say," (47.53) Rai's eyes: the slate held up to her, and under the drawing the
//     girl writes a big "?".
//   C2 (49.25) Rai's cheeky tilt, chin in hand, sizing up the "?"; on "say," she pops chibi with a "?" of her own.
//   D "so what are you saying about me?" (50.53) Rai, close, asks us (a shrug, open palm); the slate soft in the
//     foreground. On "saying" focus pulls to the slate: the girl rubs the "?" out and draws a heart. On "me?" focus
//     comes back to Rai, her hand on her chest, and her heart lights pink, a ring of pink light; the camera pulls back
//     to the two-shot, which is manta's first frame (END_CAM): the deep dark above them, where the manta will come.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../../engine/scene';
import { Layer2D, W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import type { Line, Word } from '../../engine/lyrics';
import { clamp, ease, lerp } from '../../engine/util';
import { drawRai, type Face, type ArmPose, type RaiOpts } from '../_rai';
import { rgbaHex } from '../_motifs';
import { poof } from '../_manga';
import { mergePost, punch } from '../_post';
import { girl, bubbleLyric, currentLine, clearGlowBand, GIRL_POSES, type GirlPose } from './_diver';
import {
  SET, TORCH_ANG, END_CAM, hushTime, applyCam, camLerp, clampCam, Soft, focus, reachArm, forearmAngle, girlFrame, childHand,
  plantedTorch, marineSnow, bokehBubbles, lightRipples, glowPool, softBeam, falloff, warmWash, girlRim, slateBoard, handPencil, raiDrawing, slateCorner,
  graphite, questionPts, heartPts, along, sketch, smudge, softGlowBand, sandWriting, coins, pebble, nightSeabed, darknessFill, nightReeds,
  type Cam, type C2, type P, type Stroke,
} from './touch-props';

const GIRL_H = 480, SIL = '#0d0a18', RIM = 'rgba(255,206,140,0.85)';
const RAI = SET.rai;
/** Rai's cheek on the girl's side (the viewer's left), from her face geometry in _rai.ts. */
const CHEEK: P = { x: RAI.x - 0.5 * RAI.R, y: RAI.y - 0.9 * RAI.R };

const mixPose = (a: GirlPose, b: GirlPose, u: number): GirlPose => {
  const m = (x: number, y: number) => x + (y - x) * u;
  return { rot: m(a.rot, b.rot), hip: [m(a.hip[0], b.hip[0]), m(a.hip[1], b.hip[1])], knee: [m(a.knee[0], b.knee[0]), m(a.knee[1], b.knee[1])], sh: [m(a.sh[0], b.sh[0]), m(a.sh[1], b.sh[1])], el: [m(a.el[0], b.el[0]), m(a.el[1], b.el[1])], head: m(a.head ?? 0, b.head ?? 0), drop: m(a.drop ?? 0, b.drop ?? 0) };
};
/** Floating beside Rai's face, leaning in, fins idling. */
const floatPose = (t: number): GirlPose => ({ rot: 0.32, hip: [-0.3 + 0.12 * Math.sin(t * 2.1), 0.02 - 0.12 * Math.sin(t * 2.1)], knee: [-0.75, -0.5], sh: [-0.5, 1.2], el: [0.5, 0.3], head: 0.12 });
/** Kneeling in the sand to draw. */
const kneelDraw = (t: number): GirlPose => ({ ...GIRL_POSES.kneel!(t), rot: 0.06, head: 0.18 });

type Shot = 'A' | 'B' | 'C1' | 'C2' | 'D';

export default class Touch extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  bg = new Soft(0.5);
  fg = new Soft(0.5);
  bg2 = new Soft(0.5);
  fg2 = new Soft(0.5);
  lines: Line[] = [];
  cut: Record<Shot, number> = { A: 0, B: 0, C1: 0, C2: 0, D: 0 };
  w: Record<string, Word> = {};
  draw: Stroke[] = [];
  qStrokes: Stroke[] = [];
  heartStroke: Stroke[] = [];

  override init() {
    const { lyrics, audio: au, start, end } = this.ctx;
    this.lines = lyrics.lines.filter((l) => l.words[0]!.start >= start - 0.1 && l.words[0]!.start < end);   // 10-13, and 14 (it starts 0.02 s before the cut: it rises here and carries on in manta)
    const [l10, l11, l12, l13] = this.lines;
    const beatAtOrBefore = (s: number) => au.timeOfBeat(Math.floor(au.beatAt(s + 0.02)));
    const find = (l: Line, re: RegExp) => l.words.find((w) => re.test(w.w.toLowerCase().replace(/[^a-z?]/g, ''))) ?? l.words[0]!;
    this.w = {
      never: find(l10!, /^never/), really: find(l10!, /^really/), stone: find(l10!, /^stone/),
      story: find(l11!, /^story/), you: find(l11!, /^you/), keep: find(l11!, /^keep/),
      exactly: find(l12!, /^exactly/), what: find(l12!, /^what/), say: find(l12!, /^say/),
      so: l13!.words[0]!, saying: find(l13!, /^saying/), about: find(l13!, /^about/), me: find(l13!, /^me/),
    };
    this.cut = {
      A: start, B: beatAtOrBefore(l11!.words[0]!.start), C1: beatAtOrBefore(l12!.words[0]!.start),
      C2: beatAtOrBefore(this.w.what!.start), D: beatAtOrBefore(l13!.words[0]!.start),
    };
    // her drawing of Rai across "story ... keep"; the "?" across "exactly what"; the heart on "about"
    this.draw = raiDrawing(this.w.story!.start - 0.3, this.w.keep!.start + 0.1);
    const [hook, dot] = questionPts(0, 102, 48);
    this.qStrokes = [{ t0: this.w.exactly!.start, t1: this.w.what!.start - 0.42, pts: hook, w: 7 }, { t0: this.w.what!.start - 0.32, t1: this.w.what!.start - 0.18, pts: dot, w: 9 }];
    this.heartStroke = [{ t0: this.w.about!.start - 0.05, t1: this.w.me!.start + 0.05, pts: heartPts(0, 103, 23), w: 6.5, col: '#2a2a33' }];
  }

  shotAt(t: number): Shot {
    const k = this.cut;
    return t >= k.D ? 'D' : t >= k.C2 ? 'C2' : t >= k.C1 ? 'C1' : t >= k.B ? 'B' : 'A';
  }

  /** What is written on the slate at t (slate units): the corner, the drawing, the "?" (rubbed out in D), the heart. */
  slateWriting(c: C2, t: number): { x: number; y: number; drawing: boolean; rub: number } {
    slateCorner(c);
    let tip = sketch(c, this.draw, t, graphite);
    const rubT0 = this.w.saying!.start - 0.1, rubT1 = this.w.about!.start - 0.12;
    const rub = clamp((t - rubT0) / (rubT1 - rubT0));
    if (rub < 1) {
      c.save(); c.globalAlpha = 1 - ease.inQuad(rub);
      const q = sketch(c, this.qStrokes, t, graphite);
      c.restore();
      if (t >= this.qStrokes[0]!.t0) tip = q;
    }
    smudge(c, 0, 104, 40, Math.min(1, rub * 1.4) * (1 - 0.4 * clamp((t - rubT1) / 0.6)));
    if (t >= this.heartStroke[0]!.t0) tip = sketch(c, this.heartStroke, t, graphite);
    return { ...tip, rub: rub > 0 && rub < 1 ? 1 : 0 };
  }

  /** The torch's beam, from its lens up to her face. */
  torchLight(g: C2, tipP: P, a = 1) {
    const len = Math.hypot(SET.aim.x - tipP.x, SET.aim.y - tipP.y) + 30;
    softBeam(g, tipP.x, tipP.y, TORCH_ANG, len, 0.26, a);
    return { x: tipP.x, y: tipP.y, ang: TORCH_ANG, len, spread: 0.26 };
  }

  /** Rai on the set, acting. */
  rai(c: C2, t: number, o: Partial<RaiOpts>) {
    return drawRai(c, RAI.x, RAI.y, RAI.R, { t, glow: '#ffcf8a', glowStrength: 0.35, ...o } as RaiOpts);
  }

  /** The props on the sand: legend's writing and coins, the little holed pebble by her foot, the torch. */
  sand(c: C2, g: C2, t: number) {
    sandWriting(c, 'RICHEST ROCK', 1150, 958, 70, 0.9);
    coins(c, g, 1080, 893, 1, t);
    pebble(c, 1372, 892, 1);
    return plantedTorch(c, SET.torch.x, SET.torch.y, TORCH_ANG, 1.5);
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t, tau = hushTime(t), w = this.w;
    this.L.clear('#02040c'); this.G.clear();
    const shot = this.shotAt(t);
    let post: PostOverrides = { bloom: 0.68, vignette: 0.5 };
    const tT = w.never!.start;   // the touch

    if (shot === 'C1') {
      post = mergePost(post, this.povSlate(c, g, t, tau));
    } else if (shot === 'B') {
      this.overShoulder(c, g, t, tau);
    } else {
      // the cameras on the set
      let cam: Cam;
      if (shot === 'A') {
        const k0: Cam = { x: 1062, y: 600, z: 1.12 }, k1: Cam = { x: 1150, y: 548, z: 2.15 }, k2: Cam = { x: 1156, y: 546, z: 2.25 };
        cam = t < tT + 0.9 ? camLerp(k0, k1, ease.inOutCubic(clamp((t - this.cut.A - 0.1) / (tT + 0.9 - this.cut.A - 0.1)))) : camLerp(k1, k2, clamp((t - tT - 0.9) / (this.cut.B - tT - 0.9)));
      } else if (shot === 'C2') {
        cam = camLerp({ x: 1205, y: 560, z: 1.72 }, { x: 1212, y: 556, z: 1.84 }, clamp((t - this.cut.C2) / (this.cut.D - this.cut.C2)));
      } else {
        const back = w.me!.start - 0.05;
        const close = camLerp({ x: 1170, y: 598, z: 2.1 }, { x: 1166, y: 600, z: 2.2 }, clamp((t - this.cut.D) / (back - this.cut.D)));
        cam = t < back ? close : camLerp(close, END_CAM, ease.inOutCubic(clamp((t - back) / (this.ctx.end - 0.04 - back))));
      }
      cam = clampCam(cam);
      // focus: the set's depth of field (background always soft; D racks between Rai and the slate)
      const bgBlur = shot === 'A' ? lerp(2.5, 7, clamp((cam.z - 1.12) / 0.9)) : shot === 'D' ? lerp(3, 7, clamp((cam.z - 1.15) / 1)) : 5.5;
      const rack = shot === 'D' ? ease.inOutCubic(clamp((t - w.saying!.start) / 0.35)) * (1 - ease.inOutCubic(clamp((t - w.me!.start) / 0.3))) : 0;
      const heartOn = shot === 'D' ? ease.outCubic(clamp((t - w.me!.start - 0.02) / 0.35)) : 0;
      // the background: the night seabed, soft, lit only round the torch and her
      focus(c, this.bg, bgBlur, (k) => { k.save(); applyCam(k, cam); nightSeabed(k, tau, [{ x: 1160, y: 690, r: 680, soft: 0.95 }], 0.8); k.restore(); });
      for (const k of [c, g]) { k.save(); applyCam(k, cam); }
      const tip = this.sand(c, g, t);
      if (shot === 'A') this.shotA(c, g, t, cam);
      else if (shot === 'C2') this.shotC2(c, g, t);
      else this.shotD(c, g, t, rack, heartOn);
      // the light: warm from the torch on what faces it, the dark closing in round the pool
      warmWash(c, tip.x + 40, tip.y - 80, 560, '#ffb060', 0.1);
      falloff(c, 1150, 650, 300, 1000, 0.6);
      const beam = this.torchLight(g, tip);
      marineSnow(c, g, tau, beam, 120, 7, { x: 500, y: 250, w: 1100, h: 700 });
      if (shot === 'A' && t >= tT) lightRipples(g, CHEEK.x, CHEEK.y, t, tT, { n: 4, gap: 0.34, speed: 250, life: 2.4 });
      if (heartOn > 0) {
        const hy = RAI.y - 0.12 * RAI.R;
        glowPool(g, RAI.x, hy, 260, HEX.pink, 0.2 * heartOn);
        lightRipples(g, RAI.x, hy, t, w.me!.start + 0.02, { n: 3, gap: 0.3, speed: 260, life: 1.4, col: HEX.pink, a: 0.9 });
      }
      for (const k of [c, g]) k.restore();
      // the near reeds and the slow bubbles, out of focus in front of the lens
      focus(c, this.fg, 9, (k) => { nightReeds(k, tau, 4); bokehBubbles(k, tau, 6, 5, 0.9); });
    }

    // the rising lyric, pink in the hush
    const line = currentLine(this.lines, t, 0.2);   // 14 takes over as 13's last word ends, so it rises across the cut
    if (line) bubbleLyric(c, line, t, { sung: line === this.lines[4] ? HEX.yellow : HEX.pink });
    softGlowBand(g); clearGlowBand(g);
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    return post;
  }

  // ---------------------------------------------------------------- A: the touch

  shotA(c: C2, g: C2, t: number, cam: Cam) {
    const w = this.w, tT = w.never!.start, u = GIRL_H / 100;
    // she pushes off the sand (where she wrote RICHEST ROCK) and drifts up beside Rai's face
    const rise = ease.inOutCubic(clamp((t - this.cut.A + 0.05) / 0.8));
    const gx = lerp(905, 990, rise), gy = lerp(SET.floor + 5, 880, rise);
    let p = mixPose(GIRL_POSES.kneel!(t), floatPose(t), rise);
    const fr = girlFrame(gx, gy, GIRL_H, p);
    const rest: P = { x: fr.shoulder.x + 14 * u, y: fr.shoulder.y + 22 * u };
    const r = ease.inOutCubic(clamp((t - 40.95) / (tT - 40.95)));
    const breathe = t > tT ? 1.5 * Math.sin((t - tT) * 2.4) : 0;
    const target: P = { x: lerp(rest.x, CHEEK.x, r), y: lerp(rest.y, CHEEK.y, r) - Math.sin(r * Math.PI) * 18 + breathe };
    p = reachArm(gx, gy, GIRL_H, p, false, 1, target);
    // Rai: smiling from legend, a small wow as the hand comes, then soft, leaning into it
    const touched = t >= tT, closing = t >= w.stone!.start;
    const face: Face = touched ? 'soft' : t > tT - 0.45 ? 'wow' : 'smile';
    const arms: [ArmPose, ArmPose] = touched ? ['down', 'cheek'] : ['down', 'down'];
    this.rai(c, t, {
      face, arms, armsFrom: ['down', 'down'], armsU: clamp((t - tT - 0.25) / 0.5), look: touched ? -0.35 : -0.6,
      tilt: touched ? 0.07 * ease.outCubic(clamp((t - tT) / 0.6)) : 0, blush: touched ? 0.55 + 0.3 * clamp((t - tT) / 1.5) : 0,
      squash: closing ? -0.05 * ease.outCubic(clamp((t - w.stone!.start) / 0.5)) : 0, noBlink: !touched,
    });
    const an = girl(c, gx, gy, GIRL_H, p, { t, underwater: true, fins: true, slate: true, glint: closing ? 'spark' : touched ? 'plain' : 'wide', col: SIL });
    girlRim(c, gx, gy, GIRL_H, p, RIM);
    childHand(c, an.hands[1].x, an.hands[1].y, forearmAngle(gx, gy, GIRL_H, p, false, 1), u, SIL, { spread: 0.24, curl: touched ? 0.15 : 0, rim: RIM });
    this.breath(c, an.head, t, 0.6);
    void cam; void g;
  }

  /** Her breath: bubbles from the snorkel, rising at hush speed. */
  breath(c: C2, head: P, t: number, a = 1) {
    const tau = hushTime(t), u = GIRL_H / 100;
    c.save(); c.strokeStyle = `rgba(215,240,255,${0.55 * a})`; c.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const ph = ((tau * 0.55 + i / 6) % 1);
      const x = head.x - 6 * u + 6 * Math.sin(tau * 2 + i * 1.7) + ph * 10, y = head.y - 22 * u - ph * 420;
      c.beginPath(); c.arc(x, y, (2.5 + 4 * (i % 3)) * (0.6 + ph), 0, Math.PI * 2); c.stroke();
    }
    c.restore();
  }

  // ---------------------------------------------------------------- B: the drawing

  /**
   * Over her shoulder: the slate comes up into her lap and she draws Rai on it; her hand and pencil come in from the
   * bottom left; Rai leans in from the right, curious, then in love; hearts on "keep".
   */
  overShoulder(c: C2, g: C2, t: number, tau: number) {
    const w = this.w, t0 = this.cut.B;
    const push = clamp((t - t0) / (this.cut.C1 - t0));
    const cam: Cam = { x: 960 + 14 * push, y: 540, z: 1 + 0.05 * push };
    focus(c, this.bg, 9, (k) => { k.save(); applyCam(k, { x: 1150, y: 640, z: 1.5 }); nightSeabed(k, tau, [{ x: 1250, y: 760, r: 700, soft: 0.95 }], 0.8); k.restore(); });
    for (const k of [c, g]) { k.save(); applyCam(k, cam); }
    // Rai leans in from the right (she is lit by the torch planted at her side)
    const love = t >= w.story!.start, keep = t >= w.keep!.start;
    const lean = ease.inOutCubic(clamp((t - t0 - 0.1) / 0.9));
    warmWash(c, 1500, 1050, 900, '#ffb060', 0.14);
    this.raiDraw(c, 1660 - 50 * lean, 930, 290, t, {
      face: love ? 'love' : 'smile', arms: love ? ['cheek', 'cheek'] : ['down', 'down'], armsFrom: ['down', 'down'], armsU: clamp((t - w.story!.start) / 0.35),
      tilt: 0.26 + 0.12 * lean, look: -0.8, blush: love ? 0.9 : 0.3,
      marks: keep ? ['hearts'] : [], markT0: w.keep!.start, hop: keep ? 0.05 * Math.abs(Math.sin((t - w.keep!.start) * 7)) * (1 - clamp((t - w.keep!.start) / 1.2)) : 0,
    });
    // the slate rises into her lap
    const lift = ease.outCubic(clamp((t - t0) / 0.6));
    const sx = 820, sy = lerp(1400, 640, lift), ss = 1.95, rot = lerp(-0.3, -0.1, lift);
    slateBoard(c, sx, sy, ss, rot, { pencil: 'none', draw: (k) => { this.slateWriting(k, t); } });
    const mm = slateBoard(NULLC, sx, sy, ss, rot, {});
    // her back hand holds the slate's left edge (her arm comes up from the bottom of the frame)
    const u = 12, hold = mm.transformPoint(new DOMPoint(-112, 70));
    arm(c, { x: hold.x - 70, y: H + 80 }, { x: hold.x - 8, y: hold.y + 6 }, u, SIL);
    childHand(c, hold.x, hold.y, -0.3 + rot, u, SIL, { spread: 0.18, curl: 0.35, rim: RIM });
    // the drawing hand: the pencil's tip on the line, her hand back along it, her arm up from below; it lifts away when
    // the drawing is done, to show it
    if (lift > 0.85) {
      const done = this.draw[this.draw.length - 1]!.t1, away = ease.inOutCubic(clamp((t - done - 0.05) / 0.4));
      const tipL = sketch(NULLC, this.draw, t, () => {});
      const tip0 = mm.transformPoint(new DOMPoint(tipL.x, tipL.y));
      const tipP = { x: tip0.x + 260 * away, y: tip0.y + 330 * away };
      const pAng = 1.15 + (tipL.drawing ? 0.12 * Math.sin(t * 11) : 0.1) + 0.3 * away;
      const grip = { x: tipP.x + Math.cos(pAng) * 50 * ss, y: tipP.y + Math.sin(pAng) * 50 * ss };
      arm(c, { x: grip.x + 150, y: H + 90 }, grip, u, SIL);
      childHand(c, grip.x, grip.y, pAng + Math.PI * 0.95, u, SIL, { spread: 0.12, curl: 0.6, rim: RIM });
      handPencil(c, tipP.x, tipP.y, pAng, 70 * ss, 8 * ss);
    }
    falloff(c, 1000, 560, 420, 1200, 0.5);
    marineSnow(c, g, tau, { x: 1500, y: 1100, ang: -2.4, len: 1200, spread: 0.4 }, 110, 13);
    for (const k of [c, g]) k.restore();
    // over her shoulder: the back of her head, soft, in the bottom-left corner; the near reeds; bubbles
    focus(c, this.fg, 10, (k) => { nightReeds(k, tau, 6); bokehBubbles(k, tau, 5, 12, 0.9); });
  }

  /** Rai anywhere (the inserts), with the set's warm glow. */
  raiDraw(c: C2, x: number, y: number, R: number, t: number, o: Partial<RaiOpts>) {
    return drawRai(c, x, y, R, { t, glow: '#ffcf8a', glowStrength: 0.35, ...o } as RaiOpts);
  }

  // ---------------------------------------------------------------- C1: Rai's eyes, the "?"

  povSlate(c: C2, g: C2, t: number, tau: number): PostOverrides {
    const cam: Cam = camLerp({ x: 960, y: 540, z: 1.0 }, { x: 975, y: 545, z: 1.06 }, clamp((t - this.cut.C1) / (this.cut.C2 - this.cut.C1)));
    // the background: the night seabed seen from Rai's side, very soft
    focus(c, this.bg, 9, (k) => { k.save(); applyCam(k, clampCam(cam)); nightSeabed(k, tau, [{ x: 960, y: 560, r: 560, soft: 0.7 }], 0.84, { x: 1560, w: 260, a: 1 }); k.restore(); });
    for (const k of [c, g]) { k.save(); applyCam(k, cam); }
    const h = 700, u = h / 100, gx = 790, gy = 1110;
    let p = kneelDraw(t); p = { ...p, rot: 0.02 };
    const sx = 1030, sy = 560, ss = 1.55, rot = 0.04 + 0.01 * Math.sin(t * 1.3);
    const m = slateBoard(NULLC, sx, sy, ss, rot, {});
    const tipL = sketch(NULLC, [...this.draw, ...this.qStrokes], t, () => {});
    const qDone = this.qStrokes[1]!.t1, away = ease.inOutCubic(clamp((t - qDone - 0.02) / 0.2));
    const tip0 = m.transformPoint(new DOMPoint(tipL.x, tipL.y)), tipP = { x: tip0.x + 120 * away, y: tip0.y + 150 * away };
    const pAng = 2.2 + 0.18 * Math.sin(t * 10) * (tipL.drawing ? 1 : 0);
    const grip = { x: tipP.x + Math.cos(pAng) * 52 * ss, y: tipP.y + Math.sin(pAng) * 52 * ss };
    const hold = m.transformPoint(new DOMPoint(-104, 40));
    p = reachArm(gx, gy, h, p, false, 0, { x: hold.x, y: hold.y }, 1);
    p = reachArm(gx, gy, h, p, false, 1, grip, 1);
    warmWash(c, sx, sy, 700, '#ffb060', 0.12);   // her torch is at Rai's side now: the light falls on the slate and on her
    girl(c, gx, gy, h, p, { t, underwater: true, fins: true, glint: 'plain', col: SIL });
    girlRim(c, gx, gy, h, p, RIM);
    slateBoard(c, sx, sy, ss, rot, { pencil: 'none', draw: (k) => { this.slateWriting(k, t); } });
    frontForearm(c, gx, gy, h, p, SIL);
    childHand(c, grip.x, grip.y, pAng + Math.PI * 0.95, u, SIL, { spread: 0.12, curl: 0.6, rim: RIM });
    handPencil(c, tipP.x, tipP.y, pAng, 74 * ss, 9 * ss);
    falloff(c, sx - 60, sy + 40, 330, 1000, 0.55);
    marineSnow(c, g, tau, { x: 1500, y: 1150, ang: -2.2, len: 1100, spread: 0.45 }, 110, 9);
    for (const k of [c, g]) k.restore();
    focus(c, this.fg, 9, (k) => { nightReeds(k, tau, 9); bokehBubbles(k, tau, 5, 8, 0.9); });
    // a soft nudge in on the "?"
    return punch(t, [this.w.what!.start + 0.05], 0.012, 0.5);
  }

  // ---------------------------------------------------------------- C2: the cheeky tilt

  shotC2(c: C2, g: C2, t: number) {
    const w = this.w;
    const sd = t >= w.say!.start;
    // the slate held up to her (turned to her: we see it edge-on, its "?" just readable), soft in the foreground
    this.heldSlate(c, t, 0.5, 4);
    const tilt = 0.15 * ease.outBack(clamp((t - this.cut.C2 - 0.05) / 0.35));
    this.rai(c, t, sd ? { face: 'cheeky', sd: true, arms: ['hip', 'point'], marks: ['?'], markT0: w.say!.start + 0.08, tilt: 0.12 } : {
      face: 'cheeky', arms: ['hip', 'chin'], armsFrom: ['down', 'down'], armsU: clamp((t - this.cut.C2) / 0.25), tilt, look: -0.6, marks: ['shine'], markT0: w.what!.start + 0.4,
    });
    poof(c, RAI.x, RAI.y - 0.6 * RAI.R, RAI.R * 1.5, t, w.say!.start);
    void g;
  }

  /** The girl kneeling with the slate held up towards Rai (sx < 1: turned), sharp or soft. */
  heldSlate(c: C2, t: number, sxk: number, blur: number) {
    focus(c, this.fg, blur, (k) => {
      // the soft layer starts with no transform: give it the camera the main layer has now
      if (k !== c) k.setTransform(scaleBy(c.getTransform(), this.fg.k));
      const gx = 880, gy = SET.floor + 5, u = GIRL_H / 100;
      let p = kneelDraw(t);
      const m = slateBoard(NULLC, 1010, 640, 1.0, 0, { sx: sxk });
      const hold = m.transformPoint(new DOMPoint(-100, 60)), hold2 = m.transformPoint(new DOMPoint(-100, -40));
      p = reachArm(gx, gy, GIRL_H, p, false, 0, { x: hold.x, y: hold.y }, 1);
      p = reachArm(gx, gy, GIRL_H, p, false, 1, { x: hold2.x, y: hold2.y }, 1);
      girl(k, gx, gy, GIRL_H, p, { t, underwater: true, fins: true, glint: 'spark', col: SIL });
      girlRim(k, gx, gy, GIRL_H, p, RIM, { arm: false });
      slateBoard(k, 1010, 640, 1.0, 0, { sx: sxk, pencil: 'hang', draw: (kk) => { this.slateWriting(kk, t); } });
      void u;
    });
  }

  // ---------------------------------------------------------------- D: what are you saying about me?

  shotD(c: C2, g: C2, t: number, rack: number, heartOn: number) {
    const w = this.w, u = GIRL_H / 100;
    const asked = t >= w.what!.start, me = t >= w.me!.start;
    // Rai asks us: soft, a shrug with an open palm; on "me?" her hand to her chest and her heart lights pink
    const raiBlur = 7 * rack, pb = clamp((t - w.me!.start) / (this.ctx.end - w.me!.start));
    focus(c, this.bg2, raiBlur, (k) => {
      if (k !== c) k.setTransform(scaleBy(c.getTransform(), 0.5));
      drawRai(k, RAI.x, RAI.y, RAI.R, {
        t, glow: me ? HEX.pink : '#ffcf8a', glowStrength: 0.35 + 0.4 * heartOn,
        face: me ? (t > w.me!.start + 0.35 ? 'smile' : 'soft') : 'soft', look: 0, noBlink: t < w.saying!.start,
        arms: me ? ['shrug', 'hold'] : asked ? ['shrug', 'shrug'] : ['down', 'down'], armsFrom: me ? ['shrug', 'shrug'] : ['down', 'down'],
        armsU: me ? clamp((t - w.me!.start) / 0.25) : clamp((t - this.cut.D - 0.2) / 0.35),
        tilt: -0.05 * ease.inOutCubic(clamp((t - w.saying!.start) / 0.5)) + (me ? 0.05 : 0), blush: 0.4 + 0.5 * heartOn,
        heart: heartOn, heartColor: HEX.pink, marks: heartOn > 0.5 ? ['sparkle'] : [], markT0: w.me!.start + 0.2,
      });
    });
    // the girl with the slate up, facing us: the "?" rubbed out, a heart drawn in its place (soft until "saying")
    focus(c, this.fg2, 7 * (1 - rack) * (1 - pb), (k) => {
      if (k !== c) k.setTransform(scaleBy(c.getTransform(), 0.5));
      const gx = 862, gy = SET.floor + 5;
      let p = kneelDraw(t);
      const sx = 1010, sy = 615, ss = 0.92, rot = 0.05;
      const m = slateBoard(NULLC, sx, sy, ss, rot, {});
      const st = { ...sketch(NULLC, [...this.draw, ...this.qStrokes, ...this.heartStroke], t, () => {}) };
      const rubbing = t >= w.saying!.start - 0.1 && t < w.about!.start - 0.12;
      let tipP: DOMPoint | null = null, grip: P;
      const pAng = 2.25 + (st.drawing ? 0.15 * Math.sin(t * 10) : 0);
      if (rubbing) { // the rubber end of the pencil, scrubbing in small circles over the "?"
        const a = (t - w.saying!.start) * 26, q = m.transformPoint(new DOMPoint(Math.cos(a) * 18, 100 + Math.sin(a) * 12));
        grip = { x: q.x + Math.cos(pAng) * 34 * ss, y: q.y + Math.sin(pAng) * 34 * ss };
        tipP = q;
      } else {
        tipP = m.transformPoint(new DOMPoint(st.x, st.y));
        grip = { x: tipP.x + Math.cos(pAng) * 52 * ss, y: tipP.y + Math.sin(pAng) * 52 * ss };
      }
      const done = this.heartStroke[0]!.t1, away = ease.inOutCubic(clamp((t - done - 0.02) / 0.3));
      const edge = m.transformPoint(new DOMPoint(112, 40));
      grip = { x: lerp(grip.x, edge.x + 4, away), y: lerp(grip.y, edge.y, away) };
      const hold = m.transformPoint(new DOMPoint(-100, 110));
      p = reachArm(gx, gy, GIRL_H, p, false, 0, { x: hold.x, y: hold.y }, 1);
      p = reachArm(gx, gy, GIRL_H, p, false, 1, grip, 1);
      girl(k, gx, gy, GIRL_H, p, { t, underwater: true, fins: true, glint: me ? 'spark' : 'plain', col: SIL });
      girlRim(k, gx, gy, GIRL_H, p, me ? rgbaHex(HEX.pink, 0.85) : RIM, { arm: false });
      slateBoard(k, sx, sy, ss, rot, { pencil: away > 0.5 ? 'hang' : 'none', draw: (kk) => { this.slateWriting(kk, t); } });
      frontForearm(k, gx, gy, GIRL_H, p, SIL);
      if (away > 0.5) childHand(k, grip.x, grip.y, -2.6, u, SIL, { spread: 0.15, curl: 0.4, rim: RIM });
      else {
        childHand(k, grip.x, grip.y, pAng + Math.PI * 0.95, u, SIL, { spread: 0.12, curl: 0.6, rim: RIM });
        if (rubbing) handPencil(k, tipP.x + Math.cos(pAng) * 80 * ss, tipP.y + Math.sin(pAng) * 80 * ss, pAng + Math.PI, 74 * ss, 9 * ss);
        else handPencil(k, tipP.x, tipP.y, pAng, 74 * ss, 9 * ss);
      }
    });
    void g;
  }
}

/** The back of her head close to the lens: hair, the mask's strap, the snorkel, the ponytail floating up. */
function backOfHead(c: C2, x: number, y: number, r: number, tau: number) {
  c.save(); c.fillStyle = SIL; c.strokeStyle = SIL; c.lineCap = 'round';
  c.lineWidth = r * 0.42; c.beginPath(); c.moveTo(x - r * 0.5, y - r * 0.6);
  c.quadraticCurveTo(x - r * 1.0 + 20 * Math.sin(tau * 2.2), y - r * 1.4, x - r * 0.7 + 40 * Math.sin(tau * 2), y - r * 2.1); c.stroke();   // the ponytail, floating
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(x + r * 0.2, y + r * 1.1, r * 1.3, r * 0.7, 0, 0, Math.PI * 2); c.fill();   // her shoulders
  c.strokeStyle = HEX.coral; c.lineWidth = r * 0.12; c.beginPath(); c.arc(x, y + r * 0.05, r * 0.98, -0.5, 0.65); c.stroke();   // the strap
  c.lineWidth = r * 0.1; c.beginPath(); c.moveTo(x + r * 0.55, y - r * 0.2); c.lineTo(x + r * 0.7, y - r * 1.25); c.stroke();      // the snorkel
  c.strokeStyle = RIM; c.lineWidth = r * 0.04; c.globalAlpha = 0.7; c.beginPath(); c.arc(x, y, r * 0.99, -0.9, 0.2); c.stroke();
  c.restore();
}
/** A forearm in silhouette from a (off frame) to a hand at b, tapering, with a warm rim on its underside. */
function arm(c: C2, a: P, b: P, u: number, col: string) {
  const ang = Math.atan2(b.y - a.y, b.x - a.x), n = { x: -Math.sin(ang), y: Math.cos(ang) }, w0 = 5 * u, w1 = 2.9 * u;
  c.save(); c.fillStyle = col;
  c.beginPath(); c.moveTo(a.x + n.x * w0, a.y + n.y * w0); c.lineTo(b.x + n.x * w1, b.y + n.y * w1); c.lineTo(b.x - n.x * w1, b.y - n.y * w1); c.lineTo(a.x - n.x * w0, a.y - n.y * w0); c.closePath(); c.fill();
  c.beginPath(); c.arc(b.x, b.y, w1, 0, Math.PI * 2); c.fill();
  const sgn = n.y > 0 ? 1 : -1;
  c.strokeStyle = RIM; c.lineWidth = 0.9 * u; c.globalAlpha = 0.6; c.lineCap = 'round';
  c.beginPath(); c.moveTo(a.x + n.x * sgn * w0 * 0.9, a.y + n.y * sgn * w0 * 0.9); c.lineTo(b.x + n.x * sgn * w1 * 0.9, b.y + n.y * sgn * w1 * 0.9); c.stroke();
  c.restore();
}
/** Her near forearm again, over a prop she holds (the kit draws all her limbs in one call). */
function frontForearm(c: C2, x: number, y: number, h: number, p: GirlPose, col: string) {
  const fr = girlFrame(x, y, h, p), u = fr.u;
  const el = { x: fr.shoulder.x + fr.dir(p.sh[1]).x * 16 * u, y: fr.shoulder.y + fr.dir(p.sh[1]).y * 16 * u };
  const d = fr.dir(p.sh[1] + p.el[1]), hd = { x: el.x + d.x * 15 * u, y: el.y + d.y * 15 * u };
  c.save(); c.strokeStyle = col; c.lineCap = 'round'; c.lineWidth = 5.5 * u;
  c.beginPath(); c.moveTo(el.x, el.y); c.lineTo(hd.x, hd.y); c.stroke(); c.restore();
}
/** A matrix scaled for an offscreen layer at fraction k of the frame. */
function scaleBy(m: DOMMatrix, k: number): DOMMatrix {
  return new DOMMatrix([m.a * k, m.b * k, m.c * k, m.d * k, m.e * k, m.f * k]);
}
/** A context that draws nothing (to ask the slate for its matrix, or a sketch for its tip). */
const NULLC: C2 = (() => { const cv = document.createElement('canvas'); cv.width = 2; cv.height = 2; return cv.getContext('2d')!; })();
