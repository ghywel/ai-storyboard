// VERSE 1 (lines 2-9, rapped): Rai tells her own story, playful and proud, and performs it. A hard cut about every
// 2 beats on the beat grid; the line kinetic and centred low; one or two words a line slammed.
//   The legend (lines 2-5) is her pop-up storybook: she opens it on the seabed where "hello" left her, and the quarry
//   pops up off its pages. Each page is a paper world (the quarry on Palau, the map, the crossing, the night sea, the
//   storm and the reef) and she plays herself in it: fierce with her stubborn crew, smug on the raft while others
//   paddle, indignant (chibi) at being lashed, a pained grin as the pole goes through her heart, shocked and flying in
//   the storm, dizzy overboard, deadpan on landing.
//   The present (lines 6-9) is her world: the seabed for the twist (joy, the wink, smug), the island village at sunset
//   for "we know she's down there" (the stone-money bank behind them), the real places of her deals (a staked plot,
//   a feud settled in a hug, a wedding under lanterns), and the richest rock in the street: a chibi strut.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { HEX } from '../engine/palette';
import { font } from '../engine/type';
import type { Line, Word } from '../engine/lyrics';
import type { AudioData } from '../engine/audio';
import { clamp, ease, lerp, pulse } from '../engine/util';
import { drawRai, h01, type ArmPose, type Face } from './_rai';
import { FAM, TAU, type C2, emote, person, rgbaHex, slam, stone, sunburst, halftone } from './_motifs';
import { focusLines, impactBurst, poof, speedLines, star4 } from './_manga';
import { discStone, island, seabed, seabedFront } from './_world';
import { caKick, hitShake, mergePost, punch, whipIn } from './_post';
import { band, beatPh, bolt, cam, canoe, caption, chips, clouds, cutFor, hibiscus, layer, paddler, paperPage, popK, raft, rain, sky, sparkle, speech, twisted, waves, wordOf } from './verse1-kit';
import { book, islet, mapPage, nightSea, quarry, reef } from './verse1-legend';
import { FLOOR, REST, TL_OFF, restBed, restReeds, sandDrift } from './sinking-deep';

interface S { c: C2; g: C2; t: number; lt: number; t0: number; t1: number; f: Frame; au: AudioData; post: PostOverrides[] }
interface Shot { t0: number; t1: number; name: string; draw: (s: S) => void }

/** slam(), kept inside the title-safe frame about its centre x. */
function sl(c: C2, text: string, x: number, y: number, size: number, t: number, t0: number, o: Parameters<typeof slam>[7] = {}) {
  slam(c, text, x, y, size, t, t0, { maxW: Math.min(x - 96, W - 96 - x) * 2 * 0.94, ...o });
}

/** Rai, acting: a shorthand over drawRai with her usual glow. */
function rai(c: C2, x: number, y: number, R: number, t: number, face: Face, arms: ArmPose | [ArmPose, ArmPose], o: Partial<Parameters<typeof drawRai>[4]> = {}) {
  return drawRai(c, x, y, R, { t, face, arms, glow: HEX.cyan, glowStrength: 0.7, ...o });
}

// per line: caption accents and accent colour
const CAP: { accents: string[]; accent: string }[] = [
  { accents: ['palau', 'stubborn'], accent: HEX.orange },
  { accents: ['four', 'hundred', 'stars'], accent: HEX.cyan },
  { accents: ['pole', 'heart'], accent: HEX.pink },
  { accents: ['storm', 'bottom'], accent: HEX.violet },
  { accents: ['twist', 'nobody'], accent: HEX.yellow },
  { accents: ['believing'], accent: HEX.gold },
  { accents: ['land', 'feud', 'wedding'], accent: HEX.lime },
  { accents: ['richest', 'rock'], accent: HEX.gold },
];

