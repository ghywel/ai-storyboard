#!/usr/bin/env python3
"""Measure a song for the film: tempo and beat grid, key, every sung word's time, and the sections.

    song-analyze.py <song.mp3|wav> [--lyrics SONG.md] [--out song.json] [--no-words]

- Tempo: a spectral-flux onset envelope, its autocorrelation over 60-180 bpm, and a beat phase fitted to the onsets.
- Key: a 12-bin chroma of the whole song against the Krumhansl-Kessler profiles.
- Words: whisper (large-v3-turbo) word timings, aligned to the lyric words in the song sheet (the [tags] are
  sections), so every lyric word gets a time even where whisper misheard it.

Proven first on a song whose answer is known (Evil Plan: about 140 bpm, B-flat minor, measured 2026-10-02).
"""
import json, os, re, subprocess, sys, wave
import numpy as np

FF = os.environ.get("FFMPEG", "ffmpeg")   # any recent FFmpeg; set FFMPEG to choose one
MODEL = os.path.expanduser("~/.cache/whisper/ggml-large-v3-turbo-q5_0.bin")
args = sys.argv[1:]
song = args[0]
def opt(k, d=None):
    return args[args.index(k) + 1] if k in args and args.index(k) + 1 < len(args) else d
out = opt("--out", os.path.splitext(song)[0] + ".json")
lyrics_path = opt("--lyrics")
work = os.path.splitext(out)[0]


def decode(path, sr, mono, dst):
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", path, "-ac", "1" if mono else "2", "-ar", str(sr), "-c:a", "pcm_s16le", dst], check=True)
    with wave.open(dst) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
    return x.reshape(-1, 1 if mono else 2)


# ---- tempo and beats (22.05 kHz mono)
SR = 22050
x = decode(song, SR, True, work + "-22k.wav")[:, 0]
from scipy.ndimage import median_filter
hop, nfft = 256, 2048
win = np.hanning(nfft)
frames = 1 + (len(x) - nfft) // hop
spec = np.abs(np.fft.rfft(np.stack([x[i * hop:i * hop + nfft] * win for i in range(frames)]), axis=1))
logspec = np.log1p(100 * spec)
flux = np.maximum(0, np.diff(logspec, axis=0)).sum(axis=1)
flux = np.concatenate([[0], flux])
flux -= np.convolve(flux, np.ones(32) / 32, mode="same")      # remove the slow trend
flux = np.maximum(flux, 0)
fr = SR / hop
# tempo by folding the whole song: for each candidate, the best phase's mean onset strength at the predicted beats
# (hundreds of beats make it precise; the first version's autocorrelation lag was coarse: 136 for a 140 song)
def fold(bpm, nph=48):
    period = 60 / bpm * fr
    idx = np.arange(0, len(flux) - period - 1, period)
    best, bph = 0.0, 0.0
    for ph in np.linspace(0, period, nph, endpoint=False):
        q = idx + ph; i = q.astype(int); f = q - i
        v = (flux[i] * (1 - f) + flux[i + 1] * f).mean()
        if v > best: best, bph = v, ph
    return best, bph
coarse = np.arange(70, 180.01, 0.5)
sc = np.array([fold(b, 16)[0] for b in coarse])
b0 = coarse[np.argmax(sc)]
# the coarse winner and its relatives (1/2, 2/3, 3/2, 2), each refined; the best fold inside the 90-180 band (the
# songs we make) wins, else the best overall. Folding favours slow aliases (a half tempo keeps only the stronger
# beats), and the first version checked octaves only: "We've Found Other Agents!" (125.4 bpm) read 83.6, its 2/3.
# Each candidate is scored on two metrical levels, the beat and its eighths: a true tempo's double folds cleanly, a
# 3:2 alias's does not (the beat-only fold picked 93.4 for a 140 take). Measured 2026-10-02 on seven songs: right on
# six; Evil Plan's envelope is flat at every candidate (1.2-1.3), a tie no rule can call, so a near-tie (within 3 %)
# is reported and settled by --bpm-hint (our takes: the tempo asked of the song model), else the faster.
def refine(b):
    return max((fold(x)[0], x) for x in np.arange(b - 1, b + 1.001, 0.02))[1]
cands = sorted({round(refine(b0 * r), 2) for r in (0.5, 2 / 3, 3 / 4, 1, 4 / 3, 1.5, 2) if 60 <= b0 * r <= 200})
scored = sorted(((fold(b)[0] + fold(2 * b)[0], b) for b in ([c for c in cands if 90 <= c <= 180] or cands)), reverse=True)
bpm = scored[0][1]
hint = opt("--bpm-hint")
if len(scored) > 1 and scored[1][0] > 0.97 * scored[0][0]:
    tied = [b for s, b in scored if s > 0.97 * scored[0][0]]
    bpm = min(tied, key=lambda b: abs(b - float(hint))) if hint else max(tied)
    print(f"tempo ambiguous between {', '.join(f'{b:.1f}' for b in tied)}: chose {bpm:.1f} " + ("(nearest the hint)" if hint else "(the faster)"))
bpm = float(bpm)
ph = fold(bpm)[1]
period = 60 / bpm * fr
beats = (np.arange(ph, len(flux), period) / fr).tolist()

