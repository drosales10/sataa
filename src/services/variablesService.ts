// ============================================================================
// SERVICIO: VARIABLES AMBIENTALES (ENVIRONMENTAL VARIABLES)
// ============================================================================

import { supabase, isSupabaseConfigured, handleSupabaseError } from '@/lib/supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { EnvironmentalVariable } from '@/types';

export interface EnvironmentalData {
  id: string;
  variableType: string;
  value: number;
  unit: string;
  location: string;
  coordinates: { latitude: number; longitude: number };
  recordedAt: string;
  sensorId?: string;
  qualityFlag?: string;
  metadata?: Record<string, string | number | boolean>;
}

export class VariablesService {
  /**
   * Obtener todas las variables ambientales
   * @returns Array de datos ambientales ordenados por fecha
   */
  static async getAllVariables(): Promise<EnvironmentalData[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('environmental_variables')
      .select('*')
      .order('measured_at', { ascending: false });

    if (error) throw new Error(handleSupabaseError(error));

    return data.map(this.mapToEnvironmentalData);
  }

  /**
   * Obtener variables por tipo específico
   * @param type - Tipo de variable ambiental
   * @returns Array de datos filtrados por tipo
   */
  static async getVariablesByType(type: string): Promise<EnvironmentalData[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('environmental_variables')
      .select('*')
      .eq('variable_type', type)
      .order('measured_at', { ascending: false });

    if (error) throw new Error(handleSupabaseError(error));

    return data.map(this.mapToEnvironmentalData);
  }

