// The `today` plate's props (the places are in today-world.ts): the delivery rider and the noodle carton, the home
// bowl whose steam can curl into a heart, notes of music, the guitar, the car, the lifeboat and the storm sea, a bolt
// of lightning, code, the racks in a ring with the stone of light, and the Ledger's endless scroll.
import { W, H } from '../engine/gl';
import { HEX } from '../engine/palette';
import { font } from '../engine/type';
import { ease } from '../engine/util';
import { h01 } from './_rai';
import { FAM, TAU, mixHex, rgbaHex, type C2 } from './_motifs';

// ------------------------------------------------------------------ people (faceless) and their things

/** A delivery rider on a bicycle, side view, facing right; feet on the road at y. A box on the back, a bag on the bars. */
export function rider(c: C2, x: number, y: number, s: number, t: number, col: string, box: string) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.strokeStyle = col; c.fillStyle = col; c.lineCap = 'round'; c.lineJoin = 'round';
  const wr = 34, rear = [-52, -wr], front = [54, -wr], bb = [0, -wr - 4];
  const spin = t * 9;
  for (const [hx, hy] of [rear, front]) {
    c.lineWidth = 6; c.beginPath(); c.arc(hx!, hy!, wr, 0, TAU); c.stroke();
    c.lineWidth = 1.5; c.beginPath();
    for (let k = 0; k < 6; k++) { const a = spin + (k * Math.PI) / 3; c.moveTo(hx!, hy!); c.lineTo(hx! + Math.cos(a) * wr, hy! + Math.sin(a) * wr); }
    c.stroke();
  }
  const seat = [-16, -84], bar = [42, -92];
  c.lineWidth = 5;
  c.beginPath(); c.moveTo(rear[0]!, rear[1]!); c.lineTo(seat[0]!, seat[1]!); c.lineTo(bb[0]!, bb[1]!); c.lineTo(rear[0]!, rear[1]!);
  c.moveTo(bb[0]!, bb[1]!); c.lineTo(bar[0]! - 6, bar[1]! + 10); c.lineTo(seat[0]!, seat[1]!); c.moveTo(bar[0]! - 6, bar[1]! + 10); c.lineTo(front[0]!, front[1]!); c.stroke();
  c.lineWidth = 5; c.beginPath(); c.moveTo(bar[0]! - 8, bar[1]!); c.lineTo(bar[0]! + 6, bar[1]! - 4); c.stroke();
  // legs pedalling
  const a = t * 9;
  c.lineWidth = 9;
  for (const ph of [0, Math.PI]) {
    const px = bb[0]! + Math.cos(a + ph) * 15, py = bb[1]! + Math.sin(a + ph) * 15;
    const hx = seat[0]! + 2, hy = seat[1]! - 6, mx = (hx + px) / 2 + 16, my = (hy + py) / 2 - 8;
    c.beginPath(); c.moveTo(hx, hy); c.lineTo(mx, my); c.lineTo(px, py); c.stroke();
  }
  // torso leaning forward, the head in a helmet, arms to the bars
  c.beginPath(); c.moveTo(-26, -86); c.quadraticCurveTo(-24, -128, 10, -142); c.lineTo(22, -130); c.quadraticCurveTo(0, -110, 0, -84); c.closePath(); c.fill();
  c.beginPath(); c.arc(26, -154, 13, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(24, -160, 16, 10, -0.2, Math.PI, TAU); c.fill();
  c.lineWidth = 7; c.beginPath(); c.moveTo(12, -136); c.lineTo(32, -112); c.lineTo(bar[0]!, bar[1]! - 2); c.stroke();
  // the delivery box on the back
  c.save(); c.translate(-30, -150); c.rotate(-0.25);
  c.fillStyle = box; c.fillRect(-26, -24, 48, 46);
  c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.moveTo(-26, -24); c.lineTo(-14, -34); c.lineTo(34, -34); c.lineTo(22, -24); c.closePath(); c.fill();
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.moveTo(22, -24); c.lineTo(34, -34); c.lineTo(34, 12); c.lineTo(22, 22); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(-22, 10, 40, 4);
  c.restore();
  c.fillStyle = '#ffffff'; c.beginPath(); c.arc(bar[0]! + 8, bar[1]! + 8, 5, 0, TAU); c.fill();
  c.fillStyle = '#ff3040'; c.beginPath(); c.arc(seat[0]! - 30, seat[1]! + 6, 4, 0, TAU); c.fill();
  // the bag on the bars, swinging
  c.save(); c.translate(bar[0]! - 2, bar[1]! + 2); c.rotate(0.15 * Math.sin(t * 6));
  c.strokeStyle = 'rgba(244,241,234,0.85)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-6, 0); c.lineTo(-10, 16); c.moveTo(6, 0); c.lineTo(10, 16); c.stroke();
  c.fillStyle = 'rgba(244,241,234,0.85)'; c.beginPath(); c.roundRect(-14, 14, 28, 26, 5); c.fill();
  c.restore();
  c.restore();
}

