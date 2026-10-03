// SINKING (12.83-29.70, Coprime's prologue: the organ's chord, the storm, the comma pump, under). Four shots:
//   1 12.83-14.54 THE TITLE: the rings have fused into the gold harmonograph on the chord; the title slams in (a
//     punch) over the night sea while the storm bank swallows the moon, wind and rain rising; the navigator sees it.
//   2 14.54-15.40 THE STORM (cut on the thunder, inside the flash): close on the raft; lightning, a thunderclap shake;
//     a wave lifts the raft, the crew cry out, the stone rolls off the low side into black water (its roll is the
//     pump's first quarter-turn); the title's words fall into the sea with her.
//   3 15.40-21.40 THE DESCENT (cut on the pump's second chord): she falls through the layers of the sea, spiralling a
//     quarter-turn on every chord change (two laps), a ring pinging out from her on each: the surface flickering
//     with the storm; open water with fish schools and the shark, which does a double take; the reef, its walls
//     closing in with coral and reeds; the dark with its specks of light; and a mono gauge counting the pump's laps
//     in cents.
//   4 21.40-29.70 THE REST: she lands on the seabed on the rest chord (a sand puff, a ring across the sand). The
//     seabed is the cartoon one, with its clues: a half-buried other stone (she is not the only one) and the anchor
//     (the trader to come). Then the years pass in a time-lapse: days and nights flicker by, fish and the shark zip
//     past, barnacles pop onto her one by one (into Rai's own pattern), sand drifts up, reeds grow beside her, a
//     starfish crawls over and climbs to her crown (where Rai wears it); a mono counter runs up the years. Then the
//     last night falls, in the final 1.5 s, for two eyes to open in `hello`.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { HEX } from '../engine/palette';
import { font } from '../engine/type';
import { clamp, ease, keys, lerp, pulse, smoothstep } from '../engine/util';
import { h01 } from './_rai';
import { FAM, TAU, gradientV, rgbaHex, slam, stone } from './_motifs';
import { seabedFront } from './_world';
import { caKick, hitShake, mergePost, punch } from './_post';
import {
  BEAT, DECK, HOLE, Rhythm, STONE_R, SUMMIT, WL, applyCam, knot, nightCam, nightWorld, stoneSil, stormAt,
  titleWords, vessel, wind, type Cam,
} from './voyage-world';
import {
  BARNACLE_SPOTS, FLOOR, REST, TL0, barnacle, descent, passingShark, restBed, restReeds, sandDrift, starfish, tlOf,
  waterAt, yearsOf,
} from './sinking-deep';

/** The pump's chord changes: C[0] the thunder (14.54) .. C[8] the rest chord (21.40). */
const C = Array.from({ length: 9 }, (_, k) => SUMMIT + 4 * BEAT + k * 2 * BEAT);
const CH = 2 * BEAT;
/** The spiral: a quarter-turn kicked off on each chord change, two laps in all. */
const turn = (t: number) => C.slice(0, 8).reduce((a, ck) => a + ease.outCubic(clamp((t - ck) / CH)), 0) * (Math.PI / 2);
const spiralX = (t: number) => 960 + 290 * Math.sin(turn(t));
const T_SPLASH = 15.29;
const D0 = 150, V_SINK = 330;
/** The stone's depth below the surface (px), from the cut under water to the rest. */
const depth = (t: number) => {
  const u = Math.min(t, C[8]!) - C[1]!;
  return D0 + V_SINK * Math.max(0, u) + 260 * (1 - Math.exp(-Math.max(0, u) / 0.22)) + 6 * smoothstep(C[8]!, C[8]! + 0.6, t);
};
const D_REST = depth(C[8]! + 1);
/** Where the stone is on screen (y) while the camera follows her down. */
const followY = (t: number) => keys(t, [[C[1]!, 230], [16.2, 470, ease.outCubic], [C[8]! - 1.0, 470], [C[8]!, REST.y, ease.inOutCubic]]);
/** The final night: the frame goes dark only in the plate's last 1.5 s. */
const NIGHT0 = 28.2;

