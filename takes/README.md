# takes/

One folder per take of the song, named as you like (`v1`, `long`, `demo`...). Every time in the film is a time in that
take's master. A take's folder holds:

| File | Made by | What it is |
|---|---|---|
| `audio.wav` | you (`ffmpeg`, or `tools/soundtrack.py`) | the master, 48 kHz; never committed |
| `lyrics.src.json` | you, from the generator's lyric track checked against what is sung | `[[start, end, text], ...]`, the sung lines in order |
| `align.json` | you, optional | per-line fixes for the forced alignment (`analysis/align.py` explains the format) |
| `whisper-prompt.txt` | you, optional | a vocabulary prompt for whisper (place names, unusual words) |
| `lyrics.json` | `analysis/run-take.sh` | every word timed |
| `sections.film.json` | you, from the aligned lyrics | `[{name, t}]`, each section's first word |
| `audio.json` | `analysis/analyze.py` | beats, downbeats, sections, envelopes, onsets |
| `dynamics.json` | `tools/dynamics.py` | the take's shape per section |
| `plates.json` | you | the edit: which scene plays from which line (`engine/src/timeline.ts`) |

`python3 tools/make-demo-take.py` writes a synthetic `takes/demo/` to try the engine with. The worked example's takes
are in `examples/stone/takes/`, without audio.
