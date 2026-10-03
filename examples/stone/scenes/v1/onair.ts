// v1 "WHAT'S IT WORTH?", ONAIR (0–12.95; TREATMENT-v1.md): the film's first frames. The intro is spoken over the
// band's first bars, so it is closed captions, and the picture is the crab camera's viewfinder with the lens cap on.
//   0–6.58   the viewfinder: black, a ring of light leaking round the cap (the film's first frame), REC, the song's
//            own timecode, LENS CAP blinking, the autofocus hunting for a subject it cannot find. "Hi. You can't see
//            me." On "see" a claw taps the lens from outside (TINK, the cap jolts, the autofocus jumps to the tap).
//            "That's kind of the whole point." The claw pries the cap; on "point" it is yanked off: a white flash.
//   6.58     the studio, dark: Rai centre stage in one pink spot, mic to her chin, smug; the sign dark, the curtain
//            closed, the scoreboard dark at stage left.
//   6.95     CAM 1 crash-zooms in on the band's first downbeat: she winks.
//   7.81     CAM 3, low: the sign lights bulb by bulb, WHAT'S IT WORTH?, the anglerfish lamps waking; she looks up.
//   8.67     the wide: ON AIR, house lights up, the spots cross on her: joy, arms up, hopping. LIVE. Her name strap.
//   9.52     CAM 2 on the floor manager (the pole and rope racked in the wings behind him): STAND BY, then APPLAUSE.
//  10.38     the audience erupts in bubbles; a spot sweeps the seats and lingers a breath on C7's lunchbox.
//  11.24     the crane swoops from over the audience's heads down to the stage.
//  12.09     the wide: a chibi bow (poof), sparkles; back to full size, she turns to the screen for "Previously…".
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../../engine/scene';
import { Layer2D, W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { clamp, ease } from '../../engine/util';
import type { Line } from '../../engine/lyrics';
import { drawRai } from '../_rai';
import { poof, focusLines } from '../_manga';
import { mergePost, punch, hitShake, caKick } from '../_post';
import { SET, studio, studioFront, audience, octopus, captions, liveBug, camTag, micProp, seatPos, type StudioOpts } from './_studio';
import { cam2, frameOn, camMix, beatFrom, wordOf, shotAt, crash, nameStrap, applause, sfx, unglowCaption, trapdoor, standSign } from './onair-kit';
import { lensCap, viewfinder, afHunt, passers, LENS } from './onair-cap';
import { showSpots, topSpot, screenOff, raiAt } from './onair-show';

export default class OnAir extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  l0!: Line;
  l1!: Line;
  see = 0; tap = 0; pry = 0; point = 0;
  b: number[] = [];
  cuts: number[] = [];

  override init() {
    const { lyrics, audio: au } = this.ctx;
    this.l0 = lyrics.get("You can't see me");
    this.l1 = lyrics.get('whole point');
    this.see = wordOf(this.l0, /see/).start;
    this.tap = this.see;
    this.pry = this.l1.words[0]!.start;
    this.point = wordOf(this.l1, /point/).start;
    // the band's vamp after "point": the beats from the one after it (6.95, a downbeat)
    this.b = Array.from({ length: 16 }, (_, k) => beatFrom(au, this.point, k));
    this.cuts = [0, this.point, this.b[1]!, this.b[3]!, this.b[5]!, this.b[7]!, this.b[9]!, this.b[11]!, this.b[13]!];
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t;
    this.L.clear(HEX.ink); this.G.clear();
    const { i: shot, t0 } = shotAt(this.cuts, t);
    const b = this.b;
    let post: PostOverrides = { bloom: 0.75 };
    const R = raiAt(150);

    // the set's state through the opening: dark until ON AIR (b5), then the show
    const onAt = b[5]!, onU = clamp((t - onAt) / 0.18);
    const signLit = clamp((t - b[3]!) / (b[5]! - b[3]! - 0.12));
    const set = (o: StudioOpts = {}): StudioOpts => ({
      curtain: 0, ring: 0, sign: signLit, onAir: t >= onAt, house: 0.1 + 0.62 * onU,
      spots: t >= onAt ? showSpots(t) : [], score: null,
      screen: t >= onAt ? null : screenOff,
      cue: t >= b[8]! ? 'APPLAUSE' : null, cueT0: b[8]!,
      ...o,
    });
    const rai = (o: Partial<Parameters<typeof drawRai>[4]> = {}, x = R.x, y = R.y, r = R.R) => {
      trapdoor(c, R.x, SET.floor - 4, 250, 0, t);   // planted: archive drops her through it
      standSign(c, R.x - 250, SET.floor + 6, 0.8, t);
      return drawRai(c, x, y, r, { t, face: 'smile', glow: HEX.pink, glowStrength: 0.7, heart: 0.35 + 0.4 * f.a.vocal, prop: { side: 1, draw: micProp }, ...o });
    };

    if (shot === 0) {
      // ---- the viewfinder, the cap on
      const tapAge = t - this.tap, jolt = tapAge > 0 && tapAge < 0.5 ? Math.exp(-tapAge * 9) * Math.sin(tapAge * 40) : 0;
      const pry = clamp((t - this.pry) / (this.point - this.pry));
      const pu = ease.inCubic(pry);
      lensCap(c, g, t, {
        dx: -14 * jolt - 58 * pu + 3 * Math.sin(t * 1.3), dy: -10 * jolt - 44 * pu + 2 * Math.sin(t * 1.7), rot: 0.06 * pu,
        claw: pry > 0 ? 0.3 + 0.7 * pu : 0, light: 0.75 + 0.35 * f.a.kick + 0.4 * clamp(1 - tapAge / 0.3) * (tapAge > 0 ? 1 : 0) + 0.5 * pu,
        flare: tapAge > 0 ? clamp(1 - tapAge / 0.35) : 0, shade: passers(t, this.tap),
      });
      // the autofocus hunts for a subject; on the tap it jumps there; on "That's kind of" it locks on the claw
      const tapPt = { x: LENS.x + Math.cos(0.75) * (LENS.r - 30), y: LENS.y + Math.sin(0.75) * (LENS.r - 30) };
      let af = afHunt(t), lock = 0, label = 'AF  SEARCHING';
      if (t >= this.tap && t < this.pry) { const u = ease.outCubic(clamp((t - this.tap) / 0.12)); const h = afHunt(this.tap); af = { x: h.x + (tapPt.x - h.x) * u, y: h.y + (tapPt.y - h.y) * u }; label = 'AF  ?'; }
      if (t >= this.pry) { af = tapPt; lock = 1; label = 'AF  LOCK'; }
      viewfinder(c, g, t, { warn: true, lvl: [0.25 + 0.7 * f.a.rms + 0.2 * f.a.kick, 0.2 + 0.7 * f.a.rms + 0.25 * f.a.snare], af: { ...af, lock, label } });
      sfx(c, 'TINK!', tapPt.x + 120, tapPt.y - 110, 64, t, this.tap, this.tap + 0.55, { col: HEX.bone, rot: -0.18 });
      captions(c, this.l0, t);
      captions(c, this.l1, t);
      post = mergePost({ bloom: 0.95, vignette: 0.45, grain: 0.07 }, hitShake(t, [this.tap], 3, 0.22));
    } else if (shot === 1) {
      // ---- the reveal: the dark studio, one pink spot, Rai smug with the mic at her chin
      const yank = t - this.point;
      const k = camMix({ zoom: 1.0 }, { zoom: 1.035 }, clamp((t - t0) / (b[1]! - t0)));
      cam2([c, g], k, () => {
        studio(c, g, t, set());
        topSpot(c, g, R.x, HEX.pink, 1.1);
        rai({ face: 'smug', arms: ['hip', 'chin'], armsFrom: ['down', 'chin'], armsU: clamp(yank / 0.2), marks: ['shine'], markT0: this.point + 0.12, tilt: 0.06 });
        studioFront(c, g, t, { crowd: 0.9, mood: 'freeze' });
      });
      // the cap flying off (the first two frames, under the flash)
      if (yank < 0.06) {
        const u = yank / 0.06;
        c.save(); c.globalAlpha = 1 - u; c.translate(LENS.x - 58 - 1500 * u * u, LENS.y - 44 - 900 * u * u); c.rotate(0.04 + 2 * u);
        c.fillStyle = '#060509'; c.beginPath(); c.arc(0, 0, LENS.r - 7, 0, Math.PI * 2); c.fill(); c.restore();
      }
      captions(c, this.l1, t);
      post = mergePost(post, { flash: yank < 0.034 ? 1.3 : 0 }, hitShake(t, [this.point], 5, 0.3), caKick(t, [this.point], 5, 0.2));
    } else if (shot === 2) {
      // ---- CAM 1 crash zoom: the wink
      const z = crash(t, t0, 0.11);
      const k = camMix({ zoom: 1.035 }, frameOn(R.x + 10, R.y - 1.2 * R.R + 40, 2.55), z);
      cam2([c, g], k, () => {
        studio(c, g, t, set());
        topSpot(c, g, R.x, HEX.pink, 1.1);
        if (z > 0.5) focusLines(c, R.x, R.y - 1.2 * R.R, 150, 'rgba(255,190,220,0.35)', t, { n: 70 });
        rai({ face: t - t0 < 0.12 ? 'smug' : 'wink', arms: ['hip', 'chin'], marks: ['shine', 'sparkle'], markT0: t0 + 0.12, tilt: 0.06 + 0.04 * clamp((t - t0) / 0.3), blush: 0.4 });
      });
      captions(c, this.l1, t);
      camTag(c, 'CAM 1', t, t0);
      post = mergePost(post, punch(t, [t0], 0.03, 0.3));
    } else if (shot === 3) {
      // ---- CAM 3, low: the sign lights bulb by bulb, the lamps wake
      const u = clamp((t - t0) / (b[5]! - t0));
      const lampsOn = [0, 1, 2, 3].filter((i) => signLit > [0.05, 0.3, 0.6, 0.85][i]!);
      const k = frameOn(W / 2 + 30 * (u - 0.5), H * 0.22 - 20 * u, 1.5 + 0.08 * u, -0.025);
      cam2([c, g], k, () => {
        studio(c, g, t, set({ house: 0.12 + 0.18 * signLit, spots: lampsOn.map((i) => ({ x: W / 2 + (i - 1.5) * 120, col: [HEX.pink, HEX.yellow, HEX.yellow, HEX.cyan][i]!, a: 0.6 })) }));
        topSpot(c, g, R.x, HEX.pink, 1);
        rai({ face: 'wow', arms: ['down', 'chin'], look: 0, tilt: -0.08, marks: signLit > 0.95 ? ['!'] : [], markT0: b[5]! - 0.15 });
      });
      camTag(c, 'CAM 3', t, t0);
    } else if (shot === 4) {
      // ---- the wide: ON AIR, the house lights up, the spots cross: joy
      const hop = Math.abs(Math.sin((t - t0) * Math.PI * (140 / 60))) * 0.22;
      cam2([c, g], { zoom: 1 }, () => {
        studio(c, g, t, set());
        rai({ face: 'joy', arms: ['up', 'up'], armsFrom: ['down', 'chin'], armsU: clamp((t - t0) / 0.18), hop, squash: hop < 0.03 ? -0.22 : 0.08, marks: ['sparkle'], markT0: t0 + 0.05, glow: HEX.gold });
        studioFront(c, g, t, { crowd: 1, mood: 'cheer' });
      });
      liveBug(c, g, t, 'LIVE');
      nameStrap(c, t, t0 + 0.25, b[7]! - 0.3, 'RAI', 'YOUR HOST · 4 TONNES OF LIMESTONE · LAST SEEN: NOT IN LIVING MEMORY');
      post = mergePost(post, punch(t, [t0], 0.025), hitShake(t, [t0], 4, 0.3), caKick(t, [t0], 3, 0.2));
    } else if (shot === 5) {
      // ---- CAM 2 on the floor manager: STAND BY, then APPLAUSE (the pole and rope racked behind him)
      const flip = b[8]!;
      const ox = W * 0.965, oy = SET.floor - 30;
      cam2([c, g], frameOn(W * 0.92, H * 0.6, 1.6, 0.015), () => {
        studio(c, g, t, set());
        octopus(c, g, ox, oy, 1.25, t, { card: t < flip ? 'STAND BY' : 'APPLAUSE', cardT0: t < flip ? t0 - 1 : flip });
        if (t >= flip) sfx(c, 'FLIP!', ox - 210, oy - 260, 46, t, flip, flip + 0.4, { col: HEX.yellow, rot: -0.12 });
      });
      liveBug(c, g, t, 'LIVE');
      camTag(c, 'CAM 2', t, t0);
    } else if (shot === 6) {
      // ---- the audience erupts; a spot sweeps the seats and lingers on C7's lunchbox
      const u = clamp((t - t0) / (b[11]! - t0));
      const c7 = seatPos('C', 7);
      const sx = u < 0.42 ? 220 + (c7.x - 40 - 220) * ease.inOutQuad(u / 0.42) : u < 0.62 ? c7.x - 40 + 80 * ((u - 0.42) / 0.2) : c7.x + 40 + (1750 - c7.x - 40) * ease.inOutQuad((u - 0.62) / 0.38);
      const sy = c7.y - 30 + 18 * Math.sin(u * 7);
      audience(c, g, t, { mood: 'cheer', spot: { x: sx, y: sy, r: 150, a: 0.55 }, dim: 0.42, pan: -40 + 80 * u });
      applause(c, g, t, 1, H + 20, 90, 4);
      liveBug(c, g, t, 'LIVE', { logo: true });
    } else if (shot === 7) {
      // ---- the crane: from over the audience's heads, swooping down to the stage
      const u = ease.inOutCubic(clamp((t - t0) / (b[13]! - t0)));
      const k = camMix({ zoom: 0.86, y: -170 }, { zoom: 1, y: 0 }, u);
      const hop = Math.abs(Math.sin((t - t0) * Math.PI * (140 / 60))) * 0.2;
      cam2([c, g], k, () => {
        studio(c, g, t, set());
        rai({ face: 'joy', arms: ['up', 'wave'], hop, squash: hop < 0.03 ? -0.2 : 0.06, marks: ['sparkle'], markT0: t0, glow: HEX.gold });
      });
      // the heads pass under the crane: big and high at first, settling to the wide's front row
      c.save(); g.save();
      const s = 1.5 - 0.5 * u, dy = -250 * (1 - u);
      for (const cc of [c, g]) { cc.translate(W / 2, H); cc.scale(s, s); cc.translate(-W / 2, -H + dy / s); }
      studioFront(c, g, t, { crowd: 1, mood: 'cheer' });
      c.restore(); g.restore();
      applause(c, g, t, 1 - u, H + 20, 60, 5);
      liveBug(c, g, t, 'LIVE');
    } else {
      // ---- the wide: a chibi bow, sparkles; back to full size, turning to the screen
      const bowT = t0, upT = t0 + 0.45, sd = t >= bowT && t < upT;
      cam2([c, g], { zoom: 1 }, () => {
        studio(c, g, t, set());
        if (sd) rai({ face: 'joy', sd: true, arms: ['down', 'down'], squash: -0.35 * Math.sin(clamp((t - bowT) / 0.4) * Math.PI), tilt: 0.25 * Math.sin(clamp((t - bowT) / 0.4) * Math.PI), marks: ['sparkle'], markT0: bowT });
        else rai({ face: t < upT + 0.15 ? 'joy' : 'smile', arms: ['hip', 'chin'], armsFrom: ['down', 'down'], armsU: clamp((t - upT) / 0.2), look: clamp((t - upT - 0.2) / 0.2), glow: HEX.gold });
        poof(c, R.x, R.y - 0.3 * R.R, 2.1 * R.R, t, bowT);
        poof(c, R.x, R.y - 0.3 * R.R, 2.1 * R.R, t, upT);
        studioFront(c, g, t, { crowd: 1, mood: 'cheer' });
      });
      liveBug(c, g, t, 'LIVE');
      post = mergePost(post, punch(t, [bowT], 0.02));
    }

    if (t >= this.l0.words[0]!.start - 0.05 && t < this.l1.end + 0.8) unglowCaption(g);
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    return mergePost(post, shot > 0 ? { zoom: 1 + 0.006 * f.a.kick } : {});
  }
}
