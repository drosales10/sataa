// ============================================================================
// DATOS MOCK - SERIES TEMPORALES
// ============================================================================

import { TimeSeriesDataset, EnvironmentalVariable } from '@/types';

// Generar datos de series temporales para los últimos 12 meses
const generateTimeSeriesData = (
  variable: EnvironmentalVariable,
  baseValue: number,
  variance: number,
  unit: string
): TimeSeriesDataset => {
  const data = [];
  const now = new Date();
  
  for (let i = 365; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Agregar variación aleatoria y tendencia estacional
    const seasonalFactor = Math.sin((i / 365) * 2 * Math.PI) * 0.2;
    const randomVariation = (Math.random() - 0.5) * variance;
    const value = baseValue + (baseValue * seasonalFactor) + randomVariation;
    
    data.push({
      timestamp: date.toISOString(),
      value: Math.max(0, parseFloat(value.toFixed(2))),
      variable,
      unit,
    });
  }
  
  return {
    variable,
    data,
    metadata: {
      source: 'Estación de Monitoreo SMyEG',
      lastUpdate: new Date().toISOString(),
      unit,
    },
  };
};

export const mockTimeSeriesDatasets: TimeSeriesDataset[] = [
  generateTimeSeriesData('WATER_LEVEL', 4.5, 1.2, 'm'),
  generateTimeSeriesData('TEMPERATURE', 26.5, 3.5, '°C'),
  generateTimeSeriesData('HUMIDITY', 75, 15, '%'),
  generateTimeSeriesData('PRECIPITATION', 120, 80, 'mm'),
  generateTimeSeriesData('NDVI', 0.72, 0.15, ''),
  generateTimeSeriesData('SOIL_MOISTURE', 45, 12, '%'),
  generateTimeSeriesData('ATMOSPHERIC_PRESSURE', 1013, 15, 'hPa'),
  generateTimeSeriesData('SOLAR_RADIATION', 450, 150, 'W/m²'),
];