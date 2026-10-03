// manta's world (TREATMENT-v2.md, "manta", chorus 1): the manta seen from the side and head-on (the kit's `manta()` is
// the view from above, used here for the high shots), the riders' seat, neon fish and the school, the sea cucumber
// counting its spots, the field of old stones, the broken raft and the sunken canoe, the anchor chain, the iron wreck's
// bow and its hatch, the murk, the word STONE in bubbles that pop, and the pebble pendant.
// Canvas2D in the 1920x1080 logical frame, y down, pure functions of t.
import { W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import { clamp, ease } from '../../engine/util';
import { h01 } from '../_rai';
import { FAM, TAU, rgbaHex, mixHex, stone } from '../_motifs';
import { fish, coral, reed } from '../_world';
import { star4 } from '../_manga';

type C2 = CanvasRenderingContext2D;
type P = { x: number; y: number };
const PI = Math.PI;
export const MANTA_COL = '#1d2a4a';   // the kit's manta

// ------------------------------------------------------------------ the manta, side on (three-quarter, from a little above)

export interface MantaSideOpts { flap?: number; pitch?: number; col?: string; belly?: string; lit?: number; flip?: boolean; glowEdge?: string }
/**
 * The manta from the side and a little above, head to the right (or left with `flip`), body centre (x, y), scale s
 * (s = 1: about 330 px nose to tail-root). `flap` -1 (wings up) .. 1 (wings down). Returns where riders sit.
 */
export function mantaSide(c: C2, x: number, y: number, s: number, t: number, o: MantaSideOpts = {}): { seat: P; seat2: P; nose: P } {
  const f = clamp(o.flap ?? 0, -1.2, 1.2), col = o.col ?? MANTA_COL, belly = o.belly ?? '#d7e0ec', fl = o.flip ? -1 : 1;
  const top = mixHex(col, '#3a5a8a', 0.25 * (o.lit ?? 0));
  c.save(); c.translate(x, y); c.rotate(o.pitch ?? 0); c.scale(s * fl, s);
  c.lineJoin = 'round'; c.lineCap = 'round';
  // the tail, a long whip
  c.strokeStyle = col; c.lineWidth = 5;
  c.beginPath(); c.moveTo(-150, 2); c.quadraticCurveTo(-280, 14 + 10 * Math.sin(t * 2.2), -430, 4 + 22 * Math.sin(t * 1.7 + 1)); c.stroke();
  // the far wing (behind the body, darker)
  const farTip: P = { x: -135, y: -92 + 62 * f };
  c.fillStyle = mixHex(col, '#000000', 0.25);
  c.beginPath(); c.moveTo(70, -14);
  c.quadraticCurveTo(10, -72 + 26 * f, farTip.x, farTip.y);
  c.quadraticCurveTo(-110, -40 + 30 * f, -130, -8); c.closePath(); c.fill();
  // the body: a pale belly crescent under a dark top
  c.fillStyle = belly; c.beginPath(); c.ellipse(-2, 9, 150, 25, 0, 0, TAU); c.fill();
  c.fillStyle = top; c.beginPath(); c.ellipse(0, -3, 156, 27, 0, 0, TAU); c.fill();
  // the head and the cephalic fins, curled forward
  c.fillStyle = top; c.beginPath(); c.ellipse(140, 2, 30, 20, 0, 0, TAU); c.fill();
  c.fillStyle = mixHex(col, '#000000', 0.35); c.beginPath(); c.ellipse(166, 10, 10, 6, 0.2, 0, TAU); c.fill();   // the mouth
  for (const [dx, dy, rot] of [[176, -6, -0.5], [172, 18, 0.6]] as const) {
    c.fillStyle = dy < 0 ? mixHex(col, '#000000', 0.2) : top;
    c.beginPath(); c.ellipse(dx, dy, 18, 7, rot, 0, TAU); c.fill();
  }
  // pale shoulder marks and spots on the back
  c.fillStyle = 'rgba(225,236,250,0.2)';
  c.beginPath(); c.ellipse(40, -14, 34, 8, -0.1, 0, TAU); c.fill();
  // the near wing (towards us, below the body), its leading edge catching the light
  const nearTip: P = { x: -40, y: 175 + 120 * f };
  c.fillStyle = top;
  c.beginPath(); c.moveTo(80, 12);
  c.quadraticCurveTo(50, 110 + 40 * f, nearTip.x, nearTip.y);
  c.quadraticCurveTo(-70, 80 + 50 * f, -125, 8); c.closePath(); c.fill();
  c.fillStyle = 'rgba(225,236,250,0.16)';
  for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(-10 + 30 * h01(k, 3) - 20 * k, 40 + 50 * h01(k, 4) + 20 * k * (0.5 + 0.5 * f), 5 + 4 * h01(k, 5), 0, TAU); c.fill(); }
  c.strokeStyle = o.glowEdge ?? 'rgba(200,230,255,0.45)'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(80, 12); c.quadraticCurveTo(50, 110 + 40 * f, nearTip.x, nearTip.y); c.stroke();
  c.beginPath(); c.moveTo(70, -14); c.quadraticCurveTo(10, -72 + 26 * f, farTip.x, farTip.y); c.stroke();
  const m = c.getTransform();
  c.restore();
  const tp = (lx: number, ly: number): P => { const q = m.transformPoint(new DOMPoint(lx, ly)); return { x: q.x, y: q.y }; };
  // seat points come back in the caller's space (undo the caller's own transform)
  const inv = c.getTransform().inverse();
  const back = (q: P): P => { const r = inv.transformPoint(new DOMPoint(q.x, q.y)); return { x: r.x, y: r.y }; };
  return { seat: back(tp(55, -22)), seat2: back(tp(-15, -24)), nose: back(tp(180, 4)) };
}

