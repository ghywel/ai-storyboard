// v2 `legend`: what the heart-lantern shows for lines 6–8, each an ordinary 1920x1080 frame (heartLantern fits its
// height into the circle; what matters sits within 540 px of the centre). Silhouettes; the stone in the story is a
// plain disc, or the little chalk-drawn stone that changes hands in the deals (the stone itself never moves: only who
// owns it changes, which is the point).
//   morning   Yap the morning after the storm: grey-pink light, the wreck of the canoe on the sand, people at the edge
//   bank      the island's stone bank: a gap in the row where she stood, and a garland laid in it (nobody wrote her off)
//   pointing  the whole island on the shore at sunset, every one pointing down into the sea ("!")
//   belief    above and below the waterline: their pointing, and the gold lines of belief going down to her
//   deal      a fenced plot with a palm (land); two old rivals bowing over the drawn stone (a feud settled); a couple
//             in garlands (a wedding, which is how the film will end)
import { W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { clamp, ease, lerp } from '../../engine/util';
import { h01 } from '../_rai';
import { TAU, rgbaHex, person, stone, type Pose, type Emote } from '../_motifs';
import { palmTree, hut } from '../_world';

type C2 = CanvasRenderingContext2D;
const SIL = '#24141c';

function sky(c: C2, stops: [number, string][], h = H) {
  const g = c.createLinearGradient(0, 0, 0, h);
  for (const [o, col] of stops) g.addColorStop(o, col);
  c.fillStyle = g; c.fillRect(0, 0, W, h);
}
function sea(c: C2, t: number, y: number, top: string, bot: string, line: string) {
  const g = c.createLinearGradient(0, y, 0, H); g.addColorStop(0, top); g.addColorStop(1, bot);
  c.fillStyle = g; c.fillRect(0, y, W, H - y);
  c.strokeStyle = line; c.lineWidth = 2;
  for (let j = 0; j < 10; j++) { const yy = y + Math.pow((j + 1) / 11, 1.5) * (H - y); for (let k = 0; k < 5; k++) { const x = ((h01(j, k, 7) * W + t * 14 * (k % 2 ? 1 : -1)) % W + W) % W; c.beginPath(); c.moveTo(x, yy); c.quadraticCurveTo(x + 60, yy - 3, x + 140, yy); c.stroke(); } }
}
function beach(c: C2, y: number, col: string) {
  c.fillStyle = col; c.beginPath(); c.moveTo(0, H); c.lineTo(0, y + 20); c.quadraticCurveTo(W / 2, y - 20, W, y + 20); c.lineTo(W, H); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, y + 18); c.quadraticCurveTo(W / 2, y - 22, W, y + 18); c.stroke();
}

/** The little chalk-drawn stone that changes hands in the deals: an outline of a disc with its hole, glowing. */
export function drawnStone(c: C2, x: number, y: number, r: number, a = 1) {
  c.save(); c.strokeStyle = rgbaHex('#fff6dc', a); c.lineWidth = Math.max(2, r * 0.14); c.shadowColor = 'rgba(255,230,160,0.9)'; c.shadowBlur = r * 0.8;
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); c.beginPath(); c.arc(x, y, r * 0.3, 0, TAU); c.stroke();
  c.restore();
}

// ------------------------------------------------------------------ after the storm

/** Yap, the morning after: the sky washed pink and grey, the broken canoe on the sand, the people looking out to sea. */
export function morning(c: C2, t: number, u: number) {
  sky(c, [[0, '#6a6a8a'], [0.4, '#c49aa0'], [0.62, '#f2c4a0']], 640);
  sea(c, t, 620, '#9aa0b8', '#5a6a8a', 'rgba(255,255,255,0.3)');
  beach(c, 760, '#c8b49a');
  palmTree(c, 260, 790, 420, -0.3, t, 1, 0.2);
  palmTree(c, 1700, 800, 380, 0.25, t, 2, 0.2);
  // the wreck of the canoe: half a hull, the broken mast, a torn sail, a coil of rope
  c.save(); c.translate(1290, 850); c.rotate(-0.12);
  c.fillStyle = '#4a3a3a'; c.beginPath(); c.moveTo(-200, -10); c.quadraticCurveTo(-60, 30, 120, 10); c.lineTo(140, -16); c.quadraticCurveTo(-60, 0, -200, -10); c.fill();
  c.strokeStyle = '#4a3a3a'; c.lineWidth = 10; c.beginPath(); c.moveTo(-40, -10); c.lineTo(60, -170); c.stroke();
  c.fillStyle = 'rgba(200,180,170,0.8)'; c.beginPath(); c.moveTo(60, -170); c.quadraticCurveTo(130, -120, 100, -40); c.lineTo(20, -60); c.closePath(); c.fill();
  c.restore();
  // the people at the water's edge, looking out to sea (a slow push towards them)
  const k = 1 + 0.06 * u;
  c.save(); c.translate(W / 2, 800); c.scale(k, k); c.translate(-W / 2, -800);
  const poses: Pose[] = ['stand', 'slump', 'hold', 'stand', 'face', 'stand'];
  poses.forEach((p, i) => person(c, 620 + i * 120 + 20 * Math.sin(i * 2.1), 800 + 10 * (i % 2), 190 - 20 * (i % 3), p, { col: SIL, t, seed: i + 70, headTilt: 0.1 }));
  c.restore();
}

