// The medium reel: one picture, built up in six stages of 2.5 s, to see what each rule in CRAFT.md buys.
//   0 flat           vector fills: the look to avoid
//   1 paper + washes the ground has a material; big areas are laid in watercolour passes with tide-lines
//   2 broken colour  the whole backdrop re-stroked (warm lights, cool darks), cached once
//   3 the figure     cel light from the shape minus its shifted self, and the same paper inside her silhouette
//   4 one light      a light map multiplies the whole frame; a separation light behind her; long cast shadows
//   5 the grade      contrast, saturation and a split tone in post; small living motifs
// Play it over any take: `bun scripts/render.ts stills --take demo --scene medium-reel --t 1.2,3.7,6.2,8.7,11.2,13.7`.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { mulberry32 } from '../engine/util';
import * as M from './_medium';

const STAGES = ['flat', 'paper + washes', 'broken colour', 'the figure', 'one light', 'the grade'];
const HORIZON = H * 0.6;

// the figure: a woman in a long dress, seen from the side, looking toward the sun (parts back to front)
function figureParts(x: number, y: number, s: number) {
  const dress = new Path2D();
  dress.moveTo(x - 18 * s, y - 150 * s); dress.bezierCurveTo(x - 30 * s, y - 80 * s, x - 58 * s, y - 20 * s, x - 70 * s, y);
  dress.lineTo(x + 48 * s, y); dress.bezierCurveTo(x + 36 * s, y - 40 * s, x + 26 * s, y - 100 * s, x + 20 * s, y - 150 * s); dress.closePath();
  const torso = new Path2D();
  torso.moveTo(x - 20 * s, y - 210 * s); torso.quadraticCurveTo(x - 26 * s, y - 175 * s, x - 18 * s, y - 145 * s);
  torso.lineTo(x + 20 * s, y - 145 * s); torso.quadraticCurveTo(x + 24 * s, y - 185 * s, x + 14 * s, y - 212 * s); torso.closePath();
  const arm = new Path2D();
  arm.moveTo(x + 8 * s, y - 205 * s); arm.quadraticCurveTo(x + 40 * s, y - 180 * s, x + 74 * s, y - 168 * s);
  arm.lineTo(x + 76 * s, y - 158 * s); arm.quadraticCurveTo(x + 36 * s, y - 166 * s, x + 2 * s, y - 188 * s); arm.closePath();
  const head = new Path2D(); head.ellipse(x + 2 * s, y - 238 * s, 17 * s, 21 * s, -0.1, 0, Math.PI * 2);
  const hair = new Path2D();
  hair.moveTo(x - 14 * s, y - 252 * s); hair.bezierCurveTo(x - 30 * s, y - 230 * s, x - 34 * s, y - 180 * s, x - 22 * s, y - 150 * s);
  hair.bezierCurveTo(x - 14 * s, y - 190 * s, x - 8 * s, y - 225 * s, x + 6 * s, y - 258 * s); hair.closePath();
  return { dress, torso, arm, head, hair };
}

export default class MediumReel extends Scene {
  L = new Layer2D();
  G = new Layer2D();