/**
 * The manta from below as it comes at us and over: its pale belly with the dark margin, gill slits, the cephalic fins
 * leading (towards the bottom of the frame: its head is nearest us), the tail trailing up. `sy` squashes it (edge-on far
 * away, flat overhead). `light` 0..1 how lit its belly is.
 */
export function mantaBelow(c: C2, x: number, y: number, s: number, sy: number, t: number, o: { flap?: number; bank?: number; light?: number } = {}) {
  const f = o.flap ?? 0, L = o.light ?? 1, belly = mixHex('#1e2c48', '#e4ebf2', L), edge = mixHex('#0e1628', '#5a6e8e', L * 0.6);
  c.save(); c.translate(x, y); c.rotate(o.bank ?? 0); c.scale(s, s * sy);
  const tip = -10 - 40 * f;
  const wing = (k: number) => {
    c.beginPath(); c.moveTo(0, 78 * k);
    c.quadraticCurveTo(160 * k, 70 * k, 335 * k, tip * k); c.quadraticCurveTo(190 * k, -40 * k, 46 * k, -78 * k);
    c.lineTo(0, -84 * k); c.lineTo(-46 * k, -78 * k);
    c.quadraticCurveTo(-190 * k, -40 * k, -335 * k, tip * k); c.quadraticCurveTo(-160 * k, 70 * k, 0, 78 * k);
    c.closePath();
  };
  // the tail, trailing away up the frame
  c.strokeStyle = edge; c.lineWidth = 5; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, -80); c.quadraticCurveTo(12 * Math.sin(t * 2), -200, -10 * Math.sin(t * 1.6), -330); c.stroke();
  c.fillStyle = edge; wing(1); c.fill();
  const bg = c.createRadialGradient(0, 10, 10, 0, 10, 320);
  bg.addColorStop(0, belly); bg.addColorStop(0.55, mixHex(belly, edge, 0.25)); bg.addColorStop(1, mixHex(belly, edge, 0.7));
  c.fillStyle = bg; wing(0.88); c.fill();
  // gill slits, two rows, and a few dark spots
  c.strokeStyle = mixHex(belly, '#1e2c48', 0.45); c.lineWidth = 3;
  for (const side of [-1, 1]) for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(side * 22, 40 - k * 13); c.lineTo(side * 40, 36 - k * 13); c.stroke(); }
  c.fillStyle = mixHex(belly, '#1e2c48', 0.35);   // a few dark freckles out on the wings (never two near the middle)
  for (let k = 0; k < 5; k++) { const side = k % 2 ? 1 : -1; c.beginPath(); c.arc(side * (90 + 120 * h01(k, 21)), -10 - 30 * h01(k, 22), 4 + 4 * h01(k, 23), 0, TAU); c.fill(); }
  // the mouth and the cephalic fins, leading
  c.fillStyle = '#0a1020'; c.beginPath(); c.roundRect(-28, 70, 56, 10, 4); c.fill();
  c.fillStyle = edge;
  for (const side of [-1, 1]) { c.beginPath(); c.ellipse(side * 36, 92, 9, 22, side * 0.2, 0, TAU); c.fill(); }
  c.restore();
}

/** The manta head-on, from below (its pale belly, gill slits) or above: wings out to ±320 s, `flap` -1..1, `bank`. */
export function mantaFront(c: C2, x: number, y: number, s: number, t: number, o: { flap?: number; view?: 'below' | 'above'; bank?: number; col?: string; light?: number } = {}) {
  const f = o.flap ?? 0, below = o.view === 'below', col = o.col ?? MANTA_COL;
  c.save(); c.translate(x, y); c.rotate(o.bank ?? 0); c.scale(s, s);
  const tipY = -30 + 90 * f, face = below ? mixHex('#e2e8f0', col, 1 - (o.light ?? 1)) : col;
  // the far rim (the dark top seen past the wing edge when below)
  for (const side of [-1, 1]) {
    c.fillStyle = below ? col : face;
    c.beginPath(); c.moveTo(side * 40, -26); c.quadraticCurveTo(side * 180, -60 + tipY * 0.4, side * 330, tipY - 6);
    c.quadraticCurveTo(side * 200, 30 + tipY * 0.2, side * 40, 34); c.closePath(); c.fill();
    if (below) {
      c.fillStyle = face;
      c.beginPath(); c.moveTo(side * 40, -18); c.quadraticCurveTo(side * 180, -48 + tipY * 0.4, side * 318, tipY);
      c.quadraticCurveTo(side * 200, 34 + tipY * 0.2, side * 40, 34); c.closePath(); c.fill();
    }
  }
  c.fillStyle = face; c.beginPath(); c.ellipse(0, 4, 66, 40, 0, 0, TAU); c.fill();
  if (below) { // gill slits and dark belly spots
    c.strokeStyle = mixHex(face, col, 0.55); c.lineWidth = 3;
    for (const side of [-1, 1]) for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(side * (24 + k * 7), -8 + k * 6); c.lineTo(side * (36 + k * 7), -4 + k * 6); c.stroke(); }
    c.fillStyle = mixHex(face, col, 0.7);
    for (let k = 0; k < 7; k++) { c.beginPath(); c.arc((h01(k, 11) - 0.5) * 90, 8 + h01(k, 12) * 22, 3 + 3 * h01(k, 13), 0, TAU); c.fill(); }
  } else {
    c.fillStyle = 'rgba(225,236,250,0.26)';
    for (const side of [-1, 1]) { c.beginPath(); c.ellipse(side * 60, -10, 30, 10, side * 0.2, 0, TAU); c.fill(); }
  }
  // the mouth and the cephalic fins
  c.fillStyle = '#0a1020'; c.beginPath(); c.roundRect(-30, 26, 60, 12, 5); c.fill();
  c.fillStyle = below ? mixHex(face, col, 0.4) : col;
  for (const side of [-1, 1]) { c.beginPath(); c.ellipse(side * 40, 40, 9, 24, side * -0.25, 0, TAU); c.fill(); }
  c.strokeStyle = 'rgba(200,230,255,0.4)'; c.lineWidth = 2.5;
  for (const side of [-1, 1]) { c.beginPath(); c.moveTo(side * 40, -24); c.quadraticCurveTo(side * 180, -58 + tipY * 0.4, side * 328, tipY - 5); c.stroke(); }
  c.restore();
}

