"""Compute frame-wise CTC log-probabilities (20 ms frames) for the vocal stem.

Two acoustic models give two independent alignments:
  mms   : torchaudio MMS_FA (multilingual, romanized chars, trained for alignment)
  lv60k : torchaudio WAV2VEC2_ASR_LARGE_LV60K_960H (English chars)
Emissions are computed on overlapping chunks with context and stitched, then
cached to work/emission_<name>.npy (shape [frames, vocab]).
"""
import common
import sys
import numpy as np
import torch
import torchaudio

HOP = 320  # samples @16k -> 20 ms


BUNDLES = {"mms": torchaudio.pipelines.MMS_FA, "lv60k": torchaudio.pipelines.WAV2VEC2_ASR_LARGE_LV60K_960H}


def load(name, device=None):
    bundle = BUNDLES[name]
    model = bundle.get_model(with_star=False) if name == "mms" else bundle.get_model()
    device = device or common.device()
    return model.to(device).eval(), device


def compute(name, chunk_s=20.0, ctx_s=3.0, device=None, source="vocals", model=None):
    bundle = BUNDLES[name]
    if model is None:
        model, device = load(name, device)
    device = next(model.parameters()).device
    y, sr = common.load_vocal_source(source, sr=16000)
    y = y / (np.abs(y).max() + 1e-9)
    n_frames = len(y) // HOP
    chunk, ctx = int(chunk_s * 16000), int(ctx_s * 16000)
    out = None
    for s in range(0, len(y), chunk):
        a, b = max(0, s - ctx), min(len(y), s + chunk + ctx)
        x = torch.from_numpy(y[a:b]).float()[None].to(device)
        with torch.inference_mode():
            em, _ = model(x)
            em = torch.log_softmax(em, dim=-1)[0].float().cpu().numpy()
        if out is None:
            out = np.full((n_frames, em.shape[1]), np.nan, np.float32)
        f0 = a // HOP
        lo, hi = s // HOP, min(n_frames, (s + chunk) // HOP)
        seg = em[lo - f0: hi - f0]
        out[lo: lo + len(seg)] = seg
    # fill any tail frames
    last = np.where(~np.isnan(out[:, 0]))[0].max()
    out[last + 1:] = out[last]
    tag = name if source == "vocals" else f"{name}_{source}"
    np.save(common.WORK / f"emission_{tag}.npy", out)
    print(name, out.shape, "labels", len(bundle.get_labels()))
    return out


if __name__ == "__main__":
    # each model loaded once for every source, then freed (one model per source pair grew MPS memory to 4 GB and
    # pushed a 16 GB Mac into swap, 2026-10-02)
    import gc
    srcs = sys.argv[1:] or ["vocals", "lead", "vocL", "vocR"]
    from ctcalign import MODELS   # ALIGN_MODELS=lv60k skips MMS_FA (CC-BY-NC 4.0 weights)
    for n in MODELS:
        model, _ = load(n)
        for src in srcs:
            compute(n, source=src, model=model)
        del model
        gc.collect()
        if common.device() == "mps":
            torch.mps.empty_cache()
