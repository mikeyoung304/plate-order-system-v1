from supabase import create_client, Client
import os
from dotenv import load_dotenv
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Get Supabase credentials from environment variables
supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

# Create Supabase client with error handling
supabase = None
try:
    if not supabase_url or not supabase_key:
        logger.warning("Supabase credentials missing or invalid. Some features may not work.")
        logger.warning(f"URL: {supabase_url or 'Missing'}")
        logger.warning(f"Key: {'Present' if supabase_key else 'Missing'}")
    else:
        supabase = create_client(supabase_url, supabase_key)
        logger.info(f"Supabase client initialized with URL: {supabase_url}")
except Exception as e:
    logger.error(f"Failed to initialize Supabase client: {e}")

# Menu functions
def get_menu_items():
    if not supabase:
        logger.error("Cannot get menu items: Supabase client not initialized")
        return []
    try:
        response = supabase.table('menu_items').select("*").execute()
        return response.data
    except Exception as e:
        logger.error(f"Error getting menu items: {e}")
        return []

def get_menu_item(item_id):
    if not supabase:
        logger.error("Cannot get menu item: Supabase client not initialized")
        return None
    try:
        response = supabase.table('menu_items').select("*").eq('id', item_id).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        logger.error(f"Error getting menu item: {e}")
        return None

def create_menu_item(item_data):
    if not supabase:
        logger.error("Cannot create menu item: Supabase client not initialized")
        return None
    try:
        response = supabase.table('menu_items').insert(item_data).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        logger.error(f"Error creating menu item: {e}")
        return None

def update_menu_item(item_id, item_data):
    if not supabase:
        logger.error("Cannot update menu item: Supabase client not initialized")
        return None
    try:
        response = supabase.table('menu_items').update(item_data).eq('id', item_id).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        logger.error(f"Error updating menu item: {e}")
        return None

def delete_menu_item(item_id):
    if not supabase:
        logger.error("Cannot delete menu item: Supabase client not initialized")
        return False
    try:
        response = supabase.table('menu_items').delete().eq('id', item_id).execute()
        return True
    except Exception as e:
        logger.error(f"Error deleting menu item: {e}")
        return False

# Order functions
def get_orders():
    if not supabase:
        logger.error("Cannot get orders: Supabase client not initialized")
        return []
    try:
        response = supabase.table('orders').select("*").execute()
        return response.data
    except Exception as e:
        logger.error(f"Error getting orders: {e}")
        return []

def create_order(order_data):
    if not supabase:
        logger.error("Cannot create order: Supabase client not initialized")
        return None
    try:
        response = supabase.table('orders').insert(order_data).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        logger.error(f"Error creating order: {e}")
        return None

# Tables functions
def get_tables():
    if not supabase:
        logger.error("Cannot get tables: Supabase client not initialized")
        return []
    try:
        response = supabase.table('tables').select("*").execute()
        return response.data
    except Exception as e:
        logger.error(f"Error getting tables: {e}")
        return []

def create_table(table_data):
    if not supabase:
        logger.error("Cannot create table: Supabase client not initialized")
        return None
    try:
        response = supabase.table('tables').insert(table_data).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        logger.error(f"Error creating table: {e}")
        return None