// ------------------------------------------------------------------ fish

export const NEON = [HEX.cyan, HEX.lime, HEX.pink, HEX.yellow, '#9f7bff', '#ff8a2a'];
/** A neon fish: the kit's fish with a glow on the glow layer. */
export function neonFish(c: C2, g: C2, x: number, y: number, s: number, col: string, dir: number, t: number, i: number, glow = 1) {
  fish(c, x, y, s, col, dir, t, i);
  if (glow > 0) { g.fillStyle = rgbaHex(col, 0.22 * glow); g.beginPath(); g.ellipse(x, y, s * 1.6, s * 1.0, 0, 0, TAU); g.fill(); }
}

// ------------------------------------------------------------------ the sea cucumber, counting its spots

/**
 * A fat cartoon sea cucumber on the sand, its front end (no face; Rai is the only face) nodding at the spot it counts.
 * `count` how many spots are counted so far (fractional pops the next), `hidden` spots underneath shown as dotted rings.
 */
export function seaCucumber(c: C2, g: C2, x: number, y: number, s: number, t: number, count: number, o: { roll?: number; hidden?: number } = {}) {
  const n = 9, seg: P[] = [];
  const nodT = count % 1, nod = Math.sin(clamp(nodT * 3) * PI) * 0.6;
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    seg.push({ x: x + (u - 0.5) * 560 * s, y: y - 18 * s * Math.sin(u * PI) + 6 * s * Math.sin(t * 2 + i) - (u > 0.85 ? nod * 40 * s * (u - 0.85) / 0.15 : 0) });
  }
  c.save();
  // tube feet
  c.strokeStyle = '#c9584a'; c.lineWidth = 6 * s; c.lineCap = 'round';
  for (let i = 0; i < 16; i++) { const u = i / 15, p = seg[Math.round(u * (n - 1))]!; const k = Math.sin(t * 6 + i) * 4 * s; c.beginPath(); c.moveTo(p.x + (i % 2) * 8 * s, p.y + 40 * s); c.lineTo(p.x + k + (i % 2) * 8 * s, p.y + 58 * s); c.stroke(); }
  // the body: one fat soft tube (dark belly, warm back, a sheen along the top), knobbly
  const tube = (dy: number, w: number, col: string) => {
    c.strokeStyle = col; c.lineWidth = w * s; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); seg.forEach((p, i) => (i ? c.lineTo(p.x, p.y + dy * s) : c.moveTo(p.x, p.y + dy * s))); c.stroke();
  };
  tube(12, 98, '#9a3a32'); tube(0, 92, '#e0604c'); tube(-16, 52, '#f07a5e'); tube(-26, 16, 'rgba(255,200,170,0.55)');
  c.fillStyle = '#c4483c';
  for (let i = 0; i < 22; i++) { const k = 0.05 + 0.9 * (i / 21), p = seg[Math.round(k * (n - 1))]!; c.beginPath(); c.arc(p.x + (h01(i, 42) - 0.5) * 60 * s, p.y - 40 * s + 6 * s * h01(i, 43), 7 * s, 0, TAU); c.fill(); }
  // the spots: counted ones light gold with their number
  const spots = [1, 2, 3, 4, 5, 6].map((k) => seg[k]!);
  spots.forEach((p, i) => {
    const sx = p.x + 6 * s, sy = p.y - 12 * s, lit = clamp(count - i);
    c.fillStyle = mixHex('#7a1e3a', HEX.gold, lit); c.beginPath(); c.ellipse(sx, sy, 15 * s, 11 * s, 0, 0, TAU); c.fill();
    if (lit > 0) {
      g.fillStyle = rgbaHex(HEX.gold, 0.4 * lit); g.beginPath(); g.arc(sx, sy, 26 * s, 0, TAU); g.fill();
      const pop = ease.outBack(clamp((count - i) * 2.5));
      c.save(); c.translate(sx, sy - 70 * s - 10 * s * (1 - pop)); c.scale(pop, pop);
      c.font = font(FAM.hook(), 52 * s); c.textAlign = 'center'; c.textBaseline = 'middle';
      c.lineWidth = 8 * s; c.strokeStyle = '#120d1d'; c.lineJoin = 'round'; c.strokeText(String(i + 1), 0, 0);
      c.fillStyle = HEX.yellow; c.fillText(String(i + 1), 0, 0);
      c.restore();
    }
  });
  // the spots it cannot see (underneath): dotted rings, and question marks when it tries to count them
  const hid = o.hidden ?? 0;
  if (hid > 0) for (let i = 0; i < 3; i++) {
    const p = seg[2 + i * 2]!, a = clamp(hid * 3 - i);
    if (a <= 0) continue;
    c.save(); c.globalAlpha = a; c.setLineDash([5 * s, 6 * s]); c.strokeStyle = HEX.bone; c.lineWidth = 3 * s;
    c.beginPath(); c.ellipse(p.x, p.y + 44 * s, 14 * s, 8 * s, 0, 0, TAU); c.stroke(); c.setLineDash([]);
    c.font = font(FAM.hook(), 40 * s); c.textAlign = 'center'; c.fillStyle = HEX.cyan; c.fillText('?', p.x, p.y + 100 * s);
    c.restore();
  }
  c.restore();
  return { head: seg[n - 1]! };
}

