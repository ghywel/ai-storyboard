// NUMBER 1 (v1, 54.51-75.07, chorus 1, lines 14-18; TREATMENT-v1.md): the show's first production number, gold
// bulbs and a cyan sunburst, fast cuts. Then the tag's spotlight turns on the audience and finds who else is waiting.
//   N1 CAM 1 wide, the vote's last frame carried on: on the downbeat the kelp curtain whips open, the ring of bulbs
//      blazes round a cyan sunburst, the meter flies out, the octopus cues EVERYBODY!; STONE slams inside the ring;
//      the fish chorus line (top hats, gold bow ties) kicks across the front in unison; Rai hops on every beat.
//   N2 CAM 2: "nobody's seen me": peek-a-boo, both hands over her eyes, a peek, then out with a wink.
//   N3 CAM 3 low and wide: "everybody believes": the audience leaps up, fins high; BELIEVES slams.
//   N4 close in the spot, eyes closed, singing (soft).
//   N5 two-shot with the scoreboard: COUNT 1, 2, 3... it gives up: "?". On "see" her eyes pop: joy, a chibi pop.
//   N6 "who else is waiting": she points out at the house; the spot leaves her and swings into the stands.
//   N7 the sweep: the spot finds the sunken things in the seats, each with a TV tag: the anchor (B3), two old rai
//      stones with dim hearts (C2, D5), the diving helmet (D9), the ship's bell (B11). In the corner CAM 1 watches
//      her shade her eyes and follow it.
//   N8 the tag again: the spot stops on C7, a child's lunchbox, alone (PACKED AT 03:58); the house goes black.
//   N9 Rai on stage, serious, the ring's bulbs dying one by one to just her.
//   N10 the band's tail: a slow push-in on the lunchbox in its spot, dust drifting in the light.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../../engine/scene';
import { Layer2D, W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import type { Line } from '../../engine/lyrics';
import { clamp, ease, lerp } from '../../engine/util';
import { drawRai, h01, type Face, type ArmPose } from '../_rai';
import { rgbaHex, slam, TAU } from '../_motifs';
import { poof, star4 } from '../_manga';
import { mergePost, punch, hitShake, caKick } from '../_post';
import { SET, studio, studioFront, audience, seatPos, octopus, liveBug, camTag, micProp, type ScoreRow, type Spot, type Cam } from './_studio';
import { beatCut, wordOf, camOn, camMix, camClamp, shoot, toScreen, lyricBand, plateMask, seatTag, pip, hatFish, spotPool, featherSpot, applauseBubbles, NULL_G, type C2 } from './number-kit';
import { METER, OCT, applauseMeter, meterValue, clapsAt, octoUnsure, bigQ } from './vote-kit';

const R0 = 150;
const STAND = { x: W / 2, y: SET.floor - 1.07 * R0 };
const BURST: [string, string] = [HEX.cyan, '#1aa9d6'];
const CHORUS_COLS = [HEX.yellow, HEX.orange, HEX.peri, HEX.lime, HEX.pink, HEX.cyan, HEX.violet, HEX.coral];
/** The sunken things the sweep finds, with their tags (invented, like every number in this show). */
const FINDS = [
  { seat: ['B', 3] as const, a: 'B3 · ANCHOR', b: 'WAITING SINCE 1871', side: 1 },
  { seat: ['C', 2] as const, a: 'C2 · RAI STONE', b: 'LOST OVERBOARD 1843', side: 1 },
  { seat: ['D', 5] as const, a: 'D5 · RAI STONE', b: 'SUNK 1902 · STILL OWNED', side: 1 },
  { seat: ['D', 9] as const, a: 'D9 · DIVING HELMET', b: 'LAST DIVE 1936', side: -1 },
  { seat: ['B', 11] as const, a: "B11 · SHIP'S BELL", b: 'RANG LAST 1888', side: -1 },
];
const occ = (row: string, col: number) => { const p = seatPos(row, col); return { x: p.x, y: p.y - 30 * p.s, s: p.s }; };

export default class Number1 extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  all: Line[] = [];
  k: Record<string, number> = {};
  cuts: number[] = [];
  vote = { worth: 0, what: 0, say: 0, c8: 0, me: 0 };
  sweep: { t: number; x: number; y: number }[] = [];

  override init() {
    const { lyrics, audio: au, start, end } = this.ctx;
    this.all = lyrics.lines;
    const ln = lyrics.lines.filter((l) => l.words[0]!.start >= start - 0.1 && l.words[0]!.start < end);
    const [l14, l15, l16, l17, l18] = ln as [Line, Line, Line, Line, Line];
    const w = (l: Line, s: string, n = 0) => wordOf(l, s, n).start;
    // the vote's props carried over the cut (its meter, its octopus): the same times the vote uses
    const i14 = lyrics.lines.indexOf(l14), l12 = lyrics.lines[i14 - 2]!, l13 = lyrics.lines[i14 - 1]!;
    this.vote = { worth: w(l12, 'worth'), what: w(l12, 'what'), say: w(l12, 'say'), me: w(l13, 'me'),
      c8: beatCut(au, (w(l13, 'saying') + w(l13, 'about')) / 2) };
    const k: Record<string, number> = {
      open: au.downbeats.find((d) => d > start + 0.05) ?? start + 0.43,
      stone: w(l14, 'stone'), bottom: w(l14, 'bottom'), sea: w(l14, 'sea'),
      nobody: l15.words[0]!.start, seen: w(l15, 'seen'), me: w(l15, 'me'), everybody: w(l15, 'everybody'), believes: w(l15, 'believes'),
      count: w(l16, 'count'), you2: w(l16, 'you', 1), cant: w(l16, "can't"), even: w(l16, 'even'), see: w(l16, 'see'),
      who: l17.words[0]!.start, sea17: w(l17, 'sea'),
      who2: l18.words[0]!.start, waiting2: w(l18, 'waiting'), bottom2: w(l18, 'bottom'),
    };
    k.c2 = beatCut(au, l15.words[0]!.start);            // CAM 2 peek-a-boo
    k.c3 = beatCut(au, k.everybody!);                    // CAM 3 the audience leaps
    k.c4 = beatCut(au, l16.words[0]!.start);            // the close, eyes closed
    k.c5 = beatCut(au, k.you2!);                         // the two-shot with the scoreboard
    k.c6 = beatCut(au, l17.words[0]!.start);            // she points; the spot leaves her
    k.c7 = au.timeOfBeat(Math.round(au.beatAt(k.c6)) + 1); // the sweep
    k.c8 = beatCut(au, l18.words[0]!.start);            // C7
    k.c9 = beatCut(au, w(l18, 'at') - 0.4);             // Rai, serious
    k.c10 = beatCut(au, w(l18, 'of'));                   // the push-in on the lunchbox
    this.k = k;
    this.cuts = [start, k.c2!, k.c3!, k.c4!, k.c5!, k.c6!, k.c7!, k.c8!, k.c9!, k.c10!];
    // the sweep's path over the stands: each find held a moment, then on to C7 on the tag's "who"
    const S = (row: string, col: number) => { const o = occ(row, col); return { x: o.x, y: o.y }; };
    const holds = [k.c7! + 0.22, k.c7! + 0.78, k.c7! + 1.34, k.c7! + 1.9, k.c7! + 2.5];
    this.sweep = [{ t: k.c7!, x: W * 0.5, y: H * 1.05 }];
    FINDS.forEach((fd, i) => { const p = S(fd.seat[0], fd.seat[1]); this.sweep.push({ t: holds[i]!, ...p }, { t: holds[i]! + 0.3, ...p }); });
    const c7 = S('C', 7);
    this.sweep.push({ t: k.who2!, ...c7 });
  }

  /** The spot's place on the stands at t (eased between holds). */
  spotAt(t: number) {
    const S = this.sweep;
    if (t <= S[0]!.t) return { x: S[0]!.x, y: S[0]!.y };
    for (let i = 1; i < S.length; i++) {
      if (t <= S[i]!.t) {
        const a = S[i - 1]!, b = S[i]!, u = ease.inOutCubic((t - a.t) / Math.max(1e-6, b.t - a.t));
        return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) };
      }
    }
    return { x: S[S.length - 1]!.x, y: S[S.length - 1]!.y };
  }

  rai(c: C2, x: number, y: number, R: number, t: number, o: Partial<Parameters<typeof drawRai>[4]> & { face: Face; arms: ArmPose | [ArmPose, ArmPose] }, side: -1 | 1 = 1) {
    return drawRai(c, x, y, R, { t, glow: HEX.bone, glowStrength: 0.8, prop: { side, draw: micProp }, ...o });
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, audio: au } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t, k = this.k;
    this.L.clear(HEX.ink); this.G.clear();
    const shot = Math.max(0, this.cuts.filter((x) => t >= x).length - 1), s0 = this.cuts[shot]!, lt = t - s0;
    let post: PostOverrides = { bloom: 0.75 };
    const open = k.open!, opened = t >= open;
    const bp = ((au.beatAt(t) % 1) + 1) % 1;                      // the beat's phase
    const kick = bp < 0.38 ? Math.sin((Math.PI * bp) / 0.38) : 0;  // a hop, once a beat
    const swing = Math.sin(Math.PI * au.beatAt(t) * 0.5);           // the spots swing over two beats
    const show = (o: { house?: number; spotsA?: number } = {}) => ({
      curtain: clamp((t - open) / 0.38), ring: opened ? clamp((t - open) / 0.08) : 0, burst: BURST, sign: opened ? 1 : 0.35,
      onAir: true, house: opened ? o.house ?? 0.78 : 0.42, cue: opened ? 'EVERYBODY!' as const : 'APPLAUSE' as const, cueT0: opened ? open : open - 9,
      score: [{ text: '?', col: HEX.yellow }] as ScoreRow[],
      spots: opened ? [
        { x: W * 0.5 - 260 * swing, col: HEX.pink, a: o.spotsA ?? 1, r: 160 },
        { x: W * 0.5 + 150 * swing, col: HEX.yellow, a: o.spotsA ?? 1, r: 150 },
        { x: W * 0.5 + 260 * swing, col: HEX.cyan, a: o.spotsA ?? 1, r: 160 },
        { x: W * 0.5 - 150 * swing, col: HEX.bone, a: o.spotsA ?? 1, r: 150 },
      ] as Spot[] : [{ x: W * 0.3, col: HEX.pink, a: 0.5, r: 160 }, { x: STAND.x, col: '#ffcf8a', a: 1.1, r: 165 }, { x: W * 0.7, col: HEX.cyan, a: 0.5, r: 160 }] as Spot[],
    });

    if (shot === 0) {
      // N1: the curtain opens on the downbeat; the chorus line; STONE in the ring
      const cam = camMix(camOn(W / 2, H / 2, 1), camOn(W / 2, H / 2 - 14, 1.05), ease.inOutQuad(clamp((t - open) / (k.c2! - open))));
      shoot(c, g, cam, () => {
        studio(c, g, t, show());
        // the meter flies out as the number starts
        const my = METER.y - 520 * ease.inCubic(clamp((t - open) / 0.45));
        if (my > -150) applauseMeter(c, g, METER.x, my, METER.r, t, meterValue(t, this.vote), clapsAt(t, this.vote));
        if (!opened) octoUnsure(c, g, t, this.vote.c8, false);
        else octopus(c, g, OCT.x, OCT.y, 1, t, { card: 'EVERYBODY!', cardT0: open });
        bigQ(c, t, this.vote.me, open);
        slam(c, 'STONE', W / 2, 226, 150, t, k.stone!, { col: HEX.ink, shadow: HEX.bone, shadowOff: 0.05, rot: -0.03, t1: k.c2! + 1, exit: 0.1 });
        const seaHop = t >= k.sea! && t < k.sea! + 0.5 ? 0.45 * Math.sin((Math.PI * (t - k.sea!)) / 0.5) : 0;
        const hop = opened ? Math.max(0.2 * kick, seaHop) : 0;
        this.rai(c, STAND.x, STAND.y, R0, t, {
          face: opened ? (t >= k.sea! ? 'joy' : t >= k.bottom! && t < k.bottom! + 0.4 ? 'grin' : 'joy') : 'sassy',
          arms: opened ? (t >= k.bottom! && t < k.bottom! + 0.45 ? ['down', 'down'] : ['up', 'up']) : ['hip', 'reach'],
          armsFrom: opened ? ['hip', 'reach'] : undefined, armsU: opened ? clamp((t - open) / 0.15) : 1,
          hop, squash: opened && hop < 0.02 ? -0.22 : opened ? 0.08 : 0, tilt: opened ? 0.05 * swing : -0.06, heart: 0.5,
          marks: opened ? ['sparkle'] : [], markT0: t >= k.sea! ? k.sea! : open + 0.1,
        });
        this.chorusLine(c, t, kick);
        studioFront(c, g, t, { crowd: 1, mood: opened ? 'cheer' : 'calm' });
      });
      liveBug(c, g, t);
      post = mergePost(post, punch(t, [open], 0.04, 0.4), punch(t, [k.stone!, k.sea!], 0.022), hitShake(t, [open], 6, 0.34), caKick(t, [open], 5, 0.3),
        t >= open && t < open + 0.05 ? { flash: 0.35 * (1 - (t - open) / 0.05) } : {});
    } else if (shot === 1) {
      // N2: peek-a-boo: "nobody's seen me"
      const cam = camMix(camOn(W / 2, 470, 1.72), camOn(W / 2, 462, 1.8), ease.inOutQuad(clamp(lt / (k.c3! - s0))));
      const hide = t >= k.nobody! && t < k.me!, peek = t >= k.seen! + 0.12 && t < k.me!, out = t >= k.me!;
      shoot(c, g, cam, () => {
        studio(c, g, t, show());
        this.rai(c, STAND.x, STAND.y, R0, t, {
          face: out ? 'wink' : peek ? 'cheeky' : hide ? 'grin' : 'joy',
          arms: out ? ['up', 'wave'] : peek ? ['hip', 'cheek'] : hide ? ['hip', 'facepalm'] : ['up', 'up'],
          armsFrom: out ? ['hip', 'cheek'] : peek ? ['hip', 'facepalm'] : hide ? ['up', 'up'] : undefined, armsU: clamp((t - (out ? k.me! : peek ? k.seen! + 0.12 : k.nobody!)) / 0.14),
          hop: out ? 0.18 * kick : 0, squash: hide && !peek ? -0.12 : 0, tilt: peek ? 0.12 : out ? -0.06 : 0, heart: 0.5,
          marks: out ? ['shine'] : peek ? ['sweat'] : [], markT0: out ? k.me! : k.seen! + 0.15,
        }, -1);
      });
      camTag(c, 'CAM 2', t, s0);
      liveBug(c, g, t);
      post = mergePost(post, punch(t, [k.me!], 0.02));
    } else if (shot === 2) {
      // N3: CAM 3 low and wide: everybody believes: the house on its feet
      const cam = camClamp(camMix(camOn(W / 2, 640, 1.2, -0.035), camOn(W / 2, 545, 1.12, -0.012), ease.inOutQuad(clamp(lt / (k.c4! - s0)))));
      shoot(c, g, cam, () => {
        audience(c, g, t, { mood: t >= k.everybody! ? 'cheer' : 'gasp' });
      });
      applauseBubbles(c, t, 0, W, 0.9, 23);
      slam(c, 'BELIEVES', W / 2, 190, 220, t, k.believes!, { col: HEX.gold, shadow: HEX.ink, rot: -0.04 });
      camTag(c, 'CAM 3', t, s0);
      liveBug(c, g, t);
      post = mergePost(post, punch(t, [k.believes!], 0.03), hitShake(t, [k.believes!], 5, 0.3));
    } else if (shot === 3) {
      // N4: the close, eyes closed, singing
      const cam = camMix(camOn(W / 2, 452, 2.2), camOn(W / 2, 446, 2.34), ease.inOutQuad(clamp(lt / (k.c5! - s0))));
      shoot(c, g, cam, () => studio(c, g, t, show({ house: 0.6, spotsA: 0 })));
      spotPool(c, W / 2, H * 0.42, 420, 0.55);
      shoot(c, g, cam, () => {
        this.rai(c, STAND.x, STAND.y, R0, t, {
          face: 'asleep', arms: ['hold', 'chin'], armsFrom: ['up', 'up'], armsU: clamp(lt / 0.25), tilt: 0.06 * Math.sin(t * 1.6), heart: 0.7,
          heartColor: HEX.cyan, noBlink: true,
        });
      });
      this.sparkles(c, t, 9);
      liveBug(c, g, t);
    } else if (shot === 4) {
      // N5: two-shot with the scoreboard: it counts 1, 2, 3... and gives up: "?". On "see" her eyes pop.
      const cam = camMix(camOn(600, 430, 1.5), camOn(610, 424, 1.56), ease.inOutQuad(clamp(lt / (k.c6! - s0))));
      const n = t >= k.see! ? 4 : t >= k.even! ? 3 : t >= k.cant! ? 2 : 1;
      const score: ScoreRow[] = n === 4 ? [{ text: '?', col: HEX.yellow }] : [{ text: 'COUNT', col: HEX.bone }, { text: String(n), col: HEX.lime }];
      const popped = t >= k.see!, sd = popped && t < k.see! + 0.5;
      shoot(c, g, cam, () => {
        studio(c, g, t, { ...show({ house: 0.66 }), score });
        this.rai(c, STAND.x, STAND.y, R0, t, {
          face: popped ? 'joy' : 'asleep', arms: popped ? ['up', 'up'] : ['hold', 'chin'], armsFrom: ['hold', 'chin'], armsU: clamp((t - k.see!) / 0.12),
          sd, hop: popped && !sd ? 0.22 * kick : 0, heart: popped ? 0.9 : 0.6, heartColor: HEX.cyan, noBlink: !popped,
          marks: popped ? ['sparkle'] : [], markT0: k.see!, tilt: popped ? 0 : 0.05 * Math.sin(t * 1.6),
        });
        poof(c, STAND.x, STAND.y - 60, 220, t, k.see!);
        poof(c, STAND.x, STAND.y - 60, 220, t, k.see! + 0.5);
      });
      liveBug(c, g, t);
      post = mergePost(post, punch(t, [k.see!], 0.035));
    } else if (shot === 5) {
      // N6: she points out at the house; the spot leaves her and swings off the stage towards us
      const u = ease.inCubic(clamp((t - k.who! + 0.05) / (k.c7! - k.who! + 0.05)));
      const cam = camMix(camOn(W / 2, 520, 1.25), camOn(W / 2, 540, 1.3), clamp(lt / (k.c7! - s0)));
      shoot(c, g, cam, () => {
        const o = show({ house: 0.45, spotsA: 0.4 });
        o.ring = 0.75;
        o.spots = [{ x: W * 0.5, y: lerp(SET.floor, H * 1.4, u), col: '#fff6dc', a: 1.2, r: lerp(160, 320, u) }];
        studio(c, g, t, o);
        this.rai(c, STAND.x, STAND.y, R0, t, {
          face: t >= k.who! ? 'wow' : 'joy', arms: ['hip', 'point'], armsFrom: ['up', 'up'], armsU: clamp(lt / 0.12), heart: 0.5, look: 0.3, tilt: -0.05,
          marks: ['!'], markT0: k.who! + 0.05,
        });
        studioFront(c, g, t, { crowd: 1, mood: 'calm' });
      });
      liveBug(c, g, t);
    } else if (shot === 6 || shot === 7) {
      // N7 the sweep over the stands / N8 the lunchbox in C7, alone
      const sp = this.spotAt(t), c7 = occ('C', 7);
      const fin = shot === 7 ? ease.inOutCubic(clamp((t - k.who2!) / (k.c9! - k.who2!))) : 0;
      let cam: Cam = camClamp({ ...camOn(sp.x, sp.y + 40, 1.32) });
      if (shot === 7) cam = camClamp(camMix(camClamp(camOn(sp.x, sp.y + 40, 1.32)), camOn(c7.x, c7.y + 20, 1.75), fin));
      const dim = shot === 7 ? lerp(0.86, 0.97, clamp((t - k.who2!) / 0.8)) : 0.86;
      const r = shot === 7 ? lerp(150, 122, clamp((t - k.who2!) / 1.2)) : 150;
      shoot(c, g, cam, () => {
        audience(c, NULL_G, t, { mood: 'calm', dim, spot: { x: sp.x, y: sp.y + 10, r } });
        featherSpot(c, sp.x, sp.y + 10, r, 0.75 * dim);
        this.spotGlow(g, sp.x, sp.y + 10, r * 0.8);
        // the old stones' dim hearts brighten a little in the light
        for (const fd of FINDS.slice(1, 3)) {
          const o = occ(fd.seat[0], fd.seat[1]), d = Math.hypot(o.x - sp.x, o.y - sp.y), a = clamp(1 - d / 120);
          if (a > 0) { g.fillStyle = rgbaHex(HEX.pink, 0.35 * a); g.beginPath(); g.arc(o.x, o.y + 2, 26 * o.s, 0, TAU); g.fill(); }
        }
      });
      // the tags
      if (shot === 6) {
        FINDS.forEach((fd, i) => {
          const o = occ(fd.seat[0], fd.seat[1]), p = toScreen(cam, o.x, o.y), ta = this.sweep[1 + 2 * i]!.t;
          seatTag(c, p.x, p.y, fd.a, fd.b, t, ta - 0.04, ta + 0.42, fd.side);
        });
        // CAM 1 in the corner: Rai shading her eyes, following the spot
        const look = clamp((sp.x - W / 2) / 600, -1, 1);
        pip(c, g, W - 470, 56, 400, 225, t, 'CAM 1', clamp((t - k.c7! - 0.1) / 0.15), () => {
          shoot(c, g, camOn(W / 2, 455, 1.7), () => {
            studio(c, g, t, { ...show({ house: 0.4, spotsA: 0 }), ring: 0.6 });
            this.rai(c, STAND.x, STAND.y, R0, t, { face: 'wow', arms: ['hip', 'facepalm'], look, tilt: -0.08 * look, heart: 0.5, noBlink: true }, -1);
          });
        });
      } else {
        const p = toScreen(cam, c7.x, c7.y);
        seatTag(c, p.x, p.y, 'C7 · LUNCHBOX', 'PACKED AT 03:58', t, k.who2! + 0.5, k.c9! - 0.3, -1);
      }
      liveBug(c, g, t);
    } else if (shot === 8) {
      // N9: Rai on stage, serious; the ring's bulbs die one by one to just her
      const u = clamp(lt / (k.c10! - s0));
      const cam = camMix(camOn(W / 2, 470, 1.85), camOn(W / 2, 462, 1.98), ease.inOutQuad(u));
      shoot(c, g, cam, () => {
        const o = show({ house: lerp(0.4, 0.15, u), spotsA: 0 });
        o.ring = lerp(0.85, 0.12, u); o.sign = 1 - u;
        o.spots = [];
        studio(c, g, t, o);
      });
      spotPool(c, W / 2, H * 0.44, 380, lerp(0.45, 0.75, u));
      shoot(c, g, cam, () => {
        this.rai(c, STAND.x, STAND.y, R0, t, { face: 'serious', arms: ['down', 'hold'], armsFrom: ['hip', 'point'], armsU: clamp(lt / 0.3), heart: 0.35, look: 0.25, tilt: 0.03 });
      });
      liveBug(c, g, t);
    } else {
      // N10: the slow push-in on the lunchbox, alone in its spot
      const c7 = occ('C', 7), u = clamp(lt / (this.ctx.end - s0));
      const cam = camMix(camOn(c7.x, c7.y + 18, 2.3), camOn(c7.x, c7.y + 4, 3.5), ease.inOutQuad(u));
      shoot(c, g, cam, () => {
        audience(c, NULL_G, t, { mood: 'calm', dim: 1, spot: { x: c7.x, y: c7.y + 10, r: 112 } });
        // darker than the house's own dimmer goes: only the seat
        c.fillStyle = 'rgba(3,2,8,0.62)'; c.beginPath(); c.rect(-W, -H, W * 3, H * 3); c.arc(c7.x, c7.y + 10, 116, 0, TAU, true); c.fill('evenodd');
        featherSpot(c, c7.x, c7.y + 10, 114, 0.9);
        this.spotGlow(g, c7.x, c7.y + 10, 90);
        // dust drifting in the light
        for (let i = 0; i < 26; i++) {
          const a = h01(i, 61) * TAU, d = Math.sqrt(h01(i, 62)) * 100, x = c7.x + Math.cos(a) * d + 6 * Math.sin(t * 0.7 + i);
          const y = c7.y + 10 + Math.sin(a) * d - ((t * 6 + i * 13) % 40) + 20;
          c.fillStyle = `rgba(255,240,210,${0.25 + 0.3 * h01(i, 63)})`; c.beginPath(); c.arc(x, y, 0.8 + 1.2 * h01(i, 64), 0, TAU); c.fill();
        }
      });
    }

    lyricBand(c, this.all, t, this.ctx.start, this.ctx.end);
    plateMask(g, this.all, t, this.ctx.start, this.ctx.end);
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    return mergePost(post, { zoom: 1 + (shot < 5 ? 0.01 : 0.003) * f.a.kick });
  }

  /** The fish chorus line: top hats and bow ties, kicking across the front of the stage in unison. */
  chorusLine(c: C2, t: number, kick: number) {
    const t0 = this.k.stone! - 0.15, n = 8;
    if (t < t0) return;
    const lead = -140 + (t - t0) * 820;
    for (let i = 0; i < n; i++) {
      const x = lead - i * 128;
      if (x < -120 || x > W + 120) continue;
      hatFish(c, x, 806 - 18 * kick, 42, CHORUS_COLS[i % CHORUS_COLS.length]!, t, i, kick);
    }
  }

  /** The spotlight's pool of light on the stands (the house glow is off). */
  spotGlow(g: C2, x: number, y: number, r: number) {
    const sg = g.createRadialGradient(x, y, 0, x, y, r);
    sg.addColorStop(0, rgbaHex('#ffd9a0', 0.06)); sg.addColorStop(1, rgbaHex('#ffd9a0', 0));
    g.fillStyle = sg; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }

  /** Bokeh sparkles from the ring drifting past a close shot. */
  sparkles(c: C2, t: number, seed: number) {
    for (let i = 0; i < 14; i++) {
      const x = h01(i, seed, 1) * W, y = (h01(i, seed, 2) * H - t * 30 * (0.5 + h01(i, seed, 3))) % H;
      star4(c, x, (y + H) % H, 6 + 10 * h01(i, seed, 4), `rgba(255,236,170,${0.25 + 0.35 * Math.abs(Math.sin(t * 2 + i))})`);
    }
  }
}
