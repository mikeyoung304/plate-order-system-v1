from supabase import create_client
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get Supabase credentials from environment variables
supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

# Create Supabase client
supabase = create_client(supabase_url, supabase_key)

# Menu functions
def get_menu_items():
    try:
        response = supabase.table('menu_items').select("*").execute()
        return response.data
    except Exception as e:
        print(f"Error getting menu items: {e}")
        return []

def get_menu_item(item_id):
    try:
        response = supabase.table('menu_items').select("*").eq('id', item_id).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        print(f"Error getting menu item: {e}")
        return None

def create_menu_item(item_data):
    try:
        response = supabase.table('menu_items').insert(item_data).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        print(f"Error creating menu item: {e}")
        return None

def update_menu_item(item_id, item_data):
    try:
        response = supabase.table('menu_items').update(item_data).eq('id', item_id).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        print(f"Error updating menu item: {e}")
        return None

def delete_menu_item(item_id):
    try:
        response = supabase.table('menu_items').delete().eq('id', item_id).execute()
        return True
    except Exception as e:
        print(f"Error deleting menu item: {e}")
        return False

# Order functions
def get_orders():
    try:
        response = supabase.table('orders').select("*").execute()
        return response.data
    except Exception as e:
        print(f"Error getting orders: {e}")
        return []

def create_order(order_data):
    try:
        response = supabase.table('orders').insert(order_data).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        print(f"Error creating order: {e}")
        return None 