// ------------------------------------------------------------------ the waiting

/** An old rai stone half buried in the sand (a mound in front of its lower part), its heart dimly lit by `lit`. */
export function buriedStone(c: C2, g: C2, x: number, y: number, r: number, seed: number, lit: number, tilt = 0, garland = false) {
  stone(c, x, y, r, { seed, tilt, heart: lit > 0 ? HEX.pink : undefined, heartA: 0.75 * lit, glow: lit > 0 ? HEX.pink : undefined, glowA: 0.35 * lit });
  if (lit > 0) { g.fillStyle = rgbaHex(HEX.pink, 0.22 * lit); g.beginPath(); g.arc(x, y + r * 0.04, r * 0.55, 0, TAU); g.fill(); }
  if (garland) for (let j = 0; j < 7; j++) { const a = PI * (1.15 + 0.7 * j / 6); c.fillStyle = [HEX.pink, HEX.yellow, '#fff3f7', HEX.coral][j % 4]!; c.beginPath(); c.arc(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9, r * 0.09, 0, TAU); c.fill(); }
  // the sand heaped over its lower part
  const sg = c.createLinearGradient(0, y + r * 0.2, 0, y + r * 1.1);
  sg.addColorStop(0, '#d9c08a'); sg.addColorStop(1, '#b89a62');
  c.fillStyle = sg; c.beginPath(); c.ellipse(x, y + r * 0.78, r * 1.25, r * 0.5, 0, PI, TAU); c.lineTo(x + r * 1.25, y + r * 1.2); c.lineTo(x - r * 1.25, y + r * 1.2); c.closePath(); c.fill();
}

/** The broken raft: lashed logs, one snapped, frayed rope (the colour of the pendant's cord), the pole snapped, an empty rope cradle where a stone rode. */
export function brokenRaft(c: C2, x: number, y: number, s: number, t: number) {
  c.save(); c.translate(x, y); c.scale(s, s); c.rotate(-0.06);
  c.fillStyle = 'rgba(20,30,50,0.3)'; c.beginPath(); c.ellipse(0, 46, 300, 26, 0, 0, TAU); c.fill();
  for (let i = 0; i < 6; i++) { // logs, end-on rings showing
    const ly = -24 + i * 13, lx = (i === 4 ? 60 : 0) + 10 * h01(i, 7), len = i === 4 ? 150 : 270 - 30 * h01(i, 8);
    c.fillStyle = i % 2 ? '#6e5236' : '#7c5d3d'; c.beginPath(); c.roundRect(-len + lx, ly, len * 2 - (i === 2 ? 60 : 0), 22, 11); c.fill();
    c.fillStyle = '#a07a50'; c.beginPath(); c.ellipse(len + lx - (i === 2 ? 60 : 0), ly + 11, 6, 11, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(80,140,90,0.35)'; c.beginPath(); c.ellipse(-len * 0.4 + lx, ly + 6, 40, 5, 0, 0, TAU); c.fill();   // weed
  }
  // the snapped log's splinters
  c.strokeStyle = '#a07a50'; c.lineWidth = 3;
  for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(-90 + k * 5, 28); c.lineTo(-104 + k * 7, 18 + 6 * (k % 2)); c.stroke(); }
  // lashings, and the frayed ends floating up
  c.strokeStyle = '#c9a24a'; c.lineWidth = 5;
  for (const lx of [-180, 0, 170]) { c.beginPath(); c.moveTo(lx, -30); c.lineTo(lx + 8, 66); c.stroke(); }
  c.lineWidth = 2.5;
  for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(170, -30); c.quadraticCurveTo(176 + 10 * k, -60, 168 + 18 * k + 6 * Math.sin(t * 2 + k), -84 - 10 * k); c.stroke(); }
  // the empty cradle: a ring of rope where a stone was lashed
  c.lineWidth = 5; c.beginPath(); c.ellipse(-20, -40, 80, 26, 0, PI * 0.95, PI * 2.05); c.stroke();
  c.beginPath(); c.moveTo(-100, -38); c.quadraticCurveTo(-110, -70 + 5 * Math.sin(t * 2), -96, -96); c.stroke();
  // the pole, snapped in two, lying across
  c.strokeStyle = '#5a4026'; c.lineWidth = 16; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-320, 30); c.lineTo(-60, -6); c.stroke();
  c.beginPath(); c.moveTo(-30, -2); c.lineTo(120, 58); c.stroke();
  c.restore();
}

/** The outrigger canoe sunk in the sand, coral grown over it, fish living in it. */
export function sunkenCanoe(c: C2, x: number, y: number, s: number, t: number, g: C2) {
  c.save(); c.translate(x, y); c.scale(s, s); c.rotate(0.12);
  // the float half buried
  c.fillStyle = '#5a4a3a'; c.beginPath(); c.ellipse(-30, 70, 220, 14, 0, PI, TAU); c.fill();
  // the hull, tilted into the sand, its prow up
  c.fillStyle = '#5e4a36';
  c.beginPath(); c.moveTo(-300, 30); c.quadraticCurveTo(-200, 60, 0, 58); c.quadraticCurveTo(200, 56, 300, -40); c.quadraticCurveTo(220, 14, 0, 18); c.quadraticCurveTo(-200, 18, -300, 30); c.fill();
  c.strokeStyle = '#3a2c20'; c.lineWidth = 3; c.stroke();
  c.strokeStyle = '#7a644a'; c.lineWidth = 5; c.beginPath(); c.moveTo(-260, 28); c.quadraticCurveTo(0, 20, 270, -30); c.stroke();
  // a boom snapped off
  c.strokeStyle = '#4a3a2a'; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(-80, 24); c.lineTo(-100, 70); c.stroke();
  // sand drifted into it
  c.fillStyle = '#c9ad74'; c.beginPath(); c.ellipse(-120, 58, 180, 18, 0, PI, TAU); c.fill();
  c.restore();
  // coral grown over the hull, and the little family of fish that live in it
  for (let i = 0; i < 4; i++) coral(c, x + (-200 + 130 * i) * s, y + (30 - i * 14) * s, (40 + 18 * h01(i, 61)) * s, i + 1, t);
  for (let i = 0; i < 4; i++) {
    const u = ((t * 0.18 + i / 4) % 1), fx = x + (-160 + 320 * u) * s, fy = y - (10 + 18 * Math.sin(u * PI * 2 + i)) * s;
    fish(c, fx, fy, 9 * s, i % 2 ? HEX.yellow : '#ffffff', 1, t, i);
  }
  void g;
}

