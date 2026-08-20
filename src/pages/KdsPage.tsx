import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Clock,
  CheckCircle,
  ForkKnife,
  Coffee,
  Check,
  ArrowRight,
  Sparkle,
  ArrowsClockwise,
  CheckSquareOffset,
} from '@phosphor-icons/react';
import api from '../lib/api';
import { formatDateTime, orderTypeLabel, shortId } from '../lib/utils';
import type { Transaction } from '../types';

type OrderStatus = 'pending' | 'in_progress' | 'ready' | 'completed';

const KDS_STORAGE_KEY = 'pos_kds_status_map';

export default function KdsPage() {
  const [filter, setFilter] = useState<'active' | 'completed'>('active');

  // Persist KDS kitchen status map across page refreshes and browser sessions
  const [statusMap, setStatusMap] = useState<{ [txId: string]: OrderStatus }>(() => {
    try {
      const stored = localStorage.getItem(KDS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Keep localStorage and other browser tabs synced
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === KDS_STORAGE_KEY && e.newValue) {
        try {
          setStatusMap(JSON.parse(e.newValue));
        } catch {
          // ignore parsing error
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const saveStatusMap = useCallback((newMap: { [txId: string]: OrderStatus }) => {
    setStatusMap(newMap);
    try {
      localStorage.setItem(KDS_STORAGE_KEY, JSON.stringify(newMap));
    } catch (e) {
      console.error('Failed to save KDS statuses to localStorage:', e);
    }
  }, []);

  const updateStatus = useCallback((txId: string, status: OrderStatus) => {
    saveStatusMap({
      ...statusMap,
      [txId]: status,
    });
  }, [statusMap, saveStatusMap]);

  const getTxStatus = useCallback((txId: string): OrderStatus => {
    return statusMap[txId] || 'pending';
  }, [statusMap]);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['kds-transactions'],
    queryFn: async () => {
      const { data } = await api.get('/transactions?limit=150');
      return data;
    },
    refetchInterval: 5000, // Live kitchen polling every 5s
  });

  const transactions: Transaction[] = data?.transactions || [];

  const paidTransactions = useMemo(() => {
    return transactions.filter((t) => t.status === 'paid');
  }, [transactions]);

  const activeOrders = useMemo(() => {
    return paidTransactions.filter((t) => getTxStatus(t.id) !== 'completed');
  }, [paidTransactions, getTxStatus]);

  const completedOrders = useMemo(() => {
    return paidTransactions.filter((t) => getTxStatus(t.id) === 'completed');
  }, [paidTransactions, getTxStatus]);

  const displayedOrders = filter === 'active' ? activeOrders : completedOrders;

  const handleMarkAllActiveAsCompleted = () => {
    if (activeOrders.length === 0) return;
    if (window.confirm(`Tandai ${activeOrders.length} pesanan aktif sebagai SELESAI?`)) {
      const updated = { ...statusMap };
      activeOrders.forEach((o) => {
        updated[o.id] = 'completed';
      });
      saveStatusMap(updated);
    }
  };

  const handleClearCompletedHistory = () => {
    if (completedOrders.length === 0) return;
    if (window.confirm('Kosongkan tampilan pesanan selesai?')) {
      const updated: { [id: string]: OrderStatus } = {};
      Object.entries(statusMap).forEach(([id, st]) => {
        if (st !== 'completed') {
          updated[id] = st;
        }
      });
      saveStatusMap(updated);
    }
  };

  return (
    <div className="p-3 sm:p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header & Status Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-600/20">
            <Coffee size={24} weight="bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-zinc-900">Barista & Kitchen Display (KDS)</h1>
              {isFetching && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                  <ArrowsClockwise size={12} className="animate-spin" />
                  <span>Live Sync</span>
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500">Layar antrean dapur & bar real-time dengan status pesanan persisten</p>
          </div>
        </div>

        {/* Filter Toggle & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {filter === 'active' && activeOrders.length > 0 && (
            <button
              onClick={handleMarkAllActiveAsCompleted}
              className="h-10 px-3.5 rounded-xl border border-zinc-300 bg-white text-xs font-bold text-zinc-700 hover:bg-zinc-100 hover:text-emerald-700 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Tandai semua pesanan aktif menjadi selesai"
            >
              <CheckSquareOffset size={16} weight="bold" />
              <span>Selesaikan Semua ({activeOrders.length})</span>
            </button>
          )}

          {filter === 'completed' && completedOrders.length > 0 && (
            <button
              onClick={handleClearCompletedHistory}
              className="h-10 px-3.5 rounded-xl border border-zinc-300 bg-white text-xs font-bold text-zinc-600 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Bersihkan daftar selesai"
            >
              <CheckCircle size={16} />
              <span>Bersihkan Layar Selesai</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 bg-zinc-200/80 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter === 'active'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Pesanan Aktif ({activeOrders.length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter === 'completed'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Selesai ({completedOrders.length})
            </button>
          </div>
        </div>
      </div>

      {/* KDS Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-2xl" />
          ))}
        </div>
      ) : displayedOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-zinc-200 text-center p-6 shadow-xs">
          <CheckCircle size={56} weight="duotone" className="text-emerald-500 mb-3" />
          <p className="text-base font-bold text-zinc-800">
            {filter === 'active' ? 'Tidak Ada Antrean Pesanan Aktif' : 'Belum Ada Pesanan yang Ditandai Selesai'}
          </p>
          <p className="text-xs text-zinc-500 mt-1 max-w-md">
            {filter === 'active'
              ? 'Semua pesanan cafe sudah disajikan ke pelanggan atau belum ada transaksi baru yang masuk.'
              : 'Pesanan yang telah Anda tandai "Selesai" akan muncul di tab ini dan tersimpan secara permanen.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayedOrders.map((tx) => (
            <KdsCard
              key={tx.id}
              transaction={tx}
              status={getTxStatus(tx.id)}
              onStatusChange={(newStatus) => updateStatus(tx.id, newStatus)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function KdsCard({
  transaction: tx,
  status,
  onStatusChange,
}: {
  transaction: Transaction;
  status: OrderStatus;
  onStatusChange: (status: OrderStatus) => void;
}) {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    const calcElapsed = () => {
      const created = new Date(tx.createdAt).getTime();
      const now = new Date().getTime();
      const diffMins = Math.floor((now - created) / 60000);
      setElapsedMinutes(Math.max(0, diffMins));
    };

    calcElapsed();
    const interval = setInterval(calcElapsed, 10000);
    return () => clearInterval(interval);
  }, [tx.createdAt]);

  // Color coding based on elapsed time
  const timerBadgeClass =
    status === 'completed'
      ? 'bg-zinc-100 text-zinc-600 border border-zinc-200'
      : elapsedMinutes > 15
      ? 'bg-red-500 text-white shadow-sm shadow-red-500/30 animate-pulse'
      : elapsedMinutes > 8
      ? 'bg-amber-500 text-white'
      : 'bg-emerald-600 text-white';

  return (
    <div
      className={`rounded-2xl border bg-white overflow-hidden shadow-sm flex flex-col justify-between transition-all animate-fade-in ${
        status === 'in_progress'
          ? 'border-blue-500 ring-2 ring-blue-500/20'
          : status === 'ready'
          ? 'border-emerald-500 ring-2 ring-emerald-500/20'
          : status === 'completed'
          ? 'border-zinc-200 opacity-80'
          : 'border-zinc-200'
      }`}
    >
      {/* Card Header */}
      <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-mono font-extrabold text-zinc-900">
              #{shortId(tx.clientUuid)}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-zinc-200 text-zinc-800 border border-zinc-300">
              {orderTypeLabel(tx.tipeOrder)}
            </span>
            {tx.table && (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Meja {tx.table.nomorMeja}
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1 font-medium">
            Kasir: {tx.shift?.kasir?.nama || 'Kasir'} • {formatDateTime(tx.createdAt)}
          </p>
        </div>

        {/* Live Elapsed Timer Badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold shrink-0 ${timerBadgeClass}`}>
          <Clock size={14} weight="bold" />
          <span>{status === 'completed' ? 'Selesai' : `${elapsedMinutes} mnt`}</span>
        </div>
      </div>

      {/* Item List */}
      <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-64">
        {tx.items?.map((item, idx) => (
          <div key={idx} className="flex items-start justify-between border-b border-zinc-100 last:border-0 pb-2.5 last:pb-0">
            <div className="flex items-start gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-zinc-100 border border-zinc-200 text-xs font-mono font-bold text-zinc-900 flex items-center justify-center shrink-0">
                {item.jumlah}x
              </span>
              <div>
                <p className="text-sm font-bold text-zinc-900">{item.product?.namaProduk}</p>
                {item.variant && (
                  <p className="text-xs text-zinc-500 font-semibold">{item.variant.namaVarian}</p>
                )}
                {item.catatan && (
                  <p className="text-xs font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md mt-1 border border-amber-200">
                    * Catatan: {item.catatan}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Card Action Footer */}
      <div className="p-3.5 border-t border-zinc-200 bg-zinc-50/80 flex items-center gap-2">
        {status === 'pending' && (
          <button
            onClick={() => onStatusChange('in_progress')}
            className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-sm shadow-blue-600/20"
          >
            <span>Mulai Diproses</span>
            <ArrowRight size={16} weight="bold" />
          </button>
        )}

        {status === 'in_progress' && (
          <button
            onClick={() => onStatusChange('ready')}
            className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-sm shadow-emerald-600/20"
          >
            <Sparkle size={16} weight="fill" />
            <span>Siap Saji (Ready)</span>
          </button>
        )}

        {status === 'ready' && (
          <button
            onClick={() => onStatusChange('completed')}
            className="w-full h-11 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-sm"
          >
            <Check size={16} weight="bold" />
            <span>Tandai Selesai</span>
          </button>
        )}

        {status === 'completed' && (
          <button
            onClick={() => onStatusChange('in_progress')}
            className="w-full h-10 rounded-xl border border-zinc-300 bg-white text-zinc-700 text-xs font-semibold hover:bg-zinc-100 hover:text-blue-600 cursor-pointer transition-colors"
          >
            Kembalikan ke Diproses
          </button>
        )}
      </div>
    </div>
  );
}
