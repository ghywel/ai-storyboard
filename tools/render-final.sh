#!/bin/zsh
# The final render: 3840x2160 at 60 fps with adaptive motion blur (sub-frames up to 108, a 0.2 shutter), encoded in the
# browser (WebCodecs H.264, ~160 Mbps), in segments of 55 s:
#   - each segment is a fresh browser that loads only the plates it touches (memory stays bounded at 4K);
#   - each runs under tools/memwatch.py (kills it if the compressor grows by 2.5 GB or swap is touched);
#   - a finished segment is never re-rendered (its .done marker), so a stop costs one segment;
# then the raw Annex B streams are joined byte for byte, remuxed at 60 fps with BT.709 tags, and the take's audio added.
#   TAKE=<take> tools/render-final.sh     -> out/final/<take>-4k60.mp4
set -e
cd "${0:A:h}/../engine"
: ${TAKE:?set TAKE to a folder under takes/}
FF=${FFMPEG:-ffmpeg}; FP=${FFPROBE:-ffprobe}
OUT=../out/final/$TAKE
mkdir -p $OUT
bun scripts/render.ts timeline --take $TAKE 2>/dev/null | grep '^\[' > $OUT/timeline.json
DUR=$($FP -v error -show_entries format=duration -of csv=p=0 ../takes/$TAKE/audio.wav)
SEG=55
N=$(python3 -c "import math; print(math.ceil($DUR / $SEG))")
echo "== $TAKE: $DUR s in $N segments of $SEG s ($(date +%H:%M))"
for i in $(seq 0 $((N - 1))); do
  A=$((i * SEG)); B=$(python3 -c "print(min($DUR, $(( (i + 1) * SEG ))))")
  F=$OUT/seg-$i.mp4
  if [[ -f $F.done ]]; then echo "-- segment $i ($A-$B) already done"; continue; fi
  IDS=$(python3 -c "
import json; t = json.load(open('$OUT/timeline.json'))
print(','.join(e['id'] for e in t if e['start'] < $B + 0.2 and e['end'] > $A - 0.2))")
  echo "-- segment $i: $A to $B s, plates $IDS ($(date +%H:%M))"
  python3 ../tools/memwatch.py --max-cmp 2.5 --max-swap 0.2 --max-wall 7200 --log $OUT/mem-$i.log -- \
    env FILM_FFMPEG=$FF bun scripts/render.ts video --take $TAKE --scale 2 --only $IDS --from $A --to $B \
      --samples auto --max-samples 108 --tol 3 --shutter 0.2 --bitrate 160 --noaudio --keep-h264 --out $F > $OUT/seg-$i.log 2>&1
  [[ -s $OUT/seg-$i.h264 ]] || { echo "segment $i produced no stream"; exit 1; }
  touch $F.done
  tr '\r' '\n' < $OUT/seg-$i.log | grep -E "wrote|sub-frames" | tail -2
done
echo "== join + audio ($(date +%H:%M))"
: > $OUT/all.h264
for i in $(seq 0 $((N - 1))); do cat $OUT/seg-$i.h264 >> $OUT/all.h264; done
$FF -y -loglevel error -fflags +genpts -r 60 -f h264 -i $OUT/all.h264 -c:v copy \
  -bsf:v h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1 \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv -movflags +faststart $OUT/video.mp4
$FF -y -loglevel error -i $OUT/video.mp4 -i ../takes/$TAKE/audio.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k \
  -shortest -movflags +faststart ../out/final/$TAKE-4k60.mp4
$FP -v error -count_packets -show_entries stream=codec_type,width,height,r_frame_rate,nb_read_packets,color_transfer:format=duration,size -of compact ../out/final/$TAKE-4k60.mp4
echo "== done ($(date +%H:%M))"
