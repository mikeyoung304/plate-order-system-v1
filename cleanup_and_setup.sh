#!/bin/bash

# Script to clean up duplicate structure and set up Deepgram API key
echo "Starting cleanup and setup process..."

# 1. Clean up duplicate structure
echo "Cleaning up duplicate structure..."
if [ -d "plate-order-system" ]; then
    # Check if there are any files in the nested directory that don't exist in the parent
    echo "Checking for unique files in the nested directory..."
    for file in plate-order-system/app/*; do
        if [ -e "$file" ]; then
            basename=$(basename "$file")
            if [ ! -e "app/$basename" ]; then
                echo "Found unique file: $file"
                # Copy unique files to the parent structure
                cp -r "$file" "app/"
            fi
        fi
    done

    # Now it's safe to remove the duplicate directory
    echo "Removing duplicate directory..."
    rm -rf plate-order-system/
    echo "Duplicate directory removed."
else
    echo "No duplicate directory found. Skipping cleanup."
fi

# 2. Set up Deepgram API key
echo "Setting up Deepgram API key..."
echo "Please enter your Deepgram API key:"
read api_key

if [ -z "$api_key" ]; then
    echo "No API key provided. Skipping API key setup."
else
    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        touch .env
    fi

    # Check if DEEPGRAM_API_KEY already exists in .env
    if grep -q "DEEPGRAM_API_KEY" .env; then
        # Update existing key
        sed -i '' "s/DEEPGRAM_API_KEY=.*/DEEPGRAM_API_KEY=$api_key/" .env
    else
        # Add new key
        echo "DEEPGRAM_API_KEY=$api_key" >> .env
    fi
    echo "API key added to .env file."

    # Update run_server.sh to include the API key
    if [ -f "run_server.sh" ]; then
        if ! grep -q "DEEPGRAM_API_KEY" run_server.sh; then
            # Add export statement
            sed -i.bak '/^export/a\
export DEEPGRAM_API_KEY=$DEEPGRAM_API_KEY\\
' run_server.sh
            echo "API key setup added to run_server.sh."
        else
            echo "run_server.sh already contains API key setup."
        fi
    else
        # Create run_server.sh
        cat > run_server.sh << EOF
#!/bin/bash
# Kill any existing server processes
pkill -f "python run.py" || true
# Set environment variables
export PORT=8001
export DEEPGRAM_API_KEY=$api_key
# Start the server in the background
nohup python run.py > server.log 2>&1 &
echo "Server started in background on port 8001. Check server.log for output."
EOF
        chmod +x run_server.sh
        echo "Created run_server.sh with API key."
    fi
fi

# 3. Create a test script for the Deepgram API
echo "Creating Deepgram API test script..."
cat > test_deepgram.py << 'EOF'
import os
import deepgram

# Print the API key (first few characters only for security)
api_key = os.environ.get("DEEPGRAM_API_KEY", "")
if api_key:
    print(f"API key found: {api_key[:5]}...")
else:
    print("API key not found!")

# Test a simple API call
try:
    dg = deepgram.Deepgram(api_key)
    response = dg.transcribe(audio_file)
    print("API test successful!")
    print(f"Response: {response}")
except Exception as e:
    print(f"API test failed: {str(e)}")
EOF

echo "Setup complete!"
echo "You can now run the following commands:"
echo "1. ./run_server.sh - to start the server with the API key"
echo "2. python test_deepgram.py - to test the Deepgram API key"