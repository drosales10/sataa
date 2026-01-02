// ============================================================================
// HOOK DE AMENAZAS
// ============================================================================

import { useState, useEffect } from 'react';
import { Threat, ThreatType, SeverityLevel, ThreatStatus } from '@/types';
import { mockThreats } from '@/data/mockThreats';

interface UseThreatsOptions {
  type?: ThreatType;
  severity?: SeverityLevel;
  status?: ThreatStatus;
  searchQuery?: string;
}

export const useThreats = (options: UseThreatsOptions = {}) => {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchThreats = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Simular llamada a API
        await new Promise(resolve => setTimeout(resolve, 500));
        
        let filtered = [...mockThreats];
        
        // Aplicar filtros
        if (options.type) {
          filtered = filtered.filter(t => t.type === options.type);
        }
        
        if (options.severity) {
          filtered = filtered.filter(t => t.severity === options.severity);
        }
        
        if (options.status) {
          filtered = filtered.filter(t => t.status === options.status);
        }
        
        if (options.searchQuery) {
          const query = options.searchQuery.toLowerCase();
          filtered = filtered.filter(t =>
            t.description.toLowerCase().includes(query) ||
            t.location.address?.toLowerCase().includes(query) ||
            t.monitorName.toLowerCase().includes(query)
          );
        }
        
        setThreats(filtered);
      } catch (err) {
        setError('Error al cargar amenazas');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchThreats();
  }, [options.type, options.severity, options.status, options.searchQuery]);

  return { threats, isLoading, error };
};

export const useThreatById = (id: string) => {
  const [threat, setThreat] = useState<Threat | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchThreat = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      const found = mockThreats.find(t => t.id === id);
      setThreat(found || null);
      setIsLoading(false);
    };

    fetchThreat();
  }, [id]);

  return { threat, isLoading };
};