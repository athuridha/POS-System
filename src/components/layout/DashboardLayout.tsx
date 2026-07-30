import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ExecutiveSidebar, MobileDrawer } from './Navigation';
import {
  WifiHigh,
  WifiSlash,
  ArrowsClockwise,
  SignOut,
  List,
} from '@phosphor-icons/react';
import { useAuthStore } from '../../stores/authStore';
import { useSettingsStore } from '../../stores/settingsStore';

export function DashboardLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { user, logout } = useAuthStore();
  const { logoUrl } = useSettingsStore();

  return (
    <div className="h-[100dvh] flex overflow-hidden bg-[#dce3ea] font-sans">
      {/* ── 1. Floating Left Executive Sidebar (Desktop) ── */}
      <ExecutiveSidebar />

      {/* ── 2. Main Executive Canvas Area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden p-3 sm:p-4 lg:pl-0">
        {/* Floating Top Executive Bar */}
        <header className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 px-4 sm:px-6 shadow-xs border border-white/90 flex items-center justify-between gap-4 shrink-0 mb-4">
          {/* Mobile Hamburger + Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
              aria-label="Buka Menu"
            >
              <List size={22} weight="bold" />
            </button>
            <div className="flex items-center gap-2.5">
              <img src={logoUrl || '/logo.png'} alt="POS Logo" className="w-8 h-8 rounded-xl object-cover shadow-xs border border-zinc-200" />
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-zinc-900">POS CAFE</span>
            </div>
          </div>

          {/* Right Controls: Online Status + User Profile */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Status Pill */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              {isOnline ? <WifiHigh size={14} weight="bold" /> : <WifiSlash size={14} weight="bold" />}
              <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            {/* User Badge */}
            {user && (
              <div className="flex items-center gap-2.5 pl-3 border-l border-zinc-200">
                <div className="w-8 h-8 rounded-full bg-[#0f172a] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {user.nama.charAt(0)}
                </div>
                <div className="hidden md:block text-left text-xs">
                  <p className="font-bold text-zinc-900 leading-tight">{user.nama}</p>
                  <p className="text-[10px] text-zinc-400 capitalize">{user.role?.replace('_', ' ')}</p>
                </div>
                <button
                  onClick={() => logout()}
                  className="p-1.5 rounded-full text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer ml-1"
                  title="Logout"
                >
                  <SignOut size={16} />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-auto rounded-2xl sm:rounded-[2.5rem]">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer Navigation */}
      <MobileDrawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </div>
  );
}
