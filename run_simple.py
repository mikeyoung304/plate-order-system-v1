import os
import sys
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Check if OpenAI API key is set
api_key = os.environ.get('OPENAI_API_KEY')
if not api_key:
    print("Error: OPENAI_API_KEY not set in environment variables")
    print("Please set it in the .env file")
    sys.exit(1)

print(f"OpenAI API Key: {api_key[:5]}...{api_key[-5:]}")
print("Starting server on port 8001...")

# Run the server
os.system("PORT=8001 python run.py")