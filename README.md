# Plate Order System

## Super Simple Start ⚡️

```bash
# Make the script executable
chmod +x one_click_run.sh

# Run the application
./one_click_run.sh
```

What this does:
1. Fixes database issues by removing conflicting files
2. Starts the backend on port 10000
3. Starts the frontend on port 3001

## Development Mode

```bash
# Run with React development server (hot reload)
./one_click_run.sh --dev
```

## Manual Database Fix

If you have persistent database issues:

```bash
# Run only the database fix
python fix_db.py
```

## API Documentation

When the backend is running, visit http://localhost:10000/docs