import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChartBar, TrendUp, CurrencyCircleDollar, ShoppingCart } from '@phosphor-icons/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../lib/api';
import { formatRupiah } from '../lib/utils';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'daily' | 'products' | 'cashiers'>('daily');

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Laporan Penjualan</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Analisis performa penjualan dan kasir cafe</p>
      </div>

      {/* Today Stats */}
      <TodayStats />

      {/* Tabs */}
      <div className="flex gap-1 mt-6 mb-4 bg-zinc-200/60 rounded-xl p-1 w-fit border border-zinc-200">
        {[
          { key: 'daily' as const, label: 'Harian' },
          { key: 'products' as const, label: 'Produk Terlaris' },
          { key: 'cashiers' as const, label: 'Per Kasir' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'daily' && <WeeklyChart />}
      {activeTab === 'products' && <TopProducts />}
      {activeTab === 'cashiers' && <CashierReport />}
    </div>
  );
}

function TodayStats() {
  const { data, isLoading } = useQuery({
    queryKey: ['report-daily'],
    queryFn: async () => {
      const { data } = await api.get('/reports/daily');
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Penjualan',
      value: formatRupiah(data?.totalPenjualan || 0),
      icon: CurrencyCircleDollar,
      color: 'text-emerald-600 bg-emerald-100',
    },
    {
      label: 'Total Transaksi',
      value: data?.totalTransaksi || 0,
      icon: ShoppingCart,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      label: 'Rata-rata Order',
      value: formatRupiah(data?.rataRata || 0),
      icon: TrendUp,
      color: 'text-amber-600 bg-amber-100',
    },
    {
      label: 'Total Diskon',
      value: formatRupiah(data?.totalDiskon || 0),
      icon: ChartBar,
      color: 'text-rose-600 bg-rose-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="p-4 rounded-2xl border border-zinc-200 bg-white shadow-xs animate-fade-in"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                <Icon size={18} weight="duotone" />
              </div>
              <span className="text-xs font-semibold text-zinc-500">{stat.label}</span>
            </div>
            <p className="text-lg font-bold font-mono tracking-tight text-zinc-900">{stat.value}</p>
          </div>
        );
      })}
    </div>
  );
}

function WeeklyChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['report-weekly'],
    queryFn: async () => {
      const { data } = await api.get('/reports/weekly');
      return data;
    },
  });

  if (isLoading) return <div className="skeleton h-72 rounded-2xl mt-4" />;

  const chartData = (data?.daily || []).map((d: any) => ({
    date: new Date(d.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
    total: d.total,
    count: d.count,
  }));

  return (
    <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs">
      <h3 className="text-sm font-bold text-zinc-900 mb-4">Tren Penjualan 7 Hari Terakhir</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#71717a' }} stroke="#e4e4e7" />
          <YAxis tick={{ fontSize: 11, fill: '#71717a' }} stroke="#e4e4e7" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            formatter={(value) => formatRupiah(Number(value ?? 0))}
            contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7', fontSize: '12px', fontWeight: 600 }}
          />
          <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TopProducts() {
  const { data, isLoading } = useQuery({
    queryKey: ['report-top-products'],
    queryFn: async () => {
      const { data } = await api.get('/reports/top-products?limit=10');
      return data;
    },
  });

  if (isLoading) return <div className="skeleton h-64 rounded-2xl" />;

  const products = data?.products || [];

  return (
    <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs">
      <h3 className="text-sm font-bold text-zinc-900 mb-4">Produk Terlaris (30 Hari)</h3>
      {products.length === 0 ? (
        <p className="text-sm font-medium text-zinc-400 text-center py-8">Belum ada data penjualan</p>
      ) : (
        <div className="space-y-2">
          {products.map((p: any, i: number) => (
            <div key={p.productId} className="flex items-center gap-3 py-2.5 border-b border-zinc-100 last:border-0">
              <span className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center text-xs font-mono font-bold text-zinc-700">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-zinc-900 truncate">{p.namaProduk}</p>
              </div>
              <span className="text-xs font-semibold text-zinc-500 font-mono">{p.totalTerjual}x terjual</span>
              <span className="text-sm font-mono font-bold text-zinc-900 w-32 text-right">
                {formatRupiah(p.totalPendapatan)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CashierReport() {
  const { data, isLoading } = useQuery({
    queryKey: ['report-cashiers'],
    queryFn: async () => {
      const { data } = await api.get('/reports/by-cashier');
      return data;
    },
  });

  if (isLoading) return <div className="skeleton h-48 rounded-2xl" />;

  const cashiers = data?.cashiers || [];

  return (
    <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs">
      <h3 className="text-sm font-bold text-zinc-900 mb-4">Performa Kasir (30 Hari)</h3>
      {cashiers.length === 0 ? (
        <p className="text-sm font-medium text-zinc-400 text-center py-8">Belum ada data kasir</p>
      ) : (
        <div className="space-y-3">
          {cashiers.map((c: any) => (
            <div key={c.kasirId} className="flex items-center gap-4 py-3 border-b border-zinc-100 last:border-0">
              <div className="w-9 h-9 rounded-full bg-zinc-100 border border-zinc-300 flex items-center justify-center text-xs font-bold text-zinc-700">
                {c.nama.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-zinc-900">{c.nama}</p>
                <p className="text-xs font-medium text-zinc-500">{c.totalShifts} shift • {c.totalTransaksi} transaksi</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-bold text-zinc-900">{formatRupiah(c.totalPenjualan)}</p>
                <p className={`text-xs font-mono font-semibold ${c.totalSelisih >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  Selisih: {c.totalSelisih >= 0 ? '+' : ''}{formatRupiah(c.totalSelisih)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
