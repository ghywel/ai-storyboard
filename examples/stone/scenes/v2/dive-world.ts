// v2 `dive`: the two environments of the film's first seconds.
//   - duskJetty: dusk at the end of a wooden jetty on Yap: the sun half down behind the jetty's end, the sea going
//     violet, the first stars, a V of birds going home, the trader's steamship on the horizon (the iron hull to come),
//     the stilt hut up the beach with its lit window and lit door (home: 4 am happens behind that window), a rai stone
//     leaning on its stilts as they do on Yap, a canoe drawn up, palms, the jetty's lantern.
//   - plunge: under the surface at dusk, looking down: the surface a warm ceiling, rays going down into the dark.
import { W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { clamp } from '../../engine/util';
import { h01 } from '../_rai';
import { TAU, rgbaHex, mixHex } from '../_motifs';
import { canoe, discStone } from '../_world';

type C2 = CanvasRenderingContext2D;

export const HZ = 600;                        // the horizon
export const DECK = 688;                      // the jetty's deck (her feet)
export const JETTY = { x0: 470, x1: 1210 };   // the deck from the shore out to its end
export const SUN = { x: 1262, y: HZ + 26, r: 100 };
export const HUT = { x: 300, y: 648, s: 1 };  // the hut on its stilts: the sand under it
export const DOOR = { x: HUT.x + 34, y: HUT.y - 92 };   // the doorway's sill (the mother stands here)
export const WATERLINE = 748;                 // where the jetty's posts meet the water

/** The dusk sky, sea and shore; the jetty; the hut. `lamp` lights the lantern on the jetty's last post. */
export function duskJetty(c: C2, g: C2, t: number, o: { lamp?: number } = {}) {
  // the sky: deep violet overhead, rose, then the orange band at the horizon
  const sk = c.createLinearGradient(0, 0, 0, HZ);
  sk.addColorStop(0, '#160f30'); sk.addColorStop(0.3, '#3a2464'); sk.addColorStop(0.6, '#9a4470'); sk.addColorStop(0.84, '#ec7454'); sk.addColorStop(1, '#ffb45c');
  c.fillStyle = sk; c.fillRect(0, 0, W, HZ + 2);
  // the first stars, high up, and the evening star
  for (let i = 0; i < 110; i++) {
    const x = h01(i, 11) * W, y = h01(i, 12) * HZ * 0.42, tw = 0.5 + 0.5 * Math.sin(t * (1.5 + 2 * h01(i, 13)) + i);
    c.fillStyle = `rgba(255,248,230,${(0.25 + 0.6 * tw) * (1 - y / (HZ * 0.45)) * h01(i, 14)})`;
    c.beginPath(); c.arc(x, y, 0.7 + 1.3 * h01(i, 15), 0, TAU); c.fill();
  }
  c.fillStyle = '#fff6e0'; c.beginPath(); c.arc(1540, 120, 2, 0, TAU); c.fill();
  const vg = g.createRadialGradient(1540, 120, 0, 1540, 120, 12); vg.addColorStop(0, rgbaHex('#fff6e0', 0.35)); vg.addColorStop(1, rgbaHex('#fff6e0', 0));
  g.fillStyle = vg; g.fillRect(1520, 100, 40, 40);
  // the sun's halo (on the picture, behind everything in front of it), then the disc half down
  const hg = c.createRadialGradient(SUN.x, SUN.y, 30, SUN.x, SUN.y, 640);
  hg.addColorStop(0, rgbaHex('#ffd98a', 0.85)); hg.addColorStop(0.18, rgbaHex('#ffa865', 0.42)); hg.addColorStop(0.5, rgbaHex('#ff7a5a', 0.12)); hg.addColorStop(1, rgbaHex('#ff7a5a', 0));
  c.save(); c.beginPath(); c.rect(0, 0, W, HZ); c.clip();
  // long wisps of cloud: a body a shade darker than the sky behind it, and a bright underside where the low sun
  // catches it (soft-edged: radial fills squashed flat)
  for (let i = 0; i < 9; i++) {
    const y = HZ * (0.14 + 0.62 * h01(i, 21)), x = ((h01(i, 22) * (W + 900) + t * (5 + 4 * h01(i, 23))) % (W + 900)) - 450, w = 220 + 420 * h01(i, 24);
    const v = y / HZ, lit = clamp((v - 0.2) / 0.62), near = clamp(1 - Math.abs(x - SUN.x) / 1000);
    const sky = v < 0.3 ? '#3a2464' : v < 0.6 ? mixHex('#3a2464', '#9a4470', (v - 0.3) / 0.3) : mixHex('#9a4470', '#ec7454', (v - 0.6) / 0.24);
    const layers: [number, number, number, string, number][] = [
      [0, 1, 9 + 10 * h01(i, 25), mixHex(mixHex(sky, '#5a3a6a', 0.25), '#ff9a8a', 0.45 * near), 0.32],
      [4 + 3 * h01(i, 26), 0.7, 3.5, mixHex('#ff9a8a', '#ffe0a0', lit * near), 0.3 + 0.55 * lit],
    ];
    for (const [dy, k, th, col, al] of layers) {
      c.save(); c.translate(x + (dy ? w * 0.06 : 0), y + dy); c.scale(1, th / (w * k));
      const cg = c.createRadialGradient(0, 0, 0, 0, 0, w * k);
      cg.addColorStop(0, rgbaHex(col, al)); cg.addColorStop(0.55, rgbaHex(col, al * 0.75)); cg.addColorStop(1, rgbaHex(col, 0));
      c.fillStyle = cg; c.beginPath(); c.arc(0, 0, w * k, 0, TAU); c.fill();
      c.restore();
    }
  }
  c.globalCompositeOperation = 'screen';
  c.fillStyle = hg; c.fillRect(SUN.x - 640, SUN.y - 640, 1280, 1280);
  c.globalCompositeOperation = 'source-over';
  const sg = c.createRadialGradient(SUN.x, SUN.y - 20, 10, SUN.x, SUN.y, SUN.r);
  sg.addColorStop(0, '#fff6d6'); sg.addColorStop(0.6, '#ffdc7a'); sg.addColorStop(1, '#ffb050');
  c.fillStyle = sg; c.beginPath(); c.arc(SUN.x, SUN.y, SUN.r, 0, TAU); c.fill();
  c.restore();
  const cg2 = g.createRadialGradient(SUN.x, HZ, 0, SUN.x, HZ, 150);
  cg2.addColorStop(0, rgbaHex('#ffe0a0', 0.35)); cg2.addColorStop(1, rgbaHex('#ffe0a0', 0));
  g.fillStyle = cg2; g.fillRect(SUN.x - 150, HZ - 150, 300, 160);
  // a V of birds going home
  c.strokeStyle = '#1e1430'; c.lineWidth = 3; c.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const bx = 560 + t * 42 - Math.ceil(i / 2) * 30, by = 190 + Math.ceil(i / 2) * 16 * (i % 2 ? 1 : -0.4);
    const fl = Math.sin(t * 9 + i) * 5;
    c.beginPath(); c.moveTo(bx - 11, by - fl); c.quadraticCurveTo(bx - 4, by - 3, bx, by + 2); c.quadraticCurveTo(bx + 4, by - 3, bx + 11, by - fl); c.stroke();
  }
  // far islands on the horizon, and the trader's steamship far out (the iron hull to come)
  c.fillStyle = '#3a2350';
  c.beginPath(); c.moveTo(560, HZ); c.quadraticCurveTo(700, HZ - 40, 860, HZ - 14); c.quadraticCurveTo(940, HZ - 6, 990, HZ); c.fill();
  c.beginPath(); c.moveTo(1480, HZ); c.quadraticCurveTo(1570, HZ - 22, 1640, HZ - 10); c.lineTo(1690, HZ); c.fill();
  ship(c, 1790, HZ + 2, 0.3, t);
  // the sea: the sky's colour at the horizon going violet and then ink towards us
  const sea = c.createLinearGradient(0, HZ, 0, H);
  sea.addColorStop(0, '#e07a68'); sea.addColorStop(0.1, '#8a3e70'); sea.addColorStop(0.42, '#3a2460'); sea.addColorStop(1, '#120c2c');
  c.fillStyle = sea; c.fillRect(0, HZ, W, H - HZ);
  // the sun's reflection: a warm column under it, and glitter widening towards us, shimmering
  for (let y = HZ; y < H; y += 6) {
    const v = (y - HZ) / (H - HZ), hw = 70 + 330 * Math.pow(v, 0.9), al = 0.5 * Math.pow(1 - v, 1.6);
    const rg = c.createLinearGradient(SUN.x - hw, 0, SUN.x + hw, 0);
    rg.addColorStop(0, rgbaHex('#ffb070', 0)); rg.addColorStop(0.5, rgbaHex('#ffc47a', al)); rg.addColorStop(1, rgbaHex('#ffb070', 0));
    c.fillStyle = rg; c.fillRect(SUN.x - hw, y, 2 * hw, 6);
  }
  for (let j = 0; j < 50; j++) {
    const v = j / 49, y = HZ + 3 + Math.pow(v, 1.7) * (H - HZ), spread = 36 + 360 * v;
    for (let k = 0; k < 6; k++) {
      const ph = Math.sin(t * (2.2 + h01(j, k, 31)) + j * 1.7 + k * 2.3);
      if (ph < 0.1) continue;
      const x = SUN.x + (h01(j, k, 32) - 0.5) * 2 * spread * (0.3 + 0.7 * h01(j, k, 33)), w = (10 + 64 * v) * (0.4 + h01(j, k, 34));
      c.fillStyle = rgbaHex(v < 0.25 ? '#fff0b8' : '#ffb87a', (0.35 + 0.55 * ph) * (1 - 0.6 * v));
      c.fillRect(x - w / 2, y, w, 1.5 + 3.5 * v);
    }
  }
  // gentle swell lines on the violet
  c.strokeStyle = 'rgba(255,170,150,0.14)'; c.lineWidth = 2;
  for (let j = 0; j < 14; j++) {
    const v = (j + 1) / 15, y = HZ + Math.pow(v, 1.6) * (H - HZ);
    for (let k = 0; k < 4; k++) { const x = ((h01(j, k, 41) * W + t * 10 * (k % 2 ? 1 : -1)) % W + W) % W, w = 50 + 200 * v; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + w / 2, y - 3, x + w, y); c.stroke(); }
  }
  // the beach: a spit of sand from the left, its wet edge catching the sky, foam breathing along it
  const bg = c.createLinearGradient(0, 630, 0, H);
  bg.addColorStop(0, '#8a5068'); bg.addColorStop(0.4, '#5a3452'); bg.addColorStop(1, '#2a1830');
  c.fillStyle = bg;
  c.beginPath(); c.moveTo(0, H); c.lineTo(0, 636); c.quadraticCurveTo(240, 626, 430, 646); c.quadraticCurveTo(560, 662, 610, 700);
  c.quadraticCurveTo(470, 800, 330, 1080); c.closePath(); c.fill();
  const sw = 3 * Math.sin(t * 1.3);
  c.strokeStyle = 'rgba(255,214,196,0.55)'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(612 + sw, 702); c.quadraticCurveTo(472 + sw, 802, 334 + sw, 1080); c.stroke();
  c.strokeStyle = 'rgba(255,214,196,0.22)'; c.lineWidth = 9;
  c.beginPath(); c.moveTo(626 + sw * 2, 708); c.quadraticCurveTo(488 + sw * 2, 808, 352 + sw * 2, 1080); c.stroke();
  // the canoe drawn up, the hut with a rai stone leaning on its stilts, palms in silhouette
  canoe(c, 170, 706, 0.6, 0.8);
  discStone(c, HUT.x - 72, HUT.y - 24, 30, -0.18, 0.72);
  hutLit(c, g, t);
  palmSil(c, 560, 676, 330, 0.3, t, 2);
  footprints(c);
  // the jetty, side on: deck, posts, their reflections, and the lantern on the last post
  jetty(c, g, t, o.lamp ?? 1);
}

