#!/usr/bin/env bash
# Video Frame Extraction Script
# Usage: extract-frames.sh <input_video> <output_dir> <fps_rate> [max_frames] [stream_index] [grid_layout] [start_time] [end_time]
# Fallback-safe for FFmpeg builds without libfreetype/drawtext (uses Python Pillow to stamp timestamps).

set -euo pipefail

[[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]] && export PATH="$HOME/bin:$PATH"

INPUT="${1:?Usage: extract-frames.sh <input_video> <output_dir> <fps_rate> [max_frames] [stream_index] [grid_layout] [start_time] [end_time]}"
OUTPUT_DIR="${2:?Specify output directory}"
FPS="${3:?Specify fps rate (e.g., 2, 1, 0.1, 0.05)}"
MAX_FRAMES="${4:-0}"  # 0 = auto safety cap
STREAM_INDEX="${5:-auto}"  # auto = detect correct stream
GRID_LAYOUT="${6:-4x4}"  # tile layout for grids
START_TIME="${7:-}"  # e.g., "00:00:10" or "10" (seconds)
END_TIME="${8:-}"    # e.g., "00:00:30" or "30" (seconds)

MAX_FPS=120
MAX_FRAME_CAP=1000
MAX_GRID_DIM=10
MAX_GRID_CELLS=100

is_positive_number() {
    [[ "$1" =~ ^[0-9]+([.][0-9]+)?$ ]] || return 1
    awk -v n="$1" 'BEGIN { exit !(n > 0) }'
}

number_lte() {
    awk -v n="$1" -v max="$2" 'BEGIN { exit !(n <= max) }'
}

is_time_value() {
    [[ "$1" =~ ^[0-9]+$ || "$1" =~ ^[0-9]+:[0-5]?[0-9]$ || "$1" =~ ^[0-9]+:[0-5]?[0-9]:[0-5]?[0-9]$ ]]
}

time_to_seconds() {
    local value="$1"
    local first second third
    IFS=: read -r first second third <<< "$value"

    if [[ -z "${second:-}" ]]; then
        echo "$((10#$first))"
    elif [[ -z "${third:-}" ]]; then
        echo "$((10#$first * 60 + 10#$second))"
    else
        echo "$((10#$first * 3600 + 10#$second * 60 + 10#$third))"
    fi
}

# Validate input
if [[ ! -f "$INPUT" ]]; then
    echo "ERROR: File not found: $INPUT" >&2
    exit 1
fi

if ! is_positive_number "$FPS" || ! number_lte "$FPS" "$MAX_FPS"; then
    echo "ERROR: fps rate must be > 0 and <= ${MAX_FPS}: $FPS" >&2
    exit 1
fi

if ! [[ "$MAX_FRAMES" =~ ^[0-9]+$ ]]; then
    echo "ERROR: max_frames must be a non-negative integer: $MAX_FRAMES" >&2
    exit 1
fi
if [[ "$MAX_FRAMES" -gt "$MAX_FRAME_CAP" ]]; then
    echo "ERROR: max_frames must be 0 or <= ${MAX_FRAME_CAP}: $MAX_FRAMES" >&2
    exit 1
fi

if [[ "$STREAM_INDEX" != "auto" ]] && ! [[ "$STREAM_INDEX" =~ ^[0-9]+$ ]]; then
    echo "ERROR: stream_index must be 'auto' or a non-negative integer: $STREAM_INDEX" >&2
    exit 1
fi

if ! [[ "$GRID_LAYOUT" =~ ^[1-9][0-9]*x[1-9][0-9]*$ ]]; then
    echo "ERROR: grid_layout must match NxM (e.g., 4x4): $GRID_LAYOUT" >&2
    exit 1
fi
GRID_COLS="${GRID_LAYOUT%x*}"
GRID_ROWS="${GRID_LAYOUT#*x}"
GRID_CELLS=$((GRID_COLS * GRID_ROWS))
if [[ "$GRID_COLS" -gt "$MAX_GRID_DIM" || "$GRID_ROWS" -gt "$MAX_GRID_DIM" || "$GRID_CELLS" -gt "$MAX_GRID_CELLS" ]]; then
    echo "ERROR: grid_layout must be at most ${MAX_GRID_DIM}x${MAX_GRID_DIM} and <= ${MAX_GRID_CELLS} cells: $GRID_LAYOUT" >&2
    exit 1
