"""Run mlx-whisper (word timestamps) on the time-corrected vocal stem.

Writes work/whisper_<tag>.json. Used as an independent cross-check for the
CTC forced alignment in align.py.
"""
import common  # noqa: F401  (sets cache dirs)
import json, sys
import mlx_whisper

MODELS = {
    "turbo": "mlx-community/whisper-large-v3-turbo",
    "large": "mlx-community/whisper-large-v3-mlx",
}

def vocals16k():
    f = common.WORK / "vocals16k.wav"
    if not f.exists():
        import soundfile as sf
        y, sr = common.load_stem("vocals", sr=16000)
        sf.write(str(f), y, 16000)
    return f


def run(tag, model, prompt=None):
    vocals16k()
    res = mlx_whisper.transcribe(
        str(common.WORK / "vocals16k.wav"), path_or_hf_repo=model, language="en",
        word_timestamps=True, condition_on_previous_text=False, initial_prompt=prompt,
        temperature=0.0, no_speech_threshold=None, hallucination_silence_threshold=None,
    )
    out = common.WORK / f"whisper_{tag}.json"
    out.write_text(json.dumps(res, indent=1, default=float))
    for seg in res["segments"]:
        print(f"{seg['start']:7.2f} {seg['end']:7.2f} {seg['text']}")
    return res

if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "turbo"
    lyr = " ".join(t for _, _, t in common.load_lyrics_src())
    run(which, MODELS[which])
    # an optional vocabulary prompt (place names, unusual words) in takes/<take>/whisper-prompt.txt helps whisper hear them
    pf = common.TAKEDIR / "whisper-prompt.txt"
    if pf.exists():
        run(which + "_prompt", MODELS[which], pf.read_text().strip())
