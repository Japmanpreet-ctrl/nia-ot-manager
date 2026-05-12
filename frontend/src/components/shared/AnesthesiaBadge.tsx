import { cn } from '../../lib/utils';

const colors: Record<string, string> = {
  General: 'bg-blue-100 text-blue-700',
  Spinal: 'bg-green-100 text-green-700',
  Epidural: 'bg-purple-100 text-purple-700',
  Local: 'bg-yellow-100 text-yellow-700',
  'Combined Spinal-Epidural': 'bg-indigo-100 text-indigo-700',
  Regional: 'bg-orange-100 text-orange-700',
  MAC: 'bg-pink-100 text-pink-700',
  Other: 'bg-slate-100 text-slate-700'
};

export const AnesthesiaBadge = ({ type }: { type: string }) => (
  <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', colors[type] || colors.Other)}>
    {type}
  </span>
);
