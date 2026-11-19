import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { MenuAddon, MenuCategory, MenuItem } from '../types.ts';
import { MenuItemCard } from './MenuItemCard.tsx';
import { SmartImage } from './SmartImage.tsx';

interface MenuSectionProps {
  categories: MenuCategory[];
  items: MenuItem[];
  onAddToCart: (payload: {
    item: MenuItem;
    variantLabel?: string;
    unitPrice: number;
    addons: MenuAddon[];
  }) => void;
}

export function MenuSection({ categories, items, onAddToCart }: MenuSectionProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.order - b.order),
    [categories]
  );

  const selectedCategoryObj = useMemo(
    () => sortedCategories.find((c) => c.id === activeCategory),
    [sortedCategories, activeCategory]
  );

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (activeCategory !== 'all' && item.categoryId !== activeCategory) {
        return false;
      }
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    });
  }, [items, activeCategory, searchQuery]);

  // Group by category when viewing "all" and no search is active, or show flat filtered grid
  const groupedSections = useMemo(() => {
    if (activeCategory !== 'all' || searchQuery.trim()) {
      return null;
    }
    return sortedCategories
      .map((cat) => ({
        category: cat,
        items: filteredItems.filter((i) => i.categoryId === cat.id),
      }))
      .filter((group) => group.items.length > 0);
  }, [activeCategory, searchQuery, sortedCategories, filteredItems]);

  return (
    <section id="menu" className="py-16 lg:py-24 bg-[#120D0C] border-t border-[#261D1A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header & Search */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-xs font-semibold text-[#D4AF37] mb-2">
              منيو الشيخ السوري الكامل · أسعارنا الأصلية
            </p>
            <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#FAF6F0]">
              قائمة الطعام
            </h2>
          </div>

          {/* Search Bar */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-[#FAF6F0]/45 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن صنف (شاورما، كريب، فاهيتا...)"
              className="w-full h-11 pr-10 pl-9 rounded-lg bg-[#1A1412] border border-[#2C211E] focus:border-[#D4AF37] focus:outline-none text-sm text-[#FAF6F0] placeholder:text-[#FAF6F0]/40"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="مسح البحث"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#FAF6F0]/55 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div
          role="tablist"
          aria-label="أقسام قائمة الطعام"
          className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 border-b border-[#261D1A]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === 'all'}
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeCategory === 'all'
                ? 'bg-[#9E1C1C] text-white'
                : 'bg-[#1A1412] text-[#FAF6F0]/75 hover:text-[#FAF6F0] border border-[#2C211E]'
            }`}
          >
            جميع الأقسام ({items.length})
          </button>

          {sortedCategories.map((cat) => {
            const count = items.filter((i) => i.categoryId === cat.id).length;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                  isActive
                    ? 'bg-[#9E1C1C] text-white'
                    : 'bg-[#1A1412] text-[#FAF6F0]/75 hover:text-[#FAF6F0] border border-[#2C211E]'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Selected Category Header Banner */}
        {selectedCategoryObj && (
          <div className="mb-8 rounded-xl bg-[#181210] border border-[#2C211E] overflow-hidden grid grid-cols-1 md:grid-cols-3 items-stretch">
            <div className="aspect-[16/9] md:aspect-auto md:h-full bg-[#120D0C]">
              <SmartImage
                src={selectedCategoryObj.image}
                alt={selectedCategoryObj.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="md:col-span-2 p-6 flex flex-col justify-center">
              <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[#FAF6F0] mb-2">
                {selectedCategoryObj.name}
              </h3>
              {selectedCategoryObj.subtitle && (
                <p className="text-sm text-[#FAF6F0]/75 mb-3">{selectedCategoryObj.subtitle}</p>
              )}
              {selectedCategoryObj.note && (
                <p className="text-xs sm:text-sm text-[#E5C76B] font-medium">
                  {selectedCategoryObj.note}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Menu Items Display */}
        {filteredItems.length === 0 ? (
          <div className="py-16 text-center rounded-xl bg-[#181210] border border-[#2C211E]">
            <p className="text-base text-[#FAF6F0]/75 mb-4">
              لم يتم العثور على أصناف مطابقة للبحث.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
              className="px-5 py-2.5 rounded-lg bg-[#9E1C1C] hover:bg-[#B92222] text-white text-sm font-semibold cursor-pointer"
            >
              إعادة عرض كل القائمة
            </button>
          </div>
        ) : groupedSections ? (
          <div className="space-y-16">
            {groupedSections.map(({ category, items: catItems }) => (
              <div key={category.id}>
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6 pb-3 border-b border-[#261D1A]">
                  <div>
                    <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[#FAF6F0]">
                      {category.name}
                    </h3>
                    {category.note && (
                      <p className="text-xs sm:text-sm text-[#E5C76B]/90 mt-1">
                        {category.note}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-[#FAF6F0]/55 tabular-nums whitespace-nowrap shrink-0">
                    {catItems.length} أصناف
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {catItems.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      onAddToCart={onAddToCart}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                categoryName={
                  sortedCategories.find((c) => c.id === item.categoryId)?.name
                }
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
