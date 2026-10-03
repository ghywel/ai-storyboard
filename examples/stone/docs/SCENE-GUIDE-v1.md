# Scene guide for v1, "WHAT'S IT WORTH?"

You are building plates of the v1 film, Rai's live TV show from a shipwreck studio on the seabed. Build them to
**FINAL quality**: these plates go to the 4K render without another creative pass. His word on the short takes: "i
trust you to take it from concept to 4k60 render".

## Read first, in this order

1. `TREATMENT-v1.md`: the idea, tone, palette, lyric style, camera grammar and motifs. Read your plates' **shot-by-shot
   script**: build what it says, with its times, faces, poses, clues and numbers. Improve on it where you see a better
   gag or picture, keeping its meaning, and say so in your report.
2. `SCENE-GUIDE.md` (the v3 guide):
   - **THE DIRECTION applies in full:**
     - Rai acts anime-style, with chibi pops and lines of force;
     - real environments with clue details;
     - faceless silhouettes that emote;
     - the "nothing" beat, the pole and the invented numbers;
     - tasteful compositor effects.
   - So do its sections on **Running things**, **The plate** (determinism, layers, finding lines, cuts on the beat,
     performance) and **The toolbox**.
   - Where that guide says `--take v3` or `app/src/scenes/<id>.ts`, read `--take v1` and `app/src/scenes/v1/<id>.ts`.
3. `VARIANTS.md`: v2 (the diver) tells the same lines very differently. Don't borrow its pictures (the torch beam, the
   heart-lantern, the manta, the wreck's hold, the ledger book, the doll's house, the dinner table, the lanterns'
   night dive, the girl's slate).
4. The v1 kit, frozen (read it, don't edit it):
   - **`app/src/scenes/v1/_studio.ts`:**
     - the set: `studio()` / `studioFront()` with `StudioOpts`, `SET` positions, `withCam`;
     - `bulbRing`, `kelpCurtain`, `signBoard`, `scoreboard`, `ledText`, `studioScreen`, `cueSign`;
     - `crabCam`, `octopus`;
     - the audience reverse shot: `audience()`, `seatPos()`, `seatKind()`;
     - the TV package: `lowerThird`, `captions`, `liveBug`, `camTag`, `vhs`, `nightVision`, `staticFlip`,
       `scanlines`;
     - `micProp`, `closeBackdrop`.
   - **`app/src/scenes/v1/_cast.ts`:** `cast(c, who, x, y, h, pose, o)`, the recurring silhouettes, each with one
     accessory:
     - the trader's cap;
     - the woman's bun (pose `hold` carries her child);
     - the child's bunches;
     - the housekeeper's headscarf and mop;
     - the husband's tie;
     - stranger A's backpack and parcel;
     - stranger B's bobble hat and coin;
     - panellists 1, 2 and 3: glasses, a bob and a quiff.
   - **`app/src/scenes/v1/studiotest.ts`:** every kit piece in use (`?take=v1&scene=v1/studiotest`). Its stills are in
     `out/wip/v1-studio/`.
5. `app/src/scenes/chorus.ts` (v3) sets the bar for structure and finish. `app/src/scenes/acting.ts` shows Rai's whole
   acting range.

## v1's rules on top of v3's

- **The lyric:**
  - Every sung line is the show's **lower third**: `lowerThird(c, line, t)` (y defaults to H − 112). It is readable
    everywhere; nothing sits on top of it.
  - Spoken lines (the intro and the outro) are `captions()`.
  - Production numbers and gags add `slam()` words on top of the lower third, never instead of it.
- **Rai is the host.** She holds the mic in most studio shots (`prop: { side: 1, draw: micProp }` in `drawRai`). She
  acts every line (faces, arm poses, hops, squash, chibi pops with `poof`, marks). She is the only face.
- **TV grammar:**
  - Hard cuts between cameras on the beat, about every 2 beats in the rapped verses.
  - A `camTag('CAM 2', …)` on some cuts, not all.
  - `liveBug` in studio shots.
  - Crash zooms (`punch` plus a quick `withCam` zoom) for winks and stings.
  - `vhs()` over archive footage, `nightVision()` over the outside broadcast, `staticFlip()` for a channel change.
- **Continuity across plates:**
  - **The scoreboard's states:**
    - dark in `onair`;
    - `NET WORTH: AGREED` in `twist`;
    - `?` in `number1`;
    - `HER SCORE 0` in `uptheroad`;
    - `INCOME £21,400 → £0` in `dating`;
    - the pink 0 inside the pink ring in `number2`;
    - shattered in `panel` (it stays a broken frame with dead dots in `lift`);
    - rebuilt in bulbs with glows in `festival`.
  - **Seat C7's lunchbox:** `number1` (found), `uptheroad` (the same lunchbox in the kitchen), `number2` (a fin over
    it), `goodnight` (packed on the side table).
  - **The cast:** always draw them with `cast()`.
  - **The set:** same positions in every wide shot. `SET.floor` is where Rai's feet stand. The curtain is closed
    unless the script opens it. The ring is lit in the numbers.
