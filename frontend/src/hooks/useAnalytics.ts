import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import api from '../lib/api';
import type { AnalyticsSummary, MonthlyAnalytics, OperationsOverview, YearlyAnalytics } from '../types';

export const useAnalyticsSummary = () =>
  useQuery({
    queryKey: ['analytics-summary'],
    queryFn: async () => {
      const { data } = await api.get<AnalyticsSummary>('/analytics/summary');
      return data;
    }
  });

export const useMonthlyAnalytics = (year: number, month: number) =>
  useQuery({
    queryKey: ['analytics-monthly', year, month],
    queryFn: async () => {
      const { data } = await api.get<MonthlyAnalytics>('/analytics/monthly', { params: { year, month } });
      return data;
    }
  });

export const useYearlyAnalytics = (year: number) =>
  useQuery({
    queryKey: ['analytics-yearly', year],
    queryFn: async () => {
      const { data } = await api.get<YearlyAnalytics>('/analytics/yearly', { params: { year } });
      return data;
    }
  });

export const useOperationsOverview = (date?: string) =>
  useQuery({
    queryKey: ['operations-overview', date],
    queryFn: async () => {
      const { data } = await api.get<OperationsOverview>('/operations/overview', { params: { date } });
      return data;
    },
    retry: (failureCount, error) => {
      const status = (error as AxiosError).response?.status;
      if (status === 401 || status === 403 || status === 404) return false;
      return failureCount < 1;
    }
  });

export const useSaveOperationsOverview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: OperationsOverview) => {
      const { data } = await api.put<OperationsOverview>('/operations/overview', payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['operations-overview', data.date], data);
      queryClient.invalidateQueries({ queryKey: ['operations-overview'] });
    }
  });
};
