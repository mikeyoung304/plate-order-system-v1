#!/bin/bash
set -e

# Text formatting
BOLD="\033[1m"
RESET="\033[0m"
GREEN="\033[32m"
YELLOW="\033[33m"
BLUE="\033[34m"

echo -e "${BOLD}${GREEN}=== Plate Order System GitHub Setup Script ===${RESET}"
echo -e "This script will help you initialize a GitHub repository for this project.\n"

# Ask for GitHub repository information
read -p "Enter your GitHub username: " GITHUB_USERNAME
read -p "Enter the repository name (default: plate-order-system): " REPO_NAME
REPO_NAME=${REPO_NAME:-plate-order-system}

echo -e "\n${BOLD}${BLUE}Step 1: Initializing Git repository${RESET}"
# Check if Git is already initialized
if [ -d .git ]; then
  echo "Git repository already initialized."
else
  git init
  echo "Git repository initialized."
fi

# Add all files to staging
echo -e "\n${BOLD}${BLUE}Step 2: Adding files to Git${RESET}"
git add .

# Initial commit if needed
echo -e "\n${BOLD}${BLUE}Step 3: Creating initial commit${RESET}"
if [ -z "$(git log -1 2>/dev/null)" ]; then
  git commit -m "Initial commit: Plate Order System setup"
  echo "Initial commit created."
else
  echo "Repository already has commits. Skipping initial commit."
fi

# Set up remote repository
echo -e "\n${BOLD}${BLUE}Step 4: Setting up remote origin${RESET}"
if git remote | grep -q "origin"; then
  echo "Remote 'origin' already exists. Updating remote URL..."
  git remote set-url origin "https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"
else
  echo "Adding remote 'origin'..."
  git remote add origin "https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"
fi

echo -e "\n${BOLD}${YELLOW}Remote repository URL set to: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git${RESET}"

# Create main branch if not on main
echo -e "\n${BOLD}${BLUE}Step 5: Ensuring main branch exists${RESET}"
CURRENT_BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo "")
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "Currently on branch '$CURRENT_BRANCH'. Creating and switching to 'main' branch..."
  git checkout -b main
fi

echo -e "\n${BOLD}${GREEN}Repository setup completed locally!${RESET}"
echo -e "\n${BOLD}${BLUE}Next Steps:${RESET}"
echo -e "${YELLOW}1. Create a repository on GitHub named '${REPO_NAME}' if you haven't already.${RESET}"
echo -e "   Visit: https://github.com/new"
echo -e "${YELLOW}2. Push your code to GitHub:${RESET}"
echo -e "   git push -u origin main"
echo -e "${YELLOW}3. Set up branch protection (instructions below)${RESET}"

echo -e "\n${BOLD}${BLUE}Branch Protection Setup:${RESET}"
echo -e "1. Go to your repository on GitHub: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"
echo -e "2. Navigate to Settings > Branches"
echo -e "3. Under 'Branch protection rules', click 'Add rule'"
echo -e "4. Enter 'main' as the branch name pattern"
echo -e "5. Enable the following options:"
echo -e "   - ✅ Require pull request reviews before merging"
echo -e "   - ✅ Require status checks to pass before merging"
echo -e "     - Search for and select 'frontend-checks', 'backend-checks', and 'security-checks'"
echo -e "   - ✅ Require branches to be up to date before merging"
echo -e "   - ✅ Include administrators"
echo -e "6. Click 'Create' or 'Save changes'"

echo -e "\n${BOLD}${BLUE}Required Secrets for GitHub Actions:${RESET}"
echo -e "To enable all workflow features, add these secrets in your repository settings:"
echo -e "1. SONAR_TOKEN - Token for SonarCloud analysis"
echo -e "2. SNYK_TOKEN - Token for Snyk dependency scanning"
echo -e "3. RENDER_SERVICE_ID - Service ID for Render deployment"
echo -e "4. RENDER_API_KEY - API key for Render deployment"
echo -e "5. SLACK_WEBHOOK - Webhook URL for Slack notifications"

echo -e "\n${BOLD}${GREEN}Setup complete!${RESET}"
echo -e "Your GitHub CI/CD workflows, templates, and protection rules are ready to use."