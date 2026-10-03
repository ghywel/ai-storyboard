// archive's footage ("Previously…"): the reels the studio screen plays, each a full 1920x1080 picture that the plate
// shows full frame under the VHS look, or shrunk into the porthole CRT on the set.
//   quarry   Palau at sunset: the limestone cliff with her disc's outline cut into it and glowing, bamboo scaffold,
//            the crew chipping with shell adzes on the beat, chips flying; the rock islands on the sea.
//   adze     the macro: a shell adze striking limestone, a burst of grit.
//   routeMap the crossing as an old TV graphic: Palau to Yap, the dotted route drawing itself, 400 KM.
//   nightSea open ocean under the stars: a raft, two paddlers, the stone lashed upright looking up.
//   lashing  dawn on the shore: the raft in the shallows, the stone being roped to it, a knot a beat.
//   storm    night, lightning, the reef's surf, the raft tilting on a crest, the rope snapping, the stone sliding.
// Silhouettes only (Rai is the only face; on the raft it is her, younger, in the footage).
import { W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import { clamp, ease, frameIdx } from '../../engine/util';
import { drawRai, h01 } from '../_rai';
import { FAM, TAU, rgbaHex, mixHex, person } from '../_motifs';
import { palmTree } from '../_world';
import type { C2 } from './onair-kit';

// ------------------------------------------------------------------ shared bits

/** The chop of a shell adze in a beat: raised (-1) .. struck (0) .. raised again; ph is the beat phase 0..1. */
const chopAngle = (ph: number) => (ph < 0.1 ? -1.25 + 1.65 * ease.inQuad(ph / 0.1) : 0.4 - 1.65 * ease.outCubic((ph - 0.1) / 0.9));

/** A rock islet of Palau: a limestone mushroom undercut by the sea, a green cap. */
function islet(c: C2, x: number, y: number, s: number, rock: string, green: string) {
  c.fillStyle = rock;
  c.beginPath(); c.moveTo(x - 30 * s, y);
  c.bezierCurveTo(x - 40 * s, y - 20 * s, x - 90 * s, y - 40 * s, x - 80 * s, y - 70 * s);
  c.bezierCurveTo(x - 60 * s, y - 120 * s, x + 60 * s, y - 120 * s, x + 85 * s, y - 70 * s);
  c.bezierCurveTo(x + 95 * s, y - 40 * s, x + 40 * s, y - 20 * s, x + 30 * s, y); c.closePath(); c.fill();
  c.fillStyle = green;
  c.beginPath(); c.moveTo(x - 82 * s, y - 70 * s);
  c.bezierCurveTo(x - 70 * s, y - 130 * s, x + 70 * s, y - 135 * s, x + 86 * s, y - 72 * s);
  c.bezierCurveTo(x + 40 * s, y - 86 * s, x - 40 * s, y - 84 * s, x - 82 * s, y - 70 * s); c.fill();
}

/** A silhouette worker holding a tool overhead (person 'carry'), the tool drawn by `tool` at the hands. */
function worker(c: C2, x: number, y: number, h: number, col: string, flip: boolean, t: number, seed: number, tool: (hx: number, hy: number) => void) {
  person(c, x, y, h, 'carry', { col, flip, t, seed });
  const u = h / 100, f = flip ? -1 : 1;
  tool(x + f * 2 * u, y - 88 * u);
}

/** A shell adze at (hx, hy) swung by angle a (0 = struck, pointing at the rock on the worker's facing side). */
function adze(c: C2, hx: number, hy: number, len: number, a: number, f: number, col: string) {
  c.save(); c.translate(hx, hy); c.scale(f, 1); c.rotate(a);
  c.strokeStyle = col; c.lineCap = 'round'; c.lineWidth = len * 0.08;
  c.beginPath(); c.moveTo(0, 0); c.lineTo(len, len * 0.1); c.stroke();
  c.fillStyle = '#f2e6cf'; // the clam-shell blade, pale against the dusk
  c.beginPath(); c.moveTo(len * 0.9, -len * 0.05); c.quadraticCurveTo(len * 1.25, len * 0.05, len * 1.0, len * 0.38); c.lineTo(len * 0.86, len * 0.2); c.closePath(); c.fill();
  c.restore();
}

/** Chips flying from a strike at (x, y) at t0 (ballistic, gone in 0.6 s). */
function chips(c: C2, x: number, y: number, t: number, t0: number, dir: number, col: string, n = 9, seed = 1) {
  const a = t - t0;
  if (a < 0 || a > 0.6) return;
  c.fillStyle = col;
  for (let i = 0; i < n; i++) {
    const vx = dir * (120 + 360 * h01(i, seed, 1)), vy = -200 - 300 * h01(i, seed, 2), s = 3 + 6 * h01(i, seed, 3);
    const px = x + vx * a, py = y + vy * a + 900 * a * a;
    c.globalAlpha = 1 - a / 0.6;
    c.fillRect(px - s / 2, py - s / 2, s, s);
  }
  c.globalAlpha = 1;
}

// ------------------------------------------------------------------ the quarry on Palau, at sunset

export const QUARRY = { disc: { x: W * 0.34, y: H * 0.47, r: 205 } };

/**
 * The quarry at sunset. `beat` is the song's beat index (fractional) for the chopping; `groove` 0..1 how deep the cut
 * is (the outline's glow); `hits` recent strike times for the chips.
 */
export function quarry(c: C2, g: C2, t: number, beat: number, groove: number) {
  const hz = H * 0.6;
  // sky and sun
  const sky = c.createLinearGradient(0, 0, 0, hz);
  sky.addColorStop(0, '#2a1f6a'); sky.addColorStop(0.6, '#a64a7a'); sky.addColorStop(1, '#ff9a5a');
  c.fillStyle = sky; c.fillRect(-W, -H, W * 3, hz + H);
  c.fillStyle = '#ffd98a'; c.beginPath(); c.arc(W * 0.8, hz - 50, 80, 0, TAU); c.fill();
  g.fillStyle = rgbaHex('#ffb060', 0.35); g.beginPath(); g.arc(W * 0.8, hz - 50, 150, 0, TAU); g.fill();
  for (let i = 0; i < 5; i++) { // long sunset clouds
    c.fillStyle = rgbaHex(i % 2 ? '#ff8a6a' : '#7a3a7a', 0.55);
    c.beginPath(); c.ellipse(W * (0.55 + 0.11 * i) + 20 * Math.sin(t * 0.1 + i), H * (0.12 + 0.06 * i), 180 + 40 * h01(i, 3), 12, 0, 0, TAU); c.fill();
  }
  // the sea, the sun's road, the rock islands
  const sea = c.createLinearGradient(0, hz, 0, H);
  sea.addColorStop(0, '#5a3f8a'); sea.addColorStop(1, '#241a52');
  c.fillStyle = sea; c.fillRect(-W, hz, W * 3, H);
  for (let k = 0; k < 18; k++) {
    const y = hz + 8 + k * 14, w = 160 - k * 5 + 30 * Math.sin(t * 2 + k);
    c.fillStyle = rgbaHex('#ffcf7a', 0.5 - k * 0.025); c.fillRect(W * 0.8 - w / 2 + 10 * Math.sin(t * 1.5 + k * 2), y, w, 3);
  }
  islet(c, W * 0.62, hz + 6, 0.8, '#6a4a6a', '#2c4a3a');
  islet(c, W * 0.93, hz + 4, 1.1, '#5a3d62', '#253f33');
  islet(c, W * 0.71, hz + 3, 0.45, '#6f5070', '#2f4d3d');
  // the cliff: pale limestone, warm where the sun catches it, strata and cracks
  const cg = c.createLinearGradient(0, 0, W * 0.62, 0);
  cg.addColorStop(0, '#b9a07e'); cg.addColorStop(0.75, '#e8d2ad'); cg.addColorStop(1, '#ffc58a');
  c.fillStyle = cg;
  c.beginPath(); c.moveTo(-W, H * 1.2); c.lineTo(-W, H * 0.06);
  c.lineTo(W * 0.1, H * 0.05); c.lineTo(W * 0.24, H * 0.03); c.lineTo(W * 0.4, H * 0.07); c.lineTo(W * 0.53, H * 0.12);
  c.lineTo(W * 0.6, H * 0.3); c.lineTo(W * 0.58, H * 0.55); c.lineTo(W * 0.64, H * 0.85); c.lineTo(W * 0.66, H * 1.2); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(140,110,80,0.45)'; c.lineWidth = 3;
  for (let j = 0; j < 9; j++) {
    c.beginPath();
    for (let x = -W * 0.2; x <= W * 0.6; x += 40) { const y = H * (0.14 + j * 0.095) + 8 * Math.sin(x * 0.01 + j); x === -W * 0.2 ? c.moveTo(x, y) : c.lineTo(x, y); }
    c.stroke();
  }
  c.strokeStyle = 'rgba(110,85,60,0.5)'; c.lineWidth = 2;
  for (const [x0, y0] of [[W * 0.06, H * 0.2], [W * 0.52, H * 0.3], [W * 0.15, H * 0.75]] as const) {
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + 14, y0 + 60); c.lineTo(x0 + 4, y0 + 120); c.lineTo(x0 + 18, y0 + 190); c.stroke();
  }
  // green on the cliff top
  c.fillStyle = '#2f5a3c';
  for (let i = 0; i < 14; i++) { c.beginPath(); c.arc(W * (0.0 + 0.04 * i), H * (0.05 + 0.02 * Math.sin(i * 1.7)), 26 + 14 * h01(i, 9), 0, TAU); c.fill(); }
  // her disc, being cut out of the face: the groove, the stone inside it, the hole begun, the outline glowing
  const D = QUARRY.disc;
  c.fillStyle = 'rgba(90,64,40,0.85)'; c.beginPath(); c.arc(D.x, D.y, D.r + 16, 0, TAU); c.fill();
  const dg = c.createRadialGradient(D.x - D.r * 0.3, D.y - D.r * 0.4, 10, D.x, D.y, D.r);
  dg.addColorStop(0, '#f6e7c8'); dg.addColorStop(1, '#cdb48a');
  c.fillStyle = dg; c.beginPath(); c.arc(D.x, D.y, D.r, 0, TAU); c.fill();
  c.fillStyle = 'rgba(80,58,36,0.85)'; c.beginPath(); c.arc(D.x, D.y + D.r * 0.08, D.r * 0.26, 0, TAU); c.fill();
  c.strokeStyle = rgbaHex('#ffd27a', 0.5 + 0.5 * groove); c.lineWidth = 6;
  c.beginPath(); c.arc(D.x, D.y, D.r + 8, 0, TAU); c.stroke();
  g.strokeStyle = rgbaHex(HEX.gold, 0.25 + 0.45 * groove); g.lineWidth = 22;
  g.beginPath(); g.arc(D.x, D.y, D.r + 8, 0, TAU); g.stroke();
  g.fillStyle = rgbaHex(HEX.pink, 0.25 * groove); g.beginPath(); g.arc(D.x, D.y + D.r * 0.08, D.r * 0.24, 0, TAU); g.fill();
  // bamboo scaffold round the disc, and platforms
  c.strokeStyle = '#6a4a2a'; c.lineWidth = 9; c.lineCap = 'round';
  for (const x of [D.x - D.r - 70, D.x + D.r + 70]) { c.beginPath(); c.moveTo(x, H * 0.12); c.lineTo(x + 6, H * 0.98); c.stroke(); }
  for (const y of [D.y - D.r * 0.55, D.y + D.r * 0.55, D.y + D.r + 40]) { c.beginPath(); c.moveTo(D.x - D.r - 110, y); c.lineTo(D.x + D.r + 110, y + 6); c.stroke(); }
  c.strokeStyle = '#5a3a1e'; c.lineWidth = 3;
  for (const [x, y] of [[D.x - D.r - 70, D.y - D.r * 0.55], [D.x + D.r + 70, D.y + D.r * 0.55]] as const) { c.beginPath(); c.moveTo(x - 6, y - 8); c.lineTo(x + 8, y + 10); c.moveTo(x + 6, y - 8); c.lineTo(x - 8, y + 10); c.stroke(); }
  // the crew: twelve in all; four here on the scaffold chipping the groove on the beat (two on the off-beat)
  const crew = [
    { x: D.x - D.r - 40, y: D.y - D.r * 0.55, f: false, off: 0 },
    { x: D.x + D.r + 40, y: D.y - D.r * 0.55, f: true, off: 0.5 },
    { x: D.x - D.r - 30, y: D.y + D.r * 0.55, f: false, off: 0.5 },
    { x: D.x + D.r + 44, y: D.y + D.r * 0.55, f: true, off: 0 },
    { x: D.x - 40, y: D.y + D.r + 40, f: false, off: 0.25 },
  ];
  crew.forEach((w, i) => {
    const ph = ((beat + w.off) % 1 + 1) % 1, a = chopAngle(ph);
    worker(c, w.x, w.y, 170, '#24121c', w.f, t, i + 3, (hx, hy) => adze(c, hx, hy, 70, a + (w.f ? 0.3 : 0.3), w.f ? -1 : 1, '#24121c'));
    const strikeT = t - (ph - 0.1) * (60 / 140);
    chips(c, w.x + (w.f ? -1 : 1) * 70, w.y - 120, t, strikeT, w.f ? 1 : -1, '#fff1d0', 8, i + 1);
  });
  // a basket of chips and two palms in the foreground
  palmTree(c, W * 0.99, H * 1.05, 520, -0.22, t, 1, 0.65);
  palmTree(c, W * 0.88, H * 1.08, 380, -0.12, t, 2, 0.7);
  c.fillStyle = '#3a2416'; c.beginPath(); c.moveTo(W * 0.05, H); c.lineTo(W * 0.07, H * 0.88); c.lineTo(W * 0.17, H * 0.88); c.lineTo(W * 0.19, H); c.closePath(); c.fill();
  c.fillStyle = '#e9dcc0';
  for (let i = 0; i < 16; i++) { c.beginPath(); c.arc(W * (0.08 + 0.006 * i), H * 0.88 - 6 - 6 * h01(i, 4), 6, 0, TAU); c.fill(); }
}

