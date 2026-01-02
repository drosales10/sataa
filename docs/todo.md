# Plan de Desarrollo - Sistema SMyEG (Sistema de Monitoreo y Evaluación Geoespacial)

## Directrices de Diseño

### Referencias de Diseño
- **Inspiración Principal**: ArcGIS Online, QGIS Cloud, Google Earth Engine
- **Estilo**: Profesional GIS + Dashboard Moderno + Diseño Limpio
- **Enfoque**: Funcionalidad sobre estética, claridad en visualización de datos

### Paleta de Colores
- **Primario**: #2E7D32 (Verde Bosque - representa ecosistemas)
- **Secundario**: #1565C0 (Azul Profundo - representa agua/hidrología)
- **Acento Alerta**: #D32F2F (Rojo - alertas críticas)
- **Acento Advertencia**: #F57C00 (Naranja - advertencias)
- **Acento Info**: #0288D1 (Azul Claro - información)
- **Fondo**: #FAFAFA (Gris muy claro)
- **Superficie**: #FFFFFF (Blanco)
- **Texto Primario**: #212121 (Negro casi puro)
- **Texto Secundario**: #757575 (Gris medio)

### Tipografía
- **Heading1**: Inter font-weight 700 (32px) - Títulos principales
- **Heading2**: Inter font-weight 600 (24px) - Secciones
- **Heading3**: Inter font-weight 600 (18px) - Subsecciones
- **Body**: Inter font-weight 400 (14px) - Texto normal
- **Body/Emphasis**: Inter font-weight 600 (14px) - Texto enfatizado
- **Caption**: Inter font-weight 400 (12px) - Texto pequeño/metadatos
- **Button**: Inter font-weight 600 (14px) - Botones

### Componentes Clave
- **Mapa**: Leaflet con controles personalizados, capas temáticas
- **Tarjetas de Datos**: Fondo blanco, sombra sutil, bordes redondeados (8px)
- **Botones Primarios**: Verde bosque, hover: más oscuro 10%
- **Botones Secundarios**: Borde gris, fondo transparente, hover: fondo gris claro
- **Alertas**: Colores según severidad (rojo/naranja/amarillo), icono prominente
- **Filtros**: Panel lateral izquierdo, acordeón para categorías
- **Gráficos**: Recharts con colores de la paleta, tooltips informativos

### Layout y Espaciado
- **Navbar**: 64px altura, fijo en top, logo izquierda, acciones derecha
- **Sidebar**: 280px ancho, colapsable, filtros y capas
- **Contenido Principal**: Flexible, padding 24px
- **Espaciado entre elementos**: 16px estándar, 24px para secciones
- **Bordes redondeados**: 8px para tarjetas, 4px para inputs

### Imágenes a Generar
1. **logo-smyeg.png** - Logo del sistema SMyEG con elementos de naturaleza y tecnología (Style: vector-style, professional)
2. **hero-ecosystem-monitoring.jpg** - Imagen de ecosistema con tecnología de monitoreo (Style: photorealistic, aerial view)
3. **icon-forest-fire.png** - Icono de incendio forestal (Style: flat design, red-orange)
4. **icon-deforestation.png** - Icono de deforestación (Style: flat design, brown-green)
5. **icon-illegal-mining.png** - Icono de minería ilegal (Style: flat design, gray-yellow)
6. **icon-water-level.png** - Icono de nivel de agua (Style: flat design, blue)
7. **map-placeholder.jpg** - Mapa base placeholder (Style: cartographic, neutral colors)

---

## Estructura de Archivos

### 1. Configuración y Tipos
- `src/types/index.ts` - Tipos TypeScript globales
- `src/lib/constants.ts` - Constantes de la aplicación
- `src/lib/api.ts` - Cliente API configurado

### 2. Contextos y Estado Global
- `src/contexts/AuthContext.tsx` - Contexto de autenticación
- `src/contexts/MapContext.tsx` - Estado del mapa y capas
- `src/contexts/LanguageContext.tsx` - Contexto de idioma (ES/EN)

