// PRE2 (pre-chorus 2, lines 26-29; Pigou's paradox): "Marry your housekeeper, the income drops: / same floors, same
// love, same clock, the counting stops; / pay a stranger, watch the number climb, / your meter's measuring the wrong
// kind of time." Into chorus 2 (pink sunburst). One home, before and after the wedding: the same room, the same floors,
// the same clock; her silhouette never changes, only her label (his notes, 2026-10-02).
//   1 RING     "Marry your housekeeper,": she mops the gleaming floor, labelled HOUSEKEEPER, £410 A WEEK; he offers a
//              ring and it closes between them; hearts. MARRY. Clue: the TV in the corner (where the income will show).
//   2 DROPS    "the income drops:": after the wedding (the photo on the mantel, confetti on the floor) she mops the
//              same floor; her wage falls off her label and clatters to the floor, the ring drops into its place as a
//              pink 0, the label reads WIFE; the TV's NATIONAL INCOME ticks down. DROPS. He reads the paper.
//   3 SAME     "same floors, same love, same clock,": three panels of the same room land on FLOORS, LOVE, CLOCK.
//   4 STOPS    "the counting stops;": close on the TV: the counter rolls, then freezes grey; chibi Rai pops in, cross
//              (vein, steam), and stomps (hitShake). STOPS.
//   5 STRANGER "pay a stranger, watch": the same room, the same floor, a stranger at the mop, CLEANER, £410 A WEEK, a £
//              pops; she sits on the sofa. PAY A STRANGER.
//   6 NUMBER   "the number climb,": the TV's counter rolls up in lime. NUMBER.
//   7 CLIMB    (held "climb"): the chart line breaks out of the TV and climbs the wall past the clock and off the frame.
//   8 METER    "your meter's measuring the": split: the same clock over the sofa at night, where she holds the sleeping
//              child (A NIGHT OF CARE), against a taxi's fare meter ticking every beat in the rain (A RIDE ACROSS
//              TOWN). TIME? / METER.
//   9 WRONG    "wrong kind of": Rai in the taxi's back seat, serious, points at the meter as its digits glitch. WRONG,
//              KIND.
//  10 TIME     "time.": the same clock, big, settling where chorus 2's Rai stands; its marks grow into the chorus's pink
//              sunburst, the room gives way to the seabed's sand and reeds, and the clock becomes Rai.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { HEX } from '../engine/palette';
import { font } from '../engine/type';
import type { Line, Word } from '../engine/lyrics';
import { clamp, ease, lerp } from '../engine/util';
import { drawRai, h01 } from './_rai';
import { FAM, TAU, emote, gradientV, halftone, person, rgbaHex, slam, sunburst } from './_motifs';
import { reed, fishSchool } from './_world';
import { focusLines, poof, puff, heart } from './_manga';
import { hitShake, mergePost, punch } from './_post';
import { band, beatCut, cutIn, plateLines, shotAt, slam2, wordOf } from './trader-kit';
import { both, headOf, livingRoom, mop, nullCtx, roleLabel, taxi, wallClock } from './ledger-rooms';

type Shot = ReturnType<typeof shotAt>;
type C = CanvasRenderingContext2D;
type Out = { sung?: string; post?: PostOverrides };

const fmt = (v: number) => '£' + Math.round(v).toLocaleString('en-GB');
const HER = '#2a1530', HIM = '#1e1a30', STRANGER = '#3a4aa8';
const BASE = 2_184_600_410;

