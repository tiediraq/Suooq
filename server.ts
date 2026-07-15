import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { db } from './server/db';
import { loadFromSupabase } from './server/supabase';
import { 
  User, Store, Product, Order, Chat, Message, 
  Review, Notification, Complaint, Banner, Catalog, SystemSettings 
} from './src/types';

dotenv.config();

// Initialize Gemini AI client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const app = express();
const PORT = 3000;

// Set up body parser with large size limit for base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Helper to check user session from headers (Simulating standard Auth)
// In a real production app we would use JWT, here we pass the user-id directly for simplicity and robustness in iframe preview environment
const getUserIdFromRequest = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

// Check if requester is admin
const isAdmin = (req: Request): boolean => {
  const userId = getUserIdFromRequest(req);
  if (!userId) return false;
  const user = db.getCollection('users').find(u => u.id === userId);
  return user ? user.role === 'admin' : false;
};

// ==========================================
// 1. AUTHENTICATION API
// ==========================================

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { 
    name, email, phone, governorate, district, area, address, age, gender, accountType, password 
  } = req.body;

  if (!name || !email || !governorate || !district || !area || !address || !age || !gender || !accountType || !password) {
    res.status(400).json({ error: 'يرجى ملء جميع الحقول المطلوبة بما في ذلك البريد الإلكتروني' });
    return;
  }

  const users = db.getCollection('users');
  
  // Ensure unique email
  const existingUserByEmail = users.find(u => u.email?.toLowerCase() === email.trim().toLowerCase());
  if (existingUserByEmail) {
    res.status(400).json({ error: 'البريد الإلكتروني هذا مسجل بالفعل بحساب آخر' });
    return;
  }

  // Ensure unique phone if provided
  if (phone && phone.trim()) {
    const existingUserByPhone = users.find(u => u.phone === phone.trim());
    if (existingUserByPhone) {
      res.status(400).json({ error: 'رقم الهاتف هذا مسجل بالفعل بحساب آخر' });
      return;
    }
  }

  const userId = `user-${Date.now()}`;
  const newUser: User = {
    id: userId,
    name,
    email: email.trim().toLowerCase(),
    phone: phone ? phone.trim() : undefined,
    governorate,
    district,
    area,
    address,
    age: parseInt(age),
    gender,
    accountType,
    role: accountType === 'صاحب متجر' ? 'store' : 'seller',
    profileImage: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    createdAt: new Date().toISOString(),
    password // stored directly for simulation
  };

  users.push(newUser);
  db.updateCollection('users', users);

  // If store owner, create store entry
  if (accountType === 'صاحب متجر') {
    const stores = db.getCollection('stores');
    const newStore: Store = {
      id: `store-${userId}`,
      userId: userId,
      name: `معرض ${name.split(' ')[0]} للتجارة`,
      logo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200',
      cover: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800',
      description: `مرحباً بكم في متجرنا الإلكتروني المتكامل على منصة سوق الجمعة.`,
      location: `${governorate} - ${district} - ${area}`,
      workingHours: '10:00 ص - 10:00 م',
      productsCount: 0,
      reviewsCount: 0,
      followersCount: 0,
      rating: 5.0,
      followedBy: []
    };
    stores.push(newStore);
    db.updateCollection('stores', stores);
    db.logActivity(userId, name, 'إنشاء حساب ومتجر', `تم تسجيل حساب متجر جديد باسم ${newStore.name}`);
  } else {
    db.logActivity(userId, name, 'إنشاء حساب بائع', `تم تسجيل حساب بائع حر جديد`);
  }

  // Exclude password in response
  const { password: _, ...userResponse } = newUser;
  res.status(201).json({ user: userResponse, token: userId });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { phone, emailOrPhone, password } = req.body;
  const identifier = (emailOrPhone || phone || '').trim().toLowerCase();
  
  if (!identifier || !password) {
    res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني أو رقم الهاتف مع كلمة المرور' });
    return;
  }

  const users = db.getCollection('users');
  const user = users.find(u => 
    (u.phone === identifier || u.email?.toLowerCase() === identifier) && 
    u.password === password
  );

  if (!user) {
    res.status(401).json({ error: 'البريد الإلكتروني/رقم الهاتف أو كلمة المرور غير صحيحة' });
    return;
  }

  db.logActivity(user.id, user.name, 'تسجيل الدخول', `تم تسجيل الدخول بنجاح`);
  const { password: _, ...userResponse } = user;
  res.json({ user: userResponse, token: user.id });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: 'غير مصرح به' });
    return;
  }

  const user = db.getCollection('users').find(u => u.id === userId);
  if (!user) {
    res.status(404).json({ error: 'المستخدم غير موجود' });
    return;
  }

  const { password: _, ...userResponse } = user;
  res.json(userResponse);
});

app.post('/api/auth/change-password', (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);
  const { oldPassword, newPassword } = req.body;

  if (!userId) {
    res.status(401).json({ error: 'غير مصرح به' });
    return;
  }

  const users = db.getCollection('users');
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    res.status(404).json({ error: 'المستخدم غير موجود' });
    return;
  }

  if (users[userIndex].password !== oldPassword) {
    res.status(400).json({ error: 'كلمة المرور القديمة غير صحيحة' });
    return;
  }

  users[userIndex].password = newPassword;
  db.updateCollection('users', users);
  db.logActivity(userId, users[userIndex].name, 'تغيير كلمة المرور', 'تم تحديث كلمة المرور للمستخدم بنجاح');

  res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
});

