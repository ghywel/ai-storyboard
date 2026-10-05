// The edit: which scene plays when. A film's plates are listed in takes/<take>/plates.json:
//
//   { "plates": [
//       { "id": "intro",   "scene": "intro",  "at": 0 },
//       { "id": "verse1",  "scene": "verse1", "at": "They cut me out" },
//       { "id": "chorus1", "scene": "chorus", "at": "I'm the stone", "nth": 0, "params": { "n": 1 } } ] }
//
// "at" is seconds, or the text of a lyric line: the plate then starts on the beat at or before that line's first word
// (cuts land on the beat, never after the voice). "nth" picks among repeated lines. "after" (with "nth") starts a plate
// on the first downbeat after a line ends, for a plate that follows the voice (an instrumental after the last sung
// line): { "id": "solo", "after": "Kai esmen", "nth": 1 }. A plate ends where the next
// starts; the last ends with the take. "scene" is a file in src/scenes/ (a subfolder path is fine: "myfilm/intro").
// A scene file that does not exist yet plays the stub. ?scene=<name> plays one scene over the whole take (look tests).
// A film can also write its own timeline in TypeScript instead (examples/stone/timeline*.ts do).
import type { TimelineEntry } from './engine/engine';
import type { Lyrics } from './engine/lyrics';
import type { AudioData } from './engine/audio';
import { takeUrl } from './engine/take';
import { scene } from './scene-index';

interface Plate { id: string; scene?: string; at?: number | string; after?: string; nth?: number; params?: Record<string, unknown> }
const PLATES: Plate[] | null = await fetch(takeUrl('plates.json'))
  .then((r) => (r.ok && (r.headers.get('content-type') ?? '').includes('json') ? r.json() : null))
  .then((j) => (j ? (j.plates as Plate[]) : null))
  .catch(() => null);

export function makeTimeline(ly: Lyrics, au: AudioData): TimelineEntry[] {
  const solo = new URLSearchParams(location.search).get('scene');
  if (solo || !PLATES?.length) return [{ id: solo ?? 'stub', load: scene(solo ?? 'stub'), start: 0, end: au.duration }];
  const startOf = (p: Plate): number => {
    if (p.after !== undefined) {
      const e = ly.get(p.after, p.nth ?? 0).end;
      return au.downbeats.find((d) => d >= e - 0.05) ?? e;
    }
    if (p.at === undefined) throw new Error(`plate ${p.id}: give "at" or "after"`);
    if (typeof p.at === 'number') return p.at;
    const s = ly.get(p.at, p.nth ?? 0).words[0]!.start;
    return au.timeOfBeat(Math.floor(au.beatAt(s + 0.02)));
  };
  const starts = PLATES.map(startOf);
  return PLATES.map((p, i) => ({
    id: p.id, load: scene(p.scene ?? p.id), start: i === 0 ? 0 : starts[i]!, end: starts[i + 1] ?? au.duration, params: p.params ?? {},
  }));
}
