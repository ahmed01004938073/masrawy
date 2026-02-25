# قاعدة بيانات المشروع - Supabase Database Schema

## نظرة عامة
هذا الملف يوثق بنية قاعدة البيانات الكاملة للمشروع على Supabase (PostgreSQL).
يمكن استخدامه كمرجع عند الانتقال من localStorage إلى استضافة بيانات حقيقية.

---

## خطوات إنشاء حساب Supabase

1. **إنشاء حساب**: اذهب إلى [supabase.com](https://supabase.com) وأنشئ حساب مجاني
2. **إنشاء مشروع جديد**: اضغط "New Project"
3. **اختر اسم المشروع**: مثلاً "afleet-store"
4. **اختر كلمة مرور قاعدة البيانات**: احفظها في مكان آمن
5. **اختر المنطقة**: اختر أقرب منطقة لك (مثل Europe/Frankfurt)
6. **انتظر إنشاء المشروع**: يأخذ 1-2 دقيقة

---

## الجداول (Tables)

### 1. Users (المستخدمين/المسوقين)
جدول المستخدمين للمتجر والمسوقين.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'customer', -- 'customer', 'marketer', 'admin'
  
  -- Marketer specific fields
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
```

---

### 2. Categories (الفئات)
فئات المنتجات.

```sql
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
```

---

### 3. Products (المنتجات)
المنتجات المتاحة في المتجر.

```sql
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
  images JSONB, -- Array of image URLs
  
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
```

---

### 4. Orders (الطلبات)
طلبات العملاء.

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Customer info
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
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, partially_paid, refunded
  payment_method VARCHAR(50),
  paid_amount DECIMAL(10,2) DEFAULT 0.00,
  
  -- Order status
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, warehouse, shipping, in_delivery, delivered, cancelled
  section VARCHAR(50) DEFAULT 'orders', -- orders, warehouse, shipping, collection, in_delivery, archive
  
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
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_section ON orders(section);
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

---

### 5. Order Items (عناصر الطلب)
المنتجات في كل طلب.

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  
  -- Product snapshot (at time of order)
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(100),
  
  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  commission DECIMAL(10,2) DEFAULT 0.00,
  
  -- Status for partial delivery
  status VARCHAR(50) DEFAULT 'pending', -- pending, delivered, cancelled
  delivered_quantity INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
```

---

### 6. Wallet Transactions (معاملات المحفظة)
تتبع رصيد المسوقين والمعاملات.

```sql
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Transaction details
  type VARCHAR(50) NOT NULL, -- credit, debit, withdrawal
  amount DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  
  -- Reference
  reference_type VARCHAR(50), -- order, withdrawal, adjustment
  reference_id UUID,
  
  -- Description
  description TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_wallet_user ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_type ON wallet_transactions(type);
CREATE INDEX idx_wallet_created ON wallet_transactions(created_at);
```

---

### 7. Withdrawal Requests (طلبات السحب)
طلبات سحب الأرباح من المسوقين.

```sql
CREATE TABLE withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Amount
  amount DECIMAL(10,2) NOT NULL,
  
  -- Payment details
  payment_method VARCHAR(50) NOT NULL, -- vodafone_cash, bank_transfer, etc.
  account_details TEXT NOT NULL,
  wallet_number VARCHAR(100),
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  
  -- Admin handling
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
```

---

### 8. Favorites (المفضلة)
المنتجات المفضلة للعملاء.

```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_product ON favorites(product_id);
```

---

### 9. Cart Items (عربة التسوق)
عربة التسوق للعملاء.

```sql
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
```

---

### 10. Site Settings (إعدادات الموقع)
إعدادات عامة للموقع.

```sql
CREATE TABLE site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_settings_key ON site_settings(key);
```

---

### 11. Notifications (الإشعارات)
إشعارات للمسوقين والعملاء.

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification content
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50), -- order, withdrawal, commission, system
  
  -- Action
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
```

---

## Row Level Security (RLS) Policies

### تفعيل RLS على كل الجداول
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
```

### مثال: سياسات الأمان للمستخدمين
```sql
-- Users can read their own data
CREATE POLICY "Users can view own data" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" 
  ON users FOR UPDATE 
  USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" 
  ON users FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## Functions & Triggers

### 1. دالة تحديث updated_at تلقائياً
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- تطبيق على كل الجداول
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. دالة حساب رصيد المحفظة
```sql
CREATE OR REPLACE FUNCTION get_wallet_balance(user_uuid UUID)
RETURNS DECIMAL AS $$
  SELECT COALESCE(SUM(
    CASE 
      WHEN type = 'credit' THEN amount
      WHEN type = 'debit' OR type = 'withdrawal' THEN -amount
      ELSE 0
    END
  ), 0) FROM wallet_transactions WHERE user_id = user_uuid;
$$ LANGUAGE SQL;
```

### 3. دالة إنشاء معاملة محفظة عند إنشاء طلب
```sql
CREATE OR REPLACE FUNCTION create_wallet_transaction_on_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.marketer_id IS NOT NULL AND NEW.commission > 0 THEN
    INSERT INTO wallet_transactions (
      user_id, type, amount, reference_type, reference_id, description
    ) VALUES (
      NEW.marketer_id,
      'credit',
      NEW.commission,
      'order',
      NEW.id,
      'عمولة من الطلب رقم ' || NEW.order_number
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_wallet_transaction 
  AFTER INSERT ON orders
  FOR EACH ROW 
  WHEN (NEW.status = 'delivered')
  EXECUTE FUNCTION create_wallet_transaction_on_order();
```

---

## Views (Views مفيدة)

### 1. عرض ملخص المسوقين
```sql
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
```

### 2. عرض حالات الطلبات
```sql
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
```

---

## الخطوات التالية للتنفيذ

### 1. في Supabase Dashboard
1. افتح SQL Editor
2. انسخ والصق كل جدول على حدة
3. شغل الأوامر واحدة واحدة
4. تأكد من إنشاء الـ Indexes والـ Triggers

### 2. في المشروع
1. تثبيت Supabase Client:
```bash
npm install @supabase/supabase-js
```

2. إنشاء ملف `.env`:
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

3. إنشاء Supabase client:
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

## ملاحظات مهمة

1. **النسخ الاحتياطي**: قبل الانتقال، اعمل export لكل بيانات localStorage
2. **الهجرة التدريجية**: ابدأ بجدول واحد في كل مرة
3. **الاختبار**: اختبر كل جدول بشكل منفصل قبل الانتقال الكامل
4. **الأمان**: استخدم RLS Policies لحماية البيانات
5. **التكلفة**: الخطة المجانية كافية للبداية (500MB storage, 2GB bandwidth)

---

## مراجع مفيدة

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Functions](https://supabase.com/docs/guides/database/functions)
