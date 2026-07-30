import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, PencilSimple, Trash, CircleNotch, X, Check, Tag } from '@phosphor-icons/react';
import api from '../lib/api';
import { formatRupiah } from '../lib/utils';
import type { Discount } from '../types';

export default function DiscountPage() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Discount | null>(null);
  const queryClient = useQueryClient();

  const { data: discounts = [], isLoading } = useQuery<Discount[]>({
    queryKey: ['discounts'],
    queryFn: async () => {
      const { data } = await api.get('/discounts');
      return data.discounts;
    },
  });

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">Diskon & Voucher</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Kelola kode voucher dan diskon transaksi</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all active:scale-[0.98] cursor-pointer flex items-center gap-2 shadow-md shadow-emerald-600/20"
        >
          <Plus size={18} />
          <span>Tambah Voucher</span>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : discounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-60">
          <Tag size={48} className="text-zinc-400 mb-3" />
          <p className="text-sm font-semibold text-zinc-600">Belum ada voucher</p>
        </div>
      ) : (
        <div className="space-y-3">
          {discounts.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-200 bg-white hover:border-emerald-500/40 hover:shadow-md transition-all animate-fade-in">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base font-mono font-bold text-zinc-900">{d.kodeVoucher}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                    d.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'
                  }`}>
                    {d.isActive ? 'Aktif' : 'Non-aktif'}
                  </span>
                </div>
                <p className="text-xs font-semibold text-zinc-500 mt-1">
                  {d.tipe === 'persentase' ? `${d.nilai}% Diskon` : `${formatRupiah(d.nilai)} Potongan`}
                  {d.minBelanja > 0 && ` • Min. belanja ${formatRupiah(d.minBelanja)}`}
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => { setEditing(d); setShowForm(true); }}
                  className="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  <PencilSimple size={16} />
                </button>
                <DeleteDiscountButton discountId={d.id} />
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <DiscountFormModal discount={editing} onClose={() => setShowForm(false)} />}
    </div>
  );
}

function DeleteDiscountButton({ discountId }: { discountId: string }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => api.delete(`/discounts/${discountId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['discounts'] }),
  });
  return (
    <button
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className="p-2 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
    >
      {mutation.isPending ? <CircleNotch size={16} className="animate-spin" /> : <Trash size={16} />}
    </button>
  );
}

function DiscountFormModal({ discount, onClose }: { discount: Discount | null; onClose: () => void }) {
  const [kodeVoucher, setKodeVoucher] = useState(discount?.kodeVoucher || '');
  const [tipe, setTipe] = useState<'persentase' | 'nominal'>(discount?.tipe as any || 'persentase');
  const [nilai, setNilai] = useState(discount?.nilai?.toString() || '');
  const [minBelanja, setMinBelanja] = useState(discount?.minBelanja?.toString() || '0');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        kodeVoucher,
        tipe,
        nilai: parseInt(nilai),
        minBelanja: parseInt(minBelanja) || 0,
      };
      if (discount) {
        await api.put(`/discounts/${discount.id}`, payload);
      } else {
        await api.post('/discounts', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      onClose();
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Gagal menyimpan diskon'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl animate-slide-up border border-zinc-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200">
          <h3 className="text-base font-bold text-zinc-900">{discount ? 'Edit Voucher' : 'Tambah Voucher Baru'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="p-4 space-y-4">
          {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm font-medium">{error}</div>}

          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-1">Kode Voucher</label>
            <input
              type="text"
              value={kodeVoucher}
              onChange={(e) => setKodeVoucher(e.target.value.toUpperCase())}
              required
              placeholder="GRAND10"
              className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm font-mono font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">Tipe Diskon</label>
              <select
                value={tipe}
                onChange={(e) => setTipe(e.target.value as 'persentase' | 'nominal')}
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all cursor-pointer"
              >
                <option value="persentase">Persentase (%)</option>
                <option value="nominal">Nominal (Rp)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">Nilai</label>
              <input
                type="number"
                value={nilai}
                onChange={(e) => setNilai(e.target.value)}
                required
                min={0}
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm font-mono font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-1">Min. Belanja (Rp)</label>
            <input
              type="number"
              value={minBelanja}
              onChange={(e) => setMinBelanja(e.target.value)}
              min={0}
              className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm font-mono font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer shadow-md shadow-emerald-600/20"
          >
            {mutation.isPending ? <CircleNotch size={20} className="animate-spin" /> : <><Check size={18} /> <span>Simpan Voucher</span></>}
          </button>
        </form>
      </div>
    </div>
  );
}
