// ============================================================================
// CONSTANTES - SISTEMA SMyEG
// ============================================================================

import { ThreatType, EnvironmentalVariable } from '@/types';

// Colores del Sistema
export const COLORS = {
  primary: '#2E7D32',
  secondary: '#1565C0',
  alertCritical: '#D32F2F',
  alertWarning: '#F57C00',
  alertInfo: '#0288D1',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  textPrimary: '#212121',
  textSecondary: '#757575',
} as const;

// Tipos de Amenazas con Metadata
export const THREAT_TYPES: Record<ThreatType, { label: string; labelEn: string; icon: string; color: string }> = {
  UNREGULATED_TOURISM: {
    label: 'Turismo No Regulado',
    labelEn: 'Unregulated Tourism',
    icon: '🏕️',
    color: '#FF9800',
  },
  ILLEGAL_MINING: {
    label: 'Minería Ilegal',
    labelEn: 'Illegal Mining',
    icon: '⛏️',
    color: '#795548',
  },
  DEFORESTATION: {
    label: 'Deforestación',
    labelEn: 'Deforestation',
    icon: '🪓',
    color: '#8D6E63',
  },
  FOREST_FIRE: {
    label: 'Incendio Forestal',
    labelEn: 'Forest Fire',
    icon: '🔥',
    color: '#D32F2F',
  },
  UNAUTHORIZED_OCCUPATION: {
    label: 'Ocupación No Autorizada',
    labelEn: 'Unauthorized Occupation',
    icon: '🏚️',
    color: '#5D4037',
  },
  OTHER: {
    label: 'Otra Amenaza',
    labelEn: 'Other Threat',
    icon: '⚠️',
    color: '#616161',
  },
};

// Niveles de Severidad
export const SEVERITY_LEVELS = {
  LOW: { label: 'Baja', labelEn: 'Low', color: '#FDD835', bgColor: '#FFFDE7' },
  MEDIUM: { label: 'Media', labelEn: 'Medium', color: '#FB8C00', bgColor: '#FFF3E0' },
  HIGH: { label: 'Alta', labelEn: 'High', color: '#D32F2F', bgColor: '#FFEBEE' },
} as const;

// Estados de Amenazas
export const THREAT_STATUS = {
  PENDING: { label: 'Pendiente', labelEn: 'Pending', color: '#9E9E9E' },
  VERIFIED: { label: 'Verificada', labelEn: 'Verified', color: '#2196F3' },
  CONFIRMED: { label: 'Confirmada', labelEn: 'Confirmed', color: '#FF9800' },
  RESOLVED: { label: 'Resuelta', labelEn: 'Resolved', color: '#4CAF50' },
  FALSE_ALARM: { label: 'Falsa Alarma', labelEn: 'False Alarm', color: '#757575' },
} as const;

// Variables Ambientales
export const ENVIRONMENTAL_VARIABLES: Record<EnvironmentalVariable, { label: string; labelEn: string; unit: string; color: string }> = {
  WATER_LEVEL: {
    label: 'Nivel de Agua',
    labelEn: 'Water Level',
    unit: 'm',
    color: '#2196F3',
  },
  TEMPERATURE: {
    label: 'Temperatura',
    labelEn: 'Temperature',
    unit: '°C',
    color: '#FF5722',
  },
  HUMIDITY: {
    label: 'Humedad Relativa',
    labelEn: 'Relative Humidity',
    unit: '%',
    color: '#00BCD4',
  },
  PRECIPITATION: {
    label: 'Precipitación',
    labelEn: 'Precipitation',
    unit: 'mm',
    color: '#3F51B5',
  },
  WIND_SPEED: {
    label: 'Velocidad del Viento',
    labelEn: 'Wind Speed',
    unit: 'm/s',
    color: '#9E9E9E',
  },
  WIND_DIRECTION: {
    label: 'Dirección del Viento',
    labelEn: 'Wind Direction',
    unit: '°',
    color: '#607D8B',
  },
  ATMOSPHERIC_PRESSURE: {
    label: 'Presión Atmosférica',
    labelEn: 'Atmospheric Pressure',
    unit: 'hPa',
    color: '#795548',
  },
  SOLAR_RADIATION: {
    label: 'Radiación Solar',
    labelEn: 'Solar Radiation',
    unit: 'W/m²',
    color: '#FFC107',
  },
  NDVI: {
    label: 'NDVI (Índice de Vegetación)',
    labelEn: 'NDVI (Vegetation Index)',
    unit: '',
    color: '#4CAF50',
  },
  SOIL_MOISTURE: {
    label: 'Humedad del Suelo',
    labelEn: 'Soil Moisture',
    unit: '%',
    color: '#8D6E63',
  },
  CARBON_EMISSIONS: {
    label: 'Emisiones de Carbono',
    labelEn: 'Carbon Emissions',
    unit: 'tCO₂e',
    color: '#424242',
  },
};

