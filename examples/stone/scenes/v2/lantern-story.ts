// v2 `lantern`: the story Rai's heart projects onto the dark water, each an ordinary 1920x1080 frame (heartLantern
// fits its height into the circle, so everything that matters sits within 540 px of the centre). Silhouettes, never
// costume detail; the stone in the story is a plain disc (Rai is the only face, and it is her past).
//   quarry   Palau's rock islands at sunrise: a limestone cliff, a disc's outline glowing in it, the cutters with shell
//            adzes on a ledge, chips and grit flying on the strikes; the stubborn crew levering the disc free
//   voyage   night on a deep blue swell: the double canoe with the stone lashed on its deck, the stars drawing 400 KM;
//            the wide ocean with the star route from PALAU to YAP
//   lash     ropes snapping tight over the stone on the deck
//   shoulder the men on the moonlit beach shouldering the long pole
//   pole     the pole sliding through the hole in the stone's heart
//   storm    clouds off the reef, rain, the lightning; the canoe heeling, the stone sliding off; the stone sinking
import { W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import { clamp, ease, lerp } from '../../engine/util';
import { h01 } from '../_rai';
import { FAM, TAU, rgbaHex, mixHex, person, stone, textPointsAt, type Pose, type Emote } from '../_motifs';

type C2 = CanvasRenderingContext2D;
const SIL = '#24141c';

function sky(c: C2, stops: [number, string][], h = H) {
  const g = c.createLinearGradient(0, 0, 0, h);
  for (const [o, col] of stops) g.addColorStop(o, col);
  c.fillStyle = g; c.fillRect(0, 0, W, h);
}

/** A Palau rock island: a mushroom of limestone, undercut by the sea at its waterline, capped with jungle. */
function rockIsland(c: C2, x: number, y: number, w: number, h: number, col: string, top: string) {
  c.fillStyle = col;
  c.beginPath(); c.moveTo(x - w * 0.22, y); c.quadraticCurveTo(x - w * 0.18, y - h * 0.18, x - w * 0.4, y - h * 0.42);
  c.lineTo(x + w * 0.42, y - h * 0.42); c.quadraticCurveTo(x + w * 0.2, y - h * 0.18, x + w * 0.24, y); c.closePath(); c.fill();
  c.fillStyle = top;
  c.beginPath(); c.moveTo(x - w * 0.5, y - h * 0.4);
  for (let i = 0; i <= 8; i++) { const a = Math.PI + (i / 8) * Math.PI; c.lineTo(x + Math.cos(a) * w * 0.5, y - h * 0.4 + Math.sin(a) * h * (0.55 + 0.06 * Math.sin(i * 2.7))); }
  c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - w * 0.3, y - 3); c.lineTo(x + w * 0.3, y - 3); c.stroke();
}

/** A swell of sea from y down, with moving lines. */
function swell(c: C2, t: number, y: number, top: string, bot: string, line: string, rough = 1) {
  const g = c.createLinearGradient(0, y, 0, H);
  g.addColorStop(0, top); g.addColorStop(1, bot);
  c.fillStyle = g; c.fillRect(0, y, W, H - y);
  c.strokeStyle = line; c.lineWidth = 2.5;
  for (let j = 0; j < 12; j++) {
    const v = (j + 1) / 13, yy = y + Math.pow(v, 1.5) * (H - y);
    c.beginPath();
    for (let x = 0; x <= W; x += 40) { const w = yy + rough * (4 + 10 * v) * Math.sin(x * (0.01 - 0.004 * v) + t * (1.2 + v) + j * 1.7); x ? c.lineTo(x, w) : c.moveTo(x, w); }
    c.stroke();
  }
}

/** A person in silhouette holding a shell adze (raised, or struck down), feet at (x, y). */
function cutter(c: C2, x: number, y: number, h: number, t: number, strike: number, seed: number, flip = false, emote?: Emote, emoteT0?: number) {
  const pose: Pose = strike > 0.5 ? 'point' : 'cheer', u = h / 100, f = flip ? -1 : 1;
  person(c, x, y, h, pose, { col: SIL, t, seed, flip, emote, emoteT0 });
  const hx = x + f * (pose === 'point' ? 40 : 22) * u, hy = y + (pose === 'point' ? -84 : -104) * u;
  c.save(); c.translate(hx, hy); c.rotate(f * (pose === 'point' ? 0.9 : -0.6));
  c.strokeStyle = '#5a3a2a'; c.lineWidth = 3.2 * u; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -22 * u); c.stroke();
  c.fillStyle = '#f2e6cf'; c.beginPath(); c.ellipse(f * 5 * u, -24 * u, 9 * u, 5 * u, 0.3 * f, 0, TAU); c.fill();   // the shell blade
  c.restore();
}

