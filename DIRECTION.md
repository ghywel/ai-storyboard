# Direction: how to establish and hold an artistic direction

These are the craft rules for the picture. Each comes from a director's note or a failure that was seen and fixed.
**Example** lines point to `examples/stone/`; they illustrate a rule and are not part of it.

## 1. Measure the look you admire

- Name your references and measure them:
  - the palette (`tools/palette.py`: the dominant colours of a set of frames);
  - the cut rate;
  - how big the words are on screen;
  - how often something moves.
- Keep the measurements in the treatment.
- Then decide what you take (energy, palette, type) and what you leave (characters, story, compositions).

**Example.** The measured reference palette became twelve named tokens: an indigo-black ground for about half of
every frame, then pink, yellow, lime, orange, violet, coral, periwinkle, cyan, a limestone white and gold.

## 2. Colour has meanings and weights

- **Define colours as tokens** and give each a job. If the same colour means the same thing everywhere, the audience
  learns the code without being told.
- **Weight the palette per film.** Two films can share the tokens and look different: one a night studio of
  spotlights, one a day turning through dusk, night and dawn.
- **Neon blooms, type stays crisp.** Glow belongs on a separate additive layer, and that layer is cleared under the
  lyric (it composites over everything).

**Example.** Pink meant care, lime meant paid money and gold meant value. A zero for unpaid care was always pink.
Each chorus owned one sunburst colour, and the last had all of them.

## 3. Type has roles

Give three or four faces a job each, and never mix the jobs:
- a heavy wide face for slammed words;
- a bold face for the karaoke;
- a serif italic for spoken parts only;
- a monospace for machines, ledgers and captions.

Avoid outlined or haloed type and use typographic punctuation.

## 4. The lyric is always readable

- **Every sung line is on screen, per word**:
  - a word lights at its aligned start;
  - the highlight never runs ahead of the voice;
  - a line may show dim up to 0.4 s early.
- **Nothing covers the lyric.** Put a dark band behind it when the picture is busy, and keep it title-safe (96 px).
- **Present the lyric inside the concept**: lower thirds in a TV-show film, words rising like bubbles in an underwater
  film, ink in a ledger, chalk on a slate. Slams go on top, never instead.
- **Wrap into balanced rows with no one-word orphans.**
- **When rapped lines run back to back, hold each line until its last word has filled.** A fixed 0.4 s lead swaps the
  line out before the rhyme is sung.

## 5. Environments, not slides

The director's note that changed the most:

> Each scene should still be set in some environment that isn't a powerpoint presentation. Background detail is
> important, and like any good director, seemingly irrelevant background details are symbolic clues to what is going
> on in the scene or foreshadowing for what is to come in the next scene.

- **Build places.** A back, mid and front layer, light sources, and something alive: steam, a curtain, a clock hand,
  rain, a fish crossing.
- **Plant a clue in every shot** and write in the script what it means. Then pay it off later in the film.
- **Keep continuity tables.** A prop that recurs is in the scene guide, with its state per plate.
- **Graphic shots are punctuation**, not the norm. Most of the time we are somewhere.

**Example.** A clock in the set's background read 4:00 for the whole first half, a minute before a scene set at four
in the morning. A child's lunchbox sat alone in an audience seat in chorus 1. It appeared on a kitchen counter in
verse 2, was hugged by a neighbour in chorus 2, and stood packed for the morning in the last shot.

## 6. One face, and it acts

- **Give the face to one character.** Everyone else is a faceless silhouette.
- **The character acts every line.** For each line, choose:
  - a face;
  - an arm pose;
  - body motion (a hop, squash and stretch, a lean, a tilt);
  - and when the line asks for it, a manga mark (vein, sweat drop, gloom lines, sparkles, hearts, steam, !, ?).
- **Faces follow the words.** Cross when cross, sassy when sassy; cheeky, sad, joyous, silly or serious as the line
  says.
- **Use chibi (super-deformed) pops for the comic beats**: a sudden switch to a small, round body for under a second,
  with a puff of smoke at the switch. Use a few per scene, never constantly.
- **Lines of force for impact**: focus lines and speed lines that flash with the hit and fade within half a second.
  Never leave them on as wallpaper.
