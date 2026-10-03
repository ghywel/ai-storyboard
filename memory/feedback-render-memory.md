---
name: feedback-render-memory
description: "Never stream raw frames out of a headless browser; encode in the page, render in guarded resumable segments"
metadata:
  type: feedback
---

Encode with WebCodecs inside the page and send only compressed chunks. Render the final in 55 s segments, each a
fresh browser loading only its plates, under a memory guard that watches the compressor and swap (not RSS), with
.done markers so a stop costs one segment.

**Why:** raw RGBA frames out of headless Chromium (WebSocket or POST) leaked about a frame per frame, invisible to
RSS, and froze a 16 GB laptop twice. The in-page encoder was flat and fast (1080p at ~180 fps).

**How to apply:** tools/render-final.sh and tools/memwatch.py. If the guard fires, look at which process grew (its log
names it) before changing anything: once it was another application.
