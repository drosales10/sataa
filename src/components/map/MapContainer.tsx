// ============================================================================
// COMPONENTE: CONTENEDOR DEL MAPA
// ============================================================================

import { useEffect, useState } from 'react';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, useMap, ZoomControl, GeoJSON } from 'react-leaflet';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMap as useMapContext } from '@/contexts/MapContext';
import { useThreats } from '@/hooks/useThreats';
import { useLanguage } from '@/contexts/LanguageContext';
import { THREAT_TYPES, SEVERITY_LEVELS, THREAT_STATUS, MAP_CONFIG } from '@/lib/constants';
import { initLeafletIcons, createThreatIcon, formatCoordinates } from '@/lib/mapUtils';
import { MapPin, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import 'leaflet/dist/leaflet.css';

// Componente para actualizar el centro del mapa
const MapUpdater = () => {
  const map = useMap();
  const { mapCenter, mapZoom } = useMapContext();
  
  useEffect(() => {
    map.setView(mapCenter, mapZoom);
  }, [map, mapCenter, mapZoom]);
  
  return null;
};

export const MapContainerComponent: React.FC = () => {
  const { threats } = useThreats();
  const { t, language } = useLanguage();
  const { selectedThreatId, setSelectedThreatId, aoi, aoiSelectionMode } = useMapContext();
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    initLeafletIcons();
    setMapReady(true);
  }, []);

  if (!mapReady) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-muted rounded-lg">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden border shadow-sm">
      <LeafletMap
        center={MAP_CONFIG.defaultCenter as [number, number]}
        zoom={MAP_CONFIG.defaultZoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <ZoomControl position="topright" />
        <MapUpdater />
        
        {/* Capa base */}
        <TileLayer
          attribution={MAP_CONFIG.attribution}
          url={MAP_CONFIG.tileLayerUrl}
        />

        {/* AOI Boundary - Mostrar el área de interés seleccionada */}
        {aoi && aoi.geometry && (
          <GeoJSON
            key={aoi.id}
            data={aoi.geometry as GeoJSON.GeoJsonObject}
            style={{
              color: '#3b82f6',
              weight: 3,
              fillColor: '#3b82f6',
              fillOpacity: 0.1,
            }}
          />
        )}
        
        {/* Marcadores de amenazas */}
        {threats.map((threat) => (
          <Marker
            key={threat.id}
            position={[threat.location.latitude, threat.location.longitude]}
            icon={createThreatIcon(
              threat.severity,
              SEVERITY_LEVELS[threat.severity].color
            )}
            eventHandlers={{
              click: () => setSelectedThreatId(threat.id),
            }}
          >
            <Popup>
              <Card className="border-0 shadow-none p-0 min-w-[280px]">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base">
                        {language === 'es'
                          ? THREAT_TYPES[threat.type].label
                          : THREAT_TYPES[threat.type].labelEn}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: SEVERITY_LEVELS[threat.severity].color,
                            color: SEVERITY_LEVELS[threat.severity].color,
                          }}
                        >
                          {language === 'es'
                            ? SEVERITY_LEVELS[threat.severity].label
                            : SEVERITY_LEVELS[threat.severity].labelEn}
                        </Badge>
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: THREAT_STATUS[threat.status].color,
                            color: THREAT_STATUS[threat.status].color,
                          }}
                        >
                          {language === 'es'
                            ? THREAT_STATUS[threat.status].label
                            : THREAT_STATUS[threat.status].labelEn}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-2xl flex-shrink-0">
                      {THREAT_TYPES[threat.type].icon}
                    </div>
                  </div>

                  {/* Descripción */}
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {threat.description}
                  </p>

                  {/* Información adicional */}
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      <span>{formatCoordinates(threat.location.latitude, threat.location.longitude)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span>{threat.monitorName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(new Date(threat.reportedAt), 'PPp', {
                          locale: language === 'es' ? es : enUS,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Botón de detalles */}
                  <Button size="sm" className="w-full" variant="outline">
                    {t('common.view')} {t('threats.title')}
                  </Button>
                </div>
              </Card>
            </Popup>
          </Marker>
        ))}
      </LeafletMap>
    </div>
  );
};