/** Chips and grit thrown from a strike at time ts. */
function chips(c: C2, x: number, y: number, t: number, ts: number, s = 1, seed = 1) {
  const d = t - ts;
  if (d < 0 || d > 0.7) return;
  for (let i = 0; i < 16; i++) {
    const a = -Math.PI * (0.05 + 0.9 * h01(i, seed, 1)), v = (160 + 380 * h01(i, seed, 2)) * s;
    const px = x + Math.cos(a) * v * d, py = y + Math.sin(a) * v * d + 900 * s * d * d, r = (2 + 6 * h01(i, seed, 3)) * s;
    c.fillStyle = rgbaHex(i % 3 ? '#f4ead2' : '#c9b48a', 1 - d / 0.7);
    c.save(); c.translate(px, py); c.rotate(d * 9 + i); c.fillRect(-r, -r * 0.6, r * 2, r * 1.2); c.restore();
  }
  c.fillStyle = rgbaHex('#f4ead2', 0.4 * (1 - d / 0.7));
  c.beginPath(); c.arc(x, y, 30 * s * (0.5 + d), 0, TAU); c.fill();
}

// ------------------------------------------------------------------ the quarry on Palau

export interface QuarryOpts { strikes: number[]; free?: number; pop?: number; cheer?: number; zoom?: number; zx?: number; zy?: number; pan?: number }
/** The limestone cliff at sunrise with the disc being cut out of it (`free` 0..1 levers it out; `pop` the moment). */
export function quarry(c: C2, t: number, o: QuarryOpts) {
  c.save();
  if (o.zoom) { c.translate(o.zx ?? W / 2, o.zy ?? H / 2); c.scale(o.zoom, o.zoom); c.translate(-(o.zx ?? W / 2), -(o.zy ?? H / 2)); }
  c.translate(-(o.pan ?? 0), 0);
  sky(c, [[0, '#4a3478'], [0.35, '#c06a86'], [0.55, '#ffa070'], [0.62, '#ffd890']], 700);
  const sun = c.createRadialGradient(1300, 690, 10, 1300, 690, 260);
  sun.addColorStop(0, 'rgba(255,246,200,1)'); sun.addColorStop(0.3, 'rgba(255,214,140,0.7)'); sun.addColorStop(1, 'rgba(255,170,120,0)');
  c.fillStyle = sun; c.fillRect(1040, 430, 520, 270);
  rockIsland(c, 1560, 690, 300, 230, '#a07a96', '#6a7a6a');
  rockIsland(c, 1290, 690, 160, 130, '#b0889a', '#7a8a72');
  rockIsland(c, 1760, 690, 120, 90, '#b8909c', '#7a8a72');
  swell(c, t, 690, '#e8a080', '#6a4a7a', 'rgba(255,220,190,0.35)', 0.6);
  // the cliff: a pale limestone face, strata, the jungle on top, the ledge at its foot
  const cliff = c.createLinearGradient(300, 0, 1150, 0);
  cliff.addColorStop(0, '#c9b49c'); cliff.addColorStop(0.7, '#efe2c8'); cliff.addColorStop(1, '#f6e8cc');
  c.fillStyle = cliff;
  c.beginPath(); c.moveTo(240, 900); c.lineTo(250, 250); c.quadraticCurveTo(600, 200, 1120, 260); c.lineTo(1150, 520); c.quadraticCurveTo(1110, 700, 1180, 900); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(150,120,100,0.35)'; c.lineWidth = 3;
  for (let k = 0; k < 9; k++) { const y = 300 + k * 58; c.beginPath(); c.moveTo(260, y + 10 * Math.sin(k)); c.quadraticCurveTo(700, y - 12, 1130, y + 8 * Math.cos(k)); c.stroke(); }
  c.fillStyle = '#4a6a4a';
  c.beginPath(); c.moveTo(240, 270); for (let i = 0; i <= 24; i++) c.lineTo(240 + i * 37, 248 - 18 * Math.abs(Math.sin(i * 0.9)) - 10 * h01(i, 5)); c.lineTo(1130, 280); c.closePath(); c.fill();
  c.fillStyle = '#5a7a52'; for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(300 + i * 100, 240 - 10 * Math.sin(i * 2.1), 26 + 8 * h01(i, 6), Math.PI, TAU); c.fill(); }
  // the quarry niche, and the disc in it: its outline glowing, then levered out
  const dx = 760, dy = 560, r = 170, free = clamp(o.free ?? 0);
  c.fillStyle = 'rgba(120,90,70,0.45)'; c.beginPath(); c.ellipse(dx, dy + 10, r * 1.25, r * 1.2, 0, 0, TAU); c.fill();
  if (free < 0.02) {
    c.strokeStyle = rgbaHex('#ffcf6b', 0.7 + 0.3 * Math.sin(t * 5)); c.lineWidth = 7;
    c.beginPath(); c.arc(dx, dy, r, 0, TAU); c.stroke();
    c.beginPath(); c.arc(dx, dy, r * 0.27, 0, TAU); c.stroke();
  }
  c.fillStyle = '#d8c6a4'; c.fillRect(220, 820, 1000, 30);   // the ledge
  c.fillStyle = '#a8916e'; c.fillRect(220, 850, 1000, 230);
  if (free >= 0.02) { // out of the rock: tipping forward and down onto the ledge
    const k = ease.outBack(free, 1.2);
    stone(c, dx + 40 * k, dy + (820 - r * 0.96 - dy) * k, r, { tilt: 0.25 * (1 - k), seed: 4 });
  }
  // the scaffold and the crew
  c.strokeStyle = '#3a2418'; c.lineWidth = 6;
  for (const x of [480, 1040]) { c.beginPath(); c.moveTo(x, 820); c.lineTo(x, 380); c.stroke(); }
  c.beginPath(); c.moveTo(470, 470); c.lineTo(1050, 470); c.stroke();
  const st = o.strikes;
  const hit = (seed: number) => { const last = st.filter((x) => x <= t).pop(); return last !== undefined && t - last < 0.16 && (st.indexOf(last) + seed) % 2 === 0 ? 1 : 0; };
  if ((o.free ?? 0) < 0.02) {
    cutter(c, 560, 470, 170, t, hit(0), 1, false);
    cutter(c, 960, 470, 165, t, hit(1), 2, true);
    cutter(c, 640, 820, 200, t, hit(1), 3, false);
    cutter(c, 900, 820, 190, t, hit(0), 4, true);
    for (let i = 0; i < st.length; i++) chips(c, i % 2 ? 640 : 900, i % 2 ? 360 : 700, t, st[i]!, 1, i);
  } else { // the stubborn crew: heaving on ropes and a lever, then cheering when she comes free
    const cheer = (o.cheer ?? 0) > 0;
    const pull = 0.06 * Math.sin(t * 12);
    for (let i = 0; i < 4; i++) {
      const x = 360 + i * 70 + (cheer ? 0 : -10 * Math.sin(t * 12 + i));
      person(c, x, 820, 175, cheer ? 'cheer' : 'hands', { col: SIL, t, seed: i + 10, flip: true, headTilt: cheer ? 0 : 0.3 + pull, emote: i === 1 ? (cheer ? 'joy' : 'sweat') : i === 3 && !cheer ? 'anger' : undefined, emoteT0: (o.pop ?? 0) - 0.4 });
    }
    if (!cheer) { c.strokeStyle = '#c9a070'; c.lineWidth = 4; c.beginPath(); c.moveTo(370, 700); c.quadraticCurveTo(560, 640 + 10 * Math.sin(t * 12), dx - 40, dy - 40); c.stroke(); }
    person(c, 1080, 820, 180, cheer ? 'cheer' : 'carry', { col: SIL, t, seed: 20, flip: true, emote: cheer ? '!' : undefined, emoteT0: o.pop });
    if (o.pop !== undefined && t - o.pop >= 0 && t - o.pop < 0.6) { // dust where she lands
      const d = (t - o.pop) / 0.6;
      for (let i = 0; i < 10; i++) { const a = Math.PI * (1 + i / 9); c.fillStyle = rgbaHex('#f4ead2', 0.7 * (1 - d)); c.beginPath(); c.arc(dx + 40 + Math.cos(a) * (120 + 200 * d), 815 + Math.sin(a) * 30 * d, 26 * (1 - d * 0.5), 0, TAU); c.fill(); }
    }
  }
  c.restore();
}

