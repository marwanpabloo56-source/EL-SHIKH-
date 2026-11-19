import { Clock, MapPin, MessageCircle, Phone, Wallet } from 'lucide-react';
import type { RestaurantInfo } from '../types.ts';

interface ContactSectionProps {
  restaurant: RestaurantInfo;
}

export function ContactSection({ restaurant }: ContactSectionProps) {
  const whatsappLink = `https://wa.me/${restaurant.whatsappNumber}?text=${encodeURIComponent(
    `مرحباً مطعم ${restaurant.name}، أود الاستفسار عن الطلبات.`
  )}`;

  return (
    <section id="contact" className="py-16 lg:py-24 bg-[#0F0B0A] border-t border-[#261D1A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 pb-6 border-b border-[#261D1A]">
          <p className="text-xs font-semibold text-[#D4AF37] mb-2">خدمة العملاء والتوصيل</p>
          <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#FAF6F0]">
            تواصل معنا
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Address & Working Hours */}
          <div className="rounded-xl bg-[#181210] border border-[#2C211E] p-6 space-y-5">
            <div className="flex items-start gap-3.5">
              <MapPin className="w-5 h-5 text-[#D4AF37] shrink-0 mt-1" />
              <div>
                <h3 className="text-base font-bold text-[#FAF6F0] mb-1">موقع المطعم</h3>
                <p className="text-sm text-[#FAF6F0]/75 leading-relaxed">{restaurant.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 pt-4 border-t border-[#261D1A]">
              <Clock className="w-5 h-5 text-[#D4AF37] shrink-0 mt-1" />
              <div>
                <h3 className="text-base font-bold text-[#FAF6F0] mb-1">مواعيد العمل</h3>
                <p className="text-sm text-[#FAF6F0]/75">{restaurant.workingHours}</p>
              </div>
            </div>
          </div>

          {/* Direct Phones & Vodafone Cash */}
          <div className="rounded-xl bg-[#181210] border border-[#2C211E] p-6 space-y-5">
            <div className="flex items-start gap-3.5">
              <Phone className="w-5 h-5 text-[#D4AF37] shrink-0 mt-1" />
              <div className="w-full">
                <h3 className="text-base font-bold text-[#FAF6F0] mb-2">أرقام التليفون</h3>
                <div className="flex flex-col gap-2">
                  {restaurant.phones.map((phone) => (
                    <a
                      key={phone}
                      href={`tel:${phone}`}
                      dir="ltr"
                      className="text-base font-bold text-[#E5C76B] hover:text-white transition-colors text-right tabular-nums"
                    >
                      {phone}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3.5 pt-4 border-t border-[#261D1A]">
              <Wallet className="w-5 h-5 text-[#D4AF37] shrink-0 mt-1" />
              <div>
                <h3 className="text-base font-bold text-[#FAF6F0] mb-1">فودافون كاش</h3>
                <p className="text-base font-bold text-[#E5C76B] tabular-nums" dir="ltr">
                  {restaurant.vodafoneCash}
                </p>
              </div>
            </div>
          </div>

          {/* WhatsApp Ordering Card */}
          <div className="rounded-xl bg-[#1A1412] border border-[#9E1C1C]/50 p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-editorial text-2xl font-bold text-[#FAF6F0] mb-2">
                اطلب مباشرة عبر واتساب
              </h3>
              <p className="text-sm text-[#FAF6F0]/75 leading-relaxed mb-6">
                أضف وجباتك إلى السلة لإرسال الطلب كاملاً، أو تواصل معنا مباشرة عبر واتساب لأي
                استفسار أو تجهيز طلبات المناسبات.
              </p>
            </div>

            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 w-full py-3.5 px-5 rounded-lg bg-[#9E1C1C] hover:bg-[#B92222] text-white text-sm font-bold transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>محادثة واتساب الفورية</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
