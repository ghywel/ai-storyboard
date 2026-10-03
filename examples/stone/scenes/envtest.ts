// A look test for the shared environments and silhouettes (?scene=envtest), outside the edit.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { island, type TimeOfDay } from './_world';
import { person, stone, type Pose, type Emote } from './_motifs';
import { drawRai } from './_rai';

export default class EnvTest extends Scene {
  L = new Layer2D();
  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const c = this.L.ctx, t = f.t;
    this.L.clear('#000');
    const times: TimeOfDay[] = ['dawn', 'day', 'sunset', 'night'];
    const i = Math.min(3, Math.floor(t / 2)), tod = times[i]!;
    island(c, t, { time: tod, show: ['huts', 'palms', 'bank', 'canoes', 'clouds', 'path', ...(tod === 'night' ? ['lanterns' as const] : []), ...(tod === 'day' ? ['ship' as const] : [])] });
    const poses: [Pose, Emote | undefined][] = [['slump', 'tear'], ['lean', 'sigh'], ['hug', 'heart'], ['face', 'tears'], ['cheer', 'joy'], ['read', 'zzz'], ['seated', 'music'], ['stand', 'anger']];
    poses.forEach(([p, e], k) => person(c, 180 + k * 200, H - 90, 230, p, { t, seed: k, emote: e, rim: tod === 'night' ? '#ffd678' : undefined, col: '#1a1230' }));
    stone(c, W - 260, H * 0.62, 60, { heart: '#ff4f9a', seed: 4 });
    stone(c, W - 130, H * 0.66, 40, { glow: '#2fe0ff', seed: 5 });
    drawRai(c, W * 0.5, H * 0.42, 70, { t, face: 'joy', arms: ['up', 'up'] });
    comp.draw(renderer, this.L.upload(), out);
    return { bloom: 0.4 };
  }
}
