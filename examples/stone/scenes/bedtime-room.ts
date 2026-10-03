// The bedtime plate's room (his staging: "Mum reading the bedtime story but dad watching at the door"): a child's
// bedroom at night, in layers. Back: the wall with its wallpaper of little stars, the projected story, the calendar,
// the child's drawing, the window with the moon, the far sea and a lighthouse. Mid: the lit doorway with dad leaning
// in it (an orange lifeboat jacket on the hall hook), the chest with the family photo, the shelf with the toy rai
// stone that is the night-light (and a toy lifeboat), the bed. Front: mum on the bed's edge with the book, the child
// under a quilt of little rings, the rug. Room coordinates are the 1920x1080 frame before the slow camera.
//
// The clues (each one points somewhere):
// - the toy stone on the shelf: the story's stone, and the night-light that tells it;
// - the orange lifeboat jacket on the hall hook and the toy lifeboat on the shelf: dad volunteers on the lifeboat
//   (today: "a lifeboat crew heads into the storm and nobody pays them to go"); the lighthouse at sea agrees;
// - the family photo (grandad, mum, dad, child, a stone on the beach): grandad, who will forget a name in the care
//   home (today);
// - the child's crayon drawing (a stone with a face at the bottom of the sea, people on a hill pointing): the child
//   already knows the story, and draws Rai;
// - the calendar with one day ringed in gold: a wedding to come (remember: "On Yap they still bring the stones to
//   weddings").
import { W, H } from '../engine/gl';
import { HEX } from '../engine/palette';
import { font } from '../engine/type';
import { clamp, ease } from '../engine/util';
import { h01 } from './_rai';
import { FAM, TAU, emote, mixHex, palm, person, rgbaHex, stone, type C2, type Emote } from './_motifs';

export const ROOM = {
  floor: 840,
  door: { x: 120, y: 250, w: 240 },              // the opening, to the floor
  win: { x: 1420, y: 130, w: 380, h: 430 },      // the window's glass
  sill: { x: 1398, y: 560, w: 424, h: 22 },
  chest: { x: 410, y: 690, w: 200, h: 150 },
  shelf: { x: 1140, y: 482, w: 240 },
  toy: { x: 1318, y: 452, r: 28 },               // the toy stone on the shelf; its hole is the night-light
  bed: { x0: 650, x1: 1290, top: 700, side: 762 },
  disc: { x: 770, y: 296, r: 218 },              // the projection on the wall
  moon: { x: 1690, y: 236, r: 40 },
  horizon: 430,
};
export const SIL = '#0d0918';   // the people
const SHADOW = '#2a1640';       // the shadow-play's puppets on the gold

// ------------------------------------------------------------------ the back: wall, window, decorations

