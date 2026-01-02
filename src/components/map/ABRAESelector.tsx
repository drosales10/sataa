import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useMap } from '@/contexts/MapContext';
import { abraeService } from '@/services/abraeService';
import { Loader2 } from 'lucide-react';
import type { AOI } from '@/types';

export const ABRAESelector: React.FC = () => {
  const { setAOI } = useMap();
  const [types, setTypes] = useState<string[]>([]);
  const [names, setNames] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedName, setSelectedName] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Cargar tipos al montar
  useEffect(() => {
    abraeService.getTypes().then(setTypes);
  }, []);

  // Cargar nombres cuando cambia el tipo
  useEffect(() => {
    if (selectedType) {
      setLoading(true);
      abraeService.getNamesByType(selectedType)
        .then(setNames)
        .finally(() => setLoading(false));
    }
  }, [selectedType]);

  const handleSelect = async () => {
    if (!selectedType || !selectedName) return;
    
    setLoading(true);
    try {
      const abrae = await abraeService.getABRAE(selectedType, selectedName);
      
      const aoi: AOI = {
        id: abrae.id,
        type: 'abrae',
        geometry: abrae.geometry,
        name: abrae.name,
        area: abrae.area,
        createdAt: new Date(),
      };
      
      setAOI(aoi);
    } catch (error) {
      console.error('Error al cargar ABRAE:', error);
      alert('Error al cargar el ABRAE seleccionado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="abrae-type">Tipo de ABRAE</Label>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger id="abrae-type">
            <SelectValue placeholder="Seleccionar tipo" />
          </SelectTrigger>
          <SelectContent>
            {types.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="abrae-name">Nombre del ABRAE</Label>
        <Select 
          value={selectedName} 
          onValueChange={setSelectedName}
          disabled={!selectedType || loading}
        >
          <SelectTrigger id="abrae-name">
            <SelectValue placeholder="Seleccionar nombre" />
          </SelectTrigger>
          <SelectContent>
            {names.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button 
        onClick={handleSelect} 
        disabled={!selectedType || !selectedName || loading}
        className="w-full"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Seleccionar ABRAE
      </Button>
    </div>
  );
};
