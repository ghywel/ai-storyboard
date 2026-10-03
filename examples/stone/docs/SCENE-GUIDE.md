# Scene guide: building a plate of "The Stone at the Bottom of the Sea" (v3)

## THE DIRECTION (his storyboard notes, 2026-10-02): this overrides anything below that disagrees

The storyboard was approved in its ideas. This pass builds every plate to FINAL quality under these notes. Watch
the acting reel first (the `acting` scene): he called it "absolutely perfectly minted".

1. **Rai ACTS, anime-style.**
   - He: "big exaggerated cartoon emotions", "a sudden change to a chibi is hilarious and delightful", "cross when
     she is cross, sas when she is sassy. She is cheeky and sad and joyous and silly and serious."
   - Every line she is in, she performs: a face, an arm pose, body motion (hops, squash and stretch, a lean, a tilt),
     manga marks, lines of force.
   - Chibi pops (`sd: true`, with `poof()` at the switch) for the comic beats: a few per plate, never constant.
   - She has NO HAIR (his call: "she is a rock"); a starfish clings to her crown.
   - Her moods must follow the words. See the faces, poses and marks in the toolkit below. The reel's
     `app/src/scenes/acting.ts` shows how to drive them.
2. **Every scene is set in a real ENVIRONMENT, with symbolic details. No "powerpoint" gradients.**
   - He: "background detail is important, and like any good director, seemingly irrelevant background details are
     symbolic clues to what is going on in the scene or foreshadowing for what is to come in the next scene. Colour
     and scenes should fit the theme."
   - The seabed is cartoon blue with reeds rippling, fish wandering by and a shark for no particular reason
     (`seabed()`, `seabedFront()`).
   - The island: `island()` (dawn, day, sunset or night; palms, stilt huts, Yap's stone-money bank, canoes, lanterns,
     a far steamship).
   - Build your own rooms, kitchens, streets, ships and stages to the same standard: furniture, objects, light
     sources, depth (back, mid, front layers) and something alive (steam, a curtain, a clock hand, rain).
   - Plant a clue or a foreshadowing detail in each shot, and say in your report what each one means. Examples: the
     anchor before the trader; a bill pinned to the fridge before "a bill"; a toy stone on a child's shelf before the
     bedtime story.
   - Graphic shots (a slam on a sunburst, the Ledger board) are still welcome as punctuation, but most of the time we
     are somewhere.
3. **The silhouettes stay faceless but EMOTE.**
   - He: "a tear drop down a cheek. Mum reading the bedtime story but dad watching at the door."
   - Use body language (`person()` poses: slump, seated, lean, hug, face, cheer, read, hold...), a head tilt, staging,
     and emotes (tear, tears, sweat, sigh, heart, zzz, music, anger, !, ?, joy).
4. **KEEP:**
   - the "nothing" beat and the pole through her heart: dark humour, "like a Shakespeare insult so clever it flies
     under the radar";
   - the invented numbers ("it grounds in realism ... the theme is what is real money").
5. **Compositor effects, tastefully.**
   - He: "full frame post-processing effects. Screen shakes, motion blurs - anything an awesome animator compositor
     might add for fun. But don't over do it - a very shaky scene can be painful to watch even at 60fps."
   - Use `_post.ts`:
     - `hitShake` (smooth, decaying, at most 8 px, at most one per bar, only on real hits);
     - `punch` (zoom +1–4 % on hits);
     - `caKick` (a colour split on big impacts);
     - `whipIn` (a scene sliding in).
   - Merge them with `mergePost`.
   - Motion blur comes free: the final render averages sub-frames, so fast moves streak by themselves.
   - Flashes stay brief (2–3 frames): the engine's flash now blows highlights out without greying the blacks.

## Polish to fix in this pass (known issues)

- **Stones:** `stone()` now shows its thickness and rings the hole with heart light. Use it, or draw your own discs
  the same way. No more eyeballs.
- **Slams:** `slam()` shrinks to fit the title-safe width by itself.
- **Karaoke:** the shared karaoke wraps balanced rows; your own `band()` helpers are fine too. Unsung words now show
  at 62%. Keep them readable everywhere.
