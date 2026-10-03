// twist's sets and props: the TWIST! split-flap board that drops from the flies, the write-off form on the loss
// adjuster's desk (and the NOT WRITTEN OFF stamp), the news desk with its BREAKING bulletin and ticker, the shore
// footage from Yap (the islanders pointing down at the sea, the stone glowing on the seabed below), the shopping
// channel ("THE ROCK SHOP": a turntable of deals, SOLD for 1 UNSEEN STONE), and the Rich List's podiums with a
// yacht and a gold bar.
import { W, H } from '../../engine/gl';
import { HEX } from '../../engine/palette';
import { font } from '../../engine/type';
import { clamp, ease, frameIdx } from '../../engine/util';
import { h01 } from '../_rai';
import { FAM, TAU, rgbaHex, mixHex, person, stone } from '../_motifs';
import { palmTree, hut, stoneBank, steamship, fish } from '../_world';
import { heart, star4 } from '../_manga';
import { scanlines } from './_studio';
import type { C2 } from './onair-kit';

// ------------------------------------------------------------------ TWIST! the split-flap board

const FLAP_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ?!£0123456789';
/**
 * A split-flap board flown in from the flies: `drop` 0 (up out of sight) .. 1 (in place, centre (x, y)), its flaps
 * rattling through letters until each lands on `text` from tLand (left to right). Bulbs round the frame chase.
 */
export function flipBoard(c: C2, g: C2, x: number, y: number, t: number, drop: number, tLand: number, text = 'TWIST!') {
  const n = text.length, fw = 116, fh = 160, gap = 12, bw = n * fw + (n - 1) * gap + 60, bh = fh + 56;
  const yy = y - (1 - ease.outBack(clamp(drop), 1.4)) * 700;
  c.save();
  // the cables to the flies
  c.strokeStyle = '#2a2a33'; c.lineWidth = 4;
  c.beginPath(); c.moveTo(x - bw * 0.35, yy - bh / 2); c.lineTo(x - bw * 0.35, yy - 900); c.moveTo(x + bw * 0.35, yy - bh / 2); c.lineTo(x + bw * 0.35, yy - 900); c.stroke();
  // the frame with bulbs
  c.fillStyle = '#1a0f22'; c.beginPath(); c.roundRect(x - bw / 2, yy - bh / 2, bw, bh, 18); c.fill();
  c.strokeStyle = HEX.gold; c.lineWidth = 6; c.stroke();
  const per = 2 * (bw + bh), nb = 40;
  for (let i = 0; i < nb; i++) {
    let d = (i / nb) * per, bx = 0, by = 0;
    if (d < bw) { bx = x - bw / 2 + d; by = yy - bh / 2; } else if ((d -= bw) < bh) { bx = x + bw / 2; by = yy - bh / 2 + d; }
    else if ((d -= bh) < bw) { bx = x + bw / 2 - d; by = yy + bh / 2; } else { d -= bw; bx = x - bw / 2; by = yy + bh / 2 - d; }
    const on = 0.5 + 0.5 * Math.sin(t * 12 - i * 0.8);
    c.fillStyle = mixHex('#5a4630', '#fff3c8', on); c.beginPath(); c.arc(bx, by, 7, 0, TAU); c.fill();
    if (on > 0.5) { g.fillStyle = rgbaHex('#ffe7a0', 0.5 * on); g.beginPath(); g.arc(bx, by, 14, 0, TAU); g.fill(); }
  }
  // the flaps
  for (let i = 0; i < n; i++) {
    const fx = x - bw / 2 + 30 + i * (fw + gap), fy = yy - fh / 2, land = tLand + i * 0.07;
    const landed = t >= land, k = Math.floor((t - land) * 22);
    const ch = landed ? text[i]! : FLAP_CHARS[Math.floor(h01(Math.floor(t * 22), i, 77) * FLAP_CHARS.length)]!;
    const ph = landed ? clamp((t - land) / 0.08) : (t * 22) % 1;
    c.fillStyle = '#0c0910'; c.beginPath(); c.roundRect(fx, fy, fw, fh, 10); c.fill();
    c.font = font(FAM.hook(), 128); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.save(); c.beginPath(); c.roundRect(fx, fy, fw, fh, 10); c.clip();
    c.fillStyle = landed ? HEX.gold : '#d9cfb8'; c.fillText(ch, fx + fw / 2, fy + fh / 2 + 6);
    // the falling top flap (a flip in progress)
    if (ph < 1) {
      const s = Math.cos(ph * Math.PI);
      c.fillStyle = '#16111e'; c.fillRect(fx, fy + fh / 2 - (fh / 2) * Math.max(0, s), fw, (fh / 2) * Math.abs(s));
    }
    c.restore();
    c.fillStyle = '#000'; c.fillRect(fx, fy + fh / 2 - 2, fw, 4);
    if (landed) { g.fillStyle = rgbaHex(HEX.gold, 0.28 * (1 - 0.5 * clamp((t - land) / 0.6))); g.fillRect(fx, fy, fw, fh); }
    void k;
  }
  c.restore();
}

