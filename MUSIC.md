# Music: words by Claude, voice by a generator, timing by forced alignment

## The division of labour

| Step | Who | Output |
|---|---|---|
| Brief | the human | what the song says, its references and tone |
| Lyrics | Claude | the lyric with section tags, a style prompt, a record of claims |
| Song | a music generator, driven by the human | several takes (audio files) |
| Choice | the human, by ear | the take or takes to film |
| Timing | Claude, with `analysis/` | words, beats, bars, sections and dynamics in master time |
| Film | Claude, with `engine/`, reviewed by the human | the 4K60 picture, muxed with the take |

The pipeline needs only two things from the generator: **a WAV of the take** and **the text that is sung**. Any
generator that lets you download the audio works. We used Suno. Others include ElevenLabs Music, Stable Audio and
Google's Lyria, and open models such as YuE and MusicGen (`research/04-ai-music.md`). Udio's terms as revised on
2025-11-12 do not allow downloading outputs. Read your generator's terms for ownership and public or commercial use
on the day you publish, and credit it.

## Writing for the generator

- **Fit the box.**
  - Generators cap the lyric field. Suno's was 5,000 characters when we used it; its style prompt was 200.
  - Count before you paste. Line breaks may count double.
  - Cut repeated echo lines and blank lines between sections before cutting verses.
- **Tag the sections, with performance hints**:
  - `[Intro - spoken, close to the mic]`
  - `[Verse 1 - rap]`
  - `[Bridge - half time, sung]`
  - `[Final Chorus - key lift, full]`

  The hints are suggestions: generators often ignore a requested key change.
- **Style prompt**: genre, voice, tempo, energy, length, and the one or two structural features you need ("quiet
  spoken interlude, big sung chorus").
- **Length follows the lyric.** A longer song needs more words. If a take stops early, extend it from the last
  finished section.
- **Keep a record** next to the lyric: what each line claims and how sure it is. A song with an argument should be
  able to show its working.

## Takes

- Generate several takes of the same lyric. They differ in tempo, key, structure, repeats, ad-libs, vocalises and
  delivery.
- The human chooses by ear. Several good takes can each become a film; measure them (`tools/song-analyze.py`,
  `tools/dynamics.py`) and give each a concept that suits it (`DIRECTION.md` §12).

**Example.** Four takes of two lyrics measured 140 bpm in B-flat major, B-flat minor and E-flat minor. Three became
films:
- the long take (5:31 with an intro and bells);
- two short takes of the same lyric (3:24 and 3:28), each with its own concept.

## Getting the sung text and a first timeline

The four `.m4a` downloads we received from Suno (2026-10-02) each carried the timed lyrics as a `mov_text` subtitle
track beside the Opus audio. **The text was right, but the timings were not synced to the singing** (below), so the
film's timing had to be measured from the audio itself. Suno does not document the track, so check yours first:

```bash
ffprobe -v error -show_entries stream=index,codec_type,codec_name -of compact take.m4a
```

Then extract the track:

```bash
ffmpeg -i take.m4a -map 0:s:0 take.srt
```

Then convert it:

```bash
python3 tools/srt-lines.py take.srt take.json
```

`take.json` holds sections, lines, and words weighted by syllable.

**Treat these timings as a draft.** Measured on two takes, 22% and 35% of lines started more than a beat away from
where they are sung, by up to 3.4 s (`tools/srt-check.py` measures this against whisper). Use the track for its text
and its section tags. Then:

1. **Check the text against what is sung.** Run whisper on the vocal stem (`analysis/whisper_run.py`) and compare
   line by line. Watch for:
   - repeated tags sung three times where the text has two;
   - lines the track dropped;
   - echo lines in parentheses;
   - vocalises that are not in the text.
2. **Write `takes/<take>/lyrics.src.json`**, the sung lines in order.
3. **Run the forced alignment** (`TAKE=<take> analysis/run-take.sh`) and read its QA plots.
4. **Fix ambiguous lines** in `takes/<take>/align.json` and rerun `align.py`.

## The master

- **A film that opens straight on the song:** decode the take to a 48 kHz WAV.

  ```bash
  ffmpeg -i take.m4a -map 0:a -ar 48000 -c:a pcm_s24le takes/<take>/audio.wav
  ```
- **Credits after a hard ending:** pad the master with silence (`-af apad=pad_dur=7`) and re-run `analyze.py`.
- **A film that wraps the song in its own sound:** join an intro, the take and an outro by integrated loudness with
  `tools/soundtrack.py`, and tell `analyze.py` where the song starts and ends (`SONG_START`, `SONG_END`).

## Credits

Credit the human the way they ask to be credited, the generator, and any engine you build on. The end card is part
of the film. Render it, and check a frame of it at full size before you deliver.
