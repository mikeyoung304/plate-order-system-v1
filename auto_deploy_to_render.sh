#!/bin/bash

# Script to automatically deploy to Render

echo "Starting automatic deployment to Render..."

# 1. Add all changes to git
echo "Adding all changes to git..."
git add .

# 2. Commit changes
echo "Committing changes..."
git commit -m "Fix voice ordering feature with seat tracking and audio visualization"

# 3. Push to GitHub
echo "Pushing to GitHub..."
git push

# 4. Wait for Render to detect changes
echo "Changes pushed to GitHub. Render should automatically detect and deploy the changes."
echo "Please check your Render dashboard to monitor the deployment progress."
echo ""
echo "Important: Make sure the following environment variables are set in Render:"
echo "- DEEPGRAM_API_KEY: Your Deepgram API key"
echo "- ADMIN_USERNAME: Admin username for the dashboard"
echo "- ADMIN_PASSWORD: Admin password for the dashboard"
echo ""
echo "Deployment initiated. Please allow a few minutes for Render to complete the deployment."