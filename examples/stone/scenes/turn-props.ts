// Props and rooms for verse 4 (`turn`), set on Yap at dawn: the harbour bank, the market, the courtroom, Rai's own
// beach booth, the pier, the Ledger's noticeboard on the sand; and the things of the argument (a price tag, a torch,
// a hammer that will not be a gavel, a judge's wig, a toolbox, a contract with no small print, an empty hook, a
// magnifier, hands, two faceless profiles eye to eye, a conch, tally marks, a sparkle). Canvas2D, 1920x1080 logical.
import { W, H } from '../engine/gl';
import { HEX } from '../engine/palette';
import { font } from '../engine/type';
import { clamp, ease } from '../engine/util';
import { h01 } from './_rai';
import { FAM, TAU, person, rgbaHex, type C2 } from './_motifs';
import { discStone } from './_world';

// ------------------------------------------------------------------ rooms and places

/** The harbour bank: a stone building on the quay at dawn, columns and a pediment with a rai stone carved in it (money's
 *  ancestor), its clock at four (the woman awake at four), lamps, steps, the harbour water and a moored boat in front. */
export function harbourBank(c: C2, t: number, x: number, y: number, s: number) {
  // the quay and the water in front
  c.fillStyle = '#8f8a9a'; c.fillRect(x - s * 1.6, y, s * 3.2, s * 0.12);
  const wg = c.createLinearGradient(0, y + s * 0.12, 0, H);
  wg.addColorStop(0, '#3f6fb0'); wg.addColorStop(1, '#2a3f80');
  c.fillStyle = wg; c.fillRect(0, y + s * 0.12, W, H - y);
  c.strokeStyle = 'rgba(255,220,180,0.45)'; c.lineWidth = 2;
  for (let i = 0; i < 16; i++) { const yy = y + s * 0.2 + i * 22, xx = ((h01(i, 5) * W + t * 20 * (i % 2 ? 1 : -1)) % W + W) % W; c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx + 60 + 80 * h01(i, 6), yy); c.stroke(); }
  // a moored fishing boat
  const bx = x + s * 1.1, by = y + s * 0.35 + 4 * Math.sin(t * 1.6);
  c.fillStyle = '#c4573a'; c.beginPath(); c.moveTo(bx - s * 0.35, by - s * 0.08); c.lineTo(bx + s * 0.38, by - s * 0.08); c.lineTo(bx + s * 0.28, by + s * 0.05); c.lineTo(bx - s * 0.28, by + s * 0.05); c.closePath(); c.fill();
  c.fillStyle = '#f4f1ea'; c.fillRect(bx - s * 0.1, by - s * 0.2, s * 0.16, s * 0.12);
  c.strokeStyle = '#5a3a20'; c.lineWidth = 3; c.beginPath(); c.moveTo(bx - s * 0.2, by - s * 0.08); c.lineTo(bx - s * 0.2, by - s * 0.55); c.stroke();
  // the building
  c.fillStyle = '#e8dcc4'; c.fillRect(x - s * 0.9, y - s * 0.95, s * 1.8, s * 0.95);
  c.fillStyle = '#d4c6aa';
  for (let i = 0; i < 3; i++) c.fillRect(x - s * 1.0 + i * s * 0.04, y - i * s * 0.04 - s * 0.04, s * 2.0 - i * s * 0.08, s * 0.04);
  c.fillStyle = '#f2e8d2';
  for (let i = 0; i < 6; i++) { const cx = x - s * 0.75 + i * s * 0.3; c.fillRect(cx - s * 0.05, y - s * 0.86, s * 0.1, s * 0.74); c.fillStyle = '#d4c6aa'; c.fillRect(cx - s * 0.065, y - s * 0.9, s * 0.13, s * 0.05); c.fillStyle = '#f2e8d2'; }
  c.fillStyle = '#dccdae'; c.beginPath(); c.moveTo(x - s * 1.0, y - s * 0.95); c.lineTo(x, y - s * 1.35); c.lineTo(x + s * 1.0, y - s * 0.95); c.closePath(); c.fill();
  c.strokeStyle = '#a8977a'; c.lineWidth = s * 0.012; c.stroke();
  discStone(c, x, y - s * 1.12, s * 0.12, 0, 0.1);                 // the rai stone carved in the pediment
  c.fillStyle = '#2a1d14'; c.font = font(FAM.hook(), s * 0.11); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('BANK', x, y - s * 0.89 + s * 0.0);
  // the doors and the clock (four o'clock)
  c.fillStyle = '#5a3a24'; c.fillRect(x - s * 0.13, y - s * 0.55, s * 0.26, s * 0.55);
  c.strokeStyle = '#3a2414'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y - s * 0.55); c.lineTo(x, y); c.stroke();
  const ckx = x, cky = y - s * 0.7, cr = s * 0.07;
  c.fillStyle = '#f7f1e3'; c.beginPath(); c.arc(ckx, cky, cr, 0, TAU); c.fill(); c.strokeStyle = '#2a1d14'; c.lineWidth = s * 0.008; c.stroke();
  c.beginPath(); c.moveTo(ckx, cky); c.lineTo(ckx, cky - cr * 0.75); c.moveTo(ckx, cky); c.lineTo(ckx + Math.cos(-Math.PI / 2 + 4 * TAU / 12) * cr * 0.5, cky + Math.sin(-Math.PI / 2 + 4 * TAU / 12) * cr * 0.5); c.stroke();
  // lamps either side, still lit at dawn
  for (const sd of [-1, 1]) {
    const lx = x + sd * s * 0.3, ly = y - s * 0.5;
    c.fillStyle = '#ffd678'; c.beginPath(); c.arc(lx, ly, s * 0.03, 0, TAU); c.fill();
  }
}

