// Rai's acting reel (a test, outside the edit: ?scene=acting / render.ts --scene acting --only acting): her range on
// the new seabed, two seconds an emotion, with the manga marks, lines of force and chibi pops. For his yes or no
// before the plates are rebuilt (his notes, 2026-10-02).
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { font, F } from '../engine/type';
import { drawRai, type Face, type ArmPose } from './_rai';
import { focusLines, speedLines, poof, reactionBg, type Mark } from './_manga';
import { seabed, seabedFront } from './_world';

interface Beat { name: string; face: Face; arms: [ArmPose, ArmPose]; marks?: Mark[]; sdAt?: number; sdFace?: Face; fx?: 'focus' | 'focusRed' | 'speed' | 'stripes' | 'gloom' | 'pink'; hop?: boolean; shake?: number; tilt?: number; squash?: number; blush?: number; then?: Face; thenMarks?: Mark[] }

const BEATS: Beat[] = [
  { name: 'joy', face: 'joy', arms: ['up', 'up'], marks: ['sparkle'], fx: 'focus', hop: true },
  { name: 'cross', face: 'angry', arms: ['fist', 'fist'], marks: ['vein', 'steam'], fx: 'focusRed', shake: 1, sdAt: 1.0 },
  { name: 'sassy', face: 'sassy', arms: ['hip', 'hip'], marks: ['shine'], tilt: 0.12 },
  { name: 'cheeky', face: 'cheeky', arms: ['hip', 'point'], tilt: -0.08 },
  { name: 'sad', face: 'sad', arms: ['down', 'down'], marks: ['gloom'], fx: 'gloom', squash: -0.18 },
  { name: 'crying (chibi)', face: 'cry', arms: ['cheek', 'cheek'], sdAt: 0, fx: 'gloom' },
  { name: 'shock', face: 'shock', arms: ['up', 'up'], marks: ['!?', 'sweat'], fx: 'focus', sdAt: 1.1 },
  { name: 'scheming', face: 'scheme', arms: ['chin', 'hold'], fx: 'stripes' },
  { name: 'in love', face: 'love', arms: ['cheek', 'cheek'], marks: ['hearts'], fx: 'pink', blush: 1 },
  { name: 'determined', face: 'determined', arms: ['fist', 'down'], fx: 'speed' },
  { name: 'deadpan', face: 'deadpan', arms: ['down', 'down'], marks: ['sweat'], sdAt: 1.0 },
  { name: 'dizzy, then asleep', face: 'dizzy', arms: ['shrug', 'shrug'], then: 'asleep', thenMarks: ['zzz'] },
];

export default class Acting extends Scene {
  L = new Layer2D();
  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const c = this.L.ctx, t = f.t;
    this.L.clear('#000');
    const i = Math.min(BEATS.length - 1, Math.floor(t / 2)), b = BEATS[i]!, lt = t - i * 2, t0 = i * 2;
    seabed(c, t, { clues: ['stone', 'anchor', 'bottle', 'coin'], depth: 0.25 });
    const cx = W / 2, cy = H * 0.56, R = 150;
    // the lines of force and reaction backgrounds, behind her
    if (b.fx === 'focus') focusLines(c, cx, cy - R, R * 2.4, 'rgba(255,255,255,0.75)', t);
    if (b.fx === 'focusRed') { c.fillStyle = 'rgba(120,10,30,0.45)'; c.fillRect(0, 0, W, H); focusLines(c, cx, cy - R, R * 2.2, 'rgba(255,60,60,0.85)', t, { n: 110 }); }
    if (b.fx === 'speed') speedLines(c, 0, 'rgba(255,255,255,0.8)', t, { n: 70 });
    if (b.fx === 'stripes') { c.save(); c.globalAlpha = 0.85; reactionBg(c, 'stripes', '#2a0f3a', '#4b1c66', t); c.restore(); }
    if (b.fx === 'gloom') { c.save(); c.globalAlpha = 0.6; reactionBg(c, 'rays', '#1a1440', '#3b2f78', t); c.restore(); }
    if (b.fx === 'pink') { c.save(); c.globalAlpha = 0.55; reactionBg(c, 'tone', '#ff9fc8', '#ff5fa2', t); c.restore(); }
    const sd = b.sdAt !== undefined && lt >= b.sdAt;
    const face: Face = b.then && lt >= 1 ? b.then : sd && b.sdFace ? b.sdFace : b.face;
    const hop = b.hop ? Math.abs(Math.sin(lt * Math.PI * 2.3)) * 0.35 : b.name === 'shock' && lt < 0.25 ? 0.4 * Math.sin((lt / 0.25) * Math.PI) : 0;
    const squash = b.hop ? (hop < 0.05 ? -0.35 : 0.2) : b.squash ?? (lt < 0.12 ? -0.3 + lt * 2.5 : 0);
    const tilt = (b.tilt ?? 0) + (b.name.startsWith('dizzy') && lt < 1 ? 0.12 * Math.sin(lt * 9) : 0);
    drawRai(c, cx, cy, R, {
      t, face, arms: b.arms, sd, marks: b.then && lt >= 1 ? b.thenMarks : b.marks, markT0: b.then && lt >= 1 ? t0 + 1 : t0 + 0.05,
      hop, squash, tilt, shake: b.shake, blush: b.blush, glow: '#2fe0ff', heart: face === 'love' ? 1 : 0.3, armsFrom: ['down', 'down'], armsU: Math.min(1, lt / 0.15),
    });
    if (b.sdAt !== undefined && b.sdAt > 0) poof(c, cx, cy - R * 0.6, R * 1.6, t, t0 + b.sdAt);
    seabedFront(c, t);
    // the caption (the reel only)
    c.font = font(F.mono(600), 30); c.fillStyle = 'rgba(255,255,255,0.9)'; c.textAlign = 'left';
    c.fillText(`${String(i + 1).padStart(2, '0')}  ${b.name}`, 60, 70);
    comp.draw(renderer, this.L.upload(), out);
    return { bloom: 0.5, shake: b.shake ? [3 * Math.sin(t * 60), 2 * Math.cos(t * 47)] : [0, 0] };
  }
}
