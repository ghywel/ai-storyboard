// The girl's doll's house (v2: `fever` shows it small on her dresser, `dollhouse` plays Pigou's paradox inside it,
// `dream` floats it). One drawing at every scale, so the house in the fever dream is the house on the dresser.
//
// A cutaway bungalow on a wooden base, its front open, an attic in the roof. Units: 1000 across the walls, origin at
// the middle of the front edge of the floor, y up negative (the base board below 0). The ground floor is one room,
// the parlour, back wall left to right: the front door (the INCOME tag on its knob), a window with the same moon, the
// sofa, the kitchen corner, the cuckoo clock and the toy coin meter. The attic holds a tiny bed with a quilt of fish,
// the girl's own bed in miniature: the house is the room it stands in.
//
// The dolls are wooden peg dolls with painted clothes and no faces (Rai is the only face): the man (a navy suit and a
// red bow tie), the housekeeper (lilac dress, white apron and frilled cap, a tiny mop) and the stranger (green
// overalls and a flat cap, his own mop and bucket). They emote with the shared signs.
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import { clamp, ease } from '../../engine/util';
import { h01 } from '../_rai';
import { FAM, TAU, rgbaHex, mixHex, emote, type Emote } from '../_motifs';
import { star4, heart as heartShape } from '../_manga';

type C2 = CanvasRenderingContext2D;
const PI = Math.PI;

/** Where things are in the doll's house (house units). */
export const DH = {
  wallTop: -380, back: -40, eave: { x: 560, y: -392 }, ridge: -770,
  door: { x: -400, w: 92, top: -246 }, knob: { x: -372, y: -146 },
  win: { x: -258, y: -248, w: 96, h: 110 },
  sofa: { x0: -232, x1: -64 },
  stove: { x: 96 }, sink: { x: 186 },
  clock: { x: 296, y: -268 }, meter: { x: 412, y: -232 }, tray: { x: 412, y: -128 },
  floorY: -14,
};

export interface DollPos { x: number; y?: number; flip?: boolean; pose?: DollPose; emote?: Emote; emoteT0?: number; hop?: number; tilt?: number; show?: number }
export type DollPose = 'stand' | 'mop' | 'ring' | 'hands' | 'pay' | 'sit' | 'read' | 'cheer' | 'point';

export interface HouseState {
  t: number;
  /** the lamp light on the house 0..1 (the big lamp is to the upper left) */
  light?: number;
  man?: DollPos | null;
  keeper?: (DollPos & { veil?: number; ring?: number; mopU?: number }) | null;
  stranger?: (DollPos & { mopU?: number; bucket?: boolean }) | null;
  /** the ring box in the man's hand: 0 shut .. 1 open, the ring shining */
  ringBox?: number;
  /** the INCOME tag: `flip` 0 (£21,400) .. 1 (£0), `drop` 0..1 how far it has fallen on its string */
  tag?: { flip?: number; drop?: number; amount?: string };
  /** the coin meter's reading (pounds) and a jolt 0..1 (a peck), `cracked` 0..1, `spin` blur 0..1 */
  meter?: { value?: number; spin?: number; jolt?: number; cracked?: number; garble?: number; stopped?: number };
  /** coins tinkling out of the chute since this time (seconds of t), how many */
  coins?: { t0: number; n: number };
  /** the cuckoo: out 0..1 on its spring, `peck` 0..1 (lunge), `t0` of its pop */
  cuckoo?: { out?: number; peck?: number };
  /** the door: 0 shut .. 1 open */
  door?: number;
  /** the floor's shine after mopping 0..1 */
  shine?: number;
  /** the tiny confetti of the doll wedding since this time */
  confetti?: number;
  /** the attic's tiny lamp */
  attic?: number;
  /** grade: 'before' (sepia, a wage packet on the mantel) */
  before?: boolean;
  /** detail: skip the fine work at small scales */
  small?: boolean;
}

const WOOD = '#b98552', WOOD_D = '#7a5232', WOOD_L = '#d6a874';

