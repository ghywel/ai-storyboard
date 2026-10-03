// Manga and comic-book language for a character's acting (the director's note that started it: "big exaggerated
// cartoon emotions, and lines of force, animated, used in both anime and super hero comic book panels"; a sudden chibi
// shift is "hilarious and delightful").
// The vocabulary is anime's manpu (emotion symbols: the anger vein, the sweat drop, gloom lines, sparkles, hearts,
// steam, !?), shuchusen (focus lines), speed lines, impact bursts, reaction backgrounds and panels.
// Canvas2D, logical 1920x1080, y down. Everything is a pure function of t (flicker keyed to frameIdx).
import { W, H } from '../engine/gl';
import { font } from '../engine/type';
import { frameIdx, clamp, ease } from '../engine/util';
import { h01 } from './_hash';

export type C2 = CanvasRenderingContext2D;
const TAU = Math.PI * 2;

/** An overshooting pop for things that appear at t0: 0 before, overshoots to ~1.2, settles to 1. */
export function popIn(t: number, t0: number, dur = 0.18): number {
  if (t < t0) return 0;
  return ease.outBack(clamp((t - t0) / dur), 2.6);
}

/**
 * Focus lines (shuchusen): wedges from beyond the frame converging on (cx, cy), stopping at an inner ring of radius
 * `inner`; they re-randomise every 2 frames like hand-drawn animation.
 */
export function focusLines(c: C2, cx: number, cy: number, inner: number, color: string, t: number, o: { n?: number; width?: number; jitter?: number; alpha?: number } = {}) {
  const n = o.n ?? 90, w = o.width ?? 0.012, k = Math.floor(frameIdx(t) / 2), R = Math.hypot(W, H);
  c.save();
  c.globalAlpha *= o.alpha ?? 1;
  c.fillStyle = color;
  c.beginPath();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + (h01(i, k, 31) - 0.5) * 0.05;
    const r0 = inner * (1 + (o.jitter ?? 0.45) * h01(i, k, 32));
    const ww = w * (0.4 + h01(i, k, 33));
    c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    c.lineTo(cx + Math.cos(a - ww) * R, cy + Math.sin(a - ww) * R);
    c.lineTo(cx + Math.cos(a + ww) * R, cy + Math.sin(a + ww) * R);
    c.closePath();
  }
  c.fill();
  c.restore();
}

/** Speed lines: streaks across the frame at `angle` (radians), in a band, moving with t. */
export function speedLines(c: C2, angle: number, color: string, t: number, o: { n?: number; speed?: number; alpha?: number; band?: [number, number] } = {}) {
  const n = o.n ?? 60, sp = o.speed ?? 3000, [b0, b1] = o.band ?? [0, H];
  c.save();
  c.globalAlpha *= o.alpha ?? 0.8;
  c.translate(W / 2, H / 2); c.rotate(angle); c.translate(-W / 2, -H / 2);
  c.strokeStyle = color; c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const y = b0 + (b1 - b0) * h01(i, 41) * 1.0;
    const len = 120 + 520 * h01(i, 42);
    const x = ((h01(i, 43) * (W + 1400) + t * sp * (0.6 + 0.8 * h01(i, 44))) % (W + 1400)) - 700;
    c.lineWidth = 1.5 + 5 * h01(i, 45);
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + len, y); c.stroke();
  }
  c.restore();
}

/** A jagged comic impact burst (POW star) of radius r, `spikes` points, wobbling on 2s. */
export function impactBurst(c: C2, cx: number, cy: number, r: number, fill: string, stroke: string, t: number, spikes = 14) {
  const k = Math.floor(frameIdx(t) / 2);
  c.save();
  c.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * TAU;
    const rr = i % 2 === 0 ? r * (0.95 + 0.15 * h01(i, k, 51)) : r * (0.62 + 0.08 * h01(i, k, 52));
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.82;
    if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
  }
  c.closePath();
  c.fillStyle = fill; c.fill();
  c.lineJoin = 'miter'; c.lineWidth = r * 0.05; c.strokeStyle = stroke; c.stroke();
  c.restore();
}

