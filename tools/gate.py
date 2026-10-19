#!/usr/bin/env python3
"""A gate report that cannot skip a check. Every check in checks.json that applies to the gate must be answered.

    gate.py <gate> <report.json>          validate; refuses (exit 1) on any missing or unexplained answer
    gate.py <gate> --template > r.json    write a blank report for the gate to fill in

A report is {"film": "...", "version": 1, "answers": {"<check id>": {"status": "pass|fixed|n/a|fail", "note": "..."}},
"notes": [{"n": 1, "change": "...", "status": "done|partly|not_done"}]}.
- "fixed" and "n/a" need a note (what was fixed; why it does not apply). "fail" blocks the gate.
- "notes" answers the director's numbered notes on the previous version: every note gets a concrete change and a status,
  never "addressed".
The idea comes from mortiflix-oss's gates (AGPL-3.0; idea only, written fresh here).
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
reg = json.load(open(os.path.join(ROOT, "checks.json")))
if len(sys.argv) < 3:
    print(__doc__); sys.exit(2)
gate = sys.argv[1]
assert gate in reg["gates"], f"unknown gate {gate!r}: one of {reg['gates']}"
due = [c for c in reg["checks"] if gate in c["applies_to"]]

if sys.argv[2] == "--template":
    print(json.dumps({"film": "", "version": 1, "answers": {c["id"]: {"status": "", "note": ""} for c in due}, "notes": []}, indent=1))
    sys.exit(0)

rep = json.load(open(sys.argv[2]))
ans = rep.get("answers", {})
problems = []
for c in due:
    a = ans.get(c["id"])
    if not a or not a.get("status"):
        problems.append(f"missing   {c['id']}: {c['title']} ({c['how']})"); continue
    st, note = a["status"], (a.get("note") or "").strip()
    if st not in ("pass", "fixed", "n/a", "fail"):
        problems.append(f"bad status {c['id']}: {st!r}")
    elif st in ("fixed", "n/a") and len(note) < 10:
        problems.append(f"no note   {c['id']}: '{st}' needs a note saying what was fixed or why it does not apply")
    elif st == "fail":
        problems.append(f"FAIL      {c['id']}: {note or c['title']}")
for k in ans:
    if k not in {c["id"] for c in due}:
        problems.append(f"unknown   {k}: not a check for the {gate} gate")
for nt in rep.get("notes", []):
    if nt.get("status") not in ("done", "partly", "not_done") or len((nt.get("change") or "").strip()) < 10:
        problems.append(f"note {nt.get('n')}: needs a concrete change and a status of done, partly or not_done")
print(f"{gate} gate, {rep.get('film', '?')} v{rep.get('version', '?')}: {len(due)} checks, {len(rep.get('notes', []))} director's notes answered")
for p in problems:
    print("  " + p)
print("REFUSED" if problems else "ACCEPTED")
sys.exit(1 if problems else 0)