/** The macro: a shell adze in a fist striking the limestone; grit bursts on each strike (beat). */
export function adzeMacro(c: C2, g: C2, t: number, beat: number) {
  // the rock face, close: grain, pits, the groove's lip
  const rg = c.createLinearGradient(0, 0, W, H);
  rg.addColorStop(0, '#d9c29c'); rg.addColorStop(1, '#f2dfbd');
  c.fillStyle = rg; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 260; i++) {
    c.fillStyle = h01(i, 2) < 0.6 ? 'rgba(140,110,78,0.35)' : 'rgba(255,255,255,0.35)';
    c.beginPath(); c.arc(h01(i, 3) * W, h01(i, 4) * H, 2 + 9 * h01(i, 5), 0, TAU); c.fill();
  }
  c.strokeStyle = 'rgba(120,92,60,0.5)'; c.lineWidth = 4;
  for (let j = 0; j < 6; j++) { c.beginPath(); for (let x = 0; x <= W; x += 40) { const y = H * (0.1 + 0.17 * j) + 10 * Math.sin(x * 0.008 + j); x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
  // the groove: a deep curved cut (a piece of the ring), glowing faintly gold; the blade lands on it
  const GC = { x: W * 0.95, y: H * 1.6, r: H * 1.25 }, ia = Math.PI * 1.35;
  const ix = GC.x + Math.cos(ia) * GC.r, iy = GC.y + Math.sin(ia) * GC.r;
  c.strokeStyle = '#6a4c30'; c.lineWidth = 70;
  c.beginPath(); c.arc(GC.x, GC.y, GC.r, Math.PI * 1.08, Math.PI * 1.6); c.stroke();
  c.strokeStyle = 'rgba(40,26,14,0.6)'; c.lineWidth = 20;
  c.beginPath(); c.arc(GC.x, GC.y, GC.r - 22, Math.PI * 1.08, Math.PI * 1.6); c.stroke();
  g.strokeStyle = rgbaHex(HEX.gold, 0.32); g.lineWidth = 26;
  g.beginPath(); g.arc(GC.x, GC.y, GC.r + 42, Math.PI * 1.08, Math.PI * 1.6); g.stroke();
  // the fist and adze, swinging from the lower left onto the groove
  const ph = ((beat % 1) + 1) % 1, cu = (chopAngle(ph) + 1.25) / 1.65;
  const px = W * 0.2, py = H * 1.12, L = Math.hypot(ix - px, iy - py), a0 = Math.atan2(iy - py, ix - px);
  c.save();
  c.translate(px, py); c.rotate(a0 - 0.75 * (1 - cu));
  c.strokeStyle = '#5a3a20'; c.lineWidth = 40; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, 0); c.lineTo(L - 150, 0); c.stroke();
  c.strokeStyle = '#3a2412'; c.lineWidth = 3;
  for (let k = 0; k < 8; k++) { c.beginPath(); c.moveTo(60 + k * 80, -12); c.lineTo(120 + k * 80, -8); c.stroke(); }
  c.strokeStyle = '#d9c08a'; c.lineWidth = 9;
  for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(L - 230 + k * 14, -30); c.lineTo(L - 222 + k * 14, 30); c.stroke(); }
  // the blade: a clam shell's lip, ridged, its edge to the rock
  c.fillStyle = '#f6ead2'; c.strokeStyle = '#a88f68'; c.lineWidth = 5;
  c.beginPath(); c.moveTo(L - 200, -70); c.quadraticCurveTo(L + 30, -90, L + 10, 10); c.quadraticCurveTo(L - 60, 60, L - 200, 40); c.closePath(); c.fill(); c.stroke();
  for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(L - 190, -50 + k * 16); c.quadraticCurveTo(L - 80, -60 + k * 18, L - 4 - k * 4, -30 + k * 12); c.stroke(); }
  c.fillStyle = '#24121c'; c.beginPath(); c.roundRect(-60, -60, 260, 120, 50); c.fill(); // the fist on the haft
  c.restore();
  // grit on each strike
  const strikeT = t - (ph - 0.1) * (60 / 140), age = t - strikeT;
  if (age >= 0 && age < 0.7) {
    for (let i = 0; i < 40; i++) {
      const ang = -Math.PI * 0.98 + Math.PI * 0.95 * h01(i, 11, Math.floor(beat)), sp = 300 + 1000 * h01(i, 12, Math.floor(beat));
      const qx = ix + Math.cos(ang) * sp * age, qy = iy + Math.sin(ang) * sp * age + 1200 * age * age, s = 3 + 12 * h01(i, 13);
      c.fillStyle = rgbaHex(i % 3 ? '#fff4dc' : '#c9b08a', 1 - age / 0.7);
      c.fillRect(qx - s / 2, qy - s / 2, s, s);
    }
    if (age < 0.25) { g.fillStyle = rgbaHex('#fff2d0', 0.6 * (1 - age / 0.25)); g.beginPath(); g.arc(ix, iy, 140, 0, TAU); g.fill(); }
    c.fillStyle = rgbaHex('#fff6e6', 0.45 * (1 - age / 0.7)); c.beginPath(); c.arc(ix, iy, 60 + 300 * age, 0, TAU); c.fill();
  }
}

