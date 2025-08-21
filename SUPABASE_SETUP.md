# Supabase Database Setup Guide

## 🔧 Complete Database Migration SQL

Copy and paste this SQL into your **Supabase SQL Editor** to create all required tables:

```sql
-- ========================================
-- SUPABASE DATABASE SETUP FOR ECOMMERCE APP
-- ========================================

-- 1. Categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Products table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    images TEXT[] DEFAULT '{}',
    variants JSONB DEFAULT '[]',
    category_id TEXT REFERENCES categories(id),
    total_stock INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    home TEXT,
    road TEXT,
    block TEXT,
    town TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES customers(id),
    items JSONB NOT NULL DEFAULT '[]',
    total DECIMAL(10,2) NOT NULL,
    status TEXT CHECK (status IN ('processing', 'ready', 'delivered', 'picked-up')) DEFAULT 'processing',
    delivery_type TEXT CHECK (delivery_type IN ('delivery', 'pickup')) DEFAULT 'delivery',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Insert default categories
INSERT INTO categories (id, name, created_at) VALUES
    ('1', 'Electronics', NOW()),
    ('2', 'Accessories', NOW()),
    ('3', 'Home & Office', NOW())
ON CONFLICT (id) DO NOTHING;

-- 6. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 8. Create permissive policies for all operations
-- Note: Adjust these policies based on your authentication requirements

-- Categories policies
DROP POLICY IF EXISTS "Enable all operations for all users" ON categories;
CREATE POLICY "Enable all operations for all users" ON categories FOR ALL USING (true) WITH CHECK (true);

-- Products policies
DROP POLICY IF EXISTS "Enable all operations for all users" ON products;
CREATE POLICY "Enable all operations for all users" ON products FOR ALL USING (true) WITH CHECK (true);

-- Customers policies
DROP POLICY IF EXISTS "Enable all operations for all users" ON customers;
CREATE POLICY "Enable all operations for all users" ON customers FOR ALL USING (true) WITH CHECK (true);

-- Orders policies
DROP POLICY IF EXISTS "Enable all operations for all users" ON orders;
CREATE POLICY "Enable all operations for all users" ON orders FOR ALL USING (true) WITH CHECK (true);

-- 9. Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 10. Optional: Insert sample data for testing
INSERT INTO customers (id, name, phone, address, home, road, block, town, created_at, updated_at) VALUES
    ('1', 'Alice Johnson', '+1 (555) 123-4567', 'House 123, Road 15, Block 304, Springfield', '123', '15', '304', 'Springfield', NOW(), NOW()),
    ('2', 'Bob Smith', '+1 (555) 234-5678', 'House 456, Road 22, Block 205, Manama', '456', '22', '205', 'Manama', NOW(), NOW()),
    ('3', 'Carol Davis', '+1 (555) 345-6789', 'House 789, Road 33, Block 102, Riffa', '789', '33', '102', 'Riffa', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Success message
SELECT 'Database setup completed successfully! All tables, indexes, and policies created.' AS status;
```

## 🔑 Environment Variables for Fly.io

Set these **exact environment variable names** in your fly.io deployment:

### Required Variables:

```bash
# Copy these variable names exactly:
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

### How to set them in fly.io:

```bash
# Method 1: Using fly CLI
flyctl secrets set SUPABASE_URL="https://your-project-ref.supabase.co"
flyctl secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Method 2: Using fly.io dashboard
# Go to your app → Settings → Secrets
# Add each variable name and value
```

## 📍 Where to find your Supabase credentials:

1. **Go to your Supabase project dashboard**
2. **Click "Settings" → "API"**
3. **Copy these values:**
   - **Project URL** → Use as `SUPABASE_URL`
   - **service_role (secret)** → Use as `SUPABASE_SERVICE_ROLE_KEY`

## ✅ Verification Steps:

1. **Run the SQL** in Supabase SQL Editor
2. **Set environment variables** in fly.io
3. **Deploy your app** again
4. **Run diagnostics** in your app's Settings → System Settings
5. **Expected result:** 5/5 API endpoints working

## 🚨 Security Note:

The policies created are permissive (allow all operations). In production, you should implement proper Row Level Security policies based on your authentication needs.

## 📊 Expected Database Structure:

- ✅ `categories` - Product categories
- ✅ `products` - Product catalog with variants
- ✅ `customers` - Customer information
- ✅ `orders` - Order management
- ✅ Performance indexes
- ✅ Row Level Security enabled
- ✅ Proper foreign key relationships
