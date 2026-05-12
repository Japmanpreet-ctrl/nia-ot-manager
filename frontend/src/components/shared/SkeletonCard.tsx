export const SkeletonCard = () => (
  <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex justify-between">
      <div className="h-6 w-16 rounded-full bg-slate-200" />
      <div className="h-6 w-24 rounded-full bg-slate-200" />
    </div>
    <div className="mt-7 h-6 w-3/4 rounded bg-slate-200" />
    <div className="mt-3 h-4 w-28 rounded bg-slate-200" />
    <div className="my-6 h-px bg-slate-200" />
    <div className="space-y-3">
      <div className="h-4 w-full rounded bg-slate-200" />
      <div className="h-4 w-5/6 rounded bg-slate-200" />
    </div>
    <div className="my-6 h-px bg-slate-200" />
    <div className="h-4 w-2/3 rounded bg-slate-200" />
    <div className="mt-4 flex gap-2">
      <div className="h-7 w-20 rounded-full bg-slate-200" />
      <div className="h-7 w-20 rounded-full bg-slate-200" />
    </div>
  </div>
);
