import React from 'react';
import { 
  Building2, ArrowRight, Download, Gift, ShieldCheck, 
  Sparkles, ExternalLink, Phone, FileText, CheckCircle2 
} from 'lucide-react';

interface CatalogProps {
  onNavigate: (view: string) => void;
}

export default function CatalogsPage({ onNavigate }: CatalogProps) {
  
  const corporateCatalogs = [
    {
      companyName: 'مجموعة الحافظ للإلكترونيات والأجهزة المنزلية',
      description: 'الوكيل الرسمي والمعتمد لأجهزة جري وميديا وكافة مستلزمات التبريد والأجهزة المنزلية في العراق.',
      cover: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=600',
      logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=100',
      activeOffers: 'خصومات تصل إلى 15% على السبلت والدكت للمنازل والمساجد والمؤسسات.',
      phone: '07705555111',
      pdfUrl: '#',
      promoCode: 'ALHAFIDH15'
    },
    {
      companyName: 'شركة النبأ لتكنولوجيا المعلومات والهواتف',
      description: 'الموزع المعتمد لأجهزة آبل وإتش بي ولينوفو وسامسونج في العراق. عروض خاصة للشركات والمكاتب الهندسية.',
      cover: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=80&w=600',
      logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=100',
      activeOffers: 'احصل على حقيبة وإكسسوارات مجانية مع كل لابتوب مخصص للألعاب أو الدراسة.',
      phone: '07802222444',
      pdfUrl: '#',
      promoCode: 'ALNABAATECH'
    },
    {
      companyName: 'وكالة تويوتا العراق (Toyota Iraq)',
      description: 'السيارات الهجينة والكهربائية والتقليدية مع خدمات الضمان الحقيقي وقطع الغيار الأصلية المضمونة.',
      cover: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600',
      logo: 'https://images.unsplash.com/photo-1516594798947-e65505dbb29d?auto=format&fit=crop&q=80&w=100',
      activeOffers: 'ضمان ممدد لـ 5 سنوات على بطاريات الهايلكس والراف فور الصديقة للبيئة.',
      phone: '07718888999',
      pdfUrl: '#',
      promoCode: 'TOYOTA2026'
    },
    {
      companyName: 'آسيا سيل للاتصالات (Asiacell)',
      description: 'باقات إنترنت بلا حدود وسيم كارتات الشركات والخدمات السحابية المتكاملة لربط مكاتب بابل والبصرة وبغداد.',
      cover: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600',
      logo: 'https://images.unsplash.com/photo-1557200134-90327ee9fafa?auto=format&fit=crop&q=80&w=100',
      activeOffers: 'اشترك بخط الأعمال واحصل على سعة تخزين سحابية 100 جيجابايت مجاناً لمدة عام.',
      phone: '07701111222',
      pdfUrl: '#',
      promoCode: 'ASIA_BIZ'
    }
  ];

  const handleDownload = (company: string) => {
    alert(`عيني! تم بدء تحميل كتالوج "${company}" بصيغة PDF بنجاح. تصفحه بكل راحة.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      
      {/* Back button */}
      <button 
        onClick={() => onNavigate('home')}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 mb-6 cursor-pointer"
      >
        <ArrowRight className="w-4 h-4" />
        <span>العودة للرئيسية</span>
      </button>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-3xl p-6 sm:p-8 space-y-3 mb-8 shadow-lg">
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-yellow-300" />
          <h2 className="font-extrabold text-base sm:text-2xl">عروض الشركات وكتالوجات البيع المباشر المعتمدة</h2>
        </div>
        <p className="text-xs sm:text-sm text-orange-100 max-w-2xl leading-relaxed">
          تصفح وحمل كتالوجات كبرى الوكالات التجارية والشركات المسجلة رسمياً في سوق الجمعة - العراق. عروض حصرية، ضمانات حقيقية، وخدمة توصيل سريعة لكافة المحافظات بأسعار مخصصة.
        </p>
      </div>

      {/* Corporate list grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {corporateCatalogs.map((catalog, idx) => (
          <div 
            key={idx}
            className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-900 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col h-full justify-between"
          >
            <div>
              {/* Cover Photo */}
              <div className="relative h-40 bg-slate-200">
                <img src={catalog.cover} alt={catalog.companyName} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30" />
                
                {/* Floating Logo */}
                <img 
                  src={catalog.logo} 
                  alt="" 
                  className="absolute bottom-3 right-4 w-12 h-12 rounded-xl object-cover border-2 border-white bg-white shadow-md"
                />
              </div>

              {/* Company Info */}
              <div className="p-4 space-y-3">
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                  <span>{catalog.companyName}</span>
                  <ShieldCheck className="w-4.5 h-4.5 text-orange-500 fill-orange-500 shrink-0" title="شركة معتمدة" />
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {catalog.description}
                </p>

                {/* Active Promo Box */}
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-950/50 space-y-1">
                  <span className="text-[10px] font-extrabold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                    <Gift className="w-4 h-4 animate-pulse text-red-500" />
                    <span>العرض النشط حالياً:</span>
                  </span>
                  <p className="text-[10px] text-slate-700 dark:text-slate-300 font-bold">{catalog.activeOffers}</p>
                  <p className="text-[9px] text-slate-500 mt-1 block">
                    كود الخصم الحصري: <span className="font-mono font-extrabold text-rose-600 bg-rose-100/50 px-1.5 py-0.5 rounded">{catalog.promoCode}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Actions Panel */}
            <div className="p-4 border-t border-slate-50 dark:border-slate-900/50 flex gap-2 text-[11px] font-bold">
              <button
                onClick={() => handleDownload(catalog.companyName)}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4 animate-bounce" />
                <span>تحميل الكتالوج بصيغة PDF</span>
              </button>

              <a
                href={`tel:${catalog.phone}`}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1"
                title="اتصل بالشركة"
              >
                <Phone className="w-4 h-4 text-orange-600" />
                <span>اتصل</span>
              </a>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
