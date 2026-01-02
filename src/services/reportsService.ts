// ============================================================================
// SERVICIO: REPORTES COMUNITARIOS (COMMUNITY REPORTS)
// ============================================================================

import { supabase, isSupabaseConfigured, handleSupabaseError } from '@/lib/supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

export interface CommunityReport {
  id: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  description: string;
  location: string;
  coordinates: { latitude: number; longitude: number };
  reporterName: string;
  reporterEmail?: string;
  reporterPhone?: string;
  community?: string;
  attachments: string[];
  adminNotes?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedByEmail?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// DATOS MOCK - COMENTADOS PARA REFERENCIA FUTURA
// ============================================================================
/*
const MOCK_REPORTS: CommunityReport[] = [
  {
    id: '1',
    title: 'Incendio Forestal en Sector Norte',
    type: 'FOREST_FIRE',
    priority: 'HIGH',
    status: 'PENDING',
    description: 'Se observa humo denso en la zona montañosa del sector norte',
    location: 'Waraira Repano, Sector Norte',
    coordinates: { latitude: 10.5, longitude: -66.9 },
    reporterName: 'Juan Pérez',
    reporterEmail: 'juan.perez@example.com',
    reporterPhone: '+58 412-1234567',
    community: 'El Hatillo',
    attachments: ['https://example.com/image1.jpg'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    title: 'Minería Ilegal Detectada',
    type: 'ILLEGAL_MINING',
    priority: 'CRITICAL',
    status: 'IN_REVIEW',
    description: 'Actividad sospechosa de minería ilegal en zona protegida',
    location: 'Sector Las Minas',
    coordinates: { latitude: 10.6, longitude: -66.8 },
    reporterName: 'María González',
    reporterEmail: 'maria.gonzalez@example.com',
    community: 'Petare',
    attachments: [],
    reviewedBy: 'user-123',
    reviewedByName: 'Admin User',
    reviewedAt: '2024-01-16T09:00:00Z',
    adminNotes: 'En proceso de verificación',
    createdAt: '2024-01-14T08:00:00Z',
    updatedAt: '2024-01-16T09:00:00Z',
  },
];
*/

// ============================================================================
// SERVICIO DE REPORTES
// ============================================================================

export class ReportsService {
  /**
   * Obtener todos los reportes con información de quien los revisó (JOIN con users)
   */
  static async getAll(): Promise<CommunityReport[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data, error } = await supabase
        .from('community_reports')
        .select(`
          *,
          reviewer:reviewed_by(id, name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw new Error(handleSupabaseError(error));

      return data.map(this.mapToReport);
    } catch (err) {
      console.error('Error fetching community reports:', err);
      throw err;
    }
  }

  /**
   * Obtener reporte por ID con información de quien lo revisó
   */
  static async getById(id: string): Promise<CommunityReport | null> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data, error } = await supabase
        .from('community_reports')
        .select(`
          *,
          reviewer:reviewed_by(id, name, email)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found error
          return null;
        }
        throw new Error(handleSupabaseError(error));
      }