  /** The clean underpainting: composition and values only. */
  private flatPlate(withFigure: boolean) {
    return M.cached('reel:flat:' + withFigure, (g) => {
      const sky = g.createLinearGradient(0, 0, 0, HORIZON);
      sky.addColorStop(0, '#1b2a4a'); sky.addColorStop(0.55, '#7a5a7a'); sky.addColorStop(1, '#f0a868');
      g.fillStyle = sky; g.fillRect(0, 0, W, HORIZON);
      g.fillStyle = '#ffd890'; g.beginPath(); g.arc(W * 0.7, HORIZON - 40, 70, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#4a4466'; g.beginPath(); g.moveTo(0, HORIZON);
      for (let x = 0; x <= W; x += 60) g.lineTo(x, HORIZON - 90 - 70 * Math.abs(Math.sin(x * 0.004 + 1.3)) - 30 * Math.sin(x * 0.013));
      g.lineTo(W, HORIZON); g.fill();
      g.fillStyle = '#5c5a3a'; g.beginPath(); g.moveTo(0, HORIZON + 40);
      for (let x = 0; x <= W; x += 40) g.lineTo(x, HORIZON + 10 - 40 * Math.sin(x * 0.003));
      g.lineTo(W, H); g.lineTo(0, H); g.fill();
      g.fillStyle = '#b08a3e'; g.fillRect(0, HORIZON + 20, W, H);
      g.fillStyle = '#4c4a52'; g.beginPath();   // the forked standing stone
      g.moveTo(W * 0.24, HORIZON + 140); g.lineTo(W * 0.235, HORIZON - 140); g.lineTo(W * 0.252, HORIZON - 175); g.lineTo(W * 0.262, HORIZON - 60);
      g.lineTo(W * 0.27, HORIZON - 190); g.lineTo(W * 0.287, HORIZON - 150); g.lineTo(W * 0.292, HORIZON + 140); g.fill();
      if (withFigure) { const p = figureParts(W * 0.52, H * 0.86, 1.25); g.fillStyle = '#26303f'; for (const k of ['hair', 'dress', 'torso', 'arm', 'head'] as const) g.fill(p[k]); }
    });
  }

  /**
   * Paper ground and watercolour washes over the same composition. Lessons from the first pass (CRAFT.md §2):
   * multiply washes compound, so lay the light areas (sky, glow, meadow) with source-over at moderate alpha and keep
   * multiply for the darks laid over them; a sky is ONE wash with a gradient fill, never bands of rectangles.
   */
  private washed() {
    return M.cached('reel:washed', (g) => {
      M.blit(g, M.paper('reel', '#efe3c8', { mottle: 20, grain: 10, seed: 3 }));
      const sky = g.createLinearGradient(0, 0, 0, HORIZON);
      sky.addColorStop(0, '#22345e'); sky.addColorStop(0.5, '#8a6488'); sky.addColorStop(0.85, '#f2a466'); sky.addColorStop(1, '#ffd08a');
      M.watercolor(g, M.rectPts(-60, -60, W + 120, HORIZON + 80), '#5a4a6a', { layers: 4, alpha: 0.42, amp: 18, seed: 1, blend: 'source-over', fill: sky, edge: 0.04 });
      const ridge: M.Pt[] = [[-40, HORIZON + 20]];
      for (let x = 0; x <= W; x += 60) ridge.push([x, HORIZON - 90 - 70 * Math.abs(Math.sin(x * 0.004 + 1.3)) - 30 * Math.sin(x * 0.013)]);
      ridge.push([W + 40, HORIZON + 20]);
      M.watercolor(g, ridge, '#7a6f96', { layers: 4, alpha: 0.32, amp: 10, seed: 6 });   // distance: a light, cool multiply
      // the sun goes in AFTER the ridge, clipped to the open sky: watercolour is transparent, so a sun painted underneath
      // shows through the mountains as a ghost disc; its bloom is a radial fill, because stacked polygons leave a hard blob
      g.save(); g.beginPath(); g.moveTo(-60, -60); ridge.forEach(([x, y]) => g.lineTo(x, y - 6)); g.lineTo(W + 60, -60); g.closePath(); g.clip();
      const sx = W * 0.7, sy = HORIZON - 40, bloom = g.createRadialGradient(sx, sy, 40, sx, sy, 420);
      bloom.addColorStop(0, 'rgba(255,226,160,0.55)'); bloom.addColorStop(1, 'rgba(255,200,130,0)');
      g.fillStyle = bloom; g.fillRect(sx - 420, sy - 420, 840, 840);
      M.watercolor(g, M.ellipsePts(sx, sy, 66, 66, 24), '#fff0c0', { layers: 3, alpha: 0.75, amp: 2.5, seed: 4, blend: 'source-over', edge: 0.08 });
      g.restore();
      const hill: M.Pt[] = [[-40, HORIZON + 140]];
      for (let x = 0; x <= W; x += 40) hill.push([x, HORIZON + 10 - 40 * Math.sin(x * 0.003)]);
      hill.push([W + 40, HORIZON + 140]);
      M.watercolor(g, hill, '#8a8250', { layers: 4, alpha: 0.38, amp: 30, seed: 7 });
      const meadow = g.createLinearGradient(0, HORIZON + 50, 0, H);
      meadow.addColorStop(0, '#e2b45e'); meadow.addColorStop(1, '#9a6e34');
      M.watercolor(g, M.rectPts(-60, HORIZON + 55, W + 120, H), '#a07838', { layers: 4, alpha: 0.5, amp: 24, seed: 8, blend: 'source-over', fill: meadow, edge: 0.08 });
      M.watercolor(g, [[W * 0.24, HORIZON + 140], [W * 0.235, HORIZON - 140], [W * 0.252, HORIZON - 175], [W * 0.262, HORIZON - 60], [W * 0.27, HORIZON - 190], [W * 0.287, HORIZON - 150], [W * 0.292, HORIZON + 140]], '#5e5868', { layers: 3, alpha: 0.6, amp: 3, seed: 9, edge: 0.18 });
    });
  }

  private broken() {
    return M.cached('reel:broken', (g) => {
      const meadowAngle = (x: number, y: number) => (y > HORIZON + 40 ? -1.35 + 0.25 * Math.sin(x * 0.01) : 0.08 * Math.sin(y * 0.01));
      M.blit(g, M.brokenColour(this.washed(), { cell: 9, len: 24, wid: 7, angle: meadowAngle, seed: 2 }));
    });
  }

  private figure(g: CanvasRenderingContext2D, cel: boolean) {
    const p = figureParts(W * 0.52, H * 0.86, 1.25);
    if (!cel) { g.fillStyle = '#26303f'; for (const k of ['hair', 'dress', 'torso', 'arm', 'head'] as const) g.fill(p[k]); return; }
    const shape = M.scratch('reel:figure');
    const o = { lx: -1, ly: 0.3, line: '#2a1e24', lw: 2 };   // the sun is to her right: shadow falls on her left
    M.cel(shape.ctx, p.hair, '#2b211f', '#1a1414', '#7a4a34', { ...o, sd: 10, rw: 4 });
    M.cel(shape.ctx, p.dress, '#3a4a66', '#253046', '#e39a62', { ...o, sd: 26, rw: 6 });
    M.cel(shape.ctx, p.torso, '#3a4a66', '#253046', '#e39a62', { ...o, sd: 14, rw: 5 });
    M.cel(shape.ctx, p.arm, '#c48a6a', '#8a5a48', '#ffc890', { ...o, sd: 8, rw: 4 });
    M.cel(shape.ctx, p.head, '#c48a6a', '#8a5a48', '#ffc890', { ...o, sd: 10, rw: 5 });
    M.blit(g, shape.canvas);
    M.textureInside(g, shape.canvas, (t) => M.blit(t, M.paper('reel', '#efe3c8', { mottle: 20, grain: 10, seed: 3 })), { op: 'multiply', alpha: 0.85 });
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const t = f.t, stage = Math.min(5, Math.floor(t / 2.5));
    const c = this.L.ctx, g = this.G.ctx;
    this.L.clear('#000'); this.G.clear();

    if (stage === 0) M.blit(c, this.flatPlate(true));
    else {
      M.blit(c, stage === 1 ? this.washed() : this.broken());
      this.figure(c, stage >= 3);
    }
    if (stage >= 4) {
      const x = W * 0.52, y = H * 0.86;
      M.castShadow(c, [
        [y, (s) => { const p = figureParts(x, y, 1.25); for (const k of ['hair', 'dress', 'torso', 'arm', 'head'] as const) s.fill(p[k]); }],
        [HORIZON + 140, (s) => s.fillRect(W * 0.235, HORIZON - 190, W * 0.057, 330)],
      ], { kx: -1.6, ky: 0.18, clipY: HORIZON + 60, alpha: 0.42, blur: 2 });
      // dusk: the unlit world is a cool mid (about 0.7), not a candle-lit dark (0.13 suits chiaroscuro interiors only)
      M.applyLight(c, M.lightMap('reel', 'rgb(176,168,196)', (l) => {
        M.pool(l, W * 0.7, HORIZON - 40, 1200, '255,214,160', 0.55);   // the sun
        M.pool(l, W * 0.47, H * 0.68, 240, '110,130,190', 0.3);        // separation light behind her shadow side
      }));
    }
    if (stage >= 5) {   // living motifs: a few seed-lights drifting, glow on the additive layer (it blooms)
      const r = mulberry32(11);
      for (let i = 0; i < 26; i++) {
        const x0 = r() * W, y0 = HORIZON + 40 + r() * (H - HORIZON - 80), ph = r() * 6.28;
        const x = x0 + 30 * Math.sin(t * 0.6 + ph), y = y0 - 18 * Math.sin(t * 0.9 + ph * 1.3);
        g.fillStyle = `rgba(255,214,140,${0.35 + 0.25 * Math.sin(t * 2 + ph)})`;
        g.beginPath(); g.arc(x, y, 2.4 + 1.5 * r(), 0, Math.PI * 2); g.fill();
      }
    }
    // the stage's name, small, bottom left
    c.font = '600 26px Archivo, sans-serif'; c.fillStyle = 'rgba(20,16,24,0.8)'; c.fillText(`${stage}  ${STAGES[stage]}`, 48, H - 44);

    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.4, 2.4, 2.4] });
    return stage >= 5
      ? { bloom: 0.45, vignette: 0.42, grain: 0.05, contrast: 1.08, saturation: 1.06, split: 0.32, splitBalance: 0.05, shadowTint: '#3a5878', highlightTint: '#ffd6a0' }
      : { bloom: 0.3, vignette: 0.25, grain: 0.035 };
  }
}
