#!/usr/bin/env python3
"""The storyboard gate's page (METHOD.md, phase 7): one keyframe per shot, with its line and a one-sentence idea, in a
single self-contained HTML file the director can open anywhere.

    boards.py <take> <boards.json> <out.html> [--scale 1] [--width 960]

boards.json is a list of shots in film order, each {"plate": id, "t": master seconds, "line": "the sung words or a
beat", "idea": "one sentence"}; the plate authors' reports give the times and ideas. Each plate's keyframes are
rendered in one browser (render.ts stills --only <plate>), downscaled to --width and embedded as JPEG.
"""
import base64, html, json, os, subprocess, sys
from collections import OrderedDict

take, spec, out = sys.argv[1], sys.argv[2], sys.argv[3]
opt = lambda k, d: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d
width = int(opt("--width", "960"))
FF = os.environ.get("FFMPEG", "ffmpeg")
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
shots = json.load(open(spec))
assert shots, f"no shots in {spec}"
work = os.path.join(ROOT, "out", "boards", take)
os.makedirs(work, exist_ok=True)

by_plate = OrderedDict()
for s in shots:
    by_plate.setdefault(s["plate"], []).append(s)
for plate, ss in by_plate.items():
    ts = ",".join(f"{s['t']:.2f}" for s in ss)
    r = subprocess.run(["bun", "scripts/render.ts", "stills", "--take", take, "--only", plate, "--t", ts, "--out", os.path.join(work, plate)],
                       cwd=os.path.join(ROOT, "engine"), capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"render failed for {plate}:\n{r.stderr[-2000:]}")
    if "SCENE ERRORS" in r.stderr:
        print(f"warning: {plate} reported scene errors:\n{r.stderr[-1500:]}", file=sys.stderr)

cards = []
for i, s in enumerate(shots):
    png = os.path.join(work, s["plate"], f"f_{s['t']:07.2f}.png")
    assert os.path.exists(png), f"missing still {png}"
    jpg = png[:-4] + ".jpg"
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", png, "-vf", f"scale={width}:-2", "-q:v", "4", jpg], check=True)
    b64 = base64.b64encode(open(jpg, "rb").read()).decode()
    m, sec = divmod(s["t"], 60)
    cards.append(f'''<figure><img src="data:image/jpeg;base64,{b64}" alt="{html.escape(s['plate'])} at {s['t']:.2f} s">
<figcaption><span class="n">{i + 1}</span> <b>{html.escape(s['plate'])}</b> <span class="t">{int(m)}:{sec:05.2f}</span>
<q>{html.escape(s.get('line', ''))}</q><span class="idea">{html.escape(s.get('idea', ''))}</span></figcaption></figure>''')

page = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Storyboard: {html.escape(take)}</title><style>
:root{{--bg:#f6f3ec;--fg:#1c1a17;--mute:#6b665d;--card:#fff}}
@media (prefers-color-scheme:dark){{:root{{--bg:#121214;--fg:#ece8df;--mute:#9a958b;--card:#1c1c20}}}}
body{{margin:0;background:var(--bg);color:var(--fg);font:15px/1.45 Georgia,serif;padding:24px 16px}}
h1{{font-weight:500;margin:0 0 4px}} p.sub{{color:var(--mute);margin:0 0 20px}}
main{{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,420px),1fr));gap:18px}}
figure{{margin:0;background:var(--card);border-radius:6px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.15)}}
img{{display:block;width:100%;height:auto}} figcaption{{padding:10px 12px 12px}}
.n{{display:inline-block;min-width:1.6em;color:var(--mute)}} .t{{float:right;color:var(--mute);font-family:ui-monospace,monospace;font-size:13px}}
q{{display:block;margin:6px 0 4px;font-style:italic}} .idea{{color:var(--mute)}}
</style></head><body><h1>Storyboard: {html.escape(take)}</h1><p class="sub">{len(shots)} shots, one keyframe each, in film order.</p>
<main>{"".join(cards)}</main></body></html>'''
open(out, "w").write(page)
print(f"wrote {out}: {len(shots)} shots from {len(by_plate)} plates, {os.path.getsize(out) / 1e6:.1f} MB")
