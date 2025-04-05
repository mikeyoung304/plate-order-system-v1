#!/bin/bash
# Environment setup script for Plate Order System
export PYTHONPATH="/Users/mike/plate-order-system"
export DATABASE_URL="sqlite:///./restaurant.db"
export NODE_OPTIONS="--max-old-space-size=8192"
export PORT="10000"

echo "Environment variables set:"
echo "  PYTHONPATH=$PYTHONPATH"
echo "  DATABASE_URL=$DATABASE_URL"
echo "  NODE_OPTIONS=$NODE_OPTIONS"
echo "  PORT=$PORT"

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "Virtual environment activated"
fi

# Execute command if provided
if [ $# -gt 0 ]; then
    exec "$@"
fi
