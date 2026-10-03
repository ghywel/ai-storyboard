#!/bin/zsh
# Every 3 s, the kernel's footprint of each render process (headless Chromium's processes, bun, ffmpeg), to find the
# process that holds the memory top does not attribute. Runs until killed.
while true; do
  P=$(pgrep -f "chrome-headless-shell|bun scripts/render|ffmpeg" | tr '\n' ' ')
  for p in ${=P}; do
    n=$(ps -o comm= -p $p 2>/dev/null | awk -F/ '{print $NF}' | cut -c1-24)
    t=$(ps -o args= -p $p 2>/dev/null | grep -o -- '--type=[a-z-]*' | head -1)
    f=$(footprint $p 2>/dev/null | grep -m1 "Footprint:" | grep -oE "Footprint: [0-9.]+ [KMG]B")
    print -r -- "$(date +%T) $p $n $t $f"
  done
  echo ---
  sleep 3
done
