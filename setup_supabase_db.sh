#!/bin/bash
# Simple Supabase Setup Script for Plate Order System

echo "========================================================"
echo "Plate Order System - Supabase Database Setup"
echo "========================================================"

# Check if we have the required Supabase credentials
source backend/.env
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ "$NEXT_PUBLIC_SUPABASE_URL" == "https://your-project-id.supabase.co" ]; then
  echo "⚠️  Your Supabase URL is not properly set in backend/.env!"
  echo "    Please update the file with your actual Supabase credentials."
  echo ""
  echo "1. Go to https://supabase.com and sign up/login"
  echo "2. Create a new project"
  echo "3. Once created, go to Project Settings > API"
  echo "4. Copy the 'Project URL' and 'anon/public' key"
  echo "5. Update backend/.env with these values"
  echo ""
  echo "Example:"
  echo "NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklm.supabase.co"
  echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5..."
  exit 1
fi

echo "✅ Found Supabase credentials in backend/.env"
echo "   URL: $NEXT_PUBLIC_SUPABASE_URL"
echo ""

echo "========================================================"
echo "Manual Setup Instructions for Supabase Database"
echo "========================================================"
echo ""
echo "To set up your Supabase database tables:"
echo ""
echo "1. Log in to your Supabase dashboard at https://app.supabase.io"
echo "2. Select your project"
echo "3. Go to the SQL Editor in the left sidebar"
echo "4. Create a new query"
echo "5. Copy and paste the contents of the SQL file below into the editor:"
echo "   scripts/supabase_setup.sql"
echo "6. Click 'Run' to execute the SQL and create all tables and sample data"
echo ""
echo "After running the SQL script:"
echo "1. Go to the Table Editor in the left sidebar" 
echo "2. Verify you can see tables: menu_items, orders, tables, and seats"
echo "3. If they have data, the setup was successful!"
echo ""
echo "========================================================"
echo "Once your database is set up, restart the application:"
echo "   ./stop_dev.sh && ./start_dev.sh"
echo "========================================================"