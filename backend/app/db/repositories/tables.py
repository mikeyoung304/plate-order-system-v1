from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.models import Table
from app.api.v1.schemas import TableCreate, TableUpdate # Use central schemas

class TableRepository:
    def get_all(self, db: Session) -> List[Table]:
        return db.query(Table).all()

    def get_by_id(self, db: Session, table_id: str) -> Optional[Table]:
        return db.query(Table).filter(Table.id == table_id).first()

    def create(self, db: Session, table: TableCreate) -> Table:
        db_table = Table(**table.dict())
        db.add(db_table)
        db.commit()
        db.refresh(db_table)
        return db_table

    def update(self, db: Session, table_id: str, table: TableUpdate) -> Optional[Table]:
        db_table = self.get_by_id(db, table_id)
        if db_table:
            for key, value in table.dict(exclude_unset=True).items():
                setattr(db_table, key, value)
            db.commit()
            db.refresh(db_table)
        return db_table

    def delete(self, db: Session, table_id: str) -> bool:
        db_table = self.get_by_id(db, table_id)
        if db_table:
            db.delete(db_table)
            db.commit()
            return True
        return False 