/** The doll's house at (x, y) (the front middle of its floor), scale s (px per unit). */
export function dollHouse(c: C2, g: C2, x: number, y: number, s: number, st: HouseState) {
  const t = st.t, light = st.light ?? 1, small = !!st.small;
  c.save(); c.translate(x, y); c.scale(s, s);
  g.save(); g.translate(x, y); g.scale(s, s);
  c.lineJoin = 'round'; c.lineCap = 'round';
  // the base board
  c.fillStyle = WOOD_D; c.beginPath(); c.roundRect(-540, 0, 1080, 34, 6); c.fill();
  c.fillStyle = WOOD; c.fillRect(-540, 0, 1080, 10);
  // ---------------------------------------------------------------- the parlour's back wall
  const wallG = c.createLinearGradient(-480, 0, 480, 0);
  wallG.addColorStop(0, mixHex('#c98d8d', '#f2c9b0', light * 0.8)); wallG.addColorStop(1, mixHex('#8d6070', '#c99890', light * 0.6));
  c.fillStyle = wallG; c.fillRect(-476, DH.wallTop, 952, DH.back - DH.wallTop + 2);
  if (!small) { // wallpaper: thin stripes and little sprigs
    c.fillStyle = 'rgba(255,255,255,0.13)';
    for (let k = -470; k < 476; k += 34) c.fillRect(k, DH.wallTop, 6, DH.back - DH.wallTop - 92);
    c.fillStyle = 'rgba(120,60,80,0.25)';
    for (let k = -453; k < 476; k += 68) for (let j = DH.wallTop + 30; j < DH.back - 110; j += 60) { c.beginPath(); c.arc(k + ((j / 60) % 2 ? 17 : 0), j, 4, 0, TAU); c.fill(); }
  }
  // the dado and skirting
  c.fillStyle = mixHex('#6a4630', '#a8784e', light * 0.7); c.fillRect(-476, DH.back - 92, 952, 92);
  c.strokeStyle = 'rgba(40,20,10,0.35)'; c.lineWidth = 3;
  if (!small) for (let k = -440; k < 476; k += 120) c.strokeRect(k, DH.back - 80, 96, 64);
  c.fillStyle = WOOD_D; c.fillRect(-476, DH.back - 96, 952, 8);
  // the window with the same moon over the same sea
  { const w = DH.win; c.fillStyle = '#101a44'; c.fillRect(w.x - w.w / 2, w.y - w.h / 2, w.w, w.h);
    c.fillStyle = '#20307a'; c.fillRect(w.x - w.w / 2, w.y + 8, w.w, w.h / 2 - 8);
    c.fillStyle = '#f4efe1'; c.beginPath(); c.arc(w.x + 22, w.y - 26, 11, 0, TAU); c.fill();
    g.fillStyle = 'rgba(244,239,225,0.25)'; g.beginPath(); g.arc(w.x + 22, w.y - 26, 22, 0, TAU); g.fill();
    c.strokeStyle = WOOD_L; c.lineWidth = 8; c.strokeRect(w.x - w.w / 2, w.y - w.h / 2, w.w, w.h);
    c.lineWidth = 4; c.beginPath(); c.moveTo(w.x, w.y - w.h / 2); c.lineTo(w.x, w.y + w.h / 2); c.moveTo(w.x - w.w / 2, w.y); c.lineTo(w.x + w.w / 2, w.y); c.stroke();
    c.fillStyle = '#e07a9a'; // curtains
    for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(w.x + sd * (w.w / 2 + 14), w.y - w.h / 2 - 12); c.quadraticCurveTo(w.x + sd * (w.w / 2 - 6), w.y, w.x + sd * (w.w / 2 + 10), w.y + w.h / 2 + 10); c.lineTo(w.x + sd * (w.w / 2 + 26), w.y + w.h / 2 + 10); c.lineTo(w.x + sd * (w.w / 2 + 26), w.y - w.h / 2 - 12); c.closePath(); c.fill(); }
  }
  // the front door, opening inward (hinged on its left), the INCOME tag on its knob
  door(c, g, st);
  // the kitchen corner: a tiny stove (a kettle steaming), the sink, a plate rack
  kitchen(c, g, t, small);
  // the mantel shelf over the sofa: a wage packet (before), a wedding photo (after)
  c.fillStyle = WOOD_D; c.fillRect(-236, -262, 176, 10);
  if (st.before) { c.fillStyle = '#e9dcc0'; c.save(); c.translate(-180, -280); c.rotate(-0.06); c.fillRect(-26, -16, 52, 32); c.fillStyle = '#6a4630'; c.font = font(FAM.monoB(), 11); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('WAGES', 0, 1); c.restore(); }
  else { c.fillStyle = '#e8c070'; c.fillRect(-206, -306, 40, 46); c.fillStyle = '#f4efe6'; c.fillRect(-201, -301, 30, 36); c.fillStyle = '#5a4a6a'; for (const dx of [-10, 6]) { c.beginPath(); c.arc(-186 + dx, -290, 5, 0, TAU); c.fill(); c.fillRect(-191 + dx, -285, 10, 18); } }
  c.fillStyle = '#7ab0d0'; c.beginPath(); c.ellipse(-110, -270, 14, 9, 0, 0, TAU); c.fill(); // a vase
  c.fillStyle = HEX.pink; for (const [dx, dy] of [[-6, -18], [4, -22], [0, -14]] as const) { c.beginPath(); c.arc(-110 + dx, -270 + dy, 5, 0, TAU); c.fill(); }
  // the cuckoo clock and the coin meter
  cuckooClock(c, g, t, st);
  coinMeter(c, g, t, st);
  // ---------------------------------------------------------------- the floor: checker tiles in a little perspective
  const fl = DH.back;
  c.fillStyle = mixHex('#5a4636', '#9a7a5a', light * 0.7); c.fillRect(-476, fl, 952, -fl);
  const rows = 3, cols = 18;
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
    if ((r + k) % 2) continue;
    const y0 = fl + (-fl) * (r / rows), y1 = fl + (-fl) * ((r + 1) / rows);
    const w0 = 952 * (0.94 + 0.06 * (r / rows)), w1 = 952 * (0.94 + 0.06 * ((r + 1) / rows));
    c.fillStyle = mixHex('#e8dcc8', '#fff6e4', light * 0.6);
    c.beginPath(); c.moveTo(-w0 / 2 + (k / cols) * w0, y0); c.lineTo(-w0 / 2 + ((k + 1) / cols) * w0, y0); c.lineTo(-w1 / 2 + ((k + 1) / cols) * w1, y1); c.lineTo(-w1 / 2 + (k / cols) * w1, y1); c.closePath(); c.fill();
  }
  const shine = clamp(st.shine ?? 0);
  if (shine > 0) { // a mopped shine: a bright streak and sparkles across the tiles
    const sg = c.createLinearGradient(-476, 0, 476, 0);
    sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, `rgba(255,255,255,${0.35 * shine})`); sg.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = sg; c.fillRect(-476, fl, 952, -fl);
    for (let i = 0; i < 6; i++) { const u = (t * 0.6 + h01(i, 401)) % 1, a = Math.sin(u * PI) * shine; star4(g, -400 + 800 * h01(i, 402), fl * (0.2 + 0.6 * h01(i, 403)), 10 * a, rgbaHex('#ffffff', 0.9 * a)); }
  }
  // the sofa
  sofa(c, light);
  // the coins on the floor, tinkling out of the meter's chute
  if (st.coins) coinsOut(c, g, t, st.coins.t0, st.coins.n);
  // the dolls
  if (st.man) doll(c, g, 'man', st.man, t, { ringBox: st.ringBox });
  if (st.keeper) doll(c, g, 'keeper', st.keeper, t, { veil: st.keeper.veil, mopU: st.keeper.mopU });
  if (st.stranger) doll(c, g, 'stranger', st.stranger, t, { mopU: st.stranger.mopU, bucket: st.stranger.bucket });
  if (st.confetti !== undefined) confetti(c, t, st.confetti);
  // ---------------------------------------------------------------- the cutaway's walls, the ceiling, the attic, the roof
  c.fillStyle = WOOD; c.fillRect(-500, DH.wallTop, 24, -DH.wallTop); c.fillRect(476, DH.wallTop, 24, -DH.wallTop);
  c.fillStyle = WOOD_L; c.fillRect(-500, DH.wallTop, 6, -DH.wallTop); c.fillRect(476, DH.wallTop, 6, -DH.wallTop);
  c.fillStyle = WOOD_D; c.fillRect(-500, DH.wallTop - 22, 1000, 22);
  c.fillStyle = WOOD_L; c.fillRect(-500, DH.wallTop - 22, 1000, 5);
  attic(c, g, t, st.attic ?? 1, small);
  roof(c, light, small);
  // the light from the big lamp (upper left), falling off to the right, and its shadow side
  const lg = c.createLinearGradient(-500, -700, 500, 0);
  lg.addColorStop(0, rgbaHex('#ffd9a0', 0.16 * light)); lg.addColorStop(0.55, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(20,10,30,0.28)');
  c.fillStyle = lg; c.fillRect(-560, DH.ridge, 1120, -DH.ridge + 34);
  c.restore(); g.restore();
}

