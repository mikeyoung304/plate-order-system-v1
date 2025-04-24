from app.database import (
    get_menu_items,
    get_menu_item,
    create_menu_item,
    update_menu_item,
    delete_menu_item
)
from app.schemas.menu import MenuItemCreate, MenuItemUpdate

class MenuRepository:
    def get_all(self):
        return get_menu_items()
    
    def get_by_id(self, item_id: int):
        return get_menu_item(item_id)
    
    def create(self, item: MenuItemCreate):
        return create_menu_item(item.dict())
    
    def update(self, item_id: int, item: MenuItemUpdate):
        return update_menu_item(item_id, item.dict(exclude_unset=True))
    
    def delete(self, item_id: int):
        return delete_menu_item(item_id) 