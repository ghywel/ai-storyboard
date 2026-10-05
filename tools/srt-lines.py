#!/usr/bin/env python3
"""A generator's own timed lyrics (the Suno .m4a downloads we received carried them as a mov_text subtitle track; undocumented, so check with ffprobe) as a first timeline: sections,
lines, and words. Measured: these timings were off by more than a beat on 22-35% of lines in two takes, so use them
as a draft and as the source of the sung text, and time the film from forced alignment (analysis/).

    srt-lines.py <take.srt> <take.json>        adds "sections", "lines" and "words" to the take's analysis JSON (made if absent)
    srt-lines.py <take.srt> --take takes/<t>   writes the take's first drafts: lyrics.src.json ([start, end, text] per
                                               sung line) and sections.suno.json ([{name, t}] per section tag), to be
                                               corrected against what is sung (METHOD.md, phase 3)

Suno times every lyric line and section tag. Within a line, each word gets a share of the line's time by its
syllables, the first word at the line's start. That is close enough to land type on the singing; whisper can refine a
line later if a word visibly drifts.
"""
import json, os, re, sys

srt, out = sys.argv[1], sys.argv[2]
take = sys.argv[3] if out == "--take" else None
blocks = open(srt, encoding="utf-8").read().strip().split("\n\n")


def secs(s):
    h, m, rest = s.split(":"); sec, ms = rest.split(",")
    return int(h) * 3600 + int(m) * 60 + int(sec) + int(ms) / 1000


def syllables(w):
    w = re.sub(r"[^a-z]", "", w.lower())
    return max(1, len(re.findall(r"[aeiouy]+", w)) - (1 if w.endswith("e") and len(w) > 3 and not w.endswith("le") else 0))


sections, lines, words = [], [], []
for b in blocks:
    L = b.split("\n")
    if len(L) < 3:
        continue
    t0, t1 = [secs(x.strip()) for x in L[1].split("-->")]
    text = " ".join(L[2:]).strip()
    m = re.match(r"^\[(.+)\]$", text)
    if m:
        sections.append({"name": m.group(1), "t": t0}); continue
    sec = sections[-1]["name"] if sections else ""
    lines.append({"t0": t0, "t1": t1, "text": text, "section": sec})
    ws = text.split()
    syl = [syllables(w) for w in ws]
    tot = sum(syl); acc = 0
    # the line's last word holds; the words share the first 85 % of the line by syllables
    span = (t1 - t0) * 0.85
    for w, s in zip(ws, syl):
        words.append({"t": round(t0 + span * acc / tot, 3), "text": w, "line": len(lines) - 1, "section": sec})
        acc += s

assert lines, f"no lyric lines parsed from {srt}"
if take:
    json.dump([[l["t0"], l["t1"], l["text"]] for l in lines], open(os.path.join(take, "lyrics.src.json"), "w"), indent=1, ensure_ascii=False)
    json.dump(sections, open(os.path.join(take, "sections.suno.json"), "w"), indent=1, ensure_ascii=False)
    out = os.path.join(take, "lyrics.src.json")
else:
    j = json.load(open(out)) if os.path.exists(out) else {}
    j["sections"] = sections; j["lines"] = lines; j["words"] = words
    json.dump(j, open(out, "w"), indent=1)
print(f"{out}: {len(sections)} sections, {len(lines)} lines, {len(words)} words; " +
      ", ".join(f"{s['name']} {s['t']:.0f}s" for s in sections))
