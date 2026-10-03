// REMEMBER: the spoken outro (lines 83-86), quiet, at sunset on Yap: tonight's wedding (the garland was already strung
// between the palms at dawn, in the finale). Long holds, slow dissolves, no hard cuts, nothing shaking:
//   wedding   "On Yap they still bring the stones to weddings."  the island at sunset, lanterns strung between the
//             palms; the couple holding hands, the stone garlanded with flowers beside them (carried from the
//             stone-money bank behind them); guests in a half-circle, one wiping a tear, one with a child, hearts;
//             Rai on the sand at the right, hands to her cheeks, moved
//   ring      "Not because they're heavy."   the garlanded stone close, the couple seen through its hole: the ring
//             becomes a wedding ring; petals falling; and on the sand, a hermit crab wearing a tiny rai stone as its
//             shell, trotting along without effort (worth is not weight)
//   wink      "Because everybody remembers."   Rai close in the last light, a lei over her shoulders, the guests'
//             lanterns rising into the sky and becoming stars; her last wink
//   remember  "So remember."   the picture goes to ink; the line alone in Cormorant, held, while the first two bells
//             strike and the gold knot begins (bells.ts carries it on)
// Dissolves land at or before each line's first word, starting on the beat before it.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { HEX } from '../engine/palette';
import type { Line } from '../engine/lyrics';
import { clamp, ease, lerp } from '../engine/util';
import { drawRai, h01 } from './_rai';
import { FAM, TAU, gradientV, karaoke, person, rgbaHex, stone, stars, type C2, type Emote, type Pose } from './_motifs';
import { island, palmTree } from './_world';
import { drawKnot } from './bells-knot';

const GROUND = H * 0.82;
const FLOWER_COLS = ['#ff7aa8', HEX.coral, '#fff3e0', HEX.yellow, '#ffb36b', HEX.pink];

/** A five-petal flower. */
function flower(c: C2, x: number, y: number, s: number, col: string, rot = 0) {
  c.fillStyle = col;
  for (let k = 0; k < 5; k++) {
    const a = rot + (k / 5) * TAU;
    c.beginPath(); c.ellipse(x + Math.cos(a) * s * 0.55, y + Math.sin(a) * s * 0.55, s * 0.5, s * 0.32, a, 0, TAU); c.fill();
  }
  c.fillStyle = HEX.yellow; c.beginPath(); c.arc(x, y, s * 0.28, 0, TAU); c.fill();
}

/** A garland of flowers round a stone's rim and a lei draped across its front (the stone drawn by `stone()`). */
function garland(c: C2, x: number, y: number, r: number, t: number, seed = 5) {
  const n = Math.max(14, Math.round(r / 7));
  for (let i = 0; i < n; i++) {
    const a = -Math.PI * 0.95 + (i / (n - 1)) * Math.PI * 0.9 + 0.03 * Math.sin(t * 0.8 + i);
    const rr = r * (0.97 + 0.04 * h01(i, seed, 1));
    flower(c, x + Math.cos(a) * rr * 0.94, y + Math.sin(a) * rr, r * (0.09 + 0.04 * h01(i, seed, 2)), FLOWER_COLS[i % FLOWER_COLS.length]!, h01(i, seed, 3) * TAU);
  }
  for (let i = 0; i < 9; i++) {
    const u = i / 8, a = Math.PI * (0.2 + 0.6 * u);
    flower(c, x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.62 + r * 0.05 * Math.sin(u * Math.PI), r * 0.08, FLOWER_COLS[(i + 2) % FLOWER_COLS.length]!, i);
  }
}

