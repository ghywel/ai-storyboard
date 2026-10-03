// v2 DINNER (the bridge, sung out in F major; lines 36-39). The next evening in the hut: the family round a ROUND
// table under a low pendant lamp, the table top a disc with a hole and the lamp's cord hanging over it: a stone. The
// girl (recovered, yellow tee, the pendant), her mother (plait, shawl: she serves and says nothing), the uncle
// (glasses, a calculator), the aunt (headscarf), the grandad (cap). Rai rides the girl's pendant: wow, then cheeky.
// Shots (cuts on the beat at or nearest each line's or word's start; times are this take's):
//   D1  131.09 the hole in the table, lamplight in it; the camera pulls back up the cord to the family at dinner.
//              "Some say": the uncle takes his calculator out of his shirt pocket.
//   D2  132.37 insert, "count her,": his finger taps 16 x 365 = 5840. (her hours this year), on his napkin her day:
//              4am, soup, lunchbox, fever.
//   D3  133.23 "or she's never seen;": over his shoulder he points at the mother (!); she goes on ladling soup into
//              everyone's bowls and does not look up (a sigh). Rai pops out of the pendant: deadpan, a sweat drop.
//   D4  134.51 "some say price it and you'll": he leans over the aunt's plate and prices her heart-shaped dumpling
//              (£2.40); she clutches her chest and shakes her head. Rai, arms crossed: serious.
//   D5  136.66 insert, "break what it": the heart dumpling cracks in two on "break", its steam splitting.
//   D5b 137.51 insert, "means;": Rai, close in her bubble: shock (!?).
//   D7  137.94 "some say": the grandad half rises, his fist up (anger). Rai braces.
//   D8  139.0  the wide, "smash": the fist on the table: plates jump, his cup flips over, the peas fly, the calculator
//              leaps out of the uncle's hand into the soup, the lamp swings; everyone jumps but the mother, who
//              ladles on. The plate's one shake (and a colour kick). Rai: wow.
//   D9  140.08 insert, "the one big scoreboard down,": the calculator going down in the soup, its display dying on
//              "down" (8.8.8.8., Err, nothing); the mother's ladle stirs on round it.
//   D10 141.37 the wide, "and every one of them": they all stand at once, still arguing, hands on the rim (the girl
//              up on her chair, the grandad's chair falls over), and the table rises with them, riding up the lamp's
//              cord; the camera cranes down with it.
//   D11 142.65 "is carrying the": they freeze, holding it up between them, the lamp now sitting in the hole and the
//              hole glowing like Rai's heart; they look at each other (?); the mother laughs first. Rai: wow.
//   D12 143.94 straight down, "stone.": the table is a disc with a hole and a lit heart, every hand on its rim; the
//              laugh goes round; Rai pops up out of the pendant: cheeky, then a wink.
// Clues (dinner-room.ts): the jetty in the window and the village's lanterns gathering on the beach (tonight's dive),
// the long pole and the rope by the door (tonight's lift), her mask and her slate (her drawing of Rai, the heart) on
// their hooks, the wedding photo with a stone in flowers (the end), the clock at 7:20 (4:00 was last night), the
// napkin of her day.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../../engine/scene';
import { Layer2D, W, H } from '../../engine/gl';
import type { Line, Word } from '../../engine/lyrics';
import { clamp, ease, lerp } from '../../engine/util';
import type { Face, ArmPose, RaiOpts } from '../_rai';
import { emote, TAU } from '../_motifs';
import { poof, focusLines, type Mark } from '../_manga';
import { mergePost, punch, hitShake, caKick } from '../_post';
import { bubbleLyric, currentLine, clearGlowBand, pendantRai } from './_diver';
import { D, SEAT, PLATE, POT, WHO, room, withCam, topPt, bodyPts, seatPos, overhead, topHead, topEmote, blur, type Cam, type RoomState, type Act, type Who, type CalcState, type TopPerson } from './dinner-room';
import { calcInsert, dumplingInsert, raiInsert, potInsert } from './dinner-inserts';
import { fadeGlowAbove } from './nightdive-world';