app.put('/api/auth/profile', (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);
  const { name, governorate, district, area, address, profileImage } = req.body;

  if (!userId) {
    res.status(401).json({ error: 'غير مصرح به' });
    return;
  }

  const users = db.getCollection('users');
  const userIdx = users.findIndex(u => u.id === userId);

  if (userIdx === -1) {
    res.status(404).json({ error: 'المستخدم غير موجود' });
    return;
  }

  if (name) users[userIdx].name = name;
  if (governorate) users[userIdx].governorate = governorate;
  if (district) users[userIdx].district = district;
  if (area) users[userIdx].area = area;
  if (address) users[userIdx].address = address;
  if (profileImage) users[userIdx].profileImage = profileImage;

  db.updateCollection('users', users);
  db.logActivity(userId, users[userIdx].name, 'تحديث الملف الشخصي', 'تم تعديل بيانات الملف الشخصي');

  const { password: _, ...userResponse } = users[userIdx];
  res.json(userResponse);
});

// ==========================================
// 2. PRODUCTS API
// ==========================================

app.get('/api/products', (req: Request, res: Response) => {
  const { 
    search, category, section, governorate, condition, minPrice, maxPrice, sort, page = '1', limit = '12', status
  } = req.query;

  let products = db.getCollection('products');

  // Filter by status (approved by default for public, or requested status if admin/owner)
  const reqUserId = getUserIdFromRequest(req);
  const requester = reqUserId ? db.getCollection('users').find(u => u.id === reqUserId) : null;
  const isReqAdmin = requester?.role === 'admin';

  if (status) {
    products = products.filter(p => p.status === status);
  } else if (!isReqAdmin) {
    // Non-admin gets Approved, or his own Pending/NeedsEdit/Rejected products
    products = products.filter(p => p.status === 'Approved' || p.userId === reqUserId);
  } else {
    // Admin gets all, unless filtered
    products = products.filter(p => p.status === 'Approved'); // Public feed default
  }

  // Text search
  if (search) {
    const query = (search as string).toLowerCase().trim();
    products = products.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.description.toLowerCase().includes(query) ||
      p.section.toLowerCase().includes(query) ||
      (p.category && p.category.toLowerCase().includes(query))
    );
  }

  // Section
  if (section) {
    products = products.filter(p => p.section === section);
  }

  // Category (subcategory)
  if (category) {
    products = products.filter(p => p.category === category);
  }

  // Governorate
  if (governorate) {
    products = products.filter(p => p.governorate === governorate);
  }

  // Condition
  if (condition) {
    products = products.filter(p => p.condition === condition);
  }

  // Price range
  if (minPrice) {
    products = products.filter(p => p.price >= parseInt(minPrice as string));
  }
  if (maxPrice) {
    products = products.filter(p => p.price <= parseInt(maxPrice as string));
  }

  // Sorting
  if (sort) {
    if (sort === 'cheapest') {
      products.sort((a, b) => a.price - b.price);
    } else if (sort === 'expensive') {
      products.sort((a, b) => b.price - a.price);
    } else if (sort === 'views') {
      products.sort((a, b) => b.views - a.views);
    } else if (sort === 'rating') {
      products.sort((a, b) => b.rating - a.rating);
    } else { // 'newest' is default
      products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  } else {
    products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Pagination
  const pNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const total = products.length;
  const paginatedProducts = products.slice((pNum - 1) * limitNum, pNum * limitNum);

  res.json({
    products: paginatedProducts,
    total,
    page: pNum,
    pages: Math.ceil(total / limitNum)
  });
});

app.get('/api/products/my', (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: 'غير مصرح به' });
    return;
  }

  const products = db.getCollection('products').filter(p => p.userId === userId);
  res.json(products);
});

app.get('/api/products/:id', (req: Request, res: Response) => {
  const products = db.getCollection('products');
  const productIdx = products.findIndex(p => p.id === req.params.id);

  if (productIdx === -1) {
    res.status(404).json({ error: 'المنتج غير موجود' });
    return;
  }

  // Increment view counter dynamically (Lazy / in-memory + file write)
  products[productIdx].views = (products[productIdx].views || 0) + 1;
  db.updateCollection('products', products);

  // Get store or seller info
  const seller = db.getCollection('users').find(u => u.id === products[productIdx].userId);
  let store = null;
  if (products[productIdx].storeId) {
    store = db.getCollection('stores').find(s => s.id === products[productIdx].storeId);
  }

  const { password: _, ...sellerClean } = seller || {};

  res.json({
    product: products[productIdx],
    seller: sellerClean,
    store
  });
});

app.post('/api/products/:id/price-alert', (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: 'غير مصرح به - الرجاء تسجيل الدخول أولاً عيني' });
    return;
  }

  const products = db.getCollection('products');
  const productIdx = products.findIndex(p => p.id === req.params.id);

  if (productIdx === -1) {
    res.status(404).json({ error: 'المنتج غير موجود' });
    return;
  }

  const product = products[productIdx];
  if (!product.priceAlertUsers) {
    product.priceAlertUsers = [];
  }

  const hasAlert = product.priceAlertUsers.includes(userId);
  if (hasAlert) {
    product.priceAlertUsers = product.priceAlertUsers.filter(id => id !== userId);
  } else {
    product.priceAlertUsers.push(userId);
  }

  db.updateCollection('products', products);

  res.json({ 
    success: true, 
    subscribed: !hasAlert,
    product,
    message: !hasAlert 
      ? 'تم تفعيل منبه انخفاض السعر بنجاح عيني! سنقوم بإشعارك فور قيام البائع بتخفيض السعر.' 
      : 'تم إلغاء منبه انخفاض السعر.' 
  });
});

