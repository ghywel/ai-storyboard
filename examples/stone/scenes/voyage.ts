// VOYAGE (0-12.83, Coprime's prologue: "rhythm becomes harmony"). One continuous shot, the film's first image:
//   - 0-3.83, calm: a big moon low on a night sea, a canoe with a bamboo raft lashed on carrying the stone upright,
//     the moon showing through the stone's hole. Three paddlers in silhouette beat 4 : 5 : 6; each stroke splashes,
//     and three neon rings about the stone's hole (cyan 4, pink 5, yellow 6) pulse on their voice's strikes, their
//     marks flaring as one sweeping hand passes them (the polyrhythm made visible). A mono readout counts the rates.
//   - 3.83-11.9, thrilling: the base rate glides seven octaves up. The hand spins, the marks strobe, the pulses fuse
//     into steady rings that start to ring (standing waves of 2m lobes); the stars turn about the moon into trails,
//     then full circles; the sea rushes, the spray goes white; storm clouds gather from 8.8 s (the wind).
//   The world (his notes): Palau's Rock Islands recede on the left, the big cliff with the round scar where she was
//   cut out (verse 1's quarry); a storm bank masses on the right horizon from the first frame, silent lightning inside
//   it (what is coming); a school glints under the moonlit surface; a flying fish leaps; the bow lantern flickers; the
//   navigator at the stern points the way by the stars.
//   - 11.9-12.83: the rings pour into the gold harmonograph, complete on the chord (where `sinking` takes over with
//     the title).
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { HEX } from '../engine/palette';
import { font } from '../engine/type';
import { clamp, ease, smoothstep } from '../engine/util';
import { FAM, rgbaHex } from './_motifs';
import {
  FUSE0, HOLE, Rhythm, SUMMIT, VCOL, VOICES, applyCam, flyingFish, fuseCurve, glideE, nightCam, nightWorld, rings,
  splashes, stormAt, vessel, wind,
} from './voyage-world';


export default class Voyage extends Scene {
  L = new Layer2D();   // sky, moon, sea
  G = new Layer2D();   // the rings' glow (additive, behind the silhouettes)
  F = new Layer2D();   // silhouettes, splashes, the readout
  rh = new Rhythm();

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const t = f.t, rh = this.rh, e = glideE(t), storm = stormAt(t);
    const c = this.L.ctx, g = this.G.ctx, q = this.F.ctx;
    this.L.clear(HEX.ink); this.G.clear(); this.F.clear();
    const cam = nightCam(t);
    const fuse = clamp((t - FUSE0) / (SUMMIT - FUSE0));

    // the world behind
    const bob = 4 * Math.sin(t * 1.3) * (1 + 2 * storm);
    applyCam(c, cam); applyCam(g, cam);
    nightWorld(c, g, t, rh, { storm, starStorm: storm * 0.6, rough: 0.12 + 0.5 * storm, bob });

    // the rings (glow, behind the silhouettes)
    rings(g, t, rh, { fuse });

    // the vessel, the splashes
    applyCam(q, cam);
    const strokes = VOICES.map((m, i) => {
      const v = rh.voice(m, t);
      if (v.k < 0) return 0.5;
      return v.rate < 5 ? v.frac : (t * 3.6 + i * 0.31) % 1; // past five strokes a second: a hard, steady pull
    });
    vessel(q, t, { strokes, bob, tilt: 0.012 * Math.sin(t * 0.9) * (1 + 3 * storm) });
    splashes(q, t, rh);
    flyingFish(q, t, 2.3);
    if (fuse > 0) { q.save(); q.globalAlpha = ease.inQuad(fuse); q.shadowColor = HEX.gold; q.shadowBlur = 16; fuseCurve(q, HOLE.x, HOLE.y, fuse, 1, 4); q.restore(); }
    q.setTransform(1, 0, 0, 1, 0, 0);
    wind(q, t, storm * 0.8);
    this.readout(q, t);

    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    comp.draw(renderer, this.F.upload(), out);
    return {
      bloom: 0.8 + 0.5 * e,
      fade: 1 - smoothstep(0, 1.6, t),
      vignette: 0.45,
    };
  }

  /** The instrument: each voice's ratio and its rate, beats a minute becoming hertz. */
  readout(q: CanvasRenderingContext2D, t: number) {
    const a = smoothstep(1.2, 2.4, t) * (1 - smoothstep(SUMMIT - 0.5, SUMMIT - 0.05, t));
    if (a <= 0) return;
    q.save();
    q.globalAlpha = a;
    const x0 = 96, y0 = H - 168;
    q.fillStyle = 'rgba(10,7,19,0.6)';
    q.beginPath(); q.roundRect(x0 - 24, y0 - 20, 470, 104, 14); q.fill();
    q.textAlign = 'left'; q.textBaseline = 'alphabetic';
    q.font = font(FAM.mono(), 18); q.fillStyle = rgbaHex(HEX.bone, 0.55);
    q.fillText('PADDLES  4 : 5 : 6', x0, y0 + 6);
    VOICES.forEach((m, i) => {
      const x = x0 + i * 150, rate = this.rh.voice(m, t).rate;
      q.font = font(FAM.monoB(), 34); q.fillStyle = VCOL[i]!;
      q.fillText(String(m), x, y0 + 46);
      q.font = font(FAM.mono(), 22); q.fillStyle = rgbaHex(HEX.bone, 0.85);
      q.fillText(rate < 20 ? `${Math.round(rate * 60)}/min` : `${Math.round(rate)} Hz`, x + 30, y0 + 44);
    });
    q.restore();
  }
}
