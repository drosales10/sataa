# Especificaciones Técnicas: Sistema de Mapas con GEE

## 📋 Resumen Ejecutivo

Este documento detalla las especificaciones técnicas para la refactorización del sistema de mapas, integrando funcionalidades avanzadas de Google Earth Engine (GEE) en una aplicación React con TypeScript.

---

## 🔧 Stack Tecnológico

### Frontend
- **Framework**: React 18 + TypeScript
- **Mapas**: Leaflet 1.9 + React-Leaflet
- **Dibujo**: Leaflet.Draw + React-Leaflet-Draw
- **Análisis Espacial**: Turf.js
- **UI Components**: shadcn/ui + Tailwind CSS
- **Estado**: React Context API
- **Gestión de Datos**: React Query (TanStack Query)

### Backend/API
- **Opción 1 (Recomendada)**: 
  - Google Cloud Functions (Node.js/Python)
  - Earth Engine Python API
  - Express.js para routing
  
- **Opción 2 (Alternativa)**:
  - Supabase Edge Functions
  - Earth Engine REST API

### Fuentes de Datos
- Google Earth Engine
  - Dynamic World (LULC)
  - Sentinel-2 (Imágenes)
  - FIRMS (Incendios)
  - CHIRPS (Precipitación)
  - MERIT DEM (Topografía)
  - WDPA (Áreas Protegidas)

---

## 📦 Estructura de Archivos

```
src/
├── components/
│   └── map/
│       ├── MapContainer.tsx              [MODIFICAR]
│       ├── MapToolbar.tsx                [MODIFICAR]
│       ├── LayerControl.tsx              [MODIFICAR]
│       ├── AOISelector.tsx               [NUEVO]
│       ├── DrawingTools.tsx              [NUEVO]
│       ├── ABRAESelector.tsx             [NUEVO]
│       ├── MetricsPanel.tsx              [NUEVO]
│       ├── MetricsSummary.tsx            [NUEVO]
│       ├── CarbonMetricCard.tsx          [NUEVO]
│       ├── DeforestationMetricCard.tsx   [NUEVO]
│       ├── ForestCoverMetricCard.tsx     [NUEVO]
│       ├── RiskMapsGrid.tsx              [NUEVO]
│       ├── FireRiskMap.tsx               [NUEVO]
│       └── FloodRiskMap.tsx              [NUEVO]
├── contexts/
│   └── MapContext.tsx                    [MODIFICAR]
├── services/
│   ├── geeService.ts                     [NUEVO]
│   ├── abraeService.ts                   [NUEVO]
│   └── metricsService.ts                 [NUEVO]
├── types/
│   └── index.ts                          [MODIFICAR]
├── hooks/
│   ├── useAOI.ts                         [NUEVO]
│   ├── useEnvironmentalMetrics.ts        [NUEVO]
│   └── useDrawing.ts                     [NUEVO]
├── lib/
│   ├── geoUtils.ts                       [NUEVO]
│   └── mapUtils.ts                       [MODIFICAR]
└── pages/
    └── MapView.tsx                       [MODIFICAR]

gee/
├── alertas.js                            [REFERENCIA]
├── LULC.js                               [REFERENCIA]
└── backend/                              [NUEVO]
    ├── index.js                          [NUEVO - Cloud Function]
    ├── gee-controller.js                 [NUEVO]
    └── package.json                      [NUEVO]
```

---

## 🎯 Interfaces y Tipos TypeScript

### AOI (Área de Interés)

```typescript
// src/types/index.ts

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
```

### ABRAE (Áreas Protegidas)

```typescript
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
```

### Métricas Ambientales

```typescript
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

export interface ForestCoverMetrics {
  area: number; // hectáreas de bosque
  porcentaje: number; // % del AOI
  anio: number;
  distribucion: LULCDistribution;
}

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

export interface DeforestationMetrics {
  areaTotal: number; // hectáreas deforestadas
  porcentaje: number; // % de pérdida respecto al bosque inicial
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
  stockTotal: number; // toneladas de Carbono (tC)
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
  nivel: 'bajo' | 'medio' | 'alto';
  nivelNumerico: number; // 1-5
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
  nivel: 'bajo' | 'medio' | 'alto';
  nivelNumerico: number; // 1-5
  areaAfectada: number; // hectáreas en riesgo alto
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
```

### Capas del Mapa

```typescript
export type LayerType = 
  | 'BASE'
  | 'THREATS'
  | 'NDVI'
  | 'WATER_BODIES'
  | 'PROTECTED_AREAS'
  | 'COMMUNITIES'
  | 'FOREST_COVER'      // NUEVO
  | 'DEFORESTATION'     // NUEVO
  | 'FIRE_RISK'         // NUEVO
  | 'FLOOD_RISK'        // NUEVO
  | 'AOI_BOUNDARY';     // NUEVO

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
```

