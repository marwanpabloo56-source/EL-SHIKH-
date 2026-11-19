import 'dotenv/config';
import crypto from 'node:crypto';
import express, { type NextFunction, type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_CATEGORIES,
  INITIAL_ITEMS,
  INITIAL_OFFERS,
  INITIAL_RESTAURANT,
} from './src/data/initialMenu.ts';
import type {
  MenuCategory,
  MenuItem,
  OfferItem,
  OrderRecord,
  OrderStatus,
  RestaurantInfo,
  StoreData,
} from './src/types.ts';

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');
const UPLOAD_DIR = path.resolve(process.cwd(), 'public', 'uploads');
// Store only a salted scrypt verifier for the default admin password.
// A deployment-specific ADMIN_PASSWORD environment variable takes precedence.
const DEFAULT_ADMIN_SALT = '9f1879ec9c1b0e64ff694fadf134c122';
const DEFAULT_ADMIN_HASH = '0e6288bc8133c8267394eecef829d367176111eb75c474f4f0dadfe68d0a8dc7';
function isValidAdminPassword(password: string): boolean {
  const override = process.env.ADMIN_PASSWORD;
  const actual = override
    ? crypto.scryptSync(override, Buffer.from(DEFAULT_ADMIN_SALT, 'hex'), 32)
    : Buffer.from(DEFAULT_ADMIN_HASH, 'hex');
  const supplied = crypto.scryptSync(password, Buffer.from(DEFAULT_ADMIN_SALT, 'hex'), 32);
  return crypto.timingSafeEqual(supplied, actual);
}

const activeTokens = new Set<string>();

function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

function createInitialStore(): StoreData {
  return {
    restaurant: INITIAL_RESTAURANT,
    categories: INITIAL_CATEGORIES,
    items: INITIAL_ITEMS,
    offers: INITIAL_OFFERS,
    orders: [],
  };
}

function readStore(): StoreData {
  ensureDirectories();
  if (!fs.existsSync(DATA_FILE)) {
    const seeded = createInitialStore();
    fs.writeFileSync(DATA_FILE, JSON.stringify(seeded, null, 2), 'utf-8');
    return seeded;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as StoreData;
    return {
      restaurant: parsed.restaurant || INITIAL_RESTAURANT,
      categories: Array.isArray(parsed.categories) ? parsed.categories : INITIAL_CATEGORIES,
      items: Array.isArray(parsed.items) ? parsed.items : INITIAL_ITEMS,
      offers: Array.isArray(parsed.offers) ? parsed.offers : INITIAL_OFFERS,
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
    };
  } catch {
    const seeded = createInitialStore();
    fs.writeFileSync(DATA_FILE, JSON.stringify(seeded, null, 2), 'utf-8');
    return seeded;
  }
}

function writeStore(data: StoreData): void {
  ensureDirectories();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token || !activeTokens.has(token)) {
    res.status(401).json({ error: 'غير مصرح بالدخول. يرجى تسجيل الدخول أولاً.' });
    return;
  }
  next();
}