/** An anchor chain rising out of the sand into the murk (from a to b), its links catching the light. */
export function anchorChain(c: C2, a: P, b: P, link: number, col = '#6a4a34', fade?: { y0: number; y1: number }) {
  const d = Math.hypot(b.x - a.x, b.y - a.y), n = Math.floor(d / (link * 1.6)), ang = Math.atan2(b.y - a.y, b.x - a.x);
  c.save(); c.lineWidth = link * 0.32;
  for (let i = 0; i < n; i++) {
    const u = i / n, x = a.x + (b.x - a.x) * u, y = a.y + (b.y - a.y) * u + Math.sin(u * PI) * d * 0.06;
    const al = fade ? clamp((y - fade.y1) / (fade.y0 - fade.y1)) : 1;
    c.globalAlpha = al; c.strokeStyle = i % 2 ? col : mixHex(col, '#c08050', 0.3);
    c.beginPath(); c.ellipse(x, y, link, link * (i % 2 ? 0.25 : 0.55), ang, 0, TAU); c.stroke();
  }
  c.restore();
}

// ------------------------------------------------------------------ the wreck

/**
 * The trader's iron steamship, sunk upright in the sand: its bow towering, seen from low and ahead-left. (x, y) is the
 * foot of the stem in the sand, s the scale (s = 1: the bow about 860 px tall). The torch's beam lights the name where
 * `beamX` (0..1 along it) is. Returns the hawse (for the chain) and the name's ends (to aim the beam), in canvas px.
 */
