// ============================================================================
// REACT QUERY HOOKS - REPORTES COMUNITARIOS
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReportsService, type CommunityReport } from '@/services/reportsService';
import { QUERY_KEYS } from '@/lib/queryClient';
import { toast } from 'sonner';

/**
 * Hook para obtener todos los reportes comunitarios
 */
export function useCommunityReportsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.communityReports,
    queryFn: () => ReportsService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para crear reporte comunitario
 */
export function useCreateCommunityReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (report: Omit<CommunityReport, 'id' | 'createdAt' | 'updatedAt' | 'status'>) =>
      ReportsService.create(report),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.communityReports });
      toast.success('Reporte enviado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al enviar reporte: ${error.message}`);
    },
  });
}

/**
 * Hook para verificar reporte
 */
export function useVerifyReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ReportsService.verify(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.communityReports });
      toast.success('Reporte verificado');
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

/**
 * Hook para subir imagen
 */
export function useUploadImage() {
  return useMutation({
    mutationFn: ({ file, reportId }: { file: File; reportId: string }) =>
      ReportsService.uploadImage(file, reportId),
    onError: (error: Error) => {
      toast.error(`Error al subir imagen: ${error.message}`);
    },
  });
}