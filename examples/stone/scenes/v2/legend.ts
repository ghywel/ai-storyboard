// v2 "THE DIVER", LEGEND (26.97–40.68; lines 6–9, rapped; TREATMENT-v2.md). Same seabed, same lantern: cuts every
// two beats (sixteen shots from the beat grid) between the story in the circle and the two of them; then the
// lantern's light opens out over the seabed and shows where Rai actually lives.
//   26.97  close: Rai leans into the torchlight to share a secret: scheme, finger at her chin   "Now here's the twist"
//   27.82  the circle: Yap the morning after the storm, the broken canoe, people looking out to sea
//   28.68  Rai close: a big grin, then love, hearts, a hop                                       "and I love this bit"
//   29.54  the circle: the island's stone bank, a gap where she stood; a garland laid in it on "off"
//   30.40  the circle: the whole island on the shore at sunset, every one pointing at the sea ("!")
//   31.25  the circle: above and below the waterline, gold lines of belief going down to the stone  "we know she's down there"
//   32.11  the lines of belief come down out of the circle onto the real Rai: love, hands on her cheeks
//   32.97  close: her heart fills with gold ("believing was enough")
//   33.82  the circle: land, a fenced plot with a palm; the chalk-drawn stone changes hands       "buy land"
//   34.68  Rai counting on her fingers, ONE on "land", TWO on "feud" (two rivals bow over the stone in the circle)
//   35.54  the circle: a wedding under an arch of flowers, the drawn stone handed to the couple (the film's end)
//   36.39  Rai THREE, arms up, on "complete"
//   37.25  the circle's light opens out over the seabed: the street, ordinary rocks with shell letterboxes and
//          house-number pebbles (3, 5, ...), the crab postman with a letter; up to No. 7, hers, the gold letterbox
//          stuffed with post                                                                   "I haven't been seen"
//   38.11  the girl tips out her purse beside her: three coins, one on each word; Rai pops chibi, smug  "in living memory"
//   38.96  the girl laughs (a burst of bubbles); the crab squeezes one more letter into the gold box
//   39.82  on the downbeat the girl's finger writes RICHEST ROCK in the sand; Rai full size, joy; and the two of them
//          settle on the seabed in the torchlight (touch takes it from there)
// Clues: the wedding in the circle (how the film ends); the gold letterbox's post (land, feuds, weddings: what an unseen
// stone is still trusted with); the girl's three coins (what is in her pocket against what is believed in); the crab
// postman (the street is a real place, with neighbours).
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../../engine/scene';
import { Layer2D, W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import type { Line } from '../../engine/lyrics';
import { clamp, ease, lerp } from '../../engine/util';
import { drawRai, h01, lastHands, type ArmPose, type Face, type RaiOpts } from '../_rai';
import { FAM, TAU, rgbaHex } from '../_motifs';
import { seabedFront } from '../_world';
import { poof, star4, type Mark } from '../_manga';
import { mergePost, punch } from '../_post';
import { girl, GIRL_POSES, heartLantern, bubbleLyric, currentLine, withCam2, type GirlPose } from './_diver';
import {
  Dark, beam, lanternBeam, lensReeds, seaSet, girlBelt, frameOn, camMix, clearUnderLyric, lyricExtent, bubble, crab, girlPelvis, blendPose, aim,
  RAI, KNEEL, TORCH_REST, LETTERBOX, STREET, type Cam,
} from './dive-sea';
import { torchOnSand, plantedTorch } from './dive-sea';
import { morning, bank, pointing, belief, deal } from './legend-story';

type C2 = CanvasRenderingContext2D;
type Kind = 'lean' | 'morning' | 'love' | 'bank' | 'pointing' | 'belief' | 'rain' | 'rainClose' | 'land' | 'count12' | 'wedding' | 'count3' | 'street' | 'coins' | 'laugh' | 'richest';
const SHOTS: Kind[] = ['lean', 'morning', 'love', 'bank', 'pointing', 'belief', 'rain', 'rainClose', 'land', 'count12', 'wedding', 'count3', 'street', 'coins', 'laugh', 'richest'];
const FULL: Kind[] = ['morning', 'bank', 'pointing', 'belief', 'land', 'wedding'];
const CIRCLE = { x: 930, y: 330, r: 290 };
const GH = 330;   // a touch taller than in lantern (she is closer now): touch draws her at this scale
// The last shot hands over to touch at 40.68 (touch's first framing, read from touch.ts / touch-props.ts: Rai at screen
// (1159, 669) R 168, the girl kneeling at screen x 784, her torch planted in the sand aimed at Rai's face, the three coins
// and RICHEST ROCK in front of Rai): END_CAM puts our Rai there, and the props sit where touch draws them.
const END_CAM = { x: 1057, y: 662, z: 1.615 };
const COINS = [{ x: 1069, y: 866 }, { x: 1087, y: 870 }, { x: 1105, y: 865 }];
const WRITE = { cx: 1118, y: 910, size: 48 };   // RICHEST ROCK in the sand (world px)
const KNEEL_END = { x: 928, y: 860 };          // her pelvis x and the ground under her knees, from the street shot on
const WRITE_DUR = 0.4;                           // the finger writes RICHEST ROCK in 0.4 s from the downbeat
const PLANT = { x: 985, y: 868, s: 1.04, ang: -0.898 };   // the torch planted in the sand, aimed at Rai's face

export default class Legend extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  D = new Dark();
  X = new Layer2D(W, H, 0.25);
  lines: Line[] = [];
  cuts: number[] = [];
  w: Record<string, number> = {};

  override init() {
    const { lyrics, audio: au, start, end } = this.ctx;
    this.lines = lyrics.lines.filter((l) => l.end > start + 0.02 && l.words[0]!.start < end + 0.4);   // incl. the line still ringing across the cut in
    const b0 = Math.round(au.beatAt(start + 0.02));
    this.cuts = SHOTS.map((_, i) => (i === 0 ? start : au.timeOfBeat(b0 + 2 * i)));
    const wd = (q: string, re: RegExp, nth = 0) => { const l = lyrics.get(q); return (l.words.filter((x) => re.test(x.w.toLowerCase()))[nth] ?? l.words[0]!).start; };
    this.w = {
      now: wd("here's the twist", /now/), twist: wd("here's the twist", /twist/), love: wd("here's the twist", /love/), nobody: wd("here's the twist", /nobody/), off: wd("here's the twist", /off/),
      whole: wd('whole island said', /whole/), we: wd('whole island said', /we/), know: wd('whole island said', /know/), there: wd('whole island said', /there/), believing: wd('whole island said', /believing/), enough: wd('whole island said', /enough/),
      so: wd('settle a feud', /^so$/), land: wd('settle a feud', /land/), feud: wd('settle a feud', /feud/), wedding: wd('settle a feud', /wedding/), complete: wd('settle a feud', /complete/),
      seen: wd('richest rock', /seen/), in: wd('richest rock', /^in$/), living: wd('richest rock', /living/), memory: wd('richest rock', /memory/), richest: wd('richest rock', /richest/), rock: wd('richest rock', /rock/), street: wd('richest rock', /street/),
    };
    this.w.write = au.downbeats.find((d) => d >= this.w.richest! - 0.15) ?? this.w.richest!;   // the downbeat on "richest"
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t, w = this.w;
    this.L.clear(HEX.ink); this.G.clear();
    let i = 0;
    for (let k = 0; k < this.cuts.length; k++) if (t >= this.cuts[k]!) i = k;
    const t0 = this.cuts[i]!, t1 = this.cuts[i + 1] ?? this.ctx.end, u = clamp((t - t0) / (t1 - t0));
    const kind = SHOTS[i]!;
    if (FULL.includes(kind)) this.full(c, g, t, u, i, this.storyFor(kind, t, u));
    else this.watch(c, g, t, kind, u);
    const line = currentLine(this.lines, t);
    // touch's first line rises in under the cut, pink (the tender section)
    if (line) { const e = lyricExtent(c, line.words.map((x) => x.w), false); clearUnderLyric(g, e.w, e.rows); bubbleLyric(c, line, t, line.words[0]!.start >= this.ctx.end ? { sung: HEX.pink } : {}); }
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    const post = mergePost({ bloom: 0.8, vignette: 0.5 }, punch(t, [t0], 0.012, 0.2), punch(t, [w.off!, w.land!, w.feud!, w.complete!, w.write!], 0.025, 0.3));   // no shake here: v2 keeps its shakes for the storm, the fist and the breach
    return mergePost(post, { zoom: 1 + 0.006 * f.a.kick });
  }

  storyFor(kind: Kind, t: number, u: number): (c: C2) => void {
    const w = this.w;
    switch (kind) {
      case 'lean': case 'morning': return (c) => morning(c, t, kind === 'morning' ? u : 0);
      case 'love': case 'bank': return (c) => bank(c, t, clamp((t - w.off! + 0.45) / 0.45));
      case 'pointing': return (c) => pointing(c, t, u, w.whole!);
      case 'belief': case 'rain': return (c) => belief(c, t, kind === 'rain' ? 1 : clamp((t - w.we! + 0.1) / 1.1));
      case 'rainClose': return (c) => belief(c, t, 1);
      case 'land': return (c) => deal(c, t, 'land', clamp((t - w.land! + 0.35) / 0.5), u);
      case 'count12': return (c) => deal(c, t, 'feud', clamp((t - w.feud! + 0.4) / 0.6), u);
      default: return (c) => deal(c, t, 'wedding', clamp((t - w.wedding! + 0.3) / 0.5), u);
    }
  }

  full(c: C2, g: C2, t: number, u: number, i: number, story: (c: C2) => void) {
    const D = this.D, drift = 14 * Math.sin(i * 1.3 + u * 2), cam = frameOn(960, 470, 1.0);
    withCam2(c, g, cam, () => { seaSet(c, t); D.begin(0.95, cam); D.hole(960, 470, 760, 600, 0.35); D.apply(c); });
    const cr = 466 + 6 * u, cx = 960 + drift, cy = 468;
    heartLantern(c, this.X.ctx, 1780, 1320, cx, cy, cr, t, 1, story);
    lanternBeam(g, 1780, 1320, cx, cy, cr, t, 1);
  }

  watch(c: C2, g: C2, t: number, kind: Kind, u: number) {
    const w = this.w, D = this.D;
    const cams: Partial<Record<Kind, Cam>> = {
      lean: camMix(frameOn(985, 640, 1.6), frameOn(990, 650, 1.72), ease.inOutQuad(u)),
      love: camMix(frameOn(1130, 600, 1.85), frameOn(1130, 610, 1.95), u),
      rain: camMix(frameOn(990, 540, 1.04), frameOn(1030, 560, 1.18), ease.inOutQuad(u)),
      rainClose: camMix(frameOn(1160, 620, 2.0), frameOn(1165, 640, 2.15), u),
      count12: camMix(frameOn(1010, 520, 1.25), frameOn(1015, 530, 1.3), u),
      count3: camMix(frameOn(1010, 520, 1.3), frameOn(1010, 520, 1.36), u),
      street: camMix(frameOn(400, 760, 1.5), frameOn(1120, 720, 1.42), ease.inOutCubic(u)),
      coins: camMix(frameOn(1000, 740, 1.75), frameOn(1010, 745, 1.85), u),
      laugh: camMix(frameOn(1090, 740, 1.9, -0.02), frameOn(1100, 740, 2.0, -0.02), u),
      richest: camMix(frameOn(1040, 700, 1.42), frameOn(END_CAM.x, END_CAM.y, END_CAM.z), ease.inOutCubic(clamp((t - w.write! - 0.2) / (this.ctx.end - w.write! - 0.2)))),
    };
    const cam = cams[kind] ?? {};
    // the lantern: open until the street shot, where its light spreads out over the seabed
    const st = this.cuts[12]!, spread = kind === 'street' ? ease.inOutCubic(clamp((t - st) / 0.45)) : 0;
    const lanternOn = ['street', 'coins', 'laugh', 'richest'].includes(kind) ? (kind === 'street' ? 1 - spread : 0) : 1;
    const story = this.storyFor(kind === 'street' ? 'count3' : kind, t, u);
    const street = ['street', 'coins', 'laugh', 'richest'].includes(kind);
    withCam2(c, g, cam, () => {
      seaSet(c, t, { letters: kind === 'laugh' || kind === 'richest' ? 6 : 5 });
      if (!street) torchOnSand(c, TORCH_REST.x, TORCH_REST.y);
      const tip = street ? plantedTorch(c, PLANT.x, PLANT.y, PLANT.ang, PLANT.s) : null;
      if (street) this.postman(c, t);
      if (kind === 'coins' || kind === 'laugh' || kind === 'richest') this.coins(c, g, t);
      if (kind === 'richest') this.sandWriting(c, t);
      const a = this.girl(c, t, kind);
      const ra = this.rai(c, t, kind, u);
      if (kind === 'rain' || kind === 'rainClose') this.arrows(c, g, t, ra.heart, kind);
      seabedFront(c, t, { seed: 7 });
      // the dark: the torch's pool on Rai; the lantern's light on both (or, on the street, the light opened out)
      const fade = kind === 'richest' ? ease.inOutCubic(clamp((t - w.street! + 0.25) / 0.35)) : 0;   // the lantern's light withdraws: torchlight only
      D.begin(street ? lerp(lerp(0.9, 0.74, kind === 'street' ? spread : 1), 0.88, fade) : 0.9, cam);
      D.disc(RAI.x, RAI.y - 30, 240, 0.9, 0.35);
      D.hole(CIRCLE.x + 80, 690, 640, 300, 0.55 * lanternOn);
      D.hole(street ? KNEEL_END.x + 20 : KNEEL.x, KNEEL.y - 120, 230, 200, 0.55);
      if (tip) D.cone(tip.x, tip.y, PLANT.ang, 330, 0.24, 0.7);
      if (street) { const k = (kind === 'street' ? spread : 1) * (1 - fade); for (const s of STREET) D.hole(s.x + 30, 840, 280, 200, 0.6 * k); D.hole(980, 800, 620, 380, 0.4 * k); }
      D.apply(c);
      if (tip) beam(g, tip.x, tip.y, PLANT.ang, 300, 0.22, t, 0.55, 6);
      else { const ang = Math.atan2(RAI.y - TORCH_REST.y - 20, RAI.x - TORCH_REST.x); beam(g, TORCH_REST.x + 10, TORCH_REST.y - 4, ang, Math.hypot(RAI.x - TORCH_REST.x, RAI.y - TORCH_REST.y) - RAI.R, 0.2, t, 0.5, 6); }
      if (lanternOn > 0) {
        const rr = CIRCLE.r * (1 + 1.6 * spread);
        c.save(); c.globalAlpha = lanternOn;
        heartLantern(c, this.X.ctx, ra.heart.x, ra.heart.y, CIRCLE.x, CIRCLE.y + 300 * spread, rr, t, 1, story);
        c.restore();
        lanternBeam(g, ra.heart.x, ra.heart.y, CIRCLE.x, CIRCLE.y + 300 * spread, rr, t, 1, lanternOn);
      }
      if (street) { // the light of the lantern laid over the street: a warm wash
        const wg = g.createLinearGradient(0, 620, 0, 980); wg.addColorStop(0, rgbaHex(HEX.gold, 0)); wg.addColorStop(0.6, rgbaHex(HEX.gold, 0.035 * Math.max(spread, kind === 'street' ? 0 : 1) * (1 - fade))); wg.addColorStop(1, rgbaHex(HEX.gold, 0));
        g.fillStyle = wg; g.fillRect(-200, 620, W + 400, 360);
      }
      if (kind === 'laugh') this.laughBubbles(c, t, a);
      if (kind === 'count12' || kind === 'count3') this.numeral(c, g, t);
    });
    if (kind === 'street') lensReeds(c, t + 3 * ease.inOutCubic(u), 13, 0, 11, 0.9);
    if (kind === 'love' || kind === 'rainClose') lensReeds(c, t, 12, -1, 12, 0.85);
  }

  // ---------------------------------------------------------------- the girl

  girl(c: C2, t: number, kind: Kind) {
    const w = this.w, hug = GIRL_POSES.hug!(t), kneel = GIRL_POSES.kneel!(t);
    const hugPel = { x: KNEEL.x, y: KNEEL.y - 3 * GH / 100 }, kneelPel = { x: KNEEL_END.x, y: KNEEL_END.y - (37 - 18) * GH / 100 };   // girlPelvis puts her knees back on the sand
    let pose: GirlPose = { ...hug, rot: 0.06 }, pel = hugPel, glint: 'plain' | 'spark' | 'droop' | 'wide' = 'spark', emote: 'joy' | '!' | undefined, emoteT0: number | undefined;
    if (kind === 'lean') pose = { ...hug, rot: 0.12 };
    if (kind === 'rain' || kind === 'rainClose') { pose = { ...hug, rot: -0.3 }; glint = 'wide'; }
    if (kind === 'street') { const k = ease.inOutCubic(clamp((t - this.cuts[12]!) / 0.7)); pose = blendPose(hug, kneel, k); pel = { x: lerp(hugPel.x, kneelPel.x, k), y: lerp(hugPel.y, kneelPel.y, k) }; }
    if (kind === 'coins') { // she holds her purse out over the sand by Rai and tips it
      const k = ease.outCubic(clamp((t - this.cuts[13]!) / 0.25));
      pose = blendPose(kneel, { ...kneel, rot: 0.18, sh: [kneel.sh[0], 1.55], el: [kneel.el[0], 0.15] }, k); pel = kneelPel;
    }
    if (kind === 'laugh') { const bob = Math.abs(Math.sin((t - this.cuts[14]!) * 14)) * 0.06; pose = { ...kneel, rot: -0.12 - bob, sh: [-0.5, 0.9], el: [0.9, 1.2] }; pel = { x: kneelPel.x, y: kneelPel.y - bob * 40 }; emote = 'joy'; emoteT0 = this.cuts[14]!; }
    if (kind === 'richest') { // she glides down flat over the sand and writes with a finger, then arcs back up over it into her kneel
      const tw = w.write!, wr = clamp((t - tw) / WRITE_DUR), back = clamp((t - tw - WRITE_DUR - 0.03) / 0.36), bk = ease.inOutCubic(back);
      const into = ease.inOutCubic(clamp((t - this.cuts[15]! + 0.0) / 0.12));
      const span = this.writeSpan(), px = lerp(span.x0, span.x1, wr), glide = GIRL_POSES.glide!(t);
      const writing = aim({ ...glide, rot: Math.PI / 2 + 0.1 }, Math.PI / 2 + 0.25);
      const gpel = { x: px - 118, y: 852 };
      pose = blendPose(blendPose(kneel, writing, into), kneel, bk);
      const from = { x: lerp(kneelPel.x, gpel.x, into), y: lerp(kneelPel.y, gpel.y, into) };
      pel = { x: lerp(from.x, kneelPel.x, bk), y: lerp(from.y, kneelPel.y, bk) - 150 * Math.sin(Math.PI * back) };
      glint = 'spark';
    }
    const at = girlPelvis(pel, pose, GH);
    const a = girl(c, at.x, at.y, GH, pose, { t, col: '#0d0a18', underwater: true, fins: true, slate: true, glint, rim: 'rgba(255,214,140,0.85)', emote, emoteT0 });
    girlBelt(c, a, GH, t, { under: true, purse: kind !== 'coins' && kind !== 'laugh' && kind !== 'richest' });
    if (kind === 'coins') { // the purse in her hand, tipping
      const hnd = a.hands[1], tip = clamp((t - w.in! + 0.1) / 0.3);
      c.save(); c.translate(hnd.x, hnd.y + 8); c.rotate(2.2 * tip);
      c.fillStyle = 'rgba(255,90,95,0.95)'; c.beginPath(); c.ellipse(0, 14, 16, 20, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(120,20,30,0.7)'; c.lineWidth = 2; for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(k * 7, -4); c.lineTo(k * 7, 32); c.stroke(); }
      c.strokeStyle = HEX.gold; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-14, -4); c.quadraticCurveTo(0, -12, 14, -4); c.stroke();
      c.restore();
    }
    return a;
  }

  // ---------------------------------------------------------------- Rai

  rai(c: C2, t: number, kind: Kind, u: number) {
    const w = this.w, base: Partial<RaiOpts> = { heart: 1, heartColor: HEX.gold, glow: HEX.gold, glowStrength: 0.45 };
    const A = (face: Face, arms: [ArmPose, ArmPose], o: Partial<RaiOpts> = {}) => drawRai(c, RAI.x, RAI.y, RAI.R, { t, face, arms, ...base, ...o } as RaiOpts);
    switch (kind) {
      case 'lean': { const g = t >= w.twist! + 0.2; return A(g ? 'grin' : 'scheme', ['chin', 'down'], { armsFrom: ['down', 'down'], armsU: clamp((t - this.cuts[0]!) / 0.15), tilt: 0.16, look: -0.9, marks: (g ? ['sparkle'] : []) as Mark[], markT0: w.twist! + 0.2, heart: 0.5 }); }
      case 'love': { const lv = t >= w.love!; const hop = lv ? 0.3 * Math.abs(Math.sin((t - w.love!) * Math.PI * 140 / 60)) : 0;
        return A(lv ? 'love' : 'grin', lv ? ['cheek', 'cheek'] : ['up', 'up'], { armsFrom: ['up', 'up'], armsU: clamp((t - w.love!) / 0.12), hop, squash: hop < 0.03 && lv ? -0.15 : 0, blush: 1, marks: (lv ? ['hearts'] : ['sparkle']) as Mark[], markT0: lv ? w.love! : this.cuts[2]! }); }
      case 'rain': { const hit = t > w.believing! - 0.3; return A(hit ? 'love' : 'wow', hit ? ['cheek', 'cheek'] : ['down', 'down'], { armsFrom: ['down', 'down'], armsU: clamp((t - w.believing! + 0.3) / 0.15), blush: hit ? 1 : 0, marks: (hit ? ['hearts'] : ['!']) as Mark[], markT0: hit ? w.believing! - 0.3 : this.cuts[6]! + 0.1, heart: 0.6 + 0.4 * clamp(u * 2), look: -0.4 }); }
      case 'rainClose': return A('love', ['cheek', 'cheek'], { blush: 1, marks: ['hearts'] as Mark[], markT0: this.cuts[7]!, heart: 1, glowStrength: 1.1 + 0.3 * Math.sin(t * 6), hop: 0.08 * Math.abs(Math.sin(t * 7)) });
      case 'count12': { const two = t >= w.feud! - 0.05; return A('smile', ['down', two ? 'hold' : 'point'], { armsFrom: ['down', 'down'], armsU: clamp((t - this.cuts[9]!) / 0.15), tilt: two ? -0.06 : 0.05, look: -0.7, marks: ['shine'] as Mark[], markT0: w.feud! }); }
      case 'count3': { const three = t >= w.complete! - 0.05; const hop = three ? 0.32 * Math.sin(Math.PI * clamp((t - w.complete!) / 0.35)) : 0;
        return A(three ? 'joy' : 'smile', three ? ['up', 'up'] : ['down', 'hold'], { armsFrom: ['down', 'hold'], armsU: clamp((t - w.complete! + 0.05) / 0.12), hop, squash: hop < 0.02 && three ? -0.2 : 0, marks: (three ? ['sparkle'] : []) as Mark[], markT0: w.complete! }); }
      case 'street': return A('smug', ['hip', 'hip'], { tilt: 0.08, marks: ['shine'] as Mark[], markT0: this.cuts[12]! + 0.5, look: 0.3 });
      case 'coins': case 'laugh': { // she watches the three coins land, then pops chibi: smug (still the richest)
        const sdAt = w.memory! + 0.1, sd = t >= sdAt;
        const ra = A(sd ? 'smug' : t > w.in! ? 'deadpan' : 'smile', sd ? ['hip', 'hip'] : ['down', 'down'], { sd, look: -0.8, marks: (sd ? ['shine', 'sparkle'] : t > w.in! + 0.2 ? ['sweat'] : []) as Mark[], markT0: sd ? sdAt + 0.05 : w.in! + 0.2, tilt: sd ? 0.12 : 0, heart: 1 });
        poof(c, RAI.x, RAI.y - 40, 170, t, sdAt);
        return ra;
      }
      case 'richest': { // full size again on the downbeat; joy on "rock"; settling into a smile
        const tw = w.write!, joy = t >= w.rock! - 0.05, settle = t >= w.street!;
        const hop = joy && !settle ? 0.3 * Math.sin(Math.PI * clamp((t - w.rock!) / 0.35)) : 0;
        const out = ease.inOutCubic(clamp((t - w.street! + 0.25) / 0.35));
        const ra = A(settle ? 'smile' : joy ? 'joy' : 'smug', settle ? ['down', 'down'] : joy ? ['up', 'up'] : ['hip', 'hip'], { armsFrom: settle ? ['up', 'up'] : ['hip', 'hip'], armsU: settle ? clamp((t - w.street!) / 0.1) : clamp((t - w.rock! + 0.05) / 0.12), hop, squash: joy && hop < 0.02 && !settle ? -0.18 : 0, marks: (settle ? [] : joy ? ['sparkle'] : ['shine']) as Mark[], markT0: joy ? w.rock! : tw, look: -0.6, heart: 1 - out, glow: out > 0.5 ? '#ffcf8a' : HEX.gold, glowStrength: lerp(0.6, 0.35, out) });
        poof(c, RAI.x, RAI.y - 40, 170, t, tw);
        return ra;
      }
      default: return A('smile', ['down', 'down']);
    }
  }

  // ---------------------------------------------------------------- the details

  /** The lines of belief: gold dashes falling from the circle's lower rim onto the real Rai, sparkling where they land. */
  arrows(c: C2, g: C2, t: number, heart: { x: number; y: number }, kind: Kind) {
    const t0 = this.cuts[6]!;
    for (let i = 0; i < 9; i++) {
      const sx = CIRCLE.x - 200 + i * 52, sy = CIRCLE.y + CIRCLE.r * 0.85 - 40 * Math.abs(i - 4) / 4 * 0.3;
      const d = (t - t0 - 0.06 * i) / 0.5;
      if (d < 0) continue;
      const k = clamp(d), ex = lerp(sx, heart.x + (i - 4) * 14, k), ey = lerp(sy, heart.y - 20 + Math.abs(i - 4) * 6, k);
      g.save(); g.setLineDash([12, 10]); g.lineDashOffset = -t * 80; g.strokeStyle = rgbaHex('#ffd98a', 0.35); g.lineWidth = 4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.stroke(); g.restore();
      if (k >= 1) star4(g, ex, ey, 10 + 6 * Math.sin(t * 9 + i), rgbaHex('#fff2c8', 0.8));
    }
    if (kind === 'rainClose') { const gr = g.createRadialGradient(heart.x, heart.y, 0, heart.x, heart.y, 140); gr.addColorStop(0, rgbaHex(HEX.gold, 0.4)); gr.addColorStop(1, rgbaHex(HEX.gold, 0)); g.fillStyle = gr; g.fillRect(heart.x - 140, heart.y - 140, 280, 280); }
    void c;
  }

  /** The count on her fingers, written in the lantern's light by her hand: 1 on "land", 2 on "feud", 3 on "complete". */
  numeral(c: C2, g: C2, t: number) {
    const w = this.w, marks: [number, string][] = [[w.land!, '1'], [w.feud!, '2'], [w.complete!, '3']];
    const cur = marks.filter(([x]) => x - 0.05 <= t).pop();
    if (!cur) return;
    const d = t - cur[0] + 0.05, k = ease.outBack(clamp(d / 0.2), 2.4), x = RAI.x + 190, y = RAI.y - 250;
    c.save(); c.translate(x, y); c.scale(k, k); c.rotate(-0.08);
    c.font = font(FAM.hook(), 150); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = 12; c.strokeStyle = 'rgba(30,18,10,0.85)'; c.strokeText(cur[1], 6, 8);
    c.fillStyle = '#fff2c8'; c.fillText(cur[1], 0, 0);
    c.restore();
    const gr = g.createRadialGradient(x, y, 0, x, y, 120); gr.addColorStop(0, rgbaHex(HEX.gold, 0.18 * clamp(d / 0.2))); gr.addColorStop(1, rgbaHex(HEX.gold, 0));
    g.fillStyle = gr; g.fillRect(x - 120, y - 120, 240, 240);
  }

  /** The crab postman, carrying a letter up the street to the gold letterbox, and squeezing it in. */
  postman(c: C2, t: number) {
    const st = this.cuts[12]!, arrive = this.cuts[14]! + 0.15;
    const k = clamp((t - st) / (arrive - st)), x = lerp(240, LETTERBOX.x - 60, k), stuffed = t > arrive + 0.35;
    crab(c, x, 905 - 6 * Math.abs(Math.sin(t * 9)) * (k < 1 ? 1 : 0), 0.75, t, { walk: k < 1 ? t : 0, claws: k >= 1 ? 0.8 : 0.2, letter: !stuffed });
  }

  /** The girl's three coins on the sand by Rai, one on each of "in", "living", "memory", with a little bounce. */
  coins(c: C2, g: C2, t: number) {
    const w = this.w, at = [w.in!, w.living!, w.memory!];
    COINS.forEach((p, i) => {
      const d = t - at[i]!;
      if (d < 0) return;
      const y = p.y - (d < 0.25 ? 70 * (1 - d / 0.25) - 14 * Math.sin(Math.PI * clamp((d - 0.25) / 0.15)) : 0);
      c.fillStyle = 'rgba(30,20,10,0.35)'; c.beginPath(); c.ellipse(p.x + 3, p.y + 4, 10, 3.5, 0, 0, TAU); c.fill();
      c.fillStyle = '#a07a2a'; c.beginPath(); c.ellipse(p.x, y + 2, 9, 4, 0, 0, TAU); c.fill();
      c.fillStyle = HEX.gold; c.beginPath(); c.ellipse(p.x, y, 9, 4, 0, 0, TAU); c.fill();
      const tw = 0.5 + 0.5 * Math.sin(t * 2.3 + i * 2);
      g.fillStyle = rgbaHex('#fff2c0', 0.35 * tw); g.beginPath(); g.arc(p.x + 3, y - 1, 4, 0, TAU); g.fill();
      if (d < 0.4) star4(g, p.x + 4, y - 3, 10 * (1 - d / 0.4), rgbaHex('#fff6dc', 0.9));
    });
  }

  /** Where RICHEST ROCK runs, left to right (world px). */
  writeSpan() {
    const c = this.L.ctx; c.save(); c.font = font(FAM.hook(), WRITE.size); const w = c.measureText('RICHEST ROCK').width; c.restore();
    return { x0: WRITE.cx - w / 2, x1: WRITE.cx + w / 2 };
  }

  /** RICHEST ROCK written into the sand by her finger, left to right from the downbeat (a groove with a lit edge). */
  sandWriting(c: C2, t: number) {
    const u = clamp((t - this.w.write!) / WRITE_DUR);
    if (u <= 0) return;
    c.save();
    const { x0, x1 } = this.writeSpan();
    c.beginPath(); c.rect(x0 - 20, WRITE.y - 60, (x1 - x0 + 40) * u, 120); c.clip();
    c.translate(WRITE.cx, WRITE.y); c.scale(1, 0.62);
    c.font = font(FAM.hook(), WRITE.size); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineJoin = 'round'; c.lineWidth = 8; c.strokeStyle = 'rgba(120,90,50,0.5)'; c.strokeText('RICHEST ROCK', 0, 0);
    c.fillStyle = 'rgba(255,244,210,0.9)'; c.fillText('RICHEST ROCK', 0, -4);
    c.fillStyle = 'rgba(70,46,20,0.92)'; c.fillText('RICHEST ROCK', 0, 1.5);
    c.restore();
    // grains of sand kicked up at the fingertip
    if (u < 1) { const fx = lerp(x0, x1, u); for (let i = 0; i < 8; i++) { c.fillStyle = 'rgba(240,220,170,0.7)'; c.beginPath(); c.arc(fx + (h01(i, 31) - 0.5) * 30, WRITE.y - 8 - 24 * h01(i, 32) * ((t * 7 + i) % 1), 2, 0, TAU); c.fill(); } }
  }

  /** Her laugh: a burst of bubbles from her mask. */
  laughBubbles(c: C2, t: number, a: { head: { x: number; y: number } }) {
    const t0 = this.cuts[14]!;
    for (let i = 0; i < 14; i++) {
      const d = t - t0 - 0.05 * i;
      if (d < 0 || d > 1.2) continue;
      bubble(c, a.head.x + 30 + (h01(i, 61) - 0.5) * 50 + 8 * Math.sin(d * 8 + i), a.head.y - 10 - d * (160 + 80 * h01(i, 62)), 5 + 9 * h01(i, 63), 1 - d / 1.2);
    }
  }
}

export { lastHands };
