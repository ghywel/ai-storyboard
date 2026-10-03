// PRE-CHORUS 1 (lines 10-13, sung): "'Cause I was never really stone, / I'm the story that you keep; / I'm worth
// exactly what you say, / so what are you saying about me?" One continuous shot on the seabed at dusk (a sung build
// after the verse's cuts), its light changing on the downbeats:
//   10 Rai, soft and sincere, beside a driftwood sign staked in the sand ("LIMESTONE · 1 PIECE"). On "never" she
//      looks down at herself as her outline breaks into particles, outside in, many of them little words (the
//      island's sayings about her); on "stone" the sign's LIMESTONE is struck out.
//   11 the particles pour into STORY above the sand; on "keep" the keepers' canoes slide in on the surface overhead,
//      paddles dipping: the people who keep the story.
//   12 on "worth" STORY snaps into a gold WORTH; on "what you say" WORTH morphs back into STORY and speech bubbles
//      drift down from the canoes.
//   13 "so what are you saying about me?": the particles part into a big question mark (right) and her own line
//      drawing (left), exactly where chorus 1 opens on her; the seabed gives way to the chorus's cyan sunburst, sand
//      and reeds, and she comes back solid for a knowing wink: the match cut.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { HEX } from '../engine/palette';
import { font } from '../engine/type';
import type { Line } from '../engine/lyrics';
import { clamp, ease, lerp } from '../engine/util';
import { drawRai, h01 } from './_rai';
import { FAM, TAU, halftone, karaoke, rgbaHex, sunburst, textPointsAt } from './_motifs';
import { reed, seabed, seabedFront } from './_world';
import { band, beatPh, speech, wordOf } from './verse1-kit';

type P = [number, number];
const N = 2400;
const TINY = ['we know', "she's", 'down there', 'land', 'feud', 'wedding', 'believe', 'remember', 'keep', 'stone', 'sea', 'agree', 'trust', 'yes', 'ours', 'still', 'enough', 'home'];
// where she stands now, and where chorus 1 opens on her (chorus.ts: drawRai at W*0.34, H*0.6, R 165)
const R0 = { x: W * 0.5, y: H * 0.52, r: 165 };
const R1 = { x: W * 0.34, y: H * 0.6, r: 165 };

/** Sample n points (and their colours) from Rai drawn at (x, y, R); `edges` keeps only her line drawing. */
function raiPoints(x: number, y: number, R: number, n: number, seed: number, face: 'soft' | 'joy', edges = false): { p: P[]; col: string[] } {
  const oc = new OffscreenCanvas(W, H), g = oc.getContext('2d')! as unknown as CanvasRenderingContext2D;
  drawRai(g, x, y, R, { t: 0.5, face, glow: 'rgba(0,0,0,0)', glowStrength: 0, noBlink: true, arms: ['down', 'down'] });
  const d = (g as unknown as OffscreenCanvasRenderingContext2D).getImageData(0, 0, W, H).data;
  const lum = (k: number) => 0.3 * d[k]! + 0.59 * d[k + 1]! + 0.11 * d[k + 2]!;
  const ink: number[] = [], step = edges ? 2 : 3;
  for (let yy = 3; yy < H - 3; yy += step) for (let xx = 3; xx < W - 3; xx += step) {
    const k = (yy * W + xx) * 4;
    if (d[k + 3]! <= 160) continue;
    if (edges) { // the silhouette's edge, the hole, and the strong edges inside (eyes, mouth, starfish)
      const nb = [k + 12, k - 12, k + 12 * W, k - 12 * W];
      if (!nb.some((q) => d[q + 3]! < 60 || Math.abs(lum(q) - lum(k)) > 70)) continue;
    }
    ink.push(xx, yy);
  }
  const m = ink.length / 2, p: P[] = [], col: string[] = [];
  const q = (v: number) => Math.min(255, Math.round(v / 48) * 48); // colours quantised, so the particles batch
  for (let i = 0; i < n && m > 0; i++) {
    const k = Math.floor(h01(i, seed, 1) * m), px = ink[2 * k]!, py = ink[2 * k + 1]!, o = (py * W + px) * 4;
    p.push([px + h01(i, seed, 2) * 2, py + h01(i, seed, 3) * 2]);
    col.push(`rgb(${q(d[o]!)},${q(d[o + 1]!)},${q(d[o + 2]!)})`);
  }
  return { p, col };
}