// ------------------------------------------------------------------ the write-off form

/**
 * The loss adjuster's desk from above: the form for writing her off (ITEM, LOCATION, LAST SEEN, WRITE OFF? YES / NO),
 * a calculator (the panel's emblem to come), a coffee ring, and a faceless hand with a red pen that creeps to YES
 * (`pen` 0..1) and recoils (`recoil`) when the stamp lands.
 */
export function writeOffForm(c: C2, g: C2, t: number, pen: number, recoil: number) {
  // the desk
  const dg = c.createLinearGradient(0, 0, W, H);
  dg.addColorStop(0, '#5a3a26'); dg.addColorStop(1, '#3a2418');
  c.fillStyle = dg; c.fillRect(-W, -H, W * 3, H * 3);
  c.strokeStyle = 'rgba(30,18,10,0.35)'; c.lineWidth = 3;
  for (let j = 0; j < 18; j++) { c.beginPath(); for (let x = -40; x <= W + 40; x += 40) { const y = j * 70 + 10 * Math.sin(x * 0.004 + j * 1.3); x === -40 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); }
  // the calculator (top left) and a coffee cup's ring
  c.save(); c.translate(W * 0.1, H * 0.2); c.rotate(-0.2);
  c.fillStyle = '#2a2a33'; c.beginPath(); c.roundRect(-110, -150, 220, 300, 18); c.fill();
  c.fillStyle = '#9fc59a'; c.fillRect(-85, -125, 170, 60);
  c.font = font(FAM.monoB(), 40); c.fillStyle = '#1f3a1f'; c.textAlign = 'right'; c.textBaseline = 'middle'; c.fillText('0.', 75, -94);
  for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) { c.fillStyle = k === 3 ? '#e8823a' : '#4a4a55'; c.beginPath(); c.roundRect(-85 + k * 44, -40 + r * 46, 36, 36, 6); c.fill(); }
  c.restore();
  c.strokeStyle = 'rgba(80,40,20,0.5)'; c.lineWidth = 10; c.beginPath(); c.arc(W * 0.86, H * 0.18, 70, 0.3, 5.9); c.stroke();
  // the form
  c.save(); c.translate(W * 0.5, H * 0.43); c.rotate(-0.03);
  c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(-560 + 14, -380 + 18, 1120, 840);
  c.fillStyle = '#f4efe1'; c.fillRect(-560, -380, 1120, 840);
  c.strokeStyle = '#c9c0a8'; c.lineWidth = 2; c.strokeRect(-540, -360, 1080, 800);
  c.fillStyle = '#1a1622'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.font = font(FAM.monoB(), 46); c.fillText('LOSS REPORT', -500, -290);
  c.font = font(FAM.mono(), 24); c.fillStyle = '#5a5466'; c.fillText('FORM W/O-1 · WRITING OFF AN ASSET', -500, -252);
  c.fillRect(-500, -236, 1000, 3);
  const rows: [string, string][] = [['ITEM', '1 RAI STONE (LIMESTONE, 4 TONNES)'], ['LOCATION', 'THE BOTTOM OF THE SEA'], ['LAST SEEN', 'NOT IN LIVING MEMORY'], ['RECOVERABLE', 'NO']];
  rows.forEach(([k, v], i) => {
    const y = -180 + i * 70;
    c.font = font(FAM.monoB(), 28); c.fillStyle = '#1a1622'; c.fillText(k + ':', -500, y);
    c.font = font(FAM.mono(), 28); c.fillStyle = '#2a3a8a'; c.fillText(v, -230, y);
    c.fillStyle = '#c9c0a8'; c.fillRect(-235, y + 10, 735, 2);
  });
  c.font = font(FAM.monoB(), 34); c.fillStyle = '#1a1622'; c.fillText('WRITE OFF?', -500, 140);
  for (const [lbl, bx] of [['YES', -170], ['NO', 110]] as const) {
    c.strokeStyle = '#1a1622'; c.lineWidth = 4; c.strokeRect(bx, 100, 50, 50);
    c.font = font(FAM.monoB(), 32); c.fillText(lbl, bx + 66, 140);
  }
  c.restore();
  // the hand with the red pen, creeping to YES, recoiling
  const tx = W * 0.5 - 145, ty = H * 0.43 + 125, hx = W * 1.05 + (tx - W * 1.05) * ease.inOutCubic(pen) + 260 * recoil, hy = H * 0.95 + (ty - H * 0.95) * ease.inOutCubic(pen) + 120 * recoil;
  c.save(); c.translate(hx, hy); c.rotate(-0.5 + 0.3 * recoil);
  c.strokeStyle = '#d23a3a'; c.lineWidth = 16; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(90, -40); c.stroke();
  c.fillStyle = '#e8d8c0'; c.beginPath(); c.moveTo(0, 0); c.lineTo(-14, 10); c.lineTo(-4, -14); c.closePath(); c.fill();
  c.fillStyle = '#1c1420'; c.beginPath(); c.ellipse(110, -30, 60, 44, -0.4, 0, TAU); c.fill(); // the fist (a silhouette)
  c.fillRect(120, -70, 700, 90); // the sleeve
  c.fillStyle = '#e8e2d4'; c.fillRect(150, -74, 40, 98); // a shirt cuff
  c.restore();
  void g; void t;
}