type C2 = CanvasRenderingContext2D;
type P = { x: number; y: number };
const norm = (s: string) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z']/g, '');
const outBounce = (x: number) => { const n = 7.5625, d = 2.75; if (x < 1 / d) return n * x * x; if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75; if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375; return n * (x -= 2.625 / d) * x + 0.984375; };

export default class Dinner extends Scene {
  L = new Layer2D();
  G = new Layer2D();
  lines: Line[] = [];
  cuts: number[] = [];
  T: Record<string, number> = {};
  taps: number[] = [];

  override init() {
    const { lyrics, audio: au, start, end } = this.ctx;
    this.lines = lyrics.lines.filter((l) => l.words[0]!.start >= start - 0.1 && l.words[0]!.start < end);
    if (this.lines.length < 4) throw new Error(`dinner: expected 4 lines, found ${this.lines.length}`);
    const wd = (li: number, re: RegExp, nth = 0): Word => this.lines[li]!.words.filter((w) => re.test(norm(w.w)))[nth] ?? this.lines[li]!.words[0]!;
    const T = this.T;
    T.some36 = this.lines[0]!.words[0]!.start; T.count = wd(0, /^count/).start; T.her = wd(0, /^her/).start; T.or = wd(0, /^or$/).start; T.never = wd(0, /never/).start; T.seen = wd(0, /seen/).start;
    T.some37 = this.lines[1]!.words[0]!.start; T.price = wd(1, /price/).start; T.brk = wd(1, /break/).start; T.means = wd(1, /means/).start;
    T.some38 = this.lines[2]!.words[0]!.start; T.smash = wd(2, /smash/).start; T.board = wd(2, /scoreboard/).start; T.down = wd(2, /^down/).start;
    T.and39 = this.lines[3]!.words[0]!.start; T.every = wd(3, /every/).start; T.them = wd(3, /^them/).start; T.carrying = wd(3, /carry/).start; T.stone = wd(3, /stone/).start;
    const nb = (x: number) => au.timeOfBeat(Math.round(au.beatAt(x)));
    const fb = (x: number) => au.timeOfBeat(Math.floor(au.beatAt(x + 0.02)));
    this.cuts = [start, nb(T.count), nb(T.or), fb(T.some37), fb(T.brk), nb(T.means), fb(T.some38), T.smash - 0.05, nb(T.board), fb(T.and39), nb(T.them), nb(T.stone)];
    const bp = au.beatAt(this.cuts[1]!) ;
    this.taps = [0, 0.5, 1, 1.5].map((k) => au.timeOfBeat(bp + k));
    T.laugh = T.carrying + 0.45;   // the mother laughs first
  }

  // ---------------------------------------------------------------- the room's state at t
  state(t: number): RoomState {
    const T = this.T;
    const stand = ease.outBack(clamp((t - T.and39! - 0.02) / 0.32), 1.4);
    // the table rises with them to their waists, then up over their heads, riding up the lamp's cord
    const rise = 0.3 * ease.outCubic(clamp((t - T.and39! - 0.04) / 0.38)) + 0.7 * ease.outBack(clamp((t - T.every! - 0.12) / 0.62), 1.3);
    const low = t >= this.cuts[10]!;   // D11 on: the camera under the lifted table
    const cr = ease.inOutCubic(clamp((t - T.and39!) / 1.1));
    const el = low ? -0.055 : lerp(0.2, 0.05, cr), elF = low ? 0.07 : lerp(0.2, 0.09, cr);
    const h = t - T.smash, swing = 0.012 * Math.sin(t * 1.1) + (h > 0 ? 0.07 * Math.exp(-h * 1.5) * Math.sin(h * 5.5) : 0);
    const s: RoomState = {
      t, el, elF, rise: clamp(rise, 0, 1.06), stand, swing: swing * (1 - clamp(rise)), outside: clamp((t - this.ctx.start) / 13),
      hit: T.smash!, acts: {} as Record<Who, Act>, calc: { x: 0, y: 0, s: 1, rot: 0, text: '', lit: 1, show: false }, crack: clamp((t - T.brk!) / 0.5),
      chairTip: clamp((t - T.and39! - 0.05) / 0.6), inPot: t > T.smash! + 0.55 ? clamp((t - T.smash! - 0.6) / 1.6) : -1,
    };
    this.acts(t, s);
    return s;
  }