app.post('/api/products', (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: 'يرجى تسجيل الدخول أولاً' });
    return;
  }

  const user = db.getCollection('users').find(u => u.id === userId);
  if (!user || (user.role !== 'seller' && user.role !== 'store' && user.role !== 'admin')) {
    res.status(403).json({ error: 'لا تملك صلاحية لإضافة إعلانات' });
    return;
  }

  const { 
    name, description, price, governorate, section, category, condition, 
    fragile, gift, negotiable, quantity, warranty, returnPolicy, images, video 
  } = req.body;

  if (!name || !description || !price || !governorate || !section || !category || !condition || !images || images.length === 0) {
    res.status(400).json({ error: 'يرجى ملء كافة الحقول الأساسية ورفع صورة واحدة على الأقل' });
    return;
  }

  // Get Store ID if store owner
  let storeId = undefined;
  if (user.role === 'store') {
    const store = db.getCollection('stores').find(s => s.userId === userId);
    if (store) storeId = store.id;
  }

  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    userId,
    storeId,
    name,
    description,
    price: parseFloat(price),
    governorate,
    section,
    category,
    condition,
    fragile: !!fragile,
    gift: !!gift,
    negotiable: !!negotiable,
    quantity: parseInt(quantity || '1'),
    warranty,
    returnPolicy,
    views: 0,
    saves: 0,
    createdAt: new Date().toISOString(),
    rating: 0,
    status: 'Pending', // Pending review as requested!
    images,
    video
  };

  const products = db.getCollection('products');
  products.unshift(newProduct);
  db.updateCollection('products', products);

  // Add notification to admin
  db.addNotification('admin-1', 'إعلان جديد بانتظار المراجعة', `قام ${user.name} بإضافة منتج جديد: ${name} بانتظار موافقتك.`, 'info');
  db.logActivity(userId, user.name, 'إضافة منتج', `تمت إضافة منتج جديد "${name}" وبحالة معلقة للتفتيش`);

  res.status(201).json(newProduct);
});

app.put('/api/products/:id', (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: 'غير مصرح به' });
    return;
  }

  const products = db.getCollection('products');
  const productIdx = products.findIndex(p => p.id === req.params.id);

  if (productIdx === -1) {
    res.status(404).json({ error: 'المنتج غير موجود' });
    return;
  }

  const product = products[productIdx];
  const user = db.getCollection('users').find(u => u.id === userId);

  // Only owner or admin can edit
  if (product.userId !== userId && user?.role !== 'admin') {
    res.status(403).json({ error: 'لا تملك الصلاحية لتعديل هذا الإعلان' });
    return;
  }

  const { 
    name, description, price, governorate, section, category, condition, 
    fragile, gift, negotiable, quantity, warranty, returnPolicy, images, video 
  } = req.body;

  const oldPrice = product.price;

  if (name) product.name = name;
  if (description) product.description = description;
  if (price) {
    const newPrice = parseFloat(price);
    if (!isNaN(newPrice) && newPrice < oldPrice && product.priceAlertUsers && product.priceAlertUsers.length > 0) {
      product.priceAlertUsers.forEach(watchingUserId => {
        db.addNotification(
          watchingUserId,
          'انخفاض سعر سلعة تتابعها! 📉',
          `بشرى سارة عيني! تم تخفيض سعر السلعة "${product.name}" من ${oldPrice.toLocaleString('ar-IQ')} د.ع إلى ${newPrice.toLocaleString('ar-IQ')} د.ع. سارع بالشراء قبل نفاد الكمية!`,
          'info'
        );
      });
    }
    product.price = newPrice;
  }
  if (governorate) product.governorate = governorate;
  if (section) product.section = section;
  if (category) product.category = category;
  if (condition) product.condition = condition;
  if (fragile !== undefined) product.fragile = !!fragile;
  if (gift !== undefined) product.gift = !!gift;
  if (negotiable !== undefined) product.negotiable = !!negotiable;
  if (quantity) product.quantity = parseInt(quantity);
  if (warranty !== undefined) product.warranty = warranty;
  if (returnPolicy !== undefined) product.returnPolicy = returnPolicy;
  if (images) product.images = images;
  if (video !== undefined) product.video = video;

  // Reset status to Pending for admin review again if edited by merchant (security best practice)
  if (user?.role !== 'admin') {
    product.status = 'Pending';
  }

  db.updateCollection('products', products);
  db.logActivity(userId, user?.name || 'غير معروف', 'تعديل منتج', `تم تعديل بيانات المنتج "${product.name}"`);

  res.json(product);
});

app.delete('/api/products/:id', (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: 'غير مصرح به' });
    return;
  }

  const products = db.getCollection('products');
  const product = products.find(p => p.id === req.params.id);

  if (!product) {
    res.status(404).json({ error: 'المنتج غير موجود' });
    return;
  }

  const user = db.getCollection('users').find(u => u.id === userId);

  // Only owner or admin can delete
  if (product.userId !== userId && user?.role !== 'admin') {
    res.status(403).json({ error: 'لا تملك الصلاحية لحذف هذا الإعلان' });
    return;
  }

  const updatedProducts = products.filter(p => p.id !== req.params.id);
  db.updateCollection('products', updatedProducts);
  db.logActivity(userId, user?.name || 'غير معروف', 'حذف منتج', `تم حذف المنتج "${product.name}" نهائياً`);

  res.json({ success: true, message: 'تم حذف المنتج بنجاح' });
});

