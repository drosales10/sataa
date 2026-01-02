// ============================================================================
// INTERNACIONALIZACIÓN - SISTEMA SMyEG
// ============================================================================

import { Language, Translation } from '@/types';

export const translations: Record<Language, Translation> = {
  es: {
    // Navegación
    nav: {
      dashboard: 'Panel Principal',
      map: 'Mapa Interactivo',
      timeSeries: 'Series Temporales',
      reports: 'Reportes',
      communityReport: 'Reporte Comunitario',
      alerts: 'Alertas',
      settings: 'Configuración',
      logout: 'Cerrar Sesión',
    },
    // Autenticación
    auth: {
      login: 'Iniciar Sesión',
      email: 'Correo Electrónico',
      password: 'Contraseña',
      rememberMe: 'Recordarme',
      forgotPassword: '¿Olvidaste tu contraseña?',
      loginButton: 'Ingresar',
      welcome: 'Bienvenido a SMyEG',
      subtitle: 'Sistema de Monitoreo y Evaluación Geoespacial',
    },
    // Dashboard
    dashboard: {
      title: 'Panel de Control',
      activeThreats: 'Amenazas Activas',
      resolvedThreats: 'Amenazas Resueltas',
      activeMonitors: 'Monitores Activos',
      recentAlerts: 'Alertas Recientes',
      kpis: 'Indicadores Clave',
      threatsByType: 'Amenazas por Tipo',
      threatsBySeverity: 'Amenazas por Severidad',
      recentActivity: 'Actividad Reciente',
      viewAll: 'Ver Todo',
    },
    // Amenazas
    threats: {
      title: 'Gestión de Amenazas',
      reportNew: 'Reportar Nueva Amenaza',
      type: 'Tipo de Amenaza',
      severity: 'Nivel de Severidad',
      status: 'Estado',
      location: 'Ubicación',
      description: 'Descripción',
      reportedBy: 'Reportado por',
      reportedAt: 'Fecha de Reporte',
      images: 'Imágenes',
      noThreats: 'No hay amenazas registradas',
      filterBy: 'Filtrar por',
      searchPlaceholder: 'Buscar amenazas...',
    },
    // Mapa
    map: {
      title: 'Mapa Interactivo',
      layers: 'Capas',
      baseLayers: 'Capas Base',
      overlays: 'Capas Temáticas',
      tools: 'Herramientas',
      search: 'Buscar ubicación',
      measure: 'Medir',
      measureDistance: 'Medir Distancia',
      measureArea: 'Medir Área',
      zoomIn: 'Acercar',
      zoomOut: 'Alejar',
      resetView: 'Restablecer Vista',
      coordinates: 'Coordenadas',
      threatDetails: 'Detalles de Amenaza',
    },
    // Series Temporales
    timeSeries: {
      title: 'Análisis de Series Temporales',
      selectVariable: 'Seleccionar Variable',
      selectDateRange: 'Seleccionar Rango de Fechas',
      compareYears: 'Comparar Años',
      anomalies: 'Anomalías Detectadas',
      trend: 'Tendencia',
      statistics: 'Estadísticas',
      average: 'Promedio',
      maximum: 'Máximo',
      minimum: 'Mínimo',
      export: 'Exportar Datos',
    },
    // Reportes
    reports: {
      title: 'Generación de Reportes',
      createNew: 'Crear Nuevo Reporte',
      reportType: 'Tipo de Reporte',
      dateRange: 'Rango de Fechas',
      filters: 'Filtros',
      preview: 'Vista Previa',
      generate: 'Generar Reporte',
      download: 'Descargar',
      exportFormat: 'Formato de Exportación',
      pdf: 'PDF',
      excel: 'Excel',
      csv: 'CSV',
      geojson: 'GeoJSON',
    },
    // Alertas
    alerts: {
      title: 'Sistema de Alertas',
      active: 'Alertas Activas',
      history: 'Historial',
      priority: 'Prioridad',
      acknowledge: 'Reconocer',
      resolve: 'Resolver',
      escalate: 'Escalar',
      notificationsSent: 'Notificaciones Enviadas',
      responseTime: 'Tiempo de Respuesta',
    },
    // Común
    common: {
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      view: 'Ver',
      close: 'Cerrar',
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      warning: 'Advertencia',
      info: 'Información',
      confirm: 'Confirmar',
      back: 'Volver',
      next: 'Siguiente',
      previous: 'Anterior',
      search: 'Buscar',
      filter: 'Filtrar',
      clear: 'Limpiar',
      apply: 'Aplicar',
      noData: 'No hay datos disponibles',
      selectAll: 'Seleccionar Todo',
      deselectAll: 'Deseleccionar Todo',
    },
  },
  en: {
    // Navigation
    nav: {
      dashboard: 'Dashboard',
      map: 'Interactive Map',
      timeSeries: 'Time Series',
      reports: 'Reports',
      communityReport: 'Community Report',
      alerts: 'Alerts',
      settings: 'Settings',
      logout: 'Logout',
    },
    // Authentication
    auth: {
      login: 'Login',
      email: 'Email',
      password: 'Password',
      rememberMe: 'Remember Me',
      forgotPassword: 'Forgot Password?',
      loginButton: 'Sign In',
      welcome: 'Welcome to SMyEG',
      subtitle: 'Environmental and Geospatial Monitoring System',
    },
    // Dashboard
    dashboard: {
      title: 'Dashboard',
      activeThreats: 'Active Threats',
      resolvedThreats: 'Resolved Threats',
      activeMonitors: 'Active Monitors',
      recentAlerts: 'Recent Alerts',
      kpis: 'Key Performance Indicators',
      threatsByType: 'Threats by Type',
      threatsBySeverity: 'Threats by Severity',
      recentActivity: 'Recent Activity',
      viewAll: 'View All',
    },
    // Threats
    threats: {
      title: 'Threat Management',
      reportNew: 'Report New Threat',
      type: 'Threat Type',
      severity: 'Severity Level',
      status: 'Status',
      location: 'Location',
      description: 'Description',
      reportedBy: 'Reported by',
      reportedAt: 'Report Date',
      images: 'Images',
      noThreats: 'No threats registered',
      filterBy: 'Filter by',
      searchPlaceholder: 'Search threats...',
    },
    // Map
    map: {
      title: 'Interactive Map',
      layers: 'Layers',
      baseLayers: 'Base Layers',
      overlays: 'Thematic Layers',
      tools: 'Tools',
      search: 'Search location',
      measure: 'Measure',
      measureDistance: 'Measure Distance',
      measureArea: 'Measure Area',
      zoomIn: 'Zoom In',
      zoomOut: 'Zoom Out',
      resetView: 'Reset View',
      coordinates: 'Coordinates',
      threatDetails: 'Threat Details',
    },
    // Time Series
    timeSeries: {
      title: 'Time Series Analysis',
      selectVariable: 'Select Variable',
      selectDateRange: 'Select Date Range',
      compareYears: 'Compare Years',
      anomalies: 'Detected Anomalies',
      trend: 'Trend',
      statistics: 'Statistics',
      average: 'Average',
      maximum: 'Maximum',
      minimum: 'Minimum',
      export: 'Export Data',
    },
    // Reports
    reports: {
      title: 'Report Generation',
      createNew: 'Create New Report',
      reportType: 'Report Type',
      dateRange: 'Date Range',
      filters: 'Filters',
      preview: 'Preview',
      generate: 'Generate Report',
      download: 'Download',
      exportFormat: 'Export Format',
      pdf: 'PDF',
      excel: 'Excel',
      csv: 'CSV',
      geojson: 'GeoJSON',
    },
    // Alerts
    alerts: {
      title: 'Alert System',
      active: 'Active Alerts',
      history: 'History',
      priority: 'Priority',
      acknowledge: 'Acknowledge',
      resolve: 'Resolve',
      escalate: 'Escalate',
      notificationsSent: 'Notifications Sent',
      responseTime: 'Response Time',
    },
    // Common
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      close: 'Close',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      info: 'Information',
      confirm: 'Confirm',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      search: 'Search',
      filter: 'Filter',
      clear: 'Clear',
      apply: 'Apply',
      noData: 'No data available',
      selectAll: 'Select All',
      deselectAll: 'Deselect All',
    },
  },
};

export const getTranslation = (lang: Language, key: string): string => {
  const keys = key.split('.');
  let value: Translation | string = translations[lang];
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k] as Translation | string;
    } else {
      return key; // Return key if translation not found
    }
  }
  
  return typeof value === 'string' ? value : key;
};