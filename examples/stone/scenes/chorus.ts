// CHORUS x3 (params n = 1, 2, 3; the final chorus is `finale`). Four shots, one per line, each cut on the beat at
// or before the line's first word, all on the seabed (his direction: real environments, Rai acts):
//   1 "I'm the stone at the bottom of the sea": the chorus's signature sunburst behind her, framed by the sand,
//     reeds and fish; STONE / BOTTOM / SEA slam; she performs it (n1 joy, n2 sassy, n3 fierce) and pops chibi on SEA.
//   2 "nobody's seen me but everybody believes": on "nobody's seen me" she turns to a dotted outline (smug: you can't
//     see me); on "everybody believes" lanterns gather on the surface far above and their beams find her (wow, joy).
//   3 "if you can count a thing you can't even see": a driftwood sign staked in the sand counts her value; her outline
//     stands invisible beside it; on "can't even see" her chibi face pokes out, smug.
//   4 "who else is waiting at the bottom of the sea?": the camera pulls back over a seabed of other stones; their
//     hearts light (n1 a few; n2 one brighter, the woman up the road; n3 many: the zeros begin to glow). The shark.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { HEX } from '../engine/palette';
import { font } from '../engine/type';
import type { Line } from '../engine/lyrics';
import { clamp, ease, lerp } from '../engine/util';
import { drawRai, h01, type Face, type ArmPose } from './_rai';
import { FAM, TAU, karaoke, rgbaHex, slam, stone, sunburst, halftone } from './_motifs';
import { seabed, seabedFront, reed, fishSchool } from './_world';
import { focusLines, poof } from './_manga';
import { mergePost, punch, hitShake } from './_post';

const BURST: Record<number, [string, string]> = { 1: [HEX.cyan, '#1aa9d6'], 2: [HEX.pink, '#d93a82'], 3: [HEX.yellow, HEX.lime] };
const ACT: Record<number, { face: Face; arms: [ArmPose, ArmPose] }> = {
  1: { face: 'joy', arms: ['up', 'up'] },
  2: { face: 'sassy', arms: ['hip', 'wave'] },
  3: { face: 'fierce', arms: ['fist', 'fist'] },
};

export default class Chorus extends Scene {
  L = new Layer2D();
  G = new Layer2D(); // glow, composited additively so it blooms
  n = 1;
  lines: Line[] = [];
  cuts: number[] = [];

  override init() {
    const { lyrics, audio: au, start, end, params } = this.ctx;
    this.n = Number(params.n ?? 1);
    // the chorus's own lines: those whose first word falls in the window
    this.lines = lyrics.lines.filter((l) => l.words[0]!.start >= start - 0.1 && l.words[0]!.start < end).slice(0, 4);
    this.cuts = this.lines.map((l, i) => (i === 0 ? start : au.timeOfBeat(Math.floor(au.beatAt(l.words[0]!.start + 0.02)))));
  }

  /** A soft dark band under the karaoke, so it reads on the bright sand. */
  band(c: CanvasRenderingContext2D) {
    const g = c.createLinearGradient(0, H - 190, 0, H);
    g.addColorStop(0, 'rgba(8,14,32,0)'); g.addColorStop(0.45, 'rgba(8,14,32,0.55)'); g.addColorStop(1, 'rgba(8,14,32,0.78)');
    c.fillStyle = g; c.fillRect(0, H - 190, W, 190);
  }