function door(c: C2, g: C2, st: HouseState) {
  const d = DH.door, o = clamp(st.door ?? 0), x0 = d.x - d.w / 2, bot = DH.back + 4;
  // the frame and the night outside the open door
  c.fillStyle = WOOD_D; c.fillRect(x0 - 10, d.top - 10, d.w + 20, bot - d.top + 10);
  c.fillStyle = '#0c1230'; c.fillRect(x0, d.top, d.w, bot - d.top);
  c.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(x0 + 10 + 70 * h01(i, 410), d.top + 14 + 90 * h01(i, 411), 1.6, 0, TAU); c.fill(); }
  // the door leaf: hinged at its left edge, narrowing as it swings in
  const k = Math.cos(o * PI * 0.48);
  c.save(); c.translate(x0, 0); c.scale(Math.max(0.04, k), 1);
  c.fillStyle = '#3f6aa0'; c.fillRect(0, d.top, d.w, bot - d.top);
  c.strokeStyle = 'rgba(20,30,60,0.45)'; c.lineWidth = 4;
  c.strokeRect(12, d.top + 14, d.w - 24, 70); c.strokeRect(12, d.top + 100, d.w - 24, 86);
  c.fillStyle = '#f2c94c'; c.beginPath(); c.arc(DH.knob.x - x0, DH.knob.y, 7, 0, TAU); c.fill();
  c.restore();
  // the INCOME tag on its string from the knob: it falls (drops) and flips to £0
  const tg = st.tag; if (!tg) return;
  const kx = x0 + (d.w / 2) * Math.max(0.04, k), ky = d.top + 16;
  c.fillStyle = '#c9c4b8'; c.beginPath(); c.arc(kx, ky, 4, 0, TAU); c.fill();
  const drop = clamp(tg.drop ?? 0), fall = 24 + 40 * ease.outBack(drop, 2.6);
  const sw = 0.06 * Math.sin((st.t) * 2.3) + (drop > 0 && drop < 1 ? 0.25 * Math.sin(drop * 14) * (1 - drop) : 0);
  const tx = kx + Math.sin(sw) * fall, ty = ky + Math.cos(sw) * fall;
  c.strokeStyle = '#e8e0cc'; c.lineWidth = 2; c.beginPath(); c.moveTo(kx, ky); c.lineTo(tx, ty); c.stroke();
  const flip = clamp(tg.flip ?? 0), sc = Math.cos(flip * PI);
  c.save(); c.translate(tx, ty + 30); c.rotate(-sw * 0.6); c.scale(Math.max(0.03, Math.abs(sc)), 1);
  c.fillStyle = sc > 0 ? '#f4ead2' : '#fff2ea';
  c.beginPath(); c.moveTo(-52, -26); c.lineTo(40, -26); c.lineTo(56, 0); c.lineTo(40, 26); c.lineTo(-52, 26); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(120,90,50,0.6)'; c.lineWidth = 2; c.stroke();
  c.fillStyle = '#c9a24a'; c.beginPath(); c.arc(38, 0, 5, 0, TAU); c.fill();
  c.fillStyle = 'rgba(60,40,30,0.9)'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = font(FAM.monoB(), 13); c.fillText('INCOME', -8, -12);
  c.font = font(FAM.monoB(), 21); c.fillStyle = sc > 0 ? '#2a6a3a' : '#d0303a'; c.fillText(sc > 0 ? (tg.amount ?? '£21,400') : '£0', -8, 10);
  c.restore();
  void g;
}

function kitchen(c: C2, g: C2, t: number, small: boolean) {
  const sx = DH.stove.x, b = DH.back;
  // the stove: black iron, two rings, a kettle with a curl of steam
  c.fillStyle = '#2a2a33'; c.beginPath(); c.roundRect(sx - 44, b - 120, 88, 120, 6); c.fill();
  c.fillStyle = '#3a3a46'; c.fillRect(sx - 36, b - 96, 72, 50);
  c.fillStyle = '#ff8a2a'; c.fillRect(sx - 30, b - 62, 60, 8);
  c.fillStyle = '#c9c4b8'; c.beginPath(); c.ellipse(sx + 6, b - 136, 24, 18, 0, 0, TAU); c.fill();
  c.strokeStyle = '#c9c4b8'; c.lineWidth = 5; c.beginPath(); c.arc(sx + 6, b - 154, 12, PI, TAU); c.stroke();
  c.beginPath(); c.moveTo(sx + 26, b - 142); c.lineTo(sx + 40, b - 156); c.stroke();
  if (!small) { c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 4; c.beginPath(); for (let i = 0; i <= 10; i++) { const u = i / 10, px = sx + 42 + Math.sin(t * 3 + u * 6) * 8, py = b - 158 - u * 60; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); }
  // the sink cupboard and a tap
  const kx = DH.sink.x;
  c.fillStyle = '#e6e0d2'; c.fillRect(kx - 40, b - 100, 80, 100);
  c.strokeStyle = 'rgba(90,70,50,0.4)'; c.lineWidth = 3; c.strokeRect(kx - 34, b - 80, 30, 70); c.strokeRect(kx + 4, b - 80, 30, 70);
  c.fillStyle = '#b8c4cc'; c.fillRect(kx - 44, b - 108, 88, 10);
  c.strokeStyle = '#b8c4cc'; c.lineWidth = 6; c.beginPath(); c.moveTo(kx, b - 108); c.lineTo(kx, b - 134); c.lineTo(kx + 16, b - 134); c.stroke();
  // the plate rack above
  c.fillStyle = WOOD_D; c.fillRect(sx - 50, b - 236, 200, 8);
  for (let i = 0; i < 6; i++) { c.fillStyle = ['#f4efe6', '#7ab0d0', '#f4efe6', HEX.coral, '#f4efe6', '#7ab0d0'][i]!; c.beginPath(); c.ellipse(sx - 34 + i * 30, b - 254, 12, 18, 0, 0, TAU); c.fill(); }
  void g;
}

