import os
import requests
import json
from dotenv import load_dotenv
import sys

# Load environment variables from .env file
load_dotenv()

# Get API key from environment variables
api_key = os.environ.get('DEEPGRAM_API_KEY')

def test_deepgram_api_key():
    """Test if the Deepgram API key is valid"""
    if not api_key:
        print("❌ DEEPGRAM_API_KEY not found in environment variables")
        return False
    
    try:
        # Test the API key with a simple request
        headers = {
            'Authorization': f'Token {api_key}',
            'Content-Type': 'application/json'
        }
        response = requests.get('https://api.deepgram.com/v1/projects', headers=headers)
        
        if response.status_code == 200:
            print("✅ Deepgram API key is valid")
            return True
        else:
            print(f"❌ Error testing Deepgram API key: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing Deepgram API key: {str(e)}")
        return False

def test_local_api_endpoint():
    """Test if the local API endpoint for transcription is working"""
    try:
        # Check if the server is running
        response = requests.get("http://localhost:8001/health")
        if response.status_code == 200:
            print("✅ Local server is running")
        else:
            print(f"❌ Local server returned status code {response.status_code}")
            return False
        
        # Create a test audio file
        with open("test_audio.txt", "w") as f:
            f.write("This is a test audio file")
        
        # Test the transcription endpoint
        files = {'audio': ('test_audio.txt', open('test_audio.txt', 'rb'), 'audio/wav')}
        response = requests.post("http://localhost:8001/api/speech/transcribe", files=files)
        
        # Clean up
        os.remove("test_audio.txt")
        
        if response.status_code == 200:
            print("✅ Transcription endpoint is working")
            print(f"Response: {response.json()}")
            return True
        else:
            print(f"❌ Transcription endpoint returned status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing local API endpoint: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("Testing Deepgram API integration...")
    print("-" * 50)
    
    # Test Deepgram API key
    api_key_valid = test_deepgram_api_key()
    if not api_key_valid:
        print("\n❌ Deepgram API key test failed. Please check your .env file.")
        sys.exit(1)
    
    # Test local API endpoint
    try:
        local_api_valid = test_local_api_endpoint()
        if not local_api_valid:
            print("\n❌ Local API endpoint test failed. Please check your server.")
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error testing local API endpoint: {str(e)}")
        print("Make sure your server is running.")
        sys.exit(1)
    
    print("\n✅ All tests passed! Your voice-to-order function should work properly.")
    print("You can now push your code to GitHub and deploy to Render.")

if __name__ == "__main__":
    main() 