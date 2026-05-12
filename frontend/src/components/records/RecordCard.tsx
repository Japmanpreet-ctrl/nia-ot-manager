import { Building2, CalendarDays, Clock, Scissors, Stethoscope } from 'lucide-react';
import type { OTRecord } from '../../types';
import { formatDate, formatTime } from '../../lib/utils';
import { AnesthesiaBadge } from '../shared/AnesthesiaBadge';
import { GenderBadge } from '../shared/GenderBadge';

export const RecordCard = ({ record, onClick }: { record: OTRecord; onClick: (record: OTRecord) => void }) => (
  <button
    type="button"
    onClick={() => onClick(record)}
    className="group relative h-full w-full glass-panel rounded-2xl p-6 text-left"
  >
    <div className="flex items-start justify-between gap-3">
      <GenderBadge gender={record.gender} />
      <AnesthesiaBadge type={record.anesthesia_type} />
    </div>

    <div className="mt-6">
      <h3 className="truncate text-lg font-bold text-slate-900">{record.patient_name}</h3>
      <p className="mt-1 text-sm text-slate-500">Age: {record.age} years</p>
    </div>

    <div className="my-5 h-px bg-slate-100" />

    <div className="space-y-3 text-sm text-slate-600">
      <div className="flex min-w-0 items-center gap-2">
        <Building2 className="h-4 w-4 shrink-0 text-teal-600" />
        <span className="truncate">{record.diagnosis}</span>
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <Scissors className="h-4 w-4 shrink-0 text-teal-600" />
        <span className="truncate">{record.surgical_procedure}</span>
      </div>
    </div>

    <div className="my-5 h-px bg-slate-100" />

    <div className="space-y-3 text-sm text-slate-600">
      <div className="flex items-center gap-2">
        <Stethoscope className="h-4 w-4 shrink-0 text-slate-400" />
        <span className="truncate">Dr. {record.consultant_name}</span>
      </div>
      <div className="flex flex-wrap gap-4">
        <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-slate-400" />{formatDate(record.ot_date)}</span>
        <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-slate-400" />{formatTime(record.ot_start_time)}</span>
      </div>
    </div>

    <div className="mt-5 flex flex-wrap gap-2">
      {record.opd_number && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">OPD: {record.opd_number}</span>}
      {record.ipd_number && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">IPD: {record.ipd_number}</span>}
    </div>
  </button>
);
