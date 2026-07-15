import fs from 'fs';
import path from 'path';
import { 
  User, Store, Product, CartItem, Order, Chat, Message, 
  Review, Notification, Complaint, Banner, Catalog, SystemSettings, ActivityLog 
} from '../src/types';
import { syncToSupabase } from './supabase';

const DB_FILE = path.join(process.cwd(), 'data.json');

interface DatabaseSchema {
  users: User[];
  stores: Store[];
  products: Product[];
  orders: Order[];
  chats: Chat[];
  messages: Message[];
  reviews: Review[];
  notifications: Notification[];
  complaints: Complaint[];
  banners: Banner[];
  catalogs: Catalog[];
  settings: SystemSettings;
  activityLogs: ActivityLog[];
}

const DEFAULT_SETTINGS: SystemSettings = {
  logo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200',
  maintenanceMode: false,
  contactWhatsApp: '+9647700000000',
  contactPhone: '07700000000',
  shippingFeeBaghdad: 3000,
  shippingFeeGovs: 6000,
  commissionRate: 5 // 5%
};

const INITIAL_DB: DatabaseSchema = {
  users: [
    {
      id: 'admin-1',
      name: 'أبو فهد (المدير)',
      email: 'admin@souq.com',
      phone: '07700000000',
      governorate: 'بغداد',
      district: 'الكرادة',
      area: 'ساحة الواثق',
      address: 'محلة 903، زقاق 12',
      age: 38,
      gender: 'ذكر',
      accountType: 'بائع حر',
      role: 'admin',
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
      createdAt: new Date('2026-01-01').toISOString(),
      password: 'admin' // Pre-seeded easy admin login
    },
    {
      id: 'user-ali',
      name: 'علي الكعبي',
      email: 'ali@souq.com',
      phone: '07801234567',
      governorate: 'بغداد',
      district: 'المنصور',
      area: 'حي دراغ',
      address: 'قرب مطعم زرزور',
      age: 29,
      gender: 'ذكر',
      accountType: 'بائع حر',
      role: 'seller',
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
      createdAt: new Date('2026-02-15').toISOString(),
      password: 'password'
    },
    {
      id: 'user-maryam',
      name: 'مريم أحمد',
      email: 'maryam@souq.com',
      phone: '07701234567',
      governorate: 'أربيل',
      district: 'عينكاوة',
      area: 'شارع 100',
      address: 'مقابل فندق لاند مارك',
      age: 31,
      gender: 'أنثى',
      accountType: 'صاحب متجر',
      role: 'store',
      profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
      createdAt: new Date('2026-03-10').toISOString(),
      password: 'password'
    },
    {
      id: 'user-hassan',
      name: 'حسن البصراوي',
      email: 'hassan@souq.com',
      phone: '07501234567',
      governorate: 'البصرة',
      district: 'العشار',
      area: 'شارع الوطن',
      address: 'عمارة الفهد الطابق الثاني',
      age: 26,
      gender: 'ذكر',
      accountType: 'بائع حر',
      role: 'user',
      profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
      createdAt: new Date('2026-04-01').toISOString(),
      password: 'password'
    }
  ],
  stores: [
    {
      id: 'store-maryam',
      userId: 'user-maryam',
      name: 'معرض دجلة للهواتف الذكية',
      logo: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=200',
      cover: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800',
      description: 'أفضل العروض على الهواتف الذكية الجديدة والمستعملة في العراق مع الضمان الحقيقي التوصيل لكافة المحافظات',
      location: 'أربيل - عينكاوة - شارع 100',
      workingHours: '10:00 صباحاً - 11:00 مساءً',
      productsCount: 3,
      reviewsCount: 1,
      followersCount: 145,
      rating: 4.8,
      followedBy: ['user-hassan']
    }
  ],
  products: [
    {
      id: 'prod-iphone15',
      userId: 'user-maryam',
      storeId: 'store-maryam',
      name: 'آيفون 15 برو ماكس - 256 جيجابايت',
      description: 'آيفون 15 برو ماكس نظيف جداً بنسبة 99%، اللون تيتانيوم طبيعي، مع العلبة الملحقات الأصلية ونسبة البطارية 95%، بدون أي خدوش أو تصليح سابق.',
      price: 1450000,
      governorate: 'أربيل',
      section: 'الهواتف',
      category: 'آبل',
      condition: 'مستعمل',
      fragile: true,
      gift: true,
      negotiable: true,
      quantity: 1,
      warranty: 'ضمان متبقي 3 أشهر من الوكيل الرسمي',
      returnPolicy: 'إرجاع خلال 48 ساعة في حال وجود أي خلل مصنعي',
      views: 342,
      saves: 56,
      createdAt: new Date('2026-07-01T12:00:00Z').toISOString(),
      rating: 4.8,
      status: 'Approved',
      images: [
        'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80&w=500',
        'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&q=80&w=500'
      ],
      video: ''
    },
    {
      id: 'prod-toyota',
      userId: 'user-ali',
      name: 'تويوتا كورولا 2021 فل كامل',
      description: 'تويوتا كورولا موديل 2021 محرك 1.8L، ماشي 35 ألف كم فقط، وارد خليجي، لون أبيض صدفي، صبغ وكالة خالية من الحوادث والضرر، بحالة الوكالة تماماً، السعر بالدينار العراقي وقابل للتفاوض البسيط.',
      price: 24500000,
      governorate: 'بغداد',
      section: 'السيارات',
      category: 'صالون',
      condition: 'مستعمل',
      fragile: false,
      gift: false,
      negotiable: true,
      quantity: 1,
      warranty: 'لا يوجد',
      returnPolicy: 'السيارة خاضعة للفحص الفني الكامل قبل الشراء',
      views: 1250,
      saves: 189,
      createdAt: new Date('2026-07-05T10:00:00Z').toISOString(),
      rating: 5.0,
      status: 'Approved',
      images: [
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=500',
        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=500'
      ]
    },
    {
      id: 'prod-ps5',
      userId: 'user-maryam',
      storeId: 'store-maryam',
      name: 'بلايستيشن 5 سليم مع يدتين أصليتين',
      description: 'Playstation 5 Slim النسخة الرقمية (Digital Edition)، جديد بالكرتون غير مفتوح إطلاقاً، مع ضمان لمدة سنة كاملة من المتجر، يشمل يدتين تحكم لاسلكيتين أصليتين باللون الأبيض.',
      price: 680000,
      governorate: 'أربيل',
      section: 'الألعاب',
      category: 'كونسول',
      condition: 'جديد',
      fragile: true,
      gift: true,
      negotiable: false,
      quantity: 5,
      warranty: 'ضمان حقيقي لمدة سنة كاملة من متجر دجلة',
      returnPolicy: 'إرجاع واستبدال خلال 7 أيام في حال وجود خلل مصنعي',
      views: 562,
      saves: 94,
      createdAt: new Date('2026-07-08T15:30:00Z').toISOString(),
      rating: 4.5,
      status: 'Approved',
      images: [
        'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&q=80&w=500'
      ]
    },
    {
      id: 'prod-lg-fridge',
      userId: 'user-ali',
      name: 'ثلاجة ال جي 24 قدم ذكية - إنفيرتر',
      description: 'ثلاجة LG ذكية حجم 24 قدم، نظام الحفاظ على الأطعمة طازجة Door-in-Door، ضاغط عاكس رقمي (Linear Inverter) موفر للطاقة بنسبة 40%، صوت هادئ جداً، مستعملة لمدة 6 أشهر فقط وبحالة ممتازة كالجديدة.',
      price: 1150000,
      governorate: 'بغداد',
      section: 'الأجهزة المنزلية',
      category: 'ثلاجات',
      condition: 'مستعمل',
      fragile: true,
      gift: false,
      negotiable: true,
      quantity: 1,
      warranty: 'ضمان متبقي 9 سنوات على الماتور',
      returnPolicy: 'لا يوجد بعد المعاينة والفحص في بيت البائع',
      views: 184,
      saves: 22,
      createdAt: new Date('2026-07-10T11:15:00Z').toISOString(),
      rating: 4.0,
      status: 'Approved',
      images: [
        'https://images.unsplash.com/photo-1571175486667-5a73062c6495?auto=format&fit=crop&q=80&w=500'
      ]
    },
    {
      id: 'prod-rolex',
      userId: 'user-hassan',
      name: 'ساعة رولكس صبمارينر إطار أخضر (Kermit)',
      description: 'ساعة Rolex Submariner الملكية الفاخرة أوتوماتيك، إطار سيراميك أخضر ومينا أسود، ستيل مقاوم للصدأ 904L، مستعملة بحالة ممتازة جداً مع العلبة والكتلوج الأصلي وبطاقة الضمان الدولي، سنة الموديل 2022.',
      price: 22500000,
      governorate: 'البصرة',
      section: 'الساعات',
      category: 'رولكس',
      condition: 'مستعمل',
      fragile: true,
      gift: false,
      negotiable: true,
      quantity: 1,
      warranty: 'ضمان دولي متبقي لغاية نهاية 2027',
      returnPolicy: 'البيع بشرط الفحص والتدقيق لدى فحص الساعات المعتمد في البصرة أو بغداد',
      views: 95,
      saves: 14,
      createdAt: new Date('2026-07-12T09:00:00Z').toISOString(),
      rating: 0,
      status: 'Pending', // pending review!
      images: [
        'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=500'
      ]
    },
    {
      id: 'prod-dell-laptop',
      userId: 'user-ali',
      name: 'لابتوب ديل XPS 15 للألعاب والتصميم شاشة 4K',
      description: 'لابتوب Dell XPS 15 بمواصفات جبارة: معالج Intel Core i9 جيل 12، رام 32 جيجابايت DDR5، هارد 1 تيرابايت NVMe SSD، كارت شاشة Nvidia RTX 3060، شاشة 15.6 بوصة OLED بدقة 4K تعمل باللمس. لابتوب نظيف جداً وخفيف الوزن، مثالي للمهندسين والمصممين والالعاب القوية.',
      price: 1950000,
      governorate: 'بغداد',
      section: 'اللابتوبات',
      category: 'ديل',
      condition: 'مستعمل',
      fragile: true,
      gift: true,
      negotiable: true,
      quantity: 1,
      warranty: 'ضمان شخصي لمدة شهر كامل',
      returnPolicy: 'إمكانية التبديل خلال 3 أيام',
      views: 450,
      saves: 72,
      createdAt: new Date('2026-07-11T14:20:00Z').toISOString(),
      rating: 4.9,
      status: 'Approved',
      images: [
        'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&q=80&w=500'
      ]
    }
  ],
  orders: [
    {
      id: 'order-1',
      userId: 'user-hassan',
      userName: 'حسن البصراوي',
      userPhone: '07501234567',
      items: [
        {
          productId: 'prod-ps5',
          name: 'بلايستيشن 5 سليم مع يدتين أصليتين',
          price: 680000,
          quantity: 1,
          storeId: 'store-maryam'
        }
      ],
      status: 'Accepted',
      total: 686000,
      shippingFee: 6000,
      governorate: 'البصرة',
      address: 'العشار - شارع الوطن',
      phone: '07501234567',
      createdAt: new Date('2026-07-10T16:00:00Z').toISOString()
    }
  ],
  chats: [
    {
      id: 'chat-ali-maryam',
      user1Id: 'user-ali',
      user1Name: 'علي الكعبي',
      user1Image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
      user2Id: 'user-maryam',
      user2Name: 'مريم أحمد',
      user2Image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
      lastMessage: 'مرحباً، هل يتوفر لون تيتانيوم أسود للآيفون؟',
      updatedAt: new Date('2026-07-12T18:30:00Z').toISOString()
    }
  ],
  messages: [
    {
      id: 'msg-1',
      chatId: 'chat-ali-maryam',
      senderId: 'user-ali',
      text: 'مرحباً مريم، شفت إعلان الآيفون 15 برو ماكس',
      createdAt: new Date('2026-07-12T18:28:00Z').toISOString()
    },
    {
      id: 'msg-2',
      chatId: 'chat-ali-maryam',
      senderId: 'user-maryam',
      text: 'أهلاً بك أخي علي، نعم متوفر حالياً وبحالة ممتازة جداً',
      createdAt: new Date('2026-07-12T18:29:00Z').toISOString()
    },
    {
      id: 'msg-3',
      chatId: 'chat-ali-maryam',
      senderId: 'user-ali',
      text: 'مرحباً، هل يتوفر لون تيتانيوم أسود للآيفون؟',
      createdAt: new Date('2026-07-12T18:30:00Z').toISOString()
    }
  ],
  reviews: [
    {
      id: 'rev-1',
      userId: 'user-hassan',
      userName: 'حسن البصراوي',
      targetType: 'store',
      targetId: 'store-maryam',
      rating: 5,
      comment: 'تعامل راقي جداً وتوصيل سريع في الموعد والمنتج أصلي وممتاز',
      createdAt: new Date('2026-07-11T12:00:00Z').toISOString()
    }
  ],
  notifications: [
    {
      id: 'notif-1',
      userId: 'user-maryam',
      title: 'طلب جديد بانتظارك',
      text: 'قام العميل حسن البصراوي بشراء بلايستيشن 5 من متجرك. يرجى مراجعة الطلب وتجهيزه الشحن.',
      type: 'order',
      read: false,
      createdAt: new Date('2026-07-10T16:01:00Z').toISOString()
    }
  ],
  complaints: [
    {
      id: 'comp-1',
      userId: 'user-ali',
      name: 'علي الكعبي',
      phone: '07801234567',
      title: 'مشكلة في تحميل فيديو المنتج',
      text: 'أحاول رفع فيديو توضيحي لسيارتي بأسلوب مميز لكني أواجه خطأ في الشبكة، أرجو تفقد السيرفر.',
      status: 'pending',
      createdAt: new Date('2026-07-12T15:00:00Z').toISOString()
    }
  ],
  banners: [
    {
      id: 'ban-1',
      image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&q=80&w=1200',
      title: 'عروض سوق الجمعة الكبرى بمناسبة الصيف',
      link: '/category/الهواتف',
      active: true
    },
    {
      id: 'ban-2',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200',
      title: 'تسوق المنتجات المستعملة الموثوقة وبأفضل الأسعار',
      link: '/used-products',
      active: true
    }
  ],
  catalogs: [
    {
      id: 'cat-1',
      name: 'عروض عيد الأضحى المبارك من المعارض الكبرى',
      fileUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&q=80&w=500',
      type: 'image',
      isCompanyOffer: true,
      createdAt: new Date('2026-06-25').toISOString()
    }
  ],
  settings: DEFAULT_SETTINGS,
  activityLogs: [
    {
      id: 'log-1',
      userId: 'admin-1',
      userName: 'أبو فهد (المدير)',
      action: 'تهيئة النظام',
      details: 'تم بدء تشغيل منصة سوق الجمعة بنجاح مع الفهارس وقواعد البيانات الافتراضية.',
      createdAt: new Date('2026-07-13T12:00:00Z').toISOString()
    }
  ]
};