/** A takeaway noodle carton (folded top, chopsticks) at (x, y) bottom-centre, size s (its height). */
export function carton(c: C2, x: number, y: number, s: number, o: { col?: string; band?: string; rot?: number } = {}) {
  c.save(); c.translate(x, y); c.rotate(o.rot ?? 0);
  const k = s / 100;
  c.lineWidth = 5 * k; c.strokeStyle = HEX.ink; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-10 * k, -96 * k); c.lineTo(-30 * k, -150 * k); c.moveTo(4 * k, -96 * k); c.lineTo(-6 * k, -156 * k); c.stroke();
  c.fillStyle = o.col ?? HEX.bone;
  c.beginPath(); c.moveTo(-36 * k, 0); c.lineTo(36 * k, 0); c.lineTo(50 * k, -84 * k); c.lineTo(-50 * k, -84 * k); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(-50 * k, -84 * k); c.lineTo(-34 * k, -106 * k); c.lineTo(-10 * k, -88 * k); c.lineTo(10 * k, -88 * k); c.lineTo(34 * k, -106 * k); c.lineTo(50 * k, -84 * k); c.closePath(); c.fill();
  c.fillStyle = o.band ?? HEX.coral; c.fillRect(-42 * k, -52 * k, 84 * k, 14 * k);
  c.strokeStyle = 'rgba(18,13,29,0.5)'; c.lineWidth = 3 * k;
  c.beginPath(); c.moveTo(-50 * k, -84 * k); c.lineTo(50 * k, -84 * k); c.stroke();
  c.restore();
}

/** A home bowl of noodles with steam, at (x, y) the bowl's rim centre, radius r. */
export function bowl(c: C2, x: number, y: number, r: number, t: number, o: { col?: string; steam?: string; heart?: number; heartCol?: string } = {}) {
  c.save(); c.translate(x, y);
  // steam (or, with `heart`, steam curling into a heart)
  const st = o.steam ?? 'rgba(244,241,234,0.6)';
  c.strokeStyle = st; c.lineWidth = r * 0.06; c.lineCap = 'round';
  const hk = o.heart ?? 0;
  for (let k = -1; k <= 1; k++) {
    c.beginPath();
    for (let i = 0; i <= 20; i++) {
      const u = i / 20, yy = -r * 0.2 - u * r * 1.6;
      const xx = k * r * 0.35 + Math.sin(u * 6 + t * 3 + k) * r * 0.12 * (1 - hk);
      if (i === 0) c.moveTo(xx, yy); else c.lineTo(xx, yy);
    }
    c.globalAlpha = 1 - hk; c.stroke();
  }
  c.globalAlpha = 1;
  if (hk > 0) {
    const s = r * 0.55 * ease.outBack(hk), cy = -r * 1.25;
    c.fillStyle = rgbaHex(o.heartCol ?? HEX.pink, hk);
    c.beginPath(); c.moveTo(0, cy + s * 0.9);
    c.bezierCurveTo(-s * 1.6, cy - s * 0.2, -s * 0.6, cy - s * 1.3, 0, cy - s * 0.45);
    c.bezierCurveTo(s * 0.6, cy - s * 1.3, s * 1.6, cy - s * 0.2, 0, cy + s * 0.9); c.fill();
  }
  // noodles, then the bowl over them
  c.strokeStyle = '#ffd98a'; c.lineWidth = r * 0.05;
  for (let k = 0; k < 7; k++) { c.beginPath(); c.moveTo(-r * 0.8, -r * 0.02 + k * 2); c.bezierCurveTo(-r * 0.3, -r * 0.25, r * 0.2, r * 0.15, r * 0.8, -r * 0.05 + k * 2 * Math.sin(k)); c.stroke(); }
  c.fillStyle = o.col ?? HEX.bone;
  c.beginPath(); c.moveTo(-r, 0); c.quadraticCurveTo(-r, r * 0.9, 0, r * 0.9); c.quadraticCurveTo(r, r * 0.9, r, 0); c.closePath(); c.fill();
  c.fillStyle = HEX.ink; c.globalAlpha = 0.25; c.fillRect(-r * 0.3, r * 0.88, r * 0.6, r * 0.12); c.globalAlpha = 1;
  c.strokeStyle = HEX.pink; c.lineWidth = r * 0.06; c.beginPath(); c.moveTo(-r * 0.9, r * 0.22); c.quadraticCurveTo(0, r * 0.4, r * 0.9, r * 0.22); c.stroke();
  c.restore();
}

