#!/usr/bin/env python3
"""The last check before a film is delivered (or a preview is sent): measure the MP4, not our intentions.

    film-qc.py <film.mp4> [--take takes/<take>] [--fps 60] [--size 3840x2160] [--hold-beats 2]
               [--allow a-b ...] [--allow-black] [--cut-tol 1] [--strict-cuts] [--sheet out.jpg] [--json report.json]

Checks (FAIL stops delivery; WARN and INFO are read by a person):
  format     size, frame rate, constant frame rate (avg == r_frame_rate), yuv420p, h264 + aac, duration vs the take
  black      no black stretch mid-film (ffmpeg blackdetect, d=0.05 s, pix_th=0.10); --allow-black when it is designed
  blank      no frame that has lost its picture: edge share < 0.2 % for >= 0.3 s mid-film (catches unloaded plates, a
             flooded glow layer, a render past the take's end; edge-based, so a dark but drawn frame passes)
  frozen     no picture frozen longer than the film's hold ceiling: --hold-beats beats of the take's grid + 1 frame
             (God Moved's picture-book ceiling is 2 beats); without a take, 1.5 s. --allow a-b exempts designed holds
  cuts       every detected cut lands within --cut-tol frames of a beat of the take's grid (WARN; FAIL with --strict-cuts)
  loudness   integrated LUFS and true peak of the mux (INFO: a Suno master is delivered as it is, but we record it)
  sheet      a contact sheet, 1 frame/s, at most 60 tiles: a person must look at it

Thresholds come from huashu-art-motion's film_gate.py (MIT, alchaincyf) and mortiflix-oss's final-pass QC (ideas only,
written fresh here). Measured 2026-10-19; see LESSONS.md.
"""
import json, os, re, subprocess, sys
import numpy as np

FF = os.environ.get("FFMPEG", "ffmpeg")
FP = os.environ.get("FFPROBE", "ffprobe")
args = sys.argv[1:]
if not args or args[0].startswith("-"):
    print(__doc__); sys.exit(2)
film = args[0]


def opt(k, d=None):
    return args[args.index(k) + 1] if k in args and args.index(k) + 1 < len(args) else d


def opts(k):
    return [args[i + 1] for i, a in enumerate(args) if a == k and i + 1 < len(args)]


results = []   # (level, check, message)


def report(level, check, msg):
    results.append((level, check, msg))
    print(f"{level:4s}  {check:9s} {msg}")


def mmss(t):
    return f"{int(t // 60)}:{t % 60:05.2f}"


allow = []
for a in opts("--allow"):
    lo, hi = (float(x) for x in a.split("-"))
    allow.append((lo, hi))
allowed = lambda a, b: any(lo - 0.05 <= a and b <= hi + 0.05 for lo, hi in allow)

# ---------- format ----------
pr = json.loads(subprocess.run([FP, "-v", "error", "-show_streams", "-show_format", "-of", "json", film], capture_output=True, text=True, check=True).stdout)
vs = next((s for s in pr["streams"] if s["codec_type"] == "video"), None)
au = next((s for s in pr["streams"] if s["codec_type"] == "audio"), None)
assert vs, "no video stream"
dur = float(pr["format"]["duration"])
num = lambda r: (lambda a, b: a / b if b else 0)(*map(float, r.split("/")))
afr, rfr = num(vs["avg_frame_rate"]), num(vs["r_frame_rate"])
want_fps = float(opt("--fps", "60"))
size = opt("--size")
if size and f'{vs["width"]}x{vs["height"]}' != size:
    report("FAIL", "format", f'size {vs["width"]}x{vs["height"]}, expected {size}')
if abs(afr - want_fps) > 0.01 or abs(afr - rfr) > 0.5:
    report("FAIL", "format", f"frame rate avg {afr:.3f} / r {rfr:.3f}, expected a constant {want_fps:g}")
if vs.get("pix_fmt") != "yuv420p":
    report("FAIL", "format", f'pixel format {vs.get("pix_fmt")}, expected yuv420p (players and YouTube expect it)')
if vs.get("codec_name") != "h264":
    report("WARN", "format", f'video codec {vs.get("codec_name")}')
if not au:
    report("FAIL", "format", "no audio stream")
elif au.get("codec_name") != "aac":
    report("WARN", "format", f'audio codec {au.get("codec_name")}')
take = opt("--take")
grid = None
if take and os.path.exists(os.path.join(take, "audio.json")):
    grid = json.load(open(os.path.join(take, "audio.json")))
    if abs(dur - grid["duration"]) > max(0.1, 0.002 * grid["duration"]):
        report("WARN", "format", f'duration {dur:.2f} s against the take\'s {grid["duration"]:.2f} s')
if not any(r[1] == "format" and r[0] == "FAIL" for r in results):
    report("PASS", "format", f'{vs["width"]}x{vs["height"]} {afr:g} fps CFR, {vs.get("pix_fmt")}, {vs.get("codec_name")}+{au.get("codec_name") if au else "-"}, {dur:.2f} s')

