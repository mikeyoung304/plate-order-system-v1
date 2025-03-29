#!/bin/bash

# Script to force deploy all changes to Render

echo "Starting force deployment to Render..."

# 1. Check if there are any changes
if [ -z "$(git status --porcelain)" ]; then
    echo "No changes detected in the working directory."
else
    echo "Changes detected in the working directory. Adding and committing..."
    git add .
    git commit -m "Force update: Fix voice ordering feature"
fi

# 2. Create a list of files we want to ensure are updated
FILES_TO_CHECK=(
    "app/models/models.py"
    "app/api/schemas.py"
    "app/api/orders.py"
    "app/services/voice/deepgram_service.py"
    "app/static/js/components/voice/AudioVisualizer.js"
    "app/templates/server-view.html"
    "app/static/js/components/floor-plan/FloorPlan.js"
)

# 3. Create a temporary directory for the force update
TEMP_DIR=$(mktemp -d)
echo "Created temporary directory: $TEMP_DIR"

# 4. Copy the files to the temporary directory
for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        dir=$(dirname "$TEMP_DIR/$file")
        mkdir -p "$dir"
        cp "$file" "$TEMP_DIR/$file"
        echo "Copied $file to temporary directory"
    else
        echo "Warning: $file not found"
    fi
done

# 5. Create a force update commit
echo "Creating force update commit..."
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
TEMP_BRANCH="force-update-$(date +%s)"

# Create a new branch
git checkout -b $TEMP_BRANCH

# Remove the files we want to update
for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        git rm -f "$file"
        echo "Removed $file from git"
    fi
done

# Commit the removal
git commit -m "Force remove files for update"

# Copy the files back from the temporary directory
for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$TEMP_DIR/$file" ]; then
        dir=$(dirname "$file")
        mkdir -p "$dir"
        cp "$TEMP_DIR/$file" "$file"
        echo "Restored $file from temporary directory"
    fi
done

# Add the files back
git add "${FILES_TO_CHECK[@]}"

# Commit the changes
git commit -m "Force update: Fix voice ordering feature with seat tracking and audio visualization"

# Push the branch to GitHub
echo "Pushing force update branch to GitHub..."
git push -u origin $TEMP_BRANCH

# Switch back to the original branch
git checkout $CURRENT_BRANCH

# Merge the temporary branch
git merge $TEMP_BRANCH

# Push the changes to GitHub
echo "Pushing merged changes to GitHub..."
git push

# Clean up
echo "Cleaning up..."
rm -rf "$TEMP_DIR"
git branch -D $TEMP_BRANCH

echo "Force deployment completed. Render should detect the changes and deploy the updated application."
echo ""
echo "Important: Make sure the following environment variables are set in Render:"
echo "- DEEPGRAM_API_KEY: Your Deepgram API key"
echo "- ADMIN_USERNAME: Admin username for the dashboard"
echo "- ADMIN_PASSWORD: Admin password for the dashboard"
echo ""
echo "Deployment initiated. Please allow a few minutes for Render to complete the deployment."