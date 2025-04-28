#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "Stopping Plate Order System development services..."

# Function to kill process by PID file
kill_by_pid_file() {
  local pid_file="$1"
  local process_name="$2"
  
  if [ -f "$pid_file" ]; then
    local pid=$(cat "$pid_file")
    if ps -p "$pid" > /dev/null; then
      echo "Stopping $process_name (PID: $pid)..."
      kill "$pid" 2>/dev/null || kill -9 "$pid" 2>/dev/null
      echo "$process_name stopped."
    else
      echo "$process_name (PID: $pid) is not running."
    fi
    rm "$pid_file"
  else
    echo "No $process_name PID file found."
  fi
}

# Stop backend
kill_by_pid_file "$SCRIPT_DIR/.backend_pid" "Backend"

# Stop frontend
kill_by_pid_file "$SCRIPT_DIR/.frontend_pid" "Frontend"

echo "All development services stopped."
