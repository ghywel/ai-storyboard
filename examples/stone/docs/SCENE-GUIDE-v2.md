# Scene guide for v2, "THE DIVER"

You are building plates of the v2 film: a girl in a mask and snorkel finds Rai on the seabed and brings her home.
Build them to **FINAL quality**: these plates go to the 4K render without another creative pass. His word on the
short takes: "i trust you to take it from concept to 4k60 render".

## Read first, in this order

1. **`TREATMENT-v2.md`**: the idea, the tone, the light through a day and a night, the rising-bubble lyric, the
   cinematic grammar and the motifs. Your plates' **shot-by-shot script** is there: build what it says, with its
   times, faces, poses, clues and numbers. Improve on it where you see a better gag or picture that keeps its meaning,
   and say so in your report.
2. **`SCENE-GUIDE.md`** (the v3 guide). Read it with three substitutions: `--take v2` for `--take v3`,
   `app/src/scenes/v2/<id>.ts` for `app/src/scenes/<id>.ts`, and "the rising lyric" for the karaoke. These sections
   apply in full:
   - **THE DIRECTION:**
     - Rai acts anime-style, with chibi pops and lines of force.
     - Real environments with clue details.
     - Faceless silhouettes that emote.
     - The "nothing" beat, the pole and the invented numbers.
     - Tasteful compositor effects.
   - **Running things**, **The plate** (determinism, layers, finding lines, cuts on the beat, performance) and
     **The toolbox**.