/** A market lane at dawn: a back row of stalls with striped awnings, hanging bulbs, crates and a weighing scale in
 *  balance (a fair price). The near stall is drawn by the caller. */
export function marketBack(c: C2, t: number, groundY: number) {
  const cols = [HEX.coral, HEX.cyan, HEX.yellow, HEX.lime, HEX.violet];
  for (let i = 0; i < 6; i++) {
    const x = 60 + i * 340, s = 170, col = cols[i % cols.length]!;
    c.fillStyle = '#8a5a32'; c.fillRect(x - s * 0.6, groundY - s * 1.1, s * 0.05, s * 1.1); c.fillRect(x + s * 0.55, groundY - s * 1.1, s * 0.05, s * 1.1);
    for (let k = 0; k < 6; k++) {
      c.fillStyle = k % 2 ? '#f4f1ea' : col;
      c.beginPath(); c.moveTo(x - s * 0.66 + k * s * 0.22, groundY - s * 1.18); c.lineTo(x - s * 0.66 + (k + 1) * s * 0.22, groundY - s * 1.18);
      c.lineTo(x - s * 0.66 + (k + 1) * s * 0.22, groundY - s * 1.02); c.quadraticCurveTo(x - s * 0.66 + (k + 0.5) * s * 0.22, groundY - s * 0.95, x - s * 0.66 + k * s * 0.22, groundY - s * 1.02); c.closePath(); c.fill();
    }
    c.fillStyle = '#b07a48'; c.fillRect(x - s * 0.6, groundY - s * 0.45, s * 1.2, s * 0.45);
    for (let k = 0; k < 5; k++) { c.fillStyle = ['#ffb02e', '#ff5a5f', '#78d63a', '#ffd23f', '#ff8a2a'][(k + i) % 5]!; c.beginPath(); c.arc(x - s * 0.4 + k * s * 0.2, groundY - s * 0.5, s * 0.07, 0, TAU); c.fill(); }
  }
  // the string of bulbs
  c.strokeStyle = 'rgba(40,30,30,0.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, groundY - 260); c.quadraticCurveTo(W / 2, groundY - 190, W, groundY - 270); c.stroke();
  for (let i = 0; i <= 16; i++) {
    const u = i / 16, x = W * u, y = (1 - u) * (1 - u) * (groundY - 260) + 2 * (1 - u) * u * (groundY - 190) + u * u * (groundY - 270) + 8;
    c.fillStyle = `rgba(255,214,120,${0.75 + 0.25 * Math.sin(t * 3 + i)})`; c.beginPath(); c.arc(x, y, 6, 0, TAU); c.fill();
  }
}

/** A weighing scale in balance on a crate (a fair price). */
export function scale(c: C2, x: number, y: number, s: number, t: number) {
  c.fillStyle = '#b07a48'; c.fillRect(x - s * 0.4, y - s * 0.35, s * 0.8, s * 0.35);
  c.strokeStyle = '#3a3a48'; c.lineWidth = s * 0.03; c.lineCap = 'round';
  const tip = 0.04 * Math.sin(t * 2);
  c.beginPath(); c.moveTo(x, y - s * 0.35); c.lineTo(x, y - s * 0.9); c.stroke();
  c.save(); c.translate(x, y - s * 0.9); c.rotate(tip);
  c.beginPath(); c.moveTo(-s * 0.4, 0); c.lineTo(s * 0.4, 0); c.stroke();
  for (const sd of [-1, 1]) {
    c.beginPath(); c.moveTo(sd * s * 0.4, 0); c.lineTo(sd * s * 0.4, s * 0.22); c.stroke();
    c.fillStyle = '#c9cbd8'; c.beginPath(); c.ellipse(sd * s * 0.4, s * 0.24, s * 0.14, s * 0.04, 0, 0, Math.PI); c.fill();
  }
  c.restore();
}

