import { Outlet } from 'react-router-dom';
import { TopBar, ExecutiveSidebar } from './Navigation';

export function DashboardLayout() {
  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-[#dce3ea] font-sans">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <ExecutiveSidebar />
        <main className="flex-1 overflow-auto bg-[#dce3ea]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
