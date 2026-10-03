// BEDTIME (the spoken interlude, the film's heart and the song's quietest valley). One continuous shot, no cuts. His
// staging: "Mum reading the bedtime story but dad watching at the door." It opens close on the toy rai stone on the
// shelf, its heart glowing pink (a match cut from chorus 2's glowing stones), and pulls back to the room: dad
// leaning in the lit doorway, mum on the bed's edge with the book, the child under the covers, Rai small on the
// windowsill. The child asks; the toy stone becomes the night-light, its hole throwing a disc of gold onto the wall,
// and the story plays there as a shadow-play: the raft crossing, the storm, the stone sinking out of reach, the
// island pointing at the sea, and light through the sunk stone's hole on "worth everything" (in a shadow-play a hole
// is where the light gets through). Rai performs it all softly from the sill: delighted when the lamp comes on, a
// shock in the storm, a chibi sob when the stone (she) goes down, deadpan on "Nobody cried", smug on "we know it's
// there", wow on "worth everything", in love on "as much as we remember", asleep with zzz on "Go to sleep". Dad
// sighs fondly at the request, sheds a tear on "worth everything", and sends a heart on "love"; the child asks with
// a "?" and falls asleep; mum looks up from the book, leans in, closes it; the night-light dims.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import type { Line, Word } from '../engine/lyrics';
import { clamp, ease, keys, pulse, type Key } from '../engine/util';
import { drawRai, type ArmPose, type Face } from './_rai';
import { poof, type Mark } from './_manga';
import { gradientV, mixHex, spoken } from './_motifs';
import {
  ROOM, drawBeam, drawBed, drawChest, drawChild, drawDad, drawDecor, drawDoor, drawMum, drawShelf, drawStory, drawWall, drawWindow, type Story,
} from './bedtime-room';

const CHILD = '#dcaaff';   // the child's voice: lilac, smaller, higher in the frame
const PARENT = '#f8e6b8';  // mum's: warm cream-gold

/** One of Rai's acting beats, from time t. */
interface Cue { t: number; face: Face; arms: [ArmPose, ArmPose]; marks?: Mark[]; sd?: boolean; hop?: number; look?: number; blush?: number }

