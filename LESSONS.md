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

## Beauty (huashu-art-motion and mortiflix-oss, read 2026-10-19; the medium reel)

- **Flat vector plus noise reads as clip art.** The demo plate (gradient sky, flat buildings, a black silhouette) is
  clean and lifeless. The medium reel (`engine/src/scenes/medium-reel.ts`) builds one picture up in six stages: paper
  and washes, broken colour, a cel-lit figure with the same paper inside her, one light map and cast shadows, then the
  grade and living motifs. The last stage is the first frame in this repository that reads as painted. CRAFT.md has the
  rules.
- **Multiply washes compound.** The first reel stacked five multiply passes per area over each other. Orange over
  purple went brown, and the meadow over the hill went near-black. Fix: light areas with `source-over` at moderate
  alpha, multiply only for darks laid over them, and the sky as one wash with a gradient fill (not bands of rectangles,
  which read as stripes).
- **Watercolour is transparent.** A sun painted under the mountains showed through them as a ghost disc. Fix: paint the
  sun after the ridge, clipped to the open sky; its bloom is a radial fill, because stacked polygons left a hard blob.
- **Ambient light sets the hour.** A chiaroscuro ambient (about 0.13) made a dusk meadow murky. Dusk wanted a cool mid
  (about 0.7).
- **A placeholder character is the weakest thing in a beautiful frame.** The reel's figure (no joints, no hands, no
  material detail) is now what the eye goes to. huashu: "a crude character is worse than none".
- **Cut detection by a global threshold misses quiet cuts.** huashu's `d >= max(8, 3 × median + 2)` found 2 of 5 cuts
  between states of one composition. A local baseline (the median of the 30 frames around each frame) found 4 of 5,
  with no false cuts. It still misses near-identical states (12 of 16 in a test), so the cut check vouches only for the
  cuts it sees.
- **The film check catches what eyes skim.** `tools/film-qc.py` failed a test film with planted faults: 2.5 s holds
  against a 1.017 s two-beat ceiling, and a 0.6 s black hole, caught by both blackdetect and the edge test. It passed a
  film cut every two beats (12 of 12 detected cuts on the beat within a frame).

## Timing (God Moved, 2026-10-13)

- **`song-analyze.py`'s beat phase sat about 58 ms early** against the kick attacks on the drums stem (431 kicks,
  interquartile 52–64 ms, no drift). It fits the whole mix's onsets. `analyze.py`'s grid, refined on the kicks, agreed
  with a least-squares kick fit to within 37 ms.
- **The drums could not decide the bar phase.** On a four-on-the-floor take, a kick on every beat and snares on 2 and 4
  fit phases 0 and 2 alike. `analyze.py` chose phase 2 by +0.31 to +0.28. Every structural change (the bass entry, both
  drops, the dip, the breakdown) fell on phase 0, so `audio.json` was rewritten to phase 0. Check the phase against the
  structure.
- **The alignment failed on repeats** (build lines 6.2 s early, drop calls about 4 s early, outro repeats up to 12 s
  late). Thirteen `align.json` windows from the vocal stem's phrases brought all 37 lines within 0.11 s (median 0.01 s).
- **Suno sang after its own [End] tag.** A whispered "God moves" at 4:41.27 was in neither the lyric sheet nor the
  subtitle track; the vocal stem showed it and whisper read it. Scan the stem to the last sample.
- **Suno's line times were good where it did not compress repeats** (within 0.3 s), and 6–20 s out where it did.

## Timing (Sponsor Me, 2026-10-19)

- **A slow live-feel take drifts in tempo, so a constant grid fails.** Suno's "live worship" take ran 72.45 bpm in the
  verses, 72.9 in chorus 2 and 73.3 in the bridge and final chorus. `analyze.py`'s constant fit (72.28 bpm) missed the
  snares by 125 ms median and 340 ms at worst. A beat tracker on the drum stem plus the mix (librosa `beat_track`,
  start 72.7 bpm, tightness 300) put all 143 snares within 10 ms. Its beats replaced the grid in `audio.json`. Check
  the snares against the grid on every take: median offset over about 30 ms means the tempo moves.
- **A tempo near 72 reads as 144 at first.** `song-analyze.py` searches 90–180 bpm and reported 144.5, with 72.3
  outside its range. The drum stem's snare spacing (1.65 s, on beats 2 and 4) decided it.
- **The bar phase was clear when the chords and the drums agreed.** The kicks (3.2 times the mean) and the chord
  changes (3.6 times) fell on the same beat of the four. Score both, not the drums alone.
- **Two voices at once defeat the alignment.** The girl's echoes overlapping the congregation's "We will" squashed
  three lines into 1.1 s. `align.json` windows from whisper's word times fixed the four lines. The overlapping calls
  stay out of `lyrics.src.json` and are timed from the pitch track instead (a child's voice sits well above the lead).
- **Whisper heard the overlapping calls only when prompted,** and a prompt can make whisper hear what it is told.
  Confirm a prompted hearing with the pitch track or the stem's energy before relying on it.

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

- **Playwright and the installed Chromium can disagree (2026-10-19).** `playwright-core` 1.63 looked for a browser
  build the container did not have. Fix: `FILM_CHROME_PATH` points `render.ts` at any Chromium binary.
- **Open-source Chromium cannot encode H.264 in the page.** `render.ts video` failed at `VideoEncoder` creation
  ("Encoder creation error"). Fix: Google Chrome (`FILM_CHANNEL=chrome`), or stills encoded with FFmpeg.
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
  after it, and faint glows showed rings once bloomed. A softer falloff did not cure the rings: the rig's author
  traced them to the upload, which un-premultiplies each of the few alpha levels a faint tail is stored in. Fix:
  distant lights on the main layer; glows drawn as opaque colour scaled by the falloff, added with `'lighter'`.
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
- **The gate caught a register the brief never asked about (Agnosto Theo).** The phase-0 question about the face
  offered "restrained, mythic acting" inside one option, and the treatment inherited "restrained". The director's
  storyboard note reversed it: "The emotionality needs to be tuned to the max." Ask the register as its own question.
- **The gate's notes needed a kit pass (Agnosto Theo).** Kneeling with arms thrown to the sky, prostration, weeping,
  a crowd going down in a wave: none of it was in the frozen kit. A kit pass between the gate and the polish (two
  agents, the rig and the cast, in parallel with the orchestrator's own fixes) took about 35 minutes; the six authors
  were then resumed by message for the polish.
- **Authors' workarounds are the kit's to-do list (Agnosto Theo).** Six storyboard reports named 20 gaps (a camera on
  both layers, one lyric picker, a sun rising early, chips floating off the altar, banding rays); three authors wrote
  the same helpers. Logged in `KIT-FIXES.md` as they arrived, they became one kit pass.
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