/** The wedding at sunset, full frame. `emoteT0` staggers the guests' feelings in. */
function wedding(c: C2, t: number, emoteT0: number) {
  island(c, t, { time: 'sunset', horizon: H * 0.5, beach: H * 0.6, show: ['huts', 'lanterns', 'clouds', 'bank'] });
  // two palms leaning in over the couple, and more along the shore
  palmTree(c, W * 0.2, GROUND + 10, 600, 0.32, t, 1, 0.3);
  palmTree(c, W * 0.8, GROUND + 10, 590, -0.32, t, 2, 0.3);
  palmTree(c, W * 0.04, GROUND + 40, 520, 0.12, t, 3, 0.3);
  palmTree(c, W * 0.96, GROUND + 40, 540, -0.1, t, 4, 0.3);
  // guests in a loose half-circle either side, feeling it
  const acts: [Pose, Emote | undefined][] = [['stand', 'heart'], ['face', 'tears'], ['hold', 'heart'], ['stand', undefined], ['hug', 'heart'], ['stand', 'tear'], ['wave', undefined]];
  for (let i = 0; i < 14; i++) {
    const side = i < 7 ? -1 : 1, j = i % 7;
    const x = W * 0.5 + side * (310 + j * 72 + 20 * h01(i, 3)), y = GROUND - 20 + 14 * Math.abs(Math.sin(j)), h = 190 + 30 * h01(i, 4);
    const [pose, e] = acts[(i * 3) % acts.length]!;
    person(c, x, y, h, pose, { col: HEX.ink, t, seed: i, flip: side > 0, emote: e, emoteT0: emoteT0 + 0.35 * j + 0.2 * (side > 0 ? 1 : 0), rim: 'rgba(255,170,120,0.85)', headTilt: pose === 'stand' ? side * 0.08 : 0 });
  }
  // the couple, holding hands, a flower crown on one of them
  const lx = W * 0.5 - 52, rx = W * 0.5 + 52;
  person(c, lx, GROUND - 26, 250, 'hands', { col: HEX.ink, t: 0, seed: 1, rim: 'rgba(255,170,120,0.9)' });
  person(c, rx, GROUND - 26, 236, 'hands', { col: HEX.ink, t: 0, seed: 2, rim: 'rgba(255,170,120,0.9)' });
  c.strokeStyle = HEX.ink; c.lineWidth = 15; c.lineCap = 'round';
  c.beginPath(); c.moveTo(lx + 75, GROUND - 26 - 130); c.quadraticCurveTo(W * 0.5, GROUND - 26 - 112, rx - 71, GROUND - 26 - 123); c.stroke();
  for (let k = 0; k < 6; k++) flower(c, rx - 18 + k * 7, GROUND - 26 - 236 * 0.98 - 4 * Math.sin(k), 7, FLOWER_COLS[k % 6]!, k);
  // the stone, garlanded, beside them
  const sx = W * 0.5 - 250, sr = 100, sy = GROUND - 26 - sr;
  c.fillStyle = 'rgba(80,40,50,0.3)'; c.beginPath(); c.ellipse(sx + 12, GROUND - 24, sr * 1.05, 14, 0, 0, TAU); c.fill();
  stone(c, sx, sy, sr, { seed: 5, heart: HEX.gold, heartA: 0.5 + 0.2 * Math.sin(t * 2) });
  garland(c, sx, sy, sr, t, 5);
}

/** A hermit crab whose shell is a tiny rai stone, trotting along at (x, y). */
function crab(c: C2, x: number, y: number, s: number, t: number) {
  const step = Math.sin(t * 14);
  c.save(); c.translate(x, y);
  c.strokeStyle = '#c0503a'; c.lineWidth = s * 0.06; c.lineCap = 'round';
  for (let k = 0; k < 3; k++) for (const d of [-1, 1]) {
    const ph = step * (k % 2 ? 1 : -1) * 0.15;
    c.beginPath(); c.moveTo(d * s * 0.2, -s * 0.15); c.lineTo(d * s * (0.45 + 0.1 * k), -s * 0.3 + ph * s); c.lineTo(d * s * (0.55 + 0.12 * k), 0); c.stroke();
  }
  c.fillStyle = '#e0604a'; c.beginPath(); c.ellipse(s * 0.32, -s * 0.22, s * 0.28, s * 0.18, 0, 0, TAU); c.fill();
  c.beginPath(); c.arc(s * 0.62, -s * 0.3, s * 0.12, 0, TAU); c.fill(); // the claw
  c.strokeStyle = '#2a1d14'; c.lineWidth = s * 0.03;
  for (const d of [0.4, 0.5]) { c.beginPath(); c.moveTo(s * d, -s * 0.36); c.lineTo(s * d + s * 0.04, -s * 0.5); c.stroke(); c.fillStyle = '#2a1d14'; c.beginPath(); c.arc(s * d + s * 0.04, -s * 0.52, s * 0.035, 0, TAU); c.fill(); }
  c.restore();
  stone(c, x - s * 0.05, y - s * 0.5, s * 0.42, { seed: 33, tilt: 0.1 * step });
}