function cuckooClock(c: C2, g: C2, t: number, st: HouseState) {
  const { x, y } = DH.clock, cu = st.cuckoo ?? {};
  // the pendulum and the weights on their chains, below the case
  const sw = 0.32 * Math.sin(t * PI * 2 * 0.8);
  c.strokeStyle = '#7a5232'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(x, y + 40); c.lineTo(x + Math.sin(sw) * 96, y + 40 + Math.cos(sw) * 96); c.stroke();
  c.fillStyle = '#e8c070'; c.beginPath(); c.arc(x + Math.sin(sw) * 96, y + 40 + Math.cos(sw) * 96, 11, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(80,60,40,0.8)'; c.lineWidth = 1.5;
  for (const [dx, l] of [[-16, 74 + 6 * Math.sin(t * 0.3)], [16, 92 - 6 * Math.sin(t * 0.3)]] as const) {
    c.beginPath(); c.moveTo(x + dx, y + 40); c.lineTo(x + dx, y + 40 + l); c.stroke();
    c.fillStyle = '#5a3a20'; c.beginPath(); c.ellipse(x + dx, y + 52 + l, 7, 14, 0, 0, TAU); c.fill();
  }
  // the case: a little chalet with a pitched roof and carved leaves
  c.fillStyle = '#6a4224'; c.beginPath(); c.moveTo(x - 46, y - 40); c.lineTo(x, y - 84); c.lineTo(x + 46, y - 40); c.closePath(); c.fill();
  c.fillStyle = '#8a5a32'; c.beginPath(); c.roundRect(x - 38, y - 44, 76, 88, 4); c.fill();
  c.fillStyle = '#3e7a3a'; for (const sd of [-1, 1]) { c.beginPath(); c.ellipse(x + sd * 34, y - 54, 12, 6, sd * 0.6, 0, TAU); c.fill(); }
  // the dial: real time
  c.fillStyle = '#f4efe1'; c.beginPath(); c.arc(x, y + 8, 24, 0, TAU); c.fill();
  c.strokeStyle = '#3a2a20'; c.lineWidth = 2;
  for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; c.beginPath(); c.moveTo(x + Math.sin(a) * 19, y + 8 - Math.cos(a) * 19); c.lineTo(x + Math.sin(a) * 22, y + 8 - Math.cos(a) * 22); c.stroke(); }
  c.lineWidth = 3.5; c.beginPath(); c.moveTo(x, y + 8); c.lineTo(x + Math.sin(4 / 12 * TAU) * 12, y + 8 - Math.cos(4 / 12 * TAU) * 12); c.stroke();
  const mn = (t * 0.5) % TAU; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x, y + 8); c.lineTo(x + Math.sin(mn) * 18, y + 8 - Math.cos(mn) * 18); c.stroke();
  // the bird's little door, and the bird on its spring
  const out = clamp(cu.out ?? 0), peck = clamp(cu.peck ?? 0);
  c.fillStyle = '#2a1a10'; c.fillRect(x - 13, y - 36, 26, 22);
  if (out > 0) {
    // the spring (a zigzag) from the door out towards the meter on the right, longer on a peck
    const len = 14 + 52 * ease.outBack(out) + 64 * peck, ang = -0.25 * out + 0.15 * peck;
    const ex = x + Math.cos(ang) * len, ey = y - 25 + Math.sin(ang) * len;
    c.strokeStyle = '#c9c4b8'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x, y - 25);
    for (let i = 1; i <= 8; i++) { const u = i / 8, px = x + (ex - x) * u, py = y - 25 + (ey - (y - 25)) * u + (i % 2 ? -6 : 6) * (i < 8 ? 1 : 0); c.lineTo(px, py); }
    c.stroke();
    bird(c, ex, ey, 1 + 0.15 * peck, peck);
  }
  // the little doors swung open
  if (out > 0) { c.fillStyle = '#8a5a32'; c.fillRect(x - 24, y - 36, 10, 22); c.fillRect(x + 14, y - 36, 10, 22); }
  void g;
}

function bird(c: C2, x: number, y: number, s: number, peck: number) {
  c.save(); c.translate(x, y); c.scale(s, s); c.rotate(0.35 * peck);
  c.fillStyle = '#e8b04a'; c.beginPath(); c.ellipse(0, 0, 16, 12, 0, 0, TAU); c.fill();
  c.fillStyle = '#c6503a'; c.beginPath(); c.ellipse(-4, 4, 9, 6, -0.3, 0, TAU); c.fill();   // the wing
  c.fillStyle = '#e8b04a'; c.beginPath(); c.arc(12, -9, 9, 0, TAU); c.fill();                 // the head
  c.fillStyle = '#ff8a2a'; c.beginPath(); c.moveTo(19, -11); c.lineTo(32 + 6 * peck, -8); c.lineTo(19, -5); c.closePath(); c.fill();   // the beak
  c.fillStyle = '#1a1010'; c.beginPath(); c.arc(14, -12, 2.2, 0, TAU); c.fill();
  c.fillStyle = '#c6503a'; c.beginPath(); c.moveTo(-14, -2); c.lineTo(-26, -8); c.lineTo(-24, 4); c.closePath(); c.fill(); // the tail
  c.restore();
}