  word(line: Line, re: RegExp, nth = 0) {
    return line.words.filter((w) => re.test(w.w.toLowerCase()))[nth] ?? line.words[0]!;
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t, n = this.n;
    this.L.clear(HEX.ink); this.G.clear();
    const shot = Math.max(0, this.cuts.filter((x) => t >= x).length - 1);
    const line = this.lines[shot]!;
    const s0 = this.cuts[shot]!, lt = t - s0;
    let post: PostOverrides = { bloom: 0.7 };

    if (shot === 0) {
      // 1: the sunburst behind her, the seabed framing it
      const [ca, cb] = BURST[n] ?? BURST[1]!;
      sunburst(c, W * 0.34, H * 0.5, ca!, cb!, 16, t * 0.12);
      halftone(c, rgbaHex(HEX.ink, 0.18), 26, 'down');
      c.fillStyle = '#f1dc9e';
      c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 40) c.lineTo(x, H * 0.84 + 10 * Math.sin(x * 0.006 + 1)); c.lineTo(W, H); c.closePath(); c.fill();
      for (let i = 0; i < 9; i++) reed(c, i < 5 ? 30 + i * 70 : W - 30 - (i - 5) * 80, H + 10, 300 + 120 * h01(i, n, 7), t, i, '#1f7a4a', 24);
      fishSchool(c, t, H * 0.2, 0.9, 6, 7 + n, '#ffffff', 0, 0.8);
      const ws = [this.word(line, /stone/), this.word(line, /bottom/), this.word(line, /sea/)];
      const seaT = ws[2]!.start, sd = t >= seaT + 0.02 && t < seaT + 0.75;
      const act = ACT[n] ?? ACT[1]!;
      const hop = n === 1 ? Math.abs(Math.sin((t - s0) * Math.PI * 140 / 60)) * 0.3 : 0;
      if (sd) focusLines(c, W * 0.34, H * 0.5, 170, rgbaHex('#ffffff', 0.8), t);
      drawRai(c, W * 0.34, H * 0.6, 165, {
        t, face: sd ? (n === 3 ? 'fierce' : 'joy') : act.face, arms: act.arms, armsFrom: ['down', 'down'], armsU: clamp(lt / 0.2), sd, hop,
        squash: hop < 0.03 && n === 1 ? -0.25 : 0, glow: HEX.bone, heart: 0.4 + 0.5 * f.a.vocal,
        marks: sd ? ['sparkle'] : n === 2 ? ['shine'] : n === 3 ? ['steam'] : ['sparkle'], markT0: s0 + 0.1, tilt: n === 2 ? 0.1 : 0,
      });
      poof(c, W * 0.34, H * 0.5, 230, t, seaT);
      poof(c, W * 0.34, H * 0.5, 230, t, seaT + 0.75);
      const words = ['STONE', 'BOTTOM', 'SEA'];
      ws.forEach((w, i) => {
        const next = ws[i + 1]?.start;
        slam(c, words[i]!, W * 0.72, H * 0.4, i === 2 ? 300 : 210, t, w.start, { col: HEX.ink, shadow: HEX.bone, shadowOff: 0.05, rot: i % 2 ? 0.05 : -0.04, t1: next !== undefined ? next - 0.02 : undefined, exit: 0.05, maxW: W * 0.5 });
      });
      this.band(c);
      karaoke(c, line, t, W / 2, H - 92, 50);
      post = mergePost(post, punch(t, ws.map((w) => w.start), 0.03), hitShake(t, [seaT], 5, 0.3));
    } else if (shot === 1) {
      // 2: nobody's seen me / but everybody believes
      seabed(c, t, { depth: 0.55, clues: ['stone', 'shells'], seed: 2 + n });
      const seenW = this.word(line, /seen/), believes = this.word(line, /every/).start;
      const unseen = clamp((t - seenW.start) / 0.35) * (1 - clamp((t - believes) / 0.5));
      const lights = clamp((t - believes) / 0.8);
      // the believers: lanterns gathering on the surface far above, their beams finding her
      for (let i = 0; i < 24; i++) {
        const x = W * (0.1 + 0.8 * h01(i, 501 + n)), a = lights * clamp((t - believes - 0.04 * i) / 0.3);
        if (a <= 0) continue;
        const gr = g.createLinearGradient(x, 0, W * 0.5, H * 0.55);
        gr.addColorStop(0, rgbaHex(HEX.gold, 0.45 * a)); gr.addColorStop(1, rgbaHex(HEX.gold, 0));
        g.strokeStyle = gr; g.lineWidth = 3;
        g.beginPath(); g.moveTo(x, 20); g.lineTo(W * 0.5, H * 0.55); g.stroke();
        g.fillStyle = rgbaHex(HEX.gold, 0.9 * a);
        g.beginPath(); g.arc(x, 20 + 5 * Math.sin(t * 2 + i), 7, 0, TAU); g.fill();
      }
      c.save();
      c.globalAlpha = 1 - 0.9 * unseen;
      drawRai(c, W * 0.5, H * 0.6, 140, {
        t, face: lights > 0.3 ? (lights > 0.8 ? 'joy' : 'wow') : unseen > 0.2 ? 'smug' : 'smile',
        arms: lights > 0.5 ? ['up', 'up'] : unseen > 0.2 ? ['cross', 'cross'] : ['down', 'down'],
        glow: lights > 0 ? HEX.gold : HEX.cyan, glowStrength: 0.6 + lights, heart: lights,
        marks: lights > 0.8 ? ['sparkle'] : [], markT0: believes + 0.6, hop: lights > 0.8 ? 0.15 * Math.abs(Math.sin(t * 7)) : 0,
      });
      c.restore();
      if (unseen > 0.05) { // where she is, dotted
        c.save(); c.setLineDash([6, 14]); c.lineWidth = 4; c.strokeStyle = rgbaHex(HEX.bone, 0.75 * unseen);
        c.beginPath(); c.arc(W * 0.5, H * 0.6, 140, 0, TAU); c.stroke();
        c.beginPath(); c.arc(W * 0.5, H * 0.6 - 168, 104, 0, TAU); c.stroke(); c.restore();
      }
      seabedFront(c, t, { seed: 2 + n });
      slam(c, "NOBODY'S SEEN ME", W * 0.5, H * 0.16, 96, t, this.word(line, /nobody/).start, { fam: FAM.cond(), col: HEX.bone, shadow: HEX.ink, t1: believes - 0.05, exit: 0.1 });
      slam(c, 'EVERYBODY BELIEVES', W * 0.5, H * 0.16, 120, t, believes, { col: HEX.gold, shadow: HEX.ink });
      this.band(c);
      karaoke(c, line, t, W / 2, H - 92, 50);
      post = mergePost(post, punch(t, [believes], 0.03));
    } else if (shot === 2) {
      // 3: the driftwood counter in the sand and her invisible outline
      seabed(c, t, { depth: 0.65, clues: ['coin', 'shells'], seed: 9 + n });
      const countW = this.word(line, /count/), seeW = this.word(line, /see/);
      const roll = ease.outExpo(clamp((t - countW.start) / Math.max(0.3, seeW.start - countW.start)));
      c.fillStyle = '#7a5a3a';
      c.fillRect(W * 0.58, H * 0.46, 22, H * 0.36); c.fillRect(W * 0.9, H * 0.46, 22, H * 0.36);
      c.fillStyle = '#9b7652'; c.beginPath(); c.roundRect(W * 0.53, H * 0.3, W * 0.42, H * 0.24, 18); c.fill();
      c.strokeStyle = '#6b4c30'; c.lineWidth = 3;
      for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(W * 0.54, H * (0.34 + k * 0.05)); c.lineTo(W * 0.94, H * (0.345 + k * 0.05)); c.stroke(); }
      const v = Math.floor(roll * 1_000_000), txt = v.toLocaleString('en-GB');
      g.font = font(FAM.monoB(), 112); g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = rgbaHex(HEX.lime, 0.95); g.fillText(txt, W * 0.74, H * 0.4);
      c.font = font(FAM.monoB(), 24); c.textAlign = 'center'; c.fillStyle = 'rgba(40,24,10,0.85)';
      c.fillText('VALUE OF ONE STONE NOBODY HAS SEEN', W * 0.74, H * 0.5);
      const peek = clamp((t - seeW.start) / 0.2);
      c.save(); c.setLineDash([8, 12]); c.lineWidth = 5; c.strokeStyle = rgbaHex(HEX.bone, 0.8);
      c.beginPath(); c.arc(W * 0.27, H * 0.66, 150, 0, TAU); c.stroke();
      c.beginPath(); c.arc(W * 0.27, H * 0.66 - 180, 111, 0, TAU); c.stroke(); c.restore();
      if (peek > 0) {
        c.save(); c.translate(W * 0.27 + 120 * (1 - peek), H * 0.42); c.rotate(-0.3 * (1 - peek) + 0.15);
        drawRai(c, 0, 0, 55, { t, face: 'smug', sd: true, arms: ['down', 'shrug'], marks: ['shine'], markT0: seeW.start + 0.15 });
        c.restore();
      }
      seabedFront(c, t, { seed: 9 + n });
      slam(c, 'COUNT', W * 0.74, H * 0.18, 170, t, countW.start, { col: HEX.lime, shadow: HEX.ink });
      this.band(c);
      karaoke(c, line, t, W / 2, H - 92, 50, { sung: HEX.lime });
      post = mergePost(post, punch(t, [countW.start], 0.035), hitShake(t, [countW.start], 4, 0.25));
    } else {
      // 4: who else is waiting at the bottom of the sea? The pull back over the waiting stones
      const pull = ease.inOutCubic(clamp(lt / 3.2));
      post.zoom = lerp(1.2, 1, pull);
      seabed(c, t, { depth: 0.85, clues: ['anchor', 'shells'], seed: 4 });
      const nStones = 30, glowN = n === 1 ? 5 : n === 2 ? 9 : 20;
      const order = Array.from({ length: nStones }, (_, i) => i).sort((a, b) => h01(a, 601) - h01(b, 601));
      const waiting = this.word(line, /waiting/).start;
      const placed = order.map((i) => ({ i, depth: h01(i, 602) })).sort((a, b) => a.depth - b.depth);
      for (const { i, depth } of placed) {
        const k = order.indexOf(i);
        const x = W * (0.04 + 0.92 * h01(i, 603)), y = H * (0.6 + 0.24 * depth), r = 14 + 34 * depth;
        if (Math.abs(x - W * 0.5) < 160 && y < H * 0.82) continue;   // her space
        const lit = k < glowN ? clamp((t - waiting - 0.08 * k) / 0.6) : 0;
        const brighter = n === 2 && k === 0 ? 1.6 : 1;
        stone(c, x, y, r, { seed: i, tilt: (h01(i, 604) - 0.5) * 0.4, heart: lit > 0 ? HEX.pink : undefined, heartA: Math.min(1, 0.7 * lit * brighter), glow: lit > 0 ? HEX.pink : undefined, glowA: 0.4 * lit });
        if (lit > 0) { g.fillStyle = rgbaHex(HEX.pink, 0.25 * lit * brighter); g.beginPath(); g.arc(x, y, r * 0.5, 0, TAU); g.fill(); }
      }
      const wow = t > waiting + 0.5;
      drawRai(c, W * 0.5, H * 0.58, 100, { t, face: wow ? 'wow' : 'soft', arms: wow ? ['cheek', 'cheek'] : ['down', 'down'], glow: HEX.pink, heart: 0.6, marks: wow ? ['!'] : [], markT0: waiting + 0.5 });
      seabedFront(c, t, { seed: 4 });
      slam(c, 'WHO ELSE', W * 0.5, H * 0.16, 150, t, this.word(line, /who/).start, { col: HEX.pink, shadow: HEX.ink });
      this.band(c);
      karaoke(c, line, t, W / 2, H - 92, 50, { sung: HEX.pink });
      post = mergePost(post, punch(t, [this.word(line, /who/).start], 0.02));
    }
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    return mergePost(post, { zoom: 1 + 0.008 * f.a.kick });
  }
}
