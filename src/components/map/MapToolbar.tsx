// ============================================================================
// COMPONENTE: BARRA DE HERRAMIENTAS DEL MAPA
// ============================================================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  ZoomIn,
  ZoomOut,
  Home,
  Search,
  Ruler,
  Square,
  Navigation,
} from 'lucide-react';
import { useMap } from '@/contexts/MapContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { MAP_CONFIG } from '@/lib/constants';

export const MapToolbar: React.FC = () => {
  const { setMapCenter, setMapZoom, mapZoom } = useMap();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [measureMode, setMeasureMode] = useState<'none' | 'distance' | 'area'>('none');

  const handleZoomIn = () => {
    setMapZoom(Math.min(mapZoom + 1, MAP_CONFIG.maxZoom));
  };

  const handleZoomOut = () => {
    setMapZoom(Math.max(mapZoom - 1, MAP_CONFIG.minZoom));
  };

  const handleResetView = () => {
    setMapCenter([MAP_CONFIG.defaultCenter.lat, MAP_CONFIG.defaultCenter.lng]);
    setMapZoom(MAP_CONFIG.defaultZoom);
  };

  const handleSearch = () => {
    // Implementar búsqueda de ubicación
    console.log('Searching for:', searchQuery);
  };

  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Búsqueda */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Input
            placeholder={t('map.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button size="icon" variant="outline" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Controles de zoom */}
        <div className="flex items-center gap-1">
          <Button size="icon" variant="outline" onClick={handleZoomIn} title={t('map.zoomIn')}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline" onClick={handleZoomOut} title={t('map.zoomOut')}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline" onClick={handleResetView} title={t('map.resetView')}>
            <Home className="h-4 w-4" />
          </Button>
        </div>

        {/* Herramientas de medición */}
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant={measureMode === 'distance' ? 'default' : 'outline'}
            onClick={() => setMeasureMode(measureMode === 'distance' ? 'none' : 'distance')}
            title={t('map.measureDistance')}
          >
            <Ruler className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant={measureMode === 'area' ? 'default' : 'outline'}
            onClick={() => setMeasureMode(measureMode === 'area' ? 'none' : 'area')}
            title={t('map.measureArea')}
          >
            <Square className="h-4 w-4" />
          </Button>
        </div>

        {/* Coordenadas actuales */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Navigation className="h-4 w-4" />
          <span>{t('map.coordinates')}: {MAP_CONFIG.defaultCenter.lat.toFixed(4)}, {MAP_CONFIG.defaultCenter.lng.toFixed(4)}</span>
        </div>
      </div>
    </Card>
  );
};