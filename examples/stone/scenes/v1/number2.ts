// NUMBER 2 (v1, 116.20-129.49, chorus 2, lines 31-34; TREATMENT-v1.md): the tender reprise. Same set as number1,
// staged the other way: house lights down, pink and plum instead of gold and cyan, long slow moves instead of cuts,
// Rai on the host's stool at stage right instead of hopping centre stage, the audience's own lights instead of the
// show's. The ring of bulbs, pink, holds the woman and her child: the zero the ledger gave her is the ring.
//   M0 the scoreboard, close: HER pink 0, and a ring of LEDs drawing itself round it. STONE slams in pink.
//   M1 match cut, ring for ring: the pink ring of bulbs, and inside it, where the 0 was, the woman rocking her child
//      (the outside broadcast's last image, remembered, with its kitchen clock at four). The crane pulls back: Rai on
//      her stool, soft, watching it; jellyfish held up like lighters along the front.
//   M2 the stands in the dark ("nobody's seen me"): a lighter, then another, flicks on.
//   M3 over their heads ("everybody believes"): the lighters rise in a wave and sway on the half-time; BELIEVES
//      slams in pink; the octopus holds up a lighter too (nobody needed a cue card).
//   M4 CAM 2 pushes in on Rai's heart, the hole in her: through it, behind her in the ring, the woman and her child
//      (a thing you can't count, and can't see unless you look through her). On "see" her heart's rim glows.
//   M5 "who else is waiting": the spot finds C7 again; the violet fish in C8 has put its fin round the lunchbox: a
//      heart.
//   M6 "at the bottom of the sea?": Rai springs off the stool, fierce, fists up, lines of force; the ring flares;
//      the crane pulls back to the wide.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../../engine/scene';
import { Layer2D, W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import type { Line } from '../../engine/lyrics';
import { clamp, ease, lerp } from '../../engine/util';
import { drawRai, h01, type Face, type ArmPose } from '../_rai';
import { rgbaHex, slam, emote, TAU } from '../_motifs';
import { focusLines } from '../_manga';
import { mergePost, punch, hitShake, caKick } from '../_post';
import { SET, studio, studioFront, audience, seatPos, seatKind, octopus, liveBug, camTag, micProp, type Spot, type StudioOpts } from './_studio';
import { beatCut, wordOf, camOn, camMix, camClamp, shoot, toScreen, lyricBand, plateMask, jellyLighter, frontRow, memory, stool, spotPool, featherSpot, NULL_G, type C2 } from './number-kit';
import { OCT } from './vote-kit';

const R0 = 136;
const STOOL = { x: 1440, h: 150 };
const SEAT_Y = SET.floor - STOOL.h * 1.02;
const SIT = { x: STOOL.x, y: SEAT_Y - 0.8 * R0 };
const STAND = { x: STOOL.x - 30, y: SET.floor - 1.07 * R0 };
const RING = { x: W * 0.5, y: H * 0.4, r: H * 0.27 };
const MEM_R = RING.r - 26;
const BOARD = { x: W * 0.035, y: H * 0.17, w: W * 0.2, h: H * 0.29 };
const PLUM = '#5a1d4a';
const occ = (row: string, col: number) => { const p = seatPos(row, col); return { x: p.x, y: p.y - 30 * p.s, s: p.s }; };

/**
 * The scoreboard's state in chorus 2: HER pink 0, and the ring it becomes. The 0 is an oval of LEDs; at u > 0 a copy
 * of its dots slides out into a perfect circle round it (the zero becomes the ring), leaving the 0 inside the ring.
 */
export function zeroRing(c: C2, g: C2, x: number, y: number, w: number, h: number, t: number, u: number) {
  const n = 30, cx = x + w / 2, cy = y + h / 2, ox = h * 0.19, oy = h * 0.3, rr = h * 0.43, e = ease.inOutCubic(clamp(u));
  const dot = (px: number, py: number, a: number, r: number) => {
    c.fillStyle = `rgba(255,${Math.round(79 + 140 * (1 - a))},${Math.round(154 + 70 * (1 - a))},1)`;
    c.beginPath(); c.arc(px, py, r, 0, TAU); c.fill();
    if (a > 0.5) { g.fillStyle = rgbaHex(HEX.pink, 0.5 * a); g.beginPath(); g.arc(px, py, r * 1.8, 0, TAU); g.fill(); }
  };
  for (let i = 0; i < n; i++) { // the 0
    const a = -Math.PI / 2 + (i / n) * TAU;
    dot(cx + Math.cos(a) * ox, cy + Math.sin(a) * oy, 0.9 + 0.1 * Math.sin(t * 5 + i), 6.2);
  }
  if (e > 0) for (let i = 0; i < n + 14; i++) { // the ring it becomes (more dots as it grows)
    const a = -Math.PI / 2 + (i / (n + 14)) * TAU, f = i < n ? 1 : clamp((e - 0.6) / 0.4);
    if (f <= 0) continue;
    const px = cx + Math.cos(a) * lerp(ox, rr, e), py = cy + Math.sin(a) * lerp(oy, rr, e);
    dot(px, py, f * (0.82 + 0.18 * Math.sin(t * 8 - i * 0.7)), 6.2);
  }
}

export default class Number2 extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  all: Line[] = [];
  k: Record<string, number> = {};
  cuts: number[] = [];
  bar0 = 0;
  barLen = 1.7;

  override init() {
    const { lyrics, audio: au, start, end } = this.ctx;
    this.all = lyrics.lines;
    const ln = lyrics.lines.filter((l) => l.words[0]!.start >= start - 0.1 && l.words[0]!.start < end);
    const [l31, l32, l33, l34] = ln as [Line, Line, Line, Line];
    const w = (l: Line, s: string, n = 0) => wordOf(l, s, n).start;
    const k: Record<string, number> = {
      first: l31.words[0]!.start, stone: w(l31, 'stone'), sea: w(l31, 'sea'),
      nobody: l32.words[0]!.start, everybody: w(l32, 'everybody'), believes: w(l32, 'believes'),
      count: w(l33, 'count'), see: w(l33, 'see'),
      who: l34.words[0]!.start, waiting: w(l34, 'waiting'), bottom: w(l34, 'bottom'), sea34: w(l34, 'sea'),
    };
    k.match = au.downbeats.find((d) => d > start + 0.05) ?? start + 0.43;
    k.m2 = beatCut(au, l32.words[0]!.start);   // the stands in the dark
    k.m3 = beatCut(au, k.everybody!);           // over their heads: the lighters rise
    k.m4 = beatCut(au, l33.words[0]!.start);   // the push-in through her heart
    k.m5 = beatCut(au, l34.words[0]!.start);   // C7 and the fin
    k.m6 = beatCut(au, w(l34, 'at'));           // she stands, fierce
    this.k = k;
    this.cuts = [start, k.match!, k.m2!, k.m3!, k.m4!, k.m5!, k.m6!];
    this.bar0 = k.match!;
    this.barLen = au.timeOfBeat(Math.round(au.beatAt(k.match!)) + 4) - k.match!;
  }

  /** The half-time sway: one side and back over a bar. */
  sway(t: number, ph = 0) { return Math.sin(((t - this.bar0) / this.barLen) * TAU + ph); }

  rai(c: C2, x: number, y: number, R: number, t: number, o: Partial<Parameters<typeof drawRai>[4]> & { face: Face; arms: ArmPose | [ArmPose, ArmPose] }, side: -1 | 1 = 1) {
    return drawRai(c, x, y, R, { t, glow: HEX.pink, glowStrength: 0.75, heartColor: HEX.pink, prop: { side, draw: micProp }, ...o });
  }

  /** The set for the reprise: house down, the curtain open, the ring pink, the board's ringed 0. */
  set(t: number, o: Partial<StudioOpts> = {}): StudioOpts {
    return {
      curtain: 1, ring: 1, ringCol: HEX.pink, burst: null, sign: 0.22, onAir: true, house: 0.1, cue: null,
      scoreDraw: (cc, gg, x, y, w, h) => zeroRing(cc, gg, x, y, w, h, t, 1),
      spots: [{ x: -400, a: 0 }, { x: -400, a: 0 }, { x: STOOL.x, col: HEX.pink, a: 0.9, r: 150 }],
      screen: (cc, gg, x, y, w, h) => this.screenFeed(cc, gg, x, y, w, h, t),
      ...o,
    };
  }

  /** The studio screen in the reprise: CAM 4's feed of the stands in the dark, a scatter of pink lighters. */
  screenFeed(c: C2, g: C2, x: number, y: number, w: number, h: number, t: number) {
    const bg = c.createLinearGradient(x, y, x, y + h);
    bg.addColorStop(0, '#1a0a1e'); bg.addColorStop(1, '#2a0d2a');
    c.fillStyle = bg; c.fillRect(x, y, w, h);
    for (let i = 0; i < 26; i++) {
      const px = x + w * (0.06 + 0.88 * h01(i, 401)) + 6 * this.sway(t, i * 0.4), py = y + h * (0.25 + 0.65 * h01(i, 402));
      c.fillStyle = 'rgba(255,170,215,0.9)'; c.beginPath(); c.arc(px, py, 3, 0, TAU); c.fill();
      g.fillStyle = rgbaHex(HEX.pink, 0.35); g.beginPath(); g.arc(px, py, 8, 0, TAU); g.fill();
    }
  }

  /** The woman's memory inside the ring, rocking on the beat. */
  mem(c: C2, g: C2, t: number, a: number) {
    const rock = Math.sin(Math.PI * this.ctx.audio.beatAt(t));
    memory(c, g, RING.x, RING.y, MEM_R, t, a, rock, true);
  }

  /** The octopus floor manager without a cue card, holding up a lighter like everyone else. */
  octo(c: C2, g: C2, t: number) {
    octopus(c, g, OCT.x, OCT.y, 1, t, { card: null });
    const lx = OCT.x + 96 + 20 * this.sway(t, 1), ly = OCT.y - 150;
    c.strokeStyle = '#c65cf0'; c.lineWidth = 14; c.lineCap = 'round';
    c.beginPath(); c.moveTo(OCT.x + 40, OCT.y + 20); c.quadraticCurveTo(OCT.x + 110, OCT.y - 30, lx, ly + 34); c.stroke();
    jellyLighter(c, g, lx, ly, 1.3, t, 3, 1, 0.15 * this.sway(t, 1));
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t, k = this.k;
    this.L.clear(HEX.ink); this.G.clear();
    const shot = Math.max(0, this.cuts.filter((x) => t >= x).length - 1), s0 = this.cuts[shot]!, lt = t - s0;
    let post: PostOverrides = { bloom: 0.72 };

    if (shot === 0) {
      // M0: the board, close: HER 0, and a ring drawing itself round it
      const u = ease.inOutQuad(clamp((t - k.first! + 0.05) / (k.match! - k.first! - 0.05)));
      const cam = camMix(camOn(BOARD.x + BOARD.w / 2, BOARD.y + BOARD.h / 2 - 4, 3.15), camOn(BOARD.x + BOARD.w / 2, BOARD.y + BOARD.h / 2, 3.3), clamp(lt / (k.match! - s0)));
      shoot(c, g, cam, () => studio(c, g, t, this.set(t, { scoreDraw: (cc, gg, x, y, w, h) => zeroRing(cc, gg, x, y, w, h, t, u) })));
    } else if (shot === 1) {
      // M1: ring for ring; the memory inside; the crane pulls back to Rai on her stool
      const u = ease.inOutCubic(clamp(lt / 1.9));
      const cam = camMix(camOn(RING.x, RING.y, 1.52), camOn(1070, 478, 1.12), u);
      shoot(c, g, cam, () => {
        studio(c, g, t, this.set(t));
        this.mem(c, g, t, clamp((t - k.match! - 0.05) / 0.45));
        this.octo(c, g, t);
        stool(c, STOOL.x, SET.floor, STOOL.h);
        this.rai(c, SIT.x, SIT.y, R0, t, {
          face: t >= k.sea! ? 'soft' : 'soft', arms: ['hold', 'hold'], look: -0.7, tilt: 0.05 * this.sway(t), heart: 0.3 + 0.6 * clamp((t - k.sea!) / 0.4), noBlink: false,
        });
        studioFront(c, g, t, { crowd: 1, mood: 'sway' });
      });
      liveBug(c, g, t);
    } else if (shot === 2) {
      // M2: the stands in the dark; a lighter, then another
      const cam = camClamp(camMix(camOn(760, 560, 1.28), camOn(1120, 540, 1.3), ease.inOutQuad(clamp(lt / (k.m3! - s0)))));
      shoot(c, g, cam, () => {
        audience(c, NULL_G, t, { mood: 'sway', dim: 0.9 });
        this.lighters(c, g, t, (key, i) => {
          const order = h01(i, 717);
          return order < 0.45 ? clamp((t - (k.nobody! + 0.1 + 1.25 * (order / 0.45))) / 0.12) : 0;
        });
      });
    } else if (shot === 3) {
      // M3: over their heads: the lighters rise and sway; BELIEVES
      const cam = camMix(camOn(1080, 470, 1.22), camOn(1090, 462, 1.27), ease.inOutQuad(clamp(lt / (k.m4! - s0))));
      const lit = clamp((t - k.everybody!) / 0.6);
      shoot(c, g, cam, () => {
        studio(c, g, t, this.set(t, { house: 0.1 + 0.1 * lit }));
        this.mem(c, g, t, 1);
        this.octo(c, g, t);
        stool(c, STOOL.x, SET.floor, STOOL.h);
        this.rai(c, SIT.x, SIT.y, R0, t, {
          face: t >= k.believes! ? 'love' : t >= k.everybody! + 0.15 ? 'wow' : 'soft', arms: t >= k.everybody! + 0.15 ? ['hold', 'cheek'] : ['hold', 'hold'],
          armsFrom: ['hold', 'hold'], armsU: clamp((t - k.everybody! - 0.15) / 0.2), look: -0.2, tilt: 0.05 * this.sway(t),
          heart: 0.4 + 0.6 * lit, blush: lit, marks: t >= k.believes! ? ['hearts'] : [], markT0: k.believes!,
        });
        // their light on the stage
      });
      frontRow(c, t, (i) => clamp((t - k.everybody! - 0.06 * i) / 0.3), (i, x, y) => jellyLighter(c, g, x, y - 50, 2.8, t, i, 1, 0.2 * this.sway(t, i * 0.3)),
        { rim: HEX.pink, xs: [100, 380, 640, 1500, 1800], sway: (i) => 0.1 * this.sway(t, i * 0.3) });
      slam(c, 'BELIEVES', W / 2, 168, 210, t, k.believes!, { col: HEX.pink, shadow: HEX.ink, rot: -0.03 });
      liveBug(c, g, t);
      post = mergePost(post, punch(t, [k.believes!], 0.022));
    } else if (shot === 4) {
      // M4: the push-in through the hole that is her heart
      this.heartShot(c, g, t, lt);
      camTag(c, 'CAM 2', t, s0);
      liveBug(c, g, t);
    } else if (shot === 5) {
      // M5: the spot finds C7 again: a fin round the lunchbox
      const c7 = occ('C', 7), c8 = occ('C', 8);
      const cam = camMix(camOn(c7.x + 52, c7.y + 4, 2.9), camOn(c7.x + 52, c7.y - 4, 3.2), ease.inOutQuad(clamp(lt / (k.m6! - s0))));
      const hug = ease.inOutCubic(clamp((t - k.who! - 0.1) / 0.5));
      shoot(c, g, cam, () => {
        audience(c, NULL_G, t, { mood: 'sway', dim: 0.8, spot: { x: c7.x + 52, y: c7.y + 6, r: 150 }, hug });
        featherSpot(c, c7.x + 52, c7.y + 6, 150, 0.6);
        this.lighters(c, g, t, (key) => (['C6', 'C7', 'C8', 'C9'].includes(key) ? 0 : 0.8));
        // the fin reaching over from C8 (the kit draws its tip on the lunchbox)
        if (hug > 0.02) {
          const c7o = occ('C', 7), s8 = c8.s, bob = 3 * s8 * Math.sin(t * 1.8 + 34);
          c.save(); c.globalAlpha *= hug;
          c.strokeStyle = '#b452da'; c.lineWidth = 19 * s8; c.lineCap = 'round';
          c.beginPath(); c.moveTo(c8.x - 40 * s8, c8.y - bob + 2 * s8);
          c.quadraticCurveTo(c8.x - 62 * s8, c8.y - 40 * s8, c7o.x + 38 * s8, c7o.y - 18 * s8); c.stroke();
          c.restore();
        }
        emote(c, c8.x - 10 * c8.s, c8.y + 6 * c8.s, 58 * c8.s, 'heart', t, k.who! + 0.6);
      });
      liveBug(c, g, t);
    } else {
      // M6: she springs off the stool, fierce; the ring flares; the crane pulls back to the wide
      const up = clamp((t - k.bottom! + 0.08) / 0.3), stoodUp = up >= 1;
      const pull = ease.inOutCubic(clamp((t - k.sea34! - 0.1) / 0.75));
      const cam = camMix(camMix(camOn(1150, 470, 1.32), camOn(1160, 465, 1.4), clamp(lt / 0.8)), camOn(W / 2, H / 2, 1), pull);
      const flare = t >= k.sea34! ? Math.exp(-(t - k.sea34!) * 3) : 0;
      shoot(c, g, cam, () => {
        studio(c, g, t, this.set(t, { house: 0.16 + 0.1 * flare, sign: 0.22 + 0.5 * flare,
          spots: [{ x: RING.x - 200, col: HEX.pink, a: 0.6 * flare, r: 160 }, { x: -400, a: 0 }, { x: STAND.x, col: HEX.pink, a: 1.0, r: 160 }, { x: RING.x + 200, col: HEX.pink, a: 0.6 * flare, r: 160 }] as Spot[] }));
        if (flare > 0) { g.strokeStyle = rgbaHex(HEX.pink, 0.5 * flare); g.lineWidth = 60; g.beginPath(); g.arc(RING.x, RING.y, RING.r, 0, TAU); g.stroke(); }
        this.mem(c, g, t, 1);
        this.octo(c, g, t);
        stool(c, STOOL.x, SET.floor, STOOL.h, stoodUp ? 0.08 * Math.exp(-(t - k.bottom! - 0.22) * 4) * Math.sin((t - k.bottom!) * 30) : 0);
        const x = lerp(SIT.x, STAND.x, ease.outQuad(up)), y = lerp(SIT.y, STAND.y, ease.inOutQuad(up)) - Math.sin(Math.PI * up) * 70;
        const a = this.rai(c, x, y, R0, t, {
          face: t >= k.bottom! - 0.05 ? 'fierce' : 'soft', arms: t >= k.sea34! ? ['fist', 'up'] : t >= k.bottom! - 0.05 ? ['fist', 'fist'] : ['hold', 'hold'],
          armsFrom: t >= k.sea34! ? ['fist', 'fist'] : ['hold', 'hold'], armsU: clamp((t - (t >= k.sea34! ? k.sea34! : k.bottom! - 0.05)) / 0.15),
          squash: up > 0 && up < 1 ? 0.25 : stoodUp && t < k.bottom! + 0.45 ? -0.3 * Math.sin(Math.PI * clamp((t - k.bottom! - 0.22) / 0.23)) : 0,
          heart: 0.6 + 0.4 * flare, marks: stoodUp ? ['sparkle'] : [], markT0: k.bottom! + 0.25,
        }, -1);
        void a;
        studioFront(c, g, t, { crowd: 1, mood: 'sway' });
      });
      // the lines of force as she lands
      const lf = clamp(1 - (t - k.bottom! - 0.2) / 0.5);
      if (t >= k.bottom! + 0.2 && lf > 0) {
        const hp = toScreen(cam, STAND.x, STAND.y - 60);
        focusLines(c, hp.x, hp.y, 330 * hp.s, rgbaHex('#ffe0ee', 0.75), t, { alpha: lf, n: 80 });
      }
      liveBug(c, g, t);
      post = mergePost(post, punch(t, [k.bottom! + 0.22], 0.03), punch(t, [k.sea34!], 0.025), hitShake(t, [k.sea34!], 6, 0.34), caKick(t, [k.sea34!], 4, 0.3));
    }
    // STONE, across the match cut
    if (shot <= 1) slam(c, 'STONE', W / 2, 150, 180, t, k.stone!, { col: HEX.pink, shadow: HEX.ink, rot: -0.03, t1: k.m2! - 0.4, exit: 0.2 });

    lyricBand(c, this.all, t, this.ctx.start, this.ctx.end);
    plateMask(g, this.all, t, this.ctx.start, this.ctx.end);
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    return mergePost(post, { zoom: 1 + 0.004 * f.a.kick });
  }

  /** The audience's jellyfish lighters, held up over the creatures (seat key -> how lit). */
  lighters(c: C2, g: C2, t: number, lit: (key: string, i: number) => number) {
    const rows = ['D', 'C', 'B', 'A'];
    rows.forEach((row, ri) => {
      for (let col = 1; col <= 12; col++) {
        const kind = seatKind(row, col);
        if (kind !== 'fish' && kind !== 'crab' && kind !== 'jelly') continue;
        const i = ri * 13 + col, a = lit(`${row}${col}`, i);
        if (a <= 0) continue;
        const o = occ(row, col), sw = 0.22 * this.sway(t, col * 0.25);
        jellyLighter(c, g, o.x + 22 * o.s + 40 * o.s * sw, o.y - 72 * o.s, 0.95 * o.s, t, i, a, sw);
      }
    });
  }

  /** M4: the heart shot. Rai close (her own scale), the ring and the memory far behind, a parallax push into the hole. */
  heartShot(c: C2, g: C2, t: number, lt: number) {
    const k = this.k, dur = k.m5! - k.m4!, u = ease.inOutCubic(clamp(lt / dur));
    const R = 205, Hc = { x: W / 2, y: 566 };
    const zr = lerp(1, 1.72, u), zb = lerp(1, 1.3, u);
    // the back wall in the dark, and the ring of pink bulbs out of focus behind her
    const bg = c.createRadialGradient(Hc.x, Hc.y, 60, Hc.x, Hc.y, W * 0.7);
    bg.addColorStop(0, '#3a1236'); bg.addColorStop(1, '#0c0612');
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    c.save(); g.save();
    for (const cc of [c, g]) { cc.translate(Hc.x, Hc.y); cc.scale(zb, zb); cc.translate(-Hc.x, -Hc.y); }
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * TAU + 0.1, x = Hc.x + Math.cos(a) * 560, y = Hc.y - 40 + Math.sin(a) * 470;
      const on = 0.6 + 0.4 * Math.sin(t * 6 - i * 0.8);
      g.fillStyle = rgbaHex(HEX.pink, 0.22 * on); g.beginPath(); g.arc(x, y, 46, 0, TAU); g.fill();
      c.fillStyle = rgbaHex('#ff9fc8', 0.25 * on); c.beginPath(); c.arc(x, y, 40, 0, TAU); c.fill();
    }
    // the memory, exactly behind her heart
    memory(c, NULL_G, Hc.x, Hc.y, 145, t, 1, Math.sin(Math.PI * this.ctx.audio.beatAt(t)), true); // no glow: it would lie over her
    c.restore(); g.restore();
    // Rai, close, the camera pushing into the hole that is her heart
    c.save(); g.save();
    for (const cc of [c, g]) { cc.translate(Hc.x, Hc.y); cc.scale(zr, zr); cc.translate(-Hc.x, -Hc.y); }
    const seeing = t >= k.see!, counting = t >= k.count! - 0.1;
    this.rai(c, Hc.x, Hc.y - 0.12 * R, R, t, {
      face: seeing ? 'love' : counting ? 'asleep' : 'soft', arms: ['down', 'down'], heart: 0, look: 0, tilt: 0.03 * this.sway(t), noBlink: counting,
      blush: seeing ? 1 : 0.4, glowStrength: 0.5,
    }, -1);
    // her heart's rim, glowing as the line lands on "see"
    const rim = clamp((t - k.see!) / 0.35);
    const hr = 0.27 * R;
    g.strokeStyle = rgbaHex(HEX.pink, 0.12 + 0.3 * rim); g.lineWidth = 6 + 6 * rim;
    g.beginPath(); g.arc(Hc.x, Hc.y, hr, 0, TAU); g.stroke();
    c.restore(); g.restore();
    spotPool(c, Hc.x, Hc.y, 330, 0.35, '20,4,18');
    void PLUM;
  }
}