// ------------------------------------------------------------------ the crossing: a TV map

export const MAP = { palau: { x: W * 0.2, y: H * 0.7 }, yap: { x: W * 0.74, y: H * 0.3 }, ctrl: { x: W * 0.36, y: H * 0.2 } };
const routeAt = (u: number) => {
  const { palau: a, ctrl: k, yap: b } = MAP, v = 1 - u;
  return { x: v * v * a.x + 2 * v * u * k.x + u * u * b.x, y: v * v * a.y + 2 * v * u * k.y + u * u * b.y };
};

/** The voyage as an 80s TV graphic map: the route Palau -> Yap drawn to u (0..1), the stars twinkling with `tw`. */
export function routeMap(c: C2, g: C2, t: number, u: number, tw: number) {
  const bg = c.createRadialGradient(W * 0.5, H * 0.5, 100, W * 0.5, H * 0.5, W * 0.7);
  bg.addColorStop(0, '#0e2a5a'); bg.addColorStop(1, '#040a22');
  c.fillStyle = bg; c.fillRect(0, 0, W, H);
  // the grid of latitude and longitude, labelled
  c.strokeStyle = 'rgba(47,224,255,0.13)'; c.lineWidth = 2;
  for (let x = 120; x < W; x += 180) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
  for (let y = 90; y < H; y += 180) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  c.font = font(FAM.mono(), 20); c.fillStyle = 'rgba(47,224,255,0.4)'; c.textAlign = 'left';
  ['133°E', '134°E', '135°E', '136°E', '137°E', '138°E'].forEach((s, i) => c.fillText(s, 128 + i * 360, 120));
  ['10°N', '8°N', '6°N'].forEach((s, i) => c.fillText(s, 40, 260 + i * 360));
  // stars over the open sea (twinkling on the hats)
  for (let i = 0; i < 70; i++) {
    const x = h01(i, 21) * W, y = h01(i, 22) * H, s = 1.5 + 3 * h01(i, 23) * (0.6 + 0.8 * tw * (h01(i, 24) > 0.6 ? 1 : 0.3));
    c.fillStyle = rgbaHex('#cfe8ff', 0.5 + 0.4 * h01(i, 25)); c.beginPath(); c.arc(x, y, s, 0, TAU); c.fill();
  }
  // the islands: Palau's long chain of rock islands, Yap's small cluster, glowing coastlines
  const coast = (pts: [number, number, number][], col: string) => {
    const blob = (cc: C2, x: number, y: number, r: number, seed: number) => {
      cc.beginPath();
      for (let i = 0; i <= 24; i++) {
        const a = (i / 24) * TAU, rr = r * (0.75 + 0.35 * h01(seed, i % 24, 71)) * (1 + 0.5 * Math.cos(2 * (a + 0.9)));
        const px = x + Math.cos(a) * rr * 0.7, py = y + Math.sin(a) * rr * 0.45;
        i ? cc.lineTo(px, py) : cc.moveTo(px, py);
      }
      cc.closePath();
    };
    pts.forEach(([x, y, r], i) => {
      blob(c, x, y, r, i + Math.round(x)); c.fillStyle = '#1f5a40'; c.fill(); c.strokeStyle = col; c.lineWidth = 3; c.stroke();
      blob(g, x, y, r, i + Math.round(x)); g.strokeStyle = rgbaHex(col, 0.35); g.lineWidth = 8; g.stroke();
    });
  };
  const P = MAP.palau, Y = MAP.yap;
  coast([[P.x, P.y, 46], [P.x - 40, P.y + 54, 28], [P.x + 34, P.y - 50, 22], [P.x - 70, P.y + 100, 16], [P.x + 60, P.y - 92, 12]], HEX.lime);
  coast([[Y.x, Y.y, 34], [Y.x + 30, Y.y - 26, 16], [Y.x - 26, Y.y + 22, 12]], HEX.gold);
  c.font = font(FAM.monoB(), 34); c.fillStyle = HEX.bone; c.textAlign = 'left';
  c.fillText('PALAU', P.x + 70, P.y + 20);
  c.fillText('YAP', Y.x + 60, Y.y + 14);
  c.font = font(FAM.mono(), 20); c.fillStyle = 'rgba(244,241,234,0.7)';
  c.fillText('THE QUARRY', P.x + 72, P.y + 50); c.fillText('HOME', Y.x + 62, Y.y + 42);
  // the route, dot by dot, to u; the raft at its head
  const n = 60;
  for (let i = 0; i <= n * u; i++) {
    const p = routeAt(i / n), on = clamp(0.45 + 0.3 * Math.sin(t * 8 - i * 0.6) + 0.6 * tw);
    c.fillStyle = mixHex('#8a6a2a', HEX.yellow, on); c.beginPath(); c.arc(p.x, p.y, 6, 0, TAU); c.fill();
    g.fillStyle = rgbaHex(HEX.yellow, 0.4 * on); g.beginPath(); g.arc(p.x, p.y, 13, 0, TAU); g.fill();
  }
  if (u > 0) {
    const p = routeAt(u), q = routeAt(Math.max(0, u - 0.02)), a = Math.atan2(p.y - q.y, p.x - q.x);
    c.save(); c.translate(p.x, p.y + 4 * Math.sin(t * 5)); c.rotate(a * 0.2);
    c.fillStyle = '#c99a5a'; c.fillRect(-26, -6, 52, 14);
    c.strokeStyle = '#7a5a2e'; c.lineWidth = 2; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(k * 10, -6); c.lineTo(k * 10, 8); c.stroke(); }
    c.fillStyle = HEX.stone; c.beginPath(); c.ellipse(0, -22, 12, 16, 0, 0, TAU); c.fill();
    c.fillStyle = '#5b5345'; c.beginPath(); c.arc(0, -22, 4, 0, TAU); c.fill();
    c.restore();
  }
  // a compass rose
  c.save(); c.translate(W * 0.9, H * 0.62); c.strokeStyle = 'rgba(244,241,234,0.5)'; c.lineWidth = 2;
  c.beginPath(); c.arc(0, 0, 60, 0, TAU); c.stroke();
  c.fillStyle = 'rgba(244,241,234,0.7)';
  for (let k = 0; k < 4; k++) { c.save(); c.rotate((k * Math.PI) / 2); c.beginPath(); c.moveTo(0, -80); c.lineTo(10, 0); c.lineTo(-10, 0); c.closePath(); c.fill(); c.restore(); }
  c.font = font(FAM.monoB(), 22); c.textAlign = 'center'; c.fillText('N', 0, -92);
  c.restore();
}
/** Where the route's head is (for the counter). */
export const routeHead = routeAt;