export default class Verse1 extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  lines: Line[] = [];
  shots: Shot[] = [];
  show: number[] = [];

  override init() {
    const { lyrics, audio: au, start, end } = this.ctx;
    this.lines = lyrics.lines.filter((l) => l.words[0]!.start >= start - 0.1 && l.words[0]!.start < end);
    const L = this.lines;
    // caption timing: each line shows from 0.4 s before its first word, or from the previous line's end
    this.show = L.map((l, i) => Math.min(l.words[0]!.start, Math.max(l.words[0]!.start - 0.4, i ? L[i - 1]!.end : -1e9)));
    const w = (li: number, re: RegExp, nth = 0) => wordOf(L[li]!, re, nth);
    const cut = (x: Word) => cutFor(au, x, 0.07);
    const lineCut = (li: number) => (li === 0 ? start : cut(L[li]!.words[0]!));
    const beats = (t: number, n: number) => au.timeOfBeat(Math.round(au.beatAt(t)) + n);
    const list: [number, string, (s: S) => void][] = [];
    const add = (t0: number, name: string, fn: (s: S) => void) => list.push([t0, name, fn]);

    // ================================================================ L2 the quarry on Palau
    {
      const they = L[0]!.words[0]!, cutW = w(0, /^cut/), cliffW = w(0, /cliff/), palau = w(0, /palau/), stub = w(0, /stubborn/), crew = w(0, /crew/);
      // 2a: on the seabed where hello left her, she opens her storybook; the quarry pops up off its pages
      add(lineCut(0), 'the storybook', (s) => {
        const { c, t } = s;
        const u = clamp(s.lt / (s.t1 - s.t0)), push = 1 + 0.1 * ease.inOutCubic(u);
        c.save(); cam(c, push, lerp(W / 2, W * 0.44, ease.inOutCubic(u)), H * 0.5);
        // the seabed exactly as hello leaves it (sinking-deep's rest), on its own clock
        const tl = t + TL_OFF;
        restBed(c, tl); restReeds(c, tl, 1); sandDrift(c, 1);
        const bx = W * 0.29, by = H * 0.8, open = ease.outBack(clamp((t - they.start + 0.25) / 0.35), 1.4);
        const top = open > 0.02 ? book(c, bx, by, 760, open) : { x: bx, y: by - 760 * 0.32 * 0.45 };
        // the pop-up: a card of the quarry folding up off the pages on "cut"
        const k = popK(t, cutW.start - 0.12, 0, 0.32);
        if (k > 0) {
          const cw = 640, ch = Math.round(640 * (H * 0.86) / W), cy = top.y + 6;
          c.save();
          c.translate(bx, cy); c.scale(1, k); c.translate(-bx, -cy);
          c.shadowColor = 'rgba(10,6,20,0.45)'; c.shadowOffsetX = 12; c.shadowOffsetY = 10;
          c.fillStyle = '#f6ecd4'; c.fillRect(bx - cw / 2 - 8, cy - ch - 8, cw + 16, ch + 16);
          c.restore();
          c.save();
          c.translate(bx, cy); c.scale(1, k); c.translate(-bx, -cy);
          c.beginPath(); c.rect(bx - cw / 2, cy - ch, cw, ch); c.clip();
          c.translate(bx - cw / 2, cy - ch); c.scale(cw / W, ch / (H * 0.86));
          quarry(c, t, s.au, (i) => popK(t, cutW.start - 0.05, i + 1, 0.3), { groove: 0.55 });
          c.restore();
        }
        const face: Face = t < they.start - 0.1 ? 'smile' : t < cutW.start ? 'cheeky' : 'grin';
        // hello leaves her chibi, hands on hips, pointing: she pops back to herself on the cut and points at the book
        const an = rai(c, REST.x, REST.y, REST.r, t, face, ['point', 'hip'], { armsFrom: ['hip', 'point'], armsU: clamp(s.lt / 0.2), tilt: -0.06, marks: t > cutW.start ? ['sparkle'] : undefined, markT0: cutW.start, look: -0.8, heart: 0.6 });
        poof(c, an.head.x, an.head.y + 40, REST.r * 1.4, t, s.t0);
        seabedFront(c, tl, { floor: FLOOR });
        c.restore();
        s.post.push(punch(t, [cutW.start], 0.02));
      });
      // 2b: inside the book: the quarry, a punch in on "cliff"
      add(beats(lineCut(0), 3), 'the quarry', (s) => {
        const { c, t } = s;
        const z = t > cliffW.start ? 1.14 - 0.03 * clamp((t - cliffW.start) / 0.6) : 1.0 + 0.02 * s.lt;
        c.save(); cam(c, z, W * 0.36, H * 0.5);
        quarry(c, t, s.au, () => 1, { groove: 0.62 + 0.3 * clamp(s.lt / (s.t1 - s.t0)) });
        c.restore();
        paperPage(c, t);
        sl(c, 'PALAU', W * 0.74, H * 0.2, 220, t, palau.start, { col: HEX.ink, shadow: HEX.yellow, rot: -0.04 });
        s.post.push(punch(t, [cliffW.start, palau.start], 0.025));
      });
      // 2c: cut free by the stubborn crew: the rope through her heart, the crew heaving on the beat; fierce and proud
      add(cut(w(0, /shell/)), 'the stubborn crew', (s) => {
        const { c, g, t } = s;
        sky(c, t, W * 0.86, H * 0.5, '#3a2266', '#ffd23f', '#ffb03a', '#fff2b0', 90, 0.06);
        c.fillStyle = '#b4567a'; c.fillRect(0, H * 0.5, W, H * 0.5);
        [[0.7, 60], [0.78, 40], [0.95, 76]].forEach(([u, sz], i) => islet(c, W * u!, H * 0.5 + 4, sz!, '#2f7a5a', '#d0b58a', i + 7));
        // the cliff behind her, with the hollow she was cut from
        c.fillStyle = '#e2b77e';
        c.beginPath(); c.moveTo(W * 0.52, H + 20); c.lineTo(W * 0.54, H * 0.1); c.lineTo(W * 0.66, -20); c.lineTo(W + 20, -20); c.lineTo(W + 20, H + 20); c.fill();
        c.strokeStyle = 'rgba(150,95,50,0.5)'; c.lineWidth = 4;
        for (let k = 0; k < 8; k++) { c.beginPath(); c.moveTo(W * 0.53, H * (0.18 + 0.1 * k)); c.lineTo(W + 20, H * (0.12 + 0.1 * k)); c.stroke(); }
        c.fillStyle = '#5a2f2a'; c.beginPath(); c.arc(W * 0.8, H * 0.42, 190, 0, TAU); c.fill();
        c.fillStyle = '#7a4a3a'; c.beginPath(); c.arc(W * 0.8 + 12, H * 0.42 + 8, 160, 0, TAU); c.fill();
        // the ledge
        c.fillStyle = '#4a2a3a'; c.fillRect(0, H * 0.84, W, H * 0.2);
        const free = clamp((t - crew.start) / 0.25), hop = 0.45 * Math.sin(Math.PI * clamp((t - crew.start) / 0.45));
        const rx = lerp(W * 0.74, W * 0.66, ease.outCubic(free)), R = 150, ry = H * 0.84 - 1.07 * R;
        // the crew on the rope, heaving back on every beat; cheering when she comes free
        const heave = Math.pow(1 - beatPh(s.au, t), 3);
        for (let i = 0; i < 5; i++) {
          const x = W * (0.06 + 0.085 * i), y = H * 0.84;
          if (free < 1) {
            const lean = -0.16 - 0.16 * heave;
            c.save(); c.translate(x, y); c.rotate(lean); person(c, 0, 0, 240, 'point', { col: HEX.ink, t, seed: i, emote: i === 2 ? 'sweat' : undefined }); c.restore();
          } else {
            person(c, x, y - 30 * Math.abs(Math.sin((t - crew.start) * 9 + i)), 240, 'cheer', { col: HEX.ink, t, seed: i, emote: i % 2 ? 'joy' : '!', emoteT0: crew.start });
          }
        }
        if (free < 1) { c.strokeStyle = '#c9a36b'; c.lineWidth = 9; c.beginPath(); c.moveTo(W * 0.06 + 40, H * 0.84 - 190); c.quadraticCurveTo(W * 0.4, H * 0.84 - 160 + 30 * (1 - heave), rx, ry + 0.12 * R); c.stroke(); }
        if (free > 0 && free < 1) impactBurst(c, W * 0.8, H * 0.42, 240, 'rgba(255,241,214,0.9)', '#5a2f2a', t);
        chips(c, s.au, t, W * 0.78, H * 0.45, '#fff1d6', 14, -1, 0);
        const fierce = t >= stub.start;
        const anc = rai(c, rx, ry, R, t, fierce ? 'fierce' : 'determined', fierce ? ['fist', 'fist'] : ['fist', 'down'], {
          armsFrom: ['down', 'down'], armsU: clamp((t - s.t0) / 0.2), hop, squash: free > 0 && free < 0.3 ? -0.3 : hop > 0 ? 0.2 : 0,
          shake: fierce && free <= 0 ? 0.4 : 0, marks: free > 0 ? ['sparkle'] : fierce ? ['steam'] : undefined, markT0: free > 0 ? crew.start : stub.start, glow: HEX.yellow,
        });
        if (free > 0) for (let i = 0; i < 6; i++) sparkle(g, anc.head.x + Math.cos(i + t * 3) * 220, anc.head.y + Math.sin(i * 2 + t * 3) * 160, 26, HEX.yellow, 0.8 * (1 - clamp((t - crew.start - 0.5) / 0.5)));
        // shell adzes on the ground
        for (const [x, a] of [[W * 0.45, 0.3], [W * 0.5, -0.5]] as const) { c.save(); c.translate(x, H * 0.9); c.rotate(a); c.fillStyle = '#6b4a22'; c.fillRect(-4, -50, 8, 60); c.fillStyle = '#efe2c8'; c.beginPath(); c.moveTo(-6, -52); c.quadraticCurveTo(14, -64, 22, -46); c.lineTo(4, -40); c.fill(); c.restore(); }
        paperPage(c, t);
        sl(c, 'STUBBORN', W * 0.3, H * 0.16, 170, t, stub.start, { col: HEX.ink, shadow: HEX.bone, rot: -0.05 });
        sl(c, 'CREW', W * 0.3, H * 0.35, 220, t, crew.start, { col: HEX.coral, shadow: HEX.ink, rot: 0.03 });
        s.post.push(punch(t, [stub.start, crew.start], 0.03), hitShake(t, [crew.start], 4, 0.3));
      });
    }

    // ================================================================ L3 four hundred kilometres of ocean
    {
      const four = w(1, /four/), ocean = w(1, /ocean/), stars_ = w(1, /stars/), blue = w(1, /blue/);
      const P: [number, number] = [W * 0.17, H * 0.52], Y: [number, number] = [W * 0.8, H * 0.5], Q: [number, number] = [W * 0.5, H * 0.26];
      const km = (t: number) => Math.round(400 * ease.outCubic(clamp((t - four.start) / (ocean.end - four.start))));
      // 3a: the map: the route from Palau to Yap, the storm doodled on its middle
      add(lineCut(1), 'the map', (s) => {
        const { c, t } = s;
        c.save(); cam(c, 1 + 0.03 * s.lt, W * 0.5, H * 0.45);
        const u = 0.62 * ease.inOutQuad(clamp((t - four.start) / (s.t1 - four.start + 0.2)));
        const head = mapPage(c, t, u, P, Y, Q, (i) => popK(t, s.t0, i));
        // her, chibi, on a little raft at the head of the route
        raft(c, head[0], head[1] + 30, 110, '#6b4a22', 0.05 * Math.sin(t * 5));
        drawRai(c, head[0], head[1] + 30 - 1.07 * 42, 42, { t, face: 'joy', arms: ['up', 'up'], sd: true, glow: 'rgba(0,0,0,0)', hop: 0.15 * Math.abs(Math.sin(t * 7)) });
        c.restore();
        paperPage(c, t, 'rgba(255,240,210,0.03)');
        if (t >= four.start - 0.02) {
          const num = `${km(t)}`;
          c.font = font(FAM.hook(), 230); const nw = c.measureText(num).width;
          slam(c, num, W * 0.46, H * 0.17, 230, t, four.start, { col: HEX.coral, shadow: HEX.ink, align: 'right' });
          slam(c, 'KM', W * 0.47 + 120, H * 0.2, 120, t, four.start + 0.1, { col: HEX.ink, shadow: HEX.bone });
          void nw;
        }
        s.post.push(punch(t, [four.start], 0.025));
      });
      // 3b: the crossing at sunset: the paddlers' bodies pulling on the beat; she rides the raft behind, smug
      add(beats(lineCut(1), 2), 'the crossing', (s) => {
        const { c, t } = s;
        c.save(); cam(c, 1.02 + 0.03 * s.lt, W * 0.5, H * 0.5);
        sky(c, t, W * 0.16, H * 0.48, '#2f1c59', HEX.coral, '#ff8a5a', HEX.yellow, 100, 0.02);
        c.fillStyle = '#4b4aa8'; c.fillRect(-W, H * 0.48, 3 * W, H);
        for (let i = 0; i < 3; i++) { const bx = W * (0.55 + 0.12 * i) + 30 * Math.sin(t + i), by = H * (0.16 + 0.05 * i); c.strokeStyle = HEX.ink; c.lineWidth = 5; c.beginPath(); c.moveTo(bx - 26, by); c.quadraticCurveTo(bx - 12, by - 14 - 8 * Math.sin(t * 8 + i), bx, by); c.quadraticCurveTo(bx + 12, by - 14 - 8 * Math.sin(t * 8 + i), bx + 26, by); c.stroke(); }
        waves(c, t, H * 0.5, ['#5a5ab8', '#4747a0'], 22, { speed: 0.8, crest: 'rgba(255,255,255,0.35)' });
        const bob = (k: number) => Math.sin(t * 2.4 + k) * 12;
        // the canoe ahead, three paddlers stroking on the beat
        const cx = W * 0.74, cy = H * 0.63 + bob(1), cw = 520;
        canoe(c, cx, cy, cw, HEX.ink);
        for (let i = 0; i < 3; i++) {
          const px = cx - cw * 0.28 + i * cw * 0.24, ph = beatPh(s.au, t, -0.08 * i);
          paddler(c, px, cy - cw * 0.03, 190, ph, HEX.ink);
          if (i === 1) emote(c, px + 14, cy - cw * 0.03 - 165, 22, 'sweat', t);
          if (ph < 0.1) { c.fillStyle = 'rgba(255,255,255,0.8)'; for (let j = 0; j < 5; j++) { c.beginPath(); c.arc(px + 50 + j * 9, cy + 30 - 300 * ph - j * 5, 5, 0, TAU); c.fill(); } }
        }
        // the tow rope, and the raft with her on it: arms crossed, being carried 400 km
        const rx = W * 0.32, ry = H * 0.66 + bob(0);
        c.strokeStyle = '#c9a36b'; c.lineWidth = 4;
        c.beginPath(); c.moveTo(cx - cw / 2, cy - 20); c.quadraticCurveTo((cx - cw / 2 + rx) / 2, ry + 10, rx + 200, ry - 4); c.stroke();
        raft(c, rx, ry, 420, '#3a2410', 0.04 * Math.sin(t * 2.4));
        rai(c, rx, ry - 1.07 * 110, 110, t, 'smug', ['cross', 'cross'], { marks: ['shine'], markT0: s.t0 + 0.2, tilt: 0.05 * Math.sin(t * 2.4), glow: HEX.orange });
        waves(c, t, H * 0.7, ['#3b3c96', '#2c2d7a', HEX.deep], 30, { speed: 1.1, crest: 'rgba(255,255,255,0.3)' });
        c.restore();
        paperPage(c, t);
        c.font = font(FAM.monoB(), 44); c.textAlign = 'left'; c.fillStyle = HEX.bone;
        c.fillText(`KM ${String(km(t)).padStart(3, '0')} / 400`, 120, 130);
      });
      // 3c: nothing (kept: his "dark humour"): the whole sea, a speck of raft
      add(cut(w(1, /nothing/)), 'nothing', (s) => {
        const { c } = s;
        c.fillStyle = '#0a0716'; c.fillRect(0, 0, W, H);
        c.strokeStyle = 'rgba(111,140,255,0.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, H * 0.55); c.lineTo(W, H * 0.55); c.stroke();
        c.fillStyle = HEX.peri; c.fillRect(W * 0.5 - 9, H * 0.55 - 3, 18, 3); c.beginPath(); c.arc(W * 0.5, H * 0.55 - 9, 5, 0, TAU); c.fill();
      });
      // 3d: the night sea: the stars burst out and join into the navigators' path; she looks up, starry-eyed
      add(cut(stars_), 'stars and blue', (s) => {
        const { c, g, t } = s;
        const bl = clamp((t - blue.start) / 0.3);
        nightSea(c, t, H * 0.6, W * 0.84, H * 0.16, { stars: 60, blue: bl });
        const sb = t - stars_.start;
        for (let i = 0; i < 240; i++) {
          const d = 0.4 * h01(i, 71), a = clamp((sb - d) / 0.12);
          if (a <= 0) continue;
          const x = W * h01(i, 72), y = H * 0.58 * h01(i, 73), r = (1 + 2.4 * h01(i, 74)) * a * (1 + 0.8 * pulse(t, stars_.start + d, 0.1));
          c.fillStyle = `rgba(255,255,255,${0.4 + 0.6 * h01(i, 75)})`; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
        }
        const path: [number, number][] = [[W * 0.1, H * 0.4], [W * 0.26, H * 0.28], [W * 0.44, H * 0.33], [W * 0.62, H * 0.22], [W * 0.78, H * 0.28], [W * 0.72, H * 0.17], [W * 0.78, H * 0.28], [W * 0.7, H * 0.36]];
        const pu = clamp((sb - 0.1) / 0.8) * (path.length - 1);
        if (pu > 0) {
          g.strokeStyle = rgbaHex(HEX.cyan, 0.8); g.lineWidth = 3; g.beginPath();
          for (let k = 0; k <= Math.floor(pu); k++) { const [x, y] = path[k]!; k ? g.lineTo(x, y) : g.moveTo(x, y); }
          if (pu < path.length - 1) { const k = Math.floor(pu), fr = pu - k, a = path[k]!, b = path[k + 1]!; g.lineTo(lerp(a[0], b[0], fr), lerp(a[1], b[1], fr)); }
          g.stroke();
        }
        path.forEach(([x, y], k) => { if (k <= pu + 0.5) sparkle(g, x, y, 22, HEX.cyan, 0.9); });
        // the canoe and the raft, the paddles leaving a glowing wake
        const cy = H * 0.68 + 6 * Math.sin(t * 2);
        canoe(c, W * 0.7, cy, 420, '#06081a');
        for (let i = 0; i < 3; i++) {
          const px = W * 0.7 - 110 + i * 92, ph = beatPh(s.au, t, -0.08 * i);
          paddler(c, px, cy - 13, 120, ph, '#06081a');
          for (let j = 0; j < 8; j++) { const age = (ph + j * 0.12) % 1; g.fillStyle = rgbaHex(HEX.cyan, 0.5 * (1 - age)); g.beginPath(); g.arc(px - 20 - age * 160, cy + 14 + 4 * Math.sin(j), 3 + 3 * (1 - age), 0, TAU); g.fill(); }
        }
        c.strokeStyle = '#3a2a40'; c.lineWidth = 3; c.beginPath(); c.moveTo(W * 0.7 - 210, cy - 16); c.lineTo(W * 0.38 + 150, cy - 6); c.stroke();
        raft(c, W * 0.34, cy + 4, 320, '#06081a');
        rai(c, W * 0.34, cy + 4 - 1.07 * 95, 95, t, t < stars_.start + 0.1 ? 'wow' : 'joy', ['reach', 'down'], { look: 0.5, tilt: -0.12, glow: HEX.cyan, glowStrength: 1, heart: 0.3 + 0.5 * bl, heartColor: HEX.cyan, marks: sb > 0 ? ['sparkle'] : undefined, markT0: stars_.start });
        paperPage(c, t, 'rgba(255,240,210,0.02)');
        sl(c, 'STARS', W * 0.62, H * 0.46, 200, t, stars_.start, { col: HEX.cyan, shadow: HEX.ink, rot: -0.03 });
        s.post.push(punch(t, [stars_.start], 0.025));
      });
    }

    // ================================================================ L4 the raft and the pole through her heart
    {
      const lashed = w(2, /lashed/), pole = w(2, /pole/), hole = w(2, /hole/), heart = w(2, /heart/);
      const night = (c: C2, t: number) => nightSea(c, t, H * 0.58, W * 0.18, H * 0.2, { stars: 120 });
      // 4a: lashed: ropes whip round her; wow
      add(lineCut(2), 'lashed', (s) => {
        const { c, t } = s;
        night(c, t);
        waves(c, t, H * 0.66, ['#1d2160', '#141846'], 16, { speed: 1, crest: 'rgba(150,170,255,0.25)' });
        const x = W * 0.5, R = 165, y = H * 0.8 - 1.07 * R;
        raft(c, x, H * 0.8, 820, '#2a1608');
        person(c, x - 330, H * 0.8, 300, 'carry', { col: '#06081a', t, seed: 1, rim: '#8a9cff' });
        person(c, x + 330, H * 0.8, 300, 'hold', { col: '#06081a', t, seed: 2, flip: true, rim: '#8a9cff' });
        rai(c, x, y, R, t, t < lashed.start - 0.05 ? 'smile' : 'wow', t < lashed.start ? ['down', 'down'] : ['up', 'up'], { armsFrom: ['down', 'down'], armsU: clamp((t - lashed.start) / 0.12), shake: t > lashed.start ? 0.25 : 0, marks: t > lashed.start ? ['!'] : undefined, markT0: lashed.start, glow: HEX.cyan });
        for (let k = 0; k < 4; k++) {
          const u = clamp((t - lashed.start - 0.1 * k) / 0.2);
          if (u <= 0) continue;
          const ang = [-0.45, 0.4, 0.05, -0.1][k]!, ry = y + [0, 20, 80, -60][k]!;
          c.save(); c.translate(x, ry); c.rotate(ang);
          c.strokeStyle = '#2a1608'; c.lineWidth = 24; c.beginPath(); c.ellipse(0, 0, R * 1.12, 30, 0, Math.PI * 0.95, Math.PI * 0.95 + TAU * u * 0.55); c.stroke();
          c.strokeStyle = '#d9a35b'; c.lineWidth = 13; c.stroke();
          c.restore();
        }
        speedLines(c, 0.0, 'rgba(255,255,255,0.25)', t, { n: 24, band: [H * 0.2, H * 0.7], alpha: clamp((t - lashed.start) / 0.1) * 0.6 });
        paperPage(c, t);
      });
      // 4b: the indignant chibi: wrapped in rope, stomping; the crew sweat; the pole comes in
      add(beats(lineCut(2), 2), 'indignant', (s) => {
        const { c, t } = s;
        c.save(); cam(c, 1.02, W * 0.5, H * 0.5);
        night(c, t);
        c.save(); c.globalAlpha = 0.35; focusLines(c, W * 0.5, H * 0.55, 230, 'rgba(255,90,95,0.9)', t, { n: 70 }); c.restore();
        waves(c, t, H * 0.68, ['#1d2160', '#141846'], 14, { speed: 1 });
        raft(c, W * 0.5, H * 0.78, 1100, '#2a1608');
        const stomp = Math.abs(Math.sin((t - s.t0) * Math.PI * 4.67));
        const R = 150, anc = rai(c, W * 0.5, H * 0.78 - 1.07 * R, R, t, 'angry', ['fist', 'fist'], { sd: true, hop: 0.12 * stomp, squash: stomp < 0.15 ? -0.25 : 0.05, shake: 0.6, marks: ['vein', 'steam'], markT0: s.t0 + 0.05, glow: HEX.coral });
        c.strokeStyle = '#d9a35b'; c.lineWidth = 12; for (const a of [-0.3, 0.25]) { c.save(); c.translate(anc.heart.x, anc.heart.y); c.rotate(a); c.beginPath(); c.ellipse(0, 0, R * 0.62, 18, 0, 0, TAU); c.stroke(); c.restore(); }
        poof(c, W * 0.5, H * 0.78 - R * 1.2, R * 1.7, t, s.t0);
        person(c, W * 0.2, H * 0.78, 260, 'stand', { col: '#06081a', t, seed: 3, emote: 'sweat', rim: '#8a9cff' });
        // the pole carried in from the left
        const px = lerp(-300, W * 0.2, ease.outCubic(clamp(s.lt / 0.6)));
        person(c, px - 60, H * 0.78, 260, 'carry', { col: '#06081a', t, seed: 4, rim: '#8a9cff' });
        c.strokeStyle = '#8a5a2b'; c.lineWidth = 16; c.lineCap = 'round'; c.beginPath(); c.moveTo(px - 420, H * 0.78 - 236); c.lineTo(px + 90, H * 0.78 - 236); c.stroke();
        person(c, W * 0.82, H * 0.78, 260, 'stand', { col: '#06081a', t, seed: 5, flip: true, emote: '?', rim: '#8a9cff' });
        c.restore();
        paperPage(c, t);
      });
      // 4c: the pole goes through her heart: wow, then the pained grin (the joke lands)
      add(cut(pole), 'the pole', (s) => {
        const { c, g, t } = s;
        night(c, t);
        c.fillStyle = 'rgba(30,10,60,0.35)'; c.fillRect(0, 0, W, H);
        const x = W * 0.54, R = 180, y = H * 0.83 - 1.07 * R, hy = y + 0.12 * R;
        raft(c, x, H * 0.83, 1000, '#2a1608');
        const tip = lerp(-260, W + 260, ease.outCubic(clamp((t - pole.start) / 0.5)));
        // the islander pushing it in from the left
        person(c, Math.min(tip, W * 0.5) - 760, H * 0.83, 300, 'point', { col: '#06081a', t, seed: 6, rim: '#ffb38a' });
        // the pole, behind her: it shows through the hole
        c.fillStyle = '#8a5a2b'; c.strokeStyle = '#3a2410'; c.lineWidth = 5;
        c.beginPath(); c.roundRect(-400, hy - 0.16 * R, tip + 400, 0.32 * R, 0.16 * R); c.fill(); c.stroke();
        const thru = t >= hole.start;
        rai(c, x, y, R, t, thru ? 'grin' : 'wow', thru ? ['shrug', 'shrug'] : ['up', 'up'], { armsFrom: ['down', 'down'], armsU: clamp((t - pole.start) / 0.15), shake: thru ? 0.3 : 0.1, marks: thru ? ['sweat'] : ['!?'], markT0: thru ? hole.start : pole.start + 0.1, heart: thru ? 0.35 : 0, glow: HEX.coral });
        if (t > pole.start + 0.12 && t < pole.start + 0.42) impactBurst(c, x, hy, 120, 'rgba(255,210,63,0.85)', '#120d1d', t, 12);
        sparkle(g, x, hy, 70 * pulse(t, hole.start, 0.12), HEX.yellow, 1);
        paperPage(c, t);
        sl(c, 'POLE', W * 0.5, H * 0.14, 210, t, pole.start, { col: HEX.yellow, shadow: HEX.ink, rot: -0.03 });
        s.post.push(punch(t, [pole.start], 0.03), caKick(t, [hole.start], 3));
      });
      // 4d: the hole in her heart is a carry handle: two islanders shoulder the pole and lift her; pained grin, sweat
      add(cut(heart), 'carried', (s) => {
        const { c, g, t } = s;
        night(c, t);
        waves(c, t, H * 0.72, ['#1d2160', '#141846'], 12, { speed: 0.8 });
        c.fillStyle = '#3a2a2a'; c.fillRect(0, H * 0.8, W, H * 0.2);
        const walk = Math.sin(s.lt * Math.PI * 4.67), lift = ease.outBack(clamp(s.lt / 0.3), 1.4);
        const poleY = H * 0.8 - 280 * 0.88 + 4 * walk;
        person(c, W * 0.14, H * 0.8 + 3 * walk, 280, 'carry', { col: '#06081a', t, seed: 7, rim: '#ff9fc8', emote: 'sweat' });
        person(c, W * 0.86, H * 0.8 - 3 * walk, 280, 'carry', { col: '#06081a', t, seed: 8, flip: true, rim: '#ff9fc8' });
        const R = 170, y = lerp(H * 0.8 - 1.07 * R, poleY - 0.12 * R, lift) + 4 * walk;
        c.fillStyle = '#8a5a2b'; c.strokeStyle = '#3a2410'; c.lineWidth = 5;
        c.beginPath(); c.roundRect(W * 0.08, poleY - 18, W * 0.84, 36, 18); c.fill(); c.stroke();
        rai(c, W * 0.5, y, R, t, 'grin', ['shrug', 'shrug'], { tilt: 0.06 * walk, marks: ['sweat'], markT0: s.t0, heart: 0.6 + 0.4 * clamp((t - heart.start) / 0.3), heartColor: HEX.pink, glow: HEX.pink, noBlink: true });
        // the pole again across her front, either side of the hole, so it reads as going through her
        c.save(); c.beginPath(); c.arc(W * 0.5, y + 0.12 * R, 0.27 * R, 0, TAU); c.rect(W * 0.08, poleY - 40, W * 0.84, 80); c.clip('evenodd');
        c.fillStyle = '#8a5a2b'; c.beginPath(); c.roundRect(W * 0.5 - R * 0.45, poleY - 18, R * 0.9, 36, 6); c.fill();
        c.restore();
        g.fillStyle = rgbaHex(HEX.pink, 0.45); g.beginPath(); g.arc(W * 0.5, y + 0.12 * R, 0.3 * R, 0, TAU); g.fill();
        paperPage(c, t);
        sl(c, 'HEART', W * 0.5, H * 0.13, 200, t, heart.start, { col: HEX.pink, shadow: HEX.ink, rot: 0.04 });
        s.post.push(punch(t, [heart.start], 0.025));
      });
    }

    // ================================================================ L5 the storm, the reef, overboard, the bottom
    {
      const storm = w(3, /storm/), reefW = w(3, /reef/), night = w(3, /night/), went = w(3, /went/), bottom = w(3, /bottom/), sea = w(3, /sea/);
      add(lineCut(3), 'storm', (s) => {
        const { c, g, t } = s;
        nightSea(c, t, H * 0.58, -200, -200, { stars: 0 });
        c.fillStyle = 'rgba(60,30,90,0.55)'; c.fillRect(0, 0, W, H);
        clouds(c, t, popK(t, storm.start - 0.12, 0, 0.22), '#241640', 0, 5, 'rgba(198,92,240,0.6)');
        rain(c, t, 'rgba(198,180,255,0.4)', 160, 0.45, 1.3);
        waves(c, t, H * 0.56, ['#2c1b55', '#22164a'], 40, { speed: 1.8, lambda: 260, crest: 'rgba(255,255,255,0.5)' });
        const ry = H * 0.66 + 26 * Math.sin(t * 3.2), tl = 0.18 * Math.sin(t * 2.6);
        canoe(c, W * 0.2, ry + 30, 380, '#06081a');
        for (let i = 0; i < 2; i++) { paddler(c, W * 0.2 - 60 + i * 110, ry + 30 - 11, 120, beatPh(s.au, t, 0.25 * i), '#06081a'); emote(c, W * 0.2 - 60 + i * 110 + 10, ry + 30 - 125, 16, '!', t, storm.start); }
        c.save(); c.translate(W * 0.62, ry); c.rotate(tl);
        raft(c, 0, 0, 420, '#06081a');
        const lift = 0.25 * Math.max(0, Math.sin((t - storm.start) * 6));
        rai(c, 0, -1.07 * 115, 115, t, t < storm.start ? 'wow' : 'shock', ['up', 'up'], { hop: t > storm.start ? lift : 0, marks: t > storm.start ? ['!?', 'sweat'] : undefined, markT0: storm.start, shake: 0.4, glow: HEX.violet });
        c.restore();
        waves(c, t, H * 0.74, ['#1a1040', '#120d1d'], 36, { speed: 2.2, lambda: 220, crest: 'rgba(255,255,255,0.45)' });
        bolt(g, W * 0.82, 0, W * 0.74, H * 0.5, 3, pulse(t, storm.start, 0.09) * 1.2);
        s.post.push({ flash: t >= storm.start && t < storm.start + 0.05 ? 0.8 : 0 }, hitShake(t, [storm.start], 7, 0.35), caKick(t, [storm.start], 5), punch(t, [storm.start], 0.03));
        sl(c, 'STORM', W * 0.36, H * 0.28, 270, t, storm.start, { col: HEX.bone, shadow: HEX.violet, rot: -0.07 });
      });
      add(cut(w(3, /^off/)), 'the reef', (s) => {
        const { c, g, t } = s;
        c.save(); cam(c, 1.06, W * 0.5, H * 0.5, 0.1 + 0.03 * Math.sin(t * 2));
        nightSea(c, t, H * 0.4, -200, -200, { stars: 0 });
        c.fillStyle = 'rgba(60,30,90,0.5)'; c.fillRect(-W, -H, 3 * W, 3 * H);
        rain(c, t, 'rgba(198,180,255,0.35)', 140, 0.6, 1.4);
        waves(c, t, H * 0.42, ['#3d2a7a', '#2c2060'], 60, { speed: 1.6, lambda: 320, crest: 'rgba(255,255,255,0.55)' });
        const tl = -0.5 + 0.12 * Math.sin(t * 3);
        c.save(); c.translate(W * 0.44, H * 0.52); c.rotate(tl); raft(c, 0, 0, 380, '#06081a'); c.restore();
        // she is flung up off the raft
        const fly = ease.outQuad(clamp((t - s.t0) / 0.6));
        rai(c, W * 0.44 + 160 * fly, H * 0.52 - 1.07 * 110 - 170 * fly, 110, t, 'shock', ['up', 'up'], { tilt: 0.9 * fly, marks: ['!?'], markT0: s.t0, shake: 0.3, glow: HEX.violet });
        speedLines(c, -Math.PI / 2 + 0.3, 'rgba(255,255,255,0.4)', t, { n: 30, alpha: 0.5 });
        waves(c, t, H * 0.64, [HEX.deep, '#1a1240'], 50, { speed: 2, lambda: 260, crest: 'rgba(255,255,255,0.5)' });
        reef(c, t, H * 0.82, popK(t, reefW.start - 0.06, 0, 0.2));
        c.restore();
        bolt(g, W * 0.2, 0, W * 0.32, H * 0.5, 5 + Math.floor(s.lt * 3), 0.9 * s.f.a.snare);
        paperPage(c, t);
      });
      add(cut(night), 'overboard', (s) => {
        const { c, g, t } = s;
        nightSea(c, t, H * 0.62, W * 0.82, H * 0.2, { stars: 80 });
        const mk = popK(t, night.start, 0, 0.2);
        if (mk > 0) { c.save(); c.translate(W * 0.82, H * 0.2); c.scale(mk, mk); star4(c, -70, -60, 16, '#fff4d6'); c.restore(); }
        waves(c, t, H * 0.6, ['#1a1240', '#120d1d'], 30, { speed: 1.5, crest: 'rgba(255,255,255,0.4)' });
        const flip = ease.inOutCubic(clamp((t - went.start + 0.3) / 0.6));
        c.save(); c.translate(W * 0.36, H * 0.62); c.rotate(-0.3 + 2.6 * flip); raft(c, 0, 0, 380, '#05030a'); c.restore();
        // she tumbles end over end, dizzy, into the sea
        const fall = clamp((t - went.start + 0.15) / 0.55);
        const rx = W * 0.4 + 300 * fall, ry = H * 0.3 + 420 * fall * fall;
        speedLines(c, Math.PI / 2 - 0.4, 'rgba(255,255,255,0.35)', t, { n: 26, alpha: 0.6 });
        rai(c, rx, ry, 95, t, 'dizzy', ['shrug', 'up'], { tilt: 4 * fall + 0.6 * (t - s.t0), glow: HEX.cyan, glowStrength: 0.6 });
        if (fall >= 1) { const sp = t - went.start - 0.4; for (let i = 0; i < 14; i++) { const a = -Math.PI * (0.12 + 0.76 * h01(i, 3)), v = 300 + 380 * h01(i, 4); c.fillStyle = HEX.bone; c.beginPath(); c.arc(rx + Math.cos(a) * v * sp, H * 0.66 + Math.sin(a) * v * sp + 1000 * sp * sp, 6, 0, TAU); c.fill(); } }
        waves(c, t, H * 0.7, ['#0c0816'], 20, { speed: 1.2, shadow: false, crest: 'rgba(255,255,255,0.35)' });
        bolt(g, W * 0.12, 0, W * 0.22, H * 0.55, 21, 0.9 * s.f.a.snare);
        paperPage(c, t);
      });
      add(cut(bottom), 'the bottom', (s) => {
        const { c, t } = s;
        const puff = pulse(t, sea.start, 0.25);
        seabed(c, t, { depth: 0.5, clues: ['stone', 'shells'], seed: 5 });
        const sink = ease.inQuad(clamp((t - bottom.start) / (sea.start - bottom.start + 0.02)));
        const R = 125, y = lerp(-H * 0.2, H * 0.8 - 1.07 * R, sink);
        const landed = t >= sea.start;
        rai(c, W * 0.38, y, R, t, landed ? 'deadpan' : 'dizzy', landed ? ['down', 'down'] : ['up', 'up'], {
          squash: landed ? -0.4 * pulse(t, sea.start, 0.12) : 0.25, tilt: landed ? 0 : 0.3 * Math.sin(t * 6), marks: landed ? ['sweat'] : undefined, markT0: sea.start + 0.15, glow: HEX.cyan,
        });
        if (landed) for (let i = 0; i < 9; i++) {
          const px = W * 0.38 + (i - 4) * 70 * (2 - puff), py = H * 0.8 - 20 - 30 * (1 - puff) * h01(i, 9), pr = 80 * (1.6 - puff);
          const gr = c.createRadialGradient(px, py, 0, px, py, pr); gr.addColorStop(0, `rgba(241,220,158,${0.8 * puff})`); gr.addColorStop(1, 'rgba(241,220,158,0)');
          c.fillStyle = gr; c.fillRect(px - pr, py - pr, 2 * pr, 2 * pr);
        }
        for (let i = 0; i < 6; i++) { const u = clamp((t - bottom.start) / 0.8); c.strokeStyle = 'rgba(220,250,255,0.7)'; c.lineWidth = 2; c.beginPath(); c.arc(W * 0.38 + 40 * Math.sin(i * 2 + t * 3), y - 260 - i * 50 * u, 6 + 4 * h01(i, 1), 0, TAU); c.stroke(); }
        seabedFront(c, t, { seed: 5 });
        sl(c, 'BOTTOM', W * 0.68, H * 0.22, 200, t, bottom.start, { col: HEX.cyan, shadow: HEX.ink, rot: 0.05 });
        sl(c, 'SEA', W * 0.68, H * 0.46, 250, t, sea.start, { col: HEX.bone, shadow: HEX.ink, rot: -0.03 });
        s.post.push(punch(t, [bottom.start], 0.02), hitShake(t, [sea.start], 6, 0.3), caKick(t, [sea.start], 4));
      });
    }

    // ================================================================ L6 the twist, on the seabed
    {
      const now = w(4, /now/), twist = w(4, /twist/), love = w(4, /love/), nobody = w(4, /nobody/), wrote = w(4, /wrote/), me = w(4, /^me/), off = w(4, /off/);
      const bed = (c: C2, t: number, seed: number) => seabed(c, t, { depth: 0.18, clues: ['anchor', 'bottle', 'shells'], seed });
      add(lineCut(4), 'now: joy', (s) => {
        const { c, t } = s;
        bed(c, t, 6);
        focusLines(c, W * 0.5, H * 0.45, 260, 'rgba(255,255,255,0.7)', t, { alpha: clamp((t - now.start) / 0.1) });
        const hop = Math.abs(Math.sin((t - now.start) * Math.PI * 2.33));
        rai(c, W * 0.5, H * 0.8 - 1.07 * 170, 170, t, t < now.start ? 'wow' : 'joy', ['up', 'up'], { hop: t > now.start ? 0.35 * hop : 0, squash: t > now.start && hop < 0.1 ? -0.3 : 0.1, marks: ['sparkle'], markT0: now.start, armsFrom: ['down', 'down'], armsU: clamp((t - s.t0) / 0.15), glow: HEX.yellow });
        seabedFront(c, t, { seed: 6 });
        sl(c, 'NOW', W * 0.18, H * 0.26, 190, t, now.start, { col: HEX.yellow, shadow: HEX.ink, rot: -0.12 });
        s.post.push(punch(t, [now.start], 0.02));
      });
      add(cut(twist), 'the twist: the wink', (s) => {
        const { c, t } = s;
        const dx = whipIn(t, s.t0, 1, 0.12);
        if (dx > 1) { c.save(); c.translate(dx - W, 0); bed(c, t, 6); c.restore(); }
        c.save(); c.translate(dx, 0); cam(c, 1.04, W * 0.5, H * 0.5, 0.04 * Math.sin(s.lt * 6));
        bed(c, t, 7);
        c.save(); c.globalAlpha = 0.5; sunburst(c, W * 0.3, H * 0.55, 'rgba(255,210,63,0.55)', 'rgba(255,79,154,0.0)', 14, t * 1.2); c.restore();
        // kelp twisting in the foreground: the twist made literal
        for (let k = 0; k < 4; k++) {
          const x0 = W * (0.5 + 0.13 * k), hgt = 520 + 80 * k;
          c.strokeStyle = k % 2 ? '#2fae6a' : '#1f8f55'; c.lineWidth = 22; c.lineCap = 'round'; c.beginPath();
          for (let j = 0; j <= 20; j++) { const u = j / 20, x = x0 + Math.sin(u * 9 + s.lt * 10 + k) * 40 * u, y = H + 20 - hgt * u; j ? c.lineTo(x, y) : c.moveTo(x, y); }
          c.stroke();
        }
        rai(c, W * 0.28, H * 0.8 - 1.07 * 175, 175, t, t < love.start ? 'wink' : 'cheeky', ['hip', 'point'], { tilt: 0.12 * Math.sin(s.lt * 5), marks: ['shine'], markT0: twist.start + 0.05, noBlink: true, glow: HEX.pink });
        c.restore();
        twisted(c, 'TWIST', W * 0.66, H * 0.36, 250, t, twist.start, HEX.pink, HEX.ink);
        s.post.push(punch(t, [twist.start], 0.03));
      });
      add(cut(w(4, /bit/)), 'smug', (s) => {
        const { c, t } = s;
        const z = t > wrote.start ? 1.12 : 1.02;
        c.save(); cam(c, z, W * 0.62, H * 0.55);
        bed(c, t, 8);
        rai(c, W * 0.66, H * 0.8 - 1.07 * 175, 175, t, t < nobody.start ? 'grin' : 'smug', ['cross', 'cross'], { tilt: 0.08, marks: t > nobody.start ? ['shine'] : undefined, markT0: nobody.start, glow: HEX.yellow });
        seabedFront(c, t, { seed: 8 });
        c.restore();
        sl(c, 'NOBODY', W * 0.33, H * 0.22, 220, t, nobody.start, { col: HEX.yellow, shadow: HEX.ink, rot: -0.04 });
        sl(c, 'WROTE', W * 0.26, H * 0.46, 150, t, wrote.start, { col: HEX.bone, shadow: HEX.ink });
        sl(c, 'ME', W * 0.46, H * 0.46, 150, t, me.start, { col: HEX.bone, shadow: HEX.ink });
        s.post.push(punch(t, [nobody.start, wrote.start], 0.02));
      });
      // 6d: the bottle's note, unrolled: WROTE ME OFF, struck out on "off" (nobody did)
      add(cut(off), 'off: struck out', (s) => {
        const { c, t } = s;
        bed(c, t, 9);
        c.fillStyle = 'rgba(10,20,50,0.45)'; c.fillRect(0, 0, W, H);
        const k = ease.outBack(clamp(s.lt / 0.18), 1.6);
        c.save(); c.translate(W * 0.47, H * 0.38); c.rotate(-0.04); c.scale(k, k);
        c.fillStyle = '#f4e7c4'; c.beginPath(); c.roundRect(-620, -140, 1240, 280, 10); c.fill();
        c.fillStyle = '#d8c494'; for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(sx * 630, 0, 30, 150, 0, 0, TAU); c.fill(); }
        c.font = font(FAM.hook(), 118); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#3a2416';
        c.fillText('WROTE ME OFF', 0, 6);
        const u = ease.outExpo(clamp((t - off.start) / 0.22));
        c.fillStyle = HEX.coral; c.save(); c.rotate(-0.05); c.fillRect(-540, -16, 1080 * u, 32); c.restore();
        c.restore();
        rai(c, W * 0.86, H * 0.8 - 1.07 * 100, 100, t, t > off.start ? 'wink' : 'smug', ['hip', 'point'], { marks: ['shine'], markT0: off.start, noBlink: true, glow: HEX.yellow });
        s.post.push(punch(t, [off.start], 0.03));
      });
    }

    // ================================================================ L7 the island: "we know she's down there"
    {
      const we = w(5, /we/), know = w(5, /know/), shes = w(5, /she/), down = w(5, /down/), believing = w(5, /believing/), enough = w(5, /enough/);
      add(lineCut(5), 'the village at sunset', (s) => {
        const { c, t } = s;
        c.save(); cam(c, 1 + 0.02 * s.lt, W * 0.5, H * 0.5);
        island(c, t, { time: 'sunset', show: ['palms', 'huts', 'bank', 'canoes', 'clouds'] });
        // the islanders on the beach, talking it over
        const poses: [number, 'stand' | 'hold' | 'wave' | 'point' | 'lean'][] = [[0.2, 'stand'], [0.26, 'hold'], [0.36, 'wave'], [0.44, 'stand'], [0.52, 'point'], [0.6, 'stand'], [0.84, 'lean']];
        poses.forEach(([x, p], i) => layer(c, popK(t, s.t0 + 0.05 * i, 0, 0.22), H * 0.8, () => person(c, W * x, H * 0.8 + 12 * h01(i, 4), 190 + 30 * h01(i, 3), p, { col: '#1a1230', t, seed: i, rim: '#ffb38a', headTilt: 0.15 * Math.sin(t * 2 + i), emote: i === 4 ? '!' : undefined, emoteT0: s.t0 + 0.3 }), 0));
        c.restore();
      });
      add(cut(w(5, /said/)), 'we know she\'s', (s) => {
        const { c, t } = s;
        c.save(); cam(c, 1.5, W * 0.55, H * 0.62);
        island(c, t, { time: 'sunset', show: ['palms', 'huts', 'bank', 'canoes', 'clouds'], pan: 120 });
        c.restore();
        for (let i = 0; i < 5; i++) person(c, W * (0.06 + 0.11 * i), H * 0.94 + 10 * h01(i, 5), 380 + 30 * h01(i, 6), i === 4 ? 'cheer' : 'point', { col: '#1a1230', t, seed: i, rim: '#ffb38a', emote: i === 4 ? 'joy' : undefined });
        const bk = popK(t, we.start - 0.08, 0, 0.22);
        if (bk > 0) {
          c.save(); c.translate(W * 0.7, H * 0.3); c.scale(bk, bk);
          speech(c, -400, -140, 800, 250, -320, 230, HEX.bone, HEX.ink);
          c.font = font(FAM.cond(), 124); c.textAlign = 'center'; c.textBaseline = 'middle';
          const ws: [Word, string, number][] = [[we, 'WE', -250], [know, 'KNOW', -25], [shes, "SHE'S", 240]];
          for (const [wd, txt, dx] of ws) if (t >= wd.start) { c.globalAlpha = clamp((t - wd.start) / 0.06); c.fillStyle = HEX.ink; c.fillText(txt, dx, -14); }
          c.globalAlpha = 1; c.restore();
        }
      });
      add(cut(down), 'down there', (s) => {
        const { c, g, t } = s;
        const wl = H * 0.38;
        // above: the beach, the islanders pointing down at the water
        c.save(); c.beginPath(); c.rect(0, 0, W, wl); c.clip();
        island(c, t, { time: 'sunset', horizon: H * 0.14, beach: H * 0.27, show: ['palms', 'huts', 'bank', 'clouds'] });
        for (let i = 0; i < 6; i++) person(c, W * (0.05 + 0.07 * i), wl - 10, 150, 'point', { col: '#1a1230', t, seed: i, rim: '#ffb38a' });
        c.restore();
        // below: the water and the seabed, and her, waving up at them
        c.save(); c.beginPath(); c.rect(0, wl, W, H - wl); c.clip();
        seabed(c, t, { depth: 0.3, floor: H * 0.84, clues: ['shells'], seed: 10 });
        c.restore();
        c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 5; c.beginPath();
        for (let x = 0; x <= W; x += 30) { const y = wl + 6 * Math.sin(x * 0.02 + t * 3); x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
        const rx = W * 0.68, R = 100, ry = H * 0.86 - 1.07 * R;
        const bel = clamp((t - believing.start) / 0.35);
        for (let i = 0; i < 6; i++) {
          const x = W * (0.05 + 0.07 * i) + 40, y = wl - 150, a = bel * clamp((t - believing.start - 0.05 * i) / 0.2);
          if (a <= 0) continue;
          const gr = g.createLinearGradient(x, y, rx, ry);
          gr.addColorStop(0, rgbaHex(HEX.gold, 0.75 * a)); gr.addColorStop(1, rgbaHex(HEX.gold, 0.2 * a));
          g.strokeStyle = gr; g.lineWidth = 5; g.beginPath(); g.moveTo(x, y); g.lineTo(rx, ry); g.stroke();
        }
        const au_ = ease.outCubic(clamp((t - down.start) / 0.3));
        c.save(); c.setLineDash([22, 16]); c.lineDashOffset = -t * 60; c.strokeStyle = HEX.bone; c.lineWidth = 8;
        c.beginPath(); c.moveTo(W * 0.46, wl + 30); c.quadraticCurveTo(W * 0.5, H * 0.66, lerp(W * 0.46, rx - 150, au_), lerp(wl + 30, ry, au_)); c.stroke(); c.restore();
        rai(c, rx, ry, R, t, bel > 0 ? 'joy' : 'grin', ['down', 'wave'], { glow: bel > 0 ? HEX.gold : HEX.cyan, heart: bel * 0.9, heartColor: HEX.gold, noBlink: true, marks: bel > 0 ? ['sparkle'] : undefined, markT0: believing.start });
        seabedFront(c, t, { seed: 10 });
        sl(c, 'DOWN THERE', W * 0.3, H * 0.58, 120, t, down.start, { col: HEX.bone, shadow: HEX.ink, rot: -0.03, t1: believing.start - 0.06, exit: 0.06 });
        sl(c, 'BELIEVING', W * 0.3, H * 0.6, 150, t, believing.start, { col: HEX.gold, shadow: HEX.ink, rot: -0.03 });
        s.post.push(punch(t, [down.start, believing.start], 0.02));
      });
      add(cut(w(5, /^was/)), 'enough', (s) => {
        const { c, g, t } = s;
        c.save(); cam(c, 1 + 0.05 * s.lt, W * 0.5, H * 0.55);
        seabed(c, t, { depth: 0.45, clues: ['stone', 'shells'], seed: 11 });
        // the believers' lights, gathered on the surface above
        for (let i = 0; i < 16; i++) {
          const x = W * (0.12 + 0.76 * h01(i, 81));
          const gr = g.createLinearGradient(x, 0, W * 0.5, H * 0.6);
          gr.addColorStop(0, rgbaHex(HEX.gold, 0.6)); gr.addColorStop(1, rgbaHex(HEX.gold, 0.05));
          g.strokeStyle = gr; g.lineWidth = 3; g.beginPath(); g.moveTo(x, 18); g.lineTo(W * 0.5, H * 0.6); g.stroke();
          g.fillStyle = rgbaHex(HEX.gold, 0.9); g.beginPath(); g.arc(x, 18 + 4 * Math.sin(t * 2 + i), 7, 0, TAU); g.fill();
        }
        const joy = t >= enough.start;
        rai(c, W * 0.5, H * 0.8 - 1.07 * 160, 160, t, joy ? 'joy' : 'soft', joy ? ['up', 'up'] : ['cheek', 'cheek'], { armsFrom: ['cheek', 'cheek'], armsU: clamp((t - enough.start) / 0.15), hop: joy ? 0.2 * Math.sin(Math.PI * clamp((t - enough.start) / 0.4)) : 0, glow: HEX.gold, glowStrength: 1.3, heart: 0.9, heartColor: HEX.gold, marks: joy ? ['sparkle'] : undefined, markT0: enough.start, blush: 0.5 });
        seabedFront(c, t, { seed: 11 });
        c.restore();
        sl(c, 'ENOUGH', W * 0.5, H * 0.15, 200, t, enough.start, { col: HEX.gold, shadow: HEX.ink });
        s.post.push(punch(t, [enough.start], 0.025));
      });
    }

    // ================================================================ L8 her deals, in the places they happen
    {
      const land = w(6, /land/), feud = w(6, /feud/), still2 = w(6, /still/, 2), wedding = w(6, /wedding/), complete = w(6, /complete/);
      const stakes = (c: C2, t: number, x0: number, y0: number, wd: number, ht: number, draw: number) => {
        const pts: [number, number][] = [[x0, y0], [x0 + wd, y0 - ht * 0.2], [x0 + wd * 1.05, y0 + ht * 0.6], [x0 - wd * 0.05, y0 + ht * 0.7], [x0, y0]];
        c.strokeStyle = '#6b4a22'; c.lineWidth = 7;
        for (const [x, y] of pts.slice(0, 4)) { c.beginPath(); c.moveTo(x, y + 6); c.lineTo(x, y - 34); c.stroke(); }
        c.save(); c.setLineDash([16, 10]); c.lineDashOffset = -t * 80; c.strokeStyle = '#fff6e0'; c.lineWidth = 4; c.beginPath();
        const n = 4, upto = draw * n;
        for (let k = 0; k <= Math.floor(upto) && k <= n; k++) { const [x, y] = pts[k]!; k ? c.lineTo(x, y - 26) : c.moveTo(x, y - 26); }
        if (upto < n) { const k = Math.floor(upto), fr = upto - k, a = pts[k]!, b = pts[k + 1]!; c.lineTo(lerp(a[0], b[0], fr), lerp(a[1], b[1], fr) - 26); }
        c.stroke(); c.restore();
      };
      // 8a: the plot staked out on the beach; she presents it, hands on hips
      add(lineCut(6), 'so I still buy', (s) => {
        const { c, t } = s;
        island(c, t, { time: 'day', show: ['palms', 'huts', 'bank', 'clouds', 'path'], seed: 5 });
        stakes(c, t, W * 0.46, H * 0.7, 380, 110, clamp(s.lt / (land.start - s.t0)));
        person(c, W * 0.84, H * 0.86, 260, 'point', { col: '#1a2a40', t, seed: 2, flip: true });
        rai(c, W * 0.22, H * 0.97 - 1.07 * 170, 170, t, 'sassy', ['hip', 'hip'], { tilt: 0.1, marks: ['shine'], markT0: s.t0 + 0.15, glow: HEX.bone, glowStrength: 0.5 });
      });
      // 8b: LAND: the deal on the plot: a hut pops up, two shake on it over a small stone (the price)
      add(cut(land), 'LAND', (s) => {
        const { c, t } = s;
        c.save(); cam(c, 1.45, W * 0.56, H * 0.68);
        island(c, t, { time: 'day', show: ['palms', 'clouds', 'bank'], seed: 5 });
        stakes(c, t, W * 0.48, H * 0.78, 360, 120, 1);
        layer(c, popK(t, land.start, 0, 0.3), H * 0.8, () => { // the new hut, popping up on the plot
          const x = W * 0.58, y = H * 0.8, sz = 160;
          c.fillStyle = '#c48a52'; c.fillRect(x - sz * 0.42, y - sz * 0.72, sz * 0.84, sz * 0.38);
          c.strokeStyle = '#6f4a2a'; c.lineWidth = 6; for (const d of [-0.35, 0, 0.35]) { c.beginPath(); c.moveTo(x + d * sz, y); c.lineTo(x + d * sz, y - sz * 0.35); c.stroke(); }
          c.fillStyle = '#d9b25e'; c.beginPath(); c.moveTo(x - sz * 0.62, y - sz * 0.66); c.lineTo(x, y - sz * 1.18); c.lineTo(x + sz * 0.62, y - sz * 0.66); c.closePath(); c.fill();
        });
        person(c, W * 0.46, H * 0.86, 150, 'point', { col: '#1a2a40', t, seed: 3, emote: 'joy', emoteT0: land.start + 0.1 });
        person(c, W * 0.66, H * 0.86, 150, 'point', { col: '#1a2a40', t, seed: 4, flip: true });
        stone(c, W * 0.56, H * 0.86 - 22, 22, { seed: 3 });
        c.restore();
        rai(c, W * 0.86, H * 0.85 - 1.07 * 95, 95, t, 'smug', ['hip', 'hip'], { marks: ['shine'], markT0: land.start, glow: HEX.bone, glowStrength: 0.5 });
        sl(c, 'LAND', W * 0.4, H * 0.17, 220, t, land.start, { col: HEX.lime, shadow: HEX.ink, rot: -0.03 });
        s.post.push(punch(t, [land.start], 0.03));
      });
      // 8c: a feud between neighbours over a coconut palm; angry, then a hug
      add(cut(feud), 'the feud, settled', (s) => {
        const { c, g, t } = s;
        c.save(); cam(c, 1.2, W * 0.5, H * 0.6);
        island(c, t, { time: 'day', show: ['huts', 'clouds'], seed: 8 });
        c.restore();
        const hug = ease.outBack(clamp((t - still2.start) / 0.3)), made = t >= still2.start;
        // the cause: one palm on the boundary, a coconut
        const px = W * 0.5;
        c.strokeStyle = '#9a6b3f'; c.lineWidth = 22; c.beginPath(); c.moveTo(px, H * 0.92); c.quadraticCurveTo(px + 30, H * 0.5, px - 10, H * 0.18); c.stroke();
        for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.5; c.strokeStyle = k % 2 ? '#2e9a4a' : '#3cb35a'; c.lineWidth = 18; c.beginPath(); c.moveTo(px - 10, H * 0.18); c.quadraticCurveTo(px - 10 + Math.cos(a) * 120, H * 0.18 + Math.sin(a) * 80 - 20, px - 10 + Math.cos(a) * 230, H * 0.18 + Math.sin(a) * 120 + 90); c.stroke(); }
        const cocoY = made ? Math.min(H * 0.62, H * 0.22 + 1800 * Math.pow(t - still2.start, 2)) : H * 0.22;
        c.fillStyle = '#6f4a2a'; c.beginPath(); c.arc(px + 10, cocoY, 22, 0, TAU); c.fill();
        const gap = lerp(W * 0.17, 75, hug);
        person(c, W * 0.5 - gap, H * 0.92, 400, made ? 'hug' : 'point', { col: '#1a2a40', t, seed: 1, emote: made ? 'heart' : 'anger', emoteT0: made ? still2.start : feud.start });
        person(c, W * 0.5 + gap, H * 0.92, 380, made ? 'hug' : 'point', { col: '#1a2a40', t, seed: 2, flip: true, emote: made ? 'joy' : 'anger', emoteT0: made ? still2.start : feud.start });
        if (!made) { c.strokeStyle = HEX.coral; c.lineWidth = 10; c.beginPath(); for (let k = 0; k <= 6; k++) { const x = lerp(W * 0.38, W * 0.62, k / 6), y = H * 0.5 + (k % 2 ? -36 : 36) * (1 + 0.3 * Math.sin(t * 30)); k ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
        else for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; sparkle(g, W * 0.5 + Math.cos(a) * (80 + 80 * hug), H * 0.6 + Math.sin(a) * (60 + 60 * hug), 26, HEX.yellow, 1 - clamp((t - still2.start - 0.3) / 0.4)); }
        rai(c, W * 0.86, H * 0.97 - 1.07 * 120, 120, t, made ? 'smug' : 'sassy', made ? ['hip', 'wave'] : ['hip', 'hip'], { marks: ['shine'], markT0: s.t0 + 0.1, glow: HEX.bone, glowStrength: 0.5 });
        sl(c, 'FEUD', W * 0.28, H * 0.17, 220, t, feud.start, { col: HEX.coral, shadow: HEX.ink, t1: still2.start, exit: 0.08 });
        sl(c, 'SETTLED', W * 0.28, H * 0.17, 200, t, still2.start + 0.04, { col: HEX.bone, shadow: HEX.ink, rot: -0.04 });
        s.post.push(punch(t, [feud.start, still2.start], 0.025));
      });
      // 8d: the wedding under lanterns: the couple, a stone hung with flowers (Yap still brings stones to weddings)
      add(cut(wedding), 'the wedding', (s) => {
        const { c, g, t } = s;
        island(c, t, { time: 'night', show: ['palms', 'huts', 'lanterns', 'canoes'], seed: 9 });
        c.fillStyle = 'rgba(255,170,90,0.12)'; c.fillRect(0, 0, W, H);
        const cx = W * 0.52, gy = H * 0.8;
        discStone(c, cx + 230, gy - 120, 110, -0.05, 0.1);
        for (let i = 0; i < 9; i++) { const a = Math.PI * 1.05 + (i / 8) * Math.PI * 0.9; hibiscus(c, cx + 230 + Math.cos(a) * 112, gy - 120 + Math.sin(a) * 118, 18, [HEX.pink, HEX.yellow, HEX.bone][i % 3]!, a); }
        person(c, cx - 70, gy, 300, 'hands', { col: '#160f2a', t, seed: 1, rim: '#ffd678', emote: 'heart', emoteT0: complete.start });
        person(c, cx + 20, gy, 285, 'hands', { col: '#160f2a', t, seed: 2, flip: true, rim: '#ffd678' });
        for (let i = 0; i < 4; i++) person(c, W * (0.1 + 0.07 * i), gy + 10, 220, 'cheer', { col: '#160f2a', t, seed: 10 + i, rim: '#ffd678', emote: i % 2 ? 'joy' : 'music' });
        const bloom = t - complete.start;
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * TAU + 0.3, r = 420 * ease.outBack(clamp((bloom - 0.025 * i) / 0.35));
          if (r <= 0) continue;
          hibiscus(c, cx + Math.cos(a) * r * 1.4, H * 0.45 + Math.sin(a) * r * 0.6, 30, [HEX.coral, HEX.yellow, HEX.pink][i % 3]!, a + t);
        }
        const anc = rai(c, W * 0.84, gy + 20 - 1.07 * 120, 120, t, t > complete.start ? 'wink' : 'sassy', ['hip', 'wave'], { marks: ['shine'], markT0: wedding.start, noBlink: true, glow: HEX.gold, glowStrength: 0.8 });
        hibiscus(c, anc.head.x - anc.head.r * 0.5, anc.head.y - anc.head.r * 0.75, anc.head.r * 0.32, HEX.pink, 0.4);
        sl(c, 'WEDDING', W * 0.5, H * 0.16, 200, t, wedding.start, { col: HEX.pink, shadow: HEX.ink, rot: 0.02 });
        s.post.push(punch(t, [wedding.start, complete.start], 0.02));
      });
    }

    // ================================================================ L9 the richest rock in the street
    {
      const nobody = w(7, /nobody/), living = w(7, /living/), me = w(7, /^me/), richest = w(7, /richest/), rock = w(7, /rock/);
      // 9a: the living look for her with a lantern from a canoe; the beam sweeps past; she hides, cheeky
      add(lineCut(7), 'nobody living has seen', (s) => {
        const { c, g, t } = s;
        seabed(c, t, { depth: 0.85, clues: ['stone', 'coin'], seed: 12, shark: false });
        c.fillStyle = 'rgba(2,6,20,0.55)'; c.fillRect(0, 0, W, H);
        // the canoe on the surface, seen from below, a figure leaning over with a lantern
        const cx = W * 0.3;
        c.fillStyle = '#05070f'; c.beginPath(); c.ellipse(cx, 26, 260, 26, 0, 0, Math.PI); c.fill();
        c.save(); c.translate(cx + 120, 30); c.rotate(Math.PI); person(c, 0, 0, 120, 'point', { col: '#05070f', t }); c.restore();
        const sweep = -0.55 + 1.0 * ease.inOutQuad(clamp(s.lt / (s.t1 - s.t0)));
        const ox = cx + 150, oy = 60, Lb = 1300;
        const gr = g.createRadialGradient(ox, oy, 0, ox, oy, Lb);
        gr.addColorStop(0, 'rgba(255,214,120,0.5)'); gr.addColorStop(1, 'rgba(255,214,120,0)');
        g.fillStyle = gr; g.beginPath(); g.moveTo(ox, oy); g.lineTo(ox + Math.sin(sweep - 0.18) * Lb, oy + Math.cos(sweep - 0.18) * Lb); g.lineTo(ox + Math.sin(sweep + 0.18) * Lb, oy + Math.cos(sweep + 0.18) * Lb); g.closePath(); g.fill();
        g.fillStyle = 'rgba(255,214,120,0.9)'; g.beginPath(); g.arc(ox, oy, 12, 0, TAU); g.fill();
        // her, peeking out from behind a coral head
        rai(c, W * 0.78, H * 0.7 - 1.07 * 120 + 40 * Math.sin(Math.PI * clamp((t - living.start) / 0.5)), 120, t, 'cheeky', ['cheek', 'down'], { glow: HEX.cyan, glowStrength: 0.3, look: -0.7, marks: ['sweat'], markT0: living.start });
        c.fillStyle = '#3a1d4e'; c.beginPath(); c.moveTo(W * 0.62, H + 20); c.quadraticCurveTo(W * 0.64, H * 0.6, W * 0.72, H * 0.62); c.quadraticCurveTo(W * 0.78, H * 0.48, W * 0.84, H * 0.64); c.quadraticCurveTo(W * 0.93, H * 0.58, W * 0.95, H + 20); c.fill();
        c.strokeStyle = HEX.coral; c.lineWidth = 6; c.beginPath(); c.moveTo(W * 0.64, H * 0.66); c.quadraticCurveTo(W * 0.72, H * 0.6, W * 0.78, H * 0.5); c.stroke();
        seabedFront(c, t, { seed: 12 });
        sl(c, 'NOBODY', W * 0.72, H * 0.14, 130, t, nobody.start, { fam: FAM.cond(), col: HEX.bone, shadow: HEX.ink });
        sl(c, 'LIVING', W * 0.72, H * 0.27, 130, t, living.start, { fam: FAM.cond(), col: HEX.gold, shadow: HEX.ink });
      });
      // 9b: she steps out into the light anyway: a stage spotlight, a drumroll, the scheming grin
      add(cut(w(7, /seen/)), 'the spotlight', (s) => {
        const { c, t } = s;
        seabed(c, t, { depth: 0.8, clues: ['stone'], seed: 13, shark: false });
        c.fillStyle = 'rgba(2,4,14,0.78)'; c.fillRect(0, 0, W, H);
        const r = 360 + 16 * Math.sin(t * 40) * clamp(s.lt / 0.5);
        const gr = c.createRadialGradient(W * 0.5, H * 0.55, 0, W * 0.5, H * 0.55, r);
        gr.addColorStop(0, 'rgba(255,230,160,0.45)'); gr.addColorStop(0.8, 'rgba(255,230,160,0.22)'); gr.addColorStop(1, 'rgba(255,230,160,0)');
        c.fillStyle = gr; c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(255,230,160,0.12)'; c.beginPath(); c.moveTo(W * 0.46, 0); c.lineTo(W * 0.54, 0); c.lineTo(W * 0.66, H * 0.84); c.lineTo(W * 0.34, H * 0.84); c.fill();
        c.save(); c.globalAlpha = 0.5 * clamp(s.lt / 0.6); focusLines(c, W * 0.5, H * 0.45, 300, 'rgba(255,214,120,0.6)', t, { n: 60 }); c.restore();
        const step = ease.outBack(clamp(s.lt / 0.3), 1.6);
        rai(c, lerp(W * 0.7, W * 0.5, step), H * 0.84 - 1.07 * 160, 160, t, t > me.start ? 'scheme' : 'wink', ['chin', 'hip'], { noBlink: true, glow: HEX.gold });
      });
      // 9c: RICHEST ROCK: the chibi strut on a gold burst, coins raining
      add(cut(richest), 'RICHEST ROCK', (s) => {
        const { c, g, t } = s;
        sunburst(c, W * 0.32, H * 0.55, HEX.gold, HEX.orange, 18, t * 0.5);
        halftone(c, 'rgba(18,13,29,0.12)', 26, 'down');
        c.fillStyle = '#f1dc9e'; c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 40) c.lineTo(x, H * 0.84 + 10 * Math.sin(x * 0.006 + 2)); c.lineTo(W, H); c.fill();
        for (let i = 0; i < 22; i++) { // gold coins raining down
          const x = W * h01(i, 41), y = ((h01(i, 42) + (t - s.t0) * (0.9 + 0.5 * h01(i, 43))) % 1.1) * H - 40, sp = Math.cos(t * 9 + i);
          c.fillStyle = HEX.gold; c.strokeStyle = '#b07a2a'; c.lineWidth = 3; c.beginPath(); c.ellipse(x, y, 22 * Math.abs(sp) + 3, 22, 0, 0, TAU); c.fill(); c.stroke();
        }
        const strut = (t - s.t0) * 4.67, x = lerp(W * 0.18, W * 0.34, clamp((t - s.t0) / 0.7)), hop = Math.abs(Math.sin(strut * Math.PI)) * 0.25;
        const anc = rai(c, x, H * 0.86 - 1.07 * 190, 190, t, 'smug', ['hip', 'wave'], { sd: true, hop, squash: hop < 0.04 ? -0.25 : 0.1, tilt: 0.12 * Math.sin(strut * Math.PI), marks: ['sparkle'], markT0: s.t0, glow: HEX.bone, noBlink: true });
        poof(c, anc.head.x, anc.head.y, 260, t, s.t0);
        for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU + t, r = 300 + 30 * Math.sin(t * 4 + i); sparkle(g, anc.head.x + Math.cos(a) * r, anc.head.y + 60 + Math.sin(a) * r * 0.7, 26 + 10 * Math.sin(t * 9 + i), HEX.yellow, 0.9); }
        sl(c, 'RICHEST', W * 0.69, H * 0.27, 200, t, richest.start, { col: HEX.ink, shadow: HEX.bone, rot: -0.05 });
        sl(c, 'ROCK', W * 0.69, H * 0.53, 320, t, rock.start, { col: HEX.pink, shadow: HEX.ink, rot: 0.04 });
        s.post.push({ flash: t >= richest.start && t < richest.start + 0.04 ? 0.5 : 0 }, punch(t, [richest.start, rock.start], 0.035), hitShake(t, [richest.start], 5, 0.3), caKick(t, [richest.start], 4));
      });
      // 9d: the street: the stone bank, a street of stones, and at its head her place, empty: the richest rock is at sea
      add(cut(w(7, /street/)), 'the street', (s) => {
        const { c, g, t } = s;
        const z = lerp(1.3, 1, ease.outExpo(clamp(s.lt / 0.4)));
        c.save(); cam(c, z, W * 0.5, H * 0.5);
        island(c, t, { time: 'day', horizon: H * 0.36, beach: H * 0.48, show: ['palms', 'clouds'], seed: 6 });
        c.fillStyle = '#d9c08a'; c.beginPath(); c.moveTo(W * 0.46, H * 0.5); c.lineTo(W * 0.54, H * 0.5); c.lineTo(W * 0.86, H + 20); c.lineTo(W * 0.14, H + 20); c.fill();
        for (let i = 0; i < 5; i++) {
          const u = i / 4, y = lerp(H * 0.98, H * 0.56, u), r = lerp(110, 34, u);
          discStone(c, lerp(W * 0.1, W * 0.4, u), y - r, r, -0.06, 0); discStone(c, lerp(W * 0.9, W * 0.6, u), y - r, r, 0.06, 0);
        }
        // the head of the street: an empty platform with her outline: the richest rock, out at sea
        c.fillStyle = '#8c8a80'; c.beginPath(); c.roundRect(W * 0.38, H * 0.56, W * 0.24, 34, 8); c.fill();
        c.fillStyle = '#a8a597'; c.beginPath(); c.roundRect(W * 0.385, H * 0.56, W * 0.23, 12, 6); c.fill();
        c.save(); c.setLineDash([16, 14]); c.lineDashOffset = -t * 40; c.strokeStyle = HEX.gold; c.lineWidth = 8;
        c.beginPath(); c.arc(W * 0.5, H * 0.56 - 175, 170, 0, TAU); c.moveTo(W * 0.5 + 46, H * 0.56 - 160); c.arc(W * 0.5, H * 0.56 - 160, 46, 0, TAU); c.stroke(); c.restore();
        g.strokeStyle = rgbaHex(HEX.gold, 0.35); g.lineWidth = 14; g.beginPath(); g.arc(W * 0.5, H * 0.56 - 175, 170, 0, TAU); g.stroke();
        sparkle(g, W * 0.5 + 150, H * 0.56 - 320, 50 + 10 * Math.sin(t * 9), HEX.yellow, 0.9);
        c.restore();
        rai(c, W * 0.88, H * 0.88 - 1.07 * 90, 90, t, 'smug', ['hip', 'point'], { sd: true, marks: ['sparkle'], markT0: s.t0, glow: HEX.bone, noBlink: true });
      });
    }

    list.sort((a, b) => a[0] - b[0]);
    this.shots = list.map(([t0, name, draw], i) => ({ t0, t1: list[i + 1]?.[0] ?? end, name, draw }));
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, audio: au } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t;
    this.L.clear(HEX.ink); this.G.clear();
    let k = 0;
    while (k + 1 < this.shots.length && t >= this.shots[k + 1]!.t0) k++;
    const shot = this.shots[k]!;
    const post: PostOverrides[] = [];
    c.save(); g.save();
    shot.draw({ c, g, t, lt: t - shot.t0, t0: shot.t0, t1: shot.t1, f, au, post });
    c.restore(); g.restore();
    // the caption: the line being rapped, kinetic and centred low on its dark band
    let li = -1;
    for (let i = 0; i < this.lines.length; i++) if (t >= this.show[i]!) li = i;
    band(c);
    if (li >= 0) {
      const line = this.lines[li]!, cap = CAP[li] ?? CAP[0]!;
      const next = this.show[li + 1];
      caption(c, line, t, { size: 50, accents: cap.accents, accent: cap.accent, lead: line.words[0]!.start - this.show[li]!, until: next !== undefined ? next - 0.12 : line.end + 0.3 });
    }
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    return mergePost({ bloom: 0.65, zoom: 1 + 0.008 * f.a.kick }, ...post);
  }
}
