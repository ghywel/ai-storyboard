// LIFT (the breakdown, lines 63-66, the darkest section, a chant that builds). On the seabed (_world's cartoon sea,
// deep and dark at first, brightening as she rises): the pole through Rai's heart (drawn behind her disc: the hole is
// real, so it shows through) and the shoulders that join under it on the beats. Four shots, one per line, each cut on
// the beat at or before its line:
//   1 "One pole, every shoulder": close on her heart in the dark; on "pole" a gold pole slides in through the hole;
//     on "every shoulder" the first two shoulders step in under it at the frame's edges. Soft.
//   2 "nobody carries me alone": the medium shot; a shoulder joins on every beat, alternating sides, each with a
//     flash of colour as they take the weight; the first light from above. Smile.
//   3 "one pole, every shoulder": wide; two join on every beat, rows behind rows; even the shark slides under the
//     pole's end and takes the weight (she gives it a startled look, then a wave); the crowd fills the foreground.
//   4 "lift it, lift it, bring it home": every arm pushes up on each "lift"; on "bring" she rises fast off their
//     hands towards the surface, the fish scattering, light flooding down; on "home" she pops into chibi joy and the
//     frame goes bright, into the dawn of `turn`.
// Clues: the half-buried stones on the sand (others waiting) light their hearts as she rises (who is next); the old
// anchor (the iron hull that brought money's world) is left behind on the sand.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { HEX } from '../engine/palette';
import type { Line, Word } from '../engine/lyrics';
import { clamp, ease, lerp } from '../engine/util';
import { drawRai, h01, type ArmPose, type Face } from './_rai';
import { FAM, TAU, rgbaHex, slam, stone } from './_motifs';
import { poof, type Mark } from './_manga';
import { fish, seabed, seabedFront, shark } from './_world';
import { caKick, hitShake, mergePost, punch } from './_post';
import { band, camera, carrier, poleY, rimmed } from './debate-kit';

const HF = 300, R = 0.76 * HF;
const POLE = -poleY(HF), DISC = POLE - 0.12 * R;
const NEON = [HEX.cyan, HEX.pink, HEX.orange, HEX.lime, HEX.yellow, HEX.coral, HEX.violet, HEX.peri];
const BODY = ['#0b1838', '#102452', '#16306a'];   // front, middle, back rows: further is closer to the water's blue

interface Slot { x: number; feet: number; h: number; row: number; join: number; col: string; seed: number; shark?: boolean }