/** A music note (♪) drawn, not set (no font dependency). */
export function note(c: C2, x: number, y: number, s: number, col: string, double = false) {
  c.fillStyle = col; c.strokeStyle = col; c.lineWidth = s * 0.12; c.lineCap = 'round';
  c.beginPath(); c.ellipse(x, y, s * 0.36, s * 0.26, -0.4, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(x + s * 0.3, y - s * 0.06); c.lineTo(x + s * 0.3, y - s * 1.1); c.stroke();
  if (double) {
    c.beginPath(); c.ellipse(x + s * 0.8, y - s * 0.14, s * 0.36, s * 0.26, -0.4, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(x + s * 1.1, y - s * 0.2); c.lineTo(x + s * 1.1, y - s * 1.24); c.stroke();
    c.lineWidth = s * 0.2; c.beginPath(); c.moveTo(x + s * 0.3, y - s * 1.06); c.lineTo(x + s * 1.1, y - s * 1.2); c.stroke();
  } else {
    c.beginPath(); c.moveTo(x + s * 0.3, y - s * 1.1); c.quadraticCurveTo(x + s * 0.8, y - s * 0.8, x + s * 0.7, y - s * 0.4); c.stroke();
  }
}

/** Notes rising along a curve from (x0, y0) to (x1, y1), flowing with t. */
export function noteStream(c: C2, t: number, x0: number, y0: number, x1: number, y1: number, cols: string[], n = 10, size = 40) {
  for (let i = 0; i < n; i++) {
    const u = (h01(i, 721) + t * 0.45) % 1;
    const x = x0 + (x1 - x0) * u + Math.sin(u * 7 + i) * 30, y = y0 + (y1 - y0) * u - Math.sin(u * Math.PI) * 120;
    c.globalAlpha = Math.sin(u * Math.PI);
    note(c, x, y, size * (0.7 + 0.5 * h01(i, 722)), cols[i % cols.length]!, h01(i, 723) < 0.4);
  }
  c.globalAlpha = 1;
}

/** A car in side silhouette facing right, wheels on y; headlight beam into the glow layer. */
export function car(c: C2, g: C2 | null, x: number, y: number, s: number, t: number, col: string) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = col;
  c.beginPath(); c.moveTo(-150, -24); c.lineTo(-146, -64); c.lineTo(-90, -70); c.lineTo(-56, -112); c.lineTo(50, -112); c.lineTo(96, -70); c.lineTo(150, -60); c.lineTo(156, -24); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,214,140,0.5)';
  c.beginPath(); c.moveTo(-46, -104); c.lineTo(-6, -104); c.lineTo(-6, -74); c.lineTo(-74, -74); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(4, -104); c.lineTo(46, -104); c.lineTo(80, -74); c.lineTo(4, -74); c.closePath(); c.fill();
  c.fillStyle = HEX.ink;
  for (const wx of [-92, 98]) { c.beginPath(); c.arc(wx, -22, 24, 0, TAU); c.fill(); c.fillStyle = '#5b5470'; c.beginPath(); c.arc(wx, -22, 10, 0, TAU); c.fill(); c.fillStyle = HEX.ink; }
  c.restore();
  if (g) {
    const gr = g.createLinearGradient(x + 150 * s, 0, x + 700 * s, 0);
    gr.addColorStop(0, 'rgba(255,240,190,0.45)'); gr.addColorStop(1, 'rgba(255,240,190,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(x + 150 * s, y - 52 * s); g.lineTo(x + 700 * s, y - 120 * s); g.lineTo(x + 700 * s, y + 20 * s); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,90,95,0.8)'; g.beginPath(); g.arc(x - 148 * s, y - 50 * s, 6 * s, 0, TAU); g.fill();
  }
}

/** A guitar (for the flashback), held across the body; centre of the body at (x, y). */
export function guitar(c: C2, x: number, y: number, s: number, rot: number, col: string) {
  c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = col; c.strokeStyle = col;
  c.beginPath(); c.arc(0, 0, 40 * s, 0, TAU); c.arc(46 * s, 0, 30 * s, 0, TAU); c.fill();
  c.lineWidth = 12 * s; c.beginPath(); c.moveTo(60 * s, 0); c.lineTo(190 * s, 0); c.stroke();
  c.fillRect(186 * s, -12 * s, 30 * s, 24 * s);
  c.fillStyle = 'rgba(18,13,29,0.6)'; c.beginPath(); c.arc(30 * s, 0, 12 * s, 0, TAU); c.fill();
  c.restore();
}

/** A lifeboat (orange hull, cabin, crew), centre at (x, y) on the water, tilted. */
export function lifeboat(c: C2, g: C2 | null, x: number, y: number, s: number, rot: number, t: number) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.fillStyle = HEX.bone;
  c.beginPath(); c.roundRect(-70, -96, 120, 70, 8); c.fill();
  c.fillStyle = HEX.ink; for (let k = 0; k < 3; k++) c.fillRect(-58 + k * 36, -84, 24, 20);
  c.fillStyle = HEX.ink; c.fillRect(-12, -150, 6, 56);
  c.fillStyle = HEX.orange;
  c.beginPath(); c.moveTo(-180, -30); c.lineTo(190, -40); c.lineTo(150, 30); c.lineTo(-150, 30); c.closePath(); c.fill();
  c.fillStyle = HEX.ink; c.fillRect(-160, 6, 300, 8);
  c.fillStyle = '#1a1430';
  for (const px of [-130, 80, 130]) { c.beginPath(); c.arc(px, -64, 11, 0, TAU); c.fill(); c.beginPath(); c.roundRect(px - 12, -54, 24, 26, 5); c.fill(); }
  c.restore();
  if (g) {
    const a = rot - 0.12 + 0.06 * Math.sin(t * 2);
    const bx = x + Math.cos(rot) * 150 * s - Math.sin(rot) * -120 * s, by = y + Math.sin(rot) * 150 * s + Math.cos(rot) * -120 * s;
    const L = 1200;
    const gr = g.createLinearGradient(bx, by, bx + Math.cos(a) * L, by + Math.sin(a) * L);
    gr.addColorStop(0, 'rgba(255,250,220,0.55)'); gr.addColorStop(1, 'rgba(255,250,220,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(bx, by);
    g.lineTo(bx + Math.cos(a - 0.12) * L, by + Math.sin(a - 0.12) * L); g.lineTo(bx + Math.cos(a + 0.12) * L, by + Math.sin(a + 0.12) * L); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,250,220,0.9)'; g.beginPath(); g.arc(bx, by, 8 * s, 0, TAU); g.fill();
  }
}

