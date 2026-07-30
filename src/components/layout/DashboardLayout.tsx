import { useState, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { ExecutiveSidebar, MobileDrawer } from './Navigation';
import {
  MagnifyingGlass,
  CalendarBlank,
  CaretDown,
  WifiHigh,
  WifiSlash,
  SignOut,
  List,
} from '@phosphor-icons/react';
import { useAuthStore } from '../../stores/authStore';

export function DashboardLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | '30days' | 'all'>('all');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const { user, logout } = useAuthStore();

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-[#c5d0d8] p-4 sm:p-6 lg:p-8 flex gap-6 font-sans overflow-hidden">
      {/* ── 1. Floating Left Executive Sidebar ── */}
      <ExecutiveSidebar />

      {/* ── 2. Independent Scrollable Content Area ── */}
      <div className="flex-1 h-full overflow-y-auto min-w-0 space-y-6 pr-1">
        {/* ── Top Bar Card (Search, Date Filter, Online Status, User Profile & Logout) ── */}
        <header className="bg-white rounded-[2rem] p-3.5 px-6 shadow-sm border border-white flex items-center justify-between gap-4 flex-wrap shrink-0">
          {/* Mobile Hamburger + Search Input */}
          <div className="flex items-center gap-3 flex-1 min-w-[200px]">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
              aria-label="Buka Menu"
            >
              <List size={22} weight="bold" />
            </button>
            <div className="relative flex-1">
              <MagnifyingGlass size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full h-10 pl-11 pr-4 rounded-full bg-[#f1f5f9]/80 text-xs font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:bg-white transition-all border border-transparent"
              />
            </div>
          </div>

          {/* Date Selector Dropdown Button & Menu */}
          <div className="relative">
            <button
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="flex items-center gap-2 text-xs font-bold text-zinc-700 bg-[#f1f5f9]/80 px-4 py-2.5 rounded-full border border-transparent hover:bg-zinc-200/50 transition-colors cursor-pointer"
            >
              <CalendarBlank size={15} className="text-zinc-500" />
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

          {/* Online Status + User Profile & Logout Button (In Top Bar!) */}
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold border ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                  : 'bg-red-50 text-red-700 border-red-200/80'
              }`}
            >
              {isOnline ? <WifiHigh size={14} weight="bold" /> : <WifiSlash size={14} weight="bold" />}
              <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            {user && (
              <div className="flex items-center gap-2.5 pl-3 border-l border-zinc-200">
                <div className="w-8 h-8 rounded-full bg-[#0f172a] text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
                  {user.nama.charAt(0)}
                </div>
                <div className="hidden md:block text-left text-xs">
                  <p className="font-extrabold text-zinc-900 leading-tight">{user.nama}</p>
                  <p className="text-[10px] text-zinc-400 capitalize">{user.role?.replace('_', ' ')}</p>
                </div>
                <button
                  onClick={() => logout()}
                  title="Logout"
                  className="p-1.5 rounded-full text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer ml-1"
                >
                  <SignOut size={17} />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100%-5rem)]">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer */}
      <MobileDrawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </div>
  );
}
