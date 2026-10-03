// BELLS: Coprime's bells over a drone, to the end of the film. Calm. Out of the ink of "So remember." the night sea
// rises: the moon high on the right, its light rippling down the water; far off on the horizon the island, the
// wedding's lanterns still lit (everybody remembers); and under the water, faint, the heart-lights of other stones
// still lying on the seabed, pulsing softly with the bells (the chorus asked "who else is waiting at the bottom of
// the sea?": they are still down there, waiting to be counted).
//   knot     the gold harmonograph draws itself, one lap of the 3:2 knot per strike (nine strikes, each gap 1.16x the
//            last; the first two fell under "So remember.", which fades as the knot takes over), a pulse of light on
//            each strike, every lap a little smaller and turned, like a real pendulum's pen
//   title    the finished knot rises and becomes the emblem above the title, THE STONE AT THE BOTTOM OF THE SEA
//   credits  the four credits from TREATMENT-v3.md, one by one; then the fade to black by the end
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { HEX } from '../engine/palette';
import { font } from '../engine/type';
import type { Line } from '../engine/lyrics';
import { clamp, ease, lerp } from '../engine/util';
import { FAM, TAU, gradientV, karaoke, rgbaHex, stars, type C2 } from './_motifs';
import { palmTree } from './_world';
import { h01 } from './_rai';
import { STRIKES, drawKnot, strikePulse } from './bells-knot';

const CREDITS: [string, string][] = [
  ['WORDS', 'Claude, from Knight Commander Gareth’s brief'],
  ['VOICE AND MUSIC', 'Suno'],
  ['PROLOGUE AND BELLS', 'Coprime'],
  ['FILM', 'drawn in code; engine from pdoom-video by Giacomo Magnanini (MIT)'],
];
const TITLE = ['THE STONE', 'AT THE BOTTOM OF THE SEA'];

export default class Bells extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  last: Line | null = null;
  tKnotDone = 0;
  tTitle = 0;
  tCredits = 0;
  tFade = 0;

  override init() {
    const { lyrics, start, end } = this.ctx;
    // "So remember.", still on screen from the outro, fading as the knot takes over
    this.last = lyrics.lines.filter((l) => l.words[0]!.start < start).pop() ?? null;
    this.tKnotDone = STRIKES[STRIKES.length - 1]! + 1.5;
    this.tTitle = this.tKnotDone + 1.1;
    this.tCredits = this.tTitle + 2.2;
    this.tFade = end - 1.7;
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, end } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t;
    this.L.clear(HEX.ink); this.G.clear();
    // the night sea rises out of the ink
    const rise = ease.inOutQuad(clamp((t - this.ctx.start) / 2.2));
    if (rise > 0) { c.save(); c.globalAlpha = rise; nightSea(c, t, strikePulse(t, 0.6)); c.restore(); }

    // the knot: big in the centre while it draws, then rising to become the title's emblem
    const up = ease.inOutCubic(clamp((t - this.tKnotDone) / 1.6));
    const kx = W / 2, ky = lerp(H * 0.46, H * 0.16, up), kr = lerp(300, 92, up);
    const ka = lerp(0.35, 1, ease.inOutQuad(clamp((t - this.ctx.start) / 1.2)));
    drawKnot(c, g, t, kx, ky, kr, ka);
    if (t > this.tKnotDone - 0.3) { // the finished knot's steady glow
      const gr = g.createRadialGradient(kx, ky, 0, kx, ky, kr * 1.6);
      gr.addColorStop(0, rgbaHex(HEX.gold, 0.09 * clamp((t - this.tKnotDone + 0.3) / 0.6))); gr.addColorStop(1, rgbaHex(HEX.gold, 0));
      g.fillStyle = gr; g.beginPath(); g.arc(kx, ky, kr * 1.6, 0, TAU); g.fill();
    }

    // "So remember." carried over, fading
    if (this.last) {
      c.save(); c.globalAlpha = 1 - clamp((t - this.ctx.start) / 1.1);
      if (c.globalAlpha > 0) karaoke(c, this.last, t, W / 2, H * 0.5 + 30, 104, { fam: FAM.serif(), sung: HEX.bone, unsung: 'rgba(244,241,234,0)', lead: 0.05, until: end + 5 });
      c.restore();
    }

    // the title
    const ta = ease.outCubic(clamp((t - this.tTitle) / 1.2));
    if (ta > 0) {
      c.save();
      c.textAlign = 'center'; c.textBaseline = 'middle';
      const sizes = [116, 76], ys = [H * 0.32, H * 0.41];
      TITLE.forEach((row, i) => {
        c.font = font(FAM.hook(), sizes[i]!);
        c.globalAlpha = ta;
        const dy = 18 * (1 - ta);
        c.fillStyle = HEX.ink; c.fillText(row, W / 2 + 5, ys[i]! + dy + 5);
        c.fillStyle = i === 0 ? HEX.gold : HEX.bone; c.fillText(row, W / 2, ys[i]! + dy);
      });
      c.restore();
      g.save(); g.globalAlpha = 0.25 * ta; g.font = font(FAM.hook(), 120); g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = HEX.gold; g.font = font(FAM.hook(), 116); g.fillText(TITLE[0]!, W / 2, H * 0.32); g.restore();
    }

    // the credits, one by one: label in gold mono, then the name
    CREDITS.forEach(([label, who], i) => {
      const a = ease.outCubic(clamp((t - this.tCredits - 0.7 * i) / 0.8));
      if (a <= 0) return;
      const y = H * 0.52 + i * 96 + 10 * (1 - a);
      c.save(); c.globalAlpha = a; c.textBaseline = 'middle'; c.textAlign = 'center';
      c.font = font(FAM.mono(), 21); c.fillStyle = rgbaHex(HEX.gold, 0.95);
      c.letterSpacing = '4px';
      c.fillText(label, W / 2, y);
      c.letterSpacing = '0px';
      c.font = font(FAM.bold(), 36); c.fillStyle = HEX.bone;
      c.fillText(who, W / 2, y + 38);
      c.restore();
    });
    // a thin gold rule between the title and the credits
    const ra = clamp((t - this.tCredits + 0.4) / 0.8);
    if (ra > 0) { c.fillStyle = rgbaHex(HEX.gold, 0.6 * ra); c.fillRect(W / 2 - 160 * ra, H * 0.47, 320 * ra, 2); }

    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.0, 2.0, 2.0] });
    const fade = ease.inOutQuad(clamp((t - this.tFade) / (end - 0.05 - this.tFade)));
    return { bloom: 0.6 + 0.25 * strikePulse(t, 0.25), vignette: 0.5, fade, grain: 0.05 };
  }
}

