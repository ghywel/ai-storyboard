// verse1's legend scenery: the pages of Rai's pop-up storybook. The quarry on Palau at dawn (the limestone cliff, the
// disc being cut, ladders, shell adzes, rollers, baskets of chips, Palau's rock islands on the sea), the voyage map
// (Palau and Yap, a compass rose, the storm doodled on the route), the night sea (stars, the moon's road, wave light),
// the reef with its surf, and the book itself lying open on the seabed.
import { W, H } from '../engine/gl';
import { HEX } from '../engine/palette';
import { font } from '../engine/type';
import type { AudioData } from '../engine/audio';
import { clamp, lerp } from '../engine/util';
import { h01 } from './_rai';
import { FAM, TAU, type C2, person, rgbaHex } from './_motifs';
import { carver, chips, layer, sky, waves } from './verse1-kit';

// ------------------------------------------------------------------ Palau's rock islands

/** One of Palau's rock islands: a green dome on an undercut limestone neck, standing in the water at (x, y). */
export function islet(c: C2, x: number, y: number, s: number, col = '#2f7a5a', rock = '#c7b28a', seed = 1) {
  c.fillStyle = rock;
  c.beginPath(); c.moveTo(x - s * 0.35, y); c.quadraticCurveTo(x - s * 0.5, y - s * 0.35, x - s * 0.62, y - s * 0.55);
  c.lineTo(x + s * 0.62, y - s * 0.55); c.quadraticCurveTo(x + s * 0.5, y - s * 0.35, x + s * 0.35, y); c.closePath(); c.fill();
  c.fillStyle = 'rgba(40,20,40,0.35)'; c.beginPath(); c.ellipse(x, y - s * 0.12, s * 0.42, s * 0.1, 0, 0, TAU); c.fill(); // the undercut
  c.fillStyle = col;
  c.beginPath();
  for (let i = 0; i < 7; i++) { const a = Math.PI + (i / 6) * Math.PI, r = s * (0.62 + 0.08 * h01(i, seed)); c.lineTo(x + Math.cos(a) * r, y - s * 0.5 + Math.sin(a) * r * 0.75); }
  c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.12)'; c.beginPath(); c.ellipse(x - s * 0.2, y - s * 0.85, s * 0.25, s * 0.12, -0.3, 0, TAU); c.fill();
}

// ------------------------------------------------------------------ the quarry (a full page, 1920x1080)

/**
 * The quarry on Palau at dawn: the sea with its rock islands, the limestone cliff with a disc half cut out of its face
 * (her, asleep in the rock: `zzz`), a bamboo ladder, carvers striking on the beat, chips flying, a basket carrier, log
 * rollers, a finished disc, a coil of rope and shell adzes on the ground. `pk(i)` pops each layer up off the page.
 */
