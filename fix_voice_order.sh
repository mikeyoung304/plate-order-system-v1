#!/bin/bash

# Make sure the .env file is loaded properly
echo "Ensuring .env file is loaded properly..."

# Check if python-dotenv is installed
pip install python-dotenv

# Create a temporary run script that explicitly loads the .env file
cat > temp_run.py << 'EOF'
import uvicorn
import os
import logging
from dotenv import load_dotenv
import sys

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    # Get port from environment variable or use default
    port = int(os.environ.get("PORT", 8000))
    
    # Get environment
    env = os.environ.get("ENVIRONMENT", "development")
    
    # Log startup info
    logger.info(f"Starting server on port {port} in {env} mode")
    
    # Check if Deepgram API key is set
    api_key = os.environ.get('DEEPGRAM_API_KEY')
    if not api_key:
        logger.error("DEEPGRAM_API_KEY not set in environment variables")
        logger.error("Voice transcription will not work without a Deepgram API key")
        sys.exit(1)
    else:
        logger.info("DEEPGRAM_API_KEY is set in environment variables")
        logger.info("Using Deepgram API for voice transcription")
    
    # Set reload based on environment
    reload = env == "development"
    
    # Run the app
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=reload,
        log_level="info"
    )
EOF

# Make the script executable
chmod +x temp_run.py

# Run the server
echo "Starting server with Deepgram API..."
python temp_run.py