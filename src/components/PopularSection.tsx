import type { MenuAddon, MenuCategory, MenuItem } from '../types.ts';
import { MenuItemCard } from './MenuItemCard.tsx';

interface PopularSectionProps {
  items: MenuItem[];
  categories: MenuCategory[];
  onAddToCart: (payload: {
    item: MenuItem;
    variantLabel?: string;
    unitPrice: number;
    addons: MenuAddon[];
  }) => void;
}

export function PopularSection({ items, categories, onAddToCart }: PopularSectionProps) {
  const popularItems = items.filter((item) => item.isPopular && item.isAvailable);

  if (popularItems.length === 0) return null;

  const getCategoryName = (catId: string) =>
    categories.find((c) => c.id === catId)?.name;

  return (
    <section id="popular" className="py-16 lg:py-24 bg-[#0F0B0A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 border-b border-[#261D1A] pb-6">
          <div>
            <p className="text-xs font-semibold text-[#D4AF37] mb-2">اختيارات ضيوفنا الدائمين</p>
            <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#FAF6F0]">
              الأكثر طلباً في الشيخ السوري
            </h2>
          </div>
          <a
            href="#menu"
            className="text-sm font-semibold text-[#E5C76B] hover:text-[#FAF6F0] transition-colors whitespace-nowrap shrink-0"
          >
            عرض القائمة الكاملة ←
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {popularItems.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              categoryName={getCategoryName(item.categoryId)}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
