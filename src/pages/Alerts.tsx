// ============================================================================
// PÁGINA: SISTEMA DE ALERTAS TEMPRANAS
// ============================================================================

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAlerts } from '@/hooks/useAlerts';
import { THREAT_TYPES, PRIORITY_LEVELS } from '@/lib/constants';
import { ThreatType, PriorityLevel } from '@/types';
import { AlertTriangle, CheckCircle, Clock, TrendingUp, Plus, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { toast } from 'sonner';

interface NewAlertForm {
  title: string;
  type: ThreatType | '';
  priority: PriorityLevel | '';
  location: string;
  latitude: string;
  longitude: string;
  description: string;
  affectedArea: string;
  populationAtRisk: string;
}

export default function Alerts() {
  const { t, language } = useLanguage();
  const { alerts, addAlert, acknowledgeAlert, resolveAlert, escalateAlert } = useAlerts();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<NewAlertForm>({
    title: '',
    type: '',
    priority: '',
    location: '',
    latitude: '',
    longitude: '',
    description: '',
    affectedArea: '',
    populationAtRisk: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof NewAlertForm, string>>>({});

  // Simular rol de usuario (en producción vendría del contexto de autenticación)
  const userRole = 'RISK_MANAGER'; // Opciones: RISK_MANAGER, RESEARCHER, COMMUNITY_MONITOR, PUBLIC

  const canCreateAlert = userRole === 'RISK_MANAGER' || userRole === 'RESEARCHER';

  const activeAlerts = alerts.filter(alert => alert.status === 'ACTIVE');
  const resolvedAlerts = alerts.filter(alert => alert.status === 'RESOLVED');

  const stats = {
    total: alerts.length,
    active: activeAlerts.length,
    critical: alerts.filter(a => a.priority === 'CRITICAL' && a.status === 'ACTIVE').length,
    resolved: resolvedAlerts.length,
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof NewAlertForm, string>> = {};

    if (!formData.title.trim()) {
      errors.title = language === 'es' ? 'El título es requerido' : 'Title is required';
    }

    if (!formData.type) {
      errors.type = language === 'es' ? 'Seleccione un tipo de amenaza' : 'Select a threat type';
    }

    if (!formData.priority) {
      errors.priority = language === 'es' ? 'Seleccione una prioridad' : 'Select a priority';
    }

    if (!formData.location.trim()) {
      errors.location = language === 'es' ? 'La ubicación es requerida' : 'Location is required';
    }

    if (!formData.description.trim()) {
      errors.description = language === 'es' ? 'La descripción es requerida' : 'Description is required';
    }

    // Validar coordenadas si se proporcionan
    if (formData.latitude && (isNaN(Number(formData.latitude)) || Number(formData.latitude) < -90 || Number(formData.latitude) > 90)) {
      errors.latitude = language === 'es' ? 'Latitud inválida (-90 a 90)' : 'Invalid latitude (-90 to 90)';
    }

    if (formData.longitude && (isNaN(Number(formData.longitude)) || Number(formData.longitude) < -180 || Number(formData.longitude) > 180)) {
      errors.longitude = language === 'es' ? 'Longitud inválida (-180 a 180)' : 'Invalid longitude (-180 to 180)';
    }

    // Validar números positivos
    if (formData.affectedArea && (isNaN(Number(formData.affectedArea)) || Number(formData.affectedArea) < 0)) {
      errors.affectedArea = language === 'es' ? 'Debe ser un número positivo' : 'Must be a positive number';
    }

    if (formData.populationAtRisk && (isNaN(Number(formData.populationAtRisk)) || Number(formData.populationAtRisk) < 0)) {
      errors.populationAtRisk = language === 'es' ? 'Debe ser un número positivo' : 'Must be a positive number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error(language === 'es' ? 'Por favor corrija los errores del formulario' : 'Please fix form errors');
      return;
    }

    setIsSubmitting(true);

    try {
      const newAlert = {
        id: `alert-${Date.now()}`,
        title: formData.title,
        type: formData.type as ThreatType,
        priority: formData.priority as PriorityLevel,
        status: 'ACTIVE' as const,
        location: formData.location,
        coordinates: formData.latitude && formData.longitude
          ? {
              latitude: Number(formData.latitude),
              longitude: Number(formData.longitude),
            }
          : undefined,
        description: formData.description,
        affectedArea: formData.affectedArea ? Number(formData.affectedArea) : undefined,
        populationAtRisk: formData.populationAtRisk ? Number(formData.populationAtRisk) : undefined,
        createdAt: new Date().toISOString(),
        acknowledged: false,
      };

      addAlert(newAlert);

      toast.success(language === 'es' ? 'Alerta creada exitosamente' : 'Alert created successfully');

      // Resetear formulario
      setFormData({
        title: '',
        type: '',
        priority: '',
        location: '',
        latitude: '',
        longitude: '',
        description: '',
        affectedArea: '',
        populationAtRisk: '',
      });
      setFormErrors({});
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating alert:', error);
      toast.error(language === 'es' ? 'Error al crear la alerta' : 'Error creating alert');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof NewAlertForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo al escribir
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
      {/* Header con botón de nueva alerta */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('alerts.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {language === 'es'
              ? 'Sistema de alertas tempranas para amenazas ambientales'
              : 'Early warning system for environmental threats'}
          </p>
        </div>
        {canCreateAlert && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#2E7D32] hover:bg-[#1B5E20]">
                <Plus className="h-4 w-4 mr-2" />
                {language === 'es' ? 'Nueva Alerta' : 'New Alert'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {language === 'es' ? 'Crear Nueva Alerta' : 'Create New Alert'}
                </DialogTitle>
                <DialogDescription>
                  {language === 'es'
                    ? 'Complete el formulario para crear una nueva alerta de amenaza ambiental'
                    : 'Fill out the form to create a new environmental threat alert'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Título */}
                <div className="space-y-2">
                  <Label htmlFor="title">
                    {language === 'es' ? 'Título de la Alerta' : 'Alert Title'} *
                  </Label>
                  <Input
                    id="title"
                    placeholder={language === 'es' ? 'Ej: Incendio forestal en zona norte' : 'Ex: Forest fire in northern area'}
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={formErrors.title ? 'border-red-500' : ''}
                  />
                  {formErrors.title && (
                    <p className="text-sm text-red-500">{formErrors.title}</p>
                  )}
                </div>

                {/* Tipo de Amenaza */}
                <div className="space-y-2">
                  <Label htmlFor="type">
                    {language === 'es' ? 'Tipo de Amenaza' : 'Threat Type'} *
                  </Label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                    <SelectTrigger className={formErrors.type ? 'border-red-500' : ''}>
                      <SelectValue placeholder={language === 'es' ? 'Seleccione un tipo' : 'Select a type'} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(THREAT_TYPES).map(([key, meta]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <span>{meta.icon}</span>
                            <span>{language === 'es' ? meta.label : meta.labelEn}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.type && (
                    <p className="text-sm text-red-500">{formErrors.type}</p>
                  )}
                </div>

                {/* Nivel de Prioridad */}
                <div className="space-y-2">
                  <Label htmlFor="priority">
                    {language === 'es' ? 'Nivel de Prioridad' : 'Priority Level'} *
                  </Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                    <SelectTrigger className={formErrors.priority ? 'border-red-500' : ''}>
                      <SelectValue placeholder={language === 'es' ? 'Seleccione prioridad' : 'Select priority'} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRIORITY_LEVELS).map(([key, meta]) => (
                        <SelectItem key={key} value={key}>
                          {language === 'es' ? meta.label : meta.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.priority && (
                    <p className="text-sm text-red-500">{formErrors.priority}</p>
                  )}
                </div>

                {/* Ubicación */}
                <div className="space-y-2">
                  <Label htmlFor="location">
                    {language === 'es' ? 'Ubicación' : 'Location'} *
                  </Label>
                  <Input
                    id="location"
                    placeholder={language === 'es' ? 'Ej: Parque Nacional Volcán Poás' : 'Ex: Poás Volcano National Park'}
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className={formErrors.location ? 'border-red-500' : ''}
                  />
                  {formErrors.location && (
                    <p className="text-sm text-red-500">{formErrors.location}</p>
                  )}
                </div>

                {/* Coordenadas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">
                      {language === 'es' ? 'Latitud' : 'Latitude'}
                    </Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="0.000001"
                      placeholder="10.2027"
                      value={formData.latitude}
                      onChange={(e) => handleInputChange('latitude', e.target.value)}
                      className={formErrors.latitude ? 'border-red-500' : ''}
                    />
                    {formErrors.latitude && (
                      <p className="text-sm text-red-500">{formErrors.latitude}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">
                      {language === 'es' ? 'Longitud' : 'Longitude'}
                    </Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="0.000001"
                      placeholder="-84.2330"
                      value={formData.longitude}
                      onChange={(e) => handleInputChange('longitude', e.target.value)}
                      className={formErrors.longitude ? 'border-red-500' : ''}
                    />
                    {formErrors.longitude && (
                      <p className="text-sm text-red-500">{formErrors.longitude}</p>
                    )}
                  </div>
                </div>

                {/* Descripción */}
                <div className="space-y-2">
                  <Label htmlFor="description">
                    {language === 'es' ? 'Descripción' : 'Description'} *
                  </Label>
                  <Textarea
                    id="description"
                    placeholder={language === 'es' ? 'Describa la amenaza y sus características...' : 'Describe the threat and its characteristics...'}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className={formErrors.description ? 'border-red-500' : ''}
                    rows={4}
                  />
                  {formErrors.description && (
                    <p className="text-sm text-red-500">{formErrors.description}</p>
                  )}
                </div>

                {/* Área Afectada y Población en Riesgo */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="affectedArea">
                      {language === 'es' ? 'Área Afectada (km²)' : 'Affected Area (km²)'}
                    </Label>
                    <Input
                      id="affectedArea"
                      type="number"
                      step="0.01"
                      placeholder="15.5"
                      value={formData.affectedArea}
                      onChange={(e) => handleInputChange('affectedArea', e.target.value)}
                      className={formErrors.affectedArea ? 'border-red-500' : ''}
                    />
                    {formErrors.affectedArea && (
                      <p className="text-sm text-red-500">{formErrors.affectedArea}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="populationAtRisk">
                      {language === 'es' ? 'Población en Riesgo' : 'Population at Risk'}
                    </Label>
                    <Input
                      id="populationAtRisk"
                      type="number"
                      placeholder="500"
                      value={formData.populationAtRisk}
                      onChange={(e) => handleInputChange('populationAtRisk', e.target.value)}
                      className={formErrors.populationAtRisk ? 'border-red-500' : ''}
                    />
                    {formErrors.populationAtRisk && (
                      <p className="text-sm text-red-500">{formErrors.populationAtRisk}</p>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setFormData({
                      title: '',
                      type: '',
                      priority: '',
                      location: '',
                      latitude: '',
                      longitude: '',
                      description: '',
                      affectedArea: '',
                      populationAtRisk: '',
                    });
                    setFormErrors({});
                  }}
                  disabled={isSubmitting}
                >
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-[#2E7D32] hover:bg-[#1B5E20]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {language === 'es' ? 'Creando...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      {language === 'es' ? 'Crear Alerta' : 'Create Alert'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'es' ? 'Total de Alertas' : 'Total Alerts'}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'es' ? 'Alertas Activas' : 'Active Alerts'}
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'es' ? 'Críticas' : 'Critical'}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'es' ? 'Resueltas' : 'Resolved'}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de alertas */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">
            {language === 'es' ? 'Alertas Activas' : 'Active Alerts'} ({activeAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            {language === 'es' ? 'Historial' : 'History'} ({resolvedAlerts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-4">
          {activeAlerts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-muted-foreground">
                  {language === 'es' ? 'No hay alertas activas' : 'No active alerts'}
                </p>
              </CardContent>
            </Card>
          ) : (
            activeAlerts.map((alert) => (
              <Card key={alert.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="text-2xl">{THREAT_TYPES[alert.type].icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{alert.title}</CardTitle>
                          <Badge
                            style={{
                              backgroundColor: PRIORITY_LEVELS[alert.priority].bgColor,
                              color: PRIORITY_LEVELS[alert.priority].color,
                            }}
                          >
                            {language === 'es'
                              ? PRIORITY_LEVELS[alert.priority].label
                              : PRIORITY_LEVELS[alert.priority].labelEn}
                          </Badge>
                          {!alert.acknowledged && (
                            <Badge variant="outline" className="text-orange-600 border-orange-600">
                              {language === 'es' ? 'Sin reconocer' : 'Unacknowledged'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span>📍 {alert.location}</span>
                          {alert.affectedArea && <span>📏 {alert.affectedArea} km²</span>}
                          {alert.populationAtRisk && (
                            <span>👥 {alert.populationAtRisk.toLocaleString()} {language === 'es' ? 'personas' : 'people'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(alert.createdAt), {
                        addSuffix: true,
                        locale: language === 'es' ? es : enUS,
                      })}
                    </span>
                    <div className="flex gap-2">
                      {!alert.acknowledged && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => acknowledgeAlert(alert.id)}
                        >
                          {language === 'es' ? 'Reconocer' : 'Acknowledge'}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-600 hover:bg-green-50"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        {language === 'es' ? 'Resolver' : 'Resolve'}
                      </Button>
                      {alert.priority !== 'CRITICAL' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => escalateAlert(alert.id)}
                        >
                          {language === 'es' ? 'Escalar' : 'Escalate'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-4">
          {resolvedAlerts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {language === 'es' ? 'No hay alertas resueltas' : 'No resolved alerts'}
                </p>
              </CardContent>
            </Card>
          ) : (
            resolvedAlerts.map((alert) => (
              <Card key={alert.id} className="opacity-75">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="text-2xl">{THREAT_TYPES[alert.type].icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{alert.title}</CardTitle>
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            {language === 'es' ? 'Resuelta' : 'Resolved'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span>📍 {alert.location}</span>
                          {alert.resolvedAt && (
                            <span>
                              ✅ {language === 'es' ? 'Resuelta' : 'Resolved'}:{' '}
                              {formatDistanceToNow(new Date(alert.resolvedAt), {
                                addSuffix: true,
                                locale: language === 'es' ? es : enUS,
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
      </div>
    </>
  );
}