- **Seams:**
  - Your plate's first and last frames must join their neighbours.
  - The line-74 tail ("three.") is sung across the turn→finale cut. The finale shows its tail.
- **Debate:** no huge cropped Rai intruding on the voices' close-ups.
- **Performance:** measure your plate with `bun scripts/render.ts perf --take v3 --only <id>` (or time a short video
  render) and keep it under about 40 ms a frame at 1080p.
- **The final render:** 4K at 60 fps with adaptive motion blur. Check one still of your busiest shot at `--scale 2`.

Read before writing a plate:
1. `TREATMENT-v3.md`: the idea, tone, palette, type, karaoke rules, motifs, and your plate's row in the plates
   table.
2. This guide.
3. `app/src/scenes/chorus.ts`, the finished plate that sets the bar: its structure, its look, how it finds its lines
   and cuts on the beat.
4. `app/src/scenes/_motifs.ts` and `app/src/scenes/_rai.ts`: the shared drawing (see "The toolbox" below).

The engine is forked from pdoom-video (MIT). Its full guide for scene authors is
`docs/ENGINE.md` in the pdoom-video repository (https://github.com/mexicat/pdoom-video), and its scenes in
its `app/src/scenes/` are worked examples of the API (GLSL passes, line batches, type layout). Read what
you need.

## Running things

All commands run from the engine folder (`app/` in the original project, `engine/` in this repository).

- **Stills** (the main way to check your work; then LOOK at the PNGs with the Read tool):
  `bun scripts/render.ts stills --take v3 --only <id> --t 31.2,33.0 --out ../out/wip/<id>`
- **A contact sheet of a time range** (best for checking a whole plate's flow):
  `bun scripts/render.ts sheet --take v3 --only <id> --from 33.3 --to 60.5 --n 16 --cols 4 --out ../out/wip/<id>.png`
- **A short clip**, to judge motion:
  `bun scripts/render.ts video --take v3 --only <id> --from 40 --to 46 --samples 4 --out ../out/wip/<id>.mp4`
- **Typecheck:** `bunx tsc --noEmit -p tsconfig.json 2>&1 | grep scenes/<id>`.
- `--only a,b` loads only those timeline entries (by id). The render prints `SCENE ERRORS` and console errors: read
  them.
- Each render starts its own short-lived server, so several authors can render at once.

## The plate

- One file per plate, `app/src/scenes/<id>.ts`, default-exporting a class that extends `Scene`. It is the
  timeline's entry id. Helpers go in `app/src/scenes/<id>-*.ts`.
- **Do not edit:**
  - `_motifs.ts`, `_rai.ts`, `chorus.ts`, `timeline.ts`, anything in `src/engine/`;
  - another plate's files.

  If you need something there, write it in your own file and say so in your final report.
- The window is `this.ctx.start` to `this.ctx.end`. `f.t` is master time (seconds), `f.lt` local time, `f.p`
  progress.
- **Find your lines by their first word's time**, not with `linesIn` (which also returns the previous line still
  ringing at the cut):
  `this.lines = lyrics.lines.filter(l => l.words[0].start >= start - 0.1 && l.words[0].start < end)`.
  Or by content: `lyrics.get('richest rock')`. Never hard-code times.
- **Sub-shots** within a plate cut on the beat at or before a line's (or word's) start:
  `au.timeOfBeat(Math.floor(au.beatAt(word.start + 0.02)))`. For "Other Agents"-style hard cuts every 2 beats in a
  rapped verse, derive cut times from the beat grid (`au.beats`, `au.downbeats`, `f.beat`, `f.bar`).
- **Audio features** on every frame: `f.a.kick`, `f.a.snare`, `f.a.hat`, `f.a.vonset` (decaying hit pulses),
  `f.a.vocal`, `f.a.rms`, `f.a.low/mid/high`, `f.a.drums`, `f.a.bass`.
- **Deterministic:** the output is a pure function of `f.t`.
  - No `Math.random()`, `Date.now()` or `performance.now()`; use `h01(...)` from `_rai.ts` or `hash()` from
    `engine/util`.
  - Per-frame flicker uses `frameIdx(t)` (engine/util).
  - Frames render out of order, and for motion blur as many sub-frames.
