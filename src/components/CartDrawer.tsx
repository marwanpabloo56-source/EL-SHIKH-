import { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import type { CartItem, OrderRecord, RestaurantInfo } from '../types.ts';
import { SmartImage } from './SmartImage.tsx';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  restaurant: RestaurantInfo;
  onUpdateQty: (cartKey: string, delta: number) => void;
  onRemoveItem: (cartKey: string) => void;
  onClearCart: () => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  cart,
  restaurant,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
}: CartDrawerProps) {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'كاش عند الاستلام' | 'فودافون كاش'>(
    'كاش عند الاستلام'
  );
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<{
    order: OrderRecord;
    whatsappText: string;
    whatsappUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const total = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const buildWhatsappMessage = (order: OrderRecord) => {
    const lines = [
      `*طلب جديد من موقع ${restaurant.name}*`,
      `رقم الطلب: #${order.orderNumber}`,
      `----------------`,
      `*العميل:* ${order.customerName}`,
      `*الهاتف:* ${order.phone}`,
      `*العنوان:* ${order.address}`,
      `*طريقة الدفع:* ${order.paymentMethod}`,
      order.notes ? `*ملاحظات:* ${order.notes}` : '',
      `----------------`,
      `*تفاصيل الطلب:*`,
      ...order.items.map((item, idx) => {
        const variantPart = item.variantLabel ? ` (${item.variantLabel})` : '';
        const addonsPart =
          item.addons && item.addons.length > 0
            ? ` + إضافات: ${item.addons.map((a) => a.name).join('، ')}`
            : '';
        return `${idx + 1}. ${item.name}${variantPart}${addonsPart} × ${item.quantity} = ${item.lineTotal} ج.م`;
      }),
      `----------------`,
      `*الإجمالي المطلوب:* ${order.total} جنيه مصري`,
    ].filter(Boolean);

    return lines.join('\n');
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (cart.length === 0) {
      setErrorMsg('السلة فارغة، أضف أصنافاً أولاً.');
      return;
    }
    if (!customerName.trim()) {
      setErrorMsg('يرجى كتابة الاسم الكامل.');
      return;
    }
    if (phone.trim().length < 8) {
      setErrorMsg('يرجى إدخال رقم هاتف صحيح.');
      return;
    }
    if (!address.trim()) {
      setErrorMsg('يرجى كتابة العنوان بالتفصيل للتوصيل.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerName: customerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        paymentMethod,
        notes: notes.trim(),
        items: cart.map((c) => ({
          itemId: c.itemId,
          name: c.name,
          variantLabel: c.variantLabel,
          addons: c.addons,
          unitPrice: c.unitPrice,
          quantity: c.quantity,
          lineTotal: c.unitPrice * c.quantity,
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'تعذر حفظ الطلب.');
      }

      const order = data.order as OrderRecord;
      const whatsappText = buildWhatsappMessage(order);
      const whatsappUrl = `https://wa.me/${restaurant.whatsappNumber}?text=${encodeURIComponent(
        whatsappText
      )}`;

      setConfirmedOrder({ order, whatsappText, whatsappUrl });
      onClearCart();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'حدث خطأ أثناء إرسال الطلب.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!confirmedOrder) return;
    try {
      await navigator.clipboard.writeText(confirmedOrder.whatsappText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handleClose = () => {
    setConfirmedOrder(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        onClick={handleClose}
      />

      <aside
        aria-label="سلة المشتريات"
        className="relative z-10 w-full max-w-md bg-[#140F0E] border-r border-[#2C211E] h-full flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#261D1A] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="font-editorial text-2xl font-bold text-[#FAF6F0]">
              {confirmedOrder ? 'تأكيد الطلب' : 'سلة الطلبات'}
            </h2>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="إغلاق السلة"
            className="w-10 h-10 inline-flex items-center justify-center rounded-lg border border-[#2C211E] text-[#FAF6F0]/75 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {confirmedOrder ? (
            <div className="space-y-6">
              <div className="rounded-xl bg-[#1A1412] border border-[#D4AF37]/40 p-5 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h3 className="text-lg font-bold text-[#FAF6F0]">
                  تم تسجيل طلبك بنجاح (#{confirmedOrder.order.orderNumber})
                </h3>
                <p className="text-sm text-[#FAF6F0]/75">
                  اضغط على الزر أدناه لإرسال تفاصيل الطلب مباشرة إلى واتساب مطعم{' '}
                  {restaurant.name}.
                </p>
              </div>

              <div className="rounded-xl bg-[#181210] border border-[#2C211E] p-4 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#FAF6F0]/60">الاسم:</span>
                  <span className="font-semibold text-[#FAF6F0]">
                    {confirmedOrder.order.customerName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#FAF6F0]/60">الهاتف:</span>
                  <span className="font-semibold text-[#FAF6F0] tabular-nums" dir="ltr">
                    {confirmedOrder.order.phone}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[#FAF6F0]/60 shrink-0">العنوان:</span>
                  <span className="font-semibold text-[#FAF6F0] text-left">
                    {confirmedOrder.order.address}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#FAF6F0]/60">الدفع:</span>
                  <span className="font-semibold text-[#E5C76B]">
                    {confirmedOrder.order.paymentMethod}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#261D1A] flex justify-between text-base font-bold">
                  <span className="text-[#FAF6F0]">الإجمالي:</span>
                  <span className="text-[#E5C76B] tabular-nums">
                    {confirmedOrder.order.total} ج.م
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <a
                  href={confirmedOrder.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-lg bg-[#9E1C1C] hover:bg-[#B92222] text-white text-base font-bold transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>إرسال الطلب عبر واتساب</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-[#332623] bg-[#1A1412] hover:border-[#D4AF37]/50 text-sm font-medium text-[#FAF6F0]/85 cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copied ? 'تم نسخ تفاصيل الطلب' : 'نسخ نص الطلب'}</span>
                </button>
              </div>
            </div>
          ) : cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <ShoppingBag className="w-12 h-12 text-[#D4AF37]/40 mb-4" strokeWidth={1.5} />
              <p className="text-base font-semibold text-[#FAF6F0] mb-1">
                سلة المشتريات فارغة
              </p>
              <p className="text-sm text-[#FAF6F0]/60 mb-6">
                أضف أشهى أصناف الشاورما والكريب والمشويات لتبدأ طلبك.
              </p>
              <a
                href="#menu"
                onClick={handleClose}
                className="px-5 py-2.5 rounded-lg bg-[#9E1C1C] hover:bg-[#B92222] text-white text-sm font-bold transition-colors"
              >
                استعراض المنيو
              </a>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Cart Items List */}
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.cartKey}
                    className="rounded-xl bg-[#181210] border border-[#2C211E] p-3.5 flex gap-3.5"
                  >
                    <SmartImage
                      src={item.image}
                      alt={item.name}
                      className="w-18 h-18 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-[#FAF6F0] leading-snug">
                          {item.name}
                        </h3>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.cartKey)}
                          aria-label={`حذف ${item.name}`}
                          className="text-[#FAF6F0]/45 hover:text-red-400 transition-colors cursor-pointer shrink-0 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {(item.variantLabel || item.addons.length > 0) && (
                        <p className="text-xs text-[#E5C76B]/85 mt-0.5">
                          {[
                            item.variantLabel,
                            item.addons.length > 0
                              ? `إضافات: ${item.addons.map((a) => a.name).join('، ')}`
                              : '',
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      )}

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="inline-flex items-center rounded-lg border border-[#332623] bg-[#120D0C]">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.cartKey, -1)}
                            aria-label="إنقاص الكمية"
                            className="w-8 h-8 inline-flex items-center justify-center text-[#FAF6F0]/80 hover:text-white cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-sm font-bold tabular-nums text-[#FAF6F0]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.cartKey, 1)}
                            aria-label="زيادة الكمية"
                            className="w-8 h-8 inline-flex items-center justify-center text-[#FAF6F0]/80 hover:text-white cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <p className="text-sm font-bold text-[#E5C76B] tabular-nums">
                          {item.unitPrice * item.quantity} ج.م
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Customer Delivery Form */}
              <form id="checkout-form" onSubmit={handleSubmitOrder} className="space-y-4 pt-4 border-t border-[#261D1A]">
                <h3 className="text-base font-bold text-[#FAF6F0]">بيانات التوصيل</h3>

                <div>
                  <label htmlFor="cust-name" className="block text-xs text-[#FAF6F0]/75 mb-1.5">
                    الاسم الكامل *
                  </label>
                  <input
                    id="cust-name"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="مثال: أحمد محمود"
                    className="w-full h-11 px-3.5 rounded-lg bg-[#1A1412] border border-[#2C211E] focus:border-[#D4AF37] focus:outline-none text-sm text-[#FAF6F0]"
                  />
                </div>

                <div>
                  <label htmlFor="cust-phone" className="block text-xs text-[#FAF6F0]/75 mb-1.5">
                    رقم الهاتف *
                  </label>
                  <input
                    id="cust-phone"
                    type="tel"
                    required
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full h-11 px-3.5 rounded-lg bg-[#1A1412] border border-[#2C211E] focus:border-[#D4AF37] focus:outline-none text-sm text-[#FAF6F0] text-right tabular-nums"
                  />
                </div>

                <div>
                  <label htmlFor="cust-address" className="block text-xs text-[#FAF6F0]/75 mb-1.5">
                    العنوان بالتفصيل *
                  </label>
                  <textarea
                    id="cust-address"
                    required
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="المرج - اسم الشارع - رقم العقار والدور"
                    className="w-full p-3 rounded-lg bg-[#1A1412] border border-[#2C211E] focus:border-[#D4AF37] focus:outline-none text-sm text-[#FAF6F0]"
                  />
                </div>

                <div>
                  <p className="text-xs text-[#FAF6F0]/75 mb-1.5">طريقة الدفع</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['كاش عند الاستلام', 'فودافون كاش'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2.5 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                          paymentMethod === method
                            ? 'bg-[#9E1C1C] border-[#9E1C1C] text-white'
                            : 'bg-[#1A1412] border-[#2C211E] text-[#FAF6F0]/75 hover:text-white'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                  {paymentMethod === 'فودافون كاش' && (
                    <p className="mt-2 text-xs text-[#E5C76B] tabular-nums">
                      رقم فودافون كاش للتحويل: {restaurant.vodafoneCash}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="cust-notes" className="block text-xs text-[#FAF6F0]/75 mb-1.5">
                    ملاحظات إضافية (اختياري)
                  </label>
                  <input
                    id="cust-notes"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="مثال: بدون مخلل، تومية زيادة..."
                    className="w-full h-11 px-3.5 rounded-lg bg-[#1A1412] border border-[#2C211E] focus:border-[#D4AF37] focus:outline-none text-sm text-[#FAF6F0]"
                  />
                </div>

                {errorMsg && (
                  <p className="text-xs font-semibold text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg p-3">
                    {errorMsg}
                  </p>
                )}
              </form>
            </div>
          )}
        </div>

        {/* Sticky Subtotal & Submit Footer */}
        {!confirmedOrder && cart.length > 0 && (
          <div className="p-6 border-t border-[#261D1A] bg-[#100C0B] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#FAF6F0]/75">الإجمالي الكلي</span>
              <span className="text-2xl font-extrabold text-[#E5C76B] tabular-nums">
                {total} ج.م
              </span>
            </div>

            <button
              type="submit"
              form="checkout-form"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-lg bg-[#9E1C1C] hover:bg-[#B92222] disabled:opacity-60 text-white text-base font-bold transition-colors cursor-pointer"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{submitting ? 'جاري تسجيل الطلب...' : 'تأكيد الطلب وإرساله عبر واتساب'}</span>
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
