import React, { useState, useEffect } from 'react';
import { 
  MapPin, Calendar, Eye, Heart, MessageSquare, Phone, ShieldCheck, 
  ShoppingCart, ArrowRight, Share2, Sparkles, MessageCircle, AlertCircle, 
  Send, User as UserIcon, Star, CheckCircle2, ChevronLeft, ChevronRight, RefreshCw,
  Bell, Mail
} from 'lucide-react';
import { Product, User, Store, Review } from '../types';
import MiniMap from './MiniMap';

interface ProductDetailProps {
  productId: string;
  currentUser: User | null;
  onNavigate: (view: string, targetId?: string) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onStartChat: (recipientId: string) => void;
  onTriggerLogin: () => void;
}

export default function ProductDetail({
  productId,
  currentUser,
  onNavigate,
  onAddToCart,
  onStartChat,
  onTriggerLogin
}: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<User | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Gallery
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  
  // Reviews form state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  // Cart quantity
  const [quantity, setQuantity] = useState(1);

  // Gemini loading state
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiResult, setGeminiResult] = useState('');

  const [alertLoading, setAlertLoading] = useState(false);

  const handlePriceAlertToggle = async () => {
    if (!product) return;
    if (!currentUser) {
      onTriggerLogin();
      return;
    }
    setAlertLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}/price-alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.id}`
        }
      });
      const data = await res.json();
      if (res.ok && data.product) {
        setProduct(data.product);
        alert(data.message);
      } else {
        alert(data.error || 'فشل تعديل منبه انخفاض السعر');
      }
    } catch (err) {
      console.error(err);
      alert('خطأ في الاتصال بالشبكة عيني');
    } finally {
      setAlertLoading(false);
    }
  };

  const fetchProductDetails = () => {
    setLoading(true);
    const authHeaders: Record<string, string> = {};
    if (currentUser) {
      authHeaders['Authorization'] = `Bearer ${currentUser.id}`;
    }

    fetch(`/api/products/${productId}`, { headers: authHeaders })
      .then(res => res.json())
      .then(data => {
        if (data.product) {
          setProduct(data.product);
          setSeller(data.seller);
          setStore(data.store);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

    // Fetch reviews
    fetch(`/api/reviews/product/${productId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setReviews(data);
        }
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchProductDetails();
  }, [productId, currentUser]);

  // Dynamic Meta Tags (Title, Description, OpenGraph, Twitter)
  useEffect(() => {
    if (!product) return;

    // Save original values
    const originalTitle = document.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    const originalDesc = metaDesc ? metaDesc.getAttribute('content') : '';

    // Format new Title
    const formattedPrice = product.price.toLocaleString('ar-IQ') + ' د.ع';
    const newTitle = `${product.name} - بسعر ${formattedPrice} في ${product.governorate} | سوق الجمعة`;
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

    // Clean description: remove HTML/markdown if any, limit to 150 chars
    const cleanDesc = product.description.replace(/[#*`_]/g, '').slice(0, 150) + (product.description.length > 150 ? '...' : '');
    const metaDescriptionValue = `${cleanDesc} - السعر: ${formattedPrice} في محافظة ${product.governorate} | تصفح كامل التفاصيل وصور الإعلان الآن في منصة سوق الجمعة`;

    // Update standard description
    setMetaTag('name', 'description', metaDescriptionValue, 'name');

    // Update OpenGraph (Facebook, LinkedIn, Discord, Twitter link previews)
    setMetaTag('property', 'og:title', newTitle, 'property');
    setMetaTag('property', 'og:description', metaDescriptionValue, 'property');
    setMetaTag('property', 'og:type', 'og:product', 'property');
    setMetaTag('property', 'og:url', window.location.href, 'property');
    setMetaTag('property', 'og:site_name', 'سوق الجمعة', 'property');
    if (product.images && product.images.length > 0) {
      setMetaTag('property', 'og:image', product.images[0], 'property');
    }

    // Update Twitter Card metadata
    setMetaTag('name', 'twitter:card', 'summary_large_image', 'name');
    setMetaTag('name', 'twitter:title', newTitle, 'name');
    setMetaTag('name', 'twitter:description', metaDescriptionValue, 'name');
    if (product.images && product.images.length > 0) {
      setMetaTag('name', 'twitter:image', product.images[0], 'name');
    }

    // Cleanup on unmount or product change
    return () => {
      document.title = originalTitle;
      if (metaDesc) {
        metaDesc.setAttribute('content', originalDesc || '');
      } else {
        const currentDesc = document.querySelector('meta[name="description"]');
        if (currentDesc) currentDesc.remove();
      }

      // Remove dynamically added OG and Twitter tags to prevent stale meta info on view change
      const tagsToRemove = [
        'meta[property^="og:"]',
        'meta[name^="twitter:"]'
      ];
      tagsToRemove.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => el.remove());
      });
    };
  }, [product]);

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');

    if (!currentUser) {
      onTriggerLogin();
      return;
    }

    if (!newComment.trim()) {
      setReviewError('يرجى كتابة تعليق مناسب عيني');
      return;
    }

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({
          targetType: 'product',
          targetId: productId,
          rating: newRating,
          comment: newComment
        })
      });

      const data = await res.json();
      if (res.ok) {
        setReviewSuccess('تم نشر تقييمك بنجاح! شكراً لك عيني');
        setNewComment('');
        setReviews(prev => [...prev, data]);
        // Refetch to update average rating
        fetchProductDetails();
      } else {
        setReviewError(data.error || 'فشل إضافة التقييم');
      }
    } catch (err) {
      setReviewError('خطأ في الاتصال بالشبكة');
    }
  };

  // Gemini API to auto-suggest description for owner
  const handleGeminiSuggestDescription = async () => {
    if (!product) return;
    setGeminiLoading(true);
    setGeminiResult('');
    try {
      const res = await fetch('/api/gemini/suggest-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: product.name,
          section: product.section,
          condition: product.condition
        })
      });
      const data = await res.json();
      if (res.ok && data.description) {
        setGeminiResult(data.description);
      } else {
        alert('فشل الذكاء الاصطناعي في الاتصال، يرجى المحاولة لاحقاً');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeminiLoading(false);
    }
  };

  const handleApplyDescription = async () => {
    if (!product || !geminiResult || !currentUser) return;
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({
          description: geminiResult
        })
      });
      if (res.ok) {
        setProduct(prev => prev ? { ...prev, description: geminiResult } : null);
        setGeminiResult('');
        alert('تم تطبيق الوصف الاحترافي الجديد بنجاح!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <RefreshCw className="w-10 h-10 animate-spin text-orange-600 mx-auto" />
        <p className="text-slate-500 font-bold text-sm">جاري تحميل تفاصيل المنتج عيني، ثواني وتدلل...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="font-extrabold text-slate-800 dark:text-white text-lg">المنتج غير موجود</h3>
        <p className="text-slate-500 text-xs">تأكد من رابط المنتج أو عد للرئيسية للتصفح.</p>
        <button 
          onClick={() => onNavigate('home')}
          className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString('ar-IQ') + ' د.ع';
  };

  const isOwner = currentUser?.id === product.userId;
  const hasPriceAlert = !!(currentUser && product.priceAlertUsers?.includes(currentUser.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      
      {/* Back button */}
      <button 
        onClick={() => onNavigate('home')}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-[#F97316] dark:hover:text-orange-400 mb-6 cursor-pointer"
      >
        <ArrowRight className="w-4 h-4" />
        <span>العودة للتصفح</span>
      </button>

      {/* Main product presentation grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* RIGHT PANEL: Image Gallery */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-square w-full rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 overflow-hidden shadow-sm">
            <img 
              src={product.images?.[activeImgIdx] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600'} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
            
            {/* Status Condition floating badge */}
            <span className="absolute top-4 right-4 bg-[#F97316] text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl shadow-md">
              {product.condition}
            </span>

            {/* Carousel controller */}
            {product.images && product.images.length > 1 && (
              <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between z-10 pointer-events-none">
                <button 
                  onClick={() => setActiveImgIdx(prev => prev === 0 ? product.images.length - 1 : prev - 1)}
                  className="p-1.5 rounded-full bg-white/90 text-slate-800 shadow-md hover:bg-white transition-all cursor-pointer pointer-events-auto"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setActiveImgIdx(prev => prev === product.images.length - 1 ? 0 : prev + 1)}
                  className="p-1.5 rounded-full bg-white/90 text-slate-800 shadow-md hover:bg-white transition-all cursor-pointer pointer-events-auto"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Thumbnails list */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImgIdx(idx)}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden bg-white dark:bg-slate-950 border-2 transition-all shrink-0 ${activeImgIdx === idx ? 'border-[#F97316] shadow-sm' : 'border-slate-100 dark:border-slate-900 hover:border-slate-300'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Optional Video Indicator */}
          {product.video && (
            <div className="p-3 bg-slate-100 dark:bg-slate-800/50 rounded-xl flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <span className="animate-ping w-2 h-2 rounded-full bg-red-500" />
              <span>يتوفر فيديو توضيحي للمنتج (تواصل مع البائع لرؤيته)</span>
            </div>
          )}

          {/* Views count */}
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-900/30">
            <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> عدد المشاهدات: {product.views || 0}</span>
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(product.createdAt).toLocaleDateString('ar-IQ')}</span>
          </div>
        </div>

        {/* LEFT PANEL: Meta, specs & checkout */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            
            {/* Category / Area */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500">
              <span className="hover:text-[#F97316] transition-colors cursor-pointer">{product.section}</span>
              <span>•</span>
              <span className="hover:text-[#F97316] transition-colors cursor-pointer">{product.category}</span>
              <span>•</span>
              <span className="flex items-center gap-0.5 text-[#F97316] dark:text-orange-400">
                <MapPin className="w-3.5 h-3.5" />
                {product.governorate}
              </span>
            </div>

            {/* Product Name */}
            <h2 className="font-extrabold text-lg sm:text-2xl text-slate-900 dark:text-white leading-tight">
              {product.name}
            </h2>

            {/* Dynamic review badge */}
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                {product.rating > 0 ? product.rating : 'لا تقييمات بعد'}
              </span>
              {reviews.length > 0 && (
                <span className="text-[10px] text-slate-400">({reviews.length} مراجعات من المشترين)</span>
              )}
            </div>
          </div>

          {/* Pricing Card */}
          <div className="p-5 bg-gradient-to-r from-orange-500/10 to-orange-500/5 dark:from-orange-950/20 dark:to-orange-950/5 rounded-2xl border border-orange-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-bold">السعر النهائي المعروض</span>
              <span className="text-xl sm:text-3xl font-extrabold text-[#F97316] dark:text-[#FB923C] tracking-tight">
                {formatPrice(product.price)}
              </span>
              {product.negotiable && (
                <span className="text-[10px] font-bold block text-blue-600 dark:text-blue-400 mt-1">
                  💡 السعر بيه مجال (قابل للتفاوض البسيط)
                </span>
              )}
            </div>

            {/* Actions & Quantities Section */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto shrink-0">
              {/* Stock Quantities */}
              <div className="text-right sm:text-left">
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-bold">الكمية المتوفرة</span>
                <span className={`text-sm font-extrabold px-3 py-1 rounded-xl block text-center mt-1 ${product.quantity > 0 ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' : 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'}`}>
                  {product.quantity > 0 ? `${product.quantity} قطع` : 'مباع بالكامل'}
                </span>
              </div>

              {/* Price Alert Button */}
              {!isOwner && (
                <button
                  type="button"
                  disabled={alertLoading}
                  onClick={handlePriceAlertToggle}
                  className={`flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl text-xs font-black transition-all duration-250 cursor-pointer shadow-sm select-none border ${
                    hasPriceAlert
                      ? 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600 active:scale-[0.97]'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.97]'
                  }`}
                >
                  <Bell className={`w-4 h-4 ${hasPriceAlert ? 'fill-white text-white animate-bounce' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{hasPriceAlert ? 'تم تفعيل منبه السعر' : 'تنبيهي عند انخفاض السعر'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Product Specifications & Badges Check */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-xs space-y-3">
              <h4 className="font-extrabold text-xs text-slate-800 dark:text-white border-b border-slate-50 dark:border-slate-900/50 pb-2">تفاصيل الفحص</h4>
              <div className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                <div className="flex justify-between"><span>حالة المنتج:</span> <span className="font-bold">{product.condition}</span></div>
                <div className="flex justify-between"><span>قابل للكسر:</span> <span className="font-bold">{product.fragile ? 'نعم، بحاجة لعناية' : 'لا'}</span></div>
                <div className="flex justify-between"><span>يوجد هدية:</span> <span className="font-bold">{product.gift ? 'نعم متوفرة' : 'لا'}</span></div>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-xs space-y-3">
              <h4 className="font-extrabold text-xs text-slate-800 dark:text-white border-b border-slate-50 dark:border-slate-900/50 pb-2">الضمان وسياسة الإرجاع</h4>
              <div className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                <div className="flex justify-between"><span>الضمان:</span> <span className="font-bold truncate max-w-[120px]" title={product.warranty}>{product.warranty || 'لا يوجد ضمان'}</span></div>
                <div className="flex justify-between"><span>سياسة الإرجاع:</span> <span className="font-bold truncate max-w-[120px]" title={product.returnPolicy}>{product.returnPolicy || 'لا يوجد إرجاع'}</span></div>
                <div className="flex justify-between"><span>خدمة التوصيل:</span> <span className="font-bold text-[#F97316]">متوفرة لكافة المحافظات</span></div>
              </div>
            </div>
          </div>

          {/* Description Paragraph */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">تفاصيل الإعلان ووصف المنتج</h3>
            <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-xs text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {product.description}
            </div>
          </div>

          {/* Gemini Content Generator Tool for product owner */}
          {isOwner && (
            <div className="p-4 bg-gradient-to-tr from-indigo-500/10 to-purple-500/5 border border-indigo-500/20 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                <h4 className="font-bold text-xs text-indigo-900 dark:text-indigo-400">توليد وتحسين الوصف الإعلاني بالذكاء الاصطناعي (Gemini)</h4>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                هل ترغب بتحسين هذا الإعلان؟ سيقوم الذكاء الاصطناعي من جوجل بكتابة وصف إعلاني جذاب باللهجة العراقية المفهومة لزيادة نسبة المبيعات والمشاهدات فوراً!
              </p>
              
              {geminiResult && (
                <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl text-xs text-slate-700 dark:text-slate-300 border border-indigo-100 leading-relaxed max-h-48 overflow-y-auto">
                  <p className="font-bold text-[10px] text-indigo-600 mb-1">النتيجة المقترحة:</p>
                  <p className="whitespace-pre-wrap">{geminiResult}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleGeminiSuggestDescription}
                  disabled={geminiLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-[10px] px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {geminiLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>{geminiResult ? 'إعادة التوليد' : 'توليد الوصف بالذكاء الاصطناعي'}</span>
                </button>
                
                {geminiResult && (
                  <button
                    type="button"
                    onClick={handleApplyDescription}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-[10px] px-4 py-2 rounded-xl transition-colors flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>تطبيق الوصف على المنتج</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Seller / Merchant Information Card */}
          <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-right">
              <img 
                src={seller?.profileImage || 'https://api.dicebear.com/7.x/initials/svg?seed=Seller'} 
                alt={seller?.name} 
                className="w-12 h-12 rounded-xl object-cover border border-slate-100 dark:border-slate-800"
              />
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                  <span>{seller?.name}</span>
                  <span className="bg-orange-50 text-[#F97316] text-[9px] font-bold px-2 py-0.5 rounded-lg dark:bg-orange-950/40 dark:text-orange-400">
                    {seller?.accountType}
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400">سجل في {seller ? new Date(seller.createdAt).toLocaleDateString('ar-IQ') : 'سوق الجمعة'}</p>
                {store && (
                  <button 
                    onClick={() => onNavigate('store', store.id)}
                    className="text-[11px] text-[#F97316] hover:underline font-extrabold block"
                  >
                    تصفح متجر البائع: {store.name} ⬅️
                  </button>
                )}
              </div>
            </div>

            {/* Communication Controls - Active only for logged-in. Clicking triggers login popup for guest */}
            <div className="flex flex-wrap justify-center sm:justify-end gap-2 w-full sm:w-auto">
              {!currentUser ? (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/10 text-amber-800 dark:text-amber-400 rounded-xl text-[11px] leading-relaxed border border-amber-100 text-center w-full">
                  ⚠️ <button onClick={onTriggerLogin} className="font-extrabold underline hover:text-[#F97316]">سجل دخولك</button> لمشاهدة معلومات الاتصال والمراسلة مع البائع.
                </div>
              ) : (
                <>
                  {/* Internal live chat */}
                  {!isOwner && (
                    <button
                      onClick={() => onStartChat(product.userId)}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-orange-500/10 flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <MessageCircle className="w-4.5 h-4.5" />
                      <span>دردشة داخل المنصة</span>
                    </button>
                  )}

                  {/* Phone Call / Email fallback */}
                  {seller?.phone ? (
                    <>
                      <a
                        href={`tel:${seller?.phone}`}
                        className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Phone className="w-4.5 h-4.5 text-[#F97316]" />
                        <span>اتصال: {seller?.phone}</span>
                      </a>

                      {/* WhatsApp Message */}
                      <a
                        href={`https://wa.me/${seller?.phone.replace(/^0/, '+964')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-950/40 text-orange-700 dark:text-orange-400 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Send className="w-4.5 h-4.5 rotate-180 text-orange-500" />
                        <span>واتساب</span>
                      </a>
                    </>
                  ) : (
                    <a
                      href={`mailto:${seller?.email}`}
                      className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Mail className="w-4.5 h-4.5 text-[#F97316]" />
                      <span>مراسلة البريد: {seller?.email}</span>
                    </a>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Mini Map showing the Governorate / Store / suggested meeting point */}
          <MiniMap 
            governorate={product.governorate}
            location={store?.location}
            storeName={store?.name}
            onStartChat={!isOwner ? () => onStartChat(product.userId) : undefined}
          />

          {/* Add to Cart and Purchase Section */}
          {product.quantity > 0 && !isOwner && (
            <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">الكمية المطلوبة:</span>
                <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800">
                  <button 
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="px-3.5 py-1.5 text-slate-600 dark:text-slate-200 hover:bg-slate-100 font-extrabold text-sm"
                  >
                    -
                  </button>
                  <span className="px-4 font-extrabold text-xs text-slate-800 dark:text-white">
                    {quantity}
                  </span>
                  <button 
                    onClick={() => setQuantity(prev => Math.min(product.quantity, prev + 1))}
                    className="px-3.5 py-1.5 text-slate-600 dark:text-slate-200 hover:bg-slate-100 font-extrabold text-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    if (!currentUser) {
                      onTriggerLogin();
                    } else {
                      onAddToCart(product, quantity);
                      alert('تمت إضافة المنتج إلى السلة بنجاح!');
                    }
                  }}
                  className="flex-1 sm:flex-initial bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <ShoppingCart className="w-4.5 h-4.5" />
                  <span>إضافة إلى السلة</span>
                </button>
              </div>
            </div>
          )}

          {/* Reviews List & Commenting Form */}
          <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-900">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">تقييمات المشترين ومراجعات المنتج</h3>

            {/* List Reviews */}
            {reviews.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">لا توجد تقييمات لهذا المنتج بعد، كن أول من يقيمه!</p>
            ) : (
              <div className="space-y-3">
                {reviews.map(r => (
                  <div key={r.id} className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-900/30 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-white">
                        <img 
                          src={r.userImage || 'https://api.dicebear.com/7.x/initials/svg?seed=Reviewer'} 
                          alt={r.userName} 
                          className="w-5 h-5 rounded-md object-cover"
                        />
                        <span>{r.userName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleDateString('ar-IQ')}</span>
                    </div>

                    <div className="flex items-center gap-0.5 mt-1 text-yellow-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-yellow-400' : 'text-slate-200 dark:text-slate-800'}`} />
                      ))}
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Write Review Form */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/20 rounded-2xl border border-slate-100 dark:border-slate-900/50 space-y-3">
              <h4 className="font-bold text-xs text-slate-800 dark:text-white">أضف تقييمك للمنتج</h4>
              
              {reviewError && <p className="text-[10px] text-red-500">⚠️ {reviewError}</p>}
              {reviewSuccess && <p className="text-[10px] text-orange-600">🎉 {reviewSuccess}</p>}

              {!currentUser ? (
                <p className="text-[10px] text-slate-500">
                  يرجى <button onClick={onTriggerLogin} className="text-[#F97316] underline font-bold">تسجيل الدخول</button> أولاً لتتمكن من كتابة تقييم وإضافة تعليق.
                </p>
              ) : (
                <form onSubmit={handleAddReview} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">عدد النجوم:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setNewRating(num)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star className={`w-5 h-5 ${num <= newRating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300 dark:text-slate-700'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <textarea
                      placeholder="اكتب مراجعتك وتقييمك للأمانة في الوصف والتوصيل..."
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      rows={3}
                      className="w-full bg-white dark:bg-slate-900 text-xs px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-[#F97316] focus:outline-none text-slate-800 dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-[11px] px-5 py-2 rounded-xl transition-all shadow-sm"
                  >
                    نشر التقييم والتعليق
                  </button>
                </form>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
