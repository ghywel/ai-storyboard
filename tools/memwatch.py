#!/usr/bin/env python3
"""Run a command under a strict memory watchdog. Twice on 2026-10-02 a render froze this 16 GB Mac while the render's
own processes showed small RSS: the memory had gone to the compressor (RSS excludes compressed pages). So this watches
what RSS hides, every second:
  - the compressor's size and swap use (vm_stat, sysctl vm.swapusage),
  - the top processes by footprint, compressed memory included (top's MEM),
and kills the whole process group as soon as the compressor grows by --max-cmp GB over its starting size, swap use
grows by --max-swap GB, or --max-wall seconds pass. The log names the process that grew.

    memwatch.py [--max-cmp 1.5] [--max-swap 0.25] [--max-wall 600] [--log mem.log] -- <command ...>
"""
import os, re, signal, subprocess, sys, time

args = sys.argv[1:]
max_cmp, max_swap, max_wall, log = 1.5, 0.25, 600.0, "mem.log"
while args and args[0] != "--":
    k = args.pop(0)
    if k == "--max-cmp": max_cmp = float(args.pop(0))
    elif k == "--max-swap": max_swap = float(args.pop(0))
    elif k == "--max-wall": max_wall = float(args.pop(0))
    elif k == "--log": log = args.pop(0)
args = args[1:]

def vm():
    out = subprocess.run(["vm_stat"], capture_output=True, text=True).stdout
    page = int(re.search(r"page size of (\d+)", out).group(1))
    get = lambda k: int(re.search(k + r":\s+(\d+)", out).group(1)) * page / 1024 ** 3
    return {"free": get("Pages free"), "cmp": get("Pages occupied by compressor"), "file": get("File-backed pages"), "anon": get("Anonymous pages")}

def swap():
    out = subprocess.run(["sysctl", "-n", "vm.swapusage"], capture_output=True, text=True).stdout
    m = re.search(r"used = ([\d.]+)M", out)
    return float(m.group(1)) / 1024 if m else 0.0

def top_procs(n=4):
    out = subprocess.run(["top", "-l", "1", "-o", "mem", "-n", str(n), "-stats", "pid,command,mem,cmprs"], capture_output=True, text=True).stdout
    rows = []
    for line in out.splitlines():
        m = re.match(r"\s*(\d+)\s+(.+?)\s+(\d+[BKMG]\+?)\s+(\d+[BKMG]\+?)\s*$", line)
        if m: rows.append(f"{m.group(2)[:22]}={m.group(3)}/{m.group(4)}")
    return " ".join(rows)

v0, s0 = vm(), swap()
p = subprocess.Popen(args, start_new_session=True)
t0 = time.time()
def kill(why, f):
    f.write(f"KILLED: {why}\n"); f.flush()
    try: os.killpg(p.pid, signal.SIGKILL)
    except ProcessLookupError: pass
    print(f"memwatch: killed: {why}", file=sys.stderr)
    sys.exit(3)
with open(log, "w") as f:
    f.write(f"start: free {v0['free']:.2f} GB, compressor {v0['cmp']:.2f} GB, swap {s0:.2f} GB\n")
    while p.poll() is None:
        v, s, el = vm(), swap(), time.time() - t0
        f.write(f"{el:6.1f}s free {v['free']:5.2f} cmp {v['cmp']:5.2f} swap {s:5.2f} anon {v['anon']:5.2f} file {v['file']:5.2f} GB | {top_procs()}\n"); f.flush()
        if v["cmp"] - v0["cmp"] > max_cmp: kill(f"compressor grew {v['cmp'] - v0['cmp']:.2f} GB", f)
        if s - s0 > max_swap: kill(f"swap grew {s - s0:.2f} GB", f)
        if el > max_wall: kill(f"wall time {el:.0f} s", f)
        time.sleep(1)
print(f"memwatch: exit {p.returncode}; log {log}")
sys.exit(p.returncode)
