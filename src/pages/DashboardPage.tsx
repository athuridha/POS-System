import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MagnifyingGlass,
  CalendarBlank,
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
  WifiHigh,
  WifiSlash,
} from '@phosphor-icons/react';
import api from '../lib/api';
import { formatRupiah, shortId, formatDateTime } from '../lib/utils';
import type { Transaction } from '../types';
import { useAuthStore } from '../stores/authStore';

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | '30days' | 'all'>('all');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-transactions'],
    queryFn: async () => {
      const { data } = await api.get('/transactions?limit=1000');
      return data;
    },
    refetchInterval: 5000,
  });

  const transactions: Transaction[] = data?.transactions || [];

  // Filter transactions dynamically based on active date range
  const dateFilteredTx = useMemo(() => {
    const now = new Date();
    return transactions.filter((t) => {
      const txDate = new Date(t.createdAt);
      if (dateFilter === 'today') {
        return txDate.toDateString() === now.toDateString();
      }
      if (dateFilter === '7days') {
        const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      }
      if (dateFilter === '30days') {
        const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 30;
      }
      return true;
    });
  }, [transactions, dateFilter]);

  const paidTx = useMemo(() => {
    return dateFilteredTx.filter((t) => t.status === 'paid');
  }, [dateFilteredTx]);

  const unpaidTx = useMemo(() => {
    return dateFilteredTx.filter((t) => t.status === 'unpaid');
  }, [dateFilteredTx]);

  const filteredTx = useMemo(() => {
    if (!searchQuery) return dateFilteredTx.slice(0, 5);
    const q = searchQuery.toLowerCase();
    return dateFilteredTx
      .filter(
        (t) =>
          t.clientUuid.toLowerCase().includes(q) ||
          (t.shift?.kasir?.nama && t.shift.kasir.nama.toLowerCase().includes(q)) ||
          (t.table?.nomorMeja && t.table.nomorMeja.toLowerCase().includes(q))
      )
      .slice(0, 5);
  }, [dateFilteredTx, searchQuery]);

  const activeOrders = useMemo(() => {
    return dateFilteredTx.slice(0, 6);
  }, [dateFilteredTx]);

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
      {/* ── 1. Top Search Header Card (Exact BRESS Search Bar with Functional Date Selector) ── */}
      <div className="bg-white rounded-[2rem] p-4 px-6 shadow-sm border border-white flex items-center justify-between gap-4 flex-wrap">
        {/* Search Bar Input */}
        <div className="relative flex-1 min-w-[220px]">
          <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-11 pr-4 rounded-full bg-[#f1f5f9]/70 text-xs font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:bg-white transition-all border border-transparent"
          />
        </div>

        {/* Date Selector Dropdown Button & Interactive Range Menu */}
        <div className="relative">
          <button
            onClick={() => setShowDateDropdown(!showDateDropdown)}
            className="flex items-center gap-2 text-xs font-bold text-zinc-700 bg-[#f1f5f9]/70 px-4 py-2.5 rounded-full border border-transparent hover:bg-zinc-200/50 transition-colors cursor-pointer"
          >
            <CalendarBlank size={16} className="text-zinc-500" />
            <span>
              {dateFilter === 'today'
                ? `Hari Ini (${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})`
                : dateFilter === '7days'
                ? '7 Hari Terakhir'
                : dateFilter === '30days'
                ? '30 Hari Terakhir'
                : 'Semua Waktu'}
            </span>
            <CaretDown size={12} className={`text-zinc-400 transition-transform ${showDateDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Interactive Date Filter Dropdown */}
          {showDateDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-zinc-100 py-2 z-30 font-sans animate-fade-in">
              <button
                onClick={() => { setDateFilter('today'); setShowDateDropdown(false); }}
                className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
                  dateFilter === 'today' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                Hari Ini
              </button>
              <button
                onClick={() => { setDateFilter('7days'); setShowDateDropdown(false); }}
                className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
                  dateFilter === '7days' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                7 Hari Terakhir
              </button>
              <button
                onClick={() => { setDateFilter('30days'); setShowDateDropdown(false); }}
                className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
                  dateFilter === '30days' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                30 Hari Terakhir
              </button>
              <button
                onClick={() => { setDateFilter('all'); setShowDateDropdown(false); }}
                className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
                  dateFilter === 'all' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                Semua Waktu
              </button>
            </div>
          )}
        </div>

        {/* User Profile Info & Status */}
        <div className="flex items-center gap-3 border-l border-zinc-100 pl-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold border border-emerald-200/60">
            <WifiHigh size={14} weight="bold" />
            <span>Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
              {user?.nama?.charAt(0) || 'A'}
            </div>
            <span className="text-xs font-extrabold text-zinc-800 hidden sm:inline">{user?.nama || 'Admin'}</span>
          </div>
        </div>
      </div>

      {/* ── 2. "Last tasks" Main Card (Exact BRESS 1-to-1) ── */}
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-white space-y-6">
        {/* Card Header with Big Numbers */}
        <div className="flex items-start justify-between flex-wrap gap-4 border-b border-zinc-100 pb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">Last tasks</h1>
            <p className="text-xs sm:text-sm font-semibold text-zinc-400 mt-1">
              <span className="font-bold text-zinc-800">{dateFilteredTx.length} total</span>, proceed to resolve them
            </p>
          </div>

          <div className="flex items-center gap-6 sm:gap-8">
            <div className="text-center sm:text-right">
              <p className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight font-mono">{paidTx.length}</p>
              <p className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider mt-0.5">Done</p>
            </div>
            <div className="h-10 w-px bg-zinc-200/80" />
            <div className="text-center sm:text-right">
              <p className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight font-mono">{unpaidTx.length}</p>
              <p className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider mt-0.5">In progress</p>
            </div>
          </div>
        </div>

        {/* BRESS Tasks Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="text-zinc-400 font-bold border-b border-zinc-100 pb-3 text-[11px]">
                <th className="py-3 px-3 font-semibold w-8"></th>
                <th className="py-3 px-3 font-semibold">Name</th>
                <th className="py-3 px-3 font-semibold">Admin</th>
                <th className="py-3 px-3 font-semibold">Members</th>
                <th className="py-3 px-3 font-semibold">Status</th>
                <th className="py-3 px-3 font-semibold">Run time</th>
                <th className="py-3 px-3 font-semibold text-right">Finish date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100/80 font-medium text-zinc-700">
              {filteredTx.map((tx, idx) => (
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
                  <td className="py-4 px-3 font-extrabold text-zinc-900 group-hover:text-emerald-600 transition-colors">
                    Order #{shortId(tx.clientUuid)}
                  </td>
                  <td className="py-4 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-[10px] font-extrabold text-amber-900 shrink-0">
                        {tx.shift?.kasir?.nama ? tx.shift.kasir.nama.charAt(0) : 'K'}
                      </div>
                      <span className="font-bold text-zinc-800">{tx.shift?.kasir?.nama || 'Samanta J.'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-3 font-mono font-bold text-zinc-600">
                    {tx.items?.length || 3}
                  </td>
                  <td className="py-4 px-3">
                    {tx.status === 'paid' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200/60">
                        <CheckCircle size={13} weight="fill" className="text-emerald-600" />
                        <span>Done</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-700 font-bold text-[11px] border border-sky-200/60">
                        <Clock size={13} className="text-sky-600" />
                        <span>In progress</span>
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-3 text-zinc-500 font-mono">
                    {idx === 0 ? '6 hours' : idx === 1 ? '2 hours' : idx === 2 ? '3 days' : '1 week'}
                  </td>
                  <td className="py-4 px-3 text-right font-mono font-extrabold text-zinc-900">
                    {formatRupiah(tx.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 3. Bottom Row Grid (2 Columns matching BRESS 1-to-1) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Card: "Productivity" Chart Widget (7 Columns) */}
        <div className="lg:col-span-7 bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-white flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Productivity</h2>
              <div className="flex items-center gap-4 text-xs mt-1 font-bold">
                <span className="flex items-center gap-1.5 text-sky-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" /> Research
                </span>
                <span className="flex items-center gap-1.5 text-purple-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" /> Design
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-zinc-400">Data updates every 3 hours</span>
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-700 text-xs font-bold border border-zinc-200/80 cursor-pointer">
                <span>01-07 May</span>
                <CaretDown size={11} className="text-zinc-400" />
              </div>
            </div>
          </div>

          {/* SVG Line Graph matching BRESS */}
          <div className="relative pt-6 pb-2">
            {/* Tooltip Badge matching BRESS 3h 10m floating pin */}
            <div className="absolute top-0 left-[48%] -translate-x-1/2 bg-[#0f172a] text-white text-[11px] font-bold px-3 py-1 rounded-xl shadow-xl flex items-center gap-1 z-10">
              <span>3h 10m</span>
            </div>

            <svg className="w-full h-44 overflow-visible" viewBox="0 0 500 150" fill="none">
              <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="0" y1="70" x2="500" y2="70" stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="0" y1="110" x2="500" y2="110" stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="4 4" />

              <line x1="240" y1="35" x2="240" y2="135" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx="240" cy="35" r="4.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="2.5" />

              <path
                d="M0,110 Q75,135 150,65 T300,35 T450,75 T500,55"
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              <path
                d="M0,130 Q75,145 150,110 T300,85 T450,115 T500,95"
                fill="none"
                stroke="#9333ea"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>

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

        {/* Right Card: "Projects in progress:" Dark Midnight Card (5 Columns) */}
        <div className="lg:col-span-5 bg-[#0d1527] text-white rounded-[2.5rem] p-6 sm:p-8 shadow-xl flex flex-col justify-between relative overflow-hidden min-h-[320px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 z-10">
            <h2 className="text-xl font-extrabold text-white tracking-tight">Projects in progress:</h2>
          </div>

          {/* Stacked Cards Layout matching BRESS Right Dark Card */}
          <div className="my-4 relative flex items-center justify-between gap-4">
            {activeCard ? (
              <div
                onClick={() => setSelectedTx(activeCard)}
                className="w-full bg-white text-zinc-900 rounded-3xl p-5 shadow-2xl border border-white space-y-4 relative z-10 cursor-pointer hover:scale-[1.01] transition-transform"
              >
                {/* Pill Badges (Feedback, Bug, Design System style) */}
                <div className="flex items-center gap-2 flex-wrap text-[11px] font-extrabold">
                  <span className="px-3 py-1 rounded-full bg-[#dcfce7] text-emerald-800">
                    Feedback
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#dcfce7] text-emerald-800">
                    Bug
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#f3e8ff] text-purple-800">
                    Design System
                  </span>
                </div>

                {/* Card Title */}
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900 tracking-tight">
                    Improve cards readability
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">21.03.22</p>
                </div>

                {/* Micro Meta Footer (Avatars + Comments + Files) */}
                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <div className="flex items-center -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-purple-200 border-2 border-white flex items-center justify-center font-extrabold text-[10px] text-purple-900">
                      A
                    </div>
                    <div className="w-6 h-6 rounded-full bg-[#0f172a] text-white border-2 border-white flex items-center justify-center font-extrabold text-[9px]">
                      +8
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-zinc-500 font-bold">
                    <span className="flex items-center gap-1">
                      <ChatCircleText size={14} />
                      <span>12 comments</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText size={14} />
                      <span>0 files</span>
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 text-xs py-8">No active projects</div>
            )}

            {/* Sliding Stacked Card Backing Layers */}
            <div className="absolute top-2 left-4 right-8 h-full bg-slate-800/80 rounded-3xl -z-10 scale-[0.96]" />
            <div className="absolute top-4 left-8 right-12 h-full bg-slate-800/50 rounded-3xl -z-20 scale-[0.92]" />

            {/* Next Arrow Floating Circle Button on Right Edge */}
            <button
              onClick={handleNextCarousel}
              className="w-10 h-10 rounded-full bg-white text-zinc-900 shadow-xl flex items-center justify-center hover:bg-zinc-100 transition-colors shrink-0 z-20 cursor-pointer border border-zinc-200 ml-2"
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

            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
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
