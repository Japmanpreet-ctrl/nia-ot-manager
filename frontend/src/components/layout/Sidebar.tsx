import { Bell, BarChart3, Boxes, CalendarPlus, ClipboardList, FlaskConical, HardDrive, Layers, LayoutDashboard, LogOut, Menu, ShieldCheck, Users, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { useState } from 'react';
import logo from '../../assets/logo.png';
import { auth } from '../../lib/firebase';
import { canUser, cn, getInitials } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { RoleBadge } from '../shared/RoleBadge';

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Records', to: '/records', icon: ClipboardList },
  { label: 'Add Record', to: '/add-record', icon: CalendarPlus },
  { label: 'Analytics', to: '/analytics', icon: BarChart3, action: 'view_analytics' as const },
  { label: 'OT Consumables', to: '/inventory', icon: Boxes, action: 'view_inventory' as const },
  { label: 'OT Linen', to: '/linen', icon: Layers, action: 'view_inventory' as const },
  { label: 'OT Operations', to: '/operations', icon: ShieldCheck, action: 'view_operations' as const },
  { label: 'OT Culture', to: '/culture', icon: FlaskConical, action: 'view_operations' as const },
  { label: 'OT Permanent Articles', to: '/articles', icon: HardDrive, action: 'view_operations' as const },
  { label: 'Admin Panel', to: '/admin', icon: Users, action: 'access_admin' as const }
];

export const Sidebar = () => {
  const [open, setOpen] = useState(false);
  const appUser = useAuthStore((state) => state.appUser);
  const visibleItems = navItems.filter((item) => !item.action || canUser(appUser, item.action));

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="fixed left-4 top-4 z-40 rounded-xl bg-slate-900 p-2 text-white shadow-lg lg:hidden">
        <Menu className="h-5 w-5" />
      </button>
      {open && <button aria-label="Close menu" className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={cn('fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-slate-900 text-white shadow-xl transition-transform lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex min-h-28 items-center gap-4 px-5 py-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-lg">
            <img src={logo} alt="NIA logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="text-base font-bold leading-tight">Shalyatantra OT</p>
            <p className="text-xs text-slate-400">NIA Jaipur</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-slate-800 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {visibleItems.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-xl border-l-4 px-4 py-3 text-sm font-semibold transition',
                isActive ? 'border-teal-500 bg-teal-500/10 text-teal-300' : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-600 text-sm font-bold">
              {getInitials(appUser?.full_name || appUser?.email)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{appUser?.full_name || 'User'}</p>
              {appUser?.role && <RoleBadge role={appUser.role} />}
            </div>
          </div>
          <button type="button" onClick={() => signOut(auth)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800">
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};
