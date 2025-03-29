from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Order, OrderStatus
from datetime import datetime, timedelta

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/stats")
def get_admin_stats(db: Session = Depends(get_db)):
    # Count total orders today
    today = datetime.now().date()
    tomorrow = today + timedelta(days=1)
    total_orders_today = db.query(Order).filter(
        Order.created_at >= today,
        Order.created_at < tomorrow
    ).count()
    
    # Calculate average preparation time
    completed_orders = db.query(Order).filter(
        Order.status == OrderStatus.COMPLETED,
        Order.completed_at.isnot(None)
    ).all()
    
    avg_prep_time = 0
    if completed_orders:
        total_prep_time = sum((order.completed_at - order.created_at).total_seconds() / 60 for order in completed_orders)
        avg_prep_time = round(total_prep_time / len(completed_orders), 1)
    
    return {
        "total_orders_today": total_orders_today,
        "avg_prep_time": avg_prep_time
    }
