// v2 `fever` (97.66-104.95, lines 26-27): 4 am and the nothing. TREATMENT-v2.md's script, cut on the beat or the word:
//
//   S1 "but up the road there's a": the village asleep under the moon, every window dark but one: the stilt hut at the
//      top of the sandy road (the home from `dive`), the girl's wet footprints running up to its steps from `harbour`.
//      On the lit window's curtain, a woman's shadow, rocking. The camera climbs the road and pushes into the window.
//   S2 "woman awake at": inside, warm. The mother in her rocking chair at the bedside, awake, a cold cloth in her
//      hands, rocking slightly, sighing; the lamp throws her shadow huge on the wall; the girl asleep with a fever.
//   S3 "four": the wall clock, 4:00, its red second hand ticking.
//   S4 "with a fever, a lunchbox, a bill": on the girl (the flush, the sweat, the thermometer); chibi Rai peeks out of
//      the pebble pendant on the bedside table, worried. Whip pans on the words: the lunchbox packed on her school bag
//      (a note with a heart), then the bill on the dresser: ELECTRICITY, FINAL NOTICE, £82.40.
//   S5 "and your ledger looks right at her, blinks": the ledger book on the shelf among the storybooks, sharp in the
//      foreground, the room soft behind. Its eye opens on "looks", turns right at the mother, blinks on "blinks", and
//      its cover starts to swing.
//   S6 "and writes zero. Not minus.": the spread fans open; the nib writes a big pink 0 on "zero"; on "minus" it
//      scratches a "−" in front of it, and blots it out.
//   S7 "Just nothing. Still.": the room, still: the mother does not move, the girl sleeps, the clock ticks, the open
//      book shows its 0. On "Still." the pendant glows pink and chibi Rai pops out and glares at the book: angry, a
//      vein, steam. No shake.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../../engine/scene';
import { Layer2D, W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import type { Line, Word } from '../../engine/lyrics';
import { clamp, ease } from '../../engine/util';
import { h01 } from '../_rai';
import { FAM, TAU, rgbaHex } from '../_motifs';
import { font } from '../../engine/type';
import { ledgerBook, bubbleLyric, clearGlowBand } from './_diver';
import { RM, bedroom, applyCam, camLerp, shelfOnly, handLine, type Cam, type RoomOpts } from './fever-room';
import { hutNight, HUT_WIN } from './fever-hut';
import { Lens, SoftLayer } from './fever-lens';

type C2 = CanvasRenderingContext2D;
const PI = Math.PI;
const wd = (l: Line, re: RegExp, nth = 0): Word => l.words.filter((w) => re.test(w.w.toLowerCase()))[nth] ?? l.words[0]!;

export default class Fever extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  S = new SoftLayer();
  lens = new Lens();
  lines: Line[] = [];
  T: Record<string, number> = {};
  cuts: number[] = [];

  override init() {
    const { lyrics: ly, audio: au, start } = this.ctx;
    const a = ly.get('but up the road'), b = ly.get('and your ledger looks');
    this.lines = [a, b];
    const floorBeat = (s: number) => au.timeOfBeat(Math.floor(au.beatAt(s + 0.02)));
    const nearBeat = (s: number) => au.timeOfBeat(Math.round(au.beatAt(s)));
    const T = this.T;
    T.woman = wd(a, /woman/).start; T.four = wd(a, /four/).start; T.fever = wd(a, /fever/).start;
    T.lunch = wd(a, /lunchbox/).start; T.bill = wd(a, /bill/).start;
    T.ledger = wd(b, /ledger/).start; T.looks = wd(b, /looks/).start; T.right = wd(b, /right/).start; T.blinks = wd(b, /blinks/).start;
    T.writes = wd(b, /writes/).start; T.zero = wd(b, /zero/).start; T.zeroEnd = wd(b, /zero/).end; T.not = wd(b, /^not/).start;
    T.minus = wd(b, /minus/).start; T.minusEnd = wd(b, /minus/).end; T.just = wd(b, /just/).start; T.nothing = wd(b, /nothing/).start;
    T.still = wd(b, /still/).start; T.stillEnd = wd(b, /still/).end;
    this.cuts = [start, floorBeat(T.woman), T.four - 0.06, floorBeat(T.fever), nearBeat(T.ledger), nearBeat(T.zero), T.just - 0.02];
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t, T = this.T;
    const shot = Math.max(0, this.cuts.filter((x) => t >= x).length - 1), s0 = this.cuts[shot]!, s1 = this.cuts[shot + 1] ?? this.ctx.end, lt = t - s0;
    const soft = shot === 4 || shot === 5;
    this.L.clear(soft ? undefined : HEX.ink); this.G.clear();
    let warm = 0;
    const post: PostOverrides = { bloom: 0.75, vignette: 0.5 };
    const room = (cam: Cam, o: Partial<RoomOpts>) => {
      c.save(); g.save(); applyCam(c, cam); applyCam(g, cam);
      bedroom(c, g, { t, clockSec: 3 + (t - this.ctx.start), girl: { state: 'fever' }, book: { eye: 0 }, pendant: { pop: 0 }, ...o });
      c.restore(); g.restore();
    };

    if (shot === 0) {
      // S1: up the road, into the lit window
      const push = ease.inOutCubic(clamp(lt / (s1 - s0 - 0.22))), dive = clamp((t - (s1 - 0.24)) / 0.24);
      const target: Cam = { x: HUT_WIN.x, y: HUT_WIN.y, z: 1.55 };
      let cam = camLerp({ x: W / 2 + 40, y: H / 2 + 30, z: 1.04 }, target, push * 0.62);
      if (dive > 0) cam = camLerp(cam, { x: HUT_WIN.x, y: HUT_WIN.y + 4, z: 14 }, ease.inCubic(dive));
      c.save(); g.save(); applyCam(c, cam); applyCam(g, cam);
      hutNight(c, g, t);
      c.restore(); g.restore();
      warm = 0.9 * ease.inQuad(dive);
    } else if (shot === 1) {
      // S2: the mother awake, rocking, sighing; her shadow on the wall
      const cam = camLerp({ x: 640, y: 676, z: 1.46 }, { x: 664, y: 664, z: 1.6 }, ease.inOutQuad(clamp(lt / (s1 - s0))));
      room(cam, { mom: { rock: 0.04, emote: 'sigh', emoteT0: s0 + 0.15 } });
      warm = 0.7 * (1 - ease.outCubic(clamp(lt / 0.3)));
    } else if (shot === 2) {
      // S3: the clock, 4:00
      const cam = camLerp({ x: 990, y: 214, z: 4.3 }, { x: 990, y: 212, z: 4.7 }, ease.outCubic(clamp(lt / (s1 - s0))));
      room(cam, { noShadow: true, mom: { rock: 0.04 } });
    } else if (shot === 3) {
      // S4: the fever; the pendant's worried peek; whip pans to the lunchbox and the bill
      const girlCam: Cam = { x: 430, y: 566, z: 2.45 }, lunchCam: Cam = { x: 1392, y: 736, z: 2.9 }, billCam: Cam = { x: 1506, y: 574, z: 4.1 };
      const u1 = ease.inOutCubic(clamp((t - (T.lunch - 0.1)) / 0.22)), u2 = ease.inOutCubic(clamp((t - (T.bill - 0.08)) / 0.2));
      let cam = camLerp({ x: 410, y: 570, z: 2.3 }, girlCam, ease.outCubic(clamp(lt / 0.4)));
      if (u1 > 0) cam = camLerp(cam, lunchCam, u1);
      if (u2 > 0) cam = camLerp(cam, billCam, u2);
      const pop = clamp((t - (T.fever + 0.04)) / 0.16) * (1 - clamp((t - (T.lunch - 0.16)) / 0.1));
      room(cam, {
        mom: { rock: 0.04 },
        pendant: { pop, rai: { face: 'sad', marks: ['sweat'], markT0: T.fever + 0.2, look: 0.7, tilt: 0.1 } },
      });
      // a soft highlight on what the word names: the lunchbox, the bill
      highlight(c, g, cam, RM.lunch.x + 4, RM.lunch.y - 124, 120, clamp((t - T.lunch) / 0.15) * (1 - u2));
      highlight(c, g, cam, RM.bill.x, RM.bill.y, 70, clamp((t - T.bill) / 0.15));
    } else if (shot === 4) {
      // S5: the ledger looks right at her. The room soft behind, the shelf sharp in front.
      const bg: Cam = { x: 404 - 14 * clamp(lt / 1.3), y: 668, z: 1.34 };
      const s = this.S.ctx; this.S.clear(HEX.ink);
      s.save(); applyCam(s, bg); bedroom(s, g, { t, noShelf: true, noShadow: true, clockSec: 3 + (t - this.ctx.start), girl: { state: 'fever' }, mom: { rock: 0.04 }, pendant: { pop: 0 } }); s.restore();
      this.G.clear();   // the soft room's glow drew at the wrong place: keep only the sharp layer's
      const eye = ease.outBack(clamp((t - T.looks) / 0.2)), look = ease.inOutCubic(clamp((t - T.right) / 0.3));
      const bk = Math.max(0, Math.sin(PI * clamp((t - T.blinks) / 0.18)));
      const open = 0.5 * ease.inCubic(clamp((t - (T.blinks + 0.24)) / Math.max(0.1, s1 - T.blinks - 0.24)));
      const cam: Cam = { x: 396 + 8 * clamp(lt / 1.3), y: 258, z: 3.9 + 0.15 * clamp(lt / 1.3) };
      c.save(); g.save(); applyCam(c, cam); applyCam(g, cam);
      shelfOnly(c, g, t, { eye, look: 0.95 * look, blink: bk, open });
      c.restore(); g.restore();
      // the lamp below the shelf lights the book's face
      const bx = W / 2 + (RM.book.x - cam.x) * cam.z, by = H / 2 + (RM.book.y - cam.y) * cam.z;
      c.save(); c.globalCompositeOperation = 'source-atop';
      const lg = c.createLinearGradient(0, by + 220, 0, by - 200); lg.addColorStop(0, 'rgba(255,170,90,0.28)'); lg.addColorStop(1, 'rgba(255,170,90,0)');
      c.fillStyle = lg; c.fillRect(0, 0, W, H); c.restore();
      if (eye > 0.3 && bk < 0.5) { // a cold flicker of attention along its stare
        const a = (eye - 0.3) * look * (1 - bk);
        const mx = W / 2 + (RM.mom.x - 6 - bg.x) * bg.z, my = H / 2 + (RM.mom.y - 300 - bg.y) * bg.z;   // her head, soft behind
        const gg = g.createLinearGradient(bx, by, mx, my); gg.addColorStop(0, rgbaHex(HEX.violet, 0.2 * a)); gg.addColorStop(1, rgbaHex(HEX.violet, 0.03 * a));
        g.fillStyle = gg; g.beginPath(); g.moveTo(bx + 40, by - 14); g.lineTo(mx, my - 70); g.lineTo(mx, my + 70); g.lineTo(bx + 40, by + 26); g.closePath(); g.fill();
      }
    } else if (shot === 5) {
      // S6: the spread fans open; the 0; the minus, blotted
      const s = this.S.ctx; this.S.clear(HEX.ink);
      s.save(); applyCam(s, { x: 360, y: 320, z: 1.9 }); bedroom(s, g, { t, noShelf: true, noShadow: true, clockSec: 3 + (t - this.ctx.start), girl: { state: 'fever' }, mom: { rock: 0.04 }, pendant: { pop: 0 } }); s.restore();
      this.G.clear();
      const open = 0.5 + 0.5 * ease.outCubic(clamp(lt / 0.14));
      const zero = ease.inOutQuad(clamp((t - (T.zero + 0.02)) / Math.max(0.2, T.zeroEnd - T.zero - 0.04)));
      const minus = ease.inOutQuad(clamp((t - (T.minus - 0.02)) / 0.16));
      const blot = ease.outBack(clamp((t - (T.minus + 0.2)) / 0.18));
      const bs = 2.05 + 0.06 * clamp(lt / 1.0), bx = W / 2 + 30, by = H * 0.43;
      // the shelf under the open book, and the storybooks either side of it
      shelfInsert(c, bx, by + 134 * bs, bs, t);
      ledgerBook(c, g, bx, by, bs, t, { open, zero, minus, blot: blot > 0 ? Math.min(1, blot) : 0 });
      if (open > 0.8) ledgerEntry(c, bx, by, bs, clamp((t - (T.writes - 0.1)) / 0.3));
      if (open < 0.999) pageFan(c, bx, by, bs, clamp(lt / 0.14));
      if (blot > 0) inkBlot(c, bx + 33 * bs, by + 4 * bs, bs, Math.min(1.1, blot), T.minus);
      // the lamp's warmth on the page from below-left
      c.save(); c.globalCompositeOperation = 'source-atop';
      const lg = c.createRadialGradient(bx - 500, by + 400, 50, bx - 500, by + 400, 1300); lg.addColorStop(0, 'rgba(255,170,90,0.22)'); lg.addColorStop(1, 'rgba(255,170,90,0)');
      c.fillStyle = lg; c.fillRect(0, 0, W, H); c.restore();
    } else {
      // S7: still. The clock ticks; on "Still." the pendant glows and chibi Rai glares at the book
      const cam = camLerp({ x: 640, y: 476, z: 1.7 }, { x: 610, y: 470, z: 1.78 }, ease.inOutQuad(clamp(lt / (s1 - s0))));
      const pop = ease.outBack(clamp((t - (T.still + 0.02)) / 0.16));
      const glow = clamp((t - (T.still - 0.12)) / 0.25);
      room(cam, {
        mom: { rock: 0 },
        book: { open: 1, zero: 1, minus: 1, blot: 1 },
        pendant: { pop, s: 1.3, glow: 0.4 + 0.5 * glow, rai: { face: 'angry', marks: ['vein', 'steam'], markT0: T.still + 0.1, look: -0.9, tilt: -0.08, blush: 0.5, shake: 0.3 } },
      });
    }
    // the sung line, pink (the tender section)
    const line = handLine(this.lines, t);
    if (line) bubbleLyric(c, line, t, { sung: HEX.pink });
    clearGlowBand(g);
    this.lens.draw(renderer, out, this.L.upload(), this.G.upload(), soft ? this.S.upload(5) : null, { t, warm });
    return post;
  }
}

