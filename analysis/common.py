"""Shared paths / cache setup for the analysis scripts (forked from mexicat/pdoom-video, MIT; adapted: one folder per
take under takes/<TAKE>/, a WAV master as the time reference).

Import this module FIRST (before torch / huggingface / mlx imports) so that all
model downloads land in analysis/.cache/.
"""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent          # analysis/
PROJECT = ROOT.parent                            # the repository root
CACHE = ROOT / ".cache"
for var, sub in [("TORCH_HOME", "torch"), ("HF_HOME", "hf"), ("HF_HUB_CACHE", "hf/hub"),
                 ("XDG_CACHE_HOME", "xdg"), ("HUGGINGFACE_HUB_CACHE", "hf/hub"),
                 ("TRANSFORMERS_CACHE", "hf/transformers"), ("MPLCONFIGDIR", "mpl"),
                 ("NUMBA_CACHE_DIR", "numba"), ("UV_CACHE_DIR", "uv")]:
    os.environ.setdefault(var, str(CACHE / sub))
    (CACHE / sub).mkdir(parents=True, exist_ok=True)

TAKE = os.environ.get("TAKE", "demo")
TAKEDIR = PROJECT / "takes" / TAKE
AUDIO = TAKEDIR / "audio.wav"                      # the film's master (the song, plus any intro/outro you add)
STEMS = ROOT / "stems" / TAKE / "htdemucs_ft" / "audio"
LYRICS_SRC = TAKEDIR / "lyrics.src.json"           # [[start, end, text], ...] in master time (the sung lines, in order)
DATA = TAKEDIR
QA = ROOT / "qa" / TAKE
WORK = ROOT / "work" / TAKE         # intermediate results (whisper json, alignments)
QA.mkdir(parents=True, exist_ok=True)
WORK.mkdir(parents=True, exist_ok=True)


def device():
    """Where the models run: ANALYSIS_DEVICE if set (cpu, mps, cuda), else MPS on Apple silicon, CUDA when present, else
    CPU. Intel Macs default to CPU: torch 2.2's MPS on their AMD GPUs is not something this pipeline has measured."""
    d = os.environ.get("ANALYSIS_DEVICE")
    if d:
        return d
    import platform
    import torch
    if platform.system() == "Darwin" and platform.machine() == "arm64" and torch.backends.mps.is_available():
        return "mps"
    return "cuda" if torch.cuda.is_available() else "cpu"


def load_lyrics_src():
    """lyrics.src.json -> list of (start, end, text)."""
    import json
    return [tuple(x) for x in json.loads(LYRICS_SRC.read_text(encoding="utf-8"))]


# The master is a WAV, so there is no mp3 encoder delay to undo (pdoom-video shifted its stems by 1015 samples for
# LAME's). Checked, not assumed: check_offset.py cross-correlates the vocal stem with the master.
STEM_OFFSET_SAMPLES = 0
STEM_OFFSET_SEC = 0.0


def load_stem(name, sr=None, mono=True):
    """Load a Demucs stem, time-aligned to the gapless mp3 decode."""
    import soundfile as sf
    import numpy as np
    y, s = sf.read(STEMS / f"{name}.wav", dtype="float32", always_2d=True)
    assert s == 44100
    y = y[STEM_OFFSET_SAMPLES:]
    y = y.mean(axis=1) if mono else y.T
    if sr and sr != s:
        import soxr
        y = soxr.resample(y, s, sr) if mono else np.stack([soxr.resample(c, s, sr) for c in y])
        s = sr
    return y, s


KARAOKE = ROOT / "stems" / TAKE / "karaoke"


def load_lead(sr=None, mono=True):
    """Lead vocal only (mel-band-roformer karaoke model run on the mp3; already
    in gapless-mp3 time, no offset)."""
    import soundfile as sf
    import numpy as np
    y, s = sf.read(KARAOKE / "lead.wav", dtype="float32", always_2d=True)
    y = y.mean(axis=1) if mono else y.T
    if sr and sr != s:
        import soxr
        y = soxr.resample(y, s, sr) if mono else np.stack([soxr.resample(c, s, sr) for c in y])
        s = sr
    return y, s


def load_vocal_source(name, sr=None):
    """'vocals' = Demucs vocal stem (mono sum), 'vocL'/'vocR' = its left/right
    channel (choruses are double-tracked and panned L/R, so each channel is
    closer to a single voice), 'lead' = karaoke lead."""
    if name == "lead":
        return load_lead(sr)
    if name in ("vocL", "vocR"):
        y, s = load_stem("vocals", sr=sr, mono=False)
        return y[0 if name == "vocL" else 1], s
    return load_stem("vocals", sr=sr)


def load_mix(sr=44100, mono=True):
    import librosa
    y, s = librosa.load(str(AUDIO), sr=sr, mono=mono)
    return y, s
