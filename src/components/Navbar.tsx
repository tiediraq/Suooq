import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Bell, User as UserIcon, LogOut, Shield, 
  Store as StoreIcon, Heart, MessageSquare, Menu, X, Search, Phone, ChevronDown, Check,
  MapPin, Lock, Eye, EyeOff, UserCheck, Smile
} from 'lucide-react';
import { User, Notification, SystemSettings } from '../types';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  onLoginSuccess: (user: User, token: string) => void;
  onNavigate: (view: string, targetId?: string) => void;
  currentView: string;
  cartCount: number;
  onSearch: (term: string) => void;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Navbar({
  currentUser,
  onLogout,
  onLoginSuccess,
  onNavigate,
  currentView,
  cartCount,
  onSearch,
  showLoginModal,
  setShowLoginModal,
  isDarkMode,
  toggleDarkMode
}: NavbarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Form registration state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regGov, setRegGov] = useState('بغداد');
  const [regDistrict, setRegDistrict] = useState('');
  const [regArea, setRegArea] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regAge, setRegAge] = useState('');
  const [regGender, setRegGender] = useState<'ذكر' | 'أنثى'>('ذكر');
  const [regAccountType, setRegAccountType] = useState<'بائع حر' | 'صاحب متجر'>('بائع حر');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [regStep, setRegStep] = useState(1);

  // Reset step on modal close or register mode toggles
  useEffect(() => {
    if (!showLoginModal || !isRegisterMode) {
      setRegStep(1);
    }
  }, [showLoginModal, isRegisterMode]);

  // Fetch settings & notifications
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => setSettings(data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${currentUser.id}` }
      })
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) setNotifications(data);
        })
        .catch(err => console.error(err));
    } else {
      setNotifications([]);
    }
  }, [currentUser, currentView]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
    onNavigate('home');
    setIsMobileMenuOpen(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone: loginPhone, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok) {
        onLoginSuccess(data.user, data.token);
        setShowLoginModal(false);
        setLoginPhone('');
        setLoginPassword('');
      } else {
        setFormError(data.error || 'فشل تسجيل الدخول');
      }
    } catch (err) {
      setFormError('حدث خطأ في الاتصال بالخادم');
    }
  };

  const validateStep1 = () => {
    if (!regName.trim()) {
      setFormError('يرجى إدخال الاسم الثلاثي بالكامل عيني');
      return false;
    }
    if (regName.trim().split(/\s+/).length < 3) {
      setFormError('الرجاء كتابة الاسم الثلاثي بالكامل (مثال: علي حسن عبد السادة) عيني');
      return false;
    }
    if (!regAge || Number(regAge) <= 0) {
      setFormError('يرجى إدخال عمر صحيح عيني');
      return false;
    }
    setFormError('');
    return true;
  };

  const validateStep2 = () => {
    if (!regEmail.trim()) {
      setFormError('يرجى إدخال البريد الإلكتروني عيني');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail.trim())) {
      setFormError('يرجى كتابة بريد إلكتروني صحيح (مثال: ali@gmail.com) عيني');
      return false;
    }
    if (regPhone.trim()) {
      const phoneRegex = /^07[3456789]\d{8}$/;
      if (!phoneRegex.test(regPhone.trim())) {
        setFormError('يرجى كتابة رقم هاتف عراقي صحيح يتكون من 11 رقم (مثال: 07701234567) أو تركه فارغاً عيني');
        return false;
      }
    }
    setFormError('');
    return true;
  };

  const validateStep3 = () => {
    if (!regDistrict.trim()) {
      setFormError('يرجى إدخال اسم القضاء عيني');
      return false;
    }
    if (!regArea.trim()) {
      setFormError('يرجى إدخال اسم المنطقة عيني');
      return false;
    }
    if (!regAddress.trim()) {
      setFormError('يرجى إدخال العنوان السكني الكامل عيني');
      return false;
    }
    setFormError('');
    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!validateStep1() || !validateStep2() || !validateStep3()) {
      return;
    }

    if (!regPassword || regPassword.length < 4) {
      setFormError('يرجى إدخال كلمة مرور قوية لا تقل عن 4 رموز عيني');
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          phone: regPhone.trim() || undefined,
          governorate: regGov,
          district: regDistrict,
          area: regArea,
          address: regAddress,
          age: regAge,
          gender: regGender,
          accountType: regAccountType,
          password: regPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        onLoginSuccess(data.user, data.token);
        setFormSuccess('تم إنشاء الحساب بنجاح عيني!');
        setTimeout(() => {
          setShowLoginModal(false);
          setRegName('');
          setRegEmail('');
          setRegPhone('');
          setRegDistrict('');
          setRegArea('');
          setRegAddress('');
          setRegAge('');
          setRegPassword('');
          setFormSuccess('');
        }, 1500);
      } else {
        setFormError(data.error || 'فشل إنشاء الحساب');
      }
    } catch (err) {
      setFormError('حدث خطأ في الاتصال بالخادم');
    }
  };

  const handleMarkNotifRead = async (id: string) => {
    if (!currentUser) return;
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${currentUser.id}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const iraqiGovernorates = [
    'بغداد', 'البصرة', 'نينوى', 'أربيل', 'بابل', 'النجف', 'كربلاء', 
    'ذي قار', 'ميسان', 'الأنبار', 'ديالى', 'واسط', 'كركوك', 
    'صلاح الدين', 'السليمانية', 'دهوك', 'القادسية', 'المثنى'
  ];

  const unreadNotifs = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-150 dark:border-slate-800 shadow-sm transition-all duration-300">
      {/* Premium Dark Top-bar Strip */}
      <div className="bg-slate-900 text-slate-300 text-[10px] sm:text-[11px] py-2 px-4 sm:px-8 flex justify-between items-center border-b border-slate-800">
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-[#F97316] animate-pulse" />
            مرحباً بك في سوق الجمعة - المنصة الأولى للتجارة في العراق الحبيب 🇮🇶
          </span>
          <span className="opacity-40 hidden sm:inline">|</span>
          <span className="flex items-center gap-1 text-slate-400 font-medium">الدعم الفني المباشر: <span className="font-mono text-[#F97316]">07800000000</span></span>
        </div>
        <div className="hidden sm:flex gap-4 text-xs font-semibold">
          <button className="hover:text-[#F97316] transition-colors cursor-pointer">تحميل التطبيق</button>
          <button className="hover:text-[#F97316] transition-colors cursor-pointer">شروط الاستخدام</button>
          <button className="hover:text-[#F97316] transition-colors cursor-pointer">الدعم والشكاوى</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          
          {/* Logo & Brand - Fully Responsive & Professional */}
          <div className="flex items-center gap-3 sm:gap-6 shrink-0">
            <button 
              onClick={() => { onSearch(''); onNavigate('home'); }} 
              className="flex items-center gap-2 sm:gap-3 cursor-pointer focus:outline-none"
            >
              <div className="relative flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#F97316] to-[#FB923C] shadow-md shadow-orange-500/10 text-white font-black text-lg sm:text-xl">
                س
                <span className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white dark:border-slate-900" />
              </div>
              <div className="text-right">
                <h1 className="font-black text-base sm:text-xl tracking-tight text-slate-900 dark:text-white leading-none">
                  سوق <span className="text-[#F97316]">الجمعة</span>
                </h1>
                <span className="text-[8px] sm:text-[9px] font-bold tracking-[0.12em] text-slate-400 dark:text-slate-500 uppercase block mt-0.5 sm:mt-1 hidden sm:block">
                  IRAQ MARKETPLACE
                </span>
              </div>
            </button>

            {/* Desktop Quick Nav Links - Premium Touch */}
            <nav className="hidden lg:flex items-center gap-5 text-xs font-extrabold text-slate-600 dark:text-slate-300 mr-2 border-r border-slate-150 dark:border-slate-800 pr-5">
              <button 
                onClick={() => { onSearch(''); onNavigate('home'); }}
                className={`hover:text-[#F97316] transition-colors cursor-pointer ${currentView === 'home' ? 'text-[#F97316]' : ''}`}
              >
                الرئيسية
              </button>
              <button 
                onClick={() => { onSearch(''); onNavigate('catalogs'); }}
                className={`hover:text-[#F97316] transition-colors cursor-pointer ${currentView === 'catalogs' ? 'text-[#F97316]' : ''}`}
              >
                كتالوج الشركات
              </button>
              {currentUser && (
                <button 
                  onClick={() => onNavigate('chats')}
                  className={`hover:text-[#F97316] transition-colors cursor-pointer ${currentView === 'chats' ? 'text-[#F97316]' : ''}`}
                >
                  الرسائل والمحادثات
                </button>
              )}
            </nav>
          </div>

          {/* Premium Search Bar - Desktop */}
          <div className="hidden md:block flex-1 max-w-lg mx-2 lg:mx-4">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-orange-500/10 transition-all duration-200">
              <div className="flex-1 relative flex items-center">
                <Search className="absolute right-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث عن موبايلات، سيارات، لابتوبات..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent text-slate-800 dark:text-white text-[11px] pr-10 pl-8 py-3 font-semibold focus:outline-none placeholder-slate-400"
                />
                {searchTerm && (
                  <button 
                    type="button" 
                    onClick={() => setSearchTerm('')} 
                    className="absolute left-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button 
                type="submit"
                className="bg-[#F97316] hover:bg-[#EA580C] text-white px-5 py-3 text-[11px] font-extrabold transition-all focus:outline-none cursor-pointer"
              >
                بحث
              </button>
            </form>
          </div>

          {/* Action Icons Panel - Tightened Tablet Gaps */}
          <div className="flex items-center gap-1 sm:gap-2.5 lg:gap-3 shrink-0">
            
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleDarkMode}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-800 text-sm sm:text-base"
              title="تغيير المظهر"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>

            {/* Shopping Cart Button */}
            <button 
              onClick={() => {
                if (!currentUser) {
                  setShowLoginModal(true);
                } else {
                  onNavigate('cart');
                }
              }}
              className="relative p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
            >
              <ShoppingBag className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-slate-600 dark:text-slate-300" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -left-0.5 bg-[#F97316] text-white font-extrabold text-[8px] sm:text-[9px] w-4.5 h-4.5 sm:w-5 sm:h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 shadow-sm animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Notifications Button */}
            <div className="relative">
              <button 
                onClick={() => {
                  if (!currentUser) {
                    setShowLoginModal(true);
                  } else {
                    setShowNotifDropdown(!showNotifDropdown);
                    setShowUserDropdown(false);
                  }
                }}
                className="relative p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
              >
                <Bell className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-slate-600 dark:text-slate-300" />
                {unreadNotifs > 0 && (
                  <span className="absolute top-1 left-1 bg-red-500 w-2 h-2 rounded-full ring-2 ring-white dark:ring-slate-900" />
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifDropdown && currentUser && (
                <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-slate-950 rounded-2xl shadow-xl border border-slate-150 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                    <span className="font-extrabold text-xs text-slate-800 dark:text-white">إشعارات الحساب</span>
                    {unreadNotifs > 0 && (
                      <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full dark:bg-red-950/40 dark:text-red-400">
                        {unreadNotifs} جديدة
                      </span>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-10 text-center text-xs text-slate-400 font-medium">
                        لا توجد إشعارات حالياً عيني
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => handleMarkNotifRead(n.id)}
                          className={`px-4 py-3 border-b border-slate-50 dark:border-slate-900/30 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors ${!n.read ? 'bg-orange-50/20 dark:bg-orange-950/5' : ''}`}
                        >
                          <h4 className="font-bold text-xs text-slate-800 dark:text-white flex items-center justify-between">
                            <span>{n.title}</span>
                            {!n.read && <span className="w-2 h-2 rounded-full bg-[#F97316] inline-block" />}
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{n.text}</p>
                          <span className="text-[8px] text-slate-400 dark:text-slate-500 mt-1.5 block">
                            {new Date(n.createdAt).toLocaleDateString('ar-IQ')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Menu */}
            {currentUser ? (
              <div className="relative">
                <button 
                  onClick={() => {
                    setShowUserDropdown(!showUserDropdown);
                    setShowNotifDropdown(false);
                  }}
                  className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 pl-2 pr-1.5 py-1 rounded-xl transition-all cursor-pointer focus:outline-none"
                >
                  <img 
                    src={currentUser.profileImage || 'https://api.dicebear.com/7.x/initials/svg?seed=User'} 
                    alt={currentUser.name} 
                    className="w-7 h-7 rounded-lg object-cover"
                  />
                  <span className="hidden lg:inline text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[80px] truncate">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {showUserDropdown && (
                  <div className="absolute left-0 mt-2 w-52 bg-white dark:bg-slate-950 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-1.5 z-50">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                      <p className="font-bold text-xs text-slate-800 dark:text-white truncate">{currentUser.name}</p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{currentUser.phone}</p>
                      <span className="inline-block bg-orange-100 text-orange-800 text-[8px] font-bold px-1.5 py-0.5 rounded-full mt-1 dark:bg-orange-950/40 dark:text-orange-400">
                        {currentUser.accountType}
                      </span>
                    </div>

                    <button 
                      onClick={() => { onNavigate('profile'); setShowUserDropdown(false); }}
                      className="w-full text-right px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span>الملف الشخصي والطلبات</span>
                    </button>

                    {currentUser.role === 'store' && (
                      <button 
                        onClick={() => { onNavigate('store', `store-${currentUser.id}`); setShowUserDropdown(false); }}
                        className="w-full text-right px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <StoreIcon className="w-4 h-4 text-slate-400" />
                        <span>صفحة متجري</span>
                      </button>
                    )}

                    {currentUser.role === 'admin' && (
                      <button 
                        onClick={() => { onNavigate('admin'); setShowUserDropdown(false); }}
                        className="w-full text-right px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-900 text-orange-700 dark:text-orange-400 font-bold transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <Shield className="w-4 h-4 text-orange-600" />
                        <span>لوحة التحكم الإدارية</span>
                      </button>
                    )}

                    <button 
                      onClick={() => { onNavigate('chats'); setShowUserDropdown(false); }}
                      className="w-full text-right px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-slate-400" />
                      <span>المحادثات والرسائل</span>
                    </button>

                    <button 
                      onClick={() => { onLogout(); setShowUserDropdown(false); }}
                      className="w-full text-right px-4 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors border-t border-slate-50 dark:border-slate-900/50 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>تسجيل الخروج</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => { setIsRegisterMode(false); setShowLoginModal(true); }}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-orange-500/10 cursor-pointer active:scale-95"
              >
                تسجيل الدخول
              </button>
            )}

            {/* Mobile Menu Icon */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Search & Menu Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="ابحث بالاسم أو المحافظة أو المتجر..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white text-xs px-10 py-2.5 rounded-xl focus:outline-none"
            />
            <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
          </form>

          <div className="flex flex-col gap-2 pt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <button onClick={() => { onSearch(''); onNavigate('home'); setIsMobileMenuOpen(false); }} className="text-right py-2 hover:bg-slate-50 dark:hover:bg-slate-800 px-2 rounded-lg">الرئيسية</button>
            <button onClick={() => { onSearch('الهواتف'); setIsMobileMenuOpen(false); }} className="text-right py-2 hover:bg-slate-50 dark:hover:bg-slate-800 px-2 rounded-lg">الأجهزة والهواتف</button>
            <button onClick={() => { onSearch('السيارات'); setIsMobileMenuOpen(false); }} className="text-right py-2 hover:bg-slate-50 dark:hover:bg-slate-800 px-2 rounded-lg">السيارات والدراجات</button>
            <button onClick={() => { onSearch('الأجهزة المنزلية'); setIsMobileMenuOpen(false); }} className="text-right py-2 hover:bg-slate-50 dark:hover:bg-slate-800 px-2 rounded-lg">الأثاث والأجهزة المنزلية</button>
            <button onClick={() => { onNavigate('catalogs'); setIsMobileMenuOpen(false); }} className="text-right py-2 text-orange-600 dark:text-orange-400 font-bold px-2 rounded-lg">كتالوج وعروض الشركات</button>
          </div>
        </div>
      )}

      {/* Login & Register Modal Popup */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[420px] rounded-[20px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] transition-all">
            {/* Header */}
            <div className="p-5 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/40">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">
                {isRegisterMode ? 'إنشاء حساب جديد بالمنصة' : 'تسجيل الدخول إلى حسابك'}
              </h3>
              <button 
                onClick={() => { setShowLoginModal(false); setFormError(''); }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body with Scroll (24px padding) */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 text-right">
              {formError && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 font-bold text-xs rounded-xl dark:bg-red-950/20 dark:border-red-900 leading-relaxed">
                  ⚠️ {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3.5 bg-orange-50 border border-orange-200 text-orange-700 font-bold text-xs rounded-xl dark:bg-orange-950/20 dark:border-orange-900 leading-relaxed">
                  🎉 {formSuccess}
                </div>
              )}

              {/* Login Form */}
              {!isRegisterMode ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">البريد الإلكتروني أو رقم الهاتف</label>
                    <input
                      type="text"
                      placeholder="مثال: user@example.com أو 07701234567"
                      value={loginPhone}
                      required
                      onChange={e => setLoginPhone(e.target.value)}
                      className="w-full h-12 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white text-xs px-4 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all duration-200 text-left"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">كلمة المرور</label>
                    <input
                      type="password"
                      placeholder="أدخل كلمة المرور الخاصة بك"
                      value={loginPassword}
                      required
                      onChange={e => setLoginPassword(e.target.value)}
                      className="w-full h-12 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white text-xs px-4 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all duration-200 text-left"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full h-[50px] bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-orange-500/10 hover:shadow-orange-500/25 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer whitespace-nowrap"
                    >
                      تسجيل الدخول الآمن
                    </button>
                  </div>

                  {/* Preseeded Info Box */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-150 dark:border-slate-850 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed space-y-1.5">
                    <p className="font-extrabold text-slate-700 dark:text-slate-300 text-xs">💡 حسابات تجريبية سريعة للفحص:</p>
                    <p>• <span className="font-bold">المشرف العام (Admin):</span> <span className="font-mono text-orange-600 dark:text-orange-400 font-bold">admin@souq.com</span> (أو <span className="font-mono text-orange-600 dark:text-orange-400 font-bold">07700000000</span>) - كلمة السر <span className="font-mono">admin</span></p>
                    <p>• <span className="font-bold">صاحب معرض (Store):</span> <span className="font-mono text-orange-600 dark:text-orange-400 font-bold">maryam@souq.com</span> (أو <span className="font-mono text-orange-600 dark:text-orange-400 font-bold">07701234567</span>) - كلمة السر <span className="font-mono">password</span></p>
                    <p>• <span className="font-bold">بائع حر (Seller):</span> <span className="font-mono text-orange-600 dark:text-orange-400 font-bold">ali@souq.com</span> (أو <span className="font-mono text-orange-600 dark:text-orange-400 font-bold">07801234567</span>) - كلمة السر <span className="font-mono">password</span></p>
                  </div>
                </form>
              ) : (
                /* Registration Form - Step by step wizard */
                <div className="space-y-5">
                  {/* Modern REDESIGNED 4-Step Stepper Header */}
                  <div className="grid grid-cols-4 gap-2 mb-6 select-none bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                    {/* Step 1 Indicator */}
                    <div className="flex flex-col items-center text-center relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${regStep >= 1 ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                        {regStep > 1 ? <Check className="w-4 h-4 stroke-[3]" /> : '١'}
                      </div>
                      <span className={`text-[9px] sm:text-[10px] font-extrabold mt-1.5 transition-colors duration-300 ${regStep >= 1 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'}`}>
                        الشخصية
                      </span>
                    </div>

                    {/* Step 2 Indicator */}
                    <div className="flex flex-col items-center text-center relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${regStep >= 2 ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                        {regStep > 2 ? <Check className="w-4 h-4 stroke-[3]" /> : '٢'}
                      </div>
                      <span className={`text-[9px] sm:text-[10px] font-extrabold mt-1.5 transition-colors duration-300 ${regStep >= 2 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'}`}>
                        الاتصال
                      </span>
                    </div>

                    {/* Step 3 Indicator */}
                    <div className="flex flex-col items-center text-center relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${regStep >= 3 ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                        {regStep > 3 ? <Check className="w-4 h-4 stroke-[3]" /> : '٣'}
                      </div>
                      <span className={`text-[9px] sm:text-[10px] font-extrabold mt-1.5 transition-colors duration-300 ${regStep >= 3 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'}`}>
                        العنوان
                      </span>
                    </div>

                    {/* Step 4 Indicator */}
                    <div className="flex flex-col items-center text-center relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${regStep >= 4 ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                        ٤
                      </div>
                      <span className={`text-[9px] sm:text-[10px] font-extrabold mt-1.5 transition-colors duration-300 ${regStep >= 4 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'}`}>
                        الحساب
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-4">
                    {/* STEP 1: Personal Info */}
                    {regStep === 1 && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">الاسم الثلاثي بالكامل <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            placeholder="مثال: علي حسن عبد السادة"
                            value={regName}
                            required
                            onChange={e => setRegName(e.target.value)}
                            className="w-full h-12 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white text-xs px-4 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all duration-200"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">العمر <span className="text-red-500">*</span></label>
                          <input
                            type="number"
                            placeholder="العمر بالسنوات"
                            value={regAge}
                            required
                            onChange={e => setRegAge(e.target.value)}
                            className="w-full h-12 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white text-xs px-4 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all duration-200"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">الجنس <span className="text-red-500">*</span></label>
                          <div className="grid grid-cols-2 gap-3.5 pt-1">
                            <div 
                              onClick={() => setRegGender('ذكر')}
                              className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer flex flex-col items-center gap-2 select-none ${
                                regGender === 'ذكر'
                                  ? 'bg-orange-50/50 border-orange-600 text-orange-700 dark:bg-orange-950/20 dark:border-orange-500 dark:text-orange-300'
                                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 dark:bg-slate-950 dark:border-slate-800 dark:hover:bg-slate-900 dark:text-slate-400'
                              }`}
                            >
                              <Smile className={`w-6 h-6 ${regGender === 'ذكر' ? 'text-orange-600 dark:text-orange-400 scale-110' : 'text-slate-400'}`} />
                              <span className="font-extrabold text-xs">شاب / ذكر</span>
                            </div>
                            <div 
                              onClick={() => setRegGender('أنثى')}
                              className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer flex flex-col items-center gap-2 select-none ${
                                regGender === 'أنثى'
                                  ? 'bg-orange-50/50 border-orange-600 text-orange-700 dark:bg-orange-950/20 dark:border-orange-500 dark:text-orange-300'
                                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 dark:bg-slate-950 dark:border-slate-800 dark:hover:bg-slate-900 dark:text-slate-400'
                              }`}
                            >
                              <Smile className={`w-6 h-6 ${regGender === 'أنثى' ? 'text-orange-600 dark:text-orange-400 scale-110' : 'text-slate-400'}`} />
                              <span className="font-extrabold text-xs">شابة / أنثى</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4">
                          <button
                            type="button"
                            onClick={() => {
                              if (validateStep1()) {
                                setRegStep(2);
                              }
                            }}
                            className="w-full h-[50px] bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-orange-500/10 hover:shadow-orange-500/25 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer whitespace-nowrap"
                          >
                            متابعة بيانات الاتصال ←
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 2: Contact Details */}
                    {regStep === 2 && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">البريد الإلكتروني <span className="text-red-500">*</span></label>
                          <input
                            type="email"
                            placeholder="مثال: user@example.com"
                            value={regEmail}
                            required
                            onChange={e => setRegEmail(e.target.value)}
                            className="w-full h-12 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white text-xs px-4 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all duration-200 text-left"
                          />
                          <span className="text-[10px] text-slate-400 block mt-1">يُستخدم البريد الإلكتروني كمعرّف أساسي لحسابك عيني.</span>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">رقم الهاتف (الواتساب) <span className="text-slate-400">(اختياري / إضافي)</span></label>
                          <div className="relative">
                            <input
                              type="tel"
                              placeholder="مثال: 07701234567"
                              value={regPhone}
                              onChange={e => setRegPhone(e.target.value)}
                              className="w-full h-12 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white text-xs pl-4 pr-10 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all duration-200 text-left"
                            />
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400 pointer-events-none">
                              <span className="text-sm">🇮🇶</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-1">يمكنك إضافة رقم هاتف عراقي للتواصل المباشر مع المشترين وإتمام صفقاتك بسهولة.</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-4">
                          <button
                            type="button"
                            onClick={() => {
                              setRegStep(1);
                              setFormError('');
                            }}
                            className="h-[50px] bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 font-extrabold text-xs rounded-xl active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer"
                          >
                            → رجوع للبيانات
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (validateStep2()) {
                                setRegStep(3);
                              }
                            }}
                            className="h-[50px] bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-orange-500/10 hover:shadow-orange-500/25 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer"
                          >
                            متابعة بيانات العنوان ←
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 3: Location Details */}
                    {regStep === 3 && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-orange-500" />
                            <span>المحافظة <span className="text-red-500">*</span></span>
                          </label>
                          <select
                            value={regGov}
                            onChange={e => setRegGov(e.target.value)}
                            className="w-full h-12 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white text-xs px-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all duration-200 cursor-pointer"
                          >
                            {iraqiGovernorates.map(gov => (
                              <option key={gov} value={gov}>{gov}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">القضاء <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            placeholder="مثال: الكرادة، الزبير، أو الكاظمية"
                            value={regDistrict}
                            required
                            onChange={e => setRegDistrict(e.target.value)}
                            className="w-full h-12 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white text-xs px-4 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all duration-200"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">المنطقة / الحي <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            placeholder="مثال: الجادرية، حي الحسين، أو المنصور"
                            value={regArea}
                            required
                            onChange={e => setRegArea(e.target.value)}
                            className="w-full h-12 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white text-xs px-4 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all duration-200"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">العنوان السكني الكامل <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            placeholder="محلة، زقاق، دار، أو نقطة دالة معروفة وقريبة..."
                            value={regAddress}
                            required
                            onChange={e => setRegAddress(e.target.value)}
                            className="w-full h-12 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white text-xs px-4 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all duration-200"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-4">
                          <button
                            type="button"
                            onClick={() => {
                              setRegStep(2);
                              setFormError('');
                            }}
                            className="h-[50px] bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 font-extrabold text-xs rounded-xl active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer"
                          >
                            → رجوع للاتصال
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (validateStep3()) {
                                setRegStep(4);
                              }
                            }}
                            className="h-[50px] bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-orange-500/10 hover:shadow-orange-500/25 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer"
                          >
                            متابعة نوع الحساب والأمان ←
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 4: Account Type & Security details */}
                    {regStep === 4 && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">نوع الحساب بالمنصة <span className="text-red-500">*</span></label>
                          <div className="grid grid-cols-2 gap-3.5 pt-1">
                            <div 
                              onClick={() => setRegAccountType('بائع حر')}
                              className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer flex flex-col items-center gap-3 text-center select-none ${
                                regAccountType === 'بائع حر'
                                  ? 'bg-orange-50/50 border-orange-600 text-orange-700 dark:bg-orange-950/20 dark:border-orange-500 dark:text-orange-300'
                                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 dark:bg-slate-950 dark:border-slate-800 dark:hover:bg-slate-900 dark:text-slate-400'
                              }`}
                            >
                              <UserCheck className={`w-7 h-7 ${regAccountType === 'بائع حر' ? 'text-orange-600 dark:text-orange-400 scale-110' : 'text-slate-400'}`} />
                              <div>
                                <span className="font-extrabold text-xs block">بائع حر (أفراد)</span>
                                <span className="text-[9px] opacity-75 block mt-0.5 leading-tight">عرض مقتنياتك أو جديد ومستعمل</span>
                              </div>
                            </div>
                            <div 
                              onClick={() => setRegAccountType('صاحب متجر')}
                              className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer flex flex-col items-center gap-3 text-center select-none ${
                                regAccountType === 'صاحب متجر'
                                  ? 'bg-orange-50/50 border-orange-600 text-orange-700 dark:bg-orange-950/20 dark:border-orange-500 dark:text-orange-300'
                                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 dark:bg-slate-950 dark:border-slate-800 dark:hover:bg-slate-900 dark:text-slate-400'
                              }`}
                            >
                              <StoreIcon className={`w-7 h-7 ${regAccountType === 'صاحب متجر' ? 'text-orange-600 dark:text-orange-400 scale-110' : 'text-slate-400'}`} />
                              <div>
                                <span className="font-extrabold text-xs block">صاحب معرض</span>
                                <span className="text-[9px] opacity-75 block mt-0.5 leading-tight">ترويج لمعرضك وهويتك التجارية</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5 text-orange-500" />
                            <span>كلمة المرور للحساب <span className="text-red-500">*</span></span>
                          </label>
                          <div className="relative">
                            <input
                              type={showRegPassword ? 'text' : 'password'}
                              placeholder="اختر كلمة مرور آمنة تذكرها"
                              value={regPassword}
                              required
                              onChange={e => setRegPassword(e.target.value)}
                              className="w-full h-12 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white text-xs pl-12 pr-4 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all duration-200"
                            />
                            <button
                              type="button"
                              onClick={() => setShowRegPassword(!showRegPassword)}
                              className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none cursor-pointer transition-colors"
                            >
                              {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-400">لا تقل كلمة المرور عن 4 رموز وتأكد من حفظها جيداً.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-4">
                          <button
                            type="button"
                            onClick={() => {
                              setRegStep(3);
                              setFormError('');
                            }}
                            className="h-[50px] bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 font-extrabold text-xs rounded-xl active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer"
                          >
                            → رجوع للعنوان
                          </button>
                          <button
                            type="submit"
                            className="h-[50px] bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-orange-500/10 hover:shadow-orange-500/25 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer whitespace-nowrap"
                          >
                            تسجيل وإنشاء الحساب 🎉
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
                </div>
              )}
            </div>

            {/* Footer switcher */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50 dark:bg-slate-950/50">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {!isRegisterMode ? 'ما عندك حساب بالمنصة؟' : 'عندك حساب سابق بـ سوق الجمعة؟'}
                <button
                  onClick={() => { setIsRegisterMode(!isRegisterMode); setFormError(''); }}
                  className="text-orange-600 dark:text-orange-400 font-extrabold mr-1.5 hover:underline cursor-pointer focus:outline-none"
                >
                  {!isRegisterMode ? 'سجل حساب جديد الآن' : 'سجل دخولك مباشرة'}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
