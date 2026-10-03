// v1 "WHAT'S IT WORTH?", the last plate: goodnight (the spoken outro over the full band, lines 55-57, then the band's
// tail and the credits). TREATMENT-v1.md's script, shot by shot, cut on the beat at or before each line's first word:
//
//   A1 the wide (CAM 1): "On Yap..." The show's last segment, further down the festival's night beach. The festival's
//      great gold ring still hangs round the show's stage at the waterline (the ring of bulbs, the rebuilt scoreboard
//      of glows) and breaks into falling embers. Under an arch of two palms the housekeeper and the husband from the
//      dating segment are marrying; the guests (the strangers and the panellists among them) wear leis and hold
//      lanterns; an aisle of candles in the sand. Rai stands by the couple in a flower lei, mic in hand, presenting.
//   A2 CAM 2 on the arch: "they still bring the stones to weddings." The trader (who once shipped stones by the ton)
//      and stranger A carry a stone on a pole the old way and set it down by the couple; its heart lights. Rai: wow,
//      joy, then love (hands to her cheeks, hearts). On "weddings" the couple lean in (a heart), the guests cheer,
//      petals fly, a heart-shaped firework bursts over the arch.
//   B  CAM 3, the gag: "Not because they're heavy." A guest crab in a bow tie tries to lift her: grips, heaves,
//      sweats, reddens; the show's LIFT-O-METER maxes out its EFFORT bar while LIFTED reads 0.0 mm in pink; she does
//      not move (deadpan, a sweat drop). On "because" it flops on its back, legs in the air; the guests laugh. On
//      "heavy" she pops chibi and flexes, smug, in lines of force; the crab raises a tiny white flag.
//   C  "Because everybody remembers." A close shot of Rai on the beach... and the camera pulls back out of the glass:
//      the frame becomes an old TV in a living room at night. The woman from up the road is asleep on the sofa, her
//      child lying against her with her head on a cushion in her lap, one blanket over both (zzz); the lunchbox packed
//      on the side table, the lamp off, the moon and the sea in the window, the coats on their hooks. On the TV (a cut
//      to her close-up) Rai looks out at them, soft, and blows a kiss: a heart floats out of the screen, across the
//      room, and lands on the child; the child's heart rises and the blanket glows warm.
//   D  The band drops away. The TV shows the show's end card; the camera eases in to it: the small bulb sign
//      "WHAT'S IT WORTH?" in a marquee of bulbs, then the credits typed in Plex Mono, each block staying. On the band's
//      last bar the bulbs blaze and Rai pops up in the corner, shushes (they are asleep), and nods off herself. As the
//      band stops, the set switches off the old CRT way: the picture collapses to a line, the line to a dot, and the
//      dot is a ring; the room sinks into the dark around it and the standby light turns red.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../../engine/scene';
import { Layer2D, W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import type { Line, Word } from '../../engine/lyrics';
import { font } from '../../engine/type';
import { clamp, ease, frameIdx } from '../../engine/util';
import { drawRai, h01, type RaiOpts } from '../_rai';
import { FAM, TAU, rgbaHex, mixHex, type C2 } from '../_motifs';
import { poof, focusLines, star4, heart as heartShape, puff } from '../_manga';
import { mergePost, punch, hitShake } from '../_post';
import { captions, liveBug, camTag, micProp } from './_studio';
import { BW, beachWorld, crab, raiLei, type WedTimes, type CrabOpts } from './goodnight-beach';
import {
  RM, CAM_TV, applyCam, camLerp, roomBack, windowGlass, furniture, sofa, sleepers, sleeperMarks, roomLight, tvCasing, tvLed, tvScreen,
  endCard, type RoomCam, type CardTimes,
} from './goodnight-room';

/**
 * The chibi's double-bicep flex (the kit's chibi has stubby arms only): from her shoulders out to the elbows and up to
 * fists beside her big head, the biceps bulging and pumping. (x, y) is the chibi's disc centre as given to drawRai.
 */
function flexArms(c: C2, x: number, y: number, R: number, age: number) {
  const pump = Math.abs(Math.sin(age * 9)), up = ease.outBack(clamp(age / 0.18));
  for (const s of [-1, 1]) {
    const P = (lx: number, ly: number) => [x + s * lx * R, y - ly * R] as const;
    const sh = P(0.4, -0.42), el = P(1.02, -0.36 + 0.04 * pump), fi = P(1.0 + 0.04 * pump, -0.36 + (0.58 + 0.06 * pump) * up);
    for (const [w, col] of [[0.22, '#3a2f2a'], [0.14, '#d9cfb8']] as const) {
      c.strokeStyle = col; c.lineWidth = w * R; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(sh[0], sh[1]); c.lineTo(el[0], el[1]); c.lineTo(fi[0], fi[1]); c.stroke();
    }
    const bu = P(0.72, -0.24 + 0.02 * pump), br = (0.15 + 0.035 * pump) * R;    // the bicep
    c.fillStyle = '#d9cfb8'; c.strokeStyle = '#3a2f2a'; c.lineWidth = 0.045 * R;
    c.beginPath(); c.arc(bu[0], bu[1], br, Math.PI * 1.05, Math.PI * 1.95 + (s < 0 ? 0 : 0)); c.fill(); c.stroke();
    c.beginPath(); c.roundRect(fi[0] - 0.13 * R, fi[1] - 0.12 * R, 0.26 * R, 0.24 * R, 0.08 * R); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(58,47,42,0.6)'; c.lineWidth = 0.025 * R;
    c.beginPath(); c.moveTo(fi[0] - 0.06 * R, fi[1] - 0.02 * R); c.lineTo(fi[0] + 0.06 * R, fi[1] - 0.02 * R); c.stroke();
  }
}

/**
 * The show's stats box for the crab's attempt (frame px, top right): the effort bar maxing out, the stone's weight, and
 * what was lifted: 0.0 mm, in the pink of the film's zeros. Slides in at t0, out at t1.
 */
function liftMeter(c: C2, g: C2, t: number, t0: number, t1: number, effort: number) {
  const inA = ease.outExpo(clamp((t - t0) / 0.25)), outA = 1 - clamp((t - t1) / 0.15);
  if (inA <= 0 || outA <= 0) return;
  const x = W - 96 - 440 + (1 - inA) * 200, y = 118, w = 440, h = 170;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-out';   // no bloom over the box
  g.translate(x + w / 2, y + h / 2); g.transform(1, 0, -0.12, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(-w / 2 - 22, -h / 2 - 6, w + 22, h + 6);
  g.restore();
  c.save(); c.globalAlpha *= Math.min(1, inA * 2) * outA;
  c.save(); c.translate(x + w / 2, y + h / 2); c.transform(1, 0, -0.12, 1, 0, 0);
  c.fillStyle = 'rgba(14,10,24,0.9)'; c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, 6); c.fill();
  c.fillStyle = HEX.gold; c.fillRect(-w / 2, -h / 2 - 6, w, 6);
  c.fillStyle = HEX.pink; c.fillRect(-w / 2 - 22, -h / 2 - 6, 22, h + 6);
  c.restore();
  c.textBaseline = 'middle'; c.textAlign = 'left';
  c.font = font(FAM.hook(), 30); c.fillStyle = HEX.gold; c.fillText('LIFT-O-METER', x + 34, y + 30);
  c.font = font(FAM.monoB(), 24); c.fillStyle = HEX.bone;
  c.fillText('EFFORT', x + 34, y + 76); c.fillText('WEIGHT', x + 34, y + 110); c.fillText('LIFTED', x + 34, y + 144);
  // the effort bar: lime to red, past its end, shaking
  const bx = x + 160, bw = 230, e = clamp(effort, 0, 1.15), k = frameIdx(t);
  c.fillStyle = '#2a2236'; c.fillRect(bx, y + 64, bw, 24);
  c.fillStyle = mixHex(HEX.lime, '#ff3b3b', clamp(e)); c.fillRect(bx, y + 64 + (e > 0.9 ? 2 * (h01(k >> 1, 7) - 0.5) : 0), bw * Math.min(e, 1.06), 24);
  if (e > 0.95) { g.fillStyle = rgbaHex('#ff3b3b', 0.35); g.fillRect(bx + bw - 30, y + 60, 50, 32); }
  c.fillStyle = HEX.bone; c.textAlign = 'right'; c.fillText('4,000 kg', x + w - 46, y + 110);
  const blink = Math.floor(t * 4) % 2 === 0 ? 1 : 0.7;
  c.fillStyle = mixHex('#3a2030', HEX.pink, blink); c.font = font(FAM.monoB(), 30); c.fillText('0.0 mm', x + w - 46, y + 144);
  c.restore();
}

/** Clear the glow layer under a frame-space rect (a TV graphic or the caption box), so no bloom lifts its blacks. */
function punchGlow(g: C2, x: number, y: number, w: number, h: number) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-out';
  g.fillStyle = '#000'; g.fillRect(x, y, w, h);
  g.restore();
}