/** A palm in silhouette against the dusk: a curved trunk, fronds of drooping leaflets. */
export function palmSil(c: C2, x: number, y: number, h: number, lean: number, t: number, seed: number, col = '#1c1028') {
  const tx = x + Math.sin(lean) * h, ty = y - Math.cos(lean) * h;
  c.save(); c.strokeStyle = col; c.fillStyle = col; c.lineCap = 'round';
  c.lineWidth = h * 0.05;
  c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.sin(lean) * h * 0.15 - lean * 40, y - h * 0.6, tx, ty); c.stroke();
  for (let k = 0; k < 8; k++) frond(c, tx, ty, -Math.PI / 2 + (k - 3.5) * 0.48 + 0.04 * Math.sin(t * 1.2 + k + seed), h * (0.42 + 0.08 * Math.sin(k * 2.3 + seed)), col, t + k);
  c.beginPath(); c.arc(tx, ty + 6, h * 0.035, 0, TAU); c.fill();
  c.restore();
}

/** One palm frond: a drooping midrib with leaflets hanging from it. */
export function frond(c: C2, x: number, y: number, a: number, L: number, col: string, t: number) {
  const ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L * 0.5 + L * 0.42;
  const mx = x + Math.cos(a) * L * 0.55, my = y + Math.sin(a) * L * 0.55 - L * 0.12;
  c.strokeStyle = col; c.lineWidth = Math.max(2, L * 0.025);
  c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(mx, my, ex, ey); c.stroke();
  c.lineWidth = Math.max(1.5, L * 0.018);
  for (let j = 2; j < 14; j++) {
    const u = j / 14, px = (1 - u) * (1 - u) * x + 2 * (1 - u) * u * mx + u * u * ex, py = (1 - u) * (1 - u) * y + 2 * (1 - u) * u * my + u * u * ey;
    const ll = L * 0.2 * Math.sin(Math.PI * (0.15 + 0.85 * u)), sw = 0.08 * Math.sin(t * 1.5 + j);
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(px, py); c.lineTo(px + s * ll * 0.35 + Math.cos(a) * ll * 0.3, py + ll * (0.9 + sw)); c.stroke(); }
  }
}

