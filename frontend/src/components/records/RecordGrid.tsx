import type { OTRecord } from '../../types';
import { EmptyState } from '../shared/EmptyState';
import { SkeletonCard } from '../shared/SkeletonCard';
import { RecordCard } from './RecordCard';

export const RecordGrid = ({
  records,
  isLoading,
  onRecordClick,
  emptySubtitle = 'Try adjusting filters'
}: {
  records: OTRecord[];
  isLoading: boolean;
  onRecordClick: (record: OTRecord) => void;
  emptySubtitle?: string;
}) => {
  if (isLoading) {
    return (
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => <SkeletonCard key={index} />)}
      </div>
    );
  }

  if (!records.length) return <EmptyState subtitle={emptySubtitle} showAddButton />;

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {records.map((record) => <RecordCard key={record.id} record={record} onClick={onRecordClick} />)}
    </div>
  );
};
