// v2 "THE DIVER", LANTERN (13.26–26.97; lines 2–5, rapped; TREATMENT-v2.md). Rai's heart throws a circle of gold
// onto the dark water above them, like a magic lantern, and her story plays in it. The rap cuts every two beats
// (sixteen shots from the beat grid), between the story full screen (the circle, the dark sea round its edge, the beam
// from her heart coming in from the corner) and the two of them watching, on the same patch of seabed as `dive`
// (the girl on the sand hugging her knees, her torch laid down and aimed at Rai).
//   W  13.26  the lantern opens: Rai smug, a thumb at it; the girl leans in            "They cut me out"
//   S  14.11  Palau's rock islands at sunrise, the cliff, the disc's outline glowing, shell adzes striking
//   W  14.97  over the girl's shoulder: the circle huge, the strikes in it; chips fly on "shell" and "grit"
//   S  15.83  the stubborn crew levers the disc out; it comes free on "crew"
//   W  16.68  Rai close: wow at her own story (hands on her cheeks), the crew cheering in the circle
//   S  17.54  night on the swell, the canoe with the stone on its deck; the stars draw 400 KM on "kilometres"
//   S  18.40  pull back: the whole crossing, the star route from PALAU to YAP
//   W  19.26  the girl looks up as if the stars were real: the plankton round them glitters like stars; Rai reaches
//   S  20.11  the ropes snap tight over the stone on "lashed"
//   S  20.97  the men on the moonlit beach shoulder the long pole
//   S  21.83  close: the pole slides through the hole in her heart on "pole through the hole"
//   W  22.68  the girl winces, hands to her mask ("!"); Rai winks and taps her heart (it's fine)
//   S  23.54  clouds off the reef, the rain; lightning on "storm" (the one shake, a colour kick)
//   W  24.40  the circle's light flickers like the storm on them: the girl grips the sand; Rai dizzy
//   S  25.25  the canoe heels on a wave and the stone slides off on "went"
//   W  26.11  in the circle she sinks into the dark; Rai dips, dizzy, and pops back up for the twist
// Clues: the trader's anchor-shaped absence (nothing yet); the gold letterbox and house pebble 7 at Rai's side (legend's
// street); the crossing's two islands, PALAU and YAP, named in starlight.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../../engine/scene';
import { Layer2D, W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import type { Line } from '../../engine/lyrics';
import { clamp, ease, lerp } from '../../engine/util';
import { drawRai, h01, type ArmPose, type Face, type RaiOpts } from '../_rai';
import { TAU, rgbaHex } from '../_motifs';
import { seabedFront } from '../_world';
import type { Mark } from '../_manga';
import { mergePost, punch, hitShake, caKick } from '../_post';
import { girl, GIRL_POSES, heartLantern, bubbleLyric, currentLine, withCam2, type GirlPose } from './_diver';
import { Dark, beam, lanternBeam, lensReeds, torchOnSand, seaSet, girlBelt, frameOn, camMix, clearUnderLyric, lyricExtent, bubble, RAI, KNEEL, TORCH_REST, type Cam } from './dive-sea';
import { quarry, voyage, starText, lash, shoulder, poleThrough, storm, sinking } from './lantern-story';

type C2 = CanvasRenderingContext2D;
type Kind = 'open' | 'quarry' | 'shoulderW' | 'crew' | 'raiW' | 'stars' | 'ocean' | 'lookup' | 'lash' | 'shoulder' | 'pole' | 'wince' | 'storm' | 'flicker' | 'tilt' | 'sink';
const SHOTS: Kind[] = ['open', 'quarry', 'shoulderW', 'crew', 'raiW', 'stars', 'ocean', 'lookup', 'lash', 'shoulder', 'pole', 'wince', 'storm', 'flicker', 'tilt', 'sink'];
const CIRCLE = { x: 930, y: 330, r: 290 };   // where the lantern's circle hangs over them (world px)
const GH = 300;

export default class Lantern extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  D = new Dark();
  X = new Layer2D(W, H, 0.25);   // scratch: the kit's own lantern glow goes here (lanternBeam draws ours)
  lines: Line[] = [];
  cuts: number[] = [];
  w: Record<string, number> = {};
  strikes: number[] = [];
  stars: [number, number][] = [];

  override init() {
    const { lyrics, audio: au, start, end } = this.ctx;
    // its own lines, and legend's first, which rises in under the cut
    this.lines = lyrics.lines.filter((l) => l.end > start + 0.02 && l.words[0]!.start < end + 0.4);   // incl. the line still ringing across the cut in
    const b0 = Math.round(au.beatAt(start + 0.02));
    this.cuts = SHOTS.map((_, i) => (i === 0 ? start : au.timeOfBeat(b0 + 2 * i)));
    const wd = (q: string, re: RegExp) => { const l = lyrics.get(q); return (l.words.find((x) => re.test(x.w.toLowerCase())) ?? l.words[0]!).start; };
    this.w = {
      cut: wd('They cut me out', /^cut/), cliff: wd('They cut me out', /cliff/), palau: wd('They cut me out', /palau/), shell: wd('They cut me out', /shell/), grit: wd('They cut me out', /grit/), crew: wd('They cut me out', /crew/),
      four: wd('four hundred', /four/), km: wd('four hundred', /kilometres/), ocean: wd('four hundred', /ocean/), stars: wd('four hundred', /stars/),
      lashed: wd('lashed me to a raft', /lashed/), raft: wd('lashed me to a raft', /raft/), shouldered: wd('lashed me to a raft', /shouldered/), pole: wd('lashed me to a raft', /pole/), hole: wd('lashed me to a raft', /hole/), heart: wd('lashed me to a raft', /heart/),
      storm: wd('then a storm', /storm/), reef: wd('then a storm', /reef/), night: wd('then a storm', /night/), went: wd('then a storm', /went/), bottom: wd('then a storm', /bottom/), sea: wd('then a storm', /sea/),
    };
    // the adzes strike on the words and the beats of line 2's middle
    this.strikes = [this.w.cliff!, this.w.palau!, au.timeOfBeat(b0 + 3), this.w.shell!, au.timeOfBeat(b0 + 5) + 0.2, this.w.grit!].sort((a, b) => a - b);
    this.stars = starText();
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t, w = this.w;
    this.L.clear(HEX.ink); this.G.clear();
    let i = 0;
    for (let k = 0; k < this.cuts.length; k++) if (t >= this.cuts[k]!) i = k;
    const t0 = this.cuts[i]!, t1 = this.cuts[i + 1] ?? this.ctx.end, u = clamp((t - t0) / (t1 - t0));
    const kind = SHOTS[i]!;
    const flash = this.flash(t);
    let post: PostOverrides = { bloom: 0.8, vignette: 0.5 };
    const story = this.storyFor(kind, t, u);
    if (['open', 'shoulderW', 'raiW', 'lookup', 'wince', 'flicker', 'sink'].includes(kind)) this.watch(c, g, t, kind, u, story, flash);
    else this.full(c, g, t, u, i, story);
    // the line, rising into place (nothing over it)
    const line = currentLine(this.lines, t);
    if (line) { const e = lyricExtent(c, line.words.map((x) => x.w), false); clearUnderLyric(g, e.w, e.rows); bubbleLyric(c, line, t); }
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    post = mergePost(post, { flash: 0.35 * clamp(1 - Math.abs(t - w.storm! - 0.015) / 0.035) }, punch(t, [t0], 0.012, 0.2), punch(t, [w.hole!, w.crew!], 0.03, 0.3), hitShake(t, [w.storm!], 7, 0.4), caKick(t, [w.storm!], 5, 0.3));
    return mergePost(post, { zoom: 1 + 0.006 * f.a.kick });
  }

  /** The storm's lightning: a bright double flicker on "storm", softer ones after. */
  flash(t: number) {
    const s = this.w.storm!;
    let v = 0;
    for (const [at, a] of [[s, 1], [s + 0.12, 0.6], [this.w.night! + 0.05, 0.5], [this.w.went!, 0.45]] as const) { const d = t - at; if (d >= 0 && d < 0.1) v = Math.max(v, a * (1 - d / 0.1)); }
    return v;
  }

  /** What the circle shows at t, as a draw function for heartLantern. */
  storyFor(kind: Kind, t: number, u: number): (c: C2) => void {
    const w = this.w;
    switch (kind) {
      case 'open': case 'quarry': return (c) => quarry(c, t, { strikes: this.strikes, pan: kind === 'quarry' ? 60 * u : 0, zoom: kind === 'quarry' ? 1.05 + 0.08 * u : 1 });
      case 'shoulderW': return (c) => quarry(c, t, { strikes: this.strikes, zoom: 1.9, zx: 770, zy: 600 });
      case 'crew': { const fr = clamp((t - (w.crew! - 0.5)) / 0.5); return (c) => quarry(c, t, { strikes: [], free: Math.max(0.03, fr), pop: w.crew, cheer: t >= w.crew! ? 1 : 0, zoom: 1.15 - 0.1 * u }); }
      case 'raiW': return (c) => quarry(c, t, { strikes: [], free: 1, pop: w.crew, cheer: 1 });
      case 'stars': return (c) => voyage(c, t, { stars: clamp((t - w.km! + 0.15) / 0.5), textPts: this.stars });
      case 'ocean': case 'lookup': return (c) => voyage(c, t, { stars: 1, textPts: this.stars, wide: kind === 'ocean' ? ease.inOutCubic(clamp(u * 1.6)) : 1 });
      case 'lash': return (c) => lash(c, t, clamp((t - w.lashed!) / 0.18));
      case 'shoulder': return (c) => shoulder(c, t, clamp((t - w.shouldered! + 0.55) / 0.6));
      case 'pole': case 'wince': { const pu = clamp((t - (w.pole! - 0.35)) / (w.hole! - w.pole! + 0.45)); return (c) => poleThrough(c, t, kind === 'wince' ? 1 : pu, (t - w.hole!) / 0.35); }
      case 'storm': case 'flicker': return (c) => storm(c, t, { heel: 0.08 * Math.sin(t * 1.7), slide: 0, flash: this.flash(t), bolt: 3 });
      case 'tilt': return (c) => storm(c, t, { heel: -0.05 - 0.34 * ease.inOutCubic(clamp((t - w.reef! - 0.05) / 0.6)), slide: clamp((t - w.night! + 0.05) / 0.4) * 1.0 + clamp((t - w.night! - 0.35) / 0.4), flash: this.flash(t), bolt: 5 });
      default: return (c) => sinking(c, t, clamp((t - w.went! - 0.2) / 1.2));
    }
  }

  // ---------------------------------------------------------------- the story full screen

  full(c: C2, g: C2, t: number, u: number, i: number, story: (c: C2) => void) {
    const D = this.D, drift = 14 * Math.sin(i * 1.7 + u * 2);
    const cam = frameOn(960, 470, 1.0);
    withCam2(c, g, cam, () => {
      seaSet(c, t);
      D.begin(0.95, cam); D.hole(960, 470, 760, 600, 0.35); D.apply(c);
    });
    // the beam comes in from her heart, off the bottom right; the circle fills the frame
    const cr = 466 + 6 * u, cx = 960 + drift, cy = 468, flick = 1 - 0.5 * this.flash(t);
    heartLantern(c, this.X.ctx, 1780, 1320, cx, cy, cr, t, 1, story);
    lanternBeam(g, 1780, 1320, cx, cy, cr, t, 1, flick);
  }

  // ---------------------------------------------------------------- the two of them watching

  watch(c: C2, g: C2, t: number, kind: Kind, u: number, story: (c: C2) => void, flash: number) {
    const w = this.w, D = this.D, t0 = this.cuts[0]!;
    const cams: Partial<Record<Kind, Cam>> = {
      open: camMix(frameOn(975, 540, 1.0), frameOn(990, 560, 1.08), ease.inOutQuad(u)),
      shoulderW: camMix(frameOn(860, 560, 1.42), frameOn(875, 555, 1.5), u),
      raiW: camMix(frameOn(1110, 560, 1.95, -0.02), frameOn(1120, 570, 2.05, -0.02), u),
      lookup: camMix(frameOn(840, 560, 1.7, 0.03), frameOn(850, 540, 1.78, 0.03), u),
      wince: camMix(frameOn(980, 640, 1.5), frameOn(985, 645, 1.58), u),
      flicker: frameOn(975, 590, 1.18 + 0.03 * u),
      sink: camMix(frameOn(990, 560, 1.12), frameOn(990, 570, 1.06), u),
    };
    const cam = cams[kind] ?? {};
    const on = kind === 'open' ? clamp((t - t0 - 0.05) / 0.45) : 1;
    const flick = 1 - 0.55 * flash;
    withCam2(c, g, cam, () => {
      seaSet(c, t);
      torchOnSand(c, TORCH_REST.x, TORCH_REST.y);
      // the girl, on the sand hugging her knees
      const gp = this.girlPose(kind, t);
      const a = girl(c, KNEEL.x, KNEEL.y, GH, gp.pose, { t, col: '#0d0a18', underwater: true, fins: true, slate: true, glint: gp.glint, rim: 'rgba(255,214,140,0.85)', emote: gp.emote, emoteT0: gp.emoteT0 });
      girlBelt(c, a, GH, t, { under: true });
      // Rai, acting the line
      const ra = drawRai(c, RAI.x, RAI.y, RAI.R, { t, heart: 1, heartColor: HEX.gold, glow: HEX.gold, glowStrength: 0.45, ...this.raiAct(kind, t, u) } as RaiOpts);
      if (kind === 'lookup') this.starsInTheSea(g, t);
      seabedFront(c, t, { seed: 7 });
      // the dark: her torch's pool on Rai, the lantern's warm light falling on both of them
      D.begin(0.9, cam);
      D.disc(RAI.x, RAI.y - 30, 230, 0.9, 0.35);
      D.hole(CIRCLE.x + 80, 690, 640, 300, 0.55 * on * flick);
      D.hole(KNEEL.x, KNEEL.y - 120, 210, 190, 0.5);
      D.hole(ra.heart.x, ra.heart.y, 470, 360, 0.85);
      D.apply(c);
      { const gr = g.createRadialGradient(ra.heart.x, ra.heart.y, 0, ra.heart.x, ra.heart.y, 150); gr.addColorStop(0, rgbaHex(HEX.gold, 0.2)); gr.addColorStop(1, rgbaHex(HEX.gold, 0)); g.fillStyle = gr; g.fillRect(ra.heart.x - 150, ra.heart.y - 150, 300, 300); }
      const ang = Math.atan2(RAI.y - TORCH_REST.y - 20, RAI.x - TORCH_REST.x);
      beam(g, TORCH_REST.x + 10, TORCH_REST.y - 4, ang, Math.hypot(RAI.x - TORCH_REST.x, RAI.y - TORCH_REST.y) - RAI.R, 0.2, t, 0.5, 6);
      // the lantern: from her heart to the circle on the dark water
      heartLantern(c, this.X.ctx, ra.heart.x, ra.heart.y, CIRCLE.x, CIRCLE.y, CIRCLE.r, t, on, story);
      lanternBeam(g, ra.heart.x, ra.heart.y, CIRCLE.x, CIRCLE.y, CIRCLE.r, t, on, flick);
      // a few bubbles from her as she raps
      if (kind !== 'sink') for (let k = 0; k < 4; k++) { const d = ((t * 0.9 + k * 0.25) % 1); bubble(c, ra.head.x - 30 + 14 * Math.sin(t * 3 + k), ra.head.y + 20 - d * 260, 5 + 3 * h01(k, 3), 0.6 * (1 - d)); }
    });
    if (kind === 'lookup' || kind === 'raiW') lensReeds(c, t, 12, kind === 'lookup' ? -1 : 1, kind === 'lookup' ? 8 : 9, 0.9);
    void w;
  }

  /** The girl's pose and glint for each watching shot. */
  girlPose(kind: Kind, t: number): { pose: GirlPose; glint: 'plain' | 'spark' | 'droop' | 'wide'; emote?: '!' | 'sweat' | 'joy'; emoteT0?: number } {
    const hug = GIRL_POSES.hug!(t), w = this.w;
    if (kind === 'open' || kind === 'shoulderW' || kind === 'raiW') return { pose: { ...hug, rot: 0.06 + 0.02 * Math.sin(t * 2) }, glint: 'spark' };
    if (kind === 'lookup') return { pose: { ...hug, rot: -0.42 }, glint: 'spark' };
    if (kind === 'wince') { // hands to her mask
      const k = clamp((t - (w.hole! - 0.05)) / 0.12);
      return { pose: { ...hug, rot: lerp(0.05, 0.12, k), sh: [lerp(hug.sh[0], 2.7, k), lerp(hug.sh[1], 2.8, k)], el: [lerp(hug.el[0], 1.75, k), lerp(hug.el[1], 1.85, k)] }, glint: k > 0.5 ? 'droop' : 'wide', emote: '!', emoteT0: w.hole };
    }
    if (kind === 'flicker') return { pose: { ...hug, rot: 0.32, sh: [0.25, 0.4], el: [0.05, 0.05], hip: [1.6, 1.7], knee: [-2.3, -2.4] }, glint: 'wide', emote: 'sweat', emoteT0: this.cuts[13]! + 0.1 };
    return { pose: { ...hug, rot: 0.02 }, glint: 'wide' };
  }

  /** Rai's acting in each watching shot. */
  raiAct(kind: Kind, t: number, u: number): Partial<RaiOpts> {
    const w = this.w;
    const A = (face: Face, arms: [ArmPose, ArmPose], o: Partial<RaiOpts> = {}): Partial<RaiOpts> => ({ face, arms, ...o });
    switch (kind) {
      case 'open': return A('smug', ['point', 'hip'], { armsFrom: ['hip', 'hip'], armsU: clamp((t - this.cuts[0]! - 0.15) / 0.2), tilt: 0.06, marks: ['shine'] as Mark[], markT0: this.cuts[0]! + 0.35 });
      case 'shoulderW': return A('smug', ['point', 'hip'], { tilt: 0.06, look: -0.6 });
      case 'raiW': { const hop = t >= w.four! ? 0.25 * Math.sin(Math.PI * clamp((t - w.four!) / 0.3)) : 0; return A('wow', ['cheek', 'cheek'], { marks: ['sparkle'] as Mark[], markT0: this.cuts[4]! + 0.1, hop, blush: 0.6, look: -0.8 }); }
      case 'lookup': return A('wow', ['reach', 'down'], { armsFrom: ['down', 'down'], armsU: clamp(u * 3), look: -0.9, marks: ['sparkle'] as Mark[], markT0: this.cuts[7]! + 0.2 });
      case 'wince': { const at = w.heart! - 0.05, tap = t > at ? 0.5 + 0.5 * Math.sin((t - at) * 22) : 0;
        return A(t < at ? 'smile' : 'wink', t < at ? ['down', 'down'] : ['down', 'hold'], { armsFrom: ['down', 'down'], armsU: t < at ? 1 : clamp((t - at) / 0.12) * (0.85 + 0.15 * tap), tilt: t < at ? 0 : -0.08, marks: t >= at ? ['shine'] as Mark[] : [], markT0: at + 0.05, look: -0.6 }); }
      case 'flicker': return A('dizzy', ['shrug', 'shrug'], { squash: -0.18 - 0.05 * Math.sin(t * 10), shake: 0.4, tilt: 0.1 * Math.sin(t * 6) });
      case 'sink': { const up = w.sea! - 0.15; // she dips with the stone in the circle, dizzy; then pops back up, grinning
        if (t < up) return A('dizzy', ['down', 'down'], { squash: -0.32 * ease.outCubic(clamp(u * 3)), tilt: 0.12 * Math.sin(t * 5) });
        const d = t - up; return A('grin', ['up', 'up'], { armsFrom: ['down', 'down'], armsU: clamp(d / 0.12), hop: 0.4 * Math.sin(Math.PI * clamp(d / 0.32)), squash: d < 0.05 ? -0.3 : 0.12 * Math.exp(-d * 8), marks: ['sparkle'] as Mark[], markT0: up }); }
      default: return A('smile', ['down', 'down']);
    }
  }

  /** The plankton round them glittering like the stars in her story (the girl looks up as if they were real). */
  starsInTheSea(g: C2, t: number) {
    for (let i = 0; i < 90; i++) {
      const x = 300 + h01(i, 401) * 1400, y = 60 + h01(i, 402) * 520, tw = 0.5 + 0.5 * Math.sin(t * (2 + 4 * h01(i, 403)) + i);
      g.fillStyle = rgbaHex('#fff2c8', 0.5 * tw);
      g.beginPath(); g.arc(x, y, 1.2 + 1.8 * h01(i, 404), 0, TAU); g.fill();
    }
  }
}

export { lerp };
