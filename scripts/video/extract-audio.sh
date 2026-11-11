#!/usr/bin/env bash
# Audio Extraction and Transcription Script
# Usage: extract-audio.sh <input_video> <output_dir> [whisper_model] [language]
# Supports whisper-cli (whisper.cpp, default in DSC Academy workspace) AND openai-whisper CLI.

set -euo pipefail

[[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]] && export PATH="$HOME/bin:$PATH"

INPUT="${1:?Usage: extract-audio.sh <input_video> <output_dir> [whisper_model] [language]}"
OUTPUT_DIR="${2:?Specify output directory}"
MODEL="${3:-base}"  # tiny|base|small|medium|large
LANGUAGE="${4:-auto}"  # auto|vi|en

if [[ ! -f "$INPUT" ]]; then
    echo "ERROR: File not found: $INPUT" >&2
    exit 1
fi

mkdir -p "$OUTPUT_DIR"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../../.." 2>/dev/null && pwd || pwd)"

echo "=== Audio Extraction ==="
echo "Input: $INPUT"
echo "Model: $MODEL"

AUDIO_INFO=$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,sample_rate,channels,bit_rate -of json "$INPUT" 2>/dev/null || echo "{}")
echo "Audio info: $AUDIO_INFO"

# Extract audio as WAV (16kHz mono - optimal for Whisper)
AUDIO_FILE="${OUTPUT_DIR}/audio.wav"
echo ""
echo "Extracting audio to WAV (16kHz mono)..."
ffmpeg -i "$INPUT" \
    -vn \
    -acodec pcm_s16le \
    -ar 16000 \
    -ac 1 \
    "$AUDIO_FILE" \
    -y -loglevel warning 2>&1

echo "Audio extracted: $AUDIO_FILE"

# Detect silence segments
echo ""
echo "=== Silence Detection ==="
SILENCE_FILE="${OUTPUT_DIR}/silence.txt"
ffmpeg -i "$AUDIO_FILE" \
    -af "silencedetect=noise=-30dB:d=0.4" \
    -f null - 2>&1 | grep -E "silence_(start|end)" > "$SILENCE_FILE" || true

if [[ -s "$SILENCE_FILE" ]]; then
    echo "Silence segments detected (see ${SILENCE_FILE})"
else
    echo "No significant silence detected"
fi

# Audio volume & EBU R128 LUFS analysis
echo ""
echo "=== Volume & Loudness Analysis ==="
VOLUME_FILE="${OUTPUT_DIR}/volume.txt"
ffmpeg -i "$AUDIO_FILE" \
    -af "volumedetect,ebur128=peak=true" \
    -f null - 2>&1 | grep -E "(mean_volume|max_volume|I:|LRA:|Peak:)" > "$VOLUME_FILE" || true

if [[ -s "$VOLUME_FILE" ]]; then
    tail -n 10 "$VOLUME_FILE"
fi

# Transcription with whisper-cli (whisper.cpp) or openai-whisper
echo ""
echo "=== Transcription ==="

LOCAL_GGML_1="${WHISPER_MODEL:-}"
LOCAL_GGML_2="${REPO_ROOT}/assets/models/whisper/ggml-large-v3-turbo-q5_0.bin"
LOCAL_GGML_3="${HOME}/.local/share/dsc-academy/models/ggml-large-v3-turbo-q5_0.bin"

GGML_MODEL=""
for candidate in "$LOCAL_GGML_1" "$LOCAL_GGML_2" "$LOCAL_GGML_3"; do
    if [[ -n "$candidate" && -f "$candidate" ]]; then
        GGML_MODEL="$candidate"
        break
    fi
done

TRANSCRIPT_ENGINE="none"

if command -v whisper-cli &>/dev/null && [[ -n "$GGML_MODEL" ]]; then
    echo "Using whisper-cli (whisper.cpp) with model: $GGML_MODEL"
    TRANSCRIPT_ENGINE="whisper-cli"
    whisper-cli \
        -m "$GGML_MODEL" \
        -t "${WHISPER_THREADS:-4}" \
        -l "$LANGUAGE" \
        -f "$AUDIO_FILE" \
        -ojf -otxt -osrt \
        -of "${OUTPUT_DIR}/audio_raw" \
        -np 2>&1

    # Normalize whisper-cli JSON output to standard segments + words format
    python3 - "${OUTPUT_DIR}/audio_raw.json" "${OUTPUT_DIR}/audio.json" "${OUTPUT_DIR}/audio.txt" "${OUTPUT_DIR}/audio_raw.srt" "${OUTPUT_DIR}/audio.srt" <<'PYNORM'
import sys, os, json, shutil

raw_json, out_json, out_txt, raw_srt, out_srt = sys.argv[1:]
if os.path.isfile(raw_srt):
    shutil.copyfile(raw_srt, out_srt)

# whisper-cli splits multi-byte characters (Vietnamese diacritics) across tokens, so the raw JSON is not
# valid UTF-8 token by token. Keep the stray bytes as surrogates, join the tokens, then decode the joined word.
with open(raw_json, "r", encoding="utf-8", errors="surrogateescape") as f:
    j = json.load(f)