export default class Pre2 extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  own: Line[] = [];
  bandLines: Line[] = [];
  cuts: number[] = [];
  w: Record<string, Word> = {};

  override init() {
    const { lyrics, audio: au, start, end } = this.ctx;
    const { own, band: bl } = plateLines(lyrics.lines, start, end);
    this.own = own; this.bandLines = bl;
    const q = (re: RegExp, n = 0) => wordOf(own, re, n);
    this.w = {
      marry: q(/^marry/), housekeeper: q(/^housekeeper/), the1: q(/^the$/, 0), income: q(/^income/), drops: q(/^drops/),
      floors: q(/^floors/), love: q(/^love/), clock: q(/^clock/), counting: q(/^counting/), stops: q(/^stops/),
      pay: q(/^pay$/), stranger: q(/^stranger/), the3: q(/^the$/, 2), number: q(/^number/), climb: q(/^climb/),
      your: q(/^your$/, 1), meters: q(/^meter/), measuring: q(/^measuring/), wrong: q(/^wrong/), kind: q(/^kind/), time: q(/^time/),
    };
    const w = this.w;
    const after = (x: Word) => au.timeOfBeat(Math.floor(au.beatAt(x.start + 0.02)) + 1);
    this.cuts = [start, beatCut(au, w.the1!.start), beatCut(au, w.floors!.start), beatCut(au, w.counting!.start), beatCut(au, w.pay!.start),
      beatCut(au, w.the3!.start), after(w.climb!), beatCut(au, w.your!.start), beatCut(au, w.wrong!.start), beatCut(au, w.time!.start)];
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, end } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t;
    this.L.clear(HEX.ink); this.G.clear();
    const s = shotAt(this.cuts, t, end);
    const shots = [this.ring, this.drops, this.same, this.stops, this.stranger, this.number, this.climb, this.meter, this.wrong, this.time];
    const fn = (shots[s.i] ?? this.ring) as (...a: unknown[]) => Out | undefined;
    const r = fn.call(this, c, g, t, s, f) ?? {};
    band(c, this.bandLines, t, { sung: r.sung ?? HEX.pink, dark: 0.8 });
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    return mergePost({ bloom: 0.6 }, r.post, { zoom: 1 + 0.008 * f.a.kick });
  }

  /** The TV's news screen: NATIONAL INCOME, the number, an arrow; `dead` greys it (the counting stopped). */
  tvIncome(v: number, arrow: 'up' | 'down' | '', dead = 0) {
    return (c: C, x: number, y: number, w: number, h: number) => {
      gradientV(c, '#0c1a40', '#06102a', x, y, w, h);
      c.fillStyle = '#d63a4a'; c.fillRect(x, y, w * 0.4, h * 0.16);
      c.font = font(FAM.monoB(), h * 0.09); c.fillStyle = '#f4f1ea'; c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText('NEWS', x + 8, y + h * 0.08);
      c.font = font(FAM.mono(), h * 0.09); c.fillStyle = rgbaHex('#f4f1ea', 0.75); c.fillText('NATIONAL INCOME', x + 10, y + h * 0.3);
      const col = dead > 0 ? `rgba(160,160,170,${1 - 0.3 * dead})` : HEX.lime;
      c.font = font(FAM.monoB(), h * 0.17); c.fillStyle = col; c.textAlign = 'right'; c.fillText(fmt(v), x + w - 12, y + h * 0.55);
      if (arrow) {
        c.fillStyle = arrow === 'up' ? HEX.lime : HEX.coral; c.beginPath();
        const ax = x + 22, ay = y + h * 0.55, s = h * 0.08;
        if (arrow === 'up') { c.moveTo(ax - s, ay + s * 0.6); c.lineTo(ax + s, ay + s * 0.6); c.lineTo(ax, ay - s * 0.8); }
        else { c.moveTo(ax - s, ay - s * 0.6); c.lineTo(ax + s, ay - s * 0.6); c.lineTo(ax, ay + s * 0.8); }
        c.closePath(); c.fill();
      }
      c.fillStyle = '#d63a4a'; c.fillRect(x, y + h * 0.82, w, h * 0.18);
      c.font = font(FAM.monoB(), h * 0.08); c.fillStyle = '#f4f1ea'; c.textAlign = 'left';
      c.fillText(dead > 0 ? 'COUNTING STOPPED' : 'MARKETS · WEATHER · TRAFFIC', x + 10, y + h * 0.91);
    };
  }

  /** The woman of the house (the same silhouette in every shot), mopping, with her label above her. */
  her(c: C, t: number, x: number, feet: number, h: number, role: string, pay: string, payCol: string, labelA = 1, mopping = true) {
    person(c, x, feet, h, mopping ? 'carry' : 'stand', { col: HER, t, seed: 3, rim: 'rgba(255,230,190,0.85)' });
    if (mopping) mop(c, x, feet, h, t, HER);
    roleLabel(c, x, feet - h - 70, role, pay, payCol, labelA);
  }

  // ------------------------------------------------------------------ 1-2 marry your housekeeper, the income drops

  ring(c: C, g: C, t: number, s: Shot): Out {
    const room = livingRoom(c, g, t, { tv: this.tvIncome(BASE, '') });
    const fx = W * 0.36, feet = H * 0.95, h = 470;
    this.her(c, t, fx, feet, h, 'HOUSEKEEPER', '£410 A WEEK', HEX.lime, clamp((t - this.w.housekeeper!.start + 0.3) / 0.15));
    person(c, W * 0.62, feet, 500, 'point', { col: HIM, flip: true, t, seed: 5, rim: 'rgba(255,230,190,0.85)' });
    const u = ease.inOutCubic(clamp((t - this.w.marry!.start) / (this.w.housekeeper!.end - this.w.marry!.start - 0.1)));
    const rx = W * 0.49, ry = H * 0.48, R = 70;
    if (u > 0) {
      c.save(); c.lineCap = 'round';
      c.strokeStyle = '#9a6a14'; c.lineWidth = 24; c.beginPath(); c.arc(rx + 3, ry + 4, R, -Math.PI / 2, -Math.PI / 2 + TAU * u); c.stroke();
      c.strokeStyle = HEX.gold; c.lineWidth = 18; c.beginPath(); c.arc(rx, ry, R, -Math.PI / 2, -Math.PI / 2 + TAU * u); c.stroke();
      c.restore();
      g.strokeStyle = rgbaHex(HEX.gold, 0.4); g.lineWidth = 30; g.beginPath(); g.arc(rx, ry, R, -Math.PI / 2, -Math.PI / 2 + TAU * u); g.stroke();
    }
    if (u >= 1) {
      const t1 = this.w.housekeeper!.end;
      for (const [hx0, hf] of [[fx, feet], [W * 0.62, feet]] as const) { const [hx, hy, hr] = headOf(hx0, hf, 480); emote(c, hx, hy, hr, 'heart', t, t1); }
    }
    slam(c, 'MARRY', W * 0.74, H * 0.13, 150, t, this.w.marry!.start, { col: '#2a1530', shadow: HEX.gold });
    void room;
    return { sung: HEX.gold, post: punch(t, [this.w.marry!.start], 0.02) };
  }

  drops(c: C, g: C, t: number, s: Shot): Out {
    const dt = this.w.drops!.start, inc = this.w.income!.start;
    const v = BASE - 410 * clamp((t - dt) / 0.3);
    livingRoom(c, g, t, { after: true, tv: this.tvIncome(v, t >= dt ? 'down' : '', 0) });
    const fx = W * 0.36, feet = H * 0.95, h = 470;
    // he reads the paper on the sofa
    person(c, 1200, H * 0.72, 300, 'read', { col: HIM, t, seed: 5, rim: 'rgba(255,230,190,0.7)' });
    // her label: the wage falls off; the ring drops into its place as a pink 0; HOUSEKEEPER becomes WIFE
    const fall = clamp((t - dt) / 0.5), ringIn = clamp((t - dt - 0.05) / 0.3);
    const ly = feet - h - 70;
    this.her(c, t, fx, feet, h, t < dt + 0.2 ? 'HOUSEKEEPER' : 'WIFE', ' ', HEX.lime);
    if (fall < 1) {
      c.save(); c.translate(fx, ly + 20 + 640 * fall * fall); c.rotate(1.6 * fall);
      c.font = font(FAM.monoB(), 28); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = HEX.lime; c.fillText('£410 A WEEK', 0, 0);
      c.restore();
    }
    if (ringIn > 0) {
      const ry = lerp(ly - 300, ly + 20, ease.outBack(ringIn)), rr = lerp(60, 15, ringIn);
      c.strokeStyle = ringIn < 1 ? HEX.gold : HEX.pink; c.lineWidth = lerp(16, 6, ringIn);
      c.beginPath(); c.ellipse(fx, ry, rr * 0.8, rr, 0, 0, TAU); c.stroke();
      if (ringIn >= 1) { g.strokeStyle = rgbaHex(HEX.pink, 0.6); g.lineWidth = 8; g.beginPath(); g.ellipse(fx, ry, 12, 15, 0, 0, TAU); g.stroke(); }
    }
    const clink = dt + 0.42;
    if (t >= clink) for (let k = 0; k < 6; k++) { const u = clamp((t - clink) / 0.4); puff(c, fx + (k - 2.5) * 30 * (1 + u), feet - 10 - 20 * u, 14 + 10 * u, `rgba(255,240,210,${0.7 * (1 - u)})`); }
    void inc;
    slam(c, 'DROPS', W * 0.74, H * 0.13, 150, t, dt, { col: HEX.coral, shadow: HEX.ink });
    return { post: mergePost(hitShake(t, [clink], 4, 0.25), punch(t, [dt], 0.02)) };
  }

  // ------------------------------------------------------------------ 3-4 same floors, same love, same clock; the counting stops

  same(c: C, g: C, t: number, s: Shot): Out {
    livingRoom(c, g, t, { after: true, tv: this.tvIncome(BASE - 410, '') });
    c.fillStyle = 'rgba(30,18,24,0.6)'; c.fillRect(0, 0, W, H);
    const quads: [number, number][][] = [[[60, 90], [640, 70], [620, 690], [80, 704]], [[670, 70], [1250, 86], [1236, 700], [652, 690]], [[1280, 86], [1860, 70], [1846, 704], [1266, 700]]];
    const subjects: [string, Word, [number, number, number]][] = [['FLOORS', this.w.floors!, [W * 0.38, H * 0.82, 1.5]], ['LOVE', this.w.love!, [1240, H * 0.6, 1.5]], ['CLOCK', this.w.clock!, [980, H * 0.66 - 520, 2.4]]];
    subjects.forEach(([word, wd, [sx, sy, z]], k) => {
      const q = quads[k]!, qx = (q[0]![0] + q[2]![0]) / 2, qy = (q[0]![1] + q[2]![1]) / 2;
      cutIn(c, t, wd.start - 0.02, q, ['flat', '#2a1d30', '#2a1d30'], () => {
        c.save(); c.translate(qx, qy); c.scale(z, z); c.translate(-sx, -sy);
        livingRoom(c, nullCtx(), t, { after: true });
        if (k === 0) { person(c, W * 0.36, H * 0.95, 470, 'carry', { col: HER, t, seed: 3, rim: 'rgba(255,230,190,0.85)' }); mop(c, W * 0.36, H * 0.95, 470, t, HER); }
        if (k === 1) {
          person(c, 1170, H * 0.72, 280, 'seated', { col: HER, t, seed: 3, rim: 'rgba(255,230,190,0.85)', headTilt: 0.2 });
          person(c, 1310, H * 0.72, 300, 'seated', { col: HIM, t, seed: 5, flip: true, rim: 'rgba(255,230,190,0.85)', headTilt: -0.2 });
          heart(c, 1240, H * 0.38 - 10 * Math.sin(t * 3), 26, HEX.pink);
        }
        c.restore();
      });
      if (t >= wd.start - 0.02) {
        c.font = font(FAM.mono(), 30); c.fillStyle = rgbaHex(HEX.bone, 0.85); c.textAlign = 'center'; c.textBaseline = 'alphabetic';
        c.fillText('SAME', qx, 56);
        slam(c, word, qx, 752, 66, t, wd.start, { col: HEX.bone, shadow: HEX.ink });
      }
    });
    return { post: punch(t, subjects.map((x) => x[1].start), 0.015) };
  }

  stops(c: C, g: C, t: number, s: Shot): Out {
    const st = this.w.stops!.start, frozen = Math.min(t, st), dead = clamp((t - st) / 0.3);
    const v = BASE - 410 + (frozen - s.s0) * 9_973;
    const z = 1.9, tx = 1560 + 150, ty = H * 0.66 - 420 + 95;
    const jolt = t >= st ? 6 * Math.exp(-(t - st) * 14) * Math.sin((t - st) * 90) : 0;
    both(c, g, (cc) => { cc.translate(W * 0.6, H * 0.42); cc.scale(z, z); cc.translate(-tx, -ty + jolt); }, () => livingRoom(c, g, t, { after: true, tv: this.tvIncome(v, '', dead) }));
    // chibi Rai pops in, cross, and stomps on "stops"
    const pop = this.w.counting!.start, since = t - st;
    if (t >= pop) {
      const hop = since < 0 ? 0.3 * Math.abs(Math.sin((t - pop) * 9)) : 0;
      drawRai(c, W * 0.22, H * 0.62, 115, { t, sd: true, face: 'angry', arms: ['fist', 'fist'], marks: ['vein', 'steam'], markT0: pop + 0.05, shake: 1, hop, squash: since >= 0 && since < 0.1 ? -0.4 : 0, glow: HEX.coral, glowStrength: 0.4 });
      poof(c, W * 0.22, H * 0.56, 180, t, pop);
      if (since >= 0) for (let k = 0; k < 7; k++) { const u = clamp(since / 0.3), a = Math.PI + (k / 6) * Math.PI; puff(c, W * 0.22 + Math.cos(a) * (60 + 90 * u), H * 0.62 + 124 + Math.sin(a) * 18 * u, 20 + 14 * u, `rgba(255,240,210,${0.8 * (1 - u)})`); }
    }
    slam(c, 'STOPS', W * 0.6, H * 0.12, 160, t, st, { col: HEX.coral, shadow: HEX.ink });
    return { post: mergePost(hitShake(t, [st], 6, 0.3), punch(t, [st], 0.03)) };
  }

  // ------------------------------------------------------------------ 5-7 pay a stranger, watch the number climb

  stranger(c: C, g: C, t: number, s: Shot): Out {
    const st = this.w.stranger!.start;
    livingRoom(c, g, t, { after: true, tv: this.tvIncome(BASE - 410 + 410 * clamp((t - st) / 0.3), t >= st ? 'up' : '') });
    // she sits on the sofa now; the stranger mops the same floor
    person(c, 1200, H * 0.72, 290, 'seated', { col: HER, t, seed: 3, rim: 'rgba(255,230,190,0.85)' });
    const fx = W * 0.36, feet = H * 0.95, h = 500;
    person(c, fx, feet, h, 'carry', { col: STRANGER, t, seed: 9, rim: 'rgba(255,230,190,0.6)' });
    c.fillStyle = STRANGER; c.fillRect(fx - 0.11 * h, feet - 0.98 * h, 0.22 * h, 0.05 * h); c.fillRect(fx, feet - 0.95 * h, 0.16 * h, 0.025 * h);
    mop(c, fx, feet, h, t, STRANGER);
    roleLabel(c, fx, feet - h - 70, 'CLEANER', '£410 A WEEK', HEX.lime, clamp((t - this.w.pay!.start) / 0.12));
    const pa = ease.outBack(clamp((t - st) / 0.2));
    if (pa > 0) {
      const px = fx + 230, py = feet - h - 120;
      c.save(); c.translate(px, py); c.scale(pa, pa);
      c.fillStyle = HEX.lime; c.beginPath(); c.arc(0, 0, 70, 0, TAU); c.fill();
      c.font = font(FAM.hook(), 84); c.fillStyle = HEX.ink; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('£', 0, 4);
      c.restore();
      g.fillStyle = rgbaHex(HEX.lime, 0.35 * pa); g.beginPath(); g.arc(px, py, 100, 0, TAU); g.fill();
    }
    slam2(slam, c, 'PAY A', 'STRANGER', W * 0.7, H * 0.16, 130, t, this.w.pay!.start, { colA: HEX.lime, colB: '#2a1530', shadow: HEX.bone });
    return { sung: HEX.lime, post: punch(t, [st], 0.02) };
  }

  number(c: C, g: C, t: number, s: Shot): Out {
    const v = BASE + 410 * ease.outExpo(clamp((t - this.w.number!.start) / 0.6)) + (t - s.s0) * 40_000 * clamp((t - this.w.climb!.start) / 0.1);
    const z = 2.1, tx = 1560 + 150, ty = H * 0.66 - 420 + 95;
    both(c, g, (cc) => { cc.translate(W * 0.5, H * 0.42); cc.scale(z, z); cc.translate(-tx, -ty); }, () => livingRoom(c, g, t, { after: true, tv: this.tvIncome(v, 'up') }));
    slam(c, 'NUMBER', W * 0.5, H * 0.12, 150, t, this.w.number!.start, { col: HEX.lime, shadow: HEX.ink });
    return { sung: HEX.lime, post: punch(t, [this.w.number!.start], 0.02) };
  }

  climb(c: C, g: C, t: number, s: Shot): Out {
    const z = 1.25, tx = 1450, ty = H * 0.5;
    const tr = (cc: C) => { cc.translate(W * 0.6, H * 0.5); cc.scale(z, z); cc.translate(-tx, -ty); };
    both(c, g, tr, () => livingRoom(c, g, t, { after: true, tv: this.tvIncome(BASE + 40_000 * (t - s.s0 + 1), 'up') }));
    // the line breaks out of the TV and climbs the wall, past the clock, off the top
    const u = clamp(s.lt / 0.55), pts: [number, number][] = [];
    const x0 = 1600, y0 = H * 0.66 - 300;
    for (let i = 0; i <= 50; i++) { const v = i / 50; if (v > u) break; pts.push([x0 - v * 760 + 26 * Math.sin(v * 16), y0 - Math.pow(v, 1.6) * 1100]); }
    const path = (cc: C) => { cc.beginPath(); pts.forEach(([x, y], i) => (i ? cc.lineTo(x, y) : cc.moveTo(x, y))); };
    c.save(); tr(c); g.save(); tr(g);
    c.strokeStyle = HEX.lime; c.lineWidth = 12; c.lineJoin = 'round'; c.lineCap = 'round'; path(c); c.stroke();
    g.strokeStyle = rgbaHex(HEX.lime, 0.5); g.lineWidth = 26; path(g); g.stroke();
    g.restore(); c.restore();
    slam(c, 'CLIMB', W * 0.36, H * 0.5, 280, t, s.s0, { col: HEX.lime, shadow: HEX.ink, rot: -0.12 });
    return { sung: HEX.lime, post: punch(t, [s.s0], 0.025) };
  }

  // ------------------------------------------------------------------ 8-10 your meter's measuring the wrong kind of time

  meter(c: C, g: C, t: number, s: Shot): Out {
    const { audio: au, start } = this.ctx;
    const fare = '£' + (2.4 + 0.2 * Math.max(0, Math.floor(au.beatAt(t) - au.beatAt(start)))).toFixed(2);
    // left: the same clock over the sofa at night, where she holds the sleeping child
    both(c, g, (cc) => { cc.beginPath(); cc.rect(0, 0, W / 2, H); cc.clip(); cc.translate(W * 0.25, H * 0.6); cc.scale(0.95, 0.95); cc.translate(-1060, -H * 0.5); }, () => {
      livingRoom(c, g, t, { after: true, night: 1 });
      // a lamp left on by the sofa, and her, awake, the child asleep on her shoulder
      const lg = c.createRadialGradient(1180, H * 0.5, 0, 1180, H * 0.5, 420); lg.addColorStop(0, 'rgba(255,150,190,0.35)'); lg.addColorStop(1, 'rgba(255,150,190,0)');
      c.save(); c.globalCompositeOperation = 'screen'; c.fillStyle = lg; c.fillRect(700, 0, 900, H); c.restore();
      c.save(); c.translate(1150, H * 0.82); c.rotate(Math.sin(t * 2) * 0.03); person(c, 0, 0, 420, 'hold', { col: HER, t, seed: 3, headTilt: 0.25, rim: 'rgba(255,170,200,0.95)', emote: 'zzz', emoteT0: s.s0 }); c.restore();
    });
    // right: the taxi's meter in the rain
    both(c, g, (cc) => { cc.beginPath(); cc.rect(W / 2, 0, W / 2, H); cc.clip(); }, () => taxi(c, g, t, fare, { meterX: W * 0.75, meterY: H * 0.46, meterW: 560 }));
    c.fillStyle = HEX.ink; c.fillRect(W / 2 - 6, 0, 12, H);
    c.font = font(FAM.monoB(), 34); c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillStyle = HEX.pink; c.fillText('A NIGHT OF CARE', W * 0.25, H * 0.22);
    c.fillStyle = HEX.lime; c.fillText('A RIDE ACROSS TOWN', W * 0.75, H * 0.22);
    slam(c, 'TIME?', W * 0.25, H * 0.12, 140, t, this.w.measuring!.start, { col: HEX.pink, shadow: HEX.ink });
    slam(c, 'METER', W * 0.75, H * 0.12, 140, t, this.w.meters!.start, { col: HEX.lime, shadow: HEX.ink });
    return {};
  }

  wrong(c: C, g: C, t: number, s: Shot): Out {
    const { audio: au, start } = this.ctx;
    const fare = '£' + (2.4 + 0.2 * Math.max(0, Math.floor(au.beatAt(t) - au.beatAt(start)))).toFixed(2);
    const wt = this.w.wrong!.start, gl = clamp((t - wt) / 0.1);
    taxi(c, g, t, fare, { layer: 'back' });
    // the back seat, Rai in it, serious, pointing at the meter
    c.fillStyle = '#2a1e30'; c.beginPath(); c.roundRect(W * 0.52, H * 0.38, W * 0.44, H * 0.5, 40); c.fill();
    drawRai(c, W * 0.74, H * 0.6, 125, { t, face: 'serious', arms: ['point', 'down'], armsFrom: ['down', 'down'], armsU: clamp((t - s.s0) / 0.2), tilt: 0.04, glow: '#ffffff', glowStrength: 0.25, heart: 0.2, marks: t >= wt ? ['!'] : [], markT0: wt });
    taxi(c, g, t, fare, { layer: 'front', glitch: gl, meterX: W * 0.28, meterY: H * 0.52, meterW: 640 });
    slam(c, 'WRONG', W * 0.34, H * 0.14, 170, t, wt, { col: HEX.coral, shadow: HEX.ink, rot: -0.05 });
    slam(c, 'KIND', W * 0.58, H * 0.2, 110, t, this.w.kind!.start, { col: HEX.bone, shadow: HEX.ink, rot: 0.03 });
    return { sung: HEX.coral, post: punch(t, [wt], 0.025) };
  }

  time(c: C, g: C, t: number, s: Shot): Out {
    const end = this.ctx.end, cx = W * 0.34, cy = H * 0.6, R = 165;
    // the same clock, big, settling where chorus 2's Rai stands; its marks grow into the chorus's pink sunburst
    const grow = ease.inOutCubic(clamp((t - (end - 1.15)) / 0.9));
    const roomA = 1 - clamp((t - (end - 1.0)) / 0.6);
    if (roomA > 0) {
      const k = lerp(2.0, 1, ease.inOutCubic(clamp(s.lt / 1.0)));
      both(c, g, (cc) => { cc.translate(cx, cy); cc.scale(k, k); cc.translate(-980, -(H * 0.66 - 520)); }, () => livingRoom(c, grow > 0 ? nullCtx() : g, t, { after: true, night: 0.6 }));
    }
    if (grow > 0) {
      c.save(); c.globalAlpha = grow;
      sunburst(c, W * 0.34, H * 0.5, HEX.pink, '#d93a82', 16, t * 0.12);
      halftone(c, rgbaHex(HEX.ink, 0.18), 26, 'down');
      // chorus 2's seabed frame: the sand, the reeds, the fish
      c.fillStyle = '#f1dc9e';
      c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 40) c.lineTo(x, H * 0.84 + 10 * Math.sin(x * 0.006 + 1)); c.lineTo(W, H); c.closePath(); c.fill();
      for (let i = 0; i < 9; i++) reed(c, i < 5 ? 30 + i * 70 : W - 30 - (i - 5) * 80, H + 10, 300 + 120 * h01(i, 2, 7), t, i, '#1f7a4a', 24);
      fishSchool(c, t, H * 0.2, 0.9, 6, 9, '#ffffff', 0, 0.8);
      c.restore();
    }
    const rai = clamp((t - (end - 0.45)) / 0.3);
    const scale = lerp(1.25, 1, ease.inOutCubic(clamp(s.lt / Math.max(0.5, end - s.s0 - 0.5))));
    if (rai < 1) {
      c.save(); c.globalAlpha = 1 - rai;
      c.translate(cx, cy); c.scale(scale, scale); c.translate(-cx, -cy);
      wallClock(c, cx, cy, R, t);
      c.restore();
      if (grow > 0) { g.strokeStyle = rgbaHex(HEX.pink, 0.5 * grow); g.lineWidth = 14; g.beginPath(); g.arc(cx, cy, R * 1.15 * scale, 0, TAU); g.stroke(); }
    }
    if (rai > 0) {
      c.save(); c.globalAlpha = rai;
      drawRai(c, cx, cy, R, { t, face: t > end - 0.2 ? 'sassy' : 'serious', arms: ['down', 'down'], glow: HEX.bone, heart: 0.4 });
      c.restore();
    }
    if (grow > 0.2) focusLines(c, cx, cy - 60, 330, rgbaHex('#ffffff', 0.25 * grow), t, { n: 50 });
    slam(c, 'TIME', W * 0.72, H * 0.4, 280, t, this.w.time!.start, { col: HEX.bone, shadow: HEX.ink, shadowOff: 0.05, rot: -0.04, t1: end - 0.2, exit: 0.15, maxW: W * 0.5 });
    return { post: punch(t, [this.w.time!.start], 0.02) };
  }
}
