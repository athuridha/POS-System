import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChartLineUp,
  Clock,
  CurrencyCircleDollar,
  ShoppingBag,
  TrendUp,
  Storefront,
  Fire,
  ArrowUpRight,
  CircleNotch,
  CheckCircle,
} from '@phosphor-icons/react';
import api from '../lib/api';
import { formatRupiah, formatDateTime } from '../lib/utils';
import type { Transaction } from '../types';

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-transactions'],
    queryFn: async () => {
      const { data } = await api.get('/transactions?limit=1000');
      return data;
    },
  });

  const transactions: Transaction[] = data?.transactions || [];

  // Filter paid transactions
  const paidTx = useMemo(() => {
    return transactions.filter((t) => t.status === 'paid');
  }, [transactions]);

  // Executive KPIs
  const totalRevenue = useMemo(() => paidTx.reduce((sum, t) => sum + t.total, 0), [paidTx]);
  const totalCount = paidTx.length;
  const averageOrderValue = totalCount > 0 ? Math.round(totalRevenue / totalCount) : 0;

  // Peak Hours Heatmap (Hourly sales 08:00 - 22:00)
  const peakHoursData = useMemo(() => {
    const hourlyMap: { [hour: number]: { count: number; revenue: number } } = {};
    for (let h = 8; h <= 22; h++) {
      hourlyMap[h] = { count: 0, revenue: 0 };
    }

    paidTx.forEach((t) => {
      const hour = new Date(t.createdAt).getHours();
      if (hourlyMap[hour]) {
        hourlyMap[hour].count += 1;
        hourlyMap[hour].revenue += t.total;
      }
    });

    const maxCount = Math.max(...Object.values(hourlyMap).map((d) => d.count), 1);

    return Object.entries(hourlyMap).map(([h, data]) => ({
      hour: `${h.padStart(2, '0')}:00`,
      hourNum: parseInt(h),
      count: data.count,
      revenue: data.revenue,
      percentage: Math.round((data.count / maxCount) * 100),
    }));
  }, [paidTx]);

  // Top 5 Best-Selling Products
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    paidTx.forEach((t) => {
      t.items?.forEach((item) => {
        const name = item.product?.namaProduk || 'Produk';
        const existing = map.get(name) || { name, qty: 0, revenue: 0 };
        existing.qty += item.jumlah;
        existing.revenue += item.hargaTotal;
        map.set(name, existing);
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [paidTx]);

  // Payment Method Breakdown
  const paymentBreakdown = useMemo(() => {
    const map: { [key: string]: number } = { cash: 0, qris: 0, kartu: 0 };
    paidTx.forEach((t) => {
      t.payments?.forEach((p) => {
        if (map[p.metode] !== undefined) {
          map[p.metode] += p.jumlahDibayar;
        }
      });
    });
    return map;
  }, [paidTx]);

  // Order Type Breakdown
  const orderTypeBreakdown = useMemo(() => {
    const map = { dine_in: 0, take_away: 0 };
    paidTx.forEach((t) => {
      if (t.tipeOrder === 'dine_in') map.dine_in += 1;
      else if (t.tipeOrder === 'take_away') map.take_away += 1;
    });
    return map;
  }, [paidTx]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-zinc-100">
        <CircleNotch size={36} className="animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Executive Analytics & Peak-Hours</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Analisis performa cafe, jam tersibuk kunjungan, dan produk terlaris</p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-500">Total Pendapatan</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CurrencyCircleDollar size={20} weight="duotone" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-zinc-900">{formatRupiah(totalRevenue)}</p>
          <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold mt-1">
            <TrendUp size={14} />
            <span>{totalCount} transaksi berhasil</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-500">Average Order Value (AOV)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <ChartLineUp size={20} weight="duotone" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-zinc-900">{formatRupiah(averageOrderValue)}</p>
          <p className="text-xs text-zinc-400 mt-1">Rata-rata pengeluaran per struk</p>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-500">Tipe Order Terbanyak</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <Storefront size={20} weight="duotone" />
            </div>
          </div>
          <p className="text-2xl font-bold text-zinc-900">
            {orderTypeBreakdown.dine_in >= orderTypeBreakdown.take_away ? 'Dine In' : 'Take Away'}
          </p>
          <p className="text-xs text-zinc-500 mt-1 font-mono font-semibold">
            Dine In ({orderTypeBreakdown.dine_in}) • Take Away ({orderTypeBreakdown.take_away})
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-500">Produk #1 Terlaris</span>
            <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
              <Fire size={20} weight="duotone" />
            </div>
          </div>
          <p className="text-lg font-bold text-zinc-900 truncate">
            {topProducts[0]?.name || 'Belum ada data'}
          </p>
          <p className="text-xs text-zinc-500 mt-1 font-mono font-semibold">
            {topProducts[0] ? `${topProducts[0].qty} cup / porsi terjual` : '-'}
          </p>
        </div>
      </div>

      {/* Main Section: Peak Hours Heatmap Chart */}
      <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Clock size={20} className="text-emerald-600" />
              <span>Analisis Jam Tersibuk Cafe (Peak Hours)</span>
            </h2>
            <p className="text-xs text-zinc-500">Frekuensi transaksi per jam operasional untuk penjadwalan staf</p>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          {peakHoursData.map((d) => (
            <div key={d.hour} className="flex items-center gap-3 text-xs">
              <span className="w-12 font-mono font-bold text-zinc-600 shrink-0">{d.hour}</span>
              <div className="flex-1 bg-zinc-100 rounded-full h-4 overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    d.percentage > 75
                      ? 'bg-gradient-to-r from-orange-500 to-red-500'
                      : d.percentage > 40
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      : 'bg-emerald-300'
                  }`}
                  style={{ width: `${Math.max(d.percentage, 4)}%` }}
                />
              </div>
              <span className="w-24 text-right font-mono font-bold text-zinc-800 shrink-0">
                {d.count} tx ({formatRupiah(d.revenue)})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid Row: Top 5 Best Sellers & Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Best Sellers */}
        <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Fire size={20} className="text-orange-500" />
              <span>Top 5 Produk Terlaris</span>
            </h2>
          </div>

          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-xs text-zinc-400 py-6 text-center">Belum ada transaksi</p>
            ) : (
              topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg font-bold font-mono text-xs flex items-center justify-center ${
                      i === 0 ? 'bg-amber-100 text-amber-800' : 'bg-zinc-200 text-zinc-700'
                    }`}>
                      #{i + 1}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900">{p.name}</p>
                      <p className="text-[11px] text-zinc-500">{p.qty} unit terjual</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-600">
                    {formatRupiah(p.revenue)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <CurrencyCircleDollar size={20} className="text-emerald-600" />
              <span>Breakdown Metode Pembayaran</span>
            </h2>
          </div>

          <div className="space-y-3">
            {[
              { key: 'cash', label: 'Tunai (Cash)', amount: paymentBreakdown.cash, color: 'bg-emerald-500' },
              { key: 'qris', label: 'QRIS / Digital', amount: paymentBreakdown.qris, color: 'bg-blue-500' },
              { key: 'kartu', label: 'Kartu Debit/Kredit EDC', amount: paymentBreakdown.kartu, color: 'bg-purple-500' },
            ].map((method) => {
              const sharePercent = totalRevenue > 0 ? Math.round((method.amount / totalRevenue) * 100) : 0;
              return (
                <div key={method.key} className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-zinc-800">{method.label}</span>
                    <span className="font-mono font-bold text-zinc-900">{formatRupiah(method.amount)} ({sharePercent}%)</span>
                  </div>
                  <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                    <div className={`h-full ${method.color} transition-all duration-500`} style={{ width: `${sharePercent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