3. **`VARIANTS.md`**: v1 (Rai's TV show) tells the same lines very differently. **Don't borrow its pictures:**
   - a studio, cameras or graphics packages;
   - a scoreboard;
   - an audience in seats;
   - a dating show;
   - a panel or podiums;
   - fireworks spelling words;
   - a TV in a living room.

   v2 is cinema: real places, real light, one family.
4. **The v2 kit (frozen: read it, don't edit it): `app/src/scenes/v2/_diver.ts`.**
   - **The girl:** `girl(c, x, y, h, pose, o)`.
     - Poses: stand, wave, run, swim, glide, torch, float, kneel, reach, hug (knees), ride, lie, sit, cheer. You can
       also pass your own `GirlPose`, or blend between poses.
     - Her mask's glint is her eyes: `glint` plain, spark, droop or wide.
     - Gear: fins, snorkel, torch (it returns the beam's origin and angle), slate, pendant.
     - A yellow swimsuit under water and a yellow tee on land.
     - `grown` is the bride.
   - **`mother(c, x, y, h, pose, o)`:** plait, shawl, and `old` with a stick.
   - **The family and the village:**
     - `relative(c, 'uncle'|'aunt'|'grandad'|'diver1'|'diver2', …)`;
     - `villager(c, x, y, h, pose, i, {lantern, garland})` and `lanternGlow`.
   - **Light under water:** `torchBeam`, `beamSpot`, `darkness(c, a, holes)`.
   - **`heartLantern(c, g, hx, hy, cx, cy, r, t, on, draw)`:** Rai's heart throws a circle of light. Your `draw` paints
     an ordinary full 1920×1080 frame, fitted into the circle.
   - **`manta`**.
   - **`ledgerBook(c, g, x, y, s, t, {open, eye, look, blink, zero, minus, blot, lift})`**.
   - **The slate:** `slate(c, x, y, s, rot, draw)` with `pencil(pts, u)` and `circlePts`.
   - **`pendantRai(c, g, x, y, s, t, pop, raiOpts, glow)`:** chibi Rai popping out of the pebble pendant to talk on
     land.
   - **`bedroom(c, g, t, BedroomOpts)`:** clock, girl in bed, mother on the chair, lunchbox, bill, mask on the
     bedpost, pendant, the ledger book on the shelf, `flood` for the dream, `cam`. Positions are in `ROOM`.
   - **`dollhouse`**.
   - **The lyric:** `bubbleLyric(c, line, t, {sung, spoken, y})`.
   - **Helpers:** `currentLine(lines, t)`, `clearGlowBand(g)`, `withCam2(c, g, cam, draw)`.
5. **`app/src/scenes/v2/divertest.ts`**: every kit piece in use (`?take=v2&scene=v2/divertest`). Its stills are in
   `out/wip/v2-kit/`. Shared environments live in `_world.ts`: `seabed()`, `seabedFront()`, `island()` at dawn, day,
   sunset or night, `reed`, `coral`, `fish`, `fishSchool`, `shark`, `palmTree`, `hut`, `stoneBank`, `canoe`,
   `steamship`.
6. **The bar** for structure and finish: `app/src/scenes/chorus.ts` (v3) and the v1 plates in
   `app/src/scenes/v1/`. Rai's whole acting range is in `app/src/scenes/acting.ts`.

## v2's rules on top of v3's

- **The lyric.**
  - Every sung line uses `bubbleLyric(c, currentLine(lines, t), t)`. It sits at the bottom, readable everywhere,
    with nothing on top of it.
    - Sung colour: yellow by default, pink in the tender sections (touch, fever, dream), gold at dawn.
  - Spoken lines (the intro and the outro) use `{ spoken: true }`.
  - Call `clearGlowBand(g)` after drawing glow, so the bloom doesn't wash over the words.
  - Hits are written in the world as well (chalk on the slate, ink in the ledger, words in the lantern's light,
    paint on the wreck), never instead of the lyric.
- **Rai.**
  - On the seabed she is full size and acts every line.
  - On land she rides as the pebble pendant, and chibi Rai pops out of it (`pendantRai`) to narrate and react.
  - She is the only face. The girl's mask glint does the girl's eyes; everyone else emotes with body and emotes.
- **Light and camera.**
  - Natural light by the time of day (the treatment's table).
  - Torchlight and `darkness()` in the deep. Caustics and god rays in the shallows.
  - Slow push-ins and pull-backs, focus pulls (foreground reeds or bubbles soft), match cuts on the ring.
  - Hard cuts about every 2 beats in the rapped verses, inside the story, with the frame always moving.
  - Use `withCam2` so both layers move together.
- **Continuity across plates:**
  - **The girl:** a yellow swimsuit under water, a yellow tee on land, the slate at her hip from `dive` on, the
    pebble pendant from `harbour` on (Rai gives it to her at the end of `manta` or in `wreck`; say where in your
    report).
  - **The mother:** plait and shawl, always.
  - **The hut with the lit window** from `dive`'s first shot is home: `fever`, `dollhouse`, `dream` and `dinner`
    happen inside it, and `dawn` ends at its door.
  - **The ledger book** sits on the bedroom shelf, its eye closed, until `fever` wakes it.
  - **The wreck** is S.S. IRON HULL (paint the name on its bow).
  - **The slate's numbers** at dawn: `NIGHTS 2,920 · MEALS 8,760 · CARE ∞` (her arithmetic for eight years).
- **The compositor.**
  - Smooth capped shakes on real hits only, at most one per bar and ≤ 8 px: the storm in the lantern, the
    grandad's fist, the dawn breach.
  - Punches on slams, colour kicks on the two or three biggest impacts.
  - The silence in `fever` gets **no** shake.
- **Memory (this 16 GB Mac froze twice on 10-02; a 4K render may be running alongside you):**
  - Check your work with **stills and contact sheets**.
  - Clips only short (≤ 6 s) and `--samples` ≤ 4.
  - One render at a time per author.
  - Never a full-length video.

## Running things

Everything runs from the engine folder (`app/` in the original project, `engine/` in this repository):
- **Stills:** `bun scripts/render.ts stills --take v2 --only <id> --t 14.0,15.5 --out ../out/wip/v2-<id>`, then LOOK at
  them with the Read tool.
- **Contact sheet:**
  `bun scripts/render.ts sheet --take v2 --only <id> --from <a> --to <b> --n 16 --cols 4 --out ../out/wip/v2-<id>.png`.
- **Perf:** `bun scripts/render.ts perf --take v2 --only <id> --from <a> --to <b>`.
- **Typecheck:** `bunx tsc --noEmit -p tsconfig.json 2>&1 | grep scenes/v2/<id>`.
- **Data:**
  - lines are in `takes/v2/lyrics.json`; beats in `takes/v2/audio.json`;
  - find lines by content or by first-word time in your window, never by hard-coded times;
  - v2 sings the chorus tag three times in `manta` (lines 17–19) and the breakdown chant once.

## The plates (ids are timeline ids; files are `app/src/scenes/v2/<id>.ts`)

| id | window (s) | lines | the script |
|---|---|---|---|
| dive | 0–13.26 | 0–1 + the "na-na-na" vocalise | dusk jetty, the splash, the torch in the dark, "Hi. You can't see me.", the bubble call and response |
| lantern | 13.26–26.97 | 2–5 | the heart-lantern: quarry, crossing, the pole (she winces, Rai winks), the storm |
| legend | 26.97–40.68 | 6–9 | the twist, the island's belief, three deals in the circle, the seabed "street" and the richest rock |
| touch | 40.68–53.96 | 10–13 | the hush: her hand on Rai's cheek, the slate drawing, "?" rubbed out into a heart |
| manta | 53.96–76.67 | 14–19 | the manta ride; the tag three times over what is waiting; the wreck looms |
| wreck | 76.67–90.38 | 20–23 | the iron hull, 1 TON, the hold of identical stones, 1/10, her crossing on her watch, heavy and shiny refused, her route on the slate |
| harbour | 90.38–97.66 | 24–25 | the town at night: cash machine, phone screens, the humming container, a pledge on a screen, the night market, the pendant's wink, up the road home |
| fever | 97.66–104.95 | 26–27 | 4 am, the mother awake, lunchbox, bill; the ledger book's eye, blink, 0, the blotted minus, the nothing, the pendant cross |
| dollhouse | 104.95–117.80 | 28–31 | Pigou's paradox in the doll's house: the doll wedding, £21,400 → £0, same rooms, the stranger doll and the coin meter, the cuckoo pecks the meter |
| dream | 117.80–131.09 | 32–35 | chorus 2: the bedroom floods gently into the sea, Rai at the end of the bed, the 0 lifts off the page into her heart |
| dinner | 131.09–145.65 | 36–39 | the round table argument; the grandad's fist; they stand and the table rises |
| nightdive | 145.65–158.08 | 40–43 | lanterns to the shore, divers, the pole through her heart (a wink), the lift up through the dark |
| dawn | 158.08–188.93 | 44–51 | the breach at dawn, the procession, the slate's numbers, the village's nod, hands on the stone, the sun rising through her heart |
| wedding | 188.93–207.81 | 52–54, the final stab at 199.5, 7 s of silence | years later: the bride, the stone in flowers, the old mother; then the night sea, stars and the credits (exactly: "Words: Claude, from Knight Commander Gareth's brief" / "Voice and music: Suno" / "Film: drawn in code; engine from pdoom-video by Giacomo Magnanini (MIT)"); the last image a pink heart-glow, a ring that fades |

## Report back

In your final message, give:
- what each plate shows, shot by shot, with times;
- each clue and what it means;
- the path of a final contact sheet per plate;
- the measured ms a frame at 1080p for your busiest shot;
- anything you needed but could not touch;
- anything you are unsure of.
