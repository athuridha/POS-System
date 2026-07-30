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
  CaretRight,
  CaretLeft,
  Check,
  X,
  ChatCircleText,
  FileText,
  CaretDown,
  User,
  ShoppingBag,
  Sparkle,
  TrendUp,
  Receipt,
  ArrowRight,
} from '@phosphor-icons/react';
import api from '../lib/api';
import { formatRupiah, shortId, formatDateTime } from '../lib/utils';
import type { Transaction } from '../types';

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

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
    if (!searchQuery) return transactions.slice(0, 8);
    const q = searchQuery.toLowerCase();
    return transactions
      .filter(
        (t) =>
          t.clientUuid.toLowerCase().includes(q) ||
          (t.shift?.kasir?.nama && t.shift.kasir.nama.toLowerCase().includes(q)) ||
          (t.table?.nomorMeja && t.table.nomorMeja.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [transactions, searchQuery]);

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
    <div className="min-h-[100dvh] bg-[#dce3ea] p-3 sm:p-6 lg:p-8 font-sans space-y-4 sm:space-y-6 max-w-[1500px] mx-auto">
      {/* ── 1. Top Executive Control Bar (BRESS Style Header) ── */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 px-4 sm:px-6 shadow-xs border border-white/90 flex items-center justify-between gap-3 flex-wrap">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] sm:min-w-[280px]">
          <MagnifyingGlass size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search transactions, staff, items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 sm:h-10 pl-10 pr-4 rounded-full bg-zinc-100/90 text-xs font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:bg-white transition-all border border-transparent"
          />
        </div>

        {/* Live Date Selector Dropdown */}
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 bg-zinc-100/90 px-3.5 py-2 rounded-full border border-zinc-200/80 cursor-pointer hover:bg-zinc-200/60 transition-colors">
          <CalendarBlank size={15} className="text-zinc-500" />
          <span>Monday, 31st July 2026</span>
          <CaretDown size={12} className="text-zinc-400" />
        </div>

        {/* View Mode Toggle Pill (Card / List) */}
        <div className="flex items-center rounded-full bg-zinc-100 p-1 border border-zinc-200/80">
          <button
            onClick={() => setViewMode('card')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
              viewMode === 'card'
                ? 'bg-[#0f172a] text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <SquaresFour size={14} />
            <span>Card</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-[#0f172a] text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <ListDashes size={14} />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* ── 2. Top Main Executive Sales Overview Card ("Last Tasks" BRESS Paradigm) ── */}
      <div className="bg-white rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.04)] border border-white/90 space-y-6">
        {/* Header with Stat Counter Stack */}
        <div className="flex items-start justify-between flex-wrap gap-4 border-b border-zinc-100 pb-5">
          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-zinc-900 tracking-tight">Executive Sales Overview</h1>
            <p className="text-xs sm:text-sm font-medium text-zinc-400 mt-1">
              <span className="font-bold text-zinc-800">{transactions.length} total transactions</span>, proceed to inspect detailed order streams
            </p>
          </div>

          <div className="flex items-center gap-5 sm:gap-8">
            <div className="text-center sm:text-right">
              <p className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight font-mono">{paidTx.length}</p>
              <p className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider mt-0.5">Done / Paid</p>
            </div>
            <div className="h-10 w-px bg-zinc-200/80" />
            <div className="text-center sm:text-right">
              <p className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight font-mono">{unpaidTx.length}</p>
              <p className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider mt-0.5">In Progress</p>
            </div>
          </div>
        </div>

        {/* Data Table View (BRESS Last Tasks Format) */}
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="w-full text-left text-xs border-collapse min-w-[650px]">
            <thead>
              <tr className="text-zinc-400 font-extrabold border-b border-zinc-100 pb-3 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-3 font-bold w-6"></th>
                <th className="py-3 px-3 font-bold">Transaction ID / Name</th>
                <th className="py-3 px-3 font-bold">Kasir / Admin</th>
                <th className="py-3 px-3 font-bold">Table / Type</th>
                <th className="py-3 px-3 font-bold">Status</th>
                <th className="py-3 px-3 font-bold">Run Time</th>
                <th className="py-3 px-3 font-bold text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100/90 font-medium text-zinc-700">
              {filteredTx.map((tx) => (
                <tr
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className="hover:bg-zinc-50/90 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-3">
                    <div className="w-4 h-4 rounded-md border border-zinc-300 bg-white flex items-center justify-center group-hover:border-zinc-500">
                      {tx.status === 'paid' && <Check size={11} className="text-emerald-600 font-extrabold" />}
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-extrabold text-zinc-900 font-mono group-hover:text-emerald-600 group-hover:underline transition-colors">
                      Order #{shortId(tx.clientUuid)}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-200/90 flex items-center justify-center text-[10px] font-extrabold text-zinc-700 shrink-0">
                        {tx.shift?.kasir?.nama ? tx.shift.kasir.nama.charAt(0) : 'K'}
                      </div>
                      <span className="font-bold text-zinc-800 truncate max-w-[130px]">{tx.shift?.kasir?.nama || 'System Kasir'}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="text-zinc-600 font-semibold">
                      {tx.table?.nomorMeja ? `Meja ${tx.table.nomorMeja}` : tx.tipeOrder === 'dine_in' ? 'Dine In' : 'Take Away'}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    {tx.status === 'paid' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[11px] border border-emerald-200/70">
                        <CheckCircle size={13} weight="fill" className="text-emerald-600" />
                        <span>Done</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-700 font-extrabold text-[11px] border border-sky-200/70">
                        <Clock size={13} className="text-sky-600" />
                        <span>In progress</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-zinc-500 font-mono text-xs">
                    {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-black text-zinc-900 text-sm">
                    {formatRupiah(tx.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 3. Bottom Row Grid (2-Column Layout matching BRESS) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
        {/* Left Card: Productivity & Peak Hours Dual-Curve Chart (7 Columns) */}
        <div className="lg:col-span-7 bg-white rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.04)] border border-white/90 space-y-6 flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-zinc-900 tracking-tight">Productivity & Peak Hours</h2>
              <div className="flex items-center gap-4 text-xs mt-1 font-bold">
                <span className="flex items-center gap-1.5 text-sky-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" /> Volume Stream
                </span>
                <span className="flex items-center gap-1.5 text-purple-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" /> Revenue Peak
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-zinc-400 hidden sm:inline">Data updates every 3 hours</span>
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-700 text-xs font-bold border border-zinc-200/80 cursor-pointer">
                <span>01-07 May</span>
                <CaretDown size={11} className="text-zinc-400" />
              </div>
            </div>
          </div>

          {/* SVG Multi-Curve Line Chart */}
          <div className="relative pt-8 pb-2">
            {/* Floating Tooltip Badge Pin */}
            <div className="absolute top-1 left-[48%] -translate-x-1/2 bg-[#0f172a] text-white text-[11px] font-bold px-3 py-1 rounded-xl shadow-xl flex items-center gap-1 z-10">
              <span>3h 10m (Peak: 14:00)</span>
            </div>

            <svg className="w-full h-40 sm:h-48 overflow-visible" viewBox="0 0 500 150" fill="none">
              <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="0" y1="70" x2="500" y2="70" stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="0" y1="110" x2="500" y2="110" stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="4 4" />

              {/* Vertical Guide Line */}
              <line x1="240" y1="35" x2="240" y2="135" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx="240" cy="35" r="4.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="2.5" />

              {/* Curve 1: Sky Cyan */}
              <path
                d="M0,110 Q75,135 150,65 T300,35 T450,75 T500,55"
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Curve 2: Purple */}
              <path
                d="M0,130 Q75,145 150,110 T300,85 T450,115 T500,95"
                fill="none"
                stroke="#9333ea"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>

            {/* X-Axis Labels */}
            <div className="flex justify-between text-xs font-bold text-zinc-400 mt-2 px-1">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span className="text-zinc-900 font-extrabold">Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>
        </div>

        {/* Right Card: High-Contrast Midnight Slate Card ("Projects in progress:" BRESS Style) (5 Columns) */}
        <div className="lg:col-span-5 bg-[#0f172a] text-white rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden min-h-[340px]">
          {/* Top Title & Carousel Controls */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 z-10">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">Live Order Stream</h2>
              <p className="text-xs text-slate-400 mt-0.5">Kitchen & table activity stack</p>
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

          {/* Stacked Physical Card Carousel (Matching BRESS "Projects in progress" Right Widget) */}
          <div className="my-6 relative flex items-center justify-center">
            {activeCard ? (
              <div
                onClick={() => setSelectedTx(activeCard)}
                className="w-full bg-white text-zinc-900 rounded-3xl p-5 shadow-2xl border border-white/90 space-y-4 relative z-10 cursor-pointer hover:scale-[1.01] transition-transform"
              >
                {/* Category Pill Badges (Feedback, Bug, Design System style) */}
                <div className="flex items-center gap-2 flex-wrap text-[11px] font-extrabold">
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                    {activeCard.table?.nomorMeja ? `Meja ${activeCard.table.nomorMeja}` : activeCard.tipeOrder === 'dine_in' ? 'Dine In' : 'Take Away'}
                  </span>
                  {activeCard.status === 'unpaid' ? (
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800">
                      Unpaid QR
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800">
                      Kitchen Processing
                    </span>
                  )}
                </div>

                {/* Card Title */}
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900 tracking-tight">
                    Order #{shortId(activeCard.clientUuid)}
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    {new Date(activeCard.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Micro Meta Footer (Avatars + Item / Notes Count) */}
                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <div className="flex items-center -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-amber-200 border-2 border-white flex items-center justify-center font-extrabold text-[10px] text-amber-800">
                      {activeCard.shift?.kasir?.nama ? activeCard.shift.kasir.nama.charAt(0) : 'K'}
                    </div>
                    <div className="w-6 h-6 rounded-full bg-[#0f172a] text-white border-2 border-white flex items-center justify-center font-extrabold text-[9px]">
                      +{activeCard.items?.length || 1}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-zinc-500 font-bold">
                    <span className="flex items-center gap-1">
                      <ChatCircleText size={14} />
                      <span>{activeCard.items?.length || 0} items</span>
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600 font-mono font-extrabold">
                      {formatRupiah(activeCard.total)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 text-xs py-8">No active orders in stream</div>
            )}

            {/* Overlapping Backing Card Depth Layers */}
            <div className="absolute top-2 left-3 right-3 h-full bg-slate-800/70 rounded-3xl -z-10 scale-[0.96]" />
            <div className="absolute top-4 left-6 right-6 h-full bg-slate-800/40 rounded-3xl -z-20 scale-[0.92]" />
          </div>

          {/* Footer User / Status Info */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live stream updates</span>
            </div>
            <span className="font-mono font-bold text-white">{activeOrders.length} queued</span>
          </div>
        </div>
      </div>

      {/* ── 4. Transaction Detail Modal (Frosted Glass Overlay) ── */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/60 backdrop-blur-xs font-sans animate-fade-in">
          <div className="bg-white rounded-3xl sm:rounded-[2.5rem] shadow-2xl border border-zinc-100 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-[#0f172a] text-white flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-extrabold tracking-tight">Order #{shortId(selectedTx.clientUuid)}</span>
                  {selectedTx.status === 'paid' ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-500/30">PAID</span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold border border-amber-500/30">UNPAID</span>
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

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Meta Info Grid */}
              <div className="grid grid-cols-2 gap-3 bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200/80">
                <div>
                  <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Kasir / User</p>
                  <p className="font-bold text-zinc-900 mt-0.5">{selectedTx.shift?.kasir?.nama || 'System Kasir'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Meja / Tipe</p>
                  <p className="font-bold text-zinc-900 mt-0.5">
                    {selectedTx.table?.nomorMeja ? `Meja ${selectedTx.table.nomorMeja}` : selectedTx.tipeOrder === 'dine_in' ? 'Dine In' : 'Take Away'}
                  </p>
                </div>
              </div>

              {/* Items Breakdown Table */}
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

              {/* Pricing & Financial Summary */}
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

              {/* Payment Details */}
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

            {/* Modal Footer */}
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
