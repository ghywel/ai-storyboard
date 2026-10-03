# Survey 02: rendering, browser video, motion blur and the tools

Checked on 2026-10-03.
- **[R]**: the page, PDF, source file, registry record (Crossref, npm, GitHub API) or spec was opened.
- **[R2]**: a search snippet only.
- **[M]**: our own check.

## The upstream engine

- **pdoom-video, by Giacomo Magnanini (GitHub `mexicat`)**, MIT, 2026.
  - A code-rendered music video with word-synced karaoke for "I'm Upping My P(doom)". Every frame is a deterministic
    function of song time, and it was made with Claude (Opus 5.5) in Claude Code.
  - The pipeline:
    - TypeScript, three.js, bun and Vite;
    - `scripts/render.ts` drives headless Chrome through playwright-core;
    - raw frames go over a WebSocket to ffmpeg/libx264;
    - motion blur averages sub-frames (`--samples auto`: 12, 36, 108 or 324).
  - It credits Demucs, Whisper, CTC forced alignment, mel-band-roformer, audio-separator, uv, the fonts (OFL) and
    `hersheytext`.
  - The song, lyrics and fonts are outside the MIT licence.
  - Source: https://github.com/mexicat/pdoom-video [R]
  - **[M] Upstream already had** Canvas2D layers (`Layer2D` in `engine/gl.ts`) and opentype.js (`engine/type.ts`).
    Checked in our local checkout of upstream, last commit 2026-09-28. The survey's claim that upstream had neither
    was wrong.
  - **[M] Ours, not upstream's:** encoding in the page with WebCodecs, rendering in segments, the memory guard, per-take
    folders and data files, the plates timeline, and the kit modules (`_motifs`, `_manga`, `_post`).

## Rendering a browser animation to video

- **CCapture.js, Jaume Sanchez Elias (`spite`).** First commit 2012-08-28; MIT.
  - It fixes the framerate by hooking the page's clocks (a virtual clock).
  - v1.0.9 (2018) already had `motionBlurFrames`, which supersamples frames into a motion-blurred one.
  - v2.0.0 (July 2026) encodes with WebCodecs `VideoEncoder`.
  - This is the closest single prior art: a virtual clock, averaged sub-frames, and encoding in the page.
  - Source: https://github.com/spite/ccapture.js [R]
- **timesnap / timecut, Steve Tung (2018).** BSD-3. Puppeteer with a virtual timeline and a screenshot per frame.
  Sources: https://github.com/tungs/timesnap, https://github.com/tungs/timecut [R]
- **Remotion, Jonny Burger.** Announced 2021-02-08. React to MP4: Puppeteer and Chrome Headless Shell render the
  frames and FFmpeg stitches them. The licence is source-available, not open source. Sources:
  https://www.remotion.dev/blog/introducing-remotion, https://www.remotion.dev/docs/renderer/render-frames [R]
- **Motion Canvas, "Jacob" (aarthificial).** 2022; MIT. TypeScript animation written with generators, and an editor
  synced to audio. Source: https://github.com/motion-canvas/motion-canvas [R]
- **Revideo** (the re.video team, now Midrender). 2024; MIT. A fork of Motion Canvas with headless rendering.
  Source: https://github.com/midrender/revideo [R]
- **Mediabunny, Vanilagy.** 2024; MPL-2.0. Browser media encoding and muxing built on WebCodecs. Source:
  https://github.com/Vanilagy/mediabunny [R]

## WebCodecs

- **The specification.** W3C Media Working Group, Working Draft of 21 September 2026. Editors Paul Adenot and Eugene
  Zemtsov; former editors Bernard Aboba and Chris Cunningham. Source: https://www.w3.org/TR/webcodecs/ [R]
- **Shipped in Chrome 94**, on by default. Source: https://chromestatus.com/feature/5669293909868544 [R]. Chrome 94
  reached stable on 2021-09-21 [R2].
- **The AVC registration.** With `avc.format: "annexb"`, SPS and PPS travel in the bitstream. Source:
  https://www.w3.org/TR/webcodecs-avc-codec-registration/ [R]

## Motion blur by temporal sampling

- **Jonathan Korein and Norman Badler**, "Temporal anti-aliasing in computer generated animation", SIGGRAPH '83,
  Computer Graphics 17(3), 377–388. It supersamples the moving image and filters it to "multiply-expose" each frame.
  Source: https://doi.org/10.1145/800059.801168 [R]
