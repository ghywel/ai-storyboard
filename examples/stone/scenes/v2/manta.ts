// v2 "THE DIVER": manta (53.96–76.67), chorus 1, lines 14–19, the ride. A giant manta glides out of the dark; the girl
// takes Rai's hand and they ride it up out of the deep into v3's cartoon blue, then down again past everything that
// is waiting, to the trader's iron wreck. Rai: joy, then wow, then serious. Shots (cut on the beat):
//
//   M1a "I'm___" (53.96) touch's last frame (the night set, her heart pink): far up in the dark a pale shape turns,
//      and a manta glides down out of the black, its belly lit by her torch. She plucks the torch from the sand and
//      stands; Rai wow, then joy; she takes Rai's hand; its belly sweeps over the lens (the wipe).
//   M1b "the stone at the bottom of the sea," (55.25, the downbeat) the take-off, side on: the manta climbs out of the
//      dark into the blue, wings beating on the downbeats; STONE forms out of bubbles above them and pops on "sea"
//      (Rai pops chibi, joy).
//   M2 "nobody's seen me but everybody believes;" (57.39) a wall of neon fish: they glide into it and vanish (nobody's
//      seen me); on "everybody" they burst out and the school parts round them, then swirls round them in a ring, every
//      fish turned to watch (everybody believes). The punch and the plate's one colour kick.
//   M3a "if you can count a thing" (60.39) low over the sand: a sea cucumber counts its spots, a number on each beat;
//      the manta's shadow passes over; the shark, for no particular reason.
//   M3b "you can't even see," (62.10) close on the riders: Rai counts on her fingers with it; on "can't even see" she
//      covers her eyes and keeps counting, grinning (chibi on "see"); the girl laughs.
//   M4 "who else is waiting..." 1 (64.24) high over a field of old rai stones half buried in the sand: as the manta's
//      shadow passes, their hearts light dimly, one by one (one wears a garland: weddings). Rai wow.
//   M5a "who else is waiting..." 2 (67.24) deeper, the light going green: a broken raft (a snapped pole, frayed rope,
//      an empty cradle the size of a stone: hers, from the lantern's storm) and a sunken outrigger canoe with fish
//      living in it. Rai wow, "!" at the raft, then a hand on her heart.
//   M5b (70.24, the held "sea___") the descent into the murk, close on the manta's back: the girl clicks her torch on;
//      an anchor chain rises into the dark ahead (the trader's). Rai, serious, gives her the little holed pebble on its
//      cord (GIVE_PENDANT) and loops it over her head; it glows faint pink at her chest.
//   M6a (72.38) the wreck looms out of the murk: the iron bow towering, rust, rivets, portholes, the anchor hanging
//      from its hawse; her torch's beam crosses the name painted on the bow: S.S. IRON HULL. Rai serious.
//   M6b "...bottom of the sea?" 3 (74.95) the manta banks low over the wreck's foredeck and drops them at the round
//      hatch, then glides off into the murk; the girl kneels with her torch pointed into the dark hold, Rai beside
//      her, serious; the pendant glows. Clean for wreck at 76.67.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../../engine/scene';
import { Layer2D, W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import type { Line, Word } from '../../engine/lyrics';
import { clamp, ease, lerp } from '../../engine/util';
import { drawRai, lastHands, h01, type RaiOpts, type Face, type ArmPose } from '../_rai';
import { FAM, rgbaHex, mixHex } from '../_motifs';
import { seabed, reed, shark, fishSchool } from '../_world';
import { poof, speedLines, star4 } from '../_manga';
import { mergePost, punch, caKick } from '../_post';
import { girl, manta, bubbleLyric, currentLine, clearGlowBand, GIRL_POSES, type GirlPose } from './_diver';
import {
  SET, TORCH_ANG, END_CAM, hushTime, applyCam, camLerp, clampCam, Soft, focus, reachArm, girlFrame, plantedTorch, marineSnow,
  bokehBubbles, glowPool, softBeam, falloff, warmWash, girlRim, slateBoard, sketch, graphite, raiDrawing, slateCorner, heartPts,
  sandWriting, coins, pebble, nightSeabed, nightReeds, softGlowBand, type Cam, type C2, type P, type Stroke,
} from './touch-props';
import {
  mantaSide, mantaFront, mantaBelow, neonFish, NEON, seaCucumber, buriedStone, brokenRaft, sunkenCanoe, anchorChain, wreckBow, wreckDeck,
  murk, bubbleLetters, bubbleWord, pebbleOnCord,
} from './manta-world';

/** Rai gives the girl the pebble pendant here, in the descent before the wreck (set false if wreck does it). */
export const GIVE_PENDANT = true;   // the one gift; wreck shows her wearing it and clutching it on "what could be lost"

const SIL = '#0d0a18', RIM = 'rgba(255,206,140,0.85)';
type Shot = 'M1a' | 'M1b' | 'M2' | 'M3a' | 'M3b' | 'M4' | 'M5a' | 'M5b' | 'M6a' | 'M6b';
const ORDER: Shot[] = ['M1a', 'M1b', 'M2', 'M3a', 'M3b', 'M4', 'M5a', 'M5b', 'M6a', 'M6b'];

const mixPose = (a: GirlPose, b: GirlPose, u: number): GirlPose => {
  const m = (x: number, y: number) => x + (y - x) * u;
  return { rot: m(a.rot, b.rot), hip: [m(a.hip[0], b.hip[0]), m(a.hip[1], b.hip[1])], knee: [m(a.knee[0], b.knee[0]), m(a.knee[1], b.knee[1])], sh: [m(a.sh[0], b.sh[0]), m(a.sh[1], b.sh[1])], el: [m(a.el[0], b.el[0]), m(a.el[1], b.el[1])], head: m(a.head ?? 0, b.head ?? 0), drop: m(a.drop ?? 0, b.drop ?? 0) };
};

export default class Manta extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  bg = new Soft(0.5);
  fg = new Soft(0.5);
  lines: Line[] = [];
  cut = {} as Record<Shot, number>;
  w: Record<string, Word> = {};
  stoneBubbles: { x: number; y: number; r: number; k: number }[] = [];
  draw: Stroke[] = [];
  bar = 1.714;
  beat = 0.4285;

  override init() {
    const { lyrics, audio: au, start, end } = this.ctx;
    this.lines = lyrics.lines.filter((l) => l.words[0]!.start >= start - 0.1 && l.words[0]!.start < end);
    const [l14, l15, l16, l17, l18, l19] = this.lines;
    const at = (s: number) => au.timeOfBeat(Math.floor(au.beatAt(s + 0.02)));
    const downAfter = (s: number) => au.downbeats.find((d) => d >= s - 0.01) ?? s;
    const find = (l: Line, re: RegExp, nth = 0) => l.words.filter((w) => re.test(w.w.toLowerCase().replace(/[^a-z']/g, '')))[nth] ?? l.words[0]!;
    this.w = {
      stone: find(l14!, /^stone/), sea: find(l14!, /^sea/), nobody: l15!.words[0]!, every: find(l15!, /^everybody/), believes: find(l15!, /^believes/),
      count: find(l16!, /^count/), cant: find(l16!, /^can't|^cant/), see: find(l16!, /^see/),
      who1: l17!.words[0]!, waiting1: find(l17!, /^waiting/), who2: l18!.words[0]!, sea2: find(l18!, /^sea/), who3: l19!.words[0]!, bottom3: find(l19!, /^bottom/),
    };
    this.beat = au.timeOfBeat(Math.floor(au.beatAt(start)) + 1) - au.timeOfBeat(Math.floor(au.beatAt(start)));
    this.bar = this.beat * 4;
    const m1b = downAfter(start + 0.8), m5b = at(l18!.words[0]!.start + 3.0);
    this.cut = {
      M1a: start, M1b: m1b, M2: at(l15!.words[0]!.start), M3a: at(l16!.words[0]!.start), M3b: downAfter(at(l16!.words[0]!.start) + 1.2),
      M4: at(l17!.words[0]!.start), M5a: at(l18!.words[0]!.start), M5b: m5b, M6a: downAfter(m5b + 1.8), M6b: at(this.w.bottom3!.start),
    };
    this.stoneBubbles = bubbleLetters('STONE', 250, 1230, 250, 15);
    this.draw = raiDrawing(0, 1);   // her finished drawing on the slate (touch's), for the first beat
  }

  shotAt(t: number): Shot {
    let s: Shot = 'M1a';
    for (const k of ORDER) if (t >= this.cut[k]) s = k;
    return s;
  }
  /** Wing beat: 1 at each downbeat (the down-stroke), from the beat grid. */
  flap(f: Frame) { return Math.cos(f.barPhase * Math.PI * 2); }

  /**
   * The riders on a side-on manta: the girl astride at the front (her torch in her front hand), Rai standing behind,
   * holding hands (Rai's right hand reaching, the girl's back hand finding it). Returns their anchors.
   */
  riders(c: C2, g: C2, seat: P, seat2: P, R: number, gh: number, t: number, ro: Partial<RaiOpts>, go: { glint?: 'plain' | 'spark' | 'droop' | 'wide'; hold?: boolean; torch?: boolean; pendant?: boolean; front?: GirlPose; emote?: 'joy' | 'heart'; emoteT0?: number; rim?: string; touchChest?: number } = {}) {
    const hold = go.hold !== false;
    const raiArms = (ro.arms as [ArmPose, ArmPose] | undefined) ?? ['up', 'reach'];
    const ra = drawRai(c, seat2.x, seat2.y - 1.07 * R, R, { t, glow: '#bfefff', glowStrength: 0.25, ...ro, arms: hold ? [raiArms[0], 'reach'] : raiArms } as RaiOpts);
    const hands = lastHands(), handsCopy = hands ? { l: { ...hands.l }, r: { ...hands.r } } : null;
    const u = gh / 100;
    const gy = seat.y + 13 * u;   // the ride pose sits its pelvis 13u above the feet line
    let p: GirlPose = go.front ?? GIRL_POSES.ride!(t);
    if (hold && hands) p = reachArm(seat.x, gy, gh, p, false, 0, hands.r, -1);
    if (go.touchChest && go.touchChest > 0) { // her back hand comes up to the pendant at her chest
      const fr = girlFrame(seat.x, gy, gh, p), pend = { x: fr.neck.x - fr.up.x * 8 * u + fr.fw.x * 6 * u, y: fr.neck.y - fr.up.y * 8 * u + fr.fw.y * 6 * u };
      const rest = { x: fr.shoulder.x + fr.dir(p.sh[0]).x * 28 * u, y: fr.shoulder.y + fr.dir(p.sh[0]).y * 28 * u }, k = go.touchChest;
      p = reachArm(seat.x, gy, gh, p, false, 0, { x: lerp(rest.x, pend.x, k), y: lerp(rest.y, pend.y, k) }, 1);
    }
    const an = girl(c, seat.x, gy, gh, p, { t, underwater: true, fins: true, slate: true, torch: go.torch !== false, pendant: go.pendant, glint: go.glint ?? 'spark', col: SIL, emote: go.emote, emoteT0: go.emoteT0 });
    if (go.rim) girlRim(c, seat.x, gy, gh, p, go.rim, { arm: false });
    return { rai: ra, girl: an, gy, pose: p, hands: handsCopy };
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t;
    this.L.clear('#02040c'); this.G.clear();
    const shot = this.shotAt(t);
    let post: PostOverrides = { bloom: 0.7 };
    switch (shot) {
      case 'M1a': post = mergePost(post, this.m1a(c, g, t, f)); break;
      case 'M1b': post = mergePost(post, this.m1b(c, g, t, f)); break;
      case 'M2': post = mergePost(post, this.m2(c, g, t, f)); break;
      case 'M3a': post = mergePost(post, this.m3a(c, g, t, f)); break;
      case 'M3b': post = mergePost(post, this.m3b(c, g, t, f)); break;
      case 'M4': post = mergePost(post, this.m4(c, g, t, f)); break;
      case 'M5a': post = mergePost(post, this.m5a(c, g, t, f)); break;
      case 'M5b': post = mergePost(post, this.m5b(c, g, t, f)); break;
      case 'M6a': post = mergePost(post, this.m6a(c, g, t, f)); break;
      case 'M6b': post = mergePost(post, this.m6b(c, g, t, f)); break;
    }
    const line = currentLine(this.lines, t);
    if (line) bubbleLyric(c, line, t);
    softGlowBand(g); clearGlowBand(g);
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    const chorusPulse = shot === 'M1b' || shot === 'M2' || shot === 'M3a' || shot === 'M3b' ? 0.008 * f.a.kick : 0.004 * f.a.kick;
    return mergePost(post, { zoom: 1 + chorusPulse });
  }

  // ---------------------------------------------------------------- M1a: out of the dark

  m1a(c: C2, g: C2, t: number, f: Frame): PostOverrides {
    const t0 = this.cut.M1a, t1 = this.cut.M1b, u = clamp((t - t0) / (t1 - t0)), tau = hushTime(t);
    const cam = clampCam(camLerp(END_CAM, { x: 1090, y: 500, z: 1.22 }, ease.inOutCubic(clamp((t - t0 - 0.25) / (t1 - t0 - 0.25)))));
    // the manta: far up in the dark, turning, then gliding down at us and over (set px, head-on, its belly to us)
    // it glides in from the far dark (edge-on and small), comes down towards them, then sweeps over the lens
    const a1 = ease.inOutQuad(clamp((t - t0) / 0.95)), sweep = ease.inQuad(clamp((t - t0 - 0.95) / (t1 - t0 - 0.95)));
    const mx = lerp(1180, 1010, a1) - 60 * sweep, my = lerp(240, 230, a1) + 120 * sweep, ms = lerp(0.18, 1.25, a1) + 6.5 * sweep * sweep, msy = lerp(0.25, 0.62, a1) + 0.3 * sweep;
    const light = clamp((a1 - 0.3) / 0.6);
    const holes = [{ x: 1160, y: 690, r: 680, soft: 0.95 }];
    focus(c, this.bg, 3 + 3 * u, (k) => { k.save(); applyCam(k, cam); nightSeabed(k, tau, holes, 0.8); k.restore(); });
    for (const k of [c, g]) { k.save(); applyCam(k, cam); }
    // legend's sand writing and her coins stay; the torch leaves the sand when she plucks it
    const pluck = t >= t0 + 0.42;
    sandWriting(c, 'RICHEST ROCK', 1150, 958, 70, 0.9);
    coins(c, g, 1080, 893, 1, t);
    pebble(c, 1372, 892, 1);
    let tipTorch: P | null = null;
    if (!pluck) tipTorch = plantedTorch(c, SET.torch.x, SET.torch.y, TORCH_ANG, 1.5);
    // Rai: her heart still pink from touch; she sees it: wow, then joy, reaching for the girl's hand
    const R = SET.rai.R, seen = t >= t0 + 0.22, joy = t >= t0 + 0.85;
    const ra = drawRai(c, SET.rai.x, SET.rai.y, R, {
      t, glow: HEX.pink, glowStrength: 0.75 * (1 - u) + 0.2, heart: 1 - 0.5 * u, heartColor: HEX.pink, look: seen ? -0.2 : 0, blush: 0.9 * (1 - u),
      face: joy ? 'joy' : seen ? 'wow' : 'smile', arms: joy ? ['reach', 'up'] : seen ? ['cheek', 'down'] : ['shrug', 'hold'],
      armsFrom: seen ? ['shrug', 'hold'] : undefined, armsU: clamp((t - t0 - 0.22) / 0.2), marks: seen && !joy ? ['!'] : ['sparkle'], markT0: seen && !joy ? t0 + 0.24 : joy ? t0 + 0.87 : -1e9,
      hop: joy ? 0.12 * Math.abs(Math.sin((t - t0 - 0.85) * 7)) : 0, tilt: -0.04 * clamp((t - t0 - 0.2) / 0.3),
    } as RaiOpts);
    void ra;
    const hands = lastHands();
    // the girl: up off her knees, the slate swung to her hip, the torch plucked and aimed up at it; her back hand
    // finds Rai's
    const gh = 480, gx = 862, gy = SET.floor + 5, rise = ease.inOutCubic(clamp((t - t0 - 0.3) / 0.45));
    const kneel = { ...GIRL_POSES.kneel!(t), rot: 0.06 };
    const stand: GirlPose = { rot: -0.05, hip: [-0.1, 0.12], knee: [-0.15, -0.05], sh: [-0.6, 2.5], el: [0.3, 0.15], head: -0.2 };
    let p = mixPose(kneel, stand, rise);
    if (joy && hands) p = reachArm(gx, gy, gh, p, false, 0, hands.l, 1);
    const slateUp = 1 - ease.inOutCubic(clamp((t - t0 - 0.05) / 0.3));
    if (slateUp > 0.6) { // still holding the slate up as touch left her: a hand on each edge
      const sm = slateBoard(NULLC, lerp(980, 1010, slateUp), lerp(760, 615, slateUp), lerp(0.3, 0.92, slateUp), 0.05, {});
      const hl = sm.transformPoint(new DOMPoint(-100, 110)), hr = sm.transformPoint(new DOMPoint(112, 40));
      p = reachArm(gx, gy, gh, kneel, false, 0, { x: hl.x, y: hl.y }, 1);
      p = reachArm(gx, gy, gh, p, false, 1, { x: hr.x + 4, y: hr.y }, 1);
    }
    if (slateUp > 0.02) slateBoard(c, lerp(980, 1010, slateUp), lerp(760, 615, slateUp), lerp(0.3, 0.92, slateUp), 0.05, { pencil: 'hang', draw: (k) => { slateCorner(k); sketch(k, this.draw, 2, graphite); graphite(k, heartPts(0, 103, 23), 1, '#2a2a33', 6.5); } });
    const an = girl(c, gx, gy, gh, p, { t, underwater: true, fins: true, slate: slateUp <= 0.02, torch: pluck, glint: t > t0 + 0.6 ? 'spark' : seen ? 'wide' : 'spark', col: SIL, pendant: false });
    girlRim(c, gx, gy, gh, p, rgbaHex(HEX.pink, 0.85 * (1 - u)), { arm: false });
    // the manta, its belly lit by her torch as it comes
    mantaBelow(c, mx, my, ms, msy, t, { flap: Math.cos(f.barPhase * Math.PI * 2) * 0.6, light: 0.2 + 0.8 * light, bank: 0.1 * Math.sin(t * 1.3) - 0.1 * sweep });
    warmWash(c, SET.torch.x + 40, SET.torch.y - 80, 560, '#ffb060', 0.1 * (pluck ? 0.5 : 1));
    falloff(c, 1150, 650, 300, 1000, 0.6 * (1 - 0.4 * light));
    if (tipTorch) softBeam(g, tipTorch.x, tipTorch.y, TORCH_ANG, Math.hypot(SET.aim.x - tipTorch.x, SET.aim.y - tipTorch.y) + 30, 0.26);
    if (an.torch) softBeam(g, an.torch.x, an.torch.y, an.torch.ang, 640, 0.22, 0.9 * clamp((t - t0 - 0.42) / 0.1));
    glowPool(g, SET.rai.x, SET.rai.y - 0.12 * SET.rai.R, 260, HEX.pink, 0.2 * (1 - u));
    marineSnow(c, g, tau, an.torch ? { x: an.torch.x, y: an.torch.y, ang: an.torch.ang, len: 700, spread: 0.24 } : null, 110, 7, { x: 500, y: 150, w: 1100, h: 800 });
    for (const k of [c, g]) k.restore();
    focus(c, this.fg, 9, (k) => { nightReeds(k, tau, 4); bokehBubbles(k, tau, 6, 5, 0.9); });
    // the wipe: its belly passes over the lens
    const wipe = clamp((t - (t1 - 0.2)) / 0.2);
    if (wipe > 0) { c.fillStyle = rgbaHex('#0a1222', ease.inCubic(wipe)); c.fillRect(0, 0, W, H * ease.outCubic(wipe) + 2); }
    return {};
  }

  // ---------------------------------------------------------------- M1b: the take-off, STONE in bubbles

  m1b(c: C2, g: C2, t: number, f: Frame): PostOverrides {
    const w = this.w, t0 = this.cut.M1b, t1 = this.cut.M2, u = clamp((t - t0) / (t1 - t0));
    const up = ease.outCubic(clamp((t - t0) / 1.0)), pan = 700 * (t - t0) + 120 * (t - t0) * (t - t0);
    seabed(c, t, { depth: lerp(0.85, 0.4, up), floor: H * 0.84, pan, seed: 21, clues: ['stone', 'shells'], shark: false });
    fishSchool(c, t, H * 0.3, 0.7, 8, 77, HEX.cyan, pan * 0.5, 0.9);
    const flap = this.flap(f), seaT = w.sea!.start;
    const mx = 760 + 40 * Math.sin(t * 1.1), my = lerp(700, 520, up) - 26 * flap, pitch = lerp(-0.28, -0.06, up) + 0.04 * flap;
    // the riders' acting: joy, whee; on "sea" Rai pops chibi
    const sd = t >= seaT + 0.02 && t < seaT + 0.5;
    const seat = mantaSide(c, mx, my, 1.25, t, { flap, pitch, lit: up });
    this.riders(c, g, seat.seat, seat.seat2, 62, 175, t, {
      face: sd ? 'joy' : 'joy', sd, arms: ['up', 'reach'], hop: 0.08 * Math.max(0, -flap), squash: flap > 0.8 ? -0.12 : 0, tilt: pitch * 0.6,
      marks: ['sparkle'], markT0: t0 + 0.3,
    }, { glint: 'spark' });
    poof(c, seat.seat2.x, seat.seat2.y - 80, 110, t, seaT + 0.02);
    poof(c, seat.seat2.x, seat.seat2.y - 80, 110, t, seaT + 0.5);
    // the climb's streaks and the dark falling away below
    speedLines(c, -0.06, 'rgba(220,250,255,0.5)', t, { n: 30, alpha: 0.35 * (1 - u * 0.5), band: [80, 700] });
    c.fillStyle = rgbaHex('#02040c', 0.82 * (1 - up)); c.fillRect(0, 0, W, H);
    // STONE in bubbles: they rise into the word on "stone", and pop on "sea"
    bubbleWord(c, g, this.stoneBubbles, t, t0 + 0.05, seaT - 0.08, 0.42);
    // the near reeds rush past
    for (let i = 0; i < 5; i++) { const x = ((h01(i, 3) * (W + 600) - pan * 1.8) % (W + 600) + W + 600) % (W + 600) - 300; reed(c, x, H + 30, 260 + 200 * h01(i, 4), t, i + 40, '#0f5a3a', 34); }
    return mergePost(punch(t, [seaT], 0.03), punch(t, [t0], 0.02));
  }

  // ---------------------------------------------------------------- M2: the school

  m2(c: C2, g: C2, t: number, f: Frame): PostOverrides {
    const w = this.w, t0 = this.cut.M2, tb = w.every!.start, tbl = w.believes!.start;
    const pan = 160 * (t - t0);
    seabed(c, t, { depth: 0.35, floor: H * 0.9, pan, seed: 23, clues: ['shells'], shark: false });
    const flap = this.flap(f);
    // the manta glides in from the left into the school, and out of it on "everybody"
    const into = ease.outCubic(clamp((t - t0) / (tb - t0 - 0.1)));
    const burst = clamp((t - tb) / 0.45), out = ease.outCubic(burst);
    const mx = lerp(-260, 660, into) + 330 * out + 40 * (t - tb > 0 ? (t - tb) : 0), my = 520 - 22 * flap;
    const centre: P = { x: mx + 70, y: my - 30 };
    // the school: a wall of neon fish, swimming left; on the burst they part round the manta, then swirl round them
    const N = 300, swirl = clamp((t - tbl) / 0.8);
    const fishAt = (i: number) => {
      const bx = 220 + 1500 * h01(i, 1), by = 230 + 520 * Math.pow(h01(i, 2), 0.9), drift = ((t - t0) * (60 + 40 * h01(i, 3)));
      let x = ((bx - drift - pan * 0.3) % 1700 + 1700) % 1700 + 110, y = by + 12 * Math.sin(t * 2 + i);
      let dir = -1;
      if (burst > 0) {
        const dx = x - centre.x, dy = y - centre.y, d = Math.hypot(dx, dy) + 1e-3, ring = 300 + 260 * h01(i, 4);
        const r = lerp(d, Math.max(d, ring), out);
        let a = Math.atan2(dy, dx);
        if (swirl > 0) a += swirl * (t - tbl) * (0.9 + 0.4 * h01(i, 5));
        x = centre.x + Math.cos(a) * r * (1 + 0.15 * swirl); y = centre.y + Math.sin(a) * r * 0.62;
        dir = swirl > 0.2 ? (Math.sin(a) > 0 ? -1 : 1) : (dx > 0 ? 1 : -1);
      }
      return { x, y, dir, s: 17 + 15 * h01(i, 6), col: NEON[i % NEON.length]! };
    };
    for (let i = 0; i < N; i += 2) { const q = fishAt(i); neonFish(c, g, q.x, q.y, q.s * 0.8, q.col, q.dir, t, i, 0.14); }
    const seat = mantaSide(c, mx, my, 1.15, t, { flap, pitch: -0.04 + 0.05 * flap, lit: 1 });
    const wow = t >= tb && t < tb + 0.5;
    this.riders(c, g, seat.seat, seat.seat2, 58, 165, t, {
      face: t < tb ? 'smug' : wow ? 'wow' : 'joy', arms: t < tb ? ['cross', 'reach'] : ['up', 'reach'], hop: t > tb ? 0.1 * Math.max(0, -flap) : 0,
      marks: t < tb ? [] : wow ? ['!'] : ['sparkle'], markT0: wow ? tb : tb + 0.5,
    }, { glint: t >= tb ? 'spark' : 'plain', emote: t >= tbl ? 'joy' : undefined, emoteT0: tbl });
    // the front half of the school covers them until the burst ("nobody's seen me")
    for (let i = 1; i < N; i += 2) { const q = fishAt(i); neonFish(c, g, q.x, q.y, q.s, q.col, q.dir, t, i, 0.18); }
    if (burst > 0 && burst < 1) speedLines(c, 0, 'rgba(255,255,255,0.8)', t, { n: 50, alpha: 0.6 * (1 - burst), band: [180, 820] });
    if (t >= tb && t < tb + 0.6) glowPool(g, centre.x, centre.y, 420, '#bff6ff', 0.3 * (1 - (t - tb) / 0.6));
    return mergePost(punch(t, [tb], 0.035, 0.4), caKick(t, [tb], 4, 0.3));
  }

  // ---------------------------------------------------------------- M3a: the sea cucumber counts its spots

  m3a(c: C2, g: C2, t: number, f: Frame): PostOverrides {
    const t0 = this.cut.M3a, t1 = this.cut.M3b, pan = 140 * (t - t0);
    seabed(c, t, { depth: 0.42, floor: H * 0.44, pan, seed: 31, clues: ['shells', 'coin'], shark: false });
    // the shark, for no particular reason
    shark(c, lerp(2200, -400, clamp((t - t0) / (t1 - t0 + 0.8))), 300 + 10 * Math.sin(t), 110, -1, t, '#4a74a8');
    const count = clamp((t - t0) / this.beat + 1, 0, 4.99);
    // the manta's shadow sweeps over the sand, and the manta passes overhead
    const mu = clamp((t - t0) / (t1 - t0)), mx = lerp(-300, 2100, mu), flap = this.flap(f);
    c.save(); c.fillStyle = 'rgba(10,30,60,0.25)'; c.beginPath(); c.ellipse(mx - 60, 690, 300, 46, 0, 0, Math.PI * 2); c.fill(); c.restore();
    seaCucumber(c, g, 980 - pan * 0.4, 640, 1.45, t, count);
    const seat = mantaSide(c, mx, 230 - 14 * flap, 0.8, t, { flap, pitch: 0.02, lit: 1 });
    this.riders(c, g, seat.seat, seat.seat2, 40, 112, t, { face: 'smile', arms: ['fist', 'reach'], look: 0.4 }, { glint: 'spark' });
    const hh = lastHands();
    void hh;
    return {};
  }

  // ---------------------------------------------------------------- M3b: counting what you can't see

  m3b(c: C2, g: C2, t: number, f: Frame): PostOverrides {
    const w = this.w, t0 = this.cut.M3b, pan = 520 * (t - t0);
    seabed(c, t, { depth: 0.42, floor: H * 1.02, pan, seed: 33, clues: [], shark: false });
    fishSchool(c, t, H * 0.25, 0.6, 7, 91, HEX.lime, pan * 0.3, 0.8);
    const flap = this.flap(f), cant = w.cant!.start, see = w.see!.start;
    const covering = t >= cant, sd = t >= see && t < see + 0.55;
    const mx = 760, my = 760 - 20 * flap;
    const seat = mantaSide(c, mx, my, 2.3, t, { flap: flap * 0.7, pitch: -0.03, lit: 1 });
    // her count goes on with the beat: 5, 6 ... then eyes covered: 7, 8, 9
    const n = Math.floor((t - this.cut.M3a) / this.beat) + 1;
    const R = 108;
    const r = this.riders(c, g, seat.seat, seat.seat2, R, 300, t, {
      face: sd ? 'cheeky' : covering ? 'grin' : 'smile', sd, arms: covering ? ['fist', 'facepalm'] : ['fist', 'reach'], look: covering ? 0 : -0.5,
      tilt: covering ? 0.08 : 0, marks: sd ? ['sparkle'] : [], markT0: see,
    }, { glint: 'spark', hold: !covering, emote: covering ? 'joy' : undefined, emoteT0: cant + 0.15 });
    // her counting hand: fingers up, the number popping beside it
    if (!sd) {
      const hand = r.hands ? r.hands.l : { x: seat.seat2.x - 1.3 * R, y: seat.seat2.y - 2.37 * R };
      countFingers(c, hand, R, Math.min(5, ((n - 1) % 5) + 1));
      const k = clamp(((t - this.cut.M3a) / this.beat) % 1 * 4);
      c.save(); c.translate(hand.x - R * 0.7, hand.y - R * 0.55); c.scale(0.6 + 0.4 * ease.outBack(k), 0.6 + 0.4 * ease.outBack(k));
      c.font = font(FAM.hook(), R * 0.7); c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
      c.lineWidth = R * 0.1; c.strokeStyle = '#120d1d'; c.strokeText(String(n), 0, 0); c.fillStyle = HEX.yellow; c.fillText(String(n), 0, 0);
      c.restore();
    }
    poof(c, seat.seat2.x, seat.seat2.y - 1.6 * R, R * 1.4, t, see);
    poof(c, seat.seat2.x, seat.seat2.y - 1.6 * R, R * 1.4, t, see + 0.55);
    void r;
    for (let i = 0; i < 4; i++) { const x = ((h01(i, 13) * (W + 600) - pan * 1.6) % (W + 600) + W + 600) % (W + 600) - 300; reed(c, x, H + 30, 300 + 200 * h01(i, 14), t, i + 60, '#0f5a3a', 36); }
    return punch(t, [see], 0.02);
  }

  // ---------------------------------------------------------------- M4: the field of old stones

  m4(c: C2, g: C2, t: number, f: Frame): PostOverrides {
    const t0 = this.cut.M4, t1 = this.cut.M5a, u = clamp((t - t0) / (t1 - t0)), pan = 150 * (t - t0);
    seabed(c, t, { depth: 0.6, floor: H * 0.2, pan, seed: 41, clues: [], shark: false });
    // the stones, far to near, half buried; the manta's shadow lights their hearts as it passes
    const mx = lerp(80, 1700, ease.inOutQuad(u)), my = 360;
    const shadowX = mx + 60;
    const stones = Array.from({ length: 17 }, (_, i) => ({ i, d: h01(i, 501) })).sort((a, b) => a.d - b.d);
    for (const { i, d } of stones) {
      const y = H * (0.3 + 0.62 * d), r = 18 + 70 * d, x = ((h01(i, 502) * (W + 300) - pan * (0.6 + 0.6 * d)) % (W + 300) + W + 300) % (W + 300) - 150;
      const lit = clamp((shadowX - x) / 160) * (0.55 + 0.45 * h01(i, 503));
      buriedStone(c, g, x, y, r, i + 3, lit, (h01(i, 504) - 0.5) * 0.4, i === 7);
    }
    // the manta from above (the kit's), its shadow on the sand below it, the riders on its back
    const flap = this.flap(f);
    c.save(); c.fillStyle = 'rgba(10,25,50,0.28)'; c.translate(shadowX, my + 330); c.scale(1.2, 0.45); c.beginPath(); c.moveTo(0, -220); c.lineTo(300, 0); c.lineTo(0, 120); c.lineTo(-300, 0); c.closePath(); c.fill(); c.restore();
    const wow = t >= this.w.waiting1!.start;
    const seat = mantaSide(c, mx, my - 22 * flap, 1.0, t, { flap, pitch: 0.05, lit: 0.8 });
    this.riders(c, g, seat.seat, seat.seat2, 48, 135, t, {
      face: wow ? 'wow' : 'smile', arms: wow ? ['cheek', 'reach'] : ['up', 'reach'], look: -0.3, marks: wow ? ['sparkle'] : [], markT0: this.w.waiting1!.start,
    }, { glint: 'wide' });
    return {};
  }

  // ---------------------------------------------------------------- M5a: the raft and the canoe

  m5a(c: C2, g: C2, t: number, f: Frame): PostOverrides {
    const t0 = this.cut.M5a, t1 = this.cut.M5b, pan = 280 * (t - t0);
    seabed(c, t, { depth: 0.75, floor: H * 0.52, pan, seed: 51, clues: ['shells'] });
    murk(c, 0.32, '#0b3a34', 0, H);
    const raftX = 700 - pan, canoeX = 1750 - pan;
    brokenRaft(c, raftX, H * 0.66, 1.35, t);
    sunkenCanoe(c, canoeX, H * 0.69, 1.3, t, g);
    const flap = this.flap(f);
    const seat = mantaSide(c, 1000, 270 - 18 * flap, 0.95, t, { flap, pitch: 0.06, lit: 0.6 });
    const sawRaft = t >= t0 + 0.35, atCanoe = t >= t0 + 1.7;
    this.riders(c, g, seat.seat, seat.seat2, 48, 135, t, {
      face: atCanoe ? 'soft' : sawRaft ? 'wow' : 'smile', arms: atCanoe ? ['hold', 'reach'] : sawRaft ? ['cheek', 'reach'] : ['down', 'reach'], look: -0.6,
      marks: sawRaft && !atCanoe ? ['!'] : [], markT0: t0 + 0.35,
    }, { glint: atCanoe ? 'droop' : 'wide' });
    falloff(c, W / 2, H * 0.6, 500, 1300, 0.4);
    return {};
  }

  // ---------------------------------------------------------------- M5b: into the murk; the pendant

  m5b(c: C2, g: C2, t: number, f: Frame): PostOverrides {
    const t0 = this.cut.M5b, t1 = this.cut.M6a, pan = 120 * (t - t0);
    const u = clamp((t - t0) / (t1 - t0));
    const tOn = t0 + 0.12, tOut = t0 + 0.3, tUp = t0 + 0.8, tOver = t0 + 1.15, tDone = t0 + 1.45;
    // the camera leans in on the two of them for the gift
    const push = ease.inOutCubic(clamp((t - t0 - 0.2) / 1.0));
    const cam: Cam = { x: lerp(960, 820, push), y: lerp(540, 560, push), z: 1 + 0.32 * push };
    for (const k of [c, g]) { k.save(); applyCam(k, cam); }
    seabed(c, t, { depth: 0.95, floor: H * 1.04, pan, seed: 53, clues: [], shark: false });
    murk(c, 0.72 + 0.2 * u, '#0b3530', 0, H);
    // the trader's anchor chain, rising out of the dark ahead
    anchorChain(c, { x: 1980 - pan * 0.5, y: 1150 }, { x: 1300 - pan * 0.5, y: -120 }, 26, '#5a3a28', { y0: 900, y1: -100 });
    const flap = this.flap(f) * 0.6;
    const seat = mantaSide(c, 700, 760 - 14 * flap, 2.3, t, { flap, pitch: -0.02, lit: 0.3 });
    const R = 108, gh = 300;
    // the gift: Rai brings out the little holed pebble on its cord and loops it over the girl's head
    const give = GIVE_PENDANT;
    const serious = !give || t < tOut || t > tDone + 0.55;
    const raiArms: [ArmPose, ArmPose] = !give ? ['down', 'reach'] : t < tOut ? ['down', 'reach'] : t < tUp ? ['hold', 'reach'] : t < tOver ? ['hold', 'up'] : ['hold', 'reach'];
    const r = this.riders(c, g, seat.seat, seat.seat2, R, gh, t, {
      face: serious ? 'serious' : t < tDone ? 'soft' : 'smile', arms: raiArms, look: serious ? 0.8 : -0.4,
      armsFrom: give && t >= tUp && t < tOver ? ['hold', 'reach'] : undefined, armsU: clamp((t - tUp) / 0.2),
      marks: give && t >= tDone && t < tDone + 0.6 ? ['sparkle'] : [], markT0: tDone,
    }, {
      glint: give && t > tDone + 0.2 ? 'spark' : 'plain', hold: !give || t < tOut, pendant: give && t >= tDone, rim: 'rgba(170,230,220,0.6)',
      touchChest: give ? ease.inOutCubic(clamp((t - tDone - 0.1) / 0.3)) : 0, emote: give && t >= tDone + 0.25 ? 'heart' : undefined, emoteT0: tDone + 0.25,
    });
    // the torch clicks on
    if (r.girl.torch && t >= tOn) {
      const flick = t < tOn + 0.08 ? (Math.floor((t - tOn) * 60) % 2 ? 0.3 : 1) : 1;
      softBeam(g, r.girl.torch.x, r.girl.torch.y, -0.08, 1000, 0.17, 0.75 * flick);
    }
    if (give && t >= tOut && t < tDone) { // the pebble travels from her hand, over the girl's head, to her neck
      const start = r.hands ? r.hands.r : { x: seat.seat2.x + 1.75 * R, y: seat.seat2.y - 2 * R };
      const head = r.girl.head, chest = r.girl.chest;
      const k = clamp((t - tUp) / (tDone - tUp));
      const a = t < tUp ? start : { x: lerp(lerp(start.x, head.x, k), lerp(head.x, chest.x + 18, k), k), y: lerp(lerp(start.y + 30, head.y - 90, k), lerp(head.y - 90, chest.y, k), k) };
      pebbleOnCord(c, g, a.x, a.y + 26, 2.6, t, 0.7, 1 - 0.6 * k);
    }
    if (give && t >= tDone && r.girl.pendant) {
      const pg = clamp((t - tDone) / 0.3);
      glowPool(g, r.girl.pendant.x, r.girl.pendant.y, 46, HEX.pink, 0.4 * pg * (0.85 + 0.15 * Math.sin(t * 5)));
      if (t < tDone + 0.35) star4(g, r.girl.pendant.x + 6, r.girl.pendant.y - 6, 26 * (1 - (t - tDone) / 0.35), '#fff6c8');
    }
    marineSnow(c, g, t, null, 120, 21);
    falloff(c, 900, 600, 500, 1500, 0.42);
    for (const k of [c, g]) k.restore();
    return {};
  }

  // ---------------------------------------------------------------- M6a: the wreck looms

  m6a(c: C2, g: C2, t: number, f: Frame): PostOverrides {
    const t0 = this.cut.M6a, t1 = this.cut.M6b, u = clamp((t - t0) / (t1 - t0));
    const cam: Cam = { x: 960 + 30 * u, y: 540 - 10 * u, z: 1.02 + 0.08 * ease.inOutCubic(u) };
    for (const k of [c, g]) { k.save(); applyCam(k, cam); }
    seabed(c, t, { depth: 0.98, floor: H * 0.93, pan: 60 * (t - t0), seed: 61, clues: [], shark: false });
    murk(c, 0.62, '#0b3530', 0, H);
    const beamX = lerp(-0.1, 1.05, ease.inOutCubic(clamp((t - this.w.who3!.start + 0.2) / 1.4)));
    const bow = wreckBow(c, g, 860, 1010, 1.05, t, { beamX, beamA: clamp((t - this.w.who3!.start + 0.3) / 0.3) });
    anchorChain(c, { x: bow.hawse.x, y: bow.hawse.y + 30 }, { x: 600, y: 1080 }, 16, '#5a3a28');
    // it comes out of the murk: the fog thins as we near it
    murk(c, lerp(0.9, 0.32, ease.outCubic(clamp((t - t0) / 1.1))), '#0c3a32', 0, H);
    // the manta in the foreground, gliding towards it; her torch on the name
    const flap = this.flap(f) * 0.8, mx = lerp(220, 520, u), my = 760 - 16 * flap;
    const seat = mantaSide(c, mx, my, 1.05, t, { flap, pitch: -0.06, lit: 0.2, glowEdge: 'rgba(170,230,220,0.35)' });
    const r = this.riders(c, g, seat.seat, seat.seat2, 50, 140, t, { face: 'serious', arms: ['down', 'reach'], look: 0.8 }, { glint: 'wide', pendant: GIVE_PENDANT, rim: 'rgba(170,230,220,0.6)' });
    if (r.girl.torch) {
      const tx = lerp(bow.name0.x, bow.name1.x, beamX), ty = lerp(bow.name0.y, bow.name1.y, beamX), ang = Math.atan2(ty - r.girl.torch.y, tx - r.girl.torch.x);
      softBeam(g, r.girl.torch.x, r.girl.torch.y, ang, Math.hypot(tx - r.girl.torch.x, ty - r.girl.torch.y), 0.11, 0.9 * clamp((t - this.w.who3!.start + 0.3) / 0.3));
    }
    if (GIVE_PENDANT && r.girl.pendant) glowPool(g, r.girl.pendant.x, r.girl.pendant.y, 26, HEX.pink, 0.35);
    marineSnow(c, g, t, null, 140, 27);
    for (const k of [c, g]) k.restore();
    return {};
  }

  // ---------------------------------------------------------------- M6b: dropped at the hatch

  m6b(c: C2, g: C2, t: number, f: Frame): PostOverrides {
    const t0 = this.cut.M6b, t1 = this.ctx.end, u = clamp((t - t0) / (t1 - t0));
    c.fillStyle = '#071a1e'; c.fillRect(0, 0, W, H);
    const fog = c.createLinearGradient(0, 0, 0, H * 0.5); fog.addColorStop(0, '#0d3236'); fog.addColorStop(1, '#071a1e');
    c.fillStyle = fog; c.fillRect(0, 0, W, H * 0.5);
    const hatch: P = { x: 1010, y: 800 }, hr = 175;
    wreckDeck(c, g, t, hatch, hr);
    murk(c, 0.35, '#0a2c30', 0, H * 0.7);
    // the manta banks in low over the deck, they hop off by the hatch, and it glides away into the murk
    const flap = this.flap(f), drop = t0 + 0.6, land = drop + 0.38;
    const inU = ease.outCubic(clamp((t - t0) / (drop - t0))), awayU = ease.inQuad(clamp((t - drop) / (t1 - drop + 0.3)));
    const mx = lerp(150, 880, inU) + 1300 * awayU, my = lerp(380, 470, inU) - 380 * awayU - 14 * flap, bank = 0.12 - 0.12 * inU - 0.35 * awayU;
    const seat = mantaSide(c, mx, my, 1.35, t, { flap, pitch: bank, lit: 0.2, glowEdge: 'rgba(170,230,220,0.35)' });
    const gl = { x: 770, y: 840 }, rl = { x: 1300, y: 770 }, R = 84, gh = 250;
    if (t < drop) {
      this.riders(c, g, seat.seat, seat.seat2, R, gh, t, { face: 'determined', arms: ['down', 'reach'], look: 0.6 }, { glint: 'wide', pendant: GIVE_PENDANT });
    } else {
      // the hop off: arcs from the seat to the deck
      const k = clamp((t - drop) / (land - drop)), arc = Math.sin(k * Math.PI) * 90;
      const gx = lerp(seat.seat.x, gl.x, k), gy = lerp(seat.seat.y + 13 * gh / 100, gl.y, k) - arc;
      const rx = lerp(seat.seat2.x, rl.x, k), ry = lerp(seat.seat2.y, rl.y, k) - arc;
      const landed = t >= land, sq = landed ? -0.22 * Math.max(0, 1 - (t - land) / 0.18) : 0;
      const kneel = { ...GIRL_POSES.kneel!(t), sh: [-0.3, 1.35] as [number, number], el: [0.3, 0.25] as [number, number], rot: 0.18 };
      const p = landed ? kneel : GIRL_POSES.float!(t);
      drawRai(c, rx, ry - 1.07 * R, R, { t, face: landed ? 'serious' : 'determined', arms: landed ? ['down', 'chin'] : ['up', 'up'], look: -0.7, squash: sq, glow: '#9fe6dc', glowStrength: 0.25 });
      const an = girl(c, gx, gy, gh, p, { t, underwater: true, fins: true, slate: true, torch: true, pendant: GIVE_PENDANT, glint: landed ? 'wide' : 'spark', col: SIL });
      girlRim(c, gx, gy, gh, p, 'rgba(170,230,220,0.6)', { arm: false });
      if (an.torch) {
        const ang = landed ? Math.atan2(hatch.y - an.torch.y, hatch.x - an.torch.x) : an.torch.ang;
        softBeam(g, an.torch.x, an.torch.y, ang, landed ? Math.hypot(hatch.x - an.torch.x, hatch.y - an.torch.y) + 60 : 500, 0.22, 1.2);
        if (landed) glowPool(g, hatch.x - 30, hatch.y - 10, 140, '#ffe0a0', 0.25 * clamp((t - land) / 0.3));
      }
      if (GIVE_PENDANT && an.pendant) glowPool(g, an.pendant.x, an.pendant.y, 34, HEX.pink, 0.4);
    }
    falloff(c, 1010, 720, 420, 1200, 0.5);
    marineSnow(c, g, t, null, 130, 33);
    void u;
    return {};
  }
}

/** A context that draws nothing (to ask the slate for its matrix). */
const NULLC: C2 = (() => { const cv = document.createElement('canvas'); cv.width = 2; cv.height = 2; return cv.getContext('2d')!; })();

/** Rai counting on her fingers: stubby fingers raised from a fist (the kit's fist is a rounded block). */
function countFingers(c: C2, hand: P, R: number, n: number) {
  c.save(); c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.32, L = R * (i === 0 && n === 5 ? 0.2 : 0.26);
    const x0 = hand.x + Math.cos(a) * R * 0.1, y0 = hand.y + Math.sin(a) * R * 0.1;
    c.strokeStyle = '#3a2f2a'; c.lineWidth = R * 0.1; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + Math.cos(a) * L, y0 + Math.sin(a) * L); c.stroke();
    c.strokeStyle = '#d9cfb8'; c.lineWidth = R * 0.06; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + Math.cos(a) * L, y0 + Math.sin(a) * L); c.stroke();
  }
  c.restore();
}
void star4; void mixHex; void sketch; void Soft;