export function wreckBow(c: C2, g: C2, x: number, y: number, s: number, t: number, o: { beamX?: number; beamA?: number } = {}): { hawse: P; name0: P; name1: P } {
  const sheer = (u: number): P => { const k = u; return { x: lerp2(-150, 1700, k, 420), y: lerp2(-860, -690, k, -770) }; };
  const stem = (u: number): P => ({ x: lerp2(0, -150, u, -10), y: lerp2(0, -860, u, -520) });
  const bottomY = (xx: number) => 40 + 0.03 * xx;
  c.save(); c.translate(x, y); c.scale(s, s);
  const hull = new Path2D();
  hull.moveTo(0, 0);
  for (let i = 1; i <= 20; i++) { const p = stem(i / 20); hull.lineTo(p.x, p.y); }
  for (let i = 1; i <= 30; i++) { const p = sheer(i / 30); hull.lineTo(p.x, p.y); }
  hull.lineTo(1700, bottomY(1700)); hull.lineTo(0, 0); hull.closePath();
  const hg = c.createLinearGradient(0, -860, 0, 60);
  hg.addColorStop(0, '#5a3a2a'); hg.addColorStop(0.12, '#4a3024'); hg.addColorStop(0.6, '#33241e'); hg.addColorStop(1, '#1e1814');
  c.fillStyle = hg; c.fill(hull);
  c.save(); c.clip(hull);
  // the flare: the bow's shoulder catches what light there is
  const fl = c.createRadialGradient(80, -620, 20, 80, -620, 520);
  fl.addColorStop(0, 'rgba(150,110,80,0.35)'); fl.addColorStop(1, 'rgba(150,110,80,0)');
  c.fillStyle = fl; c.fillRect(-200, -900, 900, 700);
  // strakes: plate rows following the sheer, butt joints staggered, rivets along every seam
  const rows = 7;
  const rowY = (k: number, xx: number) => { const u = clamp((xx + 150) / 1850), top = sheer(u).y; return top + (bottomY(xx) - top) * (k / rows); };
  c.strokeStyle = 'rgba(15,8,6,0.55)'; c.lineWidth = 4;
  for (let k = 1; k < rows; k++) { c.beginPath(); for (let xx = -160; xx <= 1700; xx += 40) { const yy = rowY(k, xx); xx === -160 ? c.moveTo(xx, yy) : c.lineTo(xx, yy); } c.stroke(); }
  for (let k = 0; k < rows; k++) for (let j = 0; j < 8; j++) {
    const bx = 60 + j * 230 + (k % 2) * 115; c.beginPath(); c.moveTo(bx, rowY(k, bx)); c.lineTo(bx + 4, rowY(k + 1, bx)); c.stroke();
  }
  c.fillStyle = 'rgba(220,150,95,0.4)';
  for (let k = 1; k < rows; k++) for (let xx = -120; xx < 1700; xx += 34) { c.beginPath(); c.arc(xx, rowY(k, xx) - 7, 3.2, 0, TAU); c.fill(); }
  // rust streaks bleeding down from the seams
  for (let i = 0; i < 46; i++) {
    const rx = -60 + 1700 * h01(i, 21), k = 1 + Math.floor(h01(i, 22) * (rows - 2)), ry = rowY(k, rx), len = 120 + 360 * h01(i, 23);
    const rg = c.createLinearGradient(0, ry, 0, ry + len);
    rg.addColorStop(0, `rgba(205,100,45,${0.18 + 0.22 * h01(i, 24)})`); rg.addColorStop(1, 'rgba(205,100,45,0)');
    const sw = 4 + 12 * h01(i, 25);
    c.fillStyle = rg; c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx + sw, ry); c.lineTo(rx + sw * 0.6 + 6 * h01(i, 26), ry + len); c.lineTo(rx + sw * 0.3, ry + len); c.closePath(); c.fill();
  }
  // portholes in a row under the sheer
  for (let j = 0; j < 7; j++) {
    const px = 520 + j * 160, py = rowY(1.6, px);
    c.fillStyle = '#7a5038'; c.beginPath(); c.arc(px, py, 27, 0, TAU); c.fill();
    c.fillStyle = '#0a1618'; c.beginPath(); c.arc(px, py, 19, 0, TAU); c.fill();
    if (j === 2) { g.save(); g.setTransform(c.getTransform()); g.fillStyle = 'rgba(120,220,200,0.14)'; g.beginPath(); g.arc(px, py, 36, 0, TAU); g.fill(); g.restore(); }
  }
  // weed hanging from the seams
  c.strokeStyle = 'rgba(70,120,80,0.65)'; c.lineCap = 'round';
  for (let i = 0; i < 16; i++) { const wx = 40 + 1500 * h01(i, 51), wy = rowY(1 + Math.floor(h01(i, 52) * 4), wx); c.lineWidth = 6; c.beginPath(); c.moveTo(wx, wy); c.quadraticCurveTo(wx + 12 * Math.sin(t * 1.2 + i), wy + 50, wx + 18 * Math.sin(t + i), wy + 90 + 50 * h01(i, 53)); c.stroke(); }
  c.restore();
  // the name, painted along the bow under the rust and flaking
  const n0 = sheer(0.12), n1 = sheer(0.55), nameY = (p: P) => ({ x: p.x, y: p.y + 118 });
  const a0 = nameY(n0), a1 = nameY(n1), ang = Math.atan2(a1.y - a0.y, a1.x - a0.x), nlen = Math.hypot(a1.x - a0.x, a1.y - a0.y);
  c.save(); c.translate(a0.x, a0.y); c.rotate(ang);
  c.font = font(FAM.monoB(), 92); c.textAlign = 'left'; c.textBaseline = 'middle';
  const tw = c.measureText('S.S. IRON HULL').width, ks = nlen / tw;
  c.scale(ks, 1);
  c.fillStyle = 'rgba(236,228,206,0.8)'; c.fillText('S.S. IRON HULL', 0, 0);
  c.fillStyle = 'rgba(60,36,26,0.8)';
  for (let i = 0; i < 80; i++) { c.beginPath(); c.arc(h01(i, 31) * tw, (h01(i, 32) - 0.5) * 78, 2.5 + 8 * h01(i, 33), 0, TAU); c.fill(); }
  if ((o.beamA ?? 0) > 0) {
    const bx = clamp(o.beamX ?? 0, -0.2, 1.2) * tw;
    g.save(); g.setTransform(c.getTransform());
    const lg = g.createRadialGradient(bx, 0, 0, bx, 0, 150);
    lg.addColorStop(0, rgbaHex('#ffe0a0', 0.11 * o.beamA!)); lg.addColorStop(1, rgbaHex('#ffe0a0', 0));
    g.fillStyle = lg; g.fillRect(bx - 160, -160, 320, 320);
    g.restore();
  }
  c.restore();
  // the stem's iron edge and the bulwark rail along the sheer
  c.strokeStyle = '#7a5038'; c.lineWidth = 14; c.lineCap = 'round';
  c.beginPath(); for (let i = 0; i <= 20; i++) { const p = stem(i / 20); i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y); } c.stroke();
  c.strokeStyle = 'rgba(255,190,130,0.3)'; c.lineWidth = 3;
  c.beginPath(); for (let i = 0; i <= 20; i++) { const p = stem(i / 20); i ? c.lineTo(p.x - 6, p.y) : c.moveTo(p.x - 6, p.y); } c.stroke();
  c.strokeStyle = '#6a4632'; c.lineWidth = 6;
  c.beginPath(); for (let i = 0; i <= 30; i++) { const p = sheer(i / 30); i ? c.lineTo(p.x, p.y - 56) : c.moveTo(p.x, p.y - 56); } c.stroke();
  for (let i = 0; i <= 30; i += 2) { const p = sheer(i / 30); c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x, p.y - 56); c.stroke(); }
  // the hawse pipe near the stem, the anchor hanging from it, a rust tear below
  const hx = 70, hy = -600;
  const tear = c.createLinearGradient(0, hy, 0, hy + 420); tear.addColorStop(0, 'rgba(210,100,40,0.55)'); tear.addColorStop(1, 'rgba(210,100,40,0)');
  c.fillStyle = tear; c.fillRect(hx - 22, hy, 44, 420);
  c.fillStyle = '#1a100c'; c.beginPath(); c.ellipse(hx, hy, 32, 24, 0.1, 0, TAU); c.fill();
  c.strokeStyle = '#6a4030'; c.lineWidth = 8; c.stroke();
  c.save(); c.translate(hx + 10, hy + 150); c.rotate(0.06);
  c.strokeStyle = '#5a3a28'; c.lineWidth = 22;
  c.beginPath(); c.moveTo(0, -120); c.lineTo(0, 80); c.stroke();
  c.beginPath(); c.arc(0, 0, 96, 0.2 * PI, 0.8 * PI); c.stroke();
  c.lineWidth = 18; c.beginPath(); c.moveTo(-58, -86); c.lineTo(58, -86); c.stroke();
  c.restore();
  // the sand heaped against the hull where it sank
  c.fillStyle = '#6a6040'; c.beginPath(); c.moveTo(-300, 70); c.quadraticCurveTo(300, -10, 1800, 60); c.lineTo(1800, 200); c.lineTo(-300, 200); c.closePath(); c.fill();
  const M = c.getTransform();
  c.restore();
  const inv = c.getTransform().inverse(), toC = (lx: number, ly: number): P => { const q = inv.transformPoint(M.transformPoint(new DOMPoint(lx, ly))); return { x: q.x, y: q.y }; };
  return { hawse: toC(hx, hy), name0: toC(a0.x, a0.y), name1: toC(a1.x, a1.y) };
}
/** A quadratic through a, control m, b at u. */
function lerp2(a: number, b: number, u: number, m: number) { return (1 - u) * (1 - u) * a + 2 * (1 - u) * u * m + u * u * b; }

