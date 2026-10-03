// v2 `dollhouse` (104.95-117.80, lines 28-31): Pigou's paradox in the doll's house. The fever blurs the bedroom into
// the girl's doll's house on her dresser, at doll height, the bedside lamp huge and soft behind it and the
// electricity bill (£82.40) leaning on the dresser beside it like a billboard. Chibi Rai rides along. Cuts on the
// beat or the word:
//
//   D1 "Marry your housekeeper,": the blur clears on the parlour. The man doll holds out a ring box; it opens on
//      "housekeeper"; the housekeeper (apron, frilled cap, tiny mop) puts a hand to her heart; a veil, confetti.
//      Rai on the roof: a smile, then in love (hearts).
//   D2 "the income drops:": the front door, the paper INCOME tag hanging on it, £21,400. On "drops" its string slips,
//      it drops and flips: £0. Rai, above it on the roof: shock (!?), a hop.
//   D3 "same floors, same love, same clock, the counting stops;": BEFORE | AFTER, side by side, the same camera sliding
//      across the same rooms in both: the same floor mopped, the same two dolls holding hands (a heart), the same
//      cuckoo clock; only the coin meter differs: BEFORE it counts her wages, AFTER it reads 00000 and its STOP flag
//      drops on "stops". (Before is an old photo's sepia, a WAGES packet on the mantel; after, the wedding photo.)
//      Rai sits on the post between them: a deadpan shrug.
//   D4 "pay a stranger,": the door opens and a stranger doll walks in with a mop and a bucket; the wife pays him a
//      coin; he mops the floor she has just mopped. Rai on the roof: deadpan, arms crossed.
//   D5 "watch the number climb;": the coin meter: its wheels roll up 00000 to 21400, coins tinkling out into its tray.
//      Rai sits on top of the meter, deadpan, a sweat drop.
//   D6 "your meter's measuring the wrong kind of time.": the cuckoo clock beside it: its doors open on "measuring",
//      the bird springs out, turns to the meter, and pecks it on "wrong", "kind" and "time": the glass cracks, the
//      wheels garble. Rai facepalms (a poof). The dream ripples out into the flood.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../../engine/scene';
import { Layer2D, W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import type { Line, Word } from '../../engine/lyrics';
import { clamp, ease, lerp } from '../../engine/util';
import { drawRai, h01, type RaiOpts } from '../_rai';
import { FAM, TAU, rgbaHex, mixHex } from '../_motifs';
import { poof, star4 } from '../_manga';
import { mergePost, punch } from '../_post';
import { bubbleLyric, clearGlowBand } from './_diver';
import { handLine, billPaper } from './fever-room';
import { dollHouse, roofY, DH, loveHeart, type HouseState } from './dollhouse-house';
import { Lens, SoftLayer } from './fever-lens';

type C2 = CanvasRenderingContext2D;
interface HCam { x: number; y: number; s: number }
const wd = (l: Line, re: RegExp, nth = 0): Word => l.words.filter((w) => re.test(w.w.toLowerCase()))[nth] ?? l.words[0]!;
const pulse = (t: number, t0: number, d = 0.16) => (t < t0 || t > t0 + d ? 0 : Math.sin(Math.PI * (t - t0) / d));
const hcLerp = (a: HCam, b: HCam, u: number): HCam => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), s: a.s * Math.pow(b.s / a.s, u) });