export function quarry(c: C2, t: number, au: AudioData, pk: (i: number) => number, o: { groove?: number; asleep?: boolean } = {}) {
  sky(c, t, W * 0.8, H * 0.56, '#3a2266', '#ffb03a', HEX.orange, HEX.yellow, 110, 0.03);
  // the far sea and Palau's rock islands
  const hz = H * 0.56;
  layer(c, pk(0), hz + 40, () => {
    c.fillStyle = '#b4567a'; c.fillRect(-W, hz, 3 * W, H);
    c.strokeStyle = 'rgba(255,214,120,0.7)'; c.lineWidth = 3;
    for (let i = 0; i < 16; i++) { const y = hz + 8 + i * 16, w = 30 + 120 * (i / 16); const x = W * 0.8 - w / 2 + 40 * Math.sin(t * 2 + i); c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.stroke(); }
    [[0.62, 70], [0.7, 46], [0.9, 90], [0.97, 54], [0.55, 40]].forEach(([u, s], i) => islet(c, W * u!, hz + 6, s!, i % 2 ? '#2f7a5a' : '#3c8f62', '#d0b58a', i + 2));
  });
  // the cliff: warm limestone lit by the dawn, strata, ledges, a cave mouth
  layer(c, pk(1), H, () => {
    c.fillStyle = '#e2b77e';
    c.beginPath(); c.moveTo(-60, H + 40); c.lineTo(-60, H * 0.08); c.lineTo(W * 0.18, H * 0.05); c.lineTo(W * 0.44, H * 0.12);
    c.lineTo(W * 0.5, H * 0.3); c.lineTo(W * 0.56, H * 0.36); c.lineTo(W * 0.6, H * 0.62); c.lineTo(W * 0.66, H * 0.8); c.lineTo(W * 0.68, H + 40); c.closePath(); c.fill();
    c.save(); c.shadowColor = 'transparent'; c.clip();
    c.strokeStyle = 'rgba(150,95,50,0.5)'; c.lineWidth = 4;
    for (let k = 0; k < 9; k++) { c.beginPath(); c.moveTo(-60, H * (0.16 + 0.09 * k)); c.bezierCurveTo(W * 0.2, H * (0.12 + 0.09 * k), W * 0.4, H * (0.2 + 0.09 * k), W * 0.7, H * (0.18 + 0.09 * k)); c.stroke(); }
    c.fillStyle = 'rgba(255,240,200,0.35)'; c.fillRect(W * 0.46, 0, 40, H); // the rim lit by the sun
    c.fillStyle = '#5a2f2a'; c.beginPath(); c.ellipse(W * 0.08, H * 0.22, 90, 60, 0, Math.PI, 0); c.lineTo(W * 0.08 + 90, H * 0.24); c.lineTo(W * 0.08 - 90, H * 0.24); c.fill(); // the cave
    c.restore();
  });
  // the disc being cut out of the face: a groove round it, the hole begun; her, asleep in the rock
  const dx = W * 0.3, dy = H * 0.5, R = 170;
  layer(c, pk(2), H, () => {
    c.save(); c.shadowColor = 'transparent';
    c.fillStyle = '#f3e6cc'; c.beginPath(); c.arc(dx, dy, R, 0, TAU); c.fill();
    c.strokeStyle = '#5a2f2a'; c.lineWidth = 22; c.lineCap = 'round';
    const gr = o.groove ?? 0.8;
    c.beginPath(); c.arc(dx, dy, R + 10, -Math.PI / 2, -Math.PI / 2 + TAU * gr); c.stroke();
    c.strokeStyle = 'rgba(90,47,42,0.6)'; c.lineWidth = 10; c.beginPath(); c.arc(dx, dy + 12, R * 0.27, 0, TAU); c.stroke();
    c.fillStyle = 'rgba(150,95,50,0.25)';
    for (let i = 0; i < 30; i++) { const a = h01(i, 5) * TAU, d = Math.sqrt(h01(i, 6)) * R * 0.9; c.beginPath(); c.arc(dx + Math.cos(a) * d, dy + Math.sin(a) * d, 3 + 5 * h01(i, 7), 0, TAU); c.fill(); }
    if (o.asleep !== false) { // zzz: she sleeps in the rock until she is cut free
      c.font = font(FAM.hook(), 40); c.textAlign = 'center';
      for (let i = 0; i < 3; i++) { const u = ((t * 0.5 + i / 3) % 1); c.fillStyle = `rgba(90,47,42,${1 - u})`; c.fillText('z', dx + R * 0.7 + u * 60, dy - R * 0.7 - u * 80); }
    }
    c.restore();
  }, 0);
  // the bamboo ladder and the carvers striking the groove on the beat
  layer(c, pk(3), H, () => {
    c.strokeStyle = '#6b4a22'; c.lineWidth = 9;
    c.beginPath(); c.moveTo(dx - 300, H * 0.86); c.lineTo(dx - 230, H * 0.2); c.moveTo(dx - 240, H * 0.86); c.lineTo(dx - 170, H * 0.2); c.stroke();
    c.lineWidth = 6; for (let k = 0; k < 9; k++) { const u = k / 9; c.beginPath(); c.moveTo(lerp(dx - 300, dx - 230, u), lerp(H * 0.86, H * 0.2, u)); c.lineTo(lerp(dx - 240, dx - 170, u), lerp(H * 0.86, H * 0.2, u)); c.stroke(); }
    carver(c, au, t, dx - 205, H * 0.36, 150, HEX.ink, false, 0);
    carver(c, au, t, dx + 230, H * 0.86, 210, HEX.ink, true, 0.5);
  });
  chips(c, au, t, dx - 140, H * 0.3, '#fff1d6', 9, 1, 0);
  chips(c, au, t, dx + 150, H * 0.62, '#fff1d6', 9, -1, 0.5);
  // the ground: rollers, a finished disc, a basket of chips, rope, adzes; the basket carrier
  layer(c, pk(4), H, () => {
    c.fillStyle = '#4a2a3a'; c.beginPath(); c.moveTo(-60, H + 40); c.lineTo(-60, H * 0.86);
    for (let x = -60; x <= W + 60; x += 60) c.lineTo(x, H * 0.86 + 10 * Math.sin(x * 0.01));
    c.lineTo(W + 60, H + 40); c.fill();
    c.save(); c.shadowColor = 'transparent';
    c.fillStyle = '#8a5a32'; for (let k = 0; k < 5; k++) { c.beginPath(); c.ellipse(W * 0.6 + k * 70, H * 0.86, 30, 14, 0, 0, TAU); c.fill(); }
    // a finished disc on the rollers
    c.fillStyle = '#8f8676'; c.beginPath(); c.arc(W * 0.76 + 18, H * 0.86 - 115, 112, 0, TAU); c.fill();
    c.fillStyle = '#efe2c8'; c.beginPath(); c.arc(W * 0.76, H * 0.86 - 115, 112, 0, TAU); c.moveTo(W * 0.76 + 30, H * 0.86 - 110); c.arc(W * 0.76, H * 0.86 - 110, 30, 0, TAU); c.fill('evenodd');
    c.strokeStyle = '#6f6656'; c.lineWidth = 4; c.beginPath(); c.arc(W * 0.76, H * 0.86 - 115, 112, 0, TAU); c.stroke();
    // a basket of chips, a coil of rope, two shell adzes on the ground
    c.fillStyle = '#b07a3a'; c.beginPath(); c.moveTo(W * 0.45, H * 0.86); c.lineTo(W * 0.43, H * 0.8); c.lineTo(W * 0.51, H * 0.8); c.lineTo(W * 0.49, H * 0.86); c.fill();
    c.fillStyle = '#fff1d6'; for (let i = 0; i < 9; i++) c.fillRect(W * 0.435 + i * 12, H * 0.795 - 6 * h01(i, 3), 9, 7);
    c.strokeStyle = '#c9a36b'; c.lineWidth = 6; for (let k = 0; k < 3; k++) { c.beginPath(); c.ellipse(W * 0.92, H * 0.875 - k * 8, 46 - k * 6, 14, 0, 0, TAU); c.stroke(); }
    c.restore();
    person(c, W * 0.56, H * 0.86, 190, 'carry', { col: HEX.ink, t, seed: 7 });
    c.fillStyle = HEX.ink; c.beginPath(); c.ellipse(W * 0.56, H * 0.86 - 190 * 1.02, 34, 12, 0, 0, TAU); c.fill(); // a basket on the head
  });
}