// ------------------------------------------------------------------ the news

/** The news desk (WORTH NEWS): a curved front with the show's ring logo, papers on top. Draw after Rai. */
export function newsDesk(c: C2, g: C2, x: number, y: number, w: number, t: number) {
  c.save();
  c.fillStyle = '#16204a';
  c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x + w / 2, y); c.lineTo(x + w / 2 - 30, y + 330); c.lineTo(x - w / 2 + 30, y + 330); c.closePath(); c.fill();
  c.fillStyle = '#2a3a7a'; c.fillRect(x - w / 2 - 10, y - 14, w + 20, 22);
  c.fillStyle = HEX.cyan; c.fillRect(x - w / 2 + 20, y + 30, w - 40, 5);
  g.fillStyle = rgbaHex(HEX.cyan, 0.4); g.fillRect(x - w / 2 + 20, y + 26, w - 40, 12);
  // the logo: a ring (the show's ring) and WORTH NEWS
  c.strokeStyle = HEX.gold; c.lineWidth = 8; c.beginPath(); c.arc(x - 150, y + 95, 36, 0, TAU); c.stroke();
  c.font = font(FAM.hook(), 54); c.fillStyle = HEX.bone; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('WORTH NEWS', x - 96, y + 97);
  // papers on the desk
  c.fillStyle = '#f4efe1'; c.save(); c.translate(x + w * 0.22, y - 8); c.rotate(0.06); c.fillRect(-90, -10, 180, 14); c.restore();
  c.restore();
  void t;
}

/** A news ticker strip at y: the red BREAKING tag and the crawl. */
export function ticker(c: C2, t: number, t0: number, text: string, y = 0) {
  if (t < t0) return;
  const inU = ease.outCubic(clamp((t - t0) / 0.25)), h = 46;
  c.save();
  c.globalAlpha *= inU;
  c.fillStyle = 'rgba(14,10,24,0.92)'; c.fillRect(0, y, W, h);
  c.save(); c.beginPath(); c.rect(250, y, W - 250, h); c.clip();
  c.font = font(FAM.monoB(), 28); c.fillStyle = HEX.bone; c.textAlign = 'left'; c.textBaseline = 'middle';
  const tw = c.measureText(text).width + 60, off = ((t - t0) * 260) % tw;
  for (let k = 0; k < 3; k++) c.fillText(text, 270 + W * 0.5 - off + k * tw - W * 0.5, y + h / 2 + 1);
  c.restore();
  c.fillStyle = '#e8323c'; c.fillRect(0, y, 250, h);
  c.font = font(FAM.hook(), 30); c.fillStyle = HEX.bone; c.textAlign = 'center'; c.fillText('BREAKING', 125, y + h / 2 + 2);
  c.restore();
}

/**
 * Live from Yap at sunset: the shore on the left with its stone bank, huts and palms, the islanders lined up at the
 * water's edge pointing down at the sea (each gets a "!" from `bangT`); on the right the sea cut away below the
 * surface, where the stone rests on the seabed with her heart faintly lit. A steamer on the horizon (the trader).
 */
