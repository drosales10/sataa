// ============================================================================
// HOOK DE ALERTAS
// ============================================================================

import { useState, useEffect } from 'react';
import { Alert } from '@/types';

const mockAlerts: Alert[] = [
  {
    id: 'alert-1',
    threatId: '1',
    type: 'IMMEDIATE_ACTION',
    priority: 'CRITICAL',
    status: 'SENT',
    message: 'Incendio forestal activo requiere respuesta inmediata',
    createdAt: '2026-01-02T08:15:00Z',
    acknowledgedAt: '2026-01-02T08:20:00Z',
  },
  {
    id: 'alert-2',
    threatId: '2',
    type: 'ESCALATION',
    priority: 'HIGH',
    status: 'ACKNOWLEDGED',
    message: 'Minería ilegal confirmada - requiere acción coordinada',
    createdAt: '2026-01-01T16:30:00Z',
    acknowledgedAt: '2026-01-01T17:00:00Z',
  },
  {
    id: 'alert-3',
    threatId: '3',
    type: 'INFORMATION',
    priority: 'MEDIUM',
    status: 'CREATED',
    message: 'Nueva amenaza de deforestación reportada',
    createdAt: '2026-01-02T09:00:00Z',
  },
];

export const useAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setAlerts(mockAlerts);
      setIsLoading(false);
    };

    fetchAlerts();
  }, []);

  const acknowledgeAlert = async (alertId: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId
          ? { ...alert, status: 'ACKNOWLEDGED', acknowledgedAt: new Date().toISOString() }
          : alert
      )
    );
  };

  const resolveAlert = async (alertId: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId
          ? { ...alert, status: 'RESOLVED', resolvedAt: new Date().toISOString() }
          : alert
      )
    );
  };

  return { alerts, isLoading, acknowledgeAlert, resolveAlert };
};