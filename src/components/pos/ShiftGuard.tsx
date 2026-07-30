import { useState, useEffect } from 'react';
import { Clock, CurrencyCircleDollar, ArrowRight, CircleNotch } from '@phosphor-icons/react';
import api from '../../lib/api';
import { formatRupiah } from '../../lib/utils';
import type { Shift } from '../../types';
import { useAuthStore } from '../../stores/authStore';

interface Props {
  onShiftActive: (shift: Shift) => void;
}

export default function ShiftGuard({ onShiftActive }: Props) {
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [modalAwal, setModalAwal] = useState('');
  const [displayValue, setDisplayValue] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuthStore();

  const isBypassRole = user?.role === 'super_admin' || user?.role === 'manager';

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/shifts/active');

        // Check if there is an active open shift belonging to THIS user
        if (data.shift && (data.shift.kasirId === user?.id || isBypassRole)) {
          onShiftActive(data.shift);
          return;
        }

        // Only auto-open shift for Super Admin and Manager
        if (isBypassRole) {
          const { data: openData } = await api.post('/shifts/open', { modalAwal: 0 });
          localStorage.setItem('activeShift', JSON.stringify(openData.shift));
          onShiftActive(openData.shift);
          return;
        }
      } catch {
        const cachedShift = localStorage.getItem('activeShift');
        if (cachedShift) {
          try {
            const parsed = JSON.parse(cachedShift);
            if (parsed.kasirId === user?.id || isBypassRole) {
              onShiftActive(parsed);
              return;
            }
          } catch {}
        }

        // Fallback auto-shift for Super Admin / Manager offline
        if (isBypassRole) {
          const fallbackShift: Shift = {
            id: 'admin-auto-shift',
            kasirId: user?.id || 'admin',
            waktuBuka: new Date().toISOString(),
            modalAwal: 0,
            status: 'open',
          };
          onShiftActive(fallbackShift);
          return;
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [onShiftActive, isBypassRole, user]);

  const handleInputChange = (val: string) => {
    const rawDigits = val.replace(/\D/g, '');
    if (!rawDigits) {
      setModalAwal('');
      setDisplayValue('');
      return;
    }
    const num = parseInt(rawDigits, 10);
    setModalAwal(num.toString());
    setDisplayValue(num.toLocaleString('id-ID'));
  };

  const handlePresetSelect = (amt: number) => {
    setModalAwal(amt.toString());
    setDisplayValue(amt.toLocaleString('id-ID'));
  };

  const handleOpenShift = async () => {
    const amount = parseInt(modalAwal);
    if (isNaN(amount) || amount < 0) {
      setError('Modal awal harus berupa angka valid (min. 0)');
      return;
    }

    setOpening(true);
    setError('');

    try {
      const { data } = await api.post('/shifts/open', { modalAwal: amount });
      localStorage.setItem('activeShift', JSON.stringify(data.shift));
      onShiftActive(data.shift);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal membuka shift');
    } finally {
      setOpening(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 bg-zinc-100">
        <CircleNotch size={36} className="animate-spin text-emerald-600" />
        <p className="text-sm font-semibold text-zinc-600">Memuat status shift kasir...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center p-6 bg-zinc-100 font-sans">
      <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl border border-zinc-200 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Clock size={22} weight="duotone" className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-900">Buka Shift Kasir</h2>
            <p className="text-xs text-zinc-500">Input modal awal kasir untuk mulai bertransaksi</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-fade-in font-medium">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="modalAwal" className="block text-sm font-semibold text-zinc-700 mb-1.5">
              Modal Awal / Deposit Laci Kasir (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500 select-none">
                Rp
              </span>
              <input
                id="modalAwal"
                type="text"
                inputMode="numeric"
                value={displayValue}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="50.000"
                autoFocus
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-zinc-300 bg-white text-base font-mono font-bold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
            {modalAwal && (
              <p className="text-xs font-mono font-bold text-emerald-600 mt-1">
                Terbilang: {formatRupiah(parseInt(modalAwal))}
              </p>
            )}
            <p className="text-xs text-zinc-400 mt-1">
              Masukkan jumlah uang tunai fisik yang ada di laci kasir saat ini
            </p>
          </div>

          <button
            onClick={handleOpenShift}
            disabled={opening || !modalAwal}
            className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-emerald-600/20"
          >
            {opening ? (
              <CircleNotch size={20} className="animate-spin" />
            ) : (
              <>
                <span>Buka Shift Kasir</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {/* Quick presets */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 mb-2">Pilih cepat deposit:</p>
            <div className="flex flex-wrap gap-1.5">
              {[200000, 300000, 500000, 750000, 1000000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handlePresetSelect(amt)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-100 border border-zinc-200 text-xs font-mono font-bold text-zinc-700 hover:bg-zinc-200 transition-colors cursor-pointer"
                >
                  {formatRupiah(amt)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