/** Her footprints in the sand, from the hut's steps down to the jetty. */
function footprints(c: C2) {
  c.save(); c.fillStyle = 'rgba(30,14,40,0.4)';
  for (let i = 0; i < 9; i++) {
    const u = i / 8, x = HUT.x + 190 + u * 230, y = HUT.y + 6 + u * 34 + (i % 2 ? 5 : -5);
    c.beginPath(); c.ellipse(x, y, 7, 3.2, 0.15, 0, TAU); c.fill();
  }
  c.restore();
}

function ship(c: C2, x: number, y: number, k: number, t: number) {
  c.fillStyle = '#3a2350';
  c.beginPath(); c.moveTo(x - 300 * k, y - 40 * k); c.lineTo(x + 330 * k, y - 40 * k); c.lineTo(x + 280 * k, y); c.lineTo(x - 260 * k, y); c.closePath(); c.fill();
  c.fillRect(x - 120 * k, y - 80 * k, 220 * k, 40 * k); c.fillRect(x - 20 * k, y - 170 * k, 40 * k, 90 * k);
  c.strokeStyle = '#3a2350'; c.lineWidth = 6 * k;
  for (const d of [-220, 200]) { c.beginPath(); c.moveTo(x + d * k, y - 40 * k); c.lineTo(x + d * k, y - 220 * k); c.stroke(); }
  for (let i = 0; i < 6; i++) { const u = (t * 0.25 + i / 6) % 1; c.fillStyle = `rgba(80,50,90,${0.5 * (1 - u)})`; c.beginPath(); c.arc(x - u * 220 * k, y - 190 * k - u * 90 * k, (18 + u * 46) * k, 0, TAU); c.fill(); }
  c.fillStyle = 'rgba(255,214,120,0.9)'; for (let i = 0; i < 3; i++) c.fillRect(x - 80 * k + i * 60 * k, y - 66 * k, 10 * k, 8 * k);
}

