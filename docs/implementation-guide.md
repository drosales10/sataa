# Guía de Implementación: Sistema de Mapas con Google Earth Engine

## 🎯 Resumen Ejecutivo

Esta guía proporciona los pasos concretos para implementar el sistema de mapas refactorizado con capacidades avanzadas de Google Earth Engine, siguiendo la arquitectura basada en Supabase Edge Functions.

---

## 📊 Flujo de Trabajo del Usuario

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend React
    participant S as Supabase Edge Function
    participant G as Google Earth Engine
    participant D as Database/Cache

    U->>F: 1. Selecciona AOI (dibujar o ABRAE)
    F->>F: 2. Valida geometría
    F->>S: 3. POST /gee-metrics {aoi, params}
    S->>D: 4. Busca en caché
    
    alt Cache Hit
        D-->>S: 5a. Retorna datos cacheados
        S-->>F: 6a. Response (cached: true)
    else Cache Miss
        S->>G: 5b. Autenticar y procesar
        G->>G: 6b. Calcular métricas GEE
        G-->>S: 7b. Resultados
        S->>D: 8b. Guardar en caché
        S-->>F: 9b. Response (cached: false)
    end
    
    F->>F: 10. Actualiza MapContext
    F->>F: 11. Renderiza métricas y capas
    F->>U: 12. Muestra resultados visuales
```

---

## 🚀 Guía de Implementación por Sprints

### **Sprint 1: Fundamentos (Semana 1)**

#### Día 1-2: Configuración del Backend
```bash
# 1. Crear Service Account en Google Cloud
# - Navegar a: console.cloud.google.com
# - IAM & Admin > Service Accounts > Create
# - Asignar rol: Earth Engine Resource Admin
# - Crear y descargar clave JSON

# 2. Configurar secretos en Supabase
supabase secrets set GEE_SERVICE_ACCOUNT_EMAIL=your-email@project.iam.gserviceaccount.com
supabase secrets set GEE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."

# 3. Crear estructura de Edge Functions
mkdir -p supabase/functions/gee-metrics
mkdir -p supabase/functions/_shared
```

**Entregables**:
- [ ] Service Account configurado
- [ ] Secretos en Supabase
- [ ] Estructura de carpetas creada

---

#### Día 3-4: Extensión del Frontend
**Archivo**: [`src/types/index.ts`](../src/types/index.ts)

```typescript
// Agregar nuevos tipos al final del archivo

export interface AOI {
  id: string;
  type: 'drawn' | 'abrae';
  geometry: GeoJSON.Geometry;
  name?: string;
  area?: number;
  bounds?: { north: number; south: number; east: number; west: number };
  createdAt: Date;
}

export interface ABRAE {
  id: string;
  name: string;
  type: string;
  iucnCategory?: string;
  geometry: GeoJSON.Geometry;
  area: number;
  country: string;
}

export interface EnvironmentalMetrics {
  aoiId: string;
  aoiName: string;
  areaTotal: number;
  coberturaBoscosa: ForestCoverMetrics;
  deforestacion: DeforestationMetrics;
  carbono: CarbonMetrics;
  riesgoIncendio: FireRiskMetrics;
  riesgoInundacion: FloodRiskMetrics;
  ultimaActualizacion: string;
}

// ... (agregar interfaces detalladas según map-technical-specs.md)
```

**Archivo**: [`src/contexts/MapContext.tsx`](../src/contexts/MapContext.tsx)

```typescript
// Extender interface MapContextType
interface MapContextType {
  // Existentes...
  layers: MapLayer[];
  toggleLayer: (layerId: string) => void;
  // ... otros existentes

  // NUEVOS
  aoi: AOI | null;
  setAOI: (aoi: AOI | null) => void;
  aoiSelectionMode: 'draw' | 'abrae' | null;
  setAOISelectionMode: (mode: 'draw' | 'abrae' | null) => void;
  drawnGeometry: any | null;
  setDrawnGeometry: (geometry: any) => void;
  selectedABRAE: ABRAE | null;
  setSelectedABRAE: (abrae: ABRAE | null) => void;
  environmentalMetrics: EnvironmentalMetrics | null;
  setEnvironmentalMetrics: (metrics: EnvironmentalMetrics | null) => void;
  isLoadingMetrics: boolean;
  setIsLoadingMetrics: (loading: boolean) => void;
}

