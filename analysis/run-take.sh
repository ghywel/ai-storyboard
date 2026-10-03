#!/bin/zsh
# The timing pipeline for one take: stems, offset check, CTC emissions, whisper, vocal features, alignment + QA plots.
#   TAKE=<take> ./run-take.sh        (reads takes/<take>/audio.wav and lyrics.src.json; see METHOD.md, phase 3)
#   ALIGN_MODELS=lv60k TAKE=<take> ./run-take.sh   aligns with the MIT model only (MMS_FA's weights are CC-BY-NC 4.0)
set -e
cd "${0:A:h}"
: ${TAKE:?set TAKE to a folder under takes/}
export TAKE
echo "== $TAKE: demucs htdemucs_ft"; [[ -f stems/$TAKE/htdemucs_ft/audio/vocals.wav ]] || uv run python -m demucs -n htdemucs_ft -d mps -o stems/$TAKE ../takes/$TAKE/audio.wav
echo "== offset"; uv run python check_offset.py
echo "== ctc emissions"; uv run python ctc_emissions.py vocals vocL vocR
echo "== whisper"; uv run python whisper_run.py turbo > work/$TAKE/whisper.log
echo "== vocal features"; uv run python vocal_feats.py
echo "== align"; uv run python align.py --plots
echo "== done"
