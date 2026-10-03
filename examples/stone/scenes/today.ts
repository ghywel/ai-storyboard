// TODAY (verse 3, the longest and densest rapped section). "Fast forward": Rai jolts awake from the bedtime story
// and fast-forwards us to the present, a montage in "Other Agents"' manner with a hard cut every 2 beats (each line
// cut on the beat at or before its first word, then every 2 beats; a 1-beat remainder joins the shot before). Every
// vignette is a real place with its clues (today-world.ts): the rainy street with its neon and the GDP screen, the
// doorstep of number 4, the statistics office, the dad's kitchen (the child's crayon stone on the fridge, the final
// notice, the kids' shoes, the hi-vis on the chair), the coast road under the bedroom's lighthouse, the car, the care
// home and his room (his wedding photo, the young man with the guitar, the record player), the lifeboat station (the
// rota of £0, the donation box, the empty peg), the storm, the coder's desk at midnight (cold coffee, the plant, the
// notes, the cat), the data hall, the archive, the record room and the dark corridor outside it. The people are
// faceless but emote; Rai narrates in some panels with big faces (smug at the glad chart, cross at the flat one, soft
// at the care home, determined at the lifeboat, wow at the million machines, sad then serious at who got left out).
// The family from the bedtime story runs through it: the dad's kitchen, grandad in the care home, dad's crew.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { HEX } from '../engine/palette';
import { font } from '../engine/type';
import type { Line, Word } from '../engine/lyrics';
import { clamp, ease, lerp, pulse } from '../engine/util';
import { drawRai, h01, type ArmPose, type Face } from './_rai';
import { focusLines, panels, reactionBg, speedLines as mangaSpeed, type Mark } from './_manga';
import { FAM, TAU, gradientV, karaoke, ledger, person, rgbaHex, slam, stone, sunburst, halftone, type Emote } from './_motifs';
import { caKick, hitShake, mergePost, punch, whipIn } from './_post';
import { seabed } from './_world';
import { bolt, bowl, car, carton, codeWall, guitar, lifeboat, lightStone, noteStream, rackRing, recordScroll, rider, stormSea } from './today-props';
import {
  archive, careHomeOutside, careRoom, carInterior, coastRoad, coderDesk, dataAisle, doorstep, flats, glow, kitchen, lifeboatStation,
  office, rainFx, recordRoom, sepiaRoom, street, wallClock,
} from './today-world';

/** The verse's lines, found by content, in order. */
const Q = ['Fast forward', "that's a sale", 'the same bowl', "The chart doesn't flicker", 'A daughter drives', 'she plays him the songs',
  'a lifeboat crew', 'the code the internet', 'Then you built a ledger', 'sea of code', 'money is memory', 'so who keeps the record'];

/** Shots that whip in from the side (a new vignette), and their direction. */
const WHIP: Record<string, number> = { '2.0': 1, '4.0': -1, '6.0': 1, '7.0': -1, '8.0': 1, '10.0': -1 };

interface Shot { li: number; k: number; t0: number; t1: number }
type C2 = CanvasRenderingContext2D;

