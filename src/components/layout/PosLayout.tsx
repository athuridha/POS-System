import { Outlet } from 'react-router-dom';
import { TopBar, PosSidebar } from './Navigation';

export function PosLayout() {
  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-zinc-100 font-sans">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <PosSidebar />
        <main className="flex-1 overflow-auto bg-zinc-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