// Admin Review Product Status
app.put('/api/products/:id/status', (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'غير مصرح به - للمسؤولين فقط' });
    return;
  }

  const { status } = req.body; // Approved, Rejected, NeedsEdit
  if (!status || !['Approved', 'Rejected', 'NeedsEdit'].includes(status)) {
    res.status(400).json({ error: 'حالة غير صالحة' });
    return;
  }

  const products = db.getCollection('products');
  const productIdx = products.findIndex(p => p.id === req.params.id);

  if (productIdx === -1) {
    res.status(404).json({ error: 'المنتج غير موجود' });
    return;
  }

  const product = products[productIdx];
  product.status = status;
  db.updateCollection('products', products);

  // Notify seller
  let statusStr = '';
  if (status === 'Approved') statusStr = 'مقبول ونُشر في المنصة';
  if (status === 'Rejected') statusStr = 'مرفوض لمخالفة شروط النشر';
  if (status === 'NeedsEdit') statusStr = 'يحتاج إلى تعديل لكي يُقبل';

  db.addNotification(
    product.userId, 
    'تحديث حالة إعلانك', 
    `تمت مراجعة إعلانك لـ "${product.name}" وحالته الحالية هي: ${statusStr}`, 
    'ad_status'
  );

  const adminUser = db.getCollection('users').find(u => u.role === 'admin');
  db.logActivity(adminUser?.id || 'admin', adminUser?.name || 'المدير', 'تحديث حالة إعلان', `تم تعديل حالة الإعلان "${product.name}" إلى ${status}`);

  res.json({ success: true, product });
});

// ==========================================
// 3. STORES API
// ==========================================

app.get('/api/stores', (req: Request, res: Response) => {
  const { search } = req.query;
  let stores = db.getCollection('stores');

  if (search) {
    const q = (search as string).toLowerCase();
    stores = stores.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
  }

  res.json(stores);
});

app.get('/api/stores/:id', (req: Request, res: Response) => {
  const store = db.getCollection('stores').find(s => s.id === req.params.id);
  if (!store) {
    res.status(404).json({ error: 'المتجر غير موجود' });
    return;
  }

  // Find products for this store
  const products = db.getCollection('products').filter(p => p.storeId === store.id && p.status === 'Approved');
  res.json({ store, products });
});

app.post('/api/stores/:id/follow', (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: 'يرجى تسجيل الدخول أولاً' });
    return;
  }

  const stores = db.getCollection('stores');
  const storeIdx = stores.findIndex(s => s.id === req.params.id);

  if (storeIdx === -1) {
    res.status(404).json({ error: 'المتجر غير موجود' });
    return;
  }

  const store = stores[storeIdx];
  if (!store.followedBy) store.followedBy = [];

  const followerIdx = store.followedBy.indexOf(userId);
  let followed = false;
  if (followerIdx === -1) {
    store.followedBy.push(userId);
    store.followersCount = (store.followersCount || 0) + 1;
    followed = true;
  } else {
    store.followedBy.splice(followerIdx, 1);
    store.followersCount = Math.max(0, (store.followersCount || 1) - 1);
  }

  db.updateCollection('stores', stores);
  res.json({ success: true, followed, followersCount: store.followersCount });
});

// ==========================================
// 4. ORDERS & CART API
// ==========================================

app.get('/api/orders', (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: 'يرجى تسجيل الدخول' });
    return;
  }

  const user = db.getCollection('users').find(u => u.id === userId);
  let orders = db.getCollection('orders');

  if (user?.role !== 'admin') {
    // Regular users see their own orders. Freelance sellers or stores see orders containing their products
    if (user?.role === 'seller' || user?.role === 'store') {
      const store = db.getCollection('stores').find(s => s.userId === userId);
      orders = orders.filter(o => 
        o.userId === userId || 
        o.items.some(item => item.storeId === store?.id || (item.storeId === undefined && !store))
      );
    } else {
      orders = orders.filter(o => o.userId === userId);
    }
  }

  res.json(orders);
});

