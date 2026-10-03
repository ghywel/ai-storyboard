// v1 DATING (pre-chorus 2, half rap, lines 27-30: Pigou's paradox as the show's dating segment, "SWEET NOTHINGS").
// TREATMENT-v1.md's script, shot by shot, each cut on the beat (times are this take's):
//   D1  102.92 CAM 1 wide   "Marry your house-": the heart partition SWEET NOTHINGS drops from the flies between him
//                            (tie, nervous) and her (headscarf, mopping the stage); it lands on "Marry" (the fill's last
//                            kick). Rai on her host stool, cheeky. The scoreboard reads INCOME £21,400; the INCOME
//                            METER beside her stands at £21,400.
//   D2  103.78 CAM 2        "-keeper, the income": the partition parts; they see each other: hearts; he holds out a
//                            ring; wedding bells drop in, confetti. Rai winks to camera (she knows what's coming).
//   D3  104.64 the board    "drops:": INCOME £21,400 slides down the board to £0 with a slide-whistle squiggle, the
//                            lime turning care's pink; chibi Rai pops in from the edge, shocked.
//   D4  105.49 the split    "same floors, same love,": their room before and after the wedding, hand for hand the
//                            same (her mop strokes, his paper, the clock, the photo); the floors gleam together, the
//                            hearts pop together. Only the strips differ: BEFORE · PAID / AFTER · 0. Rai shrugs in the
//                            gutter.
//   D4b 106.35 push in      "same clock,": the two clocks tick and chime together; Rai looks from one to the other.
//   D5  107.64 the strips   "the counting stops;": the PAID meter counts on; the 0 tries, sputters and is stamped
//                            STOPPED. Rai deadpan.
//   D6  108.92 CAM 3 wide   "pay a stranger,": the stranger (bobble hat) walks in with a mop on the beat; the husband
//                            pays him; KA-CHING: coins rain, APPLAUSE, the board and the meter climb. Rai: deadpan,
//                            a slow clap.
//   D7a 110.64 the board    "watch the number": INCOME climbing in lime, +£ rising, coins tumbling past.
//   D7b 111.49 the meter    "climb;": coins pour into the meter's slot, the needle climbs to the peg and strains;
//                            Rai claps on, deadpan.
//   D8  112.78 CAM 1        "your meter's measuring": she points at the meter, then holds up a ringing alarm clock
//                            beside it. It reads 4:00 (the wreck's stopped clock, the woman's hour).
//   D9  114.06 close        "the wrong kind of": the meter spins the wrong way; chibi facepalm, gloom.
//   D10 114.92 hero         "time.": back full size, determined, the clock held high, lines of force.
// Clues: SWEET NOTHINGS (after the wedding her work is worth "nothing": uptheroad's "Just nothing"); the stone
// leaning in the garden outside their window (value by agreement); GDP on his paper; the clock at 4:00; the stranger
// is quickfire's stranger B (strangers trade: money works); the ring (the ring motif: it becomes chorus 2's zero).
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../../engine/scene';
import { Layer2D, W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import type { Line, Word } from '../../engine/lyrics';
import { clamp, ease, lerp } from '../../engine/util';
import { drawRai, type ArmPose, type RaiOpts } from '../_rai';
import { FAM, TAU, rgbaHex, mixHex, slam } from '../_motifs';
import { focusLines, speedLines, poof, reactionBg } from '../_manga';
import { caKick, hitShake, mergePost, punch } from '../_post';
import { SET, studio, studioFront, lowerThird, liveBug, camTag, micProp, ledText, closeBackdrop, type StudioOpts, type ScoreRow } from './_studio';
import { cast } from './_cast';
import { overhead } from './panel-props';
import { lyricSeq, type Cam2, cam2, camOn, heartScreen, weddingBells, confetti, ring, coin, coinRain, coinBurst, slideWhistle, incomeMeter, hostStool, alarmClock, room, strip } from './dating-props';

type C2 = CanvasRenderingContext2D;

// the set for this segment (logical px, the wide shot)
const FL = SET.floor, CH = 288;
const HUSB = W * 0.3, HEART = W * 0.43, KEEP = W * 0.565, METER = W * 0.7, STOOL = W * 0.835;
const SEAT = 690, RR = 80, RAI_Y = SEAT - 1.07 * RR;
const BOARD = { x: SET.score.x + SET.score.w / 2, y: SET.score.y + SET.score.h / 2 };
const MONEY = 21400;
const gbp = (v: number) => '£' + Math.round(v).toLocaleString('en-GB');

const norm = (s: string) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z']/g, '');

/** A stubby stone hand slapped over the chibi's eyes (her chibi arms are too short to reach): the facepalm. */
function palmOnFace(c: C2, x: number, y: number, r: number, u: number) {
  if (u <= 0) return;
  const k = ease.outBack(u), px = x - r * 0.12, py = y + r * 0.08 - (1 - k) * r * 0.6;
  c.save();
  c.strokeStyle = '#3a2f2a'; c.lineWidth = r * 0.2; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x + r * 0.55, y + r * 1.25); c.quadraticCurveTo(x + r * 0.5, y + r * 0.55, px + r * 0.1, py + r * 0.12); c.stroke();
  c.strokeStyle = '#d9cfb8'; c.lineWidth = r * 0.12; c.stroke();
  c.fillStyle = '#d9cfb8'; c.strokeStyle = '#3a2f2a'; c.lineWidth = r * 0.04;
  for (const [dx, dy, rr] of [[-0.26, -0.2, 0.13], [-0.05, -0.27, 0.14], [0.17, -0.22, 0.13], [0, 0, 0.26]] as const) {
    c.beginPath(); c.arc(px + dx * r, py + dy * r, rr * r, 0, TAU); c.fill(); c.stroke();
  }
  c.restore();
}

