#!/bin/bash
# Kill any existing server processes
pkill -f "python run.py" || true
# Start the server in the background with a different port
export PORT=8001
nohup python run.py > server.log 2>&1 &
echo "Server started in background on port 8001. Check server.log for output."
