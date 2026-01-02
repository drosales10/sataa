// ============================================================================
// REACT QUERY HOOKS - ALERTAS
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertsService } from '@/services/alertsService';
import { QUERY_KEYS } from '@/lib/queryClient';
import type { Alert } from '@/types';
import { toast } from 'sonner';

/**
 * Hook para obtener todas las alertas con caché
 */
export function useAlertsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.alerts,
    queryFn: () => AlertsService.getAll(),
    staleTime: 3 * 60 * 1000, // 3 minutos
  });
}

/**
 * Hook para obtener una alerta por ID
 */
export function useAlertQuery(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.alert(id),
    queryFn: () => AlertsService.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook para crear alerta
 */
export function useCreateAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alert: Omit<Alert, 'id' | 'createdAt'>) =>
      AlertsService.create(alert),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.alerts });
      toast.success('Alerta creada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear alerta: ${error.message}`);
    },
  });
}

/**
 * Hook para reconocer alerta
 */
export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => AlertsService.acknowledge(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.alerts });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.alert(data.id) });
      toast.success('Alerta reconocida');
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

/**
 * Hook para resolver alerta
 */
export function useResolveAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => AlertsService.resolve(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.alerts });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.alert(data.id) });
      toast.success('Alerta resuelta');
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

/**
 * Hook para escalar alerta
 */
export function useEscalateAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => AlertsService.escalate(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.alerts });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.alert(data.id) });
      toast.success('Alerta escalada');
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}