// ------------------------------------------------------------------ the voyage

/** A double canoe with a platform between the hulls, a crab-claw sail, the stone standing on its deck. */
export function canoeRaft(c: C2, x: number, y: number, s: number, t: number, o: { tilt?: number; paddlers?: boolean; stoneDx?: number; stoneTilt?: number; noStone?: boolean; sail?: boolean } = {}) {
  c.save(); c.translate(x, y); c.rotate(o.tilt ?? 0); c.scale(s, s);
  c.fillStyle = SIL;
  for (const dy of [0, 26]) { c.beginPath(); c.moveTo(-260, -20 + dy); c.quadraticCurveTo(-220, 12 + dy, -120, 14 + dy); c.lineTo(140, 14 + dy); c.quadraticCurveTo(240, 12 + dy, 270, -24 + dy); c.quadraticCurveTo(200, -2 + dy, 0, -2 + dy); c.quadraticCurveTo(-200, -2 + dy, -260, -20 + dy); c.fill(); }
  c.fillRect(-180, -14, 360, 12);   // the platform
  if (o.sail !== false) {
    c.strokeStyle = SIL; c.lineWidth = 7; c.beginPath(); c.moveTo(-60, -10); c.lineTo(-40, -330); c.stroke();
    c.fillStyle = 'rgba(60,40,50,0.85)'; c.beginPath(); c.moveTo(-40, -330); c.quadraticCurveTo(80, -230, 120, -40); c.lineTo(-50, -60); c.closePath(); c.fill();
  }
  if (!o.noStone) stone(c, 70 + (o.stoneDx ?? 0), -14 - 92, 92, { tilt: o.stoneTilt ?? 0, seed: 4 });
  if (o.paddlers !== false) for (const px of [-200, -140, 190]) person(c, px, -12, 120, 'paddle', { col: SIL, t, seed: px });
  c.restore();
}