- **Output:** draw into one or more `Layer2D`s, then `comp.draw(renderer, layer.upload(), out)`. The first draw
  must cover the frame (clear with a colour). Glow goes in a second Layer2D drawn with
  `{ mode: 'add', tint: [2.2, 2.2, 2.2] }`, so it blooms. Return post overrides such as
  `{ bloom: 0.75, zoom: 1 + 0.012 * f.a.kick }` (others: `flash`, `shake: [x, y]`, `fade`, `vignette`).
- **Performance:** aim under 25 ms a frame. At most 2–3 Layer2D uploads per frame. Precompute heavy geometry (text
  points, layouts) in `init()`.

## The toolbox

**`_rai.ts`**: `drawRai(c, x, y, R, { t, face, arms, armsFrom, armsU, sd, marks, markT0, squash, hop, shake, tilt, look, blush, glow, glowStrength, heart, heartColor, noBlink })`.
- It returns her anchors (head, heart, feet in canvas px) for bubbles and effects.
- Faces: smile, wink, grin, wow, soft, fierce, asleep, angry, sassy, cheeky, sad, cry, joy, shock, smug, love, dizzy,
  deadpan, scheme, determined, serious.
- Arm poses (one, or [left, right]): down, wave, hip, point, up, fist, cross, shrug, cheek, chin, facepalm, reach,
  hold. Blend between poses with `armsFrom` and `armsU`.
- `sd: true` is the chibi.
- Marks: vein, sweat, sparkle, shine, hearts, gloom, steam, !, ?, !?, zzz, notes.

**`_manga.ts`**: `focusLines`, `speedLines`, `impactBurst`, `reactionBg('stripes'|'tone'|'rays'|'flat')`,
`panels(quads, draw)` for comic panels, `poof` for the chibi pop, `faceLines`, `popIn`, `veinMark`, `sweatDrop`,
`star4`, `heart`, `puff`.

**`_world.ts`**: `seabed(c, t, {depth, floor, pan, clues, shark})` and `seabedFront(c, t)`;
`island(c, t, {time, horizon, beach, pan, show})`; plus `reed`, `coral`, `fish`, `fishSchool`, `shark`, `cloud`,
`palmTree`, `hut`, `stoneBank`, `discStone`, `canoe`, `steamship`.

**`_post.ts`**: `hitShake(t, hits, amp, dur)`, `punch(t, hits, amt, dur)`, `caKick(t, hits)`, `whipIn(t, t0, dir)`,
`mergePost(...)`.

**Old `drawRai` parameters**, still valid:
- (x, y) is the disc's centre in canvas px; R is the disc's radius. She is about 3.2 R tall: feet at y + 1.07 R, the
  top of her hair at about y − 2.1 R.
- Faces: `smile`, `wink`, `grin`, `wow`, `soft`, `fierce`, `asleep`.
- `heart` (0..1) lights the hole that is her heart.
- `h01(a, b, c)`: a deterministic hash in [0, 1).

**`_motifs.ts`**:
- **Backgrounds:** `gradientV`, `sunburst`, `halftone`, `stars`, `underwater(c, t, depth)`, `bubbles`,
  `seaSurface`.
- **Type:**
  - `FAM.hook/bold/cond/serif/serifB/mono/monoB` (font families);
  - `slam(c, text, x, y, size, t, t0, {col, shadow, rot, t1})` for the "Other Agents" slams;
  - `karaoke(c, line, t, x, y, size, {sung, unsung, maxW, glow})`;
  - `kinetic(c, line, t, x, y, size, {accents})` for word-by-word slams in the rapped verses;
  - `spoken(...)` for the Cormorant voice of the spoken parts.
- **The Ledger:** `ledger(c, t, x, y, w, rows, {title, blink})` with rows `{label, value, care, t, lit}`.
- **Stones and people:**
  - `stone(c, x, y, r, {glow, heart})` for a plain rai stone;
  - `person(c, x, y, h, pose, {col, flip, t, seed, headTilt, rim, emote, emoteT0})`, a faceless silhouette that emotes.
    Poses: stand, point, carry, hold, sit, paddle, wave, hands, slump, seated, lean, hug, face, cheer, read.
    Emotes: tear, tears, sweat, sigh, heart, zzz, music, anger, !, ?, joy;
  - `palm`.
