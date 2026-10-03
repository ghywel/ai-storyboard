// HARBOUR (v2, 90.38-97.66; verse 2's second half, lines 24-25): the girl surfaces in the harbour town at night and
// walks home up the wet street. Rai rides as the pebble pendant round her neck (given in `manta`), and chibi Rai pops
// out of it to narrate. Cuts on the beat, one machine a beat, the frame always moving.
//   24 "Now you print it, you wire it, you mine it in code, a pledge on a screen that you hold up as gold,"
//     H1 "Now": she bursts up through the black water at the quay: the whole town along it (the bank, the pharmacy's
//        green cross, the phone shop, the big screen, the market's lights, the container stack, home's lit window on
//        the hill); chibi Rai pops out of the pebble, ta-da. H2 "print": the bank's cash machine spits a note (PLEASE
//        TAKE YOUR CASH; NEW NOTE · 0 IN STOCK); Rai points, cheeky. H3 "wire": the phone shop's window, a coin
//        hopping screen to screen, SENT, RECEIVED; Rai's eyes follow it, wow. H4 "mine it in code": the container on
//        the quay humming, IRON HULL LINES on its side, vents blinking lime, heat haze, a cat on top for the warmth;
//        Rai fans herself, deadpan, sweating. H5 "a pledge on a screen": the big screen over the square types I
//        PROMISE TO PAY THE BEARER ON DEMAND and signs it, the crowd looking up; Rai squints, scheming. H6 "that you
//        hold up as gold": the screen, a hand raising a gold coin like a trophy, confetti, GOLD ▲; Rai mimics the
//        trophy, grinning.
//   25 "and honestly? Genius. It lets strangers trade. I'm not here to tell you that money's a fraud;"
//     H7 "honestly? Genius.": the pendant close, the market's lights soft behind: "honestly?" chin in hand, then
//        "Genius." arms up, sparkles, lines of force: she means it. H8 "It lets strangers trade.": the night market
//        under string lights: a fisherman and a woman who have never met swap a fish for coins and both nod, hearts;
//        Rai, hands on cheeks, in love with it. H9 "I'm not here to tell you": the pendant close, the machines' cold
//        lights soft behind: sassy, arms crossed, then a wink. H10 "money's a fraud": the sandy road up to the stilt
//        hut with the one lit window (the home from the jetty at dusk), her wet footprints behind her, her mother's
//        shadow waiting on the curtain; the camera eases in to where `fever` begins.
// Clues: home's lit window on the hill in the first shot; the pharmacy's 24-hour cross (the fever tonight); the cash
// machine's "0 IN STOCK"; SEND MONEY HOME on the phone shop's glass; IRON HULL LINES (the trader's shipping line,
// still at it); the tin lunchboxes on a market stall (the lunchbox at 4 am); her mother's shadow on the curtain; the
// footprints `fever` finds at four.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../../engine/scene';
import { Layer2D, W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import type { Line, Word } from '../../engine/lyrics';
import { clamp, ease, lerp } from '../../engine/util';
import { h01, type RaiOpts } from '../_rai';
import { TAU, rgbaHex, person } from '../_motifs';
import { fish } from '../_world';
import { focusLines, poof, star4 } from '../_manga';
import { mergePost, punch, caKick } from '../_post';
import { pendantRai, bubbleLyric, clearGlowBand, withCam2, girl, type GirlPose } from './_diver';
import { featherGlow, plateLines, lyricAt } from './wreck-kit';
import { hutNight } from './fever-hut';
import { harbourWide, bankFront, phoneShop, minerBox, bigScreen, nightMarket, bokehStreet, walker, walkPose, drizzle, glow, pendantBubble } from './harbour-town';

type C2 = CanvasRenderingContext2D;
const PI = Math.PI;
const sm = (a: number, b: number, t: number) => ease.inOutCubic(clamp((t - a) / (b - a)));

export default class Harbour extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  lines: Line[] = [];
  cuts: number[] = [];
  w: Record<string, Word> = {};

  override init() {
    const { lyrics, audio: au, start, end } = this.ctx;
    const own = lyrics.lines.filter((l) => l.words[0]!.start >= start - 0.1 && l.words[0]!.start < end);
    this.lines = plateLines(lyrics.lines, start, end);
    const all = own.flatMap((l) => l.words);
    const q = (re: RegExp, n = 0) => all.filter((w) => re.test(w.w.toLowerCase().replace(/[^a-z0-9']/g, '')))[n] ?? all[0]!;
    this.w = {
      now: q(/^now/), print: q(/^print/), wire: q(/^wire/), mine: q(/^mine/), code: q(/^code/), pledge: q(/^pledge/), screen: q(/^screen/),
      hold: q(/^hold/), gold: q(/^gold/), honestly: q(/^honestly/), genius: q(/^genius/), strangers: q(/^strangers/), trade: q(/^trade/),
      im: q(/^i'm/), moneys: q(/^money/), fraud: q(/^fraud/),
    };
    this.w.you = all.find((w) => /^you$/i.test(w.w) && w.start > this.w.im!.start) ?? this.w.moneys!;
    const b0 = Math.round(au.beatAt(start)), bt = (k: number) => au.timeOfBeat(b0 + k);
    // one machine a beat, then the market and the walk home
    this.cuts = [0, 1, 2, 3, 5, 7, 9, 11, 14, 16].map(bt);
    this.cuts[0] = start;
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, end } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t;
    this.L.clear('#0c0a20'); this.G.clear();
    let i = 0;
    for (let k = 0; k < this.cuts.length; k++) if (t >= this.cuts[k]!) i = k;
    const s0 = this.cuts[i]!, s1 = this.cuts[i + 1] ?? end;
    const shots = [this.h1, this.h2, this.h3, this.h4, this.h5, this.h6, this.h7, this.h8, this.h9, this.h10];
    let post: PostOverrides = { bloom: 0.75, vignette: 0.45 };
    post = mergePost(post, shots[i]!.call(this, c, g, t, s0, s1) ?? {});
    featherGlow(g); clearGlowBand(g);
    const line = lyricAt(this.lines, t);
    if (line) bubbleLyric(c, line, t);
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    return mergePost(post, { zoom: 1 + 0.006 * f.a.kick });
  }

  // ------------------------------------------------------------------ line 24: print, wire, mine, a pledge, gold

  /** H1 "Now": she bursts up through the water at the quay, the town behind; chibi Rai pops out of the pebble. */
  h1(c: C2, g: C2, t: number, s0: number, s1: number): PostOverrides {
    const lt = t - s0, u = clamp(lt / (s1 - s0)), wl = H * 0.64, now = this.w.now!.start;
    withCam2(c, g, { zoom: 1.05 - 0.03 * u, y: 8 - 10 * u }, () => {
      harbourWide(c, g, t, { wl });
      const gx = W * 0.2, h = 900, uu = h / 100;
      const rise = ease.outBack(clamp(lt / 0.2), 1.3), gy = wl - 40 + 58 * uu + 420 * (1 - rise);
      // one hand pushing her mask up off her face, the other flung out in the splash
      const pose: GirlPose = { rot: -0.05, hip: [0.2, -0.2], knee: [-0.4, -0.3], sh: [2.75, 1.7 + 0.15 * Math.sin(lt * 8)], el: [1.9, 0.5], head: -0.12 };
      const ga = girl(c, gx, gy, h, pose, { t, mask: 'up', outfit: 'swim', slate: true, pendant: true, rim: 'rgba(170,230,255,0.85)' });
      // the water over her waist, and the rings she makes
      const wg = c.createLinearGradient(0, wl, 0, H); wg.addColorStop(0, 'rgba(20,18,56,0.94)'); wg.addColorStop(1, 'rgba(7,6,22,0.97)');
      c.fillStyle = wg; c.beginPath(); c.moveTo(gx - 320, H); c.lineTo(gx - 320, wl + 4);
      for (let x = gx - 320; x <= gx + 320; x += 20) c.lineTo(x, wl + 4 + 5 * Math.sin(x * 0.04 + t * 5));
      c.lineTo(gx + 320, H); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(200,230,255,0.6)'; c.lineWidth = 4;
      for (let k = 0; k < 3; k++) { const r = ((lt * 1.6 + k / 3) % 1); c.globalAlpha = 1 - r; c.beginPath(); c.ellipse(gx, wl + 10, 130 + 340 * r, 16 + 34 * r, 0, 0, TAU); c.stroke(); } c.globalAlpha = 1;
      // the splash: droplets thrown up off her shoulders, falling back
      if (lt < 0.5) {
        c.fillStyle = 'rgba(225,242,255,0.92)';
        for (let i = 0; i < 40; i++) {
          const vx = (h01(i, 11) - 0.5) * 1100, vy = 600 + 800 * h01(i, 12), tau = lt;
          const x = gx + vx * tau, y = wl - 60 - vy * tau + 2600 * tau * tau, r = 4 + 8 * h01(i, 13);
          if (y < wl + 10) { c.beginPath(); c.ellipse(x, y, r * 0.7, r * 1.4, Math.atan2(-vy + 5200 * tau, vx) + PI / 2, 0, TAU); c.fill(); }
        }
      }
      c.fillStyle = 'rgba(200,230,255,0.8)';   // water running off her
      for (let i = 0; i < 8; i++) { const k = ((lt * 1.8 + h01(i, 14)) % 1); c.beginPath(); c.arc(ga.head.x - 70 + i * 22, ga.head.y + 60 + k * 320, 3.5, 0, TAU); c.fill(); }
      // the pebble on her chest, and chibi Rai popping out of it: ta-da
      const pb = ga.pendant!;
      const up = pb.y < wl - 10;   // the pebble's glow and Rai only once it is out of the water
      const pop = clamp((t - (now - 0.14)) / 0.18), bub = { x: W * 0.42, y: H * 0.3 };
      if (up) pendantBubble(c, g, pb, 20, bub, 190, t, pop, { face: 'joy', arms: ['up', 'up'], marks: ['sparkle'], markT0: now, hop: 0.12 * Math.abs(Math.sin(lt * 12)) }, 0.7);
      poof(c, bub.x, bub.y, 150, t, now - 0.14);
    });
    return punch(t, [s0 + 0.06, now], 0.025);
  }

  /** H2 "print": the bank's cash machine spits a new note; Rai points at it, cheeky. */
  h2(c: C2, g: C2, t: number, s0: number): PostOverrides {
    const lt = t - s0, pr = this.w.print!.start;
    bankFront(c, g, t, { note: clamp((t - pr - 0.02) / 0.28), pan: lt * 50 });
    drizzle(c, t, 0.2);
    walker(c, g, W * 0.21 + lt * 90, H * 0.98, 600, t, {
      rim: 'rgba(130,240,255,0.85)', pop: 1, ps: 2.5, glow: 0.4, glint: 'plain',
      rai: { face: 'cheeky', arms: ['down', 'point'], tilt: -0.1, marks: ['shine'], markT0: pr + 0.1 },
    });
    return punch(t, [pr + 0.05], 0.025);
  }

  /** H3 "wire": the phone shop's window, a coin hopping screen to screen; Rai's eyes follow it. */
  h3(c: C2, g: C2, t: number, s0: number, s1: number): PostOverrides {
    const wi = this.w.wire!.start, uu = clamp((t - wi + 0.04) / (s1 - wi - 0.02));
    withCam2(c, g, { zoom: 1.02 + 0.03 * clamp((t - s0) / (s1 - s0)), x: -20 * uu }, () => {
      phoneShop(c, g, t, { u: uu });
    });
    walker(c, g, W * 0.1 + (t - s0) * 80, H * 1.0, 660, t, {
      rim: 'rgba(130,240,255,0.85)', pop: 1, ps: 2.6, glow: 0.4,
      rai: { face: 'wow', arms: ['cheek', 'cheek'], look: -0.6 + 1.6 * uu, marks: ['!'], markT0: wi + 0.08 },
    });
    return {};
  }

  /** H4 "mine it in code": the humming container; Rai fans herself, deadpan, sweating. */
  h4(c: C2, g: C2, t: number, s0: number, s1: number): PostOverrides {
    const lt = t - s0, cd = this.w.code!.start;
    minerBox(c, g, t, { pan: lt * 70 });
    drizzle(c, t, 0.14, 60, 9);
    const hot = t > cd;
    walker(c, g, W * 0.29 + lt * 70, H * 0.99, 600, t, {
      rim: 'rgba(170,255,120,0.8)', pop: 1, ps: 2.5, glow: 0.4, emote: hot ? 'sweat' : undefined, emoteT0: cd,
      rai: { face: hot ? 'deadpan' : 'shock', arms: ['wave', 'down'], marks: ['sweat'], markT0: s0 + 0.15, shake: hot ? 0.3 : 0 },
    });
    void s1;
    return punch(t, [this.w.mine!.start + 0.02], 0.02);
  }

  /** H5 "a pledge on a screen": the big screen types a promise to pay and signs it; the square looks up. */
  h5(c: C2, g: C2, t: number, s0: number, s1: number): PostOverrides {
    const u = clamp((t - s0) / (s1 - s0));
    withCam2(c, g, { zoom: 1.0 + 0.05 * u, y: -20 * u }, () => {
      bigScreen(c, g, t, { mode: 'pledge', u, wide: true });
      // the square below: people stopped, looking up
      for (let i = 0; i < 7; i++) {
        const x = W * (0.3 + 0.08 * i), y = H * 0.93 + 10 * h01(i, 3);
        person(c, x, y, 230 + 30 * h01(i, 4), i % 3 === 1 ? 'hands' : 'stand', { col: '#120d1d', t, seed: i, headTilt: -0.35, rim: 'rgba(120,150,255,0.6)', flip: i % 2 === 0 });
      }
    });
    walker(c, g, W * 0.12, H * 1.02, 640, t, {
      pose: { ...walkPose(t * 0.3), head: -0.3 }, rim: 'rgba(120,150,255,0.8)', pop: 1, ps: 2.5, glow: 0.4,
      rai: { face: 'scheme', arms: ['chin', 'down'], tilt: 0.1, look: 0.5 },
    });
    return punch(t, [this.w.screen!.start], 0.02);
  }

  /** H6 "that you hold up as gold": the screen raises a gold coin like a trophy; Rai mimics it, grinning. */
  h6(c: C2, g: C2, t: number, s0: number, s1: number): PostOverrides {
    const ho = this.w.hold!.start, go = this.w.gold!.start, u = clamp((t - (ho - 0.05)) / 0.5);
    withCam2(c, g, { zoom: 1.06 - 0.04 * clamp((t - s0) / (s1 - s0)) }, () => {
      bigScreen(c, g, t, { mode: 'gold', u });
    });
    // the gold light on the street below the screen
    c.fillStyle = 'rgba(40,24,8,0.55)'; c.fillRect(0, H * 0.82, W, H * 0.18);
    walker(c, g, W * 0.16, H * 1.06, 700, t, {
      pose: { ...walkPose(t * 0.2), head: -0.35 }, rim: 'rgba(255,214,110,0.9)', pop: 1, ps: 2.7, glow: 0.5,
      rai: { face: t > go ? 'grin' : 'wow', arms: ['up', 'up'], armsFrom: ['down', 'down'], armsU: clamp((t - ho) / 0.15), marks: t > go ? ['sparkle'] : [], markT0: go, hop: t > go ? 0.12 * Math.abs(Math.sin(t * 12)) : 0 },
    });
    return mergePost(punch(t, [go], 0.03), caKick(t, [go], 2.5, 0.2));
  }

  // ------------------------------------------------------------------ line 25: genius; strangers trade; not a fraud

  /** The pendant close: her in profile on the left (mask up, wet ponytail, the tee), the pebble on her chest, and
   *  chibi Rai out of it in a big bubble clear of her face; the town's lights soft behind (bokeh). */
  pendantClose(c: C2, g: C2, t: number, cols: string[], drift: number, rim: string, rai: Partial<RaiOpts>, fx?: (bx: number, by: number, br: number) => void) {
    bokehStreet(c, g, t, cols, { seed: cols.length * 7, drift });
    const b = { x: W * 0.56, y: H * 0.41 }, br = 290;
    if (fx) { c.save(); c.beginPath(); c.rect(0, 0, W, H - 250); c.clip(); fx(b.x, b.y, br); c.restore(); }
    const h = 1250, uu = h / 100, bob = 6 * Math.sin(t * 6.5);
    const pose: GirlPose = { rot: 0.03, hip: [-0.1, 0.1], knee: [0, 0], sh: [-0.3, 0.25], el: [0.4, 0.5], head: 0.05 };
    // a street light behind her head, so her silhouette reads against it
    const hx = W * 0.16, hy = H * 0.36 + bob;
    const bl = c.createRadialGradient(hx - 40, hy - 30, 0, hx - 40, hy - 30, 300);
    bl.addColorStop(0, rgbaHex(cols[0]!, 0.55)); bl.addColorStop(0.6, rgbaHex(cols[0]!, 0.22)); bl.addColorStop(1, rgbaHex(cols[0]!, 0));
    c.fillStyle = bl; c.fillRect(hx - 360, hy - 340, 640, 640);
    const ga = girl(c, hx, hy + 79 * uu, h, pose, { t, mask: 'up', outfit: 'tee', rim, slate: false, pendant: true });
    // Rai's bubble lights the front of her face
    c.save(); c.strokeStyle = rim; c.lineWidth = 6; c.lineCap = 'round';
    c.globalAlpha = 0.7; c.lineWidth = 4; c.beginPath(); c.arc(ga.head.x, ga.head.y, 10 * uu - 2, -0.6, 0.7); c.stroke(); c.restore();
    glow(g, ga.head.x + 8 * uu, ga.head.y, 120, cols[0]!, 0.22);
    const pb = ga.pendant!;
    pendantBubble(c, g, pb, 26, b, br, t, 1, rai, 0.8);
  }

  /** H7 "honestly? Genius.": she means it: chin in hand, then arms up, sparkles, lines of force. */
  h7(c: C2, g: C2, t: number, s0: number): PostOverrides {
    const ge = this.w.genius!.start, gen = t >= ge - 0.03;
    this.pendantClose(c, g, t, [HEX.gold, HEX.pink, '#ffb060', '#fff0c8'], (t - s0) * 60, 'rgba(255,210,150,0.85)',
      gen ? { face: 'joy', arms: ['up', 'up'], marks: ['sparkle'], markT0: ge, hop: 0.12 * Math.abs(Math.sin((t - ge) * 13)), squash: t - ge < 0.08 ? -0.3 : 0 }
        : { face: 'scheme', arms: ['chin', 'down'], tilt: 0.14, look: 0.6 },
      (bx, by, br) => { if (gen) { c.save(); c.beginPath(); c.arc(bx, by, br * 2.4, 0, TAU); c.clip(); focusLines(c, bx, by, br * 1.04, 'rgba(255,240,200,0.7)', t, { n: 70 }); c.restore(); } });
    return mergePost(punch(t, [ge], 0.035), caKick(t, [ge], 2, 0.18));
  }

  /** H8 "It lets strangers trade.": a fisherman and a woman who have never met swap a fish for coins; both nod, hearts. */
  h8(c: C2, g: C2, t: number, s0: number, s1: number): PostOverrides {
    const tr = this.w.trade!.start, u = clamp((t - s0) / (s1 - s0));
    withCam2(c, g, { zoom: 1.02 + 0.04 * u, x: 30 * u }, () => {
      nightMarket(c, g, t, { pan: (t - s0) * 40 });
      const swap = sm(tr - 0.24, tr + 0.06, t), nod = t > tr + 0.05 ? 0.28 * Math.max(0, Math.sin((t - tr - 0.05) * 14)) * (1 - clamp((t - tr - 0.5) / 0.3)) : 0;
      const fx = W * 0.44, mx = W * 0.66, gy = H * 0.97, hh = 640;
      // the lamp-lit pool they stand in
      c.save(); c.globalCompositeOperation = 'lighter';
      const lp = c.createRadialGradient((fx + mx) / 2, gy - hh * 0.6, 20, (fx + mx) / 2, gy - hh * 0.6, 520);
      lp.addColorStop(0, 'rgba(255,190,120,0.22)'); lp.addColorStop(1, 'rgba(255,190,120,0)');
      c.fillStyle = lp; c.fillRect(fx - 400, gy - hh * 1.3, mx - fx + 800, hh * 1.4); c.restore();
      // the fisherman (wide hat), holding out his fish; the woman (headscarf, a basket) holding out her coins
      person(c, fx, gy, hh, 'point', { col: '#1a1020', t, seed: 31, headTilt: nod, rim: 'rgba(255,200,140,0.95)', emote: t > tr + 0.08 ? 'heart' : undefined, emoteT0: tr + 0.08 });
      const hx = fx + nod * hh * 0.08, hy = gy - hh * 0.88;
      c.fillStyle = '#1a1020'; c.beginPath(); c.ellipse(hx, hy - hh * 0.07, hh * 0.17, hh * 0.035, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(hx, hy - hh * 0.075, hh * 0.075, PI, TAU); c.fill();
      c.strokeStyle = 'rgba(255,200,140,0.8)'; c.lineWidth = 3; c.beginPath(); c.ellipse(hx, hy - hh * 0.07, hh * 0.17, hh * 0.035, 0, PI * 1.1, PI * 1.9); c.stroke();
      person(c, mx, gy, hh * 0.94, 'point', { col: '#1c1224', t, seed: 37, flip: true, headTilt: -nod, rim: 'rgba(255,170,190,0.95)', emote: t > tr + 0.12 ? 'heart' : undefined, emoteT0: tr + 0.12 });
      const mhx = mx - nod * hh * 0.08, mhy = gy - hh * 0.94 * 0.88;
      c.fillStyle = HEX.orange; c.beginPath(); c.arc(mhx, mhy - 2, hh * 0.098, PI * 0.95, PI * 2.05); c.lineTo(mhx + hh * 0.12, mhy + hh * 0.07); c.closePath(); c.fill();
      c.fillStyle = '#8a5a2a'; c.beginPath(); c.roundRect(mx + 20, gy - hh * 0.52, 80, 54, 8); c.fill();
      c.strokeStyle = '#6a3a1a'; c.lineWidth = 6; c.beginPath(); c.arc(mx + 60, gy - hh * 0.52, 30, PI, TAU); c.stroke();
      // the fish goes right, the coins go left, through the lamp light between them
      const hand1 = { x: fx + hh * 0.4, y: gy - hh * 0.86 }, hand2 = { x: mx - hh * 0.94 * 0.4, y: gy - hh * 0.94 * 0.86 };
      const fishP = { x: lerp(hand1.x, hand2.x, swap), y: lerp(hand1.y, hand2.y, swap) + 10 - 60 * Math.sin(swap * PI) };
      c.save(); c.translate(fishP.x, fishP.y); c.rotate(PI / 2 + 0.25 * Math.sin(t * 9)); fish(c, 0, 40, 46, '#c8d8e8', 1, t, 0); c.restore();
      for (let k = 0; k < 3; k++) {
        const v = clamp(swap * 1.2 - k * 0.1), x = lerp(hand2.x, hand1.x, v) + (k - 1) * 18, y = lerp(hand2.y, hand1.y, v) - 70 * Math.sin(v * PI) - k * 8 + 40;
        c.fillStyle = HEX.gold; c.beginPath(); c.ellipse(x, y, 16, 12, 0, 0, TAU); c.fill(); c.strokeStyle = '#a06a14'; c.lineWidth = 3; c.stroke();
        glow(g, x, y, 34, HEX.gold, 0.45);
      }
      if (t > tr && t < tr + 0.4) { const k = (t - tr) / 0.4; for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU; star4(c, (fx + mx) / 2 + Math.cos(a) * 110 * (0.5 + k), gy - hh * 0.82 + Math.sin(a) * 70 * (0.5 + k), 18 * (1 - k), '#fff6c8'); } }
    });
    walker(c, g, W * 0.1 + (t - s0) * 50, H * 1.06, 700, t, {
      pose: { ...walkPose(t * 0.6) }, rim: 'rgba(255,200,140,0.85)', pop: 1, ps: 2.7, glow: 0.5,
      rai: { face: t > tr ? 'love' : 'wow', arms: ['cheek', 'cheek'], marks: t > tr ? ['hearts'] : [], markT0: tr + 0.05, look: 0.8 },
    });
    return punch(t, [tr + 0.02], 0.025);
  }

  /** H9 "I'm not here to tell you that": the pendant close: sassy, arms crossed, then a wink. */
  h9(c: C2, g: C2, t: number, s0: number): PostOverrides {
    const wk = this.w.you!.start, wink = t >= wk;
    this.pendantClose(c, g, t, ['#7a5cff', HEX.cyan, HEX.lime, '#c65cf0'], -(t - s0) * 50, 'rgba(150,200,255,0.85)',
      { face: wink ? 'wink' : 'sassy', arms: ['cross', 'cross'], tilt: wink ? -0.12 : 0.14, marks: wink ? ['shine'] : [], markT0: wk, look: wink ? 0.3 : -0.4 },
      (bx, by, br) => { if (wink) { const k = clamp((t - wk) / 0.25); star4(c, bx + br * 0.85, by - br * 0.75, 44 * ease.outBack(k), '#ffffff'); } });
    return punch(t, [wk], 0.02);
  }

  /** H10 "money's a fraud": the road home as `fever` opens on it (its own drawing, so the cut is a pure time cut): she
   *  walks up to the porch of the hut with the one lit window, her mother's shadow waiting on the curtain; her wet
   *  footprints are the ones `fever` finds at four. The camera eases to `fever`'s first framing. */
  h10(c: C2, g: C2, t: number, s0: number, s1: number): PostOverrides {
    const u = clamp((t - s0) / (s1 - s0)), e = ease.outCubic(u);
    withCam2(c, g, { zoom: lerp(0.99, 1.04, e), x: lerp(10, 40, e), y: lerp(50, 30, e) }, () => {
      hutNight(c, g, t);
      // fever-hut.ts's footprint path, from the harbour road to the porch steps
      const v = 0.78 + 0.1 * u, x = 900 + (1262 + 190 * 1.3 - 900) * v * v, y = H * 0.95 + (648 + 4 - H * 0.95) * v;
      walker(c, g, x, y, 150, t, { rim: 'rgba(255,200,130,0.9)', pop: 0, ps: 0.55, glow: 0.8 });
      glow(g, x + 6, y - 150 * 0.55, 26, HEX.pink, 0.55);
    });
    return {};
  }
}