/** The night sea from the shore: stars, the moon and its rippling path, the island far off with the wedding's lights, and
 *  under the water the faint hearts of other stones still waiting, brightening a little on each bell (`pulse`). */
function nightSea(c: C2, t: number, pulse: number) {
  const hz = H * 0.6, mx = W * 0.82, my = H * 0.16;
  gradientV(c, '#05071a', '#202660', 0, 0, W, hz);
  c.save(); c.globalAlpha = 0.8; stars(c, t * 0.5, 200, hz * 0.95, 51); c.restore();
  // the moon, its glow in this layer so nothing is washed over
  const mg = c.createRadialGradient(mx, my, 0, mx, my, 260);
  mg.addColorStop(0, 'rgba(255,244,214,0.35)'); mg.addColorStop(1, 'rgba(255,244,214,0)');
  c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = mg; c.fillRect(mx - 260, my - 260, 520, 520); c.restore();
  c.fillStyle = '#fff4d6'; c.beginPath(); c.arc(mx, my, 44, 0, TAU); c.fill();
  c.fillStyle = 'rgba(200,190,160,0.35)'; for (const [dx, dy, r] of [[-12, -8, 9], [10, 12, 6], [14, -14, 5]] as const) { c.beginPath(); c.arc(mx + dx, my + dy, r, 0, TAU); c.fill(); }
  // the sea
  gradientV(c, '#1a2160', '#04061a', 0, hz, W, H - hz);
  c.strokeStyle = 'rgba(120,140,220,0.18)'; c.lineWidth = 1.5;
  for (let i = 0; i < 22; i++) {
    const y = hz + (H - hz) * Math.pow((i + 1) / 23, 1.7), w = 30 + 200 * (i / 22);
    for (let k = 0; k < 5; k++) {
      const x = ((h01(i, k, 61) * W + t * 8 * (k % 2 ? 1 : -1)) % W + W) % W;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + w / 2, y - 2, x + w, y); c.stroke();
    }
  }
  // the moon's path, rippling
  for (let i = 0; i < 70; i++) {
    const u = h01(i, 62), y = hz + 4 + (H - hz) * u * u * 0.95, spread = 18 + 260 * u;
    const x = mx + (h01(i, 63) - 0.5) * spread + 10 * Math.sin(t * 1.3 + i), tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 2.2 + i * 1.9));
    c.fillStyle = `rgba(255,244,214,${0.55 * tw})`; c.fillRect(x - 8 - 22 * u, y, 16 + 44 * u, 1.5 + 2 * u);
  }
  // the island far off on the left, the wedding's lanterns still lit, and their reflections
  c.fillStyle = '#0b0e2a';
  c.beginPath(); c.moveTo(W * 0.02, hz + 1); c.quadraticCurveTo(W * 0.12, hz - 26, W * 0.22, hz - 20); c.quadraticCurveTo(W * 0.3, hz - 14, W * 0.36, hz + 1); c.closePath(); c.fill();
  for (const [x, h, l] of [[0.08, 70, 0.2], [0.15, 90, -0.15], [0.27, 60, 0.25]] as const) palmTree(c, W * x, hz - 10, h, l, t, 9, 0.95);
  for (let i = 0; i < 9; i++) {
    const x = W * (0.1 + 0.02 * i), y = hz - 18 + 4 * Math.sin(i * 0.9), tw = 0.7 + 0.3 * Math.sin(t * 3 + i);
    c.fillStyle = `rgba(255,214,120,${tw})`; c.beginPath(); c.arc(x, y, 2.2, 0, TAU); c.fill();
    c.fillStyle = `rgba(255,214,120,${0.35 * tw})`; c.fillRect(x - 1.5, hz + 4 + 3 * i % 7, 3, 10 + 6 * Math.sin(t * 2 + i));
  }
  // under the water, faint: the other stones' hearts, still waiting
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 7; i++) {
    const x = W * (0.08 + 0.13 * i + 0.04 * h01(i, 64)), y = H * (0.8 + 0.12 * h01(i, 65)), r = 26 + 22 * h01(i, 66);
    const a = (0.05 + 0.04 * Math.sin(t * 0.8 + i * 1.7) + 0.06 * pulse) * (0.6 + 0.4 * h01(i, 67));
    const col = i % 3 === 0 ? '255,79,154' : i % 3 === 1 ? '246,196,83' : '47,224,255';
    const gr = c.createRadialGradient(x, y, 0, x, y, r * 2.2);
    gr.addColorStop(0, `rgba(${col},${a * 2})`); gr.addColorStop(0.4, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`);
    c.fillStyle = gr; c.fillRect(x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4);
    c.strokeStyle = `rgba(${col},${a * 2.2})`; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y, r * 0.45, r * 0.22, 0, 0, TAU); c.stroke();
  }
  c.restore();
}
