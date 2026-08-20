import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle,
  CircleNotch,
  Clock,
  CaretRight,
  CaretLeft,
  Check,
  X,
  CaretDown,
  TrendUp,
  Receipt,
  Coins,
  Coffee,
  Table as TableIcon,
} from '@phosphor-icons/react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../lib/api';
import { formatRupiah, formatDateTime } from '../lib/utils';
import type { Transaction } from '../types';

interface DashboardContextType {
  dateFilter?: 'today' | '7days' | '30days' | 'all';
  headerSearch?: string;
}

export default function DashboardPage() {
  const context = useOutletContext<DashboardContextType>() || {};
  const dateFilter = context.dateFilter || 'all';
  const headerSearch = context.headerSearch || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [chartPeriod, setChartPeriod] = useState<'today' | '7days' | '30days' | 'all' | null>(null);
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  const effectiveChartPeriod = chartPeriod || dateFilter || 'all';

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-transactions'],
    queryFn: async () => {
      const { data } = await api.get('/transactions?limit=1000');
      return data;
    },
    refetchInterval: 5000,
  });

  const rawTransactions: Transaction[] = data?.transactions || [];

  // Filter transactions based on dateFilter from header (Today, 7 Days, 30 Days, All)
  const transactions = useMemo(() => {
    if (dateFilter === 'all') return rawTransactions;
    const now = new Date();
    if (dateFilter === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      return rawTransactions.filter((t) => new Date(t.createdAt).getTime() >= startOfDay);
    }
    if (dateFilter === '7days') {
      const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
      return rawTransactions.filter((t) => new Date(t.createdAt).getTime() >= sevenDaysAgo);
    }
    if (dateFilter === '30days') {
      const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
      return rawTransactions.filter((t) => new Date(t.createdAt).getTime() >= thirtyDaysAgo);
    }
    return rawTransactions;
  }, [rawTransactions, dateFilter]);

  // Real DB Paid & Unpaid filter
  const paidTx = useMemo(() => {
    return transactions.filter((t) => t.status === 'paid');
  }, [transactions]);

  const unpaidTx = useMemo(() => {
    return transactions.filter((t) => t.status === 'unpaid');
  }, [transactions]);

  // Real DB Total Omset calculation
  const totalOmset = useMemo(() => {
    return paidTx.reduce((sum, t) => sum + (t.total || 0), 0);
  }, [paidTx]);

  // Real DB Average Spend per Order
  const avgOrderValue = useMemo(() => {
    if (paidTx.length === 0) return 0;
    return Math.round(totalOmset / paidTx.length);
  }, [paidTx, totalOmset]);

  // Real DB Best Seller Menu Calculation
  const bestSeller = useMemo(() => {
    const counts: Record<string, { name: string; qty: number }> = {};
    transactions.forEach((tx) => {
      tx.items?.forEach((item) => {
        const name = item.product?.namaProduk || 'Item Cafe';
        if (!counts[name]) {
          counts[name] = { name, qty: 0 };
        }
        counts[name].qty += item.jumlah || 1;
      });
    });

    const sorted = Object.values(counts).sort((a, b) => b.qty - a.qty);
    return sorted[0] || null;
  }, [transactions]);

  // ─── Real Database Hourly Peak Calculation ──────────────────────
  const { hourlyData, peakHourSummary } = useMemo(() => {
    const hourBuckets = [
      { slot: '08:00', startH: 7, endH: 9, orders: 0, omset: 0 },
      { slot: '10:00', startH: 9, endH: 11, orders: 0, omset: 0 },
      { slot: '12:00', startH: 11, endH: 13, orders: 0, omset: 0 },
      { slot: '14:00', startH: 13, endH: 15, orders: 0, omset: 0 },
      { slot: '16:00', startH: 15, endH: 17, orders: 0, omset: 0 },
      { slot: '18:00', startH: 17, endH: 19, orders: 0, omset: 0 },
      { slot: '20:00', startH: 19, endH: 21, orders: 0, omset: 0 },
      { slot: '22:00', startH: 21, endH: 24, orders: 0, omset: 0 },
    ];

    let filteredForChart = rawTransactions;
    const now = new Date();
    if (effectiveChartPeriod === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      filteredForChart = rawTransactions.filter((t) => new Date(t.createdAt).getTime() >= startOfDay);
    } else if (effectiveChartPeriod === '7days') {
      const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
      filteredForChart = rawTransactions.filter((t) => new Date(t.createdAt).getTime() >= sevenDaysAgo);
    } else if (effectiveChartPeriod === '30days') {
      const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
      filteredForChart = rawTransactions.filter((t) => new Date(t.createdAt).getTime() >= thirtyDaysAgo);
    }

    filteredForChart.forEach((tx) => {
      const d = new Date(tx.createdAt);
      const h = d.getHours();
      const bucket = hourBuckets.find((b) => h >= b.startH && h < b.endH) || hourBuckets[hourBuckets.length - 1];
      bucket.orders += 1;
      if (tx.status === 'paid') {
        bucket.omset += tx.total || 0;
      }
    });

    let maxBucket = hourBuckets[0];
    hourBuckets.forEach((b) => {
      if (b.orders > maxBucket.orders || (b.orders === maxBucket.orders && b.omset > maxBucket.omset)) {
        maxBucket = b;
      }
    });

    const summary = maxBucket.orders > 0
      ? `Jam Puncak: ${maxBucket.slot} (${maxBucket.orders} Order • ${formatRupiah(maxBucket.omset)})`
      : 'Jam Puncak: Belum Ada Data Order';

    return {
      hourlyData: hourBuckets.map((b) => ({
        jam: b.slot,
        orders: b.orders,
        omset: b.omset,
      })),
      peakHourSummary: summary,
    };
  }, [rawTransactions, effectiveChartPeriod]);

  const chartPeriodLabel = useMemo(() => {
    if (effectiveChartPeriod === 'today') {
      return `Hari Ini (${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})`;
    }
    if (effectiveChartPeriod === '7days') return '7 Hari Terakhir';
    if (effectiveChartPeriod === '30days') return '30 Hari Terakhir';
    return 'Semua Waktu';
  }, [effectiveChartPeriod]);

  // Unique Order ID Generator from DB Record
  const getOrderDisplayId = (tx: Transaction) => {
    if (tx.clientUuid === 'QR-ORDER' || !tx.clientUuid || tx.clientUuid.length < 8) {
      return `ORD-${tx.id.substring(tx.id.length - 6).toUpperCase()}`;
    }
    return `ORD-${tx.clientUuid.substring(0, 6).toUpperCase()}`;
  };

  const filteredTx = useMemo(() => {
    const effectiveQuery = (headerSearch || searchQuery).toLowerCase().trim();
    if (!effectiveQuery) return transactions.slice(0, 10);
    return transactions
      .filter(
        (t) =>
          getOrderDisplayId(t).toLowerCase().includes(effectiveQuery) ||
          t.clientUuid.toLowerCase().includes(effectiveQuery) ||
          (t.shift?.kasir?.nama && t.shift.kasir.nama.toLowerCase().includes(effectiveQuery)) ||
          (t.table?.nomorMeja && t.table.nomorMeja.toLowerCase().includes(effectiveQuery))
      )
      .slice(0, 10);
  }, [transactions, searchQuery, headerSearch]);

  const activeOrders = useMemo(() => {
    return transactions.slice(0, 6);
  }, [transactions]);

  const handleNextCarousel = () => {
    setCarouselIndex((prev) => (prev + 1) % Math.max(1, activeOrders.length));
  };

  const handlePrevCarousel = () => {
    setCarouselIndex((prev) => (prev - 1 + activeOrders.length) % Math.max(1, activeOrders.length));
  };

  if (isLoading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center p-6 font-sans">
        <CircleNotch size={40} className="animate-spin text-zinc-700" />
      </div>
    );
  }

  const activeCard = activeOrders[carouselIndex];

  return (
    <div className="space-y-6 font-sans">
      {/* ── 1. Top Executive Metric Cards (Calculated Dynamically from Database) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Omset (Real DB Sum) */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-white space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-extrabold uppercase tracking-wider">Total Omset</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Coins size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-zinc-900 font-mono tracking-tight">{formatRupiah(totalOmset)}</p>
            <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold mt-1">
              <TrendUp size={14} weight="bold" />
              <span>{paidTx.length} transaksi terbayar</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Total Transaksi (Real DB Count) */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-white space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-extrabold uppercase tracking-wider">Total Transaksi</span>
            <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <Receipt size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-zinc-900 font-mono tracking-tight">{transactions.length} Order</p>
            <p className="text-xs text-zinc-400 font-semibold mt-1">
              <span className="text-emerald-600 font-bold">{paidTx.length} Lunas</span> • <span className="text-amber-600 font-bold">{unpaidTx.length} Belum Bayar</span>
            </p>
          </div>
        </div>

        {/* Metric 3: Rata-Rata Order Value (Real DB Basket Size) */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-white space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-extrabold uppercase tracking-wider">Rata-Rata Basket Size</span>
            <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <TableIcon size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-zinc-900 font-mono tracking-tight">{formatRupiah(avgOrderValue)}</p>
            <p className="text-xs text-zinc-400 font-semibold mt-1">Rata-rata per transaksi</p>
          </div>
        </div>

        {/* Metric 4: Real Database Best Seller Item */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-white space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-extrabold uppercase tracking-wider">Menu Terlaris</span>
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Coffee size={18} />
            </div>
          </div>
          <div>
            <p className="text-lg font-extrabold text-zinc-900 truncate">
              {bestSeller ? bestSeller.name : 'Belum Ada Data'}
            </p>
            <p className="text-xs text-emerald-600 font-extrabold mt-1">
              {bestSeller ? `${bestSeller.qty} Porsi Terjual` : '0 Porsi Terjual'}
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. Main Sales & Order Stream Card (Dynamic DB Transactions) ── */}
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-white space-y-6">
        {/* Card Header with Big Numbers */}
        <div className="flex items-start justify-between flex-wrap gap-4 border-b border-zinc-100 pb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">Executive Sales Overview</h1>
            <p className="text-xs sm:text-sm font-semibold text-zinc-400 mt-1">
              <span className="font-bold text-zinc-800">{transactions.length} total pesanan</span>, siap diproses & dipantau kasir
            </p>
          </div>

          <div className="flex items-center gap-6 sm:gap-8">
            <div className="text-center sm:text-right">
              <p className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight font-mono">{paidTx.length}</p>
              <p className="text-[11px] font-extrabold text-emerald-600 uppercase tracking-wider mt-0.5">LUNAS / DONE</p>
            </div>
            <div className="h-10 w-px bg-zinc-200/80" />
            <div className="text-center sm:text-right">
              <p className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight font-mono">{unpaidTx.length}</p>
              <p className="text-[11px] font-extrabold text-amber-600 uppercase tracking-wider mt-0.5">BELUM BAYAR</p>
            </div>
          </div>
        </div>

        {/* Cafe Sales Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="text-zinc-400 font-bold border-b border-zinc-100 pb-3 text-[11px]">
                <th className="py-3 px-3 font-semibold w-8"></th>
                <th className="py-3 px-3 font-semibold">NO. TRANSAKSI</th>
                <th className="py-3 px-3 font-semibold">KASIR / OPERATOR</th>
                <th className="py-3 px-3 font-semibold">MEJA / TIPE</th>
                <th className="py-3 px-3 font-semibold">STATUS PEMBAYARAN</th>
                <th className="py-3 px-3 font-semibold">JAM ORDER</th>
                <th className="py-3 px-3 font-semibold text-right">TOTAL PEMBAYARAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100/80 font-medium text-zinc-700">
              {filteredTx.map((tx) => {
                const orderIdStr = getOrderDisplayId(tx);
                const orderTimeStr = new Date(tx.createdAt).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="hover:bg-zinc-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-3">
                      <div className="w-4 h-4 rounded border border-zinc-300 bg-white flex items-center justify-center group-hover:border-zinc-500">
                        {tx.status === 'paid' && <Check size={10} className="text-emerald-600 font-bold" />}
                      </div>
                    </td>
                    <td className="py-4 px-3 font-extrabold text-zinc-900 group-hover:text-emerald-600 transition-colors font-mono">
                      {orderIdStr}
                    </td>
                    <td className="py-4 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-[10px] font-extrabold text-amber-900 shrink-0">
                          {tx.shift?.kasir?.nama ? tx.shift.kasir.nama.charAt(0) : 'K'}
                        </div>
                        <span className="font-bold text-zinc-800">{tx.shift?.kasir?.nama || 'Kasir System'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-3 font-semibold text-zinc-700">
                      {tx.table?.nomorMeja ? `Meja ${tx.table.nomorMeja}` : tx.tipeOrder === 'dine_in' ? 'Dine In' : 'Take Away'}
                    </td>
                    <td className="py-4 px-3">
                      {tx.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200/60">
                          <CheckCircle size={13} weight="fill" className="text-emerald-600" />
                          <span>Lunas</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 font-bold text-[11px] border border-amber-200/60">
                          <Clock size={13} className="text-amber-600" />
                          <span>Belum Bayar</span>
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-3 text-zinc-500 font-mono">
                      {orderTimeStr} WIB
                    </td>
                    <td className="py-4 px-3 text-right font-mono font-extrabold text-zinc-900">
                      {formatRupiah(tx.total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 3. Bottom Row Grid (Peak Hours Analytics + Live Kitchen Order Stream) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Card: "Peak Hours Performance" Chart Widget (7 Columns) */}
        <div className="lg:col-span-7 bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-white flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Peak Hours Performance</h2>
              <div className="flex items-center gap-4 text-xs mt-1 font-bold">
                <span className="flex items-center gap-1.5 text-sky-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" /> Volume Order (Struk)
                </span>
                <span className="flex items-center gap-1.5 text-purple-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" /> Omset Penjualan (Rp)
                </span>
              </div>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800 text-xs font-bold border border-zinc-200/80 transition-colors cursor-pointer shadow-xs"
              >
                <span className="text-[11px] text-zinc-400 font-semibold">Periode:</span>
                <span>{chartPeriodLabel}</span>
                <CaretDown size={12} className={`text-zinc-500 transition-transform ${showPeriodDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showPeriodDropdown && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-zinc-200 py-1.5 z-30 animate-fade-in text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => { setChartPeriod('today'); setShowPeriodDropdown(false); }}
                    className={`w-full text-left px-3.5 py-2 hover:bg-zinc-50 cursor-pointer ${effectiveChartPeriod === 'today' ? 'text-emerald-700 bg-emerald-50 font-extrabold' : 'text-zinc-700'}`}
                  >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => { setChartPeriod('7days'); setShowPeriodDropdown(false); }}
                    className={`w-full text-left px-3.5 py-2 hover:bg-zinc-50 cursor-pointer ${effectiveChartPeriod === '7days' ? 'text-emerald-700 bg-emerald-50 font-extrabold' : 'text-zinc-700'}`}
                  >
                    7 Hari Terakhir
                  </button>
                  <button
                    type="button"
                    onClick={() => { setChartPeriod('30days'); setShowPeriodDropdown(false); }}
                    className={`w-full text-left px-3.5 py-2 hover:bg-zinc-50 cursor-pointer ${effectiveChartPeriod === '30days' ? 'text-emerald-700 bg-emerald-50 font-extrabold' : 'text-zinc-700'}`}
                  >
                    30 Hari Terakhir
                  </button>
                  <button
                    type="button"
                    onClick={() => { setChartPeriod('all'); setShowPeriodDropdown(false); }}
                    className={`w-full text-left px-3.5 py-2 hover:bg-zinc-50 cursor-pointer ${effectiveChartPeriod === 'all' ? 'text-emerald-700 bg-emerald-50 font-extrabold' : 'text-zinc-700'}`}
                  >
                    Semua Waktu
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Peak Hour Highlight Pill */}
          <div className="flex items-center justify-center pt-1">
            <div className="bg-[#0f172a] text-white text-[11px] font-bold px-3.5 py-1.5 rounded-xl shadow-md flex items-center gap-1.5">
              <span>{peakHourSummary}</span>
            </div>
          </div>

          {/* Real Dynamic Recharts Area Chart */}
          <div className="w-full h-52 pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="orderGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="omsetGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="jam" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} stroke="#e2e8f0" tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#0ea5e9', fontWeight: 700 }} stroke="#e2e8f0" tickLine={false} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" hide />
                <Tooltip
                  formatter={(value: any, name: any) => {
                    if (name === 'Volume Order') return [`${value} Transaksi`, 'Volume Order'];
                    return [formatRupiah(Number(value) || 0), 'Omset'];
                  }}
                  contentStyle={{
                    borderRadius: '16px',
                    backgroundColor: '#0f172a',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="orders"
                  name="Volume Order"
                  stroke="#0ea5e9"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#orderGradient)"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="omset"
                  name="Omset"
                  stroke="#9333ea"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#omsetGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Card: Live Order & Kitchen Activity Stream (5 Columns) */}
        <div className="lg:col-span-5 bg-[#0d1527] text-white rounded-[2.5rem] p-6 sm:p-8 shadow-xl flex flex-col justify-between relative overflow-hidden min-h-[320px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 z-10">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Live Order Stream</h2>
              <p className="text-[11px] text-slate-400 font-semibold">Antrean & aktivitas pesanan dapur</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevCarousel}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                title="Sebelumnya"
              >
                <CaretLeft size={16} weight="bold" />
              </button>
              <button
                onClick={handleNextCarousel}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                title="Berikutnya"
              >
                <CaretRight size={16} weight="bold" />
              </button>
            </div>
          </div>

          {/* Stacked Cards Layout displaying real live active orders */}
          <div className="my-4 relative flex items-center justify-between gap-4">
            {activeCard ? (
              <div
                onClick={() => setSelectedTx(activeCard)}
                className="w-full bg-white text-zinc-900 rounded-3xl p-5 shadow-2xl border border-white space-y-3.5 relative z-10 cursor-pointer hover:scale-[1.01] transition-transform"
              >
                {/* Pill Badges (Meja/Order Type, Status) */}
                <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] font-extrabold">
                  <div className="flex items-center gap-1.5">
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {activeCard.table?.nomorMeja ? `Meja ${activeCard.table.nomorMeja}` : activeCard.tipeOrder === 'dine_in' ? 'Dine In' : 'Take Away'}
                    </span>
                    {activeCard.status === 'paid' ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        Selesai
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        Belum Dibayar
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono font-medium">
                    {formatDateTime(activeCard.createdAt).split(',')[1] || 'Just now'}
                  </span>
                </div>

                {/* Order Name & Main Items Preview */}
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900 tracking-tight">
                    {getOrderDisplayId(activeCard)}
                  </h3>
                  <p className="text-xs text-zinc-500 font-semibold line-clamp-1 mt-0.5">
                    {activeCard.items?.map((i) => `${i.jumlah}x ${i.product?.namaProduk || 'Item'}`).join(', ') || '3 items order'}
                  </p>
                </div>

                {/* Micro Meta Footer */}
                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center font-black text-[10px] text-amber-900">
                      {activeCard.shift?.kasir?.nama ? activeCard.shift.kasir.nama.charAt(0) : 'K'}
                    </div>
                    <span className="text-xs font-bold text-zinc-700 truncate max-w-[100px]">
                      {activeCard.shift?.kasir?.nama || 'Kasir'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono font-black text-emerald-600 text-sm">
                    {formatRupiah(activeCard.total)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 text-xs py-8 w-full">Tidak ada antrean pesanan aktif</div>
            )}

            {/* Sliding Stacked Card Backing Layers */}
            <div className="absolute top-2 left-4 right-8 h-full bg-slate-800/80 rounded-3xl -z-10 scale-[0.96]" />
            <div className="absolute top-4 left-8 right-12 h-full bg-slate-800/50 rounded-3xl -z-20 scale-[0.92]" />

            {/* Floating Action Arrow */}
            <button
              onClick={handleNextCarousel}
              className="w-10 h-10 rounded-full bg-white text-zinc-900 shadow-xl flex items-center justify-center hover:bg-zinc-100 transition-colors shrink-0 z-20 cursor-pointer border border-zinc-200 ml-2"
              title="Pesanan Berikutnya"
            >
              <CaretRight size={18} weight="bold" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. Transaction Detail Modal (Frosted Glass Overlay) ── */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs font-sans animate-fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-zinc-100 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-[#0f172a] text-white flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-extrabold tracking-tight">{getOrderDisplayId(selectedTx)}</span>
                  {selectedTx.status === 'paid' ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-500/30">LUNAS</span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold border border-amber-500/30">BELUM BAYAR</span>
                  )}
                </div>
                <p className="text-xs text-zinc-400">{formatDateTime(selectedTx.createdAt)}</p>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200/80">
                <div>
                  <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Kasir / Operator</p>
                  <p className="font-bold text-zinc-900 mt-0.5">{selectedTx.shift?.kasir?.nama || 'System Kasir'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Meja / Tipe</p>
                  <p className="font-bold text-zinc-900 mt-0.5">
                    {selectedTx.table?.nomorMeja ? `Meja ${selectedTx.table.nomorMeja}` : selectedTx.tipeOrder === 'dine_in' ? 'Dine In' : 'Take Away'}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-extrabold text-zinc-900 text-xs mb-2.5">Rincian Item Pesanan</h4>
                <div className="divide-y divide-zinc-100 border-t border-b border-zinc-100">
                  {selectedTx.items?.map((item) => (
                    <div key={item.id || item.productId} className="py-2.5 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="font-extrabold text-zinc-900">{item.product?.namaProduk || 'Produk'}</p>
                        {item.variant && (
                          <p className="text-[11px] text-zinc-500 font-medium">Varian: {item.variant.namaVarian}</p>
                        )}
                        {item.catatan && (
                          <p className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded italic w-fit">
                            Catatan: {item.catatan}
                          </p>
                        )}
                        <p className="text-[11px] text-zinc-400 font-mono">
                          {item.jumlah} x {formatRupiah(item.hargaSatuan)}
                        </p>
                      </div>
                      <p className="font-mono font-black text-zinc-900 text-sm">
                        {formatRupiah(item.hargaTotal)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-100 font-medium">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatRupiah(selectedTx.subtotal)}</span>
                </div>
                {selectedTx.diskon > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Diskon / Voucher</span>
                    <span className="font-mono">-{formatRupiah(selectedTx.diskon)}</span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-900 font-black text-base pt-2 border-t border-zinc-200">
                  <span>Total Tagihan</span>
                  <span className="font-mono text-emerald-600">{formatRupiah(selectedTx.total)}</span>
                </div>
              </div>

              {selectedTx.payments && selectedTx.payments.length > 0 && (
                <div className="bg-emerald-50/70 border border-emerald-200/80 p-3.5 rounded-2xl space-y-1.5">
                  <p className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">Detail Pembayaran</p>
                  {selectedTx.payments.map((p, idx) => (
                    <div key={idx} className="flex justify-between text-emerald-950 font-bold text-xs">
                      <span className="capitalize">{p.metode}</span>
                      <span className="font-mono">{formatRupiah(p.jumlahDibayar)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-5 py-2.5 rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