/** The toy coin meter on the parlour wall: a slot, a window of rolling digits, a chute and a tray. */
function coinMeter(c: C2, g: C2, t: number, st: HouseState) {
  const { x, y } = DH.meter, m = st.meter ?? {}, jolt = clamp(m.jolt ?? 0);
  c.save(); c.translate(x + 3 * Math.sin(jolt * 40) * jolt, y); c.rotate(0.05 * jolt * Math.sin(jolt * 30));
  // the box
  c.fillStyle = '#5a6a7a'; c.beginPath(); c.roundRect(-52, -70, 104, 150, 10); c.fill();
  c.fillStyle = '#7a8a9c'; c.beginPath(); c.roundRect(-46, -64, 92, 138, 8); c.fill();
  c.fillStyle = '#2a3440'; c.fillRect(-14, -58, 28, 6);                       // the coin slot
  // the digit window: five wheels, rolling (the last one blurs when it spins)
  c.fillStyle = '#121418'; c.fillRect(-42, -38, 84, 34);
  const v = Math.max(0, Math.floor(m.value ?? 0)), spin = clamp(m.spin ?? 0), garble = clamp(m.garble ?? 0);
  const digits = String(v).padStart(5, '0').slice(-5);
  c.font = font(FAM.monoB(), 22); c.textAlign = 'center'; c.textBaseline = 'middle';
  for (let i = 0; i < 5; i++) {
    const dx = -32 + i * 16;
    let ch = digits[i]!;
    if (garble > 0 && h01(Math.floor(t * 20), i, 77) < garble) ch = '?#*%!'[Math.floor(h01(Math.floor(t * 20), i, 78) * 5)]!;
    c.fillStyle = i < 2 ? '#f4efe1' : '#78d63a';
    if (spin > 0 && i >= 3) { c.globalAlpha = 0.55; c.fillText(String((+ch + 1) % 10), dx, -21 - 10 * spin); c.globalAlpha = 1; }
    c.fillText(ch, dx, -21 + (spin > 0 && i >= 3 ? 6 * spin : 0));
  }
  c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(-42, -38, 84, 12);
  g.fillStyle = rgbaHex(HEX.lime, 0.18 + 0.2 * spin); g.fillRect(x - 44, y - 40, 88, 38);
  // the pound sign plate, the crank and the chute
  c.fillStyle = '#e8c070'; c.font = font(FAM.monoB(), 26); c.fillText('£', 0, 18);
  c.fillStyle = '#c9a24a'; c.beginPath(); c.arc(30, 22, 8, 0, TAU); c.fill();
  c.strokeStyle = '#c9a24a'; c.lineWidth = 4; const ca = t * 9 * spin; c.beginPath(); c.moveTo(30, 22); c.lineTo(30 + Math.cos(ca) * 16, 22 + Math.sin(ca) * 16); c.stroke();
  c.fillStyle = '#2a3440'; c.fillRect(-18, 52, 36, 18);
  // a stopped flag (the counting stops)
  const sp = clamp(m.stopped ?? 0);
  if (sp > 0) {
    c.save(); c.translate(-46, -64); c.rotate(-PI / 2 + PI / 2 * ease.outBack(sp));
    c.fillStyle = '#d0303a'; c.fillRect(0, -10, 54, 20); c.fillStyle = '#fff'; c.font = font(FAM.monoB(), 12); c.fillText('STOP', 27, 1); c.restore();
  }
  // a crack across the glass (the peck)
  const cr = clamp(m.cracked ?? 0);
  if (cr > 0) {
    c.strokeStyle = `rgba(240,250,255,${0.9 * cr})`; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-6, -38); c.lineTo(2, -26); c.lineTo(-10, -18); c.lineTo(4, -4); c.moveTo(2, -26); c.lineTo(20, -30); c.lineTo(32, -20); c.stroke();
  }
  c.restore();
  // the tray under the chute
  c.fillStyle = '#c9a24a'; c.beginPath(); c.moveTo(x - 40, DH.tray.y); c.lineTo(x + 40, DH.tray.y); c.lineTo(x + 32, DH.tray.y + 18); c.lineTo(x - 32, DH.tray.y + 18); c.closePath(); c.fill();
}

/** Coins tinkling out of the chute: each pops out, falls into the tray or bounces onto the floor, glinting. */
function coinsOut(c: C2, g: C2, t: number, t0: number, n: number) {
  const age = t - t0; if (age < 0) return;
  for (let i = 0; i < n; i++) {
    const ti = i * 0.09, a = age - ti; if (a < 0) continue;
    const vx = (h01(i, 420) - 0.6) * 160, vy = -90 - 60 * h01(i, 421), gr = 900;
    let px = DH.meter.x + vx * a, py = DH.tray.y - 60 + vy * a + 0.5 * gr * a * a;
    const land = i % 3 === 0 ? DH.tray.y + 4 : DH.floorY - 10 * h01(i, 422);
    if (py > land) { // landed: settle with a last little bounce
      const ta = (-vy + Math.sqrt(vy * vy + 2 * gr * (land - (DH.tray.y - 60)))) / gr;
      px = DH.meter.x + vx * ta + (i % 3 ? vx * 0.15 * Math.min(1, (a - ta) * 3) : 0); py = land - 12 * Math.max(0, Math.sin(Math.min(PI, (a - ta) * 9))) * 0.6;
    }
    const spin = Math.abs(Math.cos(a * 14 + i));
    c.fillStyle = '#f2c94c'; c.beginPath(); c.ellipse(px, py, 11 * Math.max(0.2, spin), 11, 0, 0, TAU); c.fill();
    c.strokeStyle = '#a8842a'; c.lineWidth = 2; c.stroke();
    if (a < 0.6) star4(g, px + 6, py - 8, 12 * (1 - a / 0.6), rgbaHex('#fff6c8', 0.9));
  }
}

