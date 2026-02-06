#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://press.manusy.com}"
API_BASE="${BASE_URL%/}/api/v1"
TOKEN="${CLAWPRESS_TOKEN:-${1:-}}"
MEMORY_DIR="${MEMORY_DIR:-$(cd "$(dirname "$0")/.." && pwd)/memory}"
STATE_FILE="$MEMORY_DIR/heartbeat-state.json"
LOG_FILE="$MEMORY_DIR/engagement-log.jsonl"
IDEAS_FILE="$MEMORY_DIR/content-ideas.md"
CADENCE_MINUTES="${CADENCE_MINUTES:-30}"
DRY_RUN="${DRY_RUN:-1}"

now_iso() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

json_escape() {
  python3 - <<'PY'
import json,sys
print(json.dumps(sys.stdin.read()))
PY
}

init_memory() {
  mkdir -p "$MEMORY_DIR"

  if [[ ! -f "$STATE_FILE" ]]; then
    cat > "$STATE_FILE" <<'JSON'
{
  "last_check_at": null,
  "last_post_at": null,
  "last_comment_at": null,
  "daily_comment_count": 0,
  "daily_post_count": 0,
  "last_reset_date": null
}
JSON
  fi

  if [[ ! -f "$LOG_FILE" ]]; then
    echo '{"time":"1970-01-01T00:00:00Z","action":"init","target":"system","result":"ready","reason":"memory initialized"}' > "$LOG_FILE"
  fi

  if [[ ! -f "$IDEAS_FILE" ]]; then
    cat > "$IDEAS_FILE" <<'MD'
# Content Ideas

## Backlog

- [ ] Share one practical lesson from a recent API debugging session.
MD
  fi
}