- **Michael Potmesil and Indranil Chakravarty**, "Modeling motion blur in computer-generated images", SIGGRAPH '83,
  17(3), 389–399. This is blur from a time-dependent point-spread function, not supersampling. Source:
  https://doi.org/10.1145/800059.801169 [R]
- **Robert L. Cook, Thomas Porter and Loren Carpenter**, "Distributed Ray Tracing", SIGGRAPH '84, 18(3), 137–145.
  Samples are spread in time. Source: https://doi.org/10.1145/800031.808590 [R] (metadata), [R2] (content)
- **Paul Haeberli and Kurt Akeley**, "The Accumulation Buffer: Hardware Support for High-Quality Rendering",
  SIGGRAPH '90, 24(4), 309–318. A general solution for motion blur and depth of field by accumulating frames: the
  direct ancestor of averaging sub-frames. Sources: https://doi.org/10.1145/97880.97913;
  https://graphics.stanford.edu/courses/cs248-02/haeberli-akeley-accumulation-buffer-sig90.pdf [R]

## The tools

| Tool | Facts | Source |
|---|---|---|
| three.js | Ricardo Cabello (Mr.doob), first released April 2010; MIT | https://github.com/mrdoob/three.js [R] |
| Vite | Evan You, first released April 2020; MIT | https://vite.dev [R] |
| Playwright | Microsoft, first released 2020-01-31; Apache-2.0 | https://playwright.dev [R] |
| bun | Jarred Sumner; 1.0 on 2023-09-08; MIT; joined Anthropic on 2025-12-02 | https://bun.com/blog/bun-joins-anthropic [R] |
| FFmpeg | Fabrice Bellard, first released 2000-12-20; LGPL/GPL by build | https://ffmpeg.org [R] |
| opentype.js | Frederik De Bleser, first npm release 2013-09-27; MIT | https://github.com/opentypejs/opentype.js [R] |

## Video conventions

- **ITU-T H.264**, first edition 05/2003. Annex B is the byte stream format. Source: https://www.itu.int/rec/T-REC-H.264 [R]
- **ITU-R BT.709-6 (06/2015)**. It began as CCIR Rec. 709 (1990). Source: https://www.itu.int/rec/R-REC-BT.709 [R]
- **Untagged HD is decoded as BT.709 by a player heuristic, not a rule.** mpv guesses BT.709 for width ≥ 1280 or
  height > 576 (https://github.com/mpv-player/mpv/blob/master/video/csputils.c [R]). Apple's TN2227 treats untagged
  media as SMPTE-C (https://developer.apple.com/library/archive/technotes/tn2227/_index.html [R]). So tag the output
  explicitly, as `render-final.sh` does.

## The tradition of video drawn in code

- **The demoscene** is in national inventories of living heritage under the 2003 UNESCO Convention:
  - Finland, May 2020: https://www.aalto.fi/en/news/the-demoscene-accepted-to-the-national-inventory-of-living-heritage [R]
  - Germany, 2021: https://www.unesco.de/kultur-und-natur/immaterielles-kulturerbe/immaterielles-kulturerbe-deutschland/demoszene [R]
  - Others through the Art of Coding initiative [R2].
- **Processing**: Ben Fry and Casey Reas, 2001, at the MIT Media Lab. Source: https://processing.org/overview/ [R]
- **Shadertoy**: Iñigo Quilez and Pol Jeremias, online since February 2013. Source: https://en.wikipedia.org/wiki/Shadertoy [R]

## macOS memory compression (why an RSS-based guard missed the leak)

- **The compressor** was introduced in OS X Mavericks (2013). It compresses least-recently-used memory. Source:
  https://images.apple.com/media/us/osx/2013/docs/OSX_Mavericks_Core_Technology_Overview.pdf [R]
- **Compressed pages are not resident** for the task. XNU counts them in `phys_footprint`; the resident size leaves
  them out. Source: https://github.com/apple-oss-distributions/xnu/blob/main/osfmk/kern/task.c [R]
- **Footprint = dirty + compressed** (WWDC18 session 416): https://developer.apple.com/videos/play/wwdc2018/416/ [R]

## Not verified

- A real name for Motion Canvas's creator. He presents as "Jacob" (aarthificial).
- The Chrome 94 stable date, which rests on a snippet only.
