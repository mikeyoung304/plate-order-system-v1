"""
Test suite for voice recognition functionality in the Plate Order System.

This module contains comprehensive tests for the voice recognition components,
focusing on iOS compatibility, error handling, and context awareness.
"""

import unittest
import os
import sys
import json
from unittest.mock import MagicMock, patch

# Add application to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.domain.services.deepgram_service import DeepgramService
from app.domain.services.speech_service import SpeechService
from app.api.v1.endpoints.speech import process_audio


class TestVoiceRecognition(unittest.TestCase):
    """Test cases for voice recognition functionality."""

    def setUp(self):
        """Set up test environment before each test."""
        # Mock configuration
        self.config = {
            'DEEPGRAM_API_KEY': 'test_api_key',
            'USE_MOCK_RECOGNITION': True,
            'RECOGNITION_CONFIDENCE_THRESHOLD': 0.75
        }
        
        # Sample audio data (base64 encoded WAV snippet)
        self.sample_audio = "UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="
        
        # Mock successful recognition response
        self.mock_success_response = {
            'results': {
                'channels': [
                    {
                        'alternatives': [
                            {
                                'transcript': 'two chicken salads one with no dressing and a glass of water with no ice',
                                'confidence': 0.92
                            }
                        ]
                    }
                ]
            }
        }
        
        # Mock low confidence response
        self.mock_low_confidence_response = {
            'results': {
                'channels': [
                    {
                        'alternatives': [
                            {
                                'transcript': 'chicken salad water',
                                'confidence': 0.65
                            }
                        ]
                    }
                ]
            }
        }
        
        # Mock error response
        self.mock_error_response = {
            'error': 'Invalid audio format'
        }

    @patch('app.domain.services.deepgram_service.httpx.AsyncClient.post')
    async def test_deepgram_service_success(self, mock_post):
        """Test successful transcription with Deepgram service."""
        # Configure mock
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = self.mock_success_response
        mock_post.return_value = mock_response
        
        # Initialize service
        service = DeepgramService(api_key=self.config['DEEPGRAM_API_KEY'])
        
        # Test transcription
        result = await service.transcribe(self.sample_audio)
        
        # Verify results
        self.assertTrue(result['success'])
        self.assertEqual(
            result['transcription'], 
            'two chicken salads one with no dressing and a glass of water with no ice'
        )
        self.assertGreaterEqual(result['confidence'], self.config['RECOGNITION_CONFIDENCE_THRESHOLD'])
        
        # Verify API was called correctly
        mock_post.assert_called_once()
        call_args = mock_post.call_args
        self.assertIn('https://api.deepgram.com/v1/listen', call_args[0][0])
        self.assertIn('headers', call_args[1])
        self.assertIn('json', call_args[1])

    @patch('app.domain.services.deepgram_service.httpx.AsyncClient.post')
    async def test_deepgram_service_low_confidence(self, mock_post):
        """Test low confidence transcription with Deepgram service."""
        # Configure mock
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = self.mock_low_confidence_response
        mock_post.return_value = mock_response
        
        # Initialize service
        service = DeepgramService(api_key=self.config['DEEPGRAM_API_KEY'])
        
        # Test transcription
        result = await service.transcribe(self.sample_audio)
        
        # Verify results
        self.assertTrue(result['success'])
        self.assertEqual(result['transcription'], 'chicken salad water')
        self.assertLess(result['confidence'], self.config['RECOGNITION_CONFIDENCE_THRESHOLD'])
        self.assertTrue(result['low_confidence'])

    @patch('app.domain.services.deepgram_service.httpx.AsyncClient.post')
    async def test_deepgram_service_error_handling(self, mock_post):
        """Test error handling in Deepgram service."""
        # Configure mock to raise exception
        mock_post.side_effect = Exception("API connection error")
        
        # Initialize service
        service = DeepgramService(api_key=self.config['DEEPGRAM_API_KEY'])
        
        # Test transcription with error
        result = await service.transcribe(self.sample_audio)
        
        # Verify results
        self.assertFalse(result['success'])
        self.assertIn('error', result)
        self.assertEqual(result['transcription'], '')

    @patch('app.domain.services.speech_service.DeepgramService')
    async def test_speech_service_with_context(self, mock_deepgram_service):
        """Test speech service with context awareness."""
        # Configure mock
        mock_service = MagicMock()
        mock_service.transcribe.return_value = {
            'success': True,
            'transcription': 'two chicken salads one with no dressing and a glass of water with no ice',
            'confidence': 0.92
        }
        mock_deepgram_service.return_value = mock_service
        
        # Initialize service
        speech_service = SpeechService(config=self.config)
        
        # Context data
        context = {
            'table_id': 5,
            'residents': [
                {
                    'id': 101,
                    'name': 'John Smith',
                    'dietary_restrictions': ['no salt', 'low sugar']
                }
            ],
            'previous_orders': ['chicken salad', 'vegetable soup']
        }
        
        # Test transcription with context
        result = await speech_service.process_speech(self.sample_audio, context)
        
        # Verify results
        self.assertTrue(result['success'])
        self.assertEqual(
            result['transcription'], 
            'two chicken salads one with no dressing and a glass of water with no ice'
        )
        self.assertIn('dietary_warnings', result)
        
        # Verify context was used
        mock_service.transcribe.assert_called_once_with(self.sample_audio)

    @patch('app.api.v1.endpoints.speech.SpeechService')
    async def test_speech_api_endpoint(self, mock_speech_service):
        """Test the speech API endpoint."""
        # Configure mock
        mock_service = MagicMock()
        mock_service.process_speech.return_value = {
            'success': True,
            'transcription': 'two chicken salads one with no dressing and a glass of water with no ice',
            'confidence': 0.92,
            'dietary_warnings': []
        }
        mock_speech_service.return_value = mock_service
        
        # Test request data
        request_data = {
            'audio': self.sample_audio,
            'context': {
                'table_id': 5,
                'residents': [
                    {
                        'id': 101,
                        'name': 'John Smith',
                        'dietary_restrictions': ['no salt', 'low sugar']
                    }
                ]
            }
        }
        
        # Process request
        response = await process_audio(request_data)
        
        # Verify results
        self.assertTrue(response['success'])
        self.assertEqual(
            response['transcription'], 
            'two chicken salads one with no dressing and a glass of water with no ice'
        )
        self.assertIn('dietary_warnings', response)
        
        # Verify service was called correctly
        mock_service.process_speech.assert_called_once_with(
            self.sample_audio, 
            request_data['context']
        )

    @patch('app.domain.services.speech_service.DeepgramService')
    async def test_ios_audio_format_compatibility(self, mock_deepgram_service):
        """Test compatibility with iOS audio formats."""
        # Configure mock
        mock_service = MagicMock()
        mock_service.transcribe.return_value = {
            'success': True,
            'transcription': 'two chicken salads one with no dressing and a glass of water with no ice',
            'confidence': 0.92
        }
        mock_deepgram_service.return_value = mock_service
        
        # Initialize service
        speech_service = SpeechService(config=self.config)
        
        # iOS-specific audio data (m4a format converted to base64)
        ios_audio = "AAAAHGZ0eXBtcDQyAAAAAG1wNDJtcDQxaXNvbWlzbwAAAAA="
        
        # Test transcription with iOS audio
        result = await speech_service.process_speech(ios_audio, {})
        
        # Verify results
        self.assertTrue(result['success'])
        
        # Verify service handled iOS format
        mock_service.transcribe.assert_called_once_with(ios_audio)

    @patch('app.domain.services.speech_service.DeepgramService')
    async def test_noise_reduction(self, mock_deepgram_service):
        """Test noise reduction capabilities."""
        # Configure mock
        mock_service = MagicMock()
        mock_service.transcribe.return_value = {
            'success': True,
            'transcription': 'two chicken salads one with no dressing and a glass of water with no ice',
            'confidence': 0.92
        }
        mock_deepgram_service.return_value = mock_service
        
        # Initialize service with noise reduction
        config = self.config.copy()
        config['ENABLE_NOISE_REDUCTION'] = True
        speech_service = SpeechService(config=config)
        
        # Test transcription with noisy audio
        noisy_audio = self.sample_audio  # In a real test, this would be actual noisy audio
        result = await speech_service.process_speech(noisy_audio, {})
        
        # Verify results
        self.assertTrue(result['success'])
        
        # Verify noise reduction parameters were passed
        call_kwargs = mock_service.transcribe.call_args[1]
        self.assertTrue(
            'noise_reduction' in str(call_kwargs) or 
            'noise' in str(call_kwargs)
        )

    @patch('app.domain.services.speech_service.DeepgramService')
    async def test_fallback_mechanism(self, mock_deepgram_service):
        """Test fallback mechanism when primary service fails."""
        # Configure primary service to fail
        mock_primary = MagicMock()
        mock_primary.transcribe.return_value = {
            'success': False,
            'error': 'Service unavailable',
            'transcription': '',
            'confidence': 0
        }
        mock_deepgram_service.return_value = mock_primary
        
        # Initialize service with fallback
        config = self.config.copy()
        config['ENABLE_FALLBACK_RECOGNITION'] = True
        speech_service = SpeechService(config=config)
        
        # Mock the fallback method
        speech_service._local_fallback_recognition = MagicMock()
        speech_service._local_fallback_recognition.return_value = {
            'success': True,
            'transcription': 'chicken salad water',
            'confidence': 0.7,
            'fallback_used': True
        }
        
        # Test transcription with failing primary service
        result = await speech_service.process_speech(self.sample_audio, {})
        
        # Verify results
        self.assertTrue(result['success'])
        self.assertEqual(result['transcription'], 'chicken salad water')
        self.assertTrue(result['fallback_used'])
        
        # Verify fallback was called
        speech_service._local_fallback_recognition.assert_called_once()


if __name__ == '__main__':
    unittest.main()
