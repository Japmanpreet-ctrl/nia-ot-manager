import { X } from 'lucide-react';
import { useState } from 'react';
import type { OTRecord } from '../../types';
import { canUser, formatDateLong, formatTime } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { useDeleteRecord } from '../../hooks/useRecords';
import { AnesthesiaBadge } from '../shared/AnesthesiaBadge';
import { GenderBadge } from '../shared/GenderBadge';
import { ExportPDFButton } from '../shared/ExportPDFButton';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { RecordForm } from './RecordForm';

export const RecordDetailModal = ({ record, onClose }: { record: OTRecord; onClose: () => void }) => {
  const role = useAuthStore((state) => state.appUser?.role);
  const showToast = useUiStore((state) => state.showToast);
  const deleteRecord = useDeleteRecord();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteRecord.mutateAsync(record.id);
      showToast('success', 'Record deleted');
      setConfirmDelete(false);
      onClose();
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Unable to delete record');
    }
  };

  if (editing) {
    return (
      <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-950/60 p-0 md:p-6">
        <div className="mx-auto min-h-screen max-w-4xl bg-white p-5 shadow-2xl md:min-h-0 md:rounded-2xl md:p-7">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Edit OT Record</h2>
            <button type="button" onClick={() => setEditing(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button>
          </div>
          <RecordForm record={record} onSuccess={() => setEditing(false)} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-950/60 p-0 md:p-6">
        <div className="mx-auto min-h-screen max-w-3xl bg-white shadow-2xl md:min-h-0 md:rounded-2xl">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur md:rounded-t-2xl">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{record.patient_name}</h2>
              <p className="text-sm text-slate-500">Operation Theatre record</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button>
          </div>

          <div className="space-y-4 p-6">
            <Section color="border-blue-500" title="Patient Information">
              <Info label="Name" value={record.patient_name} />
              <Info label="Age" value={`${record.age} yrs`} />
              <Info label="Gender" value={<GenderBadge gender={record.gender} />} />
              <Info label="OPD#" value={record.opd_number || '-'} />
              <Info label="IPD#" value={record.ipd_number || '-'} />
            </Section>

            <Section color="border-emerald-500" title="Clinical Details">
              <Info label="Diagnosis" value={record.diagnosis} wide />
              <Info label="Surgical Procedure" value={record.surgical_procedure} wide />
              <Info label="Anesthesia" value={<AnesthesiaBadge type={record.anesthesia_type} />} />
            </Section>



            <Section color="border-purple-500" title="Surgical Team">
              <Info label="Consultant" value={`Dr. ${record.consultant_name}`} />
              <Info label="Anesthetist" value={`Dr. ${record.anesthetist_name}`} />
              <Info label="1st Assistant" value={record.first_assistant || '-'} />
              <Info label="2nd Assistant" value={record.second_assistant || '-'} />
            </Section>

            {record.notes && (
              <Section color="border-slate-300" title="Notes">
                <p className="text-sm leading-6 text-slate-700">{record.notes}</p>
              </Section>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 px-6 py-4">
            {canUser(role, 'export_pdf') && <ExportPDFButton record={record} />}
            {canUser(role, 'edit_record') && <button type="button" onClick={() => setEditing(true)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Edit</button>}
            {canUser(role, 'delete_record') && <button type="button" onClick={() => setConfirmDelete(true)} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">Delete</button>}
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Close</button>
          </div>
        </div>
      </div>

      {confirmDelete && <DeleteConfirmDialog record={record} isDeleting={deleteRecord.isPending} onCancel={() => setConfirmDelete(false)} onConfirm={handleDelete} />}
    </>
  );
};

const Section = ({ title, color, children }: { title: string; color: string; children: React.ReactNode }) => (
  <section className={`rounded-xl border border-slate-200 border-l-4 ${color} bg-white p-4`}>
    <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">{title}</h3>
    <div className="grid gap-4 md:grid-cols-2">{children}</div>
  </section>
);

const Info = ({ label, value, wide = false }: { label: string; value: React.ReactNode; wide?: boolean }) => (
  <div className={wide ? 'md:col-span-2' : ''}>
    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
    <div className="mt-1 text-sm font-semibold text-slate-800">{value}</div>
  </div>
);