export default class Dating extends Scene {
  L = new Layer2D();
  G = new Layer2D(); // glow, composited additively so it blooms
  lines: Line[] = [];
  prev: Line | null = null;
  cuts: number[] = [];
  w: Record<string, number> = {};
  beat = 0.4286;

  override init() {
    const { lyrics, audio: au, start, end } = this.ctx;
    this.lines = lyrics.lines.filter((l) => l.words[0]!.start >= start - 0.1 && l.words[0]!.start < end);
    // the last line of uptheroad ("...Just nothing. Still.") is still ringing at the cut: its tail is shown here
    this.prev = lyrics.lines.filter((l) => l.words[0]!.start < start - 0.1).pop() ?? null;
    const [l27, l28, l29, l30] = this.lines as [Line, Line, Line, Line];
    const wd = (l: Line, re: RegExp, nth = 0): Word => l.words.filter((x) => re.test(norm(x.w)))[nth] ?? l.words[0]!;
    const W_ = {
      marry: wd(l27, /^marry/), keeper: wd(l27, /house/), income: wd(l27, /income/), drops: wd(l27, /drops/),
      same0: wd(l28, /^same/, 0), floors: wd(l28, /floor/), counting: wd(l28, /count/), love: wd(l28, /love/), clock: wd(l28, /clock/), the28: wd(l28, /^the$/), stops: wd(l28, /stop/),
      pay: wd(l29, /^pay/), stranger: wd(l29, /stranger/), watch: wd(l29, /watch/), climb: wd(l29, /climb/),
      your: wd(l30, /^your/), meter: wd(l30, /meter/), measuring: wd(l30, /measur/), wrong: wd(l30, /wrong/), kind: wd(l30, /kind/), of: wd(l30, /^of$/), time: wd(l30, /time/),
    };
    for (const [k, v] of Object.entries(W_)) this.w[k] = v.start;
    this.beat = au.timeOfBeat(Math.round(au.beatAt(start)) + 1) - au.timeOfBeat(Math.round(au.beatAt(start)));
    const b0 = Math.round(au.beatAt(start));
    const bAt = (x: number) => au.timeOfBeat(Math.floor(au.beatAt(x + 0.03)));
    this.cuts = [
      start,                       // D1
      au.timeOfBeat(b0 + 2),       // D2
      au.timeOfBeat(b0 + 4),       // D3
      bAt(this.w.floors!),         // D4
      bAt(this.w.clock!),          // D4b
      bAt(this.w.the28!),          // D5
      bAt(this.w.pay!),            // D6
      bAt(this.w.watch!),          // D7a
      bAt(this.w.climb!),          // D7b
      bAt(this.w.your!),           // D8
      bAt(this.w.wrong!),          // D9
      bAt(this.w.of!),             // D10
    ];
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t;
    this.L.clear(HEX.ink); this.G.clear();
    const shot = Math.max(0, this.cuts.filter((x) => t >= x).length - 1), s0 = this.cuts[shot]!, lt = t - s0;
    const draw = [this.d1, this.d2, this.d3, this.d4, this.d4b, this.d5, this.d6, this.d7a, this.d7b, this.d8, this.d9, this.d10][shot]!;
    let post = draw.call(this, c, g, t, lt, f) ?? {};
    if (shot !== 3 && shot !== 4 && shot !== 5) { g.clearRect(54, 44, 160, 60); liveBug(c, g, t); } // nothing glows over the LIVE bug
    const tags: Record<number, string> = { 1: 'CAM 2', 6: 'CAM 3', 9: 'CAM 1' };
    if (tags[shot]) camTag(c, tags[shot]!, t, s0);
    lyricSeq(c, t, this.ctx.start, this.lines, this.prev, g);
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    post = mergePost({ bloom: 0.7 }, post, { zoom: 1 + 0.006 * f.a.kick });
    return post;
  }

  // ---------------------------------------------------------------- pieces

  /** The studio for this segment, pink spots on the date. */
  set(c: C2, g: C2, t: number, o: StudioOpts = {}) {
    studio(c, g, t, {
      curtain: 0, ring: 0, sign: 1, onAir: true, house: 0.55,
      spots: [{ x: HUSB, col: '#ff9fc8', r: 120 }, { x: HEART, col: HEX.pink, r: 230 }, { x: KEEP, col: '#ff9fc8', r: 120 }, { x: STOOL, col: HEX.yellow, r: 110, a: 0.8 }],
      ...o,
    });
  }

