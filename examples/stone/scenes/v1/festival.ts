// v1 FESTIVAL (156.48-186.90): the final chorus (lines 47-54, the key lift), the longest and loudest plate. The
// studio breaches the surface at night in the shallows of Yap's beach (`island(... 'night')`: palms, huts, the stone
// bank) with everyone still holding up the pole; water sheets off it; the whole island watches from the sand with
// lanterns; fireworks. Then it is a show on the beach, cut on the beat:
//   F1  breach        the studio erupts from the bay, the line still lifting Rai; a ring firework on the downbeat (47)
//   F2  CAM 2         Rai in the ring of bulbs, mic out to the beach: "worth what you say" (48)
//   F3  reverse       "say it for her": from the stage's edge, Rai points into the front row; the truss spot swings
//                     onto the woman with her child on her hip (the child holds seat C7's lunchbox); "and for me":
//                     Rai's hand to her own heart (48)
//   F4  CAM 3         the scoreboard rebuilt in bulbs; a click on each "count" lights NIGHTS / MEALS / CARE in pink,
//                     no £ and no number; "or don't count": she tosses the clicker, the stars glow on anyway (49)
//   F5  from behind   the crowd's lanterns lift together, AGREE; a crash zoom for the wink on "money's about" (50)
//   F6  wide          fireworks in every colour; STONE; then CAM 2, SEA and a chibi pop (51)
//   F7  reverse       the beach from the stage: they lift her up and pass her over their hands; a bubble with one
//                     small word pops behind her on each beat: YES, HER, REAL, MUM (the child), THANKS (52)
//   F8  CAM 2 / ECU   hand to her ear, the applause meter climbing; it breaks the top on "loud": LOUD (53)
//   F9  the pull back the held last line: Rai in the ring of bulbs, the fireworks draw one great ring round her over
//                     the bay, the island around; joy into love (54). It joins `goodnight` on the same beach.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../../engine/scene';
import { Layer2D, W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import type { Line, Word } from '../../engine/lyrics';
import { clamp, ease, lerp } from '../../engine/util';
import { drawRai, h01, type Face, type ArmPose, type RaiOpts } from '../_rai';
import { FAM, TAU, rgbaHex, mixHex, slam, person } from '../_motifs';
import { poof, focusLines, star4, type Mark } from '../_manga';
import { cast } from './_cast';
import { mergePost, punch, hitShake, caKick } from '../_post';
import { lowerThird, liveBug, camTag, micProp, withCam, type Cam } from './_studio';
import { LK, poleAt, raiOnPole, finalLine, cutLowerThird } from './lift-kit';
import {
  FW, type Burst, FIRE_COLS, fireworks, fireReflections, greatRing, planBursts, nightBay, beachProps, festStage, type StageOpts,
  crowdLayout, crowdBack, type Folk, beachLayout, beachBackdrop, beachWater, beachCrowd, type BeachFolk, bubble, meterECU,
  clickerProp, confetti, lantern,
} from './festival-world';

type C2 = CanvasRenderingContext2D;

/** A camera looking at world point (px, py) at zoom z, kept inside the world's frame. */
function look(px: number, py: number, z: number): Cam {
  const hw = W / (2 * z), hh = H / (2 * z);
  return { x: clamp(px, hw, W - hw) - W / 2, y: clamp(py, hh, H - hh) - H / 2, zoom: z };
}

export default class Festival extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  lines: Line[] = [];
  cuts: number[] = [];
  bursts: Burst[] = [];
  folk: Folk[] = [];
  beach: BeachFolk[] = [];
  T: Record<string, number> = {};

  word(line: Line, re: RegExp, nth = 0): Word { return line.words.filter((w) => re.test(w.w.toLowerCase()))[nth] ?? line.words[0]!; }

  override init() {
    const { lyrics, audio: au, start, end } = this.ctx;
    const own = lyrics.lines.filter((l) => l.words[0]!.start >= start - 0.1 && l.words[0]!.start < end);
    const carry = lyrics.lines.filter((l) => l.words[0]!.start < start - 0.1 && l.end > start - 0.05).pop();
    this.lines = carry ? [carry, ...own] : own;
    const [L47, L48, L49, L50, L51, L52, L53, L54] = own as [Line, Line, Line, Line, Line, Line, Line, Line];
    const B = (t: number) => au.timeOfBeat(Math.floor(au.beatAt(t + 0.02)));
    const T = this.T;
    T.stone1 = this.word(L47, /stone/).start; T.sea1 = this.word(L47, /sea/).start;
    T.say = this.word(L48, /say/).start; T.her = this.word(L48, /her/).start; T.me = this.word(L48, /^me/).start; T.forMe = this.word(L48, /for/, 1).start;
    T.count1 = this.word(L49, /count/, 0).start; T.count2 = this.word(L49, /count/, 1).start; T.count3 = this.word(L49, /count/, 2).start; T.count4 = this.word(L49, /count/, 3).start;
    T.nights = this.word(L49, /nights/).start; T.meals = this.word(L49, /meals/).start; T.care = this.word(L49, /care/).start; T.dont = this.word(L49, /don/).start;
    T.agree = this.word(L50, /agree/).start; T.real = this.word(L50, /real/).start; T.money = this.word(L50, /money/).start;
    T.stone2 = this.word(L51, /stone/).start; T.sea2 = this.word(L51, /sea/).start;
    T.lifted = this.word(L52, /lifted/).start; T.wordW = this.word(L52, /word/).start; T.agreed = this.word(L52, /agreed/).start;
    T.choose = this.word(L53, /choose/).start; T.honour1 = this.word(L53, /honour/, 0).start; T.honour2 = this.word(L53, /honour/, 1).start; T.loud = this.word(L53, /loud/).start;
    T.stone3 = this.word(L54, /stone/).start; T.sea3 = this.word(L54, /sea/).start;
    T.rise = start - 0.01;
    this.cuts = [start, B(L48.words[0]!.start), B(T.her), B(L49.words[0]!.start), B(L50.words[0]!.start), B(T.money), B(L51.words[0]!.start), B(T.stone2 + 1.0), B(L52.words[0]!.start), B(L53.words[0]!.start), B(T.honour2), B(L54.words[0]!.start)];
    // the bang of the breach: when the ring of bulbs clears the water
    T.breach = start + 0.2;
    T.ring1 = au.downbeats.find((d) => d > T.stone1 + 0.3) ?? T.stone1 + 0.7;
    T.great0 = au.downbeats.find((d) => d > L54.words[0]!.start + 1.5) ?? L54.words[0]!.start + 2;
    T.great1 = T.sea3;
    const G = FW.great;
    const extra: Burst[] = [
      { t0: T.ring1, x: 960, y: 170, r: 210, col: HEX.gold, col2: HEX.pink, kind: 'ring', n: 72, seed: 1, lx: 960 },
      { t0: T.sea1, x: 1420, y: 210, r: 170, col: HEX.pink, col2: HEX.yellow, kind: 'peony', n: 60, seed: 2, lx: 1380 },
      { t0: T.her, x: 1420, y: 230, r: 120, col: HEX.pink, col2: '#ffffff', kind: 'heart', n: 64, seed: 3, lx: 1400 },
      // low ones behind the stage, for the close shots
      { t0: this.cuts[1]! + 0.12, x: 1160, y: 420, r: 130, col: HEX.cyan, col2: '#ffffff', kind: 'peony', n: 54, seed: 21, lx: 1200 },
      { t0: T.say + 0.05, x: 760, y: 440, r: 110, col: HEX.pink, col2: HEX.gold, kind: 'ring', n: 56, seed: 22, lx: 760 },
      { t0: T.meals, x: 1080, y: 410, r: 120, col: HEX.gold, col2: HEX.pink, kind: 'peony', n: 56, seed: 23, lx: 1080 },
      { t0: T.care, x: 620, y: 395, r: 100, col: HEX.pink, col2: '#ffffff', kind: 'ring', n: 56, seed: 24, lx: 640 },
      { t0: T.dont, x: 1160, y: 430, r: 110, col: HEX.lime, col2: HEX.yellow, kind: 'crackle', n: 56, seed: 25, lx: 1160 },
      { t0: T.agree, x: 420, y: 230, r: 200, col: HEX.yellow, col2: HEX.orange, kind: 'ring', n: 64, seed: 4, lx: 440 },
      { t0: T.agree + 0.05, x: 1500, y: 210, r: 200, col: HEX.cyan, col2: HEX.lime, kind: 'ring', n: 64, seed: 5, lx: 1480 },
      { t0: T.real, x: 960, y: 140, r: 230, col: HEX.pink, col2: HEX.gold, kind: 'crackle', n: 70, seed: 6, lx: 940 },
      { t0: T.loud, x: 600, y: 200, r: 240, col: HEX.orange, col2: HEX.yellow, kind: 'palm', n: 48, seed: 7, lx: 640 },
      { t0: T.loud + 0.1, x: 1350, y: 180, r: 240, col: HEX.violet, col2: HEX.pink, kind: 'peony', n: 64, seed: 8, lx: 1300 },
      { t0: T.sea3 + 0.15, x: G.x, y: G.y - 70, r: 80, col: HEX.pink, col2: '#ffffff', kind: 'heart', n: 70, seed: 9, lx: G.x },
    ];
    // fireworks in every colour through line 51, two a beat
    for (let b = Math.ceil(au.beatAt(this.cuts[6]!)); au.timeOfBeat(b) < this.cuts[8]!; b++) {
      for (let k = 0; k < 2; k++) {
        const s = b * 3 + k * 101, x = 180 + h01(s, 3) * (W - 360), y = 90 + h01(s, 4) * 320;
        const kind = (['peony', 'crackle', 'ring', 'palm', 'peony', 'ring'] as const)[Math.floor(h01(s, 2) * 6)]!;
        extra.push({ t0: au.timeOfBeat(b) + k * 0.21, x, y, r: 120 + 120 * h01(s, 5), col: FIRE_COLS[(b + k * 3) % FIRE_COLS.length]!, col2: FIRE_COLS[(b + 5) % FIRE_COLS.length]!, kind, n: kind === 'palm' ? 36 : 56, seed: s, lx: x });
      }
    }
    this.bursts = planBursts(au.beats, T.ring1 + 0.8, T.great0 - 0.6, extra);
    this.folk = crowdLayout();
    this.beach = beachLayout();
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t, T = this.T;
    this.L.clear(HEX.ink); this.G.clear();
    const shot = Math.max(0, this.cuts.filter((x) => t >= x).length - 1);
    const s0 = this.cuts[shot]!, s1 = this.cuts[shot + 1] ?? this.ctx.end, sp = clamp((t - s0) / (s1 - s0));
    let post: PostOverrides = { bloom: 0.75, vignette: 0.42 };
    const sl = { fam: FAM.hook(), shadow: HEX.ink };

    switch (shot) {
      case 0: { // F1: the breach
        const z = lerp(1.5, 1.12, ease.inOutQuad(clamp((t - s0) / (s1 - s0 - 0.3))));
        this.world(c, g, t, look(960, lerp(610, 500, ease.inOutQuad(clamp((t - s0) / 1.6))), z), { stage: { dy: this.dy(t), wet: t - T.breach, props: false, crew: false, onStage: () => this.line(c, g, t) }, crowd: { gasp: t < T.stone1 ? 1 : 0, cheer: t > T.stone1 + 0.2 ? 1 : 0, emote: '!', emoteT0: T.breach + 0.1 } });
        slam(c, 'STONE', 360, 250, 150, t, T.stone1, { ...sl, col: HEX.gold, rot: -0.05 });
        slam(c, 'SEA', 1530, 320, 200, t, T.sea1, { ...sl, col: HEX.cyan, rot: 0.05 });
        post = mergePost(post, hitShake(t, [T.breach], 6, 0.4), caKick(t, [T.breach], 4), punch(t, [T.stone1, T.sea1], 0.025), punch(t, [T.ring1], 0.02));
        break;
      }
      case 1: { // F2: CAM 2, mic out to the beach
        const z = lerp(2.9, 3.05, sp);
        this.world(c, g, t, look(960, 520, z), { stage: { onStage: () => this.rai(c, t, shot) }, crowd: {} });
        camTag(c, 'CAM 2', t, s0);
        break;
      }
      case 2: { // F3: "say it for her": the two-shot over the woman in the front row
        this.forHer(c, g, t, s0);
        slam(c, 'HER', 1520, 250, 200, t, T.her, { ...sl, col: HEX.pink, rot: 0.06 });
        post = mergePost(post, punch(t, [T.her], 0.03));
        break;
      }
      case 3: { // F4: the scoreboard rebuilt in bulbs
        this.world(c, g, t, look(845, 515, lerp(3.62, 3.75, sp)), { stage: { onStage: () => this.rai(c, t, shot) }, crowd: {} });
        camTag(c, 'CAM 3', t, s0);
        this.clickerFly(c, t);
        post = mergePost(post, punch(t, [T.count1, T.count2, T.count3], 0.012));
        break;
      }
      case 4: { // F5a: the lanterns lift together: AGREE
        const raise = ease.outBack(clamp((t - T.agree + 0.05) / 0.3));
        this.world(c, g, t, look(960, 560, lerp(1.1, 1.16, sp)), { stage: { onStage: () => this.rai(c, t, shot) }, crowd: { raise } });
        slam(c, 'AGREE', 960, 190, 240, t, T.agree, { ...sl, col: HEX.yellow, shadowOff: 0.05 });
        post = mergePost(post, punch(t, [T.agree], 0.03), hitShake(t, [T.agree], 4, 0.3));
        break;
      }
      case 5: { // F5b: crash zoom, the wink
        const z = lerp(3.4, 4.5, ease.outExpo(clamp((t - s0) / 0.14)));
        this.world(c, g, t, look(960, 505, z), { stage: { onStage: () => this.rai(c, t, shot) }, crowd: {} });
        post = mergePost(post, punch(t, [s0], 0.03, 0.25));
        break;
      }
      case 6: { // F6a: fireworks in every colour
        this.world(c, g, t, look(960, 540, lerp(1.0, 1.04, sp)), { stage: { onStage: () => this.rai(c, t, shot) }, crowd: { cheer: 1, raise: 0.6 } });
        slam(c, 'STONE', 960, 175, 220, t, T.stone2, { ...sl, col: HEX.bone, shadow: HEX.pink, shadowOff: 0.05 });
        post = mergePost(post, punch(t, [T.stone2], 0.025));
        break;
      }
      case 7: { // F6b: CAM 2, SEA and the chibi
        this.world(c, g, t, look(960, 495, lerp(2.5, 2.65, sp)), { stage: { onStage: () => this.rai(c, t, shot), burst: [HEX.pink, '#d93a82'] }, crowd: {} });
        slam(c, 'SEA', 1500, 330, 210, t, T.sea2, { ...sl, col: HEX.pink, rot: 0.06 });
        camTag(c, 'CAM 2', t, s0);
        post = mergePost(post, punch(t, [T.sea2], 0.03));
        break;
      }
      case 8: { // F7: the reverse shot: the beach lifts her up
        this.reverse(c, g, t, s0, s1);
        break;
      }
      case 9: { // F8a: hand to her ear, the meter climbing
        this.world(c, g, t, look(1085, 545, lerp(2.55, 2.7, sp)), { stage: { onStage: () => this.rai(c, t, shot), card: 'LOUDER!', cardT0: T.honour1, meter: 0.3 + 0.3 * ease.inQuad(sp) + 0.02 * Math.sin(t * 30) }, crowd: {} });
        camTag(c, 'CAM 2', t, s0);
        post = mergePost(post, punch(t, [T.honour1], 0.02));
        break;
      }
      case 10: { // F8b: the meter breaks the top: LOUD
        const v = 0.45 + 0.5 * ease.inOutQuad(clamp((t - s0) / (T.loud - s0 - 0.05))) + 0.02 * Math.sin(t * 40) * clamp((t - T.honour2) / 0.3);
        meterECU(c, g, t, v, T.loud);
        this.peek(c, t);
        confetti(c, t, T.loud, 70);
        slam(c, 'LOUD', 960, 330, 330, t, T.loud, { ...sl, col: HEX.pink, shadow: HEX.yellow, shadowOff: 0.05, rot: -0.04 });
        post = mergePost(post, hitShake(t, [T.loud], 8, 0.4), caKick(t, [T.loud], 6), punch(t, [T.loud], 0.04), { flash: t >= T.loud ? 0.35 * Math.exp(-(t - T.loud) / 0.05) : 0 });
        break;
      }
      default: { // F9: the held last line: the pull back, the great ring
        const u = ease.inOutCubic(clamp((t - s0) / (T.great1 + 0.2 - s0)));
        const z = lerp(2.7, 1.0, u), py = lerp(480, 540, u);
        this.world(c, g, t, look(960, py, z), { stage: { onStage: () => this.rai(c, t, shot) }, crowd: { emote: 'heart', emoteT0: T.sea3! }, great: true });
        confetti(c, t, T.great1, 40);
        post = mergePost(post, punch(t, [T.great1], 0.015), { flash: t >= T.great1 ? 0.15 * Math.exp(-(t - T.great1) / 0.08) : 0 });
        break;
      }
    }

    liveBug(c, g, t, 'LIVE · YAP');
    this.lyric(c, g, t);
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    return mergePost(post, { zoom: 1 + 0.008 * f.a.kick });
  }

  /** The sung line in the lower third: each line from its first word until the next starts (46's tail first). */
  lyric(c: C2, g: C2, t: number) {
    let cur: Line | undefined;
    for (let i = 0; i < this.lines.length; i++) if (t >= this.lines[i]!.words[0]!.start - (i === 0 ? 0.4 : 0)) cur = this.lines[i];
    if (!cur) return;
    lowerThird(c, cur, t, { until: Math.max(cur.end + 0.35, cur === this.lines[this.lines.length - 1] ? this.ctx.end + 1 : 0) });
    cutLowerThird(g, cur, t);
  }

  // ------------------------------------------------------------------ the world under a camera

  world(c: C2, g: C2, t: number, cam: Cam, o: { stage?: StageOpts; crowd?: Parameters<typeof crowdBack>[4] | null; great?: boolean }) {
    const T = this.T;
    let fl = { light: 0, col: HEX.gold as string };
    withCam(c, cam, () => withCam(g, cam, () => {
      nightBay(c, g, t);
      if (o.great) greatRing(c, g, t, T.great0!, T.great1!);
      fl = fireworks(c, g, t, this.bursts);
      fireReflections(g, t, this.bursts);
      const after = t >= T.loud!;
      const lit = (tc: number) => clamp((t - tc) / 0.3);
      const st: StageOpts = {
        board: { head: 1, rows: [lit(T.nights!), lit(T.meals!), lit(T.care!)] },
        meter: after ? 1 : 0.25 + 0.08 * Math.sin(t * 3), broke: T.loud, card: 'APPLAUSE', cardT0: this.ctx.start, ...o.stage,
      };
      festStage(c, g, t, st);
      beachProps(c, g, t);
      if (o.crowd !== null) crowdBack(c, g, t, this.folk, { ...o.crowd, light: fl.light, lightCol: fl.col });
    }));
    void fl;
  }

  /** The studio's rise out of the water: below the surface at the cut, erupting, bobbing up past its mark and settling. */
  dy(t: number) {
    const u = clamp((t - this.ctx.start + 0.01) / 1.5);
    return 440 * (1 - ease.outBack(u, 1.4));
  }

  /** F1: the line still holding Rai up on the pole as the studio breaches (the lift's last picture, at this distance). */
  line(c: C2, g: C2, t: number) {
    const k = FW.R / LK.R, poleY = poleAt(4);
    for (const ctx of [c, g]) { ctx.save(); ctx.translate(FW.ring.x, FW.floor); ctx.scale(k, k); ctx.translate(-LK.cx, -LK.floor); }
    finalLine(c, g, t, poleY, () => {
      const T = this.T, joy = t >= T.breach + 0.5;
      drawRai(c, LK.cx, raiOnPole(poleY), LK.R, {
        t, face: joy ? 'joy' : 'determined', arms: joy ? ['up', 'up'] : ['fist', 'fist'], marks: joy ? ['sparkle'] : [], markT0: T.breach + 0.5,
        glow: HEX.gold, heart: 0.55, prop: { side: 1, draw: micProp },
      });
    });
    c.restore(); g.restore();
  }

  // ------------------------------------------------------------------ Rai on the stage

  rai(c: C2, t: number, shot: number) {
    const T = this.T, R = FW.R, x = FW.ring.x, y = FW.floor - 1.07 * R;
    const s0 = this.cuts[shot]!;
    let face: Face = 'joy', arms: ArmPose | [ArmPose, ArmPose] = ['up', 'up'], marks: Mark[] = [], markT0 = s0 + 0.1;
    let tilt = 0, hop = 0, sd = false, from: RaiOpts['armsFrom'] = 'down', armsU = clamp((t - s0) / 0.2), heart = 0.5, heartColor: string = HEX.pink, glow: string = HEX.gold, look = 0;
    let prop: RaiOpts['prop'] = { side: 1, draw: micProp };
    const beat = (t * 140.042 / 60) % 1;
    switch (shot) {
      case 1:
        if (t < T.say!) { face = 'sassy'; arms = ['hip', 'reach']; tilt = 0.1; marks = ['shine']; }
        else { face = 'cheeky'; arms = ['hip', 'cheek']; from = ['hip', 'reach']; armsU = clamp((t - T.say!) / 0.18); tilt = -0.06; }
        break;
      case 3: { // the clicker: a click on each "count", then tossed away
        const clicks = [T.count1!, T.count2!, T.count3!];
        const last = Math.max(...clicks.filter((x2) => x2 <= t), -1e9), press = clamp(1 - (t - last) / 0.15);
        if (t >= T.dont! && t < T.count4!) { face = 'cheeky'; sd = true; marks = ['shine']; markT0 = T.dont!; }
        else if (t >= T.count4!) { face = 'smug'; arms = ['cross', 'cross']; from = 'cross'; prop = undefined; marks = ['sparkle']; markT0 = T.count4!; }
        else {
          face = t < T.count1! ? 'determined' : 'grin'; arms = ['down', 'fist']; from = ['down', 'hold']; armsU = 1 - 0.6 * press; look = -1;
          prop = { side: 1, draw: clickerProp(press) }; marks = t > T.nights! ? ['sparkle'] : []; markT0 = T.nights!;
        }
        break;
      }
      case 4: face = t >= T.agree! ? 'joy' : 'smile'; arms = t >= T.agree! ? ['up', 'up'] : ['down', 'wave']; marks = t >= T.agree! ? ['sparkle'] : []; markT0 = T.agree!; hop = t >= T.agree! ? 0.12 * Math.abs(Math.sin(Math.PI * beat)) : 0; break;
      case 5: face = 'wink'; arms = ['hip', 'point']; marks = ['shine']; tilt = 0.08; break;
      case 6: face = 'joy'; arms = ['up', 'up']; hop = 0.18 * Math.abs(Math.sin(Math.PI * beat)); marks = ['sparkle']; break;
      case 7:
        if (t >= T.sea2! - 0.02) { face = 'joy'; sd = true; marks = ['sparkle']; markT0 = T.sea2!; }
        else { face = 'joy'; arms = ['fist', 'fist']; marks = ['sparkle']; hop = 0.1 * Math.abs(Math.sin(Math.PI * beat)); }
        break;
      case 9:
        if (t < T.honour1!) { face = 'cheeky'; arms = ['hip', 'cheek']; tilt = -0.08; look = 1; marks = ['?']; markT0 = s0 + 0.3; }
        else { face = 'fierce'; arms = ['fist', 'fist']; from = ['hip', 'cheek']; armsU = clamp((t - T.honour1!) / 0.15); marks = ['steam']; markT0 = T.honour1!; }
        break;
      default: // F9: joy, then love
        if (t < T.sea3!) { face = 'joy'; arms = ['up', 'up']; marks = ['sparkle']; hop = 0.08 * Math.abs(Math.sin(Math.PI * beat)); }
        else { face = 'love'; arms = ['cheek', 'cheek']; from = ['up', 'up']; armsU = clamp((t - T.sea3!) / 0.3); marks = ['hearts']; markT0 = T.sea3!; heart = 1; glow = HEX.pink; }
    }
    if (sd) {
      drawRai(c, x, y + 0.35 * R, R, { t, face, sd: true, marks, markT0, glow, heart });
      poof(c, x, y - 0.3 * R, R * 1.6, t, markT0);
      if (shot === 3) poof(c, x, y - 0.3 * R, R * 1.6, t, T.count4!);
    } else {
      drawRai(c, x, y, R, { t, face, arms, armsFrom: from, armsU, marks, markT0, tilt, hop, glow, glowStrength: 0.8, heart, heartColor, look, prop });
    }
  }

  /** F4: the clicker tossed over her shoulder on "don't", spinning off into the night. */
  clickerFly(c: C2, t: number) {
    const a = t - this.T.dont!;
    if (a < 0 || a > 0.9) return;
    const x = 1420 + 900 * a, y = 520 - 900 * a + 1200 * a * a;
    c.save(); c.translate(x, y); c.rotate(a * 18); c.scale(2.4, 2.4);
    clickerProp(0)(c, 100);
    c.restore();
  }

  // ------------------------------------------------------------------ F3: "say it for her"

  /**
   * F3: the reverse two-shot from the stage's edge: the beach behind, the woman in the front row with her child on her
   * hip (the lunchbox from seat C7 in the child's hands); Rai in the foreground points her out on "her", the spot
   * swings onto her; "and for me", a hand on her own heart.
   */
  forHer(c: C2, g: C2, t: number, s0: number) {
    const T = this.T;
    let light = 0, lcol: string = HEX.gold;
    for (const b of this.bursts) { const a = t - b.t0; if (a >= 0 && a < 1) { const l = Math.exp(-a / 0.3); if (l > light) { light = l; lcol = b.col; } } }
    const swing = ease.inOutCubic(clamp((t - T.her! + 0.05) / 0.25));
    withCam(c, { zoom: 1.08, y: -20 }, () => withCam(g, { zoom: 1.08, y: -20 }, () => {
      beachBackdrop(c, g, t, light, lcol);
      beachCrowd(c, g, t, this.beach.filter((f) => !f.who && f.feet < 800), { light, lightCol: lcol });
    }));
    // the spot: from the truss, above and behind us, swinging onto her
    const wx = lerp(1100, 700, swing), wf = 930, wh = 470, u = wh / 100, hy = wf - 88 * u;
    const px = lerp(1250, wx, swing);
    const sg = g.createLinearGradient(px, -60, px, wf);
    sg.addColorStop(0, rgbaHex('#fff3c8', 0.03)); sg.addColorStop(1, rgbaHex('#fff3c8', 0.13 * (0.4 + 0.6 * swing)));
    g.fillStyle = sg; g.beginPath(); g.moveTo(px - 60, -60); g.lineTo(px + 60, -60); g.lineTo(px + 200, wf + 10); g.lineTo(px - 200, wf + 10); g.closePath(); g.fill();
    c.fillStyle = rgbaHex('#fff3c8', 0.16 * swing); c.beginPath(); c.ellipse(700, wf + 4, 200, 34, 0, 0, TAU); c.fill();
    // the front row: islanders with lanterns, and her
    drawFolk(c, g, t, 330, 940, 460, 5, 'stand');
    drawFolk(c, g, t, 1020, 950, 450, 6, 'cheer');
    const em = t >= T.forMe! ? 'heart' : t >= T.her! + 0.12 ? '!' : undefined;
    const W0 = 700, rim = swing > 0.4 ? '#fff3c8' : '#ffb36a';
    cast(c, 'woman', W0, wf, wh, 'hold', { col: '#0a0812', t, rim, headTilt: -0.1 * swing, emote: em, emoteT0: em === 'heart' ? T.forMe! : T.her! + 0.12 });
    // the child: bunches, and the lunchbox from seat C7
    const shx = W0, shy = wf - 74 * u;
    c.fillStyle = '#0a0812'; c.beginPath(); c.arc(shx + 13 * u - 6 * u, shy - 3 * u - 4 * u, 2.6 * u, 0, TAU); c.arc(shx + 13 * u + 6 * u, shy - 3 * u - 4 * u, 2.6 * u, 0, TAU); c.fill();
    c.fillStyle = '#ff5a5f'; c.beginPath(); c.roundRect(shx + 16 * u, shy + 18 * u, 12 * u, 9 * u, 2 * u); c.fill();
    c.strokeStyle = '#8a2a2e'; c.lineWidth = 1.4 * u; c.beginPath(); c.arc(shx + 22 * u, shy + 18 * u, 3 * u, Math.PI, 0); c.stroke();
    c.fillStyle = HEX.yellow; c.beginPath(); c.arc(shx + 19 * u, shy + 22 * u, 1.6 * u, 0, TAU); c.fill();
    // the light is behind her: punch her silhouette out of the glow so she stays crisp against the beam
    g.save(); g.globalCompositeOperation = 'destination-out';
    cast(g, 'woman', W0, wf, wh, 'hold', { col: '#000', t, headTilt: -0.1 * swing });
    g.restore();
    void hy;
    // the edge of the stage at the bottom, and Rai on it, close
    c.fillStyle = '#2a1820'; c.fillRect(0, 990, W, 90);
    c.fillStyle = '#4a3036'; c.fillRect(0, 978, W, 14);
    for (let i = 0; i < 16; i++) {
      const fx = 40 + i * 124, on = 0.7 + 0.3 * Math.sin(t * 6 + i);
      c.fillStyle = mixHex('#5a4630', HEX.gold, on); c.beginPath(); c.arc(fx, 1010, 9, 0, TAU); c.fill();
      g.fillStyle = rgbaHex(HEX.gold, 0.35 * on); g.beginPath(); g.arc(fx, 1010, 18, 0, TAU); g.fill();
    }
    this.raiPoint(c, t, 1480, 905, 150);
    void s0; void wx;
  }

  raiPoint(c: C2, t: number, x = FW.ring.x, feet = FW.floor, R = FW.R) {
    const T = this.T, y = feet - 1.07 * R;
    const pointing = t >= T.her! - 0.06, me = t >= T.forMe!;
    drawRai(c, x, y, R, {
      t, face: me ? 'soft' : 'fierce', arms: me ? ['point', 'hold'] : pointing ? ['point', 'fist'] : ['down', 'fist'], armsFrom: pointing ? ['down', 'fist'] : 'down',
      armsU: clamp((t - T.her! + 0.06) / 0.12), tilt: pointing && !me ? -0.1 : 0, marks: me ? ['hearts'] : pointing ? ['shine'] : [], markT0: me ? T.forMe! : T.her!,
      glow: HEX.gold, heart: me ? 0.9 : 0.5, heartColor: HEX.pink, prop: { side: 1, draw: micProp }, look: -1,
    });
  }

  // ------------------------------------------------------------------ F7: the beach lifts her up

  reverse(c: C2, g: C2, t: number, s0: number, s1: number) {
    const T = this.T;
    // the fireworks are behind the camera: their light flickers on the sky and the crowd
    let light = 0, lcol: string = HEX.gold;
    for (const b of this.bursts) { const a = t - b.t0; if (a >= 0 && a < 1) { const l = Math.exp(-a / 0.3); if (l > light) { light = l; lcol = b.col; } } }
    const beatL = Math.exp(-((t * 140.042 / 60) % 1) * 4) * 0.6;
    if (beatL > light) { light = beatL; lcol = FIRE_COLS[Math.floor(t * 140.042 / 60) % FIRE_COLS.length]!; }
    const u = ease.inOutQuad(clamp((t - s0 - 0.1) / (s1 - s0 - 0.1)));
    const rx = lerp(280, 1560, u), up = ease.outBack(clamp((t - T.lifted! + 0.08) / 0.35));
    withCam(c, { zoom: lerp(1.0, 1.04, u) }, () => withCam(g, { zoom: lerp(1.0, 1.04, u) }, () => {
      beachBackdrop(c, g, t, light, lcol);
      const near = (f: BeachFolk) => f.feet < 800 && Math.abs(f.x - rx) < (f.feet > 650 ? 170 : 120);
      const back = this.beach.filter((f) => !f.who && f.feet < 800);
      beachCrowd(c, g, t, back, { light, lightCol: lcol, lift: near });
      // Rai on their hands, passed along
      const R = 74, feet = lerp(720, 508, up), y = feet - 1.07 * R + 4 * Math.sin(t * 9);
      const loving = t >= T.wordW!;
      drawRai(c, rx, y, R, {
        t, face: loving ? 'love' : 'joy', arms: loving ? ['cheek', 'cheek'] : ['up', 'up'], marks: loving ? ['hearts'] : ['sparkle'], markT0: loving ? T.wordW! : T.lifted!,
        tilt: 0.12 * Math.sin(t * 3), glow: HEX.gold, heart: loving ? 1 : 0.6, heartColor: HEX.pink, armsFrom: 'down', armsU: clamp((t - s0) / 0.2),
      });
      const front = this.beach.filter((f) => f.who || f.feet >= 800);
      const emotes: Record<string, [any, number]> = { woman: ['heart', T.wordW! + 0.3], housekeeper: ['joy', T.lifted!], trader: ['!', T.lifted! + 0.3] };
      beachCrowd(c, g, t, front, { light, lightCol: lcol, emotes });
      beachWater(c, g, t);
    }));
    // a word from the crowd on each half-beat, in a bubble behind her as she passes
    const words: [string, number, number, number][] = [['YES', 270, 530, 0], ['HER', 600, 440, 1], ['REAL', 900, 530, 2], ['MUM', 1150, 440, 3], ['THANKS', 1450, 530, 4]];
    const head = (x: number) => { const f = this.beach.find((b) => Math.abs(b.x - x) < 40 && b.feet >= 880); return f ? f.feet - 0.97 * f.h : 640; };
    for (const [wd, x, y, i] of words) {
      const t0 = T.wordW! - 0.45 + i * 0.3;
      const sx = wd === 'YES' ? 300 : wd === 'HER' ? 640 : wd === 'REAL' ? 880 : wd === 'MUM' ? 1110 + 30 : 1330;
      const tx = sx, ty = wd === 'MUM' ? 900 - 0.66 * 300 : head(sx);
      bubble(c, x, y, wd, tx, ty, t, t0, g);
    }
    camTag(c, 'CAM 4', t, s0);
    void lantern;
  }

  /** F8b: a chibi Rai peeking in at the corner, cupping her ear; shocked when it breaks; then joy. */
  peek(c: C2, t: number) {
    const T = this.T, br = t >= T.loud!;
    const face: Face = !br ? 'cheeky' : t < T.loud! + 0.35 ? 'shock' : 'joy';
    const k = clamp((t - this.cuts[10]! - 0.1) / 0.25);
    drawRai(c, 210, 1130 - 290 * ease.outBack(k), 120, { t, face, sd: true, marks: br ? (t < T.loud! + 0.35 ? ['!?'] : ['sparkle']) : ['?'], markT0: br ? T.loud! : this.cuts[10]! + 0.3, shake: br && t < T.loud! + 0.35 ? 0.6 : 0, glow: HEX.gold, heart: 0.6 });
  }
}

/** One islander with a lantern, big in the foreground. */
function drawFolk(c: C2, g: C2, t: number, x: number, feet: number, h: number, seed: number, pose: 'stand' | 'cheer') {
  const col = '#0a0812', u = h / 100;
  person(c, x, feet, h, pose, { col, t, seed, rim: '#ffb36a' });
  const hand = pose === 'cheer' ? feet - 108 * u : feet - 46 * u, lx = x + (pose === 'cheer' ? 22 * u : 12 * u);
  c.strokeStyle = col; c.lineWidth = 1.2 * u; c.beginPath(); c.moveTo(lx, hand); c.lineTo(lx, hand - 22 * u); c.stroke();
  lantern(c, g, lx, hand - 22 * u, 5.5 * u, t, seed);
}
