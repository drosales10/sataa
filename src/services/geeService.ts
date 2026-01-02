// ============================================================================
// SERVICIO: GOOGLE EARTH ENGINE
// ============================================================================

import { supabase } from '@/lib/supabase';
import type { AOI, EnvironmentalMetrics } from '@/types';

const GEE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

// Mock mode para desarrollo hasta que el backend esté configurado
const MOCK_MODE = false; // Cambiar a true para usar datos mock

/**
 * Genera métricas simuladas para desarrollo
 */
function generateMockMetrics(aoi: AOI): EnvironmentalMetrics {
  return {
    aoiId: aoi.id,
    aoiName: aoi.name || 'Área dibujada',
    areaTotal: aoi.area || 45230,
    
    coberturaBoscosa: {
      areaHectareas: 29400,
      porcentaje: 65.0,
      anio: 2024,
      distribucion: {
        agua: 120,
        bosque: 29400,
        pastizales: 8500,
        vegetacionInundada: 1200,
        cultivos: 3400,
        matorral: 2100,
        urbano: 350,
        sueloDesnudo: 160,
      },
    },
    
    deforestacion: {
      areaHectareas: 1250,
      porcentaje: 4.1,
      nivel: 'medio',
      periodoAnalisis: {
        inicio: 2019,
        fin: 2024,
      },
      tasaAnual: 250,
      serieAnual: [
        { year: 2019, area: 210 },
        { year: 2020, area: 245 },
        { year: 2021, area: 280 },
        { year: 2022, area: 235 },
        { year: 2023, area: 190 },
        { year: 2024, area: 90 },
      ],
      causas: [
        { tipo: 'Bosque → Pastizales', area: 680, porcentaje: 54.4 },
        { tipo: 'Bosque → Cultivos', area: 320, porcentaje: 25.6 },
        { tipo: 'Bosque → Urbano', area: 150, porcentaje: 12.0 },
        { tipo: 'Bosque → Suelo Desnudo', area: 100, porcentaje: 8.0 },
      ],
      alertaCritica: false,
    },
    
    carbono: {
      totalToneladas: 120500,
      co2Equivalente: 442235,
      valorUSD: 2211175,
      valorVES: 597017250,
      densidadPromedio: 4.1,
      parametros: {
        precioCO2USD: 5.0,
        tasaCambio: 270,
      },
      perdidaPorDeforestacion: {
        carbonoPerdido: 187500,
        co2ePerdido: 688125,
        valorPerdidoUSD: 3440625,
      },
    },
    
    riesgoIncendio: {
      nivel: 'medio',
      nivelNumerico: 3,
      indicePromedio: 3.2,
      focosActivos: 3,
      areaAltaRiesgo: 1200,
      ultimaDeteccion: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      factores: {
        ndwi: 0.15,
        temperaturaSuperficie: 32,
        diasSinLluvia: 15,
      },
    },
    
    riesgoInundacion: {
      nivel: 'bajo',
      nivelNumerico: 2,
      areaRiesgoHectareas: 340,
      precipitacionPromedio: 5.2,
      elevacionPromedio: 450,
      pendientePromedio: 12.5,
      metodologia: 'AHP',
      factores: {
        lluvia: 0.25,
        pendiente: 0.30,
        proximidadRios: 0.25,
        elevacion: 0.20,
      },
    },
    
    ultimaActualizacion: new Date().toISOString(),
    processingTime: 2500,
  };
}

export const geeService = {
  /**
   * Obtener métricas ambientales para un AOI
   */
  async getEnvironmentalMetrics(
    aoi: AOI,
    analysisYear: number = new Date().getFullYear() - 1,
    params?: {
      precioCO2USD?: number;
      tasaCambioVES?: number;
      anoInicioDeforestacion?: number;
    }
  ): Promise<EnvironmentalMetrics> {
    // Modo desarrollo: retornar datos simulados
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simular procesamiento
      return generateMockMetrics(aoi);
    }

    // Modo producción: llamar a Edge Function
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

  /**
   * Obtener capa de riesgo de incendios como GeoJSON
   */
  async getFireRiskLayer(aoi: AOI): Promise<GeoJSON.FeatureCollection> {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Retornar GeoJSON mock de polígonos de riesgo
      return {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [aoi.bounds?.west || -66.5, aoi.bounds?.north || 6.5],
                [aoi.bounds?.east || -66.4, aoi.bounds?.north || 6.5],
                [aoi.bounds?.east || -66.4, aoi.bounds?.south || 6.4],
                [aoi.bounds?.west || -66.5, aoi.bounds?.south || 6.4],
                [aoi.bounds?.west || -66.5, aoi.bounds?.north || 6.5],
              ]],
            },
            properties: {
              riskLevel: 'high',
              riskValue: 4.5,
            },
          },
        ],
      };
    }

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

  /**
   * Obtener capa de riesgo de inundaciones como GeoJSON
   */
  async getFloodRiskLayer(aoi: AOI): Promise<GeoJSON.FeatureCollection> {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [aoi.bounds?.west || -66.5, aoi.bounds?.north || 6.5],
                [aoi.bounds?.east || -66.45, aoi.bounds?.north || 6.5],
                [aoi.bounds?.east || -66.45, aoi.bounds?.south || 6.45],
                [aoi.bounds?.west || -66.5, aoi.bounds?.south || 6.45],
                [aoi.bounds?.west || -66.5, aoi.bounds?.north || 6.5],
              ]],
            },
            properties: {
              riskLevel: 'medium',
              riskValue: 3.0,
            },
          },
        ],
      };
    }

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
