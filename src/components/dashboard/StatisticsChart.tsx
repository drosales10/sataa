// ============================================================================
// COMPONENTE: GRÁFICO DE ESTADÍSTICAS
// ============================================================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import { THREAT_TYPES, SEVERITY_LEVELS } from '@/lib/constants';
import { useThreats } from '@/hooks/useThreats';

export const ThreatsByTypeChart: React.FC = () => {
  const { threats } = useThreats();
  const { t, language } = useLanguage();

  const data = Object.entries(THREAT_TYPES).map(([type, meta]) => ({
    name: language === 'es' ? meta.label : meta.labelEn,
    count: threats.filter(t => t.type === type).length,
    color: meta.color,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.threatsByType')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#2E7D32" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export const ThreatsBySeverityChart: React.FC = () => {
  const { threats } = useThreats();
  const { t, language } = useLanguage();

  const data = Object.entries(SEVERITY_LEVELS).map(([severity, meta]) => ({
    name: language === 'es' ? meta.label : meta.labelEn,
    value: threats.filter(t => t.severity === severity).length,
    color: meta.color,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.threatsBySeverity')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};