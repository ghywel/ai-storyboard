// v2 "THE DIVER", DIVE (0–13.26; the spoken lines 0–1 and the "na-na-na" vocalise; TREATMENT-v2.md). The film's
// first frame. Times come from the lyrics and the beat grid; the vocalise is not in the lyrics, so its syllables were
// measured on the take's Demucs vocal stem (NA below).
//   A  0 → the downbeat (2.12)  Dusk at the end of the jetty, fading up from black. The girl stands against the sun
//        with her mask up. Her mother at the lit door of the hut raises a hand ("!": careful). The girl turns and waves
//        her torch, pulls her mask down, clicks the torch on, crouches and dives; she hits the water on the downbeat.
//   B  +½ beat → 3.40  Under the surface: the bubble rush, the camera going down with her into the dark; far below two
//        amber eyes open: "Hi." (Rai, spoken, a few bubbles escaping her).
//   C  3.40 → 5.97  Near dark. Her beam sweeps the seabed: a rock with a shell letterbox, the crab (claws up, off it
//        goes), the bottle with its note, and a stone the beam passes right over: "You can't see me." Her eyes catch
//        the light for a moment (eyeshine), then in the dark they dart about, very pleased. But talking under water
//        makes bubbles: they rise into the girl's light.
//   D  5.97 → 7.26  The beam swings back down the bubbles and stops on her: the ring of light. "That's kind of the
//        whole point." Shock (lines of force, a sweat drop), a sheepish grin, a little wave.
//   E  7.26 → 13.26  The meeting: the girl kneels on the sand with the torch on Rai, and the vocalise becomes their
//        call and response: the low notes are hers (bubbles from her mask), the high notes Rai's (from her mouth);
//        each bubble flies to the other and pops, faster and faster, the cuts tighter with them. On the last "na" Rai's
//        heart lights gold, ready to tell; the girl sits back hugging her knees (lantern opens on that).
// Clues: the lit hut window (home, where 4 am happens); the trader's steamship on the horizon; the rai stone leaning on
// the hut's stilts; the street's letterboxes and house-number pebbles (legend's street); Rai's gold letterbox stuffed
// with post; the toy rai stone on a string at the girl's belt (she already loves them); her little mesh purse (the
// three coins of legend); the slate at her hip.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../../engine/scene';
import { Layer2D, W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import type { Line } from '../../engine/lyrics';
import { clamp, ease, keys, lerp } from '../../engine/util';
import { drawRai, h01, type ArmPose, type Face } from '../_rai';
import { FAM, TAU, rgbaHex } from '../_motifs';
import { seabedFront } from '../_world';
import { focusLines, star4 } from '../_manga';
import { mergePost, punch } from '../_post';
import { girl, mother, GIRL_POSES, bubbleLyric, withCam2, type GirlPose, type GirlAnchors } from './_diver';
import { duskJetty, duskForeground, splash, plungeWater, DECK, DOOR, WATERLINE } from './dive-world';
import {
  Dark, beam, beamLen, pool, aim, bubble, bokeh, foreBokeh, snow, talkBubbles, clearUnderLyric, lyricExtent, lensReeds, crab, seaSet, girlBelt, raiEyes, raiMouth, frameOn, camMix, toScreen,
  RAI, KNEEL, FLOOR, TORCH_REST, type Cam,
} from './dive-sea';

/** The vocalise's syllables (master s) and pitch (H: the high notes, E-flat/D/C; L: the low B-flat), measured on
 *  analysis/work/v2/vocals16k.wav (2026-10-03): energy dips at each "n", pitch by autocorrelation. */
const NA: [number, 'L' | 'H'][] = [
  [7.89, 'L'], [8.12, 'H'], [8.52, 'H'], [8.78, 'L'], [9.0, 'L'], [9.2, 'L'], [9.5, 'L'], [9.84, 'H'],
  [10.32, 'H'], [10.48, 'L'], [10.73, 'H'], [10.9, 'L'], [11.33, 'L'], [11.55, 'H'], [12.06, 'H'], [12.21, 'H'],
];
const GH = 300;            // the girl's height under water
const SILHOUETTE = '#0d0a18';

/** Her dive, a straight body with arms over the head, pitched by rot. */
const divePose = (rot: number): GirlPose => ({ rot, hip: [0.05, -0.05], knee: [-0.05, 0], sh: [Math.PI - 0.12, Math.PI - 0.02], el: [0, 0], head: -0.1 });
const crouch: GirlPose = { rot: 0.32, hip: [1.0, 0.95], knee: [-1.7, -1.65], sh: [-0.75, -0.6], el: [0.2, 0.25], drop: 16, head: -0.1 };
const maskPull: GirlPose = { rot: 0, hip: [-0.06, 0.06], knee: [0, 0], sh: [-0.4, 2.75], el: [0.1, 1.9], head: -0.1 };
const LEG = 37;            // a child's thigh + shin in h/100

export default class Dive extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  D = new Dark();
  hi!: Line; point!: Line; next!: Line;
  T: Record<string, number> = {};
  cuts: number[] = [];

  override init() {
    const { lyrics, audio: au } = this.ctx;
    this.hi = lyrics.get('You can');
    this.point = lyrics.get('whole point');
    this.next = lyrics.get('They cut me out');   // lantern's first line rises in under the cut
    const bt = (k: number) => au.timeOfBeat(k), bAt = (t: number) => Math.floor(au.beatAt(t + 0.02));
    const w = (l: Line, re: RegExp) => (l.words.find((x) => re.test(x.w.toLowerCase())) ?? l.words[0]!).start;
    const hiT = this.hi.words[0]!.start;
    const splashT = au.downbeats.filter((d) => d <= hiT - 0.2).pop() ?? bt(4);          // the downbeat before "Hi."
    const bS = bAt(splashT);
    this.T = {
      warn: bt(bS - 3), turn: bt(bS - 3) + 0.14, back: bt(bS - 2) + 0.17, maskOn: bt(bS - 2) + 0.3, torch: bt(bS - 1), crouch: bt(bS - 1) + 0.02,
      leap: splashT - 0.3, splash: splashT, under: bt(bS + 0.5),
      hi: hiT, you: this.hi.words[1]!.start, see: w(this.hi, /see/), me: w(this.hi, /^me/), hiEnd: this.hi.end,
      that: this.point.words[0]!.start, whole: w(this.point, /whole/), pt: w(this.point, /point/), ptEnd: this.point.end,
    };
    const tSweep = bt(bAt(this.T.you!) - 2), tCatch = bt(bAt(this.T.that!));
    const tMeet = au.downbeats.find((d) => d >= this.T.ptEnd! - 0.05) ?? bt(bAt(this.T.ptEnd!) + 1);
    const lastNa = NA[NA.length - 1]![0];
    this.cuts = [0, this.T.under!, tSweep, tCatch, tMeet, tMeet + 4 * (bt(1) - bt(0)), tMeet + 8 * (bt(1) - bt(0)), bt(bAt(lastNa) - 0)];
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t;
    this.L.clear(HEX.ink); this.G.clear();
    let shot = 0;
    for (let i = 0; i < this.cuts.length; i++) if (t >= this.cuts[i]!) shot = i;
    const t0 = this.cuts[shot]!, t1 = this.cuts[shot + 1] ?? this.ctx.end;
    let post: PostOverrides = { bloom: 0.8, vignette: 0.5 };
    if (shot === 0) post = this.jetty(c, g, t, post);
    else if (shot === 1) post = this.plunge(c, g, t, post);
    else if (shot === 2) post = this.sweep(c, g, t, post);
    else if (shot === 3) post = this.catch_(c, g, t, post);
    else post = this.meet(c, g, t, shot - 4, t0, t1, post);
    // the spoken lines, Cormorant, word by word (nothing over them)
    const line = t < this.T.that! - 0.1 ? this.hi : this.point;
    if (t >= line.words[0]!.start - 0.1 && t <= line.end + 1.05) { const e = lyricExtent(c, line.words.map((w) => w.w), true); clearUnderLyric(g, e.w, e.rows); }
    if (t >= line.words[0]!.start - 0.1 && t <= line.end + 1.05) { // a soft shade behind the spoken words (they have no band)
      const e = lyricExtent(c, line.words.map((w) => w.w), true), a = clamp((t - line.words[0]!.start + 0.1) / 0.2) * (1 - clamp((t - line.end - 0.8) / 0.25));
      c.save(); c.translate(W / 2, H - 112); c.scale(1, 70 / (e.w / 2 + 160));
      const sh = c.createRadialGradient(0, 0, 0, 0, 0, e.w / 2 + 160); sh.addColorStop(0, `rgba(4,6,16,${0.6 * a})`); sh.addColorStop(0.6, `rgba(4,6,16,${0.4 * a})`); sh.addColorStop(1, 'rgba(4,6,16,0)');
      c.fillStyle = sh; c.beginPath(); c.arc(0, 0, e.w / 2 + 160, 0, TAU); c.fill(); c.restore();
    }
    bubbleLyric(c, line, t, { spoken: true });
    if (t >= this.next.words[0]!.start - 0.4) { const e = lyricExtent(c, this.next.words.map((w) => w.w), false); clearUnderLyric(g, e.w, e.rows); bubbleLyric(c, this.next, t); }
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    return post;
  }

  // ---------------------------------------------------------------- A: the jetty at dusk

  jetty(c: CanvasRenderingContext2D, g: CanvasRenderingContext2D, t: number, post: PostOverrides): PostOverrides {
    const T = this.T, u = ease.inOutCubic(clamp(t / T.splash!));
    const cam: Cam = camMix(frameOn(960, 540, 1), frameOn(1070, 575, 1.2), u);
    withCam2(c, g, cam, () => {
      duskJetty(c, g, t);
      // the mother in the lit doorway: still, then a raised hand (careful!)
      const warned = t >= T.warn!;
      mother(c, DOOR.x + 3, DOOR.y, 98, warned ? 'wave' : 'stand', { t, col: '#150c1c', rim: 'rgba(255,190,110,0.9)', emote: warned ? '!' : undefined, emoteT0: T.warn });
      this.girlOnJetty(c, g, t);
    });
    duskForeground(c, t);
    return mergePost(post, { fade: 1 - ease.outCubic(clamp(t / 0.55)), vignette: 0.55, bloom: 0.9 });
  }

  girlOnJetty(c: CanvasRenderingContext2D, g: CanvasRenderingContext2D, t: number) {
    const T = this.T, h = 190, u = h / 100, x0 = 1146;
    const rim = 'rgba(255,196,120,0.95)', base = { t, col: '#140c1e', rim, outfit: 'swim' as const, outfitCol: '#9a6a2a', fins: true, slate: true };
    if (t < T.leap!) {
      let pose: string | GirlPose = 'stand', flip = false, mask: 'up' | 'on' = 'up', blend: { from: GirlPose; u: number } | undefined;
      if (t >= T.turn! && t < T.back!) { pose = 'wave'; flip = true; blend = { from: GIRL_POSES.stand!(t), u: clamp((t - T.turn!) / 0.12) }; }
      else if (t >= T.back! && t < T.crouch!) { pose = maskPull; blend = { from: GIRL_POSES.stand!(t), u: clamp((t - T.back!) / 0.12) }; if (t >= T.maskOn!) { mask = 'on'; blend = { from: maskPull, u: 1 - clamp((t - T.maskOn!) / 0.12) }; pose = GIRL_POSES.stand!(t); } }
      else if (t >= T.crouch!) { pose = crouch; mask = 'on'; blend = { from: GIRL_POSES.stand!(t), u: ease.outCubic(clamp((t - T.crouch!) / (T.leap! - T.crouch!))) }; }
      const a = girl(c, x0, DECK, h, pose, { ...base, flip, mask, torch: true, glint: 'plain', blend });
      girlBelt(c, a, h, t, { flip });
      if (t >= T.torch! && a.torch) this.torchFlare(g, a.torch.x, a.torch.y, t - T.torch!);
      return;
    }
    // the leap: an arc out over the water, pitching from 0.85 to head-down; her hands touch the water on the downbeat
    const s = (t - T.leap!) / (T.splash! - T.leap!), ex = 1330, ey = WATERLINE;
    const rot = lerp(0.9, 2.45, ease.inOutQuad(clamp(s)));
    const bodyToHands = (29 - 3 + 16 + 15) * u;   // pelvis to fingertips along the body (torso to the shoulder, the arm)
    const px = lerp(x0, ex - Math.sin(rot) * bodyToHands * 0.95, s) + 0, py0 = DECK - LEG * u;
    const py = lerp(py0, ey + Math.cos(rot) * bodyToHands * 0.95, s) - 150 * Math.sin(Math.PI * clamp(s)) * (1 - s * 0.3) + (s > 1 ? (s - 1) * 260 : 0);
    c.save(); c.beginPath(); c.rect(-W, -H, 3 * W, WATERLINE + H); c.clip();
    const a = girl(c, px, py, h, divePose(rot), { ...base, mask: 'on', torch: true, glint: 'plain' });
    c.restore();
    if (a.torch && py < WATERLINE) this.torchFlare(g, a.torch.x, a.torch.y, 1);
    splash(c, g, ex, ey, (t - T.splash!) / 0.7);
  }

  torchFlare(g: CanvasRenderingContext2D, x: number, y: number, age: number) {
    const k = age < 0.15 ? 1 + 0.8 * (1 - age / 0.15) : 1;
    const gr = g.createRadialGradient(x, y, 0, x, y, 26 * k);
    gr.addColorStop(0, rgbaHex('#fff6d8', 0.9)); gr.addColorStop(1, rgbaHex('#ffd994', 0));
    g.fillStyle = gr; g.fillRect(x - 30 * k, y - 30 * k, 60 * k, 60 * k);
    if (age < 0.3) star4(g, x, y, 16 * (1 - age / 0.3) + 4, rgbaHex('#fff6d8', 0.8));
  }

  // ---------------------------------------------------------------- B: the plunge

  plunge(c: CanvasRenderingContext2D, g: CanvasRenderingContext2D, t: number, post: PostOverrides): PostOverrides {
    const T = this.T, dt = t - T.splash!, dEnd = this.cuts[2]! - T.splash!;
    const camY = lerp(-0.3 * H, 0.42 * H, ease.outCubic(clamp((t - this.cuts[1]!) / (this.cuts[2]! - this.cuts[1]!))));
    plungeWater(c, g, t, camY);
    // where she is (world px): in fast, slowing, swinging from head-down into a downward glide
    const at = (d: number) => ({ x: W * 0.47 + 150 * d - 40 * d * d, y: 1050 * d - 360 * d * d });
    const me = at(dt);
    const rot = lerp(Math.PI - 0.22, Math.PI / 2 + 0.55, ease.outCubic(clamp(dt / 0.95)));
    // Rai far below in the gloom: only her eyes, opening on "Hi." (happy), then looking up at the girl
    const rx = W * 0.26, ry = 0.95 * H + 1.24 * 46 - camY, R = 46;
    const open = clamp((t - (T.hi! - 0.2)) / 0.12);
    if (open > 0) {
      const head = { x: rx, y: ry - 1.2 * R, r: 0.74 * R }, eyes = raiEyes(head);
      c.save(); c.beginPath(); for (const e of eyes) { c.moveTo(e.x + R * 0.22, e.y); c.ellipse(e.x, e.y, R * 0.22, R * 0.24 * open, 0, 0, TAU); } c.clip();
      drawRai(c, rx, ry, R, { t, face: t < T.hi! + 0.45 ? 'grin' : 'smile', look: 0.8, noBlink: true });
      c.restore();
      for (const e of eyes) { const gr = g.createRadialGradient(e.x, e.y, 0, e.x, e.y, 30); gr.addColorStop(0, rgbaHex('#fab852', 0.55 * open)); gr.addColorStop(1, rgbaHex('#fab852', 0)); g.fillStyle = gr; g.fillRect(e.x - 30, e.y - 30, 60, 60); }
      talkBubbles(c, t, [T.hi!], () => ({ x: rx, y: ry - 0.95 * R }), { n: 4, size: 6, life: 1.3, a: 0.75 });
    }
    // the bubble rush: the air she dragged in, carried down with her at first (then the drag wins) and rising past her
    const vel = (d: number) => 1050 - 720 * d;
    for (let i = 0; i < 170; i++) {
      const sp = 0.42 * Math.pow(h01(i, 1), 1.4), age = dt - sp;
      if (age < 0) continue;
      const o = at(sp), v0 = Math.max(0, vel(sp)) * (0.55 + 0.35 * h01(i, 6)), k = 4.5;
      const spread = 70 + 180 * h01(i, 2) * (1 - sp);
      const x = o.x + (h01(i, 7) - 0.5) * spread * 2 * (0.4 + Math.min(1, age * 1.6)) + 14 * Math.sin(age * 5 + i);
      const y = o.y + (h01(i, 3) - 0.5) * 80 + v0 * (1 - Math.exp(-k * age)) / k - age * (100 + 200 * h01(i, 4)) - age * age * 70 - camY;
      const r = 3 + 24 * Math.pow(h01(i, 5), 2.4);
      bubble(c, x, y, r, clamp(1.6 - age * 0.6));
    }
    const a = girl(c, me.x, me.y - camY, GH, aim({ ...GIRL_POSES.glide!(t), rot }, rot - Math.PI / 2 + 0.3), { t, col: SILHOUETTE, underwater: true, fins: true, torch: true, slate: true, glint: 'wide', rim: 'rgba(255,200,160,0.8)' });
    girlBelt(c, a, GH, t, { under: true });
    if (a.torch) beam(g, a.torch.x, a.torch.y, a.torch.ang, 640, 0.13, t, clamp((dt - 0.3) / 0.25), 3);
    talkBubbles(c, t, [T.splash! + 0.6, T.splash! + 1.0], () => ({ x: a.head.x, y: a.head.y }), { n: 3, size: 6, life: 1.0, seed: 9 });
    return mergePost(post, { bloom: 0.85, vignette: 0.55 }, punch(t, [T.under!], 0.025, 0.3));
  }

  // ---------------------------------------------------------------- C: the sweep

  /** The beam's aim point in the sweep and the catch (world px): along the seabed, past her, then up the bubbles and back down. */
  aimAt(t: number) {
    const T = this.T, s0 = this.cuts[2]!;
    const k = (dt: number) => s0 + dt;
    // along the sand from the left (the rock at No. 3, the crab, No. 5, the bottle), across her on "see", then up
    // into the open water beyond her, where her bubbles come floating up into it; down the bubbles onto her
    const xs: [number, number][] = [[k(0), 150], [k(0.4), 300], [k(0.65), 470], [k(0.85), 600], [T.you!, 900], [T.see!, 1176], [T.me! + 0.15, 1420], [k(1.95), 1640], [k(2.15), 1560], [k(2.38), 1250], [T.that! - 0.03, 1215], [T.that! + 0.04, 1182]];
    const ys: [number, number][] = [[k(0), 880], [k(0.85), 905], [T.you!, 890], [T.see!, 790], [T.me! + 0.15, 520], [k(1.95), 470], [k(2.15), 500], [k(2.38), 470], [T.that! - 0.03, 520], [T.that! + 0.04, 700]];
    return { x: keys(t, xs.map(([a, b]) => [a, b, ease.inOutQuad])), y: keys(t, ys.map(([a, b]) => [a, b, ease.inOutQuad])) };
  }

  sweep(c: CanvasRenderingContext2D, g: CanvasRenderingContext2D, t: number, post: PostOverrides): PostOverrides {
    const T = this.T, s0 = this.cuts[2]!, lt = t - s0;
    const cam = frameOn(960 + 30 * ease.inOutQuad(clamp(lt / 2.6)), 540, 1.04 + 0.03 * clamp(lt / 2.6));
    const D = this.D;
    let hb: { x: number; y: number }[] = [];
    withCam2(c, g, cam, () => {
      seaSet(c, t);
      // the crab: claws up when the light finds it, then off out of the light
      const hit = clamp((t - (s0 + 0.32)) / 0.12), run = clamp((t - (s0 + 0.55)) / 0.9);
      crab(c, 310 - 170 * ease.inOutQuad(run), 902, 0.85, t, { claws: hit * (1 - run * 0.7), walk: run });
      const ra = this.raiSweep(c, t);
      hb = this.raiTalk(c, t, ra.head);
      // the girl, hovering high on the left, her beam on the aim point
      const gx = lerp(300, 420, ease.outCubic(clamp(lt / 1.2))), gy = lerp(250, 330, ease.outCubic(clamp(lt / 1.2))) + 8 * Math.sin(t * 1.7);
      const P = this.aimAt(t), base = GIRL_POSES.torch!(t);
      const rough = Math.atan2(P.y - gy, P.x - gx);
      const noticed = t > s0 + 1.95;
      const a = girl(c, gx, gy, GH, aim(base, rough), { t, col: SILHOUETTE, underwater: true, fins: true, torch: true, slate: true, glint: noticed ? 'wide' : 'plain', rim: 'rgba(255,220,160,0.7)' });
      girlBelt(c, a, GH, t, { under: true });
      const tx = a.torch!.x, ty = a.torch!.y, ang = Math.atan2(P.y - ty, P.x - tx), len = Math.min(1500, beamLen(tx, ty, ang, FLOOR + 140));
      seabedFront(c, t, { seed: 7 });
      // the dark, with the beam's light in it
      D.begin(0.97, cam);
      D.cone(tx, ty, ang, len, 0.1, 0.95);
      const e = { x: tx + Math.cos(ang) * len, y: ty + Math.sin(ang) * len };
      D.hole(e.x, e.y, 170, 80, 0.97);
      D.hole(tx, ty, 90, 90, 0.6);
      D.hole(gx + 20, gy, 170, 110, 0.32);
      if (this.eyesShown(t)) for (const p of raiEyes(ra.head)) D.hole(p.x, p.y, 16, 13, 1);
      D.apply(c);
      beam(g, tx, ty, ang, len, 0.1, t, 1, 4);
      pool(g, e.x, e.y, 180, 60, 0.8);
      // her eyes catch the light as it crosses her (eyeshine), and glow amber in the dark after
      const shine = clamp(1 - Math.abs(t - T.see!) / 0.09);
      for (const p of raiEyes(ra.head)) {
        const k = this.eyesShown(t) ? 0.4 : 0;
        const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, 26 + 20 * shine); gr.addColorStop(0, rgbaHex('#ffc35a', Math.max(k, 0.95 * shine))); gr.addColorStop(1, rgbaHex('#ffc35a', 0));
        g.fillStyle = gr; g.fillRect(p.x - 50, p.y - 50, 100, 100);
        if (shine > 0.2) star4(g, p.x, p.y, 14 * shine, rgbaHex('#fff6dc', shine));
      }
      // her bubbles shine where they cross the beam
      for (const b of hb) { const d = this.inBeam(b, tx, ty, ang, 0.1); if (d > 0) { bubble(c, b.x, b.y, 11, d); star4(g, b.x - 4, b.y - 4, 7 * d, rgbaHex('#fff6dc', 0.8 * d)); } }
    });
    return post;
  }

  /** Is world point b inside the beam's cone? 0..1 */
  inBeam(b: { x: number; y: number }, x: number, y: number, ang: number, spread: number) {
    const dx = b.x - x, dy = b.y - y, d = Math.hypot(dx, dy), off = Math.abs(Math.atan2(dy, dx) - ang);
    return d > 30 ? clamp(1 - off / spread) : 0;
  }

  eyesShown(t: number) { return t > this.T.see! + 0.06 && t < this.T.that!; }

  /** Rai in the sweep: playing stone; her eyes wide as the light crosses; cheeky in the dark after. */
  raiSweep(c: CanvasRenderingContext2D, t: number) {
    const T = this.T;
    let face: Face = 'smile', look = 0;
    if (t > T.see! - 0.12 && t < T.see! + 0.1) face = 'wow';
    else if (t >= T.see! + 0.1) { face = 'cheeky'; look = Math.sin((t - T.see!) * 8) > 0 ? 0.9 : -0.9; }
    return drawRai(c, RAI.x, RAI.y, RAI.R, { t, face, look, noBlink: true, arms: ['down', 'down'], heart: 0, glowStrength: 0 });
  }

  /** The bubbles Rai lets out as she speaks (each word), returned as points so the beam can light them. */
  raiTalk(c: CanvasRenderingContext2D, t: number, head: { x: number; y: number; r: number }) {
    const words = this.hi.words.map((w) => w.start);
    const m = raiMouth(head), pts: { x: number; y: number }[] = [];
    for (let k = 0; k < words.length; k++) for (let i = 0; i < 3; i++) {
      const d = t - words[k]! - i * 0.07;
      if (d < 0 || d > 3) continue;
      const rise = d * (95 + 40 * h01(k, i, 3)) + d * d * 26;
      pts.push({ x: m.x + (h01(k, i, 4) - 0.5) * 22 + 6 * Math.sin(d * 7 + i), y: m.y - rise });
    }
    for (const p of pts) bubble(c, p.x, p.y, 7, 0.35);   // faint in the dark (they shine when the beam finds them)
    return pts;
  }

  // ---------------------------------------------------------------- D: the catch

  catch_(c: CanvasRenderingContext2D, g: CanvasRenderingContext2D, t: number, post: PostOverrides): PostOverrides {
    const T = this.T, s0 = this.cuts[3]!, lt = t - s0, D = this.D;
    const caught = t >= T.that!;
    const cam = frameOn(RAI.x - 40, RAI.y - 70, 1.55 + 0.08 * ease.outCubic(clamp(lt / 1.2)));
    withCam2(c, g, cam, () => {
      seaSet(c, t);
      // her acting: smug in the dark, then caught: shock; then a sheepish grin; then a little wave
      let face: Face = 'smug', arms: [ArmPose, ArmPose] = ['hip', 'hip'], from: [ArmPose, ArmPose] = ['hip', 'hip'], at = s0, tilt = 0.05, squash = 0, blush = 0;
      const marks: ('!' | 'sweat' | 'shine')[] = [];
      let markT0 = -1e9;
      if (caught && t < T.that! + 0.42) { face = 'shock'; arms = ['down', 'down']; at = T.that!; tilt = 0; squash = 0.18 * Math.exp(-(t - T.that!) * 6); marks.push('!', 'sweat'); markT0 = T.that!; }
      else if (caught && t < T.pt!) { face = 'grin'; arms = ['down', 'cheek']; from = ['down', 'down']; at = T.that! + 0.42; tilt = -0.07; blush = 0.8; marks.push('sweat'); markT0 = T.that!; }
      else if (caught) { face = 'grin'; arms = ['down', 'wave']; from = ['down', 'cheek']; at = T.pt!; tilt = -0.05; blush = 0.5; marks.push('sweat'); markT0 = T.that!; }
      const ra = drawRai(c, RAI.x, RAI.y, RAI.R, { t, face, arms, armsFrom: from, armsU: clamp((t - at) / 0.14), tilt, squash, blush, marks, markT0, look: caught ? -0.5 : 0.6, noBlink: true, glow: HEX.gold, glowStrength: caught ? 0.5 : 0 });
      if (caught && t < T.that! + 0.12) focusLines(c, ra.head.x, ra.head.y + 60, 230, 'rgba(255,248,225,0.75)', t, { n: 70 });
      // her bubbles, still rising, lit as the beam runs down them
      const hb = this.raiTalk(c, t, ra.head);
      seabedFront(c, t, { seed: 7 });
      // the girl's beam from off to the left, sliding down the bubbles onto her
      const gx = 420, gy = 330 + 8 * Math.sin(t * 1.7);
      const P = this.aimAt(t);
      const tx = gx + 60, ty = gy + 40, ang = Math.atan2(P.y - ty, P.x - tx), len = Math.hypot(P.x - tx, P.y - ty) - (caught ? 200 : -120);
      D.begin(0.94, cam);
      D.cone(tx, ty, ang, len, 0.09, 0.9);
      if (caught) D.disc(RAI.x, RAI.y - 30, 255 * ease.outBack(clamp((t - T.that!) / 0.16)), 1, 0.14);
      else D.hole(P.x, P.y, 140, 140, 0.9);
      if (!caught) for (const p of raiEyes(ra.head)) D.hole(p.x, p.y, 16, 13, 1);
      D.apply(c);
      beam(g, tx, ty, ang, len, 0.09, t, 0.8, 4);
      if (caught) { // the ring: the circle of torchlight around her (its rim catches the light)
        const r = 255 * ease.outBack(clamp((t - T.that!) / 0.16));
        g.strokeStyle = rgbaHex('#ffe0a0', 0.16); g.lineWidth = 5; g.beginPath(); g.arc(RAI.x, RAI.y - 30, r - 4, 0, TAU); g.stroke();
      } else for (const p of raiEyes(ra.head)) { const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, 26); gr.addColorStop(0, rgbaHex('#ffc35a', 0.4)); gr.addColorStop(1, rgbaHex('#ffc35a', 0)); g.fillStyle = gr; g.fillRect(p.x - 30, p.y - 30, 60, 60); }
      for (const b of hb) { const d = this.inBeam(b, tx, ty, ang, 0.09); if (d > 0) bubble(c, b.x, b.y, 8, d); }
    });
    lensReeds(c, t, 11, -1, 3, 0.95);
    return mergePost(post, punch(t, [T.that!], 0.04, 0.3), { vignette: 0.6 });
  }

  // ---------------------------------------------------------------- E: the meeting, the call and response

  meet(c: CanvasRenderingContext2D, g: CanvasRenderingContext2D, t: number, k: number, t0: number, t1: number, post: PostOverrides): PostOverrides {
    const T = this.T, D = this.D, lt = t - t0, u = clamp(lt / (t1 - t0)), tm = this.cuts[4]!;
    const last = NA[NA.length - 1]![0];
    const gold = clamp((t - last) / 0.25);                     // her heart, on the last "na"
    // E1 the wide; E2 a lower, tighter two-shot; E3 whip-pans between them, following each "na" to its singer;
    // E4 back to the two of them for her golden heart
    const singer = NA.filter(([x]) => x <= t + 0.03).pop();
    const prev = NA.filter(([x]) => singer && x < singer[0]).pop();
    const at = (p: 'L' | 'H') => (p === 'L' ? { x: 905, y: 655 } : { x: 1065, y: 640 });
    const wu = singer ? ease.inOutCubic(clamp((t - singer[0] + 0.03) / 0.14)) : 1;
    const from = prev ? at(prev[1]) : at('L'), to = singer ? at(singer[1]) : at('L');
    const cams: Cam[] = [
      camMix(frameOn(980, 600, 1.12), frameOn(975, 615, 1.2), ease.inOutQuad(u)),
      camMix(frameOn(985, 680, 1.45, -0.02), frameOn(985, 680, 1.55, -0.03), ease.inOutQuad(u)),
      frameOn(lerp(from.x, to.x, wu), lerp(from.y, to.y, wu), 1.72 + 0.12 * u, 0.02 * (to.x > 1000 ? -1 : 1)),
      camMix(frameOn(1060, 620, 1.55), frameOn(975, 540, 1.0), ease.inOutCubic(clamp((t - last - 0.25) / (this.ctx.end - last - 0.25)))),
    ];
    const cam = cams[Math.min(3, k)]!;
    let gHead = { x: 0, y: 0 }, rHead = { x: 0, y: 0, r: 1 };
    withCam2(c, g, cam, () => {
      seaSet(c, t);
      // the girl drifts down into a kneel facing Rai; at the end she sits back and hugs her knees
      const arrive = ease.inOutCubic(clamp((t - tm) / 0.6));
      const pelK = { x: KNEEL.x, y: KNEEL.y - (LEG - 18) * KNEEL.h / 100 };
      const pel = { x: lerp(560, pelK.x, arrive), y: lerp(560, pelK.y, arrive) };
      const P = { x: RAI.x - 10, y: RAI.y - 30 };
      const kneel = GIRL_POSES.kneel!(t), glide = GIRL_POSES.glide!(t);
      const sitBack = clamp((t - last - 0.45) / 0.5);
      let pose: GirlPose = kneel;
      if (arrive < 1) pose = { ...kneel, rot: lerp(glide.rot, 0, arrive), sh: [lerp(glide.sh[0], kneel.sh[0], arrive), lerp(glide.sh[1], kneel.sh[1], arrive)], hip: [lerp(glide.hip[0], 0, arrive), lerp(glide.hip[1], 0.05, arrive)], knee: [lerp(glide.knee[0], -Math.PI / 2, arrive), lerp(glide.knee[1], -Math.PI / 2, arrive)], el: kneel.el, drop: 18 * arrive, head: lerp(-0.2, 0, arrive) };
      // a little bounce on each of her notes (her bubble out)
      const mine = NA.filter(([x, p]) => p === 'L' && x <= t).pop();
      const bob = mine ? 0.06 * Math.exp(-(t - mine[0]) * 8) : 0;
      pose = { ...pose, head: (pose.head ?? 0) - bob * 2 };
      const upright = Math.abs(pose.rot) < 0.8;
      const hugPel = { x: KNEEL.x, y: KNEEL.y - 3 * KNEEL.h / 100 }, sb = ease.inOutCubic(sitBack);
      if (sb > 0) { pel.x = lerp(pel.x, hugPel.x, sb); pel.y = lerp(pel.y, hugPel.y, sb); }
      const gx = pel.x, gy = upright ? pel.y + (LEG - (sitBack > 0 ? lerp(pose.drop ?? 0, GIRL_POSES.hug!(t).drop ?? 0, sb) : pose.drop ?? 0)) * KNEEL.h / 100 : pel.y;
      const torchAng0 = Math.atan2(P.y - (pel.y - 90), P.x - (pel.x + 40));
      let gp = aim(pose, torchAng0);
      if (sitBack > 0) { const hug = { ...GIRL_POSES.hug!(t), rot: 0.06 + 0.02 * Math.sin(t * 2) }; const sitBack_ = sb; void sitBack_; gp = { ...gp, sh: [lerp(gp.sh[0], hug.sh[0], sb), lerp(gp.sh[1], hug.sh[1], sb)], el: [lerp(gp.el[0], hug.el[0], sb), lerp(gp.el[1], hug.el[1], sb)], hip: [lerp(gp.hip[0], hug.hip[0], sb), lerp(gp.hip[1], hug.hip[1], sb)], knee: [lerp(gp.knee[0], hug.knee[0], sb), lerp(gp.knee[1], hug.knee[1], sb)], drop: lerp(gp.drop ?? 0, hug.drop ?? 0, sb), rot: lerp(gp.rot, hug.rot, sb) }; }
      const spark = t > NA[0]![0] - 0.05;
      const holding = sitBack < 0.5;
      // the torch: in her hand, then laid on the sand pointing at Rai as she sits back
      const a = girl(c, gx, gy, GH, gp, { t, col: SILHOUETTE, underwater: true, fins: true, torch: holding, slate: true, glint: gold > 0 ? 'spark' : spark ? (mine && t - mine[0] < 0.2 ? 'spark' : 'plain') : 'wide', rim: 'rgba(255,220,160,0.75)' });
      girlBelt(c, a, GH, t, { under: true });
      gHead = a.head;
      const src = holding && a.torch ? a.torch : { x: TORCH_REST.x, y: TORCH_REST.y, ang: Math.atan2(RAI.y - 20 - TORCH_REST.y, RAI.x - TORCH_REST.x) };
      if (!holding) torchOnSand(c, src.x, src.y, src.ang);
      // Rai: cheeky as the girl arrives; then she answers each high note (an open "o"), joy with a hop, faster
      const ra = this.raiMeet(c, t, gold);
      rHead = ra.head;
      seabedFront(c, t, { seed: 7 });
      // the dark: the beam on Rai, her circle, the girl in its spill; Rai's gold heart lighting everything up
      const ang = Math.atan2(P.y - src.y, P.x - src.x), len = Math.hypot(P.x - src.x, P.y - src.y) - RAI.R * 1.05;
      D.begin(0.9 - 0.06 * gold, cam);
      D.cone(src.x, src.y, ang, len + 60, 0.16, 0.9);
      D.disc(RAI.x, RAI.y - 30, 245, 0.97, 0.3);
      D.hole(gx + 30, gy - 120, 200, 190, 0.62);
      if (gold > 0) D.hole(ra.heart.x, ra.heart.y, 470 * ease.outCubic(gold), 360 * ease.outCubic(gold), 0.85 * gold);
      D.apply(c);
      beam(g, src.x, src.y, ang, len, 0.16, t, 0.6, 6);
      // the bubbles of the call and response, in the light
      this.naBubbles(c, g, t, a, ra.head);
      if (gold > 0) { // her heart: a gold lantern lighting, flaring on the last note
        const fl = 1 + 0.7 * Math.exp(-(t - last) * 5);
        const gr = g.createRadialGradient(ra.heart.x, ra.heart.y, 0, ra.heart.x, ra.heart.y, 190 * fl);
        gr.addColorStop(0, rgbaHex(HEX.gold, 0.6 * gold)); gr.addColorStop(0.2, rgbaHex(HEX.gold, 0.22 * gold)); gr.addColorStop(0.5, rgbaHex(HEX.gold, 0.06 * gold)); gr.addColorStop(1, rgbaHex(HEX.gold, 0));
        g.fillStyle = gr; g.fillRect(ra.heart.x - 300 * fl, ra.heart.y - 300 * fl, 600 * fl, 600 * fl);
        if (t - last < 0.5) for (let i = 0; i < 8; i++) { const an = i * TAU / 8 + 0.2, r = 60 + 340 * (t - last); star4(g, ra.heart.x + Math.cos(an) * r, ra.heart.y + Math.sin(an) * r, 16 * (1 - (t - last) / 0.5), rgbaHex('#fff2c0', 0.9)); }
      }
    });
    void gHead; void rHead;
    // the focus pull: the reeds by the lens are sharp as she drifts down past them, then go soft as we settle on the two
    if (k === 0) lensReeds(c, t, 14 * ease.inOutCubic(clamp((t - tm - 0.3) / 0.9)), 1, 5, 0.95);
    if (k === 3) lensReeds(c, t, 12, -1, 6, 0.9);
    return mergePost(post, punch(t, [last], 0.035, 0.4), { vignette: 0.55 });
  }

  raiMeet(c: CanvasRenderingContext2D, t: number, gold: number) {
    const tm = this.cuts[4]!, last = NA[NA.length - 1]![0];
    const hers = NA.filter(([x, p]) => p === 'H' && x <= t + 0.02).pop();
    const singing = hers && t - hers[0] < 0.22 && hers[0] !== last;
    const heard = NA.filter(([x, p]) => p === 'L' && x <= t).pop();
    let face: Face = 'grin', arms: [ArmPose, ArmPose] = ['down', 'wave'], from: [ArmPose, ArmPose] = ['down', 'wave'], at = tm, tilt = 0, hop = 0, squash = 0, look = -0.6;
    const marks: ('sparkle' | '?' | 'notes' | 'shine')[] = [];
    let markT0 = -1e9;
    if (t >= tm + 0.5 && t < NA[0]![0]) { face = 'cheeky'; arms = ['hip', 'hip']; from = ['down', 'wave']; at = tm + 0.5; tilt = 0.08; }
    else if (t >= NA[0]![0] && t < NA[1]![0]) { face = 'cheeky'; arms = ['hip', 'hip']; tilt = 0.14; marks.push('?'); markT0 = NA[0]![0] + 0.05; }
    else if (t >= NA[1]![0] && gold <= 0) {
      const late = t > 10.6;
      face = singing ? 'wow' : late ? 'joy' : 'cheeky'; arms = late ? ['up', 'up'] : ['hip', 'wave']; from = ['hip', 'hip']; at = NA[1]![0];
      tilt = (heard && heard[0] > (hers?.[0] ?? 0) ? -0.1 : 0.06) * (late ? 0.5 : 1);
      if (singing && late) { const d = t - hers![0]; hop = 0.28 * Math.sin(Math.PI * clamp(d / 0.22)); squash = d < 0.04 ? -0.2 : 0.1; }
      marks.push(late ? 'sparkle' : 'notes'); markT0 = late ? 10.7 : NA[1]![0];
    } else if (gold > 0) {
      const d = t - last;
      face = d < 0.6 ? 'joy' : 'smug'; arms = d < 0.6 ? ['up', 'up'] : ['hip', 'hip']; from = ['up', 'up']; at = last + 0.6;
      hop = d < 0.4 ? 0.35 * Math.sin(Math.PI * clamp(d / 0.4)) : 0; squash = d < 0.05 ? -0.25 : 0;
      tilt = d < 0.6 ? 0 : 0.08; look = -0.7;
      marks.push(d < 0.6 ? 'sparkle' : 'shine'); markT0 = d < 0.6 ? last : last + 0.62;
    }
    return drawRai(c, RAI.x, RAI.y, RAI.R, { t, face, arms, armsFrom: from, armsU: clamp((t - at) / 0.15), tilt, hop, squash, look, marks, markT0, noBlink: singing, heart: gold, heartColor: HEX.gold, glow: HEX.gold, glowStrength: 0.3 + 0.9 * gold });
  }

  /** Each "na" a bubble from the singer (a note in it) that flies to the other and pops. */
  naBubbles(c: CanvasRenderingContext2D, g: CanvasRenderingContext2D, t: number, a: GirlAnchors, rh: { x: number; y: number; r: number }) {
    const last = NA[NA.length - 1]![0];
    const gm = { x: a.head.x + 44, y: a.head.y + 4 }, rm = { x: rh.x - rh.r * 1.35, y: rh.y + rh.r * 0.25 };
    for (let i = 0; i < NA.length; i++) {
      const [tn, p] = NA[i]!;
      if (tn === last) continue;
      const fly = 0.46, d = t - tn;
      if (d < -0.02 || d > fly + 0.25) continue;
      const from = p === 'L' ? gm : rm, to = p === 'L' ? { x: rh.x - rh.r * 1.5, y: rh.y - rh.r * 1.6 } : { x: gm.x + 40, y: gm.y - 120 };
      const s = clamp(d / fly), e = 0.12 + 0.88 * ease.inOutQuad(s);   // it leaves the lips already a bubble's width out
      const x = lerp(from.x, to.x, e), y = lerp(from.y, to.y, e) - 120 * Math.sin(Math.PI * e) + 4 * Math.sin(d * 18);
      const r = (p === 'L' ? 30 : 38) * ease.outBack(clamp(d / 0.1), 3);
      if (d <= fly) {
        const col = p === 'L' ? HEX.yellow : HEX.gold;
        const gr = g.createRadialGradient(x, y, 0, x, y, r * 1.8); gr.addColorStop(0, rgbaHex(col, 0.22)); gr.addColorStop(1, rgbaHex(col, 0));
        g.fillStyle = gr; g.fillRect(x - r * 2, y - r * 2, r * 4, r * 4);
        c.save();
        c.fillStyle = 'rgba(200,240,255,0.16)'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(235,252,255,0.95)'; c.lineWidth = 3; c.stroke();
        c.fillStyle = 'rgba(255,255,255,0.95)'; c.beginPath(); c.ellipse(x - r * 0.38, y - r * 0.4, r * 0.2, r * 0.12, -0.6, 0, TAU); c.fill();
        c.font = font(FAM.hook(), r * 1.15); c.textAlign = 'center'; c.textBaseline = 'middle';
        c.lineWidth = 4; c.strokeStyle = 'rgba(20,14,40,0.85)'; c.strokeText('♪', x + 2, y + 3);
        c.fillStyle = col; c.fillText('♪', x + 2, y + 3);
        c.restore();
        // a few tiny bubbles trailing it
        for (let j = 0; j < 3; j++) bubble(c, lerp(from.x, x, 0.45 + 0.18 * j) + 6 * Math.sin(t * 9 + j), lerp(from.y, y, 0.45 + 0.18 * j) + 10, 3 + j, 0.8);
      } else { // pop
        const q = (d - fly) / 0.25;
        c.save(); c.strokeStyle = `rgba(230,250,255,${0.9 * (1 - q)})`; c.lineWidth = 2.5;
        for (let j = 0; j < 8; j++) { const an = j * TAU / 8, r0 = r * (0.8 + q * 0.9); c.beginPath(); c.moveTo(x + Math.cos(an) * r0, y + Math.sin(an) * r0); c.lineTo(x + Math.cos(an) * (r0 + 10), y + Math.sin(an) * (r0 + 10)); c.stroke(); }
        c.restore();
        star4(g, x, y, 18 * (1 - q), rgbaHex(p === 'L' ? HEX.yellow : HEX.gold, 0.9));
      }
    }
  }
}


/** The torch lying on the sand, its lens towards Rai. */
function torchOnSand(c: CanvasRenderingContext2D, x: number, y: number, ang: number) {
  c.save(); c.translate(x, y); c.rotate(ang * 0.3);
  c.fillStyle = 'rgba(10,20,40,0.4)'; c.beginPath(); c.ellipse(-8, 10, 40, 6, 0, 0, TAU); c.fill();
  c.fillStyle = '#e8e2d0'; c.beginPath(); c.roundRect(-44, -8, 46, 16, 5); c.fill();
  c.fillStyle = '#b8b2a0'; c.fillRect(-12, -10, 12, 20);
  c.fillStyle = '#fff6c8'; c.beginPath(); c.ellipse(2, 0, 4, 9, 0, 0, TAU); c.fill();
  c.restore();
}

export { toScreen, snow, bokeh, KNEEL };
