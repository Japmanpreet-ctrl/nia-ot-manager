import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

const colorMap: Record<string, string> = {
  teal: 'text-teal-600',
  blue: 'text-blue-600',
  purple: 'text-purple-600',
  amber: 'text-amber-600'
};

const bgMap: Record<string, string> = {
  teal: 'bg-gradient-to-br from-teal-500/20 to-transparent',
  blue: 'bg-gradient-to-br from-blue-500/20 to-transparent',
  purple: 'bg-gradient-to-br from-purple-500/20 to-transparent',
  amber: 'bg-gradient-to-br from-amber-500/20 to-transparent'
};

export const StatCard = ({ title, value, icon: Icon, color = 'teal' }: { title: string; value: string | number; icon: LucideIcon; color?: string }) => (
  <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
    <div className={cn('absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl opacity-40 transition-opacity duration-500 group-hover:opacity-70', bgMap[color] || bgMap.teal)} />
    <div className="relative flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
        <p className="mt-3 text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
      </div>
      <div className={cn('rounded-xl p-2.5 shadow-sm border border-white/60 bg-white/50 backdrop-blur-md transition-transform group-hover:scale-110 duration-300', colorMap[color] || colorMap.teal)}>
        <Icon className="h-5 w-5" strokeWidth={2.5} />
      </div>
    </div>
  </div>
);
