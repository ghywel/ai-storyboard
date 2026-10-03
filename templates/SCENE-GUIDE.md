# Scene guide for <film>

You are building plates of <film>. Build them to <storyboard depth | final quality>.

## THE DIRECTION (the director's notes): this overrides anything below that disagrees

1. <Note, verbatim where possible, then what it means for a plate.>

## Read first, in this order

1. `TREATMENT-<take>.md`: the idea, tone, palette, lyric, grammar, motifs, and your plates' shot-by-shot script.
2. `DIRECTION.md` and `METHOD.md` in this repository.
3. The kit (frozen: read it, never edit it): <files and what each holds>.
4. The look-test scene and its stills: <path>.
5. A finished plate that sets the bar: <path>.
6. Do not borrow these pictures (another film's): <list>.

## Rules

- **Files.** One file per plate, `engine/src/scenes/<film>/<id>.ts`, helpers in `<id>-*.ts`. Never edit the kit,
  another plate, or the timeline: write what you need in your own files and say so in your report.
- **Time.** `f.t` is master time. Find your lines by content or by first-word time inside your window, never by
  hard-coded times. Cuts land on the beat at or before a word.
- **Determinism.** No `Math.random()`, `Date.now()` or `performance.now()`; use the hash helper. Frames render out of
  order and as many sub-frames.
- **Layers.** The main layer, plus a glow layer drawn additively (it blooms). Clear the glow under the lyric.
- **Performance.** Under about 40 ms a frame at 1080p for your busiest shot; precompute in `init()`.
- **Memory.** Stills and contact sheets; short clips only (≤ 6 s, ≤ 4 samples); one render at a time; never a
  full-length video.

## Continuity

| Thing | <plate> | <plate> | <plate> |
|---|---|---|---|
| <recurring prop or board> | <state> | <state> | <state> |

Shared decisions, with their single owner: <e.g. which plate gives the character the prop>.

## Running things

All commands run from `engine/`:
- **Stills:** `bun scripts/render.ts stills --take <take> --only <id> --t a,b --out ../out/wip/<id>`, then look at them.
- **Contact sheet:** `bun scripts/render.ts sheet --take <take> --only <id> --from a --to b --n 16 --cols 4 --out ../out/wip/<id>.png`.
- **Perf:** `bun scripts/render.ts perf --take <take> --only <id> --from a --to b`.
- **Typecheck:** `bunx tsc --noEmit -p tsconfig.json`.

## The plates

| id | window (s) | lines | the script |
|---|---|---|---|

## Report back

In your final message, give:
- what each plate shows, shot by shot, with times;
- each clue and what it means;
- the path of a final contact sheet per plate;
- your busiest shot's ms a frame;
- anything you needed but could not touch;
- anything you are unsure of.
