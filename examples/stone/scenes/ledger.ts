// LEDGER (verse 2, lines 24-25): "but up the road there's a woman awake at four with a fever, a lunchbox, a bill, /
// and your ledger looks right at her, blinks, and writes zero. Not minus. Just nothing. Still."
// The verse turns tender: warm lamp light at 4 am, then the Ledger's cold office across the road, then Rai at the
// bottom of the sea; the sung word in pink. Every shot somewhere (his direction, 2026-10-02), a clue in each.
//   1 ROAD    "but up the road there's a": a terraced street at night in light rain, one kitchen window lit; we drift
//             in. UP THE ROAD. Clue: the child seat on the bicycle by the door (a small child lives here).
//   2 KITCHEN "woman awake at four with a": the kitchen at 4 am: she rocks her feverish child by the rainy window,
//             sighs, and a tear runs; the oven clock flips 03:59 to 04:00 on "four". Clues: the bill already pinned
//             to the fridge, the lunchbox open on the counter, the thermometer by the kettle, the calendar of shifts
//             circled (she works in three hours), the child's drawing of a round grey stone with a heart.
//   3 ITEMS   "fever, a lunchbox, a bill, and your ledger": three panels land on their words: the thermometer at the
//             child's brow (39.4), the lunchbox being packed (a note with a heart), the bill on the fridge (DUE £86.40).
//   4 LOOKS   "looks right at her,": the national accounts office across the road at 4 am: the Ledger board on the
//             wall, its two lights turn to the window and a scan line finds her lit kitchen. Clue: the cleaner's mop
//             and WET FLOOR sign (cleaning in here is paid, and counted).
//   5 BLINKS  "blinks, and": close on the two lights; they blink; her window glows in the board's glass.
//   6 ZERO    "writes zero.": the cursor writes 0 in pink into each care row, the bill's £ stays lime; caKick.
//   7 MINUS   "Not minus. Just": at the bottom of the sea Rai looks up in shock as a pink 0 sinks towards her; a minus
//             is offered and struck out. NOT MINUS.
//   8 STILL   "nothing. Still.": the 0 settles in the sand beside her on "Still"; she is sad, a tear, gloom. JUST
//             NOTHING. STILL. Clue: the half-buried stones around her (others waiting; chorus 2 will light the 0).
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { HEX } from '../engine/palette';
import { font } from '../engine/type';
import type { Line, Word } from '../engine/lyrics';
import { clamp, ease, frameIdx, lerp } from '../engine/util';
import { drawRai, h01 } from './_rai';
import { FAM, TAU, gradientV, halftone, ledger, person, rgbaHex, slam, stars, type LedgerRow } from './_motifs';
import { seabed, seabedFront } from './_world';
import { puff } from './_manga';
import { caKick, mergePost, punch } from './_post';
import { band, beatCut, cutIn, plateLines, shotAt, wordOf } from './trader-kit';
import { WARM_A, WARM_B, billPaper, boardLights, drawings, kitchen, lunchbox, office } from './ledger-rooms';

type Shot = ReturnType<typeof shotAt>;
type C = CanvasRenderingContext2D;
type Out = { sung?: string; post?: PostOverrides };