fi

if [[ -n "$START_TIME" ]] && ! is_time_value "$START_TIME"; then
    echo "ERROR: Invalid start_time format: $START_TIME" >&2
    exit 1
fi

if [[ -n "$END_TIME" ]] && ! is_time_value "$END_TIME"; then
    echo "ERROR: Invalid end_time format: $END_TIME" >&2
    exit 1
fi
START_SECONDS=0
if [[ -n "$START_TIME" ]]; then
    START_SECONDS=$(time_to_seconds "$START_TIME")
fi
END_SECONDS=""
if [[ -n "$END_TIME" ]]; then
    END_SECONDS=$(time_to_seconds "$END_TIME")
fi
if [[ -n "$END_SECONDS" && "$END_SECONDS" -le "$START_SECONDS" ]]; then
    echo "ERROR: end_time must be greater than start_time" >&2
    exit 1
fi

mkdir -p "$OUTPUT_DIR"

# Auto-detect video stream if not specified
if [[ "$STREAM_INDEX" == "auto" ]]; then
    STREAM_INDEX=$(ffprobe -v error -show_streams -of json "$INPUT" 2>/dev/null | python3 -c "
import sys, json
d = json.load(sys.stdin)
for s in d.get('streams', []):
    if s.get('codec_type') == 'video':
        disp = s.get('disposition', {})
        if disp.get('attached_pic', 0) == 1:
            continue
        if s.get('codec_name') == 'mjpeg' and s.get('avg_frame_rate') == '0/0':
            continue
        print(s.get('index', 0))
        break
else:
    for s in d.get('streams', []):
        if s.get('codec_type') == 'video':
            print(s.get('index', 0))
            break
" 2>/dev/null || echo "0")
fi

MAP_ARGS=("-map" "0:${STREAM_INDEX}")
TIME_ARGS=()
if [[ -n "$START_TIME" ]]; then
    TIME_ARGS+=("-ss" "$START_TIME")
fi
if [[ -n "$END_TIME" ]]; then
    TIME_ARGS+=("-to" "$END_TIME")
fi

DURATION=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$INPUT" 2>/dev/null)
RESOLUTION=$(ffprobe -v error -select_streams v:${STREAM_INDEX} -show_entries stream=width,height -of csv=p=0 "$INPUT" 2>/dev/null || echo "unknown")
TOTAL_FRAMES=$(python3 -c "print(int(float('$DURATION') * float('$FPS')))" 2>/dev/null)

HAS_DRAWTEXT="false"
if ffmpeg -filters 2>/dev/null | grep -q "drawtext"; then
    HAS_DRAWTEXT="true"
fi

echo "=== Video Frame Extraction ==="
echo "Input: $INPUT"
echo "Duration: ${DURATION}s"
echo "Resolution: $RESOLUTION"
echo "Video stream: $STREAM_INDEX"
echo "FPS rate: $FPS"
echo "Grid layout: $GRID_LAYOUT"
echo "Estimated frames: $TOTAL_FRAMES"
echo "FFmpeg drawtext: $HAS_DRAWTEXT"
echo "Output: $OUTPUT_DIR"
echo ""

EFFECTIVE_FRAME_LIMIT="$MAX_FRAMES"
if [[ "$EFFECTIVE_FRAME_LIMIT" -eq 0 ]]; then
    EFFECTIVE_FRAME_LIMIT="$MAX_FRAME_CAP"
fi
FRAME_LIMIT_ARGS=("-frames:v" "$EFFECTIVE_FRAME_LIMIT")
MONTAGE_LIMIT=$(((EFFECTIVE_FRAME_LIMIT + GRID_CELLS - 1) / GRID_CELLS))
MONTAGE_LIMIT_ARGS=("-frames:v" "$MONTAGE_LIMIT")
echo "Frame limit: $EFFECTIVE_FRAME_LIMIT"

if [[ "$HAS_DRAWTEXT" == "true" ]]; then
    FILTER="fps=${FPS},scale='min(1280,iw)':-2,drawtext=text='%{pts\\:hms}':x=10:y=10:fontsize=28:fontcolor=white:borderw=2:bordercolor=black"
else
    FILTER="fps=${FPS},scale='min(1280,iw)':-2"
fi

# Extract individual frames as JPG
ffmpeg -i "$INPUT" \
    ${MAP_ARGS[@]+"${MAP_ARGS[@]}"} \
    ${TIME_ARGS[@]+"${TIME_ARGS[@]}"} \
    -vf "$FILTER" \
    -q:v 2 \
    ${FRAME_LIMIT_ARGS[@]+"${FRAME_LIMIT_ARGS[@]}"} \
    "${OUTPUT_DIR}/frame_%05d.jpg" \
    -y -loglevel warning 2>&1

# If drawtext is missing, stamp timestamps onto extracted frames via Python Pillow
if [[ "$HAS_DRAWTEXT" == "false" ]]; then
    python3 - "$OUTPUT_DIR" "$FPS" "$START_SECONDS" <<'PYSTAMP' 2>/dev/null || true
import sys, os, glob
from PIL import Image, ImageDraw, ImageFont

out_dir, fps_s, start_s = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
frames = sorted(glob.glob(os.path.join(out_dir, "frame_*.jpg")))
try:
    font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 28)
