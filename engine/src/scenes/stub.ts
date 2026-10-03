// A plate still being built: its name, the karaoke of its lines, a placeholder figure. Every timeline entry without
// its own scene file plays this, so a film always runs end to end while its plates are being written.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { HEX } from '../engine/palette';
import { font } from '../engine/type';
import { FAM, gradientV, karaoke, lineNow, person, rgbaHex } from './_motifs';

export default class Stub extends Scene {
  L = new Layer2D();
  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, lyrics, id, start, end } = this.ctx;
    const c = this.L.ctx;
    this.L.clear();
    gradientV(c, HEX.deep, HEX.ink);
    c.font = font(FAM.monoB(), 26); c.fillStyle = rgbaHex(HEX.bone, 0.7); c.textAlign = 'left';
    c.fillText(`${id} (to build)  ${start.toFixed(2)}–${end.toFixed(2)}`, 60, 80);
    person(c, W - 220, H - 120, 260, 'wave', { col: rgbaHex(HEX.bone, 0.35), t: f.t });
    const line = lineNow(lyrics.linesIn(start, end), f.t);
    if (line) karaoke(c, line, f.t, W / 2, H / 2, 54);
    comp.draw(renderer, this.L.upload(), out);
    return { bloom: 0.4 };
  }
}
