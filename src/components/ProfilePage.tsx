import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, ShoppingBag, PlusCircle, AlertTriangle, Settings, 
  Heart, MapPin, Phone, LogOut, CheckCircle2, Star, Trash2, Edit, 
  Sparkles, Camera, Clipboard, HelpCircle, Loader, RefreshCw, ChevronLeft, Mail
} from 'lucide-react';
import { User, Product, Order, Complaint, Store, ProductStatus } from '../types';

interface ProfilePageProps {
  currentUser: User | null;
  onNavigate: (view: string, targetId?: string) => void;
  onLogout: () => void;
}

export default function ProfilePage({
  currentUser,
  onNavigate,
  onLogout
}: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'complaints' | 'settings' | 'followed_stores'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [followedStores, setFollowedStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);

  // Profile Edit fields
  const [name, setName] = useState('');
  const [gov, setGov] = useState('بغداد');
  const [district, setDistrict] = useState('');
  const [area, setArea] = useState('');
  const [address, setAddress] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [settingsError, setSettingsError] = useState('');

  // Password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  // Add Product form
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodGov, setProdGov] = useState('بغداد');
  const [prodSection, setProdSection] = useState('الهواتف');
  const [prodCategory, setProdCategory] = useState('');
  const [prodCondition, setProdCondition] = useState<'جديد' | 'مستعمل'>('جديد');
  const [prodFragile, setProdFragile] = useState(false);
  const [prodGift, setProdGift] = useState(false);
  const [prodNegotiable, setProdNegotiable] = useState(false);
  const [prodQuantity, setProdQuantity] = useState('1');
  const [prodWarranty, setProdWarranty] = useState('');
  const [prodReturn, setProdReturn] = useState('');
  const [prodImages, setProdImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [prodError, setProdError] = useState('');
  const [prodSuccess, setProdSuccess] = useState('');

  // Complaint form
  const [compTitle, setCompTitle] = useState('');
  const [compText, setCompText] = useState('');
  const [compSuccess, setCompSuccess] = useState('');
  const [compError, setCompError] = useState('');

  const sections = [
    'السيارات', 'العقارات', 'الهواتف', 'الإلكترونيات', 'اللابتوبات', 'الألعاب', 
    'الأثاث', 'الملابس', 'الأحذية', 'الإكسسوارات', 'الساعات', 'الذهب', 
    'الأجهزة المنزلية', 'الحدائق', 'الحيوانات', 'الكتب', 'الأطفال', 'الرياضة', 
    'الصحة', 'الوظائف', 'الخدمات', 'المطاعم', 'المقاهي', 'الصناعة', 'الزراعة', 
    'مواد البناء', 'أخرى'
  ];

  const subCategories: Record<string, string[]> = {
    'السيارات': ['صالون', 'دفع رباعي', 'بيك اب', 'دراجات نارية', 'شاحنات', 'أخرى'],
    'الهواتف': ['آبل', 'سامسونج', 'شاومي', 'ريلمي', 'هواوي', 'أخرى'],
    'اللابتوبات': ['ديل', 'اتش بي', 'لينوفو', 'ماك بوك', 'اسوس', 'أخرى'],
    'الساعات': ['رولكس', 'كاسيو', 'آبل ووتش', 'سيكو', 'أخرى'],
    'الأجهزة المنزلية': ['ثلاجات', 'غسالات', 'شاشات تلفزيون', 'طباخات', 'أخرى']
  };

  const getSubcategoriesForSection = (sec: string) => {
    return subCategories[sec] || ['عام'];
  };

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setGov(currentUser.governorate);
      setDistrict(currentUser.district);
      setArea(currentUser.area);
      setAddress(currentUser.address);
      setProfileImage(currentUser.profileImage || '');

      fetchProfileData();
    }
  }, [currentUser]);

  // Handle category updates automatically on section change
  useEffect(() => {
    const cats = getSubcategoriesForSection(prodSection);
    setProdCategory(cats[0]);
  }, [prodSection]);

  const fetchProfileData = () => {
    if (!currentUser) return;
    setLoading(true);

    const headers = { 'Authorization': `Bearer ${currentUser.id}` };

    // Fetch Orders
    fetch('/api/orders', { headers })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setOrders(data); })
      .catch(e => console.error(e));

    // Fetch Products (if Seller / Store / Admin)
    if (currentUser.role !== 'user') {
      fetch('/api/products/my', { headers })
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setProducts(data); })
        .catch(e => console.error(e));
    }

    // Fetch Followed Stores
    fetch('/api/stores')
      .then(res => res.json())
      .then((data: Store[]) => {
        if (Array.isArray(data)) {
          const followed = data.filter(s => s.followedBy && s.followedBy.includes(currentUser.id));
          setFollowedStores(followed);
        }
      })
      .catch(e => console.error(e));

    // Fetch User Complaints (requires admin headers or custom endpoints)
    fetch('/api/complaints', { headers })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Regular user only sees his own complaints
          if (currentUser.role !== 'admin') {
            setComplaints(data.filter(c => c.userId === currentUser.id));
          } else {
            setComplaints(data);
          }
        }
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsSuccess('');
    if (!currentUser) return;

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({ name, governorate: gov, district, area, address, profileImage })
      });
      const data = await res.json();
      if (res.ok) {
        setSettingsSuccess('تم تحديث معلومات ملفك الشخصي بنجاح عيني!');
      } else {
        setSettingsError(data.error || 'فشل التحديث');
      }
    } catch (e) {
      setSettingsError('حدث خطأ في الاتصال بالشبكة');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');
    if (!currentUser) return;

    if (!oldPassword || !newPassword) {
      setPwdError('يرجى ملء كلمتي المرور القديمة والجديدة');
      return;
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setPwdSuccess('تم تغيير كلمة المرور بنجاح!');
        setOldPassword('');
        setNewPassword('');
      } else {
        setPwdError(data.error || 'فشل التغيير');
      }
    } catch (e) {
      setPwdError('حدث خطأ بالاتصال');
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProdError('');
    setProdSuccess('');
    if (!currentUser) return;

    if (!prodName || !prodDesc || !prodPrice) {
      setProdError('يرجى إكمال الحقول الأساسية للإعلان');
      return;
    }

    if (prodImages.length === 0) {
      setProdError('يجب عليك إضافة صورة واحدة على الأقل للمنتج');
      return;
    }

    const payload = {
      name: prodName,
      description: prodDesc,
      price: prodPrice,
      governorate: prodGov,
      section: prodSection,
      category: prodCategory,
      condition: prodCondition,
      fragile: prodFragile,
      gift: prodGift,
      negotiable: prodNegotiable,
      quantity: prodQuantity,
      warranty: prodWarranty,
      returnPolicy: prodReturn,
      images: prodImages
    };

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.id}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setProdSuccess(editingProduct ? 'تم تحديث الإعلان وبانتظار موافقة الإدارة مجدداً!' : 'تم نشر الإعلان بنجاح وهو قيد مراجعة الإدارة الآن عيني!');
        fetchProfileData();
        setTimeout(() => {
          setShowAddForm(false);
          setEditingProduct(null);
          setProdName('');
          setProdDesc('');
          setProdPrice('');
          setProdImages([]);
          setProdSuccess('');
        }, 2000);
      } else {
        setProdError(data.error || 'فشل إضافة المنتج');
      }
    } catch (e) {
      setProdError('حدث خطأ بالاتصال');
    }
  };

  const handleEditClick = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdDesc(p.description);
    setProdPrice(p.price.toString());
    setProdGov(p.governorate);
    setProdSection(p.section);
    setProdCategory(p.category);
    setProdCondition(p.condition);
    setProdFragile(p.fragile);
    setProdGift(p.gift);
    setProdNegotiable(p.negotiable);
    setProdQuantity(p.quantity.toString());
    setProdWarranty(p.warranty || '');
    setProdReturn(p.returnPolicy || '');
    setProdImages(p.images || []);
    setShowAddForm(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!currentUser) return;
    if (!window.confirm('هل أنت متأكد من حذف هذا الإعلان نهائياً عيني؟')) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${currentUser.id}` }
      });
      if (res.ok) {
        alert('تم حذف الإعلان بنجاح!');
        fetchProfileData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddImageUrl = () => {
    if (newImageUrl.trim()) {
      setProdImages(prev => [...prev, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setProdImages(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompError('');
    setCompSuccess('');
    if (!currentUser) return;

    if (!compTitle || !compText) {
      setCompError('يرجى كتابة عنوان الشكوى ومحتواها التفصيلي');
      return;
    }

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({
          name: currentUser.name,
          phone: currentUser.phone || undefined,
          email: currentUser.email,
          title: compTitle,
          text: compText
        })
      });

      const data = await res.json();
      if (res.ok) {
        setCompSuccess('تم إرسال الشكوى بنجاح وسيتم معالجتها من قبل الإدارة!');
        setCompTitle('');
        setCompText('');
        fetchProfileData();
      } else {
        setCompError(data.error || 'فشل إرسال الشكوى');
      }
    } catch (e) {
      setCompError('خطأ بالشبكة');
    }
  };

  const iraqiGovernorates = [
    'بغداد', 'البصرة', 'نينوى', 'أربيل', 'بابل', 'النجف', 'كربلاء', 
    'ذي قار', 'ميسان', 'الأنبار', 'ديالى', 'واسط', 'كركوك', 
    'صلاح الدين', 'السليمانية', 'دهوك', 'القادسية', 'المثنى'
  ];

  if (!currentUser) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      
      {/* Profile summary card */}
      <div className="bg-gradient-to-r from-orange-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-right">
          <div className="relative group">
            <img 
              src={currentUser.profileImage || 'https://api.dicebear.com/7.x/initials/svg?seed=User'} 
              alt={currentUser.name} 
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white/20 shadow-md bg-white/10"
            />
            <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="font-extrabold text-lg sm:text-2xl">{currentUser.name}</h2>
            <p className="text-xs text-orange-100 flex items-center justify-center sm:justify-start gap-1">
              <Mail className="w-3.5 h-3.5" /> {currentUser.email}
            </p>
            {currentUser.phone && (
              <p className="text-xs text-orange-100 flex items-center justify-center sm:justify-start gap-1">
                <Phone className="w-3.5 h-3.5" /> {currentUser.phone}
              </p>
            )}
            <p className="text-xs text-orange-100 flex items-center justify-center sm:justify-start gap-1">
              <MapPin className="w-3.5 h-3.5" /> {currentUser.governorate} • {currentUser.district} • {currentUser.area}
            </p>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={onLogout}
            className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-5 py-3 rounded-xl border border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>

      {/* Profile tab layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-sm overflow-hidden p-2.5">
          <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 gap-1">
            
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full text-right px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 lg:shrink ${activeTab === 'orders' ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
            >
              <ShoppingBag className="w-4.5 h-4.5" />
              <span>مشترياتي وطلباتي ({orders.length})</span>
            </button>

            {currentUser.role !== 'user' && (
              <button
                onClick={() => setActiveTab('products')}
                className={`w-full text-right px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 lg:shrink ${activeTab === 'products' ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
              >
                <PlusCircle className="w-4.5 h-4.5" />
                <span>إعلاناتي ومعروضاتي ({products.length})</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('followed_stores')}
              className={`w-full text-right px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 lg:shrink ${activeTab === 'followed_stores' ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
            >
              <Heart className="w-4.5 h-4.5" />
              <span>المعارض المتابعة ({followedStores.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('complaints')}
              className={`w-full text-right px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 lg:shrink ${activeTab === 'complaints' ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
            >
              <AlertTriangle className="w-4.5 h-4.5" />
              <span>الشكاوى والبلاغات ({complaints.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full text-right px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 lg:shrink ${activeTab === 'settings' ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
            >
              <Settings className="w-4.5 h-4.5" />
              <span>إعدادات الملف الشخصي</span>
            </button>

          </div>
        </div>

        {/* Tab content panel */}
        <div className="lg:col-span-9 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-sm p-6 min-h-[400px]">
          
          {loading && (
            <div className="py-20 text-center space-y-2">
              <RefreshCw className="w-8 h-8 animate-spin text-orange-600 mx-auto" />
              <p className="text-slate-400 text-xs">جاري جلب بيانات حسابك عيني...</p>
            </div>
          )}

          {!loading && (
            <>
              {/* Tab: Orders (MUSH-TARA-YAT) */}
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-white border-b border-slate-50 dark:border-slate-900/50 pb-3">
                    مشترياتي وتتبع الطلبات الجارية
                  </h3>

                  {orders.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <p className="text-xs">لم تقم بعمل أي طلب شراء بالمنصة بعد عيني.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map(o => (
                        <div key={o.id} className="p-5 border border-slate-100 dark:border-slate-900 rounded-2xl space-y-4 bg-slate-50/50 dark:bg-slate-900/30">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dashed border-slate-200 dark:border-slate-800 pb-3 text-xs">
                            <div>
                              <p className="font-bold text-slate-800 dark:text-white">رقم الطلب: <span className="font-mono text-orange-600">{o.id}</span></p>
                              <p className="text-[10px] text-slate-400">{new Date(o.createdAt).toLocaleString('ar-IQ')}</p>
                            </div>
                            <div className="text-right sm:text-left">
                              <span className="text-[10px] block text-slate-400">القيمة الإجمالية</span>
                              <span className="font-extrabold text-slate-800 dark:text-white">{o.total.toLocaleString()} د.ع</span>
                            </div>
                          </div>

                          {/* List products in order */}
                          <div className="space-y-2">
                            {o.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs">
                                <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[300px]">
                                  • {item.name} <span className="text-slate-400">({item.quantity} قطع)</span>
                                </span>
                                <span className="font-bold text-slate-600 dark:text-slate-400">{(item.price * item.quantity).toLocaleString()} د.ع</span>
                              </div>
                            ))}
                          </div>

                          {/* Status and visual Stepper tracker */}
                          <div className="pt-3 border-t border-slate-100 dark:border-slate-900">
                            <span className="text-[10px] block text-slate-400 mb-2 font-bold">حالة الطلب ومسار التوصيل:</span>
                            
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-[10px] font-bold">
                              <div className={`p-2 rounded-lg border ${o.status === 'PendingReview' ? 'bg-amber-500 text-white border-transparent' : 'bg-slate-100 text-slate-400 dark:bg-slate-900'}`}>قيد المراجعة</div>
                              <div className={`p-2 rounded-lg border ${o.status === 'Accepted' ? 'bg-blue-500 text-white border-transparent' : 'bg-slate-100 text-slate-400 dark:bg-slate-900'}`}>تم القبول</div>
                              <div className={`p-2 rounded-lg border ${o.status === 'Preparing' ? 'bg-indigo-500 text-white border-transparent' : 'bg-slate-100 text-slate-400 dark:bg-slate-900'}`}>جاري التجهيز</div>
                              <div className={`p-2 rounded-lg border ${o.status === 'Shipping' ? 'bg-purple-500 text-white border-transparent' : 'bg-slate-100 text-slate-400 dark:bg-slate-900'}`}>جاري الشحن</div>
                              <div className={`p-2 rounded-lg border ${o.status === 'Delivered' ? 'bg-orange-600 text-white border-transparent animate-pulse' : 'bg-slate-100 text-slate-400 dark:bg-slate-900'}`}>تم التسليم 🎉</div>
                              <div className={`p-2 rounded-lg border ${o.status === 'Cancelled' ? 'bg-red-500 text-white border-transparent' : 'bg-slate-100 text-slate-400 dark:bg-slate-900'}`}>ملغي</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: My Products (CRUD for merchant) */}
              {activeTab === 'products' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-900 pb-3">
                    <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">إعلاناتي ومنتجاتي المعروضة</h3>
                    <button
                      onClick={() => { setEditingProduct(null); setShowAddForm(!showAddForm); }}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>إضافة إعلان جديد</span>
                    </button>
                  </div>

                  {/* Add / Edit Form Modal representation */}
                  {showAddForm && (
                    <form onSubmit={handleAddProduct} className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 space-y-4 text-xs">
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-orange-600 animate-pulse" />
                        <span>{editingProduct ? `تعديل إعلان: ${editingProduct.name}` : 'تفاصيل الإعلان والمنتج الجديد'}</span>
                      </h4>

                      {prodError && <p className="text-red-500 font-bold">⚠️ {prodError}</p>}
                      {prodSuccess && <p className="text-orange-600 font-bold">🎉 {prodSuccess}</p>}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1 sm:col-span-2">
                          <label className="font-bold text-slate-600 dark:text-slate-400 block">اسم المنتج المعروض <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            placeholder="مثال: آيفون 14 برو ماكس نظيف جداً"
                            value={prodName}
                            onChange={e => setProdName(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-white px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-orange-600 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 dark:text-slate-400 block">القسم الرئيسي <span className="text-red-500">*</span></label>
                          <select
                            value={prodSection}
                            onChange={e => setProdSection(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-white px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                          >
                            {sections.map(sec => (
                              <option key={sec} value={sec}>{sec}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 dark:text-slate-400 block">الفئة الفرعية <span className="text-red-500">*</span></label>
                          <select
                            value={prodCategory}
                            onChange={e => setProdCategory(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-white px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                          >
                            {getSubcategoriesForSection(prodSection).map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 dark:text-slate-400 block">سعر البيع بالدينار العراقي <span className="text-red-500">*</span></label>
                          <input
                            type="number"
                            placeholder="مثال: 450000"
                            value={prodPrice}
                            onChange={e => setProdPrice(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-white px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-orange-600 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 dark:text-slate-400 block">المحافظة <span className="text-red-500">*</span></label>
                          <select
                            value={prodGov}
                            onChange={e => setProdGov(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-white px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                          >
                            {iraqiGovernorates.map(g => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 dark:text-slate-400 block">الحالة <span className="text-red-500">*</span></label>
                          <select
                            value={prodCondition}
                            onChange={e => setProdCondition(e.target.value as any)}
                            className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-white px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                          >
                            <option value="جديد">جديد (غير مستعمل)</option>
                            <option value="مستعمل">مستعمل</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 dark:text-slate-400 block">الكمية المتوفرة</label>
                          <input
                            type="number"
                            value={prodQuantity}
                            onChange={e => setProdQuantity(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-white px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 dark:text-slate-400 block">الضمان (إن وجد)</label>
                          <input
                            type="text"
                            placeholder="مثال: ضمان 6 أشهر"
                            value={prodWarranty}
                            onChange={e => setProdWarranty(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-white px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 dark:text-slate-400 block">سياسة الإرجاع (إن وجدت)</label>
                          <input
                            type="text"
                            placeholder="مثال: إرجاع خلال 3 أيام"
                            value={prodReturn}
                            onChange={e => setProdReturn(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-white px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 pt-1">
                        <label className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={prodNegotiable}
                            onChange={e => setProdNegotiable(e.target.checked)}
                            className="rounded text-orange-600 focus:ring-orange-500"
                          />
                          السعر قابل للتفاوض
                        </label>
                        <label className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={prodFragile}
                            onChange={e => setProdFragile(e.target.checked)}
                            className="rounded text-orange-600 focus:ring-orange-500"
                          />
                          المنتج قابل للكسر
                        </label>
                        <label className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={prodGift}
                            onChange={e => setProdGift(e.target.checked)}
                            className="rounded text-orange-600 focus:ring-orange-500"
                          />
                          يوجد هدية مجانية مع المنتج
                        </label>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-600 dark:text-slate-400 block">الوصف الكامل والمميزات <span className="text-red-500">*</span></label>
                        <textarea
                          rows={4}
                          placeholder="اكتب مواصفات المنتج بالتفصيل، العيوب إن وجدت، والملحقات..."
                          value={prodDesc}
                          onChange={e => setProdDesc(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-white px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-orange-600 focus:outline-none"
                        />
                      </div>

                      {/* Image Upload Area */}
                      <div className="space-y-2">
                        <label className="font-bold text-slate-600 dark:text-slate-400 block">صور المنتج <span className="text-red-500">*</span></label>
                        
                        {/* Selected Images List */}
                        {prodImages.length > 0 && (
                          <div className="flex flex-wrap gap-2 pb-2">
                            {prodImages.map((img, idx) => (
                              <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200">
                                <img src={img} alt="" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => setProdImages(prev => prev.filter((_, i) => i !== idx))}
                                  className="absolute top-0 right-0 bg-red-600 text-white p-0.5 rounded-bl hover:bg-red-700 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                          {/* File input (for local files, converts to Base64) */}
                          <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-white dark:bg-slate-950 text-center hover:bg-slate-50 cursor-pointer">
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleFileChange}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <p className="text-[10px] text-slate-500 font-bold flex items-center justify-center gap-1.5">
                              <Camera className="w-4 h-4 text-orange-600" />
                              <span>اختر ملف صورة من جهازك عيني</span>
                            </p>
                          </div>

                          {/* Image URL Input */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="أو ضع رابط صورة مباشر..."
                              value={newImageUrl}
                              onChange={e => setNewImageUrl(e.target.value)}
                              className="flex-1 bg-white dark:bg-slate-950 text-slate-800 dark:text-white px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleAddImageUrl}
                              className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-xl"
                            >
                              إضافة
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setShowAddForm(false)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl"
                        >
                          إلغاء الأمر
                        </button>
                        <button
                          type="submit"
                          className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md"
                        >
                          {editingProduct ? 'تحديث الإعلان وحفظ التعديلات' : 'تأكيد ونشر الإعلان للمراجعة'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Products Grid list */}
                  <div className="space-y-3">
                    {products.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">لا توجد إعلانات نشطة أو معلقة لك حالياً عيني.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {products.map(p => (
                          <div key={p.id} className="p-4 border border-slate-100 dark:border-slate-900 rounded-2xl flex gap-3 items-center bg-slate-50/50 dark:bg-slate-900/10">
                            <img 
                              src={p.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=150'} 
                              alt={p.name} 
                              className="w-14 h-14 rounded-xl object-cover shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-xs text-slate-800 dark:text-white truncate">{p.name}</h4>
                              <p className="text-[10px] text-slate-400">{p.price.toLocaleString()} د.ع • {p.governorate}</p>
                              
                              {/* Status Badge */}
                              <span className={`inline-block text-[8px] font-bold px-2 py-0.5 rounded mt-1 text-white ${
                                p.status === 'Approved' ? 'bg-orange-600' :
                                p.status === 'Pending' ? 'bg-amber-500' :
                                p.status === 'NeedsEdit' ? 'bg-indigo-600' : 'bg-red-500'
                              }`}>
                                {p.status === 'Approved' ? 'مقبول ونشط' :
                                 p.status === 'Pending' ? 'بانتظار المراجعة' :
                                 p.status === 'NeedsEdit' ? 'يحتاج تعديل' : 'مرفوض'}
                              </span>
                            </div>

                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleEditClick(p)}
                                className="p-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:text-orange-600 rounded-xl shadow-xs transition-colors"
                                title="تعديل الإعلان"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:text-red-500 rounded-xl shadow-xs transition-colors"
                                title="حذف الإعلان"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* Tab: Followed Stores */}
              {activeTab === 'followed_stores' && (
                <div className="space-y-6">
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-white border-b border-slate-50 dark:border-slate-900/50 pb-3">
                    المعارض والمتاجر المتابعة من قبلي
                  </h3>

                  {followedStores.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <p className="text-xs">لا تتابع أي متاجر معتمدة حالياً عيني.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {followedStores.map(store => (
                        <div 
                          key={store.id} 
                          onClick={() => onNavigate('store', store.id)}
                          className="p-4 border border-slate-100 dark:border-slate-900 rounded-2xl flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/10 cursor-pointer hover:border-orange-500/30 transition-all"
                        >
                          <div className="flex items-center gap-2.5">
                            <img 
                              src={store.logo} 
                              alt={store.name} 
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                            <div>
                              <h4 className="font-bold text-xs text-slate-800 dark:text-white">{store.name}</h4>
                              <p className="text-[10px] text-slate-400">{store.location}</p>
                            </div>
                          </div>
                          <ChevronLeft className="w-4 h-4 text-slate-400" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Complaints (Direct form to admin) */}
              {activeTab === 'complaints' && (
                <div className="space-y-6">
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-white border-b border-slate-50 dark:border-slate-900/50 pb-3">
                    تقديم شكوى أو بلاغ للمشرفين
                  </h3>

                  {/* Complaint input Form */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/20 rounded-2xl border border-slate-100 dark:border-slate-900/50">
                    {compSuccess && <p className="text-orange-600 font-bold mb-3">🎉 {compSuccess}</p>}
                    {compError && <p className="text-red-500 font-bold mb-3">⚠️ {compError}</p>}

                    <form onSubmit={handleAddComplaint} className="space-y-4 text-xs">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-600 dark:text-slate-400 block">عنوان الشكوى أو موضوع البلاغ</label>
                        <input
                          type="text"
                          placeholder="مثال: احتيال من بائع، مشكلة بالتطبيق..."
                          value={compTitle}
                          onChange={e => setCompTitle(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-white px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-orange-600 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-600 dark:text-slate-400 block">تفاصيل الشكوى الكاملة بالوقائع</label>
                        <textarea
                          rows={4}
                          placeholder="يرجى كتابة كافة التفاصيل والأرقام والأسماء ليتم فحص الشكوى فوراً واتخاذ الإجراء اللازم من قبل أبو فهد..."
                          value={compText}
                          onChange={e => setCompText(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-white px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-orange-600 focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        إرسال بلاغ الشكوى فوراً
                      </button>
                    </form>
                  </div>

                  {/* List of user complaints */}
                  <div className="space-y-3 pt-4">
                    <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300">سجل بلاغاتك السابقة ({complaints.length})</h4>
                    {complaints.length === 0 ? (
                      <p className="text-[11px] text-slate-400">لا توجد شكاوى سابقة لك عيني.</p>
                    ) : (
                      <div className="space-y-2">
                        {complaints.map(c => (
                          <div key={c.id} className="p-3.5 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-900 text-xs flex justify-between items-start">
                            <div>
                              <h5 className="font-bold text-slate-800 dark:text-white">{c.title}</h5>
                              <p className="text-slate-500 mt-1">{c.text}</p>
                              <span className="text-[9px] text-slate-400 block mt-2">{new Date(c.createdAt).toLocaleDateString('ar-IQ')}</span>
                            </div>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${c.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400' : 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-400'}`}>
                              {c.status === 'pending' ? 'قيد المعالجة' : 'تم الحل والاتصال'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* Tab: Settings */}
              {activeTab === 'settings' && (
                <div className="space-y-8">
                  {/* Personal info edit */}
                  <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                    <h3 className="font-extrabold text-sm text-slate-800 dark:text-white border-b border-slate-50 dark:border-slate-900/50 pb-3">
                      تعديل البيانات الشخصية والعنوان
                    </h3>

                    {settingsSuccess && <p className="text-orange-600 font-bold">🎉 {settingsSuccess}</p>}
                    {settingsError && <p className="text-red-500 font-bold">⚠️ {settingsError}</p>}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-600 dark:text-slate-400 block">الاسم الثلاثي</label>
                        <input
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-white px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-600 dark:text-slate-400 block">المحافظة</label>
                        <select
                          value={gov}
                          onChange={e => setGov(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-white px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                        >
                          {iraqiGovernorates.map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-600 dark:text-slate-400 block">القضاء</label>
                        <input
                          type="text"
                          value={district}
                          onChange={e => setDistrict(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-white px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-600 dark:text-slate-400 block">المنطقة</label>
                        <input
                          type="text"
                          value={area}
                          onChange={e => setArea(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-white px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <label className="font-bold text-slate-600 dark:text-slate-400 block">العنوان السكني الكامل بالتفصيل</label>
                        <input
                          type="text"
                          value={address}
                          onChange={e => setAddress(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-white px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <label className="font-bold text-slate-600 dark:text-slate-400 block">رابط صورة الملف الشخصي</label>
                        <input
                          type="text"
                          value={profileImage}
                          onChange={e => setProfileImage(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-white px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      حفظ التعديلات العامة
                    </button>
                  </form>

                  {/* Password update form */}
                  <form onSubmit={handleChangePassword} className="space-y-4 text-xs pt-6 border-t border-slate-100 dark:border-slate-900">
                    <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">تغيير كلمة المرور الشخصية</h3>

                    {pwdSuccess && <p className="text-orange-600 font-bold">🎉 {pwdSuccess}</p>}
                    {pwdError && <p className="text-red-500 font-bold">⚠️ {pwdError}</p>}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-600 dark:text-slate-400 block">كلمة المرور القديمة</label>
                        <input
                          type="password"
                          value={oldPassword}
                          onChange={e => setOldPassword(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-white px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-600 dark:text-slate-400 block">كلمة المرور الجديدة</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-white px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      تغيير كلمة المرور
                    </button>
                  </form>
                </div>
              )}
            </>
          )}

        </div>

      </div>

    </div>
  );
}
