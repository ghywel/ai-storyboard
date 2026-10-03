// v1 "WHAT'S IT WORTH?", TWIST (27.09–40.80; lines 6–9, rapped; TREATMENT-v1.md). Cuts every two beats or so.
//   27.09  the trapdoor wide carries on across the cut (archive's last shot): she lands, dusts herself off, grins
//   27.52  CAM 2 crash-zooms in: "Now here's the twist", finger to her lips, scheming; the TWIST! split-flap board drops
//          from the flies and lands letter by letter on "twist"
//   28.37  "and I love this bit": hearts, hands to her cheeks, hopping under the board
//   29.23  the loss adjuster's desk: LOSS REPORT, WRITE OFF? A faceless hand's red pen creeps to YES ("nobody wrote me");
//          on "off" the stamp slams NOT WRITTEN OFF, the pen recoils, and Rai pops up chibi in the corner and winks
//   30.52  WORTH NEWS: Rai at the desk, serious; the studio screen is the BREAKING bulletin live from Yap; the ticker
//   31.37  live from Yap at sunset: the islanders at the water's edge point down at the sea ("we know she's down
//          there"), "!"; in the cutaway below the surface the stone rests on the seabed, her heart faintly lit; a
//          steamer on the horizon (the trader to come)
//   32.66  the desk, closer: YAP POLL, BELIEF fills to 100% ("and believing was enough"); a cheeky glance to camera
//   33.94  a channel flip: THE ROCK SHOP. A turntable of deals, each SOLD for 1 UNSEEN STONE: a deed to a plot
//          ("land"), a feud settled (two silhouettes shaking hands, "feud"), a wedding garland with a gold ring in it
//          ("complete"); Rai presents, grinning, palm open
//   37.37  a channel flip back: THE RICH LIST on the stage's podiums: #3 a yacht, #2 a gold bar (in a vault, also unseen),
//          #1 an empty spot with a "?" - and Rai peeking over it, smug ("I haven't been seen in living memory")
//   39.09  the wide: she hops onto #1 on "and I'm the", RICHEST ROCK slams on "richest", the scoreboard reads NET WORTH:
//          AGREED, confetti bubbles, APPLAUSE
//   39.94  crash zoom: a chibi pop, joy ("rock")
//   40.37  the wide: full size, a Team Rocket pose on the podium, the set lit for the vote's warm spot to take over
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../../engine/scene';
import { Layer2D, W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import { clamp, ease } from '../../engine/util';
import type { Line } from '../../engine/lyrics';
import { drawRai, type ArmPose, type Face } from '../_rai';
import { poof, focusLines } from '../_manga';
import { FAM, rgbaHex, slam } from '../_motifs';
import { mergePost, punch, hitShake, caKick } from '../_post';
import { SET, studio, studioFront, liveBug, camTag, micProp, staticFlip, type StudioOpts } from './_studio';
import { cam2, frameOn, camMix, wordOf, shotAt, crash, LyricBar, stamp, priceTag, confetti, sfx, trapdoor, standSign } from './onair-kit';
import { showSpots, raiAt } from './onair-show';
import { trapShot } from './archive-gags';
import { flipBoard, writeOffForm, newsDesk, ticker, shoreFootage, liveFeed, beliefPoll, shopSet, turntable, podium, yacht, goldBar, richCaption, cone } from './twist-sets';

const TICKER = 'YAP: ISLANDERS SAY "WE KNOW SHE\'S DOWN THERE" · BELIEF: 100% · STONE LAST SEEN: NOT IN LIVING MEMORY · STILL ACCEPTED FOR LAND, FEUDS AND WEDDINGS ·';
const POD = { 1: { x: W / 2, w: 300, h: 140 }, 2: { x: W / 2 - 360, w: 260, h: 100 }, 3: { x: W / 2 + 360, w: 260, h: 70 } } as const;
const podTop = (k: 1 | 2 | 3) => SET.floor + 12 - POD[k].h;

export default class Twist extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  lines: Line[] = [];
  bar!: LyricBar;
  cuts: number[] = [];
  bt: (k: number) => number = () => 0;
  w: Record<string, number> = {};
  trap = { t0: 0, went: 0, tOpen: 0, tUp: 0 };

  override init() {
    const { lyrics, audio: au, start, end } = this.ctx;
    // the lines sung in the window (line 5's last word rings across the cut from archive)
    this.lines = lyrics.lines.filter((l) => l.end > start + 0.02 && l.words[0]!.start < end);
    this.bar = new LyricBar(this.lines);
    const b0 = Math.round(au.beatAt(start + 0.02));
    this.bt = (k: number) => au.timeOfBeat(b0 + k);
    this.cuts = [0, 1, 3, 5, 8, 10, 13, 16, 18, 19, 21, 23, 24, 26, 28, 30, 31].map((k) => this.bt(k));
    const l5 = lyrics.get('went to the bottom'), l6 = lyrics.get("here's the twist"), l7 = lyrics.get('we know she'), l8 = lyrics.get('settle a feud'), l9 = lyrics.get('richest rock');
    this.trap = { t0: this.bt(-3), went: wordOf(l5, /went/).start, tOpen: wordOf(l5, /bottom/).start, tUp: wordOf(l5, /sea/).start };
    this.w = {
      now: l6.words[0]!.start, twist: wordOf(l6, /twist/).start, love: wordOf(l6, /love/).start, nobody: wordOf(l6, /nobody/).start, wrote: wordOf(l6, /wrote/).start, off: wordOf(l6, /off/).start,
      island: wordOf(l7, /island/).start, we: wordOf(l7, /we/).start, believing: wordOf(l7, /believing/).start, enough: wordOf(l7, /enough/).start,
      so: l8.words[0]!.start, land: wordOf(l8, /land/).start, settle: wordOf(l8, /settle/).start, feud: wordOf(l8, /feud/).start,
      make: wordOf(l8, /make/).start, wedding: wordOf(l8, /wedding/).start, complete: wordOf(l8, /complete/).start,
      seen: wordOf(l9, /seen/).start, memory: wordOf(l9, /memory/).start, and: wordOf(l9, /and/).start, richest: wordOf(l9, /richest/).start,
      rock: wordOf(l9, /rock/).start, street: wordOf(l9, /street/).start,
    };
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t, w = this.w;
    this.L.clear(HEX.ink); this.G.clear();
    const { i: shot, t0 } = shotAt(this.cuts, t);
    const t1 = this.cuts[shot + 1] ?? this.ctx.end;
    const lt = t - t0, u = clamp(lt / (t1 - t0));
    let post: PostOverrides = { bloom: 0.75 };
    const R = raiAt(150);
    const set = (o: StudioOpts = {}): StudioOpts => ({ curtain: 0, ring: 0, sign: 1, onAir: true, house: 0.72, spots: showSpots(t), score: null, cue: null, ...o });
    const rai = (o: Partial<Parameters<typeof drawRai>[4]> = {}, x = R.x, y = R.y, r = R.R) =>
      drawRai(c, x, y, r, { t, face: 'smile', glow: HEX.gold, glowStrength: 0.6, heart: 0.35 + 0.4 * f.a.vocal, prop: { side: 1, draw: micProp }, ...o });
    const flips = [this.cuts[7]!, this.cuts[12]!];
    const boardDrop = clamp((t - this.cuts[1]!) / 0.3);

    if (shot === 0) {
      // ---- the trapdoor wide, continued from archive: she lands and dusts herself off
      trapShot(c, g, t, this.trap, f.a.vocal);
    } else if (shot === 1 || shot === 2) {
      // ---- CAM 2 crash zoom: here's the twist (scheme, finger to lips), the TWIST! board lands; then I love this bit
      const close = frameOn(R.x, 400, 1.7), mid = frameOn(R.x, 440, 1.3);
      const k = shot === 1 ? camMix({ zoom: 1 }, close, crash(t, t0, 0.12)) : camMix(mid, frameOn(R.x, 420, 1.38), u);
      const hop = shot === 2 ? Math.abs(Math.sin(lt * Math.PI * (140 / 60))) * 0.2 : 0;
      cam2([c, g], k, () => {
        studio(c, g, t, set({ cue: 'LAUGH', cueT0: t0 - 2 }));
        trapdoor(c, R.x, SET.floor - 4, 250, 0, t);   // the trapdoor she came back up through, and its sign
        standSign(c, R.x - 250, SET.floor + 6, 0.8, t);
        flipBoard(c, g, R.x, 205, t, boardDrop, w.twist);
        if (shot === 1) rai({ face: t < w.twist + 0.1 ? 'scheme' : 'grin', arms: ['chin', 'down'], armsFrom: ['shrug', 'chin'], armsU: clamp(lt / 0.15), prop: { side: 1, draw: micProp }, marks: t >= w.twist + 0.1 ? ['sparkle'] : [], markT0: w.twist + 0.1, tilt: 0.08 });
        else rai({ face: 'love', arms: ['cheek', 'chin'], hop, squash: hop < 0.03 ? -0.2 : 0.05, marks: ['hearts'], markT0: w.love, blush: 0.8, tilt: 0.06 * Math.sin(lt * 7) });
        if (shot === 2) studioFront(c, g, t, { crowd: 1, mood: 'cheer' });
      });
      liveBug(c, g, t, 'LIVE');
      camTag(c, shot === 1 ? 'CAM 2' : 'CAM 1', t, t0);
      post = mergePost(post, punch(t, [t0, w.twist], 0.025), hitShake(t, [w.twist], 4, 0.25));
    } else if (shot === 3) {
      // ---- the write-off: the pen creeps to YES; NOT WRITTEN OFF; Rai pops up chibi and winks
      const pen = clamp((t - t0) / (w.off - t0 - 0.1)), recoil = ease.outCubic(clamp((t - w.off) / 0.2));
      cam2([c, g], { zoom: 1.0 + 0.04 * u }, () => writeOffForm(c, g, t, pen, recoil));
      stamp(c, 'NOT WRITTEN OFF', W * 0.5, H * 0.4, 118, t, w.off, { rot: -0.16, sub: 'BY ORDER OF THE WHOLE ISLAND' });
      if (t >= w.off) sfx(c, 'KA-CHUNK!', W * 0.2, H * 0.72, 64, t, w.off, w.off + 0.4, { col: HEX.bone, rot: -0.1 });
      const pop = w.off + 0.06;
      if (t >= pop) {
        const pu = ease.outBack(clamp((t - pop) / 0.18), 2);
        drawRai(c, W * 0.86, H * 0.84 - 300 * pu, 135, { t, face: t < pop + 0.12 ? 'scheme' : 'wink', sd: true, arms: ['down', 'wave'], marks: ['shine'], markT0: pop + 0.12, glow: HEX.gold });
        poof(c, W * 0.86, H * 0.52, 200, t, pop);
      }
      post = mergePost(post, hitShake(t, [w.off], 7, 0.35), caKick(t, [w.off], 5, 0.25), punch(t, [w.off], 0.035));
    } else if (shot === 4 || shot === 6) {
      // ---- WORTH NEWS: the desk, the BREAKING bulletin on the screen (then the poll), the ticker
      const dx = 1150, poll = shot === 6;
      const k = poll ? frameOn(1330, 555, 1.6 + 0.06 * u) : frameOn(1400, 560, 1.4);
      const glance = poll && t > this.bt(14) + 0.1;
      cam2([c, g], k, () => {
        studio(c, g, t, set({
          spots: showSpots(t, dx, 0.6), house: 0.6,
          screen: poll ? (cc, gg, x, y, ww, hh) => beliefPoll(cc, gg, x, y, ww, hh, ease.outCubic(clamp((t - t0) / 0.9)), t) : liveFeed(t, (cc, gg) => shoreFootage(cc, gg, t, w.we)),
        }));
        // the bulletin's red banner across the bottom of the screen
        if (!poll) {
          const S = SET.screen;
          c.fillStyle = '#e8323c'; c.fillRect(S.x, S.y + S.h - 56, S.w, 56);
          c.font = font(FAM.hook(), 30); c.fillStyle = HEX.bone; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('BREAKING · YAP', S.x + S.w / 2, S.y + S.h - 27);
        }
        drawRai(c, dx, R.y, R.R, {
          t, face: glance ? 'cheeky' : 'serious', arms: ['cross', 'cross'], glow: HEX.cyan, glowStrength: 0.5, heart: 0.35, look: glance ? 0 : 0.6,
          marks: glance ? ['shine'] : [], markT0: this.bt(14) + 0.15, tilt: glance ? -0.08 : 0, noBlink: !glance,
        });
        newsDesk(c, g, dx, R.y + 0.12 * R.R, 560, t);
        // a desk mic
        c.strokeStyle = '#2a2a33'; c.lineWidth = 5; c.beginPath(); c.moveTo(dx + 170, R.y + 0.12 * R.R - 6); c.lineTo(dx + 140, R.y + 0.12 * R.R - 70); c.stroke();
        c.fillStyle = '#d8dbe4'; c.beginPath(); c.ellipse(dx + 136, R.y + 0.12 * R.R - 80, 10, 16, -0.4, 0, Math.PI * 2); c.fill();
      });
      ticker(c, t, this.cuts[4]! + 0.1, TICKER);
      c.save(); c.translate(0, 40); liveBug(c, g, t, 'LIVE'); c.restore();
      if (poll) post = mergePost(post, punch(t, [this.bt(14)], 0.02));
    } else if (shot === 5) {
      // ---- live from Yap: the islanders point down at the sea; the stone below
      cam2([c, g], { zoom: 1.03 + 0.03 * u }, () => shoreFootage(c, g, t, w.we));
      ticker(c, t, this.cuts[4]! + 0.1, TICKER);
      c.save(); c.translate(0, 40); liveBug(c, g, t, 'LIVE · YAP'); c.restore();
    } else if (shot >= 7 && shot <= 11) {
      // ---- THE ROCK SHOP: the turntable of deals, each SOLD for 1 UNSEEN STONE
      const turn = (a: number, b: number) => ease.inOutCubic(clamp((t - a) / 0.25)) * b;
      const rot = turn(w.settle - 0.1, (2 * Math.PI) / 3) + turn(w.make - 0.35, (2 * Math.PI) / 3);
      const solds = [w.land, w.feud, w.complete], orders = solds.filter((s) => t >= s).length;
      const item = t < w.settle - 0.1 ? 0 : t < w.make - 0.35 ? 1 : 2, soldT = solds[item]!;
      const wide = shot === 7 || shot === 10;
      const TT = { x: W * 0.64, y: H * 0.72 };
      const k = wide ? frameOn(W / 2, H / 2, 1 + 0.02 * u) : frameOn(TT.x, H * 0.5, 1.75 + 0.05 * u);
      cam2([c, g], k, () => {
        shopSet(c, g, t, 1204 + orders);
        turntable(c, g, t, TT.x, TT.y, rot, 1);
        const hop = Math.abs(Math.sin((t - t0) * Math.PI * (140 / 60))) * 0.12;
        drawRai(c, W * 0.22, H * 0.8 - 1.07 * 140, 140, {
          t, face: item === 2 ? 'joy' : 'grin', arms: shot === 10 ? ['reach', 'reach'] : ['chin', 'reach'], armsFrom: ['chin', 'down'], armsU: clamp(lt / 0.2),
          prop: shot === 10 ? undefined : { side: -1, draw: micProp }, hop, glow: HEX.yellow, glowStrength: 0.6, heart: 0.4, marks: ['sparkle'], markT0: t0 + 0.1, look: 1,
        });
      });
      // SOLD over the item in front, its tag swinging in
      if (t >= soldT) {
        const sx = wide ? TT.x : W / 2, sy = wide ? H * 0.42 : H * 0.36;
        stamp(c, 'SOLD', sx, sy, wide ? 110 : 170, t, soldT, { rot: -0.2 });
        priceTag(c, wide ? TT.x + 330 : W * 0.22, wide ? H * 0.3 : H * 0.3, wide ? 0.9 : 1.2, t, soldT + 0.06, 'PRICE', '1 UNSEEN STONE');
      }
      liveBug(c, g, t, 'LIVE');
      post = mergePost(post, punch(t, solds, 0.025));
    } else {
      // ---- THE RICH LIST on the stage: #3 a yacht, #2 a gold bar, #1 ... RICHEST ROCK
      const onTop = t >= w.and + 0.05, landT = w.and + 0.25, hopU = clamp((t - (w.and + 0.05)) / 0.22);
      const rich = t >= w.richest;
      // the last beat: the podiums sink into the stage on their lifts and she rides #1 down to the floor, so the cut to
      // the vote lands on the bare wide stage with her at centre
      const sink = shot === 16 ? ease.inOutCubic(clamp((t - t0 - 0.05) / (t1 - t0 - 0.12))) : 0;
      const pt = (k: 1 | 2 | 3) => podTop(k) + sink * (POD[k].h + 30);
      const p1 = pt(1);
      // where she is: peeking over #1 (hiding behind it), hopping up, standing on it
      const peekY = p1 + 1.1 * R.R - 22, standY = Math.min(podTop(1) - 1.07 * R.R + sink * (R.y - podTop(1) + 1.07 * R.R), R.y);
      const ry = !onTop ? peekY : t < landT ? peekY + (standY - peekY) * ease.outQuad(hopU) - 120 * Math.sin(hopU * Math.PI) : standY;
      const cams = [frameOn(W / 2 + 300, 500, 1.6), frameOn(W / 2 - 180, 520, 1.5), { zoom: 1 }, frameOn(W / 2, standY - 1.1 * R.R + 40, 2.3), { zoom: 1 }];
      const ci = shot - 12;
      const k = ci === 3 ? camMix({ zoom: 1 }, cams[3]!, crash(t, t0, 0.1)) : cams[ci]!;
      cam2([c, g], k, () => {
        studio(c, g, t, set({
          house: rich ? 0.72 : 0.45, spots: rich ? showSpots(t, W / 2, 1) : [],
          score: rich ? [{ text: 'NET WORTH', col: HEX.bone }, { text: 'AGREED', col: HEX.gold }] : null,
          cue: rich ? 'APPLAUSE' : null, cueT0: w.richest + 0.05,
          screen: sink > 0.75 ? null : (cc, gg, x, y, ww, hh) => richScreen(cc, gg, x, y, ww, hh, t, rich),
        }));
        cone(c, g, POD[3].x, pt(3), 150, '#fff3c8', 0.9 * (1 - sink));
        cone(c, g, POD[2].x, pt(2), 150, '#fff3c8', (t >= this.cuts[13]! ? 0.6 : 0.25) * (1 - sink));
        cone(c, g, POD[1].x, p1, 170, rich ? HEX.pink : '#fff3c8', (t >= this.cuts[13]! ? 1 : 0.2) * (1 - sink));
        const lift = (fn: () => void) => { // the podiums and what is on them go down through the stage floor
          if (sink <= 0) return fn();
          for (const cc of [c, g]) { cc.save(); cc.beginPath(); cc.rect(-W, -H, W * 3, SET.floor + 12 + H); cc.clip(); } fn(); c.restore(); g.restore();
        };
        lift(() => { yacht(c, POD[3].x, pt(3) - 18 + 170 * sink, 0.85); goldBar(c, g, POD[2].x, pt(2) - 18 + 110 * sink, 1.0, t); });
        // her, behind #1 until she hops up
        const chibi = shot === 15;
        const face: Face = rich ? (chibi ? 'joy' : shot === 16 ? (t < t0 + 0.2 ? 'smug' : 'joy') : 'joy') : onTop ? 'grin' : 'smug';
        const arms: [ArmPose, ArmPose] = shot === 16 ? ['up', 'hip'] : rich ? ['up', 'up'] : onTop ? ['up', 'up'] : ['down', 'chin'];
        if (!onTop) {
          c.save(); c.beginPath(); c.rect(-W, -H, W * 3, SET.floor + 12 + H); c.clip();
          rai({ face, arms, look: -0.6, marks: t > w.seen ? ['shine'] : [], markT0: w.seen + 0.05, noBlink: true }, POD[1].x + 40, ry);
          c.restore();
          podium(c, g, POD[1].x, p1, POD[1].w, POD[1].h, 1, 0.3);
          sfx(c, '?', POD[1].x, p1 - 150, 150, t, this.cuts[13]! + 0.1, w.and, { col: HEX.cyan, rot: 0.1 });
        } else {
          if (t >= landT) lift(() => podium(c, g, POD[1].x, p1, POD[1].w, POD[1].h, 1, (rich ? 1 : 0.4) * (1 - sink)));
          if (chibi) {
            focusLines(c, R.x, standY - 0.4 * R.R, 220, 'rgba(255,240,200,0.6)', t, { n: 80 });
            rai({ face: 'joy', sd: true, arms: ['up', 'up'], marks: ['sparkle'], markT0: t0 }, R.x, standY);
          } else rai({ face, arms, armsFrom: shot === 16 ? ['up', 'up'] : undefined, armsU: shot === 16 ? clamp((t - t0) / 0.15) : 1, marks: rich ? ['sparkle'] : [], markT0: w.richest, squash: t < landT + 0.15 && t >= landT ? -0.3 : 0, tilt: shot === 16 ? -0.08 : 0, glow: rich ? HEX.gold : HEX.cyan, glowStrength: rich ? 1 : 0.6 });
          if (t < landT) podium(c, g, POD[1].x, p1, POD[1].w, POD[1].h, 1, 0.4);
          poof(c, R.x, standY - 0.3 * R.R, 2.1 * R.R, t, w.rock);
          poof(c, R.x, standY - 0.3 * R.R, 2.1 * R.R, t, this.cuts[16]!);
        }
        lift(() => {
          podium(c, g, POD[2].x, pt(2), POD[2].w, POD[2].h, 2, (t >= this.cuts[13]! ? 0.7 : 0.2) * (1 - sink));
          podium(c, g, POD[3].x, pt(3), POD[3].w, POD[3].h, 3, 0.7 * (1 - sink));
        });
        if (ci >= 2) studioFront(c, g, t, { crowd: 1, mood: rich ? 'cheer' : 'calm' });
      });
      c.save(); c.globalAlpha *= 1 - 0.85 * sink; confetti(c, t, w.richest, 140, 9); c.restore();
      if (ci === 0) {
        slam(c, 'THE RICH LIST', W * 0.36, 150, 130, t, t0 + 0.05, { col: HEX.gold, shadow: HEX.ink, rot: -0.03, maxW: W * 0.6 });
        richCaption(c, W * 0.72, H * 0.6, t, t0 + 0.3, '#3', 'A YACHT', '£38,000,000');
      }
      if (ci === 1) richCaption(c, W * 0.3, 210, t, t0 + 0.1, '#2', 'A GOLD BAR', '£790,000 · KEPT IN A VAULT, UNSEEN');
      if (rich && ci === 2) slam(c, 'RICHEST ROCK', W / 2, 112, 150, t, w.richest, { col: HEX.gold, shadow: HEX.ink, rot: -0.04 });
      liveBug(c, g, t, 'LIVE');
      if (ci === 1) camTag(c, 'CAM 3', t, t0);
      post = mergePost(post, hitShake(t, [w.richest], 6, 0.35), caKick(t, [w.richest], 5, 0.25), punch(t, [w.richest, w.rock], 0.03));
    }

    for (const fl of flips) staticFlip(c, t, fl - 0.08, 0.16);
    this.bar.draw(c, t, { g });
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    return mergePost(post, { zoom: 1 + 0.006 * f.a.kick });
  }
}

