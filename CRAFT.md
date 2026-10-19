# Craft: making the frame beautiful

`DIRECTION.md` says how to hold a film's direction. This page says how to make each frame beautiful: as paint, light
and motion. It applies to both of our ways of making pictures:
- frames drawn in code (`engine/`);
- reference-led generated stills, edited as a rhythmic picture-book film (the *God Moved* method).

Most of it comes from two community projects, read on 2026-10-19 and checked against our own renders:
- **huashu-art-motion** by 花叔 (alchaincyf, MIT): 36 art styles drawn in Canvas2D. Its numbers come from failures it
  measured. The medium kit `engine/src/scenes/_medium.ts` is ported from its code.
- **mortiflix-oss** by GTKottman (AGPL-3.0): an agent studio harness. Only its ideas are used here (quality gates,
  transition boards, review discipline), rewritten in our own words and code.

`PRIOR-ART.md` has the credits. The six-stage reel `engine/src/scenes/medium-reel.ts` shows the rules below one at a
time, from flat vector to finished frame, on one picture.

## 1. One frame first

- **Make one frame right before animating anything.** Choose the frame that is hardest to get right, render it at full
  size, and judge it beside its references. Then build the motion from it.
- **Write the look before the pictures** (`templates/LOOK.md`):
  - the palette as tokens with roles and weights;
  - one accent, reserved for the thing to look at;
  - the medium (what the picture is made of);
  - the light;
  - the type faces, when there are words on screen.
- **Then make three to five anchor frames that cover the film's range**: the opening, the densest moment, a mid-change
  state and the ending. Lay them side by side. If they don't look like one film, the look isn't finished. (mortiflix,
  motion-design skill.)
- **A style frame is a real frame.** It is a moment from the film at full resolution, never a mood board. If it can't
  appear in the final exactly as drawn, it isn't a style frame.

## 2. The medium: paint the frame, don't fill it

The cheapest look in code is vector fills plus a noise overlay. It reads as clip art. A frame looks painted when every
part of it, characters included, goes through one material.

**The layer order** (huashu 04; `_medium.ts` header):
1. **Ground.** Paper or plaster (`paper()`), or a flat underpainting that sets the composition and values.
2. **Big areas through one renderer.** Watercolour washes (`watercolor()`), or a re-stroke of the whole plate
   (`brokenColour()`).
3. **Props on their own layer**, with finer settings. Big strokes smash small things.
4. **Characters.** A flat fill, then the frame's own medium inside the silhouette (`textureInside()`), then a clean
   contour. `cel()` does fill, shadow band, rim and line in one call.
5. **Light.** One light map over the whole frame (`lightMap()` + `applyLight()`).
6. **Living motifs.** Then the grade.

There are exceptions. Ink inverts the order: the paper is the ground and ink only adds. In pattern styles the pattern is
the renderer.

**Rules:**
- **The character takes the same medium as the world.** A figure that skips it reads as a pasted sticker. huashu found
  this the weakest point across all 36 of its styles.
  - Texture a character with destination-in plus multiply. `source-atop` paints the paper's own colour over the figure
    and whitens it.
- **Region palettes, not colour jitter.**
  - Give each region 7–8 colours.
  - Mix 30–45 % of the underlying colour back into every stroke (`swatch()`).
  - Random jitter muddies the values; a region palette varies the hue and keeps the value.
- **Washes compound.** Learnt on our own reel, 2026-10-19.
  - Five multiply passes over five multiply passes went muddy-brown.
  - Lay light areas (sky, glow, meadow) with `source-over` at moderate alpha. Keep multiply for darks laid over them.
  - A sky is one wash with a gradient fill, never stacked bands of rectangles.
  - Measured settings (huashu 25_ghibli):

    | Area | Layers | Alpha | Amp | Edge |
    |---|---|---|---|---|
    | Big walls | 5 | 0.4 | 12 | default |
    | Colour blooms | 3 | ≤ 0.045 | 40 | default |
    | Timber | 3 | 0.5 | 3 | 0.14 |

    More than 0.05 × 3 on blooms reads as mould. Large darks are deformed polygons (amp 60), never abutting rectangles:
    those leave hard seams.
- **Transparency shows what's underneath.** A sun painted under watercolour mountains shows through them as a ghost
  disc. Paint the sun after the ridge, clipped to the open sky. Use a radial fill for a bloom: stacked polygons leave a
  hard blob.
- **Make small things 1.35–1.6× bigger than intuition says.** A symbolic prop or a clue that can't be read at
  thumbnail size isn't there. huashu's wave claws read only at 44–74 px.
- **Ageing goes on the world, never on the characters.** Stains, cracks and dirt stay in the background, with a clear
  zone around figures.
- **Cache everything static.** Paper, painted backdrops and broken-colour plates are drawn once per render. Never
  re-seed a full-frame texture per frame: at 8 fps it reads as flicker. Boil only line art, at 8–12 fps.

## 3. Light: one light for the whole frame

Coherent light is the biggest lever after colour.

