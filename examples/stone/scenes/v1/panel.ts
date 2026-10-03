// v1 PANEL (the bridge, half time, sung, lines 35-38): THE BIG DEBATE. Three podiums, three panellists (cast panel1,
// panel2, panel3: glasses, a bob, a quiff), each with an emblem; Rai moderates from her desk and reacts in the corner
// (the MODERATOR box). Cuts on the beat at or before each half-line (times are this take's):
//   P0  129.49 CAM 1 wide  "Some say": THE BIG DEBATE lights in bulbs, pink | cyan; the studio screen polls COUNT HER?
//                          (COUNT 33 · PRICE 33 · SMASH 34: the hammer already leads by one). Podium 1 takes the spot.
//   P1  130.34 CAM 2       "count her,": the calculator counts and reads +HER; panellist 1 points at the scoreboard: !
//                          Rai, in the corner: chin, thinking.
//   P1b 131.20 CAM 3       "or she's never seen;": over his pointing arm, the board: on "never" HER goes dark dot by
//                          dot, on "seen" her 0 too: she was never on it. Rai: soft, sad.
//   P2a 132.91 CAM 2       "some say price it and you'll": podium 2's heart; on "price" a price tag swings onto it.
//   P2b 134.63 close       "break what it means;": the heart cracks in two on "break" and the tag falls; whip out:
//                          panellist 2 holds their head, in tears. Rai: shock.
//   P3a 136.34 CAM 2       "some say smash": panellist 3 pulls the sledgehammer off the podium's front and leaps.
//   P3b 137.12 the board   the hit (the bar's kick): THE SCOREBOARD SHATTERS: LED dots everywhere, sparks, glass, a
//                          colour kick, the plate's one big shake; "the one big scoreboard down,": the dying board,
//                          its lower half drops out on "down". Rai: wow (the MODERATOR box is knocked crooked).
//   P3c 138.91 CAM 1 wide  the aftermath: the broken frame, dead dots raining onto the stage, the smasher posing.
//   P4  139.77 the reveal  "and every one of them is carrying the stone.": the podiums sink into the stage; the smasher
//                          dashes back; the pole comes down from the flies with Rai on it through her heart; all three
//                          take it on their shoulders; the camera pulls back to the wide; the poll reads CARRY 100%;
//                          Rai waves, cheeky. It ends on the standard wide: the lift begins from here.
// Clues: SMASH leading the poll by 1%; the pole racked in the wings since the first show; the scoreboard stays a broken
// frame with dead dots (the lift); the dots on the floor.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../../engine/scene';
import { Layer2D, W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import type { Line, Word } from '../../engine/lyrics';
import { clamp, ease, lerp } from '../../engine/util';
import { drawRai, type RaiOpts } from '../_rai';
import { FAM, TAU, rgbaHex, slam, type Pose, type Emote } from '../_motifs';
import { speedLines, impactBurst } from '../_manga';
import { caKick, hitShake, mergePost, punch } from '../_post';
import { SET, studio, studioFront, liveBug, camTag, ledText, type StudioOpts, type Spot } from './_studio';
import { cast, type Who } from './_cast';
import { lyricSeq, cam2, camOn, type Cam2 } from './dating-props';
import { overhead, debateSign, podium, hostDesk, pollScreen, pip, shatterDots, sparks, brokenBoard, pole, hammer, IMPACT, type Emblem } from './panel-props';

type C2 = CanvasRenderingContext2D;

const FL = SET.floor, CH = 288;
const PX = [W * 0.28, W * 0.5, W * 0.72] as const;
const WHO: Who[] = ['panel1', 'panel2', 'panel3'];
const EMB: Emblem[] = ['calc', 'heart', 'hammer'];
const RIM = [HEX.cyan, HEX.pink, HEX.yellow];
const DESK = W * 0.885, RD = 76;
// the pole ends where the lift picks it up: Rai at centre (R 115), the pole on their shoulders, its ends past the lift's posts
const POLE_Y = FL - 226, RP = 115, RAI_X = W / 2, POLE_X = [W / 2 - 734, W / 2 + 734] as const;
const CARRY_X = [480, 1310, 705] as const;
const BOARD = { x: SET.score.x + SET.score.w / 2, y: SET.score.y + SET.score.h / 2 };
const PIPR = { x: W - 452, y: 104, w: 392, h: 262 };

const norm = (s: string) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z']/g, '');
/** Set px -> frame px under a camera. */
const toFrame = (cam: Cam2, x: number, y: number) => ({ x: (x - W / 2 - (cam.x ?? 0)) * (cam.zoom ?? 1) + W / 2, y: (y - H / 2 - (cam.y ?? 0)) * (cam.zoom ?? 1) + H / 2 });

export default class Panel extends Scene {
  L = new Layer2D();
  G = new Layer2D(); // glow, composited additively so it blooms
  lines: Line[] = [];
  prev: Line | null = null;
  cuts: number[] = [];
  w: Record<string, number> = {};
  hit = 0;

  override init() {
    const { lyrics, audio: au, start, end } = this.ctx;
    this.lines = lyrics.lines.filter((l) => l.words[0]!.start >= start - 0.1 && l.words[0]!.start < end);
    this.prev = lyrics.lines.filter((l) => l.words[0]!.start < start - 0.1).pop() ?? null;
    const [l35, l36, l37, l38] = this.lines as [Line, Line, Line, Line];
    const wd = (l: Line, re: RegExp, nth = 0): Word => l.words.filter((x) => re.test(norm(x.w)))[nth] ?? l.words[0]!;
    const W_ = {
      some35: wd(l35, /^some/), count: wd(l35, /count/), her: wd(l35, /^her/), or: wd(l35, /^or$/), never: wd(l35, /never/), seen: wd(l35, /seen/),
      some36: wd(l36, /^some/), price: wd(l36, /price/), brk: wd(l36, /break/), means: wd(l36, /means/),
      some37: wd(l37, /^some/), say37: wd(l37, /^say/), smash: wd(l37, /smash/), board: wd(l37, /scoreboard/), down: wd(l37, /down/),
      and38: wd(l38, /^and/), every: wd(l38, /every/), one38: wd(l38, /^one/), carrying: wd(l38, /carry/), stone: wd(l38, /stone/),
    };
    for (const [k, v] of Object.entries(W_)) this.w[k] = v.start;
    this.w.smashEnd = W_.smash.end;
    // the smash lands on the bar's kick under "smash" (the strongest kick there)
    const kicks = au.events('kick', W_.smash.start - 0.05, W_.smash.end + 0.15).sort((a, b) => b[1] - a[1]);
    this.hit = kicks[0]?.[0] ?? W_.smash.start + 0.25;
    const bAt = (x: number) => au.timeOfBeat(Math.floor(au.beatAt(x + 0.03)));
    this.cuts = [
      start,                          // P0
      bAt(this.w.count!),             // P1
      bAt(this.w.or!),                // P1b
      bAt(this.w.some36!),            // P2a
      bAt(this.w.brk!),               // P2b
      bAt(this.w.some37!),            // P3a
      this.hit,                       // P3b
      bAt(this.w.down! + 0.15),       // P3c
      bAt(this.w.and38!),             // P4
    ];
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t;
    this.L.clear(HEX.ink); this.G.clear();
    const shot = Math.max(0, this.cuts.filter((x) => t >= x).length - 1), s0 = this.cuts[shot]!, lt = t - s0;
    const draw = [this.p0, this.p1, this.p1b, this.p2a, this.p2b, this.p3a, this.p3b, this.p3c, this.p4][shot]!;
    let post = draw.call(this, c, g, t, lt) ?? {};
    g.clearRect(54, 44, 160, 60); // nothing glows over the LIVE bug
    liveBug(c, g, t);
    const tags: Record<number, string> = { 1: 'CAM 2', 2: 'CAM 3', 5: 'CAM 2', 7: 'CAM 1' };
    if (tags[shot]) camTag(c, tags[shot]!, t, s0);
    lyricSeq(c, t, this.ctx.start, this.lines, this.prev, g);
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    post = mergePost({ bloom: 0.7 }, post, { zoom: 1 + 0.006 * f.a.kick });
    return post;
  }

  // ---------------------------------------------------------------- state over the plate

  /** Whose turn it is (0, 1, 2) and how lit their podium is. */
  turn(t: number): { who: number; lit: number[] } {
    const w = this.w, who = t >= w.some37! - 0.1 ? 2 : t >= w.some36! - 0.1 ? 1 : 0;
    const on = [w.some35! - 0.05, w.some36! - 0.1, w.some37! - 0.1];
    return { who, lit: on.map((x, i) => (i === who ? clamp((t - x) / 0.12) : 0.15)) };
  }

  /** The calculator's display. */
  calc(t: number): string {
    const w = this.w;
    if (t < w.count!) return '0';
    if (t < w.her!) return String(Math.floor((t - w.count!) * 24) % 10).repeat(1 + Math.floor((t - w.count!) * 9) % 5);
    if (t < w.never!) return '+HER';
    return Math.floor(t * 4) % 2 ? '?' : '';
  }

  /** The studio set for the debate: the curtain shut, the sign, the poll on the screen, spots on whose turn it is. */
  set(c: C2, g: C2, t: number, o: StudioOpts & { carry?: number; spotsOn?: boolean } = {}) {
    const { who } = this.turn(t), smashed = t >= this.hit ? 1 : 0;
    const spots: Spot[] = o.spotsOn === false ? [] : [{ x: 0, a: 0 }, { x: 0, a: 0 }, { x: 0, a: 0 }, { x: DESK, col: HEX.gold, r: 110, a: 0.35 }];
    studio(c, g, t, {
      curtain: 0, ring: 0, sign: 1, onAir: true, house: 0.5, spots,
      score: smashed ? null : [{ text: 'HER SCORE', col: HEX.bone }, { text: '0', col: HEX.pink }],
      screen: (cc, gg, x, y, w, h) => pollScreen(cc, gg, x, y, w, h, t, o.carry ?? 0, smashed),
      ...o,
    });
    debateSign(c, g, W / 2, H * 0.255, t, clamp((t - this.ctx.start) / 0.45));
    if (o.spotsOn !== false && !o.carry) { // overhead spots on the podiums: whoever has the floor is lit
      const { lit } = this.turn(t);
      for (let i = 0; i < 3; i++) overhead(g, PX[i]!, H * 0.31, FL, RIM[i]!, 0.35 + 0.65 * lit[i]!);
    }
    if (smashed) {
      brokenBoard(c, g, t, clamp((t - this.w.down!) / 0.3));
      shatterDots(c, g, t, this.hit);
      const fall = t - this.w.down!;
      if (fall > 0 && fall < 1.1) { // the board's lower half drops out, over the stage's edge and away
        const S = SET.score, pw = S.w, ph = S.h * 0.42;
        c.save(); c.translate(S.x + pw / 2 + 60 * fall, S.y + S.h * 0.79 + 1500 * fall * fall); c.rotate(0.5 * fall);
        c.fillStyle = '#18141f'; c.fillRect(-pw / 2, -ph / 2, pw, ph);
        c.strokeStyle = '#6a5a3a'; c.lineWidth = 4; c.strokeRect(-pw / 2, -ph / 2, pw, ph);
        c.fillStyle = '#2a2236'; for (let i = 0; i < 48; i++) c.fillRect(-pw / 2 + 10 + (i % 12) * (pw - 20) / 12, -ph / 2 + 12 + Math.floor(i / 12) * (ph - 20) / 4, 6, 6);
        c.restore();
      }
    }
  }

  /** A panellist behind (or, sunk, without) their podium. */
  panellist(c: C2, g: C2, i: number, t: number, o: { pose?: Pose; x?: number; y?: number; emote?: Emote; emoteT0?: number; flip?: boolean; podium?: boolean; sink?: number; hammer?: boolean; behind?: boolean } = {}) {
    const x = o.x ?? PX[i]!, y = o.y ?? FL, behind = o.behind ?? (o.podium !== false && (o.sink ?? 0) < 1);
    c.save();
    if (behind) { c.beginPath(); c.rect(x - 600, -2000, 1200, FL - 1 + 2000); c.clip(); } // the podium stands on the floor in front of the feet
    cast(c, WHO[i]!, x, y, CH, o.pose ?? 'stand', { col: '#120d1d', rim: RIM[i], t, flip: o.flip, emote: o.emote, emoteT0: o.emoteT0 });
    c.restore();
    g.save(); g.globalCompositeOperation = 'destination-out';
    if (behind) { g.beginPath(); g.rect(x - 400, -2000, 800, FL - 150 + (o.sink ?? 0) * 160 - 12 + 2000); g.clip(); } // the podium hides the rest
    cast(g, WHO[i]!, x, y, CH, o.pose ?? 'stand', { col: '#000', t, flip: o.flip });
    g.restore();
    if (o.podium !== false) {
      const w = this.w;
      podium(c, g, PX[i]!, FL, t, EMB[i]!, {
        lit: this.turn(t).lit[i], sink: o.sink, col: RIM[i], calc: this.calc(t),
        tag: clamp((t - w.price! + 0.05) / 0.3), crack: ease.outCubic(clamp((t - w.brk!) / 0.25)), hammer: o.hammer,
      });
    }
  }

  /** The three behind their podiums, as the debate stands at t (the smasher gone once he has leapt). */
  panel(c: C2, g: C2, t: number, o: { skip3?: boolean } = {}) {
    const w = this.w;
    this.panellist(c, g, 0, t, { pose: t >= w.her! - 0.05 && t < w.some36! ? 'point' : 'stand', flip: true, emote: t >= w.her! && t < w.price! ? '!' : undefined, emoteT0: w.her! });
    this.panellist(c, g, 1, t, { pose: t >= w.brk! + 0.15 ? 'face' : t >= w.price! ? 'hands' : 'stand', emote: t >= w.brk! + 0.15 ? 'tears' : undefined, emoteT0: w.brk! + 0.15 });
    if (!o.skip3) this.panellist(c, g, 2, t, { pose: t >= w.say37! ? 'cheer' : 'stand', hammer: t < w.say37! });
    else podium(c, g, PX[2], FL, t, 'hammer', { lit: this.turn(t).lit[2], col: RIM[2], hammer: false });
    if (!o.skip3 && t >= w.say37!) hammer(c, PX[2] + 0.22 * CH, FL - 1.12 * CH, 0.42 * CH, 0.3);
  }

  /** Rai at the moderator's desk (wide shots). */
  rai(c: C2, t: number, o: Omit<RaiOpts, 't'>) {
    drawRai(c, DESK, FL - 1.07 * RD - 34, RD, { glow: HEX.bone, heart: 0.3, ...o, t });
  }

  /** Rai in the MODERATOR box. */
  pipRai(c: C2, g: C2, t: number, o: Omit<RaiOpts, 't'>, rot = 0) {
    c.save();
    if (rot) { c.translate(PIPR.x + PIPR.w / 2, PIPR.y + PIPR.h / 2); c.rotate(rot); c.translate(-PIPR.x - PIPR.w / 2, -PIPR.y - PIPR.h / 2); }
    g.save(); g.setTransform(c.getTransform()); g.clearRect(PIPR.x - 12, PIPR.y - 12, PIPR.w + 30, PIPR.h + 30); g.restore(); // nothing glows over the box
    pip(c, g, PIPR.x, PIPR.y, PIPR.w, PIPR.h, t, 1, () => {
      drawRai(c, PIPR.x + PIPR.w * 0.5, PIPR.y + PIPR.h + 26, 128, { glow: HEX.bone, heart: 0.4, ...o, t });
    });
    c.restore();
  }

  // ---------------------------------------------------------------- P0: the sting, wide
  p0(c: C2, g: C2, t: number, lt: number): PostOverrides {
    cam2(c, g, camOn(W / 2, H / 2, 1 + 0.02 * lt), () => {
      this.set(c, g, t, { cue: 'QUIET', cueT0: this.ctx.start });
      this.panel(c, g, t);
      this.rai(c, t, { face: 'serious', arms: ['down', 'chin'], armsFrom: ['down', 'down'], armsU: clamp(lt / 0.3), look: -1 });
      hostDesk(c, g, DESK, FL, t);
      studioFront(c, g, t, { crowd: 1, mood: 'calm' });
    });
    return punch(t, [this.w.some35!], 0.012);
  }

  // ---------------------------------------------------------------- P1: count her
  p1(c: C2, g: C2, t: number, lt: number): PostOverrides {
    const w = this.w;
    cam2(c, g, camOn(PX[0] - 120, 520, 1.6 + 0.05 * lt), () => {
      this.set(c, g, t);
      this.panel(c, g, t);
    });
    this.pipRai(c, g, t, { face: 'serious', arms: ['down', 'chin'], look: -0.7, marks: t >= w.her! + 0.2 ? ['?'] : [], markT0: w.her! + 0.2 });
    return punch(t, [w.her!], 0.02);
  }

  // ---------------------------------------------------------------- P1b: or she's never seen
  p1b(c: C2, g: C2, t: number, lt: number): PostOverrides {
    const w = this.w;
    const cam = camOn(BOARD.x + 120, BOARD.y + 40, 2.05 - 0.05 * lt);
    cam2(c, g, cam, () => {
      this.set(c, g, t, {
        spots: [],
        scoreDraw: (cc, gg, x, y, ww, h) => {
          const gone = clamp((t - w.never!) / 0.32), zero = 1 - clamp((t - w.seen!) / 0.3);
          ledText(cc, gg, 'HER SCORE', x + ww / 2, y + h * 0.26, 52, HEX.bone, (i, n) => ((i / n) < 1 - gone ? 1 : 0));
          ledText(cc, gg, '0', x + ww / 2, y + h * 0.66, 150, HEX.pink, () => zero);
          if (zero <= 0 && Math.floor(t * 3) % 2 === 0) ledText(cc, gg, '_', x + ww * 0.3, y + h * 0.7, 60, HEX.bone);
        },
      });
    });
    // his arm and shoulder in the foreground, pointing at the board
    cast(c, 'panel1', W * 0.93, H * 1.55, 1100, 'point', { col: '#0a0712', rim: HEX.cyan, flip: true, t });
    this.pipRai(c, g, t, { face: t >= w.never! + 0.1 ? 'sad' : 'serious', arms: t >= w.never! + 0.1 ? ['cheek', 'down'] : ['down', 'chin'], look: -0.7, marks: t >= w.seen! ? ['sweat'] : [], markT0: w.seen! });
    return {};
  }

  // ---------------------------------------------------------------- P2: price it and you'll break what it means
  p2a(c: C2, g: C2, t: number, lt: number): PostOverrides {
    const w = this.w;
    cam2(c, g, camOn(PX[1], 556, 1.7 + 0.05 * lt), () => {
      this.set(c, g, t);
      this.panel(c, g, t);
    });
    this.pipRai(c, g, t, { face: 'serious', arms: ['chin', 'down'], look: -0.4, marks: t >= w.price! + 0.2 ? ['?'] : [], markT0: w.price! + 0.2 });
    return punch(t, [w.price!], 0.02);
  }

  p2b(c: C2, g: C2, t: number, lt: number): PostOverrides {
    const w = this.w, top = FL - 150, out = ease.inOutCubic(clamp((t - w.brk! - 0.4) / 0.3));
    const cam = { ...camOn(PX[1], lerp(top + 70, 556, out), lerp(3.8 + 0.1 * lt, 1.7, out)) };
    cam2(c, g, cam, () => {
      this.set(c, g, t);
      this.panel(c, g, t);
    });
    if (t >= w.brk! && t < w.brk! + 0.4) { // shards of the heart
      const p = toFrame(cam, PX[1], top + 70);
      for (let i = 0; i < 10; i++) {
        const a = t - w.brk!, ang = -Math.PI / 2 + (i / 9 - 0.5) * 2.4, sp = 500 + 300 * ((i * 0.37) % 1);
        c.fillStyle = HEX.pink; c.save(); c.translate(p.x + Math.cos(ang) * sp * a, p.y + Math.sin(ang) * sp * a + 900 * a * a); c.rotate(a * 9 + i);
        c.beginPath(); c.moveTo(-10, -6); c.lineTo(12, -4); c.lineTo(0, 12); c.closePath(); c.fill(); c.restore();
      }
    }
    if (t >= w.brk!) slam(c, 'BREAK', W * 0.26, H * 0.2, 150, t, w.brk!, { col: HEX.pink, shadow: HEX.ink, rot: -0.06, t1: w.brk! + 0.55, exit: 0.1 });
    this.pipRai(c, g, t, { face: t >= w.brk! ? 'shock' : 'serious', arms: t >= w.brk! ? ['cheek', 'cheek'] : ['chin', 'down'], marks: t >= w.brk! ? ['!?'] : [], markT0: w.brk! + 0.05 });
    return mergePost(punch(t, [w.brk!], 0.035));
  }

  // ---------------------------------------------------------------- P3: smash the one big scoreboard down
  p3a(c: C2, g: C2, t: number, lt: number): PostOverrides {
    const w = this.w, leap = clamp((t - w.smash!) / 0.3);
    cam2(c, g, camOn(PX[2] - 60, 556, 1.7 + 0.06 * lt), () => {
      this.set(c, g, t);
      this.panel(c, g, t, { skip3: true });
      // he pulls the hammer off the podium and leaps for the board (off to the left)
      const x = PX[2] - ease.inCubic(leap) * 900, y = FL - Math.sin(leap * Math.PI) * 160;
      this.panellist(c, g, 2, t, { pose: t >= w.say37! ? 'cheer' : 'stand', x, y, podium: false, flip: leap > 0, behind: true });
      if (t >= w.say37!) hammer(c, x + (leap > 0 ? -1 : 1) * 0.22 * CH, y - 1.12 * CH, 0.42 * CH, leap > 0 ? -0.5 - leap * 2 : 0.3 + 0.2 * Math.sin(t * 12));
      podium(c, g, PX[2], FL, t, 'hammer', { lit: 1, col: RIM[2], hammer: t < w.say37! });
    });
    if (leap > 0) speedLines(c, 0, 'rgba(255,255,255,0.55)', t, { n: 40, alpha: leap });
    this.pipRai(c, g, t, { face: t >= w.say37! + 0.15 ? 'shock' : 'wow', arms: ['cheek', 'cheek'], marks: t >= w.smash! ? ['!'] : [], markT0: w.smash! });
    if (t >= w.smash!) slam(c, 'SMASH', W * 0.32, H * 0.2, 170, t, w.smash!, { col: HEX.yellow, shadow: HEX.ink, rot: -0.05 });
    return punch(t, [w.say37!], 0.02);
  }

  p3b(c: C2, g: C2, t: number, lt: number): PostOverrides {
    const w = this.w, hit = this.hit, a = t - hit;
    const cam = camOn(BOARD.x + 40, BOARD.y + 50, 2.05 - 0.12 * ease.outCubic(clamp(a / 1.5)));
    cam2(c, g, cam, () => {
      this.set(c, g, t, { spots: [] });
      sparks(c, g, t, hit);
    });
    // the impact: a burst, the hammer head, and him in the foreground
    const ip = toFrame(cam, IMPACT.x, IMPACT.y);
    if (a < 0.22) impactBurst(c, ip.x, ip.y, 260 * (1 - a / 0.3), HEX.yellow, HEX.ink, t, 16);
    const back = ease.outCubic(clamp(a / 0.6));
    cast(c, 'panel3', W * 0.9 + 120 * back, H * 1.45, 1000, 'point', { col: '#0a0712', rim: HEX.yellow, flip: true, t });
    hammer(c, ip.x + 120 + 220 * back, ip.y + 30 + 120 * back, 300, -1.75 + 0.5 * back);
    this.pipRai(c, g, t, { face: 'wow', arms: ['up', 'up'], marks: ['!', 'sweat'], markT0: hit + 0.12 }, a > 0.1 ? 0.08 * Math.min(1, (a - 0.1) / 0.1) : 0);
    slam(c, 'SMASH!', W * 0.68, H * 0.62, 190, t, hit, { col: HEX.yellow, shadow: HEX.ink, rot: 0.06, t1: hit + 0.75, exit: 0.12 });
    return mergePost(hitShake(t, [hit], 8, 0.5), caKick(t, [hit], 6, 0.35), punch(t, [hit], 0.04), a >= 0 && a < 0.05 ? { flash: 0.55 } : {});
  }

  p3c(c: C2, g: C2, t: number, lt: number): PostOverrides {
    const w = this.w;
    cam2(c, g, camOn(W / 2, H / 2, 1.0 + 0.01 * lt), () => {
      this.set(c, g, t, { cue: 'OOOH', cueT0: this.cuts[7]! });
      this.panel(c, g, t, { skip3: true });
      // the smasher by the wreck of the board, hammer up
      this.panellist(c, g, 2, t, { pose: 'cheer', x: W * 0.17, podium: false, emote: 'joy', emoteT0: this.cuts[7]! });
      hammer(c, W * 0.17 + 0.22 * CH, FL - 1.12 * CH, 0.42 * CH, 0.4 + 0.15 * Math.sin(t * 9));
      sparks(c, g, t, this.cuts[7]! - 0.2, { n: 14, x: SET.score.x + SET.score.w * 0.3 + 18, y: SET.score.y + SET.score.h * 0.58 + 94, s: 0.4, seed: 17 });
      this.rai(c, t, { face: 'wow', arms: ['up', 'up'], marks: ['!'], markT0: this.cuts[7]! });
      hostDesk(c, g, DESK, FL, t);
      studioFront(c, g, t, { crowd: 1, mood: 'cheer' });
    });
    void w;
    return {};
  }

  // ---------------------------------------------------------------- P4: every one of them is carrying the stone
  p4(c: C2, g: C2, t: number, lt: number): PostOverrides {
    const w = this.w, s0 = this.cuts[8]!;
    const sink = ease.inCubic(clamp((t - w.and38! - 0.02) / 0.4));
    const dash = ease.inOutCubic(clamp((t - s0) / 0.65)), shuffle = ease.inOutCubic(clamp((t - w.every!) / 0.5));
    const land = w.carrying! - 0.08, drop = ease.outCubic(clamp((t - w.one38! + 0.1) / Math.max(0.2, land - w.one38! + 0.1)));
    const bounce = t > land ? 14 * Math.exp(-7 * (t - land)) * Math.sin(20 * (t - land)) : 0;
    const py = lerp(-260, POLE_Y, drop) + bounce, carrying = t >= land;
    const pull = ease.inOutCubic(clamp((t - w.carrying!) / 1.3));
    const cam = camOn(W / 2, lerp(H * 0.46, H / 2, pull), lerp(1.22, 1.0, pull) + 0.03 * (1 - pull) * lt);
    cam2(c, g, cam, () => {
      this.set(c, g, t, { cue: 'OOOH', cueT0: carrying ? land : this.cuts[7]!, carry: carrying ? 0.5 + clamp((t - land) / 0.5) * 0.5 : 0 });
      hostDesk(c, g, DESK, FL, t); // her desk, empty now
      // the pole behind them, Rai on it through her heart
      if (t >= w.one38! - 0.1) {
        c.strokeStyle = '#2a2236'; c.lineWidth = 4;
        if (!carrying || t < land + 0.25) for (const x of [W * 0.2, W * 0.8]) { c.beginPath(); c.moveTo(x, py); c.lineTo(x, -300); c.stroke(); }
        pole(c, POLE_X[0], POLE_X[1], py);
      }
      // the three: podiums sinking, then under the pole
      const dip = carrying ? 8 * Math.exp(-6 * (t - land)) : 0;
      const look = t >= w.one38! && !carrying;
      const emotes: Emote[] = ['sweat', 'heart', 'joy'];
      podium(c, g, PX[2], FL, t, 'hammer', { lit: 0.15, col: RIM[2], hammer: false, sink });
      for (let i = 0; i < 3; i++) {
        const x = i === 2 ? lerp(W * 0.17, CARRY_X[2], dash) : lerp(PX[i]!, CARRY_X[i]!, shuffle);
        this.panellist(c, g, i, t, {
          x, y: FL + dip, pose: carrying ? 'carry' : 'stand', sink, podium: i < 2,
          emote: carrying ? emotes[i] : look ? '?' : undefined, emoteT0: carrying ? land + 0.15 * i : w.one38!, hammer: false,
        });
      }
      if (dash < 1) { // he dashes back into his place
        const p3x = lerp(W * 0.17, CARRY_X[2], dash);
        c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 4;
        for (let k = 0; k < 5; k++) { const yy = FL - 60 - k * 45; c.beginPath(); c.moveTo(p3x - 40 - 140 * (1 - dash), yy); c.lineTo(p3x - 40, yy); c.stroke(); }
      }
      if (t >= w.one38! - 0.1) {
        const wave = t >= w.stone! - 0.1;
        drawRai(c, RAI_X, py - 0.12 * RP, RP, {
          t, face: wave ? 'cheeky' : t >= w.one38! ? 'smile' : 'grin', arms: wave ? ['hip', 'wave'] : ['up', 'up'], armsFrom: ['up', 'up'], armsU: wave ? clamp((t - w.stone! + 0.1) / 0.15) : 1,
          glow: HEX.gold, heart: 0.7, marks: wave ? ['sparkle'] : [], markT0: w.stone!, hop: 0,
        });
      }
      studioFront(c, g, t, { crowd: 1, mood: carrying ? 'cheer' : 'calm' });
    });
    return mergePost(punch(t, [land], 0.02), t > land && t < land + 0.3 ? hitShake(t, [land], 3, 0.25) : {});
  }
}
