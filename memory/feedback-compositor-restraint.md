---
name: feedback-compositor-restraint
description: "Shakes, punches, colour kicks and flashes only on real hits, capped; the silent beat gets nothing"
metadata:
  type: feedback
---

Smooth decaying shakes capped at 8 px, at most one per bar; punch-ins of 1-4%; colour kicks on the two or three biggest
impacts of a plate; flashes of 2-3 frames that do not grey the blacks; motion blur from averaged sub-frames. A beat of
silence or "nothing" gets no effect: stillness is the hit.

**Why:** the director's note: "don't over do it - a very shaky scene can be painful to watch even at 60fps".

**How to apply:** keep the rules in one module (engine/src/scenes/_post.ts) and name in the scene guide which beats may
shake.
