import { Bell, Calendar as CalendarIcon, Clock, LogOut, User } from 'lucide-react';
import { format } from 'date-fns';
import { useLocation } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { getInitials } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { auth } from '../../lib/firebase';

const titleMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/records': 'Records',
  '/add-record': 'Add Record',
  '/analytics': 'Analytics',
  '/inventory': 'OT Inventory',
  '/operations': 'OT Operations',
  '/admin': 'Admin Panel'
};

const mockNotifications = [
  { id: 1, title: 'New record added', message: 'John Doe was added to the OT schedule.', time: '5m ago', unread: true },
  { id: 2, title: 'Inventory Alert', message: 'Surgical gloves are running low.', time: '1h ago', unread: true },
  { id: 3, title: 'Operation Completed', message: 'Case #102 finished successfully.', time: '2h ago', unread: false }
];

export const Topbar = () => {
  const location = useLocation();
  const appUser = useAuthStore((state) => state.appUser);
  const title = titleMap[location.pathname] || 'Shalyatantra OT';

  const [dateOpen, setDateOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const dateRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(dateRef, () => setDateOpen(false));
  useOnClickOutside(notifRef, () => setNotifOpen(false));
  useOnClickOutside(userRef, () => setUserOpen(false));

  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications, setNotifications] = useState(mockNotifications);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 lg:px-8">
      <div className="pl-12 lg:pl-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">NIA Jaipur / {title}</p>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Date Dropdown */}
        <div className="relative hidden sm:block" ref={dateRef}>
          <button 
            type="button" 
            onClick={() => { setDateOpen(!dateOpen); setNotifOpen(false); setUserOpen(false); }}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
          >
            <CalendarIcon className="h-4 w-4" />
            {format(currentTime, 'dd MMM yyyy')}
          </button>
          
          {dateOpen && (
            <div className="absolute right-0 mt-2 w-64 glass-panel rounded-2xl p-5 shadow-lg z-50 animate-in fade-in slide-in-from-top-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Current Time</p>
              <div className="mt-3 flex items-center gap-3">
                <Clock className="h-8 w-8 text-teal-500" />
                <div>
                  <p className="text-2xl font-bold text-slate-900 tracking-tight">{format(currentTime, 'HH:mm:ss')}</p>
                  <p className="text-sm font-medium text-slate-500">{format(currentTime, 'EEEE')}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button 
            type="button" 
            onClick={() => { setNotifOpen(!notifOpen); setDateOpen(false); setUserOpen(false); }}
            className="relative rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <Bell className="h-5 w-5" />
            {notifications.some(n => n.unread) && (
              <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />
            )}
          </button>
          
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 glass-panel rounded-2xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="border-b border-slate-200/60 bg-slate-50/50 px-4 py-3 flex justify-between items-center">
                <p className="text-sm font-bold text-slate-900">Notifications</p>
                <button 
                  onClick={() => setNotifications(notifications.map(n => ({ ...n, unread: false })))}
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700"
                >
                  Mark all as read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 || !notifications.some(n => n.unread) ? (
                   <div className="p-4 text-center text-sm text-slate-500">No new notifications</div>
                ) : null}
                {notifications.map((notif) => (
                  <div key={notif.id} className="flex flex-col gap-1 border-b border-slate-100 p-4 hover:bg-slate-50 transition cursor-pointer">
                    <div className="flex justify-between items-start">
                      <p className={`text-sm font-semibold ${notif.unread ? 'text-slate-900' : 'text-slate-600'}`}>{notif.title}</p>
                      {notif.unread && <span className="h-2 w-2 mt-1 rounded-full bg-teal-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-500">{notif.message}</p>
                    <p className="mt-1 text-[10px] font-medium uppercase text-slate-400">{notif.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Dropdown */}
        <div className="relative" ref={userRef}>
          <button 
            type="button"
            onClick={() => { setUserOpen(!userOpen); setDateOpen(false); setNotifOpen(false); }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white shadow-sm ring-2 ring-white hover:ring-teal-100 transition"
          >
            {getInitials(appUser?.full_name || appUser?.email)}
          </button>
          
          {userOpen && (
            <div className="absolute right-0 mt-2 w-56 glass-panel rounded-2xl p-2 shadow-lg z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-3 border-b border-slate-100 mb-2">
                <p className="text-sm font-bold text-slate-900 truncate">{appUser?.full_name || 'User'}</p>
                <p className="text-xs text-slate-500 truncate">{appUser?.email}</p>
              </div>
              <button className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition">
                <User className="h-4 w-4" />
                Profile Details
              </button>
              <button 
                onClick={() => signOut(auth)}
                className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition mt-1"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
        
      </div>
    </header>
  );
};