/** A courtroom at dawn: panelled walls, tall windows with dawn light, the judge's high bench under a rai-stone crest,
 *  a jury box. The jury is drawn by the caller. Returns the bench top's y. */
export function courtroom(c: C2, t: number, k = 1, ox = 0) {
  c.fillStyle = '#6b3f2a'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#7d4b32';
  for (let i = 0; i < 12; i++) c.fillRect(ox + i * 170 - 20, 60, 150, 560);
  // tall windows with the dawn coming in
  for (let i = 0; i < 3; i++) {
    const wx = ox + 260 + i * 700, wy = 90;
    const g = c.createLinearGradient(0, wy, 0, wy + 380);
    g.addColorStop(0, '#5a4aa8'); g.addColorStop(0.6, '#ffb38a'); g.addColorStop(1, '#ffd36b');
    c.fillStyle = g; c.beginPath(); c.roundRect(wx - 90, wy, 180, 380, [90, 90, 6, 6]); c.fill();
    c.strokeStyle = '#4a2a1a'; c.lineWidth = 8; c.stroke();
    c.beginPath(); c.moveTo(wx, wy + 10); c.lineTo(wx, wy + 380); c.moveTo(wx - 90, wy + 200); c.lineTo(wx + 90, wy + 200); c.stroke();
    // a shaft of light
    c.save(); c.globalCompositeOperation = 'screen'; c.fillStyle = 'rgba(255,200,140,0.12)';
    c.beginPath(); c.moveTo(wx - 90, wy + 380); c.lineTo(wx + 90, wy + 380); c.lineTo(wx + 330, H); c.lineTo(wx + 40, H); c.closePath(); c.fill(); c.restore();
  }
  // the floor
  c.fillStyle = '#4a2a1a'; c.fillRect(0, 760 * k, W, H);
  c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 2;
  for (let i = 0; i < 20; i++) { c.beginPath(); c.moveTo(i * 110 + ox * 0.5, 760 * k); c.lineTo(i * 110 - 300 + ox * 0.5, H); c.stroke(); }
  void t;
  return 0;
}

/** The judge's bench (high desk) with the crest above; the bench top at (x, y). */
export function bench(c: C2, x: number, y: number, s: number) {
  discStone(c, x, y - s * 0.95, s * 0.22, 0, 0);
  c.strokeStyle = '#f6c453'; c.lineWidth = s * 0.02; c.beginPath(); c.arc(x, y - s * 0.95, s * 0.3, 0, TAU); c.stroke();
  c.fillStyle = '#5a3020'; c.fillRect(x - s * 1.1, y, s * 2.2, s * 0.9);
  c.fillStyle = '#7a4a2a'; c.fillRect(x - s * 1.18, y - s * 0.06, s * 2.36, s * 0.08);
  c.strokeStyle = '#3a1e12'; c.lineWidth = s * 0.012;
  for (let i = 0; i < 4; i++) c.strokeRect(x - s * 1.0 + i * s * 0.52, y + s * 0.15, s * 0.42, s * 0.6);
}

/** The jury box: twelve silhouettes in two rows, emoting as they turn to each other on `tTurn`. */
export function jury(c: C2, t: number, x: number, y: number, s: number, tTurn: number) {
  c.fillStyle = '#5a3020'; c.fillRect(x - s * 1.4, y - s * 0.05, s * 2.8, s * 0.5);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) {
    const px = x - s * 1.15 + i * s * 0.46 + r * s * 0.2, py = y - s * 0.02 - (1 - r) * s * 0.18;
    const turned = t >= tTurn + i * 0.05;
    const em = turned ? (i % 3 === 0 ? '?' : i % 3 === 1 ? '!' : 'sigh') : undefined;
    person(c, px, py + s * 0.3, s * 0.85, turned ? 'point' : 'stand', { col: r ? '#1a1230' : '#22183a', t, seed: r * 6 + i, flip: (i % 2 === 0), emote: em, emoteT0: tTurn + i * 0.05 });
  }
  c.fillStyle = '#6b3a24'; c.fillRect(x - s * 1.45, y + s * 0.08, s * 2.9, s * 0.45);
}

