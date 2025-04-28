import os
import sys
import subprocess
from dotenv import load_dotenv

# Load environment variables from .env file
env_file_path = os.path.join('backend', '.env')
if os.path.exists(env_file_path):
    print(f"Loading environment variables from {env_file_path}")
    load_dotenv(env_file_path)
    
    # Debug: print important environment variables
    print(f"DEEPGRAM_API_KEY set: {bool(os.environ.get('DEEPGRAM_API_KEY'))}")
    print(f"CORS_ORIGINS: {os.environ.get('CORS_ORIGINS')}")
    print(f"PORT: {os.environ.get('PORT')}")
else:
    print(f"Warning: {env_file_path} not found")

# Change to backend directory
os.chdir('backend')

# Run the backend server
cmd = [
    sys.executable, 
    "-m", 
    "uvicorn", 
    "main:app", 
    "--host", 
    "0.0.0.0", 
    "--port", 
    "8000",
    "--reload"
]

print(f"Starting server with command: {' '.join(cmd)}")
subprocess.run(cmd) 