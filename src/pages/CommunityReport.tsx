// ============================================================================
// PÁGINA: REPORTE COMUNITARIO
// ============================================================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { THREAT_TYPES, SEVERITY_LEVELS } from '@/lib/constants';
import { ThreatType, SeverityLevel } from '@/types';
import { Shield, CheckCircle, AlertTriangle, Upload, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CommunityReport() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    type: '' as ThreatType | '',
    severity: '' as SeverityLevel | '',
    latitude: '',
    longitude: '',
    description: '',
    anonymous: false,
  });
  
  const [images, setImages] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verificar que el usuario sea monitor comunitario
  if (user?.role !== 'COMMUNITY_MONITOR') {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Esta página solo está disponible para Monitores Comunitarios.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 5);
      setImages(files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simular envío
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setSubmitted(true);
    setIsSubmitting(false);

    // Redirigir después de 3 segundos
    setTimeout(() => {
      navigate('/');
    }, 3000);
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  if (submitted) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold">¡Reporte Enviado!</h2>
              <p className="text-muted-foreground">
                Su reporte ha sido recibido de forma segura y confidencial. 
                Las autoridades competentes han sido notificadas.
              </p>
              <p className="text-sm text-muted-foreground">
                Redirigiendo al panel principal...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('nav.communityReport')}</h1>
        <p className="text-muted-foreground mt-1">
          Formulario seguro y confidencial para reportar amenazas ambientales
        </p>
      </div>

      {/* Alerta de confidencialidad */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Confidencialidad Garantizada:</strong> Su identidad está protegida. 
          Este reporte es anónimo y seguro. La información será utilizada únicamente 
          para la gestión de amenazas ambientales.
        </AlertDescription>
      </Alert>

      {/* Formulario */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario principal */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información de la Amenaza</CardTitle>
                <CardDescription>
                  Complete los campos requeridos para reportar la amenaza
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tipo de amenaza */}
                <div className="space-y-2">
                  <Label htmlFor="type">
                    Tipo de Amenaza <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as ThreatType })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione el tipo de amenaza" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(THREAT_TYPES).map(([key, meta]) => (
                        <SelectItem key={key} value={key}>
                          {meta.icon} {language === 'es' ? meta.label : meta.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Nivel de severidad */}
                <div className="space-y-2">
                  <Label htmlFor="severity">
                    Nivel de Severidad <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value) => setFormData({ ...formData, severity: value as SeverityLevel })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione el nivel de severidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SEVERITY_LEVELS).map(([key, meta]) => (
                        <SelectItem key={key} value={key}>
                          {language === 'es' ? meta.label : meta.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Ubicación */}
                <div className="space-y-2">
                  <Label>
                    Ubicación <span className="text-red-600">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Latitud"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      required
                    />
                    <Input
                      placeholder="Longitud"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGetLocation}
                    className="w-full"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Usar mi ubicación actual
                  </Button>
                </div>

                {/* Descripción */}
                <div className="space-y-2">
                  <Label htmlFor="description">
                    Descripción <span className="text-red-600">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describa la amenaza con el mayor detalle posible..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={6}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.description.length} / 1000 caracteres
                  </p>
                </div>

                {/* Imágenes */}
                <div className="space-y-2">
                  <Label htmlFor="images">Evidencia Fotográfica (Opcional)</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <Input
                      id="images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <Label htmlFor="images" className="cursor-pointer">
                      <span className="text-sm text-primary hover:underline">
                        Haga clic para seleccionar imágenes
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        Máximo 5 imágenes, hasta 5MB cada una
                      </p>
                    </Label>
                    {images.length > 0 && (
                      <div className="mt-3 text-sm">
                        {images.length} imagen(es) seleccionada(s)
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panel lateral */}
          <div className="lg:col-span-1 space-y-6">
            {/* Información del monitor */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Monitor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>Nombre:</strong> {user.name}</p>
                  <p><strong>Comunidad:</strong> {user.community}</p>
                  <p className="text-xs text-muted-foreground pt-2">
                    Su identidad está protegida y solo será visible para 
                    administradores autorizados.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Guía rápida */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Guía Rápida</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="text-sm space-y-2 list-decimal list-inside">
                  <li>Seleccione el tipo de amenaza</li>
                  <li>Indique el nivel de severidad</li>
                  <li>Proporcione la ubicación exacta</li>
                  <li>Describa la situación detalladamente</li>
                  <li>Adjunte fotos si es posible</li>
                  <li>Envíe el reporte</li>
                </ol>
              </CardContent>
            </Card>

            {/* Botón de envío */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting || !formData.type || !formData.severity || !formData.latitude || !formData.longitude || !formData.description}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Reporte'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}