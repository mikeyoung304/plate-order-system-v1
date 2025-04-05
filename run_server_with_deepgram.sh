#!/bin/bash

# Script to run the server with the Deepgram API

echo "Starting server with Deepgram API..."

# Check if python-dotenv is installed
pip install python-dotenv

# Make sure the .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found. Please create a .env file with your DEEPGRAM_API_KEY."
    exit 1
fi

# Check if DEEPGRAM_API_KEY is set in .env
if ! grep -q "DEEPGRAM_API_KEY" .env; then
    echo "Error: DEEPGRAM_API_KEY not found in .env file."
    exit 1
fi

# Run the server
echo "Starting server on port 10000..."
PORT=10000 python run.py