// ------------------------------------------------------------------ the stone bank

/** The island's stone bank: rai stones standing in a row on a raised stone floor; a gap where she would stand. The
 *  garland is laid in the gap on `lay` (0..1). */
export function bank(c: C2, t: number, lay: number) {
  sky(c, [[0, '#ffb07a'], [0.5, '#ffd9a0'], [0.68, '#ffeacc']], 760);
  c.fillStyle = '#7a9a6a'; c.fillRect(0, 700, W, 380);
  palmTree(c, 300, 720, 460, -0.15, t, 3, 0.1);
  palmTree(c, 1640, 730, 420, 0.2, t, 4, 0.1);
  hut(c, 1500, 700, 220, false, 0.1);
  c.fillStyle = '#9a968a'; c.beginPath(); c.roundRect(360, 760, 1200, 70, 10); c.fill();
  c.fillStyle = '#b4b0a2'; for (let i = 0; i < 24; i++) { c.beginPath(); c.ellipse(390 + i * 50, 766, 22, 9, 0, 0, TAU); c.fill(); }
  const slots = [[470, 120], [690, 170], [960, 0], [1220, 150], [1430, 110]] as const;   // the middle one is hers: empty
  for (const [x, r] of slots) if (r) stone(c, x, 760 - r * 0.95, r, { seed: x, tilt: (h01(x, 3) - 0.5) * 0.1 });
  // her empty place: the marks where she stood
  c.strokeStyle = 'rgba(80,70,60,0.6)'; c.lineWidth = 4; c.setLineDash([10, 10]); c.beginPath(); c.ellipse(960, 760, 150, 18, 0, 0, TAU); c.stroke(); c.setLineDash([]);
  // the garland, laid in it
  const k = ease.outCubic(clamp(lay)), gy = lerp(520, 752, k);
  for (let j = 0; j < 22; j++) { const a = Math.PI * (j / 21); c.fillStyle = [HEX.pink, HEX.yellow, '#fff3f7', HEX.coral, HEX.orange][j % 5]!; c.beginPath(); c.arc(960 + Math.cos(a) * 120 * (0.7 + 0.3 * k), gy - Math.sin(a) * 18 * k + (1 - k) * Math.sin(a) * 60, 13, 0, TAU); c.fill(); }
  // the people: a woman laying it, the elder with a hand on his heart, children
  person(c, 760, 840, 230, k < 1 ? 'hold' : 'stand', { col: SIL, t, seed: 81, headTilt: 0.35 });
  person(c, 1180, 840, 240, 'hands', { col: SIL, t, seed: 82, flip: true, headTilt: 0.25, emote: k >= 1 ? 'heart' : undefined, emoteT0: 0 });
  person(c, 1290, 840, 150, 'stand', { col: SIL, t, seed: 83, flip: true });
  person(c, 640, 840, 140, 'stand', { col: SIL, t, seed: 84 });
}

// ------------------------------------------------------------------ the whole island pointing

/** The whole island on the shore at sunset, everybody pointing out at the sea where she went down (a ring of gold
 *  ripples on the water); `bang` the "!" moment. */