- **Points and morphs:** `ringPoints`, `textPointsAt`, `morph(c, A, B, u, colA, colB)`.
- **The knot:** `harmonograph(c, cx, cy, r, {draw, col, width})` draws Coprime's 3:2 knot.
- **Helpers:** `rgbaHex`, `mixHex`, `lineNow`, `wordsOf`.
- **Palette:** `HEX` from `engine/palette`: ink, deep, pink, yellow, lime, orange, violet, coral, peri, cyan, stone,
  gold, bone.
- **Fonts:** `F` and `font()` from `engine/type`.

## The bar (the film's look)

- **"We've Found Other Agents" is the reference for energy and colour:**
  - bold neon on indigo-black;
  - sunbursts, halftone, chunky slammed words with hard offset shadows;
  - the story told through things and interfaces;
  - something moving all the time, big changes on downbeats, hits on kicks and snares.
- **Rapped verses:** a hard cut about every 2 beats (a new composition, angle, colour or zoom), kinetic words, never
  a static slide.
- **Spoken parts:** slow, long holds, Cormorant, tender.
- **Every lyric line readable** and synced per word, in the bottom band or integrated into the picture:
  - title-safe 96 px;
  - no text off the frame;
  - nothing on top of the karaoke;
  - a dark band behind it when the background is busy.
- **Rai is the only face.** People are `person()` silhouettes. History (the quarry, the voyage, the islanders) is in
  silhouette, with no costume detail.
- **Picture what the line means,** with wit: visual puns and transformations, not literal slides. Each plate has
  its own idea.
- **Check every plate as a contact sheet** over its whole window, and fix:
  - empty or dead frames;
  - unreadable text;
  - overlaps and clutter;
  - anything off the frame or ugly.

  Iterate until it is as good as `chorus.ts` or better.

## Report back

In your final message, give:
- what each plate shows, shot by shot, with times;
- the path of a final contact sheet per plate;
- anything you needed but could not touch (an engine or motif change);
- anything you are unsure of.

## The plates and their windows (master seconds, from the timeline)

| id | window | lines |
|---|---|---|
| voyage | 0–12.83 | (Coprime's prologue: paddles 4:5:6 from 0.4 s, holding 8 beats to 3.83 s, then gliding 7 octaves up, easing in log speed, to the chord at 12.83) |
| sinking | 12.83–29.70 | (organ on the chord; the wind rises from 8.8 s; thunder and lightning at 14.54 on the pump's first chord; the comma pump 14.54–21.4, two laps of 4 chords × 2 beats, each lap 21.5 cents lower: the stone sinking; the sound goes under water 14.54→21.4; at rest from 21.4) |
| hello | 29.70–33.33 | 0–1 "Hi. You can't see me." / "That's kind of the whole point." |
| verse1 | 33.33–60.56 | 2–9 |
| pre1 | 60.56–67.85 | 10–13 |
| chorus1 | 67.85–81.13 | 14–17 (built) |
| trader | 81.13–95.28 | 18–21 |
| money | 95.28–102.56 | 22–23 |
| ledger | 102.56–109.42 | 24–25 |
| pre2 | 109.42–120.99 | 26–29 |
| chorus2 | 120.99–136.42 | 30–33 (built) |
| bedtime | 136.42–156.99 | 34–40 (spoken) |
| today | 156.99–198.13 | 41–52 |
| chorus3 | 198.13–211.85 | 53–56 (built) |
| debate | 211.85–233.70 | 57–62 |
| lift | 233.70–246.56 | 63–66 |
| turn | 246.56–273.56 | 67–74 |
| finale | 273.56–302.27 | 75–82 |
| remember | 302.27–314.28 | 83–86 (spoken) |
| bells | 314.28–330.93 | (Coprime's bells over a drone: the outro crossfades in at 312.92; nine strikes at 313.52, 313.95, 314.45, 315.02, 315.69, 316.47, 317.37, 318.41, 319.62, each gap 1.16× the last; the drone fades to about 331; the gold harmonograph draws itself on the strikes, then the title and the credits from TREATMENT-v3.md) |

Line numbers are indices into `takes/v3/lyrics.json` `lines` (`i`); the texts are in `SONG.md`.
