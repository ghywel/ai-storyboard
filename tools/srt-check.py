#!/usr/bin/env python3
"""Is the music generator's own lyric timing true (the Suno .m4a downloads we received carried a timed-lyrics subtitle track)? A second witness: whisper hears the take, its words are aligned to the subtitle's
words, and each line's start is compared with the time whisper heard that line's first word.

    srt-check.py <take audio> <take.json>     prints the line-start error (median, 90th percentile, worst lines)

The film lands type on these times, so a line that drifts by more than a beat (0.43 s at 140 bpm) is visible.
"""
import json, os, re, subprocess, sys
import numpy as np

FF = os.environ.get("FFMPEG", "ffmpeg")   # any recent FFmpeg; set FFMPEG to choose one
MODEL = os.path.expanduser("~/.cache/whisper/ggml-large-v3-turbo-q5_0.bin")
take, jpath = sys.argv[1], sys.argv[2]
work = os.path.splitext(jpath)[0]
j = json.load(open(jpath))

wav = work + "-16k.wav"
if not os.path.exists(wav):
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", take, "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", wav], check=True)
if not os.path.exists(work + "-whisper.json"):
    subprocess.run(["whisper-cli", "-m", MODEL, "-f", wav, "-ojf", "-ml", "1", "-sow", "-of", work + "-whisper", "-l", "en"],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
heard = [{"text": s["text"].strip(), "t": s["offsets"]["from"] / 1000}
         for s in json.load(open(work + "-whisper.json"))["transcription"] if s["text"].strip()]

norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())
A, B = [norm(w["text"]) for w in j["words"]], [norm(h["text"]) for h in heard]
n, m = len(A), len(B)
D = np.zeros((n + 1, m + 1)); D[:, 0] = np.arange(n + 1); D[0, :] = np.arange(m + 1)
for i in range(1, n + 1):
    a = A[i - 1]
    for jj in range(1, m + 1):
        D[i, jj] = min(D[i - 1, jj] + 1, D[i, jj - 1] + 1, D[i - 1, jj - 1] + (0 if a == B[jj - 1] else 1.3))
i, jj, match = n, m, {}
while i > 0 and jj > 0:
    c = 0 if A[i - 1] == B[jj - 1] else 1.3
    if D[i, jj] == D[i - 1, jj - 1] + c:
        if c == 0 and A[i - 1]: match[i - 1] = jj - 1
        i, jj = i - 1, jj - 1
    elif D[i, jj] == D[i - 1, jj] + 1: i -= 1
    else: jj -= 1

# per line: the first word of the line that whisper heard, compared at the time Suno gives that word
rows = []
for li, L in enumerate(j["lines"]):
    ks = [k for k, w in enumerate(j["words"]) if w["line"] == li]
    hit = next((k for k in ks if k in match), None)
    if hit is not None and hit - ks[0] <= 2:   # only the line's first three words: later ones carry the syllable guess
        rows.append((li, j["words"][hit]["t"], heard[match[hit]]["t"], L["text"]))
d = np.array([h - s for _, s, h, _ in rows])
print(f"{os.path.basename(jpath)}: whisper heard {m} words; {len(match)} of {n} lyric words matched; "
      f"{len(rows)} of {len(j['lines'])} lines checked")
print(f"  line start, whisper minus Suno: median {np.median(d):+.2f} s, |error| median {np.median(abs(d)):.2f} s, "
      f"90th pct {np.percentile(abs(d), 90):.2f} s, within a beat (0.43 s) {np.mean(abs(d) < 0.43) * 100:.0f}%")
for li, s, h, txt in sorted(rows, key=lambda r: -abs(r[2] - r[1]))[:5]:
    print(f"  worst: line {li} Suno {s:.2f} heard {h:.2f} ({h - s:+.2f}) {txt[:50]}")
