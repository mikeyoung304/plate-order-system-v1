# Plate Order System

A specialized restaurant management system for assisted living facilities, featuring voice ordering, resident preference tracking, and real-time order updates.

## Project Overview

The Plate Order System is designed specifically for assisted living facility dining services, helping staff provide personalized service to residents while streamlining operations. The system focuses on:

- **Resident Recognition**: Automatically recommends residents based on their typical seating patterns
- **Preference Tracking**: Suggests food and drink orders based on resident history
- **Voice-Enabled Ordering**: Allows servers to input orders by speaking
- **Real-Time Updates**: Instantly displays orders in kitchen, expo, and bar stations
- **Dietary Restrictions**: Tracks and alerts staff about resident dietary requirements

## Quick Start Guide

### Prerequisites

- Node.js 18+ and npm/pnpm
- Python 3.9+
- PostgreSQL (optional, SQLite works for development)
- Supabase account (free tier works for development)

### Installation

1. Clone the repository and set up environment variables:
   ```bash
   git clone <repository-url>
   cd plate-order-system
   cp .env.example .env
   # Edit .env with your credentials
   ```

2. Start the development environment:
   ```bash
   ./start_dev.sh
   ```

3. Access the application:
   - **Main App**: http://localhost:3000
   - **API Documentation**: http://localhost:8000/api/v1/docs

For detailed setup instructions, see [DEVELOPER.md](DEVELOPER.md).

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
   - PostgreSQL/Supabase (for production)

## Tech Stack

### Frontend
- **Framework**: Next.js (React)
- **Styling**: Tailwind CSS
- **State Management**: React Context API with standards based on clean code principles
- **API Client**: Fetch API, Supabase Client

### Backend
- **Framework**: FastAPI (Python)
- **Database ORM**: SQLAlchemy
- **Authentication**: Supabase Auth
- **Speech-to-Text**: Deepgram / OpenAI APIs

### Infrastructure
- **Database**: Supabase (PostgreSQL)
- **Real-time Updates**: WebSockets, Supabase Realtime
- **Deployment**: Docker, Render

## Directory Structure

```
plate-order-system/
├── backend/               # Python FastAPI backend
│   ├── app/               # Main application code
│   │   ├── api/           # API endpoints and schemas
│   │   ├── core/          # Core configuration and utilities
│   │   ├── db/            # Database models and repositories
│   │   ├── domain/        # Business logic and services
│   │   ├── static/        # Static assets (CSS, JS)
│   │   ├── templates/     # HTML templates
│   │   └── websockets/    # WebSocket handlers
│   └── alembic/           # Database migration tools
├── frontend/              # Next.js frontend
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   ├── public/            # Static assets
│   └── services/          # Service integrations
├── docs/                  # Documentation files
├── scripts/               # Utility scripts
├── supabase/              # Supabase migrations
└── tests/                 # Test files
```

## Key Features

### Floor Plan Management
- Create, edit, and manage restaurant floor plans
- Customize tables with different shapes, sizes, and seat counts

### Resident Recognition
- Track resident seating patterns
- Automatically suggest residents when a seat is selected

### Order Management
- Take orders via voice or traditional input
- Recommend items based on resident preferences
- Track order status through different stations
- Real-time updates via WebSockets

### User Interfaces
- **Server View**: For taking orders and managing tables
- **Kitchen View**: For food preparation tracking
- **Bar View**: For beverage order management
- **Expo View**: For order coordination and delivery
- **Admin**: For system configuration and floor plan management

## Documentation

- [Developer Guide](DEVELOPER.md): Comprehensive setup and development instructions
- [Contributing Guide](CONTRIBUTING.md): How to contribute to the project
- [Security Policy](SECURITY.md): Security guidelines and practices
- [Supabase Setup Guide](docs/supabase_setup_guide.md): Database setup instructions
- [Secure Credentials Guide](SECURE-CREDENTIALS-GUIDE.md): How to manage API keys and credentials

## Troubleshooting

Common issues and their solutions are documented in the [Developer Guide](DEVELOPER.md#troubleshooting).

## License

This project is licensed under the MIT License - see the LICENSE file for details.