---

## 🔌 API Endpoints (Backend GEE)

### Base URL
```
https://us-central1-[PROJECT-ID].cloudfunctions.net/gee-api
```

### Endpoints

#### 1. Obtener ABRAE de Venezuela
```http
GET /api/abrae
```

**Query Parameters**:
- `type` (opcional): Filtrar por tipo de ABRAE

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "wdpa_123456",
      "name": "Parque Nacional Canaima",
      "type": "Parque Nacional",
      "iucnCategory": "II",
      "area": 3000000,
      "geometry": { ... }
    }
  ],
  "count": 45
}
```

---

#### 2. Calcular Métricas Ambientales
```http
POST /api/metrics
Content-Type: application/json
```

**Request Body**:
```json
{
  "aoi": {
    "type": "Feature",
    "geometry": {
      "type": "Polygon",
      "coordinates": [[[lng, lat], ...]]
    }
  },
  "analysisYear": 2024,
  "params": {
    "precioCO2USD": 5.0,
    "tasaCambioVES": 270,
    "anoInicioDeforestacion": 2015
  }
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "areaTotal": 45230,
    "coberturaBoscosa": {
      "area": 29400,
      "porcentaje": 65.0,
      "distribucion": { ... }
    },
    "deforestacion": { ... },
    "carbono": { ... },
    "riesgoIncendio": { ... },
    "riesgoInundacion": { ... },
    "ultimaActualizacion": "2024-01-02T18:00:00Z"
  },
  "processingTime": 8500
}
```

**Response** (400 - AOI demasiado grande):
```json
{
  "success": false,
  "error": {
    "code": "AOI_TOO_LARGE",
    "message": "El área de interés excede el límite de 100,000 hectáreas",
    "maxArea": 100000,
    "requestedArea": 150000
  }
}
```

---

#### 3. Obtener Capa de Riesgo (GeoJSON)
```http
POST /api/risk-layer
Content-Type: application/json
```

**Request Body**:
```json
{
  "aoi": { ... },
  "layerType": "fire" | "flood",
  "resolution": 100 // metros
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": { ... },
        "properties": {
          "riskLevel": "high",
          "riskValue": 4.5
        }
      }
    ]
  }
}
```

---

#### 4. Health Check
```http
GET /api/health
```

**Response** (200):
```json
{
  "status": "healthy",
  "timestamp": "2024-01-02T18:00:00Z",
  "services": {
    "earthEngine": "connected",
    "database": "connected"
  }
}
```

---

## 🎨 Componentes React - Props

### AOISelector

```typescript
interface AOISelectorProps {
  onAOISelected: (aoi: AOI) => void;
  onAOICleared: () => void;
  disabled?: boolean;
}
```

---

### DrawingTools

```typescript
interface DrawingToolsProps {
  enabled: boolean;
  onGeometryDrawn: (geometry: GeoJSON.Geometry) => void;
  onGeometryEdited: (geometry: GeoJSON.Geometry) => void;
  onGeometryDeleted: () => void;
  maxVertices?: number;
  simplifyTolerance?: number; // para simplificar polígonos complejos
}
```

---

### ABRAESelector

```typescript
interface ABRAESelectorProps {
  onABRAESelected: (abrae: ABRAE) => void;
  disabled?: boolean;
}
```

---

### MetricsPanel

```typescript
interface MetricsPanelProps {
  aoi: AOI | null;
  metrics: EnvironmentalMetrics | null;
  loading: boolean;
  error?: Error;
  onRefresh?: () => void;
}
```

---

### FireRiskMap / FloodRiskMap

```typescript
interface RiskMapProps {
  data: GeoJSON.FeatureCollection | null;
  aoi: AOI;
  loading: boolean;
  onLayerToggle?: (visible: boolean) => void;
}
```

---

## 🔗 Custom Hooks

### useAOI

```typescript
import { useContext } from 'react';
import { MapContext } from '@/contexts/MapContext';