export default class Sinking extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  F = new Layer2D();
  rh = new Rhythm();
  bolt: [number, number][][] = [];
  pops: number[] = [];

  override init() {
    // the lightning: a jagged trunk from the cloud to the sea, two branches (screen px, shot 2)
    const trunk: [number, number][] = [[1470, -30]];
    while (trunk[trunk.length - 1]![1] < 690) {
      const [x, y] = trunk[trunk.length - 1]!, k = trunk.length;
      trunk.push([x + (h01(k, 701) - 0.42) * 70, y + 30 + 30 * h01(k, 702)]);
    }
    this.bolt.push(trunk);
    for (const [from, dir, seed] of [[5, -1, 710], [11, 1, 720]] as const) {
      const br: [number, number][] = [trunk[from]!];
      for (let k = 0; k < 7; k++) { const [x, y] = br[br.length - 1]!; br.push([x + dir * (12 + 30 * h01(k, seed)), y + 20 + 26 * h01(k, seed + 1)]); }
      this.bolt.push(br);
    }
    // when each barnacle settles on her during the years
    this.pops = BARNACLE_SPOTS.map((_, i) => 22.5 + 5.2 * h01(i, 791));
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const t = f.t;
    this.L.clear(HEX.ink); this.G.clear(); this.F.clear();
    let post: PostOverrides;
    if (t < C[0]!) post = this.title(t);
    else if (t < C[1]!) post = this.storm(t);
    else post = this.deep(t);
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    comp.draw(renderer, this.F.upload(), out);
    return post;
  }

  // ---------------------------------------------------------------- 1: the title
  title(t: number): PostOverrides {
    const c = this.L.ctx, g = this.G.ctx, q = this.F.ctx, rh = this.rh, storm = stormAt(t);
    const cam = nightCam(SUMMIT);
    cam.s += 0.03 * (t - SUMMIT);
    const more = smoothstep(SUMMIT, C[0]!, t); // continuous with voyage's last frame, then wilder
    const bob = 4 * Math.sin(t * 1.3) * (1 + 2 * storm);
    applyCam(c, cam); applyCam(g, cam); applyCam(q, cam);
    nightWorld(c, g, t, rh, { storm, starStorm: storm * (0.6 + 0.4 * more), rough: 0.12 + 0.5 * storm + 0.3 * more, moon: 1 - 0.55 * smoothstep(13.2, 14.5, t), bank: 1 + 0.4 * more, bob });
    // the harmonograph glows on the chord, behind and in front of the raft
    const bloom = pulse(t, SUMMIT, 0.25);
    g.save(); g.globalAlpha = 0.45 + 0.25 * bloom;
    const halo = g.createRadialGradient(HOLE.x, HOLE.y, 50, HOLE.x, HOLE.y, 420);
    halo.addColorStop(0, rgbaHex(HEX.gold, 0.16)); halo.addColorStop(1, rgbaHex(HEX.gold, 0));
    g.fillStyle = halo; g.fillRect(HOLE.x - 420, HOLE.y - 420, 840, 840); g.restore();
    const hard = t < SUMMIT + 3 * BEAT; // the wood blocks ring on (now a chord) for three beats
    vessel(q, t, {
      strokes: [0, 1, 2].map((i) => (hard ? (t * 3.6 + i * 0.31) % 1 : null)), bob, tilt: 0.012 * Math.sin(t * 0.9) * (1 + 3 * storm),
      navigator: { pose: 'point', emote: '!', emoteT0: 13.95, headTilt: -0.35 },
    });
    knot(q, g, 1, 5);
    q.setTransform(1, 0, 0, 1, 0, 0);
    this.rain(q, t, smoothstep(13.4, 14.4, t) * 0.7);
    wind(q, t, 0.6 + 0.4 * storm);
    // a dark band under the title, then the title
    gradientV(q, 'rgba(6,4,11,0)', 'rgba(6,4,11,0.78)', 0, 730, W, H - 730);
    titleWords(q).forEach((w, j) => slam(q, w.w, w.x, w.y, w.size, t, SUMMIT + 0.05 * j, { fam: w.fam, col: w.col, shadow: j < 4 ? HEX.deep : '#5a3a10', shadowOff: 0.05 }));
    return mergePost({ bloom: 0.9 + 0.3 * bloom, vignette: 0.5 }, punch(t, [SUMMIT, SUMMIT + 0.2], 0.022, 0.4));
  }

  // ---------------------------------------------------------------- 2: the storm, the stone lost
  storm(t: number): PostOverrides {
    const c = this.L.ctx, g = this.G.ctx, q = this.F.ctx, rh = this.rh;
    const a0 = t - C[0]!;
    // the flash: two strikes, each 2-3 frames
    const fl = (a0 < 0.05 ? 1.1 : 0) + (a0 >= 0.2 && a0 < 0.235 ? 0.7 : 0) + (a0 >= 0.5 && a0 < 0.52 ? 0.3 : 0);
    const lit = clamp(Math.pow(0.5, a0 / 0.06) + 0.7 * (a0 > 0.2 ? Math.pow(0.5, (a0 - 0.2) / 0.05) : 0));
    const cam: Cam = { s: 1.55, cx: 960, cy: 640, fx: 960, fy: 610 };
    applyCam(c, cam); applyCam(g, cam);
    nightWorld(c, g, t, rh, { storm: 1.15, starStorm: 1, rough: 1, moon: 0.3, bank: 1.4, lit });
    // the wave that lifts the raft
    const lift = ease.outCubic(clamp((a0 - 0.02) / 0.4)), relief = ease.outCubic(clamp((t - 15.22) / 0.5));
    const tilt = 0.42 * lift - 0.28 * relief;
    c.fillStyle = '#0d0920';
    c.beginPath(); c.moveTo(1000, WL + 40);
    c.quadraticCurveTo(1280, WL - 40 - 140 * lift, 1520, WL - 30 - 150 * lift);
    c.quadraticCurveTo(1700, WL - 40 - 120 * lift, 1900, WL + 40); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(220,240,255,0.55)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(1220, WL - 40 - 110 * lift); c.quadraticCurveTo(1500, WL - 40 - 170 * lift, 1760, WL - 50 - 90 * lift); c.stroke();
    // the raft, and the stone rolling off its low side; the crew cry out
    applyCam(q, cam);
    const s = -850 * Math.max(0, t - 14.68) ** 2;
    const onDeck = s > -300;
    vessel(q, t, {
      tilt, stone: onDeck, slide: s, roll: s / STONE_R, bob: -10 * lift,
      figures: [
        { pose: 'face', emote: '!', emoteT0: C[0]! + 0.06 },
        { pose: 'point', flip: true, emote: '!', emoteT0: C[0]! + 0.12 },
        { pose: 'hands', emote: '!', emoteT0: C[0]! + 0.18 },
      ],
      navigator: t < 15.1 ? { pose: 'hands', emote: '!', emoteT0: C[0]! + 0.1 } : { pose: 'face', emote: 'tears', emoteT0: 15.1 },
    });
    if (!onDeck) { // off the deck: the same line, now falling
      const ct = Math.cos(tilt), st = Math.sin(tilt);
      const dx = s, dy = -STONE_R;
      const x = 960 + dx * ct + dy * st, y = DECK - dx * st + dy * ct + 600 * Math.max(0, t - 15.2) ** 2;
      stoneSil(q, x, y, STONE_R, { rot: s / STONE_R, rim: 0.4 + lit });
    }
    // the near water closes over whatever is below the line
    q.fillStyle = '#0b0718';
    q.beginPath(); q.moveTo(0, WL + 4);
    for (let x = 0; x <= W; x += 40) q.lineTo(x, WL + 4 + 10 * Math.sin(x * 0.01 + t * 5) + (x < 900 ? 10 * lift : 0));
    q.lineTo(W, H + 300); q.lineTo(0, H + 300); q.closePath(); q.fill();
    // the splash
    const sa = t - T_SPLASH;
    if (sa > 0) {
      // where she meets the water: her centre then (the same line she rolled down)
      const ss = -850 * (T_SPLASH - 14.68) ** 2, tt = 0.42 - 0.28 * ease.outCubic(clamp((T_SPLASH - 15.22) / 0.5));
      const sx = 960 + ss * Math.cos(tt) - STONE_R * Math.sin(tt);
      for (let d = 0; d < 90; d++) {
        const side = d % 2 ? 1 : -1, vx = side * (120 + 520 * h01(d, 731)), vy = -(300 + 800 * h01(d, 732));
        const x = sx + side * STONE_R * 0.7 + vx * sa, y = WL + vy * sa + 1800 * sa * sa;
        if (y > WL + 10) continue;
        q.fillStyle = 'rgba(230,246,255,0.85)';
        q.beginPath(); q.arc(x, y, 3 + 5 * h01(d, 733), 0, TAU); q.fill();
      }
    }
    q.setTransform(1, 0, 0, 1, 0, 0);
    this.rain(q, t, 1);
    wind(q, t, 1);
    // the bolt
    const boltOn = a0 < 0.12 || (a0 > 0.19 && a0 < 0.27);
    if (boltOn) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      for (const [lw, col] of [[16, 'rgba(198,92,240,0.5)'], [7, 'rgba(220,210,255,0.9)'], [2.5, '#ffffff']] as const) {
        g.strokeStyle = col; g.lineWidth = lw; g.lineJoin = 'round'; g.lineCap = 'round';
        for (const [bi, br] of this.bolt.entries()) {
          g.globalAlpha = bi === 0 ? 1 : 0.6;
          g.beginPath(); br.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
        }
      }
      g.globalAlpha = 1;
    }
    // the title's words fall into the sea with her
    titleWords(q).forEach((w, j) => {
      const t0 = 14.78 + 0.045 * j + 0.03 * h01(j, 741), a = Math.max(0, t - t0);
      const y = w.y + 2400 * a * a, rot = (h01(j, 742) - 0.5) * 2.4 * a;
      if (y > H + 200) return;
      q.save(); q.translate(w.x, y); q.rotate(rot);
      q.font = font(w.fam, w.size); q.textAlign = 'center'; q.textBaseline = 'middle';
      q.fillStyle = w.col; q.fillText(w.w, 0, 0); q.restore();
    });
    return mergePost({ bloom: 0.9, flash: fl, vignette: 0.55 }, hitShake(t, [C[0]!], 8, 0.5), caKick(t, [C[0]!], 5, 0.3));
  }

  rain(q: CanvasRenderingContext2D, t: number, a: number) {
    if (a <= 0) return;
    q.strokeStyle = `rgba(200,210,255,${0.28 * a})`; q.lineWidth = 1.3;
    q.beginPath();
    for (let i = 0; i < 160; i++) {
      const x = ((h01(i, 751) * (W + 400) - t * 500) % (W + 400) + W + 400) % (W + 400) - 200;
      const y = ((h01(i, 752) * (H + 200) + t * 1900) % (H + 200)) - 100;
      q.moveTo(x, y); q.lineTo(x - 22, y + 70);
    }
    q.stroke();
  }

  // ---------------------------------------------------------------- 3 + 4: down through the sea, then the years
  deep(t: number): PostOverrides {
    const c = this.L.ctx, g = this.G.ctx, q = this.F.ctx;
    const ds = depth(t), ys = followY(t), th = turn(t), tl = tlOf(t), years = yearsOf(t);
    const atRest = t >= C[8]!;
    c.setTransform(1, 0, 0, 1, 0, 0); g.setTransform(1, 0, 0, 1, 0, 0);
    // the layers of the sea (until the seabed has taken the whole frame)
    if (t < C[8]! + 0.7) descent(c, g, t, ds, ys);
    // the seabed rising into view: its floor first, blended into the deep water, then all of it as the dust settles
    const dy = ys - REST.y + D_REST - ds;
    if (dy < H) {
      const full = smoothstep(C[8]! - 0.3, C[8]! + 0.7, t);
      if (full < 1) {
        const y0 = FLOOR - 330 + dy;
        c.save(); c.beginPath(); c.rect(0, y0, W, H - y0 + 10); c.clip(); c.translate(0, dy); restBed(c, tl); c.restore();
        const bg = c.createLinearGradient(0, y0, 0, y0 + 200);
        const wc = waterAt(ds - ys + y0).match(/\d+/g)!;
        bg.addColorStop(0, `rgba(${wc[0]},${wc[1]},${wc[2]},1)`); bg.addColorStop(1, `rgba(${wc[0]},${wc[1]},${wc[2]},0)`);
        c.fillStyle = bg; c.fillRect(0, y0 - 2, W, 202);
      }
      if (full > 0) { c.save(); c.globalAlpha = full; c.translate(0, dy); restBed(c, tl); c.restore(); }
    }
    // the years: reeds grow up beside her
    if (atRest) restReeds(c, tl, years);
    // the shark passes close in open water and does a double take
    passingShark(c, t, ds, ys, 16.3, 18.7, 1060, spiralX(t));
    // the stone, on her spiral (and her wake, and her bubbles)
    const x = spiralX(t), zf = Math.cos(th), r = 125 * (1 + 0.2 * zf);
    const sq = 0.8 + 0.2 * Math.abs(zf), roll = -0.3 * Math.sin(th) * (atRest ? 0 : 1);
    if (t < C[8]! + 1.5) {
      c.save();
      c.strokeStyle = rgbaHex('#dff8ff', 0.35 * (1 - smoothstep(C[8]!, C[8]! + 1.5, t)));
      c.lineWidth = 2; c.setLineDash([3, 9]);
      c.beginPath();
      for (let k = 0; k <= 60; k++) {
        const tp = Math.max(C[1]!, t - k * 0.04);
        const px = spiralX(tp), py = ys + depth(tp) - ds;
        if (k === 0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.stroke(); c.restore();
    }
    this.bubbleStream(c, t, ds, ys);
    const shadeD = clamp((ds - 1500) / 1000) * (1 - smoothstep(C[8]! - 0.3, C[8]! + 0.7, t));
    c.save(); c.translate(x, ys); c.scale(sq, 1);
    stone(c, 0, 0, r, { tilt: roll, seed: 7 });
    const dark = Math.max(zf < 0 ? -0.45 * zf : 0, 0.55 * shadeD);
    if (dark > 0) { c.fillStyle = `rgba(8,20,52,${dark})`; c.beginPath(); c.arc(0, 0, r * 1.02, 0, TAU); c.fill(); }
    c.restore();
    // the years on her: barnacles in Rai's own pattern, a starfish climbing to her crown, sand drifting up
    if (atRest) {
      BARNACLE_SPOTS.forEach(([bx, by, bs], i) => barnacle(c, REST.x + bx * REST.r * 0.94, REST.y + by * REST.r, bs * REST.r, (t - this.pops[i]!) / 0.25));
      this.starfishPath(c, t, tl);
      sandDrift(c, years);
      this.landing(c, t);
    }
    // the near layer of the seabed passes in front
    if (dy < 200) { c.save(); c.translate(0, Math.max(0, dy)); seabedFront(c, tl, { floor: FLOOR }); c.restore(); }
    // day and night flicker by in the time-lapse, then the last night falls
    const cycle = years > 0 && t < NIGHT0 + 0.5 ? 0.42 * (0.5 - 0.5 * Math.cos((TAU * (tl - TL0)) / 13)) * smoothstep(22.3, 23.2, t) * (1 - smoothstep(27.6, 28.4, t)) : 0;
    const night = ease.inQuad(smoothstep(NIGHT0, 29.7, t)) * 0.985;
    const shade = Math.max(cycle, night);
    if (shade > 0) { c.fillStyle = `rgba(4,8,22,${shade})`; c.fillRect(0, 0, W, H); }
    // a ring pings out from her on every chord change (the rest's runs along the sand)
    for (let k = 1; k <= 8; k++) {
      const a = t - C[k]!;
      if (a < 0 || a > 1.6) continue;
      const u = a / 1.6, rr = r + 30 + 220 * ease.outCubic(u);
      g.strokeStyle = rgbaHex(HEX.cyan, 0.32 * (1 - u));
      g.lineWidth = 3;
      g.beginPath();
      if (k < 8) g.arc(x, ys, rr, 0, TAU); else g.ellipse(REST.x, REST.y + REST.r - 4, rr * 1.5, rr * 0.22, 0, 0, TAU);
      g.stroke();
    }
    q.setTransform(1, 0, 0, 1, 0, 0);
    this.gauge(q, t);
    this.counter(q, t, years);
    return { bloom: 0.75, vignette: 0.5 + 0.2 * clamp(ds / D_REST) };
  }

  /** The landing on the rest chord: sand thrown up and settling. */
  landing(c: CanvasRenderingContext2D, t: number) {
    const a = t - C[8]!;
    if (a > 3.5) return;
    for (let k = 0; k < 70; k++) {
      const side = h01(k, 761) < 0.5 ? -1 : 1, sp = 120 + 380 * h01(k, 762);
      const dist = sp * (1 - Math.exp(-a / 0.5)) * 0.5;
      const px = REST.x + side * (40 + dist + 90 * h01(k, 763)), py = REST.y + REST.r - 6 - (70 * h01(k, 764)) * (1 - Math.exp(-a / 0.4)) + 30 * smoothstep(0.6, 3, a);
      c.fillStyle = `rgba(240,222,170,${0.6 * (1 - smoothstep(0.5, 3.5, a))})`;
      c.beginPath(); c.arc(px, py, 3 + 9 * h01(k, 765) * (0.5 + a * 0.3), 0, TAU); c.fill();
    }
  }

  /** A starfish crawls across the sand to her and climbs to her crown (Rai wears it there in `hello`). */
  starfishPath(c: CanvasRenderingContext2D, t: number, tl: number) {
    const s = 16;
    if (t < 22.7) return;
    if (t < 25.0) {
      const u = ease.inOutQuad((t - 22.7) / 2.3);
      starfish(c, lerp(1480, REST.x + 150, u), lerp(FLOOR + 70, REST.y + REST.r - 4, u), s, 0.4 * Math.sin(tl * 2), tl);
    } else {
      const u = ease.inOutQuad(clamp((t - 25.0) / 2.3)), a = lerp(0.42, -Math.PI / 2, u), rr = REST.r + 4;
      starfish(c, REST.x + Math.cos(a) * rr * 0.94, REST.y + Math.sin(a) * rr, s, a + Math.PI / 2, tl);
    }
  }

  /** Bubbles leave her hole as she sinks (world-tracked: they rise while the camera falls). */
  bubbleStream(c: CanvasRenderingContext2D, t: number, ds: number, ys: number) {
    c.lineWidth = 1.8;
    // the plunge: a burst of air dragged under with her
    const pa = t - C[1]!;
    if (pa < 2.2) {
      const x0 = spiralX(C[1]!);
      for (let i = 0; i < 90; i++) {
        const a0 = h01(i, 781) * TAU, r0 = 30 + 170 * Math.sqrt(h01(i, 782));
        const vb = 220 + 260 * h01(i, 783);
        const yy = ys + (depth(C[1]!) + Math.sin(a0) * r0 - vb * pa) - ds, xx = x0 + Math.cos(a0) * r0 * 1.3 + 14 * Math.sin(pa * 6 + i);
        if (yy < -30 || yy > H + 30) continue;
        const rb = 2 + 14 * h01(i, 784) ** 2;
        c.strokeStyle = `rgba(230,252,255,${0.8 * (1 - pa / 2.2)})`;
        c.beginPath(); c.arc(xx, yy, rb, 0, TAU); c.stroke();
      }
    }
    const emitEnd = C[8]! + 3;
    for (let i = 0; i < 260; i++) {
      const te = C[1]! - 0.05 + i * 0.045 * (i < 40 ? 0.35 : 1) + 0.02 * h01(i, 771);
      if (te > t || te > emitEnd) break;
      const age = t - te;
      if (age > 2.6) continue;
      if (te > C[8]! && h01(i, 776) < 0.75) continue; // after the rest only a few
      const xE = spiralX(te) + (h01(i, 772) - 0.5) * 60;
      const dE = depth(te) - 20;
      const vb = 240 + 160 * h01(i, 773);
      const yy = ys + (dE - vb * age - 40 * age * age) - ds;
      const xx = xE + 16 * Math.sin(age * 5 + i);
      if (yy < -30 || yy > H + 30) continue;
      const rb = 3 + 10 * h01(i, 774);
      c.strokeStyle = `rgba(220,248,255,${0.7 * (1 - age / 2.6)})`;
      c.beginPath(); c.arc(xx, yy, rb, 0, TAU); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.5)';
      c.beginPath(); c.arc(xx - rb * 0.35, yy - rb * 0.35, rb * 0.2, 0, TAU); c.fill();
    }
  }

  /** The pump's depth gauge: a tick per chord, the laps in cents (each lap lands a comma, 21.5 cents, lower). */
  gauge(q: CanvasRenderingContext2D, t: number) {
    const a = smoothstep(15.7, 16.3, t) * (1 - smoothstep(22.0, 22.6, t));
    if (a <= 0) return;
    const x = 1740, y0 = 250, y1 = 640;
    q.save(); q.globalAlpha = a;
    q.fillStyle = 'rgba(6,12,30,0.45)'; q.beginPath(); q.roundRect(x - 150, y0 - 70, 196, y1 - y0 + 110, 14); q.fill();
    q.strokeStyle = rgbaHex(HEX.bone, 0.4); q.lineWidth = 2;
    q.beginPath(); q.moveTo(x, y0); q.lineTo(x, y1); q.stroke();
    q.font = font(FAM.mono(), 20); q.textBaseline = 'middle';
    for (let k = 0; k <= 8; k++) {
      const y = lerp(y0, y1, k / 8), major = k % 4 === 0;
      q.strokeStyle = rgbaHex(HEX.bone, major ? 0.8 : 0.4);
      q.beginPath(); q.moveTo(x - (major ? 18 : 9), y); q.lineTo(x, y); q.stroke();
      if (major) { q.textAlign = 'right'; q.fillStyle = rgbaHex(HEX.bone, 0.85); q.fillText(['0 ¢', '−21.5 ¢', '−43.0 ¢'][k / 4]!, x - 28, y); }
    }
    q.textAlign = 'right'; q.fillStyle = rgbaHex(HEX.cyan, 0.9); q.font = font(FAM.monoB(), 18);
    q.fillText('COMMA PUMP', x + 30, y0 - 40);
    const k = C.reduce((acc, ck, i) => acc + (i > 0 ? ease.outCubic(clamp((t - ck) / 0.3)) : 0), 0);
    const y = lerp(y0, y1, k / 8);
    q.fillStyle = HEX.cyan;
    q.beginPath(); q.moveTo(x + 6, y); q.lineTo(x + 22, y - 9); q.lineTo(x + 22, y + 9); q.closePath(); q.fill();
    q.restore();
  }

  /** The years on the seabed, counting up through the time-lapse (an invented number, in the machines' voice). */
  counter(q: CanvasRenderingContext2D, t: number, years: number) {
    const a = smoothstep(22.3, 22.8, t) * (1 - smoothstep(NIGHT0, NIGHT0 + 0.6, t));
    if (a <= 0) return;
    const n = Math.round(117 * ease.inOutQuad(years));
    q.save(); q.globalAlpha = a;
    q.fillStyle = 'rgba(6,12,30,0.5)'; q.beginPath(); q.roundRect(W - 420, 120, 330, 120, 14); q.fill();
    q.textAlign = 'right'; q.textBaseline = 'alphabetic';
    q.font = font(FAM.monoB(), 18); q.fillStyle = rgbaHex(HEX.cyan, 0.9);
    q.fillText('YEARS ON THE SEABED', W - 116, 158);
    q.font = font(FAM.monoB(), 64); q.fillStyle = HEX.bone;
    q.fillText(String(n), W - 116, 222);
    q.restore();
  }
}
