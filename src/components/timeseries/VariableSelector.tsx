// ============================================================================
// COMPONENTE: SELECTOR DE VARIABLES
// ============================================================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { EnvironmentalVariable } from '@/types';
import { ENVIRONMENTAL_VARIABLES } from '@/lib/constants';
import { useLanguage } from '@/contexts/LanguageContext';

interface VariableSelectorProps {
  selectedVariable: EnvironmentalVariable;
  onVariableChange: (variable: EnvironmentalVariable) => void;
}

export const VariableSelector: React.FC<VariableSelectorProps> = ({
  selectedVariable,
  onVariableChange,
}) => {
  const { language } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Variables Ambientales</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedVariable}
          onValueChange={(value) => onVariableChange(value as EnvironmentalVariable)}
        >
          <div className="space-y-3">
            {Object.entries(ENVIRONMENTAL_VARIABLES).map(([key, meta]) => (
              <div key={key} className="flex items-center space-x-2">
                <RadioGroupItem value={key} id={key} />
                <Label htmlFor={key} className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      {language === 'es' ? meta.label : meta.labelEn}
                    </span>
                    <span className="text-xs text-muted-foreground">{meta.unit}</span>
                  </div>
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
};