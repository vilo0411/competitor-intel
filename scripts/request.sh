#!/usr/bin/env bash
# Local helper (bash + git only — no Node, yt-dlp or TikTok access needed on this machine).
# Queues work for GitHub Actions by pushing to the repo, waits for the bot commit, then pulls the results.
#
#   scripts/request.sh run "<Tên đối thủ>" @kenh1 @kenh2 [--refresh] [--style N] [--limit N]
#   scripts/request.sh run gorillanomics --refresh      # re-run a saved competitor
#   scripts/request.sh push "<commit message>"          # push agent files (labels/style/insights) and wait for the rebuild
#   scripts/request.sh wait                             # wait for the next bot commit and pull
#   scripts/request.sh status                           # show the latest runs
set -euo pipefail
cd "$(dirname "$0")/.."

REPO_URL="$(git remote get-url origin | sed -E 's#\.git$##; s#^git@github.com:#https://github.com/#')"
TIMEOUT="${WAIT_TIMEOUT:-1800}"

wait_bot() {
  local base="$1" waited=0 head
  echo "Đang chờ GitHub Actions… (xem tiến độ: $REPO_URL/actions)"
  while [ "$waited" -lt "$TIMEOUT" ]; do
    sleep 15; waited=$((waited + 15))
    head="$(git ls-remote origin refs/heads/main | cut -f1)"
    if [ -n "$head" ] && [ "$head" != "$base" ]; then
      git pull -q --rebase origin main
      echo "Xong sau ${waited}s."
      return 0
    fi
  done
  echo "Hết thời gian chờ (${TIMEOUT}s). Workflow có thể vẫn đang chạy hoặc đã lỗi: $REPO_URL/actions" >&2
  return 1
}

push_and_wait() {
  git pull -q --rebase origin main
  git push -q origin HEAD:main
  wait_bot "$(git rev-parse HEAD)"
}

json_str() { printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'; }

cmd="${1:-}"; shift || true
case "$cmd" in
  run)
    name=""; channels=(); refresh=false; style=5; limit=300
    while [ $# -gt 0 ]; do
      case "$1" in
        --refresh) refresh=true ;;
        --style) style="$2"; shift ;;
        --limit) limit="$2"; shift ;;
        @*|*tiktok.com*) channels+=("$1") ;;
        *) name="${name:+$name }$1" ;;
      esac
      shift
    done
    [ -n "$name" ] || [ ${#channels[@]} -gt 0 ] || { echo 'Cần tên đối thủ hoặc ít nhất một @kenh' >&2; exit 2; }
    id="$(date -u +%Y%m%d-%H%M%S)-$(printf '%s' "${name:-${channels[0]}}" | tr -cs 'A-Za-z0-9' '-' | tr 'A-Z' 'a-z' | sed 's/^-//; s/-$//')"
    ch_json=""
    for c in ${channels[@]+"${channels[@]}"}; do ch_json="${ch_json:+$ch_json, }\"$(json_str "$c")\""; done
    mkdir -p requests
    printf '{\n  "id": "%s",\n  "name": "%s",\n  "channels": [%s],\n  "refresh": %s,\n  "style": %s,\n  "limit": %s\n}\n' \
      "$id" "$(json_str "$name")" "$ch_json" "$refresh" "$style" "$limit" > "requests/$id.json"
    git add "requests/$id.json"
    git commit -q -m "request: ${name:-${channels[0]}}"
    push_and_wait
    if [ -f "docs/_runs/$id.json" ]; then
      echo "--- Kết quả ($id) ---"
      grep -E '"(status|slug|report|seconds)"' "docs/_runs/$id.json"
      grep -q '"status": "ok"' "docs/_runs/$id.json" || { echo "Log:"; sed -n '/"log"/,$p' "docs/_runs/$id.json"; exit 1; }
    else
      echo "Chưa thấy docs/_runs/$id.json — workflow có thể đang chạy tiếp. Chạy: scripts/request.sh wait" >&2
      exit 1
    fi
    ;;
  push)
    git add -A docs
    git diff --cached --quiet && { echo "Không có thay đổi để push"; exit 0; }
    git commit -q -m "${1:-agent: update labels/style/insights}"
    push_and_wait
    ;;
  wait)
    wait_bot "$(git rev-parse HEAD)"
    ;;
  status)
    git pull -q --rebase origin main
    for f in $(ls -r docs/_runs/*.json 2>/dev/null | head -10); do
      printf '%s  ' "$(basename "$f" .json)"; grep -oE '"status": "[a-z]+"' "$f"
    done
    ;;
  *)
    sed -n '2,10p' "$0"; exit 2 ;;
esac
