// The girl's bedroom in the stilt hut (v2 `fever`, `dollhouse`, `dream`): one set for all three plates, so the room at
// 4 am, the doll's house on its dresser and the flooded dream are the same room. Built on the kit (_diver.ts: the
// mother, the ledger book, the pendant and chibi Rai, the slate) with the room drawn here to the plates' finish.
//
// Room coordinates are the 1920x1080 wide shot; plates move a camera over it (`applyCam`). The light is one lamp on
// the bedside table (warm, from the left) and the moon through the window (cool, behind the mother).
//
// The clues (each points somewhere):
// - the wall clock at 4:00, its red second hand ticking: "awake at four"; the nothing beat ticks on it;
// - the ledger book on the shelf among the storybooks, its eye shut: it wakes in `fever`, drifts in `dream`;
// - the toy rai stone on the shelf, and the slate on its nail with her drawing of Rai and a heart (from `touch`);
// - the mask on the footboard post and the striped towel drying over it: she dived tonight (`dive`);
// - her fins under the bed, sandy;
// - the pebble pendant on the bedside table by the lamp: Rai, on land, on watch;
// - the thermometer, the glass of water, the medicine and the bowl with the cold cloth: the fever, and the care;
// - the lunchbox packed on her school bag, a note with a heart on its lid: tomorrow's care, done tonight;
// - the electricity bill on the dresser, FINAL NOTICE, £82.40: the lamp burning all night costs real money;
// - the doll's house on the dresser, its INCOME tag on the door and the coin meter on its parlour wall: the next plate;
// - through the window the jetty she dived from and the sea Rai lies at the bottom of: the dream's flood;
// - glow-in-the-dark stars on the wall: a child's room; they become the dream's bubbles' light.
import { W, H, Layer2D } from '../../engine/gl';
import type { Line } from '../../engine/lyrics';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import { clamp, ease } from '../../engine/util';
import { h01, type RaiOpts } from '../_rai';
import { FAM, TAU, rgbaHex, mixHex, emote, type Emote } from '../_motifs';
import { star4, heart as heartShape } from '../_manga';
import { reed, fish } from '../_world';
import { mother, ledgerBook, pendantRai, slate, pencil, circlePts, type BookOpts } from './_diver';
import { dollHouse, type HouseState } from './dollhouse-house';

type C2 = CanvasRenderingContext2D;
const PI = Math.PI;

export const RM = {
  floor: 790,
  win: { x: 1150, y: 150, w: 280, h: 280 },
  clock: { x: 990, y: 210, r: 46 },
  shelf: { x0: 70, x1: 560, y: 300 },
  book: { x: 334, y: 252, s: 0.36 },
  slate: { x: 664, y: 452 },
  table: { x0: 96, x1: 272, top: 600, foot: 816 },
  lamp: { x: 166, y: 494 },
  pendant: { x: 246, y: 594 },
  bed: { x0: 318, x1: 966, top: 640, foot: 842 },
  girl: { x: 470, y: 552 },
  mom: { x: 800, y: 912, h: 350 },
  dresser: { x0: 1470, x1: 1846, top: 640, foot: 826 },
  house: { x: 1662, y: 640, s: 0.27 },
  bill: { x: 1496, y: 566 },
  lunch: { x: 1376, y: 840 },
  rug: { x: 1010, y: 944 },
};

// ------------------------------------------------------------------ the camera

export interface Cam { x: number; y: number; z: number; rot?: number }
export const WIDE: Cam = { x: W / 2, y: H / 2, z: 1 };
export function applyCam(c: C2, k: Cam) {
  c.translate(W / 2, H / 2); if (k.rot) c.rotate(k.rot); c.scale(k.z, k.z); c.translate(-k.x, -k.y);
}
/** Dolly between two framings (log zoom, the centre moving with the visible width). */
export function camLerp(a: Cam, b: Cam, u: number): Cam {
  const z = a.z * Math.pow(b.z / a.z, u);
  const v = Math.abs(1 / b.z - 1 / a.z) < 1e-9 ? u : (1 / z - 1 / a.z) / (1 / b.z - 1 / a.z);
  return { x: a.x + (b.x - a.x) * v, y: a.y + (b.y - a.y) * v, z, rot: (a.rot ?? 0) + ((b.rot ?? 0) - (a.rot ?? 0)) * u };
}
export function withCam(c: C2, g: C2, k: Cam, draw: () => void) {
  c.save(); g.save(); applyCam(c, k); applyCam(g, k); draw(); c.restore(); g.restore();
}

// ------------------------------------------------------------------ the room

export interface RoomOpts {
  t: number;
  /** the lamp 0..1 */
  lamp?: number;
  /** seconds on the wall clock past 4:00:00 */
  clockSec?: number;
  /** the mother: rocking amplitude (radians), asleep (the dream), her emote; `still` stops the rocking */
  mom?: { rock?: number; asleep?: boolean; emote?: Emote; emoteT0?: number; tilt?: number } | null;
  /** the girl: 'fever' (flushed, the thermometer), 'asleep', 'dream' (the mask on, half asleep); `turn` 0..1 her
   *  head turned towards her mother; `mask` 0..1 the mask drifting from the post to her face (the dream) */
  girl?: { state?: 'fever' | 'asleep' | 'dream'; turn?: number; mask?: number; glint?: 'plain' | 'droop' | 'spark' | 'wide' };
  /** the ledger book on the shelf (null: it has left the shelf) */
  book?: BookOpts | null;
  /** the pendant: chibi Rai popping out of it */
  pendant?: { pop?: number; rai?: Partial<RaiOpts>; glow?: number; s?: number } | null;
  /** the doll's house's state (it is on the dresser) */
  house?: Partial<HouseState>;
  /** the dream: the flood 0..1 and what grows in it */
  dream?: Dream;
  /** skip the mother's wall shadow (cheap close shots) */
  noShadow?: boolean;
  /** leave the shelf out (a shot draws it sharp in front of a soft room) */
  noShelf?: boolean;
}
export interface Dream {
  flood: number;          // the water rising through the room 0..1
  float?: number;         // the bed lifts off its legs and bobs 0..1
  reeds?: number;         // reeds grow from the rug 0..1
  fish?: number;          // fish swim through 0..1
  jelly?: number;         // the lamp becomes a jellyfish 0..1
  books?: number;         // the storybooks open, their pictures glow 0..1
  drift?: number;         // the shawl and the plait drift 0..1
}

/** The bedroom, everything in room coordinates (apply a camera first). */
export function bedroom(c: C2, g: C2, o: RoomOpts) {
  const t = o.t, lamp = o.lamp ?? 1, dr = o.dream, fl = dr ? clamp(dr.flood) : 0;
  wall(c, g, t, lamp, fl);
  windowView(c, g, t, fl);
  wallClock(c, g, t, o.clockSec ?? 0);
  glowStars(c, g, t, fl);
  slateOnNail(c, t);
  if (!o.noShelf) shelf(c, g, t, o.book, dr?.books ?? 0, lamp);
  if (o.mom !== null && !o.noShadow) momShadow(c, o, lamp * (1 - (dr?.jelly ?? 0)));
  floor(c, g, t, lamp, fl);
  dresser(c, g, t, o, lamp);
  bedsideTable(c, g, t, o, lamp, dr);
  bed(c, g, t, o, lamp, dr);
  pendant(c, g, t, o);
  lampLight(c, g, t, lamp * (1 - (dr?.jelly ?? 0) * 0.7), fl);
  if (o.mom !== null) rockingMother(c, g, t, o, lamp, dr);
  if (dr && fl > 0) floodOver(c, g, t, dr);
}

// ------------------------------------------------------------------ the back wall

function wall(c: C2, g: C2, t: number, lamp: number, fl: number) {
  const F = RM.floor;
  // painted planks, blue-violet at night, warmed near the lamp by the light pass
  const wg = c.createLinearGradient(0, -400, 0, F);
  wg.addColorStop(0, '#140e1c'); wg.addColorStop(0.45, mixHex('#2e2236', '#4a3440', lamp * 0.5)); wg.addColorStop(1, mixHex('#30243a', '#563c44', lamp * 0.5));
  c.fillStyle = wg; c.fillRect(-1200, -600, W + 2400, F + 600);
  c.strokeStyle = 'rgba(10,6,20,0.45)'; c.lineWidth = 2;
  for (let y = F - 44; y > -500; y -= 44) { c.beginPath(); c.moveTo(-1200, y); c.lineTo(W + 1200, y); c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,0.025)';
  for (let k = 0; k < 40; k++) { const y = F - 44 * (1 + (k % 17)), x = -200 + 2300 * h01(k, 3, 1); c.fillRect(x, y + 2, 120 + 200 * h01(k, 3, 2), 40); }
  // the skirting
  c.fillStyle = '#1c1428'; c.fillRect(-1200, F - 20, W + 2400, 20);
  c.fillStyle = 'rgba(255,220,180,0.08)'; c.fillRect(-1200, F - 20, W + 2400, 3);
  void g; void t; void fl;
}

