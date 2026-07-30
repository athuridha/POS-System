import { useEffect, useState } from 'react';
import { onSyncStatusChange } from '../../lib/sync';
import { getPendingCount } from '../../lib/db';
import {
  WifiHigh,
  WifiSlash,
  ArrowsClockwise,
  SignOut,
  Storefront,
  Receipt,
  ChartBar,
  Table as TableIcon,
  ForkKnife,
  Clock,
  Tag,
  Gear,
  UsersThree,
  CreditCard,
  List,
  X,
  Coffee,
  QrCode,
} from '@phosphor-icons/react';
import { useAuthStore } from '../../stores/authStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useNavigate, useLocation, Link } from 'react-router-dom';

export function TopBar() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { logoUrl } = useSettingsStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsub = onSyncStatusChange(setPendingCount);
    getPendingCount().then(setPendingCount);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsub();
    };
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems =
    user?.role === 'super_admin'
      ? superAdminNav
      : user?.role === 'manager'
      ? managerNav
      : kasirNav;

  return (
    <>
      <header className="h-14 border-b border-zinc-200 bg-white flex items-center justify-between px-3 sm:px-4 shrink-0 shadow-xs z-30">
        {/* Left: Mobile Hamburger + Brand */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-xl text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
            aria-label="Buka Menu"
          >
            <List size={22} weight="bold" />
          </button>

          <img src={logoUrl || '/logo.png'} alt="POS Cafe Logo" className="w-8 h-8 rounded-lg object-cover shadow-xs border border-zinc-200" />
          <span className="font-bold text-base tracking-tight text-zinc-900 truncate">POS Cafe</span>
        </div>

        {/* Right: Status + User */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Pending sync indicator */}
          {pendingCount > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-semibold">
              <ArrowsClockwise size={13} className="animate-spin" />
              <span className="hidden sm:inline">{pendingCount} belum sync</span>
              <span className="sm:hidden">{pendingCount}</span>
            </div>
          )}

          {/* Connection status */}
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-semibold border ${
              isOnline
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-600'
            }`}
          >
            {isOnline ? <WifiHigh size={13} weight="bold" /> : <WifiSlash size={13} weight="bold" />}
            <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* User info */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-200">
              <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-300 flex items-center justify-center text-xs font-bold text-zinc-700 shrink-0">
                {user.nama.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-xs">
                <div className="font-semibold text-zinc-900 leading-tight truncate">{user.nama}</div>
                <div className="text-zinc-500 capitalize leading-tight">
                  {user.role === 'super_admin' ? 'Super Admin' : user.role}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                title="Logout"
              >
                <SignOut size={18} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Sidebar Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          {/* Drawer Content */}
          <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-up">
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img src={logoUrl || '/logo.png'} alt="POS Logo" className="w-8 h-8 rounded-lg object-cover border border-zinc-200" />
                <span className="font-bold text-base text-zinc-900">POS Cafe</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 shadow-xs font-bold'
                        : 'text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    <Icon size={20} weight={isActive ? 'fill' : 'regular'} className={isActive ? 'text-emerald-600' : 'text-zinc-500'} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {user && (
              <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-900">{user.nama}</p>
                  <p className="text-[11px] text-zinc-500 capitalize">{user.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const kasirNav = [
  { to: '/pos', label: 'Kasir', icon: Storefront },
  { to: '/kds', label: 'KDS Dapur', icon: Coffee },
  { to: '/shifts', label: 'Shift', icon: Clock },
  { to: '/history', label: 'Riwayat', icon: Receipt },
  { to: '/settings', label: 'Pengaturan', icon: Gear },
];

const managerNav = [
  { to: '/dashboard', label: 'Dashboard Peak', icon: ChartBar },
  { to: '/pos', label: 'Kasir', icon: Storefront },
  { to: '/kds', label: 'KDS Dapur', icon: Coffee },
  { to: '/table-qr', label: 'QR Meja', icon: QrCode },
  { to: '/menu', label: 'Menu', icon: ForkKnife },
  { to: '/tables', label: 'Meja', icon: TableIcon },
  { to: '/discounts', label: 'Diskon', icon: Tag },
  { to: '/shifts', label: 'Shift', icon: Clock },
  { to: '/history', label: 'Riwayat', icon: Receipt },
  { to: '/reports', label: 'Laporan', icon: ChartBar },
  { to: '/payment-gateway', label: 'Payment Gateway', icon: CreditCard },
  { to: '/settings', label: 'Pengaturan', icon: Gear },
];

const superAdminNav = [
  { to: '/dashboard', label: 'Dashboard Peak', icon: ChartBar },
  { to: '/pos', label: 'Kasir', icon: Storefront },
  { to: '/kds', label: 'KDS Dapur', icon: Coffee },
  { to: '/table-qr', label: 'QR Meja', icon: QrCode },
  { to: '/users', label: 'User / Pengguna', icon: UsersThree },
  { to: '/menu', label: 'Menu', icon: ForkKnife },
  { to: '/tables', label: 'Meja', icon: TableIcon },
  { to: '/discounts', label: 'Diskon', icon: Tag },
  { to: '/shifts', label: 'Shift', icon: Clock },
  { to: '/history', label: 'Riwayat', icon: Receipt },
  { to: '/reports', label: 'Laporan', icon: ChartBar },
  { to: '/payment-gateway', label: 'Payment Gateway', icon: CreditCard },
  { to: '/settings', label: 'Pengaturan', icon: Gear },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const navItems =
    user?.role === 'super_admin'
      ? superAdminNav
      : user?.role === 'manager'
      ? managerNav
      : kasirNav;

  return (
    <aside className="hidden lg:flex w-60 bg-[#dce3ea] p-4 flex-col justify-between shrink-0 font-sans">
      {/* Floating Card Sidebar Panel */}
      <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] p-4 shadow-sm border border-white/80 flex flex-col justify-between flex-1 space-y-6">
        <div>
          {/* Logo / Brand Header */}
          <div className="flex items-center gap-3 px-3 py-2 mb-4 border-b border-zinc-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-[#0f172a] flex items-center justify-center text-white font-black text-base shadow-sm">
              POS
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-zinc-900 tracking-tight">POS CAFE</h2>
              <p className="text-[11px] font-bold text-emerald-600 capitalize">{user?.role?.replace('_', ' ') || 'Kasir'}</p>
            </div>
          </div>

          {/* Navigation Items with BRESS Dark Pill for Active */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to || (item.to !== '/pos' && location.pathname.startsWith(item.to + '/'));
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#0f172a] text-white shadow-md shadow-slate-900/20 translate-x-1'
                      : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                  }`}
                >
                  <Icon size={18} weight={isActive ? 'bold' : 'regular'} className={isActive ? 'text-white' : 'text-zinc-400'} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile Pill at Bottom (Matching BRESS Design) */}
        {user && (
          <div className="pt-3 border-t border-zinc-100 flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 font-bold text-xs shrink-0">
                {user.nama.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-zinc-900 truncate">{user.nama}</p>
                <p className="text-[10px] text-zinc-400 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Logout"
              className="p-1.5 rounded-full text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
            >
              <SignOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
