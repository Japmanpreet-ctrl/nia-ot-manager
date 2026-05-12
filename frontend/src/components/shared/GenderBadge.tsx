import type { OTRecord } from '../../types';
import { cn } from '../../lib/utils';

const colors: Record<OTRecord['gender'], string> = {
  Male: 'bg-sky-100 text-sky-700',
  Female: 'bg-rose-100 text-rose-700',
  Other: 'bg-slate-100 text-slate-600'
};

export const GenderBadge = ({ gender }: { gender: OTRecord['gender'] }) => (
  <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', colors[gender])}>{gender}</span>
);
