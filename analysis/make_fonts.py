# Generate static font instances for the renderer (canvas + opentype.js need static outlines).
#   cd analysis && uv run python make_fonts.py
# (The paths pointed at pdoom-video's app/ folder until 2026-10-05; the engine lives in engine/ here.)
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from pathlib import Path
here = Path(__file__).resolve().parent
src = here / '../engine/public/fonts/src'; out = here / '../engine/public/fonts'
jobs = []
for wd in [62, 75, 87.5, 100, 112.5, 125]:
    for wt in [300, 500, 700, 900]:
        jobs.append(('Archivo[wdth,wght].ttf', {'wdth': wd, 'wght': wt}, f'Archivo-w{int(wd*10)}-{wt}.ttf'))
for wd in [75, 100]:
    for wt in [400, 800]:
        jobs.append(('Archivo-Italic[wdth,wght].ttf', {'wdth': wd, 'wght': wt}, f'ArchivoItalic-w{int(wd*10)}-{wt}.ttf'))
for wt in [400, 600]:
    jobs.append(('CormorantGaramond[wght].ttf', {'wght': wt}, f'Cormorant-{wt}.ttf'))
    jobs.append(('CormorantGaramond-Italic[wght].ttf', {'wght': wt}, f'CormorantItalic-{wt}.ttf'))
# EB Garamond: a serif with Greek (polytonic too) and Cyrillic, for lyrics and inscriptions beyond Latin
for wt in [400, 500, 600, 700]:
    jobs.append(('EBGaramond[wght].ttf', {'wght': wt}, f'EBGaramond-{wt}.ttf'))
for wt in [400, 600]:
    jobs.append(('EBGaramond-Italic[wght].ttf', {'wght': wt}, f'EBGaramondItalic-{wt}.ttf'))
only = __import__('sys').argv[1:]   # e.g. `make_fonts.py EBGaramond` cuts only the files whose name starts so
for s, loc, name in jobs:
    if only and not any(name.startswith(o) for o in only):
        continue
    f = TTFont(src / s)
    inst = instancer.instantiateVariableFont(f, loc, updateFontNames=False)
    inst.save(out / name)
print(len(jobs), 'instances' + (f' (only {only})' if only else ''))