/** Reaction backgrounds: 'stripes' (diagonal), 'tone' (screentone dots), 'rays' (gloomy vertical streaks), 'flat'. */
export function reactionBg(c: C2, kind: 'stripes' | 'tone' | 'rays' | 'flat', a: string, b: string, t = 0) {
  c.fillStyle = a; c.fillRect(0, 0, W, H);
  c.fillStyle = b;
  if (kind === 'stripes') {
    const s = 70, off = (t * 120) % (2 * s);
    c.beginPath();
    for (let x = -H - 2 * s; x < W + 2 * s; x += 2 * s) {
      c.moveTo(x + off, 0); c.lineTo(x + off + s, 0); c.lineTo(x + off + s + H, H); c.lineTo(x + off + H, H); c.closePath();
    }
    c.fill();
  } else if (kind === 'tone') {
    c.beginPath();
    for (let y = 0; y < H + 20; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < W + 16; x += 16) { c.moveTo(x + 3.5, y); c.arc(x, y, 3.5, 0, TAU); }
    c.fill();
  } else if (kind === 'rays') {
    const k = Math.floor(frameIdx(t) / 3);
    for (let i = 0; i < 70; i++) {
      const x = h01(i, k, 61) * W, w = 2 + 10 * h01(i, k, 62), y1 = H * (0.3 + 0.7 * h01(i, k, 63));
      c.fillRect(x, 0, w, y1);
    }
  }
}

/**
 * Comic panels: rectangles (or any quads as 4 points) with white gutters and ink borders; `draw(i)` paints panel i
 * inside its clip (draw in full-frame coordinates; the clip does the framing).
 */
