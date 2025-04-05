from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from src.app.db.database import get_db
from src.app.models.models import Order, Table, OrderStatus, Resident

router = APIRouter(
    prefix="/dashboard",
    tags=["dashboard"],
    responses={404: {"description": "Not found"}},
)


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Get statistics for the dashboard
    """
    # Get current date for today's calculations
    today = datetime.now().date()
    tomorrow = today + timedelta(days=1)

    # Get orders statistics
    active_orders = (
        db.query(func.count(Order.id))
        .filter(
            Order.status.in_(
                [OrderStatus.PENDING, OrderStatus.IN_PROGRESS, OrderStatus.READY]
            )
        )
        .scalar()
        or 0
    )

    completed_today = (
        db.query(func.count(Order.id))
        .filter(
            Order.status == OrderStatus.COMPLETED,
            Order.completed_at >= today,
            Order.completed_at < tomorrow,
        )
        .scalar()
        or 0
    )

    avg_completion_time = 0
    completed_orders = (
        db.query(Order)
        .filter(Order.status == OrderStatus.COMPLETED, Order.completed_at.isnot(None))
        .all()
    )

    if completed_orders:
        total_completion_time = sum(
            (order.completed_at - order.created_at).total_seconds() / 60
            for order in completed_orders
        )
        avg_completion_time = round(total_completion_time / len(completed_orders), 1)

    # Get table statistics
    total_tables = db.query(func.count(Table.id)).scalar() or 0
    occupied_tables = (
        db.query(func.count(Table.id)).filter(Table.status == "occupied").scalar() or 0
    )
    available_tables = (
        db.query(func.count(Table.id)).filter(Table.status == "available").scalar() or 0
    )

    # Get resident statistics
    total_residents = db.query(func.count(Resident.id)).scalar() or 0

    # Return combined stats
    return {
        "orders": {
            "active": active_orders,
            "completed_today": completed_today,
            "avg_completion_time": avg_completion_time,
        },
        "tables": {
            "total": total_tables,
            "occupied": occupied_tables,
            "available": available_tables,
            "occupancy_rate": (
                round((occupied_tables / total_tables) * 100, 1)
                if total_tables > 0
                else 0
            ),
        },
        "residents": {"total": total_residents},
    }
