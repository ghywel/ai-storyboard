---
name: feedback-knowns-must-be-proven
description: "A 'known' needs its proof (a measurement, opened source, a test) with date and conditions; otherwise it is an assumption to label and test"
metadata:
  type: feedback
---

Before relying on a fact (a tempo, a timing, a codec's support, a memory budget), check what proves it. Proofs have
scope: device, OS, route, take.

**Why:** most failures in this kind of pipeline are confident assumptions: a generator's timings, a tempo detector, an
RSS-based memory guard.

**How to apply:** label unproven claims as assumptions in notes; test them cheaply before building on them.