# ---------- black (ffmpeg) ----------
log = subprocess.run([FF, "-hide_banner", "-nostats", "-i", film, "-vf", "blackdetect=d=0.05:pix_th=0.10", "-an", "-f", "null", "-"], capture_output=True, text=True).stderr
blacks = [(float(a), float(b)) for a, b in re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", log)]
mid = [(a, b) for a, b in blacks if a > 0.5 and b < dur - 0.5 and not allowed(a, b)]
if mid and "--allow-black" not in args:
    report("FAIL", "black", "black mid-film at " + ", ".join(f"{mmss(a)}-{mmss(b)}" for a, b in mid[:8]))
else:
    report("PASS", "black", f"{len(blacks)} black stretch(es), none mid-film" if not mid else f"{len(mid)} designed black stretch(es) allowed")

# ---------- decode once, small and grey, for blank / frozen / cuts ----------
FW, FH = 320, 180
raw = subprocess.run([FF, "-loglevel", "error", "-i", film, "-vf", f"scale={FW}:{FH}:flags=area,format=gray", "-an", "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
fr = np.frombuffer(raw, dtype=np.uint8).reshape(-1, FH, FW).astype(np.int16)
n = len(fr)
assert n > 10, f"decoded only {n} frames"
fps = n / dur
t_of = lambda i: i / fps

# blank: share of pixels whose gradient exceeds 24, per frame
gx = np.abs(np.diff(fr, axis=2))[:, :-1, :]
gy = np.abs(np.diff(fr, axis=1))[:, :, :-1]
edge = ((gx + gy) > 24).mean(axis=(1, 2))
low = edge < 0.002
runs, i = [], 0
while i < n:
    if low[i]:
        j = i
        while j < n and low[j]: j += 1
        a, b = t_of(i), t_of(j)
        if b - a >= 0.3 and a > 0.5 and b < dur - 0.5 and not allowed(a, b): runs.append((a, b))
        i = j
    else: i += 1
if runs: report("FAIL", "blank", "frames with no picture at " + ", ".join(f"{mmss(a)}-{mmss(b)}" for a, b in runs[:8]))
else: report("PASS", "blank", f"every frame has a picture (lowest edge share {edge.min() * 100:.2f} %)")

# frozen: consecutive frames with a mean absolute difference under 0.35 grey levels
diff = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))
if grid:
    P = grid["beat_period"] if "beat_period" in grid else 60 / grid["bpm"]
    ceiling = float(opt("--hold-beats", "2")) * P + 1 / want_fps
    what = f"{opt('--hold-beats', '2')} beats + 1 frame = {ceiling:.3f} s"
else:
    ceiling, what = 1.5, "1.5 s (no take given)"
still = diff < 0.35
frozen, i = [], 0
while i < len(still):
    if still[i]:
        j = i
        while j < len(still) and still[j]: j += 1
        a, b = t_of(i), t_of(j + 1)
        if b - a > ceiling + 0.5 / fps and not allowed(a, b) and b < dur - 0.05: frozen.append((a, b))
        i = j
    else: i += 1
if frozen: report("FAIL", "frozen", f"held longer than {what}: " + ", ".join(f"{mmss(a)} ({b - a:.2f} s)" for a, b in frozen[:10]) + (f" … {len(frozen)} in all" if len(frozen) > 10 else ""))
else: report("PASS", "frozen", f"no picture held longer than {what}")

# cuts: a frame difference that spikes above the LOCAL motion around it. huashu's film_gate uses a global
# d >= max(8, 3 x median + 2); a picture-book cut between two states of one composition can change only a few grey levels
# (it found 2 of 5 such cuts, 2026-10-19), so the baseline here is the median of the 30 frames around each frame.
pad = np.pad(diff, 15, mode="edge")
base = np.array([np.median(np.r_[pad[k:k + 15], pad[k + 16:k + 31]]) for k in range(len(diff))])
spike = diff >= np.maximum(2.0, 6 * base + 1.0)
cuts = [t_of(k + 1) for k in range(len(diff)) if spike[k] and (k == 0 or not spike[k - 1])]
if grid and cuts:
    beats = np.array(grid["beats"])
    tol = float(opt("--cut-tol", "1")) / want_fps + 0.5 / fps
    off = [(c, float(c - beats[np.argmin(np.abs(beats - c))])) for c in cuts]
    bad = [(c, o) for c, o in off if abs(o) > tol]
    level = "FAIL" if bad and "--strict-cuts" in args else ("WARN" if bad else "PASS")
    report(level, "cuts", f"{len(cuts)} cuts, {len(cuts) - len(bad)} on the beat (within {float(opt('--cut-tol', '1')):g} frame)" +
           (": off at " + ", ".join(f"{mmss(c)} ({o * 1000:+.0f} ms)" for c, o in bad[:10]) if bad else ""))
else:
    report("INFO", "cuts", f"{len(cuts)} cuts detected" + ("" if grid else " (no take: not checked against the beat)"))

# ---------- loudness ----------
if au:
    lg = subprocess.run([FF, "-hide_banner", "-nostats", "-i", film, "-filter_complex", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    I = re.findall(r"I:\s+(-?[\d.]+) LUFS", lg); TP = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", lg)
    if I: report("INFO", "loudness", f"integrated {I[-1]} LUFS, true peak {TP[-1] if TP else '?'} dBTP (streaming targets about -14 LUFS, <= -1 dBTP)")

# ---------- contact sheet ----------
sheet = opt("--sheet", os.path.splitext(film)[0] + "-sheet.jpg")
step = max(1.0, dur / 60)
rows = int(np.ceil(min(60, dur / step) / 6))
subprocess.run([FF, "-loglevel", "error", "-y", "-i", film, "-vf", f"fps=1/{step:.3f},scale=320:-1,tile=6x{rows}:padding=4", "-frames:v", "1", "-update", "1", sheet], check=True)
report("INFO", "sheet", f"{sheet}: look at every tile (nothing half-loaded, no placeholder, nothing stuck or cut off)")

if opt("--json"):
    json.dump([dict(level=l, check=c, message=m) for l, c, m in results], open(opt("--json"), "w"), indent=1)
fails = [r for r in results if r[0] == "FAIL"]
print(f"\n{'FAILED' if fails else 'passed'}: {len(fails)} fail, {sum(r[0] == 'WARN' for r in results)} warn")
sys.exit(1 if fails else 0)
