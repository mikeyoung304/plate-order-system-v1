# Plate Order System

A restaurant management system with Next.js frontend, FastAPI backend, and database (SQLite/PostgreSQL) integration.

## System Architecture

This application consists of three main components:

1. **Frontend**: Next.js-based web application with:
   - Floor Plan Editor for table management
   - Voice ordering capabilities
   - Server, Kitchen, Expo, and Bar views

2. **Backend**: FastAPI-powered API with:
   - RESTful endpoints for floor plans, tables, seats, and orders
   - WebSocket support for real-time updates
   - Database abstraction through repositories

3. **Database**: Supports both:
   - SQLite (for development)
   - PostgreSQL (for production)

## Setup Guide

Follow these steps to get the system running:

### 1. Environment Setup

The application is configured through environment variables.

1. Copy the example env file and customize for backend:

   cp .env.example .env

2. Copy the example env file and customize for frontend:

   cp frontend/.env.local.example frontend/.env.local

3. Configure `DATABASE_URL` in `.env`:

   # SQLite (default)
   DATABASE_URL=sqlite:///./app.db

   # Or PostgreSQL:
   # DATABASE_URL=postgresql://user:password@localhost:5432/dbname

```bash
# SQLite configuration (default)
DATABASE_URL=sqlite:///./app.db

# PostgreSQL configuration (if available)
# DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

### 2. Backend Setup

The backend requires Python with necessary dependencies.

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Initialize the database (creates tables based on models)
python init_db_standalone.py
```

### 3. Frontend Setup

The frontend uses Node.js and npm/pnpm.

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Configure API URL (.env.local file)
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

## Running the Application

For convenience, use the provided scripts to start and stop the development environment:

```bash
# Start both frontend and backend
./start_dev.sh

# Stop all services
./stop_dev.sh
```

### Manual Startup

If you prefer to start components individually:

1. **Backend**:
   ```bash
   cd backend
   python main.py
   ```
   The API will be available at http://localhost:8000 with documentation at http://localhost:8000/api/v1/docs

2. **Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
   The application will be available at http://localhost:3000

   - **Server View**: http://localhost:3000/server
   - **Kitchen View**: http://localhost:3000/kitchen
   - **Admin Dashboard**: http://localhost:3000/admin

## Key Features

### Floor Plan Management

- Create, edit, and manage restaurant floor plans
- Customize tables with different shapes, sizes, and seat counts
- API endpoint: `/api/v1/floor-plans/{id}/tables` provides table data

### Order Management

- Take orders via voice or traditional input
- Track order status through different stations
- Real-time updates via WebSockets

### User Interfaces

- **Server View**: For taking orders and managing tables
- **Kitchen View**: For food preparation tracking
- **Bar View**: For beverage order management
- **Expo View**: For order coordination and delivery

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Check DATABASE_URL in backend/.env
   - Ensure PostgreSQL is running (if using PostgreSQL)
   - SQLite fallback is enabled by default in start_dev.sh

2. **API Not Responding**:
   - Verify backend is running at the correct port
   - Check backend logs for errors
   - Try accessing Swagger docs at /api/v1/docs

3. **Frontend Can't Connect to API**:
   - Ensure NEXT_PUBLIC_API_URL is set correctly
   - Verify that the frontend proxy in next.config.mjs is correctly configured
   - Check browser console for CORS or network errors

4. **Floor Plan Editor Not Loading Tables**:
   - Check the API response from `/api/v1/floor-plans/{id}/tables`
   - Verify database tables are properly created
   - Ensure floor plan with the given ID exists

## Development

The codebase follows a structured approach:

- Backend uses repository pattern for database access
- Frontend components are organized for reusability
- API endpoints follow RESTful conventions

When making changes:

1. Ensure database migrations are applied
2. Restart both frontend and backend
3. Check for any errors in the console

## API Documentation

The API documentation is available at `/api/v1/docs` when the backend is running, providing interactive documentation for all available endpoints.
