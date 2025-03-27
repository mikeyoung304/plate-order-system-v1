# Plate Order System

A voice-enabled ordering system for restaurants with real-time updates between servers and kitchen staff.

## Features

- **Voice Ordering**: Take orders using voice recognition for faster, more accurate service
- **Real-time Updates**: Instant communication between servers and kitchen staff
- **Interactive Floor Plan**: Visual representation of tables and their status
- **Kitchen Display System**: Efficient order management for kitchen staff
- **Admin Dashboard**: Analytics and system management
- **Multi-View Navigation**: Easily switch between different views

## Views

- **Server View**: For servers to take orders and manage tables
- **Kitchen View**: For kitchen staff to manage and track orders
- **Admin View**: For managers to view analytics and manage the system

## Technologies Used

- **Backend**: Python with FastAPI
- **Frontend**: HTML, JavaScript, Tailwind CSS
- **Database**: SQLite (can be upgraded to PostgreSQL)
- **Voice Recognition**: OpenAI Whisper API
- **Real-time Communication**: WebSockets

## Getting Started

### Prerequisites

- Python 3.10 or higher
- Node.js and npm (for Tailwind CSS)
- OpenAI API key (for voice recognition)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/plate-order-system.git
   cd plate-order-system
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Install Node.js dependencies:
   ```bash
   npm install
   ```

4. Set up environment variables:
   ```bash
   echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
   echo "ADMIN_USERNAME=admin" >> .env
   echo "ADMIN_PASSWORD=your_admin_password_here" >> .env
   ```

5. Initialize the database:
   ```bash
   python initialize_database.py
   ```

### Running the Application

1. Start the server:
   ```bash
   ./run_server.sh
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:8001
   ```

## Deployment

This application can be deployed to Render.com. See the [Render Deployment Guide](render-deployment-guide.md) for detailed instructions.

## Project Structure

```
plate-order-system/
├── app/                    # Application code
│   ├── api/                # API endpoints
│   ├── db/                 # Database configuration
│   ├── models/             # Database models
│   ├── services/           # Business logic
│   ├── static/             # Static files (CSS, JS, images)
│   └── templates/          # HTML templates
├── modules/                # Implementation modules
├── .env                    # Environment variables
├── main.py                 # Application entry point
├── Procfile                # Render deployment configuration
├── render.yaml             # Render blueprint configuration
├── requirements.txt        # Python dependencies
└── run.py                  # Server startup script
```

## Voice Ordering

The voice ordering feature uses OpenAI's Whisper API for speech recognition. To use this feature:

1. Set your OpenAI API key in the `.env` file
2. Select a table in the Server View
3. Click the "Start Voice Order" button
4. Speak the order clearly
5. Review the transcription
6. Click "Submit Order"

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.