export function shoreFootage(c: C2, g: C2, t: number, bangT: number) {
  const hz = H * 0.34, sea = H * 0.5;
  const sky = c.createLinearGradient(0, 0, 0, hz);
  sky.addColorStop(0, '#3b2a7a'); sky.addColorStop(0.7, '#d8608a'); sky.addColorStop(1, '#ff9a5a');
  c.fillStyle = sky; c.fillRect(-W, -H, W * 3, hz + H);
  c.fillStyle = '#ffd98a'; c.beginPath(); c.arc(W * 0.66, hz, 70, Math.PI, 0); c.fill();
  g.fillStyle = 'rgba(255,190,110,0.3)'; g.beginPath(); g.arc(W * 0.66, hz, 150, Math.PI, 0); g.fill();
  steamship(c, W * 0.86, hz + 4, 0.16, t, '#3a2440');
  // the far sea to the horizon, then the surface line
  const fs = c.createLinearGradient(0, hz, 0, sea);
  fs.addColorStop(0, '#6a4a8a'); fs.addColorStop(1, '#3a4a9a');
  c.fillStyle = fs; c.fillRect(-W, hz, W * 3, sea - hz);
  for (let k = 0; k < 10; k++) { c.fillStyle = rgbaHex('#ffcf7a', 0.4 - k * 0.035); c.fillRect(W * 0.66 - 70 + 10 * Math.sin(t * 1.5 + k), hz + 6 + k * 12, 140 - k * 9, 3); }
  // under the surface: the cutaway, blue to the deep, rays, a few fish, the stone on the seabed
  const uw = c.createLinearGradient(0, sea, 0, H);
  uw.addColorStop(0, '#15608e'); uw.addColorStop(1, '#061638');
  c.fillStyle = uw; c.fillRect(-W, sea, W * 3, H);
  c.save(); c.globalCompositeOperation = 'screen';
  for (let k = 0; k < 5; k++) {
    const x = W * (0.45 + 0.12 * k) + 20 * Math.sin(t * 0.4 + k);
    const rg = c.createLinearGradient(0, sea, 0, H); rg.addColorStop(0, 'rgba(170,220,255,0.12)'); rg.addColorStop(1, 'rgba(170,220,255,0)');
    c.fillStyle = rg; c.beginPath(); c.moveTo(x, sea); c.lineTo(x + 50, sea); c.lineTo(x + 120, H); c.lineTo(x - 40, H); c.closePath(); c.fill();
  }
  c.restore();
  fish(c, W * 0.55 + 60 * Math.sin(t * 0.7), H * 0.6, 0.9, '#ffd23f', 1, t, 1);
  fish(c, W * 0.9 - 40 * Math.sin(t * 0.5), H * 0.58, 0.7, '#ff8a2a', -1, t, 2);
  c.fillStyle = '#c9b07a'; c.beginPath(); c.moveTo(W * 0.4, H); for (let x = W * 0.4; x <= W + 40; x += 40) c.lineTo(x, H * 0.79 + 8 * Math.sin(x * 0.01)); c.lineTo(W + 40, H); c.closePath(); c.fill();
  stone(c, W * 0.74, H * 0.73, 74, { seed: 3, heart: HEX.pink, heartA: 0.55 + 0.25 * Math.sin(t * 2), glow: HEX.pink, glowA: 0.5, tilt: 0.12 });
  g.fillStyle = rgbaHex(HEX.pink, 0.25 + 0.1 * Math.sin(t * 2)); g.beginPath(); g.arc(W * 0.74, H * 0.73, 80, 0, TAU); g.fill();
  // the surface seen from the side: a bright band where the light comes through, bubbles rising to it
  const sb = c.createLinearGradient(0, sea - 4, 0, sea + 40); sb.addColorStop(0, 'rgba(200,240,255,0.45)'); sb.addColorStop(1, 'rgba(200,240,255,0)');
  c.fillStyle = sb; c.fillRect(W * 0.38, sea - 4, W, 44);
  c.strokeStyle = 'rgba(210,240,255,0.55)'; c.lineWidth = 2;
  for (let i = 0; i < 10; i++) { const v = (t * 0.25 + h01(i, 81)) % 1, bx = W * (0.62 + 0.25 * h01(i, 82)), by = H * 0.72 - v * (H * 0.72 - sea); c.beginPath(); c.arc(bx + 6 * Math.sin(t * 2 + i), by, 3 + 5 * h01(i, 83), 0, TAU); c.stroke(); }
  c.strokeStyle = 'rgba(230,245,255,0.9)'; c.lineWidth = 4;
  c.beginPath(); for (let x = W * 0.38; x <= W + 40; x += 30) { const y = sea + 6 * Math.sin(x * 0.02 + t * 2); x === W * 0.38 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke();
  // the shore, left: sand sloping into the water, the stone bank, huts and palms
  c.fillStyle = '#e8c08a';
  c.beginPath(); c.moveTo(-W, H); c.lineTo(-W, sea - 40); c.lineTo(W * 0.3, sea - 30); c.quadraticCurveTo(W * 0.42, sea - 10, W * 0.46, H); c.closePath(); c.fill();
  c.fillStyle = '#b8905a'; c.beginPath(); c.moveTo(W * 0.3, sea - 30); c.quadraticCurveTo(W * 0.42, sea - 10, W * 0.46, H); c.lineTo(W * 0.42, H); c.quadraticCurveTo(W * 0.38, sea + 40, W * 0.28, sea - 26); c.closePath(); c.fill();
  hut(c, W * 0.06, sea - 60, 150, false, 0.3);
  stoneBank(c, W * 0.17, sea - 40, 0.42, 0.25, 4);
  palmTree(c, W * 0.02, sea - 20, 420, 0.1, t, 1, 0.4);
  palmTree(c, W * 0.29, sea - 30, 300, -0.15, t, 2, 0.4);
  // the islanders at the water's edge, pointing down at her
  const ppl = [[0.1, 230], [0.16, 200], [0.215, 250], [0.27, 120], [0.33, 215]] as const;
  ppl.forEach(([fx, h], i) => {
    const pose = h < 150 ? 'point' : 'point';
    person(c, W * fx, sea + 60 + i * 6, h, pose, { col: '#1e1024', t, seed: i, rim: '#ffb08a', emote: '!', emoteT0: bangT + i * 0.09, headTilt: 0.35 });
  });
}

/** A live (not archive) picture on the studio screen: full-frame `draw` shrunk into the CRT, with a corner bug. */
export function liveFeed(t: number, draw: (c: C2, g: C2) => void, bug = 'LIVE · YAP') {
  return (c: C2, g: C2, x: number, y: number, w: number, h: number) => {
    const k = h / H, pw = W * k, px = x + (w - pw) / 2;
    c.save(); g.save();
    c.beginPath(); c.rect(x, y, w, h); c.clip(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    for (const cc of [c, g]) { cc.translate(px, y); cc.scale(k, k); }
    draw(c, g);
    c.restore(); g.restore();
    c.fillStyle = '#e8323c'; c.fillRect(x + 12, y + 12, 118, 26);
    c.font = font(FAM.monoB(), 16); c.fillStyle = HEX.bone; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(bug, x + 18, y + 26);
  };
}

/** The BELIEF poll graphic for the screen: a bar filling to 100% (`u`), SOURCE: EVERYONE. */
export function beliefPoll(c: C2, g: C2, x: number, y: number, w: number, h: number, u: number, t: number) {
  const bg = c.createLinearGradient(x, y, x, y + h); bg.addColorStop(0, '#1a2a6a'); bg.addColorStop(1, '#0a1030');
  c.fillStyle = bg; c.fillRect(x, y, w, h);
  c.font = font(FAM.monoB(), 20); c.fillStyle = HEX.bone; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('YAP POLL: IS SHE REAL?', x + w / 2, y + h * 0.18);
  const bx = x + 26, bw = w - 52, by = y + h * 0.36, bh = 54;
  c.fillStyle = '#05081a'; c.fillRect(bx, by, bw, bh);
  c.fillStyle = HEX.gold; c.fillRect(bx, by, bw * u, bh);
  g.fillStyle = rgbaHex(HEX.gold, 0.35); g.fillRect(bx, by, bw * u, bh);
  c.font = font(FAM.hook(), 36); c.fillStyle = HEX.gold; c.fillText(`BELIEF: ${Math.round(100 * u)}%`, x + w / 2, y + h * 0.66);
  c.font = font(FAM.mono(), 13); c.fillStyle = 'rgba(244,241,234,0.7)'; c.fillText('SOURCE: EVERYONE · SAMPLE: THE WHOLE ISLAND', x + w / 2, y + h * 0.87);
  scanlines(c, x, y, w, h, 0.1);
  void t;
}

// ------------------------------------------------------------------ the shopping channel: THE ROCK SHOP

/** The shopping channel's set: hot pink and yellow, a sunburst, THE ROCK SHOP in bulbs, CALL NOW, an order counter. */
export function shopSet(c: C2, g: C2, t: number, orders: number) {
  const bg = c.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#ff4f9a'); bg.addColorStop(1, '#a8226a');
  c.fillStyle = bg; c.fillRect(-W, -H, W * 3, H * 3);
  c.save(); c.translate(W * 0.62, H * 0.62);
  for (let k = 0; k < 24; k++) { const a0 = (k / 24) * TAU + t * 0.2; c.fillStyle = k % 2 ? 'rgba(255,210,63,0.35)' : 'rgba(255,255,255,0.08)'; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, W * 1.2, a0, a0 + TAU / 48); c.closePath(); c.fill(); }
  c.restore();
  // the logo board in bulbs
  c.fillStyle = '#2a0f22'; c.beginPath(); c.roundRect(W * 0.3, 40, W * 0.64, 150, 20); c.fill();
  c.strokeStyle = HEX.yellow; c.lineWidth = 6; c.stroke();
  for (let i = 0; i < 36; i++) {
    const bx = W * 0.3 + 14 + i * ((W * 0.64 - 28) / 35), on = 0.5 + 0.5 * Math.sin(t * 10 - i);
    for (const by of [52, 178]) { c.fillStyle = mixHex('#5a4630', '#fff3c8', on); c.beginPath(); c.arc(bx, by, 5, 0, TAU); c.fill(); }
  }
  c.font = font(FAM.hook(), 96); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = HEX.ink; c.fillText('THE ROCK SHOP', W * 0.62 + 5, 120 + 5);
  c.fillStyle = HEX.yellow; c.fillText('THE ROCK SHOP', W * 0.62, 120);
  g.fillStyle = rgbaHex(HEX.yellow, 0.2); g.fillRect(W * 0.3, 40, W * 0.64, 150);
  // CALL NOW and the counter
  c.save(); c.translate(W * 0.88, H * 0.42); c.rotate(0.08);
  c.fillStyle = HEX.yellow; c.beginPath(); c.roundRect(-150, -80, 300, 160, 16); c.fill();
  c.font = font(FAM.hook(), 44); c.fillStyle = HEX.ink; c.fillText('CALL NOW', 0, -36);
  c.font = font(FAM.monoB(), 26); c.fillText('0800 ROCK', 0, 8);
  c.font = font(FAM.monoB(), 22); c.fillText(`ORDERS: ${orders}`, 0, 48);
  c.restore();
  // the floor
  c.fillStyle = '#3a1030'; c.fillRect(-W, H * 0.8, W * 3, H);
  c.fillStyle = 'rgba(255,255,255,0.08)'; for (let k = 0; k < 8; k++) c.fillRect(-W + k * 520, H * 0.8, 260, H);
}

export type ShopItem = 'deed' | 'handshake' | 'garland';
/** The turntable at (x, y) with three items, rotated by `rot` (the item at angle 0 faces us). */
export function turntable(c: C2, g: C2, t: number, x: number, y: number, rot: number, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  // the plinth: a chrome disc with lights round its edge
  c.fillStyle = '#2a0f22'; c.beginPath(); c.ellipse(0, 40, 360, 70, 0, 0, TAU); c.fill();
  c.fillStyle = '#e9e4f0'; c.beginPath(); c.ellipse(0, 0, 360, 70, 0, 0, TAU); c.fill();
  c.fillStyle = '#c9c0d8'; c.fillRect(-360, 0, 720, 40);
  c.fillStyle = '#f6f2fa'; c.beginPath(); c.ellipse(0, 0, 340, 62, 0, 0, TAU); c.fill();
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * TAU + rot, px = Math.cos(a) * 360, py = 20 + Math.sin(a) * 70;
    if (Math.sin(a) < 0) continue;
    const on = 0.5 + 0.5 * Math.sin(t * 9 + i);
    c.fillStyle = mixHex('#7a5a4a', '#fff3c8', on); c.beginPath(); c.arc(px, py, 6, 0, TAU); c.fill();
    g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = rgbaHex('#fff3c8', 0.4 * on); g.beginPath(); g.arc(px, py, 12, 0, TAU); g.fill(); g.restore();
  }
  // the items, back to front
  const items: ShopItem[] = ['deed', 'handshake', 'garland'];
  const placed = items.map((it, i) => { const a = rot - (i * TAU) / 3; return { it, a, z: Math.cos(a) }; }).sort((p, q) => p.z - q.z);
  for (const p of placed) {
    const px = Math.sin(p.a) * 230, py = -6 + p.z * 26, k = 0.55 + 0.45 * (0.5 + 0.5 * p.z);
    c.save(); c.translate(px, py); c.scale(k, k);
    c.globalAlpha *= 0.55 + 0.45 * (0.5 + 0.5 * p.z);
    shopItem(c, g, t, p.it);
    c.restore();
  }
  c.restore();
}

