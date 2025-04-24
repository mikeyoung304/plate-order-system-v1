from fastapi import APIRouter, HTTPException
from typing import List
from app.db.repositories.menu import MenuRepository
from app.api.v1.schemas import MenuItemCreate, MenuItemUpdate, MenuItem # Import from central schemas

router = APIRouter()
menu_repo = MenuRepository()

@router.get("/", response_model=List[MenuItem])
def get_menu_items():
    return menu_repo.get_all()

@router.get("/{item_id}", response_model=MenuItem)
def get_menu_item(item_id: int):
    item = menu_repo.get_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return item

@router.post("/", response_model=MenuItem)
def create_menu_item(item: MenuItemCreate):
    return menu_repo.create(item)

@router.put("/{item_id}", response_model=MenuItem)
def update_menu_item(item_id: int, item: MenuItemUpdate):
    updated_item = menu_repo.update(item_id, item)
    if not updated_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return updated_item

@router.delete("/{item_id}")
def delete_menu_item(item_id: int):
    if not menu_repo.delete(item_id):
        raise HTTPException(status_code=404, detail="Menu item not found")
    return {"message": "Menu item deleted successfully"} 