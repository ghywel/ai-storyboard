# Method: from a brief to a 4K music video drawn in code

The pipeline runs from a written brief to a finished 4K60 music video. The picture is code: Canvas2D and WebGL
scenes rendered offline. The song comes from an AI music generator. The words, the timing analysis, the design and
the code are written with Claude, and a human directs.

The method has been used for three films so far, and they appear here only as examples. Each example is marked
**Example** and points into `examples/stone/`. The method itself does not depend on them.

## Who does what

| Role | Does |
|---|---|
| The human director | Writes the brief and chooses the references. Chooses the take by ear. Reviews at the gates and pushes back. Chooses the credits. Publishes. |
| Claude | Writes the lyrics, measures everything, writes the treatment and the script, and builds the shared kit. Orchestrates the plate authors, reviews, renders and verifies. |
| A music generator | Sings and plays the lyrics (Suno was used; others work: see `MUSIC.md`). |
| Plate authors (parallel agents) | Each builds two or three adjacent plates (a plate is a scene file) from the script and the scene guide, and reports back. |

Two rules hold the roles together:
- The director's taste decides.
- A claim about the material (a tempo, a timing, a colour, a frame count) is measured before it is relied on.

## The phases

```
 0 brief + references ──> 1 words ──> 2 song takes (generator) ──> 3 timing truth (analysis/)
                                                                        │
 9 final render <── 8 checks <── 7 gates <── 6 plates (parallel) <── 5 kit <── 4 treatment + script
```

### 0. The brief and the references

- Write the brief down: what the film says, who tells it, the tone, and what it must not do.
- Collect references, then measure them instead of describing them from memory:
  - tempo, key and words per second (`tools/song-analyze.py`);
  - cut rate (count cuts over a minute);
  - palette (`tools/palette.py` on frames of the reference);
  - how it was made. Is it all code, or code plus generated art? A reference's look often comes from a cheaper
    technique than it seems.
- Take the style, never the content: the words, characters and story are new.
- **When the brief is thin, ask before writing anything.** Some decisions are only the director's, and each changes
  every plate. Ask them together, each with two or three concrete options and a recommendation:
  - the look (described options, or references to measure);
  - who has the face, and the register they act in (comic, tender, reverent...);
  - the payoff: how the film ends, and anything theological, political or personal it shows or refuses to show;
  - which of an earlier film's standing taste carries over (`DIRECTION.md`: craft carries, taste is asked);
  - how to run the gates (stop at the boards, or trust).
- Read the generator's own write-up of the song (its notes on where the shiver lands), and plant the film's payoff in
  the words themselves where you can: *Agnosto Theo*'s ending came from its Greek (ἀγνώστῳ, "unknown", loses its
  alpha and becomes γνωστῷ, "known").

**Example.** Two references set the style: one gave the song form (semi-rapped verses, sung hooks, about 140 bpm),
and one gave the palette and energy (neon on indigo-black, slammed words, sunbursts). The second turned out to be
100% code, which decided the medium: no image model was needed.

### 1. Words

Claude writes the lyrics from the brief. Write for the screen as well as the ear:
- **A narrator with a face.** One character tells the song. Everyone else can be a silhouette.
- **A visual rhyme.** Choose an image that recurs and changes meaning (a ring, a door, a thread). It carries match
  cuts between scenes later.
- **Concrete nouns.** Every verse line should be drawable as a picture: a lunchbox, a bill, a fever.
- **Contrast.** A spoken part or a hush gives the loud parts something to land after.
- **A record of claims.** For each factual claim, note how sure it is and where it came from (`[R]` from the brief,
  `[U]` well known but not re-checked).
- **Fit to the generator** (`MUSIC.md`): its character limits, section tags with performance hints, and a style
  prompt.

### 2. The song

The human generates takes and chooses by ear. The takes of one lyric differ in tempo, key, structure, repeats,
ad-libs and delivery, and each can carry its own film. Keep every take you like: a second film costs far less than
the first, because the tools and the kit carry over.

