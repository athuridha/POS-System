import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  PencilSimple,
  Trash,
  CircleNotch,
  ForkKnife,
  MagnifyingGlass,
  X,
  Check,
} from '@phosphor-icons/react';
import api from '../lib/api';
import { formatRupiah } from '../lib/utils';
import type { Category, Product } from '../types';

export default function MenuManagementPage() {
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories-manage'],
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return data.categories;
    },
  });

  const displayedCategories = selectedCategoryFilter
    ? categories.filter((c) => c.id === selectedCategoryFilter)
    : categories;

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">Manajemen Menu</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Kelola kategori, produk, dan varian menu cafe</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setEditingCategory(null); setShowCategoryForm(true); }}
            className="h-10 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm font-bold text-zinc-700 hover:bg-zinc-100 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Plus size={16} />
            <span>Kategori</span>
          </button>
          <button
            onClick={() => { setEditingProduct(null); setShowProductForm(true); }}
            className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
          >
            <Plus size={16} />
            <span>Produk</span>
          </button>
        </div>
      </div>

      {/* Filter Bar: Category Select Dropdown + Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-6">
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 flex-1 max-w-lg">
          {/* Category Dropdown */}
          <select
            value={selectedCategoryFilter || ''}
            onChange={(e) => setSelectedCategoryFilter(e.target.value || null)}
            className="h-10 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all cursor-pointer shrink-0"
          >
            <option value="">Semua Kategori ({categories.reduce((acc, c) => acc + (c.products?.length || 0), 0)})</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.namaKategori} ({cat.products?.length || 0})
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-zinc-300 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
      ) : displayedCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-60">
          <ForkKnife size={48} className="text-zinc-400 mb-3" />
          <p className="text-sm font-semibold text-zinc-600">Belum ada produk di kategori ini</p>
        </div>
      ) : (
        <div className="space-y-6">
          {displayedCategories.map((cat) => {
            const matchingProducts = (cat.products || []).filter(
              (p) => !search || p.namaProduk.toLowerCase().includes(search.toLowerCase())
            );

            if (search && matchingProducts.length === 0) return null;

            return (
              <div key={cat.id} className="animate-fade-in">
                {/* Category header */}
                <div className="flex items-center justify-between mb-3 border-b border-zinc-200 pb-2">
                  <h2 className="text-base font-bold text-zinc-900">{cat.namaKategori}</h2>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditingCategory(cat); setShowCategoryForm(true); }}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                    >
                      <PencilSimple size={16} />
                    </button>
                    <DeleteCategoryButton categoryId={cat.id} />
                  </div>
                </div>

                {/* Products */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {matchingProducts.map((product) => (
                    <div
                      key={product.id}
                      className="p-4 rounded-2xl border border-zinc-200 bg-white hover:border-emerald-500/40 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={product.imageUrl || `https://placehold.co/200x200/f4f4f5/71717a?text=${encodeURIComponent(product.namaProduk)}`}
                          alt={product.namaProduk}
                          className="w-12 h-12 rounded-xl object-cover border border-zinc-200 shrink-0 bg-zinc-50"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-zinc-900 truncate">{product.namaProduk}</p>
                          {product.deskripsi && (
                            <p className="text-xs text-zinc-500 mt-0.5 truncate">{product.deskripsi}</p>
                          )}
                          <p className="text-sm font-mono font-bold text-emerald-600 mt-2">{formatRupiah(product.hargaDasar)}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => { setEditingProduct(product); setShowProductForm(true); }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                          >
                            <PencilSimple size={16} />
                          </button>
                          <DeleteProductButton productId={product.id} />
                        </div>
                      </div>

                      {/* Variants */}
                      {product.variants && product.variants.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-zinc-100 space-y-1">
                          {product.variants.map((v) => (
                            <div key={v.id} className="flex justify-between text-xs text-zinc-600 font-medium">
                              <span>{v.namaVarian}</span>
                              <span className="font-mono font-semibold text-zinc-900">
                                {v.hargaTambahan > 0 ? `+${formatRupiah(v.hargaTambahan)}` : '-'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Form Modal */}
      {showProductForm && (
        <ProductFormModal
          product={editingProduct}
          categories={categories}
          onClose={() => setShowProductForm(false)}
        />
      )}

      {/* Category Form Modal */}
      {showCategoryForm && (
        <CategoryFormModal
          category={editingCategory}
          onClose={() => setShowCategoryForm(false)}
        />
      )}
    </div>
  );
}

function DeleteProductButton({ productId }: { productId: string }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => api.delete(`/products/${productId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories-manage'] }),
  });

  return (
    <button
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
    >
      {mutation.isPending ? <CircleNotch size={16} className="animate-spin" /> : <Trash size={16} />}
    </button>
  );
}

function DeleteCategoryButton({ categoryId }: { categoryId: string }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => api.delete(`/categories/${categoryId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories-manage'] }),
  });

  return (
    <button
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
    >
      {mutation.isPending ? <CircleNotch size={16} className="animate-spin" /> : <Trash size={16} />}
    </button>
  );
}

function ProductFormModal({
  product,
  categories,
  onClose,
}: {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
}) {
  const [namaProduk, setNamaProduk] = useState(product?.namaProduk || '');
  const [hargaDasar, setHargaDasar] = useState(product?.hargaDasar?.toString() || '');
  const [categoryId, setCategoryId] = useState(product?.categoryId || categories[0]?.id || '');
  const [deskripsi, setDeskripsi] = useState(product?.deskripsi || '');
  const [variants, setVariants] = useState<{ namaVarian: string; hargaTambahan: string }[]>(
    product?.variants?.map((v) => ({ namaVarian: v.namaVarian, hargaTambahan: v.hargaTambahan.toString() })) || []
  );
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        namaProduk,
        hargaDasar: parseInt(hargaDasar),
        categoryId,
        deskripsi: deskripsi || null,
        variants: variants.map((v) => ({
          namaVarian: v.namaVarian,
          hargaTambahan: parseInt(v.hargaTambahan) || 0,
        })),
      };
      if (product) {
        await api.put(`/products/${product.id}`, payload);
      } else {
        await api.post('/products', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-manage'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Gagal menyimpan produk');
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl animate-slide-up border border-zinc-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200">
          <h3 className="text-base font-bold text-zinc-900">{product ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="p-4 space-y-4">
          {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm font-medium">{error}</div>}

          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-1">Nama Produk</label>
            <input
              type="text"
              value={namaProduk}
              onChange={(e) => setNamaProduk(e.target.value)}
              required
              className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">Harga Dasar (Rp)</label>
              <input
                type="number"
                value={hargaDasar}
                onChange={(e) => setHargaDasar(e.target.value)}
                required
                min={0}
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm font-mono font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">Kategori</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.namaKategori}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-1">Deskripsi</label>
            <input
              type="text"
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Contoh: Hot / Iced Espresso + Milk"
              className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Variants */}
          {!product && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-zinc-700">Varian Produk</label>
                <button
                  type="button"
                  onClick={() => setVariants([...variants, { namaVarian: '', hargaTambahan: '0' }])}
                  className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                >
                  + Tambah Varian
                </button>
              </div>

              {variants.map((v, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={v.namaVarian}
                    onChange={(e) => { const nv = [...variants]; nv[i].namaVarian = e.target.value; setVariants(nv); }}
                    placeholder="Nama varian (cth: Large)"
                    className="flex-1 h-9 px-3 rounded-lg border border-zinc-300 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                  />
                  <input
                    type="number"
                    value={v.hargaTambahan}
                    onChange={(e) => { const nv = [...variants]; nv[i].hargaTambahan = e.target.value; setVariants(nv); }}
                    placeholder="+0"
                    className="w-28 h-9 px-3 rounded-lg border border-zinc-300 text-xs font-mono font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setVariants(variants.filter((_, j) => j !== i))}
                    className="p-1.5 text-zinc-400 hover:text-red-600 cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer shadow-md shadow-emerald-600/20"
          >
            {mutation.isPending ? <CircleNotch size={20} className="animate-spin" /> : <><Check size={18} /> <span>Simpan Produk</span></>}
          </button>
        </form>
      </div>
    </div>
  );
}

function CategoryFormModal({ category, onClose }: { category: Category | null; onClose: () => void }) {
  const [namaKategori, setNamaKategori] = useState(category?.namaKategori || '');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (category) {
        await api.put(`/categories/${category.id}`, { namaKategori });
      } else {
        await api.post('/categories', { namaKategori });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-manage'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl animate-slide-up border border-zinc-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200">
          <h3 className="text-base font-bold text-zinc-900">{category ? 'Edit Kategori' : 'Tambah Kategori Baru'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-1">Nama Kategori</label>
            <input
              type="text"
              value={namaKategori}
              onChange={(e) => setNamaKategori(e.target.value)}
              required
              autoFocus
              className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer shadow-md shadow-emerald-600/20"
          >
            {mutation.isPending ? <CircleNotch size={20} className="animate-spin" /> : <><Check size={18} /> <span>Simpan Kategori</span></>}
          </button>
        </form>
      </div>
    </div>
  );
}
