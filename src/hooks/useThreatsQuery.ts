// ============================================================================
// REACT QUERY HOOKS - AMENAZAS
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ThreatsService } from '@/services/threatsService';
import { QUERY_KEYS } from '@/lib/queryClient';
import type { Threat } from '@/types';
import { toast } from 'sonner';

/**
 * Hook para obtener todas las amenazas con caché
 */
export function useThreatsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.threats,
    queryFn: () => ThreatsService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener una amenaza por ID
 */
export function useThreatQuery(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.threat(id),
    queryFn: () => ThreatsService.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook para crear amenaza con invalidación de caché
 */
export function useCreateThreat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (threat: Omit<Threat, 'id' | 'createdAt' | 'updatedAt'>) =>
      ThreatsService.create(threat),
    onSuccess: () => {
      // Invalidar y refetch de amenazas
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.threats });
      toast.success('Amenaza creada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear amenaza: ${error.message}`);
    },
  });
}

/**
 * Hook para actualizar amenaza
 */
export function useUpdateThreat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Threat> }) =>
      ThreatsService.update(id, updates),
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.threats });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.threat(data.id) });
      toast.success('Amenaza actualizada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar amenaza: ${error.message}`);
    },
  });
}

/**
 * Hook para eliminar amenaza
 */
export function useDeleteThreat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ThreatsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.threats });
      toast.success('Amenaza eliminada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar amenaza: ${error.message}`);
    },
  });
}

/**
 * Hook para buscar amenazas cercanas
 */
export function useNearbyThreats(lat: number, lng: number, radius: number) {
  return useQuery({
    queryKey: ['nearby-threats', lat, lng, radius],
    queryFn: () => ThreatsService.getNearby(lat, lng, radius),
    enabled: !!(lat && lng && radius),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}