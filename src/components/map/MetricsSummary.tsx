import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { EnvironmentalMetrics } from '@/types';
import { TreePine, Flame, Droplets, Cloud } from 'lucide-react';

interface MetricsSummaryProps {
  metrics: EnvironmentalMetrics;
}

export const MetricsSummary: React.FC<MetricsSummaryProps> = ({ metrics }) => {
  // Función para determinar el color según el nivel de riesgo
  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'bajo':
      case 'low':
        return 'bg-green-500';
      case 'medio':
      case 'medium':
        return 'bg-yellow-500';
      case 'alto':
      case 'high':
        return 'bg-orange-500';
      case 'muy alto':
      case 'very high':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRiskBadgeVariant = (level: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (level?.toLowerCase()) {
      case 'bajo':
      case 'low':
        return 'default';
      case 'medio':
      case 'medium':
        return 'secondary';
      case 'alto':
      case 'high':
      case 'muy alto':
      case 'very high':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Cobertura Boscosa */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TreePine className="h-5 w-5 text-green-600" />
            <span className="font-medium">Cobertura Boscosa</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {metrics.coberturaBoscosa?.porcentaje?.toFixed(1) || 0}%
          </span>
        </div>
        <Progress 
          value={metrics.coberturaBoscosa?.porcentaje || 0} 
          className="h-2"
        />
        <p className="text-xs text-muted-foreground">
          {metrics.coberturaBoscosa?.areaHectareas?.toFixed(2) || 0} hectáreas de bosque
        </p>
      </div>

      {/* Deforestación */}
      {metrics.deforestacion && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">Deforestación (últimos 5 años)</span>
            <Badge variant={getRiskBadgeVariant(metrics.deforestacion.nivel)}>
              {metrics.deforestacion.nivel}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {metrics.deforestacion.areaHectareas?.toFixed(2) || 0} ha perdidas 
            ({metrics.deforestacion.porcentaje?.toFixed(2) || 0}%)
          </p>
        </div>
      )}

      {/* Carbono */}
      {metrics.carbono && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Carbono Acumulado</span>
            </div>
            <span className="text-sm font-semibold">
              {metrics.carbono.totalToneladas?.toFixed(0) || 0} t CO₂
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Densidad: {metrics.carbono.densidadPromedio?.toFixed(1) || 0} t/ha
          </p>
        </div>
      )}

      {/* Riesgo de Incendio */}
      {metrics.riesgoIncendio && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-600" />
              <span className="font-medium">Riesgo de Incendio</span>
            </div>
            <Badge variant={getRiskBadgeVariant(metrics.riesgoIncendio.nivel)}>
              {metrics.riesgoIncendio.nivel}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-2 flex-1 rounded ${getRiskColor(metrics.riesgoIncendio.nivel)}`} />
          </div>
          <p className="text-xs text-muted-foreground">
            Índice promedio: {metrics.riesgoIncendio.indicePromedio?.toFixed(2) || 0}
          </p>
        </div>
      )}

      {/* Riesgo de Inundación */}
      {metrics.riesgoInundacion && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Riesgo de Inundación</span>
            </div>
            <Badge variant={getRiskBadgeVariant(metrics.riesgoInundacion.nivel)}>
              {metrics.riesgoInundacion.nivel}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-2 flex-1 rounded ${getRiskColor(metrics.riesgoInundacion.nivel)}`} />
          </div>
          <p className="text-xs text-muted-foreground">
            Área en riesgo: {metrics.riesgoInundacion.areaRiesgoHectareas?.toFixed(2) || 0} ha
          </p>
        </div>
      )}

      {/* Última actualización */}
      <div className="pt-4 border-t">
        <p className="text-xs text-muted-foreground text-center">
          Última actualización: {new Date(metrics.ultimaActualizacion).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};
