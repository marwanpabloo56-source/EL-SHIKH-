import { useEffect, useState } from 'react';
import {
  FolderKanban,
  Lock,
  LogOut,
  PackageCheck,
  Plus,
  Settings,
  Tag,
  Trash2,
  Upload,
  Utensils,
  X,
} from 'lucide-react';
import type {
  MenuCategory,
  MenuItem,
  MenuVariant,
  OfferItem,
  OrderRecord,
  OrderStatus,
  RestaurantInfo,
} from '../types.ts';
import { SmartImage } from './SmartImage.tsx';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: MenuCategory[];
  items: MenuItem[];
  offers: OfferItem[];
  restaurant: RestaurantInfo;
  onRefreshStore: () => Promise<void>;
}

type AdminTab = 'orders' | 'items' | 'categories' | 'offers' | 'settings';

const ORDER_STATUSES: OrderStatus[] = ['جديد', 'قيد التحضير', 'تم التوصيل', 'ملغي'];

export function AdminModal({
  isOpen,
  onClose,
  categories,
  items,
  offers,
  restaurant,
  onRefreshStore,
}: AdminModalProps) {
  const [token, setToken] = useState<string>(() => localStorage.getItem('shikh_admin_token') || '');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [statusMessage, setStatusMessage] = useState('');

  // Item Editor State
  const [itemFilterCat, setItemFilterCat] = useState('all');
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [variantsDraft, setVariantsDraft] = useState<MenuVariant[]>([]);

  // Category Editor State
  const [editingCategory, setEditingCategory] = useState<Partial<MenuCategory> | null>(null);

  // Offer Editor State
  const [editingOffer, setEditingOffer] = useState<Partial<OfferItem> | null>(null);

  // Settings State
  const [settingsDraft, setSettingsDraft] = useState<RestaurantInfo>(restaurant);

  useEffect(() => {
    setSettingsDraft(restaurant);
  }, [restaurant]);

  const notify = (msg: string) => {
    setStatusMessage(msg);
    window.setTimeout(() => setStatusMessage(''), 3000);
  };

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });

  const loadOrders = async (activeTok = token) => {
    if (!activeTok) return;
    try {
      const res = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${activeTok}` },
      });
      if (res.status === 401) {
        setToken('');
        localStorage.removeItem('shikh_admin_token');
        return;
      }
      const data = await res.json();
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch {
      // Ignore transient network error
    }
  };

  useEffect(() => {
    if (isOpen && token) {
      loadOrders(token);
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل تسجيل الدخول');
      }
      localStorage.setItem('shikh_admin_token', data.token);
      setToken(data.token);
      setPassword('');
      await loadOrders(data.token);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'كلمة المرور غير صحيحة');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST', headers: authHeaders() }).catch(() => {});
    localStorage.removeItem('shikh_admin_token');
    setToken('');
  };

  const handleImageUpload = async (
    file: File,
    onSuccess: (url: string) => void
  ) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ dataUrl, filename: file.name }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        onSuccess(data.url);
        notify('تم رفع الصورة بنجاح');
      } else {
        notify(data.error || 'فشل رفع الصورة');
      }
    };
    reader.readAsDataURL(file);
  };

  // Order Actions
  const handleOrderStatus = async (orderId: string, status: OrderStatus) => {
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await loadOrders();
      notify('تم تحديث حالة الطلب');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (res.ok) {
      await loadOrders();
      notify('تم حذف الطلب');
    }
  };

  // Item Actions
  const openNewItem = () => {
    const defaultCat = categories[0]?.id || 'shawarma';
    setEditingItem({
      categoryId: defaultCat,
      name: '',
      description: '',
      price: 0,
      image: categories[0]?.image || '',
      isPopular: false,
      isAvailable: true,
    });
    setVariantsDraft([]);
  };

  const openEditItem = (item: MenuItem) => {
    setEditingItem({ ...item });
    setVariantsDraft(item.variants ? [...item.variants] : []);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const cleanVariants = variantsDraft.filter((v) => v.label.trim() && v.price > 0);
    const payload = {
      ...editingItem,
      price:
        cleanVariants.length > 0 && (!editingItem.price || editingItem.price === 0)
          ? cleanVariants[0].price
          : Number(editingItem.price),
      variants: cleanVariants,
    };

    const isUpdate = Boolean(editingItem.id);
    const url = isUpdate ? `/api/admin/items/${editingItem.id}` : '/api/admin/items';
    const res = await fetch(url, {
      method: isUpdate ? 'PATCH' : 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setEditingItem(null);
      await onRefreshStore();
      notify(isUpdate ? 'تم تحديث الصنف' : 'تم إضافة الصنف الجديد');
    }
  };

  const handleDeleteItem = async (id: string) => {
    const res = await fetch(`/api/admin/items/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (res.ok) {
      await onRefreshStore();
      notify('تم حذف الصنف');
    }
  };

  // Category Actions
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    const isUpdate = Boolean(editingCategory.id);
    const url = isUpdate
      ? `/api/admin/categories/${editingCategory.id}`
      : '/api/admin/categories';
    const res = await fetch(url, {
      method: isUpdate ? 'PATCH' : 'POST',
      headers: authHeaders(),
      body: JSON.stringify(editingCategory),
    });
    if (res.ok) {
      setEditingCategory(null);
      await onRefreshStore();
      notify(isUpdate ? 'تم تحديث القسم' : 'تم إضافة القسم');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (res.ok) {
      await onRefreshStore();
      notify('تم حذف القسم');
    }
  };

  // Offer Actions
  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOffer) return;
    const isUpdate = Boolean(editingOffer.id);
    const url = isUpdate ? `/api/admin/offers/${editingOffer.id}` : '/api/admin/offers';
    const res = await fetch(url, {
      method: isUpdate ? 'PATCH' : 'POST',
      headers: authHeaders(),
      body: JSON.stringify(editingOffer),
    });
    if (res.ok) {
      setEditingOffer(null);
      await onRefreshStore();
      notify(isUpdate ? 'تم تحديث العرض' : 'تم إضافة العرض');
    }
  };

  const handleDeleteOffer = async (id: string) => {
    const res = await fetch(`/api/admin/offers/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (res.ok) {
      await onRefreshStore();
      notify('تم حذف العرض');
    }
  };

  // Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/restaurant', {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(settingsDraft),
    });
    if (res.ok) {
      await onRefreshStore();
      notify('تم حفظ بيانات المطعم بنجاح');
    }
  };

  const filteredAdminItems =
    itemFilterCat === 'all' ? items : items.filter((i) => i.categoryId === itemFilterCat);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-6xl max-h-[92vh] bg-[#140F0E] border border-[#2C211E] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Top Bar */}
        <div className="px-6 py-4 border-b border-[#261D1A] flex items-center justify-between gap-4 bg-[#100C0B]">
          <div className="flex items-center gap-3">
            <img src="/logo-emblem.png" alt="" className="h-9 w-9 object-contain" />
            <div>
              <h2 className="font-editorial text-xl font-bold text-[#FAF6F0]">
                لوحة إدارة مطعم {restaurant.name}
              </h2>
              {statusMessage && (
                <p className="text-xs font-semibold text-emerald-400">{statusMessage}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {token && (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#332623] text-xs font-semibold text-[#FAF6F0]/75 hover:text-white cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>خروج</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق لوحة الإدارة"
              className="w-10 h-10 inline-flex items-center justify-center rounded-lg border border-[#2C211E] text-[#FAF6F0]/75 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Auth Gate or Workspace */}
        {!token ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <form
              onSubmit={handleLogin}
              className="w-full max-w-sm rounded-2xl bg-[#181210] border border-[#2C211E] p-7 space-y-5"
            >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-xl bg-[#9E1C1C]/20 border border-[#9E1C1C]/40 flex items-center justify-center mx-auto text-[#E5C76B]">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#FAF6F0]">دخول الإدارة</h3>
                <p className="text-xs text-[#FAF6F0]/65">
                  أدخل كلمة مرور صاحب المطعم لإدارة المنيو والأسعار والطلبات.
                </p>
              </div>

              <div>
                <label htmlFor="admin-pass" className="block text-xs text-[#FAF6F0]/75 mb-1.5">
                  كلمة المرور
                </label>
                <input
                  id="admin-pass"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-3.5 rounded-lg bg-[#120D0C] border border-[#2C211E] focus:border-[#D4AF37] focus:outline-none text-sm text-[#FAF6F0]"
                />
              </div>

              {loginError && <p className="text-xs text-red-400 font-semibold">{loginError}</p>}

              <button
                type="submit"
                disabled={loggingIn}
                className="w-full py-3 rounded-lg bg-[#9E1C1C] hover:bg-[#B92222] text-white text-sm font-bold cursor-pointer"
              >
                {loggingIn ? 'جاري التحقق...' : 'دخول إلى لوحة التحكم'}
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="px-6 py-3 border-b border-[#261D1A] bg-[#120D0C] flex items-center gap-2 overflow-x-auto">
              {(
                [
                  { id: 'orders', label: `الطلبات (${orders.length})`, icon: PackageCheck },
                  { id: 'items', label: `الأصناف والأسعار (${items.length})`, icon: Utensils },
                  { id: 'categories', label: `الأقسام (${categories.length})`, icon: FolderKanban },
                  { id: 'offers', label: `العروض (${offers.length})`, icon: Tag },
                  { id: 'settings', label: 'بيانات المطعم', icon: Settings },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#9E1C1C] text-white'
                        : 'bg-[#1A1412] text-[#FAF6F0]/75 hover:text-white border border-[#2C211E]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Panels */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* 1. ORDERS TAB */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#FAF6F0]">الطلبات الواردة</h3>
                    <button
                      type="button"
                      onClick={() => loadOrders()}
                      className="px-3.5 py-1.5 rounded-lg border border-[#332623] text-xs font-semibold text-[#E5C76B] hover:border-[#D4AF37] cursor-pointer"
                    >
                      تحديث القائمة
                    </button>
                  </div>

                  {orders.length === 0 ? (
                    <div className="py-14 text-center rounded-xl bg-[#181210] border border-[#2C211E] text-sm text-[#FAF6F0]/60">
                      لا توجد طلبات مسجلة حتى الآن.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="rounded-xl bg-[#181210] border border-[#2C211E] p-5 space-y-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#261D1A] pb-3">
                            <div>
                              <span className="text-base font-bold text-[#E5C76B] tabular-nums">
                                طلب #{order.orderNumber}
                              </span>
                              <span className="mx-2 text-[#FAF6F0]/35">·</span>
                              <span className="text-sm font-semibold text-[#FAF6F0]">
                                {order.customerName}
                              </span>
                              <span className="mx-2 text-[#FAF6F0]/35">·</span>
                              <span className="text-xs text-[#FAF6F0]/60 tabular-nums" dir="ltr">
                                {order.phone}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <select
                                value={order.status}
                                onChange={(e) =>
                                  handleOrderStatus(order.id, e.target.value as OrderStatus)
                                }
                                className="h-9 px-3 rounded-lg bg-[#120D0C] border border-[#332623] text-xs font-bold text-[#FAF6F0]"
                              >
                                {ORDER_STATUSES.map((st) => (
                                  <option key={st} value={st}>
                                    {st}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => handleDeleteOrder(order.id)}
                                aria-label="حذف الطلب"
                                className="p-2 rounded-lg border border-[#332623] text-[#FAF6F0]/60 hover:text-red-400 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="text-xs text-[#FAF6F0]/75 space-y-1">
                            <p>
                              <strong className="text-[#FAF6F0]">العنوان:</strong> {order.address}
                            </p>
                            <p>
                              <strong className="text-[#FAF6F0]">الدفع:</strong>{' '}
                              {order.paymentMethod}
                              {order.notes ? ` · ملاحظات: ${order.notes}` : ''}
                            </p>
                          </div>

                          <ul className="space-y-1 text-xs text-[#FAF6F0]/85 bg-[#120D0C] p-3 rounded-lg">
                            {order.items.map((it, idx) => (
                              <li key={idx} className="flex justify-between gap-2 tabular-nums">
                                <span>
                                  {it.name}
                                  {it.variantLabel ? ` (${it.variantLabel})` : ''}
                                  {it.addons?.length
                                    ? ` + ${it.addons.map((a) => a.name).join('، ')}`
                                    : ''}{' '}
                                  × {it.quantity}
                                </span>
                                <span className="font-bold text-[#E5C76B]">{it.lineTotal} ج.م</span>
                              </li>
                            ))}
                          </ul>

                          <div className="flex items-center justify-between text-sm font-bold pt-1">
                            <span className="text-xs text-[#FAF6F0]/50">
                              {new Date(order.createdAt).toLocaleString('ar-EG')}
                            </span>
                            <span className="text-[#E5C76B] tabular-nums">
                              الإجمالي: {order.total} ج.م
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 2. ITEMS TAB */}
              {activeTab === 'items' && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <select
                      value={itemFilterCat}
                      onChange={(e) => setItemFilterCat(e.target.value)}
                      className="h-10 px-3.5 rounded-lg bg-[#181210] border border-[#2C211E] text-sm text-[#FAF6F0]"
                    >
                      <option value="all">جميع الأقسام ({items.length})</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={openNewItem}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#9E1C1C] hover:bg-[#B92222] text-white text-sm font-bold cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة صنف جديد</span>
                    </button>
                  </div>

                  {/* Item Edit Form Modal */}
                  {editingItem && (
                    <form
                      onSubmit={handleSaveItem}
                      className="rounded-xl bg-[#1A1412] border border-[#D4AF37]/45 p-5 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-bold text-[#E5C76B]">
                          {editingItem.id ? 'تعديل الصنف' : 'إضافة صنف جديد'}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setEditingItem(null)}
                          className="text-xs text-[#FAF6F0]/60 hover:text-white cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs text-[#FAF6F0]/75 mb-1">اسم الصنف</label>
                          <input
                            type="text"
                            required
                            value={editingItem.name || ''}
                            onChange={(e) =>
                              setEditingItem({ ...editingItem, name: e.target.value })
                            }
                            className="w-full h-10 px-3 rounded-lg bg-[#120D0C] border border-[#2C211E] text-sm text-[#FAF6F0]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-[#FAF6F0]/75 mb-1">القسم</label>
                          <select
                            value={editingItem.categoryId || ''}
                            onChange={(e) =>
                              setEditingItem({ ...editingItem, categoryId: e.target.value })
                            }
                            className="w-full h-10 px-3 rounded-lg bg-[#120D0C] border border-[#2C211E] text-sm text-[#FAF6F0]"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs text-[#FAF6F0]/75 mb-1">
                            السعر الأساسي (ج.م)
                          </label>
                          <input
                            type="number"
                            min={0}
                            required
                            value={editingItem.price ?? 0}
                            onChange={(e) =>
                              setEditingItem({ ...editingItem, price: Number(e.target.value) })
                            }
                            className="w-full h-10 px-3 rounded-lg bg-[#120D0C] border border-[#2C211E] text-sm text-[#FAF6F0] tabular-nums"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-[#FAF6F0]/75 mb-1">الوصف</label>
                        <input
                          type="text"
                          value={editingItem.description || ''}
                          onChange={(e) =>
                            setEditingItem({ ...editingItem, description: e.target.value })
                          }
                          className="w-full h-10 px-3 rounded-lg bg-[#120D0C] border border-[#2C211E] text-sm text-[#FAF6F0]"
                        />
                      </div>

                      {/* Image URL + File Upload */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div>
                          <label className="block text-xs text-[#FAF6F0]/75 mb-1">رابط الصورة</label>
                          <input
                            type="text"
                            value={editingItem.image || ''}
                            onChange={(e) =>
                              setEditingItem({ ...editingItem, image: e.target.value })
                            }
                            className="w-full h-10 px-3 rounded-lg bg-[#120D0C] border border-[#2C211E] text-sm text-[#FAF6F0]"
                          />
                        </div>
                        <label className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-[#332623] bg-[#120D0C] hover:border-[#D4AF37] text-xs font-semibold text-[#E5C76B] cursor-pointer">
                          <Upload className="w-4 h-4" />
                          <span>رفع صورة من جهازك</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(file, (url) =>
                                  setEditingItem((prev) => (prev ? { ...prev, image: url } : prev))
                                );
                              }
                            }}
                          />
                        </label>
                      </div>

                      {/* Optional Multi-Size Variants */}
                      <div className="space-y-2 pt-2 border-t border-[#261D1A]">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#FAF6F0]/80">
                            الأحجام / الأنواع (اختياري - مثل صغير/كبير)
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setVariantsDraft([...variantsDraft, { label: '', price: 0 }])
                            }
                            className="text-xs text-[#E5C76B] hover:underline cursor-pointer"
                          >
                            + إضافة حجم
                          </button>
                        </div>
                        {variantsDraft.map((v, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="الحجم (صغير / كبير / وجبة فرد)"
                              value={v.label}
                              onChange={(e) => {
                                const next = [...variantsDraft];
                                next[idx] = { ...next[idx], label: e.target.value };
                                setVariantsDraft(next);
                              }}
                              className="flex-1 h-9 px-3 rounded-lg bg-[#120D0C] border border-[#2C211E] text-xs text-[#FAF6F0]"
                            />
                            <input
                              type="number"
                              placeholder="السعر"
                              value={v.price}
                              onChange={(e) => {
                                const next = [...variantsDraft];
                                next[idx] = { ...next[idx], price: Number(e.target.value) };
                                setVariantsDraft(next);
                              }}
                              className="w-28 h-9 px-3 rounded-lg bg-[#120D0C] border border-[#2C211E] text-xs text-[#FAF6F0] tabular-nums"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setVariantsDraft(variantsDraft.filter((_, i) => i !== idx))
                              }
                              className="p-2 text-red-400 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center gap-6 pt-2">
                        <label className="inline-flex items-center gap-2 text-xs text-[#FAF6F0]">
                          <input
                            type="checkbox"
                            checked={Boolean(editingItem.isPopular)}
                            onChange={(e) =>
                              setEditingItem({ ...editingItem, isPopular: e.target.checked })
                            }
                          />
                          <span>عرض في الأكثر طلباً</span>
                        </label>
                        <label className="inline-flex items-center gap-2 text-xs text-[#FAF6F0]">
                          <input
                            type="checkbox"
                            checked={editingItem.isAvailable !== false}
                            onChange={(e) =>
                              setEditingItem({ ...editingItem, isAvailable: e.target.checked })
                            }
                          />
                          <span>متاح للطلب</span>
                        </label>

                        <button
                          type="submit"
                          className="mr-auto px-5 py-2.5 rounded-lg bg-[#9E1C1C] hover:bg-[#B92222] text-white text-sm font-bold cursor-pointer"
                        >
                          حفظ الصنف
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Items List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredAdminItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl bg-[#181210] border border-[#2C211E] p-3.5 flex items-center gap-3.5"
                      >
                        <SmartImage
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 rounded-lg object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-[#FAF6F0] truncate">{item.name}</h4>
                          <p className="text-xs text-[#E5C76B] tabular-nums">
                            {item.variants?.length
                              ? item.variants.map((v) => `${v.label}: ${v.price}`).join(' · ')
                              : `${item.price} ج.م`}
                          </p>
                          <p className="text-[11px] text-[#FAF6F0]/55">
                            {categories.find((c) => c.id === item.categoryId)?.name}
                            {item.isPopular ? ' · الأكثر طلباً' : ''}
                            {!item.isAvailable ? ' · غير متاح' : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditItem(item)}
                            className="px-3 py-1.5 rounded-lg border border-[#332623] text-xs font-semibold text-[#FAF6F0] hover:border-[#D4AF37] cursor-pointer"
                          >
                            تعديل
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            aria-label={`حذف ${item.name}`}
                            className="p-2 rounded-lg border border-[#332623] text-[#FAF6F0]/60 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. CATEGORIES TAB */}
              {activeTab === 'categories' && (
                <div className="space-y-5">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingCategory({
                          name: '',
                          subtitle: '',
                          note: '',
                          image: categories[0]?.image || '',
                        })
                      }
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#9E1C1C] hover:bg-[#B92222] text-white text-sm font-bold cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة قسم جديد</span>
                    </button>
                  </div>

                  {editingCategory && (
                    <form
                      onSubmit={handleSaveCategory}
                      className="rounded-xl bg-[#1A1412] border border-[#D4AF37]/45 p-5 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-bold text-[#E5C76B]">
                          {editingCategory.id ? 'تعديل القسم' : 'إضافة قسم جديد'}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setEditingCategory(null)}
                          className="text-xs text-[#FAF6F0]/60 cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-[#FAF6F0]/75 mb-1">اسم القسم</label>
                          <input
                            type="text"
                            required
                            value={editingCategory.name || ''}
                            onChange={(e) =>
                              setEditingCategory({ ...editingCategory, name: e.target.value })
                            }
                            className="w-full h-10 px-3 rounded-lg bg-[#120D0C] border border-[#2C211E] text-sm text-[#FAF6F0]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[#FAF6F0]/75 mb-1">وصف مختصر</label>
                          <input
                            type="text"
                            value={editingCategory.subtitle || ''}
                            onChange={(e) =>
                              setEditingCategory({ ...editingCategory, subtitle: e.target.value })
                            }
                            className="w-full h-10 px-3 rounded-lg bg-[#120D0C] border border-[#2C211E] text-sm text-[#FAF6F0]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-[#FAF6F0]/75 mb-1">
                          ملاحظة القسم (مثل: يضاف إلى الوجبات...)
                        </label>
                        <input
                          type="text"
                          value={editingCategory.note || ''}
                          onChange={(e) =>
                            setEditingCategory({ ...editingCategory, note: e.target.value })
                          }
                          className="w-full h-10 px-3 rounded-lg bg-[#120D0C] border border-[#2C211E] text-sm text-[#FAF6F0]"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div>
                          <label className="block text-xs text-[#FAF6F0]/75 mb-1">صورة القسم</label>
                          <input
                            type="text"
                            value={editingCategory.image || ''}
                            onChange={(e) =>
                              setEditingCategory({ ...editingCategory, image: e.target.value })
                            }
                            className="w-full h-10 px-3 rounded-lg bg-[#120D0C] border border-[#2C211E] text-sm text-[#FAF6F0]"
                          />
                        </div>
                        <label className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-[#332623] bg-[#120D0C] text-xs font-semibold text-[#E5C76B] cursor-pointer">
                          <Upload className="w-4 h-4" />
                          <span>رفع صورة للقسم</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(file, (url) =>
                                  setEditingCategory((prev) =>
                                    prev ? { ...prev, image: url } : prev
                                  )
                                );
                              }
                            }}
                          />
                        </label>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="px-5 py-2.5 rounded-lg bg-[#9E1C1C] hover:bg-[#B92222] text-white text-sm font-bold cursor-pointer"
                        >
                          حفظ القسم
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categories.map((cat) => (
                      <div
                        key={cat.id}
                        className="rounded-xl bg-[#181210] border border-[#2C211E] p-3.5 flex items-center gap-3.5"
                      >
                        <SmartImage
                          src={cat.image}
                          alt={cat.name}
                          className="w-16 h-16 rounded-lg object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-[#FAF6F0]">{cat.name}</h4>
                          {cat.subtitle && (
                            <p className="text-xs text-[#FAF6F0]/60 truncate">{cat.subtitle}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingCategory({ ...cat })}
                            className="px-3 py-1.5 rounded-lg border border-[#332623] text-xs font-semibold text-[#FAF6F0] cursor-pointer"
                          >
                            تعديل
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id)}
                            aria-label={`حذف ${cat.name}`}
                            className="p-2 rounded-lg border border-[#332623] text-[#FAF6F0]/60 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. OFFERS TAB */}
              {activeTab === 'offers' && (
                <div className="space-y-5">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingOffer({
                          title: '',
                          description: '',
                          price: 0,
                          image: offers[0]?.image || categories[0]?.image || '',
                          isActive: true,
                        })
                      }
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#9E1C1C] hover:bg-[#B92222] text-white text-sm font-bold cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة عرض جديد</span>
                    </button>
                  </div>

                  {editingOffer && (
                    <form
                      onSubmit={handleSaveOffer}
                      className="rounded-xl bg-[#1A1412] border border-[#D4AF37]/45 p-5 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-bold text-[#E5C76B]">
                          {editingOffer.id ? 'تعديل العرض' : 'إضافة عرض جديد'}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setEditingOffer(null)}
                          className="text-xs text-[#FAF6F0]/60 cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-[#FAF6F0]/75 mb-1">اسم العرض</label>
                          <input
                            type="text"
                            required
                            value={editingOffer.title || ''}
                            onChange={(e) =>
                              setEditingOffer({ ...editingOffer, title: e.target.value })
                            }
                            className="w-full h-10 px-3 rounded-lg bg-[#120D0C] border border-[#2C211E] text-sm text-[#FAF6F0]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[#FAF6F0]/75 mb-1">السعر (ج.م)</label>
                          <input
                            type="number"
                            min={0}
                            required
                            value={editingOffer.price ?? 0}
                            onChange={(e) =>
                              setEditingOffer({ ...editingOffer, price: Number(e.target.value) })
                            }
                            className="w-full h-10 px-3 rounded-lg bg-[#120D0C] border border-[#2C211E] text-sm text-[#FAF6F0] tabular-nums"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-[#FAF6F0]/75 mb-1">مكونات العرض</label>
                        <input
                          type="text"
                          required
                          value={editingOffer.description || ''}
                          onChange={(e) =>
                            setEditingOffer({ ...editingOffer, description: e.target.value })
                          }
                          className="w-full h-10 px-3 rounded-lg bg-[#120D0C] border border-[#2C211E] text-sm text-[#FAF6F0]"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div>
                          <label className="block text-xs text-[#FAF6F0]/75 mb-1">رابط الصورة</label>
                          <input
                            type="text"
                            value={editingOffer.image || ''}
                            onChange={(e) =>
                              setEditingOffer({ ...editingOffer, image: e.target.value })
                            }
                            className="w-full h-10 px-3 rounded-lg bg-[#120D0C] border border-[#2C211E] text-sm text-[#FAF6F0]"
                          />
                        </div>
                        <label className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-[#332623] bg-[#120D0C] text-xs font-semibold text-[#E5C76B] cursor-pointer">
                          <Upload className="w-4 h-4" />
                          <span>رفع صورة للعرض</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(file, (url) =>
                                  setEditingOffer((prev) =>
                                    prev ? { ...prev, image: url } : prev
                                  )
                                );
                              }
                            }}
                          />
                        </label>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <label className="inline-flex items-center gap-2 text-xs text-[#FAF6F0]">
                          <input
                            type="checkbox"
                            checked={editingOffer.isActive !== false}
                            onChange={(e) =>
                              setEditingOffer({ ...editingOffer, isActive: e.target.checked })
                            }
                          />
                          <span>تفعيل العرض على الموقع</span>
                        </label>
                        <button
                          type="submit"
                          className="px-5 py-2.5 rounded-lg bg-[#9E1C1C] hover:bg-[#B92222] text-white text-sm font-bold cursor-pointer"
                        >
                          حفظ العرض
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {offers.map((offer) => (
                      <div
                        key={offer.id}
                        className="rounded-xl bg-[#181210] border border-[#2C211E] p-3.5 flex items-center gap-3.5"
                      >
                        <SmartImage
                          src={offer.image}
                          alt={offer.title}
                          className="w-16 h-16 rounded-lg object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-[#FAF6F0]">{offer.title}</h4>
                          <p className="text-xs text-[#E5C76B] tabular-nums">{offer.price} ج.م</p>
                          <p className="text-[11px] text-[#FAF6F0]/55 truncate">
                            {offer.isActive ? 'نشط' : 'متوقف'} · {offer.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingOffer({ ...offer })}
                            className="px-3 py-1.5 rounded-lg border border-[#332623] text-xs font-semibold text-[#FAF6F0] cursor-pointer"
                          >
                            تعديل
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteOffer(offer.id)}
                            aria-label={`حذف ${offer.title}`}
                            className="p-2 rounded-lg border border-[#332623] text-[#FAF6F0]/60 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. SETTINGS TAB */}
              {activeTab === 'settings' && (
                <form
                  onSubmit={handleSaveSettings}
                  className="max-w-2xl rounded-xl bg-[#181210] border border-[#2C211E] p-6 space-y-4"
                >
                  <h3 className="text-lg font-bold text-[#FAF6F0] mb-2">بيانات المطعم والتواصل</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-[#FAF6F0]/75 mb-1">اسم المطعم</label>
                      <input
                        type="text"
                        value={settingsDraft.name}
                        onChange={(e) =>
                          setSettingsDraft({ ...settingsDraft, name: e.target.value })
                        }
                        className="w-full h-10 px-3 rounded-lg bg-[#120D0C] border border-[#2C211E] text-sm text-[#FAF6F0]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#FAF6F0]/75 mb-1">الوصف المختصر</label>
                      <input
                        type="text"
                        value={settingsDraft.subtitle}
                        onChange={(e) =>
                          setSettingsDraft({ ...settingsDraft, subtitle: e.target.value })
                        }
                        className="w-full h-10 px-3 rounded-lg bg-[#120D0C] border border-[#2C211E] text-sm text-[#FAF6F0]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-[#FAF6F0]/75 mb-1">الشعار التسويقي</label>
                    <input
                      type="text"
                      value={settingsDraft.slogan}
                      onChange={(e) =>
                        setSettingsDraft({ ...settingsDraft, slogan: e.target.value })
                      }
                      className="w-full h-10 px-3 rounded-lg bg-[#120D0C] border border-[#2C211E] text-sm text-[#FAF6F0]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#FAF6F0]/75 mb-1">العنوان</label>
                    <input
                      type="text"
                      value={settingsDraft.address}
                      onChange={(e) =>
                        setSettingsDraft({ ...settingsDraft, address: e.target.value })
                      }
                      className="w-full h-10 px-3 rounded-lg bg-[#120D0C] border border-[#2C211E] text-sm text-[#FAF6F0]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-[#FAF6F0]/75 mb-1">
                        رقم فودافون كاش
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={settingsDraft.vodafoneCash}
                        onChange={(e) =>
                          setSettingsDraft({ ...settingsDraft, vodafoneCash: e.target.value })
                        }
                        className="w-full h-10 px-3 rounded-lg bg-[#120D0C] border border-[#2C211E] text-sm text-[#FAF6F0] text-right tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#FAF6F0]/75 mb-1">
                        رقم الواتساب للطلبات (بالصيغة الدولية مثل 201150190421)
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={settingsDraft.whatsappNumber}
                        onChange={(e) =>
                          setSettingsDraft({ ...settingsDraft, whatsappNumber: e.target.value })
                        }
                        className="w-full h-10 px-3 rounded-lg bg-[#120D0C] border border-[#2C211E] text-sm text-[#FAF6F0] text-right tabular-nums"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-[#FAF6F0]/75 mb-1">
                      أرقام التواصل (مفصولة بفاصلة)
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={settingsDraft.phones.join(', ')}
                      onChange={(e) =>
                        setSettingsDraft({
                          ...settingsDraft,
                          phones: e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                      className="w-full h-10 px-3 rounded-lg bg-[#120D0C] border border-[#2C211E] text-sm text-[#FAF6F0] text-right tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#FAF6F0]/75 mb-1">مواعيد العمل</label>
                    <input
                      type="text"
                      value={settingsDraft.workingHours}
                      onChange={(e) =>
                        setSettingsDraft({ ...settingsDraft, workingHours: e.target.value })
                      }
                      className="w-full h-10 px-3 rounded-lg bg-[#120D0C] border border-[#2C211E] text-sm text-[#FAF6F0]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-lg bg-[#9E1C1C] hover:bg-[#B92222] text-white text-sm font-bold cursor-pointer"
                  >
                    حفظ التغييرات
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
