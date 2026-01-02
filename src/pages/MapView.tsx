// ============================================================================
// PÁGINA: VISTA DEL MAPA INTERACTIVO
// ============================================================================

import { Navbar } from '@/components/layout/Navbar';
import { MapProvider } from '@/contexts/MapContext';
import { MapContainerComponent } from '@/components/map/MapContainer';
import { LayerControl } from '@/components/map/LayerControl';
import { MapToolbar } from '@/components/map/MapToolbar';
import { AOISelector } from '@/components/map/AOISelector';
import { MetricsPanel } from '@/components/map/MetricsPanel';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useThreats } from '@/hooks/useThreats';
import { THREAT_TYPES, SEVERITY_LEVELS } from '@/lib/constants';

export default function MapView() {
  const { t, language } = useLanguage();
  const { threats } = useThreats();

  const threatCounts = {
    total: threats.length,
    high: threats.filter(t => t.severity === 'HIGH').length,
    medium: threats.filter(t => t.severity === 'MEDIUM').length,
    low: threats.filter(t => t.severity === 'LOW').length,
  };

  return (
    <>
      <Navbar />
      <MapProvider>
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{t('map.title')}</h1>
              <p className="text-muted-foreground mt-1">
                Sistema de Monitoreo Ambiental con Google Earth Engine
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-base px-3 py-1">
                {threatCounts.total} {t('threats.title')}
              </Badge>
            </div>
          </div>

          {/* AOI Selector */}
          <AOISelector />

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{threatCounts.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === 'es' ? SEVERITY_LEVELS.HIGH.label : SEVERITY_LEVELS.HIGH.labelEn}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: SEVERITY_LEVELS.HIGH.color }}>
              {threatCounts.high}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === 'es' ? SEVERITY_LEVELS.MEDIUM.label : SEVERITY_LEVELS.MEDIUM.labelEn}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: SEVERITY_LEVELS.MEDIUM.color }}>
              {threatCounts.medium}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === 'es' ? SEVERITY_LEVELS.LOW.label : SEVERITY_LEVELS.LOW.labelEn}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: SEVERITY_LEVELS.LOW.color }}>
              {threatCounts.low}
            </div>
          </CardContent>
        </Card>
      </div>

          {/* Herramientas del mapa */}
          <MapToolbar />

          {/* Mapa y controles */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Panel lateral de capas */}
            <div className="lg:col-span-1 space-y-4">
              <LayerControl />
              
              {/* Leyenda */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Leyenda</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(THREAT_TYPES).map(([key, meta]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <span className="text-lg">{meta.icon}</span>
                      <span>{language === 'es' ? meta.label : meta.labelEn}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Mapa principal */}
            <div className="lg:col-span-3">
              <MapContainerComponent />
            </div>
          </div>

          {/* Panel de métricas DEBAJO del mapa */}
          <MetricsPanel />
        </div>
      </MapProvider>
    </>
  );
}