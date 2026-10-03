"""The stems must sit on the master's timeline: the sum of the four Demucs stems is cross-correlated with the master
at three points; every lag must be 0 samples (pdoom-video needed 1015 for an mp3's encoder delay; a WAV needs none)."""
import common
import numpy as np
import soundfile as sf

mix, sr = sf.read(str(common.AUDIO), dtype="float32", always_2d=True)
mix = mix.mean(1)
import soxr
mix = soxr.resample(mix, sr, 44100)
stems = sum(common.load_stem(n)[0] for n in ("vocals", "drums", "bass", "other"))
lags = []
for t in (0.25 * len(mix) / 44100, 0.5 * len(mix) / 44100, 0.75 * len(mix) / 44100):   # inside any take
    a = int(t * 44100)
    seg = stems[a:a + 44100 * 2]
    win = mix[a - 2205:a + 44100 * 2 + 2205]
    c = np.array([np.dot(seg, win[k:k + len(seg)]) for k in range(4410)])
    lags.append(int(np.argmax(c)) - 2205)
print("stem lag vs master (samples at 44.1 kHz):", lags)
assert all(abs(l) <= 1 for l in lags), "stems are offset from the master"