  /**
   * Obtener variable específica por ID
   * @param id - UUID de la variable
   * @returns Datos de la variable específica
   */
  static async getVariableById(id: string): Promise<EnvironmentalData | null> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('environmental_variables')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No encontrado
      throw new Error(handleSupabaseError(error));
    }

    return this.mapToEnvironmentalData(data);
  }

  /**
   * Obtener datos ambientales con filtros opcionales
   * @param filters - Filtros opcionales para la consulta
   * @returns Array de datos filtrados
   */
  static async getAll(filters?: {
    variableType?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
  }): Promise<EnvironmentalData[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    let query = supabase
      .from('environmental_variables')
      .select('*')
      .order('measured_at', { ascending: false });

    if (filters?.variableType) {
      query = query.eq('variable_type', filters.variableType);
    }

    if (filters?.startDate) {
      query = query.gte('measured_at', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('measured_at', filters.endDate);
    }

    if (filters?.location) {
      query = query.eq('location', filters.location);
    }

    const { data, error } = await query;

    if (error) throw new Error(handleSupabaseError(error));

    return data.map(this.mapToEnvironmentalData);
  }

  /**
   * Obtener serie temporal para una variable específica con filtros opcionales
   * @param variableType - Tipo de variable ambiental
   * @param options - Opciones de filtrado (fechas, ubicación)
   * @returns Array de datos ordenados cronológicamente (ascendente)
   */
  static async getVariablesTimeSeries(
    variableType: string,
    options?: {
      location?: string;
      startDate?: string;
      endDate?: string;
      sensorId?: string;
    }
  ): Promise<EnvironmentalData[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    let query = supabase
      .from('environmental_variables')
      .select('*')
      .eq('variable_type', variableType)
      .order('measured_at', { ascending: true });

    if (options?.location) {
      query = query.eq('location', options.location);
    }

    if (options?.startDate) {
      query = query.gte('measured_at', options.startDate);
    }

    if (options?.endDate) {
      query = query.lte('measured_at', options.endDate);
    }

    if (options?.sensorId) {
      query = query.eq('sensor_id', options.sensorId);
    }

    const { data, error } = await query;

    if (error) throw new Error(handleSupabaseError(error));

    return data.map(this.mapToEnvironmentalData);
  }

  /**
   * Obtener serie temporal para una variable en una ubicación específica
   * @deprecated Use getVariablesTimeSeries instead
   */
  static async getTimeSeries(
    variableType: string,
    location: string,
    startDate: string,
    endDate: string
  ): Promise<EnvironmentalData[]> {
    return this.getVariablesTimeSeries(variableType, {
      location,
      startDate,
      endDate,
    });
  }

  /**
   * Obtener la última medición de cada tipo de variable
   * @param types - Array opcional de tipos de variables a consultar
   * @returns Array con la última medición de cada tipo
   */
  static async getLatestByType(types?: string[]): Promise<EnvironmentalData[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    // Obtener todos los tipos únicos o usar los proporcionados
    let variableTypes: string[] = types || [];

    if (!types || types.length === 0) {
      const { data: typesData, error: typesError } = await supabase
        .from('environmental_variables')
        .select('variable_type')
        .order('variable_type');

      if (typesError) throw new Error(handleSupabaseError(typesError));

      // Obtener tipos únicos
      const uniqueTypes = new Set(typesData.map((d) => d.variable_type));
      variableTypes = Array.from(uniqueTypes);
    }

    // Obtener la última medición para cada tipo
    const promises = variableTypes.map(async (type) => {
      const { data, error } = await supabase
        .from('environmental_variables')
        .select('*')
        .eq('variable_type', type)
        .order('measured_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(handleSupabaseError(error));
      }

      return data ? this.mapToEnvironmentalData(data) : null;
    });

    const results = await Promise.all(promises);
    return results.filter((r): r is EnvironmentalData => r !== null);
  }

  /**
   * Obtener variables cerca de una ubicación específica usando PostGIS
   * @param latitude - Latitud de referencia
   * @param longitude - Longitud de referencia
   * @param radiusKm - Radio de búsqueda en kilómetros (default: 10km)
   * @param variableType - Tipo de variable opcional para filtrar
   * @returns Array de variables dentro del radio especificado
   */
  static async getVariablesByLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    variableType?: string
  ): Promise<EnvironmentalData[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    // Crear punto de referencia en formato WKT (Well-Known Text)
    const referencePoint = `POINT(${longitude} ${latitude})`;

    // Construir query con función PostGIS ST_DWithin
    // ST_DWithin usa metros en geography, por eso multiplicamos por 1000
    const query = supabase.rpc('get_variables_near_location', {
      ref_point: referencePoint,
      radius_meters: radiusKm * 1000,
      var_type: variableType || null,
    });

    const { data, error } = await query;

    if (error) {
      // Si la función RPC no existe, usar alternativa con filtrado en cliente
      console.warn('RPC function not available, using alternative method:', error.message);
      return this.getVariablesByLocationFallback(latitude, longitude, radiusKm, variableType);
    }

    return data.map(this.mapToEnvironmentalData);
  }

  /**
   * Método alternativo para obtener variables por ubicación sin RPC
   * @private
   */
  private static async getVariablesByLocationFallback(
    latitude: number,
    longitude: number,
    radiusKm: number,
    variableType?: string
  ): Promise<EnvironmentalData[]> {
    let query = supabase.from('environmental_variables').select('*');

    if (variableType) {
      query = query.eq('variable_type', variableType);
    }

    const { data, error } = await query;

    if (error) throw new Error(handleSupabaseError(error));

    // Filtrar por distancia en el cliente usando fórmula de Haversine
    const filtered = data.filter((record) => {
      const coords = this.parsePostGISPoint(record.coordinates);
      const distance = this.calculateDistance(
        latitude,
        longitude,
        coords.latitude,
        coords.longitude
      );
      return distance <= radiusKm;
    });

    return filtered.map(this.mapToEnvironmentalData);
  }

  /**
   * Calcular distancia entre dos puntos usando fórmula de Haversine
   * @private
   */
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convertir grados a radianes
   * @private
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Crear nuevo registro de variable ambiental
   * @param data - Datos de la variable sin ID ni timestamp
   * @returns Variable creada con ID y timestamp
   */
  static async createVariable(
    data: Omit<EnvironmentalData, 'id' | 'recordedAt'>
  ): Promise<EnvironmentalData> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const insertData = {
      variable_type: data.variableType,
      value: data.value,
      unit: data.unit,
      location: data.location,
      coordinates: this.toPostGISPoint(data.coordinates.longitude, data.coordinates.latitude),
      sensor_id: data.sensorId || null,
      quality_flag: data.qualityFlag || null,
      metadata: data.metadata || null,
    };

    const { data: result, error } = await supabase
      .from('environmental_variables')
      .insert(insertData)
      .select()
      .single();

    if (error) throw new Error(handleSupabaseError(error));

    return this.mapToEnvironmentalData(result);
  }

  /**
   * Alias para createVariable (mantiene compatibilidad)
   */
  static async create(
    data: Omit<EnvironmentalData, 'id' | 'recordedAt'>
  ): Promise<EnvironmentalData> {
    return this.createVariable(data);
  }

  /**
   * Crear múltiples registros (batch insert)
   * @param dataArray - Array de datos sin ID ni timestamp
   * @returns Array de variables creadas
   */
  static async createBatch(
    dataArray: Omit<EnvironmentalData, 'id' | 'recordedAt'>[]
  ): Promise<EnvironmentalData[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const insertData = dataArray.map((item) => ({
      variable_type: item.variableType,
      value: item.value,
      unit: item.unit,
      location: item.location,
      coordinates: this.toPostGISPoint(item.coordinates.longitude, item.coordinates.latitude),
      sensor_id: item.sensorId || null,
      quality_flag: item.qualityFlag || null,
      metadata: item.metadata || null,
    }));

    const { data, error } = await supabase
      .from('environmental_variables')
      .insert(insertData)
      .select();

    if (error) throw new Error(handleSupabaseError(error));

    return data.map(this.mapToEnvironmentalData);
  }

  /**
   * Actualizar una variable existente
   * @param id - UUID de la variable
   * @param updates - Campos a actualizar
   * @returns Variable actualizada
   */
  static async updateVariable(
    id: string,
    updates: Partial<Omit<EnvironmentalData, 'id' | 'recordedAt'>>
  ): Promise<EnvironmentalData> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const updateData: Record<string, unknown> = {};

    if (updates.variableType) updateData.variable_type = updates.variableType;
    if (updates.value !== undefined) updateData.value = updates.value;
    if (updates.unit) updateData.unit = updates.unit;
    if (updates.location) updateData.location = updates.location;
    if (updates.coordinates) {
      updateData.coordinates = this.toPostGISPoint(
        updates.coordinates.longitude,
        updates.coordinates.latitude
      );
    }
    if (updates.sensorId !== undefined) updateData.sensor_id = updates.sensorId;
    if (updates.qualityFlag !== undefined) updateData.quality_flag = updates.qualityFlag;
    if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

    const { data, error } = await supabase
      .from('environmental_variables')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(handleSupabaseError(error));

    return this.mapToEnvironmentalData(data);
  }

  /**
   * Eliminar una variable
   * @param id - UUID de la variable
   * @returns True si fue eliminada exitosamente
   */
  static async deleteVariable(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('environmental_variables')
      .delete()
      .eq('id', id);

    if (error) throw new Error(handleSupabaseError(error));

    return true;
  }

  /**
   * Obtener estadísticas agregadas de una variable
   * @param variableType - Tipo de variable
   * @param location - Ubicación opcional
   * @param startDate - Fecha de inicio opcional
   * @param endDate - Fecha de fin opcional
   * @returns Estadísticas (promedio, min, max, count)
   */
  static async getStatistics(
    variableType: string,
    location?: string,
    startDate?: string,
    endDate?: string
  ): Promise<{
    avg: number;
    min: number;
    max: number;
    count: number;
  }> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    let query = supabase
      .from('environmental_variables')
      .select('value')
      .eq('variable_type', variableType);

    if (location) {
      query = query.eq('location', location);
    }

    if (startDate) {
      query = query.gte('measured_at', startDate);
    }

    if (endDate) {
      query = query.lte('measured_at', endDate);
    }

    const { data, error } = await query;

    if (error) throw new Error(handleSupabaseError(error));

    if (!data || data.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 };
    }

    const values = data.map((d) => d.value as number);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    };
  }

  /**
   * Suscribirse a cambios en tiempo real de variables ambientales
   * @param callback - Función a ejecutar cuando hay cambios
   * @returns Canal de suscripción
   */
  static subscribe(
    callback: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
  ) {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, skipping subscription');
      return { unsubscribe: () => {} };
    }

    const channel = supabase
      .channel('environmental_variables_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'environmental_variables' },
        callback
      )
      .subscribe();

    return channel;
  }

  /**
   * Mapear datos de Supabase al tipo EnvironmentalData
   * @private
   */
  private static mapToEnvironmentalData(data: Record<string, unknown>): EnvironmentalData {
    const coords = data.coordinates
      ? this.parsePostGISPoint(data.coordinates)
      : { latitude: 0, longitude: 0 };

    return {
      id: data.id as string,
      variableType: data.variable_type as string,
      value: data.value as number,
      unit: data.unit as string,
      location: data.location as string,
      coordinates: coords,
      recordedAt: (data.measured_at || data.recorded_at) as string,
      sensorId: data.sensor_id as string | undefined,
      qualityFlag: data.quality_flag as string | undefined,
      metadata: data.metadata as Record<string, string | number | boolean> | undefined,
    };
  }

  /**
   * Parsear coordenadas PostGIS POINT a objeto latitude/longitude
   * Soporta múltiples formatos de PostGIS
   * @private
   */
  private static parsePostGISPoint(point: unknown): { latitude: number; longitude: number } {
    // Formato string: "POINT(lng lat)"
    if (typeof point === 'string') {
      const match = point.match(/POINT\(([^ ]+) ([^ ]+)\)/);
      if (match) {
        return {
          longitude: parseFloat(match[1]),
          latitude: parseFloat(match[2]),
        };
      }
    }
    // Formato objeto GeoJSON: { type: "Point", coordinates: [lng, lat] }
    else if (point && typeof point === 'object') {
      if ('coordinates' in point) {
        const coords = point as { coordinates: number[] };
        return {
          longitude: coords.coordinates[0],
          latitude: coords.coordinates[1],
        };
      }
      // Formato objeto con type: { type: "Point", coordinates: [lng, lat] }
      if ('type' in point && (point as { type: string }).type === 'Point') {
        const geoPoint = point as { type: string; coordinates: number[] };
        return {
          longitude: geoPoint.coordinates[0],
          latitude: geoPoint.coordinates[1],
        };
      }
    }

    return { latitude: 0, longitude: 0 };
  }

  /**
   * Convertir coordenadas a formato PostGIS POINT
   * @private
   */
  private static toPostGISPoint(longitude: number, latitude: number): string {
    return `POINT(${longitude} ${latitude})`;
  }
}