/** The family's stilt hut at dusk: thatch, a porch with steps, a lit window and an open lit door. */
function hutLit(c: C2, g: C2, t: number) {
  const { x, y } = HUT, dark = '#2a1834', wood = '#3a2236';
  c.save();
  c.strokeStyle = wood; c.lineWidth = 9;
  for (const d of [-110, -40, 40, 110]) { c.beginPath(); c.moveTo(x + d, y); c.lineTo(x + d, y - 70); c.stroke(); }
  c.fillStyle = wood; c.fillRect(x - 140, y - 78, 290, 14);                           // the floor and porch
  c.fillStyle = dark; c.fillRect(x - 120, y - 210, 230, 136);                          // the walls
  // the steps down from the porch
  c.strokeStyle = wood; c.lineWidth = 6;
  for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(x + 150 + k * 12, y - 64 + k * 17); c.lineTo(x + 176 + k * 12, y - 64 + k * 17); c.stroke(); }
  // the lit window and the open door: warm light, flickering a touch (a lamp inside)
  const fl = 0.92 + 0.08 * Math.sin(t * 7.3) * Math.sin(t * 3.1);
  const warm = rgbaHex('#ffcf6b', fl), deep = rgbaHex('#ff9a4a', fl);
  const wg = c.createLinearGradient(0, y - 190, 0, y - 80);
  wg.addColorStop(0, warm); wg.addColorStop(1, deep);
  c.fillStyle = wg;
  c.fillRect(x - 96, y - 180, 62, 50);                         // the window
  c.fillRect(DOOR.x - 22, DOOR.y - 104, 50, 104 - 2);          // the door
  c.strokeStyle = wood; c.lineWidth = 4;
  c.beginPath(); c.moveTo(x - 65, y - 180); c.lineTo(x - 65, y - 130); c.moveTo(x - 96, y - 155); c.lineTo(x - 34, y - 155); c.stroke();
  // the light falling out of the door onto the porch, and glows
  c.fillStyle = rgbaHex('#ffb060', 0.35 * fl); c.beginPath(); c.moveTo(DOOR.x - 22, y - 78); c.lineTo(DOOR.x + 28, y - 78); c.lineTo(DOOR.x + 60, y - 64); c.lineTo(DOOR.x - 40, y - 64); c.closePath(); c.fill();
  for (const [gx, gy, r] of [[x - 65, y - 155, 90], [DOOR.x + 3, DOOR.y - 50, 120]] as const) {
    const gr = g.createRadialGradient(gx, gy, 0, gx, gy, r); gr.addColorStop(0, rgbaHex('#ffcf6b', 0.35 * fl)); gr.addColorStop(1, rgbaHex('#ffcf6b', 0));
    g.fillStyle = gr; g.fillRect(gx - r, gy - r, 2 * r, 2 * r);
  }
  // the thatched roof
  c.fillStyle = '#4a2e3e';
  c.beginPath(); c.moveTo(x - 175, y - 196); c.quadraticCurveTo(x - 20, y - 330, x - 5, y - 340); c.quadraticCurveTo(x + 20, y - 330, x + 180, y - 196); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,160,120,0.25)'; c.lineWidth = 2;
  for (let k = 0; k < 16; k++) { const u = k / 15, px = x - 170 + u * 345; c.beginPath(); c.moveTo(px, y - 198); c.lineTo(px + (u - 0.5) * 8, y - 188); c.stroke(); }
  c.strokeStyle = 'rgba(255,170,120,0.35)'; c.lineWidth = 3;   // the sunset's rim on the roof's right slope
  c.beginPath(); c.moveTo(x - 2, y - 338); c.quadraticCurveTo(x + 22, y - 328, x + 178, y - 198); c.stroke();
  c.restore();
}

