from supabase import create_client
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from app.db.session import engine, Base
from sqlalchemy.sql import text as sql_text

# Load environment variables
load_dotenv()

# Get Supabase credentials
supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
database_url = os.getenv("DATABASE_URL")

# Create Supabase client
supabase = create_client(supabase_url, supabase_key)

def init_database():
    print("Initializing database tables...")
    
    # Create tables using SQL
    sql_commands = [
        """
        CREATE TABLE IF NOT EXISTS floor_plans (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            data JSONB NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE,
            is_active BOOLEAN DEFAULT FALSE
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS tables (
            id TEXT PRIMARY KEY,
            floor_plan_id TEXT NOT NULL REFERENCES floor_plans(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            shape TEXT NOT NULL,
            width FLOAT NOT NULL,
            height FLOAT NOT NULL,
            position_x FLOAT NOT NULL,
            position_y FLOAT NOT NULL,
            rotation FLOAT DEFAULT 0,
            seat_count INTEGER DEFAULT 4,
            zone TEXT,
            status TEXT DEFAULT 'available'
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS seats (
            id TEXT PRIMARY KEY,
            table_id TEXT NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
            number INTEGER NOT NULL,
            position_x FLOAT NOT NULL,
            position_y FLOAT NOT NULL,
            status TEXT DEFAULT 'empty',
            resident_id TEXT REFERENCES residents(id)
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS residents (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            dietary_restrictions JSONB DEFAULT '[]',
            preferences JSONB DEFAULT '[]',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            table_id TEXT NOT NULL REFERENCES tables(id),
            seat_id TEXT NOT NULL REFERENCES seats(id),
            resident_id TEXT REFERENCES residents(id),
            type TEXT NOT NULL,
            content TEXT NOT NULL,
            status TEXT DEFAULT 'new',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP WITH TIME ZONE
        );
        """
    ]
    
    try:
        # Execute each SQL command
        for command in sql_commands:
            supabase.rpc('exec_sql', {'sql': command}).execute()
            print(f"Executed SQL command successfully")
        
        print("✅ Database initialization completed successfully!")
    except Exception as e:
        print(f"❌ Error initializing database: {e}")

def init_db():
    # Create tables via SQLAlchemy
    Base.metadata.create_all(bind=engine)
    
    # Perform a quick health check with proper use of text()
    with engine.connect() as connection:
        # Using the text() function to wrap raw SQL for SQLAlchemy 2.0 compatibility
        result = connection.execute(text("SELECT 1"))
        print(f"Database connection test successful: {result.scalar()}")

if __name__ == "__main__":
    init_db()