/** Night on the open ocean: stars, the swell, the canoe; the stars draw 400 KM (`stars` 0..1); `wide` pulls back to
 *  the whole crossing with the star route from PALAU to YAP. */
export function voyage(c: C2, t: number, o: { stars?: number; wide?: number; textPts?: [number, number][]; storm?: number; flash?: number } = {}) {
  const wide = clamp(o.wide ?? 0), storm = clamp(o.storm ?? 0);
  sky(c, [[0, mixHex('#0c1240', '#06070f', storm)], [0.6, mixHex('#1c2a6a', '#121428', storm)], [0.72, mixHex('#2a4a8a', '#1a2030', storm)]], 780);
  // stars, twinkling; some of them fly into the letters
  const pts = o.textPts ?? [], sp = clamp(o.stars ?? 0);
  for (let i = 0; i < 380; i++) {
    const x0 = h01(i, 31) * W, y0 = h01(i, 32) * 640, tw = 0.5 + 0.5 * Math.sin(t * (1 + 3 * h01(i, 33)) + i);
    let x = x0, y = y0, big = 1;
    if (i < pts.length && sp > 0) { const k = ease.inOutCubic(clamp(sp * 1.4 - h01(i, 34) * 0.4)); x = lerp(x0, pts[i]![0], k); y = lerp(y0, pts[i]![1], k); big = 1 + 0.8 * k; }
    c.fillStyle = `rgba(255,248,225,${(0.35 + 0.6 * tw) * (1 - storm)})`;
    c.beginPath(); c.arc(x, y, (0.8 + 1.4 * h01(i, 35)) * big, 0, TAU); c.fill();
  }
  if (sp > 0.55) { // the letters themselves, written faintly in the starlight
    c.save(); c.font = font(FAM.hook(), 160); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.shadowColor = 'rgba(255,230,170,0.9)'; c.shadowBlur = 24; c.fillStyle = `rgba(255,236,190,${0.22 * clamp((sp - 0.55) / 0.45)})`; c.fillText('400 KM', 960, 330); c.restore();
  }
  if (sp > 0.6) { // the letters joined up faintly
    c.strokeStyle = `rgba(255,236,190,${0.5 * (sp - 0.6) / 0.4})`; c.lineWidth = 1.6;
    c.beginPath(); for (let i = 0; i + 1 < pts.length; i++) { const a = pts[i]!, b = pts[i + 1]!; if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 34) { c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); } } c.stroke();
  }
  // the moon
  if (storm < 1) { c.fillStyle = rgbaHex('#fff4d6', 1 - storm); c.beginPath(); c.arc(1430, 200, 44, 0, TAU); c.fill(); }
  const hz = 760;
  if (wide > 0) { // the crossing: an island at each end, the star route arcing over, the canoe on it
    c.save(); c.globalAlpha = wide;
    rockIsland(c, 470, hz, 150, 90, '#2a2a4a', '#24304a');
    c.fillStyle = '#2a2a4a'; c.beginPath(); c.ellipse(1460, hz, 150, 34, 0, Math.PI, TAU); c.fill();
    for (let i = 0; i < 3; i++) { c.fillStyle = '#2a2a4a'; c.beginPath(); c.moveTo(1400 + i * 50, hz - 20); c.lineTo(1400 + i * 50 + 6, hz - 90); c.lineTo(1410 + i * 50, hz - 20); c.fill(); c.beginPath(); c.arc(1404 + i * 50, hz - 92, 16, 0, TAU); c.fill(); }
    c.setLineDash([3, 14]); c.strokeStyle = 'rgba(255,236,190,0.85)'; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(470, hz - 110); c.quadraticCurveTo(965, 240, 1460, hz - 110); c.stroke(); c.setLineDash([]);
    c.font = font(FAM.monoB(), 34); c.textAlign = 'center'; c.fillStyle = 'rgba(255,236,190,0.95)';
    c.fillText('PALAU', 470, hz - 150); c.fillText('YAP', 1460, hz - 150);
    c.restore();
  }
  swell(c, t, hz, mixHex('#1a3a7a', '#141a30', storm), mixHex('#0a1438', '#05070f', storm), `rgba(160,200,255,${0.25 + 0.2 * storm})`, 1 + 3 * storm);
  // the canoe with the stone on its deck: close on the swell, or tiny on the route when we pull back
  const cs = lerp(0.95, 0.22, wide), cx = lerp(980, 470 + (1460 - 470) * 0.42, wide), cy = lerp(880, hz + 8, wide) + 10 * Math.sin(t * 1.4);
  canoeRaft(c, cx, cy, cs, t, { tilt: 0.04 * Math.sin(t * 1.2) });
  if ((o.flash ?? 0) > 0) { c.fillStyle = `rgba(230,236,255,${0.85 * o.flash!})`; c.fillRect(0, 0, W, H); }
}

