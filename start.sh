#!/bin/bash
set -e

echo "Starting BigSpice..."

# Start Flask backend in background
echo "[1/2] Starting Flask backend on port 5000..."
python app.py &
FLASK_PID=$!

# Start Next.js frontend
echo "[2/2] Starting Next.js frontend on port 3000..."
cd nextjs-frontend

if [ ! -d "node_modules" ]; then
  echo "Installing npm dependencies..."
  npm install
fi

npm run dev &
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