// ------------------------------------------------------------------ the open ocean at night

/** Open ocean under the stars: the Milky Way, a crescent moon and its road, a raft with two paddlers and the stone. */
export function nightSea(c: C2, g: C2, t: number, o: { raftX?: number; raftK?: number; tw?: number; raiFace?: 'wow' | 'soft' | 'smile'; shoot?: number } = {}) {
  const hz = H * 0.56, tw = o.tw ?? 0;
  const sky = c.createLinearGradient(0, 0, 0, hz);
  sky.addColorStop(0, '#03061c'); sky.addColorStop(1, '#1d2a72');
  c.fillStyle = sky; c.fillRect(-W, -H, W * 3, hz + H);
  // the Milky Way, a soft diagonal band
  c.save(); c.translate(W / 2, hz * 0.45); c.rotate(-0.35);
  const mw = c.createLinearGradient(0, -120, 0, 120);
  mw.addColorStop(0, 'rgba(160,170,255,0)'); mw.addColorStop(0.5, 'rgba(190,200,255,0.3)'); mw.addColorStop(1, 'rgba(160,170,255,0)');
  c.fillStyle = mw; c.fillRect(-W, -120, W * 2, 240);
  c.restore();
  for (let i = 0; i < 260; i++) {
    const x = h01(i, 31) * W * 1.2 - W * 0.1, y = h01(i, 32) * hz, big = h01(i, 33) > 0.9;
    const s = (big ? 2.6 : 1.2) * (1 + (big ? 0.6 * tw : 0) + 0.3 * Math.sin(t * 3 + i));
    c.fillStyle = rgbaHex(h01(i, 34) > 0.8 ? '#ffe6b0' : '#e6eeff', 0.5 + 0.5 * h01(i, 35)); c.beginPath(); c.arc(x, y, s, 0, TAU); c.fill();
    if (big) { g.fillStyle = rgbaHex('#cfe0ff', 0.25 + 0.3 * tw); g.beginPath(); g.arc(x, y, 7, 0, TAU); g.fill(); }
  }
  // a shooting star (on "stars")
  if (o.shoot !== undefined && t >= o.shoot && t < o.shoot + 0.7) {
    const a = (t - o.shoot) / 0.7, sx = W * (0.15 + 0.5 * a), sy = H * (0.08 + 0.18 * a);
    const sg = g.createLinearGradient(sx - 260, sy - 95, sx, sy);
    sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(1, `rgba(255,250,230,${0.9 * (1 - a)})`);
    g.strokeStyle = sg; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(sx - 260, sy - 95); g.lineTo(sx, sy); g.stroke();
    c.fillStyle = `rgba(255,255,240,${1 - a})`; c.beginPath(); c.arc(sx, sy, 4, 0, TAU); c.fill();
  }
  // a crescent moon
  c.fillStyle = '#fff4d6'; c.beginPath(); c.arc(W * 0.8, H * 0.16, 44, 0, TAU); c.fill();
  c.fillStyle = '#0a1240'; c.beginPath(); c.arc(W * 0.8 + 18, H * 0.16 - 10, 40, 0, TAU); c.fill();
  g.fillStyle = 'rgba(255,240,210,0.25)'; g.beginPath(); g.arc(W * 0.8, H * 0.16, 90, 0, TAU); g.fill();
  // the sea: deep blue swells, the moon's road
  const sea = c.createLinearGradient(0, hz, 0, H);
  sea.addColorStop(0, '#16206a'); sea.addColorStop(1, '#050a2a');
  c.fillStyle = sea; c.fillRect(-W, hz, W * 3, H);
  for (let k = 0; k < 26; k++) {
    const y = hz + 6 + k * k * 0.9, w = 50 + k * 8;
    c.fillStyle = rgbaHex('#fff2c8', 0.45 - k * 0.015); c.fillRect(W * 0.8 - w / 2 + 14 * Math.sin(t * 1.4 + k * 1.7), y, w * (0.4 + 0.6 * h01(k, 3)), 2.5);
  }
  c.strokeStyle = 'rgba(111,140,255,0.25)'; c.lineWidth = 2;
  for (let k = 0; k < 9; k++) {
    c.beginPath();
    for (let x = -40; x <= W + 40; x += 40) { const y = hz + 20 + k * 48 + 6 * Math.sin(x * 0.006 + t * 1.2 + k); x === -40 ? c.moveTo(x, y) : c.lineTo(x, y); }
    c.stroke();
  }
  // the raft
  const rx = o.raftX ?? W * 0.42, k = o.raftK ?? 1, ry = H * 0.74 + 10 * Math.sin(t * 1.6), tilt = 0.04 * Math.sin(t * 1.6 + 1);
  raftWithStone(c, g, t, rx, ry, k, tilt, o.raiFace ?? 'wow', 'down', '#0c0a1e');
}