/** Big storm waves: layered filled crests from `top` down, rough 0..1. */
export function stormSea(c: C2, t: number, top: number, cols: string[], rough = 1) {
  cols.forEach((col, i) => {
    const y0 = top + i * 70, amp = (40 + 60 * rough) * (1 - i * 0.18);
    c.fillStyle = col;
    c.beginPath(); c.moveTo(-50, H + 50);
    for (let x = -50; x <= W + 50; x += 20) c.lineTo(x, y0 + amp * Math.sin(x * 0.006 + t * (1.2 + 0.3 * i) + i * 2) + 0.35 * amp * Math.sin(x * 0.017 - t * 2 + i));
    c.lineTo(W + 50, H + 50); c.closePath(); c.fill();
  });
}

/** A lightning bolt from (x, y) downwards. */
export function bolt(g: C2, x: number, y: number, len: number, seed: number, a = 1) {
  g.strokeStyle = `rgba(255,252,235,${a})`; g.lineWidth = 7; g.lineJoin = 'miter';
  g.beginPath(); g.moveTo(x, y);
  let bx = x, by = y;
  for (let k = 0; k < 8; k++) { bx += (h01(k, seed, 741) - 0.5) * 120; by += len / 8; g.lineTo(bx, by); }
  g.stroke();
}