function jetty(c: C2, g: C2, t: number, lamp: number) {
  const { x0, x1 } = JETTY;
  c.save();
  // reflections of the posts in the water (wobbling)
  for (let x = x0 + 30; x <= x1; x += 74) {
    c.fillStyle = 'rgba(20,10,30,0.45)';
    for (let k = 0; k < 6; k++) { const yy = WATERLINE + 6 + k * 11, wob = 4 * Math.sin(t * 2.4 + k * 1.3 + x * 0.01); c.fillRect(x - 6 + wob, yy, 12, 7); }
  }
  // posts and ripples where they meet the water
  c.fillStyle = '#1e1226';
  for (let x = x0 + 30; x <= x1; x += 74) {
    c.fillRect(x - 7, DECK, 14, WATERLINE - DECK + 4);
    c.strokeStyle = 'rgba(255,180,150,0.35)'; c.lineWidth = 1.6;
    c.beginPath(); c.ellipse(x, WATERLINE + 2, 16 + 3 * Math.sin(t * 2 + x), 3, 0, 0, TAU); c.stroke();
  }
  // the deck: a long plank edge, its top lit by the sunset
  c.fillStyle = '#24152c'; c.fillRect(x0 - 40, DECK, x1 - x0 + 40, 16);
  c.fillStyle = 'rgba(255,160,110,0.55)'; c.fillRect(x0 - 40, DECK, x1 - x0 + 40, 2.5);
  c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 1;
  for (let x = x0; x < x1; x += 22) { c.beginPath(); c.moveTo(x, DECK + 3); c.lineTo(x, DECK + 15); c.stroke(); }
  // a rope coil and a bucket on the deck
  c.fillStyle = '#24152c';
  c.beginPath(); c.ellipse(x0 + 160, DECK - 5, 22, 7, 0, 0, TAU); c.fill();
  c.fillRect(x0 + 300, DECK - 26, 22, 26);
  // the lantern post at the end
  const lx = x1 - 6;
  c.fillRect(lx - 5, DECK - 150, 10, 150);
  c.fillRect(lx - 5, DECK - 150, 34, 6);
  const fl = 0.9 + 0.1 * Math.sin(t * 9.1) * Math.sin(t * 4.3);
  c.strokeStyle = '#24152c'; c.lineWidth = 2; c.beginPath(); c.moveTo(lx + 24, DECK - 144); c.lineTo(lx + 24, DECK - 128); c.stroke();
  c.fillStyle = rgbaHex('#ffcf6b', lamp * fl); c.beginPath(); c.roundRect(lx + 16, DECK - 128, 16, 20, 4); c.fill();
  const gr = g.createRadialGradient(lx + 24, DECK - 118, 0, lx + 24, DECK - 118, 110);
  gr.addColorStop(0, rgbaHex('#ffcf6b', 0.5 * lamp * fl)); gr.addColorStop(1, rgbaHex('#ffcf6b', 0));
  g.fillStyle = gr; g.fillRect(lx - 90, DECK - 230, 230, 230);
  c.restore();
}

