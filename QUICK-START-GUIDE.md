# Restaurant App Stack Quick Start Guide

This guide will help you quickly set up and run the restaurant application stack with FastAPI, Next.js, and SQLite.

## Prerequisites

- Python 3.8+ installed
- Node.js 14+ installed
- npm or pnpm installed

## Getting Started

Follow these simple steps to get the application up and running:

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd plate-order-system
```

### 2. Set Up the Environment

The application is configured through environment variables:

1. Copy the example env file for backend:

   cp .env.example .env

2. Copy the example env file for frontend:

   cp frontend/.env.local.example frontend/.env.local

3. Edit `.env` to configure `DATABASE_URL`, `SECRET_KEY`, and other keys.

4. (Optional) Edit `frontend/.env.local` to set API and Supabase URLs.

### 3. Start the Development Environment

Run the start script to initialize the database, seed default data, and start both backend and frontend servers:

```bash
chmod +x ./start_dev.sh
./start_dev.sh
```

This script will:
- Load environment variables from `backend/.env`
- Initialize the database schema
- Seed default data (floor plan and tables)
- Start the backend server (automatically finds an available port, default 8000)
- Start the frontend server (automatically finds an available port, default 3000)

### 4. Verify the Implementation

Run the verification script to check if all components are working properly:

```bash
chmod +x ./verify_implementation.sh
./verify_implementation.sh
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Floor Plan Editor**: http://localhost:3000/admin
- **Backend API**: http://localhost:8005 (or whatever port was assigned)
- **API Documentation**: http://localhost:8005/api/v1/docs

### 6. Stop the Development Environment

When you're done, stop all services using:

```bash
chmod +x ./stop_dev.sh
./stop_dev.sh
```

## System Architecture

The restaurant app stack consists of:

### Backend (FastAPI)

- REST API for floor plans, tables, and seats
- SQLite database (can be configured to use PostgreSQL)
- WebSocket support for real-time updates

### Frontend (Next.js)

- Interactive floor plan editor
- Table management interface
- API proxying to the backend

### Database

- SQLAlchemy ORM
- Models for floor plans, tables, seats, and orders
- Repositories for data access

## API Endpoints

Key API endpoints include:

- `/api/v1/floor-plans` - List all floor plans
- `/api/v1/floor-plans/{floor_plan_id}` - Get a specific floor plan
- `/api/v1/floor-plans/{floor_plan_id}/tables` - Get tables for a floor plan
- `/api/v1/tables/{table_id}` - Get a specific table
- `/api/v1/tables/{table_id}/seats` - Get seats for a table

## Troubleshooting

### Database Issues

If you encounter database issues, try resetting the database:

```bash
rm backend/app.db
./start_dev.sh
```

### Port Conflicts

If you have port conflicts, the start script will automatically find the next available port. You can also specify ports:

```bash
BACKEND_PORT=8080 FRONTEND_PORT=4000 ./start_dev.sh
```

### Verification Failures

If the verification script fails:

1. Ensure both backend and frontend servers are running
2. Check terminal output for error messages
3. Verify the ports being used (the script will detect them automatically)

## Next Steps

- Explore the floor plan editor at http://localhost:3000/admin
- Create tables and manage the restaurant layout
- Check the API documentation for other available endpoints