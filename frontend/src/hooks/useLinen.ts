import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import api from '../lib/api';
import type {
  OtLinenItem,
  OtLinenItemInput,
  OtLinenLaundryLog,
  OtLinenStats,
  OtLinenAuditLog,
  PaginatedLinenItems,
} from '../types';

const noRetryOnAuthErrors = (failureCount: number, error: unknown) => {
  const status = (error as AxiosError).response?.status;
  if (status === 401 || status === 403 || status === 404) return false;
  return failureCount < 1;
};

/* ── Stats ── */
export const useLinenStats = () =>
  useQuery({
    queryKey: ['linen-stats'],
    queryFn: async () => {
      const { data } = await api.get<OtLinenStats>('/linen/stats');
      return data;
    },
    retry: noRetryOnAuthErrors,
  });

/* ── Items list ── */
export const useLinenItems = (params: {
  page?: number;
  search?: string;
  category?: string;
  status?: string;
  laundry_status?: string;
}) =>
  useQuery({
    queryKey: ['linen-items', params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedLinenItems>('/linen/items', { params });
      return data;
    },
    retry: noRetryOnAuthErrors,
    placeholderData: (prev) => prev,
  });

/* ── Create item ── */
export const useCreateLinenItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: OtLinenItemInput) => {
      const { data } = await api.post<OtLinenItem>('/linen/items', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linen-items'] });
      queryClient.invalidateQueries({ queryKey: ['linen-stats'] });
    },
  });
};

/* ── Update item ── */
export const useUpdateLinenItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<OtLinenItemInput> & { id: string }) => {
      const { data } = await api.put<OtLinenItem>(`/linen/items/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linen-items'] });
      queryClient.invalidateQueries({ queryKey: ['linen-stats'] });
    },
  });
};

/* ── Delete item ── */
export const useDeleteLinenItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/linen/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linen-items'] });
      queryClient.invalidateQueries({ queryKey: ['linen-stats'] });
    },
  });
};

/* ── Laundry logs ── */
export const useLaundryLogs = (params?: { item_id?: string; status?: string }) =>
  useQuery({
    queryKey: ['linen-laundry', params],
    queryFn: async () => {
      const { data } = await api.get<OtLinenLaundryLog[]>('/linen/laundry', { params });
      return data;
    },
    retry: noRetryOnAuthErrors,
  });

/* ── Send to laundry ── */
export const useCreateLaundryLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      linen_item_id: string;
      quantity_sent: number;
      date_sent: string;
      expected_return_date: string;
      notes?: string;
    }) => {
      const { data } = await api.post<OtLinenLaundryLog>('/linen/laundry', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linen-laundry'] });
      queryClient.invalidateQueries({ queryKey: ['linen-items'] });
      queryClient.invalidateQueries({ queryKey: ['linen-stats'] });
    },
  });
};

/* ── Update laundry log (mark returned) ── */
export const useUpdateLaundryLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string;
      returned_quantity?: number;
      laundry_status?: string;
      notes?: string;
    }) => {
      const { id, ...rest } = payload;
      const { data } = await api.put<OtLinenLaundryLog>(`/linen/laundry/${id}`, rest);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linen-laundry'] });
      queryClient.invalidateQueries({ queryKey: ['linen-items'] });
      queryClient.invalidateQueries({ queryKey: ['linen-stats'] });
    },
  });
};

/* ── Audit logs ── */
export const useLinenAuditLogs = (params?: { item_id?: string; page?: number }) =>
  useQuery({
    queryKey: ['linen-audit', params],
    queryFn: async () => {
      const { data } = await api.get<{ data: OtLinenAuditLog[]; total: number; page: number; totalPages: number }>('/linen/audit', { params });
      return data;
    },
    retry: noRetryOnAuthErrors,
  });
