import React, { useState, useEffect } from 'react';
import { 
  Search, MapPin, Grid, Heart, Sparkles, Star, Store, 
  ArrowLeft, ArrowRight, Tag, SlidersHorizontal, CheckCircle, RefreshCw,
  ShieldAlert, Filter, ArrowUpRight, HelpCircle,
  Car, Building2, Smartphone, Tv, Laptop, Gamepad2, Sofa, Home as HomeIcon, Shirt, Clock, Package, Briefcase, Plus, Bell, CheckCircle2, MessageSquare, ChevronLeft, ChevronRight, Eye, AlertTriangle, EyeOff, User as UserIcon
} from 'lucide-react';
import { User, Product, CartItem, Store as StoreType, SystemSettings } from './types';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import ProductDetail from './components/ProductDetail';
import StorePage from './components/StorePage';
import CartPage from './components/CartPage';
import ProfilePage from './components/ProfilePage';
import ChatsPage from './components/ChatsPage';
import AdminPanel from './components/AdminPanel';
import CatalogsPage from './components/CatalogsPage';

export default function App() {
  // Views navigation
  const [currentView, setCurrentView] = useState<string>('home');
  const [activeTargetId, setActiveTargetId] = useState<string>('');
  
  // Authentication states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>('');
  const [showLoginModal, setShowLoginModal] = useState(false);

  // General App states
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<StoreType[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedGov, setSelectedGov] = useState<string>('الكل');
  const [selectedSection, setSelectedSection] = useState<string>('الكل');
  const [selectedCondition, setSelectedCondition] = useState<string>('الكل');
  const [selectedSort, setSelectedSort] = useState<string>('recent');

  // Dark/Light Mode state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Initialize Dark Mode on startup
  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark';
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    localStorage.setItem('theme', nextDark ? 'dark' : 'light');
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Re-fetch products and stores
  const fetchMarketplaceData = () => {
    setLoading(true);
    fetch('/api/products')
      .then(res => res.json())
      .then((data: any) => {
        if (Array.isArray(data)) {
          setProducts(data);
        } else if (data && Array.isArray(data.products)) {
          setProducts(data.products);
        }
      })
      .catch(err => console.error(err));

    fetch('/api/stores')
      .then(res => res.json())
      .then((data: StoreType[]) => {
        if (Array.isArray(data)) setStores(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchMarketplaceData();

    // Rehydrate auth
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      const userObj = JSON.parse(storedUser) as User;
      
      // Verify token with backend
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${userObj.id}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.id) {
            setCurrentUser(data);
          } else {
            // Clean expired auth
            handleLogout();
          }
        })
        .catch(() => handleLogout());
    }

    // Load Cart & Favorites from LocalStorage
    const storedCart = localStorage.getItem('cart');
    if (storedCart) setCartItems(JSON.parse(storedCart));

    const storedFavs = localStorage.getItem('favorites');
    if (storedFavs) setFavorites(JSON.parse(storedFavs));
  }, []);

  const handleLoginSuccess = (user: User, userToken: string) => {
    setCurrentUser(user);
    setToken(userToken);
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(user));
    fetchMarketplaceData(); // Refetch to load personalized stats or approved products
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken('');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentView('home');
  };

  const handleNavigate = (view: string, targetId: string = '') => {
    setCurrentView(view);
    setActiveTargetId(targetId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cart operations
  const handleAddToCart = (product: Product, qty: number) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.productId === product.id);
      let updated;
      if (existing) {
        updated = prev.map(item => item.productId === product.id 
          ? { ...item, quantity: item.quantity + qty } 
          : item
        );
      } else {
        updated = [...prev, { productId: product.id, quantity: qty, product }];
      }
      localStorage.setItem('cart', JSON.stringify(updated));
      return updated;
    });
  };

  const handleUpdateCartQuantity = (productId: string, qty: number) => {
    setCartItems(prev => {
      const updated = prev.map(item => item.productId === productId 
        ? { ...item, quantity: qty } 
        : item
      );
      localStorage.setItem('cart', JSON.stringify(updated));
      return updated;
    });
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems(prev => {
      const updated = prev.filter(item => item.productId !== productId);
      localStorage.setItem('cart', JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
  };

  // Favorites operations
  const handleToggleFavorite = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering card click details
    if (!currentUser) {
      setShowLoginModal(true);
      return;
    }

    setFavorites(prev => {
      const exists = prev.includes(productId);
      const updated = exists 
        ? prev.filter(id => id !== productId) 
        : [...prev, productId];
      localStorage.setItem('favorites', JSON.stringify(updated));
      return updated;
    });
  };

  // Filtering Logic
  const filteredProducts = products.filter(p => {
    // Only display approved products unless current user is admin
    if (p.status !== 'Approved' && currentUser?.role !== 'admin') return false;

    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.section.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGov = selectedGov === 'الكل' || p.governorate === selectedGov;
    const matchesSection = selectedSection === 'الكل' || p.section === selectedSection;
    const matchesCondition = selectedCondition === 'الكل' || p.condition === selectedCondition;

    return matchesSearch && matchesGov && matchesSection && matchesCondition;
  });

  // Sorting logic
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (selectedSort === 'recent') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (selectedSort === 'price-asc') {
      return a.price - b.price;
    }
    if (selectedSort === 'price-desc') {
      return b.price - a.price;
    }
    if (selectedSort === 'popular') {
      return (b.views || 0) - (a.views || 0);
    }
    return 0;
  });

  const iraqiGovernorates = [
    'الكل', 'بغداد', 'البصرة', 'نينوى', 'أربيل', 'بابل', 'النجف', 'كربلاء', 
    'ذي قار', 'ميسان', 'الأنبار', 'ديالى', 'واسط', 'كركوك', 
    'صلاح الدين', 'السليمانية', 'دهوك', 'القادسية', 'المثنى'
  ];

  const sections = [
    'الكل', 'السيارات', 'العقارات', 'الهواتف', 'الإلكترونيات', 'اللابتوبات', 
    'الألعاب', 'الأثاث', 'الأجهزة المنزلية', 'الملابس', 'ساعات', 'أخرى'
  ];

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const isFilterActive = selectedGov !== 'الكل' || selectedSection !== 'الكل' || selectedCondition !== 'الكل' || searchTerm !== '';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between">
      
      {/* Dynamic System Alert Banner (e.g. Maintenance Mode) */}
      {settings?.maintenanceMode && (
        <div className="bg-red-600 text-white font-extrabold text-xs text-center py-2.5 px-4 shadow-sm animate-pulse z-50">
          ⚙️ النظام يخضع لأعمال صيانة وتحسينات مؤقتة لخدمتكم بشكل أفضل عيني!
        </div>
      )}

      {/* Main Header / Navbar */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onLoginSuccess={handleLoginSuccess}
        onNavigate={handleNavigate}
        currentView={currentView}
        cartCount={totalCartCount}
        onSearch={setSearchTerm}
        showLoginModal={showLoginModal}
        setShowLoginModal={setShowLoginModal}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

      {/* Content Rendering router switch */}
      <main className="flex-1">
        
        {currentView === 'home' && (
          <div className="space-y-0 pb-16">
            {!isFilterActive ? (
              /* ========================================================= */
              /* 1. PORTAL LANDING PAGE VIEW (Screenshot 2 style)          */
              /* ========================================================= */
              <div className="space-y-8 sm:space-y-12">
                {/* A. Winter Announcement Sub-Header */}
                <div className="bg-orange-500/10 text-[#F97316] dark:bg-orange-950/20 dark:text-orange-400 py-3.5 px-4 border-b border-orange-500/10 text-center text-[11px] sm:text-xs font-bold leading-relaxed">
                  🎉 عروض حصرية لفصل الشتاء! تصفح آلاف الإعلانات الجديدة اليوم في جميع أنحاء العراق عيني.
                </div>

                {/* B. Category Slider Section ("الفئات الرئيسية") */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-white flex items-center gap-2">
                      <Grid className="w-5 h-5 text-[#F97316]" />
                      <span>الفئات الرئيسية</span>
                    </h2>
                    <button 
                      onClick={() => {
                        setSelectedSection('الكل');
                        setSearchTerm('');
                        setSelectedGov('الكل');
                      }}
                      className="text-xs font-bold text-[#F97316] hover:underline"
                    >
                      عرض الكل
                    </button>
                  </div>

                  {/* Horizontal Scroll categories */}
                  <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
                    {[
                      { name: 'السيارات', icon: Car },
                      { name: 'العقارات', icon: Building2 },
                      { name: 'الهواتف', icon: Smartphone },
                      { name: 'الإلكترونيات', icon: Tv },
                      { name: 'اللابتوبات', icon: Laptop },
                      { name: 'الألعاب', icon: Gamepad2 },
                      { name: 'الأثاث', icon: Sofa },
                      { name: 'الأجهزة المنزلية', icon: HomeIcon },
                      { name: 'الملابس', icon: Shirt },
                      { name: 'ساعات', icon: Clock },
                      { name: 'أخرى', icon: Package }
                    ].map((cat) => {
                      const IconComponent = cat.icon;
                      return (
                        <div
                          key={cat.name}
                          onClick={() => setSelectedSection(cat.name)}
                          className="flex-shrink-0 flex flex-col items-center gap-2.5 cursor-pointer group select-none"
                        >
                          <div className="w-16 h-16 md:w-20 md:h-20 bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200/50 dark:border-slate-800 flex items-center justify-center transition-all duration-300 shadow-xs group-hover:scale-105 group-hover:border-orange-500/30 group-hover:shadow-[0_8px_20px_-6px_rgba(249,115,22,0.15)] active:scale-95">
                            <IconComponent className="w-7 h-7 text-slate-700 dark:text-slate-300 group-hover:text-[#F97316] transition-colors" />
                          </div>
                          <span className="font-extrabold text-xs text-slate-700 dark:text-slate-300 group-hover:text-[#F97316] transition-colors">
                            {cat.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* C. Immersive Hero Banner Section */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="relative rounded-[24px] sm:rounded-[32px] overflow-hidden bg-slate-950 text-white min-h-[350px] sm:min-h-[400px] flex items-center border border-slate-800/80 shadow-md">
                    <div 
                      className="absolute inset-0 bg-cover bg-center opacity-35 mix-blend-overlay"
                      style={{ backgroundImage: `url('https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=1200&q=80')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-950/80 via-slate-950/85 to-[#431407]/80 z-0" />

                    <div className="relative z-10 w-full max-w-4xl mx-auto px-6 sm:px-12 py-10 text-center sm:text-right space-y-5 sm:space-y-6">
                      <span className="inline-flex items-center gap-1.5 bg-[#F97316]/20 text-[#F97316] font-extrabold text-[10px] sm:text-xs px-4 py-1.5 rounded-full border border-[#F97316]/30">
                        🇮🇶 سوق الجمعة • كلشي جديد ومستعمل بالعراق
                      </span>
                      
                      <h1 className="font-black text-2xl sm:text-4xl md:text-5xl leading-tight text-white max-w-3xl">
                        اكتشف أفضل العروض في العراق
                      </h1>
                      
                      <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                        بيئة آمنة وسهلة لبيع وشراء كل ما تحتاجه، من السيارات إلى العقارات مباشرة من البائع عيني وبدون أي عمولات.
                      </p>

                      {/* Embedded search tool inside Hero */}
                      <div className="pt-4 max-w-3xl">
                        <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-850 flex flex-col sm:flex-row items-center gap-2">
                          <div className="w-full flex items-center gap-2 px-3">
                            <Search className="w-5 h-5 text-slate-400 shrink-0" />
                            <input
                              type="text"
                              placeholder="ابحث عن سيارات، لابتوبات، هواتف، أثاث..."
                              value={searchTerm}
                              onChange={e => setSearchTerm(e.target.value)}
                              className="w-full bg-transparent text-slate-800 dark:text-white px-1 py-3 focus:outline-none text-xs sm:text-sm font-semibold"
                            />
                          </div>

                          <div className="w-full sm:w-auto shrink-0 border-r border-slate-100 dark:border-slate-800 pr-2 pl-2">
                            <select
                              value={selectedGov}
                              onChange={e => setSelectedGov(e.target.value)}
                              className="w-full bg-transparent text-slate-700 dark:text-slate-300 font-extrabold text-xs py-2 focus:outline-none cursor-pointer"
                            >
                              {iraqiGovernorates.map(gov => (
                                <option key={gov} value={gov} className="text-slate-900">
                                  {gov === 'الكل' ? 'كل العراق' : gov}
                                </option>
                              ))}
                            </select>
                          </div>

                          <button 
                            onClick={() => {
                              if (searchTerm || selectedGov !== 'الكل') {
                                // Activates filters
                              }
                            }}
                            className="w-full sm:w-auto bg-[#F97316] hover:bg-[#EA580C] text-white font-extrabold text-xs px-8 py-3 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                          >
                            ابحث الآن
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* D. Featured Ads ("إعلانات مميزة") */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500/10" />
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-white">إعلانات مميزة</h3>
                    </div>
                    <button 
                      onClick={() => setSelectedSort('popular')}
                      className="text-xs font-bold text-slate-400 hover:text-[#F97316] transition-colors"
                    >
                      مشاهدة الكل
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 items-stretch">
                    {products.slice(0, 4).map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onViewDetails={id => handleNavigate('product', id)}
                        onToggleFavorite={handleToggleFavorite}
                        isFavorited={favorites.includes(product.id)}
                      />
                    ))}
                  </div>
                </div>

                {/* E. Intermediate Promo Banner */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="bg-gradient-to-r from-orange-600 to-orange-800 text-white rounded-[24px] p-6 sm:p-8 relative overflow-hidden shadow-md border border-orange-500/20">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                      <div className="space-y-2 max-w-2xl text-right">
                        <span className="inline-block bg-white/20 text-white font-extrabold text-[10px] px-3.5 py-1 rounded-full border border-white/15">
                          عقارات العراق 🏢
                        </span>
                        <h3 className="font-black text-sm sm:text-lg md:text-xl">
                          هل تبحث عن منزل أحلامك أو شقة للإيجار؟
                        </h3>
                        <p className="text-[11px] sm:text-xs text-orange-100/90 leading-relaxed font-semibold">
                          تصفح مئات الفلل، الشقق، والأراضي المعروضة للبيع والإيجار مباشرة من أصحابها المالكين وبدون عمولات وسيط عيني!
                        </p>
                      </div>
                      <button 
                        onClick={() => setSelectedSection('العقارات')}
                        className="bg-white text-orange-700 hover:bg-orange-50 font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-md active:scale-95 whitespace-nowrap self-start md:self-center cursor-pointer"
                      >
                        تصفح العقارات الآن
                      </button>
                    </div>
                  </div>
                </div>

                {/* F. Featured Stores ("متاجر مميزة") */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <Store className="w-5 h-5 text-[#F97316]" />
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-white">متاجر مميزة</h3>
                    </div>
                    <button 
                      onClick={() => setCurrentView('catalogs')}
                      className="text-xs font-bold text-slate-400 hover:text-[#F97316] transition-colors"
                    >
                      عرض كل المعارض
                    </button>
                  </div>

                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
                    {stores.map(store => (
                      <div 
                        key={store.id}
                        onClick={() => handleNavigate('store', store.id)}
                        className="flex-shrink-0 flex flex-col items-center gap-2.5 cursor-pointer group"
                      >
                        <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 shadow-sm group-hover:shadow-md group-hover:border-orange-500/40 transition-all duration-300">
                          <img 
                            src={store.logo} 
                            alt={store.name} 
                            className="w-full h-full rounded-full object-cover"
                          />
                          <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1 shadow-xs border border-white dark:border-slate-950">
                            <CheckCircle2 className="w-3 h-3 text-white fill-current" />
                          </div>
                        </div>
                        <span className="font-extrabold text-xs text-slate-800 dark:text-white group-hover:text-orange-500 transition-colors">
                          {store.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {store.governorate || 'موثق'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* G. Latest Ads ("أحدث الإعلانات") */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex items-center justify-between mb-5 pb-2 border-b border-slate-100 dark:border-slate-900">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#F97316]" />
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-white">أحدث الإعلانات والسلع</h3>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                      <span className="text-[10px] text-slate-400">الترتيب:</span>
                      <select
                        value={selectedSort}
                        onChange={e => setSelectedSort(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[11px] font-bold focus:outline-none"
                      >
                        <option value="recent">الأحدث المضافة</option>
                        <option value="popular">الأكثر شعبية</option>
                        <option value="price-asc">السعر: من الأقل</option>
                        <option value="price-desc">السعر: من الأعلى</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 items-stretch">
                    {products.slice(4).map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onViewDetails={id => handleNavigate('product', id)}
                        onToggleFavorite={handleToggleFavorite}
                        isFavorited={favorites.includes(product.id)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* ========================================================= */
              /* 2. ADVANCED FILTER / SEARCH VIEW (Screenshot 1 style)     */
              /* ========================================================= */
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                {/* Back button or Breadcrumbs to home portal */}
                <div className="flex items-center gap-2 mb-6">
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedGov('الكل');
                      setSelectedSection('الكل');
                      setSelectedCondition('الكل');
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#F97316] transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>العودة للرئيسية</span>
                  </button>
                  <span className="text-slate-300">/</span>
                  <span className="text-xs font-bold text-slate-400">نتائج البحث والتصفية</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  {/* RIGHT COLUMN: STICKY DESKTOP FILTER SIDEBAR */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="lg:sticky lg:top-24 space-y-6">
                      
                      {/* Main Sidebar Filter Card */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <Filter className="w-4.5 h-4.5 text-[#F97316]" />
                            <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">تصفية الإعلانات</h4>
                          </div>
                          <button 
                            onClick={() => {
                              setSearchTerm('');
                              setSelectedGov('الكل');
                              setSelectedSection('الكل');
                              setSelectedCondition('الكل');
                            }}
                            className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                          >
                            إعادة تعيين الكل
                          </button>
                        </div>

                        {/* Search term notice */}
                        {searchTerm && (
                          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                            <span className="text-slate-400 block font-bold text-[9px] uppercase">البحث الحالي:</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300 block truncate mt-0.5">{searchTerm}</span>
                          </div>
                        )}

                        {/* Fast Sections Navigation inside sidebar */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 block uppercase">الأقسام والفئات</label>
                          <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                            {sections.map(sec => (
                              <button
                                key={sec}
                                onClick={() => setSelectedSection(sec)}
                                className={`w-full text-right px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${selectedSection === sec ? 'bg-orange-50 text-[#F97316] font-bold dark:bg-orange-950/20' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                              >
                                <span>{sec === 'الكل' ? '📂 كل الفئات والسلع' : sec}</span>
                                {selectedSection === sec && <span className="w-1.5 h-1.5 rounded-full bg-[#F97316]" />}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Governorate Filter inside sidebar */}
                        <div className="space-y-1.5 pt-3 border-t border-slate-50 dark:border-slate-900/50">
                          <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 block uppercase">المحافظة (العراق)</label>
                          <select
                            value={selectedGov}
                            onChange={e => setSelectedGov(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-[#F97316] text-slate-700 dark:text-slate-300"
                          >
                            {iraqiGovernorates.map(gov => (
                              <option key={gov} value={gov}>{gov === 'الكل' ? 'كل محافظات العراق' : gov}</option>
                            ))}
                          </select>
                        </div>

                        {/* Condition filter segmented buttons */}
                        <div className="space-y-1.5 pt-3 border-t border-slate-50 dark:border-slate-900/50">
                          <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 block uppercase">الحالة</label>
                          <div className="grid grid-cols-3 gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-100 dark:border-slate-800">
                            {['الكل', 'جديد', 'مستعمل'].map(cond => (
                              <button
                                key={cond}
                                onClick={() => setSelectedCondition(cond)}
                                className={`py-1.5 rounded-lg text-[10px] font-bold transition-all text-center cursor-pointer ${selectedCondition === cond ? 'bg-white dark:bg-slate-900 text-[#F97316] shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                              >
                                {cond}
                              </button>
                            ))}
                          </div>
                        </div>

                      </div>

                      {/* Highly Professional Safety Tips Box */}
                      <div className="bg-orange-50/40 dark:bg-orange-950/5 border border-orange-200/40 dark:border-orange-900/30 rounded-2xl p-5 space-y-3.5">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-5 h-5 text-[#F97316] shrink-0" />
                          <h4 className="font-extrabold text-xs text-orange-800 dark:text-orange-400">مركز التعامل الآمن بالمنصة</h4>
                        </div>
                        <p className="text-[10.5px] leading-relaxed text-orange-700 dark:text-orange-300/80">
                          لضمان حمايتك في سوق الجمعة عيني، نوصيك باتباع الإرشادات التالية قبل إتمام أي صفقات:
                        </p>
                        <ul className="space-y-2 text-[10px] text-orange-800/90 dark:text-orange-400/80 font-semibold list-disc pr-3.5 pl-1 text-right">
                          <li>لا تقم بتحويل أي عربون مسبق قبل معاينة وفحص السلعة بنفسك.</li>
                          <li>قابل البائع دائماً في مكان عام وآمن ومزدحم بالحركة (مثل المجمعات التجارية).</li>
                          <li>افحص الأوراق الرسمية والمستندات للسيارات والهواتف بدقة عيني.</li>
                        </ul>
                      </div>

                    </div>
                  </div>

                  {/* LEFT COLUMN: FILTERED PRODUCTS GRID */}
                  <div className="lg:col-span-3 space-y-6">
                    
                    {/* Category chips row at the top of results */}
                    <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
                      {sections.map(sec => (
                        <button
                          key={sec}
                          onClick={() => setSelectedSection(sec)}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${selectedSection === sec ? 'bg-[#F97316] border-[#F97316] text-white shadow-xs' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'}`}
                        >
                          {sec === 'الكل' ? '📂 الكل' : sec}
                        </button>
                      ))}
                    </div>

                    {/* Results count & Sorting selector */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="text-right">
                        <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">الإعلانات والسلع المعروضة بالمنصة</h3>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">تم العثور على {sortedProducts.length} إعلان نشط ومطابق</p>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                        <span className="text-[10px] text-slate-400">الترتيب:</span>
                        <select
                          value={selectedSort}
                          onChange={e => setSelectedSort(e.target.value)}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[11px] font-bold focus:outline-none cursor-pointer"
                        >
                          <option value="recent">الأحدث المضافة</option>
                          <option value="popular">الأكثر شعبية</option>
                          <option value="price-asc">السعر: من الأقل</option>
                          <option value="price-desc">السعر: من الأعلى</option>
                        </select>
                      </div>
                    </div>

                    {/* Filtered grid output */}
                    {sortedProducts.length === 0 ? (
                      <div className="text-center py-20 text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-xs max-w-lg mx-auto">
                        <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-xs font-extrabold">آسفين عيني! ماكو نتائج مطابقة لتصفيتك أو بحثك الحالي.</p>
                        <button 
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedGov('الكل');
                            setSelectedSection('الكل');
                            setSelectedCondition('الكل');
                          }}
                          className="mt-4 bg-[#F97316] text-white font-extrabold text-[10px] px-5 py-2.5 rounded-xl cursor-pointer"
                        >
                          إعادة تصفير جميع الفلاتر والخيارات
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch">
                        {sortedProducts.map(product => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            onViewDetails={id => handleNavigate('product', id)}
                            onToggleFavorite={handleToggleFavorite}
                            isFavorited={favorites.includes(product.id)}
                          />
                        ))}
                      </div>
                    )}

                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'product' && (
          <ProductDetail
            productId={activeTargetId}
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onAddToCart={handleAddToCart}
            onStartChat={recipientId => handleNavigate('chats', recipientId)}
            onTriggerLogin={() => setShowLoginModal(true)}
          />
        )}

        {currentView === 'store' && (
          <StorePage
            storeId={activeTargetId}
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onToggleFavoriteProduct={handleToggleFavorite}
            favorites={favorites}
          />
        )}

        {currentView === 'cart' && (
          <CartPage
            currentUser={currentUser}
            cartItems={cartItems}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'profile' && (
          <ProfilePage
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        )}

        {currentView === 'chats' && (
          <ChatsPage
            currentUser={currentUser}
            onNavigate={handleNavigate}
            activeRecipientId={activeTargetId}
          />
        )}

        {currentView === 'admin' && (
          <AdminPanel
            currentUser={currentUser}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'catalogs' && (
          <CatalogsPage
            onNavigate={handleNavigate}
          />
        )}

      </main>

      {/* Modern responsive Footer */}
      <footer className="bg-slate-900 text-white border-t border-slate-800 py-10 sm:py-14 text-xs font-medium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pb-8 border-b border-slate-800">
            <div className="space-y-3">
              <h4 className="font-extrabold text-sm text-orange-400">سوق الجمعة العراقي الحبيب 🇮🇶</h4>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                منصة عراقية وطنية متكاملة لتسهيل عمليات البيع والشراء والتبادل التجاري المباشر بين المشترين والبائعين والشركات بكل ثقة وأمان.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-200">روابط التصفح السريع</h4>
              <ul className="space-y-1.5 text-slate-400 text-[11px]">
                <li><button onClick={() => handleNavigate('home')} className="hover:text-orange-400 text-right cursor-pointer">الرئيسية والتسوق</button></li>
                <li><button onClick={() => handleNavigate('catalogs')} className="hover:text-orange-400 text-right cursor-pointer">كتالوجات وعروض الوكالات</button></li>
                <li><button onClick={() => { if (currentUser) { handleNavigate('profile'); } else { setShowLoginModal(true); } }} className="hover:text-orange-400 text-right cursor-pointer">أضف إعلانك بالمنصة</button></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-200">الدعم الفني والشكاوى</h4>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                بإمكانك دائماً تقديم بلاغات وشكاوى مباشرة إلى الإدارة من خلال حسابك لحل المشاكل التقنية أو مع البائعين فوراً.
              </p>
            </div>
          </div>

          <div className="pt-6 text-center text-slate-500 text-[10px] sm:text-xs">
            <p>© {new Date().getFullYear()} سوق الجمعة العراق. كافة الحقوق محفوظة لجمهورية العراق 🇮🇶.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