// Agregar en MapProvider
export const MapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Estados existentes...
  
  // NUEVOS estados
  const [aoi, setAOI] = useState<AOI | null>(null);
  const [aoiSelectionMode, setAOISelectionMode] = useState<'draw' | 'abrae' | null>(null);
  const [drawnGeometry, setDrawnGeometry] = useState<any | null>(null);
  const [selectedABRAE, setSelectedABRAE] = useState<ABRAE | null>(null);
  const [environmentalMetrics, setEnvironmentalMetrics] = useState<EnvironmentalMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);

  return (
    <MapContext.Provider
      value={{
        // ...existentes,
        aoi,
        setAOI,
        aoiSelectionMode,
        setAOISelectionMode,
        drawnGeometry,
        setDrawnGeometry,
        selectedABRAE,
        setSelectedABRAE,
        environmentalMetrics,
        setEnvironmentalMetrics,
        isLoadingMetrics,
        setIsLoadingMetrics,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};
```

**Entregables**:
- [ ] Tipos extendidos en [`index.ts`](../src/types/index.ts)
- [ ] MapContext actualizado
- [ ] Sin errores de TypeScript

---

#### Día 5: Instalación de Dependencias
```bash
# Instalar paquetes para dibujo y análisis espacial
npm install leaflet-draw react-leaflet-draw @turf/turf
npm install --save-dev @types/leaflet-draw @types/geojson

# Instalar React Query para gestión de estado servidor
npm install @tanstack/react-query
```

**Archivo**: [`src/main.tsx`](../src/main.tsx)

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 2,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <RouterProvider router={router} />
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
```

**Entregables**:
- [ ] Dependencias instaladas
- [ ] QueryClientProvider configurado

---

### **Sprint 2: Selección de AOI (Semana 2)**

#### Componente AOISelector
**Archivo**: [`src/components/map/AOISelector.tsx`](../src/components/map/AOISelector.tsx)

```typescript
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DrawingTools } from './DrawingTools';
import { ABRAESelector } from './ABRAESelector';
import { useMap } from '@/contexts/MapContext';
import { Pencil, Map } from 'lucide-react';

export const AOISelector: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'draw' | 'abrae'>('draw');
  const { aoi, setAOI, setAOISelectionMode } = useMap();

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'draw' | 'abrae');
    setAOISelectionMode(value as 'draw' | 'abrae');
  };

  const handleClearAOI = () => {
    setAOI(null);
    setAOISelectionMode(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selección de Área de Interés (AOI)</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="draw">
              <Pencil className="w-4 h-4 mr-2" />
              Dibujar
            </TabsTrigger>
            <TabsTrigger value="abrae">
              <Map className="w-4 h-4 mr-2" />
              ABRAE
            </TabsTrigger>
          </TabsList>

          <TabsContent value="draw">
            <DrawingTools />
          </TabsContent>

          <TabsContent value="abrae">
            <ABRAESelector />
          </TabsContent>
        </Tabs>

        {aoi && (
          <div className="mt-4 flex items-center justify-between p-3 bg-muted rounded-md">
            <div>
              <p className="text-sm font-medium">
                {aoi.name || 'Área dibujada'}
              </p>
              <p className="text-xs text-muted-foreground">
                {aoi.area?.toFixed(2)} hectáreas
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleClearAOI}>
              Limpiar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
```

**Entregables**:
- [ ] Componente AOISelector creado
- [ ] Tabs funcionando (Dibujar/ABRAE)

---

#### Herramientas de Dibujo
**Archivo**: [`src/components/map/DrawingTools.tsx`](../src/components/map/DrawingTools.tsx)

```typescript
import { useEffect } from 'react';
import { FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import { useMap as useLeafletMap } from 'react-leaflet';
import { useMap } from '@/contexts/MapContext';
import * as turf from '@turf/turf';
import { nanoid } from 'nanoid';

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
```

**Nota**: Este componente se integrará dentro de [`MapContainer.tsx`](../src/components/map/MapContainer.tsx)

**Entregables**:
- [ ] DrawingTools funcional
- [ ] Validación de área (< 100k ha)
- [ ] Simplificación de polígonos complejos

---

#### Selector de ABRAE
**Archivo**: [`src/components/map/ABRAESelector.tsx`](../src/components/map/ABRAESelector.tsx)

```typescript
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useMap } from '@/contexts/MapContext';
import { abraeService } from '@/services/abraeService';
import { Loader2 } from 'lucide-react';

export const ABRAESelector: React.FC = () => {
  const { setAOI } = useMap();
  const [types, setTypes] = useState<string[]>([]);
  const [names, setNames] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedName, setSelectedName] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Cargar tipos al montar
  useEffect(() => {
    abraeService.getTypes().then(setTypes);
  }, []);

  // Cargar nombres cuando cambia el tipo
  useEffect(() => {
    if (selectedType) {
      setLoading(true);
      abraeService.getNamesByType(selectedType)
        .then(setNames)
        .finally(() => setLoading(false));
    }
  }, [selectedType]);

  const handleSelect = async () => {
    if (!selectedType || !selectedName) return;
    
    setLoading(true);
    try {
      const abrae = await abraeService.getABRAE(selectedType, selectedName);
      
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
      
      setAOI(aoi);
    } catch (error) {
      console.error('Error al cargar ABRAE:', error);
      alert('Error al cargar el ABRAE seleccionado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="abrae-type">Tipo de ABRAE</Label>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger id="abrae-type">
            <SelectValue placeholder="Seleccionar tipo" />
          </SelectTrigger>
          <SelectContent>
            {types.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="abrae-name">Nombre del ABRAE</Label>
        <Select 
          value={selectedName} 
          onValueChange={setSelectedName}
          disabled={!selectedType || loading}
        >
          <SelectTrigger id="abrae-name">
            <SelectValue placeholder="Seleccionar nombre" />
          </SelectTrigger>
          <SelectContent>
            {names.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button 
        onClick={handleSelect} 
        disabled={!selectedType || !selectedName || loading}
        className="w-full"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Seleccionar ABRAE
      </Button>
    </div>
  );
};
```

**Archivo**: [`src/services/abraeService.ts`](../src/services/abraeService.ts)

```typescript
import { ABRAE } from '@/types';

// Por ahora, datos de demostración. Luego se obtendrán desde Supabase o GEE
const MOCK_ABRAES: ABRAE[] = [
  {
    id: 'pn-canaima',
    name: 'Parque Nacional Canaima',
    type: 'Parque Nacional',
    iucnCategory: 'II',
    geometry: {
      type: 'Polygon',
      coordinates: [[[-61.5, 4.5], [-61.5, 6.5], [-60.5, 6.5], [-60.5, 4.5], [-61.5, 4.5]]],
    },
    area: 3000000,
    country: 'VEN',
  },
  // ... más ABRAE
];

export const abraeService = {
  async getTypes(): Promise<string[]> {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 300));
    const types = [...new Set(MOCK_ABRAES.map(a => a.type))];
    return types;
  },

  async getNamesByType(type: string): Promise<string[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const names = MOCK_ABRAES
      .filter(a => a.type === type)
      .map(a => a.name);
    return names;
  },

  async getABRAE(type: string, name: string): Promise<ABRAE> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const abrae = MOCK_ABRAES.find(a => a.type === type && a.name === name);
    if (!abrae) throw new Error('ABRAE no encontrado');
    return abrae;
  },
};
```

**Entregables**:
- [ ] ABRAESelector funcional
- [ ] Servicio abraeService con datos mock
- [ ] Dropdown en cascada (tipo → nombre)

---

### **Sprint 3: Panel de Métricas (Semana 3)**

#### MetricsPanel Principal
**Archivo**: [`src/components/map/MetricsPanel.tsx`](../src/components/map/MetricsPanel.tsx)

```typescript
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
          Error al calcular métricas: {error.message}
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
```

**Hook personalizado**: [`src/hooks/useEnvironmentalMetrics.ts`](../src/hooks/useEnvironmentalMetrics.ts)

```typescript
import { useQuery } from '@tanstack/react-query';
import { geeService } from '@/services/geeService';
import { AOI } from '@/types';

export const useEnvironmentalMetrics = (aoi: AOI | null) => {
  return useQuery({
    queryKey: ['environmental-metrics', aoi?.id],
    queryFn: () => {
      if (!aoi) return null;
      return geeService.getEnvironmentalMetrics(aoi);
    },
    enabled: !!aoi,
    staleTime: 1000 * 60 * 10, // 10 minutos
    retry: 2,
  });
};
```

**Entregables**:
- [ ] MetricsPanel con estados de carga/error
- [ ] Hook useEnvironmentalMetrics
- [ ] Integración con React Query

---

### **Sprint 4: Integración GEE (Semana 4)**

Ver documentación completa en [`supabase-gee-integration.md`](./supabase-gee-integration.md)

**Pasos clave**:
1. Implementar Edge Functiongee-metrics`](.supabase/functions/gee-metrics/index.ts)
2. Crear cliente GEE con autenticación JWT
3. Implementar calculadora de métricas
4. Configurar caché en PostgreSQL
5. Testing local con Supabase CLI
6. Deploy a producción

**Entregables**:
- [ ] Edge Functions desplegadas
- [ ] Integración GEE funcionando
- [ ] Caché implementado
- [ ] Testing completado

---

## 🎨 Layout Final

**Archivo**: [`src/pages/MapView.tsx`](../src/pages/MapView.tsx)

```typescript
<div className="container mx-auto p-6 space-y-6">
  {/* Header */}
  <div className="flex items-center justify-between">
    <h1 className="text-3xl font-bold">Sistema de Monitoreo Ambiental</h1>
  </div>

  {/* AOI Selector */}
  <AOISelector />

  {/* Mapa y controles */}
  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
    <div className="lg:col-span-1 space-y-4">
      <LayerControl />
    </div>
    <div className="lg:col-span-3">
      <MapToolbar />
      <MapContainerComponent />
    </div>
  </div>

  {/* Panel de métricas DEBAJO del mapa */}
  <MetricsPanel />
</div>
```

---

## ✅ Checklist Final

### Backend
- [ ] Service Account de GEE configurado
- [ ] Secretos en Supabase
- [ ] Edge Function `gee-metrics` desplegada
- [ ] Edge Function `gee-abrae` desplegada
- [ ] Edge Function `gee-risk-layer` desplegada
- [ ] Tabla `gee_cache` creada
- [ ] Testing de endpoints

### Frontend
- [ ] Tipos extendidos
- [ ] MapContext actualizado
- [ ] AOISelector implementado
- [ ] DrawingTools integrado
- [ ] ABRAESelector funcional
- [ ] MetricsPanel completo
- [ ] Servicios (geeService, abraeService)
- [ ] Hooks personalizados
- [ ] Layout responsivo
- [ ] Testing de componentes

### Integración
- [ ] Flujo completo: AOI → GEE → Métricas → Visualización
- [ ] Manejo de errores
- [ ] Estados de carga
- [ ] Caché funcionando
- [ ] Performance optimizado

---

## 📚 Referencias Rápidas

- **Documentos**:
  - [Plan de Refactorización](./map-refactoring-plan.md)
  - [Especificaciones Técnicas](./map-technical-specs.md)
  - [Integración Supabase-GEE](./supabase-gee-integration.md)

- **Scripts GEE originales**:
  - [`gee/alertas.js`](../gee/alertas.js)
  - [`gee/LULC.js`](../gee/LULC.js)

---

**Última actualización**: 2026-01-02  
**Responsable**: Equipo de Desarrollo SMyEG