should_run_cycle() {
  python3 - "$STATE_FILE" "$CADENCE_MINUTES" <<'PY'
import json, sys
from datetime import datetime, timezone

state_path = sys.argv[1]
cadence = int(sys.argv[2])
with open(state_path, 'r', encoding='utf-8') as f:
    s = json.load(f)
last = s.get('last_check_at')
if not last:
    print('1')
    sys.exit(0)
try:
    dt = datetime.strptime(last, '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc)
except ValueError:
    print('1')
    sys.exit(0)
now = datetime.now(timezone.utc)
minutes = (now - dt).total_seconds() / 60
print('1' if minutes >= cadence else '0')
PY
}

append_log() {
  local timestamp="$1"
  local action="$2"
  local target="$3"
  local result="$4"
  local reason="$5"

  python3 - "$LOG_FILE" "$timestamp" "$action" "$target" "$result" "$reason" <<'PY'
import json, sys
path,t,a,target,result,reason = sys.argv[1:7]
line = {
  'time': t,
  'action': a,
  'target': target,
  'result': result,
  'reason': reason,
}
with open(path, 'a', encoding='utf-8') as f:
    f.write(json.dumps(line, ensure_ascii=False) + '\n')
PY
}

update_state() {
  local timestamp="$1"
  local action="$2"
  local result="$3"

  python3 - "$STATE_FILE" "$timestamp" "$action" "$result" <<'PY'
import json, sys
from datetime import datetime, timezone

path, ts, action, result = sys.argv[1:5]
with open(path, 'r', encoding='utf-8') as f:
    s = json.load(f)

s['last_check_at'] = ts

today = datetime.now(timezone.utc).date().isoformat()
if s.get('last_reset_date') != today:
    s['daily_comment_count'] = 0
    s['daily_post_count'] = 0
    s['last_reset_date'] = today

if result == 'success':
    if action == 'create_post':
        s['last_post_at'] = ts
        s['daily_post_count'] = int(s.get('daily_post_count', 0)) + 1
    elif action == 'comment':
        s['last_comment_at'] = ts
        s['daily_comment_count'] = int(s.get('daily_comment_count', 0)) + 1

with open(path, 'w', encoding='utf-8') as f:
    json.dump(s, f, ensure_ascii=False, indent=2)
PY
}

request_json() {
  local method="$1"
  local url="$2"
  local data="${3:-}"
  local out_file
  out_file="$(mktemp)"

  if [[ -n "$data" ]]; then
    local code
    code=$(curl -sS -o "$out_file" -w '%{http_code}' -X "$method" "$url" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      --data "$data")
    printf '%s|%s\n' "$code" "$out_file"
  else
    local code
    code=$(curl -sS -o "$out_file" -w '%{http_code}' -X "$method" "$url" \
      -H "Authorization: Bearer $TOKEN")
    printf '%s|%s\n' "$code" "$out_file"
  fi
}

decide_action() {
  local me_file="$1"
  local posts_file="$2"

  python3 - "$me_file" "$posts_file" <<'PY'
import json, sys
me_path, posts_path = sys.argv[1:3]
with open(me_path, 'r', encoding='utf-8') as f:
    me = json.load(f)
with open(posts_path, 'r', encoding='utf-8') as f:
    posts = json.load(f)

me_id = (me.get('agent') or {}).get('id')
items = posts.get('posts') or []

for p in items:
    pid = p.get('id')
    author_id = p.get('agent_id')
    if pid and author_id and author_id != me_id:
        print('upvote|' + pid + '|relevant external post found')
        sys.exit(0)

print('skip|none|no suitable target in current feed')
PY
}

run() {
  init_memory

  if [[ -z "$TOKEN" ]]; then
    echo "missing CLAWPRESS_TOKEN (or first arg token)" >&2
    exit 2
  fi

  if [[ "$(should_run_cycle)" != "1" ]]; then
    ts="$(now_iso)"
    append_log "$ts" "skip" "system" "throttled" "cadence guard not reached"
    update_state "$ts" "skip" "throttled"
    echo "cycle_time=$ts"
    echo "decision=skip"
    echo "target=none"
    echo "reason=cadence guard not reached"
    echo "result=throttled"
    exit 0
  fi

  me_resp="$(request_json GET "$API_BASE/agents/me")"
  me_code="${me_resp%%|*}"
  me_file="${me_resp#*|}"
  if [[ "$me_code" != "200" ]]; then
    ts="$(now_iso)"
    append_log "$ts" "auth_check" "agents/me" "error_$me_code" "unable to verify token"
    update_state "$ts" "auth_check" "error"
    echo "cycle_time=$ts"
    echo "decision=skip"
    echo "target=none"
    echo "reason=auth check failed"
    echo "result=error_$me_code"
    exit 1
  fi

  posts_resp="$(request_json GET "$API_BASE/posts?page=1&per_page=20")"
  posts_code="${posts_resp%%|*}"
  posts_file="${posts_resp#*|}"
  if [[ "$posts_code" != "200" ]]; then
    ts="$(now_iso)"
    append_log "$ts" "fetch_feed" "posts" "error_$posts_code" "unable to fetch feed"
    update_state "$ts" "fetch_feed" "error"
    echo "cycle_time=$ts"
    echo "decision=skip"
    echo "target=none"
    echo "reason=feed fetch failed"
    echo "result=error_$posts_code"
    exit 1
  fi

  decision_line="$(decide_action "$me_file" "$posts_file")"
  action="${decision_line%%|*}"
  rest="${decision_line#*|}"
  target="${rest%%|*}"
  reason="${rest#*|}"

  ts="$(now_iso)"
  result="success"

  if [[ "$action" == "upvote" && "$target" != "none" ]]; then
    if [[ "$DRY_RUN" == "1" ]]; then
      result="dry_run"
    else
      vote_resp="$(request_json POST "$API_BASE/posts/$target/upvote")"
      vote_code="${vote_resp%%|*}"
      if [[ "$vote_code" != "200" ]]; then
        result="error_$vote_code"
      fi
    fi
  else
    action="skip"
    target="none"
    if [[ "$DRY_RUN" == "1" ]]; then
      result="dry_run"
    fi
  fi

  append_log "$ts" "$action" "$target" "$result" "$reason"
  update_state "$ts" "$action" "$result"

  echo "cycle_time=$ts"
  echo "decision=$action"
  echo "target=$target"
  echo "reason=$reason"
  echo "result=$result"
}

run "$@"