/** Rai's beach booth: a little stall with bunting and a hand-painted sign. */
export function booth(c: C2, t: number, x: number, y: number, s: number, sign: string) {
  c.fillStyle = '#8a5a32'; c.fillRect(x - s * 0.62, y - s * 1.2, s * 0.05, s * 1.2); c.fillRect(x + s * 0.57, y - s * 1.2, s * 0.05, s * 1.2);
  c.strokeStyle = 'rgba(40,30,30,0.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - s * 0.6, y - s * 1.18); c.quadraticCurveTo(x, y - s * 1.0, x + s * 0.6, y - s * 1.18); c.stroke();
  for (let i = 0; i < 9; i++) {
    const u = (i + 0.5) / 9, bx = x - s * 0.6 + u * s * 1.2, by = y - s * 1.18 + Math.sin(u * Math.PI) * s * 0.17 - (1 - Math.sin(u * Math.PI)) * 0;
    c.fillStyle = [HEX.pink, HEX.yellow, HEX.cyan, HEX.lime][i % 4]!;
    c.beginPath(); c.moveTo(bx - s * 0.04, by); c.lineTo(bx + s * 0.04, by); c.lineTo(bx, by + s * 0.08 + 3 * Math.sin(t * 4 + i)); c.closePath(); c.fill();
  }
  c.fillStyle = '#f7f1e3'; c.save(); c.translate(x, y - s * 1.35); c.rotate(-0.03);
  c.fillRect(-s * 0.55, -s * 0.13, s * 1.1, s * 0.26);
  c.strokeStyle = '#8a5a32'; c.lineWidth = s * 0.02; c.strokeRect(-s * 0.55, -s * 0.13, s * 1.1, s * 0.26);
  c.fillStyle = HEX.coral; c.font = font(FAM.hook(), s * 0.13); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(sign, 0, s * 0.01);
  c.restore();
  c.fillStyle = '#b07a48'; c.fillRect(x - s * 0.66, y - s * 0.5, s * 1.32, s * 0.5);
  c.fillStyle = '#d9a46a'; c.fillRect(x - s * 0.7, y - s * 0.54, s * 1.4, s * 0.06);
}

/** The Ledger's noticeboard on the sand: two posts and a frame; the caller draws the board inside (fx, fy, fw, fh). */
export function boardPosts(c: C2, x: number, y: number, w: number, h: number) {
  c.fillStyle = '#7a5030';
  c.fillRect(x - w * 0.42, y - h * 0.2, w * 0.03, h * 1.25); c.fillRect(x + w * 0.39, y - h * 0.2, w * 0.03, h * 1.25);
  c.fillStyle = '#e6cf91'; c.beginPath(); c.ellipse(x - w * 0.405, y + h * 1.05, w * 0.05, h * 0.03, 0, 0, TAU); c.ellipse(x + w * 0.405, y + h * 1.05, w * 0.05, h * 0.03, 0, 0, TAU); c.fill();
}

// ------------------------------------------------------------------ things

/** A price tag (filled), its hole at the left, centred at (x, y), width s, rotated rot; text in the middle. */
export function tag(c: C2, x: number, y: number, s: number, rot: number, text: string, o: { col?: string; ink?: string; size?: number; fam?: string; string?: boolean; flip?: number } = {}) {
  const w = s, h = s * 0.5;
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(o.flip ?? 1, 1);
  if (o.string !== false) { c.strokeStyle = HEX.bone; c.lineWidth = s * 0.012; c.beginPath(); c.moveTo(-w / 2 + h * 0.42, 0); c.quadraticCurveTo(-w * 0.75, -h, -w * 0.7, -h * 1.8); c.stroke(); }
  c.beginPath();
  c.moveTo(-w / 2, 0); c.lineTo(-w / 2 + h / 2, -h / 2); c.lineTo(w / 2, -h / 2); c.lineTo(w / 2, h / 2); c.lineTo(-w / 2 + h / 2, h / 2); c.closePath();
  c.moveTo(-w / 2 + h * 0.42 + s * 0.035, 0); c.arc(-w / 2 + h * 0.42, 0, s * 0.035, 0, TAU);
  c.fillStyle = o.col ?? HEX.gold; c.fill('evenodd');
  c.strokeStyle = rgbaHex(HEX.ink, 0.5); c.lineWidth = s * 0.012; c.stroke();
  if (text) {
    c.fillStyle = o.ink ?? HEX.ink; c.font = font(o.fam ?? FAM.monoB(), o.size ?? s * 0.16); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(text, h * 0.22, 0);
  }
  c.restore();
}

