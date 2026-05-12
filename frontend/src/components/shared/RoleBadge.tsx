import type { UserRole } from '../../types';
import { cn } from '../../lib/utils';

const colors: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-700',
  doctor: 'bg-teal-100 text-teal-700',
  nurse: 'bg-blue-100 text-blue-700',
  data_entry: 'bg-slate-100 text-slate-600'
};

export const RoleBadge = ({ role }: { role: UserRole }) => (
  <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize', colors[role])}>
    {role.replace('_', ' ')}
  </span>
);
