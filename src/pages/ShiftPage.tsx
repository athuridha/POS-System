import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  ArrowDown,
  ArrowUp,
  CircleNotch,
  CheckCircle,
  WarningCircle,
  X,
  Check,
  CurrencyCircleDollar,
  SignOut,
} from '@phosphor-icons/react';
import api from '../lib/api';
import { formatRupiah, formatDateTime } from '../lib/utils';
import type { Shift } from '../types';

export default function ShiftPage() {
  const queryClient = useQueryClient();
  const [closingShift, setClosingShift] = useState<Shift | null>(null);

  const { data: shifts = [], isLoading } = useQuery<Shift[]>({
    queryKey: ['shifts'],
    queryFn: async () => {
      const { data } = await api.get('/shifts');
      return data.shifts;
    },
  });

  return (
    <div className="p-3 sm:p-6 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Riwayat & Rekonsiliasi Shift Kasir</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Lihat modal awal, total transaksi, dan rekonsiliasi kas akhir shift kasir</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      ) : shifts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-60">
          <Clock size={48} className="text-zinc-400 mb-3" />
          <p className="text-sm font-semibold text-zinc-600">Belum ada data shift</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shifts.map((shift) => (
            <div
              key={shift.id}
              className={`p-4 rounded-2xl border transition-all animate-fade-in ${
                shift.status === 'open'
                  ? 'border-emerald-300 bg-emerald-50/60 shadow-sm'
                  : 'border-zinc-200 bg-white'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      shift.status === 'open' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      {shift.status === 'open' ? 'Shift Aktif' : 'Shift Ditutup'}
                    </span>
                    <span className="text-xs font-bold text-zinc-800">
                      Kasir: {shift.kasir?.nama}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    <div>
                      <p className="text-xs text-zinc-500">Waktu Buka Shift</p>
                      <p className="text-xs font-mono font-bold text-zinc-900">{formatDateTime(shift.waktuBuka)}</p>
                    </div>
                    {shift.waktuTutup && (
                      <div>
                        <p className="text-xs text-zinc-500">Waktu Tutup Shift</p>
                        <p className="text-xs font-mono font-bold text-zinc-900">{formatDateTime(shift.waktuTutup)}</p>
                      </div>
                    )}
                  </div>

                  {/* Financial summary */}
                  <div className="flex flex-wrap items-center gap-4 mt-3 pt-2 border-t border-zinc-200/60">
                    <div className="flex items-center gap-1.5">
                      <ArrowDown size={14} className="text-zinc-500" />
                      <span className="text-xs text-zinc-500">Modal Awal Kas:</span>
                      <span className="text-xs font-mono font-bold text-zinc-900">{formatRupiah(shift.modalAwal)}</span>
                    </div>

                    {shift.status === 'closed' && (
                      <>
                        <div className="flex items-center gap-1.5">
                          <ArrowUp size={14} className="text-zinc-500" />
                          <span className="text-xs text-zinc-500">Kas Seharusnya:</span>
                          <span className="text-xs font-mono font-bold text-zinc-900">{formatRupiah(shift.kasSeharusnya || 0)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-zinc-500">Kas Fisik Aktual:</span>
                          <span className="text-xs font-mono font-bold text-zinc-900">{formatRupiah(shift.kasAktual || 0)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {(shift.selisih || 0) === 0 ? (
                            <CheckCircle size={16} className="text-emerald-600" />
                          ) : (
                            <WarningCircle size={16} className={`${(shift.selisih || 0) > 0 ? 'text-emerald-600' : 'text-red-600'}`} />
                          )}
                          <span className={`text-xs font-mono font-bold ${
                            (shift.selisih || 0) === 0 ? 'text-emerald-700' : (shift.selisih || 0) > 0 ? 'text-emerald-700' : 'text-red-600'
                          }`}>
                            Selisih: {(shift.selisih || 0) >= 0 ? '+' : ''}{formatRupiah(shift.selisih || 0)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="text-xs text-zinc-400 mt-2 font-medium">
                    {shift._count?.transactions ?? 0} transaksi diproses
                  </div>
                </div>

                {/* Close shift button */}
                {shift.status === 'open' && (
                  <div className="shrink-0 pt-2 md:pt-0">
                    <button
                      onClick={() => setClosingShift(shift)}
                      className="h-10 px-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <SignOut size={16} />
                      <span>Tutup Shift Kasir</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pop-up Close Shift Modal */}
      {closingShift && (
        <CloseShiftModal
          shift={closingShift}
          onClose={() => setClosingShift(null)}
        />
      )}
    </div>
  );
}

function CloseShiftModal({ shift, onClose }: { shift: Shift; onClose: () => void }) {
  const [kasAktual, setKasAktual] = useState('');
  const [displayValue, setDisplayValue] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const handleInputChange = (val: string) => {
    const rawDigits = val.replace(/\D/g, '');
    if (!rawDigits) {
      setKasAktual('');
      setDisplayValue('');
      return;
    }
    const num = parseInt(rawDigits, 10);
    setKasAktual(num.toString());
    setDisplayValue(num.toLocaleString('id-ID'));
  };

  const handlePresetSelect = (amt: number) => {
    setKasAktual(amt.toString());
    setDisplayValue(amt.toLocaleString('id-ID'));
  };

  const closeMutation = useMutation({
    mutationFn: async ({ shiftId, kasAktual }: { shiftId: string; kasAktual: number }) => {
      const { data } = await api.post(`/shifts/${shiftId}/close`, { kasAktual });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shifts-active'] });
      localStorage.removeItem('activeShift');
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Gagal menutup shift kasir');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(kasAktual);
    if (isNaN(amount) || amount < 0) {
      setError('Masukkan jumlah uang kas aktual fisik yang valid');
      return;
    }
    closeMutation.mutate({ shiftId: shift.id, kasAktual: amount });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl animate-slide-up border border-zinc-200 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 bg-amber-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
              <Clock size={20} weight="duotone" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">Tutup Shift Kasir</h3>
              <p className="text-xs text-zinc-500">Kasir: {shift.kasir?.nama}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Shift Details Summary */}
          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs">
            <div className="flex justify-between text-zinc-600">
              <span>Waktu Buka Shift</span>
              <span className="font-mono font-bold text-zinc-900">{formatDateTime(shift.waktuBuka)}</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>Modal Awal Laci Kas</span>
              <span className="font-mono font-bold text-zinc-900">{formatRupiah(shift.modalAwal)}</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>Total Transaksi Diproses</span>
              <span className="font-mono font-bold text-zinc-900">{shift._count?.transactions ?? 0} transaksi</span>
            </div>
          </div>

          {/* Input Kas Aktual */}
          <div>
            <label htmlFor="kasAktual" className="block text-sm font-semibold text-zinc-800 mb-1.5">
              Uang Tunai Fisik di Laci Kasir (Kas Aktual)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500 select-none">
                Rp
              </span>
              <input
                id="kasAktual"
                type="text"
                inputMode="numeric"
                value={displayValue}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="750.000"
                required
                autoFocus
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-zinc-300 bg-white text-base font-mono font-bold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
              />
            </div>
            {kasAktual && (
              <p className="text-xs font-mono font-bold text-emerald-600 mt-1">
                Terbilang: {formatRupiah(parseInt(kasAktual))}
              </p>
            )}
            <p className="text-xs text-zinc-400 mt-1">
              Hitung total uang fisik tunai di dalam laci kasir saat ini
            </p>
          </div>

          {/* Quick Presets */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 mb-1.5">Pilih cepat nominal:</p>
            <div className="flex flex-wrap gap-1.5">
              {[200000, 300000, 500000, 750000, 1000000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handlePresetSelect(amt)}
                  className="px-3 py-1 rounded-lg bg-zinc-100 border border-zinc-200 text-xs font-mono font-bold text-zinc-700 hover:bg-zinc-200 transition-colors cursor-pointer"
                >
                  {formatRupiah(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-3 border-t border-zinc-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border border-zinc-300 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={closeMutation.isPending || !kasAktual}
              className="flex-1 h-11 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-amber-600/20"
            >
              {closeMutation.isPending ? (
                <CircleNotch size={18} className="animate-spin" />
              ) : (
                <>
                  <Check size={18} />
                  <span>Konfirmasi Tutup</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