// ============================================================================
// DATOS MOCK (COMENTADOS PARA REFERENCIA FUTURA)
// ============================================================================

/*
// Mock data para desarrollo sin conexión a Supabase
const MOCK_VARIABLES: EnvironmentalData[] = [
  {
    id: '1',
    variableType: 'TEMPERATURE',
    value: 25.5,
    unit: '°C',
    location: 'Waraira Repano',
    coordinates: { latitude: 10.5417, longitude: -66.8806 },
    recordedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    sensorId: 'SENSOR_001',
    qualityFlag: 'GOOD',
    metadata: {
      source: 'automatic',
      calibrationDate: '2024-01-15',
    },
  },
  {
    id: '2',
    variableType: 'HUMIDITY',
    value: 75,
    unit: '%',
    location: 'Waraira Repano',
    coordinates: { latitude: 10.5417, longitude: -66.8806 },
    recordedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    sensorId: 'SENSOR_001',
    qualityFlag: 'GOOD',
  },
  {
    id: '3',
    variableType: 'WATER_LEVEL',
    value: 2.3,
    unit: 'm',
    location: 'Río Guaire',
    coordinates: { latitude: 10.4889, longitude: -66.8792 },
    recordedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    sensorId: 'SENSOR_002',
    qualityFlag: 'GOOD',
  },
  {
    id: '4',
    variableType: 'PRECIPITATION',
    value: 15.2,
    unit: 'mm',
    location: 'Waraira Repano',
    coordinates: { latitude: 10.5417, longitude: -66.8806 },
    recordedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    sensorId: 'SENSOR_003',
    qualityFlag: 'GOOD',
  },
  {
    id: '5',
    variableType: 'NDVI',
    value: 0.72,
    unit: 'index',
    location: 'Parque Nacional',
    coordinates: { latitude: 10.5350, longitude: -66.8950 },
    recordedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    sensorId: 'SATELLITE_001',
    qualityFlag: 'EXCELLENT',
    metadata: {
      satellite: 'Sentinel-2',
      cloudCover: 5,
    },
  },
];

// Función mock para getAllVariables
export const getAllVariablesMock = async (): Promise<EnvironmentalData[]> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return [...MOCK_VARIABLES];
};

// Función mock para getVariablesByType
export const getVariablesByTypeMock = async (type: string): Promise<EnvironmentalData[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_VARIABLES.filter((v) => v.variableType === type);
};

// Función mock para getVariableById
export const getVariableByIdMock = async (id: string): Promise<EnvironmentalData | null> => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return MOCK_VARIABLES.find((v) => v.id === id) || null;
};

// Función mock para getVariablesTimeSeries
export const getVariablesTimeSeriesMock = async (
  variableType: string,
  options?: { location?: string; startDate?: string; endDate?: string }
): Promise<EnvironmentalData[]> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  
  let filtered = MOCK_VARIABLES.filter((v) => v.variableType === variableType);
  
  if (options?.location) {
    filtered = filtered.filter((v) => v.location === options.location);
  }
  
  if (options?.startDate) {
    filtered = filtered.filter((v) => v.recordedAt >= options.startDate!);
  }
  
  if (options?.endDate) {
    filtered = filtered.filter((v) => v.recordedAt <= options.endDate!);
  }
  
  return filtered.sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
};

// Función mock para createVariable
export const createVariableMock = async (
  data: Omit<EnvironmentalData, 'id' | 'recordedAt'>
): Promise<EnvironmentalData> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  const newVariable: EnvironmentalData = {
    ...data,
    id: `mock_${Date.now()}`,
    recordedAt: new Date().toISOString(),
  };
  
  MOCK_VARIABLES.unshift(newVariable);
  return newVariable;
};

// Función mock para getLatestByType
export const getLatestByTypeMock = async (types?: string[]): Promise<EnvironmentalData[]> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  
  const uniqueTypes = types || [...new Set(MOCK_VARIABLES.map((v) => v.variableType))];
  
  return uniqueTypes
    .map((type) => {
      const vars = MOCK_VARIABLES.filter((v) => v.variableType === type);
      return vars.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0];
    })
    .filter(Boolean);
};

// Función mock para getVariablesByLocation
export const getVariablesByLocationMock = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 10,
  variableType?: string
): Promise<EnvironmentalData[]> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  
  // Implementación simplificada - en producción usaría cálculo de distancia real
  let filtered = MOCK_VARIABLES;
  
  if (variableType) {
    filtered = filtered.filter((v) => v.variableType === variableType);
  }
  
  return filtered;
};
*/
