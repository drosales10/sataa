// ============================================================================
// SERVICIO: AMENAZAS (THREATS)
// ============================================================================

import { supabase, isSupabaseConfigured, handleSupabaseError } from '@/lib/supabase';
import type { Threat } from '@/types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// ============================================================================
// DATOS MOCK - COMENTADOS PARA REFERENCIA FUTURA
// ============================================================================
// Los datos mock originales se encuentran en src/data/mockThreats.ts
// Este servicio ahora usa Supabase exclusivamente

export class ThreatsService {
  /**
   * Obtener todas las amenazas con información de usuarios (reportador y verificador)
   */
  static async getAll(): Promise<Threat[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data, error } = await supabase
        .from('threats')
        .select(`
          *,
          reporter:reported_by(id, name, email),
          verifier:verified_by(id, name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw new Error(handleSupabaseError(error));

      return data.map(this.mapToThreat);
    } catch (err) {
      console.error('Error fetching threats:', err);
      throw err;
    }
  }

  /**
   * Obtener amenaza por ID con información de usuarios
   */
  static async getById(id: string): Promise<Threat | null> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data, error } = await supabase
        .from('threats')
        .select(`
          *,
          reporter:reported_by(id, name, email),
          verifier:verified_by(id, name, email)
        `)
        .eq('id', id)
        .single();

      if (error) throw new Error(handleSupabaseError(error));

      return data ? this.mapToThreat(data) : null;
    } catch (err) {
      console.error('Error fetching threat by ID:', err);
      throw err;
    }
  }

  /**
   * Crear nueva amenaza
   * Convierte coordenadas del formato { latitude, longitude } a PostGIS POINT
   */
  static async create(threat: Omit<Threat, 'id' | 'reportedAt' | 'updatedAt'>): Promise<Threat> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      // Convertir coordenadas a formato PostGIS usando ST_SetSRID y ST_MakePoint
      const coordinates = threat.location
        ? `POINT(${threat.location.longitude} ${threat.location.latitude})`
        : null;

      const insertData: Record<string, unknown> = {
        type: threat.type,
        severity: threat.severity,
        status: threat.status || 'PENDING',
        location: threat.location?.address || '',
        coordinates: coordinates,
        description: threat.description,
        reported_by: userData.user.id,
        images: threat.images || [],
        environmental_impacts: threat.environmentalImpacts || [],
        social_impacts: threat.socialImpacts || [],
        involved_actors: threat.involvedActors || [],
      };

      const { data, error } = await supabase
        .from('threats')
        .insert(insertData)
        .select(`
          *,
          reporter:reported_by(id, name, email),
          verifier:verified_by(id, name, email)
        `)
        .single();

      if (error) throw new Error(handleSupabaseError(error));

      return this.mapToThreat(data);
    } catch (err) {
      console.error('Error creating threat:', err);
      throw err;
    }
  }

  /**
   * Actualizar amenaza
   * Convierte coordenadas del formato { latitude, longitude } a PostGIS POINT
   */
  static async update(id: string, updates: Partial<Threat>): Promise<Threat> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    try {
      const updateData: Record<string, unknown> = {};

      if (updates.type) updateData.type = updates.type;
      if (updates.severity) updateData.severity = updates.severity;
      if (updates.status) updateData.status = updates.status;
      if (updates.description) updateData.description = updates.description;
      if (updates.images) updateData.images = updates.images;
      if (updates.environmentalImpacts !== undefined) updateData.environmental_impacts = updates.environmentalImpacts;
      if (updates.socialImpacts !== undefined) updateData.social_impacts = updates.socialImpacts;
      if (updates.involvedActors !== undefined) updateData.involved_actors = updates.involvedActors;

      // Actualizar location y coordinates si se proporciona location
      if (updates.location) {
        if (updates.location.address) {
          updateData.location = updates.location.address;
        }
        // Convertir coordenadas a formato PostGIS
        updateData.coordinates = `POINT(${updates.location.longitude} ${updates.location.latitude})`;
      }

      const { data, error } = await supabase
        .from('threats')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          reporter:reported_by(id, name, email),
          verifier:verified_by(id, name, email)
        `)
        .single();

      if (error) throw new Error(handleSupabaseError(error));

