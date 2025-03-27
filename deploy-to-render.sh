#!/bin/bash

# Script to help deploy the Plate Order System to Render

echo "Preparing to deploy Plate Order System to Render..."

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Git is not installed. Please install git first."
    exit 1
fi

# Check if the current directory is a git repository
if [ ! -d .git ]; then
    echo "Initializing git repository..."
    git init
fi

# Check if the necessary files exist
if [ ! -f "requirements.txt" ]; then
    echo "Error: requirements.txt not found. Please make sure you're in the correct directory."
    exit 1
fi

if [ ! -f "Procfile" ]; then
    echo "Error: Procfile not found. Please make sure you've created it."
    exit 1
fi

if [ ! -f "render.yaml" ]; then
    echo "Error: render.yaml not found. Please make sure you've created it."
    exit 1
fi

# Add all files to git
echo "Adding files to git..."
git add .

# Commit changes
echo "Committing changes..."
git commit -m "Prepare for Render deployment"

# Ask for GitHub username and repository name
echo "Please enter your GitHub username:"
read github_username

echo "Please enter a name for your repository (e.g., plate-order-system):"
read repo_name

# Create GitHub repository (requires GitHub CLI or manual creation)
echo "Please create a new repository on GitHub named '$repo_name' under your account '$github_username'."
echo "Press Enter when you've created the repository..."
read

# Add GitHub remote
echo "Adding GitHub remote..."
git remote add origin "https://github.com/$github_username/$repo_name.git"

# Push to GitHub
echo "Pushing to GitHub..."
git push -u origin main || git push -u origin master

echo "Your code has been pushed to GitHub."
echo "Now you can deploy to Render by following these steps:"
echo "1. Go to https://dashboard.render.com/new/web-service"
echo "2. Connect your GitHub account if you haven't already"
echo "3. Select the '$repo_name' repository"
echo "4. Configure your web service with the following settings:"
echo "   - Name: plate-order-system (or any name you prefer)"
echo "   - Environment: Python"
echo "   - Build Command: pip install -r requirements.txt"
echo "   - Start Command: uvicorn main:app --host 0.0.0.0 --port \$PORT"
echo "5. Click 'Create Web Service'"
echo ""
echo "For more detailed instructions, please refer to the render-deployment-guide.md file."