/** One of the deals, standing on the turntable (origin at its base). */
export function shopItem(c: C2, g: C2, t: number, it: ShopItem) {
  if (it === 'deed') { // a deed to a plot: a parchment on a little easel, a palm and a dotted plot
    c.strokeStyle = '#6a4a2a'; c.lineWidth = 8; c.beginPath(); c.moveTo(-60, 0); c.lineTo(-20, -240); c.moveTo(60, 0); c.lineTo(20, -240); c.stroke();
    c.fillStyle = '#f2e3bf'; c.beginPath(); c.roundRect(-120, -300, 240, 220, 8); c.fill();
    c.strokeStyle = '#b89a62'; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#d9c497'; c.beginPath(); c.ellipse(0, -300, 128, 14, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(0, -80, 128, 14, 0, 0, TAU); c.fill();
    c.font = font(FAM.monoB(), 26); c.fillStyle = '#5a3a1a'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('DEED', 0, -266);
    c.setLineDash([8, 7]); c.strokeStyle = '#7a3a2a'; c.lineWidth = 3; c.strokeRect(-80, -240, 160, 110); c.setLineDash([]);
    c.strokeStyle = '#6a4a2a'; c.lineWidth = 5; c.beginPath(); c.moveTo(-10, -140); c.quadraticCurveTo(0, -180, 6, -205); c.stroke();
    c.strokeStyle = '#2e8a4a'; c.lineWidth = 6; for (const a of [-2.6, -2.0, -1.2, -0.5]) { c.beginPath(); c.moveTo(6, -205); c.quadraticCurveTo(6 + Math.cos(a) * 30, -215 + Math.sin(a) * 18, 6 + Math.cos(a) * 46, -205 + Math.sin(a) * 6 + 14); c.stroke(); }
    c.font = font(FAM.mono(), 16); c.fillStyle = '#5a3a1a'; c.fillText('ONE PLOT · YAP', 0, -104);
  } else if (it === 'handshake') { // a feud settled: two silhouettes shaking hands on a plinth
    c.fillStyle = '#2a0f22'; c.fillRect(-130, -40, 260, 40);
    c.font = font(FAM.monoB(), 18); c.fillStyle = HEX.yellow; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('FEUD: SETTLED', 0, -20);
    person(c, -74, -40, 230, 'point', { col: '#1c1024', t, seed: 2 });
    person(c, 74, -40, 230, 'point', { col: '#1c1024', t, seed: 5, flip: true });
    const u = 0.5 + 0.5 * Math.sin(t * 9);
    c.fillStyle = '#1c1024'; c.beginPath(); c.arc(0, -40 - 230 * 0.84 + 6 * u, 13, 0, TAU); c.fill();
    heart(c, -74, -300 - 10 * u, 18, HEX.pink); heart(c, 74, -306 - 10 * (1 - u), 18, HEX.pink);
  } else { // a wedding made complete: a flower garland with a gold ring in it, on a velvet stand
    c.fillStyle = '#5a1030'; c.beginPath(); c.moveTo(-20, 0); c.lineTo(20, 0); c.lineTo(10, -170); c.lineTo(-10, -170); c.closePath(); c.fill();
    c.beginPath(); c.ellipse(0, -170, 40, 12, 0, 0, TAU); c.fill();
    const cx = 0, cy = -290, r = 100;
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * TAU, px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r * 0.9;
      c.fillStyle = ['#ff5a5f', '#ffd23f', '#ff8ac0', '#ffffff'][i % 4]!;
      for (let p = 0; p < 5; p++) { const b = (p / 5) * TAU + i; c.beginPath(); c.ellipse(px + Math.cos(b) * 10, py + Math.sin(b) * 10, 11, 7, b, 0, TAU); c.fill(); }
      c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(px, py, 5, 0, TAU); c.fill();
      if (i % 3 === 0) { c.fillStyle = '#2e8a4a'; c.beginPath(); c.ellipse(px + 14, py + 10, 12, 5, a, 0, TAU); c.fill(); }
    }
    // the ring hanging in the middle (the ring of bulbs, the zero, the stone's hole)
    c.strokeStyle = HEX.gold; c.lineWidth = 3; c.beginPath(); c.moveTo(cx, cy - r * 0.9); c.lineTo(cx, cy - 10); c.stroke();
    c.lineWidth = 12; c.beginPath(); c.arc(cx, cy + 20, 30, 0, TAU); c.stroke();
    g.strokeStyle = rgbaHex(HEX.gold, 0.5); g.lineWidth = 20;
    const m = c.getTransform(); g.save(); g.setTransform(m); g.beginPath(); g.arc(cx, cy + 20, 30, 0, TAU); g.stroke(); g.restore();
    star4(c, cx + 26, cy - 4, 14 + 6 * Math.sin(t * 8), '#ffffff');
  }
}

