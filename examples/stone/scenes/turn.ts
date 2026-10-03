// TURN (verse 4, lines 67-74, rapped: the turn of the argument). Surfacing at dawn on Yap: the island's shore, the
// harbour bank, the market, the courtroom, Rai's own beach booth, the pier; then the Ledger on its noticeboard on the
// sand, its care rows lighting up as she names them. A hard cut about every 2 beats: each panel starts on the beat at
// or before its trigger word; a panel of 4 beats or more splits into 2-beat variants. Rai acts big all through.
//   surface  "No,": she bursts out of the shallows at dawn, sassy, wagging a finger; NO, slams (the one shake).
//   torch    "not here to torch the bank": at the harbour bank she holds a torch up like Liberty, cheeky, then blows
//            it out: sassy. (The bank's pediment has a rai stone carved in it: money's ancestor; its clock says four.)
//   lies     "or to say that prices are lies": at the market, PRICES ARE LIES; LIES is struck out; she shakes her head.
//   price    "a price is": a basket of fish on the stall, a tag swinging, £4.99.
//   between  "a promise between two strangers": a buyer from another island (their canoe on the beach) and the
//            stallholder shake hands; the tag hanging from their clasp flips to PROMISE.
//   small    "a small miracle": the clasp close; a tiny sparkle; MIRACLE set small.
//   right    "right?": a chibi pop, cheeky.
//   tool     "a miracle's a tool": the courtroom (the jury, the bench with a rai-stone crest); the sparkle lands on
//            the bench as a hammer.
//   judge    "not a judge": a judge's wig drops onto the hammer; it shakes it off; Rai deadpan, then a chibi deadpan.
//   decide   "a tool doesn't get to decide": the jury turn to each other; the hammer back in its toolbox.
//   island   "the island never asked": the island at dawn; islanders in pairs talking, their backs to the stone bank.
//   stone    "the stone its worth": Rai on the shore, shrugging: nobody asked her.
//   they     "they asked each other": pairs face to face, asking (?) and answering (!), a small stone between each.
//   eye      "eye to eye": two faceless profiles, a stone between them, one line of sight through its hole.
//   offer    "So here's my offer": Rai behind her own beach booth, scheming.
//   fees     "no fees": she stamps NO FEES on the contract, joyful (she's selling!).
//   catch    "no catch": under the pier, an empty hook; the fish swim past it.
//   print    "no small print in the deep": a magnifier over the contract's empty foot shows the deep; then Rai peers
//            through it, her eye huge.
//   look     "look at the hands": hands rise against the sun.
//   held     "that held you up": the hands hold up a toddler; Rai in love.
//   say      "say out loud": Rai, determined, shouts through a conch: OUT LOUD.
//   worth    "what they're worth to keep": a hand holding a glowing stone.
//   crowd    "if a crowd": the crowd on the shore at dawn, each with a lantern.
//   count    "can count a stone": tally marks in the sky; below the waterline, a stone's dotted outline in the dark.
//   dark     "in the dark that nobody living has seen": on the deep seabed, her dotted outline; their lantern light
//            reaches down and finds her.
//   ledger   "you can count": THE LEDGER on its noticeboard on the sand, Rai pointing at it, determined.
//   lullaby / lifeboat / lift: its care rows light up as she names them (a glow, not a £), each with its scene: a
//            parent singing a child to sleep, a lifeboat crew in the swell, a pickup's headlights at 3 am; the pull
//            back to the whole board glowing, Rai in love, her heart gold.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { HEX } from '../engine/palette';
import { font } from '../engine/type';
import type { Line, Word } from '../engine/lyrics';
import { clamp, ease, lerp } from '../engine/util';
import { drawRai, h01, type ArmPose } from './_rai';
import { FAM, TAU, gradientV, ledger, person, rgbaHex, slam, stone, type C2, type LedgerRow } from './_motifs';
import { island, seabed, seabedFront, canoe, fish as fishW } from './_world';
import { poof, reactionBg, focusLines, puff } from './_manga';
import { caKick, hitShake, mergePost, punch } from './_post';
import { band, rimmed } from './debate-kit';
import { stall } from './debate-set';
import { block, booth, boardPosts, bench, burst, conch, contract, courtroom, hammer, hand, harbourBank, hook, jury, lifeboat, magnifier, marketBack, pickup, profile, scale, sparkle, tag, tally, toolbox, torch, wig } from './turn-props';

interface Seg { id: string; v: number; s0: number; s1: number }
interface P { c: C2; g: C2; t: number; lt: number; v: number; s0: number; s1: number; post: PostOverrides[] }

/** Rai's hand target (viewer's right arm for side 1) for a pose, in R about her disc's centre, y up (from _rai). */
const HAND: Partial<Record<ArmPose, [number, number]>> = {
  hold: [0.4, -0.3], fist: [1.3, 1.3], point: [1.85, 0.62], up: [1.2, 1.95], reach: [1.75, 1.0], cheek: [0.55, 0.98], chin: [0.18, 0.82], shrug: [1.45, 0.7], wave: [1.35, 1.45], hip: [0.97, -0.12],
};
const handAt = (x: number, y: number, R: number, pose: ArmPose, side = 1): [number, number] => {
  const h = HAND[pose] ?? [1, -0.5];
  return [x + side * h[0] * R, y - h[1] * R];
};

