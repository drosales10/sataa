// ============================================================================
// PÁGINA: SERIES TEMPORALES
// ============================================================================

import { useState, useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { TimeSeriesChart } from '@/components/timeseries/TimeSeriesChart';
import { VariableSelector } from '@/components/timeseries/VariableSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { EnvironmentalVariable } from '@/types';
import { mockTimeSeriesDatasets } from '@/data/mockTimeSeries';
import { Download, AlertTriangle } from 'lucide-react';

export default function TimeSeries() {
  const { t } = useLanguage();
  const [selectedVariable, setSelectedVariable] = useState<EnvironmentalVariable>('WATER_LEVEL');
  const [showComparison, setShowComparison] = useState(false);

  // Obtener datos de la variable seleccionada
  const currentData = useMemo(() => {
    const dataset = mockTimeSeriesDatasets.find(d => d.variable === selectedVariable);
    return dataset?.data || [];
  }, [selectedVariable]);

  // Simular datos del año anterior para comparación
  const comparisonData = useMemo(() => {
    if (!showComparison) return undefined;
    return currentData.map(point => ({
      ...point,
      value: point.value * (0.95 + Math.random() * 0.1), // Variación del ±5%
    }));
  }, [currentData, showComparison]);

  // Detectar anomalías (valores fuera de 2 desviaciones estándar)
  const anomalies = useMemo(() => {
    const values = currentData.map(d => d.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return currentData.filter(point => {
      const zScore = Math.abs((point.value - mean) / stdDev);
      return zScore > 2;
    });
  }, [currentData]);

  const handleExport = () => {
    // Implementar exportación de datos
    const csv = currentData.map(d => `${d.timestamp},${d.value}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedVariable}_${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('timeSeries.title')}</h1>
          <p className="text-muted-foreground mt-1">
            Análisis temporal de variables ambientales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            {t('timeSeries.export')}
          </Button>
        </div>
      </div>

      {/* Controles */}
      <div className="flex items-center gap-4 flex-wrap">
        <Button
          variant={showComparison ? 'default' : 'outline'}
          onClick={() => setShowComparison(!showComparison)}
        >
          {t('timeSeries.compareYears')}
        </Button>
        {anomalies.length > 0 && (
          <Badge variant="destructive" className="px-3 py-1">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {anomalies.length} {t('timeSeries.anomalies')}
          </Badge>
        )}
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Selector de variables */}
        <div className="lg:col-span-1">
          <VariableSelector
            selectedVariable={selectedVariable}
            onVariableChange={setSelectedVariable}
          />
        </div>

        {/* Gráfico */}
        <div className="lg:col-span-3">
          <TimeSeriesChart
            data={currentData}
            variable={selectedVariable}
            comparisonData={comparisonData}
            anomalies={anomalies}
          />
        </div>
      </div>

      {/* Panel de anomalías */}
      {anomalies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              {t('timeSeries.anomalies')} Detectadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {anomalies.slice(0, 6).map((anomaly, index) => (
                <Card key={index} className="border-red-200">
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        {new Date(anomaly.timestamp).toLocaleDateString()}
                      </p>
                      <p className="text-2xl font-bold text-red-600">
                        {anomaly.value.toFixed(2)} {anomaly.unit}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Valor atípico detectado
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </>
  );
}