// ------------------------------------------------------------------ the voyage map

const PAL: [number, number][] = [[0, -60], [22, -30], [30, 10], [18, 50], [0, 80], [-14, 60], [-20, 20], [-16, -30]];

/**
 * The map page: parchment, Palau (Babeldaob and its rock islands) and Yap (four islands close together), a compass
 * rose, a sea serpent, and on the route's middle a doodled storm (the storm ahead). The route is drawn to u (0..1).
 */
export function mapPage(c: C2, t: number, u: number, P: [number, number], Y: [number, number], Q: [number, number], pk: (i: number) => number) {
  c.fillStyle = '#efe0bd'; c.fillRect(0, 0, W, H);
  const v = c.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.7);
  v.addColorStop(0, 'rgba(120,80,40,0)'); v.addColorStop(1, 'rgba(120,80,40,0.45)');
  c.fillStyle = v; c.fillRect(0, 0, W, H);
  // the ocean, washed in
  c.fillStyle = 'rgba(80,160,170,0.28)'; c.fillRect(60, 60, W - 120, H - 120);
  c.strokeStyle = 'rgba(40,90,110,0.45)'; c.lineWidth = 3;
  for (let i = 0; i < 46; i++) { const x = 100 + (W - 260) * h01(i, 51), y = 120 + (H - 340) * h01(i, 52); c.beginPath(); c.arc(x, y, 11, Math.PI * 1.1, Math.PI * 1.9); c.arc(x + 20, y, 11, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
  c.strokeStyle = '#5a3f2a'; c.lineWidth = 4; c.strokeRect(60, 60, W - 120, H - 120);
  const ink = '#4a3220';
  // Palau: the long island and its scatter of rock islands
  layer(c, pk(0), P[1] + 100, () => {
    c.fillStyle = '#7fae6a'; c.strokeStyle = ink; c.lineWidth = 4;
    c.beginPath(); PAL.forEach(([x, y], i) => { const px = P[0] + x * 2.2, py = P[1] + y * 1.6; i ? c.lineTo(px, py) : c.moveTo(px, py); }); c.closePath(); c.fill(); c.stroke();
    for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(P[0] - 40 + 60 * h01(i, 61), P[1] + 150 + 60 * h01(i, 62), 6 + 7 * h01(i, 63), 0, TAU); c.fill(); c.stroke(); }
  }, 0.2);
  // Yap: four islands close together, its reef ring around them
  layer(c, pk(1), Y[1] + 90, () => {
    c.strokeStyle = 'rgba(40,90,110,0.7)'; c.lineWidth = 3; c.setLineDash([8, 8]); c.beginPath(); c.ellipse(Y[0], Y[1], 95, 110, 0.3, 0, TAU); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#7fae6a'; c.strokeStyle = ink; c.lineWidth = 4;
    for (const [dx, dy, rx, ry, a] of [[-20, -30, 38, 52, 0.4], [26, 10, 30, 40, 0.2], [-8, 40, 22, 26, 0], [40, 54, 14, 18, 0.5]] as const) { c.beginPath(); c.ellipse(Y[0] + dx, Y[1] + dy, rx, ry, a, 0, TAU); c.fill(); c.stroke(); }
  }, 0.2);
  c.font = font(FAM.serifB(), 56); c.fillStyle = ink; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('Palau', P[0] - 20, P[1] - 150); c.fillText('Yap', Y[0], Y[1] - 160);
  // the compass rose
  const cx = W * 0.86, cy = H * 0.24, r = 70;
  c.save(); c.translate(cx, cy); c.rotate(0.04 * Math.sin(t));
  c.fillStyle = ink;
  for (let k = 0; k < 4; k++) { c.save(); c.rotate((k * Math.PI) / 2); c.beginPath(); c.moveTo(0, -r); c.lineTo(14, 0); c.lineTo(-14, 0); c.closePath(); c.fill(); c.restore(); }
  c.fillStyle = '#c0392b'; c.beginPath(); c.moveTo(0, -r); c.lineTo(14, 0); c.lineTo(0, 0); c.closePath(); c.fill();
  c.font = font(FAM.serifB(), 30); c.fillStyle = ink; c.fillText('N', 0, -r - 22);
  c.restore();
  // the storm on the route: a doodled cloud with a bolt, the warning before the storm
  const sx = lerp(P[0], Y[0], 0.62) - 10, sy = (P[1] + Y[1]) / 2 - 170 + 6 * Math.sin(t * 3);
  c.fillStyle = '#6b6478'; c.strokeStyle = ink; c.lineWidth = 3;
  c.beginPath(); for (const [ox, oy, rr] of [[-40, 0, 34], [0, -18, 44], [42, 0, 34], [0, 12, 36]] as const) { c.moveTo(sx + ox + rr, sy + oy); c.arc(sx + ox, sy + oy, rr, 0, TAU); } c.fill(); c.stroke();
  c.fillStyle = HEX.yellow; c.beginPath(); c.moveTo(sx - 4, sy + 34); c.lineTo(sx + 14, sy + 34); c.lineTo(sx + 2, sy + 62); c.lineTo(sx + 18, sy + 62); c.lineTo(sx - 12, sy + 104); c.lineTo(sx - 2, sy + 72); c.lineTo(sx - 16, sy + 72); c.closePath(); c.fill(); c.stroke();
  // a sea serpent, for the old map's sake
  c.strokeStyle = ink; c.lineWidth = 7; c.lineCap = 'round';
  const kx = W * 0.4, ky = H * 0.7;
  for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(kx + k * 60, ky + 4 * Math.sin(t * 2 + k), 24, Math.PI, 0); c.stroke(); }
  c.beginPath(); c.arc(kx - 34, ky - 4, 12, 0, TAU); c.stroke();
  // the route, drawn up to u, in red ink
  const at = (v: number): [number, number] => [(1 - v) * (1 - v) * P[0] + 2 * (1 - v) * v * Q[0] + v * v * Y[0], (1 - v) * (1 - v) * P[1] + 2 * (1 - v) * v * Q[1] + v * v * Y[1]];
  c.save(); c.setLineDash([22, 16]); c.strokeStyle = '#c0392b'; c.lineWidth = 7; c.beginPath();
  for (let k = 0; k <= 50; k++) { const [x, y] = at((k / 50) * u); k ? c.lineTo(x, y) : c.moveTo(x, y); }
  c.stroke(); c.restore();
  // the scale bar
  c.font = font(FAM.mono(), 22); c.fillStyle = ink; c.textAlign = 'left';
  c.fillRect(110, H - 300, 300, 6); for (let k = 0; k <= 4; k++) c.fillRect(110 + k * 75, H - 310, 4, 26);
  c.fillText('0        100       200 km', 104, H - 322);
  return at(u);
}