// ------------------------------------------------------------------ the Rich List

/** A podium: gold front with its rank in a laurel, height h, top at (x, top). */
export function podium(c: C2, g: C2, x: number, top: number, w: number, h: number, rank: number, lit: number) {
  c.save();
  const pg = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  pg.addColorStop(0, '#9a6a1a'); pg.addColorStop(0.5, '#f6c453'); pg.addColorStop(1, '#8a5a12');
  c.fillStyle = '#5a3a0a'; c.fillRect(x - w / 2 - 10, top - 18, w + 20, 22);
  c.fillStyle = pg; c.fillRect(x - w / 2, top, w, h);
  c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(x - w / 2, top, w, 10);
  // laurel and rank
  const lr = Math.min(56, h * 0.36), cy = top + h * 0.52;
  c.strokeStyle = '#6a4a0a'; c.lineWidth = 5;
  for (const s of [-1, 1]) { c.beginPath(); c.arc(x, cy, lr, s < 0 ? Math.PI * 0.6 : Math.PI * 1.9, s < 0 ? Math.PI * 1.1 : Math.PI * 0.4); c.stroke(); }
  c.font = font(FAM.hook(), lr * 1.6); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#3a2408';
  c.fillText(`${rank}`, x, cy + 2);
  c.restore();
  if (lit > 0) { g.fillStyle = rgbaHex(HEX.gold, 0.12 * lit); g.fillRect(x - w / 2, top, w, h); }
}

