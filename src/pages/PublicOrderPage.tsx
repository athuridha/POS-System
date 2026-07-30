import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Coffee,
  MagnifyingGlass,
  ShoppingCart,
  Plus,
  Minus,
  Trash,
  CheckCircle,
  ArrowRight,
  Sparkle,
  CircleNotch,
  CreditCard,
  Storefront,
  Info,
} from '@phosphor-icons/react';
import api from '../lib/api';
import { formatRupiah, shortId } from '../lib/utils';
import type { Category, Table } from '../types';

interface CartItem {
  productId: string;
  variantId?: string | null;
  namaProduk: string;
  namaVarian?: string;
  hargaSatuan: number;
  jumlah: number;
  catatan?: string;
}

export default function PublicOrderPage() {
  const { tableId } = useParams<{ tableId: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<any>(null);

  // Fetch Table details
  const { data: tables = [] } = useQuery<Table[]>({
    queryKey: ['tables-public'],
    queryFn: async () => {
      const { data } = await api.get('/tables');
      return data.tables;
    },
  });

  const currentTable = useMemo(() => {
    return tables.find((t) => t.id === tableId);
  }, [tables, tableId]);

  // Fetch menu
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories-public'],
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return data.categories;
    },
  });

  const uniqueCategories = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((cat) => {
      if (!map.has(cat.namaKategori)) {
        map.set(cat.namaKategori, cat);
      }
    });
    return Array.from(map.values());
  }, [categories]);

  const filteredProducts = useMemo(() => {
    let products = uniqueCategories.flatMap((cat) =>
      (cat.products || []).map((p) => ({ ...p, categoryName: cat.namaKategori }))
    );

    if (activeCategory) {
      products = products.filter((p) => p.categoryId === activeCategory);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      products = products.filter(
        (p) =>
          p.namaProduk.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q)
      );
    }

    return products;
  }, [uniqueCategories, activeCategory, searchQuery]);

  const addItem = (productId: string, variantId: string | null | undefined, namaProduk: string, namaVarian: string | undefined, hargaSatuan: number) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.productId === productId && (i.variantId || null) === (variantId || null));
      if (existing) {
        return prev.map((i) =>
          i.productId === productId && (i.variantId || null) === (variantId || null)
            ? { ...i, jumlah: i.jumlah + 1 }
            : i
        );
      }
      return [...prev, { productId, variantId, namaProduk, namaVarian, hargaSatuan, jumlah: 1 }];
    });
  };

  const updateQuantity = (productId: string, variantId: string | null | undefined, jumlah: number) => {
    if (jumlah <= 0) {
      setCartItems((prev) => prev.filter((i) => !(i.productId === productId && (i.variantId || null) === (variantId || null))));
      return;
    }
    setCartItems((prev) =>
      prev.map((i) => (i.productId === productId && (i.variantId || null) === (variantId || null) ? { ...i, jumlah } : i))
    );
  };

  const updateNote = (productId: string, variantId: string | null | undefined, catatan: string) => {
    setCartItems((prev) =>
      prev.map((i) => (i.productId === productId && (i.variantId || null) === (variantId || null) ? { ...i, catatan } : i))
    );
  };

  const total = cartItems.reduce((sum, i) => sum + i.hargaSatuan * i.jumlah, 0);
  const itemCount = cartItems.reduce((sum, i) => sum + i.jumlah, 0);

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;
    setSubmitting(true);

    try {
      const clientUuid = `qr-order-${Date.now()}`;
      const payload = {
        clientUuid,
        tipeOrder: 'dine_in',
        tableId: tableId || null,
        items: cartItems.map((i) => ({
          productId: i.productId,
          variantId: i.variantId || null,
          jumlah: i.jumlah,
          hargaSatuan: i.hargaSatuan,
          hargaTotal: i.hargaSatuan * i.jumlah,
          catatan: i.catatan || null,
        })),
        payments: [{ metode: 'cash', jumlahDibayar: total, kembalian: 0 }],
      };

      const { data } = await api.post('/transactions', payload);
      setPlacedOrder(data.transaction || { clientUuid, total });
      setCartItems([]);
      setShowCartDrawer(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal mengirim pesanan. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (placedOrder) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-b from-[#059669] via-[#10b981] to-[#ecfdf5] p-6 flex items-center justify-center font-sans">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl text-center space-y-4 border border-white/60 animate-fade-in">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={44} weight="fill" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Pesanan Berhasil Dikirim!</h2>
            <p className="text-xs text-zinc-500 mt-1">
              Pesanan untuk <span className="font-extrabold text-zinc-900">Meja {currentTable?.nomorMeja || tableId}</span> telah langsung masuk ke dapur barista kami.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-left space-y-1 text-xs">
            <div className="flex justify-between text-zinc-500">
              <span>No. Pesanan</span>
              <span className="font-mono font-bold text-zinc-900">#{shortId(placedOrder.clientUuid)}</span>
            </div>
            <div className="flex justify-between text-zinc-500">
              <span>Total Pesanan</span>
              <span className="font-mono font-bold text-emerald-600">{formatRupiah(total || placedOrder.total)}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800 space-y-1.5 text-xs text-left shadow-xs">
            <div className="flex items-center gap-2 font-bold text-zinc-900">
              <Storefront size={18} className="text-emerald-600" />
              <span>Petunjuk Pembayaran Kasir:</span>
            </div>
            <p className="text-zinc-600 leading-relaxed">
              Pesanan Anda telah langsung terkirim ke Kasir & Dapur Barista. <strong className="text-zinc-900">Silakan menuju ke Meja Kasir untuk melunasi pembayaran</strong> dengan menyebutkan <strong className="text-zinc-900">Meja {currentTable?.nomorMeja || tableId}</strong> atau <strong className="text-zinc-900">No. Pesanan #{shortId(placedOrder.clientUuid)}</strong>.
            </p>
          </div>

          <button
            onClick={() => setPlacedOrder(null)}
            className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md cursor-pointer transition-all active:scale-[0.98]"
          >
            Pesan Menu Tambahan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-zinc-100 flex flex-col font-sans pb-24">
      {/* Public Navbar */}
      <header className="h-16 bg-white border-b border-zinc-200 px-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
            <Coffee size={22} weight="bold" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-zinc-900">POS Cafe</h1>
            <p className="text-xs text-emerald-600 font-bold">
              Meja {currentTable?.nomorMeja || 'Digital Order'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
          <Sparkle size={14} weight="fill" />
          <span>Self-Order</span>
        </div>
      </header>

      {/* Main Container */}
      <div className="p-3 sm:p-4 space-y-4 max-w-3xl mx-auto w-full flex-1">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Cari menu favorit Anda..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-2xl border border-zinc-300 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-xs"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveCategory(null)}
            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              !activeCategory ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
            }`}
          >
            Semua Menu
          </button>
          {uniqueCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === cat.id ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
              }`}
            >
              {cat.namaKategori}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-36 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => addItem(p.id, null, p.namaProduk, undefined, p.hargaDasar)}
                className="p-3.5 rounded-2xl border border-zinc-200 bg-white shadow-xs hover:border-emerald-500 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <img
                    src={p.imageUrl || `https://placehold.co/200x200/f4f4f5/71717a?text=${encodeURIComponent(p.namaProduk)}`}
                    alt={p.namaProduk}
                    className="w-full h-24 rounded-xl object-cover border border-zinc-100 mb-2 bg-zinc-50"
                  />
                  <p className="text-xs font-bold text-zinc-900 truncate">{p.namaProduk}</p>
                  <p className="text-[11px] text-zinc-500">{p.categoryName}</p>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-100">
                  <span className="text-xs font-bold font-mono text-emerald-600">{formatRupiah(p.hargaDasar)}</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Plus size={14} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Bottom Cart Bar */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto animate-slide-up">
          <button
            onClick={() => setShowCartDrawer(true)}
            className="w-full h-14 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-between shadow-xl shadow-emerald-600/30 transition-transform active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-mono font-bold text-xs">
                {itemCount}
              </div>
              <span>Lihat Pesanan</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-base font-bold">
              <span>{formatRupiah(total)}</span>
              <ArrowRight size={18} />
            </div>
          </button>
        </div>
      )}

      {/* Cart Drawer Modal */}
      {showCartDrawer && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div onClick={() => setShowCartDrawer(false)} className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs" />
          <div className="relative bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col z-10 animate-slide-up overflow-hidden">
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <h3 className="text-base font-bold text-zinc-900">Pesanan Saya ({itemCount} item)</h3>
              <button onClick={() => setShowCartDrawer(false)} className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-200">
                <Trash size={18} />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              {cartItems.map((item) => (
                <div key={item.productId} className="p-3 rounded-xl border border-zinc-200 bg-zinc-50 space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-zinc-900">{item.namaProduk}</p>
                      <p className="text-xs font-mono font-bold text-emerald-600">{formatRupiah(item.hargaSatuan * item.jumlah)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.variantId, item.jumlah - 1)}
                        className="w-7 h-7 rounded-lg border border-zinc-300 bg-white flex items-center justify-center text-xs font-bold"
                      >
                        -
                      </button>
                      <span className="w-5 text-center text-xs font-mono font-bold">{item.jumlah}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.variantId, item.jumlah + 1)}
                        className="w-7 h-7 rounded-lg border border-zinc-300 bg-white flex items-center justify-center text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={item.catatan || ''}
                    onChange={(e) => updateNote(item.productId, item.variantId, e.target.value)}
                    placeholder="+ Catatan (Less sugar, extra ice)..."
                    className="w-full text-xs bg-white border border-zinc-200 rounded-lg px-2.5 py-1 text-zinc-800 placeholder:text-zinc-400"
                  />
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-zinc-200 bg-white space-y-3">
              <div className="flex justify-between text-base font-bold text-zinc-900">
                <span>Total Pesanan</span>
                <span className="font-mono text-emerald-600">{formatRupiah(total)}</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-600 text-xs">
                <Info size={16} className="text-emerald-600 shrink-0" />
                <span>Pembayaran dilakukan langsung di meja kasir setelah pesanan terkirim.</span>
              </div>
              <button
                onClick={handlePlaceOrder}
                disabled={submitting}
                className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-[0.98]"
              >
                {submitting ? <CircleNotch size={20} className="animate-spin" /> : <span>Kirim Pesanan Ke Dapur</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
