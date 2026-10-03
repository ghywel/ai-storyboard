# Prior art and credits

This toolchain is an assembly of other people's work. This page credits them and names the nearest prior art to each
part, so a reader can see what was taken and what was added.

The surveys behind it are in `research/`. All four were made on 2026-10-03 and run in parallel. Every source was
opened, or marked where it was not.

| Tag | Meaning |
|---|---|
| **[R]** | a primary source opened, or a confirming secondary source opened |
| **[R2]** | a search snippet only |
| **[M]** | our own measurement or check |

| File | Remit |
|---|---|
| `research/01-audio.md` | forced alignment of sung lyrics, Whisper, source separation, beats and tempo errors, loudness, key, brightness |
| `research/02-rendering.md` | the upstream engine, rendering browser animation to video, WebCodecs, motion blur, the tools, video conventions, macOS memory |
| `research/03-craft.md` | animation, manga and comics, storyboards, colour scripts, planted details, model sheets, screen shake, kinetic type, the lyric video |
| `research/04-ai-music.md` | the music generators, the reference videos, Claude, earlier code- and data-made music videos, the generators' terms |

## What the toolchain takes, from whom

### The engine

- **Giacomo Magnanini, [pdoom-video](https://github.com/mexicat/pdoom-video)** (MIT, 2026). This is the engine we
  forked. Every frame is a deterministic function of song time, rendered by TypeScript scenes with three.js and
  Canvas2D layers. It already had:
  - offline rendering in headless Chrome, with motion blur from averaged sub-frames;
  - a word-synced karaoke engine with opentype.js type;
  - the CTC forced-alignment pipeline for sung vocals.

  It was itself made with Claude in Claude Code. [R], with [M] for what upstream contains.
- **Added here [M]:**
  - in-page encoding with WebCodecs;
  - segmented, resumable 4K renders under a memory guard;
  - per-take folders and fix files, and a timeline built from `plates.json`;
  - the shared kit (motifs, the manga vocabulary, the compositor);
  - the measuring tools.
- **The nearest prior art for each piece of rendering:**
  - **Jaume Sanchez Elias's CCapture.js** (2012): a virtual clock, `motionBlurFrames` supersampling (2018), and
    WebCodecs encoding in v2 (2026). The closest single precedent.
  - **Steve Tung's timesnap and timecut** (2018).
  - **Jonny Burger's Remotion** (2021).
  - **"Jacob" (aarthificial)'s Motion Canvas** (2022), and Revideo (2024).
  - **Vanilagy's Mediabunny** (2024).

  All [R].
- **WebCodecs**: the W3C Media Working Group (editors Paul Adenot and Eugene Zemtsov). Shipped in Chrome 94. [R]
- **Motion blur by temporal sampling:**
  - Jonathan Korein and Norman Badler (SIGGRAPH '83), supersampled "multiple exposure";
  - Michael Potmesil and Indranil Chakravarty (SIGGRAPH '83);
  - Robert L. Cook, Thomas Porter and Loren Carpenter, "Distributed Ray Tracing" (SIGGRAPH '84);
  - Paul Haeberli and Kurt Akeley, "The Accumulation Buffer" (SIGGRAPH '90), the direct ancestor of averaging
    sub-frames.

  All [R].
- **The tools:** three.js (Ricardo Cabello), Vite (Evan You), Playwright (Microsoft), bun (Jarred Sumner), FFmpeg
  (Fabrice Bellard and contributors) and opentype.js (Frederik De Bleser). The fonts are Archivo, Cormorant Garamond
  and IBM Plex Mono, under the OFL (`engine/public/fonts/FONTS.md`). [R]

### The timing

- **Forced alignment:**
  - Vineel Pratap, Andros Tjandra, Bowen Shi et al., *Scaling Speech Technology to 1,000+ Languages* (MMS, JMLR
    2024): the MMS_FA model and the star token.
  - The star token's lineage: Star Temporal Classification (Pratap, Hannun, Synnaeve and Collobert, NeurIPS 2022)
    and W-CTC (Cai et al., ICLR 2022).
  - Alexei Baevski, Yuhao Zhou, Abdelrahman Mohamed and Michael Auli, *wav2vec 2.0* (NeurIPS 2020).
  - Alex Graves, Santiago Fernández, Faustino Gomez and Jürgen Schmidhuber, CTC (ICML 2006).
  - Ludwig Kürzinger et al., CTC segmentation (2020).
  - torchaudio's `forced_align`: Jeff Hwang, Moto Hira, Caroline Chen et al., ASRU 2023. The tutorials are by Xiaohui
    Zhang and Moto Hira.

  All [R].
- **Lyrics-to-audio alignment research:**
  - Daniel Stoller, Simon Durand and Sebastian Ewert (ICASSP 2019): character-level CTC alignment of lyrics.
  - DALI (Gabriel Meseguer-Brocal, Alice Cohen-Hadria and Geoffroy Peeters, 2018).
  - The MIREX lyrics-to-audio alignment task (2017).
  - The Montreal Forced Aligner (Michael McAuliffe et al., 2017), as context.

  All [R].
- **Whisper:** Alec Radford, Jong Wook Kim, Tao Xu et al. (ICML 2023). Run here through mlx-whisper (MLX
  contributors) and whisper.cpp (Georgi Gerganov).
  - WhisperX (Max Bain, Jaesung Huh, Tengda Han and Andrew Zisserman, 2023) aligns Whisper's words with a single
    wav2vec2 model. Our global alignment over two models and three channels, with a garbage token between lines, is
    a different design.

  [R]
- **Separation:** Alexandre Défossez; and Simon Rouard, Francisco Massa and Alexandre Défossez's Hybrid Transformer
  Demucs (ICASSP 2023). `htdemucs_ft` is its per-source fine-tuning. [R]
- **Beats and tempo:**
  - Daniel P. W. Ellis (2007);
  - librosa (Brian McFee et al., 2015);
  - madmom (Sebastian Böck et al., 2016);
  - joint beat and downbeat tracking (Böck, Krebs and Widmer, 2016);
  - Beat This! (Foscarin, Schlüter and Widmer, 2024);
  - the metrical-level ("octave") error literature: Gouyon et al. 2006, McKinney et al. 2007, Schreiber, Urbano and
    Müller 2020.

  [R]
- **Loudness:** ITU-R BS.1770 (gated from -2, 2011), EBU R 128, and EBU Tech 3341, which defines the 3 s short-term
  window used by `tools/dynamics.py`. [R]
- **Key:** Carol L. Krumhansl and Edward J. Kessler's key profiles (1982), and Krumhansl's *Cognitive Foundations of
  Musical Pitch* (1990). Chroma: Takuya Fujishima (1999, [R2]); Mark A. Bartsch and Gregory H. Wakefield (2001). [R]
- **Brightness as spectral centroid:** John M. Grey (1977); Emery Schubert and Joe Wolfe (2006, [R2]).

### The direction (`DIRECTION.md`)

- **Animation acting:** Frank Thomas and Ollie Johnston, *Disney Animation: The Illusion of Life* (1981); John
  Lasseter (SIGGRAPH '87). [R]
- **Emotion symbols, lines of force and the chibi shift:**
  - Neil Cohn and Sean Ehly, "The vocabulary of manga" (2016), which catalogues 73 symbols, among them the vein, the
    sweat drop, gloom lines, sparkles, focus lines and "superdeformation";
  - Neil Cohn, *The Visual Language of Comics* (2013), and his work with Beena Murthy and Tom Foulsham on symbols
    above the head;
  - Neil Cohn and Stephen Maher on motion lines;
  - Takekuma Kentarō on manpu and effects (1995; English translation 2024);
  - Mort Walker's *Lexicon of Comicana* (1980);
  - Bandai and Koji Yokoi's SD Gundam (1985), the origin of "super deformed".

  [R]
- **One face among simple figures:** Scott McCloud, *Understanding Comics* (1993): amplification through
  simplification, and the masking effect. [R], secondary.
- **Boards and notes:** Disney credits Webb Smith with the storyboard (early 1930s). Ed Catmull with Amy Wallace,
  *Creativity, Inc.* (2014), describes the Braintrust: notes the director may take or leave. [R]
- **Colour planned scene by scene:**
  - Ralph Eggleston's colour scripts at Pixar, from *Toy Story*, and Lou Romano's for *The Incredibles*
    (Amid Amidi, *The Art of Pixar*, 2011);
  - Josef Albers, *Interaction of Color* (1963).

  [R]
- **Planted details that pay off:** Anton Chekhov's letter of 1 November 1889. **Staying on model:** Disney's
  Character Model Department (1937, Joe Grant), whose model sheets are the ancestor of the frozen shared kit. [R]
- **Screen shake, with restraint:**
  - Martin Jonasson and Petri Purho, "Juice It or Lose It" (2012);
  - Jan Willem Nijman, "The Art of Screenshake" (2013);
  - Squirrel Eiserloh, "Juicing Your Cameras With Math" (GDC 2016): smooth noise and trauma, "camera shake is like
    salt";
  - Folmer Kelly, "Don't Juice It or Lose It" (2014).

  [R]
- **Type that acts:** Johnny C. Lee, Jodi Forlizzi and Scott E. Hudson, "The Kinetic Typography Engine" (UIST 2002);
  Saul Bass's title sequences. **The lyric video:** Prince, "Sign o' the Times" (1987), widely considered the first.
  [R]
- **One design, many builders:** Fred Brooks, *The Mythical Man-Month* (1975): conceptual integrity. [R], secondary.

### The song and the references

- **Generators:**
  - Suno, used here;
  - other routes: ElevenLabs Music, Stable Audio, Google DeepMind's Lyria, and the open MusicGen (Jade Copet et
    al., Meta, 2023) and YuE (Ruibin Yuan et al., 2025);
  - the landmarks: Jukebox (Prafulla Dhariwal et al., OpenAI, 2020) and MusicLM (Andrea Agostinelli et al., Google,
    2023).

  [R]
- **The two videos studied:**
  - "Evil Plan" by Bright Mirror, 2026-10-01, made with Claude Opus 5.5: https://youtu.be/oBE-lhubQ2k
  - "We've Found Other Agents!" by See it Visualized, 2026-10-02: https://www.youtube.com/watch?v=Il4PNnVUmOs

  We took the style only. [R]
- **Claude and Claude Code**, Anthropic. [R]
- **The tradition of video drawn in code:**
  - the demoscene, in the national inventories of living heritage of Finland (2020) and Germany (2021);
  - Processing (Ben Fry and Casey Reas, 2001);
  - Shadertoy (Iñigo Quilez and Pol Jeremias, 2013);
  - Radiohead's "House of Cards" (2008), made from data without cameras;
  - Chris Milk's *The Wilderness Downtown* for Arcade Fire (2010), an interactive music video written in HTML5.

  [R]

## Licences and terms that matter

- **pdoom-video's code is MIT.** Its notice is kept in `engine/` and `analysis/`.
- **The fonts are OFL.**
- **The MMS_FA alignment model's weights are CC-BY-NC 4.0 (non-commercial).** wav2vec2 LV60K is MIT. For commercial
  work, run the alignment with `ALIGN_MODELS=lv60k` (`README.md`).
- **The generators' terms decide who owns a take and how it may be used.** As read on 2026-10-03:
  - Suno assigns its rights in outputs to paid subscribers. Free outputs are for personal, non-commercial use, and
    Suno makes no claim that copyright vests in any output.
  - Udio's terms (revised 2025-11-12) keep ownership with Udio and do not allow downloads.

  Read them on the day you publish.

## What the surveys corrected

- **Suno's timed lyrics.**
  - **[M]** The Suno `.m4a` downloads we received carried timed lyrics as a `mov_text` subtitle track. Suno does not
    document this.
  - **[M]** The timings were not synced to the singing: 22% and 35% of lines were off by more than a beat, by up to
    3.4 s. Hence the forced alignment.
- **What came from upstream.** Canvas2D layers and opentype.js were upstream's. WebCodecs encoding and the rest of
  "Added here" are ours. [M]
- **A 2:3 tempo error** (83.6 bpm read for 125.4) is our own observation. The literature documents factors of 2, 3,
  ½ and ⅓.
- **Common attributions, corrected:**
  - Thomas and Johnston's first edition is titled *Disney Animation: The Illusion of Life*.
  - The storyboard is *credited by Disney* to Webb Smith, and there are rival accounts.
  - Pixar did not invent colour scripts. Ralph Eggleston brought them there.
  - "Ligne claire" is Joost Swarte's term, not McCloud's.
  - Saul Bass is a pioneer of kinetic titles, not provably the first.
  - Chekhov's own words were about a loaded rifle on the stage. The "gun on the wall in act one" phrasing comes from
    memoirs.

## What is not new

None of the techniques here is new. Forced alignment, temporal supersampling, frame capture from a browser,
storyboard reviews, colour scripts, model sheets, emotion symbols and screen shake all have the owners named above.
What this repository adds is how they are put together: one method from a written brief to a verified 4K60 film,
with a human directing and Claude writing the words and the code.
