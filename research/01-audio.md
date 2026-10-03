# Survey 01: the audio analysis (alignment, separation, beats, loudness, key)

Checked on 2026-10-03.
- **[R]**: the publisher, arXiv, proceedings, Crossref record, official repo or docs were opened.
- **[R2]**: a snippet only.
- **[M]**: our own measurement.

## Forced alignment of sung lyrics

- **Vineel Pratap, Andros Tjandra, Bowen Shi et al.** (16 authors, the last Michael Auli)
  - *Scaling Speech Technology to 1,000+ Languages* (MMS), JMLR 25(97):1–52, 2024.
  - It gives the MMS_FA alignment model (§3.1.5: 31K hours, 1,130 languages), the ⟨*⟩ star token (§3.1.3), a GPU
    Viterbi forced alignment and uroman romanisation.
  - Sources: https://jmlr.org/papers/v25/23-1318.html; https://arxiv.org/abs/2305.13516 [R]
- **The star token's lineage:**
  - Vineel Pratap, Awni Hannun, Gabriel Synnaeve and Ronan Collobert, *Star Temporal Classification*, NeurIPS 2022:
    https://proceedings.neurips.cc/paper_files/paper/2022/hash/57587d8d6a7ede0e5302fc22d0878c53-Abstract-Conference.html [R]
  - Xingyu Cai, Jiahong Yuan, Yuchen Bian et al., *W-CTC*, ICLR 2022: https://openreview.net/forum?id=0RqDp8FCW5Z [R]
  - Our "garbage" token between lines, which absorbs ad-libs and repeats, extends this line of work.
- **torchaudio `MMS_FA`**: https://docs.pytorch.org/audio/stable/generated/torchaudio.pipelines.MMS_FA.html [R].
  **Its weights are licensed CC-BY-NC 4.0 (non-commercial).**
- **torchaudio `WAV2VEC2_ASR_LARGE_LV60K_960H`**: pre-trained on 60k hours of Libri-Light and fine-tuned on 960 hours
  of LibriSpeech; MIT. Source:
  https://docs.pytorch.org/audio/stable/generated/torchaudio.pipelines.WAV2VEC2_ASR_LARGE_LV60K_960H.html [R]
- **Alexei Baevski, Yuhao Zhou, Abdelrahman Mohamed and Michael Auli**, *wav2vec 2.0*, NeurIPS 2020, the architecture
  of both acoustic models. Source: https://arxiv.org/abs/2006.11477 [R]
- **Alex Graves, Santiago Fernández, Faustino Gomez and Jürgen Schmidhuber**, *Connectionist temporal
  classification*, ICML 2006, 369–376. Source: https://doi.org/10.1145/1143844.1143891 [R]
- **Ludwig Kürzinger, Dominik Winkelbauer, Lujun Li et al.**, *CTC-Segmentation of Large Corpora for German
  End-to-End Speech Recognition*, SPECOM 2020. Source: https://doi.org/10.1007/978-3-030-60276-5_27 [R]
- **Jeff Hwang, Moto Hira, Caroline Chen et al.**, *TorchAudio 2.1*, IEEE ASRU 2023: the citable paper for
  `forced_align`. Source: https://arxiv.org/abs/2310.17864 [R]
- **The tutorials:**
  - Xiaohui Zhang and Moto Hira, *CTC forced alignment API* and *Forced alignment for multilingual data*;
  - Moto Hira, *Forced Alignment with Wav2Vec2*.

  Source: https://docs.pytorch.org/audio/stable/tutorials/ [R]
- **Michael McAuliffe, Michaela Socolof, Sarah Mihuc et al.**, *Montreal Forced Aligner*, Interspeech 2017.
  Context: the HMM/Kaldi aligner. Source: https://doi.org/10.21437/Interspeech.2017-1386 [R]
- **Daniel Stoller, Simon Durand and Sebastian Ewert**, *End-to-end Lyrics Alignment for Polyphonic Music Using an
  Audio-to-Character Recognition Model*, ICASSP 2019: the precedent for character-level CTC alignment of lyrics.
  Source: https://arxiv.org/abs/1902.06797 [R]
- **Gabriel Meseguer-Brocal, Alice Cohen-Hadria and Geoffroy Peeters**, *DALI*, ISMIR 2018. Source:
  https://arxiv.org/abs/1906.10606 [R]
- **MIREX 2017, Automatic Lyrics-to-Audio Alignment**: the benchmark task and its metrics. Source:
  https://music-ir.org/mirex/wiki/2017:Automatic_Lyrics-to-Audio_Alignment [R]

## Whisper

- **Alec Radford, Jong Wook Kim, Tao Xu et al.**, *Robust Speech Recognition via Large-Scale Weak Supervision*, ICML
  2023 (arXiv December 2022). Source: https://arxiv.org/abs/2212.04356 [R]
- **Max Bain, Jaesung Huh, Tengda Han and Andrew Zisserman**, *WhisperX*, Interspeech 2023: Whisper followed by
  wav2vec2 forced alignment. Its default English aligner is WAV2VEC2_ASR_BASE_960H, so our two-model global Viterbi
  alignment is a different design. Source: https://arxiv.org/abs/2303.00747 [R]
