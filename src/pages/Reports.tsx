// ============================================================================
// PÁGINA: GENERACIÓN DE REPORTES
// ============================================================================

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/contexts/LanguageContext';
import { useThreats } from '@/hooks/useThreats';
import { THREAT_TYPES, SEVERITY_LEVELS, ENVIRONMENTAL_VARIABLES } from '@/lib/constants';
import { ThreatType, SeverityLevel, EnvironmentalVariable } from '@/types';
import { Download, FileText, Table, FileJson, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { generateThreatsPDF, generateEnvironmentalPDF } from '@/lib/reportGenerator';
import {
  exportToCSV,
  exportToExcel,
  exportToGeoJSON,
  exportEnvironmentalDataToCSV,
  exportEnvironmentalDataToExcel,
} from '@/lib/exportUtils';
import { toast } from 'sonner';

export default function Reports() {
  const { t, language } = useLanguage();
  const { threats } = useThreats();
  
  const [reportType, setReportType] = useState<'threats' | 'environmental'>('threats');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv' | 'geojson'>('pdf');
  const [selectedThreatTypes, setSelectedThreatTypes] = useState<ThreatType[]>([]);
  const [selectedSeverities, setSelectedSeverities] = useState<SeverityLevel[]>([]);
  const [selectedVariables, setSelectedVariables] = useState<EnvironmentalVariable[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleThreatTypeToggle = (type: ThreatType) => {
    setSelectedThreatTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleSeverityToggle = (severity: SeverityLevel) => {
    setSelectedSeverities(prev =>
      prev.includes(severity) ? prev.filter(s => s !== severity) : [...prev, severity]
    );
  };

  const handleVariableToggle = (variable: EnvironmentalVariable) => {
    setSelectedVariables(prev =>
      prev.includes(variable) ? prev.filter(v => v !== variable) : [...prev, variable]
    );
  };

  const getFilteredThreats = () => {
    return threats.filter(threat => {
      const typeMatch = selectedThreatTypes.length === 0 || selectedThreatTypes.includes(threat.type);
      const severityMatch = selectedSeverities.length === 0 || selectedSeverities.includes(threat.severity);
      return typeMatch && severityMatch;
    });
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);

    try {
      const timestamp = format(new Date(), 'yyyy-MM-dd');
      
      if (reportType === 'threats') {
        const filteredThreats = getFilteredThreats();
        
        if (filteredThreats.length === 0) {
          toast.error(language === 'es' ? 'No hay datos para exportar' : 'No data to export');
          setIsGenerating(false);
          return;
        }

        const reportTitle = language === 'es' ? 'Reporte de Amenazas Ambientales' : 'Environmental Threats Report';

        switch (exportFormat) {
          case 'pdf':
            await generateThreatsPDF({
              title: reportTitle,
              data: filteredThreats,
              language,
            });
            toast.success(language === 'es' ? 'PDF generado exitosamente' : 'PDF generated successfully');
            break;

          case 'excel':
            exportToExcel(filteredThreats, `reporte_amenazas_${timestamp}.xlsx`, language);
            toast.success(language === 'es' ? 'Excel generado exitosamente' : 'Excel generated successfully');
            break;

          case 'csv':
            exportToCSV(filteredThreats, `reporte_amenazas_${timestamp}.csv`, language);
            toast.success(language === 'es' ? 'CSV generado exitosamente' : 'CSV generated successfully');
            break;

          case 'geojson':
            exportToGeoJSON(filteredThreats, `amenazas_${timestamp}.geojson`);
            toast.success(language === 'es' ? 'GeoJSON generado exitosamente' : 'GeoJSON generated successfully');
            break;
        }
      } else {
        // Reporte de variables ambientales
        if (selectedVariables.length === 0) {
          toast.error(language === 'es' ? 'Seleccione al menos una variable' : 'Select at least one variable');
          setIsGenerating(false);
          return;
        }

        const reportTitle = language === 'es' ? 'Reporte de Variables Ambientales' : 'Environmental Variables Report';

        switch (exportFormat) {
          case 'pdf':
            await generateEnvironmentalPDF({
              title: reportTitle,
              variables: selectedVariables,
              language,
            });
            toast.success(language === 'es' ? 'PDF generado exitosamente' : 'PDF generated successfully');
            break;

          case 'excel':
            exportEnvironmentalDataToExcel(selectedVariables, `variables_ambientales_${timestamp}.xlsx`, language);
            toast.success(language === 'es' ? 'Excel generado exitosamente' : 'Excel generated successfully');
            break;

          case 'csv':
            exportEnvironmentalDataToCSV(selectedVariables, `variables_ambientales_${timestamp}.csv`, language);
            toast.success(language === 'es' ? 'CSV generado exitosamente' : 'CSV generated successfully');
            break;

          case 'geojson':
            toast.error(language === 'es' ? 'GeoJSON no disponible para variables' : 'GeoJSON not available for variables');
            break;
        }
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error(language === 'es' ? 'Error al generar el reporte' : 'Error generating report');
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredThreats = getFilteredThreats();

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('reports.title')}</h1>
        <p className="text-muted-foreground mt-1">
          Genere reportes personalizados y exporte datos en múltiples formatos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de configuración */}
        <div className="lg:col-span-1 space-y-6">
          {/* Tipo de reporte */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('reports.reportType')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Button
                  variant={reportType === 'threats' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setReportType('threats')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Reporte de Amenazas
                </Button>
                <Button
                  variant={reportType === 'environmental' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setReportType('environmental')}
                >
                  <Table className="h-4 w-4 mr-2" />
                  Datos Ambientales
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Formato de exportación */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('reports.exportFormat')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={exportFormat} onValueChange={(value: typeof exportFormat) => setExportFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      PDF
                    </div>
                  </SelectItem>
                  <SelectItem value="excel">
                    <div className="flex items-center gap-2">
                      <Table className="h-4 w-4" />
                      Excel (.xlsx)
                    </div>
                  </SelectItem>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      CSV
                    </div>
                  </SelectItem>
                  {reportType === 'threats' && (
                    <SelectItem value="geojson">
                      <div className="flex items-center gap-2">
                        <FileJson className="h-4 w-4" />
                        GeoJSON
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Filtros */}
          {reportType === 'threats' ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tipos de Amenaza</CardTitle>
                  <CardDescription className="text-xs">
                    Dejar vacío para incluir todos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(THREAT_TYPES).map(([key, meta]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`threat-${key}`}
                        checked={selectedThreatTypes.includes(key as ThreatType)}
                        onCheckedChange={() => handleThreatTypeToggle(key as ThreatType)}
                      />
                      <Label htmlFor={`threat-${key}`} className="text-sm cursor-pointer">
                        {meta.icon} {language === 'es' ? meta.label : meta.labelEn}
                      </Label>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Niveles de Severidad</CardTitle>
                  <CardDescription className="text-xs">
                    Dejar vacío para incluir todos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(SEVERITY_LEVELS).map(([key, meta]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`severity-${key}`}
                        checked={selectedSeverities.includes(key as SeverityLevel)}
                        onCheckedChange={() => handleSeverityToggle(key as SeverityLevel)}
                      />
                      <Label htmlFor={`severity-${key}`} className="text-sm cursor-pointer">
                        {language === 'es' ? meta.label : meta.labelEn}
                      </Label>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Variables Ambientales</CardTitle>
                <CardDescription className="text-xs">
                  Seleccione al menos una variable
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(ENVIRONMENTAL_VARIABLES).slice(0, 8).map(([key, meta]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`var-${key}`}
                      checked={selectedVariables.includes(key as EnvironmentalVariable)}
                      onCheckedChange={() => handleVariableToggle(key as EnvironmentalVariable)}
                    />
                    <Label htmlFor={`var-${key}`} className="text-sm cursor-pointer">
                      {language === 'es' ? meta.label : meta.labelEn}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Botón de generación */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleGenerateReport}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {language === 'es' ? 'Generando...' : 'Generating...'}
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                {t('reports.generate')}
              </>
            )}
          </Button>
        </div>

        {/* Vista previa */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.preview')}</CardTitle>
              <CardDescription>
                Vista previa del reporte con los filtros seleccionados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportType === 'threats' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b">
                    <div>
                      <h3 className="text-lg font-semibold">Reporte de Amenazas Ambientales</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(), 'PPP', { locale: language === 'es' ? es : enUS })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{filteredThreats.length}</p>
                      <p className="text-sm text-muted-foreground">
                        {language === 'es' ? 'Amenazas' : 'Threats'}
                      </p>
                    </div>
                  </div>

                  {filteredThreats.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">
                        {language === 'es'
                          ? 'No hay amenazas que coincidan con los filtros seleccionados'
                          : 'No threats match the selected filters'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {filteredThreats.slice(0, 5).map((threat) => (
                          <div key={threat.id} className="p-4 border rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-lg">{THREAT_TYPES[threat.type].icon}</span>
                                  <span className="font-medium">
                                    {language === 'es'
                                      ? THREAT_TYPES[threat.type].label
                                      : THREAT_TYPES[threat.type].labelEn}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {threat.description}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  {threat.location.address}
                                </p>
                              </div>
                              <div
                                className="px-2 py-1 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: SEVERITY_LEVELS[threat.severity].bgColor,
                                  color: SEVERITY_LEVELS[threat.severity].color,
                                }}
                              >
                                {language === 'es'
                                  ? SEVERITY_LEVELS[threat.severity].label
                                  : SEVERITY_LEVELS[threat.severity].labelEn}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {filteredThreats.length > 5 && (
                        <p className="text-sm text-muted-foreground text-center pt-4">
                          {language === 'es' ? 'Y' : 'And'} {filteredThreats.length - 5}{' '}
                          {language === 'es' ? 'amenazas más...' : 'more threats...'}
                        </p>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="pb-4 border-b">
                    <h3 className="text-lg font-semibold">Datos de Variables Ambientales</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(), 'PPP', { locale: language === 'es' ? es : enUS })}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {selectedVariables.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Seleccione al menos una variable ambiental para generar el reporte
                      </p>
                    ) : (
                      selectedVariables.map((variable) => (
                        <div key={variable} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: ENVIRONMENTAL_VARIABLES[variable].color }}
                              />
                              <span className="font-medium">
                                {language === 'es'
                                  ? ENVIRONMENTAL_VARIABLES[variable].label
                                  : ENVIRONMENTAL_VARIABLES[variable].labelEn}
                              </span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {ENVIRONMENTAL_VARIABLES[variable].unit}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </>
  );
}