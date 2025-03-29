# Voice Order Functionality

This document provides instructions on how to ensure the voice-to-order functionality works properly before deploying to GitHub and Render.

## Prerequisites

1. A Deepgram API key
2. The `.env` file with your Deepgram API key

## Testing the Voice Order Functionality

### 1. Run the server with Deepgram API

To run the server with the Deepgram API, use the provided script:

```bash
./run_server_with_whisper.sh
```

Before running the script:
- Verify that the .env file exists and contains the DEEPGRAM_API_KEY
- Make sure you have the required dependencies installed

### 2. Test the Deepgram API integration

To test if your Deepgram API key is valid and if the local API endpoint is working, use the provided script:

```bash
python test_deepgram.py
```

This script will:
- Test if your Deepgram API key is valid
- Check if you have access to the Whisper API
- Test the local API endpoint for transcription

### 3. Fix any issues with environment variables

If you encounter issues with environment variables not being loaded properly, use the provided script:

```bash
./fix_voice_order.sh
```

This script will:
- Ensure the .env file is loaded properly
- Create a temporary run script that explicitly loads the .env file
- Run the server with proper error handling for missing API keys

## Deploying to Render

To prepare your application for deployment to Render, use the provided script:

```bash
./render_deploy.sh
```

This script will:
- Make sure the .env file is not included in the repository
- Create a render.yaml file if it doesn't exist
- Update the requirements.txt file to include python-dotenv
- Create a README.md with deployment instructions
- Update run.py to load environment variables

After running this script, follow the instructions in RENDER_DEPLOYMENT.md to deploy to Render.

## Troubleshooting

### Voice recording doesn't work

1. Make sure your browser has permission to access the microphone
2. Check the browser console for any errors
3. Verify that your Deepgram API key is valid and has access to the Whisper API

### Server returns 500 error

1. Check the server logs for any errors
2. Verify that your Deepgram API key is valid and has access to the Whisper API
3. Make sure the .env file is being loaded properly

### Environment variables not being loaded

1. Run the fix_voice_order.sh script
2. Check if python-dotenv is installed
3. Verify that the .env file exists and contains the DEEPGRAM_API_KEY