export default class Ledger extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  own: Line[] = [];
  bandLines: Line[] = [];
  cuts: number[] = [];
  w: Record<string, Word> = {};

  override init() {
    const { lyrics, audio: au, start, end } = this.ctx;
    const { own, band: bl } = plateLines(lyrics.lines, start, end);
    this.own = own; this.bandLines = bl;
    const q = (re: RegExp, n = 0) => wordOf(own, re, n);
    this.w = {
      road: q(/^road/), woman: q(/^woman/), awake: q(/^awake/), four: q(/^four/), fever: q(/^fever/), lunchbox: q(/^lunchbox/),
      bill: q(/^bill/), ledger: q(/^ledger/), looks: q(/^looks/), right: q(/^right/), her: q(/^her/), blinks: q(/^blinks/),
      writes: q(/^writes/), zero: q(/^zero/), not: q(/^not$/), minus: q(/^minus/), just: q(/^just/), nothing: q(/^nothing/), still: q(/^still/),
    };
    const w = this.w;
    this.cuts = [start, beatCut(au, w.woman!.start), beatCut(au, w.fever!.start, 2), beatCut(au, w.looks!.start), beatCut(au, w.blinks!.start),
      beatCut(au, w.writes!.start), beatCut(au, w.not!.start), beatCut(au, w.nothing!.start)];
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, end } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t;
    this.L.clear(HEX.ink); this.G.clear();
    const s = shotAt(this.cuts, t, end);
    const shots = [this.road, this.kitchen, this.items, this.looks, this.blinks, this.zero, this.minus, this.still];
    const fn = (shots[s.i] ?? this.road) as (...a: unknown[]) => Out | undefined;
    const r = fn.call(this, c, g, t, s, f) ?? {};
    band(c, this.bandLines, t, { sung: r.sung ?? HEX.pink, dark: 0.8 });
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    return mergePost({ bloom: 0.65 }, r.post, { zoom: 1 + (s.i < 3 ? 0.008 : 0.004) * f.a.kick });
  }

  // ------------------------------------------------------------------ 1 up the road

  road(c: C, g: C, t: number, s: Shot): Out {
    gradientV(c, '#1d1240', '#0d0820', 0, 0, W, H);
    stars(c, t, 120, H * 0.4, 23);
    c.fillStyle = '#fff4d6'; c.beginPath(); c.arc(W * 0.84, H * 0.14, 44, 0, TAU); c.fill();
    c.fillStyle = '#1d1240'; c.beginPath(); c.arc(W * 0.84 + 18, H * 0.14 - 10, 40, 0, TAU); c.fill();
    const z = 1 + 0.4 * ease.inOutCubic(s.u), fx = 1450, fy = H * 0.46;
    const tr = (cc: C) => { cc.translate(fx, fy); cc.scale(z, z); cc.translate(-fx - 30 * s.lt, -fy); };
    c.save(); tr(c); g.save(); tr(g);
    const base = H * 0.76;
    // the terrace: houses with chimneys, front doors, one kitchen window lit
    for (let k = 0; k < 8; k++) {
      const x = -60 + k * 270, hh = 330, roofY = base - hh;
      c.fillStyle = k % 2 ? '#2a2046' : '#30254e'; c.fillRect(x, roofY, 270, hh);
      c.fillStyle = '#1c1434'; c.beginPath(); c.moveTo(x - 6, roofY); c.lineTo(x + 135, roofY - 90); c.lineTo(x + 276, roofY); c.closePath(); c.fill();
      c.fillRect(x + 180, roofY - 110, 34, 70);
      c.strokeStyle = 'rgba(200,210,255,0.45)'; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 6, roofY); c.lineTo(x + 135, roofY - 90); c.lineTo(x + 276, roofY); c.stroke();
      c.strokeStyle = 'rgba(200,210,255,0.15)'; c.lineWidth = 2; for (let yy = roofY + 30; yy < base; yy += 36) { c.beginPath(); c.moveTo(x, yy); c.lineTo(x + 270, yy); c.stroke(); }
      c.fillStyle = '#140e26'; c.fillRect(x + 30, base - 150, 70, 150); c.fillStyle = '#c9a44a'; c.beginPath(); c.arc(x + 88, base - 76, 4, 0, TAU); c.fill();
      for (const [wx, wy] of [[x + 140, base - 260], [x + 140, base - 140], [x + 30, base - 270]] as const) {
        const lit = k === 5 && wx === x + 140 && wy === base - 140;
        if (lit) {
          c.fillStyle = WARM_A; c.fillRect(wx, wy, 90, 80);
          g.fillStyle = rgbaHex(WARM_B, 0.7); g.fillRect(wx - 12, wy - 12, 114, 104);
          c.save(); c.beginPath(); c.rect(wx, wy, 90, 80); c.clip(); c.translate(wx + 40, wy + 100); c.rotate(Math.sin(t * 2.2) * 0.04); person(c, 0, 0, 90, 'hold', { col: '#24101c', t, headTilt: 0.2 }); c.restore();
          c.strokeStyle = '#0a0614'; c.lineWidth = 5; c.beginPath(); c.moveTo(wx + 45, wy); c.lineTo(wx + 45, wy + 80); c.stroke();
          // the bicycle by her door, a child seat on the back
          const bx = x + 200, by = base - 4;
          c.strokeStyle = '#8a80b0'; c.lineWidth = 5;
          for (const dx of [-40, 40]) { c.beginPath(); c.arc(bx + dx, by - 28, 26, 0, TAU); c.stroke(); }
          c.beginPath(); c.moveTo(bx - 40, by - 28); c.lineTo(bx - 6, by - 60); c.lineTo(bx + 30, by - 60); c.lineTo(bx + 40, by - 28); c.moveTo(bx - 6, by - 60); c.lineTo(bx, by - 28); c.stroke();
          c.fillStyle = HEX.coral; c.beginPath(); c.roundRect(bx - 66, by - 92, 36, 34, 8); c.fill();
        } else { c.fillStyle = '#141030'; c.fillRect(wx, wy, 90, 80); c.strokeStyle = 'rgba(200,210,255,0.25)'; c.lineWidth = 3; c.strokeRect(wx, wy, 90, 80); }
      }
      // wheelie bins
      if (k % 3 === 1) { c.fillStyle = '#1e3a2a'; c.fillRect(x + 220, base - 64, 40, 64); }
    }
    // a cat on the garden wall
    c.fillStyle = '#05030b'; c.fillRect(-200, base - 40, W + 600, 40);
    const cx = 900, cy = base - 40;
    c.beginPath(); c.ellipse(cx, cy - 16, 26, 16, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(cx + 24, cy - 32, 11, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(cx + 16, cy - 40); c.lineTo(cx + 18, cy - 52); c.lineTo(cx + 24, cy - 42); c.moveTo(cx + 26, cy - 42); c.lineTo(cx + 32, cy - 52); c.lineTo(cx + 34, cy - 40); c.fill();
    c.strokeStyle = '#05030b'; c.lineWidth = 5; c.beginPath(); c.moveTo(cx - 24, cy - 12); c.quadraticCurveTo(cx - 50, cy + 20 * Math.sin(t * 2), cx - 40, cy + 30); c.stroke();
    // the road, wet, reflecting the lamps
    gradientV(c, '#0e0a1c', '#05030b', -200, base, W + 600, H - base + 100);
    for (const lx of [350, 1250, 2150]) {
      c.fillStyle = '#2a2440'; c.fillRect(lx - 6, base - 300, 12, 300); c.fillRect(lx - 6, base - 300, 50, 10);
      g.fillStyle = 'rgba(255,214,140,0.55)'; g.beginPath(); g.arc(lx + 44, base - 286, 30, 0, TAU); g.fill();
      c.fillStyle = 'rgba(255,214,140,0.18)'; c.fillRect(lx + 30, base + 20, 28, 160);
    }
    c.strokeStyle = rgbaHex(HEX.bone, 0.2); c.setLineDash([60, 50]); c.lineWidth = 6;
    c.beginPath(); c.moveTo(-200, base + 120); c.lineTo(W + 600, base + 120); c.stroke(); c.setLineDash([]);
    g.restore(); c.restore();
    // light rain
    c.strokeStyle = 'rgba(200,210,255,0.25)'; c.lineWidth = 2;
    const k2 = frameIdx(t) >> 1;
    for (let i = 0; i < 90; i++) { const x = h01(i, k2, 5) * W, y = h01(i, k2, 6) * H; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 4, y + 20); c.stroke(); }
    slam(c, 'UP THE ROAD', W * 0.36, H * 0.14, 120, t, s.s0 + 0.1, { fam: FAM.cond(), col: HEX.bone, shadow: HEX.violet });
    return {};
  }

  // ------------------------------------------------------------------ 2 the kitchen at 4 am

  kitchen(c: C, g: C, t: number, s: Shot): Out {
    const four = this.w.four!.start, lit = clamp((t - four) / 0.08);
    const z = 1 + 0.05 * s.lt;
    const tr = (cc: C) => { cc.translate(W * 0.47, H * 0.45); cc.scale(z, z); cc.translate(-W * 0.47, -H * 0.45); };
    c.save(); tr(c); g.save(); tr(g);
    kitchen(c, g, t, { clock: t < four ? '03:59' : '04:00', clockLit: lit, emote: 'sigh', emoteT0: this.w.awake!.start, tear: t >= four ? 1 : 0, packing: 0.5 });
    g.restore(); c.restore();
    return { post: punch(t, [four], 0.015) };
  }

  // ------------------------------------------------------------------ 3 a fever, a lunchbox, a bill

  items(c: C, g: C, t: number, s: Shot): Out {
    kitchen(c, g, t, { clock: '04:00', clockLit: 0.6, packing: 0.5, tear: 1 });
    c.fillStyle = 'rgba(14,8,20,0.55)'; c.fillRect(0, 0, W, H);
    const lab = (txt: string, x: number, y: number) => { c.font = font(FAM.monoB(), 34); c.fillStyle = HEX.bone; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText(txt, x, y); };
    // the fever: the child's head on her shoulder, the thermometer at its brow
    cutIn(c, t, this.w.fever!.start - 0.02, [[70, 70], [630, 52], [604, 700], [92, 716]], ['flat', '#3a2030', '#3a2030'], () => {
      const lg = c.createRadialGradient(330, 200, 0, 330, 300, 520); lg.addColorStop(0, '#ffcf7a'); lg.addColorStop(1, '#7a2e2a');
      c.fillStyle = lg; c.fillRect(60, 40, 600, 700);
      c.fillStyle = '#1c0f1c'; c.beginPath(); c.ellipse(260, 720, 300, 200, -0.2, 0, TAU); c.fill();
      c.beginPath(); c.arc(330, 420, 120, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,207,122,0.8)'; c.lineWidth = 6; c.beginPath(); c.arc(330, 420, 120, -2.2, -0.6); c.stroke();
      // the fever: heat rising from the child's brow
      c.strokeStyle = rgbaHex(HEX.coral, 0.9); c.lineWidth = 6; c.lineCap = 'round';
      for (let i = 0; i < 4; i++) { const u = (t * 0.9 + i / 4) % 1; c.globalAlpha = 1 - u; c.beginPath(); for (let j = 0; j <= 10; j++) { const yy = 290 - u * 120 - j * 9, xx = 270 + i * 40 + 10 * Math.sin(j * 1.3 + t * 7); j ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); }
      c.globalAlpha = 1;
      c.save(); c.translate(470, 330); c.rotate(0.5);
      c.fillStyle = '#f4f1ea'; c.beginPath(); c.roundRect(-140, -26, 280, 52, 26); c.fill();
      c.fillStyle = '#2a2a3a'; c.fillRect(-90, -17, 110, 34);
      c.font = font(FAM.monoB(), 28); c.fillStyle = HEX.pink; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('39.4°', -35, 1);
      c.restore();
      c.fillStyle = '#1c0f1c'; c.beginPath(); c.ellipse(590, 300, 60, 44, 0.5, 0, TAU); c.fill();
      lab('FEVER', 110, 120);
    });
    // the lunchbox, being packed
    cutIn(c, t, this.w.lunchbox!.start - 0.02, [[660, 56], [1250, 70], [1226, 704], [636, 698]], ['flat', '#3a2a40', '#3a2a40'], () => {
      gradientV(c, '#5a4250', '#2a1d30', 620, 40, 660, 680);
      c.fillStyle = '#7a5e6a'; c.fillRect(620, 560, 660, 160);
      const packed = 0.5 + 0.5 * clamp((t - this.w.lunchbox!.start) / 0.35);
      lunchbox(c, 940, 580, 2.0, packed);
      c.fillStyle = '#1c0f1c'; c.beginPath(); c.ellipse(1180, 300 + 40 * Math.sin(t * 3), 70, 50, -0.6, 0, TAU); c.fill();
      c.lineWidth = 60; c.strokeStyle = '#1c0f1c'; c.lineCap = 'round'; c.beginPath(); c.moveTo(1300, 120); c.lineTo(1180, 300 + 40 * Math.sin(t * 3)); c.stroke();
      lab('LUNCHBOX', 690, 120);
    });
    // the bill on the fridge
    cutIn(c, t, this.w.bill!.start - 0.02, [[1276, 70], [1856, 52], [1846, 712], [1252, 704]], ['flat', '#d8d2cc', '#d8d2cc'], () => {
      gradientV(c, '#e2dcd6', '#b8b2ac', 1240, 40, 640, 700);
      drawings(c, 1300, 420, 1.3);
      billPaper(c, 1610, 150, 2.3, -0.05);
      lab('BILL', 1310, 120);
    });
    return {};
  }

  // ------------------------------------------------------------------ 4-6 the ledger looks, blinks, writes zero

  rows(t: number): LedgerRow[] {
    const z = this.w.zero!.start;
    const care = (label: string, k: number): LedgerRow => ({ label, value: t >= z + 0.06 * k ? '0' : ' ', care: true });
    return [care('FEVER WATCHED, 01:00–05:00', 0), care('LUNCHBOX PACKED', 1), { label: 'ELECTRICITY BILL PAID', value: '£86.40', care: false }, care('CHILD HELD, ROCKED, SUNG TO', 2)];
  }

  looks(c: C, g: C, t: number, s: Shot): Out {
    const look = -ease.inOutCubic(clamp((t - this.w.looks!.start) / 0.25));
    const o = office(c, g, t, this.rows(t), { look });
    const sc = clamp((t - this.w.right!.start) / 0.3);
    if (sc > 0) {
      const x0 = 110 + 860 - 140 + 31, y0 = 120 + 44, [x1, y1] = o.her;
      g.strokeStyle = rgbaHex(HEX.lime, 0.65); g.lineWidth = 3; g.setLineDash([12, 10]);
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(lerp(x0, x1, sc), lerp(y0, y1, sc)); g.stroke(); g.setLineDash([]);
      if (sc >= 1) { g.strokeStyle = rgbaHex(HEX.lime, 0.8); g.lineWidth = 4; g.strokeRect(x1 - 56, y1 - 48, 112, 96); }
    }
    slam(c, 'LOOKS', W * 0.3, H * 0.66, 110, t, this.w.looks!.start, { fam: FAM.monoB(), col: HEX.lime, shadow: HEX.ink });
    return {};
  }

  blinks(c: C, g: C, t: number, s: Shot): Out {
    const bt = this.w.blinks!.start, lid = clamp(1 - Math.abs(t - bt - 0.1) / 0.1);
    const z = 4, lx = 110 + 860 - 140 + 31, ly = 120 + 44;
    const tr = (cc: C) => { cc.translate(W / 2, H * 0.42); cc.scale(z, z); cc.translate(-lx, -ly); };
    c.save(); tr(c); g.save(); tr(g);
    office(c, g, t, this.rows(t), { look: -1, lid });
    // her window, reflected faintly in the board's glass
    c.fillStyle = rgbaHex(WARM_A, 0.16); c.fillRect(lx - 120, ly + 30, 34, 30);
    g.restore(); c.restore();
    slam(c, 'BLINK.', W * 0.5, H * 0.74, 110, t, bt, { fam: FAM.monoB(), col: HEX.bone, shadow: HEX.ink });
    return {};
  }

  zero(c: C, g: C, t: number, s: Shot): Out {
    gradientV(c, '#141a30', HEX.ink);
    halftone(c, rgbaHex(HEX.pink, 0.05), 22, 'down');
    const bx = 170, by = H * 0.08, bw = W - 340, rh = 100, zt = this.w.zero!.start;
    ledger(c, t, bx, by, bw, this.rows(t), { title: 'NATIONAL ACCOUNTS  ·  HOUSEHOLD 4471', blink: 0, rowH: rh, size: 46 });
    boardLights(c, g, bx + bw - 150, by + 44, 22, -0.5, 0);
    if (t < zt && frameIdx(t) % 20 < 10) { c.fillStyle = HEX.pink; c.fillRect(bx + bw - 64, by + 70 + rh * 0.75 - 38, 24, 46); }
    [0, 1, 3].forEach((row, k) => {
      const a = clamp(1 - (t - zt - 0.06 * k) / 0.35);
      if (t < zt + 0.06 * k || a <= 0) return;
      const cy = by + 70 + rh * (row + 0.75) - 16;
      g.strokeStyle = rgbaHex(HEX.pink, a); g.lineWidth = 5; g.beginPath(); g.arc(bx + bw - 50, cy, 30 + 50 * (1 - a), 0, TAU); g.stroke();
    });
    slam(c, 'ZERO', W * 0.5, H * 0.71, 150, t, zt, { col: HEX.pink, shadow: HEX.ink });
    return { post: mergePost(caKick(t, [zt], 6, 0.3), punch(t, [zt], 0.03)) };
  }

  // ------------------------------------------------------------------ 7-8 not minus, just nothing, still

  /** The pink zero sinking down through the dark water to land in the sand beside her on "Still". */
  sinkingZero(c: C, g: C, t: number) {
    const t0 = this.cuts[6]!, land = this.w.still!.start, u = clamp((t - t0) / (land - t0));
    const x = W * 0.64 + 30 * Math.sin(u * 5), y = lerp(-160, H * 0.73, ease.inOutCubic(u)), rot = 0.3 * Math.sin(u * 7) * (1 - u);
    c.save(); c.translate(x, y); c.rotate(rot);
    c.font = font(FAM.hook(), 300); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = HEX.pink; c.fillText('0', 0, 0);
    c.restore();
    g.save(); g.translate(x, y); g.rotate(rot); g.font = font(FAM.hook(), 300); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = rgbaHex(HEX.pink, 0.4); g.fillText('0', 0, 0); g.restore();
    if (t >= land) for (let k = 0; k < 9; k++) { const v = clamp((t - land) / 0.6), a = Math.PI + (k / 8) * Math.PI; puff(c, x + Math.cos(a) * (60 + 140 * v), y + 110 + Math.sin(a) * 30 * v, 22 + 20 * v, `rgba(200,190,170,${0.7 * (1 - v)})`); }
    return [x, y] as [number, number];
  }

  minus(c: C, g: C, t: number, s: Shot): Out {
    seabed(c, t, { depth: 0.95, clues: ['stone', 'shells'], seed: 14, shark: false });
    const nt = this.w.not!.start, mt = this.w.minus!.start;
    const [zx, zy] = this.sinkingZero(c, g, t);
    // the minus, offered on "Not", struck out on "minus"
    const on = clamp((t - nt) / 0.1) * (1 - clamp((t - mt - 0.15) / 0.25));
    if (on > 0) {
      c.save(); c.globalAlpha = on; c.fillStyle = rgbaHex(HEX.bone, 0.7); c.fillRect(zx - 230, zy - 12, 90, 24);
      if (t > mt) { c.strokeStyle = HEX.pink; c.lineWidth = 7; c.beginPath(); c.moveTo(zx - 250, zy - 40); c.lineTo(zx - 120, zy + 40); c.stroke(); }
      c.restore();
    }
    const jolt = t < nt + 0.25 ? Math.sin(clamp((t - nt + 0.05) / 0.3) * Math.PI) * 0.3 : 0;
    drawRai(c, W * 0.34, H * 0.58, 130, { t, face: 'shock', look: 0.7, arms: ['up', 'up'], armsFrom: ['down', 'down'], armsU: clamp((t - s.s0) / 0.12), hop: jolt, marks: ['!?', 'sweat'], markT0: nt, glow: HEX.pink, glowStrength: 0.5, heart: 0.2 });
    seabedFront(c, t, { seed: 14 });
    c.font = font(FAM.mono(), 46); c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillStyle = rgbaHex(HEX.bone, 0.9 * clamp((t - nt) / 0.15)); c.fillText('NOT MINUS.', W * 0.34, H * 0.13);
    return { post: punch(t, [nt], 0.015) };
  }

  still(c: C, g: C, t: number, s: Shot): Out {
    seabed(c, t, { depth: 0.95, clues: ['stone', 'shells'], seed: 14, shark: false });
    this.sinkingZero(c, g, t);
    const st = this.w.still!.start;
    drawRai(c, W * 0.34, H * 0.58, 130, { t, face: 'sad', look: 0.6, arms: ['down', 'down'], squash: -0.12, marks: ['gloom'], markT0: s.s0, glow: HEX.pink, glowStrength: 0.4, heart: 0.15 + 0.15 * clamp((t - st) / 0.4), tilt: 0.06 });
    seabedFront(c, t, { seed: 14 });
    c.font = font(FAM.mono(), 46); c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillStyle = rgbaHex(HEX.bone, 0.9); c.fillText('NOT MINUS.', W * 0.34, H * 0.13);
    c.fillStyle = rgbaHex(HEX.bone, 0.9 * clamp((t - this.w.nothing!.start) / 0.15)); c.fillText('JUST NOTHING.', W * 0.34, H * 0.13 + 62);
    c.fillStyle = rgbaHex(HEX.pink, 0.95 * clamp((t - st) / 0.2)); c.fillText('STILL.', W * 0.34, H * 0.13 + 124);
    return {};
  }
}

void h01; void person;
