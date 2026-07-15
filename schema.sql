-- ====================================================================
-- هيكلية قاعدة بيانات سوق الجمعة العراقي (Souq Al-Juma'a Platform)
-- Supabase PostgreSQL Database Schema
-- ====================================================================

-- --------------------------------------------------------------------
-- القسم الأول: جدول المزامنة التلقائية للنظام (Auto-Sync Table)
-- --------------------------------------------------------------------
-- هذا الجدول يُستخدم للمزامنة السحابية الفورية لحالة التطبيق والبيانات
CREATE TABLE IF NOT EXISTS app_state (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- تفعيل الحماية والأمان على مستوى السطر (RLS)
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

-- السماح بالوصول العام للقراءة والكتابة لتسهيل التطوير والنشر السريع
DROP POLICY IF EXISTS "Allow public read/write" ON app_state;
CREATE POLICY "Allow public read/write" ON app_state FOR ALL USING (true) WITH CHECK (true);


-- --------------------------------------------------------------------
-- القسم الثاني: جداول البيانات التفصيلية (Relational Database Structure)
-- --------------------------------------------------------------------
-- في حال رغبتكم في الانتقال من نظام الحفظ التلقائي إلى الجداول العلائقية المفصلة:

-- 1. جدول المستخدمين (Users Table)
CREATE TABLE IF NOT EXISTS users (
    id text PRIMARY KEY,
    name text NOT NULL,
    email text UNIQUE NOT NULL,
    phone text,
    governorate text, -- المحافظة
    district text, -- القضاء
    area text, -- المنطقة
    address text, -- العنوان التفصيلي
    age integer,
    gender text CHECK (gender IN ('ذكر', 'أنثى')),
    account_type text CHECK (account_type IN ('بائع حر', 'صاحب متجر')),
    role text DEFAULT 'user' CHECK (role IN ('admin', 'user', 'seller', 'store')),
    profile_image text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- تفعيل الحماية وإضافة سياسات الوصول لجدول المستخدمين
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access for users" ON users;
CREATE POLICY "Allow public access for users" ON users FOR ALL USING (true) WITH CHECK (true);


-- 2. جدول المتاجر (Stores Table)
CREATE TABLE IF NOT EXISTS stores (
    id text PRIMARY KEY,
    user_id text REFERENCES users(id) ON DELETE CASCADE,
    name text NOT NULL,
    logo text,
    cover text,
    description text,
    location text,
    working_hours text,
    products_count integer DEFAULT 0,
    reviews_count integer DEFAULT 0,
    followers_count integer DEFAULT 0,
    rating numeric DEFAULT 5.0,
    followed_by text[] DEFAULT '{}'::text[]
);

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access for stores" ON stores;
CREATE POLICY "Allow public access for stores" ON stores FOR ALL USING (true) WITH CHECK (true);


-- 3. جدول الإعلانات والمنتجات (Products / Advertisements Table)
CREATE TABLE IF NOT EXISTS products (
    id text PRIMARY KEY,
    user_id text REFERENCES users(id) ON DELETE CASCADE,
    store_id text REFERENCES stores(id) ON DELETE SET NULL,
    name text NOT NULL, -- اسم الإعلان / المنتج
    description text, -- تفاصيل الإعلان
    price numeric NOT NULL, -- السعر بالدينار العراقي
    governorate text, -- المحافظة المتواجد بها الإعلان
    section text, -- القسم الرئيسي (مثل: السيارات، الهواتف، العقارات...)
    category text, -- الفئة الفرعية
    condition text CHECK (condition IN ('جديد', 'مستعمل')), -- الحالة
    fragile boolean DEFAULT false, -- قابل للكسر
    gift boolean DEFAULT false, -- يوجد هدية مع الإعلان
    negotiable boolean DEFAULT true, -- السعر قابل للتفاوض
    quantity integer DEFAULT 1, -- الكمية المتوفرة
    warranty text, -- تفاصيل الضمان
    return_policy text, -- سياسة الإرجاع
    views integer DEFAULT 0, -- عدد المشاهدات
    saves integer DEFAULT 0, -- عدد مرات الحفظ كإعلان مفضل
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    rating numeric DEFAULT 5.0,
    status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'NeedsEdit')), -- حالة الإعلان من قبل الإدارة
    images text[] DEFAULT '{}'::text[], -- صور الإعلان
    video text, -- فيديو توضيحي للإعلان
    price_alert_users text[] DEFAULT '{}'::text[] -- المستخدمين المشتركين بتنبيه الأسعار لهذا الإعلان
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access for products" ON products;
CREATE POLICY "Allow public access for products" ON products FOR ALL USING (true) WITH CHECK (true);


-- 4. جدول الطلبات (Orders Table)
CREATE TABLE IF NOT EXISTS orders (
    id text PRIMARY KEY,
    user_id text REFERENCES users(id) ON DELETE SET NULL,
    user_name text NOT NULL,
    user_phone text NOT NULL,
    status text DEFAULT 'PendingReview' CHECK (status IN ('PendingReview', 'Accepted', 'Preparing', 'Shipping', 'Delivered', 'Cancelled')),
    total numeric NOT NULL,
    shipping_fee numeric DEFAULT 0,
    governorate text NOT NULL,
    address text NOT NULL,
    phone text NOT NULL,
    items jsonb NOT NULL, -- قائمة السلع المشحونة وتفاصيلها كملف JSON
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access for orders" ON orders;
CREATE POLICY "Allow public access for orders" ON orders FOR ALL USING (true) WITH CHECK (true);


-- 5. جدول المحادثات (Chats Table)
CREATE TABLE IF NOT EXISTS chats (
    id text PRIMARY KEY,
    sender_id text NOT NULL,
    recipient_id text NOT NULL,
    recipient_name text NOT NULL,
    recipient_image text,
    recipient_phone text,
    last_message text,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access for chats" ON chats;
CREATE POLICY "Allow public access for chats" ON chats FOR ALL USING (true) WITH CHECK (true);


-- 6. جدول الرسائل (Messages Table)
CREATE TABLE IF NOT EXISTS messages (
    id text PRIMARY KEY,
    chat_id text REFERENCES chats(id) ON DELETE CASCADE,
    sender_id text NOT NULL,
    text text NOT NULL,
    timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    read boolean DEFAULT false
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access for messages" ON messages;
CREATE POLICY "Allow public access for messages" ON messages FOR ALL USING (true) WITH CHECK (true);


-- 7. جدول الشكاوى والمقترحات (Complaints Table)
CREATE TABLE IF NOT EXISTS complaints (
    id text PRIMARY KEY,
    user_id text,
    name text NOT NULL,
    phone text NOT NULL,
    title text NOT NULL,
    text text NOT NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access for complaints" ON complaints;
CREATE POLICY "Allow public access for complaints" ON complaints FOR ALL USING (true) WITH CHECK (true);