/** A little superyacht, its waterline at (x, y), scale s. */
export function yacht(c: C2, x: number, y: number, s: number) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = '#f4f6fa';
  c.beginPath(); c.moveTo(-150, -40); c.lineTo(160, -40); c.lineTo(120, 0); c.lineTo(-130, 0); c.closePath(); c.fill();
  c.fillStyle = '#1a3a7a'; c.fillRect(-140, -18, 270, 8);
  c.fillStyle = '#e4e8f0'; c.beginPath(); c.moveTo(-100, -40); c.lineTo(80, -40); c.lineTo(50, -80); c.lineTo(-80, -80); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(-60, -80); c.lineTo(30, -80); c.lineTo(10, -110); c.lineTo(-50, -110); c.closePath(); c.fill();
  c.fillStyle = '#2a3a5a'; for (let k = 0; k < 6; k++) c.fillRect(-80 + k * 24, -66, 16, 12);
  c.strokeStyle = '#c9ccd6'; c.lineWidth = 4; c.beginPath(); c.moveTo(-20, -110); c.lineTo(-20, -170); c.stroke();
  c.restore();
}

/** A gold bar (a 400 oz good-delivery bar), stamped, at (x, y) its base centre, scale s. */
export function goldBar(c: C2, g: C2, x: number, y: number, s: number, t: number) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = '#b8862a'; c.beginPath(); c.moveTo(-120, 0); c.lineTo(120, 0); c.lineTo(96, -40); c.lineTo(-96, -40); c.closePath(); c.fill();
  c.fillStyle = '#f6c453'; c.beginPath(); c.moveTo(-96, -40); c.lineTo(96, -40); c.lineTo(80, -76); c.lineTo(-80, -76); c.closePath(); c.fill();
  c.fillStyle = '#ffe08a'; c.beginPath(); c.moveTo(-80, -76); c.lineTo(80, -76); c.lineTo(70, -82); c.lineTo(-70, -82); c.closePath(); c.fill();
  c.font = font(FAM.monoB(), 16); c.fillStyle = '#8a5a12'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('999.9 · 12.4 kg', 0, -58);
  c.restore();
  star4(c, x + 70 * s, y - 70 * s, (12 + 6 * Math.sin(t * 7)) * s, '#ffffff');
  g.fillStyle = rgbaHex(HEX.gold, 0.1); g.beginPath(); g.ellipse(x, y - 40 * s, 140 * s, 60 * s, 0, 0, TAU); g.fill();
}

