---
name: feedback-silent-failure
description: "The dominant failure is a step that fails and returns something plausible; every data step asserts it returned enough"
metadata:
  type: feedback
---

Guards: assert counts (frames parsed, words aligned, beats found); a passthrough or counterfactual check; a control
that must not move; check probe points lie inside the data.

**Why:** a loudness log once parsed to zero frames without error; an offset check once sampled beyond the end of the
file and reported a bogus lag.

**How to apply:** every analysis script ends with a printed summary of what it found, and an assert where an empty or
tiny result is impossible.
