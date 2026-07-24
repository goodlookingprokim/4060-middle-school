#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SITE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PUBLIC_DIR="${1:-$SITE_ROOT/public}"
PREFERRED_PORT="${2:-4176}"
MAX_PORT="${3:-4225}"
CACHE_DIR="$SITE_ROOT/.quartz-cache"
PID_FILE="$CACHE_DIR/preview-server.pid"
PORT_FILE="$CACHE_DIR/preview-server.port"

if [[ ! -d "$PUBLIC_DIR" ]]; then
  echo "Preview root not found: $PUBLIC_DIR" >&2
  exit 1
fi

mkdir -p "$CACHE_DIR"

is_listening() {
  local port="$1"
  lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
}

first_free_port() {
  local port
  for ((port=PREFERRED_PORT; port<=MAX_PORT; port++)); do
    if ! is_listening "$port"; then
      echo "$port"
      return 0
    fi
  done
  return 1
}

if is_listening "$PREFERRED_PORT"; then
  if curl -fsI "http://127.0.0.1:${PREFERRED_PORT}/index.html" >/dev/null 2>&1; then
    echo "Preview already running: http://127.0.0.1:${PREFERRED_PORT}/index.html"
    exit 0
  fi
fi

if [[ -f "$PID_FILE" && -f "$PORT_FILE" ]]; then
  TRACKED_PID="$(cat "$PID_FILE" 2>/dev/null || true)"
  TRACKED_PORT="$(cat "$PORT_FILE" 2>/dev/null || true)"
  if [[ -n "$TRACKED_PID" && -n "$TRACKED_PORT" ]] && kill -0 "$TRACKED_PID" >/dev/null 2>&1; then
    echo "Preview already running: http://127.0.0.1:${TRACKED_PORT}/index.html"
    exit 0
  fi
  rm -f "$PID_FILE" "$PORT_FILE"
fi

PORT="$(first_free_port)" || {
  echo "No free preview port found between ${PREFERRED_PORT} and ${MAX_PORT}" >&2
  exit 1
}

echo "Starting preview server: http://127.0.0.1:${PORT}/index.html"
cd "$PUBLIC_DIR"

cleanup() {
  rm -f "$PID_FILE" "$PORT_FILE"
  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

python3 -m http.server "$PORT" &
SERVER_PID=$!
printf '%s\n' "$SERVER_PID" >"$PID_FILE"
printf '%s\n' "$PORT" >"$PORT_FILE"
wait "$SERVER_PID"
