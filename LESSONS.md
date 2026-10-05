# Lessons

What broke, how it was found, and what fixed it. Each entry is dated and carries its numbers. Measurements were made
on a 16 GB Apple-silicon laptop (macOS) between 2026-10-02 and 2026-10-03, unless the entry says otherwise. Entries
marked **(Agnosto Theo)** come from the second film, made on a 16 GB Intel i9 MacBook Pro with an RX 6600 eGPU on
2026-10-05.

## Platform (Agnosto Theo)

- **The analysis would not install off Apple silicon.** torch >= 2.14, mlx-whisper, onnxruntime and numba 0.67 have no
  Intel-Mac wheels; uv tried to compile LLVM's bindings and failed. Fix: platform markers resolve Intel Macs to Python
  3.12, torch 2.2.2, numpy 1.26, numba 0.62 and openai-whisper in the same lockfile. Measured: Demucs 13 min on the
  i9's CPU for a 5:20 take; the rest of `run-take.sh` 27 min.
- **Homebrew had no Intel bottles** for ffmpeg, bun or uv, and would have built them (and upgraded its Python). Static
  builds and the official installers worked in minutes.
- **Headless Chromium took the integrated GPU** (Intel UHD 630) beside an RX 6600: 55.4 ms a frame for the demo plate
  at 1080p. `--force_high_performance_gpu` (`FILM_CHROME_ARGS`) moved it: 30.8 ms; 4K with adaptive blur 184 ms.

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
- **A style prompt's tempo is not the take's (Agnosto Theo).** The song was asked of Suno at 80 bpm; it is 140 counted,
  70 felt (its lines fall every 6.86 s, 4 bars at 140). The first treatment took 80 from the prompt and built its
  camera grammar on a 0.75 s beat. Fix: `song-analyze.py` prints its candidates; measure before writing the grammar.
- **The generator's lyric text was wrong three ways (Agnosto Theo)**, in the subtitle track and in the m4a's `lyrics`
  tag alike, and differed from the lyric sheet written for it:
  - a verse line listed twice was sung once; the aligner squeezed the phantom copy into a held note and a breath;
  - the bridge's answer was sung as the lyric sheet had it ("and move, and are"), not as the track said;
  - whisper found all three, and the QA plots settled them. Read whisper's transcript against the source line by line.
- **A refinement rule can capture a word too (Agnosto Theo).** The rest-onset rule took a choir's hum before verse 1
  for the singer's onset and moved its first word 5.5 s ahead of all three acoustic models. Fix: a refined start stays
  within 0.6 s of the models.
- **Held notes and choirs keep the "voice" on.** A word's end runs until the vocal stem falls silent; under a choir
  pad, the bridge's last word ran through a 30 s instrumental to the final chorus. Fix: one `fix` end in
  `align.json`; check lines longer than 8 s.
- **A section with no words collapsed onto the next (Agnosto Theo).** `analyze.py` snapped every section to the next
  lyric line's first word, so the instrumental started where the final chorus did, and `dynamics.py` crashed on the
  empty section. Fix: a wordless section keeps its own time on a downbeat; an empty section is an error.
- **Frame drums still let the drums decide the bar (Agnosto Theo).** The section-start test favoured another phase
  (10 of 13 against 3), because the singer enters a beat after every downbeat; the kick (strength 123 on the beat
  against 38 or less) and the half-time snare agreed with the drum rule.
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

- **A render asked for a time past the take's end came out black, silently (Agnosto Theo).** A look-test reel run on
  the 16 s demo take produced black frames for every mode after 16 s. Fix: `render.ts` refuses such times.

## Legibility

- **The glow layer sits over everything**, including the lyric. Clear it under the lyric band with a feathered edge;
  a hard clear shows as a line.
- **Dot-matrix and bulb text needs about 10 dots per em; a lone "?" needs about 16.** At less, a question mark read
  as a 7.
- **A monospace face with a dotted zero reads as a theta at display sizes.** Set digits in a face with a plain zero.
- **Balanced karaoke rows can leave a one-word orphan.** Fix: the midpoint rule (a word moves to the next row when
  more than half of it would pass the row's share).
- **A face without the lyric's script falls back silently (Agnosto Theo).** No bundled font had Greek; ΑΓΝΩΣΤΩ ΘΕΩ
  would have been drawn in some system face. Fix: EB Garamond, and `missingGlyphs()` warns.
- **The glow layer is not occluded, and wide glows band (Agnosto Theo).** A star's halo shone through a hill drawn
  after it, and linear radial glows showed rings and a rim once bloomed. Fix: distant lights on the main layer
  (`'lighter'`), an exponential falloff, the glow tint at 1.4.
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
- **One film's taste is not the method (Agnosto Theo).** The method's pages stated the Stone films' anime acting,
  chibi pops, manga marks and neon as rules. A new song with an epic, reverent tone would have inherited them. Fix:
  DIRECTION.md separates craft from taste, and phase 0 asks which taste carries.
- **A thin brief needs four questions, asked together (Agnosto Theo):** the look, the face and its register, the
  payoff, the gates. Each answer changed every plate; asked first, they cost one round trip.

## Orchestration

- **Freeze the shared kit before parallel authors start.** Authors who find the kit lacking write helpers in their
  own files and report it. The orchestrator folds the fix into the kit afterwards: for example, holding a line's
  last word, or clearing the glow under text.
- **One owner per shared decision, settled before the work starts.** Two plates had to agree on which one gives a
  story prop to a character. Notes to the two authors crossed in flight, and for a while neither plate gave it.
  Fix: decide in the guide's continuity table, and check the joins on a cuts sheet.
- **Review each plate as it arrives, and commit after each review.** A usage limit stopped six authors mid-work.
  Their files were on disk, and a message resumed each one where it stopped.
- **Keep the method's branch in its own worktree (Agnosto Theo).** Switching the film's checkout to `main` to commit a
  method fix would have pulled the treatment out from under two agents working in it. Fix: `main` in a second worktree,
  method fixes committed on their own and cherry-picked.
- **Continuity contradictions hide in the script (Agnosto Theo).** The first script had Damaris leave her lamp on the
  altar, carry it through the next plate, and find it on the altar again. The continuity table, filled in before the
  authors started, showed it.
- **Write the script before building.** A treatment committed first let work resume cleanly after the
  interruptions.
