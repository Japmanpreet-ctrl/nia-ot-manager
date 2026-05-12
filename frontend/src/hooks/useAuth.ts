import { useAuthStore } from '../store/authStore';
import { canUser } from '../lib/utils';
import type { PermissionAction } from '../types';

export const useAuth = () => {
  const { firebaseUser, appUser, isLoading } = useAuthStore();
  return {
    firebaseUser,
    appUser,
    isLoading,
    role: appUser?.role,
    can: (action: PermissionAction) => canUser(appUser?.role, action)
  };
};