# ---- key: the harmonic part of the spectrum (percussion smoothed away along time), 130 Hz - 1.1 kHz, each frame's
# chroma normalised so loud passages do not dominate. (The first version used the whole spectrum: a kick tuned near
# A pulled Evil Plan to F major; the mid band reads its B-flat minor.)
kn, kh = 8192, 2048
kw = np.hanning(kn)
kframes = 1 + (len(x) - kn) // kh
K = np.abs(np.fft.rfft(np.stack([x[i * kh:i * kh + kn] * kw for i in range(kframes)]), axis=1))
Hm = median_filter(K, size=(15, 1))
freqs = np.fft.rfftfreq(kn, 1 / SR)
sel = (freqs > 130) & (freqs < 1100)
pc = (np.round(12 * np.log2(freqs[sel] / 440)) + 9) % 12          # 0 = C
E = Hm[:, sel]
per = np.stack([E[:, pc == k].sum(axis=1) for k in range(12)], axis=1)
per = per / np.maximum(per.sum(axis=1, keepdims=True), 1e-12)
chroma = per.mean(axis=0)
major = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
minor = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
names = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]
best = max(((np.corrcoef(chroma, np.roll(p, k))[0, 1], names[k] + (" major" if p is major else " minor"), k, p is major)
            for p in (major, minor) for k in range(12)), key=lambda z: z[0])
key_name, tonic_pc, is_major = best[1], best[2], best[3]
tonic_hz = 440 * 2 ** ((tonic_pc - 9) / 12)
while tonic_hz < 220: tonic_hz *= 2
while tonic_hz >= 440: tonic_hz /= 2

result = {"song": os.path.abspath(song), "seconds": len(x) / SR, "bpm": round(bpm, 2), "beats": [round(b, 4) for b in beats],
          "key": key_name, "key_correlation": round(float(best[0]), 3), "tonic_hz": round(tonic_hz, 3)}
print(f"tempo {bpm:.1f} bpm, {len(beats)} beats from {beats[0]:.3f} s; key {key_name} (r {best[0]:.2f}); {len(x) / SR:.1f} s")

# ---- words
if "--no-words" not in args:
    w16 = work + "-16k.wav"
    decode(song, 16000, True, w16)
    lyric_words, sections = [], []
    if lyrics_path:
        block = open(lyrics_path).read().split("```")[1]
        for raw in block.splitlines():
            m = re.match(r"\[(.+?)\]", raw.strip())
            if m:
                sections.append({"name": m.group(1), "first_word": len(lyric_words)}); continue
            for wd in raw.split():
                lyric_words.append({"text": wd, "line": raw.strip(), "section": sections[-1]["name"] if sections else ""})
    prompt = " ".join(w["text"] for w in lyric_words[:60]) if lyric_words else ""
    cmd = ["whisper-cli", "-m", MODEL, "-f", w16, "-ojf", "-ml", "1", "-sow", "-of", work + "-whisper", "-l", "en"]
    if prompt:
        cmd += ["--prompt", prompt]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    wj = json.load(open(work + "-whisper.json"))
    heard = []
    for seg in wj.get("transcription", []):
        txt = seg["text"].strip()
        if txt:
            heard.append({"text": txt, "t0": seg["offsets"]["from"] / 1000, "t1": seg["offsets"]["to"] / 1000})
    norm = lambda s: re.sub(r"[^a-z0-9']", "", s.lower())
    result["heard"] = len(heard)
    if lyric_words:
        # align lyric words to heard words (edit distance on normalised words), then interpolate the gaps
        A, B = [norm(w["text"]) for w in lyric_words], [norm(h["text"]) for h in heard]
        n, m = len(A), len(B)
        D = np.zeros((n + 1, m + 1)); D[:, 0] = np.arange(n + 1); D[0, :] = np.arange(m + 1)
        for i in range(1, n + 1):
            for j in range(1, m + 1):
                D[i, j] = min(D[i - 1, j] + 1, D[i, j - 1] + 1, D[i - 1, j - 1] + (0 if A[i - 1] == B[j - 1] else 1.3))
        i, j, match = n, m, {}
        while i > 0 and j > 0:
            if D[i, j] == D[i - 1, j - 1] + (0 if A[i - 1] == B[j - 1] else 1.3):
                if A[i - 1] == B[j - 1]: match[i - 1] = j - 1
                i, j = i - 1, j - 1
            elif D[i, j] == D[i - 1, j] + 1: i -= 1
            else: j -= 1
        times = [heard[match[k]]["t0"] if k in match else None for k in range(n)]
        known = [k for k, v in enumerate(times) if v is not None]
        for k in range(n):
            if times[k] is None and known:
                lo = max([q for q in known if q < k], default=None); hi = min([q for q in known if q > k], default=None)
                if lo is not None and hi is not None:
                    times[k] = times[lo] + (times[hi] - times[lo]) * (k - lo) / (hi - lo)
                else:
                    times[k] = times[lo if lo is not None else hi]
        for k, w in enumerate(lyric_words):
            w["t"] = round(times[k], 3) if times[k] is not None else None
            w["matched"] = k in match
        for s in sections:
            s["t"] = lyric_words[s["first_word"]]["t"] if s["first_word"] < n else None
        result["words"] = lyric_words
        result["sections"] = sections
        result["matched"] = f"{len(match)} of {n} lyric words heard"
        print(f"words: {len(match)} of {n} lyric words matched to whisper's {m}; sections: " +
              ", ".join(f"{s['name']} {s['t']:.1f}" for s in sections if s.get("t") is not None))
    else:
        result["words"] = heard
json.dump(result, open(out, "w"), indent=1)
print("wrote", out)
