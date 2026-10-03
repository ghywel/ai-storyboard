// v2 `dream` (117.80-131.09, chorus 2, lines 32-35): the fever dream. The doll's house ripples away and the girl's
// bedroom floods gently into the sea: the water rises over the floorboards, the bed floats, reeds grow from the rug,
// fish swim between the bedposts, the lamp's shade lifts off as a jellyfish, and the mother sleeps on in her rocking
// chair, her shawl and plait drifting. Rai, full size, sits on the end of the bed. Pink sung colour throughout.
//
//   R1 "I'm the stone at the bottom of the sea,": the ripple clears on the room as the water comes in. STONE rises in
//      pink bubbles over the bed (they pop on "sea"). The mask drifts off the footboard onto the sleeping girl's face.
//      Rai: soft, a hand to her heart; looking round at the water; then a small open-armed smile: welcome to mine.
//   R2 "nobody's seen me but everybody believes;": the storybooks lift off the shelf one by one and swim round the room
//      like a shoal, flapping their covers; on "everybody believes" their pictures glow. Rai: sly, then in love.
//   R3 "if you can count a thing you can't even see,": the room soft, Rai sharp: the old ledger book drifts past in
//      front of her, open on its pink 0; she points at it on "count"; on "can't even see" the 0 lifts off the page as
//      a ring. Rai: wow.
//   R4 "who else is waiting at the bottom of the sea?": the ring floats to Rai and settles into her heart-hole, which
//      glows pink. The camera pulls back: the girl, half asleep, turns her mask to her mother; Rai looks at the mother
//      too, serious, then determined. (The next cut is `dinner`, the next evening.)
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../../engine/scene';
import { Layer2D, W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import type { Line, Word } from '../../engine/lyrics';
import { clamp, ease, lerp } from '../../engine/util';
import { drawRai, type RaiOpts } from '../_rai';
import { FAM, TAU, rgbaHex } from '../_motifs';
import { font } from '../../engine/type';
import { h01 } from '../_rai';
import { mergePost, punch } from '../_post';
import { ledgerBook, bubbleLyric, clearGlowBand } from './_diver';
import { RM, bedroom, applyCam, camLerp, handLine, bedLift, type Cam, type RoomOpts, type Dream as DreamOpts } from './fever-room';
import { wordBubbles, flyingBooks, pinkRing } from './dream-sea';
import { Lens, SoftLayer } from './fever-lens';

type C2 = CanvasRenderingContext2D;
const wd = (l: Line, re: RegExp, nth = 0): Word => l.words.filter((w) => re.test(w.w.toLowerCase()))[nth] ?? l.words[0]!;
/** Rai on the end of the bed: on the footboard, her feet over the quilt's end (room px; she rides the floating bed). */
const RAI = { x: RM.bed.x1 + 40, feet: RM.bed.top - 24, R: 86 };

export default class Dream extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  S = new SoftLayer();
  lens = new Lens();
  lines: Line[] = [];
  T: Record<string, number> = {};
  cuts: number[] = [];
  stonePts: [number, number][] = [];

  override init() {
    const { lyrics: ly, start } = this.ctx;
    // chorus 2: the lines whose first word falls in this window (the chorus is sung in `manta` and `dawn` too)
    const inWin = (l: Line) => l.words[0]!.start >= start - 0.1 && l.words[0]!.start < this.ctx.end;
    this.lines = ly.lines.filter(inWin);
    const [l32, l33, l34, l35] = this.lines as [Line, Line, Line, Line];
    if (this.lines.length !== 4 || !/stone/i.test(l32.text) || !/waiting/i.test(l35.text)) throw new Error(`dream: expected chorus 2's four lines, got ${this.lines.map((l) => l.text).join(' | ')}`);
    const T = this.T;
    T.im = l32.words[0]!.start; T.stone = wd(l32, /stone/).start; T.bottom = wd(l32, /bottom/).start; T.sea = wd(l32, /sea/).start;
    T.nobody = l33.words[0]!.start; T.every = wd(l33, /everybody/).start; T.believes = wd(l33, /believes/).start;
    T.if = l34.words[0]!.start; T.count = wd(l34, /count/).start; T.cant = wd(l34, /can.t/).start; T.see = wd(l34, /see/).start; T.seeEnd = wd(l34, /see/).end;
    T.who = l35.words[0]!.start; T.waiting = wd(l35, /waiting/).start; T.bottom2 = wd(l35, /bottom/).start; T.sea2 = wd(l35, /sea/).start;
    this.cuts = [start, T.nobody - 0.02, T.if - 0.02, T.who - 0.02];
    this.stonePts = latticePoints('STONE', FAM.hook(), 172, 586, 142, 12.5);
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t, T = this.T;
    const shot = Math.max(0, this.cuts.filter((x) => t >= x).length - 1), s0 = this.cuts[shot]!, s1 = this.cuts[shot + 1] ?? this.ctx.end, lt = t - s0;
    const soft = shot === 2;
    this.L.clear(soft ? undefined : HEX.ink); this.G.clear(); if (soft) this.S.clear('#101830');
    let post: PostOverrides = { bloom: 0.8, vignette: 0.45 };
    let amp = 0, blur = 0;

    // the dream's progress (shared by every shot so the cuts agree)
    const start = this.ctx.start;
    const dream: DreamOpts = {
      flood: ease.inOutQuad(clamp((t - (start + 0.1)) / (T.sea - start + 0.1))),
      float: ease.inOutCubic(clamp((t - (T.stone + 0.4)) / 1.4)),
      reeds: clamp((t - (T.stone - 0.1)) / 2.2),
      fish: clamp((t - (T.bottom - 0.1)) / 0.8),
      jelly: ease.inOutCubic(clamp((t - (T.bottom - 0.2)) / 1.6)),
      books: t >= T.nobody ? 1 : 0,
      drift: clamp((t - T.stone) / 1.5),
    };
    const turn = clamp((t - (T.bottom2 - 0.05)) / 0.5);
    const roomOpts = (): RoomOpts => ({
      t, clockSec: 3 + (t - 97.66), lamp: 1,
      mom: { rock: 0.012, asleep: true },
      girl: { state: 'dream', mask: clamp((t - (T.bottom + 0.1)) / 0.9), glint: turn > 0.5 ? 'plain' : 'droop', turn },
      book: t >= T.nobody ? null : { open: 1, zero: 1, minus: 1, blot: 1 },
      pendant: null, dream,
    });
    const lift = bedLift(t, dream.float ?? 0);
    const raiAt = { x: RAI.x, y: RAI.feet - lift - 1.07 * RAI.R };

    // the ring's flight (R4), shared with Rai's heart
    const ringU = clamp((t - (T.who - 0.02)) / (T.waiting + 0.05 - T.who));
    const settled = t >= T.waiting + 0.05;

    if (shot === 0) {
      // R1: the room floods; STONE in pink bubbles; the mask drifts to her face
      const cam = camLerp({ x: 716, y: 486, z: 1.2 }, { x: 752, y: 474, z: 1.28 }, ease.inOutQuad(clamp(lt / (s1 - s0))));
      c.save(); g.save(); applyCam(c, cam); applyCam(g, cam);
      bedroom(c, g, roomOpts());
      wordBubbles(c, g, t, this.stonePts, T.stone - 0.15, T.sea + 0.05);
      const look = t >= T.bottom && t < T.sea;
      this.rai(c, raiAt, {
        t, face: t >= T.sea ? 'smile' : look ? 'wow' : 'soft', arms: t >= T.sea ? ['up', 'up'] : look ? ['down', 'down'] : ['down', 'cheek'],
        armsFrom: ['down', 'down'], armsU: t >= T.sea ? clamp((t - T.sea) / 0.3) * 0.7 : 1, look: look ? -0.6 + 0.5 * Math.sin((t - T.bottom) * 3) : -0.3,
        heart: 0.35 + 0.3 * clamp((t - T.stone) / 0.4), heartColor: HEX.pink, glow: HEX.cyan, glowStrength: 0.6,
        marks: t >= T.sea ? ['sparkle'] : [], markT0: T.sea + 0.05, tilt: -0.04,
      });
      c.restore(); g.restore();
      const u = clamp(lt / 0.6);
      amp = 1 - ease.outCubic(u); blur = 16 * Math.pow(1 - u, 2);
    } else if (shot === 1) {
      // R2: the storybooks swim off the shelf; on "everybody believes" their pictures glow
      const cam = camLerp({ x: 700, y: 440, z: 1.24 }, { x: 724, y: 420, z: 1.32 }, ease.inOutQuad(clamp(lt / (s1 - s0))));
      c.save(); g.save(); applyCam(c, cam); applyCam(g, cam);
      bedroom(c, g, roomOpts());
      flyingBooks(c, g, t, T.nobody - 0.05, T.every);
      const love = t >= T.every;
      this.rai(c, raiAt, {
        t, face: love ? 'love' : 'scheme', arms: love ? ['cheek', 'cheek'] : ['chin', 'hold'], armsFrom: ['down', 'down'], armsU: clamp(lt / 0.25),
        marks: love ? ['hearts'] : [], markT0: T.every + 0.1, look: love ? -0.4 : 0.6, blush: love ? 0.6 : 0,
        heart: love ? 0.8 : 0.4, heartColor: HEX.pink, glow: love ? HEX.pink : HEX.cyan, glowStrength: 0.6, tilt: love ? 0.08 : -0.06,
        hop: love ? 0.1 * Math.abs(Math.sin((t - T.every) * 6)) * (1 - clamp((t - T.every) / 1.2)) : 0,
      });
      c.restore(); g.restore();
      post = mergePost(post, punch(t, [T.every], 0.012));
    } else if (shot === 2) {
      // R3: the room soft, Rai sharp; the ledger drifts past open on its 0; the 0 lifts off as a ring
      const cam = camLerp({ x: 880, y: 470, z: 1.42 }, { x: 900, y: 460, z: 1.5 }, ease.inOutQuad(clamp(lt / (s1 - s0))));
      const s = this.S.ctx;
      s.save(); g.save(); applyCam(s, cam); applyCam(g, cam);
      bedroom(s, g, roomOpts());
      s.restore(); g.restore();
      // the book, near the lens, drifting left to right across her
      const p1 = ease.outCubic(clamp((t - s0) / (T.count + 0.3 - s0))), p2 = clamp((t - (T.count + 0.3)) / (s1 - T.count - 0.3));
      const bx = lerp(-320, 520, p1) + 90 * p2, by = lerp(640, 560, p1) - 20 * p2 + 10 * Math.sin(t * 1.3), rot = -0.12 + 0.08 * p1 + 0.03 * Math.sin(t);
      const lift = ease.inOutCubic(clamp((t - T.cant) / (T.seeEnd - T.cant)));
      c.save(); g.save(); for (const k of [c, g]) { k.translate(bx, by); k.rotate(rot); }
      ledgerBook(c, g, 0, 0, 1.25, t, { open: 1, zero: 1, minus: 1, blot: 1, lift });
      c.restore(); g.restore();
      // Rai, sharp, at her place in the soft room
      c.save(); g.save(); applyCam(c, cam); applyCam(g, cam);
      const wow = t >= T.cant;
      this.rai(c, raiAt, {
        t, face: wow ? 'wow' : t >= T.count ? 'scheme' : 'soft', arms: wow ? ['cheek', 'cheek'] : t >= T.count ? ['chin', 'point'] : ['down', 'down'],
        armsFrom: ['down', 'down'], armsU: clamp((t - T.count) / 0.2), look: -0.8, marks: wow ? ['!'] : [], markT0: T.cant + 0.1,
        heart: 0.45, heartColor: HEX.pink, glow: HEX.cyan, glowStrength: 0.6,
      });
      c.restore(); g.restore();
    } else {
      // R4: the ring settles into her heart; the pull back; the girl and Rai look at the mother
      const keys: [number, Cam][] = [[s0, { x: 930, y: 440, z: 1.75 }], [T.waiting + 0.3, { x: 960, y: 452, z: 1.9 }], [T.bottom2 - 0.5, { x: 962, y: 454, z: 1.93 }], [T.sea2 - 0.1, { x: 760, y: 530, z: 1.26 }], [this.ctx.end, { x: 756, y: 528, z: 1.29 }]];
      let cam = keys[0]![1];
      for (let i = 0; i < keys.length - 1; i++) { const [ta, ca] = keys[i]!, [tb, cb] = keys[i + 1]!; if (t >= ta) cam = camLerp(ca, cb, ease.inOutCubic(clamp((t - ta) / (tb - ta)))); }
      c.save(); g.save(); applyCam(c, cam); applyCam(g, cam);
      bedroom(c, g, roomOpts());
      const serious = t >= T.bottom2, determined = t >= T.sea2 - 0.05;
      const heartY = raiAt.y - 0.12 * RAI.R * -1;   // the hole sits a little below the disc's centre (y up in her frame)
      const a = this.rai(c, raiAt, {
        t, face: determined ? 'determined' : serious ? 'serious' : settled ? 'love' : 'wow',
        arms: determined ? ['fist', 'hip'] : serious ? ['down', 'down'] : settled ? ['cheek', 'cheek'] : ['reach', 'reach'],
        armsFrom: serious ? ['cheek', 'cheek'] : ['down', 'down'], armsU: serious ? clamp((t - T.bottom2) / 0.25) : clamp((t - s0) / 0.3),
        look: serious ? -1 : -0.5, tilt: serious ? -0.1 * clamp((t - T.bottom2) / 0.3) : 0, heart: settled ? 1 : 0.45, heartColor: HEX.pink, glow: settled ? HEX.pink : HEX.cyan, glowStrength: settled ? 1.1 : 0.6,
        marks: determined ? ['shine'] : settled && !serious ? ['hearts'] : [], markT0: determined ? T.sea2 : T.waiting + 0.1, blush: settled && !serious ? 0.7 : 0,
        squash: settled && t < T.waiting + 0.25 ? -0.15 * Math.sin(Math.PI * (t - T.waiting - 0.05) / 0.2) : 0,
      });
      void heartY;
      // the ring's flight from where the ledger let it go, curving down into her heart
      if (!settled) {
        const u = ease.inOutCubic(ringU), sx = 640, sy = 300, hx = a.heart.x, hy = a.heart.y;
        const x = lerp(sx, hx, u) + Math.sin(u * Math.PI) * 120, y = lerp(sy, hy, u) - Math.sin(u * Math.PI) * 90;
        pinkRing(c, g, x, y, lerp(56, a.heart.r * 1.05, ease.inCubic(u)), t, 1, lerp(0.24, 0.3, u));
      } else {
        const pu = clamp((t - (T.waiting + 0.05)) / 0.6);
        pinkRing(c, g, a.heart.x, a.heart.y, a.heart.r * 1.05, t, 1, 0.3);
        if (pu < 1) { g.strokeStyle = rgbaHex(HEX.pink, 0.7 * (1 - pu)); g.lineWidth = 6; g.beginPath(); g.arc(a.heart.x, a.heart.y, a.heart.r * (1 + 5 * ease.outCubic(pu)), 0, TAU); g.stroke(); }
        const hg = g.createRadialGradient(a.heart.x, a.heart.y, 2, a.heart.x, a.heart.y, a.heart.r * 3.2);
        hg.addColorStop(0, rgbaHex(HEX.pink, 0.55)); hg.addColorStop(1, rgbaHex(HEX.pink, 0));
        g.fillStyle = hg; g.fillRect(a.heart.x - a.heart.r * 3.2, a.heart.y - a.heart.r * 3.2, a.heart.r * 6.4, a.heart.r * 6.4);
      }
      c.restore(); g.restore();
      post = mergePost(post, punch(t, [T.waiting + 0.05], 0.018));
    }
    const line = handLine(this.lines, t);
    if (line) bubbleLyric(c, line, t, { sung: HEX.pink });
    clearGlowBand(g);
    this.lens.draw(renderer, out, this.L.upload(), this.G.upload(), soft ? this.S.upload(6) : null, { t, amp, blur });
    return post;
  }

  /** Full-size Rai sitting on the footboard at the end of the bed. */
  rai(c: C2, at: { x: number; y: number }, o: RaiOpts) {
    return drawRai(c, at.x, at.y, RAI.R, o);
  }
}

/** Points on a jittered lattice inside a word's glyphs (even, legible bubble lettering), centred at (cx, cy). */
function latticePoints(text: string, fam: string, size: number, cx: number, cy: number, step: number): [number, number][] {
  const cw = Math.ceil(size * text.length * 0.95 + 40), ch = Math.ceil(size * 1.3);
  const oc = new OffscreenCanvas(cw, ch), k = oc.getContext('2d')!;
  k.font = font(fam, size); k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillStyle = '#fff'; k.fillText(text, cw / 2, ch / 2);
  const d = k.getImageData(0, 0, cw, ch).data, out: [number, number][] = [];
  let i = 0;
  for (let y = step / 2; y < ch; y += step * 0.87) {
    const row = Math.round(y / (step * 0.87));
    for (let x = (row % 2 ? step / 2 : 0); x < cw; x += step) {
      const ix = Math.round(x), iy = Math.round(y);
      if (d[(iy * cw + ix) * 4 + 3]! > 160) out.push([cx - cw / 2 + x + (h01(i, 11) - 0.5) * 3, cy - ch / 2 + y + (h01(i, 12) - 0.5) * 3]);
      i++;
    }
  }
  return out;
}