- **The compositor:** smooth capped shakes on real hits only (at most one per bar, ≤ 8 px), punches on slams, colour
  kicks on the two or three biggest impacts. The silence in `uptheroad` gets **no** shake.
- **Memory (this 16 GB Mac froze twice on 10-02):**
  - Check your work with **stills and contact sheets**.
  - Clips only short (≤ 6 s) and `--samples` ≤ 4.
  - One render at a time per author.
  - Never a full-length video.

## Running things

All commands run from the engine folder (`app/` in the original project, `engine/` in this repository).

- **Stills:** `bun scripts/render.ts stills --take v1 --only <id> --t 13.5,15.2 --out ../out/wip/v1-<id>`. Then LOOK
  at them with the Read tool.
- **Sheet:**
  `bun scripts/render.ts sheet --take v1 --only <id> --from <a> --to <b> --n 16 --cols 4 --out ../out/wip/v1-<id>.png`.
- **Clip:**
  `bun scripts/render.ts video --take v1 --only <id> --from <a> --to <a+5> --samples 4 --out ../out/wip/v1-<id>.mp4`.
- **Typecheck:** `bunx tsc --noEmit -p tsconfig.json 2>&1 | grep scenes/v1/<id>`.
- **Data:**
  - lines: `takes/v1/lyrics.json` (`lines[i].text`, `words[].w/start/end`);
  - beats: `takes/v1/audio.json`;
  - find lines by content (`lyrics.get('richest rock')`) or by first-word time in your window; never hard-code times.

## The plates (ids are timeline ids; files are `app/src/scenes/v1/<id>.ts`)

| id | window (s) | lines (`i`) | the script |
|---|---|---|---|
| onair | 0–12.95 | 0–1 + the vamp | the lens cap, ON AIR, the show opens |
| archive | 12.95–27.09 | 2–5 | "Previously…": the quarry, 400 km, the pole demo (ow), the storm and the trapdoor |
| twist | 27.09–40.80 | 6–9 | TWIST!, the news desk, the shopping channel, THE RICH LIST |
| vote | 40.80–54.51 | 10–13 | the sincere spot, scorecards of stories, the applause meter, "?" |
| number1 | 54.51–75.07 | 14–18 | the first production number; the tag's spotlight finds who is waiting, then seat C7 |
| pitch | 75.07–88.78 | 19–22 | the trader's pitch, 1/10, the points board, the buzzer round |
| quickfire | 88.78–96.07 | 23–24 | print / wire / mine podiums, the gold trophy, GENIUS, two strangers, the X and the wink |
| uptheroad | 96.07–102.92 | 25–26 | LIVE · UP THE ROAD night vision, then the scoreboard's eye, blink, 0, and the silence |
| dating | 102.92–116.20 | 27–30 | the dating segment, the before/after split, the meter, the wrong kind of time |
| number2 | 116.20–129.49 | 31–34 | the tender reprise: jellyfish lighters, the pink ring around the 0, C7 hugged |
| panel | 129.49–143.62 | 35–38 | THE BIG DEBATE, the smash, the pole reveal |
| lift | 143.62–156.48 | 39–46 | the chant twice: the audience, then the whole cast; the stage elevator rises |
| festival | 156.48–186.90 | 47–54 | the studio breaches onto Yap's beach at night: fireworks, the rebuilt scoreboard, the crowd's words |
| goodnight | 186.90–204.37 | 55–57 + credits | the beach wedding, the crab can't lift her, the pull back to the TV in the woman's living room, the credits on the TV, the CRT dot |

## Report back

In your final message, give:
- what each plate shows, shot by shot, with times;
- each clue and what it means;
- the path of a final contact sheet per plate;
- the measured ms a frame at 1080p for your busiest shot;
- anything you needed but could not touch;
- anything you are unsure of.
