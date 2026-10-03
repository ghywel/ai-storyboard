#!/usr/bin/env python3
"""A take's emotional shape, measured, for planning the film's cadence: per section its loudness (EBU R128
short-term), brightness (spectral centroid), onset density, and key; and the whole song as a loudness line.

    dynamics.py <master.wav> <sections.json> [--out dyn.json]

Sections are [{name, t}] in the master's time (e.g. the generator's section tags, or the aligned lyrics' sections).
"""
import json, os, re, subprocess, sys
import numpy as np

FF = os.environ.get("FFMPEG", "ffmpeg")   # any recent FFmpeg; set FFMPEG to choose one
wav, spath = sys.argv[1], sys.argv[2]
out = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else None
secs = json.load(open(spath))

# short-term loudness every 100 ms (ebur128 framelog)
log = subprocess.run([FF, "-hide_banner", "-nostats", "-i", wav, "-filter_complex", "ebur128=framelog=info", "-f", "null", "-"],
                     capture_output=True, text=True).stderr
ST = []
for line in log.splitlines():
    m = re.search(r"t:\s*([\d.]+).*?S:\s*(-?inf|-?[\d.]+)", line)
    if m:
        s = m.group(2)
        ST.append((float(m.group(1)), -70.0 if "inf" in s else float(s)))
ST = np.array(ST)
assert len(ST) > 100, f"ebur128 frame log not parsed ({len(ST)} frames)"   # a silent empty parse once

# mono 22.05 kHz for brightness, onsets and key
SR = 22050
raw = subprocess.run([FF, "-loglevel", "error", "-i", wav, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
x = np.frombuffer(raw, dtype=np.float32).astype(np.float64)
dur = len(x) / SR
hop, n = 512, 2048
win = np.hanning(n)
F = np.abs(np.fft.rfft(np.stack([x[i * hop:i * hop + n] * win for i in range(1 + (len(x) - n) // hop)]), axis=1))
freqs = np.fft.rfftfreq(n, 1 / SR)
ft = (np.arange(len(F)) * hop + n / 2) / SR
cent = (F * freqs).sum(1) / np.maximum(F.sum(1), 1e-9)
flux = np.maximum(0, np.diff(np.log1p(100 * F), axis=0)).sum(1); flux = np.r_[0, flux]
fl = flux - np.convolve(flux, np.ones(32) / 32, "same")
thr = np.percentile(fl, 90)
peaks = [i for i in range(1, len(fl) - 1) if fl[i] > thr and fl[i] >= fl[i - 1] and fl[i] > fl[i + 1]]
pt = ft[peaks]

names = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]
major = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
minor = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
sel = (freqs > 130) & (freqs < 1100)
pc = ((np.round(12 * np.log2(freqs[sel] / 440)) + 9) % 12).astype(int)
def key_of(a, b):
    m = (ft >= a) & (ft < b)
    if m.sum() < 20: return "-", 0
    E = F[m][:, sel]
    per = np.stack([E[:, pc == k].sum(1) for k in range(12)], 1)
    per = per / np.maximum(per.sum(1, keepdims=True), 1e-12)
    ch = per.mean(0)
    best = max(((np.corrcoef(ch, np.roll(p, k))[0, 1], names[k] + (" maj" if p is major else " min")) for p in (major, minor) for k in range(12)))
    return best[1], best[0]

bounds = [s["t"] for s in secs] + [dur]
rows = []
print(f"{'section':22s} {'start':>6s} {'dur':>5s} {'LUFS-S':>7s} {'max':>6s} {'bright':>7s} {'on/s':>5s}  key")
for i, s in enumerate(secs):
    a, b = bounds[i], bounds[i + 1]
    m = (ST[:, 0] >= a) & (ST[:, 0] < b)
    lu = ST[m, 1]
    c = cent[(ft >= a) & (ft < b)]
    on = ((pt >= a) & (pt < b)).sum() / max(b - a, 1e-6)
    k, r = key_of(a, b)
    row = dict(name=s["name"], start=round(a, 2), dur=round(b - a, 2), lufs=round(float(np.median(lu)), 1) if len(lu) else None,
               lufs_max=round(float(lu.max()), 1) if len(lu) else None, bright=round(float(np.median(c))), onsets=round(on, 2), key=k, key_r=round(float(r), 2))
    rows.append(row)
    print(f"{s['name'][:22]:22s} {a:6.1f} {b - a:5.1f} {row['lufs'] or 0:7.1f} {row['lufs_max'] or 0:6.1f} {row['bright']:7d} {on:5.2f}  {k} ({r:.2f})")

# the loudness line, one character per 2 s
ticks = " ▁▂▃▄▅▆▇█"
line, labels = "", ""
for t in np.arange(0, dur, 2.0):
    m = (ST[:, 0] >= t) & (ST[:, 0] < t + 2)
    v = ST[m, 1].mean() if m.any() else -70
    line += ticks[int(np.clip((v + 34) / 26 * 8, 0, 8))]
for i, s in enumerate(secs):
    pos = int(s["t"] / 2)
    labels = labels.ljust(pos) + "|"
print("\nshort-term loudness, 2 s per mark (-34 to -8 LUFS):")
print(line); print(labels)
if out:
    json.dump(dict(sections=rows, st=[[round(a, 2), round(b, 1)] for a, b in ST[::5]]), open(out, "w"))
