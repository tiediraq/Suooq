import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Trash2, MapPin, Phone, Truck, AlertCircle, 
  CreditCard, CheckCircle2, ShoppingCart, RefreshCw 
} from 'lucide-react';
import { CartItem, User, SystemSettings, Order } from '../types';

interface CartPageProps {
  currentUser: User | null;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, qty: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onNavigate: (view: string, targetId?: string) => void;
}

export default function CartPage({
  currentUser,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onNavigate
}: CartPageProps) {
  const [gov, setGov] = useState('بغداد');
  const [district, setDistrict] = useState('');
  const [area, setArea] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(err => console.error(err));

    if (currentUser) {
      setGov(currentUser.governorate || 'بغداد');
      setDistrict(currentUser.district || '');
      setArea(currentUser.area || '');
      setAddress(currentUser.address || '');
      setPhone(currentUser.phone || '');
    }
  }, [currentUser]);

  const iraqiGovernorates = [
    'بغداد', 'البصرة', 'نينوى', 'أربيل', 'بابل', 'النجف', 'كربلاء', 
    'ذي قار', 'ميسان', 'الأنبار', 'ديالى', 'واسط', 'كركوك', 
    'صلاح الدين', 'السليمانية', 'دهوك', 'القادسية', 'المثنى'
  ];

  // Calculate Subtotal
  const subtotal = cartItems.reduce((sum, item) => {
    return sum + (item.product?.price || 0) * item.quantity;
  }, 0);

  // Delivery rate based on governorate
  const shippingFee = settings 
    ? (gov === 'بغداد' ? settings.shippingFeeBaghdad : settings.shippingFeeGovs) 
    : 5000;

  const total = subtotal + shippingFee;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!currentUser) return;

    if (!district || !area || !address || !phone) {
      setErrorMsg('يرجى تعبئة كافة تفاصيل العنوان ورقم الهاتف للتوصيل عيني');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity
          })),
          governorate: gov,
          address: `${district} - ${area} - ${address}`,
          phone: phone
        })
      });

      const data = await res.json();
      if (res.ok) {
        setOrderSuccess(data);
        onClearCart();
      } else {
        setErrorMsg(data.error || 'فشل إتمام الطلب');
      }
    } catch (err) {
      setErrorMsg('حدث خطأ بالاتصال بالسيرفر، يرجى المحاولة مجدداً');
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 bg-orange-100 dark:bg-orange-950/40 text-orange-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="font-extrabold text-xl sm:text-2xl text-slate-800 dark:text-white">تم استلام طلبك بنجاح! 🎉</h2>
          <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
            عاش من سمع صوتك عيني، تم تسجيل الطلب برقم <span className="font-mono font-bold text-orange-600 dark:text-orange-400">{orderSuccess.id}</span> وقيمة <span className="font-bold">{orderSuccess.total.toLocaleString()} د.ع</span>. سيتم الاتصال بك لتجهيز شحن الطلب فوراً.
          </p>
        </div>
        <div className="flex gap-2 justify-center pt-4">
          <button
            onClick={() => onNavigate('profile')}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            تتبع حالة الطلب
          </button>
          <button
            onClick={() => onNavigate('home')}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            متابعة التسوق
          </button>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto text-slate-400">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-slate-800 dark:text-white text-base">سلة التسوق فارغة حالياً</h3>
        <p className="text-slate-400 text-xs">تصفح سوق الجمعة وأضف المنتجات التي ترغب بشرائها إلى السلة.</p>
        <button
          onClick={() => onNavigate('home')}
          className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md cursor-pointer"
        >
          اذهب للتصفح والبحث
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <h2 className="font-extrabold text-lg sm:text-2xl text-slate-900 dark:text-white mb-6 sm:mb-8 flex items-center gap-2">
        <ShoppingBag className="w-6 h-6 text-orange-600" />
        <span>سلة المشتريات والطلب ({cartItems.length} منتجات)</span>
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* RIGHT PANEL: Cart Products List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-900">
            {cartItems.map(item => (
              <div key={item.productId} className="p-4 flex gap-4 items-center">
                <img
                  src={item.product?.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=150'}
                  alt={item.product?.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-50 dark:border-slate-900"
                />

                <div className="flex-1 space-y-1">
                  <h4 
                    onClick={() => onNavigate('product', item.productId)}
                    className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white cursor-pointer hover:text-orange-600 truncate max-w-[250px]"
                  >
                    {item.product?.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold">{item.product?.governorate} • {item.product?.condition}</p>
                  
                  <span className="font-extrabold text-xs sm:text-sm text-orange-600 dark:text-orange-400 block">
                    {item.product ? (item.product.price * item.quantity).toLocaleString('ar-IQ') : '0'} د.ع
                  </span>
                </div>

                {/* Quantity Control & Remove */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900">
                    <button
                      onClick={() => onUpdateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                      className="px-2.5 py-1 text-slate-500 font-extrabold"
                    >
                      -
                    </button>
                    <span className="px-2.5 text-xs font-extrabold text-slate-800 dark:text-white">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.productId, Math.min(item.product?.quantity || 10, item.quantity + 1))}
                      className="px-2.5 py-1 text-slate-500 font-extrabold"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => onRemoveItem(item.productId)}
                    className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onClearCart}
            className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1 cursor-pointer mr-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>إفراغ سلة المشتريات بالكامل</span>
          </button>
        </div>

        {/* LEFT PANEL: Shipping Details & Order Totals */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Checkout delivery info form */}
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-sm p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-900 pb-3">
              <MapPin className="w-4.5 h-4.5 text-orange-600" />
              <span>عنوان التوصيل في العراق الحبيب</span>
            </h3>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-200">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleCheckout} className="space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-400 block">المحافظة <span className="text-red-500">*</span></label>
                <select
                  value={gov}
                  onChange={e => setGov(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-orange-600 focus:outline-none"
                >
                  {iraqiGovernorates.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400 block">القضاء <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    placeholder="مثال: المنصور"
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-orange-600 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400 block">المنطقة <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    placeholder="مثال: الإسكان"
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-orange-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-400 block">العنوان السكني بالكامل <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="محلة، زقاق، رقم الدار، نقطة دالة معروفة..."
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-orange-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-400 block">رقم الهاتف النشط (الواتساب) <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="مثال: 07701234567"
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-orange-600 focus:outline-none font-mono"
                />
              </div>

              {/* Order total calculation card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-900/30">
                <div className="flex justify-between text-slate-500">
                  <span>سعر المنتجات:</span>
                  <span className="font-bold">{subtotal.toLocaleString('ar-IQ')} د.ع</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span className="flex items-center gap-1">
                    <Truck className="w-4 h-4 text-orange-600" />
                    <span>أجور التوصيل المعتمدة:</span>
                  </span>
                  <span className="font-bold">{shippingFee.toLocaleString('ar-IQ')} د.ع</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 pb-2 border-b border-dashed border-slate-200 dark:border-slate-800">
                  <span>محافظة التوصيل الحالية:</span>
                  <span className="font-bold text-orange-600 dark:text-orange-400">{gov}</span>
                </div>

                <div className="flex justify-between text-slate-800 dark:text-white font-extrabold text-sm pt-2">
                  <span>المجموع الإجمالي الكلي:</span>
                  <span className="text-orange-600 dark:text-orange-400">{total.toLocaleString('ar-IQ')} د.ع</span>
                </div>
              </div>

              {/* Payment methods */}
              <div className="p-3.5 bg-orange-50/55 dark:bg-slate-900 rounded-xl text-[10px] text-slate-500 leading-normal border border-orange-500/10 flex items-start gap-2">
                <CreditCard className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-xs block">الدفع عند الاستلام (COD)</span>
                  طريقة الدفع المتوفرة حالياً هي نقداً عند استلام طلبك من مندوب الشحن لضمان فحص وسلامة المشتريات عيني.
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4.5 h-4.5" />
                )}
                <span>تأكيد طلب الشراء والدفع عند الاستلام</span>
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
