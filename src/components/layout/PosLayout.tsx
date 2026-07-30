import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { PosSidebar, MobileDrawer } from './Navigation';
import {
  WifiHigh,
  WifiSlash,
  ArrowsClockwise,
  SignOut,
  List,
} from '@phosphor-icons/react';
import { useAuthStore } from '../../stores/authStore';
import { useSettingsStore } from '../../stores/settingsStore';

export function PosLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { user, logout } = useAuthStore();
  const { logoUrl } = useSettingsStore();

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-zinc-100 font-sans">
      {/* ── 1. Compact Integrated POS Header ── */}
      <header className="h-13 border-b border-zinc-200 bg-white flex items-center justify-between px-3 sm:px-4 shrink-0 shadow-xs z-30 font-sans">
        {/* Left: Mobile Hamburger + Brand Logo */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-1.5 rounded-xl text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
            aria-label="Buka Menu"
          >
            <List size={20} weight="bold" />
          </button>

          <img src={logoUrl || '/logo.png'} alt="POS Logo" className="w-7 h-7 rounded-lg object-cover shadow-xs border border-zinc-200" />
          <span className="font-bold text-sm sm:text-base tracking-tight text-zinc-900 truncate">POS Cafe</span>
        </div>

        {/* Right: Online Status + Kasir Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {isOnline ? <WifiHigh size={13} weight="bold" /> : <WifiSlash size={13} weight="bold" />}
            <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-200">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[11px]">
                {user.nama.charAt(0)}
              </div>
              <div className="hidden sm:block text-left text-xs">
                <p className="font-bold text-zinc-900 leading-tight">{user.nama}</p>
                <p className="text-[10px] text-zinc-400 capitalize">{user.role?.replace('_', ' ')}</p>
              </div>
              <button
                onClick={() => logout()}
                className="p-1 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                title="Logout"
              >
                <SignOut size={15} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── 2. Content & Sidebar Area ── */}
      <div className="flex flex-1 overflow-hidden">
        <PosSidebar />
        <main className="flex-1 overflow-auto bg-zinc-100">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer */}
      <MobileDrawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </div>
  );
}
