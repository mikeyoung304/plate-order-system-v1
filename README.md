# Plate Order System

A voice-enabled ordering system for restaurants with server view, kitchen display, and admin dashboard.

## Features

- **Voice-to-Order**: Take orders using voice recognition
- **Server View**: Interactive floor plan for table management
- **Kitchen Display**: Real-time order tracking and management
- **Admin Dashboard**: Analytics and system management
- **Responsive Design**: Works on tablets and mobile devices

## Local Development

### Prerequisites

- Python 3.10+
- PostgreSQL (optional, SQLite is used by default)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/plate-order-system.git
cd plate-order-system
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the application:
```bash
python run.py
```

5. Access the application at http://localhost:8000

## Deployment

This application can be easily deployed to Render. See [render-deployment-guide.md](render-deployment-guide.md) for detailed instructions.

### Quick Deployment Steps

1. Push your code to a Git repository
2. Sign up for Render at https://render.com
3. Create a new Web Service and connect your repository
4. Configure the build and start commands as specified in the Procfile
5. Deploy and share the provided URL

## Project Structure

- `app/`: Main application package
  - `api/`: API endpoints
  - `models/`: Database models
  - `services/`: Business logic
  - `static/`: Static assets (CSS, JS, images)
  - `templates/`: HTML templates
- `main.py`: Application entry point
- `run.py`: Server startup script

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- FastAPI for the web framework
- Tailwind CSS for styling
- OpenAI for speech-to-text capabilities