export function panels(c: C2, quads: [number, number][][], draw: (i: number) => void, o: { gutter?: string; border?: string; bw?: number } = {}) {
  quads.forEach((q, i) => {
    c.save();
    c.beginPath(); q.forEach(([x, y], j) => (j ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath();
    c.clip();
    draw(i);
    c.restore();
  });
  c.save();
  c.lineJoin = 'miter';
  for (const q of quads) {
    c.beginPath(); q.forEach(([x, y], j) => (j ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath();
    c.lineWidth = (o.bw ?? 6) + 16; c.strokeStyle = o.gutter ?? '#f4f1ea'; c.stroke();
    c.lineWidth = o.bw ?? 6; c.strokeStyle = o.border ?? '#120d1d'; c.stroke();
  }
  c.restore();
}

// ------------------------------------------------------------------ the emotion marks (manpu)

export type Mark = 'vein' | 'sweat' | 'sparkle' | 'hearts' | 'gloom' | 'steam' | '!' | '?' | '!?' | 'zzz' | 'notes' | 'shine';

/** Where a character's head, heart and feet are, in canvas px (a character rig returns these; marks attach to them). */
export interface Anchors { head: { x: number; y: number; r: number }; heart: { x: number; y: number; r: number }; feet: { x: number; y: number } }

/** Draw manga marks around a character's head; each pops in at t0. */
export function drawMarks(c: C2, a: Anchors, marks: Mark[], t: number, t0 = -1e9) {
  const { x, y, r } = a.head;
  const p = popIn(t, t0);
  if (p <= 0) return;
  for (const m of marks) {
    c.save();
    switch (m) {
      case 'vein': { // the cross-popping vein, pulsing
        const s = r * 0.32 * p * (1 + 0.12 * Math.sin(t * 18));
        veinMark(c, x + r * 0.62, y - r * 0.62, s);
        break;
      }
      case 'sweat': { // the big sweat drop, sliding a little
        const s = r * 0.3 * p, dy = ((t - t0) * r * 0.12) % (r * 0.3);
        sweatDrop(c, x - r * 0.82, y - r * 0.35 + dy, s);
        break;
      }
      case 'sparkle':
        for (let i = 0; i < 5; i++) {
          const a0 = -2.6 + i * 0.6, rr = r * (1.25 + 0.15 * Math.sin(t * 3 + i));
          const tw = 0.5 + 0.5 * Math.sin(t * 9 + i * 1.7);
          star4(c, x + Math.cos(a0) * rr, y + Math.sin(a0) * rr * 0.9, r * (0.09 + 0.08 * tw) * p, '#fff6c8');
        }
        break;
      case 'shine': // a single twinkle at the cheek (a confident ding)
        star4(c, x + r * 0.95, y - r * 0.2, r * 0.22 * p * (0.8 + 0.2 * Math.sin(t * 10)), '#ffffff');
        break;
      case 'hearts':
        for (let i = 0; i < 4; i++) {
          const u = ((t - t0) * 0.6 + i * 0.25) % 1;
          heart(c, x + (i - 1.5) * r * 0.45 + Math.sin(t * 3 + i) * r * 0.1, y - r * (1.1 + u * 0.9), r * 0.16 * (1 - u * 0.4) * p, `rgba(255,79,154,${1 - u})`);
        }
        break;
      case 'gloom': { // vertical lines over the forehead and a dark aura
        const k = Math.floor(frameIdx(t) / 3);
        c.globalAlpha *= p;
        const g = c.createRadialGradient(x, y - r * 0.4, r * 0.2, x, y, r * 1.8);
        g.addColorStop(0, 'rgba(40,20,70,0.5)'); g.addColorStop(1, 'rgba(40,20,70,0)');
        c.fillStyle = g; c.fillRect(x - r * 2, y - r * 2, r * 4, r * 4);
        c.strokeStyle = 'rgba(70,40,120,0.85)'; c.lineCap = 'round';
        for (let i = 0; i < 9; i++) {
          const lx = x - r * 0.6 + i * r * 0.15, l = r * (0.35 + 0.25 * h01(i, k, 71));
          c.lineWidth = r * 0.035;
          c.beginPath(); c.moveTo(lx, y - r * 0.95); c.lineTo(lx, y - r * 0.95 + l); c.stroke();
        }
        break;
      }
      case 'steam': // angry puffs from both sides of the head
        for (let i = 0; i < 2; i++) {
          const side = i ? 1 : -1, u = ((t - t0) * 2.2 + i * 0.5) % 1;
          puff(c, x + side * r * (0.95 + u * 0.4), y - r * (0.7 + u * 0.5), r * (0.18 + u * 0.18) * p, `rgba(255,255,255,${0.9 * (1 - u)})`);
        }
        break;
      case '!': case '?': case '!?': {
        const s = r * 0.9 * p, bob = Math.sin(t * 10) * r * 0.04;
        c.translate(x + r * 0.9, y - r * 1.15 + bob); c.rotate(0.15);
        c.font = font('Archivo-1250-900', s); c.textAlign = 'center'; c.textBaseline = 'middle';
        c.lineWidth = s * 0.14; c.strokeStyle = '#120d1d'; c.lineJoin = 'round'; c.strokeText(m, 0, 0);
        c.fillStyle = m === '?' ? '#2fe0ff' : '#ffd23f'; c.fillText(m, 0, 0);
        break;
      }
      case 'zzz':
        for (let i = 0; i < 3; i++) {
          const u = ((t - t0) * 0.5 + i / 3) % 1;
          c.font = font('Archivo-1000-900', r * (0.25 + 0.2 * u)); c.textAlign = 'center';
          c.fillStyle = `rgba(198,220,255,${1 - u})`;
          c.fillText('z', x + r * (0.8 + u * 0.6), y - r * (0.8 + u * 0.9));
        }
        break;
      case 'notes':
        for (let i = 0; i < 3; i++) {
          const u = ((t - t0) * 0.7 + i / 3) % 1;
          c.font = font('Archivo-1000-900', r * 0.4); c.textAlign = 'center';
          c.fillStyle = `rgba(255,210,63,${1 - u})`;
          c.fillText(i % 2 ? '♪' : '♫', x - r * 0.9 + i * r * 0.9 + Math.sin(t * 4 + i) * r * 0.15, y - r * (1.1 + u));
        }
        break;
    }
    c.restore();
  }
}

/** The anger vein: four bulging arcs in a cross. */
export function veinMark(c: C2, x: number, y: number, s: number, col = '#ff3b3b') {
  c.save();
  c.translate(x, y);
  c.strokeStyle = col; c.lineWidth = s * 0.28; c.lineCap = 'round';
  for (let k = 0; k < 4; k++) {
    c.save(); c.rotate((k * Math.PI) / 2);
    c.beginPath(); c.moveTo(s * 0.18, -s * 0.6); c.quadraticCurveTo(s * 0.22, -s * 0.22, s * 0.6, -s * 0.18); c.stroke();
    c.restore();
  }
  c.restore();
}

/** The big blue sweat drop. */
export function sweatDrop(c: C2, x: number, y: number, s: number) {
  c.save();
  c.translate(x, y);
  c.beginPath();
  c.moveTo(0, -s); c.bezierCurveTo(s * 0.6, -s * 0.1, s * 0.7, s * 0.7, 0, s * 0.75); c.bezierCurveTo(-s * 0.7, s * 0.7, -s * 0.6, -s * 0.1, 0, -s);
  c.fillStyle = '#9fdcff'; c.fill();
  c.lineWidth = s * 0.08; c.strokeStyle = '#2b6fb8'; c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.85)';
  c.beginPath(); c.ellipse(-s * 0.18, s * 0.25, s * 0.1, s * 0.2, -0.3, 0, TAU); c.fill();
  c.restore();
}

/** A four-point star (sparkle). */
export function star4(c: C2, x: number, y: number, s: number, col: string) {
  c.save();
  c.translate(x, y);
  c.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU, r = i % 2 === 0 ? s : s * 0.22;
    if (i === 0) c.moveTo(Math.cos(a) * r, Math.sin(a) * r); else c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  c.closePath();
  c.shadowColor = col; c.shadowBlur = s * 1.2;
  c.fillStyle = col; c.fill();
  c.restore();
}

/** A heart, centred at (x, y), size s. */
export function heart(c: C2, x: number, y: number, s: number, col: string) {
  c.save();
  c.translate(x, y);
  c.beginPath();
  c.moveTo(0, s * 0.35);
  c.bezierCurveTo(-s * 1.1, -s * 0.35, -s * 0.5, -s * 1.05, 0, -s * 0.45);
  c.bezierCurveTo(s * 0.5, -s * 1.05, s * 1.1, -s * 0.35, 0, s * 0.35);
  c.fillStyle = col; c.fill();
  c.restore();
}

/** A cartoon puff of cloud (steam, a poof). */
export function puff(c: C2, x: number, y: number, s: number, col: string) {
  c.save();
  c.fillStyle = col;
  c.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    c.moveTo(x + Math.cos(a) * s * 0.55 + s * 0.45, y + Math.sin(a) * s * 0.45);
    c.arc(x + Math.cos(a) * s * 0.55, y + Math.sin(a) * s * 0.45, s * 0.45, 0, TAU);
  }
  c.fill();
  c.restore();
}

/** A poof (puff ring and sparkles) for a chibi pop at t0, centred at (x, y), radius r; gone after 0.35 s. */
export function poof(c: C2, x: number, y: number, r: number, t: number, t0: number) {
  const u = (t - t0) / 0.35;
  if (u < 0 || u > 1) return;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + 0.3;
    puff(c, x + Math.cos(a) * r * (0.6 + u * 0.6), y + Math.sin(a) * r * (0.6 + u * 0.6), r * 0.3 * (1 - u * 0.5), `rgba(255,255,255,${0.9 * (1 - u)})`);
  }
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU;
    star4(c, x + Math.cos(a) * r * (0.9 + u), y + Math.sin(a) * r * (0.9 + u), r * 0.12 * (1 - u), '#fff6c8');
  }
}

/** Face lines for shock or dread: blue vertical hatching over the upper half of the head. */
export function faceLines(c: C2, a: Anchors, t: number, col = 'rgba(70,90,200,0.75)') {
  const { x, y, r } = a.head;
  c.save();
  c.beginPath(); c.arc(x, y, r * 0.95, 0, TAU); c.clip();
  c.strokeStyle = col; c.lineCap = 'round'; c.lineWidth = r * 0.03;
  for (let i = 0; i < 11; i++) {
    const lx = x - r * 0.65 + i * r * 0.13;
    c.beginPath(); c.moveTo(lx, y - r); c.lineTo(lx, y - r * (0.35 + 0.1 * Math.sin(i * 1.7))); c.stroke();
  }
  c.restore();
}
