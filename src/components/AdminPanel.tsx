import React, { useState, useEffect } from 'react';
import { 
  Shield, CheckCircle, XCircle, Edit, Trash2, Settings, 
  ShoppingBag, ClipboardList, AlertTriangle, Play, RefreshCw, 
  MapPin, DollarSign, Search, Users, Sparkles, Sliders 
} from 'lucide-react';
import { Product, Order, Complaint, SystemSettings, User, ActivityLog } from '../types';

interface AdminPanelProps {
  currentUser: User | null;
  onNavigate: (view: string, targetId?: string) => void;
}

export default function AdminPanel({
  currentUser,
  onNavigate
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'pending' | 'products' | 'orders' | 'complaints' | 'settings' | 'logs'>('stats');
  const [loading, setLoading] = useState(false);
  
  // Data lists
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Search terms
  const [prodSearch, setProdSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');

  // Settings form fields
  const [shippingBaghdad, setShippingBaghdad] = useState(5000);
  const [shippingGovs, setShippingGovs] = useState(8000);
  const [maintenance, setMaintenance] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // NeedsEdit instructions modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [needsEditProdId, setNeedsEditProdId] = useState('');
  const [needsEditInstructions, setNeedsEditInstructions] = useState('');

  const fetchAdminData = () => {
    if (!currentUser || currentUser.role !== 'admin') return;
    setLoading(true);

    const headers = { 'Authorization': `Bearer ${currentUser.id}` };

    // Fetch Settings
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        setShippingBaghdad(data.shippingFeeBaghdad);
        setShippingGovs(data.shippingFeeGovs);
        setMaintenance(data.maintenanceMode);
      })
      .catch(e => console.error(e));

    // Fetch Complaints
    fetch('/api/complaints', { headers })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setComplaints(data); })
      .catch(e => console.error(e));

    // Fetch Logs
    fetch('/api/logs', { headers })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setLogs(data); })
      .catch(e => console.error(e));

    // Fetch All Users
    fetch('/api/users', { headers })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setUsers(data); })
      .catch(e => console.error(e));

    // Fetch Orders
    fetch('/api/orders', { headers })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setOrders(data); })
      .catch(e => console.error(e));

    // Fetch All Products
    fetch('/api/products?admin=true', { headers })
      .then(res => res.json())
      .then((data: any) => {
        let productsList: Product[] = [];
        if (Array.isArray(data)) {
          productsList = data;
        } else if (data && Array.isArray(data.products)) {
          productsList = data.products;
        }
        setAllProducts(productsList);
        setPendingProducts(productsList.filter(p => p.status === 'Pending'));
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAdminData();
  }, [currentUser]);

  const handleApproveProduct = async (id: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/products/${id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({ status: 'Approved' })
      });
      if (res.ok) {
        alert('تمت الموافقة على الإعلان ونشره للعامة بنجاح!');
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectProduct = async (id: string) => {
    if (!currentUser) return;
    if (!window.confirm('هل أنت متأكد من رفض هذا الإعلان؟')) return;
    try {
      const res = await fetch(`/api/products/${id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({ status: 'Rejected' })
      });
      if (res.ok) {
        alert('تم رفض الإعلان بنجاح.');
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerNeedsEdit = (id: string) => {
    setNeedsEditProdId(id);
    setNeedsEditInstructions('');
    setShowEditModal(true);
  };

  const handleNeedsEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !needsEditInstructions.trim()) return;

    try {
      const res = await fetch(`/api/products/${needsEditProdId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({ 
          status: 'NeedsEdit',
          instructions: needsEditInstructions
        })
      });
      if (res.ok) {
        setShowEditModal(false);
        alert('تم إرسال طلب التعديل والتعليمات للبائع بنجاح!');
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: any) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        alert('تم تحديث حالة طلب الشحن والمشترٍ تبلغ بذلك تلقائياً عيني!');
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolveComplaint = async (id: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/complaints/${id}/resolve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${currentUser.id}` }
      });
      if (res.ok) {
        alert('تم حل الشكوى بنجاح وتوثيق حلها عيني.');
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSettingsSuccess('');

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({
          shippingFeeBaghdad: shippingBaghdad,
          shippingFeeGovs: shippingGovs,
          maintenanceMode: maintenance
        })
      });
      if (res.ok) {
        setSettingsSuccess('تم حفظ إعدادات التوصيل والنظام العام بنجاح!');
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Stats calculation
  const totalSales = orders
    .filter(o => o.status === 'Delivered')
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrders = orders.filter(o => o.status === 'PendingReview').length;

  // Filtered lists
  const filteredProducts = allProducts.filter(p => 
    p.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
    p.section.toLowerCase().includes(prodSearch.toLowerCase()) ||
    p.governorate.toLowerCase().includes(prodSearch.toLowerCase())
  );

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
    o.phone.includes(orderSearch) ||
    o.governorate.toLowerCase().includes(orderSearch.toLowerCase())
  );

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <XCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="font-extrabold text-slate-800 dark:text-white text-lg">غير مصرح بالدخول</h3>
        <p className="text-slate-500 text-xs">لوحة التحكم هذه مخصصة لمشرفي سوق الجمعة فقط عيني.</p>
        <button 
          onClick={() => onNavigate('home')}
          className="bg-orange-600 text-white font-bold text-xs px-6 py-2.5 rounded-xl"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      
      {/* Admin Title Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 rounded-2xl text-orange-400">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg sm:text-xl">بوابة الإشراف والتحكم العام | سوق الجمعة 🇮🇶</h2>
            <p className="text-[10px] text-slate-400 mt-1">مرحباً بك المشرف: <span className="text-white font-bold">{currentUser.name}</span> (المدير العام للمنصة)</p>
          </div>
        </div>

        <button 
          onClick={fetchAdminData}
          className="bg-white/10 hover:bg-white/20 p-2.5 rounded-xl border border-white/15 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>تحديث البيانات السريع</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Navigation Admin sidebar */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-sm overflow-hidden p-2">
          <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 gap-1 text-xs">
            
            <button
              onClick={() => setActiveTab('stats')}
              className={`w-full text-right px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 lg:shrink ${activeTab === 'stats' ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
            >
              <Sliders className="w-4.5 h-4.5" />
              <span>الإحصائيات ونشاط المنصة</span>
            </button>

            <button
              onClick={() => setActiveTab('pending')}
              className={`w-full text-right px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-between shrink-0 lg:shrink ${activeTab === 'pending' ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
            >
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4.5 h-4.5" />
                <span>طلبات فحص الإعلانات</span>
              </span>
              {pendingProducts.length > 0 && (
                <span className="bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {pendingProducts.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full text-right px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 lg:shrink ${activeTab === 'products' ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
            >
              <ShoppingBag className="w-4.5 h-4.5" />
              <span>إدارة كافة الإعلانات ({allProducts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full text-right px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-between shrink-0 lg:shrink ${activeTab === 'orders' ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
            >
              <span className="flex items-center gap-2">
                <ClipboardList className="w-4.5 h-4.5" />
                <span>إدارة طلبات الشراء ({orders.length})</span>
              </span>
              {pendingOrders > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                  {pendingOrders} جديدة
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('complaints')}
              className={`w-full text-right px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-between shrink-0 lg:shrink ${activeTab === 'complaints' ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
            >
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4.5 h-4.5" />
                <span>إدارة بلاغات الشكاوى</span>
              </span>
              {complaints.filter(c => c.status === 'pending').length > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                  {complaints.filter(c => c.status === 'pending').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`w-full text-right px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 lg:shrink ${activeTab === 'logs' ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
            >
              <Play className="w-4.5 h-4.5" />
              <span>سجل مراقبة العمليات (Logs)</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full text-right px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 lg:shrink ${activeTab === 'settings' ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
            >
              <Settings className="w-4.5 h-4.5" />
              <span>إعدادات النظام والرسوم المعتمدة</span>
            </button>

          </div>
        </div>

        {/* Tab contents panel */}
        <div className="lg:col-span-9 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-sm p-6 min-h-[450px]">
          
          {loading && (
            <div className="py-20 text-center space-y-2">
              <RefreshCw className="w-8 h-8 animate-spin text-orange-600 mx-auto" />
              <p className="text-slate-400 text-xs">جاري تحميل بيانات الإشراف للمنصة عيني...</p>
            </div>
          )}

          {!loading && (
            <>
              {/* Tab: Stats & Dashboard */}
              {activeTab === 'stats' && (
                <div className="space-y-6">
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-white border-b pb-3 border-slate-100 dark:border-slate-900">
                    مؤشرات النشاط والنمو المالي للمنصة
                  </h3>

                  {/* Summary grid cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-900">
                      <span className="text-[10px] block text-slate-400 font-bold">المبيعات المستلمة</span>
                      <span className="font-extrabold text-sm sm:text-base text-orange-600">{totalSales.toLocaleString()} د.ع</span>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-900">
                      <span className="text-[10px] block text-slate-400 font-bold">إجمالي المستخدمين</span>
                      <span className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-white">{users.length} مستخدم</span>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-900">
                      <span className="text-[10px] block text-slate-400 font-bold">المنتجات المقبولة</span>
                      <span className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-white">{allProducts.filter(p => p.status === 'Approved').length} إعلان</span>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-900">
                      <span className="text-[10px] block text-slate-400 font-bold">الشكاوى المعلقة</span>
                      <span className="font-extrabold text-sm sm:text-base text-red-500">{complaints.filter(c => c.status === 'pending').length} بلاغات</span>
                    </div>
                  </div>

                  {/* HTML visual bento-like custom charts */}
                  <div className="p-5 border border-slate-100 dark:border-slate-900 rounded-2xl space-y-4">
                    <h4 className="font-bold text-xs text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-orange-500" />
                      <span>توزيع المبيعات والشحن حسب المحافظات العراقية</span>
                    </h4>

                    {/* Baghdad/Basra/Ninawa custom progress bars representing stats */}
                    <div className="space-y-3 pt-2 text-xs">
                      <div>
                        <div className="flex justify-between text-slate-600 mb-1 font-bold">
                          <span>العاصمة بغداد</span>
                          <span className="text-orange-600">65% من حجم الشراء</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="bg-orange-600 h-2 rounded-full" style={{ width: '65%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-slate-600 mb-1 font-bold">
                          <span>البصرة الفيحاء</span>
                          <span className="text-orange-600">20% من حجم الشراء</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="bg-orange-600 h-2 rounded-full" style={{ width: '20%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-slate-600 mb-1 font-bold">
                          <span>نينوى الحدباء</span>
                          <span className="text-orange-600">10% من حجم الشراء</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="bg-orange-600 h-2 rounded-full" style={{ width: '10%' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Pending Products for approval (FAH-SS) */}
              {activeTab === 'pending' && (
                <div className="space-y-6">
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-white border-b pb-3 border-slate-100 dark:border-slate-900">
                    إعلانات بانتظار الفحص والموافقة ({pendingProducts.length})
                  </h3>

                  {pendingProducts.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-12">كل الإعلانات بالمنصة مفحوصة ومقبولة حالياً عيني عافية عليك!</p>
                  ) : (
                    <div className="space-y-4">
                      {pendingProducts.map(p => (
                        <div key={p.id} className="p-4 border border-slate-100 dark:border-slate-900 rounded-2xl space-y-3 bg-slate-50/50 dark:bg-slate-900/10">
                          <div className="flex gap-4 items-center">
                            <img 
                              src={p.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=150'} 
                              alt={p.name} 
                              className="w-16 h-16 rounded-xl object-cover shrink-0"
                            />
                            <div className="flex-1 min-w-0 text-xs">
                              <h4 className="font-extrabold text-slate-800 dark:text-white truncate">{p.name}</h4>
                              <p className="text-slate-400 mt-1">السعر: {p.price.toLocaleString()} د.ع • القسم: {p.section}</p>
                              <p className="text-slate-500 mt-0.5 max-w-xl truncate">{p.description}</p>
                            </div>
                          </div>

                          <div className="flex gap-2 justify-end text-xs font-bold pt-2 border-t border-slate-100 dark:border-slate-900">
                            <button
                              onClick={() => handleTriggerNeedsEdit(p.id)}
                              className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl"
                            >
                              طلب تعديل
                            </button>
                            <button
                              onClick={() => handleRejectProduct(p.id)}
                              className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl"
                            >
                              رفض الإعلان
                            </button>
                            <button
                              onClick={() => handleApproveProduct(p.id)}
                              className="px-4 py-2 bg-orange-600 text-white hover:bg-orange-700 rounded-xl"
                            >
                              موافقة ونشر للعامة
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: All Products listing */}
              {activeTab === 'products' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-900 pb-3">
                    <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">إدارة وإلغاء كافة إعلانات المنصة</h3>
                    
                    <div className="relative w-full sm:w-64 text-xs">
                      <input
                        type="text"
                        placeholder="ابحث بالاسم أو المحافظة..."
                        value={prodSearch}
                        onChange={e => setProdSearch(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white px-8 py-2 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                      />
                      <Search className="absolute right-2.5 top-2.5 w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {filteredProducts.map(p => (
                      <div key={p.id} className="p-3.5 border border-slate-100 dark:border-slate-900 rounded-2xl flex items-center justify-between gap-3 text-xs bg-slate-50/50 dark:bg-slate-900/10">
                        <div className="flex items-center gap-3">
                          <img src={p.images?.[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                          <div>
                            <h4 className="font-bold text-slate-800 dark:text-white truncate max-w-[180px]">{p.name}</h4>
                            <p className="text-[10px] text-slate-400">{p.price.toLocaleString()} د.ع • {p.governorate}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            p.status === 'Approved' ? 'bg-orange-100 text-orange-800' :
                            p.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {p.status}
                          </span>
                          
                          <button
                            onClick={() => {
                              if (window.confirm('حذف هذا الإعلان نهائياً من المنصة؟')) {
                                fetch(`/api/products/${p.id}`, {
                                  method: 'DELETE',
                                  headers: { 'Authorization': `Bearer ${currentUser.id}` }
                                }).then(() => fetchAdminData());
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: All Orders manager */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-900 pb-3">
                    <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">إدارة وتوجيه طلبات الشراء والشحن</h3>
                    
                    <div className="relative w-full sm:w-64 text-xs">
                      <input
                        type="text"
                        placeholder="ابحث بالاسم أو المحافظة..."
                        value={orderSearch}
                        onChange={e => setOrderSearch(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white px-8 py-2 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                      />
                      <Search className="absolute right-2.5 top-2.5 w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {filteredOrders.map(o => (
                      <div key={o.id} className="p-4 border border-slate-100 dark:border-slate-900 rounded-2xl space-y-3 bg-slate-50/50 dark:bg-slate-900/10 text-xs">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-slate-800 dark:text-white">الطلب: <span className="font-mono text-orange-600">{o.id}</span></p>
                            <p className="text-[10px] text-slate-400">الهاتف: {o.phone} • المحافظة: {o.governorate}</p>
                          </div>
                          <span className="font-extrabold">{o.total.toLocaleString()} د.ع</span>
                        </div>

                        {/* Order items lists */}
                        <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl space-y-1 text-slate-500 text-[11px]">
                          {o.items.map((item, idx) => (
                            <p key={idx}>• {item.name} ({item.quantity} قطع) x {item.price.toLocaleString()} د.ع</p>
                          ))}
                        </div>

                        <div className="flex items-center justify-between gap-4 pt-2 border-t border-dashed border-slate-100 dark:border-slate-900">
                          <span className="text-[10px] text-slate-400 font-bold">تغيير حالة شحن الطلب:</span>
                          <select
                            value={o.status}
                            onChange={e => handleUpdateOrderStatus(o.id, e.target.value as any)}
                            className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none font-bold"
                          >
                            <option value="PendingReview">PendingReview (قيد المراجعة)</option>
                            <option value="Accepted">Accepted (تم القبول والاتصال)</option>
                            <option value="Preparing">Preparing (جاري التعبئة)</option>
                            <option value="Shipping">Shipping (بيد المندوب)</option>
                            <option value="Delivered">Delivered (تم التسليم مالي)</option>
                            <option value="Cancelled">Cancelled (ملغي)</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Complaints manager */}
              {activeTab === 'complaints' && (
                <div className="space-y-4">
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-white border-b pb-3 border-slate-100 dark:border-slate-900">
                    إدارة شكاوى وبلاغات المستخدمين المعلقة
                  </h3>

                  <div className="space-y-3">
                    {complaints.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">لا توجد بلاغات شكاوى معلقة عيني.</p>
                    ) : (
                      complaints.map(c => (
                        <div key={c.id} className="p-4 border border-slate-100 dark:border-slate-900 rounded-2xl text-xs bg-slate-50/50 dark:bg-slate-900/10 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-extrabold text-slate-800 dark:text-white">{c.title}</h4>
                              <p className="text-[10px] text-slate-400">المرسل: {c.name} • هاتف: {c.phone}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${c.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-orange-100 text-orange-800'}`}>
                              {c.status}
                            </span>
                          </div>

                          <p className="text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                            {c.text}
                          </p>

                          {c.status === 'pending' && (
                            <div className="flex justify-end pt-2">
                              <button
                                onClick={() => handleResolveComplaint(c.id)}
                                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl"
                              >
                                تم حل الشكوى والاتصال بالمستخدم
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Activity Logs */}
              {activeTab === 'logs' && (
                <div className="space-y-4 text-xs font-mono">
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-white border-b pb-3 border-slate-100 dark:border-slate-900 font-sans">
                    سجل عمليات المراقبة وملاحقة التحركات (Logs)
                  </h3>

                  <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl max-h-[400px] overflow-y-auto space-y-2 leading-relaxed">
                    {logs.map(l => (
                      <div key={l.id} className="border-b border-slate-800 pb-1.5 flex justify-between items-start">
                        <div>
                          <span className="text-orange-400">[{l.userId || 'GUEST'}]</span>{' '}
                          <span className="text-slate-300">{l.action}</span>{' '}
                          <span className="text-slate-500">({l.details})</span>
                        </div>
                        <span className="text-slate-500 text-[10px]">{new Date(l.createdAt).toLocaleTimeString('ar-IQ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: General Settings Editor */}
              {activeTab === 'settings' && (
                <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-white border-b pb-3 border-slate-100 dark:border-slate-900">
                    أجور الشحن وتفضيلات النظام العام
                  </h3>

                  {settingsSuccess && <p className="text-orange-600 font-bold">🎉 {settingsSuccess}</p>}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 dark:text-slate-400 block">تكلفة التوصيل في بغداد (د.ع)</label>
                      <input
                        type="number"
                        value={shippingBaghdad}
                        onChange={e => setShippingBaghdad(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 dark:text-slate-400 block">تكلفة التوصيل لكافة محافظات العراق (د.ع)</label>
                      <input
                        type="number"
                        value={shippingGovs}
                        onChange={e => setShippingGovs(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="font-bold text-slate-600 dark:text-slate-400 block mb-2">تفعيل وضع الصيانة المؤقتة للموقع</label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={maintenance}
                          onChange={e => setMaintenance(e.target.checked)}
                          className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                        />
                        <span className="font-bold text-slate-700 dark:text-slate-300">نعم، أغلق المنصة وعرض صفحة الصيانة للمشترين حالياً</span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    حفظ تفضيلات النظام العامة
                  </button>
                </form>
              )}
            </>
          )}

        </div>

      </div>

      {/* NeedsEdit instructions modal dialog */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 dark:text-white">إرسال تعليمات تعديل الإعلان</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400">X</button>
            </div>
            <form onSubmit={handleNeedsEditSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-400 block">اكتب الملاحظات للبائع بالتفصيل</label>
                <textarea
                  rows={4}
                  required
                  placeholder="مثال: يرجى توضيح حالة البطارية في الوصف وإرفاق صورة أوضح للمنتج عيني..."
                  value={needsEditInstructions}
                  onChange={e => setNeedsEditInstructions(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-orange-600"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowEditModal(false)} className="bg-slate-100 px-4 py-2 rounded-xl">إلغاء</button>
                <button type="submit" className="bg-orange-600 text-white px-5 py-2 rounded-xl">إرسال الملاحظات</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
