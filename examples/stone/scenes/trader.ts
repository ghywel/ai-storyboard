// TRADER (verse 2, lines 18-21, rapped): the iron hull, stones in bulk, a fraction; value is the crossing.
// Every shot is somewhere (his direction, 2026-10-02), with a clue planted; hard cuts about every 2 beats, each on the
// beat at or before the word it pictures (kit: beatCut). Rai acts in her cut-ins and on the stone bank.
//   1 SEABED  "Then a trader": chorus 1's seabed of waiting stones; an iron keel's shadow slides over and an anchor
//             thuds into the sand by her. Clue: the old rusted anchor already lying there (the iron hull to come).
//   2 ARRIVAL "sailed in with an": Yap at sunset (huts, the stone bank, canoes); the steamship sails in behind the
//             palms; islanders point. TRADER. Clue: the canoes pulled up on the sand (how the stones always came).
//   3 IRON    "iron hull:": the riveted hull at the waterline. IRON / HULL. Clue: the load line, a ring with a bar
//             through it (the ring motif, and weight: how heavy she may ride).
//   4 PADDLE  "why paddle? I'll": he leans over his towering rail at a canoe of paddlers; WHY PADDLE?; Rai's cut-in:
//             deadpan with a sweat drop, then sassy. Clue: the canoe's plaited sail (worn by crossings).
//   5 TON     "bring you a ton": on his deck a 1 TON weight drops (hitShake); the islanders jump. Clue: the crates
//             stencilled IRON TOOLS (what made cutting stones in bulk easy).
//   6 SHIPPED "he shipped us in": identical discs pasted onto the beach, one per 1/32 note; SHIPPED; Rai's cut-in:
//             indignant (vein, steam, fists). Clue: the bank behind, every stone in it a different size.
//   7 BULK    "bulk; the": rows of identical discs to the horizon under a selection box; BULK; chibi Rai stomps.
//   8 THANKS  "island said thanks, and priced": the islanders' polite THANKS!, while an elder measures one of his
//             discs with a stick (the pricing to come).
//   9 PRICED  "his": his discs on the sand before the bank, a tag on each, 1. PRICED.
//  10 FRACTION "at a fraction of": the tags drop and are re-stamped 1/10; Rai's cut-in: smug.
//  11 ONE     "one; 'cause": Rai on the stone bank with her own tag, 1, gold; his disc below at 1/10. ONE.
//  12-16 THE VOYAGE "value's the crossing, the risk and the reef, the hands and the hours it cost": the open sea at
//     dawn leaving Palau's cliffs (VALUE'S; clue: the morning star they steer by), the storm (RISK; a shark fin
//     circling), the reef above and below the waterline (REEF), the paddlers' hands (HANDS), the days wheeling over
//     the canoe (HOURS; clue: the tally on the mast), landing on Yap at dawn, the stone carried up the beach on its pole
//     (IT COST; clue: the pole on many shoulders, the breakdown to come).
//  17 HEAVY   "not how heavy you are,": in the trader's post Rai hops onto his platform scale; the needle slams into
//             the red; cheeky shrug. NOT HOW / HEAVY. Clue: the open ledger book on his counter (the Ledger to come),
//             his copra sacks (what he really came for).
//  18 SHINE   "not how you shine,": his gold coins glint on the counter; Rai, sassy, outshines nothing. NOT HOW / YOU
//             SHINE.
//  19 VOYAGE  "but the voyage, and": Rai on the beach at dusk, hand on heart, her heart lit gold; the voyage's golden
//             wake runs from the horizon to her and rings her. BUT THE / VOYAGE. Clue: the canoe resting, sail furled.
//  20 LOST    "what could be lost.": the night storm, the stone slides off the canoe into the sea, the lantern dies,
//             lightning; LOST sinks under the water (her own story).
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { HEX } from '../engine/palette';
import { font } from '../engine/type';
import type { Line, Word } from '../engine/lyrics';
import { clamp, ease, lerp } from '../engine/util';
import { drawRai, h01 } from './_rai';
import { FAM, TAU, gradientV, person, rgbaHex, slam, stone } from './_motifs';
import { island, seabed, seabedFront, stoneBank, discStone } from './_world';
import { focusLines, poof, star4, puff } from './_manga';
import { caKick, hitShake, mergePost, punch } from './_post';
import { band, beatCut, bubble, cutIn, discSprite, paste, plateLines, priceTag, shotAt, slam2, smoke, stampText, steamship, wordOf } from './trader-kit';
import { cliffs, coinStack, crate, deck, hullClose, hullFromBelow, isleBack, isleProps, islanders, ledgerBook, lightning, openSea, platformScale, rain, reefSplit, stormSky, tradingPost, voyageCanoe, waves } from './trader-sea';

type Sprite = ReturnType<typeof discSprite>;
type Shot = ReturnType<typeof shotAt>;
type C = CanvasRenderingContext2D;
type Out = { sung?: string; post?: PostOverrides };
const RIM = 'rgba(255,170,110,0.9)';

