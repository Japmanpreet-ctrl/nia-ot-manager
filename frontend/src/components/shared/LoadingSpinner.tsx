export const LoadingSpinner = ({ label = 'Loading' }: { label?: string }) => (
  <div className="flex min-h-screen items-center justify-center bg-slate-100">
    <div className="flex flex-col items-center gap-3">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-100 border-t-teal-600" />
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </div>
  </div>
);
