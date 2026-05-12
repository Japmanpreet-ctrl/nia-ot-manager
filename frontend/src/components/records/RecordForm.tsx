import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { OTRecord, OTRecordInput } from '../../types';
import { anesthesiaOptions } from '../../types';
import { useCreateRecord, useUpdateRecord } from '../../hooks/useRecords';
import { getApiErrorMessage } from '../../lib/utils';
import { useUiStore } from '../../store/uiStore';

const schema = z.object({
  patient_name: z.string().min(2, 'Patient name is required'),
  gender: z.enum(['Male', 'Female', 'Other']),
  age: z.coerce.number().min(1, 'Age must be greater than 0').max(149, 'Age must be less than 150'),
  opd_number: z.string().optional().nullable(),
  ipd_number: z.string().optional().nullable(),
  diagnosis: z.string().min(3, 'Diagnosis is required'),
  surgical_procedure: z.string().min(3, 'Surgical procedure is required'),
  anesthesia_type: z.string().min(1, 'Anesthesia type is required'),
  ot_date: z.string().optional().nullable(),
  ot_start_time: z.string().optional().nullable(),
  final_case_time: z.string().optional().nullable(),
  consultant_name: z.string().min(2, 'This Field is required'),
  anesthetist_name: z.string().min(2, 'Name is required'),
  first_assistant: z.string().optional().nullable(),
  second_assistant: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

type FormValues = z.infer<typeof schema>;

export const RecordForm = ({ record, onSuccess }: { record?: OTRecord; onSuccess?: () => void }) => {
  const showToast = useUiStore((state) => state.showToast);
  const createRecord = useCreateRecord();
  const updateRecord = useUpdateRecord();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: record ? toFormValues(record) : {
      patient_name: '',
      gender: 'Male',
      age: 1,
      opd_number: '',
      ipd_number: '',
      diagnosis: '',
      surgical_procedure: '',
      anesthesia_type: 'General',
      ot_date: '',
      ot_start_time: '',
      final_case_time: '',
      consultant_name: '',
      anesthetist_name: '',
      first_assistant: '',
      second_assistant: '',
      notes: ''
    }
  });

  const isSaving = createRecord.isPending || updateRecord.isPending;

  const onSubmit = async (values: FormValues) => {
    const payload: OTRecordInput = normalize(values);
    try {
      if (record) {
        await updateRecord.mutateAsync({ id: record.id, payload });
        showToast('success', 'Record updated');
      } else {
        await createRecord.mutateAsync(payload);
        showToast('success', 'Record added successfully');
      }
      onSuccess?.();
    } catch (error) {
      showToast('error', getApiErrorMessage(error));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
      <FormSection title="Patient Information">
        <Field label="Patient Name" error={errors.patient_name?.message}><input {...register('patient_name')} className={inputClass} /></Field>
        <Field label="Gender" error={errors.gender?.message}><select {...register('gender')} className={inputClass}><option>Male</option><option>Female</option><option>Other</option></select></Field>
        <Field label="Age" error={errors.age?.message}><input type="number" {...register('age')} className={inputClass} /></Field>
        <Field label="OPD Number" error={errors.opd_number?.message}><input {...register('opd_number')} className={inputClass} /></Field>
        <Field label="IPD /Bed Number" error={errors.ipd_number?.message}><input {...register('ipd_number')} className={inputClass} /></Field>
      </FormSection>

      <FormSection title="Clinical Details">
        <Field label="Diagnosis" error={errors.diagnosis?.message} wide><textarea {...register('diagnosis')} rows={3} className={textareaClass} /></Field>
        <Field label="Surgical Procedure" error={errors.surgical_procedure?.message} wide><textarea {...register('surgical_procedure')} rows={3} className={textareaClass} /></Field>
        <Field label="Anesthesia Type" error={errors.anesthesia_type?.message}><select {...register('anesthesia_type')} className={inputClass}>{anesthesiaOptions.map((type) => <option key={type}>{type}</option>)}</select></Field>
      </FormSection>

      <FormSection title="OT Schedule">
        {record ? (
          <>
            <Field label="OT Date" error={errors.ot_date?.message}><input type="date" {...register('ot_date')} className={inputClass} /></Field>
            <Field label="Registration Time" error={errors.ot_start_time?.message}><input type="time" {...register('ot_start_time')} className={inputClass} /></Field>
            <Field label="Final Registration Time" error={errors.final_case_time?.message}><input type="time" {...register('final_case_time')} className={inputClass} /></Field>
          </>
        ) : (
          <div className="md:col-span-2 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-700">
            OT date and time are captured automatically from the live India time when this patient is registered.
          </div>
        )}
      </FormSection>

      <FormSection title="Surgical Team">
        <Field label="Consultant Name" error={errors.consultant_name?.message}><input {...register('consultant_name')} className={inputClass} /></Field>
        <Field label="Anesthetist Name" error={errors.anesthetist_name?.message}><input {...register('anesthetist_name')} className={inputClass} /></Field>
        <Field label="First Assistant" error={errors.first_assistant?.message}><input {...register('first_assistant')} className={inputClass} /></Field>
        <Field label="Second Assistant" error={errors.second_assistant?.message}><input {...register('second_assistant')} className={inputClass} /></Field>
      </FormSection>

      <FormSection title="Notes">
        <Field label="Notes" error={errors.notes?.message} wide><textarea {...register('notes')} rows={4} className={textareaClass} /></Field>
      </FormSection>

      <button type="submit" disabled={isSaving} className="w-full rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-60 md:w-auto">
        {isSaving ? 'Saving...' : 'Save Record'}
      </button>
    </form>
  );
};

const inputClass = 'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100 disabled:bg-slate-50';
const textareaClass = 'w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100 disabled:bg-slate-50';

const FormSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section>
    <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">{title}</h2>
    <div className="grid gap-4 md:grid-cols-2">{children}</div>
  </section>
);

const Field = ({ label, error, wide, children }: { label: string; error?: string; wide?: boolean; children: React.ReactNode }) => (
  <label className={wide ? 'md:col-span-2' : ''}>
    <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
    {children}
    {error && <span className="mt-1 block text-xs font-semibold text-red-500">{error}</span>}
  </label>
);

const toFormValues = (record: OTRecord): FormValues => ({
  patient_name: record.patient_name,
  gender: record.gender,
  age: record.age,
  opd_number: record.opd_number || '',
  ipd_number: record.ipd_number || '',
  diagnosis: record.diagnosis,
  surgical_procedure: record.surgical_procedure,
  anesthesia_type: record.anesthesia_type,
  ot_date: record.ot_date,
  ot_start_time: record.ot_start_time,
  final_case_time: record.final_case_time || '',
  consultant_name: record.consultant_name,
  anesthetist_name: record.anesthetist_name,
  first_assistant: record.first_assistant || '',
  second_assistant: record.second_assistant || '',
  notes: record.notes || ''
});

const normalize = (values: FormValues): OTRecordInput => ({
  ...values,
  ot_date: values.ot_date || '',
  ot_start_time: values.ot_start_time || '',
  opd_number: values.opd_number || null,
  ipd_number: values.ipd_number || null,
  final_case_time: values.final_case_time || null,
  first_assistant: values.first_assistant || null,
  second_assistant: values.second_assistant || null,
  notes: values.notes || null
});