/** The caption plate under a Rich List entry: rank, name, worth. */
export function richCaption(c: C2, x: number, y: number, t: number, t0: number, rank: string, name: string, worth: string) {
  if (t < t0) return;
  const u = ease.outBack(clamp((t - t0) / 0.2));
  c.save(); c.translate(x, y); c.scale(u, u);
  c.font = font(FAM.hook(), 44);
  const w = Math.max(c.measureText(`${rank} ${name}`).width, 300) + 60;
  c.fillStyle = 'rgba(14,10,24,0.92)'; c.beginPath(); c.roundRect(-w / 2, -50, w, 104, 10); c.fill();
  c.strokeStyle = HEX.gold; c.lineWidth = 4; c.stroke();
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = HEX.gold; c.fillText(`${rank} ${name}`, 0, -18);
  c.font = font(FAM.monoB(), 24); c.fillStyle = HEX.bone; c.fillText(worth, 0, 28);
  c.restore();
}

/** A spotlight cone from above onto (x, y) on the glow layer and screened on the main one. */
export function cone(c: C2, g: C2, x: number, y: number, r: number, col: string, a = 1) {
  c.save(); c.globalCompositeOperation = 'screen';
  const cg = c.createLinearGradient(x, -60, x, y);
  cg.addColorStop(0, rgbaHex(col, 0.05 * a)); cg.addColorStop(1, rgbaHex(col, 0.32 * a));
  c.fillStyle = cg; c.beginPath(); c.moveTo(x - 20, -60); c.lineTo(x + 20, -60); c.lineTo(x + r, y); c.lineTo(x - r, y); c.closePath(); c.fill();
  c.restore();
  g.fillStyle = rgbaHex(col, 0.3 * a); g.beginPath(); g.ellipse(x, y, r, r * 0.2, 0, 0, TAU); g.fill();
}

export { frameIdx, h01 };
