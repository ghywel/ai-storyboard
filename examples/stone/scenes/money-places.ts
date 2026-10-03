// The money plate's places (his direction, 2026-10-02: "the machines live in places"): a press room, a city street at
// night with lit windows, a mining warehouse, a bank hall, a harbour night market. Canvas2D, 1920x1080 logical, pure
// functions of t; each place has depth (back, mid, front), a light source and something alive.
import { W, H } from '../engine/gl';
import { HEX } from '../engine/palette';
import { font } from '../engine/type';
import { clamp, frameIdx, lerp } from '../engine/util';
import { h01 } from './_rai';
import { FAM, TAU, gradientV, person, rgbaHex, stone } from './_motifs';
import { cloud } from './_world';

type C = CanvasRenderingContext2D;

/** A cone of light from a lamp at (x, y) down to the floor, screened over what is there. */
export function lightCone(c: C, x: number, y: number, w: number, floorY: number, col: string, a = 0.35) {
  c.save(); c.globalCompositeOperation = 'screen';
  const g = c.createLinearGradient(0, y, 0, floorY);
  g.addColorStop(0, rgbaHex(col, a)); g.addColorStop(1, rgbaHex(col, 0));
  c.fillStyle = g;
  c.beginPath(); c.moveTo(x - 30, y); c.lineTo(x + 30, y); c.lineTo(x + w / 2, floorY); c.lineTo(x - w / 2, floorY); c.closePath(); c.fill();
  c.restore();
}

/** An industrial pendant lamp hanging from the ceiling. */
export function pendantLamp(c: C, g: C, x: number, y: number, col = '#ffd59a') {
  c.strokeStyle = '#141018'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, y - 30); c.stroke();
  c.fillStyle = '#2a2a36'; c.beginPath(); c.moveTo(x - 50, y); c.lineTo(x + 50, y); c.lineTo(x + 18, y - 34); c.lineTo(x - 18, y - 34); c.closePath(); c.fill();
  g.fillStyle = rgbaHex(col, 0.9); g.beginPath(); g.ellipse(x, y + 2, 34, 8, 0, 0, TAU); g.fill();
}

/** A generic banknote: a bordered rectangle, a ring medallion (no portrait), a denomination; no real design. */
export function note(c: C, x: number, y: number, w: number, rot: number, col: string = HEX.lime, paper = '#d9ecc9') {
  const h = w * 0.5;
  c.save();
  c.translate(x, y); c.rotate(rot);
  c.fillStyle = paper; c.fillRect(-w / 2, -h / 2, w, h);
  c.strokeStyle = col; c.lineWidth = Math.max(2, w * 0.02); c.strokeRect(-w / 2 + w * 0.03, -h / 2 + w * 0.03, w * 0.94, h - w * 0.06);
  c.beginPath(); c.arc(w * 0.2, 0, h * 0.28, 0, TAU); c.stroke();
  c.beginPath(); c.arc(w * 0.2, 0, h * 0.1, 0, TAU); c.stroke();
  c.lineWidth = Math.max(1, w * 0.008);
  for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(-w * 0.36, -h * 0.2 + k * h * 0.1); c.lineTo(-w * 0.02, -h * 0.2 + k * h * 0.1); c.stroke(); }
  c.font = font(FAM.monoB(), h * 0.26); c.fillStyle = col; c.textAlign = 'left'; c.textBaseline = 'top';
  c.fillText('10', -w / 2 + w * 0.07, -h / 2 + w * 0.05);
  c.restore();
}

// ------------------------------------------------------------------ the press room

