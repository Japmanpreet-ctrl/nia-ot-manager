import { Trash2, Search, Users, UserCog, Stethoscope } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage } from '../lib/utils';
import type { AppUser, UserRole } from '../types';
import { useUiStore } from '../store/uiStore';
import { PageWrapper } from '../components/layout/PageWrapper';
import { RoleBadge } from '../components/shared/RoleBadge';

const roles: UserRole[] = ['admin', 'doctor', 'nurse', 'data_entry'];

export const AdminPanel = () => {
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);
  const [searchQuery, setSearchQuery] = useState('');

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get<AppUser[]>('/users');
      return data;
    }
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: UserRole }) => {
      const { data } = await api.put<AppUser>(`/users/${id}/role`, { role });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast('success', 'Role updated');
    },
    onError: (error) => showToast('error', getApiErrorMessage(error))
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast('success', 'User deleted');
    },
    onError: (error) => showToast('error', getApiErrorMessage(error))
  });

  if (!can('access_admin')) return <Navigate to="/dashboard" replace />;

  const users = usersQuery.data || [];
  const totalUsers = users.length;
  const totalAdmins = users.filter(u => u.role === 'admin').length;
  const totalClinicalStaff = users.filter(u => ['doctor', 'nurse', 'data_entry'].includes(u.role)).length;

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageWrapper title="User Management" subtitle="Manage roles and access for OT staff">
      
      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-5">
          <div className="p-4 bg-teal-50 rounded-xl">
            <Users className="h-8 w-8 text-teal-600" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Total Users</p>
            <p className="text-3xl font-black text-slate-900">{totalUsers}</p>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-5">
          <div className="p-4 bg-indigo-50 rounded-xl">
            <UserCog className="h-8 w-8 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Admins</p>
            <p className="text-3xl font-black text-slate-900">{totalAdmins}</p>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-5">
          <div className="p-4 bg-emerald-50 rounded-xl">
            <Stethoscope className="h-8 w-8 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Clinical Staff</p>
            <p className="text-3xl font-black text-slate-900">{totalClinicalStaff}</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search users by name or email..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full h-14 pl-12 pr-4 rounded-2xl glass-panel text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-shadow"
        />
      </div>

      {/* Users Table */}
      <div className="glass-panel overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50/50 backdrop-blur-sm text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{user.full_name}</td>
                    <td className="px-6 py-4 text-slate-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <RoleBadge role={user.role} />
                        <select 
                          value={user.role} 
                          onChange={(event) => updateRole.mutate({ id: user.id, role: event.target.value as UserRole })} 
                          className="h-9 rounded-lg border border-slate-200 bg-white/50 px-3 text-xs font-semibold outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all cursor-pointer"
                        >
                          {roles.map((role) => <option key={role} value={role}>{role.replace('_', ' ')}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        type="button" 
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this user?')) {
                            deleteUser.mutate(user.id);
                          }
                        }} 
                        className="inline-flex rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  );
};