export default class Pre1 extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  lines: Line[] = [];
  show: number[] = [];
  rai0 = { p: [] as P[], col: [] as string[] };
  rai1 = { p: [] as P[], col: [] as string[] };
  story: P[] = []; worth: P[] = []; q: P[] = [];
  dist: number[] = []; maxD = 1;
  T: Record<string, number> = {};
  C0: P = [R0.x, R0.y - 0.5 * R0.r];

  override init() {
    const { lyrics, audio: au, start, end } = this.ctx;
    this.lines = lyrics.lines.filter((l) => l.words[0]!.start >= start - 0.1 && l.words[0]!.start < end).slice(0, 4);
    const [l10, l11, l12, l13] = this.lines as [Line, Line, Line, Line];
    // a line shows 0.4 s early, but never while the previous line is still being sung
    this.show = this.lines.map((l, i) => Math.min(l.words[0]!.start, Math.max(l.words[0]!.start - 0.4, i ? this.lines[i - 1]!.end : -1e9)));
    this.rai0 = raiPoints(R0.x, R0.y, R0.r, N, 11, 'soft');
    this.rai1 = raiPoints(R1.x, R1.y, R1.r, N, 12, 'joy', true);
    this.story = textPointsAt('STORY', FAM.hook(), 300, W / 2, H * 0.38, N, 5);
    this.worth = textPointsAt('WORTH', FAM.hook(), 300, W / 2, H * 0.38, N, 6);
    this.q = textPointsAt('?', FAM.hook(), 620, W * 0.72, H * 0.42, N, 7);
    this.dist = this.rai0.p.map(([x, y]) => Math.hypot(x - this.C0[0], y - this.C0[1]));
    this.maxD = Math.max(...this.dist);
    const w = (l: Line, re: RegExp) => wordOf(l, re);
    this.T = {
      never: w(l10, /never/).start, stone: w(l10, /stone/).start, stoneEnd: w(l10, /stone/).end,
      story: w(l11, /story/).start, keep: w(l11, /keep/).start,
      worth: w(l12, /worth/).start, what: w(l12, /what/).start, say: w(l12, /say/).start, sayEnd: w(l12, /say/).end,
      so: l13.words[0]!.start, saying: w(l13, /saying/).start, about: w(l13, /about/).start,
      // the downbeats inside the window: the light changes
      db1: au.timeOfBeat(Math.floor(au.beatAt(w(l10, /never/).start + 0.02))),
      dbLast: au.timeOfBeat(Math.floor(au.beatAt(l13.words[0]!.start + 0.6))),
    };
  }

  /** Particle i's position and colour at t. */
  at(i: number, t: number): { x: number; y: number; col: string; v0: number } {
    const T = this.T, [cx, cy] = this.C0;
    const a0 = this.rai0.p[i]!, dn = this.dist[i]! / this.maxD;
    // S1: the scattered cloud, drifting
    const dir = Math.atan2(a0[1] - cy, a0[0] - cx) + 0.6 * (h01(i, 21) - 0.5);
    const r1 = this.dist[i]! + 160 + 420 * h01(i, 22);
    const s1: P = [cx + Math.cos(dir + 0.08 * (t - T.never!)) * r1 * 1.4, cy + Math.sin(dir + 0.08 * (t - T.never!)) * r1 * 0.85];
    const story = this.story[i % this.story.length]!, worth = this.worth[i % this.worth.length]!;
    const end: P = i % 10 < 7 ? this.rai1.p[i]! : this.q[i % this.q.length]!;
    const seg = (a: number, b: number, d: number) => ease.inOutCubic(clamp((t - a - d * (b - a)) / ((b - a) * (1 - 0.4))));
    const v0 = seg(T.never!, T.stoneEnd! + 0.1, 0.4 * (1 - dn));
    const v1 = seg(T.story! - 0.45, T.story! + 0.3, 0.4 * h01(i, 23));
    const v2 = seg(T.worth! - 0.06, T.worth! + 0.32, 0.3 * h01(i, 24));
    const v3 = seg(T.what!, T.sayEnd!, 0.4 * h01(i, 25));
    const v4 = seg(T.so! + 0.1, T.about! + 0.2, 0.4 * h01(i, 26));
    const mix = (A: P, B: P, v: number, sw: number): P => [A[0] + (B[0] - A[0]) * v + Math.sin(v * Math.PI) * sw * (h01(i, 27) - 0.5), A[1] + (B[1] - A[1]) * v - Math.sin(v * Math.PI) * sw * 0.4 * h01(i, 28)];
    let p: P = mix(a0, s1, v0, 200);
    if (v1 > 0) p = mix(p, story, v1, 160);
    if (v2 > 0) p = mix(p, worth, v2, 90);
    if (v3 > 0) p = mix(p, story, v3, 220);
    if (v4 > 0) p = mix(p, end, v4, 260);
    const jig = v4 < 1 ? 2.5 : 0;
    const x = p[0] + jig * Math.sin(t * 2.1 + i), y = p[1] + jig * Math.cos(t * 1.7 + i * 1.3);
    const pal = [HEX.bone, HEX.cyan, HEX.pink, HEX.gold, HEX.violet];
    let col = v0 < 0.5 ? this.rai0.col[i]! : pal[i % 5]!;
    if (v1 > 0.5) col = i % 3 ? HEX.bone : HEX.cyan;
    if (v2 > 0.5) col = i % 3 ? HEX.gold : HEX.yellow;
    if (v3 > 0.5) col = i % 3 ? HEX.bone : HEX.cyan;
    if (v4 > 0.5) col = i % 10 < 7 ? (i % 3 ? '#ffffff' : HEX.ink) : HEX.yellow;
    return { x, y, col, v0 };
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, audio: au, end } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t, T = this.T;
    this.L.clear(HEX.ink); this.G.clear();
    const lastBar = clamp((t - T.dbLast!) / (end - T.dbLast!));

    // the seabed at dusk: darker from the break; the chorus's frame (its cyan sunburst, the sand, the reeds) comes
    // up over the last bar, so the cut to chorus 1 is a match
    seabed(c, t, { depth: 0.55, floor: H * 0.72, clues: ['stone', 'shells'], seed: 14 });
    const dusk = t < T.db1! ? 0.18 : 0.42;
    c.fillStyle = `rgba(14,8,40,${dusk})`; c.fillRect(0, 0, W, H);
    if (lastBar > 0) {
      c.save(); c.globalAlpha = ease.inQuad(lastBar);
      sunburst(c, W * 0.34, H * 0.5, HEX.cyan, '#1aa9d6', 16, t * 0.12);
      halftone(c, rgbaHex(HEX.ink, 0.18), 26, 'down');
      c.fillStyle = '#f1dc9e';
      c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 40) c.lineTo(x, H * 0.84 + 10 * Math.sin(x * 0.006 + 1)); c.lineTo(W, H); c.closePath(); c.fill();
      for (let i = 0; i < 9; i++) reed(c, i < 5 ? 30 + i * 70 : W - 30 - (i - 5) * 80, H + 10, 300 + 120 * h01(i, 1, 7), t, i, '#1f7a4a', 24);
      c.restore();
    }

    // 10: the driftwood sign in the sand beside her: LIMESTONE, struck out on "stone"
    const sign = 1 - clamp((t - T.story! + 0.2) / 0.3);
    if (sign > 0) {
      c.save(); c.globalAlpha = sign;
      const sx = W * 0.76, sy = H * 0.7;
      c.save(); c.translate(sx, sy); c.rotate(0.05);
      c.fillStyle = '#7a5a3a'; c.fillRect(-8, -60, 16, 140);
      c.fillStyle = '#b08a5a'; c.beginPath(); c.roundRect(-190, -150, 380, 120, 14); c.fill();
      c.strokeStyle = '#5a3f2a'; c.lineWidth = 4; c.stroke();
      c.font = font(FAM.monoB(), 40); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#2a1d14';
      c.fillText('LIMESTONE', 0, -112); c.font = font(FAM.mono(), 30); c.fillText('1 PIECE · RAI', 0, -64);
      const u = ease.outExpo(clamp((t - T.stone!) / 0.25)), tw = 250;
      c.fillStyle = HEX.coral; c.fillRect(-tw / 2 - 6, -116, (tw + 12) * u, 10);
      c.restore(); c.restore();
    }

    // 10: Rai, solid until her outline breaks (outside-in); soft, then she looks down at herself as it starts
    const [cx, cy] = this.C0;
    const front = this.maxD * (1 - clamp((t - T.never!) / ((T.stoneEnd! + 0.1 - T.never!) * 0.4)));
    if (front > 0) {
      c.save();
      if (t > T.never!) { c.beginPath(); c.arc(cx, cy, front, 0, TAU); c.clip(); }
      const breathe = 0.04 * Math.sin((t - this.ctx.start) * 2.6);
      drawRai(c, R0.x, R0.y, R0.r, {
        t, face: t < T.never! - 0.15 ? 'soft' : 'wow', arms: t < T.never! - 0.25 ? ['cheek', 'down'] : ['down', 'down'], armsFrom: ['cheek', 'down'], armsU: clamp((t - T.never! + 0.25) / 0.15), squash: breathe, tilt: t < T.never! ? 0.05 : 0, look: t < T.never! ? 0 : 0.3,
        glow: HEX.pink, glowStrength: 0.7, heart: 0.3 + 0.3 * f.a.vocal, blush: 0.3,
      });
      c.restore();
    }

    // 11-12: the keepers' canoes slide in on the surface overhead (seen from below); speech bubbles drift down on "say"
    const keepK = ease.outCubic(clamp((t - T.keep! + 0.1) / 0.5)) * (1 - clamp((t - T.so!) / 0.4));
    if (keepK > 0) {
      // the bright surface they float on, and the light around them
      c.save(); c.globalAlpha = keepK;
      const sg = c.createLinearGradient(0, 0, 0, 120); sg.addColorStop(0, 'rgba(210,250,255,0.55)'); sg.addColorStop(1, 'rgba(210,250,255,0)');
      c.fillStyle = sg; c.fillRect(0, 0, W, 120);
      c.restore();
      for (let k = 0; k < 3; k++) {
        const x = lerp(-500 - 300 * k, W * (0.18 + 0.32 * k), keepK), y = 46;
        c.fillStyle = 'rgba(6,10,30,0.9)';
        c.beginPath(); c.ellipse(x, y - 6, 290, 46, 0, 0, Math.PI); c.fill();          // the hull, from below
        c.beginPath(); c.ellipse(x - 40, y - 18, 200, 14, 0, 0, Math.PI); c.fill();     // the outrigger float
        for (let j = 0; j < 4; j++) { // paddles dipping on the beat
          const ph = beatPh(au, t, -0.1 * j), px = x - 170 + j * 110, dip = ph < 0.5 ? Math.sin(ph * 2 * Math.PI) : 0;
          const bx = px - 50 + 80 * ph, by = y + 40 + 120 * dip;
          c.strokeStyle = 'rgba(6,10,30,0.9)'; c.lineWidth = 9;
          c.beginPath(); c.moveTo(px, y + 20); c.lineTo(bx, by); c.stroke();
          c.beginPath(); c.ellipse(bx, by, 11, 30, 0.3, 0, TAU); c.fill();
          if (dip > 0.2) { c.strokeStyle = 'rgba(220,250,255,0.6)'; c.lineWidth = 2; c.beginPath(); c.arc(bx + 6, by + 40, 6, 0, TAU); c.stroke(); }
        }
        const bk = clamp((t - T.say! - 0.06 * k) / 0.25);
        if (bk > 0) {
          const by = y + 60 + 220 * ease.outCubic(bk) + 14 * Math.sin(t * 2 + k);
          c.save(); c.globalAlpha = keepK; c.translate(x + 60, by); c.scale(ease.outBack(Math.min(1, bk * 1.4)), ease.outBack(Math.min(1, bk * 1.4)));
          speech(c, -50, -36, 110, 64, -30, -60, HEX.bone);
          c.fillStyle = HEX.ink; for (let j = 0; j < 3; j++) { c.beginPath(); c.arc(-20 + 22 * j, -4, 6, 0, TAU); c.fill(); }
          c.restore();
        }
      }
    }

    // the particles, batched by colour; one in twelve is a tiny word
    if (t > T.never!) {
      const buckets = new Map<string, Path2D>();
      c.font = font(FAM.bold(), 21); c.textAlign = 'center'; c.textBaseline = 'middle';
      for (let i = 0; i < N; i++) {
        const p = this.at(i, t);
        if (p.v0 <= 0) continue;
        if (i % 12 === 0 && t < T.so! + 0.6) {
          c.fillStyle = p.col; c.globalAlpha = 0.95; c.fillText(TINY[i % TINY.length]!, p.x, p.y); c.globalAlpha = 1;
          continue;
        }
        let path = buckets.get(p.col);
        if (!path) { path = new Path2D(); buckets.set(p.col, path); }
        path.rect(p.x - 2, p.y - 2, 4, 4);
      }
      for (const [col, path] of buckets) {
        c.fillStyle = col; c.fill(path);
        if (col === HEX.gold || col === HEX.cyan || col === HEX.yellow) { g.fillStyle = rgbaHex(col, 0.35); g.fill(path); }
      }
    }

    // 13: she comes back solid where the chorus finds her, with a knowing wink (her line drawing fills in)
    const solid = clamp((t - T.about! - 0.12) / 0.2);
    if (solid > 0) {
      c.save(); c.globalAlpha = solid;
      drawRai(c, R1.x, R1.y, R1.r, { t, face: 'wink', arms: ['down', 'down'], glow: HEX.bone, glowStrength: 0.8, heart: 0.4, noBlink: true, marks: ['shine'], markT0: T.about! + 0.2 });
      c.restore();
    }
    if (t > T.so!) seabedFront(c, t, { seed: 14 });

    // the lyric, sung: karaoke centred low on its band
    band(c, 0.75, H - 230);
    let idx = -1;
    for (let i = 0; i < this.lines.length; i++) if (t >= this.show[i]!) idx = i;
    if (idx >= 0) {
      const line = this.lines[idx]!, nx = this.show[idx + 1];
      karaoke(c, line, t, W / 2, H - 100, 56, { sung: idx === 2 ? HEX.gold : idx === 3 ? HEX.cyan : HEX.yellow, lead: line.words[0]!.start - this.show[idx]!, until: nx !== undefined ? nx - 0.2 : end + 1 });
    }
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    // a slow push-in on her before she breaks; a lift into the chorus over the last bar
    const push = 0.06 * clamp((t - this.ctx.start) / (T.never! - this.ctx.start)) * (1 - clamp((t - T.never!) / 0.6));
    return { bloom: 0.7, zoom: 1 + 0.008 * f.a.kick + push + 0.02 * ease.inQuad(lastBar) * (1 - clamp((t - end + 0.05) / 0.05)) };
  }
}
