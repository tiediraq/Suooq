import React, { useState } from 'react';
import { Eye, Heart, MapPin, Sparkles, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  key?: any;
  product: Product;
  onViewDetails: (id: string) => void;
  onToggleFavorite?: (id: string, e: React.MouseEvent) => void;
  isFavorited?: boolean;
}

export default function ProductCard({
  product,
  onViewDetails,
  onToggleFavorite,
  isFavorited = false
}: ProductCardProps) {
  const [imgError, setImgError] = useState(false);

  const fallbackImage = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300';

  const formatPrice = (price: number) => {
    return price.toLocaleString('ar-IQ') + ' د.ع';
  };

  const getRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      
      if (diffHours < 1) {
        return 'منذ دقائق';
      } else if (diffHours < 24) {
        if (diffHours === 1) return 'منذ ساعة';
        if (diffHours === 2) return 'منذ ساعتين';
        if (diffHours >= 3 && diffHours <= 10) return `منذ ${diffHours} ساعات`;
        return `منذ ${diffHours} ساعة`;
      } else {
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return 'منذ يوم';
        if (diffDays === 2) return 'منذ يومين';
        if (diffDays >= 3 && diffDays <= 10) return `منذ ${diffDays} أيام`;
        return `منذ ${diffDays} يوم`;
      }
    } catch (e) {
      return 'منذ فترة';
    }
  };

  return (
    <div 
      onClick={() => onViewDetails(product.id)}
      className="group relative bg-white dark:bg-slate-950 rounded-[22px] border border-slate-200/60 dark:border-slate-800/80 overflow-hidden shadow-xs hover:shadow-[0_24px_48px_-12px_rgba(249,115,22,0.18),0_8px_20px_-10px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_24px_48px_-12px_rgba(249,115,22,0.12),0_8px_20px_-10px_rgba(0,0,0,0.7)] hover:border-orange-500/60 hover:-translate-y-2 hover:scale-[1.035] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer flex flex-col h-full min-h-[385px] sm:min-h-[400px] select-none"
    >
      {/* Product Image Panel */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
        <img
          src={imgError ? fallbackImage : (product.images?.[0] || fallbackImage)}
          alt={product.name}
          onError={() => setImgError(true)}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
        />

        {/* Favorite Icon Toggle */}
        {onToggleFavorite && (
          <button
            onClick={(e) => onToggleFavorite(product.id, e)}
            className="absolute top-3 left-3 p-2 rounded-full bg-white/90 dark:bg-slate-900/95 backdrop-blur-md text-slate-600 dark:text-slate-300 hover:text-red-500 shadow-sm border border-slate-100 dark:border-slate-800/50 hover:scale-110 active:scale-95 transition-all z-10"
          >
            <Heart 
              className={`w-4 h-4 transition-colors ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} 
            />
          </button>
        )}

        {/* Condition / Verified Badges on Top Right */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          {product.storeId && (
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 border border-slate-100 dark:border-slate-800 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10" />
              <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300">موثق</span>
            </div>
          )}
          <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full shadow-md backdrop-blur-md border flex items-center gap-1.5 transition-all duration-300 ${
            product.condition === 'جديد' 
              ? 'bg-emerald-500/95 text-white border-emerald-400/30' 
              : 'bg-white/95 text-slate-800 border-slate-200/50 dark:bg-slate-900/95 dark:text-slate-200 dark:border-slate-800/60'
          }`}>
            {product.condition === 'جديد' ? (
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
              </span>
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
            )}
            <span>{product.condition}</span>
          </span>
        </div>

        {/* Dynamic Badges Area */}
        <div className="absolute bottom-2 right-2 left-2 flex flex-wrap gap-1">
          {product.negotiable && (
            <span className="text-[9px] font-extrabold px-2 py-0.5 bg-blue-600/90 backdrop-blur-xs text-white rounded-md shadow-sm border border-blue-400/25">
              قابل للتفاوض
            </span>
          )}
          {product.fragile && (
            <span className="text-[9px] font-extrabold px-2 py-0.5 bg-rose-600/90 backdrop-blur-xs text-white rounded-md shadow-sm flex items-center gap-1 border border-rose-400/25">
              <AlertTriangle className="w-2.5 h-2.5" /> قابل للكسر
            </span>
          )}
          {product.gift && (
            <span className="text-[9px] font-extrabold px-2 py-0.5 bg-pink-600/90 backdrop-blur-xs text-white rounded-md shadow-sm flex items-center gap-1 border border-pink-400/25">
              <Sparkles className="w-2.5 h-2.5" /> مع هدية
            </span>
          )}
        </div>
      </div>

      {/* Information Panel - flex-1 with flex-col justify-between to force identical card heights */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3 bg-white dark:bg-slate-950">
        <div className="space-y-2">
          {/* Subcategory, Location & Availability Indicator */}
          <div className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 flex items-center justify-between gap-2 min-h-[16px]">
            <span className="truncate max-w-[130px]">{product.section} • {product.category}</span>
            {product.quantity > 0 ? (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 dark:border-emerald-500/25 shrink-0 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-[9px] font-black leading-none">متوفر</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-500 dark:text-rose-400 border border-rose-500/15 dark:border-rose-500/25 shrink-0 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                <span className="text-[9px] font-black leading-none">مباع</span>
              </div>
            )}
          </div>

          {/* Product Title - Uniform fixed min/max height with line clamp prevents uneven grid alignment */}
          <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-100 line-clamp-2 leading-relaxed group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors h-10 min-h-[40px] flex items-start">
            {product.name}
          </h3>

          {/* Pricing - Consistent bold style at fixed placement */}
          <div className="text-orange-600 dark:text-orange-400 font-black text-[15px] sm:text-[17px] tracking-tight pt-0.5">
            {formatPrice(product.price)}
          </div>
        </div>

        {/* Footer info: Location & Time Posted */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-900/80 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="truncate max-w-[85px] sm:max-w-[100px]">{product.governorate}</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="whitespace-nowrap">{getRelativeTime(product.createdAt)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
