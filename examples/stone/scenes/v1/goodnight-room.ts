// goodnight's living room (TREATMENT-v1.md, the outro): where the show has been playing all along. The woman from up
// the road asleep on the sofa with her child under one blanket, the TV's glow on them. Room coordinates are the
// 1920x1080 wide shot; the plate's camera dollies out of the TV's glass into this room, and back in for the credits.
//
// The clues (each points somewhere):
// - the lunchbox on the side table: seat C7's (number1), the kitchen's (uptheroad), now packed for the morning with a
//   note and an apple: the care the ledger scored 0, done again tonight;
// - the thermometer put down beside it: the fever of the 4 am kitchen has broken;
// - the two coats on the hooks, a long one with a work lanyard and a small yellow raincoat, and a school bag: her
//   shift and the school run, tomorrow;
// - the child's crayon drawing of Rai taped by the TV (a stone with a heart in its hole): she already knows who is
//   waiting at the bottom of the sea; and a toy stone on the rug;
// - the clock at twenty to eleven: she is asleep before midnight, not awake at four;
// - the window: the same moon as over Yap's beach, and the sea the stone is at the bottom of;
// - a goldfish on the sill, watching the telly: the show's audience, at home;
// - the lamp is off: the only light is the show's (and then the moon's).
import { W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import { clamp, ease } from '../../engine/util';
import { h01, drawRai, type Face, type ArmPose, type RaiOpts } from '../_rai';
import { FAM, TAU, rgbaHex, mixHex, emote, type C2 } from '../_motifs';
import { heart as heartShape } from '../_manga';
import { cast } from './_cast';
import { signBoard } from './_studio';

export const RM = {
  floor: 790,
  tv: { x: 450, y: 380, w: 460, h: 310 },          // the casing
  scr: { x: 480, y: 400, w: 400, h: 225 },         // the glass (16:9)
  cab: { x: 420, y: 690, w: 520, front: 852 },
  table: { x: 945, w: 107, top: 736, foot: 862 },
  sofa: { x0: 1100, x1: 1720, back: 545, seat: 706, front: 842 },
  win: { x: 1190, y: 150, w: 370, h: 285 },
  clock: { x: 1016, y: 246, r: 40 },
  door: { x: 30, y: 215, w: 185 },
  lamp: { x: 1818, base: 864 },
  mum: { x: 1590, hip: 712, h: 330 },
  child: { hx: 1530, hy: 638, h: 190 },
  land: { x: 1512, y: 626 },                        // where the kiss lands: on the child's head
};
export const TVC = { x: RM.scr.x + RM.scr.w / 2, y: RM.scr.y + RM.scr.h / 2 };
const SIL = '#0c0919';

// ------------------------------------------------------------------ the camera

export interface RoomCam { x: number; y: number; z: number }
/** Apply the room camera (centre x, y in room px, zoom z) to a context. */
export function applyCam(c: C2, k: RoomCam) {
  c.translate(W / 2, H / 2); c.scale(k.z, k.z); c.translate(-k.x, -k.y);
}
/** The camera whose frame is exactly the TV's glass. */
export const CAM_TV: RoomCam = { x: TVC.x, y: TVC.y, z: W / RM.scr.w };
/** Dolly between two framings: log zoom, the centre moving with the visible width (a natural pull or push). */
export function camLerp(a: RoomCam, b: RoomCam, u: number): RoomCam {
  const z = a.z * Math.pow(b.z / a.z, u);
  const v = Math.abs(1 / b.z - 1 / a.z) < 1e-9 ? u : (1 / z - 1 / a.z) / (1 / b.z - 1 / a.z);
  return { x: a.x + (b.x - a.x) * v, y: a.y + (b.y - a.y) * v, z };
}

// ------------------------------------------------------------------ the back of the room

/** Wall, wallpaper, skirting, floor, rug, door and coats, clock, the child's drawing, curtains, lamp, toy. */
export function roomBack(c: C2, t: number) {
  const F = RM.floor;
  // the wall: a soft stripe wallpaper
  c.fillStyle = '#5a4a86'; c.fillRect(-400, -400, W + 800, F + 400);
  c.fillStyle = 'rgba(255,255,255,0.05)';
  for (let x = -400; x < W + 400; x += 64) c.fillRect(x, -400, 22, F + 400);
  c.fillStyle = 'rgba(255,214,150,0.07)';
  for (let x = -368; x < W + 400; x += 64) for (let y = 30; y < F - 40; y += 90) { c.beginPath(); c.arc(x, y + (x % 128 ? 45 : 0), 4, 0, TAU); c.fill(); }
  // skirting and floorboards
  c.fillStyle = '#3e2c52'; c.fillRect(-400, F - 18, W + 800, 18);
  const fg = c.createLinearGradient(0, F, 0, H + 200);
  fg.addColorStop(0, '#6a4632'); fg.addColorStop(1, '#4a2e22');
  c.fillStyle = fg; c.fillRect(-400, F, W + 800, H + 400 - F);
  c.strokeStyle = 'rgba(30,16,10,0.35)'; c.lineWidth = 2;
  for (let k = 1; k < 9; k++) { const y = F + k * k * 5 + k * 6; c.beginPath(); c.moveTo(-400, y); c.lineTo(W + 400, y); c.stroke(); }
  // the door at the far left
  const D = RM.door;
  c.fillStyle = '#3a2a3e'; c.fillRect(D.x - 14, D.y - 14, D.w + 28, F - D.y + 14);
  c.fillStyle = '#7a5640'; c.fillRect(D.x, D.y, D.w, F - D.y);
  c.strokeStyle = 'rgba(40,24,16,0.6)'; c.lineWidth = 4;
  for (const [px, py, pw, ph] of [[18, 26, 64, 200], [104, 26, 64, 200], [18, 270, 64, 260], [104, 270, 64, 260]] as const) c.strokeRect(D.x + px, D.y + py, pw, ph);
  c.fillStyle = '#d9b070'; c.beginPath(); c.arc(D.x + D.w - 20, D.y + 300, 8, 0, TAU); c.fill();
  // coat hooks: her long coat with a work lanyard, the child's yellow raincoat, a school bag below
  c.fillStyle = '#3a2a20'; c.fillRect(242, 322, 160, 14);
  for (const hx of [270, 330, 388]) { c.fillStyle = '#c99a5a'; c.beginPath(); c.arc(hx, 336, 6, 0, TAU); c.fill(); }
  c.fillStyle = '#2f6a6a';
  c.beginPath(); c.moveTo(270, 338); c.quadraticCurveTo(236, 360, 232, 420); c.lineTo(222, 700); c.lineTo(318, 700); c.lineTo(306, 420); c.quadraticCurveTo(302, 360, 270, 338); c.fill();
  c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 3; c.beginPath(); c.moveTo(270, 360); c.lineTo(268, 690); c.stroke();
  c.strokeStyle = '#d23a4a'; c.lineWidth = 4; c.beginPath(); c.moveTo(266, 338); c.lineTo(254, 470); c.moveTo(274, 338); c.lineTo(284, 470); c.stroke();
  c.fillStyle = '#f4f1ea'; c.fillRect(252, 466, 36, 48);
  c.fillStyle = '#8a9ab0'; c.fillRect(258, 472, 14, 16);
  c.fillStyle = 'rgba(40,40,60,0.6)'; c.fillRect(258, 494, 24, 3); c.fillRect(258, 501, 18, 3);
  c.fillStyle = '#ffcf3a';
  c.beginPath(); c.moveTo(330, 338); c.quadraticCurveTo(306, 350, 304, 390); c.lineTo(298, 528); c.lineTo(364, 528); c.lineTo(356, 390); c.quadraticCurveTo(354, 350, 330, 338); c.fill();
  c.fillStyle = '#e8b52a'; c.beginPath(); c.arc(330, 352, 18, Math.PI, 0); c.fill();
  c.fillStyle = '#ff6a8a'; c.beginPath(); c.roundRect(300, 730, 64, 66, 14); c.fill();
  c.fillStyle = '#e84a6a'; c.beginPath(); c.roundRect(308, 752, 48, 30, 8); c.fill();
  c.fillStyle = HEX.yellow; drawStar(c, 344, 742, 7);
  // the clock: twenty to eleven, the second hand ticking
  const K = RM.clock;
  c.fillStyle = '#3a2a20'; c.beginPath(); c.arc(K.x, K.y, K.r + 6, 0, TAU); c.fill();
  c.fillStyle = '#ece4cf'; c.beginPath(); c.arc(K.x, K.y, K.r, 0, TAU); c.fill();
  c.strokeStyle = '#3a2a20'; c.lineCap = 'round';
  for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; c.lineWidth = k % 3 ? 2 : 4; c.beginPath(); c.moveTo(K.x + Math.sin(a) * K.r * 0.78, K.y - Math.cos(a) * K.r * 0.78); c.lineTo(K.x + Math.sin(a) * K.r * 0.92, K.y - Math.cos(a) * K.r * 0.92); c.stroke(); }
  const hand = (a: number, l: number, w: number, col: string) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(K.x, K.y); c.lineTo(K.x + Math.sin(a) * l, K.y - Math.cos(a) * l); c.stroke(); };
  hand(((10 + 40 / 60) / 12) * TAU, K.r * 0.5, 5, '#2a1d14');
  hand((40 / 60) * TAU, K.r * 0.74, 3.5, '#2a1d14');
  hand(((Math.floor(t) + 17) % 60 / 60) * TAU, K.r * 0.82, 1.5, '#c0392b');
  c.fillStyle = '#2a1d14'; c.beginPath(); c.arc(K.x, K.y, 3.5, 0, TAU); c.fill();
  // the child's crayon drawing of Rai, taped up by the TV
  c.save(); c.translate(1000, 512); c.rotate(0.07);
  c.fillStyle = '#f4f1ea'; c.fillRect(-46, -58, 92, 116);
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = '#3fa0e0'; c.lineWidth = 3;
  for (const yy of [40, 50]) { c.beginPath(); for (let x = -40; x <= 40; x += 8) { const y = yy + 3 * Math.sin(x * 0.4 + yy); x === -40 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); }
  c.strokeStyle = '#8a8070'; c.lineWidth = 3;
  c.beginPath(); c.arc(0, 14, 22, 0, TAU); c.stroke(); c.beginPath(); c.arc(0, -22, 15, 0, TAU); c.stroke();
  c.fillStyle = '#e8304a'; c.beginPath(); c.moveTo(0, 20); c.bezierCurveTo(-9, 12, -5, 5, 0, 10); c.bezierCurveTo(5, 5, 9, 12, 0, 20); c.fill();
  c.fillStyle = '#2a1d14'; c.beginPath(); c.arc(-5, -24, 2, 0, TAU); c.arc(5, -24, 2, 0, TAU); c.fill();
  c.strokeStyle = '#2a1d14'; c.lineWidth = 2; c.beginPath(); c.arc(0, -20, 6, 0.3, Math.PI - 0.3); c.stroke();
  c.fillStyle = '#ff7a6b'; drawStar(c, 9, -36, 6);
  c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(30, -42, 8, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.45)'; c.fillRect(-40, -64, 26, 12); c.fillRect(14, -64, 26, 12);
  c.restore();
  // the window frame and its curtains (the glass is drawn after the light: it is lit by the moon)
  const Wn = RM.win;
  c.fillStyle = '#2c2244'; c.fillRect(Wn.x - 16, Wn.y - 16, Wn.w + 32, Wn.h + 32);
  c.fillStyle = '#d9cfb8'; c.fillRect(Wn.x - 26, Wn.y + Wn.h, Wn.w + 52, 16);   // the sill
  c.fillStyle = '#3a2a20'; c.fillRect(Wn.x - 80, Wn.y - 34, Wn.w + 160, 8);       // the rod
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? Wn.x - 70 : Wn.x + Wn.w + 70, x1 = side < 0 ? Wn.x + 18 : Wn.x + Wn.w - 18;
    c.fillStyle = '#9a3a5a';
    c.beginPath(); c.moveTo(x0, Wn.y - 30);
    for (let y = Wn.y - 30; y <= Wn.y + Wn.h + 70; y += 20) c.lineTo(x1 + side * (30 * ((y - Wn.y) / Wn.h)) + 6 * Math.sin(t * 1.1 + y * 0.03), y);
    c.lineTo(x0, Wn.y + Wn.h + 70); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(40,10,30,0.35)'; c.lineWidth = 3;
    for (let k = 1; k < 4; k++) { const x = x0 + (x1 - x0) * k / 4; c.beginPath(); c.moveTo(x, Wn.y - 28); c.lineTo(x + 4 * Math.sin(t * 1.1 + k), Wn.y + Wn.h + 66); c.stroke(); }
  }
  // the floor lamp, off: its shade dark, its cord hanging
  const L = RM.lamp;
  c.fillStyle = '#2a2030'; c.beginPath(); c.ellipse(L.x, L.base, 46, 12, 0, 0, TAU); c.fill();
  c.strokeStyle = '#3a3040'; c.lineWidth = 8; c.beginPath(); c.moveTo(L.x, L.base); c.lineTo(L.x, 400); c.stroke();
  c.fillStyle = '#c8b898';
  c.beginPath(); c.moveTo(L.x - 60, 330); c.lineTo(L.x + 60, 330); c.lineTo(L.x + 88, 408); c.lineTo(L.x - 88, 408); c.closePath(); c.fill();
  c.strokeStyle = '#8a7858'; c.lineWidth = 2;
  for (let k = 0; k < 16; k++) { const x = L.x - 84 + k * 11.2; c.beginPath(); c.moveTo(x, 408); c.lineTo(x, 418); c.stroke(); }
  c.strokeStyle = '#d9b070'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(L.x + 30, 408); c.lineTo(L.x + 30, 470); c.stroke();
  c.fillStyle = '#d9b070'; c.beginPath(); c.arc(L.x + 30, 474, 4, 0, TAU); c.fill();
  // the rug, and a toy stone on it with a heart sticker
  c.fillStyle = '#6a2e48'; c.beginPath(); c.ellipse(1140, 965, 560, 72, 0, 0, TAU); c.fill();
  c.strokeStyle = '#c2567a'; c.lineWidth = 6; c.beginPath(); c.ellipse(1140, 965, 520, 60, 0, 0, TAU); c.stroke();
  c.strokeStyle = '#d9a441'; c.lineWidth = 4; c.beginPath(); c.ellipse(1140, 965, 470, 48, 0, 0, TAU); c.stroke();
  c.save(); c.translate(872, 952); c.rotate(-0.2);
  c.fillStyle = 'rgba(20,10,20,0.35)'; c.beginPath(); c.ellipse(4, 22, 34, 6, 0, 0, TAU); c.fill();
  c.fillStyle = '#b8ad96'; c.beginPath(); c.ellipse(5, 0, 26, 28, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(0, 0, 26, 28, 0, 0, TAU); c.moveTo(8, 2); c.ellipse(0, 2, 8, 9, 0, 0, TAU);
  c.fillStyle = '#e4dbc6'; c.fill('evenodd');
  c.fillStyle = '#ff4f9a'; heartShape(c, -12, -12, 7, '#ff4f9a');
  c.restore();
  c.strokeStyle = '#3fa0e0'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(916, 972); c.lineTo(950, 962); c.stroke();
}