// ------------------------------------------------------------------ machines

const TOKENS = ['fn', 'let', 'if', 'else', 'return', 'for', 'while', '{', '}', '(', ')', '=>', '==', '!=', '0x1f', 'nil', 'buf', 'len', 'ptr', 'free', 'alloc', 'parse', 'hash', 'sync', 'lock', 'unlock', 'retry', 'err', 'ok', 'i++', '// fix', '// TODO', 'patch', 'merge', 'queue', 'socket', 'read', 'write', 'utf8', 'tls'];
/** Lines of code (generic tokens), deterministic per line index. */
export function codeLine(i: number): string {
  const n = 3 + Math.floor(h01(i, 751) * 7), ind = Math.floor(h01(i, 752) * 4);
  let s = '  '.repeat(ind);
  for (let k = 0; k < n; k++) s += TOKENS[Math.floor(h01(i, k, 753) * TOKENS.length)]! + ' ';
  return s;
}

/** A wall of scrolling code in a rect. */
export function codeWall(c: C2, t: number, x: number, y: number, w: number, h: number, col: string, size = 26, speed = 3) {
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  c.font = font(FAM.mono(), size); c.textAlign = 'left'; c.textBaseline = 'top';
  const lh = size * 1.35, off = t * speed * lh, first = Math.floor(off / lh);
  for (let k = 0; k < Math.ceil(h / lh) + 2; k++) {
    const i = first + k, yy = y + k * lh - (off % lh);
    c.fillStyle = h01(i, 754) < 0.12 ? HEX.pink : h01(i, 755) < 0.25 ? HEX.yellow : col;
    c.fillText(codeLine(i), x + 10, yy);
  }
  c.restore();
}

/** A server rack (front), blinking LEDs. */
export function rack(c: C2, x: number, y: number, w: number, h: number, t: number, seed: number, o: { body?: string; led?: string; glow?: C2 | null } = {}) {
  c.fillStyle = o.body ?? '#262a62'; c.fillRect(x, y, w, h);
  c.strokeStyle = 'rgba(111,140,255,0.45)'; c.lineWidth = Math.max(1, w * 0.02); c.strokeRect(x, y, w, h);
  const n = 9, sh = h / n;
  for (let k = 0; k < n; k++) {
    c.fillStyle = 'rgba(111,140,255,0.18)'; c.fillRect(x + w * 0.08, y + k * sh + sh * 0.15, w * 0.84, sh * 0.7);
    for (let j = 0; j < 3; j++) {
      const on = h01(seed, k, j + Math.floor(t * (4 + 6 * h01(seed, k, 761)))) < 0.6;
      if (!on) continue;
      const lx = x + w * (0.7 + j * 0.08), ly = y + k * sh + sh * 0.5;
      const col = j === 0 ? (o.led ?? HEX.lime) : j === 1 ? HEX.cyan : HEX.yellow;
      c.fillStyle = col; c.beginPath(); c.arc(lx, ly, Math.max(1.5, w * 0.025), 0, TAU); c.fill();
      if (o.glow) { o.glow.fillStyle = rgbaHex(col, 0.5); o.glow.beginPath(); o.glow.arc(lx, ly, Math.max(3, w * 0.05), 0, TAU); o.glow.fill(); }
    }
  }
}