/** The wreck's foredeck from above and ahead: iron plates, a bent rail, the round hatch open on the dark hold. */
export function wreckDeck(c: C2, g: C2, t: number, hatch: P, hr: number) {
  // the deck: rusted plates in perspective
  const dg = c.createLinearGradient(0, H * 0.25, 0, H);
  dg.addColorStop(0, '#3a342c'); dg.addColorStop(1, '#5e4a38');
  c.fillStyle = dg; c.beginPath(); c.moveTo(-50, H * 0.42); c.lineTo(W + 50, H * 0.3); c.lineTo(W + 50, H + 10); c.lineTo(-50, H + 10); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(15,10,8,0.5)'; c.lineWidth = 3;
  for (let k = 0; k < 12; k++) { const u = k / 11, y0 = H * 0.42 + (H * 0.6) * u * u, y1 = H * 0.3 + (H * 0.72) * u * u; c.beginPath(); c.moveTo(-50, y0); c.lineTo(W + 50, y1); c.stroke(); }
  for (let k = 0; k < 14; k++) { const xx = -200 + k * 170; c.beginPath(); c.moveTo(xx + 300, H * 0.36); c.lineTo(xx - 200, H + 10); c.stroke(); }
  for (let i = 0; i < 30; i++) { // rust blooms
    const rx = h01(i, 71) * W, ry = H * 0.4 + h01(i, 72) * H * 0.6, rr = 30 + 90 * h01(i, 73);
    c.save(); c.translate(rx, ry); c.scale(1, 0.35);
    const rg = c.createRadialGradient(0, 0, 0, 0, 0, rr); rg.addColorStop(0, 'rgba(170,80,36,0.3)'); rg.addColorStop(1, 'rgba(170,80,36,0)');
    c.fillStyle = rg; c.fillRect(-rr, -rr, 2 * rr, 2 * rr); c.restore();
  }
  // the bent rail along the far edge
  c.strokeStyle = '#5a3a2a'; c.lineWidth = 7; c.lineCap = 'round';
  c.beginPath(); for (let k = 0; k <= 20; k++) { const xx = -50 + k * 100, yy = H * 0.42 - (H * 0.12) * (k / 20) - 70 + (k > 12 && k < 16 ? 30 * Math.sin((k - 12) / 4 * PI) : 0); k ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke();
  for (let k = 0; k <= 20; k += 2) { const xx = -50 + k * 100, yy = H * 0.42 - (H * 0.12) * (k / 20); c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx, yy - 70); c.stroke(); }
  // a bollard with the old hawser coiled round it
  c.fillStyle = '#4a3226'; c.beginPath(); c.ellipse(1620, 640, 46, 18, 0, 0, TAU); c.fill(); c.fillRect(1574, 560, 92, 80);
  c.fillStyle = '#6a4632'; c.beginPath(); c.ellipse(1620, 560, 46, 18, 0, 0, TAU); c.fill();
  c.strokeStyle = '#9a7a4a'; c.lineWidth = 9; for (let k = 0; k < 4; k++) { c.beginPath(); c.ellipse(1620, 650 + k * 6, 80 + k * 12, 26 + k * 4, 0, 0, TAU); c.stroke(); }
  // the hatch: a raised riveted coaming round the dark hold, its lid thrown back
  const { x, y } = hatch;
  // by the hatch, one stone too perfect: machine-round, no barnacles, no thickness to speak of (the hold is full of them)
  c.save(); c.translate(x + hr * 1.45, y + hr * 0.5); c.scale(1, 0.42);
  c.fillStyle = '#8a8a86'; c.beginPath(); c.arc(6, 8, hr * 0.42, 0, TAU); c.fill();
  c.fillStyle = '#b4b4ae'; c.beginPath(); c.arc(0, 0, hr * 0.42, 0, TAU); c.arc(0, 0, hr * 0.11, 0, TAU, true); c.fill('evenodd');
  c.restore();
  c.fillStyle = '#3a2a20'; c.beginPath(); c.ellipse(x + hr * 0.15, y - hr * 0.55, hr * 1.05, hr * 0.42, -0.1, PI, TAU); c.fill();   // the lid, open
  c.strokeStyle = '#6a4632'; c.lineWidth = hr * 0.06; c.stroke();
  c.fillStyle = '#5a3c2a'; c.beginPath(); c.ellipse(x, y + hr * 0.08, hr * 1.12, hr * 0.46, 0, 0, TAU); c.fill();   // the coaming's side
  c.fillStyle = '#040608'; c.beginPath(); c.ellipse(x, y, hr, hr * 0.4, 0, 0, TAU); c.fill();                    // the hold
  c.strokeStyle = '#8a5a3a'; c.lineWidth = hr * 0.08; c.beginPath(); c.ellipse(x, y, hr, hr * 0.4, 0, 0, TAU); c.stroke();
  c.fillStyle = 'rgba(240,170,110,0.6)';
  for (let k = 0; k < 18; k++) { const a = (k / 18) * TAU; c.beginPath(); c.arc(x + Math.cos(a) * hr * 1.06, y + Math.sin(a) * hr * 0.43 + hr * 0.04, hr * 0.022, 0, TAU); c.fill(); }
  void g; void t;
}