/** A torch: a stick and a flame (flame 0 = out, with a curl of smoke). */
export function torch(c: C2, x: number, y: number, s: number, rot: number, flame: number, t: number) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.fillStyle = '#6b4a2b'; c.fillRect(-s * 0.04, 0, s * 0.08, s * 0.6);
  c.fillStyle = '#3a2a1c'; c.fillRect(-s * 0.07, -s * 0.02, s * 0.14, s * 0.1);
  if (flame > 0.02) {
    const k = flame * (1 + 0.08 * Math.sin(t * 23));
    for (const [col, sc] of [[HEX.coral, 1], [HEX.orange, 0.75], [HEX.yellow, 0.45]] as const) {
      c.fillStyle = col; c.beginPath();
      c.moveTo(0, -s * 0.36 * k * sc - s * 0.02); c.quadraticCurveTo(s * 0.16 * k * sc, -s * 0.08 * sc, 0, s * 0.02); c.quadraticCurveTo(-s * 0.16 * k * sc, -s * 0.08 * sc, 0, -s * 0.36 * k * sc - s * 0.02); c.fill();
    }
  } else {
    c.strokeStyle = 'rgba(230,230,240,0.75)'; c.lineWidth = s * 0.025; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, -s * 0.02);
    for (let i = 1; i <= 12; i++) c.lineTo(Math.sin(i * 0.9 + t * 3) * s * 0.05, -s * 0.04 * i);
    c.stroke();
  }
  c.restore();
}

/** A carpenter's hammer: handle from (x, y) along rot (0 = head up), head at the far end. */
export function hammer(c: C2, x: number, y: number, s: number, rot: number) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.fillStyle = '#c4874a'; c.beginPath(); c.roundRect(-s * 0.05, -s * 0.85, s * 0.1, s * 0.9, s * 0.04); c.fill();
  c.fillStyle = '#5b6070'; c.beginPath(); c.roundRect(-s * 0.3, -s * 1.02, s * 0.6, s * 0.22, s * 0.04); c.fill();
  c.fillStyle = rgbaHex(HEX.bone, 0.45); c.fillRect(-s * 0.28, -s * 1.0, s * 0.56, s * 0.05);
  c.restore();
}

/** The gavel's sound block, in profile. */
export function block(c: C2, x: number, y: number, s: number, col = '#7a4a2a') {
  c.fillStyle = col; c.beginPath(); c.ellipse(x, y, s, s * 0.22, 0, 0, TAU); c.fill();
  c.fillRect(x - s, y, 2 * s, s * 0.3);
  c.beginPath(); c.ellipse(x, y + s * 0.3, s, s * 0.22, 0, 0, TAU); c.fill();
  c.fillStyle = rgbaHex('#c98a55', 0.9); c.beginPath(); c.ellipse(x, y, s * 0.92, s * 0.17, 0, 0, TAU); c.fill();
}

/** A judge's wig: rows of white curls. */
export function wig(c: C2, x: number, y: number, s: number, rot = 0) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.fillStyle = HEX.bone;
  c.beginPath(); c.ellipse(0, 0, s * 0.5, s * 0.32, 0, Math.PI, 0); c.fill();
  for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(sd * s * 0.44, i * s * 0.14, s * 0.1, 0, TAU); c.fill(); }
  c.strokeStyle = rgbaHex(HEX.ash, 0.7); c.lineWidth = s * 0.02;
  for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(-s * 0.3 + i * s * 0.15, -s * 0.18, s * 0.06, 0, TAU); c.stroke(); }
  c.restore();
}

/** A toolbox with its lid (0 open .. 1 shut), labelled TOOLS. */
export function toolbox(c: C2, x: number, y: number, s: number, lid: number, col: string = HEX.coral) {
  c.fillStyle = col; c.beginPath(); c.roundRect(x - s * 0.6, y - s * 0.4, s * 1.2, s * 0.4, s * 0.04); c.fill();
  c.fillStyle = rgbaHex(HEX.ink, 0.25); c.fillRect(x - s * 0.6, y - s * 0.4, s * 1.2, s * 0.05);
  c.save(); c.translate(x - s * 0.6, y - s * 0.4); c.rotate(-(1 - lid) * 1.9);
  c.fillStyle = col; c.beginPath(); c.roundRect(0, -s * 0.12, s * 1.2, s * 0.12, s * 0.03); c.fill();
  c.restore();
  if (lid > 0.9) { c.strokeStyle = HEX.ink; c.lineWidth = s * 0.03; c.beginPath(); c.moveTo(x - s * 0.15, y - s * 0.52); c.lineTo(x - s * 0.15, y - s * 0.6); c.lineTo(x + s * 0.15, y - s * 0.6); c.lineTo(x + s * 0.15, y - s * 0.52); c.stroke(); }
  c.font = font(FAM.monoB(), s * 0.12); c.fillStyle = HEX.ink; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('TOOLS', x, y - s * 0.2);
}

