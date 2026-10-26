#!/usr/bin/env bash
# PM2 entry point for the recognition sidecar (see README "PM2 (prod)"):
#   pm2 start python-service/start.sh --name crossyarn-import --interpreter bash
# PM2 doesn't read .env, so pull the values shared with Next from the project's
# .env — only these keys, rather than sourcing the whole file as shell.
set -euo pipefail
cd "$(dirname "$0")"

envval() {
  grep -E "^$1=" ../.env 2>/dev/null | tail -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' || true
}

export INTERNAL_API_KEY="$(envval INTERNAL_API_KEY)"
export IMPORT_UPLOAD_DIR="$(envval IMPORT_UPLOAD_DIR)"
export NEXT_CALLBACK_URL="${NEXT_CALLBACK_URL:-http://127.0.0.1:3000}"

if [ -z "$INTERNAL_API_KEY" ] || [ -z "$IMPORT_UPLOAD_DIR" ]; then
  echo "start.sh: INTERNAL_API_KEY and IMPORT_UPLOAD_DIR must be set in ../.env" >&2
  exit 1
fi

exec .venv/bin/uvicorn app:app --host 127.0.0.1 --port 8001
