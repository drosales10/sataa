// ============================================================================
// PÁGINA: CONFIGURACIÓN DE USUARIO
// ============================================================================

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { User, Save, Bell, Lock, Globe, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Settings() {
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  // Estado del formulario de perfil
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    institution: user?.institution || '',
    community: user?.community || '',
    bio: '',
  });

  // Estado de notificaciones
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    alertNotifications: true,
    reportNotifications: false,
    weeklyDigest: true,
  });

  const handleProfileUpdate = async () => {
    setIsLoading(true);
    try {
      // Simular actualización
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // En producción, aquí se haría la llamada a Supabase
      // await supabase.from('users').update(profileData).eq('id', user?.id);
      
      // Actualizar localStorage temporalmente
      const updatedUser = { ...user, ...profileData };
      localStorage.setItem('smyeg-user', JSON.stringify(updatedUser));
      
      toast.success(
        language === 'es' 
          ? 'Perfil actualizado exitosamente' 
          : 'Profile updated successfully'
      );
    } catch (error) {
      toast.error(
        language === 'es' 
          ? 'Error al actualizar el perfil' 
          : 'Error updating profile'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationsUpdate = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Guardar preferencias en localStorage
      localStorage.setItem('smyeg-notifications', JSON.stringify(notifications));
      
      toast.success(
        language === 'es' 
          ? 'Preferencias guardadas' 
          : 'Preferences saved'
      );
    } catch (error) {
      toast.error(
        language === 'es' 
          ? 'Error al guardar preferencias' 
          : 'Error saving preferences'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">
              {language === 'es' ? 'Configuración' : 'Settings'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'es' 
                ? 'Administra tu cuenta y preferencias' 
                : 'Manage your account and preferences'}
            </p>
          </div>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                {language === 'es' ? 'Perfil' : 'Profile'}
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="h-4 w-4 mr-2" />
                {language === 'es' ? 'Notificaciones' : 'Notifications'}
              </TabsTrigger>
              <TabsTrigger value="language">
                <Globe className="h-4 w-4 mr-2" />
                {language === 'es' ? 'Idioma' : 'Language'}
              </TabsTrigger>
              <TabsTrigger value="security">
                <Shield className="h-4 w-4 mr-2" />
                {language === 'es' ? 'Seguridad' : 'Security'}
              </TabsTrigger>
            </TabsList>

            {/* Perfil */}
            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {language === 'es' ? 'Información del Perfil' : 'Profile Information'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'es' 
                      ? 'Actualiza tu información personal' 
                      : 'Update your personal information'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback>
                        {user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Button variant="outline" size="sm">
                        {language === 'es' ? 'Cambiar Avatar' : 'Change Avatar'}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG. Max 2MB
                      </p>
                    </div>
                  </div>

                  {/* Nombre */}
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      {language === 'es' ? 'Nombre Completo' : 'Full Name'}
                    </Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      {language === 'es' ? 'Correo Electrónico' : 'Email'}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">
                      {language === 'es' 
                        ? 'El email no puede ser modificado' 
                        : 'Email cannot be changed'}
                    </p>
                  </div>

                  {/* Institución / Comunidad */}
                  {user?.role !== 'COMMUNITY_MONITOR' ? (
                    <div className="space-y-2">
                      <Label htmlFor="institution">
                        {language === 'es' ? 'Institución' : 'Institution'}
                      </Label>
                      <Input
                        id="institution"
                        value={profileData.institution}
                        onChange={(e) => setProfileData({ ...profileData, institution: e.target.value })}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="community">
                        {language === 'es' ? 'Comunidad' : 'Community'}
                      </Label>
                      <Input
                        id="community"
                        value={profileData.community}
                        onChange={(e) => setProfileData({ ...profileData, community: e.target.value })}
                      />
                    </div>
                  )}

                  {/* Biografía */}
                  <div className="space-y-2">
                    <Label htmlFor="bio">
                      {language === 'es' ? 'Biografía' : 'Bio'}
                    </Label>
                    <Textarea
                      id="bio"
                      placeholder={language === 'es' ? 'Cuéntanos sobre ti...' : 'Tell us about yourself...'}
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      rows={4}
                    />
                  </div>

                  {/* Rol (Solo lectura) */}
                  <div className="space-y-2">
                    <Label>
                      {language === 'es' ? 'Rol' : 'Role'}
                    </Label>
                    <Input value={user?.role} disabled />
                  </div>

                  <Button onClick={handleProfileUpdate} disabled={isLoading} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading 
                      ? (language === 'es' ? 'Guardando...' : 'Saving...') 
                      : (language === 'es' ? 'Guardar Cambios' : 'Save Changes')}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notificaciones */}
            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {language === 'es' ? 'Preferencias de Notificaciones' : 'Notification Preferences'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'es' 
                      ? 'Configura cómo deseas recibir notificaciones' 
                      : 'Configure how you want to receive notifications'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>
                        {language === 'es' ? 'Notificaciones por Email' : 'Email Notifications'}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {language === 'es' 
                          ? 'Recibe actualizaciones en tu correo' 
                          : 'Receive updates in your email'}
                      </p>
                    </div>
                    <Switch
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, emailNotifications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>
                        {language === 'es' ? 'Alertas de Amenazas' : 'Threat Alerts'}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {language === 'es' 
                          ? 'Notificaciones inmediatas de amenazas' 
                          : 'Immediate threat notifications'}
                      </p>
                    </div>
                    <Switch
                      checked={notifications.alertNotifications}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, alertNotifications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>
                        {language === 'es' ? 'Reportes Nuevos' : 'New Reports'}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {language === 'es' 
                          ? 'Notificaciones de nuevos reportes' 
                          : 'Notifications of new reports'}
                      </p>
                    </div>
                    <Switch
                      checked={notifications.reportNotifications}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, reportNotifications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>
                        {language === 'es' ? 'Resumen Semanal' : 'Weekly Digest'}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {language === 'es' 
                          ? 'Resumen semanal de actividades' 
                          : 'Weekly activity summary'}
                      </p>
                    </div>
                    <Switch
                      checked={notifications.weeklyDigest}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, weeklyDigest: checked })
                      }
                    />
                  </div>

                  <Button onClick={handleNotificationsUpdate} disabled={isLoading} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    {language === 'es' ? 'Guardar Preferencias' : 'Save Preferences'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Idioma */}
            <TabsContent value="language" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {language === 'es' ? 'Preferencias de Idioma' : 'Language Preferences'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'es' 
                      ? 'Selecciona el idioma de la interfaz' 
                      : 'Select interface language'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>
                      {language === 'es' ? 'Idioma de la Aplicación' : 'Application Language'}
                    </Label>
                    <Select value={language} onValueChange={(value: 'es' | 'en') => setLanguage(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="es">🇪🇸 Español</SelectItem>
                        <SelectItem value="en">🇬🇧 English</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      {language === 'es' 
                        ? 'Los cambios se aplicarán inmediatamente' 
                        : 'Changes will apply immediately'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Seguridad */}
            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {language === 'es' ? 'Seguridad de la Cuenta' : 'Account Security'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'es' 
                      ? 'Administra la seguridad de tu cuenta' 
                      : 'Manage your account security'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">
                      {language === 'es' ? 'Cambiar Contraseña' : 'Change Password'}
                    </h4>
                    <Button variant="outline">
                      <Lock className="h-4 w-4 mr-2" />
                      {language === 'es' ? 'Actualizar Contraseña' : 'Update Password'}
                    </Button>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-2">
                      {language === 'es' ? 'Autenticación de Dos Factores' : 'Two-Factor Authentication'}  
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {language === 'es' 
                        ? 'Agrega una capa adicional de seguridad' 
                        : 'Add an extra layer of security'}
                    </p>
                    <Button variant="outline">
                      {language === 'es' ? 'Configurar 2FA' : 'Setup 2FA'}
                    </Button>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-2 text-red-600">
                      {language === 'es' ? 'Zona Peligrosa' : 'Danger Zone'}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {language === 'es' 
                        ? 'Estas acciones son permanentes' 
                        : 'These actions are permanent'}
                    </p>
                    <Button variant="destructive">
                      {language === 'es' ? 'Eliminar Cuenta' : 'Delete Account'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
