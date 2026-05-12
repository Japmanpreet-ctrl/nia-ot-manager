import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { OTRecord, OTRecordInput, PaginatedRecords } from '../types';

export interface RecordQueryParams {
  search?: string;
  date?: string;
  consultant?: string;
  anesthesia_type?: string;
  page?: number;
  limit?: number;
}

export const useRecords = (params: RecordQueryParams = {}) =>
  useQuery({
    queryKey: ['records', params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedRecords>('/records', { params });
      return data;
    }
  });

export const useRecord = (id?: string) =>
  useQuery({
    queryKey: ['record', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<OTRecord>(`/records/${id}`);
      return data;
    }
  });

export const useCreateRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: OTRecordInput) => {
      const { data } = await api.post<OTRecord>('/records', payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['records'] })
  });
};

export const useUpdateRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<OTRecordInput> }) => {
      const { data } = await api.put<OTRecord>(`/records/${id}`, payload);
      return data;
    },
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.setQueryData(['record', record.id], record);
    }
  });
};

export const useDeleteRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<{ success: boolean }>(`/records/${id}`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['records'] })
  });
};
