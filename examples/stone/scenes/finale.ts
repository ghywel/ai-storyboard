// FINALE: the final chorus (lines 75-82), the loudest plateau of the song, at dawn on Yap. The idea: the ring. A zero
// is a ring around nothing; here the ring is people holding hands around the stone, and their agreement is what
// lights every carer's stone (each with its owner beside it, cheering, hugging it, crying for joy). Every neon at once
// (each line's sunburst cycles cyan, pink, lime, yellow), the gold harmonograph behind Rai, and Rai acting every line:
// fierce at the open, sassy on "say it for her", a chibi stomp on "or don't count", serious and determined on "agree
// that it's real", joyful flight when lifted, love at "a word you agreed", a huge joy with sparkles on LOUD.
// Shots (each cut on the beat at or before its line's or word's start; the COUNT page builds a panel every 2 beats):
//   open     "I'm the stone at the bottom of the sea,"  close and low on Rai, fierce, the sun behind her head throwing
//            every neon; STONE/BOTTOM/SEA stacked; line 74's "…at three." finishes in the band across the cut
//   reveal   "and I'm worth what you say,"   pull back through the ring; she points at them; they all say a heart
//   sayit    "so say it for her, and for me:"  SAY IT; sassy; points at the woman up the road (her stone lights),
//            then hand on her own heart (hers lights)
//   nights / meals / care   the COUNT page: a panel per "count" (finale-panels.ts)
//   dont     "or don't count,"   chibi Rai stomps in front of the page; the COUNTs fall off; the tallies turn to hearts
//   agree    "but agree that it's real,"   the ring joins hands in a wave; Rai serious, then determined; REAL
//   money    "'cause that's what money's about."   crane up over the ring of light; every carer's stone lights,
//            its owner cheering
//   wide     "I'm the stone at the bottom of the sea,"   the great wide of the cove; Rai bouncing for joy
//   lift     "you lifted me up"   arms up, beams, and Rai flies up out of the ring; LIFTED
//   up       "with a word you agreed;"   looking up at her in love, on everyone's "yes"; AGREED
//   choose / honour   "so choose what you honour,"   the carers along the beach; Rai picks; HONOUR, all of them
//   loud     "and honour it loud."   HONOUR IT, then LOUD: every neon, sparkles, the crowd cheering
//   gold     "I'm the stone at the bottom of the sea."   gold: the line big over the island; the song's last hit
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { HEX } from '../engine/palette';
import { font } from '../engine/type';
import type { Line, Word } from '../engine/lyrics';
import { clamp, ease, lerp } from '../engine/util';
import { drawRai, h01, type ArmPose } from './_rai';
import { focusLines, impactBurst, poof, speedLines } from './_manga';
import { FAM, TAU, gradientV, halftone, karaoke, person, rgbaHex, slam, stone, type C2, type Emote, type Pose } from './_motifs';
import { cloud, island, palmTree } from './_world';
import { caKick, hitShake, mergePost, punch } from './_post';
import { NEON, NEON_ALL, RING_N, RING_R, band, burstAll, drawWorld, haloBehind, lerpCam, project, ramp, type Cam } from './finale-world';
import { PANEL_CENTRE, countPage, pageGround } from './finale-panels';

type Kind = 'open' | 'reveal' | 'sayit' | 'nights' | 'meals' | 'care' | 'dont' | 'agree' | 'money' | 'wide' | 'lift' | 'up' | 'choose' | 'honour' | 'loud' | 'gold';
interface Shot { t0: number; kind: Kind; line: number }
type Arms = ArmPose | [ArmPose, ArmPose];

/** Arms moving from one pose to another at t0 over d. */
const move = (t: number, t0: number, from: Arms, to: Arms, d = 0.15) => (t < t0 ? { arms: from } : { arms: to, armsFrom: from, armsU: ease.outCubic(clamp((t - t0) / d)) });
/** The ring person i's Z (front people have Z < 0). */
const ringZ = (i: number) => Math.cos(((i + 0.5) / RING_N) * TAU) * RING_R;
const FRONT = (i: number) => i === 12 || i === 13;

