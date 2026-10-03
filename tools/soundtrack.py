#!/usr/bin/env python3
"""A take's full soundtrack when the film wraps the song in its own sound: an intro (sdir/prologue-sea.wav), the take,
and an outro (sdir/outro-sea.wav), levels matched by integrated loudness (EBU R128): the intro 4 LU under the song so
it builds into the first line, the outro 3 LU under, crossfaded from the song's last bars. Films that open straight on
the song do not need this: decode the take to a 48 kHz WAV master instead (METHOD.md, phase 3).

    soundtrack.py <take audio> <sound dir> <out.m4a|.wav>
"""
import os, re, subprocess, sys

FF = os.environ.get("FFMPEG", "ffmpeg")   # any recent FFmpeg; set FFMPEG to choose one
take, sdir, out = sys.argv[1], sys.argv[2], sys.argv[3]


def lufs(path):
    r = subprocess.run([FF, "-hide_banner", "-nostats", "-i", path, "-filter_complex", "ebur128", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    summary = r[r.rfind("Summary:"):]
    return float(re.search(r"I:\s+(-?[\d.]+) LUFS", summary).group(1))


lt, lp, lo = lufs(take), lufs(f"{sdir}/prologue-sea.wav"), lufs(f"{sdir}/outro-sea.wav")
gp, go = (lt - 4) - lp, (lt - 3) - lo
codec = ["-c:a", "aac", "-b:a", "256k"] if out.endswith(".m4a") else ["-c:a", "pcm_s24le"]
subprocess.run([FF, "-y", "-loglevel", "error", "-i", f"{sdir}/prologue-sea.wav", "-i", take, "-i", f"{sdir}/outro-sea.wav",
                "-filter_complex",
                f"[0:a]volume={gp:.2f}dB,aresample=48000[p];[1:a]aresample=48000[s];[2:a]volume={go:.2f}dB,aresample=48000[o];"
                f"[p][s]concat=n=2:v=0:a=1[ps];[ps][o]acrossfade=d=2.5:c1=tri:c2=tri[m]",
                "-map", "[m]", *codec, out], check=True)
dur = float(subprocess.run([os.environ.get("FFPROBE", "ffprobe"), "-v", "error", "-show_entries", "format=duration",
                            "-of", "csv=p=0", out], capture_output=True, text=True).stdout)
print(f"{os.path.basename(out)}: take {lt:.1f} LUFS, prologue {gp:+.1f} dB, outro {go:+.1f} dB, {int(dur // 60)}:{dur % 60:04.1f}")
