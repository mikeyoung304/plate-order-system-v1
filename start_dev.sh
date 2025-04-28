#!/usr/bin/env bash
set -e

## Resolve script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "Starting Plate Order System in $SCRIPT_DIR"

# Copy the root .env (or example) into backend/.env each run
if [ -f "$SCRIPT_DIR/.env" ]; then
  echo "Copying root .env to backend/.env"
  cp "$SCRIPT_DIR/.env" "$SCRIPT_DIR/backend/.env"
elif [ -f "$SCRIPT_DIR/.env.example" ]; then
  echo "Copying .env.example to backend/.env"
  cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/backend/.env"
else
  echo "Warning: no .env or .env.example at project root. backend/.env unchanged."
fi
# Load environment variables from backend/.env
echo "Loading environment variables from backend/.env"
while IFS='=' read -r key value || [[ -n "$key" ]]; do
  if [[ ! -z "$key" && ! "$key" =~ ^# ]]; then
    export "$key=$value"
  fi
done < "$SCRIPT_DIR/backend/.env"
echo "Loaded env vars (partial): DATABASE_URL=$DATABASE_URL, OPENAI_API_KEY=${OPENAI_API_KEY:0:5}..."
echo "Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"
echo "Supabase Anon Key: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:0:10}..."

# Check database connectivity and fallback to local SQLite if remote DB unreachable
if [[ "$DATABASE_URL" == postgresql* ]]; then
  {
    # Extract host and port from DATABASE_URL
    TMP="${DATABASE_URL#*@}"
    HOST_PORT="${TMP%%/*}"
    HOST="${HOST_PORT%%:*}"
    PORT="${HOST_PORT#*:}"
    # Test TCP connectivity
    if ! (echo > /dev/tcp/${HOST}/${PORT}) 2>/dev/null; then
      echo "Warning: Cannot reach remote database at ${HOST}:${PORT}."
      echo "Falling back to local SQLite."  
      export DATABASE_URL="sqlite:///${SCRIPT_DIR}/backend/app.db"
    fi
  } 2>/dev/null || {
    echo "Error parsing database URL. Using SQLite as fallback."
    export DATABASE_URL="sqlite:///${SCRIPT_DIR}/backend/app.db"
  }
fi

# Fixed Backend & Frontend ports
BACKEND_PORT=8000
FRONTEND_PORT=3000
# Export backend PORT for FastAPI
export PORT="$BACKEND_PORT"
# Ensure ports are free by killing any existing listeners
echo "Freeing ports $BACKEND_PORT and $FRONTEND_PORT..."
lsof -tiTCP:$BACKEND_PORT -sTCP:LISTEN | xargs -r kill -9 || true
lsof -tiTCP:$FRONTEND_PORT -sTCP:LISTEN | xargs -r kill -9 || true

# Create and seed the database
cd "$SCRIPT_DIR/backend"
echo "Using DATABASE_URL: $DATABASE_URL"
echo "Initializing database schema..."
python init_db_standalone.py

echo "Seeding default data..."
python seed_default_data.py

echo "Starting backend on port $BACKEND_PORT..."
# Use main.py instead of main_fixed.py
python main.py &
BACKEND_PID=$!
echo $BACKEND_PID > "$SCRIPT_DIR/.backend_pid"

# Wait a moment for the backend to fully start
sleep 2

echo "Starting frontend on port $FRONTEND_PORT..."
# Prepare frontend environment
FRONTEND_DIR="$SCRIPT_DIR/frontend"
# Create or update .env.local for Next.js (include API URL, WS URL, and Supabase keys)
echo "Generating $FRONTEND_DIR/.env.local for frontend"
# Write directly with known values
cat > "$FRONTEND_DIR/.env.local" <<EOF
NEXT_PUBLIC_API_URL=http://localhost:$BACKEND_PORT
NEXT_PUBLIC_WS_URL=ws://localhost:$BACKEND_PORT/ws/listen
NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL:-}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}
EOF
echo "Written $FRONTEND_DIR/.env.local with API_URL, WS_URL, and Supabase config"
cd "$FRONTEND_DIR"
# Install dependencies if needed
npm install
# Launch Next.js dev on specified port and env
NEXT_PUBLIC_API_URL="http://localhost:$BACKEND_PORT" npm run dev -- -p "$FRONTEND_PORT" &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$SCRIPT_DIR/.frontend_pid"

echo "============================================"
echo "PLATE ORDER SYSTEM DEVELOPMENT ENVIRONMENT"
echo "============================================"
echo "Backend URL: http://localhost:$BACKEND_PORT"
echo "Backend API Docs: http://localhost:$BACKEND_PORT/api/v1/docs"
echo "Frontend URL: http://localhost:$FRONTEND_PORT"
echo "============================================"
echo "Both services started. Access the application at http://localhost:$FRONTEND_PORT"

# If on macOS, open Chrome with auto mic-permission flag
if command -v open >/dev/null 2>&1 && open -a "Google Chrome" --help >/dev/null 2>&1; then
  echo "Opening Google Chrome with auto-grant mic permission..."
  open -a "Google Chrome" --args --use-fake-ui-for-media-stream "http://localhost:$FRONTEND_PORT"
fi

echo "Press Ctrl+C to stop all services"
wait
