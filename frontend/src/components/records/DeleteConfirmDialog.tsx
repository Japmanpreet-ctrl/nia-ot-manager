import { AlertTriangle } from 'lucide-react';
import type { OTRecord } from '../../types';

export const DeleteConfirmDialog = ({
  record,
  isDeleting,
  onCancel,
  onConfirm
}: {
  record: OTRecord;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4">
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
      <div className="mb-4 inline-flex rounded-full bg-red-100 p-3 text-red-600">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-bold text-slate-900">Delete OT record?</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        This will permanently remove the OT record for <span className="font-semibold text-slate-800">{record.patient_name}</span>.
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
        <button type="button" onClick={onConfirm} disabled={isDeleting} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60">
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
);
