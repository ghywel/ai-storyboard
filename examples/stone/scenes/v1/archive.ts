// v1 "WHAT'S IT WORTH?", ARCHIVE (12.95–27.09; lines 2–5, rapped; TREATMENT-v1.md): "Previously…". Rai turns to the
// porthole CRT and the cuts alternate on the beat (every two beats) between the archive, full frame under VHS, and
// the studio, where she presents it and the crew re-enact the worst bits.
//   12.95  the wide (onair's last frame): she points at the screen, PREVIOUSLY…; the camera pushes into the CRT
//   13.81  ARCHIVE: the quarry on Palau at sunset, her disc's outline glowing in the cliff, the crew chipping on the
//          beat (CREW: 12 · SHELL TOOLS: 40 · DAYS: 300 types out)
//   14.66  ARCHIVE, closer: the adzes, chips flying ("cliff on Palau")
//   15.52  ARCHIVE, macro: a shell adze strikes, grit bursts ("with shell and grit")
//   16.38  STUDIO, CAM 3: hand on hip, sassy, thumb at the screen ("a stubborn crew")
//   17.23  ARCHIVE: the crossing as a TV map, the route drawing itself Palau -> Yap, 400 KM slams; Rai in a
//          picture-in-picture, wow
//   18.95  ARCHIVE: open ocean at night, nothing but stars and blue; the raft small under the Milky Way
//   19.80  ARCHIVE, closer: the stone on the raft looking up at the stars
//   20.66  ARCHIVE: dawn on the shore, the stone roped to the raft, a lash a beat ("they lashed me to a raft")
//   21.52  STUDIO: the crab stagehand comes on with a long pole on its shoulders; she clocks it (sweat)
//   22.38  STUDIO: the pole through the hole in her heart ("pole through the hole"); on "heart" OW: a chibi pop, a vein,
//          the floor manager's OOOH card; then, full size, deadpan to camera, the pole out both sides. The dark-humour beat.
//   24.09  ARCHIVE: the storm off the reef, lightning on the downbeat, the raft riding a crest
//   24.95  ARCHIVE: the rope snaps (SNAP!), the stone slides off into the night sea
//   25.80  STUDIO, the wide: she plays it tragic; on "bottom" the trapdoor (DO NOT STAND HERE, planted at 12.95)
//          drops her through; LAUGH; on "sea" she shoots back up out of it, dizzy (twist catches her landing).
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../../engine/scene';
import { Layer2D, W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import { clamp, ease } from '../../engine/util';
import type { Line } from '../../engine/lyrics';
import { drawRai } from '../_rai';
import { poof, focusLines, impactBurst } from '../_manga';
import { FAM, TAU, rgbaHex, slam } from '../_motifs';
import { mergePost, punch, hitShake, caKick } from '../_post';
import { SET, studio, studioFront, octopus, liveBug, camTag, micProp, vhs, type StudioOpts } from './_studio';
import { cam2, frameOn, camMix, wordOf, shotAt, LyricBar, crabHand, trapdoor, standSign, sfx, pole } from './onair-kit';
import { showSpots, raiAt } from './onair-show';
import { quarry, QUARRY, adzeMacro, routeMap, nightSea, lashing, storm, dataLine, raftWithStone } from './archive-reels';
import { poleThrough, POLE_DIR, feed, screenPush, trapShot } from './archive-gags';

export default class Archive extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  lines: Line[] = [];
  bar!: LyricBar;
  cuts: number[] = [];
  bt: (k: number) => number = () => 0;
  w: Record<string, number> = {};

  override init() {
    const { lyrics, audio: au, start, end } = this.ctx;
    this.lines = lyrics.lines.filter((l) => l.words[0]!.start >= start - 0.1 && l.words[0]!.start < end);
    this.bar = new LyricBar(this.lines);
    const b0 = Math.round(au.beatAt(start + 0.02));
    this.bt = (k: number) => au.timeOfBeat(b0 + k);
    this.cuts = [0, 2, 4, 6, 8, 10, 14, 16, 18, 20, 22, 26, 28, 30].map((k) => this.bt(k));
    const [l2, l3, l4, l5] = this.lines;
    this.w = {
      grit: wordOf(l2!, /grit/).start, stubborn: wordOf(l2!, /stubborn/).start,
      km: wordOf(l3!, /kilometres/).start, stars: wordOf(l3!, /stars/).start,
      lashed: wordOf(l4!, /lashed/).start, shouldered: wordOf(l4!, /shouldered/).start, pole: wordOf(l4!, /pole/).start,
      through: wordOf(l4!, /through/).start, hole: wordOf(l4!, /hole/).start, heart: wordOf(l4!, /heart/).start, me: wordOf(l4!, /me/, 1).start,
      storm: wordOf(l5!, /storm/).start, one: wordOf(l5!, /one/).start, night: wordOf(l5!, /night/).start,
      went: wordOf(l5!, /went/).start, bottom: wordOf(l5!, /bottom/).start, sea: wordOf(l5!, /sea/).start,
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
    const signX = R.x - 250;

    const set = (o: StudioOpts = {}): StudioOpts => ({ curtain: 0, ring: 0, sign: 1, onAir: true, house: 0.72, spots: showSpots(t), score: null, cue: null, ...o });
    const rai = (o: Partial<Parameters<typeof drawRai>[4]> = {}, x = R.x, y = R.y, r = R.R) =>
      drawRai(c, x, y, r, { t, face: 'smile', glow: HEX.gold, glowStrength: 0.6, heart: 0.35 + 0.4 * f.a.vocal, prop: { side: 1, draw: micProp }, ...o });
    const fullArchive = (draw: () => void, label = 'ARCHIVE') => { draw(); vhs(c, t, 0, 0, W, H, label); };
    const q = (cc: CanvasRenderingContext2D, gg: CanvasRenderingContext2D) => quarry(cc, gg, t, f.beat, 0.6 + 0.4 * clamp((t - this.cuts[1]!) / 3));

    if (shot === 0) {
      // ---- the wide, then the push into the CRT: Previously…
      const push = ease.inCubic(clamp((t - this.bt(1)) / (this.bt(2) - this.bt(1))));
      const k = camMix({ zoom: 1 }, screenPush(SET.screen), push);
      cam2([c, g], k, () => {
        studio(c, g, t, set({ cue: 'APPLAUSE', cueT0: t0 - 3, screen: lt < 0.3 ? null : feed(t, (cc, gg) => { q(cc, gg); previously(cc, t, t0 + 0.3); }) }));
        trapdoor(c, R.x, SET.floor - 4, 250, 0, t);
        standSign(c, signX, SET.floor + 6, 0.8, t);
        rai({ face: lt < 0.25 ? 'smile' : 'sassy', arms: ['hip', 'point'], armsFrom: ['hip', 'chin'], armsU: clamp((lt - 0.05) / 0.2), look: 1, tilt: -0.05, marks: lt > 0.25 ? ['shine'] : [], markT0: t0 + 0.25 });
        studioFront(c, g, t, { crowd: 1, mood: lt < 0.3 ? 'cheer' : 'calm' });
      });
      if (push < 0.3) liveBug(c, g, t, 'LIVE');
    } else if (shot === 1 || shot === 2) {
      // ---- the quarry: wide, then closer on the adzes
      fullArchive(() => {
        const k = shot === 1 ? camMix({ zoom: 1 }, { zoom: 1.05 }, u) : frameOn(QUARRY.disc.x + 120 + 40 * u, QUARRY.disc.y + 20, 1.9 + 0.08 * u);
        cam2([c, g], k, () => q(c, g));
        if (shot === 1) previously(c, t, t0 - 0.7, true);
        dataLine(c, 'CREW: 12 · SHELL TOOLS: 40 · DAYS: 300', t, this.cuts[1]! + 0.3);
      });
      if (shot === 1) post = mergePost(post, punch(t, [t0], 0.015));
    } else if (shot === 3) {
      // ---- the macro: shell and grit
      fullArchive(() => {
        cam2([c, g], { zoom: 1 + 0.04 * u }, () => adzeMacro(c, g, t, f.beat));
        dataLine(c, 'CREW: 12 · SHELL TOOLS: 40 · DAYS: 300', t, this.cuts[1]! - 10);
      });
      sfx(c, 'GRIT!', W * 0.74, H * 0.2, 90, t, w.grit, w.grit + 0.45, { col: HEX.bone, rot: 0.08 });
      post = mergePost(post, hitShake(t, [w.grit], 4, 0.25));
    } else if (shot === 4) {
      // ---- STUDIO, CAM 3: hand on hip, sassy, thumb at the screen ("a stubborn crew")
      cam2([c, g], frameOn(1250 + 20 * u, 440, 1.45), () => {
        studio(c, g, t, set({ screen: feed(t, (cc, gg) => cam2([cc, gg], frameOn(QUARRY.disc.x + 120, QUARRY.disc.y + 20, 1.9), () => q(cc, gg))) }));
        trapdoor(c, R.x, SET.floor - 4, 250, 0, t);
        standSign(c, signX, SET.floor + 6, 0.8, t);
        rai({ face: 'sassy', arms: ['hip', 'point'], look: 1, tilt: -0.1 + 0.03 * Math.sin(lt * 9), marks: ['shine'], markT0: w.stubborn + 0.05, squash: lt < 0.1 ? -0.15 : 0 });
      });
      liveBug(c, g, t, 'LIVE');
      camTag(c, 'CAM 3', t, t0);
    } else if (shot === 5) {
      // ---- the crossing: the TV map, 400 KM, Rai in a picture-in-picture (wow)
      const ru = ease.inOutCubic(clamp((t - t0) / (t1 - t0 - 0.15)));
      fullArchive(() => {
        routeMap(c, g, t, ru, f.a.hat);
        const kmT = w.km, roll = clamp((t - kmT) / 0.5);
        if (t >= kmT) slam(c, `${Math.round(400 * ease.outCubic(roll))} KM`, W * 0.6, H * 0.6, 210, t, kmT, { col: HEX.yellow, shadow: HEX.ink, rot: -0.05 });
        pip(c, t, lt);
      });
      post = mergePost(post, punch(t, [w.km], 0.025));
    } else if (shot === 6 || shot === 7) {
      // ---- the open ocean at night: wide, then close on the stone looking up
      fullArchive(() => {
        if (shot === 6) cam2([c, g], { zoom: 1.02 + 0.03 * u }, () => nightSea(c, g, t, { raftX: W * (0.36 + 0.06 * u), raftK: 0.62, tw: f.a.hat, raiFace: 'soft', shoot: w.stars - 0.05 }));
        else cam2([c, g], frameOn(W * 0.43, H * 0.6, 2.5 + 0.15 * u), () => nightSea(c, g, t, { raftX: W * 0.42, raftK: 0.62, tw: f.a.hat, raiFace: t > w.stars + 0.3 ? 'wow' : 'soft' }));
        dataLine(c, 'DISTANCE: 400 km · OPEN SEA · STARS ONLY', t, this.cuts[6]! + 0.2);
      });
    } else if (shot === 8) {
      // ---- dawn on the shore: lashed to the raft, a lash a beat
      const beat = (this.bt(19) - this.bt(18));
      const ropes = 1 + Math.min(3, Math.floor((t - t0) / beat) + 1);
      const tight = (t - t0) % beat < 0.12 ? 1 : 0;
      fullArchive(() => {
        cam2([c, g], frameOn(W / 2, H * 0.56, 1.05 + 0.05 * u), () => lashing(c, g, t, ropes, ropes >= 4 ? 'shock' : 'deadpan', tight, ropes >= 4 ? ['!?', 'sweat'] : ['sweat'], t0 + 3 * beat));
        dataLine(c, 'ROPE: 60 m · KNOTS: 14 · CREW: 12', t, t0 + 0.1);
      });
    } else if (shot === 9) {
      // ---- STUDIO: the crab stagehand comes on with the pole on its shoulders; she clocks it
      const cx = 2150 - 420 * ease.outCubic(u), cy = SET.floor + 20;
      cam2([c, g], frameOn(1120, 520, 1.3), () => {
        studio(c, g, t, set({ screen: feed(t, (cc, gg) => lashing(cc, gg, t, 4, 'deadpan', 0, [], 0)) }));
        trapdoor(c, R.x, SET.floor - 4, 250, 0, t);
        standSign(c, signX, SET.floor + 6, 0.8, t);
        const clocked = t > w.shouldered;
        rai({ face: clocked ? 'shock' : 'smile', arms: clocked ? ['cheek', 'chin'] : ['hip', 'chin'], look: 1, marks: clocked ? ['sweat', '!?'] : [], markT0: w.shouldered + 0.05, shake: clocked ? 0.3 : 0 });
        pole(c, cx - 520, cy - 210, cx + 170, cy - 196, 32, 36);
        crabHand(c, cx, cy, 1.05, t, { pose: 'carry', walk: t, look: -1 });
      });
      liveBug(c, g, t, 'LIVE');
      camTag(c, 'CAM 2', t, t0);
    } else if (shot === 10) {
      // ---- STUDIO: the pole through the hole in her heart; OW (chibi); deadpan, the pole out both sides
      const hole = { x: R.x, y: R.y + 0.12 * R.R };
      const sTip = -90 + 540 * ease.inOutCubic(clamp((t - w.pole) / (w.hole + 0.12 - w.pole)));
      const len = 700;
      const ow = t >= w.heart && t < w.me - 0.02, after = t >= w.me - 0.02;
      const zk = after ? crash(t, w.me - 0.02, 0.1) : 0;
      cam2([c, g], camMix(frameOn(1010, 560, 1.4), frameOn(1000, 520, 1.62), zk), () => {
        studio(c, g, t, set({ screen: feed(t, (cc, gg) => lashing(cc, gg, t, 4, 'shock', 0, [], 0)) }));
        standSign(c, signX, SET.floor + 6, 0.8, t);
        octopus(c, g, 395, SET.floor - 34, 0.85, t, { card: t >= w.heart ? 'OOOH' : 'STAND BY', cardT0: t >= w.heart ? w.heart + 0.05 : t0 - 1 });
        poleThrough(c, hole, sTip, len, 'back');
        if (ow) {
          focusLines(c, R.x, hole.y - 120, 210, 'rgba(255,90,90,0.55)', t, { n: 80 });
          impactBurst(c, R.x + 260, hole.y - 330, 120, '#ffd23f', HEX.ink, t, 12);
          drawRai(c, R.x, hole.y - 0.6 * R.R, R.R, { t, face: 'cry', sd: true, arms: ['up', 'up'], marks: ['vein'], markT0: w.heart, shake: 1, glow: HEX.pink });
        } else rai({
          face: after ? 'deadpan' : t >= w.through ? 'shock' : 'wow', arms: after ? ['down', 'chin'] : ['cheek', 'chin'], armsFrom: ['cheek', 'chin'], armsU: 1,
          marks: after ? ['sweat'] : t >= w.through ? ['!?'] : [], markT0: after ? w.me : w.through, shake: t >= w.through && !after ? 0.5 : 0, noBlink: after,
        });
        const grip = poleThrough(c, hole, sTip, len, 'front');
        crabHand(c, grip.x + 190, grip.y + 78, 1.0, t, { pose: 'push', walk: t * 0.6, look: -1, sweat: after });
        poof(c, R.x, hole.y - 1.15 * R.R, 1.65 * R.R, t, w.heart);   // round the chibi's head, clear of the face
        poof(c, R.x, hole.y - 80, 2.2 * R.R, t, w.me - 0.02);
        if (ow) sfx(c, 'OW!', R.x + 262, hole.y - 332, 120, t, w.heart, w.me, { col: '#ff3b3b', rot: -0.12 });
      });
      liveBug(c, g, t, 'LIVE');
      camTag(c, 'CAM 2', t, t0);
      post = mergePost(post, hitShake(t, [w.heart], 6, 0.3), caKick(t, [w.heart], 5, 0.25), punch(t, [w.heart, w.me], 0.03));
    } else if (shot === 11 || shot === 12) {
      // ---- the storm off the reef; then the rope snaps and the stone slides into the sea
      const snapT = w.one, slide = shot === 12 ? ease.inQuad(clamp((t - w.night) / (this.bt(30) - w.night - 0.05))) : 0;
      const bolts = [this.bt(26), this.bt(27), this.bt(28), this.bt(29) + 0.2];
      const bolt = bolts.filter((b) => b <= t).pop() ?? -10;
      const tilt = shot === 11 ? 0.12 * Math.sin(t * 2.4) : 0.1 + 0.3 * ease.inOutQuad(clamp((t - t0) / 0.5));
      fullArchive(() => {
        const k = shot === 11 ? { zoom: 1.04 + 0.03 * u } : frameOn(W * 0.47, H * 0.56, 1.45 + 0.1 * u);
        cam2([c, g], k, () => storm(c, g, t, { bolt, tilt, slide, face: shot === 12 && t > snapT ? 'shock' : 'shock', marks: shot === 12 ? ['!?', 'sweat'] : ['!?'], markT0: shot === 12 ? snapT : t0 + 0.05, snapped: shot === 12 && t > snapT }));
        dataLine(c, 'WIND: FORCE 9 · SWELL: 6 m · REEF: 1 km', t, this.cuts[11]! + 0.1);
      });
      if (shot === 12) sfx(c, 'SNAP!', W * 0.66, H * 0.32, 110, t, snapT, snapT + 0.5, { col: HEX.bone, rot: 0.1 });
      post = mergePost(post, shot === 11 ? mergePost(hitShake(t, [t0], 6, 0.35), caKick(t, [t0], 4, 0.2), { flash: t - t0 < 0.05 ? 0.45 : 0 }) : punch(t, [snapT], 0.02));
    } else {
      // ---- STUDIO, the wide: the tragic beat, the trapdoor, LAUGH, and back up on "sea" (shared with twist)
      const tOpen = w.bottom, tUp = w.sea;
      trapShot(c, g, t, { t0, went: w.went, tOpen, tUp }, f.a.vocal);
      post = mergePost(post, hitShake(t, [tOpen + 0.38], 3, 0.25), punch(t, [tUp], 0.025));
    }

    this.bar.draw(c, t, { g });
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    return mergePost(post, { zoom: 1 + 0.006 * f.a.kick });
  }
}

/** "Previously…" in Cormorant over the footage (on the CRT, then full frame for a beat). */
function previously(c: CanvasRenderingContext2D, t: number, t0: number, fade = false) {
  if (t < t0) return;
  const a = clamp((t - t0) / 0.25) * (fade ? 1 - clamp((t - t0 - 1.1) / 0.3) : 1);
  if (a <= 0) return;
  c.save(); c.globalAlpha *= a;
  c.font = font(FAM.serifB(), 150); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = 'rgba(10,6,20,0.55)'; c.fillText('Previously…', W / 2 + 6, H * 0.3 + 6);
  c.fillStyle = '#fff4dc'; c.fillText('Previously…', W / 2, H * 0.3);
  c.restore();
}

/** The picture-in-picture of the studio: Rai close, wow, hands to her cheeks. */
function pip(c: CanvasRenderingContext2D, t: number, lt: number) {
  const x = 70, y = 150, w = 430, h = 270, inU = ease.outBack(clamp(lt / 0.25));
  c.save();
  c.translate(x + w / 2, y + h / 2); c.scale(inU, inU); c.translate(-(x + w / 2), -(y + h / 2));
  c.fillStyle = '#b98a3e'; c.beginPath(); c.roundRect(x - 10, y - 10, w + 20, h + 20, 18); c.fill();
  c.save(); c.beginPath(); c.roundRect(x, y, w, h, 12); c.clip();
  const bg = c.createRadialGradient(x + w / 2, y + h * 0.4, 20, x + w / 2, y + h / 2, w * 0.7);
  bg.addColorStop(0, '#4a2a5a'); bg.addColorStop(1, '#120a20'); c.fillStyle = bg; c.fillRect(x, y, w, h);
  for (let i = 0; i < 9; i++) { c.fillStyle = i % 2 ? '#0f3a26' : '#14482e'; c.fillRect(x + i * 52 - 10, y, 30, h); }
  c.fillStyle = 'rgba(10,6,20,0.4)'; c.fillRect(x, y, w, h);
  drawRai(c, x + w / 2, y + h * 1.02, 120, { t, face: 'wow', arms: ['cheek', 'cheek'], glow: HEX.gold, glowStrength: 0.6, marks: ['sparkle'], markT0: 0, blush: 0.5 });
  c.restore();
  c.font = font(FAM.monoB(), 20); c.fillStyle = '#ff3b3b'; c.beginPath(); c.arc(x + 22, y + 22, 7, 0, TAU); c.fill();
  c.fillStyle = HEX.bone; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('LIVE · STUDIO', x + 36, y + 23);
  c.restore();
}

function crash(t: number, t0: number, dur: number) { return t < t0 ? 0 : ease.outCubic(clamp((t - t0) / dur)); }
void POLE_DIR; void raftWithStone; void rgbaHex;
