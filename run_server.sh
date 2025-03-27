#!/bin/bash
# Kill any existing server processes
pkill -f "python run.py" || true
# Set environment variables
export PORT=8001
export OPENAI_API_KEY=$(grep OPENAI_API_KEY .env | cut -d= -f2)
# Start the server in the background
nohup python run.py > server.log 2>&1 &
echo "Server started in background on port 8001. Check server.log for output."