- **Paint the world fully lit, then multiply it by one light map** (`lightMap()`, `pool()`, `applyLight()`).
  - The ambient colour says how dark the unlit world is. Our first dusk test used a candle-lit ambient and went murky.

    | Light | Ambient |
    |---|---|
    | Chiaroscuro interior | about rgb(30,21,13) |
    | Moonlight | a cool rgb(40,52,80) |
    | Dusk | a cool mid, about rgb(176,168,196) |
- **Add a separation light behind the dark side of every silhouette**, so a figure never merges into its ground.
- **Cel light from geometry.** Take the shape minus itself shifted toward the light, and the hard shadow band falls on
  the far side (`cel()`). huashu 35_shinkai widths:
  - shadow: 22–30 on big parts, 10 on a face, 8 on small parts;
  - rim: 3–9;
  - lines: never pure black (a warm dark brown such as `#6a4632`, at about 2.2 px).
- **Long cast shadows** use a shear. All silhouettes go into one buffer, so overlaps never darken twice
  (`castShadow()`).
- **Lost edges** (huashu 32_rembrandt): blur the figure layer slightly and opaque, then lay a sharp copy on top at
  about 62 %.
- **Hard light that moves:** paint a lit version, clip it to light polygons, and move the polygons (huashu `litClip`).
- **Coloured shadow on figures** (huashu 28_monet): warm at about 22 % on the lit side, violet at about 32 % on the
  shadow side.
- **Cap the extras.**
  - Grain on faces: density 0.05, alpha 0.12. At 0.12 / 0.22 faces look dirty.
  - Light sweeps: alpha about 0.24. At 0.38 a sweep reads as lens flare.
  - Lens streaks: no longer than about 840 px. At 1800 px a streak reads as a bug.

## 4. The grade

The engine's post chain (`engine/src/engine/post.ts`) runs bloom, halation, chromatic aberration, a tone shoulder,
grain and vignette. On 2026-10-19 it gained a grade, applied after the shoulder. It is neutral by default, so existing
films are unchanged.

| Parameter | What it does | Typical |
|---|---|---|
| `contrast` | around mid-grey 0.18 linear | 1.05–1.15 (a print-like bite) |
| `saturation` | around luma | 0.9–1.1 |
| `split` | split-tone strength | 0.2–0.4 |
| `shadowTint` / `highlightTint` | the two tints, luma-normalised so they shift hue, not brightness | cool shadows, warm highlights |
| `splitBalance` | where the split turns over | −0.5 to 0.5 |

**The grade unifies; it does not rescue.** Set it once per film, or once per act. A shot that needs a different grade
to work usually needs a different palette or a different light.

## 5. Alive, never boiling

- **Each shot has one main action plus 2–4 small motif loops** from the film's own vocabulary: grass, motes, a blinking
  window, a flag. A still with nothing alive in it reads as stuck. huashu's Klimt went from 20 of 36 static frame pairs
  to none by adding falling leaf flakes and rising dust.
- **Keep stroke positions fixed and vary the direction field continuously.** Re-scattering strokes reads as boiling.
- **A scrolling pattern's modulo must equal the pattern's true period**, or it jumps.
- **For held pictures** (the picture-book method), every state still has one or two living motifs, and no unchanged
  picture is held longer than the film's ceiling. `tools/film-qc.py` measures the ceiling on the finished film.
- **Two-level frame rate:** the camera stays smooth while elements step at 12 fps, when a style wants the hand-made
  feel (rubber-hose, cut-out, shadow puppet).

## 6. Camera language

Before any move, answer three questions (huashu, camera language):
1. Where should the eye be, and can it read it at this framing?
2. Is this move a transition or an accent?
3. What was the last move?

| Move | Duration and curve | Size |
|---|---|---|
| Slow push | 0.6–1.5 s, sine in-out | 10–40 % |
| Pull out | 0.8–2 s, long-tail ease | — |
| Glide | 0.5–0.9 s | — |
| Punch (accent) | 0.25–0.35 s | 18–32 %; ours are 1–4 % on hits (`_post.ts`) |
| Whip | 0.26–0.30 s | — |
| Slam | 0.17 s, zoom 1.55 → 0.94 → 1.0 | — |
| Drift | 1–4 % per second | ambient and art shots only |

**Counting rules:**
- Every push-in needs a way back out.
- Never three pushes in a row.
- Accents on no more than ⅓ of shots.
- Interpolate zoom logarithmically.
- Parallax layers translate × depth and scale zoom^depth.
- "The PowerPoint look is every shot doing the same camera move." That applies whether the move is a slow push or a
  punch on every cut.

