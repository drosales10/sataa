// ============================================================================
// REACT QUERY - CONFIGURACIÓN
// ============================================================================

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tiempo que los datos se consideran "frescos" (no se refetch automáticamente)
      staleTime: 5 * 60 * 1000, // 5 minutos
      
      // Tiempo que los datos permanecen en caché
      gcTime: 10 * 60 * 1000, // 10 minutos (antes era cacheTime)
      
      // Reintentar en caso de error
      retry: 1,
      
      // Refetch cuando la ventana recupera el foco
      refetchOnWindowFocus: false,
      
      // Refetch cuando se reconecta a internet
      refetchOnReconnect: true,
      
      // Refetch cuando el componente se monta
      refetchOnMount: true,
    },
    mutations: {
      // Reintentar mutaciones fallidas
      retry: 0,
    },
  },
});

// Query Keys - Constantes para mantener consistencia
export const QUERY_KEYS = {
  threats: ['threats'] as const,
  threat: (id: string) => ['threats', id] as const,
  alerts: ['alerts'] as const,
  alert: (id: string) => ['alerts', id] as const,
  communityReports: ['community-reports'] as const,
  communityReport: (id: string) => ['community-reports', id] as const,
  environmentalVariables: (filters?: Record<string, unknown>) => 
    ['environmental-variables', filters] as const,
  timeSeries: (type: string, location: string, dates: { start: string; end: string }) => 
    ['time-series', type, location, dates] as const,
  statistics: (type: string, location: string, dates: { start: string; end: string }) => 
    ['statistics', type, location, dates] as const,
};