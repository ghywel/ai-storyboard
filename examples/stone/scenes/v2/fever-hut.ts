// `fever`'s first shot: "but up the road". The village at four in the morning, every window dark but one: the stilt
// hut at the top of the sandy road, the home from `dive`'s first shot (the same thatch, stilts and warm window). On its
// curtain, the shadow of a woman rocking in a chair. The girl's wet footprints run up the road from the harbour to
// the steps: she walked home up this road at the end of `harbour`. The camera pushes up the road into the window.
import { W, H } from '../../engine/gl';
import { clamp } from '../../engine/util';
import { h01 } from '../_rai';
import { TAU, rgbaHex, mixHex, person } from '../_motifs';
import { palmTree } from '../_world';

type C2 = CanvasRenderingContext2D;
const PI = Math.PI;

/** Where the lit window is (frame px at camera zoom 1), for the push-in. */
export const HUT_WIN = { x: 1262 - 65 * 1.3, y: 648 - 155 * 1.3, w: 62 * 1.3, h: 50 * 1.3 };

export function hutNight(c: C2, g: C2, t: number) {
  // the sky: deep night, stars, a band of cloud over the moon
  const sky = c.createLinearGradient(0, -200, 0, H * 0.62);
  sky.addColorStop(0, '#04061a'); sky.addColorStop(1, '#1c2050');
  c.fillStyle = sky; c.fillRect(-600, -600, W + 1200, H * 0.62 + 600);
  for (let i = 0; i < 180; i++) { const tw = 0.35 + 0.55 * Math.abs(Math.sin(t * (0.6 + h01(i, 3, 9)) + i)); c.fillStyle = `rgba(255,255,255,${tw * (0.4 + 0.6 * h01(i, 4, 9))})`; c.beginPath(); c.arc(-300 + (W + 600) * h01(i, 1, 9), -200 + H * 0.66 * h01(i, 2, 9), 0.7 + 1.3 * h01(i, 5, 9), 0, TAU); c.fill(); }
  const mx = 300, my = 250;
  c.fillStyle = '#f6efd8'; c.beginPath(); c.arc(mx, my, 34, 0, TAU); c.fill();
  const mg = g.createRadialGradient(mx, my, 10, mx, my, 120); mg.addColorStop(0, 'rgba(246,239,216,0.25)'); mg.addColorStop(1, 'rgba(246,239,216,0)');
  g.fillStyle = mg; g.fillRect(mx - 120, my - 120, 240, 240);
  c.fillStyle = 'rgba(60,70,130,0.55)';
  for (const [cx, cy, s] of [[200, 300, 90], [420, 286, 70], [980, 180, 110], [1500, 140, 80]] as const) { c.beginPath(); c.ellipse(cx + 10 * Math.sin(t * 0.1), cy, s * 1.4, s * 0.22, 0, 0, TAU); c.fill(); }
  // the sea on the left, the moon's path, the jetty she dived from
  const hz = H * 0.52;
  c.fillStyle = '#121845'; c.fillRect(-600, hz, W + 1200, H);
  for (let k = 0; k < 16; k++) { const yy = hz + 6 + k * k * 1.6, ww = 18 + k * 7 + 8 * Math.sin(t * 2 + k); c.fillStyle = `rgba(246,239,216,${0.6 - k * 0.03})`; c.fillRect(mx - ww / 2 + 6 * Math.sin(t * 1.2 + k), yy, ww, 2.5); }
  c.strokeStyle = '#07091e'; c.lineWidth = 7; c.beginPath(); c.moveTo(520, H * 0.68); c.lineTo(120, hz + 26); c.stroke();
  c.lineWidth = 3; for (let k = 0; k < 8; k++) { const u = k / 7, px = 560 + (160 - 560) * u, py = H * 0.7 + (hz + 30 - H * 0.7) * u; c.beginPath(); c.moveTo(px, py); c.lineTo(px, py + 26 - 14 * u); c.stroke(); }
  // the land rising to the right: a dune, the sandy road up to the hut
  c.fillStyle = '#2a2a52';
  c.beginPath(); c.moveTo(-600, H + 200); c.lineTo(-600, H * 0.78); c.quadraticCurveTo(600, H * 0.66, 900, H * 0.6); c.quadraticCurveTo(1300, H * 0.5, W + 600, H * 0.52); c.lineTo(W + 600, H + 200); c.closePath(); c.fill();
  c.fillStyle = '#3a3660';
  c.beginPath(); c.moveTo(720, H + 200); c.quadraticCurveTo(900, H * 0.8, 1420, 656); c.lineTo(1530, 652); c.quadraticCurveTo(1060, H * 0.8, 1060, H + 200); c.closePath(); c.fill();
  // the village asleep: dark huts down the slope
  for (const [x, y, s] of [[110, H * 0.79, 150], [470, H * 0.72, 120], [1720, H * 0.6, 170]] as const) darkHut(c, x, y, s);
  for (let i = 0; i < 6; i++) palmTree(c, [40, 330, 640, 1530, 1830, 960][i]!, [H * 0.82, H * 0.76, H * 0.7, H * 0.58, H * 0.6, H * 0.64][i]!, 300 + 120 * h01(i, 7, 9), (h01(i, 8, 9) - 0.5) * 0.5, t, i, 0.92);
  // the night's grade over the sleeping village (the lit window and the moon's light are drawn after it)
  c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = '#7a84c8'; c.fillRect(-600, -600, W + 1200, H + 1200); c.restore();
  // her wet footprints up the road, shining in the moon
  for (let i = 0; i < 16; i++) {
    const u = i / 15, px = 900 + (1262 + 190 * 1.3 - 900) * u * u + (i % 2 ? 9 : -9), py = H * 0.95 + (648 + 4 - H * 0.95) * u;
    c.fillStyle = `rgba(170,190,255,${0.7 - 0.35 * u})`; c.beginPath(); c.ellipse(px, py, 8 - 3.5 * u, 4.5 - 1.8 * u, 0.3, 0, TAU); c.fill();
  }
  // the home: the stilt hut with the one lit window
  litHut(c, g, t, 1262, 648, 1.3);
  // fireflies over the grass
  for (let i = 0; i < 12; i++) {
    const x = 760 + 900 * h01(i, 9, 9) + 30 * Math.sin(t * 0.7 + i), y = H * 0.56 + 260 * h01(i, 10, 9) + 20 * Math.sin(t * 0.9 + i * 2), a = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.7);
    g.fillStyle = `rgba(210,255,120,${0.7 * a})`; g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill();
  }
}