export default class Today extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  lines: Line[] = [];
  shots: Shot[] = [];
  hits: number[] = [];

  override init() {
    const { lyrics, audio: au, start, end } = this.ctx;
    this.lines = Q.map((q) => lyrics.get(q));
    const lb = this.lines.map((l, i) => (i === 0 ? Math.round(au.beatAt(start)) : Math.floor(au.beatAt(l.words[0]!.start + 0.02))));
    lb.push(Math.round(au.beatAt(end)));
    for (let i = 0; i < this.lines.length; i++) {
      const bs: number[] = [];
      for (let b = lb[i]!; b < lb[i + 1]!; b += 2) bs.push(b);
      if (bs.length > 1 && lb[i + 1]! - bs[bs.length - 1]! < 2) bs.pop(); // a 1-beat remainder joins the shot before
      bs.forEach((b, k) => this.shots.push({ li: i, k, t0: i === 0 && k === 0 ? start : au.timeOfBeat(b), t1: k + 1 < bs.length ? au.timeOfBeat(bs[k + 1]!) : i + 1 < this.lines.length ? au.timeOfBeat(lb[i + 1]!) : end }));
    }
  }

  /** The first word of `line` matching re (nth match), else the line's first word. */
  w(line: Line, re: RegExp, nth = 0): Word {
    return line.words.filter((x) => re.test(x.w.toLowerCase()))[nth] ?? line.words[0]!;
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t;
    this.L.clear(HEX.ink); this.G.clear();
    let si = 0;
    for (let i = 0; i < this.shots.length; i++) if (t >= this.shots[i]!.t0) si = i;
    const sh = this.shots[si]!, line = this.lines[sh.li]!;
    const u = clamp((t - sh.t0) / (sh.t1 - sh.t0)), lt = t - sh.t0;
    this.hits = [];
    let post: PostOverrides = { bloom: 0.7, vignette: 0.4 };

    // every shot keeps moving (a slow push in or out, alternating); a new vignette may whip in from the side
    const push = si % 2 ? lerp(1.05, 1, ease.outCubic(u)) : lerp(1, 1.05, u);
    const key = `${sh.li}.${sh.k}`, wx = WHIP[key] !== undefined ? whipIn(t, sh.t0, WHIP[key]!) : 0;
    for (const k of [c, g]) { k.save(); k.translate(wx, 0); k.translate(W / 2, H / 2); k.scale(push, push); k.translate(-W / 2, -H / 2); }
    const r = this.shot(c, g, t, sh, line, lt, u);
    for (const k of [c, g]) k.restore();
    post = mergePost(post, r.post, punch(t, this.hits, 0.022, 0.3));

    // the line, low, readable on a dark band; the line being sung (the previous one until the next one starts)
    let cur = 0;
    this.lines.forEach((l, i) => { if (t >= l.words[0]!.start - 0.12) cur = i; });
    const cl = this.lines[cur]!, next = this.lines[cur + 1]?.words[0]!.start ?? this.ctx.end + 1;
    gradientV(c, 'rgba(12,8,22,0)', 'rgba(12,8,22,0.9)', 0, H - 280, W, 280);
    karaoke(c, cl, t, W / 2, H - 96, 48, { sung: r.sung, lead: 0.12, until: next - 0.1, maxW: W - 320 });

    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    return post;
  }

  /** Rai big, narrating: a face, arms, marks, a pop on her cue, a squash on arrival. */
  raiBig(c: C2, t: number, x: number, y: number, R: number, t0: number, o: { face: Face; arms: [ArmPose, ArmPose]; from?: [ArmPose, ArmPose]; marks?: Mark[]; sd?: boolean; hop?: number; tilt?: number; look?: number; glow?: string; heart?: number; heartColor?: string; blush?: number; shake?: number }) {
    const age = t - t0;
    const hop = (o.hop ?? 0) * Math.max(0, Math.sin(clamp(age / 0.3) * Math.PI));
    return drawRai(c, x, y, R, {
      t, face: o.face, arms: o.arms, armsFrom: o.from ?? ['down', 'down'], armsU: clamp(age / 0.15), sd: o.sd, marks: o.marks, markT0: t0 + 0.05,
      hop, squash: age < 0.12 ? -0.3 + age * 2.5 : 0, tilt: o.tilt, look: o.look, glow: o.glow ?? '#2fe0ff', glowStrength: 0.8,
      heart: o.heart ?? 0.3, heartColor: o.heartColor, blush: o.blush, shake: o.shake,
    });
  }

  /** Draw a shot; returns the karaoke's sung colour and the shot's post touches. */
  shot(c: C2, g: C2, t: number, sh: Shot, L: Line, lt: number, u: number): { sung: string; post?: PostOverrides } {
    const W_ = (re: RegExp, nth = 0) => this.w(L, re, nth).start;
    // a slam: snapped to the cut when its word started just before it (slam() keeps it title-safe); each one punches
    const S = (txt: string, x: number, y: number, size: number, t0: number, col: string, shadow: string = HEX.ink, o: { rot?: number; fam?: string; t1?: number } = {}) => {
      const t0s = Math.max(t0, sh.t0), fam = o.fam ?? FAM.hook();
      this.hits.push(t0s);
      c.font = font(fam, size);
      const half = c.measureText(txt).width / 2 + size * 0.08, room = Math.min(x - 96, W - 96 - x);
      slam(c, txt, x, y, half > room ? (size * room) / half : size, t, t0s, { col, shadow, rot: o.rot ?? 0, fam, t1: o.t1 });
    };
    const frame = (z: number, fx: number, fy: number, draw: () => void) => {
      for (const k of [c, g]) { k.save(); k.translate(W / 2, H / 2); k.scale(z, z); k.translate(-fx, -fy); }
      draw();
      for (const k of [c, g]) k.restore();
    };
    const key = `${sh.li}.${sh.k}`;
    switch (key) {
      // ---------------------------------------------------------------- "Fast forward: a rider in the rain with your noodles in a bag,"
      case '0.0': { // Rai, asleep at the end of the story, jolts awake and fast-forwards us
        reactionBg(c, 'stripes', '#1a0f2e', '#2a1648', t);
        mangaSpeed(c, 0, rgbaHex(HEX.pink, 0.7), t, { n: 70, speed: 4200 });
        const fw = W_(/forward/), woke = t < fw;
        for (let k = 0; k < 2; k++) {
          const x = W * 0.5 + ((lt * 1100 + k * 160) % 320);
          c.fillStyle = HEX.yellow; c.beginPath(); c.moveTo(x, H * 0.66); c.lineTo(x + 140, H * 0.74); c.lineTo(x, H * 0.82); c.closePath(); c.fill();
        }
        this.raiBig(c, t, W * 0.26, H * 0.6, 150, woke ? sh.t0 : fw, woke
          ? { face: 'shock', arms: ['up', 'up'], marks: ['!?', 'sweat'], hop: 0.35 }
          : { face: 'cheeky', arms: ['hip', 'point'], from: ['up', 'up'], marks: ['sparkle'], tilt: -0.08 });
        S('FAST', W * 0.66, H * 0.22, 230, W_(/fast/), HEX.yellow, HEX.pink, { rot: -0.04 });
        S('FORWARD', W * 0.66, H * 0.44, 170, fw, HEX.bone, HEX.pink, { rot: 0.03 });
        return { sung: HEX.yellow };
      }
      case '0.1': {
        street(c, g, t, { pan: lt * 500 });
        rider(c, lerp(W * 0.1, W * 0.44, ease.outCubic(u)), H * 0.88, 2.4, t, '#06040e', HEX.lime);
        rainFx(c, t, 0.4);
        S('RIDER', W * 0.3, H * 0.15, 190, W_(/rider/), HEX.cyan, HEX.ink, { rot: -0.03 });
        return { sung: HEX.cyan };
      }
      case '0.2': {
        frame(1.7, W * 0.42 + lt * 120, H * 0.62, () => street(c, g, t, { pan: 300 + lt * 500 }));
        rider(c, lerp(W * 0.2, W * 0.34, u), H * 1.04, 4.0, t, '#06040e', HEX.lime);
        rainFx(c, t, 0.6, 240, 0.32, 2600, 70);
        // a splash from the wheel
        for (let i = 0; i < 14; i++) { const a = -Math.PI * (0.15 + 0.7 * h01(i, 1101)), r = 60 + 160 * ((lt * 2 + h01(i, 1102)) % 1); c.fillStyle = 'rgba(200,220,255,0.6)'; c.beginPath(); c.arc(W * 0.34 + 200 + Math.cos(a) * r, H * 1.0 + Math.sin(a) * r, 5, 0, TAU); c.fill(); }
        S('RAIN', W * 0.72, H * 0.34, 280, W_(/rain/), HEX.cyan, HEX.ink, { rot: 0.05 });
        return { sung: HEX.cyan };
      }
      case '0.3': { // close on the bag on the bars: the order's sticker says FLAT 4
        this.bokeh(c, g, t, lt);
        c.strokeStyle = '#06040e'; c.lineWidth = 30; c.lineCap = 'round'; c.beginPath(); c.moveTo(-40, H * 0.16); c.lineTo(W * 0.62, H * 0.12); c.stroke();
        c.save(); c.translate(W * 0.3, H * 0.13); c.rotate(0.16 * Math.sin(lt * 6));
        c.strokeStyle = 'rgba(244,241,234,0.85)'; c.lineWidth = 9; c.beginPath(); c.moveTo(-60, 0); c.lineTo(-100, 180); c.moveTo(60, 0); c.lineTo(100, 180); c.stroke();
        c.fillStyle = 'rgba(244,241,234,0.42)'; c.beginPath(); c.moveTo(-170, 170); c.lineTo(170, 170); c.lineTo(200, 640); c.lineTo(-200, 640); c.closePath(); c.fill();
        carton(c, -10, 620, 360, { band: HEX.lime });
        c.fillStyle = '#fff6e8'; c.save(); c.translate(70, 480); c.rotate(0.08); c.fillRect(0, 0, 150, 70);
        c.font = font(FAM.monoB(), 18); c.fillStyle = '#2a1d14'; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText('#0417', 10, 26); c.fillText('FLAT 4', 10, 54); c.restore();
        c.restore();
        rainFx(c, t, 0.35, 120);
        S('NOODLES', W * 0.7, H * 0.3, 180, W_(/noodles/), HEX.pink, HEX.ink, { rot: -0.04 });
        S('IN A BAG', W * 0.7, H * 0.5, 120, W_(/bag/), HEX.bone, HEX.ink, { rot: 0.03 });
        return { sung: HEX.pink };
      }
      // ---------------------------------------------------------------- "that's a sale and a wage and a line on the chart, and the chart is glad;"
      case '1.0': {
        const sale = W_(/sale/);
        frame(1, W / 2 + lt * 30, H / 2, () => doorstep(c, g, t, clamp((t - sale) / 0.4)));
        S('SALE', W * 0.76, H * 0.22, 230, sale, HEX.lime, HEX.ink, { rot: -0.05 });
        return { sung: HEX.lime };
      }
      case '1.1': { // two panels: the rider's phone (the wage) | the office screen (a line begins)
        const wage = this.w(this.lines[1]!, /wage/).start, ln = W_(/line/);
        panels(c, [[[0, 0], [W * 0.56, 0], [W * 0.46, H], [0, H]], [[W * 0.56, 0], [W, 0], [W, H], [W * 0.46, H]]], (i) => {
          if (i === 0) {
            this.bokeh(c, g, t, lt);
            c.strokeStyle = '#06040e'; c.lineWidth = 60; c.lineCap = 'round'; c.beginPath(); c.moveTo(120, H + 60); c.lineTo(360, H * 0.74); c.stroke();
            c.fillStyle = '#2a2a3a'; c.beginPath(); c.roundRect(232, H * 0.22 - 8, 316, 536, 38); c.fill();
            c.fillStyle = '#101018'; c.beginPath(); c.roundRect(240, H * 0.22, 300, 520, 34); c.fill();
            c.fillStyle = '#0d2a18'; c.fillRect(260, H * 0.22 + 40, 260, 440);
            const tk = clamp((t - wage) / 0.5);
            c.font = font(FAM.monoB(), 26); c.fillStyle = 'rgba(200,230,200,0.85)'; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText('TODAY', 390, H * 0.22 + 110);
            c.font = font(FAM.monoB(), 76); c.fillStyle = HEX.lime; c.fillText(`+£${(4.1 * ease.outCubic(tk)).toFixed(2)}`, 390, H * 0.22 + 230);
            c.font = font(FAM.mono(), 22); c.fillStyle = 'rgba(200,230,200,0.7)'; c.fillText('1 delivery · 11 min', 390, H * 0.22 + 290);
            glow(g, 390, H * 0.22 + 220, 300, HEX.lime, 0.2);
            rainFx(c, t, 0.3, 90);
            S('WAGE', W * 0.3, H * 0.14, 170, wage, HEX.lime, HEX.ink, { rot: -0.03 });
          } else {
            frame(1.25, W * 0.72, H * 0.42, () => office(c, g, t, 'up', clamp((t - ln) / 1.6)));
            S('LINE', W * 0.78, H * 0.16, 150, ln, HEX.bone, HEX.ink, { rot: 0.03 });
          }
        });
        return { sung: HEX.lime };
      }
      case '1.2': {
        office(c, g, t, 'up', clamp((t - W_(/line/)) / 1.6));
        S('CHART', W * 0.64, H * 0.12, 160, W_(/chart/), HEX.lime, HEX.ink, { rot: -0.04 });
        return { sung: HEX.lime };
      }
      case '1.3': { // Rai, smug, at the glad chart
        sunburst(c, W * 0.66, H * 0.5, HEX.yellow, HEX.lime, 18, t * 0.3); halftone(c, rgbaHex(HEX.ink, 0.12), 24, 'down');
        const k = ease.outBack(clamp(lt / 0.35));
        c.save(); c.translate(W * 0.36, H * 0.86); c.scale(k, k);
        c.strokeStyle = HEX.ink; c.lineWidth = 34; c.lineJoin = 'round'; c.lineCap = 'round';
        c.beginPath(); c.moveTo(0, 0); c.lineTo(180, -90); c.lineTo(300, -50); c.lineTo(560, -460); c.stroke();
        c.fillStyle = HEX.ink; c.beginPath(); c.moveTo(640, -560); c.lineTo(500, -510); c.lineTo(600, -420); c.closePath(); c.fill();
        c.restore();
        for (let i = 0; i < 24; i++) {
          const x = h01(i, 801) * W, y = ((h01(i, 802) * H + lt * 600 * (0.6 + h01(i, 803))) % (H + 100)) - 50;
          c.save(); c.translate(x, y); c.rotate(lt * 4 * (h01(i, 804) - 0.5));
          c.font = font(FAM.hook(), 40 + 40 * h01(i, 805)); c.fillStyle = i % 2 ? HEX.ink : HEX.bone; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('£', 0, 0); c.restore();
        }
        this.raiBig(c, t, W * 0.18, H * 0.58, 150, sh.t0, { face: 'smug', arms: ['cross', 'cross'], marks: ['shine'], tilt: 0.08, look: 0.6, glow: HEX.bone });
        S('GLAD', W * 0.66, H * 0.3, 300, W_(/glad/), HEX.ink, HEX.bone, { rot: -0.05 });
        return { sung: HEX.yellow };
      }
      // ---------------------------------------------------------------- "the same bowl cooked by a dad at the hob after a twelve-hour shift?"
      case '2.0': { // the same noodles: the carton on the doorstep | the bowl on the kitchen table
        panels(c, [[[0, 0], [W * 0.54, 0], [W * 0.46, H], [0, H]], [[W * 0.54, 0], [W, 0], [W, H], [W * 0.46, H]]], (i) => {
          if (i === 0) {
            c.fillStyle = '#16244e'; c.fillRect(0, 0, W, H); halftone(c, rgbaHex(HEX.peri, 0.14), 24, 'down');
            rainFx(c, t, 0.3, 80);
            carton(c, W * 0.24, H * 0.7, 300, { band: HEX.lime });
            c.font = font(FAM.monoB(), 54); c.fillStyle = HEX.lime; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText('£14.50', W * 0.24, H * 0.79);
          } else {
            frame(1.6, W * 0.84, H * 0.8, () => kitchen(c, g, t));
            bowl(c, W * 0.76, H * 0.58, 160, t);
            c.font = font(FAM.monoB(), 54); c.fillStyle = HEX.pink; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText('£0', W * 0.76, H * 0.79);
          }
        });
        S('SAME', W * 0.26, H * 0.16, 190, W_(/same/), HEX.bone, HEX.ink, { rot: -0.04 });
        S('BOWL', W * 0.76, H * 0.16, 190, W_(/bowl/), HEX.yellow, HEX.ink, { rot: 0.03 });
        return { sung: HEX.yellow };
      }
      case '2.1': {
        kitchen(c, g, t);
        wallClock(c, 1720, 560, 60, 8 + 40 / 60);
        person(c, 1060, 1000, 420, 'point', { col: '#120a10', t, rim: rgbaHex('#ffd08a', 0.7) });
        S('DAD', W * 0.5, H * 0.14, 200, W_(/dad/), HEX.orange, HEX.ink, { rot: -0.05 });
        return { sung: HEX.orange };
      }
      case '2.2': {
        frame(1.55, 1060, 560, () => {
          kitchen(c, g, t);
          wallClock(c, 1720, 560, 60, 8 + 42 / 60);
          person(c, 900, 1000, 420, 'slump', { col: '#120a10', t, rim: rgbaHex('#ffd08a', 0.7), emote: 'sigh', emoteT0: sh.t0 + 0.1 });
        });
        S('HOB', W * 0.72, H * 0.2, 220, W_(/hob/), HEX.orange, HEX.ink, { rot: -0.04, t1: W_(/after/) - 0.05 });
        S('AFTER…', W * 0.72, H * 0.2, 180, W_(/after/), HEX.bone, HEX.ink, { rot: 0.03 });
        return { sung: HEX.orange };
      }
      case '2.3': { // the clock runs twelve hours over the hi-vis on the chair | the dad flat out at the table
        const tw = W_(/twelve/);
        panels(c, [[[0, 0], [W * 0.5, 0], [W * 0.5, H], [0, H]], [[W * 0.5, 0], [W, 0], [W, H], [W * 0.5, H]]], (i) => {
          if (i === 0) {
            frame(2.2, 1430, 800, () => kitchen(c, g, t));
            wallClock(c, W * 0.25, H * 0.34, 190, 7 + 12 * ease.inOutCubic(clamp((t - tw) / 0.8)));
          } else {
            frame(1.4, 1700, 820, () => { kitchen(c, g, t); person(c, 1640, 1086, 330, 'seated', { col: '#120a10', t, headTilt: 0.9, emote: 'sweat', emoteT0: sh.t0 }); bowl(c, 1760, 852, 40, t); });
          }
        });
        S('12-HOUR', W * 0.25, H * 0.68, 150, tw, HEX.bone, HEX.ink, { rot: -0.04 });
        S('SHIFT?', W * 0.75, H * 0.2, 190, W_(/shift/), HEX.yellow, HEX.ink, { rot: 0.03 });
        return { sung: HEX.yellow };
      }
      // ---------------------------------------------------------------- "The chart doesn't flicker. It's love, and love's not a thing a chart can lift."
      case '3.0': { // the flat line for home cooking, the analyst asleep, and Rai, cross
        office(c, g, t, 'flat', 1);
        c.fillStyle = 'rgba(120,10,40,0.35)'; c.fillRect(0, 0, W, H);
        focusLines(c, W * 0.8, H * 0.42, 280, 'rgba(255,70,90,0.55)', t, { n: 90 });
        this.raiBig(c, t, W * 0.8, H * 0.6, 150, sh.t0, { face: 'angry', arms: ['fist', 'fist'], marks: ['vein', 'steam'], shake: 0.8, glow: HEX.pink });
        S('0', W * 0.42, H * 0.36, 360, W_(/doesn/), HEX.pink, HEX.ink);
        return { sung: HEX.pink };
      }
      case '3.1': { // the bowl set down for a kid; its steam curls into a heart
        const lv = W_(/love/);
        frame(1.45, 1640, 760, () => {
          kitchen(c, g, t);
          person(c, 1780, 1086, 250, 'seated', { col: '#120a10', t, flip: true, emote: 'heart', emoteT0: lv });
          person(c, 1560, 1086, 420, 'stand', { col: '#120a10', t, headTilt: 0.3, rim: rgbaHex('#ffd08a', 0.6) });
          bowl(c, 1690, 852, 46, t, { heart: clamp((t - lv + 0.15) / 0.45), heartCol: HEX.pink, steam: 'rgba(244,241,234,0.75)' });
        });
        S('LOVE', W * 0.3, H * 0.24, 260, lv, HEX.pink, HEX.ink, { rot: -0.05 });
        return { sung: HEX.pink };
      }
      case '3.2': { // the chart's line reaches out of the screen like a crane, and cannot lift the heart
        office(c, g, t, 'up', 1);
        c.fillStyle = 'rgba(20,10,40,0.35)'; c.fillRect(0, 0, W, H);
        const strain = Math.sin(lt * 18) * 6 * clamp(lt / 0.4), sag = 70 * ease.outCubic(clamp((t - W_(/lift/)) / 0.4));
        c.strokeStyle = HEX.lime; c.lineWidth = 22; c.lineCap = 'round'; c.lineJoin = 'round';
        c.beginPath(); c.moveTo(1500, 300); c.quadraticCurveTo(1200, 160 + sag, 860, 300 + strain + sag * 1.5); c.stroke();
        glow(g, 860, 300 + strain + sag * 1.5, 60, HEX.lime, 0.6);
        c.lineWidth = 6; c.strokeStyle = HEX.bone; c.beginPath(); c.moveTo(860, 300 + strain + sag * 1.5); c.lineTo(860, 560); c.stroke();
        const hx = 860, hy = 680, s = 120;
        c.fillStyle = HEX.pink; c.beginPath(); c.moveTo(hx, hy + s * 0.9);
        c.bezierCurveTo(hx - s * 1.6, hy - s * 0.2, hx - s * 0.6, hy - s * 1.3, hx, hy - s * 0.45);
        c.bezierCurveTo(hx + s * 0.6, hy - s * 1.3, hx + s * 1.6, hy - s * 0.2, hx, hy + s * 0.9); c.fill();
        glow(g, hx, hy, s * 1.4, HEX.pink, 0.25);
        for (let i = 0; i < 3; i++) { const yy = 320 + sag * 1.5 + ((lt * 300 + i * 60) % 180); c.fillStyle = 'rgba(160,220,255,0.8)'; c.beginPath(); c.ellipse(900 + i * 14, yy, 6, 10, 0, 0, TAU); c.fill(); }
        ledger(c, t, 80, 120, 560, [{ label: "DAD'S DINNER", value: '0', care: true, t: W_(/love/, 1) }], { blink: 1, size: 30 });
        S('LIFT', W * 0.78, H * 0.62, 220, W_(/lift/), HEX.lime, HEX.ink, { rot: 0.05 });
        return { sung: HEX.pink };
      }
      // ---------------------------------------------------------------- "A daughter drives to a care home where her father forgets her name,"
      case '4.0': {
        coastRoad(c, g, t, lt);
        car(c, g, lerp(W * 0.18, W * 0.34, ease.outCubic(u)), H * 0.8, 1.9, t, '#3a2a6a');
        rainFx(c, t, 0.3, 120);
        return { sung: HEX.bone };
      }
      case '4.1': {
        carInterior(c, g, t, lt);
        person(c, W * 0.3, H * 1.12, 820, 'seated', { col: '#04040c', t, headTilt: -0.05, rim: rgbaHex(HEX.orange, 0.55) });
        c.strokeStyle = '#04040c'; c.lineWidth = 36; c.beginPath(); c.ellipse(W * 0.55, H * 0.8, 60, 210, 0.15, 0, TAU); c.stroke();
        c.strokeStyle = rgbaHex(HEX.orange, 0.45); c.lineWidth = 4; c.beginPath(); c.ellipse(W * 0.55, H * 0.8, 78, 228, 0.15, -1.6, 0.4); c.stroke();
        S('DAUGHTER', W * 0.62, H * 0.2, 170, W_(/daughter/), HEX.bone, HEX.peri, { rot: -0.03 });
        S('DRIVES', W * 0.62, H * 0.38, 150, W_(/drives/), HEX.yellow, HEX.ink, { rot: 0.03 });
        return { sung: HEX.bone };
      }
      case '4.2': {
        careHomeOutside(c, g, t);
        car(c, g, lerp(-W * 0.05, W * 0.12, ease.outCubic(u)), H * 0.94, 0.9, t, '#3a2a6a');
        S('CARE HOME', W * 0.5, H * 0.12, 140, W_(/care/), HEX.yellow, HEX.ink, { rot: 0.02 });
        return { sung: HEX.yellow };
      }
      case '4.3': { // his room: he doesn't know her; she cries; her name blows away
        const fg = W_(/forgets/), fa = W_(/father/);
        careRoom(c, g, t, 0);
        c.fillStyle = '#7a4a6a'; c.beginPath(); c.roundRect(300, 640, 300, 230, 40); c.fill(); c.beginPath(); c.roundRect(280, 520, 90, 350, 40); c.fill();
        person(c, 420, 990, 400, 'seated', { col: '#140a18', t, headTilt: 0.35, emote: t >= fg ? '?' : undefined, emoteT0: fg });
        person(c, 760, 1000, 470, 'stand', { col: '#140a18', t, flip: true, headTilt: -0.15, emote: t >= fg ? 'tear' : undefined, emoteT0: fg + 0.1 });
        // the name tag on her coat, its name blowing away as dust
        const gone = clamp((t - fg) / 0.9);
        c.save(); c.translate(1440, 760); c.rotate(-0.05);
        c.fillStyle = HEX.bone; c.beginPath(); c.roundRect(-230, -100, 460, 200, 18); c.fill();
        c.fillStyle = HEX.coral; c.beginPath(); c.roundRect(-230, -100, 460, 70, [18, 18, 0, 0]); c.fill();
        c.font = font(FAM.hook(), 42); c.fillStyle = HEX.bone; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('HELLO', 0, -65);
        const name = 'my name is…';
        c.font = font(FAM.serifB(), 64); c.textAlign = 'left';
        let x = -c.measureText(name).width / 2;
        for (let i = 0; i < name.length; i++) {
          const ch = name[i]!, cw = c.measureText(ch).width, d = clamp(gone * 1.6 - (i / name.length) * 0.6);
          c.fillStyle = rgbaHex(HEX.ink, 1 - d);
          c.fillText(ch, x + d * 220 * (0.5 + h01(i, 811)), 30 - d * 160 * h01(i, 812));
          x += cw;
        }
        c.restore();
        S('FATHER', W * 0.5, H * 0.13, 170, fa, HEX.coral, HEX.ink, { rot: -0.03, t1: fg - 0.05 });
        S('FORGETS', W * 0.5, H * 0.13, 190, fg, HEX.bone, HEX.coral, { rot: 0.03 });
        return { sung: HEX.coral };
      }
      // ---------------------------------------------------------------- "she plays him the songs he once taught her; he hums, and it's a win all the same;"
      case '5.0': { // she sets the needle on one of his old records
        frame(2.6, 1000, 590, () => careRoom(c, g, t, clamp((t - W_(/plays/)) / 0.3)));
        c.strokeStyle = '#140a18'; c.lineWidth = 46; c.lineCap = 'round'; c.beginPath(); c.moveTo(W + 60, H * 0.1); c.lineTo(W * 0.8, H * 0.32); c.stroke();
        c.fillStyle = '#140a18'; c.beginPath(); c.arc(W * 0.79, H * 0.33, 34, 0, TAU); c.fill();
        // the sleeve, leaning: a young man with a guitar
        c.save(); c.translate(W * 0.16, H * 0.5); c.rotate(-0.08);
        c.fillStyle = '#c99a60'; c.fillRect(0, 0, 330, 330);
        person(c, 140, 320, 260, 'seated', { col: '#4a2a12' }); guitar(c, 180, 230, 0.9, -0.35, '#4a2a12');
        c.font = font(FAM.serifB(), 34); c.fillStyle = '#4a2a12'; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText('Songs for a Sunday', 20, 44);
        c.restore();
        noteStream(c, t, W * 0.55, H * 0.5, W * 0.5, H * 0.05, [HEX.gold, HEX.pink, HEX.bone], 10, 50);
        S('PLAYS', W * 0.62, H * 0.16, 200, W_(/plays/), HEX.gold, HEX.ink, { rot: -0.04 });
        return { sung: HEX.gold };
      }
      case '5.1': { // years ago, in sepia: he teaches her the songs
        sepiaRoom(c, g, t);
        person(c, 640, 960, 520, 'seated', { col: '#4a2a12', t, headTilt: 0.2 });
        guitar(c, 740, 700, 1.3, -0.35, '#4a2a12');
        person(c, 1060, 900, 260, 'seated', { col: '#4a2a12', t, flip: true, emote: 'music', emoteT0: sh.t0 });
        noteStream(c, t, 780, 600, 1040, 520, ['#4a2a12'], 7, 42);
        const once = W_(/once/);
        S('SONGS', W * 0.72, H * 0.2, 190, W_(/songs/), HEX.ink, HEX.bone, { rot: 0.04, t1: once - 0.05 });
        S('ONCE', W * 0.72, H * 0.2, 220, once, HEX.ink, HEX.bone, { rot: -0.03 });
        return { sung: HEX.gold };
      }
      case '5.2': { // now: he lifts his head and hums; she weeps; Rai, soft, on the sill
        const hm = W_(/hums/);
        careRoom(c, g, t, 1);
        c.fillStyle = '#7a4a6a'; c.beginPath(); c.roundRect(300, 640, 300, 230, 40); c.fill(); c.beginPath(); c.roundRect(280, 520, 90, 350, 40); c.fill();
        person(c, 420, 990, 400, 'seated', { col: '#140a18', t, headTilt: t >= hm ? -0.25 : 0.35, emote: t >= hm ? 'music' : undefined, emoteT0: hm });
        person(c, 760, 990, 380, 'seated', { col: '#140a18', t, flip: true, headTilt: 0.2, emote: 'tears', emoteT0: sh.t0 });
        noteStream(c, t, 980, 560, 560, 300, [HEX.gold, HEX.pink], 8, 44);
        this.raiBig(c, t, 1590, 560 - 1.07 * 62, 62, hm, { face: 'soft', arms: ['cheek', 'cheek'], marks: ['notes'], heart: 0.8, heartColor: HEX.pink, glow: HEX.pink });
        S('TAUGHT HER', W * 0.5, H * 0.13, 150, W_(/taught/), HEX.bone, HEX.ink, { rot: 0.03, t1: hm - 0.05 });
        S('HUMS', W * 0.5, H * 0.13, 230, hm, HEX.gold, HEX.ink, { rot: -0.05 });
        return { sung: HEX.gold };
      }
      case '5.3': {
        sunburst(c, W / 2, H / 2, HEX.yellow, HEX.gold, 18, t * 0.3); halftone(c, rgbaHex(HEX.ink, 0.12), 24, 'down');
        ledger(c, t, W * 0.22, H * 0.36, W * 0.56, [
          { label: 'SONGS FOR DAD', value: '0', care: true, t: sh.t0 },
          { label: 'HE HUMMED ALONG', value: '0', care: true, t: W_(/win/) },
        ], { blink: 1, size: 34, rowH: 70 });
        S('WIN', W * 0.5, H * 0.2, 280, W_(/win/), HEX.ink, HEX.bone, { rot: -0.04 });
        return { sung: HEX.yellow };
      }
      // ---------------------------------------------------------------- "a lifeboat crew heads into the storm and nobody pays them to go;"
      case '6.0': { // the station: the boat slides down the slip into the surf
        lifeboatStation(c, g, t);
        const s = ease.inQuad(clamp(lt / 0.85));
        lifeboat(c, g, lerp(470, 1230, s), lerp(690, 1000, s), 1.5, 0.34, t);
        rainFx(c, t, 0.45, 200);
        S('LIFEBOAT', W * 0.7, H * 0.16, 190, W_(/lifeboat/), HEX.orange, HEX.ink, { rot: -0.03 });
        return { sung: HEX.orange };
      }
      case '6.1': { // the storm (the boat climbs a wall of water) | Rai, determined
        const st = W_(/storm/), fl = pulse(t, st, 0.05);
        panels(c, [[[0, 0], [W * 0.66, 0], [W * 0.6, H], [0, H]], [[W * 0.66, 0], [W, 0], [W, H], [W * 0.6, H]]], (i) => {
          if (i === 0) {
            c.fillStyle = '#0c1438'; c.fillRect(0, 0, W, H);
            if (fl > 0.05) bolt(g, W * 0.42, -20, H * 0.6, 3, fl);
            rainFx(c, t, 0.5, 220, 0.45, 2400, 60);
            stormSea(c, t, H * 0.5, ['#24357e'], 1);
            lifeboat(c, g, W * 0.3, H * 0.56, 1.7, -0.4 + 0.04 * Math.sin(t * 3), t);
            stormSea(c, t + 2, H * 0.74, ['#1a2766', '#0c1238'], 1);
          } else {
            reactionBg(c, 'flat', '#1a1f5a', '#1a1f5a', t);
            mangaSpeed(c, -0.5, 'rgba(255,255,255,0.7)', t, { n: 50 });
            this.raiBig(c, t, W * 0.82, H * 0.56, 120, sh.t0, { face: 'determined', arms: ['fist', 'down'], glow: HEX.orange, tilt: -0.06 });
          }
        });
        S('CREW', W * 0.3, H * 0.64, 200, W_(/crew/), HEX.orange, HEX.ink, { rot: 0.04, t1: st - 0.05 });
        S('STORM', W * 0.3, H * 0.64, 250, st, HEX.bone, HEX.ink, { rot: -0.06 });
        return { sung: HEX.bone, post: mergePost(hitShake(t, [st], 7, 0.35), caKick(t, [st], 5, 0.25), { flash: 0.5 * pulse(t, st, 0.03) }) };
      }
      case '6.2': { // the rota on the station wall: everyone on call, paid nothing; the donation box
        frame(3.2, 470, 470, () => lifeboatStation(c, g, t));
        S('NOBODY PAYS', W * 0.5, H * 0.14, 160, W_(/nobody/), HEX.bone, HEX.ink, { rot: -0.03 });
        return { sung: HEX.bone };
      }
      case '6.3': {
        c.fillStyle = '#060a20'; c.fillRect(0, 0, W, H);
        rainFx(c, t, 0.3, 130);
        stormSea(c, t, H * 0.64, ['#18235c', '#0f173f'], 0.7);
        lifeboat(c, g, lerp(W * 0.56, W * 0.64, u), H * 0.64, 0.55, -0.1, t);
        stormSea(c, t + 3, H * 0.8, ['#0a0f2c'], 0.6);
        S('GO', W * 0.28, H * 0.34, 340, W_(/go/), HEX.orange, HEX.ink, { rot: 0.05 });
        return { sung: HEX.orange };
      }
      // ---------------------------------------------------------------- "the code the internet stands on, kept up at midnight by someone you'll never know."
      case '7.0': {
        frame(2.4, 880, 450, () => coderDesk(c, g, t, (x, y, w, h) => codeWall(c, t, x, y, w, h, rgbaHex(HEX.cyan, 0.85), 18, 5)));
        S('CODE', W * 0.5, H * 0.42, 300, W_(/code/), HEX.yellow, HEX.ink, { rot: -0.03 });
        return { sung: HEX.cyan };
      }
      case '7.1': { // the whole internet resting on one lit window
        flats(c, g, t, W * 0.5, H * 0.66);
        const cx = W * 0.5, cy = H * 0.22, pts: [number, number][] = [];
        for (let i = 0; i < 70; i++) { const a = h01(i, 821) * TAU, r = Math.sqrt(h01(i, 822)); pts.push([cx + Math.cos(a) * r * 720 + 10 * Math.sin(t + i), cy + Math.sin(a) * r * 150]); }
        c.strokeStyle = rgbaHex(HEX.cyan, 0.25); c.lineWidth = 1.5; c.beginPath();
        pts.forEach(([x, y], i) => pts.forEach(([x2, y2], j) => { if (j > i && Math.hypot(x - x2, y - y2) < 150) { c.moveTo(x, y); c.lineTo(x2, y2); } }));
        c.stroke();
        pts.forEach(([x, y], i) => glow(g, x, y, 14, i % 5 ? HEX.cyan : HEX.yellow, 0.8));
        c.strokeStyle = HEX.cyan; c.lineWidth = 3; c.beginPath(); c.moveTo(cx, cy + 150); c.lineTo(W * 0.5, H * 0.64); c.stroke();
        S('INTERNET', W * 0.2, H * 0.5, 120, W_(/internet/), HEX.cyan, HEX.ink, { rot: -0.03 });
        S('STANDS ON', W * 0.8, H * 0.5, 110, W_(/stands/), HEX.bone, HEX.ink, { rot: 0.03 });
        return { sung: HEX.cyan };
      }
      case '7.2': {
        coderDesk(c, g, t, (x, y, w, h) => codeWall(c, t, x, y, w, h, rgbaHex(HEX.cyan, 0.85), 14, 4));
        person(c, 1180, 1080, 600, 'seated', { col: '#02030a', t, flip: true, headTilt: 0.15, rim: rgbaHex(HEX.cyan, 1), emote: 'sweat', emoteT0: sh.t0 + 0.2 });
        S('MIDNIGHT', W * 0.5, H * 0.12, 170, W_(/midnight/), HEX.cyan, HEX.ink, { rot: -0.03 });
        return { sung: HEX.cyan };
      }
      case '7.3': {
        frame(lerp(1.6, 1.0, ease.inOutCubic(u)), W * 0.5, H * 0.66, () => flats(c, g, t, W * 0.5, H * 0.66));
        ledger(c, t, 80, 110, 560, [{ label: 'KEPT IT ALL UP', value: '0', care: true, t: W_(/someone/) }], { blink: 1, size: 28 });
        S('NEVER KNOW', W * 0.66, H * 0.3, 150, W_(/never/), HEX.bone, HEX.ink, { rot: 0.03 });
        return { sung: HEX.bone };
      }
      // ---------------------------------------------------------------- "Then you built a ledger on a million machines so that nobody has to trust:"
      case '8.0':
      case '8.1': { // the chain builds itself in the dark of the data hall
        dataAisle(c, g, t, 0);
        c.fillStyle = 'rgba(6,10,28,0.55)'; c.fillRect(0, 0, W, H);
        const k1 = sh.k === 1, built = this.w(this.lines[8]!, /built/).start;
        const n = Math.min(12, Math.floor((t - built + 0.3) / 0.13) + 1), pan = k1 ? 300 * ease.inOutCubic(u) : 0;
        for (let k = 0; k < n; k++) {
          const x = W * 0.06 + k * 300 - pan, y = H * 0.46 + (k % 2 ? 40 : -40);
          if (k > 0) { c.strokeStyle = HEX.cyan; c.lineWidth = 8; c.beginPath(); c.moveTo(x - 80, y + (k % 2 ? -80 : 80)); c.lineTo(x, y); c.stroke(); }
          c.fillStyle = 'rgba(8,12,30,0.95)'; c.beginPath(); c.roundRect(x, y - 100, 220, 200, 18); c.fill();
          c.strokeStyle = HEX.cyan; c.lineWidth = 4; c.stroke();
          glow(g, x + 110, y, 160, HEX.cyan, 0.08);
          c.font = font(FAM.monoB(), 22); c.fillStyle = HEX.cyan; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText(`BLOCK ${4120 + k}`, x + 18, y - 64);
          for (let r = 0; r < 4; r++) { c.fillStyle = r % 2 ? HEX.lime : rgbaHex(HEX.bone, 0.6); c.fillRect(x + 18, y - 40 + r * 32, 120 + 60 * h01(k, r, 831), 10); }
        }
        if (!k1) S('BUILT', W * 0.5, H * 0.14, 210, built, HEX.bone, HEX.ink, { rot: -0.03 });
        else {
          S('LEDGER', W * 0.5, H * 0.14, 210, W_(/ledger/), HEX.cyan, HEX.ink, { rot: -0.03 });
          const mi = W_(/million/), v = Math.floor(1_000_000 * ease.outExpo(clamp((t - mi) / 0.6)));
          if (t >= mi) { c.font = font(FAM.monoB(), 100); c.textAlign = 'center'; c.fillStyle = HEX.lime; c.fillText(v.toLocaleString('en-GB'), W / 2, H * 0.76); }
        }
        return { sung: HEX.cyan };
      }
      case '8.2': { // down the aisle of the million machines; Rai, wow
        dataAisle(c, g, t, lt * 1.6);
        c.fillStyle = 'rgba(4,6,16,0.85)'; c.fillRect(W * 0.3, H * 0.04, W * 0.4, 130);
        c.font = font(FAM.monoB(), 96); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = HEX.lime; c.fillText('1,000,000', W / 2, H * 0.04 + 66);
        this.raiBig(c, t, W * 0.16, H * 0.62, 130, sh.t0, { face: 'wow', arms: ['up', 'up'], marks: ['sparkle', '!'], hop: 0.3, glow: HEX.cyan });
        S('MACHINES', W * 0.6, H * 0.5, 190, W_(/machines/), HEX.bone, HEX.ink, { rot: 0.03 });
        return { sung: HEX.lime };
      }
      case '8.3': {
        this.hall(c, g, t);
        rackRing(c, g, t, W / 2, H * 0.72, 700, 150, 14, t * 0.25, 1.6);
        S('NOBODY', W * 0.5, H * 0.14, 220, W_(/nobody/), HEX.bone, HEX.ink, { rot: -0.03 });
        S('HAS TO', W * 0.5, H * 0.32, 120, W_(/has/), HEX.yellow, HEX.ink, { rot: 0.03 });
        return { sung: HEX.cyan };
      }
      // ---------------------------------------------------------------- "a stone at the bottom of a sea of code that works 'cause you all agree it must;"
      case '9.0':
      case '9.2': {
        this.hall(c, g, t);
        const cx = W / 2, cy = H * 0.44, sync = sh.k === 2 && t >= W_(/works/);
        rackRing(c, g, sync ? Math.floor(t * 4) / 4 : t, cx, H * 0.74, 720, 150, 14, t * 0.2 + 1, 1.6);
        const stA = sh.k === 0 ? ease.outBack(clamp((t - W_(/stone/)) / 0.35)) : 1;
        if (stA > 0) lightStone(c, g, cx, cy, 150 * stA * (sync ? 1 + 0.05 * Math.sin(t * 12) : 1), t, clamp(stA));
        if (sh.k === 0) {
          const tr = this.w(this.lines[8]!, /trust/).start, st = W_(/stone/);
          S('TRUST', W * 0.5, H * 0.14, 240, tr, HEX.yellow, HEX.ink, { rot: 0.02, t1: st - 0.05 });
          const sk = ease.outCubic(clamp((t - Math.max(tr, sh.t0) - 0.08) / 0.2)) * (t < st ? 1 : 0);
          if (sk > 0) { c.strokeStyle = HEX.pink; c.lineWidth = 24; c.lineCap = 'round'; c.beginPath(); c.moveTo(W * 0.31, H * 0.16); c.lineTo(W * 0.31 + W * 0.38 * sk, H * 0.12); c.stroke(); }
          S('STONE', W * 0.5, H * 0.14, 210, st, HEX.cyan, HEX.ink, { rot: -0.03 });
        } else S('WORKS', W * 0.5, H * 0.14, 230, W_(/works/), HEX.lime, HEX.ink, { rot: 0.03 });
        return { sung: sh.k === 0 ? HEX.cyan : HEX.lime };
      }
      case '9.1': { // the seabed she knows, made of code: the stone of light settles among the reeds
        seabed(c, t, { depth: 0.85, clues: ['stone', 'coin'], shark: false, seed: 4 });
        c.fillStyle = 'rgba(0,30,40,0.45)'; c.fillRect(0, 0, W, H);
        c.font = font(FAM.mono(), 22); c.textAlign = 'center'; c.textBaseline = 'middle';
        for (let i = 0; i < 48; i++) {
          const x = (i + 0.5) * (W / 48), sp = 260 + 360 * h01(i, 841);
          for (let j = 0; j < 20; j++) {
            const y = ((j * 56 + t * sp + h01(i, 842) * 900) % (H + 100)) - 50;
            c.fillStyle = rgbaHex(j % 7 === 0 ? HEX.lime : HEX.cyan, 0.12 + 0.3 * (j / 20));
            c.fillText(h01(i, j, 843) < 0.5 ? '0' : '1', x, y);
          }
        }
        lightStone(c, g, W / 2, lerp(H * 0.3, H * 0.62, ease.outCubic(u)), 130, t, 1);
        S('SEA OF CODE', W * 0.5, H * 0.13, 160, W_(/sea/), HEX.bone, HEX.ink, { rot: -0.03 });
        return { sung: HEX.cyan };
      }
      case '9.3': {
        sunburst(c, W / 2, H * 0.52, HEX.gold, '#c98a2a', 18, t * 0.3); halftone(c, rgbaHex(HEX.ink, 0.12), 24, 'down');
        const ag = W_(/agree/), yw = W_(/you/);
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * TAU, k = clamp((t - Math.max(yw, sh.t0) - 0.02 * i) / 0.2);
          if (k <= 0) continue;
          c.strokeStyle = rgbaHex(HEX.ink, 0.5); c.lineWidth = 4;
          c.beginPath(); c.moveTo(W * 0.5 + Math.cos(a) * 900, H * 0.52 + Math.sin(a) * 600); c.lineTo(W * 0.5 + Math.cos(a) * (900 - 700 * k), H * 0.52 + Math.sin(a) * (600 - 460 * k)); c.stroke();
        }
        lightStone(c, g, W * 0.5, H * 0.52, 160 * (1 + 0.08 * pulse(t, ag, 0.15)), t, 1, HEX.bone);
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * TAU, k = ease.outBack(clamp((t - ag - 0.03 * i) / 0.2));
          if (k <= 0) continue;
          c.save(); c.translate(W * 0.5 + Math.cos(a) * 320, H * 0.52 + Math.sin(a) * 240); c.scale(k, k);
          c.strokeStyle = HEX.ink; c.lineWidth = 12; c.lineCap = 'round'; c.lineJoin = 'round';
          c.beginPath(); c.moveTo(-22, 0); c.lineTo(-6, 18); c.lineTo(26, -20); c.stroke(); c.restore();
        }
        S('YOU ALL', W * 0.5, H * 0.2, 190, yw, HEX.bone, HEX.ink, { rot: 0.02, t1: ag - 0.05 });
        S('AGREE', W * 0.5, H * 0.2, 220, ag, HEX.ink, HEX.bone, { rot: -0.04 });
        return { sung: HEX.gold };
      }
      // ---------------------------------------------------------------- "'cause money is memory, a record of who did what for whom,"
      case '10.0': { // money's forms flip past: a coin, a note, a rai stone
        sunburst(c, W * 0.5, H * 0.5, HEX.yellow, HEX.gold, 18, t * 0.3); halftone(c, rgbaHex(HEX.ink, 0.1), 24, 'down');
        const forms = 3, k = Math.min(forms - 1, Math.floor(lt / 0.28)), fu = (lt % 0.28) / 0.28, sx = Math.abs(Math.cos(fu * Math.PI * 0.5 * (k < forms - 1 ? 1 : 0)));
        c.save(); c.translate(W * 0.24, H * 0.56); c.scale(Math.max(0.05, sx), 1);
        if (k === 0) { c.fillStyle = '#e8c860'; c.beginPath(); c.arc(0, 0, 150, 0, TAU); c.fill(); c.strokeStyle = '#a07a20'; c.lineWidth = 12; c.beginPath(); c.arc(0, 0, 124, 0, TAU); c.stroke(); c.font = font(FAM.hook(), 150); c.fillStyle = '#a07a20'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('£', 0, 8); }
        else if (k === 1) { c.fillStyle = '#9fd6a8'; c.fillRect(-230, -120, 460, 240); c.strokeStyle = '#3a7a4a'; c.lineWidth = 8; c.strokeRect(-210, -100, 420, 200); c.fillStyle = '#3a7a4a'; c.beginPath(); c.arc(0, 0, 60, 0, TAU); c.fill(); c.font = font(FAM.hook(), 70); c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText('20', -190, -30); }
        else stone(c, 0, 0, 170, { seed: 3, heart: HEX.gold, heartA: 0.8 });
        c.restore();
        S('MONEY', W * 0.66, H * 0.3, 250, W_(/money/), HEX.ink, HEX.bone, { rot: -0.04 });
        S('IS', W * 0.66, H * 0.52, 130, W_(/^is$/), HEX.bone, HEX.ink);
        return { sung: HEX.yellow };
      }
      case '10.1': {
        frame(lerp(1.15, 1.0, ease.outCubic(u)), W / 2, H * 0.55, () => archive(c, g, t));
        S('MEMORY', W * 0.5, H * 0.2, 240, W_(/memory/), HEX.pink, HEX.ink, { rot: 0.03 });
        return { sung: HEX.pink };
      }
      case '10.2': { // close on the open ledger: who did what for whom, by hand
        frame(1, W / 2, H / 2, () => archive(c, g, t));
        c.fillStyle = 'rgba(20,12,30,0.55)'; c.fillRect(0, 0, W, H);
        c.save(); c.translate(W / 2, H * 0.42); c.rotate(-0.02);
        c.fillStyle = '#f2e6c8'; c.fillRect(-700, -300, 1400, 600);
        c.strokeStyle = 'rgba(80,50,30,0.6)'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -300); c.lineTo(0, 300); c.stroke();
        c.restore();
        c.save(); c.beginPath(); c.rect(W / 2 - 680, H * 0.42 - 280, 1360, 560); c.clip();
        recordScroll(c, W / 2 - 680, H * 0.42 - 280, 1360, 560, (t - this.ctx.start) * 2.4, { size: 32, t, header: true, ink: '#2a1d14' });
        c.restore();
        S('WHO DID WHAT', W * 0.5, H * 0.82, 130, W_(/who/), HEX.yellow, HEX.ink, { rot: 0.02 });
        return { sung: HEX.yellow };
      }
      case '10.3': { // the record runs up into the dark, endless
        archive(c, g, t);
        c.fillStyle = 'rgba(20,12,30,0.6)'; c.fillRect(0, 0, W, H);
        c.save(); c.translate(W / 2, H * 0.98); c.scale(lerp(0.75, 0.45, u), lerp(0.75, 0.45, u));
        c.fillStyle = '#f2e6c8'; c.fillRect(-540, -3000, 1080, 3000);
        recordScroll(c, -520, -3000, 1040, 3000, (t - this.ctx.start) * 14, { size: 30, header: false, ink: '#2a1d14' });
        c.restore();
        gradientV(c, 'rgba(28,20,40,1)', 'rgba(28,20,40,0)', 0, 0, W, H * 0.5);
        S('FOR WHOM', W * 0.5, H * 0.2, 200, W_(/whom/), HEX.pink, HEX.ink, { rot: -0.03 });
        return { sung: HEX.pink };
      }
      // ---------------------------------------------------------------- "so who keeps the record? And who got left out of the room?"
      case '11.0': {
        archive(c, g, t);
        person(c, 640, 1000, 460, 'read', { col: '#0c0610', t, headTilt: -0.4, rim: rgbaHex('#ffe0a0', 0.6) });
        S('WHO KEEPS', W * 0.62, H * 0.2, 180, W_(/keeps/), HEX.yellow, HEX.ink, { rot: -0.04 });
        return { sung: HEX.yellow };
      }
      case '11.1': { // the record's care rows dim | Rai, sad
        panels(c, [[[0, 0], [W * 0.66, 0], [W * 0.6, H], [0, H]], [[W * 0.66, 0], [W, 0], [W, H], [W * 0.6, H]]], (i) => {
          if (i === 0) {
            c.fillStyle = HEX.deep; c.fillRect(0, 0, W, H); halftone(c, rgbaHex(HEX.peri, 0.1), 24, 'down');
            c.fillStyle = 'rgba(14,11,26,0.94)'; c.beginPath(); c.roundRect(60, H * 0.26, W * 0.56, H * 0.5, 26); c.fill();
            recordScroll(c, 80, H * 0.26 + 20, W * 0.56 - 40, H * 0.5 - 40, 40, { size: 26, header: true, careA: lerp(1, 0.15, ease.inOutCubic(u)), blink: 1, t });
          } else {
            reactionBg(c, 'rays', '#14103a', '#2a2468', t);
            this.raiBig(c, t, W * 0.82, H * 0.6, 110, sh.t0, { face: 'sad', arms: ['down', 'down'], marks: ['gloom'], glow: HEX.peri });
          }
        });
        S('THE RECORD?', W * 0.34, H * 0.13, 160, W_(/record/), HEX.pink, HEX.ink, { rot: 0.02 });
        return { sung: HEX.pink };
      }
      case '11.2': { // the record room: the keepers at their table; the care rows drift out; the door swings to
        const lo = W_(/left/), open = 1 - 0.6 * ease.inOutCubic(u);
        recordRoom(c, g, t, open, (x, y, w, h) => {
          c.fillStyle = '#e8d8a8'; c.fillRect(x + 40, y + 60, w - 80, 220);
          recordScroll(c, x + 50, y + 70, w - 100, 200, 60, { size: 16, header: false, careA: 0, ink: '#2a1d14' });
          c.fillStyle = '#5a3a24'; c.fillRect(x - 20, y + 560, w + 40, 30);
          for (let k = 0; k < 4; k++) person(c, x + 70 + k * 130, y + 720, 260, 'seated', { col: '#2a1830', t, seed: k, flip: k % 2 === 1 });
        });
        for (let i = 0; i < 8; i++) {
          const k = clamp((t - lo + 0.4 - 0.06 * i) / 0.9);
          const x = 300 + 560 * 0.7 + k * (520 + 120 * h01(i, 851)), y = 220 + i * 74 + 30 * Math.sin(i + t);
          c.font = font(FAM.mono(), 26); c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = rgbaHex(HEX.pink, 0.95 - 0.3 * k);
          c.fillText(['DAD · the same bowl · 0', 'DAUGHTER · songs · 0', 'CREW · the storm · 0', 'SOMEONE · the code · 0', 'MOTHER · a fever · 0', 'NEIGHBOUR · a lift · 0', 'MUM · a story · 0', 'RAI · remembered · 0'][i]!, x, y);
        }
        S('LEFT OUT', W * 0.74, H * 0.13, 190, lo, HEX.pink, HEX.ink, { rot: -0.04 });
        return { sung: HEX.pink };
      }
      case '11.3': { // outside the shut door, in the dark: everyone from tonight, holding their zeros; Rai, serious
        recordRoom(c, g, t, 0, () => {});
        const glowUp = 0.5 + 0.5 * ease.inQuad(u);
        const folk: [number, number, Emote | undefined, string][] = [[760, 430, 'sigh', HEX.pink], [930, 390, 'tear', HEX.pink], [1090, 440, undefined, HEX.orange], [1250, 400, 'sweat', HEX.cyan], [1410, 420, 'heart', HEX.pink]];
        folk.forEach(([x, h, em, jacket], i) => {
          person(c, x, 900, h, i === 3 ? 'slump' : 'stand', { col: i === 2 ? '#3a1a08' : '#0a0612', t, seed: i, rim: rgbaHex(jacket, 0.75 + 0.25 * glowUp), emote: em, emoteT0: sh.t0 + 0.1 * i });
          const zx = x + 14 * h / 100, zy = 900 - 50 * h / 100;
          c.font = font(FAM.monoB(), 54); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = rgbaHex(HEX.pink, 0.6 + 0.4 * glowUp); c.fillText('0', zx, zy);
          glow(g, zx, zy, 90, HEX.pink, 0.35 * glowUp);
        });
        person(c, 1560, 900, 240, 'stand', { col: '#0a0612', t, seed: 9, rim: rgbaHex(HEX.pink, 0.75 + 0.25 * glowUp) });
        this.raiBig(c, t, 1720, 900 - 1.07 * 78, 78, sh.t0, { face: 'serious', arms: ['cross', 'cross'], glow: HEX.pink, heart: 0.4 + 0.6 * glowUp, heartColor: HEX.pink });
        return { sung: HEX.pink };
      }
    }
    return { sung: HEX.yellow };
  }

  /** Night-city bokeh: soft discs of neon drifting behind a close-up. */
  bokeh(c: C2, g: C2, t: number, lt: number) {
    c.fillStyle = '#1a1030'; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 22; i++) {
      const col = [HEX.pink, HEX.cyan, HEX.yellow, HEX.violet, HEX.orange][i % 5]!;
      const x = ((h01(i, 1111) * W * 1.3 - lt * 260) % (W * 1.3) + W * 1.3) % (W * 1.3) - 150, y = h01(i, 1112) * H * 0.85, r = 40 + 70 * h01(i, 1113);
      c.fillStyle = rgbaHex(col, 0.16); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
      c.strokeStyle = rgbaHex(col, 0.25); c.lineWidth = 3; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
      glow(g, x, y, r * 1.3, col, 0.06);
    }
    rainFx(c, t, 0.3, 90);
  }

  /** The vast dark hall of the ring of machines: a floor that mirrors their lights, and haze. */
  hall(c: C2, g: C2, t: number) {
    const bg = c.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#05081a'); bg.addColorStop(0.62, '#10245a'); bg.addColorStop(0.63, '#0a1638'); bg.addColorStop(1, '#03050f');
    c.fillStyle = bg; c.fillRect(-50, -50, W + 100, H + 100);
    c.strokeStyle = 'rgba(111,140,255,0.16)'; c.lineWidth = 2;
    for (let k = -12; k <= 12; k++) { c.beginPath(); c.moveTo(W / 2 + k * 40, H * 0.63); c.lineTo(W / 2 + k * 240, H + 40); c.stroke(); }
    for (let k = 1; k < 9; k++) { const y = H * 0.63 + (H * 0.37) * Math.pow(k / 9, 2); c.beginPath(); c.moveTo(-50, y); c.lineTo(W + 50, y); c.stroke(); }
    glow(g, W / 2, H * 0.6, 900, HEX.peri, 0.08);
    void t;
  }
}

