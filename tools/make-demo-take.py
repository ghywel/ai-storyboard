#!/usr/bin/env python3
"""A synthetic take, so the engine can be tried without a song: takes/demo/ with a 16 s master (a 120 bpm kick, snare
and hat with a bass line and a hummed melody), lyrics.json (two lines, word-timed), audio.json (the beat grid,
envelopes and onsets in the analysis pipeline's format) and plates.json (two plates).

    python3 tools/make-demo-take.py            -> takes/demo/
    cd engine && bun install && bun scripts/render.ts stills --take demo --t 2,9 --out ../out/demo

Standard library only (wave, math, json).
"""
import json, math, os, struct, wave

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "takes", "demo")
os.makedirs(OUT, exist_ok=True)

SR, DUR, BPM = 48000, 16.0, 120.0
BEAT = 60.0 / BPM
N = int(SR * DUR)
beats = [round(i * BEAT, 4) for i in range(int(DUR / BEAT))]
downbeats = beats[::4]

# the words: two lines, one word per beat from bar 2 and bar 5
LINES = [("Every frame is drawn in code,", 2.0), ("every cut lands on the beat.", 8.0)]
words_t = []
lyrics = []
for i, (text, t0) in enumerate(LINES):
    ws = []
    for k, w in enumerate(text.split()):
        s = t0 + k * BEAT
        ws.append({"w": w, "start": round(s, 3), "end": round(s + BEAT * 0.9, 3), "conf": 1.0})
        words_t.append(s)
    lyrics.append({"i": i, "text": text, "start": ws[0]["start"], "end": ws[-1]["end"], "words": ws})

# the audio: kick on 1 and 3, snare on 2 and 4, hats on eighths, a bass root per bar, a sine "voice" per word
buf = [0.0] * N
def noise(k):
    """Deterministic white noise in [-1, 1) (a hash, not random: the take is the same every run)."""
    k = (k * 2654435761) & 0xFFFFFFFF
    k ^= k >> 15; k = (k * 2246822519) & 0xFFFFFFFF; k ^= k >> 13
    return (k & 0xFFFF) / 32768.0 - 1.0
def add(t0, dur, f):
    a, b = int(t0 * SR), min(N, int((t0 + dur) * SR))
    for n in range(a, b):
        buf[n] += f((n - a) / SR)
for i, t in enumerate(beats):
    if i % 2 == 0:
        add(t, 0.25, lambda x: 0.9 * math.sin(2 * math.pi * (50 + 60 * math.exp(-x * 30)) * x) * math.exp(-x * 9))
    else:
        add(t, 0.18, lambda x, s=i: 0.35 * noise(s * 100003 + int(x * SR)) * math.exp(-x * 22))
    add(t + BEAT / 2, 0.05, lambda x, s=i: 0.12 * noise(s * 7919 + 17 + int(x * SR)) * math.exp(-x * 60))
roots = [55.0, 55.0 * 1.335, 55.0 * 1.5, 55.0 * 1.2]
for b, t in enumerate(downbeats):
    f0 = roots[b % 4]
    add(t, BEAT * 4, lambda x, f0=f0: 0.25 * math.sin(2 * math.pi * f0 * x) * (1 - math.exp(-x * 40)))
scale = [220.0, 246.9, 261.6, 293.7, 329.6, 293.7, 261.6, 246.9]
for k, s in enumerate(words_t):
    f = scale[k % len(scale)]
    add(s, BEAT * 0.9, lambda x, f=f: 0.22 * math.sin(2 * math.pi * f * x + 0.6 * math.sin(2 * math.pi * 5 * x)) * min(1, x * 30) * math.exp(-x * 1.5))

peak = max(1e-9, max(abs(v) for v in buf))
with wave.open(os.path.join(OUT, "audio.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    frames = bytearray()
    for v in buf:
        s = int(32767 * 0.8 * v / peak)
        frames += struct.pack("<hh", s, s)
    w.writeframes(bytes(frames))

# envelopes at 100 fps: rms from the signal; the stems faked from the parts' timings
FPS = 100
nf = int(DUR * FPS)
rms = []
for i in range(nf):
    a, b = int(i * SR / FPS), int((i + 1) * SR / FPS)
    seg = buf[a:b]
    rms.append(round(math.sqrt(sum(v * v for v in seg) / max(1, len(seg))) / peak, 4))
def env(events, decay):
    out = [0.0] * nf
    for t in events:
        for i in range(int(t * FPS), min(nf, int((t + 1.5) * FPS))):
            out[i] = max(out[i], math.exp(-(i / FPS - t) * decay))
    return [round(v, 4) for v in out]
drums = env(beats, 8)
vocal = [0.0] * nf
for line in lyrics:
    for i in range(int(line["start"] * FPS), min(nf, int(line["end"] * FPS))):
        vocal[i] = 0.8
audio = {
    "duration": DUR, "bpm": BPM, "beat_period": BEAT, "time_signature": 4,
    "beats": beats, "downbeats": downbeats,
    "sections": [{"name": "Intro", "start": 0.0, "end": 2.0}, {"name": "Line 1", "start": 2.0, "end": 8.0},
                 {"name": "Line 2", "start": 8.0, "end": DUR}],
    "fps": FPS, "rms": rms, "low": drums, "mid": vocal, "high": env([b + BEAT / 2 for b in beats], 30),
    "vocal": vocal, "drums": drums, "bass": env(downbeats, 0.6), "other": [0.0] * nf,
    "onsets": {"kick": [[t, 1.0] for t in beats[::2]], "snare": [[t, 0.8] for t in beats[1::2]],
               "hat": [[round(t + BEAT / 2, 4), 0.4] for t in beats], "vocal": [[t, 0.7] for t in words_t]},
    "notes": "Synthetic demo take (tools/make-demo-take.py).",
}
json.dump(audio, open(os.path.join(OUT, "audio.json"), "w"))
json.dump({"lines": lyrics, "extras": [], "notes": "Synthetic demo lyrics."}, open(os.path.join(OUT, "lyrics.json"), "w"), indent=1)
json.dump({"plates": [{"id": "open", "scene": "demo", "at": 0, "params": {"look": 0}},
                      {"id": "second", "scene": "demo", "at": "every cut lands", "params": {"look": 1}}]},
          open(os.path.join(OUT, "plates.json"), "w"), indent=1)
print(f"wrote {OUT}: audio.wav ({DUR:.0f} s), lyrics.json ({len(lyrics)} lines), audio.json, plates.json")
