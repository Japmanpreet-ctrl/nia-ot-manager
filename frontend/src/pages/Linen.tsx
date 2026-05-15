import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PageWrapper } from '../components/layout/PageWrapper';
import { OtLinenModule } from '../components/linen/OtLinenModule';

export const Linen = () => {
  const { can } = useAuth();
  
  if (!can('view_inventory')) return <Navigate to="/dashboard" replace />;

  return (
    <PageWrapper title="OT Linen Management" subtitle="Manage sterile and non-sterile linen stock and laundry">
      <OtLinenModule />
    </PageWrapper>
  );
};