      return this.mapToThreat(data);
    } catch (err) {
      console.error('Error updating threat:', err);
      throw err;
    }
  }

  /**
   * Eliminar amenaza
   */
  static async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    try {
      const { error } = await supabase.from('threats').delete().eq('id', id);

      if (error) throw new Error(handleSupabaseError(error));
    } catch (err) {
      console.error('Error deleting threat:', err);
      throw err;
    }
  }

  /**
   * Buscar amenazas cercanas a un punto
   */
  static async getNearby(lat: number, lng: number, radiusKm: number = 10): Promise<Threat[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase.rpc('nearby_threats', {
      lat,
      lng,
      radius_km: radiusKm,
    });

    if (error) throw new Error(handleSupabaseError(error));

    return data || [];
  }

  /**
   * Buscar amenazas en un área rectangular
   */
  static async getInArea(
    minLat: number,
    minLng: number,
    maxLat: number,
    maxLng: number
  ): Promise<Threat[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase.rpc('threats_in_area', {
      min_lat: minLat,
      min_lng: minLng,
      max_lat: maxLat,
      max_lng: maxLng,
    });

    if (error) throw new Error(handleSupabaseError(error));

    return data || [];
  }

  /**
   * Suscribirse a cambios en amenazas
   */
  static subscribe(callback: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void) {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, skipping subscription');
      return { unsubscribe: () => {} };
    }

    const channel = supabase
      .channel('threats_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'threats' }, callback)
      .subscribe();

    return channel;
  }

  /**
   * Mapear datos de Supabase a tipo Threat
   * Convierte de formato de base de datos (snake_case) al tipo Threat (camelCase)
   * Extrae información de los joins con la tabla users
   */
  private static mapToThreat(data: Record<string, unknown>): Threat {
    // Extraer coordenadas del formato PostGIS a { latitude, longitude }
    const coords = data.coordinates
      ? this.parsePostGISPoint(data.coordinates)
      : { latitude: 0, longitude: 0, accuracy: 0 };

    // Extraer información del reportador (join con users)
    const reporter = data.reporter as { id: string; name: string; email: string } | null;
    const verifier = data.verifier as { id: string; name: string; email: string } | null;

    return {
      id: data.id as string,
      monitorId: reporter?.id || data.reported_by as string,
      monitorName: reporter?.name || 'Usuario desconocido',
      type: data.type as Threat['type'],
      severity: data.severity as Threat['severity'],
      status: data.status as Threat['status'],
      location: {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        address: data.location as string,
      },
      description: data.description as string,
      reportedAt: data.created_at as string,
      updatedAt: data.updated_at as string,
      images: (data.images as string[]) || [],
      environmentalImpacts: (data.environmental_impacts as string[]) || [],
      socialImpacts: (data.social_impacts as string[]) || [],
      involvedActors: (data.involved_actors as string[]) || [],
    };
  }

  /**
   * Parsear coordenadas PostGIS POINT a formato usado en el frontend
   * Soporta tanto formato WKT (POINT(lng lat)) como GeoJSON
   */
  private static parsePostGISPoint(point: unknown): { latitude: number; longitude: number; accuracy?: number } {
    if (typeof point === 'string') {
      // Formato WKT: "POINT(lng lat)"
      const match = point.match(/POINT\(([^ ]+) ([^ ]+)\)/);
      if (match) {
        return {
          longitude: parseFloat(match[1]),
          latitude: parseFloat(match[2]),
        };
      }
    } else if (point && typeof point === 'object' && 'coordinates' in point) {
      // Formato GeoJSON: { type: "Point", coordinates: [lng, lat] }
      const geoJson = point as { coordinates: number[] };
      return {
        longitude: geoJson.coordinates[0],
        latitude: geoJson.coordinates[1],
      };
    }

    return { latitude: 0, longitude: 0 };
  }

  /**
   * Convertir coordenadas del formato frontend a PostGIS POINT
   * Usa ST_SetSRID(ST_MakePoint(lng, lat), 4326) para crear geometría válida
   */
  private static toPostGISPoint(latitude: number, longitude: number): string {
    // PostGIS espera formato: POINT(longitude latitude)
    // El SRID 4326 corresponde a WGS84 (sistema de coordenadas GPS)
    return `POINT(${longitude} ${latitude})`;
  }
}