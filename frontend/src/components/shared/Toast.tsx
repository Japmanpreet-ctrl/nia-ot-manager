import { CheckCircle2, XCircle } from 'lucide-react';
import { useEffect } from 'react';
import { useUiStore } from '../../store/uiStore';
import { cn } from '../../lib/utils';

export const Toast = () => {
  const { toast, clearToast } = useUiStore();

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(clearToast, toast.type === 'success' ? 3000 : 5000);
    return () => window.clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) return null;
  const Icon = toast.type === 'success' ? CheckCircle2 : XCircle;

  return (
    <div className={cn('fixed bottom-6 right-6 z-[80] flex max-w-sm items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-2xl', toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500')}>
      <Icon className="h-5 w-5 shrink-0" />
      <span>{toast.message}</span>
    </div>
  );
};