  /** A cast member that the spot beams pass behind (the silhouette is cut out of the glow layer, so it stays crisp). */
  castM(c: C2, g: C2, who: Parameters<typeof cast>[1], x: number, y: number, h: number, pose: Parameters<typeof cast>[5], o: Parameters<typeof cast>[6] = {}) {
    cast(c, who, x, y, h, pose, { col: '#120d1d', rim: HEX.pink, ...o });
    g.save(); g.globalCompositeOperation = 'destination-out';
    cast(g, who, x, y, h, pose, { ...o, col: '#000', rim: undefined, emote: undefined });
    g.restore();
  }

  /** Someone mopping: the mop's head swishing on the beat, then the cast member. */
  mopper(c: C2, g: C2, who: 'housekeeper' | 'strangerB', x: number, y: number, h: number, t: number, o: { flip?: boolean; emote?: 'music' | 'heart' | 'sweat' | 'joy'; emoteT0?: number; swish?: number; carry?: boolean } = {}) {
    const u = h / 100, f = o.flip ? -1 : 1;
    c.save(); c.strokeStyle = '#8a6a44'; c.lineWidth = 3 * u; c.lineCap = 'round';
    if (o.carry) { // over the shoulder, walking in
      c.beginPath(); c.moveTo(x - f * 22 * u, y - 40 * u); c.lineTo(x + f * 30 * u, y - 112 * u); c.stroke();
      c.fillStyle = '#d9cfb8'; c.beginPath(); c.ellipse(x + f * 34 * u, y - 116 * u, 12 * u, 6 * u, -0.9 * f, 0, TAU); c.fill();
    } else {
      const sw = (o.swish ?? 1) * Math.sin(t * Math.PI * 2.333) * 12 * u, mx = x + f * 30 * u + sw;
      c.beginPath(); c.moveTo(x + f * 10 * u, y - 62 * u); c.lineTo(mx, y); c.stroke();
      c.fillStyle = '#d9cfb8'; c.beginPath(); c.ellipse(mx, y - 3 * u, 12 * u, 5 * u, 0, 0, TAU); c.fill();
      c.fillStyle = 'rgba(160,210,240,0.35)'; c.beginPath(); c.ellipse(mx, y + 2 * u, 22 * u, 3 * u, 0, 0, TAU); c.fill();
    }
    c.restore();
    this.castM(c, g, who, x, y, h, o.carry ? 'stand' : 'hug', { flip: o.flip, t, prop: false, emote: o.emote, emoteT0: o.emoteT0 });
  }

  /** Rai on her host stool (or her chibi), returning her anchors. */
  raiStool(c: C2, t: number, o: Omit<RaiOpts, 't'>, R = RR) {
    hostStool(c, STOOL, SEAT, FL);
    return drawRai(c, STOOL, SEAT - 1.07 * R, R, { glow: HEX.bone, heart: 0.35, ...o, t });
  }

  /** The slow clap (hands meet every other beat) for drawRai. */
  clap(f: Frame): { arms: [ArmPose, ArmPose]; armsFrom: [ArmPose, ArmPose]; armsU: number } {
    const p = (f.beat % 2) / 2, u = Math.pow(Math.abs(Math.cos(Math.PI * p)), 3);
    return { arms: ['chin', 'chin'], armsFrom: ['shrug', 'shrug'], armsU: u };
  }

  /** The value on the board and meter while the stranger is paid (climbing from £0 after KA-CHING). */
  paid(t: number) {
    const k = this.w.stranger! - 0.02;
    return t < k ? 0 : Math.min(MONEY * 1.6, MONEY * Math.pow(clamp((t - k) / 2.4), 1.3) * 1.6);
  }

  // ---------------------------------------------------------------- D1: the partition comes down
  d1(c: C2, g: C2, t: number, lt: number, f: Frame): PostOverrides {
    const marry = this.w.marry!, s0 = this.cuts[0]!;
    const fall = clamp((t - s0) / (marry - s0)), land = t - marry;
    const hy = lerp(-420, H * 0.47, ease.inQuad(fall)) + (land > 0 ? 34 * Math.exp(-6 * land) * Math.sin(22 * land) : 0);
    this.set(c, g, t, { cue: 'OOOH', cueT0: marry, score: [{ text: 'INCOME', col: HEX.bone }, { text: gbp(MONEY), col: HEX.lime }] });
    incomeMeter(c, g, METER, FL, 0.95, t, { needle: MONEY / 25000, odo: gbp(MONEY) });
    heartScreen(c, g, HEART, hy, 165, t);
    this.castM(c, g, 'husband', HUSB, FL, CH, 'stand', { t, emote: 'sweat', emoteT0: marry + 0.1 });
    this.mopper(c, g, 'housekeeper', KEEP, FL, CH, t, { flip: true, emote: 'music', emoteT0: s0 + 0.1 });
    // still steaming from "Still." (uptheroad's last beat) until the segment's sting, then the host's smile is back on
    const hop = t >= marry ? 0.12 * Math.abs(Math.sin(f.beat * Math.PI)) : 0;
    if (t < marry) this.raiStool(c, t, { face: 'angry', arms: ['fist', 'fist'], prop: { side: 1, draw: micProp }, marks: ['vein', 'steam'], markT0: s0 - 1, shake: 0.4 });
    else this.raiStool(c, t, { face: 'cheeky', arms: ['hip', 'cheek'], armsFrom: ['fist', 'fist'], armsU: clamp((t - marry) / 0.15), prop: { side: 1, draw: micProp }, hop, tilt: -0.06, marks: ['hearts'], markT0: marry + 0.05 });
    poof(c, STOOL, SEAT - 1.07 * RR - 60, 120, t, marry);
    studioFront(c, g, t, { crowd: 1, mood: t > marry ? 'cheer' : 'calm' });
    return mergePost(hitShake(t, [marry + 0.05], 4, 0.3), punch(t, [marry + 0.05], 0.02));
  }