export class LocalDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(fileContent);
      }
    } catch (e) {
      console.error('Failed to parse database file, recreating it.', e);
    }
    this.save(INITIAL_DB);
    return INITIAL_DB;
  }

  private save(data: DatabaseSchema): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
      
      // Async sync each collection to Supabase in the background
      const collections = Object.keys(data) as Array<keyof DatabaseSchema>;
      for (const collection of collections) {
        syncToSupabase(collection, data[collection]).catch((err) => {
          console.error(`Error background syncing ${collection} to Supabase:`, err);
        });
      }
    } catch (e) {
      console.error('Failed to write database file', e);
    }
  }

  getSchema(): DatabaseSchema {
    return this.data;
  }

  // Generic methods
  getCollection<K extends keyof DatabaseSchema>(collection: K): DatabaseSchema[K] {
    return this.data[collection];
  }

  updateCollection<K extends keyof DatabaseSchema>(collection: K, values: DatabaseSchema[K]): void {
    this.data[collection] = values;
    this.save(this.data);
  }

  // Activity log helper
  logActivity(userId: string, userName: string, action: string, details: string): void {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId,
      userName,
      action,
      details,
      createdAt: new Date().toISOString()
    };
    this.data.activityLogs.unshift(newLog);
    // Keep logs size reasonable
    if (this.data.activityLogs.length > 500) {
      this.data.activityLogs = this.data.activityLogs.slice(0, 500);
    }
    this.save(this.data);
  }

  // System Notification helper
  addNotification(userId: string, title: string, text: string, type: Notification['type']): void {
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      userId,
      title,
      text,
      type,
      read: false,
      createdAt: new Date().toISOString()
    };
    this.data.notifications.unshift(newNotif);
    this.save(this.data);
  }
}

export const db = new LocalDatabase();
