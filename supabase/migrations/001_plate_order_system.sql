-- Plate Order System Initial Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create floor_plans table
CREATE TABLE IF NOT EXISTS floor_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    data JSONB NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create tables table
CREATE TABLE IF NOT EXISTS tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    floor_plan_id UUID NOT NULL REFERENCES floor_plans(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    shape TEXT NOT NULL,
    width DOUBLE PRECISION NOT NULL,
    height DOUBLE PRECISION NOT NULL,
    position_x DOUBLE PRECISION NOT NULL,
    position_y DOUBLE PRECISION NOT NULL,
    rotation DOUBLE PRECISION DEFAULT 0,
    seat_count INTEGER DEFAULT 4,
    zone TEXT,
    status TEXT DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create seats table
CREATE TABLE IF NOT EXISTS seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
    number INTEGER NOT NULL,
    position_x DOUBLE PRECISION NOT NULL,
    position_y DOUBLE PRECISION NOT NULL,
    status TEXT DEFAULT 'empty',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID NOT NULL REFERENCES tables(id),
    seat_id UUID NOT NULL REFERENCES seats(id),
    items JSONB NOT NULL,
    transcript TEXT NOT NULL,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_floor_plans_updated_at
    BEFORE UPDATE ON floor_plans
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER set_tables_updated_at
    BEFORE UPDATE ON tables
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER set_seats_updated_at
    BEFORE UPDATE ON seats
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER set_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

-- Enable RLS and policies
ALTER TABLE floor_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "FloorPlans_public_select" ON floor_plans FOR SELECT USING (true);
CREATE POLICY "FloorPlans_auth_full_access" ON floor_plans FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tables_public_select" ON tables FOR SELECT USING (true);
CREATE POLICY "Tables_auth_full_access" ON tables FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Seats_public_select" ON seats FOR SELECT USING (true);
CREATE POLICY "Seats_auth_full_access" ON seats FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orders_public_select" ON orders FOR SELECT USING (true);
CREATE POLICY "Orders_auth_full_access" ON orders FOR ALL USING (auth.role() = 'authenticated');