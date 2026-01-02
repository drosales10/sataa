// ============================================================================
// COMPONENTE: CONTROL DE CAPAS
// ============================================================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useMap } from '@/contexts/MapContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layers } from 'lucide-react';

export const LayerControl: React.FC = () => {
  const { layers, toggleLayer, setLayerOpacity } = useMap();
  const { t } = useLanguage();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="h-4 w-4" />
          {t('map.layers')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {layers.map((layer) => (
          <div key={layer.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={`layer-${layer.id}`} className="text-sm font-normal">
                {layer.name}
              </Label>
              <Switch
                id={`layer-${layer.id}`}
                checked={layer.visible}
                onCheckedChange={() => toggleLayer(layer.id)}
              />
            </div>
            {layer.visible && (
              <div className="pl-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Opacidad:</span>
                  <Slider
                    value={[layer.opacity * 100]}
                    onValueChange={(value) => setLayerOpacity(layer.id, value[0] / 100)}
                    max={100}
                    step={10}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-8">
                    {Math.round(layer.opacity * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};