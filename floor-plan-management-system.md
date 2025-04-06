# Floor Plan Management System Design

## Overview

This document outlines the design for the enhanced floor plan management system for the Plate Order System, specifically tailored for assisted living facilities. The system includes an admin view for designing floor layouts and a server view for taking orders with dynamic seat tracking.

## Admin View Features

### Floor Plan Designer
- Drag-and-drop interface for placing tables
- Table shape options: square, rectangle, circle
- Resizable tables with customizable seat counts
- Table labeling and numbering
- Zone/section definition for organizing floor space
- Save/load floor plan configurations

### Table Configuration
- Define number of seats per table
- Arrange seats around tables (positioning)
- Set table properties (minimum/maximum capacity)
- Define table status (available, reserved, out of service)
- Assign tables to specific zones or sections

### Seat Management
- Customize seat numbering
- Define default seat positions
- Set accessibility features for specific seats

## Server View Features

### Floor Plan Navigation
- View-only display of the admin-designed floor plan
- Color-coded table status indicators
- Zoom functionality for focusing on specific areas
- Table selection with visual feedback

### Table Interaction
- Tap to zoom into selected table
- Display of all seats with their current status
- Seat status indicators:
  - Empty seats: light gray
  - Seats with orders placed: green highlight
  - Seats occupied but no order: amber highlight
  - Selected seat: blue highlight

### Seat Selection and Ordering
- Tap on seat to select
- Option to assign resident to seat
- Order type selection: "Drinks" or "Food"
- Voice recording for order details
- Order confirmation and submission

### Dynamic Seat Management
- Track which residents are at which seats
- Allow new residents to join tables where others have already ordered
- Maintain visual differentiation between seats with and without orders
- Support for residents coming and going at different times

## Order Routing

### Drink Orders
- Routed to bar view
- Tracked separately from food orders
- Includes seat and table information

### Food Orders
- Routed to kitchen view
- Includes dietary information and restrictions
- Linked to specific seats and tables

### Expo View
- Comprehensive view of all orders (food and drinks)
- Order status tracking
- Table and seat visualization
- Timing information

## Database Schema

### Tables Collection
```
{
  id: string,
  name: string,
  shape: "square" | "rectangle" | "circle",
  width: number,
  height: number,
  positionX: number,
  positionY: number,
  rotation: number,
  seatCount: number,
  zone: string,
  status: "available" | "reserved" | "out_of_service"
}
```

### Seats Collection
```
{
  id: string,
  tableId: string,
  number: number,
  positionX: number,
  positionY: number,
  status: "empty" | "occupied_with_order" | "occupied_without_order"
}
```

### Orders Collection
```
{
  id: string,
  tableId: string,
  seatId: string,
  residentId: string,
  type: "food" | "drink",
  content: string,
  status: "new" | "in_progress" | "completed",
  createdAt: timestamp,
  completedAt: timestamp
}
```

### Residents Collection
```
{
  id: string,
  name: string,
  dietaryRestrictions: string[],
  preferences: string[]
}
```

## Technical Implementation

### Frontend Technologies
- React for component-based UI
- Canvas API for floor plan rendering
- Drag-and-drop libraries for admin interface
- WebSockets for real-time updates

### Backend Services
- RESTful API for CRUD operations
- WebSocket server for real-time updates
- Authentication and authorization
- Data persistence layer

### Mobile Optimization
- Touch-friendly interfaces
- Responsive design for different iPad models
- Gesture support (pinch-to-zoom, swipe)
- Offline capabilities with sync

## User Workflows

### Admin Floor Plan Creation
1. Admin logs into admin interface
2. Creates new floor plan or edits existing one
3. Drags and places tables on the canvas
4. Configures table properties (shape, size, seats)
5. Organizes tables into zones if needed
6. Saves floor plan configuration

### Server Order Taking
1. Server logs into server view
2. Views floor plan with table status indicators
3. Taps on a table to zoom in
4. Sees individual seats with their status
5. Taps on a specific seat
6. Assigns resident if needed
7. Selects "Drinks" or "Food"
8. Records order details via voice
9. Confirms and submits order
10. Seat status updates to "occupied with order"

### New Resident Joining
1. Server identifies table with new resident
2. Taps on table to zoom in
3. Sees existing seats (some with orders, some without)
4. Taps on empty seat or seat without order
5. Assigns new resident
6. Takes order
7. Submits order
8. Seat status updates while maintaining distinction from previously ordered seats

## Implementation Phases

### Phase 1: Core Floor Plan Management
- Admin view for basic table placement
- Server view for table selection
- Basic seat visualization

### Phase 2: Order Routing
- Drink vs. food order differentiation
- Bar and kitchen views
- Order status tracking

### Phase 3: Dynamic Seat Management
- Resident assignment to seats
- Status tracking for individual seats
- Visual differentiation of seat states

### Phase 4: Advanced Features
- Dietary restriction integration
- Order history
- Analytics and reporting