- **Tone rule: the protagonist is never hurt.** The worst that happens is comic. A prop through the heart gets an
  "ow" and a deadpan look to camera, and a fall through a trapdoor bounces back up dizzy.

The rig needs about twenty faces, about a dozen arm poses blended by two-bone IK, squash, hop, shake and tilt, a
chibi body, marks placed from anchors it returns (head, heart, hands), and a prop in either hand. See
`examples/stone/scenes/_rai.ts` and the acting reel scene `acting.ts`.

**Example.** The first board's protagonist smiled through everything. The director's note asked for
anime-style acting, "a sudden change to a chibi is hilarious and delightful", and Team Rocket-style poses. The rig
was rebuilt before any plate was polished.

## 7. Silhouettes that emote

- Faceless people still feel. Show it with body language (slump, a hand to the face, a hug, cheering, leaning in a
  doorway) and small emote signs (a tear, a sigh, a heart, zzz).
- **Stage the emotion**: who is in frame, who looks at whom, who doesn't move.
- **Give each recurring person one telling accessory** (a cap, a plait and a shawl, a bobble hat, glasses), so the
  same person reads as the same person across plates.

**Example.** The director's note: "A tear drop down a cheek. Mum reading the bedtime story but dad watching at the
door."

## 8. Motifs that rhyme

Choose one shape that recurs and changes meaning, and cut on it.

**Example.** A ring was a zero in a ledger, a stone money disc with a hole, the hole as the character's heart, a
wedding ring, a ring of bulbs behind a stage, a torch's circle of light, a round dinner table with a lamp through its
hole, and a sun rising exactly through the heart. The last frame of one film is an old TV switching off: the picture
collapses to a dot, and the dot is a ring.

## 9. Take lines literally, and ground them in numbers

- **Take a line literally where it is darkly funny.** A metaphor staged as a literal event lands as a joke that
  doesn't announce itself.
- **Invent numbers and show the arithmetic.** Concrete figures ground an abstract argument: a meter, a scoreboard, a
  child's slate. For example, "NIGHTS 2,920" with "365 × 8 yrs" under it.

**Example.** "a pole through the hole in the heart of me": a stagehand slides a pole through the character's
heart-hole on the word, she says "OW" in chibi, then looks at camera deadpan. The director kept it as "a Shakespeare
insult so clever it flies under the radar".

## 10. Camera grammar belongs to the concept

- **Cut on the beat**, at or before the line's first word, never after the voice. In rapped verses cut about every 2
  beats. In spoken parts hold long.
- **Each concept gets its own camera.**
  - A TV-show film: multi-camera cuts, crash zooms, a tally light, scanlines on archive footage, a static channel
    flip.
  - A story film: slow push-ins, focus pulls with soft foreground layers, match cuts, caustics and god rays under
    water, a dream ripple.

## 11. The compositor's touch, with restraint

> Screen shakes, motion blurs - anything an awesome animator compositor might add for fun. But don't over do it - a
> very shaky scene can be painful to watch even at 60fps.

The rules are in `engine/src/scenes/_post.ts`:
- **Shakes** are smooth (two sines, not random jitter), decay, and are capped at 8 px. At most one per bar, and only
  on real hits.
- **Punch-ins** are 1–4 %.
- **Colour kicks** go on the two or three biggest impacts of a plate.
- **Flashes** last 2–3 frames and blow out highlights without greying the blacks.
- **Motion blur** comes from the render, which averages sub-frames.
- **The silent beat gets no effect at all.** Stillness is the hit.

**Example.** On "Just nothing. Still." a whole studio froze. Only a feed on a screen kept moving, and one bubble rose.

## 12. Variants that don't match

When several takes become several films:
- **Measure each take** (`tools/dynamics.py`): where its intro is dark or bright, where it dips, how many times a tag
  repeats, how loud its peak is, whether its outro is loud or hushed.
- **Give each film one concept that suits its measured shape.**
- **Write the no-match table before building**: each line, staged in each film.
- **Share the tools and the character, never the pictures.**

## 13. Gates, notes and trust

- **The storyboard gate.** Review at storyboard depth, then polish (`METHOD.md`, phase 7).
- **Turn the director's notes into rules**, verbatim where possible, at the top of the scene guide. They override
  everything below them.
- **Keep the notes as standing direction for later films.** Approval of a direction ("perfect, no notes") is itself a
  direction to keep.
