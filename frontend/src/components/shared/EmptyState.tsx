import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';

export const EmptyState = ({
  title = 'No Records Found',
  subtitle = 'Try adjusting filters',
  showAddButton = false
}: {
  title?: string;
  subtitle?: string;
  showAddButton?: boolean;
}) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/50 backdrop-blur-sm px-6 py-16 text-center transition-colors hover:bg-white/80">
    <div className="mb-6 text-slate-300">
      <ClipboardList className="h-16 w-16" strokeWidth={1.5} />
    </div>
    <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
    <p className="mt-2 max-w-sm text-sm text-slate-500">{subtitle}</p>
    {showAddButton && (
      <Link to="/add-record" className="mt-6 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700">
        Add Record
      </Link>
    )}
  </div>
);