export function pointing(c: C2, t: number, u: number, bang: number) {
  sky(c, [[0, '#3b2a7a'], [0.45, '#c04a7a'], [0.62, '#ff8a5a'], [0.68, '#ffc070']], 640);
  c.save(); c.shadowColor = '#ffd36b'; c.shadowBlur = 60; c.fillStyle = '#ffd36b'; c.beginPath(); c.arc(1240, 630, 80, Math.PI, TAU); c.fill(); c.restore();
  sea(c, t, 630, '#a04a7a', '#3a2a6a', 'rgba(255,200,160,0.35)');
  // the spot where she went down: gold ripples breathing on the water
  for (let r = 0; r < 4; r++) { const k = ((t * 0.5 + r / 4) % 1); c.strokeStyle = rgbaHex('#ffd98a', 0.8 * (1 - k)); c.lineWidth = 4; c.beginPath(); c.ellipse(1330, 800, 40 + 200 * k, 10 + 40 * k, 0, 0, TAU); c.stroke(); }
  // the beach: a spit from the left, the crowd on it, facing the water
  c.fillStyle = '#d89a7a'; c.beginPath(); c.moveTo(0, H); c.lineTo(0, 640); c.quadraticCurveTo(520, 640, 880, 760); c.quadraticCurveTo(1040, 820, 1000, H); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 642); c.quadraticCurveTo(520, 642, 882, 762); c.quadraticCurveTo(1042, 822, 1002, H); c.stroke();
  palmTree(c, 120, 700, 480, -0.2, t, 5, 0.75); palmTree(c, 330, 680, 380, 0.1, t, 6, 0.75);
  const pan = 30 * u;
  for (let i = 0; i < 12; i++) { // the crowd, the near ones bigger and lower
    const row = i % 3, x = 380 + (i >> 1) * 95 + row * 40 - pan, y = 760 + row * 75 + (i >> 1) * 18, h = 190 + 55 * row + 20 * h01(i, 92);
    person(c, x, y, h, i === 5 ? 'hold' : 'point', { col: SIL, t, seed: i + 100, rim: 'rgba(255,170,110,0.7)', emote: i % 3 === 1 ? '!' : undefined, emoteT0: bang + 0.04 * i });
  }
}

/** Above and below the waterline: the island pointing, and the gold lines of belief going down through the water to
 *  the stone on the seabed (`u` how far they have gone). */
