// ============================================================================
// SERVICIO: ALERTAS (ALERTS)
// ============================================================================

import { supabase, isSupabaseConfigured, handleSupabaseError } from '@/lib/supabase';
import type { Alert } from '@/types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// ============================================================================
// DATOS MOCK - COMENTADOS PARA REFERENCIA FUTURA
// ============================================================================
/*
const MOCK_ALERTS: Alert[] = [
  {
    id: '1',
    title: 'Alerta de incendio forestal',
    type: 'FIRE',
    priority: 'HIGH',
    status: 'ACTIVE',
    location: 'Sector Las Rosas',
    coordinates: { latitude: 10.5, longitude: -66.9 },
    description: 'Incendio de gran magnitud en zona montañosa',
    affectedArea: 150,
    populationAtRisk: 2000,
    createdAt: '2024-01-15T10:00:00Z',
    acknowledged: false,
  },
  {
    id: '2',
    title: 'Riesgo de deslizamiento',
    type: 'LANDSLIDE',
    priority: 'CRITICAL',
    status: 'ACKNOWLEDGED',
    location: 'Barrio Alto',
    coordinates: { latitude: 10.6, longitude: -66.8 },
    description: 'Alto riesgo de deslizamiento por lluvias',
    affectedArea: 50,
    populationAtRisk: 500,
    createdAt: '2024-01-14T08:00:00Z',
    acknowledged: true,
    acknowledgedBy: 'user-123',
    acknowledgedAt: '2024-01-14T08:30:00Z',
  },
];
*/

export class AlertsService {
  /**
   * Obtener todas las alertas con información de usuarios (acknowledgedor y resolvedor)
   */
  static async getAll(): Promise<Alert[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data, error } = await supabase
        .from('alerts')
        .select(`
          *,
          acknowledger:acknowledged_by(id, name, email),
          resolver:resolved_by(id, name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw new Error(handleSupabaseError(error));

      return data.map(this.mapToAlert);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      throw err;
    }
  }

  /**
   * Obtener alerta por ID con información de usuarios
   */
  static async getById(id: string): Promise<Alert | null> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data, error } = await supabase
        .from('alerts')
        .select(`
          *,
          acknowledger:acknowledged_by(id, name, email),
          resolver:resolved_by(id, name, email)
        `)
        .eq('id', id)
        .single();

      if (error) throw new Error(handleSupabaseError(error));

      return data ? this.mapToAlert(data) : null;
    } catch (err) {
      console.error('Error fetching alert by ID:', err);
      throw err;
    }
  }

  /**
   * Crear nueva alerta
   * Convierte coordenadas del formato { latitude, longitude } a PostGIS POINT
   */
  static async create(alert: Omit<Alert, 'id' | 'createdAt'>): Promise<Alert> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    try {
      const insertData: Record<string, unknown> = {
        title: alert.title,
        type: alert.type,
        priority: alert.priority,
        status: alert.status || 'ACTIVE',
        location: alert.location,
        description: alert.description,
        affected_area: alert.affectedArea || null,
        population_at_risk: alert.populationAtRisk || null,
        response_actions: alert.responseActions || [],
        acknowledged: alert.acknowledged || false,
      };

      if (alert.coordinates) {
        insertData.coordinates = `POINT(${alert.coordinates.longitude} ${alert.coordinates.latitude})`;
      }

      const { data, error } = await supabase
        .from('alerts')
        .insert(insertData)
        .select(`
          *,
          acknowledger:acknowledged_by(id, name, email),
          resolver:resolved_by(id, name, email)
        `)
        .single();

      if (error) throw new Error(handleSupabaseError(error));

      return this.mapToAlert(data);
    } catch (err) {
      console.error('Error creating alert:', err);
      throw err;
    }
  }

  /**
   * Actualizar alerta
   * Convierte coordenadas del formato { latitude, longitude } a PostGIS POINT
   */
  static async update(id: string, updates: Partial<Alert>): Promise<Alert> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    try {
      const updateData: Record<string, unknown> = {};

      if (updates.title) updateData.title = updates.title;
      if (updates.type) updateData.type = updates.type;
      if (updates.priority) updateData.priority = updates.priority;
      if (updates.status) updateData.status = updates.status;
      if (updates.location) updateData.location = updates.location;
      if (updates.description) updateData.description = updates.description;
      if (updates.affectedArea !== undefined) updateData.affected_area = updates.affectedArea;
      if (updates.populationAtRisk !== undefined) updateData.population_at_risk = updates.populationAtRisk;
      if (updates.responseActions !== undefined) updateData.response_actions = updates.responseActions;

      // Actualizar coordinates si se proporcionan
      if (updates.coordinates) {
        updateData.coordinates = `POINT(${updates.coordinates.longitude} ${updates.coordinates.latitude})`;
      }

      const { data, error } = await supabase
        .from('alerts')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          acknowledger:acknowledged_by(id, name, email),
          resolver:resolved_by(id, name, email)
        `)
        .single();

