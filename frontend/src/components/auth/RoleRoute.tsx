import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { canUser } from '../../lib/utils';
import type { PermissionAction } from '../../types';

export const RoleRoute = ({ action }: { action?: PermissionAction }) => {
  const { appUser } = useAuthStore();
  const location = useLocation();

  if (!appUser) return <Navigate to="/login" state={{ from: location }} replace />;
  
  if (action && !canUser(appUser.role, action)) {
    // If they don't have permission for this route, bounce them back to dashboard
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Outlet />;
};