  acts(t: number, s: RoomState) {
    const T = this.T, A = s.acts;
    const standing = t >= T.and39!, freeze = t >= this.cuts[10]! + 0.2, jolt = (w: number) => (t > T.smash! ? -10 * Math.exp(-(t - T.smash!) * 9) * Math.sin(Math.min(Math.PI, (t - T.smash!) * 18)) * w : 0);
    const argue = standing && !freeze ? 1 : 0;
    const look = t >= this.cuts[10]! + 0.25;
    const laughAt: Record<Who, number> = { mother: T.laugh!, girl: T.laugh! + 0.12, aunt: T.laugh! + 0.24, uncle: T.laugh! + 0.36, grandad: T.laugh! + 0.46 };
    const laughing = (w: Who) => clamp((t - laughAt[w]) / 0.15);
    // first pass: where they are and which way they face
    const tiptoe = -22 * clamp(s.rise * 1.6 - 0.6);
    const lean = (t > T.some37! - 0.25 && t < T.smash! ? 85 * ease.inOutCubic(clamp((t - T.some37! + 0.25) / 0.35)) : 0) + (t >= T.smash! && t < T.smash! + 0.2 ? 85 * (1 - ease.outCubic(clamp((t - T.smash!) / 0.2))) : 0);
    A.uncle = standing ? { pose: 'carry', dy: tiptoe, dx: 8 * clamp(s.rise * 2) + argue * 5 * Math.sin(t * 19), behind: 'back' } : { pose: 'seated', dx: lean, dy: jolt(1) };
    A.aunt = { flip: t >= T.or! && t < T.some37! ? true : t >= T.price! - 0.15 && t < T.brk! + 0.3 ? Math.floor(t * 7.5) % 2 === 0 : look ? true : false, dy: jolt(0.8) + argue * 3 * Math.sin(t * 23 + 1), dx: argue * 4 * Math.sin(t * 17) };
    A.girl = { flip: t < T.or! ? false : t < this.cuts[6]! ? true : look ? true : false, dy: jolt(0.9) };
    A.mother = { flip: look && t < T.laugh! ? false : true, dy: 0 };
    A.grandad = { pose: standing ? 'carry' : 'seated', dy: standing ? tiptoe : (t >= T.some38! ? -26 * ease.outCubic(clamp((t - T.some38!) / 0.4)) : 0) + jolt(0.5), dx: standing ? 34 * clamp(s.rise * 2) + argue * 5 * Math.sin(t * 21 + 2) : 0, behind: standing ? 'back' : undefined };
    // second pass: the arms
    const sh = (w: Who) => bodyPts(s, w);
    const under = s.el < 0 ? D.TH : s.rise > 0.5 ? D.TH * 0.6 : 0;
    const rimAt = (deg: number, dz = 0): P => { const a = (deg * Math.PI) / 180, p = topPt(s, Math.cos(a) * (D.RT - 6), Math.sin(a) * (D.RT - 6) + dz); return { x: p.x, y: p.y + under }; };
    const backRim = (X: number, off: number): P => { const XX = X + off, Z = -Math.sqrt(Math.max(0, D.RT * D.RT - XX * XX)) + 14, p = topPt(s, XX, Z); return { x: p.x, y: p.y + under }; };
    const eatCycle = (w: Who, period: number, phase: number) => {
      const b = sh(w), [X, Z] = PLATE[w], p = topPt(s, X, Z, 0), mouth = { x: b.head.x + (A[w]!.flip ? -1 : 1) * 10 * b.u, y: b.head.y + 6 * b.u };
      const u = 0.5 - 0.5 * Math.cos(((t + phase) / period) * TAU);
      return { x: lerp(p.x - 10, mouth.x, ease.inOutQuad(u)), y: lerp(p.y - 6, mouth.y, ease.inOutQuad(u)) };
    };
    const uS = sh('uncle');
    // the uncle
    {
      const a = A.uncle, sF = uS.sh[1], sB = uS.sh[0];
      if (standing) { a.arms = [rimAt(196), rimAt(166)]; a.emote = look ? (t >= laughAt.uncle ? 'joy' : '?') : '!'; a.emoteT0 = look ? (t >= laughAt.uncle ? laughAt.uncle : this.cuts[10]! + 0.3) : T.and39! + 0.05; a.laugh = laughing('uncle'); }
      else if (t < T.some36!) { a.arms = [rimAt(192), eatCycle('uncle', 1.7, 0.3)]; a.hold = 'spoon'; }
      else if (t < T.or!) {
        const out = ease.outBack(clamp((t - T.some36! - 0.05) / 0.4));
        const hold = { x: lerp(sF.x + 8, sF.x + 48, out), y: lerp(sF.y + 20, sF.y + 34, out) };
        let last = -1e9; for (const x of this.taps) if (x <= t && x > last) last = x;
        const tap = clamp(1 - (t - last) / 0.12);
        a.arms = [{ x: hold.x + 4, y: hold.y - 10 + 8 * (1 - tap) - 6 }, hold];
      } else if (t < T.some37! - 0.25) { // pointing at the mother across the table
        const m = sh('mother').head, d = Math.hypot(m.x - sF.x, m.y - sF.y);
        a.arms = [{ x: sB.x + 30, y: sB.y + 46 }, { x: sF.x + ((m.x - sF.x) / d) * 104, y: sF.y + ((m.y - sF.y) / d) * 104 }];
        a.emote = '!'; a.emoteT0 = T.or! + 0.04;
      } else if (t < T.smash!) { // pricing the aunt's dumpling
        const [X, Z] = PLATE.aunt, p = topPt(s, X, Z);
        a.arms = [rimAt(186), { x: p.x - 104, y: p.y + 2 }];
      } else if (t < this.cuts[9]!) { // startled; then reaching for the pot
        const k = clamp((t - T.smash! - 0.6) / 0.4);
        const pot = topPt(s, POT[0], POT[1]);
        a.arms = [{ x: lerp(sF.x + 30, sB.x + 20, k), y: lerp(sF.y - 44, sB.y + 50, k) }, { x: lerp(sF.x + 58, sF.x + (pot.x - sF.x) * 0.2, k), y: lerp(sF.y - 18, sF.y + 20, k) }];
        a.emote = k > 0.5 ? 'sweat' : '!'; a.emoteT0 = k > 0.5 ? T.smash! + 1.0 : T.smash! + 0.03;
      }
    }
    // the calculator: pocket, hand, flight, soup
    {
      const a = A.uncle, hand = a.arms?.[1], back = a.arms?.[0];
      const cs: CalcState = s.calc;
      if (t >= T.some36! + 0.08 && t < T.smash! && hand) {
        cs.show = true;
        const pointing = t >= T.or! && t < T.some37! - 0.25, pricing = t >= T.some37! - 0.25;
        const at = pointing && back ? back : hand;
        cs.x = at.x + (pointing ? 6 : pricing ? 16 : 14); cs.y = at.y - (pointing ? 8 : pricing ? 26 : 20); cs.rot = pointing ? 0.5 : pricing ? 0.04 : -0.1; cs.s = 1;
        cs.text = t < this.taps[1]! ? '16' : t < this.taps[2]! ? '16×' : t < this.taps[3]! ? '365' : t < T.price! ? '5840.' : '£2.40';
        cs.lit = 1;
      } else if (t >= T.smash! && t < T.smash! + 0.55) {
        const u = (t - T.smash!) / 0.55, [X, Z] = PLATE.aunt, p0 = topPt(s, X - 62, Z, 0), p1 = topPt(s, POT[0] + 8, POT[1]);
        cs.show = true; cs.x = lerp(p0.x, p1.x, u); cs.y = lerp(p0.y - 32, p1.y - 40, u) - 210 * Math.sin(Math.PI * u); cs.rot = u * 9; cs.s = 1; cs.text = '£2.40'; cs.lit = 1;
      }
    }
    // the aunt
    {
      const a = A.aunt, b = sh('aunt');
      if (standing) { a.arms = [backRim(SEAT.aunt.X, -78), backRim(SEAT.aunt.X, 78)]; a.behind = true; a.emote = look ? (t >= laughAt.aunt ? 'joy' : '?') : 'tear'; a.emoteT0 = look ? (t >= laughAt.aunt ? laughAt.aunt : this.cuts[10]! + 0.35) : T.brk! + 0.2; a.laugh = laughing('aunt'); }
      else if (t >= T.some37! - 0.1) { // clutching her chest
        const k = ease.outCubic(clamp((t - T.some37! + 0.1) / 0.3)), chest = { x: b.head.x, y: b.head.y + 26 * b.u };
        a.arms = [{ x: lerp(b.sh[0].x - 6, chest.x - 3 * b.u, k), y: lerp(b.sh[0].y + 40, chest.y, k) }, { x: lerp(b.sh[1].x + 6, chest.x + 4 * b.u, k), y: lerp(b.sh[1].y + 40, chest.y + 3 * b.u, k) }];
        if (t >= T.brk!) { a.emote = 'tear'; a.emoteT0 = T.brk! + 0.2; }
        if (t >= T.smash!) { a.emote = '!'; a.emoteT0 = T.smash! + 0.03; }
      } else { a.arms = [backRim(SEAT.aunt.X, -50), eatCycle('aunt', 2.1, 1.1)]; a.hold = 'spoon'; }
    }
    // the girl: hands on the table, watching whoever is talking; then up on her chair
    {
      const a = A.girl;
      a.arms = standing ? [backRim(SEAT.girl.X, -46), backRim(SEAT.girl.X, 46)] : [backRim(SEAT.girl.X, -26), backRim(SEAT.girl.X, 22)];
      if (t >= T.smash! && t < T.smash! + 1.2 && !standing) { a.emote = '!'; a.emoteT0 = T.smash! + 0.03; }
      if (look) { a.emote = t >= laughAt.girl ? 'joy' : '?'; a.emoteT0 = t >= laughAt.girl ? laughAt.girl : this.cuts[10]! + 0.28; a.laugh = laughing('girl'); }
    }
    // the mother: ladling soup into everyone's bowls, unbothered; she laughs first
    {
      const a = A.mother, b = sh('mother');
      if (standing) { a.arms = [backRim(SEAT.mother.X, -78), backRim(SEAT.mother.X, 60)]; a.behind = true; if (t >= T.laugh!) { a.emote = 'joy'; a.emoteT0 = T.laugh!; a.laugh = laughing('mother'); } else if (look) { a.emote = '?'; a.emoteT0 = this.cuts[10]! + 0.3; } }
      else {
        const pot = topPt(s, POT[0], POT[1]), bowlP = topPt(s, PLATE.girl[0], PLATE.girl[1]);
        const u = 0.5 - 0.5 * Math.cos((t / 2.6) * TAU);
        a.arms = [backRim(SEAT.mother.X, 30), { x: lerp(pot.x + 6, bowlP.x + 20, ease.inOutCubic(u)), y: lerp(pot.y - 70, bowlP.y - 40, ease.inOutCubic(u)) - 26 * Math.sin(Math.PI * u) }];
        a.hold = 'ladle';
        if (t >= T.seen!) { a.emote = 'sigh'; a.emoteT0 = T.seen!; }
      }
      void b;
    }
    // the grandad: eating peas; then the fist goes up, and down
    {
      const a = A.grandad, b = sh('grandad');
      if (standing) {
        a.arms = [rimAt(16), rimAt(-14)]; a.hold = 'fist';
        a.emote = look ? (t >= laughAt.grandad ? 'joy' : '?') : 'anger'; a.emoteT0 = look ? (t >= laughAt.grandad ? laughAt.grandad : this.cuts[10]! + 0.4) : T.and39! + 0.05; a.laugh = laughing('grandad');
      } else if (t >= T.some38!) {
        const up = { x: b.sh[1].x + 6 + 3 * Math.sin(t * 40), y: b.sh[1].y - 104 }, down = topPt(s, PLATE.grandad[0] + 48, PLATE.grandad[1] + 40);
        const slam = ease.inCubic(clamp((t - (T.smash! - 0.075)) / 0.075)), lift = ease.inOutCubic(clamp((t - T.smash! - 0.9) / 0.4));
        const wind = ease.outBack(clamp((t - T.some38!) / 0.45));
        const fist = t < T.smash! ? { x: lerp(b.sh[1].x - 20, lerp(up.x, down.x, slam), wind), y: lerp(b.sh[1].y + 30, lerp(up.y, down.y - 4, slam), wind) } : { x: lerp(down.x, b.sh[1].x - 28, lift), y: lerp(down.y - 4, b.sh[1].y + 24, lift) };
        a.arms = [rimAt(10), fist]; a.hold = 'fist';
        a.emote = 'anger'; a.emoteT0 = T.some38! + 0.1;
      } else { a.arms = [rimAt(12), eatCycle('grandad', 1.9, 0.6)]; a.hold = 'spoon'; }
    }
    void seatPos;
  }