      if (error) throw new Error(handleSupabaseError(error));

      return this.mapToAlert(data);
    } catch (err) {
      console.error('Error updating alert:', err);
      throw err;
    }
  }

  /**
   * Eliminar alerta
   */
  static async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    try {
      const { error } = await supabase.from('alerts').delete().eq('id', id);

      if (error) throw new Error(handleSupabaseError(error));
    } catch (err) {
      console.error('Error deleting alert:', err);
      throw err;
    }
  }

  /**
   * Reconocer alerta
   * Marca la alerta como reconocida por el usuario actual
   */
  static async acknowledge(id: string): Promise<Alert> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('alerts')
        .update({
          acknowledged: true,
          acknowledged_by: userData.user.id,
          acknowledged_at: new Date().toISOString(),
          status: 'ACKNOWLEDGED',
        })
        .eq('id', id)
        .select(`
          *,
          acknowledger:acknowledged_by(id, name, email),
          resolver:resolved_by(id, name, email)
        `)
        .single();

      if (error) throw new Error(handleSupabaseError(error));

      return this.mapToAlert(data);
    } catch (err) {
      console.error('Error acknowledging alert:', err);
      throw err;
    }
  }

  /**
   * Resolver alerta
   * Marca la alerta como resuelta por el usuario actual
   */
  static async resolve(id: string): Promise<Alert> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('alerts')
        .update({
          status: 'RESOLVED',
          resolved_at: new Date().toISOString(),
          resolved_by: userData.user.id,
        })
        .eq('id', id)
        .select(`
          *,
          acknowledger:acknowledged_by(id, name, email),
          resolver:resolved_by(id, name, email)
        `)
        .single();

      if (error) throw new Error(handleSupabaseError(error));

      return this.mapToAlert(data);
    } catch (err) {
      console.error('Error resolving alert:', err);
      throw err;
    }
  }

  /**
   * Escalar prioridad de alerta
   * Sube el nivel de prioridad: LOW -> MEDIUM -> HIGH -> CRITICAL
   */
  static async escalate(id: string): Promise<Alert> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    try {
      // Obtener alerta actual
      const { data: currentAlert, error: fetchError } = await supabase
        .from('alerts')
        .select('priority')
        .eq('id', id)
        .single();

      if (fetchError) throw new Error(handleSupabaseError(fetchError));

      // Determinar nueva prioridad
      const priorityLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      const currentIndex = priorityLevels.indexOf(currentAlert.priority as string);
      const newPriority = currentIndex < priorityLevels.length - 1
        ? priorityLevels[currentIndex + 1]
        : currentAlert.priority;

      const { data, error } = await supabase
        .from('alerts')
        .update({ priority: newPriority })
        .eq('id', id)
        .select(`
          *,
          acknowledger:acknowledged_by(id, name, email),
          resolver:resolved_by(id, name, email)
        `)
        .single();

      if (error) throw new Error(handleSupabaseError(error));

      return this.mapToAlert(data);
    } catch (err) {
      console.error('Error escalating alert:', err);
      throw err;
    }
  }

  /**
   * Suscribirse a cambios en alertas
   */
  static subscribe(callback: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void) {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, skipping subscription');
      return { unsubscribe: () => {} };
    }

    const channel = supabase
      .channel('alerts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, callback)
      .subscribe();

    return channel;
  }

  /**
   * Mapear datos de Supabase a tipo Alert
   * Convierte de formato de base de datos (snake_case) al tipo Alert (camelCase)
   * Extrae información de los joins con la tabla users
   */
  private static mapToAlert(data: Record<string, unknown>): Alert {
    const coords = data.coordinates
      ? this.parsePostGISPoint(data.coordinates)
      : undefined;

    // Extraer información del usuario que reconoció la alerta (join con users)
    const acknowledger = data.acknowledger as { id: string; name: string; email: string } | null;
    const resolver = data.resolver as { id: string; name: string; email: string } | null;

    return {
      id: data.id as string,
      title: data.title as string,
      type: data.type as Alert['type'],
      priority: data.priority as Alert['priority'],
      status: data.status as Alert['status'],
      location: data.location as string,
      coordinates: coords,
      description: data.description as string,
      affectedArea: data.affected_area as number | undefined,
      populationAtRisk: data.population_at_risk as number | undefined,
      responseActions: (data.response_actions as string[]) || [],
      createdAt: data.created_at as string,
      acknowledged: data.acknowledged as boolean,
      acknowledgedBy: data.acknowledged_by as string | undefined,
      acknowledgedAt: data.acknowledged_at as string | undefined,
      resolvedAt: data.resolved_at as string | undefined,
      resolvedBy: data.resolved_by as string | undefined,
    };
  }

  /**
   * Parsear coordenadas PostGIS POINT a formato usado en el frontend
   * Soporta tanto formato WKT (POINT(lng lat)) como GeoJSON
   */
  private static parsePostGISPoint(point: unknown): { latitude: number; longitude: number } | undefined {
    if (!point) return undefined;

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

    return undefined;
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