function windowView(c: C2, g: C2, t: number, fl: number) {
  const { x, y, w, h } = RM.win, hz = y + h * 0.62;
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  const sg = c.createLinearGradient(0, y, 0, hz);
  sg.addColorStop(0, '#070a24'); sg.addColorStop(1, '#1d2766');
  c.fillStyle = sg; c.fillRect(x, y, w, hz - y);
  for (let i = 0; i < 26; i++) { const tw = 0.45 + 0.4 * Math.sin(t * (1 + h01(i, 12)) + i); c.fillStyle = `rgba(255,255,255,${tw})`; c.beginPath(); c.arc(x + w * h01(i, 10), y + (hz - y) * 0.85 * h01(i, 11), 1 + 1.2 * h01(i, 13), 0, TAU); c.fill(); }
  // the moon, low (it is four in the morning), and its path on the sea
  const mx = x + w * 0.74, my = y + h * 0.3;
  c.fillStyle = '#f6efd8'; c.beginPath(); c.arc(mx, my, 24, 0, TAU); c.fill();
  c.fillStyle = 'rgba(200,190,170,0.35)'; c.beginPath(); c.arc(mx - 7, my - 5, 6, 0, TAU); c.arc(mx + 8, my + 6, 4, 0, TAU); c.fill();
  g.fillStyle = 'rgba(246,239,216,0.32)'; g.beginPath(); g.arc(mx, my, 54, 0, TAU); g.fill();
  // a far island and the sea
  c.fillStyle = '#141a40'; c.beginPath(); c.moveTo(x, hz); c.quadraticCurveTo(x + 60, hz - 22, x + 130, hz); c.closePath(); c.fill();
  const seaG = c.createLinearGradient(0, hz, 0, y + h);
  seaG.addColorStop(0, '#1a2560'); seaG.addColorStop(1, '#0b1238');
  c.fillStyle = seaG; c.fillRect(x, hz, w, y + h - hz);
  for (let k = 0; k < 9; k++) { // the moon path, shimmering
    const yy = hz + 6 + k * 10, ww = 10 + k * 6 + 6 * Math.sin(t * 2.2 + k * 1.7);
    c.fillStyle = `rgba(246,239,216,${0.65 - k * 0.05})`; c.fillRect(mx - ww / 2 + 4 * Math.sin(t * 1.3 + k), yy, ww, 2.5);
  }
  // the jetty she dived from, out into the sea
  c.strokeStyle = '#0a0d24'; c.lineWidth = 6; c.beginPath(); c.moveTo(x - 10, y + h * 0.9); c.lineTo(x + w * 0.46, hz + 16); c.stroke();
  c.lineWidth = 3; for (let k = 0; k < 6; k++) { const u = k / 5, px = x - 10 + (w * 0.46 + 10) * u, py = y + h * 0.9 + (hz + 16 - y - h * 0.9) * u; c.beginPath(); c.moveTo(px, py); c.lineTo(px, py + 18 - 10 * u); c.stroke(); }
  if (fl > 0) { // in the dream the sea outside rises up the glass
    const lv = y + h - h * 1.3 * ease.inOutCubic(clamp(fl * 1.4));
    c.fillStyle = 'rgba(40,140,200,0.55)'; c.beginPath(); c.moveTo(x, y + h);
    for (let k = 0; k <= 10; k++) c.lineTo(x + (w * k) / 10, lv + 5 * Math.sin(k * 1.3 + t * 2.5)); c.lineTo(x + w, y + h); c.closePath(); c.fill();
  }
  c.restore();
  // the frame, the mullions, the sill with shells
  c.strokeStyle = '#4a3428'; c.lineWidth = 16; c.strokeRect(x - 4, y - 4, w + 8, h + 8);
  c.lineWidth = 7; c.beginPath(); c.moveTo(x + w / 2, y); c.lineTo(x + w / 2, y + h); c.moveTo(x, y + h * 0.48); c.lineTo(x + w, y + h * 0.48); c.stroke();
  c.fillStyle = '#5a4030'; c.fillRect(x - 28, y + h + 4, w + 56, 16);
  c.fillStyle = '#e8d8c0'; c.beginPath(); c.moveTo(x + 30, y + h + 4); c.quadraticCurveTo(x + 42, y + h - 18, x + 56, y + h + 4); c.fill();
  c.fillStyle = '#f0a8b8'; c.beginPath(); c.arc(x + 80, y + h, 7, PI, TAU); c.fill();
  c.fillStyle = 'rgba(120,200,190,0.75)'; c.beginPath(); c.roundRect(x + w - 64, y + h - 30, 26, 34, 5); c.fill();   // a jar of sea glass
  c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(x + w - 60, y + h - 26, 4, 24);
  // the sheer curtains, breathing in the night air
  for (const sd of [-1, 1]) {
    const x0 = sd < 0 ? x - 70 : x + w + 70, x1 = sd < 0 ? x + 26 : x + w - 26;
    const cg = c.createLinearGradient(x0, 0, x1, 0);
    cg.addColorStop(0, 'rgba(150,110,170,0.95)'); cg.addColorStop(1, 'rgba(170,140,200,0.35)');
    c.fillStyle = cg; c.beginPath(); c.moveTo(x0, y - 40);
    for (let yy = y - 40; yy <= y + h + 90; yy += 18) c.lineTo(x1 + sd * 34 * ((yy - y) / h) + 7 * Math.sin(t * 0.9 + yy * 0.025 + sd), yy);
    c.lineTo(x0, y + h + 90); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(60,30,70,0.35)'; c.lineWidth = 3;
    for (let k = 1; k < 4; k++) { const xx = x0 + (x1 - x0) * k / 4; c.beginPath(); c.moveTo(xx, y - 38); c.lineTo(xx + 5 * Math.sin(t * 0.9 + k), y + h + 86); c.stroke(); }
  }
  c.fillStyle = '#2a1e18'; c.fillRect(x - 100, y - 50, w + 200, 8);
}

function wallClock(c: C2, g: C2, t: number, sec: number) {
  const { x, y, r } = RM.clock;
  c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.arc(x + 6, y + 8, r + 8, 0, TAU); c.fill();
  c.fillStyle = '#5a3a26'; c.beginPath(); c.arc(x, y, r + 8, 0, TAU); c.fill();
  c.fillStyle = '#efe6d0'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.strokeStyle = '#3a2a20'; c.lineCap = 'round';
  for (let k = 0; k < 60; k++) { const a = (k / 60) * TAU, l = k % 5 ? 0.06 : 0.14; c.lineWidth = k % 5 ? 1 : 3; c.beginPath(); c.moveTo(x + Math.sin(a) * r * (0.92 - l), y - Math.cos(a) * r * (0.92 - l)); c.lineTo(x + Math.sin(a) * r * 0.92, y - Math.cos(a) * r * 0.92); c.stroke(); }
  c.fillStyle = '#3a2a20'; c.font = font(FAM.serifB(), 15); c.textAlign = 'center'; c.textBaseline = 'middle';
  for (const [n, a] of [['12', 0], ['3', 0.25], ['6', 0.5], ['9', 0.75]] as const) c.fillText(n, x + Math.sin(a * TAU) * r * 0.62, y - Math.cos(a * TAU) * r * 0.62 + 1);
  // 4:00 and a few seconds; the second hand ticks once a second with a little overshoot
  const s = Math.floor(sec), fr = sec - s, tick = s + (fr < 0.12 ? ease.outBack(fr / 0.12, 3) : 1) - 1;
  const hand = (a: number, l: number, w: number, col: string, tail = 0) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x - Math.sin(a) * tail, y + Math.cos(a) * tail); c.lineTo(x + Math.sin(a) * l, y - Math.cos(a) * l); c.stroke(); };
  hand(((4 + sec / 3600) / 12) * TAU, r * 0.5, 5, '#2a1d14');
  hand((sec / 3600) * TAU, r * 0.76, 3.5, '#2a1d14');
  hand((tick / 60) * TAU, r * 0.84, 1.6, '#d0303a', r * 0.18);
  c.fillStyle = '#d0303a'; c.beginPath(); c.arc(x, y, 3.5, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.12)'; c.beginPath(); c.ellipse(x - r * 0.3, y - r * 0.4, r * 0.45, r * 0.22, -0.5, 0, TAU); c.fill();
  void g; void t;
}

