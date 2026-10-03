# Survey 04: AI music generation, the reference videos, and the terms

Read on 2026-10-03.
- **[R]**: the page was opened and the claim confirmed.
- **[R2]**: a search snippet confirmed it.
- **[M]**: our own measurement.

## The generators

- **Suno**
  - Suno Inc., founded March 2022 in Cambridge, MA, by Mikey Shulman, Georg Kucsko, Martin Camacho and Keenan
    Freyberg.
  - Bark, an open text-to-audio model, came out on 2023-04-20. The song web app went public in December 2023, and the
    Microsoft Copilot integration followed on 2023-12-19.
  - Sources: https://research.contrary.com/company/suno [R] (secondary profile); https://github.com/suno-ai/bark [R];
    the Microsoft Copilot blog post of 2023-12-19 [R2].
  - **Timed lyrics.** No official Suno source says its downloads carry them. Two third-party tools read word-level
    lyrics from an undocumented endpoint: https://github.com/paperfoot/suno-cli [R] and
    https://github.com/DongquanZheng/suno-lyrics-exporter [R].
  - **[M]** The four `.m4a` downloads we received on 2026-10-02 each carried a `mov_text` subtitle track (English)
    beside the Opus audio, with the timed lyric lines and section tags. Checked with ffprobe on 2026-10-03.
  - **[M]** The track's timings were not synced to the singing. Measured against whisper on the vocal stem
    (`tools/srt-check.py`), 22% of lines in one take and 35% in another started more than a beat from the sung word,
    by up to 3.4 s. Hence the forced alignment in `analysis/`.
- **Udio**
  - Founded in New York in December 2023 by David Ding, Conor Durkan, Charlie Nash, Yaroslav Ganin and Andrew Sanchez,
    all formerly of Google DeepMind. Public beta on 2024-04-10.
  - Source: https://www.prnewswire.com/news-releases/former-google-deepmind-researchers-assemble-luminaries-across-music-and-tech-to-launch-udio-a-new-ai-powered-app-that-allows-anyone-to-create-extraordinary-music-in-an-instant-302113166.html [R]
  - Universal Music Group settled its lawsuit with Udio on 2025-10-29, with a licensed platform planned:
    https://www.musicbusinessworldwide.com/universal-music-settles-udio-lawsuit-strikes-deal-for-licensed-ai-music-platform/ [R]
- **ElevenLabs Music ("Eleven Music")**
  - Launched by ElevenLabs on 2025-08-05, with licensing deals with Merlin and Kobalt.
  - Sources: https://elevenlabs.io/blog/eleven-music-is-here [R];
    https://www.musicbusinessworldwide.com/eleven-music-new-ai-rival-to-suno-launches-with-merlin-kobalt-licensing-deals-in-the-bag/ [R]
- **Stable Audio**
  - Stability AI's first audio product, announced on 13 September (2023).
  - Source: https://stability.ai/news-updates/stable-audio-using-ai-to-generate-music [R]; the page gives the day
    only, and the year comes from a snippet [R2].
- **Lyria**
  - Google DeepMind's music model, announced on 2023-11-16 together with YouTube's Dream Track.
  - Sources: https://deepmind.google/discover/blog/transforming-the-future-of-music-creation/ [R];
    the current models page, https://deepmind.google/models/lyria/ [R].
- **MusicGen**
  - Jade Copet, Felix Kreuk, Itai Gat, Tal Remez, David Kant, Gabriel Synnaeve, Yossi Adi and Alexandre Défossez
    (Meta), "Simple and Controllable Music Generation", arXiv:2306.05284, 2023.
  - Source: https://arxiv.org/abs/2306.05284 [R]
- **Jukebox**
  - Prafulla Dhariwal, Heewoo Jun, Christine Payne, Jong Wook Kim, Alec Radford and Ilya Sutskever (OpenAI),
    "Jukebox: A Generative Model for Music", arXiv:2005.00341, 2020. The first well-known model that sang given
    lyrics.
  - Source: https://arxiv.org/abs/2005.00341 [R]
- **MusicLM**
  - Andrea Agostinelli, Timo I. Denk, Zalán Borsos, Jesse Engel and others (Google), "MusicLM: Generating Music From
    Text", arXiv:2301.11325, 2023.
  - Source: https://arxiv.org/abs/2301.11325 [R]
- **YuE**
  - Ruibin Yuan, Hanfeng Lin, Shuyue Guo, Ge Zhang, Jiahao Pan and 53 others (HKUST and M-A-P), "YuE: Scaling Open
    Foundation Models for Long-Form Music Generation", arXiv:2503.08638. The models were released on 2025-01-28, as
    the first open lyrics-to-song model for full songs.
  - Sources: https://arxiv.org/abs/2503.08638 [R]; https://github.com/multimodal-art-projection/YuE [R], which now
    hosts YuE2.

## The reference videos

- **"Evil Plan"**
  - Bright Mirror (https://www.youtube.com/@brightmirrorofficial). 6:18, published 2026-10-01.
  - Its description says it was "Made with Opus 5.5" and is a sequel to "NOTHING WENT FOOM". It does not name a
    music generator.
  - Source: https://youtu.be/oBE-lhubQ2k [R]
- **"We've Found Other Agents!"**
  - See it Visualized (https://www.youtube.com/@see_it_visualized). 3:24, published 2026-10-02.
  - Source: https://www.youtube.com/watch?v=Il4PNnVUmOs [R]

## Claude

- **Claude:** Anthropic's family of large language models. The current list includes Claude Opus 5.5.
  Source: https://platform.claude.com/docs/en/about-claude/models/overview [R]
- **Claude Code:** Anthropic's agentic coding tool.
  Sources: https://code.claude.com/docs/en/overview [R]; https://claude.com/product/claude-code [R]

## Earlier music videos made from code or data

- **Radiohead, "House of Cards" (2008)**
  - Directed by James Frost, with Aaron Koblin as Director of Technology.
  - Made without cameras, from structured-light and Velodyne lidar data. The data and Processing code were released
    under CC BY-NC-SA 3.0.
  - Sources:
    https://creativecommons.org/2008/07/14/radioheads-house-of-cards-video-data-published-under-creative-commons-license/ [R];
    http://www.aaronkoblin.com/work/rh/ [R]
- **Arcade Fire, "We Used to Wait": *The Wilderness Downtown* (2010)**
  - Chris Milk with Google Creative Lab. An interactive HTML5 film for Chrome.
  - Sources: https://experiments.withgoogle.com/the-wilderness-downtown [R];
    https://en.wikipedia.org/wiki/We_Used_to_Wait [R]

## Output terms (what the pages say; not legal advice)

- **Suno**, terms revised 2026-08-10:
  - On Pro and Premier (paid) plans, Suno assigns its rights in the outputs to the user, subject to the terms.
  - On free or Basic plans, outputs are for lawful, personal, non-commercial use.
  - On every plan, Suno makes no representation that copyright vests in any output.
  - Source: https://suno.com/terms [R]
- **Udio**, terms revised 2025-11-12:
  - Udio and its licensors own the outputs.
  - Downloading and commercial use of outputs are not permitted.
  - Source: https://www.udio.com/terms-of-service [R]

Terms change: read them on the day you publish.

## Not verified

- An official Suno source for the timed-lyrics track. We have our own measurement only.
- The Microsoft post of 2023-12-19, which would not render.
- The year on Stability's own Stable Audio page.
- Whether the two reference videos used Suno.
