import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import type { OfferItem } from '../types.ts';
import { SmartImage } from './SmartImage.tsx';

interface OffersSectionProps {
  offers: OfferItem[];
  onAddOfferToCart: (offer: OfferItem) => void;
}

export function OffersSection({ offers, onAddOfferToCart }: OffersSectionProps) {
  const [addedId, setAddedId] = useState<string | null>(null);
  const activeOffers = offers.filter((o) => o.isActive);

  if (activeOffers.length === 0) return null;

  const handleAdd = (offer: OfferItem) => {
    onAddOfferToCart(offer);
    setAddedId(offer.id);
    window.setTimeout(() => setAddedId((prev) => (prev === offer.id ? null : prev)), 900);
  };

  return (
    <section id="offers" className="py-16 lg:py-24 bg-[#0F0B0A] border-t border-[#261D1A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 pb-6 border-b border-[#261D1A]">
          <p className="text-xs font-semibold text-[#D4AF37] mb-2">
            بوكسات ووجبات التوفير العائلية من القائمة الأصلية
          </p>
          <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#FAF6F0]">
            العروض والبوكسات
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {activeOffers.map((offer) => {
            const isAdded = addedId === offer.id;
            return (
              <article
                key={offer.id}
                className="flex flex-col justify-between rounded-xl bg-[#1A1412] border border-[#D4AF37]/25 hover:border-[#D4AF37]/60 transition-all duration-200 overflow-hidden"
              >
                <div>
                  <div className="aspect-[16/10] w-full overflow-hidden bg-[#120D0C]">
                    <SmartImage
                      src={offer.image}
                      alt={offer.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <p className="text-xs font-medium text-[#E5C76B] mb-1.5">
                      عرض متكامل من المنيو
                    </p>
                    <h3 className="text-xl font-bold text-[#FAF6F0] mb-2">{offer.title}</h3>
                    <p className="text-sm text-[#FAF6F0]/75 leading-relaxed">
                      {offer.description}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-4 border-t border-[#2A201D] flex items-center justify-between gap-4">
                  <div className="tabular-nums">
                    <span className="text-2xl font-extrabold text-[#E5C76B]">{offer.price}</span>
                    <span className="text-xs text-[#FAF6F0]/70 mr-1">ج.م</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAdd(offer)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      isAdded
                        ? 'bg-emerald-700 text-white'
                        : 'bg-[#9E1C1C] hover:bg-[#B92222] text-white'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>تمت الإضافة</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>اطلب العرض</span>
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
