// ============================================================================
// COMPONENTE: PANEL DE ALERTAS
// ============================================================================

import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAlerts } from '@/hooks/useAlerts';
import { useLanguage } from '@/contexts/LanguageContext';
import { ALERT_PRIORITIES } from '@/lib/constants';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

export const AlertPanel: React.FC = () => {
  const { alerts, isLoading, acknowledgeAlert } = useAlerts();
  const { t, language } = useLanguage();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.recentAlerts')}</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  const activeAlerts = alerts.filter(a => a.status !== 'RESOLVED').slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('dashboard.recentAlerts')}</CardTitle>
        <Badge variant="destructive">{activeAlerts.length}</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activeAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-600" />
              <p>No hay alertas activas</p>
            </div>
          ) : (
            activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <AlertTriangle
                  className="h-5 w-5 mt-0.5 flex-shrink-0"
                  style={{ color: ALERT_PRIORITIES[alert.priority].color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: ALERT_PRIORITIES[alert.priority].color,
                        color: ALERT_PRIORITIES[alert.priority].color,
                      }}
                    >
                      {language === 'es'
                        ? ALERT_PRIORITIES[alert.priority].label
                        : ALERT_PRIORITIES[alert.priority].labelEn}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(alert.createdAt), {
                        addSuffix: true,
                        locale: language === 'es' ? es : enUS,
                      })}
                    </span>
                  </div>
                  <p className="text-sm">{alert.message}</p>
                  {alert.status === 'CREATED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => acknowledgeAlert(alert.id)}
                    >
                      {t('alerts.acknowledge')}
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};