/** The studio screen during the Rich List: its title card in gold. */
function richScreen(c: CanvasRenderingContext2D, g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number, rich: boolean) {
  const bg = c.createLinearGradient(x, y, x, y + h); bg.addColorStop(0, '#3a2408'); bg.addColorStop(1, '#120a02');
  c.fillStyle = bg; c.fillRect(x, y, w, h);
  // a crown over #1, and who it is
  const cx = x + w / 2, cy = y + h * 0.36;
  c.fillStyle = HEX.gold;
  c.beginPath(); c.moveTo(cx - 70, cy + 30); c.lineTo(cx - 80, cy - 30); c.lineTo(cx - 40, cy); c.lineTo(cx, cy - 46); c.lineTo(cx + 40, cy); c.lineTo(cx + 80, cy - 30); c.lineTo(cx + 70, cy + 30); c.closePath(); c.fill();
  for (const [dx, dy] of [[-80, -30], [0, -46], [80, -30]] as const) { c.beginPath(); c.arc(cx + dx, cy + dy, 9, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = HEX.pink; c.beginPath(); c.arc(cx, cy + 10, 10, 0, Math.PI * 2); c.fill();
  c.font = font(FAM.hook(), 44); c.textAlign = 'center'; c.textBaseline = 'middle';
  const who = rich ? '#1 RAI' : '#1 ???';
  c.fillStyle = HEX.ink; c.fillText(who, cx + 3, y + h * 0.74 + 3);
  c.fillStyle = rich ? HEX.gold : HEX.bone; c.fillText(who, cx, y + h * 0.74);
  g.fillStyle = rgbaHex(HEX.gold, 0.12 + 0.05 * Math.sin(t * 4)); g.fillRect(x, y, w, h);
}
