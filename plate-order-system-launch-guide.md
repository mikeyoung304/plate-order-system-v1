# Plate Order System - Complete Launch Guide

## System Overview

The Plate Order System consists of four integrated components:

1. **FastAPI Backend** (Port 8005)
2. **Next.js Frontend** (Port 3000)
3. **Supabase Database** (Cloud-hosted)
4. **WebSocket Voice Recognition** (Integrated with the backend)

## Component Status & Integration

✅ **All components are now properly connected and functioning**

The following has been accomplished:
- Added compatibility routes to resolve API path mismatches
- Backend successfully serving menu data to the frontend
- API health checks passing
- Data flowing correctly between components
- Automated restart script created for maintenance

## Launch Instructions

### 1. Start the Plate Order System

The recommended way to launch both backend and frontend is with the unified script:

```bash
./start_dev.sh
```

> **Note:** You must include `./` before the script name to run it from the current directory. If you see a "command not found" error, make sure the script is executable with:
> ```bash
> chmod +x start_dev.sh
> ```

This script will:
- Start the FastAPI backend on port 8005
- Start the Next.js frontend on port 3000
- Output process IDs for both services
- Print the application URL: http://localhost:3000

**To stop all services:** Press `Ctrl+C` in the terminal running the script.

#### Manual Startup (Advanced)

If you need to start services individually:

**Backend:**
```bash
cd backend
python main.py
```

**Frontend:**
```bash
cd frontend
npm run dev
# or, if you use pnpm:
pnpm dev
```

### 2. Access the Application

- **Main Application**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Documentation**: [http://localhost:8005/api/v1/docs](http://localhost:8005/api/v1/docs)

## Troubleshooting

### Port Conflicts

If you encounter a "Port already in use" error:
1. Use `lsof -i:8005` or `lsof -i:3000` to identify the process
2. Use `kill <PID>` to stop the process
3. Restart the server

### API Connection Issues

If the frontend can't connect to the backend:
1. Verify both servers are running
2. Check browser console for CORS errors
3. Ensure the backend is running on port 8005
4. Verify the compatibility routes are working with: `curl http://localhost:8005/api/health`

### Voice Recognition Issues

If voice recognition fails:
1. Check that the Deepgram API key is correctly set in the .env file
2. Verify the WebSocket connection is established
3. Check browser permissions for microphone access

## Architecture Diagram

```
┌─────────────────────┐     HTTP     ┌─────────────────────┐
│                     │◄───/api/*────┤                     │
│  FastAPI Backend    │              │   Next.js Frontend  │
│    (Port 8005)      │─────────────►│      (Port 3000)    │
│                     │     JSON     │                     │
└──────────▲──────────┘              └──────────▲──────────┘
           │                                     │
           │                                     │
           │                                     │
┌──────────▼──────────┐     WebSocket   ┌───────▼───────────┐
│                     │◄───────────────►│                    │
│  Supabase Database  │                 │  Browser Client    │
│   (Cloud-hosted)    │                 │ (Voice Recognition)│
│                     │                 │                    │
└─────────────────────┘                 └────────────────────┘
```

## Maintenance

The `restart_server.sh` script has been provided for easy server management. It automatically:

1. Finds and gracefully stops any existing FastAPI server
2. Starts the server with the latest code
3. Verifies API endpoints are accessible
4. Provides a PID for future reference

## Implementation Details

The system has been updated to include API compatibility routes that bridge the path differences between frontend expectations and backend implementation:

- Frontend expects: `/api/health`, `/api/menu`  
- Backend uses: `/api/v1/menu`, etc.

These compatibility routes have been added to `main.py` to ensure seamless communication.