def fix(s):
    return s.encode("utf-8", "surrogateescape").decode("utf-8", "replace")

segments = []
words = []
full_text_parts = []

for idx, seg in enumerate(j.get("transcription", [])):
    s_start = seg.get("offsets", {}).get("from", 0) / 1000.0
    s_end = seg.get("offsets", {}).get("to", 0) / 1000.0
    s_text = (seg.get("text") or "").strip()
    if s_text:
        segments.append({
            "id": idx,
            "start": round(s_start, 2),
            "end": round(s_end, 2),
            "text": s_text,
        })
        full_text_parts.append(s_text)
    for t in seg.get("tokens", []):
        piece = t.get("text", "")
        if piece.startswith("[_"):
            continue
        t_start = t.get("offsets", {}).get("from", 0) / 1000.0
        t_end = t.get("offsets", {}).get("to", 0) / 1000.0
        clean = piece.strip()
        if not clean:
            continue
        if piece.startswith(" ") or not words:
            words.append({"word": clean, "start": round(t_start, 2), "end": round(t_end, 2)})
        else:
            words[-1]["word"] += clean
            words[-1]["end"] = round(t_end, 2)

for w in words:
    w["word"] = fix(w["word"])
for seg in segments:
    seg["text"] = fix(seg["text"])
full_text = " ".join(seg["text"] for seg in segments)
with open(out_txt, "w", encoding="utf-8") as f:
    f.write(full_text + "\n")

normalized = {
    "engine": "whisper-cli",
    "language": j.get("result", {}).get("language", "auto"),
    "text": full_text,
    "segments": segments,
    "words": words,
}
with open(out_json, "w", encoding="utf-8") as f:
    json.dump(normalized, f, indent=2, ensure_ascii=False)
PYNORM
    echo "Transcription complete via whisper-cli."
elif command -v whisper &>/dev/null; then
    echo "Using openai-whisper CLI with model: $MODEL"
    TRANSCRIPT_ENGINE="openai-whisper"
    whisper "$AUDIO_FILE" \
        --model "$MODEL" \
        --output_dir "$OUTPUT_DIR" \
        --output_format all \
        --verbose False \
        2>&1
    echo "Transcription complete via openai-whisper."
else
    echo "WARNING: Neither whisper-cli (with ggml model) nor whisper CLI found."
    echo "Install whisper-cpp: brew install whisper-cpp"
    echo "Or install openai-whisper: pip install openai-whisper"
    echo "Skipping transcription."
fi

# Compute speaking rate and write audio_metadata.json
python3 - "$INPUT" "$AUDIO_FILE" "$MODEL" "$TRANSCRIPT_ENGINE" "$SILENCE_FILE" "$VOLUME_FILE" "${OUTPUT_DIR}/audio.json" "${OUTPUT_DIR}/audio_metadata.json" <<'PYAUDIOMETA'
import sys, os, json, re

(
    input_path, audio_file, model, engine,
    silence_file, volume_file, audio_json, out_meta
) = sys.argv[1:]

word_count = 0
speech_duration = 0.0
segments_count = 0

if os.path.isfile(audio_json):
    try:
        with open(audio_json, "r", encoding="utf-8") as f:
            d = json.load(f)
        segs = d.get("segments", [])
        segments_count = len(segs)
        text = d.get("text") or " ".join(s.get("text", "") for s in segs)
        tokens = [w for w in re.split(r"\s+", text.strip()) if w]
        word_count = len(tokens)
        if segs:
            speech_duration = max(0.1, float(segs[-1].get("end", 0)) - float(segs[0].get("start", 0)))
    except Exception:
        pass

syllables_per_sec = round(word_count / speech_duration, 2) if speech_duration > 0 else 0.0
words_per_min = round((word_count / speech_duration) * 60.0, 1) if speech_duration > 0 else 0.0

silence_count = 0
if os.path.isfile(silence_file):
    with open(silence_file, "r") as f:
        silence_count = sum(1 for line in f if "silence_start" in line)

meta = {
    "source": os.path.basename(input_path),
    "audio_file": audio_file,
    "transcription_engine": engine,
    "whisper_model": model,
    "segments_count": segments_count,
    "word_or_syllable_count": word_count,
    "speech_span_seconds": round(speech_duration, 2),
    "syllables_per_second": syllables_per_sec,
    "words_per_minute": words_per_min,
    "silence_intervals_count": silence_count,
    "silence_file": silence_file,
    "volume_file": volume_file,
    "sample_rate": 16000,
    "channels": 1,
}

with open(out_meta, "w", encoding="utf-8") as f:
    json.dump(meta, f, indent=2, ensure_ascii=False)
PYAUDIOMETA

echo ""
echo "=== Done ==="
echo "Audio:         $AUDIO_FILE"
echo "Transcription: ${OUTPUT_DIR}/audio.json"
echo "Silence:       $SILENCE_FILE"
echo "Volume:        $VOLUME_FILE"
echo "Meta:          ${OUTPUT_DIR}/audio_metadata.json"

