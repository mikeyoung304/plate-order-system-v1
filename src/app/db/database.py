from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Explicitly set database URL to ensure consistency
DATABASE_URL = "sqlite:///./restaurant.db"

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    connect_args=(
        {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
    ),
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create declarative base
Base = declarative_base()


# Dependency for getting database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
