# Supabase Setup Guide for Plate Order System

Follow these steps to set up your Supabase database tables for the floor plan layout and table creation functionality.

## Step 1: Access Your Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.io)
2. Sign in and select your project (linked to `https://eiipozoogrrfudhjoqms.supabase.co`)

## Step 2: Create Database Tables

1. In the left sidebar, click on "SQL Editor"
2. Click "New Query"
3. Copy and paste the following SQL script into the editor:

```sql
-- Plate Order System Database Setup
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id TEXT,
    seat_number INTEGER,
    items JSONB NOT NULL,
    status TEXT DEFAULT 'new',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create tables (for restaurant floor plan)
CREATE TABLE IF NOT EXISTS tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 4,
    x_position FLOAT,
    y_position FLOAT,
    width FLOAT,
    height FLOAT,
    shape TEXT DEFAULT 'rectangle',
    status TEXT DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create seats table
CREATE TABLE IF NOT EXISTS seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID REFERENCES tables(id) ON DELETE CASCADE,
    seat_number INTEGER NOT NULL,
    x_position FLOAT,
    y_position FLOAT,
    status TEXT DEFAULT 'empty',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sample data: Insert sample menu items
INSERT INTO menu_items (name, description, price, category, image_url, is_available)
VALUES
    ('Classic Burger', 'Beef patty with lettuce, tomato, and cheese', 12.99, 'Entrees', '/static/images/menu/burger.jpg', TRUE),
    ('Caesar Salad', 'Romaine lettuce with Caesar dressing and croutons', 9.99, 'Starters', '/static/images/menu/caesar.jpg', TRUE),
    ('Chocolate Cake', 'Rich chocolate cake with chocolate ganache', 7.99, 'Desserts', '/static/images/menu/chocolate_cake.jpg', TRUE),
    ('Iced Tea', 'Fresh brewed iced tea', 2.99, 'Beverages', '/static/images/menu/iced_tea.jpg', TRUE),
    ('Grilled Salmon', 'Fresh salmon with lemon butter sauce', 18.99, 'Entrees', '/static/images/menu/salmon.jpg', TRUE);

-- Sample data: Insert sample tables
INSERT INTO tables (name, capacity, x_position, y_position, width, height, shape)
VALUES
    ('Table 1', 4, 100, 150, 80, 80, 'rectangle'),
    ('Table 2', 2, 250, 150, 60, 60, 'rectangle'),
    ('Table 3', 6, 400, 150, 120, 80, 'rectangle'),
    ('Table 4', 4, 100, 300, 80, 80, 'circle'),
    ('Table 5', 8, 300, 300, 140, 80, 'rectangle');

-- Sample data: Insert sample seats for each table
-- Table 1 (4 seats)
INSERT INTO seats (table_id, seat_number, x_position, y_position)
SELECT (SELECT id FROM tables WHERE name = 'Table 1'), seat_num, x_pos, y_pos
FROM (
    VALUES 
    (1, 90, 130),  -- Top left
    (2, 170, 130), -- Top right
    (3, 90, 180),  -- Bottom left
    (4, 170, 180)  -- Bottom right
) AS s(seat_num, x_pos, y_pos);

-- Table 2 (2 seats)
INSERT INTO seats (table_id, seat_number, x_position, y_position)
SELECT (SELECT id FROM tables WHERE name = 'Table 2'), seat_num, x_pos, y_pos
FROM (
    VALUES 
    (1, 230, 150), -- Left
    (2, 280, 150)  -- Right
) AS s(seat_num, x_pos, y_pos);

-- Create RLS policies to allow access to these tables
-- Allow read access to menu_items for all users
CREATE POLICY "Allow read access to menu_items" ON menu_items
    FOR SELECT USING (true);

-- Allow insert/update/delete access to authenticated users only
CREATE POLICY "Allow full access to menu_items for authenticated users" ON menu_items
    FOR ALL USING (auth.role() = 'authenticated');

-- Do the same for orders
CREATE POLICY "Allow read access to orders" ON orders
    FOR SELECT USING (true);

CREATE POLICY "Allow full access to orders for authenticated users" ON orders
    FOR ALL USING (auth.role() = 'authenticated');

-- Tables and seats access
CREATE POLICY "Allow read access to tables" ON tables
    FOR SELECT USING (true);

CREATE POLICY "Allow full access to tables for authenticated users" ON tables
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access to seats" ON seats
    FOR SELECT USING (true);

CREATE POLICY "Allow full access to seats for authenticated users" ON seats
    FOR ALL USING (auth.role() = 'authenticated');

-- Enable Row Level Security (RLS)
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;

-- Create functions for auto-updating the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to update the timestamp on all relevant tables
CREATE TRIGGER update_menu_items_updated_at
    BEFORE UPDATE ON menu_items
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_tables_updated_at
    BEFORE UPDATE ON tables
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();
```

4. Click "Run" to execute the script and create all tables

## Step 3: Verify Tables Created

1. In the left sidebar, click "Table Editor"
2. You should now see these tables:
   - menu_items
   - orders
   - tables
   - seats

## Step 4: Restart Your Application

After creating the tables, restart your application:

```bash
./stop_dev.sh && ./start_dev.sh
```

Your floor plan layout and table creation functionality should now work correctly.

## Step 5: Verify RLS Policies

To verify that your Row Level Security (RLS) policies are working correctly, you can test them using the Supabase client:

```javascript
import { createClient } from '@supabase/supabase-js'

// Test with anonymous client (limited permissions)
const anon = createClient(
  'https://eiipozoogrrfudhjoqms.supabase.co',
  '<YOUR_ANON_KEY>'
);

// 1) Try to read (should succeed)
const { data, error: readErr } = await anon
  .from('menu_items')
  .select('*')
console.log('readErr', readErr)    // null
console.log('data', data)          // your rows

// 2) Try to insert (should fail as anon)
const { error: insertErr } = await anon
  .from('menu_items')
  .insert([{ name: 'Test', description: 'x', price:1, category:'x' }])
console.log('insertErr', insertErr) // PERMISSION DENIED

// 3) Now sign in or use the authenticated client…
const auth = createClient(
  'https://eiipozoogrrfudhjoqms.supabase.co',
  '<YOUR_SERVICE_ROLE_OR_JWT_AFTER_LOGIN>'
);
const { error: insertOk } = await auth
  .from('menu_items')
  .insert([{ name: 'Test OK', description: 'y', price:2, category:'y' }])
console.log('insertOk', insertOk) // null → success
```

This confirms that your RLS policies are correctly enforcing:
- Anonymous users can read data but not modify it
- Authenticated users can both read and modify data