export default class Trader extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  own: Line[] = [];
  bandLines: Line[] = [];
  cuts: number[] = [];
  w: Record<string, Word> = {};
  disc!: Sprite;
  chorusWaiting = 0;

  override init() {
    const { lyrics, audio: au, start, end } = this.ctx;
    const { own, band: bl } = plateLines(lyrics.lines, start, end);
    this.own = own; this.bandLines = bl;
    const q = (re: RegExp, n = 0) => wordOf(own, re, n);
    this.w = {
      then: q(/^then/), trader: q(/^trader/), sailed: q(/^sailed/), iron: q(/^iron/), hull: q(/^hull/), why: q(/why/), paddle: q(/^paddle/),
      ill: q(/^i.ll/), bring: q(/^bring/), ton: q(/^ton/), shipped: q(/^shipped/), bulk: q(/^bulk/), island: q(/^island/),
      thanks: q(/^thanks/), his: q(/^his$/), fraction: q(/^fraction/), one: q(/^one/), value: q(/^value/), crossing: q(/^crossing/),
      risk: q(/^risk/), reef: q(/^reef/), hands: q(/^hands/), hours: q(/^hours/), cost: q(/^cost/), not1: q(/^not$/, 0),
      heavy: q(/^heavy/), not2: q(/^not$/, 1), shine: q(/^shine/), but: q(/^but$/), voyage: q(/^voyage/), what: q(/^what$/), lost: q(/^lost/),
    };
    const w = this.w;
    const keys = [w.sailed, w.iron, w.why, w.bring, w.shipped, w.bulk, w.island, w.his, w.fraction, w.one,
      w.value, w.risk, w.reef, w.hours, w.cost, w.not1, w.not2, w.voyage, w.what];
    this.cuts = [start, ...keys.map((k) => beatCut(au, k!.start))];
    this.disc = discSprite(120, 7);
    // chorus 1's last line lit the waiting stones on "waiting": they are still lit as we arrive
    const prev = lyrics.lines.filter((l) => l.words[0]!.start < start - 0.1).pop();
    this.chorusWaiting = prev?.words.find((x) => /waiting/i.test(x.w))?.start ?? start - 3;
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, end } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t;
    this.L.clear(HEX.ink); this.G.clear();
    const s = shotAt(this.cuts, t, end);
    const shots = [this.seabed, this.arrival, this.ironHull, this.whyPaddle, this.ton, this.shipped, this.bulk, this.thanks, this.priced, this.fraction,
      this.one, this.valueSea, this.risk, this.reefHands, this.hours, this.cost, this.heavy, this.shine, this.voyage, this.lost];
    const fn = (shots[s.i] ?? this.seabed) as (...a: unknown[]) => Out | undefined;
    const r = fn.call(this, c, g, t, s, f) ?? {};
    band(c, this.bandLines, t, { sung: r.sung ?? HEX.yellow, dark: 0.78 });
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    return mergePost({ bloom: 0.6 }, r.post, { zoom: 1 + 0.008 * f.a.kick });
  }

  // ------------------------------------------------------------------ 1 the seabed: an iron keel overhead

  seabed(c: C, g: C, t: number, s: Shot): Out {
    seabed(c, t, { depth: 0.85, clues: ['anchor', 'shells'], seed: 4 });
    // chorus 1's waiting stones, where it left them; their hearts dim as the keel's shadow passes
    const shadow = clamp((t - s.s0 - 0.15) / 0.5);
    const nStones = 30, order = Array.from({ length: nStones }, (_, i) => i).sort((a, b) => h01(a, 601) - h01(b, 601));
    const placed = order.map((i) => ({ i, depth: h01(i, 602) })).sort((a, b) => a.depth - b.depth);
    for (const { i, depth } of placed) {
      const k = order.indexOf(i);
      const x = W * (0.04 + 0.92 * h01(i, 603)), y = H * (0.6 + 0.24 * depth), r = 14 + 34 * depth;
      if (Math.abs(x - W * 0.5) < 160 && y < H * 0.82) continue;
      const lit = k < 5 ? clamp((t - this.chorusWaiting - 0.08 * k) / 0.6) * (1 - 0.8 * shadow) : 0;
      stone(c, x, y, r, { seed: i, tilt: (h01(i, 604) - 0.5) * 0.4, heart: lit > 0 ? HEX.pink : undefined, heartA: Math.min(1, 0.7 * lit), glow: lit > 0 ? HEX.pink : undefined, glowA: 0.4 * lit });
    }
    // the keel passing over the surface, its shadow falling down through the water
    const hx = lerp(W * 1.45, -W * 0.25, (t - s.s0) / 1.5);
    const sg = c.createLinearGradient(0, 0, 0, H);
    sg.addColorStop(0, 'rgba(6,10,30,0.55)'); sg.addColorStop(1, 'rgba(6,10,30,0.15)');
    c.fillStyle = sg;
    c.beginPath(); c.moveTo(hx - 560, 0); c.lineTo(hx + 560, 0); c.lineTo(hx + 760, H); c.lineTo(hx - 760, H); c.closePath(); c.fill();
    hullFromBelow(c, t, hx, 22, 1150);
    // the anchor on its chain: dropped from the hull, it thuds into the sand on "trader"
    const land = this.w.trader!.start, drop = clamp((t - (land - 0.42)) / 0.42), ax = W * 0.7, ay = lerp(-140, H * 0.79, ease.inQuad(drop));
    if (drop > 0) {
      c.strokeStyle = '#2b3060'; c.lineWidth = 7;
      for (let yy = -10; yy < ay - 110; yy += 26) { c.beginPath(); c.ellipse(ax, yy, 8, 13, 0, 0, TAU); c.stroke(); }
      c.save(); c.translate(ax, ay); c.rotate(t >= land ? 0.18 : 0);
      c.strokeStyle = '#3a4280'; c.lineCap = 'round'; c.lineWidth = 16;
      c.beginPath(); c.moveTo(0, -110); c.lineTo(0, 10); c.stroke();
      c.beginPath(); c.arc(0, -20, 62, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
      c.lineWidth = 13; c.beginPath(); c.moveTo(-34, -86); c.lineTo(34, -86); c.stroke();
      c.lineWidth = 8; c.beginPath(); c.arc(0, -124, 15, 0, TAU); c.stroke();
      c.restore();
      if (t >= land) for (let k = 0; k < 9; k++) { const u = clamp((t - land) / 0.5), a = Math.PI + (k / 8) * Math.PI; puff(c, ax + Math.cos(a) * (40 + 120 * u), ay + 20 + Math.sin(a) * 40 * u, 24 + 20 * u, `rgba(241,220,158,${0.85 * (1 - u)})`); }
    }
    // Rai looks up at it; the thud makes her jump
    const after = t >= land, jump = after ? Math.max(0, Math.sin(clamp((t - land) / 0.3) * Math.PI)) * 0.35 : 0;
    drawRai(c, W * 0.5, H * 0.58, 100, {
      // she starts as chorus 1 left her (wow, hands at her cheeks, the "!"), then looks up at the shadow (?)
      t, face: after ? 'shock' : 'wow', look: t < s.s0 + 0.25 ? 0 : 0.6, arms: after ? ['up', 'up'] : ['cheek', 'cheek'], armsFrom: after ? ['cheek', 'cheek'] : undefined, armsU: clamp((t - land) / 0.12),
      hop: jump, squash: after && t - land < 0.08 ? -0.3 : 0, glow: HEX.pink, heart: 0.6 * (1 - shadow), marks: after ? ['!', 'sweat'] : t < s.s0 + 0.3 ? ['!'] : ['?'], markT0: after ? land : t < s.s0 + 0.3 ? -1e9 : s.s0 + 0.3,
    });
    seabedFront(c, t, { seed: 4 });
    return { post: hitShake(t, [land], 4, 0.3) };
  }

  // ------------------------------------------------------------------ 2 Yap at sunset; the steamship sails in

  arrival(c: C, g: C, t: number, s: Shot): Out {
    const hz = H * 0.42, bch = H * 0.62, S = 760;
    isleBack(c, t, { time: 'sunset', horizon: hz, beach: bch });
    const xAt = (tt: number) => lerp(W * 1.12, W * 0.6, ease.outCubic(clamp((tt - s.s0) / 0.9)));
    const y = hz + 78 + 3 * Math.sin(t * 2);
    smoke(c, t, (tb) => [xAt(tb) + 0.03 * S, y - 0.34 * S], { size: 22, wind: [220, -40] });
    steamship(c, xAt(t), y, S, t);
    isleProps(c, t, { time: 'sunset', beach: bch });
    const t0 = this.w.sailed!.start;
    islanders(c, t, [
      { x: W * 0.14, y: H * 0.79, h: 200, pose: 'point', emote: '!', t0 },
      { x: W * 0.22, y: H * 0.8, h: 180, pose: 'hold', emote: '?', t0: t0 + 0.1 },
      { x: W * 0.3, y: H * 0.79, h: 205, pose: 'point', emote: '!', t0: t0 + 0.18 },
      { x: W * 0.4, y: H * 0.8, h: 120, pose: 'wave', t0 },
    ], '#1d1430', RIM);
    slam(c, 'TRADER', W * 0.5, H * 0.12, 170, t, s.s0, { col: HEX.bone, shadow: HEX.ink, rot: -0.03 });
    return { post: punch(t, [s.s0], 0.02) };
  }

  // ------------------------------------------------------------------ 3 the iron hull

  ironHull(c: C, g: C, t: number, s: Shot): Out {
    hullClose(c, t, 260 * s.lt);
    slam(c, 'IRON', W * 0.42, H * 0.27, 270, t, this.w.iron!.start, { col: HEX.bone, shadow: HEX.ink, shadowOff: 0.07, rot: -0.04 });
    slam(c, 'HULL', W * 0.42, H * 0.53, 270, t, this.w.hull!.start, { col: HEX.yellow, shadow: HEX.ink, shadowOff: 0.07, rot: 0.03 });
    return { post: punch(t, [this.w.iron!.start, this.w.hull!.start], 0.025) };
  }

  // ------------------------------------------------------------------ 4 why paddle?

  whyPaddle(c: C, g: C, t: number, s: Shot): Out {
    openSea(c, t, 'sunset', H * 0.46);
    // the canoe of the old way, carrying its stone, small beside his iron
    voyageCanoe(c, W * 0.2, H * 0.8 + 5 * Math.sin(t * 2.6), 470, t * 1.4, { stoneR: 56, emote: '?', emoteT0: this.w.why!.start + 0.15, tilt: 0.03 * Math.sin(t * 2) });
    const S = 2400, x = W * 0.56 + 0.52 * S, y = H * 0.92;
    steamship(c, x, y, S, t);
    const deckY = y - 0.12 * S;
    person(c, W * 0.67, deckY, 210, 'point', { col: HEX.ink, flip: true, t, rim: RIM });
    bubble(c, 'WHY PADDLE?', W * 0.68, H * 0.15, 72, W * 0.672, deckY - 190, t, this.w.why!.start);
    // Rai's cut-in: deadpan, a sweat drop; then sassy on "I'll"
    const sassy = t >= this.w.ill!.start;
    cutIn(c, t, this.w.paddle!.start - 0.05, [[70, 70], [650, 46], [622, 430], [96, 452]], ['tone', '#bfe6ff', '#a7d8f5'], () => {
      drawRai(c, 360, 420, 118, { t, face: sassy ? 'sassy' : 'deadpan', arms: sassy ? ['hip', 'hip'] : ['cross', 'cross'], marks: sassy ? ['shine'] : ['sweat'], markT0: sassy ? this.w.ill!.start : this.w.paddle!.start, tilt: sassy ? 0.1 : -0.04, glow: HEX.bone, glowStrength: 0.3 });
    });
    return {};
  }

  // ------------------------------------------------------------------ 5 a ton

  ton(c: C, g: C, t: number, s: Shot): Out {
    const deckY = H * 0.56;
    deck(c, t, deckY);
    crate(c, 90, deckY + 40, 230, 170, 'IRON TOOLS');
    crate(c, 150, deckY - 110, 190, 150, 'IRON TOOLS');
    // the derrick: mast, boom, hook
    c.strokeStyle = '#3a4aa8'; c.lineWidth = 22; c.lineCap = 'round';
    c.beginPath(); c.moveTo(W * 0.86, H); c.lineTo(W * 0.86, -20); c.stroke();
    c.lineWidth = 14; c.beginPath(); c.moveTo(W * 0.86, H * 0.5); c.lineTo(W * 0.52, H * 0.04); c.stroke();
    const tl = this.w.ton!.start - 0.06, land = tl + 0.12, fall = clamp((t - tl) / 0.12), wh = 280, wTop = 380, wBot = 480;
    const restY = H * 0.86 - wh, hangY = H * 0.14 + 10 * Math.sin(t * 4);
    const y = lerp(hangY, restY, ease.inQuad(fall));
    c.strokeStyle = HEX.ink; c.lineWidth = 6;
    if (fall < 1) { c.beginPath(); c.moveTo(W * 0.52, H * 0.04); c.lineTo(W * 0.5, y - 60); c.stroke(); }
    // the islanders on his deck: wary, then they jump
    const jump = t >= land ? Math.max(0, Math.sin(clamp((t - land) / 0.35) * Math.PI)) * 60 : 0;
    islanders(c, t, [
      { x: W * 0.26, y: H * 0.86 - jump, h: 260, pose: t >= land ? 'cheer' : 'stand', emote: '!', t0: land },
      { x: W * 0.75, y: H * 0.88 - jump * 0.8, h: 250, pose: t >= land ? 'cheer' : 'point', flip: true, emote: '!', t0: land + 0.05 },
    ], '#1d1430', RIM);
    c.save();
    c.translate(W * 0.5, y); c.rotate(fall < 1 ? 0.05 * Math.sin(t * 5) : 0);
    c.lineWidth = 24; c.strokeStyle = '#1a1426';
    c.beginPath(); c.arc(0, -10, 48, Math.PI, 0); c.stroke();
    c.beginPath(); c.moveTo(-wTop / 2, 0); c.lineTo(wTop / 2, 0); c.lineTo(wBot / 2, wh); c.lineTo(-wBot / 2, wh); c.closePath();
    c.fillStyle = '#1a1426'; c.fill(); c.strokeStyle = '#5a5070'; c.lineWidth = 6; c.stroke();
    c.font = font(FAM.hook(), 140); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = HEX.bone;
    c.fillText('1 TON', 0, wh * 0.55);
    c.restore();
    if (t >= land) {
      const u = clamp((t - land) / 0.5);
      for (let k = 0; k < 12; k++) { const side = k % 2 ? 1 : -1; puff(c, W * 0.5 + side * (wBot / 2 + 30 + 260 * u * (0.4 + h01(k, 9))), H * 0.86 - 20 - 70 * u * h01(k, 10), 26 + 30 * u, `rgba(240,220,190,${0.8 * (1 - u)})`); }
    }
    return { post: mergePost(hitShake(t, [land], 7, 0.35), punch(t, [land], 0.03)) };
  }

  // ------------------------------------------------------------------ 6-7 shipped in bulk

  shipped(c: C, g: C, t: number, s: Shot): Out {
    const hz = H * 0.36, bch = H * 0.5;
    isleBack(c, t, { time: 'sunset', horizon: hz, beach: bch, seed: 5 });
    smoke(c, t, () => [W * 0.84 + 0.03 * 380, hz + 40 - 0.34 * 380], { size: 12, wind: [60, -30] });
    steamship(c, W * 0.84, hz + 40, 380, t);
    isleProps(c, t, { time: 'sunset', beach: bch, seed: 5, canoes: false });
    islanders(c, t, [
      { x: W * 0.12, y: H * 0.66, h: 170, pose: 'stand', emote: '?', t0: this.w.shipped!.start },
      { x: W * 0.19, y: H * 0.67, h: 150, pose: 'hold', t0: 0 },
    ], '#1d1430', RIM);
    // his discs, identical, pasted onto the sand one per 1/32 note
    const per = (60 / 140) / 8, n = Math.floor((t - s.s0) / per) + 1, r = 50;
    for (let i = 0; i < Math.min(26, n); i++) {
      const row = Math.floor(i / 13), col = i % 13, x = W * 0.94 - col * 2.15 * r - row * r, y = H * 0.72 - r - row * 1.25 * r;
      const age = t - s.s0 - i * per;
      paste(c, this.disc, x, y - (age < 0.06 ? 30 * (1 - age / 0.06) : 0), r);
      if (age < 0.12) {
        g.strokeStyle = rgbaHex(HEX.cyan, 1 - age / 0.12); g.lineWidth = 4; g.setLineDash([10, 8]);
        g.strokeRect(x - r * 1.1, y - r * 1.1, 2.2 * r, 2.2 * r); g.setLineDash([]);
        puff(c, x, y + r, 30 * (1 - age / 0.12) + 6, `rgba(241,220,158,${0.8 * (1 - age / 0.12)})`);
      }
    }
    stampText(c, 'SHIPPED', W * 0.36, H * 0.17, 110, t, this.w.shipped!.start, { col: HEX.coral, rot: -0.12 });
    // Rai's cut-in: indignant
    cutIn(c, t, this.w.shipped!.start + 0.08, [[1260, 40], [1860, 62], [1832, 420], [1286, 396]], ['stripes', '#7a1430', '#a01c3c'], () => {
      focusLines(c, 1560, 250, 150, 'rgba(255,90,90,0.7)', t, { n: 70 });
      drawRai(c, 1560, 380, 112, { t, face: 'angry', arms: ['fist', 'fist'], marks: ['vein', 'steam'], markT0: this.w.shipped!.start + 0.1, shake: 0.8, glow: HEX.coral, glowStrength: 0.4 });
    });
    return {};
  }

  bulk(c: C, g: C, t: number, s: Shot): Out {
    const hz = H * 0.3, bch = H * 0.36;
    island(c, t, { time: 'sunset', horizon: hz, beach: bch, seed: 6, show: ['clouds'] });
    // rows of identical discs, in perspective, to the horizon: too even
    const z = lerp(1.25, 1, ease.outExpo(clamp(s.lt / 0.35)));
    c.save(); c.translate(W / 2, H * 0.6); c.scale(z, z); c.translate(-W / 2, -H * 0.6);
    for (let r = 0; r <= 9; r++) {
      const v = Math.pow(r / 9, 1.5), y = lerp(bch + 6, H * 0.93, v), k = lerp(0.12, 1, v), rad = 56 * k, sp = 150 * k;
      const n = Math.ceil(W / sp / 2) + 2;
      for (let i = -n; i <= n; i++) paste(c, this.disc, W / 2 + i * sp, y - rad, rad);
    }
    c.restore();
    g.strokeStyle = rgbaHex(HEX.cyan, 0.9); g.lineWidth = 4; g.setLineDash([14, 10]); g.lineDashOffset = -t * 120;
    g.strokeRect(60, bch - 20, W - 120, H * 0.62 - bch + 160); g.setLineDash([]);
    c.font = font(FAM.monoB(), 34); c.fillStyle = HEX.cyan; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    c.fillText('× 135', 76, bch + 20);
    slam(c, 'BULK', W * 0.36, H * 0.44, 320, t, Math.max(s.s0, this.w.bulk!.start), { col: HEX.yellow, shadow: HEX.ink, shadowOff: 0.06, rot: -0.05 });
    // chibi Rai, furious, stomping
    const stomp = s.s0 + 0.2, sinceS = t - stomp;
    const hop = sinceS < 0 ? 0.35 * Math.sin(clamp((t - s.s0) / 0.2) * Math.PI / 2) : 0;
    drawRai(c, W * 0.83, H * 0.64, 120, { t, sd: true, face: 'angry', arms: ['fist', 'fist'], marks: ['vein', 'steam'], markT0: s.s0 + 0.05, shake: 1, hop, squash: sinceS >= 0 && sinceS < 0.1 ? -0.4 : 0, glow: HEX.coral, glowStrength: 0.4 });
    if (sinceS >= 0) for (let k = 0; k < 6; k++) { const u = clamp(sinceS / 0.3), a = Math.PI + (k / 5) * Math.PI; puff(c, W * 0.83 + Math.cos(a) * (60 + 90 * u), H * 0.64 + 128 + Math.sin(a) * 18 * u, 20 + 14 * u, `rgba(241,220,158,${0.8 * (1 - u)})`); }
    poof(c, W * 0.83, H * 0.58, 190, t, s.s0);
    return { post: mergePost(hitShake(t, [stomp], 6, 0.3), punch(t, [s.s0], 0.03)) };
  }

  // ------------------------------------------------------------------ 8 thanks

  thanks(c: C, g: C, t: number, s: Shot): Out {
    const hz = H * 0.42, bch = H * 0.6;
    isleBack(c, t, { time: 'sunset', horizon: hz, beach: bch });
    smoke(c, t, () => [W * 0.86 + 0.03 * 420, hz + 34 - 0.34 * 420], { size: 13, wind: [60, -30] });
    steamship(c, W * 0.86, hz + 34, 420, t);
    isleProps(c, t, { time: 'sunset', beach: bch, canoes: false });
    // his discs dumped by the bank; an elder measures one with a stick
    for (let i = 0; i < 4; i++) paste(c, this.disc, W * (0.6 + 0.07 * i), H * 0.82 - 46, 46);
    c.strokeStyle = '#1d1430'; c.lineWidth = 6; c.beginPath(); c.moveTo(W * 0.535, H * 0.62); c.lineTo(W * 0.57, H * 0.83); c.stroke();
    const t0 = this.w.thanks!.start;
    islanders(c, t, [
      { x: W * 0.16, y: H * 0.8, h: 230, pose: 'wave', t0 },
      { x: W * 0.25, y: H * 0.81, h: 210, pose: 'stand', tilt: 0.45, t0 },
      { x: W * 0.33, y: H * 0.8, h: 160, pose: 'wave', t0 },
      { x: W * 0.52, y: H * 0.81, h: 220, pose: 'point', emote: '?', t0: t0 + 0.2 },
    ], '#1d1430', RIM);
    bubble(c, 'THANKS!', W * 0.24, H * 0.2, 86, W * 0.18, H * 0.53, t, t0);
    return {};
  }

  // ------------------------------------------------------------------ 9-11 the price

  /** In front of the bank: his five identical discs on the sand with their tags. */
  tagRow(c: C, t: number) {
    const hz = H * 0.3, bch = H * 0.42;
    island(c, t, { time: 'sunset', horizon: hz, beach: bch, seed: 7, show: ['clouds'] });
    stoneBank(c, W * 0.5, bch + 120, 1.9, 0.25, 7);
    const fr = this.w.fraction!.start, r = 104;
    for (let k = 0; k < 5; k++) {
      const x = W * (0.14 + 0.18 * k), y = H * 0.66;
      paste(c, this.disc, x, y, r);
      const tk = fr + 0.05 * k, drop = clamp((t - tk) / 0.18);
      const len = 24 + 60 * ease.outBack(drop), swing = 0.1 * Math.sin(t * 3 + k) + (drop > 0 && drop < 1 ? 0.3 * Math.sin(drop * 9) : 0);
      priceTag(c, x, y + r * 0.06, 136, '1', { len, rot: swing, strike: clamp((t - tk) / 0.1), stamp: '1/10', stampA: clamp((t - tk - 0.06) / 0.14) });
    }
  }

  priced(c: C, g: C, t: number, s: Shot): Out {
    this.tagRow(c, t);
    person(c, W * 0.05, H * 0.86, 250, 'point', { col: '#1d1430', t, rim: RIM });
    slam(c, 'PRICED', W * 0.5, H * 0.13, 160, t, s.s0, { col: HEX.bone, shadow: HEX.coral });
    return {};
  }

  fraction(c: C, g: C, t: number, s: Shot): Out {
    c.save();
    const z = 1.6 + 0.05 * s.lt;
    c.translate(W * 0.52, H * 0.6); c.rotate(-0.04); c.scale(z, z); c.translate(-W * 0.55, -H * 0.72);
    this.tagRow(c, t);
    c.restore();
    slam(c, 'A FRACTION', W * 0.6, H * 0.13, 140, t, this.w.fraction!.start, { col: HEX.coral, shadow: HEX.ink });
    cutIn(c, t, this.w.fraction!.start + 0.1, [[60, 230], [560, 200], [540, 600], [84, 624]], ['tone', '#ffe0a8', '#ffcf7a'], () => {
      drawRai(c, 310, 560, 112, { t, face: 'smug', arms: ['cross', 'cross'], marks: ['shine'], markT0: this.w.fraction!.start + 0.2, tilt: 0.06, glow: HEX.bone, glowStrength: 0.3 });
    });
    return { sung: HEX.coral, post: punch(t, [this.w.fraction!.start], 0.025) };
  }

  one(c: C, g: C, t: number, s: Shot): Out {
    const hz = H * 0.36, bch = H * 0.48;
    island(c, t, { time: 'sunset', horizon: hz, beach: bch, seed: 8, show: ['clouds'] });
    // the bank's platform, Rai standing among its stones, each a different size
    c.fillStyle = '#7c7a70'; c.beginPath(); c.roundRect(W * 0.04, H * 0.66, W * 0.56, 60, 10); c.fill();
    c.fillStyle = '#9a978a'; for (let i = 0; i < 16; i++) { c.beginPath(); c.ellipse(W * 0.06 + i * 66, H * 0.665, 30, 12, 0, 0, TAU); c.fill(); }
    discStone(c, W * 0.1, H * 0.66 - 110, 112, -0.06, 0.25);
    discStone(c, W * 0.5, H * 0.66 - 80, 82, 0.08, 0.25);
    discStone(c, W * 0.57, H * 0.66 - 50, 50, -0.1, 0.25);
    const R = 120, rx = W * 0.3, ry = H * 0.66 - 1.07 * R;
    drawRai(c, rx, ry, R, { t, face: 'smug', arms: ['hip', 'hip'], marks: ['shine'], markT0: s.s0 + 0.05, tilt: -0.05, glow: HEX.gold, glowStrength: 0.35, heart: 0.5, heartColor: HEX.gold });
    priceTag(c, rx + R * 0.62, ry - R * 0.5, 130, '1', { len: 26, rot: 0.06 * Math.sin(t * 2) - 0.1, col: '#ffe9a8', glow: HEX.gold });
    // his disc on the sand below, 1/10
    paste(c, this.disc, W * 0.78, H * 0.7, 84);
    priceTag(c, W * 0.78, H * 0.7 + 6, 120, '1', { len: 34, rot: 0.1 * Math.sin(t * 3), strike: 1, stamp: '1/10', stampA: 1 });
    c.font = font(FAM.monoB(), 28); c.fillStyle = HEX.bone; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillText('CARRIED 400 KM', rx, H * 0.24);
    c.fillText('SHIPPED IN BULK', W * 0.78, H * 0.52);
    slam(c, 'ONE', W * 0.3, H * 0.12, 180, t, this.w.one!.start, { col: HEX.gold, shadow: HEX.ink });
    return { sung: HEX.gold, post: punch(t, [this.w.one!.start], 0.025) };
  }

  // ------------------------------------------------------------------ 12-16 the voyage: value is the crossing

  valueSea(c: C, g: C, t: number, s: Shot): Out {
    const hz = H * 0.5;
    openSea(c, t, 'dawn', hz);
    cliffs(c, W * 0.2 - 40 * s.lt, hz, 1.25, 'dawn');
    // the morning star they steer by
    star4(g, W * 0.8, H * 0.2, 26 + 6 * Math.sin(t * 4), '#fff8e0');
    star4(c, W * 0.8, H * 0.2, 16, '#ffffff');
    // a frigate bird leading the way
    const bx = W * 0.7 + 60 * s.lt, by = H * 0.3 + 8 * Math.sin(t * 3), fl = Math.sin(t * 6) * 10;
    c.strokeStyle = '#2a2040'; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(bx - 44, by - fl); c.quadraticCurveTo(bx - 20, by - 18, bx, by); c.quadraticCurveTo(bx + 20, by - 18, bx + 44, by - fl); c.stroke();
    voyageCanoe(c, W * 0.5 + 70 * s.lt, hz + 170 + 6 * Math.sin(t * 2.2), 700, t * 1.4, { stoneR: 76, tilt: 0.02 * Math.sin(t * 1.7) });
    slam(c, 'VALUE’S', W * 0.5, H * 0.14, 170, t, Math.max(s.s0, this.w.value!.start), { col: HEX.gold, shadow: HEX.ink });
    return { sung: HEX.gold };
  }

  risk(c: C, g: C, t: number, s: Shot): Out {
    const hz = H * 0.42, rk = this.w.risk!.start, flash = t >= rk && t < rk + 0.05 ? 1 : 0;
    stormSky(c, t, hz, flash);
    if (t >= rk && t < rk + 0.22) lightning(g, W * 0.7, W * 0.62, hz + 40, 7, '#e8e8ff', 7);
    waves(c, t, hz + 40, 30, 120, 1.6, '#1b2a4a', 0.4, 1);
    // the canoe rides up a big wave, its sail torn
    const crest = waves(c, t, H * 0.72, 80, 260, 1.1, '#22355c', 0, 2);
    const cx = W * 0.42, cy = crest(cx), slope = (crest(cx + 20) - crest(cx - 20)) / 40;
    voyageCanoe(c, cx, cy + 8, 560, t * 2, { stoneR: 60, torn: 1, tilt: Math.atan(slope) * 0.9, lantern: 0.8 });
    // a shark fin circling in the near water
    const fx = W * (0.78 + 0.08 * Math.sin(t * 1.3)), fy = H * 0.86;
    c.fillStyle = '#5d6f99'; c.beginPath(); c.moveTo(fx - 40, fy); c.quadraticCurveTo(fx - 10, fy - 30, fx + 16, fy - 86); c.quadraticCurveTo(fx + 20, fy - 40, fx + 46, fy); c.closePath(); c.fill();
    waves(c, t, H * 0.86, 40, 180, 1.9, '#2a4170', 0.8, 3);
    rain(c, t, 0.5);
    slam(c, 'RISK', W * 0.66, H * 0.2, 230, t, rk, { col: HEX.coral, shadow: HEX.ink, rot: -0.05 });
    return { sung: HEX.coral, post: mergePost(hitShake(t, [rk], 6, 0.35), caKick(t, [rk]), flash ? { flash: 0.5 } : {}) };
  }

  reefHands(c: C, g: C, t: number, s: Shot): Out {
    const wl = H * 0.42, hs = this.w.hands!.start;
    const surf = reefSplit(c, t, wl, 140 * s.lt);
    voyageCanoe(c, W * 0.46, surf(W * 0.46) + 6, 520, t * 1.6, { stoneR: 56, tilt: 0.02 * Math.sin(t * 3) });
    slam(c, 'REEF', W * 0.24, H * 0.14, 170, t, Math.max(s.s0, this.w.reef!.start), { col: HEX.coral, shadow: HEX.ink, rot: 0.04 });
    // on "hands": a panel slides in, close on the paddlers' hands on the paddle, the blade biting the water
    cutIn(c, t, hs - 0.02, [[1040, 330], [1880, 300], [1860, 760], [1010, 790]], ['flat', '#1f8fc9', '#1f8fc9'], () => {
      const wy = 560 + 6 * Math.sin(t * 3);
      gradientV(c, '#ffb38a', '#7fc8e8', 1000, 280, 900, wy - 280);
      const ph = Math.sin((t - hs) * 6), bx = 1450 + 60 * ph;
      c.strokeStyle = '#6a4428'; c.lineWidth = 22; c.lineCap = 'round';
      c.beginPath(); c.moveTo(bx - 120, 330); c.lineTo(bx + 60, 700); c.stroke();
      c.fillStyle = '#6a4428'; c.beginPath(); c.ellipse(bx + 70, 720, 36, 70, -0.45, 0, TAU); c.fill();
      // two hands gripping the shaft (silhouette arms in from the top)
      c.strokeStyle = '#24150c'; c.lineWidth = 46;
      c.beginPath(); c.moveTo(1150, 280); c.quadraticCurveTo(1250, 380, bx - 80, 420); c.stroke();
      c.beginPath(); c.moveTo(1800, 280); c.quadraticCurveTo(1700, 460, bx + 10, 530); c.stroke();
      c.fillStyle = '#24150c'; for (const [hx, hy] of [[bx - 80, 420], [bx + 10, 530]] as const) { c.beginPath(); c.ellipse(hx, hy, 40, 34, 0.5, 0, TAU); c.fill(); }
      // the water line and bubbles round the blade
      c.fillStyle = 'rgba(31,143,201,0.75)'; c.fillRect(1000, wy, 900, 300);
      c.strokeStyle = 'rgba(235,255,255,0.9)'; c.lineWidth = 4; c.beginPath(); c.moveTo(1000, wy); c.lineTo(1900, wy); c.stroke();
      for (let i = 0; i < 10; i++) { const u = ((t * 1.4 + h01(i, 3)) % 1); c.strokeStyle = `rgba(230,250,255,${1 - u})`; c.lineWidth = 2; c.beginPath(); c.arc(bx + 70 + (h01(i, 4) - 0.5) * 120, 760 - u * 180, 4 + 6 * h01(i, 5), 0, TAU); c.stroke(); }
      slam(c, 'HANDS', 1300, 380, 104, t, hs, { col: HEX.bone, shadow: HEX.ink, rot: -0.04, maxW: 520 });
    });
    return { post: punch(t, [hs], 0.02) };
  }

  hours(c: C, g: C, t: number, s: Shot): Out {
    const hz = H * 0.5, ph = (t - s.s0) * 2.4; // day and night wheeling over
    const night = 0.5 - 0.5 * Math.cos(ph * TAU);
    openSea(c, t, night > 0.5 ? 'night' : 'day', hz);
    c.fillStyle = `rgba(10,14,46,${0.75 * Math.min(1, night * 1.4)})`; c.fillRect(0, 0, W, hz);
    for (let i = 0; i < 90 * night; i++) { c.fillStyle = `rgba(255,255,255,${night})`; c.beginPath(); c.arc(h01(i, 41) * W, h01(i, 42) * hz * 0.9, 1 + 1.5 * h01(i, 43), 0, TAU); c.fill(); }
    const a = Math.PI + ph * TAU;
    for (const [k, col] of [[0, '#fff2b0'], [1, '#e8eeff']] as const) {
      const aa = a + k * Math.PI, x = W * 0.5 + Math.cos(aa) * W * 0.42, y = hz + Math.sin(aa) * hz * 0.85;
      if (y > hz) continue;
      g.fillStyle = rgbaHex(col, 0.9); g.beginPath(); g.arc(x, y, k ? 34 : 50, 0, TAU); g.fill();
    }
    voyageCanoe(c, W * 0.5, hz + 160 + 5 * Math.sin(t * 2), 640, t * 1.6, { stoneR: 70, tally: Math.floor((t - s.s0) * 40), lantern: night });
    slam(c, 'HOURS', W * 0.5, H * 0.14, 200, t, Math.max(s.s0, this.w.hours!.start), { col: HEX.yellow, shadow: HEX.ink });
    return {};
  }

  cost(c: C, g: C, t: number, s: Shot): Out {
    const hz = H * 0.42, bch = H * 0.58;
    island(c, t, { time: 'dawn', horizon: hz, beach: bch, seed: 9, show: ['clouds', 'palms', 'huts'] });
    voyageCanoe(c, W * 0.18, bch + 40, 500, t, { stone: false, paddlers: 0, sail: 0.6 });
    // the stone carried up the beach on its pole, many shoulders under it
    const sx = W * 0.56 + 40 * s.lt, sy = H * 0.66;
    c.strokeStyle = '#3e2614'; c.lineWidth = 16; c.lineCap = 'round';
    c.beginPath(); c.moveTo(sx - 300, sy + 10); c.lineTo(sx + 300, sy + 10); c.stroke();
    stone(c, sx, sy + 4, 110, { seed: 21 });
    for (let i = 0; i < 4; i++) { const px = sx + (i < 2 ? -250 + i * 80 : 170 + (i - 2) * 80); person(c, px, H * 0.83, 230, 'carry', { col: '#2a1a30', t: t + i, seed: i, rim: 'rgba(255,190,150,0.8)' }); }
    islanders(c, t, [
      { x: W * 0.32, y: H * 0.84, h: 200, pose: 'slump', emote: 'sweat', t0: s.s0 },
      { x: W * 0.86, y: H * 0.84, h: 210, pose: 'slump', emote: 'sigh', t0: s.s0 },
    ], '#2a1a30', 'rgba(255,190,150,0.8)');
    slam(c, 'IT COST', W * 0.5, H * 0.13, 170, t, Math.max(s.s0, this.w.cost!.start), { col: HEX.gold, shadow: HEX.ink });
    return { sung: HEX.gold, post: punch(t, [this.w.cost!.start], 0.02) };
  }

  // ------------------------------------------------------------------ 17-18 not how heavy, not how you shine

  heavy(c: C, g: C, t: number, s: Shot): Out {
    const { fy } = tradingPost(c, t);
    // his counter with the open ledger book
    c.fillStyle = '#4a2e18'; c.fillRect(W * 0.58, H * 0.66, W * 0.42, fy - H * 0.66 + 4);
    c.fillStyle = '#7a4e2c'; c.fillRect(W * 0.57, H * 0.645, W * 0.43, 22);
    ledgerBook(c, W * 0.84, H * 0.61, 200, -0.03);
    const k = 1.05, sx = W * 0.3;
    const n1 = this.w.not1!.start, hv = this.w.heavy!.start;
    // she hops onto the platform on "not"; on "heavy" the needle slams into the red
    const hopU = clamp((t - (n1 - 0.12)) / 0.3), onX = lerp(sx - 330, sx, ease.outCubic(hopU)), hop = Math.sin(hopU * Math.PI) * 0.8;
    const sw = clamp((t - hv) / 0.5), needle = t < n1 ? 0.02 : 0.02 + 0.98 * ease.outElastic(sw);
    const sc = platformScale(c, sx, fy, k, needle);
    const R = 112, ry = fy - 40 * k - 1.07 * R;
    const landed = hopU >= 1, shrug = t >= hv + 0.15;
    drawRai(c, onX, ry, R, { t, face: shrug ? 'cheeky' : landed ? 'smile' : 'joy', arms: shrug ? ['shrug', 'shrug'] : ['up', 'up'], armsFrom: shrug ? ['up', 'up'] : undefined, armsU: clamp((t - hv - 0.15) / 0.15), hop, squash: landed && t - n1 < 0.3 ? -0.25 : 0, marks: shrug ? ['sweat'] : [], markT0: hv + 0.2, glow: '#ffcf6b', glowStrength: 0.4 });
    if (sw > 0.25) { g.fillStyle = rgbaHex(HEX.coral, 0.45); g.beginPath(); g.arc(sc.dial[0], sc.dial[1], sc.R * 1.15, 0, TAU); g.fill(); }
    slam2(slam, c, 'NOT HOW', 'HEAVY', W * 0.73, H * 0.38, 180, t, n1, { colA: HEX.pink, colB: HEX.bone, shadow: HEX.ink });
    return { sung: HEX.pink, post: mergePost(hitShake(t, [hv], 4, 0.25), punch(t, [hv], 0.025)) };
  }

  shine(c: C, g: C, t: number, s: Shot): Out {
    c.save(); c.translate(W / 2, H / 2); c.scale(1.35, 1.35); c.translate(-W * 0.55, -H * 0.45);
    tradingPost(c, t);
    c.restore();
    // Rai behind the counter, sassy, a twinkle at her cheek
    drawRai(c, W * 0.74, H * 0.62, 150, { t, face: 'sassy', arms: ['hip', 'cheek'], marks: ['shine'], markT0: s.s0, tilt: 0.12, glow: '#ffcf6b', glowStrength: 0.35 });
    // the counter in front, his coins and the open ledger on it
    c.fillStyle = '#7a4e2c'; c.fillRect(0, H * 0.7, W, 28);
    gradientV(c, '#5a3a20', '#2a180c', 0, H * 0.7 + 28, W, H * 0.3);
    const gl = clamp(1 - Math.abs(t - this.w.shine!.start - 0.05) / 0.22);
    coinStack(c, W * 0.12, H * 0.7, 54, 7, 0);
    coinStack(c, W * 0.22, H * 0.7, 54, 10, gl);
    coinStack(c, W * 0.31, H * 0.7, 54, 5, 0);
    ledgerBook(c, W * 0.5, H * 0.68, 260, 0.03);
    if (gl > 0) star4(g, W * 0.22 + 22, H * 0.7 - 9 * 54 * 0.22, 40 + 110 * gl, '#fff6d0');
    slam2(slam, c, 'NOT HOW', 'YOU SHINE', W * 0.32, H * 0.3, 128, t, this.w.not2!.start, { colA: HEX.pink, colB: HEX.gold, shadow: HEX.ink });
    return { sung: HEX.pink };
  }

  // ------------------------------------------------------------------ 19-20 but the voyage, and what could be lost

  voyage(c: C, g: C, t: number, s: Shot): Out {
    const hz = H * 0.44, bch = H * 0.6;
    island(c, t, { time: 'sunset', horizon: hz, beach: bch, seed: 11, show: ['clouds'] });
    voyageCanoe(c, W * 0.8, bch + 60, 520, t, { stone: false, paddlers: 0, sail: 0.35 });
    // the voyage's golden wake, from the horizon to her heart, closing round it
    const R = 125, rx = W * 0.17, ry = H * 0.62;
    const hx = rx, hy = ry + 0.12 * R, u = ease.inOutCubic(clamp((t - this.w.but!.start) / 0.55));
    const pts: [number, number][] = [];
    for (let i = 0; i <= 60; i++) { const v = i / 60; pts.push([lerp(W * 0.9, hx + 60, v) + 120 * Math.sin(v * Math.PI), lerp(hz + 6, hy, v * v)]); }
    for (let i = 0; i <= 40; i++) { const a = -0.3 + (i / 40) * TAU; pts.push([hx + Math.cos(a) * R * 0.5, hy + Math.sin(a) * R * 0.5]); }
    const n = Math.floor(u * (pts.length - 1));
    const path = (cc: C) => { cc.beginPath(); pts.slice(0, n + 1).forEach(([x, y], i) => (i ? cc.lineTo(x, y) : cc.moveTo(x, y))); };
    c.setLineDash([18, 12]); c.strokeStyle = HEX.gold; c.lineWidth = 6; path(c); c.stroke(); c.setLineDash([]);
    g.strokeStyle = rgbaHex(HEX.gold, 0.4); g.lineWidth = 14; path(g); g.stroke();
    drawRai(c, rx, ry, R, { t, face: t >= this.w.voyage!.start ? 'determined' : 'soft', arms: ['down', 'hold'], armsFrom: ['down', 'down'], armsU: clamp((t - s.s0) / 0.25), heart: 0.4 + 0.6 * u, heartColor: HEX.gold, glow: HEX.gold, glowStrength: 0.6 + u * 0.4 });
    slam2(slam, c, 'BUT THE', 'VOYAGE', W * 0.68, H * 0.17, 150, t, this.w.but!.start, { colA: HEX.bone, colB: HEX.gold, shadow: HEX.ink });
    return { sung: HEX.gold };
  }

  lost(c: C, g: C, t: number, s: Shot): Out {
    const hz = H * 0.48, lt0 = this.w.lost!.start, flash = t >= lt0 && t < lt0 + 0.05 ? 1 : 0;
    stormSky(c, t, hz, flash);
    // a moonlit rift in the clouds behind the canoe, so its silhouette reads
    const rg = c.createRadialGradient(W * 0.44, hz - 40, 0, W * 0.44, hz - 40, 560);
    rg.addColorStop(0, 'rgba(170,180,230,0.75)'); rg.addColorStop(0.5, 'rgba(110,120,190,0.35)'); rg.addColorStop(1, 'rgba(110,120,190,0)');
    c.fillStyle = rg; c.fillRect(0, 0, W, hz + 4);
    gradientV(c, '#1a2550', '#03060f', 0, hz, W, H - hz);
    waves(c, t, hz + 30, 24, 110, 1.4, '#111c3a', 0.3, 4);
    const crest = waves(c, t, H * 0.66, 50, 220, 1.2, '#16244a', 0, 5);
    const cx = W * 0.42, cy = crest(cx), tilt = 0.12 + 0.32 * ease.inOutCubic(clamp(s.lt / 0.4));
    const sl = clamp((s.lt - 0.15) / 0.55);
    voyageCanoe(c, cx, cy + 6, 560, t * 2, { silhouette: '#0a0d1e', tilt, torn: 1, lantern: t < lt0 ? 0.8 : 0, stoneDX: lerp(0, 330, ease.inQuad(sl)), stoneDY: lerp(0, 260, ease.inQuad(sl)), stoneTilt: sl * 2.2 });
    waves(c, t, H * 0.8, 30, 160, 1.7, '#1b2a55', 0.6, 6);
    if (t >= lt0 && t < lt0 + 0.25) lightning(g, W * 0.78, W * 0.7, hz, 11, '#f0f0ff', 7);
    rain(c, t, 0.45);
    // LOST slams, then sinks under the water
    if (t >= lt0 - 0.02) {
      const sink = clamp((t - lt0 - 0.25) / 0.55);
      c.save();
      c.beginPath(); c.rect(0, 0, W, H * 0.6 + 220 * sink); c.clip();
      slam(c, 'LOST', W * 0.5, H * 0.24 + 280 * ease.inQuad(sink), 250, t, lt0, { col: HEX.coral, shadow: HEX.ink });
      c.restore();
    }
    return { sung: HEX.coral, post: mergePost(caKick(t, [lt0]), hitShake(t, [lt0], 5, 0.3), flash ? { flash: 0.55 } : {}) };
  }
}
