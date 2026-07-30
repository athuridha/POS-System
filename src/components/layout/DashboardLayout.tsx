import { Outlet } from 'react-router-dom';
import { ExecutiveSidebar } from './Navigation';

export function DashboardLayout() {
  return (
    <div className="min-h-[100dvh] bg-[#c5d0d8] p-4 sm:p-6 lg:p-8 flex gap-6 font-sans overflow-x-hidden">
      {/* ── 1. Floating Left Executive Sidebar (Matching BRESS Reference) ── */}
      <ExecutiveSidebar />

      {/* ── 2. Main Canvas Content Area ── */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
