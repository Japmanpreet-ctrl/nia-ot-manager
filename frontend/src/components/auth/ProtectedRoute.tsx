import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LoadingSpinner } from '../shared/LoadingSpinner';

export const ProtectedRoute = () => {
  const { firebaseUser, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) return <LoadingSpinner label="Checking session" />;
  if (!firebaseUser) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
};
