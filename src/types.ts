export interface MenuVariant {
  label: string;
  price: number;
}

export interface MenuAddon {
  id: string;
  name: string;
  price: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  subtitle?: string;
  note?: string;
  image: string;
  order: number;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  variants?: MenuVariant[];
  addons?: MenuAddon[];
  image: string;
  isPopular?: boolean;
  isAvailable: boolean;
}

export interface OfferItem {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  linkedItemId?: string;
  isActive: boolean;
}

export interface RestaurantInfo {
  name: string;
  slogan: string;
  subtitle: string;
  address: string;
  phones: string[];
  vodafoneCash: string;
  whatsappNumber: string;
  workingHours: string;
}

export interface CartItem {
  cartKey: string;
  itemId: string;
  name: string;
  image: string;
  variantLabel?: string;
  addons: MenuAddon[];
  unitPrice: number;
  quantity: number;
}

export interface OrderItemPayload {
  itemId: string;
  name: string;
  variantLabel?: string;
  addons: MenuAddon[];
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export type OrderStatus = 'جديد' | 'قيد التحضير' | 'تم التوصيل' | 'ملغي';

export interface OrderRecord {
  id: string;
  orderNumber: number;
  customerName: string;
  phone: string;
  address: string;
  paymentMethod: 'كاش عند الاستلام' | 'فودافون كاش';
  notes?: string;
  items: OrderItemPayload[];
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export interface StoreData {
  restaurant: RestaurantInfo;
  categories: MenuCategory[];
  items: MenuItem[];
  offers: OfferItem[];
  orders: OrderRecord[];
}
