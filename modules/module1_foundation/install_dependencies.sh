#!/bin/bash

# Task: Install Dependencies
# This script installs all required dependencies for the project

echo "Starting task: Install Dependencies"
echo "=================================="

# Create a log directory if it doesn't exist
mkdir -p logs

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install Python dependencies
echo "Installing Python dependencies..."
if command_exists pip; then
    pip install -r requirements.txt > logs/pip_install.log 2>&1
    if [ $? -eq 0 ]; then
        echo "Python dependencies installed successfully"
    else
        echo "Error installing Python dependencies. Check logs/pip_install.log for details"
        exit 1
    fi
else
    echo "pip not found. Please install Python and pip"
    exit 1
fi

# Check if Node.js is installed
if ! command_exists node; then
    echo "Node.js is not installed. Please install Node.js"
    exit 1
fi

# Check if npm is installed
if ! command_exists npm; then
    echo "npm is not installed. Please install npm"
    exit 1
fi

# Initialize npm if package.json doesn't exist
if [ ! -f "package.json" ]; then
    echo "Initializing npm project..."
    npm init -y > logs/npm_init.log 2>&1
    if [ $? -ne 0 ]; then
        echo "Error initializing npm project. Check logs/npm_init.log for details"
        exit 1
    fi
fi

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install tailwindcss@latest postcss@latest autoprefixer@latest > logs/npm_install.log 2>&1
if [ $? -eq 0 ]; then
    echo "Node.js dependencies installed successfully"
else
    echo "Error installing Node.js dependencies. Check logs/npm_install.log for details"
    exit 1
fi

# List installed dependencies for verification
echo "Verifying installed dependencies..."
echo "Python dependencies:"
pip freeze | grep -E "fastapi|uvicorn|sqlalchemy|pydantic|python-multipart|python-jose|passlib|bcrypt"
echo "Node.js dependencies:"
npm list --depth=0 | grep -E "tailwindcss|postcss|autoprefixer"

echo "Task completed: Install Dependencies"
exit 0