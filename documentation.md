# Comprehensive Documentation for Plate Order System with Floor Plan Management

## Overview

The Plate Order System with Floor Plan Management is a comprehensive solution designed for restaurants and assisted living facilities. It integrates dynamic floor plan management, seat tracking, order routing, and voice recognition capabilities to streamline the ordering process and improve operational efficiency.

## Key Features

1. **Floor Plan Management System**
   - Visual floor plan designer for creating and editing restaurant layouts
   - Drag-and-drop interface for table placement and configuration
   - Support for different table shapes and sizes
   - Save and load multiple floor plans

2. **Dynamic Seat Tracking**
   - Track orders by table and seat number
   - Visual indicators for table and seat status
   - Real-time updates across all views

3. **Order Routing System**
   - Automatic routing of food orders to the kitchen
   - Automatic routing of drink orders to the bar
   - Comprehensive expo view with floor plan visualization
   - Real-time order status updates

4. **Voice Recognition**
   - Record orders using voice recognition
   - Transcription of voice to text using Deepgram API
   - Support for iOS devices and Safari browser
   - Fallback mechanisms for reliability
   - Dietary note detection for assisted living facilities

5. **Responsive Design**
   - Optimized for iPad use in restaurant environments
   - Works on desktop, tablet, and mobile devices
   - Touch-friendly interface for easy operation

## System Architecture

The system is built using a modern web application architecture:

- **Backend**: FastAPI (Python) for API endpoints and server-side logic
- **Database**: SQLAlchemy with SQLite for data storage
- **Frontend**: HTML, CSS, JavaScript with Bootstrap for responsive design
- **Real-time Communication**: WebSockets for live updates
- **Voice Processing**: Deepgram API for speech-to-text conversion

## Installation and Setup

### Prerequisites
- Python 3.8 or higher
- Node.js 14 or higher
- npm 6 or higher

### One-Click Setup
The system includes a one-click setup script that automates the entire installation process:

1. Navigate to the project directory:
   ```
   cd projects/plate-order-system-enhanced
   ```

2. Run the setup script:
   ```
   ./setup.sh
   ```

3. The script will:
   - Check and install required dependencies
   - Set up environment variables
   - Initialize the database
   - Configure the floor plan management system
   - Set up voice recording functionality
   - Create necessary files and directories

4. Update the Deepgram API key in the `.env` file:
   ```
   DEEPGRAM_API_KEY=your_actual_api_key
   ```

5. Start the application:
   ```
   ./start.sh
   ```

6. Access the application in your browser:
   ```
   http://localhost:8000
   ```

### Verification
To verify that the system is correctly installed and configured:

1. Run the verification script:
   ```
   ./verify.sh
   ```

2. The script will check:
   - File structure
   - Python dependencies
   - JavaScript dependencies
   - Database setup
   - Environment variables
   - Server startup

## User Guide

### Admin View: Floor Plan Management

1. Navigate to the Admin view by clicking "Admin" in the navigation bar and selecting "Floor Plan Management"
2. Create a new floor plan:
   - Click "Create New Floor Plan"
   - Enter a name for the floor plan
   - Use the toolbar to add tables of different shapes and sizes
   - Drag tables to position them on the floor plan
   - Click on tables to edit their properties (number, capacity, etc.)
   - Click "Save" to save the floor plan

3. Edit an existing floor plan:
   - Select a floor plan from the dropdown menu
   - Make changes using the toolbar and drag-and-drop interface
   - Click "Save" to update the floor plan

### Server View: Taking Orders

1. Navigate to the Server view by clicking "Server View" in the navigation bar
2. Select a floor plan from the dropdown menu
3. Click on a table to select it
4. Enter the seat number or select from the available seats
5. Take an order using voice recognition:
   - Press and hold the microphone button
   - Speak the order clearly
   - Release the button to stop recording
   - Review the transcribed order
   - Edit if necessary
   - Click "Confirm Order" to submit

6. View and manage orders:
   - See all orders for the selected table
   - Filter orders by status (new, in progress, completed)
   - Update order status as needed

### Kitchen View: Food Orders

1. Navigate to the Kitchen view by clicking "Kitchen View" in the navigation bar
2. View all food orders sorted by status and time
3. Filter orders by status (new, in progress, completed)
4. Click on an order to see details
5. Update order status:
   - Click "Start Preparing" to change status to "In Progress"
   - Click "Complete" to change status to "Completed"

### Bar View: Drink Orders

1. Navigate to the Bar view by clicking "Bar View" in the navigation bar
2. View all drink orders sorted by status and time
3. Filter orders by status (new, in progress, completed)
4. Click on an order to see details
5. Update order status:
   - Click "Start Preparing" to change status to "In Progress"
   - Click "Complete" to change status to "Completed"

### Expo View: All Orders with Floor Plan

1. Navigate to the Expo view by clicking "Expo View" in the navigation bar
2. View the floor plan with table status indicators
3. See all orders across the restaurant
4. Filter orders by type (food, drink) and status
5. Click on tables to see their orders
6. Update order status as needed

## Voice Recognition Features

The voice recognition system includes several features to ensure reliability and usability:

1. **iOS Compatibility**: Special handling for iOS devices and Safari browser
2. **Timeout Handling**: Automatic timeout for long recordings
3. **Minimum Recording Time**: Prevention of accidental short recordings
4. **Connection Timeout**: Handling of WebSocket connection timeouts
5. **Fallback Mechanism**: REST API fallback if WebSocket is unavailable
6. **Error Recovery**: Automatic reconnection and error handling
7. **Dietary Note Detection**: Automatic identification of dietary requirements

