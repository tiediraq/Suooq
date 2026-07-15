/**
 * Types for Souq Al-Juma'a Iraqi E-Commerce Platform
 */

export type UserRole = 'admin' | 'user' | 'seller' | 'store';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  governorate: string;
  district: string;
  area: string;
  address: string;
  age: number;
  gender: 'ذكر' | 'أنثى';
  accountType: 'بائع حر' | 'صاحب متجر';
  role: UserRole;
  profileImage?: string;
  createdAt: string;
  password?: string; // Excluded in API responses generally
}

export interface Store {
  id: string;
  userId: string;
  name: string;
  logo: string;
  cover: string;
  description: string;
  location: string;
  workingHours: string;
  productsCount: number;
  reviewsCount: number;
  followersCount: number;
  rating: number;
  followedBy?: string[]; // Array of userIds who follow this store
}

export type ProductStatus = 'Pending' | 'Approved' | 'Rejected' | 'NeedsEdit';

export interface Product {
  id: string;
  userId: string;
  storeId?: string; // Optional if seller is freelance
  name: string;
  description: string;
  price: number;
  governorate: string;
  section: string; // القسم (e.g. السيارات، الهواتف...)
  category: string; // الفئة الفرعية
  condition: 'جديد' | 'مستعمل';
  fragile: boolean; // قابل للكسر
  gift: boolean; // يوجد هدية
  negotiable: boolean; // قابل للتفاوض
  quantity: number;
  warranty?: string; // الضمان
  returnPolicy?: string; // سياسة الإرجاع
  views: number;
  saves: number;
  createdAt: string;
  rating: number;
  status: ProductStatus;
  images: string[];
  video?: string;
  priceAlertUsers?: string[];
}

export interface CartItem {
  id: string; // id for state
  productId: string;
  quantity: number;
  product?: Product;
}

export type OrderStatus = 'PendingReview' | 'Accepted' | 'Preparing' | 'Shipping' | 'Delivered' | 'Cancelled';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  storeId?: string;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  shippingFee: number;
  governorate: string;
  address: string;
  phone: string;
  createdAt: string;
}

export interface Chat {
  id: string;
  user1Id: string;
  user1Name: string;
  user1Image?: string;
  user2Id: string;
  user2Name: string;
  user2Image?: string;
  lastMessage: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userImage?: string;
  targetType: 'product' | 'seller' | 'store';
  targetId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  text: string;
  type: 'info' | 'order' | 'ad_status' | 'message';
  read: boolean;
  createdAt: string;
}

export interface Complaint {
  id: string;
  userId: string;
  name: string;
  phone: string;
  title: string;
  text: string;
  status: 'pending' | 'resolved';
  createdAt: string;
}

export interface Banner {
  id: string;
  image: string;
  title: string;
  link?: string;
  active: boolean;
}

export interface Catalog {
  id: string;
  name: string;
  fileUrl: string;
  type: 'pdf' | 'image';
  isCompanyOffer: boolean;
  createdAt: string;
}

export interface SystemSettings {
  logo: string;
  maintenanceMode: boolean;
  contactWhatsApp: string;
  contactPhone: string;
  shippingFeeBaghdad: number;
  shippingFeeGovs: number;
  commissionRate: number; // For future commission system
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  createdAt: string;
}
