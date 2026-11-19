import { useCallback, useEffect, useState } from 'react';
import {
  INITIAL_CATEGORIES,
  INITIAL_ITEMS,
  INITIAL_OFFERS,
  INITIAL_RESTAURANT,
} from './data/initialMenu.ts';
import type {
  CartItem,
  MenuAddon,
  MenuCategory,
  MenuItem,
  OfferItem,
  RestaurantInfo,
} from './types.ts';
import { Navbar } from './components/Navbar.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { PopularSection } from './components/PopularSection.tsx';
import { MenuSection } from './components/MenuSection.tsx';
import { OffersSection } from './components/OffersSection.tsx';
import { AboutSection } from './components/AboutSection.tsx';
import { ContactSection } from './components/ContactSection.tsx';
import { Footer } from './components/Footer.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { AdminModal } from './components/AdminModal.tsx';

const CART_STORAGE_KEY = 'alshikh_cart_v1';

export default function App() {
  const [restaurant, setRestaurant] = useState<RestaurantInfo>(INITIAL_RESTAURANT);
  const [categories, setCategories] = useState<MenuCategory[]>(INITIAL_CATEGORIES);
  const [items, setItems] = useState<MenuItem[]>(INITIAL_ITEMS);
  const [offers, setOffers] = useState<OfferItem[]>(INITIAL_OFFERS);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  const [cartOpen, setCartOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  const fetchStore = useCallback(async () => {
    try {
      const res = await fetch('/api/store');
      if (!res.ok) return;
      const data = await res.json();
      if (data.restaurant) setRestaurant(data.restaurant);
      if (Array.isArray(data.categories)) setCategories(data.categories);
      if (Array.isArray(data.items)) setItems(data.items);
      if (Array.isArray(data.offers)) setOffers(data.offers);
    } catch {
      // Keep initial seed data on transient failure
    }
  }, []);

  useEffect(() => {
    fetchStore();
  }, [fetchStore]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage quota errors
    }
  }, [cart]);

  const handleAddToCart = ({
    item,
    variantLabel,
    unitPrice,
    addons,
  }: {
    item: MenuItem;
    variantLabel?: string;
    unitPrice: number;
    addons: MenuAddon[];
  }) => {
    const addonKey = addons
      .map((a) => a.id)
      .sort()
      .join('+');
    const cartKey = `${item.id}::${variantLabel || 'base'}::${addonKey}`;

    setCart((prev) => {
      const existing = prev.find((c) => c.cartKey === cartKey);
      if (existing) {
        return prev.map((c) =>
          c.cartKey === cartKey ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        {
          cartKey,
          itemId: item.id,
          name: item.name,
          image: item.image,
          variantLabel,
          addons,
          unitPrice,
          quantity: 1,
        },
      ];
    });
  };

  const handleAddOfferToCart = (offer: OfferItem) => {
    const cartKey = `offer::${offer.id}`;
    setCart((prev) => {
      const existing = prev.find((c) => c.cartKey === cartKey);
      if (existing) {
        return prev.map((c) =>
          c.cartKey === cartKey ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        {
          cartKey,
          itemId: offer.linkedItemId || offer.id,
          name: offer.title,
          image: offer.image,
          addons: [],
          unitPrice: offer.price,
          quantity: 1,
        },
      ];
    });
  };

  const handleUpdateQty = (cartKey: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.cartKey === cartKey ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const handleRemoveItem = (cartKey: string) => {
    setCart((prev) => prev.filter((c) => c.cartKey !== cartKey));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#0F0B0A] text-[#FAF6F0]" dir="rtl">
      <Navbar
        restaurant={restaurant}
        cartCount={totalCartItems}
        onOpenCart={() => setCartOpen(true)}
        onOpenAdmin={() => setAdminOpen(true)}
      />

      <main>
        <HeroSection restaurant={restaurant} />

        <PopularSection
          items={items}
          categories={categories}
          onAddToCart={handleAddToCart}
        />

        <MenuSection
          categories={categories}
          items={items}
          onAddToCart={handleAddToCart}
        />

        <OffersSection offers={offers} onAddOfferToCart={handleAddOfferToCart} />

        <AboutSection restaurant={restaurant} />

        <ContactSection restaurant={restaurant} />
      </main>

      <Footer restaurant={restaurant} onOpenAdmin={() => setAdminOpen(true)} />

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        restaurant={restaurant}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />

      <AdminModal
        isOpen={adminOpen}
        onClose={() => setAdminOpen(false)}
        categories={categories}
        items={items}
        offers={offers}
        restaurant={restaurant}
        onRefreshStore={fetchStore}
      />
    </div>
  );
}
