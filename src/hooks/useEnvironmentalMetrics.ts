import { useQuery } from '@tanstack/react-query';
import { geeService } from '@/services/geeService';
import type { AOI } from '@/types';

export const useEnvironmentalMetrics = (aoi: AOI | null) => {
  return useQuery({
    queryKey: ['environmental-metrics', aoi?.id],
    queryFn: () => {
      if (!aoi) return null;
      return geeService.getEnvironmentalMetrics(aoi);
    },
    enabled: !!aoi,
    staleTime: 1000 * 60 * 10, // 10 minutos
    retry: 2,
  });
};
