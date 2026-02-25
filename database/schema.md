# Database Schema Document
## نظام إدارة المسوقين والطلبات

> **الهدف:** تحويل التطبيق من localStorage إلى قاعدة بيانات حقيقية مع Real-time Sync

---

## 📋 Table of Contents
1. [Database Overview](#database-overview)
2. [Tables Schema](#tables-schema)
3. [Relationships](#relationships)
4. [Indexes](#indexes)
5. [API Endpoints](#api-endpoints)
6. [Real-time Sync Strategy](#real-time-sync-strategy)

---

## 🗄️ Database Overview

**Recommended Database:** PostgreSQL 14+ or MySQL 8+  
**Character Set:** UTF8MB4 (for Arabic support)  
**Timezone:** UTC (convert to local in application)

---

## 📊 Tables Schema

### 1. Users Table (المستخدمين)
Stores both marketers (Store users) and admin employees (Dashboard users).

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('marketer', 'admin', 'employee') NOT NULL DEFAULT 'marketer',
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_is_active (is_active)
);
```

**Fields Explanation:**
- `role`: 'marketer' for Store users, 'admin'/'employee' for Dashboard users
- `is_active`: For account suspension/activation
- `password_hash`: Use bcrypt with salt rounds >= 10

---

### 2. Products Table (المنتجات)

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  cost_price DECIMAL(10, 2) NOT NULL COMMENT 'Base price for marketers',
  category VARCHAR(100),
  stock INT DEFAULT 0,
  thumbnail TEXT,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  
  INDEX idx_category (category),
  INDEX idx_is_hidden (is_hidden),
  INDEX idx_stock (stock),
  FULLTEXT INDEX idx_name_desc (name, description)
);
```

---

### 3. Product Variants Table (الألوان والمقاسات)

```sql
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color VARCHAR(50),
  size VARCHAR(50),
  stock INT DEFAULT 0,
  
  INDEX idx_product_id (product_id),
  UNIQUE KEY unique_variant (product_id, color, size)
);
```

---

### 4. Product Images Table (صور المنتجات)

```sql
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INT DEFAULT 0,
  
  INDEX idx_product_id (product_id)
);
```

---

### 5. Orders Table (الطلبات)

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  marketer_id UUID NOT NULL REFERENCES users(id),
  
  -- Customer Info
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_phone2 VARCHAR(20),
  customer_address TEXT NOT NULL,
  customer_province VARCHAR(100) NOT NULL,
  customer_city VARCHAR(100) NOT NULL,
  customer_notes TEXT,
  
  -- Order Details
  status ENUM('pending', 'confirmed', 'processing', 'shipped', 'in_delivery', 
              'delivered', 'partially_delivered', 'cancelled', 'suspended', 
              'delivery_rejected') NOT NULL DEFAULT 'pending',
  section ENUM('orders', 'warehouse', 'shipping', 'in_delivery', 'archive') 
          NOT NULL DEFAULT 'orders',
  
  -- Pricing
  subtotal DECIMAL(10, 2) NOT NULL,
  shipping_fee DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  commission DECIMAL(10, 2) NOT NULL COMMENT 'Marketer commission',
  
  -- Payment
  payment_method ENUM('cash', 'card', 'wallet') DEFAULT 'cash',
  payment_status ENUM('unpaid', 'paid', 'partially_paid', 'refunded') DEFAULT 'unpaid',
  
  -- Tracking
  tracking_number VARCHAR(100),
  shipping_company_id UUID REFERENCES shipping_companies(id),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP,
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP,
  
  INDEX idx_marketer_id (marketer_id),
  INDEX idx_status (status),
  INDEX idx_section (section),
  INDEX idx_order_number (order_number),
  INDEX idx_created_at (created_at),
  INDEX idx_customer_phone (customer_phone)
);
```

---

### 6. Order Items Table (منتجات الطلب)

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL COMMENT 'Snapshot of product name',
  
  color VARCHAR(50),
  size VARCHAR(50),
  quantity INT NOT NULL,
  
  unit_price DECIMAL(10, 2) NOT NULL COMMENT 'Selling price per unit',
  cost_price DECIMAL(10, 2) NOT NULL COMMENT 'Base cost per unit',
  total_price DECIMAL(10, 2) NOT NULL,
  
  -- For partial delivery
  delivered_quantity INT DEFAULT 0,
  is_delivered BOOLEAN DEFAULT false,
  rejection_reason TEXT,
  
  image_url TEXT,
  
  INDEX idx_order_id (order_id),
  INDEX idx_product_id (product_id)
);
```

---

### 7. Shipping Companies Table (شركات الشحن)

```sql
CREATE TABLE shipping_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  website VARCHAR(255),
  whatsapp VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_is_active (is_active)
);
```

---

### 8. Shipping Areas Table (مناطق الشحن)

```sql
CREATE TABLE shipping_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  governorate VARCHAR(100) NOT NULL,
  cities JSON NOT NULL COMMENT 'Array of city names',
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_governorate (governorate)
);
```

---

### 9. Wallet Transactions Table (معاملات المحفظة)

```sql
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type ENUM('commission', 'withdrawal', 'refund', 'adjustment') NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  description TEXT,
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_created_at (created_at)
);
```

---

### 10. Withdrawal Requests Table (طلبات السحب)

```sql
CREATE TABLE withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10, 2) NOT NULL,
  wallet_number VARCHAR(100) NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  processed_by UUID REFERENCES users(id),
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
```

---

### 11. Notifications Table (الإشعارات)

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('order', 'payment', 'system', 'promotion') NOT NULL,
  is_read BOOLEAN DEFAULT false,
  related_order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at)
);
```

---

### 12. Employees Table (الموظفين)

```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id),
  department ENUM('sales', 'warehouse', 'shipping', 'customer_service', 'admin') NOT NULL,
  position VARCHAR(100),
  salary DECIMAL(10, 2),
  hire_date DATE,
  permissions JSON COMMENT 'Array of permission strings',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_department (department),
  INDEX idx_is_active (is_active)
);
```

---

### 13. Activity Log Table (سجل النشاطات)

```sql
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL COMMENT 'order, product, user, etc',
  entity_id UUID,
  details JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created_at (created_at)
);
```

---

## 🔗 Relationships Diagram

```
users (1) ----< (N) orders
users (1) ----< (N) wallet_transactions
users (1) ----< (N) withdrawal_requests
users (1) ----< (N) notifications
users (1) ----< (1) employees

