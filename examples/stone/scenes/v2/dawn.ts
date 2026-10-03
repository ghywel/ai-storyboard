// v2 DAWN (158.08-188.93), the final chorus: the loudest moment of the take and of the film (TREATMENT-v2.md).
// One sunrise through the whole plate: the sun is under the horizon at the breach and comes up on the last line,
// exactly through the hole in Rai's heart. Shots cut on the beat at or before their words:
//   breach  the hit: a split-level shot at the waterline, the dark water below (nightdive's lift, continued) and the
//           dawn above; Rai bursts up through the surface on the downbeat, water sheeting off, the canoes either side
//           holding her pole, the village tiny and cheering on the far beach. A flash, a shake and a colour kick.
//   bay     "stone at the bottom of the": from the beach, the crowd backlit in the foreground, the mother with her night
//           lantern still burning; Rai held up on the pole between the canoes out in the bay.
//   fish    "sea,": a fish that rode up in her heart wriggles out; chibi Rai waves it goodbye.
//   march   "and I'm worth what you say": the procession up the beach (a tracking shot), the girl riding on top waving,
//           Rai pointing ahead, fierce.
//   point   "so say it for her, and for me": the hut with the lit window (the lamp burned all night), the mother on the
//           porch; Rai points at her, then a hand on her own heart; the girl jumps down.
//   slate   "count the nights, count the meals, count the care": the slate in close-up, a row lighting on each count
//           (NIGHTS 2,920 / MEALS 8,760 / CARE infinity, her arithmetic for eight years); chibi Rai counts along.
//   scrib   "or don't count": she scribbles the numbers out and draws one big heart.
//   nod     "but agree that it's real, 'cause that's what money's about": a tracking shot along the village, one head
//           after another nodding; at the end of the beach the island's stone bank, its stones' hearts lighting.
//   toss    "I'm the stone": flowers thrown, a lei lands on her.
//   mum     "at the bottom of the sea": the mother covers her face (a tear), then laughs; Rai blubbers.
//   hands   "you lifted me up": hands laid on the stone one by one, light running round her rim.
//   ring    "with a word you agreed": from above, the ring of the village round the ring of stone; her rim lights.
//   raise   "so choose what you honour": the mother holds the slate up high from the porch.
//   cheer   "and honour it loud": the whole beach, the cheer (a punch, a colour kick).
//   sun     "I'm the stone at the bottom of the sea." (held): the horizon at her heart; the sun's first limb in her hole.
//   lock    the sun sits exactly in the hole, a ring of gold; the girl and her mother hug in silhouette; Rai love.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../../engine/scene';
import { Layer2D, W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import type { Line, Word } from '../../engine/lyrics';
import { clamp, ease, lerp } from '../../engine/util';
import { drawRai, h01, type Face, type ArmPose } from '../_rai';
import { FAM, TAU, rgbaHex, mixHex } from '../_motifs';
import { palmTree, hut, stoneBank, fish, fishSchool } from '../_world';
import { focusLines, poof, speedLines } from '../_manga';
import { mergePost, punch, hitShake, caKick } from '../_post';
import { girl, mother, slate, bubbleLyric, currentLine, withCam2, type GirlPose } from './_diver';
import {
  dawnSky, dawnClouds, dawnSea, dawnSand, sunDisc, homeHut, bankStones, stoneHeart, seaCanoe, pole, folk, breachSplash,
  sheeting, flowerToss, lensPetals, lei, slateNight, slatePencilTip, reachArm, rimRipple, flare, flower, shade,
  shawlTrim, plaitOver, palmsOnFace, fadeGlowBand, underRays, type P,
} from './dawn-world';

type C2 = CanvasRenderingContext2D;
const PI = Math.PI;
const RIM = 'rgba(255,206,122,0.95)';
const SIL = '#1c1026';           // the silhouettes against the dawn
const GOLD = HEX.gold;

/** The girl's own poses for this plate (GirlPose: angles from "down", + forward). */
const JUMP: GirlPose = { rot: 0.25, hip: [1.3, 1.6], knee: [-1.9, -1.7], sh: [2.6, 2.9], el: [0.2, 0.3] };
const HUG: GirlPose = { rot: 0.08, hip: [-0.06, 0.08], knee: [0, -0.1], sh: [1.55, 1.75], el: [0.9, 1.1], head: -0.2 };
const RIDE = (t: number): GirlPose => ({ rot: 0.05 * Math.sin(t * 2), hip: [PI / 2 - 0.1, PI / 2], knee: [-1.3, -1.2], sh: [0.4, 2.5 + 0.2 * Math.sin(t * 6)], el: [0.3, 0.4], drop: 24 });

export default class Dawn extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  lines: Line[] = [];
  prev: Line | null = null;
  cuts: [string, number][] = [];
  w: Record<string, Word> = {};

  override init() {
    const { lyrics, audio: au, start } = this.ctx;
    const end = this.ctx.end;
    this.lines = lyrics.lines.filter((l) => l.words[0]!.start >= start - 0.1 && l.words[0]!.start < end);
    this.prev = lyrics.lines[this.lines[0]!.i - 1] ?? null;   // "lift it, lift it, bring it home." still ringing at the cut
    const L = this.lines;
    const bf = (s: number) => au.timeOfBeat(Math.floor(au.beatAt(s + 0.02)));
    const w = (li: number, re: RegExp, nth = 0) => L[li]?.words.filter((x) => re.test(x.w.toLowerCase()))[nth] ?? L[Math.min(li, L.length - 1)]!.words[0]!;
    this.w = {
      im0: L[0]!.words[0]!, stone0: w(0, /stone/), sea0: w(0, /sea/),
      and1: L[1]!.words[0]!, worth: w(1, /worth/), her: w(1, /^her/), and1b: w(1, /^and/, 1), me1: w(1, /^me/),
      c1: w(2, /^count/, 0), c2: w(2, /^count/, 1), c3: w(2, /^count/, 2), care: w(2, /care/), or: w(2, /^or/), c4: w(2, /^count/, 3),
      agree: w(3, /agree/), real: w(3, /real/), cause: w(3, /cause/), thats: w(3, /^that/), what: w(3, /^what/), money: w(3, /money/), about: w(3, /about/),
      im4: L[4]!.words[0]!, stone4: w(4, /stone/), bottom4: w(4, /bottom/), sea4: w(4, /sea/),
      you5: L[5]!.words[0]!, lifted: w(5, /lifted/), me5: w(5, /^me/), up: w(5, /^up/), with: w(5, /^with/), word: w(5, /^word/), agreed: w(5, /agreed/),
      so: L[6]!.words[0]!, choose: w(6, /choose/), honour2: w(6, /honour/, 1), loud: w(6, /loud/),
      im7: L[7]!.words[0]!, stone7: w(7, /stone/), at7: w(7, /^at/), sea7: w(7, /sea/),
    };
    const s = (id: string) => this.w[id]!.start;
    this.cuts = [
      ['breach', start], ['bay', bf(s('stone0'))], ['fish', bf(s('sea0'))], ['march', bf(s('and1'))],
      ['point', bf(s('her'))], ['slate', bf(s('c1'))], ['scrib', bf(s('care'))], ['nod', bf(s('agree'))],
      ['toss', bf(s('im4'))], ['mum', bf(s('bottom4'))], ['hands', bf(s('you5'))], ['ring', bf(s('word'))],
      ['raise', bf(s('so'))], ['cheer', bf(s('honour2'))], ['sun', bf(s('im7'))], ['lock', bf(s('at7'))],
    ];
  }

  /** The dawn's progress through the plate, 0..1 (brighter, warmer). */
  k(t: number) { return clamp((t - this.ctx.start) / (this.ctx.end - this.ctx.start)); }
  ws(id: string) { return this.w[id]!.start; }
  cut(id: string) { return this.cuts.find((c) => c[0] === id)![1]; }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t;
    this.L.clear(HEX.ink); this.G.clear();
    let i = 0;
    for (let j = 0; j < this.cuts.length; j++) if (t >= this.cuts[j]![1]) i = j;
    const [id, t0] = this.cuts[i]!, lt = t - t0;
    const shots: Record<string, () => PostOverrides> = {
      breach: () => this.breach(c, g, t, lt), bay: () => this.bay(c, g, t, lt), fish: () => this.fishGag(c, g, t, lt),
      march: () => this.march(c, g, t, lt), point: () => this.point(c, g, t, lt), slate: () => this.slateShot(c, g, t, lt, false),
      scrib: () => this.slateShot(c, g, t, lt, true), nod: () => this.nod(c, g, t, lt), toss: () => this.toss(c, g, t, lt),
      mum: () => this.mum(c, g, t, lt), hands: () => this.hands(c, g, t, lt), ring: () => this.ring(c, g, t, lt),
      raise: () => this.raise(c, g, t, lt), cheer: () => this.cheer(c, g, t, lt), sun: () => this.sunrise(c, g, t, lt, false),
      lock: () => this.sunrise(c, g, t, lt, true),
    };
    const post = mergePost({ bloom: 0.75, vignette: 0.3 }, shots[id]!());
    // the lyric: the last of "bring it home." hands over to the gold chorus at the breach
    if (this.prev && t < this.ws('im0') - 0.1) bubbleLyric(c, this.prev, t, { until: this.ctx.start, band: false });
    const line = currentLine(this.lines, t);
    if (line && (line !== this.lines[0] || t >= this.ws('im0') - 0.14)) bubbleLyric(c, line, t, { sung: GOLD });
    fadeGlowBand(g);
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    return mergePost(post, { zoom: 1 + 0.006 * f.a.kick });
  }

  // ---------------------------------------------------------------- 1 the breach

  breach(c: C2, g: C2, t: number, lt: number): PostOverrides {
    const k = this.k(t), WL = H * 0.64, HZ = WL - 16, R = 118, x = W * 0.5, age = lt;
    // her rise: out of the dark water, an overshoot, then hanging from the pole the canoes hold up
    const yA = WL + 0.95 * R, yB = WL - 1.62 * R, yC = WL - 1.2 * R;
    const y = age < 0.3 ? lerp(yA, yB, ease.outCubic(age / 0.3)) : lerp(yB, yC, ease.outBack(clamp((age - 0.3) / 0.5), 2.2)) + 5 * Math.sin(t * 3);
    const stretch = age < 0.3 ? 0.55 * (1 - age / 0.3) : age < 0.55 ? -0.3 * Math.sin(((age - 0.3) / 0.25) * PI) : 0;
    const camY = lerp(70, -40, ease.inOutCubic(clamp(age / 1.1)));
    const sunX = W * 0.8;
    withCam2(c, g, { y: camY, zoom: lerp(1.06, 1.0, ease.outCubic(clamp(age / 1.2))) }, () => {
      // above: the dawn along the coast, the open sea glowing gold on the right, the far beach on the left
      dawnSky(c, g, { hz: HZ, sunX, k, look: 'sea' });
      dawnClouds(c, { hz: HZ, sunX, k, t, look: 'sea', seed: 3 });
      c.fillStyle = mixHex('#e0708e', '#ffb070', 0.4); c.fillRect(-W, HZ, W * 3, WL - HZ + 2);
      this.farShore(c, t, HZ, 0, W * 0.46);
      const hy = y + 0.12 * R;
      // the canoes either side, their divers holding the pole's ends (hauling while she is still under)
      const cx0 = x - 470, cx1 = x + 470, lift = clamp((age - 0.12) / 0.4);
      for (const [cx, fl] of [[cx0, false], [cx1, true]] as const) seaCanoe(c, g, cx, WL + 6, 420, { dark: 0.72, flip: fl, lantern: 0.7, t });
      const diver = (cx: number, side: number, j: number): P => {
        const fx = cx + side * (40 + 110 * j), h = 200 - 12 * j, u = h / 100, root = WL - 6 - 74 * u;
        const dy = clamp((hy - root) / u, -34, 30);
        folk(c, fx, WL - 6, h, { t, seed: 40 + j + side * 3, arms: [{ x: -8, y: dy + 3 }, { x: 10, y: dy }], rim: RIM, rimSide: 1, col: SIL, flip: side < 0, hop: lift > 0.9 ? 4 * Math.abs(Math.sin(t * 6 + j)) : 0 });
        return { x: fx + side * 10 * u, y: root + dy * u };
      };
      const aL = diver(cx0, 1, 1), aR = diver(cx1, -1, 1);
      diver(cx0, 1, 0); diver(cx1, -1, 0);
      pole(c, aL.x - 50, aL.y, x, hy, 0, 14, 0.2); pole(c, x, hy, aR.x + 50, aR.y, 0, 14, 0.2);
      // the girl at the left canoe's bow, cheering (still in her swimsuit, the mask pushed up)
      girl(c, cx0 + 120, WL - 4, 175, 'cheer', { t, mask: 'up', outfit: 'swim', pendant: true, slate: true, rim: RIM, glint: 'spark' });
      folk(c, cx1 - 160, WL - 4, 190, { t, seed: 61, arms: 'cheer', rim: RIM, col: SIL, flip: true });
      drawRai(c, x, y, R, {
        t, face: age < 0.22 ? 'wow' : 'joy', arms: age < 0.22 ? ['up', 'up'] : ['up', 'wave'], armsFrom: ['down', 'down'], armsU: clamp(age / 0.15),
        squash: stretch, glow: '#ffd27a', glowStrength: 0.9, marks: age > 0.35 ? ['sparkle'] : [], markT0: t - lt + 0.35,
      });
      sheeting(c, x, y, R, age, t);
      // the water: everything under the surface tinted deep; dawn light slanting down into it
      const surf = (xx: number) => WL + 5 * Math.sin(xx * 0.012 + t * 3) + 3 * Math.sin(xx * 0.04 - t * 5);
      const wg = c.createLinearGradient(0, WL, 0, H + 120);
      wg.addColorStop(0, 'rgba(30,64,118,0.6)'); wg.addColorStop(0.45, 'rgba(10,22,60,0.86)'); wg.addColorStop(1, 'rgba(4,8,26,0.96)');
      c.fillStyle = wg;
      c.beginPath(); c.moveTo(-W, H * 2);
      for (let xx = -W; xx <= W * 2; xx += 30) c.lineTo(xx, surf(xx));
      c.lineTo(W * 2, H * 2); c.closePath(); c.fill();
      underRays(c, WL, t, 1);
      c.strokeStyle = 'rgba(200,240,255,0.7)'; c.lineWidth = 2;
      for (let i = 0; i < 46; i++) {
        const bx = x + (h01(i, 5) - 0.5) * 360 + 18 * Math.sin(t * 4 + i), by = H + 80 - ((h01(i, 6) * 520 + age * (700 + 500 * h01(i, 7))) % 560);
        if (by < WL + 8) continue;
        c.beginPath(); c.arc(bx, by, 4 + 12 * h01(i, 8), 0, TAU); c.stroke();
      }
      c.save(); c.globalAlpha = 0.8; fishSchool(c, t + age * 3, WL + 210, 0.8, 7, 9, HEX.orange, -age * 900, 0.8); c.restore();
      c.strokeStyle = 'rgba(255,236,214,0.9)'; c.lineWidth = 3;
      c.beginPath();
      for (let xx = -W; xx <= W * 2; xx += 24) xx === -W ? c.moveTo(xx, surf(xx)) : c.lineTo(xx, surf(xx));
      c.stroke();
      breachSplash(c, g, x, WL, R, age, t);
      if (age < 0.47) { const ba = age < 0.06 ? age / 0.06 : 1 - (age - 0.06) / 0.41; const bl = g.createRadialGradient(x, WL - R, 0, x, WL - R, 520); bl.addColorStop(0, rgbaHex('#fff0c0', 0.3 * ba)); bl.addColorStop(1, rgbaHex('#ffd27a', 0)); g.fillStyle = bl; g.fillRect(x - 520, WL - R - 520, 1040, 1040); }
    });
    const t0 = this.ctx.start;
    return mergePost(
      { flash: age > 0.016 && age < 0.07 ? 0.25 * (1 - (age - 0.016) / 0.054) : 0 },
      hitShake(t, [t0], 8, 0.5), caKick(t, [t0], 6, 0.4), punch(t, [t0], 0.04, 0.45), punch(t, [this.ws('im0')], 0.015, 0.3),
    );
  }

  /** The far beach seen low across the water: palms, huts, the village tiny and cheering, from x0 to x1. */
  farShore(c: C2, t: number, hz: number, x0: number, x1: number) {
    c.fillStyle = shade('#a07890', 0.82);
    c.beginPath(); c.moveTo(x0 - 60, hz + 4);
    c.quadraticCurveTo(x0 + (x1 - x0) * 0.3, hz - 26, x0 + (x1 - x0) * 0.7, hz - 14); c.quadraticCurveTo(x1, hz - 6, x1 + 80, hz + 4); c.closePath(); c.fill();
    for (let i = 0; i < 7; i++) palmTree(c, x0 + (x1 - x0) * (0.05 + 0.13 * i) + 20 * h01(i, 3), hz - 8, 90 + 40 * h01(i, 4), (h01(i, 5) - 0.5) * 0.5, t, i, 0.95);
    for (let i = 0; i < 3; i++) hut(c, x0 + (x1 - x0) * (0.18 + 0.27 * i), hz - 10, 54, i === 1, 0.85);
    for (let i = 0; i < 26; i++) {
      const px = x0 + (x1 - x0) * (0.04 + 0.92 * h01(i, 11)), ph = 26 + 10 * h01(i, 12);
      folk(c, px, hz - 2, ph, { t, seed: i, arms: i % 3 ? 'cheer' : 'wave', col: '#2a1a34', acc: false, hop: 3 * Math.abs(Math.sin(t * 6 + i)) });
    }
  }

  // ---------------------------------------------------------------- 2 the bay, from the beach

  bay(c: C2, g: C2, t: number, lt: number): PostOverrides {
    const k = this.k(t), HZ = H * 0.46, sunX = W * 0.6, shore = H * 0.8;
    withCam2(c, g, { zoom: lerp(1.08, 1.0, ease.outCubic(clamp(lt / 1.6))), y: -10 }, () => {
      dawnSky(c, g, { hz: HZ, sunX, k, look: 'sea' });
      dawnClouds(c, { hz: HZ, sunX, k, t, look: 'sea', seed: 7 });
      dawnSea(c, g, { hz: HZ, y1: shore, sunX, k, t });
      // the ring of canoes in the bay, lanterns paling in the dawn
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * TAU + 0.4, cx = W * 0.5 + Math.cos(a) * 420, cy = HZ + 110 + Math.sin(a) * 50;
        if (Math.abs(cx - W * 0.5) < 160 && cy > HZ + 120) continue;
        seaCanoe(c, g, cx, cy, 120 + 30 * Math.sin(a), { dark: 0.75, flip: i % 2 === 0, lantern: 0.5, t });
        for (let j = 0; j < 2; j++) folk(c, cx + (j - 0.5) * 34, cy - 4, 46, { t, seed: 70 + i * 2 + j, arms: j ? 'cheer' : 'wave', col: SIL, acc: false });
      }
      // the lifting canoes and Rai on the pole between them
      const rx = W * 0.5, R = 58, ry = HZ + 70 + 3 * Math.sin(t * 3), hyy = ry + 0.12 * R;
      for (const s of [-1, 1]) {
        seaCanoe(c, g, rx + s * 200, HZ + 160, 180, { dark: 0.7, flip: s > 0, lantern: 0.6, t });
        for (let j = 0; j < 2; j++) folk(c, rx + s * (120 + 60 * j), HZ + 156, 100, { t, seed: 80 + j + s, arms: 'carry', col: SIL, rim: RIM, rimSide: 1, flip: s > 0 });
      }
      pole(c, rx - 200, hyy, rx + 200, hyy, 0, 8, 0.3);
      drawRai(c, rx, ry, R, { t, face: 'joy', arms: ['up', 'up'], glow: '#ffd27a', glowStrength: 1.2, marks: ['sparkle'], markT0: this.cut('bay') + 0.1 });
      for (let i = 0; i < 24; i++) { const u = ((lt * 0.9 + h01(i, 3)) % 1), px = rx + (h01(i, 4) - 0.5) * 160, py = ry - 40 + u * 140; c.fillStyle = rgbaHex('#ffe6b0', 0.8 * (1 - u)); c.beginPath(); c.arc(px, py, 2.5, 0, TAU); c.fill(); }
      // the beach, and the village on it, backlit, cheering, jumping
      dawnSand(c, { y0: shore, k, t, look: 'sea' });
      for (let i = 0; i < 16; i++) {
        const px = W * (-0.04 + 1.08 * (i / 15)) + 30 * (h01(i, 21) - 0.5), depth = h01(i, 22);
        if (px > W * 0.18 && px < W * 0.36) continue;   // room for the mother
        folk(c, px, H * (0.98 + 0.12 * depth), 400 + 160 * depth, { t, seed: 100 + i, arms: i % 4 === 0 ? 'wave' : 'cheer', col: SIL, rim: RIM, rimSide: px < sunX ? 1 : -1, hop: 10 * Math.abs(Math.sin(t * 6.5 + i * 1.3)), garland: i % 3 === 1 });
      }
      // the mother at the water's edge, her back to us, her lantern from the night still lit and held up high
      const mx = W * 0.27, my = H * 1.04, mh = 560, u = mh / 100;
      mother(c, mx, my, mh, 'wave', { t, col: SIL, rim: RIM, shawl: '#4a2a5a' });
      shawlTrim(c, mx, my, mh, 'wave'); plaitOver(c, mx, my, mh, t, '#24142c');
      const hx = mx + 20 * u + Math.sin(t * 8) * 6 * u, hy = my - 100 * u, ly = hy + 13 * u + Math.sin(t * 8 + 1) * u;
      c.strokeStyle = '#3a2a20'; c.lineWidth = 0.8 * u; c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx, ly - 7 * u); c.stroke();
      c.fillStyle = HEX.orange; c.beginPath(); c.ellipse(hx, ly, 5.5 * u, 7 * u, 0, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,240,200,0.9)'; c.beginPath(); c.ellipse(hx, ly, 2.8 * u, 4.5 * u, 0, 0, TAU); c.fill();
      const lg = g.createRadialGradient(hx, ly, 0, hx, ly, 18 * u); lg.addColorStop(0, rgbaHex('#ffb050', 0.55)); lg.addColorStop(1, rgbaHex('#ffb050', 0)); g.fillStyle = lg; g.fillRect(hx - 18 * u, ly - 18 * u, 36 * u, 36 * u);
    });
    return punch(t, [this.cut('bay')], 0.02, 0.3);
  }

  // ---------------------------------------------------------------- 2b "sea,": the fish that rode up in her heart

  fishGag(c: C2, g: C2, t: number, lt: number): PostOverrides {
    const k = this.k(t), HZ = H * 0.66, sunX = W * 0.66, sea = this.ws('sea0'), sdOn = t >= sea && t < sea + 0.5;
    const R = 175, x = W * 0.46, y = H * 0.4 + 4 * Math.sin(t * 3), hy = y + 0.12 * R;
    withCam2(c, g, { zoom: lerp(1.0, 1.05, lt / 1.0) }, () => {
      dawnSky(c, g, { hz: HZ, sunX, k, look: 'sea' });
      dawnClouds(c, { hz: HZ, sunX, k, t, look: 'sea', seed: 11, n: 5 });
      dawnSea(c, g, { hz: HZ, y1: H * 1.3, sunX, k, t });
      pole(c, -200, hy, W + 200, hy, 0, 22, 0.2);
      if (!sdOn) {
        // before: the fish's tail flapping out of her heart; after: she waves it off
        drawRai(c, x, y, R, { t, face: t < sea ? 'joy' : 'cheeky', arms: t < sea ? ['up', 'up'] : ['down', 'wave'], glow: '#ffd27a', glowStrength: 1, noBlink: true });
        if (t < sea) { c.save(); c.translate(x + 26, hy); c.rotate(0.35 * Math.sin(t * 22)); fish(c, 0, 0, 24, HEX.orange, 1, t); c.restore(); }
      } else {
        const Rc = R * 0.8;
        drawRai(c, x, hy - 0.6 * Rc, Rc, { t, face: 'cheeky', sd: true, arms: ['down', 'wave'], glow: '#ffd27a', marks: ['shine'], markT0: sea + 0.1 });
      }
      poof(c, x, y - R * 0.4, R * 1.4, t, sea); poof(c, x, y - R * 0.4, R * 1.4, t, sea + 0.5);
      // the fish leaps out of the hole and back into the sea
      const fu = (t - sea) / 0.6;
      if (fu >= 0 && fu <= 1) {
        const fx = x + fu * 560, fy = hy - 300 * 4 * fu * (1 - fu) + fu * 300;
        c.save(); c.translate(fx, fy); c.rotate(-1.2 + 2.4 * fu); fish(c, 0, 0, 34, HEX.orange, 1, t); c.restore();
        for (let i = 0; i < 6; i++) { c.fillStyle = 'rgba(230,246,255,0.8)'; c.beginPath(); c.arc(fx - 30 - i * 14, fy + Math.sin(i) * 10, 4 - i * 0.5, 0, TAU); c.fill(); }
      }
      if (fu > 1 && fu < 1.8) { const sx = x + 560, sy = hy + 300, v = fu - 1; c.strokeStyle = rgbaHex('#ffffff', 0.8 * (1 - v / 0.8)); c.lineWidth = 3; c.beginPath(); c.ellipse(sx, sy + 10, 30 + v * 90, 6 + v * 14, 0, 0, TAU); c.stroke(); }
    });
    return punch(t, [sea], 0.025, 0.25);
  }

  // ---------------------------------------------------------------- 3 the procession up the beach

  march(c: C2, g: C2, t: number, lt: number): PostOverrides {
    const k = this.k(t), HZ = H * 0.44, pan = lt * 170, ground = H * 0.88, sunX = -W * 0.15;
    dawnSky(c, g, { hz: HZ, sunX, k, look: 'sea' });
    dawnClouds(c, { hz: HZ, sunX: W * 0.1, k, t, look: 'sea', seed: 5, pan });
    dawnSea(c, g, { hz: HZ, y1: H * 0.55, sunX: W * 0.05, k, t, pan, glitter: 0.6 });
    // the far beach: palms and huts drifting by slowly, the island's stone bank among them
    c.save(); c.translate(-pan * 0.25, 0);
    c.fillStyle = mixHex('#c88a8a', '#e6a88e', k); c.fillRect(-W, H * 0.545, W * 4, H);
    for (let i = 0; i < 9; i++) palmTree(c, 120 + i * 300 + 60 * h01(i, 3), H * 0.58, 200 + 80 * h01(i, 4), (h01(i, 5) - 0.6) * 0.4, t, i, 0.55);
    for (let i = 0; i < 3; i++) hut(c, 380 + i * 760, H * 0.6, 120, i === 2, 0.45);
    stoneBank(c, 1180, H * 0.62, 0.5, 0.4, 2);
    c.restore();
    dawnSand(c, { y0: H * 0.6, k, t, pan: pan * 0.6, look: 'sea', prints: true });
    // the crowd behind the pole (smaller, further)
    for (let i = 0; i < 7; i++) {
      const px = ((i * 290 + 40 * h01(i, 1) - lt * 40) % (W + 300) + W + 300) % (W + 300) - 150;
      folk(c, px, ground - 70, 230, { t, seed: 200 + i, walk: t * 7 + i, arms: i % 3 === 0 ? 'cheer' : i % 3 === 1 ? 'wave' : 'clap', col: mixHex(SIL, '#5a3a5a', 0.25), rim: RIM, rimSide: -1, garland: i % 2 === 0 });
    }
    // the bearers and Rai on the pole, walking right; the girl rides on top
    const R = 112, x = W * 0.47, bob = 5 * Math.abs(Math.sin(t * 7)), poleY = ground - 0.74 * 290 - bob, y = poleY - 0.12 * R;
    pole(c, x - 520, poleY - 4, x + 520, poleY + 2, 0, 15, 0.15);
    [-430, -310, -190, 190, 310, 430].forEach((dx, j) => folk(c, x + dx, ground, 290, { t, seed: 300 + j, walk: t * 7 + j * 1.3, arms: 'carry', col: SIL, rim: RIM, rimSide: -1, garland: j % 2 === 1 }));
    const worth = this.ws('worth');
    const a = drawRai(c, x, y, R, {
      t, face: t < worth - 0.05 ? 'grin' : 'fierce', arms: ['fist', 'point'], armsFrom: ['up', 'up'], armsU: clamp((t - worth + 0.25) / 0.2),
      glow: '#ffd27a', glowStrength: 0.8, marks: t > worth ? ['shine'] : [], markT0: worth, tilt: -0.04, noBlink: true,
    });
    if (t > worth && t < worth + 0.45) speedLines(c, 0, 'rgba(255,240,210,0.55)', t, { n: 14, band: [y - 120, y + 40], alpha: 0.6 * (1 - (t - worth) / 0.45) });
    girl(c, x - 6, a.head.y - a.head.r * 0.85 + 13 * 2, 200, 'ride', { t, mask: 'up', outfit: 'tee', pendant: true, slate: true, rim: RIM });
    // the crowd in front (bigger, darker), throwing petals; a child running ahead
    for (let i = 0; i < 4; i++) {
      const px = ((i * 520 + 130 - lt * 120) % (W + 600) + W + 600) % (W + 600) - 300;
      folk(c, px, H * 1.18, 520, { t, seed: 400 + i, walk: t * 6 + i * 2, arms: i % 2 ? 'cheer' : 'throw', swing: (t * 1.4 + i * 0.3) % 1, col: '#120a18', rim: RIM, rimSide: -1 });
    }
    folk(c, W * 0.9 + lt * 60, ground + 14, 170, { t, seed: 77, walk: t * 11, arms: 'cheer', col: SIL, rim: RIM, rimSide: -1 });
    lensPetals(c, t, { n: 5, seed: 3, a: 0.6, size: 46, wind: -1 });
    return punch(t, [worth], 0.02, 0.3);
  }

  // ---------------------------------------------------------------- 4 "for her, and for me"

  point(c: C2, g: C2, t: number, lt: number): PostOverrides {
    const k = this.k(t), HZ = H * 0.6, ground = H * 0.82, her = this.ws('her'), me = this.ws('me1'), andB = this.ws('and1b');
    withCam2(c, g, { zoom: lerp(1.0, 1.05, clamp(lt / 1.3)), x: lerp(0, 30, clamp(lt / 1.3)) }, () => {
      dawnSky(c, g, { hz: HZ, sunX: W * 0.2, k, look: 'land' });
      dawnClouds(c, { hz: HZ, sunX: -W, k, t, look: 'land', seed: 9, n: 5 });
      // the hill behind the village, palms, the path up to her home
      c.fillStyle = mixHex('#8a6a8a', '#b08a90', k); c.beginPath(); c.moveTo(-W, HZ + 30); c.quadraticCurveTo(W * 0.5, HZ - 70, W * 2, HZ + 10); c.lineTo(W * 2, H * 2); c.lineTo(-W, H * 2); c.closePath(); c.fill();
      for (let i = 0; i < 6; i++) palmTree(c, W * (0.08 + 0.18 * i) + 40 * h01(i, 2), HZ + 60, 260 + 90 * h01(i, 3), (h01(i, 4) - 0.5) * 0.4, t, i, 0.35);
      dawnSand(c, { y0: HZ + 70, k, t, look: 'land', prints: true, seed: 6, dry: true });
      c.fillStyle = rgbaHex('#b0806a', 0.35); c.beginPath(); c.moveTo(W * 0.2, H); c.quadraticCurveTo(W * 0.45, ground - 40, W * 0.72, ground - 60); c.lineTo(W * 0.8, ground - 60); c.quadraticCurveTo(W * 0.55, ground, W * 0.45, H); c.fill();
      const hutA = homeHut(c, g, W * 0.7, ground - 30, 330, { dark: 0.12, lit: 1 });
      // the mother on the porch: she has been up all night
      const mum = { x: hutA.porch.x + 10, y: hutA.porch.y };
      mother(c, mum.x, mum.y, 250, t < her ? 'stand' : 'hands', { t, flip: true, col: '#24142c', rim: 'rgba(255,214,150,0.9)', shawl: '#5a3a6a', emote: '!', emoteT0: her + 0.1 });
      shawlTrim(c, mum.x, mum.y, 250, t < her ? 'stand' : 'hands', { flip: true });
      if (t > her && t < her + 0.5) focusLines(c, mum.x, mum.y - 200, 170, rgbaHex('#fff4d8', 0.35 * (1 - (t - her) / 0.5)), t, { n: 60 });
    });
    // Rai in the foreground on the pole, a bearer either side; the girl on top, then jumping down
    const R = 165, x = W * 0.2, y = H * 0.5 + 5 * Math.sin(t * 6), poleY = y + 0.12 * R;
    const bh = (H * 0.92 - poleY) / 0.8;
    pole(c, -160, poleY + 6, x + 330, poleY - 2, 0, 24, 0.1);
    folk(c, x + 290, H * 0.92, bh, { t, seed: 501, walk: t * 6, arms: 'carry', col: '#1a0e20', rim: RIM, rimSide: -1, garland: true });
    folk(c, -60, H * 0.92, bh, { t, seed: 502, walk: t * 6 + 2, arms: 'carry', col: '#1a0e20', rim: RIM, rimSide: -1 });
    const forMe = t >= andB - 0.05;
    const a = drawRai(c, x, y, R, {
      t, face: t < her ? 'fierce' : forMe ? (t > me ? 'wink' : 'cheeky') : 'fierce', arms: forMe ? ['down', 'hold'] : ['fist', 'point'], armsFrom: forMe ? ['fist', 'point'] : undefined, armsU: forMe ? clamp((t - andB + 0.05) / 0.15) : 1,
      glow: '#ffd27a', glowStrength: 0.8, marks: forMe ? ['shine'] : t > her ? ['!'] : [], markT0: forMe ? me : her, heart: forMe ? clamp((t - andB) / 0.3) * 0.8 : 0, heartColor: GOLD, noBlink: true,
    });
    const jumpT = andB + 0.18, ju = clamp((t - jumpT) / 0.4);
    const gx0 = x - 4, gy0 = a.head.y - a.head.r * 0.85 + 13 * 2.25;
    if (ju <= 0) girl(c, gx0, gy0, 225, 'ride', { t, mask: 'up', outfit: 'tee', pendant: true, slate: true, rim: RIM });
    else if (ju < 1) girl(c, lerp(gx0, W * 0.62, ju), lerp(gy0, H * 0.86, ju) - 300 * 4 * ju * (1 - ju), 225, JUMP, { t, mask: 'up', outfit: 'tee', pendant: true, slate: true, rim: RIM, blend: { from: RIDE(t), u: clamp(ju * 3) } });
    return punch(t, [her], 0.02, 0.3);
  }

  // ---------------------------------------------------------------- 5 the slate: count the nights, the meals, the care

  slateShot(c: C2, g: C2, t: number, lt: number, scrib: boolean): PostOverrides {
    const k = this.k(t);
    const lit: [number, number, number] = [clamp((t - this.ws('c1')) / 0.2), clamp((t - this.ws('c2')) / 0.2), clamp((t - this.ws('c3')) / 0.2)];
    const sc = clamp((t - this.ws('or')) / (this.ws('c4') - this.ws('or') + 0.1)), ht = clamp((t - this.ws('c4') - 0.02) / 0.5);
    // the hut's wall behind, warm in the dawn, soft; the lit window to the right
    const wall = c.createLinearGradient(0, 0, W, 0);
    wall.addColorStop(0, mixHex('#8a5a3a', '#b07a4a', k)); wall.addColorStop(1, mixHex('#c48a52', '#e0a868', k));
    c.fillStyle = wall; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(80,40,20,0.35)'; c.lineWidth = 10;
    for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(i * 240 + 60, 0); c.lineTo(i * 240 + 60, H); c.stroke(); }
    c.fillStyle = '#ffd88a'; c.fillRect(W * 0.8, -40, 260, 300);
    c.strokeStyle = '#5a3a20'; c.lineWidth = 16; c.strokeRect(W * 0.8, -40, 260, 300); c.beginPath(); c.moveTo(W * 0.8 + 130, -40); c.lineTo(W * 0.8 + 130, 260); c.stroke();
    const wl = g.createRadialGradient(W * 0.88, H * 0.1, 0, W * 0.88, H * 0.1, 420); wl.addColorStop(0, rgbaHex('#ffcf6b', 0.4)); wl.addColorStop(1, rgbaHex('#ffcf6b', 0)); g.fillStyle = wl; g.fillRect(W * 0.88 - 420, 0, 840, 520);
    const sb = c.createLinearGradient(0, H * 0.2, W, H * 0.6);
    sb.addColorStop(0, 'rgba(255,200,140,0)'); sb.addColorStop(0.5, 'rgba(255,214,150,0.25)'); sb.addColorStop(1, 'rgba(255,200,140,0)');
    c.fillStyle = sb; c.fillRect(0, 0, W, H);
    // the camera reads down the rows as they light
    const rowY = [-46, 14, 74], cur = lit[2]! > 0 ? 2 : lit[1]! > 0 ? 1 : 0;
    const s = scrib ? 2.75 : 2.35, rot = scrib ? 0.05 : -0.035 + 0.01 * Math.sin(t * 1.3);
    const follow = scrib ? 12 : rowY[cur]! * 0.55;
    const sx = W * (scrib ? 0.5 : 0.48), sy = H * 0.43 - follow * s * 0.5 + 6 * Math.sin(t * 1.7);
    const toScreen = (lx: number, ly: number): P => ({ x: sx + (lx * Math.cos(rot) - ly * Math.sin(rot)) * s, y: sy + (lx * Math.sin(rot) + ly * Math.cos(rot)) * s });
    // her mother's plait, hanging into the shot as she leans over to read
    const plx = sx - 150 * s, sw = Math.sin(t * 1.6) * 8;
    c.save(); c.lineCap = 'round';
    for (let i = 0; i < 12; i++) { const v = i / 11, px = plx + sw * v + 10 * Math.sin(v * 3), py = -40 + v * H * 0.5; c.fillStyle = i % 2 ? '#24142a' : '#1a0e1e'; c.beginPath(); c.ellipse(px, py, 22 - 6 * v, 30, (i % 2 ? 0.35 : -0.35), 0, TAU); c.fill(); }
    c.fillStyle = HEX.coral; c.fillRect(plx + sw - 14, H * 0.5 - 14, 28, 18);
    c.strokeStyle = '#1a0e1e'; c.lineWidth = 6; for (let j = -2; j <= 2; j++) { c.beginPath(); c.moveTo(plx + sw + j * 4, H * 0.5); c.lineTo(plx + sw + j * 6, H * 0.5 + 40); c.stroke(); }
    c.restore();
    slate(c, sx, sy, s, rot, (cc) => slateNight(cc, { lit, scribble: sc, heart: ht, t }));
    // the lit row's glow (the slate's own transform)
    g.save(); g.translate(sx, sy); g.rotate(rot); g.scale(s, s);
    lit.forEach((Lr, i) => { if (Lr > 0 && sc < 1) { g.fillStyle = rgbaHex('#ffd27a', 0.18 * Lr * (1 - sc)); g.fillRect(-100, rowY[i]! - 20, 200, 40); } });
    if (ht > 0.9) { const hg = g.createRadialGradient(0, 0, 10, 0, 0, 150); hg.addColorStop(0, rgbaHex(HEX.pink, 0.4 * (ht - 0.9) * 10)); hg.addColorStop(1, rgbaHex(HEX.pink, 0)); g.fillStyle = hg; g.fillRect(-160, -160, 320, 320); }
    g.restore();
    // the girl's hands at the bottom corners holding it up to her; her mother's hands taking the top
    const grip = (lx: number, ly: number, from: P, col: string) => { const p = toScreen(lx, ly); reachArm(c, from.x, from.y, p.x, p.y, 46, col, RIM); };
    grip(-96, 128, { x: W * 0.32, y: H + 80 }, '#1c1020');
    if (!scrib) grip(96, 128, { x: W * 0.66, y: H + 80 }, '#1c1020');
    const take = clamp((t - this.ws('c1') + 0.25) / 0.3);
    if (take > 0) { grip(-104, -122, { x: lerp(W * 0.18, W * 0.28, take), y: -200 }, '#24142a'); grip(104, -122, { x: lerp(W * 0.8, W * 0.7, take), y: -200 }, '#24142a'); }
    // her pencil and hand when she scribbles and draws
    if (scrib) {
      const tip = slatePencilTip(sc, ht) ?? (ht >= 1 ? [70, 96] as [number, number] : [92, 110] as [number, number]);
      const p = toScreen(tip[0], tip[1]);
      c.save(); c.translate(p.x, p.y); c.rotate(-0.5);
      c.fillStyle = '#2a2a33'; c.beginPath(); c.moveTo(-7, 14); c.lineTo(7, 14); c.lineTo(0, 0); c.closePath(); c.fill();
      c.fillStyle = '#ffd23f'; c.fillRect(-7, 14, 14, 150); c.fillStyle = '#ff8aa0'; c.fillRect(-7, 160, 14, 18);
      c.fillStyle = '#1c1020'; c.beginPath(); c.ellipse(0, 112, 30, 36, 0, 0, TAU); c.fill();
      c.restore();
      const hand = { x: p.x + Math.sin(0.5) * 112, y: p.y + Math.cos(0.5) * 112 };
      reachArm(c, hand.x + 150, H + 160, hand.x, hand.y, 50, '#1c1020', RIM);
    }
    // chibi Rai peeking in at the corner, counting on her fingers; love when the heart is drawn
    const counted = lit.filter((x) => x > 0).length, R = 80, rx = W * 0.86, ry = H * 0.62;
    const pop = clamp((t - this.cut('slate') - 0.1) / 0.2);
    if (pop > 0) {
      const face: Face = ht > 0.5 ? 'love' : sc > 0 ? 'shock' : counted >= 3 ? 'joy' : 'wow';
      const arms: [ArmPose, ArmPose] = ht > 0.5 ? ['cheek', 'cheek'] : counted === 1 ? ['down', 'point'] : counted === 2 ? ['point', 'point'] : counted >= 3 ? ['up', 'up'] : ['down', 'down'];
      const cT = counted ? this.ws(['c1', 'c2', 'c3'][counted - 1]!) : 0;
      drawRai(c, rx + (1 - pop) * 220, ry, R, { t, sd: true, face, arms, hop: counted && !scrib ? 0.3 * Math.max(0, 1 - (t - cT) / 0.3) : 0, marks: ht > 0.5 ? ['hearts'] : sc > 0 ? ['!?'] : ['sparkle'], markT0: ht > 0.5 ? this.ws('c4') + 0.3 : sc > 0 ? this.ws('or') : this.ws('c1'), glow: '#ffd27a' });
      if (!scrib && counted > 0) { // her count, popping over her head
        const pk = ease.outBack(clamp((t - cT) / 0.18), 2.6);
        c.save(); c.translate(rx - 10, ry - 190); c.scale(pk, pk); c.rotate(-0.08);
        c.font = font(FAM.hook(), 110); c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
        c.lineWidth = 14; c.strokeStyle = '#3a1a20'; c.strokeText(String(counted), 0, 0); c.fillStyle = HEX.yellow; c.fillText(String(counted), 0, 0);
        c.restore();
      }
    }
    if (!scrib) poof(c, rx, ry - 30, 110, t, this.cut('slate') + 0.1);
    return mergePost(punch(t, [this.ws('c1'), this.ws('c2'), this.ws('c3')], 0.018, 0.25), scrib ? punch(t, [this.ws('c4') + 0.5], 0.025, 0.3) : {});
  }

  // ---------------------------------------------------------------- 6 the nod, along the beach, to the stone bank

  nod(c: C2, g: C2, t: number, lt: number): PostOverrides {
    const k = this.k(t), HZ = H * 0.5, sunX = W * 0.62, dur = this.cut('toss') - this.cut('nod');
    const pan = 1500 * ease.inOutCubic(clamp(lt / (dur * 0.9)));
    const agree = this.ws('agree');
    dawnSky(c, g, { hz: HZ, sunX, k, look: 'sea' });
    dawnClouds(c, { hz: HZ, sunX, k, t, look: 'sea', seed: 13, pan: pan * 0.5 });
    dawnSea(c, g, { hz: HZ, y1: H * 0.66, sunX, k, t, pan: pan * 0.3 });
    c.save(); c.translate(-pan * 0.35, 0);
    for (let i = 0; i < 5; i++) seaCanoe(c, g, 200 + i * 520, H * 0.62, 160, { dark: 0.75, flip: i % 2 === 0, lantern: 0.3, t });
    c.restore();
    dawnSand(c, { y0: H * 0.66, k, t, pan, look: 'sea', prints: true, seed: 8 });
    // the village in two rows facing the hut (us), backlit; the nod runs one head after another along the beach
    const nodAt = (i: number) => { const a = t - (agree + 0.1 * i); return a < 0 || a > 0.7 ? 0 : Math.sin((a / 0.7) * PI * 2) ** 2; };
    c.save(); c.translate(-pan * 0.8, 0);
    for (let i = 0; i < 18; i++) folk(c, 120 + i * 140 + 30 * h01(i, 2), H * 0.8, 220 + 30 * h01(i, 3), { t, seed: 600 + i, nod: nodAt(i + 1), col: mixHex(SIL, '#4a2a4a', 0.3), rim: RIM, rimSide: 1, garland: i % 3 === 0, arms: i % 5 === 0 ? 'heart' : 'down' });
    c.restore();
    c.save(); c.translate(-pan, 0);
    // the bank at the end of the beach: the island's old stones, Rai's own people
    const bx = 2560, by = H * 0.86, bk = 1.0;
    stoneBank(c, bx, by, bk, 0.35, 2);
    const words = ['cause', 'thats', 'what', 'money', 'about'];
    bankStones(bx, by, bk).forEach((s, i) => stoneHeart(c, g, s.x, s.y, s.r, clamp((t - this.ws(words[i]!)) / 0.25)));
    const R = 108, rx = bx - 400, ry = by - 1.07 * R, money = this.ws('money'), cause = this.ws('cause');
    drawRai(c, rx, ry, R, {
      t, face: t < cause ? 'determined' : t < money ? 'smile' : 'smug', arms: t < cause ? ['fist', 'fist'] : ['hip', 'point'], armsFrom: ['fist', 'fist'], armsU: clamp((t - cause) / 0.2),
      squash: t < cause ? -0.2 * Math.max(0, Math.sin(clamp((t - agree) / 1.1) * PI * 4)) : 0, glow: '#ffd27a', marks: t > money ? ['shine'] : [], markT0: money, tilt: t > money ? 0.08 : 0,
    });
    for (let i = 0; i < 12; i++) {
      const px = 160 + i * 150 + 26 * h01(i, 5);
      if (i === 0) { mother(c, px + 10, H * 1.02, 380, 'stand', { t, col: SIL, rim: RIM, shawl: '#4a2a5a' }); shawlTrim(c, px + 10, H * 1.02, 380, 'stand'); continue; }
      folk(c, px, H * 1.02 + 20 * h01(i, 6), 360 + 40 * h01(i, 7), { t, seed: 700 + i, nod: nodAt(i), col: SIL, rim: RIM, rimSide: 1, garland: i % 4 === 1, arms: i % 6 === 3 ? 'clap' : 'down' });
    }
    // the girl beside her mother, nodding first and hardest
    const gn = nodAt(-1);
    girl(c, 300, H * 1.0, 260, { rot: 0.2 * gn, hip: [-0.06, 0.06], knee: [0, 0], sh: [-0.3, 0.4], el: [0.2, 0.3], head: 0.5 * gn }, { t, mask: 'up', outfit: 'tee', pendant: true, rim: RIM });
    c.restore();
    return punch(t, [this.ws('real')], 0.02, 0.3);
  }

  // ---------------------------------------------------------------- 7a flowers thrown

  toss(c: C2, g: C2, t: number, lt: number): PostOverrides {
    const k = this.k(t), HZ = H * 0.48, sunX = W * 0.5, stone = this.ws('stone4');
    const R = 150, x = W * 0.5, y = H * 0.5;
    withCam2(c, g, { zoom: lerp(1.0, 1.06, clamp(lt / 1.7)) }, () => {
      dawnSky(c, g, { hz: HZ, sunX, k, look: 'sea' });
      dawnClouds(c, { hz: HZ, sunX, k, t, look: 'sea', seed: 17 });
      dawnSea(c, g, { hz: HZ, y1: H * 0.62, sunX, k, t });
      dawnSand(c, { y0: H * 0.62, k, t, look: 'sea', seed: 3 });
      // the crowd behind her, throwing
      const from: P[] = [];
      for (let i = 0; i < 14; i++) {
        const px = W * (0.02 + 0.96 * (i / 13)), d = h01(i, 41);
        if (Math.abs(px - x) < 200) continue;
        const sw = clamp((t - this.cut('toss') - 0.12 * (i % 5)) / 0.35);
        const hd = folk(c, px, H * (0.86 + 0.08 * d), 300 + 120 * d, { t, seed: 800 + i, arms: i % 2 ? 'throw' : 'cheer', swing: sw, col: SIL, rim: RIM, rimSide: px < sunX ? 1 : -1, garland: i % 3 === 0 });
        from.push(hd.hands[1]);
      }
      // Rai, the lei dropping onto her on "stone", flowers everywhere
      const hop = t > stone ? 0.22 * Math.abs(Math.sin((t - stone) * 6)) : 0;
      drawRai(c, x, y, R, { t, face: t < stone ? 'wow' : 'joy', arms: ['up', 'up'], armsFrom: ['down', 'down'], armsU: clamp(lt / 0.2), hop, squash: hop < 0.02 && t > stone ? -0.2 : 0.05, glow: '#ffd27a', glowStrength: 1.1, marks: ['sparkle'], markT0: stone, heart: 0.3, heartColor: GOLD });
      const drop = clamp((t - stone + 0.35) / 0.4);
      if (drop > 0) lei(c, x, y - hop * R - (1 - ease.outBack(drop)) * 260, R, t, 1);
      flowerToss(c, t, this.cut('toss') + 0.05, from.length ? from : [{ x: 0, y: H * 0.6 }], { x, y: y - R * 0.6 }, { n: 46, seed: 3, spread: 280, size: 16, arc: 260, stagger: 1.2 });
    });
    lensPetals(c, t, { n: 6, seed: 11, a: 0.6, size: 56 });
    return punch(t, [stone], 0.025, 0.3);
  }

  // ---------------------------------------------------------------- 7b the mother: a tear, then a laugh

  mum(c: C2, g: C2, t: number, lt: number): PostOverrides {
    const k = this.k(t), sea = this.ws('sea4'), HZ = H * 0.6, cutT = this.cut('mum');
    withCam2(c, g, { zoom: lerp(1.0, 1.05, clamp(lt / 1.7)), x: lerp(-10, 10, clamp(lt / 1.7)) }, () => {
      dawnSky(c, g, { hz: HZ, sunX: W * 0.3, k, look: 'land' });
      dawnClouds(c, { hz: HZ, sunX: -W, k, t, look: 'land', seed: 21, n: 4 });
      c.fillStyle = mixHex('#8a6a8a', '#b08a90', k); c.beginPath(); c.moveTo(-W, HZ + 20); c.quadraticCurveTo(W * 0.5, HZ - 60, W * 2, HZ + 10); c.lineTo(W * 2, H * 2); c.lineTo(-W, H * 2); c.closePath(); c.fill();
      palmTree(c, W * 0.08, H * 0.82, 560, 0.18, t, 1, 0.25); palmTree(c, W * 0.95, H * 0.8, 520, -0.2, t, 2, 0.25);
      dawnSand(c, { y0: H * 0.72, k, t, look: 'land', seed: 5, dry: true });
      homeHut(c, g, W * 0.46, H * 0.8, 430, { dark: 0.1, lit: 1 });
      // Rai beside the steps, blubbering happy tears
      drawRai(c, W * 0.82, H * 0.8 - 1.07 * 125, 125, { t, face: 'cry', arms: ['cheek', 'cheek'], glow: '#ffd27a', shake: 0.4, blush: 0.6 });
      // falling flowers
      for (let i = 0; i < 26; i++) { const u = ((t * 0.35 + h01(i, 3)) % 1), px = h01(i, 4) * W + 40 * Math.sin(t * 2 + i), py = -60 + u * (H + 120); flower(c, px, py, 12 + 8 * h01(i, 5), t * 3 + i, [HEX.pink, HEX.yellow, HEX.coral, '#ffffff'][i % 4]!, i % 4 === 3); }
      // the mother, close: her hands over her face, then the laugh breaking through
      const laugh = t >= sea - 0.05, mx = W * 0.38, my = H * 1.12, mh = 800, u = mh / 100;
      const bounce = laugh ? 9 * Math.abs(Math.sin((t - sea) * 14)) : t > cutT + 0.3 ? 2.5 * Math.sin(t * 22) : 0;
      const pose = laugh ? 'stand' : 'face', col = '#2a1830', rim = 'rgba(255,214,150,0.95)';
      mother(c, mx, my - bounce, mh, pose, { t, col, rim, shawl: '#6a3a7a', emote: laugh ? 'joy' : 'tear', emoteT0: laugh ? sea : cutT + 0.2 });
      shawlTrim(c, mx, my - bounce, mh, pose);
      if (!laugh) palmsOnFace(c, mx + 10.4 * u, my - bounce - 77 * u, 9 * u, col, rim);
      else emoteTear(c, mx + 4 * u, my - bounce - 90 * u, u, t);
      girl(c, W * 0.47, H * 1.1, 560, HUG, { t, flip: true, mask: 'up', outfit: 'tee', pendant: true, rim: RIM });
    });
    return punch(t, [sea], 0.02, 0.3);
  }

  // ---------------------------------------------------------------- 8a "you lifted me up": hands on the stone

  hands(c: C2, g: C2, t: number, lt: number): PostOverrides {
    const k = this.k(t), HZ = H * 0.62, sunX = W * 0.5, R = 215, x = W * 0.5, y = H * 0.46;
    const words = ['you5', 'lifted', 'me5', 'up', 'with'].map((id) => this.ws(id));
    const spots = [2.4, -0.25, 1.95, 1.05, PI - 0.1];
    withCam2(c, g, { zoom: lerp(1.05, 1.0, clamp(lt / 1.6)) }, () => {
      dawnSky(c, g, { hz: HZ, sunX, k, look: 'sea' });
      dawnSea(c, g, { hz: HZ, y1: H * 0.8, sunX, k, t });
      dawnSand(c, { y0: H * 0.8, k, t, look: 'sea', seed: 9 });
      // the village behind, soft in the haze
      for (let i = 0; i < 9; i++) folk(c, W * (0.03 + 0.12 * i), H * 1.06, 520, { t, seed: 1100 + i, col: mixHex(SIL, '#c07090', 0.45), arms: i % 2 ? 'heart' : 'down' });
      const touched = words.filter((w) => t >= w).length, up = this.ws('up');
      drawRai(c, x, y, R, { t, face: t < up ? 'soft' : 'love', arms: ['down', 'down'], glow: GOLD, glowStrength: 0.5 + 0.15 * touched, heart: 0.15 * touched, heartColor: GOLD, marks: t >= up ? ['hearts'] : [], markT0: up, blush: t >= up ? 0.6 : 0 });
      lei(c, x, y, R, t, 1);
      // a hand laid on her rim on each word: the village reaching up to her from all round, out of the frame
      const from: P[] = [{ x: x - 620, y: H + 140 }, { x: W + 140, y: y - 60 }, { x: x - 330, y: H + 160 }, { x: x + 520, y: H + 160 }, { x: -140, y: y + 40 }];
      words.forEach((w, i) => {
        const p = clamp((t - w + 0.18) / 0.18);
        if (p <= 0) return;
        const a = spots[i]!, tx = x + Math.cos(a) * R * 0.96, ty = y + Math.sin(a) * R * 0.96, o = from[i]!;
        reachArm(c, o.x, o.y, lerp(o.x, tx, ease.outCubic(p)), lerp(o.y, ty, ease.outCubic(p)), 54, '#1c1020', RIM);
      });
      rimRipple(c, g, x, y, R, t, words.map((w, i) => ({ a: spots[i]!, t0: w })));
    });
    return {};
  }

  // ---------------------------------------------------------------- 8b "with a word you agreed": the ring, from above

  ring(c: C2, g: C2, t: number, lt: number): PostOverrides {
    const k = this.k(t), agreed = this.ws('agreed'), word = this.ws('word');
    const R = 92, x = W * 0.5, feet = H * 0.52, y = feet - 1.07 * R;
    withCam2(c, g, { zoom: lerp(1.18, 1.0, ease.inOutCubic(clamp(lt / 1.6))), y: lerp(40, 0, clamp(lt / 1.6)) }, () => {
      const HZ = H * 0.08;
      dawnSky(c, g, { hz: HZ, sunX: W * 0.5, k, look: 'sea', top: -H });
      dawnSea(c, g, { hz: HZ, y1: H * 0.24, sunX: W * 0.5, k, t });
      dawnSand(c, { y0: H * 0.24, k, t, look: 'sea', seed: 12, prints: true });
      const N = 16, rx = 470, ry = 215, ring: { x: number; y: number; i: number; a: number }[] = [];
      for (let i = 0; i < N; i++) { const a = (i / N) * TAU + 0.1; ring.push({ x: x + Math.cos(a) * rx, y: feet + Math.sin(a) * ry, i, a }); }
      // long shadows cast towards us
      c.fillStyle = 'rgba(40,16,40,0.26)';
      for (const p of ring) { c.beginPath(); c.ellipse(p.x + (p.x - x) * 0.12, p.y + 110, 14, 110, (p.x - x) * -0.0007, 0, TAU); c.fill(); }
      c.beginPath(); c.ellipse(x, feet + 130, 46, 130, 0, 0, TAU); c.fill();
      const reach = (p: { x: number; y: number; i: number; a: number }) => {
        const h = 200 * (0.85 + 0.3 * (p.y - feet + ry) / (2 * ry)), u = h / 100;
        const tx = x + Math.cos(p.a) * R * 0.95, ty = y + Math.sin(p.a) * R * 0.5;
        const left = tx < p.x, dx = Math.abs(tx - p.x) / u, dy = (ty - (p.y - 74 * u)) / u, L = Math.hypot(dx, dy), m = Math.min(1, 42 / L);
        if (p.i === 4) { mother(c, p.x, p.y, h, 'point', { t, flip: left, col: SIL, rim: RIM, shawl: '#4a2a5a' }); return; }
        if (p.i === 5) { girl(c, p.x, p.y, h * 0.65, 'reach', { t, flip: left, mask: 'up', outfit: 'tee', pendant: true, rim: RIM }); return; }
        folk(c, p.x, p.y, h, { t, seed: 900 + p.i, arms: [{ x: -10, y: 28 }, { x: dx * m, y: dy * m }], flip: left, col: SIL, rim: RIM, rimSide: 1, garland: p.i % 3 === 0 });
      };
      for (const p of ring) if (p.y <= feet) reach(p);
      // her heart's light on the sand round her (on the main layer, so the near ring hides it)
      if (t > agreed - 0.1) { const a = clamp((t - agreed + 0.1) / 0.3); c.save(); c.globalCompositeOperation = 'lighter'; const hg = c.createRadialGradient(x, y + 0.12 * R, 0, x, y + 0.12 * R, R * 2.6); hg.addColorStop(0, rgbaHex(GOLD, 0.45 * a)); hg.addColorStop(1, rgbaHex(GOLD, 0)); c.fillStyle = hg; c.fillRect(x - R * 2.6, y - R * 2.6, R * 5.2, R * 5.2); c.restore(); }
      drawRai(c, x, y, R, { t, face: 'love', arms: ['cheek', 'cheek'], glow: GOLD, glowStrength: 1.2, heart: 0.5 + 0.5 * clamp((t - agreed) / 0.3), heartColor: GOLD, marks: ['hearts'], markT0: word, blush: 0.7 });
      lei(c, x, y, R, t, 1);
      const touches = [0, 1, 2, 3, 4, 5].map((j) => ({ a: -PI / 2 + j * 1.05, t0: word + 0.1 * j }));
      rimRipple(c, g, x, y, R, t, touches, clamp((t - agreed) / 0.25) * (0.8 + 0.2 * Math.sin(t * 8)));
      for (const p of ring) if (p.y > feet) reach(p);
    });
    return punch(t, [agreed], 0.02, 0.35);
  }

  // ---------------------------------------------------------------- 9a the slate held high

  raise(c: C2, g: C2, t: number, lt: number): PostOverrides {
    const k = this.k(t), choose = this.ws('choose');
    const up = ease.outBack(clamp((t - this.cut('raise') - 0.1) / 0.45));
    let slateAt: P = { x: 0, y: 0 };
    withCam2(c, g, { zoom: lerp(1.0, 1.07, clamp(lt / 1.7)), rot: -0.035 }, () => {
      // looking up from the sand at her home: the western sky, palms, the hut, the mother on the porch
      dawnSky(c, g, { hz: H * 0.9, sunX: W * 0.5, k, look: 'land' });
      dawnClouds(c, { hz: H * 0.85, sunX: -W, k, t, look: 'land', seed: 23, n: 5 });
      palmTree(c, W * 0.04, H * 1.15, 900, 0.22, t, 1, 0.3); palmTree(c, W * 0.97, H * 1.15, 820, -0.28, t, 2, 0.3);
      dawnSand(c, { y0: H * 0.86, k, t, look: 'land', seed: 4, dry: true });
      const hutA = homeHut(c, g, W * 0.5, H * 0.9, 520, { dark: 0.08, lit: 1 });
      const mx = hutA.porch.x - 20, my = hutA.porch.y, mh = 360, u = mh / 100;
      const pose = up > 0.5 ? 'cheer' : 'hold';
      mother(c, mx, my, mh, pose, { t, flip: true, col: '#2a1830', rim: 'rgba(255,214,150,0.95)', shawl: '#6a3a7a' });
      shawlTrim(c, mx, my, mh, pose, { flip: true });
      const sy = lerp(my - 60 * u, my - 120 * u, up), sxx = mx + lerp(-10 * u, 0, up);
      slateAt = { x: sxx, y: sy };
      slate(c, sxx, sy, 0.8, -0.05 + 0.03 * Math.sin(t * 3), (cc) => slateNight(cc, { lit: [1, 1, 1], scribble: 1, heart: 1, t }));
      const hg = g.createRadialGradient(sxx, sy, 0, sxx, sy, 220); hg.addColorStop(0, rgbaHex(HEX.pink, 0.4 * up)); hg.addColorStop(1, rgbaHex(HEX.pink, 0)); g.fillStyle = hg; g.fillRect(sxx - 220, sy - 220, 440, 440);
      girl(c, mx + 120, my, 230, 'cheer', { t, mask: 'up', outfit: 'tee', pendant: true, rim: RIM });
    });
    // Rai in the foreground, fierce: choose
    drawRai(c, W * 0.17, H * 0.6, 175, { t, face: t < choose ? 'determined' : 'fierce', arms: ['fist', 'up'], armsFrom: ['down', 'down'], armsU: clamp(lt / 0.25), glow: GOLD, glowStrength: 1, marks: ['shine'], markT0: choose, tilt: 0.06, noBlink: true });
    if (t > choose && t < choose + 0.5) focusLines(c, slateAt.x, slateAt.y, 200, rgbaHex('#fff4d8', 0.45 * (1 - (t - choose) / 0.5)), t, { n: 80 });
    return punch(t, [choose], 0.02, 0.3);
  }

  // ---------------------------------------------------------------- 9b "and honour it loud": the whole beach

  cheer(c: C2, g: C2, t: number, lt: number): PostOverrides {
    const k = this.k(t), loud = this.ws('loud'), HZ = H * 0.36, sunX = W * 0.56;
    const boom = clamp((t - loud) / 0.3);
    withCam2(c, g, { zoom: lerp(1.0, 1.04, clamp(lt / 2.5)), y: lerp(-10, 10, clamp(lt / 2.5)) }, () => {
      dawnSky(c, g, { hz: HZ, sunX, k: Math.min(1, k + 0.15 * boom), look: 'sea' });
      dawnClouds(c, { hz: HZ, sunX, k, t, look: 'sea', seed: 29 });
      dawnSea(c, g, { hz: HZ, y1: H * 0.5, sunX, k, t });
      for (let i = 0; i < 6; i++) seaCanoe(c, g, W * (0.08 + 0.17 * i), H * 0.47, 110, { dark: 0.8, flip: i % 2 === 0, lantern: 0.3, t });
      dawnSand(c, { y0: H * 0.5, k, t, look: 'sea', seed: 14 });
      // the crowd, rows receding, everybody's arms up; jumping on "loud"
      for (let row = 0; row < 4; row++) {
        const n = 12 - row, hh = 110 + row * 70, yy = H * (0.56 + row * 0.1);
        for (let i = 0; i < n; i++) {
          const px = W * ((i + 0.5 * (row % 2)) / (n - 1)) + 30 * (h01(i, row, 3) - 0.5);
          if (row >= 2 && Math.abs(px - W * 0.55) < 120) continue;   // Rai's place
          const jump = boom > 0 ? 18 * Math.abs(Math.sin((t - loud) * 7 + i)) * (1 - clamp((t - loud) / 1.6)) : 4 * Math.abs(Math.sin(t * 6 + i + row));
          folk(c, px, yy, hh, { t, seed: 1000 + row * 20 + i, arms: (i + row) % 5 === 0 ? 'wave' : 'cheer', col: mixHex(SIL, '#5a3a5a', 0.3 - row * 0.1), rim: RIM, rimSide: px < sunX ? 1 : -1, hop: jump, garland: (i + row) % 3 === 0 });
        }
        if (row === 1) { // Rai in the crowd, facing her mother on the porch, arms up
          drawRai(c, W * 0.55, H * 0.58, 100, { t, face: 'joy', arms: ['up', 'up'], glow: GOLD, glowStrength: 1.2, hop: boom > 0 ? 0.3 * Math.abs(Math.sin((t - loud) * 7)) : 0.1 * Math.abs(Math.sin(t * 6)), marks: ['sparkle', 'notes'], markT0: this.cut('cheer'), heart: 0.6, heartColor: GOLD });
          lei(c, W * 0.55, H * 0.58, 100, t, 1);
        }
      }
      if (t > loud - 0.1) flowerToss(c, t, loud - 0.05, Array.from({ length: 12 }, (_, i) => ({ x: W * (i / 11), y: H * 0.7 })), { x: W * 0.5, y: H * 0.15 }, { n: 60, seed: 19, spread: 900, size: 16, arc: 300, stagger: 0.4 });
    });
    // the mother's back in the foreground (plait, shawl), the slate held high, its heart glowing through to them
    const mx = W * 0.2, my = H * 1.46, mh = 900, u = mh / 100;
    mother(c, mx, my, mh, 'cheer', { t, col: '#140a18', rim: RIM, shawl: '#3a2048' });
    plaitOver(c, mx, my, mh, t, '#1e1024');
    const sx = mx, sy = my - 114 * u;
    c.save(); c.translate(sx, sy); c.rotate(0.06);
    c.fillStyle = '#7a8484'; c.beginPath(); c.roundRect(-110, -140, 220, 280, 16); c.fill();
    c.strokeStyle = '#4a5454'; c.lineWidth = 4; c.stroke();
    c.restore();
    const hg = g.createRadialGradient(sx, sy, 100, sx, sy, 250); hg.addColorStop(0, rgbaHex(HEX.pink, 0.28)); hg.addColorStop(1, rgbaHex(HEX.pink, 0)); g.fillStyle = hg; g.fillRect(sx - 250, sy - 250, 500, 500);
    if (boom > 0) flare(g, W * 0.56, H * 0.36, 1 - clamp((t - loud) / 1.5));
    return mergePost(punch(t, [loud], 0.04, 0.5), caKick(t, [loud], 4, 0.35), { flash: t >= loud && t < loud + 0.05 ? 0.2 : 0 });
  }

  // ---------------------------------------------------------------- 10 the sun rises through her heart

  sunrise(c: C2, g: C2, t: number, lt: number, lock: boolean): PostOverrides {
    const k = this.k(t), centred = this.ws('sea7') - 0.1, crest = this.ws('stone7') + 0.35;
    const R = lock ? 230 : 118, x = W * 0.5, y = lock ? H * 0.47 : H * 0.4;
    const hole = { x, y: y + 0.12 * R, r: 0.27 * R };
    // the camera stands at her heart's height, so the horizon runs just under the hole: the sun comes up inside it
    const rs = hole.r * 0.8, hz = hole.y + rs;
    const su = clamp((t - crest) / (centred - crest)), sunY = hz + rs - ease.inOutQuad(su) * 2 * rs - Math.max(0, t - centred) * 3;
    withCam2(c, g, { zoom: lock ? lerp(1.0, 1.06, ease.inOutCubic(clamp(lt / 3))) : lerp(1.0, 1.04, clamp(lt / 2.6)) }, () => {
      dawnSky(c, g, { hz, sunX: x, k: Math.min(1, k + 0.25 * su), look: 'sea' });
      dawnClouds(c, { hz, sunX: x, k, t, look: 'sea', seed: 31, n: 6 });
      sunDisc(c, g, x, sunY, rs, hz, 1);
      dawnSea(c, g, { hz, y1: lock ? H * 0.95 : H * 0.62, sunX: x, k, t, glitter: 0.3 + su });
      if (!lock) {
        dawnSand(c, { y0: H * 0.62, k, t, look: 'sea', seed: 21 });
        for (let i = 0; i < 18; i++) {
          const px = W * (i / 17), d = h01(i, 51);
          if (Math.abs(px - x) < 230) continue;
          folk(c, px, H * (0.7 + 0.1 * d), 170 + 90 * d, { t, seed: 1200 + i, arms: i % 4 === 0 ? 'heart' : i % 4 === 2 ? 'cheer' : 'down', col: SIL, rim: RIM, rimSide: px < x ? 1 : -1, garland: i % 3 === 0 });
        }
      } else dawnSand(c, { y0: H * 0.95, k, t, look: 'sea', seed: 21 });
      // Rai, backlit: love. Her hole is open, so the sun shows through it
      drawRai(c, x, y, R, { t, face: 'love', arms: lock ? ['cheek', 'cheek'] : ['down', 'down'], glow: '#ffd27a', glowStrength: 1.2, marks: su > 0.6 ? ['hearts'] : [], markT0: crest + 1.0, blush: 0.5 });
      lei(c, x, y, R, t, 1);
      // the ring of gold: the hole's rim lit by the sun inside it
      if (su > 0) {
        c.strokeStyle = rgbaHex('#ffd27a', 0.95 * su); c.lineWidth = Math.max(3, R * 0.045); c.beginPath(); c.arc(hole.x, hole.y, hole.r * 0.95, 0, TAU); c.stroke();
        c.strokeStyle = rgbaHex('#fff6d8', 0.9 * su); c.lineWidth = Math.max(1.5, R * 0.012); c.beginPath(); c.arc(hole.x, hole.y, hole.r * 0.93, 0, TAU); c.stroke();
        // her heart's light spilling down and out of the hole, over the two of them
        g.save(); g.globalAlpha = 0.5 * su;
        for (let k = 0; k < 9; k++) {
          const a0 = PI * (0.08 + 0.84 * (k / 8)) + 0.04 * Math.sin(t * 0.7 + k), w = 0.05 + 0.03 * h01(k, 3), len = R * (2.2 + 1.2 * h01(k, 4));
          const rg = g.createRadialGradient(hole.x, hole.y, hole.r, hole.x, hole.y, len); rg.addColorStop(0, rgbaHex('#ffe7a0', 0.22)); rg.addColorStop(1, rgbaHex('#ffe7a0', 0));
          g.fillStyle = rg; g.beginPath(); g.moveTo(hole.x + Math.cos(a0) * hole.r, hole.y + Math.sin(a0) * hole.r);
          g.arc(hole.x, hole.y, len, a0 - w, a0 + w); g.closePath(); g.fill();
        }
        g.restore();
        g.strokeStyle = rgbaHex(GOLD, 0.6 * su); g.lineWidth = R * 0.05; g.beginPath(); g.arc(hole.x, hole.y, hole.r, 0, TAU); g.stroke();
        flare(g, hole.x, hole.y, su * 0.35);
      }
      // the girl and her mother: running to each other, then the hug, in silhouette in front of her
      if (!lock) {
        const run = clamp(lt / 1.9), meet = ease.inOutQuad(run);
        girl(c, lerp(W * 0.18, W * 0.465, meet), H * 0.93, 230, run < 1 ? 'run' : HUG, { t, mask: 'up', outfit: 'tee', pendant: true, col: SIL, rim: RIM });
        mother(c, lerp(W * 0.86, W * 0.535, meet), H * 0.94, 320, run < 1 ? 'stand' : 'hug', { t, flip: true, col: SIL, rim: RIM, shawl: '#2a1838' });
      } else {
        mother(c, W * 0.535, H * 0.97, 380, 'hug', { t, flip: true, col: '#140a18', rim: RIM, shawl: '#2a1838', emote: 'heart', emoteT0: this.cut('lock') + 0.6 });
        girl(c, W * 0.47, H * 0.97, 270, HUG, { t, mask: 'up', outfit: 'tee', pendant: true, col: '#140a18', rim: RIM });
      }
    });
    return mergePost(caKick(t, [centred], 3, 0.4), punch(t, [crest], 0.012, 0.4));
  }
}

/** A second tear, at the other cheek, while she laughs (tears of joy). */
function emoteTear(c: C2, x: number, y: number, u: number, t: number) {
  const s = 3 * u, v = ((t % 1.2) / 1.2), yy = y + 4 * u + v * 14 * u;
  c.fillStyle = '#bfe9ff'; c.strokeStyle = '#3b8fd6'; c.lineWidth = 0.6 * u;
  c.beginPath(); c.moveTo(x - 6 * u, yy - s * 1.6); c.quadraticCurveTo(x - 6 * u + s, yy, x - 6 * u, yy + s * 0.6); c.quadraticCurveTo(x - 6 * u - s, yy, x - 6 * u, yy - s * 1.6); c.fill(); c.stroke();
}
