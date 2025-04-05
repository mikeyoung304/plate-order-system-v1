#!/bin/bash

echo "⚡️ One-click application starter"

# Kill existing processes
echo "🔪 Killing existing processes..."
pkill -f "python main.py" 2>/dev/null
for port in 3000 3001 10000; do
  pid=$(lsof -ti:$port 2>/dev/null)
  if [ -n "$pid" ]; then
    echo "  Killing process on port $port (PID: $pid)"
    kill -9 $pid 2>/dev/null
  fi
done

# Set the right Python path
export PYTHONPATH=$(pwd)
export DATABASE_URL="sqlite:///./restaurant.db"
export NODE_OPTIONS="--max-old-space-size=8192"
echo "🔧 Environment set"

# Fix the database (simplest approach)
echo "💾 Fixing database..."
# python fix_db.py # Temporarily disabled as initialize_database.py seems more reliable

# Start the backend
echo "🚀 Starting backend..."
python main.py &
BACKEND_PID=$!
echo $BACKEND_PID > .backend_pid

# Simple wait for backend to start
echo "⏳ Waiting for backend..."
sleep 3
# echo "🍽️ Creating today's specials..." # Removed daily special creation
# python create_daily_special.py # Removed daily special creation

# Start the frontend
echo "🚀 Starting frontend..."
cd frontend

# Use development or production mode
if [ "$1" == "--dev" ]; then
  # Start React dev server on port 3001
  PORT=3001 npm start &
else
  # Serve production build
  if [ ! -d "build" ]; then
    echo "🔨 Building frontend..."
    npm run build
  fi
  
  # Use npx serve on port 3001
  npx serve -l 3001 build &
fi

FRONTEND_PID=$!
cd ..
echo $FRONTEND_PID > .frontend_pid

echo "✅ All services started!"
echo "- Backend: http://localhost:10000"
echo "- Frontend: http://localhost:3001"
echo "Press Ctrl+C to exit"

# Open browser if possible
if command -v open >/dev/null 2>&1; then
  sleep 1
  open http://localhost:3001
fi

# Clean up on exit
# trap 'kill $(cat .backend_pid) $(cat .frontend_pid) 2>/dev/null; rm -f .backend_pid .frontend_pid' EXIT # Commented out due to syntax error

# Wait for user to exit
wait
