import { format, parseISO } from 'date-fns';
import type { AppUser, PermissionAction, UserRole } from '../types';

export const cn = (...inputs: Array<string | false | null | undefined>) => inputs.filter(Boolean).join(' ');

const permissions: Record<UserRole, PermissionAction[]> = {
  admin: ['view_records', 'add_record', 'edit_record', 'delete_record', 'view_analytics', 'view_operations', 'view_inventory', 'manage_linen', 'export_pdf', 'access_admin'],
  doctor: ['view_records', 'add_record', 'edit_record', 'view_analytics', 'view_operations', 'view_inventory', 'manage_linen', 'export_pdf'],
  nurse: ['view_records', 'add_record', 'view_operations', 'view_inventory', 'manage_linen', 'export_pdf'],
  data_entry: ['view_records', 'add_record', 'view_inventory', 'manage_linen']
};

export const canUser = (userOrRole: AppUser | UserRole | undefined | null, action: PermissionAction) => {
  const role = typeof userOrRole === 'string' ? userOrRole : userOrRole?.role;
  if (!role) return false;

  const hasBasePermission = permissions[role]?.includes(action) ?? false;
  if (hasBasePermission) return true;

  if (action === 'view_operations' && typeof userOrRole !== 'string') {
    return role === 'data_entry' && userOrRole?.role_level === 5;
  }

  return false;
};

export const getInitials = (nameOrEmail = 'User') =>
  nameOrEmail
    .split(/[ @._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';

export const formatDate = (date: string, pattern = 'dd MMM yyyy') => format(parseISO(date), pattern);

export const formatDateLong = (date: string) => format(parseISO(date), 'dd MMMM yyyy');

export const formatTime = (time?: string | null) => {
  if (!time) return '-';
  const [hours, minutes] = time.split(':').map(Number);
  const value = new Date();
  value.setHours(hours || 0, minutes || 0, 0, 0);
  return format(value, 'hh:mm a');
};

export const getApiErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error && 'response' in error) {
    const response = (error as { response?: { data?: { error?: string } } }).response;
    return response?.data?.error || 'Something went wrong';
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
};
