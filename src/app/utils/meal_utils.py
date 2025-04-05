from typing import List, Optional
from sqlalchemy.orm import Session
from src.app.models.models import Order, Resident  # Removed MealPeriod, DailySpecial

# get_current_meal_period function removed


def get_frequent_orders(
    db: Session,
    resident_id: int,
    # meal_period parameter removed
    limit: int = 3,
) -> List[Order]:
    """
    Get the most frequently ordered items for a resident during a specific meal period

    Args:
        db: The database session
        resident_id: The resident's ID
        # meal_period argument removed
        limit: Maximum number of orders to return

    Returns:
        List[Order]: List of the resident's most frequent orders
    """
    # Get completed orders for this resident and meal period
    orders = (
        db.query(Order)
        .filter(
            Order.resident_id == resident_id,
            # meal_period filter removed
            Order.status == "completed",
        )
        .order_by(Order.created_at.desc())
        .all()
    )

    # Count frequency of each order detail
    order_counts = {}
    for order in orders:
        if order.details in order_counts:
            order_counts[order.details] += 1
        else:
            order_counts[order.details] = 1

    # Sort by frequency (highest first)
    sorted_orders = sorted(
        orders, key=lambda o: order_counts.get(o.details, 0), reverse=True
    )

    # Return unique orders (by details) up to the limit
    unique_orders = []
    seen_details = set()

    for order in sorted_orders:
        if order.details not in seen_details:
            unique_orders.append(order)
            seen_details.add(order.details)

        if len(unique_orders) >= limit:
            break

    return unique_orders


def get_resident_for_seat(
    db: Session, table_id: int, seat_number: int
) -> Optional[Resident]:
    """
    Try to determine which resident typically sits at a specific table and seat

    Args:
        db: The database session
        table_id: The table ID
        seat_number: The seat number

    Returns:
        Optional[Resident]: The resident if found, None otherwise
    """
    # First, check if any resident has this as their preferred seat
    resident = (
        db.query(Resident)
        .filter(
            Resident.preferred_table_id == table_id,
            Resident.preferred_seat_number == seat_number,
        )
        .first()
    )

    if resident:
        return resident

    # If no resident has this as their preferred seat, look at order history
    # Count how many times each resident has ordered from this seat
    from sqlalchemy import func, desc

    resident_counts = (
        db.query(Order.resident_id, func.count(Order.id).label("order_count"))
        .filter(
            Order.table_id == table_id,
            Order.seat_number == seat_number,
            Order.resident_id.isnot(None),
        )
        .group_by(Order.resident_id)
        .order_by(desc("order_count"))
        .first()
    )

    if resident_counts and resident_counts.resident_id:
        return (
            db.query(Resident)
            .filter(Resident.id == resident_counts.resident_id)
            .first()
        )

    return None


# get_daily_special function removed
