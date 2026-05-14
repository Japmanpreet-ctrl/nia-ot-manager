import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { X, RefreshCw } from 'lucide-react';
import type { OtLinenItem, OtLinenLaundryLog } from '../../types';

const inputClass =
  'h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100';
const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500';

const today = () => format(new Date(), 'yyyy-MM-dd');
const defaultExpected = () => {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return format(d, 'yyyy-MM-dd');
};

/* ── Send to laundry modal ── */
interface SendLaundryModalProps {
  item: OtLinenItem;
  onCancel: () => void;
  onSubmit: (payload: {
    linen_item_id: string;
    quantity_sent: number;
    date_sent: string;
    expected_return_date: string;
    notes?: string;
  }) => void;
  isLoading?: boolean;
}

export const SendLaundryModal = ({ item, onCancel, onSubmit, isLoading }: SendLaundryModalProps) => {
  const [qty, setQty] = useState(1);
  const [dateSent, setDateSent] = useState(today());
  const [expectedReturn, setExpectedReturn] = useState(defaultExpected());
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (qty <= 0) { setError('Quantity must be at least 1.'); return; }
    if (qty > item.quantity_available) {
      setError(`Only ${item.quantity_available} ${item.unit} available.`);
      return;
    }
    if (!dateSent || !expectedReturn) { setError('Dates are required.'); return; }
    if (expectedReturn < dateSent) { setError('Expected return date must be on or after sent date.'); return; }
    setError('');
    onSubmit({ linen_item_id: item.id, quantity_sent: qty, date_sent: dateSent, expected_return_date: expectedReturn, notes: notes.trim() || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <RefreshCw className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900">Send to Laundry</h3>
            <p className="text-xs text-slate-500">{item.item_name} · {item.quantity_available} {item.unit} available</p>
          </div>
          <button type="button" onClick={onCancel} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className={labelClass}>Quantity to Send *</span>
              <input type="number" min={1} max={item.quantity_available} className={inputClass}
                value={qty} onChange={(e) => { setQty(Math.max(1, parseInt(e.target.value) || 1)); setError(''); }} />
            </label>
            <label>
              <span className={labelClass}>Date Sent *</span>
              <input type="date" className={inputClass} value={dateSent} onChange={(e) => setDateSent(e.target.value)} />
            </label>
          </div>
          <label>
            <span className={labelClass}>Expected Return Date *</span>
            <input type="date" className={inputClass} value={expectedReturn} onChange={(e) => setExpectedReturn(e.target.value)} />
          </label>
          <label>
            <span className={labelClass}>Notes</span>
            <textarea rows={2} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." />
          </label>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>}
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={isLoading} className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-60">
            {isLoading ? 'Sending…' : 'Send to Laundry'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Return from laundry modal ── */
interface ReturnLaundryModalProps {
  log: OtLinenLaundryLog;
  onCancel: () => void;
  onSubmit: (payload: { id: string; returned_quantity: number; laundry_status?: string; notes?: string }) => void;
  isLoading?: boolean;
}

export const ReturnLaundryModal = ({ log, onCancel, onSubmit, isLoading }: ReturnLaundryModalProps) => {
  const [returned, setReturned] = useState(log.returned_quantity || 0);
  const [notes, setNotes] = useState(log.notes || '');
  const [error, setError] = useState('');
  const pending = log.quantity_sent - returned;

  const handleSubmit = () => {
    if (returned < 0) { setError('Returned quantity cannot be negative.'); return; }
    if (returned > log.quantity_sent) { setError(`Cannot exceed sent quantity (${log.quantity_sent}).`); return; }
    setError('');
    const status = returned === log.quantity_sent ? 'Returned' : returned > 0 ? 'Partially Returned' : log.laundry_status;
    onSubmit({ id: log.id, returned_quantity: returned, laundry_status: status, notes: notes.trim() || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
            <RefreshCw className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900">Return from Laundry</h3>
            <p className="text-xs text-slate-500">Sent: {log.quantity_sent} · Already returned: {log.returned_quantity}</p>
          </div>
          <button type="button" onClick={onCancel} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className={labelClass}>Total Returned Quantity</span>
              <input type="number" min={0} max={log.quantity_sent} className={inputClass}
                value={returned} onChange={(e) => { setReturned(Math.max(0, parseInt(e.target.value) || 0)); setError(''); }} />
            </label>
            <div className="flex flex-col justify-end">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
                <p className="text-xs text-slate-500 uppercase font-medium tracking-wide">Pending after this update</p>
                <p className={`mt-1 text-lg font-bold ${pending > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{Math.max(pending, 0)}</p>
              </div>
            </div>
          </div>
          <label>
            <span className={labelClass}>Notes</span>
            <textarea rows={2} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>}
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={isLoading} className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-60">
            {isLoading ? 'Updating…' : 'Update Return'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Item Laundry Logs panel ── */
interface LaundryLogsPanelProps {
  itemId: string;
  logs: OtLinenLaundryLog[];
  onReturn: (log: OtLinenLaundryLog) => void;
  onClose: () => void;
}

const laundryStatusColor: Record<string, string> = {
  Sent: 'bg-amber-100 text-amber-700',
  'Partially Returned': 'bg-blue-100 text-blue-700',
  Returned: 'bg-emerald-100 text-emerald-700',
  Lost: 'bg-red-100 text-red-700',
};

export const LaundryLogsPanel = ({ logs, onReturn, onClose }: LaundryLogsPanelProps) => (
  <div className="border-t border-slate-100 bg-amber-50/30 px-5 py-4">
    <div className="mb-3 flex items-center justify-between">
      <h4 className="text-sm font-bold text-slate-900">Laundry Logs</h4>
      <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
    </div>
    {logs.length === 0 ? (
      <p className="text-sm text-slate-500">No laundry logs for this item.</p>
    ) : (
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[620px] text-left text-xs">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Sent</th>
              <th className="px-3 py-2">Qty Sent</th>
              <th className="px-3 py-2">Expected Return</th>
              <th className="px-3 py-2">Returned</th>
              <th className="px-3 py-2">Pending</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">By</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-semibold">{log.date_sent}</td>
                <td className="px-3 py-2 font-bold text-amber-700">{log.quantity_sent}</td>
                <td className="px-3 py-2">{log.expected_return_date}</td>
                <td className="px-3 py-2 font-bold text-teal-700">{log.returned_quantity}</td>
                <td className="px-3 py-2">
                  <span className={`font-bold ${log.pending_quantity > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {log.pending_quantity}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${laundryStatusColor[log.laundry_status] || 'bg-slate-100 text-slate-700'}`}>
                    {log.laundry_status}
                  </span>
                </td>
                <td className="px-3 py-2 text-slate-500">{log.sent_by_name || '—'}</td>
                <td className="px-3 py-2 text-right">
                  {log.laundry_status !== 'Returned' && log.laundry_status !== 'Lost' && (
                    <button type="button" onClick={() => onReturn(log)}
                      className="rounded-lg border border-teal-200 px-2.5 py-1 text-xs font-bold text-teal-700 hover:bg-teal-50">
                      Update Return
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);
