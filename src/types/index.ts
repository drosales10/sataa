// ============================================================================
// TIPOS GLOBALES - SISTEMA SMyEG
// ============================================================================

// Tipos de Usuarios
export type UserRole = 'RESEARCHER' | 'RISK_MANAGER' | 'COMMUNITY_MONITOR' | 'PUBLIC' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  institution?: string;
  community?: string;
  avatar?: string;
}

// Tipos de Amenazas
export type ThreatType = 
  | 'UNREGULATED_TOURISM'
  | 'ILLEGAL_MINING'
  | 'DEFORESTATION'
  | 'FOREST_FIRE'
  | 'UNAUTHORIZED_OCCUPATION'
  | 'OTHER';

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type ThreatStatus = 'PENDING' | 'VERIFIED' | 'CONFIRMED' | 'RESOLVED' | 'FALSE_ALARM';

export interface ThreatLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

export interface Threat {
  id: string;
  monitorId: string;
  monitorName: string;
  type: ThreatType;
  severity: SeverityLevel;
  location: ThreatLocation;
  description: string;
  status: ThreatStatus;
  reportedAt: string;
  updatedAt: string;
  images?: string[];
  environmentalImpacts?: string[];
  socialImpacts?: string[];
  involvedActors?: string[];
}

// Variables Ambientales
export type EnvironmentalVariable = 
  | 'WATER_LEVEL'
  | 'TEMPERATURE'
  | 'HUMIDITY'
  | 'PRECIPITATION'
  | 'WIND_SPEED'
  | 'WIND_DIRECTION'
  | 'ATMOSPHERIC_PRESSURE'
  | 'SOLAR_RADIATION'
  | 'NDVI'
  | 'SOIL_MOISTURE'
  | 'CARBON_EMISSIONS';

export interface TimeSeriesData {
  timestamp: string;
  value: number;
  variable: EnvironmentalVariable;
  unit: string;
}

export interface TimeSeriesDataset {
  variable: EnvironmentalVariable;
  data: TimeSeriesData[];
  metadata: {
    source: string;
    lastUpdate: string;
    unit: string;
  };
}

// Alertas
export type AlertType = 'IMMEDIATE_ACTION' | 'ESCALATION' | 'REMINDER' | 'INFORMATION';
export type AlertPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type AlertStatus = 'CREATED' | 'SENT' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED';

export interface Alert {
  id: string;
  threatId: string;
  type: AlertType;
  priority: AlertPriority;
  status: AlertStatus;
  message: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

// KPIs
export interface KPI {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  category: 'water' | 'energy' | 'carbon' | 'biodiversity' | 'waste';
}

// Capas del Mapa
export type LayerType =
  | 'BASE'
  | 'THREATS'
  | 'NDVI'
  | 'WATER_BODIES'
  | 'PROTECTED_AREAS'
  | 'COMMUNITIES'
  | 'FOREST_COVER'      // NUEVO: Cobertura forestal (Dynamic World)
  | 'DEFORESTATION'     // NUEVO: Deforestación
  | 'FIRE_RISK'         // NUEVO: Riesgo de incendios
  | 'FLOOD_RISK'        // NUEVO: Riesgo de inundaciones
  | 'AOI_BOUNDARY';     // NUEVO: Límite del AOI

export interface MapLayer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  opacity: number;
  source?: string;
  data?: GeoJSON.FeatureCollection | string; // GeoJSON o URL de tiles
  style?: {
    fillColor?: string;
    fillOpacity?: number;
    color?: string;
    weight?: number;
  };
}

// Monitores Comunitarios
export interface CommunityMonitor {
  id: string;
  name: string;
  community: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  trainingDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  totalReports: number;
  lastReportDate?: string;
}

// Reportes
export interface Report {
  id: string;
  title: string;
  type: 'PDF' | 'EXCEL' | 'CSV' | 'GEOJSON';
  createdAt: string;
  createdBy: string;
  filters: {
    dateRange?: [string, string];
    threatTypes?: ThreatType[];
    severityLevels?: SeverityLevel[];
    geographicArea?: string;
  };
}

// Idioma
export type Language = 'es' | 'en';

export interface Translation {
  [key: string]: string | Translation;
}

// ============================================================================
// TIPOS PARA GOOGLE EARTH ENGINE Y MÉTRICAS AMBIENTALES
// ============================================================================

// AOI (Área de Interés)
export interface AOI {
  id: string;
  type: 'drawn' | 'abrae';
  geometry: GeoJSON.Geometry;
  name?: string;
  area?: number; // hectáreas
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  createdAt: Date;
}

