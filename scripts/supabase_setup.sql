-- Plate Order System Database Setup
-- Run this in the Supabase SQL Editor to initialize your database

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