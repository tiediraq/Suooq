import React, { useState, useEffect } from 'react';
import { 
  MapPin, Clock, Star, Users, CheckCircle, ChevronLeft, ArrowRight,
  ShoppingBag, HelpCircle, Phone, MessageCircle, Heart, RefreshCw
} from 'lucide-react';
import { Store, Product, User } from '../types';
import ProductCard from './ProductCard';
import MiniMap from './MiniMap';

interface StorePageProps {
  storeId: string;
  currentUser: User | null;
  onNavigate: (view: string, targetId?: string) => void;
  onToggleFavoriteProduct: (id: string, e: React.MouseEvent) => void;
  favorites: string[];
}

export default function StorePage({
  storeId,
  currentUser,
  onNavigate,
  onToggleFavoriteProduct,
  favorites
}: StorePageProps) {
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [storeOwner, setStoreOwner] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stores/${storeId}`)
      .then(res => res.json())
      .then(data => {
        if (data.store) {
          setStore(data.store);
          setProducts(data.products || []);
          if (currentUser && data.store.followedBy) {
            setIsFollowing(data.store.followedBy.includes(currentUser.id));
          }

          // Fetch owner details
          fetch(`/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${data.store.userId}` }
          })
            .then(res => res.json())
            .then(owner => setStoreOwner(owner))
            .catch(() => {});
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [storeId, currentUser]);

  // Dynamic Meta Tags (Title, Description, OpenGraph, Twitter) for the Store
  useEffect(() => {
    if (!store) return;

    // Save original values
    const originalTitle = document.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    const originalDesc = metaDesc ? metaDesc.getAttribute('content') : '';

    // Format new Title
    const newTitle = `معرض ${store.name} - سوق الجمعة العراق`;
    document.title = newTitle;

    // Helper to set or create meta tags
    const setMetaTag = (attrName: string, attrVal: string, content: string, type: 'name' | 'property' = 'name') => {
      let element = document.querySelector(`meta[${type}="${attrVal}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(type, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Clean description: limit to 150 chars
    const cleanDesc = store.description.replace(/[#*`_]/g, '').slice(0, 150) + (store.description.length > 150 ? '...' : '');
    const metaDescriptionValue = `تصفح معرض ${store.name} في ${store.location}. ${cleanDesc} | استكشف المنتجات والعروض النشطة في سوق الجمعة`;

    // Update standard description
    setMetaTag('name', 'description', metaDescriptionValue, 'name');

    // Update OpenGraph
    setMetaTag('property', 'og:title', newTitle, 'property');
    setMetaTag('property', 'og:description', metaDescriptionValue, 'property');
    setMetaTag('property', 'og:type', 'website', 'property');
    setMetaTag('property', 'og:url', window.location.href, 'property');
    setMetaTag('property', 'og:site_name', 'سوق الجمعة', 'property');
    if (store.logo) {
      setMetaTag('property', 'og:image', store.logo, 'property');
    }

    // Update Twitter Card metadata
    setMetaTag('name', 'twitter:card', 'summary', 'name');
    setMetaTag('name', 'twitter:title', newTitle, 'name');
    setMetaTag('name', 'twitter:description', metaDescriptionValue, 'name');
    if (store.logo) {
      setMetaTag('name', 'twitter:image', store.logo, 'name');
    }

    // Cleanup on unmount or store change
    return () => {
      document.title = originalTitle;
      if (metaDesc) {
        metaDesc.setAttribute('content', originalDesc || '');
      } else {
        const currentDesc = document.querySelector('meta[name="description"]');
        if (currentDesc) currentDesc.remove();
      }

      // Remove dynamically added OG and Twitter tags to prevent stale meta info
      const tagsToRemove = [
        'meta[property^="og:"]',
        'meta[name^="twitter:"]'
      ];
      tagsToRemove.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => el.remove());
      });
    };
  }, [store]);

  const handleFollowStore = async () => {
    if (!currentUser) {
      alert('يرجى تسجيل الدخول أولاً لمتابعة المتاجر');
      return;
    }

    try {
      const res = await fetch(`/api/stores/${storeId}/follow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${currentUser.id}` }
      });
      const data = await res.json();
      if (res.ok) {
        setIsFollowing(data.followed);
        setStore(prev => prev ? { ...prev, followersCount: data.followersCount } : null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <RefreshCw className="w-10 h-10 animate-spin text-orange-600 mx-auto" />
        <p className="text-slate-500 font-bold text-sm">جاري تحميل المعرض والمنتجات عيني، ثواني...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="font-bold text-slate-800 dark:text-white text-lg">المتجر غير موجود</h3>
        <button 
          onClick={() => onNavigate('home')}
          className="mt-4 bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-900/40 min-h-screen">
      
      {/* Store Header Cover */}
      <div className="relative h-48 sm:h-72 w-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <img 
          src={store.cover || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200'} 
          alt={store.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />

        <button 
          onClick={() => onNavigate('home')}
          className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-white p-2 rounded-xl flex items-center gap-1.5 text-xs font-bold shadow-md cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>تصفح كل المتاجر</span>
        </button>
      </div>

      {/* Store Profile Floating Panel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-24 relative z-10 pb-16">
        <div className="bg-white dark:bg-slate-950 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-900 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-900/50">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-right">
              <img 
                src={store.logo || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200'} 
                alt={store.name} 
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover bg-white p-1 border-4 border-white dark:border-slate-950 shadow-md -mt-12 sm:-mt-16 shrink-0"
              />
              <div className="space-y-1">
                <h2 className="font-extrabold text-lg sm:text-2xl text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-1.5">
                  <span>{store.name}</span>
                  <CheckCircle className="w-5 h-5 text-orange-500 fill-orange-500 shrink-0" title="معرض معتمد" />
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                  {store.description}
                </p>
                
                {/* Statistics badges */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 pt-3 text-xs text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    <span>الموقع: {store.location}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span>الدوام: {store.workingHours}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Follower action & rating */}
            <div className="flex flex-col items-center sm:items-end gap-3 w-full sm:w-auto shrink-0">
              <div className="flex items-center gap-4 text-center">
                <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-900">
                  <span className="text-[10px] block text-slate-400 font-bold">التقييم</span>
                  <span className="font-extrabold text-sm text-yellow-500 flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-500" /> {store.rating || '5.0'}
                  </span>
                </div>
                <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-900">
                  <span className="text-[10px] block text-slate-400 font-bold">المتابعين</span>
                  <span className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-1">
                    <Users className="w-4 h-4 text-orange-600" /> {store.followersCount || 0}
                  </span>
                </div>
              </div>

              {/* Follow action button */}
              <button
                onClick={handleFollowStore}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer ${
                  isFollowing 
                    ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white' 
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                }`}
              >
                {isFollowing ? 'متابع ✓' : 'متابعة المعرض'}
              </button>
            </div>
          </div>

          {/* Store Catalog & Location Info Map Layout */}
          <div id="store-content-layout" className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 border-t border-slate-100 dark:border-slate-900/50">
            {/* Right/Main Column: Products Listing (8 cols on lg) */}
            <div id="store-products-list" className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-base text-slate-800 dark:text-white flex items-center gap-1.5">
                  <ShoppingBag className="w-5 h-5 text-orange-600" />
                  <span>إعلانات ومنتجات المعرض ({products.length})</span>
                </h3>
              </div>

              {products.length === 0 ? (
                <div id="no-products-alert" className="text-center py-16 text-slate-400 bg-slate-50 dark:bg-slate-900/10 rounded-2xl border border-slate-100 dark:border-slate-900">
                  <p className="text-xs">لا تتوفر منتجات نشطة حالياً في هذا المعرض.</p>
                </div>
              ) : (
                <div id="store-products-grid" className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 items-stretch">
                  {products.map(p => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onViewDetails={id => onNavigate('product', id)}
                      onToggleFavorite={onToggleFavoriteProduct}
                      isFavorited={favorites.includes(p.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Left/Sidebar Column: Store Map (4 cols on lg) */}
            <div id="store-sidebar-map" className="lg:col-span-4 space-y-4">
              <MiniMap 
                governorate={store.location ? store.location.split(' - ')[0].trim() : 'بغداد'}
                location={store.location}
                storeName={store.name}
              />
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
