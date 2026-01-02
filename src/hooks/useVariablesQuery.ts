// ============================================================================
// REACT QUERY HOOKS - VARIABLES AMBIENTALES
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VariablesService, type EnvironmentalData } from '@/services/variablesService';
import { QUERY_KEYS } from '@/lib/queryClient';
import { toast } from 'sonner';

/**
 * Hook para obtener variables ambientales con filtros
 */
export function useEnvironmentalVariablesQuery(filters?: {
  variableType?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.environmentalVariables(filters),
    queryFn: () => VariablesService.getAll(filters),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para obtener serie temporal
 */
export function useTimeSeriesQuery(
  variableType: string,
  location: string,
  startDate: string,
  endDate: string
) {
  return useQuery({
    queryKey: QUERY_KEYS.timeSeries(variableType, location, { start: startDate, end: endDate }),
    queryFn: () => VariablesService.getTimeSeries(variableType, location, startDate, endDate),
    enabled: !!(variableType && location && startDate && endDate),
    staleTime: 15 * 60 * 1000, // 15 minutos
  });
}

/**
 * Hook para obtener estadísticas
 */
export function useStatisticsQuery(
  variableType: string,
  location: string,
  startDate: string,
  endDate: string
) {
  return useQuery({
    queryKey: QUERY_KEYS.statistics(variableType, location, { start: startDate, end: endDate }),
    queryFn: () => VariablesService.getStatistics(variableType, location, startDate, endDate),
    enabled: !!(variableType && location && startDate && endDate),
    staleTime: 15 * 60 * 1000, // 15 minutos
  });
}

/**
 * Hook para crear variable ambiental
 */
export function useCreateEnvironmentalData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<EnvironmentalData, 'id' | 'recordedAt'>) =>
      VariablesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['environmental-variables'] });
      toast.success('Dato ambiental registrado');
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

/**
 * Hook para crear múltiples variables (batch)
 */
export function useCreateEnvironmentalDataBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dataArray: Omit<EnvironmentalData, 'id' | 'recordedAt'>[]) =>
      VariablesService.createBatch(dataArray),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['environmental-variables'] });
      toast.success(`${data.length} registros creados`);
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}