### 3. Hooks Personalizados
- `src/hooks/useAuth.ts` - Hook de autenticación
- `src/hooks/useThreats.ts` - Hook para gestión de amenazas
- `src/hooks/useMap.ts` - Hook para control del mapa
- `src/hooks/useAlerts.ts` - Hook para alertas

### 4. Componentes de UI Compartidos
- `src/components/layout/Navbar.tsx` - Barra de navegación principal
- `src/components/layout/Sidebar.tsx` - Panel lateral de filtros
- `src/components/layout/Footer.tsx` - Pie de página
- `src/components/common/LoadingSpinner.tsx` - Spinner de carga
- `src/components/common/ErrorBoundary.tsx` - Manejo de errores
- `src/components/common/LanguageSelector.tsx` - Selector de idioma

### 5. Componentes del Mapa
- `src/components/map/MapContainer.tsx` - Contenedor principal del mapa
- `src/components/map/ThreatMarker.tsx` - Marcadores de amenazas
- `src/components/map/LayerControl.tsx` - Control de capas
- `src/components/map/MapToolbar.tsx` - Herramientas del mapa
- `src/components/map/MeasurementTool.tsx` - Herramienta de medición

### 6. Componentes de Amenazas
- `src/components/threats/ThreatCard.tsx` - Tarjeta de amenaza
- `src/components/threats/ThreatList.tsx` - Lista de amenazas
- `src/components/threats/ThreatDetails.tsx` - Detalles de amenaza
- `src/components/threats/ThreatForm.tsx` - Formulario de reporte
- `src/components/threats/ThreatFilters.tsx` - Filtros de amenazas

### 7. Componentes de Dashboard
- `src/components/dashboard/KPICard.tsx` - Tarjeta de KPI
- `src/components/dashboard/AlertPanel.tsx` - Panel de alertas
- `src/components/dashboard/StatisticsChart.tsx` - Gráficos estadísticos
- `src/components/dashboard/RecentActivity.tsx` - Actividad reciente

### 8. Componentes de Series Temporales
- `src/components/timeseries/TimeSeriesChart.tsx` - Gráfico de series temporales
- `src/components/timeseries/VariableSelector.tsx` - Selector de variables
- `src/components/timeseries/DateRangePicker.tsx` - Selector de rango de fechas
- `src/components/timeseries/ComparisonView.tsx` - Vista de comparación anual

### 9. Componentes de Reportes
- `src/components/reports/ReportBuilder.tsx` - Constructor de reportes
- `src/components/reports/ExportOptions.tsx` - Opciones de exportación
- `src/components/reports/ReportPreview.tsx` - Vista previa de reporte

### 10. Componentes de Monitoreo Comunitario
- `src/components/community/ReportForm.tsx` - Formulario de reporte comunitario
- `src/components/community/MonitorProfile.tsx` - Perfil de monitor
- `src/components/community/CommunityDashboard.tsx` - Dashboard comunitario

### 11. Páginas
- `src/pages/Index.tsx` - Página principal (Dashboard)
- `src/pages/Login.tsx` - Página de inicio de sesión
- `src/pages/MapView.tsx` - Vista del mapa interactivo
- `src/pages/TimeSeries.tsx` - Visualización de series temporales
- `src/pages/Reports.tsx` - Generación de reportes
- `src/pages/CommunityReport.tsx` - Reporte comunitario
- `src/pages/Alerts.tsx` - Gestión de alertas
- `src/pages/Settings.tsx` - Configuración

### 12. Utilidades
- `src/lib/mapUtils.ts` - Utilidades para el mapa
- `src/lib/dataProcessing.ts` - Procesamiento de datos
- `src/lib/exportUtils.ts` - Utilidades de exportación
- `src/lib/i18n.ts` - Internacionalización

### 13. Datos Mock (para desarrollo)
- `src/data/mockThreats.ts` - Datos de amenazas simuladas
- `src/data/mockTimeSeries.ts` - Datos de series temporales simuladas
- `src/data/mockKPIs.ts` - KPIs simulados

---

## Tareas de Desarrollo (Orden de Implementación)

### Fase 1: Fundamentos (Archivos 1-20)
1. Configurar tipos TypeScript y constantes
2. Crear contextos de autenticación e idioma
3. Implementar hooks personalizados básicos
4. Crear componentes de layout (Navbar, Sidebar, Footer)
5. Implementar componentes comunes (Loading, Error, LanguageSelector)

