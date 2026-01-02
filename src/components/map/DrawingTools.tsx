import { useEffect } from 'react';
import { FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import { useMap as useLeafletMap } from 'react-leaflet';
import { useMap } from '@/contexts/MapContext';
import * as turf from '@turf/turf';
import { nanoid } from 'nanoid';
import type { AOI } from '@/types';
import L from 'leaflet';

export const DrawingTools: React.FC = () => {
  const leafletMap = useLeafletMap();
  const { setAOI, aoiSelectionMode } = useMap();

  useEffect(() => {
    // Importar estilos de Leaflet.Draw
    import('leaflet-draw/dist/leaflet.draw.css');
  }, []);

  const handleCreated = (e: any) => {
    const { layer } = e;
    const geojson = layer.toGeoJSON();
    
    try {
      // Validar geometría
      const area = turf.area(geojson) / 10000; // Convertir a hectáreas
      
      if (area > 100000) {
        alert('El área dibujada excede el límite de 100,000 hectáreas');
        leafletMap.removeLayer(layer);
        return;
      }

      // Simplificar si tiene muchos vértices
      let simplifiedGeometry = geojson.geometry;
      if (layer instanceof L.Polygon && layer.getLatLngs()[0].length > 100) {
        const simplified = turf.simplify(geojson, { tolerance: 0.001 });
        simplifiedGeometry = simplified.geometry;
      }

      // Crear AOI
      const aoi: AOI = {
        id: nanoid(),
        type: 'drawn',
        geometry: simplifiedGeometry,
        area,
        createdAt: new Date(),
      };

      setAOI(aoi);
    } catch (error) {
      console.error('Error al procesar geometría:', error);
      alert('Error al procesar el área dibujada');
      leafletMap.removeLayer(layer);
    }
  };

  const handleEdited = (e: any) => {
    const { layers } = e;
    layers.eachLayer((layer: any) => {
      handleCreated({ layer });
    });
  };

  const handleDeleted = () => {
    setAOI(null);
  };

  if (aoiSelectionMode !== 'draw') return null;

  return (
    <FeatureGroup>
      <EditControl
        position="topright"
        onCreated={handleCreated}
        onEdited={handleEdited}
        onDeleted={handleDeleted}
        draw={{
          rectangle: true,
          polygon: true,
          circle: false,
          circlemarker: false,
          marker: false,
          polyline: false,
        }}
        edit={{
          remove: true,
          edit: true,
        }}
      />
    </FeatureGroup>
  );
};
