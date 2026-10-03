import { hexToLinear } from './util';

// The film's palette as named tokens. Measure a reference you admire (tools/palette.py) and set the values here; the
// engine's own keys stay (its GLSL and HUD read them). These values are the worked example's, measured from "We've
// Found Other Agents!": ink = the indigo-black ground, bone = the light type, signal = pink.
export const HEX = {
  ink: '#120D1D', // the ground
  ink2: '#2F1C59', // deep violet: panels, the sea's depth
  graphite: '#5B5470',
  ash: '#9C97A8',
  bone: '#F4F1EA', // type, limestone light
  signal: '#FF4F9A', // pink: care, the zero, the tender sung word
  ember: '#FFD23F', // yellow: the sung word, sunbursts
  blood: '#B0306A',
  acid: '#78D63A', // lime: paid money in the Ledger
  deep: '#2F1C59',
  pink: '#FF4F9A',
  yellow: '#FFD23F',
  lime: '#78D63A',
  orange: '#FF8A2A',
  violet: '#C65CF0',
  coral: '#FF5A5F',
  peri: '#6F8CFF',
  cyan: '#2FE0FF',
  stone: '#D9CFB8',
  gold: '#F6C453',
} as const;

export type PaletteKey = keyof typeof HEX;

/** Linear RGB triplets for GL uniforms. */
export const LIN: Record<PaletteKey, [number, number, number]> = Object.fromEntries(
  Object.entries(HEX).map(([k, v]) => [k, hexToLinear(v)]),
) as Record<PaletteKey, [number, number, number]>;

/** CSS rgba() for Canvas2D. */
export function rgba(key: PaletteKey | string, a = 1): string {
  const hex = (HEX as Record<string, string>)[key] ?? key;
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
