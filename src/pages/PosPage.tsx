'use client';
import { useState, useMemo } from 'react';
import { MagnifyingGlass, Plus, Minus, Trash, ShoppingCart, ArrowRight, Coffee, X, Tag, Check, WarningCircle, Receipt, Clock, Sparkle } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { getCachedMenu, cacheMenu } from '../lib/db';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import { formatRupiah, shortId } from '../lib/utils';
import type { Category, Shift, Discount } from '../types';
import PaymentModal from '../components/pos/PaymentModal';
import ShiftGuard from '../components/pos/ShiftGuard';

export default function PosPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [showUnpaidModal, setShowUnpaidModal] = useState(false);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);

  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    updateItemNote,
    tipeOrder,
    setTipeOrder,
    tableId,
    setTableId,
    getSubtotal,
    getTotal,
    discountId,
    discountAmount,
    setDiscount,
    setUnpaidTxId,
    clearCart,
  } = useCartStore();

  // Fetch categories with products
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/categories');
        await cacheMenu(data.categories);
        return data.categories;
      } catch {
        const cached = await getCachedMenu();
        return cached;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch tables for dine-in
  const { data: tables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      const { data } = await api.get('/tables');
      return data.tables;
    },
  });

  // Fetch discounts
  const { data: discounts = [] } = useQuery<Discount[]>({
    queryKey: ['discounts'],
    queryFn: async () => {
      const { data } = await api.get('/discounts');
      return data.discounts;
    },
  });

  // Fetch unpaid QR orders
  const { data: unpaidData } = useQuery({
    queryKey: ['unpaid-transactions'],
    queryFn: async () => {
      const { data } = await api.get('/transactions?status=unpaid');
      return data;
    },
    refetchInterval: 4000,
  });

  const unpaidTransactions = unpaidData?.transactions || [];

  const handleProcessUnpaidOrder = (tx: any) => {
    clearCart();
    (tx.items || []).forEach((item: any) => {
      addItem({
        productId: item.productId,
        variantId: item.variantId || null,
        namaProduk: item.product?.namaProduk || 'Produk',
        namaVarian: item.variant?.namaVarian,
        hargaSatuan: item.hargaSatuan,
        catatan: item.catatan,
        jumlah: item.jumlah,
      });
    });
    setTipeOrder(tx.tipeOrder || 'dine_in');
    setTableId(tx.tableId || null);
    setUnpaidTxId(tx.id);
    setShowUnpaidModal(false);
    setShowPayment(true);
  };

  // Deduplicate categories by name
  const uniqueCategories = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((cat) => {
      if (!map.has(cat.namaKategori)) {
        map.set(cat.namaKategori, cat);
      }
    });
    return Array.from(map.values());
  }, [categories]);

  // Selected discount object
  const selectedDiscount = useMemo(() => {
    return discounts.find((d) => d.id === discountId);
  }, [discounts, discountId]);

  // Filter products
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

  const subtotal = getSubtotal();
  const total = getTotal();
  const itemCount = items.reduce((sum, i) => sum + i.jumlah, 0);

  if (!activeShift) {
    return <ShiftGuard onShiftActive={setActiveShift} />;
  }

  const renderCartContent = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Order Type + Table */}
      <div className="p-4 border-b border-zinc-200 space-y-3">
        {/* Order Type Toggle */}
        <div className="flex rounded-xl bg-zinc-100 p-1 border border-zinc-200">
          <button
            onClick={() => setTipeOrder('dine_in')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              tipeOrder === 'dine_in'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Dine In
          </button>
          <button
            onClick={() => { setTipeOrder('take_away'); setTableId(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              tipeOrder === 'take_away'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Take Away
          </button>
        </div>

        {/* Table Selection */}
        {tipeOrder === 'dine_in' && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-600">Pilih Meja <span className="text-zinc-400 font-normal">(Opsional)</span></label>
              {tableId && (
                <button
                  onClick={() => setTableId(null)}
                  className="text-[11px] text-zinc-500 hover:text-zinc-800 underline cursor-pointer"
                >
                  Batal Pilih
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setTableId(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                  !tableId
                    ? 'bg-zinc-800 text-white border-zinc-800 shadow-xs'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border-zinc-200'
                }`}
              >
                Tanpa Meja
              </button>
              {tables.map((t: any) => (
                <button
                  key={t.id}
                  onClick={() => setTableId(t.id)}
                  disabled={t.status === 'terisi' && tableId !== t.id}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    tableId === t.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : t.status === 'terisi'
                      ? 'bg-red-50 text-red-500 border border-red-200'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
                  }`}
                >
                  {t.nomorMeja}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-50 py-12">
            <ShoppingCart size={40} className="text-zinc-400 mb-2" />
            <p className="text-sm font-semibold text-zinc-600">Keranjang kosong</p>
            <p className="text-xs text-zinc-400">Pilih produk dari menu</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={`${item.productId}-${item.variantId || ''}`}
              className="p-3 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-2 animate-fade-in"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs font-bold text-zinc-900 truncate">{item.namaProduk}</p>
                  {item.namaVarian && (
                    <p className="text-[11px] text-zinc-500 truncate">{item.namaVarian}</p>
                  )}
                  <p className="text-xs font-mono font-bold text-emerald-600 mt-0.5">
                    {formatRupiah(item.hargaSatuan * item.jumlah)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => updateQuantity(item.productId, item.variantId, item.jumlah - 1)}
                    className="w-7 h-7 rounded-lg border border-zinc-300 bg-white flex items-center justify-center text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-6 text-center text-xs font-mono font-bold text-zinc-900">{item.jumlah}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.variantId, item.jumlah + 1)}
                    className="w-7 h-7 rounded-lg border border-zinc-300 bg-white flex items-center justify-center text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    onClick={() => removeItem(item.productId, item.variantId)}
                    className="w-7 h-7 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer ml-1"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </div>

              {/* Custom Note Input */}
              <div className="pt-1.5 border-t border-zinc-200/80">
                <input
                  type="text"
                  value={item.catatan || ''}
                  onChange={(e) => updateItemNote(item.productId, item.variantId, e.target.value)}
                  placeholder="+ Catatan pesanan (cth: Less sugar, extra ice)..."
                  className="w-full text-[11px] bg-white border border-zinc-300/80 rounded-lg px-2.5 py-1 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-sans"
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary & Pay Button */}
      <div className="p-4 border-t border-zinc-200 bg-white space-y-3 shrink-0">
        {/* Voucher Picker Row */}
        <div className="pt-1">
          {discountId && selectedDiscount ? (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 animate-fade-in">
              <div className="flex items-center gap-2">
                <Tag size={16} weight="fill" className="text-emerald-600" />
                <div>
                  <p className="text-xs font-bold text-emerald-800">{selectedDiscount.kodeVoucher}</p>
                  <p className="text-[10px] text-emerald-600 font-mono font-semibold">Potongan -{formatRupiah(discountAmount)}</p>
                </div>
              </div>
              <button
                onClick={() => setDiscount(null, 0)}
                className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                title="Hapus Voucher"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowVoucherModal(true)}
              disabled={items.length === 0}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-dashed border-zinc-300 hover:border-emerald-500 hover:bg-emerald-50/50 text-zinc-700 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-emerald-600" />
                <span>Gunakan Voucher / Diskon</span>
              </div>
              <span className="text-[11px] text-emerald-600 font-bold">Pilih &gt;</span>
            </button>
          )}
        </div>

        <div className="space-y-1.5 text-xs pt-1 border-t border-zinc-100">
          <div className="flex justify-between text-zinc-500">
            <span>Subtotal ({itemCount} item)</span>
            <span className="font-mono font-semibold text-zinc-900">{formatRupiah(subtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Diskon</span>
              <span className="font-mono">-{formatRupiah(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-zinc-900 pt-1.5 border-t border-zinc-200">
            <span>Total</span>
            <span className="font-mono text-emerald-600">{formatRupiah(total)}</span>
          </div>
        </div>

        <button
          onClick={() => {
            setShowMobileCart(false);
            setShowPayment(true);
          }}
          disabled={items.length === 0}
          className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-emerald-600/20"
        >
          <span>Bayar</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex bg-zinc-100 overflow-hidden relative">
      {/* ───────────── LEFT: Product Grid ───────────── */}
      <div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0">
        {/* Search + Category Filter */}
        <div className="p-3 sm:p-4 bg-white border-b border-zinc-200 space-y-3">
          {/* Search Bar + Unpaid QR Orders Button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Cari menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-zinc-300 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>

            <button
              onClick={() => setShowUnpaidModal(true)}
              className={`h-10 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                unpaidTransactions.length > 0
                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200'
              }`}
            >
              <Receipt size={18} weight="bold" />
              <span className="hidden sm:inline">Pesanan Belum Dibayar</span>
              {unpaidTransactions.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-white text-amber-700 text-[10px] font-extrabold animate-pulse">
                  {unpaidTransactions.length}
                </span>
              )}
            </button>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveCategory(null)}
              className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                !activeCategory
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              Semua
            </button>
            {uniqueCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                {cat.namaKategori}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton h-32 rounded-2xl" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-60 py-20">
              <Coffee size={48} className="text-zinc-400 mb-2" />
              <p className="text-sm font-semibold text-zinc-600">Tidak ada produk ditemukan</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={idx}
                  onAdd={(variantId, variantName, price) => {
                    addItem({
                      productId: product.id,
                      variantId,
                      namaProduk: product.namaProduk,
                      namaVarian: variantName,
                      hargaSatuan: price,
                    });
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ───────────── RIGHT: Order Panel (Desktop Side-by-Side) ───────────── */}
      <div className="hidden lg:flex w-[340px] xl:w-[380px] border-l border-zinc-200 bg-white flex-col shrink-0 shadow-lg">
        {renderCartContent()}
      </div>

      {/* ───────────── MOBILE: Floating Bottom Cart Bar (Mobile Only) ───────────── */}
      {items.length > 0 && (
        <div className="lg:hidden fixed bottom-3 left-3 right-3 z-30 animate-slide-up">
          <button
            onClick={() => setShowMobileCart(true)}
            className="w-full h-13 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-between shadow-xl shadow-emerald-600/30 transition-transform active:scale-[0.98] cursor-pointer border border-emerald-500/50"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-800 flex items-center justify-center font-mono font-bold text-xs">
                {itemCount}
              </div>
              <span className="font-bold">Lihat Keranjang</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-sm font-bold">
              <span>{formatRupiah(total)}</span>
              <ArrowRight size={18} />
            </div>
          </button>
        </div>
      )}

      {/* ───────────── MOBILE: Cart Drawer Modal ───────────── */}
      {showMobileCart && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
          <div
            onClick={() => setShowMobileCart(false)}
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity animate-fade-in"
          />
          <div className="relative bg-white rounded-t-3xl shadow-2xl h-[85vh] flex flex-col z-10 animate-slide-up overflow-hidden">
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-2">
                <ShoppingCart size={20} className="text-emerald-600 font-bold" />
                <h3 className="text-base font-bold text-zinc-900">Keranjang Belanja ({itemCount})</h3>
              </div>
              <button
                onClick={() => setShowMobileCart(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {renderCartContent()}
            </div>
          </div>
        </div>
      )}

      {/* Voucher Selection Modal */}
      {showVoucherModal && (
        <VoucherModal
          discounts={discounts}
          subtotal={subtotal}
          selectedDiscountId={discountId}
          onSelect={(discount) => {
            if (!discount) {
              setDiscount(null, 0);
            } else {
              const amount =
                discount.tipe === 'persentase'
                  ? Math.round((subtotal * discount.nilai) / 100)
                  : discount.nilai;
              setDiscount(discount.id, amount);
            }
            setShowVoucherModal(false);
          }}
          onClose={() => setShowVoucherModal(false)}
        />
      )}

      {/* Unpaid QR Orders Modal */}
      {showUnpaidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div onClick={() => setShowUnpaidModal(false)} className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs" />
          <div className="relative bg-white rounded-3xl p-6 shadow-2xl max-w-lg w-full z-10 space-y-4 max-h-[90vh] flex flex-col animate-scale-up">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Receipt size={22} weight="bold" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">Pesanan Belum Dibayar</h3>
                  <p className="text-xs text-zinc-500">Self-Order QR dari Meja</p>
                </div>
              </div>
              <button onClick={() => setShowUnpaidModal(false)} className="p-1.5 rounded-xl text-zinc-400 hover:bg-zinc-100 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {unpaidTransactions.length === 0 ? (
                <div className="text-center py-12 opacity-50 space-y-1">
                  <Receipt size={40} className="mx-auto text-zinc-400 mb-1" />
                  <p className="text-xs font-semibold text-zinc-600">Tidak ada pesanan belum dibayar</p>
                </div>
              ) : (
                unpaidTransactions.map((tx: any) => (
                  <div key={tx.id} className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold mb-1">
                          {tx.table?.nomorMeja ? `Meja ${tx.table.nomorMeja}` : 'Dine In'}
                        </span>
                        <p className="text-xs font-mono font-bold text-zinc-500">#{shortId(tx.clientUuid)}</p>
                      </div>
                      <span className="text-sm font-mono font-extrabold text-emerald-600">{formatRupiah(tx.total)}</span>
                    </div>

                    <div className="border-t border-zinc-200/80 pt-2 space-y-1">
                      {tx.items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-xs text-zinc-700">
                          <span>{item.jumlah}x {item.product?.namaProduk} {item.variant?.namaVarian ? `(${item.variant.namaVarian})` : ''}</span>
                          <span className="font-mono text-zinc-500">{formatRupiah(item.hargaTotal)}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleProcessUnpaidOrder(tx)}
                      className="w-full h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <Receipt size={16} />
                      <span>Proses Pembayaran di Kasir</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          activeShift={activeShift}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  );
}

function ProductCard({
  product,
  index,
  onAdd,
}: {
  product: any;
  index: number;
  onAdd: (variantId: string | null, variantName: string | undefined, price: number) => void;
}) {
  const [showVariants, setShowVariants] = useState(false);
  const hasVariants = product.variants && product.variants.length > 0;

  const handleClick = () => {
    if (hasVariants) {
      setShowVariants(!showVariants);
    } else {
      onAdd(null, undefined, product.hargaDasar);
    }
  };

  return (
    <div
      className="relative rounded-2xl border border-zinc-200 bg-white overflow-hidden hover:border-emerald-500/50 hover:shadow-md transition-all group cursor-pointer"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="p-3 sm:p-4" onClick={handleClick}>
        <div className="flex items-start gap-2.5 sm:gap-3 mb-2">
          <img
            src={product.imageUrl || `https://placehold.co/200x200/f4f4f5/71717a?text=${encodeURIComponent(product.namaProduk)}`}
            alt={product.namaProduk}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border border-zinc-200 shrink-0 bg-zinc-50"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-bold text-zinc-900 truncate">{product.namaProduk}</p>
            <p className="text-[11px] sm:text-xs text-zinc-500 mt-0.5 truncate">{product.categoryName}</p>
          </div>
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Plus size={14} className="text-emerald-600 font-bold" />
          </div>
        </div>
        <p className="text-xs sm:text-sm font-bold font-mono text-emerald-600 mt-2">
          {formatRupiah(product.hargaDasar)}
        </p>
      </div>

      {showVariants && hasVariants && (
        <div className="border-t border-zinc-200 bg-zinc-50 p-2 space-y-1 animate-slide-up">
          {product.variants.map((v: any) => (
            <button
              key={v.id}
              onClick={() => {
                onAdd(v.id, v.namaVarian, product.hargaDasar + v.hargaTambahan);
                setShowVariants(false);
              }}
              className="w-full flex justify-between items-center p-2 rounded-lg text-xs font-semibold text-zinc-800 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <span>{v.namaVarian}</span>
              <span className="font-mono text-emerald-700">
                {formatRupiah(product.hargaDasar + v.hargaTambahan)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function VoucherModal({
  discounts,
  subtotal,
  selectedDiscountId,
  onSelect,
  onClose,
}: {
  discounts: Discount[];
  subtotal: number;
  selectedDiscountId: string | null;
  onSelect: (discount: Discount | null) => void;
  onClose: () => void;
}) {
  const activeDiscounts = useMemo(() => {
    return discounts.filter((d) => d.isActive);
  }, [discounts]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl animate-slide-up border border-zinc-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 bg-zinc-50">
          <div className="flex items-center gap-2">
            <Tag size={20} className="text-emerald-600" />
            <h3 className="text-base font-bold text-zinc-900">Pilih Voucher / Diskon</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Voucher List */}
        <div className="p-4 space-y-2.5 max-h-[60vh] overflow-y-auto">
          {activeDiscounts.length === 0 ? (
            <div className="text-center py-10 opacity-60 space-y-1">
              <Tag size={36} className="text-zinc-400 mx-auto" />
              <p className="text-sm font-semibold text-zinc-600">Belum ada voucher aktif</p>
            </div>
          ) : (
            activeDiscounts.map((voucher) => {
              const isEligible = subtotal >= voucher.minBelanja;
              const isSelected = selectedDiscountId === voucher.id;

              const estimatedAmount =
                voucher.tipe === 'persentase'
                  ? Math.round((subtotal * voucher.nilai) / 100)
                  : voucher.nilai;

              return (
                <div
                  key={voucher.id}
                  onClick={() => {
                    if (isEligible) {
                      onSelect(isSelected ? null : voucher);
                    }
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/70 shadow-sm'
                      : !isEligible
                      ? 'border-zinc-200 bg-zinc-50 opacity-60 cursor-not-allowed'
                      : 'border-zinc-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-zinc-900 uppercase tracking-wide">
                          {voucher.kodeVoucher}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold">
                            Terpasang
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                        {voucher.tipe === 'persentase'
                          ? `Diskon ${voucher.nilai}% (Hemat ${formatRupiah(estimatedAmount)})`
                          : `Potongan ${formatRupiah(voucher.nilai)}`}
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-1">
                        Min. belanja {formatRupiah(voucher.minBelanja)}
                      </p>
                    </div>

                    <div className="shrink-0 pt-0.5">
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                          <Check size={14} weight="bold" />
                        </div>
                      ) : !isEligible ? (
                        <WarningCircle size={18} className="text-zinc-400" />
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-zinc-300 bg-white flex items-center justify-center text-zinc-400">
                          <Plus size={12} />
                        </div>
                      )}
                    </div>
                  </div>

                  {!isEligible && (
                    <div className="mt-2 text-[10px] font-semibold text-amber-700 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                      Tambah belanja {formatRupiah(voucher.minBelanja - subtotal)} lagi untuk pakai voucher ini
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex gap-2">
          {selectedDiscountId && (
            <button
              onClick={() => onSelect(null)}
              className="flex-1 h-10 rounded-xl border border-red-200 bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors cursor-pointer"
            >
              Hapus Voucher
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-900 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
