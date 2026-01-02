// ============================================================================
// HOOK: SUPABASE - GESTIÓN DE ESTADO Y REALTIME
// ============================================================================

import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ThreatsService } from '@/services/threatsService';
import { AlertsService } from '@/services/alertsService';
import { ReportsService } from '@/services/reportsService';
import type { Threat, Alert } from '@/types';
import type { CommunityReport } from '@/services/reportsService';
import type { User } from '@supabase/supabase-js';

/**
 * Hook para gestionar amenazas con Supabase
 */
export function useThreats() {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    // Cargar amenazas iniciales
    const loadThreats = async () => {
      try {
        const data = await ThreatsService.getAll();
        setThreats(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load threats');
      } finally {
        setLoading(false);
      }
    };

    loadThreats();

    // Suscribirse a cambios en tiempo real
    const channel = ThreatsService.subscribe((payload) => {
      if (payload.eventType === 'INSERT') {
        setThreats((prev) => [payload.new as unknown as Threat, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setThreats((prev) =>
          prev.map((t) => (t.id === (payload.new as { id: string }).id ? payload.new as unknown as Threat : t))
        );
      } else if (payload.eventType === 'DELETE') {
        setThreats((prev) => prev.filter((t) => t.id !== (payload.old as { id: string }).id));
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return { threats, loading, error, refetch: () => ThreatsService.getAll() };
}

/**
 * Hook para gestionar alertas con Supabase
 */
export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    // Cargar alertas iniciales
    const loadAlerts = async () => {
      try {
        const data = await AlertsService.getAll();
        setAlerts(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load alerts');
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();

    // Suscribirse a cambios en tiempo real
    const channel = AlertsService.subscribe((payload) => {
      if (payload.eventType === 'INSERT') {
        setAlerts((prev) => [payload.new as unknown as Alert, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setAlerts((prev) =>
          prev.map((a) => (a.id === (payload.new as { id: string }).id ? payload.new as unknown as Alert : a))
        );
      } else if (payload.eventType === 'DELETE') {
        setAlerts((prev) => prev.filter((a) => a.id !== (payload.old as { id: string }).id));
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return { alerts, loading, error, refetch: () => AlertsService.getAll() };
}

/**
 * Hook para gestionar reportes comunitarios con Supabase
 */
export function useCommunityReports() {
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    // Cargar reportes iniciales
    const loadReports = async () => {
      try {
        const data = await ReportsService.getAll();
        setReports(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    loadReports();

    // Suscribirse a cambios en tiempo real
    const channel = ReportsService.subscribe((payload) => {
      if (payload.eventType === 'INSERT') {
        setReports((prev) => [payload.new as unknown as CommunityReport, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setReports((prev) =>
          prev.map((r) => (r.id === (payload.new as { id: string }).id ? payload.new as unknown as CommunityReport : r))
        );
      } else if (payload.eventType === 'DELETE') {
        setReports((prev) => prev.filter((r) => r.id !== (payload.old as { id: string }).id));
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return { reports, loading, error, refetch: () => ReportsService.getAll() };
}

/**
 * Hook para gestionar autenticación con Supabase
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    // Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
}