function sofa(c: C2, light: number) {
  const { x0, x1 } = DH.sofa, b = DH.back + 18;
  const col = mixHex('#5a3a6a', '#9a5a8a', light * 0.6);
  c.fillStyle = mixHex(col, '#000000', 0.25); c.beginPath(); c.roundRect(x0, b - 150, x1 - x0, 90, 18); c.fill();      // the back
  c.fillStyle = col; c.beginPath(); c.roundRect(x0 - 8, b - 74, x1 - x0 + 16, 56, 12); c.fill();                     // the seat
  for (const ax of [x0 - 16, x1 - 10]) { c.beginPath(); c.roundRect(ax, b - 108, 26, 92, 12); c.fill(); }          // the arms
  c.fillStyle = HEX.yellow; c.beginPath(); c.roundRect(x0 + 18, b - 132, 44, 40, 10); c.fill();                     // a cushion
  c.fillStyle = WOOD_D; c.fillRect(x0, b - 18, 8, 16); c.fillRect(x1 - 8, b - 18, 8, 16);
}

function attic(c: C2, g: C2, t: number, lamp: number, small: boolean) {
  // the attic's back wall inside the roof's triangle
  const top = DH.ridge + 70, base = DH.wallTop - 22;
  c.fillStyle = '#4a3a5a';
  c.beginPath(); c.moveTo(-470, base); c.lineTo(0, top); c.lineTo(470, base); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,220,180,0.06)'; for (let i = 0; i < 14; i++) { c.beginPath(); c.arc(-300 + 600 * h01(i, 430), base - 40 - 150 * h01(i, 431), 3, 0, TAU); c.fill(); }
  // a round window and the moon
  c.fillStyle = '#101a44'; c.beginPath(); c.arc(0, top + 110, 38, 0, TAU); c.fill();
  c.fillStyle = '#f4efe1'; c.beginPath(); c.arc(10, top + 100, 9, 0, TAU); c.fill();
  c.strokeStyle = WOOD_L; c.lineWidth = 7; c.beginPath(); c.arc(0, top + 110, 38, 0, TAU); c.stroke();
  // the tiny bed: a quilt of fish (the girl's bed in miniature), a tiny lamp on, and a tiny mask on its post
  const bx = -150, by = base - 4;
  c.fillStyle = WOOD_D; c.fillRect(bx - 110, by - 70, 12, 70); c.fillRect(bx + 100, by - 46, 12, 46);
  c.fillStyle = '#f4efe6'; c.fillRect(bx - 98, by - 40, 200, 24);
  c.fillStyle = '#3a5aa0'; c.beginPath(); c.moveTo(bx - 50, by - 40); c.quadraticCurveTo(bx + 20, by - 62, bx + 104, by - 40); c.lineTo(bx + 104, by - 12); c.lineTo(bx - 50, by - 12); c.closePath(); c.fill();
  if (!small) { c.fillStyle = 'rgba(255,210,63,0.6)'; for (let k = 0; k < 4; k++) { c.beginPath(); c.ellipse(bx - 20 + k * 34, by - 28, 7, 4, 0, 0, TAU); c.fill(); } }
  c.fillStyle = '#f4efe6'; c.beginPath(); c.ellipse(bx - 76, by - 50, 22, 12, 0, 0, TAU); c.fill();
  c.fillStyle = HEX.coral; c.fillRect(bx + 98, by - 60, 16, 10);
  const lx = 150, ly = base - 4;
  c.fillStyle = WOOD_D; c.fillRect(lx - 30, ly - 40, 60, 40);
  c.fillStyle = '#7a5a3a'; c.fillRect(lx - 3, ly - 76, 6, 36);
  c.fillStyle = mixHex('#8a6a4a', '#ffd9a0', lamp); c.beginPath(); c.moveTo(lx - 22, ly - 76); c.lineTo(lx + 22, ly - 76); c.lineTo(lx + 14, ly - 100); c.lineTo(lx - 14, ly - 100); c.closePath(); c.fill();
  if (lamp > 0) { const gg = g.createRadialGradient(lx, ly - 88, 2, lx, ly - 88, 90); gg.addColorStop(0, rgbaHex('#ffd9a0', 0.35 * lamp)); gg.addColorStop(1, rgbaHex('#ffd9a0', 0)); g.fillStyle = gg; g.fillRect(lx - 90, ly - 180, 180, 180); }
  void t;
}

function roof(c: C2, light: number, small: boolean) {
  const e = DH.eave, r = DH.ridge, th = 26;
  // the roof's cut edge (the cutaway shows its thickness) and its shingles on the outside edges
  c.fillStyle = mixHex('#8a3a3a', '#c45a4a', light * 0.6);
  c.beginPath(); c.moveTo(-e.x, e.y); c.lineTo(0, r); c.lineTo(e.x, e.y); c.lineTo(e.x - 30, e.y + 8); c.lineTo(0, r + th + 14); c.lineTo(-e.x + 30, e.y + 8); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(60,20,20,0.5)'; c.lineWidth = 3;
  if (!small) for (let i = 1; i < 9; i++) { const u = i / 9; for (const sd of [-1, 1]) { const px = sd * e.x * (1 - u), py = e.y + (r - e.y) * u; c.beginPath(); c.moveTo(px, py); c.lineTo(px - sd * 18, py + 26); c.stroke(); } }
  // the chimney on the right slope
  const cx = 250, cy = e.y + (r - e.y) * (1 - cx / e.x);
  c.fillStyle = '#9a5a4a'; c.fillRect(cx - 26, cy - 90, 52, 100);
  c.fillStyle = '#7a4a3a'; c.fillRect(cx - 32, cy - 100, 64, 16);
  c.strokeStyle = 'rgba(60,20,20,0.35)'; c.lineWidth = 2; if (!small) for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(cx - 26, cy - 70 + k * 22); c.lineTo(cx + 26, cy - 70 + k * 22); c.stroke(); }
  // the eaves' trim
  c.strokeStyle = WOOD_L; c.lineWidth = 8;
  c.beginPath(); c.moveTo(-e.x, e.y); c.lineTo(0, r); c.lineTo(e.x, e.y); c.stroke();
}