/** A contract: a bone sheet with a heading, clauses, a signature line and an empty foot. */
export function contract(c: C2, x: number, y: number, w: number, h: number, o: { title?: string; rows?: [string, string][]; rot?: number } = {}) {
  c.save(); c.translate(x, y); c.rotate(o.rot ?? 0);
  c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(-w / 2 + 14, -h / 2 + 18, w, h);
  c.fillStyle = '#f7f1e3'; c.fillRect(-w / 2, -h / 2, w, h);
  c.fillStyle = HEX.ink; c.font = font(FAM.hook(), w * 0.09); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(o.title ?? 'MY OFFER', 0, -h / 2 + w * 0.12);
  c.font = font(FAM.mono(), w * 0.045); c.textAlign = 'left';
  (o.rows ?? []).forEach(([a, b], i) => {
    const ry = -h / 2 + w * 0.3 + i * w * 0.09;
    c.fillStyle = HEX.ink; c.fillText(a, -w / 2 + w * 0.08, ry);
    c.textAlign = 'right'; c.fillText(b, w / 2 - w * 0.08, ry); c.textAlign = 'left';
    c.strokeStyle = rgbaHex(HEX.ink, 0.2); c.setLineDash([3, 6]); c.lineWidth = 2;
    c.beginPath(); c.moveTo(-w / 2 + w * 0.08 + c.measureText(a).width + 10, ry); c.lineTo(w / 2 - w * 0.08 - c.measureText(b).width - 10, ry); c.stroke(); c.setLineDash([]);
  });
  c.strokeStyle = rgbaHex(HEX.ink, 0.6); c.lineWidth = 2;
  c.beginPath(); c.moveTo(-w / 2 + w * 0.08, h / 2 - h * 0.22); c.lineTo(-w * 0.05, h / 2 - h * 0.22); c.stroke();
  c.font = font(FAM.mono(), w * 0.03); c.fillStyle = rgbaHex(HEX.ink, 0.6); c.fillText('signed: everybody', -w / 2 + w * 0.08, h / 2 - h * 0.17);
  c.restore();
}

/** A fishing line from the top of the frame down to an empty hook at (x, y). */
export function hook(c: C2, x: number, y: number, s: number, t: number) {
  const sw = Math.sin(t * 1.3) * s * 0.06;
  c.strokeStyle = 'rgba(230,240,255,0.8)'; c.lineWidth = 2.5;
  c.beginPath(); c.moveTo(x - sw * 3, -10); c.lineTo(x + sw, y - s * 0.5); c.stroke();
  c.strokeStyle = '#c9d2e6'; c.lineWidth = s * 0.06; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x + sw, y - s * 0.5); c.lineTo(x + sw, y + s * 0.15); c.arc(x + sw - s * 0.18, y + s * 0.15, s * 0.18, 0, Math.PI * 0.95); c.stroke();
  c.beginPath(); c.moveTo(x + sw - s * 0.36, y + s * 0.13); c.lineTo(x + sw - s * 0.33, y - s * 0.02); c.stroke();
}

/** A magnifying glass; `inner` draws what the lens shows (clipped to it). */
export function magnifier(c: C2, x: number, y: number, r: number, inner: (k: C2) => void) {
  c.save(); c.beginPath(); c.arc(x, y, r, 0, TAU); c.clip(); inner(c); c.restore();
  c.strokeStyle = '#2a1d14'; c.lineWidth = r * 0.14; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
  c.strokeStyle = '#7a4a2a'; c.lineCap = 'round'; c.lineWidth = r * 0.22; c.beginPath(); c.moveTo(x + r * 0.75, y + r * 0.75); c.lineTo(x + r * 1.6, y + r * 1.6); c.stroke();
  c.strokeStyle = rgbaHex(HEX.bone, 0.55); c.lineWidth = r * 0.05; c.beginPath(); c.arc(x, y, r * 0.8, -2.4, -1.6); c.stroke();
}

