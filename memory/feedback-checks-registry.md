---
name: feedback-checks-registry
description: "Every gate answers every applicable check in checks.json; an uncaught error becomes a new check; film-qc.py measures the render"
metadata:
  type: feedback
---

At each gate (boards, stills, preview, final), fill a report for `tools/gate.py`: every applicable check in
`checks.json` is pass, fixed (with a note) or n/a (with a reason), and every numbered director's note gets a concrete
change and a status. Run `tools/film-qc.py --take takes/<take>` on every preview and final render. Sort each
director's note into error or taste; an error no check caught becomes a proposed entry in `checks.json`.

**Why:** LESSONS.md is prose, and prose is skimmed; a registry a gate cannot pass without makes every lesson run on
every film (mortiflix-oss's gates, idea only). The film check caught planted black frames and over-long holds that a
contact sheet skims past (2026-10-19).

**How to apply:** keep reviewed pages and keyframes in films/<film>/reviews/<gate>/v<n>/; hold ceilings come from the
take's grid (`--hold-beats`), designed holds and blacks are named with `--allow`.
