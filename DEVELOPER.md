# Plate Order System Developer Documentation

This document provides comprehensive instructions for developers working on the Plate Order System, covering setup, development, testing, and deployment processes.

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Application Architecture](#application-architecture)
3. [Database Configuration](#database-configuration)
4. [Local Development Workflow](#local-development-workflow)
5. [Testing Methodology](#testing-methodology)
6. [Deployment Process](#deployment-process)
7. [Voice Recognition Integration](#voice-recognition-integration)
8. [Troubleshooting](#troubleshooting)

## Development Environment Setup

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **Python**: v3.9 or higher
- **PostgreSQL** (optional): v14 or higher (SQLite can be used for local development)
- **Supabase Account**: Required for production or cloud-based development
- **API Keys**: For speech-to-text services (Deepgram or OpenAI)

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd plate-order-system
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

3. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   # or if using pnpm
   pnpm install
   cd ..
   ```

4. **Environment Configuration**:
   ```bash
   cp .env.example .env
   # Edit .env with your specific configuration
   ```

5. **Setup Security Tools** (optional but recommended):
   ```bash
   ./setup_security_tools.sh
   ```

### Environment Variables

Key environment variables to configure:

```
# Database Configuration
DATABASE_URL=sqlite:///./app.db  # or PostgreSQL URL

# Supabase (for real-time and auth)
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_SERVICE_KEY=your-service-key

# Speech-to-Text APIs
DEEPGRAM_API_KEY=your-key
OPENAI_API_KEY=your-key

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/listen
```

Refer to [SECURE-CREDENTIALS-GUIDE.md](SECURE-CREDENTIALS-GUIDE.md) for best practices on managing credentials.

## Application Architecture

### Backend (FastAPI)

The backend follows a structured architecture:

- **API Layer**: Routes and endpoint handlers (`backend/app/api/v1/endpoints/`)
- **Service Layer**: Business logic implementation (`backend/app/domain/services/`)
- **Repository Layer**: Database access abstraction (`backend/app/db/repositories/`)
- **Model Layer**: Database models (`backend/app/db/models/`)
- **WebSockets**: Real-time communication handlers (`backend/app/websockets/`)

### Frontend (Next.js)

The frontend follows Next.js App Router architecture:

- **Pages**: Main application pages (`frontend/app/`)
- **Components**: Reusable React components (`frontend/components/`)
- **Hooks**: Custom React hooks (`frontend/hooks/`)
- **Services**: API client code (`frontend/services/`)
- **Lib**: Utility functions (`frontend/lib/`)

## Database Configuration

### Local Development Database

By default, the application uses SQLite for local development:

```
DATABASE_URL=sqlite:///./app.db
```

This is automatically configured in the `start_dev.sh` script.

### PostgreSQL Setup

For more advanced development, you can use PostgreSQL:

1. Install PostgreSQL locally or use a cloud service
2. Create a database for the application
3. Update your `.env` file:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/plate_order_system
   ```

### Supabase Configuration

For production or when developing with Supabase:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Follow the [Supabase Setup Guide](docs/supabase_setup_guide.md)
3. Update your `.env` with the Supabase credentials

### Database Migration

The project uses Alembic for migrations:

```bash
# Generate a migration (after model changes)
cd backend
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head
```

## Local Development Workflow

### Starting the Development Environment

The simplest way to start both backend and frontend:

```bash
./start_dev.sh
```

This script:
- Sets up environment variables
- Initializes the database if needed
- Starts the backend on port 8000
- Starts the frontend on port 3000
- Opens Chrome with microphone permissions enabled (on macOS)

### Manual Startup

If you prefer to start components separately:

1. **Backend**:
   ```bash
   cd backend
   python main.py
   ```
   Access the API at http://localhost:8000 and docs at http://localhost:8000/api/v1/docs

2. **Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
   Access the app at http://localhost:3000

### Stopping the Development Environment

```bash
./stop_dev.sh
```

## Testing Methodology

### Backend Tests

Backend tests use pytest:

```bash
cd backend
pytest
```

Key test directories:
- `tests/unit/`: Unit tests for services and repositories
- `tests/api/`: API endpoint tests
- `tests/integration/`: Cross-component tests

### Frontend Tests

Frontend tests use Jest and React Testing Library:

```bash
cd frontend
npm test
```

### Voice Recognition Testing

Test the voice recognition using:

```bash
python test_voice.py
```

This script sends test audio to the speech-to-text service and verifies responses.

## Deployment Process

### Docker Deployment

The project includes Docker configuration for containerized deployment:

```bash
# Build the Docker image
docker build -t plate-order-system .

# Run the container
docker run -p 8000:8000 -p 3000:3000 plate-order-system
```

### Render Deployment

For deployment to Render:

1. Configure your Render account
2. Link your GitHub repository
3. Use the `render.yaml` configuration
4. Set environment variables in the Render dashboard

See [render-deployment-guide.md](render-deployment-guide.md) for detailed instructions.

## Voice Recognition Integration

### How Voice Recognition Works

1. The frontend captures audio through the browser's WebAudio API
2. Audio is streamed via WebSockets to the backend
3. The backend sends the audio to a speech-to-text service (Deepgram or OpenAI)
4. Transcriptions are returned to the frontend in real-time
5. The UI updates with the transcribed text

### Testing Voice Recognition

Follow these steps to test voice recognition:

1. Ensure your microphone is working properly
2. Verify API keys for speech services are correctly set
3. Open the server view at http://localhost:3000/server
4. Select a table and seat
5. Click the microphone button and speak a test phrase
6. Verify the transcription appears in the order area

## Troubleshooting

### Common Issues

#### Frontend Can't Connect to Backend

**Symptoms:**
- Network errors in browser console
- "Unable to connect to API" messages

**Solutions:**
1. Verify the backend is running on port 8000
2. Check that `NEXT_PUBLIC_API_URL` is set correctly in `.env.local`
3. Look for CORS errors and ensure CORS_ORIGINS includes your frontend URL

#### Database Connection Issues

**Symptoms:**
- "Unable to connect to database" errors
- Application doesn't start properly

**Solutions:**
1. Verify DATABASE_URL in `.env`
2. For PostgreSQL, ensure the database server is running
3. Check database user permissions
4. The script automatically falls back to SQLite if PostgreSQL connection fails

#### Voice Recognition Not Working

**Symptoms:**
- Microphone button doesn't trigger recording
- No transcription appears when speaking

**Solutions:**
1. Check browser console for errors
2. Verify API keys are set correctly for speech services
3. Ensure browser has microphone permissions
4. Test with `test_voice.py` to isolate frontend vs. backend issues
5. On macOS, use Chrome with the auto-grant flag: `--use-fake-ui-for-media-stream`

#### WebSocket Connection Issues

**Symptoms:**
- "WebSocket connection failed" errors
- Real-time updates not working

**Solutions:**
1. Verify the backend WebSocket server is running
2. Check that `NEXT_PUBLIC_WS_URL` is set correctly in `.env.local`
3. Look for any firewall blocking WebSocket connections
4. Test with `test_websocket.py` to check connectivity

### Debugging Tools

**Backend Debugging:**
```bash
./debug_server.py
```

**Frontend Debugging:**
- Use browser developer tools
- React DevTools extension
- Check terminal for Next.js build errors

**WebSocket Debugging:**
```bash
python test_websocket.py
```

## Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.io/docs)
- [Deepgram Documentation](https://developers.deepgram.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)

For any questions not covered in this documentation, please open an issue on the repository or contact the maintainers.