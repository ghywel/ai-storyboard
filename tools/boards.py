#!/usr/bin/env python3
"""The storyboard gate's page (METHOD.md, phase 7): one keyframe per shot, with its line and a one-sentence idea,
grouped by plate, in a single self-contained HTML page the director can open anywhere.

    boards.py <take> <boards.json> <out.html> [--title T] [--intro intro.html] [--lead image.png] [--width 960]
              [--fragment]

boards.json is a list of shots in film order, each {"plate": id, "t": master seconds, "line": "the sung words or a
beat", "idea": "one sentence"}; the plate authors' reports give the times and ideas. Each plate's keyframes are
rendered in one browser (render.ts stills --only <plate>), downscaled to --width and embedded as JPEG. The plates'
windows come from `render.ts timeline`. --intro inserts an HTML block under the title (what the director is asked);
--lead adds one image above the shots (a colour script, say). --fragment writes the page without its document
skeleton (for hosts that add their own).
"""
import base64, html, json, os, subprocess, sys
from collections import OrderedDict

take, spec, out = sys.argv[1], sys.argv[2], sys.argv[3]
opt = lambda k, d=None: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d
width = int(opt("--width", "960"))
title = opt("--title", f"Storyboard {take}")
FF = os.environ.get("FFMPEG", "ffmpeg")
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ENGINE = os.path.join(ROOT, "engine")
shots = json.load(open(spec))
assert shots, f"no shots in {spec}"
work = os.path.join(ROOT, "out", "boards", take)
os.makedirs(work, exist_ok=True)

tl = subprocess.run(["bun", "scripts/render.ts", "timeline", "--take", take], cwd=ENGINE, capture_output=True, text=True)
windows = {e["id"]: (e["start"], e["end"]) for line in tl.stdout.splitlines() if line.startswith("[") for e in json.loads(line)}

by_plate = OrderedDict()
for s in shots:
    by_plate.setdefault(s["plate"], []).append(s)
for plate, ss in by_plate.items():
    ts = ",".join(f"{s['t']:.2f}" for s in ss)
    r = subprocess.run(["bun", "scripts/render.ts", "stills", "--take", take, "--only", plate, "--t", ts, "--out", os.path.join(work, plate)],
                       cwd=ENGINE, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"render failed for {plate}:\n{r.stderr[-2000:]}")
    if "SCENE ERRORS" in r.stderr:
        print(f"warning: {plate} reported scene errors:\n{r.stderr[-1500:]}", file=sys.stderr)


def jpeg(png):
    jpg = os.path.splitext(png)[0] + f"-{width}.jpg"
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", png, "-vf", f"scale={width}:-2", "-q:v", "4", jpg], check=True)
    return base64.b64encode(open(jpg, "rb").read()).decode()


def mmss(t):
    m, s = divmod(t, 60)
    return f"{int(m)}:{s:05.2f}"


sections, n = [], 0
for plate, ss in by_plate.items():
    cards = []
    for s in ss:
        n += 1
        png = os.path.join(work, plate, f"f_{s['t']:07.2f}.png")
        assert os.path.exists(png), f"missing still {png}"
        cards.append(f'''<figure class="shot" id="s{n}"><img src="data:image/jpeg;base64,{jpeg(png)}" alt="Shot {n}, {html.escape(plate)}, at {mmss(s['t'])}" loading="lazy">
<figcaption><div class="meta"><span class="num">{n}</span><span class="tc">{mmss(s['t'])}</span></div>
<p class="line">{html.escape(s.get('line', ''))}</p><p class="idea">{html.escape(s.get('idea', ''))}</p></figcaption></figure>''')
    w = windows.get(plate)
    span = f'<span class="win">{mmss(w[0])} to {mmss(w[1])}</span>' if w else ""
    sections.append(f'<section class="plate" id="{html.escape(plate)}"><h2>{html.escape(plate)}{span}</h2><div class="grid">{"".join(cards)}</div></section>')