// ------------------------------------------------------------------ the night sea

/** A night sky and sea: stars, the moon and its road on the water, wave crests catching its light. */
export function nightSea(c: C2, t: number, hz: number, mx: number, my: number, o: { stars?: number; blue?: number } = {}) {
  const blue = o.blue ?? 0;
  const g = c.createLinearGradient(0, 0, 0, hz);
  g.addColorStop(0, '#070a24'); g.addColorStop(1, rgbaHex('#2b2f6a', 1));
  c.fillStyle = g; c.fillRect(-W, -H, 3 * W, hz + H + 2);
  const n = o.stars ?? 140;
  for (let i = 0; i < n; i++) {
    const tw = 0.5 + 0.5 * Math.sin(t * (1 + 3 * h01(i, 3)) + i);
    c.fillStyle = `rgba(255,255,255,${0.25 + 0.6 * tw * h01(i, 4)})`;
    c.beginPath(); c.arc(h01(i, 5) * W, h01(i, 6) * hz * 0.95, 0.8 + 1.6 * h01(i, 7), 0, TAU); c.fill();
  }
  c.save(); c.shadowColor = '#fff4d6'; c.shadowBlur = 50; c.fillStyle = '#fff4d6'; c.beginPath(); c.arc(mx, my, 54, 0, TAU); c.fill(); c.restore();
  c.fillStyle = 'rgba(200,190,160,0.35)'; for (const [ox, oy, r] of [[-14, -10, 12], [16, 8, 9], [-6, 20, 7]] as const) { c.beginPath(); c.arc(mx + ox, my + oy, r, 0, TAU); c.fill(); }
  const sg = c.createLinearGradient(0, hz, 0, H);
  sg.addColorStop(0, blue > 0 ? mixC('#1b2258', '#1f5fd0', blue) : '#1b2258'); sg.addColorStop(1, blue > 0 ? mixC('#070a1e', '#0b2a7a', blue) : '#070a1e');
  c.fillStyle = sg; c.fillRect(-W, hz, 3 * W, H * 2);
  // the moon's road: broken glints under the moon, widening towards us
  c.fillStyle = 'rgba(255,244,214,0.75)';
  for (let i = 0; i < 26; i++) {
    const u = i / 26, y = hz + 6 + (H - hz) * u * u, w = (20 + 160 * u) * (0.5 + 0.5 * h01(i, 9)), x = mx - w / 2 + (60 * u + 10) * Math.sin(t * 2.2 + i * 1.7);
    c.fillRect(x, y, w, 2 + 4 * u);
  }
  // wave crests catching the light
  c.strokeStyle = 'rgba(150,170,255,0.35)'; c.lineWidth = 2;
  for (let j = 0; j < 12; j++) {
    const y = hz + (H - hz) * Math.pow((j + 1) / 13, 1.5), w = 40 + 140 * (j / 12);
    for (let k = 0; k < 7; k++) { const x = ((h01(j, k, 11) * W + t * 20 * (k % 2 ? 1 : -1)) % W + W) % W; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + w / 2, y - 4, x + w, y); c.stroke(); }
  }
}

