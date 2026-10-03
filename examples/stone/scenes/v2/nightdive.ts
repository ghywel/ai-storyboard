// v2 NIGHTDIVE (the breakdown, sung once, dark, D minor; lines 40-43). The night after the dinner: the girl leads the
// village down to the shore with lanterns, the pole goes into the sea on their shoulders, and under the water they
// thread it through Rai's heart and lift her. Shots (cuts on the beat at or nearest each word; this take's times):
//   N1a 145.65 "One": the girl leads, her lantern held high, the pendant on her tee; her mother right behind with a
//              lantern, the village's lanterns bobbing after them; the hut with the lit window up the beach (home).
//              Rai pops out of the pendant: determined, a fist up.
//   N1b 146.51 "pole,": the wide shore: lanterns winding down from the huts, the long pole on four divers'
//              shoulders, canoes pushed out into the surf with torches at their prows, the moon's path on the sea.
//   N2  147.37 "every shoulder,": under the surface: the canoes' hulls against the lanterns floating above, the divers
//              plunging in and going down head first in a column of torchlight, the pole between two of them, the
//              ropes trailing; the girl among them; far below in the dark, a pink glow (her heart, waiting).
//   N3  148.65 "nobody carries me": the seabed at night; the divers come down in a ring round her and every torch finds
//              her: a ring of light. Rai: wow, then love (hands to her cheeks, hearts), her heart lighting pink.
//   N4  150.79 "alone;": close: the pole slides in behind her and through her heart; it tickles (she giggles, squirms,
//              blushes); then she winks at the girl, who sparkles back. (In `lantern` the pole made the girl wince.)
//   N5  152.94 "one pole, every shoulder,": the wide: the ropes from the two canoes above snap taut on "one"; on each
//              beat after it one more diver swims in and takes hold of the pole. Rai: determined, fists.
//   N6  155.08 "lift it, lift it,": the haul: on each "lift" the ropes jerk and she comes up off the seabed in a cloud
//              of sand, the divers kicking hard. Rai: determined, straining.
//   N7  156.36 "bring it home.": looking up: she rises through the dark water towards a sky of lanterns on the
//              surface, the canoes either side, her heart lighting gold; an orange fish darts into her heart and rides
//              up in it (`dawn` lets it out). Rai: joy, arms up. It ends on her rising towards the lit surface.
// Clues: the lit window up the beach is home (dinner's room), the ropes are the coil by the door, the pole is the one
// that leaned in the corner; the fish in her heart pays off at dawn.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../../engine/scene';
import { Layer2D, W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import type { Line, Word } from '../../engine/lyrics';
import { clamp, ease, lerp } from '../../engine/util';
import { drawRai, h01, type RaiOpts } from '../_rai';
import { TAU, rgbaHex, mixHex } from '../_motifs';
import { island, seabed, seabedFront, fish } from '../_world';
import { poof, speedLines, star4 } from '../_manga';
import { mergePost, punch } from '../_post';
import { girl, mother, villager, lanternGlow, pendantRai, beamSpot, bubbleLyric, currentLine, clearGlowBand, type GirlPose } from './_diver';
import { arm } from './dinner-room';
import { softBeam, fadeGlowAbove, diver, DIVE, girlAim, pole, rope, flame, sandPuff, hullBelow, surfaceBelow, nightWater, warmPools, bubbleTrail, shoreWide, poleBearers, SIL, RIM } from './nightdive-world';

type C2 = CanvasRenderingContext2D;
type P = { x: number; y: number };
type Hole = { x: number; y: number; r: number; soft?: number };
const PI = Math.PI;
const norm = (s: string) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z']/g, '');

export default class NightDive extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  M = new Layer2D();   // the darkness mask (holes cut with destination-out, so overlapping pools union)
  lines: Line[] = [];
  cuts: number[] = [];
  T: Record<string, number> = {};
  hands: number[] = [];
  prev: Line | null = null;   // "and every one of them is carrying the stone." is still singing "stone." at the cut

  override init() {
    const { lyrics, audio: au, start, end } = this.ctx;
    this.lines = lyrics.lines.filter((l) => l.words[0]!.start >= start - 0.1 && l.words[0]!.start < end);
    if (this.lines.length < 4) throw new Error(`nightdive: expected 4 lines, found ${this.lines.length}`);
    this.prev = lyrics.lines.filter((l) => l.words[0]!.start < start - 0.1).pop() ?? null;
    const wd = (li: number, re: RegExp, nth = 0): Word => this.lines[li]!.words.filter((w) => re.test(norm(w.w)))[nth] ?? this.lines[li]!.words[0]!;
    const T = this.T;
    T.one40 = this.lines[0]!.words[0]!.start; T.pole40 = wd(0, /^pole/).start; T.every40 = wd(0, /every/).start; T.shoulder40 = wd(0, /shoulder/).start;
    T.nobody = this.lines[1]!.words[0]!.start; T.carries = wd(1, /carries/).start; T.me = wd(1, /^me$/).start; T.alone = wd(1, /alone/).start;
    T.one42 = this.lines[2]!.words[0]!.start; T.pole42 = wd(2, /^pole/).start; T.every42 = wd(2, /every/).start;
    T.lift1 = wd(3, /^lift/, 0).start; T.lift2 = wd(3, /^lift/, 1).start; T.bring = wd(3, /bring/).start; T.home = wd(3, /home/).start;
    const nb = (x: number) => au.timeOfBeat(Math.round(au.beatAt(x)));
    const fb = (x: number) => au.timeOfBeat(Math.floor(au.beatAt(x + 0.04)));
    this.cuts = [start, nb(T.pole40), nb(T.every40), fb(T.nobody), nb(T.alone), fb(T.one42), nb(T.lift1), nb(T.lift2 + 0.6)];
    const b5 = au.beatAt(this.cuts[5]!);
    this.hands = [1, 2, 3, 4].map((k) => au.timeOfBeat(Math.round(b5) + k));
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t, T = this.T;
    this.L.clear('#02040c'); this.G.clear();
    const shot = Math.max(0, this.cuts.filter((x) => t >= x).length - 1);
    const s0 = this.cuts[shot]!, s1 = this.cuts[shot + 1] ?? this.ctx.end, sp = clamp((t - s0) / (s1 - s0)), lt = t - s0;
    let post: PostOverrides = { bloom: 0.7, vignette: 0.45 };

    if (shot === 0) this.lead(c, g, t, lt, sp);
    else if (shot === 1) { this.shore(c, g, t, lt, sp); post = mergePost(post, punch(t, [T.pole40!], 0.015, 0.3)); }
    else if (shot === 2) this.plunge(c, g, t, lt, sp);
    else if (shot === 3) this.ring(c, g, t, lt, sp);
    else if (shot === 4) this.thread(c, g, t, lt, sp);
    else if (shot === 5) { this.taut(c, g, t, lt, sp); post = mergePost(post, punch(t, [T.one42!], 0.02, 0.3), punch(t, this.hands, 0.008, 0.2)); }
    else if (shot === 6) { this.haul(c, g, t, lt, sp); post = mergePost(post, punch(t, [T.lift1!, T.lift2!], 0.028, 0.35)); }
    else { this.rise(c, g, t, lt, sp); post = mergePost(post, punch(t, [T.home!], 0.015, 0.4)); }

    // the tail of the dinner's last line until just before "One", then the chant
    if (this.prev && t < T.one40! - 0.12) bubbleLyric(c, this.prev, t);
    else bubbleLyric(c, currentLine(this.lines, t) ?? this.lines[0]!, t);
    fadeGlowAbove(g);
    clearGlowBand(g);
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    return mergePost(post, { zoom: 1 + 0.006 * f.a.kick });
  }

  /** The dark of the deep at night with soft pools of light (overlaps union; `inner` dark is left in the pools). */
  dark(c: C2, a: number, holes: Hole[], inner = 0.3, col = '#02040e') {
    const m = this.M.ctx;
    this.M.clear();
    m.fillStyle = rgbaHex(col, a); m.fillRect(0, 0, W, H);
    m.globalCompositeOperation = 'destination-out';
    const k = clamp(1 - inner / Math.max(1e-3, a));
    for (const h of holes) {
      const s = h.soft ?? 0.8, gr = m.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.r * 1.15);
      gr.addColorStop(0, `rgba(0,0,0,${k})`); gr.addColorStop(1 - s, `rgba(0,0,0,${k})`); gr.addColorStop(1 - s * 0.45, `rgba(0,0,0,${k * 0.45})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      m.fillStyle = gr; m.beginPath(); m.arc(h.x, h.y, h.r * 1.15, 0, TAU); m.fill();
    }
    m.globalCompositeOperation = 'source-over';
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(this.M.canvas, 0, 0, W, H); c.restore();
  }

  // ---------------------------------------------------------------- N1a the girl leads
  lead(c: C2, g: C2, t: number, lt: number, sp: number) {
    const pan = 60 + 170 * lt;
    island(c, t, { time: 'night', horizon: H * 0.4, beach: H * 0.53, pan, show: ['huts', 'palms', 'clouds'], seed: 5 });
    // the beach path, footprints
    c.fillStyle = 'rgba(20,18,40,0.35)'; c.beginPath(); c.moveTo(0, H); c.lineTo(0, H * 0.74); c.quadraticCurveTo(W * 0.5, H * 0.68, W, H * 0.72); c.lineTo(W, H); c.closePath(); c.fill();
    for (let i = 0; i < 14; i++) { const x = ((i * 150 - pan * 1.4) % (W + 200) + W + 200) % (W + 200) - 100; c.fillStyle = 'rgba(10,10,30,0.3)'; c.beginPath(); c.ellipse(x, H * 0.8 + (i % 2) * 18, 16, 6, 0, 0, TAU); c.fill(); }
    // the village behind, lanterns bobbing, smaller further back
    const followers = [[90, 640, 200, 13], [210, 650, 215, 4], [330, 660, 230, 7], [460, 672, 250, 11]] as const;
    for (const [x, y, h, i] of followers) {
      const bob = 3 * Math.abs(Math.sin(t * 6.5 + i));
      villager(c, x, y - bob, h, i % 2 ? 'stand' : 'carry', i, { t, lantern: true, col: SIL, rim: RIM, flip: false });
      lanternGlow(g, x, y - bob, h, i, t, 1);
    }
    // her mother, right behind, a lantern held out
    { const x = 760, y = 760 - 4 * Math.abs(Math.sin(t * 6.5 + 2)), h = 420, u = h / 100;
      mother(c, x, y, h, 'carry', { t, col: SIL, rim: RIM, shawl: '#4a2a4a' });
      const hand = arm(c, { x: x + 7 * u, y: y - 74 * u }, { x: x + 33 * u, y: y - 66 * u }, 17 * u, 17 * u, 6 * u, SIL, 1);
      this.lantern(c, g, hand.x, hand.y, 1.5, t, 2);
    }
    // the girl at the front, walking, her lantern held up behind her
    const x = 1180, y = 805 - 6 * Math.abs(Math.sin(t * 6.5)), h = 590, ph = t * 6.5;
    const pose: GirlPose = { rot: 0.06, hip: [0.4 * Math.sin(ph), -0.4 * Math.sin(ph)], knee: [-0.15 - 0.4 * Math.max(0, Math.cos(ph)), -0.15 - 0.4 * Math.max(0, -Math.cos(ph))], sh: [3.45, 0.45 * Math.sin(ph) + 0.1], el: [-0.3, 0.5] };
    const a = girl(c, x, y, h, pose, { t, mask: 'up', pendant: true, outfit: 'tee', rim: RIM, col: SIL });
    const lh = a.hands[0];
    c.strokeStyle = '#3a2414'; c.lineWidth = 6; c.beginPath(); c.moveTo(lh.x, lh.y + 10); c.lineTo(lh.x - 30, lh.y - 70); c.stroke();
    this.lantern(c, g, lh.x - 30, lh.y - 70, 2.0, t, 0);
    // Rai pops out of the pendant: determined
    const pend = a.pendant!, pop = clamp((t - this.cuts[0]! - 0.1) / 0.25), S = 2.1;
    pendantRai(c, g, pend.x, pend.y, S, t, pop, { face: 'determined', arms: ['fist', 'down'], armsFrom: ['down', 'down'], armsU: clamp((t - this.cuts[0]! - 0.3) / 0.15), marks: ['sparkle'], markT0: this.cuts[0]! + 0.45, hop: 0.12 * Math.abs(Math.sin(t * 6.5)) }, 0.3);
    poof(c, pend.x + 70 * S, pend.y - 90 * S, 130, t, this.cuts[0]! + 0.1);
    // the near grass, soft
    c.save(); c.filter = 'blur(7px)'; c.fillStyle = '#04050c';
    const gx0 = W * 1.05 - pan * 2.4;
    for (let i = 0; i < 16; i++) { const gx = gx0 + (h01(i, 3) - 0.5) * 360, hh = 160 + 200 * h01(i, 4), lean = (h01(i, 5) - 0.5) * 120 + 20 * Math.sin(t * 1.3 + i); c.beginPath(); c.moveTo(gx - 16, H + 10); c.quadraticCurveTo(gx + lean * 0.3, H - hh * 0.6, gx + lean, H - hh); c.quadraticCurveTo(gx + lean * 0.3 + 10, H - hh * 0.5, gx + 16, H + 10); c.fill(); }
    c.restore();
    void sp;
  }
  /** A paper lantern hanging from a point (x, y), lit, swinging a little. */
  lantern(c: C2, g: C2, x: number, y: number, s: number, t: number, i: number) {
    const sw = 0.12 * Math.sin(t * 3 + i), lx = x + Math.sin(sw) * 18 * s, ly = y + Math.cos(sw) * 18 * s;
    c.strokeStyle = '#2a1a10'; c.lineWidth = 1.5 * s; c.beginPath(); c.moveTo(x, y); c.lineTo(lx, ly - 10 * s); c.stroke();
    c.fillStyle = '#ff9a3a'; c.beginPath(); c.ellipse(lx, ly + 4 * s, 13 * s, 17 * s, sw, 0, TAU); c.fill();
    c.fillStyle = '#ffe2a0'; c.beginPath(); c.ellipse(lx, ly + 4 * s, 6 * s, 11 * s, sw, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(120,50,10,0.6)'; c.lineWidth = 1.2 * s; for (const k of [-0.5, 0, 0.5]) { c.beginPath(); c.ellipse(lx, ly + 4 * s, 13 * s * (1 - Math.abs(k)), 17 * s, sw, -PI / 2, PI / 2); c.stroke(); }
    const gr = g.createRadialGradient(lx, ly, 2, lx, ly, 60 * s);
    gr.addColorStop(0, 'rgba(255,180,90,0.5)'); gr.addColorStop(0.4, 'rgba(255,160,70,0.18)'); gr.addColorStop(1, 'rgba(255,150,60,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(lx, ly, 60 * s, 0, TAU); g.fill();
    // the light on the ground under it
    c.save(); c.globalCompositeOperation = 'lighter';
    const pg = c.createRadialGradient(lx, H * 0.8, 10, lx, H * 0.8, 220 * s);
    pg.addColorStop(0, 'rgba(255,160,80,0.18)'); pg.addColorStop(1, 'rgba(255,160,80,0)');
    c.fillStyle = pg; c.fillRect(lx - 240 * s, H * 0.7, 480 * s, H * 0.3);
    c.restore();
  }

  // ---------------------------------------------------------------- N1b the shore
  shore(c: C2, g: C2, t: number, lt: number, sp: number) {
    const pan = 30 + 70 * lt;
    shoreWide(c, g, t, pan, { pushed: clamp(lt / 0.8) });
    // the pole on four divers' shoulders, mid-frame, heading for the water
    const bx = 380 - pan * 0.4 + 70 * lt;
    poleBearers(c, g, t, bx, bx + 560, 866, 275);
    // the girl at the water's edge, lantern high, pointing out to sea
    const gx = 1170 - pan * 0.6 + 40 * lt, gy = 850;
    const a = girl(c, gx, gy, 250, { rot: 0, hip: [-0.1, 0.12], knee: [0, 0], sh: [1.7, 2.8], el: [0.05, 0.1] }, { t, mask: 'up', pendant: true, outfit: 'tee', rim: RIM, col: SIL });
    this.lantern(c, g, a.hands[1].x + 4, a.hands[1].y - 8, 1.15, t, 1);
    // her mother beside her with her lantern
    mother(c, gx - 130, gy + 6, 285, 'stand', { t, col: SIL, rim: RIM, shawl: '#4a2a4a' });
    this.lantern(c, g, gx - 130 + 30, gy + 6 - 0.5 * 285, 1.1, t, 3);
    void sp;
  }

  // ---------------------------------------------------------------- N2 the plunge
  plunge(c: C2, g: C2, t: number, lt: number, sp: number) {
    const tilt = 380 * ease.inOutCubic(sp), SY = 120 - tilt;
    nightWater(c, t, '#14306a', '#02040c');
    surfaceBelow(c, g, t, SY, { lanterns: 34, seed: 7, moonX: W * 0.72 });
    const hulls: P[] = [{ x: 260, y: SY }, { x: 900, y: SY + 4 }, { x: 1600, y: SY }];
    hulls.forEach((h, i) => hullBelow(c, g, h.x, h.y, 1, t, i));
    const glow = { x: W * 0.56, y: SY + 1010 };
    const holes: Hole[] = [{ x: W / 2, y: SY - 160, r: 1000, soft: 0.6 }];
    // the column of divers: far ones small and high, near ones big and low, all going down towards the glow
    const D = [
      { x: 330, y: 330, h: 150, st: 0.0, m: HEX.cyan }, { x: 1520, y: 300, h: 140, st: 0.12, m: HEX.lime },
      { x: 560, y: 520, h: 200, st: 0.05, m: HEX.lime }, { x: 1380, y: 560, h: 220, st: 0.18, m: HEX.cyan },
      { x: 250, y: 760, h: 290, st: 0.1, m: HEX.cyan },
    ];
    for (const [i, d] of D.entries()) {
      const age = lt + 0.4 - d.st, p = { x: d.x + 40 * age, y: d.y - tilt * 0.35 + age * 260 * (d.h / 200) - 140 };
      const r = diver(c, p.x, p.y, d.h, DIVE.down!(t, i), { t, flip: p.x > glow.x, mask: d.m, torch: true, aim: glow, rim: RIM, rope: i === 4 });
      bubbleTrail(c, p.x, p.y - d.h * 0.25, t, 8, i + 3, 30, 240 * (d.h / 200));
      if (r.torch) { const len = Math.min(420 * (d.h / 200) + 120, Math.hypot(glow.x - r.torch.x, glow.y - r.torch.y) - 170); softBeam(g, r.torch.x, r.torch.y, r.torch.ang, len, 0.15, 0.42); holes.push(beamSpot(r.torch.x, r.torch.y, r.torch.ang, len * 0.6, 0.22), { x: p.x, y: p.y, r: d.h * 0.7 }); }
    }
    // the pole between two of them, on their shoulders, the ropes trailing up to the middle canoe
    const age = lt + 0.3, pA = { x: 700 + 30 * age, y: 250 - tilt * 0.4 + age * 190 }, pB = { x: 1120 + 30 * age, y: 290 - tilt * 0.4 + age * 190 };
    const tilt2 = Math.atan2(pB.y - pA.y, pB.x - pA.x);
    rope(c, { x: hulls[1]!.x - 120, y: hulls[1]!.y + 10 }, { x: pA.x - 150 * Math.cos(tilt2), y: pA.y - 150 * Math.sin(tilt2) }, 70, t);
    rope(c, { x: hulls[1]!.x + 120, y: hulls[1]!.y + 10 }, { x: pB.x + 150 * Math.cos(tilt2), y: pB.y + 150 * Math.sin(tilt2) }, 70, t);
    pole(c, pA.x - 170 * Math.cos(tilt2), pA.y - 170 * Math.sin(tilt2), pB.x + 170 * Math.cos(tilt2), pB.y + 170 * Math.sin(tilt2), 15);
    for (const [k, q] of [pA, pB].entries()) {
      const bx = q.x, by = q.y + 70;
      diver(c, bx, by, 190, DIVE.hold!(t, k + 5), { t, flip: k === 1, mask: k ? HEX.cyan : HEX.lime, reach: [{ x: bx - 10, y: q.y + 2 }, { x: bx + 10, y: q.y + 2 }], rim: RIM });
      holes.push({ x: bx, y: by - 20, r: 150 });
    }
    // the girl, near and big at the right, going down with her torch
    { const p = { x: 1660 + 30 * lt, y: 760 - tilt * 0.3 + lt * 200 }, rot = PI * 0.72;
      const a = girl(c, p.x, p.y, 230, { rot, hip: [0.22 * Math.sin(t * 8), -0.22 * Math.sin(t * 8)], knee: [-0.25, -0.25], sh: [PI - 0.4, girlAim(p.x, p.y, 230, rot, true, glow)], el: [0.2, 0], head: -0.2 }, { t, flip: true, underwater: true, fins: true, torch: true, slate: true, pendant: true, rim: RIM, glint: 'plain' });
      if (a.torch) { softBeam(g, a.torch.x, a.torch.y, a.torch.ang, Math.max(80, Math.min(560, Math.hypot(glow.x - a.torch.x, glow.y - a.torch.y) - 170)), 0.15, 0.45); holes.push(beamSpot(a.torch.x, a.torch.y, a.torch.ang, 380, 0.22), { x: p.x, y: p.y, r: 170 }); }
      bubbleTrail(c, a.head.x, a.head.y - 20, t, 8, 41, 30, 240);
    }
    // far below: her silhouette on the seabed, her heart a pink glow, waiting
    c.fillStyle = '#1c1a2a'; c.beginPath(); c.arc(glow.x, glow.y, 46, 0, TAU); c.arc(glow.x, glow.y - 0.12 * 46 + 4, 12, 0, TAU, true); c.fill('evenodd');
    c.beginPath(); c.arc(glow.x, glow.y - 55, 34, 0, TAU); c.fill();
    c.fillStyle = HEX.pink; c.beginPath(); c.arc(glow.x, glow.y + 6, 11, 0, TAU); c.fill();
    const pc = g.createRadialGradient(glow.x, glow.y + 6, 1, glow.x, glow.y + 6, 26);
    pc.addColorStop(0, 'rgba(255,79,154,0.5)'); pc.addColorStop(1, 'rgba(255,79,154,0)');
    g.fillStyle = pc; g.beginPath(); g.arc(glow.x, glow.y + 6, 26, 0, TAU); g.fill();
    holes.push({ x: glow.x, y: glow.y - 20, r: 110 });
    warmPools(c, holes.slice(1), 0.35);
    this.dark(c, 0.8, holes, 0.25);
    c.save(); c.globalCompositeOperation = 'lighter';
    const ph = c.createRadialGradient(glow.x, glow.y + 6, 4, glow.x, glow.y + 6, 170);
    ph.addColorStop(0, 'rgba(255,79,154,0.32)'); ph.addColorStop(0.35, 'rgba(255,79,154,0.1)'); ph.addColorStop(1, 'rgba(255,79,154,0)');
    c.fillStyle = ph; c.beginPath(); c.arc(glow.x, glow.y + 6, 170, 0, TAU); c.fill(); c.restore();
  }

  // ---------------------------------------------------------------- N3 the ring of torches
  ring(c: C2, g: C2, t: number, lt: number, sp: number) {
    const T = this.T, z = lerp(1, 1.06, ease.inOutQuad(sp));
    c.save(); g.save();
    for (const k of [c, g]) { k.translate(W / 2, H * 0.55); k.scale(z, z); k.translate(-W / 2, -H * 0.55); }
    seabed(c, t, { depth: 1, floor: H * 0.78, clues: ['shells', 'stone'], seed: 6 });
    const R = 118, rx = W * 0.5, ry = H * 0.78 - 1.07 * R, heart = { x: rx, y: ry + 0.12 * R };
    const love = t >= T.carries!;
    // the divers arrive in a ring, each aiming a torch at her
    const ring = [[300, 470, 220, 0], [560, 250, 190, 1], [960, 150, 175, 2], [1360, 250, 190, 3], [1620, 470, 220, 4]] as const;
    const holes: Hole[] = [{ x: heart.x, y: heart.y - 40, r: 300 + 40 * sp }];
    for (const [x0, y0, h, i] of ring) {
      const arr = ease.outCubic(clamp((lt - 0.06 * i) / 0.55)), x = x0, y = y0 - 160 * (1 - arr);
      const flip = x0 > rx;
      const d = diver(c, x, y, h, DIVE.hold!(t, i), { t, flip, mask: i % 2 ? HEX.lime : HEX.cyan, torch: true, aim: { x: heart.x + (flip ? 30 : -30), y: heart.y - 60 }, rope: i === 0 || i === 4, rim: RIM });
      bubbleTrail(c, d.head.x, d.head.y - 10, t, 6, 60 + i, 16, 200);
      if (d.torch) {
        const len = Math.max(60, Math.hypot(heart.x - d.torch.x, heart.y - 60 - d.torch.y) - 1.55 * R);
        softBeam(g, d.torch.x, d.torch.y, d.torch.ang, len, 0.11, 0.5 * arr);
        holes.push({ x: x, y: y, r: 80, soft: 0.85 }, beamSpot(d.torch.x, d.torch.y, d.torch.ang, len * 0.55, 0.14));
      }
    }
    // the pole, brought down behind them (two divers carry it in at the back)
    const pd = ease.outCubic(clamp((lt - 0.4) / 0.9)), polY = 320 - 120 * (1 - pd);
    pole(c, 620, polY, 1300, polY + 6, 14);
    for (const [x, fl] of [[640, false], [1280, true]] as const) diver(c, x, polY + 64, 160, DIVE.hold!(t, x), { t, flip: fl, mask: HEX.cyan, reach: [{ x: x - 6, y: polY + 2 }, { x: x + 6, y: polY + 2 }], rim: RIM });
    // Rai, in the middle of all that light
    const a = drawRai(c, rx, ry, R, {
      t, face: love ? 'love' : 'wow', arms: love ? ['cheek', 'cheek'] : ['up', 'up'], armsFrom: love ? ['up', 'up'] : ['down', 'down'], armsU: clamp((t - (love ? T.carries! : this.cuts[3]!)) / 0.18),
      marks: love ? ['hearts'] : ['!'], markT0: love ? T.carries! + 0.05 : this.cuts[3]! + 0.25, blush: love ? 0.8 : 0, heart: love ? 0.4 + 0.5 * clamp((t - T.carries!) / 0.6) : 0.2, heartColor: HEX.pink,
      glow: HEX.gold, glowStrength: 0.7, hop: love ? 0 : 0.25 * Math.max(0, Math.sin(Math.min(PI, (t - this.cuts[3]! - 0.2) * 6))),
    });
    // the girl swims in from the right, close, reaching for her
    { const gx = lerp(1700, 1360, ease.outCubic(clamp(lt / 1.2))), gy = 610, rot = PI / 2 - 0.25;
      const ga = girl(c, gx, gy, 240, { rot, hip: [0.2 * Math.sin(t * 7), -0.2 * Math.sin(t * 7)], knee: [-0.3, -0.25], sh: [PI - 0.6, girlAim(gx, gy, 240, rot, true, heart)], el: [0.3, 0], head: -0.2 }, { t, flip: true, underwater: true, fins: true, torch: true, slate: true, pendant: true, glint: love ? 'spark' : 'wide', rim: RIM });
      if (ga.torch) { const len = Math.max(60, Math.hypot(heart.x - ga.torch.x, heart.y - ga.torch.y) - 1.2 * R); softBeam(g, ga.torch.x, ga.torch.y, ga.torch.ang, len, 0.13, 0.55); holes.push({ x: gx, y: gy, r: 170 }); }
      bubbleTrail(c, ga.head.x - 10, ga.head.y - 20, t, 8, 77, 20, 260);
    }
    seabedFront(c, t, { seed: 6 });
    c.restore(); g.restore();
    const hz = holes.map((h) => ({ x: (h.x - W / 2) * z + W / 2, y: (h.y - H * 0.55) * z + H * 0.55, r: h.r * z, soft: h.soft }));
    warmPools(c, hz, 0.4);
    this.dark(c, 0.86, hz, 0.3);
    // the ring of light: where the beams meet round her
    const rg = g.createRadialGradient(W / 2, (heart.y - 50 - H * 0.55) * z + H * 0.55, 200 * z, W / 2, (heart.y - 50 - H * 0.55) * z + H * 0.55, 300 * z);
    rg.addColorStop(0, 'rgba(255,214,140,0)'); rg.addColorStop(0.75, `rgba(255,214,140,${0.13 * clamp(lt / 0.6)})`); rg.addColorStop(1, 'rgba(255,214,140,0)');
    g.fillStyle = rg; g.fillRect(0, 0, W, H);
    void a;
  }

  // ---------------------------------------------------------------- N4 through her heart: it tickles
  thread(c: C2, g: C2, t: number, lt: number, sp: number) {
    const T = this.T, R = 188, rx = W * 0.44, ry = H * 0.5, heart = { x: rx, y: ry + 0.12 * R };
    const z = lerp(1.0, 1.04, sp);
    c.save(); g.save();
    for (const k of [c, g]) { k.translate(rx, ry); k.scale(z, z); k.translate(-rx, -ry); }
    seabed(c, t, { depth: 1, floor: H * 0.86, clues: ['shells'], seed: 9, shark: false });
    // the pole slides in from the left, behind her, through the hole in her heart and out the other side
    const slide = ease.inOutCubic(clamp((lt - 0.12) / 0.95)), tip = lerp(-80, W + 200, slide);
    const tickle = clamp((tip - (heart.x - 0.27 * R)) / 60) * (1 - clamp((t - (this.cuts[4]! + 1.4)) / 0.3));
    pole(c, -900, heart.y, tip, heart.y, 30);
    // the divers pushing it in, big and soft at the left edge
    c.save(); c.filter = 'blur(4px)';
    diver(c, lerp(-60, 120, slide), heart.y + 160, 420, DIVE.hold!(t, 1), { t, mask: HEX.lime, reach: [{ x: lerp(-60, 120, slide) + 50, y: heart.y + 8 }, { x: lerp(-60, 120, slide) + 110, y: heart.y + 4 }], rim: RIM });
    c.restore();
    const wink = t >= this.cuts[4]! + 1.45;
    const giggle = tickle > 0.05 && !wink;
    const a = drawRai(c, rx, ry, R, {
      t, face: wink ? 'wink' : giggle ? 'joy' : 'soft', arms: wink ? ['hip', 'point'] : giggle ? ['cheek', 'cheek'] : ['down', 'down'], armsFrom: giggle ? ['down', 'down'] : ['cheek', 'cheek'], armsU: clamp((t - (wink ? this.cuts[4]! + 1.45 : this.cuts[4]! + 0.4)) / 0.15),
      shake: giggle ? 0.6 : 0, tilt: giggle ? 0.06 * Math.sin(t * 22) : wink ? -0.1 : 0, blush: giggle || wink ? 0.9 : 0.2, look: wink ? 1 : 0,
      marks: wink ? ['sparkle'] : giggle ? ['notes'] : [], markT0: wink ? this.cuts[4]! + 1.5 : this.cuts[4]! + 0.5,
      heart: 0.35, heartColor: HEX.pink, glow: HEX.gold, glowStrength: 0.8, squash: giggle ? 0.06 * Math.sin(t * 30) : 0,
    });
    if (giggle) { // tickle marks round her heart
      c.save(); c.strokeStyle = 'rgba(255,240,210,0.9)'; c.lineWidth = 4; c.lineCap = 'round';
      for (let k = 0; k < 6; k++) { const ang = (k / 6) * TAU + t * 3, r0 = 0.42 * R, x = a.heart.x + Math.cos(ang) * r0, y = a.heart.y + Math.sin(ang) * r0;
        c.beginPath(); for (let j = 0; j <= 6; j++) { const v = j / 6, px = x + Math.cos(ang) * v * 30 + Math.sin(v * 9 + t * 20) * 4, py = y + Math.sin(ang) * v * 30; j ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); }
      c.restore();
    }
    // the girl, close on the right: her torch on Rai; the wink is for her, and her mask sparkles back
    const gx = W * 0.8, gy = H * 0.56, rot = PI / 2 - 0.5;
    const ga = girl(c, gx, gy, 330, { rot, hip: [0.15 * Math.sin(t * 6), -0.15 * Math.sin(t * 6)], knee: [-0.4, -0.3], sh: [PI - 0.9, girlAim(gx, gy, 330, rot, true, heart)], el: [0.6, 0], head: -0.1 }, { t, flip: true, underwater: true, fins: true, torch: true, slate: true, pendant: true, glint: wink ? 'spark' : 'wide', rim: RIM, emote: wink ? 'joy' : undefined, emoteT0: this.cuts[4]! + 1.6 });
    if (wink) bubbleTrail(c, ga.head.x - 20, ga.head.y - 30, t, 12, 91, 30, 320);
    if (ga.torch) softBeam(g, ga.torch.x, ga.torch.y, ga.torch.ang, Math.hypot(heart.x - ga.torch.x, heart.y - ga.torch.y) + 40, 0.14, 0.5);
    if (wink) star4(c, a.head.x + 0.5 * a.head.r, a.head.y - 0.2 * a.head.r, 22 * clamp((t - this.cuts[4]! - 1.45) / 0.12) * (1 + 0.2 * Math.sin(t * 12)), '#fff6c8');
    seabedFront(c, t, { seed: 9 });
    c.restore(); g.restore();
    const holes: Hole[] = [{ x: rx, y: ry - 40, r: 430 }, { x: gx, y: gy, r: 330 }, { x: 160, y: heart.y + 100, r: 260 }];
    warmPools(c, holes, 0.35);
    this.dark(c, 0.84, holes);
    void T;
  }

  // ---------------------------------------------------------------- N5 the ropes go taut; one more hand a beat
  taut(c: C2, g: C2, t: number, lt: number, sp: number) {
    const T = this.T, R = 112, rx = W * 0.5, floor = H * 0.8, ry = floor - 1.07 * R, hy = ry + 0.12 * R;
    const z = lerp(1.0, 1.05, ease.inOutQuad(sp));
    c.save(); g.save();
    for (const k of [c, g]) { k.translate(W / 2, H * 0.6); k.scale(z, z); k.translate(-W / 2, -H * 0.6); }
    seabed(c, t, { depth: 1, floor, clues: ['shells', 'anchor'], seed: 12 });
    const SY = 60;
    surfaceBelow(c, g, t, SY, { lanterns: 40, seed: 11, moonX: W * 0.3 });
    const hulls: P[] = [{ x: 470, y: SY }, { x: 1450, y: SY }];
    hulls.forEach((h, i) => hullBelow(c, g, h.x, h.y, 1.05, t, i + 4));
    const x0 = 330, x1 = 1590;
    // the ropes: slack, then taut on "one", buzzing
    const taut = ease.outCubic(clamp((t - T.one42!) / 0.12)), tw = t > T.one42! ? Math.exp(-(t - T.one42!) * 5) : 0;
    rope(c, { x: hulls[0]!.x + 120, y: SY + 12 }, { x: x0 + 20, y: hy }, 140 * (1 - taut), t, tw, 6);
    rope(c, { x: hulls[1]!.x - 120, y: SY + 12 }, { x: x1 - 20, y: hy }, -140 * (1 - taut), t, tw, 6);
    pole(c, x0, hy, x1, hy, 18);
    // divers on the pole: two from the start; then one more on each beat
    const slots = [[420, 0, -1], [1500, 0, 1], [600, 1, -1], [1320, 2, 1], [760, 3, -1], [1160, 4, 1]] as const;
    const holes: Hole[] = [{ x: rx, y: ry - 30, r: 300 }];
    for (const [sx, k, side] of slots) {
      const tj = k === 0 ? -1e9 : this.hands[k - 1]!, arr = k === 0 ? 1 : ease.outCubic(clamp((t - tj + 0.22) / 0.22));
      if (arr <= 0) continue;
      const x = sx + side * 300 * (1 - arr), y = hy - 34 - 20 * (1 - arr) - 14 * (k % 2);
      const sw = DIVE.swim!(t, k);
      diver(c, x - side * 40, y, 200, { ...sw, rot: PI / 2 - 0.45 }, { t, flip: side > 0, mask: k % 2 ? HEX.lime : HEX.cyan, reach: [{ x: x - side * 4, y: hy - 2 }, { x: x - side * 28, y: hy - 2 }], rim: RIM });
      if (k > 0 && t >= tj && t < tj + 0.3) star4(c, x, hy - 4, 30 * (1 - (t - tj) / 0.3), '#fff6c8');
      holes.push({ x, y, r: 140 });
      bubbleTrail(c, x, y - 90, t, 5, 120 + k, 14, 180);
    }
    drawRai(c, rx, ry, R, { t, face: 'determined', arms: ['fist', 'fist'], armsFrom: ['down', 'down'], armsU: clamp((t - T.one42!) / 0.15), marks: ['steam'], markT0: T.one42! + 0.1, heart: 0.3 + 0.3 * clamp(lt / 2), heartColor: HEX.gold, glow: HEX.gold, glowStrength: 0.6, squash: -0.08 });
    seabedFront(c, t, { seed: 12, floor });
    c.restore(); g.restore();
    holes.push({ x: hulls[0]!.x, y: SY + 20, r: 200, soft: 0.8 }, { x: hulls[1]!.x, y: SY + 20, r: 200, soft: 0.8 }, { x: W / 2, y: SY - 30, r: 700, soft: 0.7 });
    const hz = holes.map((h) => ({ x: (h.x - W / 2) * z + W / 2, y: (h.y - H * 0.6) * z + H * 0.6, r: h.r * z }));
    warmPools(c, hz, 0.3);
    this.dark(c, 0.78, hz, 0.3);
  }

  // ---------------------------------------------------------------- N6 lift it, lift it
  haul(c: C2, g: C2, t: number, lt: number, sp: number) {
    const T = this.T, R = 140, floor = H * 0.79;
    const up = 70 * ease.outBack(clamp((t - T.lift1!) / 0.25)) + 80 * ease.outBack(clamp((t - T.lift2!) / 0.25));
    const rx = W * 0.5, ry = floor - 1.07 * R - up, hy = ry + 0.12 * R;
    seabed(c, t, { depth: 1, floor, clues: ['shells'], seed: 15, shark: false });
    // the dent where she lay, the sand bursting up on each lift
    c.fillStyle = 'rgba(90,70,40,0.4)'; c.beginPath(); c.ellipse(rx, floor + 8, 1.1 * R, 18, 0, 0, TAU); c.fill();
    sandPuff(c, rx, floor, 2.4 * R, t, T.lift1!, 1);
    sandPuff(c, rx, floor, 2.6 * R, t, T.lift2!, 2);
    // the ropes up out of frame, jerking on each lift
    const jerk = (x: number) => { let k = 0; for (const l of [T.lift1!, T.lift2!]) { const a = t - l; if (a > 0 && a < 0.3) k = Math.max(k, 1 - a / 0.3); } return k * 8 * Math.sin(t * 70 + x); };
    rope(c, { x: 160 + jerk(1), y: -40 }, { x: 260, y: hy }, 0, t, 0, 7);
    rope(c, { x: W - 160 + jerk(2), y: -40 }, { x: W - 260, y: hy }, 0, t, 0, 7);
    pole(c, 160, hy, W - 160, hy, 26);
    // divers either side, kicking hard
    const holes: Hole[] = [{ x: rx, y: ry - 20, r: 420 }];
    for (const [x, side, i] of [[430, -1, 0], [W - 430, 1, 1], [640, -1, 2], [W - 640, 1, 3]] as const) {
      const y = hy + 110 + 6 * Math.sin(t * 9 + i);
      diver(c, x, y, 230, DIVE.haul!(t, i), { t, flip: side > 0, mask: i % 2 ? HEX.lime : HEX.cyan, reach: [{ x: x - 14, y: hy }, { x: x + 14, y: hy }], rim: RIM });
      holes.push({ x, y: y - 40, r: 160 });
      bubbleTrail(c, x, y - 120, t, 6, 140 + i, 20, 260);
    }
    const strain = t < T.lift2! + 0.3;
    drawRai(c, rx, ry, R, {
      t, face: strain ? 'determined' : 'wow', arms: strain ? ['fist', 'fist'] : ['up', 'up'], marks: strain ? ['sweat', 'steam'] : ['!'], markT0: strain ? this.cuts[6]! + 0.05 : T.lift2! + 0.3,
      squash: t - T.lift1! < 0.12 && t > T.lift1! ? 0.3 : t - T.lift2! < 0.12 && t > T.lift2! ? 0.3 : -0.1, heart: 0.5, heartColor: HEX.gold, glow: HEX.gold, glowStrength: 0.8,
    });
    // a trickle of sand pouring off her
    c.fillStyle = 'rgba(214,190,140,0.7)';
    for (let i = 0; i < 26; i++) { const u = ((t * 1.2 + h01(i, 5)) % 1), x = rx + (h01(i, 6) - 0.5) * 1.8 * R, y = ry + 0.9 * R + u * (floor - ry); c.beginPath(); c.arc(x, y, 3 + 3 * h01(i, 7), 0, TAU); c.fill(); }
    seabedFront(c, t, { seed: 15, floor });
    for (const l of [T.lift1!, T.lift2!]) { const a = t - l; if (a > 0 && a < 0.4) speedLines(c, PI / 2, 'rgba(220,240,255,0.5)', t, { n: 30, alpha: 0.5 * (1 - a / 0.4) }); }
    warmPools(c, holes, 0.35);
    this.dark(c, 0.8, holes, 0.3);
    void sp; void lt;
  }

  // ---------------------------------------------------------------- N7 bring it home: up towards the lanterns
  rise(c: C2, g: C2, t: number, lt: number, sp: number) {
    const T = this.T, R = lerp(118, 128, sp), rx = W * 0.5;
    const ry = lerp(800, 560, ease.inOutCubic(sp)), hy = ry + 0.12 * R, SY = 110;
    nightWater(c, t, '#1c3a78', '#03060f');
    surfaceBelow(c, g, t, SY, { lanterns: 70, seed: 21, moonX: W * 0.5, glow: 1 });
    const hulls: P[] = [{ x: rx - 470, y: SY }, { x: rx + 470, y: SY }];
    hulls.forEach((h, i) => hullBelow(c, g, h.x, h.y, 1.1, t, i + 8));
    // the shafts of lantern light coming down
    c.save(); c.globalCompositeOperation = 'screen';
    for (let k = 0; k < 7; k++) { const x = 180 + k * 260 + 30 * Math.sin(t * 0.6 + k), sg = c.createLinearGradient(0, SY, 0, H); sg.addColorStop(0, 'rgba(255,200,130,0.16)'); sg.addColorStop(1, 'rgba(255,200,130,0)'); c.fillStyle = sg; c.beginPath(); c.moveTo(x - 20, SY); c.lineTo(x + 20, SY); c.lineTo(x + 140, H); c.lineTo(x - 80, H); c.closePath(); c.fill(); }
    c.restore();
    // the ropes from the canoes, taut, the pole through her heart
    rope(c, { x: hulls[0]!.x + 110, y: SY + 12 }, { x: rx - 430, y: hy }, 0, t, 0, 6);
    rope(c, { x: hulls[1]!.x - 110, y: SY + 12 }, { x: rx + 430, y: hy }, 0, t, 0, 6);
    pole(c, rx - 460, hy, rx + 460, hy, 18);
    // divers swimming up with her
    for (const [dx, i] of [[-330, 0], [330, 1], [-200, 2], [200, 3]] as const) {
      const x = rx + dx, y = hy + 110 + 10 * Math.sin(t * 8 + i);
      diver(c, x, y, 190, DIVE.haul!(t, i), { t, flip: dx > 0, mask: i % 2 ? HEX.lime : HEX.cyan, reach: [{ x: x - 10, y: hy }, { x: x + 10, y: hy }], rim: RIM });
      bubbleTrail(c, x, y - 80, t, 6, 160 + i, 20, 300);
    }
    // the girl beside her, her torch up at the surface
    { const gx = rx + 240, gy = ry - 120 + 8 * Math.sin(t * 3), rot = -0.25;
      girl(c, gx, gy, 200, { rot, hip: [0.4 * Math.sin(t * 9), -0.4 * Math.sin(t * 9)], knee: [-0.4, -0.4], sh: [2.6, 2.9], el: [0.2, 0.1] }, { t, flip: true, underwater: true, fins: true, slate: true, pendant: true, glint: 'spark', rim: RIM }); }
    const joy = t >= T.home! - 0.08;
    const a = drawRai(c, rx, ry, R, {
      t, face: joy ? 'joy' : 'determined', arms: joy ? ['up', 'up'] : ['fist', 'fist'], armsFrom: ['fist', 'fist'], armsU: clamp((t - T.home! + 0.08) / 0.15),
      marks: joy ? ['sparkle'] : [], markT0: T.home!, heart: 0.25 + 0.3 * sp, heartColor: HEX.gold, glow: HEX.gold, glowStrength: 0.7, squash: 0.08,
    });
    // the orange fish that darts into her heart and rides up in it
    { const fin = ease.inOutCubic(clamp((t - this.cuts[7]! - 0.5) / 0.5)), fx = lerp(rx - 520, a.heart.x + 8, fin), fy = lerp(ry + 160, a.heart.y, fin) + (1 - fin) * 30 * Math.sin(t * 5);
      if (fin < 1) { c.save(); c.translate(fx, fy); fish(c, 0, 0, 24, HEX.orange, 1, t); c.restore(); }
      else { // tucked in her heart, its tail flapping out of the hole
        c.save(); c.translate(a.heart.x + a.heart.r * 0.95, a.heart.y); c.rotate(0.35 * Math.sin(t * 22));
        c.fillStyle = HEX.orange; c.beginPath(); c.moveTo(-6, 0); c.lineTo(26, -16); c.lineTo(22, 0); c.lineTo(26, 16); c.closePath(); c.fill();
        c.restore();
        c.save(); c.beginPath(); c.arc(a.heart.x, a.heart.y, a.heart.r * 0.95, 0, TAU); c.clip(); fish(c, a.heart.x - 4, a.heart.y, 22, HEX.orange, -1, t); c.restore();
      }
    }
    g.save(); const hg = g.createRadialGradient(a.heart.x, a.heart.y, 4, a.heart.x, a.heart.y, 70); hg.addColorStop(0, `rgba(255,200,90,${0.18 + 0.2 * sp})`); hg.addColorStop(1, 'rgba(255,200,90,0)'); g.fillStyle = hg; g.beginPath(); g.arc(a.heart.x, a.heart.y, 70, 0, TAU); g.fill(); g.restore();
    bubbleTrail(c, rx, ry - 1.5 * R, t, 26, 9, 2 * R, 500);
    speedLines(c, PI / 2, 'rgba(220,240,255,0.35)', t, { n: 26, alpha: 0.35 });
    const holes: Hole[] = [{ x: rx, y: ry - 40, r: 520 }, { x: W / 2, y: SY - 40, r: 1100, soft: 0.5 }];
    warmPools(c, holes.slice(0, 1), 0.3);
    this.dark(c, lerp(0.7, 0.55, sp), holes);
    void lt; void mixHex; void rgbaHex;
  }
}
export type { RaiOpts };
