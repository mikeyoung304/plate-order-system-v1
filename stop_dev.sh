#!/bin/bash
echo "Stopping Plate Order System services..."
if [ -f .backend_pid ]; then
  BACKEND_PID=$(cat .backend_pid)
  if ps -p $BACKEND_PID > /dev/null; then
    kill $BACKEND_PID
    echo "Backend stopped."
  else
    echo "Backend not running."
  fi
  rm .backend_pid
fi
if [ -f .frontend_pid ]; then
  FRONTEND_PID=$(cat .frontend_pid)
  if ps -p $FRONTEND_PID > /dev/null; then
    kill $FRONTEND_PID
    echo "Frontend stopped."
  else
    echo "Frontend not running."
  fi
  rm .frontend_pid
fi
echo "All services stopped."
