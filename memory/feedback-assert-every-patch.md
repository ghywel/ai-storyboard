---
name: feedback-assert-every-patch
description: "Scripted edits assert their pattern matched exactly once"
metadata:
  type: feedback
---

When a script patches a file (search and replace), assert the old text occurs exactly once before replacing, and fail
loudly otherwise.

**Why:** an unmatched replace is a silent no-op; with several agents editing, files drift between reading and patching.

**How to apply:** `assert s.count(old) == 1` before every replace; re-read the file if it changed on disk.
