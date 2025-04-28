#!/bin/bash

echo "Starting database setup..."

# Ensure the script is run from the backend directory
cd "$(dirname "$0")"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
  echo "Creating virtual environment..."
  python -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Initialize the database
echo "Initializing database..."
python init_db_standalone.py

# Verify database creation
if [ -f "app.db" ]; then
  echo "Database created successfully!"
else
  echo "Error: Database creation failed!"
  exit 1
fi

echo "Database setup complete!"