// Configuración del Mapa
export const MAP_CONFIG = {
  defaultCenter: { lat: 6.5, lng: -62.5 }, // Aproximadamente Venezuela
  defaultZoom: 8,
  minZoom: 5,
  maxZoom: 18,
  tileLayerUrl: '/images/Map.jpg',
  attribution: '© OpenStreetMap contributors',
} as const;

// Roles de Usuario
export const USER_ROLES = {
  RESEARCHER: { label: 'Investigador', labelEn: 'Researcher' },
  RISK_MANAGER: { label: 'Gestor de Riesgos', labelEn: 'Risk Manager' },
  COMMUNITY_MONITOR: { label: 'Monitor Comunitario', labelEn: 'Community Monitor' },
  PUBLIC: { label: 'Público General', labelEn: 'General Public' },
  ADMIN: { label: 'Administrador', labelEn: 'Administrator' },
} as const;

// Prioridades de Alertas
export const ALERT_PRIORITIES = {
  CRITICAL: { label: 'Crítica', labelEn: 'Critical', color: '#D32F2F' },
  HIGH: { label: 'Alta', labelEn: 'High', color: '#F57C00' },
  MEDIUM: { label: 'Media', labelEn: 'Medium', color: '#FDD835' },
  LOW: { label: 'Baja', labelEn: 'Low', color: '#4CAF50' },
} as const;

// Alias para compatibilidad con código existente
export const PRIORITY_LEVELS = ALERT_PRIORITIES;

// Límites de la Aplicación
export const APP_LIMITS = {
  MAX_IMAGE_SIZE_MB: 5,
  MAX_IMAGES_PER_REPORT: 5,
  MAX_DESCRIPTION_LENGTH: 1000,
  SYNC_INTERVAL_MS: 300000, // 5 minutos
  SESSION_TIMEOUT_MS: 3600000, // 1 hora
} as const;

// URLs de Imágenes (CDN)
export const IMAGES = {
  logo: 'https://mgx-backend-cdn.metadl.com/generate/images/118410/2026-01-02/bc87384e-9cfb-49c4-b55f-e2b803a212fb.png',
  heroEcosystem: 'https://mgx-backend-cdn.metadl.com/generate/images/118410/2026-01-02/124f234d-7e76-4a48-aece-2aca13d5a280.png',
  iconForestFire: 'https://mgx-backend-cdn.metadl.com/generate/images/118410/2026-01-02/496075dd-4759-4f5a-b413-fa650f437968.png',
  iconDeforestation: 'https://mgx-backend-cdn.metadl.com/generate/images/118410/2026-01-02/3d7d08d6-0117-4c6c-91a6-a6b452837070.png',
  iconIllegalMining: 'https://mgx-backend-cdn.metadl.com/generate/images/118410/2026-01-02/cb1c6813-93ad-45b7-ba18-9d6b0d5ac4d2.png',
  iconWaterLevel: 'https://mgx-backend-cdn.metadl.com/generate/images/118410/2026-01-02/2816b5f7-d07b-49a0-9fbc-29bb71ac40b9.png',
} as const;