async function startServer() {
  ensureDirectories();
  readStore();

  const app = express();
  app.use(express.json({ limit: '12mb' }));

  // Serve uploaded food images cleanly in both dev & prod
  app.use('/uploads', express.static(UPLOAD_DIR));

  // Public Storefront Data
  app.get('/api/store', (_req, res) => {
    const store = readStore();
    res.json({
      restaurant: store.restaurant,
      categories: [...store.categories].sort((a, b) => a.order - b.order),
      items: store.items,
      offers: store.offers,
    });
  });

  // Public Order Creation
  app.post('/api/orders', (req, res) => {
    const { customerName, phone, address, paymentMethod, notes, items } = req.body || {};

    if (!customerName || typeof customerName !== 'string' || !customerName.trim()) {
      res.status(400).json({ error: 'يرجى إدخال اسم العميل.' });
      return;
    }
    if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
      res.status(400).json({ error: 'يرجى إدخال رقم هاتف صحيح.' });
      return;
    }
    if (!address || typeof address !== 'string' || !address.trim()) {
      res.status(400).json({ error: 'يرجى إدخال العنوان بالتفصيل.' });
      return;
    }
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'سلة المشتريات فارغة.' });
      return;
    }

    const store = readStore();
    const total = items.reduce((sum: number, item: { lineTotal?: number }) => {
      return sum + (Number(item.lineTotal) || 0);
    }, 0);

    const nextOrderNum =
      store.orders.length > 0
        ? Math.max(...store.orders.map((o) => o.orderNumber)) + 1
        : 1001;

    const newOrder: OrderRecord = {
      id: `ord-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      orderNumber: nextOrderNum,
      customerName: customerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      paymentMethod: paymentMethod === 'فودافون كاش' ? 'فودافون كاش' : 'كاش عند الاستلام',
      notes: typeof notes === 'string' ? notes.trim() : '',
      items,
      total,
      status: 'جديد',
      createdAt: new Date().toISOString(),
    };

    store.orders.unshift(newOrder);
    writeStore(store);
    res.status(201).json({ order: newOrder });
  });

  // Admin Login
  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body || {};
    if (typeof password !== 'string' || !isValidAdminPassword(password)) {
      res.status(401).json({ error: 'كلمة المرور غير صحيحة.' });
      return;
    }
    const token = crypto.randomBytes(24).toString('hex');
    activeTokens.add(token);
    res.json({ token });
  });

  app.post('/api/admin/logout', (req, res) => {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    if (token) activeTokens.delete(token);
    res.json({ ok: true });
  });

  app.get('/api/admin/verify', requireAdmin, (_req, res) => {
    res.json({ valid: true });
  });

  // Admin Orders Management
  app.get('/api/admin/orders', requireAdmin, (_req, res) => {
    const store = readStore();
    res.json({ orders: store.orders });
  });

  app.patch('/api/admin/orders/:id', requireAdmin, (req, res) => {
    const { status } = req.body || {};
    const allowed: OrderStatus[] = ['جديد', 'قيد التحضير', 'تم التوصيل', 'ملغي'];
    if (!allowed.includes(status)) {
      res.status(400).json({ error: 'حالة الطلب غير صالحة.' });
      return;
    }
    const store = readStore();
    const order = store.orders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'الطلب غير موجود.' });
      return;
    }
    order.status = status;
    writeStore(store);
    res.json({ order });
  });

  app.delete('/api/admin/orders/:id', requireAdmin, (req, res) => {
    const store = readStore();
    store.orders = store.orders.filter((o) => o.id !== req.params.id);
    writeStore(store);
    res.json({ ok: true });
  });

  // Admin Categories Management
  app.post('/api/admin/categories', requireAdmin, (req, res) => {
    const { name, subtitle, note, image } = req.body || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'اسم القسم مطلوب.' });
      return;
    }
    const store = readStore();
    const newCat: MenuCategory = {
      id: `cat-${Date.now()}`,
      name: name.trim(),
      subtitle: typeof subtitle === 'string' ? subtitle.trim() : '',
      note: typeof note === 'string' ? note.trim() : '',
      image: typeof image === 'string' && image.trim() ? image.trim() : INITIAL_CATEGORIES[0].image,
      order: store.categories.length + 1,
    };
    store.categories.push(newCat);
    writeStore(store);
    res.status(201).json({ category: newCat });
  });

  app.patch('/api/admin/categories/:id', requireAdmin, (req, res) => {
    const store = readStore();
    const idx = store.categories.findIndex((c) => c.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'القسم غير موجود.' });
      return;
    }
    const current = store.categories[idx];
    const { name, subtitle, note, image, order } = req.body || {};
    store.categories[idx] = {
      ...current,
      name: typeof name === 'string' && name.trim() ? name.trim() : current.name,
      subtitle: typeof subtitle === 'string' ? subtitle.trim() : current.subtitle,
      note: typeof note === 'string' ? note.trim() : current.note,
      image: typeof image === 'string' && image.trim() ? image.trim() : current.image,
      order: typeof order === 'number' ? order : current.order,
    };
    writeStore(store);
    res.json({ category: store.categories[idx] });
  });

  app.delete('/api/admin/categories/:id', requireAdmin, (req, res) => {
    const store = readStore();
    store.categories = store.categories.filter((c) => c.id !== req.params.id);
    store.items = store.items.filter((i) => i.categoryId !== req.params.id);
    writeStore(store);
    res.json({ ok: true });
  });

  // Admin Menu Items Management
  app.post('/api/admin/items', requireAdmin, (req, res) => {
    const { categoryId, name, description, price, variants, addons, image, isPopular, isAvailable } =
      req.body || {};
    if (!categoryId || !name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'بيانات الصنف غير مكتملة.' });
      return;
    }
    const parsedPrice = Number(price);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      res.status(400).json({ error: 'السعر غير صالح.' });
      return;
    }
    const store = readStore();
    const cat = store.categories.find((c) => c.id === categoryId);
    const newItem: MenuItem = {
      id: `item-${Date.now()}`,
      categoryId,
      name: name.trim(),
      description: typeof description === 'string' ? description.trim() : '',
      price: parsedPrice,
      variants: Array.isArray(variants) && variants.length > 0 ? variants : undefined,
      addons: Array.isArray(addons) && addons.length > 0 ? addons : undefined,
      image: typeof image === 'string' && image.trim() ? image.trim() : cat?.image || INITIAL_ITEMS[0].image,
      isPopular: Boolean(isPopular),
      isAvailable: isAvailable !== false,
    };
    store.items.unshift(newItem);
    writeStore(store);
    res.status(201).json({ item: newItem });
  });

  app.patch('/api/admin/items/:id', requireAdmin, (req, res) => {
    const store = readStore();
    const idx = store.items.findIndex((i) => i.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'الصنف غير موجود.' });
      return;
    }
    const current = store.items[idx];
    const body = req.body || {};
    store.items[idx] = {
      ...current,
      categoryId: typeof body.categoryId === 'string' ? body.categoryId : current.categoryId,
      name: typeof body.name === 'string' && body.name.trim() ? body.name.trim() : current.name,
      description: typeof body.description === 'string' ? body.description.trim() : current.description,
      price: body.price !== undefined ? Number(body.price) : current.price,
      variants: Array.isArray(body.variants)
        ? body.variants.length > 0
          ? body.variants
          : undefined
        : current.variants,
      image: typeof body.image === 'string' && body.image.trim() ? body.image.trim() : current.image,
      isPopular: body.isPopular !== undefined ? Boolean(body.isPopular) : current.isPopular,
      isAvailable: body.isAvailable !== undefined ? Boolean(body.isAvailable) : current.isAvailable,
    };
    writeStore(store);
    res.json({ item: store.items[idx] });
  });

  app.delete('/api/admin/items/:id', requireAdmin, (req, res) => {
    const store = readStore();
    store.items = store.items.filter((i) => i.id !== req.params.id);
    writeStore(store);
    res.json({ ok: true });
  });

  // Admin Offers Management
  app.post('/api/admin/offers', requireAdmin, (req, res) => {
    const { title, description, price, image, linkedItemId, isActive } = req.body || {};
    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ error: 'عنوان العرض مطلوب.' });
      return;
    }
    const store = readStore();
    const newOffer: OfferItem = {
      id: `offer-${Date.now()}`,
      title: title.trim(),
      description: typeof description === 'string' ? description.trim() : '',
      price: Number(price) || 0,
      image: typeof image === 'string' && image.trim() ? image.trim() : INITIAL_OFFERS[0].image,
      linkedItemId: typeof linkedItemId === 'string' ? linkedItemId : undefined,
      isActive: isActive !== false,
    };
    store.offers.unshift(newOffer);
    writeStore(store);
    res.status(201).json({ offer: newOffer });
  });

  app.patch('/api/admin/offers/:id', requireAdmin, (req, res) => {
    const store = readStore();
    const idx = store.offers.findIndex((o) => o.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'العرض غير موجود.' });
      return;
    }
    const current = store.offers[idx];
    const body = req.body || {};
    store.offers[idx] = {
      ...current,
      title: typeof body.title === 'string' && body.title.trim() ? body.title.trim() : current.title,
      description: typeof body.description === 'string' ? body.description.trim() : current.description,
      price: body.price !== undefined ? Number(body.price) : current.price,
      image: typeof body.image === 'string' && body.image.trim() ? body.image.trim() : current.image,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : current.isActive,
    };
    writeStore(store);
    res.json({ offer: store.offers[idx] });
  });

  app.delete('/api/admin/offers/:id', requireAdmin, (req, res) => {
    const store = readStore();
    store.offers = store.offers.filter((o) => o.id !== req.params.id);
    writeStore(store);
    res.json({ ok: true });
  });

  // Admin Restaurant Settings
  app.patch('/api/admin/restaurant', requireAdmin, (req, res) => {
    const store = readStore();
    const body = req.body || {};
    const updated: RestaurantInfo = {
      ...store.restaurant,
      name: typeof body.name === 'string' && body.name.trim() ? body.name.trim() : store.restaurant.name,
      slogan: typeof body.slogan === 'string' && body.slogan.trim() ? body.slogan.trim() : store.restaurant.slogan,
      subtitle: typeof body.subtitle === 'string' ? body.subtitle.trim() : store.restaurant.subtitle,
      address: typeof body.address === 'string' && body.address.trim() ? body.address.trim() : store.restaurant.address,
      phones: Array.isArray(body.phones) ? body.phones.filter(Boolean) : store.restaurant.phones,
      vodafoneCash: typeof body.vodafoneCash === 'string' ? body.vodafoneCash.trim() : store.restaurant.vodafoneCash,
      whatsappNumber:
        typeof body.whatsappNumber === 'string' ? body.whatsappNumber.trim() : store.restaurant.whatsappNumber,
      workingHours:
        typeof body.workingHours === 'string' ? body.workingHours.trim() : store.restaurant.workingHours,
    };
    store.restaurant = updated;
    writeStore(store);
    res.json({ restaurant: updated });
  });

  // Admin Image Upload (Base64 -> /uploads/...)
  app.post('/api/admin/upload', requireAdmin, (req, res) => {
    const { dataUrl, filename } = req.body || {};
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
      res.status(400).json({ error: 'صيغة الصورة غير مدعومة.' });
      return;
    }
    const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
    if (!match) {
      res.status(400).json({ error: 'يرجى رفع صورة بصيغة PNG أو JPG أو WEBP.' });
      return;
    }
    const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
    const safeName = (typeof filename === 'string' ? filename : 'dish')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 30);
    const outFile = `${safeName || 'dish'}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(match[2], 'base64');
    fs.writeFileSync(path.join(UPLOAD_DIR, outFile), buffer);
    res.json({ url: `/uploads/${outFile}` });
  });

  // Vite or Static Frontend
  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Al-Shikh Al-Sory server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