  // ---------------------------------------------------------------- D2: they see each other
  d2(c: C2, g: C2, t: number, lt: number): PostOverrides {
    const s0 = this.cuts[1]!, lift = ease.inOutCubic(clamp((t - s0) / 0.3)), step = ease.outBack(clamp((t - s0 - 0.08) / 0.3)), meet = s0 + 0.24, bells = s0 + 0.3;
    const hx = HUSB + (HEART - 78 - HUSB) * step, kx = KEEP + (HEART + 78 - KEEP) * step;
    cam2(c, g, camOn(W * 0.53, H * 0.47, 1.42 + 0.04 * lt), () => {
      this.set(c, g, t, { cue: 'OOOH', cueT0: this.w.marry!, score: [{ text: 'INCOME', col: HEX.bone }, { text: gbp(MONEY), col: HEX.lime }] });
      incomeMeter(c, g, METER, FL, 0.95, t, { needle: MONEY / 25000, odo: gbp(MONEY) });
      heartScreen(c, g, HEART, lerp(H * 0.47, H * 0.45, lift), 165, t);
      weddingBells(c, g, HEART, H * 0.2, 88, t, bells);
      // they step in and meet before the heart: he holds out the ring, she swoons
      const hop = (k: number) => Math.sin(clamp((t - s0 - 0.08 - k) / 0.3) * Math.PI) * 18;
      this.castM(c, g, 'husband', hx, FL - hop(0), CH, step > 0.6 ? 'hug' : 'stand', { t, emote: 'heart', emoteT0: meet });
      this.castM(c, g, 'housekeeper', kx, FL - hop(0.04), CH, step > 0.6 ? 'face' : 'stand', { flip: true, t, prop: false, emote: 'heart', emoteT0: meet + 0.08 });
      if (step > 0.6) ring(c, g, hx + 0.26 * CH, FL - 0.7 * CH, 13, t);
      this.raiStool(c, t, { face: 'wink', arms: ['up', 'cheek'], armsFrom: ['hip', 'cheek'], armsU: clamp(lt / 0.15), prop: { side: 1, draw: micProp }, look: 0.6, marks: ['sparkle'], markT0: s0 + 0.1 });
      studioFront(c, g, t, { crowd: 1, mood: 'cheer' });
    });
    confetti(c, t, bells, 120, 0, W, 5, [W * 0.35, H * 0.2]);
    return punch(t, [bells], 0.02);
  }

  // ---------------------------------------------------------------- D3: the income drops
  d3(c: C2, g: C2, t: number, lt: number): PostOverrides {
    const drops = this.w.drops!, u = clamp((t - drops) / 0.42), uq = Math.floor(u * 14) / 14;
    const val = MONEY * (1 - ease.inCubic(uq)), col = u >= 1 ? HEX.pink : HEX.lime;
    const sag = ease.inQuad(u);
    const cam = camOn(BOARD.x, BOARD.y + 18, 2.2 + 0.05 * lt);
    cam2(c, g, cam, () => {
      this.set(c, g, t, {
        spots: [],
        scoreDraw: (cc, gg, x, y, w, h) => {
          ledText(cc, gg, 'INCOME', x + w / 2, y + h * 0.2, 48, HEX.bone);
          const yy = y + h * (0.56 + 0.26 * sag) - (u >= 1 ? 22 * Math.exp(-8 * (t - drops - 0.42)) * Math.abs(Math.sin(18 * (t - drops - 0.42))) : 0);
          ledText(cc, gg, u >= 1 ? '£0' : gbp(val), x + w / 2, yy, u >= 1 ? 110 : 76, col);
        },
      });
    });
    // the slide whistle, in frame space from where the number was to where it lands
    const sx = (BOARD.x - W / 2 - cam.x!) * cam.zoom! + W / 2;
    slideWhistle(c, sx - 330, H * 0.36, sx + 120, H * 0.78, clamp((t - drops) / 0.5));
    // chibi Rai pops in at the edge of the frame, shocked
    if (t >= drops + 0.04) {
      const pop = ease.outBack(clamp((t - drops - 0.04) / 0.18));
      drawRai(c, W - 250 + (1 - pop) * 260, H * 0.5, 120, { t, face: 'shock', sd: true, arms: ['up', 'up'], marks: ['sweat', '!'], markT0: drops + 0.1, tilt: -0.15, glow: HEX.pink });
      poof(c, W - 250, H * 0.42, 190, t, drops + 0.04);
    } else {
      // before the drop: her pointing hand at the edge (she is just off camera, presenting it)
      drawRai(c, W - 120, H * 0.6, 120, { t, face: 'cheeky', arms: ['point', 'hip'], look: -1, glow: HEX.bone, heart: 0.3 });
    }
    return mergePost(punch(t, [drops], 0.025));
  }

