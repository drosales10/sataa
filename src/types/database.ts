// ============================================================================
// TIPOS DE BASE DE DATOS - SUPABASE
// ============================================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      threats: {
        Row: {
          id: string;
          type: string;
          severity: string;
          status: string;
          location: string;
          coordinates: unknown; // PostGIS geometry
          description: string;
          reported_by: string;
          verified_by: string | null;
          created_at: string;
          updated_at: string;
          images: string[] | null;
          affected_area: number | null;
          population_at_risk: number | null;
        };
        Insert: {
          id?: string;
          type: string;
          severity: string;
          status?: string;
          location: string;
          coordinates: unknown;
          description: string;
          reported_by: string;
          verified_by?: string | null;
          created_at?: string;
          updated_at?: string;
          images?: string[] | null;
          affected_area?: number | null;
          population_at_risk?: number | null;
        };
        Update: {
          id?: string;
          type?: string;
          severity?: string;
          status?: string;
          location?: string;
          coordinates?: unknown;
          description?: string;
          reported_by?: string;
          verified_by?: string | null;
          created_at?: string;
          updated_at?: string;
          images?: string[] | null;
          affected_area?: number | null;
          population_at_risk?: number | null;
        };
      };
      alerts: {
        Row: {
          id: string;
          title: string;
          type: string;
          priority: string;
          status: string;
          location: string;
          coordinates: unknown | null;
          description: string;
          affected_area: number | null;
          population_at_risk: number | null;
          created_at: string;
          updated_at: string;
          acknowledged: boolean;
          acknowledged_by: string | null;
          acknowledged_at: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          type: string;
          priority: string;
          status?: string;
          location: string;
          coordinates?: unknown | null;
          description: string;
          affected_area?: number | null;
          population_at_risk?: number | null;
          created_at?: string;
          updated_at?: string;
          acknowledged?: boolean;
          acknowledged_by?: string | null;
          acknowledged_at?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          type?: string;
          priority?: string;
          status?: string;
          location?: string;
          coordinates?: unknown | null;
          description?: string;
          affected_area?: number | null;
          population_at_risk?: number | null;
          created_at?: string;
          updated_at?: string;
          acknowledged?: boolean;
          acknowledged_by?: string | null;
          acknowledged_at?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
      };
      community_reports: {
        Row: {
          id: string;
          threat_type: string;
          location: string;
          coordinates: unknown;
          description: string;
          reporter_name: string;
          reporter_contact: string;
          images: string[] | null;
          status: string;
          created_at: string;
          updated_at: string;
          verified_by: string | null;
          verified_at: string | null;
        };
        Insert: {
          id?: string;
          threat_type: string;
          location: string;
          coordinates: unknown;
          description: string;
          reporter_name: string;
          reporter_contact: string;
          images?: string[] | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
          verified_by?: string | null;
          verified_at?: string | null;
        };
        Update: {
          id?: string;
          threat_type?: string;
          location?: string;
          coordinates?: unknown;
          description?: string;
          reporter_name?: string;
          reporter_contact?: string;
          images?: string[] | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
          verified_by?: string | null;
          verified_at?: string | null;
        };
      };
      environmental_variables: {
        Row: {
          id: string;
          variable_type: string;
          value: number;
          unit: string;
          location: string;
          coordinates: unknown;
          recorded_at: string;
          sensor_id: string | null;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          variable_type: string;
          value: number;
          unit: string;
          location: string;
          coordinates: unknown;
          recorded_at?: string;
          sensor_id?: string | null;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          variable_type?: string;
          value?: number;
          unit?: string;
          location?: string;
          coordinates?: unknown;
          recorded_at?: string;
          sensor_id?: string | null;
          metadata?: Json | null;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: string;
          organization: string | null;
          created_at: string;
          updated_at: string;
          last_login: string | null;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: string;
          organization?: string | null;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: string;
          organization?: string | null;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      nearby_threats: {
        Args: {
          lat: number;
          lng: number;
          radius_km: number;
        };
        Returns: {
          id: string;
          type: string;
          severity: string;
          location: string;
          distance_km: number;
        }[];
      };
      threats_in_area: {
        Args: {
          min_lat: number;
          min_lng: number;
          max_lat: number;
          max_lng: number;
        };
        Returns: {
          id: string;
          type: string;
          severity: string;
          location: string;
        }[];
      };
    };
    Enums: {
      threat_type: 'UNREGULATED_TOURISM' | 'ILLEGAL_MINING' | 'DEFORESTATION' | 'FOREST_FIRE' | 'UNAUTHORIZED_OCCUPATION' | 'OTHER';
      severity_level: 'LOW' | 'MEDIUM' | 'HIGH';
      threat_status: 'PENDING' | 'VERIFIED' | 'CONFIRMED' | 'RESOLVED' | 'FALSE_ALARM';
      alert_priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
      alert_status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
      user_role: 'RESEARCHER' | 'RISK_MANAGER' | 'COMMUNITY_MONITOR' | 'PUBLIC' | 'ADMIN';
    };
  };
}