function mixC(a: string, b: string, u: number): string {
  const p = parseInt(a.slice(1), 16), q = parseInt(b.slice(1), 16), v = clamp(u);
  const ch = (s: number) => Math.round(((p >> s) & 255) + (((q >> s) & 255) - ((p >> s) & 255)) * v);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

// ------------------------------------------------------------------ the reef

/** The reef's teeth across the foreground (dark coral heads, a coral rim), surf bursting white over them. */
export function reef(c: C2, t: number, y: number, k: number) {
  layer(c, k, H + 40, () => {
    c.fillStyle = '#6a2a5a'; c.beginPath(); c.moveTo(-100, H + 60);
    for (let i = 0; i <= 18; i++) { const x = -100 + i * 130; c.lineTo(x, y + (i % 2 ? 90 : 0) - 70 * h01(i, 91)); }
    c.lineTo(W + 100, H + 60); c.closePath(); c.fill();
    c.save(); c.shadowColor = 'transparent'; c.strokeStyle = HEX.coral; c.lineWidth = 5;
    c.beginPath(); for (let i = 0; i <= 18; i++) { const x = -100 + i * 130; const yy = y + (i % 2 ? 90 : 0) - 70 * h01(i, 91); i ? c.lineTo(x, yy) : c.moveTo(x, yy); } c.stroke();
    c.restore();
  }, 0.5);
  // surf: white plumes bursting over the teeth, each on its own cycle, breaking into spray
  if (k > 0.5) for (let i = 0; i < 7; i++) {
    const x = 120 + i * 290, ph = (t * 1.1 + h01(i, 92)) % 1, hgt = 220 * Math.sin(ph * Math.PI);
    if (ph < 0.7) {
      c.fillStyle = '#ffffff';
      c.beginPath(); c.moveTo(x - 60, y + 30);
      c.quadraticCurveTo(x - 50, y - hgt * 0.6, x - 10, y - hgt); c.quadraticCurveTo(x + 10, y - hgt * 1.1, x + 30, y - hgt * 0.8);
      c.quadraticCurveTo(x + 60, y - hgt * 0.4, x + 70, y + 30); c.closePath(); c.fill();
      c.strokeStyle = '#bfe9ff'; c.lineWidth = 3; c.stroke();
    }
    c.fillStyle = '#ffffff';
    for (let j = 0; j < 10; j++) {
      const a = -Math.PI * (0.15 + 0.7 * h01(i, j, 93)), v = 180 + 260 * h01(i, j, 94), u = ph * 0.9;
      const sx = x + Math.cos(a) * v * u, sy = y - hgt * 0.7 + Math.sin(a) * v * u + 500 * u * u;
      c.beginPath(); c.arc(sx, sy, 4 + 6 * (1 - ph), 0, TAU); c.fill();
    }
  }
}

// ------------------------------------------------------------------ the book, open on the sand

/**
 * Rai's pop-up storybook lying open on the seabed, centred at (x, y) (the spine), width w; its pages show lines of
 * print and a little drawing. Returns the spine's top point (where the pop-up rises from).
 */
export function book(c: C2, x: number, y: number, w: number, open: number) {
  const h = w * 0.32, o = clamp(open);
  c.save();
  // the cover under the pages (deep red board) and its shadow on the sand
  c.fillStyle = 'rgba(40,30,20,0.3)'; c.beginPath(); c.ellipse(x, y + h * 0.5, w * 0.58, h * 0.25, 0, 0, TAU); c.fill();
  const page = (side: number) => {
    const lift = (1 - o) * Math.PI * 0.5;
    const px = side * w * 0.5 * Math.cos(lift), py = -side * 0 - w * 0.25 * Math.sin(lift);
    c.fillStyle = '#8e2b2b';
    c.beginPath(); c.moveTo(x, y + 10); c.lineTo(x + px * 1.03, y + 10 + h * 0.08 + py); c.lineTo(x + px * 1.03, y - h + 6 + py); c.lineTo(x, y - h * 0.9 + 6); c.closePath(); c.fill();
    c.fillStyle = '#f6ecd4';
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + px * 0.5, y + h * 0.1 + py * 0.5, x + px, y + h * 0.05 + py); c.lineTo(x + px, y - h + py); c.quadraticCurveTo(x + px * 0.5, y - h * 0.86 + py * 0.5, x, y - h * 0.9); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(90,60,40,0.4)'; c.lineWidth = 3;
    for (let k = 0; k < 6; k++) { const yy = y - h * 0.78 + k * h * 0.13; c.beginPath(); c.moveTo(x + px * 0.15, yy + py * 0.2); c.lineTo(x + px * 0.85, yy + py * 0.8 + h * 0.02); c.stroke(); }
  };
  page(-1); page(1);
  c.strokeStyle = 'rgba(60,40,30,0.5)'; c.lineWidth = 4; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h * 0.9); c.stroke();
  c.restore();
  return { x, y: y - h * 0.45 };
}