except Exception:
    font = ImageFont.load_default()

for idx, fpath in enumerate(frames):
    t = start_s + (idx / fps_s)
    m, s = divmod(t, 60)
    h, m = divmod(int(m), 60)
    label = f"{h:02d}:{m:02d}:{s:04.1f}"
    img = Image.open(fpath)
    draw = ImageDraw.Draw(img)
    draw.rectangle([6, 6, 175, 42], fill=(0, 0, 0))
    draw.text((12, 10), label, fill=(255, 255, 255), font=font)
    img.save(fpath, quality=90)
PYSTAMP
fi

EXTRACTED=$(ls "${OUTPUT_DIR}"/frame_*.jpg 2>/dev/null | wc -l | tr -d ' ')
echo "Extracted: $EXTRACTED frames"

# Generate montage grids from extracted frames (fast & preserves stamped timestamps)
echo ""
echo "=== Creating Montage Grids ==="
GRID_CELL_WIDTH=640
ffmpeg -framerate 1 \
    -i "${OUTPUT_DIR}/frame_%05d.jpg" \
    -vf "scale='min(${GRID_CELL_WIDTH},iw)':-2,tile=${GRID_LAYOUT}" \
    -q:v 2 \
    ${MONTAGE_LIMIT_ARGS[@]+"${MONTAGE_LIMIT_ARGS[@]}"} \
    "${OUTPUT_DIR}/grid_%03d.jpg" \
    -y -loglevel warning 2>&1

GRIDS=$(ls "${OUTPUT_DIR}"/grid_*.jpg 2>/dev/null | wc -l | tr -d ' ')
echo "Created: $GRIDS montage grids (${GRID_LAYOUT})"

# Detect scene changes (key moments)
echo ""
echo "=== Scene Change Detection ==="
SCENE_FILE="${OUTPUT_DIR}/scene_changes.txt"
ffmpeg -i "$INPUT" \
    ${MAP_ARGS[@]+"${MAP_ARGS[@]}"} \
    ${TIME_ARGS[@]+"${TIME_ARGS[@]}"} \
    -vf "select='gt(scene,0.3)',showinfo" \
    -f null - 2>&1 | grep 'pts_time' | sed 's/.*pts_time:\([0-9.]*\).*/\1/' | grep '^[0-9]' > "$SCENE_FILE" || true

SCENE_COUNT=$(wc -l < "$SCENE_FILE" | tr -d ' ')
echo "Detected: $SCENE_COUNT scene changes"

