import { Outlet } from 'react-router-dom';
import { TopBar, Sidebar } from './Navigation';

export function AppLayout() {
  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-(--color-surface)">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