### 3. The timing truth

Every time in the film is a time in **the master**, the take decoded to a 48 kHz WAV (`takes/<take>/audio.wav`),
plus any intro or outro you add (`tools/soundtrack.py`). Build these files per take:

1. **`lyrics.src.json`: the sung lines, in order, as `[start, end, text]`.**
   - Start from the generator's own lyric track (`tools/srt-lines.py`) and correct it against what is actually sung.
     Run whisper (step 3 of `run-take.sh`) and compare.
   - Generators repeat tags, drop lines, add echo lines, and sing vocalises ("na-na-na") that are not in the text.
2. **`lyrics.json`: every word timed (`analysis/run-take.sh`).**
   - The steps: Demucs stems, then CTC emissions from two acoustic models on three channels, then one global Viterbi
     alignment with a "garbage" token between lines (ad-libs), then refinement on the vocal stem, a whisper
     cross-check, and QA plots per line.
   - Report the share of words whisper also heard and the median deviation.
   - Fix ambiguous lines from the QA plots in `takes/<take>/align.json` (`analysis/align.py` explains the format).
3. **`audio.json`: the beat grid, bars, sections, envelopes and onsets (`analysis/analyze.py`).**
   - The tempo is searched near a hint (`BPM_HINT`).
   - The bar phase is decided by the drums.
   - Sections are snapped to downbeats from their first words (`takes/<take>/sections.film.json`, written from the
     aligned lyrics).
4. **`dynamics.json`: the take's shape (`tools/dynamics.py`).**
   - Per section: loudness, brightness, onset density and key, plus a loudness line for the whole song.
   - The film's shape follows it: its valleys are the quiet scenes, its peak is the finale.

**Example.** The generator's own timings were off by more than a beat on 22% of lines in one take and 35% in
another, by up to 3.4 s. The forced alignment matched whisper on 90–99% of words with a median deviation of
60–70 ms. One take's vocalise pulled a verse's first word 5.5 s early; one `align.json` entry put it back.

### 4. Concept, treatment and script: written first, committed first

Write the whole film down before building any of it, and commit it. A design on disk survives an interruption: a
crash, a usage limit, a new session. Use `templates/TREATMENT.md`:
- **The idea in one paragraph**, and **why this take** (from its measured shape).
- **Tone rules**: what the film never does.
- **Palette**: tokens and how much of each, per film. **Typography**: the roles. **The lyric presentation.**
- **Camera and compositor grammar.**
- **Motifs.** **The set and cast** that the shared kit will hold.
- **The plates table**: id, window in master seconds, lines, what plays.
- **The shot-by-shot script**: for each line, the picture, the character's face and pose, the clue or invented
  number in the background, and the hit.

**Several takes, several films (`templates/VARIANTS.md`).**
- Measure each take's feel and give each film one concept that suits it.
- Write a **no-match table**: every line staged in each film, side by side, so the films share no pictures.

**Example.** Two takes of the same short lyric became two films:
- The even, bouncing take with a party ending became a live TV show, its segments telling the story.
- The take with the darker intro, a hushed dip and the loudest peak became a child's story. It runs through dusk,
  4 am, a fever dream, a night dive and dawn.

### 5. The shared kit: built once, frozen, then shared

Before any parallel work, build what every plate will draw:
- the character rig and its acting vocabulary;
- the sets;
- the cast of silhouettes, each with one telling accessory;
- the graphics package and the lyric presenter.

Render a look-test scene, fix what reads wrong in the stills, commit, and freeze it. Authors then add props in their
own files and never edit the kit. A kit that changes while parallel authors build on it breaks their work silently.

### 6. Plates, in parallel

- Split the timeline into groups of two or three adjacent plates, one author each.
- Brief each author with the scene guide (`templates/SCENE-GUIDE.md`):
  - the direction rules;
  - the API;
  - the commands;
  - the continuity table (which prop is where, the state of each recurring thing per plate);
  - the joins;
  - the memory rules;
  - the report format.