export const useAOI = () => {
  const context = useContext(MapContext);
  
  const setDrawnAOI = (geometry: GeoJSON.Geometry) => {
    const area = calculateArea(geometry); // Turf.js
    const aoi: AOI = {
      id: generateId(),
      type: 'drawn',
      geometry,
      area,
      createdAt: new Date(),
    };
    context.setAOI(aoi);
  };
  
  const setABRAEAOI = (abrae: ABRAE) => {
    const aoi: ABRAEAOI = {
      id: abrae.id,
      type: 'abrae',
      geometry: abrae.geometry,
      name: abrae.name,
      area: abrae.area,
      abraeType: abrae.type,
      abraeId: abrae.id,
      category: abrae.type,
      iucnCategory: abrae.iucnCategory,
      createdAt: new Date(),
    };
    context.setAOI(aoi);
  };
  
  const clearAOI = () => {
    context.setAOI(null);
    context.setEnvironmentalMetrics(null);
  };
  
  return {
    aoi: context.aoi,
    setDrawnAOI,
    setABRAEAOI,
    clearAOI,
  };
};
```

---

### useEnvironmentalMetrics

```typescript
import { useQuery } from '@tanstack/react-query';
import { geeService } from '@/services/geeService';

export const useEnvironmentalMetrics = (aoi: AOI | null) => {
  return useQuery({
    queryKey: ['environmental-metrics', aoi?.id],
    queryFn: () => {
      if (!aoi) return null;
      return geeService.getEnvironmentalMetrics(aoi.geometry);
    },
    enabled: !!aoi,
    staleTime: 1000 * 60 * 10, // 10 minutos
    retry: 2,
  });
};
```

---

### useDrawing

```typescript
import { useState, useCallback } from 'react';
import { FeatureGroup } from 'leaflet';
import * as turf from '@turf/turf';

export const useDrawing = () => {
  const [drawnItems, setDrawnItems] = useState<FeatureGroup | null>(null);
  
  const simplifyGeometry = useCallback((geometry: GeoJSON.Geometry, tolerance = 0.001) => {
    return turf.simplify(geometry, { tolerance });
  }, []);
  
  const validateGeometry = useCallback((geometry: GeoJSON.Geometry) => {
    const area = turf.area(geometry) / 10000; // a hectáreas
    if (area > 100000) {
      throw new Error('El área dibujada excede el límite de 100,000 ha');
    }
    return true;
  }, []);
  
  return {
    drawnItems,
    setDrawnItems,
    simplifyGeometry,
    validateGeometry,
  };
};
```

---

## 🎨 Paletas de Colores

### LULC (Dynamic World)

```typescript
export const LULC_PALETTE = {
  agua: '#419BDF',
  bosque: '#397D49',
  pastizales: '#88B053',
  vegetacionInundada: '#7A87C6',
  cultivos: '#E49635',
  matorral: '#DFC35A',
  urbano: '#C82828',
  sueloDesnudo: '#A59B8B',
};

export const LULC_LABELS = {
  es: ['Agua', 'Bosque', 'Pastizales', 'Veg. Inundada', 'Cultivos', 'Matorral', 'Urbano', 'Suelo Desnudo'],
  en: ['Water', 'Trees', 'Grass', 'Flooded Vegetation', 'Crops', 'Shrub', 'Built', 'Bare'],
};
```

### Riesgos

```typescript
export const RISK_PALETTE = {
  fire: {
    low: '#FFFFB2',
    medium: '#FD8D3C',
    high: '#BD0026',
  },
  flood: {
    veryLow: '#EFF3FF',
    low: '#BDD7E7',
    medium: '#6BAED6',
    high: '#3182BD',
    veryHigh: '#08519C',
  },
};

export const getRiskColor = (level: number, type: 'fire' | 'flood'): string => {
  if (type === 'fire') {
    if (level <= 2) return RISK_PALETTE.fire.low;
    if (level <= 3.5) return RISK_PALETTE.fire.medium;
    return RISK_PALETTE.fire.high;
  } else {
    if (level <= 1.5) return RISK_PALETTE.flood.veryLow;
    if (level <= 2.5) return RISK_PALETTE.flood.low;
    if (level <= 3.5) return RISK_PALETTE.flood.medium;
    if (level <= 4.5) return RISK_PALETTE.flood.high;
    return RISK_PALETTE.flood.veryHigh;
  }
};
```

---

## ⚙️ Configuración de GEE (Backend)

### `gee/backend/index.js` (Cloud Function)

```javascript
const ee = require('@google/earthengine');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Autenticación con GEE
const privateKey = require('./service-account-key.json');
ee.data.authenticateViaPrivateKey(
  privateKey,
  () => {
    ee.initialize(null, null, () => {
      console.log('Earth Engine initialized');
    });
  },
  (err) => {
    console.error('EE authentication failed:', err);
  }
);

// Endpoint principal
app.post('/api/metrics', async (req, res) => {
  try {
    const { aoi, analysisYear, params } = req.body;
    
    // Validar AOI
    const aoiGeometry = ee.Geometry(aoi.geometry);
    const area = aoiGeometry.area().divide(10000).getInfo(); // hectáreas
    
    if (area > 100000) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'AOI_TOO_LARGE',
          message: 'El área excede el límite',
          maxArea: 100000,
          requestedArea: area,
        },
      });
    }
    
    // Calcular métricas (lógica de alertas.js/LULC.js)
    const metrics = await calculateMetrics(aoiGeometry, analysisYear, params);
    
    res.json({
      success: true,
      data: metrics,
      processingTime: Date.now() - startTime,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'PROCESSING_ERROR',
        message: error.message,
      },
    });
  }
});

