// QUICKFIRE (v1, 88.78-96.07; lines 23-24): the quick-fire round. Modern money's machines are the contestants, each on
// a podium that lights on its word; then the pledge on a phone that turns to gold, GENIUS in bulbs, two strangers who
// trade, and Rai's big X and wink. The round's clock counts down 0:07 to 0:00 across the plate, and at zero the show
// cuts away (uptheroad's channel flip). Cuts on the beat grid, one or two beats a shot.
//   23 "Now you print it, you wire it, you mine it in code, a pledge on a screen that you hold up as gold,"
//     Q1 PRINT: a cast-iron press stamps notes on "Now" and "print"; Rai points at it, cheeky. Q2 WIRE: a lightning arrow
//     zaps a £ from one phone to the other on "wire"; Rai, wow. Q3 MINE: a tiny pickaxe chips at a server rack on
//     "mine" and "code", binary flying like rock; Rai, chin in hand, one eyebrow up. Q4 CAM 1 wide: all three podiums
//     blazing, Rai presenting; in the front row a fin raises a phone on "pledge". Q5 close: the phone held up, its
//     screen a bank's pledge (I promise to pay the bearer on demand, £100); on "hold up" it goes higher, on "gold" it
//     dissolves pixel by pixel into a gold trophy.
//   24 "and honestly? Genius. It lets strangers trade. I'm not here to tell you that money's a fraud;"
//     Q6 "honestly?": Rai, chin in hand; on "Genius." GENIUS lights in bulbs letter by letter and she throws her arms up.
//     Q7 the two strangers from opposite wings (A's backpack and parcel, B's bobble hat and coin) meet mid-stage and
//     swap on "trade.", both glowing hearts; Rai behind them, in love with it, then on "not" she starts to cross her
//     arms. Q8 the big X: her arms crossed high, sassy, a red cross and BZZT behind her (the buzzer round's own sound).
//     Q9 the crash zoom: on "money's" the camera slams into her face and she winks (she is not saying that; the "but"
//     is coming).
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../../engine/scene';
import { Layer2D, W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import type { Line, Word } from '../../engine/lyrics';
import { clamp, ease, lerp } from '../../engine/util';
import { drawRai, h01, type RaiOpts } from '../_rai';
import { FAM, TAU, rgbaHex, mixHex, sunburst, halftone } from '../_motifs';
import { focusLines, reactionBg, star4 } from '../_manga';
import { caKick, hitShake, mergePost, punch } from '../_post';
import { cast } from './_cast';
import { SET, studio, studioFront, liveBug, camTag, micProp, textDots, drawDots } from './_studio';
import { plateLines, wordOf, shotAt, lyricBand, sfx, verdict, cam2, backdrop } from './pitch-kit';
import { podium, press, wire, rack, pledgeToGold, geniusSign, countdown } from './quickfire-props';

type C2 = CanvasRenderingContext2D;
const SIL = '#120d1d';
const MIC = { side: 1 as const, draw: micProp };
const COL = { print: HEX.lime, wire: HEX.cyan, mine: HEX.orange };

export default class Quickfire extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  band: Line[] = [];
  cuts: number[] = [];
  w: Record<string, Word> = {};

  override init() {
    const { lyrics, audio: au, start, end } = this.ctx;
    const { own, band } = plateLines(lyrics.lines, start, end);
    this.band = band;
    const q = (re: RegExp, n = 0) => wordOf(own, re, n);
    this.w = {
      now: q(/^now/), print: q(/^print/), wire: q(/^wire/), mine: q(/^mine/), code: q(/^code/), pledge: q(/^pledge/),
      screen: q(/^screen/), hold: q(/^hold/), gold: q(/^gold/), honestly: q(/^honestly/), genius: q(/^genius/),
      strangers: q(/^strangers/), trade: q(/^trade/), not: q(/^not$/), tell: q(/^tell/), moneys: q(/^money/), fraud: q(/^fraud/),
    };
    const b0 = Math.round(au.beatAt(start));
    this.cuts = [0, 1, 2, 4, 6, 9, 11, 14, 16].map((k) => au.timeOfBeat(b0 + k));
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, end } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t;
    this.L.clear(HEX.ink); this.G.clear();
    const s = shotAt(this.cuts, t, end);
    const draw = [this.q1, this.q2, this.q3, this.q4, this.q5, this.q6, this.q7, this.q8, this.q9][s.i]!;
    let post: PostOverrides = { bloom: 0.65 };
    post = mergePost(post, draw.call(this, c, g, t, s.s0, s.s1) ?? {});
    lyricBand(c, this.band, t);
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    return mergePost(post, { zoom: 1 + 0.006 * f.a.kick });
  }

  rai(c: C2, x: number, y: number, R: number, o: Partial<RaiOpts> & { t: number }) {
    return drawRai(c, x, y, R, { glow: HEX.bone, heart: 0.35, prop: MIC, ...o });
  }

  /** The round's clock: seconds left in the plate (the round ends when the show cuts away). */
  left(t: number) { return this.ctx.end - t; }

  /** The quick-fire marquee across the top of the podium shots, its bulbs scrolling. */
  marquee(c: C2, g: C2, t: number) {
    c.fillStyle = '#140c1e'; c.fillRect(0, 118, W, 70);
    c.fillStyle = '#b98a3e'; c.fillRect(0, 118, W, 4); c.fillRect(0, 184, W, 4);
    const pts = textDots('QUICK-FIRE ROUND  ✦  ', FAM.hook(), 50, 6);
    const span = Math.max(...pts.map((p) => p[0])) - Math.min(...pts.map((p) => p[0])) + 60, off = (t * 420) % span;
    for (let k = -1; k < Math.ceil(W / span) + 1; k++) drawDots(c, g, pts, k * span + span / 2 - off, 153, 2.2, HEX.yellow, (i) => 0.8 + 0.2 * Math.sin(t * 12 + i * 0.2));
  }

  /** One podium close-up: the backdrop in its colour, the floor, the podium lit from `lit`, its contestant on top. */
  podiumShot(c: C2, g: C2, t: number, s0: number, s1: number, col: string, label: string, lit: number, contestant: (y: number) => void) {
    const z = lerp(1, 1.06, clamp((t - s0) / (s1 - s0)));
    cam2(c, g, { zoom: z }, () => {
      sunburst(c, 860, 560, mixHex(col, HEX.ink, 0.45 + 0.25 * (1 - lit)), mixHex(col, HEX.ink, 0.72), 18, t * 0.4 * (label.length % 2 ? 1 : -1));
      halftone(c, rgbaHex(HEX.ink, 0.35), 22, 'radial', 860, 560);
      const vg = c.createRadialGradient(860, 560, 200, 860, 560, 1150);
      vg.addColorStop(0, 'rgba(10,6,20,0)'); vg.addColorStop(1, 'rgba(10,6,20,0.85)');
      c.fillStyle = vg; c.fillRect(-W, -H, W * 3, H * 3);
      c.fillStyle = '#2a1a26'; c.fillRect(-W, 930, W * 3, H);
      c.fillStyle = '#3a2430'; c.fillRect(-W, 930, W * 3, 10);
      podium(c, g, 860, 975, 420, t, lit, label, col);
      contestant(975 - 420 * 0.9);
    });
    this.marquee(c, g, t);
    countdown(c, g, 1760, 74, 44, this.left(t));
  }

  // ------------------------------------------------------------------ 23: print, wire, mine, the pledge

  q1(c: C2, g: C2, t: number, s0: number, s1: number): PostOverrides {
    const w = this.w, lit = clamp((t - w.print!.start) / 0.06);
    this.podiumShot(c, g, t, s0, s1, COL.print, 'PRINT', Math.max(0.15, lit), (y) => press(c, g, 860, y, 1.25, t, [w.now!.start, w.print!.start]));
    this.rai(c, 1560, 900 - 1.07 * 150, 150, { t, face: 'cheeky', look: -1, arms: ['point', 'down'], tilt: 0.06 });
    liveBug(c, g, t);
    camTag(c, 'CAM 2', t, s0);
    return punch(t, [w.print!.start], 0.02);
  }

  q2(c: C2, g: C2, t: number, s0: number, s1: number): PostOverrides {
    const w = this.w, lit = clamp((t - w.wire!.start) / 0.06);
    this.podiumShot(c, g, t, s0, s1, COL.wire, 'WIRE', Math.max(0.15, lit), (y) => wire(c, g, 860, y, 1.45, t, w.wire!.start));
    this.rai(c, 330, 900 - 1.07 * 150, 150, { t, face: t > w.wire!.start + 0.1 ? 'wow' : 'smile', look: 1, arms: ['cheek', 'cheek'], prop: undefined });
    liveBug(c, g, t);
    return punch(t, [w.wire!.start], 0.02);
  }

  q3(c: C2, g: C2, t: number, s0: number, s1: number): PostOverrides {
    const w = this.w, lit = clamp((t - w.mine!.start) / 0.06);
    this.podiumShot(c, g, t, s0, s1, COL.mine, 'MINE', Math.max(0.15, lit), (y) => rack(c, g, 860, y, 1.2, t, [w.mine!.start, w.code!.start]));
    this.rai(c, 1580, 900 - 1.07 * 150, 150, { t, face: 'sassy', look: -1, arms: ['chin', 'hip'], tilt: 0.07, marks: ['?'], markT0: w.code!.start });
    liveBug(c, g, t);
    camTag(c, 'CAM 3', t, s0);
    return punch(t, [w.mine!.start, w.code!.start], 0.015);
  }

  q4(c: C2, g: C2, t: number, s0: number): PostOverrides {
    const w = this.w, up = ease.outBack(clamp((t - w.pledge!.start) / 0.3), 1.5);
    studio(c, g, t, {
      curtain: 0, ring: 0, sign: 1, onAir: true, house: 0.65, cue: 'APPLAUSE', cueT0: s0,
      spots: [{ x: 500, col: COL.print, a: 0.6 }, { x: 880, col: COL.wire, a: 0.6 }, { x: 1260, col: COL.mine, a: 0.6 }],
      scoreDraw: (cc, gg, x, y, ww, hh) => this.clockBoard(cc, gg, x, y, ww, hh, t),
    });
    const xs = [500, 880, 1260], labels = ['PRINT', 'WIRE', 'MINE'], cols = [COL.print, COL.wire, COL.mine];
    xs.forEach((x, i) => {
      podium(c, g, x, SET.floor + 24, 270, t, 1, labels[i]!, cols[i]!);
      const top = SET.floor + 24 - 270 * 0.9;
      if (i === 0) press(c, g, x, top, 0.48, t, [w.mine!.start + 0.6, w.pledge!.start]);
      else if (i === 1) wire(c, g, x, top, 0.55, t, w.screen!.start);
      else rack(c, g, x, top, 0.5, t, [s0 + 0.2, w.pledge!.start + 0.2]);
    });
    this.rai(c, 1640, SET.floor - 1.07 * 135, 135, { t, face: 'cheeky', look: -1, arms: ['reach', 'down'], armsFrom: ['down', 'down'], armsU: clamp((t - s0) / 0.2), marks: ['sparkle'], markT0: s0 + 0.1 });
    studioFront(c, g, t, { crowd: 1, mood: 'cheer' });
    // in the front row a fin raises a phone, its screen glowing
    if (up > 0) this.phoneArm(c, g, 170, lerp(1200, 740, up), 0.5, t);
    liveBug(c, g, t);
    camTag(c, 'CAM 1', t, s0);
    return {};
  }

  /** The scoreboard during the round: QUICK-FIRE and the clock. */
  clockBoard(c: C2, g: C2, x: number, y: number, w: number, h: number, t: number) {
    const s = Math.max(0, Math.floor(this.left(t)));
    textRow(c, g, 'QUICK-FIRE', x + w / 2, y + h * 0.27, w, HEX.bone);
    textRow(c, g, `0:0${s}`, x + w / 2, y + h * 0.68, w, s <= 2 ? '#ff3b3b' : HEX.gold, FAM.bold(), 1.7);
  }

  /** A silhouette arm from below holding a phone up, at (x, y) the phone's centre; s scale. */
  phoneArm(c: C2, g: C2, x: number, y: number, s: number, t: number, draw?: (y: number) => void) {
    c.save();
    c.strokeStyle = SIL; c.lineCap = 'round'; c.lineWidth = 70 * s;
    c.beginPath(); c.moveTo(x + 60 * s, y + 900 * s); c.quadraticCurveTo(x + 40 * s, y + 400 * s, x + 10 * s, y + 150 * s); c.stroke();
    c.fillStyle = SIL; c.beginPath(); c.ellipse(x + 6 * s, y + 120 * s, 62 * s, 50 * s, -0.2, 0, TAU); c.fill();
    c.strokeStyle = rgbaHex(HEX.pink, 0.7); c.lineWidth = 6 * s;   // a rim of stage light down its edge
    c.beginPath(); c.moveTo(x + 95 * s, y + 900 * s); c.quadraticCurveTo(x + 75 * s, y + 400 * s, x + 44 * s, y + 160 * s); c.stroke();
    c.restore();
    if (draw) draw(y);
    else {
      c.save(); c.translate(x, y); c.rotate(-0.08);
      c.fillStyle = '#16161c'; c.beginPath(); c.roundRect(-55 * s, -110 * s, 110 * s, 220 * s, 16 * s); c.fill();
      c.fillStyle = '#dfe8f6'; c.beginPath(); c.roundRect(-46 * s, -98 * s, 92 * s, 196 * s, 10 * s); c.fill();
      c.fillStyle = '#1a3a6a'; c.fillRect(-46 * s, -98 * s, 92 * s, 30 * s);
      c.fillStyle = '#9aa6b8'; for (let k = 0; k < 4; k++) c.fillRect(-34 * s, -50 * s + k * 18 * s, 68 * s, 6 * s);
      c.fillStyle = '#1a3a6a'; c.font = `${Math.round(52 * s)}px "Archivo-1250-900"`; c.textAlign = 'center'; c.fillText('£', 0, 80 * s);
      c.restore();
      g.fillStyle = 'rgba(200,220,255,0.1)'; g.beginPath(); g.ellipse(x, y, 90 * s, 140 * s, 0, 0, TAU); g.fill();
    }
    void t;
  }

  q5(c: C2, g: C2, t: number, s0: number, s1: number): PostOverrides {
    const w = this.w, gold = w.gold!.start, z = lerp(1, 1.05, clamp((t - s0) / (s1 - s0)));
    const lift = ease.outBack(clamp((t - w.hold!.start) / 0.25), 1.6), u = clamp((t - gold) / 0.32);
    cam2(c, g, { zoom: z }, () => {
      backdrop(c, g, t, '#2a1f4a', 18, 7);
      // the stage lights behind the raised hand, so its silhouette reads
      const back = c.createRadialGradient(980, 470, 40, 980, 470, 620);
      back.addColorStop(0, 'rgba(255,190,140,0.55)'); back.addColorStop(0.5, 'rgba(200,90,140,0.25)'); back.addColorStop(1, 'rgba(40,20,60,0)');
      c.fillStyle = back; c.fillRect(-W, -H, W * 3, H * 3);
      // the studio's ring of bulbs, out of focus behind the hand
      for (let i = 0; i < 30; i++) {
        const a = (i / 30) * TAU, bx = 1180 + Math.cos(a) * 420, by = 420 + Math.sin(a) * 420, on = 0.5 + 0.5 * Math.sin(t * 8 - i * 0.6);
        g.fillStyle = rgbaHex(HEX.gold, 0.12 * on); g.beginPath(); g.arc(bx, by, 34, 0, TAU); g.fill();
      }
      // the crowd's heads along the bottom, fins up when the trophy lands
      for (let i = 0; i < 9; i++) {
        const hx = 80 + i * 230 + 30 * h01(i, 3), hy = 1000 + 30 * h01(i, 4) - (t > gold ? 20 * Math.abs(Math.sin(t * 8 + i)) : 0);
        c.fillStyle = '#07060f'; c.beginPath(); c.ellipse(hx, hy, 95, 110, 0, 0, TAU); c.fill();
        if (t > gold + 0.1) { c.beginPath(); c.ellipse(hx - 100, hy - 60, 22, 60, -0.6, 0, TAU); c.ellipse(hx + 100, hy - 60, 22, 60, 0.6, 0, TAU); c.fill(); }
      }
      const py = lerp(520, 420, lift) + 6 * Math.sin(t * 3);
      this.phoneArm(c, g, 900, py, 2.0, t, (yy) => pledgeToGold(c, g, 900, yy, 440, t, u));
      if (u > 0 && u < 1) { c.save(); c.globalAlpha = 0.6; focusLines(c, 900, py, 260, 'rgba(255,230,150,0.6)', t, { n: 50 }); c.restore(); }
    });
    sfx(c, 'GOLD!', 1450, 300, 130, t, gold + 0.32, { col: HEX.gold, rot: 0.08, hold: 0.55 });
    liveBug(c, g, t);
    camTag(c, 'CAM 4', t, s0);
    return mergePost(punch(t, [w.hold!.start, gold + 0.32], 0.025), caKick(t, [gold + 0.32], 3));
  }

  // ------------------------------------------------------------------ 24: genius, strangers, the X and the wink

  q6(c: C2, g: C2, t: number, s0: number): PostOverrides {
    const w = this.w, gen = w.genius!.start, lit = t > gen;
    backdrop(c, g, t, '#3a1a3e', 16, 9);
    c.fillStyle = '#2a1a26'; c.fillRect(0, 900, W, H - 900);
    if (lit) focusLines(c, 960, 560, 300, 'rgba(255,230,180,0.45)', t, { n: 70 });
    geniusSign(c, g, 960, 230, 210, t, gen);
    const hop = lit && t - gen < 0.4 ? 0.22 * Math.sin(((t - gen) / 0.4) * Math.PI) : 0;
    this.rai(c, 960, 900 - 1.07 * 160, 160, {
      t, face: lit ? 'joy' : 'sassy', look: lit ? 0 : 1, arms: lit ? ['up', 'up'] : ['chin', 'hip'], armsFrom: ['chin', 'hip'], armsU: lit ? clamp((t - gen) / 0.15) : 1,
      hop, squash: lit && t - gen < 0.06 ? -0.3 : 0, marks: lit ? ['sparkle'] : ['?'], markT0: lit ? gen : w.honestly!.start, tilt: lit ? 0 : 0.1,
    });
    liveBug(c, g, t);
    camTag(c, 'CAM 2', t, s0);
    return mergePost(punch(t, [gen], 0.03), caKick(t, [gen], 2.5));
  }

  q7(c: C2, g: C2, t: number, s0: number): PostOverrides {
    const w = this.w, trade = w.trade!.start, not = w.not!.start;
    const walk = ease.outCubic(clamp((t - s0) / (trade - s0 - 0.05)));
    const ax = lerp(250, 820, walk), bx = lerp(1640, 1040, walk), fy = SET.floor + 14, ht = 240;
    const swapU = ease.inOutCubic(clamp((t - trade) / 0.26)), swapped = t > trade + 0.13;
    cam2(c, g, { zoom: 1.22, x: 930 - W / 2, y: 540 - H / 2 }, () => {
      studio(c, g, t, {
        curtain: 0, ring: 0, sign: 1, onAir: true, house: 0.6,
        spots: [{ x: ax, col: HEX.yellow, a: 0.5 }, { x: 0, a: 0 }, { x: bx, col: HEX.cyan, a: 0.5 }, { x: 1470, col: HEX.pink, a: 0.6 }],
        scoreDraw: (cc, gg, x, y, ww, hh) => this.clockBoard(cc, gg, x, y, ww, hh, t),
      });
      // Rai upstage, watching them; falling for it; then the arms begin to cross on "not"
      const crossing = t > not;
      this.rai(c, 1470, SET.floor - 1.07 * 120, 120, {
        t, face: crossing ? 'sassy' : t > trade ? 'love' : 'smile', look: crossing ? 0 : -1,
        arms: crossing ? ['chin', 'chin'] : t > trade ? ['cheek', 'cheek'] : ['down', 'down'],
        armsFrom: crossing ? ['cheek', 'cheek'] : ['down', 'down'], armsU: crossing ? 0.7 * clamp((t - not) / 0.2) : clamp((t - trade) / 0.2),
        marks: t > trade && !crossing ? ['hearts'] : [], markT0: trade, prop: undefined, blush: t > trade && !crossing ? 0.8 : 0,
      });
      const bob = (k: number) => (walk < 1 ? 5 * Math.abs(Math.sin(t * 10 + k)) : 0);
      cast(c, 'strangerA', ax, fy - bob(0), ht, swapped ? 'cheer' : walk < 1 ? 'stand' : 'point', { col: SIL, t, rim: HEX.yellow, prop: false, emote: t > trade + 0.1 ? 'heart' : undefined, emoteT0: trade + 0.1 });
      cast(c, 'strangerB', bx, fy - bob(1), ht, swapped ? 'cheer' : walk < 1 ? 'stand' : 'point', { col: SIL, t, rim: HEX.cyan, prop: false, flip: true, emote: t > trade + 0.1 ? 'heart' : undefined, emoteT0: trade + 0.1 });
      // the parcel goes right, the coin goes left, each on an arc
      const u = ht / 100;
      const pa = { x: lerp(ax + 18 * u, bx - 18 * u, swapU), y: fy - 70 * u - Math.sin(swapU * Math.PI) * 60 };
      const pb = { x: lerp(bx - 20 * u, ax + 20 * u, swapU), y: fy - 82 * u - Math.sin(swapU * Math.PI) * 90 };
      c.fillStyle = '#c99a5a'; c.fillRect(pa.x - 7 * u, pa.y - 5.5 * u, 14 * u, 11 * u);
      c.strokeStyle = '#7a5a2e'; c.lineWidth = 1.2 * u; c.strokeRect(pa.x - 7 * u, pa.y - 5.5 * u, 14 * u, 11 * u);
      c.beginPath(); c.moveTo(pa.x, pa.y - 5.5 * u); c.lineTo(pa.x, pa.y + 5.5 * u); c.stroke();
      c.fillStyle = HEX.gold; c.beginPath(); c.arc(pb.x, pb.y, 4.5 * u, 0, TAU); c.fill();
      g.fillStyle = rgbaHex(HEX.gold, 0.4); g.beginPath(); g.arc(pb.x, pb.y, 9 * u, 0, TAU); g.fill();
      if (t > trade && t < trade + 0.5) for (let i = 0; i < 6; i++) star4(c, (ax + bx) / 2 + Math.cos(i) * 70 * (t - trade) * 4, fy - 90 * u + Math.sin(i * 2) * 50, 10, '#fff6c8');
    });
    studioFront(c, g, t, { crowd: 1, mood: t > trade ? 'cheer' : 'calm' });
    liveBug(c, g, t);
    camTag(c, 'CAM 1', t, s0);
    return punch(t, [trade], 0.02);
  }

  /**
   * Rai's big X (a batsu): her IK arms are too short to cross that high, so the X is drawn here in her style (stone arms
   * with a dark outline, palms open) over her folded arms, snapping from folded to crossed at t0. Disc centre (x, y), R.
   */
  xArms(c: C2, x: number, y: number, R: number, t: number, t0: number) {
    const u = ease.outBack(clamp((t - t0) / 0.12), 2.2);
    for (const side of [-1, 1]) {
      const sh = { x: x + side * 0.84 * R, y: y - 0.22 * R };
      const el = { x: x + side * lerp(0.55, 0.8, u) * R, y: y + lerp(-0.1, 0.25, u) * R };
      const hd = { x: x - side * lerp(0.3, 0.66, u) * R, y: y - lerp(0.15, 0.6, u) * R };
      for (const [col, wd] of [['#3a2f2a', 0.17], ['#d9cfb8', 0.115]] as const) {
        c.strokeStyle = col; c.lineWidth = wd * R; c.lineCap = 'round'; c.lineJoin = 'round';
        c.beginPath(); c.moveTo(sh.x, sh.y); c.lineTo(el.x, el.y); c.lineTo(hd.x, hd.y); c.stroke();
      }
      // an open palm, fingers spread
      const fa = Math.atan2(hd.y - el.y, hd.x - el.x), hr = 0.13 * R;
      c.fillStyle = '#d9cfb8'; c.strokeStyle = '#3a2f2a'; c.lineWidth = 0.03 * R;
      for (const k of [-0.7, -0.23, 0.23, 0.7]) { c.beginPath(); c.arc(hd.x + Math.cos(fa + k) * hr * 1.1, hd.y + Math.sin(fa + k) * hr * 1.1, hr * 0.42, 0, TAU); c.fill(); c.stroke(); }
      c.beginPath(); c.arc(hd.x, hd.y, hr, 0, TAU); c.fill(); c.stroke();
      if (side > 0) { c.save(); c.translate(hd.x, hd.y); c.rotate(-0.5); micProp(c, R); c.restore(); }
    }
  }

  q8(c: C2, g: C2, t: number, s0: number): PostOverrides {
    const w = this.w, x0 = Math.max(s0 + 0.04, w.tell!.start);
    backdrop(c, g, t, '#4a1626', 10, 11);
    if (t > x0) { c.save(); c.globalAlpha = 0.5; reactionBg(c, 'stripes', 'rgba(0,0,0,0)', 'rgba(255,59,59,0.35)', t); c.restore(); }
    c.fillStyle = '#2a1a26'; c.fillRect(0, 900, W, H - 900);
    verdict(c, g, 'x', 1500, 300, 150, t, x0);
    if (t > x0) focusLines(c, 960, 480, 360, 'rgba(255,200,200,0.45)', t, { n: 60 });
    const R = 190, ry = 900 - 1.07 * R, sq = t > x0 && t - x0 < 0.08 ? -0.2 : 0;
    this.rai(c, 960, ry, R, { t, face: t > x0 ? 'sassy' : 'cheeky', look: 0, arms: ['cross', 'cross'], prop: undefined, squash: sq, marks: ['shine'], markT0: x0 + 0.1 });
    this.xArms(c, 960, ry, R, t, x0);
    sfx(c, 'BZZT!', 1500, 520, 120, t, x0, { col: '#ff3b3b', rot: 0.1, hold: 0.6 });
    liveBug(c, g, t);
    camTag(c, 'CAM 3', t, s0);
    return mergePost(punch(t, [x0], 0.035), hitShake(t, [x0], 4, 0.25));
  }

  q9(c: C2, g: C2, t: number, s0: number, s1: number): PostOverrides {
    const zoomU = ease.outExpo(clamp((t - s0) / 0.14)), z = lerp(1.0, 2.25, zoomU) + 0.03 * clamp((t - s0 - 0.14) / (s1 - s0));
    const R = 190, cy = 900 - 1.07 * R, headY = cy - 1.2 * R;
    cam2(c, g, { zoom: z, x: 0, y: (headY - H / 2) * zoomU }, () => {
      backdrop(c, g, t, '#4a1a3a', 12, 13);
      c.fillStyle = '#2a1a26'; c.fillRect(-W, 900, W * 3, H);
      focusLines(c, 960, headY, 230, 'rgba(255,240,220,0.5)', t, { n: 70 });
      this.rai(c, 960, cy, R, { t, face: 'wink', look: 0, arms: ['down', 'hip'], tilt: 0.1, marks: ['shine', 'sparkle'], markT0: s0 + 0.05, blush: 0.6 });
    });
    liveBug(c, g, t);
    return mergePost(punch(t, [s0], 0.04), { flash: t - s0 < 0.03 ? 0.25 : 0 });
  }
}

/** A row of LED text fitted to the board's width (Plex Mono for words, or `fam`), `k` times the default size. */
function textRow(c: C2, g: C2, text: string, x: number, y: number, w: number, col: string, fam?: string, k = 1) {
  const size = Math.min(70 * k, (w - 30) / (0.62 * text.length));
  const pts = textDots(text, fam ?? FAM.monoB(), size, Math.max(4, Math.round(size / 10)));
  drawDots(c, g, pts, x, y, Math.max(4, Math.round(size / 10)) * 0.34, col, () => 1);
}
