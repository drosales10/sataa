import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AOI, EnvironmentalMetrics } from '@/types';
import { MapPin, Flame, Droplets, AlertTriangle } from 'lucide-react';

interface RiskMapsGridProps {
  aoi: AOI;
  metrics: EnvironmentalMetrics;
}

export const RiskMapsGrid: React.FC<RiskMapsGridProps> = ({ aoi, metrics }) => {
  const riskMaps = [
    {
      id: 'fire',
      title: 'Mapa de Riesgo de Incendio',
      icon: Flame,
      iconColor: 'text-orange-600',
      nivel: metrics.riesgoIncendio?.nivel || 'N/A',
      descripcion: `Áreas con alta susceptibilidad a incendios forestales basado en condiciones climáticas, vegetación y topografía.`,
      valor: metrics.riesgoIncendio?.indicePromedio
    },
    {
      id: 'flood',
      title: 'Mapa de Riesgo de Inundación',
      icon: Droplets,
      iconColor: 'text-blue-600',
      nivel: metrics.riesgoInundacion?.nivel || 'N/A',
      descripcion: `Zonas propensas a inundaciones basadas en elevación, proximidad a cuerpos de agua y precipitación histórica.`,
      valor: metrics.riesgoInundacion?.areaRiesgoHectareas
    },
    {
      id: 'deforestation',
      title: 'Mapa de Deforestación',
      icon: AlertTriangle,
      iconColor: 'text-red-600',
      nivel: metrics.deforestacion?.nivel || 'N/A',
      descripcion: `Áreas que han experimentado pérdida de cobertura forestal en los últimos años.`,
      valor: metrics.deforestacion?.areaHectareas
    }
  ];

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
    <div>
      <h3 className="text-lg font-semibold mb-4">Mapas de Riesgo</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {riskMaps.map((map) => {
          const Icon = map.icon;
          return (
            <Card key={map.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Icon className={`h-5 w-5 ${map.iconColor}`} />
                  <Badge variant={getRiskBadgeVariant(map.nivel)}>
                    {map.nivel}
                  </Badge>
                </div>
                <CardTitle className="text-base mt-2">{map.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Placeholder para el mapa - se implementará más adelante */}
                <div className="aspect-video bg-muted rounded-md flex items-center justify-center mb-3">
                  <MapPin className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {map.descripcion}
                </p>
                {map.valor !== undefined && (
                  <p className="text-sm font-medium">
                    Valor: {typeof map.valor === 'number' ? map.valor.toFixed(2) : map.valor}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