/** The 400 KM written in stars: points for voyage's `textPts`. */
export const starText = () => textPointsAt('400 KM', FAM.hook(), 160, 960, 330, 300, 7);

// ------------------------------------------------------------------ lashing, the pole, the storm

/** Close on the deck: ropes thrown over the stone snap tight (`tight` 0..1). */
export function lash(c: C2, t: number, tight: number) {
  sky(c, [[0, '#0c1240'], [0.7, '#1c2a6a'], [1, '#2a4a8a']]);
  c.fillStyle = '#fff4d6'; c.beginPath(); c.arc(1380, 230, 50, 0, TAU); c.fill();
  swell(c, t, 840, '#1a3a7a', '#0a1438', 'rgba(160,200,255,0.3)', 1.2);
  c.fillStyle = SIL; c.fillRect(200, 820, 1520, 60);   // the deck
  for (let i = 0; i < 14; i++) { c.fillStyle = i % 2 ? '#3a2430' : '#30202a'; c.fillRect(200 + i * 110, 822, 104, 12); }
  stone(c, 960, 820 - 330, 330, { seed: 4 });
  // two ropes over the top of the stone and down its face either side of the hole, slack, then snapped tight
  const k = ease.outBack(clamp(tight), 2.2);
  c.strokeStyle = '#d8b07a'; c.lineCap = 'round'; c.lineWidth = 13;
  for (const sx of [-1, 1]) {
    const xt = 960 + sx * 150, xb = 960 + sx * 175, sag = (1 - k) * 120 * sx;
    c.beginPath(); c.moveTo(xt - sx * 40, 172); c.quadraticCurveTo(xt + sx * 40 + sag, 480, xb, 822); c.stroke();
    c.beginPath(); c.moveTo(xb, 822); c.lineTo(xb + sx * 160, 838 - 30 * (1 - k)); c.stroke();   // to the cleat
  }
  c.lineWidth = 11; c.beginPath(); c.moveTo(700, 610 + 40 * (1 - k)); c.quadraticCurveTo(960, 640 + 90 * (1 - k), 1220, 610 + 40 * (1 - k)); c.stroke();   // a band round her waist
  for (const x of [520, 1400]) person(c, x, 820, 300, 'hands', { col: SIL, t, seed: x, flip: x > 960, headTilt: 0.2 });
  if (tight > 0.9 && tight < 1.2) { c.strokeStyle = 'rgba(255,240,210,0.8)'; c.lineWidth = 4; for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.3; c.beginPath(); c.moveTo(960 + Math.cos(a) * 360, 490 + Math.sin(a) * 360); c.lineTo(960 + Math.cos(a) * 420, 490 + Math.sin(a) * 420); c.stroke(); } }
}

