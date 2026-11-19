import { useState } from 'react';
import { Menu, Phone, ShoppingBag, X } from 'lucide-react';
import type { RestaurantInfo } from '../types.ts';

interface NavbarProps {
  restaurant: RestaurantInfo;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
}

const NAV_LINKS = [
  { href: '#hero', label: 'الرئيسية' },
  { href: '#menu', label: 'قائمة الطعام' },
  { href: '#popular', label: 'الأكثر طلباً' },
  { href: '#offers', label: 'العروض' },
  { href: '#about', label: 'من نحن' },
  { href: '#contact', label: 'تواصل معنا' },
];

export function Navbar({ restaurant, cartCount, onOpenCart, onOpenAdmin }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = () => {
    setMobileOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 h-16 bg-[#0F0B0A]/92 backdrop-blur-md border-b border-[#2A1F1D]">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Mark with Original Extracted Emblem */}
          <a
            href="#hero"
            className="flex items-center gap-3 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#D4AF37] rounded-md"
          >
            <img
              src="/logo-emblem.png"
              alt={`شعار مطعم ${restaurant.name}`}
              className="h-11 w-11 object-contain"
            />
            <span className="font-editorial text-xl sm:text-2xl font-bold text-[#FAF6F0] tracking-wide">
              {restaurant.name}
            </span>
          </a>

          {/* Zone 2: Clean Single-Line Navigation Links */}
          <nav
            aria-label="التنقل الرئيسي"
            className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#FAF6F0]/80"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative py-1 whitespace-nowrap shrink-0 hover:text-[#E5C76B] transition-colors after:content-[''] after:absolute after:right-0 after:bottom-0 after:w-0 after:h-[1.5px] after:bg-[#D4AF37] hover:after:w-full after:transition-all after:duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Zone 3: Primary Action (Cart) + Mobile Drawer Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenCart}
              aria-label="فتح سلة المشتريات"
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-lg bg-[#9E1C1C] hover:bg-[#B92222] text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>السلة</span>
              <span className="tabular-nums inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded bg-black/30 text-[#E5C76B] text-xs font-bold">
                {cartCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="فتح القائمة الجانبية"
              className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#2C211E] bg-[#1A1412] text-[#FAF6F0] hover:border-[#D4AF37]/50 transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-[#140F0E] border-l border-[#2C211E] flex flex-col justify-between overflow-y-auto p-6 shadow-2xl">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="font-editorial text-lg font-bold text-[#E5C76B]">
                  القائمة الرئيسية
                </span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="إغلاق القائمة"
                  className="w-10 h-10 inline-flex items-center justify-center rounded-lg border border-[#2C211E] text-[#FAF6F0]/80 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Original Full Extracted Logo inside Warm Parchment Crest */}
              <div className="mb-6 rounded-xl bg-[#FAF6F0] p-4 flex items-center justify-center border border-[#D4AF37]/40">
                <img
                  src="/logo-full.png"
                  alt={`شعار ${restaurant.name} الأصلي`}
                  className="h-32 w-auto object-contain"
                />
              </div>

              <nav className="flex flex-col divide-y divide-[#251C19]">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={handleNavClick}
                    className="py-3.5 text-base font-medium text-[#FAF6F0] hover:text-[#E5C76B] transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>

            <div className="pt-6 border-t border-[#251C19] space-y-4">
              <div className="space-y-2">
                <p className="text-xs text-[#FAF6F0]/60">للطلب السريع والاستفسار</p>
                <div className="flex flex-col gap-1.5">
                  {restaurant.phones.slice(0, 2).map((phone) => (
                    <a
                      key={phone}
                      href={`tel:${phone}`}
                      dir="ltr"
                      className="inline-flex items-center justify-end gap-2 text-sm font-semibold text-[#E5C76B] hover:underline tabular-nums"
                    >
                      <span>{phone}</span>
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onOpenAdmin();
                }}
                className="w-full py-2.5 px-4 rounded-lg border border-[#332623] bg-[#1A1412] text-xs font-medium text-[#FAF6F0]/80 hover:border-[#D4AF37]/50 hover:text-[#E5C76B] transition-colors cursor-pointer"
              >
                لوحة إدارة المطعم
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
