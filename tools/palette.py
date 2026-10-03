#!/usr/bin/env python3
"""A film's palette, measured: what fills the screen, and the bright saturated accents that make it glow.

    palette.py <video> <out-prefix> [--fps 2]     prints both palettes and the hue balance; writes <out-prefix>.png

Frames at 2 a second, 160x90, in CIE Lab (D65). The area palette is k-means (k=10) over every sampled pixel; the
accent palette is k-means (k=8) over the pixels with chroma above 40 and lightness above 45 (the neon). The swatch
image is two bands, each colour as wide as its share.
"""
import os, subprocess, sys
import numpy as np

FF = os.environ.get("FFMPEG", "ffmpeg")   # any recent FFmpeg; set FFMPEG to choose one
video, prefix = sys.argv[1], sys.argv[2]
fps = sys.argv[sys.argv.index("--fps") + 1] if "--fps" in sys.argv else "2"
W, H = 160, 90
raw = subprocess.run([FF, "-loglevel", "error", "-i", video, "-vf", f"fps={fps},scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                     capture_output=True, check=True).stdout
rgb = np.frombuffer(raw, dtype=np.uint8).reshape(-1, 3).astype(np.float64) / 255
frames = len(rgb) // (W * H)


def to_lab(c):
    lin = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = lin @ M.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 216 / 24389, np.cbrt(xyz), (24389 / 27 * xyz + 16) / 116)
    return np.stack([116 * f[:, 1] - 16, 500 * (f[:, 0] - f[:, 1]), 200 * (f[:, 1] - f[:, 2])], axis=1)


def kmeans(X, k, seed=0, iters=40):
    rng = np.random.default_rng(seed)
    C = X[rng.choice(len(X), 1)]
    for _ in range(k - 1):                       # k-means++ seeding
        d = np.min(((X[:, None, :] - C[None]) ** 2).sum(-1), axis=1)
        C = np.vstack([C, X[rng.choice(len(X), p=d / d.sum())]])
    for _ in range(iters):
        lab = np.argmin(((X[:, None, :] - C[None]) ** 2).sum(-1), axis=1)
        C = np.array([X[lab == j].mean(0) if np.any(lab == j) else C[j] for j in range(k)])
    return C, np.bincount(lab, minlength=k) / len(X), lab


lab = to_lab(rgb)
rng = np.random.default_rng(1)
sub = rng.choice(len(lab), min(150_000, len(lab)), replace=False)
L, a, b = lab[:, 0], lab[:, 1], lab[:, 2]
C = np.hypot(a, b)
hue = (np.degrees(np.arctan2(b, a)) + 360) % 360

hexs = lambda c: "#%02x%02x%02x" % tuple(int(round(v * 255)) for v in np.clip(c, 0, 1))
def describe(name, Xlab, Xrgb, k):
    cents, share, labels = kmeans(Xlab, k)
    order = np.argsort(-share)
    print(f"{name}:")
    out = []
    for j in order:
        mean_rgb = Xrgb[labels == j].mean(0)
        Lj, aj, bj = cents[j]
        print(f"  {hexs(mean_rgb)}  {share[j] * 100:5.1f}%   L {Lj:5.1f}  C {np.hypot(aj, bj):5.1f}  h {(np.degrees(np.arctan2(bj, aj)) + 360) % 360:5.0f}")
        out.append((mean_rgb, share[j]))
    return out

print(f"{os.path.basename(video)}: {frames} frames at {fps}/s")
print(f"  dark (L < 20): {np.mean(L < 20) * 100:.0f}% of the screen; neon (C > 40, L > 45): {np.mean((C > 40) & (L > 45)) * 100:.1f}%; "
      f"mean chroma {C.mean():.1f}; near-white (L > 90, C < 10): {np.mean((L > 90) & (C < 10)) * 100:.1f}%")
area = describe("area palette", lab[sub], rgb[sub], 10)
neon = (C > 40) & (L > 45)
acc_idx = np.flatnonzero(neon)
acc_idx = rng.choice(acc_idx, min(80_000, len(acc_idx)), replace=False)
accent = describe("accent palette (C > 40, L > 45)", lab[acc_idx], rgb[acc_idx], 8)
# hue balance of the neon, chroma-weighted, in 12 named sectors
names = ["red", "orange", "yellow", "lime", "green", "teal", "cyan", "azure", "blue", "violet", "magenta", "pink"]
hb = np.histogram(hue[neon], bins=12, range=(0, 360), weights=C[neon])[0]
hb = hb / hb.sum()
print("  neon hue balance (Lab hue sectors of 30 deg from 0): " + ", ".join(f"{n} {v * 100:.0f}%" for n, v in zip(names, hb) if v > 0.02))

# the swatch: two bands, 1600 x 200 each
SW = 1600
img = np.zeros((400, SW, 3))
for row, pal in ((0, area), (1, accent)):
    x = 0
    for c, s in pal:
        wpx = int(round(s * SW)) if c is not pal[-1][0] else SW - x
        img[row * 200:(row + 1) * 200, x:x + wpx] = c
        x += wpx
subprocess.run([FF, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{SW}x400", "-i", "-", prefix + ".png"],
               input=(img * 255).round().astype(np.uint8).tobytes(), check=True)
print("wrote", prefix + ".png")
