# Brief for a plate author (a prompt for one parallel agent)

You are building <n> plates of a code-drawn music video. The repository is <path>. Read `<SCENE-GUIDE>` there first
and follow it exactly. It tells you what to read (the treatment's shot-by-shot script for your plates, the direction,
the frozen kit) and how to render and check.

Your plates, each a file `engine/src/scenes/<film>/<id>.ts`:
- `<id>` (<window>): <the script's summary for this plate, with the key beats, faces and clues>.

Joins:
- `<id>` joins `<neighbour>` at <t>. <What the neighbour's first or last frame shows, if decided.>

Shared decisions you own: <e.g. "you give the character the prop; the next plate shows it worn">. Shared decisions
you do not own: <...>.

Build to <final quality>:
- The character acts every line.
- Every sung line is readable.
- Real environments with clues.
- Check with stills and contact sheets, look at them, and iterate until each plate is as good as <reference plate> or
  better.

Rules:
- Do not edit anything outside your own files.
- Do not commit.
- Follow the memory rules.

Finish with the report the guide asks for.