/** The moonlit beach at Palau, torches burning: the men lifting the long pole onto their shoulders (`lift` 0..1). */
export function shoulder(c: C2, t: number, lift: number) {
  sky(c, [[0, '#0c1240'], [0.6, '#24306a'], [0.72, '#3a4a8a']], 700);
  c.fillStyle = '#fff4d6'; c.beginPath(); c.arc(520, 200, 46, 0, TAU); c.fill();
  swell(c, t, 640, '#2a4a8a', '#16245a', 'rgba(180,210,255,0.3)', 0.8);
  c.fillStyle = '#5a4a5a'; c.beginPath(); c.moveTo(0, 760); c.quadraticCurveTo(960, 700, W, 760); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
  canoeRaft(c, 1500, 700, 0.6, t, { paddlers: false, noStone: true });
  stone(c, 1240, 900 - 190, 190, { seed: 4 });
  const k = ease.inOutCubic(clamp(lift)), py = lerp(880, 690, k);
  c.strokeStyle = '#8a6a44'; c.lineWidth = 16; c.lineCap = 'round';   // the pole, behind their heads, on their shoulders
  c.beginPath(); c.moveTo(330, py + 20 * (1 - k)); c.lineTo(1050, py - 6); c.stroke();
  for (let i = 0; i < 4; i++) person(c, 420 + i * 150, 900 + 6 * Math.sin(t * 8 + i) * k, 250, k > 0.55 ? 'carry' : 'slump', { col: SIL, t, seed: i + 40, headTilt: k > 0.55 ? 0.1 : 0.3 });
  for (const x of [280, 1110]) { // torches on poles
    c.strokeStyle = '#3a2418'; c.lineWidth = 8; c.beginPath(); c.moveTo(x, 940); c.lineTo(x, 640); c.stroke();
    const f = 1 + 0.15 * Math.sin(t * 13 + x);
    const g = c.createRadialGradient(x, 620, 0, x, 620, 120 * f); g.addColorStop(0, 'rgba(255,220,140,0.95)'); g.addColorStop(0.25, 'rgba(255,150,60,0.5)'); g.addColorStop(1, 'rgba(255,120,40,0)');
    c.fillStyle = g; c.fillRect(x - 130, 490, 260, 260);
  }
}

