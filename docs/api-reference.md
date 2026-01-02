# Referencia de API - Sistema SMyEG

Esta documentación describe todos los servicios y métodos disponibles para interactuar con el backend de Supabase.

---

## 📚 Índice

1. [ThreatsService](#threatsservice) - Gestión de Amenazas
2. [AlertsService](#alertsservice) - Gestión de Alertas
3. [ReportsService](#reportsservice) - Reportes Comunitarios
4. [VariablesService](#variablesservice) - Variables Ambientales
5. [Hooks de React](#hooks-de-react)
6. [Tipos de Datos](#tipos-de-datos)

---

## ThreatsService

Servicio para gestionar amenazas ambientales.

### `getAll(): Promise<Threat[]>`

Obtiene todas las amenazas ordenadas por fecha de creación (más recientes primero).

```typescript
import { ThreatsService } from '@/services/threatsService';

const threats = await ThreatsService.getAll();
console.log(threats);
```

**Retorna:** Array de objetos `Threat`

**Errores:**
- `"Supabase not configured"` - Si no hay credenciales configuradas
- Error de Supabase si falla la consulta

---

### `getById(id: string): Promise<Threat | null>`

Obtiene una amenaza específica por su ID.

```typescript
const threat = await ThreatsService.getById('uuid-here');
if (threat) {
  console.log(threat.description);
}
```

**Parámetros:**
- `id` (string): UUID de la amenaza

**Retorna:** Objeto `Threat` o `null` si no existe

---

### `create(threat): Promise<Threat>`

Crea una nueva amenaza.

```typescript
const newThreat = await ThreatsService.create({
  type: 'FOREST_FIRE',
  severity: 'HIGH',
  status: 'PENDING',
  location: 'Parque Nacional Volcán Poás',
  coordinates: { latitude: 10.2027, longitude: -84.2330 },
  description: 'Incendio forestal detectado',
  images: [],
  affectedArea: 5.5,
  populationAtRisk: 200,
});
```

**Parámetros:**
- `threat` (Omit<Threat, 'id' | 'createdAt' | 'updatedAt'>)

**Retorna:** Objeto `Threat` creado

**Requiere:** Usuario autenticado

---

### `update(id: string, updates: Partial<Threat>): Promise<Threat>`

Actualiza una amenaza existente.

```typescript
const updated = await ThreatsService.update('uuid-here', {
  status: 'VERIFIED',
  severity: 'CRITICAL',
});
```

**Parámetros:**
- `id` (string): UUID de la amenaza
- `updates` (Partial<Threat>): Campos a actualizar

**Retorna:** Objeto `Threat` actualizado

**Requiere:** Rol RESEARCHER, RISK_MANAGER o ADMIN

---

### `delete(id: string): Promise<void>`

Elimina una amenaza.

```typescript
await ThreatsService.delete('uuid-here');
```

**Parámetros:**
- `id` (string): UUID de la amenaza

**Requiere:** Rol ADMIN

---

### `getNearby(lat, lng, radiusKm): Promise<Threat[]>`

Busca amenazas cercanas a un punto dentro de un radio específico.

```typescript
const nearby = await ThreatsService.getNearby(10.2027, -84.2330, 10);
console.log(`Encontradas ${nearby.length} amenazas en 10km`);
```

**Parámetros:**
- `lat` (number): Latitud del punto central
- `lng` (number): Longitud del punto central
- `radiusKm` (number): Radio de búsqueda en kilómetros (default: 10)

**Retorna:** Array de amenazas con campo `distance_km`

---

### `getInArea(minLat, minLng, maxLat, maxLng): Promise<Threat[]>`

Busca amenazas dentro de un área rectangular (bounding box).

```typescript
const inArea = await ThreatsService.getInArea(
  10.0, -85.0,  // min lat, min lng
  11.0, -84.0   // max lat, max lng
);
```

**Parámetros:**
- `minLat`, `minLng`, `maxLat`, `maxLng` (number): Coordenadas del rectángulo

**Retorna:** Array de objetos `Threat`

---

### `subscribe(callback): Channel`

Suscribe a cambios en tiempo real en la tabla de amenazas.

```typescript
const channel = ThreatsService.subscribe((payload) => {
  console.log('Cambio detectado:', payload.eventType);
  console.log('Datos:', payload.new || payload.old);
});

// Cancelar suscripción
channel.unsubscribe();
```

**Parámetros:**
- `callback` (function): Función que recibe el payload del cambio

**Payload:**
- `eventType`: 'INSERT' | 'UPDATE' | 'DELETE'
- `new`: Datos nuevos (INSERT, UPDATE)
- `old`: Datos anteriores (DELETE, UPDATE)

---

## AlertsService

Servicio para gestionar alertas tempranas.

### `getAll(): Promise<Alert[]>`

Obtiene todas las alertas ordenadas por fecha de creación.

```typescript
import { AlertsService } from '@/services/alertsService';

const alerts = await AlertsService.getAll();
```

---

### `getById(id: string): Promise<Alert | null>`

Obtiene una alerta específica por su ID.

```typescript
const alert = await AlertsService.getById('uuid-here');
```

---

### `create(alert): Promise<Alert>`

Crea una nueva alerta.

```typescript
const newAlert = await AlertsService.create({
  title: 'Alerta Crítica: Incendio Activo',
  type: 'FOREST_FIRE',
  priority: 'CRITICAL',
  status: 'ACTIVE',
  location: 'Parque Nacional Volcán Poás',
  coordinates: { latitude: 10.2027, longitude: -84.2330 },
  description: 'Incendio en expansión. Evacuación recomendada.',
  affectedArea: 15.0,
  populationAtRisk: 500,
  acknowledged: false,
});
```

**Requiere:** Rol RISK_MANAGER, RESEARCHER o ADMIN

---

### `acknowledge(id: string): Promise<Alert>`

Marca una alerta como reconocida.

```typescript
const acknowledged = await AlertsService.acknowledge('uuid-here');
console.log('Reconocida por:', acknowledged.acknowledgedBy);
```

**Requiere:** Usuario autenticado

---

### `resolve(id: string): Promise<Alert>`

Marca una alerta como resuelta.

```typescript
const resolved = await AlertsService.resolve('uuid-here');
console.log('Resuelta en:', resolved.resolvedAt);
```

**Requiere:** Rol RISK_MANAGER o ADMIN

---

### `escalate(id: string): Promise<Alert>`

Escala la prioridad de una alerta al siguiente nivel.

```typescript
// LOW → MEDIUM → HIGH → CRITICAL
const escalated = await AlertsService.escalate('uuid-here');
console.log('Nueva prioridad:', escalated.priority);
```

**Requiere:** Rol RISK_MANAGER o ADMIN

---

### `subscribe(callback): Channel`

Suscribe a cambios en tiempo real en alertas.

```typescript
const channel = AlertsService.subscribe((payload) => {
  if (payload.eventType === 'INSERT' && payload.new.priority === 'CRITICAL') {
    // Notificar alerta crítica
    showNotification('Nueva alerta crítica!');
  }
});
```

---

## ReportsService

Servicio para gestionar reportes comunitarios.

### `getAll(): Promise<CommunityReport[]>`

Obtiene todos los reportes comunitarios.

```typescript
import { ReportsService } from '@/services/reportsService';

const reports = await ReportsService.getAll();
```

---

### `create(report): Promise<CommunityReport>`

Crea un nuevo reporte comunitario.

```typescript
const newReport = await ReportsService.create({
  threatType: 'ILLEGAL_MINING',
  location: 'Reserva Biológica',
  coordinates: { latitude: 10.3, longitude: -84.8 },
  description: 'Actividad minera detectada',
  reporterName: 'Juan Pérez',
  reporterContact: 'juan@example.com',
  images: [],
});
```

**No requiere autenticación** - Cualquiera puede reportar

---

### `verify(id: string): Promise<CommunityReport>`

Verifica un reporte comunitario.

```typescript
const verified = await ReportsService.verify('uuid-here');
console.log('Verificado por:', verified.verifiedBy);
```

**Requiere:** Rol RESEARCHER, RISK_MANAGER o ADMIN

---

### `uploadImage(file: File, reportId: string): Promise<string>`

Sube una imagen al storage y retorna la URL pública.

```typescript
const file = event.target.files[0];
const imageUrl = await ReportsService.uploadImage(file, 'report-uuid');
console.log('Imagen subida:', imageUrl);
```

**Parámetros:**
- `file` (File): Archivo de imagen
- `reportId` (string): ID del reporte asociado

**Retorna:** URL pública de la imagen

---

### `subscribe(callback): Channel`

Suscribe a cambios en tiempo real en reportes.

```typescript
const channel = ReportsService.subscribe((payload) => {
  if (payload.eventType === 'INSERT') {
    console.log('Nuevo reporte comunitario recibido');
  }
});
```

---

## VariablesService

Servicio para gestionar variables ambientales.

### `getAll(filters?): Promise<EnvironmentalData[]>`

Obtiene datos ambientales con filtros opcionales.

```typescript
import { VariablesService } from '@/services/variablesService';

const data = await VariablesService.getAll({
  variableType: 'TEMPERATURE',
  startDate: '2026-01-01',
  endDate: '2026-01-02',
  location: 'Estación Poás',
});
```

**Filtros opcionales:**
- `variableType` (string): Tipo de variable
- `startDate` (string): Fecha de inicio (ISO)
- `endDate` (string): Fecha de fin (ISO)
- `location` (string): Ubicación

---

### `getTimeSeries(variableType, location, startDate, endDate): Promise<EnvironmentalData[]>`

Obtiene serie temporal para una variable específica.

```typescript
const timeSeries = await VariablesService.getTimeSeries(
  'TEMPERATURE',
  'Estación Poás',
  '2026-01-01',
  '2026-01-07'
);

// Graficar datos
timeSeries.forEach(point => {
  console.log(point.recordedAt, point.value);
});
```

---

### `create(data): Promise<EnvironmentalData>`

Crea un nuevo registro de variable ambiental.

```typescript
const newData = await VariablesService.create({
  variableType: 'TEMPERATURE',
  value: 28.5,
  unit: '°C',
  location: 'Estación Poás',
  coordinates: { latitude: 10.2027, longitude: -84.2330 },
  sensorId: 'SENSOR-001',
  metadata: { calibrated: true },
});
```

**Requiere:** Rol RESEARCHER o ADMIN

---

### `createBatch(dataArray): Promise<EnvironmentalData[]>`

Crea múltiples registros en una sola operación (más eficiente).

```typescript
const batch = [
  { variableType: 'TEMPERATURE', value: 28.5, unit: '°C', ... },
  { variableType: 'HUMIDITY', value: 75.0, unit: '%', ... },
  { variableType: 'WIND_SPEED', value: 5.2, unit: 'm/s', ... },
];

const created = await VariablesService.createBatch(batch);
console.log(`${created.length} registros creados`);
```

---

### `getStatistics(variableType, location, startDate, endDate): Promise<Stats>`

Obtiene estadísticas agregadas para una variable.

```typescript
const stats = await VariablesService.getStatistics(
  'TEMPERATURE',
  'Estación Poás',
  '2026-01-01',
  '2026-01-07'
);

console.log('Promedio:', stats.avg);
console.log('Mínimo:', stats.min);
console.log('Máximo:', stats.max);
console.log('Cantidad:', stats.count);
```

**Retorna:**
```typescript
{
  avg: number;
  min: number;
  max: number;
  count: number;
}
```

---

### `subscribe(callback): Channel`

Suscribe a cambios en tiempo real en variables ambientales.

```typescript
const channel = VariablesService.subscribe((payload) => {
  if (payload.eventType === 'INSERT') {
    const data = payload.new;
    console.log(`Nueva lectura: ${data.variableType} = ${data.value}${data.unit}`);
  }
});
```

---

## Hooks de React

### `useThreats()`

Hook para gestionar amenazas con estado y realtime.

```typescript
import { useThreats } from '@/hooks/useSupabase';

function ThreatsPage() {
  const { threats, loading, error, refetch } = useThreats();

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {threats.map(threat => (
        <div key={threat.id}>{threat.description}</div>
      ))}
      <button onClick={refetch}>Recargar</button>
    </div>
  );
}
```

**Retorna:**
- `threats` (Threat[]): Array de amenazas
- `loading` (boolean): Estado de carga
- `error` (string | null): Mensaje de error
- `refetch` (() => Promise): Función para recargar datos

---

### `useAlerts()`

Hook para gestionar alertas con estado y realtime.

```typescript
import { useAlerts } from '@/hooks/useSupabase';

function AlertsPage() {
  const { alerts, loading, error, refetch } = useAlerts();
  
  return (
    <div>
      {alerts.filter(a => a.status === 'ACTIVE').map(alert => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </div>
  );
}
```

---

### `useCommunityReports()`

Hook para gestionar reportes comunitarios.

```typescript
import { useCommunityReports } from '@/hooks/useSupabase';

function ReportsPage() {
  const { reports, loading, error, refetch } = useCommunityReports();
  
  return <div>{/* Renderizar reportes */}</div>;
}
```

---

### `useAuth()`

Hook para gestionar autenticación.

```typescript
import { useAuth } from '@/hooks/useSupabase';

function LoginPage() {
  const { user, loading, signIn, signUp, signOut, resetPassword } = useAuth();

  const handleLogin = async () => {
    try {
      await signIn('email@example.com', 'password');
    } catch (error) {
      console.error('Error de login:', error);
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (user) return <div>Bienvenido, {user.email}</div>;

  return <button onClick={handleLogin}>Iniciar Sesión</button>;
}
```

**Métodos:**
- `signIn(email, password)`: Iniciar sesión
- `signUp(email, password, fullName)`: Registrarse
- `signOut()`: Cerrar sesión
- `resetPassword(email)`: Recuperar contraseña

---

## Tipos de Datos

### `Threat`

```typescript
interface Threat {
  id: string;
  type: ThreatType;
  severity: SeverityLevel;
  status: ThreatStatus;
  location: string;
  coordinates: { latitude: number; longitude: number };
  description: string;
  reportedBy: string;
  verifiedBy?: string;
  createdAt: string;
  updatedAt: string;
  images: string[];
  affectedArea?: number;
  populationAtRisk?: number;
}
```

### `Alert`

```typescript
interface Alert {
  id: string;
  title: string;
  type: ThreatType;
  priority: PriorityLevel;
  status: AlertStatus;
  location: string;
  coordinates?: { latitude: number; longitude: number };
  description: string;
  affectedArea?: number;
  populationAtRisk?: number;
  createdAt: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}
```

### `CommunityReport`

```typescript
interface CommunityReport {
  id: string;
  threatType: string;
  location: string;
  coordinates: { latitude: number; longitude: number };
  description: string;
  reporterName: string;
  reporterContact: string;
  images: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
  verifiedBy?: string;
  verifiedAt?: string;
}
```

### `EnvironmentalData`

```typescript
interface EnvironmentalData {
  id: string;
  variableType: string;
  value: number;
  unit: string;
  location: string;
  coordinates: { latitude: number; longitude: number };
  recordedAt: string;
  sensorId?: string;
  metadata?: Record<string, any>;
}
```

---

## Manejo de Errores

Todos los servicios lanzan errores que deben ser capturados:

```typescript
try {
  const threats = await ThreatsService.getAll();
} catch (error) {
  if (error.message === 'Supabase not configured') {
    console.log('Usando modo mock');
  } else {
    console.error('Error:', error.message);
  }
}
```

---

**API versión:** 1.0.0  
**Última actualización:** 2026-01-02