- **mlx-whisper** (MLX contributors): https://github.com/ml-explore/mlx-examples/tree/main/whisper [R]
- **whisper.cpp** (Georgi Gerganov and ggml-org, 2022; MIT): https://github.com/ggml-org/whisper.cpp [R]

## Source separation

- **Simon Rouard, Francisco Massa and Alexandre Défossez**, *Hybrid Transformers for Music Source Separation*,
  ICASSP 2023: HT Demucs; `htdemucs_ft` is its per-source fine-tuning. Source: https://arxiv.org/abs/2211.08553 [R]
- **Alexandre Défossez**, *Hybrid Spectrogram and Waveform Source Separation*, 2021. Source:
  https://arxiv.org/abs/2111.03600 [R]
- **Alexandre Défossez, Nicolas Usunier, Léon Bottou and Francis Bach**, *Music Source Separation in the Waveform
  Domain*, 2019. Source: https://arxiv.org/abs/1911.13254 [R]
- **The Demucs repository** (MIT): https://github.com/facebookresearch/demucs [R]. Archived on 2025-01-01; the
  maintained fork is https://github.com/adefossez/demucs.
- **Romain Hennequin, Anis Khlif, Felix Voituret and Manuel Moussallam**, *Spleeter*, JOSS 2020 (context). Source:
  https://doi.org/10.21105/joss.02154 [R]

## Beats, downbeats and tempo

- **Daniel P. W. Ellis**, *Beat Tracking by Dynamic Programming*, JNMR 36(1), 2007. Source:
  https://doi.org/10.1080/09298210701653344 [R]
- **Brian McFee, Colin Raffel, Dawen Liang et al.**, *librosa*, SciPy 2015. Source:
  https://doi.org/10.25080/Majora-7b98e3ed-003 [R]
- **Sebastian Böck, Filip Korzeniowski, Jan Schlüter et al.**, *madmom*, ACM MM 2016. Source:
  https://arxiv.org/abs/1605.07008 [R]
- **Sebastian Böck, Florian Krebs and Gerhard Widmer**, *Joint Beat and Downbeat Tracking with Recurrent Neural
  Networks*, ISMIR 2016. Source: https://archives.ismir.net/ismir2016/paper/000186.pdf [R]
- **Francesco Foscarin, Jan Schlüter and Gerhard Widmer**, *Beat this!*, ISMIR 2024. Source:
  https://arxiv.org/abs/2407.21658 [R]
- **Metrical-level ("octave") errors:**
  - Fabien Gouyon, Anssi Klapuri, Simon Dixon et al., IEEE TASLP 2006: https://doi.org/10.1109/TSA.2005.858509
    [R]/[R2]
  - Martin F. McKinney, Dirk Moelants, Matthew E. P. Davies and Anssi Klapuri, JNMR 2007:
    https://doi.org/10.1080/09298210701653252 [R]/[R2]
  - Hendrik Schreiber, Julián Urbano and Meinard Müller, *Music Tempo Estimation: Are We Done Yet?*, TISMIR 2020:
    https://doi.org/10.5334/tismir.43 [R]
  - The literature names errors by factors of 2, 3, ½ and ⅓.
  - **[M]** We met a 2:3 error (83.6 bpm read for 125.4), and that is our own observation.

## Loudness

- **ITU-R BS.1770**: gated integrated loudness from BS.1770-2 (03/2011) on; -5 (11/2023) is in force. Sources:
  https://www.itu.int/rec/R-REC-BS.1770 [R]; the EBU news item of 2011:
  https://tech.ebu.ch/news/itu-publishes-new-itu-r-bs1770-2-with-eb-15apr11 [R]
- **EBU R 128** (v5.0, 2023): https://tech.ebu.ch/publications/r128 [R]
- **EBU Tech 3341**: the windows, momentary 0.4 s and **short-term 3 s**, which `tools/dynamics.py` reads. Source:
  https://tech.ebu.ch/publications/tech3341 [R]

## Key and chroma

- **Carol L. Krumhansl and Edward J. Kessler**, Psychological Review 89(4), 1982: the major and minor key profiles
  (`tools/song-analyze.py`). Source: https://doi.org/10.1037/0033-295X.89.4.334 [R]
- **Carol L. Krumhansl**, *Cognitive Foundations of Musical Pitch*, Oxford University Press, 1990. Source:
  https://archive.org/details/cognitivefoundat0000krum [R] (the 2001 printing)
- **Takuya Fujishima**, Pitch Class Profile, ICMC 1999 [R2]. **Mark A. Bartsch and Gregory H. Wakefield**, chroma,
  WASPAA 2001: https://doi.org/10.1109/ASPAA.2001.969531 [R]

## Brightness

- **John M. Grey**, *Multidimensional perceptual scaling of musical timbres*, JASA 61(5), 1977. Source:
  https://doi.org/10.1121/1.381428 [R]/[R2]
- **Emery Schubert and Joe Wolfe**, *Does Timbral Brightness Scale with Frequency and Spectral Centroid?*, Acta
  Acustica 2006 [R2]. `tools/dynamics.py` reports the spectral centroid as "brightness".

## Not verified

- A published source for 2:3 tempo errors specifically.
- The Libri-Light, LibriSpeech and uroman papers, which were not opened.