/** The murk: a teal fog that thickens with distance (upwards in the frame) over everything drawn so far. */
export function murk(c: C2, a: number, col = '#0b2f33', top = 0, bottom = H) {
  if (a <= 0) return;
  const gr = c.createLinearGradient(0, top, 0, bottom);
  gr.addColorStop(0, rgbaHex(col, Math.min(1, a))); gr.addColorStop(1, rgbaHex(col, a * 0.35));
  c.fillStyle = gr; c.fillRect(0, 0, W, H);
}

// ------------------------------------------------------------------ STONE in bubbles that pop

/** Grid-sample a word's ink into bubble centres (done once, in init). */
export function bubbleLetters(text: string, size: number, cx: number, cy: number, step: number): { x: number; y: number; r: number; k: number }[] {
  const cw = Math.ceil(size * text.length * 0.9 + 40), ch = Math.ceil(size * 1.3);
  const oc = new OffscreenCanvas(cw, ch), g = oc.getContext('2d')!;
  g.font = font(FAM.hook(), size); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff';
  g.fillText(text, cw / 2, ch / 2);
  const data = g.getImageData(0, 0, cw, ch).data, out: { x: number; y: number; r: number; k: number }[] = [];
  let i = 0;
  for (let y = 0; y < ch; y += step) for (let x = (Math.floor(y / step) % 2) * step * 0.5; x < cw; x += step) {
    const jx = (h01(i, 1) - 0.5) * step * 0.3, jy = (h01(i, 2) - 0.5) * step * 0.3;
    const px = Math.round(x + jx), py = Math.round(y + jy);
    if (px >= 0 && py >= 0 && px < cw && py < ch && data[(py * cw + px) * 4 + 3]! > 128) out.push({ x: cx - cw / 2 + px, y: cy - ch / 2 + py, r: step * (0.42 + 0.14 * h01(i, 3)), k: (px / cw) });
    i++;
  }
  return out;
}
/** The bubbles rise from below into the word from tIn, wobble, and pop left to right from tPop over `popDur`. */
export function bubbleWord(c: C2, g: C2, pts: { x: number; y: number; r: number; k: number }[], t: number, tIn: number, tPop: number, popDur = 0.5) {
  pts.forEach((p, i) => {
    const arrive = tIn + 0.35 * p.k + 0.1 * h01(i, 9), u = clamp((t - arrive + 0.45) / 0.45);
    if (u <= 0) return;
    const popAt = tPop + popDur * p.k + 0.06 * h01(i, 10), age = t - popAt;
    const x = p.x + 3 * Math.sin(t * 5 + i), y = p.y + (1 - ease.outCubic(u)) * 260 + 2 * Math.cos(t * 4 + i * 1.3);
    if (age < 0) {
      c.strokeStyle = `rgba(225,248,255,${0.9 * u})`; c.lineWidth = Math.max(1.5, p.r * 0.18);
      c.beginPath(); c.arc(x, y, p.r * (0.6 + 0.4 * u), 0, TAU); c.stroke();
      c.fillStyle = `rgba(255,255,255,${0.75 * u})`; c.beginPath(); c.arc(x - p.r * 0.35, y - p.r * 0.35, p.r * 0.2, 0, TAU); c.fill();
      g.fillStyle = `rgba(150,230,255,${0.12 * u})`; g.beginPath(); g.arc(x, y, p.r * 1.3, 0, TAU); g.fill();
    } else if (age < 0.22) { // the pop: a flash ring and four flecks
      const k = age / 0.22;
      c.strokeStyle = `rgba(255,255,255,${0.9 * (1 - k)})`; c.lineWidth = 2;
      c.beginPath(); c.arc(x, y, p.r * (1 + 0.8 * k), 0, TAU); c.stroke();
      for (let j = 0; j < 4; j++) { const a = j * PI / 2 + 0.4; c.beginPath(); c.moveTo(x + Math.cos(a) * p.r * (1.1 + k), y + Math.sin(a) * p.r * (1.1 + k)); c.lineTo(x + Math.cos(a) * p.r * (1.5 + 1.4 * k), y + Math.sin(a) * p.r * (1.5 + 1.4 * k)); c.stroke(); }
      if (h01(i, 11) < 0.15) star4(g, x, y, p.r * (1 - k), '#fff6c8');
    }
  });
}

// ------------------------------------------------------------------ the pebble pendant

/** The little holed pebble on its cord (held, or hanging): the cord as a loop above it. */
export function pebbleOnCord(c: C2, g: C2, x: number, y: number, s: number, t: number, glow = 0, loop = 1) {
  c.save(); c.strokeStyle = '#c9a24a'; c.lineWidth = 2 * s;
  c.beginPath(); c.ellipse(x, y - 34 * s * loop, 16 * s, 34 * s * loop, 0.05 * Math.sin(t * 2), 0, TAU); c.stroke();
  c.fillStyle = HEX.stone; c.beginPath(); c.arc(x, y, 9 * s, 0, TAU); c.arc(x, y, 3.4 * s, 0, TAU, true); c.fill('evenodd');
  c.strokeStyle = '#8f8676'; c.lineWidth = 1.2 * s; c.beginPath(); c.arc(x, y, 9 * s, 0, TAU); c.stroke();
  c.restore();
  if (glow > 0) { g.fillStyle = rgbaHex(HEX.pink, 0.3 * glow); g.beginPath(); g.arc(x, y, 13 * s, 0, TAU); g.fill(); }
}

export { reed };