function glowStars(c: C2, g: C2, t: number, fl: number) {
  for (let i = 0; i < 22; i++) {
    const x = 360 + 760 * h01(i, 21), y = 30 + 250 * h01(i, 22);
    if (Math.hypot(x - RM.clock.x, y - RM.clock.y) < 80 || (x < 600 && y > 180)) continue;
    const s = 6 + 6 * h01(i, 23), a = 0.5 + 0.3 * Math.sin(t * 0.8 + i);
    star5(c, x, y, s, `rgba(214,255,190,${0.45 * a})`, h01(i, 24));
    star5(g, x, y, s * 1.15, `rgba(170,255,140,${(0.07 + 0.2 * fl) * a})`, h01(i, 24));
  }
}
function star5(c: C2, x: number, y: number, r: number, col: string, rot = 0) {
  c.fillStyle = col; c.beginPath();
  for (let k = 0; k < 10; k++) { const a = rot + (k / 10) * TAU - PI / 2, rr = k % 2 ? r * 0.45 : r; k ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  c.closePath(); c.fill();
}

function slateOnNail(c: C2, t: number) {
  const { x, y } = RM.slate;
  c.fillStyle = '#8a8a90'; c.beginPath(); c.arc(x, y - 44, 3, 0, TAU); c.fill();
  slate(c, x, y, 0.28, 0.06 + 0.01 * Math.sin(t * 0.7), (cc) => {
    pencil(cc, circlePts(0, 26, 46), 1, '#2a2a33', 6);                       // the disc
    pencil(cc, circlePts(0, 22, 12), 1, '#2a2a33', 5);                       // the hole
    pencil(cc, circlePts(0, -52, 30), 1, '#2a2a33', 6);                      // the head
    cc.fillStyle = '#2a2a33'; cc.beginPath(); cc.arc(-10, -56, 4, 0, TAU); cc.arc(10, -56, 4, 0, TAU); cc.fill();
    pencil(cc, [[-12, -42], [-4, -36], [4, -36], [12, -42]], 1, '#2a2a33', 4);
    pencil(cc, [[14, -84], [22, -100], [28, -84], [44, -82], [30, -74], [32, -60], [22, -70]], 1, '#ff5a5f', 5);   // the starfish
    cc.fillStyle = '#ff4f9a'; cc.beginPath(); cc.moveTo(0, 33); cc.bezierCurveTo(-11, 24, -7, 15, 0, 20); cc.bezierCurveTo(7, 15, 11, 24, 0, 33); cc.fill();   // a heart in the hole
  });
}

/** The shelf alone (no wall): the storybooks, the ledger book, the toy stone. */
export function shelfOnly(c: C2, g: C2, t: number, book: BookOpts | null | undefined, open = 0) { shelf(c, g, t, book, open, 0); }

function shelf(c: C2, g: C2, t: number, book: BookOpts | null | undefined, open: number, lamp: number) {
  const { x0, x1, y } = RM.shelf;
  c.fillStyle = '#4a3020'; c.fillRect(x0, y, x1 - x0, 14);
  c.fillStyle = '#6a4630'; c.fillRect(x0, y, x1 - x0, 4);
  for (const bx of [x0 + 40, x1 - 40]) { c.fillStyle = '#3a2418'; c.beginPath(); c.moveTo(bx, y + 14); c.lineTo(bx, y + 54); c.lineTo(bx - 26, y + 14); c.closePath(); c.fill(); }
  // the storybooks (spines), the ledger standing face out among them, the toy rai stone and a shell
  SPINES.forEach(([bx, w, h, col, icon], i) => {
    if (open > 0) return;   // the dream: they have flown off the shelf (dream.ts flies them)
    c.fillStyle = mixHex(col, '#1a1428', 0.35); c.fillRect(bx, y - h, w, h);
    c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(bx + 3, y - h + 8, w - 6, 3); c.fillRect(bx + 3, y - 14, w - 6, 3);
    c.fillStyle = 'rgba(255,240,210,0.55)'; spineIcon(c, bx + w / 2, y - h * 0.55, w * 0.32, icon);
  });
  if (book) ledgerBook(c, g, RM.book.x, RM.book.y, RM.book.s, t, book);
  // the toy rai stone (her keepsake, a stone with a hole) and a shell
  c.fillStyle = '#8f8676'; c.beginPath(); c.ellipse(492, y - 22, 22, 23, 0, 0, TAU); c.fill();
  c.fillStyle = '#d9cfb8'; c.beginPath(); c.ellipse(488, y - 23, 21, 23, 0, 0, TAU); c.moveTo(495, y - 23); c.ellipse(488, y - 23, 7, 7, 0, 0, TAU); c.fill('evenodd');
  c.fillStyle = '#f0c8b0'; c.beginPath(); c.moveTo(526, y); c.quadraticCurveTo(534, y - 30, 548, y); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(160,100,80,0.6)'; c.lineWidth = 1.5; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(537, y - 22); c.lineTo(528 + k * 6, y); c.stroke(); }
  // the lamp below lights the shelf from underneath
  if (lamp <= 0) return;
  const ug = c.createLinearGradient(0, y + 14, 0, y - 100);
  ug.addColorStop(0, rgbaHex('#ffb060', 0.22 * lamp)); ug.addColorStop(1, rgbaHex('#ffb060', 0));
  c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = ug; c.fillRect(x0, y - 100, x1 - x0, 114); c.restore();
}
function spineIcon(c: C2, x: number, y: number, s: number, icon: string) {
  if (icon === 'star') { star5(c, x, y, s * 1.3, c.fillStyle as string); return; }
  if (icon === 'heart') { heartShape(c, x, y + s, s * 1.4, c.fillStyle as string); return; }
  c.beginPath(); c.arc(x, y, s, 0, TAU); c.fill();
}

/** The shelf's storybooks: x, width, height, colour, the picture inside. */
export const SPINES: [number, number, number, string, string][] = [
  [84, 26, 88, '#c65cf0', 'star'], [112, 22, 76, '#ff8a2a', 'fish'], [136, 30, 94, '#2fe0ff', 'moon'], [168, 24, 82, '#78d63a', 'whale'],
  [194, 28, 90, '#ff4f9a', 'heart'], [224, 22, 72, '#ffd23f', 'sun'], [248, 26, 86, '#6f8cff', 'boat'],
  [384, 28, 84, '#ff5a5f', 'crown'], [414, 24, 78, '#2fb8a0', 'shell'],
];

/** How high the floating bed rides at t (room px), for things that sit on it. */
export const bedLift = (t: number, float: number) => clamp(float) * (46 + 8 * Math.sin(t * 1.3));

/**
 * A storybook open in the water (the dream): at (px, py), scale s, rotation rot; `op` 0..1 how far its covers are
 * open, `gl` 0..1 its picture's glow.
 */
export function openBook(c: C2, g: C2, t: number, px: number, py: number, s: number, rot: number, op: number, gl: number, i: number, col: string, icon: string) {
  c.save(); c.translate(px, py); c.rotate(rot); c.scale(s, s);
  // the covers and the spread
  c.fillStyle = mixHex(col, '#1a1428', 0.3); c.beginPath(); c.roundRect(-46 * op - 4, -32, 92 * op + 8, 64, 5); c.fill();
  c.fillStyle = '#f7f0dc'; c.beginPath(); c.roundRect(-44 * op, -29, 44 * op, 58, 3); c.roundRect(0, -29, 44 * op, 58, 3); c.fill();
  // the picture: drawn in the book's colour, glowing
  c.fillStyle = col; c.strokeStyle = col; c.lineWidth = 3;
  const pic = () => {
    if (icon === 'whale') { c.beginPath(); c.ellipse(-20 * op, 4, 16 * op, 9, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(-36 * op, 4); c.lineTo(-42 * op, -4); c.lineTo(-42 * op, 10); c.fill(); }
    else if (icon === 'boat') { c.beginPath(); c.moveTo(-36 * op, 8); c.lineTo(-6 * op, 8); c.lineTo(-12 * op, 16); c.lineTo(-30 * op, 16); c.closePath(); c.fill(); c.beginPath(); c.moveTo(-21 * op, 8); c.lineTo(-21 * op, -18); c.lineTo(-8 * op, 4); c.closePath(); c.fill(); }
    else if (icon === 'moon') { c.beginPath(); c.arc(-22 * op, 0, 14 * op, 0.6, PI * 1.9); c.fill(); }
    else if (icon === 'crown') { c.beginPath(); c.moveTo(-36 * op, 10); c.lineTo(-36 * op, -10); c.lineTo(-28 * op, 0); c.lineTo(-22 * op, -14); c.lineTo(-16 * op, 0); c.lineTo(-8 * op, -10); c.lineTo(-8 * op, 10); c.closePath(); c.fill(); }
    else if (icon === 'fish') { c.beginPath(); c.ellipse(-20 * op, 2, 12 * op, 7, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(-32 * op, 2); c.lineTo(-40 * op, -6); c.lineTo(-40 * op, 10); c.fill(); }
    else if (icon === 'heart') heartShape(c, -22 * op, 8, 14 * op, col);
    else if (icon === 'sun') { c.beginPath(); c.arc(-22 * op, 2, 9 * op, 0, TAU); c.fill(); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; c.beginPath(); c.moveTo(-22 * op + Math.cos(a) * 12 * op, 2 + Math.sin(a) * 12); c.lineTo(-22 * op + Math.cos(a) * 18 * op, 2 + Math.sin(a) * 18); c.stroke(); } }
    else { c.beginPath(); c.arc(-22 * op, 2, 12 * op, 0, TAU); c.fill(); c.fillStyle = '#f7f0dc'; c.beginPath(); c.arc(-22 * op, 3, 4 * op, 0, TAU); c.fill(); }   // a rai stone
    // the right page: lines of story
    c.fillStyle = 'rgba(80,60,60,0.45)'; for (let k = 0; k < 5; k++) c.fillRect(8 * op, -18 + k * 9, (28 - (k % 2) * 8) * op, 2.5);
  };
  pic();
  c.restore();
  if (gl > 0) { // the picture's glow, and a mote of its light rising
    c.save(); c.translate(px, py); c.rotate(rot); c.scale(s, s); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 * gl; pic(); c.restore();
    g.save(); g.translate(px, py); g.scale(s, s);
    const gg = g.createRadialGradient(-20 * op, 2, 2, -20 * op, 2, 46); gg.addColorStop(0, rgbaHex(col, 0.5 * gl)); gg.addColorStop(1, rgbaHex(col, 0));
    g.fillStyle = gg; g.fillRect(-70, -50, 100, 100);
    g.restore();
    for (let k = 0; k < 3; k++) { const m = (t * 0.4 + h01(i, k, 33)) % 1; g.fillStyle = rgbaHex(col, 0.6 * gl * (1 - m)); g.beginPath(); g.arc(px - 20 + 20 * Math.sin(t + k + i), py - 30 - m * 140, 3 + 2 * h01(i, k, 34), 0, TAU); g.fill(); }
  }
}

// ------------------------------------------------------------------ the mother's shadow on the wall (from the lamp)

let SH: Layer2D | null = null;
function momShadow(c: C2, o: RoomOpts, lamp: number) {
  if (lamp <= 0.05) return;
  SH ??= new Layer2D(W, H, 0.25);
  const s = SH.ctx, m = RM.mom, L = RM.lamp, k = 1.55, rock = rockAngle(o);
  SH.clear();
  s.save();
  s.setTransform(c.getTransform());
  s.beginPath(); s.rect(-2000, -2000, 6000, 2000 + RM.floor); s.clip();
  s.translate(L.x, L.y); s.scale(k, k); s.translate(-L.x, -L.y);
  s.translate(m.x, m.y); s.rotate(rock); s.translate(-m.x, -m.y);
  mother(s, m.x, m.y, m.h, 'seated', { t: o.t, flip: true, col: '#000000', shawl: '#000000', headTilt: momTilt(o) });
  s.fillStyle = '#000'; chairShape(s, m.x, m.y, m.h / 100, true);
  s.restore();
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 0.34 * lamp; c.drawImage(SH.canvas, 0, 0, W, H); c.restore();
}
const rockAngle = (o: RoomOpts) => (o.mom?.rock ?? 0.035) * Math.sin(o.t * 1.7);
const momTilt = (o: RoomOpts) => o.mom?.tilt ?? (o.mom?.asleep ? 0.55 : 0.12);

// ------------------------------------------------------------------ the floor

function floor(c: C2, g: C2, t: number, lamp: number, fl: number) {
  const F = RM.floor;
  const fg = c.createLinearGradient(0, F, 0, H + 300);
  fg.addColorStop(0, mixHex('#2a1c22', '#4a3028', lamp * 0.6)); fg.addColorStop(1, mixHex('#1a1016', '#38221c', lamp * 0.5));
  c.fillStyle = fg; c.fillRect(-1200, F, W + 2400, H + 600);
  c.strokeStyle = 'rgba(10,4,8,0.4)'; c.lineWidth = 2;
  for (let k = -14; k <= 14; k++) { const x0 = W / 2 + k * 90, x1 = W / 2 + k * 250; c.beginPath(); c.moveTo(x0, F); c.lineTo(x1, H + 300); c.stroke(); }
  for (let k = 0; k < 7; k++) { const y = F + 8 + k * k * 7; c.strokeStyle = 'rgba(10,4,8,0.18)'; c.beginPath(); c.moveTo(-1200, y); c.lineTo(W + 1200, y); c.stroke(); }
  // the woven rug
  const r = RM.rug;
  c.fillStyle = '#3a2440'; c.beginPath(); c.ellipse(r.x, r.y, 470, 78, 0, 0, TAU); c.fill();
  for (let k = 0; k < 4; k++) { c.strokeStyle = ['#7a3a5a', '#c0904a', '#4a6a8a', '#7a3a5a'][k]!; c.lineWidth = 6; c.beginPath(); c.ellipse(r.x, r.y, 440 - k * 70, 70 - k * 12, 0, 0, TAU); c.stroke(); }
  // the moonlight on the floor, through the window
  const mg = c.createLinearGradient(1020, F, 900, F + 220);
  mg.addColorStop(0, `rgba(150,170,255,${0.16 * (1 - fl)})`); mg.addColorStop(1, 'rgba(150,170,255,0)');
  c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = mg;
  c.beginPath(); c.moveTo(1060, F + 4); c.lineTo(1320, F + 4); c.lineTo(1160, F + 230); c.lineTo(820, F + 230); c.closePath(); c.fill(); c.restore();
  void g; void t;
}

// ------------------------------------------------------------------ the dresser, the doll's house, the bill, the lunchbox

function dresser(c: C2, g: C2, t: number, o: RoomOpts, lamp: number) {
  const d = RM.dresser;
  c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(d.x0 + 10, d.foot - 6, d.x1 - d.x0, 14);
  c.fillStyle = '#3e2a1e'; c.fillRect(d.x0, d.top, d.x1 - d.x0, d.foot - d.top);
  c.fillStyle = '#5a3c28'; c.fillRect(d.x0 - 10, d.top - 16, d.x1 - d.x0 + 20, 18);
  c.fillStyle = 'rgba(255,220,180,0.1)'; c.fillRect(d.x0 - 10, d.top - 16, d.x1 - d.x0 + 20, 4);
  for (let k = 0; k < 3; k++) {
    const y = d.top + 14 + k * 58;
    c.fillStyle = '#4a3222'; c.fillRect(d.x0 + 16, y, d.x1 - d.x0 - 32, 48);
    c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 2; c.strokeRect(d.x0 + 16, y, d.x1 - d.x0 - 32, 48);
    for (const kx of [d.x0 + 90, d.x1 - 90]) { c.fillStyle = '#c9a24a'; c.beginPath(); c.arc(kx, y + 24, 6, 0, TAU); c.fill(); }
  }
  c.fillStyle = '#2a1c14'; c.fillRect(d.x0 + 6, d.foot, 18, 12); c.fillRect(d.x1 - 24, d.foot, 18, 12);
  // the doll's house on top
  const hs = RM.house;
  dollHouse(c, g, hs.x, hs.y - 16, hs.s, {
    t, light: lamp, small: true, attic: lamp,
    man: { x: -150, pose: 'stand', flip: false }, keeper: { x: 10, pose: 'mop', mopU: t * 0.4, flip: true },
    tag: { flip: 0 }, meter: { value: 0 }, ...o.house,
  });
  // the bill, propped on her little jewellery box by the doll's house: ELECTRICITY, FINAL NOTICE, £82.40
  const jx = RM.bill.x + 3, jy = RM.dresser.top - 16;
  c.fillStyle = '#8a5a3a'; c.beginPath(); c.roundRect(jx - 30, jy - 28, 60, 28, 3); c.fill();
  c.fillStyle = '#e07a9a'; c.beginPath(); c.roundRect(jx - 32, jy - 34, 64, 8, 3); c.fill();
  c.fillStyle = '#e8c070'; c.fillRect(jx - 3, jy - 27, 6, 7);
  billPaper(c, RM.bill.x, RM.bill.y, 1);
  // the school bag on the floor, the lunchbox packed on top with a note on its lid
  const l = RM.lunch;
  c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(l.x + 6, l.y + 10, 80, 12, 0, 0, TAU); c.fill();
  c.fillStyle = '#c8962a'; c.beginPath(); c.roundRect(l.x - 70, l.y - 96, 140, 106, 20); c.fill();
  c.fillStyle = '#e8b83a'; c.beginPath(); c.roundRect(l.x - 56, l.y - 50, 112, 50, 12); c.fill();
  c.strokeStyle = '#8a6418'; c.lineWidth = 6; c.beginPath(); c.arc(l.x, l.y - 96, 30, PI, TAU); c.stroke();
  lunchbox(c, l.x + 4, l.y - 120, 1, t);
}

/** The bill: an electricity bill, FINAL NOTICE, £82.40, at (x, y) its centre, scale s. */
export function billPaper(c: C2, x: number, y: number, s: number) {
  c.save(); c.translate(x, y); c.rotate(-0.12); c.scale(s, s);
  c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(-24, -30, 52, 66);
  c.fillStyle = '#f4f1ea'; c.fillRect(-28, -34, 52, 66);
  c.fillStyle = '#2a3a6a'; c.fillRect(-28, -34, 52, 9);
  c.fillStyle = '#ffffff'; c.font = font(FAM.monoB(), 6); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ELECTRICITY', -2, -29.5);
  c.fillStyle = 'rgba(40,40,60,0.55)'; for (let k = 0; k < 4; k++) c.fillRect(-23, -18 + k * 5, 26 - (k % 2) * 8, 1.6);
  c.fillStyle = '#1a1a24'; c.font = font(FAM.monoB(), 12); c.fillText('£82.40', -2, 10);
  c.save(); c.translate(-2, 24); c.rotate(-0.18); c.strokeStyle = '#d0303a'; c.lineWidth = 1.4; c.strokeRect(-20, -5, 40, 10);
  c.fillStyle = '#d0303a'; c.font = font(FAM.monoB(), 5.6); c.fillText('FINAL NOTICE', 0, 0.5); c.restore();
  c.restore();
}

/** The lunchbox, packed for the morning: teal, a fish sticker, a note with a heart on the lid, an apple beside. */
export function lunchbox(c: C2, x: number, y: number, s: number, t: number) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = '#1a7a6a'; c.beginPath(); c.roundRect(-38, -4, 76, 30, 7); c.fill();
  c.fillStyle = '#2fb8a0'; c.beginPath(); c.roundRect(-40, -20, 80, 20, 7); c.fill();
  c.strokeStyle = '#1a6a5a'; c.lineWidth = 5; c.beginPath(); c.arc(0, -20, 14, PI, TAU); c.stroke();
  c.fillStyle = HEX.yellow; c.beginPath(); c.ellipse(-22, 12, 9, 5, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(-14, 12); c.lineTo(-8, 7); c.lineTo(-8, 17); c.closePath(); c.fill();
  c.save(); c.translate(12, -12); c.rotate(0.12 + 0.02 * Math.sin(t)); c.fillStyle = '#fff3a8'; c.fillRect(-11, -11, 22, 22);
  heartShape(c, 0, 4, 8, HEX.pink); c.restore();
  c.fillStyle = '#d0303a'; c.beginPath(); c.arc(54, 16, 12, 0, TAU); c.fill();
  c.strokeStyle = '#5a3a20'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(54, 4); c.lineTo(56, -2); c.stroke();
  c.fillStyle = '#4a9a3a'; c.beginPath(); c.ellipse(60, -1, 5, 2.5, -0.5, 0, TAU); c.fill();
  c.restore();
}

// ------------------------------------------------------------------ the bedside table

function bedsideTable(c: C2, g: C2, t: number, o: RoomOpts, lamp: number, dr?: Dream) {
  const T = RM.table, L = RM.lamp, jelly = clamp(dr?.jelly ?? 0);
  c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(T.x0 + 8, T.foot - 4, T.x1 - T.x0, 10);
  c.fillStyle = '#4a3022'; c.fillRect(T.x0 + 8, T.top + 14, 14, T.foot - T.top - 14); c.fillRect(T.x1 - 22, T.top + 14, 14, T.foot - T.top - 14);
  c.fillStyle = '#5a3a28'; c.fillRect(T.x0, T.top, T.x1 - T.x0, 16);
  c.fillStyle = '#4a3022'; c.fillRect(T.x0 + 12, T.top + 16, T.x1 - T.x0 - 24, 60);
  c.fillStyle = '#c9a24a'; c.beginPath(); c.arc((T.x0 + T.x1) / 2, T.top + 46, 5, 0, TAU); c.fill();
  c.fillStyle = '#3a2418'; c.fillRect(T.x0 + 12, T.top + 150, T.x1 - T.x0 - 24, 10);
  // the lamp: base, stem, a fabric shade glowing (in the dream it lifts off and becomes a jellyfish)
  c.fillStyle = '#6a4a30'; c.beginPath(); c.ellipse(L.x, T.top - 6, 30, 9, 0, 0, TAU); c.fill();
  c.fillStyle = '#7a5a3a'; c.fillRect(L.x - 4, L.y + 16, 8, T.top - L.y - 20);
  if (jelly < 1) {
    c.save(); c.globalAlpha *= 1 - jelly;
    c.fillStyle = mixHex('#7a5040', '#ffd9a0', lamp); c.beginPath(); c.moveTo(L.x - 56, L.y + 18); c.lineTo(L.x + 56, L.y + 18); c.lineTo(L.x + 34, L.y - 50); c.lineTo(L.x - 34, L.y - 50); c.closePath(); c.fill();
    c.fillStyle = mixHex('#5a3a30', '#ffc070', lamp); c.fillRect(L.x - 56, L.y + 12, 112, 7);
    c.restore();
  }
  if (lamp > 0) {
    const gg = g.createRadialGradient(L.x, L.y, 6, L.x, L.y, 150);
    gg.addColorStop(0, rgbaHex('#ffd9a0', 0.5 * lamp * (1 - jelly))); gg.addColorStop(1, rgbaHex('#ffd9a0', 0));
    g.fillStyle = gg; g.fillRect(L.x - 160, L.y - 160, 320, 320);
  }
  // the medicine and its spoon, a glass of water, the pebble pendant on its cord
  c.fillStyle = '#7a3a18'; c.beginPath(); c.roundRect(110, T.top - 44, 26, 44, 4); c.fill();
  c.fillStyle = '#e8e0d0'; c.fillRect(114, T.top - 30, 18, 14); c.fillStyle = '#f4f1ea'; c.fillRect(112, T.top - 52, 22, 10);
  c.strokeStyle = '#c9c4b8'; c.lineWidth = 3; c.beginPath(); c.moveTo(196, T.top - 3); c.lineTo(226, T.top - 6); c.stroke();
  c.fillStyle = '#c9c4b8'; c.beginPath(); c.ellipse(192, T.top - 3, 7, 3.5, 0, 0, TAU); c.fill();
  c.fillStyle = 'rgba(200,230,255,0.28)'; c.beginPath(); c.moveTo(208, T.top - 50); c.lineTo(236, T.top - 50); c.lineTo(233, T.top); c.lineTo(211, T.top); c.closePath(); c.fill();
  c.fillStyle = 'rgba(140,200,255,0.3)'; c.fillRect(210, T.top - 30, 24, 29);
  c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(212, T.top - 46, 3, 40);
  const P = RM.pendant;
  c.strokeStyle = '#c9a24a'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(P.x - 8, P.y); c.bezierCurveTo(P.x - 30, P.y + 6, P.x - 40, P.y - 2, P.x - 22, P.y - 6); c.bezierCurveTo(P.x - 10, P.y - 9, P.x + 18, P.y - 2, P.x + 8, P.y + 2); c.stroke();
  void o;
}

/** The pebble pendant on the bedside table and chibi Rai popping out of it (drawn over the bed's headboard). */
function pendant(c: C2, g: C2, t: number, o: RoomOpts) {
  const P = RM.pendant, pd = o.pendant;
  if (pd === null) return;
  // (the kit's pendantRai throws on a tiny pop: its clip radius goes negative below pop ~0.015)
  const pp = pd?.pop ?? 0;
  pendantRai(c, g, P.x, P.y - 4, pd?.s ?? 0.95, t, pp < 0.03 ? 0 : pp, pd?.rai ?? {}, pd?.glow ?? 0);
}

// ------------------------------------------------------------------ the bed and the girl

function bed(c: C2, g: C2, t: number, o: RoomOpts, lamp: number, dr?: Dream) {
  const B = RM.bed, fl = dr ? clamp(dr.float ?? 0) : 0;
  const lift = bedLift(t, fl), rockB = fl * 0.012 * Math.sin(t * 0.9);
  // the shadow under the bed (it parts from the floor as the bed floats)
  c.fillStyle = `rgba(0,0,0,${0.45 - 0.25 * fl})`; c.beginPath(); c.ellipse((B.x0 + B.x1) / 2, B.foot + 2, 360 - 60 * fl, 16, 0, 0, TAU); c.fill();
  // her fins under the bed, sandy
  for (const [fx, fy, a] of [[548, B.foot - 4, -0.06], [600, B.foot + 6, 0.05]] as const) {
    c.save(); c.translate(fx, fy); c.rotate(a);
    c.fillStyle = mixHex(HEX.coral, '#2a1018', 0.5);                       // the blade, flat on the floor
    c.beginPath(); c.moveTo(20, -7); c.quadraticCurveTo(80, -14, 132, -12); c.lineTo(136, 6); c.quadraticCurveTo(80, 8, 20, 7); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 2; for (const yy of [-4, 2]) { c.beginPath(); c.moveTo(30, yy); c.lineTo(130, yy * 1.6); c.stroke(); }
    c.fillStyle = mixHex(HEX.coral, '#2a1018', 0.3);                       // the foot pocket
    c.beginPath(); c.ellipse(14, 0, 22, 10, 0, 0, TAU); c.fill();
    c.restore();
  }
  c.save();
  c.translate(0, -lift); c.translate((B.x0 + B.x1) / 2, B.top); c.rotate(rockB); c.translate(-(B.x0 + B.x1) / 2, -B.top);
  // the frame: rails, legs, headboard (left) and footboard (right)
  c.fillStyle = '#4a3020';
  c.fillRect(B.x0 + 4, B.top + 56, B.x1 - B.x0 - 8, 32);
  c.fillRect(B.x0 + 10, B.top + 80, 18, B.foot - B.top - 80); c.fillRect(B.x1 - 28, B.top + 80, 18, B.foot - B.top - 80);
  c.fillStyle = '#5a3a26'; c.beginPath(); c.roundRect(B.x0 - 18, B.top - 200, 34, B.foot - B.top + 200, [18, 18, 4, 4]); c.fill();
  c.fillStyle = '#6a4630'; c.beginPath(); c.arc(B.x0 - 1, B.top - 206, 15, 0, TAU); c.fill();
  c.fillStyle = '#5a3a26'; c.beginPath(); c.roundRect(B.x1 - 14, B.top - 82, 30, B.foot - B.top + 82, [14, 14, 4, 4]); c.fill();
  c.fillStyle = '#6a4630'; c.beginPath(); c.arc(B.x1 + 1, B.top - 88, 13, 0, TAU); c.fill();
  // the striped towel drying over the footboard
  c.fillStyle = '#2fb8c8'; c.beginPath(); c.moveTo(B.x1 - 18, B.top - 66); c.lineTo(B.x1 + 20, B.top - 66); c.lineTo(B.x1 + 26, B.top + 4); c.lineTo(B.x1 - 24, B.top + 10); c.closePath(); c.fill();
  c.fillStyle = '#f4f1ea'; for (const yy of [-50, -28, -6]) { c.beginPath(); c.moveTo(B.x1 - 20, B.top + yy); c.lineTo(B.x1 + 22, B.top + yy - 1); c.lineTo(B.x1 + 23, B.top + yy + 7); c.lineTo(B.x1 - 21, B.top + yy + 8); c.closePath(); c.fill(); }
  // the mattress and the sheet
  c.fillStyle = '#d8d0c4'; c.beginPath(); c.roundRect(B.x0 + 10, B.top, B.x1 - B.x0 - 22, 60, 12); c.fill();
  c.fillStyle = '#ece6dc'; c.fillRect(B.x0 + 10, B.top, B.x1 - B.x0 - 22, 14);
  // the pillows, propped against the headboard
  c.fillStyle = '#e4ddd2'; c.beginPath(); c.ellipse(B.x0 + 66, B.top - 50, 56, 48, -0.35, 0, TAU); c.fill();
  c.fillStyle = '#f4efe6'; c.beginPath(); c.ellipse(B.x0 + 104, B.top - 22, 74, 34, -0.2, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(160,150,140,0.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(B.x0 + 60, B.top - 30); c.quadraticCurveTo(B.x0 + 100, B.top - 16, B.x0 + 150, B.top - 30); c.stroke();
  // the girl, propped on the pillows
  girlInBed(c, g, t, o);
  // the quilt over her, patterned with little fish, rising and falling with her breath
  const br = Math.sin(t * 2.1) * 3;
  const qg = c.createLinearGradient(0, B.top - 80, 0, B.top + 70);
  qg.addColorStop(0, mixHex('#34508e', '#5a82d0', lamp * 0.5)); qg.addColorStop(1, '#1e2c62');
  c.fillStyle = qg; c.beginPath();
  c.moveTo(B.x0 + 128, B.top - 26 - br);
  c.quadraticCurveTo(B.x0 + 220, B.top - 52 - br, B.x0 + 330, B.top - 30);
  c.quadraticCurveTo(B.x0 + 420, B.top - 62, B.x0 + 500, B.top - 28);
  c.quadraticCurveTo(B.x0 + 560, B.top - 14, B.x1 - 8, B.top - 10);
  c.lineTo(B.x1 - 2, B.top + 70); c.quadraticCurveTo((B.x0 + B.x1) / 2, B.top + 82, B.x0 + 116, B.top + 66);
  c.closePath(); c.fill();
  c.save(); c.clip();
  c.fillStyle = 'rgba(255,210,63,0.42)';
  for (let k = 0; k < 14; k++) { const qx = B.x0 + 150 + (k % 7) * 70 + (k > 6 ? 35 : 0), qy = B.top - 14 + (k > 6 ? 42 : 4); c.beginPath(); c.ellipse(qx, qy, 12, 6, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(qx + 10, qy); c.lineTo(qx + 18, qy - 6); c.lineTo(qx + 18, qy + 6); c.fill(); }
  c.restore();
  c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 3; c.beginPath(); c.moveTo(B.x0 + 130, B.top - 24 - br); c.quadraticCurveTo(B.x0 + 220, B.top - 50 - br, B.x0 + 330, B.top - 28); c.stroke();
  // her arm out on the quilt (the yellow sleeve, a hand)
  const ax = RM.girl.x, ay = RM.girl.y;
  c.strokeStyle = HEX.yellow; c.lineWidth = 20; c.lineCap = 'round'; c.beginPath(); c.moveTo(ax + 22, ay + 52); c.lineTo(ax + 50, ay + 66 - br); c.stroke();
  c.strokeStyle = '#0d0a18'; c.lineWidth = 15; c.beginPath(); c.moveTo(ax + 52, ay + 66 - br); c.quadraticCurveTo(ax + 96, ay + 74 - br, ax + 136, ay + 64 - br); c.stroke();
  c.fillStyle = '#0d0a18'; c.beginPath(); c.arc(ax + 140, ay + 63 - br, 10, 0, TAU); c.fill();
  // the mask hanging on the footboard post (in the dream it drifts to her face)
  const mk = clamp(o.girl?.mask ?? 0);
  if (mk < 0.02) maskShape(c, B.x1 + 2, B.top - 62, 1, 0.15 + 0.04 * Math.sin(t * 0.8), 'none');
  else if (mk < 0.98) { const u = ease.inOutCubic(mk), mx = B.x1 + 2 + (RM.girl.x + 24 - B.x1 - 2) * u, my = B.top - 62 + (RM.girl.y - 2 - B.top + 62) * u - Math.sin(u * PI) * 90; maskShape(c, mx, my, 1, 0.15 + u * 1.2 + 0.3 * Math.sin(t * 2), 'none'); }
  c.restore();
  void g;
}

/** The girl in bed: a faceless silhouette propped on the pillows in her yellow tee; the mask's glint is her eyes. */
function girlInBed(c: C2, g: C2, t: number, o: RoomOpts) {
  const gi = o.girl ?? {}, st = gi.state ?? 'fever', turn = clamp(gi.turn ?? 0), mk = clamp(gi.mask ?? 0);
  const { x, y } = RM.girl, col = '#0d0a18';
  // her shoulders and the yellow tee, under the quilt's edge
  c.fillStyle = HEX.yellow; c.beginPath(); c.moveTo(x - 46, y + 44); c.quadraticCurveTo(x - 10, y + 22, x + 40, y + 40); c.lineTo(x + 60, y + 80); c.lineTo(x - 52, y + 84); c.closePath(); c.fill();
  c.fillStyle = 'rgba(0,0,0,0.18)'; c.beginPath(); c.moveTo(x - 46, y + 60); c.quadraticCurveTo(x, y + 52, x + 50, y + 66); c.lineTo(x + 60, y + 80); c.lineTo(x - 52, y + 84); c.closePath(); c.fill();
  // her ponytail on the pillow (it floats a little in the dream)
  const drift = st === 'dream' ? 1 : 0;
  c.strokeStyle = col; c.lineWidth = 15; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x - 24, y - 2); c.quadraticCurveTo(x - 50 - 10 * drift, y + 2 - 30 * drift + 4 * Math.sin(t * 1.4) * drift, x - 52 - 14 * drift, y + 40 - 66 * drift + 6 * Math.sin(t * 1.7) * drift); c.stroke();
  // the head: tipped back on the pillow (asleep, feverish) or turned towards her mother (right)
  const ang = -0.5 + 0.75 * ease.inOutCubic(turn);
  c.save(); c.translate(x, y); c.rotate(ang);
  c.fillStyle = col; c.beginPath(); c.arc(0, 0, 30, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(26, 6, 9, 7, 0.3, 0, TAU); c.fill();   // the nose and chin's profile, facing her mother
  if (st === 'fever') {
    // the thermometer, from her lips
    c.strokeStyle = '#e8eef0'; c.lineWidth = 4; c.beginPath(); c.moveTo(28, 12); c.lineTo(58, 2); c.stroke();
    c.strokeStyle = '#d0303a'; c.lineWidth = 2; c.beginPath(); c.moveTo(40, 8); c.lineTo(56, 3); c.stroke();
  }
  c.restore();
  if (st === 'fever' || st === 'dream') { // the fever's flush, a glow on her cheek
    const fa = st === 'fever' ? 1 : 0.4;
    const fg = g.createRadialGradient(x + 14, y + 8, 2, x + 14, y + 8, 30);
    fg.addColorStop(0, rgbaHex(HEX.pink, (0.16 + 0.05 * Math.sin(t * 2)) * fa)); fg.addColorStop(1, rgbaHex(HEX.pink, 0));
    g.fillStyle = fg; g.fillRect(x - 20, y - 26, 70, 70);
    c.fillStyle = rgbaHex('#ff5a7a', 0.55 * fa); c.beginPath(); c.ellipse(x + 15, y + 9, 10, 6.5, ang, 0, TAU); c.fill();
  }
  if (st === 'fever') emote(c, x, y, 30, 'sweat', t);
  if (st === 'asleep') emote(c, x, y, 30, 'zzz', t);
  if (mk >= 0.98) { // the dream: her mask on, the glint doing her eyes
    const mx = x + Math.cos(ang) * 22, my = y + Math.sin(ang) * 22;
    maskShape(c, mx, my, 1.05, ang, gi.glint ?? 'droop');
  }
}

/** The dive mask (coral frame, dark lens, the glint that is her eyes) at (x, y), rotated `rot`, scale s. */
export function maskShape(c: C2, x: number, y: number, s: number, rot: number, glint: 'plain' | 'droop' | 'spark' | 'wide' | 'none') {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.strokeStyle = HEX.coral; c.lineWidth = 4; c.beginPath(); c.moveTo(-10, -2); c.quadraticCurveTo(-30, -14, -34, 6); c.stroke();
  c.fillStyle = HEX.coral; c.beginPath(); c.roundRect(-12, -18, 30, 36, 9); c.fill();
  const lg = c.createLinearGradient(0, -14, 0, 14); lg.addColorStop(0, '#2c4f7a'); lg.addColorStop(1, '#0a1428');
  c.fillStyle = lg; c.beginPath(); c.roundRect(-7, -14, 21, 28, 7); c.fill();
  c.strokeStyle = 'rgba(235,250,255,0.95)'; c.fillStyle = 'rgba(235,250,255,0.95)'; c.lineWidth = 3;
  if (glint === 'droop') { c.beginPath(); c.moveTo(-2, -2); c.quadraticCurveTo(4, 5, 10, 7); c.stroke(); }
  else if (glint === 'wide') { c.beginPath(); c.arc(4, -1, 6, 0, TAU); c.stroke(); }
  else if (glint === 'spark') { star4(c, 3, -4, 6, 'rgba(235,250,255,0.95)'); star4(c, 9, 4, 3.5, 'rgba(235,250,255,0.95)'); }
  else if (glint === 'plain') { c.beginPath(); c.moveTo(0, -9); c.lineTo(7, -1); c.stroke(); }
  else { c.beginPath(); c.moveTo(-1, -10); c.lineTo(5, -4); c.stroke(); }
  c.restore();
}

// ------------------------------------------------------------------ the light

function lampLight(c: C2, g: C2, t: number, lamp: number, fl: number) {
  const L = RM.lamp, flick = 1 + 0.015 * Math.sin(t * 13) * Math.sin(t * 5.3);
  if (lamp > 0) { // the lamp's pool: warm on everything near it
    const wl = c.createRadialGradient(L.x, L.y, 20, L.x, L.y, 1050);
    wl.addColorStop(0, rgbaHex('#ffb060', 0.36 * lamp * flick)); wl.addColorStop(0.35, rgbaHex('#ff9050', 0.14 * lamp)); wl.addColorStop(1, rgbaHex('#ff9050', 0));
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = wl; c.fillRect(L.x - 1100, L.y - 1100, 2200, 2200); c.restore();
  }
  // the dark the lamp does not reach: the far right corner and the ceiling
  const dk = c.createRadialGradient(L.x + 300, L.y + 60, 300, L.x + 300, L.y + 60, 1900);
  dk.addColorStop(0, 'rgba(6,3,14,0)'); dk.addColorStop(1, `rgba(6,3,14,${0.62 * (1 - 0.6 * fl)})`);
  c.fillStyle = dk; c.fillRect(-1200, -800, W + 2400, H + 1600);
  void g;
}

// ------------------------------------------------------------------ the mother in the rocking chair

function chairShape(c: C2, x: number, y: number, u: number, solid = false) {
  // a rocking chair facing left, seen a little from the front: curved runners, legs, the seat, arms, and a slatted
  // back on her right (behind her)
  const col = solid ? '#000' : '#3a2418', hi = solid ? '#000' : '#5e3e28', lo = solid ? '#000' : '#2a1810';
  c.lineCap = 'round'; c.lineJoin = 'round';
  // the back panel (far side first): two uprights, a crest rail, spindles
  c.fillStyle = lo; c.beginPath(); c.moveTo(x + 9 * u, y - 44 * u); c.lineTo(x + 25 * u, y - 46 * u); c.lineTo(x + 31 * u, y - 116 * u); c.lineTo(x + 14 * u, y - 112 * u); c.closePath();
  if (!solid) { c.globalAlpha *= 0.35; c.fill(); c.globalAlpha /= 0.35; } else c.fill();
  c.strokeStyle = col; c.lineWidth = 3.2 * u;
  c.beginPath(); c.moveTo(x + 9 * u, y - 40 * u); c.lineTo(x + 14 * u, y - 114 * u); c.moveTo(x + 25 * u, y - 42 * u); c.lineTo(x + 31 * u, y - 118 * u); c.stroke();
  c.lineWidth = 5 * u; c.beginPath(); c.moveTo(x + 12 * u, y - 112 * u); c.quadraticCurveTo(x + 22 * u, y - 122 * u, x + 33 * u, y - 116 * u); c.stroke();
  c.lineWidth = 1.6 * u; for (let k = 1; k < 4; k++) { const v = k / 4; c.beginPath(); c.moveTo(x + (9 + 16 * v) * u, y - (46 + 2 * v) * u); c.lineTo(x + (14 + 17 * v) * u, y - (110 + 4 * v) * u); c.stroke(); }
  // the runners (rockers) and the legs
  c.strokeStyle = col; c.lineWidth = 4.2 * u; c.beginPath(); c.moveTo(x - 40 * u, y - 9 * u); c.quadraticCurveTo(x - 4 * u, y + 5 * u, x + 36 * u, y - 10 * u); c.stroke();
  c.lineWidth = 3.4 * u; c.beginPath(); c.moveTo(x - 20 * u, y - 1 * u); c.lineTo(x - 18 * u, y - 42 * u); c.moveTo(x + 16 * u, y - 1 * u); c.lineTo(x + 14 * u, y - 42 * u); c.stroke();
  // the seat
  c.fillStyle = hi; c.beginPath(); c.roundRect(x - 26 * u, y - 46 * u, 50 * u, 6 * u, 2 * u); c.fill();
  // the arm and its front post
  c.strokeStyle = hi; c.lineWidth = 2.8 * u; c.beginPath(); c.moveTo(x + 14 * u, y - 70 * u); c.quadraticCurveTo(x - 4 * u, y - 72 * u, x - 22 * u, y - 68 * u); c.stroke();
  c.strokeStyle = col; c.lineWidth = 2.4 * u; c.beginPath(); c.moveTo(x - 20 * u, y - 68 * u); c.lineTo(x - 18 * u, y - 46 * u); c.stroke();
}

function rockingMother(c: C2, g: C2, t: number, o: RoomOpts, lamp: number, dr?: Dream) {
  const m = RM.mom, u = m.h / 100, mo = o.mom ?? {}, rock = rockAngle(o), asleep = !!mo.asleep, drift = clamp(dr?.drift ?? 0);
  // the bowl of cold water on the floor beside her, rippling
  const bx = m.x - 52 * u, by = m.y - 2;
  c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(bx + 4, by + 4, 34, 8, 0, 0, TAU); c.fill();
  c.fillStyle = '#c8d0d8'; c.beginPath(); c.moveTo(bx - 32, by - 22); c.quadraticCurveTo(bx, by + 6, bx + 32, by - 22); c.closePath(); c.fill();
  c.fillStyle = '#6aa8d8'; c.beginPath(); c.ellipse(bx, by - 22, 31, 7, 0, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(bx, by - 22, 12 + 10 * ((t * 0.7) % 1), 2.5 + 2 * ((t * 0.7) % 1), 0, 0, TAU); c.stroke();
  c.save();
  c.translate(m.x, m.y); c.rotate(rock); c.translate(-m.x, -m.y);
  // the moon behind her: a cool halo so her silhouette reads against the window
  const hg = c.createRadialGradient(m.x + 10 * u, m.y - 80 * u, 10, m.x + 10 * u, m.y - 80 * u, 60 * u);
  hg.addColorStop(0, 'rgba(120,140,230,0.12)'); hg.addColorStop(1, 'rgba(120,140,230,0)');
  c.fillStyle = hg; c.fillRect(m.x - 60 * u, m.y - 140 * u, 120 * u, 120 * u);
  chairShape(c, m.x, m.y, u);
  // her plait and shawl drifting in the dream
  if (drift > 0) {
    c.fillStyle = '#5a3a6a'; c.globalAlpha = 0.9;
    c.beginPath(); c.moveTo(m.x + 4 * u, m.y - 70 * u); c.quadraticCurveTo(m.x + (20 + 10 * Math.sin(t * 1.1)) * u, m.y - (86 + 14 * drift) * u, m.x + (34 + 6 * Math.sin(t * 0.9)) * u, m.y - (72 + 30 * drift + 8 * Math.sin(t * 1.3)) * u);
    c.lineTo(m.x + (30 + 6 * Math.sin(t * 0.9)) * u, m.y - (60 + 22 * drift) * u); c.quadraticCurveTo(m.x + 18 * u, m.y - 64 * u, m.x + 8 * u, m.y - 56 * u); c.closePath(); c.fill();
    c.globalAlpha = 1;
  }
  mother(c, m.x, m.y, m.h, 'seated', {
    t, flip: true, col: '#0e0a16', shawl: '#5a3a6a', headTilt: momTilt(o),
    rim: rgbaHex('#ffcf90', 0.95 * Math.max(0.35, lamp)), emote: asleep ? 'zzz' : mo.emote, emoteT0: mo.emoteT0,
  });
  // the cold cloth in her hands, folded, a drop falling now and then
  const cx = m.x - 19 * u, cy = m.y - 45 * u;
  c.fillStyle = '#eef4f6'; c.beginPath(); c.roundRect(cx - 8 * u, cy - 3 * u, 14 * u, 6 * u, 1.5 * u); c.fill();
  c.fillStyle = 'rgba(160,190,210,0.6)'; c.fillRect(cx - 8 * u, cy + 0.5 * u, 14 * u, 1.2 * u);
  const dp = (t * 0.8) % 1;
  if (!asleep && dp < 0.5) { c.fillStyle = 'rgba(190,230,255,0.85)'; c.beginPath(); c.arc(cx - 2 * u, cy + 4 * u + dp * 70 * u, 1.6 * u, 0, TAU); c.fill(); }
  c.restore();
  void g;
}

// ------------------------------------------------------------------ the dream's flood

function floodOver(c: C2, g: C2, t: number, dr: Dream) {
  const fl = clamp(dr.flood), lvl = RM.floor + 260 - (RM.floor + 900) * ease.inOutCubic(fl);
  c.save();
  c.beginPath(); c.moveTo(-1200, H + 600);
  for (let x = -1200; x <= W + 1200; x += 40) c.lineTo(x, lvl + 9 * Math.sin(x * 0.012 + t * 2.1) + 5 * Math.sin(x * 0.031 - t * 1.4));
  c.lineTo(W + 1200, H + 600); c.closePath(); c.clip();
  // the sea's colour over the room: violet at the floor, cyan up high
  const sg = c.createLinearGradient(0, -400, 0, H + 200);
  sg.addColorStop(0, 'rgba(47,200,240,0.24)'); sg.addColorStop(1, 'rgba(120,70,220,0.28)');
  c.fillStyle = sg; c.fillRect(-1200, -800, W + 2400, H + 1600);
  // caustics: moving nets of light on everything
  c.globalCompositeOperation = 'lighter';
  const wash = c.createRadialGradient(RM.win.x + 140, RM.win.y + 140, 60, RM.win.x + 140, RM.win.y + 140, 1400);
  wash.addColorStop(0, 'rgba(60,200,255,0.22)'); wash.addColorStop(1, 'rgba(60,200,255,0.02)');
  c.fillStyle = wash; c.fillRect(-1200, -800, W + 2400, H + 1600);
  c.lineCap = 'round';
  for (let j = 0; j < 11; j++) { // caustics: soft broken threads of light, drifting
    c.strokeStyle = `rgba(170,240,255,${0.07 + 0.04 * Math.sin(t * 0.8 + j)})`; c.lineWidth = 2 + (j % 3);
    c.beginPath();
    for (let x = -200; x <= W + 200; x += 16) { const y = -60 + j * 104 + 18 * Math.sin(x * 0.011 + t * 1.1 + j * 1.7) + 8 * Math.sin(x * 0.029 - t * 0.7 + j); const gap = Math.sin(x * 0.006 + j * 2.3 + t * 0.4) > 0.35; if (x === -200 || gap) c.moveTo(x, y); else c.lineTo(x, y); }
    c.stroke();
  }
  // god rays down from the window
  const W0 = RM.win;
  for (let k = 0; k < 5; k++) {
    const x0 = W0.x + 30 + k * 55, sw = 0.5 + 0.5 * Math.sin(t * 0.7 + k * 1.9);
    const rg = c.createLinearGradient(x0, W0.y, x0 - 420, H);
    rg.addColorStop(0, `rgba(190,240,255,${0.16 * sw})`); rg.addColorStop(1, 'rgba(190,240,255,0)');
    c.fillStyle = rg; c.beginPath(); c.moveTo(x0, W0.y + 20); c.lineTo(x0 + 34, W0.y + 20); c.lineTo(x0 - 360, H + 40); c.lineTo(x0 - 470, H + 40); c.closePath(); c.fill();
  }
  c.restore();
  // the surface seen from below while it rises: a bright wavy line
  if (fl < 0.98) {
    g.strokeStyle = 'rgba(190,240,255,0.5)'; g.lineWidth = 4; g.beginPath();
    for (let x = -1200; x <= W + 1200; x += 40) { const y = lvl + 9 * Math.sin(x * 0.012 + t * 2.1) + 5 * Math.sin(x * 0.031 - t * 1.4); x === -1200 ? g.moveTo(x, y) : g.lineTo(x, y); }
    g.stroke();
  }
  // reeds growing from the rug
  const rd = clamp(dr.reeds ?? 0);
  if (rd > 0) for (let i = 0; i < 9; i++) {
    const rx = RM.rug.x - 380 + 760 * h01(i, 51), hgt = (160 + 200 * h01(i, 52)) * ease.outCubic(clamp(rd * 1.3 - 0.06 * i));
    if (hgt > 4) reed(c, rx, RM.rug.y + 10 - 40 * h01(i, 53), hgt, t, i + 40, i % 2 ? '#1f8a5a' : '#2aa070', 18);
  }
  // fish swimming between the bedposts and through the room
  const fs = clamp(dr.fish ?? 0);
  if (fs > 0) for (let i = 0; i < 7; i++) {
    const sp = 70 + 50 * h01(i, 61), dir = i % 2 ? 1 : -1, span = 2400;
    const x = dir > 0 ? ((t * sp + span * h01(i, 62)) % span) - 300 : W + 300 - ((t * sp + span * h01(i, 62)) % span);
    const y = 330 + 420 * h01(i, 63) + 18 * Math.sin(t * 1.4 + i);
    c.save(); c.globalAlpha = fs; fish(c, x, y, 16 + 10 * h01(i, 64), [HEX.yellow, HEX.cyan, HEX.coral, HEX.lime, HEX.pink][i % 5]!, dir, t, i); c.restore();
  }
  // the lamp's shade, lifted off as a jellyfish, pulsing up through the water
  const jl = clamp(dr.jelly ?? 0);
  if (jl > 0) jellyLamp(c, g, t, jl);
  // bubbles rising
  c.strokeStyle = 'rgba(220,250,255,0.55)';
  for (let i = 0; i < 26; i++) {
    const x = h01(i, 71) * W + 12 * Math.sin(t * 1.3 + i), r = 3 + 10 * h01(i, 72);
    const y = H - ((h01(i, 73) + t * 0.1 * (0.6 + h01(i, 74))) % 1.2) * (H + 200);
    if (y < lvl) continue;
    c.lineWidth = 1.6; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
  }
}

/** Mix two #rrggbb colours to a #rrggbb (rgbaHex needs hex; the shared mixHex returns rgb()). */
function hexMix(a: string, b: string, u: number): string {
  const p = parseInt(a.slice(1), 16), q = parseInt(b.slice(1), 16), v = clamp(u);
  const ch = (k: number) => Math.round(((p >> k) & 255) + (((q >> k) & 255) - ((p >> k) & 255)) * v);
  return '#' + ((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0');
}

/** The lamp's shade become a jellyfish: a translucent bell with the shade's fringe for tentacles, glowing pink. */
export function jellyLamp(c: C2, g: C2, t: number, u: number) {
  const L = RM.lamp, e = ease.inOutCubic(u);
  const x = L.x + 60 * e + 30 * Math.sin(t * 0.6) * e, y = L.y - 30 - 150 * e + 14 * Math.sin(t * 1.1) * e;
  const pulse = 1 + 0.12 * Math.sin(t * 3.2) * e, w = 56 * (1 - 0.15 * e) * pulse, hgt = 64 * (1 + 0.1 * e) / pulse;
  const col = hexMix('#ffd9a0', '#ff8ac8', e);
  // tentacles: the shade's fringe, trailing
  c.strokeStyle = rgbaHex(col, 0.75); c.lineWidth = 3; c.lineCap = 'round';
  for (let k = 0; k < 7; k++) { const bx = x - w * 0.8 + (k / 6) * w * 1.6; c.beginPath(); c.moveTo(bx, y + 16); for (let s = 1; s <= 8; s++) c.lineTo(bx + Math.sin(t * 2 + k + s * 0.7) * 8 * e, y + 16 + s * 12 * (0.4 + e)); c.stroke(); }
  // the bell: the shade's trapezoid rounding into a dome
  c.fillStyle = rgbaHex(col, 0.9 - 0.15 * e);
  c.beginPath(); c.moveTo(x - w, y + 16); c.quadraticCurveTo(x - w * (1 - 0.4 * e), y - hgt * (0.6 + 0.4 * e), x, y - hgt); c.quadraticCurveTo(x + w * (1 - 0.4 * e), y - hgt * (0.6 + 0.4 * e), x + w, y + 16);
  c.quadraticCurveTo(x, y + 6, x - w, y + 16); c.fill();
  const gg = g.createRadialGradient(x, y - 20, 4, x, y - 20, 140);
  gg.addColorStop(0, rgbaHex(col, 0.75)); gg.addColorStop(1, rgbaHex(col, 0));
  g.fillStyle = gg; g.fillRect(x - 150, y - 170, 300, 300);
  c.fillStyle = rgbaHex('#ffffff', 0.35); c.beginPath(); c.ellipse(x - w * 0.3, y - hgt * 0.55, w * 0.18, hgt * 0.12, -0.5, 0, TAU); c.fill();
}

// ------------------------------------------------------------------ the lyric's hand-over

/**
 * The line to show at t: like the kit's currentLine (one line at a time, the next rising in its 0.4 s lead), but a
 * line is never replaced before its last word is mostly sung (back-to-back lines: "...a lunchbox, a bill," keeps its
 * "bill" until it is sung).
 */
export function handLine(lines: Line[], t: number, lead = 0.4): Line | null {
  let cur: Line | null = null;
  lines.forEach((l, i) => {
    let on = l.words[0]!.start - lead;
    const prev = lines[i - 1];
    if (prev) { const lw = prev.words[prev.words.length - 1]!; on = Math.max(on, lw.start + 0.6 * (lw.end - lw.start)); }
    if (t >= on) cur = l;
  });
  return cur;
}