/**
 * The bamboo raft with the stone lashed upright on it and two paddlers; (x, y) is the raft's deck centre, scale k
 * (1 = a 420 px raft). Rai is herself, younger, in the footage.
 */
export function raftWithStone(c: C2, g: C2, t: number, x: number, y: number, k: number, tilt: number, face: Parameters<typeof drawRai>[4]['face'], arms: Parameters<typeof drawRai>[4]['arms'], ink: string, o: { ropes?: number; slide?: number; marks?: Parameters<typeof drawRai>[4]['marks']; markT0?: number; paddle?: boolean; snapped?: boolean } = {}) {
  c.save();
  c.translate(x, y); c.rotate(tilt); c.scale(k, k);
  // the deck: lashed bamboo poles, seen a little from above
  c.fillStyle = '#7a5a34'; c.beginPath(); c.roundRect(-210, -8, 420, 30, 8); c.fill();
  c.strokeStyle = '#4a3420'; c.lineWidth = 3;
  for (let i = -5; i <= 5; i++) { c.beginPath(); c.moveTo(i * 38, -8); c.lineTo(i * 38 + 6, 22); c.stroke(); }
  c.fillStyle = '#9a7444'; c.fillRect(-214, -12, 428, 8);
  // the paddlers, kneeling at either end
  if (o.paddle !== false) {
    person(c, -170, -8, 120, 'paddle', { col: ink, t, seed: 4 });
    person(c, 170, -8, 120, 'paddle', { col: ink, t: t + 0.4, seed: 7, flip: true });
  }
  // the stone, lashed upright in the middle (her, younger)
  const sl = o.slide ?? 0, R = 62;
  c.save(); c.translate(sl * 260, sl * sl * 40); c.rotate(sl * 0.6);
  const a = drawRai(c, 0, -8 - 1.07 * R, R, { t, face, arms, glow: '#9fb8ff', glowStrength: 0.5, heart: 0.2, marks: o.marks, markT0: o.markT0 });
  void a;
  // the ropes over her (a lash per beat in `lashing`)
  const ropes = o.ropes ?? 3;
  c.strokeStyle = '#d9c08a'; c.lineWidth = 5; c.lineCap = 'round';
  for (let i = 0; i < Math.floor(ropes); i++) {
    const yy = -8 - R * (0.25 + 0.5 * i), snapped = o.snapped && i === 0;
    c.beginPath();
    if (snapped) { c.moveTo(-R * 1.15, yy + 20); c.quadraticCurveTo(-R * 1.4, yy + 40, -R * 1.6, yy + 70); c.moveTo(R * 1.15, yy + 20); c.quadraticCurveTo(R * 1.5, yy - 10, R * 1.7, yy + 30); }
    else { c.moveTo(-R * 1.15, yy + 18); c.quadraticCurveTo(0, yy - 8, R * 1.15, yy + 18); }
    c.stroke();
  }
  c.restore();
  c.restore();
}

