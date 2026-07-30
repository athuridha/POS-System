import { Outlet } from 'react-router-dom';
import { ExecutiveSidebar } from './Navigation';

export function DashboardLayout() {
  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-[#c5d0d8] p-4 sm:p-6 lg:p-8 flex gap-6 font-sans overflow-hidden">
      {/* ── 1. Floating Left Executive Sidebar (Pinned to viewport height) ── */}
      <ExecutiveSidebar />

      {/* ── 2. Independent Scrollable Main Content Area ── */}
      <div className="flex-1 h-full overflow-y-auto min-w-0 pr-1">
        <main className="min-h-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
