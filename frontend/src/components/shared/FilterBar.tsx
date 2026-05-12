import { X } from 'lucide-react';
import { anesthesiaOptions } from '../../types';

export const FilterBar = ({
  date,
  consultant,
  anesthesiaType,
  consultants,
  onDateChange,
  onConsultantChange,
  onAnesthesiaChange,
  onClear
}: {
  date: string;
  consultant: string;
  anesthesiaType: string;
  consultants: string[];
  onDateChange: (value: string) => void;
  onConsultantChange: (value: string) => void;
  onAnesthesiaChange: (value: string) => void;
  onClear: () => void;
}) => (
  <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_1fr_1fr_auto]">
    <input
      type="date"
      value={date}
      onChange={(event) => onDateChange(event.target.value)}
      className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
    />
    <select
      value={consultant}
      onChange={(event) => onConsultantChange(event.target.value)}
      className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
    >
      <option value="">All consultants</option>
      {consultants.map((name) => (
        <option key={name} value={name}>{name}</option>
      ))}
    </select>
    <select
      value={anesthesiaType}
      onChange={(event) => onAnesthesiaChange(event.target.value)}
      className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
    >
      <option value="">All anesthesia types</option>
      {anesthesiaOptions.map((type) => (
        <option key={type} value={type}>{type}</option>
      ))}
    </select>
    <button
      type="button"
      onClick={onClear}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
    >
      <X className="h-4 w-4" />
      Clear
    </button>
  </div>
);
