// MONEY (verse 2, lines 22-23): "Now you print it, you wire it, you mine it in code, a pledge on a screen held up as
// gold, / and honestly? Genius: it lets strangers trade. I won't call money a fraud;"
// Money's machines live in places (his direction, 2026-10-02); fast cuts on the beat (print / wire / mine / code land on
// the eighth before each word, as the rap pushes them); generic forms only, no logos or real product UIs.
//   1 PRESS     "Now you print it,": the press room, notes drying on a line, the press spitting notes; NOW, PRINT.
//               Clue: the punch clock by the door (paid hours, clocked: the meter to come in pre-chorus 2).
//   2 WIRE      "you wire it,": a street of flats at night; an arc of light flies from one lit window's phone to
//               another's (-50, +50). Clue: lower down, a third lit window where a woman rocks a child; the money
//               flies over her (the woman up the road, next plate).
//   3 MINE      "you mine it": a warehouse of racks, LEDs racing, heat shimmer; MINE. Clue: the electricity meter on
//               the wall spinning (a bill is coming).
//   4 CODE      "in code, a": close on a rack's screen, hex scrolling round a ring of 0s and 1s; CODE. Clue: a pickaxe
//               leaning on the rack (mining was once digging: the quarry on Palau).
//   5 PLEDGE    "pledge on a screen": a marble bank hall at night; the big screen types I PROMISE.; PLEDGE. Clue: the
//               vault door ajar on gold bars (what the screen will be held up as).
//   6 HELD      "held": on a plinth a silhouette lifts the screen overhead; the crowd's backs, camera flashes; HELD UP.
//   7 GOLD      "up as gold, and": the chandelier's light turns gold, the screen turns to gold, the crowd cheers; AS GOLD.
//   8 GENIUS    "honestly? Genius:": Rai on her seabed, wide-eyed (?), then joy, arms up, hopping, sparkles; GENIUS.
//               Clue: two fish swapping a shell behind her (strangers trading, next shot).
//   9 STRANGERS "it lets strangers": a harbour night market; two strangers (cyan and pink) walk in from either side.
//               Clue: the old rai stone standing by in the corner (the oldest money, still there).
//  10 TRADE     "trade. I": they shake hands, a gold spark at the clasp, basket and parcel swapped; TRADE.
//  11 WINK      "won't call money a fraud;": Rai on the seabed, sassy, pointing at the words I WON'T / CALL MONEY /
//               A FRAUD, hand on hip; she winks on "fraud". Clue: a child's lunchbox half buried in the sand beside
//               her (the lunchbox of the next plate).
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { HEX } from '../engine/palette';
import { font } from '../engine/type';
import type { Line, Word } from '../engine/lyrics';
import { clamp, ease, frameIdx, lerp } from '../engine/util';
import { drawRai, h01 } from './_rai';
import { FAM, TAU, gradientV, person, rgbaHex, slam, sunburst } from './_motifs';
import { fish, seabed, seabedFront } from './_world';
import { focusLines, poof, star4 } from './_manga';
import { hitShake, mergePost, punch } from './_post';
import { band, beatCut, plateLines, shotAt, wordOf } from './trader-kit';
import { bankHall, cityNight, nightMarket, note, pledgeScreen, powerMeter, press, pressRoom, warehouse } from './money-places';
import { both } from './ledger-rooms';

type Shot = ReturnType<typeof shotAt>;
type C = CanvasRenderingContext2D;
type Out = { sung?: string; post?: PostOverrides };