export default class Dollhouse extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  S = new SoftLayer();
  lens = new Lens();
  lines: Line[] = [];
  T: Record<string, number> = {};
  cuts: number[] = [];
  now = 0;

  override init() {
    const { lyrics: ly, audio: au, start } = this.ctx;
    const a = ly.get('Marry your housekeeper'), b = ly.get('same floors'), c = ly.get('pay a stranger'), d = ly.get("measuring the wrong");
    this.lines = [a, b, c, d];
    const nearBeat = (s: number) => au.timeOfBeat(Math.round(au.beatAt(s)));
    const T = this.T;
    T.marry = wd(a, /marry/).start; T.keeper = wd(a, /housekeeper/).start; T.income = wd(a, /income/).start; T.drops = wd(a, /drops/).start;
    T.same1 = wd(b, /same/, 0).start; T.floors = wd(b, /floors/).start; T.same2 = wd(b, /same/, 1).start; T.love = wd(b, /love/).start;
    T.same3 = wd(b, /same/, 2).start; T.clock = wd(b, /clock/).start; T.counting = wd(b, /counting/).start; T.stops = wd(b, /stops/).start;
    T.pay = wd(c, /pay/).start; T.stranger = wd(c, /stranger/).start; T.watch = wd(c, /watch/).start; T.number = wd(c, /number/).start;
    T.climb = wd(c, /climb/).start; T.climbEnd = wd(c, /climb/).end;
    T.your = d.words[0]!.start; T.meter = wd(d, /meter/).start; T.measuring = wd(d, /measuring/).start; T.wrong = wd(d, /wrong/).start;
    T.kind = wd(d, /kind/).start; T.time = wd(d, /time/).start;
    this.cuts = [start, nearBeat(T.income), nearBeat(T.floors) <= T.floors ? nearBeat(T.floors) : T.floors - 0.1, T.pay - 0.02, T.watch - 0.02, T.your - 0.02];
  }

  /** The soft room behind the doll's house (drawn at quarter resolution and blurred): the bedside lamp huge and warm
   *  at the upper left, the window's moon, the glow-in-the-dark stars as bokeh. Parallax with the camera. */
  backdrop(s: C2, t: number, cam: HCam, k = 1) {
    const ox = -cam.x * 0.12 * k, oy = -(cam.y + 250) * 0.08 * k;
    const wg = s.createLinearGradient(0, 0, 0, H);
    wg.addColorStop(0, '#1a1222'); wg.addColorStop(1, '#3a2630');
    s.fillStyle = wg; s.fillRect(0, 0, W, H);
    // the lamp: its shade a soft glowing trapezoid, its light a huge warm disc
    const lx = 430 + ox, ly = 250 + oy;
    const lg = s.createRadialGradient(lx, ly, 30, lx, ly, 820);
    lg.addColorStop(0, 'rgba(255,214,150,1)'); lg.addColorStop(0.18, 'rgba(255,170,90,0.75)'); lg.addColorStop(0.55, 'rgba(160,80,60,0.25)'); lg.addColorStop(1, 'rgba(60,30,40,0)');
    s.fillStyle = lg; s.fillRect(0, 0, W, H);
    s.fillStyle = 'rgba(255,236,190,0.9)'; s.beginPath(); s.moveTo(lx - 260, ly + 120); s.lineTo(lx + 260, ly + 120); s.lineTo(lx + 160, ly - 220); s.lineTo(lx - 160, ly - 220); s.closePath(); s.fill();
    // the window and its moon, cool, far right
    const wx = 1640 + ox * 0.7, wy = 210 + oy;
    s.fillStyle = '#121a48'; s.fillRect(wx - 200, wy - 170, 400, 340);
    s.fillStyle = '#f6efd8'; s.beginPath(); s.arc(wx + 70, wy - 60, 46, 0, TAU); s.fill();
    s.fillStyle = 'rgba(150,110,170,0.8)'; s.fillRect(wx - 250, wy - 200, 70, 420); s.fillRect(wx + 180, wy - 200, 70, 420);
    // bokeh: the stars on the wall, the moonlight
    for (let i = 0; i < 18; i++) { const x = (h01(i, 501) * W * 1.2 - 100 + ox * 1.4), y = 60 + 520 * h01(i, 502) + oy; s.fillStyle = `rgba(200,255,170,${0.22 + 0.1 * Math.sin(t + i)})`; s.beginPath(); s.arc(x, y, 14 + 12 * h01(i, 503), 0, TAU); s.fill(); }
  }

  /** The dresser's top, sharp, from the house's base towards us; the bill leaning on the left. */
  dresserTop(c: C2) {
    const tg = c.createLinearGradient(0, 30, 0, 700);
    tg.addColorStop(0, '#6a4630'); tg.addColorStop(1, '#3a2418');
    c.fillStyle = tg; c.fillRect(-3000, 30, 6000, 1200);
    c.strokeStyle = 'rgba(30,14,8,0.35)'; c.lineWidth = 3;
    for (let k = 0; k < 9; k++) { const y = 46 + k * k * 9; c.beginPath(); c.moveTo(-3000, y); for (let x = -3000; x <= 3000; x += 200) c.lineTo(x, y + 6 * Math.sin(x * 0.004 + k)); c.stroke(); }
    c.fillStyle = 'rgba(0,0,0,0.4)'; c.beginPath(); c.ellipse(0, 40, 600, 22, 0, 0, TAU); c.fill();
    // the bill, enormous at doll scale, propped on her little jewellery box beside the house
    jewelBox(c, -700, 34);
    c.save(); c.translate(-712, -214); c.rotate(0.1); billPaper(c, 0, 0, 3.7); c.restore();
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t, T = this.T;
    this.now = t;
    const shot = Math.max(0, this.cuts.filter((x) => t >= x).length - 1), s0 = this.cuts[shot]!, s1 = this.cuts[shot + 1] ?? this.ctx.end, lt = t - s0;
    const diptych = shot === 2;
    this.L.clear(diptych ? HEX.ink : undefined); this.G.clear(); if (!diptych) this.S.clear('#1a1222');
    let post: PostOverrides = { bloom: 0.7, vignette: 0.45 };
    let amp = 0, blur = 0, warm = 0;

    // the house's state through the plate
    const married = t >= T.keeper + 0.6;
    const meterVal = t < T.drops ? 21400 + Math.floor((t - this.ctx.start) * 3) : t < T.watch + 0.4 ? 0
      : Math.round(21400 * ease.outCubic(clamp((t - (T.number - 0.05)) / (T.climbEnd - T.number - 0.2))));
    const pecks = [T.wrong, T.kind, T.time];
    const peck = Math.max(...pecks.map((p) => pulse(t, p - 0.04, 0.18)));
    const nPecked = pecks.filter((p) => t >= p).length;
    const st = (before = false): HouseState => ({
      t, light: 1, before,
      man: { x: -215, pose: t < T.income ? 'ring' : 'hands', flip: false },
      keeper: {
        x: -70, flip: true, pose: t < T.marry + 0.3 ? 'mop' : t < T.income ? 'stand' : 'hands', mopU: t * 0.45,
        veil: before ? 0 : clamp((t - (T.keeper + 0.55)) / 0.3), emote: t > T.keeper + 0.3 && t < T.income ? 'heart' : undefined, emoteT0: T.keeper + 0.3,
      },
      ringBox: clamp((t - T.keeper) / 0.2), confetti: before ? undefined : T.keeper + 0.6,
      tag: { flip: before ? 0 : ease.inOutCubic(clamp((t - (T.drops + 0.02)) / 0.14)), drop: before ? 0 : clamp((t - T.drops) / 0.3) },
      meter: { value: before ? 21400 + Math.floor((t - this.ctx.start) * 3) : meterVal, stopped: before ? 0 : t < T.watch ? clamp((t - T.stops) / 0.25) : 1 - clamp((t - T.watch) / 0.2) },
      shine: 0, attic: 1,
    });

    if (shot === 0) {
      // D1: the parlour; the ring, the veil, the confetti. The fever's blur clears.
      const cam = hcLerp({ x: -200, y: -180, s: 1.58 }, { x: -186, y: -176, s: 1.68 }, ease.inOutQuad(clamp(lt / (s1 - s0))));
      const s = this.S.ctx; this.backdrop(s, t, cam);
      const state = st();
      this.house(c, g, cam, state, () => {
        const love = t >= T.keeper + 0.15;
        this.rai(c, -546, cam, { face: love ? 'love' : 'smile', arms: love ? ['cheek', 'cheek'] : ['down', 'wave'], marks: love ? ['hearts'] : [], markT0: T.keeper + 0.2, tilt: -0.18, look: 0.8 });
      });
      const u = clamp(lt / 0.75);
      blur = 26 * Math.pow(1 - u, 2); amp = 0.7 * (1 - ease.outCubic(u)); warm = 0.25 * (1 - u);
      void married;
    } else if (shot === 1) {
      // D2: the door and its INCOME tag: £21,400 drops to £0. Rai: shock.
      const cam = hcLerp({ x: -420, y: -292, s: 1.8 }, { x: -426, y: -292, s: 1.88 }, ease.outQuad(clamp(lt / (s1 - s0))));
      const s = this.S.ctx; this.backdrop(s, t, cam);
      const shock = t >= T.drops + 0.04;
      this.house(c, g, cam, st(), () => {
        if (shock) burst(c, -546, -470, 62, 120, t, T.drops + 0.04);
        const hop = shock ? 0.5 * Math.max(0, Math.sin(Math.PI * clamp((t - T.drops - 0.04) / 0.22))) : 0;
        this.rai(c, -546, cam, {
          face: shock ? 'shock' : 'love', arms: shock ? ['up', 'up'] : ['cheek', 'cheek'], marks: shock ? ['!?', 'sweat'] : ['hearts'],
          markT0: shock ? T.drops + 0.06 : T.keeper + 0.2, tilt: -0.18, hop, squash: shock && hop < 0.05 ? -0.2 : 0, look: 0.6,
        });
      });
      post = mergePost(post, punch(t, [T.drops + 0.05], 0.03));
    } else if (shot === 2) {
      // D3: BEFORE | AFTER, the same camera sliding over the same rooms
      const keys: [number, HCam][] = [
        [s0, { x: -110, y: -110, s: 2.5 }], [T.floors + 0.2, { x: -96, y: -112, s: 2.6 }],
        [T.same2 - 0.05, { x: -128, y: -150, s: 2.4 }], [T.love + 0.25, { x: -132, y: -154, s: 2.5 }],
        [T.same3 - 0.08, { x: 296, y: -244, s: 2.7 }], [T.clock + 0.15, { x: 300, y: -240, s: 2.8 }],
        [T.counting - 0.05, { x: 404, y: -226, s: 2.9 }], [s1, { x: 410, y: -224, s: 3.05 }],
      ];
      let cam = keys[0]![1];
      for (let i = 0; i < keys.length - 1; i++) { const [ta, ca] = keys[i]!, [tb, cb] = keys[i + 1]!; if (t >= ta) cam = hcLerp(ca, cb, ease.inOutCubic(clamp((t - ta) / (tb - ta)))); }
      for (const before of [true, false]) {
        const px = before ? 0 : W / 2;
        c.save(); g.save();
        for (const k of [c, g]) { k.beginPath(); k.rect(px, 0, W / 2, H); k.clip(); k.translate(px + W / 4, H / 2 - 30); k.scale(cam.s, cam.s); k.translate(-cam.x, -cam.y); }
        c.fillStyle = '#20162a'; c.fillRect(-3000, -3000, 6000, 6000);
        this.dresserTop(c);
        const state = st(before);
        const hands = t >= T.same2 - 0.1;
        state.man = { x: -190, pose: hands ? 'hands' : 'stand', flip: false };
        state.keeper = { x: -84, flip: true, pose: hands ? 'hands' : 'mop', mopU: t * 0.6, veil: before ? 0 : 1, emote: hands ? 'heart' : undefined, emoteT0: T.love };
        state.shine = clamp((t - T.floors) / 0.3);
        state.confetti = undefined;
        dollHouse(c, g, 0, 0, 1, state);
        if (hands) loveHeart(c, -137, -250 + 10 * Math.sin(t * 3), 22, clamp((t - T.love) / 0.2));
        c.restore(); g.restore();
        if (before) { // the old photograph: sepia and a little fade
          c.save(); c.beginPath(); c.rect(0, 0, W / 2, H); c.clip();
          c.globalCompositeOperation = 'color'; c.fillStyle = 'rgba(160,118,70,0.9)'; c.fillRect(0, 0, W / 2, H);
          c.globalCompositeOperation = 'source-over'; c.fillStyle = 'rgba(80,50,20,0.12)'; c.fillRect(0, 0, W / 2, H);
          c.restore();
        }
      }
      // the post between them, the paper labels, and Rai on top of the post
      panelDivider(c, g, t);
      const shrug = Math.max(pulse(t, T.same1, 0.35), pulse(t, T.same2, 0.35), pulse(t, T.same3, 0.35));
      const sass = t >= T.counting;
      drawRai(c, W / 2, 238 - 1.07 * 70 - 22 * shrug, 70, {
        t, sd: true, face: sass ? 'sassy' : 'deadpan', arms: ['shrug', 'shrug'], armsFrom: ['down', 'down'], armsU: sass ? 1 : shrug,
        marks: sass ? ['sweat'] : [], markT0: T.counting + 0.1, tilt: sass ? 0.12 : 0.04 * Math.sin(t * 3), squash: shrug > 0.6 ? 0.15 : 0,
      });
      post = mergePost(post, punch(t, [T.stops], 0.015));
    } else if (shot === 3) {
      // D4: pay a stranger: the door opens, he walks in with a mop and bucket, she pays him a coin, he mops
      const cam = hcLerp({ x: 50, y: -202, s: 1.56 }, { x: 34, y: -198, s: 1.62 }, ease.inOutQuad(clamp(lt / (s1 - s0))));
      const s = this.S.ctx; this.backdrop(s, t, cam);
      const state = st();
      const door = ease.inOutCubic(clamp((t - (T.pay + 0.02)) / 0.25));
      const walk = ease.inOutQuad(clamp((t - (T.pay + 0.25)) / 0.75));
      const paid = T.stranger + 0.55;
      state.door = door;
      state.man = { x: -60, pose: 'stand', flip: true };
      state.keeper = { x: 40, pose: t >= paid - 0.3 && t < paid + 0.35 ? 'pay' : 'stand', flip: true, veil: 1 };
      state.stranger = { x: lerp(-400, -250, walk), show: clamp((t - (T.pay + 0.2)) / 0.12), pose: t > paid + 0.3 ? 'mop' : 'stand', mopU: t * 0.8, bucket: true, hop: walk > 0 && walk < 1 ? 0.15 * Math.abs(Math.sin(walk * Math.PI * 4)) : 0, emote: t > paid + 0.4 ? 'music' : undefined, emoteT0: paid + 0.4 };
      state.shine = 1;
      state.confetti = undefined;
      this.house(c, g, cam, state, () => {
        // the coin, flipped from her hand to his
        const u = clamp((t - paid) / 0.4);
        if (u > 0 && u < 1) {
          const x = lerp(-10, -230, u), y = -100 - Math.sin(u * Math.PI) * 120;
          c.save(); c.translate(x, y); c.scale(Math.abs(Math.cos(u * 18)) * 0.8 + 0.2, 1); c.fillStyle = '#f2c94c'; c.beginPath(); c.arc(0, 0, 12, 0, TAU); c.fill(); c.strokeStyle = '#a8842a'; c.lineWidth = 2; c.stroke(); c.restore();
          star4(g, x, y, 18, rgbaHex('#fff6c8', 0.9));
        }
        this.rai(c, 546, cam, { face: 'deadpan', arms: ['cross', 'cross'], armsFrom: ['down', 'down'], armsU: clamp((t - T.pay) / 0.2), marks: t > T.stranger ? ['sweat'] : [], markT0: T.stranger + 0.1, tilt: 0.18, look: -0.8 });
      });
    } else if (shot === 4) {
      // D5: watch the number climb: the meter's wheels roll up, coins tinkle out; Rai sits on top of it, deadpan
      const cam = hcLerp({ x: 376, y: -232, s: 2.85 }, { x: 386, y: -236, s: 3.05 }, ease.inOutQuad(clamp(lt / (s1 - s0))));
      const s = this.S.ctx; this.backdrop(s, t, cam, 1.5);
      const state = st();
      state.man = null; state.keeper = null;
      state.meter = { value: meterVal, spin: t > T.number - 0.05 && t < T.climbEnd - 0.3 ? 0.8 : 0, stopped: 1 - clamp((t - (T.watch + 0.05)) / 0.2) };
      state.coins = { t0: T.number + 0.1, n: 16 };
      state.door = 1; state.shine = 1;
      this.house(c, g, cam, state, () => {
        this.raiOnMeter(c, { face: 'deadpan', arms: ['cross', 'cross'], marks: ['sweat'], markT0: T.number + 0.3, look: 0.2 }, t);
      });
      post = mergePost(post, punch(t, [T.number + 0.1], 0.012));
    } else {
      // D6: the cuckoo pecks the meter; Rai facepalms; the dream ripples out
      const cam = hcLerp({ x: 352, y: -270, s: 2.5 }, { x: 372, y: -262, s: 2.85 }, ease.inOutQuad(clamp(lt / (s1 - s0))));
      const s = this.S.ctx; this.backdrop(s, t, cam, 1.5);
      const state = st();
      state.man = null; state.keeper = null; state.door = 1; state.shine = 1;
      state.cuckoo = { out: ease.outBack(clamp((t - T.measuring) / 0.25)), peck };
      state.meter = { value: 21400, jolt: peck, cracked: clamp(nPecked / 2), garble: nPecked >= 3 ? 1 : nPecked >= 2 ? 0.3 : 0 };
      state.coins = { t0: T.number + 0.1 - 100, n: 0 };
      this.house(c, g, cam, state, () => {
        const palm = t >= T.time + 0.02;
        const face = palm ? 'deadpan' : t >= T.wrong ? 'shock' : t >= T.measuring + 0.2 ? 'deadpan' : 'deadpan';
        this.raiOnMeter(c, {
          face, arms: palm ? ['down', 'facepalm'] : t >= T.wrong ? ['up', 'up'] : ['cross', 'cross'],
          marks: palm ? ['gloom'] : t >= T.wrong ? ['!'] : t >= T.measuring + 0.2 ? ['?'] : [], markT0: palm ? T.time + 0.05 : t >= T.wrong ? T.wrong : T.measuring + 0.2,
          look: palm ? 0 : -0.9, shake: peck * 0.6,
        }, t, palm ? clamp((t - T.time) / 0.15) : 0);
        poof(c, DH.meter.x, -302 - 60, 70, t, T.time + 0.02);
      });
      post = mergePost(post, punch(t, pecks.map((p) => p + 0.02), 0.014));
      // the dream ripples out (the bedroom floods in `dream`)
      const r = clamp((t - (this.ctx.end - 0.45)) / 0.45);
      amp = ease.inQuad(r); blur = 16 * ease.inQuad(r); warm = 0.1 * r;
    }
    // the sung line (the comic stretch: the default yellow)
    const line = handLine(this.lines, t);
    if (line) bubbleLyric(c, line, t);
    clearGlowBand(g);
    this.lens.draw(renderer, out, this.L.upload(), this.G.upload(), diptych ? null : this.S.upload(9), { t, amp, blur, warm });
    return post;
  }

  /** Draw the dresser top and the house under a house camera, then `extra` in house units. */
  house(c: C2, g: C2, cam: HCam, state: HouseState, extra?: () => void) {
    c.save(); g.save();
    for (const k of [c, g]) { k.translate(W / 2, H / 2); k.scale(cam.s, cam.s); k.translate(-cam.x, -cam.y); }
    this.dresserTop(c);
    dollHouse(c, g, 0, 0, 1, state);
    extra?.();
    c.restore(); g.restore();
  }

  /** Chibi Rai sitting on the roof's slope at house-x (house units). */
  rai(c: C2, x: number, cam: HCam, o: Partial<RaiOpts>) {
    const R = 44, feet = roofY(x) + 8;
    drawRai(c, x, feet - 1.07 * R - (o.hop ?? 0) * R, R, { t: this.now, ...o, hop: 0, sd: true } as RaiOpts);
    void cam;
  }

  /** Chibi Rai sitting on top of the coin meter; `palm` 0..1 her big facepalm hand. */
  raiOnMeter(c: C2, o: Partial<RaiOpts>, t: number, palm = 0) {
    const R = 36, x = DH.meter.x, feet = DH.meter.y - 72;
    const a = drawRai(c, x, feet - 1.07 * R, R, { t, ...o, sd: true } as RaiOpts);
    if (palm > 0) { // her hand over her face, the chibi way: a stubby arm up to a round palm over one eye
      const hx = a.head.x + 0.28 * a.head.r, hy = a.head.y - 0.05 * a.head.r, k = ease.outBack(palm);
      c.save(); c.lineCap = 'round';
      c.strokeStyle = '#3a2f2a'; c.lineWidth = 0.2 * R; c.beginPath(); c.moveTo(x + 0.45 * R, feet - 1.07 * R - 0.1 * R); c.quadraticCurveTo(x + 0.9 * R, hy + 0.4 * R, hx, hy); c.stroke();
      c.strokeStyle = '#d9cfb8'; c.lineWidth = 0.12 * R; c.stroke();
      c.fillStyle = '#d9cfb8'; c.strokeStyle = '#3a2f2a'; c.lineWidth = 0.05 * R;
      c.beginPath(); c.ellipse(hx, hy, 0.34 * R * k, 0.3 * R * k, -0.3, 0, TAU); c.fill(); c.stroke();
      c.restore();
    }
  }
}