products (1) ----< (N) product_variants
products (1) ----< (N) product_images
products (1) ----< (N) order_items

orders (1) ----< (N) order_items
orders (N) ----< (1) shipping_companies
orders (N) ----< (1) users (marketer)

withdrawal_requests (N) ----< (1) users (processed_by)
```

---

## 🚀 Indexes Strategy

### High-Priority Indexes (Already included above):
- Primary Keys (UUID)
- Foreign Keys
- Status fields (for filtering)
- Created_at (for sorting/pagination)
- User lookups (email, phone)

### Composite Indexes (Add if needed):
```sql
-- For order filtering by marketer and status
CREATE INDEX idx_orders_marketer_status ON orders(marketer_id, status);

-- For order search by date range
CREATE INDEX idx_orders_date_range ON orders(created_at, status);

-- For wallet balance calculation
CREATE INDEX idx_wallet_user_date ON wallet_transactions(user_id, created_at);
```

---

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new marketer
- `POST /api/auth/login` - Login (returns JWT token)
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Products
- `GET /api/products` - List products (with filters)
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)
- `GET /api/products/:id/variants` - Get product variants

### Orders
- `GET /api/orders` - List orders (filtered by user role)
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create new order (marketer)
- `PUT /api/orders/:id` - Update order
- `PUT /api/orders/:id/status` - Update order status
- `PUT /api/orders/:id/items/:itemId` - Update order item (partial delivery)
- `DELETE /api/orders/:id` - Cancel order

### Shipping
- `GET /api/shipping/areas` - Get shipping areas
- `POST /api/shipping/areas` - Create shipping area (admin)
- `PUT /api/shipping/areas/:id` - Update shipping area (admin)
- `DELETE /api/shipping/areas/:id` - Delete shipping area (admin)
- `GET /api/shipping/companies` - Get shipping companies
- `POST /api/shipping/companies` - Create company (admin)

### Wallet
- `GET /api/wallet/balance` - Get user balance
- `GET /api/wallet/transactions` - Get transaction history
- `POST /api/wallet/withdraw` - Request withdrawal
- `GET /api/wallet/withdrawals` - Get withdrawal requests
- `PUT /api/wallet/withdrawals/:id/approve` - Approve withdrawal (admin)
- `PUT /api/wallet/withdrawals/:id/reject` - Reject withdrawal (admin)

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### Users (Admin)
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `PUT /api/users/:id/activate` - Activate user
- `PUT /api/users/:id/deactivate` - Deactivate user

### Employees (Admin)
- `GET /api/employees` - List employees
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Analytics (Admin)
- `GET /api/analytics/dashboard` - Dashboard stats
- `GET /api/analytics/sales` - Sales report
- `GET /api/analytics/marketers` - Marketer performance
- `GET /api/analytics/products` - Product performance

---

## ⚡ Real-time Sync Strategy

### Option 1: WebSocket (Recommended)
Use Socket.io or native WebSockets for real-time updates.

**Events to emit:**
- `order:created` - New order created
- `order:updated` - Order status changed
- `product:updated` - Product modified
- `notification:new` - New notification
- `wallet:updated` - Balance changed

**Client subscribes to:**
- User-specific room: `user:{userId}`
- Role-specific room: `role:marketer` or `role:admin`

### Option 2: Server-Sent Events (SSE)
Simpler alternative for one-way server-to-client updates.

### Option 3: Polling (Fallback)
Client polls every 30-60 seconds for updates.

---

## 🔐 Security Considerations

1. **Authentication:**
   - Use JWT tokens with short expiry (15 min access, 7 days refresh)
   - Store refresh tokens in httpOnly cookies
   - Implement rate limiting on auth endpoints

2. **Authorization:**
   - Role-based access control (RBAC)
   - Marketers can only see their own orders
   - Admins can see all data

3. **Data Validation:**
   - Validate all inputs on server side
   - Sanitize user inputs to prevent SQL injection
   - Use prepared statements/parameterized queries

4. **Sensitive Data:**
   - Never store plain passwords
   - Encrypt sensitive fields if needed
   - Use HTTPS only

---

## 📦 Migration Strategy

### Phase 1: Setup
1. Create database and tables
2. Set up API server (Node.js/Express or similar)
3. Implement authentication

### Phase 2: Core Features
1. Products CRUD
2. Orders CRUD
3. User management

### Phase 3: Advanced Features
1. Wallet system
2. Notifications
3. Real-time sync

### Phase 4: Migration
1. Export data from localStorage
2. Import to database
3. Test thoroughly
4. Switch frontend to use API

---

## 🛠️ Recommended Tech Stack

**Backend:**
- Node.js + Express.js
- PostgreSQL or MySQL
- Prisma ORM (or TypeORM)
- Socket.io for real-time
- JWT for authentication

**Alternative:**
- Supabase (PostgreSQL + Auth + Real-time built-in)
- Firebase (NoSQL alternative)

---

## 📝 Notes for Backend Developer

1. **Timezone:** Store all timestamps in UTC, convert to local (Africa/Cairo) in frontend
2. **Pagination:** Implement cursor-based pagination for large datasets
3. **Caching:** Use Redis for frequently accessed data (product list, shipping areas)
4. **File Upload:** Use cloud storage (AWS S3, Cloudinary) for product images
5. **Backup:** Implement daily automated backups
6. **Logging:** Log all critical operations (order creation, status changes, payments)
7. **Testing:** Write unit tests for critical business logic
8. **Documentation:** Use Swagger/OpenAPI for API documentation

---

## 🎯 Priority Implementation Order

1. ✅ **High Priority:**
   - Users & Authentication
   - Products
   - Orders
   - Shipping Areas

2. 🔶 **Medium Priority:**
   - Wallet & Transactions
   - Notifications
   - Employees

3. 🔵 **Low Priority:**
   - Activity Log
   - Analytics
   - Advanced features

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-12  
**Contact:** Provide to backend developer for implementation
