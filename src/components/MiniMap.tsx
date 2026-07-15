import React from 'react';
import { MapPin, ShieldAlert, Compass, ExternalLink, MessageCircle } from 'lucide-react';

interface MiniMapProps {
  governorate: string;
  location?: string;
  storeName?: string;
  onStartChat?: () => void;
}

// Culturally rich and safe meeting points mapped to Iraqi governorates for marketplace exchanges
const GOVERNORATE_MEETING_POINTS: Record<string, { point: string; details: string; lat: number; lng: number }> = {
  'بغداد': {
    point: 'مول المنصور (المنصور) أو ساحة الحرية (الكرادة)',
    details: 'مناطق حيوية، مزدحمة، وآمنة جداً للمعاينة والاستلام طوال اليوم وتحتوي على كاميرات ومارة باستمرار.',
    lat: 33.3242,
    lng: 44.3473
  },
  'أربيل': {
    point: 'شارع 100 (عينكاوة) أو بالقرب من ماجدي مول',
    details: 'أماكن عامة ومفتوحة ومضاءة جيداً مع توفر خيارات جلوس ومواقف مريحة لتجربة السلعة.',
    lat: 36.2167,
    lng: 44.0167
  },
  'البصرة': {
    point: 'شارع الوطن (العشار) أو قرب تايمز سكوير مول',
    details: 'مواقع حيوية ونشطة في البصرة تضمن لك الأمان وتجعل من السهل الالتقاء وفحص الأجهزة أو السلع.',
    lat: 30.5081,
    lng: 47.8172
  },
  'نينوى': {
    point: 'الموصل (الجانب الأيسر) - بالقرب من جامعة الموصل',
    details: 'منطقة حيوية، هادئة ومثالية للقاء الطلاب والشباب لإتمام الصفقات التجارية بأمان.',
    lat: 36.3400,
    lng: 43.1300
  },
  'النجف': {
    point: 'شارع الروان (حي السعد)',
    details: 'منطقة تجارية راقية ومضاءة بشكل ممتاز وتحتوي على العديد من المطاعم والمقاهي المزدحمة.',
    lat: 32.0254,
    lng: 44.3444
  },
  'كربلاء': {
    point: 'شارع السناتر أو حي الحسين',
    details: 'أشهر الشوارع التجارية والحيوية لضمان سلامة الطرفين وسهولة الوصول من جميع الاتجاهات.',
    lat: 32.6160,
    lng: 44.0250
  },
  'بابل': {
    point: 'الحلة - شارع 40 (بالقرب من باب الحسين)',
    details: 'منطقة مزدحمة بالمارة والمحلات، ممتازة للقاءات الشراء والتحقق من جودة المنتجات.',
    lat: 32.4833,
    lng: 44.4333
  },
  'الأنبار': {
    point: 'الرمادي - شارع المستودع أو بالقرب من الفلوجة مول',
    details: 'مواقع عامة يرتادها المواطنون باستمرار تضمن شفافية وسلاسة عملية التسليم.',
    lat: 33.4167,
    lng: 43.3000
  },
  'كركوك': {
    point: 'طريق بغداد - بالقرب من كركوك مول',
    details: 'مركز تسوق آمن وحيوي جداً يناسب تفتيش وفحص السلع الإلكترونية أو القيمة قبل تسليم المبلغ.',
    lat: 35.4681,
    lng: 44.3922
  },
  'ذي قار': {
    point: 'الناصرية - ساحة الحبوبي (قرب سوق القيصرية)',
    details: 'القلب النابض لمدينة الناصرية، موقع ممتاز ومزدحم يضمن الأمان والوصول السريع.',
    lat: 31.0500,
    lng: 46.2500
  },
  'ديالى': {
    point: 'بعقوبة - شارع الطابو التجاري',
    details: 'أحد أنشط الشوارع في بعقوبة، ممتاز لإجراء صفقات سريعة وآمنة تحت الضوء.',
    lat: 33.7424,
    lng: 44.6438
  },
  'ميسان': {
    point: 'العمارة - شارع دجلة (بالقرب من الكورنيش)',
    details: 'موقع مفتوح وجميل يسهل اللقاء فيه وفحص السلع في بيئة مريحة.',
    lat: 31.8333,
    lng: 47.1500
  },
  'المثنى': {
    point: 'السماوة - كورنيش السماوة أو السوق الكبير',
    details: 'منطقة عامة معروفة تضمن الأمان التام وسهولة الاستدلال لكلا الطرفين.',
    lat: 31.3167,
    lng: 45.2833
  },
  'القادسية': {
    point: 'الديوانية - صوب الصغير (بالقرب من المتنزه العام)',
    details: 'موقع مركزي في الديوانية بحركة مواطنين مستمرة، تمنحك الأمان وراحة البال.',
    lat: 31.9833,
    lng: 44.9167
  },
  'واسط': {
    point: 'الكوت - شارع الهورة التجاري المزدحم',
    details: 'شارع تجاري نشط ومضاء بالكامل، وهو الخيار الأفضل لإتمام المقابلة والدفع.',
    lat: 32.5000,
    lng: 45.8167
  },
  'صلاح الدين': {
    point: 'تكريت - شارع الأطباء المزدحم',
    details: 'شارع رئيسي بحركة سير مستمرة طوال اليوم، وهو مثالي للقاء المشتري والبائع.',
    lat: 34.6000,
    lng: 43.6833
  },
  'دهوك': {
    point: 'دهوك - بالقرب من مازي كومبلكس الشهير',
    details: 'مجمع تجاري معروف ومزدحم يوفر بيئة مثالية لتبادل السلع وتسليم الأموال.',
    lat: 36.8667,
    lng: 43.0000
  },
  'السليمانية': {
    point: 'السليمانية - شارع سالم أو قرب مجدي مول',
    details: 'شرايين السليمانية الرئيسية، تضمن وجود حركة مستمرة وأماناً تاماً للطرفين.',
    lat: 35.5608,
    lng: 45.4225
  }
};

