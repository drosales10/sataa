// ============================================================================
// PÁGINA: DASHBOARD PRINCIPAL
// ============================================================================

import { useLanguage } from '@/contexts/LanguageContext';
import { useThreats } from '@/hooks/useThreats';
import { useAlerts } from '@/hooks/useAlerts';
import { Navbar } from '@/components/layout/Navbar';
import { KPICard } from '@/components/dashboard/KPICard';
import { AlertPanel } from '@/components/dashboard/AlertPanel';
import { ThreatsByTypeChart, ThreatsBySeverityChart } from '@/components/dashboard/StatisticsChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { mockKPIs } from '@/data/mockKPIs';
import { Activity, AlertTriangle, CheckCircle, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Index() {
  const { t } = useLanguage();
  const { threats } = useThreats();
  const { alerts } = useAlerts();

  const activeThreats = threats.filter(t => t.status !== 'RESOLVED' && t.status !== 'FALSE_ALARM');
  const resolvedThreats = threats.filter(t => t.status === 'RESOLVED');
  const activeAlerts = alerts.filter(a => a.status !== 'RESOLVED');

  const summaryStats = [
    {
      title: t('dashboard.activeThreats'),
      value: activeThreats.length,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: t('dashboard.resolvedThreats'),
      value: resolvedThreats.length,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: t('dashboard.activeMonitors'),
      value: 24,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: t('dashboard.recentAlerts'),
      value: activeAlerts.length,
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground mt-1">
          Sistema de Monitoreo y Evaluación Geoespacial
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* KPIs */}
      <div>
        <h2 className="text-xl font-semibold mb-4">{t('dashboard.kpis')}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mockKPIs.map((kpi) => (
            <KPICard key={kpi.id} kpi={kpi} />
          ))}
        </div>
      </div>

      {/* Charts and Alerts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ThreatsByTypeChart />
        <ThreatsBySeverityChart />
      </div>

      {/* Recent Activity and Alerts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentActivity />
        <AlertPanel />
      </div>
      </div>
    </>
  );
}