/** Close on the stone: the pole slides through the hole in its heart (`u` 0..1; `hit` the moment it goes through). */
export function poleThrough(c: C2, t: number, u: number, hit: number) {
  sky(c, [[0, '#1a1438'], [0.7, '#3a2a5a'], [1, '#5a3a5a']]);
  for (const x of [200, 1720]) {
    const g = c.createRadialGradient(x, 420, 0, x, 420, 380); g.addColorStop(0, 'rgba(255,180,90,0.55)'); g.addColorStop(1, 'rgba(255,140,60,0)');
    c.fillStyle = g; c.fillRect(x - 380, 40, 760, 760);
  }
  c.fillStyle = '#4a3a4a'; c.fillRect(0, 900, W, 180);
  const R = 380;
  stone(c, 960, 900 - R * 0.98, R, { seed: 4 });
  const hy = 900 - R * 0.98 + R * 0.04, tip = lerp(-300, 1500, ease.inOutCubic(clamp(u)));
  // the pole: behind the stone until it reaches the hole, then through it (drawn in two parts around the hole)
  c.save();
  c.fillStyle = '#9a7448'; c.strokeStyle = '#5a4026'; c.lineWidth = 4;
  c.beginPath(); c.rect(-200, hy - 26, Math.min(tip, 960) + 200, 52); c.fill(); c.stroke();
  if (tip > 960) {
    c.beginPath(); c.ellipse(960, hy, R * 0.26 * 0.88 * 0.95, R * 0.26, 0, 0, TAU); c.clip();
    c.beginPath(); c.rect(860, hy - 26, tip - 860, 52); c.fill(); c.stroke();
  }
  c.restore();
  if (tip > 960 + R) { c.fillStyle = '#9a7448'; c.strokeStyle = '#5a4026'; c.lineWidth = 4; c.beginPath(); c.rect(960 + R * 0.9, hy - 26, tip - 960 - R * 0.9, 52); c.fill(); c.stroke(); }
  for (let i = 0; i < 2; i++) person(c, 120 + i * 140, 960, 300, 'carry', { col: SIL, t, seed: 60 + i, headTilt: 0.15 });
  if (hit > 0 && hit < 1) { // a "shunk": lines of force round the hole
    c.strokeStyle = `rgba(255,240,210,${1 - hit})`; c.lineWidth = 6;
    for (let i = 0; i < 10; i++) { const a = i * TAU / 10, r0 = R * 0.32 + 60 * hit; c.beginPath(); c.moveTo(960 + Math.cos(a) * r0, hy + Math.sin(a) * r0); c.lineTo(960 + Math.cos(a) * (r0 + 60), hy + Math.sin(a) * (r0 + 60)); c.stroke(); }
  }
}

