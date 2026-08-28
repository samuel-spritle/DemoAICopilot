#!/usr/bin/env bash
# Boot the demo — one FastAPI app serves the UI and the Gemini Live socket on :8000.
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f backend/.env ]; then
  echo "! backend/.env missing. Run: cp backend/.env.example backend/.env  and add GEMINI_API_KEY"
  exit 1
fi

# --- build the frontend (FastAPI serves the static bundle) ---
[ -d frontend/node_modules ] || ( cd frontend && npm install )
echo "▸ building frontend…"
( cd frontend && npm run build >/dev/null )

# --- backend deps ---
[ -d backend/.venv ] || python3 -m venv backend/.venv
./backend/.venv/bin/pip install -q -r backend/requirements.txt

# --- serve ---
echo "▸ live copilot: http://localhost:8000"
exec ./backend/.venv/bin/uvicorn main:app --app-dir backend --port 8000