app.post('/api/orders', (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: 'يرجى تسجيل الدخول لإتمام الطلب' });
    return;
  }

  const user = db.getCollection('users').find(u => u.id === userId);
  if (!user) {
    res.status(404).json({ error: 'الحساب غير موجود' });
    return;
  }

  const { items, governorate, address, phone } = req.body;
  if (!items || items.length === 0 || !governorate || !address || !phone) {
    res.status(400).json({ error: 'يرجى تزويد السلة والعنوان الكامل ورقم الهاتف' });
    return;
  }

  // Calculate prices
  let subtotal = 0;
  const products = db.getCollection('products');
  const finalItems: any[] = [];

  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (!product) {
      res.status(404).json({ error: `المنتج بـ ID ${item.productId} غير موجود` });
      return;
    }

    if (product.quantity < item.quantity) {
      res.status(400).json({ error: `الكمية المطلوبة من "${product.name}" غير متوفرة حالياً` });
      return;
    }

    // Deduct stock
    product.quantity -= item.quantity;
    subtotal += product.price * item.quantity;

    finalItems.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      storeId: product.storeId
    });
  }

  // Save updated product quantities
  db.updateCollection('products', products);

  // Delivery Fees based on Governorate
  const settings = db.getCollection('settings');
  const shippingFee = governorate === 'بغداد' ? settings.shippingFeeBaghdad : settings.shippingFeeGovs;
  const total = subtotal + shippingFee;

  const orderId = `order-${Date.now()}`;
  const newOrder: Order = {
    id: orderId,
    userId,
    userName: user.name,
    userPhone: user.phone,
    items: finalItems,
    status: 'PendingReview',
    total,
    shippingFee,
    governorate,
    address,
    phone,
    createdAt: new Date().toISOString()
  };

  const orders = db.getCollection('orders');
  orders.unshift(newOrder);
  db.updateCollection('orders', orders);

  // Notifications
  db.addNotification(userId, 'تم استلام طلبك', `تم تسجيل طلبك رقم ${orderId} وهو قيد المراجعة الآن من قبل الإدارة.`, 'order');
  
  // Notify store owners/sellers in the order
  const uniqueSellers = Array.from(new Set(finalItems.map(item => item.storeId || 'freelance')));
  uniqueSellers.forEach(sellerTarget => {
    if (sellerTarget === 'freelance') {
      // For simplicity, notify freelance sellers directly based on product
      finalItems.filter(i => !i.storeId).forEach(i => {
        const prod = products.find(p => p.id === i.productId);
        if (prod) {
          db.addNotification(prod.userId, 'بيع منتج جديد', `تم طلب منتجك "${prod.name}" من قبل ${user.name}.`, 'order');
        }
      });
    } else {
      const store = db.getCollection('stores').find(s => s.id === sellerTarget);
      if (store) {
        db.addNotification(store.userId, 'طلب جديد لمتجرك', `قام العميل ${user.name} بطلب منتج من متجرك.`, 'order');
      }
    }
  });

  // Notify admin
  db.addNotification('admin-1', 'طلب شراء جديد', `تم تسجيل طلب شراء جديد رقم ${orderId} بقيمة ${total} د.ع.`, 'order');
  db.logActivity(userId, user.name, 'إنشاء طلب شراء', `تم إنشاء طلب جديد رقم ${orderId} بإجمالي ${total} دينار عراقي`);

  res.status(201).json(newOrder);
});

app.put('/api/orders/:id/status', (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: 'غير مصرح به' });
    return;
  }

  const { status } = req.body; // PendingReview, Accepted, Preparing, Shipping, Delivered, Cancelled
  if (!status) {
    res.status(400).json({ error: 'يرجى تقديم الحالة الجديدة للطلب' });
    return;
  }

  const orders = db.getCollection('orders');
  const orderIdx = orders.findIndex(o => o.id === req.params.id);

  if (orderIdx === -1) {
    res.status(404).json({ error: 'الطلب غير موجود' });
    return;
  }

  const order = orders[orderIdx];
  const user = db.getCollection('users').find(u => u.id === userId);

  // Status can be updated by Admin, or Store owners/sellers related to this order can adjust statuses if permitted. Here we allow admin or related merchants.
  const isMerchantOfOrder = order.items.some(item => {
    if (item.storeId) {
      const store = db.getCollection('stores').find(s => s.id === item.storeId);
      return store?.userId === userId;
    } else {
      const prod = db.getCollection('products').find(p => p.id === item.productId);
      return prod?.userId === userId;
    }
  });

  if (user?.role !== 'admin' && !isMerchantOfOrder) {
    res.status(403).json({ error: 'غير مصرح لك بتعديل حالة هذا الطلب' });
    return;
  }

  order.status = status;
  db.updateCollection('orders', orders);

  // Translate status to Arabic for user notification
  let statusAr = '';
  switch (status) {
    case 'PendingReview': statusAr = 'قيد المراجعة'; break;
    case 'Accepted': statusAr = 'تم قبوله وبانتظار التجهيز'; break;
    case 'Preparing': statusAr = 'جاري تجهيزه من قبل البائع'; break;
    case 'Shipping': statusAr = 'جاري الشحن مع المندوب'; break;
    case 'Delivered': statusAr = 'تم تسليمه بنجاح 🎉'; break;
    case 'Cancelled': statusAr = 'ملغي'; break;
  }

  // Notify buyer
  db.addNotification(
    order.userId, 
    'تحديث حالة طلبك', 
    `تم تحديث طلبك رقم ${order.id} إلى: ${statusAr}`, 
    'order'
  );

  db.logActivity(userId, user?.name || 'مجهول', 'تحديث طلب', `تم تحديث حالة الطلب ${order.id} إلى ${status}`);

  res.json({ success: true, order });
});

// ==========================================
// 5. CHAT & MESSAGES API
// ==========================================

app.get('/api/chats', (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: 'غير مصرح به' });
    return;
  }

  const chats = db.getCollection('chats').filter(c => c.user1Id === userId || c.user2Id === userId);
  res.json(chats);
});

app.get('/api/chats/:id/messages', (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: 'غير مصرح به' });
    return;
  }

  const messages = db.getCollection('messages').filter(m => m.chatId === req.params.id);
  // Sort oldest first for chat sequence
  messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  res.json(messages);
});

