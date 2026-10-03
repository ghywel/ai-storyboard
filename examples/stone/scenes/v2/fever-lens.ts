// The three bedroom plates' camera lens (fever, dollhouse, dream): one GPU pass that composites the soft background
// layer, the sharp main layer and the glow layer, and can ripple and blur the whole frame for the fever's dream
// transitions ("the fever blurs into the doll's house", "a dream ripple"). The lyric band at the bottom is left alone
// so the words stay readable through any ripple.
//
// `SoftLayer` is a cheap depth of field: a background drawn into a quarter-resolution canvas, blurred there, and
// upscaled by the GPU, behind a sharp foreground (the doll's house against the huge soft lamp; the ledger book
// against the room).
import * as THREE from 'three';
import { FSPass, Layer2D, W, H } from '../../engine/gl';

const FRAG = /* glsl */ `
uniform sampler2D uL; uniform sampler2D uG; uniform sampler2D uB;
uniform float useB; uniform float amp; uniform float blur; uniform float time; uniform float gTint; uniform vec2 res;
uniform float keepY; uniform float warm;
vec3 lensTap(vec2 uv) {
  vec4 l = texture(uL, uv);
  vec3 col = l.rgb * l.a;
  if (useB > 0.5) { vec4 b = texture(uB, uv); col += b.rgb * (1.0 - l.a); }
  vec4 g = texture(uG, uv);
  col += g.rgb * g.a * gTint;
  return col;
}
void main() {
  vec2 uv = vUv;
  float keep = smoothstep(keepY - 0.06, keepY + 0.06, uv.y);   // the lyric band (bottom) stays still and sharp
  float a = amp * keep;
  vec2 d = uv - 0.5; vec2 da = d * vec2(res.x / res.y, 1.0); float r = length(da);
  // a dream ripple: rings running out from the centre, and a slow horizontal heat-wobble
  vec2 dir = r > 1e-4 ? d / max(1e-4, length(d)) : vec2(0.0);
  uv += a * (dir * sin(r * 38.0 - time * 7.0) * 0.010 + vec2(sin(uv.y * 26.0 + time * 4.0) * 0.006, cos(uv.x * 19.0 + time * 3.1) * 0.003));
  float bl = blur * keep;
  vec3 acc;
  if (bl > 0.25) {
    acc = vec3(0.0);
    for (int i = 0; i < 20; i++) {
      float fi = float(i);
      float ang = fi * 2.39996323;
      float rr = sqrt((fi + 0.5) / 20.0);
      acc += lensTap(uv + vec2(cos(ang), sin(ang)) * rr * bl / res);
    }
    acc /= 20.0;
  } else acc = lensTap(uv);
  // a fever's warm haze (the transition's bloom of light)
  acc += warm * vec3(0.55, 0.32, 0.18) * (1.0 - r * 1.2);
  fragColor = vec4(max(acc, vec3(0.0)), 1.0);
}`;

export interface LensOpts { amp?: number; blur?: number; t?: number; warm?: number; gTint?: number }

export class Lens {
  pass = new FSPass(FRAG, {
    uL: { value: null }, uG: { value: null }, uB: { value: null }, useB: { value: 0 }, amp: { value: 0 }, blur: { value: 0 },
    time: { value: 0 }, gTint: { value: 2.2 }, res: { value: new THREE.Vector2(W, H) }, keepY: { value: 0.27 }, warm: { value: 0 },
  });
  /** Composite B (optional, behind), L (over it) and G (added) into `out`, with a ripple `amp` (0..1) and `blur` (px). */
  draw(renderer: THREE.WebGLRenderer, out: THREE.WebGLRenderTarget, L: THREE.Texture, G: THREE.Texture, B: THREE.Texture | null, o: LensOpts = {}) {
    const u = this.pass.u;
    u.uL!.value = L; u.uG!.value = G; u.uB!.value = B ?? L; u.useB!.value = B ? 1 : 0;
    u.amp!.value = o.amp ?? 0; u.blur!.value = o.blur ?? 0; u.time!.value = o.t ?? 0; u.warm!.value = o.warm ?? 0; u.gTint!.value = o.gTint ?? 2.2;
    this.pass.render(renderer, out);
  }
}

/**
 * A soft background: draw into `ctx` (logical px, quarter resolution), then `upload(blurPx)` blurs it into a second
 * small canvas and returns its texture. Blur happens at quarter resolution, so it is cheap at any output scale.
 */
export class SoftLayer {
  A = new Layer2D(W, H, 0.25);
  B = new Layer2D(W, H, 0.25);
  get ctx() { return this.A.ctx; }
  clear(col?: string) { this.A.clear(col); }
  upload(blurPx = 10) {
    const b = this.B.ctx;
    this.B.clear('#000');
    b.save(); b.setTransform(1, 0, 0, 1, 0, 0); b.filter = `blur(${blurPx}px)`;
    b.drawImage(this.A.canvas, -blurPx, -blurPx, W + 2 * blurPx, H + 2 * blurPx);   // a touch oversized: no dark rim
    b.restore(); b.filter = 'none';
    return this.B.upload();
  }
}
