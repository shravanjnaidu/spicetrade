#!/usr/bin/env bash
# =============================================================================
# start.sh — BigSpice dev startup script
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# ── Activate Python virtualenv if present ─────────────────────────────────────
if   [ -f "ENV/bin/activate" ];     then source ENV/bin/activate
elif [ -f "ENV/Scripts/activate" ]; then source ENV/Scripts/activate 2>/dev/null || true
fi
PYTHON=$(command -v python3 || command -v python)

# ── npm install — only when node_modules is missing or outdated ───────────────
cd nextjs-frontend
if [ ! -f "node_modules/.bin/next" ] || \
   { [ -f "package-lock.json" ] && [ "package-lock.json" -nt "node_modules/.bin/next" ]; }; then
  echo "[setup] Installing npm dependencies..."
  npm install --no-audit --no-fund
fi
cd ..

# ── Flask backend ─────────────────────────────────────────────────────────────
echo "[1/2] Starting Flask dev server on :5000..."
PORT=5000 $PYTHON app.py &
FLASK_PID=$!

# ── Wait for Flask ────────────────────────────────────────────────────────────
echo "      Waiting for Flask..."
for i in $(seq 1 30); do
  if curl -sf http://127.0.0.1:5000/api/health &>/dev/null; then
    echo "      Flask ready. ✓"
    break
  fi
  if ! kill -0 $FLASK_PID 2>/dev/null; then
    echo "ERROR: Flask crashed on startup."
    exit 1
  fi
  sleep 1
done

# ── Next.js dev server ────────────────────────────────────────────────────────
echo "[2/2] Starting Next.js dev server on :3000..."
cd nextjs-frontend
npm run dev &
NEXT_PID=$!
cd ..

echo ""
echo "  Frontend → http://localhost:3000"
echo "  Backend  → http://localhost:5000"
echo ""
echo "  Press Ctrl+C to stop."
echo ""

trap "echo; echo 'Stopping...'; kill \$FLASK_PID \$NEXT_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
