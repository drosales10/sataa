# Integración de Google Earth Engine con Supabase Edge Functions

## 🎯 Objetivo

Implementar un backend serverless usando Supabase Edge Functions (Deno) que se comunique con Google Earth Engine REST API para procesar datos geoespaciales y servir métricas ambientales al frontend React.

---

## 🏗️ Arquitectura de Integración

```mermaid
graph TB
    subgraph "Frontend React"
        MapView[MapView Component]
        GEEService[geeService.ts]
    end
    
    subgraph "Supabase"
        EdgeFunctions[Edge Functions]
        Storage[Storage - GeoJSON Cache]
        Database[(PostgreSQL + PostGIS)]
    end
    
    subgraph "Google Cloud"
        GEEAPI[Earth Engine REST API]
        ServiceAccount[Service Account]
    end
    
    subgraph "Data Sources"
        DynamicWorld[Dynamic World]
        FIRMS[FIRMS Fire Data]
        CHIRPS[CHIRPS Precipitation]
        WDPA[WDPA Protected Areas]
    end
    
    MapView --> GEEService
    GEEService -->|HTTP POST| EdgeFunctions
    EdgeFunctions -->|Authenticate| ServiceAccount
    EdgeFunctions -->|Request Data| GEEAPI
    GEEAPI --> DynamicWorld
    GEEAPI --> FIRMS
    GEEAPI --> CHIRPS
    GEEAPI --> WDPA
    
    EdgeFunctions -->|Cache Results| Storage
    EdgeFunctions -->|Store Metrics| Database
    EdgeFunctions -->|Response| GEEService
    GEEService -->|Update State| MapView
```

---

## 📋 Pre-requisitos

### 1. Cuenta de Google Earth Engine
```bash
# Registrarse en: https://earthengine.google.com/signup/
# Crear un proyecto en Google Cloud Console
# Habilitar Earth Engine API
```

### 2. Service Account de GEE
```bash
# 1. Crear Service Account en Google Cloud Console
# 2. Descargar el archivo JSON de credenciales
# 3. Registrar el Service Account en EE:
earthengine authenticate --auth_mode=gcloud
```

### 3. Configuración de Supabase
```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link proyecto
supabase link --project-ref [YOUR_PROJECT_REF]
```

---

## 🚀 Implementación

### Paso 1: Estructura de Edge Functions

```
supabase/
├── functions/
│   ├── gee-metrics/
│   │   ├── index.ts
│   │   ├── gee-client.ts
│   │   ├── metrics-calculator.ts
│   │   └── types.ts
│   ├── gee-abrae/
│   │   └── index.ts
│   ├── gee-risk-layer/
│   │   └── index.ts
│   └── _shared/
│       ├── cors.ts
│       ├── auth.ts
│       └── validation.ts
└── migrations/
    └── 20260102_gee_cache.sql
```

---

### Paso 2: Edge Function Principal - `gee-metrics`

#### `supabase/functions/gee-metrics/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GEEClient } from "./gee-client.ts";
import { MetricsCalculator } from "./metrics-calculator.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { validateRequest } from "../_shared/validation.ts";

serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validar autenticación
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request
    const { aoi, analysisYear, params } = await req.json();
    
    // Validar entrada
    const validation = validateRequest({ aoi, analysisYear, params });
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Inicializar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verificar caché
    const cacheKey = `metrics_${aoi.id}_${analysisYear}`;
    const { data: cached } = await supabaseClient
      .from("gee_cache")
      .select("data, created_at")
      .eq("cache_key", cacheKey)
      .single();

    // Si hay caché válido (< 24 horas), retornar
    if (cached && isCacheValid(cached.created_at)) {
      return new Response(JSON.stringify({
        success: true,
        data: cached.data,
        cached: true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Inicializar cliente GEE
    const geeClient = new GEEClient({
      serviceAccountEmail: Deno.env.get("GEE_SERVICE_ACCOUNT_EMAIL") ?? "",
      privateKey: Deno.env.get("GEE_PRIVATE_KEY") ?? "",
    });

    await geeClient.authenticate();

    // Calcular métricas
    const calculator = new MetricsCalculator(geeClient);
    const startTime = Date.now();
    const metrics = await calculator.calculate({
      geometry: aoi.geometry,
      analysisYear,
      params,
    });
    const processingTime = Date.now() - startTime;

    // Guardar en caché
    await supabaseClient.from("gee_cache").upsert({
      cache_key: cacheKey,
      data: metrics,
      aoi_id: aoi.id,
      analysis_year: analysisYear,
      created_at: new Date().toISOString(),
    });

    // Retornar resultado
    return new Response(JSON.stringify({
      success: true,
      data: metrics,
      processingTime,
      cached: false,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in gee-metrics:", error);
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: "PROCESSING_ERROR",
        message: error.message,
      },
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function isCacheValid(createdAt: string): boolean {
  const cacheAge = Date.now() - new Date(createdAt).getTime();
  const maxAge = 24 * 60 * 60 * 1000; // 24 horas
  return cacheAge < maxAge;
}
```

---

### Paso 3: Cliente de Google Earth Engine REST API

#### `supabase/functions/gee-metrics/gee-client.ts`

```typescript
import { create as createJWT } from "https://deno.land/x/djwt@v2.8/mod.ts";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

export interface GEEClientConfig {
  serviceAccountEmail: string;
  privateKey: string;
}

export class GEEClient {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private readonly baseURL = "https://earthengine.googleapis.com/v1";
  
  constructor(private config: GEEClientConfig) {}

  async authenticate(): Promise<void> {
    // Verificar si el token actual es válido
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const expiry = now + 3600; // 1 hora

    // Crear JWT
    const header = { alg: "RS256", typ: "JWT" };
    const payload = {
      iss: this.config.serviceAccountEmail,
      scope: "https://www.googleapis.com/auth/earthengine.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: expiry,
    };

    // Importar clave privada
    const keyData = this.config.privateKey
      .replace(/-----BEGIN PRIVATE KEY-----/, "")
      .replace(/-----END PRIVATE KEY-----/, "")
      .replace(/\n/g, "");
    
    const keyBuffer = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      keyBuffer,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const jwt = await createJWT(header, payload, cryptoKey);

    // Intercambiar JWT por Access Token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to authenticate: ${await tokenResponse.text()}`);
    }

    const tokenData = await tokenResponse.json();
    this.accessToken = tokenData.access_token;
    this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000);
  }

  async computeValue(expression: any): Promise<any> {
    await this.authenticate();

    const response = await fetch(`${this.baseURL}:computeValue`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expression }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`GEE API Error: ${JSON.stringify(error)}`);
    }

    return await response.json();
  }

  async getImageCollection(collectionId: string, filters: any): Promise<any> {
    const expression = {
      functionInvocationValue: {
        functionName: "ImageCollection.load",
        arguments: {
          id: { constantValue: collectionId },
          ...filters,
        },
      },
    };

    return await this.computeValue(expression);
  }

  async reduceRegion(params: {
    image: any;
    reducer: string;
    geometry: any;
    scale: number;
    maxPixels: number;
  }): Promise<any> {
    const expression = {
      functionInvocationValue: {
        functionName: "Image.reduceRegion",
        arguments: {
          image: params.image,
          reducer: {
            functionInvocationValue: {
              functionName: `Reducer.${params.reducer}`,
            },
          },
          geometry: params.geometry,
          scale: { constantValue: params.scale },
          maxPixels: { constantValue: params.maxPixels },
        },
      },
    };

    return await this.computeValue(expression);
  }
}
```

---

### Paso 4: Calculadora de Métricas

#### `supabase/functions/gee-metrics/metrics-calculator.ts`

```typescript
import { GEEClient } from "./gee-client.ts";
import { EnvironmentalMetrics, AOIGeometry } from "./types.ts";

export class MetricsCalculator {
  constructor(private geeClient: GEEClient) {}

  async calculate(params: {
    geometry: AOIGeometry;
    analysisYear: number;
    params: any;
  }): Promise<EnvironmentalMetrics> {
    const { geometry, analysisYear } = params;

    // Convertir geometría a formato GEE
    const geeGeometry = this.toGEEGeometry(geometry);

    // Calcular en paralelo
    const [forestCover, deforestation, carbon, fireRisk, floodRisk] = await Promise.all([
      this.calculateForestCover(geeGeometry, analysisYear),
      this.calculateDeforestation(geeGeometry, analysisYear),
      this.calculateCarbon(geeGeometry, analysisYear, params.params),
      this.calculateFireRisk(geeGeometry),
      this.calculateFloodRisk(geeGeometry, analysisYear),
    ]);

    return {
      areaTotal: await this.calculateArea(geeGeometry),
      coberturaBoscosa: forestCover,
      deforestacion,
      carbono: carbon,
      riesgoIncendio: fireRisk,
      riesgoInundacion: floodRisk,
      ultimaActualizacion: new Date().toISOString(),
    };
  }

  private async calculateForestCover(geometry: any, year: number) {
    // Obtener Dynamic World LULC
    const dwExpression = {
      functionInvocationValue: {
        functionName: "ImageCollection.filterBounds",
        arguments: {
          input: {
            functionInvocationValue: {
              functionName: "ImageCollection.load",
              arguments: {
                id: { constantValue: "GOOGLE/DYNAMICWORLD/V1" },
              },
            },
          },
          geometry: geometry,
        },
      },
    };

    // Filtrar por fecha
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    
    // Aplicar filtro de fecha
    const filteredExpression = {
      functionInvocationValue: {
        functionName: "ImageCollection.filterDate",
        arguments: {
          input: dwExpression,
          start: { constantValue: startDate },
          end: { constantValue: endDate },
        },
      },
    };

    // Obtener la clase más frecuente (mode)
    const modeExpression = {
      functionInvocationValue: {
        functionName: "ImageCollection.mode",
        arguments: {
          input: filteredExpression,
        },
      },
    };

    // Seleccionar banda 'label'
    const labelExpression = {
      functionInvocationValue: {
        functionName: "Image.select",
        arguments: {
          input: modeExpression,
          bandSelectors: { constantValue: ["label"] },
        },
      },
    };

    // Calcular área por clase
    const pixelArea = {
      functionInvocationValue: {
        functionName: "Image.pixelArea",
      },
    };

    const areaImage = {
      functionInvocationValue: {
        functionName: "Image.addBands",
        arguments: {
          dstImg: pixelArea,
          srcImg: labelExpression,
        },
      },
    };

    // Reducir por región agrupando por clase
    const result = await this.geeClient.reduceRegion({
      image: areaImage,
      reducer: "sum.groupBy",
      geometry: geometry,
      scale: 10,
      maxPixels: 1e13,
    });

    // Procesar resultado para obtener distribución
    const distribution = this.processLULCDistribution(result);
    
    // Clase 1 es Bosque/Árboles en Dynamic World
    const forestArea = distribution.bosque || 0;
    const totalArea = Object.values(distribution).reduce((a, b) => a + b, 0);

    return {
      area: forestArea / 10000, // convertir m² a hectáreas
      porcentaje: (forestArea / totalArea) * 100,
      anio: year,
      distribucion: this.normalizeDistribution(distribution),
    };
  }

  private async calculateDeforestation(geometry: any, year: number) {
    const startYear = year - 5; // Analizar últimos 5 años
    
    // Obtener LULC del año inicial
    const lulcStart = await this.getLULC(geometry, startYear);
    
    // Obtener LULC del año actual
    const lulcEnd = await this.getLULC(geometry, year);

    // Detectar píxeles que eran bosque (clase 1) y dejaron de serlo
    const deforestationMask = {
      functionInvocationValue: {
        functionName: "Image.and",
        arguments: {
          image1: {
            functionInvocationValue: {
              functionName: "Image.eq",
              arguments: {
                input: lulcStart,
                other: { constantValue: 1 },
              },
            },
          },
          image2: {
            functionInvocationValue: {
              functionName: "Image.neq",
              arguments: {
                input: lulcEnd,
                other: { constantValue: 1 },
              },
            },
          },
        },
      },
    };

    // Calcular área deforestada
    const areaResult = await this.calculateAreaForMask(geometry, deforestationMask);

    return {
      areaTotal: areaResult / 10000, // hectáreas
      porcentaje: 0, // Calcular después con área de bosque inicial
      periodoAnalisis: {
        inicio: startYear,
        fin: year,
      },
      tasaAnual: (areaResult / 10000) / (year - startYear),
      serieAnual: [], // Calcular si se requiere
      causas: [], // Analizar transiciones
      alertaCritica: false,
    };
  }

  private async calculateCarbon(geometry: any, year: number, params: any) {
    // Coeficientes de carbono por clase LULC (tC/ha)
    const CARBON_STOCKS = [0, 150, 20, 40, 35, 60, 5, 2];
    
    // Obtener LULC
    const lulc = await this.getLULC(geometry, year);

    // Remapear clases a valores de carbono
    const carbonImage = {
      functionInvocationValue: {
        functionName: "Image.remap",
        arguments: {
          input: lulc,
          from: { constantValue: [0, 1, 2, 3, 4, 5, 6, 7] },
          to: { constantValue: CARBON_STOCKS },
        },
      },
    };

    // Multiplicar por área de píxel para obtener carbono total
    const carbonTotal = await this.sumImage(geometry, carbonImage);

    const stockTotal = carbonTotal / 10000; // Convertir a toneladas
    const co2Equivalente = stockTotal * 3.67;
    const valorUSD = co2Equivalente * params.precioCO2USD;

    return {
      stockTotal,
      co2Equivalente,
      valorUSD,
      valorVES: valorUSD * params.tasaCambioVES,
      densidadPromedio: stockTotal / (await this.calculateArea(geometry) / 10000),
      parametros: {
        precioCO2USD: params.precioCO2USD,
        tasaCambio: params.tasaCambioVES,
      },
    };
  }

  private async calculateFireRisk(geometry: any) {
    // Obtener focos activos de FIRMS (últimos 3 días)
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    
    const firmsExpression = {
      functionInvocationValue: {
        functionName: "ImageCollection.filterDate",
        arguments: {
          input: {
            functionInvocationValue: {
              functionName: "ImageCollection.filterBounds",
              arguments: {
                input: {
                  functionInvocationValue: {
                    functionName: "ImageCollection.load",
                    arguments: {
                      id: { constantValue: "FIRMS" },
                    },
                  },
                },
                geometry: geometry,
              },
            },
          },
          start: { constantValue: threeDaysAgo.toISOString() },
          end: { constantValue: now.toISOString() },
        },
      },
    };

    // Contar focos
    const focosCount = await this.countFeatures(firmsExpression);

    // Calcular nivel de riesgo basado en NDWI y focos
    let nivel: "bajo" | "medio" | "alto" = "bajo";
    if (focosCount > 10) nivel = "alto";
    else if (focosCount > 5) nivel = "medio";

    return {
      nivel,
      nivelNumerico: focosCount > 10 ? 5 : focosCount > 5 ? 3 : 1,
      focosActivos: focosCount,
      areaAltaRiesgo: 0, // Calcular área con alta sequía
      factores: {
        ndwi: 0, // Calcular NDWI promedio
      },
    };
  }

  private async calculateFloodRisk(geometry: any, year: number) {
    // Implementar lógica AHP de alertas.js
    // 1. Obtener precipitación (CHIRPS)
    // 2. Obtener elevación y pendiente (NASADEM)
    // 3. Calcular distancia a ríos (MERIT Hydro)
    // 4. Aplicar pesos adaptativos según elevación media

    return {
      nivel: "medio",
      nivelNumerico: 3,
      areaAfectada: 0,
      precipitacionPromedio: 0,
      elevacionPromedio: 0,
      pendientePromedio: 0,
      metodologia: "AHP" as const,
      factores: {
        lluvia: 0.25,
        pendiente: 0.10,
        proximidadRios: 0.35,
        elevacion: 0.30,
      },
    };
  }

  // Utilidades

  private toGEEGeometry(geojson: any): any {
    return {
      functionInvocationValue: {
        functionName: "Geometry",
        arguments: {
          geoJson: { constantValue: geojson },
        },
      },
    };
  }

  private async calculateArea(geometry: any): Promise<number> {
    const areaExpression = {
      functionInvocationValue: {
        functionName: "Geometry.area",
        arguments: {
          geometry: geometry,
        },
      },
    };

    const result = await this.geeClient.computeValue(areaExpression);
    return result.constantValue;
  }

  private async getLULC(geometry: any, year: number): Promise<any> {
    // Implementar obtención de LULC de Dynamic World para un año específico
    // (Similar a calculateForestCover pero retorna la imagen, no el resultado)
    return {};
  }

  private async sumImage(geometry: any, image: any): Promise<number> {
    const result = await this.geeClient.reduceRegion({
      image,
      reducer: "sum",
      geometry,
      scale: 30,
      maxPixels: 1e13,
    });
    
    return result.value || 0;
  }

  private async calculateAreaForMask(geometry: any, mask: any): Promise<number> {
    const pixelArea = {
      functionInvocationValue: {
        functionName: "Image.pixelArea",
      },
    };

    const maskedArea = {
      functionInvocationValue: {
        functionName: "Image.updateMask",
        arguments: {
          input: pixelArea,
          mask: mask,
        },
      },
    };

    return await this.sumImage(geometry, maskedArea);
  }

  private async countFeatures(collection: any): Promise<number> {
    const sizeExpression = {
      functionInvocationValue: {
        functionName: "ImageCollection.size",
        arguments: {
          input: collection,
        },
      },
    };

    const result = await this.geeClient.computeValue(sizeExpression);
    return result.constantValue || 0;
  }

  private processLULCDistribution(result: any): any {
    // Procesar resultado de reduceRegion agrupado
    // Mapear clases a nombres en español
    return {
      agua: 0,
      bosque: 0,
      pastizales: 0,
      vegetacionInundada: 0,
      cultivos: 0,
      matorral: 0,
      urbano: 0,
      sueloDesnudo: 0,
    };
  }

  private normalizeDistribution(distribution: any): any {
    // Convertir m² a hectáreas
    const normalized: any = {};
    for (const key in distribution) {
      normalized[key] = distribution[key] / 10000;
    }
    return normalized;
  }
}
```

---

### Paso 5: Migración de Base de Datos (Caché)

#### `supabase/migrations/20260102_gee_cache.sql`

```sql
-- Tabla para cachear resultados de GEE
CREATE TABLE IF NOT EXISTS gee_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  data JSONB NOT NULL,
  aoi_id TEXT,
  analysis_year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_gee_cache_key ON gee_cache(cache_key);
CREATE INDEX idx_gee_cache_created ON gee_cache(created_at);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gee_cache_updated_at
BEFORE UPDATE ON gee_cache
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Limpiar caché antiguo (> 7 días) automáticamente
CREATE OR REPLACE FUNCTION clean_old_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM gee_cache
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Programar limpieza diaria usando pg_cron (si está habilitado)
-- SELECT cron.schedule('clean-gee-cache', '0 2 * * *', 'SELECT clean_old_cache()');
```

---

### Paso 6: Configuración de Secretos

#### `.env.local` (NO subir a Git)

```bash
# Google Earth Engine
GEE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GEE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Configurar en Supabase Dashboard

```bash
# 1. Ir a: Project Settings > Edge Functions > Secrets
# 2. Agregar los secretos:
# - GEE_SERVICE_ACCOUNT_EMAIL
# - GEE_PRIVATE_KEY
# - SUPABASE_SERVICE_ROLE_KEY
```

---

### Paso 7: Servicio Frontend

#### `src/services/geeService.ts`

```typescript
import { supabase } from '@/lib/supabase';
import type { AOI, EnvironmentalMetrics } from '@/types';

const GEE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export const geeService = {
  async getEnvironmentalMetrics(
    aoi: AOI,
    analysisYear: number = new Date().getFullYear() - 1,
    params?: {
      precioCO2USD?: number;
      tasaCambioVES?: number;
      anoInicioDeforestacion?: number;
    }
  ): Promise<EnvironmentalMetrics> {
    const { data: session } = await supabase.auth.getSession();
    
    if (!session?.session) {
      throw new Error('Usuario no autenticado');
    }

    const response = await fetch(`${GEE_FUNCTION_URL}/gee-metrics`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aoi: {
          id: aoi.id,
          geometry: aoi.geometry,
        },
        analysisYear,
        params: {
          precioCO2USD: params?.precioCO2USD || 5.0,
          tasaCambioVES: params?.tasaCambioVES || 270,
          anoInicioDeforestacion: params?.anoInicioDeforestacion || 2015,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Error al calcular métricas');
    }

    const result = await response.json();
    return result.data;
  },

  async getABRAEList(): Promise<ABRAE[]> {
    const response = await fetch(`${GEE_FUNCTION_URL}/gee-abrae`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener lista de ABRAE');
    }

    const result = await response.json();
    return result.data;
  },

  async getFireRiskLayer(aoi: AOI): Promise<GeoJSON.FeatureCollection> {
    const { data: session } = await supabase.auth.getSession();
    
    const response = await fetch(`${GEE_FUNCTION_URL}/gee-risk-layer`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session?.session?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aoi: { geometry: aoi.geometry },
        layerType: 'fire',
        resolution: 100,
      }),
    });

    if (!response.ok) {
      throw new Error('Error al obtener capa de riesgo de incendios');
    }

    const result = await response.json();
    return result.data;
  },

  async getFloodRiskLayer(aoi: AOI): Promise<GeoJSON.FeatureCollection> {
    const { data: session } = await supabase.auth.getSession();
    
    const response = await fetch(`${GEE_FUNCTION_URL}/gee-risk-layer`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session?.session?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aoi: { geometry: aoi.geometry },
        layerType: 'flood',
        resolution: 100,
      }),
    });

    if (!response.ok) {
      throw new Error('Error al obtener capa de riesgo de inundaciones');
    }

    const result = await response.json();
    return result.data;
  },
};
```

---

## 🧪 Testing Local

### 1. Ejecutar Edge Function localmente

```bash
# Iniciar Supabase local
supabase start

# Servir función
supabase functions serve gee-metrics --env-file .env.local
```

### 2. Probar con cURL

```bash
curl -X POST \
  http://localhost:54321/functions/v1/gee-metrics \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "aoi": {
      "id": "test-001",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-66, 6], [-66, 7], [-65, 7], [-65, 6], [-66, 6]]]
      }
    },
    "analysisYear": 2023,
    "params": {
      "precioCO2USD": 5.0,
      "tasaCambioVES": 270
    }
  }'
```

---

## 🚀 Deployment

### Deploy Edge Functions

```bash
# Deploy todas las funciones
supabase functions deploy

# O individualmente
supabase functions deploy gee-metrics
supabase functions deploy gee-abrae
supabase functions deploy gee-risk-layer
```

### Verificar Deployment

```bash
# Logs en tiempo real
supabase functions logs gee-metrics --tail

# Verificar health
curl https://your-project.supabase.co/functions/v1/gee-metrics/health
```

---

## ⚠️ Limitaciones y Consideraciones

### 1. **Timeout de Edge Functions**
- Límite: 60 segundos
- Solución: Para AOI grandes, implementar procesamiento asíncrono con jobs

### 2. **Cuota de Earth Engine API**
- Límite: Según plan de GCP
- Solución: Implementar caché agresivo y rate limiting

### 3. **Tamaño de Respuesta**
- Límite: 6 MB por respuesta
- Solución: Para GeoJSON grandes, almacenar en Storage y retornar URL

### 4. **Complejidad de la API REST de GEE**
- Desafío: La API REST es más compleja que la Python API
- Solución: Crear helpers y abstracciones en `gee-client.ts`

---

## 📚 Recursos

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Earth Engine REST API](https://developers.google.com/earth-engine/apidocs)
- [Deno Deploy](https://deno.com/deploy)
- [DJWT - Deno JWT](https://deno.land/x/djwt)

---

## ✅ Checklist de Implementación

- [ ] Crear Service Account en Google Cloud
- [ ] Configurar secretos en Supabase Dashboard
- [ ] Implementar `gee-client.ts` con autenticación
- [ ] Implementar `metrics-calculator.ts` con lógica de GEE
- [ ] Crear Edge Function `gee-metrics`
- [ ] Crear Edge Function `gee-abrae`
- [ ] Crear Edge Function `gee-risk-layer`
- [ ] Configurar caché en PostgreSQL
- [ ] Implementar `geeService.ts` en frontend
- [ ] Testing local con Supabase CLI
- [ ] Deploy a producción
- [ ] Monitoreo y logging

---

**Última actualización**: 2026-01-02  
**Responsable**: Equipo de Desarrollo SMyEG
