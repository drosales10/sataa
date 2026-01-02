// ============================================================================
// COMPONENTE: GRÁFICO DE SERIES TEMPORALES
// ============================================================================

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EnvironmentalVariable } from '@/types';
import { ENVIRONMENTAL_VARIABLES } from '@/lib/constants';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

interface TimeSeriesChartProps {
  data: Array<{ timestamp: string; value: number }>;
  variable: EnvironmentalVariable;
  comparisonData?: Array<{ timestamp: string; value: number }>;
  anomalies?: Array<{ timestamp: string; value: number }>;
}

interface DotProps {
  cx?: number;
  cy?: number;
  payload?: {
    isAnomaly?: boolean;
  };
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  data,
  variable,
  comparisonData,
  anomalies,
}) => {
  const { language } = useLanguage();
  const varMeta = ENVIRONMENTAL_VARIABLES[variable];

  // Preparar datos para el gráfico
  const chartData = data.map((point, index) => ({
    date: format(new Date(point.timestamp), 'MMM dd', {
      locale: language === 'es' ? es : enUS,
    }),
    value: point.value,
    comparison: comparisonData?.[index]?.value,
    isAnomaly: anomalies?.some(a => a.timestamp === point.timestamp),
  }));

  // Calcular estadísticas
  const values = data.map(d => d.value);
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  const max = Math.max(...values);
  const min = Math.min(...values);

  const renderCustomDot = (props: DotProps & { key?: string | number }) => {
    const { cx, cy, payload, key } = props;
    if (payload?.isAnomaly && cx !== undefined && cy !== undefined) {
      return (
        <circle
          key={key}
          cx={cx}
          cy={cy}
          r={6}
          fill="#D32F2F"
          stroke="#fff"
          strokeWidth={2}
        />
      );
    }
    return <circle key={key} cx={cx} cy={cy} r={3} fill="#8884d8" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            {language === 'es' ? varMeta.label : varMeta.labelEn}
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {varMeta.unit}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '8px',
              }}
            />
            <Legend />
            
            {/* Línea de promedio */}
            <ReferenceLine
              y={average}
              stroke="#666"
              strokeDasharray="5 5"
              label={{ value: `Promedio: ${average.toFixed(2)}`, position: 'right' }}
            />
            
            {/* Línea principal */}
            <Line
              type="monotone"
              dataKey="value"
              stroke={varMeta.color}
              strokeWidth={2}
              dot={renderCustomDot}
              name={language === 'es' ? 'Actual' : 'Current'}
            />
            
            {/* Línea de comparación */}
            {comparisonData && (
              <Line
                type="monotone"
                dataKey="comparison"
                stroke="#999"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name={language === 'es' ? 'Año Anterior' : 'Previous Year'}
              />
            )}
          </LineChart>
        </ResponsiveContainer>

        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Promedio</p>
            <p className="text-lg font-semibold">{average.toFixed(2)} {varMeta.unit}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Máximo</p>
            <p className="text-lg font-semibold">{max.toFixed(2)} {varMeta.unit}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Mínimo</p>
            <p className="text-lg font-semibold">{min.toFixed(2)} {varMeta.unit}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};