from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.api.v1.dependencies.db import get_db
from app.db.models import Table # Keep this, points to the correct central models file now
from app.db.repositories.tables import TableRepository
from app.api.v1.schemas import Table, TableCreate, TableUpdate # Use central schemas and correct response model name

router = APIRouter()
# Remove module-level repository instance

@router.get("/", response_model=List[Table])
def get_tables(db: Session = Depends(get_db)):
    """Get all tables"""
    return TableRepository.get_all(db) # Call repository method via class

@router.get("/{table_id}", response_model=Table)
def get_table(table_id: str, db: Session = Depends(get_db)): # Use str for ID
    """Get a specific table by ID"""
    table = TableRepository.get_by_id(db, table_id) # Call repository method via class
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    return table

@router.post("/", response_model=Table)
def create_table(table: TableCreate, db: Session = Depends(get_db)):
    """Create a new table"""
    return TableRepository.create(db, table) # Call repository method via class

@router.put("/{table_id}", response_model=Table)
def update_table(table_id: str, table: TableUpdate, db: Session = Depends(get_db)): # Use str for ID
    """Update a table"""
    updated_table = TableRepository.update(db, table_id, table) # Call repository method via class
    if not updated_table:
        raise HTTPException(status_code=404, detail="Table not found")
    return updated_table

@router.delete("/{table_id}")
def delete_table(table_id: str, db: Session = Depends(get_db)): # Use str for ID
    """Delete a table"""
    success = TableRepository.delete(db, table_id) # Call repository method via class
    if not success:
        raise HTTPException(status_code=404, detail="Table not found")
    return {"message": "Table deleted successfully"} 