intro = open(opt("--intro")).read() if opt("--intro") else ""
lead = ""
if opt("--lead"):
    lead = f'<figure class="lead"><img src="data:image/jpeg;base64,{jpeg(opt("--lead"))}" alt="Colour script"></figure>'

style = '''
/* Layout: a contact sheet of the film in order, one section per plate, shots in a wrapping grid. */
:root {
  --bg: #eef0f3; --panel: #ffffff; --fg: #1b2233; --mute: #5c6478; --rule: #d5d9e1; --accent: #a8641c;
  --display: "EB Garamond", "Cormorant Garamond", Georgia, serif; --body: "EB Garamond", Georgia, serif;
  --mono: "IBM Plex Mono", ui-monospace, Menlo, monospace;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --bg: #0b0f1c; --panel: #141a2b; --fg: #e8e6df; --mute: #9aa2b6; --rule: #262e44; --accent: #ffb54a; color-scheme: dark } }
:root[data-theme="dark"] { --bg: #0b0f1c; --panel: #141a2b; --fg: #e8e6df; --mute: #9aa2b6; --rule: #262e44; --accent: #ffb54a; color-scheme: dark }
body { background: var(--bg); color: var(--fg); font: 17px/1.5 var(--body); margin: 0; }
.wrap { max-width: 1400px; margin: 0 auto; padding-inline: max(16px, 3vw); padding-block: 28px 48px; display: grid; gap: 28px; }
header { display: grid; gap: 8px; max-width: 70ch; }
h1 { font: 500 clamp(30px, 4vw, 44px)/1.1 var(--display); margin: 0; text-wrap: balance; letter-spacing: 0.01em; }
.sub { color: var(--mute); margin: 0; }
.intro { display: grid; gap: 10px; max-width: 70ch; }
.intro p, .intro ul { margin: 0; } .intro li { margin-block: 4px; }
.lead { margin: 0; } .lead img { width: 100%; border-radius: 4px; display: block; }
.plate { display: grid; gap: 12px; }
h2 { font: 600 15px/1.2 var(--mono); text-transform: uppercase; letter-spacing: 0.12em; margin: 0; padding-block: 10px 6px;
  border-bottom: 1px solid var(--rule); display: flex; flex-wrap: wrap; gap: 6px 16px; align-items: baseline; }
.win { font-weight: 400; color: var(--mute); letter-spacing: 0.04em; text-transform: none; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 380px), 1fr)); gap: 18px; }
.shot { margin: 0; background: var(--panel); border-radius: 4px; overflow: hidden; display: grid; grid-template-rows: auto 1fr; min-width: 0; }
.shot img { display: block; width: 100%; height: auto; aspect-ratio: 16 / 9; object-fit: cover; }
figcaption { padding: 10px 14px 14px; display: grid; gap: 4px; min-width: 0; }
.meta { display: flex; justify-content: space-between; font: 13px/1 var(--mono); color: var(--mute); font-variant-numeric: tabular-nums; }
.num { color: var(--accent); font-weight: 600; }
.line { margin: 0; font-style: italic; font-size: 18px; }
.idea { margin: 0; color: var(--mute); font-size: 15.5px; }
'''
body = f'''<div class="wrap"><header><h1>{html.escape(title)}</h1>
<p class="sub">{n} shots from {len(by_plate)} plates, one keyframe each, in film order.</p></header>
{f'<div class="intro">{intro}</div>' if intro else ''}{lead}{"".join(sections)}</div>'''
fonts = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;600&display=swap">'
if "--fragment" in sys.argv:
    page = f"<title>{html.escape(title)}</title>\n{fonts}\n<style>{style}</style>\n{body}\n"
else:
    page = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>{fonts}<style>{style}</style></head><body>{body}</body></html>'''
open(out, "w").write(page)
print(f"wrote {out}: {n} shots from {len(by_plate)} plates, {os.path.getsize(out) / 1e6:.1f} MB")
