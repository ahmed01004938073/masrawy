-- ========================================
-- Afleet Store - Supabase Database Setup
-- ========================================
-- Project: rndbsoyjjlpdsydtdqrk
-- Generated: 2025-12-14
--
-- Instructions:
-- 1. Open Supabase Dashboard > SQL Editor
-- 2. Copy this entire file
-- 3. Paste and click "Run"
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 1. USERS TABLE
-- ========================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'customer', -- 'customer', 'marketer', 'admin'
  
  -- Marketer specific
  referral_code VARCHAR(50) UNIQUE,
  referred_by UUID REFERENCES users(id),
  commission_rate DECIMAL(5,2) DEFAULT 0.00,
  
  -- Address
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_role ON users(role);

-- ========================================
-- 2. CATEGORIES TABLE
-- ========================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES categories(id),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(is_active);

-- ========================================
-- 3. PRODUCTS TABLE
-- ========================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  description TEXT,
  description_ar TEXT,
  
  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2),
  discount_price DECIMAL(10,2),
  commission DECIMAL(10,2) DEFAULT 0.00,
  
  -- Inventory
  stock INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  sku VARCHAR(100) UNIQUE,
  barcode VARCHAR(100),
  
  -- Organization
  category_id UUID REFERENCES categories(id),
  manufacturer VARCHAR(255),
  
  -- Media
  image_url TEXT,
  images JSONB,
  
  -- SEO
  slug VARCHAR(255) UNIQUE,
  meta_title VARCHAR(255),
  meta_description TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_featured ON products(is_featured);

-- ========================================
-- 4. ORDERS TABLE
-- ========================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Customer
  customer_id UUID REFERENCES users(id),
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),
  
  -- Address
  shipping_address TEXT NOT NULL,
  shipping_city VARCHAR(100),
  shipping_state VARCHAR(100),
  
  -- Marketer
  marketer_id UUID REFERENCES users(id),
  marketer_name VARCHAR(255),
  commission DECIMAL(10,2) DEFAULT 0.00,
  
  -- Pricing
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0.00,
  discount DECIMAL(10,2) DEFAULT 0.00,
  total DECIMAL(10,2) NOT NULL,
  
  -- Payment
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  paid_amount DECIMAL(10,2) DEFAULT 0.00,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending',
  section VARCHAR(50) DEFAULT 'orders',
  
  -- Delivery
  delivery_date DATE,
  delivered_at TIMESTAMP,
  
  -- Notes
  notes TEXT,
  admin_notes TEXT,
  cancellation_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_marketer ON orders(marketer_id);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_section ON orders(section);
CREATE INDEX idx_orders_created ON orders(created_at);

-- ========================================
-- 5. ORDER ITEMS TABLE
-- ========================================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  
  -- Product snapshot
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(100),
  
  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  commission DECIMAL(10,2) DEFAULT 0.00,
  
  -- Partial delivery
  status VARCHAR(50) DEFAULT 'pending',
  delivered_quantity INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- ========================================
-- 6. WALLET TRANSACTIONS TABLE
-- ========================================
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Transaction
  type VARCHAR(50) NOT NULL, -- credit, debit, withdrawal
  amount DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  
  -- Reference
  reference_type VARCHAR(50),
  reference_id UUID,
  description TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_wallet_user ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_type ON wallet_transactions(type);
CREATE INDEX idx_wallet_created ON wallet_transactions(created_at);

-- ========================================
-- 7. WITHDRAWAL REQUESTS TABLE
-- ========================================
CREATE TABLE withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Amount
  amount DECIMAL(10,2) NOT NULL,
  
  -- Payment
  payment_method VARCHAR(50) NOT NULL,
  account_details TEXT NOT NULL,
  wallet_number VARCHAR(100),
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending',
  
  -- Admin
  processed_by UUID REFERENCES users(id),
  processed_at TIMESTAMP,
  rejection_reason TEXT,
  admin_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_withdrawal_user ON withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_status ON withdrawal_requests(status);
CREATE INDEX idx_withdrawal_created ON withdrawal_requests(created_at);

-- ========================================
-- 8. FAVORITES TABLE
-- ========================================
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_product ON favorites(product_id);

-- ========================================
-- 9. CART ITEMS TABLE
-- ========================================
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_cart_user ON cart_items(user_id);
CREATE INDEX idx_cart_product ON cart_items(product_id);

-- ========================================
-- 10. SITE SETTINGS TABLE
-- ========================================
CREATE TABLE site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_settings_key ON site_settings(key);

-- ========================================
-- 11. NOTIFICATIONS TABLE
-- ========================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Content
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50),
  action_url TEXT,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- ========================================
-- FUNCTIONS & TRIGGERS
-- ========================================

-- Auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_withdrawal_requests_updated_at BEFORE UPDATE ON withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- UTILITY FUNCTIONS
-- ========================================

-- Get wallet balance
CREATE OR REPLACE FUNCTION get_wallet_balance(user_uuid UUID)
RETURNS DECIMAL AS $$
  SELECT COALESCE(SUM(
    CASE 
      WHEN type = 'credit' THEN amount
      WHEN type IN ('debit', 'withdrawal') THEN -amount
      ELSE 0
    END
  ), 0) 
  FROM wallet_transactions 
  WHERE user_id = user_uuid;
$$ LANGUAGE SQL;

-- ========================================
-- VIEWS
-- ========================================

-- Marketer summary view
CREATE VIEW marketer_summary AS
SELECT 
  u.id,
  u.full_name,
  u.email,
  u.phone,
  u.referral_code,
  COUNT(DISTINCT o.id) as total_orders,
  COALESCE(SUM(o.commission), 0) as total_commission,
  get_wallet_balance(u.id) as current_balance,
  COUNT(DISTINCT wr.id) FILTER (WHERE wr.status = 'pending') as pending_withdrawals
FROM users u
LEFT JOIN orders o ON o.marketer_id = u.id
LEFT JOIN withdrawal_requests wr ON wr.user_id = u.id
WHERE u.role = 'marketer'
GROUP BY u.id;

-- Order statistics view
CREATE VIEW order_statistics AS
SELECT 
  status,
  section,
  COUNT(*) as count,
  SUM(total) as total_amount,
  SUM(commission) as total_commission,
  DATE(created_at) as order_date
FROM orders
GROUP BY status, section, DATE(created_at);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Public read access for products and categories
CREATE POLICY "Public products read" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Public categories read" ON categories FOR SELECT USING (is_active = true);

-- Users can read their own data
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Users can manage their own cart
CREATE POLICY "Users manage own cart" ON cart_items FOR ALL USING (auth.uid() = user_id);

-- Users can manage their own favorites
CREATE POLICY "Users manage own favorites" ON favorites FOR ALL USING (auth.uid() = user_id);

-- Users can view their own orders
CREATE POLICY "Users view own orders" ON orders FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = marketer_id);

-- Users can view their own wallet
CREATE POLICY "Users view own wallet" ON wallet_transactions FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own withdrawals
CREATE POLICY "Users view own withdrawals" ON withdrawal_requests FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own notifications
CREATE POLICY "Users view own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '✅ Database setup completed successfully!';
  RAISE NOTICE '📊 Created 11 tables with indexes';
  RAISE NOTICE '🔧 Created triggers and functions';
  RAISE NOTICE '📈 Created 2 useful views';
  RAISE NOTICE '🔒 Enabled Row Level Security';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Your Afleet Store database is ready!';
END $$;