/** The caption box's rect, as captions() draws it (Cormorant 52 at H - 120), while the line is up. */
function captionBox(c: C2, line: Line, t: number, until: number): [number, number, number, number] | null {
  if (t < line.words[0]!.start - 0.05 || t > until + 0.2) return null;
  c.save(); c.font = font(FAM.serif(), 52); const tw = c.measureText(line.text).width; c.restore();
  return [W / 2 - tw / 2 - 24, H - 120 - 52 * 0.95, tw + 48, 52 * 1.35];
}

interface WCam { x: number; y: number; z: number }
const worldCam = (c: C2, k: WCam) => { c.translate(W / 2, H / 2); c.scale(k.z, k.z); c.translate(-k.x, -k.y); };

/** The plate's beats (master seconds), all derived from the lyrics and the beat grid in init(). */
interface Beats {
  start: number; end: number;
  a2: number; stones: number; weddings: number;
  b: number; grip: number; because: number; heavy: number; unpop: number;
  c: number; closeup: number; lips: number; blow: number; land: number;
  card: number; rows: [number, number, number]; stab: number; off: number;
}

// the broadcast's cameras on the beach world
const CAM_A1: WCam = { x: 960, y: 540, z: 1 };
const CAM_A2: WCam = { x: 1078, y: 690, z: 1.42 };
const CAM_B: WCam = { x: 1330, y: 742, z: 2.3 };
const CAM_C1: WCam = { x: 1210, y: 712, z: 2.05 };
const CAM_C2: WCam = { x: 1352, y: 738, z: 5 };
// the living room's
const CAM_WIDE: RoomCam = { x: 1010, y: 585, z: 1.1 };
const CAM_TWO: RoomCam = { x: 1085, y: 592, z: 1.3 };
const CAM_CRED: RoomCam = { x: 700, y: 532, z: 2.6 };