function drawStar(c: C2, x: number, y: number, r: number) {
  c.beginPath();
  for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU - Math.PI / 2, rr = k % 2 ? r * 0.45 : r; k ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  c.closePath(); c.fill();
}

/** The window's glass: the night sky, the moon (the same as over Yap), the sea with the moon's path, a boat's light. */
export function windowGlass(c: C2, g: C2, t: number) {
  const Wn = RM.win, hz = Wn.y + Wn.h * 0.66;
  c.save();
  c.beginPath(); c.rect(Wn.x, Wn.y, Wn.w, Wn.h); c.clip();
  const sg = c.createLinearGradient(0, Wn.y, 0, hz);
  sg.addColorStop(0, '#0b0f2e'); sg.addColorStop(1, '#2b2f6a');
  c.fillStyle = sg; c.fillRect(Wn.x, Wn.y, Wn.w, hz - Wn.y);
  for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(255,255,255,${0.3 + 0.5 * h01(i, 7) * (0.6 + 0.4 * Math.sin(t * 2 + i))})`; c.beginPath(); c.arc(Wn.x + h01(i, 8) * Wn.w, Wn.y + h01(i, 9) * (hz - Wn.y - 10), 0.8 + 1.2 * h01(i, 10), 0, TAU); c.fill(); }
  const mx = Wn.x + Wn.w * 0.76, my = Wn.y + 62;
  c.fillStyle = '#fff4d6'; c.beginPath(); c.arc(mx, my, 30, 0, TAU); c.fill();
  c.fillStyle = 'rgba(200,190,160,0.35)'; c.beginPath(); c.arc(mx - 8, my - 6, 6, 0, TAU); c.arc(mx + 9, my + 8, 4, 0, TAU); c.fill();
  c.fillStyle = '#141a46'; c.fillRect(Wn.x, hz, Wn.w, Wn.y + Wn.h - hz);
  c.globalCompositeOperation = 'screen';
  for (let i = 0; i < 10; i++) { const y = hz + 4 + i * 9, w = 14 + i * 7, x = mx + 10 * Math.sin(t * 1.3 + i * 2); c.fillStyle = `rgba(255,244,214,${0.4 - i * 0.03})`; c.fillRect(x - w / 2, y, w, 2.5); }
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = '#0a0d24'; c.beginPath(); c.moveTo(Wn.x, hz); c.quadraticCurveTo(Wn.x + 60, hz - 22, Wn.x + 130, hz); c.fill();  // a headland
  const blink = Math.floor(t * 1.2) % 2 === 0 ? 1 : 0.3;
  c.fillStyle = `rgba(255,214,120,${blink})`; c.beginPath(); c.arc(Wn.x + 70, hz + 12, 2.5, 0, TAU); c.fill();   // a boat's light
  c.restore();
  g.fillStyle = rgbaHex('#fff4d6', 0.35); g.beginPath(); g.arc(mx, my, 60, 0, TAU); g.fill();
  // the mullions
  c.fillStyle = '#2c2244'; c.fillRect(Wn.x + Wn.w / 2 - 5, Wn.y, 10, Wn.h); c.fillRect(Wn.x, Wn.y + Wn.h * 0.42, Wn.w, 9);
  // a goldfish in its bowl on the sill, watching the telly
  const bx = Wn.x + 70, by = Wn.y + Wn.h - 24, r = 30;
  c.fillStyle = 'rgba(120,180,255,0.18)'; c.beginPath(); c.arc(bx, by, r, 0, TAU); c.fill();
  c.save(); c.beginPath(); c.arc(bx, by, r, 0, TAU); c.clip();
  c.fillStyle = 'rgba(70,130,220,0.45)'; c.fillRect(bx - r, by - r * 0.35, 2 * r, 2 * r);
  const fxp = bx + 12 * Math.sin(t * 0.7), dir = Math.cos(t * 0.7) > 0 ? 1 : -1;
  c.save(); c.translate(fxp, by + 6 + 3 * Math.sin(t * 1.9)); c.scale(-dir, 1);
  c.fillStyle = '#ff8a2a'; c.beginPath(); c.ellipse(0, 0, 9, 6, 0, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(7, 0); c.lineTo(15, -6); c.lineTo(15, 6); c.closePath(); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(-4, -1.5, 2.4, 0, TAU); c.fill();
  c.fillStyle = '#120d1d'; c.beginPath(); c.arc(-4.6, -1.5, 1.2, 0, TAU); c.fill();
  c.restore();
  c.restore();
  c.strokeStyle = 'rgba(200,230,255,0.55)'; c.lineWidth = 2; c.beginPath(); c.arc(bx, by, r, 0, TAU); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 3; c.beginPath(); c.arc(bx, by, r - 7, -2.4, -1.7); c.stroke();
  const bu = (t * 0.6) % 1; c.strokeStyle = `rgba(220,240,255,${0.7 * (1 - bu)})`; c.lineWidth = 1.2; c.beginPath(); c.arc(bx - 4, by - bu * 26, 2.5, 0, TAU); c.stroke();
}

// ------------------------------------------------------------------ the furniture

/** The TV cabinet (books and a photo on its shelf) and the side table with the lunchbox, packed for the morning. */
export function furniture(c: C2) {
  const K = RM.cab;
  c.fillStyle = '#4a2e22'; c.fillRect(K.x, K.y, K.w, K.front - K.y);
  c.fillStyle = '#6e4630'; c.fillRect(K.x - 8, K.y - 4, K.w + 16, 16);
  c.fillStyle = '#5a3a2a';
  c.fillRect(K.x + 12, K.y + 24, 168, K.front - K.y - 40); c.fillRect(K.x + K.w - 180, K.y + 24, 168, K.front - K.y - 40);
  c.fillStyle = '#d9b070'; c.beginPath(); c.arc(K.x + 166, K.y + 90, 5, 0, TAU); c.arc(K.x + K.w - 166, K.y + 90, 5, 0, TAU); c.fill();
  c.fillStyle = '#24160f'; c.fillRect(K.x + 192, K.y + 24, K.w - 384, K.front - K.y - 40);   // the open shelf
  const books = ['#c2567a', '#3f6fb0', '#d9a441', '#5aa06a', '#8a5bbf'];
  books.forEach((col, i) => { c.fillStyle = col; c.fillRect(K.x + 200 + i * 15, K.y + 66 - (i % 2) * 8, 12, 70 + (i % 2) * 8); });
  c.save(); c.translate(K.x + 330, K.y + 94); c.rotate(-0.04);       // a photo: the two of them by the sea
  c.fillStyle = '#c99a5a'; c.fillRect(-28, -36, 56, 64);
  c.fillStyle = '#6fb6e0'; c.fillRect(-22, -30, 44, 30); c.fillStyle = '#e8d4a8'; c.fillRect(-22, 0, 44, 22);
  c.fillStyle = '#2a1d14'; c.beginPath(); c.arc(-6, -4, 5, 0, TAU); c.arc(8, 2, 4, 0, TAU); c.fill(); c.fillRect(-10, 0, 8, 18); c.fillRect(5, 5, 6, 13);
  c.restore();
  c.fillStyle = '#2a1a12'; c.fillRect(K.x + 6, K.front, 16, 10); c.fillRect(K.x + K.w - 22, K.front, 16, 10);
  // the side table
  const T = RM.table, cx = T.x + T.w / 2;
  c.strokeStyle = '#4a2e22'; c.lineWidth = 9; c.lineCap = 'round';
  c.beginPath(); c.moveTo(T.x + 14, T.top + 8); c.lineTo(T.x + 8, T.foot); c.moveTo(T.x + T.w - 14, T.top + 8); c.lineTo(T.x + T.w - 8, T.foot); c.stroke();
  c.fillStyle = '#5a3a2a'; c.fillRect(T.x + 10, T.foot - 50, T.w - 20, 8);
  c.fillStyle = '#7a5236'; c.beginPath(); c.roundRect(T.x - 6, T.top, T.w + 12, 12, 5); c.fill();
  // the lunchbox, the one from seat C7: red, a star sticker, a blank name label; a note tucked under the handle
  const lx = cx - 12, ly = T.top - 40, s = 1;
  c.fillStyle = '#ff5a5f'; c.beginPath(); c.roundRect(lx - 34 * s, ly - 10 * s, 68 * s, 48 * s, 8 * s); c.fill();
  c.strokeStyle = '#8a2a2e'; c.lineWidth = 6 * s; c.beginPath(); c.arc(lx, ly - 10 * s, 16 * s, Math.PI, 0); c.stroke();
  c.fillStyle = HEX.yellow; c.beginPath(); c.arc(lx - 12 * s, ly + 12 * s, 9 * s, 0, TAU); c.fill();
  c.fillStyle = '#ffffff'; c.fillRect(lx + 4 * s, ly + 4 * s, 22 * s, 12 * s);
  c.save(); c.translate(lx + 8, ly - 22); c.rotate(0.25);
  c.fillStyle = '#fff3a8'; c.fillRect(-9, -11, 18, 20);
  heartShape(c, 0, 0, 5, '#e8304a');
  c.restore();
  // an apple for the morning, and the thermometer put down: the fever has broken
  c.fillStyle = '#d23a3a'; c.beginPath(); c.arc(T.x + T.w - 14, T.top - 11, 11, 0, TAU); c.fill();
  c.strokeStyle = '#5a3a20'; c.lineWidth = 2; c.beginPath(); c.moveTo(T.x + T.w - 14, T.top - 21); c.lineTo(T.x + T.w - 12, T.top - 27); c.stroke();
  c.fillStyle = '#5aa06a'; c.beginPath(); c.ellipse(T.x + T.w - 8, T.top - 24, 5, 2.5, -0.4, 0, TAU); c.fill();
  c.strokeStyle = '#f4f1ea'; c.lineWidth = 4; c.beginPath(); c.moveTo(T.x + 4, T.top - 3); c.lineTo(T.x + 40, T.top - 6); c.stroke();
  c.fillStyle = '#d23a3a'; c.beginPath(); c.arc(T.x + 42, T.top - 6, 3, 0, TAU); c.fill();
}

/** The sofa (front on), with a cushion. */
export function sofa(c: C2) {
  const S = RM.sofa;
  c.fillStyle = '#5a3c68';
  c.beginPath(); c.roundRect(S.x0 + 40, S.back, S.x1 - S.x0 - 80, S.seat - S.back + 20, 34); c.fill();
  c.strokeStyle = 'rgba(30,14,40,0.4)'; c.lineWidth = 3;
  c.beginPath(); c.moveTo((S.x0 + S.x1) / 2, S.back + 20); c.lineTo((S.x0 + S.x1) / 2, S.seat); c.stroke();
  c.fillStyle = '#6a4a7a'; c.beginPath(); c.roundRect(S.x0 + 60, S.seat - 12, S.x1 - S.x0 - 120, 54, 16); c.fill();
  c.fillStyle = '#4e3460'; c.fillRect(S.x0 + 30, S.seat + 36, S.x1 - S.x0 - 60, S.front - S.seat - 36);
  for (const [x0, x1] of [[S.x0 - 8, S.x0 + 72], [S.x1 - 72, S.x1 + 8]] as const) {
    c.fillStyle = '#62436f'; c.beginPath(); c.roundRect(x0, 628, x1 - x0, S.front - 628, 30); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.06)'; c.beginPath(); c.roundRect(x0 + 8, 634, x1 - x0 - 16, 30, 14); c.fill();
  }
  c.fillStyle = '#2a1a12'; for (const x of [S.x0 + 10, S.x1 - 26]) c.fillRect(x, S.front, 16, 18);
  c.save(); c.translate(S.x0 + 118, S.seat - 40); c.rotate(-0.22);       // a cushion against the left arm
  c.fillStyle = '#5b7fbf';
  c.beginPath(); c.moveTo(-46, -38); c.quadraticCurveTo(0, -26, 46, -38); c.quadraticCurveTo(36, 0, 46, 38); c.quadraticCurveTo(0, 28, -46, 38); c.quadraticCurveTo(-36, 0, -46, -38); c.fill();
  c.fillStyle = 'rgba(120,60,20,0.35)'; c.beginPath(); c.arc(0, 0, 6, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(120,60,20,0.3)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-30, -20); c.lineTo(-6, -4); c.moveTo(30, 22); c.lineTo(6, 4); c.stroke();
  c.restore();
}

// ------------------------------------------------------------------ the sleepers

export interface SleepOpts {
  /** 0..1: the kiss has landed: the blanket glows pink between them. */
  warm?: number;
  /** When the child's heart rises (the kiss received). */
  heartT0?: number;
  /** The TV's light colour for their rims (null: off). */
  rim?: string | null;
}

/** The woman asleep sitting at the sofa's end, her child lying against her, one blanket over both; zzz. */
export function sleepers(c: C2, g: C2, t: number, o: SleepOpts = {}) {
  const M = RM.mum, Cc = RM.child, rim = o.rim ?? undefined;
  const br = Math.sin(t * 1.55), brc = Math.sin(t * 2.05 + 1.1);   // their breathing, out of step
  // the woman: seated, facing the TV, leant back into the sofa's corner
  c.save(); c.translate(M.x, M.hip + br * 0.6); c.rotate(0.12);
  cast(c, 'woman', 0, (40 / 100) * M.h, M.h, 'seated', { col: SIL, flip: true, t, rim, headTilt: -0.25 });
  c.restore();
  // the child, lying along the seat, her head on a cushion in her mum's lap (drawn standing, turned on her side)
  const u = Cc.h / 100, ca = Math.PI / 2 - 0.14;
  const childAt = () => { c.translate(Cc.hx - 88 * u * Math.sin(ca), Cc.hy + 88 * u * Math.cos(ca)); c.rotate(ca); };
  c.save(); childAt(); cast(c, 'child', 0, 0, Cc.h, 'stand', { col: SIL, t }); c.restore();
  // the blanket over both: a patchwork, breathing
  const top: [number, number][] = [
    [1352, 690], [1362, 634 + brc], [1398, 612 + brc * 2], [1440, 604 + brc * 2.4], [1480, 610 + brc * 1.6], [1510, 630 + brc],
    [1522, 664], [1550, 680], [1574, 668 + br], [1596, 640 + br * 2], [1616, 616 + br * 2.4], [1642, 622 + br * 1.5], [1656, 690],
  ];
  const hem: [number, number][] = [];
  for (let x = 1660; x >= 1336; x -= 18) hem.push([x, 800 + 6 * Math.sin(x * 0.11) + 3 * Math.sin(x * 0.37)]);
  const shape = () => {
    c.beginPath(); c.moveTo(1342, 712);
    for (const [x, y] of top) c.lineTo(x, y);
    c.lineTo(1660, 760); for (const [x, y] of hem) c.lineTo(x, y); c.lineTo(1338, 760); c.closePath();
  };
  shape(); c.fillStyle = '#b0506e'; c.fill();
  c.save(); shape(); c.clip();
  const cols = ['#c2567a', '#d9a441', '#5b7fbf', '#8a5bbf', '#e07a5a', '#5aa06a'];
  for (let i = 0; i < 12; i++) for (let j = 0; j < 6; j++) {
    const x = 1330 + i * 30, y = 600 + j * 36 + 4 * Math.sin(i * 1.3);
    c.fillStyle = cols[(i * 7 + j * 3) % cols.length]!;
    c.save(); c.translate(x, y); c.rotate(0.12 * Math.sin(i + j)); c.fillRect(-13, -15, 26, 30); c.restore();
  }
  c.strokeStyle = 'rgba(255,240,220,0.3)'; c.lineWidth = 1.5; c.setLineDash([3, 4]);
  for (let i = 0; i < 12; i++) { c.beginPath(); c.moveTo(1343 + i * 30, 590); c.lineTo(1343 + i * 30, 820); c.stroke(); }
  c.setLineDash([]);
  if ((o.warm ?? 0) > 0) { // the kiss's warmth in the wool
    const wg = c.createRadialGradient(RM.land.x, RM.land.y + 20, 0, RM.land.x, RM.land.y + 20, 170);
    wg.addColorStop(0, rgbaHex('#ff7ab0', 0.22 * o.warm!)); wg.addColorStop(1, rgbaHex('#ff7ab0', 0));
    c.fillStyle = wg; c.fillRect(1300, 560, 400, 300);
  }
  c.restore();
  c.strokeStyle = '#6a2a44'; c.lineWidth = 3; shape(); c.stroke();
  c.strokeStyle = '#e8c27a'; c.lineWidth = 2;                       // tassels on the hem
  for (const [x, y] of hem) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + 1, y + 10); c.stroke(); }
  // the cushion in her lap, the child's head on it (her bunches), two small socked feet out of the blanket's end
  c.save(); c.translate(1556, 668 + br * 0.5); c.rotate(-0.1);
  c.fillStyle = '#d9a441';
  c.beginPath(); c.moveTo(-50, -26); c.quadraticCurveTo(0, -18, 50, -26); c.quadraticCurveTo(42, 0, 50, 26); c.quadraticCurveTo(0, 20, -50, 26); c.quadraticCurveTo(-42, 0, -50, -26); c.fill();
  c.strokeStyle = 'rgba(120,60,20,0.4)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-34, -14); c.lineTo(-8, -2); c.moveTo(34, 14); c.lineTo(8, 2); c.stroke();
  c.restore();
  c.save(); childAt();
  c.beginPath(); c.rect(-30 * u, -112 * u, 60 * u, 32 * u); c.clip();
  cast(c, 'child', 0, 0, Cc.h, 'stand', { col: SIL, t });
  c.restore();
  c.fillStyle = '#ff9ab8';
  c.beginPath(); c.ellipse(1352, 646 + brc, 11, 8, -0.3, 0, TAU); c.ellipse(1348, 663 + brc, 11, 8, 0.2, 0, TAU); c.fill();
  // her arm around her child, its hand on the child's shoulder, below her head
  c.strokeStyle = SIL; c.lineWidth = 20; c.lineCap = 'round';
  c.beginPath(); c.moveTo(1608, 614 + br * 1.5); c.quadraticCurveTo(1590, 690 + br, 1540, 690 + br * 0.5); c.quadraticCurveTo(1512, 688, 1494, 672 + brc); c.stroke();
  c.fillStyle = SIL; c.beginPath(); c.arc(1492, 670 + brc, 12, 0, TAU); c.fill();
  void g; void rim; void o;
}

/** What is drawn over the sleepers after the room's light: the TV's rim on their heads, their zzz, the child's heart. */
export function sleeperMarks(c: C2, g: C2, t: number, o: SleepOpts = {}) {
  const M = RM.mum, Cc = RM.child, u = Cc.h / 100, mu = M.h / 100, br = Math.sin(t * 1.55);
  const mhx = M.x + Math.sin(0.12) * 0.46 * M.h, mhy = M.hip + br * 0.6 - Math.cos(0.12) * 0.46 * M.h;
  if (o.rim) {
    c.strokeStyle = rgbaHex(o.rim, 0.85); c.lineCap = 'round';
    c.lineWidth = 3; c.beginPath(); c.arc(mhx, mhy, 9 * mu, Math.PI * 0.6, Math.PI * 1.5); c.stroke();
    c.lineWidth = 2.5; c.beginPath(); c.moveTo(mhx - 12, mhy + 34); c.quadraticCurveTo(mhx - 24, mhy + 48, mhx - 26, mhy + 60); c.stroke();
    c.beginPath(); c.arc(Cc.hx, Cc.hy, 9 * u + 1, Math.PI * 0.5, Math.PI * 1.75); c.stroke();
  }
  // zzz, both: hers bigger and slower, the child's smaller and quicker
  for (const k of [0, 0.5, 1.0]) emote(c, mhx - 8, mhy + 4, 34, 'zzz', t + k, -1e9);
  for (const k of [0, 0.37, 0.75]) emote(c, Cc.hx - 36, Cc.hy - 16, 20, 'zzz', t * 1.25 + k, -1e9);
  if (o.heartT0 !== undefined && t > o.heartT0 && t < o.heartT0 + 1.6) emote(c, Cc.hx - 14, Cc.hy - 26, 26, 'heart', t - o.heartT0, 0);
  void g;
}

// ------------------------------------------------------------------ the light

let LM: OffscreenCanvas | null = null;
const LMW = 480, LMH = 270;

/**
 * The room's light, multiplied over everything drawn so far (call it under the room camera `cam`): a light map of the
 * dark room's ambient, the moonlight from the window (all that is left when the TV is off), the TV's glow falling off
 * from the glass (tv 0..1, in its picture's colour) and the kiss's warmth on the sleepers (warm 0..1). The TV's spill
 * also blooms a little on the glow layer.
 */
export function roomLight(c: C2, g: C2, t: number, cam: RoomCam, o: { tv: number; tvCol: string; warm?: number }) {
  if (!LM) LM = new OffscreenCanvas(LMW, LMH);
  const l = LM.getContext('2d')!;
  l.setTransform(1, 0, 0, 1, 0, 0); l.globalCompositeOperation = 'source-over';
  l.fillStyle = '#211e44'; l.fillRect(0, 0, LMW, LMH);
  l.setTransform(LMW / W, 0, 0, LMH / H, 0, 0);
  applyCam(l as unknown as C2, cam);
  l.globalCompositeOperation = 'lighter';
  const Wn = RM.win, wx = Wn.x + Wn.w / 2;
  const mg = l.createRadialGradient(wx, Wn.y + Wn.h * 0.6, 30, wx - 60, Wn.y + Wn.h + 160, 640);
  mg.addColorStop(0, '#3a4282'); mg.addColorStop(0.5, '#1c2050'); mg.addColorStop(1, '#000000');
  l.fillStyle = mg; l.fillRect(-1000, -1000, W + 2000, H + 2000);
  const fl = o.tv * (0.93 + 0.07 * Math.sin(t * 7.3) * Math.sin(t * 3.1));
  if (fl > 0.002) { // the screen's light: wide and low, as it spills across the room to the sofa
    const peak = mixHex('#ffffff', o.tvCol, 0.45);
    l.save(); l.translate(TVC.x + 40, TVC.y + 40); l.scale(1.7, 1);
    const tg = l.createRadialGradient(0, 0, 10, 0, 0, 760);
    tg.addColorStop(0, mixHex('#000000', peak, 0.9 * fl)); tg.addColorStop(0.3, mixHex('#000000', peak, 0.66 * fl));
    tg.addColorStop(0.65, mixHex('#000000', peak, 0.38 * fl)); tg.addColorStop(1, '#000000');
    l.fillStyle = tg; l.fillRect(-2000, -2000, 4000, 4000);
    l.restore();
  }
  const warm = o.warm ?? 0;
  if (warm > 0) {
    const pg = l.createRadialGradient(RM.land.x, RM.land.y + 20, 10, RM.land.x, RM.land.y + 20, 330);
    pg.addColorStop(0, mixHex('#000000', '#c0507a', warm)); pg.addColorStop(1, '#000000');
    l.fillStyle = pg; l.fillRect(-1000, -1000, W + 2000, H + 2000);
  }
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'multiply';
  c.drawImage(LM, 0, 0, W, H);
  c.restore();
  void g;
}

// ------------------------------------------------------------------ the TV

export interface OffState { u: number }   // seconds since the switch-off began (< 0: on)

/** The set's casing, the bezel, the controls, the standby light (green while on, red once off). */
export function tvCasing(c: C2, g: C2, on: boolean) {
  const T = RM.tv, S = RM.scr;
  // the rabbit-ear aerial
  c.strokeStyle = '#8a8f9c'; c.lineWidth = 4; c.lineCap = 'round';
  c.beginPath(); c.moveTo(TVC.x - 6, T.y - 6); c.lineTo(TVC.x - 70, T.y - 98); c.moveTo(TVC.x + 6, T.y - 6); c.lineTo(TVC.x + 74, T.y - 104); c.stroke();
  c.fillStyle = '#c0c4d0'; c.beginPath(); c.arc(TVC.x - 70, T.y - 98, 6, 0, TAU); c.arc(TVC.x + 74, T.y - 104, 6, 0, TAU); c.fill();
  c.fillStyle = '#2a2830'; c.beginPath(); c.ellipse(TVC.x, T.y - 4, 30, 12, 0, Math.PI, 0); c.fill();
  // the box
  const bg = c.createLinearGradient(0, T.y, 0, T.y + T.h);
  bg.addColorStop(0, '#3a3742'); bg.addColorStop(1, '#22202a');
  c.fillStyle = bg; c.beginPath(); c.roundRect(T.x, T.y, T.w, T.h, 22); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.08)'; c.lineWidth = 3; c.beginPath(); c.roundRect(T.x + 3, T.y + 3, T.w - 6, T.h - 6, 20); c.stroke();
  c.fillStyle = '#121116'; c.beginPath(); c.roundRect(S.x - 12, S.y - 12, S.w + 24, S.h + 24, 22); c.fill();
  // the speaker grilles, a badge, the power button and its light
  c.fillStyle = '#16151a';
  for (const gx of [T.x + 24, T.x + T.w - 154]) for (let r = 0; r < 4; r++) for (let k = 0; k < 13; k++) { c.beginPath(); c.arc(gx + k * 10, S.y + S.h + 26 + r * 9, 2.4, 0, TAU); c.fill(); }
  c.fillStyle = '#9a9eaa'; c.beginPath(); c.roundRect(TVC.x - 26, S.y + S.h + 20, 52, 12, 4); c.fill();
  c.fillStyle = '#4a4752'; c.beginPath(); c.arc(TVC.x + 40, S.y + S.h + 44, 8, 0, TAU); c.fill();
  void on; void g;
}

/** The standby light: green while the set is on, red once it is off. */
export function tvLed(c: C2, g: C2, on: boolean) {
  const S = RM.scr, led = on ? '#4cff7a' : '#ff3b3b';
  c.fillStyle = led; c.beginPath(); c.arc(TVC.x + 62, S.y + S.h + 44, 3.2, 0, TAU); c.fill();
  g.fillStyle = rgbaHex(led, 0.5); g.beginPath(); g.arc(TVC.x + 62, S.y + S.h + 44, 7, 0, TAU); g.fill();
}

/**
 * The glass. `picture` draws in TV coordinates (a full 1920x1080 frame mapped onto the glass). `crt` 0..1 fades in the
 * CRT's look (rounded corners, scanlines, curvature shading, glare) as the camera leaves the glass; `zoom` is the
 * camera's, so the scanlines fade before they alias. `off`: the old switch-off (collapse to a line, to a dot, a ring).
 */
export function tvScreen(c: C2, g: C2, t: number, picture: ((c: C2, g: C2) => void) | null, o: { crt: number; zoom: number; off?: number; ring?: string }) {
  const S = RM.scr, rad = 16 * o.crt, kx = S.w / W, ky = S.h / H;
  const off = o.off ?? -1;
  const glass = () => { c.beginPath(); c.roundRect(S.x, S.y, S.w, S.h, rad); };
  c.save(); glass(); c.clip();
  c.fillStyle = '#0d100f'; c.fillRect(S.x, S.y, S.w, S.h);
  const COL = 0.09, LINE = 0.2;
  if (picture && off < LINE) {
    // the picture, collapsing to a line then to a dot about the centre as the set switches off
    const sy = off < 0 ? 1 : Math.max(0.006, 1 - ease.inQuad(clamp(off / COL)));
    const sx = off < COL ? 1 : Math.max(0.004, 1 - ease.inCubic(clamp((off - COL) / (LINE - COL))));
    for (const k of [c, g]) {
      k.save();
      k.beginPath(); k.roundRect(S.x, S.y, S.w, S.h, rad); k.clip();
      k.translate(TVC.x, TVC.y); k.scale(sx, sy); k.translate(-TVC.x, -TVC.y);
      k.translate(S.x, S.y); k.scale(kx, ky);
    }
    picture(c, g);
    c.restore(); g.restore();
    if (off >= 0) { // the beam brightening as it collapses
      const a = clamp(off / COL);
      c.fillStyle = `rgba(235,245,255,${0.7 * a})`;
      c.fillRect(TVC.x - (S.w / 2) * sx, TVC.y - (S.h / 2) * sy - 1, S.w * sx, S.h * sy + 2);
      g.fillStyle = `rgba(220,235,255,${0.45 * a})`;
      g.fillRect(TVC.x - (S.w / 2) * sx - 6, TVC.y - (S.h / 2) * sy - 4, S.w * sx + 12, S.h * sy + 8);
    }
  }
  if (o.crt > 0.01 && off < 0) {
    // scanlines (in TV pixels; they fade once they would be finer than the output's pixels)
    const pitch = 4 * ky, onFrame = pitch * o.zoom, sa = 0.22 * o.crt * clamp((onFrame - 1.6) / 2);
    if (sa > 0.01) { c.fillStyle = `rgba(0,0,0,${sa})`; for (let y = S.y; y < S.y + S.h; y += pitch) c.fillRect(S.x, y, S.w, pitch / 2); }
    // the tube's curvature: darker corners, a glare across the glass
    const vg = c.createRadialGradient(TVC.x, TVC.y, S.h * 0.35, TVC.x, TVC.y, S.w * 0.62);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${0.5 * o.crt})`);
    c.fillStyle = vg; c.fillRect(S.x, S.y, S.w, S.h);
    const gl = c.createLinearGradient(S.x, S.y, S.x + S.w * 0.5, S.y + S.h);
    gl.addColorStop(0, `rgba(255,255,255,${0.1 * o.crt})`); gl.addColorStop(0.45, `rgba(255,255,255,${0.03 * o.crt})`); gl.addColorStop(0.46, 'rgba(255,255,255,0)');
    c.fillStyle = gl; c.fillRect(S.x, S.y, S.w, S.h);
  }
  if (off >= LINE || !picture) { // the dead glass, a faint reflection of the window on it
    c.fillStyle = 'rgba(120,130,170,0.06)';
    c.beginPath(); c.ellipse(S.x + S.w * 0.78, S.y + S.h * 0.3, 40, 26, -0.3, 0, TAU); c.fill();
  }
  c.restore();
  if (off >= COL && off < LINE) { // the bright line shrinking to a point
    const sx = Math.max(0.004, 1 - ease.inCubic(clamp((off - COL) / (LINE - COL))));
    g.fillStyle = 'rgba(230,240,255,0.65)';
    g.fillRect(TVC.x - (S.w / 2) * sx - 3, TVC.y - 2, S.w * sx + 6, 4);
    c.fillStyle = '#ffffff'; c.fillRect(TVC.x - (S.w / 2) * sx, TVC.y - 1, S.w * sx, 2);
  }
  if (off >= LINE) { // the dot: a ring (the zero, the stone, her heart), glowing and fading
    const v = off - LINE, a = Math.pow(clamp(1 - v / 0.62), 1.2), r = 7.5 + 3 * ease.outCubic(clamp(v / 0.5));
    g.strokeStyle = rgbaHex(o.ring ?? '#ffd0e4', 0.5 * a); g.lineWidth = 6;
    g.beginPath(); g.arc(TVC.x, TVC.y, r, 0, TAU); g.stroke();
    g.strokeStyle = rgbaHex('#ffffff', 0.6 * a); g.lineWidth = 2;
    g.beginPath(); g.arc(TVC.x, TVC.y, r, 0, TAU); g.stroke();
    c.strokeStyle = `rgba(255,255,255,${a})`; c.lineWidth = 1.5;
    c.beginPath(); c.arc(TVC.x, TVC.y, r, 0, TAU); c.stroke();
  }
}