/** The near foreground: a dark palm's fronds hanging into the top-left corner (depth, a frame within the frame). */
export function duskForeground(c: C2, t: number) {
  c.save();
  for (let k = 0; k < 5; k++) frond(c, -60, -40, 0.05 + k * 0.32 + 0.03 * Math.sin(t * 0.9 + k), 520 - 40 * k, '#0b0614', t * 0.6 + k);
  c.restore();
}

/** A splash crown and droplets where she breaks the surface (u 0..1 over its life), and the rings after it. */
export function splash(c: C2, g: C2, x: number, y: number, u: number) {
  if (u <= 0 || u >= 1) return;
  c.save();
  const k = Math.sin(Math.PI * Math.min(1, u * 1.6));
  c.fillStyle = `rgba(255,230,210,${0.85 * (1 - u)})`;
  for (let i = 0; i < 9; i++) { // the crown's fingers
    const a = -Math.PI * (0.12 + 0.76 * i / 8), L = (70 + 90 * h01(i, 91)) * k;
    c.beginPath(); c.moveTo(x + Math.cos(a) * 16 - 5, y); c.lineTo(x + Math.cos(a) * (22 + L * 0.45), y + Math.sin(a) * L); c.lineTo(x + Math.cos(a) * 24 + 7, y); c.closePath(); c.fill();
  }
  for (let i = 0; i < 28; i++) { // droplets thrown up and falling
    const a = -Math.PI * (0.1 + 0.8 * h01(i, 92)), v = 220 + 320 * h01(i, 93), tt = u * 0.9;
    const px = x + Math.cos(a) * v * tt, py = y + Math.sin(a) * v * tt + 520 * tt * tt;
    if (py > y + 4) continue;
    c.beginPath(); c.arc(px, py, 2 + 3 * h01(i, 94), 0, TAU); c.fill();
  }
  c.strokeStyle = `rgba(255,210,190,${0.6 * (1 - u)})`; c.lineWidth = 2.5;
  for (let r = 0; r < 3; r++) { const rr = 20 + u * (120 + r * 60); c.beginPath(); c.ellipse(x, y + 2, rr, rr * 0.12, 0, 0, TAU); c.stroke(); }
  c.restore();
  const gr = g.createRadialGradient(x, y - 20, 0, x, y - 20, 90);
  gr.addColorStop(0, rgbaHex('#ffd9b0', 0.4 * (1 - u))); gr.addColorStop(1, rgbaHex('#ffd9b0', 0));
  g.fillStyle = gr; g.fillRect(x - 90, y - 110, 180, 180);
}

