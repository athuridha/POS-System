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
  Bell,
  ChatCircleText,
} from '@phosphor-icons/react';
import { useAuthStore } from '../../stores/authStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useNavigate, useLocation, Link } from 'react-router-dom';

export interface NavItem {
  to: string;
  label: string;
  icon: any;
  roles?: ('kasir' | 'manager' | 'super_admin')[];
  badge?: string | number;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    title: 'MAIN ANALYTICS',
    items: [
      { to: '/dashboard', label: 'Dashboard Peak', icon: ChartBar, roles: ['manager', 'super_admin'] },
    ],
  },
  {
    title: 'OPERASIONAL',
    items: [
      { to: '/pos', label: 'Kasir', icon: Storefront, roles: ['kasir', 'manager', 'super_admin'] },
      { to: '/kds', label: 'KDS Dapur', icon: Coffee, roles: ['kasir', 'manager', 'super_admin'] },
      { to: '/table-qr', label: 'QR Meja', icon: QrCode, roles: ['manager', 'super_admin'] },
      { to: '/shifts', label: 'Shift Kasir', icon: Clock, roles: ['kasir', 'manager', 'super_admin'] },
      { to: '/history', label: 'Riwayat Transaksi', icon: Receipt, roles: ['kasir', 'manager', 'super_admin'] },
    ],
  },
  {
    title: 'MANAJEMEN CAFE',
    items: [
      { to: '/menu', label: 'Menu & Varian', icon: ForkKnife, roles: ['manager', 'super_admin'] },
      { to: '/tables', label: 'Meja Cafe', icon: TableIcon, roles: ['manager', 'super_admin'] },
      { to: '/discounts', label: 'Voucher & Diskon', icon: Tag, roles: ['manager', 'super_admin'] },
      { to: '/users', label: 'User / Pengguna', icon: UsersThree, roles: ['super_admin'] },
    ],
  },
  {
    title: 'LAPORAN & SISTEM',
    items: [
      { to: '/reports', label: 'Laporan Penjualan', icon: ChartBar, roles: ['manager', 'super_admin'] },
      { to: '/payment-gateway', label: 'Payment Gateway', icon: CreditCard, roles: ['manager', 'super_admin'] },
      { to: '/settings', label: 'Pengaturan Struk', icon: Gear, roles: ['manager', 'super_admin'] },
    ],
  },
];

// ── Mobile Drawer Navigation Component ──
export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  if (!open) return null;

  const userRole = user?.role || 'kasir';
  const filteredGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.roles || item.roles.includes(userRole as any)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 lg:hidden font-sans">
      <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl flex flex-col z-10 animate-slide-right overflow-y-auto">
        <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0f172a] text-white flex items-center justify-center font-black text-xs">
              POS
            </div>
            <span className="font-extrabold text-sm text-zinc-900">POS CAFE</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-200 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="p-3 flex-1 space-y-4">
          {filteredGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <h4 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider px-3 pt-1">
                {group.title}
              </h4>
              {group.items.map((item) => {
                const isActive = location.pathname === item.to || (item.to !== '/pos' && location.pathname.startsWith(item.to + '/'));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#0f172a] text-white shadow-sm'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                    }`}
                  >
                    <Icon size={18} weight={isActive ? 'bold' : 'regular'} className={isActive ? 'text-white' : 'text-zinc-500'} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {user && (
          <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-900">{user.nama}</p>
              <p className="text-[11px] text-zinc-500 capitalize">{user.role?.replace('_', ' ')}</p>
            </div>
            <button
              onClick={() => logout()}
              className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 1. PosSidebar for Kasir Operational View ──
export function PosSidebar() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const userRole = user?.role || 'kasir';
  const filteredGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.roles || item.roles.includes(userRole as any)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside className="hidden lg:flex w-52 border-r border-zinc-200 bg-white flex-col justify-between py-3 px-2 shrink-0 font-sans">
      <div className="space-y-3">
        {filteredGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <h4 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider px-3 pt-1">
              {group.title}
            </h4>
            <nav className="flex flex-col gap-1">
              {group.items.map((item) => {
                const isActive = location.pathname === item.to || (item.to !== '/pos' && location.pathname.startsWith(item.to + '/'));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 font-bold shadow-xs'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                    }`}
                  >
                    <Icon size={18} weight={isActive ? 'fill' : 'regular'} className={isActive ? 'text-emerald-600' : 'text-zinc-500'} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {user && (
        <div className="p-2 border-t border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
              {user.nama.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-900 truncate">{user.nama}</p>
              <p className="text-[10px] text-zinc-400 capitalize">{userRole.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Logout"
            className="p-1 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
          >
            <SignOut size={16} />
          </button>
        </div>
      )}
    </aside>
  );
}

// ── 2. ExecutiveSidebar (Matching BRESS Reference Image 1-to-1) ──
export function ExecutiveSidebar() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const userRole = user?.role || 'kasir';
  const allNavItems = navGroups.flatMap((g) => g.items).filter((item) => !item.roles || item.roles.includes(userRole as any));

  return (
    <aside className="hidden lg:flex w-64 bg-white rounded-[2.5rem] p-6 shadow-sm border border-white flex-col justify-between shrink-0 font-sans min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {/* Brand Header matching BRESS (Logo + BRESS / POS CAFE) */}
        <div className="flex items-center gap-3 border-b border-zinc-100 pb-5">
          <div className="w-9 h-9 rounded-xl bg-[#0f172a] text-white flex items-center justify-center font-black text-sm shadow-sm">
            B
          </div>
          <span className="font-extrabold text-xl text-zinc-900 tracking-tight">BRESS</span>
        </div>

        {/* Navigation Items with BRESS Dark Pill Active Indicator */}
        <nav className="flex flex-col gap-1.5">
          {allNavItems.map((item) => {
            const isActive = location.pathname === item.to || (item.to !== '/pos' && location.pathname.startsWith(item.to + '/'));
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center justify-between px-4 py-3 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#0f172a] text-white shadow-lg shadow-slate-900/20 translate-x-1'
                    : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon size={18} weight={isActive ? 'bold' : 'regular'} className={isActive ? 'text-white' : 'text-zinc-400'} />
                  <span>{item.label}</span>
                </div>
                {item.to === '/table-qr' && (
                  <span className="bg-[#bbf7d0] text-emerald-950 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                    2
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Profile Pill at Bottom (Matching BRESS Emily Jonson Avatar Card) */}
      {user && (
        <div className="pt-4 border-t border-zinc-100 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center font-extrabold text-amber-900 text-sm shrink-0 shadow-xs">
              {user.nama.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-zinc-900 truncate">{user.nama}</p>
              <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
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
    </aside>
  );
}
