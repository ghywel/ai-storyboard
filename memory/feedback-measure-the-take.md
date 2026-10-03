---
name: feedback-measure-the-take
description: "Every time in the film comes from the master WAV, forced alignment and a drum-decided beat grid; generator timings are drafts"
metadata:
  type: feedback
---

Decode the take to a 48 kHz WAV master. Take the sung text from the generator's lyric track, correct it against a
whisper transcript (repeats, dropped lines, echo lines, vocalises), force-align it (analysis/run-take.sh), fit the
beat grid near a tempo hint with the bar phase decided by the drums, and measure the dynamics per section.

**Why:** measured on two takes, the generator's own timings were off by more than a beat on 22% and 35% of lines (up
to 3.4 s); a tempo detector read 83.6 bpm for 125.4. Forced alignment matched whisper on 90-99% of words, median
60-70 ms.

**How to apply:** report the alignment's whisper agreement and median deviation; fix ambiguous lines from the QA plots
in takes/<take>/align.json; let the dynamics line shape the film (valleys quiet, peak at the finale).
