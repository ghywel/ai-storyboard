---
name: feedback-verify-before-delivery
description: "Before sending a final: full decode, frame count against duration, frames at every segment join, the credits frame at full size"
metadata:
  type: feedback
---

Decode the whole file (any hardware decoder) and expect no errors; count video frames against duration x fps; extract
the frames either side of each segment join; render or extract the credits frame and read the names.

**Why:** a final is the one artefact the director judges; an unverified one can carry a dropped audio track, a broken
join or a misspelt credit.

**How to apply:** report the numbers with the delivery (resolution, fps, frames, duration, size).