export default function MiniMap({ governorate, location, storeName, onStartChat }: MiniMapProps) {
  // Try to normalize the governorate string (remove common variations if any)
  const normGov = governorate ? governorate.trim() : 'بغداد';
  
  // Get safe meeting point info
  const meetingPoint = GOVERNORATE_MEETING_POINTS[normGov] || GOVERNORATE_MEETING_POINTS['بغداد'];
  
  // Construct a strong search query for Google Maps embed
  const searchQuery = location 
    ? `${location}, ${normGov}, العراق`
    : `${meetingPoint.point}, ${normGov}, العراق`;

  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(searchQuery)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
  const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;

  return (
    <div id="mini-map-card" className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-sm overflow-hidden space-y-4">
      {/* Card Header */}
      <div id="mini-map-header" className="p-4 pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-xl">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
              <span>موقع الاستلام ونقطة الالتقاء</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-lg">
                مقترح آمن
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">
              {storeName ? `معرض ${storeName} في محافظة ${normGov}` : `السلعة متوفرة في محافظة ${normGov}`}
            </p>
          </div>
        </div>

        <a 
          id="open-gmaps-link"
          href={googleMapsSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-orange-600 hover:text-orange-700 font-black flex items-center gap-1 self-start sm:self-center transition-colors"
        >
          <span>فتح في خرائط Google</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Map Embed Section */}
      <div id="mini-map-viewport" className="relative h-48 sm:h-56 bg-slate-100 dark:bg-slate-900 border-y border-slate-100 dark:border-slate-900 overflow-hidden">
        <iframe
          id="gmaps-iframe"
          title={`خريطة موقع الاستلام في ${normGov}`}
          src={mapEmbedUrl}
          className="w-full h-full border-0 grayscale dark:invert-[0.9] dark:hue-rotate-180"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        
        {/* Absolute overlay badge showing current Governorate */}
        <div className="absolute bottom-3 right-3 bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-white px-3 py-1 rounded-lg text-[10px] font-black shadow-md border border-slate-100 dark:border-slate-800 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-orange-500 fill-orange-500" />
          <span>العراق • {normGov}</span>
        </div>
      </div>

      {/* Recommended Safe Exchange Spot Details */}
      <div id="mini-map-details" className="p-4 pt-0 space-y-3.5">
        <div className="p-3 bg-orange-50/40 dark:bg-orange-950/10 rounded-xl border border-orange-100/30 dark:border-orange-900/20 space-y-1.5">
          <div className="flex items-center gap-1 text-orange-700 dark:text-orange-400 font-extrabold text-xs">
            <MapPin className="w-4 h-4 text-orange-500" />
            <span>نقطة الالتقاء المقترحة: {meetingPoint.point}</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pr-5">
            {location ? `عنوان المتجر الفعلي: ${location}. ` : ''}
            {meetingPoint.details}
          </p>
        </div>

        {/* Safety tips & Chat CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-start gap-1.5 max-w-md">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
              <strong>نصيحة الأمان:</strong> نوصي دائماً بالالتقاء في أماكن عامة ومفتوحة ومعاينة السلعة والتحقق من جودتها تماماً قبل دفع أي مبالغ نقدية للبائع.
            </p>
          </div>

          {onStartChat && (
            <button
              id="mini-map-chat-btn"
              type="button"
              onClick={onStartChat}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px] font-black px-3 py-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer select-none shrink-0 border border-slate-200/50 dark:border-slate-800"
            >
              <MessageCircle className="w-3.5 h-3.5 text-orange-600" />
              <span>اتفق على مكان آخر بالدردشة</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