/** The wall, wallpaper, skirting, floor, rug and the moonlight on them. `lamp` 0..1 warms the room. */
export function drawWall(c: C2, t: number, lamp: number, hall: number) {
  const g = c.createLinearGradient(0, -300, 0, ROOM.floor);
  g.addColorStop(0, '#1d1240'); g.addColorStop(1, mixHex('#2c1b58', '#3c2648', lamp * 0.35));
  c.fillStyle = g; c.fillRect(-600, -400, W + 1200, ROOM.floor + 400);
  c.fillStyle = 'rgba(198,92,240,0.10)';
  for (let j = 0; j < 13; j++) for (let i = 0; i < 30; i++) {
    const x = -500 + i * 100 + (j % 2) * 50 + 14 * (h01(i, j, 1) - 0.5), y = -120 + j * 76;
    if (y > ROOM.floor - 40) continue;
    const s = 4 + 3 * h01(i, j, 2);
    c.beginPath(); c.moveTo(x, y - s); c.lineTo(x + s * 0.3, y - s * 0.3); c.lineTo(x + s, y); c.lineTo(x + s * 0.3, y + s * 0.3);
    c.lineTo(x, y + s); c.lineTo(x - s * 0.3, y + s * 0.3); c.lineTo(x - s, y); c.lineTo(x - s * 0.3, y - s * 0.3); c.closePath(); c.fill();
  }
  const fg = c.createLinearGradient(0, ROOM.floor, 0, H + 300);
  fg.addColorStop(0, '#24163e'); fg.addColorStop(1, '#0c0716');
  c.fillStyle = fg; c.fillRect(-600, ROOM.floor, W + 1200, H + 500 - ROOM.floor);
  c.strokeStyle = 'rgba(140,100,190,0.12)'; c.lineWidth = 2;
  for (let k = 1; k < 7; k++) { const y = ROOM.floor + k * k * 8; c.beginPath(); c.moveTo(-600, y); c.lineTo(W + 600, y); c.stroke(); }
  c.fillStyle = '#170d2c'; c.fillRect(-600, ROOM.floor - 18, W + 1200, 18);
  // the rug
  c.fillStyle = '#5a2a5e'; c.beginPath(); c.ellipse(1000, ROOM.floor + 70, 420, 46, 0, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(246,196,83,0.35)'; c.lineWidth = 4; c.beginPath(); c.ellipse(1000, ROOM.floor + 70, 380, 36, 0, 0, TAU); c.stroke();
  // the moonlight through the window, down across the floor
  const { x, y, w, h } = ROOM.win;
  c.save(); c.globalCompositeOperation = 'screen';
  const mg = c.createLinearGradient(x, y + h, x - 300, H + 100);
  mg.addColorStop(0, 'rgba(150,140,230,0.10)'); mg.addColorStop(1, 'rgba(150,140,230,0)');
  c.fillStyle = mg;
  c.beginPath(); c.moveTo(x, y + h + 22); c.lineTo(x + w, y + h + 22); c.lineTo(x + w - 380, H + 160); c.lineTo(x - 460, H + 160); c.closePath(); c.fill();
  // the hall light's wedge across the floor from the door
  const d = ROOM.door;
  const hg = c.createLinearGradient(d.x, ROOM.floor, d.x + 700, H + 100);
  hg.addColorStop(0, `rgba(255,200,130,${0.28 * hall})`); hg.addColorStop(1, 'rgba(255,200,130,0)');
  c.fillStyle = hg;
  c.beginPath(); c.moveTo(d.x, ROOM.floor); c.lineTo(d.x + d.w, ROOM.floor); c.lineTo(d.x + d.w + 700, H + 200); c.lineTo(d.x + 120, H + 200); c.closePath(); c.fill();
  c.restore();
}

/** The doorway: the warm hall beyond (a banister, the hook with the orange lifeboat jacket), the open door leaf. */
export function drawDoor(c: C2, g: C2, t: number, hall: number) {
  const d = ROOM.door, fl = ROOM.floor, h = fl - d.y;
  c.save();
  c.beginPath(); c.rect(d.x, d.y, d.w, h); c.clip();
  const hg = c.createLinearGradient(d.x, d.y, d.x + d.w, fl);
  hg.addColorStop(0, mixHex('#3a2440', '#f2b874', hall)); hg.addColorStop(1, mixHex('#2a1830', '#b8683a', hall));
  c.fillStyle = hg; c.fillRect(d.x, d.y, d.w, h);
  c.fillStyle = rgbaHex('#7a3a20', 0.35 * hall); c.fillRect(d.x, fl - 40, d.w, 40);
  c.strokeStyle = rgbaHex('#5a2a14', 0.75); c.lineWidth = 8;
  c.beginPath(); c.moveTo(d.x + d.w * 0.55, fl - 20); c.lineTo(d.x + d.w + 40, d.y + 120); c.stroke();
  c.lineWidth = 4; for (let k = 0; k < 6; k++) { const bx = d.x + d.w * 0.6 + k * 26; c.beginPath(); c.moveTo(bx, fl - 30 - k * 44); c.lineTo(bx, fl - 30 - k * 44 + 90); c.stroke(); }
  c.fillStyle = rgbaHex('#5a2a14', 0.6); c.fillRect(d.x + 30, d.y + 70, 70, 54);
  c.fillStyle = rgbaHex('#ffe7b8', 0.6); c.fillRect(d.x + 37, d.y + 77, 56, 40);
  // the hook and the lifeboat jacket (orange, a reflective band)
  const jx = d.x + 60, jy = d.y + 190;
  c.fillStyle = '#5a2a14'; c.fillRect(jx - 4, jy - 14, 8, 10);
  c.fillStyle = HEX.orange;
  c.beginPath(); c.moveTo(jx - 26, jy); c.lineTo(jx + 26, jy); c.lineTo(jx + 34, jy + 120); c.lineTo(jx - 34, jy + 120); c.closePath(); c.fill();
  c.fillStyle = '#e8e8e8'; c.fillRect(jx - 32, jy + 70, 64, 10);
  c.restore();
  // the frame and the open door leaf, swung into the room against the wall on the left
  c.fillStyle = '#140a26';
  c.beginPath(); c.moveTo(d.x, d.y); c.lineTo(d.x - 70, d.y + 26); c.lineTo(d.x - 70, fl + 14); c.lineTo(d.x, fl); c.closePath(); c.fill();
  c.fillStyle = 'rgba(246,196,83,0.5)'; c.beginPath(); c.arc(d.x - 56, d.y + h * 0.55, 5, 0, TAU); c.fill();
  c.strokeStyle = '#140a26'; c.lineWidth = 18; c.strokeRect(d.x - 9, d.y - 9, d.w + 18, h + 18);
  const lg = g.createRadialGradient(d.x + d.w / 2, d.y + h * 0.4, 20, d.x + d.w / 2, d.y + h * 0.4, h * 0.9);
  lg.addColorStop(0, `rgba(255,190,110,${0.05 * hall})`); lg.addColorStop(1, 'rgba(255,190,110,0)');
  g.fillStyle = lg; g.fillRect(d.x - 400, d.y - 300, d.w + 800, h + 400);
}

/** The window: the night sky, stars, the crescent moon, the far sea with its moon path and a lighthouse whose beam
 *  turns; the frame, the sill, the curtains. */
export function drawWindow(c: C2, g: C2, t: number) {
  const { x, y, w, h } = ROOM.win, hz = ROOM.horizon, m = ROOM.moon;
  c.save();
  c.beginPath(); c.rect(x, y, w, h); c.clip();
  const sky = c.createLinearGradient(0, y, 0, hz);
  sky.addColorStop(0, '#120f36'); sky.addColorStop(1, '#3b2a74');
  c.fillStyle = sky; c.fillRect(x, y, w, hz - y);
  for (let i = 0; i < 70; i++) {
    const sx = x + h01(i, 31) * w, sy = y + h01(i, 32) * (hz - y - 10);
    const tw = 0.5 + 0.5 * Math.sin(t * (0.8 + 2.4 * h01(i, 33)) + 6 * h01(i, 34));
    c.fillStyle = `rgba(255,248,230,${0.25 + 0.65 * tw * h01(i, 35)})`;
    c.beginPath(); c.arc(sx, sy, 0.7 + 1.5 * h01(i, 36), 0, TAU); c.fill();
  }
  c.save();
  c.beginPath(); c.rect(x, y, w, h); c.arc(m.x - m.r * 0.42, m.y - m.r * 0.18, m.r * 0.9, 0, TAU); c.clip('evenodd');
  c.fillStyle = '#fbf1cf'; c.beginPath(); c.arc(m.x, m.y, m.r, 0, TAU); c.fill();
  c.restore();
  const sea = c.createLinearGradient(0, hz, 0, y + h);
  sea.addColorStop(0, '#2a2766'); sea.addColorStop(1, '#100d2a');
  c.fillStyle = sea; c.fillRect(x, hz, w, y + h - hz);
  // a headland with the lighthouse, its beam sweeping
  c.fillStyle = '#0f0b26';
  c.beginPath(); c.moveTo(x - 10, hz + 4); c.quadraticCurveTo(x + 50, hz - 26, x + 120, hz - 18); c.lineTo(x + 160, hz + 4); c.closePath(); c.fill();
  const lx = x + 92, ly = hz - 22;
  c.fillStyle = '#e8e0f8'; c.beginPath(); c.moveTo(lx - 7, ly); c.lineTo(lx - 4, ly - 40); c.lineTo(lx + 4, ly - 40); c.lineTo(lx + 7, ly); c.closePath(); c.fill();
  c.fillStyle = '#ff5a5f'; c.fillRect(lx - 5, ly - 28, 10, 8);
  const ba = t * 1.6, bv = Math.cos(ba);
  const bg = c.createLinearGradient(lx, ly - 44, lx + 260 * bv, ly - 50);
  bg.addColorStop(0, `rgba(255,246,200,${0.45 * Math.abs(bv)})`); bg.addColorStop(1, 'rgba(255,246,200,0)');
  c.fillStyle = bg; c.beginPath(); c.moveTo(lx, ly - 44); c.lineTo(lx + 300 * bv, ly - 64); c.lineTo(lx + 300 * bv, ly - 28); c.closePath(); c.fill();
  g.fillStyle = `rgba(255,246,200,${0.5 + 0.5 * Math.max(0, Math.cos(ba * 2))})`; g.beginPath(); g.arc(lx, ly - 44, 4, 0, TAU); g.fill();
  c.lineWidth = 2;
  for (let i = 0; i < 24; i++) {
    const u = i / 24, yy = hz + 4 + u * u * (y + h - hz - 8);
    const ww = (6 + 36 * u) * (0.5 + 0.5 * Math.sin(t * 1.3 + i * 2.1));
    c.strokeStyle = `rgba(251,241,207,${0.5 - 0.3 * u})`;
    c.beginPath(); c.moveTo(m.x - ww + 8 * Math.sin(i * 1.7 + t * 0.6), yy); c.lineTo(m.x + ww + 8 * Math.sin(i * 1.7 + t * 0.6), yy); c.stroke();
  }
  c.restore();
  const mg = g.createRadialGradient(m.x, m.y, m.r * 0.9, m.x, m.y, m.r * 3);
  mg.addColorStop(0, 'rgba(251,241,207,0.035)'); mg.addColorStop(1, 'rgba(251,241,207,0)');
  g.fillStyle = mg; g.beginPath(); g.arc(m.x, m.y, m.r * 3, 0, TAU); g.fill();
  c.strokeStyle = '#120a24'; c.lineWidth = 16; c.strokeRect(x, y, w, h);
  c.lineWidth = 10;
  c.beginPath(); c.moveTo(x + w / 2, y); c.lineTo(x + w / 2, y + h); c.moveTo(x, y + h * 0.48); c.lineTo(x + w, y + h * 0.48); c.stroke();
  const s = ROOM.sill;
  c.fillStyle = '#3a2768'; c.fillRect(s.x, s.y, s.w, s.h);
  c.fillStyle = 'rgba(200,180,255,0.25)'; c.fillRect(s.x, s.y, s.w, 3);
  curtain(c, x - 70, x + 18, -1, t);
  curtain(c, x + w - 18, x + w + 70, 1, t);
  c.fillStyle = '#120a24'; c.fillRect(x - 110, y - 34, w + 220, 9);
}

function curtain(c: C2, x0: number, x1: number, side: number, t: number) {
  const top = ROOM.win.y - 30, tie = ROOM.win.y + 290, bot = ROOM.sill.y + 70;
  const inner = side < 0 ? x1 : x0, outer = side < 0 ? x0 : x1;
  const g = c.createLinearGradient(x0, 0, x1, 0);
  for (let k = 0; k <= 6; k++) g.addColorStop(k / 6, k % 2 ? '#3d2170' : '#2a1552');
  c.fillStyle = g;
  const sway = 4 * Math.sin(t * 0.5 + side);
  c.beginPath();
  c.moveTo(outer, top); c.lineTo(inner, top);
  c.quadraticCurveTo(inner, tie - 120, outer + (inner - outer) * 0.25 + sway, tie);
  c.quadraticCurveTo(inner + sway, tie + 120, inner - (inner - outer) * 0.1 + sway, bot);
  c.lineTo(outer, bot); c.closePath(); c.fill();
  c.fillStyle = 'rgba(198,92,240,0.5)';
  c.beginPath(); c.ellipse(outer + (inner - outer) * 0.3 + sway, tie, 26, 7, 0, 0, TAU); c.fill();
}

/** The calendar (one day ringed in gold) and the child's crayon drawing taped to the wall. */
export function drawDecor(c: C2) {
  const cx = 404, cy = 300;
  c.save(); c.translate(cx, cy); c.rotate(-0.02);
  c.fillStyle = '#ece4f6'; c.fillRect(0, 0, 118, 156);
  c.fillStyle = '#3b5aa8'; c.fillRect(6, 6, 106, 54);
  c.fillStyle = '#9fd0ff'; c.beginPath(); c.moveTo(6, 44); c.quadraticCurveTo(40, 34, 70, 44); c.quadraticCurveTo(95, 52, 112, 42); c.lineTo(112, 60); c.lineTo(6, 60); c.closePath(); c.fill();
  c.font = font(FAM.monoB(), 11); c.fillStyle = '#2a1840'; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText('OCTOBER', 59, 76);
  c.fillStyle = 'rgba(42,24,64,0.55)';
  for (let r = 0; r < 5; r++) for (let k = 0; k < 7; k++) c.fillRect(10 + k * 14.5, 86 + r * 13, 9, 7);
  c.strokeStyle = HEX.gold; c.lineWidth = 2.5; c.beginPath(); c.arc(10 + 5 * 14.5 + 4.5, 86 + 3 * 13 + 3.5, 8, 0, TAU); c.stroke();
  c.fillStyle = '#5a3a70'; c.beginPath(); c.arc(59, -4, 4, 0, TAU); c.fill();
  c.restore();
  // the child's crayon drawing: the sea, a stone with a face at the bottom, people on a hill pointing, the sun
  const dx = 1030, dy = 128;
  c.save(); c.translate(dx, dy); c.rotate(0.05);
  c.fillStyle = '#f6f0e2'; c.fillRect(0, 0, 160, 124);
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = '#3a8ee8'; c.lineWidth = 3;
  for (let k = 0; k < 4; k++) { c.beginPath(); for (let x = 6; x < 156; x += 8) c.lineTo(x, 52 + k * 16 + 3 * Math.sin(x * 0.3 + k)); c.stroke(); }
  c.fillStyle = '#d6c8a8'; c.beginPath(); c.arc(56, 98, 16, 0, TAU); c.fill();
  c.fillStyle = '#f6f0e2'; c.beginPath(); c.arc(56, 102, 5, 0, TAU); c.fill();
  c.fillStyle = '#2a1d14'; c.beginPath(); c.arc(51, 93, 1.6, 0, TAU); c.arc(61, 93, 1.6, 0, TAU); c.fill();
  c.strokeStyle = '#ff4f9a'; c.lineWidth = 1.6; c.beginPath(); c.arc(56, 95, 3.5, 0.3, Math.PI - 0.3); c.stroke();
  c.fillStyle = '#ff7a6b'; c.beginPath(); c.arc(64, 82, 4, 0, TAU); c.fill();
  c.fillStyle = '#5bbf4a'; c.beginPath(); c.moveTo(96, 50); c.quadraticCurveTo(128, 20, 160, 46); c.lineTo(160, 50); c.closePath(); c.fill();
  c.strokeStyle = '#2a1d14'; c.lineWidth = 2;
  for (const px of [118, 134]) { c.beginPath(); c.arc(px, 22, 4, 0, TAU); c.moveTo(px, 26); c.lineTo(px, 38); c.moveTo(px, 30); c.lineTo(px - 12, 36); c.moveTo(px, 38); c.lineTo(px - 3, 44); c.moveTo(px, 38); c.lineTo(px + 3, 44); c.stroke(); }
  c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(22, 20, 11, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.45)'; c.fillRect(-8, -6, 26, 12); c.fillRect(142, -6, 26, 12);
  c.restore();
}

/** The chest of drawers with the family photo on it: four on a beach, a rai stone beside them. */
export function drawChest(c: C2) {
  const ch = ROOM.chest;
  c.fillStyle = '#1e1238'; c.fillRect(ch.x, ch.y, ch.w, ch.h);
  c.fillStyle = '#2e1c52'; c.fillRect(ch.x - 8, ch.y - 10, ch.w + 16, 12);
  c.strokeStyle = 'rgba(120,90,170,0.35)'; c.lineWidth = 2;
  for (const k of [0.4, 0.72]) { c.beginPath(); c.moveTo(ch.x + 12, ch.y + ch.h * k); c.lineTo(ch.x + ch.w - 12, ch.y + ch.h * k); c.stroke(); }
  c.fillStyle = 'rgba(246,196,83,0.5)';
  for (const k of [0.22, 0.56, 0.86]) { c.beginPath(); c.arc(ch.x + ch.w / 2, ch.y + ch.h * k, 4, 0, TAU); c.fill(); }
  // the photo: grandad, mum, dad and the child on a beach, a rai stone beside them
  const px = ch.x + 36, py = ch.y - 100;
  c.fillStyle = '#c9a65a'; c.fillRect(px, py, 118, 90);
  const pg = c.createLinearGradient(0, py + 6, 0, py + 84);
  pg.addColorStop(0, '#f6c483'); pg.addColorStop(0.55, '#ff9a7a'); pg.addColorStop(0.56, '#3a6aa8'); pg.addColorStop(0.7, '#e9d29a'); pg.addColorStop(1, '#e9d29a');
  c.fillStyle = pg; c.fillRect(px + 6, py + 6, 106, 78);
  c.fillStyle = '#fff1c0'; c.beginPath(); c.arc(px + 30, py + 46, 9, 0, TAU); c.fill();
  const fig = (x: number, hh: number, pose: 'stand' | 'hold' = 'stand') => person(c, x, py + 80, hh, pose, { col: '#2a1830' });
  fig(px + 22, 46); fig(px + 44, 52); fig(px + 64, 55, 'hold'); fig(px + 82, 28);
  c.fillStyle = '#d6c8a8'; c.beginPath(); c.arc(px + 100, py + 70, 10, 0, TAU); c.fill();
  c.fillStyle = '#e9d29a'; c.beginPath(); c.arc(px + 100, py + 71, 3, 0, TAU); c.fill();
  c.fillStyle = '#6b3a2a'; c.fillRect(ch.x + 168, ch.y - 30, 22, 22);
  c.fillStyle = '#3f8f5a'; for (let k = 0; k < 5; k++) { c.beginPath(); c.ellipse(ch.x + 179 + (k - 2) * 7, ch.y - 40 - 6 * Math.abs(k - 2), 5, 13, (k - 2) * 0.4, 0, TAU); c.fill(); }
}

/** The shelf over the bed's head: books, a toy lifeboat, and the toy rai stone (the night-light, lit by `lamp`;
 *  `idle` is its faint pink standby glow). */
export function drawShelf(c: C2, g: C2, t: number, lamp: number, idle: number) {
  const s = ROOM.shelf, toy = ROOM.toy;
  c.fillStyle = '#2e1c52'; c.fillRect(s.x, s.y, s.w, 12);
  c.fillStyle = '#1e1238'; c.fillRect(s.x + 20, s.y + 12, 10, 26); c.fillRect(s.x + s.w - 30, s.y + 12, 10, 26);
  const books = ['#c65cf0', '#6f8cff', '#ff8a2a', '#78d63a', '#ff4f9a'];
  books.forEach((col, i) => { c.fillStyle = mixHex(col, '#1d1240', 0.45); c.fillRect(s.x + 10 + i * 15, s.y - 54 + (i % 2) * 6, 13, 54 - (i % 2) * 6); });
  const bx = s.x + 120, by = s.y;
  c.fillStyle = mixHex(HEX.orange, '#1d1240', 0.25);
  c.beginPath(); c.moveTo(bx - 30, by - 16); c.lineTo(bx + 32, by - 18); c.lineTo(bx + 24, by); c.lineTo(bx - 24, by); c.closePath(); c.fill();
  c.fillStyle = '#d8d0e8'; c.fillRect(bx - 12, by - 30, 22, 13);
  stone(c, toy.x, toy.y, toy.r, { seed: 7, heart: lamp > 0.05 ? '#ffe7a6' : HEX.pink, heartA: Math.max(0.3 * idle, lamp) });
  const hy = toy.y + toy.r * 0.06;
  const a = Math.max(lamp, 0.3 * idle);
  if (a > 0) {
    const hg = g.createRadialGradient(toy.x, hy, 0, toy.x, hy, toy.r * 3.2);
    hg.addColorStop(0, rgbaHex(lamp > 0.05 ? '#fff3c8' : HEX.pink, 0.45 * a)); hg.addColorStop(0.3, rgbaHex(lamp > 0.05 ? HEX.gold : HEX.pink, 0.12 * a)); hg.addColorStop(1, rgbaHex(HEX.gold, 0));
    g.fillStyle = hg; g.beginPath(); g.arc(toy.x, hy, toy.r * 3.2, 0, TAU); g.fill();
    const wg = g.createRadialGradient(toy.x, toy.y, 10, toy.x, toy.y, 240);
    wg.addColorStop(0, rgbaHex(HEX.gold, 0.03 * lamp)); wg.addColorStop(1, rgbaHex(HEX.gold, 0));
    g.fillStyle = wg; g.beginPath(); g.arc(toy.x, toy.y, 240, 0, TAU); g.fill();
  }
}

/** The beam from the toy stone's hole to the disc on the wall, with dust drifting in it. */
export function drawBeam(g: C2, t: number, lamp: number) {
  if (lamp <= 0) return;
  const toy = ROOM.toy, d = ROOM.disc;
  const ax = toy.x, ay = toy.y + toy.r * 0.06;
  const dx = d.x - ax, dy = d.y - ay, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
  const gr = g.createLinearGradient(ax, ay, d.x, d.y);
  gr.addColorStop(0, rgbaHex(HEX.gold, 0.08 * lamp)); gr.addColorStop(1, rgbaHex(HEX.gold, 0.015 * lamp));
  g.fillStyle = gr;
  g.beginPath();
  g.moveTo(ax + nx * 6, ay + ny * 6); g.lineTo(d.x + nx * d.r * 0.92, d.y + ny * d.r * 0.92);
  g.lineTo(d.x - nx * d.r * 0.92, d.y - ny * d.r * 0.92); g.lineTo(ax - nx * 6, ay - ny * 6); g.closePath(); g.fill();
  for (let i = 0; i < 40; i++) {
    const u = (h01(i, 51) + t * 0.01 * (0.5 + h01(i, 52))) % 1, w = (h01(i, 53) - 0.5) * 1.6 * u;
    const px = ax + dx * u + nx * d.r * w + 6 * Math.sin(t * 0.7 + i), py = ay + dy * u + ny * d.r * w + 6 * Math.cos(t * 0.5 + i);
    g.fillStyle = rgbaHex('#fff3c8', (0.12 + 0.2 * h01(i, 54)) * lamp * (0.5 + 0.5 * Math.sin(t * 1.5 + i)));
    g.beginPath(); g.arc(px, py, 1 + 1.6 * h01(i, 55), 0, TAU); g.fill();
  }
}

// ------------------------------------------------------------------ the bed and the people

/** The bed: headboard at the right (by the window), footboard at the left, mattress, pillow; slippers on the rug. */
export function drawBed(c: C2) {
  const b = ROOM.bed, fl = ROOM.floor;
  c.fillStyle = '#170d2c';
  c.beginPath(); c.moveTo(b.x1, fl); c.lineTo(b.x1, 590); c.quadraticCurveTo(b.x1 + 22, 552, b.x1 + 44, 590); c.lineTo(b.x1 + 44, fl); c.closePath(); c.fill();
  c.fillRect(b.x0 - 30, 652, 30, fl - 652);
  c.fillRect(b.x0, b.side, b.x1 - b.x0, 26);
  c.fillRect(b.x0 + 10, b.side, 16, fl - b.side); c.fillRect(b.x1 - 26, b.side, 16, fl - b.side);
  c.fillStyle = '#3c2c6a'; c.fillRect(b.x0, b.top, b.x1 - b.x0, b.side - b.top);
  c.fillStyle = '#6a5a9e';
  c.beginPath(); c.ellipse(b.x1 - 74, b.top - 14, 68, 24, 0, 0, TAU); c.fill();
  c.fillStyle = '#c85a8a';
  c.beginPath(); c.ellipse(b.x0 + 80, fl + 14, 26, 9, 0.1, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(b.x0 + 128, fl + 18, 26, 9, -0.05, 0, TAU); c.fill();
}

/** The child under the quilt (head on the pillow, faceless); `lift` raises the head (the question). */
export function drawChild(c: C2, t: number, lift: number, em?: Emote, emT0 = -1e9) {
  const b = ROOM.bed;
  const breathe = 3 * Math.sin(t * 1.1);
  const hx = b.x1 - 86 - 8 * lift, hy = b.top - 38 - 20 * lift;
  c.fillStyle = SIL;
  c.beginPath(); c.arc(hx, hy, 25, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(hx + 14, hy - 10, 18, 14, -0.4, 0, TAU); c.fill();
  const q = () => {
    c.beginPath();
    c.moveTo(b.x0 + 30, b.side + 30);
    c.lineTo(b.x0 + 30, b.top - 6);
    c.quadraticCurveTo(b.x0 + 140, b.top - 30, b.x0 + 290, b.top - 50 - breathe);
    c.quadraticCurveTo(b.x1 - 230, b.top - 66 - breathe, hx - 22, hy + 22 + 12 * lift);
    c.lineTo(hx + 4, b.top + 6);
    c.lineTo(b.x1 - 30, b.top + 6);
    c.lineTo(b.x1 - 30, b.side + 30);
    c.closePath();
  };
  q(); c.fillStyle = '#4b2c86'; c.fill();
  c.save(); q(); c.clip();
  c.strokeStyle = 'rgba(246,196,83,0.22)'; c.lineWidth = 2.5;
  for (let j = 0; j < 4; j++) for (let i = 0; i < 15; i++) {
    const x = b.x0 + 40 + i * 44 + (j % 2) * 22, y = b.top - 70 + j * 36;
    c.beginPath(); c.arc(x, y, 7, 0, TAU); c.stroke();
  }
  c.fillStyle = 'rgba(13,9,24,0.35)'; c.fillRect(b.x0, b.top + 6, b.x1 - b.x0, 60);
  c.restore();
  c.fillStyle = SIL;
  c.beginPath(); c.ellipse(hx - 50, b.top - 26 - 6 * lift, 13, 9, -0.3, 0, TAU); c.fill();
  if (em) emote(c, hx, hy, 34, em, t, emT0);
}

/**
 * Mum on the bed's near edge, facing the child, the book open on her lap (it closes as `closed` goes to 1). `look`
 * tips her head (down to the book > 0, up to the child < 0); `lean` brings her towards the child.
 */
export function drawMum(c: C2, t: number, o: { look: number; lean: number; closed: number; rim: number; em?: Emote; emT0?: number }) {
  const fx = 980 + 22 * o.lean, fy = ROOM.floor, h = 350;
  const u = h / 100, tilt = o.look * 0.35 + 0.3 * o.lean;
  if (o.rim > 0) person(c, fx - 2.5, fy, h, 'seated', { col: rgbaHex(HEX.gold, 0.35 * o.rim), t, seed: 3, headTilt: tilt });
  person(c, fx, fy, h, 'seated', { col: SIL, t, seed: 3, headTilt: tilt, emote: o.em, emoteT0: o.emT0 });
  // her hair, up in a bun (the silhouettes are faceless, not shapeless)
  const hx = fx + Math.sin(t * 2 + 3) * 0.24 * u, hy = fy - 86 * u;
  c.save(); c.translate(hx, hy); c.rotate(tilt); c.fillStyle = SIL;
  c.beginPath(); c.arc(-7.5 * u, -6 * u, 4.6 * u, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(-2 * u, -2 * u, 9.6 * u, 8 * u, -0.3, Math.PI * 0.9, Math.PI * 2.1); c.fill();
  c.restore();
  // the book on her lap, open (or closing): pages lit by the night-light
  const bx = fx + 17 * u, by = fy - 46 * u;
  c.save(); c.translate(bx, by); c.rotate(-0.35);
  const wpg = 15 * u * (1 - 0.5 * o.closed);
  c.fillStyle = '#5a2a5e'; c.fillRect(-wpg - 2, -1.5 * u, 2 * wpg + 4, 9 * u);
  c.fillStyle = mixHex('#efe6d0', '#ffe9b0', o.rim * 0.5);
  if (o.closed < 0.95) { c.fillRect(-wpg, -2 * u, wpg - 1, 8 * u); c.fillRect(1, -2 * u, wpg - 1, 8 * u); }
  c.strokeStyle = 'rgba(90,60,90,0.5)'; c.lineWidth = 1.2;
  if (o.closed < 0.5) for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(-wpg + 4, -0.6 * u + k * 1.6 * u); c.lineTo(-4, -0.6 * u + k * 1.6 * u); c.moveTo(4, -0.6 * u + k * 1.6 * u); c.lineTo(wpg - 4, -0.6 * u + k * 1.6 * u); c.stroke(); }
  c.restore();
}

/** Dad leaning in the lit doorway, arms crossed, backlit; his emote at his head. */
export function drawDad(c: C2, t: number, hall: number, em?: Emote, emT0?: number) {
  const d = ROOM.door;
  person(c, d.x + d.w - 46, ROOM.floor, 470, 'lean', { col: SIL, t, seed: 5, headTilt: 0.12, rim: rgbaHex('#ffd9a0', 0.9 * hall), emote: em, emoteT0: emT0 });
}

// ------------------------------------------------------------------ the shadow-play

export interface Story {
  t: number;
  /** 0..1: the projection's brightness (the lamp). */
  light: number;
  raftX: number;     // the raft's x in the disc
  rough: number;     // 0 calm .. 1 storm
  flash: number;     // lightning 0..1
  stoneOnRaft: boolean;
  stoneX: number; stoneY: number; stoneRot: number;
  reach: number;     // 0..1 a paddler leaning over, reaching down
  raftA: number;     // the raft's opacity (it leaves)
  shore: number;     // 0 (off to the right) .. 1 (in)
  point: number;     // 0..1 the islanders point
  heart: number;     // 0..1 the light through the stone's hole
  threads: number;   // 0..1 threads of light from the islanders to the stone
  pulse: number;     // a ring pulse around the stone
}

// The shadow-play is drawn in its own units: the disc's radius is SR, scaled up by SS onto the wall.
const SS = 1.36;
export const SR = 161;
const SEA_Y = 26;
const BED_Y = 124;
const FOLK = [70, 96, 120];
function waveY(x: number, t: number, rough: number) {
  const a = 3.5 + 15 * rough;
  return SEA_Y + a * Math.sin(x * 0.04 + t * (1.4 + 1.6 * rough)) + 0.45 * a * Math.sin(x * 0.1 - t * 2.1);
}

/** A rai stone in shadow: a disc with a real hole (the light shows through it). */
function shadowStone(c: C2, x: number, y: number, r: number, rot: number, col: string) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.beginPath(); c.arc(0, 0, r, 0, TAU); c.moveTo(r * 0.32, r * 0.08); c.arc(0, r * 0.08, r * 0.32, 0, TAU);
  c.fillStyle = col; c.fill('evenodd');
  c.restore();
}

export const storyPt = (x: number, y: number): [number, number] => [ROOM.disc.x + x * SS, ROOM.disc.y + y * SS];

/** The projected disc and its shadow puppets: the raft, the storm, the sinking, the island pointing at the sea. */
export function drawStory(c: C2, g: C2, s: Story) {
  const d = ROOM.disc, R = SR, t = s.t;
  if (s.light <= 0.001) return;
  c.save();
  c.translate(d.x, d.y); c.scale(SS, SS);
  c.globalAlpha = s.light;
  c.beginPath(); c.arc(0, 0, R, 0, TAU); c.clip();
  const lg = c.createRadialGradient(0, -20, 6, 0, 0, R);
  lg.addColorStop(0, mixHex('#f2c46a', '#fff4dc', s.flash)); lg.addColorStop(0.6, mixHex('#d99a3e', '#f6e0b0', s.flash)); lg.addColorStop(1, '#7a4a28');
  c.fillStyle = lg; c.fillRect(-R, -R, 2 * R, 2 * R);
  if (s.rough > 0.02) {
    c.fillStyle = rgbaHex(SHADOW, 0.9 * s.rough);
    for (let k = 0; k < 7; k++) {
      const cx = -R + (k / 6) * 2 * R + 14 * Math.sin(t * 0.8 + k), cy = -R + 8 - 50 * (1 - s.rough) + 12 * h01(k, 61);
      c.beginPath(); c.arc(cx, cy, 40 + 22 * h01(k, 62), 0, TAU); c.fill();
    }
    c.strokeStyle = rgbaHex(SHADOW, 0.4 * s.rough); c.lineWidth = 1.6;
    c.beginPath();
    for (let i = 0; i < 50; i++) {
      const rx = -R + ((h01(i, 63) * 2 * R + t * 180) % (2 * R + 60)) - 30, ry = -R + ((h01(i, 64) * 2 * R + t * 620) % (2 * R));
      c.moveTo(rx, ry); c.lineTo(rx - 10, ry + 24);
    }
    c.stroke();
  }
  // the island (Yap) sliding in from the right: shore, palm, its stone bank, islanders pointing at the sea
  if (s.shore > 0) {
    const ox = (1 - ease.outCubic(s.shore)) * 260;
    c.save(); c.translate(ox, 0);
    c.fillStyle = SHADOW;
    c.beginPath(); c.moveTo(48, R); c.lineTo(48, SEA_Y + 22); c.quadraticCurveTo(70, SEA_Y - 6, 130, SEA_Y - 10); c.lineTo(R + 20, SEA_Y - 12); c.lineTo(R + 20, R); c.closePath(); c.fill();
    palm(c, 150, SEA_Y - 9, 104, -0.2, { col: SHADOW, t });
    shadowStone(c, 138, SEA_Y - 26, 15, 0.1, SHADOW); shadowStone(c, 156, SEA_Y - 22, 11, -0.1, SHADOW);
    FOLK.forEach((x, i) => person(c, x, SEA_Y - 8 - i, 50 - i * 3, s.point > 0.5 ? 'point' : 'stand', { col: SHADOW, flip: true, t, seed: i }));
    c.restore();
  }
  c.beginPath(); c.moveTo(-R, R);
  for (let x = -R; x <= R; x += 6) c.lineTo(x, waveY(x, t, s.rough));
  c.lineTo(R, R); c.closePath();
  c.fillStyle = rgbaHex(SHADOW, 0.4); c.fill();
  c.fillStyle = SHADOW;
  c.beginPath(); c.moveTo(-R, R); c.lineTo(-R, BED_Y + 4); c.quadraticCurveTo(-90, BED_Y - 8, -20, BED_Y + 2); c.quadraticCurveTo(60, BED_Y + 10, R, BED_Y - 4); c.lineTo(R, R); c.closePath(); c.fill();
  if (!s.stoneOnRaft) shadowStone(c, s.stoneX, s.stoneY, 22, s.stoneRot, SHADOW);
  if (s.raftA > 0.01) {
    const rx = s.raftX, ry = waveY(rx, t, s.rough) - 3;
    const tilt = 0.06 * Math.sin(t * 1.3) + 0.3 * s.rough * Math.sin(t * 2.6);
    c.save(); c.globalAlpha *= s.raftA; c.translate(rx, ry); c.rotate(tilt);
    c.fillStyle = SHADOW;
    c.fillRect(-70, -5, 140, 10);
    for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(-60 + k * 24, 0, 5.5, 0, TAU); c.fill(); }
    if (s.stoneOnRaft) {
      shadowStone(c, 0, -26, 22, 0, SHADOW);
      c.lineWidth = 4; c.strokeStyle = SHADOW; c.beginPath(); c.moveTo(-34, -24); c.lineTo(34, -24); c.stroke();
    }
    person(c, 50, -4, 50, 'paddle', { col: SHADOW, t, seed: 2 });
    if (s.reach > 0.02) {
      c.save(); c.translate(-50, -4); c.rotate(-0.95 * ease.inOutCubic(s.reach)); person(c, 0, 0, 50, 'point', { col: SHADOW, t, seed: 1, flip: true }); c.restore();
    } else person(c, -50, -4, 50, 'paddle', { col: SHADOW, t, seed: 1 });
    c.restore();
  }
  c.restore();
  if (s.flash > 0.05) {
    g.save(); g.translate(d.x, d.y); g.scale(SS, SS); g.beginPath(); g.arc(0, 0, R, 0, TAU); g.clip();
    g.strokeStyle = `rgba(255,250,235,${0.8 * s.flash})`; g.lineWidth = 3;
    g.beginPath();
    let bx = 40, by = -R;
    g.moveTo(bx, by);
    for (let k = 0; k < 6; k++) { bx += (h01(k, 65) - 0.55) * 36; by += 28; g.lineTo(bx, by); }
    g.stroke(); g.restore();
  }
  const [sx, sy] = storyPt(s.stoneX, s.stoneY + 22 * 0.08);
  if (!s.stoneOnRaft && s.heart > 0) {
    const a = s.heart * s.light, rr = 40 + 50 * s.heart;
    const hg = g.createRadialGradient(sx, sy, 0, sx, sy, rr);
    hg.addColorStop(0, rgbaHex('#fff6dc', 0.85 * Math.min(1, a))); hg.addColorStop(0.3, rgbaHex(HEX.gold, 0.35 * a)); hg.addColorStop(1, rgbaHex(HEX.gold, 0));
    g.fillStyle = hg; g.beginPath(); g.arc(sx, sy, rr, 0, TAU); g.fill();
  }
  if (s.threads > 0 && s.shore > 0.9) {
    g.save(); g.beginPath(); g.arc(d.x, d.y, d.r, 0, TAU); g.clip();
    g.setLineDash([4, 8]); g.lineWidth = 2.5;
    FOLK.forEach((x, i) => {
      const hh = 50 - i * 3, [hx, hy] = storyPt(x - 0.4 * hh, SEA_Y - 8 - i - 0.84 * hh);
      const a = clamp(s.threads * 3 - i) * s.light;
      if (a <= 0) return;
      g.strokeStyle = rgbaHex('#fff1c0', 0.5 * a);
      g.beginPath(); g.moveTo(hx, hy); g.quadraticCurveTo((hx + sx) / 2 + 30, (hy + sy) / 2 - 30, sx, sy); g.stroke();
    });
    g.restore();
  }
  if (s.pulse > 0 && s.pulse < 1) {
    g.strokeStyle = rgbaHex('#fff1c0', 0.5 * (1 - s.pulse) * s.light); g.lineWidth = 3;
    g.beginPath(); g.arc(sx, sy, 30 + 70 * s.pulse, 0, TAU); g.stroke();
  }
  const halo = g.createRadialGradient(d.x, d.y, d.r * 0.9, d.x, d.y, d.r * 1.3);
  halo.addColorStop(0, rgbaHex(HEX.gold, 0.03 * s.light)); halo.addColorStop(1, rgbaHex(HEX.gold, 0));
  g.fillStyle = halo; g.beginPath(); g.arc(d.x, d.y, d.r * 1.3, 0, TAU); g.fill();
}
