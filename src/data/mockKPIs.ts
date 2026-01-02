// ============================================================================
// DATOS MOCK - KPIs
// ============================================================================

import { KPI } from '@/types';

export const mockKPIs: KPI[] = [
  {
    id: 'kpi-1',
    name: 'Caudal Promedio Río Caroní',
    value: 4250,
    unit: 'm³/s',
    trend: 'down',
    change: -5.2,
    category: 'water',
  },
  {
    id: 'kpi-2',
    name: 'Consumo Energético Regional',
    value: 1850,
    unit: 'MWh',
    trend: 'up',
    change: 3.1,
    category: 'energy',
  },
  {
    id: 'kpi-3',
    name: 'Emisiones de CO₂',
    value: 12500,
    unit: 'tCO₂e',
    trend: 'down',
    change: -8.5,
    category: 'carbon',
  },
  {
    id: 'kpi-4',
    name: 'Índice de Vegetación (NDVI)',
    value: 0.72,
    unit: '',
    trend: 'stable',
    change: 0.0,
    category: 'biodiversity',
  },
  {
    id: 'kpi-5',
    name: 'Gestión de Residuos',
    value: 68,
    unit: '%',
    trend: 'up',
    change: 12.3,
    category: 'waste',
  },
  {
    id: 'kpi-6',
    name: 'Temperatura Promedio',
    value: 26.5,
    unit: '°C',
    trend: 'up',
    change: 1.2,
    category: 'biodiversity',
  },
];