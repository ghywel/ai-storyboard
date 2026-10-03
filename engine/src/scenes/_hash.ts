// Deterministic randomness for scenes: a frame must be a pure function of time, so scenes never call Math.random().
// h01(a, b, c) hashes up to three integers to [0, 1); use a different constant per use (h01(i, 7), h01(i, 8)...).

/** Deterministic hash to [0, 1). */
export function h01(a: number, b = 0, c = 0): number {
  let x = Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663) ^ Math.imul(c | 0, 83492791);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}