export default class Finale extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  lines: Line[] = [];
  prev: Line | null = null;
  shots: Shot[] = [];
  finalHit = 0;
  shakes: [number, number][] = [];
  punches: number[] = [];
  impacts: number[] = [];

  override init() {
    const { lyrics, audio: au, start, end } = this.ctx;
    this.lines = lyrics.lines.filter((l) => l.words[0]!.start >= start - 0.1 && l.words[0]!.start < end);
    if (this.lines.length < 8) throw new Error(`finale: expected 8 lines, found ${this.lines.length}`);
    this.prev = lyrics.lines[this.lines[0]!.i - 1] ?? null; // line 74, whose "three." is sung across the cut
    const cut = (t: number, tol = 0.02) => au.timeOfBeat(Math.floor(au.beatAt(t + tol)));
    const L = this.lines;
    const S = (kind: Kind, line: number, t0: number) => this.shots.push({ kind, line, t0 });
    S('open', 0, start);
    S('reveal', 1, cut(L[1]!.words[0]!.start));
    S('sayit', 1, cut(this.w(1, /^so$/).start, 0.05));
    S('nights', 2, cut(L[2]!.words[0]!.start, 0.05));
    S('meals', 2, cut(this.w(2, /count/, 1).start, 0.05));
    S('care', 2, cut(this.w(2, /count/, 2).start, 0.05));
    S('dont', 2, cut(this.w(2, /^don/).start, 0.05));
    S('agree', 3, cut(L[3]!.words[0]!.start));
    S('money', 3, cut(this.w(3, /money/).start, 0.05));
    S('wide', 4, cut(L[4]!.words[0]!.start));
    S('lift', 5, cut(L[5]!.words[0]!.start));
    S('up', 5, cut(this.w(5, /^with/).start, 0.05));
    S('choose', 6, cut(L[6]!.words[0]!.start));
    S('honour', 6, cut(this.w(6, /honour/, 0).start, 0.05));
    S('loud', 6, cut(this.w(6, /honour/, 1).start, 0.05));
    S('gold', 7, cut(L[7]!.words[0]!.start));
    // the song's last hit, after the held last line
    const ks = au.events('kick', L[7]!.end + 0.5, end + 0.1);
    this.finalHit = ks.length ? ks[0]![0] : au.timeOfBeat(Math.round(au.beatAt(end - 0.4)));
    // the compositor's hits: shakes (one a bar at most: the first downbeat, the stomp, LOUD, the last hit)
    const firstDown = au.downbeats.find((d) => d >= L[0]!.words[0]!.start - 0.05) ?? start;
    const stomp = this.w(2, /count/, 3).start, loud = this.w(6, /loud/).start, real = this.w(3, /real/).start;
    this.shakes = [[firstDown, 6], [stomp, 7], [loud, 8], [this.finalHit, 4]];
    this.impacts = [firstDown, stomp, real, loud, this.finalHit];
    this.punches = [
      this.w(0, /stone/).start, this.w(0, /bottom/).start, this.w(0, /sea/).start, this.w(1, /say/, 1).start,
      this.w(2, /count/, 0).start, this.w(2, /count/, 1).start, this.w(2, /count/, 2).start, this.w(2, /^don/).start, real,
      this.w(4, /stone/).start, this.w(4, /bottom/).start, this.w(4, /sea/).start, this.w(5, /lifted/).start, this.w(5, /agreed/).start,
      this.w(6, /honour/, 0).start, this.w(6, /honour/, 1).start, this.finalHit,
    ];
  }

  /** The nth word of line li matching re (lowercase), or the line's first word. */
  w(li: number, re: RegExp, nth = 0): Word {
    const l = this.lines[li]!;
    return l.words.filter((x) => re.test(x.w.toLowerCase()))[nth] ?? l.words[0]!;
  }
  shot(kind: Kind) { return this.shots.find((s) => s.kind === kind)!; }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t;
    this.L.clear(HEX.ink); this.G.clear();
    let k = 0;
    while (k + 1 < this.shots.length && t >= this.shots[k + 1]!.t0) k++;
    const shot = this.shots[k]!, next = this.shots[k + 1]?.t0 ?? this.ctx.end;
    const lt = t - shot.t0, u = clamp(lt / Math.max(0.1, next - shot.t0));
    let flash = 0, band_ = true;

    switch (shot.kind) {
      case 'open': this.open(c, g, t, lt); flash = 0.55 * (1 - clamp(lt / 0.05)); break;
      case 'reveal': this.reveal(c, g, t, u); break;
      case 'sayit': this.sayit(c, g, t, u); break;
      case 'nights': case 'meals': case 'care': this.page(c, g, t, shot); break;
      case 'dont': this.dont(c, g, t); break;
      case 'agree': this.agree(c, g, t, u); break;
      case 'money': this.money(c, g, t, lt); break;
      case 'wide': this.wide(c, g, t, u); break;
      case 'lift': this.lift(c, g, t, u); break;
      case 'up': this.up(c, g, t); break;
      case 'choose': case 'honour': this.carers(c, g, t, shot.kind === 'honour'); break;
      case 'loud': flash = this.loud(c, g, t); break;
      case 'gold': band_ = false; this.gold(c, g, t, lt); flash = 0.4 * (1 - clamp((t - this.finalHit) / 0.05)) * (t >= this.finalHit ? 1 : 0); break;
    }
    if (band_) {
      // line 74's tail finishes across the cut from turn, then the chorus's own lines
      const l75 = this.lines[0]!;
      if (k === 0 && this.prev && t < l75.words[0]!.start - 0.03) band(c, this.prev, t, { sung: HEX.yellow, dark: 0.75, size: 50, until: l75.words[0]!.start - 0.03 });
      else band(c, this.lines[shot.line]!, t, { sung: HEX.yellow, dark: 0.75, size: 50 });
    }
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    const sh = this.shakes.map(([x, a]) => hitShake(t, [x], a));
    return mergePost(
      { bloom: 0.8, vignette: 0.3, zoom: 1 + 0.008 * f.a.kick, flash },
      ...sh,
      punch(t, this.punches, 0.025, 0.3),
      caKick(t, this.impacts, 5, 0.25),
    );
  }

  // ---------------------------------------------------------------- 1. the opening: fierce

  open(c: C2, g: C2, t: number, lt: number) {
    const cam: Cam = { x: -2.3 - 0.15 * lt, z: -6.2 + 0.25 * lt, h: 1.5, pitch: -0.1, f: 1050 };
    const down = this.shakes[0]![0], dt = t - down;
    const ws = [this.w(0, /stone/), this.w(0, /bottom/), this.w(0, /sea/)];
    drawWorld(c, g, cam, {
      t, burst: HEX.cyan, burstA: 0.8, spin: t * 0.22, sunX: 1414, sunLift: 270,
      pose: () => 'stand', joined: () => 0, skip: (i) => ringZ(i) < 2, lit: () => 0.25,
      rai: {
        face: 'fierce', ...move(t, down, ['fist', 'hip'], ['fist', 'fist'], 0.12), heart: 0.6 + 0.4 * this.ctx.audio.env('vocal', t),
        squash: dt >= 0 && dt < 0.25 ? -0.38 * (1 - dt / 0.25) : lt < 0.12 ? -0.2 + lt * 1.7 : 0, tilt: -0.04, glow: HEX.bone,
      },
      halo: 1, haloScale: 1.05,
      beforeRai: (x, y, R) => { if (dt >= 0 && dt < 0.6) focusLines(c, x, y - R * 0.6, R * 2.3, `rgba(255,255,255,${0.75 * (1 - dt / 0.6)})`, t); },
    });
    const cols = [HEX.cyan, HEX.pink, HEX.yellow];
    ['STONE', 'BOTTOM', 'SEA'].forEach((word, i) => slam(c, word, W * 0.27, H * [0.2, 0.4, 0.63][i]!, i === 2 ? 250 : 150, t, ws[i]!.start,
      { col: HEX.ink, shadow: cols[i], shadowOff: 0.07, rot: i % 2 ? 0.04 : -0.05 }));
  }

  // ---------------------------------------------------------------- 2. the ring at dawn: say it

  reveal(c: C2, g: C2, t: number, u: number) {
    const cam = lerpCam({ x: 0, z: -4.8, h: 2.2, pitch: 0.0, f: 1150 }, { x: 0, z: -19, h: 6.5, pitch: 0.22, f: 1300 }, ease.outCubic(u));
    const you = this.w(1, /you/), sayW = this.w(1, /say/);
    drawWorld(c, g, cam, {
      t, burst: HEX.pink, burstA: 0.45, pose: () => 'stand', joined: () => 0, skip: FRONT,
      bubble: (i) => (i % 2 ? 0 : ramp(t, sayW.start - 0.1 + 0.025 * ((i * 7) % RING_N), 0.2)),
      lit: (s) => 0.25 * ramp(t, sayW.start + 0.02 * s.k, 0.4),
      rai: { face: 'cheeky', ...move(t, you.start - 0.1, ['hip', 'down'], ['hip', 'point']), look: 1, tilt: -0.06, marks: ['shine'], markT0: you.start },
      halo: 0.5,
    });
  }

  sayit(c: C2, g: C2, t: number, u: number) {
    const cam = lerpCam({ x: -2.2, z: -15, h: 2.6, pitch: 0.05, f: 1500 }, { x: -1.6, z: -13, h: 2.4, pitch: 0.04, f: 1500 }, ease.inOutCubic(u));
    const her = this.w(1, /her/), me = this.w(1, /^me/), say = this.w(1, /say/, 1);
    const herLit = ramp(t, her.start, 0.25), meLit = ramp(t, me.start, 0.25);
    const arms: Arms = t >= me.start ? ['hip', 'cross'] : t >= her.start - 0.05 ? ['point', 'hip'] : ['hip', 'hip'];
    const from: Arms = t >= me.start ? ['point', 'hip'] : t >= her.start - 0.05 ? ['hip', 'hip'] : ['hip', 'down'];
    const t0 = t >= me.start ? me.start : t >= her.start - 0.05 ? her.start - 0.05 : this.shot('sayit').t0;
    drawWorld(c, g, cam, {
      t, burst: HEX.pink, burstA: 0.55, pose: () => 'stand', joined: () => 0, skip: FRONT,
      bubble: (i) => (i % 2 ? 0 : 1), lit: () => 0.25,
      rai: {
        face: t >= me.start ? 'cheeky' : 'sassy', arms, armsFrom: from, armsU: ease.outCubic(clamp((t - t0) / 0.15)), tilt: t >= her.start ? -0.08 : 0.1,
        look: t >= her.start && t < me.start ? -1 : 0, marks: ['shine'], markT0: say.start, blush: meLit * 0.6,
        heart: meLit, heartColor: HEX.pink, glow: meLit > 0 ? HEX.pink : HEX.gold, glowStrength: 1 + meLit,
      },
      halo: 0.5,
      extras: [
        { X: -4.7, Z: -5.0, draw: (p) => {
          stone(c, p.x, p.y - 0.75 * p.s, 0.75 * p.s, { seed: 77, glow: herLit > 0 ? HEX.pink : undefined, glowA: 0.6 * herLit, heart: herLit > 0 ? HEX.pink : undefined, heartA: herLit });
        } },
        { X: -3.3, Z: -5.2, draw: (p) => {
          person(c, p.x, p.y, 1.68 * p.s, 'hold', { col: HEX.ink, t, seed: 3, rim: rgbaHex(HEX.pink, 0.9), emote: herLit > 0.3 ? 'heart' : undefined, emoteT0: her.start + 0.1, headTilt: -0.1 * herLit });
        } },
      ],
    });
    slam(c, 'SAY IT', W * 0.5, H * 0.172, 210, t, say.start, { col: HEX.ink, shadow: HEX.pink, shadowOff: 0.07, rot: -0.03 });
    const pw = project(cam, -3.3, 1.68, -5.2);
    slam(c, 'FOR HER', pw.x + 30, pw.y - 150, 72, t, her.start, { fam: FAM.cond(), col: HEX.bone, shadow: HEX.ink, t1: me.start - 0.05, exit: 0.1 });
    slam(c, 'FOR ME', W * 0.7, H * 0.33, 84, t, me.start, { fam: FAM.cond(), col: HEX.bone, shadow: HEX.ink });
  }

  // ---------------------------------------------------------------- 3. count the nights / meals / care (the page)

  pageTimes() {
    const at = [this.shot('nights').t0, this.shot('meals').t0, this.shot('care').t0];
    const stamp = [0, 1, 2].map((n) => Math.max(at[n]!, this.w(2, /count/, n).start));
    return { at, stamp };
  }

  page(c: C2, g: C2, t: number, shot: Shot) {
    const n = shot.kind === 'nights' ? 0 : shot.kind === 'meals' ? 1 : 2, lt = t - shot.t0;
    const { at, stamp } = this.pageTimes();
    const [px, py] = PANEL_CENTRE[n]!;
    const z = lerp(1.24, 1.16, ease.outCubic(clamp(lt / 0.8)));
    const fx = clamp(px, W / (2 * z), W - W / (2 * z)), fy = clamp(py, H / (2 * z), H - H / (2 * z));
    for (const q of [c, g]) { q.save(); q.translate(W / 2, H / 2); q.scale(z, z); q.translate(-fx, -fy); }
    pageGround(c, t);
    countPage(c, g, t, at, stamp, -1);
    for (const q of [c, g]) q.restore();
  }

  dont(c: C2, g: C2, t: number) {
    const s0 = this.shot('dont').t0, dw = this.w(2, /^don/), stomp = this.shakes[1]![0];
    const { at, stamp } = this.pageTimes();
    const z = lerp(0.86, 0.89, clamp((t - s0) / 0.9));
    pageGround(c, t);
    for (const q of [c, g]) { q.save(); q.translate(W / 2, H / 2 + 70); q.scale(z, z); q.translate(-W / 2, -H / 2); }
    countPage(c, g, t, at, stamp, t >= stomp ? t - stomp : -1);
    for (const q of [c, g]) q.restore();
    // chibi Rai pops in front of the page and stomps
    const x = W / 2, y = 655, R = 145, ds = t - stomp;
    const up = t < stomp ? Math.sin(clamp((t - (stomp - 0.22)) / 0.22) * Math.PI * 0.5) : 0;
    if (ds >= 0 && ds < 0.3) impactBurst(c, x, y + 1.0 * R, 150 * (0.7 + ds), 'rgba(255,255,255,0.92)', HEX.ink, t, 12);
    drawRai(c, x, y, R, {
      t, sd: true, face: ds >= 0 ? 'angry' : 'smug', arms: ds >= 0 ? ['fist', 'fist'] : ['hip', 'hip'], hop: 0.55 * up,
      squash: ds >= 0 && ds < 0.3 ? -0.55 * (1 - ds / 0.3) : up * 0.25, marks: ds >= 0 ? ['vein', 'steam'] : ['shine'], markT0: ds >= 0 ? stomp : s0 + 0.1,
      shake: ds >= 0 && ds < 0.4 ? 0.6 : 0, glow: HEX.bone, glowStrength: 0.5,
    });
    poof(c, x, y - R * 0.4, R * 1.5, t, s0);
    slam(c, "DON'T", W * 0.5, H * 0.165, 140, t, dw.start, { col: HEX.pink, shadow: HEX.ink, shadowOff: 0.07, rot: -0.04 });
  }

  // ---------------------------------------------------------------- 4. agree that it's real

  agree(c: C2, g: C2, t: number, u: number) {
    const cam = lerpCam({ x: 0, z: -13.5, h: 2.9, pitch: 0.05, f: 1400 }, { x: 0, z: -11, h: 2.7, pitch: 0.04, f: 1400 }, ease.inOutCubic(u));
    const ag = this.w(3, /agree/), real = this.w(3, /real/), dr = t - real.start;
    const joinAt = (i: number) => ag.start + 0.7 * (Math.min(i, RING_N - 1 - i) / (RING_N / 2));
    drawWorld(c, g, cam, {
      t, burst: HEX.yellow, burstA: 0.4 + 0.3 * ramp(t, real.start, 0.1), skip: FRONT,
      pose: (i) => (t >= joinAt(i) ? 'hands' : 'stand'), joined: (i) => ramp(t, joinAt(i), 0.12),
      chain: (i) => [ramp(t, joinAt(i) + 0.1, 0.15), NEON[i % 4]!], lit: () => 0.25,
      rai: dr < 0
        ? { face: 'serious', ...move(t, ag.start, ['down', 'down'], ['cross', 'cross'], 0.2), heart: 0.5 }
        : { face: 'determined', ...move(t, real.start, ['cross', 'cross'], ['fist', 'hip'], 0.12), heart: 0.8, squash: dr < 0.2 ? -0.25 * (1 - dr / 0.2) : 0, marks: ['shine'], markT0: real.start },
      halo: 0.7,
      beforeRai: (x, y, R) => { if (dr >= 0 && dr < 0.7) focusLines(c, x, y - R * 0.5, R * 2.0, `rgba(255,236,150,${0.7 * (1 - dr / 0.7)})`, t, { n: 70 }); },
    });
    slam(c, 'REAL', W * 0.5, H * 0.205, 290, t, real.start, { col: HEX.yellow, shadow: HEX.ink, shadowOff: 0.06, rot: -0.03 });
  }

  money(c: C2, g: C2, t: number, lt: number) {
    const v = ease.inOutCubic(clamp(lt / 1.7));
    const cam = lerpCam({ x: 0, z: -11, h: 2.7, pitch: 0.04, f: 1400 }, { x: 0, z: -16, h: 15, pitch: 0.62, f: 1300, cy: H * 0.38 }, v);
    const mo = this.w(3, /money/), ab = this.w(3, /about/);
    const goldA = ramp(t, ab.start, 0.5);
    const litAt = (s: { k: number }) => mo.start + 0.03 * s.k;
    drawWorld(c, g, cam, {
      t, burst: HEX.yellow, burstA: 0.4, pose: () => 'hands', joined: () => 1, skip: FRONT,
      chain: (i) => [1, goldA > 0.5 ? HEX.gold : NEON[(i + Math.floor(t * 10)) % 4]!],
      lit: (s) => ramp(t, litAt(s), 0.25), litAt,
      rai: { face: t >= ab.start ? 'joy' : 'smile', ...move(t, ab.start, ['down', 'down'], ['up', 'up']), heart: 0.6 + 0.4 * goldA, heartColor: goldA > 0.5 ? HEX.gold : HEX.pink, marks: ['sparkle'], markT0: ab.start },
      halo: 0.6 + 0.4 * goldA,
    });
  }

  // ---------------------------------------------------------------- 5. the great wide

  wide(c: C2, g: C2, t: number, u: number) {
    const cam = lerpCam({ x: 0, z: -27, h: 6.2, pitch: 0.14, f: 1350 }, { x: 0, z: -22, h: 5.6, pitch: 0.13, f: 1350 }, ease.inOutCubic(u));
    const bounce = Math.abs(Math.sin(this.ctx.audio.beatAt(t) * Math.PI));
    drawWorld(c, g, cam, {
      t, burst: HEX.cyan, burstA: 0.65, spin: t * 0.12, pose: () => 'hands', joined: () => 1, skip: FRONT,
      chain: (i) => [1, NEON[(i + Math.floor(t * 4)) % 4]!],
      lit: () => 1, litAt: () => this.shot('wide').t0 - 1,
      rai: { face: 'joy', arms: ['up', 'up'], hop: 0.25 * bounce, squash: bounce < 0.15 ? -0.2 : 0.1, heart: 0.8, marks: ['sparkle'], markT0: this.shot('wide').t0 },
      halo: 1,
    });
    const ws = [this.w(4, /stone/), this.w(4, /bottom/), this.w(4, /sea/)];
    const cols = [HEX.cyan, HEX.pink, HEX.yellow];
    const pos: [number, number, number][] = [[0.2, 0.14, 120], [0.79, 0.14, 120], [0.62, 0.3, 200]];
    ws.forEach((w, i) => slam(c, ['STONE', 'BOTTOM', 'SEA'][i]!, W * pos[i]![0], H * pos[i]![1], pos[i]![2], t, w.start,
      { col: cols[i], shadow: HEX.ink, shadowOff: 0.07, rot: [-0.05, 0.03, -0.03][i] }));
  }

  // ---------------------------------------------------------------- 6. you lifted me up with a word you agreed

  lift(c: C2, g: C2, t: number, u: number) {
    const lf = this.w(5, /lifted/);
    const rise = ease.outCubic(ramp(t, lf.start - 0.1, 1.4));
    const cam = lerpCam({ x: 0, z: -22, h: 2.2, pitch: -0.04, f: 1250 }, { x: 0, z: -21, h: 2.0, pitch: -0.12, f: 1250 }, ease.inOutCubic(u));
    drawWorld(c, g, cam, {
      t, burst: HEX.pink, burstA: 0.55, skip: FRONT,
      pose: (i) => (t > lf.start - 0.2 + 0.01 * i ? 'cheer' : 'hands'), joined: () => 1 - ramp(t, lf.start - 0.2, 0.1),
      beam: (i) => ramp(t, lf.start - 0.1 + 0.015 * i, 0.3), lit: () => 0.8, litAt: () => this.shot('lift').t0 - 2,
      rai: { face: 'joy', ...move(t, lf.start - 0.1, ['down', 'down'], ['up', 'up'], 0.2), heart: 0.9, lift: 5.5 * rise, squash: 0.25 * (1 - rise) * rise * 4, tilt: 0.08 * Math.sin(t * 3), marks: ['sparkle'], markT0: lf.start },
      halo: 0.8,
      beforeRai: () => { if (rise > 0.02 && rise < 0.98) speedLines(c, Math.PI / 2, 'rgba(255,255,255,0.7)', t, { n: 40, alpha: 0.5 * (1 - rise), band: [W * 0.3, W * 0.7] }); },
    });
    slam(c, 'LIFTED', W * 0.22, H * 0.34 - 120 * rise, 150, t, lf.start, { col: HEX.pink, shadow: HEX.ink, shadowOff: 0.07, rot: -0.06 });
  }

  up(c: C2, g: C2, t: number) {
    const cx = W * 0.5, cy = H * 0.43;
    gradientV(c, '#4a3d9a', '#ffb38a');
    burstAll(c, cx, cy, 'rgba(0,0,0,0)', [rgbaHex(HEX.pink, 0.5), 'rgba(0,0,0,0)', rgbaHex(HEX.violet, 0.35), 'rgba(0,0,0,0)'], 32, -t * 0.15);
    for (let i = 0; i < 5; i++) cloud(c, ((h01(i, 31) * (W + 600) + t * 25) % (W + 600)) - 300, H * (0.12 + 0.5 * h01(i, 32)), 70 + 50 * h01(i, 33), 'rgba(255,214,200,0.8)');
    // palm crowns leaning in from the corners: we are lying on the beach, looking up at her
    palmTree(c, -40, H + 260, 760, 0.55, t, 1, 0.3);
    palmTree(c, W + 40, H + 260, 760, -0.55, t, 2, 0.3);
    const ag = this.w(5, /agreed/), wd = this.w(5, /word/);
    haloBehind(c, cx, cy - 75, 400, t, 1, 6, 1, 0.8);
    // everyone's "yes", rising to her
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let i = 0; i < 34; i++) {
      const born = wd.start - 0.6 + 0.04 * i, v = (t - born) / 1.3;
      if (v < 0 || v > 1) continue;
      const x0 = W * (0.05 + 0.9 * h01(i, 51)), y0 = H * 0.8;
      const x = lerp(x0, cx + (h01(i, 52) - 0.5) * 140, ease.inQuad(v)), y = lerp(y0, cy + 150, ease.inQuad(v));
      const col = NEON_ALL[i % NEON_ALL.length]!;
      c.font = font(FAM.monoB(), 30 + 16 * h01(i, 53)); c.fillStyle = col; c.globalAlpha = 1 - v * v;
      c.fillText('yes', x, y); c.globalAlpha = 1;
      g.font = c.font; g.fillStyle = rgbaHex(col, 0.45 * (1 - v)); g.fillText('yes', x, y);
    }
    drawRai(c, cx, cy + 10 * Math.sin(t * 2), 150, { t, face: 'love', arms: ['cheek', 'cheek'], marks: ['hearts'], markT0: wd.start, blush: 1, glow: HEX.pink, glowStrength: 1.4, heart: 1, noBlink: true, tilt: 0.06 * Math.sin(t * 1.7) });
    // the crowd's raised hands, close below
    for (let i = 0; i < 7; i++) {
      const px = W * (0.04 + 0.155 * i), py = H + 420 + 40 * h01(i, 61), ph = 640 + 80 * h01(i, 62), uu = ph / 100;
      person(c, px, py, ph, 'stand', { col: HEX.ink, t, seed: i });
      c.strokeStyle = HEX.ink; c.lineWidth = 6 * uu; c.lineCap = 'round';
      for (const sd of [-1, 1]) {
        const wv = 4 * uu * Math.sin(t * 5 + i + sd);
        c.beginPath(); c.moveTo(px + sd * 8 * uu, py - 74 * uu); c.quadraticCurveTo(px + sd * 20 * uu, py - 100 * uu, px + sd * 24 * uu + wv, py - 128 * uu); c.stroke();
      }
    }
    slam(c, 'AGREED', W * 0.5, H * 0.79, 170, t, ag.start, { col: HEX.gold, shadow: HEX.ink, shadowOff: 0.07, rot: -0.02 });
  }

  // ---------------------------------------------------------------- 7. choose what you honour, and honour it loud

  carers(c: C2, g: C2, t: number, honour: boolean) {
    const s0 = this.shot('choose').t0, T = t - s0, zoom = honour ? 1.16 : 1;
    const hw = this.w(6, /honour/, 0), ch = this.w(6, /choose/);
    for (const q of [c, g]) { q.save(); q.translate(W / 2, H * 0.72); q.scale(zoom, zoom); q.translate(-W / 2, -H * 0.72); }
    island(c, t, { time: 'dawn', horizon: H * 0.4, beach: H * 0.55, show: ['clouds', 'ship'] });
    const gap = 410, x0 = W * 0.5 + 480 - T * 300;
    const kinds = ['night', 'hob', 'song', 'lifeboat', 'code', 'road', 'night', 'hob'];
    for (let i = 0; i < kinds.length; i++) {
      const x = x0 + (i - 2) * gap, y = H * 0.76;
      if (x < -320 || x > W + 320) continue;
      const near = 1 - clamp(Math.abs(x + 70 - W / 2) / 240);
      const lit = Math.max(clamp(near * 1.6), honour ? ramp(t, hw.start + 0.05 * i, 0.2) : 0, T > 0.2 ? 0.2 : 0);
      const col = NEON_ALL[(i + 1) % NEON_ALL.length]!;
      c.fillStyle = 'rgba(120,70,60,0.25)'; c.beginPath(); c.ellipse(x + 75, y, 80, 12, 0, 0, TAU); c.fill();
      stone(c, x + 70, y - 72, 72, { seed: 40 + i, glow: col, glowA: lit, heart: col, heartA: lit });
      this.carer(c, kinds[i]!, x - 70, y, t, i, honour && lit > 0.4, hw.start + 0.05 * i);
    }
    for (const q of [c, g]) q.restore();
    // Rai at the right, choosing (pointing), then fist up for HONOUR
    drawRai(c, W * 0.885, H * 0.8, 150, honour
      ? { t, face: 'determined', ...move(t, hw.start, ['hip', 'point'], ['fist', 'hip'], 0.12), heart: 1, glow: HEX.gold, noBlink: true, squash: t - hw.start < 0.2 && t >= hw.start ? -0.2 : 0 }
      : { t, face: 'cheeky', ...move(t, ch.start, ['hip', 'down'], ['point', 'hip'], 0.15), look: -1, heart: 0.6, glow: HEX.gold, noBlink: true, marks: ['?'], markT0: ch.start });
    if (!honour) {
      const r = 116 + 8 * Math.sin(t * 8), sx = W / 2 + 70, sy = H * 0.76 - 72;
      c.strokeStyle = HEX.gold; c.lineWidth = 6; c.beginPath(); c.arc(sx, sy, r, 0, TAU); c.stroke();
      g.strokeStyle = rgbaHex(HEX.gold, 0.6); g.lineWidth = 8; g.beginPath(); g.arc(sx, sy, r, 0, TAU); g.stroke();
      slam(c, 'CHOOSE', W * 0.45, H * 0.17, 150, t, ch.start, { col: HEX.bone, shadow: HEX.ink, shadowOff: 0.07, rot: -0.03 });
    } else {
      slam(c, 'HONOUR', W * 0.45, H * 0.18, 250, t, hw.start, { col: HEX.gold, shadow: HEX.ink, shadowOff: 0.06, rot: -0.03 });
    }
  }

  /** A carer in silhouette with their thing and their feeling; on HONOUR they cheer. */
  carer(c: C2, kind: string, x: number, y: number, t: number, i: number, cheer: boolean, t0: number) {
    const h = 230, ink = HEX.ink, rim = 'rgba(255,190,140,0.9)';
    const p = (px: number, ph: number, pose: Pose, e?: Emote, o: { flip?: boolean; tilt?: number; seed?: number } = {}) =>
      person(c, px, y, ph, cheer ? 'cheer' : pose, { col: ink, t, seed: o.seed ?? i, flip: o.flip, headTilt: o.tilt, rim, emote: cheer ? 'joy' : e, emoteT0: cheer ? t0 : 0 });
    switch (kind) {
      case 'night': p(x, h, 'hold', 'zzz', { tilt: 0.15 });
        c.fillStyle = '#fff3c9'; c.beginPath(); c.arc(x - 60, y - h - 60, 24, 0, TAU); c.arc(x - 50, y - h - 68, 20, 0, TAU, true); c.fill('evenodd'); break;
      case 'hob': p(x, h, 'stand', 'music');
        c.fillStyle = '#4a4f5f'; c.beginPath(); c.roundRect(x + 24, y - h * 0.5, 60, 34, 8); c.fill();
        c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 5; for (let k = 0; k < 2; k++) { c.beginPath(); for (let yy = 0; yy <= 50; yy += 8) { const xx = x + 44 + 18 * k + 6 * Math.sin(yy * 0.1 - t * 5 + k); yy ? c.lineTo(xx, y - h * 0.5 - 8 - yy) : c.moveTo(xx, y - h * 0.5 - 8 - yy); } c.stroke(); }
        break;
      case 'song': p(x - 50, h, 'seated', 'music', { flip: false, seed: i }); p(x + 40, h, 'hug', 'tear', { flip: true, seed: i + 1, tilt: -0.2 }); break;
      case 'lifeboat':
        c.fillStyle = HEX.orange; c.beginPath(); c.moveTo(x - 110, y - 50); c.lineTo(x + 110, y - 50); c.lineTo(x + 80, y); c.lineTo(x - 80, y); c.closePath(); c.fill();
        person(c, x - 40, y - 40, h * 0.75, cheer ? 'cheer' : 'paddle', { col: ink, t, seed: i, emote: cheer ? 'joy' : '!', emoteT0: cheer ? t0 : 0 });
        person(c, x + 40, y - 40, h * 0.75, cheer ? 'cheer' : 'paddle', { col: ink, t, seed: i + 2 }); break;
      case 'code': p(x, h * 0.95, 'seated', 'zzz', { seed: i });
        c.fillStyle = HEX.cyan; c.fillRect(x + 26, y - h * 0.5, 64, 42); c.fillStyle = 'rgba(47,224,255,0.3)'; c.beginPath(); c.arc(x + 58, y - h * 0.45, 60, 0, TAU); c.fill(); break;
      default: p(x, h, 'hold', 'heart', { flip: true });
        c.fillStyle = HEX.coral; c.fillRect(x - 80, y - h * 0.42, 40, 28);
    }
  }

  loud(c: C2, g: C2, t: number): number {
    const hw = this.w(6, /honour/, 1), ld = this.w(6, /loud/);
    const isLoud = t >= ld.start - 0.02, lt2 = t - ld.start;
    const cx = W * 0.5, cy = H * 0.6;
    if (!isLoud) {
      burstAll(c, cx, cy, '#d93a82', [HEX.pink], 18, t * 0.4);
      halftone(c, rgbaHex(HEX.ink, 0.16), 24, 'radial', cx, cy);
      focusLines(c, cx, cy - 160, 330, 'rgba(255,255,255,0.55)', t, { n: 70 });
      drawRai(c, cx, cy, 150, { t, face: 'determined', arms: ['fist', 'fist'], shake: 0.35, glow: HEX.bone, heart: 1, noBlink: true, squash: -0.1 });
      slam(c, 'HONOUR IT', W * 0.5, H * 0.16, 170, t, hw.start, { col: HEX.ink, shadow: HEX.bone, shadowOff: 0.06, rot: 0.03 });
      this.crowd(c, t, false, ld.start);
      return 0;
    }
    burstAll(c, cx, cy, HEX.deep, NEON_ALL, 32, t * 1.2);
    halftone(c, rgbaHex(HEX.ink, 0.22), 26, 'radial', cx, cy);
    haloBehind(c, cx, cy - 40, 520, t, 1, 8, 1, 1.5);
    const bounce = Math.abs(Math.sin((t - ld.start) * Math.PI * 2.4));
    drawRai(c, cx, cy + 40, 170, { t, face: 'joy', arms: ['up', 'up'], marks: ['sparkle'], markT0: ld.start, hop: 0.3 * bounce, squash: bounce < 0.12 ? -0.3 : 0.15, glow: HEX.gold, glowStrength: 2, heart: 1, heartColor: HEX.gold, noBlink: true });
    // sparkles everywhere
    for (let i = 0; i < 26; i++) {
      const a = h01(i, 71) * TAU, d = (240 + 600 * h01(i, 72)) * ease.outCubic(clamp(lt2 / 0.6)), tw = 0.5 + 0.5 * Math.sin(t * 12 + i);
      const sx = cx + Math.cos(a) * d * 1.3, sy = cy - 60 + Math.sin(a) * d * 0.7;
      g.fillStyle = rgbaHex(NEON_ALL[i % 8]!, 0.8 * tw);
      g.beginPath(); for (let k = 0; k < 8; k++) { const aa = (k / 8) * TAU, rr = k % 2 ? 4 : 18 * tw + 6; k ? g.lineTo(sx + Math.cos(aa) * rr, sy + Math.sin(aa) * rr) : g.moveTo(sx + Math.cos(aa) * rr, sy + Math.sin(aa) * rr); } g.fill();
    }
    this.crowd(c, t, true, ld.start);
    // LOUD: each letter its own neon, slammed in one after another
    const letters = 'LOUD'.split(''), size = 330;
    c.font = font(FAM.hook(), size);
    const ww = letters.map((l) => c.measureText(l).width), tot = ww.reduce((a, b) => a + b, 0) + 20 * 3;
    let x = W / 2 - tot / 2;
    letters.forEach((l, i) => {
      const col = [HEX.cyan, HEX.pink, HEX.lime, HEX.yellow][i]!;
      slam(c, l, x + ww[i]! / 2, H * 0.23, size, t, ld.start + 0.05 * i, { col, shadow: HEX.ink, shadowOff: 0.07, rot: [-0.08, 0.05, -0.04, 0.07][i] });
      x += ww[i]! + 20;
    });
    return 0.5 * (1 - clamp(lt2 / 0.05));
  }

  /** The crowd at the front of the stage, cheering (on LOUD, with joy). */
  crowd(c: C2, t: number, loud: boolean, t0: number) {
    for (let i = 0; i < 11; i++) {
      const x = W * (0.02 + 0.096 * i) + 20 * h01(i, 81), h = 300 + 60 * h01(i, 82);
      person(c, x, H + 150 + 30 * h01(i, 83), h, loud || i % 3 === 0 ? 'cheer' : 'stand', { col: HEX.ink, t: t * (loud ? 1.6 : 1), seed: i, emote: loud && i % 2 === 0 ? 'joy' : undefined, emoteT0: t0 + 0.05 * i, rim: rgbaHex(NEON_ALL[i % 8]!, 0.9) });
    }
  }

  // ---------------------------------------------------------------- 8. the last line, big and gold

  gold(c: C2, g: C2, t: number, lt: number) {
    const end = this.ctx.end, line = this.lines[7]!;
    const v = ease.outCubic(clamp(lt / (end - this.shot('gold').t0)));
    const cam = lerpCam({ x: 0, z: -19, h: 5.2, pitch: 0.1, f: 1350, cy: H * 0.46 }, { x: 0, z: -15.5, h: 4.8, pitch: 0.1, f: 1350, cy: H * 0.46 }, v);
    const hit = this.finalHit, ht = t - hit;
    const flare = ht >= 0 ? Math.pow(0.5, ht / 0.25) : 0;
    const after = ht >= 0;
    const rai = drawWorld(c, g, cam, {
      t, gold: 1, sunX: 0, sunLift: -45, burst: HEX.yellow, burstA: 0.22, spin: t * 0.05, pose: () => 'hands', joined: () => 1,
      chain: () => [1, HEX.gold], lit: () => 1, litAt: () => this.shot('gold').t0 - 3, stoneCol: HEX.gold, skip: FRONT,
      rai: after
        ? { face: 'joy', ...move(t, hit, ['cross', 'cross'], ['up', 'up'], 0.1), hop: 0.35 * Math.sin(clamp(ht / 0.45) * Math.PI), marks: ['sparkle'], markT0: hit, heart: 1, heartColor: HEX.gold, glow: HEX.gold, glowStrength: 1.4 + 2 * flare }
        : { face: t < line.end ? 'soft' : 'smile', ...move(t, this.shot('gold').t0, ['down', 'down'], ['cross', 'cross'], 0.3), heart: 1, heartColor: HEX.gold, glow: HEX.gold, glowStrength: 1.4 },
      halo: 1, haloScale: 1.45 + 0.25 * flare,
    });
    if (after) { // the final hit: a ring of gold from her heart
      const rr = rai.R * 0.3 + ease.outCubic(clamp(ht / 0.7)) * W * 0.8;
      g.strokeStyle = rgbaHex(HEX.gold, 0.6 * (1 - clamp(ht / 0.8))); g.lineWidth = 22 * (1 - clamp(ht / 0.8)) + 3;
      g.beginPath(); g.arc(rai.x, rai.y - rai.R * 0.12, rr, 0, TAU); g.stroke();
    }
    // the line, big and gold, over the island
    gradientV(c, rgbaHex(HEX.ink, 0.85), 'rgba(18,13,29,0)', 0, 0, W, H * 0.48);
    karaoke(c, line, t, W / 2 + 7, H * 0.19 + 7, 100, { fam: FAM.hook(), sung: HEX.ink, unsung: 'rgba(0,0,0,0)', maxW: 1550, until: end });
    karaoke(c, line, t, W / 2, H * 0.19, 100, { fam: FAM.hook(), sung: HEX.gold, unsung: rgbaHex(HEX.bone, 0.32), maxW: 1550, until: end });
  }
}

