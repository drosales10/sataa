import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMap } from '@/contexts/MapContext';
import { useEnvironmentalMetrics } from '@/hooks/useEnvironmentalMetrics';
import { MetricsSummary } from './MetricsSummary';
import { RiskMapsGrid } from './RiskMapsGrid';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const MetricsPanel: React.FC = () => {
  const { aoi } = useMap();
  const { data: metrics, isLoading, error } = useEnvironmentalMetrics(aoi);

  if (!aoi) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Selecciona un área de interés para ver las métricas ambientales
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Procesando datos satelitales...</p>
          <p className="text-sm text-muted-foreground mt-2">Esto puede tomar unos segundos</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error al calcular métricas: {(error as Error).message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Métricas Ambientales</CardTitle>
          <p className="text-sm text-muted-foreground">
            Área: {aoi.name || 'Área seleccionada'} • {metrics.areaTotal.toFixed(2)} ha
          </p>
        </CardHeader>
        <CardContent>
          <MetricsSummary metrics={metrics} />
        </CardContent>
      </Card>

      <RiskMapsGrid aoi={aoi} metrics={metrics} />
    </div>
  );
};