export default class Goodnight extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  l55!: Line; l56!: Line; l57!: Line;
  B!: Beats;
  WT!: WedTimes;

  override init() {
    const { lyrics: ly, audio: au, start, end } = this.ctx;
    const bf = (s: number) => au.timeOfBeat(Math.floor(au.beatAt(s + 0.02)));
    const bc = (s: number) => au.timeOfBeat(Math.ceil(au.beatAt(s - 0.02)));
    const w = (l: Line, re: RegExp): Word => l.words.find((x) => re.test(x.w.toLowerCase())) ?? l.words[0]!;
    this.l55 = ly.get('On Yap they still'); this.l56 = ly.get('Not because'); this.l57 = ly.get('Because everybody');
    const per = 60 / au.bpm;
    const remembers = w(this.l57, /remember/).start, blow = remembers + 0.3;
    const card = bc(remembers + 1.55);
    // the band's last bar: the first strong kick after the hush; the set switches off as the band stops
    const kicks = au.events('kick', card + 2, end).filter(([, s]) => s > 0.6);
    const stab = kicks.length ? kicks[0]![0] : end - 1.8;
    let stop = end - 0.6;
    for (let s = end - 0.05; s > stab; s -= 0.01) if (au.env('drums', s) > 0.5) { stop = s; break; }
    const off = clamp(stop, end - 0.95, end - 0.5);
    const heavy = w(this.l56, /heavy/).start;
    this.B = {
      start, end,
      a2: bf(w(this.l55, /^they/).start), stones: w(this.l55, /stones/).start, weddings: w(this.l55, /wedding/).start,
      b: bf(this.l56.words[0]!.start), grip: bf(this.l56.words[0]!.start) + 0.5, because: w(this.l56, /because/).start, heavy, unpop: heavy + 1.12,
      c: bf(this.l57.words[0]!.start), closeup: bf(w(this.l57, /everybody/).start), lips: remembers - 0.02, blow, land: blow + 1.05,
      card, rows: [card + per, card + 3 * per, card + 4.6 * per], stab, off,
    };
    const B = this.B;
    this.WT = {
      start, carry0: B.a2 - 0.7, carry1: B.stones + 0.12, stones: B.stones + 0.45, weddings: B.weddings,
      fw: bc(B.weddings + 0.2), laugh: B.because + 0.15,
    };
  }

  // ------------------------------------------------------------------ Rai on the beach

  /** Her acting, line by line (world coords). */
  raiOpts(t: number): RaiOpts & { sd?: boolean } {
    const B = this.B, bpm = this.ctx.audio.bpm;
    const bounce = (k: number) => k * Math.abs(Math.sin(Math.PI * (t - B.start) * bpm / 60));
    const mic = { side: 1 as const, draw: micProp }, micL = { side: -1 as const, draw: micProp };
    if (t < B.a2) { // presenting the couple: "On Yap..."
      return { t, face: 'grin', arms: ['point', 'cheek'], armsFrom: ['down', 'cheek'], armsU: clamp((t - B.start) / 0.25), prop: mic, hop: bounce(0.05), glow: HEX.gold, glowStrength: 0.6, heart: 0.45, marks: ['sparkle'], markT0: B.start + 0.3 };
    }
    if (t < B.b) {
      if (t < B.stones - 0.12) // the stone arriving
        return { t, face: 'wow', look: -1, arms: ['reach', 'cheek'], armsFrom: ['point', 'cheek'], armsU: clamp((t - B.a2) / 0.2), prop: mic, glow: HEX.gold, glowStrength: 0.6, heart: 0.5, marks: ['!'], markT0: B.a2 + 0.25 };
      if (t < B.weddings - 0.06) // its heart lights: joy
        return { t, face: 'joy', arms: ['up', 'cheek'], armsFrom: ['reach', 'cheek'], armsU: clamp((t - B.stones + 0.12) / 0.18), prop: mic, hop: bounce(0.12), squash: 0, glow: HEX.gold, glowStrength: 0.7, heart: 0.7, marks: ['sparkle'], markT0: B.stones };
      // "weddings": hands to her cheeks, in love with it all
      return { t, face: 'love', arms: ['cheek', 'cheek'], armsFrom: ['up', 'cheek'], armsU: clamp((t - B.weddings + 0.06) / 0.2), prop: mic, blush: 1, tilt: 0.07 * Math.sin((t - B.weddings) * 3), glow: HEX.pink, glowStrength: 0.8, heart: 1, marks: ['hearts'], markT0: B.weddings };
    }
    if (t < B.c) {
      if (t < B.grip) return { t, face: 'smile', look: 1, arms: ['hip', 'cheek'], armsFrom: ['cheek', 'cheek'], armsU: clamp((t - B.b) / 0.2), prop: mic, glow: HEX.gold, glowStrength: 0.5, heart: 0.5 };
      if (t < B.because - 0.04) { // the crab heaves; she does not budge
        const atCam = t > (B.grip + B.because) / 2;
        return { t, face: 'deadpan', look: atCam ? 0 : 1, arms: ['hip', 'cheek'], prop: mic, glow: HEX.gold, glowStrength: 0.5, heart: 0.5, marks: atCam ? ['sweat'] : [], markT0: (B.grip + B.because) / 2 };
      }
      if (t < B.heavy - 0.06) return { t, face: 'smug', arms: ['hip', 'cheek'], prop: mic, glow: HEX.gold, glowStrength: 0.6, heart: 0.5, marks: ['shine'], markT0: B.because + 0.1 };
      if (t < B.unpop) // the chibi flex
        return { t, sd: true, face: 'smug', arms: ['hold', 'hold'], hop: 0.08 * Math.abs(Math.sin((t - B.heavy) * 9)), glow: HEX.yellow, glowStrength: 1, heart: 0.8, marks: ['sparkle'], markT0: B.heavy };
      return { t, face: 'wink', arms: ['hip', 'cheek'], armsFrom: ['fist', 'cheek'], armsU: clamp((t - B.unpop) / 0.2), prop: mic, glow: HEX.gold, glowStrength: 0.6, heart: 0.6, marks: ['shine'], markT0: B.unpop + 0.05 };
    }
    // C, on the TV: turning to the people at home, the kiss
    if (t < B.closeup) return { t, face: 'soft', look: Math.min(1, (t - B.c) / 0.5), arms: ['cheek', 'down'], prop: micL, glow: HEX.pink, glowStrength: 0.6, heart: 0.7 };
    if (t < B.lips) return { t, face: 'soft', look: 1, arms: ['down', 'down'], armsFrom: ['cheek', 'down'], armsU: clamp((t - B.closeup) / 0.25), prop: micL, blush: 0.4, glow: HEX.pink, glowStrength: 0.7, heart: 0.8 };
    if (t < B.blow) return { t, face: 'asleep', arms: ['down', 'chin'], armsFrom: ['down', 'down'], armsU: clamp((t - B.lips) / 0.16), prop: micL, blush: 0.9, glow: HEX.pink, glowStrength: 0.8, heart: 0.9 };
    if (t < B.blow + 0.75) return { t, face: 'soft', look: 1, arms: ['down', 'reach'], armsFrom: ['down', 'chin'], armsU: clamp((t - B.blow) / 0.14), prop: micL, blush: 0.9, glow: HEX.pink, glowStrength: 0.9, heart: 1, marks: ['sparkle'], markT0: B.blow };
    return { t, face: 'smile', look: 1, arms: ['down', 'wave'], armsFrom: ['down', 'reach'], armsU: clamp((t - B.blow - 0.75) / 0.25), prop: micL, blush: 0.6, glow: HEX.pink, glowStrength: 0.8, heart: 1 };
  }

  /** The crab's state in the gag (world coords). */
  crabState(t: number): { x: number; o: CrabOpts } | null {
    const B = this.B, K = BW.rai;
    if (t < B.b || t >= B.c) return null;
    const gx = K.x + K.R * 0.96, gy = K.feet - 1.07 * K.R + 6;
    if (t < B.grip - 0.12) return { x: 1640 - 176 * ease.outCubic(clamp((t - B.b) / (B.grip - 0.12 - B.b))), o: { t, pose: 'walk' } };
    if (t < B.grip) return { x: 1464, o: { t, pose: 'grip', gx, gy } };
    if (t < B.because - 0.04) {
      const u = (t - B.grip) / (B.because - B.grip), eff = Math.min(1, 0.35 + 0.65 * u) * (0.85 + 0.15 * Math.sin(t * 17));
      return { x: 1464 + 6 * u, o: { t, pose: 'strain', gx, gy, effort: eff } };
    }
    return { x: 1500, o: { t, pose: 'flat', flag: clamp((t - B.heavy - 0.2) / 0.3) } };
  }

  /** Rai (and the crab, and the gag's lines of force) at her depth in the beach world. */
  drawBeachFront(c: C2, g: C2, t: number) {
    const B = this.B, K = BW.rai, cy = K.feet - 1.07 * K.R, o = this.raiOpts(t);
    if (o.sd) focusLines(c, K.x, cy - 40, 200, 'rgba(255,246,200,0.8)', t, { n: 100 });
    const cs = this.crabState(t);
    if (cs && cs.o.pose === 'flat') crab(c, cs.x, BW.crab.ground, 0.78, cs.o);
    drawRai(c, K.x, cy, K.R, o);
    raiLei(c, K.x, cy, K.R, { hop: o.hop, sd: o.sd, tilt: o.tilt });
    if (o.sd) flexArms(c, K.x, cy - (o.hop ?? 0) * K.R, K.R, t - B.heavy);
    if (cs && cs.o.pose !== 'flat') crab(c, cs.x, BW.crab.ground, 0.78, cs.o);
    if (t >= B.because - 0.04 && t < B.because + 0.3) puff(c, 1500, BW.crab.ground - 10, 40 * (1 - (t - B.because) / 0.34), `rgba(220,210,190,${0.8 * (1 - (t - B.because + 0.04) / 0.34)})`);
    poof(c, K.x, cy - 50, 170, t, B.heavy - 0.06);
    poof(c, K.x, cy - 50, 170, t, B.unpop);
    void g;
  }

  // ------------------------------------------------------------------ render

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t, B = this.B;
    this.L.clear(HEX.ink); this.G.clear();
    let post: PostOverrides = { bloom: 0.75 };

    if (t < B.c) {
      // ---------------- the broadcast, full frame: the wedding, then the gag
      const k = t < B.a2 ? { ...CAM_A1, z: 1 + 0.04 * clamp((t - B.start) / (B.a2 - B.start)) }
        : t < B.b ? { ...CAM_A2, z: CAM_A2.z * (1 + 0.035 * clamp((t - B.a2) / (B.b - B.a2))) }
        : { ...CAM_B, z: CAM_B.z * (1 + 0.02 * clamp((t - B.b) / (B.c - B.b))) };
      for (const x of [c, g]) { x.save(); worldCam(x, k); }
      beachWorld(c, g, t, this.WT, { front: (cc, gg) => this.drawBeachFront(cc, gg, t) });
      c.restore(); g.restore();
      liveBug(c, g, t, 'LIVE · YAP');
      if (t >= B.b) { const cs = this.crabState(t); liftMeter(c, g, t, B.grip, B.heavy - 0.1, cs?.o.pose === 'strain' ? (cs.o.effort ?? 0) * 1.12 : cs?.o.pose === 'flat' ? 0 : 0.15); }
      camTag(c, 'CAM 2', t, B.a2);
      camTag(c, 'CAM 3', t, B.b);
      const [cl, cu] = t < B.b ? [this.l55, Math.min(this.l55.end + 0.6, this.l56.words[0]!.start - 0.3)] : [this.l56, Math.min(this.l56.end + 0.6, this.l57.words[0]!.start - 0.3)];
      if (t >= cl.words[0]!.start) { // (the kit shows its box 50 ms early: not as an empty box on the plate's first frames)
        captions(c, cl, t, { until: cu });
        const cb = captionBox(c, cl, t, cu); if (cb) punchGlow(g, ...cb);
      }
      post = mergePost(post, { zoom: 1 + 0.006 * f.a.kick }, punch(t, [this.WT.fw], 0.02), punch(t, [B.heavy], 0.035), hitShake(t, [B.heavy], 5, 0.3));
    } else {
      // ---------------- the living room: out of the glass, the kiss, the end card, the switch-off
      const pull = ease.inOutCubic(clamp((t - B.c - 0.18) / 1.65));
      const push = ease.inOutCubic(clamp((t - B.card) / 1.15));
      let cam = camLerp(CAM_TV, CAM_WIDE, pull);
      if (t >= B.c + 1.83) cam = camLerp(CAM_WIDE, CAM_TWO, ease.inOutQuad(clamp((t - B.c - 1.83) / (B.card - B.c - 1.83))));
      if (t >= B.card) { cam = camLerp(CAM_TWO, CAM_CRED, push); cam = { ...cam, z: cam.z * (1 + 0.025 * clamp((t - B.card - 1.15) / 4)) }; }
      const crt = clamp((CAM_TV.z - cam.z) / (CAM_TV.z - 2.6));
      const off = t - B.off, tvOn = off < 0.12;
      const onCard = t >= B.card;
      const tvCol = onCard ? '#a898ff' : '#8fb0ff';
      const tvLight = off < 0 ? 1 : clamp(1 - off / 0.2);
      const landAge = t - B.land, warm = landAge < 0 ? 0 : Math.min(1, landAge / 0.35) * (0.55 + 0.45 * Math.exp(-landAge * 1.6));
      for (const x of [c, g]) { x.save(); applyCam(x, cam); }
      const sl = { warm, heartT0: B.land + 0.1, rim: tvLight > 0.05 ? (onCard ? '#c8b8ff' : '#a8c4ff') : null };
      roomBack(c, t);
      furniture(c);
      sofa(c);
      tvCasing(c, g, tvOn);
      sleepers(c, g, t, sl);
      roomLight(c, g, t, cam, { tv: tvLight, tvCol, warm: warm * 0.5 });
      windowGlass(c, g, t);
      sleeperMarks(c, g, t, sl);
      if (off > 0.15) { // after the click the room sinks into the dark: the ring and the standby light are the last lights
        c.fillStyle = `rgba(3,2,10,${0.82 * ease.inOutQuad(clamp((off - 0.15) / 0.45))})`; c.fillRect(-2000, -2000, W + 4000, H + 4000);
      }
      tvLed(c, g, tvOn);
      const picture = onCard
        ? (cc: C2, gg: C2) => endCard(cc, gg, t, { t0: B.card, rows: B.rows, stab: B.stab, off: B.off } as CardTimes)
        : (cc: C2, gg: C2) => this.tvBeach(cc, gg, t);
      tvScreen(c, g, t, picture, { crt, zoom: cam.z, off: off >= 0 ? off : undefined });
      this.kissHeart(c, g, t);
      c.restore(); g.restore();
      captions(c, this.l57, t, { until: this.l57.end + 0.45 });
      const cb = captionBox(c, this.l57, t, this.l57.end + 0.45); if (cb) punchGlow(g, ...cb);
      post = mergePost(post, { bloom: 0.85, vignette: 0.42 + 0.2 * clamp((cam.z - 1) / 2) });
    }
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    return post;
  }

  /** The TV's picture in C: the beach broadcast, the in-TV cut to her close-up on "everybody". */
  tvBeach(c: C2, g: C2, t: number) {
    const B = this.B, k = t < B.closeup ? CAM_C1 : { ...CAM_C2, z: CAM_C2.z * (1 + 0.03 * clamp((t - B.closeup) / 2.5)) };
    for (const x of [c, g]) { x.save(); worldCam(x, k); }
    beachWorld(c, g, t, this.WT, { front: (cc, gg) => this.drawBeachFront(cc, gg, t) });
    c.restore(); g.restore();
    liveBug(c, g, t, 'LIVE · YAP');
  }

  /** Where a point of the beach world is in the room, through the close-up camera and the TV's glass. */
  worldToRoom(x: number, y: number, t: number): [number, number] {
    const B = this.B, k = { ...CAM_C2, z: CAM_C2.z * (1 + 0.03 * clamp((t - B.closeup) / 2.5)) };
    const tx = (x - k.x) * k.z + W / 2, ty = (y - k.y) * k.z + H / 2;
    return [RM.scr.x + (tx / W) * RM.scr.w, RM.scr.y + (ty / H) * RM.scr.h];
  }

  /** The blown kiss: a heart from her hand, out of the glass, across the room, onto the blanket. */
  kissHeart(c: C2, g: C2, t: number) {
    const B = this.B, t0 = B.blow + 0.12, age = t - t0, dur = B.land - t0;
    if (age < 0 || age > dur + 0.6) return;
    const K = BW.rai, cy = K.feet - 1.07 * K.R;
    const [x0, y0] = this.worldToRoom(K.x + 1.75 * K.R, cy - 1.0 * K.R, t0);
    const x1 = RM.land.x, y1 = RM.land.y;
    if (age <= dur) {
      const u = ease.inOutQuad(age / dur), cx = (x0 + x1) / 2, cyc = Math.min(y0, y1) - 170;
      const x = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x1 + 10 * Math.sin(age * 9) * (1 - u);
      const y = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cyc + u * u * y1;
      const s = (12 + 30 * Math.sin(Math.PI * Math.min(1, u * 1.1)) + 10 * u) * (1 + 0.08 * Math.sin(age * 14));
      for (let i = 1; i <= 6; i++) { // a sparkle trail
        const v = Math.max(0, u - i * 0.035), tx = (1 - v) * (1 - v) * x0 + 2 * (1 - v) * v * cx + v * v * x1, ty = (1 - v) * (1 - v) * y0 + 2 * (1 - v) * v * cyc + v * v * y1;
        star4(c, tx + 6 * Math.sin(i * 2.1 + age * 5), ty + 4 * Math.cos(i * 1.7), 4 * (1 - i / 7), rgbaHex('#ffd6e8', 1));
      }
      g.fillStyle = rgbaHex(HEX.pink, 0.2); g.beginPath(); g.arc(x, y, s * 0.95, 0, TAU); g.fill();
      heartShape(c, x, y + s * 0.3, s, HEX.pink);
      heartShape(c, x - s * 0.28, y - s * 0.05, s * 0.28, 'rgba(255,255,255,0.75)');
    } else { // landed: a soft burst of little hearts
      const v = (age - dur) / 0.6;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU + 0.4, r = 20 + 60 * ease.outCubic(v);
        heartShape(c, x1 + Math.cos(a) * r, y1 + Math.sin(a) * r * 0.6 - 20 * v, 7 * (1 - v), rgbaHex(HEX.pink, 1 - v));
      }
      g.fillStyle = rgbaHex(HEX.pink, 0.3 * (1 - v)); g.beginPath(); g.arc(x1, y1, 22 + 16 * v, 0, TAU); g.fill();
    }
  }
}