/** The wooden post between BEFORE and AFTER (a knob on top for Rai to sit on), and the paper labels. */
function panelDivider(c: C2, g: C2, t: number) {
  c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(W / 2 - 16, 0, 32, H);
  c.fillStyle = '#5a3c28'; c.fillRect(W / 2 - 10, 236, 20, H);
  c.fillStyle = '#7a5434'; c.fillRect(W / 2 - 10, 236, 6, H);
  c.fillStyle = '#6a4630'; c.beginPath(); c.ellipse(W / 2, 236, 30, 10, 0, 0, TAU); c.fill();
  for (const [x, txt, rot] of [[W / 4, 'BEFORE', -0.04], [W * 0.75, 'AFTER', 0.035]] as const) {
    c.save(); c.translate(x, 82); c.rotate(rot + 0.01 * Math.sin(t * 1.3 + x));
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(-112, -30, 230, 70);
    c.fillStyle = txt === 'BEFORE' ? '#efe2c4' : '#f6f1e6'; c.fillRect(-118, -38, 230, 70);
    c.fillStyle = '#c9c4b8'; c.beginPath(); c.arc(-3, -28, 5, 0, TAU); c.fill();
    c.fillStyle = '#2a2030'; c.font = font(FAM.monoB(), 40); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, -3, 2);
    c.restore();
  }
  void g; void mixHex;
}

