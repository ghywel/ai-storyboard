// v2 WEDDING (188.93-207.81), the outro, intimate; then the night sea and the credits (TREATMENT-v2.md).
//   arrive   "On Yap they still bring the stones to weddings.": a match cut on the ring (dawn's sun in her heart becomes a
//            wreath of flowers round it, years later, in daylight) pulling back to a bright morning under the palms:
//            the girl grown, the bride, a flower in her hair; her groom; Rai carried in on the pole by the two old men
//            who were divers that night; her mother, old, with her stick in the front row; the old mask and the slate
//            hung on the arch's post.
//   oof      "Not because they're heavy.": they set the pole down; Rai lands in the flowers, a soft thump of sand, a puff
//            of dust that says "oof"; the old men rub their backs; Rai cheeky.
//   touch    "Because": the bride lays her hand on the stone (on her cheek, as she did on the seabed); Rai winks, at her
//            only.
//   mum      "everybody remembers.": the mother dabs a tear; the village behind her, hands on their hearts.
//   night    the final stab: the night sea under the stars, the island's lights low on the horizon; far below the
//            surface a soft pink heart-glow. In the silence the credits over the stars; the glow becomes a ring and
//            fades to black.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../../engine/scene';
import { Layer2D, W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import type { Line, Word } from '../../engine/lyrics';
import { clamp, ease, lerp } from '../../engine/util';
import { drawRai, h01, type ArmPose } from '../_rai';
import { FAM, TAU, rgbaHex } from '../_motifs';
import { palmTree, hut, stoneBank } from '../_world';
import { puff } from '../_manga';
import { mergePost, punch } from '../_post';
import { girl, mother, bubbleLyric, currentLine, withCam2, type GirlPose } from './_diver';
import { folk, pole, flower, lei, shawlTrim, palmsOnFace, fadeGlowBand, homeHut, type P } from './dawn-world';
import { morning, dapple, arch, flowerBed, heartWreath, oldDiver, nightSea, deepHeart, credits, spokenBand, type Credit } from './wedding-world';

type C2 = CanvasRenderingContext2D;
const PI = Math.PI;
const SIL = '#3a2a4a';                      // silhouettes in the day: a warm violet, lighter than the dawn's
const FAR = '#6a5a7e';                      // the guests further back, in the morning haze
const RIM = 'rgba(255,250,235,0.85)';       // the morning's light along their edges

// the wide set (world = screen at zoom 1)
const SET = {
  hz: H * 0.47, shore: H * 0.6, ground: H * 0.83,
  arch: { x: W * 0.4, half: 170, top: H * 0.17 },
  bride: { x: W * 0.37, h: 330 }, groom: { x: W * 0.45, h: 360 },
  rai: { x: W * 0.6, R: 100 }, divers: 225, mum: { x: W * 0.2, y: H * 0.95, h: 360 },
};
const RAI_DOWN = SET.ground - 1.07 * SET.rai.R;   // her centre when she stands in the flowers
const LIFT = 70;                                   // how high the old men carry her

/** The bride reaching to lay her hand on the stone (GirlPose, grown). */
const LAUGH: GirlPose = { rot: -0.04, hip: [-0.06, 0.06], knee: [0, 0], sh: [-0.3, 2.6], el: [0.2, 1.9], head: -0.15 };

export default class Wedding extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  lines: Line[] = [];
  cuts: [string, number][] = [];
  w: Record<string, Word> = {};
  stab = 0;
  rows: Credit[] = [];

  override init() {
    const { lyrics, audio: au, start, end } = this.ctx;
    this.lines = lyrics.lines.filter((l) => l.words[0]!.start >= start - 0.1 && l.words[0]!.start < end);
    const L = this.lines;
    const w = (li: number, re: RegExp, nth = 0) => L[li]?.words.filter((x) => re.test(x.w.toLowerCase()))[nth] ?? L[Math.min(li, L.length - 1)]!.words[0]!;
    const bf = (s: number) => au.timeOfBeat(Math.floor(au.beatAt(s + 0.02)));
    this.w = {
      on: L[0]!.words[0]!, yap: w(0, /yap/), weddings: w(0, /wedding/),
      not: L[1]!.words[0]!, heavy: w(1, /heavy/),
      because: L[2]!.words[0]!, everybody: w(2, /everybody/), remembers: w(2, /remember/),
    };
    const last = L[L.length - 1]!, lastWord = last.words[last.words.length - 1]!;
    // the final stab: the first beat at or after the last word's end (the band's last hit, ~199.6)
    this.stab = au.timeOfBeat(Math.ceil(au.beatAt(lastWord.end)));
    this.cuts = [['arrive', start], ['oof', bf(this.ws('not'))], ['touch', bf(this.ws('because'))], ['mum', bf(this.ws('everybody'))], ['night', this.stab]];
    // the credits, in the silence after the music (TREATMENT-v2.md, exactly)
    const quiet = this.stab + 1.15;
    this.rows = [
      { label: 'Words:', text: 'Claude, from Knight Commander Gareth’s brief', t0: quiet },
      { label: 'Voice and music:', text: 'Suno', t0: quiet + 1.1 },
      { label: 'Film:', text: 'drawn in code; engine from pdoom-video by Giacomo Magnanini (MIT)', t0: quiet + 2.1 },
    ];
  }

  ws(id: string) { return this.w[id]!.start; }
  cut(id: string) { return this.cuts.find((c) => c[0] === id)![1]; }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t;
    this.L.clear('#000000'); this.G.clear();
    let i = 0;
    for (let j = 0; j < this.cuts.length; j++) if (t >= this.cuts[j]![1]) i = j;
    const [id, t0] = this.cuts[i]!, lt = t - t0;
    let post: PostOverrides = { bloom: 0.55, vignette: 0.28 };
    if (id === 'night') post = mergePost(post, this.night(c, g, t, lt));
    else {
      post = mergePost(post, this.day(c, g, t, lt, id));
      // the spoken outro, Cormorant, on a soft band so it reads on the bright sand
      const line = currentLine(this.lines, t, 0.1);
      if (line) {
        spokenBand(c, clamp((t - line.words[0]!.start + 0.2) / 0.3));
        c.save(); c.shadowColor = 'rgba(20,10,30,0.7)'; c.shadowBlur = 14;
        bubbleLyric(c, line, t, { spoken: true });
        c.restore();
      }
      fadeGlowBand(g);
    }
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    return post;
  }

  // ---------------------------------------------------------------- the morning, years later

  /** Where the pole and Rai are at t: carried in, lowered on "Not because", landing on "heavy". */
  carry(t: number) {
    const lower0 = this.ws('not'), land = this.ws('heavy');
    const lowerU = clamp((t - lower0) / (land - lower0));
    const drop = t < land ? ease.inOutQuad(lowerU) * 0.75 : 1;        // they lower her most of the way, then she drops
    const raiY = RAI_DOWN - LIFT * (1 - drop);
    const since = t - land;
    const squash = since >= 0 && since < 0.5 ? -0.45 * Math.exp(-since * 9) * Math.cos(since * 30) : 0;
    const pull = clamp((t - land - 0.55) / 0.9);                      // diver1 slides the pole out of her heart
    return { raiY, squash, since, pull };
  }

  day(c: C2, g: C2, t: number, lt: number, id: string): PostOverrides {
    const R = SET.rai.R, rx = SET.rai.x, cr = this.carry(t);
    const holeW: P = { x: rx, y: cr.raiY + 0.12 * R };
    // the camera: the match on the ring, pulling back to the wide; then closer shots of the same set
    let cam = { x: 0, y: 0, zoom: 1 };
    if (id === 'arrive') {
      const z0 = 66 / (0.27 * R), u = ease.inOutCubic(clamp((t - this.ctx.start - 0.35) / 2.6));
      const z = z0 * Math.pow(1 / z0, u);
      const fx = lerp(holeW.x, W / 2 + 40, u), fy = lerp(holeW.y, H / 2 + 20, u);   // the point held at the frame's centre-ish
      const sy = lerp(535, H / 2, u);
      cam = { x: fx - W / 2, y: fy - H / 2 + (H / 2 - sy) / z, zoom: z * (1 + 0.02 * clamp(lt - 3)) };
    } else if (id === 'oof') {
      cam = { x: rx - W / 2 - 40, y: SET.ground - 180 - H / 2, zoom: 1.75 + 0.03 * lt };
    } else if (id === 'touch') {
      cam = { x: rx - 80 - W / 2, y: RAI_DOWN - 120 - H / 2, zoom: 2.3 + 0.05 * lt };
    } else if (id === 'mum') {
      cam = { x: SET.mum.x + 60 - W / 2, y: SET.mum.y - 0.7 * SET.mum.h - H / 2, zoom: 2.5 + 0.06 * lt };
    }
    withCam2(c, g, cam, () => this.set(c, g, t, id, cr));
    if (id === 'oof') return mergePost(punch(t, [this.ws('heavy')], 0.012, 0.3));
    return {};
  }

  /** The wedding on the beach (one set, drawn the same for every angle). */
  set(c: C2, g: C2, t: number, id: string, cr: ReturnType<Wedding['carry']>) {
    const { hz, shore, ground } = SET, R = SET.rai.R, rx = SET.rai.x;
    morning(c, t, { hz, shore });
    // the far shore: the island's stone bank, the family's hut up the beach, a child snorkelling in the shallows
    stoneBank(c, W * 0.1, shore + 22, 0.42, 0.1, 3);
    homeHut(c, g, W * 0.86, shore + 34, 150, { dark: 0.05, lit: 0 });
    hut(c, W * 0.7, shore + 18, 90, false, 0.1);
    const kx = W * 0.66 + 30 * Math.sin(t * 0.4), ky = shore - 18 + 3 * Math.sin(t * 2);
    folk(c, kx, ky, 46, { t, seed: 31, arms: 'wave', col: '#3a2a40', acc: false });
    c.fillStyle = HEX.coral; c.beginPath(); c.roundRect(kx - 3, ky - 46 * 0.92, 7, 4, 1.5); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 2; c.beginPath(); c.ellipse(kx, ky - 4, 22, 4, 0, 0, TAU); c.stroke();
    // palms framing the beach
    palmTree(c, W * 0.03, ground + 60, 720, 0.22, t, 1, 0);
    palmTree(c, W * 0.97, ground + 50, 680, -0.25, t, 2, 0);
    palmTree(c, W * 0.8, shore + 50, 360, -0.1, t, 3, 0.05);
    palmTree(c, W * 0.25, shore + 40, 330, 0.12, t, 4, 0.05);
    dapple(c, t, 0, ground - 60, W, 200, 2);
    // the guests: standing in a crescent on the sand behind the couple (no seats), garlands, the village grown older
    const shadow = (x: number, y: number, w: number) => { c.fillStyle = 'rgba(90,80,140,0.18)'; c.beginPath(); c.ellipse(x + w * 0.3, y + 2, w, w * 0.16, 0, 0, TAU); c.fill(); };
    const guest = (x: number, y: number, h: number, i: number, flip: boolean) => {
      shadow(x, y, h * 0.16);
      const nodNow = id === 'mum' ? 0.4 * Math.max(0, Math.sin((t - this.cut('mum') - i * 0.12) * 6)) : 0;
      folk(c, x, y, h, { t, seed: 1500 + i, col: FAR, rim: RIM, rimSide: -1, garland: i % 2 === 0, flip, arms: id === 'mum' && i % 2 ? 'heart' : i % 4 === 1 ? 'clap' : 'down', nod: nodNow });
    };
    for (let i = 0; i < 8; i++) { const back = i % 2 === 0; guest(W * (0.03 + 0.04 * i) + 14 * h01(i, 4), ground - (back ? 62 : 30) + 8 * h01(i, 5), (back ? 225 : 260) + 30 * h01(i, 6), i, false); }
    for (let i = 0; i < 7; i++) { const back = i % 2 === 1; guest(W * (0.77 + 0.036 * i) + 14 * h01(i, 7), ground - (back ? 58 : 26) + 8 * h01(i, 8), (back ? 225 : 260) + 30 * h01(i, 9), 20 + i, true); }
    shadow(SET.bride.x, ground, 50); shadow(SET.groom.x, ground, 56); shadow(SET.mum.x, SET.mum.y, 56);
    // the arch, the mask and the slate on its post
    arch(c, SET.arch.x, ground, SET.arch.half, SET.arch.top, t);
    // the groom and the bride under it
    const groom = folk(c, SET.groom.x, ground, SET.groom.h, { t, seed: 77, col: '#2a1e30', rim: RIM, rimSide: -1, flip: true, garland: true, arms: id === 'oof' && cr.since > 0 ? 'clap' : 'down' });
    void groom;
    const laughing = id === 'oof' && cr.since > 0.05;
    if (id !== 'touch') girl(c, SET.bride.x, ground, SET.bride.h, laughing ? LAUGH : 'stand', { t, grown: true, mask: 'none', pendant: true, col: '#2a1e30', rim: RIM });
    // the flower bed waiting for her
    flowerBed(c, rx, ground, 150, t, cr.since > 0 && cr.since < 0.6 ? Math.sin((cr.since / 0.6) * PI) : 0);
    // the old men who were divers that night, and Rai on the pole between them
    const holeY = cr.raiY + 0.12 * R, pullX = cr.pull * 420;
    const d1x = rx - SET.divers - pullX * 0.5, d2x = rx + SET.divers + 40 * cr.pull;
    const dh = 300, u = dh / 100, root = ground - 74 * u;
    const handDy = clamp((holeY - root) / u, -30, 30);
    const tired = cr.since > 0.1, moan = id === 'oof' && tired, pL = rx - SET.divers - 60 - pullX, pR = rx + SET.divers + 60 - pullX;
    if (id !== 'touch') {
      pole(c, pL, holeY, pR, holeY, 0, 14, 0);
      oldDiver(c, 1, d1x, ground, dh, { t, col: SIL, rim: RIM, rimSide: -1, arms: tired && cr.pull <= 0 ? [{ x: -6, y: 30 }, { x: 4, y: 8 }] : [{ x: -4, y: handDy + 2 }, { x: 14, y: handDy }], emote: moan ? 'sweat' : undefined, emoteT0: this.ws('heavy') + 0.15 });
      oldDiver(c, 2, d2x, ground, dh, { t, col: SIL, rim: RIM, rimSide: -1, flip: true, arms: tired ? [{ x: -12, y: 14 }, { x: -2, y: 20 }] : [{ x: -4, y: handDy + 2 }, { x: 14, y: handDy }], emote: moan ? 'sigh' : undefined, emoteT0: this.ws('heavy') + 0.3, nod: tired ? 0.6 : 0.35 });
    }
    // Rai: garlanded, a hibiscus by her starfish, a wreath round her heart
    const heavy = this.ws('heavy'), because = this.ws('because'), wink = because + 0.45;
    let face: 'smile' | 'joy' | 'cheeky' | 'wink' | 'love' | 'soft' | 'shock' = 'smile';
    if (id === 'arrive') face = t > this.ws('weddings') ? 'joy' : 'smile';
    else if (id === 'oof') face = cr.since < 0 ? 'smile' : cr.since < 0.12 ? 'shock' : 'cheeky';
    else if (id === 'touch') face = t < wink - 0.05 ? 'soft' : t < wink + 0.55 ? 'wink' : 'love';
    else face = 'love';
    const arms: [ArmPose, ArmPose] = id === 'arrive' && t > this.ws('weddings') ? ['down', 'wave'] : id === 'oof' && cr.since > 0.12 ? ['hip', 'hip'] : ['down', 'down'];
    const a = drawRai(c, rx, cr.raiY, R, {
      t, face, arms, squash: cr.squash, glow: '#fff6d0', glowStrength: 0.5, heart: id === 'mum' ? 0.5 : 0, heartColor: HEX.pink,
      marks: id === 'oof' && cr.since > 0.12 ? ['shine'] : id === 'touch' && t > wink ? ['sparkle'] : id === 'mum' ? ['hearts'] : [], markT0: id === 'oof' ? heavy + 0.12 : id === 'touch' ? wink : this.cut('mum'),
      look: id === 'touch' ? -0.8 : 0, noBlink: id === 'touch',
    });
    lei(c, rx, cr.raiY, R, t, 1);
    heartWreath(c, holeW(rx, cr.raiY, R).x, holeW(rx, cr.raiY, R).y, 0.27 * R, t);
    flower(c, rx - 0.38 * R, cr.raiY - 1.78 * R, 0.16 * R, 0.4, HEX.pink);
    // the pole's near end in front of her heart's wreath (it runs through the hole)
    if (id !== 'touch' && pR > rx - 0.27 * R) { c.save(); c.beginPath(); c.arc(rx, holeY, 0.27 * R * 0.95, 0, TAU); c.clip(); pole(c, pL, holeY, pR, holeY, 0, 14, 0); c.restore(); }
    // the thump: a puff of sand that says "oof"
    if (id === 'oof' && cr.since >= 0 && cr.since < 1.1) {
      const u2 = cr.since / 1.1, pa = 1 - u2;
      for (const s of [-1, 1]) { puff(c, rx + s * (70 + u2 * 130), ground - 6 - u2 * 30, 46 + u2 * 56, `rgba(150,120,80,${0.35 * pa})`); puff(c, rx + s * (66 + u2 * 128), ground - 12 - u2 * 30, 42 + u2 * 52, `rgba(255,246,222,${0.95 * pa})`); }
      puff(c, rx, ground - 20 - u2 * 40, 52 + u2 * 44, `rgba(255,246,222,${0.9 * pa})`);
      const k = ease.outBack(clamp(cr.since / 0.18), 2.4);
      c.save(); c.translate(rx + 200, ground - 70 - u2 * 50); c.rotate(-0.12); c.scale(k, k); c.globalAlpha = Math.min(1, pa * 1.6);
      c.font = font(FAM.serifB(), 84); c.textAlign = 'center'; c.textBaseline = 'middle';
      c.lineWidth = 7; c.lineJoin = 'round'; c.strokeStyle = 'rgba(250,240,220,0.95)'; c.strokeText('oof', 0, 0);
      c.fillStyle = '#7a5a3a'; c.fillText('oof', 0, 0);
      c.restore();
    }
    // "Because": the bride beside her, her hand on the stone's cheek; a ring on her finger catches the light
    if (id === 'touch') {
      // she reaches with her far hand (the bouquet stays in the near one) and lays it on the stone's cheek
      const bx = rx - 150, reach = ease.inOutCubic(clamp((t - this.cut('touch') - 0.05) / 0.45)), rot = 0.12 * reach;
      const u = SET.bride.h / 100, sh = { x: bx + Math.sin(rot) * 33 * u, y: ground - 46 * u - 30 * u };
      const cheek = { x: rx - 0.74 * R * 0.8, y: cr.raiY - 1.2 * R + 0.25 * R };
      const ang = Math.atan2(cheek.x - sh.x, cheek.y - sh.y) + rot;
      const an = girl(c, bx, ground, SET.bride.h, { rot, hip: [-0.06, 0.06], knee: [0, 0], sh: [-0.42 + (ang + 0.42) * reach, 0.3], el: [-0.15 + 0.15 * reach, 0.3], head: 0.18 * reach }, { t, grown: true, mask: 'none', pendant: true, col: '#2a1e30', rim: RIM });
      const hand = an.hands[0];
      if (reach > 0.95) { c.strokeStyle = HEX.gold; c.lineWidth = 2.5; c.beginPath(); c.arc(hand.x + 1, hand.y + 3, 3.5, 0, TAU); c.stroke(); c.fillStyle = '#fff6c8'; c.beginPath(); c.arc(hand.x - 1, hand.y + 1, 1.6, 0, TAU); c.fill(); }
      void a;
    }
    // her mother in the front row: old, with her stick; a tear at "everybody", dabbed with her shawl
    const m = SET.mum, mu = m.h / 100, dab = id === 'mum' ? clamp((t - this.ws('everybody') + 0.1) / 0.3) : 0;
    mother(c, m.x, m.y, m.h, 'stand', { t, old: true, col: '#2a1830', rim: RIM, shawl: '#6a3a7a', emote: id === 'mum' ? 'tear' : undefined, emoteT0: this.cut('mum') + 0.1 });
    shawlTrim(c, m.x, m.y, m.h, 'stand', { old: true });
    if (dab > 0) { // her free hand up to her eye, the shawl's corner in it
      const hx = m.x + 10.4 * mu, hy = m.y - 77 * mu, ex = hx + 5 * mu, ey = hy + 1 * mu + 12 * mu * (1 - ease.outCubic(dab));
      c.strokeStyle = '#2a1830'; c.lineWidth = 6 * mu; c.lineCap = 'round';
      c.beginPath(); c.moveTo(m.x + 6 * mu, m.y - 64 * mu); c.quadraticCurveTo(m.x + 16 * mu, m.y - 58 * mu, ex, ey + 4 * mu); c.stroke();
      c.fillStyle = '#6a3a7a'; c.beginPath(); c.moveTo(ex - 3 * mu, ey + 6 * mu); c.lineTo(ex + 4 * mu, ey - 3 * mu); c.lineTo(ex + 6 * mu, ey + 5 * mu); c.closePath(); c.fill();
      c.fillStyle = '#2a1830'; c.beginPath(); c.arc(ex, ey + 3 * mu, 3.2 * mu, 0, TAU); c.fill();
      c.strokeStyle = RIM; c.lineWidth = 0.8 * mu; c.beginPath(); c.arc(ex, ey + 3 * mu, 3.2 * mu, -1.6, 0.4); c.stroke();
    }
  }

  // ---------------------------------------------------------------- the night sea, the credits

  night(c: C2, g: C2, t: number, lt: number): PostOverrides {
    const end = this.ctx.end, wl = H * 0.44;
    const gx = W * 0.5, gy = H * 0.76;
    const fadeOut = clamp((t - (end - 0.55)) / 0.55);
    const ring = clamp((t - (end - 2.6)) / 1.8);
    // a slow push down towards the glow
    withCam2(c, g, { zoom: 1 + 0.05 * ease.inOutQuad(clamp(lt / 8)), y: 30 * ease.inOutQuad(clamp(lt / 8)) }, () => {
      nightSea(c, g, t, wl);
      deepHeart(c, g, gx, gy, 58, t, clamp(lt / 1.2) * (1 - 0.5 * fadeOut), ring);
    });
    credits(c, this.rows, t, W / 2, H * 0.17, end - 0.95, 0.45);
    return mergePost({ fade: fadeOut, vignette: 0.4 }, punch(t, [this.stab], 0.018, 0.4));
  }
}

const holeW = (x: number, y: number, R: number): P => ({ x, y: y + 0.12 * R });
void TAU; void lerp;
