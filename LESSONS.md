# Lessons

What broke, how it was found, and what fixed it. Each entry is dated and carries its numbers. Measurements were made
on a 16 GB Apple-silicon laptop (macOS) between 2026-10-02 and 2026-10-03, unless the entry says otherwise.

## Timing and analysis

- **The generator's embedded lyric timings are a draft.**
  - On two takes, 22% and 35% of lines started more than a beat from where they are sung, by up to 3.4 s.
  - Whisper alone mismatches repeated lines.
  - Fix: forced alignment (`analysis/`). It matched whisper on 90–99% of words, with a median deviation of 60–70 ms.
- **A vocalise can capture a word.** A take sang "na-na-na" for five seconds where the lyric had nothing, and the
  alignment pulled the next line's first word back into it. The QA plot showed all three acoustic models agreed on
  the true time. Fix: one entry in `takes/<take>/align.json`.
- **Tempo detectors land on related metrical levels.** One read 83.6 bpm for a 125.4 bpm song, a 2:3 error. The
  literature documents errors by factors of 2, 3, ½ and ⅓ (`research/01-audio.md`); this 2:3 case is our own
  observation.
  - Fix: search near a hint, scoring the beat together with its eighths.
  - The bar phase is decided by where the kick and snare fall, not by where the lyric lines start.
- **A parser can fail silently.** A loudness log parsed to zero frames with no error.
  - Fix: assert the count (`assert len(ST) > 100`).
  - General rule: every step that returns data checks that it returned enough of it.
- **The model-memory step pushed the machine into swap.** Loading each acoustic model once per audio channel grew GPU
  memory to 4 GB. Fix: load each model once, run every channel through it, then free it.
- **Probe points must be inside the data.** An offset check sampled at 280 s in a 250 s file and reported a bogus
  offset. Fix: sample at fractions of the length.

## Rendering

- **Raw frames out of headless Chromium leak memory nobody owns.**
  - Pushing RGBA frames out of the page (WebSocket or HTTP POST) leaked about one frame per frame, around 0.5 GB/s at
    1080p. It froze the laptop twice.
  - The leak was invisible to per-process RSS, because the memory sat in the kernel's compressor.
  - Proven by elimination: rendering without export was flat, and bun piping to ffmpeg was flat.
  - Fix: encode inside the page with WebCodecs (hardware H.264 from a `VideoFrame` of the canvas) and send only the
    compressed chunks.
  - Result: 1080p checks run at about 180 fps. At 4K the busiest shot ran at 5.5 fps with motion blur, and a
    3.5-minute film rendered in about 30–45 minutes.
- **Guard what RSS hides.** `tools/memwatch.py` watches the compressor, swap and each process's footprint, and kills
  the render's process group on growth.
  - It once fired because another application grew, not the render.
  - That is the right failure: resume, because the render is in 55 s segments with `.done` markers.
- **Raw H.264 needs timestamps.** A raw Annex B stream remuxed with `-framerate` alone came out at 0.69 s.
  - Fix: `-fflags +genpts -r 60`.
  - Then the single-pass mux with `-shortest` dropped the audio track, because the video packets had no timestamps.
    Fix: mux the video first, add the audio in a second pass.
- **`-shortest` trims a frame** when the video is one frame longer than the audio. It was harmless here (a black end
  frame), but count frames against the duration so you know.
- **An additive flash greyed the blacks.** Fix: blow out the highlights multiplicatively and add only a little light.

## Legibility

- **The glow layer sits over everything**, including the lyric. Clear it under the lyric band with a feathered edge;
  a hard clear shows as a line.
- **Dot-matrix and bulb text needs about 10 dots per em; a lone "?" needs about 16.** At less, a question mark read
  as a 7.
- **A monospace face with a dotted zero reads as a theta at display sizes.** Set digits in a face with a plain zero.
- **Balanced karaoke rows can leave a one-word orphan.** Fix: the midpoint rule (a word moves to the next row when
  more than half of it would pass the row's share).
- **Read characters at thumbnail size.** First drafts read as the wrong thing at a distance:
  - a disc with a hole read as an eyeball;
  - a canoe as a table;
  - a sigh as a balloon;
  - a face on the disc as a screaming mouth.

  Contact sheets catch these.

## Direction

- **The storyboard gate pays for itself.** The director's notes on the first boards (real environments, an acting
  character, silhouettes that emote, the compositor's touch) changed every plate. They came before the polish, so no
  finished work was thrown away.
- **"Perfect, no notes" is a direction.** The approved film's rules became the next films' rules. Their concepts were
  then made deliberately different.

## Orchestration

- **Freeze the shared kit before parallel authors start.** Authors who find the kit lacking write helpers in their
  own files and report it. The orchestrator folds the fix into the kit afterwards: for example, holding a line's
  last word, or clearing the glow under text.
- **One owner per shared decision, settled before the work starts.** Two plates had to agree on which one gives a
  story prop to a character. Notes to the two authors crossed in flight, and for a while neither plate gave it.
  Fix: decide in the guide's continuity table, and check the joins on a cuts sheet.
- **Review each plate as it arrives, and commit after each review.** A usage limit stopped six authors mid-work.
  Their files were on disk, and a message resumed each one where it stopped.
- **Write the script before building.** A treatment committed first let work resume cleanly after the
  interruptions.