export default class Turn extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  lines: Line[] = [];
  segs: Seg[] = [];
  beat = 0.43;

  override init() {
    const { lyrics, audio: au, start, end } = this.ctx;
    this.lines = lyrics.lines.filter((l) => l.words[0]!.start >= start - 0.1 && l.words[0]!.start < end).slice(0, 8);
    this.beat = 60 / au.bpm;
    const at = (li: number, re?: RegExp, nth = 0) => (re ? this.w(li, re, nth) : this.lines[li]!.words[0]!).start;
    const trig: [string, number][] = [
      ['surface', start], ['torch', at(0, /torch/)], ['lies', at(0, /^say/)],
      ['price', at(1)], ['between', at(1, /between/)], ['small', at(1, /small/)], ['right', at(1, /right/)],
      ['tool', at(2)], ['judge', at(2, /^not/)], ['decide', at(2, /doesn/)],
      ['island', at(3)], ['stone', at(3, /stone/)], ['they', at(3, /they/)], ['eye', at(3, /^eye/)],
      ['offer', at(4)], ['fees', at(4, /^no/, 0)], ['catch', at(4, /catch/) + 0.04], ['print', at(4, /^no/, 2)],
      ['look', at(5)], ['held', at(5, /^that/)], ['say', at(5, /^say/)], ['worth', at(5, /^what/)],
      ['crowd', at(6)], ['count', at(6, /count/)], ['dark', at(6, /dark/)],
      ['ledger', at(7)], ['lullaby', at(7, /lullaby/)], ['lifeboat', at(7, /lifeboat/)], ['lift', at(7, /^lift/)],
    ];
    const beatOf = (x: number) => Math.floor(au.beatAt(x + 0.02));
    let prevB = -1e9;
    const starts = trig.map(([id, x], i) => {
      let b = i === 0 ? Math.round(au.beatAt(start)) : beatOf(x);
      if (b <= prevB) b = prevB + 1;
      prevB = b;
      return { id, b };
    });
    const endB = Math.round(au.beatAt(end));
    starts.forEach((p, i) => {
      const nb = starts[i + 1]?.b ?? endB;
      const n = nb - p.b;
      const parts = n >= 4 ? Math.floor(n / 2) : 1; // 2-beat variants in a long panel
      for (let k = 0; k < parts; k++) {
        const b0 = p.b + k * 2, b1 = k === parts - 1 ? nb : b0 + 2;
        this.segs.push({ id: p.id, v: k, s0: i === 0 && k === 0 ? start : au.timeOfBeat(b0), s1: b1 === endB ? end : au.timeOfBeat(b1) });
      }
    });
  }

  w(li: number, re: RegExp, nth = 0): Word {
    const l = this.lines[li]!;
    return l.words.filter((x) => re.test(x.w.toLowerCase()))[nth] ?? l.words[0]!;
  }
  at(li: number, re: RegExp, nth = 0) { return this.w(li, re, nth).start; }

  /** The line to show in the band: the latest begun (with a short lead), unless the previous is still being sung. */
  lineFor(t: number): Line | null {
    let k = -1;
    this.lines.forEach((l, i) => { if (t >= l.words[0]!.start - 0.35) k = i; });
    if (k > 0 && t < this.lines[k - 1]!.end + 0.05) k -= 1;
    return k >= 0 ? this.lines[k]! : null;
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t;
    this.L.clear(HEX.ink); this.G.clear();
    let seg = this.segs[0]!;
    for (const s of this.segs) if (t >= s.s0) seg = s;
    const p: P = { c, g, t, lt: t - seg.s0, v: seg.v, s0: seg.s0, s1: seg.s1, post: [] };
    c.save(); g.save();
    (this as any)['p_' + seg.id]?.(p);
    c.restore(); g.restore();
    band(c, this.lineFor(t), t, { sung: HEX.yellow, dark: 0.72, size: 50 });
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    return mergePost({ bloom: 0.55, vignette: 0.3 }, punch(t, [seg.s0], 0.02, 0.18), { zoom: 1 + 0.008 * f.a.kick }, ...p.post);
  }

  // ------------------------------------------------------------------ helpers

  /** A slam with the film's hard shadow; adds a punch-in on its hit. */
  sl(p: P, text: string, x: number, y: number, size: number, t0: number, o: { col?: string; shadow?: string; rot?: number; fam?: string; glow?: boolean; t1?: number; punch?: number; maxW?: number } = {}) {
    slam(p.c, text, x, y, size, p.t, t0, { col: o.col ?? HEX.bone, shadow: o.shadow ?? HEX.ink, rot: o.rot, fam: o.fam, t1: o.t1, maxW: o.maxW });
    if (o.glow) { p.g.save(); p.g.globalAlpha = 0.35; slam(p.g, text, x, y, size, p.t, t0, { col: o.col, rot: o.rot, fam: o.fam, t1: o.t1, maxW: o.maxW }); p.g.restore(); }
    if ((o.punch ?? 0.015) > 0) p.post.push(punch(p.t, [t0], o.punch ?? 0.015));
  }
  strike(p: P, x0: number, y: number, x1: number, t0: number, col: string = HEX.coral, w = 22) {
    if (p.t < t0) return;
    const u = ease.outExpo(clamp((p.t - t0) / 0.18));
    p.c.strokeStyle = col; p.c.lineWidth = w; p.c.lineCap = 'round';
    p.c.beginPath(); p.c.moveTo(x0, y + 8); p.c.lineTo(lerp(x0, x1, u), y - 8 * u); p.c.stroke();
  }
  /** The island at dawn as a backdrop. */
  dawn(p: P, o: { horizon?: number; beach?: number; pan?: number; show?: ('huts' | 'palms' | 'bank' | 'canoes' | 'path' | 'lanterns' | 'ship' | 'clouds')[] } = {}) {
    island(p.c, p.t, { time: 'dawn', horizon: o.horizon ?? H * 0.42, beach: o.beach ?? H * 0.62, pan: o.pan ?? 0, show: o.show ?? ['palms', 'huts', 'bank', 'canoes', 'clouds', 'ship'], seed: 5 });
  }

  // ------------------------------------------------------------------ the panels

  p_surface(p: P) {
    const { c, t, lt } = p;
    this.dawn(p, { horizon: 420, beach: 640, show: ['palms', 'huts', 'bank', 'clouds', 'ship'] });
    const R = 140, e = ease.outBack(clamp(lt / 0.32)), x = 620, y = lerp(1060, 770, e);
    const no = this.lines[0]!.words[0]!.start;
    drawRai(c, x, y, R, { t, face: lt < 0.12 ? 'wow' : 'sassy', arms: lt < 0.12 ? ['up', 'up'] : ['hip', 'point'], armsFrom: ['up', 'up'], armsU: clamp((lt - 0.12) / 0.15), tilt: lt > 0.15 ? 0.09 * Math.sin((lt - 0.15) * 16) : 0, marks: ['shine'], markT0: no + 0.15, glow: '#ffd08a', glowStrength: 0.5 });
    // the shallows in front of her, and the splash
    const sea = c.createLinearGradient(0, 780, 0, H);
    sea.addColorStop(0, 'rgba(63,111,176,0.94)'); sea.addColorStop(1, 'rgba(32,52,120,1)');
    c.fillStyle = sea; c.beginPath(); c.moveTo(0, 790);
    for (let xx = 0; xx <= W; xx += 30) c.lineTo(xx, 790 + 8 * Math.sin(xx * 0.01 + t * 3));
    c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,214,160,0.6)'; c.lineWidth = 3;
    for (let i = 0; i < 10; i++) { const yy = 820 + i * 26, xx = ((h01(i, 5) * W + t * 30) % W); c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx + 90, yy); c.stroke(); }
    for (let i = 0; i < 26; i++) {
      const a = Math.PI * (1.08 + 0.84 * h01(i, 7)), sp = 300 + 600 * h01(i, 8), u = clamp(lt / 0.7);
      const px = x + Math.cos(a) * sp * u, py = 790 + Math.sin(a) * sp * u * 1.1 + 1000 * u * u;
      if (u >= 1 || py > 800) continue;
      c.fillStyle = rgbaHex('#dff6ff', 0.85 * (1 - u)); c.beginPath(); c.arc(px, py, 7 + 9 * h01(i, 9), 0, TAU); c.fill();
    }
    c.strokeStyle = rgbaHex('#dff6ff', 0.8 * (1 - clamp(lt / 0.8))); c.lineWidth = 6;
    c.beginPath(); c.ellipse(x, 795, 180 + 320 * clamp(lt / 0.8), 22 + 30 * clamp(lt / 0.8), 0, 0, TAU); c.stroke();
    this.sl(p, 'NO,', 1330, 330, 300, no, { col: HEX.coral, rot: -0.06, punch: 0.04 });
    p.post.push(hitShake(t, [no], 6, 0.3), caKick(t, [no], 4));
  }

  p_torch(p: P) {
    const { c, g, t } = p;
    this.dawn(p, { horizon: 560, beach: 1300, show: ['clouds', 'ship'] });
    harbourBank(c, t, 1310, 720, 380);
    const tw = this.at(0, /torch/), bk = this.at(0, /bank/), out = t > bk + 0.1;
    const R = 140, x = 790, y = 720 - 1.07 * R;
    const [hx, hy] = handAt(x, y, R, 'fist');
    drawRai(c, x, y, R, { t, face: out ? 'sassy' : 'cheeky', arms: ['hip', 'fist'], marks: out ? ['shine'] : [], markT0: bk + 0.12, tilt: out ? 0.08 : -0.04, glow: '#ffd08a', glowStrength: 0.4 });
    torch(c, hx, hy - 10, 200, 0.05, out ? 0 : 1, t);
    if (!out) { g.fillStyle = rgbaHex(HEX.orange, 0.35); g.beginPath(); g.arc(hx, hy - 80, 60, 0, TAU); g.fill(); }
    else if (t < bk + 0.6) puff(c, hx + 20, hy - 90 - 60 * (t - bk), 40 + 60 * (t - bk), `rgba(255,255,255,${0.8 * (1 - (t - bk) / 0.6)})`);
    this.sl(p, 'TORCH', 400, 160, 130, tw, { col: HEX.orange, maxW: 560 });
    this.sl(p, 'THE BANK?', 400, 290, 96, bk, { col: HEX.bone, maxW: 560 });
    this.strike(p, 190, 160, 610, bk + 0.25);
  }

  p_lies(p: P) {
    const { c, t } = p;
    this.dawn(p, { horizon: 330, beach: 520, show: ['clouds'] });
    marketBack(c, t, 640);
    scale(c, 330, 990, 200, t);
    stall(c, 1420, 990, 330, t, 1e9, HEX.pink, 0);
    const li = this.at(0, /lies/), shake = t > li + 0.3;
    drawRai(c, 760, 990 - 1.07 * 150, 150, { t, face: shake ? 'smug' : 'deadpan', arms: ['cross', 'cross'], tilt: shake ? 0.1 * Math.sin((t - li) * 18) : 0, marks: ['sweat'], markT0: li + 0.3, glow: '#ffd08a', glowStrength: 0.3 });
    this.sl(p, 'PRICES ARE', 1380, 150, 110, this.at(0, /prices/), { col: HEX.ink, shadow: HEX.bone });
    this.sl(p, 'LIES', 1380, 300, 190, li, { col: HEX.coral, shadow: HEX.ink });
    this.strike(p, 1180, 300, 1600, li + 0.3, HEX.ink, 28);
  }

  p_price(p: P) {
    const { c, t } = p;
    c.save(); c.translate(W / 2, H / 2); c.scale(1.7, 1.7); c.translate(-W / 2, -H / 2 - 120);
    this.dawn(p, { horizon: 330, beach: 520, show: ['clouds'] });
    marketBack(c, t, 640);
    c.restore();
    c.fillStyle = 'rgba(40,20,40,0.25)'; c.fillRect(0, 0, W, H);
    // the counter, a basket of fish, the tag on its stick
    c.fillStyle = '#b07a48'; c.fillRect(0, 760, W, H - 760);
    c.fillStyle = '#d9a46a'; c.fillRect(0, 740, W, 34);
    c.fillStyle = '#9a6b3f'; c.beginPath(); c.ellipse(820, 760, 330, 90, 0, 0, Math.PI); c.fill();
    for (let i = 0; i < 6; i++) fishW(c, 640 + i * 70, 720 - (i % 2) * 30, 48, ['#6f8cff', '#ff8a2a', '#2fe0ff'][i % 3]!, i % 2 ? 1 : -1, 0, i);
    c.strokeStyle = '#5a3a20'; c.lineWidth = 8; c.beginPath(); c.moveTo(1250, 760); c.lineTo(1250, 430); c.stroke();
    tag(c, 1250 + 210, 440 + 20 * Math.sin(t * 3), 460, 0.1 * Math.sin(t * 3.2), '£4.99', { col: HEX.gold, size: 90, fam: FAM.hook(), string: false });
    this.sl(p, 'A PRICE IS', 660, 200, 120, this.at(1, /price/), { col: HEX.bone });
  }

  p_between(p: P) {
    const { c, g, t } = p;
    this.dawn(p, { horizon: 330, beach: 520, show: ['clouds'] });
    canoe(c, 1650, 610, 0.9, 0);
    marketBack(c, t, 640);
    const h = 360, y = 900, xb = 780, xs = xb + 0.8 * h;
    const tw = this.at(1, /^two/), pm = this.at(1, /promise/), st = this.at(1, /strangers/);
    person(c, xb, y, h, 'point', { col: '#1a1230', t, seed: 4, rim: '#ffd08a', emote: t >= st ? 'joy' : '?', emoteT0: t >= st ? st : p.s0 + 0.1 });
    person(c, xs, y, h * 0.96, 'point', { col: '#22183a', t, seed: 9, flip: true, rim: '#ffd08a', emote: t >= st ? 'joy' : '!', emoteT0: t >= st ? st + 0.1 : p.s0 + 0.3 });
    // the clasp, and the tag hanging from it
    const cx = (xb + 0.4 * h + xs - 0.4 * h * 0.96) / 2, cy = y - 0.84 * h;
    c.fillStyle = '#1a1230'; c.beginPath(); c.arc(cx, cy, 20, 0, TAU); c.fill();
    c.strokeStyle = HEX.bone; c.lineWidth = 3; c.beginPath(); c.moveTo(cx, cy + 10); c.lineTo(cx - 70, cy + 150); c.stroke();
    const flip = clamp((t - pm) / 0.2), sx = Math.abs(Math.cos(flip * Math.PI));
    tag(c, cx, cy + 150, 230, 0.05 * Math.sin(t * 3), flip < 0.5 ? '£4.99' : 'PROMISE', { col: HEX.gold, size: flip < 0.5 ? 40 : 30, fam: flip < 0.5 ? FAM.hook() : FAM.monoB(), string: false, flip: Math.max(0.05, sx) });
    g.fillStyle = rgbaHex(HEX.gold, 0.2 * clamp((t - pm) / 0.3)); g.beginPath(); g.arc(cx, cy + 150, 110, 0, TAU); g.fill();
    this.sl(p, 'A PROMISE', 960, 150, 110, pm, { col: HEX.gold, t1: tw - 0.05 });
    this.sl(p, 'TWO STRANGERS', 960, 150, 120, tw, { col: HEX.bone });
  }

  p_small(p: P) {
    const { c, g, t } = p;
    gradientV(c, '#ff9a7a', '#7a2a6a');
    for (let i = 0; i < 26; i++) { // the market's lights, out of focus
      const bx = h01(i, 11) * W, by = 120 + h01(i, 12) * 600, br = 30 + 60 * h01(i, 13);
      c.fillStyle = `rgba(255,${200 + Math.floor(40 * h01(i, 14))},140,${0.12 + 0.18 * h01(i, 15)})`; c.beginPath(); c.arc(bx, by, br, 0, TAU); c.fill();
    }
    const hd = (k: C2, col: string, side: number) => hand(k, side < 0 ? 440 : 1480, 960, 470, side * 0.95, col, { curl: 0.6 });
    hd(c, '#2a1238', -1); hd(c, '#3a1a48', 1);
    rimmed(g, (k, col) => hd(k, col, -1), '#ffd08a', 0, -5, 0.6); rimmed(g, (k, col) => hd(k, col, 1), '#ffd08a', 0, -5, 0.6);
    c.fillStyle = '#2a1238'; c.beginPath(); c.ellipse(960, 640, 90, 60, 0, 0, TAU); c.fill();
    c.strokeStyle = HEX.bone; c.lineWidth = 4; c.beginPath(); c.moveTo(960, 670); c.lineTo(930, 740); c.stroke();
    tag(c, 1060, 750, 300, 0.04 * Math.sin(t * 3), 'PROMISE', { col: HEX.gold, size: 40, fam: FAM.monoB(), string: false });
    const sm = this.at(1, /small/), mi = this.at(1, /miracle/);
    sparkle(c, 1010, 580, 34, t, mi, HEX.bone); sparkle(g, 1010, 580, 34, t, mi, HEX.gold);
    this.sl(p, 'a small', 1300, 380, 40, sm, { fam: FAM.mono(), col: HEX.bone, punch: 0 });
    this.sl(p, 'MIRACLE', 1300, 440, 66, mi, { col: HEX.gold, glow: true });
  }

  p_right(p: P) {
    const { c, t } = p;
    reactionBg(c, 'tone', '#ff9fc8', '#ff5fa2', t);
    focusLines(c, 760, 560, 280, 'rgba(255,255,255,0.7)', t, { n: 70 });
    drawRai(c, 760, 640, 170, { t, sd: true, face: 'cheeky', arms: ['hip', 'point'], marks: ['shine'], markT0: p.s0 + 0.05, tilt: -0.1 });
    poof(c, 760, 520, 300, t, p.s0);
    this.sl(p, 'RIGHT?', 1440, 380, 200, this.at(1, /right/), { col: HEX.bone, rot: 0.07, punch: 0.03 });
  }

  p_tool(p: P) {
    const { c, g, t } = p;
    courtroom(c, t);
    jury(c, t, 1580, 800, 160, 1e9);
    bench(c, 820, 620, 300);
    const mi = this.at(2, /miracle/), to = this.at(2, /tool/);
    const u = ease.inOutCubic(clamp((t - mi) / 0.5));
    if (u < 1) { const sy = lerp(240, 560, u); sparkle(c, 820, sy, 90 * (1 - u) + 12, t, p.s0, HEX.bone); sparkle(g, 820, sy, 90 * (1 - u) + 12, t, p.s0, HEX.gold); }
    if (u > 0) { c.save(); c.translate(820, 610); c.scale(u, u); hammer(c, 0, 0, 220, lerp(-1.6, -1.5708, u)); c.restore(); }
    this.sl(p, "A MIRACLE'S", 520, 150, 90, mi, { col: HEX.bone });
    this.sl(p, 'A TOOL', 1250, 150, 150, to, { col: HEX.yellow });
  }

  p_judge(p: P) {
    const { c, t } = p;
    courtroom(c, t);
    bench(c, 1150, 640, 360);
    block(c, 1450, 625, 60);
    const ju = this.at(2, /judge/);
    const shake = clamp((t - ju - 0.28) / 0.3);
    const rot = (shake > 0 && shake < 1 ? 0.3 * Math.sin(shake * 18) : 0);
    hammer(c, 1150, 630, 300, rot);                                // stood on its handle on the bench
    const hx = 1150 + Math.sin(rot) * 290, hy = 630 - Math.cos(rot) * 290;
    if (t > ju - 0.2) {
      const drop = ease.outBack(clamp((t - ju + 0.2) / 0.2)), fly = clamp((t - ju - 0.45) / 0.5);
      wig(c, hx + fly * 700, lerp(-200, hy - 30, drop) - fly * 400 + fly * fly * 300, 150, fly * 3);
    }
    // Rai, deadpan in the foreground; a chibi deadpan when it shakes the wig off
    const sd = t > ju + 0.5;
    drawRai(c, 380, 790, 130, { t, face: 'deadpan', arms: 'down', sd, marks: ['sweat'], markT0: ju + 0.1, glow: '#ffd08a', glowStrength: 0.2 });
    poof(c, 380, 690, 200, t, ju + 0.5);
    this.sl(p, 'NOT A', 620, 150, 100, this.at(2, /^not/), { col: HEX.bone });
    this.sl(p, 'JUDGE', 620, 290, 170, ju, { col: HEX.coral, punch: 0.03 });
  }

  p_decide(p: P) {
    const { c, t } = p;
    courtroom(c, t, 1, -200);
    const de = this.at(2, /decide/), dn = this.at(2, /doesn/);
    jury(c, t, 900, 760, 300, dn + 0.15);
    const drop = ease.inCubic(clamp((t - p.s0) / 0.45)), lid = ease.outBack(clamp((t - de) / 0.2));
    if (lid < 0.6) hammer(c, 1660, lerp(480, 860, drop), 220, 0.2);
    toolbox(c, 1660, 900, 300, lid);
    this.sl(p, "DOESN'T GET", 960, 120, 100, dn, { col: HEX.bone });
    this.sl(p, 'TO DECIDE', 960, 250, 130, de, { col: HEX.yellow, punch: 0.03 });
  }

  p_island(p: P) {
    const { c, t } = p;
    this.dawn(p, { horizon: 400, beach: 600, show: ['palms', 'huts', 'bank', 'canoes', 'clouds', 'ship'] });
    // islanders in pairs on the beach, talking, their backs to the stone bank
    const pairs = [[300, 380], [820, 900], [1500, 1580]];
    pairs.forEach(([a, b], i) => {
      person(c, a!, 930, 200, 'point', { col: '#1a1230', t, seed: i * 2, emote: '?', emoteT0: p.s0 + 0.1 * i });
      person(c, b!, 930, 200, 'point', { col: '#22183a', t, seed: i * 2 + 1, flip: true, emote: '!', emoteT0: p.s0 + 0.25 + 0.1 * i });
    });
    this.sl(p, 'THE ISLAND', 560, 150, 110, this.at(3, /island/), { col: HEX.bone });
    this.sl(p, 'NEVER ASKED', 1320, 150, 120, this.at(3, /never/), { col: HEX.yellow });
  }

  p_stone(p: P) {
    const { c, t } = p;
    this.dawn(p, { horizon: 470, beach: 700, pan: 300, show: ['palms', 'clouds', 'bank'] });
    drawRai(c, 620, 930 - 1.07 * 160, 160, { t, face: 'smug', arms: ['shrug', 'shrug'], marks: ['?'], markT0: p.s0 + 0.1, tilt: 0.06, glow: '#ffd08a', glowStrength: 0.3 });
    this.sl(p, 'THE STONE', 1320, 300, 120, this.at(3, /stone/), { col: HEX.bone });
    this.sl(p, 'ITS WORTH?', 1320, 440, 110, this.at(3, /^its/), { col: HEX.yellow });
  }

  p_they(p: P) {
    const { c, g, t } = p;
    this.dawn(p, { horizon: 520, beach: 740, show: ['clouds', 'palms'] });
    const pairs = [[280, 520], [820, 1060], [1380, 1620]];
    const ea = this.at(3, /each/);
    pairs.forEach(([a, b], i) => {
      person(c, a!, 1000, 330, 'point', { col: '#1a1230', t, seed: i * 2, rim: '#ffd08a', emote: t >= ea ? '!' : '?', emoteT0: t >= ea ? ea + 0.1 * i : p.s0 + 0.1 * i });
      person(c, b!, 1000, 330, 'point', { col: '#22183a', t, seed: i * 2 + 1, flip: true, rim: '#ffd08a', emote: t >= ea ? 'joy' : '?', emoteT0: t >= ea ? ea + 0.15 + 0.1 * i : p.s0 + 0.2 + 0.1 * i });
      const mx = (a! + b!) / 2, my = 1000 - 270;
      stone(c, mx, my, 34, { seed: 70 + i, heart: HEX.gold, heartA: 0.8 });
      g.fillStyle = rgbaHex(HEX.gold, 0.25); g.beginPath(); g.arc(mx, my, 50, 0, TAU); g.fill();
    });
    this.sl(p, 'THEY ASKED', 960, 140, 100, this.at(3, /they/), { col: HEX.bone });
    this.sl(p, 'EACH OTHER', 960, 270, 140, ea, { col: HEX.yellow });
  }

  p_eye(p: P) {
    const { c, g, t } = p;
    this.dawn(p, { horizon: 640, beach: 1300, show: ['clouds', 'ship'] });
    profile(c, 470, 560, 420, false, '#1a1230');
    profile(c, 1450, 560, 420, true, '#22183a');
    stone(c, 960, 540, 130, { seed: 9, heart: HEX.gold, heartA: 0.9 });
    const e = this.at(3, /^eye/), u = ease.outExpo(clamp((t - e) / 0.4));
    const y = 560 - 0.1 * 420, hy = 540 + 130 * 0.06;
    g.strokeStyle = rgbaHex(HEX.bone, 0.9 * u); g.lineWidth = 6;
    g.beginPath(); g.moveTo(470 + 0.3 * 420, y); g.quadraticCurveTo(960, hy, 1450 - 0.3 * 420, y); g.stroke();
    this.sl(p, 'EYE TO EYE', 960, 170, 160, e, { col: HEX.ink, shadow: HEX.bone, punch: 0.03 });
  }

  p_offer(p: P) {
    const { c, t } = p;
    this.dawn(p, { horizon: 420, beach: 620, show: ['clouds', 'palms', 'ship'] });
    c.save(); c.globalAlpha = 0.5; reactionBg(c, 'stripes', '#2a0f3a', '#4b1c66', t); c.restore();
    const R = 130, x = 1260, y = 700;
    drawRai(c, x, y, R, { t, face: 'scheme', arms: ['chin', 'hold'], tilt: -0.05, look: -1, glow: '#c65cf0', glowStrength: 0.5 });
    booth(c, t, x, 960, 470, "RAI'S OFFER");
    const sl = ease.outBack(clamp(p.lt / 0.3));
    contract(c, lerp(-300, 560, sl), 560, 460, 600, { rot: -0.06, title: 'MY OFFER', rows: [['FEES', '0'], ['CATCH', 'none'], ['SMALL PRINT', '']] });
    this.sl(p, "SO HERE'S MY", 560, 150, 96, this.at(4, /here/), { col: HEX.bone });
  }

  p_fees(p: P) {
    const { c, t } = p;
    this.dawn(p, { horizon: 420, beach: 620, show: ['clouds', 'palms', 'ship'] });
    const fe = this.at(4, /fees/), of = this.at(4, /offer/);
    const R = 120, x = 1450, y = 700;
    const pump = t >= fe ? Math.abs(Math.sin((t - fe) * 12)) * 0.2 : 0;
    drawRai(c, x, y, R, { t, face: 'joy', arms: ['fist', 'fist'], hop: pump, marks: ['sparkle'], markT0: of, glow: HEX.gold, glowStrength: 0.6 });
    booth(c, t, x, 960, 470, "RAI'S OFFER");
    contract(c, 720, 560, 760, 900, { rot: -0.03, title: 'MY OFFER', rows: [['FEES', '£0'], ['CATCH', 'none'], ['SMALL PRINT', '']] });
    if (t >= fe) {
      c.save(); c.translate(820, 520); c.rotate(-0.16);
      const k = 1 + 0.6 * (1 - ease.outBack(clamp((t - fe) / 0.15)));
      c.scale(k, k);
      c.strokeStyle = HEX.coral; c.lineWidth = 12; c.strokeRect(-280, -90, 560, 180);
      c.font = font(FAM.hook(), 120); c.fillStyle = HEX.coral; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('NO FEES', 0, 6);
      c.restore();
      p.post.push(punch(t, [fe], 0.03));
    }
    this.sl(p, 'OFFER:', 1450, 150, 130, of, { col: HEX.yellow });
  }

  p_catch(p: P) {
    const { c, t, lt } = p;
    seabed(c, t, { depth: 0.25, floor: 900, clues: ['shells', 'bottle'], shark: false, seed: 12 });
    c.fillStyle = '#5a3a24'; for (const px of [260, 1680]) c.fillRect(px - 26, -10, 52, 820);    // the pier's posts
    c.fillStyle = 'rgba(220,250,255,0.5)'; c.fillRect(0, 0, W, 16);
    hook(c, 960, 540, 200, t);
    for (let i = 0; i < 4; i++) {
      const x = ((lt * (220 + 60 * i) + 500 * i) % (W + 400)) - 200, y = 420 + 120 * i + 20 * Math.sin(t * 2 + i);
      fishW(c, x, y, 34 + 10 * h01(i, 3), [HEX.coral, HEX.yellow, '#ffffff', HEX.orange][i]!, 1, t, i);
    }
    seabedFront(c, t, { seed: 12 });
    this.sl(p, 'NO CATCH', 960, 200, 170, Math.max(p.s0, this.at(4, /catch/)), { col: HEX.bone, punch: 0.03 });
  }

  p_print(p: P) {
    const { c, t } = p;
    const deep = (k: C2, cx: number, cy: number, r: number) => {
      const gr = k.createLinearGradient(0, cy - r, 0, cy + r);
      gr.addColorStop(0, '#2a9fe0'); gr.addColorStop(1, '#123f86');
      k.fillStyle = gr; k.fillRect(cx - r, cy - r, 2 * r, 2 * r);
      for (let i = 0; i < 12; i++) {
        const bx = cx + (h01(i, 51) - 0.5) * 1.6 * r, by = cy + r - (((h01(i, 52) + t * 0.25) % 1) * 2 * r);
        k.strokeStyle = 'rgba(220,250,255,0.75)'; k.lineWidth = 2; k.beginPath(); k.arc(bx, by, 4 + 8 * h01(i, 53), 0, TAU); k.stroke();
      }
      fishW(k, cx + Math.sin(t * 1.2) * r * 0.4, cy + r * 0.2, r * 0.12, HEX.coral, Math.cos(t * 1.2) > 0 ? 1 : -1, t);
    };
    if (p.v === 0) {
      gradientV(c, '#f7f1e3', '#ede4cf');
      c.fillStyle = rgbaHex(HEX.ink, 0.25);
      for (let i = 0; i < 4; i++) c.fillRect(260, 120 + i * 46, 1100 - i * 140, 14);
      c.font = font(FAM.mono(), 26); c.fillStyle = rgbaHex(HEX.ink, 0.45); c.textAlign = 'left'; c.fillText('small print:', 260, 430);
      c.strokeStyle = rgbaHex(HEX.ink, 0.2); c.setLineDash([6, 10]); c.lineWidth = 2; c.strokeRect(250, 450, 1420, 330); c.setLineDash([]);
      const mx = lerp(520, 1400, ease.inOutQuad(clamp(p.lt / (p.s1 - p.s0))));
      magnifier(c, mx, 600, 140, (k) => deep(k, mx, 600, 140));
      this.sl(p, 'NO SMALL PRINT', 960, 300, 120, this.at(4, /small/), { col: HEX.ink, shadow: HEX.coral });
    } else {
      // Rai peers through the glass: her eye, huge
      this.dawn(p, { horizon: 420, beach: 620, show: ['clouds', 'palms'] });
      const R = 170, x = 760, y = 900 - 1.07 * R;
      const raiOpts = { t, face: 'wow' as const, arms: ['down', 'hold'] as [ArmPose, ArmPose], noBlink: true, glow: '#ffd08a', glowStrength: 0.3 };
      drawRai(c, x, y, R, raiOpts);
      const lx = x + 0.3 * R, ly = y - 1.2 * R - 0.15 * R, lr = 150;
      magnifier(c, lx, ly, lr, (k) => { k.fillStyle = '#f2e8d2'; k.fillRect(lx - lr, ly - lr, 2 * lr, 2 * lr); k.translate(lx, ly); k.scale(2, 2); k.translate(-lx, -ly); drawRai(k, x, y, R, raiOpts); });
      this.sl(p, 'IN THE', 1480, 330, 110, this.at(4, /^in$/), { col: HEX.bone });
      this.sl(p, 'DEEP', 1480, 480, 190, this.at(4, /deep/), { col: HEX.cyan, shadow: HEX.ink, punch: 0.03 });
    }
  }

  hands(p: P, n: number, rise: number, y0: number, seed: number) {
    const { t, g } = p;
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) * (W / n) + 40 * (h01(i, seed) - 0.5);
      const d = clamp(rise * 1.4 - 0.4 * h01(i, seed + 1));
      const s = 260 + 120 * h01(i, seed + 2);
      const y = y0 + s * 1.3 - ease.outBack(d) * s * (0.9 + 0.5 * h01(i, seed + 3)), r = (h01(i, seed + 4) - 0.5) * 0.5 + 0.06 * Math.sin(t * 2 + i);
      const draw = (k: C2, col: string) => hand(k, x, y, s, r, col, { curl: 0.15 });
      draw(p.c, ['#2a1238', '#3a1a48', '#4a2048'][i % 3]!);
      rimmed(g, draw, HEX.gold, 0, 5, 0.8);
    }
  }

  p_look(p: P) {
    const { c, lt } = p;
    this.dawn(p, { horizon: 760, beach: 1400, show: ['clouds'] });
    this.hands(p, 9, clamp(lt / 0.4), 780, 61);
    this.sl(p, 'LOOK', 960, 190, 190, this.at(5, /look/), { col: HEX.bone });
    void c;
  }

  p_held(p: P) {
    const { c, t } = p;
    this.dawn(p, { horizon: 760, beach: 1400, show: ['clouds'] });
    const lift = ease.outBack(clamp((t - this.at(5, /held/)) / 0.3));
    this.hands(p, 9, 1, 860 - 60 * lift, 71);
    const body = (k: C2, col: string) => person(k, 1180, 560 - 80 * lift, 270, 'cheer', { col, t, seed: 2, emote: 'joy', emoteT0: this.at(5, /held/) });
    body(c, '#1a0f2a');
    rimmed(p.g, body, HEX.gold, 0, -5, 0.9);
    drawRai(c, 1640, 760, 105, { t, face: 'love', arms: ['cheek', 'cheek'], marks: ['hearts'], markT0: this.at(5, /held/), blush: 1, glow: HEX.pink, glowStrength: 0.5, heart: 0.8 });
    this.sl(p, 'THE HANDS', 560, 120, 100, Math.max(p.s0, this.at(5, /hands/)), { col: HEX.bone });
    this.sl(p, 'HELD YOU UP', 560, 245, 120, this.at(5, /held/), { col: HEX.yellow });
  }

  p_say(p: P) {
    const { c, t } = p;
    this.dawn(p, { horizon: 430, beach: 640, show: ['palms', 'huts', 'clouds'] });
    const sa = this.at(5, /^say/), lo = this.at(5, /loud/);
    const R = 140, x = 470, y = 930 - 1.07 * R;
    drawRai(c, x, y, R, { t, face: 'determined', arms: ['fist', 'cheek'], squash: t > lo ? 0.1 * Math.sin((t - lo) * 20) * Math.exp(-(t - lo) * 3) : 0, marks: ['steam'], markT0: lo, glow: HEX.coral, glowStrength: 0.4 });
    conch(c, x + 0.95 * R, y - 1.1 * R, 0.55 * R, -0.15);
    if (t > sa - 0.03) {
      const k = ease.outBack(clamp((t - sa) / 0.18));
      focusLines(c, 1230, 470, 320 * k, 'rgba(255,255,255,0.55)', t, { n: 60 });
      burst(c, 1230, 470, 330 * k, HEX.yellow, 14, 3, t);
    }
    this.sl(p, 'SAY IT', 1230, 390, 120, sa, { col: HEX.ink, shadow: HEX.bone });
    this.sl(p, 'OUT LOUD', 1230, 540, 160, this.at(5, /^out/), { col: HEX.coral, shadow: HEX.ink, rot: -0.04, punch: 0.035 });
  }

  p_worth(p: P) {
    const { c, g, t } = p;
    this.dawn(p, { horizon: 560, beach: 860, show: ['clouds', 'ship'] });
    c.fillStyle = 'rgba(40,20,60,0.25)'; c.fillRect(0, 0, W, H);
    const draw = (k: C2, col: string) => hand(k, 960, 1180, 520, 0, col, { curl: 0.45 });
    draw(c, '#3b2470');
    const rg = g.createRadialGradient(960, 560, 100, 960, 560, 300);
    rg.addColorStop(0, rgbaHex(HEX.gold, 0.3)); rg.addColorStop(1, rgbaHex(HEX.gold, 0));
    g.fillStyle = rg; g.fillRect(660, 260, 600, 600);
    rimmed(g, draw, HEX.gold, 0, -5, 0.7);
    stone(c, 960, 560, 110, { seed: 12, glow: HEX.gold, glowA: 0.9, heart: HEX.gold, heartA: 0.9 });
    g.save(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(960, 560, 110, 0, TAU); g.fill(); g.restore();
    this.sl(p, 'WORTH', 470, 330, 160, this.at(5, /worth/), { col: HEX.gold, glow: true });
    this.sl(p, 'TO KEEP', 1450, 330, 140, this.at(5, /keep/), { col: HEX.bone });
  }

  p_crowd(p: P) {
    const { c, g, t } = p;
    this.dawn(p, { horizon: 520, beach: 700, show: ['palms', 'huts', 'clouds'] });
    for (let i = 0; i < 26; i++) {
      const x = 80 + i * 68 + 20 * h01(i, 3), hh = 150 + 70 * h01(i, 4), y = 860 + 40 * h01(i, 5);
      person(c, x, y, hh, i % 3 === 0 ? 'wave' : 'stand', { col: '#1a1230', t, seed: i, rim: '#ffd08a' });
      const lx = x + (i % 3 === 0 ? 0.2 * hh : 0.12 * hh), ly = y - (i % 3 === 0 ? 1.0 : 0.46) * hh;
      c.fillStyle = '#ffd678'; c.beginPath(); c.arc(lx, ly, 7, 0, TAU); c.fill();
      g.fillStyle = rgbaHex(HEX.gold, 0.6); g.beginPath(); g.arc(lx, ly, 14, 0, TAU); g.fill();
    }
    this.sl(p, 'IF A CROWD', 960, 200, 150, this.at(6, /crowd/), { col: HEX.bone });
  }

  p_count(p: P) {
    const { c, g, t } = p;
    const wl = 540;
    this.dawn(p, { horizon: 400, beach: 530, show: ['clouds'] });
    const sea = c.createLinearGradient(0, wl, 0, H);
    sea.addColorStop(0, '#2b5aa8'); sea.addColorStop(0.5, '#0b2a62'); sea.addColorStop(1, '#030a1e');
    c.fillStyle = sea; c.fillRect(0, wl, W, H - wl);
    c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 3; c.beginPath();
    for (let x = 0; x <= W; x += 30) c.lineTo(x, wl + 5 * Math.sin(x * 0.02 + t * 2)); c.stroke();
    for (let i = 0; i < 22; i++) {
      const x = 300 + i * 60, hh = 90 + 30 * h01(i, 6);
      person(c, x, wl - 6, hh, 'stand', { col: '#1a1230', t, seed: i });
      g.fillStyle = rgbaHex(HEX.gold, 0.7); g.beginPath(); g.arc(x + 0.12 * hh, wl - 6 - 0.46 * hh, 6, 0, TAU); g.fill();
    }
    c.save(); c.setLineDash([6, 12]); c.lineWidth = 4; c.strokeStyle = rgbaHex(HEX.bone, 0.6);
    c.beginPath(); c.arc(960, 800, 100, 0, TAU); c.moveTo(960 + 27, 812); c.arc(960, 812, 27, 0, TAU); c.stroke(); c.restore();
    const co = this.at(6, /count/);
    const n = t < co ? 0 : Math.min(9, 1 + Math.floor((t - co) / (this.beat / 2)));
    tally(c, 200, 330, 110, n, HEX.bone); tally(g, 200, 330, 110, n, rgbaHex(HEX.gold, 0.4));
    this.sl(p, 'CAN COUNT', 1240, 130, 140, co, { col: HEX.yellow });
    this.sl(p, 'A STONE', 1240, 270, 120, this.at(6, /stone/), { col: HEX.bone });
  }

  p_dark(p: P) {
    const { c, g, t } = p;
    seabed(c, t, { depth: 1, floor: 900, clues: ['shells'], shark: false, seed: 15 });
    c.fillStyle = 'rgba(2,6,20,0.55)'; c.fillRect(0, 0, W, H);
    const z = p.v === 0 ? 1 : 1.3, cx = 960, cy = p.v === 0 ? 620 : 640, R = 150 * z;
    const sees = p.v === 1 ? ease.outCubic(clamp(p.lt / 0.6)) : 0;
    if (sees > 0) {
      for (let i = 0; i < 18; i++) {
        const x = W * (0.1 + 0.8 * h01(i, 501)), a = sees * clamp((p.lt - 0.03 * i) / 0.3);
        const gr = g.createLinearGradient(x, 0, cx, cy);
        gr.addColorStop(0, rgbaHex(HEX.gold, 0.45 * a)); gr.addColorStop(1, rgbaHex(HEX.gold, 0));
        g.strokeStyle = gr; g.lineWidth = 3; g.beginPath(); g.moveTo(x, 0); g.lineTo(cx, cy); g.stroke();
        g.fillStyle = rgbaHex(HEX.gold, 0.8 * a); g.beginPath(); g.arc(x, 14, 6, 0, TAU); g.fill();
      }
      c.save(); c.globalAlpha = 0.6 * sees;
      drawRai(c, cx, cy, R, { t, face: sees > 0.7 ? 'love' : 'soft', arms: sees > 0.7 ? ['cheek', 'cheek'] : 'down', glow: HEX.gold, glowStrength: sees, heart: sees, heartColor: HEX.gold, marks: sees > 0.7 ? ['hearts'] : [], markT0: p.s0 + 0.45 });
      c.restore();
    }
    c.save(); c.setLineDash([8, 14]); c.lineWidth = 5; c.strokeStyle = rgbaHex(HEX.bone, 0.75 * (1 - 0.6 * sees));
    c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.moveTo(cx + 0.27 * R, cy + 0.12 * R); c.arc(cx, cy + 0.12 * R, 0.27 * R, 0, TAU); c.stroke();
    c.beginPath(); c.arc(cx, cy - 1.2 * R, 0.74 * R, 0, TAU); c.stroke(); c.restore();
    seabedFront(c, t, { seed: 15 });
    this.sl(p, 'IN THE DARK', 960, 120, 100, Math.max(p.s0, this.at(6, /dark/)), { col: HEX.cyan, t1: this.at(6, /nobody/) - 0.2 });
    this.sl(p, 'NOBODY LIVING', 960, 120, 110, this.at(6, /nobody/), { col: HEX.bone });
    this.sl(p, 'HAS SEEN', p.v === 0 ? 960 : 1500, p.v === 0 ? 240 : 480, 110, this.at(6, /^has/), { col: HEX.gold, glow: true });
  }

  rows(t: number): LedgerRow[] {
    const lu = this.at(7, /lullaby/), lb = this.at(7, /lifeboat/), lf = this.at(7, /^lift/);
    const lit = (x: number) => ease.outCubic(clamp((t - x) / 0.45));
    return [
      { label: 'DELIVERY RIDER', value: '£14.50', care: false },
      { label: 'A LULLABY', value: '0', care: true, lit: lit(lu) },
      { label: 'A LIFEBOAT CREW', value: '0', care: true, lit: lit(lb) },
      { label: 'A LIFT TO THE DOCTOR, 3 AM', value: '0', care: true, lit: lit(lf) },
    ];
  }

  /** The Ledger drawn at a camera: (fx, fy) a point of the board brought to the frame's (sx, sy) at zoom z. */
  board(p: P, z: number, fx: number, fy: number, sx: number, sy: number, rot = 0) {
    const { c, g, t } = p;
    for (const k of [c, g]) { k.save(); k.translate(sx, sy); k.rotate(rot); k.scale(z, z); k.translate(-fx, -fy); }
    boardPosts(c, 500, 0, 1000, 430);
    ledger(c, t, 0, 0, 1000, this.rows(t), { title: 'NATIONAL ACCOUNTS', blink: 1, rowH: 74, size: 34 });
    this.rows(t).forEach((r, i) => {
      if (!r.lit) return;
      const ry = 70 + 74 * (i + 0.75) - 12;
      g.fillStyle = rgbaHex(HEX.gold, 0.05 * r.lit); g.fillRect(20, ry - 34, 960, 56);
      g.fillStyle = rgbaHex(HEX.gold, 0.35 * r.lit); g.beginPath(); g.arc(1000 - 48, ry - 4, 16, 0, TAU); g.fill();
    });
    for (const k of [c, g]) k.restore();
  }

  /** A small scene beside a lit row, framed like a window. */
  vignette(p: P, x: number, y: number, w: number, h: number, t0: number, draw: (k: C2) => void) {
    const { c, t } = p;
    const a = ease.outBack(clamp((t - t0) / 0.25));
    if (a <= 0) return;
    c.save(); c.translate(x, y); c.scale(a, a);
    c.fillStyle = '#f7f1e3'; c.beginPath(); c.roundRect(-w / 2 - 10, -h / 2 - 10, w + 20, h + 20, 18); c.fill();
    c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, 12); c.clip();
    c.translate(-w / 2, -h / 2); c.scale(w / 420, h / 300);   // the scenes are drawn in a 420 x 300 box
    draw(c);
    c.restore();
  }

  p_ledger(p: P) {
    const { c, t } = p;
    this.dawn(p, { horizon: 520, beach: 760, show: ['palms', 'clouds', 'ship'] });
    const e = ease.outBack(clamp(p.lt / 0.3));
    this.board(p, 0.95 * e + 0.01, 500, 215, 720, 500, -0.02);
    drawRai(c, 1600, 940 - 1.07 * 130, 130, { t, face: 'determined', arms: ['point', 'down'], marks: ['sparkle'], markT0: this.at(7, /count/), glow: HEX.gold, glowStrength: 0.4 });
    this.sl(p, 'COUNT', 1500, 190, 120, this.at(7, /count/), { col: HEX.yellow, punch: 0.03 });
  }

  p_lullaby(p: P) {
    const { c, t } = p;
    this.dawn(p, { horizon: 520, beach: 760, show: ['palms', 'clouds'] });
    c.fillStyle = 'rgba(30,20,50,0.35)'; c.fillRect(0, 0, W, H);
    this.board(p, 1.45, 500, 70 + 74 * 1.75 - 12, 800, 580, -0.03);
    const lu = this.at(7, /lullaby/);
    this.vignette(p, 1720, 250, 340, 250, lu, (k) => { // a parent singing a child to sleep, at night
      gradientV(k, '#2a1f5a', '#141030', 0, 0, 420, 300);
      k.fillStyle = '#ffd678'; k.beginPath(); k.arc(340, 70, 26, 0, TAU); k.fill();
      person(k, 200, 290, 220, 'hold', { col: '#0d0a1a', t, seed: 3, emote: 'music', emoteT0: lu });
    });
  }

  p_lifeboat(p: P) {
    const { c, t } = p;
    this.dawn(p, { horizon: 520, beach: 760, show: ['palms', 'clouds'] });
    c.fillStyle = 'rgba(30,20,50,0.35)'; c.fillRect(0, 0, W, H);
    this.board(p, 1.4, 500, 70 + 74 * 2.75 - 12, 800, 560, 0.03);
    const lb = this.at(7, /lifeboat/);
    this.vignette(p, 1720, 250, 340, 250, lb, (k) => {
      gradientV(k, '#3a4a8a', '#1a2050', 0, 0, 440, 300);
      for (let i = 0; i < 20; i++) { k.strokeStyle = 'rgba(200,220,255,0.4)'; k.lineWidth = 2; const rx = h01(i, 5) * 440, ry = ((h01(i, 6) * 300 + t * 300) % 300); k.beginPath(); k.moveTo(rx, ry); k.lineTo(rx - 10, ry + 30); k.stroke(); }
      lifeboat(k, 220, 190, 120, t);
    });
  }

  p_lift(p: P) {
    const { c, t } = p;
    this.dawn(p, { horizon: 520, beach: 760, show: ['palms', 'clouds', 'ship'] });
    const lf = this.at(7, /^lift/);
    const pull = ease.inOutCubic(clamp((t - lf - 0.45) / 0.7));
    c.fillStyle = `rgba(30,20,50,${0.35 * (1 - pull)})`; c.fillRect(0, 0, W, H);
    const z = lerp(1.4, 0.92, pull), fy = lerp(70 + 74 * 3.75 - 12, 215, pull);
    this.board(p, z, 500, fy, lerp(800, 760, pull), lerp(560, 470, pull), 0);
    if (pull < 0.6) this.vignette(p, 1720, 250, 340, 250, lf, (k) => {
      gradientV(k, '#0b0f2e', '#1a1440', 0, 0, 440, 300);
      for (let i = 0; i < 30; i++) { k.fillStyle = 'rgba(255,255,255,0.7)'; k.beginPath(); k.arc(h01(i, 8) * 440, h01(i, 9) * 160, 1.5, 0, TAU); k.fill(); }
      k.fillStyle = '#2a2448'; k.fillRect(0, 230, 440, 70);
      pickup(k, 150, 262, 90, t);
      k.font = font(FAM.monoB(), 34); k.fillStyle = '#ffd678'; k.textAlign = 'right'; k.fillText('3:00', 420, 50);
    });
    if (pull > 0.15) {
      c.save(); c.globalAlpha = clamp((pull - 0.15) / 0.4);
      drawRai(c, 1620, 940 - 1.07 * 140, 140, { t, face: 'love', arms: ['cheek', 'cheek'], marks: ['hearts'], markT0: lf + 0.6, blush: 1, glow: HEX.gold, glowStrength: 1, heart: 1, heartColor: HEX.gold });
      c.restore();
    }
  }
}