function darkHut(c: C2, x: number, y: number, s: number) {
  c.strokeStyle = '#141433'; c.lineWidth = s * 0.04;
  for (const d of [-0.35, 0, 0.35]) { c.beginPath(); c.moveTo(x + d * s, y); c.lineTo(x + d * s, y - s * 0.35); c.stroke(); }
  c.fillStyle = '#1c1c40'; c.fillRect(x - s * 0.42, y - s * 0.72, s * 0.84, s * 0.38);
  c.fillStyle = '#0c0c22'; c.fillRect(x - s * 0.08, y - s * 0.6, s * 0.16, s * 0.26);
  c.fillStyle = '#25254a'; c.beginPath(); c.moveTo(x - s * 0.62, y - s * 0.66); c.lineTo(x, y - s * 1.18); c.lineTo(x + s * 0.62, y - s * 0.66); c.closePath(); c.fill();
}

/** The home, as `dive` draws it (dive-world.ts hutLit): four stilts, a porch with steps on the right, plank walls, a
 *  four-pane window on the left and the door on the right, a curved thatch. At 4 am the door is shut (a line of light
 *  round it) and the window is lit, a woman's shadow rocking on its curtain. (x, y) the sand under it, scale k. */
function litHut(c: C2, g: C2, t: number, x: number, y: number, k: number) {
  const P = (dx: number, dy: number) => [x + dx * k, y + dy * k] as const;
  const wood = '#2e2036', dark = '#3a2c44';
  c.save();
  c.strokeStyle = wood; c.lineWidth = 9 * k;
  for (const d of [-110, -40, 40, 110]) { const [a, b] = P(d, 0), [, e] = P(d, -70); c.beginPath(); c.moveTo(a, b); c.lineTo(a, e); c.stroke(); }
  c.fillStyle = wood; c.fillRect(...P(-140, -78), 290 * k, 14 * k);
  c.fillStyle = dark; c.fillRect(...P(-120, -210), 230 * k, 136 * k);
  c.strokeStyle = 'rgba(14,8,22,0.55)'; c.lineWidth = 1.5;
  for (let j = 1; j < 7; j++) { const [a, b] = P(-120, -210 + j * 19); c.beginPath(); c.moveTo(a, b); c.lineTo(a + 230 * k, b); c.stroke(); }
  c.strokeStyle = wood; c.lineWidth = 6 * k;
  for (let j = 0; j < 4; j++) { const [a, b] = P(150 + j * 12, -64 + j * 17); c.beginPath(); c.moveTo(a, b); c.lineTo(a + 26 * k, b); c.stroke(); }
  // the shut door, a line of lamplight round it
  const [dx, dy] = P(12, -194);
  c.fillStyle = '#2e1e2a'; c.fillRect(dx, dy, 50 * k, 102 * k);
  c.strokeStyle = 'rgba(255,190,100,0.75)'; c.lineWidth = 1.6; c.strokeRect(dx, dy, 50 * k, 102 * k);
  c.fillStyle = '#c9a24a'; c.beginPath(); c.arc(dx + 42 * k, dy + 56 * k, 2.2 * k, 0, TAU); c.fill();
  // the lit window: warm light, a curtain, her shadow rocking on it
  const w = HUT_WIN, wx = w.x - w.w / 2, wy = w.y - w.h / 2;
  const fl = 0.94 + 0.06 * Math.sin(t * 7.3) * Math.sin(t * 3.1);
  const wl = c.createLinearGradient(0, wy, 0, wy + w.h);
  wl.addColorStop(0, rgbaHex('#ffd88a', fl)); wl.addColorStop(1, rgbaHex('#ffa850', fl));
  c.fillStyle = wl; c.fillRect(wx, wy, w.w, w.h);
  c.save(); c.beginPath(); c.rect(wx, wy, w.w, w.h); c.clip();
  const rock = 0.06 * Math.sin(t * 1.7), ax = w.x + 6, ay = wy + w.h + 6;
  c.translate(ax, ay); c.rotate(rock); c.translate(-ax, -ay);
  person(c, w.x + 6, wy + w.h + 22, w.h * 1.15, 'seated', { col: 'rgba(110,50,20,0.5)', flip: true, t, seed: 7, headTilt: 0.15 });
  c.restore();
  c.strokeStyle = 'rgba(170,90,40,0.35)'; c.lineWidth = 1.5; for (let j = 1; j < 6; j++) { c.beginPath(); c.moveTo(wx + j * w.w / 6, wy); c.lineTo(wx + j * w.w / 6 + 2 * Math.sin(t + j), wy + w.h); c.stroke(); }
  c.strokeStyle = wood; c.lineWidth = 4 * k; c.strokeRect(wx, wy, w.w, w.h);
  c.beginPath(); c.moveTo(w.x, wy); c.lineTo(w.x, wy + w.h); c.moveTo(wx, w.y); c.lineTo(wx + w.w, w.y); c.stroke();
  const wg = g.createRadialGradient(w.x, w.y, 6, w.x, w.y, 80 * k);
  wg.addColorStop(0, rgbaHex('#ffcf6b', 0.26 * fl)); wg.addColorStop(1, 'rgba(255,207,107,0)');
  g.fillStyle = wg; g.fillRect(w.x - 120 * k, w.y - 120 * k, 240 * k, 240 * k);
  // the window's light thrown down on the sand
  c.save(); c.globalCompositeOperation = 'lighter';
  const [sx, sy] = P(-65, 30);
  const sg = c.createRadialGradient(sx, sy, 10, sx, sy, 160 * k); sg.addColorStop(0, 'rgba(255,170,80,0.2)'); sg.addColorStop(1, 'rgba(255,170,80,0)');
  c.fillStyle = sg; c.beginPath(); c.ellipse(sx, sy, 160 * k, 34 * k, 0, 0, TAU); c.fill(); c.restore();
  // the thatched roof, its edge catching the moon
  c.fillStyle = '#3a2434';
  c.beginPath(); c.moveTo(...P(-175, -196)); c.quadraticCurveTo(...P(-20, -330), ...P(-5, -340)); c.quadraticCurveTo(...P(20, -330), ...P(180, -196)); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(200,190,255,0.16)'; c.lineWidth = 2;
  for (let j = 0; j < 16; j++) { const u = j / 15, [px, py] = P(-170 + u * 345, -198); c.beginPath(); c.moveTo(px, py); c.lineTo(px + (u - 0.5) * 8 * k, py + 10 * k); c.stroke(); }
  c.strokeStyle = 'rgba(190,200,255,0.3)'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(...P(-175, -196)); c.quadraticCurveTo(...P(-20, -330), ...P(-5, -340)); c.stroke();
  c.restore();
}