app.post('/api/chats/message', (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: 'يرجى تسجيل الدخول لمراسلة البائعين' });
    return;
  }

  const { recipientId, text } = req.body;
  if (!recipientId || !text) {
    res.status(400).json({ error: 'مستلم الرسالة أو النص مفقود' });
    return;
  }

  const users = db.getCollection('users');
  const sender = users.find(u => u.id === userId);
  const recipient = users.find(u => u.id === recipientId);

  if (!sender || !recipient) {
    res.status(404).json({ error: 'المرسل أو المستلم غير موجود' });
    return;
  }

  const chats = db.getCollection('chats');
  
  // Find or create Chat
  let chat = chats.find(c => 
    (c.user1Id === userId && c.user2Id === recipientId) || 
    (c.user1Id === recipientId && c.user2Id === userId)
  );

  if (!chat) {
    chat = {
      id: `chat-${userId}-${recipientId}`,
      user1Id: userId,
      user1Name: sender.name,
      user1Image: sender.profileImage,
      user2Id: recipientId,
      user2Name: recipient.name,
      user2Image: recipient.profileImage,
      lastMessage: text,
      updatedAt: new Date().toISOString()
    };
    chats.unshift(chat);
  } else {
    chat.lastMessage = text;
    chat.updatedAt = new Date().toISOString();
  }

  db.updateCollection('chats', chats);

  // Create message
  const messages = db.getCollection('messages');
  const newMsg: Message = {
    id: `msg-${Date.now()}`,
    chatId: chat.id,
    senderId: userId,
    text,
    createdAt: new Date().toISOString()
  };
  messages.push(newMsg);
  db.updateCollection('messages', messages);

  // Send Notification to recipient
  db.addNotification(
    recipientId, 
    `رسالة جديدة من ${sender.name}`, 
    text.length > 50 ? `${text.substring(0, 50)}...` : text, 
    'message'
  );

  res.status(201).json(newMsg);
});

// ==========================================
// 6. REVIEWS API
// ==========================================

app.post('/api/reviews', (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: 'يرجى تسجيل الدخول لإضافة مراجعة' });
    return;
  }

  const user = db.getCollection('users').find(u => u.id === userId);
  const { targetType, targetId, rating, comment } = req.body;

  if (!targetType || !targetId || rating === undefined || !comment) {
    res.status(400).json({ error: 'المعلومات المطلوبة للمراجعة ناقصة' });
    return;
  }

  const reviews = db.getCollection('reviews');
  const newReview: Review = {
    id: `rev-${Date.now()}`,
    userId,
    userName: user?.name || 'مقيم سوق الجمعة',
    userImage: user?.profileImage,
    targetType,
    targetId,
    rating: parseFloat(rating),
    comment,
    createdAt: new Date().toISOString()
  };

  reviews.push(newReview);
  db.updateCollection('reviews', reviews);

  // Dynamically update product or store rating averages
  if (targetType === 'product') {
    const products = db.getCollection('products');
    const prodIdx = products.findIndex(p => p.id === targetId);
    if (prodIdx !== -1) {
      const prodReviews = reviews.filter(r => r.targetType === 'product' && r.targetId === targetId);
      const avg = prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;
      products[prodIdx].rating = parseFloat(avg.toFixed(1));
      db.updateCollection('products', products);
    }
  } else if (targetType === 'store') {
    const stores = db.getCollection('stores');
    const storeIdx = stores.findIndex(s => s.id === targetId);
    if (storeIdx !== -1) {
      const storeReviews = reviews.filter(r => r.targetType === 'store' && r.targetId === targetId);
      const avg = storeReviews.reduce((sum, r) => sum + r.rating, 0) / storeReviews.length;
      stores[storeIdx].rating = parseFloat(avg.toFixed(1));
      stores[storeIdx].reviewsCount = storeReviews.length;
      db.updateCollection('stores', stores);
    }
  }

  res.status(201).json(newReview);
});

app.get('/api/reviews/:targetType/:targetId', (req: Request, res: Response) => {
  const { targetType, targetId } = req.params;
  const reviews = db.getCollection('reviews').filter(r => r.targetType === targetType && r.targetId === targetId);
  res.json(reviews);
});

// ==========================================
// 7. NOTIFICATIONS API
// ==========================================

app.get('/api/notifications', (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: 'غير مصرح به' });
    return;
  }

  const notifications = db.getCollection('notifications').filter(n => n.userId === userId);
  res.json(notifications);
});

app.put('/api/notifications/:id/read', (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: 'غير مصرح به' });
    return;
  }

  const notifications = db.getCollection('notifications');
  const notif = notifications.find(n => n.id === req.params.id && n.userId === userId);

  if (notif) {
    notif.read = true;
    db.updateCollection('notifications', notifications);
  }

  res.json({ success: true });
});

// ==========================================
// 8. COMPLAINTS API
// ==========================================

app.post('/api/complaints', (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req) || 'guest';
  const { name, phone, email, title, text } = req.body;
  const contactInfo = phone || email;

  if (!name || !contactInfo || !title || !text) {
    res.status(400).json({ error: 'يرجى ملء جميع حقول الشكوى ووسيلة الاتصال' });
    return;
  }

  const complaints = db.getCollection('complaints');
  const newComplaint: Complaint = {
    id: `comp-${Date.now()}`,
    userId,
    name,
    phone: contactInfo,
    title,
    text,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  complaints.unshift(newComplaint);
  db.updateCollection('complaints', complaints);

  // Notify admin
  db.addNotification('admin-1', 'شكوى جديدة واردة', `وردت شكوى جديدة من ${name}: ${title}`, 'info');

  res.status(201).json({ success: true, message: 'تم إرسال شكواك بنجاح، ستتواصل معك الإدارة قريباً' });
});

app.get('/api/complaints', (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'غير مصرح به للمشرفين فقط' });
    return;
  }
  res.json(db.getCollection('complaints'));
});