// ------------------------------------------------------------------ the plunge

/**
 * Under the surface at dusk, the camera looking down as she goes in: the world is a tall column (y from the surface at
 * 0 down to the seabed at 1.35 H); `camY` is how far down the frame's top is.
 */
export function plungeWater(c: C2, g: C2, t: number, camY: number, bedY = 1.08 * H) {
  const top = -camY, bed = bedY - camY;
  const wg = c.createLinearGradient(0, top, 0, bed);
  wg.addColorStop(0, '#f2a27a'); wg.addColorStop(0.08, '#c9607a'); wg.addColorStop(0.3, '#5a3a7e'); wg.addColorStop(0.6, '#1e2156'); wg.addColorStop(1, '#060a1c');
  c.fillStyle = wg; c.fillRect(0, 0, W, H);
  // the surface from below: a bright wavy ceiling with the sun's window in it
  if (top > -80) {
    c.save();
    const sf = c.createLinearGradient(0, 0, W, 0); sf.addColorStop(0, '#e89a86'); sf.addColorStop(0.62, '#ffdcb0'); sf.addColorStop(1, '#f0a888');
    c.fillStyle = sf;
    c.beginPath(); c.moveTo(0, top - 200);
    for (let x = 0; x <= W; x += 30) c.lineTo(x, top + 14 + 8 * Math.sin(x * 0.012 + t * 2.2) + 5 * Math.sin(x * 0.031 - t * 1.6));
    c.lineTo(W, top - 200); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,240,210,0.6)'; c.lineWidth = 2;
    for (let j = 0; j < 5; j++) { c.beginPath(); for (let x = 0; x <= W; x += 30) { const yy = top + 30 + j * 16 + 6 * Math.sin(x * 0.02 + t * 1.8 + j * 1.3); x ? c.lineTo(x, yy) : c.moveTo(x, yy); } c.stroke(); }
    c.restore();
    const sw = g.createRadialGradient(W * 0.62, top, 0, W * 0.62, top, 520);
    sw.addColorStop(0, rgbaHex('#ffe0a8', 0.32)); sw.addColorStop(1, rgbaHex('#ffb080', 0));
    g.fillStyle = sw; g.fillRect(W * 0.62 - 520, top - 520, 1040, 1040);
  }
  // god rays slanting down from the surface, fading into the deep
  c.save(); c.globalCompositeOperation = 'screen';
  for (let k = 0; k < 9; k++) {
    const x = (0.08 + 0.11 * k + 0.02 * Math.sin(t * 0.4 + k * 1.9)) * W, sp = (0.025 + 0.025 * h01(k, 61)) * W;
    const a = (0.16 + 0.08 * Math.sin(t * 0.7 + k * 2.3));
    const rg = c.createLinearGradient(0, top, 0, top + 1.1 * H);
    rg.addColorStop(0, `rgba(255,214,170,${a})`); rg.addColorStop(1, 'rgba(255,214,170,0)');
    c.fillStyle = rg;
    c.beginPath(); c.moveTo(x - sp * 0.3, top); c.lineTo(x + sp * 0.3, top); c.lineTo(x + sp * 2 + 240, top + 1.1 * H); c.lineTo(x - sp + 240, top + 1.1 * H); c.closePath(); c.fill();
  }
  c.restore();
  // the seabed far below, in the gloom
  if (bed < H + 40) {
    c.fillStyle = '#0c1024';
    c.beginPath(); c.moveTo(0, H); c.lineTo(0, bed + 10);
    for (let x = 0; x <= W; x += 60) c.lineTo(x, bed + 14 * Math.sin(x * 0.005 + 1) + 6 * Math.sin(x * 0.02));
    c.lineTo(W, H); c.closePath(); c.fill();
  }
  // drifting motes
  for (let i = 0; i < 80; i++) {
    const x = h01(i, 71) * W, y = ((h01(i, 72) * 1.4 * H - camY * (0.6 + 0.4 * h01(i, 73)) + t * 8) % (1.4 * H) + 1.4 * H) % (1.4 * H) - 0.2 * H;
    c.fillStyle = `rgba(255,230,210,${0.15 + 0.25 * h01(i, 74)})`;
    c.fillRect(x, y, 2, 2);
  }
}

export { HEX };