export default class Bedtime extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  lines: Line[] = [];
  ask!: Line; carried!: Line; storm!: Line; cried!: Line; worth!: Line; how!: Line; sleep!: Line;
  camX: Key[] = []; camY: Key[] = []; camZ: Key[] = [];
  cues: Cue[] = [];

  w(line: Line, re: RegExp, nth = 0): Word {
    return line.words.filter((x) => re.test(x.w.toLowerCase()))[nth] ?? line.words[0]!;
  }

  override init() {
    const { lyrics, start, end } = this.ctx;
    this.ask = lyrics.get('Tell me the one about');
    this.carried = lyrics.get('They carried a stone');
    this.storm = lyrics.get('and a storm took it down');
    this.cried = lyrics.get('Nobody cried');
    this.worth = lyrics.get('And it was still worth');
    this.how = lyrics.get('How much is it worth');
    this.sleep = lyrics.get('As much as we remember');
    // by content: the window's first-word filter would also catch "Fast forward", which starts just before the cut
    this.lines = [this.ask, this.carried, this.storm, this.cried, this.worth, this.how, this.sleep];
    const io = ease.inOutCubic, b = this.worth.end, c = this.how.start - 0.3;
    const wide = this.ask.end + 0.1;
    // close on the toy stone, pulled back to the room as the child asks; in towards the wall's story; then over to
    // the bed and the sill
    this.camX = [[start, ROOM.toy.x], [start + 0.5, ROOM.toy.x - 10], [wide, 960, io], [this.carried.start, 950], [b, 930, io], [c, 930], [end, 1040, io]];
    this.camY = [[start, ROOM.toy.y], [start + 0.5, ROOM.toy.y + 4], [wide, 540, io], [this.carried.start, 530], [b, 470, io], [c, 470], [end, 520, io]];
    this.camZ = [[start, 3.0], [start + 0.5, 2.9], [wide, 1.0, io], [this.carried.start, 1.01], [b, 1.08, io], [c, 1.08], [end, 1.05, io]];
    const W_ = (l: Line, re: RegExp) => this.w(l, re).start;
    this.cues = [
      { t: start, face: 'soft', arms: ['down', 'chin'], look: 0.3 },
      { t: this.ask.end + 0.15, face: 'joy', arms: ['cheek', 'cheek'], marks: ['sparkle'], hop: 0.15, look: -0.6 },
      { t: this.carried.start + 0.3, face: 'soft', arms: ['hold', 'chin'], look: -0.7 },
      { t: W_(this.storm, /storm/), face: 'shock', arms: ['up', 'up'], marks: ['!?', 'sweat'], hop: 0.25, look: -0.7 },
      { t: W_(this.storm, /down/), face: 'cry', arms: ['cheek', 'cheek'], sd: true },
      { t: this.cried.start, face: 'deadpan', arms: ['down', 'down'], marks: ['sweat'], look: -0.4 },
      { t: W_(this.cried, /^we$/), face: 'smug', arms: ['hip', 'hip'], marks: ['shine'], look: -0.6 },
      { t: W_(this.worth, /worth/), face: 'wow', arms: ['cheek', 'cheek'], marks: ['sparkle'], look: -0.7 },
      { t: this.how.start, face: 'soft', arms: ['hold', 'chin'], look: -0.5 },
      { t: W_(this.sleep, /remember/), face: 'love', arms: ['cheek', 'cheek'], marks: ['hearts'], blush: 1, hop: 0.12 },
      { t: W_(this.sleep, /sleep/), face: 'asleep', arms: ['down', 'down'], marks: ['zzz'] },
    ];
  }

  story(t: number, lamp: number): Story {
    const stormW = this.w(this.storm, /storm/), took = this.w(this.storm, /took/), where = this.w(this.storm, /where/), reach = this.w(this.storm, /reach/);
    const said = this.w(this.cried, /said/), we = this.w(this.cried, /^we$/), there = this.w(this.cried, /there/);
    const still = this.w(this.worth, /still/), worthW = this.w(this.worth, /worth/), every = this.w(this.worth, /everything/);
    const remember = this.w(this.sleep, /remember/);
    const cr = this.cried.start;
    const fallU = clamp((t - took.start) / (reach.end + 0.4 - took.start));
    return {
      t, light: lamp,
      raftX: keys(t, [[this.carried.start - 0.5, -250], [this.carried.end + 0.4, 6, ease.outCubic], [cr, 14], [cr + 1.4, 100, ease.inCubic]]),
      raftA: 1 - clamp((t - cr - 0.3) / 1.0),
      rough: clamp((t - stormW.start + 0.2) / 0.5) * (1 - clamp((t - cr + 0.3) / 0.9)),
      flash: pulse(t, stormW.start, 0.05) + 0.6 * pulse(t, took.start + 0.2, 0.04),
      stoneOnRaft: t < took.start,
      stoneX: 6 - 52 * ease.outCubic(fallU), stoneY: -26 + 128 * ease.inOutCubic(fallU), stoneRot: -1.3 * ease.outCubic(fallU),
      reach: clamp((t - where.start) / 0.8) * (1 - clamp((t - cr) / 0.6)),
      shore: clamp((t - cr - 0.3) / (said.end - cr - 0.3)),
      point: t >= we.start ? 1 : 0,
      pulse: (t - there.start) / 1.1,
      heart: Math.min(1.2, clamp((t - worthW.start + 0.1) / 0.5) * (0.8 + 0.2 * clamp((t - every.start) / 0.4)) + 0.4 * clamp((t - remember.start) / 0.4)),
      threads: clamp((t - still.start) / (every.end - still.start)),
    };
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, end } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t;
    this.L.clear('#0a0614'); this.G.clear();
    const goW = this.w(this.sleep, /^go$/), sleepW = this.w(this.sleep, /sleep/), loveW = this.w(this.sleep, /love/), remember = this.w(this.sleep, /remember/);
    const worthW = this.w(this.worth, /worth/);
    // the night-light: a faint pink standby glow, on as the story starts, off on "Go to sleep"
    const lamp = ease.inOutCubic(clamp((t - this.ask.end - 0.15) / 0.8)) * (1 - ease.inOutCubic(clamp((t - goW.start) / 0.7)));
    const idle = 1 - clamp((t - this.ask.end - 0.15) / 0.3) + clamp((t - goW.start - 0.4) / 0.6);

    const z = keys(t, this.camZ), cx = keys(t, this.camX), cy = keys(t, this.camY);
    for (const k of [c, g]) { k.save(); k.translate(W / 2, H / 2); k.scale(z, z); k.translate(-cx, -cy); }

    // back
    drawWall(c, t, lamp, 1);
    drawDecor(c);
    drawStory(c, g, this.story(t, lamp));
    drawBeam(g, t, lamp);
    drawWindow(c, g, t);
    // mid: the doorway and dad, the chest, the shelf, Rai on the sill
    drawDoor(c, g, t, 1);
    const dadEm = t >= loveW.start ? 'heart' : t >= worthW.start && t < this.how.start + 0.5 ? 'tear' : t >= this.ask.words[0]!.start + 0.6 && t < this.carried.start ? 'sigh' : undefined;
    const dadT0 = dadEm === 'heart' ? loveW.start : dadEm === 'tear' ? worthW.start : this.ask.words[0]!.start + 0.6;
    drawDad(c, t, 1, dadEm, dadT0);
    drawChest(c);
    drawShelf(c, g, t, lamp, clamp(idle));
    this.rai(c, t, worthW.start, remember.start, goW.start);
    // front: the bed, the child, mum
    drawBed(c);
    const lift = clamp((t - this.how.start + 0.3) / 0.5) * (1 - clamp((t - goW.start) / 0.8));
    const childEm = t >= sleepW.start ? 'zzz' : t >= this.how.start - 0.1 && t < this.sleep.start ? '?' : undefined;
    drawChild(c, t, ease.inOutCubic(lift), childEm, childEm === 'zzz' ? sleepW.start + 0.2 : this.how.start - 0.1);
    const up = clamp((t - this.how.start + 0.1) / 0.3);
    const look = t < this.ask.end + 0.3 ? 0.2 : 1 - 1.6 * up;
    drawMum(c, t, { look, lean: ease.inOutCubic(clamp((t - loveW.start + 0.1) / 0.6)), closed: ease.inOutCubic(clamp((t - goW.start) / 0.4)), rim: lamp });
    for (const k of [c, g]) k.restore();

    // the voices: mum low and warm, the child smaller, higher, lilac; each line held until the next
    gradientV(c, 'rgba(8,5,16,0)', 'rgba(8,5,16,0.72)', 0, H - 290, W, 290);
    this.lines.forEach((l, i) => {
      const next = this.lines[i + 1]?.words[0]!.start ?? end + 1;
      const child = l === this.ask || l === this.how;
      spoken(c, l, t, W / 2, child ? H - 178 : H - 100, child ? 54 : 66, { col: child ? CHILD : PARENT, until: next - 0.25 });
    });

    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    return { bloom: 0.6, vignette: 0.5, grain: 0.06 };
  }

  /** Rai on the sill, acting the story softly (the current cue, arms blended from the last). */
  rai(c: CanvasRenderingContext2D, t: number, worthT: number, rememberT: number, goT: number) {
    let i = 0;
    for (let k = 0; k < this.cues.length; k++) if (t >= this.cues[k]!.t) i = k;
    const q = this.cues[i]!, prev = this.cues[Math.max(0, i - 1)]!, age = t - q.t;
    const R = 46, x = ROOM.sill.x + 300, y = ROOM.sill.y - 1.07 * R;
    const hop = (q.hop ?? 0) * Math.max(0, Math.sin(Math.min(1, age / 0.35) * Math.PI));
    const squash = age < 0.12 ? -0.25 + age * 2 : q.face === 'asleep' ? -0.1 : 0;
    const heartCol = mixHex('#f6c453', '#ff4f9a', clamp((t - rememberT) / 0.5));
    const heart = Math.min(1, 0.6 * clamp((t - worthT) / 0.5) + 0.4 * clamp((t - rememberT) / 0.4)) * (1 - 0.4 * clamp((t - goT) / 0.8));
    drawRai(c, x, y, R, {
      t, face: q.face, arms: q.arms, armsFrom: prev.arms, armsU: clamp(age / 0.2), sd: q.sd, marks: q.marks, markT0: q.t + 0.05,
      hop, squash, tilt: (q.face === 'asleep' ? 0.16 : 0.05) + 0.02 * Math.sin(t * 0.6), look: q.look, blush: q.blush,
      glow: mixHex('#2fe0ff', '#c65cf0', 0.45), glowStrength: 0.7 - 0.4 * clamp((t - goT) / 0.8), heart, heartColor: heartCol,
    });
    // the chibi pops: in when she goes down with the stone, out on "Nobody cried"
    if (q.sd || prev.sd) poof(c, x, y - R * 0.6, R * 1.8, t, q.t);
  }
}