- Authors may improve the script's gags and pictures if they keep its meaning, and they say so in their report.
- The orchestrator reviews every plate's contact sheet as it arrives. Fix cross-plate issues yourself, with one
  owner per shared decision. Commit after each review.

**Example.** Two authors were each told to stage the same story beat: a gift that one plate should give and the next
should show. The two "who gives it" messages crossed, so for a while neither plate gave it. Settle such decisions
before the work starts, in the guide's continuity table.

### 7. The gates

- **The storyboard gate.**
  - Every shot is blocked in at storyboard depth: readable and on the beat.
  - The director reviews one keyframe, its line and a one-sentence idea per shot, and pushes back.
    `tools/boards.py <take> boards.json boards.html` renders the keyframes the authors report and writes one
    self-contained page to send.
  - Then polish.
  - The director's notes become the guide's DIRECTION section, which overrides anything below it.
- **The preview gate.** A 1080p render with the music.
- **When the director says "I trust you"**, the gates become milestones: send the boards and the preview, and do not
  wait.

**Example.** The first board looked finished. The notes changed every plate: real environments instead of
gradients, a character who acts in anime style, and silhouettes that emote. Because they came at board depth, no
polished work was thrown away.

### 8. Checks before the final

- **Typecheck.**
- **A cuts sheet:** four frames around every seam (`render.ts sheet --cuts`).
- **Continuity:** recurring props and states, against the guide's table.
- **Performance:** each plate under about 40 ms a frame at 1080p (`render.ts perf`).
- **A 1080p check render with audio**, read for scene errors.

### 9. The final render

`tools/render-final.sh`:
- 3840×2160 at 60 fps, with adaptive motion blur (up to 108 sub-frames on fast motion, a 0.2 shutter).
- Encoded **in the browser** (WebCodecs H.264 at about 160 Mbps). Only compressed chunks leave the page.
- Rendered in 55 s segments. Each segment is a fresh browser that loads only its plates, under a memory guard
  (`tools/memwatch.py`), and is resumable through `.done` markers.
- The segments are joined byte for byte, then the audio is added in a second pass.

Then verify the result:
- a full decode (no errors);
- the frame count against duration × 60;
- the frames either side of each segment join;
- the credits frame.

**Example.** The three films (3:24, 3:28 and 5:31) rendered in 28–46 minutes each on a 16 GB Apple-silicon laptop.
The 1080p checks ran at about 180 fps.

### 10. Record

Commit after every reviewed step, with messages that say what was measured. Keep a project memory (`memory/`) of
the director's decisions and the lessons, so a new session continues instead of re-deriving.

## Starting a new film: the layout

A film lives in a checkout of this repository, on its own branch:
- `films/<film>/`: the treatment, the scene guide, the director's notes;
- `takes/<take>/`: the master (ignored by git) and the timing truth, and `plates.json`, the edit;
- `engine/src/scenes/<film>/`: the film's kit (`_*.ts`, frozen before the plates), its look tests and reels, and one
  file per plate.

Keep the toolchain's `main` in a separate worktree (`git worktree add ../<repo>-main main`). A fix to the method found
while making the film is committed on its own (method files only) and cherry-picked into `main`; the film's branch
never has to be switched while parallel authors are reading and writing its files.

## What a session needs to know first

- `DIRECTION.md`: the craft rules for the picture.
- `MUSIC.md`: the words, the generator and the timing.
- `LESSONS.md`: what broke, how it was found, and the fix.
- `PRIOR-ART.md`: whose work each part stands on, with the verified surveys in `research/`.
- `memory/`: the working rules, in Claude Code memory format, ready to copy into a project's memory.
- `templates/`: the treatment, the variants, the scene guide and a plate brief.
- `examples/stone/`: one brief carried through three films, with every treatment, guide and scene file.