/** A soft pool of light over what the word names (camera-mapped room point). */
function highlight(c: C2, g: C2, cam: Cam, x: number, y: number, r: number, a: number) {
  if (a <= 0) return;
  const sx = W / 2 + (x - cam.x) * cam.z, sy = H / 2 + (y - cam.y) * cam.z, R = r * cam.z;
  const gg = g.createRadialGradient(sx, sy, R * 0.2, sx, sy, R);
  gg.addColorStop(0, rgbaHex('#ffd9a0', 0.14 * a)); gg.addColorStop(1, rgbaHex('#ffd9a0', 0));
  g.fillStyle = gg; g.fillRect(sx - R, sy - R, 2 * R, 2 * R);
  void c;
}

/** The ledger's pages fanning over as it falls open (the first 0.14 s of the insert). */
function pageFan(c: C2, x: number, y: number, s: number, u: number) {
  for (let k = 0; k < 6; k++) {
    const v = clamp(u * 1.4 - k * 0.07); if (v <= 0 || v >= 1) continue;
    const a = PI * v, w = 200 * Math.cos(a);
    c.fillStyle = `rgba(239,230,204,${0.9 - k * 0.1})`;
    c.beginPath(); c.moveTo(x, y - 126 * s); c.quadraticCurveTo(x + w * 0.5 * s, y - (136 - 10 * Math.sin(a)) * s, x + w * s, y - 124 * s); c.lineTo(x + w * s, y + 126 * s); c.quadraticCurveTo(x + w * 0.5 * s, y + 118 * s, x, y + 126 * s); c.closePath(); c.fill();
  }
}

