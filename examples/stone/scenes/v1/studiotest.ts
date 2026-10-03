// v1 look test for the shared set (_studio.ts), outside the edit: ?take=v1&scene=v1/studiotest. Four views by time:
// 0-4 the wide set with Rai and the mic, 4-8 the audience reverse shot, 8-12 the crew and the scoreboard's eye,
// 12-16 an archive frame and the night-vision feed.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../../engine/scene';
import { Layer2D, W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { drawRai } from '../_rai';
import { island } from '../_world';
import { person } from '../_motifs';
import { cast } from './_cast';
import { SET, studio, studioFront, audience, crabCam, octopus, lowerThird, liveBug, micProp, vhs, nightVision, ledText, captions, withCam } from './_studio';

export default class StudioTest extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, lyrics } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t;
    this.L.clear(HEX.ink); this.G.clear();
    const view = Math.floor(t / 4) % 4;
    const line = lyrics.lines[2]!;
    const fake = { ...line, words: line.words.map((w, i) => ({ ...w, start: (t % 4) - 0.3 + i * 0.18, end: (t % 4) - 0.1 + i * 0.18 })), end: (t % 4) + 3 };
    if (view === 0) {
      withCam(c, { zoom: 1 }, () => {
        studio(c, g, t, { curtain: 0.7, ring: 1, burst: [HEX.cyan, '#1aa9d6'], sign: 1, onAir: true, cue: 'APPLAUSE', cueT0: 0.5, house: 0.7,
          spots: [{ x: W * 0.5, col: HEX.pink }, { x: W * 0.45, col: HEX.yellow }, { x: W * 0.55, col: HEX.cyan }],
          score: [{ text: 'HER SCORE', col: HEX.bone }, { text: '0', col: HEX.pink }] });
        drawRai(c, W * 0.5, SET.floor - 1.07 * 150, 150, { t, face: 'sassy', arms: ['hip', 'cheek'], prop: { side: 1, draw: micProp }, glow: HEX.bone, heart: 0.5 });
        studioFront(c, g, t, { crowd: 1, mood: 'cheer' });
      });
      liveBug(c, g, t);
      lowerThird(c, fake as typeof line, t % 4);
    } else if (view === 1) {
      audience(c, g, t, { mood: 'cheer', spot: { x: 760, y: 560, r: 150 }, dim: 0.3 });
      lowerThird(c, fake as typeof line, t % 4);
    } else if (view === 2) {
      studio(c, g, t, { curtain: 0, sign: 0.6, onAir: false, house: 0.4, scoreDraw: (cc, gg, x, y, w, h) => {
        ledText(cc, gg, 'HER SCORE', x + w / 2, y + h * 0.25, 60, HEX.bone);
        ledText(cc, gg, '0', x + w / 2, y + h * 0.66, 170, HEX.pink);
      } });
      crabCam(c, g, W * 0.82, H * 0.86, 1.1, t, { tally: true, flip: true });
      octopus(c, g, W * 0.2, H * 0.62, 1, t, { card: 'QUIET', cardT0: 8.5 });
      (['trader', 'housekeeper', 'husband', 'strangerA', 'strangerB', 'panel1', 'panel2', 'panel3', 'child'] as const).forEach((w, i) => cast(c, w, W * (0.33 + 0.055 * i), SET.floor, w === 'child' ? 110 : 190, 'stand', { col: '#120d1d', t, rim: HEX.pink }));
      captions(c, fake as typeof line, t % 4);
    } else {
      // an archive frame: the island at sunset in silhouette, VHS
      island(c, t, { time: 'sunset' });
      for (let i = 0; i < 4; i++) person(c, W * (0.3 + 0.1 * i), H * 0.78, 200, 'point', { col: '#1a0f14', t, seed: i, emote: '!', emoteT0: 12.5 });
      vhs(c, t, 0, 0, W / 2, H);
      c.save(); c.beginPath(); c.rect(W / 2, 0, W / 2, H); c.clip();
      c.fillStyle = '#20242a'; c.fillRect(W / 2, 0, W / 2, H);
      cast(c, 'woman', W * 0.75, H * 0.85, 420, 'hold', { col: '#0a0a0a', t, emote: 'sigh', emoteT0: 13 });
      nightVision(c, t, W / 2, 0, W / 2, H);
      c.restore();
      liveBug(c, g, t, 'LIVE · UP THE ROAD', { logo: false });
    }
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    return { bloom: 0.6 };
  }
}
