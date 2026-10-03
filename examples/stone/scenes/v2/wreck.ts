// WRECK (v2, 76.67-90.38; verse 2's first half, lines 20-23, the fastest rap): S.S. IRON HULL in rust and green murk.
// `manta` leaves the girl kneeling at the round hatch on the foredeck, her torch into the dark hold, Rai standing beside
// her, serious; she already wears the pebble pendant (manta gives it), glowing faint pink, and wears it throughout. A
// hard cut about every two beats (one a beat where the line lists its nouns), the frame always moving: the torch
// sweeps, the camera cranes out, tracks along plates, pushes down the hold, pans with her crossing.
//   20 "Then a trader sailed in with an iron hull, said "why paddle? I'll bring you a ton","
//     W1 open on manta's two-shot at the round hatch and crane out: the whole wreck looms round them out of the murk;
//        Rai goes from serious to deadpan, arms crossed. W2 tracking along the hull: rivets, portholes (a fish lives in
//        one); on "iron hull" the beam finds the name S.S. IRON HULL. W3 on deck, the trader's ghost forms out of the
//        silt in the torchlight, cap, ledger under his arm; on "why paddle?" his big gesture, and the beam lands on his
//        slogan painted on the wheelhouse in a speech balloon of flaking paint. W4 the bow: her hand rubs the rust off
//        and on "ton" 1 TON shows; Rai goes chibi, deadpan, a sweat drop. Rai is deadpan throughout.
//   21 "he shipped us in bulk and the island said thanks, then priced his at a fraction of one;"
//     W5 into the hold: the torch finds a stack, and on "bulk" Rai's heart lights the whole hold: rows and rows of
//        identical stacks, stacked like coins. W6 the trader's ghost hands a disc to an islander's ghost, who bows
//        "thanks" (a heart); the queue behind. W7 the beam runs down the bulkhead to the stencil 1/10 EACH on
//        "fraction". W8 her finger taps a disc on "one": tk. One grey ring, dead at once. Rai smug, glowing.
//   22 "'cause value's the crossing, the risk and the reef, the hands and the hours it cost,"
//     The crossing at dusk, one beat a noun: W9 the crossing, the jetty's legs behind, the wreck ahead, Rai swimming
//     alongside; W10 a moray snaps at her fins; W11 razor coral, a squeeze; W12 her hands (and Rai's) on the rock
//     against the current; W13 her dive watch counting the breath held 0:41 ... 0:52, beeping on "cost".
//   23 "not how heavy you are and not how you shine, but the voyage, and what could be lost."
//     W14 she heaves on the wreck's anchor: it will not move; Rai shrugs. W15 the slate: an anchor, crossed out.
//     W16 a gold coin glinting in the silt; Rai wags a finger; the slate crosses out a coin on "shine". W17 her route
//     on the slate from the jetty to here, a gold tick on "voyage"; on "what could be lost" her hand closes over the
//     pendant (Rai's little stone: what could be lost), it glows pink through her fingers on "lost", and Rai melts.
// Clues: the anchor and the coin are in the first shot's silt before they are found; the ghost's ledger under his arm
// (the ledger book on the shelf at 4 am); the fish at home in a porthole; IRON HULL CO. stencils in the hold; the
// same chip on every bulk disc; the jetty's legs at the surface in her crossing; the slate's map.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../../engine/scene';
import { Layer2D, W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import type { Line, Word } from '../../engine/lyrics';
import { clamp, ease, lerp } from '../../engine/util';
import { drawRai, h01, type RaiOpts } from '../_rai';
import { FAM, TAU, rgbaHex } from '../_motifs';
import { focusLines, poof, speedLines, heart, impactBurst, star4 } from '../_manga';
import { caKick, mergePost, punch } from '../_post';
import { girl, GIRL_POSES, slate, pencil, circlePts, bubbleLyric, clearGlowBand, withCam2, type GirlPose, type GirlAnchors, type GirlOpts } from './_diver';
import {
  HULL, deckY, murk, snow, hull, chain, deckView, ghost, hold, bulkTop, duskWater, duskReef, moray, rockHole, razorCoral, hand,
  diveWatch, anchor, goldCoin, pebble, soundRing, dark, softBeam, featherGlow, plateLines, lyricAt, type Hole,
} from './wreck-kit';

type C2 = CanvasRenderingContext2D;
const PI = Math.PI;
const GIRL: Partial<GirlOpts> = { underwater: true, fins: true, slate: true, pendant: true, rim: 'rgba(160,230,200,0.55)' };
const sm = (a: number, b: number, t: number) => ease.inOutCubic(clamp((t - a) / (b - a)));

/** The total angle (shoulder + elbow) that points her front arm along screen angle `th` (see GirlPose). */
const aim = (th: number, flip = false, rot = 0) => rot + Math.atan2((flip ? -1 : 1) * Math.cos(th), Math.sin(th));
/** Upright, treading water, the torch arm aimed along `th`. */
const tread = (t: number, th: number, flip = false): GirlPose => ({
  rot: 0.04 * Math.sin(t * 1.5), hip: [0.3 * Math.sin(t * 4), -0.3 * Math.sin(t * 4)], knee: [-0.5, -0.4],
  sh: [-0.9 - 0.25 * Math.sin(t * 3), aim(th, flip) - 0.12], el: [-0.4, 0.12],
});
/** Swimming flat out, the torch arm aimed along `th`. */
const swimAim = (t: number, th: number, flip = false): GirlPose => {
  const rot = PI / 2 - 0.12;
  return { rot, hip: [0.25 * Math.sin(t * 9), -0.25 * Math.sin(t * 9)], knee: [-0.25 - 0.15 * Math.sin(t * 9), -0.25 + 0.15 * Math.sin(t * 9)], sh: [PI - 0.8 + 0.5 * Math.sin(t * 3), aim(th, flip, rot) - 0.1], el: [0.3, 0.1], head: -0.25 };
};

export default class Wreck extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  lines: Line[] = [];
  cuts: number[] = [];
  w: Record<string, Word> = {};
  bt: (k: number) => number = (k) => k;

  override init() {
    const { lyrics, audio: au, start, end } = this.ctx;
    const own = lyrics.lines.filter((l) => l.words[0]!.start >= start - 0.1 && l.words[0]!.start < end);
    this.lines = plateLines(lyrics.lines, start, end);
    const all = own.flatMap((l) => l.words);
    const q = (re: RegExp, n = 0) => all.filter((w) => re.test(w.w.toLowerCase().replace(/[^a-z0-9']/g, '')))[n] ?? all[0]!;
    this.w = {
      trader: q(/^trader/), iron: q(/^iron/), hull: q(/^hull/), said: q(/^said/), why: q(/^why/), paddle: q(/^paddle/), ton: q(/^ton/),
      shipped: q(/^shipped/), bulk: q(/^bulk/), thanks: q(/^thanks/), priced: q(/^priced/), fraction: q(/^fraction/), one: q(/^one/),
      crossing: q(/^crossing/), risk: q(/^risk/), reef: q(/^reef/), hands: q(/^hands/), hours: q(/^hours/), cost: q(/^cost/),
      heavy: q(/^heavy/), are: q(/^are$/), shine: q(/^shine/), voyage: q(/^voyage/), what: q(/^what$/), lost: q(/^lost/),
    };
    const b0 = Math.round(au.beatAt(start));
    this.bt = (k: number) => au.timeOfBeat(b0 + k);
    // a hard cut every two beats, one a beat where line 22 lists its nouns (risk, reef, hands, hours)
    this.cuts = [0, 2, 4, 7, 9, 11, 13, 16, 17, 19, 20, 21, 22, 24, 26, 28, 30].map(this.bt);
    this.cuts[0] = start;
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, end } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t;
    this.L.clear('#061516'); this.G.clear();
    let i = 0;
    for (let k = 0; k < this.cuts.length; k++) if (t >= this.cuts[k]!) i = k;
    const s0 = this.cuts[i]!, s1 = this.cuts[i + 1] ?? end;
    const shots = [this.w1, this.w2, this.w3, this.w4, this.w5, this.w6, this.w7, this.w8, this.w9, this.w10, this.w11, this.w12, this.w13, this.w14, this.w15, this.w16, this.w17];
    let post: PostOverrides = { bloom: 0.7, vignette: 0.5 };
    post = mergePost(post, shots[i]!.call(this, c, g, t, s0, s1) ?? {});
    // the lyric, rising like bubbles, over everything; the glow cleared under it
    featherGlow(g); clearGlowBand(g);
    const line = lyricAt(this.lines, t);
    if (line) bubbleLyric(c, line, t);
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    return mergePost(post, { zoom: 1 + 0.006 * f.a.kick });
  }

  // ------------------------------------------------------------------ shared

  /** The torch: its feathered beam on the glow layer from the lamp to (tx, ty); returns the hole it leaves in the dark. */
  beam(g: C2, a: GirlAnchors | { torch: { x: number; y: number } }, tx: number, ty: number, spread = 0.2, alpha = 1): Hole {
    const o = a.torch!, ang = Math.atan2(ty - o.y, tx - o.x), len = Math.hypot(tx - o.x, ty - o.y);
    return softBeam(g, o.x, o.y, ang, len, spread, alpha);
  }

  /** Rai under water, with a soft gold glow; returns her anchors and the hole her glow makes in the dark. */
  rai(c: C2, g: C2, x: number, y: number, R: number, o: Omit<RaiOpts, 'R'>, glow = 0.6) {
    const a = drawRai(c, x, y, R, { glow: HEX.gold, glowStrength: 0.5, ...o });
    const gl = g.createRadialGradient(x, y - R * 0.4, 0, x, y - R * 0.4, R * 2.4);
    gl.addColorStop(0, rgbaHex(HEX.gold, 0.12 * glow)); gl.addColorStop(1, rgbaHex(HEX.gold, 0));
    g.fillStyle = gl; g.fillRect(x - R * 2.4, y - R * 2.8, R * 4.8, R * 4.8);
    return { a, hole: { x, y: y - R * 0.5, r: R * 2.3, soft: 0.7 } as Hole };
  }

  /** Bubbles from her snorkel, rising and wobbling from (x, y). */
  breath(c: C2, x: number, y: number, t: number, n = 5, s = 1) {
    c.strokeStyle = 'rgba(220,250,255,0.7)'; c.lineWidth = 2 * s;
    for (let i = 0; i < n; i++) {
      const u = ((t * 0.9 + i / n) % 1), r = (4 + 6 * h01(i, 7)) * s * (0.6 + u * 0.6);
      c.beginPath(); c.arc(x + 10 * s * Math.sin(t * 5 + i * 2), y - u * 220 * s, r, 0, TAU); c.stroke();
    }
  }

  /** A hull-local point to the screen, for a hull drawn at (ox, oy) scale s rotation rot. */
  hp(lx: number, ly: number, ox: number, oy: number, s: number, rot: number) {
    return { x: ox + (lx * Math.cos(rot) - ly * Math.sin(rot)) * s, y: oy + (lx * Math.sin(rot) + ly * Math.cos(rot)) * s };
  }
  /** A screen point to hull-local. */
  hl(px: number, py: number, ox: number, oy: number, s: number, rot: number) {
    const dx = (px - ox) / s, dy = (py - oy) / s;
    return { x: dx * Math.cos(-rot) - dy * Math.sin(-rot), y: dx * Math.sin(-rot) + dy * Math.cos(-rot) };
  }

  // ------------------------------------------------------------------ line 20: the iron hull

  /** The pendant at her chest, glowing faint pink (`manta` gives it to her; she wears it from here on). */
  pend(g: C2, a: GirlAnchors, k = 1) {
    if (!a.pendant) return;
    const gr = g.createRadialGradient(a.pendant.x, a.pendant.y, 0, a.pendant.x, a.pendant.y, 26 * k);
    gr.addColorStop(0, rgbaHex(HEX.pink, 0.45)); gr.addColorStop(1, rgbaHex(HEX.pink, 0));
    g.fillStyle = gr; g.fillRect(a.pendant.x - 26 * k, a.pendant.y - 26 * k, 52 * k, 52 * k);
  }

  /**
   * W1: `manta` leaves them at the round hatch on the foredeck, the girl kneeling with her torch into the hold, Rai
   * beside her, serious. We open on that two-shot and crane out and up: the whole wreck looms round them.
   */
  w1(c: C2, g: C2, t: number, s0: number, s1: number): PostOverrides {
    const wd = this.w, lt = t - s0;
    const ox = W * 0.27, oy = H * 0.9, s = 0.6, rot = -0.03;
    const hx = HULL.hatch.x, foot = this.hp(hx, deckY(hx) - 34, ox, oy, s, rot), mouth = this.hp(hx, deckY(hx) - 104, ox, oy, s, rot);
    const pull = ease.inOutCubic(clamp((lt - 0.1) / (s1 - s0 - 0.1)));
    const z = lerp(3.1, 1.0, pull), fx = lerp(foot.x + 20, W / 2 - 20, pull), fy = lerp(foot.y - 70, H / 2 - 10, pull);
    withCam2(c, g, { zoom: z, x: fx - W / 2, y: fy - H / 2 }, () => {
      murk(c, t, { floor: H * 0.88, seed: 3 });
      // the anchor and a coin in the silt, out at the bow (found later, line 23)
      const an = { x: W * 0.07, y: H * 0.95 };
      anchor(c, an.x, an.y, 0.3, -0.55);
      goldCoin(c, g, W * 0.17, H * 0.955, 16, t, 0.5);
      const ring = { x: an.x - 410 * Math.sin(0.55) * 0.3, y: an.y - 410 * Math.cos(0.55) * 0.3 };
      hull(c, g, ox, oy, s, rot, t, { chain: this.hl(ring.x, ring.y, ox, oy, s, rot), rim: 0.9 });
      // the girl kneeling at the hatch's rim, her torch down into the hold; Rai standing on its far side
      const gh = 150, gx = foot.x - 118, gy = foot.y;
      const kneel: GirlPose = { ...GIRL_POSES.kneel!(t), rot: 0.18, sh: [-0.3, 1.35], el: [0.3, 0.25] };
      const shp = { x: gx + Math.sin(0.18) * (29 - 3) * gh / 100, y: gy - (37 - 18) * gh / 100 - Math.cos(0.18) * 26 * gh / 100 };
      kneel.sh[1] = aim(Math.atan2(mouth.y + 6 - shp.y, mouth.x - 20 - shp.x), false, 0.18) - 0.25;
      const ga = girl(c, gx, gy, gh, kneel, { ...GIRL, t, torch: true, glint: 'wide' });
      this.pend(g, ga, 0.8);
      const holes: Hole[] = [this.beam(g, ga, mouth.x - 10, mouth.y + 8, 0.3, 0.45), { x: foot.x, y: foot.y - 40, r: 260, soft: 0.8, a: 0.7 }];
      const glw = g.createRadialGradient(mouth.x, mouth.y, 0, mouth.x, mouth.y, 70);
      glw.addColorStop(0, rgbaHex('#ffe0a0', 0.12)); glw.addColorStop(1, rgbaHex('#ffe0a0', 0));
      g.fillStyle = glw; g.fillRect(mouth.x - 70, mouth.y - 70, 140, 140);
      const dead = t >= wd.trader!.start;
      const rr = this.rai(c, g, foot.x + 132, foot.y - 1.07 * 46, 46, {
        t, face: dead ? 'deadpan' : 'serious', arms: dead ? ['cross', 'cross'] : ['down', 'chin'], armsFrom: ['down', 'chin'], armsU: clamp((t - wd.trader!.start) / 0.15),
        look: dead ? 0.2 : -0.7, marks: dead ? ['sweat'] : [], markT0: wd.trader!.start + 0.2,
      });
      holes.push(rr.hole);
      dark(c, 0.48, holes);
    });
    snow(c, t, 60, 3);
    return {};
  }

  /** W2: tracking along the hull; the beam scans the portholes and finds the name on "iron hull". */
  w2(c: C2, g: C2, t: number, s0: number): PostOverrides {
    const wd = this.w, s = 1.3, rot = -0.025;
    const ox = W * 0.46 - HULL.name.x * s + (t - wd.iron!.start) * 240, oy = H * 0.42 - HULL.name.y * s;
    murk(c, t, { floor: H * 1.2, seed: 5, far: false, pan: (t - s0) * 200 });
    hull(c, g, ox, oy, s, rot, t, { rim: 0.6, gear: false });
    const found = sm(wd.iron!.start - 0.12, wd.iron!.start + 0.12, t);
    const scan = this.hp(HULL.ports[1]! + 300 - (t - s0) * 380, -560, ox, oy, s, rot);
    const name = this.hp(HULL.name.x, HULL.name.y, ox, oy, s, rot);
    const tx = lerp(scan.x, name.x, found), ty = lerp(scan.y, name.y, found);
    // the girl swims along it in the foreground towards the bow, a silhouette; the torch up at the plates
    const gx = W * 0.74 + 14 * Math.sin(t * 2), gy = H * 0.72;
    const lamp = { x: gx - 290, y: gy - 120 };
    const holes: Hole[] = [this.beam(g, { torch: lamp }, tx, ty, found > 0.5 ? 0.24 : 0.17), { x: W * 0.6, y: H * 0.95, r: 700, soft: 0.9, a: 0.55 }];
    const rx = W * 0.9, ry = H * 0.36 + 10 * Math.sin(t * 2.2);
    const rr = this.rai(c, g, rx, ry, 84, { t, face: 'deadpan', arms: ['down', 'down'], tilt: -0.3, look: -0.8, marks: found > 0.6 ? ['sweat'] : [], markT0: wd.hull!.start });
    holes.push(rr.hole);
    dark(c, 0.8, holes);
    // rust flakes drifting off the plates in the beam
    c.fillStyle = 'rgba(214,120,60,0.8)';
    for (let i = 0; i < 26; i++) {
      const u = ((t * 0.3 + h01(i, 23)) % 1), x = tx - 300 + 600 * h01(i, 24) + 40 * Math.sin(t * 2 + i), y = ty - 100 + u * 260;
      c.save(); c.globalAlpha = 0.8 * (1 - u); c.translate(x, y); c.rotate(t * 3 + i); c.fillRect(-4, -2, 8, 4); c.restore();
    }
    const th = Math.atan2(ty - lamp.y, tx - lamp.x);
    const gA = girl(c, gx, gy, 600, swimAim(t, th, true), { ...GIRL, t, flip: true, torch: true, glint: found > 0.5 ? 'wide' : 'plain', rim: 'rgba(255,214,150,0.9)' });
    this.pend(g, gA);
    snow(c, t, 50, 6, 1.4, (t - s0) * 200);
    return punch(t, [wd.iron!.start], 0.02);
  }

  /** W3: on deck; the trader's ghost forms; "why paddle?" in flaking paint, his big gesture. */
  w3(c: C2, g: C2, t: number, s0: number, s1: number): PostOverrides {
    const wd = this.w, u = clamp((t - s0) / (s1 - s0));
    const why = wd.why!.start, lit = sm(why - 0.1, why + 0.15, t);
    const pan = 40 * u;
    deckView(c, g, t, { lit, pan });
    const form = clamp((t - (wd.said!.start - 0.25)) / 0.45);
    const arm = t < why ? 0 : t < wd.paddle!.start + 0.25 ? clamp((t - why) / 0.22) : 1 + clamp((t - (wd.paddle!.start + 0.3)) / 0.3);
    const gx = W * 0.42 - pan * 0.5, gy = H * 0.86;
    // the torch from the girl just out of frame, low left: it finds him on "said", then his slogan on "why"
    const bx = W * 0.72 - pan, by = H * 0.33;
    const tx = lerp(gx + 30, bx, lit), ty = lerp(gy - 420, by, lit);
    const holes: Hole[] = [this.beam(g, { torch: { x: -20, y: H * 0.98 } }, tx, ty, lerp(0.12, 0.18, lit), 0.8)];
    holes.push({ x: gx, y: gy - 300, r: 380, soft: 0.8, a: 0.7 });
    const rr = this.rai(c, g, W * 0.86, H * 0.74, 92, { t, face: 'deadpan', arms: ['cross', 'cross'], look: -0.9, marks: t > wd.paddle!.start ? ['sweat'] : [], markT0: wd.paddle!.start + 0.05, tilt: -0.05 });
    holes.push(rr.hole);
    dark(c, 0.62, holes);
    ghost(c, g, gx, gy, 580, t, { a: form, arm, ledger: true });
    snow(c, t, 50, 8, 1.2);
    return mergePost(punch(t, [why], 0.025), { zoom: 1 + 0.03 * u });
  }

  /** W4: the bow; her hand rubs the rust off 1 TON; on "ton" the paint shows and Rai goes chibi, deadpan. */
  w4(c: C2, g: C2, t: number, s0: number, s1: number): PostOverrides {
    const wd = this.w, ton = wd.ton!.start, u = clamp((t - s0) / (s1 - s0));
    const s = 1.45, rot = -0.03;
    const ox = W * 0.6 - HULL.ton.x * s - 30 * u, oy = H * 0.46 - HULL.ton.y * s;
    murk(c, t, { floor: H * 1.3, seed: 9, far: false });
    const rub = { x: HULL.ton.x - 60 + 50 * Math.sin(t * 13), y: HULL.ton.y + 30 * Math.cos(t * 13) };
    const tv = ease.outCubic(clamp((t - s0 - 0.05) / (ton - s0 - 0.05)));
    hull(c, g, ox, oy, s, rot, t, { ton: tv, rub: { x: HULL.ton.x - 40, y: HULL.ton.y }, rim: 0, gear: false });
    const holes: Hole[] = [{ x: W * 0.58, y: H * 0.46, r: 620, soft: 0.75 }];
    const sd = t >= ton + 0.02;
    const rr = this.rai(c, g, W * 0.15, H * 0.62, sd ? 120 : 140, {
      t, face: 'deadpan', arms: sd ? ['down', 'down'] : ['down', 'hip'], sd, marks: sd ? ['sweat'] : [], markT0: ton + 0.08, look: 0.9, noBlink: sd,
    });
    holes.push(rr.hole);
    dark(c, 0.55, holes);
    // the torch light on the plate from her other hand, low right
    const tl = g.createRadialGradient(W * 0.6, H * 0.5, 0, W * 0.6, H * 0.5, 560);
    tl.addColorStop(0, rgbaHex('#ffe7b0', 0.16)); tl.addColorStop(1, rgbaHex('#ffe7b0', 0));
    g.fillStyle = tl; g.fillRect(0, 0, W, H);
    // the rust flakes she rubs loose
    c.fillStyle = 'rgba(190,90,40,0.85)';
    for (let i = 0; i < 30 && t < ton + 0.2; i++) {
      const k = ((t - s0) * 1.6 + h01(i, 31)) % 1, p = this.hp(rub.x, rub.y, ox, oy, s, rot);
      const x = p.x + (h01(i, 32) - 0.5) * 240 + k * 120 * (h01(i, 33) - 0.3), y = p.y + k * 260 + 20 * Math.sin(t * 3 + i);
      c.save(); c.globalAlpha = 1 - k; c.translate(x, y); c.rotate(t * 4 + i); c.fillRect(-5, -2.5, 10, 5); c.restore();
    }
    // her hand, rubbing in circles, then away on "ton"
    const away = ease.inCubic(clamp((t - ton + 0.04) / 0.25));
    const hp = this.hp(rub.x, rub.y, ox, oy, s, rot);
    hand(c, hp.x + away * 600, hp.y + away * 420, 1.2, -0.75, 0.15, '#0d0a18', 'rgba(255,220,150,0.6)');
    poof(c, W * 0.15, H * 0.52, 190, t, ton + 0.02);
    // the paint's clang on "ton": short strokes flying off the letters
    if (t > ton && t < ton + 0.35) {
      const k = clamp((t - ton) / 0.35), cx = W * 0.6, cy = H * 0.46;
      c.save(); c.strokeStyle = `rgba(250,244,225,${1 - k})`; c.lineWidth = 6; c.lineCap = 'round';
      for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU + 0.2, r0 = 330 + 140 * k, r1 = r0 + 70; c.beginPath(); c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.55); c.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.55); c.stroke(); }
      c.restore();
    }
    snow(c, t, 40, 11, 1.6);
    return punch(t, [ton], 0.035);
  }

  // ------------------------------------------------------------------ line 21: in bulk

  /** W5: into the hold; the torch finds a stack; on "bulk" Rai's heart lights the whole hold: rows of identical discs. */
  w5(c: C2, g: C2, t: number, s0: number, s1: number): PostOverrides {
    const wd = this.w, bulk = wd.bulk!.start, u = clamp((t - s0) / (s1 - s0));
    const lightUp = sm(bulk - 0.05, bulk + 0.35, t);
    hold(c, g, t, { z: 0.6 * u, stencil: 0.1 + 0.3 * lightUp, vp: { x: W * 0.5, y: H * 0.36 } });
    const gx = lerp(W * 0.3, W * 0.42, u), gy = H * 0.24 + 8 * Math.sin(t * 2);
    const tx = lerp(W * 0.62, W * 0.7, sm(s0, bulk, t)), ty = H * 0.7;
    const rx = lerp(W * 0.12, W * 0.2, u), ry = H * 0.34 + 8 * Math.sin(t * 2.3);
    const holes: Hole[] = [];
    const rr = this.rai(c, g, rx, ry, 70, { t, face: lightUp > 0.3 ? 'smug' : 'deadpan', arms: lightUp > 0.3 ? ['hip', 'hip'] : ['down', 'down'], heart: 0.3 + 0.7 * lightUp, heartColor: HEX.gold, tilt: 0.2, look: 0.8, marks: lightUp > 0.6 ? ['shine'] : [], markT0: bulk + 0.25 }, 0.6 + lightUp);
    holes.push(rr.hole, { x: rr.a.heart.x, y: rr.a.heart.y + 200, r: 200 + 1500 * lightUp, soft: 0.85, a: 0.85 });
    if (lightUp > 0) {
      const hg = g.createRadialGradient(rr.a.heart.x, rr.a.heart.y, 0, rr.a.heart.x, rr.a.heart.y, 260);
      hg.addColorStop(0, rgbaHex(HEX.gold, 0.45 * lightUp)); hg.addColorStop(1, rgbaHex(HEX.gold, 0));
      g.fillStyle = hg; g.fillRect(rr.a.heart.x - 260, rr.a.heart.y - 260, 520, 520);
      // the warm light washing over the stacks
      c.save(); c.globalCompositeOperation = 'soft-light'; c.fillStyle = rgbaHex('#ffcf70', 0.35 * lightUp); c.fillRect(0, 0, W, H); c.restore();
    }
    const ga0 = { torch: { x: gx + 120, y: gy + 40 } };
    holes.push(this.beam(g, ga0, tx, ty, 0.18, 1 - 0.5 * lightUp));
    dark(c, 0.88, holes);
    const gB = girl(c, gx, gy, 300, swimAim(t, Math.atan2(ty - gy, tx - gx)), { ...GIRL, t, torch: true, glint: lightUp > 0.5 ? 'wide' : 'plain', rim: 'rgba(255,214,150,0.7)' });
    this.pend(g, gB);
    snow(c, t, 50, 13, 1.2);
    return punch(t, [bulk], 0.025);
  }

  /** W6: the trader's ghost hands a disc to an islander's ghost, who bows: thanks. The queue behind. Rai smug. */
  w6(c: C2, g: C2, t: number, s0: number, s1: number): PostOverrides {
    const wd = this.w, th = wd.thanks!.start, u = clamp((t - s0) / (s1 - s0));
    hold(c, g, t, { z: 0.6 + 0.3 * u, x: -0.1, stencil: 0.2, vp: { x: W * 0.5, y: H * 0.36 } });
    const holes: Hole[] = [{ x: W * 0.52, y: H * 0.6, r: 640, soft: 0.85, a: 0.75 }];
    const rr = this.rai(c, g, W * 0.87, H * 0.7, 116, { t, face: 'smug', arms: ['chin', 'cross'], look: -0.9, tilt: -0.06, marks: t > th ? ['shine'] : [], markT0: th + 0.1 });
    holes.push(rr.hole);
    dark(c, 0.72, holes);
    // the queue of islanders' ghosts down the aisle, each waiting for an identical disc
    for (let k = 3; k >= 1; k--) {
      const x = W * (0.37 - 0.035 * k), y = H * (0.84 - 0.08 * k), h = 400 * (1 - 0.2 * k);
      ghost(c, g, x, y, h, t + k, { a: 0.8 - 0.15 * k, islander: { bow: 0, seed: k }, col: '#a8f0ff' });
    }
    const bow = ease.outBack(clamp((t - th + 0.05) / 0.25)) * (1 - clamp((t - th - 0.45) / 0.3));
    ghost(c, g, W * 0.43, H * 0.86, 400, t, { a: 1, islander: { bow, seed: 0 }, col: '#a8f0ff' });
    const give = sm(s0, th - 0.05, t);
    ghost(c, g, W * 0.6, H * 0.88, 460, t, { a: 1, arm: 2 - give * 0.4, ledger: true, flip: true });
    // the disc passing between them, and the heart of thanks
    const dx = lerp(W * 0.55, W * 0.475, give), dy = H * 0.88 - 460 * 0.62 + 30 * give;
    c.save();
    c.fillStyle = 'rgba(200,255,240,0.35)'; c.strokeStyle = 'rgba(220,255,245,0.9)'; c.lineWidth = 3;
    c.beginPath(); c.ellipse(dx, dy, 34, 30, 0, 0, TAU); c.moveTo(dx + 9, dy); c.ellipse(dx, dy, 9, 8, 0, 0, TAU); c.fill('evenodd'); c.stroke();
    c.restore();
    if (t > th) {
      const hu = clamp((t - th) / 0.7);
      heart(c, W * 0.44, H * 0.86 - 400 * 1.05 - hu * 70, 28 * (1 - hu * 0.3), `rgba(255,79,154,${1 - hu * 0.6})`);
    }
    snow(c, t, 40, 17, 1.3);
    return {};
  }

  /** W7: the beam runs down the bulkhead to the stencil, 1/10 EACH, on "fraction". Rai points, smug. */
  w7(c: C2, g: C2, t: number, s0: number, s1: number): PostOverrides {
    const wd = this.w, fr = wd.fraction!.start, u = clamp((t - s0) / (s1 - s0));
    const lit = sm(fr - 0.12, fr + 0.06, t);
    const vp = { x: W * 0.44, y: H * 0.56 }, z = 6.4 + 0.3 * u;
    hold(c, g, t, { z, stencil: lit, vp });
    const k = 760 / (10 - z), sx = vp.x, sy = vp.y + (-1.8 + 2.8 * 0.4) * k;   // the stencil's centre on the bulkhead
    const tx = lerp(W * 0.02, sx, sm(s0, fr, t)), ty = lerp(H * 0.5, sy, sm(s0, fr, t));
    const holes: Hole[] = [this.beam(g, { torch: { x: W * 0.3, y: H + 80 } }, tx, ty, lerp(0.12, 0.17, lit), 0.8)];
    holes.push({ x: sx, y: sy, r: 300 + 200 * lit, soft: 0.6, a: 0.4 + 0.6 * lit });
    const rr = this.rai(c, g, W * 0.84, H * 0.7, 118, {
      t, face: lit > 0.5 ? 'smug' : 'deadpan', arms: lit > 0.5 ? ['point', 'hip'] : ['cross', 'cross'], armsFrom: ['cross', 'cross'], armsU: lit,
      tilt: -0.1 * lit, look: -0.9, marks: lit > 0.5 ? ['shine'] : [], markT0: fr + 0.1,
    });
    holes.push(rr.hole);
    dark(c, 0.82, holes);
    return mergePost(punch(t, [fr], 0.03), { zoom: 1 + 0.02 * u });
  }

  /** W8: her finger taps a disc on "one": tk. One grey ring, gone at once. Rai smug, her heart warm. */
  w8(c: C2, g: C2, t: number, s0: number): PostOverrides {
    const one = this.w.one!.start;
    hold(c, g, t, { z: 3.2, x: -1.0, stencil: 0.3, vp: { x: W * 0.62, y: H * 0.16 } });
    for (let k = 3; k >= 0; k--) bulkTop(c, W * 0.42, H * 0.66 + k * 70, 470, 140, 70);
    const holes: Hole[] = [{ x: W * 0.42, y: H * 0.62, r: 520, soft: 0.7 }];
    const rr = this.rai(c, g, W * 0.82, H * 0.6, 150, { t, face: 'smug', arms: ['cross', 'cross'], heart: 0.9, heartColor: HEX.gold, marks: ['shine'], markT0: one + 0.05, tilt: -0.05, glowStrength: 0.9 }, 1.2);
    holes.push(rr.hole);
    dark(c, 0.7, holes);
    const tl = g.createRadialGradient(W * 0.42, H * 0.6, 0, W * 0.42, H * 0.6, 520);
    tl.addColorStop(0, rgbaHex('#ffe7b0', 0.14)); tl.addColorStop(1, rgbaHex('#ffe7b0', 0));
    g.fillStyle = tl; g.fillRect(0, 0, W, H);
    // the finger comes down and taps
    const tap = t < one ? 0 : clamp((t - one) / 0.06) * (1 - clamp((t - one - 0.1) / 0.15));
    const pre = sm(s0 - 0.1, one - 0.02, t);
    c.save(); c.translate(W * 0.4 + 80 * (1 - pre), H * 0.56 - 260 * (1 - pre) - 24 * (1 - tap)); c.rotate(-0.5);
    c.fillStyle = '#0d0a18'; c.strokeStyle = '#0d0a18'; c.lineCap = 'round';
    c.lineWidth = 60; c.beginPath(); c.moveTo(0, -80); c.lineTo(0, -700); c.stroke();
    c.beginPath(); c.ellipse(0, -110, 54, 74, 0, 0, TAU); c.fill();
    c.lineWidth = 26; c.beginPath(); c.moveTo(10, -60); c.lineTo(10, 0); c.stroke();
    c.lineWidth = 24; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-34 + k * 8, -60); c.lineTo(-30 + k * 9, -36); c.stroke(); }
    c.strokeStyle = 'rgba(255,220,150,0.6)'; c.lineWidth = 4; c.beginPath(); c.moveTo(-52, -140); c.lineTo(-40, -50); c.stroke();
    c.beginPath(); c.moveTo(-2, -40); c.lineTo(-2, -4); c.stroke();
    c.restore();
    if (t > one) { // tk. and one dull ring that dies
      const a = 1 - clamp((t - one - 0.25) / 0.2);
      c.save(); c.globalAlpha = a; c.font = font(FAM.monoB(), 64); c.fillStyle = '#a8a59c'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('tk.', W * 0.25, H * 0.44); c.restore();
      soundRing(c, W * 0.4, H * 0.6, 200, clamp((t - one) / 0.22), 'rgba(170,168,160,0.9)', 1);
    }
    return punch(t, [one], 0.02);
  }

  // ------------------------------------------------------------------ line 22: her crossing, at dusk

  /** W9: her crossing: the jetty's legs behind at the surface, the wreck ahead in the dark; Rai swims alongside. */
  w9(c: C2, g: C2, t: number, s0: number): PostOverrides {
    const pan = (t - s0) * 520;
    duskWater(c, t, { pan });
    // the jetty's legs going down from the surface, far behind (where she started)
    c.fillStyle = 'rgba(40,24,50,0.75)';
    for (let k = 0; k < 5; k++) { const x = W * 0.06 + k * 70 - pan * 0.25; c.fillRect(x, H * 0.06, 14, H * 0.42 - k * 10); }
    c.fillStyle = 'rgba(40,24,50,0.85)'; c.fillRect(W * 0.03 - pan * 0.25, H * 0.04, 360, 22);
    // the wreck ahead, dark in the deep
    c.fillStyle = 'rgba(16,12,36,0.85)';
    c.beginPath(); c.moveTo(W * 0.78 - pan * 0.15, H * 0.72); c.lineTo(W * 0.84 - pan * 0.15, H * 0.5); c.lineTo(W * 1.2, H * 0.52); c.lineTo(W * 1.2, H * 0.74); c.closePath(); c.fill();
    c.fillRect(W * 0.96 - pan * 0.15, H * 0.38, 50, H * 0.14);
    duskReef(c, t, { pan, floor: H * 0.86 });
    // the girl swims hard, left to right; Rai alongside, determined
    const gx = W * 0.5 + 12 * Math.sin(t * 2), gy = H * 0.44;
    const ga = girl(c, gx, gy, 330, 'swim', { ...GIRL, t, torch: false, glint: 'plain', rim: 'rgba(255,190,140,0.75)' });
    this.pend(g, ga);
    this.breath(c, ga.head.x - 30, ga.head.y - 30, t, 5, 1);
    c.save(); c.globalAlpha = 0.5; speedLines(c, 0, 'rgba(255,220,200,0.6)', t, { n: 26, band: [H * 0.3, H * 0.7], speed: -1800 }); c.restore();
    this.rai(c, g, W * 0.3, H * 0.66 + 10 * Math.sin(t * 2.6), 74, { t, face: 'determined', arms: ['fist', 'reach'], tilt: 0.45, marks: [], glow: '#ffb070' }, 0.4);
    return {};
  }

  /** W10: risk: a moray lunges from its hole and snaps at her fins; she jerks clear. */
  w10(c: C2, g: C2, t: number, s0: number): PostOverrides {
    const risk = this.w.risk!.start, lt = t - s0;
    duskWater(c, t, { pan: lt * 200 });
    c.fillStyle = 'rgba(20,14,48,0.45)'; c.fillRect(0, 0, W, H);
    duskReef(c, t, { pan: lt * 200 + 900, floor: H * 0.9, seed: 5 });
    rockHole(c, W * 0.17, H * 0.6, 230);
    const out = ease.outExpo(clamp((t - risk + 0.02) / 0.14)), jaw = t < risk + 0.16 ? clamp((t - risk + 0.02) / 0.1) : 1 - clamp((t - risk - 0.16) / 0.06);
    const jerk = ease.outCubic(clamp((t - risk - 0.1) / 0.2));
    const ga = girl(c, W * 0.66 + 90 * jerk, H * 0.38 - 50 * jerk, 360, 'swim', { ...GIRL, t: t * 1.6, glint: jerk > 0.2 ? 'wide' : 'plain', rim: 'rgba(255,190,140,0.75)' });
    this.pend(g, ga);
    moray(c, W * 0.2, H * 0.6, 1.1, -0.28, out, jaw, t);
    if (t > risk + 0.12 && t < risk + 0.4) { c.save(); c.globalAlpha = 1 - clamp((t - risk - 0.12) / 0.28); impactBurst(c, W * 0.54, H * 0.47, 90, 'rgba(255,240,220,0.0)', 'rgba(255,240,220,0.9)', t, 10); c.restore(); }
    this.breath(c, ga.head.x - 20, ga.head.y - 20, t, 6, 1.2);
    this.rai(c, g, W * 0.88, H * 0.22, 64, { t, face: jerk > 0.3 ? 'determined' : 'shock', arms: jerk > 0.3 ? ['fist', 'fist'] : ['up', 'up'], tilt: 0.2, marks: ['!'], markT0: risk + 0.02, glow: '#ffb070' }, 0.4);
    return punch(t, [risk + 0.08], 0.03);
  }

  /** W11: the reef: razor coral above and below, she threads the gap; Rai squeezes after her. */
  w11(c: C2, g: C2, t: number, s0: number): PostOverrides {
    const lt = t - s0;
    duskWater(c, t, { pan: lt * 300 + 400 });
    c.fillStyle = 'rgba(20,14,48,0.35)'; c.fillRect(0, 0, W, H);
    for (let k = 0; k < 5; k++) razorCoral(c, W * (0.05 + 0.24 * k) - lt * 160, H * 1.02, 380, 30 + k, t);
    c.save(); c.translate(0, H * 0.06); c.scale(1, -1);
    for (let k = 0; k < 5; k++) razorCoral(c, W * (0.15 + 0.24 * k) - lt * 160, 0, 300, 40 + k, t, '#b04a7a', '#3a1848');
    c.restore();
    const ga = girl(c, W * 0.54 + lt * 120, H * 0.5, 380, 'glide', { ...GIRL, t, glint: 'droop', rim: 'rgba(255,190,140,0.75)' });
    this.pend(g, ga);
    this.breath(c, ga.head.x, ga.head.y - 20, t, 3, 1);
    this.rai(c, g, W * 0.2 + lt * 140, H * 0.53, 66, { t, face: 'determined', arms: ['down', 'down'], squash: -0.45, tilt: 0.3, marks: ['sweat'], markT0: s0 + 0.05, glow: '#ffb070' }, 0.4);
    // the near spikes, soft, in front of everything
    c.save(); c.globalAlpha = 0.85; razorCoral(c, W * 0.9 - lt * 260, H * 1.08, 520, 51, t, '#5a2050', '#2a0f30'); c.restore();
    return {};
  }

  /** W12: hands: hers on the rock against the current, and Rai's beside them. */
  w12(c: C2, g: C2, t: number, s0: number): PostOverrides {
    duskWater(c, t, { pan: 700 });
    const ly = (x: number) => H * 0.4 + 14 * Math.sin(x * 0.013) + 8 * Math.sin(x * 0.041);
    // the rock ledge across the frame, lit warm along its lip by the dusk
    c.fillStyle = '#2a2058';
    c.beginPath(); c.moveTo(-20, -20); c.lineTo(W + 20, -20); c.lineTo(W + 20, ly(W));
    for (let x = W; x >= 0; x -= 40) c.lineTo(x, ly(x));
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,170,130,0.5)'; c.lineWidth = 6;
    c.beginPath(); for (let x = 0; x <= W; x += 40) x ? c.lineTo(x, ly(x) - 4) : c.moveTo(x, ly(x) - 4); c.stroke();
    for (let i = 0; i < 14; i++) { c.fillStyle = i % 2 ? 'rgba(200,120,170,0.5)' : 'rgba(255,150,120,0.4)'; c.beginPath(); c.arc(W * h01(i, 41), H * (0.05 + 0.3 * h01(i, 42)), 8 + 18 * h01(i, 43), 0, TAU); c.fill(); }
    // the current streaming past, with grains of sand in it
    c.save(); c.globalAlpha = 0.6; speedLines(c, PI, 'rgba(255,230,210,0.55)', t, { n: 40, band: [H * 0.42, H], speed: 2600 }); c.restore();
    c.fillStyle = 'rgba(255,220,190,0.7)';
    for (let i = 0; i < 40; i++) { const x = W - ((h01(i, 44) * W + t * 1400 * (0.6 + h01(i, 45))) % (W + 100)), y = H * (0.45 + 0.5 * h01(i, 46)); c.fillRect(x, y, 6, 2); }
    const strain = 6 * Math.sin(t * 22);
    // Rai hangs on beside her, streaming out in the current, one hand on the rock
    this.rai(c, g, W * 0.76, H * 0.6, 120, { t, face: 'determined', arms: ['up', 'reach'], tilt: -0.55 + 0.03 * Math.sin(t * 20), marks: ['sweat'], markT0: s0, glow: '#ffb070', squash: 0.15 }, 0.4);
    hand(c, W * 0.34 + strain, ly(W * 0.34) + 30, 1.6, 0.35, 1, '#0d0a18', 'rgba(255,190,140,0.8)');
    hand(c, W * 0.5 - strain, ly(W * 0.5) + 30, 1.6, -0.15, 1, '#0d0a18', 'rgba(255,190,140,0.8)');
    return {};
  }

  /** W13: hours: her dive watch counting the breath held, 0:41 ... 0:52, beeping on "cost". */
  w13(c: C2, g: C2, t: number, s0: number): PostOverrides {
    const wd = this.w, cost = wd.cost!.start;
    duskWater(c, t, { pan: 1200 });
    c.fillStyle = 'rgba(16,10,40,0.55)'; c.fillRect(0, 0, W, H);
    duskReef(c, t, { pan: 1400 + (t - s0) * 120, floor: H * 0.95, seed: 7 });
    const secs = 41 + Math.min(11, Math.floor(clamp((t - wd.hours!.start + 0.05) / (cost - wd.hours!.start)) * 11.999));
    const beep = t > cost ? 1 - clamp((t - cost) / 0.35) : 0;
    diveWatch(c, g, W * 0.4 + 6 * Math.sin(t * 3), H * 0.46, 1.25, -0.3 + 0.02 * Math.sin(t * 2), secs, beep, t);
    // her breath leaking out above
    this.breath(c, W * 0.6, H * 0.36, t, 8, 1.4);
    this.rai(c, g, W * 0.8, H * 0.6, 130, { t, face: t > cost ? 'determined' : 'serious', arms: t > cost ? ['fist', 'fist'] : ['down', 'fist'], look: -0.8, marks: ['sweat'], markT0: s0 + 0.1, glow: '#ffb070' }, 0.5);
    return mergePost(punch(t, [cost], 0.03), caKick(t, [cost], 3, 0.2));
  }

  // ------------------------------------------------------------------ line 23: not heavy, not shiny, the voyage

  /** W14: she heaves on the wreck's anchor; it will not move. Rai shrugs. */
  w14(c: C2, g: C2, t: number, s0: number, s1: number): PostOverrides {
    const heavy = this.w.heavy!.start, u = clamp((t - s0) / (s1 - s0));
    withCam2(c, g, { zoom: 1.05 - 0.04 * u, x: 20 * u }, () => {
      murk(c, t, { floor: H * 0.86, seed: 21 });
      const ox = W * 1.02, oy = H * 0.88, s = 0.7, rot = -0.03;
      hull(c, g, ox, oy, s, rot, t, { rim: 0.6 });
      const ax = W * 0.56, ay = H * 0.94, as = 0.8, ar = -0.42;
      const jig = t > heavy ? 3 * Math.sin(t * 40) * (1 - clamp((t - heavy) / 0.3)) : 0;
      const ring = { x: ax - 410 * Math.sin(-ar) * as + jig, y: ay - 410 * Math.cos(ar) * as };
      const hw = this.hp(HULL.hawse.x, HULL.hawse.y, ox, oy, s, rot);
      chain(c, ring.x, ring.y, hw.x, hw.y, t, 1);
      anchor(c, ax + jig, ay, as, ar);
      // the torch dropped in the silt, lighting the scene from below
      c.fillStyle = '#e8e2d0'; c.save(); c.translate(W * 0.27, H * 0.95); c.rotate(-0.25); c.fillRect(-28, -10, 56, 20); c.fillStyle = '#fff6c8'; c.beginPath(); c.arc(28, 0, 9, 0, TAU); c.fill(); c.restore();
      const holes: Hole[] = [softBeam(g, W * 0.27 + 26, H * 0.95 - 7, -0.25, 640, 0.42, 0.8)];
      // the girl, braced, heaving back on the ring
      const heave = 0.05 * Math.sin(t * 9) + (t > heavy ? 0.08 : 0), rotG = -0.5 - heave;
      const gx = ring.x - 70, gy = ring.y + 190;
      const shG = { x: gx + Math.sin(rotG) * 104, y: gy - 148 - Math.cos(rotG) * 104 };
      const thA = Math.atan2(ring.y - shG.y, ring.x - shG.x), armA = aim(thA, false, rotG);
      const pose: GirlPose = { rot: rotG, hip: [0.9, -0.35], knee: [-1.35, -0.2], sh: [armA - 0.1, armA], el: [0.1, 0.0], head: 0.3 };
      const ga = girl(c, gx, gy, 400, pose, { ...GIRL, t, glint: t > heavy ? 'droop' : 'plain', emote: t > heavy ? 'sweat' : undefined, emoteT0: heavy, rim: 'rgba(255,214,150,0.7)' });
      this.pend(g, ga);
      // her hands on the ring: the strain shows as little lines
      if (t > heavy - 0.1) {
        c.save(); c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 4; c.lineCap = 'round';
        for (let i = 0; i < 3; i++) { const a = -2.4 + i * 0.4, hx = ga.hands[1].x, hy = ga.hands[1].y; c.beginPath(); c.moveTo(hx + Math.cos(a) * 40, hy + Math.sin(a) * 40); c.lineTo(hx + Math.cos(a) * 70, hy + Math.sin(a) * 70); c.stroke(); }
        c.restore();
      }
      if (t > heavy) { // the silt she kicks up
        const k = clamp((t - heavy) / 0.6);
        c.fillStyle = `rgba(110,140,110,${0.5 * (1 - k)})`;
        for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(ga.feet[0].x - 40 + i * 30 - k * 40, ga.feet[0].y - 10 - k * 40 * h01(i, 51), 20 + 50 * k, 0, TAU); c.fill(); }
      }
      const rr = this.rai(c, g, W * 0.84, H * 0.72, 112, { t, face: t > heavy ? 'sassy' : 'deadpan', arms: ['shrug', 'shrug'], armsFrom: ['down', 'down'], armsU: sm(heavy - 0.2, heavy + 0.05, t), tilt: 0.08, look: -0.9, marks: t > heavy ? ['sweat'] : [], markT0: heavy + 0.1 });
      holes.push(rr.hole, { x: ax - 120, y: ay - 220, r: 520, soft: 0.8, a: 0.8 });
      dark(c, 0.45, holes);
      snow(c, t, 50, 23, 1.2);
    });
    return punch(t, [heavy], 0.025);
  }

  /** The slate's drawings in slate units (220 x 280 board, 0,0 its centre): an anchor, a coin, the route. */
  anchorDoodle(c: C2, u: number, ox: number, oy: number, k: number) {
    const P = (pts: [number, number][]) => pts.map(([x, y]) => [ox + x * k, oy + y * k] as [number, number]);
    const parts: [number, number][][] = [
      P([[0, -40], [0, 34]]), P(circlePts(0, -48, 8, 16).map(([x, y]) => [x, y] as [number, number])),
      P([[-20, -30], [20, -30]]), P([[-36, 10], [-30, 26], [-14, 36], [0, 38], [14, 36], [30, 26], [36, 10]]), P([[-36, 10], [-44, 18]]), P([[36, 10], [44, 18]]),
    ];
    parts.forEach((pts, i) => pencil(c, pts, clamp(u * parts.length - i), '#2a2a33', 4.5));
  }
  coinDoodle(c: C2, u: number, ox: number, oy: number, k: number) {
    pencil(c, circlePts(ox, oy, 30 * k, 30), clamp(u * 2), '#2a2a33', 4.5);
    const r = 12 * k;
    pencil(c, [[ox - r * 0.2, oy - r], [ox - r * 0.6, oy - r * 0.2], [ox - r * 0.3, oy + r * 0.8], [ox + r * 0.6, oy + r * 0.8]], clamp(u * 2 - 1), '#2a2a33', 4);
    for (let i = 0; i < 3; i++) { const a = -0.9 + i * 0.5; pencil(c, [[ox + Math.cos(a) * 38 * k, oy + Math.sin(a) * 38 * k], [ox + Math.cos(a) * 50 * k, oy + Math.sin(a) * 50 * k]], clamp(u * 2 - 1), '#2a2a33', 3); }
  }
  cross(c: C2, u: number, ox: number, oy: number, r: number) {
    pencil(c, [[ox - r, oy - r], [ox + r, oy + r]], clamp(u * 2), '#b0283a', 9);
    pencil(c, [[ox + r, oy - r], [ox - r, oy + r]], clamp(u * 2 - 1), '#b0283a', 9);
  }

  /** W15: the slate: an anchor drawn and crossed out on "are". Rai shrugs at the edge. */
  w15(c: C2, g: C2, t: number, s0: number, s1: number): PostOverrides {
    const are = this.w.are!.start, u = clamp((t - s0) / (s1 - s0));
    murk(c, t, { floor: H * 0.9, seed: 25, far: false });
    c.fillStyle = 'rgba(4,12,12,0.5)'; c.fillRect(0, 0, W, H);
    snow(c, t, 30, 25, 2.5);
    const dr = sm(s0, are - 0.1, t), x = sm(are - 0.04, are + 0.16, t);
    const sx = W * 0.42, sy = H * 0.45, ss = 2.15, srot = -0.06 + 0.02 * Math.sin(t * 1.4);
    slate(c, sx, sy, ss, srot, (k) => {
      k.font = font(FAM.monoB(), 18); k.fillStyle = 'rgba(42,42,51,0.5)'; k.textAlign = 'left'; k.fillText('WHAT MAKES IT WORTH IT?', -94, -110);
      this.anchorDoodle(k, dr, 0, -10, 1.6);
      this.cross(k, x, 0, -10, 64);
    });
    // her hand with the pencil, following the line
    const px = sx + (lerp(-30, 60, dr) + 30 * Math.sin(t * 9) * (1 - x)) * ss, py = sy + (lerp(-40, 40, dr) + (x > 0 ? 40 * x : 0)) * ss;
    c.save(); c.translate(px, py); c.rotate(0.6);
    c.fillStyle = '#ffd23f'; c.fillRect(-7, -120, 14, 110); c.fillStyle = '#2a2a33'; c.beginPath(); c.moveTo(-7, -10); c.lineTo(7, -10); c.lineTo(0, 8); c.closePath(); c.fill();
    c.restore();
    hand(c, px + 50, py - 70, 1.0, -2.4, 0.6, '#0d0a18', 'rgba(255,220,150,0.5)');
    const holes: Hole[] = [{ x: sx, y: sy, r: 560, soft: 0.6 }];
    const rr = this.rai(c, g, W * 0.85, H * 0.62, 118, { t, face: x > 0.5 ? 'sassy' : 'deadpan', arms: ['shrug', 'shrug'], tilt: 0.1 * Math.sin(t * 3), look: -0.9 });
    holes.push(rr.hole);
    dark(c, 0.4, holes);
    return mergePost(punch(t, [are], 0.03), { zoom: 1.02 + 0.02 * u });
  }

  /** W16: a gold coin glinting in the silt; she reaches; Rai wags a finger; the slate crosses out a coin on "shine". */
  w16(c: C2, g: C2, t: number, s0: number, s1: number): PostOverrides {
    const shine = this.w.shine!.start, u = clamp((t - s0) / (s1 - s0));
    withCam2(c, g, { zoom: 1.06 - 0.05 * u }, () => {
      murk(c, t, { floor: H * 0.62, seed: 27 });
      const cx = W * 0.5, cy = H * 0.72;
      goldCoin(c, g, cx, cy, 78, t, 1 + 0.6 * clamp((t - shine + 0.1) / 0.2) * (1 - clamp((t - shine - 0.3) / 0.3)));
      const reach = sm(s0, shine - 0.15, t) * (1 - sm(shine + 0.1, shine + 0.35, t));
      hand(c, lerp(W * 0.32, cx - 40, reach), lerp(H * 0.32, cy - 90, reach), 1.1, 2.4, 0.2, '#0d0a18', 'rgba(255,220,150,0.6)');
      const holes: Hole[] = [{ x: cx, y: cy, r: 330, soft: 0.7 }];
      const wag = t > s0 + 0.15 ? Math.sin(t * 16) : 0;
      const rr = this.rai(c, g, W * 0.8, H * 0.6, 118, { t, face: 'sassy', arms: ['hip', 'up'], tilt: 0.06 * wag, look: -0.7, marks: t > shine ? ['shine'] : [], markT0: shine });
      // the wagging finger: a little tick-tock of motion lines by her raised hand
      c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 4; c.lineCap = 'round';
      const hx = W * 0.8 + 1.2 * 118, hy = H * 0.6 - 1.95 * 118;
      for (const sd of [-1, 1]) { c.beginPath(); c.arc(hx, hy, 46, -PI / 2 + sd * 0.5 - 0.2, -PI / 2 + sd * 0.5 + 0.2); c.stroke(); }
      holes.push(rr.hole);
      // the slate, left foreground: the anchor already crossed; the coin drawn and crossed on "shine"
      slate(c, W * 0.15, H * 0.58, 1.15, 0.14, (k) => {
        this.anchorDoodle(k, 1, -40, -60, 0.9); this.cross(k, 1, -40, -60, 40);
        this.coinDoodle(k, sm(s0 + 0.05, shine - 0.08, t), 30, 50, 1.2);
        this.cross(k, sm(shine - 0.04, shine + 0.14, t), 30, 50, 44);
      });
      holes.push({ x: W * 0.15, y: H * 0.58, r: 260 });
      dark(c, 0.6, holes);
      snow(c, t, 40, 27, 1.4);
    });
    return punch(t, [shine], 0.03);
  }

  /** W17: her route on the slate, a gold tick on "voyage"; on "what could be lost" her hand closes over the pendant
   *  at her chest (Rai's little stone: what could be lost), it glows pink through her fingers, and Rai melts. */
  w17(c: C2, g: C2, t: number, s0: number, s1: number): PostOverrides {
    const wd = this.w, voy = wd.voyage!.start, what = wd.what!.start, lost = wd.lost!.start, u = clamp((t - s0) / (s1 - s0));
    let post: PostOverrides = {};
    withCam2(c, g, { zoom: 1.0 + 0.04 * u, x: 10 * u, y: -8 * u }, () => {
      murk(c, t, { floor: H * 0.95, seed: 31 });
      c.fillStyle = 'rgba(4,12,12,0.3)'; c.fillRect(0, 0, W, H);
      const sx = W * 0.47, sy = H * 0.55, ss = 1.3, srot = 0.04;
      const route = sm(voy - 0.12, voy + 0.3, t), tick = clamp((t - (voy + 0.32)) / 0.12);
      const cover = sm(what - 0.1, what + 0.14, t), shine = clamp((t - (lost - 0.06)) / 0.2);
      // Rai, right: sassy, then joy at the tick, then soft, then in love on "lost"
      const rx = W * 0.79, ry = H * 0.62, melt = t >= what - 0.05;
      const rr = this.rai(c, g, rx, ry, 150, {
        t, face: melt ? (t >= lost - 0.05 ? 'love' : 'soft') : tick > 0 ? 'joy' : 'sassy',
        arms: melt ? ['cheek', 'cheek'] : tick > 0 ? ['up', 'up'] : ['hip', 'hip'], armsFrom: melt ? ['up', 'up'] : ['hip', 'hip'],
        armsU: melt ? clamp((t - (what - 0.05)) / 0.14) : clamp(tick * 3),
        hop: tick > 0 && !melt ? 0.18 * Math.abs(Math.sin((t - voy) * 14)) : 0, blush: melt ? 0.6 : 0,
        marks: t >= lost - 0.05 ? ['hearts'] : tick > 0 && !melt ? ['sparkle'] : [], markT0: t >= lost - 0.05 ? lost - 0.05 : voy + 0.35, look: -0.8,
        heart: 0.4 + 0.6 * shine, heartColor: HEX.pink,
      }, 1);
      // the girl, close, left, her front arm holding out the slate, the pendant at her chest
      const gx = W * 0.2, gy = H * 1.12, gh = 1080, uu = gh / 100;
      const edge = { x: sx - 143, y: sy + 30 };
      const sh = { x: gx, y: gy - (19 + 18 + 29 - 3) * uu };
      const th = Math.atan2(edge.y - sh.y, edge.x - sh.x);
      const gpose: GirlPose = { rot: 0.02 * Math.sin(t * 1.4), hip: [0.15, -0.1], knee: [-0.35, -0.3], sh: [lerp(-0.25, 0.2, cover), aim(th) - 0.08], el: [lerp(0.45, 2.8, cover), 0.08], head: 0.05 + 0.2 * cover };
      const ga = girl(c, gx, gy, gh, gpose, { ...GIRL, t, glint: shine > 0.3 ? 'spark' : cover > 0.5 ? 'droop' : t > voy + 0.3 ? 'spark' : 'plain', slate: false, rim: 'rgba(255,220,150,0.65)' });
      slate(c, sx, sy, ss, srot, (k) => {
        this.anchorDoodle(k, 1, -70, -92, 0.45); this.cross(k, 1, -70, -92, 20);
        this.coinDoodle(k, 1, -20, -92, 0.55); this.cross(k, 1, -20, -92, 20);
        // the jetty (posts and planks) and the hut with its lit window
        pencil(k, [[-96, -30], [-50, -30]], 1, '#2a2a33', 4); for (let p = 0; p < 4; p++) pencil(k, [[-92 + p * 13, -30], [-92 + p * 13, -10]], 1, '#2a2a33', 3);
        pencil(k, [[-92, -48], [-80, -62], [-68, -48], [-92, -48]], 1, '#2a2a33', 3); k.fillStyle = '#e8b23a'; k.fillRect(-83, -47, 6, 6);
        for (let w = 0; w < 3; w++) pencil(k, [[-30 + w * 30, -36], [-22 + w * 30, -42], [-14 + w * 30, -36]], 1, '#2a2a33', 2.5);
        pencil(k, [[-20, 40], [-10, 26], [0, 40], [10, 24], [20, 40]], 1, '#2a2a33', 3);
        pencil(k, [[30, 0], [38, -6], [46, 2], [54, -6], [62, 0]], 1, '#2a2a33', 3);
        pencil(k, [[48, 70], [60, 54], [96, 52], [96, 70], [48, 70]], 1, '#2a2a33', 3.5); pencil(k, [[80, 52], [80, 40]], 1, '#2a2a33', 3);
        k.font = font(FAM.monoB(), 13); k.fillStyle = 'rgba(42,42,51,0.8)'; k.textAlign = 'center'; k.fillText('ME', -78, 0); k.fillText('HERE', 72, 90);
        const pts: [number, number][] = [];
        for (let i = 0; i <= 40; i++) { const v = i / 40; pts.push([-60 + 130 * v + 20 * Math.sin(v * 7), -20 + 80 * v - 30 * Math.sin(v * 3.2)]); }
        const n = Math.floor(route * 40);
        k.fillStyle = '#2a2a33';
        for (let i = 0; i <= n; i += 2) { k.beginPath(); k.arc(pts[i]![0], pts[i]![1], 3.2, 0, TAU); k.fill(); }
        if (tick > 0) {
          k.save(); k.translate(60, -50); const kk = 1 + 0.6 * (1 - ease.outBack(tick)); k.scale(kk, kk);
          pencil(k, [[-30, 0], [-8, 26], [36, -34]], clamp(tick * 1.2), '#e0a020', 14);
          k.restore();
        }
      });
      if (tick > 0) {
        const tx = sx + 60 * ss, ty = sy - 50 * ss;
        const gl = g.createRadialGradient(tx, ty, 0, tx, ty, 180);
        gl.addColorStop(0, rgbaHex(HEX.gold, 0.5 * tick)); gl.addColorStop(1, rgbaHex(HEX.gold, 0));
        g.fillStyle = gl; g.fillRect(tx - 180, ty - 180, 360, 360);
        const fade = 1 - clamp((t - voy - 0.45) / 0.5);
        for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU + t; star4(c, tx + Math.cos(a) * 130 * tick, ty + Math.sin(a) * 100 * tick, 16 * fade, '#fff2b0'); }
      }
      hand(c, edge.x + 4, edge.y - 6, 0.62, 1.95, 1, '#0d0a18', 'rgba(255,220,150,0.6)');
      // her other hand closes over the pendant; the pink shows through her fingers
      const pd = ga.pendant!;
      const pr = 30 + 30 * shine * (0.85 + 0.15 * Math.sin(t * 9));
      const pg = g.createRadialGradient(pd.x, pd.y, 0, pd.x, pd.y, pr * 2.4);
      pg.addColorStop(0, rgbaHex(HEX.pink, 0.4 + 0.4 * shine)); pg.addColorStop(1, rgbaHex(HEX.pink, 0));
      g.fillStyle = pg; g.fillRect(pd.x - pr * 2.4, pd.y - pr * 2.4, pr * 4.8, pr * 4.8);
      if (cover > 0) hand(c, lerp(pd.x - 60, pd.x + 4, cover), lerp(pd.y + 260, pd.y + 16, cover), 0.5, 0.55, 1, '#0d0a18', rgbaHex(HEX.pink, 0.4 + 0.5 * shine));
      if (shine > 0 && shine < 1) for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU + 0.4; star4(c, pd.x + Math.cos(a) * 70 * shine, pd.y + Math.sin(a) * 60 * shine, 14 * (1 - shine), '#ffd6ea'); }
      dark(c, 0.4, [{ x: W * 0.5, y: H * 0.5, r: 1000, soft: 0.8 }, rr.hole]);
      post = mergePost(punch(t, [voy + 0.32], 0.03), caKick(t, [voy + 0.32], 2.5, 0.2));
    });
    snow(c, t, 40, 31, 1.6);
    return post;
  }
}