// ------------------------------------------------------------------ dawn on the shore: the lashing

/** Dawn on Palau's shore: the raft in the shallows, the stone being roped to it (`ropes` lashes so far). */
export function lashing(c: C2, g: C2, t: number, ropes: number, face: Parameters<typeof drawRai>[4]['face'], squash: number, marks: Parameters<typeof drawRai>[4]['marks'], markT0: number) {
  const hz = H * 0.5;
  const sky = c.createLinearGradient(0, 0, 0, hz);
  sky.addColorStop(0, '#4a3f9a'); sky.addColorStop(0.7, '#e88aa0'); sky.addColorStop(1, '#ffc08a');
  c.fillStyle = sky; c.fillRect(0, 0, W, hz);
  c.fillStyle = '#fff0c0'; c.beginPath(); c.arc(W * 0.24, hz, 70, Math.PI, 0); c.fill();
  g.fillStyle = 'rgba(255,220,160,0.35)'; g.beginPath(); g.arc(W * 0.24, hz, 160, Math.PI, 0); g.fill();
  const sea = c.createLinearGradient(0, hz, 0, H * 0.8);
  sea.addColorStop(0, '#7a6ab0'); sea.addColorStop(1, '#3a5a9a');
  c.fillStyle = sea; c.fillRect(0, hz, W, H * 0.3);
  islet(c, W * 0.7, hz + 3, 0.6, '#7a5f80', '#3a5a48');
  islet(c, W * 0.86, hz + 2, 0.35, '#7a5f80', '#3a5a48');
  // the sand and the shallows' edge
  c.fillStyle = '#ecc996';
  c.beginPath(); c.moveTo(0, H); c.lineTo(0, H * 0.78);
  for (let x = 0; x <= W; x += 40) c.lineTo(x, H * 0.8 + 10 * Math.sin(x * 0.005 + t * 0.8));
  c.lineTo(W, H); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 4;
  c.beginPath(); for (let x = 0; x <= W; x += 40) { const y = H * 0.8 + 10 * Math.sin(x * 0.005 + t * 0.8) - 6; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
  // rope coils and bamboo on the sand
  c.strokeStyle = '#c9a66a'; c.lineWidth = 6;
  for (let k = 0; k < 4; k++) { c.beginPath(); c.ellipse(W * 0.13, H * 0.9 - k * 8, 60, 18, 0, 0, TAU); c.stroke(); }
  c.strokeStyle = '#8a6a3a'; c.lineWidth = 12; c.lineCap = 'round';
  for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(W * 0.78, H * 0.93 - k * 14); c.lineTo(W * 0.96, H * 0.9 - k * 14); c.stroke(); }
  // the raft in the shallows, the stone on it, the ropes; two of the crew hauling the ends tight
  const rx = W * 0.5, ry = H * 0.74;
  c.save(); c.translate(0, -squash * 6);
  raftWithStone(c, g, t, rx, ry, 1.6, 0, face, ['down', 'down'], '#22121c', { ropes, paddle: false, marks, markT0 });
  c.restore();
  const pull = 0.5 + 0.5 * Math.sin(t * 9);
  person(c, W * 0.22, H * 0.86, 230, 'point', { col: '#22121c', t, seed: 3, flip: true });
  person(c, W * 0.78, H * 0.86, 230, 'point', { col: '#22121c', t, seed: 5 });
  c.strokeStyle = '#d9c08a'; c.lineWidth = 5;
  c.beginPath(); c.moveTo(W * 0.22 - 50, H * 0.86 - 196); c.quadraticCurveTo(W * 0.33, H * 0.8 + 16 * pull, W * 0.5 - 116, H * 0.66); c.stroke();
  c.beginPath(); c.moveTo(W * 0.78 + 50, H * 0.86 - 196); c.quadraticCurveTo(W * 0.67, H * 0.8 + 16 * pull, W * 0.5 + 116, H * 0.66); c.stroke();
}

