# Plate Order System

A restaurant management system with voice ordering capabilities.

## Project Structure

- `backend/` - FastAPI backend with WebSocket support for voice recognition
- `frontend/` - Next.js frontend application

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 18+
- npm or yarn

### Installation

1. Install backend dependencies:
   ```
   cd backend
   pip install -r requirements.txt
   ```

2. Install frontend dependencies:
   ```
   cd frontend
   npm install --legacy-peer-deps
   ```

3. Install root project dependencies:
   ```
   npm install
   ```

### Running the Application

To start both the backend and frontend:

```
./start_dev.sh
```

This will start:
- Backend on http://localhost:8005
- Frontend on http://localhost:3000

To stop all services:

```
./stop_dev.sh
```

## Development

- Backend API is available at http://localhost:8005/api/v1
- API documentation is available at http://localhost:8005/api/v1/docs
- WebSocket endpoint is at ws://localhost:8005/ws/listen
