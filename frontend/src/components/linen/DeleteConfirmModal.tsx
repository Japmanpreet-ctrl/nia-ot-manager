import { X } from 'lucide-react';

interface DeleteConfirmModalProps {
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const DeleteConfirmModal = ({ itemName, onConfirm, onCancel, isLoading }: DeleteConfirmModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
        <div>
          <h3 className="text-base font-bold text-slate-900">Delete Linen Item</h3>
          <p className="mt-1 text-sm text-slate-500">This action cannot be undone.</p>
        </div>
        <button type="button" onClick={onCancel} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="px-6 py-5">
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <p className="text-sm font-semibold text-red-700">
            Are you sure you want to delete{' '}
            <span className="font-bold">"{itemName}"</span>?
          </p>
          <p className="mt-1 text-xs text-red-500">
            The item will be soft-deleted and removed from the active inventory. Existing laundry logs will be preserved.
          </p>
        </div>
      </div>
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
          onClick={onConfirm}
          disabled={isLoading}
          className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {isLoading ? 'Deleting…' : 'Delete Item'}
        </button>
      </div>
    </div>
  </div>
);
