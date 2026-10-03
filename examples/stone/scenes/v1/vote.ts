// VOTE (v1, 40.80-54.51, pre-chorus 1, lines 10-13; TREATMENT-v1.md): the brightest section of the take. The show's
// lights drop to one warm spot and Rai sits on the edge of the stage, mic in her lap: sincere, then playful.
//   V1 CAM 1 wide: the set as the twist left it (lit, NET WORTH: AGREED). On "'Cause" the spots clunk off one by one,
//      the sign dies right to left, the house falls; Rai drops her Rich-List pose, hops down and sits on the lip, the
//      warm spot finds her, the crane eases in.
//   V2 CAM 2 close: "never really stone": on "stone" her outline flickers into tiny glowing words, the island's
//      sayings about her (rim, head and heart), then back. Soft, then a small knowing smile.
//   V3 CAM 3 the audience: on "story" the scorecards pop up in a wave, glowing, with tiny pictures instead of numbers
//      (a raft with the pole through the stone, a wedding garland, a handshake, a storm). C7's lunchbox holds none;
//      C8, the violet fish beside it, holds up a heart (it hugs the lunchbox in chorus 2).
//   V4 over their heads: the cards' backs held up to her; on "keep" her heart lights; she smiles.
//   V5 two-shot: on "worth" the applause meter (the S.S. IRON HULL's engine telegraph, relabelled APPLAUSE) drops
//      from the flies on its chains; Rai cheeky, a hand to her ear; bubbles of applause begin.
//   V6 crash zoom on the meter: "what you say": the needle climbs MEH NICE OOH WOW to !!!; the claps counter rolls.
//   V7 the lean: "so what are you saying": she leans out over the front row, mic held out to them, sassy, "?".
//   V8 the octopus in the wings with YES and NO, unsure, a sweat drop (behind him the trader's rusted nameplate).
//   V9 CAM 1 wide (number1 opens on the same frame): on "me?" a giant "?" slams, the scoreboard flips to "?", the
//      needle wobbles at the top.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../../engine/scene';
import { Layer2D, W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import type { Line } from '../../engine/lyrics';
import { clamp, ease, lerp, frameIdx } from '../../engine/util';
import { drawRai, type Face, type ArmPose } from '../_rai';
import { rgbaHex, FAM } from '../_motifs';
import { mergePost, punch, hitShake } from '../_post';
import { SET, studio, studioFront, audience, seatPos, seatKind, liveBug, camTag, micProp, type Spot } from './_studio';
import { beatCut, wordOf, camOn, camMix, camClamp, shoot, toScreen, lyricBand, plateMask, frontRow, applauseBubbles, spotPool, beam, lampLure, type C2 } from './number-kit';
import { METER, OCT, NET_WORTH, applauseMeter, meterValue, clapsAt, scorecard, PICS, outlineWords, houseAt, octoUnsure, bigQ, type Pic } from './vote-kit';
import { font } from '../../engine/type';
import { h01 } from '../_rai';

const R0 = 150;                                   // Rai's disc radius on the set
const LIP = H * 0.77;                             // the stage's front edge
const SIT = { x: W / 2, y: LIP - 0.8 * R0 };     // sitting on the lip, her feet over the edge
const STAND = { x: W / 2, y: SET.floor - 1.07 * R0 };
const WARM = '#ffc28c';

export default class Vote extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  all: Line[] = [];
  ln: Line[] = [];
  k: Record<string, number> = {};
  cuts: number[] = [];

  override init() {
    const { lyrics, audio: au, start, end } = this.ctx;
    this.all = lyrics.lines;
    this.ln = lyrics.lines.filter((l) => l.words[0]!.start >= start - 0.1 && l.words[0]!.start < end);
    const [l10, l11, l12, l13] = this.ln as [Line, Line, Line, Line];
    const w = (l: Line, s: string) => wordOf(l, s).start;
    const k = {
      drop: l10.words[0]!.start, never: w(l10, 'never'), stone: w(l10, 'stone'),
      story: w(l11, 'story'), keep: w(l11, 'keep'),
      worth: w(l12, 'worth'), exactly: w(l12, 'exactly'), what: w(l12, 'what'), say: w(l12, 'say'),
      saying: w(l13, 'saying'), about: w(l13, 'about'), me: w(l13, 'me'),
    } as Record<string, number>;
    k.c2 = beatCut(au, w(l10, 'really'));          // CAM 2 close on "really"
    k.c3 = beatCut(au, l11.words[0]!.start);        // the audience
    k.c4 = beatCut(au, w(l11, 'you'));              // over their heads
    k.c5 = beatCut(au, l12.words[0]!.start);        // the meter flies in
    k.c6 = beatCut(au, k.what!);                    // crash zoom on the meter
    k.c7 = beatCut(au, l13.words[0]!.start);        // the lean
    k.c8 = beatCut(au, (k.saying! + k.about!) / 2); // the octopus
    k.c9 = beatCut(au, k.me!);                      // the wide and the "?"
    this.k = k;
    this.cuts = [start, k.c2!, k.c3!, k.c4!, k.c5!, k.c6!, k.c7!, k.c8!, k.c9!];
  }

  /** Rai with her mic. */
  rai(c: C2, x: number, y: number, R: number, t: number, o: Partial<Parameters<typeof drawRai>[4]> & { face: Face; arms: ArmPose | [ArmPose, ArmPose] }, side: -1 | 1 = 1) {
    return drawRai(c, x, y, R, { t, glow: WARM, glowStrength: 0.55, prop: { side, draw: micProp }, ...o });
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t, k = this.k;
    this.L.clear(HEX.ink); this.G.clear();
    const shot = Math.max(0, this.cuts.filter((x) => t >= x).length - 1), s0 = this.cuts[shot]!, lt = t - s0;
    let post: PostOverrides = { bloom: 0.6 };
    const mk = { worth: k.worth!, what: k.what!, say: k.say! };
    const needle = meterValue(t, mk), claps = clapsAt(t, mk);
    const meterDrop = (tt: number) => { // the meter on its chains: flown in on "worth" with a bounce
      const u = clamp((tt - k.worth! + 0.05) / 0.42);
      return u <= 0 ? -1 : METER.y - 470 * (1 - ease.outBack(u, 2.2));
    };
    const meter = (cc: C2, gg: C2) => { const my = meterDrop(t); if (my > -900 && t >= k.worth! - 0.05) applauseMeter(cc, gg, METER.x, my, METER.r, t, needle, claps); };
    const score = t >= k.me! ? [{ text: '?', col: HEX.yellow }] : NET_WORTH;

    if (shot === 0) {
      // V1: the lights drop; she sits on the lip; the crane eases in
      const drop = k.drop!, house = houseAt(t, drop);
      const spots: Spot[] = [
        { x: W * 0.38 + 60 * Math.sin(t * 1.3), col: HEX.pink, a: t < drop ? 1 : 0 },
        { x: SIT.x, y: LIP - 44, col: WARM, a: 0 },  // lamp 1 lit; its beam is drawn behind her (beam())
        { x: W * 0.62 + 60 * Math.sin(t * 1.1 + 1), col: HEX.cyan, a: t < drop + 0.11 ? 1 : 0 },
        { x: W * 0.5 + 90 * Math.sin(t * 0.9 + 2), col: HEX.yellow, a: t < drop + 0.22 ? 1 : 0 },
      ];
      const sign = t < drop ? 1 : 1 - clamp((t - drop) / 0.45);
      const cam = camMix(camOn(W / 2, H / 2, 1), camOn(W / 2, 600, 1.32), ease.inOutCubic(clamp((t - drop - 0.35) / (k.c2! - drop - 0.35))));
      shoot(c, g, cam, () => {
        studio(c, g, t, { curtain: 0, ring: 0, sign, onAir: true, house, spots, score, cue: t < drop ? 'APPLAUSE' : null, cueT0: s0 - 2 });
      });
      const sp = toScreen(cam, SIT.x, SIT.y - 90);
      spotPool(c, sp.x, sp.y, 300 * sp.s, 0.72 * clamp((t - drop) / 0.5));
      shoot(c, g, cam, () => {
        const ll = lampLure(1);
        beam(c, ll.x, ll.y, SIT.x, LIP - 46, 175, WARM, t < drop ? 0 : clamp((t - drop - 0.28) / 0.3) * 1.15);
        // the hop down to the lip
        const u = clamp((t - drop - 0.12) / 0.36), arc = Math.sin(Math.PI * u) * 0.32;
        const x = lerp(STAND.x, SIT.x, u), y = lerp(STAND.y, SIT.y, ease.inOutQuad(u));
        const land = clamp((t - drop - 0.48) / 0.2);
        this.rai(c, x, y, R0, t, {
          face: t < drop ? 'joy' : u < 1 ? 'smile' : 'soft', arms: t < drop ? ['up', 'hip'] : u < 1 ? ['down', 'down'] : ['hold', 'hold'],
          armsFrom: t < drop ? undefined : u < 1 ? ['up', 'hip'] : ['down', 'down'], armsU: t < drop ? 1 : u < 1 ? clamp(u * 3) : clamp((t - drop - 0.48) / 0.25),
          hop: arc, squash: u > 0 && u < 1 ? 0.15 : land > 0 && land < 1 ? -0.25 * Math.sin(Math.PI * land) : 0,
          heart: 0.3, look: 0, tilt: u >= 1 ? 0.03 * Math.sin(t * 1.4) : 0,
          marks: t < drop ? ['sparkle'] : [], markT0: s0 - 1,
        });
        studioFront(c, g, t, { crowd: 1, mood: 'calm' });
      });
      // the spots dying one by one: a little comic KLUNK at each lamp
      [0, 2, 3].forEach((li, j) => {
        const tk = drop + 0.11 * j, a = clamp(1 - (t - tk) / 0.45);
        if (t < tk || a <= 0) return;
        const ll = lampLure(li), p = toScreen(cam, ll.x + 40, ll.y + 70);
        c.save(); c.globalAlpha *= a; c.translate(p.x, p.y + 10 * (t - tk)); c.rotate(-0.15 + 0.12 * j);
        c.font = font(FAM.hook(), 34); c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = HEX.ink; c.fillText('KLUNK', 3, 3); c.fillStyle = HEX.bone; c.fillText('KLUNK', 0, 0);
        c.restore();
      });
      liveBug(c, g, t);
    } else if (shot === 1) {
      // V2: the close-up; her outline flickers into words on "stone"
      const cam = camMix(camOn(W / 2, 600, 2.12), camOn(W / 2, 592, 2.26), ease.inOutQuad(clamp(lt / (k.c3! - s0))));
      shoot(c, g, cam, () => {
        studio(c, g, t, { curtain: 0, ring: 0, sign: 0, onAir: true, house: 0.1, score });
      });
      spotPool(c, W / 2, H * 0.45, 360, 0.88);
      this.warmLight(g, W / 2, H * 0.42, 480);
      const st = k.stone!, dt = t - st, fi = frameIdx(t);
      // the flicker: on and off in the first quarter second, held, then flickering back
      let words = 0;
      if (dt >= 0 && dt < 0.26) words = fi % 3 === 0 ? 0 : 1;
      else if (dt >= 0.26 && dt < 1.0) words = 1;
      else if (dt >= 1.0 && dt < 1.24) words = fi % 3 === 1 ? 1 : 0;
      shoot(c, g, cam, () => {
        c.save(); c.globalAlpha = words ? 0.12 : 1;
        this.rai(c, SIT.x, SIT.y, R0, t, {
          face: dt < -0.05 ? 'soft' : dt < 1.24 ? 'wow' : 'smile', arms: ['hold', 'hold'], heart: 0.25 + 0.4 * words,
          look: dt < 0 ? -0.2 : 0, tilt: 0.04 * Math.sin(t * 1.3), blush: dt > 1.24 ? 0.5 : 0, noBlink: words > 0,
        });
        c.restore();
        outlineWords(c, g, SIT.x, SIT.y, R0, t, words);
      });
      camTag(c, 'CAM 2', t, s0);
      liveBug(c, g, t);
    } else if (shot === 2) {
      // V3: the audience holds up scorecards of stories
      const cam = camClamp(camMix(camOn(700, 560, 1.42), camOn(1180, 520, 1.48), ease.inOutQuad(clamp(lt / (k.c4! - s0)))));
      shoot(c, g, cam, () => {
        audience(c, g, t, { mood: 'calm', dim: 0.32 });
        // the stage's warm light spilling up the stands
        const wg = c.createLinearGradient(0, H, 0, H * 0.3);
        wg.addColorStop(0, 'rgba(255,170,90,0.16)'); wg.addColorStop(1, 'rgba(255,170,90,0)');
        c.fillStyle = wg; c.fillRect(0, 0, W, H);
        this.cards(c, g, t);
      });
      camTag(c, 'CAM 3', t, s0);
    } else if (shot === 3) {
      // V4: over their heads, the cards' backs held up to her; "keep" lights her heart
      const cam = camMix(camOn(W / 2, 585, 1.5), camOn(W / 2, 575, 1.58), ease.inOutQuad(clamp(lt / (k.c5! - s0))));
      const keep = clamp((t - k.keep!) / 0.35);
      shoot(c, g, cam, () => {
        studio(c, g, t, { curtain: 0, ring: 0, sign: 0, onAir: true, house: 0.16, score });
      });
      spotPool(c, W / 2, H * 0.42, 420, 0.8);
      this.warmLight(g, W / 2, H * 0.4, 500);
      shoot(c, g, cam, () => {
        this.rai(c, SIT.x, SIT.y, R0, t, {
          face: keep > 0.2 ? 'soft' : 'smile', arms: keep > 0 ? ['hold', 'cheek'] : ['hold', 'hold'], armsFrom: ['hold', 'hold'], armsU: keep,
          heart: 0.25 + 0.75 * keep, heartColor: HEX.pink, blush: 0.6 * keep, look: 0, tilt: -0.05 * keep,
        }, -1);
      });
      frontRow(c, t, (i) => ease.outBack(clamp((t - s0 + 0.15 - 0.05 * i) / 0.25)), (i, x, y) => scorecard(c, g, x, y - 40, 1.3, 'back', t, 0.12 * Math.sin(t * 2 + i)), { rim: WARM, xs: [110, 420, 1500, 1810] });
      liveBug(c, g, t);
    } else if (shot === 4 || shot === 5) {
      // V5 two-shot (the meter drops in, Rai cheeky, a hand to her ear) / V6 the crash zoom on the meter
      const twoShot = camMix(camOn(1180, 455, 1.55), camOn(1195, 448, 1.63), ease.inOutQuad(clamp(lt / 1.8)));
      const cam = shot === 4 ? twoShot : camMix(camOn(1195, 448, 1.63), camOn(METER.x + 44, METER.y + 40, 3.0), ease.outCubic(clamp((t - k.c6!) / 0.16)));
      const zoomDrift = shot === 5 ? 1 + 0.04 * clamp((t - k.c6! - 0.16) / 1.2) : 1;
      cam.zoom = (cam.zoom ?? 1) * zoomDrift;
      const ear = clamp((t - k.exactly! + 0.1) / 0.2);
      shoot(c, g, cam, () => {
        studio(c, g, t, { curtain: 0, ring: 0, sign: 0.15, onAir: true, house: 0.24, score, cue: t >= k.exactly! ? 'APPLAUSE' : null, cueT0: k.exactly!,
          spots: [{ x: -400, a: 0 }, { x: STAND.x, col: WARM, a: 1.1, r: 165 }, { x: METER.x, y: SET.floor, col: HEX.pink, a: 0.6, r: 140 }] });
        const hopIn = clamp((t - k.c5!) / 0.25);
        this.rai(c, STAND.x, STAND.y, R0, t, {
          face: t < k.exactly! - 0.1 ? 'grin' : 'cheeky', arms: ['hip', ear > 0 ? 'cheek' : 'down'], armsFrom: ['hip', 'down'], armsU: ear,
          tilt: 0.12 * ear, squash: hopIn < 1 ? -0.3 * Math.sin(Math.PI * hopIn) : 0, heart: 0.3, look: 0.6 * ear,
          marks: ear > 0 ? ['notes'] : [], markT0: k.exactly! + 0.1,
        }, -1);
        meter(c, g);
      });
      applauseBubbles(c, t, W * 0.05, W * 0.95, clamp((t - k.worth!) / (k.say! - k.worth!)) * (shot === 5 ? 1 : 0.8), 11);
      if (shot === 4) camTag(c, 'CAM 1', t, s0);
      liveBug(c, g, t);
      post = mergePost(post, punch(t, [k.worth! + 0.33], 0.02));
    } else if (shot === 6) {
      // V7: she leans out over the front row with the mic: "so what are you saying...?"
      const lean = ease.inOutCubic(clamp((t - k.c7! - 0.05) / 0.4));
      const cam = camMix(camOn(W / 2, 470, 1.7), camOn(W / 2, 500, 1.85), ease.inOutQuad(clamp(lt / (k.c8! - s0))));
      shoot(c, g, cam, () => {
        studio(c, g, t, { curtain: 0, ring: 0, sign: 0.15, onAir: true, house: 0.28, score, cue: 'APPLAUSE', cueT0: k.exactly!,
          spots: [{ x: -400, a: 0 }, { x: STAND.x, col: WARM, a: 1.1, r: 165 }, { x: METER.x, y: SET.floor, col: HEX.pink, a: 0.6, r: 140 }] });
        meter(c, g);
        const R = R0 * (1 + 0.1 * lean);
        this.rai(c, STAND.x, SET.floor - 1.07 * R + 18 * lean, R, t, {
          face: 'sassy', arms: ['hip', 'reach'], armsFrom: ['hip', 'cheek'], armsU: lean, tilt: -0.1 * lean, heart: 0.3, look: 0.2,
          marks: t >= k.saying! ? ['?'] : [], markT0: k.saying!,
        });
      });
      // the front row, low and close
      const fz = 1.3;
      shoot(c, g, { x: 0, y: H / 2 - H / (2 * fz), zoom: fz }, () => studioFront(c, g, t, { crowd: 1, mood: 'calm' }));
      camTag(c, 'CAM 2', t, s0);
      liveBug(c, g, t);
    } else if (shot === 7) {
      // V8: the floor manager with YES and NO, unsure
      const cam = camMix(camOn(OCT.x + 30, OCT.y + 10, 1.9), camOn(OCT.x + 10, OCT.y, 2.02), ease.inOutQuad(clamp(lt / (k.c9! - s0))));
      shoot(c, g, cam, () => {
        studio(c, g, t, { curtain: 0, ring: 0, sign: 0.15, onAir: true, house: 0.3, score, spots: [{ x: OCT.x + 40, col: HEX.yellow, a: 0.8, r: 200 }] });
        octoUnsure(c, g, t, s0);
      });
      liveBug(c, g, t);
    } else {
      // V9: CAM 1 wide (number1 opens on this same frame): "about me?" and the giant "?"
      const build = clamp((t - s0) / (this.ctx.end - s0));
      shoot(c, g, { x: 0, y: 0, zoom: 1 }, () => {
        studio(c, g, t, { curtain: 0, ring: 0, sign: 0.15 + 0.2 * build, onAir: true, house: 0.3 + 0.12 * build, score, cue: 'APPLAUSE', cueT0: k.exactly!,
          spots: [{ x: W * 0.3, col: HEX.pink, a: 0.5 * build, r: 160 }, { x: STAND.x, col: WARM, a: 1.1, r: 165 }, { x: W * 0.7, col: HEX.cyan, a: 0.5 * build, r: 160 }] });
        meter(c, g);
        octoUnsure(c, g, t, k.c8!, false);
        bigQ(c, t, k.me!);
        this.rai(c, STAND.x, STAND.y, R0, t, {
          face: 'sassy', arms: ['hip', 'reach'], tilt: -0.06, heart: 0.3, look: 0.2,
          squash: t > k.me! && t < k.me! + 0.2 ? -0.2 * Math.sin(Math.PI * (t - k.me!) / 0.2) : 0,
        });
        studioFront(c, g, t, { crowd: 1, mood: 'calm' });
      });
      camTag(c, 'CAM 1', t, s0);
      liveBug(c, g, t);
      post = mergePost(post, punch(t, [k.me!], 0.03), hitShake(t, [k.me!], 4, 0.3));
    }

    lyricBand(c, this.all, t, this.ctx.start, this.ctx.end);
    plateMask(g, this.all, t, this.ctx.start, this.ctx.end);
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    return mergePost(post, { zoom: 1 + 0.006 * f.a.kick });
  }

  /** A soft warm light around her in a close shot (the spot from the rig, without its beam crossing the frame). */
  warmLight(g: C2, x: number, y: number, r: number) {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, rgbaHex(WARM, 0.05)); gr.addColorStop(1, rgbaHex(WARM, 0));
    g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
  }

  /** The audience's scorecards: tiny story pictures, popping up in a wave on "story". */
  cards(c: C2, g: C2, t: number) {
    const story = this.k.story!;
    const rows = ['D', 'C', 'B', 'A'];
    rows.forEach((row, ri) => {
      const r = 3 - ri;
      for (let col = 1; col <= 12; col++) {
        const kind = seatKind(row, col);
        if (kind !== 'fish' && kind !== 'crab' && kind !== 'jelly') continue;
        const tp = story + 0.022 * (col - 1) + 0.07 * r, up = t < tp ? 0 : ease.outBack(clamp((t - tp) / 0.22), 2);
        if (up <= 0) continue;
        const p = seatPos(row, col), s = p.s;
        const pic: Pic = `${row}${col}` === 'C8' ? 'heart' : PICS[Math.floor(h01(r, col, 33) * PICS.length)]!;
        const sw = 0.08 * Math.sin(t * 2.4 + col + r);
        scorecard(c, g, p.x + 6 * s, p.y - 30 * s - 56 * s - 74 * s * up, s * 1.12, pic, t, sw);
      }
    });
  }
}
