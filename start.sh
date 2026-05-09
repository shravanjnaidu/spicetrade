#!/bin/bash

echo "Starting BigSpice..."

# ── Node.js version check ──────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js is not installed. Next.js 14 requires Node.js 18+."
  echo "  Install: curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs"
  exit 1
fi

NODE_MAJOR=$(node --version | sed 's/v\([0-9]*\).*/\1/')
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "ERROR: Node.js 18+ required, found $(node --version). Next.js 14 will not run."
  echo "  Update: https://nodejs.org"
  exit 1
fi

# ── Flask backend (Gunicorn on Linux only, dev server fallback) ───────────────
PYTHON=$(command -v python3 || command -v python)
if [[ "$(uname -s)" == "Linux" ]] && command -v gunicorn &>/dev/null; then
  echo "[1/2] Starting Flask backend via Gunicorn on port 5000..."
  PORT=5000 gunicorn -c gunicorn.conf.py app:app &
else
  echo "[1/2] Starting Flask backend (dev) on port 5000..."
  PORT=5000 $PYTHON app.py &
fi
FLASK_PID=$!

# ── Wait for Flask to be ready before starting Next.js ───────────────────────
echo "Waiting for Flask to be ready..."
for i in $(seq 1 30); do
  if curl -sf http://127.0.0.1:5000/api/health &>/dev/null || \
     curl -sf http://127.0.0.1:5000/ &>/dev/null; then
    echo "Flask is ready."
    break
  fi
  if ! kill -0 $FLASK_PID 2>/dev/null; then
    echo "ERROR: Flask process died. Check logs above."
    exit 1
  fi
  sleep 1
done

# ── Next.js frontend ───────────────────────────────────────────────────────────
echo "[2/2] Starting Next.js frontend on port 3000..."
cd nextjs-frontend

if [ ! -f "node_modules/.bin/next" ]; then
  echo "Installing npm dependencies..."
  npm install
  if [ $? -ne 0 ]; then
    echo "ERROR: npm install failed. Killing Flask and exiting."
    kill $FLASK_PID 2>/dev/null
    exit 1
  fi
fi

# Build for production if no existing build, or if NODE_ENV=production
if [ "$NODE_ENV" = "production" ] || [ ! -d ".next" ]; then
  echo "Building Next.js..."
  npm run build
  if [ $? -ne 0 ]; then
    echo "ERROR: Next.js build failed. Killing Flask and exiting."
    kill $FLASK_PID 2>/dev/null
    exit 1
  fi
fi

if [ "$NODE_ENV" = "production" ]; then
  npm start &
else
  npm run dev &
fi
NEXT_PID=$!

echo ""
echo "App running:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop both servers."

# Wait and handle Ctrl+C
trap "echo 'Stopping...'; kill $FLASK_PID $NEXT_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