app.put('/api/complaints/:id/resolve', (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'غير مصرح به' });
    return;
  }

  const complaints = db.getCollection('complaints');
  const complaintIdx = complaints.findIndex(c => c.id === req.params.id);

  if (complaintIdx !== -1) {
    complaints[complaintIdx].status = 'resolved';
    db.updateCollection('complaints', complaints);
    
    // Notify complainant if registered
    if (complaints[complaintIdx].userId !== 'guest') {
      db.addNotification(
        complaints[complaintIdx].userId, 
        'تمت تسوية شكواك', 
        `شكواك بخصوص "${complaints[complaintIdx].title}" تم النظر فيها وحلها بنجاح. شكراً لك!`, 
        'info'
      );
    }
  }

  res.json({ success: true });
});

// ==========================================
// 9. ADMIN ACTIONS & SYSTEM SETTINGS
// ==========================================

app.get('/api/admin/stats', (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'غير مصرح به' });
    return;
  }

  const users = db.getCollection('users');
  const products = db.getCollection('products');
  const orders = db.getCollection('orders');
  const complaints = db.getCollection('complaints');
  const activityLogs = db.getCollection('activityLogs');

  const totalUsers = users.length;
  const userRolesCount = {
    admin: users.filter(u => u.role === 'admin').length,
    user: users.filter(u => u.role === 'user').length,
    seller: users.filter(u => u.role === 'seller').length,
    store: users.filter(u => u.role === 'store').length
  };

  const productStatusCount = {
    Approved: products.filter(p => p.status === 'Approved').length,
    Pending: products.filter(p => p.status === 'Pending').length,
    Rejected: products.filter(p => p.status === 'Rejected').length,
    NeedsEdit: products.filter(p => p.status === 'NeedsEdit').length
  };

  const totalRevenue = orders
    .filter(o => o.status === 'Delivered')
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrders = orders.filter(o => o.status === 'PendingReview' || o.status === 'Accepted').length;
  const pendingComplaints = complaints.filter(c => c.status === 'pending').length;

  res.json({
    totalUsers,
    userRolesCount,
    totalProducts: products.length,
    productStatusCount,
    totalOrders: orders.length,
    pendingOrders,
    totalRevenue,
    pendingComplaints,
    logs: activityLogs.slice(0, 50) // Return last 50 logs
  });
});

app.get('/api/admin/users', (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'غير مصرح به' });
    return;
  }
  // Exclude passwords
  const cleanUsers = db.getCollection('users').map(({ password, ...clean }) => clean);
  res.json(cleanUsers);
});

app.get('/api/admin/logs', (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'غير مصرح به' });
    return;
  }
  res.json(db.getCollection('activityLogs'));
});

// Settings Management
app.get('/api/settings', (req: Request, res: Response) => {
  res.json(db.getCollection('settings'));
});

app.put('/api/settings', (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'غير مصرح به' });
    return;
  }

  const { 
    logo, maintenanceMode, contactWhatsApp, contactPhone, 
    shippingFeeBaghdad, shippingFeeGovs, commissionRate 
  } = req.body;

  const settings = db.getCollection('settings');

  if (logo) settings.logo = logo;
  if (maintenanceMode !== undefined) settings.maintenanceMode = !!maintenanceMode;
  if (contactWhatsApp) settings.contactWhatsApp = contactWhatsApp;
  if (contactPhone) settings.contactPhone = contactPhone;
  if (shippingFeeBaghdad) settings.shippingFeeBaghdad = parseFloat(shippingFeeBaghdad);
  if (shippingFeeGovs) settings.shippingFeeGovs = parseFloat(shippingFeeGovs);
  if (commissionRate) settings.commissionRate = parseFloat(commissionRate);

  db.updateCollection('settings', settings);

  const admin = db.getCollection('users').find(u => u.role === 'admin');
  db.logActivity(admin?.id || 'admin', admin?.name || 'المدير', 'تحديث إعدادات النظام', 'تم تحديث الإعدادات العامة للمنصة');

  res.json(settings);
});

// Banners Management
app.get('/api/banners', (req: Request, res: Response) => {
  res.json(db.getCollection('banners'));
});

app.post('/api/banners', (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'غير مصرح به' });
    return;
  }

  const { image, title, link } = req.body;
  if (!image || !title) {
    res.status(400).json({ error: 'الاسم وصورة البانر مطلوبان' });
    return;
  }

  const banners = db.getCollection('banners');
  const newBanner: Banner = {
    id: `banner-${Date.now()}`,
    image,
    title,
    link,
    active: true
  };

  banners.push(newBanner);
  db.updateCollection('banners', banners);

  res.status(201).json(newBanner);
});

app.put('/api/banners/:id', (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'غير مصرح به' });
    return;
  }

  const banners = db.getCollection('banners');
  const idx = banners.findIndex(b => b.id === req.params.id);

  if (idx !== -1) {
    const { image, title, link, active } = req.body;
    if (image) banners[idx].image = image;
    if (title) banners[idx].title = title;
    if (link !== undefined) banners[idx].link = link;
    if (active !== undefined) banners[idx].active = !!active;

    db.updateCollection('banners', banners);
    res.json(banners[idx]);
  } else {
    res.status(404).json({ error: 'البانر غير موجود' });
  }
});

app.delete('/api/banners/:id', (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'غير مصرح به' });
    return;
  }

  const banners = db.getCollection('banners');
  const filtered = banners.filter(b => b.id !== req.params.id);
  db.updateCollection('banners', filtered);

  res.json({ success: true });
});

// Catalogs Management
app.get('/api/catalogs', (req: Request, res: Response) => {
  res.json(db.getCollection('catalogs'));
});