export function belief(c: C2, t: number, u: number) {
  const wl = 430;
  sky(c, [[0, '#3b2a7a'], [0.6, '#d0607a'], [1, '#ffa070']], wl);
  c.fillStyle = '#d89a7a'; c.beginPath(); c.moveTo(0, wl - 20); c.lineTo(760, wl - 20); c.lineTo(860, wl); c.lineTo(0, wl); c.fill();
  const g = c.createLinearGradient(0, wl, 0, H); g.addColorStop(0, '#2a5a9a'); g.addColorStop(1, '#0a1a40');
  c.fillStyle = g; c.fillRect(0, wl, W, H - wl);
  c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 3; c.beginPath(); for (let x = 0; x <= W; x += 30) { const y = wl + 4 * Math.sin(x * 0.02 + t * 2); x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
  c.fillStyle = '#c9a96a'; c.beginPath(); c.moveTo(0, H); c.lineTo(0, 980); c.quadraticCurveTo(960, 930, W, 990); c.lineTo(W, H); c.fill();
  stone(c, 1180, 980 - 110, 110, { seed: 4, heart: HEX.gold, heartA: 0.3 + 0.6 * clamp(u * 1.5 - 0.5) });
  const fingers: [number, number][] = [];
  for (let i = 0; i < 7; i++) {
    const x = 120 + i * 95, h = 150 + 20 * (i % 2);
    person(c, x, wl - 20, h, 'point', { col: SIL, t, seed: i + 120, rim: 'rgba(255,170,110,0.7)' });
    fingers.push([x + 40 * h / 100, wl - 20 - 84 * h / 100]);
  }
  c.save(); c.setLineDash([14, 12]); c.lineCap = 'round';
  fingers.forEach(([fx, fy], i) => {
    const k = clamp(u * 1.4 - i * 0.06), ex = lerp(fx, 1180, k), ey = lerp(fy, 870, k);
    if (k <= 0) return;
    c.strokeStyle = rgbaHex('#ffd98a', 0.85); c.lineWidth = 5; c.lineDashOffset = -t * 60;
    c.beginPath(); c.moveTo(fx, fy); c.lineTo(ex, ey); c.stroke();
  });
  c.restore();
}

// ------------------------------------------------------------------ three deals

export type Deal = 'land' | 'feud' | 'wedding';
/** One deal: the little drawn stone passing from one pair of hands to the other on `pass` (0..1). */
export function deal(c: C2, t: number, kind: Deal, pass: number, u = 0) {
  const k = ease.inOutCubic(clamp(pass));
  if (kind === 'land') {
    sky(c, [[0, '#7ac0f0'], [0.6, '#cfeaff']], 700);
    c.fillStyle = '#8aba6a'; c.fillRect(0, 680, W, 400);
    // the plot: a little fence round a square of ground with a young palm
    c.fillStyle = '#a8c47a'; c.beginPath(); c.moveTo(620, 760); c.lineTo(1300, 760); c.lineTo(1400, 900); c.lineTo(520, 900); c.closePath(); c.fill();
    c.strokeStyle = '#6a4a2a'; c.lineWidth = 7;
    for (let i = 0; i <= 12; i++) { const x = 560 + i * 70; c.beginPath(); c.moveTo(x, 900); c.lineTo(x, 840); c.stroke(); }
    c.beginPath(); c.moveTo(540, 855); c.lineTo(1400, 855); c.moveTo(540, 880); c.lineTo(1400, 880); c.stroke();
    palmTree(c, 960, 800, 340 + 10 * u, 0.06, t, 7, 0);
    person(c, 520, 900, 240, 'point', { col: SIL, t, seed: 130 });
    person(c, 1400, 900, 240, k > 0.9 ? 'wave' : 'hands', { col: SIL, t, seed: 131, flip: true, emote: k > 0.9 ? 'joy' : undefined, emoteT0: 0 });
    drawnStone(c, lerp(640, 1290, k), 600 - 120 * Math.sin(Math.PI * k), 34);
  } else if (kind === 'feud') {
    sky(c, [[0, '#f0a070'], [0.6, '#ffd8a8']], 700);
    c.fillStyle = '#b89a6a'; c.fillRect(0, 700, W, 380);
    // two households' fences meeting at a disputed corner; the two old rivals bow to each other over the drawn stone
    c.strokeStyle = '#6a4a2a'; c.lineWidth = 7;
    for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(200 + i * 60, 860); c.lineTo(200 + i * 60, 790); c.stroke(); c.beginPath(); c.moveTo(1300 + i * 60, 860); c.lineTo(1300 + i * 60, 790); c.stroke(); }
    const bow = clamp(k * 1.4), shake = k > 0.75;
    person(c, 820, 900, 250, shake ? 'hands' : 'stand', { col: SIL, t, seed: 140, headTilt: 0.5 * bow, emote: k < 0.2 ? 'anger' : shake ? 'heart' : undefined, emoteT0: 0 });
    person(c, 1100, 900, 250, shake ? 'hands' : 'stand', { col: SIL, t, seed: 141, flip: true, headTilt: 0.5 * bow, emote: k < 0.2 ? 'anger' : undefined, emoteT0: 0 });
    drawnStone(c, 960, 640 - 40 * k, 44);
  } else {
    sky(c, [[0, '#ff9ab0'], [0.55, '#ffd0c0'], [0.7, '#fff0d8']], 720);
    c.fillStyle = '#7aaa7a'; c.fillRect(0, 700, W, 380);
    palmTree(c, 420, 760, 480, -0.12, t, 8, 0); palmTree(c, 1500, 760, 460, 0.12, t, 9, 0);
    // an arch of flowers; the couple in garlands; the drawn stone handed to them; petals
    c.strokeStyle = '#4a7a4a'; c.lineWidth = 10; c.beginPath(); c.arc(960, 900, 330, Math.PI, TAU); c.stroke();
    for (let j = 0; j < 26; j++) { const a = Math.PI + Math.PI * j / 25; c.fillStyle = [HEX.pink, HEX.yellow, '#fff3f7', HEX.coral][j % 4]!; c.beginPath(); c.arc(960 + Math.cos(a) * 330, 900 + Math.sin(a) * 330, 16, 0, TAU); c.fill(); }
    for (const [x, f] of [[880, false], [1040, true]] as const) {
      person(c, x, 920, 260, 'stand', { col: SIL, t, seed: x, flip: f });
      for (let j = 0; j < 9; j++) { const a = Math.PI * (0.15 + 0.7 * j / 8); c.fillStyle = [HEX.pink, HEX.yellow, '#fff3f7'][j % 3]!; c.beginPath(); c.arc(x + Math.cos(a) * 26, 920 - 200 + Math.sin(a) * 22, 7, 0, TAU); c.fill(); }
    }
    person(c, 640, 920, 240, k < 0.9 ? 'point' : 'cheer', { col: SIL, t, seed: 150 });
    drawnStone(c, lerp(760, 960, k), lerp(640, 560, k) - 80 * Math.sin(Math.PI * k), 38);
    for (let i = 0; i < 40; i++) { const d = (t * 0.25 + h01(i, 151)) % 1; c.fillStyle = [HEX.pink, '#fff3f7', HEX.yellow][i % 3]!; c.beginPath(); c.ellipse(h01(i, 152) * W + 40 * Math.sin(t * 2 + i), d * H, 6, 3.5, t * 3 + i, 0, TAU); c.fill(); }
  }
}

export type { Emote };
