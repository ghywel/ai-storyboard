// v2's edit (TREATMENT-v2.md, "THE DIVER"): the Suno take alone plus 7 s of silence for the credits (his call:
// straight into the music video). Each plate starts on the beat at or before its first line's first word; plates live
// in scenes/v2/.
import type { TimelineEntry } from './engine/engine';
import type { Lyrics } from './engine/lyrics';
import type { AudioData } from './engine/audio';
import { scene } from './scene-index';

export function makeTimelineV2(ly: Lyrics, au: AudioData): TimelineEntry[] {
  const cut = (q: string, nth = 0, tol = 0.02) => {
    const s = ly.get(q, nth).words[0]!.start;
    return au.timeOfBeat(Math.floor(au.beatAt(s + tol)));
  };
  const b = {
    lantern: cut('They cut me out'),
    legend: cut("Now here's the twist"),
    touch: cut("'Cause I was never"),
    manta: cut("I'm the stone at the bottom", 0),
    wreck: cut('Then a trader'),
    harbour: cut('Now you print it'),
    fever: cut('but up the road'),
    dollhouse: cut('Marry your housekeeper'),
    dream: cut("I'm the stone at the bottom", 1),
    dinner: cut('Some say count her'),
    nightdive: cut('One pole, every shoulder', 0),
    dawn: cut("I'm the stone at the bottom", 2),
    wedding: cut('On Yap they still'),
    end: au.duration,
  };
  const E = (id: string, start: number, end: number, params: Record<string, unknown> = {}): TimelineEntry =>
    ({ id, load: scene(`v2/${id}`), start, end, params });
  return [
    E('dive', 0, b.lantern),
    E('lantern', b.lantern, b.legend),
    E('legend', b.legend, b.touch),
    E('touch', b.touch, b.manta),
    E('manta', b.manta, b.wreck),
    E('wreck', b.wreck, b.harbour),
    E('harbour', b.harbour, b.fever),
    E('fever', b.fever, b.dollhouse),
    E('dollhouse', b.dollhouse, b.dream),
    E('dream', b.dream, b.dinner),
    E('dinner', b.dinner, b.nightdive),
    E('nightdive', b.nightdive, b.dawn),
    E('dawn', b.dawn, b.wedding),
    E('wedding', b.wedding, b.end),
  ];
}