/** An ink blot over the struck-out minus: a dark splat with droplets, spreading. */
function inkBlot(c: C2, x: number, y: number, s: number, u: number, seed: number) {
  const r = 24 * s * u;
  c.save(); c.fillStyle = '#2a1830';
  c.beginPath();
  for (let i = 0; i <= 18; i++) { const a = (i / 18) * TAU, rr = r * (0.82 + 0.3 * h01(i, Math.floor(seed * 10), 91)); i ? c.lineTo(x + Math.cos(a) * rr * 1.25, y + Math.sin(a) * rr * 0.8) : c.moveTo(x + Math.cos(a) * rr * 1.25, y + Math.sin(a) * rr * 0.8); }
  c.closePath(); c.fill();
  for (let i = 0; i < 6; i++) { const a = h01(i, 92) * TAU, d = r * (1.4 + 0.6 * h01(i, 93)); c.beginPath(); c.arc(x + Math.cos(a) * d * 1.2, y + Math.sin(a) * d * 0.8, s * (2 + 3 * h01(i, 94)) * u, 0, TAU); c.fill(); }
  c.fillStyle = 'rgba(255,255,255,0.12)'; c.beginPath(); c.ellipse(x - r * 0.3, y - r * 0.25, r * 0.35, r * 0.15, -0.3, 0, TAU); c.fill();
  c.restore();
}

