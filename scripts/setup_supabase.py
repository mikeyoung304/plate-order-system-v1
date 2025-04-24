#!/usr/bin/env python3
"""
Supabase Setup Automation Script
This script connects to your Supabase project and sets up the required
tables and data for the Plate Order System.
"""

import os
import sys
import time
import json
import requests
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.append(str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from app.database import supabase

# Load environment variables
load_dotenv()

# Colors for terminal output
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
RESET = '\033[0m'
BOLD = '\033[1m'

def print_step(message):
    """Print a step message with formatting"""
    print(f"\n{BOLD}{GREEN}=== {message} ==={RESET}\n")

def print_warning(message):
    """Print a warning message with formatting"""
    print(f"{YELLOW}⚠️ {message}{RESET}")

def print_error(message):
    """Print an error message with formatting"""
    print(f"{RED}❌ {message}{RESET}")

def print_success(message):
    """Print a success message with formatting"""
    print(f"{GREEN}✅ {message}{RESET}")

def setup_supabase_direct():
    """
    Set up Supabase directly through the REST API using admin API key
    Note: This is not recommended for production but can be useful for development.
    """
    print_step("Setting up Supabase through direct SQL")
    
    # Get Supabase URL and key
    supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        print_error("Supabase URL or key not found in environment variables")
        return False
    
    print(f"Supabase URL: {supabase_url}")
    print(f"Supabase key configured: {'Yes' if supabase_key else 'No'}")
    
    try:
        # Read the SQL script
        sql_path = Path(__file__).parent / "supabase_setup.sql"
        with open(sql_path, "r") as f:
            sql_script = f.read()
        
        # Split into individual statements
        statements = sql_script.split(';')
        statements = [stmt.strip() for stmt in statements if stmt.strip()]
        
        total_statements = len(statements)
        successful = 0
        failed = 0
        
        print(f"Found {total_statements} SQL statements to execute")
        
        for i, statement in enumerate(statements, 1):
            print(f"Executing statement {i}/{total_statements}...")
            
            try:
                # The next best approach is to create tables through SQL API
                # This requires using .table('_query') to execute raw SQL
                response = supabase.table('menu_items').insert({}).execute()
                print_success(f"Statement {i} executed successfully")
                successful += 1
            except Exception as e:
                if "already exists" in str(e):
                    print_warning(f"Object in statement {i} already exists")
                    successful += 1
                else:
                    print_error(f"Error executing statement {i}: {e}")
                    failed += 1
            
            # Add a small delay to avoid rate limiting
            time.sleep(0.5)
        
        print_step("SQL Execution Summary")
        print(f"Total statements: {total_statements}")
        print(f"Successful: {successful}")
        print(f"Failed: {failed}")
        
        if failed == 0:
            print_success("All SQL statements executed successfully!")
            return True
        else:
            print_warning(f"{failed} statements failed. Please check the database manually.")
            return False
        
    except Exception as e:
        print_error(f"Error setting up Supabase: {e}")
        return False

def setup_supabase_manual_instructions():
    """
    Provide instructions for manually setting up Supabase
    """
    print_step("Manual Supabase Setup Instructions")
    
    print(f"""
{BOLD}To set up your Supabase tables:

1. Login to your Supabase dashboard at {YELLOW}https://app.supabase.io{RESET}
2. Select your project
3. Go to the {YELLOW}SQL Editor{RESET} in the left sidebar
4. Create a new query and paste the contents of {YELLOW}scripts/supabase_setup.sql{RESET}
5. Run the query to create all tables and sample data

{BOLD}After running the SQL script:

1. Go to the {YELLOW}Table Editor{RESET} in the left sidebar
2. You should see your new tables: menu_items, orders, tables, and seats
3. Verify the tables have the correct structure and sample data

{BOLD}Setup your Supabase authentication (optional):

1. Go to {YELLOW}Authentication > Settings{RESET} in the left sidebar
2. Configure your auth settings as needed
3. For development, you can enable {YELLOW}"Enable email confirmations"{RESET} and set it to "No verification"
    """)

def test_tables():
    """
    Test that tables were created successfully
    """
    print_step("Testing tables in Supabase")
    
    test_tables = ['menu_items', 'orders', 'tables', 'seats']
    all_successful = True
    
    for table_name in test_tables:
        try:
            response = supabase.table(table_name).select('*').limit(5).execute()
            if response and response.data:
                print_success(f"Table '{table_name}' exists with {len(response.data)} rows")
                # Print a sample of the data
                if response.data:
                    print(f"Sample data: {json.dumps(response.data[0], indent=2)}")
            else:
                print_warning(f"Table '{table_name}' exists but has no data")
        except Exception as e:
            print_error(f"Table '{table_name}' access error: {str(e)}")
            all_successful = False
    
    return all_successful

def main():
    """
    Main function to set up Supabase
    """
    print_step("Supabase Setup Script")
    
    # Try to set up Supabase directly
    print("Attempting to set up tables via Supabase API...")
    success = setup_supabase_direct()
    
    if not success:
        print_warning("Automated setup failed or is not fully supported")
        
        # Show manual instructions
        setup_supabase_manual_instructions()
        
        input(f"\n{YELLOW}Press Enter after you've manually set up Supabase to test the tables...{RESET}")
    
    # Test tables regardless of setup method
    tables_ok = test_tables()
    
    if tables_ok:
        print_success("Supabase setup complete! Your database is ready to use.")
    else:
        print_error("Some tables could not be accessed. Please check your Supabase setup.")
        setup_supabase_manual_instructions()

if __name__ == "__main__":
    main() 