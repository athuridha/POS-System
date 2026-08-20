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
  Image as ImageIcon,
  Sparkle,
} from '@phosphor-icons/react';
import api from '../lib/api';
import { formatRupiah, getErrorMessage } from '../lib/utils';
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
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">Manajemen Menu & Kategori</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">Kelola kategori, produk, varian harga, dan foto menu cafe</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setEditingCategory(null); setShowCategoryForm(true); }}
            className="h-10 px-3.5 rounded-xl border border-zinc-300 bg-white text-xs sm:text-sm font-bold text-zinc-700 hover:bg-zinc-100 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Plus size={16} weight="bold" />
            <span>+ Kategori</span>
          </button>
          <button
            onClick={() => { setEditingProduct(null); setShowProductForm(true); }}
            className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
          >
            <Plus size={16} weight="bold" />
            <span>+ Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Filter Bar: Category Select Dropdown + Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 flex-1 max-w-xl">
          {/* Category Dropdown */}
          <select
            value={selectedCategoryFilter || ''}
            onChange={(e) => setSelectedCategoryFilter(e.target.value || null)}
            className="h-10 px-3.5 rounded-xl border border-zinc-300 bg-white text-xs sm:text-sm font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all cursor-pointer shrink-0"
          >
            <option value="">Semua Kategori ({categories.reduce((acc, c) => acc + (c.products?.length || 0), 0)} menu)</option>
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
              placeholder="Cari produk atau varian..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-zinc-300 bg-white text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-40 rounded-2xl" />
          ))}
        </div>
      ) : displayedCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-zinc-200 opacity-70 text-center p-6">
          <ForkKnife size={48} className="text-zinc-400 mb-3" />
          <p className="text-sm font-bold text-zinc-700">Belum ada produk di kategori ini</p>
          <p className="text-xs text-zinc-500 mt-1">Klik tombol "+ Tambah Produk" di atas untuk menambahkan menu baru.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {displayedCategories.map((cat) => {
            const matchingProducts = (cat.products || []).filter(
              (p) => !search || p.namaProduk.toLowerCase().includes(search.toLowerCase()) || p.deskripsi?.toLowerCase().includes(search.toLowerCase())
            );

            if (search && matchingProducts.length === 0) return null;

            return (
              <div key={cat.id} className="animate-fade-in space-y-3">
                {/* Category header */}
                <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-zinc-900">{cat.namaKategori}</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-semibold">
                      {matchingProducts.length} produk
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditingCategory(cat); setShowCategoryForm(true); }}
                      title="Edit Kategori"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                    >
                      <PencilSimple size={16} />
                    </button>
                    <DeleteCategoryButton categoryId={cat.id} categoryName={cat.namaKategori} />
                  </div>
                </div>

                {/* Products Grid */}
                {matchingProducts.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic py-2">Tidak ada produk dalam kategori ini.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                    {matchingProducts.map((product) => (
                      <div
                        key={product.id}
                        className="p-4 rounded-2xl border border-zinc-200 bg-white hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start gap-3">
                            <img
                              src={product.imageUrl || `https://placehold.co/200x200/f4f4f5/71717a?text=${encodeURIComponent(product.namaProduk)}`}
                              alt={product.namaProduk}
                              className="w-14 h-14 rounded-xl object-cover border border-zinc-200 shrink-0 bg-zinc-50"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-zinc-900 truncate">{product.namaProduk}</p>
                              {product.deskripsi && (
                                <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{product.deskripsi}</p>
                              )}
                              <p className="text-sm font-mono font-bold text-emerald-600 mt-1.5">
                                {formatRupiah(product.hargaDasar)}
                              </p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <button
                                onClick={() => { setEditingProduct(product); setShowProductForm(true); }}
                                title="Edit Produk"
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                              >
                                <PencilSimple size={16} />
                              </button>
                              <DeleteProductButton productId={product.id} productName={product.namaProduk} />
                            </div>
                          </div>

                          {/* Variants list */}
                          {product.variants && product.variants.length > 0 && (
                            <div className="mt-3 pt-2.5 border-t border-zinc-100 space-y-1">
                              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Varian:</p>
                              {product.variants.map((v) => (
                                <div key={v.id} className="flex justify-between text-xs text-zinc-600 font-medium">
                                  <span>{v.namaVarian}</span>
                                  <span className="font-mono font-semibold text-zinc-900">
                                    {v.hargaTambahan > 0 ? `+${formatRupiah(v.hargaTambahan)}` : 'Sama'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

function DeleteProductButton({ productId, productName }: { productId: string; productName: string }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => api.delete(`/products/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-manage'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories-public'] });
    },
  });

  const handleDelete = () => {
    if (window.confirm(`Hapus produk "${productName}"?`)) {
      mutation.mutate();
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={mutation.isPending}
      title="Hapus Produk"
      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
    >
      {mutation.isPending ? <CircleNotch size={16} className="animate-spin" /> : <Trash size={16} />}
    </button>
  );
}

function DeleteCategoryButton({ categoryId, categoryName }: { categoryId: string; categoryName: string }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => api.delete(`/categories/${categoryId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-manage'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories-public'] });
    },
  });

  const handleDelete = () => {
    if (window.confirm(`Hapus kategori "${categoryName}" beserta semua produk di dalamnya?`)) {
      mutation.mutate();
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={mutation.isPending}
      title="Hapus Kategori"
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
  const [imageUrl, setImageUrl] = useState(product?.imageUrl || '');
  const [variants, setVariants] = useState<{ namaVarian: string; hargaTambahan: string }[]>(
    product?.variants?.map((v) => ({ namaVarian: v.namaVarian, hargaTambahan: v.hargaTambahan.toString() })) || []
  );
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        namaProduk,
        hargaDasar: parseInt(hargaDasar, 10),
        categoryId,
        deskripsi: deskripsi || null,
        imageUrl: imageUrl || null,
        variants: variants.map((v) => ({
          namaVarian: v.namaVarian,
          hargaTambahan: parseInt(v.hargaTambahan, 10) || 0,
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
      queryClient.invalidateQueries({ queryKey: ['categories-public'] });
      onClose();
    },
    onError: (err: any) => {
      setError(getErrorMessage(err, 'Gagal menyimpan produk'));
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl animate-slide-up border border-zinc-200 overflow-hidden my-8">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 bg-zinc-50">
          <h3 className="text-base font-bold text-zinc-900">{product ? 'Edit Produk Menu' : 'Tambah Produk Menu Baru'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">{error}</div>}

          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">Nama Produk *</label>
            <input
              type="text"
              value={namaProduk}
              onChange={(e) => setNamaProduk(e.target.value)}
              placeholder="Contoh: Caffe Latte Caramel"
              required
              className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">Harga Dasar (Rp) *</label>
              <input
                type="number"
                value={hargaDasar}
                onChange={(e) => setHargaDasar(e.target.value)}
                placeholder="28000"
                required
                min={0}
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm font-mono font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">Kategori *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.namaKategori}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">Deskripsi Produk</label>
            <textarea
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Deskripsi singkat mengenai aroma, rasa, atau bahan..."
              rows={2}
              className="w-full p-3 rounded-xl border border-zinc-300 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">URL Foto / Gambar</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="flex-1 h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-11 h-11 rounded-xl object-cover border border-zinc-300 shrink-0 bg-zinc-100"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
              )}
            </div>
          </div>

          {/* Variants */}
          <div className="pt-2 border-t border-zinc-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Varian Produk (Opsi Tambahan)</label>
              <button
                type="button"
                onClick={() => setVariants([...variants, { namaVarian: '', hargaTambahan: '0' }])}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer flex items-center gap-1"
              >
                <Plus size={14} weight="bold" />
                <span>Tambah Varian</span>
              </button>
            </div>

            {variants.length === 0 ? (
              <p className="text-xs text-zinc-400 italic py-1">Tidak ada varian (harga flat mengikuti harga dasar).</p>
            ) : (
              <div className="space-y-2">
                {variants.map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={v.namaVarian}
                      onChange={(e) => { const nv = [...variants]; nv[i].namaVarian = e.target.value; setVariants(nv); }}
                      placeholder="Nama varian (cth: Iced / Large)"
                      className="flex-1 h-9 px-3 rounded-lg border border-zinc-300 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-zinc-500 font-mono">+Rp</span>
                      <input
                        type="number"
                        value={v.hargaTambahan}
                        onChange={(e) => { const nv = [...variants]; nv[i].hargaTambahan = e.target.value; setVariants(nv); }}
                        placeholder="0"
                        min={0}
                        className="w-24 h-9 px-2.5 rounded-lg border border-zinc-300 text-xs font-mono font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setVariants(variants.filter((_, j) => j !== i))}
                      className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-zinc-200">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer shadow-md shadow-emerald-600/20"
            >
              {mutation.isPending ? <CircleNotch size={18} className="animate-spin" /> : <><Check size={18} weight="bold" /> <span>{product ? 'Simpan Perubahan' : 'Buat Produk'}</span></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CategoryFormModal({ category, onClose }: { category: Category | null; onClose: () => void }) {
  const [namaKategori, setNamaKategori] = useState(category?.namaKategori || '');
  const [urutan, setUrutan] = useState(category?.urutan?.toString() || '0');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        namaKategori,
        urutan: parseInt(urutan, 10) || 0,
      };
      if (category) {
        await api.put(`/categories/${category.id}`, payload);
      } else {
        await api.post('/categories', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-manage'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories-public'] });
      onClose();
    },
    onError: (err: any) => {
      setError(getErrorMessage(err, 'Gagal menyimpan kategori'));
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl animate-slide-up border border-zinc-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 bg-zinc-50">
          <h3 className="text-base font-bold text-zinc-900">{category ? 'Edit Kategori' : 'Tambah Kategori Baru'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="p-5 space-y-4">
          {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">{error}</div>}

          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">Nama Kategori *</label>
            <input
              type="text"
              value={namaKategori}
              onChange={(e) => setNamaKategori(e.target.value)}
              placeholder="Contoh: Artisan Tea & Mocktails"
              required
              autoFocus
              className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">Urutan Tampilan</label>
            <input
              type="number"
              value={urutan}
              onChange={(e) => setUrutan(e.target.value)}
              placeholder="1"
              min={0}
              className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm font-mono font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer shadow-md shadow-emerald-600/20"
          >
            {mutation.isPending ? <CircleNotch size={18} className="animate-spin" /> : <><Check size={18} weight="bold" /> <span>{category ? 'Simpan Perubahan' : 'Buat Kategori'}</span></>}
          </button>
        </form>
      </div>
    </div>
  );
}
