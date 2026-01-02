// ============================================================================
// UTILIDADES DEL MAPA
// ============================================================================

import L from 'leaflet';
import { Threat } from '@/types';

// Configurar iconos de Leaflet
export const initLeafletIcons = () => {
  delete (L.Icon.Default.prototype as L.Icon<L.IconOptions>)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
};

// Crear icono personalizado para amenazas
export const createThreatIcon = (severity: string, color: string) => {
  const iconHtml = `
    <div style="
      background-color: ${color};
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    ">
      ⚠️
    </div>
  `;
  
  return L.divIcon({
    html: iconHtml,
    className: 'custom-threat-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

// Calcular distancia entre dos puntos (Haversine)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (value: number): number => {
  return (value * Math.PI) / 180;
};

// Calcular área de un polígono
export const calculateArea = (latlngs: L.LatLng[]): number => {
  if (latlngs.length < 3) return 0;
  
  let area = 0;
  const R = 6371000; // Radio de la Tierra en metros
  
  for (let i = 0; i < latlngs.length; i++) {
    const j = (i + 1) % latlngs.length;
    const lat1 = toRad(latlngs[i].lat);
    const lat2 = toRad(latlngs[j].lat);
    const lon1 = toRad(latlngs[i].lng);
    const lon2 = toRad(latlngs[j].lng);
    
    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  
  area = Math.abs((area * R * R) / 2);
  return area / 10000; // Convertir a hectáreas
};

// Formatear coordenadas
export const formatCoordinates = (lat: number, lng: number): string => {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(6)}° ${latDir}, ${Math.abs(lng).toFixed(6)}° ${lngDir}`;
};

// Crear bounds para ajustar el mapa
export const createBoundsFromThreats = (threats: Threat[]): L.LatLngBounds | null => {
  if (threats.length === 0) return null;
  
  const points = threats.map(t => [t.location.latitude, t.location.longitude] as [number, number]);
  return L.latLngBounds(points);
};