/** Racks standing in a ring (an ellipse seen from above the horizon), back ones first. Returns their tops. */
export function rackRing(c: C2, g: C2 | null, t: number, cx: number, cy: number, rx: number, ry: number, n: number, spin: number, size = 1): [number, number][] {
  const items = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * TAU + spin;
    return { i, a, x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry, d: Math.sin(a) };
  }).sort((p, q) => p.d - q.d);
  const tops: [number, number][] = [];
  for (const it of items) {
    const k = (0.6 + 0.4 * (it.d + 1) / 2) * size, w = 60 * k, h = 170 * k;
    c.globalAlpha = 0.55 + 0.45 * (it.d + 1) / 2;
    rack(c, it.x - w / 2, it.y - h, w, h, t, it.i, { glow: g });
    tops.push([it.x, it.y - h * 0.6]);
  }
  c.globalAlpha = 1;
  return tops;
}

/** A rai stone made of light: glowing rings (the rim, the hole) and a soft core, into the glow layer `g`. */
export function lightStone(c: C2, g: C2, x: number, y: number, r: number, t: number, a = 1, col: string = HEX.cyan) {
  const hy = y + r * 0.08, hr = r * 0.3;
  const gr = g.createRadialGradient(x, y, r * 0.2, x, y, r * 1.6);
  gr.addColorStop(0, rgbaHex(col, 0.35 * a)); gr.addColorStop(1, rgbaHex(col, 0));
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * 1.6, 0, TAU); g.fill();
  c.save(); c.globalAlpha = a;
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.moveTo(x + hr, hy); c.arc(x, hy, hr, 0, TAU);
  c.fillStyle = rgbaHex(col, 0.25); c.fill('evenodd');
  c.strokeStyle = mixHex(col, '#ffffff', 0.5); c.lineWidth = r * 0.05;
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
  c.beginPath(); c.arc(x, hy, hr, 0, TAU); c.stroke();
  // a wireframe of latitude lines
  c.lineWidth = r * 0.015; c.strokeStyle = rgbaHex('#ffffff', 0.5);
  for (let k = 1; k < 4; k++) { const rr = hr + (r - hr) * (k / 4); c.beginPath(); c.ellipse(x, y + (hy - y) * (1 - k / 4), rr, rr * (0.96 + 0.04 * Math.sin(t * 2 + k)), 0, 0, TAU); c.stroke(); }
  c.restore();
  g.strokeStyle = rgbaHex(col, 0.7 * a); g.lineWidth = r * 0.06;
  g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke();
  g.beginPath(); g.arc(x, hy, hr, 0, TAU); g.stroke();
}

// ------------------------------------------------------------------ the Ledger's long scroll

