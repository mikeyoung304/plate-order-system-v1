#!/bin/bash
set -e
echo "Rolling back voice integration changes..."
cp "$(dirname "$0")/backup/connection_manager.py" "$(dirname "$0")/app/websockets/" 2>/dev/null || true
cp "$(dirname "$0")/backup/voice-recognition.css" "$(dirname "$0")/" 2>/dev/null || true
rm -f "$(dirname "$0")/app/static/js/improved-ipad-voice-recognition.js"
echo "Rollback complete"