/** The storm off the reef: the canoe heeling in the waves (`heel`), the stone sliding off (`slide` 0..1), lightning. */
export function storm(c: C2, t: number, o: { heel: number; slide: number; flash: number; bolt?: number }) {
  const fl = o.flash;
  sky(c, [[0, mixHex('#141a30', '#8a94c0', fl)], [0.55, mixHex('#2a3458', '#b0b8e0', fl)], [0.72, mixHex('#3a4a72', '#c8d0f0', fl)]], 760);
  // rolling clouds, lit from inside by the lightning
  for (let i = 0; i < 10; i++) {
    const x = ((h01(i, 81) * (W + 600) + t * 70 * (0.6 + h01(i, 82))) % (W + 600)) - 300, y = 60 + 300 * h01(i, 83);
    c.fillStyle = mixHex('#252c48', '#dfe4ff', fl * (0.4 + 0.5 * h01(i, 86)));
    c.beginPath(); c.ellipse(x, y, 280 + 140 * h01(i, 84), 70 + 50 * h01(i, 85), 0, 0, TAU); c.fill();
    c.fillStyle = mixHex('#323a5c', '#ffffff', fl * 0.6); c.beginPath(); c.ellipse(x - 60, y - 20, 160, 46, 0, 0, TAU); c.fill();
  }
  if (o.bolt !== undefined && fl > 0.05) { // the bolt, forking down to the sea
    c.save(); c.strokeStyle = `rgba(250,252,255,${Math.min(1, fl * 1.4)})`; c.lineWidth = 8; c.lineJoin = 'bevel'; c.shadowColor = '#cfd8ff'; c.shadowBlur = 30;
    c.beginPath(); let x = 1300, y = 80; c.moveTo(x, y);
    const pts: [number, number][] = [];
    for (let k = 0; k < 10; k++) { x += (h01(k, o.bolt, 1) - 0.5) * 130; y += 64; c.lineTo(x, y); pts.push([x, y]); }
    c.stroke();
    c.lineWidth = 4; c.beginPath(); c.moveTo(pts[3]![0], pts[3]![1]); c.lineTo(pts[3]![0] + 90, pts[3]![1] + 90); c.lineTo(pts[3]![0] + 70, pts[3]![1] + 170); c.stroke();
    c.restore();
  }
  // the sea: big rolling swells with white crests and spray
  const hz = 620;
  c.fillStyle = mixHex('#1c2a52', '#6a78a8', fl); c.fillRect(0, hz, W, H - hz);
  for (let j = 0; j < 4; j++) {
    const base = hz + 40 + j * 120, amp = 60 + 25 * j;
    const yAt = (x: number) => base + amp * Math.sin(x * 0.0042 + t * 1.5 + j * 1.3) + 30 * Math.sin(x * 0.012 - t * 2.1 + j);
    c.fillStyle = mixHex(['#22346a', '#1c2c5e', '#172652', '#112046'][j]!, '#8a96c8', fl * 0.6);
    c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 24) c.lineTo(x, yAt(x)); c.lineTo(W, H); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(235,242,255,0.85)'; c.lineWidth = 5; c.beginPath(); for (let x = 0; x <= W; x += 24) { const y = yAt(x); x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    c.fillStyle = 'rgba(235,242,255,0.7)';   // spray off the crests
    for (let i = 0; i < 14; i++) { const x = (h01(i, j, 88) * W + t * 120) % W, y = yAt(x) - 8 - 30 * ((t * 1.7 + h01(i, j, 89)) % 1); c.beginPath(); c.arc(x, y, 3 + 3 * h01(i, j, 90), 0, TAU); c.fill(); }
  }
  canoeRaft(c, 900, 740 + 36 * Math.sin(t * 1.5), 1.05, t, { tilt: o.heel, paddlers: true, stoneDx: 300 * ease.inQuad(clamp(o.slide)), stoneTilt: 0.6 * clamp(o.slide), noStone: o.slide >= 1 });
  if (o.slide >= 1) { const d = clamp(o.slide - 1); c.fillStyle = `rgba(235,242,255,${0.8 * (1 - d)})`; for (let i = 0; i < 12; i++) { const a = -Math.PI * (0.1 + 0.8 * h01(i, 97)); c.beginPath(); c.arc(1240 + Math.cos(a) * 140 * (0.3 + d), 780 + Math.sin(a) * 120 * (0.3 + d), 8, 0, TAU); c.fill(); } }
  // the rain, slanting
  c.strokeStyle = 'rgba(210,222,255,0.45)'; c.lineWidth = 2.5;
  for (let i = 0; i < 160; i++) { const x = (h01(i, 91) * (W + 400) + t * 300) % (W + 400) - 200, y = (h01(i, 92) * H + t * 1400 * (0.8 + 0.4 * h01(i, 93))) % H; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 22, y + 56); c.stroke(); }
  if (fl > 0) { c.fillStyle = `rgba(225,232,255,${0.35 * fl})`; c.fillRect(0, 0, W, H); }
}

/** Under the storm: the stone going down into the dark, bubbles streaming off it (`u` 0..1 of the fall). */
export function sinking(c: C2, t: number, u: number) {
  sky(c, [[0, '#3a4a7a'], [0.25, '#1a2a5a'], [0.7, '#0a1030'], [1, '#04060f']]);
  c.save(); c.globalCompositeOperation = 'screen';
  for (let k = 0; k < 6; k++) { const x = 300 + k * 260 + 40 * Math.sin(t + k); c.fillStyle = 'rgba(120,150,220,0.12)'; c.beginPath(); c.moveTo(x - 30, 0); c.lineTo(x + 30, 0); c.lineTo(x + 160, H); c.lineTo(x + 20, H); c.closePath(); c.fill(); }
  c.restore();
  c.strokeStyle = 'rgba(200,220,255,0.5)'; c.lineWidth = 3;
  c.beginPath(); for (let x = 0; x <= W; x += 30) { const y = 40 + 12 * Math.sin(x * 0.01 + t * 3); x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
  const y = lerp(160, 1100, ease.inQuad(clamp(u))), x = 960 + 40 * Math.sin(u * 4);
  stone(c, x, y, 190, { tilt: 0.6 * Math.sin(u * 3), seed: 4 });
  for (let i = 0; i < 30; i++) { const d = (t * 1.3 + h01(i, 51)) % 1; c.strokeStyle = `rgba(220,240,255,${0.8 * (1 - d)})`; c.lineWidth = 2; c.beginPath(); c.arc(x + (h01(i, 52) - 0.5) * 260, y - 120 - d * 600, 4 + 10 * h01(i, 53), 0, TAU); c.stroke(); }
}

export { HEX };