      return data ? this.mapToReport(data) : null;
    } catch (err) {
      console.error('Error fetching report by ID:', err);
      throw err;
    }
  }

  /**
   * Crear nuevo reporte comunitario
   * Convierte coordenadas del formato { latitude, longitude } a PostGIS POINT
   */
  static async create(
    report: Omit<CommunityReport, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'reviewedBy' | 'reviewedByName' | 'reviewedByEmail' | 'reviewedAt'>
  ): Promise<CommunityReport> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    try {
      const insertData: Record<string, unknown> = {
        title: report.title,
        type: report.type,
        priority: report.priority || 'MEDIUM',
        status: 'PENDING', // Estado inicial
        description: report.description,
        location: report.location,
        reporter_name: report.reporterName,
        reporter_email: report.reporterEmail || null,
        reporter_phone: report.reporterPhone || null,
        community: report.community || null,
        attachments: report.attachments || [],
        admin_notes: report.adminNotes || null,
      };

      // Convertir coordenadas a PostGIS POINT
      if (report.coordinates) {
        insertData.coordinates = this.toPostGISPoint(
          report.coordinates.latitude,
          report.coordinates.longitude
        );
      }

      const { data, error } = await supabase
        .from('community_reports')
        .insert(insertData)
        .select(`
          *,
          reviewer:reviewed_by(id, name, email)
        `)
        .single();

      if (error) throw new Error(handleSupabaseError(error));

      return this.mapToReport(data);
    } catch (err) {
      console.error('Error creating report:', err);
      throw err;
    }
  }

  /**
   * Actualizar estado del reporte
   */
  static async updateStatus(
    id: string,
    status: string,
    adminNotes?: string
  ): Promise<CommunityReport> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    try {
      const updateData: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (adminNotes) {
        updateData.admin_notes = adminNotes;
      }

      const { data, error } = await supabase
        .from('community_reports')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          reviewer:reviewed_by(id, name, email)
        `)
        .single();

      if (error) throw new Error(handleSupabaseError(error));

      return this.mapToReport(data);
    } catch (err) {
      console.error('Error updating report status:', err);
      throw err;
    }
  }

  /**
   * Marcar reporte como EN REVISIÓN y asignar revisor
   */
  static async reviewReport(id: string, adminNotes?: string): Promise<CommunityReport> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    try {
      // Obtener usuario actual
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const updateData: Record<string, unknown> = {
        status: 'IN_REVIEW',
        reviewed_by: userData.user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (adminNotes) {
        updateData.admin_notes = adminNotes;
      }

      const { data, error } = await supabase
        .from('community_reports')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          reviewer:reviewed_by(id, name, email)
        `)
        .single();

      if (error) throw new Error(handleSupabaseError(error));

      return this.mapToReport(data);
    } catch (err) {
      console.error('Error reviewing report:', err);
      throw err;
    }
  }

  /**
   * Marcar reporte como VERIFICADO
   */
  static async verifyReport(id: string, adminNotes?: string): Promise<CommunityReport> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    try {
      // Obtener usuario actual
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const updateData: Record<string, unknown> = {
        status: 'VERIFIED',
        reviewed_by: userData.user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (adminNotes) {
        updateData.admin_notes = adminNotes;
      }

      const { data, error } = await supabase
        .from('community_reports')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          reviewer:reviewed_by(id, name, email)
        `)
        .single();

      if (error) throw new Error(handleSupabaseError(error));

      return this.mapToReport(data);
    } catch (err) {
      console.error('Error verifying report:', err);
      throw err;
    }
  }

  /**
   * Marcar reporte como RECHAZADO con notas administrativas
   */
  static async rejectReport(id: string, adminNotes: string): Promise<CommunityReport> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    try {
      // Obtener usuario actual
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const updateData: Record<string, unknown> = {
        status: 'REJECTED',
        reviewed_by: userData.user.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: adminNotes,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('community_reports')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          reviewer:reviewed_by(id, name, email)
        `)
        .single();

      if (error) throw new Error(handleSupabaseError(error));

      return this.mapToReport(data);
    } catch (err) {
      console.error('Error rejecting report:', err);
      throw err;
    }
  }

  /**
   * Actualizar reporte (campos generales)
   */
  static async update(
    id: string,
    updates: Partial<CommunityReport>
  ): Promise<CommunityReport> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      // Mapear campos opcionales
      if (updates.title) updateData.title = updates.title;
      if (updates.type) updateData.type = updates.type;
      if (updates.priority) updateData.priority = updates.priority;
      if (updates.description) updateData.description = updates.description;
      if (updates.location) updateData.location = updates.location;
      if (updates.reporterName) updateData.reporter_name = updates.reporterName;
      if (updates.reporterEmail !== undefined) updateData.reporter_email = updates.reporterEmail;
      if (updates.reporterPhone !== undefined) updateData.reporter_phone = updates.reporterPhone;
      if (updates.community !== undefined) updateData.community = updates.community;
      if (updates.attachments !== undefined) updateData.attachments = updates.attachments;
      if (updates.adminNotes !== undefined) updateData.admin_notes = updates.adminNotes;

      // Actualizar coordenadas si se proporcionan
      if (updates.coordinates) {
        updateData.coordinates = this.toPostGISPoint(
          updates.coordinates.latitude,
          updates.coordinates.longitude
        );
      }

      const { data, error } = await supabase
        .from('community_reports')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          reviewer:reviewed_by(id, name, email)
        `)
        .single();

      if (error) throw new Error(handleSupabaseError(error));

      return this.mapToReport(data);
    } catch (err) {
      console.error('Error updating report:', err);
      throw err;
    }
  }

  /**
   * Eliminar reporte
   */
  static async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    try {
      const { error } = await supabase
        .from('community_reports')
        .delete()
        .eq('id', id);

      if (error) throw new Error(handleSupabaseError(error));
    } catch (err) {
      console.error('Error deleting report:', err);
      throw err;
    }
  }

  /**
   * Subir archivo adjunto al Supabase Storage (bucket 'attachments')
   */
  static async uploadAttachment(file: File, reportId: string): Promise<string> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `reports/${reportId}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw new Error(handleSupabaseError(error));

      // Obtener URL pública del archivo
      const { data: urlData } = supabase.storage
        .from('attachments')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (err) {
      console.error('Error uploading attachment:', err);
      throw err;
    }
  }

  /**
   * Eliminar archivo adjunto del Supabase Storage
   */
  static async deleteAttachment(filePath: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    try {
      // Extraer el path relativo del URL público
      const path = filePath.split('/attachments/').pop();
      if (!path) throw new Error('Invalid file path');

      const { error } = await supabase.storage
        .from('attachments')
        .remove([path]);

      if (error) throw new Error(handleSupabaseError(error));
    } catch (err) {
      console.error('Error deleting attachment:', err);
      throw err;
    }
  }

  /**
   * Suscribirse a cambios en reportes comunitarios (Realtime)
   */
  static subscribe(
    callback: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
  ) {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, skipping subscription');
      return { unsubscribe: () => {} };
    }

    const channel = supabase
      .channel('community_reports_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_reports' },
        callback
      )
      .subscribe();

    return channel;
  }

  /**
   * Mapear datos de Supabase a tipo CommunityReport
   * Convierte de formato de base de datos (snake_case) al tipo CommunityReport (camelCase)
   * Extrae información del join con la tabla users para el revisor
   */
  private static mapToReport(data: Record<string, unknown>): CommunityReport {
    const coords = data.coordinates
      ? this.parsePostGISPoint(data.coordinates)
      : { latitude: 0, longitude: 0 };

    // Extraer información del usuario que revisó el reporte (join con users)
    const reviewer = data.reviewer as { id: string; name: string; email: string } | null;

    return {
      id: data.id as string,
      title: data.title as string,
      type: data.type as string,
      priority: data.priority as string,
      status: data.status as string,
      description: data.description as string,
      location: data.location as string,
      coordinates: coords,
      reporterName: data.reporter_name as string,
      reporterEmail: data.reporter_email as string | undefined,
      reporterPhone: data.reporter_phone as string | undefined,
      community: data.community as string | undefined,
      attachments: (data.attachments as string[]) || [],
      adminNotes: data.admin_notes as string | undefined,
      reviewedBy: data.reviewed_by as string | undefined,
      reviewedByName: reviewer?.name,
      reviewedByEmail: reviewer?.email,
      reviewedAt: data.reviewed_at as string | undefined,
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string,
    };
  }

  /**
   * Parsear coordenadas PostGIS POINT a formato usado en el frontend
   * Soporta tanto formato WKT (POINT(lng lat)) como GeoJSON
   */
  private static parsePostGISPoint(
    point: unknown
  ): { latitude: number; longitude: number } {
    if (!point) return { latitude: 0, longitude: 0 };

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
   * Usa formato WKT: POINT(longitude latitude)
   * El SRID 4326 corresponde a WGS84 (sistema de coordenadas GPS)
   */
  private static toPostGISPoint(latitude: number, longitude: number): string {
    // PostGIS espera formato: POINT(longitude latitude)
    return `POINT(${longitude} ${latitude})`;
  }
}
