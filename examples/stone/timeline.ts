// The edit (TREATMENT-v3.md's plates): which scene plays when. As in pdoom-video, boundaries come from the aligned
// lyrics and the beat grid (takes/<take>/lyrics.json, audio.json): a cut lands on the beat at or before a line's
// first word, never after it. A plate still being built plays the `stub` scene (its name, the karaoke, Rai).
import type { TimelineEntry } from './engine/engine';
import type { Lyrics } from './engine/lyrics';
import type { AudioData } from './engine/audio';
import { TAKE } from './engine/take';
import { makeTimelineV1 } from './timeline-v1';
import { makeTimelineV2 } from './timeline-v2';
import { scene } from './scene-index';

/** The prologue's chord arrives here (filmsound's prologue.json "summit"; master time). */
export const SUMMIT = 12.8286;

export function makeTimeline(ly: Lyrics, au: AudioData): TimelineEntry[] {
  // a test scene on its own over the whole film (?scene=acting): reels and look tests, outside the edit
  const solo = new URLSearchParams(location.search).get('scene');
  if (solo) return [{ id: solo, load: scene(solo), start: 0, end: au.duration }];
  if (TAKE === 'v1') return makeTimelineV1(ly, au);
  if (TAKE === 'v2') return makeTimelineV2(ly, au);
  const cut = (q: string, nth = 0, tol = 0.02) => {
    const s = ly.get(q, nth).words[0]!.start;
    return au.timeOfBeat(Math.floor(au.beatAt(s + tol)));
  };
  const bellsSec = au.sections.find((x) => /bells/i.test(x.name));
  const b = {
    sinking: SUMMIT,
    hello: cut("Hi. You can"),
    verse1: cut('They cut me out'),
    pre1: cut("'Cause I was never"),
    chorus1: cut("I'm the stone at the bottom", 0),
    trader: cut('Then a trader'),
    money: cut('Now you print it'),
    ledger: cut('but up the road'),
    pre2: cut('Marry your housekeeper'),
    chorus2: cut("I'm the stone at the bottom", 1),
    bedtime: cut('Tell me the one about'),
    today: cut('Fast forward'),
    chorus3: cut("I'm the stone at the bottom", 2),
    debate: cut('Some say count her'),
    lift: cut('One pole, every shoulder', 0),
    turn: cut("No, I'm not here"),
    finale: cut("I'm the stone at the bottom", 3),
    remember: cut('On Yap they still'),
    bells: Math.max(bellsSec?.start ?? 0, ly.get('So remember').end + 0.3),
    end: au.duration,
  };
  const E = (id: string, start: number, end: number, extra: Partial<TimelineEntry> & { file?: string } = {}): TimelineEntry =>
    ({ id, load: scene(extra.file ?? id), start, end, ...extra });
  return [
    E('voyage', 0, b.sinking),
    E('sinking', b.sinking, b.hello),
    E('hello', b.hello, b.verse1),
    E('verse1', b.verse1, b.pre1),
    E('pre1', b.pre1, b.chorus1),
    E('chorus1', b.chorus1, b.trader, { file: 'chorus', params: { n: 1 } }),
    E('trader', b.trader, b.money),
    E('money', b.money, b.ledger),
    E('ledger', b.ledger, b.pre2),
    E('pre2', b.pre2, b.chorus2),
    E('chorus2', b.chorus2, b.bedtime, { file: 'chorus', params: { n: 2 } }),
    E('bedtime', b.bedtime, b.today),
    E('today', b.today, b.chorus3),
    E('chorus3', b.chorus3, b.debate, { file: 'chorus', params: { n: 3 } }),
    E('debate', b.debate, b.lift),
    E('lift', b.lift, b.turn),
    E('turn', b.turn, b.finale),
    E('finale', b.finale, b.remember),
    E('remember', b.remember, b.bells),
    E('bells', b.bells, b.end),
  ];
}
