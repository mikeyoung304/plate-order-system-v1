#!/bin/bash

# Script to stop the current server and restart it without mock mode

echo "Stopping current server..."

# Find the process ID of the current server
SERVER_PID=$(ps aux | grep "python run.py" | grep -v grep | awk '{print $2}')

if [ -n "$SERVER_PID" ]; then
    echo "Stopping server process $SERVER_PID..."
    kill $SERVER_PID
    sleep 2
    
    # Check if the process is still running
    if ps -p $SERVER_PID > /dev/null; then
        echo "Process still running, force killing..."
        kill -9 $SERVER_PID
        sleep 1
    fi
    
    echo "Server stopped."
else
    echo "No running server found."
fi

# Start the server with OpenAI Whisper API
echo "Starting server with OpenAI Whisper API..."

# Check if python-dotenv is installed
pip install python-dotenv

# Make sure the .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found. Please create a .env file with your OPENAI_API_KEY."
    exit 1
fi

# Check if OPENAI_API_KEY is set in .env
if ! grep -q "OPENAI_API_KEY" .env; then
    echo "Error: OPENAI_API_KEY not found in .env file."
    exit 1
fi

# Run the server
echo "Starting server on port 8001..."
PORT=8001 python run.py