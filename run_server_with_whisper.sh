#!/bin/bash

# Script to run the server with the OpenAI Whisper API

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