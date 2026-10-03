# Worked example: *The Stone at the Bottom of the Sea*

One brief carried through the whole method to three finished films, all drawn in code and rendered in 4K60:
- **The long take** (5:31, with an intro and bells). A sunken stone money disc tells how she is still the richest rock
  on her island, though nobody has seen her for generations. Up the road, a mother everybody sees every day scores
  zero in the national ledger. Stone money was a real practice on Yap. The song makes it an argument about which work
  money counts.
- **Short take 1, "WHAT'S IT WORTH?"** (3:24). The same story as a live TV variety show from a studio in a
  shipwreck. The scoreboard is the ledger.
- **Short take 2, "THE DIVER"** (3:28). The same lyric as a child's story: a girl finds the stone. The 4 am fever is
  hers, and her mother is the one the ledger scores 0.

The audio is not included: the takes were generated with Suno, and the films are published separately. Everything
else that made the films is here.

## Files and what they show

| Path | What it is | The method step it illustrates |
|---|---|---|
| `docs/SONG.md`, `docs/lyrics-for-suno.txt` | The brief's record, the long lyric, its claims and sources, the generator prompt | 1. Words |
| `docs/TREATMENT-v3.md` | The long film's treatment and plates | 4. Treatment |
| `docs/SCENE-GUIDE.md` | The long film's scene guide, with the director's storyboard notes as THE DIRECTION | 6–7. Plates and gates |
| `docs/VARIANTS.md` | Two takes measured, two concepts, the no-match table | 4. Variants |
| `docs/TREATMENT-v1.md`, `docs/TREATMENT-v2.md` | Each short film's full shot-by-shot script | 4. Script first |
| `docs/SCENE-GUIDE-v1.md`, `docs/SCENE-GUIDE-v2.md` | The briefs given to the parallel plate authors | 6. Plates |
| `takes/<take>/` | The timing truth: `lyrics.src.json`, `lyrics.json` (word-aligned), `audio.json` (beats, bars, sections, envelopes), `sections.film.json`, `dynamics.json`, and `align.json` where a line needed a fix. The audio is omitted. | 3. Timing |
| `timeline.ts`, `timeline-v1.ts`, `timeline-v2.ts` | Each film's edit in TypeScript: cuts on the beat at or before a line's first word | 6. Plates |
| `scenes/_rai.ts` | The character rig: about twenty faces, IK arm poses, squash and hop, the chibi body, marks, props | DIRECTION §6 |
| `scenes/acting.ts` | The acting reel that was reviewed before any plate was polished | 7. Gates |
| `scenes/_world.ts` | Environments: the seabed with reeds, fish and "a shark for no particular reason"; an island at four times of day | DIRECTION §5 |
| `scenes/*.ts` | The long film's 20 plates (`chorus.ts` set the bar for the others) | 6. Plates |
| `scenes/v1/` | Short take 1: the studio kit (`_studio.ts`), the cast (`_cast.ts`) and 14 plates | 5–6. Kit and plates |
| `scenes/v2/` | Short take 2: the kit (`_diver.ts`: the girl's rig, the mother, the manta, the ledger book, the bedroom, the rising lyric) and 14 plates | 5–6. Kit and plates |

## Reading the scenes, or running them on your own take

The scene files import the engine as `../engine/...` and the kit as `./_motifs`, `./_manga`, `./_post`. To read them
in context, or to run one against a take of your own, copy them into the engine:

```bash
cp -R examples/stone/scenes/. engine/src/scenes/
```

They typecheck against the engine in this repository. To run a plate you need a take: a master WAV plus its analysis
(`METHOD.md`, phase 3). Each plate finds its lines by content, so it will only show its own lyric on a take that
sings those words.

## Pictures

These stills are in `docs/img/` at the repository root:
- `storyboard-depth.jpg`: a board from the first pass, before the director's notes. It has gradient backgrounds and
  a passive character, everything the notes then changed.
- `rig-faces.jpg`: the acting reel. Faces, poses, chibi pops and manga marks on one character.
- `plate-sheet-tv-concept.jpg`: short take 1's "up the road" plate. A night-vision feed of a 4 am kitchen, then the
  scoreboard's eye looks, blinks and writes 0, then the studio freezes.
- `plate-sheet-story-concept.jpg`: short take 2's fever plate. The same lines staged as the girl's own bedroom.
- `plate-sheet-finale.jpg`: short take 2's dawn finale.

## Credits

- Words: Claude, from Knight Commander Gareth's brief.
- Voice and music: Suno.
- Film: drawn in code; engine from pdoom-video by Giacomo Magnanini (MIT).
- Styles studied: "Evil Plan" by Bright Mirror (made with Claude Opus 5.5) for the song form, and "We've Found Other
  Agents!" by See it Visualized for the palette and energy (`PRIOR-ART.md`).