## Customization

### Environment Variables

The system can be customized through environment variables in the `.env` file:

- `DEBUG`: Enable/disable debug mode (True/False)
- `SECRET_KEY`: Secret key for session security
- `DATABASE_URL`: Database connection string
- `DEEPGRAM_API_KEY`: API key for Deepgram speech-to-text service
- `HOST`: Host address for the server
- `PORT`: Port number for the server

### Design System

The visual design can be customized through the design system CSS:

- `app/static/css/design-system.css`: Global styles and design tokens
- `app/static/css/server-view.css`: Styles for the server view
- `app/static/css/kitchen-view.css`: Styles for the kitchen view
- `app/static/css/bar-view.css`: Styles for the bar view
- `app/static/css/expo-view.css`: Styles for the expo view
- `app/static/css/admin/floor-plan.css`: Styles for the floor plan management

## Troubleshooting

### Common Issues

1. **Voice Recording Not Working**
   - Check that your Deepgram API key is correctly set in the `.env` file
   - Ensure microphone access is granted in your browser
   - Try using the REST API fallback by setting `useWebSocket: false` in the VoiceRecorder options

2. **Floor Plan Not Loading**
   - Check that Fabric.js is correctly installed
   - Clear your browser cache and reload the page
   - Ensure the floor plan data is correctly saved in the database

3. **Orders Not Appearing in Kitchen/Bar View**
   - Verify that orders are correctly categorized as food or drink
   - Check WebSocket connections for real-time updates
   - Refresh the page to load the latest data

4. **Database Errors**
   - Check that the database file has correct permissions
   - Ensure the `DATABASE_URL` in the `.env` file is correct
   - Try deleting the database file and restarting the application to recreate it

### Logs

- Application logs are output to the console when running the server
- For more detailed logging, set `DEBUG=True` in the `.env` file

## Technical Details

### Database Schema

The system uses the following database models:

1. **FloorPlan**
   - id: Integer (Primary Key)
   - name: String
   - layout_data: JSON
   - created_at: DateTime
   - updated_at: DateTime

2. **Table**
   - id: Integer (Primary Key)
   - floor_plan_id: Integer (Foreign Key)
   - table_number: Integer
   - shape: String
   - x_position: Float
   - y_position: Float
   - width: Float
   - height: Float
   - status: String
   - capacity: Integer

3. **Order**
   - id: Integer (Primary Key)
   - table_id: Integer (Foreign Key)
   - seat_number: Integer
   - order_type: String (food, drink)
   - status: String (new, in_progress, completed)
   - content: Text
   - created_at: DateTime
   - updated_at: DateTime
   - dietary_flags: JSON

### API Endpoints

The system provides the following API endpoints:

1. **Floor Plans**
   - GET `/api/v1/floor-plans`: List all floor plans
   - GET `/api/v1/floor-plans/{id}`: Get a specific floor plan
   - POST `/api/v1/floor-plans`: Create a new floor plan
   - PUT `/api/v1/floor-plans/{id}`: Update a floor plan
   - DELETE `/api/v1/floor-plans/{id}`: Delete a floor plan

2. **Tables**
   - GET `/api/v1/floor-plans/{id}/tables`: List all tables for a floor plan
   - POST `/api/v1/tables`: Create a new table
   - PUT `/api/v1/tables/{id}`: Update a table
   - DELETE `/api/v1/tables/{id}`: Delete a table

3. **Orders**
   - GET `/api/v1/orders`: List all orders
   - GET `/api/v1/orders/{id}`: Get a specific order
   - POST `/api/v1/orders`: Create a new order
   - PUT `/api/v1/orders/{id}`: Update an order
   - DELETE `/api/v1/orders/{id}`: Delete an order
   - GET `/api/v1/tables/{id}/orders`: List all orders for a table

4. **Speech**
   - POST `/api/v1/speech/transcribe`: Transcribe audio data
   - WebSocket `/ws/listen`: Real-time audio streaming and transcription

### WebSocket Events

The system uses WebSocket for real-time communication with the following event types:

1. **Connection Events**
   - `connection`: Connection status updates
   - `dg_open`: Deepgram connection opened
   - `dg_close`: Deepgram connection closed

2. **Transcription Events**
   - `transcript`: Transcription results
   - `speech_started`: Speech detection started
   - `utterance_end`: End of utterance detected

3. **Order Events**
   - `order_created`: New order created
   - `order_updated`: Order status updated
   - `order_deleted`: Order deleted

4. **Table Events**
   - `table_updated`: Table status updated
   - `table_selected`: Table selected by a user

## Security Considerations

1. **API Security**
   - Use a strong, unique `SECRET_KEY` in production
   - Consider implementing authentication for API endpoints in production

2. **Database Security**
   - Use a more robust database system (PostgreSQL, MySQL) in production
   - Implement database backups and recovery procedures

3. **Environment Variables**
   - Keep API keys and sensitive information in environment variables
   - Do not commit `.env` files to version control

## Performance Optimization

1. **Database Indexing**
   - Add indexes to frequently queried fields
   - Use database connection pooling in production

2. **Caching**
   - Implement caching for frequently accessed data
   - Consider using Redis for caching in production

3. **WebSocket Optimization**
   - Implement reconnection strategies for WebSocket connections
   - Use binary data format for audio streaming to reduce bandwidth

## Conclusion

The Plate Order System with Floor Plan Management provides a comprehensive solution for restaurants and assisted living facilities. With its intuitive interface, powerful features, and robust architecture, it streamlines the ordering process and improves operational efficiency.

For any questions or issues, please refer to the troubleshooting section or contact the development team.
