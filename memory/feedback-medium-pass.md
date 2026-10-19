---
name: feedback-medium-pass
description: "Write the look first, make 3-5 anchor frames, and put every element (characters too) through one medium and one light"
metadata:
  type: feedback
---

Before plates or generated stills, write LOOK.md (palette tokens with weights, one accent, the medium, the light, the
grade) and render three to five anchor frames that cover the film's range. Paint, don't fill: ground, big areas through
one renderer, props on their own layer, characters through the SAME medium (textureInside, cel), one light map for the
whole frame, then living motifs and the grade (CRAFT.md; engine/src/scenes/_medium.ts).

**Why:** flat vector plus noise reads as clip art, and a character that skips the frame's medium reads as a pasted
sticker (huashu-art-motion's weakest point across 36 styles). The medium reel turned our flat demo look into a painted
frame in six measured steps (2026-10-19).

**How to apply:** build the look test like medium-reel.ts (one picture, stage by stage); watch for washes that
compound, transparent layers that show through, and an ambient that sets the wrong hour; a placeholder character is
the first thing to replace.
