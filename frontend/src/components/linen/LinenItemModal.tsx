import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { OtLinenItem, OtLinenItemInput } from '../../types';

const LINEN_CATEGORIES = [
  'Drapes & Covers',
  'Gowns & Wear',
  'Towels & Wraps',
  'Sheets & Linen',
  'Packs & Sets',
  'Other',
];

const LINEN_UNITS = ['pieces', 'sets', 'pairs', 'rolls', 'bundles'];

const inputClass =
  'h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100';

const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500';

interface LinenItemModalProps {
  mode: 'add' | 'edit';
  initial?: OtLinenItem | null;
  onCancel: () => void;
  onSubmit: (payload: OtLinenItemInput) => void;
  isLoading?: boolean;
}

const blankForm: OtLinenItemInput = {
  item_name: '',
  category: 'Drapes & Covers',
  quantity_available: 0,
  in_laundry: 0,
  damaged: 0,
  minimum_threshold: 5,
  unit: 'pieces',
  notes: '',
};

export const LinenItemModal = ({ mode, initial, onCancel, onSubmit, isLoading }: LinenItemModalProps) => {
  const [form, setForm] = useState<OtLinenItemInput>(blankForm);
  const [errors, setErrors] = useState<Partial<Record<keyof OtLinenItemInput, string>>>({});

  useEffect(() => {
    if (mode === 'edit' && initial) {
      setForm({
        item_name: initial.item_name,
        category: initial.category,
        quantity_available: initial.quantity_available,
        in_laundry: initial.in_laundry,
        damaged: initial.damaged,
        minimum_threshold: initial.minimum_threshold,
        unit: initial.unit,
        notes: initial.notes ?? '',
      });
    } else {
      setForm(blankForm);
    }
    setErrors({});
  }, [mode, initial]);

  const set = (key: keyof OtLinenItemInput, value: string | number) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof OtLinenItemInput, string>> = {};
    if (!form.item_name.trim()) errs.item_name = 'Item name is required.';
    if (!form.category.trim()) errs.category = 'Category is required.';
    if (form.quantity_available < 0) errs.quantity_available = 'Cannot be negative.';
    if ((form.in_laundry ?? 0) < 0) errs.in_laundry = 'Cannot be negative.';
    if ((form.damaged ?? 0) < 0) errs.damaged = 'Cannot be negative.';
    if (form.minimum_threshold < 0) errs.minimum_threshold = 'Cannot be negative.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit(form);
  };

  const totalStock = (form.quantity_available || 0) + (form.in_laundry || 0) + (form.damaged || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {mode === 'add' ? 'Add Linen Item' : 'Edit Linen Item'}
            </h3>
            <p className="mt-0.5 text-sm text-slate-500">
              Status is calculated automatically from stock counts.
            </p>
          </div>
          <button type="button" onClick={onCancel} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 px-6 py-5">
          {/* Row 1: Item Name + Category */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className={labelClass}>Item Name *</span>
              <input
                className={inputClass}
                value={form.item_name}
                onChange={(e) => set('item_name', e.target.value)}
                placeholder="e.g., OT Drape Large"
              />
              {errors.item_name && <p className="mt-1 text-xs text-red-600">{errors.item_name}</p>}
            </label>
            <label>
              <span className={labelClass}>Category *</span>
              <select
                className={inputClass}
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
              >
                {LINEN_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Row 2: Quantities */}
          <div className="grid gap-4 sm:grid-cols-3">
            <label>
              <span className={labelClass}>Available Quantity *</span>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={form.quantity_available}
                onChange={(e) => set('quantity_available', Math.max(0, parseInt(e.target.value) || 0))}
              />
              {errors.quantity_available && <p className="mt-1 text-xs text-red-600">{errors.quantity_available}</p>}
            </label>
            <label>
              <span className={labelClass}>In Laundry</span>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={form.in_laundry ?? 0}
                onChange={(e) => set('in_laundry', Math.max(0, parseInt(e.target.value) || 0))}
              />
              {errors.in_laundry && <p className="mt-1 text-xs text-red-600">{errors.in_laundry}</p>}
            </label>
            <label>
              <span className={labelClass}>Damaged</span>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={form.damaged ?? 0}
                onChange={(e) => set('damaged', Math.max(0, parseInt(e.target.value) || 0))}
              />
              {errors.damaged && <p className="mt-1 text-xs text-red-600">{errors.damaged}</p>}
            </label>
          </div>

          {/* Row 3: Threshold + Unit */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className={labelClass}>Minimum Threshold *</span>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={form.minimum_threshold}
                onChange={(e) => set('minimum_threshold', Math.max(0, parseInt(e.target.value) || 0))}
              />
              {errors.minimum_threshold && <p className="mt-1 text-xs text-red-600">{errors.minimum_threshold}</p>}
            </label>
            <label>
              <span className={labelClass}>Unit</span>
              <select
                className={inputClass}
                value={form.unit}
                onChange={(e) => set('unit', e.target.value)}
              >
                {LINEN_UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Notes */}
          <label>
            <span className={labelClass}>Notes</span>
            <textarea
              rows={2}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Optional notes..."
            />
          </label>

          {/* Stock summary */}
          <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <span className="font-semibold text-slate-500">Total Inventory:</span>
            <span className="font-bold text-slate-900">{totalStock} {form.unit}</span>
            <span className="ml-auto font-semibold text-slate-500">
              Available: <span className="font-bold text-teal-700">{form.quantity_available}</span>
              {' · '}
              In Laundry: <span className="font-bold text-amber-700">{form.in_laundry ?? 0}</span>
              {' · '}
              Damaged: <span className="font-bold text-red-700">{form.damaged ?? 0}</span>
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {isLoading ? 'Saving…' : mode === 'add' ? 'Add Item' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