/** The roof's surface height at house-x (for Rai to sit on). */
export function roofY(x: number): number { return DH.eave.y + (DH.ridge - DH.eave.y) * (1 - Math.abs(x) / DH.eave.x); }

function confetti(c: C2, t: number, t0: number) {
  const age = t - t0; if (age < 0 || age > 3) return;
  for (let i = 0; i < 26; i++) {
    const x = -260 + 300 * h01(i, 440) + 30 * Math.sin(age * 3 + i), y = -330 + age * (90 + 60 * h01(i, 441)) - 40 * h01(i, 442);
    if (y > DH.floorY) continue;
    c.save(); c.translate(x, y); c.rotate(age * 6 * (h01(i, 443) - 0.5));
    c.fillStyle = [HEX.pink, HEX.yellow, '#ffffff', HEX.cyan, HEX.lime][i % 5]!; c.globalAlpha = Math.min(1, (3 - age) * 1.5);
    c.fillRect(-5, -3, 10, 6); c.restore();
  }
}

// ------------------------------------------------------------------ the peg dolls

const DOLL = {
  man: { body: '#2a3a6a', trim: '#f4efe6', hair: '#4a2a18', acc: '#d0303a' },
  keeper: { body: '#9a7ab8', trim: '#ffffff', hair: '#6a3a20', acc: '#ffffff' },
  stranger: { body: '#3a7a4a', trim: '#e8d8b0', hair: '#c9a060', acc: '#4a4a3a' },
};

