-- COMPLETE DATABASE RESET AND SETUP
-- This script safely handles all edge cases and creates a clean database

-- Step 1: Clean slate - Drop everything safely
DROP VIEW IF EXISTS order_details CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;

-- Drop any existing functions
DROP FUNCTION IF EXISTS get_order_stats() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Step 2: Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 3: Create tables in correct order (categories first, then products)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_ar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    home TEXT,
    road TEXT,
    block TEXT,
    town TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table AFTER categories table exists
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_ar TEXT,
    description TEXT,
    description_ar TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    images JSONB DEFAULT '[]'::jsonb,
    variants JSONB DEFAULT '[]'::jsonb,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    total_stock INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'delivered', 'picked-up')),
    delivery_type TEXT NOT NULL DEFAULT 'delivery' CHECK (delivery_type IN ('delivery', 'pickup')),
    delivery_area TEXT DEFAULT 'sitra' CHECK (delivery_area IN ('sitra', 'muharraq', 'other')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create indexes AFTER all tables exist
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_created_at ON products(created_at);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_admin_users_email ON admin_users(email);

-- Step 5: Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 6: Create triggers
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Disable RLS for development
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- Step 8: Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_users TO authenticated;

-- Step 9: Insert default data
INSERT INTO categories (name, name_ar) VALUES
    ('Electronics', 'الأجهزة الإلكترونية'),
    ('Accessories', 'الإكسسوارات'),
    ('Home & Office', 'المنزل والمكتب');

-- Step 10: Insert sample data with proper references
DO $$
DECLARE
    electronics_id UUID;
    accessories_id UUID;
    customer1_id UUID;
    customer2_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO electronics_id FROM categories WHERE name = 'Electronics' LIMIT 1;
    SELECT id INTO accessories_id FROM categories WHERE name = 'Accessories' LIMIT 1;

    -- Insert products
    INSERT INTO products (name, name_ar, description, description_ar, price, images, variants, category_id, total_stock) VALUES
        ('Sample Product 1', 'منتج تجريبي 1', 'This is a sample product for testing', 'هذا منتج تجريبي للاختبار', 35.00, '["https://via.placeholder.com/300"]', '[]', electronics_id, 10),
        ('Sample Product 2', 'منتج تجريبي 2', 'Another sample product', 'منتج تجريبي آخر', 17.50, '["https://via.placeholder.com/300"]', '[]', accessories_id, 5);

    -- Insert customers
    INSERT INTO customers (name, phone, address, town) VALUES
        ('Test Customer', '+973 36283382', 'Test Address', 'Manama'),
        ('Sample Customer', '+973 12345678', 'Sample Address', 'Sitra');

    -- Insert admin user
    INSERT INTO admin_users (email, password_hash) VALUES
        ('admin@azharstore.com', '$2b$10$rKvK0YjMlJMK0ZYZYQGzKOKEGYZzKGYzKOKEGYZzKOKEGYZzKOKEGY');

END $$;

-- Step 11: Create view
CREATE VIEW order_details AS
SELECT
    o.*,
    c.name as customer_name,
    c.phone as customer_phone,
    c.address as customer_address,
    c.home as customer_home,
    c.road as customer_road,
    c.block as customer_block,
    c.town as customer_town
FROM orders o
JOIN customers c ON o.customer_id = c.id;

-- Step 12: Create statistics function
CREATE OR REPLACE FUNCTION get_order_stats()
RETURNS TABLE (
    total_orders BIGINT,
    total_revenue DECIMAL,
    orders_today BIGINT,
    revenue_today DECIMAL,
    orders_this_month BIGINT,
    revenue_this_month DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_orders,
        COALESCE(SUM(total), 0) as total_revenue,
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as orders_today,
        COALESCE(SUM(total) FILTER (WHERE DATE(created_at) = CURRENT_DATE), 0) as revenue_today,
        COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)) as orders_this_month,
        COALESCE(SUM(total) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)), 0) as revenue_this_month
    FROM orders;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 13: Grant permissions on new objects
GRANT SELECT ON order_details TO service_role;
GRANT SELECT ON order_details TO authenticated;
GRANT EXECUTE ON FUNCTION get_order_stats() TO service_role;
GRANT EXECUTE ON FUNCTION get_order_stats() TO authenticated;

-- Success message
SELECT 'Database setup completed successfully!' as status;
