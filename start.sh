#!/usr/bin/env bash
# =============================================================================
# start.sh — BigSpice unified startup script
#
# Handles dependency install and builds automatically — only when something
# has actually changed. Safe to run on every restart.
#
# Production (Linux, NODE_ENV=production):  Gunicorn + npm start
# Development (Windows / local):            Flask dev server + npm run dev
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# ── Detect OS and mode ────────────────────────────────────────────────────────
OS="$(uname -s 2>/dev/null || echo Windows)"
MODE="${NODE_ENV:-dev}"
[ "$MODE" != "production" ] && MODE="dev"

# ── Activate Python virtualenv if present ─────────────────────────────────────
if   [ -f "ENV/bin/activate" ];     then source ENV/bin/activate
elif [ -f "ENV/Scripts/activate" ]; then source ENV/Scripts/activate 2>/dev/null || true
fi
PYTHON=$(command -v python3 || command -v python)

# ── Node.js version check ─────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js not found. Install Node.js 18+ from https://nodejs.org"
  if [ "$OS" = "Linux" ]; then
    echo "  Run: curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs"
  fi
  exit 1
fi
NODE_MAJOR=$(node -e 'process.stdout.write(process.versions.node.split(".")[0])')
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "ERROR: Node.js 18+ required, found $(node --version). Update at https://nodejs.org"
  exit 1
fi

echo "=== BigSpice | mode=$MODE | os=$OS | node=$(node --version) ==="

# ── npm install — only when dependencies are missing or package-lock changed ──
cd nextjs-frontend
if [ ! -f "node_modules/.bin/next" ] || \
   { [ -f "package-lock.json" ] && [ "package-lock.json" -nt "node_modules/.bin/next" ]; }; then
  echo ""
  echo "[setup] Installing npm dependencies..."
  if [ -f "package-lock.json" ]; then
    npm ci --no-audit --no-fund
  else
    npm install --no-audit --no-fund
  fi
  echo "[setup] npm install done."
fi

# ── npm build — only in production, only when code has changed since last build
if [ "$MODE" = "production" ]; then
  CURRENT_COMMIT="$(git -C .. rev-parse HEAD 2>/dev/null || echo unknown)"
  BUILD_COMMIT_FILE=".next/BUILD_COMMIT"
  LAST_COMMIT="$(cat "$BUILD_COMMIT_FILE" 2>/dev/null || echo '')"

  if [ ! -d ".next" ] || [ "$LAST_COMMIT" != "$CURRENT_COMMIT" ]; then
    echo ""
    echo "[setup] Building Next.js for production (commit: ${CURRENT_COMMIT:0:8})..."
    npm run build
    echo "$CURRENT_COMMIT" > "$BUILD_COMMIT_FILE"
    echo "[setup] Build complete."
  else
    echo "[setup] Next.js build is up to date — skipping build."
  fi
fi
cd ..

# ── Flask backend ─────────────────────────────────────────────────────────────
echo ""
if [ "$OS" = "Linux" ] && command -v gunicorn &>/dev/null; then
  echo "[1/2] Starting Flask via Gunicorn on :5000..."
  PORT=5000 gunicorn -c gunicorn.conf.py app:app &
else
  echo "[1/2] Starting Flask dev server on :5000..."
  PORT=5000 $PYTHON app.py &
fi
FLASK_PID=$!

# ── Wait for Flask to accept requests ────────────────────────────────────────
echo "      Waiting for Flask..."
FLASK_READY=false
for i in $(seq 1 30); do
  if curl -sf http://127.0.0.1:5000/api/health &>/dev/null; then
    FLASK_READY=true
    echo "      Flask ready. ✓"
    break
  fi
  if ! kill -0 $FLASK_PID 2>/dev/null; then
    echo ""
    echo "ERROR: Flask crashed on startup. Check output above."
    exit 1
  fi
  sleep 1
done
if [ "$FLASK_READY" = false ]; then
  echo "ERROR: Flask did not become ready within 30 seconds."
  kill $FLASK_PID 2>/dev/null
  exit 1
fi

# ── Next.js frontend ──────────────────────────────────────────────────────────
cd nextjs-frontend
if [ "$MODE" = "production" ]; then
  echo "[2/2] Starting Next.js (production) on :3000..."
  npm start &
else
  echo "[2/2] Starting Next.js (dev) on :3000..."
  npm run dev &
fi
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