  // ---------------------------------------------------------------- Rai in the pendant
  rai(t: number): { pop: number; o: Partial<RaiOpts>; poofT: number } {
    const T = this.T, c = this.cuts;
    const pop = clamp((t - c[2]!) / 0.25);
    let o: Partial<RaiOpts>;
    if (t < c[3]!) o = { face: 'deadpan', arms: ['down', 'down'], marks: ['sweat'], markT0: c[2]! + 0.2, look: -1 };
    else if (t < T.brk!) o = { face: 'sassy', arms: ['cross', 'cross'], armsFrom: ['down', 'down'], armsU: clamp((t - c[3]!) / 0.2), look: -1, tilt: 0.1, marks: t > T.price! ? ['vein'] : [], markT0: T.price! + 0.1 };
    else if (t < c[6]!) o = { face: 'shock', arms: ['cheek', 'cheek'], marks: ['!?'], markT0: c[5]! + 0.03, shake: 0.6 };
    else if (t < T.smash!) o = { face: 'shock', arms: ['up', 'up'], marks: ['sweat'], markT0: c[6]! + 0.15, look: 1, squash: -0.2 };
    else if (t < T.and39!) o = { face: 'wow', arms: ['up', 'up'], marks: ['sparkle'], markT0: T.smash! + 0.05, hop: 0.35 * Math.max(0, Math.sin(Math.min(Math.PI, (t - T.smash!) * 7))) };
    else if (t < T.laugh!) o = { face: 'wow', arms: ['cheek', 'cheek'], marks: t > c[10]! ? ['sparkle'] : ['!'], markT0: t > c[10]! ? c[10]! + 0.1 : T.and39! + 0.05, blush: 0.4 };
    else if (t < c[11]!) o = { face: 'joy', arms: ['up', 'up'], marks: ['notes'], markT0: T.laugh! + 0.05, hop: 0.2 * Math.abs(Math.sin(t * 9)) };
    else if (t < c[11]! + 0.95) o = { face: 'cheeky', arms: ['hip', 'point'], armsFrom: ['up', 'up'], armsU: clamp((t - c[11]!) / 0.2), tilt: -0.1, marks: ['shine'], markT0: c[11]! + 0.15 };
    else o = { face: 'wink', arms: ['hip', 'point'], tilt: -0.12, marks: ['sparkle'], markT0: c[11]! + 0.95, blush: 0.5 };
    return { pop, o, poofT: c[2]! };
  }

