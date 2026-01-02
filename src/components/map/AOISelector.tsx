import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ABRAESelector } from './ABRAESelector';
import { useMap } from '@/contexts/MapContext';
import { Pencil, Map } from 'lucide-react';

export const AOISelector: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'draw' | 'abrae'>('draw');
  const { aoi, setAOI, setAOISelectionMode } = useMap();

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'draw' | 'abrae');
    setAOISelectionMode(value as 'draw' | 'abrae');
  };

  const handleClearAOI = () => {
    setAOI(null);
    setAOISelectionMode(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selección de Área de Interés (AOI)</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="draw">
              <Pencil className="w-4 h-4 mr-2" />
              Dibujar
            </TabsTrigger>
            <TabsTrigger value="abrae">
              <Map className="w-4 h-4 mr-2" />
              ABRAE
            </TabsTrigger>
          </TabsList>

          <TabsContent value="draw">
            <div className="py-4 text-center text-muted-foreground">
              <p className="mb-2">Usa las herramientas de dibujo en el mapa</p>
              <p className="text-sm">Dibuja un polígono o rectángulo para definir tu área de interés</p>
            </div>
          </TabsContent>

          <TabsContent value="abrae">
            <ABRAESelector />
          </TabsContent>
        </Tabs>

        {aoi && (
          <div className="mt-4 flex items-center justify-between p-3 bg-muted rounded-md">
            <div>
              <p className="text-sm font-medium">
                {aoi.name || 'Área dibujada'}
              </p>
              <p className="text-xs text-muted-foreground">
                {aoi.area?.toFixed(2)} hectáreas
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleClearAOI}>
              Limpiar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
