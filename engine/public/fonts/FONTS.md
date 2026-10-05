# Fonts

These fonts come from the upstream engine, [pdoom-video](https://github.com/mexicat/pdoom-video), except EB Garamond (added
2026-10-05 from [google/fonts](https://github.com/google/fonts/tree/main/ofl/ebgaramond) for lyrics in Greek: none of
the others has Greek letters). The engine's code is MIT. The fonts keep their own licences.

| Files | Family | Licence |
|---|---|---|
| `Archivo-*.ttf`, `ArchivoItalic-*.ttf` | Archivo (Omnibus-Type), static instances cut from the variable font in `src/` by `analysis/make_fonts.py` | SIL Open Font License 1.1, `OFL-Archivo.txt` |
| `Cormorant-*.ttf`, `CormorantItalic-*.ttf` | Cormorant Garamond (Christian Thalmann, Catharsis Fonts) | SIL Open Font License 1.1, `OFL-CormorantGaramond.txt` |
| `src/IBMPlexMono-*.ttf` | IBM Plex Mono (IBM) | SIL Open Font License 1.1, `OFL-IBMPlexMono.txt` |
| `EBGaramond-*.ttf`, `EBGaramondItalic-*.ttf` | EB Garamond (Georg Duffner, Octavio Pardo), static instances cut from the variable fonts in `src/` by `analysis/make_fonts.py`; Greek (polytonic too) and Cyrillic | SIL Open Font License 1.1, `OFL-EBGaramond.txt` |
| `stroke/*.svg` | EMS and Hershey single-stroke fonts, through the `hersheytext` package | OFL / public domain, per pdoom-video's credits |

The OFL texts were fetched from [google/fonts](https://github.com/google/fonts) on 2026-10-03.
