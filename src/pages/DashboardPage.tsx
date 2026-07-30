import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MagnifyingGlass,
  CalendarBlank,
  SquaresFour,
  ListDashes,
  CheckCircle,
  CircleNotch,
  Clock,
  ArrowRight,
  CaretRight,
  CaretLeft,
  TrendUp,
  User,
  Storefront,
  ForkKnife,
  Sparkle,
  Receipt,
  Check,
  Funnel,
  DotsThree,
} from '@phosphor-icons/react';
import api from '../lib/api';
import { formatRupiah, shortId, formatDateTime } from '../lib/utils';
import type { Transaction } from '../types';

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [carouselIndex, setCarouselIndex] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-transactions'],
    queryFn: async () => {
      const { data } = await api.get('/transactions?limit=1000');
      return data;
    },
    refetchInterval: 5000,
  });

  const transactions: Transaction[] = data?.transactions || [];

  const paidTx = useMemo(() => {
    return transactions.filter((t) => t.status === 'paid');
  }, [transactions]);

  const unpaidTx = useMemo(() => {
    return transactions.filter((t) => t.status === 'unpaid');
  }, [transactions]);

  const filteredTx = useMemo(() => {
    if (!searchQuery) return transactions.slice(0, 5);
    const q = searchQuery.toLowerCase();
    return transactions
      .filter(
        (t) =>
          t.clientUuid.toLowerCase().includes(q) ||
          (t.shift?.kasir?.nama && t.shift.kasir.nama.toLowerCase().includes(q)) ||
          (t.table?.nomorMeja && t.table.nomorMeja.toLowerCase().includes(q))
      )
      .slice(0, 5);
  }, [transactions, searchQuery]);

  // Executive KPI summary calculations
  const totalRevenue = useMemo(() => paidTx.reduce((sum, t) => sum + t.total, 0), [paidTx]);
  const averageOrderValue = paidTx.length > 0 ? Math.round(totalRevenue / paidTx.length) : 0;

  // Active Kitchen Carousel Items
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
      <div className="min-h-[100dvh] bg-[#dce3ea] flex items-center justify-center p-6 font-sans">
        <CircleNotch size={40} className="animate-spin text-zinc-700" />
      </div>
    );
  }

  const activeCard = activeOrders[carouselIndex];

  return (
    <div className="min-h-[100dvh] bg-[#dce3ea] p-4 sm:p-6 lg:p-8 font-sans space-y-6">
      {/* ── 1. Top Executive Control Bar ── */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-3 px-5 shadow-xs border border-white/80 flex items-center justify-between gap-4 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search transactions, staff, items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-full bg-zinc-100/80 text-xs font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:bg-white transition-all border border-transparent"
          />
        </div>

        {/* Live Date Badge */}
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-600 bg-zinc-100 px-4 py-2 rounded-full border border-zinc-200/80">
          <CalendarBlank size={16} className="text-zinc-500" />
          <span>Monday, 31st July 2026</span>
        </div>

        {/* View Mode Toggle Pill */}
        <div className="flex items-center rounded-full bg-zinc-100 p-1 border border-zinc-200">
          <button
            onClick={() => setViewMode('card')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'card'
                ? 'bg-[#0f172a] text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <SquaresFour size={15} />
            <span>Card</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-[#0f172a] text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <ListDashes size={15} />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* ── 2. Main Executive Sales Overview Card ("Last Tasks" Style) ── */}
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.04)] border border-white/80 space-y-6">
        {/* Header with Stats */}
        <div className="flex items-start justify-between flex-wrap gap-4 border-b border-zinc-100 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">Executive Sales Overview</h1>
            <p className="text-xs font-medium text-zinc-400 mt-1">
              <span className="font-bold text-zinc-800">{transactions.length} total transactions</span>, real-time POS & Kitchen activity stream
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center sm:text-right">
              <p className="text-3xl font-extrabold text-zinc-900 tracking-tight font-mono">{paidTx.length}</p>
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">Paid & Done</p>
            </div>
            <div className="h-10 w-px bg-zinc-200" />
            <div className="text-center sm:text-right">
              <p className="text-3xl font-extrabold text-zinc-900 tracking-tight font-mono">{unpaidTx.length}</p>
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">In Progress</p>
            </div>
          </div>
        </div>

        {/* Data Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-zinc-400 font-bold border-b border-zinc-100 pb-3 text-[11px]">
                <th className="py-3 px-3 font-semibold">Transaction ID / Name</th>
                <th className="py-3 px-3 font-semibold">Kasir / Admin</th>
                <th className="py-3 px-3 font-semibold">Table / Type</th>
                <th className="py-3 px-3 font-semibold">Status</th>
                <th className="py-3 px-3 font-semibold">Run Time</th>
                <th className="py-3 px-3 font-semibold text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100/80 font-medium text-zinc-700">
              {filteredTx.map((tx) => (
                <tr key={tx.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="py-4 px-3">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded border border-zinc-300 bg-white flex items-center justify-center">
                        {tx.status === 'paid' && <Check size={10} className="text-emerald-600 font-bold" />}
                      </div>
                      <span className="font-bold text-zinc-900 font-mono">Order #{shortId(tx.clientUuid)}</span>
                    </div>
                  </td>
                  <td className="py-4 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-700">
                        {tx.shift?.kasir?.nama ? tx.shift.kasir.nama.charAt(0) : 'K'}
                      </div>
                      <span className="font-bold text-zinc-800">{tx.shift?.kasir?.nama || 'System Kasir'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-3">
                    <span className="text-zinc-600 font-medium">
                      {tx.table?.nomorMeja ? `Meja ${tx.table.nomorMeja}` : tx.tipeOrder === 'dine_in' ? 'Dine In' : 'Take Away'}
                    </span>
                  </td>
                  <td className="py-4 px-3">
                    {tx.status === 'paid' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                        <CheckCircle size={12} weight="fill" />
                        <span>Done</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 font-bold text-[11px] border border-sky-200">
                        <Clock size={12} />
                        <span>In progress</span>
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-3 text-zinc-500 font-mono">
                    {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-4 px-3 text-right font-mono font-bold text-zinc-900">
                    {formatRupiah(tx.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 3. Bottom Grid (2-Column Grid Layout) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Card: Productivity & Peak Hours Line Chart (7 Columns) */}
        <div className="lg:col-span-7 bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.04)] border border-white/80 space-y-6 flex flex-col justify-between">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Peak Hours Performance</h2>
              <div className="flex items-center gap-4 text-xs mt-1">
                <span className="flex items-center gap-1.5 text-sky-500 font-bold">
                  <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" /> Sales Volume
                </span>
                <span className="flex items-center gap-1.5 text-purple-600 font-bold">
                  <span className="w-2 h-2 rounded-full bg-purple-600 inline-block" /> Revenue Peak
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-zinc-400">Data updates live</span>
              <div className="px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 text-xs font-bold border border-zinc-200">
                08:00 - 22:00
              </div>
            </div>
          </div>

          {/* Multi-Curve Line Graph SVG with Floating Pin */}
          <div className="relative pt-6 pb-2">
            {/* Floating Tooltip Pin */}
            <div className="absolute top-0 left-[48%] -translate-x-1/2 bg-[#0f172a] text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1 z-10">
              <Clock size={12} className="text-sky-400" />
              <span>14:00 (Peak Hours)</span>
            </div>

            <svg className="w-full h-44 overflow-visible" viewBox="0 0 500 150" fill="none">
              {/* Grid Lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="0" y1="70" x2="500" y2="70" stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="0" y1="110" x2="500" y2="110" stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="4 4" />

              {/* Vertical Dotted Focus Indicator */}
              <line x1="240" y1="35" x2="240" y2="135" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx="240" cy="35" r="4" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />

              {/* Cyan / Sky Curve */}
              <path
                d="M0,110 Q75,130 150,70 T300,40 T450,80 T500,60"
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Purple Curve */}
              <path
                d="M0,130 Q75,140 150,110 T300,90 T450,120 T500,100"
                fill="none"
                stroke="#9333ea"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>

            {/* X-Axis Labels */}
            <div className="flex justify-between text-xs font-bold text-zinc-400 mt-2 px-1">
              <span>08:00</span>
              <span>10:00</span>
              <span>12:00</span>
              <span className="text-zinc-900 font-extrabold">14:00</span>
              <span>16:00</span>
              <span>18:00</span>
              <span>20:00</span>
              <span>22:00</span>
            </div>
          </div>
        </div>

        {/* Right Card: High-Contrast Midnight Slate Card ("Live Active Kitchen & Order Flow") (5 Columns) */}
        <div className="lg:col-span-5 bg-[#0f172a] text-white rounded-[2.5rem] p-6 sm:p-8 shadow-xl flex flex-col justify-between relative overflow-hidden">
          {/* Top Title & Controls */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 z-10">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Live Kitchen Stream</h2>
              <p className="text-xs text-slate-400 mt-0.5">Real-time order carousel</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevCarousel}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <CaretLeft size={16} />
              </button>
              <button
                onClick={handleNextCarousel}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <CaretRight size={16} />
              </button>
            </div>
          </div>

          {/* Stacked Interactive Card Carousel Preview */}
          <div className="my-6 relative min-h-[160px] flex items-center justify-center">
            {activeCard ? (
              <div className="w-full bg-white text-zinc-900 rounded-3xl p-5 shadow-2xl border border-white/80 space-y-3 animate-fade-in relative z-10">
                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap text-[11px] font-bold">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {activeCard.table?.nomorMeja ? `Meja ${activeCard.table.nomorMeja}` : activeCard.tipeOrder === 'dine_in' ? 'Dine In' : 'Take Away'}
                  </span>
                  {activeCard.status === 'unpaid' ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      Unpaid QR
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                      Paid & Cooking
                    </span>
                  )}
                </div>

                {/* Main Order Headline */}
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-900 truncate">
                    Order #{shortId(activeCard.clientUuid)}
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono">
                    {new Date(activeCard.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Items Summary */}
                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-700">
                    {activeCard.items?.length || 0} items ordered
                  </span>
                  <span className="font-mono font-extrabold text-emerald-600">
                    {formatRupiah(activeCard.total)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 text-xs">No active orders in stream</div>
            )}

            {/* Backing Card Depth Layers */}
            <div className="absolute top-2 left-3 right-3 h-full bg-slate-800/60 rounded-3xl -z-10 scale-[0.96]" />
            <div className="absolute top-4 left-6 right-6 h-full bg-slate-800/30 rounded-3xl -z-20 scale-[0.92]" />
          </div>

          {/* Footer User / Status Info */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                LIVE
              </div>
              <span>Updating every 5s</span>
            </div>
            <span className="font-mono font-bold text-white">{activeOrders.length} stream queued</span>
          </div>
        </div>
      </div>
    </div>
  );
}