  // ---------------------------------------------------------------- render
  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const c = this.L.ctx, g = this.G.ctx, t = f.t, T = this.T;
    this.L.clear('#1a0c08'); this.G.clear();
    const shot = Math.max(0, this.cuts.filter((x) => t >= x).length - 1);
    const s0 = this.cuts[shot]!, s1 = this.cuts[shot + 1] ?? this.ctx.end, sp = clamp((t - s0) / (s1 - s0)), lt = t - s0;
    let post: PostOverrides = { bloom: 0.62, vignette: 0.42 };
    const s = this.state(t);
    const R = this.rai(t);

    const inRoom = (cam: Cam, extra?: (heads: Record<Who, P>, pend: P) => void) => {
      withCam(c, g, cam, () => {
        const r = room(c, g, s);
        const pend = r.girl.pendant!;
        // the aunt's head shake: little arcs either side
        if (t >= T.price! - 0.15 && t < T.brk! + 0.3) { const hd = r.heads.aunt; c.strokeStyle = 'rgba(255,230,200,0.75)'; c.lineWidth = 3; c.lineCap = 'round'; for (const sd of [-1, 1]) { c.beginPath(); c.arc(hd.x + sd * 6, hd.y, 44, sd < 0 ? Math.PI - 0.5 : -0.5, sd < 0 ? Math.PI + 0.5 : 0.5); c.stroke(); } }
        extra?.(r.heads, pend);
        if (R.pop > 0) {
          pendantRai(c, g, pend.x, pend.y, 1, t, R.pop, R.o, 0.35 + 0.4 * clamp((t - this.cuts[10]!) / 0.5));
          poof(c, pend.x + 70, pend.y - 90, 70, t, R.poofT);
        }
      });
    };

