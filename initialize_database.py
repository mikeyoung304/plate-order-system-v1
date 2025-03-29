from app.db.database import engine, Base
from app.models.models import Resident, Order, Table, OrderStatus
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db():
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully.")

def create_sample_data():
    from sqlalchemy.orm import Session
    from app.db.database import get_db
    
    db = next(get_db())
    
    # Check if data already exists
    if db.query(Resident).count() > 0:
        logger.info("Sample data already exists. Skipping...")
        return
    
    logger.info("Creating sample data...")
    
    # Create sample residents
    residents = [
        Resident(
            name="John Doe",
            photo_url="/static/img/default-avatar.png",
            medical_dietary=["Diabetic", "Low Sodium"],
            texture_prefs=["Soft"],
            notes="Prefers smaller portions"
        ),
        Resident(
            name="Jane Smith",
            photo_url="/static/img/default-avatar.png",
            medical_dietary=["Gluten Free"],
            texture_prefs=["Regular"],
            notes="Likes extra sauce"
        ),
        Resident(
            name="Robert Johnson",
            photo_url="/static/img/default-avatar.png",
            medical_dietary=["Vegetarian"],
            texture_prefs=["Chopped"],
            notes="Allergic to nuts"
        )
    ]
    
    db.add_all(residents)
    db.commit()
    
    # Create sample tables
    tables = [
        Table(number=1, type="round-4", x=100, y=100, seats=4, shape="round", width=100, height=100, status="available"),
        Table(number=2, type="round-4", x=300, y=100, seats=4, shape="round", width=100, height=100, status="available"),
        Table(number=3, type="square-2", x=500, y=100, seats=2, shape="square", width=80, height=80, status="available"),
        Table(number=4, type="square-2", x=100, y=300, seats=2, shape="square", width=80, height=80, status="available"),
        Table(number=5, type="round-6", x=300, y=300, seats=6, shape="round", width=120, height=120, status="available"),
        Table(number=6, type="round-6", x=500, y=300, seats=6, shape="round", width=120, height=120, status="available")
    ]
    
    db.add_all(tables)
    db.commit()
    
    # Create sample orders
    orders = [
        Order(
            table_id=3,
            resident_id=1,
            details="1 cheeseburger with fries, 1 chicken sandwich, 1 diet coke",
            raw_transcription="Table 3: 1 cheeseburger with fries, 1 chicken sandwich, and 1 diet coke.",
            status=OrderStatus.PENDING
        ),
        Order(
            table_id=5,
            resident_id=2,
            details="2 grilled chicken salads, 1 water",
            raw_transcription="Table 5: 2 grilled chicken salads and 1 water.",
            status=OrderStatus.IN_PROGRESS
        ),
        Order(
            table_id=1,
            resident_id=3,
            details="1 soup of the day, 1 fish special, 2 iced teas",
            raw_transcription="Table 8: 1 soup of the day, 1 fish special, and 2 iced teas.",
            status=OrderStatus.COMPLETED
        )
    ]
    
    db.add_all(orders)
    db.commit()
    
    logger.info("Sample data created successfully.")

if __name__ == "__main__":
    init_db()
    create_sample_data()