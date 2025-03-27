import os
from openai import OpenAI

# Get API key from environment
api_key = os.environ.get("OPENAI_API_KEY", "")

if api_key:
    print(f"API key found: {api_key[:5]}...")
else:
    print("API key not found!")
    exit(1)

# Initialize OpenAI client
client = OpenAI(api_key=api_key)

# Test a simple API call
try:
    response = client.completions.create(
        model="gpt-3.5-turbo-instruct",
        prompt="Hello, world!",
        max_tokens=5
    )
    print("API test successful!")
    print(f"Response: {response.choices[0].text}")
except Exception as e:
    print(f"API test failed: {str(e)}")
