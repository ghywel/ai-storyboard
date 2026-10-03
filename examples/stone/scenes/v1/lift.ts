// v1 LIFT (143.62-156.48): the breakdown's chant, sung twice (lines 39-42, then 43-46), in the shipwreck studio.
// The pole through Rai's heart sits in two ratchet posts; the octopus floor manager flips its cue card to LIFT! and
// the studio audience comes down from the stands to carry it, one shoulder a beat; each "lift it" clicks the pole up
// a notch; the first "bring it home" yanks the stage-lift lever and nothing happens (the screen: MORE SHOULDERS!).
// The second time the whole cast walks up out of the audience and takes the pole (the creatures hop up to ride on
// it), the woman last, her child on her hip, beside Rai on "alone". Then the lever goes and the whole studio rises off
// the seabed (bulbs chasing up the posts, bubbles streaming down), the camera tilting up to the moonlit surface; the
// breach is `festival`'s first shot. The scoreboard stays as `panel` left it: a smashed frame with dead dots.
//
// Shots, by the beat grid (beat n counted from the plate's start; each line's first word floors to beats 0, 3, 7,
// 11, 15, 19, 23, 27):
//   A  0-2   CAM 2: as `panel` left it, the bob still under the pole; the ratchet posts come up through the stage;
//            the octopus flips OOOH -> LIFT! on "pole"; Rai on the pole, determined (39)
//   B  2-4   the stands: everyone jumps up and floods down; C7's lunchbox stays in its seat (39-40)
//   C  4-7   CAM 1 wide: the panellists walk off rubbing their shoulders; the creatures hop up onto the stage and
//            take the pole, one a beat (40)
//   D  7-11  CAM 3 medium: the last of them, the anchor and the bell at the ends (41)
//   E  11-15 wide: LIFT IT x2 (two notches); "bring it home": the lever, CLUNK, nothing; chibi deadpan (42)
//   F  15-19 wide: the curtain opens on the blazing ring; the panellists come back (43)
//   G  19-23 CAM 2 medium: the trader, the couple, the strangers; the woman on "alone": Rai in love (44)
//   H  23-27 the crane: the whole line marching on the spot, the creatures riding the pole (45)
//   I  27-30 LIFT IT x2, the lever, the studio rises; the tilt up to the surface (46)
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../../engine/scene';
import { Layer2D, W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import type { Line, Word } from '../../engine/lyrics';
import { clamp, ease, lerp } from '../../engine/util';
import { drawRai, h01, type Face, type ArmPose } from '../_rai';
import { FAM, TAU, rgbaHex, mixHex, slam } from '../_motifs';
import { focusLines, speedLines, poof, type Mark } from '../_manga';
import { fish } from '../_world';
import { mergePost, punch, hitShake, caKick } from '../_post';
import { SET, studio, studioFront, audience, seatPos, seatKind, octopus, lowerThird, liveBug, camTag, micProp, withCam, type Cam, type SeatKind } from './_studio';
import { cast, type Who } from './_cast';
import { brokenBoard, shatterDots } from './panel-props';
import { LK, poleAt, raiOnPole, critter, type Critter, FISH_COLS, pole, ratchetPost, liftLever, leverKnob, cueCard, depthScreen, seaAbove, bubblesDown, cutLowerThird, emptySeats, backlight, LINE, RIMS, humanH } from './lift-kit';

type C2 = CanvasRenderingContext2D;

interface Slot {
  x: number; crit: Critter; col?: string; seed: number;
  /** the creature lands in its slot (on the beat) */
  join: number;
  /** a person takes the slot (the creature hops up to ride), and who */
  human?: Who; hJoin?: number; rim?: string;
}


export default class Lift extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  lines: Line[] = [];
  cuts: number[] = [];
  beat0 = 0;
  slots: Slot[] = [];
  clicks: number[] = [];
  T = { lift1: 0, lift2: 0, bring1: 0, home1: 0, lift3: 0, lift4: 0, bring2: 0, alone2: 0, every4: 0, shoulder4: 0, rise: 0 };

  bt(n: number) { return this.ctx.audio.timeOfBeat(this.beat0 + n); }
  word(line: Line, re: RegExp, nth = 0): Word { return line.words.filter((w) => re.test(w.w.toLowerCase()))[nth] ?? line.words[0]!; }

  override init() {
    const { lyrics, audio: au, start, end } = this.ctx;
    this.lines = lyrics.lines.filter((l) => l.words[0]!.start >= start - 0.1 && l.words[0]!.start < end);
    this.beat0 = Math.round(au.beatAt(start));
    this.cuts = [0, 2, 4, 7, 11, 15, 19, 23, 27].map((n) => (n === 0 ? start : this.bt(n)));
    const [, , , L42, , L44, L45, L46] = this.lines;
    this.T.lift1 = this.word(L42!, /lift/, 0).start; this.T.lift2 = this.word(L42!, /lift/, 1).start;
    this.T.bring1 = this.word(L42!, /bring/).start; this.T.home1 = this.word(L42!, /home/).start;
    this.T.lift3 = this.word(L46!, /lift/, 0).start; this.T.lift4 = this.word(L46!, /lift/, 1).start;
    this.T.bring2 = this.word(L46!, /bring/).start;
    this.T.alone2 = this.word(L44!, /alone/).start;
    this.T.every4 = this.word(L45!, /every/).start; this.T.shoulder4 = this.word(L45!, /shoulder/).start;
    this.T.rise = this.T.lift4 + 0.1;
    this.clicks = [this.T.lift1, this.T.lift2, this.T.lift3, this.T.lift4];
    // the line under the pole: creatures first (three run down during the stands shot, then one a beat), then the
    // cast takes their places one a beat (the couple and the strangers in pairs), the woman last
    const C = LK.cx, b = (n: number) => this.bt(n);
    const S = (dx: number, crit: Critter, join: number, seed: number, col?: string, human?: Who, hJoin?: number): Slot =>
      ({ x: C + dx, crit, join, seed, col, human, hJoin, rim: human ? RIMS[human] : undefined });
    const cJoin = [3.0, 3.3, 3.6, 4, 5, 6, 7, 8, 9, 10], hJoin = [21, 22, 21, 20, 19, 20, 16, 17, -1, 18];
    this.slots = LINE.map((l, i) => S(l.dx, l.crit, b(cJoin[i]!), l.seed, l.col, l.human, l.human ? b(hJoin[i]!) : undefined));
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t, T = this.T;
    this.L.clear(HEX.ink); this.G.clear();
    const shot = Math.max(0, this.cuts.filter((x) => t >= x).length - 1);
    const s0 = this.cuts[shot]!, s1 = this.cuts[shot + 1] ?? this.ctx.end, sp = clamp((t - s0) / (s1 - s0));
    let post: PostOverrides = { bloom: 0.7 };

    if (shot === 1) {
      this.stands(c, g, t, s0);
    } else {
      // ---- the cameras
      let cam: Cam;
      const second = t >= this.cuts[5]!;
      if (shot === 0) { const z = lerp(1.42, 1.6, ease.outExpo(clamp((t - s0) / 0.16))); cam = { x: 1370 - W / 2, y: 480 - H / 2, zoom: z }; }
      else if (shot === 2) cam = { zoom: lerp(1, 1.035, sp), y: lerp(0, 8, sp) };
      else if (shot === 3) cam = { x: 0, y: 600 - H / 2, zoom: lerp(1.32, 1.4, sp) };
      else if (shot === 4) { const push = ease.outExpo(clamp((t - T.bring1) / 0.2)) * (1 - ease.inOutQuad(clamp((t - T.home1 - 0.1) / 0.3))); cam = { y: 520 - H / 2 - 30 * push, zoom: 1.06 + 0.18 * push }; }
      else if (shot === 5) cam = { zoom: lerp(1.0, 1.03, sp) };
      else if (shot === 6) cam = { x: 0, y: 560 - H / 2, zoom: lerp(1.44, 1.5, sp) };
      else if (shot === 7) cam = { y: lerp(-70, 10, ease.inOutQuad(sp)), zoom: lerp(0.98, 1.05, ease.inOutQuad(sp)) };
      else cam = { y: -this.tilt(t), zoom: 1 + 0.03 * clamp((t - T.lift3) / 0.3) };
      const jolt = this.jolt(t);
      cam = { ...cam, y: (cam.y ?? 0) - jolt };
      withCam(c, cam, () => { withCam(g, cam, () => this.world(c, g, t, f, shot, second)); });

      // lines of force in screen space, behind nothing (over the set, light): the heaves and the rise
      if (shot === 8 && t > T.rise) speedLines(c, Math.PI / 2, 'rgba(220,240,255,0.5)', t, { n: 40, speed: 2600, alpha: 0.4 * clamp((t - T.rise) / 0.25) });
    }

    // ---- the TV package and the words on top
    liveBug(c, g, t, 'LIVE');
    if (shot === 0) camTag(c, 'CAM 2', t, s0);
    if (shot === 3) camTag(c, 'CAM 3', t, s0);
    if (shot === 6) camTag(c, 'CAM 2', t, s0);
    const sl = { fam: FAM.hook(), shadow: HEX.ink };
    if (shot === 4) {
      slam(c, 'LIFT IT!', 470, 300, 150, t, T.lift1, { ...sl, col: HEX.yellow, rot: -0.06, t1: T.bring1 - 0.05, exit: 0.1 });
      slam(c, 'LIFT IT!', W - 470, 300, 150, t, T.lift2, { ...sl, col: HEX.yellow, rot: 0.06, t1: T.bring1 - 0.05, exit: 0.1 });
      post = mergePost(post, punch(t, [T.lift1, T.lift2], 0.025), hitShake(t, [T.bring1 + 0.02], 5, 0.3));
    }
    if (shot === 7) {
      slam(c, 'EVERY', 560, 215, 115, t, T.every4, { ...sl, col: HEX.bone, rot: -0.04 });
      slam(c, 'SHOULDER!', 1330, 225, 115, t, T.shoulder4, { ...sl, col: HEX.gold, rot: 0.04 });
      post = mergePost(post, punch(t, [T.every4, T.shoulder4], 0.02));
    }
    if (shot === 8) {
      slam(c, 'LIFT IT!', 470, 330, 150, t, T.lift3, { ...sl, col: HEX.yellow, rot: -0.06, t1: T.bring2 - 0.05, exit: 0.1 });
      slam(c, 'LIFT IT!', W - 470, 330, 150, t, T.lift4, { ...sl, col: HEX.yellow, rot: 0.06, t1: T.bring2 - 0.05, exit: 0.1 });
      post = mergePost(post, punch(t, [T.lift3, T.lift4], 0.025), hitShake(t, [T.lift3 + 0.02], 6, 0.3), punch(t, [T.bring2], 0.03), caKick(t, [T.bring2], 4));
    }
    if (shot === 0) post = mergePost(post, punch(t, [s0], 0.02, 0.3));
    this.lyric(c, t);

    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    return mergePost(post, { zoom: 1 + 0.008 * f.a.kick });
  }

  /** The sung line in the lower third: each line from its first word until the next one starts. */
  lyric(c: C2, t: number) {
    let cur: Line | undefined;
    for (let i = 0; i < this.lines.length; i++) if (t >= this.lines[i]!.words[0]!.start - (i === 0 ? 0.4 : 0)) cur = this.lines[i];
    if (cur) lowerThird(c, cur, t, { until: Math.max(cur.end + 0.35, this.ctx.end + 1) });
    cutLowerThird(this.G.ctx, cur, t);
  }

  // ------------------------------------------------------------------ timing curves

  /** The pole's notch (0..4), easing up a notch on each click, with the march's bob in the second chant. */
  notch(t: number) {
    let n = 0;
    for (const tc of this.clicks) n += ease.outBack(clamp((t - tc + 0.02) / 0.22), 2.2);
    return n;
  }
  /** The CLUNK of the failed lever (first "bring") and the lurch (second chant's first "lift"): the set drops a few px. */
  jolt(t: number) {
    let j = 0;
    for (const [tc, a] of [[this.T.bring1 + 0.02, 7], [this.T.lift3 + 0.02, 6]] as const) {
      const age = t - tc;
      if (age >= 0 && age < 0.5) j += a * Math.exp(-age / 0.09) * Math.cos(age * 40);
    }
    return j;
  }
  /** The camera's tilt up as the studio rises (px). */
  tilt(t: number) { return 330 * ease.inCubic(clamp((t - this.T.rise - 0.05) / (this.ctx.end - this.T.rise - 0.05))); }
  /** 0..1: how far into the rise. */
  rise(t: number) { return clamp((t - this.T.rise) / (this.ctx.end - this.T.rise)); }
  lever(t: number) {
    const T = this.T;
    const a = ease.outCubic(clamp((t - T.bring1 + 0.06) / 0.12)) * (1 - ease.outBack(clamp((t - T.home1 - 0.1) / 0.18)));
    const b = ease.outCubic(clamp((t - T.rise + 0.08) / 0.12));
    return Math.max(a, b);
  }

  // ------------------------------------------------------------------ the set and the line

  world(c: C2, g: C2, t: number, f: Frame, shot: number, second: boolean) {
    const T = this.T, rise = this.rise(t);
    const n = this.notch(t);
    const march = second && t < T.lift3 ? 4 * Math.sin(Math.PI * f.beatPhase) : 0;
    // as \`panel\` left it: the three panellists still holding the pole on their shoulders (notch 2's height); by the
    // wide they have set it in the posts' collars and are walking off, rubbing their shoulders
    const handed = t >= this.cuts[2]!;
    const poleY = handed ? poleAt(n) - march : poleAt(2);
    // the studio screen's depth gauge
    let depth = 38 - (t >= T.lift1 ? 1 : 0) - (t >= T.lift2 ? 1 : 0) - (t >= T.lift3 ? 1 : 0) - (t >= T.lift4 ? 1 : 0);
    if (t > T.bring2) depth -= 16 * ease.inQuad(clamp((t - T.bring2) / (this.ctx.end - T.bring2)));
    const flash = Math.max(...this.clicks.map((x) => (t >= x ? Math.exp(-(t - x) / 0.15) : 0)));
    const msg = t >= T.home1 - 0.15 && t < this.cuts[6]! ? 'MORE SHOULDERS!' : t >= T.rise ? 'GOING UP!' : null;
    const curtain = second ? ease.inOutCubic(clamp((t - this.cuts[5]!) / 0.75)) : 0;
    const ring = second ? clamp((t - this.cuts[5]! - 0.2) / 0.5) : 0;
    const beatHit = Math.exp(-f.beatPhase * 5);
    const spots = [
      { x: LK.cx, col: HEX.pink, r: 150, a: 0.45 },
      { x: LK.cx - 420 + 160 * Math.sin(t * 1.3), col: HEX.yellow, a: shot === 0 ? 0 : 0.35 },
      { x: LK.cx + 420 - 160 * Math.sin(t * 1.1 + 1), col: HEX.cyan, a: shot === 0 ? 0 : 0.35 },
    ];
    // above the wreck, while it rises
    studio(c, g, t, {
      curtain, ring, ringCol: HEX.gold, burst: [HEX.yellow, HEX.orange], sign: 1, onAir: true,
      cue: second ? 'EVERYBODY!' : t < this.bt(1) - 0.05 ? 'OOOH' : 'LIFT!', cueT0: second ? this.cuts[5]! : t < this.bt(1) - 0.05 ? this.ctx.start - 2 : this.bt(1) - 0.05, house: second ? 0.75 : 0.6, spots,
      score: null,
      screen: depthScreen({ depth, level: (38 - depth) / 38, msg, msgCol: t >= T.rise ? HEX.lime : HEX.yellow, flash }, t),
      crowd: 0,
    });
    if (rise > 0) {
      const sky = -1100 + 840 * rise * rise;
      c.save(); c.beginPath(); c.rect(-W, -H * 2, W * 3, H * 2); c.clip();
      seaAbove(c, g, t, sky, rise);
      c.restore();
      this.seabedFalls(c, t, rise);
    }
    // the scoreboard as \`panel\` smashed it: its broken frame with dead dots, and the dots it shed lying on the stage
    brokenBoard(c, g, t, 1);
    shatterDots(c, g, t, t - 12);

    // the posts, with bulbs chasing up them, and the pole in their collars
    const chase = 1 + 4 * rise;
    // (the posts come up through the stage on the cut: the machinery for the lift, which \`panel\` never had)
    const up = ease.outBack(clamp((t - this.ctx.start - 0.05) / 0.45), 1.3), off = (1 - up) * 420;
    LK.posts.forEach((px, i) => {
      c.save(); g.save();
      if (off > 0.5) { for (const k of [c, g]) { k.beginPath(); k.rect(px - 120, -H, 240, LK.floor + H - 2); k.clip(); k.translate(0, off); } }
      ratchetPost(c, g, px, LK.floor, poleY - off, t, this.clicks, i ? 1 : -1);
      this.postBulbs(c, g, px, i ? 1 : -1, t, chase, second ? 1 : 0.6);
      c.restore(); g.restore();
      if (off > 0.5 && off < 400) { // a puff of sand where it comes through the boards
        c.fillStyle = `rgba(230,210,170,${0.5 * (1 - up)})`;
        for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(px + (k - 2) * 26, LK.floor - 10 - 12 * Math.sin(k * 2.1), 16 + 6 * (1 - up), 0, TAU); c.fill(); }
      }
    });
    backlight(c, poleY - 10, shot >= 2 ? (second ? 1 : 0.7) : 0.5);
    pole(c, g, LK.posts[0] - 34, LK.posts[1] + 34, poleY, 0.6 * flash + 0.2 * rise);

    // Rai on the pole
    this.rai(c, g, t, shot, poleY);

    // the panellists: under the pole at first (CAM 2 sees the bob), then walking off into the wings
    if (!handed) cast(c, 'panel2', 1310, LK.floor, humanH('panel2'), 'carry', { col: HEX.ink, t, rim: RIMS.panel2, emote: 'sweat', emoteT0: this.ctx.start + 0.3, flip: true });
    else if (t < this.cuts[2]! + 1.4) {
      const u = clamp((t - this.cuts[2]! + 0.35) / 1.75);
      ([['panel1', 480, -260], ['panel3', 705, -200], ['panel2', 1310, W + 240]] as const).forEach(([who, x0, x1], i) => {
        const x = lerp(x0, x1, ease.inQuad(u)), bob = 6 * Math.abs(Math.sin((t + i * 0.2) * 9));
        cast(c, who, x, LK.floor - bob, humanH(who), 'slump', { col: HEX.ink, t, rim: RIMS[who], emote: 'sweat', emoteT0: this.cuts[2]!, flip: x1 < x0 });
      });
    }
    // the carriers: creatures under the pole until their person arrives, then a hop downstage to cheer from the front
    const front: (() => void)[] = [];
    for (const sl of this.slots) {
      const hj = sl.hJoin ?? 1e9, side = Math.sign(sl.x - LK.cx);
      // the creature
      const age = t - sl.join;
      if (age > -0.32) {
        const u = clamp((age + 0.32) / 0.32);
        const down = clamp((t - hj + 0.12) / 0.32);
        if (down > 0) {
          const fx = sl.x + side * 57 * ease.inOutQuad(down), fy = lerp(LK.floor, LK.floor + 50, down) - 90 * Math.sin(Math.PI * down);
          front.push(() => critter(c, sl.crit, fx, fy, LK.critS * lerp(1, 0.78, down), { t, seed: sl.seed, col: sl.col, cheer: 1, heart: 1 }));
        } else {
          const x = u < 1 ? sl.x + side * 50 * (1 - u) : sl.x;
          const fy = u < 1 ? lerp(LK.floor + 300, LK.floor, u) - 150 * Math.sin(Math.PI * u) : LK.floor;
          const land = u >= 1 ? Math.exp(-(age) / 0.12) : 0;
          c.save(); c.translate(x, fy); c.scale(1 + 0.18 * land, 1 - 0.18 * land); c.translate(-x, -fy);
          const strain = clamp((n - 0.5) / 1.5);
          critter(c, sl.crit, x, fy, LK.critS, { t, seed: sl.seed, col: sl.col, poleY: u >= 1 ? poleY : null, cheer: u < 1 ? 1 : 0, strain, heart: clamp((t - sl.join) / 3) });
          c.restore();
          if (u >= 1 && age < 0.5) { // the flash as it takes the weight
            g.fillStyle = rgbaHex(sl.col ?? HEX.gold, 0.25 * (1 - age / 0.5)); g.beginPath(); g.ellipse(x, LK.floor - 80, 60, 80, 0, 0, TAU); g.fill();
          }
        }
      }
      // the person, climbing up out of the audience into the slot
      if (sl.human) {
        const ha = t - hj;
        if (ha > -0.36) {
          const u = clamp((ha + 0.36) / 0.36);
          const fy = lerp(LK.floor + 360, LK.floor, ease.outCubic(u)) - (u < 1 ? 40 * Math.sin(Math.PI * u) : 0);
          const lifting = t >= T.lift3 - 0.02;
          const pose = u < 1 ? 'stand' : lifting ? 'cheer' : 'carry';
          const hh = humanH(sl.human);
          const emote = sl.human === 'woman' ? 'heart' : sl.human === 'trader' && ha > 0 && ha < 1.2 ? 'sweat' : undefined;
          cast(c, sl.human, sl.x, fy + (u >= 1 ? march * 0.4 : 0), hh, pose, { col: HEX.ink, t, rim: sl.rim, emote, emoteT0: sl.human === 'woman' ? T.alone2 + 0.15 : hj, flip: sl.x > LK.cx && sl.human !== 'woman' });
          if (u >= 1 && ha < 0.4) { g.fillStyle = rgbaHex(sl.rim ?? HEX.gold, 0.22 * (1 - ha / 0.4)); g.beginPath(); g.ellipse(sl.x, LK.floor - 150, 40, 150, 0, 0, TAU); g.fill(); }
        }
      }
    }
    front.forEach((d) => d());

    // the stage-lift lever and the octopus at it, holding up the cue card
    const pull = this.lever(t);
    const dial = Math.max(t > T.bring1 && t < T.home1 + 0.25 ? 0.14 * Math.sin(clamp((t - T.bring1) / (T.home1 + 0.25 - T.bring1)) * Math.PI) : 0, 0.05 + 0.9 * rise);
    liftLever(c, g, LK.lever.x, LK.floor, t, pull, dial);
    const O = LK.octo;
    octopus(c, g, O.x, O.y, O.s, t, { card: null });
    const [kx, ky] = leverKnob(LK.lever.x, LK.floor, pull);
    c.save(); c.strokeStyle = '#c65cf0'; c.lineWidth = 10; c.lineCap = 'round';
    c.beginPath(); c.moveTo(O.x - 30, O.y + 10); c.quadraticCurveTo((O.x + kx) / 2 + 10, Math.max(O.y, ky) + 40, kx + 6, ky + 4); c.stroke(); c.restore();
    const late = t >= T.rise - 0.1, flipT = late ? T.rise - 0.1 : this.bt(1) - 0.08;
    const [ca, cb] = late ? ['LIFT!', 'HOLD ON!'] : ['OOOH', 'LIFT!'];
    cueCard(c, O.x, O.y, LK.card.x, LK.card.y, O.s, t, ca!, cb!, flipT);

    if (shot >= 2) emptySeats(c, t);
    studioFront(c, g, t, { crowd: 0 });
    if (rise > 0) bubblesDown(c, t, 40, 400 + 3200 * rise, 7, -600, H + 200);
    if (rise > 0) this.fishFall(c, t, rise);
  }

  /** Bulbs up the outer face of a post, chasing upward. */
  postBulbs(c: C2, g: C2, x: number, side: number, t: number, speed: number, lit: number) {
    const bx = x + side * 22, n = 13;
    for (let i = 0; i < n; i++) {
      const y = LK.floor - 40 - i * 26, on = lit * (0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(t * 9 * speed - i * 0.9), 3));
      c.fillStyle = mixHex('#4a3a2a', HEX.gold, on); c.beginPath(); c.arc(bx, y, 6, 0, TAU); c.fill();
      if (on > 0.4) { g.fillStyle = rgbaHex(HEX.gold, 0.45 * on); g.beginPath(); g.arc(bx, y, 13, 0, TAU); g.fill(); }
    }
  }

  /** As the studio lifts off, the seabed falls away beneath the stage's lip: the keel, open water, the sand dropping. */
  seabedFalls(c: C2, t: number, rise: number) {
    const y0 = H * 0.77 + 26, drop = 900 * rise * rise;
    c.fillStyle = '#0a1030'; c.fillRect(-W, y0, W * 3, H * 2);
    c.fillStyle = '#24152b'; c.fillRect(-W, y0, W * 3, 56);
    c.strokeStyle = '#140a19'; c.lineWidth = 3; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(-W, y0 + k * 14); c.lineTo(W * 2, y0 + k * 14); c.stroke(); }
    c.fillStyle = '#3a3250'; c.fillRect(-W, y0 + 56 + drop, W * 3, H * 2);
    c.fillStyle = '#4a4060'; for (let i = 0; i < 9; i++) { c.beginPath(); c.ellipse(h01(i, 33) * W, y0 + 66 + drop, 50, 10, 0, 0, TAU); c.fill(); }
    void t;
  }

  /** A few fish left behind, streaking down the sides. */
  fishFall(c: C2, t: number, rise: number) {
    for (let i = 0; i < 6; i++) {
      const x = i < 3 ? 90 + i * 70 : W - 90 - (i - 3) * 70, y = ((h01(i, 77) * 1400 + (t - this.T.rise) * 1600 * (0.7 + 0.5 * h01(i, 78))) % 1500) - 300;
      c.save(); c.globalAlpha = clamp(rise * 4); fish(c, x, y, 22, FISH_COLS[i % 7]!, i < 3 ? 1 : -1, t, i); c.restore();
    }
  }

  // ------------------------------------------------------------------ Rai

  rai(c: C2, g: C2, t: number, shot: number, poleY: number) {
    const T = this.T, R = LK.R, x = LK.cx, y = raiOnPole(poleY, R);
    let face: Face = 'determined', arms: ArmPose | [ArmPose, ArmPose] = ['fist', 'fist'], marks: Mark[] = [], markT0 = this.cuts[shot]! + 0.1;
    let sd = false, shake = 0, look = 0, glow = '#7fd6ff', heart = 0.45, squash = 0, from: ArmPose | [ArmPose, ArmPose] = 'down';
    const s0 = this.cuts[shot]!;
    if (shot === 0) { face = 'determined'; arms = ['fist', 'fist']; shake = 0.12; }
    else if (shot === 2) {
      const alone = this.word(this.lines[1]!, /alone/).start;
      face = t >= alone ? 'grin' : 'determined'; arms = t >= alone ? ['fist', 'up'] : ['fist', 'fist']; marks = t >= alone ? ['sparkle'] : []; markT0 = alone;
    } else if (shot === 3) { face = 'determined'; arms = ['point', 'fist']; from = ['fist', 'fist']; look = -0.6; }
    else if (shot === 4) {
      if (t < T.lift1) { face = 'determined'; arms = ['fist', 'fist']; }
      else if (t < T.bring1) { face = 'determined'; arms = ['up', 'up']; marks = ['vein', 'steam']; markT0 = T.lift1; shake = 0.35; }
      else if (t < T.home1) { face = 'fierce'; arms = ['up', 'up']; marks = ['vein', 'steam']; markT0 = T.lift1; shake = 0.5; }
      else { face = 'deadpan'; arms = ['down', 'down']; sd = true; marks = ['sweat']; markT0 = T.home1 + 0.05; }
    } else if (shot === 5) {
      face = t < s0 + 0.5 ? 'wow' : 'grin'; arms = t < s0 + 0.5 ? ['cheek', 'cheek'] : ['wave', 'fist']; marks = t < s0 + 0.5 ? ['!'] : ['sparkle']; markT0 = t < s0 + 0.5 ? s0 + 0.05 : s0 + 0.5; look = -0.5;
      glow = HEX.gold;
    } else if (shot === 6) {
      const a = T.alone2;
      face = t >= a ? 'love' : 'smile'; arms = t >= a ? ['cheek', 'cheek'] : ['wave', 'fist']; marks = t >= a ? ['hearts'] : []; markT0 = a; look = t >= a ? 1 : 0.3;
      glow = HEX.gold; heart = t >= a ? 0.6 : 0.45;
    } else if (shot === 7) { face = 'joy'; arms = ['up', 'up']; marks = ['sparkle']; glow = HEX.gold; heart = 0.5; squash = 0.06 * Math.sin(t * Math.PI * 140 / 60 * 2); }
    else {
      if (t < T.rise) { face = 'determined'; arms = ['fist', 'fist']; marks = ['vein']; markT0 = T.lift3; shake = 0.3; }
      else { face = 'joy'; arms = ['fist', 'fist']; marks = ['sparkle']; markT0 = T.rise; }
      glow = HEX.gold; heart = 0.55;
    }
    // the lines of force behind her on the heaves
    if ((shot === 4 && t >= T.lift1 && t < T.home1) || (shot === 8 && t >= T.lift3 && t < T.rise)) focusLines(c, x, y - 0.6 * R, R * 2.4, 'rgba(255,255,255,0.32)', t, { n: 64 });
    if (sd) {
      drawRai(c, x, poleY - 0.6 * R, R, { t, face, sd: true, marks, markT0, glow, heart });
      poof(c, x, y - 0.4 * R, R * 1.5, t, T.home1);
    } else {
      drawRai(c, x, y, R, {
        t, face, arms, armsFrom: from, armsU: clamp((t - s0) / 0.2), marks, markT0, shake, look, glow, glowStrength: 0.8,
        heart, heartColor: HEX.pink, squash, prop: { side: 1, draw: micProp },
      });
      g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = 'rgba(0,0,0,0.75)';
      g.beginPath(); g.arc(x, y, R * 0.98, 0, TAU); g.moveTo(x + 0.27 * R, y + 0.12 * R); g.arc(x, y + 0.12 * R, 0.27 * R, 0, TAU); g.fill('evenodd');
      g.beginPath(); g.arc(x, y - 1.2 * R, 0.78 * R, 0, TAU); g.fill();
      g.restore();
    }
  }

  // ------------------------------------------------------------------ the stands empty

  stands(c: C2, g: C2, t: number, s0: number) {
    const rows = ['A', 'B', 'C', 'D'];
    const seats: Record<string, SeatKind> = {};
    const leaving: { kind: Critter; x: number; y: number; s: number; u: number; seed: number; dir: number }[] = [];
    rows.forEach((row, ri) => {
      for (let col = 1; col <= 12; col++) {
        const kind = seatKind(row, col);
        if (kind === 'lunchbox' || kind === 'empty') continue;
        const tl = s0 + 0.1 + 0.11 * ri + 0.2 * h01(ri, col, 7);
        const u = (t - tl) / 0.5;
        if (u < 0) continue;
        seats[`${row}${col}`] = 'empty';
        if (u > 1) continue;
        const p = seatPos(row, col);
        leaving.push({ kind: kind as Critter, x: p.x, y: p.y - 30 * p.s, s: p.s, u, seed: ri * 13 + col, dir: p.x < W / 2 ? -1 : 1 });
      }
    });
    const c7 = seatPos('C', 7);
    audience(c, g, t, { mood: 'cheer', seats, spot: { x: c7.x, y: c7.y - 20, r: 110, a: clamp((t - s0 - 0.35) / 0.3) }, dim: 0.25 * clamp((t - s0 - 0.35) / 0.3) });
    leaving.sort((a, b) => a.s + a.u - (b.s + b.u));
    for (const l of leaving) {
      const u = l.u, s = l.s * (1 + 1.5 * u);
      const x = l.x + (l.x - W / 2) * 0.55 * u + l.dir * 40 * u;
      const y = lerp(l.y + 30 * l.s, H + 330, u * u) - 170 * l.s * Math.sin(Math.PI * Math.min(1, u * 1.3));
      critter(c, l.kind, x, y, s, { t, seed: l.seed, col: l.kind === 'fish' ? FISH_COLS[l.seed % 7] : undefined, cheer: 1 });
    }
    // the cue sign over the stands
    slam(c, 'LIFT!', W / 2, 150, 130, t, s0, { fam: FAM.hook(), col: HEX.yellow, shadow: HEX.ink });
  }
}