export default class Money extends Scene {
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
      now: q(/^now$/), print: q(/^print/), wire: q(/^wire/), mine: q(/^mine$/), code: q(/^code/), pledge: q(/^pledge/),
      screen: q(/^screen/), held: q(/^held/), up: q(/^up$/), gold: q(/^gold/), honestly: q(/^honestly/), genius: q(/^genius/),
      it: q(/^it$/, 1), strangers: q(/^strangers/), trade: q(/^trade/), i: q(/^i$/), wont: q(/^won.t/), call: q(/^call/),
      money: q(/^money/), a: q(/^a$/, 2), fraud: q(/^fraud/),
    };
    const w = this.w;
    this.cuts = [start, beatCut(au, w.wire!.start, 2), beatCut(au, w.mine!.start, 2), beatCut(au, w.code!.start, 2),
      beatCut(au, w.pledge!.start), beatCut(au, w.held!.start), beatCut(au, w.up!.start), beatCut(au, w.honestly!.start),
      beatCut(au, w.it!.start), beatCut(au, w.trade!.start), beatCut(au, w.wont!.start)];
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, end } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t;
    this.L.clear(HEX.ink); this.G.clear();
    const s = shotAt(this.cuts, t, end);
    const shots = [this.press, this.wire, this.mine, this.code, this.pledge, this.held, this.gold, this.genius, this.strangers, this.trade, this.wink];
    const fn = (shots[s.i] ?? this.press) as (...a: unknown[]) => Out | undefined;
    const r = fn.call(this, c, g, t, s, f) ?? {};
    // the trader's last line still finishing at the cut keeps its own colour
    band(c, this.bandLines, t, { sung: t < this.own[0]!.words[0]!.start ? HEX.coral : r.sung ?? HEX.yellow, dark: 0.8 });
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    return mergePost({ bloom: 0.7 }, r.post, { zoom: 1 + 0.01 * f.a.kick });
  }

  // ------------------------------------------------------------------ the machines

  press(c: C, g: C, t: number, s: Shot): Out {
    const fy = pressRoom(c, g, t);
    const [nx, ny] = press(c, g, t, W * 0.33, fy);
    // a worker at the delivery end
    person(c, W * 0.86, fy + 70, 300, 'hold', { col: '#1a1020', t, flip: true, rim: 'rgba(255,213,154,0.8)' });
    // the stack growing on the delivery table
    c.fillStyle = '#2a3042'; c.fillRect(W * 0.66, fy - 130, 300, 24);
    const stack = Math.min(14, Math.floor((t - s.s0) * 22));
    for (let k = 0; k < stack; k++) note(c, W * 0.66 + 150, fy - 140 - k * 7, 230, (h01(k, 7) - 0.5) * 0.08, '#3a7a2a', '#d9ecc9');
    // notes shooting out of the nip, one per 1/16 note, flying right and towards us
    const per = 60 / 140 / 4, n = Math.floor(t / per);
    for (let k = 12; k >= 0; k--) {
      const tb = (n - k) * per, u = (t - tb) / 0.8;
      if (tb < s.s0 - 0.5 || u > 1 || u < 0) continue;
      const x = nx + 1200 * u * (0.7 + 0.5 * h01(n - k, 3)), y = ny + (h01(n - k, 4) - 0.6) * 700 * u * u;
      note(c, x, y, 170 + 300 * u, (h01(n - k, 5) - 0.5) * 1.4 * u, '#3a7a2a', '#d9ecc9');
    }
    slam(c, 'NOW', W * 0.6, H * 0.12, 180, t, this.w.now!.start, { col: HEX.pink, shadow: HEX.ink, t1: this.w.print!.start - 0.02, exit: 0.05 });
    slam(c, 'PRINT', W * 0.6, H * 0.12, 200, t, this.w.print!.start, { col: HEX.lime, shadow: HEX.ink, rot: -0.04 });
    return { sung: HEX.lime, post: punch(t, [this.w.now!.start, this.w.print!.start], 0.025) };
  }

  wire(c: C, g: C, t: number, s: Shot): Out {
    const t0 = this.w.wire!.start, arrive = t0 + 0.24, u = ease.inOutCubic(clamp((t - t0) / 0.24));
    const A = { x: 130, y: 300, w: 220, h: 170 }, B = { x: W * 0.58 + 300, y: 196, w: 220, h: 170 }, M = { x: 330, y: 610, w: 220, h: 160 };
    cityNight(c, g, t, [{ ...A, lit: 1, who: 'phone' }, { ...B, lit: t >= arrive ? 1 : 0.55, who: 'phone' }, { ...M, lit: 0.7, who: 'mother' }]);
    const p0: [number, number] = [A.x + A.w * 0.6, A.y + A.h * 0.5], p1: [number, number] = [B.x + B.w * 0.6, B.y + B.h * 0.5];
    const arc = (v: number): [number, number] => [lerp(p0[0], p1[0], v), lerp(p0[1], p1[1], v) - Math.sin(v * Math.PI) * 240];
    c.setLineDash([6, 16]); c.strokeStyle = rgbaHex(HEX.cyan, 0.45); c.lineWidth = 3;
    c.beginPath(); for (let i = 0; i <= 40; i++) { const [x, y] = arc(i / 40); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); c.setLineDash([]);
    if (t >= t0 - 0.02) {
      g.lineCap = 'round';
      for (let k = 0; k < 24; k++) {
        const v0 = Math.max(0, u - 0.3 + (k * 0.3) / 24), v1 = Math.max(0, u - 0.3 + ((k + 1) * 0.3) / 24);
        const [x0, y0] = arc(v0), [x1, y1] = arc(v1);
        g.strokeStyle = rgbaHex(HEX.cyan, (k + 1) / 24); g.lineWidth = 3 + 9 * (k / 24);
        g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      }
      const [hx, hy] = arc(u);
      g.fillStyle = HEX.bone; g.beginPath(); g.arc(hx, hy, 14, 0, TAU); g.fill();
    }
    // the amounts on the two screens
    c.font = font(FAM.monoB(), 40); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = HEX.pink; c.fillText('−£50', p0[0], A.y - 30);
    if (t >= arrive) { c.fillStyle = HEX.lime; c.fillText('+£50', p1[0], B.y - 30); }
    slam(c, 'WIRE', W * 0.5, H * 0.42, 220, t, t0, { col: HEX.cyan, shadow: HEX.ink });
    return { sung: HEX.cyan, post: punch(t, [t0], 0.025) };
  }

  mine(c: C, g: C, t: number, s: Shot): Out {
    warehouse(c, g, t, 1 + 0.25 * s.lt);
    powerMeter(c, g, t, W * 0.1, H * 0.42, 150);
    person(c, W * 0.53, H * 0.6, 110, 'read', { col: '#05070f', t, rim: 'rgba(120,214,58,0.7)' });
    slam(c, 'MINE', W * 0.5, H * 0.22, 250, t, this.w.mine!.start, { col: HEX.yellow, shadow: HEX.ink });
    return { post: punch(t, [this.w.mine!.start], 0.025) };
  }

  code(c: C, g: C, t: number, s: Shot): Out {
    // close on a rack: its steel front, LED strips, the screen in the middle
    gradientV(c, '#1a1e2e', '#0c0e18');
    for (const x of [90, W - 150]) {
      c.fillStyle = '#232838'; c.fillRect(x, 0, 60, H);
      for (let r = 0; r < 18; r++) { const on = h01(r, x, frameIdx(t) >> 1) > 0.4, col = r % 3 ? HEX.lime : HEX.cyan; c.fillStyle = on ? col : '#1a2a20'; c.beginPath(); c.arc(x + 30, 40 + r * 56, 7, 0, TAU); c.fill(); if (on) { g.fillStyle = rgbaHex(col, 0.4); g.beginPath(); g.arc(x + 30, 40 + r * 56, 14, 0, TAU); g.fill(); } }
    }
    const sx = 260, sy = 70, sw = W - 520, sh = H * 0.66;
    c.fillStyle = '#0a0c14'; c.fillRect(sx - 20, sy - 20, sw + 40, sh + 40);
    c.save(); c.beginPath(); c.rect(sx, sy, sw, sh); c.clip();
    c.fillStyle = '#05080a'; c.fillRect(sx, sy, sw, sh);
    const HEXD = '0123456789ABCDEF';
    c.font = font(FAM.monoB(), 30); c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let col = 0; col < 24; col++) {
      const x = sx + 30 + col * 56, sp = 120 + 260 * h01(col, 3);
      for (let r = 0; r < 20; r++) {
        const y = sy + (((r * 42 - t * sp + h01(col, 4) * 900) % (20 * 42)) + 20 * 42) % (20 * 42) - 20;
        c.fillStyle = rgbaHex(HEX.lime, 0.15 + 0.5 * h01(col, r, 9));
        c.fillText(HEXD[Math.floor(h01(col, r, frameIdx(t) >> 2) * 16)]!, x, y);
      }
    }
    const cx = sx + sw / 2, cy = sy + sh / 2, R = 210, grow = ease.outBack(clamp((t - this.w.code!.start) / 0.25));
    c.fillStyle = 'rgba(5,8,10,0.85)'; c.beginPath(); c.arc(cx, cy, R + 60, 0, TAU); c.fill();
    c.font = font(FAM.monoB(), 44);
    for (let k = 0; k < 34; k++) {
      const a = (k / 34) * TAU + t * 0.8, x = cx + Math.cos(a) * R * grow, y = cy + Math.sin(a) * R * grow;
      c.save(); c.translate(x, y); c.rotate(a + Math.PI / 2); c.fillStyle = HEX.lime; c.fillText(k % 2 ? '1' : '0', 0, 0); c.restore();
      g.fillStyle = rgbaHex(HEX.lime, 0.3); g.beginPath(); g.arc(x, y, 15, 0, TAU); g.fill();
    }
    c.restore();
    // the pickaxe leaning on the rack
    c.save(); c.translate(W * 0.17, H * 0.84); c.rotate(-0.3);
    c.strokeStyle = '#2a1608'; c.lineWidth = 30; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -420); c.stroke();
    c.strokeStyle = '#9a6a3a'; c.lineWidth = 22; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -420); c.stroke();
    c.fillStyle = '#2a2f40'; c.beginPath(); c.moveTo(-190, -380); c.quadraticCurveTo(0, -470, 190, -380); c.lineTo(170, -360); c.quadraticCurveTo(0, -420, -170, -360); c.closePath(); c.fill();
    c.fillStyle = '#b8c0d8'; c.beginPath(); c.moveTo(-180, -382); c.quadraticCurveTo(0, -458, 180, -382); c.lineTo(170, -374); c.quadraticCurveTo(0, -440, -170, -374); c.closePath(); c.fill();
    c.restore();
    slam(c, 'CODE', cx, cy, 150, t, this.w.code!.start, { fam: FAM.monoB(), col: HEX.bone, shadow: HEX.ink });
    return { sung: HEX.lime, post: punch(t, [this.w.code!.start], 0.02) };
  }

  pledge(c: C, g: C, t: number, s: Shot): Out {
    bankHall(c, g, t);
    pledgeScreen(c, g, t, W * 0.5, H * 0.38, 760, 0, clamp((t - this.w.pledge!.start) / 0.35));
    slam(c, 'PLEDGE', W * 0.5, H * 0.08, 110, t, this.w.pledge!.start, { col: HEX.pink, shadow: HEX.ink });
    return { sung: HEX.pink };
  }

  /** The crowd's backs in the foreground, arms up, a few camera flashes going off. */
  crowd(c: C, g: C, t: number, joy: boolean, t0: number) {
    for (let i = 0; i < 9; i++) {
      const x = W * (0.04 + 0.115 * i) + 20 * Math.sin(i * 3), y = H + 70 + 30 * h01(i, 3);
      person(c, x, y, 330 + 50 * h01(i, 4), i % 3 === 1 ? 'cheer' : 'stand', { col: '#0e0a16', t: t + i, seed: i, emote: joy && i % 3 === 0 ? 'joy' : undefined, emoteT0: t0 });
    }
    const k = frameIdx(t);
    for (let i = 0; i < 3; i++) if (h01(k >> 2, i, 77) < 0.18) { const x = W * (0.1 + 0.8 * h01(k >> 2, i, 78)), y = H * (0.62 + 0.1 * h01(k >> 2, i, 79)); star4(g, x, y, 40, '#ffffff'); }
  }

  /** The silhouette on the plinth holding the screen overhead (arms up, the screen above the hands). */
  holder(c: C, g: C, t: number, x: number, feet: number, h: number, goldU: number, rise: number) {
    c.fillStyle = '#3a2f44'; c.fillRect(x - 160, feet, 320, 70); c.fillStyle = '#52465e'; c.fillRect(x - 175, feet, 350, 16);
    c.save(); c.shadowColor = goldU > 0 ? HEX.gold : HEX.violet; c.shadowBlur = 30;
    person(c, x, feet, h, 'cheer', { col: '#0e0a16', t: 0 });
    c.restore();
    const u = h / 100, sw = h * 0.95;
    pledgeScreen(c, g, t, x, feet - 112 * u - sw * 0.28 + (1 - rise) * 120, sw, goldU, 1);
  }

  held(c: C, g: C, t: number, s: Shot): Out {
    bankHall(c, g, t);
    const rise = ease.outBack(clamp((t - this.w.held!.start + 0.05) / 0.3));
    this.holder(c, g, t, W * 0.58, H * 0.74, 360, 0, rise);
    this.crowd(c, g, t, false, 0);
    slam(c, 'HELD', W * 0.22, H * 0.3, 150, t, this.w.held!.start, { col: HEX.bone, shadow: HEX.pink, rot: -0.06 });
    slam(c, 'UP', W * 0.22, H * 0.46, 170, t, this.w.held!.start + 0.14, { col: HEX.bone, shadow: HEX.pink, rot: -0.06 });
    return {};
  }

  gold(c: C, g: C, t: number, s: Shot): Out {
    const gt = this.w.gold!.start, gu = clamp((t - gt) / 0.15);
    bankHall(c, g, t, { gold: gu });
    // the chandelier's light turning gold, raying out behind the screen
    c.save(); c.globalAlpha = 0.25 + 0.55 * gu;
    c.beginPath(); c.rect(0, 0, W, H * 0.7); c.clip();
    sunburst(c, W * 0.5, H * 0.24, gu > 0 ? HEX.gold : HEX.violet, gu > 0 ? '#e0962a' : HEX.deep, 20, t * 0.25);
    c.restore();
    const z = 1.12 + 0.04 * s.lt;
    both(c, g, (cc) => { cc.translate(W / 2, H); cc.scale(z, z); cc.translate(-W / 2, -H); }, () => this.holder(c, g, t, W * 0.5, H * 0.86, 380, gu, 1));
    this.crowd(c, g, t, gu > 0, gt);
    slam(c, 'AS GOLD', W * 0.5, H * 0.6, 200, t, gt, { col: HEX.ink, shadow: HEX.bone, rot: -0.03 });
    return { sung: HEX.gold, post: mergePost(punch(t, [gt], 0.03), t >= gt && t < gt + 0.05 ? { flash: 0.45 } : {}) };
  }

  // ------------------------------------------------------------------ genius: strangers trade

  genius(c: C, g: C, t: number, s: Shot): Out {
    const gs = this.w.genius!.start, joy = t >= gs;
    seabed(c, t, { depth: 0.35, clues: ['coin', 'shells'], seed: 12 });
    // two fish swapping a shell (strangers trading)
    const fx = W * 0.62, fy = H * 0.3, sw = Math.sin(t * 2.4);
    fish(c, fx - 120, fy + 6 * Math.sin(t * 3), 34, '#ffd23f', 1, t, 1);
    fish(c, fx + 120, fy + 6 * Math.cos(t * 3), 34, '#ff8a2a', -1, t, 2);
    c.fillStyle = '#ffd2c4'; c.beginPath(); c.arc(fx + 80 * sw, fy - 4, 12, Math.PI, 0); c.closePath(); c.fill();
    if (joy) focusLines(c, W * 0.32, H * 0.42, 230, 'rgba(255,255,255,0.75)', t, { n: 80 });
    const hop = joy ? Math.abs(Math.sin((t - gs) * Math.PI * 140 / 60)) * 0.35 : 0;
    drawRai(c, W * 0.32, H * 0.6, 150, {
      t, face: joy ? 'joy' : 'wow', arms: joy ? ['up', 'up'] : ['cheek', 'cheek'], armsFrom: joy ? ['cheek', 'cheek'] : undefined, armsU: clamp((t - gs) / 0.12),
      hop, squash: joy && hop < 0.04 ? -0.25 : 0, marks: joy ? ['sparkle'] : ['?'], markT0: joy ? gs : this.w.honestly!.start, glow: HEX.yellow, glowStrength: joy ? 0.8 : 0.4, heart: joy ? 0.6 : 0.2, heartColor: HEX.yellow,
    });
    seabedFront(c, t, { seed: 12 });
    slam(c, 'GENIUS', W * 0.7, H * 0.5, 280, t, gs, { fam: FAM.cond(), col: HEX.yellow, shadow: HEX.ink, rot: -0.04 });
    return { sung: HEX.yellow, post: punch(t, [gs], 0.03) };
  }

  strangers(c: C, g: C, t: number, s: Shot): Out {
    const fy = nightMarket(c, g, t);
    const u = ease.outCubic(s.u), t0 = this.w.strangers!.start;
    const walk = (x: number, col: string, flip: boolean, seed: number, item: 'basket' | 'parcel') => {
      c.save(); c.shadowColor = col; c.shadowBlur = 26;
      person(c, x, fy + 150, 400, 'hold', { col: '#05030b', flip, t, seed, emote: '?', emoteT0: t0 + 0.1 * seed });
      c.restore();
      const hx = x + (flip ? -1 : 1) * 40, hy = fy + 150 - 0.62 * 400;
      if (item === 'basket') { c.fillStyle = '#c9a46a'; c.beginPath(); c.ellipse(hx, hy + 20, 46, 30, 0, 0, Math.PI); c.fill(); c.fillStyle = HEX.orange; c.beginPath(); c.arc(hx - 14, hy + 12, 14, 0, TAU); c.arc(hx + 16, hy + 10, 13, 0, TAU); c.fill(); }
      else { c.fillStyle = '#b8a07a'; c.fillRect(hx - 36, hy - 4, 72, 52); c.strokeStyle = '#5a3a20'; c.lineWidth = 4; c.beginPath(); c.moveTo(hx, hy - 4); c.lineTo(hx, hy + 48); c.moveTo(hx - 36, hy + 22); c.lineTo(hx + 36, hy + 22); c.stroke(); }
    };
    walk(lerp(W * 0.06, W * 0.34, u), HEX.cyan, false, 1, 'basket');
    walk(lerp(W * 0.94, W * 0.66, u), HEX.pink, true, 2, 'parcel');
    slam(c, 'STRANGERS', W * 0.5, H * 0.36, 180, t, t0, { col: HEX.bone, shadow: HEX.violet });
    return {};
  }

  trade(c: C, g: C, t: number, s: Shot): Out {
    const t0 = this.w.trade!.start, meet = ease.outBack(clamp((t - t0 + 0.1) / 0.16));
    const z = 1.55 + 0.06 * s.lt, hy = H * 0.7 + 150 - 0.84 * 400;
    c.save(); c.translate(W / 2, H * 0.5); c.scale(z, z); c.translate(-W / 2, -hy);
    const fy = nightMarket(c, g, t);
    const reach = 0.48 * 400, gap = lerp(120, 0, meet);
    for (const [x, col, flip, seed] of [[W / 2 - reach - gap, HEX.cyan, false, 1], [W / 2 + reach + gap, HEX.pink, true, 2]] as const) {
      c.save(); c.shadowColor = col; c.shadowBlur = 26;
      person(c, x, fy + 150, 400, 'point', { col: '#05030b', flip, t: 0, seed, emote: t >= t0 + 0.1 ? 'joy' : undefined, emoteT0: t0 + 0.1 });
      c.restore();
    }
    c.restore();
    if (t >= t0) {
      const a = clamp(1 - (t - t0) / 0.5), cy = H * 0.5;
      g.strokeStyle = rgbaHex(HEX.gold, a); g.lineWidth = 6;
      for (let k = 0; k < 16; k++) { const ang = (k / 16) * TAU, r0 = 50 + 260 * (1 - a); g.beginPath(); g.moveTo(W / 2 + Math.cos(ang) * r0, cy + Math.sin(ang) * r0); g.lineTo(W / 2 + Math.cos(ang) * (r0 + 60), cy + Math.sin(ang) * (r0 + 60)); g.stroke(); }
      g.fillStyle = rgbaHex(HEX.gold, 0.7 * a); g.beginPath(); g.arc(W / 2, cy, 34, 0, TAU); g.fill();
    }
    slam(c, 'TRADE', W * 0.5, H * 0.16, 220, t, t0, { col: HEX.yellow, shadow: HEX.ink });
    return { post: mergePost(punch(t, [t0], 0.03)) };
  }

  wink(c: C, g: C, t: number, s: Shot): Out {
    const fr = this.w.fraud!.start, wk = t >= fr + 0.06;
    seabed(c, t, { depth: 0.45, clues: ['shells'], seed: 13 });
    // a child's lunchbox, half buried in the sand
    c.save(); c.translate(W * 0.47, H * 0.77); c.rotate(-0.2);
    c.fillStyle = HEX.cyan; c.beginPath(); c.roundRect(-70, -50, 140, 70, 14); c.fill();
    c.strokeStyle = '#1aa9d6'; c.lineWidth = 8; c.beginPath(); c.arc(0, -50, 26, Math.PI, 0); c.stroke();
    c.fillStyle = HEX.coral; c.beginPath(); c.arc(-30, -18, 14, 0, TAU); c.fill();
    c.restore();
    c.fillStyle = '#e6cf91'; c.beginPath(); c.ellipse(W * 0.47, H * 0.79, 130, 26, 0, 0, TAU); c.fill();
    const push = 1 + 0.06 * ease.inOutCubic(s.u), rx = W * 0.72, ry = H * 0.58;
    c.save(); c.translate(rx, ry); c.scale(push, push); c.translate(-rx, -ry);
    drawRai(c, rx, ry, 150, { t, face: wk ? 'wink' : 'sassy', arms: ['point', 'hip'], armsFrom: ['down', 'down'], armsU: clamp((t - s.s0) / 0.2), tilt: wk ? -0.1 : 0.06, marks: wk ? ['shine'] : [], markT0: fr + 0.06, glow: HEX.lime, glowStrength: 0.5, heart: 0.3 });
    c.restore();
    seabedFront(c, t, { seed: 13 });
    const x = W * 0.3;
    slam(c, 'I WON’T', x, H * 0.22, 110, t, this.w.wont!.start, { col: HEX.bone, shadow: HEX.ink });
    slam(c, 'CALL MONEY', x, H * 0.37, 104, t, this.w.call!.start, { col: HEX.lime, shadow: HEX.ink });
    slam(c, 'A FRAUD', x, H * 0.54, 130, t, this.w.a!.start, { col: HEX.pink, shadow: HEX.ink, rot: -0.03 });
    poof(c, rx + 120, ry - 230, 60, t, fr + 0.06);
    return { sung: HEX.lime, post: punch(t, [fr + 0.06], 0.02) };
  }
}

void hitShake;
