import { Lock } from 'lucide-react';
import type { RestaurantInfo } from '../types.ts';

interface FooterProps {
  restaurant: RestaurantInfo;
  onOpenAdmin: () => void;
}

export function Footer({ restaurant, onOpenAdmin }: FooterProps) {
  return (
    <footer className="bg-[#0B0807] border-t border-[#261D1A] text-[#FAF6F0]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-10 border-b border-[#221A17]">
          {/* Brand with Original Emblem */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={`${import.meta.env.BASE_URL}logo-emblem.png`}
                alt={`شعار ${restaurant.name}`}
                className="h-12 w-12 object-contain"
              />
              <div>
                <p className="font-editorial text-2xl font-bold text-[#FAF6F0]">
                  {restaurant.name}
                </p>
                <p className="text-xs text-[#E5C76B]">{restaurant.subtitle}</p>
              </div>
            </div>
            <p className="text-sm text-[#FAF6F0]/65 leading-relaxed">
              {restaurant.slogan} · {restaurant.address}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold text-[#FAF6F0] mb-4">أقسام الموقع</h3>
            <ul className="grid grid-cols-2 gap-2.5 text-sm">
              <li>
                <a href="#hero" className="hover:text-[#E5C76B] transition-colors">
                  الرئيسية
                </a>
              </li>
              <li>
                <a href="#menu" className="hover:text-[#E5C76B] transition-colors">
                  قائمة الطعام
                </a>
              </li>
              <li>
                <a href="#popular" className="hover:text-[#E5C76B] transition-colors">
                  الأكثر طلباً
                </a>
              </li>
              <li>
                <a href="#offers" className="hover:text-[#E5C76B] transition-colors">
                  العروض
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-[#E5C76B] transition-colors">
                  من نحن
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-[#E5C76B] transition-colors">
                  تواصل معنا
                </a>
              </li>
            </ul>
          </div>

          {/* Phones & Admin Link */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#FAF6F0] mb-4">أرقام التواصل</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-2 tabular-nums text-sm" dir="ltr">
              {restaurant.phones.map((p) => (
                <a
                  key={p}
                  href={`tel:${p}`}
                  className="text-[#E5C76B] hover:text-white transition-colors"
                >
                  {p}
                </a>
              ))}
            </div>
            <p className="text-xs text-[#FAF6F0]/60">
              فودافون كاش: <span className="tabular-nums text-[#FAF6F0]">{restaurant.vodafoneCash}</span>
            </p>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#FAF6F0]/55">
          <p>© {new Date().getFullYear()} مطعم {restaurant.name} — جميع الحقوق محفوظة</p>
          <button
            type="button"
            onClick={onOpenAdmin}
            className="inline-flex items-center gap-1.5 text-[#FAF6F0]/60 hover:text-[#E5C76B] transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>لوحة الإدارة</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
