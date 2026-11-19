import type { RestaurantInfo } from '../types.ts';

interface AboutSectionProps {
  restaurant: RestaurantInfo;
}

export function AboutSection({ restaurant }: AboutSectionProps) {
  return (
    <section id="about" className="py-16 lg:py-24 bg-[#140F0E] border-t border-[#261D1A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
        {/* Authentic Full Brand Seal on Warm Ivory Parchment */}
        <div className="lg:col-span-5 rounded-2xl bg-[#FAF6F0] border border-[#D4AF37]/40 p-8 sm:p-10 flex flex-col items-center justify-center text-center shadow-xl">
          <img
            src={`${import.meta.env.BASE_URL}logo-full.png`}
            alt={`الشعار الرسمي لمطعم ${restaurant.name}`}
            className="w-60 sm:w-64 h-auto object-contain"
          />
        </div>

        {/* Brand Narrative & Craftsmanship */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <p className="text-xs font-semibold text-[#D4AF37] mb-3">حكاية المذاق الدمشقي</p>
          <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#FAF6F0] leading-snug mb-5">
            {restaurant.slogan}
          </h2>
          <p className="text-base text-[#FAF6F0]/80 leading-relaxed mb-6">
            في قلب المرج بشارع الورشة – ميدان أبو طالب، يجمع مطعم{' '}
            <strong className="text-[#FAF6F0]">{restaurant.name}</strong> بين سر التتبيلة السورية
            الأصيلة وجودة التحضير اليومي الطازج. نحضّر أسياخ الشاورما وخبز الصاج والماريا والكريب
            والمشويات على الفحم والبروستد وفق وصفات شامية متوارثة تضمن لك الطعم الثابت في كل طلب.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-[#2A1F1D]">
            <div>
              <h3 className="text-base font-bold text-[#E5C76B] mb-1.5">تحضير يومي طازج</h3>
              <p className="text-xs sm:text-sm text-[#FAF6F0]/70 leading-relaxed">
                تتبيلة دمشقية أصلية تُجهّز يومياً مع الثومية الشامية والمخللات الطازجة.
              </p>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#E5C76B] mb-1.5">تنوع يناسب الجميع</h3>
              <p className="text-xs sm:text-sm text-[#FAF6F0]/70 leading-relaxed">
                من سندوتشات الشاورما الصاروخ والكريب، حتى مشويات الفحم وبوكسات العائلة.
              </p>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#E5C76B] mb-1.5">توصيل سريع بالمرج</h3>
              <p className="text-xs sm:text-sm text-[#FAF6F0]/70 leading-relaxed">
                طلبك يصل ساخناً ومغلفاً بعناية عبر الاتصال المباشر أو الطلب عبر واتساب.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