### Fase 2: Autenticación y Navegación (Archivos 21-25)
6. Crear página de login con roles
7. Implementar sistema de autenticación
8. Configurar rutas protegidas
9. Crear página de configuración

### Fase 3: Dashboard Principal (Archivos 26-35)
10. Implementar KPI cards con datos ambientales
11. Crear panel de alertas activas
12. Desarrollar gráficos estadísticos (Recharts)
13. Implementar actividad reciente
14. Integrar todo en página Index

### Fase 4: Mapa Interactivo (Archivos 36-50)
15. Integrar Leaflet en MapContainer
16. Crear marcadores de amenazas con clustering
17. Implementar control de capas (gestión de capas)
18. Desarrollar toolbar con herramientas (zoom, búsqueda, medición)
19. Crear herramienta de medición de áreas/distancias
20. Implementar búsqueda por coordenadas y palabras clave
21. Crear página MapView completa

### Fase 5: Gestión de Amenazas (Archivos 51-65)
22. Crear componentes de tarjetas de amenazas
23. Implementar lista de amenazas con paginación
24. Desarrollar vista de detalles de amenaza
25. Crear formulario de reporte de amenazas
26. Implementar filtros avanzados
27. Integrar con el mapa

### Fase 6: Series Temporales (Archivos 66-75)
28. Crear gráficos de series temporales con Recharts
29. Implementar selector de variables (NDVI, temperatura, precipitación, etc.)
30. Desarrollar selector de rango de fechas
31. Crear vista de comparación anual
32. Implementar detección de anomalías visual
33. Crear página TimeSeries completa

### Fase 7: Sistema de Reportes (Archivos 76-85)
34. Crear constructor de reportes personalizados
35. Implementar opciones de exportación (PDF, CSV, Excel, GeoJSON)
36. Desarrollar vista previa de reportes
37. Crear página Reports completa

### Fase 8: Monitoreo Comunitario (Archivos 86-95)
38. Crear formulario de reporte comunitario simplificado
39. Implementar perfil de monitor
40. Desarrollar dashboard comunitario
41. Garantizar confidencialidad en reportes
42. Crear página CommunityReport

### Fase 9: Sistema de Alertas (Archivos 96-105)
43. Implementar visualización de alertas en mapa
44. Crear panel de gestión de alertas
45. Desarrollar sistema de notificaciones
46. Implementar protocolos de respuesta
47. Crear página Alerts completa

### Fase 10: Integración y Pulido (Archivos 106-120)
48. Integrar datos mock realistas
49. Implementar internacionalización completa (ES/EN)
50. Optimizar rendimiento (lazy loading, memoization)
51. Implementar manejo de errores robusto
52. Crear utilidades de exportación
53. Agregar tooltips y ayuda contextual
54. Realizar pruebas de usabilidad
55. Optimizar para responsive (desktop/tablet)

---

## Notas Técnicas Importantes

### Integración con Leaflet
- Usar `react-leaflet` para integración con React
- Configurar múltiples capas base (satelital, topográfico, calles)
- Implementar clustering para muchos marcadores
- Usar GeoJSON para capas vectoriales

### Gestión de Estado
- Context API para estado global (auth, idioma, mapa)
- React Query para caché de datos del servidor
- Local state para componentes individuales

### Rendimiento
- Lazy loading de componentes pesados (mapa, gráficos)
- Virtualización para listas largas
- Memoization con React.memo y useMemo
- Debouncing para búsquedas y filtros

### Accesibilidad
- Contraste AA mínimo en todos los textos
- Navegación por teclado en todos los componentes
- ARIA labels en elementos interactivos
- Tooltips descriptivos

### Responsive
- Mobile-first approach
- Breakpoints: 640px (sm), 768px (md), 1024px (lg), 1280px (xl)
- Sidebar colapsable en móvil
- Tarjetas apiladas en móvil, grid en desktop

### Seguridad
- Validación de datos en cliente y servidor
- Sanitización de inputs
- Protección CSRF
- Roles y permisos estrictos