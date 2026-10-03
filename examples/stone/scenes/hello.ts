// HELLO (29.70-33.13, the spoken intro, lines 0-1). One long hold on the seabed where the stone came to rest (the
// same place, the same years on it: the half-buried stone, the anchor, the drift of sand, the reeds), no cuts:
//   - Dark. Two amber eyes open (a slit of light widening).
//   - "Hi.": her heart flicks on like a torch: a big cheeky HI. (grin, a hand on her hip and a wave, a little hop out
//     of the sand); HI. slams with a punch.
//   - "You can't see me.": click, the light goes off again: only the eyes, darting about, cheeky. (We can't.)
//   - Her heart glows up for real and its light spreads over the seabed around her: the sand, the reeds, the fish
//     who come to see.
//   - "That's kind of the whole point.": smug, hands on hips, a sassy lean; she winks and points on "whole point",
//     then pops into a chibi, very pleased with herself.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { HEX } from '../engine/palette';
import type { Line } from '../engine/lyrics';
import { clamp, ease, keys, smoothstep } from '../engine/util';
import { drawRai, h01, type ArmPose, type Face } from './_rai';
import { gradientV, rgbaHex, slam, spoken } from './_motifs';
import { fish, seabedFront } from './_world';
import { poof, puff } from './_manga';
import { mergePost, punch } from './_post';
import { FLOOR, REST, TL_OFF, restBed, restReeds, sandDrift } from './sinking-deep';

/** Rai's eyes relative to her disc centre (drawRai's geometry: 1.2377 R up, 0.322 R either side). */
const EYE_UP = 1.2377, EYE_DX = 0.322;

