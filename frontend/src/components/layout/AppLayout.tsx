import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const AppLayout = () => (
  <div className="min-h-screen bg-slate-100">
    <Sidebar />
    <div className="lg:pl-[260px]">
      <Topbar />
      <main className="p-5 lg:p-8">
        <Outlet />
      </main>
    </div>
  </div>
);
