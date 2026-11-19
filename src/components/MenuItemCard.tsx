import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import type { MenuAddon, MenuItem } from '../types.ts';
import { SmartImage } from './SmartImage.tsx';

interface MenuItemCardProps {
  item: MenuItem;
  categoryName?: string;
  onAddToCart: (payload: {
    item: MenuItem;
    variantLabel?: string;
    unitPrice: number;
    addons: MenuAddon[];
  }) => void;
}

export function MenuItemCard({ item, categoryName, onAddToCart }: MenuItemCardProps) {
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [selectedAddons, setSelectedAddons] = useState<MenuAddon[]>([]);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const hasVariants = Boolean(item.variants && item.variants.length > 0);
  const activeVariant = hasVariants ? item.variants![selectedVariantIdx] || item.variants![0] : undefined;
  const basePrice = activeVariant ? activeVariant.price : item.price;
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const finalUnitPrice = basePrice + addonsTotal;

  const toggleAddon = (addon: MenuAddon) => {
    setSelectedAddons((prev) =>
      prev.some((a) => a.id === addon.id)
        ? prev.filter((a) => a.id !== addon.id)
        : [...prev, addon]
    );
  };

  const handleAdd = () => {
    if (!item.isAvailable) return;
    onAddToCart({
      item,
      variantLabel: activeVariant?.label,
      unitPrice: finalUnitPrice,
      addons: selectedAddons,
    });
    setAddedFeedback(true);
    window.setTimeout(() => setAddedFeedback(false), 900);
  };

  return (
    <article className="group flex flex-col justify-between rounded-xl bg-[#181210] border border-[#2C211E] hover:border-[#D4AF37]/45 transition-all duration-200 overflow-hidden hover:-translate-y-0.5">
      <div>
        {/* 4:3 Commercial Dish Photo */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#120D0C]">
          <SmartImage
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          {!item.isAvailable && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <span className="text-sm font-bold text-[#FAF6F0]">غير متوفر حالياً</span>
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="p-5">
          {/* Clean Unboxed Metadata */}
          {(categoryName || item.isPopular) && (
            <div className="flex items-center gap-2 text-xs text-[#E5C76B]/85 mb-1.5">
              {categoryName && <span>{categoryName}</span>}
              {categoryName && item.isPopular && <span aria-hidden="true">·</span>}
              {item.isPopular && <span>الأكثر طلباً</span>}
            </div>
          )}

          <h3 className="text-lg font-bold text-[#FAF6F0] leading-snug mb-1.5">
            {item.name}
          </h3>

          {item.description && (
            <p className="text-xs sm:text-sm text-[#FAF6F0]/65 leading-relaxed mb-4">
              {item.description}
            </p>
          )}

          {/* Variants Selector (Segmented Buttons) */}
          {hasVariants && (
            <div className="mt-3 mb-3">
              <p className="text-[11px] text-[#FAF6F0]/55 mb-1.5">اختر الحجم / النوع:</p>
              <div className="flex flex-wrap gap-1.5">
                {item.variants!.map((variant, idx) => {
                  const isActive = idx === selectedVariantIdx;
                  return (
                    <button
                      key={variant.label}
                      type="button"
                      onClick={() => setSelectedVariantIdx(idx)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                        isActive
                          ? 'bg-[#9E1C1C] text-white'
                          : 'bg-[#231A18] text-[#FAF6F0]/75 hover:text-[#FAF6F0] border border-[#332623]'
                      }`}
                    >
                      {variant.label} · {variant.price} ج.م
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Shawarma Optional Addons */}
          {item.addons && item.addons.length > 0 && (
            <div className="mt-3 mb-2">
              <p className="text-[11px] text-[#FAF6F0]/55 mb-1.5">إضافات اختيارية:</p>
              <div className="flex flex-wrap gap-1.5">
                {item.addons.map((addon) => {
                  const active = selectedAddons.some((a) => a.id === addon.id);
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => toggleAddon(addon)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                        active
                          ? 'bg-[#D4AF37] text-[#0F0B0A] font-bold'
                          : 'bg-[#231A18] text-[#FAF6F0]/70 hover:text-[#FAF6F0] border border-[#332623]'
                      }`}
                    >
                      + {addon.name} ({addon.price} ج.م)
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Aligned Price & Add-to-Cart Baseline */}
      <div className="px-5 pb-5 pt-3 border-t border-[#261D1A] flex items-center justify-between gap-3">
        <div className="tabular-nums">
          <span className="text-xl font-extrabold text-[#E5C76B]">{finalUnitPrice}</span>
          <span className="text-xs text-[#FAF6F0]/70 mr-1">ج.م</span>
        </div>

        <button
          type="button"
          disabled={!item.isAvailable}
          onClick={handleAdd}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
            addedFeedback
              ? 'bg-emerald-700 text-white'
              : 'bg-[#9E1C1C] hover:bg-[#B92222] text-white'
          }`}
        >
          {addedFeedback ? (
            <>
              <Check className="w-4 h-4" />
              <span>تمت الإضافة</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>أضف للسلة</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
}