export default class Hello extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  F = new Layer2D();
  M = new Layer2D(); // the darkness, with holes where there is light (drawn into L, never uploaded)
  hi!: Line; hiRest!: Line; point!: Line;

  override init() {
    const { lyrics } = this.ctx;
    this.hi = lyrics.get('Hi. You can');
    // "Hi." is slammed; the rest of the line is said in Cormorant
    const rest = this.hi.words.slice(1);
    this.hiRest = { ...this.hi, words: rest, start: rest[0]!.start, text: rest.map((w) => w.w).join(' ') };
    this.point = lyrics.get('whole point');
  }

  w(line: Line, re: RegExp) { return line.words.find((x) => re.test(x.w.toLowerCase())) ?? line.words[0]!; }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const t = f.t, c = this.L.ctx, g = this.G.ctx, q = this.F.ctx, m = this.M.ctx;
    this.L.clear(HEX.ink); this.G.clear(); this.F.clear(); this.M.clear();
    const tl = t + TL_OFF; // the seabed's own clock, as the time-lapse left it
    const hiW = this.hi.words[0]!, youW = this.hi.words[1]!, meW = this.w(this.hi, /me/);
    const thatW = this.point.words[0]!, wholeW = this.w(this.point, /whole/), pointW = this.w(this.point, /point/);
    const open0 = hiW.start - 0.16;                                   // the eyes open just before "Hi."
    const open = ease.outCubic(clamp((t - open0) / 0.12));
    const torch = clamp((t - (hiW.start - 0.03)) / 0.05) * (1 - clamp((t - (youW.start + 0.02)) / 0.06)); // the cheeky flash of light
    const heart = smoothstep(meW.end + 0.05, meW.end + 0.45, t);     // her heart, for real
    const rise = ease.inOutCubic(clamp((t - meW.end - 0.1) / (thatW.start - meW.end + 0.15)));
    const sdAt = pointW.end - 0.02;
    const sd = t >= sdAt;

    // her acting, beat by beat
    let face: Face = 'asleep', arms: [ArmPose, ArmPose] = ['down', 'down'], from: [ArmPose, ArmPose] = ['down', 'down'], armsT = 0, tilt = 0, look = 0;
    let hop = 0, squash = 0;
    const marks: ('sparkle' | 'shine')[] = [];
    let markT0 = -1e9;
    if (t >= open0) face = 'smile';
    if (t >= hiW.start - 0.03 && t < youW.start + 0.02) { // HI!
      face = 'grin'; arms = ['hip', 'wave']; armsT = hiW.start - 0.03;
      const u = clamp((t - hiW.start) / 0.3);
      hop = 0.3 * Math.sin(Math.PI * u); squash = u <= 0 ? -0.25 : u >= 1 ? -0.2 * (1 - clamp((t - hiW.start - 0.3) / 0.1)) : 0.15;
      marks.push('sparkle'); markT0 = hiW.start;
    } else if (t >= youW.start + 0.02 && t < meW.end + 0.3) { // you can't see me: the eyes dart about in the dark
      face = 'cheeky'; arms = ['hip', 'hip']; from = ['hip', 'wave']; armsT = youW.start;
      look = Math.sin((t - youW.start) * 9) > 0 ? 0.9 : -0.9;
    } else if (t >= meW.end + 0.3 && t < thatW.start) {
      face = 'soft'; arms = ['down', 'down']; from = ['hip', 'hip']; armsT = meW.end + 0.3;
    } else if (t >= thatW.start && t < wholeW.start) { // smug, hands on hips, a sassy lean
      face = 'smug'; arms = ['hip', 'hip']; from = ['down', 'down']; armsT = thatW.start;
      tilt = 0.1 * ease.outBack(clamp((t - thatW.start) / 0.25)); marks.push('shine'); markT0 = thatW.start + 0.05;
    } else if (t >= wholeW.start) { // the wink and the point
      face = sd ? 'smug' : 'wink'; arms = ['hip', 'point']; from = ['hip', 'hip']; armsT = wholeW.start;
      tilt = 0.1 - 0.16 * ease.outBack(clamp((t - wholeW.start) / 0.2)); marks.push('sparkle'); markT0 = pointW.start;
    }
    const armsU = clamp((t - armsT) / 0.14);

    // the seabed where she landed, the years on it
    c.setTransform(1, 0, 0, 1, 0, 0);
    restBed(c, tl);
    restReeds(c, tl, 1);
    // the fish come to see her light
    if (rise > 0) for (let i = 0; i < 6; i++) {
      const u = clamp((t - meW.end - 0.1 - 0.12 * i) / 1.4), a = h01(i, 801) * 6.28 + (t - meW.end) * (0.6 + 0.3 * h01(i, 802)) * (i % 2 ? 1 : -1);
      const rr = 260 + 120 * h01(i, 803), far = 1 - ease.outCubic(u);
      const fx = REST.x + Math.cos(a) * rr * 1.3 + far * (i % 2 ? 1100 : -1100), fy = REST.y - 120 + Math.sin(a) * rr * 0.5;
      const dir = far > 0.3 ? (i % 2 ? -1 : 1) : (i % 2 ? -1 : 1) * (Math.sin(a) >= 0 ? -1 : 1);
      fish(c, fx, fy, 14 + 6 * h01(i, 804), ['#ffd23f', '#ff8a2a', '#ffffff'][i % 3]!, dir, t, i);
    }
    const an = drawRai(c, REST.x, REST.y, REST.r, {
      t, face, arms, armsFrom: from, armsU, sd, tilt, look, hop, squash, noBlink: true,
      heart: sd ? 1 : Math.max(heart, 0.9 * torch), glow: HEX.cyan, glowStrength: 0.2 + 0.9 * Math.max(rise, torch),
      marks, markT0,
    });
    poof(c, an.head.x, an.head.y + 40, REST.r * 1.4, t, sdAt);
    sandDrift(c, 1);
    // she hops out of the sand: a puff where she lands
    const land = t - (hiW.start + 0.3);
    if (land > 0 && land < 0.5) for (const s of [-1, 1]) puff(c, REST.x + s * (90 + 120 * land), FLOOR + 30 - 30 * land, 30 + 40 * land, `rgba(240,222,170,${0.8 * (1 - land / 0.5)})`);
    seabedFront(c, tl, { floor: FLOOR });

    // the darkness: everywhere, except her eyes, the torch of "Hi.", and her heart's light spreading
    const dark = keys(t, [[this.ctx.start, 0.985], [meW.end + 0.1, 0.975], [thatW.start + 0.4, 0.3], [this.ctx.end, 0.22]]);
    m.setTransform(1, 0, 0, 1, 0, 0);
    m.fillStyle = `rgba(4,8,22,${dark})`; m.fillRect(0, 0, W, H);
    m.globalCompositeOperation = 'destination-out';
    const ex = REST.x, ey = REST.y - (EYE_UP + hop) * REST.r;
    if (open > 0 && !sd) for (const s of [-1, 1]) hole(m, ex + s * EYE_DX * REST.r + look * 6, ey, 30, 26 * open, 1);
    if (torch > 0) hole(m, an.heart.x, an.heart.y - 60, 430, 420, 0.92 * torch);
    if (rise > 0) hole(m, REST.x, REST.y - 40, 80 + 1500 * rise, 70 + 1000 * rise, 0.95);
    if (heart > 0) hole(m, an.heart.x, an.heart.y, 60, 60, heart);
    m.globalCompositeOperation = 'source-over';
    c.drawImage(this.M.canvas, 0, 0, W, H);

    // glows: the amber eyes in the dark, the heart's light
    if (open > 0 && !sd) for (const s of [-1, 1]) glow(g, ex + s * EYE_DX * REST.r + look * 6, ey, 24, '#fab852', 0.55 * open * (1 - 0.8 * Math.max(rise, torch)));
    const hp = Math.max(heart, torch);
    if (hp > 0) glow(g, an.heart.x, an.heart.y, 70, HEX.pink, 0.28 * hp);

    // the words: HI. slams; the rest is said in Cormorant, on a dark band
    gradientV(q, 'rgba(4,8,22,0)', 'rgba(4,8,22,0.7)', 0, H - 260, W, 260);
    slam(q, 'HI.', W / 2, 205, 230, t, hiW.start, { col: HEX.bone, shadow: HEX.pink, shadowOff: 0.05, rot: -0.04, t1: thatW.start - 0.12, exit: 0.25 });
    spoken(q, this.hiRest, t, W / 2, H - 112, 66);
    spoken(q, this.point, t, W / 2, H - 112, 66);
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    comp.draw(renderer, this.F.upload(), out);
    return mergePost({ bloom: 0.85, vignette: 0.6 - 0.2 * rise }, punch(t, [hiW.start, pointW.start], 0.03, 0.35));
  }
}

/** Remove darkness: a soft elliptical hole (destination-out). */
function hole(m: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, a: number) {
  if (a <= 0 || ry <= 0.5) return;
  m.save();
  m.translate(x, y); m.scale(1, ry / rx);
  const gr = m.createRadialGradient(0, 0, 0, 0, 0, rx);
  gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(0.55, `rgba(0,0,0,${a * 0.8})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
  m.fillStyle = gr; m.fillRect(-rx, -rx, 2 * rx, 2 * rx);
  m.restore();
}
function glow(g: CanvasRenderingContext2D, x: number, y: number, r: number, col: string, a: number) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, rgbaHex(col, a)); gr.addColorStop(1, rgbaHex(col, 0));
  g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
}
