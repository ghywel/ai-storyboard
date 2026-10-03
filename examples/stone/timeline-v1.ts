// v1's edit (TREATMENT-v1.md, "WHAT'S IT WORTH?"): the Suno take alone (his call: straight into the music video).
// As in v3, each plate starts on the beat at or before its first line's first word; plates live in scenes/v1/.
import type { TimelineEntry } from './engine/engine';
import type { Lyrics } from './engine/lyrics';
import type { AudioData } from './engine/audio';
import { scene } from './scene-index';

export function makeTimelineV1(ly: Lyrics, au: AudioData): TimelineEntry[] {
  const cut = (q: string, nth = 0, tol = 0.02) => {
    const s = ly.get(q, nth).words[0]!.start;
    return au.timeOfBeat(Math.floor(au.beatAt(s + tol)));
  };
  const b = {
    archive: cut('They cut me out'),
    twist: cut("Now here's the twist"),
    vote: cut("'Cause I was never"),
    number1: cut("I'm the stone at the bottom", 0),
    pitch: cut('Then a trader'),
    quickfire: cut('Now you print it'),
    uptheroad: cut('but up the road'),
    dating: cut('Marry your housekeeper'),
    number2: cut("I'm the stone at the bottom", 1),
    panel: cut('Some say count her'),
    lift: cut('One pole, every shoulder', 0),
    festival: cut("I'm the stone at the bottom", 2),
    goodnight: cut('On Yap they still'),
    end: au.duration,
  };
  const E = (id: string, start: number, end: number, params: Record<string, unknown> = {}): TimelineEntry =>
    ({ id, load: scene(`v1/${id}`), start, end, params });
  return [
    E('onair', 0, b.archive),
    E('archive', b.archive, b.twist),
    E('twist', b.twist, b.vote),
    E('vote', b.vote, b.number1),
    E('number1', b.number1, b.pitch),
    E('pitch', b.pitch, b.quickfire),
    E('quickfire', b.quickfire, b.uptheroad),
    E('uptheroad', b.uptheroad, b.dating),
    E('dating', b.dating, b.number2),
    E('number2', b.number2, b.panel),
    E('panel', b.panel, b.lift),
    E('lift', b.lift, b.festival),
    E('festival', b.festival, b.goodnight),
    E('goodnight', b.goodnight, b.end),
  ];
}