exports.geeApi = app;
```

---

## 🧪 Testing

### Unit Tests (Jest + React Testing Library)

```typescript
// src/components/map/__tests__/AOISelector.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { AOISelector } from '../AOISelector';

describe('AOISelector', () => {
  it('renders with draw and ABRAE tabs', () => {
    render(<AOISelector onAOISelected={jest.fn()} onAOICleared={jest.fn()} />);
    expect(screen.getByText('Dibujar')).toBeInTheDocument();
    expect(screen.getByText('ABRAE')).toBeInTheDocument();
  });
  
  it('switches between tabs', () => {
    render(<AOISelector onAOISelected={jest.fn()} onAOICleared={jest.fn()} />);
    const abraeTab = screen.getByText('ABRAE');
    fireEvent.click(abraeTab);
    expect(screen.getByPlaceholderText('Seleccionar tipo')).toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
// src/services/__tests__/geeService.test.ts

import { geeService } from '../geeService';
import { mockAOI } from '../../__mocks__/aoi';

describe('geeService', () => {
  it('calculates metrics for valid AOI', async () => {
    const metrics = await geeService.getEnvironmentalMetrics(mockAOI.geometry);
    expect(metrics).toHaveProperty('coberturaBoscosa');
    expect(metrics.areaTotal).toBeGreaterThan(0);
  });
  
  it('throws error for AOI exceeding limit', async () => {
    await expect(
      geeService.getEnvironmentalMetrics(mockLargeAOI.geometry)
    ).rejects.toThrow('AOI_TOO_LARGE');
  });
});
```

---

## 📊 Métricas de Rendimiento

### Objetivos
- **Tiempo de carga inicial del mapa**: < 3s
- **Tiempo de cálculo de métricas** (AOI ~10,000 ha): < 10s
- **Tiempo de renderizado de capas**: < 2s
- **Smooth zoom y pan**: 60 FPS

### Optimizaciones
1. **Lazy Loading**: Componentes de métricas cargados bajo demanda
2. **Debounce**: Al dibujar AOI, esperar 500ms antes de calcular
3. **Worker Threads**: Procesamiento de GeoJSON en Web Workers
4. **Tiles**: Usar tiles XYZ para capas raster en lugar de GeoJSON completo
5. **Cache**: React Query para cachear resultados de métricas

---

## 🔒 Seguridad

### API Backend
- **Autenticación**: Firebase Auth o JWT
- **Rate Limiting**: 60 requests/min por IP
- **Validación de Input**: Sanitizar geometrías y parámetros
- **CORS**: Configurar origins permitidos

### Credenciales GEE
- **Service Account**: Usar cuenta de servicio en lugar de OAuth
- **Secrets**: Almacenar keys en Google Secret Manager
- **Scopes**: Limitar permisos al mínimo necesario

---

## 📚 Recursos y Dependencias

### NPM Packages

```json
{
  "dependencies": {
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "leaflet-draw": "^1.0.4",
    "react-leaflet-draw": "^0.20.4",
    "@turf/turf": "^6.5.0",
    "@tanstack/react-query": "^5.0.0",
    "geojson": "^0.5.0",
    "leaflet.heat": "^0.2.0"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9.8",
    "@types/leaflet-draw": "^1.0.11",
    "@types/geojson": "^7946.0.14"
  }
}
```

### Backend (Cloud Functions)

```json
{
  "dependencies": {
    "@google/earthengine": "^0.1.400",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  }
}
```

---

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
vercel --prod
```

### Backend (Google Cloud Functions)
```bash
cd gee/backend
gcloud functions deploy geeApi \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --region us-central1 \
  --memory 512MB \
  --timeout 60s
```

---

## 📝 Notas Finales

- **Priorizar funcionalidad core**: Implementar primero dibujo de AOI y ABRAE selector
- **Progresiva complejidad**: Comenzar con métricas básicas (área, cobertura) antes de riesgos
- **Feedback visual**: Loading spinners y progress bars durante cálculos GEE
- **Manejo de errores robusto**: Mostrar mensajes claros al usuario
- **Documentación**: Mantener este documento actualizado con decisiones de diseño

---

**Versión**: 1.0  
**Última actualización**: 2026-01-02  
**Autor**: Sistema SMyEG - Equipo de Desarrollo