/** A hand in silhouette, forearm from (x, y) along `rot` (0 = pointing up), open palm; s ~ the hand's length. */
export function hand(c: C2, x: number, y: number, s: number, rot: number, col: string = HEX.ink, o: { curl?: number } = {}) {
  const curl = o.curl ?? 0;
  c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round';
  c.beginPath(); c.roundRect(-s * 0.2, -s * 0.2, s * 0.4, s * 1.4, s * 0.15); c.fill();
  c.beginPath(); c.roundRect(-s * 0.26, -s * 0.62, s * 0.52, s * 0.5, s * 0.16); c.fill();
  c.lineWidth = s * 0.11;
  [-0.18, -0.06, 0.06, 0.18].forEach((fx, i) => {
    const L = s * (0.36 + (i === 1 || i === 2 ? 0.06 : 0)) * (1 - 0.5 * curl);
    c.beginPath(); c.moveTo(fx * s, -s * 0.58); c.lineTo(fx * s * 1.15, -s * 0.58 - L); c.stroke();
  });
  c.beginPath(); c.moveTo(-s * 0.22, -s * 0.3); c.lineTo(-s * 0.42, -s * 0.52 + curl * s * 0.1); c.stroke();
  c.restore();
}

/** A faceless head-and-shoulders profile facing right (flip to face left), height s, its eye level at (x, y). */
export function profile(c: C2, x: number, y: number, s: number, flip: boolean, col: string) {
  c.save(); c.translate(x, y); c.scale(flip ? -s : s, s); c.fillStyle = col;
  c.beginPath();
  c.moveTo(-0.55, 1.6); c.quadraticCurveTo(-0.55, 0.95, -0.2, 0.85); c.quadraticCurveTo(-0.45, 0.4, -0.42, -0.1);
  c.quadraticCurveTo(-0.38, -0.62, 0.02, -0.66); c.quadraticCurveTo(0.3, -0.64, 0.33, -0.2); c.lineTo(0.34, -0.02);
  c.quadraticCurveTo(0.56, 0.17, 0.39, 0.21); c.lineTo(0.35, 0.27); c.quadraticCurveTo(0.39, 0.33, 0.35, 0.38);
  c.quadraticCurveTo(0.37, 0.46, 0.3, 0.5); c.quadraticCurveTo(0.16, 0.6, 0.08, 0.7); c.quadraticCurveTo(0.12, 0.95, 0.5, 1.05);
  c.lineTo(0.65, 1.6); c.closePath(); c.fill();
  c.restore();
}

/** A comic speech burst. */
export function burst(c: C2, x: number, y: number, r: number, col: string, n = 14, seed = 1, t = 0) {
  c.fillStyle = col; c.beginPath();
  for (let i = 0; i <= 2 * n; i++) {
    const a = (i / (2 * n)) * TAU + 0.05 * Math.sin(t * 6), rr = i % 2 ? r * (0.72 + 0.08 * h01(i, seed)) : r * (1 + 0.12 * h01(i, seed + 1));
    const px = x + Math.cos(a) * rr * 1.25, py = y + Math.sin(a) * rr * 0.85;
    if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
  }
  c.closePath(); c.fill();
  c.strokeStyle = HEX.ink; c.lineWidth = 6; c.stroke();
}

/** A conch shell (her megaphone), its mouth towards +x, at (x, y), size s. */
export function conch(c: C2, x: number, y: number, s: number, rot = 0) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.fillStyle = '#ffd2c4'; c.beginPath(); c.moveTo(-s * 0.6, -s * 0.1); c.quadraticCurveTo(0, -s * 0.5, s * 0.6, -s * 0.45); c.lineTo(s * 0.6, s * 0.45); c.quadraticCurveTo(0, s * 0.5, -s * 0.6, s * 0.1); c.closePath(); c.fill();
  c.fillStyle = '#ff9f8a'; c.beginPath(); c.ellipse(s * 0.6, 0, s * 0.12, s * 0.45, 0, 0, TAU); c.fill();
  c.strokeStyle = '#d97a6a'; c.lineWidth = s * 0.04;
  for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(-s * 0.6 + i * s * 0.3, -s * 0.3 - i * 0.04 * s); c.quadraticCurveTo(-s * 0.5 + i * s * 0.3, 0, -s * 0.6 + i * s * 0.3, s * 0.3 + i * 0.04 * s); c.stroke(); }
  c.restore();
}

