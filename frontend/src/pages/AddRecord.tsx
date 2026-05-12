import { useNavigate } from 'react-router-dom';
import { PageWrapper } from '../components/layout/PageWrapper';
import { RecordForm } from '../components/records/RecordForm';

export const AddRecord = () => {
  const navigate = useNavigate();
  return (
    <PageWrapper title="Add Record" subtitle="Enter patient, clinical, schedule, and surgical team details">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:p-7">
        <RecordForm onSuccess={() => navigate('/records')} />
      </div>
    </PageWrapper>
  );
};
