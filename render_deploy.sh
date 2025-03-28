#!/bin/bash

# Script to prepare the application for deployment to Render

echo "Preparing for deployment to Render..."

# 1. Make sure the .env file is not included in the repository
if [ -f .gitignore ]; then
    if ! grep -q "^\.env$" .gitignore; then
        echo ".env" >> .gitignore
        echo "Added .env to .gitignore"
    else
        echo ".env already in .gitignore"
    fi
else
    echo ".env" > .gitignore
    echo "Created .gitignore with .env"
fi

# 2. Create a render.yaml file if it doesn't exist
if [ ! -f render.yaml ]; then
    cat > render.yaml << 'EOF'
services:
  - type: web
    name: plate-order-system
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: python run.py
    envVars:
      - key: OPENAI_API_KEY
        sync: false
      - key: ADMIN_USERNAME
        sync: false
      - key: ADMIN_PASSWORD
        sync: false
      - key: PORT
        value: 8000
      - key: ENVIRONMENT
        value: production
EOF
    echo "Created render.yaml configuration file"
else
    echo "render.yaml already exists"
fi

# 3. Update the requirements.txt file to include python-dotenv
if [ -f requirements.txt ]; then
    if ! grep -q "^python-dotenv" requirements.txt; then
        echo "python-dotenv" >> requirements.txt
        echo "Added python-dotenv to requirements.txt"
    else
        echo "python-dotenv already in requirements.txt"
    fi
else
    echo "python-dotenv" > requirements.txt
    echo "Created requirements.txt with python-dotenv"
fi

# 4. Create a README.md with deployment instructions
cat > RENDER_DEPLOYMENT.md << 'EOF'
# Deploying to Render

## Prerequisites
1. Create a Render account at https://render.com
2. Connect your GitHub repository to Render

## Deployment Steps
1. In the Render dashboard, click "New" and select "Blueprint"
2. Select your GitHub repository
3. Render will detect the render.yaml file and configure the service
4. Set the following environment variables in the Render dashboard:
   - OPENAI_API_KEY: Your OpenAI API key
   - ADMIN_USERNAME: Admin username for the dashboard
   - ADMIN_PASSWORD: Admin password for the dashboard
5. Click "Apply" to deploy the application

## Important Notes
- Make sure your OpenAI API key has access to the Whisper API
- The application will run in production mode on Render
- The .env file is not included in the repository for security reasons
EOF

echo "Created RENDER_DEPLOYMENT.md with instructions"

# 5. Update run.py to load environment variables
if [ -f run.py ]; then
    # Check if run.py already imports dotenv
    if ! grep -q "from dotenv import load_dotenv" run.py; then
        # Create a backup of the original file
        cp run.py run.py.bak
        
        # Add dotenv import and loading
        sed -i.bak '1s/^/from dotenv import load_dotenv\n/' run.py
        sed -i.bak '/^import/a\
# Load environment variables from .env file if it exists\
load_dotenv()' run.py
        
        echo "Updated run.py to load environment variables"
    else
        echo "run.py already loads environment variables"
    fi
else
    echo "run.py not found"
fi

echo "Deployment preparation complete!"
echo "Please follow the instructions in RENDER_DEPLOYMENT.md to deploy to Render."