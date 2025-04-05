import os
import logging
import aiohttp
import asyncio
from typing import Optional
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_exponential

# Force reload environment variables
load_dotenv(override=True)

logger = logging.getLogger(__name__)


class DeepgramService:
    def __init__(self, api_key: Optional[str] = None):
        # Force reload environment variables
        load_dotenv(override=True)

        self.api_key = api_key or os.getenv("DEEPGRAM_API_KEY")
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
        self.max_retries = int(os.getenv("DEEPGRAM_MAX_RETRIES", 3))
        self.timeout = int(os.getenv("DEEPGRAM_TIMEOUT", 30))
        logger.info("DeepgramService initialized")

    async def _ensure_session(self):
        """Ensure the aiohttp session is initialized with proper headers and SSL handling."""
        if self.session is None or self.session.closed:
            try:
                # Create a connector with SSL verification
                connector = aiohttp.TCPConnector(
                    ssl=True, force_close=True, enable_cleanup_closed=True
                )

                # Create session with proper headers and timeout
                timeout = aiohttp.ClientTimeout(total=self.timeout)
                self.session = aiohttp.ClientSession(
                    connector=connector,
                    timeout=timeout,
                    headers={
                        "Authorization": f"Token {self.api_key}",
                        "Content-Type": "application/json",
                    },
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
        reraise=True,
    )
    async def transcribe_audio(self, audio_data: bytes) -> str:
        """
        Transcribe audio data using Deepgram's REST API with retry logic.

        Args:
            audio_data: Raw audio data in bytes

        Returns:
            Transcribed text string

        Raises:
            ValueError: If audio data is invalid or transcription fails
            HTTPException: For API errors with appropriate status codes
        """
        if not audio_data:
            logger.error("No audio data provided")
            raise ValueError("No audio data provided for transcription")

        # Validate audio data size
        max_size = 25 * 1024 * 1024  # 25MB limit
        if len(audio_data) > max_size:
            logger.error(f"Audio data too large: {len(audio_data)} bytes")
            raise ValueError(f"Audio data exceeds maximum size of {max_size} bytes")

        try:
            await self._ensure_session()

            # Determine content type based on audio data inspection
            # WebM usually starts with bytes [26, 69, 223, 163]
            # WAV usually starts with "RIFF"
            content_type = "audio/webm"
            if audio_data[:4] == b"RIFF":
                content_type = "audio/wav"

            logger.info(f"Detected audio content type: {content_type}")

            # Update session headers for audio content
            self.session.headers.update({"Content-Type": content_type})

            params = {
                "smart_format": "true",
                "smart_format": "true",
                "model": "nova-3",
                "language": "en-US",
                "punctuate": "true",
                "endpointing": "true",  # Add endpointing
                "utterance_end_ms": "1000", # Add utterance end detection (ms)
                # Only set these for WAV files
                **(
                    {"encoding": "linear16", "sample_rate": "16000", "channels": "1"}
                    if content_type == "audio/wav"
                    else {}
                ),
            }

            logger.info(f"Sending request to Deepgram API with params: {params}")

            async with self.session.post(
                self.listen_url, params=params, data=audio_data
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    logger.info(f"Deepgram API response received, status 200")

                    if (
                        "results" in result
                        and result["results"].get("channels")
                        and len(result["results"]["channels"]) > 0
                    ):
                        transcript = result["results"]["channels"][0]["alternatives"][
                            0
                        ]["transcript"]
                        confidence = result["results"]["channels"][0]["alternatives"][
                            0
                        ]["confidence"]
                        logger.info(
                            f"Successfully transcribed audio with confidence {confidence:.2f}"
                        )

                        # Return the transcript text directly
                        return transcript
                    else:
                        logger.error(f"No transcript in Deepgram response: {result}")
                        raise ValueError("No transcript found in Deepgram response")
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
            raise ValueError(f"Network error: {str(e)}")
        except asyncio.TimeoutError:
            logger.error("Timeout during Deepgram transcription")
            raise ValueError("Timeout during transcription request")
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
                "Content-Type": "application/json",
            }

            async with aiohttp.ClientSession(
                connector=connector, timeout=timeout, headers=headers
            ) as session:
                # Ensure URL is properly formatted
                url = self.projects_url
                if not url.startswith(("http://", "https://")):
                    url = f"https://{url}"

                logger.info(f"Validating API key with URL: {url}")

                async with session.get(url) as response:
                    if response.status == 200:
                        logger.info("Deepgram API key validated successfully")
                        return True
                    else:
                        error_text = await response.text()
                        logger.error(
                            f"Deepgram API key validation failed: {error_text}"
                        )
                        return False

        except aiohttp.ClientError as e:
            logger.error(f"Network error during API key validation: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"API key validation failed: {str(e)}")
            return False
