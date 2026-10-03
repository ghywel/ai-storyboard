// v2 look test for the shared kit (_diver.ts), outside the edit: ?take=v2&scene=v2/divertest. Five views by time:
// 0-4 the torch in the dark, 4-8 the heart-lantern, 8-12 the bedroom at 4 am, 12-16 the manta ride, 16-20 the book,
// the slate, the bride and the old mother.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../../engine/scene';
import { Layer2D, W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { drawRai } from '../_rai';
import { seabed, seabedFront, island } from '../_world';
import { person } from '../_motifs';
import { relative, villager, lanternGlow, girl, mother, torchBeam, beamSpot, darkness, heartLantern, manta, ledgerBook, slate, pencil, circlePts, bedroom, bubbleLyric } from './_diver';

export default class DiverTest extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, lyrics } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t;
    this.L.clear(HEX.ink); this.G.clear();
    const view = Math.floor(t / 4) % 7, lt = t % 4;
    const line = lyrics.lines[4]!;
    const fake = { ...line, words: line.words.map((w, i) => ({ ...w, start: lt - 0.2 + i * 0.16, end: lt + i * 0.16 })), end: lt + 3 };
    if (view === 0) {
      seabed(c, t, { depth: 0.9, clues: ['bottle', 'shells'], seed: 3 });
      drawRai(c, W * 0.66, H * 0.62, 120, { t, face: 'shock', arms: ['down', 'wave'], marks: ['sweat'], markT0: 0.2, glow: HEX.gold, glowStrength: 0.4 });
      const a = girl(c, W * 0.3, H * 0.52, 260, 'torch', { t, underwater: true, fins: true, torch: true, glint: 'wide', slate: true, rim: 'rgba(255,220,150,0.6)' });
      const ang = Math.atan2(H * 0.6 - a.torch!.y, W * 0.66 - a.torch!.x);
      const len = Math.hypot(W * 0.66 - a.torch!.x, H * 0.6 - a.torch!.y) + 60;
      darkness(c, 0.88, [beamSpot(a.torch!.x, a.torch!.y, ang, len, 0.2)]);
      torchBeam(g, a.torch!.x, a.torch!.y, ang, len, 0.2);
      seabedFront(c, t, { seed: 3 });
      bubbleLyric(c, fake as typeof line, lt);
    } else if (view === 1) {
      seabed(c, t, { depth: 0.85, seed: 5 });
      darkness(c, 0.75, [{ x: W * 0.62, y: H * 0.35, r: 300 }, { x: W * 0.22, y: H * 0.66, r: 260 }]);
      const ra = drawRai(c, W * 0.22, H * 0.64, 100, { t, face: 'smug', arms: ['hip', 'point'], heart: 1, heartColor: HEX.gold, glow: HEX.gold });
      girl(c, W * 0.38, H * 0.86, 200, 'hug', { t, underwater: true, fins: true, glint: 'spark' });
      heartLantern(c, g, ra.heart.x, ra.heart.y, W * 0.62, H * 0.35, 280, t, 1, (cc) => {
        island(cc, t, { time: 'sunset' });
        for (let i = 0; i < 5; i++) person(cc, W * (0.48 + 0.06 * i), H * 0.62, 150, 'point', { col: '#1a0f14', t, seed: i, emote: '!', emoteT0: 4.5 });
      });
      bubbleLyric(c, fake as typeof line, lt, { sung: HEX.gold });
    } else if (view === 2) {
      bedroom(c, g, t, { clock: '4:00', girl: 'fever', mom: { pose: 'seated', emote: 'sigh', emoteT0: 8.4 }, pendant: { pop: 1, rai: { face: 'angry', marks: ['vein'] }, glow: 0.6 }, book: { eye: 1, look: 0.8 } });
      bubbleLyric(c, fake as typeof line, lt, { sung: HEX.pink });
    } else if (view === 3) {
      seabed(c, t, { depth: 0.35, seed: 8, pan: t * 200 });
      manta(c, g, W * 0.5, H * 0.5, 1.15, t, { bank: 0.3 * Math.sin(t) });
      drawRai(c, W * 0.47, H * 0.44, 46, { t, face: 'joy', arms: ['up', 'up'], sd: false });
      girl(c, W * 0.55, H * 0.5, 150, 'ride', { t, underwater: true, fins: true, glint: 'spark' });
      seabedFront(c, t, { seed: 8 });
      bubbleLyric(c, fake as typeof line, lt);
    } else if (view === 6) {
      island(c, t, { time: 'night' });
      (['uncle', 'aunt', 'grandad', 'diver1', 'diver2'] as const).forEach((w, i) => relative(c, w, W * (0.12 + 0.09 * i), H * 0.9, 300, i === 2 ? 'stand' : 'stand', { t, rim: 'rgba(255,190,120,0.8)', old: i === 4 }));
      for (let i = 0; i < 8; i++) { villager(c, W * (0.58 + 0.05 * i), H * 0.88, 240, i % 3 ? 'stand' : 'cheer', i, { t, lantern: i % 2 === 0, garland: i % 3 === 1, rim: 'rgba(255,190,120,0.7)' }); if (i % 2 === 0) lanternGlow(g, W * (0.58 + 0.05 * i), H * 0.88, 240, i, t); }
    } else if (view === 5) {
      // every pose of the girl, on land (top) and under water (bottom)
      c.fillStyle = '#e8e2d4'; c.fillRect(0, 0, W, H / 2); c.fillStyle = '#2a7ab8'; c.fillRect(0, H / 2, W, H / 2);
      const land = ['stand', 'wave', 'run', 'cheer', 'kneel', 'reach', 'sit', 'ride', 'lie'], sea = ['swim', 'glide', 'torch', 'float', 'hug', 'kneel', 'reach'];
      land.forEach((p, i) => girl(c, 110 + i * 205, H * 0.45, 230, p, { t, mask: i === 1 ? 'up' : 'none', pendant: true, grown: i === 0 }));
      sea.forEach((p, i) => girl(c, 140 + i * 260, p === 'swim' || p === 'glide' || p === 'torch' ? H * 0.72 : H * 0.95, 230, p, { t, underwater: true, fins: true, torch: p === 'torch', glint: (['spark', 'droop', 'wide', 'plain'] as const)[i % 4] }));
    } else {
      island(c, t, { time: 'day' });
      ledgerBook(c, g, W * 0.2, H * 0.4, 1, t, { open: 1, zero: Math.min(1, lt / 1.5), minus: Math.max(0, Math.min(1, (lt - 1.6) / 0.4)), blot: Math.max(0, Math.min(1, (lt - 2.2) / 0.3)) });
      slate(c, W * 0.48, H * 0.42, 1, -0.06, (cc) => {
        pencil(cc, circlePts(0, -10, 60), 1, '#2a2a33', 5);
        pencil(cc, circlePts(0, -18, 16), 1, '#2a2a33', 4);
        cc.font = '700 26px monospace'; cc.fillStyle = '#2a2a33'; cc.textAlign = 'center'; cc.fillText('NIGHTS 2,920', 0, 90);
      });
      girl(c, W * 0.68, H * 0.86, 330, 'stand', { t, grown: true, mask: 'none' });
      mother(c, W * 0.8, H * 0.86, 300, 'stand', { t, old: true, emote: 'tear', emoteT0: 16.5 });
      girl(c, W * 0.9, H * 0.86, 200, 'wave', { t, mask: 'up', pendant: true });
    }
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    return { bloom: 0.6 };
  }
}