/** A four-point sparkle (the small miracle), size r, born at t0. */
export function sparkle(c: C2, x: number, y: number, r: number, t: number, t0: number, col: string = HEX.bone) {
  if (t < t0) return;
  const a = t - t0, k = ease.outBack(clamp(a / 0.25)) * (1 + 0.15 * Math.sin(a * 12)), rot = a * 1.5;
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(k, k); c.fillStyle = col;
  c.beginPath();
  for (let i = 0; i < 8; i++) { const ang = (i / 8) * TAU, rr = i % 2 ? r * 0.18 : r; c.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); }
  c.closePath(); c.fill(); c.restore();
}

/** Tally marks: n strokes (every fifth crosses the four), at (x, y), stroke height s. */
export function tally(c: C2, x: number, y: number, s: number, n: number, col: string) {
  c.strokeStyle = col; c.lineWidth = s * 0.09; c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const grp = Math.floor(i / 5), k = i % 5, gx = x + grp * s * 1.05;
    c.beginPath();
    if (k < 4) { c.moveTo(gx + k * s * 0.18, y); c.lineTo(gx + k * s * 0.18 + s * 0.04, y - s); }
    else { c.moveTo(gx - s * 0.1, y - s * 0.2); c.lineTo(gx + s * 0.68, y - s * 0.8); }
    c.stroke();
  }
}

/** A pickup truck at night with its headlights on (the lift to the doctor at three). */
export function pickup(c: C2, x: number, y: number, s: number, t: number) {
  const beam = c.createLinearGradient(x + s * 0.9, 0, x + s * 2.6, 0);
  beam.addColorStop(0, 'rgba(255,240,180,0.55)'); beam.addColorStop(1, 'rgba(255,240,180,0)');
  c.fillStyle = beam; c.beginPath(); c.moveTo(x + s * 0.9, y - s * 0.3); c.lineTo(x + s * 2.6, y - s * 0.55); c.lineTo(x + s * 2.6, y + s * 0.1); c.lineTo(x + s * 0.9, y - s * 0.18); c.closePath(); c.fill();
  c.fillStyle = '#c4573a';
  c.beginPath(); c.moveTo(x - s, y - s * 0.15); c.lineTo(x - s, y - s * 0.45); c.lineTo(x + s * 0.1, y - s * 0.45); c.lineTo(x + s * 0.3, y - s * 0.75); c.lineTo(x + s * 0.7, y - s * 0.75); c.lineTo(x + s * 0.9, y - s * 0.4); c.lineTo(x + s * 0.95, y - s * 0.15); c.closePath(); c.fill();
  c.fillStyle = '#9fd0ff'; c.beginPath(); c.moveTo(x + s * 0.35, y - s * 0.7); c.lineTo(x + s * 0.65, y - s * 0.7); c.lineTo(x + s * 0.8, y - s * 0.45); c.lineTo(x + s * 0.3, y - s * 0.45); c.closePath(); c.fill();
  c.fillStyle = '#ffe9a0'; c.beginPath(); c.arc(x + s * 0.92, y - s * 0.3, s * 0.05, 0, TAU); c.fill();
  c.fillStyle = '#1a1230';
  for (const wx of [-0.6, 0.55]) { c.beginPath(); c.arc(x + wx * s, y - s * 0.12, s * 0.17, 0, TAU); c.fill(); }
  void t;
}

/** A lifeboat with its crew on a wave. */
export function lifeboat(c: C2, x: number, y: number, s: number, t: number) {
  const by = y + 10 * Math.sin(t * 3), rk = 0.06 * Math.sin(t * 2.3);
  c.save(); c.translate(x, by); c.rotate(rk);
  c.fillStyle = HEX.orange; c.beginPath(); c.moveTo(-s, 0); c.lineTo(s, 0); c.lineTo(s * 0.75, s * 0.38); c.lineTo(-s * 0.8, s * 0.38); c.closePath(); c.fill();
  c.fillStyle = '#2b4a9a'; c.fillRect(-s * 0.95, -s * 0.04, s * 1.9, s * 0.08);
  c.fillStyle = HEX.bone; c.fillRect(-s * 0.25, -s * 0.42, s * 0.55, s * 0.42);
  for (let i = 0; i < 3; i++) person(c, -s * 0.75 + i * s * 0.6, 0, s * 0.55, i === 1 ? 'point' : 'paddle', { col: '#1a1230', t, seed: i, rim: HEX.orange });
  c.restore();
  c.strokeStyle = 'rgba(220,240,255,0.85)'; c.lineWidth = 6; c.beginPath();
  for (let xx = x - s * 1.6; xx <= x + s * 1.6; xx += 16) c.lineTo(xx, y + s * 0.38 + 10 * Math.sin(xx * 0.03 + t * 4));
  c.stroke();
}