**For music videos** (huashu's note on an MV that read "monotonous, dry, lacking emotion"):
- verses slow push or drift;
- choruses faster;
- interludes pull out;
- transition peaks on the beat.

**Smoothness can't be judged from stills.** Watch the densest 30 seconds at speed.

## 7. Motion

From mortiflix's motion-design skill, at our 60 fps:
- **Nothing moves linearly except machines.** Ease out on entrances, ease in on exits. Use a critically damped spring
  for calm moves and less damping for a bounce.
- **Stagger related elements by 4–8 frames.** Never move a layout as one block.
- **Overlap actions:** the next starts before the last settles. Anything with weight gets anticipation and follow-
  through.
- **Hold the key idea still.** Constant motion is noise.
- **Text in the frame** (signs, slams, clues) stays at least words ÷ 3 + 1 s after it has finished arriving.
- **Let particles and effects settle before a cut.**

## 8. Cuts and transitions

- **Every cut names three things before its transition is chosen** (mortiflix, transition board):
  - **carrier:** the element already on screen that makes the change happen;
  - **why:** one sentence, from continuity, turn, section break, reveal, rise or breath;
  - **lands on:** the word or beat.
- **Use 2–4 families of transition per film**, so the same kind of cut means the same kind of change. Keep quiet
  families inside a section and the big moves for section breaks.
- **For held pictures with hard cuts**, the carrier is a graphic match: the focal shape or motif keeps its screen
  position or silhouette across the cut. Board both sides of each cut at the same scale.
- **A transition can be the next picture's material process** (huashu 07 #1): gold leaf spiralling in, a watercolour
  bleed, ink blooming, grown from an object already in frame.
  - Complex ones need 0.48–0.5 s: in-out easing hides their ends.
  - Put the frame where the new picture is revealed on the beat: start = beat − reveal point × duration.
  - A beat punch must hit both the outgoing and incoming layers. Hitting only the new one made 6 of 15 of huashu's
    cuts lag 0.10–0.17 s.
- **The screen never goes accidentally blank.** Our designed flashes (2–3 frames) and steps to black are named in the
  plate or scene bands. Every other blank frame is a bug, and `tools/film-qc.py` fails it.

## 9. Hitting the music: a spotting map

Refine "cut on the beat" into a choice per event (mortiflix, picture scoring). In the shot-by-shot script, give each
musical event:
- **a class:** structural, dramatic, physical or optional;
- **a response:**
  - direct hit;
  - **anticipation**: the picture moves a few frames before the event;
  - **aftermath**: let the sound land, then react;
  - **no hit**.

Hit the few that change meaning, not every cut. Over-syncing feels mechanical.

**Contrast makes intensity legible.** Don't raise every parameter at once. Establish a pattern before breaking it.
Reserve a new palette token, set or camera move for an arrival that earns it.

## 10. Characters

"A crude character is worse than none" (huashu). The delivery lines, checked at 2× zoom:
1. The silhouette reads in solid black.
2. Real joints, and a head-to-body ratio held through the film.
3. Hands that grip.
4. At least two value layers plus a highlight or rim, lit like the scene.
5. At least three material details.
6. A specific expression and pose per shot, tied to the shot's content.
7. The same medium as the world.
8. The same character in every shot.

Objects act through shape, scale, contrast and motion, never through added faces. Our reel's figure fails lines 2, 3
and 5 on purpose: it is a placeholder, and you can see it is the weakest thing in the frame.

## 11. Style recipes, and scoring a look honestly

When a film borrows a historical or named style, write a recipe card (`templates/STYLE-RECIPE.md`):
- the layer order;
- the key parameters with hex values;
- how the motifs animate;
- the signature transition;
- the cost per frame;
- the pitfalls, and what is still improvable.

Then follow huashu's protocol, written after 17 style demos were "almost unusable" because nobody had looked at the
originals:
1. **Look at ≥3 different works** in the style (public domain, or references the director supplies). Write 5
   signature traits as must / bonus / forbidden.
2. **Recompose the subject by the style's own composition logic.** Never reuse one composition across styles.
3. **A clean form layer, then a medium pass.** "Flat vector plus noise" is banned.
4. **A still first, beside the originals at the same size.**
5. **Animate in the style's own way.**
6. **Score out of 100**, pass mark 80, at most two rounds:

   | Signature | Medium | Composition | Form | Motion | Tech |
   |---|---|---|---|---|---|
   | 35 (−7 per missing must) | 20 | 15 | 15 | 10 | 5 |

   - **Veto** if the signature scores under 25, or a figure looks childish.
   - **Take the lower of the self-score and an independent score.** huashu's self-scores ran about 10 points (up to 17)
     above independent review.

## 12. Generated stills (the picture-book method)

- **Lock composition with a reference image, not coordinates in a prompt.** Give the model the previous state with
  "keep composition, positions, palette and brushwork; change only…". huashu found it holds almost pixel for pixel.
- **Describe colours by body part.** An action in a prompt overrides the reference pose, so ask for one change at a
  time.
- **Generate separable layers in place, on flat green**, at the frame's own coordinates, and record each crop's offset
  so the layer pastes back in register (huashu `key_green.py`).
- **Several states of one plate are cheapest as grades of one image:** light filling seams, dawn brightening. Generate
  the plate once and change only the light.
- **Run every still through the look's palette check** (`tools/palette.py` against the tokens in `LOOK.md`). Add a
  squint test: blur it, and the focal point must still win.
