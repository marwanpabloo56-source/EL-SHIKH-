import { ArrowDownLeft, Clock, MapPin, Phone, Wallet } from 'lucide-react';
import { motion } from 'motion/react';
import type { RestaurantInfo } from '../types.ts';
import { IMAGES } from '../data/initialMenu.ts';
import { SmartImage } from './SmartImage.tsx';

interface HeroSectionProps {
  restaurant: RestaurantInfo;
}

export function HeroSection({ restaurant }: HeroSectionProps) {
  return (
    <section id="hero" className="relative bg-[#0F0B0A]">
      {/* Full-bleed Cinematic Shawarma Banner */}
      <div className="relative min-h-[78vh] lg:min-h-[84vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <SmartImage
            src={IMAGES.hero}
            alt="شاورما سورية على السيخ - مطعم الشيخ السوري"
            loading="eager"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-[#0F0B0A] via-[#0F0B0A]/80 to-[#0F0B0A]/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0B0A] via-transparent to-[#0F0B0A]/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl"
          >
            {/* Clean Unboxed Kicker Metadata */}
            <p className="text-xs sm:text-sm font-medium text-[#E5C76B] mb-4 flex flex-wrap items-center gap-2">
              <span>{restaurant.subtitle}</span>
              <span aria-hidden="true" className="text-[#FAF6F0]/40">
                ·
              </span>
              <span className="text-[#FAF6F0]/85">{restaurant.address}</span>
            </p>

            {/* Primary Display Headline */}
            <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-bold text-[#FAF6F0] leading-[1.2] text-balance mb-6">
              {restaurant.slogan}
            </h1>

            <p className="text-base sm:text-lg text-[#FAF6F0]/80 leading-relaxed max-w-xl mb-9">
              تجربة دمشقية متكاملة من سيخ الشاورما المشوي على أصوله، إلى الكريب السوري
              المقرمش، والفراخ المشوية على الفحم والبروستد، بتتبيلة يومية طازجة تصل إليك ساخنة.
            </p>

            {/* Single Dominant Primary CTA + Secondary Route */}
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#menu"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-lg bg-[#9E1C1C] hover:bg-[#B92222] text-white text-base font-bold transition-colors whitespace-nowrap shrink-0 shadow-lg shadow-black/40"
              >
                <span>تصفح قائمة الطعام</span>
                <ArrowDownLeft className="w-4 h-4" />
              </a>

              <a
                href="#offers"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg border border-[#D4AF37]/45 bg-[#16100F]/80 hover:border-[#D4AF37] hover:bg-[#1E1614] text-[#E5C76B] text-base font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <span>بوكسات العائلة والعروض</span>
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 4-Column Quick Restaurant Info Strip */}
      <div className="border-y border-[#2A1F1D] bg-[#140F0E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-3.5">
            <MapPin className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-[#FAF6F0]/55 mb-1">العنوان</p>
              <p className="text-sm font-semibold text-[#FAF6F0]">{restaurant.address}</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <Phone className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-[#FAF6F0]/55 mb-1">أرقام الطلبات</p>
              <p className="text-sm font-semibold text-[#FAF6F0] tabular-nums" dir="ltr">
                {restaurant.phones.slice(0, 2).join(' · ')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <Wallet className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-[#FAF6F0]/55 mb-1">فودافون كاش</p>
              <p className="text-sm font-semibold text-[#E5C76B] tabular-nums" dir="ltr">
                {restaurant.vodafoneCash}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <Clock className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-[#FAF6F0]/55 mb-1">ساعات العمل</p>
              <p className="text-sm font-semibold text-[#FAF6F0]">{restaurant.workingHours}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