export default class Lift extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  lines: Line[] = [];
  cuts: number[] = [];
  slots: Slot[] = [];
  sharkJoin = 0;

  override init() {
    const { lyrics, audio: au, start, end } = this.ctx;
    this.lines = lyrics.lines.filter((l) => l.words[0]!.start >= start - 0.1 && l.words[0]!.start < end).slice(0, 4);
    this.cuts = this.lines.map((l, i) => (i === 0 ? start : au.timeOfBeat(Math.floor(au.beatAt(l.words[0]!.start + 0.02)))));
    // the shoulders: two on "every shoulder", then one a beat through line 2, then two a beat through line 3
    const b0 = Math.ceil(au.beatAt(this.word(this.lines[0]!, /every/).start + 0.05));
    const joins: number[] = [au.timeOfBeat(b0), au.timeOfBeat(b0 + 1)];
    const b2 = Math.round(au.beatAt(this.cuts[1]!)), b3 = Math.round(au.beatAt(this.cuts[2]!)), b4 = Math.round(au.beatAt(this.cuts[3]!));
    for (let b = b2; b < b3; b++) joins.push(au.timeOfBeat(b));
    for (let b = b3; b < b4; b++) { joins.push(au.timeOfBeat(b)); joins.push(au.timeOfBeat(b) + 0.5 * (au.timeOfBeat(b + 1) - au.timeOfBeat(b))); }
    // positions: outwards from her on alternating sides, rows behind rows; the shark takes the weight at +1040
    type P = { x: number; row: number; shark?: boolean };
    const F = (x: number): P => ({ x, row: 0 }), B = (x: number): P => ({ x, row: 1 }), T = (x: number): P => ({ x, row: 2 });
    const pos: P[] = [
      F(-400), F(400),
      F(-720), F(720), B(-560), B(560), B(-880), B(880), F(-1040), B(1200),
      B(-1200), { x: 840, row: 0, shark: true }, F(-1360), F(1360), B(-1520), B(1520), T(-480), T(480), T(-800), T(800), F(-1680), F(1680), T(-1120), T(1120), B(-1840), B(1840),
    ];
    this.slots = joins.map((j, i) => {
      const p = pos[i % pos.length]!;
      const h = HF * [1, 0.84, 0.7][p.row]!, feet = [0, -36, -66][p.row]!;
      if (p.shark) this.sharkJoin = j;
      return { x: p.x, feet, h, row: p.row, join: j, col: NEON[i % NEON.length]!, seed: 40 + i, shark: p.shark };
    });
  }

  word(line: Line, re: RegExp, nth = 0): Word {
    return line.words.filter((w) => re.test(w.w.toLowerCase()))[nth] ?? line.words[0]!;
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t;
    this.L.clear(HEX.ink); this.G.clear();
    const shot = Math.max(0, this.cuts.filter((x) => t >= x).length - 1);
    const line = this.lines[shot]!;
    const s0 = this.cuts[shot]!, s1 = this.cuts[shot + 1] ?? this.ctx.end, lt = t - s0, sp = clamp(lt / (s1 - s0));
    const L0 = this.lines[0]!, L1 = this.lines[1]!, L2 = this.lines[2]!, L3 = this.lines[3]!;
    const lift1 = this.word(L3, /lift/, 0).start, lift2 = this.word(L3, /lift/, 1).start, bring = this.word(L3, /bring/).start, home = this.word(L3, /home/).start;
    const end = this.ctx.end;

    // ---- the lift: arms push up on each "lift", then she rises off their hands
    const up = shot < 3 ? 0 : 0.5 * ease.outBack(clamp((t - lift1) / 0.25)) + 0.5 * ease.outBack(clamp((t - lift2) / 0.25));
    const rise = t < bring ? 0 : 1100 * ease.inQuad(clamp((t - bring) / (end - bring)));
    const dy = -(poleY(HF, up) - poleY(HF, 0)) - rise;
    const sdNow = shot === 3 && t >= home - 0.02;
    const raiY = DISC + dy, poleY0 = POLE + dy + (sdNow ? 0.48 * R : 0);   // the chibi's little heart sits lower

    // ---- the camera
    let cx = 0, cy: number, z: number;
    if (shot === 0) { z = lerp(1.58, 1.4, ease.inOutQuad(sp)); cy = DISC - 0.62 * R; }
    else if (shot === 1) { z = lerp(1.0, 0.9, sp); cy = -340; }
    else if (shot === 2) { z = lerp(0.74, 0.64, sp); cy = -400; }
    else { z = lerp(0.74, 0.8, sp); cy = -320 - 0.35 * (poleY(HF, up) - poleY(HF, 0)) - 0.62 * rise; }
    const floorS = (0 - cy) * z + H / 2;

    // ---- the seabed: dark at first, brightening as the shoulders gather and she rises
    const flood = 0.9 * ease.inCubic(clamp((t - bring) / (end - bring + 0.05)));
    const depth = shot === 0 ? 1 : shot === 1 ? lerp(0.9, 0.78, sp) : shot === 2 ? lerp(0.72, 0.6, sp) : lerp(0.55, 0.1, ease.inQuad(clamp((t - lift1) / (end - lift1))));
    seabed(c, t, { depth, floor: floorS, pan: cx * z, clues: ['stone', 'anchor'], shark: false, seed: 6 });

    // ---- the world
    c.save(); g.save();
    camera(c, cx, cy, z); camera(g, cx, cy, z);
    // the stones still waiting on the sand: their hearts light as she rises (who is next)
    const wait = [[-1500, 30, 70], [-260, 60, 44], [1500, 40, 62], [620, 70, 50], [2100, 20, 80]] as const;
    wait.forEach(([x, y, r], i) => {
      const lit = shot === 3 ? clamp((t - bring - 0.15 * i) / 0.5) : 0;
      stone(c, x, y - r * 0.6, r, { seed: 30 + i, tilt: (h01(i, 3) - 0.5) * 0.5, heart: lit > 0 ? HEX.pink : undefined, heartA: lit, glow: lit > 0 ? HEX.pink : undefined, glowA: 0.6 * lit });
    });
    // the light pooled around her and the pole, so the silhouettes read
    const poleLit = shot === 0 ? clamp((t - this.word(L0, /pole/).start) / 1.2) : 1;
    const joined = this.slots.filter((s) => t >= s.join).length;
    const hz = 0.1 + 0.25 * poleLit + 0.01 * joined;
    const rg = c.createRadialGradient(0, poleY0, 0, 0, poleY0, 1500);
    rg.addColorStop(0, rgbaHex(HEX.gold, Math.min(0.45, hz))); rg.addColorStop(0.4, rgbaHex('#7fd6ff', 0.1 * Math.min(1, hz * 2))); rg.addColorStop(1, 'rgba(127,214,255,0)');
    c.fillStyle = rg; c.beginPath(); c.ellipse(0, poleY0, 2600, 760, 0, 0, TAU); c.fill();

    // the pole: slides in from the left through her heart on "pole" (shot 1), then runs out of frame
    const pSlide = shot === 0 ? ease.outCubic(clamp((t - this.word(L0, /pole/).start + 0.1) / 1.0)) : 1;
    const px0 = -2700, px1 = lerp(-900, 2700, pSlide);
    if (pSlide > 0) {
      c.lineCap = 'round';
      c.strokeStyle = '#3a2410'; c.lineWidth = 20; c.beginPath(); c.moveTo(px0, poleY0); c.lineTo(px1, poleY0); c.stroke();
      c.strokeStyle = HEX.gold; c.lineWidth = 14; c.beginPath(); c.moveTo(px0, poleY0); c.lineTo(px1, poleY0); c.stroke();
      g.lineCap = 'round'; g.strokeStyle = rgbaHex(HEX.gold, 0.45 + 0.25 * f.a.kick); g.lineWidth = 30;
      g.beginPath(); g.moveTo(px0, poleY0); g.lineTo(px1, poleY0); g.stroke();
      for (const s of this.slots) { // light runs out along the pole from each new shoulder
        const age = t - s.join;
        if (age < 0 || age > 0.6) continue;
        g.fillStyle = rgbaHex(HEX.gold, 0.8 * (1 - age / 0.6));
        g.beginPath(); g.ellipse(s.x, poleY0, 30 + 500 * age, 9, 0, 0, TAU); g.fill();
      }
    }

    // Rai on the pole
    const sd = shot === 3 && t >= home - 0.02;
    const sharkAge = t - this.sharkJoin;
    let face: Face = 'soft', arms: ArmPose | [ArmPose, ArmPose] = 'down', marks: Mark[] = [], markT0 = s0 + 0.1;
    if (shot === 1) { face = t >= this.word(L1, /alone/).start ? 'love' : 'smile'; arms = t >= this.word(L1, /alone/).start ? ['cheek', 'cheek'] : 'down'; marks = t >= this.word(L1, /alone/).start ? ['hearts'] : []; markT0 = this.word(L1, /alone/).start; }
    if (shot === 2) {
      if (sharkAge > -0.3 && sharkAge < 0.6) { face = 'shock'; arms = ['up', 'up']; marks = ['!?', 'sweat']; markT0 = this.sharkJoin - 0.3; }
      else if (sharkAge >= 0.6) { face = 'grin'; arms = ['down', 'wave']; marks = ['sparkle']; markT0 = this.sharkJoin + 0.6; }
      else face = 'smile';
    }
    if (shot === 3) { face = sd ? 'joy' : t >= bring ? 'joy' : 'wow'; arms = ['up', 'up']; marks = sd ? ['sparkle', 'hearts'] : t >= bring ? ['sparkle'] : []; markT0 = sd ? home : t >= bring ? bring : lift1; }
    drawRai(c, 0, raiY, R, {
      t, face, arms, armsFrom: 'down', armsU: clamp(lt / 0.2), marks, markT0, sd,
      glow: shot === 3 ? HEX.gold : '#7fd6ff', glowStrength: 0.4 + 0.25 * shot + flood, heart: 0.35 + 0.18 * shot + 0.1 * f.a.kick, heartColor: HEX.gold,
      squash: shot === 3 && !sd ? 0.08 * Math.sin((t - lift1) * 12) : 0,
    });
    if (shot === 3) poof(c, 0, raiY - 0.6 * R, R * 1.4, t, home);
    g.save(); g.globalCompositeOperation = 'destination-out';
    if (!sd) {
      g.beginPath(); g.arc(0, raiY, R, 0, TAU); g.moveTo(0.27 * R, raiY + 0.12 * R); g.arc(0, raiY + 0.12 * R, 0.27 * R, 0, TAU); g.fill('evenodd');
      g.beginPath(); g.arc(0, raiY - 1.2 * R, 0.8 * R, 0, TAU); g.fill();
    }
    g.restore();

    // the fish: circling her, then scattering as she rises
    for (let i = 0; i < 12; i++) {
      const a0 = h01(i, 91) * TAU, rr = R * (1.6 + 0.9 * h01(i, 92)), sp2 = 0.4 + 0.4 * h01(i, 93);
      const ang = a0 + t * sp2 * (i % 2 ? 1 : -1);
      let fx = Math.cos(ang) * rr * 1.4, fy = raiY - 0.3 * R + Math.sin(ang) * rr * 0.55;
      let dir = (i % 2 ? 1 : -1) * (Math.sin(ang) > 0 ? -1 : 1);
      if (shot === 3 && t > bring) { // scatter: dart away from her, fast
        const u = ease.outCubic(clamp((t - bring - 0.03 * i) / 0.6));
        const ox = Math.cos(a0) * 1400 * u, oy = Math.sin(a0) * 700 * u + 300 * u;
        fx += ox; fy += oy; dir = Math.cos(a0) > 0 ? 1 : -1;
      }
      if (shot >= 2) fish(c, fx, fy, 22 + 10 * h01(i, 94), ['#ffd23f', '#ff8a2a', '#ffffff', '#ff7a8a'][i % 4]!, dir, t, i);
    }

    // the shoulders, back rows first; the shark takes the weight at the right end
    const order = this.slots.map((_, i) => i).sort((a, b) => this.slots[b]!.row - this.slots[a]!.row);
    for (const i of order) {
      const s = this.slots[i]!;
      const age = t - s.join;
      if (s.shark) continue;
      if (age < 0) continue;
      const a = ease.outCubic(clamp(age / 0.18));
      const armsU = ease.outBack(clamp((age - 0.04) / 0.22));
      const sy = s.feet + (1 - a) * 40;
      const draw = (k: CanvasRenderingContext2D, col: string) => carrier(k, s.x, sy, s.h, { col, t, seed: s.seed, arms: armsU, up });
      c.save(); c.globalAlpha = a; draw(c, BODY[s.row]!); c.restore();
      const flash = Math.exp(-age / 0.4);
      rimmed(g, draw, flash > 0.3 ? s.col : '#9fe8ff', -3, -5, (0.3 + 0.7 * flash) * a * [1, 0.7, 0.5][s.row]!);
    }
    // the shark slides under the pole's end and takes the weight, in front of the rows
    const sk = this.slots.find((s) => s.shark);
    if (sk && shot >= 2) {
      this.sharkUnder(c, t, sk, poleY0, t - sk.join);
      g.save(); g.globalCompositeOperation = 'destination-out'; this.sharkUnder(g, t, sk, poleY0, t - sk.join); g.restore();   // it hides the glow behind it
    }
    c.restore(); g.restore();

    // shot 1 is the darkest: only the heart and the pole are lit at first
    if (shot === 0) {
      const hx = W / 2, hy = (POLE - cy) * z + H / 2;
      const dk = 0.82 - 0.42 * poleLit;
      const vg = c.createRadialGradient(hx, hy, 60, hx, hy, 950);
      vg.addColorStop(0, 'rgba(2,6,20,0)'); vg.addColorStop(0.45, `rgba(2,6,20,${dk * 0.7})`); vg.addColorStop(1, `rgba(2,6,20,${dk})`);
      c.fillStyle = vg; c.fillRect(0, 0, W, H);
    }
    seabedFront(c, t, { seed: 6 });
    // the crowd in front of us (backs to camera), joining on the beats of line 3, arms up for "lift it"
    if (shot >= 2) this.crowd(c, g, t, up, rise * z * 0.4);

    // the flood of light from the surface: the dawn waiting above, screened over the sea so it brightens, not greys
    if (flood > 0) {
      const fl = flood;
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, rgbaHex('#fff1d2', fl)); gr.addColorStop(0.5, rgbaHex('#ffc27a', 0.9 * fl)); gr.addColorStop(1, rgbaHex('#ff9a6a', 0.75 * fl));
      c.save(); c.globalCompositeOperation = 'screen'; c.fillStyle = gr; c.fillRect(0, 0, W, H); c.restore();
      c.fillStyle = rgbaHex('#ffd9a0', 0.22 * fl); c.fillRect(0, 0, W, H);
    }

    // ---- type: the chant
    let post: PostOverrides = { bloom: 0.7, vignette: 0.45 - 0.35 * flood };
    if (shot === 0) {
      slam(c, 'ONE', 300, 360, 150, t, this.word(L0, /one/).start, { fam: FAM.cond(), col: HEX.gold, shadow: HEX.ink });
      slam(c, 'POLE', 300, 510, 150, t, this.word(L0, /pole/).start, { fam: FAM.cond(), col: HEX.gold, shadow: HEX.ink });
      slam(c, 'EVERY', W - 300, 360, 130, t, this.word(L0, /every/).start, { fam: FAM.cond(), col: HEX.bone, shadow: HEX.ink });
      slam(c, 'SHOULDER', W - 300, 500, 130, t, this.word(L0, /shoulder/).start, { fam: FAM.cond(), col: HEX.bone, shadow: HEX.ink });
      post = mergePost(post, punch(t, [this.word(L0, /pole/).start], 0.02));
    } else if (shot === 1) {
      slam(c, 'NOBODY', 400, 200, 140, t, this.word(L1, /nobody/).start, { fam: FAM.cond(), col: HEX.bone, shadow: HEX.ink, rot: -0.04 });
      slam(c, 'CARRIES', 470, 330, 90, t, this.word(L1, /carries/).start, { fam: FAM.cond(), col: HEX.bone, shadow: HEX.ink, rot: -0.04, align: 'right' });
      slam(c, 'ME', 500, 322, 90, t, this.word(L1, /^me/).start, { fam: FAM.cond(), col: HEX.bone, shadow: HEX.ink, rot: -0.04, align: 'left' });
      slam(c, 'ALONE', W - 400, 250, 170, t, this.word(L1, /alone/).start, { fam: FAM.cond(), col: HEX.gold, shadow: HEX.ink, rot: 0.04 });
    } else if (shot === 2) {
      // the chant reprise: every word slams in on its own start (the line is in the picture, not the band)
      slam(c, 'ONE', 330, 330, 150, t, this.word(L2, /one/).start, { fam: FAM.cond(), col: HEX.gold, shadow: HEX.ink });
      slam(c, 'POLE,', 330, 480, 150, t, this.word(L2, /pole/).start, { fam: FAM.cond(), col: HEX.gold, shadow: HEX.ink });
      slam(c, 'EVERY', W - 330, 330, 130, t, this.word(L2, /every/).start, { fam: FAM.cond(), col: HEX.bone, shadow: HEX.ink });
      slam(c, 'SHOULDER,', W - 330, 470, 130, t, this.word(L2, /shoulder/).start, { fam: FAM.cond(), col: HEX.bone, shadow: HEX.ink });
      post = mergePost(post, punch(t, [this.sharkJoin], 0.02));
    } else {
      const it = (n: number) => this.word(L3, /^it/, n).start;
      const cond = FAM.cond();
      slam(c, 'LIFT', 600, 170, 190, t, lift1, { fam: cond, col: HEX.bone, shadow: HEX.ink, align: 'right', rot: -0.04, t1: home - 0.02, exit: 0.12 });
      slam(c, 'IT,', 630, 170, 190, t, it(0), { fam: cond, col: HEX.bone, shadow: HEX.ink, align: 'left', rot: -0.04, t1: home - 0.02, exit: 0.12 });
      slam(c, 'LIFT', 1360, 170, 220, t, lift2, { fam: cond, col: HEX.gold, shadow: HEX.ink, align: 'right', rot: 0.04, t1: home - 0.02, exit: 0.12 });
      slam(c, 'IT,', 1390, 170, 220, t, it(1), { fam: cond, col: HEX.gold, shadow: HEX.ink, align: 'left', rot: 0.04, t1: home - 0.02, exit: 0.12 });
      slam(c, 'BRING', 420, 420, 180, t, bring, { fam: cond, col: HEX.gold, shadow: HEX.ink, t1: home - 0.02, exit: 0.12 });
      slam(c, 'IT', 1500, 420, 180, t, it(2), { fam: cond, col: HEX.gold, shadow: HEX.ink, t1: home - 0.02, exit: 0.12 });
      slam(c, 'HOME.', W / 2, 820, 300, t, home, { col: HEX.ink, shadow: HEX.gold, shadowOff: 0.04 });
      post = mergePost(post, punch(t, [lift1, lift2], 0.03), punch(t, [home], 0.04), hitShake(t, [home], 5, 0.3), caKick(t, [home], 4));
    }
    if (shot < 2) band(c, line, t, { sung: HEX.gold, dark: shot === 0 ? 0.85 : 0.6, size: 54 });

    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    return mergePost(post, { zoom: 1 + 0.01 * f.a.kick, flash: t > home ? 0.3 * Math.exp(-(t - home) / 0.05) : 0 });
  }

  /** The shark glides in from the right and slides under the pole's end, taking the weight, grinning. */
  sharkUnder(c: CanvasRenderingContext2D, t: number, s: Slot, poleY0: number, age: number) {
    if (age < -0.6) return;
    const u = ease.outCubic(clamp((age + 0.6) / 0.6));
    const sz = 270, x = lerp(s.x + 1700, s.x, u), y = poleY0 + 0.3 * sz + 4 * Math.sin(t * 2);
    shark(c, x, y, sz, -1, t, '#3f6a9e');
  }

  /** Heads and shoulders along the bottom of the frame, backs to us; they step in two a beat through line 3. */
  crowd(c: CanvasRenderingContext2D, g: CanvasRenderingContext2D, t: number, up: number, drop: number) {
    const t0 = this.cuts[2]!, beat = 60 / this.ctx.audio.bpm, n = 16;
    for (let i = 0; i < n; i++) {
      const k = (i * 7) % n;
      const tj = t0 + 0.2 + k * beat * 0.5;
      const age = t - tj;
      if (age < 0) continue;
      const a = ease.outCubic(clamp(age / 0.2));
      const x = (i + 0.5) * (W / n) + 30 * (h01(i, 81) - 0.5), sc = 0.85 + 0.35 * h01(i, 82);
      const y = H + 30 - 150 * sc + (1 - a) * 120 + drop;
      const col = NEON[(i * 3) % NEON.length]!;
      const draw = (k2: CanvasRenderingContext2D, fill: string) => {
        k2.save(); k2.fillStyle = fill; k2.strokeStyle = fill; k2.lineCap = 'round';
        k2.beginPath(); k2.arc(x, y, 34 * sc, 0, TAU); k2.fill();
        k2.beginPath(); k2.ellipse(x, y + 120 * sc, 90 * sc, 80 * sc, 0, Math.PI, 0); k2.lineTo(x + 90 * sc, y + 300); k2.lineTo(x - 90 * sc, y + 300); k2.closePath(); k2.fill();
        if (up > 0.02) {
          k2.lineWidth = 22 * sc;
          for (const sd of [-1, 1]) {
            const ax = x + sd * 70 * sc, ay = y + 70 * sc;
            k2.beginPath(); k2.moveTo(ax, ay); k2.quadraticCurveTo(ax + sd * 40 * sc, ay - 80 * sc * up, ax + sd * 30 * sc, ay - 210 * sc * up); k2.stroke();
          }
        }
        k2.restore();
      };
      c.save(); c.globalAlpha = a; draw(c, '#06102a'); c.restore();
      rimmed(g, draw, col, -4, -5, (0.25 + 0.75 * Math.exp(-age / 0.4)) * a);
    }
  }
}