export default class Remember extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  B = new Layer2D(); // the incoming tableau during a dissolve
  lines: Line[] = [];
  cuts: number[] = [];

  override init() {
    const { lyrics, audio: au, start, end } = this.ctx;
    this.lines = lyrics.lines.filter((l) => l.words[0]!.start >= start - 0.1 && l.words[0]!.start < end);
    if (this.lines.length < 4) throw new Error(`remember: expected 4 lines, found ${this.lines.length}`);
    // each tableau begins on the beat at or before its line (the dissolve ends there)
    this.cuts = this.lines.map((l, i) => (i === 0 ? start : au.timeOfBeat(Math.floor(au.beatAt(l.words[0]!.start + 0.02)))));
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const t = f.t, g = this.G.ctx;
    this.L.clear(HEX.ink); this.G.clear();
    const DIS = 0.75;
    let k = 0;
    while (k + 1 < this.cuts.length && t >= this.cuts[k + 1]! - DIS) k++;
    const into = clamp((t - (this.cuts[k]! - DIS)) / DIS);
    if (k > 0 && into < 1) {
      // a dissolve: the outgoing tableau beneath, the incoming one over it; their glows share one layer
      const e = ease.inOutQuad(into);
      g.save(); g.globalAlpha = 1 - e; this.tableau(this.L.ctx, g, k - 1, t); g.restore();
      this.B.clear();
      g.save(); g.globalAlpha = e; this.tableau(this.B.ctx, g, k, t); g.restore();
      comp.draw(renderer, this.L.upload(), out);
      comp.draw(renderer, this.B.upload(), out, { opacity: e });
    } else {
      this.tableau(this.L.ctx, g, k, t);
      // out of the finale's gold: a warm gold wash fading
      const wash = 1 - clamp((t - this.ctx.start) / 1.0);
      if (wash > 0) { g.fillStyle = rgbaHex(HEX.gold, 0.22 * wash * wash); g.fillRect(0, 0, W, H); }
      comp.draw(renderer, this.L.upload(), out);
    }
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.0, 2.0, 2.0] });
    return { bloom: 0.6, vignette: 0.45, grain: 0.06 };
  }

  /** Tableau k with its own line, drawn into c (and glow g). */
  tableau(c: C2, g: C2, k: number, t: number) {
    const line = this.lines[k]!, t0 = this.cuts[k]!, lt = t - t0;
    const say = (until: number) => {
      gradientV(c, 'rgba(18,13,29,0)', rgbaHex(HEX.ink, 0.85), 0, H - 230, W, 230);
      karaoke(c, line, t, W / 2, H - 92, 62, { fam: FAM.serif(), sung: HEX.bone, unsung: 'rgba(244,241,234,0)', lead: 0.05, until });
    };
    if (k === 0) {
      const z = 1 + 0.05 * ease.inOutQuad(clamp(lt / 6));
      c.save(); c.translate(W / 2, H * 0.6); c.scale(z, z); c.translate(-W / 2, -H * 0.6);
      wedding(c, t, line.words[0]!.start + 0.4);
      // Rai on the sand, hands to her cheeks, moved
      const wd = line.words[line.words.length - 1]!;
      drawRai(c, W * 0.86, GROUND + 30, 62, { t, face: 'soft', arms: ['cheek', 'cheek'], blush: 0.8, marks: ['hearts'], markT0: wd.start, glow: HEX.orange, glowStrength: 0.6, heart: 0.6, heartColor: HEX.gold, look: -1 });
      c.restore();
      say(this.cuts[1]!);
    } else if (k === 1) {
      // the stone close, the wedding through its hole
      const r = 400, sx = W / 2, sy = H * 0.47, hy = sy + r * 0.06, hr = r * 0.27;
      const z = 1 + 0.3 * ease.inOutQuad(clamp(lt / 3.2));
      c.save(); c.translate(sx, hy); c.scale(z, z); c.translate(-sx, -hy);
      island(c, t, { time: 'sunset', horizon: H * 0.55, beach: H * 0.7, show: ['clouds'] });
      // the near stone, lit from behind by the sunset, garlanded (drawn by hand so the hole stays clear to look through):
      // its back face (the thickness) first, then the view through where both faces' holes overlap, then its front
      const th = r * 0.14;
      c.save();
      c.fillStyle = 'rgba(70,40,60,0.35)'; c.beginPath(); c.ellipse(sx + 30, sy + r * 0.98, r * 1.0, 40, 0, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(sx + th, sy, r * 0.94, r, 0, 0, TAU); c.fillStyle = '#7a6e62'; c.fill();
      c.restore();
      c.save();
      c.beginPath(); c.ellipse(sx, hy, hr * 0.94, hr, 0, 0, TAU); c.clip();
      c.beginPath(); c.ellipse(sx + th, hy, hr * 0.94, hr, 0, 0, TAU); c.clip();
      const k2 = 0.5, cx0 = W * 0.5, cy0 = GROUND - 140;
      c.translate(sx + th / 2, hy + 22); c.scale(k2, k2); c.translate(-cx0, -cy0);
      wedding(c, t, -1e9);
      c.restore();
      c.save();
      c.beginPath(); c.ellipse(sx, sy, r * 0.94, r, 0, 0, TAU); c.moveTo(sx + hr * 0.94, hy); c.ellipse(sx, hy, hr * 0.94, hr, 0, 0, TAU);
      const sg = c.createRadialGradient(sx - 0.35 * r, sy - 0.45 * r, 0, sx, sy, 1.05 * r);
      sg.addColorStop(0, '#e9dcc4'); sg.addColorStop(0.55, '#c4b49a'); sg.addColorStop(1, '#8f8070');
      c.fillStyle = sg; c.fill('evenodd');
      c.strokeStyle = '#5b5345'; c.lineWidth = 6; c.stroke();
      c.strokeStyle = 'rgba(255,170,110,0.6)'; c.lineWidth = 10; c.beginPath(); c.ellipse(sx, sy, r * 0.94 - 5, r - 5, 0, -2.6, -0.6); c.stroke();
      for (let i = 0; i < 70; i++) {
        const a = h01(i, 12, 5) * TAU, d = Math.sqrt(h01(i, 12, 6)) * 0.9 * r, q = (0.008 + 0.02 * h01(i, 12, 7)) * r;
        const px = sx + Math.cos(a) * d * 0.94, py = sy + Math.sin(a) * d;
        if (Math.hypot(px - sx, py - hy) < hr * 1.15) continue;
        c.fillStyle = h01(i, 12, 8) < 0.7 ? 'rgba(100,90,75,0.35)' : 'rgba(255,255,255,0.35)';
        c.beginPath(); c.arc(px, py, q, 0, TAU); c.fill();
      }
      c.restore();
      garland(c, sx, sy, r, t, 12);
      // petals drifting down
      for (let i = 0; i < 26; i++) {
        const x = W * h01(i, 71) + 60 * Math.sin(t * 0.7 + i), y = ((h01(i, 72) + lt * 0.06 * (0.6 + h01(i, 73))) % 1.1) * H - 40;
        c.save(); c.translate(x, y); c.rotate(t * (0.5 + h01(i, 74)) + i);
        c.fillStyle = rgbaHex(FLOWER_COLS[i % FLOWER_COLS.length]!, 0.85);
        c.beginPath(); c.ellipse(0, 0, 9, 5, 0, 0, TAU); c.fill(); c.restore();
      }
      c.restore();
      // the hermit crab with its rai-stone shell, trotting across the sand without effort
      crab(c, lerp(-90, W * 0.27, clamp(lt / 3.4)), H * 0.835, 64, t);
      say(this.cuts[2]!);
    } else if (k === 2) {
      // Rai close in the last light; the guests' lanterns rise and become stars; her last wink
      island(c, t, { time: 'sunset', horizon: H * 0.58, beach: H * 0.7, show: ['clouds'] });
      const night = clamp(lt / 2.6);
      gradientV(c, rgbaHex('#0b0f2e', 0.6 * night), 'rgba(11,15,46,0)', 0, 0, W, H * 0.6);
      c.save(); c.globalAlpha = 0.25 + 0.6 * night; stars(c, t, 140, H * 0.45, 23); c.restore();
      for (let i = 0; i < 30; i++) {
        const b = t0 + 0.08 * i, v = clamp((t - b) / 2.4);
        if (v <= 0) continue;
        const x0 = W * (0.04 + 0.92 * h01(i, 81)), y0 = H * 0.76 - 50 * h01(i, 82);
        const x = lerp(x0, W * h01(i, 83), ease.inOutQuad(v)), y = lerp(y0, H * (0.05 + 0.3 * h01(i, 84)), ease.inOutQuad(v));
        const s = lerp(7, 2.5, v);
        c.fillStyle = v < 1 ? '#ffd99a' : '#fff6e0'; c.beginPath(); c.arc(x, y, s, 0, TAU); c.fill();
        g.fillStyle = rgbaHex(HEX.orange, 0.45 * (1 - v) + 0.12); g.beginPath(); g.arc(x, y, s * 2.6, 0, TAU); g.fill();
      }
      const R = 150, rx = W * 0.5, ry = H * 0.72 - 1.07 * R;
      const rem = line.words[line.words.length - 1]!, wink = t >= rem.start + 0.15;
      c.fillStyle = 'rgba(80,40,50,0.3)'; c.beginPath(); c.ellipse(rx, H * 0.72, R * 0.9, 18, 0, 0, TAU); c.fill();
      drawRai(c, rx, ry, R, { t, face: wink ? 'wink' : 'soft', arms: wink ? ['hip', 'wave'] : ['hold', 'hold'], armsFrom: ['hold', 'hold'], armsU: wink ? ease.outCubic(clamp((t - rem.start - 0.15) / 0.2)) : 1, marks: wink ? ['shine'] : undefined, markT0: rem.start + 0.15, tilt: wink ? -0.07 : 0, glow: HEX.orange, glowStrength: 0.8, heart: 0.7, heartColor: HEX.gold, noBlink: true });
      // a lei over her shoulders
      for (let i = 0; i < 13; i++) {
        const u = i / 12, x = rx + (u - 0.5) * 1.5 * R, y = ry - 0.62 * R + Math.sin(u * Math.PI) * 0.36 * R;
        flower(c, x, y, R * 0.085, FLOWER_COLS[i % FLOWER_COLS.length]!, i);
      }
      // the guests in front, their backs to us, watching her
      for (let i = 0; i < 16; i++) person(c, W * (0.02 + 0.065 * i) + 20 * h01(i, 8), H + 70, 300 + 60 * h01(i, 9), 'stand', { col: HEX.ink, t, seed: i, rim: 'rgba(255,170,120,0.8)' });
      say(this.cuts[3]!);
    } else {
      // ink; "So remember." alone, held; the first bells and the knot beginning
      c.fillStyle = HEX.ink; c.fillRect(0, 0, W, H);
      drawKnot(c, g, t, W / 2, H * 0.46, 300, 0.35);
      karaoke(c, line, t, W / 2, H * 0.5 + 30, 104, { fam: FAM.serif(), sung: HEX.bone, unsung: 'rgba(244,241,234,0)', lead: 0.05, until: this.ctx.end + 5 });
    }
  }
}