  // ---------------------------------------------------------------- D4 / D4b / D5: the split screen
  /** The split: the same room twice, Rai in the gutter, the strips under. */
  split(c: C2, g: C2, t: number, o: { face: RaiOpts['face']; arms: [ArmPose, ArmPose]; look?: number; marks?: RaiOpts['marks']; markT0?: number; hop?: number; stops?: number; counting?: number }) {
    const w = this.w, top = 110, ph = 640, gut = 64, pw = (W - 120 - gut) / 2;
    // the show's split template: ink with a pink rule, the segment's hearts faint behind
    const bg = c.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#1d1236'); bg.addColorStop(1, '#0b0718');
    c.fillStyle = bg; c.fillRect(-W, -H, W * 3, H * 3);
    c.fillStyle = 'rgba(255,79,154,0.08)'; c.font = font(FAM.hook(), 120); c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let i = 0; i < 6; i++) c.fillText('♥', W * (0.1 + 0.16 * i), H * 0.94 + 10 * Math.sin(t + i));
    const gleam = clamp((t - w.floors!) / 0.6);
    const ro = { gleam: t >= w.floors! ? gleam : 0, loveT0: t >= w.love! ? w.love : undefined, tickT0: w.clock! };
    for (const [k, px] of [[0, 60], [1, 60 + pw + gut]] as const) {
      room(c, g, px, top, pw, ph, t, ro);
      c.strokeStyle = HEX.pink; c.lineWidth = 6; c.strokeRect(px, top, pw, ph);
      // the tag in the pane's corner
      c.font = font(FAM.monoB(), 30); c.textAlign = 'left'; c.textBaseline = 'middle';
      const tag = k ? 'AFTER THE WEDDING' : 'BEFORE THE WEDDING', tw = c.measureText(tag).width;
      c.fillStyle = 'rgba(10,8,16,0.85)'; c.fillRect(px + 14, top + 14, tw + 34, 50);
      c.fillStyle = k ? HEX.pink : HEX.lime; c.fillRect(px + 14, top + 14, 8, 50);
      c.fillStyle = '#f4f1ea'; c.fillText(tag, px + 34, top + 40);
    }
    // the strips: the only difference
    const sy = top + ph + 14, sh = 84, sw = pw * 0.8, sl = 60 + pw * 0.08, sr = 60 + pw + gut + pw * 0.12;
    const cnt = o.counting ?? 0;
    strip(c, g, sl, sy, sw, sh, 'HOUSEKEEPER', cnt > 0 ? gbp(MONEY + Math.floor((t - w.the28!) * 7) * 410) : 'PAID', HEX.lime);
    const stops = o.stops ?? 0;
    const sputter = cnt > 0 && stops <= 0 && t > w.counting! ? (Math.floor(t * 14) % 3 === 0 ? '1' : '0') : '0';
    strip(c, g, sr, sy, sw, sh, 'WIFE', sputter, stops > 0 ? mixHex(HEX.pink, '#6a5a6a', 0.5 * clamp(stops * 3)) : HEX.pink, stops > 0 ? 0.6 : 1);
    if (stops > 0) { // the STOPPED stamp
      const k = ease.outBack(clamp(stops / 0.18), 2.2);
      c.save(); c.translate(sr + sw * 0.42, sy + sh / 2); c.rotate(-0.12); c.scale(2.2 - 1.2 * k, 2.2 - 1.2 * k);
      c.globalAlpha = clamp(stops / 0.06);
      c.font = font(FAM.hook(), 54); c.textAlign = 'center'; c.textBaseline = 'middle';
      c.strokeStyle = '#ff3b3b'; c.lineWidth = 6; const tw = c.measureText('STOPPED').width;
      c.strokeRect(-tw / 2 - 18, -38, tw + 36, 76);
      c.fillStyle = '#ff3b3b'; c.fillText('STOPPED', 0, 3);
      c.restore();
    }
    // Rai in the gutter
    c.fillStyle = '#0b0718'; c.fillRect(60 + pw, top - 6, gut, ph + 12);
    drawRai(c, W / 2, sy - 6 - 1.07 * 84, 84, { t, face: o.face, arms: o.arms, look: o.look, marks: o.marks, markT0: o.markT0, hop: o.hop, glow: HEX.pink, heart: 0.45, noBlink: false });
  }

  d4(c: C2, g: C2, t: number, _lt: number, f: Frame): PostOverrides {
    const w = this.w, sames = [w.same0!, w.same0! + 0.7, w.love! - 0.24];
    let last = -1e9; for (const s of sames) if (t >= s) last = s;
    const hop = 0.14 * Math.exp(-6 * Math.max(0, t - last)) * Math.abs(Math.sin(Math.min(1, (t - last) * 6) * Math.PI));
    this.split(c, g, t, { face: 'sassy', arms: ['shrug', 'shrug'], hop, marks: ['shine'], markT0: w.floors! });
    void f;
    return mergePost(punch(t, [w.floors!, w.love!], 0.012));
  }

  d4b(c: C2, g: C2, t: number, lt: number): PostOverrides {
    const w = this.w, u = ease.inOutCubic(clamp(lt / 0.4)), z = lerp(1.0, 1.62, u);
    const look = t < w.clock! ? -1 : t < w.clock! + 0.45 ? 1 : -1;
    cam2(c, g, { x: 0, y: (430 - H / 2) * u, zoom: z }, () => {
      this.split(c, g, t, { face: t < w.clock! + 0.45 ? 'sassy' : 'deadpan', arms: ['shrug', 'shrug'], look, marks: ['?'], markT0: w.clock! + 0.45 });
    });
    return punch(t, [w.clock! + 0.04], 0.03);
  }

  d5(c: C2, g: C2, t: number, lt: number): PostOverrides {
    const w = this.w, stops = t - w.stops!, u = ease.outCubic(clamp(lt / 0.3));
    cam2(c, g, { x: 0, y: 690 - H / 2, zoom: 1.06 + 0.03 * u + 0.03 * lt }, () => {
      this.split(c, g, t, {
        face: stops > 0 ? 'deadpan' : 'serious', arms: stops > 0 ? ['down', 'down'] : ['shrug', 'point'], look: 1,
        marks: stops > 0 ? ['sweat'] : [], markT0: w.stops! + 0.1, counting: 1, stops: stops > 0 ? stops : 0,
      });
    });
    if (stops > 0) slam(c, 'STOPS', W * 0.5, H * 0.2, 170, t, w.stops!, { col: HEX.pink, shadow: HEX.ink, rot: -0.04 });
    return mergePost(hitShake(t, [w.stops! + 0.02], 4, 0.28), punch(t, [w.stops!], 0.025));
  }

  // ---------------------------------------------------------------- D6: pay a stranger
  d6(c: C2, g: C2, t: number, lt: number, f: Frame): PostOverrides {
    const w = this.w, s0 = this.cuts[6]!, kach = w.stranger! - 0.02, b = this.beat;
    // the stranger walks in from the right wing on the beat, then mops
    const arrive = s0 + 2 * b, walk = clamp((t - s0) / (arrive - s0));
    const sx = lerp(W * 1.08, W * 0.555, ease.outQuad(walk));
    const bob = walk < 1 ? 7 * Math.abs(Math.sin((t - s0) / b * Math.PI * 2)) : 0;
    const val = this.paid(t);
    cam2(c, g, camOn(W * 0.5, H * 0.5, 1.0 + 0.012 * lt), () => {
      this.set(c, g, t, {
        cue: t >= kach ? 'APPLAUSE' : null, cueT0: kach,
        score: [{ text: 'INCOME', col: HEX.bone }, { text: gbp(val), col: t >= kach ? HEX.lime : HEX.pink }],
        spots: [{ x: HUSB - 20, col: '#ff9fc8', r: 150, a: 0.6 }, { x: W * 0.555, col: HEX.yellow, r: 160, a: 0.45 }, { x: METER, col: HEX.lime, r: 120, a: 0.45 }, { x: STOOL, col: HEX.yellow, r: 110, a: 0.6 }],
      });
      incomeMeter(c, g, METER, FL, 0.95, t, { needle: Math.min(1.02, val / 25000), odo: gbp(val) });
      // the married couple, hand in hand; he pays the stranger
      const pays = t >= kach - 0.32;
      this.castM(c, g, 'housekeeper', HUSB - 64, FL, CH, 'stand', { t, prop: false, emote: 'heart', emoteT0: s0 });
      this.castM(c, g, 'husband', HUSB + 30, FL, CH, pays ? 'point' : 'stand', { t });
      if (t >= kach - 0.32 && t < kach) { // the coin arcs over to him
        const u = clamp((t - (kach - 0.32)) / 0.32), x0 = HUSB + 30 + 0.4 * CH, x1 = sx - 30;
        coin(c, lerp(x0, x1, u), FL - 0.86 * CH - Math.sin(u * Math.PI) * 140, 14, u * 20);
      }
      if (t < arrive) this.mopper(c, g, 'strangerB', sx, FL - bob, CH, t, { flip: true, carry: true });
      else this.mopper(c, g, 'strangerB', sx, FL, CH, t, { flip: true, emote: t >= kach ? 'joy' : undefined, emoteT0: kach });
      const cl = this.clap(f);
      this.raiStool(c, t, { face: 'deadpan', ...cl, prop: { side: 1, draw: micProp }, marks: t >= kach ? ['sweat'] : [], markT0: kach + 0.2 });
      coinBurst(c, g, t, kach, METER, FL - 330, { n: 34, floorY: FL - 8, r: 15, spread: 1.1 });
      coinRain(c, g, t, kach - 0.25, { n: 40, x0: W * 0.18, x1: W * 0.82, floorY: FL - 6, dur: 1.4, r: 15 });
      studioFront(c, g, t, { crowd: 1, mood: t >= kach ? 'cheer' : 'calm' });
    });
    slam(c, 'KA-CHING!', W * 0.47, H * 0.33, 150, t, kach, { col: HEX.lime, shadow: HEX.ink, rot: -0.05 });
    return mergePost(hitShake(t, [kach], 5, 0.32), caKick(t, [kach], 4), punch(t, [kach], 0.03));
  }

  // ---------------------------------------------------------------- D7: the number climbs
  d7a(c: C2, g: C2, t: number, lt: number): PostOverrides {
    const val = this.paid(t), cam = camOn(BOARD.x, BOARD.y + 18, 2.3 - 0.1 * lt);
    cam2(c, g, cam, () => {
      this.set(c, g, t, {
        spots: [],
        scoreDraw: (cc, gg, x, y, w, h) => {
          ledText(cc, gg, 'INCOME', x + w / 2, y + h * 0.2, 48, HEX.bone);
          ledText(cc, gg, gbp(Math.floor(val / 410) * 410), x + w / 2, y + h * 0.56, 76, HEX.lime);
          const blink = Math.floor(t * 6) % 2 === 0;
          if (blink) ledText(cc, gg, '▲', x + w / 2, y + h * 0.86, 44, HEX.lime);
        },
      });
    });
    // +£ rising, coins tumbling past in the foreground
    for (let i = 0; i < 8; i++) {
      const a = (t - this.cuts[7]! - i * 0.11) % 0.9;
      if (a < 0) continue;
      const x = W * (0.32 + 0.36 * ((i * 0.37) % 1)), y = H * 0.7 - a * 420;
      c.font = font(FAM.hook(), 64); c.textAlign = 'center'; c.fillStyle = rgbaHex(HEX.lime, 1 - a / 0.9);
      c.fillText('+£', x, y);
    }
    coinRain(c, g, t, this.cuts[7]! - 0.4, { n: 14, x0: W * 0.05, x1: W * 0.95, floorY: H + 200, dur: 1.2, r: 44, seed: 9 });
    return punch(t, [this.cuts[7]!], 0.02);
  }

  /** The meter and Rai on her stool, close: shared by D7b, D8 and D9. */
  meterShot(c: C2, g: C2, t: number, cam: Cam2, o: { needle: number; odo: string; back?: number; pour?: number; spotA?: number; rai: () => void; overlay?: () => void }) {
    cam2(c, g, cam, () => {
      this.set(c, g, t, { score: [{ text: 'INCOME', col: HEX.bone }, { text: o.odo, col: HEX.lime }], spots: [] });
      const sa = o.spotA ?? 1;
      overhead(g, METER, H * 0.12, FL, HEX.lime, 0.55 * sa, 130); overhead(g, STOOL, H * 0.12, FL, HEX.yellow, 0.6 * sa, 120); // soft spots from the flies
      const m = incomeMeter(c, g, METER, FL, 0.95, t, { needle: o.needle, odo: o.odo, back: o.back });
      if (o.pour !== undefined && t >= o.pour) { // coins arcing into the slot
        for (let i = 0; i < 10; i++) {
          const a = ((t - o.pour) * 2.4 + i / 10) % 1;
          const x = lerp(METER - 420, m.slot.x, a), y = lerp(FL - 120, m.slot.y, a) - Math.sin(a * Math.PI) * 220;
          coin(c, x, y, 13, a * 14 + i);
        }
      }
    });
    o.overlay?.();
    cam2(c, g, cam, () => { o.rai(); });
  }

  d7b(c: C2, g: C2, t: number, lt: number, f: Frame): PostOverrides {
    const val = this.paid(t), needle = Math.min(1.0, val / 25000) + (val > 25000 ? 0.012 * Math.sin(t * 50) : 0);
    this.meterShot(c, g, t, camOn(W * 0.765, H * 0.53, 1.9 + 0.06 * lt), {
      needle, odo: gbp(val), pour: this.cuts[8]!,
      rai: () => { this.raiStool(c, t, { face: 'deadpan', ...this.clap(f), prop: { side: 1, draw: micProp }, look: -0.6, marks: ['sweat'], markT0: this.cuts[8]! + 0.3 }); },
    });
    // £ signs popping out of the meter's top
    for (let i = 0; i < 6; i++) {
      const a = (lt * 1.4 + i / 6) % 1, x = W * 0.36 + (i - 2.5) * 40 + 40 * Math.sin(a * 5 + i), y = H * 0.3 - a * 260;
      c.font = font(FAM.hook(), 54); c.textAlign = 'center'; c.fillStyle = rgbaHex(HEX.lime, 1 - a); c.fillText('£', x, y);
    }
    return punch(t, [this.w.climb!], 0.02);
  }

  // ---------------------------------------------------------------- D8-D10: the wrong kind of time
  d8(c: C2, g: C2, t: number, lt: number): PostOverrides {
    const w = this.w, up = t >= w.measuring! - 0.05, val = this.paid(t);
    this.meterShot(c, g, t, camOn(W * 0.77, H * 0.5, 2.1 + 0.05 * lt), {
      needle: Math.min(1, val / 25000), odo: gbp(val),
      rai: () => {
        if (up) poof(c, STOOL + 60, SEAT - 300, 70, t, w.measuring! - 0.05);
        this.raiStool(c, t, {
          face: up ? 'sassy' : 'serious', arms: up ? ['point', 'up'] : ['point', 'down'], armsFrom: up ? ['point', 'down'] : ['down', 'down'], armsU: up ? clamp((t - w.measuring! + 0.05) / 0.12) : clamp(lt / 0.15),
          prop: up ? { side: 1, draw: alarmClock(t, true, 0.62) } : undefined, look: -1, marks: up ? ['!'] : [], markT0: w.measuring!,
        });
      },
    });
    return punch(t, [w.measuring!], 0.03);
  }

  d9(c: C2, g: C2, t: number, lt: number): PostOverrides {
    const w = this.w, back = 3.2 * ease.inQuad(clamp((t - w.wrong!) / 0.75)), sd = t >= w.kind! - 0.02;
    const odo = gbp(Math.max(0, this.paid(t) - back * 6000));
    const gloom = sd ? clamp((t - w.kind!) / 0.15) : 0;
    this.meterShot(c, g, t, camOn(W * 0.76, H * 0.45, 2.45 + 0.08 * lt), {
      needle: Math.min(1, this.paid(t) / 25000), odo, back, spotA: 1 - 0.75 * gloom,
      overlay: () => { if (gloom > 0) { c.save(); c.globalAlpha = 0.5 * gloom; reactionBg(c, 'rays', '#120c30', '#2a1f5a', t); c.restore(); } },
      rai: () => {
        if (sd) {
          poof(c, STOOL, SEAT - 120, 120, t, w.kind! - 0.02);
          const a = this.raiStool(c, t, { face: 'deadpan', sd: true, arms: ['facepalm', 'down'], marks: ['gloom', 'sweat'], markT0: w.kind!, squash: -0.15, glow: '#6a5aff' });
          palmOnFace(c, a.head.x, a.head.y, a.head.r, clamp((t - w.kind!) / 0.12));
        } else {
          this.raiStool(c, t, { face: t >= w.wrong! + 0.1 ? 'shock' : 'sassy', arms: ['point', 'up'], prop: { side: 1, draw: alarmClock(t, true, 0.62) }, look: -1, marks: t >= w.wrong! + 0.1 ? ['!?'] : [], markT0: w.wrong! + 0.1 });
        }
      },
    });
    if (t >= w.wrong!) slam(c, 'WRONG', W * 0.3, H * 0.16, 130, t, w.wrong!, { col: '#ff3b3b', shadow: HEX.ink, rot: 0.05, t1: w.kind! - 0.05, exit: 0.08 });
    return punch(t, [w.wrong!, w.kind!], 0.025);
  }

  d10(c: C2, g: C2, t: number, lt: number): PostOverrides {
    const w = this.w, s0 = this.cuts[11]!;
    cam2(c, g, camOn(W * 0.6, H * 0.58, 1.3 + 0.03 * lt), () => {
      this.set(c, g, t, { spots: [], score: [{ text: 'INCOME', col: HEX.bone }, { text: '£ ???', col: '#ff3b3b' }] });
      incomeMeter(c, g, METER, FL, 0.95, t, { needle: 0.6, odo: '£ ???', back: 3.2 + (t - w.wrong!) * 2.5, odoCol: '#ff3b3b' });
    });
    c.fillStyle = 'rgba(20,8,30,0.5)'; c.fillRect(0, 0, W, H);
    speedLines(c, -Math.PI / 2, 'rgba(255,214,120,0.35)', t, { n: 40, speed: 2200, alpha: 0.7 });
    focusLines(c, W * 0.42, H * 0.36, 260, 'rgba(255,226,150,0.55)', t, { n: 70, width: 0.009 });
    const k = ease.outBack(clamp(lt / 0.2));
    drawRai(c, W * 0.42, H * 0.6 + (1 - k) * 60, 165, {
      t, face: 'determined', arms: ['fist', 'up'], armsFrom: ['down', 'down'], armsU: clamp(lt / 0.15), squash: lt < 0.1 ? -0.3 : 0,
      prop: { side: 1, draw: alarmClock(t, true, 0.55) }, glow: HEX.gold, glowStrength: 1.3, heart: 0.7, marks: ['sparkle'], markT0: w.time!,
    });
    poof(c, W * 0.42, H * 0.45, 230, t, s0);
    slam(c, 'TIME', W * 0.78, H * 0.3, 190, t, w.time!, { col: HEX.gold, shadow: HEX.ink, rot: -0.05, maxW: W * 0.36 });
    return mergePost(hitShake(t, [s0 + 0.02], 4, 0.3), punch(t, [w.time!], 0.03));
  }
}
