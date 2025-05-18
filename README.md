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
   npm run dev
   ```

3. Access the application:
   - **Main App**: http://localhost:3000

## System Architecture

This application consists of three main components:

1. **Frontend**: Next.js-based web application with:
   - Floor Plan Editor for table management
   - Voice ordering capabilities
   - Server, Kitchen, Expo, and Bar views

2. **Database**:
   - Supabase

## Tech Stack

### Frontend
- **Framework**: Next.js (React)
- **Styling**: Tailwind CSS
- **State Management**: React Context API with standards based on clean code principles
- **API Client**: Fetch API, Supabase Client

### Infrastructure
- **Database**: Supabase (PostgreSQL)

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

## License

This project is licensed under the MIT License - see the LICENSE file for details.
