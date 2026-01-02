// ============================================================================
// UTILIDADES DE EXPORTACIÓN
// ============================================================================

import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { Threat, EnvironmentalVariable } from '@/types';
import { THREAT_TYPES, SEVERITY_LEVELS, ENVIRONMENTAL_VARIABLES } from '@/lib/constants';

// Exportar a CSV
export const exportToCSV = (
  data: Threat[],
  filename: string,
  language: 'es' | 'en'
): void => {
  const headers = language === 'es'
    ? ['ID', 'Tipo', 'Severidad', 'Estado', 'Descripción', 'Latitud', 'Longitud', 'Dirección', 'Monitor', 'Fecha']
    : ['ID', 'Type', 'Severity', 'Status', 'Description', 'Latitude', 'Longitude', 'Address', 'Monitor', 'Date'];

  const rows = data.map(threat => [
    threat.id,
    language === 'es' ? THREAT_TYPES[threat.type].label : THREAT_TYPES[threat.type].labelEn,
    language === 'es' ? SEVERITY_LEVELS[threat.severity].label : SEVERITY_LEVELS[threat.severity].labelEn,
    threat.status,
    threat.description,
    threat.location.latitude,
    threat.location.longitude,
    threat.location.address,
    threat.monitorName,
    new Date(threat.reportedAt).toISOString(),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
};

// Exportar a Excel
export const exportToExcel = (
  data: Threat[],
  filename: string,
  language: 'es' | 'en'
): void => {
  const workbook = XLSX.utils.book_new();

  // Hoja 1: Datos de amenazas
  const threatData = data.map(threat => ({
    ID: threat.id,
    [language === 'es' ? 'Tipo' : 'Type']: language === 'es' ? THREAT_TYPES[threat.type].label : THREAT_TYPES[threat.type].labelEn,
    [language === 'es' ? 'Severidad' : 'Severity']: language === 'es' ? SEVERITY_LEVELS[threat.severity].label : SEVERITY_LEVELS[threat.severity].labelEn,
    [language === 'es' ? 'Estado' : 'Status']: threat.status,
    [language === 'es' ? 'Descripción' : 'Description']: threat.description,
    [language === 'es' ? 'Latitud' : 'Latitude']: threat.location.latitude,
    [language === 'es' ? 'Longitud' : 'Longitude']: threat.location.longitude,
    [language === 'es' ? 'Dirección' : 'Address']: threat.location.address,
    [language === 'es' ? 'Monitor' : 'Monitor']: threat.monitorName,
    [language === 'es' ? 'Fecha' : 'Date']: new Date(threat.reportedAt).toLocaleDateString(),
  }));

  const ws1 = XLSX.utils.json_to_sheet(threatData);
  XLSX.utils.book_append_sheet(workbook, ws1, language === 'es' ? 'Amenazas' : 'Threats');

  // Hoja 2: Estadísticas
  const stats = {
    [language === 'es' ? 'Total de Amenazas' : 'Total Threats']: data.length,
    [language === 'es' ? 'Severidad Alta' : 'High Severity']: data.filter(t => t.severity === 'HIGH').length,
    [language === 'es' ? 'Severidad Media' : 'Medium Severity']: data.filter(t => t.severity === 'MEDIUM').length,
    [language === 'es' ? 'Severidad Baja' : 'Low Severity']: data.filter(t => t.severity === 'LOW').length,
  };

  const ws2 = XLSX.utils.json_to_sheet([stats]);
  XLSX.utils.book_append_sheet(workbook, ws2, language === 'es' ? 'Estadísticas' : 'Statistics');

  // Generar archivo
  XLSX.writeFile(workbook, filename);
};

// Exportar a GeoJSON
export const exportToGeoJSON = (
  data: Threat[],
  filename: string
): void => {
  const geojson = {
    type: 'FeatureCollection',
    features: data.map(threat => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [threat.location.longitude, threat.location.latitude],
      },
      properties: {
        id: threat.id,
        type: threat.type,
        severity: threat.severity,
        status: threat.status,
        description: threat.description,
        address: threat.location.address,
        monitorName: threat.monitorName,
        reportedAt: threat.reportedAt,
      },
    })),
  };

  const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
  saveAs(blob, filename);
};

// Exportar variables ambientales a CSV
export const exportEnvironmentalDataToCSV = (
  variables: EnvironmentalVariable[],
  filename: string,
  language: 'es' | 'en'
): void => {
  const headers = [
    language === 'es' ? 'Variable' : 'Variable',
    language === 'es' ? 'Unidad' : 'Unit',
    language === 'es' ? 'Descripción' : 'Description',
  ];

  const rows = variables.map(variable => [
    language === 'es' ? ENVIRONMENTAL_VARIABLES[variable].label : ENVIRONMENTAL_VARIABLES[variable].labelEn,
    ENVIRONMENTAL_VARIABLES[variable].unit,
    language === 'es' ? ENVIRONMENTAL_VARIABLES[variable].description : ENVIRONMENTAL_VARIABLES[variable].descriptionEn || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
};

// Exportar variables ambientales a Excel
export const exportEnvironmentalDataToExcel = (
  variables: EnvironmentalVariable[],
  filename: string,
  language: 'es' | 'en'
): void => {
  const workbook = XLSX.utils.book_new();

  const data = variables.map(variable => ({
    [language === 'es' ? 'Variable' : 'Variable']: language === 'es' ? ENVIRONMENTAL_VARIABLES[variable].label : ENVIRONMENTAL_VARIABLES[variable].labelEn,
    [language === 'es' ? 'Unidad' : 'Unit']: ENVIRONMENTAL_VARIABLES[variable].unit,
    [language === 'es' ? 'Color' : 'Color']: ENVIRONMENTAL_VARIABLES[variable].color,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, ws, language === 'es' ? 'Variables' : 'Variables');

  XLSX.writeFile(workbook, filename);
};