// ------------------------------------------------------------------ the storm off the reef

/**
 * Night, the storm: clouds, rain, lightning at `bolt` (time of the last strike), heaving seas, the reef's surf, and
 * the raft riding a crest at `tilt`; `slide` 0..1 the stone sliding off (the rope snapped).
 */
export function storm(c: C2, g: C2, t: number, o: { bolt: number; tilt: number; slide: number; face: Parameters<typeof drawRai>[4]['face']; marks?: Parameters<typeof drawRai>[4]['marks']; markT0?: number; snapped?: boolean; zoom?: number }) {
  const hz = H * 0.42, age = t - o.bolt;
  const flash = age >= 0 && age < 0.12 ? 1 - age / 0.12 : 0;
  const sky = c.createLinearGradient(0, 0, 0, hz);
  sky.addColorStop(0, mixHex('#07051a', '#5a5aa8', flash)); sky.addColorStop(1, mixHex('#1c1640', '#8a8ad0', flash));
  c.fillStyle = sky; c.fillRect(-W, -H, W * 3, hz + H);
  // storm clouds rolling
  for (let i = 0; i < 16; i++) {
    const x = ((h01(i, 41) * W * 1.4 + t * 60 * (0.5 + h01(i, 42))) % (W * 1.4)) - W * 0.2, y = H * (0.04 + 0.25 * h01(i, 43)), r = 90 + 90 * h01(i, 44);
    c.fillStyle = mixHex('#120e2a', '#3a3870', 0.3 * h01(i, 45) + 0.5 * flash);
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.arc(x + r * 0.8, y + 10, r * 0.7, 0, TAU); c.arc(x - r * 0.8, y + 14, r * 0.6, 0, TAU); c.fill();
  }
  // the bolt
  if (age >= 0 && age < 0.25) {
    const k = Math.floor(o.bolt * 10), x0 = W * (0.55 + 0.3 * h01(k, 1)), a = 1 - age / 0.25;
    g.strokeStyle = rgbaHex('#dff4ff', a); g.lineWidth = 7; g.lineJoin = 'miter';
    c.strokeStyle = rgbaHex('#ffffff', a); c.lineWidth = 4;
    for (const cc of [g, c]) {
      cc.beginPath(); let x = x0, y = 0; cc.moveTo(x, y);
      for (let i = 1; i <= 9; i++) { x += (h01(k, i, 2) - 0.5) * 120; y = (hz + 60) * (i / 9); cc.lineTo(x, y); }
      cc.stroke();
    }
  }
  // heaving seas: dark swells with foam crests
  for (let layer = 0; layer < 3; layer++) {
    const y0 = hz + layer * 130, amp = 46 + layer * 30, col = ['#1a2160', '#121a50', '#0a1038'][layer]!;
    c.fillStyle = mixHex(col, '#4a5aa8', 0.4 * flash);
    c.beginPath(); c.moveTo(-40, H);
    for (let x = -40; x <= W + 40; x += 30) c.lineTo(x, y0 + amp * Math.sin(x * 0.006 + t * (1.6 + layer * 0.4) + layer * 2));
    c.lineTo(W + 40, H); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(230,240,255,0.55)'; c.lineWidth = 3;
    c.beginPath();
    for (let x = -40; x <= W + 40; x += 30) { const y = y0 + amp * Math.sin(x * 0.006 + t * (1.6 + layer * 0.4) + layer * 2) - 2; x === -40 ? c.moveTo(x, y) : c.lineTo(x, y); }
    c.stroke();
  }
  // the reef's surf breaking on the right
  for (let i = 0; i < 10; i++) {
    const u = ((t * 0.9 + h01(i, 51)) % 1), x = W * (0.8 + 0.18 * h01(i, 52)), y = hz + 90 - u * 120;
    c.fillStyle = `rgba(240,248,255,${0.7 * (1 - u)})`; c.beginPath(); c.arc(x, y, 20 + 50 * u, 0, TAU); c.fill();
  }
  c.fillStyle = '#24182a'; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(W * (0.8 + 0.035 * i), hz + 110 + 6 * Math.sin(i), 46, 14, 0, 0, TAU); c.fill(); }
  // the raft on the crest
  const rx = W * 0.42, ry = H * 0.62 + 34 * Math.sin(t * 2.4);
  raftWithStone(c, g, t, rx, ry, 1.6 * (o.zoom ?? 1), o.tilt, o.face, ['up', 'up'], '#05040e', { ropes: 2, slide: o.slide, marks: o.marks, markT0: o.markT0, snapped: o.snapped });
  if (o.slide > 0.6) { // the splash where she went in
    const s = clamp((o.slide - 0.6) / 0.4);
    c.fillStyle = `rgba(235,245,255,${0.85 * (1 - s * 0.6)})`;
    for (let i = 0; i < 9; i++) { const a = -Math.PI * (0.15 + 0.7 * i / 8); c.beginPath(); c.ellipse(rx + 420 + Math.cos(a) * 120 * s, ry + 60 + Math.sin(a) * 200 * s, 16, 40, a + Math.PI / 2, 0, TAU); c.fill(); }
  }
  // rain
  c.strokeStyle = 'rgba(200,215,255,0.35)'; c.lineWidth = 2;
  const kf = frameIdx(t);
  c.beginPath();
  for (let i = 0; i < 160; i++) { const x = ((h01(i, 61) * W * 1.3 + kf * 9) % (W * 1.3)) - W * 0.15, y = ((h01(i, 62) * H + kf * 38) % (H + 80)) - 40; c.moveTo(x, y); c.lineTo(x - 18, y + 46); }
  c.stroke();
  if (flash > 0) { c.fillStyle = `rgba(220,230,255,${0.22 * flash})`; c.fillRect(0, 0, W, H); }
}

/** A typed-out archive data caption (Plex Mono), under the ARCHIVE label, typing from t0 at `cps`. */
export function dataLine(c: C2, text: string, t: number, t0: number, y = 104, cps = 40) {
  if (t < t0) return;
  const n = Math.min(text.length, Math.floor((t - t0) * cps));
  c.save();
  c.font = font(FAM.monoB(), 30); c.textAlign = 'left'; c.textBaseline = 'top';
  const s = text.slice(0, n), tw = c.measureText(s).width;
  c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(30, y - 6, tw + 24, 42);
  c.fillStyle = '#f4f1ea'; c.fillText(s + (n < text.length && Math.floor(t * 8) % 2 ? '▌' : ''), 42, y);
  c.restore();
}