export interface Row { who: string; what: string; whom: string; value: string; care: boolean }
const PAID: [string, string, string, string][] = [
  ['RIDER', 'delivered noodles', 'YOU', '£14.50'], ['SHOP', 'sold a coat', 'A STRANGER', '£60.00'], ['BANK', 'lent a mortgage', 'A COUPLE', '£210,000'],
  ['TRADER', 'shipped stones', 'THE ISLAND', '£1,200'], ['PLUMBER', 'fixed a leak', 'A FLAT', '£95.00'], ['CAFE', 'sold a flat white', 'A COMMUTER', '£3.40'],
  ['DRIVER', 'drove a cab', 'A STRANGER', '£22.00'], ['NURSERY', 'minded a child', 'A FAMILY', '£68.00'], ['MINER', 'hashed a block', 'THE CHAIN', '£180.00'],
];
const CARE: [string, string, string][] = [
  ['DAD', 'cooked the same bowl', 'HIS KIDS'], ['DAUGHTER', 'sang to her father', 'HER FATHER'], ['CREW', 'went into the storm', 'A SAILOR'],
  ['SOMEONE', 'kept the code up', 'EVERYONE'], ['MOTHER', 'sat up with a fever', 'HER CHILD'], ['NEIGHBOUR', 'gave a lift at three', 'AN OLD MAN'],
  ['GRANDAD', 'told the stone story', 'A CHILD'],
];
/** Row i of the endless record: paid rows and care rows interleaved, deterministic. */
export function recordRow(i: number): Row {
  const j = ((i % 1000) + 1000) % 1000;
  if (h01(j, 771) < 0.42) { const k = CARE[Math.floor(h01(j, 772) * CARE.length)]!; return { who: k[0], what: k[1], whom: k[2], value: '0', care: true }; }
  const k = PAID[Math.floor(h01(j, 773) * PAID.length)]!;
  return { who: k[0], what: k[1], whom: k[2], value: k[3], care: false };
}

/**
 * The record as an endless scroll in a rect: columns WHO / DID WHAT / FOR WHOM / VALUE, scrolled by `scroll` rows.
 * `careA` (0..1) is the care rows' opacity (they dim); `careDx` slides them sideways (out of the room).
 */
export function recordScroll(c: C2, x: number, y: number, w: number, h: number, scroll: number, o: { size?: number; careA?: number; careDx?: number; header?: boolean; blink?: number; t?: number; ink?: string } = {}) {
  const size = o.size ?? 26, rh = size * 1.7;
  c.save(); c.beginPath(); c.rect(x - 2000, y, w + 4000, h); c.clip();
  c.font = font(FAM.mono(), size); c.textBaseline = 'middle';
  const first = Math.floor(scroll), off = (scroll - first) * rh, top = (o.header ?? true) ? rh * 1.3 : 0;
  if (o.header ?? true) {
    c.fillStyle = 'rgba(154,163,199,0.9)'; c.font = font(FAM.monoB(), size * 0.8); c.textAlign = 'left';
    c.fillText('WHO', x + 20, y + rh * 0.6); c.fillText('DID WHAT', x + w * 0.22, y + rh * 0.6); c.fillText('FOR WHOM', x + w * 0.58, y + rh * 0.6);
    c.textAlign = 'right'; c.fillText('VALUE', x + w - 20, y + rh * 0.6);
    c.strokeStyle = 'rgba(154,163,199,0.4)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 10, y + rh * 1.15); c.lineTo(x + w - 10, y + rh * 1.15); c.stroke();
    c.font = font(FAM.mono(), size);
  }
  c.save(); c.beginPath(); c.rect(x - 2000, y + top, w + 4000, h - top); c.clip();
  for (let k = -1; k < Math.ceil((h - top) / rh) + 1; k++) {
    const r = recordRow(first + k), ry = y + top + k * rh - off + rh * 0.5;
    const dx = r.care ? (o.careDx ?? 0) : 0;
    c.globalAlpha = r.care ? (o.careA ?? 1) : 1;
    c.textAlign = 'left'; c.fillStyle = o.ink ?? HEX.bone;
    c.fillText(r.who, x + 20 + dx, ry); c.fillText(r.what, x + w * 0.22 + dx, ry); c.fillText(r.whom, x + w * 0.58 + dx, ry);
    c.textAlign = 'right';
    if (r.care) {
      const bl = (o.blink ?? 0) > 0 && Math.floor((o.t ?? 0) * 4 + k) % 2 === 0 ? 0.4 : 1;
      c.globalAlpha *= bl; c.fillStyle = HEX.pink;
    } else c.fillStyle = o.ink ? '#2a7a2a' : HEX.lime;
    c.fillText(r.value, x + w - 20 + dx, ry);
  }
  c.restore();
  c.restore();
}

