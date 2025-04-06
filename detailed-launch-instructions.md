# Detailed Launch Instructions for Plate Order System

This document provides comprehensive instructions for launching the enhanced Plate Order System application for your assisted living facility.

## Prerequisites

- Git installed on your system
- Python 3.8 or higher
- Node.js 14 or higher
- npm or yarn package manager
- A Deepgram API key (for voice recognition)

## Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/mikeyoung304/plate-order-system.git

# Navigate to the project directory
cd plate-order-system
```

## Step 2: Apply the Enhancements

There are two ways to apply the enhancements:

### Option A: Apply the fixes script (recommended)

```bash
# Make the script executable
chmod +x fixes/apply_fixes.sh

# Run the script to apply all enhancements
./fixes/apply_fixes.sh
```

### Option B: Manual copy (if Option A doesn't work)

```bash
# Copy all enhanced files to your repository
cp -r /path/to/plate-order-system-enhanced/* ./
```

## Step 3: Set Up Environment Variables

```bash
# Create .env file from example
cp .env.example .env

# Edit the .env file with your specific settings
nano .env
```

Add the following to your .env file:

```
# Application settings
DEBUG=False
SECRET_KEY=your_secret_key_here
ALLOWED_HOSTS=localhost,127.0.0.1,your_server_ip

# API Keys
DEEPGRAM_API_KEY=your_deepgram_api_key_here

# Database settings
DATABASE_URL=sqlite:///./app.db
```

## Step 4: Install Dependencies

```bash
# Create and activate a virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Install JavaScript dependencies
npm install
```

## Step 5: Set Up the Database

```bash
# Initialize the database
python app/db/init_db.py

# Run database migrations
python app/db/run_migrations.py
```

## Step 6: Launch the Application

### Development Mode

```bash
# Start the application in development mode
python main.py
```

### Production Mode

```bash
# Start the application in production mode
python main.py --production
```

## Step 7: Access the Application

Once the application is running, you can access it using the following URLs:

- **Server View**: http://localhost:8000/server
- **Kitchen View**: http://localhost:8000/kitchen
- **Admin Dashboard**: http://localhost:8000/admin (username: admin, password: from your .env file)

## Step 8: iPad Access Setup

To access the application from iPads:

1. Make sure all iPads are connected to the same network as the server
2. Find your server's IP address:
   ```bash
   # On Linux/Mac
   ifconfig
   
   # On Windows
   ipconfig
   ```
3. Access the application on iPads using:
   - Server View: http://[server-ip]:8000/server
   - Kitchen View: http://[server-ip]:8000/kitchen

## Step 9: Production Deployment

For a permanent production deployment:

```bash
# Make the deployment script executable
chmod +x scripts/deploy.sh

# Run the deployment script
./scripts/deploy.sh
```

This will:
1. Build optimized assets
2. Configure the production server
3. Set up proper security settings
4. Start the application in production mode

## Step 10: Verify the Deployment

```bash
# Make the verification script executable
chmod +x scripts/verify_deployment.sh

# Run verification tests
./scripts/verify_deployment.sh
```

## Troubleshooting

### Voice Recognition Issues

If voice recognition isn't working:

1. Check your Deepgram API key in the .env file
2. Ensure microphone permissions are granted in the browser
3. Check browser console for any errors
4. Try using Chrome or Safari for best compatibility

### Database Issues

If you encounter database errors:

```bash
# Reset the database
rm app.db
python app/db/init_db.py
python app/db/run_migrations.py
```

### Connection Issues

If iPads cannot connect to the server:

1. Verify all devices are on the same network
2. Check if any firewall is blocking port 8000
3. Try accessing the server IP from a browser on the iPad

## Maintenance

### Updating the Application

```bash
# Pull the latest changes
git pull

# Install any new dependencies
pip install -r requirements.txt
npm install

# Run database migrations
python app/db/run_migrations.py

# Restart the application
python main.py
```

### Backup

```bash
# Backup the database
cp app.db app.db.backup

# Backup configuration
cp .env .env.backup
```

## Support

If you encounter any issues not covered in this guide, please contact support at support@plateordersystem.com or open an issue on the GitHub repository.