app.post('/api/catalogs', (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: 'غير مصرح به' });
    return;
  }

  const user = db.getCollection('users').find(u => u.id === userId);
  if (user?.role !== 'admin' && user?.role !== 'store') {
    res.status(403).json({ error: 'صلاحيات غير كافية لرفع الكاتلوج' });
    return;
  }

  const { name, fileUrl, type, isCompanyOffer } = req.body;
  if (!name || !fileUrl) {
    res.status(400).json({ error: 'اسم الكاتلوج ورابط الملف مطلوبان' });
    return;
  }

  const catalogs = db.getCollection('catalogs');
  const newCatalog: Catalog = {
    id: `catalog-${Date.now()}`,
    name,
    fileUrl,
    type: type || 'image',
    isCompanyOffer: isCompanyOffer !== undefined ? !!isCompanyOffer : (user.role === 'admin'),
    createdAt: new Date().toISOString()
  };

  catalogs.push(newCatalog);
  db.updateCollection('catalogs', catalogs);

  db.logActivity(userId, user.name, 'إضافة كاتالوج/عرض', `تمت إضافة كتالوج عروض جديد: ${name}`);

  res.status(201).json(newCatalog);
});

// ==========================================
// 10. GEMINI AI SMART CAPABILITIES (SERVER-SIDE)
// ==========================================

// AI Route 1: Smart Product Description Suggester
app.post('/api/gemini/suggest-description', async (req: Request, res: Response) => {
  const { productName, section, condition } = req.body;

  if (!productName || !section) {
    res.status(400).json({ error: 'اسم المنتج والقسم مطلوبان لإنشاء الوصف الذكي' });
    return;
  }

  try {
    const prompt = `أنت بائع عراقي ماهر ومحترف تسويق في منصة تجارة إلكترونية عراقية شعبية تدعى "سوق الجمعة".
    قم بكتابة وصف كامل، تسويقي، وجذاب جداً بالعامية العراقية المفهومة والراقية لمنتج بالمعلومات التالية:
    - اسم المنتج: ${productName}
    - قسم المنتج: ${section}
    - حالة المنتج: ${condition || 'غير محدد'}

    اكتب الوصف على شكل فقرة شيقة و رتب المميزات كنقاط مفصلة باللهجة العراقية. ركز على أن الأسعار ممتازة والتوصيل متوفر، وقدم نصائح للمشتري العراقي. لا تستخدم لغة رسمية فصحى جافة، استخدم العامية البسيطة واللطيفة مثل "نظيف جداً"، "ما بيه أي نقص"، "السعر بيه مجال"، "تفوتكم"، "على راسي".
    اجعل الوصف جاهزاً للاستخدام مباشرة في البيع.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    res.json({ description: response.text });
  } catch (error: any) {
    console.error('Gemini error generating description:', error);
    res.status(500).json({ error: 'فشل الذكاء الاصطناعي في توليد الوصف. يرجى المحاولة لاحقاً.' });
  }
});

// AI Route 2: Dynamic Marketplace AI Assistant with Grounding in Database
app.post('/api/gemini/assistant', async (req: Request, res: Response) => {
  const { message, chatHistory } = req.body;

  if (!message) {
    res.status(400).json({ error: 'نص الرسالة مطلوب' });
    return;
  }

  try {
    // Ground the assistant with current active products to suggest actual options
    const activeProducts = db.getCollection('products')
      .filter(p => p.status === 'Approved')
      .map(p => ({
        name: p.name,
        price: `${p.price.toLocaleString()} د.ع`,
        governorate: p.governorate,
        condition: p.condition,
        section: p.section
      }));

    const systemInstruction = `أنت المساعد الذكي التفاعلي لمنصة "سوق الجمعة - العراق"، وهي أكبر منصة عراقية لبيع وشراء المنتجات الجديدة والمستعملة والمتاجر المعتمدة.
    مهمتك هي مساعدة المستخدمين وتوجيههم باللهجة العراقية الودية والراقية جداً.
    لديك وصول مباشر إلى المنتجات المتاحة حالياً على المنصة وهي:
    ${JSON.stringify(activeProducts, null, 2)}

    عندما يسألك المستخدم عن منتجات معينة أو يقارن أسعار أو يسأل عن سيارات أو هواتف أو خدمات في محافظات العراق، ابحث في هذه القائمة واقترح عليه الخيارات المتوفرة فعلياً بالاسم والسعر والمحافظة وبلهجة عراقية بائع أمين ("أخوي الغالي"، "أختي العزيزة").
    إذا كان المنتج الذي يبحث عنه غير متوفر، اقترح عليه تصفح أقسام المنصة أو تفعيل الإشعارات، أو أخبره بلطف بلهجة عراقية دافئة أن يعاود البحث لاحقاً أو يعرض طلبه في المنصة.
    أجب باختصار وبطريقة مريحة للعين باستخدام تنسيق منظم ونقاط جميلة.`;

    // Package chat history
    const contents: any[] = [];
    if (chatHistory && Array.isArray(chatHistory)) {
      chatHistory.forEach(h => {
        contents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        });
      });
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Gemini error in marketplace assistant:', error);
    res.status(500).json({ error: 'حدث عطل في مساعد الذكاء الاصطناعي، يرجى المحاولة مجدداً.' });
  }
});

// ==========================================
// 11. VITE & STATIC FILES MIDDLEWARE
// ==========================================

async function startServer() {
  // Load dynamic state from Supabase if available, fallback to local data.json if not
  try {
    await loadFromSupabase(db);
  } catch (err) {
    console.error('Failed to pre-load from Supabase:', err);
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Souq Al-Jumaa fullstack server running on http://localhost:${PORT}`);
  });
}

startServer();