/** A small impact burst of lines round a head (house units), popping at t0. */
function burst(c: C2, x: number, y: number, r0: number, r1: number, t: number, t0: number) {
  const u = (t - t0) / 0.5; if (u < 0 || u > 1) return;
  c.save(); c.strokeStyle = `rgba(255,255,255,${0.9 * (1 - u)})`; c.lineCap = 'round';
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU + 0.2, k = 0.8 + 0.4 * h01(i, 77), a0 = r0 + (r1 - r0) * 0.5 * u, a1 = r0 + (r1 - r0) * (0.6 + 0.4 * u) * k;
    c.lineWidth = 5 * (1 - u * 0.6); c.beginPath(); c.moveTo(x + Math.cos(a) * a0, y + Math.sin(a) * a0); c.lineTo(x + Math.cos(a) * a1, y + Math.sin(a) * a1); c.stroke();
  }
  c.restore();
}

/** Her jewellery box on the dresser (house units; the bill stands on it): wood, a brass clasp, a pink lid. */
function jewelBox(c: C2, x: number, y: number) {
  c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(x + 10, y + 4, 130, 14, 0, 0, TAU); c.fill();
  c.fillStyle = '#8a5a3a'; c.beginPath(); c.roundRect(x - 110, y - 104, 220, 104, 8); c.fill();
  c.fillStyle = '#e07a9a'; c.beginPath(); c.roundRect(x - 118, y - 124, 236, 28, 10); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(x - 110, y - 120, 220, 6);
  c.fillStyle = '#e8c070'; c.fillRect(x - 12, y - 100, 24, 26);
  c.strokeStyle = 'rgba(40,20,10,0.4)'; c.lineWidth = 3; c.strokeRect(x - 96, y - 86, 192, 72);
}