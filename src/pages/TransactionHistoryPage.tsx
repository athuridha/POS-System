import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Receipt,
  Printer,
  X,
  Eye,
  MagnifyingGlass,
  Funnel,
  Prohibit,
  CheckCircle,
  Clock,
  User,
  ShoppingBag,
  CurrencyCircleDollar,
  CalendarBlank,
  CircleNotch,
} from '@phosphor-icons/react';
import api from '../lib/api';
import { formatRupiah, formatDateTime, formatDate, paymentMethodLabel, orderTypeLabel, shortId } from '../lib/utils';
import type { Transaction } from '../types';
import { ThermalReceipt, ThermalReceiptData } from '../components/pos/ThermalReceipt';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';

export default function TransactionHistoryPage() {
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<Transaction | null>(null);
  const [selectedTxDetail, setSelectedTxDetail] = useState<Transaction | null>(null);
  const [voidingTx, setVoidingTx] = useState<Transaction | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [cashierFilter, setCashierFilter] = useState<string>('all');

  // Date Range Filters
  const [datePreset, setDatePreset] = useState<'all' | 'today' | '7days' | '30days' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const canVoid = user?.role === 'super_admin' || user?.role === 'manager';
  const isManagerOrAdmin = user?.role === 'super_admin' || user?.role === 'manager';

  const { data, isLoading } = useQuery({
    queryKey: ['transactions-history'],
    queryFn: async () => {
      const { data } = await api.get('/transactions?limit=500');
      return data;
    },
  });

  const transactions: Transaction[] = data?.transactions || [];

  // Extract unique cashiers for filter dropdown
  const uniqueCashiers = useMemo(() => {
    const map = new Map<string, string>();
    transactions.forEach((tx) => {
      if (tx.shift?.kasir?.id && tx.shift?.kasir?.nama) {
        map.set(tx.shift.kasir.id, tx.shift.kasir.nama);
      }
    });
    return Array.from(map.entries()).map(([id, nama]) => ({ id, nama }));
  }, [transactions]);

  // Filter logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Cashier role restriction: Only see own transactions
      if (user?.role === 'kasir') {
        const kasirId = tx.shift?.kasir?.id;
        if (kasirId && kasirId !== user.id) return false;
      }

      // Cashier Filter for Manager / Admin
      if (cashierFilter !== 'all') {
        const txKasirId = tx.shift?.kasir?.id;
        if (txKasirId !== cashierFilter) return false;
      }

      const txDate = new Date(tx.createdAt);

      // Date Range Filtering
      if (datePreset === 'today') {
        const today = new Date();
        if (
          txDate.getDate() !== today.getDate() ||
          txDate.getMonth() !== today.getMonth() ||
          txDate.getFullYear() !== today.getFullYear()
        ) {
          return false;
        }
      } else if (datePreset === '7days') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        if (txDate < sevenDaysAgo) return false;
      } else if (datePreset === '30days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);
        if (txDate < thirtyDaysAgo) return false;
      } else if (datePreset === 'custom') {
        if (startDate) {
          const s = new Date(startDate);
          s.setHours(0, 0, 0, 0);
          if (txDate < s) return false;
        }
        if (endDate) {
          const e = new Date(endDate);
          e.setHours(23, 59, 59, 999);
          if (txDate > e) return false;
        }
      }

      // Search text
      if (search) {
        const q = search.toLowerCase();
        const matchId = tx.clientUuid.toLowerCase().includes(q);
        const matchKasir = tx.shift?.kasir?.nama?.toLowerCase().includes(q);
        const matchTable = tx.table?.nomorMeja?.toLowerCase().includes(q);
        const matchItems = tx.items?.some((i) => i.product?.namaProduk?.toLowerCase().includes(q));
        if (!matchId && !matchKasir && !matchTable && !matchItems) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && tx.status !== statusFilter) return false;

      // Order type filter
      if (typeFilter !== 'all' && tx.tipeOrder !== typeFilter) return false;

      // Payment method filter
      if (methodFilter !== 'all' && !tx.payments?.some((p) => p.metode === methodFilter)) return false;

      return true;
    });
  }, [transactions, search, statusFilter, typeFilter, methodFilter, cashierFilter, datePreset, startDate, endDate, user]);

  // Group transactions by date
  const groupedByDate = useMemo(() => {
    const groups: { [dateStr: string]: { date: string; txs: Transaction[]; totalOmset: number; totalItemCount: number } } = {};

    filteredTransactions.forEach((tx) => {
      const dateKey = new Date(tx.createdAt).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: tx.createdAt,
          txs: [],
          totalOmset: 0,
          totalItemCount: 0,
        };
      }
      groups[dateKey].txs.push(tx);
      if (tx.status === 'paid') {
        groups[dateKey].totalOmset += tx.total;
      }
      groups[dateKey].totalItemCount += tx.items?.reduce((sum, i) => sum + i.jumlah, 0) || 0;
    });

    return Object.values(groups);
  }, [filteredTransactions]);

  // Quick stats
  const totalPaidTransactions = filteredTransactions.filter((t) => t.status === 'paid');
  const totalOmsetAll = totalPaidTransactions.reduce((sum, t) => sum + t.total, 0);
  const totalVoidCount = filteredTransactions.filter((t) => t.status === 'void').length;

  return (
    <div className="p-3 sm:p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Riwayat Transaksi</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          {isManagerOrAdmin
            ? 'Lihat seluruh transaksi cafe dari semua kasir, filter jangka hari & kasir, serta cetak ulang struk'
            : 'Daftar riwayat transaksi yang Anda proses'}
        </p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl border border-zinc-200 bg-white shadow-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CurrencyCircleDollar size={18} weight="duotone" />
            </div>
            <span className="text-xs font-semibold text-zinc-500">Total Omset Tampil</span>
          </div>
          <p className="text-xl font-bold font-mono text-zinc-900">{formatRupiah(totalOmsetAll)}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{totalPaidTransactions.length} transaksi lunas</p>
        </div>

        <div className="p-4 rounded-2xl border border-zinc-200 bg-white shadow-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              <ShoppingBag size={18} weight="duotone" />
            </div>
            <span className="text-xs font-semibold text-zinc-500">Total Transaksi</span>
          </div>
          <p className="text-xl font-bold font-mono text-zinc-900">{filteredTransactions.length}</p>
          <p className="text-xs text-zinc-400 mt-0.5">Hasil pencarian & filter</p>
        </div>

        <div className="p-4 rounded-2xl border border-zinc-200 bg-white shadow-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
              <Prohibit size={18} weight="duotone" />
            </div>
            <span className="text-xs font-semibold text-zinc-500">Transaksi Void (Batal)</span>
          </div>
          <p className="text-xl font-bold font-mono text-zinc-900">{totalVoidCount}</p>
          <p className="text-xs text-zinc-400 mt-0.5">Dibatalkan manajer / admin</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-4">
        {/* Row 1: Date Range Presets */}
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 pb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 mr-2">
            <CalendarBlank size={16} className="text-emerald-600" />
            <span>Jangka Hari:</span>
          </div>

          {[
            { key: 'all', label: 'Semua Tanggal' },
            { key: 'today', label: 'Hari Ini' },
            { key: '7days', label: '7 Hari Terakhir' },
            { key: '30days', label: '30 Hari Terakhir' },
            { key: 'custom', label: 'Custom Tanggal' },
          ].map((preset) => (
            <button
              key={preset.key}
              onClick={() => setDatePreset(preset.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                datePreset === preset.key
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {preset.label}
            </button>
          ))}

          {/* Custom Date Pickers */}
          {datePreset === 'custom' && (
            <div className="flex items-center gap-2 ml-auto animate-fade-in">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 px-2.5 rounded-xl border border-zinc-300 bg-white text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              <span className="text-xs text-zinc-400 font-bold">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 px-2.5 rounded-xl border border-zinc-300 bg-white text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          )}
        </div>

        {/* Row 2: Search + Cashier Filter + Status, Type, Method Dropdowns */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari ID transaksi, produk, meja, atau kasir..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-zinc-300 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Cashier Filter (Manager & Admin only) */}
            {isManagerOrAdmin && (
              <select
                value={cashierFilter}
                onChange={(e) => setCashierFilter(e.target.value)}
                className="h-10 px-3 rounded-xl border border-zinc-300 bg-white text-xs font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
              >
                <option value="all">Semua Kasir</option>
                {uniqueCashiers.map((c) => (
                  <option key={c.id} value={c.id}>
                    Kasir: {c.nama}
                  </option>
                ))}
              </select>
            )}

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-zinc-300 bg-white text-xs font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="paid">Lunas (Paid)</option>
              <option value="void">Dibatalkan (Void)</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-zinc-300 bg-white text-xs font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
            >
              <option value="all">Semua Tipe Order</option>
              <option value="dine_in">Dine In</option>
              <option value="take_away">Take Away</option>
            </select>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-zinc-300 bg-white text-xs font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
            >
              <option value="all">Semua Metode Bayar</option>
              <option value="cash">Tunai (Cash)</option>
              <option value="qris">QRIS</option>
              <option value="kartu">Kartu EDC</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction List per Date Group */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : groupedByDate.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-zinc-200 opacity-60">
          <Receipt size={56} className="text-zinc-400 mb-3" />
          <p className="text-base font-bold text-zinc-700">Tidak ada transaksi dalam jangka waktu ini</p>
          <p className="text-xs text-zinc-500 mt-1">Coba ubah filter jangka hari, filter kasir, atau kata kunci pencarian</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByDate.map((group) => (
            <div key={group.date} className="space-y-3">
              {/* Date Header Banner */}
              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-zinc-200/70 border border-zinc-300/80">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-zinc-700 font-bold" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                    {formatDate(group.date)}
                  </h2>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono font-bold text-zinc-800">
                  <span>{group.txs.length} Transaksi</span>
                  <span>•</span>
                  <span>{group.totalItemCount} Item</span>
                  <span>•</span>
                  <span className="text-emerald-700 font-bold">{formatRupiah(group.totalOmset)}</span>
                </div>
              </div>

              {/* Transactions in this date */}
              <div className="space-y-2.5">
                {group.txs.map((tx) => (
                  <TransactionCard
                    key={tx.id}
                    transaction={tx}
                    canVoid={canVoid}
                    onOpenReceipt={() => setSelectedTxForReceipt(tx)}
                    onOpenDetail={() => setSelectedTxDetail(tx)}
                    onVoid={() => setVoidingTx(tx)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reprint Receipt Modal */}
      {selectedTxForReceipt && (
        <ReprintModal
          transaction={selectedTxForReceipt}
          onClose={() => setSelectedTxForReceipt(null)}
        />
      )}

      {/* Transaction Detail Drawer Modal */}
      {selectedTxDetail && (
        <DetailModal
          transaction={selectedTxDetail}
          onClose={() => setSelectedTxDetail(null)}
          onPrintReceipt={() => {
            const tx = selectedTxDetail;
            setSelectedTxDetail(null);
            setSelectedTxForReceipt(tx);
          }}
        />
      )}

      {/* Void Confirmation Modal */}
      {voidingTx && (
        <VoidModal
          transaction={voidingTx}
          onClose={() => setVoidingTx(null)}
        />
      )}
    </div>
  );
}

function TransactionCard({
  transaction: tx,
  canVoid,
  onOpenReceipt,
  onOpenDetail,
  onVoid,
}: {
  transaction: Transaction;
  canVoid: boolean;
  onOpenReceipt: () => void;
  onOpenDetail: () => void;
  onVoid: () => void;
}) {
  return (
    <div className="p-4 rounded-2xl border border-zinc-200 bg-white hover:border-emerald-500/40 hover:shadow-md transition-all animate-fade-in flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Row 1: ID, Status, Tipe Order */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-mono font-bold text-zinc-900">
            #{shortId(tx.clientUuid)}
          </span>
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
              tx.status === 'paid'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}
          >
            {tx.status === 'paid' ? 'Lunas' : 'Void'}
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 font-bold border border-zinc-200">
            {orderTypeLabel(tx.tipeOrder)}
          </span>
          {tx.table && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-mono font-bold border border-emerald-200">
              Meja {tx.table.nomorMeja}
            </span>
          )}
        </div>

        {/* Row 2: Waktu, Kasir, Items summary */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
          <span>{formatDateTime(tx.createdAt)}</span>
          <span>•</span>
          <span className="font-semibold text-zinc-800">Kasir: {tx.shift?.kasir?.nama || 'Kasir'}</span>
          <span>•</span>
          <span className="font-semibold text-zinc-800">
            {tx.items?.map((i) => `${i.jumlah}x ${i.product?.namaProduk || 'Produk'}`).join(', ')}
          </span>
        </div>

        {/* Row 3: Payment methods */}
        <div className="flex items-center gap-2 text-xs">
          {tx.payments?.map((p, i) => (
            <span key={i} className="font-semibold text-zinc-600">
              Metode: {paymentMethodLabel(p.metode)}
            </span>
          ))}
        </div>
      </div>

      {/* Right: Total + Actions */}
      <div className="flex items-center gap-3 shrink-0 sm:border-l sm:border-zinc-200 sm:pl-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-zinc-100 pt-3 sm:pt-0">
        <div className="text-left sm:text-right">
          <p className="text-base font-bold font-mono text-zinc-900">{formatRupiah(tx.total)}</p>
          {tx.diskon > 0 && (
            <p className="text-xs font-mono font-semibold text-emerald-600">
              Diskon: -{formatRupiah(tx.diskon)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenDetail}
            className="h-9 px-3 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Lihat Detail Order"
          >
            <Eye size={16} />
            <span className="hidden md:inline">Detail</span>
          </button>

          <button
            onClick={onOpenReceipt}
            className="h-9 px-3 rounded-xl border border-zinc-300 bg-white hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-700 text-zinc-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Cetak Ulang Struk"
          >
            <Printer size={16} />
            <span className="hidden md:inline">Struk</span>
          </button>

          {canVoid && tx.status === 'paid' && (
            <button
              onClick={onVoid}
              className="h-9 px-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-xs font-bold cursor-pointer"
              title="Batalkan Transaksi (Void)"
            >
              <Prohibit size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailModal({
  transaction: tx,
  onClose,
  onPrintReceipt,
}: {
  transaction: Transaction;
  onClose: () => void;
  onPrintReceipt: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl animate-slide-up border border-zinc-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200">
          <div>
            <h3 className="text-base font-bold text-zinc-900">Detail Transaksi</h3>
            <p className="text-xs font-mono font-bold text-zinc-500">#{tx.clientUuid}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs">
            <div>
              <span className="text-zinc-500 block">Waktu Transaksi</span>
              <span className="font-mono font-bold text-zinc-900">{formatDateTime(tx.createdAt)}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Status Transaksi</span>
              <span className={`font-bold ${tx.status === 'paid' ? 'text-emerald-600' : 'text-red-600'}`}>
                {tx.status === 'paid' ? 'Lunas (Paid)' : 'Void (Dibatalkan)'}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block">Tipe Order</span>
              <span className="font-bold text-zinc-900">{orderTypeLabel(tx.tipeOrder)} {tx.table ? `(Meja ${tx.table.nomorMeja})` : ''}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Kasir</span>
              <span className="font-bold text-zinc-900">{tx.shift?.kasir?.nama || 'Kasir'}</span>
            </div>
          </div>

          {/* Itemized Order List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Item Rincian Pesanan</h4>
            <div className="space-y-2 border border-zinc-200 rounded-xl p-3 bg-white">
              {tx.items?.map((item, i) => (
                <div key={i} className="flex justify-between items-start text-xs border-b border-zinc-100 last:border-0 pb-2 last:pb-0">
                  <div>
                    <p className="font-bold text-zinc-900">
                      {item.product?.namaProduk}
                      {item.variant ? ` (${item.variant.namaVarian})` : ''}
                    </p>
                    <p className="text-zinc-500 mt-0.5">
                      {item.jumlah} x {formatRupiah(item.hargaSatuan)}
                    </p>
                    {item.catatan && <p className="text-[11px] text-amber-600 italic mt-0.5">Catatan: {item.catatan}</p>}
                  </div>
                  <span className="font-mono font-bold text-zinc-900">{formatRupiah(item.hargaTotal)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5 text-xs">
            <div className="flex justify-between text-zinc-600">
              <span>Subtotal</span>
              <span className="font-mono font-semibold">{formatRupiah(tx.subtotal)}</span>
            </div>
            {tx.diskon > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Diskon Voucher</span>
                <span className="font-mono">-{formatRupiah(tx.diskon)}</span>
              </div>
            )}
            {tx.pajak > 0 && (
              <div className="flex justify-between text-zinc-600">
                <span>Pajak</span>
                <span className="font-mono">{formatRupiah(tx.pajak)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-zinc-900 pt-2 border-t border-zinc-200">
              <span>Total Akhir</span>
              <span className="font-mono text-emerald-600">{formatRupiah(tx.total)}</span>
            </div>
          </div>

          {/* Payment Detail */}
          {tx.payments?.[0] && (
            <div className="p-3.5 rounded-xl border border-zinc-200 space-y-1 text-xs">
              <div className="flex justify-between text-zinc-600">
                <span>Metode Pembayaran</span>
                <span className="font-bold text-zinc-900 capitalize">{paymentMethodLabel(tx.payments[0].metode)}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Jumlah Dibayar</span>
                <span className="font-mono font-semibold">{formatRupiah(tx.payments[0].jumlahDibayar)}</span>
              </div>
              {tx.payments[0].metode === 'cash' && (
                <div className="flex justify-between font-bold text-emerald-700 pt-1 border-t border-zinc-100">
                  <span>Kembalian</span>
                  <span className="font-mono">{formatRupiah(tx.payments[0].kembalian)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-200 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-zinc-300 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            Tutup
          </button>
          <button
            onClick={onPrintReceipt}
            className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
          >
            <Printer size={18} />
            <span>Cetak Struk</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function VoidModal({
  transaction: tx,
  onClose,
}: {
  transaction: Transaction;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/transactions/${tx.id}/void`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions-history'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl animate-slide-up border border-zinc-200 overflow-hidden p-5 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mx-auto">
          <Prohibit size={28} weight="bold" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-zinc-900">Batalkan Transaksi?</h3>
          <p className="text-xs text-zinc-500 mt-1">
            Transaksi <span className="font-mono font-bold text-zinc-800">#{shortId(tx.clientUuid)}</span> sebesar <span className="font-mono font-bold text-emerald-600">{formatRupiah(tx.total)}</span> akan diubah statusnya menjadi Void.
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
          >
            {mutation.isPending ? <CircleNotch size={16} className="animate-spin" /> : <span>Ya, Void</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReprintModal({
  transaction,
  onClose,
}: {
  transaction: Transaction;
  onClose: () => void;
}) {
  const receiptData: ThermalReceiptData = {
    clientUuid: transaction.clientUuid,
    createdAt: transaction.createdAt,
    kasirNama: transaction.shift?.kasir?.nama || 'Kasir',
    tipeOrder: transaction.tipeOrder,
    nomorMeja: transaction.table?.nomorMeja || null,
    items: transaction.items?.map((i) => ({
      namaProduk: i.product?.namaProduk || 'Produk',
      namaVarian: i.variant?.namaVarian,
      jumlah: i.jumlah,
      hargaSatuan: i.hargaSatuan,
      hargaTotal: i.hargaTotal,
    })) || [],
    subtotal: transaction.subtotal,
    diskon: transaction.diskon,
    pajak: transaction.pajak,
    total: transaction.total,
    payments: transaction.payments?.map((p) => ({
      metode: p.metode,
      jumlahDibayar: p.jumlahDibayar,
      kembalian: p.kembalian,
    })) || [],
  };

  const { ukuranStruk } = useSettingsStore();
  const handlePrint = () => {
    document.body.classList.remove('paper-58mm', 'paper-80mm');
    document.body.classList.add(ukuranStruk === '58mm' ? 'paper-58mm' : 'paper-80mm');
    window.print();
  };

  const printContainer = document.getElementById('thermal-receipt-container');

  return (
    <>
      {printContainer && createPortal(<ThermalReceipt data={receiptData} />, printContainer)}

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-4 overflow-y-auto">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl animate-slide-up border border-zinc-200 overflow-hidden my-8">
          <div className="flex items-center justify-between p-4 border-b border-zinc-200">
            <div>
              <h3 className="text-base font-bold text-zinc-900">Cetak Ulang Struk</h3>
              <p className="text-xs text-zinc-500 font-mono">#{shortId(transaction.clientUuid)}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Live Thermal Receipt Preview */}
            <div className="max-h-80 overflow-y-auto border border-zinc-200 rounded-xl p-2 bg-zinc-50 shadow-inner flex justify-center">
              <ThermalReceipt data={receiptData} />
            </div>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 h-11 rounded-xl border border-zinc-300 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <Printer size={18} />
                <span>Cetak Struk</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