// ------------------------------------------------------------------ the end card (TV coordinates)

export interface CardTimes { t0: number; rows: [number, number, number]; stab: number; off: number }
export const CREDITS: string[][] = [
  ['Words: Claude, from', "Knight Commander Gareth's brief"],
  ['Voice and music: Suno'],
  ['Film: drawn in code;', 'engine from pdoom-video', 'by Giacomo Magnanini (MIT)'],
];

/**
 * The show's end card on the TV: the small bulb sign "WHAT'S IT WORTH?", then the credits typed in Plex Mono, each
 * block staying to the end. On the band's last bar the sign blazes and Rai pops up in the corner, shushes (they are
 * asleep), and nods off herself.
 */
export function endCard(c: C2, g: C2, t: number, T: CardTimes) {
  const stabAge = t - T.stab;
  const bg = c.createRadialGradient(960, 480, 100, 960, 540, 1200);
  bg.addColorStop(0, '#2a1c58'); bg.addColorStop(1, '#0b0819');
  c.fillStyle = bg; c.fillRect(0, 0, W, H);
  { // a marquee of the studio's bulbs around the card, chasing (faster on the band's last bar)
    const x0 = 110, y0 = 64, x1 = 1810, y1 = 1016, per = 2 * (x1 - x0 + y1 - y0), n = 64;
    const chase = t * (stabAge > 0 ? 9 : 3);
    for (let i = 0; i < n; i++) {
      let d = (i / n) * per, x: number, y: number;
      if (d < x1 - x0) { x = x0 + d; y = y0; } else if ((d -= x1 - x0) < y1 - y0) { x = x1; y = y0 + d; }
      else if ((d -= y1 - y0) < x1 - x0) { x = x1 - d; y = y1; } else { d -= x1 - x0; x = x0; y = y1 - d; }
      const on = 0.35 + 0.65 * Math.max(0, Math.sin(chase - i * 0.9)), col = i % 4 ? HEX.gold : HEX.pink;
      c.fillStyle = mixHex('#3a2c2a', col, 0.3 + 0.6 * on); c.beginPath(); c.arc(x, y, 9, 0, TAU); c.fill();
      if (on > 0.5) { g.fillStyle = rgbaHex(col, 0.3 * on); g.beginPath(); g.arc(x, y, 18, 0, TAU); g.fill(); }
    }
  }
  const lit = clamp((t - T.t0 - 0.05) / 0.4);
  signBoard(c, g, 960, 150, t + (stabAge > 0 ? stabAge * 3 : 0), lit, 0.8);
  if (stabAge > 0 && stabAge < 0.6) { g.fillStyle = rgbaHex(HEX.gold, 0.25 * (1 - stabAge / 0.6)); g.beginPath(); g.roundRect(380, 80, 1160, 140, 20); g.fill(); }
  // a gold hairline under the sign
  const rl = ease.outCubic(clamp((t - T.t0 - 0.2) / 0.4));
  c.fillStyle = rgbaHex(HEX.gold, 0.8); c.fillRect(960 - 330 * rl, 262, 660 * rl, 3);
  // the credits, typed in Plex Mono (the label to the colon in gold), each block staying
  const size = 78, lh = 90, top = [372, 576, 702];
  c.font = font(FAM.mono(), size); c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  const cw = c.measureText('M').width;
  CREDITS.forEach((rows, b) => {
    const t0 = T.rows[b]!;
    if (t < t0) return;
    let n = Math.floor((t - t0) * 85);
    rows.forEach((row, ri) => {
      if (n <= 0) return;
      const shown = row.slice(0, n); n -= row.length;
      const x0 = 960 - (row.length * cw) / 2, y = top[b]! + ri * lh;
      const colon = row.indexOf(':');
      for (let i = 0; i < shown.length; i++) {
        c.fillStyle = colon >= 0 && i <= colon ? HEX.gold : HEX.bone;
        c.fillText(shown[i]!, x0 + i * cw, y);
      }
      if (shown.length < row.length || (b === T.rows.length - 1 && ri === rows.length - 1 && Math.floor(t * 2.4) % 2 === 0 && t < T.stab)) {
        c.fillStyle = rgbaHex(HEX.bone, 0.8); c.fillRect(x0 + shown.length * cw + 4, y - size * 0.72, cw * 0.62, size * 0.86);
      }
    });
  });
  // the band's last bar: Rai pops up in the corner, shushes, and dozes off
  if (stabAge > 0) {
    const up = ease.outBack(clamp(stabAge / 0.28)), doze = clamp((stabAge - 0.62) / 0.3);
    const R = 118, x = 1790, y = H + 90 - 300 * up + 50 * doze;
    const face: Face = doze > 0 ? 'asleep' : 'wink', arms: [ArmPose, ArmPose] = doze > 0 ? ['down', 'down'] : ['down', 'chin'];
    const ro: RaiOpts = { t, face, arms, armsFrom: ['down', 'down'], armsU: clamp(stabAge / 0.2), glow: HEX.pink, heart: 0.7, marks: doze > 0 ? ['zzz'] : ['sparkle'], markT0: doze > 0 ? T.stab + 0.62 : T.stab + 0.15, tilt: -0.18 * doze, noBlink: true };
    drawRai(c, x, y, R, ro);
  }
}
