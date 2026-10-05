"""Run whisper (word timestamps) on the time-corrected vocal stem.

Writes work/whisper_<tag>.json. Used as an independent cross-check for the CTC forced alignment in align.py.

Backends: mlx-whisper on Apple silicon; openai-whisper elsewhere (Intel Macs, Linux, Windows), on common.device()'s
CPU or CUDA (its MPS support is partial). pyproject.toml installs the right one; both write the same JSON.

WHISPER_LANG (default "en") is the language whisper listens for. A song in two languages (a chorus in English, a
bridge chanted in Greek) is still best heard as its main language: whisper then misses the other language's lines,
align.py's whisper agreement drops for them alone, and the forced alignment (which reads the lyric's letters, not a
language) times them as usual. Read their QA plots.
"""
import common  # noqa: F401  (sets cache dirs)
import json, os, sys

MLX = {
    "turbo": "mlx-community/whisper-large-v3-turbo",
    "large": "mlx-community/whisper-large-v3-mlx",
}
OPENAI = {"turbo": "turbo", "large": "large-v3"}
LANG = os.environ.get("WHISPER_LANG", "en")


def vocals16k():
    f = common.WORK / "vocals16k.wav"
    if not f.exists():
        import soundfile as sf
        y, sr = common.load_stem("vocals", sr=16000)
        sf.write(str(f), y, 16000)
    return f


def transcribe(which, prompt):
    opts = dict(language=LANG, word_timestamps=True, condition_on_previous_text=False, initial_prompt=prompt,
                temperature=0.0, no_speech_threshold=None, hallucination_silence_threshold=None)
    try:
        import mlx_whisper
    except ImportError:
        mlx_whisper = None
    if mlx_whisper is not None:
        return mlx_whisper.transcribe(str(vocals16k()), path_or_hf_repo=MLX[which], **opts)
    import whisper
    dev = "cuda" if common.device() == "cuda" else "cpu"
    model = whisper.load_model(OPENAI[which], device=dev, download_root=str(common.CACHE / "whisper"))
    return model.transcribe(str(vocals16k()), fp16=dev == "cuda", **opts)


def run(tag, which, prompt=None):
    res = transcribe(which, prompt)
    out = common.WORK / f"whisper_{tag}.json"
    out.write_text(json.dumps(res, indent=1, default=float))
    for seg in res["segments"]:
        print(f"{seg['start']:7.2f} {seg['end']:7.2f} {seg['text']}")
    n = sum(len(s.get("words", [])) for s in res["segments"])
    print(f"whisper {tag}: {len(res['segments'])} segments, {n} words")
    assert n > 0, "whisper heard no words: check the vocal stem"
    return res


if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "turbo"
    run(which, which)
    # an optional vocabulary prompt (place names, unusual words) in takes/<take>/whisper-prompt.txt helps whisper hear
    # them; align.py reads the prompted run when there is one
    pf = common.TAKEDIR / "whisper-prompt.txt"
    if pf.exists():
        run(which + "_prompt", which, pf.read_text().strip())
