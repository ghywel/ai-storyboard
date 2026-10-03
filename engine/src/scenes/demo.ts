// The demo plate (takes/demo, made by tools/make-demo-take.py): a small worked example of the method in one file.
//   - A real environment, not a gradient slide: a rooftop at dusk with a city behind, layered back to front, and
//     something alive (the lit windows flicker, a bird crosses).
//   - A clue in the background: a clock on the tower that reads the plate's own time (foreshadowing in miniature).
//   - Cuts on the beat at or before a line's first word (the plate finds its lines by content, never by hard-coded
//     times); a hard cut every 2 beats inside the line.
//   - The lyric readable at all times: word-by-word karaoke in a dark band; one word slammed per line.
//   - A faceless silhouette that emotes on the words; manga lines of force on the slam.
//   - The compositor's touch, with restraint: one capped shake and a small punch on the slam, a bloom on the glow layer.
// params.look (0 or 1) picks the colourway, so one scene file can serve two plates.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { HEX } from '../engine/palette';
import type { Line } from '../engine/lyrics';
import { clamp } from '../engine/util';
import { h01 } from './_hash';
import { gradientV, sunburst, karaoke, slam, person, rgbaHex, TAU } from './_motifs';
import { focusLines } from './_manga';
import { hitShake, punch, mergePost } from './_post';

export default class Demo extends Scene {
  L = new Layer2D();
  G = new Layer2D();   // glow: composited additively, so it blooms
  lines: Line[] = [];
  cuts: number[] = [];

  override init() {
    const { lyrics, audio: au, start, end } = this.ctx;
    this.lines = lyrics.lines.filter((l) => l.words[0]!.start >= start - 0.1 && l.words[0]!.start < end);
    // a cut every 2 beats from the plate's start
    for (let b = Math.ceil(au.beatAt(start) - 1e-6); au.timeOfBeat(b) < end; b += 2) this.cuts.push(au.timeOfBeat(b));
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, params } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t, look = Number(params.look ?? 0);
    this.L.clear(HEX.ink); this.G.clear();
    const shot = Math.max(0, this.cuts.filter((x) => t >= x).length - 1);
    const line = this.lines.find((l) => t >= l.words[0]!.start - 0.4 && t <= l.end + 0.35) ?? null;
    // the line's last word, its rhyme, gets the slam (in a pop lyric that is where the line lands)
    const slamWord = line?.words[line.words.length - 1];

    // the environment: sky, sun, the city in two layers, the rooftop
    const sky = look ? ['#2b1640', '#ff8a2a'] : ['#0f1a3a', '#c65cf0'];
    gradientV(c, sky[0]!, sky[1]!);
    if (shot % 2 === 1) { c.save(); c.globalAlpha = 0.3; sunburst(c, W * 0.5, H * 0.4, HEX.ember, HEX.signal, 18, t * 0.1); c.restore(); }
    c.fillStyle = HEX.ember; c.beginPath(); c.arc(W * 0.5, H * 0.4, 110, 0, TAU); c.fill();   // no glow: the glow layer sits over everything
    for (const [layer, col, base] of [[0, '#3a2350', 0.58], [1, '#1c1230', 0.68]] as const) {
      c.fillStyle = col;
      for (let i = 0; i < 18; i++) {
        const x = i * (W / 17) - 40 - layer * 30, w = 70 + 60 * h01(i, layer, 1), h = 120 + 260 * h01(i, layer, 2);
        c.fillRect(x, H * base - h, w, h + H);
        if (layer === 1) for (let k = 0; k < 6; k++) { // lit windows, flickering on the hats
          const on = h01(i, k, Math.floor(t * 2 + f.a.hat)) > 0.55;
          if (!on) continue;
          const wx = x + 12 + (k % 2) * 30, wy = H * base - h + 20 + Math.floor(k / 2) * 40;
          c.fillStyle = '#ffd98a'; c.fillRect(wx, wy, 14, 18);
          g.fillStyle = rgbaHex('#ffd98a', 0.25); g.fillRect(wx - 6, wy - 6, 26, 30);
          c.fillStyle = col;
        }
      }
    }
    // the clue: a clock on the tower, reading the plate's own time
    const cx = W * 0.82, cy = H * 0.3;
    c.fillStyle = '#1c1230'; c.fillRect(cx - 40, cy - 20, 80, H);
    c.fillStyle = '#f4efe1'; c.beginPath(); c.arc(cx, cy, 34, 0, TAU); c.fill();
    c.strokeStyle = '#1c1230'; c.lineWidth = 4; c.lineCap = 'round';
    const m = (t / 60) * TAU, hh = (t / 720) * TAU;
    c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + 26 * Math.sin(m), cy - 26 * Math.cos(m)); c.moveTo(cx, cy); c.lineTo(cx + 16 * Math.sin(hh), cy - 16 * Math.cos(hh)); c.stroke();
    // something alive: a bird crossing
    const bx = ((t * 120) % (W + 200)) - 100, by = H * 0.2 + 20 * Math.sin(t * 2);
    c.strokeStyle = '#1c1230'; c.lineWidth = 4; c.beginPath(); c.moveTo(bx - 14, by - 6 * Math.sin(t * 12)); c.lineTo(bx, by); c.lineTo(bx + 14, by - 6 * Math.sin(t * 12)); c.stroke();
    // the rooftop and the figure, who emotes on the slammed word
    c.fillStyle = '#0b0714'; c.fillRect(0, H * 0.78, W, H);
    const slammed = slamWord && t >= slamWord.start;
    const x0 = shot % 2 ? W * 0.62 : W * 0.32;
    const burst = slamWord ? clamp(1 - (t - slamWord.start) / 0.45) : 0;   // lines of force: a flash, not a wallpaper
    if (slammed && burst > 0) focusLines(c, x0, H * 0.6, 260, rgbaHex(HEX.bone, 0.55 * burst), t);
    person(c, x0, H * 0.78, 300, slammed ? 'cheer' : 'stand', { col: '#0b0714', rim: rgbaHex(sky[1]!, 0.9), t, emote: slammed ? 'joy' : undefined, emoteT0: slamWord?.start });

    // the lyric: one word slammed, the line as karaoke in a dark band
    let post: PostOverrides = { bloom: 0.6 };
    if (line && slamWord) {
      slam(c, slamWord.w.replace(/[^A-Za-z']/g, '').toUpperCase(), W * 0.5, H * 0.24, 200, t, slamWord.start, { col: HEX.bone, shadow: HEX.ink });
      const band = c.createLinearGradient(0, H - 190, 0, H);
      band.addColorStop(0, 'rgba(8,6,16,0)'); band.addColorStop(1, 'rgba(8,6,16,0.8)');
      c.fillStyle = band; c.fillRect(0, H - 190, W, 190);
      karaoke(c, line, t, W / 2, H - 92, 52);
      post = mergePost(post, punch(t, [slamWord.start], 0.025), hitShake(t, [slamWord.start], 5, 0.3));
    }
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    return mergePost(post, { zoom: 1 + 0.006 * clamp(f.a.kick) });
  }
}
