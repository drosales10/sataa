// ============================================================================
// COMPONENTE: ACTIVIDAD RECIENTE
// ============================================================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useThreats } from '@/hooks/useThreats';
import { useLanguage } from '@/contexts/LanguageContext';
import { THREAT_TYPES, THREAT_STATUS } from '@/lib/constants';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { Clock, MapPin } from 'lucide-react';

export const RecentActivity: React.FC = () => {
  const { threats } = useThreats();
  const { t, language } = useLanguage();

  const recentThreats = [...threats]
    .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentThreats.map((threat) => (
            <div
              key={threat.id}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <div className="text-2xl flex-shrink-0">
                {THREAT_TYPES[threat.type].icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-medium">
                    {language === 'es'
                      ? THREAT_TYPES[threat.type].label
                      : THREAT_TYPES[threat.type].labelEn}
                  </span>
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: THREAT_STATUS[threat.status].color,
                      color: THREAT_STATUS[threat.status].color,
                    }}
                  >
                    {language === 'es'
                      ? THREAT_STATUS[threat.status].label
                      : THREAT_STATUS[threat.status].labelEn}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {threat.description}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(threat.reportedAt), {
                      addSuffix: true,
                      locale: language === 'es' ? es : enUS,
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {threat.location.address}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};