import os
import logging
import aiohttp
import json
import asyncio
from typing import Optional, Dict, Any
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_exponential

# Force reload environment variables
load_dotenv(override=True)

logger = logging.getLogger(__name__)

class DeepgramService:
    def __init__(self, api_key: Optional[str] = None):
        # Force reload environment variables
        load_dotenv(override=True)
        
        self.api_key = api_key or os.getenv('DEEPGRAM_API_KEY')
        if not self.api_key:
            raise ValueError("Deepgram API key not found")
        
        # Remove any whitespace from the API key
        self.api_key = self.api_key.strip()
        
        # Log API key format (first few characters only)
        logger.info(f"Using Deepgram API key starting with: {self.api_key[:5]}...")
        
        # Set up API endpoints
        self.base_url = "https://api.deepgram.com/v1"
        self.listen_url = f"{self.base_url}/listen"
        self.projects_url = f"{self.base_url}/projects"
        
        self.session: Optional[aiohttp.ClientSession] = None
        self.max_retries = int(os.getenv('DEEPGRAM_MAX_RETRIES', 3))
        self.timeout = int(os.getenv('DEEPGRAM_TIMEOUT', 30))
        logger.info("DeepgramService initialized")

    async def _ensure_session(self):
        """Ensure the aiohttp session is initialized with proper headers and SSL handling."""
        if self.session is None or self.session.closed:
            try:
                # Create a connector with SSL verification
                connector = aiohttp.TCPConnector(
                    ssl=True,
                    force_close=True,
                    enable_cleanup_closed=True
                )
                
                # Create session with proper headers and timeout
                timeout = aiohttp.ClientTimeout(total=self.timeout)
                self.session = aiohttp.ClientSession(
                    connector=connector,
                    timeout=timeout,
                    headers={
                        "Authorization": f"Token {self.api_key}",
                        "Content-Type": "application/json"
                    }
                )
                logger.info("Deepgram session initialized")
            except Exception as e:
                logger.error(f"Failed to initialize Deepgram session: {str(e)}")
                if self.session and not self.session.closed:
                    await self.session.close()
                self.session = None
                raise

    async def close(self):
        """Close the session if it exists."""
        if self.session and not self.session.closed:
            await self.session.close()
            self.session = None
            logger.info("Deepgram session closed")

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        reraise=True
    )
    async def transcribe_audio(self, audio_data: bytes) -> Optional[str]:
        """
        Transcribe audio data using Deepgram's REST API with retry logic.
        
        Args:
            audio_data: Raw audio data in bytes
            
        Returns:
            Transcribed text or None if transcription failed
        """
        if not audio_data:
            logger.error("No audio data provided")
            return None

        # Validate audio data size
        max_size = 25 * 1024 * 1024  # 25MB limit
        if len(audio_data) > max_size:
            logger.error(f"Audio data too large: {len(audio_data)} bytes")
            return None

        try:
            await self._ensure_session()
            
            # Update session headers for audio content
            self.session.headers.update({
                "Content-Type": "audio/wav"
            })
            
            params = {
                "smart_format": "true",
                "model": "nova-3",
                "language": "en-US",
                "punctuate": "true",
                "encoding": "linear16",
                "sample_rate": "16000",
                "channels": "1"
            }
            
            logger.info(f"Sending request to Deepgram API")
            
            async with self.session.post(
                self.listen_url,
                params=params,
                data=audio_data
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    logger.info(f"Deepgram API response: {result}")
                    
                    if 'results' in result:
                        transcript = result['results']['channels'][0]['alternatives'][0]['transcript']
                        confidence = result['results']['channels'][0]['alternatives'][0]['confidence']
                        logger.info(f"Successfully transcribed audio with confidence {confidence:.2f}")
                        return transcript
                    else:
                        logger.error("No transcript in Deepgram response")
                        return None
                else:
                    error_text = await response.text()
                    logger.error(f"Deepgram API error: {error_text}")
                    
                    # Handle specific error cases
                    if response.status == 401:
                        raise ValueError("Invalid Deepgram API key")
                    elif response.status == 429:
                        raise ValueError("Rate limit exceeded")
                    elif response.status >= 500:
                        raise ValueError("Deepgram server error")
                    else:
                        raise ValueError(f"Deepgram API error: {error_text}")

        except aiohttp.ClientError as e:
            logger.error(f"Network error during Deepgram transcription: {str(e)}")
            raise
        except asyncio.TimeoutError:
            logger.error("Timeout during Deepgram transcription")
            raise
        except Exception as e:
            logger.error(f"Error transcribing audio with Deepgram: {str(e)}")
            raise

    async def validate_api_key(self) -> bool:
        """
        Validate the Deepgram API key by making a simple request.
        
        Returns:
            bool: True if API key is valid, False otherwise
        """
        try:
            # Create a new session for validation
            connector = aiohttp.TCPConnector(ssl=True)
            timeout = aiohttp.ClientTimeout(total=self.timeout)
            headers = {
                "Authorization": f"Token {self.api_key}",
                "Content-Type": "application/json"
            }
            
            async with aiohttp.ClientSession(
                connector=connector,
                timeout=timeout,
                headers=headers
            ) as session:
                # Ensure URL is properly formatted
                url = self.projects_url
                if not url.startswith(('http://', 'https://')):
                    url = f"https://{url}"
                
                logger.info(f"Validating API key with URL: {url}")
                
                async with session.get(url) as response:
                    if response.status == 200:
                        logger.info("Deepgram API key validated successfully")
                        return True
                    else:
                        error_text = await response.text()
                        logger.error(f"Deepgram API key validation failed: {error_text}")
                        return False
                    
        except aiohttp.ClientError as e:
            logger.error(f"Network error during API key validation: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"API key validation failed: {str(e)}")
            return False