/** A wooden peg doll standing at (p.x, p.y) on the floor, 170 units tall, faceless; arms by pose. */
function doll(c: C2, g: C2, kind: keyof typeof DOLL, p: DollPos, t: number, o: { ringBox?: number; veil?: number; mopU?: number; bucket?: boolean }) {
  const D = DOLL[kind], f = p.flip ? -1 : 1, show = clamp(p.show ?? 1);
  if (show <= 0) return;
  const y0 = (p.y ?? DH.floorY) - (p.hop ?? 0) * 30;
  c.save(); c.globalAlpha *= show; c.translate(p.x, y0); c.rotate((p.tilt ?? 0) * f);
  const bob = Math.sin(t * 2.2 + p.x) * 1.5;
  // the contact shadow
  c.fillStyle = 'rgba(40,20,20,0.25)'; c.beginPath(); c.ellipse(0, 4 + (p.hop ?? 0) * 30, 40, 8, 0, 0, TAU); c.fill();
  // the body: a rounded bell (skirt for the keeper, a coat for the man, overalls for the stranger)
  c.fillStyle = D.body;
  c.beginPath(); c.moveTo(-34, 0); c.quadraticCurveTo(-30, -70, -22, -108 + bob); c.lineTo(22, -108 + bob); c.quadraticCurveTo(30, -70, 34, 0); c.closePath(); c.fill();
  c.fillStyle = 'rgba(0,0,0,0.15)'; c.beginPath(); c.moveTo(8, 0); c.quadraticCurveTo(14, -60, 12, -108 + bob); c.lineTo(22, -108 + bob); c.quadraticCurveTo(30, -70, 34, 0); c.closePath(); c.fill();
  if (kind === 'keeper') { // the apron
    c.fillStyle = D.trim; c.beginPath(); c.moveTo(-16, -96 + bob); c.lineTo(16, -96 + bob); c.lineTo(22, -10); c.lineTo(-22, -10); c.closePath(); c.fill();
    c.strokeStyle = D.trim; c.lineWidth = 3; c.beginPath(); c.moveTo(-18, -100 + bob); c.lineTo(-24, -76); c.moveTo(18, -100 + bob); c.lineTo(24, -76); c.stroke();
  } else if (kind === 'man') { // the shirt front and the bow tie
    c.fillStyle = D.trim; c.beginPath(); c.moveTo(-8, -108 + bob); c.lineTo(8, -108 + bob); c.lineTo(0, -66); c.closePath(); c.fill();
    c.fillStyle = D.acc; c.beginPath(); c.moveTo(0, -102 + bob); c.lineTo(-10, -108 + bob); c.lineTo(-10, -96 + bob); c.closePath(); c.moveTo(0, -102 + bob); c.lineTo(10, -108 + bob); c.lineTo(10, -96 + bob); c.closePath(); c.fill();
    c.fillStyle = '#f2c94c'; for (const by of [-58, -38]) { c.beginPath(); c.arc(0, by, 2.5, 0, TAU); c.fill(); }
  } else { // the overalls' bib and straps
    c.fillStyle = mixHex(D.body, '#ffffff', 0.15); c.fillRect(-14, -96 + bob, 28, 30);
    c.fillStyle = '#e8c070'; for (const sd of [-1, 1]) { c.beginPath(); c.arc(sd * 10, -90 + bob, 2.5, 0, TAU); c.fill(); }
  }
  // the head: a wooden ball with painted hair
  const hy = -132 + bob;
  c.fillStyle = '#e8c49a'; c.beginPath(); c.arc(0, hy, 26, 0, TAU); c.fill();
  c.fillStyle = 'rgba(160,100,60,0.25)'; c.beginPath(); c.arc(6, hy + 4, 22, -0.4, 1.8); c.fill();
  c.fillStyle = D.hair;
  if (kind === 'keeper') { c.beginPath(); c.arc(0, hy - 4, 27, PI, TAU); c.fill(); c.beginPath(); c.arc(-f * 20, hy - 14, 11, 0, TAU); c.fill();
    c.fillStyle = D.trim; c.beginPath(); c.ellipse(0, hy - 24, 22, 8, 0, 0, TAU); c.fill(); for (let k = -2; k <= 2; k++) { c.beginPath(); c.arc(k * 9, hy - 28, 5, 0, TAU); c.fill(); } }
  else if (kind === 'man') { c.beginPath(); c.arc(0, hy - 6, 27, PI * 1.05, TAU - 0.05); c.fill(); c.beginPath(); c.ellipse(-f * 10, hy - 22, 18, 8, f * 0.3, 0, TAU); c.fill(); }
  else { c.fillStyle = D.acc; c.beginPath(); c.ellipse(0, hy - 18, 30, 10, 0, PI, TAU); c.fill(); c.beginPath(); c.ellipse(f * 18, hy - 16, 22, 6, 0, 0, TAU); c.fill(); }
  // the veil (after the wedding)
  const veil = clamp(o.veil ?? 0);
  if (veil > 0) {
    c.fillStyle = `rgba(255,255,255,${0.55 * veil})`;
    c.beginPath(); c.moveTo(-24, hy - 22); c.quadraticCurveTo(-f * 60, hy + 30, -f * 46, -40 + 8 * Math.sin(t * 2)); c.lineTo(-f * 10, -40); c.quadraticCurveTo(f * 20, hy, 24, hy - 22); c.closePath(); c.fill();
    c.fillStyle = HEX.pink; for (let k = -1; k <= 1; k++) { c.beginPath(); c.arc(k * 10, hy - 30, 5 * veil, 0, TAU); c.fill(); }
  }
  // the arms (wooden pegs), by pose
  const arm = (sx: number, sy: number, ex: number, ey: number) => { c.strokeStyle = D.body; c.lineWidth = 13; c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo((sx + ex) / 2 + 4, (sy + ey) / 2 + 6, ex, ey); c.stroke(); c.fillStyle = '#e8c49a'; c.beginPath(); c.arc(ex, ey, 7.5, 0, TAU); c.fill(); };
  const pose = p.pose ?? 'stand', sy = -100 + bob;
  const mopU = o.mopU ?? 0, mx = Math.sin(mopU * TAU) * 26;
  switch (pose) {
    case 'mop': { // both hands on the mop handle, the mop head swishing on the floor
      const hx = f * 30 + mx * 0.5, mh = { x: f * 58 + mx, y: 2 };
      mopStick(c, f * 18 + mx * 0.3, -110 + bob, mh.x, mh.y, kind === 'stranger');
      arm(-f * 18, sy, hx - f * 6, -84); arm(f * 18, sy, hx + f * 4, -60);
      break;
    }
    case 'ring': { // one arm forward holding up the ring box
      arm(-f * 18, sy, -f * 26, -50);
      const rx = f * 56, ry = -96;
      arm(f * 18, sy, rx - f * 4, ry + 8);
      ringBox(c, g, rx, ry - 6, clamp(o.ringBox ?? 0), t);
      break;
    }
    case 'hands': arm(-f * 18, sy, -f * 26, -50); arm(f * 18, sy, f * 46, -66); break;   // reaching out to hold a hand
    case 'pay': arm(-f * 18, sy, -f * 26, -50); arm(f * 18, sy, f * 54, -96); break;
    case 'cheer': arm(-f * 18, sy, -f * 30, -170); arm(f * 18, sy, f * 30, -170); break;
    case 'point': arm(-f * 18, sy, -f * 26, -50); arm(f * 18, sy, f * 60, -120); break;
    default: arm(-f * 18, sy, -f * 26, -50); arm(f * 18, sy, f * 26, -50);
  }
  if (kind === 'stranger' && o.bucket) { // his bucket beside him
    c.fillStyle = '#7a8a9c'; c.beginPath(); c.moveTo(-f * 70, -2); c.lineTo(-f * 62, -46); c.lineTo(-f * 26, -46); c.lineTo(-f * 34, -2); c.closePath(); c.fill();
    c.strokeStyle = '#5a6a7a'; c.lineWidth = 3; c.beginPath(); c.arc(-f * 46, -46, 20, PI, TAU); c.stroke();
    c.fillStyle = '#9fdcff'; c.fillRect(Math.min(-f * 62, -f * 26), -46, 36, 6);
  }
  c.restore();
  if (p.emote) { c.save(); c.globalAlpha *= show; emote(c, p.x, y0 - 132, 30, p.emote, t, p.emoteT0 ?? -1e9); c.restore(); }
}

function mopStick(c: C2, x0: number, y0: number, x1: number, y1: number, alt: boolean) {
  c.strokeStyle = '#c8a070'; c.lineWidth = 6; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1 - 16); c.stroke();
  c.fillStyle = alt ? '#e8e0c0' : '#f4f1ea';
  for (let k = -3; k <= 3; k++) { c.beginPath(); c.ellipse(x1 + k * 5, y1 - 6, 4, 12, k * 0.15, 0, TAU); c.fill(); }
}

function ringBox(c: C2, g: C2, x: number, y: number, open: number, t: number) {
  c.fillStyle = '#b02040'; c.beginPath(); c.roundRect(x - 13, y - 4, 26, 16, 3); c.fill();
  c.save(); c.translate(x - 13, y - 4); c.rotate(-1.9 * open); c.fillStyle = '#c8304a'; c.beginPath(); c.roundRect(0, -8, 26, 8, 3); c.fill(); c.restore();
  if (open > 0.3) {
    c.strokeStyle = '#f2c94c'; c.lineWidth = 3.5; c.beginPath(); c.arc(x, y - 6, 6, 0, TAU); c.stroke();
    const tw = 0.6 + 0.4 * Math.sin(t * 9);
    star4(g, x + 6, y - 14, 16 * tw * open, rgbaHex('#fff6c8', 0.95));
    star4(c, x + 6, y - 14, 7 * tw * open, '#ffffff');
  }
}

/** A heart over the two dolls holding hands (helper for 'same love'). */
export function loveHeart(c: C2, x: number, y: number, s: number, a: number) {
  if (a <= 0) return;
  c.save(); c.globalAlpha *= a; heartShape(c, x, y, s, HEX.pink); c.restore();
}