/** The insert's shelf: the plank under the open ledger and the storybooks' spines either side (sharp, near). */
function shelfInsert(c: C2, x: number, y: number, s: number, t: number) {
  c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(-20, y - 6, W + 40, 14);
  c.fillStyle = '#4a3020'; c.fillRect(-20, y, W + 40, 34 * s / 2.05);
  c.fillStyle = '#6a4630'; c.fillRect(-20, y, W + 40, 8);
  const sp: [number, number, number, string][] = [[-560, 60, 300, '#2fe0ff'], [-490, 66, 270, '#78d63a'], [-420, 56, 320, '#ff4f9a'], [480, 64, 300, '#ff5a5f'], [550, 58, 280, '#2fb8a0'], [614, 70, 330, '#6f8cff']];
  for (const [dx, w, h, col] of sp) {
    const bx = x + dx * s / 2.05 - (dx < 0 ? w : 0);
    c.fillStyle = col; c.globalAlpha = 0.9; c.fillRect(bx, y - h, w, h); c.globalAlpha = 1;
    c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(bx + 6, y - h + 18, w - 12, 6); c.fillRect(bx + 6, y - 30, w - 12, 6);
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(bx + w - 8, y - h, 8, h);
  }
  void t;
}

/** The entry the 0 is written against, in the ledger's own clerk's hand: MUM, 4:00 AM, NIGHT. */
function ledgerEntry(c: C2, x: number, y: number, s: number, a: number) {
  if (a <= 0) return;
  c.save(); c.translate(x, y); c.scale(s, s); c.globalAlpha = a;
  c.fillStyle = 'rgba(40,40,60,0.7)'; c.font = font(FAM.mono(), 13); c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.fillText('MUM  4:00 AM', 16, -84); c.fillText('NIGHT, FEVER,', 16, -66); c.fillText('LUNCH, BILL', 16, -48);
  c.restore();
}