export interface DrawnAOI extends AOI {
  type: 'drawn';
  drawingType: 'polygon' | 'rectangle' | 'circle';
  vertices?: number;
}

export interface ABRAEAOI extends AOI {
  type: 'abrae';
  abraeType: string; // DESIG del WDPA
  abraeId: string;
  category: string;
  iucnCategory?: string;
}

// ABRAE (Áreas Protegidas)
export interface ABRAE {
  id: string;
  name: string;
  type: string; // DESIG: "Parque Nacional", "Monumento Natural", etc.
  iucnCategory?: string; // "II", "III", etc.
  geometry: GeoJSON.Geometry;
  area: number; // hectáreas
  country: string;
  designatedDate?: string;
  metadata?: {
    wdpaId: number;
    source: string;
    url?: string;
  };
}

export interface ABRAEType {
  designation: string; // DESIG
  count: number;
  examples: string[]; // Primeros 3 nombres
}

// Métricas Ambientales
export interface LULCDistribution {
  agua: number;
  bosque: number;
  pastizales: number;
  vegetacionInundada: number;
  cultivos: number;
  matorral: number;
  urbano: number;
  sueloDesnudo: number;
}

export interface ForestCoverMetrics {
  areaHectareas: number; // hectáreas de bosque
  porcentaje: number; // % del AOI
  anio: number;
  distribucion: LULCDistribution;
}

export interface DeforestationMetrics {
  areaHectareas: number; // hectáreas deforestadas
  porcentaje: number; // % de pérdida respecto al bosque inicial
  nivel: string; // 'bajo' | 'medio' | 'alto'
  periodoAnalisis: {
    inicio: number; // año
    fin: number; // año
  };
  tasaAnual: number; // hectáreas/año promedio
  serieAnual: Array<{
    year: number;
    area: number; // hectáreas perdidas ese año
  }>;
  causas: Array<{
    tipo: string; // "Bosque → Pastizales", "Bosque → Cultivos", etc.
    area: number;
    porcentaje: number;
  }>;
  alertaCritica: boolean; // true si pérdida anual > 5%
}

export interface CarbonMetrics {
  totalToneladas: number; // toneladas de Carbono (tC)
  co2Equivalente: number; // toneladas CO2e (tC * 3.67)
  valorUSD: number; // basado en precio de mercado
  valorVES: number; // converted con tasa BCV
  densidadPromedio: number; // tC/ha
  parametros: {
    precioCO2USD: number;
    tasaCambio: number;
  };
  perdidaPorDeforestacion?: {
    carbonoPerdido: number; // tC
    co2ePerdido: number;
    valorPerdidoUSD: number;
  };
}

export interface FireRiskMetrics {
  nivel: string; // 'bajo' | 'medio' | 'alto'
  nivelNumerico: number; // 1-5
  indicePromedio: number; // índice promedio
  focosActivos: number; // detectados por FIRMS
  areaAltaRiesgo: number; // hectáreas con riesgo alto
  ultimaDeteccion?: string; // ISO 8601
  factores: {
    ndwi: number; // Normalized Difference Water Index (humedad)
    temperaturaSuperficie?: number;
    diasSinLluvia?: number;
  };
  geojson?: GeoJSON.FeatureCollection; // polígonos de riesgo
}

export interface FloodRiskMetrics {
  nivel: string; // 'bajo' | 'medio' | 'alto'
  nivelNumerico: number; // 1-5
  areaRiesgoHectareas: number; // hectáreas en riesgo alto
  precipitacionPromedio: number; // mm/día
  elevacionPromedio: number; // metros
  pendientePromedio: number; // grados
  metodologia: 'AHP'; // Analytic Hierarchy Process
  factores: {
    lluvia: number; // peso 0.25-0.35
    pendiente: number; // peso 0.10-0.40
    proximidadRios: number; // peso 0.15-0.35
    elevacion: number; // peso 0.10-0.30
  };
  geojson?: GeoJSON.FeatureCollection;
}

export interface EnvironmentalMetrics {
  aoiId: string;
  aoiName: string;
  areaTotal: number; // hectáreas
  
  coberturaBoscosa: ForestCoverMetrics;
  deforestacion: DeforestationMetrics;
  carbono: CarbonMetrics;
  riesgoIncendio: FireRiskMetrics;
  riesgoInundacion: FloodRiskMetrics;
  
  ultimaActualizacion: string; // ISO 8601
  processingTime?: number; // milisegundos
}