/** The press room: brick walls, pendant lamps, notes drying on a line, a punch clock by the door, the floor. */
export function pressRoom(c: C, g: C, t: number) {
  const fy = H * 0.74;
  // brick
  c.fillStyle = '#3e1d24'; c.fillRect(0, 0, W, fy);
  c.strokeStyle = 'rgba(20,8,12,0.55)'; c.lineWidth = 3;
  for (let r = 0; r * 44 < fy; r++) { const y = r * 44; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); for (let k = 0; k < 22; k++) { const x = k * 96 + (r % 2 ? 48 : 0); c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 44); c.stroke(); } }
  for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(${h01(i, 3) < 0.5 ? '90,40,44' : '30,12,16'},0.35)`; c.fillRect(Math.floor(h01(i, 4) * 20) * 96 + (h01(i, 5) < 0.5 ? 48 : 0), Math.floor(h01(i, 6) * 13) * 44, 94, 42); }
  // the door and the punch clock with its rack of time cards: hours counted, by the clock
  c.fillStyle = '#241216'; c.fillRect(W * 0.86, fy - 380, 200, 380);
  c.fillStyle = '#5a4a3a'; c.beginPath(); c.arc(W * 0.86 + 30, fy - 190, 8, 0, TAU); c.fill();
  c.fillStyle = '#c9c1a8'; c.fillRect(W * 0.74, fy - 330, 120, 150);
  c.fillStyle = '#2a2a2a'; c.beginPath(); c.arc(W * 0.74 + 60, fy - 285, 34, 0, TAU); c.fill();
  c.fillStyle = '#f4f1ea'; c.beginPath(); c.arc(W * 0.74 + 60, fy - 285, 28, 0, TAU); c.fill();
  c.strokeStyle = '#120d1d'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(W * 0.74 + 60, fy - 285); c.lineTo(W * 0.74 + 60 + 18 * Math.sin(t), fy - 285 - 18 * Math.cos(t)); c.stroke();
  c.font = font(FAM.monoB(), 16); c.fillStyle = '#3a2a1a'; c.textAlign = 'center'; c.fillText('IN / OUT', W * 0.74 + 60, fy - 210);
  for (let i = 0; i < 6; i++) { c.fillStyle = '#e9e1c8'; c.fillRect(W * 0.74 + 140 + (i % 3) * 22, fy - 330 + Math.floor(i / 3) * 70, 16, 60); }
  // notes drying on a line, pegged
  c.strokeStyle = '#1a1014'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(0, 150); c.quadraticCurveTo(W * 0.5, 210, W, 140); c.stroke();
  for (let i = 0; i < 9; i++) {
    const u = (i + 0.5) / 9, x = u * W, y = (1 - u) * (1 - u) * 150 + 2 * (1 - u) * u * 210 + u * u * 140;
    const sw = 0.05 * Math.sin(t * 2.2 + i);
    c.save(); c.translate(x, y); c.rotate(sw);
    note(c, 0, 52, 150, 0, '#4a8a3a', '#cfe3bd');
    c.fillStyle = '#c9a46a'; c.fillRect(-4, -8, 8, 18);
    c.restore();
  }
  // the floor: concrete with a safety stripe
  gradientV(c, '#3a3a44', '#1e1e26', 0, fy, W, H - fy);
  c.save(); c.beginPath(); c.rect(0, fy + 24, W, 22); c.clip();
  for (let x = -40; x < W + 40; x += 60) { c.fillStyle = HEX.yellow; c.beginPath(); c.moveTo(x, fy + 46); c.lineTo(x + 30, fy + 24); c.lineTo(x + 60, fy + 24); c.lineTo(x + 30, fy + 46); c.closePath(); c.fill(); }
  c.restore();
  pendantLamp(c, g, W * 0.3, 120); pendantLamp(c, g, W * 0.62, 110);
  lightCone(c, W * 0.3, 122, 700, fy, '#ffd59a', 0.25); lightCone(c, W * 0.62, 112, 700, fy, '#ffd59a', 0.25);
  return fy;
}

/** The press itself: a steel frame, two big rollers turning, a feed and a delivery; returns the nip (x, y). */
export function press(c: C, g: C, t: number, x: number, fy: number): [number, number] {
  const R = 120, top = fy - 560;
  c.fillStyle = '#2a3042'; c.fillRect(x - 280, top, 70, 560); c.fillRect(x + 210, top, 70, 560);
  c.fillStyle = '#353c52'; c.fillRect(x - 300, top - 30, 600, 50); c.fillRect(x - 300, fy - 60, 600, 60);
  c.strokeStyle = HEX.lime; c.lineWidth = 4; c.strokeRect(x - 300, top - 30, 600, 50);
  g.strokeStyle = rgbaHex(HEX.lime, 0.5); g.lineWidth = 6; g.strokeRect(x - 300, top - 30, 600, 50);
  const ny = top + 280;
  for (const dy of [-R, R]) {
    const cy = ny + dy;
    const rg = c.createLinearGradient(0, cy - R, 0, cy + R);
    rg.addColorStop(0, '#8a93ad'); rg.addColorStop(0.5, '#c9d0e4'); rg.addColorStop(1, '#4a5068');
    c.fillStyle = rg; c.beginPath(); c.arc(x, cy, R, 0, TAU); c.fill();
    c.strokeStyle = '#1a1e2c'; c.lineWidth = 6; c.stroke();
    const sp = (dy < 0 ? 1 : -1) * t * 12;
    c.strokeStyle = 'rgba(30,34,50,0.6)'; c.lineWidth = 4;
    for (let k = 0; k < 8; k++) { const a = sp + (k * TAU) / 8; c.beginPath(); c.moveTo(x + Math.cos(a) * R * 0.3, cy + Math.sin(a) * R * 0.3); c.lineTo(x + Math.cos(a) * R * 0.95, cy + Math.sin(a) * R * 0.95); c.stroke(); }
    c.fillStyle = '#1a1e2c'; c.beginPath(); c.arc(x, cy, 22, 0, TAU); c.fill();
  }
  // a pressure gauge, its needle trembling
  c.fillStyle = '#f4f1ea'; c.beginPath(); c.arc(x - 245, top + 90, 30, 0, TAU); c.fill();
  c.strokeStyle = '#120d1d'; c.lineWidth = 3; const na = -2 + 0.15 * Math.sin(t * 30);
  c.beginPath(); c.moveTo(x - 245, top + 90); c.lineTo(x - 245 + Math.cos(na) * 24, top + 90 + Math.sin(na) * 24); c.stroke();
  // the feed tray of blank paper
  c.fillStyle = '#2a3042'; c.fillRect(x - 520, ny + 40, 300, 22); c.fillRect(x - 500, ny + 62, 16, fy - ny - 62); c.fillRect(x - 256, ny + 62, 16, fy - ny - 62);
  for (let k = 0; k < 9; k++) { c.fillStyle = k % 2 ? '#e9ecdf' : '#dfe3d2'; c.fillRect(x - 500 + (k % 3) * 2, ny + 32 - k * 8, 250, 8); }
  c.fillStyle = '#e9ecdf'; c.beginPath(); c.moveTo(x - 250, ny - 34); c.lineTo(x - 110, ny - 4); c.lineTo(x - 110, ny + 4); c.lineTo(x - 250, ny - 22); c.closePath(); c.fill();
  return [x + R * 0.2, ny];
}

// ------------------------------------------------------------------ the city at night

export interface Win { x: number; y: number; w: number; h: number; lit: number; who?: 'phone' | 'mother' }

/** A city street at night seen across: two blocks of flats facing the camera, their windows, lamps, wet road. */
export function cityNight(c: C, g: C, t: number, wins: Win[]) {
  gradientV(c, '#0b0f2e', '#2b2f6a', 0, 0, W, H * 0.7);
  for (let i = 0; i < 80; i++) { c.fillStyle = `rgba(255,255,255,${0.2 + 0.5 * h01(i, 5)})`; c.beginPath(); c.arc(h01(i, 6) * W, h01(i, 7) * H * 0.3, 0.8 + h01(i, 8), 0, TAU); c.fill(); }
  c.fillStyle = '#fff4d6'; c.save(); c.shadowColor = '#fff4d6'; c.shadowBlur = 30; c.beginPath(); c.arc(W * 0.52, H * 0.12, 34, 0, TAU); c.fill(); c.restore();
  // a far skyline
  c.fillStyle = '#1a1d48';
  for (let i = 0; i < 16; i++) { const x = i * 130 - 20, h = 120 + 160 * h01(i, 9); c.fillRect(x, H * 0.62 - h, 110, h); }
  // two blocks of flats
  const blocks: [number, number, number, string][] = [[0, H * 0.06, W * 0.42, '#2a1f3f'], [W * 0.58, H * 0.02, W * 0.42, '#30223f']];
  for (const [bx, by, bw, col] of blocks) {
    c.fillStyle = col; c.fillRect(bx, by, bw, H - by);
    c.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = by + 20; y < H; y += 150) c.fillRect(bx, y + 120, bw, 8);
    for (let r = 0; r < 6; r++) for (let k = 0; k < 4; k++) {
      const wx = bx + 40 + k * (bw - 80) / 4, wy = by + 40 + r * 150;
      c.fillStyle = h01(r, k, bx > 0 ? 3 : 2) < 0.18 ? '#4a3a52' : '#171230'; c.fillRect(wx, wy, (bw - 80) / 4 - 40, 96);
    }
  }
  // the lit windows: who is awake
  for (const wn of wins) {
    c.save();
    c.beginPath(); c.rect(wn.x, wn.y, wn.w, wn.h); c.clip();
    const lg = c.createLinearGradient(0, wn.y, 0, wn.y + wn.h);
    lg.addColorStop(0, rgbaHex('#ffcf7a', wn.lit)); lg.addColorStop(1, rgbaHex('#e8742c', wn.lit));
    c.fillStyle = '#171230'; c.fillRect(wn.x, wn.y, wn.w, wn.h);
    c.fillStyle = lg; c.fillRect(wn.x, wn.y, wn.w, wn.h);
    if (wn.who === 'phone') {
      person(c, wn.x + wn.w * 0.5, wn.y + wn.h * 1.25, wn.h * 1.05, 'hold', { col: '#24101c', t });
      g.fillStyle = rgbaHex(HEX.cyan, 0.8); g.fillRect(wn.x + wn.w * 0.56, wn.y + wn.h * 0.42, wn.w * 0.08, wn.h * 0.14);
    } else if (wn.who === 'mother') {
      c.save(); c.translate(wn.x + wn.w * 0.45, wn.y + wn.h * 1.2); c.rotate(Math.sin(t * 2.2) * 0.04);
      person(c, 0, 0, wn.h * 1.05, 'hold', { col: '#24101c', t, headTilt: 0.25 });
      c.restore();
    }
    c.restore();
    c.strokeStyle = '#0d0a1c'; c.lineWidth = 8; c.strokeRect(wn.x, wn.y, wn.w, wn.h);
    c.lineWidth = 5; c.beginPath(); c.moveTo(wn.x + wn.w / 2, wn.y); c.lineTo(wn.x + wn.w / 2, wn.y + wn.h); c.stroke();
    g.fillStyle = rgbaHex('#ffb060', 0.25 * wn.lit); g.fillRect(wn.x - 10, wn.y - 10, wn.w + 20, wn.h + 20);
  }
  // the street between: wet road, lamps, a flickering all-night sign
  gradientV(c, '#1b1736', '#0a0814', W * 0.42, H * 0.7, W * 0.16, H * 0.3);
  const sx = W * 0.5, sy = H * 0.6;
  const on = frameIdx(t) % 47 < 44;
  c.fillStyle = '#100c20'; c.fillRect(sx - 80, sy, 160, 60);
  c.font = font(FAM.monoB(), 34); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = on ? HEX.pink : '#4a2040'; c.fillText('24H', sx, sy + 30);
  if (on) { g.fillStyle = rgbaHex(HEX.pink, 0.35); g.fillRect(sx - 80, sy, 160, 60); }
}

// ------------------------------------------------------------------ the mining warehouse

/** A corrugated warehouse: trusses, strip lights, rows of racks in perspective, a spinning electricity meter. */
export function warehouse(c: C, g: C, t: number, push = 1) {
  const vx = W * 0.5, vy = H * 0.44;
  // walls and ceiling: corrugated, in perspective
  c.fillStyle = '#20263a'; c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(80,96,130,0.35)'; c.lineWidth = 3;
  for (let k = -30; k <= 30; k++) { c.beginPath(); c.moveTo(vx + k * 18, vy - 90); c.lineTo(vx + k * 160, -20); c.stroke(); }
  // strip lights receding
  for (let i = 0; i < 7; i++) {
    const z = (0.3 + i * 0.32) / push, y = vy - 90 - (H * 0.5) / (z * 3), w = 300 / (z * 2.4);
    if (y < -20) continue;
    c.fillStyle = '#e8f4ff'; c.fillRect(vx - w / 2, y, w, Math.max(2, 14 / z));
    g.fillStyle = 'rgba(200,230,255,0.45)'; g.fillRect(vx - w / 2 - 10, y - 4, w + 20, Math.max(4, 22 / z));
  }
  // the floor, with cables
  gradientV(c, '#151a2a', '#0a0c16', 0, vy + 60, W, H - vy - 60);
  c.strokeStyle = 'rgba(120,214,58,0.25)'; c.lineWidth = 3;
  for (let k = -6; k <= 6; k++) { c.beginPath(); c.moveTo(vx + k * 10, vy + 60); c.lineTo(vx + k * 260, H); c.stroke(); }
  // the racks, left and right
  for (const side of [-1, 1]) {
    for (let k = 6; k >= 0; k--) {
      const z0 = (0.22 + k * 0.17) / push, z1 = (0.22 + (k + 1) * 0.17) / push;
      const X = (z: number) => vx + side * (W * 0.42) / (z * 3.2), Y = (z: number, v: number) => vy + (v * H * 0.5) / (z * 3.2);
      const xa = X(z0), xb = X(z1);
      c.fillStyle = '#0f1222';
      c.beginPath(); c.moveTo(xa, Y(z0, -1)); c.lineTo(xb, Y(z1, -1)); c.lineTo(xb, Y(z1, 1)); c.lineTo(xa, Y(z0, 1)); c.closePath(); c.fill();
      c.strokeStyle = rgbaHex(HEX.violet, 0.6); c.lineWidth = 2; c.stroke();
      for (let r = 0; r < 8; r++) for (let j = 0; j < 4; j++) {
        if (h01(r * 7 + j, k * 13 + (side > 0 ? 1 : 0), frameIdx(t) >> 1) < 0.45) continue;
        const v = -0.85 + r * 0.24, a = (j + 0.5) / 4, z = lerp(z0, z1, a);
        const px = lerp(xa, xb, a), py = Y(z, v), rr = Math.max(1.5, 8 / (z * 3.2));
        const col = (r + j) % 3 === 0 ? HEX.cyan : HEX.lime;
        c.fillStyle = col; c.beginPath(); c.arc(px, py, rr, 0, TAU); c.fill();
        g.fillStyle = rgbaHex(col, 0.45); g.beginPath(); g.arc(px, py, rr * 2.2, 0, TAU); g.fill();
      }
    }
  }
  // heat shimmer above the racks
  c.strokeStyle = 'rgba(255,160,120,0.12)'; c.lineWidth = 2;
  for (let i = 0; i < 8; i++) { c.beginPath(); for (let x = 0; x <= W; x += 30) { const y = H * 0.18 + i * 14 + 5 * Math.sin(x * 0.02 + t * 6 + i); x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
}

/** The electricity meter on the warehouse wall: its disc spinning fast, a kWh counter. */
export function powerMeter(c: C, g: C, t: number, x: number, y: number, s: number) {
  c.fillStyle = '#2a2f40'; c.beginPath(); c.roundRect(x - s * 0.6, y - s * 0.8, s * 1.2, s * 1.6, s * 0.15); c.fill();
  c.fillStyle = 'rgba(200,220,255,0.18)'; c.beginPath(); c.arc(x, y - s * 0.1, s * 0.48, 0, TAU); c.fill();
  c.strokeStyle = '#c9d0e4'; c.lineWidth = s * 0.04; c.beginPath(); c.arc(x, y - s * 0.1, s * 0.48, 0, TAU); c.stroke();
  // the disc edge-on, its black mark whizzing past
  c.fillStyle = '#b8bfd2'; c.fillRect(x - s * 0.36, y + s * 0.08, s * 0.72, s * 0.06);
  const m = ((t * 9) % 1) * s * 0.72; c.fillStyle = '#120d1d'; c.fillRect(x - s * 0.36 + m, y + s * 0.08, s * 0.08, s * 0.06);
  c.font = font(FAM.monoB(), s * 0.18); c.fillStyle = HEX.coral; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(String(48210 + Math.floor(t * 40)).padStart(6, '0'), x, y - s * 0.24);
  c.font = font(FAM.mono(), s * 0.1); c.fillStyle = '#c9d0e4'; c.fillText('kWh', x, y + s * 0.45);
  g.fillStyle = rgbaHex(HEX.coral, 0.25); g.fillRect(x - s * 0.36, y - s * 0.34, s * 0.72, s * 0.2);
}

// ------------------------------------------------------------------ the bank hall

/** A marble bank hall at night: chequered floor, fluted columns, a chandelier, the vault door ajar on gold. */
export function bankHall(c: C, g: C, t: number, o: { gold?: number } = {}) {
  const fy = H * 0.68, gold = o.gold ?? 0;
  gradientV(c, '#2a2238', '#3c3048', 0, 0, W, fy);
  // the floor: chequered marble in perspective
  c.fillStyle = '#d8d0c0'; c.fillRect(0, fy, W, H - fy);
  c.fillStyle = '#4a4058';
  for (let r = 0; r < 8; r++) {
    const y0 = fy + (H - fy) * Math.pow(r / 8, 1.5), y1 = fy + (H - fy) * Math.pow((r + 1) / 8, 1.5);
    for (let k = -12; k < 12; k++) if ((k + r) % 2 === 0) {
      const xa = W / 2 + k * 70 * (1 + r * 0.6), xb = W / 2 + (k + 1) * 70 * (1 + r * 0.6), xc = W / 2 + (k + 1) * 70 * (1 + (r + 1) * 0.6), xd = W / 2 + k * 70 * (1 + (r + 1) * 0.6);
      c.beginPath(); c.moveTo(xa, y0); c.lineTo(xb, y0); c.lineTo(xc, y1); c.lineTo(xd, y1); c.closePath(); c.fill();
    }
  }
  // columns
  for (const x of [W * 0.06, W * 0.26, W * 0.74, W * 0.94]) {
    const cg = c.createLinearGradient(x - 50, 0, x + 50, 0);
    cg.addColorStop(0, '#9a90a0'); cg.addColorStop(0.45, '#e8e2d8'); cg.addColorStop(1, '#8a8090');
    c.fillStyle = cg; c.fillRect(x - 50, 60, 100, fy - 60);
    c.strokeStyle = 'rgba(90,80,100,0.5)'; c.lineWidth = 2; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(x + k * 18, 80); c.lineTo(x + k * 18, fy - 20); c.stroke(); }
    c.fillStyle = '#d8d0c4'; c.fillRect(x - 66, 40, 132, 30); c.fillRect(x - 66, fy - 26, 132, 26);
  }
  // the vault door, ajar, gold bars glinting inside
  const vx = W * 0.86, vy = H * 0.36;
  c.fillStyle = '#1a1626'; c.beginPath(); c.arc(vx, vy, 150, 0, TAU); c.fill();
  for (let r = 0; r < 4; r++) for (let k = 0; k < 4 - r; k++) {
    const bx = vx - 80 + k * 46 + r * 23, by = vy + 70 - r * 24;
    c.fillStyle = '#e0a83a'; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + 40, by); c.lineTo(bx + 34, by - 20); c.lineTo(bx + 6, by - 20); c.closePath(); c.fill();
    c.fillStyle = '#ffe08a'; c.fillRect(bx + 8, by - 18, 24, 5);
  }
  const tw = 0.5 + 0.5 * Math.sin(t * 5);
  g.fillStyle = rgbaHex(HEX.gold, 0.12 + 0.08 * tw + 0.12 * gold); g.beginPath(); g.arc(vx, vy + 40, 90, 0, TAU); g.fill();
  c.fillStyle = '#7a7488'; c.beginPath(); c.ellipse(vx - 170, vy, 40, 156, 0, 0, TAU); c.fill();
  c.strokeStyle = '#4a4458'; c.lineWidth = 10; c.beginPath(); c.arc(vx - 170, vy, 30, 0, TAU); c.stroke();
  // velvet rope
  c.strokeStyle = '#8a1c3c'; c.lineWidth = 8;
  for (const [a, b] of [[W * 0.3, W * 0.42], [W * 0.58, W * 0.7]] as const) { c.beginPath(); c.moveTo(a, fy + 90); c.quadraticCurveTo((a + b) / 2, fy + 130, b, fy + 90); c.stroke(); }
  for (const x of [W * 0.3, W * 0.42, W * 0.58, W * 0.7]) { c.fillStyle = '#c9a44a'; c.fillRect(x - 6, fy + 80, 12, 110); c.beginPath(); c.arc(x, fy + 78, 12, 0, TAU); c.fill(); }
  // the chandelier
  const cx = W * 0.5, cy = 70;
  c.strokeStyle = '#c9a44a'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx, 0); c.lineTo(cx, cy); c.stroke();
  c.beginPath(); c.ellipse(cx, cy + 10, 120, 24, 0, 0, Math.PI); c.stroke();
  for (let k = 0; k < 7; k++) { const a = (k / 6) * Math.PI, px = cx - Math.cos(a) * 120, py = cy + 10 + Math.sin(a) * 24; g.fillStyle = rgbaHex(gold > 0.5 ? HEX.gold : '#fff2c8', 0.9); g.beginPath(); g.arc(px, py - 12, 9, 0, TAU); g.fill(); }
  return fy;
}

/** A big wall screen in an ornate frame, typing I PROMISE.; `goldU` turns it to gold. */
export function pledgeScreen(c: C, g: C, t: number, x: number, y: number, w: number, goldU: number, typed: number) {
  const h = w * 0.56;
  c.save(); c.translate(x, y);
  c.fillStyle = '#c9a44a'; c.beginPath(); c.roundRect(-w / 2 - 22, -h / 2 - 22, w + 44, h + 44, 14); c.fill();
  c.fillStyle = '#0b0818'; c.fillRect(-w / 2, -h / 2, w, h);
  const gr = c.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  gr.addColorStop(0, '#fff1a8'); gr.addColorStop(0.45, HEX.gold); gr.addColorStop(1, '#9a6a14');
  c.fillStyle = '#17123a'; c.fillRect(-w / 2, -h / 2, w, h);
  if (goldU > 0) { c.globalAlpha = goldU; c.fillStyle = gr; c.fillRect(-w / 2, -h / 2, w, h); c.globalAlpha = 1; }
  const full = 'I PROMISE.', txt = full.slice(0, Math.max(0, Math.floor(typed * (full.length + 0.99))));
  c.font = font(FAM.monoB(), w * 0.1); c.textAlign = 'left'; c.textBaseline = 'middle';
  const tw = c.measureText(full).width;
  c.fillStyle = goldU > 0.5 ? '#5a3a08' : HEX.bone; c.fillText(txt, -tw / 2, 0);
  if (frameIdx(t) % 30 < 15 && goldU < 0.5) { c.fillStyle = HEX.pink; c.fillRect(-tw / 2 + c.measureText(txt).width + 6, -w * 0.05, w * 0.05, w * 0.1); }
  c.font = font(FAM.mono(), w * 0.035); c.fillStyle = goldU > 0.5 ? '#5a3a08' : rgbaHex(HEX.bone, 0.5);
  c.fillText('PLEDGE', -w / 2 + 30, -h / 2 + 34);
  c.restore();
  g.fillStyle = rgbaHex(goldU > 0 ? HEX.gold : HEX.peri, goldU > 0 ? 0.2 * goldU : 0.08);
  g.fillRect(x - w / 2, y - h / 2, w, h);
}

// ------------------------------------------------------------------ the harbour night market

/** A harbour night market: the sea and a moored boat behind, striped stalls, string lights, fruit crates, and in the
 *  corner an old rai stone standing by (the oldest money, still there). */
export function nightMarket(c: C, g: C, t: number) {
  const fy = H * 0.7;
  gradientV(c, '#141a46', '#3a2f6a', 0, 0, W, H * 0.44);
  for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(255,255,255,${0.2 + 0.5 * h01(i, 15)})`; c.beginPath(); c.arc(h01(i, 16) * W, h01(i, 17) * H * 0.3, 0.8 + h01(i, 18), 0, TAU); c.fill(); }
  cloud(c, W * 0.2, H * 0.12, 90, 'rgba(80,90,150,0.5)');
  // the harbour: the sea, a moored boat's mast
  gradientV(c, '#2b2f6a', '#141a46', 0, H * 0.44, W, fy - H * 0.44);
  c.strokeStyle = 'rgba(255,214,120,0.35)'; c.lineWidth = 2;
  for (let i = 0; i < 10; i++) { const y = H * 0.46 + i * 14, x = ((h01(i, 21) * W + t * 15) % W); c.beginPath(); c.moveTo(x, y); c.lineTo(x + 80, y); c.stroke(); }
  c.fillStyle = '#0d1030'; c.beginPath(); c.moveTo(W * 0.62, H * 0.5); c.lineTo(W * 0.86, H * 0.5); c.lineTo(W * 0.83, H * 0.54); c.lineTo(W * 0.65, H * 0.54); c.closePath(); c.fill();
  c.strokeStyle = '#0d1030'; c.lineWidth = 6; c.beginPath(); c.moveTo(W * 0.74, H * 0.5); c.lineTo(W * 0.74 + 6 * Math.sin(t), H * 0.18); c.stroke();
  // the quay
  c.fillStyle = '#3a2f3a'; c.fillRect(0, fy - 20, W, H - fy + 20);
  c.fillStyle = '#4a3c46'; for (let x = 0; x < W; x += 120) c.fillRect(x, fy - 20, 116, 16);
  // the stalls
  const stall = (x: number, w: number, a: string, b: string, goods: string[]) => {
    c.fillStyle = '#2a1e22'; c.fillRect(x + 10, fy - 260, 10, 260); c.fillRect(x + w - 20, fy - 260, 10, 260);
    c.save(); c.beginPath(); c.rect(x - 10, fy - 300, w + 20, 70); c.clip();
    for (let k = 0; k < 12; k++) { c.fillStyle = k % 2 ? a : b; c.fillRect(x - 10 + k * (w + 20) / 12, fy - 300, (w + 20) / 12 + 1, 70); }
    c.restore();
    for (let k = 0; k < 12; k++) { c.fillStyle = k % 2 ? a : b; c.beginPath(); c.arc(x - 10 + (k + 0.5) * (w + 20) / 12, fy - 230, (w + 20) / 24, 0, Math.PI); c.fill(); }
    c.fillStyle = '#5a3a20'; c.fillRect(x, fy - 110, w, 110);
    goods.forEach((col, k) => { for (let j = 0; j < 4; j++) { c.fillStyle = col; c.beginPath(); c.arc(x + 30 + k * (w - 60) / Math.max(1, goods.length - 1) + (j - 1.5) * 14, fy - 118 - (j % 2) * 10, 13, 0, TAU); c.fill(); } });
  };
  stall(W * 0.04, 360, '#ff5a5f', '#f4e7c4', ['#ffd23f', '#ff8a2a', '#78d63a']);
  stall(W * 0.62, 380, '#2fe0ff', '#f4e7c4', ['#c65cf0', '#ff5a5f', '#ffd23f']);
  // string lights across, swaying a little
  for (const [y0, sag] of [[H * 0.12, 120], [H * 0.2, 90]] as const) {
    c.strokeStyle = '#1a1420'; c.lineWidth = 2;
    c.beginPath(); for (let x = 0; x <= W; x += 20) { const u = x / W, y = y0 + 4 * sag * u * (1 - u) + 4 * Math.sin(t * 1.5 + u * 4); x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    for (let i = 0; i < 22; i++) {
      const u = (i + 0.5) / 22, x = u * W, y = y0 + 4 * sag * u * (1 - u) + 4 * Math.sin(t * 1.5 + u * 4) + 8;
      const col = ['#ffd23f', '#ff4f9a', '#2fe0ff', '#78d63a'][i % 4]!;
      c.fillStyle = col; c.beginPath(); c.arc(x, y, 7, 0, TAU); c.fill();
      g.fillStyle = rgbaHex(col, 0.55); g.beginPath(); g.arc(x, y, 14, 0, TAU); g.fill();
    }
  }
  // the old stone standing by in the corner
  stone(c, W * 0.92, fy - 92, 92, { seed: 33, tilt: 0.05 });
  return fy;
}