# Extract key frames at scene changes (high-res individual frames for detailed analysis)
if [[ "$SCENE_COUNT" -gt 0 ]]; then
    mkdir -p "${OUTPUT_DIR}/key_frames"
    KEY_IDX=0
    while IFS= read -r TIMESTAMP; do
        KEY_IDX=$((KEY_IDX + 1))
        [[ "$KEY_IDX" -gt 20 ]] && break
        TS_SAFE=$(echo "$TIMESTAMP" | tr '.' '_')
        OUTFILE="${OUTPUT_DIR}/key_frames/scene_$(printf '%02d' $KEY_IDX)_${TS_SAFE}s.jpg"
        if [[ "$HAS_DRAWTEXT" == "true" ]]; then
            KF_FILTER="scale='min(1280,iw)':-2,drawtext=text='${TIMESTAMP}s':x=10:y=10:fontsize=32:fontcolor=white:borderw=2:bordercolor=black"
        else
            KF_FILTER="scale='min(1280,iw)':-2"
        fi
        ffmpeg -i "$INPUT" \
            ${MAP_ARGS[@]+"${MAP_ARGS[@]}"} \
            -ss "$TIMESTAMP" \
            -frames:v 1 \
            -vf "$KF_FILTER" \
            -q:v 1 \
            -update 1 \
            "$OUTFILE" \
            -y -loglevel warning 2>&1
    done < "$SCENE_FILE"

    if [[ "$HAS_DRAWTEXT" == "false" ]]; then
        python3 - "${OUTPUT_DIR}/key_frames" <<'PYKFSTAMP' 2>/dev/null || true
import sys, os, glob, re
from PIL import Image, ImageDraw, ImageFont

kf_dir = sys.argv[1]
try:
    font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 30)
except Exception:
    font = ImageFont.load_default()

for fpath in sorted(glob.glob(os.path.join(kf_dir, "scene_*.jpg"))):
    m = re.search(r"scene_\d+_(.+)s\.jpg$", os.path.basename(fpath))
    label = (m.group(1).replace("_", ".") + "s") if m else os.path.basename(fpath)
    img = Image.open(fpath)
    draw = ImageDraw.Draw(img)
    draw.rectangle([6, 6, 175, 44], fill=(0, 0, 0))
    draw.text((12, 10), label, fill=(255, 230, 0), font=font)
    img.save(fpath, quality=92)
PYKFSTAMP
    fi

    KEY_EXTRACTED=$(ls "${OUTPUT_DIR}"/key_frames/scene_*.jpg 2>/dev/null | wc -l | tr -d ' ')
    echo "Extracted: $KEY_EXTRACTED key frames at scene changes"
fi

# Write metadata file with pacing stats
python3 - "$INPUT" "$DURATION" "$RESOLUTION" "$STREAM_INDEX" "$FPS" "$GRID_LAYOUT" "$EXTRACTED" "$GRIDS" "$SCENE_COUNT" "$SCENE_FILE" "$OUTPUT_DIR" <<'PYMETA'
import sys, os, json

(
    input_path, duration, resolution, stream_idx,
    fps, grid_layout, extracted, grids,
    scene_count, scene_file, output_dir
) = sys.argv[1:]

dur = float(duration) if duration else 0.0
scenes = []
if os.path.isfile(scene_file):
    with open(scene_file, "r") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    scenes.append(round(float(line), 2))
                except ValueError:
                    pass

shots = len(scenes) + 1
avg_shot_len = round(dur / shots, 2) if dur > 0 else 0.0

meta = {
    "source": os.path.basename(input_path),
    "duration_seconds": dur,
    "resolution": resolution,
    "video_stream_index": int(stream_idx),
    "fps_rate": float(fps),
    "grid_layout": grid_layout,
    "total_frames_extracted": int(extracted),
    "montage_grids": int(grids),
    "scene_changes": int(scene_count),
    "scene_timestamps": scenes,
    "estimated_shots": shots,
    "average_shot_duration_seconds": avg_shot_len,
    "output_directory": output_dir,
}

with open(os.path.join(output_dir, "metadata.json"), "w", encoding="utf-8") as f:
    json.dump(meta, f, indent=2, ensure_ascii=False)
PYMETA

echo ""
echo "=== Done ==="
echo "Frames:      ${OUTPUT_DIR}/frame_*.jpg"
echo "Grids:       ${OUTPUT_DIR}/grid_*.jpg"
echo "Key frames:  ${OUTPUT_DIR}/key_frames/"
echo "Scenes:      $SCENE_FILE"
echo "Meta:        ${OUTPUT_DIR}/metadata.json"