    if (shot === 0) { // D1: down on the hole in the table, pulling back up the cord to the family
      const u = ease.inOutCubic(clamp(lt / 1.15));
      inRoom({ cx: 960, cy: lerp(712, 600, u), zoom: lerp(3.1, 1.08, u) });
    } else if (shot === 1) { // D2: the calculator
      const k = this.taps.filter((x) => t >= x).length - 1, keys = [10, 7, 9, 18];
      calcInsert(c, g, t, s0, this.taps, s.calc.text || '16', keys[Math.max(0, k)]!);
      post = mergePost(post, punch(t, [this.taps[3]!], 0.018, 0.3));
    } else if (shot === 2) { // D3: he points; she ladles on
      inRoom({ cx: lerp(1030, 1050, sp), cy: 615, zoom: lerp(1.74, 1.82, sp) });
    } else if (shot === 3) { // D4: the price, the head shake
      inRoom({ cx: lerp(800, 830, sp), cy: lerp(630, 622, sp), zoom: lerp(1.9, 2.04, ease.inOutQuad(sp)) });
    } else if (shot === 4) { // D5: the heart cracks
      dumplingInsert(c, g, t, s0, s.crack, T.brk!, '£2.40');
      post = mergePost(post, punch(t, [T.brk!], 0.035, 0.4));
    } else if (shot === 5) { // D5b: Rai's shock, close
      raiInsert(c, g, t, s0, R.o, 'focus');
    } else if (shot === 6) { // D7: the grandad's fist goes up
      inRoom({ cx: lerp(1235, 1255, sp), cy: lerp(615, 600, sp), zoom: lerp(1.72, 1.86, ease.inQuad(sp)) }, () => {
        const fist = s.acts.grandad.arms?.[1], k = clamp((t - T.some38! - 0.3) / 0.2);
        if (fist && k > 0) { // the wind-up: little lines of force over the trembling fist
          c.save(); c.strokeStyle = `rgba(255,236,200,${0.85 * k})`; c.lineCap = 'round'; c.lineWidth = 4;
          for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.32, r0 = 34 + 4 * Math.sin(t * 30 + i), r1 = r0 + 26; c.beginPath(); c.moveTo(fist.x + Math.cos(a) * r0, fist.y + Math.sin(a) * r0); c.lineTo(fist.x + Math.cos(a) * r1, fist.y + Math.sin(a) * r1); c.stroke(); }
          c.restore();
        }
      });
    } else if (shot === 7) { // D8: SMASH, the wide
      inRoom({ cx: 960, cy: 600, zoom: 1.06 }, (heads) => {
        const fist = topPt(s, PLATE.grandad[0] + 48, PLATE.grandad[1] + 40), u = (t - T.smash!) / 0.4;
        if (u > 0 && u < 1) { // the impact: rings on the table and lines of force
          c.save(); c.translate(fist.x, fist.y); c.scale(1, 0.32);
          for (let k = 0; k < 3; k++) { const v = clamp(u * 1.4 - k * 0.15); if (v <= 0 || v >= 1) continue; c.strokeStyle = `rgba(255,240,210,${0.8 * (1 - v)})`; c.lineWidth = 6 * (1 - v) + 1; c.beginPath(); c.arc(0, 0, 30 + 240 * v, 0, TAU); c.stroke(); }
          c.restore();
          c.save(); c.strokeStyle = `rgba(255,245,220,${0.9 * (1 - u)})`; c.lineCap = 'round';
          for (let k = 0; k < 14; k++) { const a = Math.PI + (k / 13) * Math.PI + 0.1 * Math.sin(k * 7), r0 = 46 + 40 * u, r1 = r0 + 60 + 50 * ((k * 37) % 5) / 5; c.lineWidth = 5 * (1 - u) + 1; c.beginPath(); c.moveTo(fist.x + Math.cos(a) * r0, fist.y - 6 + Math.sin(a) * r0 * 0.75); c.lineTo(fist.x + Math.cos(a) * r1, fist.y - 6 + Math.sin(a) * r1 * 0.75); c.stroke(); }
          c.restore();
        }
        void heads;
      });
      post = mergePost(post, hitShake(t, [T.smash!], 8, 0.42), punch(t, [T.smash!], 0.04, 0.4), caKick(t, [T.smash!], 5, 0.3));
    } else if (shot === 8) { // D9: down in the soup
      potInsert(c, g, t, s0, clamp((t - T.down! + 0.25) / 0.5), t);
    } else if (shot === 9) { // D10: they all stand; the table rises with them; the camera cranes down
      const u = ease.inOutCubic(clamp(lt / 1.25));
      inRoom({ cx: 960, cy: lerp(600, 572, u), zoom: lerp(1.02, 1.14, u) });
      post = mergePost(post, punch(t, [T.and39!], 0.015, 0.3));
    } else if (shot === 10) { // D11: frozen, holding it up, the hole glowing; they look; she laughs
      inRoom({ cx: 962, cy: lerp(640, 628, sp), zoom: lerp(1.22, 1.3, sp) });
    } else { // D12: straight down: the stone
      const cx = W / 2, cy = 512, Rr = 272, rot = lerp(-0.07, 0.02, ease.inOutQuad(sp)), z = lerp(1.0, 1.05, ease.outQuad(sp));
      const people: TopPerson[] = [
        { who: 'aunt', ang: -Math.PI / 2, laugh: clamp((t - s0 - 0.3) / 0.2), joyT0: s0 + 0.3 },
        { who: 'girl', ang: -0.314, laugh: clamp((t - s0 - 0.15) / 0.2), joyT0: s0 + 0.15 },
        { who: 'mother', ang: 0.942, laugh: 1, joyT0: s0 },
        { who: 'grandad', ang: 2.199, laugh: clamp((t - s0 - 0.45) / 0.2), joyT0: s0 + 0.45 },
        { who: 'uncle', ang: 3.456, laugh: clamp((t - s0 - 0.6) / 0.2), joyT0: s0 + 0.6 },
      ];
      for (const k of [c, g]) { k.save(); k.translate(W / 2, H / 2); k.scale(z, z); k.translate(-W / 2, -H / 2); }
      overhead(c, g, t, cx, cy, Rr, rot, people, { crack: 1, peas: 1 });
      for (const p of people) topEmote(c, topHead(cx, cy, rot, Rr, p), t, p.joyT0, p.who === 'girl');
      // the lamp's cord, rising past us out of focus
      c.save(); blur(c, 6); c.strokeStyle = '#120a08'; c.lineCap = 'round';
      for (let k = 0; k < 6; k++) { const v0 = k / 6, v1 = (k + 1) / 6; c.lineWidth = 6 + 40 * v1; c.beginPath(); c.moveTo(cx + 720 * v0, cy - 620 * v0); c.lineTo(cx + 720 * v1, cy - 620 * v1); c.stroke(); }
      c.restore();
      // Rai, out of the girl's pendant: cheeky, then the wink
      const gp = topHead(cx, cy, rot, Rr - 52, people[1]!);
      pendantRai(c, g, gp.x, gp.y, 1.5, t, 1, R.o, 0.6);
      for (const k of [c, g]) k.restore();
    }

    bubbleLyric(c, currentLine(this.lines, t) ?? this.lines[0]!, t);
    fadeGlowAbove(g);
    clearGlowBand(g);
    comp.draw(renderer, this.L.upload(), out);
    comp.draw(renderer, this.G.upload(), out, { mode: 'add', tint: [2.2, 2.2, 2.2] });
    return mergePost(post, { zoom: 1 + 0.006 * f.a.kick });
  }
}
void emote; void outBounce; void WHO; void H;
export type { Face, ArmPose, Mark };
