import asyncio
import os
from dotenv import load_dotenv
from deepgram import Deepgram
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables (specifically DEEPGRAM_API_KEY)
load_dotenv()

API_KEY = os.getenv("DEEPGRAM_API_KEY")
# Use a known audio file in the project directory
PATH_TO_FILE = 'test_recording.wav' # Assuming this file exists

async def test_transcription():
    if not API_KEY or API_KEY == "DEMO_KEY":
        logger.error("Valid DEEPGRAM_API_KEY not found in .env file.")
        return

    if not os.path.exists(PATH_TO_FILE):
         logger.error(f"Test audio file not found: {PATH_TO_FILE}")
         # Attempt call structure test without actual audio if file missing
         config = { "api_key": API_KEY }
         dg_client = Deepgram(config)
         try:
             # Test if the attribute path exists, even if we can't call it without data
             _ = dg_client.transcription.prerecorded.transcribe
             logger.info("SDK v2 structure test: dg_client.transcription.prerecorded.transcribe exists.")
             # You could add more attribute checks here based on previous errors
         except AttributeError as e:
             logger.error(f"SDK v2 structure test failed: {e}")
         return

    # Initialize Deepgram client (v2 style)
    config = { "api_key": API_KEY }
    dg_client = Deepgram(config)
    logger.info("Deepgram client initialized (v2 style).")

    try:
        logger.info(f"Attempting to transcribe file: {PATH_TO_FILE}")
        with open(PATH_TO_FILE, 'rb') as audio:
            source = {'buffer': audio.read(), 'mimetype': 'audio/wav'}
            options = { "model": "nova-2", "smart_format": True }

            # The problematic call using the v2 structure we last tried
            logger.info("Calling: await dg_client.transcription.prerecorded.transcribe(source, options)")
            response = await dg_client.transcription.prerecorded.transcribe(source, options)

            # Check and print the response if successful
            if response and response.get('results'):
                 transcript = response['results']['channels'][0]['alternatives'][0]['transcript']
                 logger.info(f"SUCCESS! Transcription: {transcript}")
            else:
                 logger.warning(f"Transcription completed but response format unexpected or empty: {response}")

    except AttributeError as e:
        logger.error(f"AttributeError during transcription call: {e}")
        logger.error("This indicates the call structure is likely incorrect for SDK v2.12.0.")
    except Exception as e:
        logger.error(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    asyncio.run(test_transcription())