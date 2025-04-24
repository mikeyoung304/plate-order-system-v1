#!/bin/bash
echo "Starting Plate Order System..."
echo "Starting backend on port 8005..."
cd backend && python main.py &
BACKEND_PID=$!
echo $BACKEND_PID > ../.backend_pid
echo "Starting frontend on port 3000..."
cd /Users/mike/plate-order-system/frontend && npm run dev &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../.frontend_pid
echo "Both services started. Access the application at http://localhost:3000"
echo "Press Ctrl+C to stop all services"
wait
