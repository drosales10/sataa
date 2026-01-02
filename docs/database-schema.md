# Esquema de Base de Datos - Sistema SMyEG

Este documento describe el esquema completo de la base de datos PostgreSQL con PostGIS para el Sistema SMyEG.

---

## 📊 Diagrama de Relaciones

```
┌─────────────────┐
│   auth.users    │ (Supabase Auth)
└────────┬────────┘
         │
         │ 1:1
         │
┌────────▼────────┐
│     users       │
│  (Perfiles)     │
└────────┬────────┘
         │
         │ 1:N
         │
    ┌────┴────┬────────────┬─────────────┐
    │         │            │             │
┌───▼───┐ ┌──▼──┐  ┌──────▼──────┐  ┌──▼──────────────┐
│threats│ │alerts│  │community_   │  │environmental_   │
│       │ │      │  │reports      │  │variables        │
└───────┘ └──────┘  └─────────────┘  └─────────────────┘
```

---

## 🗂️ Tablas

### 1. `users` - Perfiles de Usuario

Extiende la tabla `auth.users` de Supabase con información adicional.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role DEFAULT 'PUBLIC',
  organization TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);
```

**Campos:**
- `id`: UUID del usuario (FK a auth.users)
- `email`: Email único del usuario
- `full_name`: Nombre completo
- `role`: Rol del usuario (ENUM)
- `organization`: Organización a la que pertenece (opcional)
- `created_at`: Fecha de creación
- `updated_at`: Fecha de última actualización
- `last_login`: Fecha del último inicio de sesión

**Índices:**
- `idx_users_email` en `email`
- `idx_users_role` en `role`

**Roles Disponibles:**
- `RESEARCHER`: Investigador
- `RISK_MANAGER`: Gestor de Riesgos
- `COMMUNITY_MONITOR`: Monitor Comunitario
- `PUBLIC`: Público General
- `ADMIN`: Administrador

---

### 2. `threats` - Amenazas Ambientales

Almacena información sobre amenazas ambientales detectadas.

```sql
CREATE TABLE threats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type threat_type NOT NULL,
  severity severity_level NOT NULL,
  status threat_status DEFAULT 'PENDING',
  location TEXT NOT NULL,
  coordinates GEOMETRY(POINT, 4326) NOT NULL,
  description TEXT NOT NULL,
  reported_by UUID REFERENCES users(id) NOT NULL,
  verified_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  images TEXT[],
  affected_area NUMERIC(10, 2),
  population_at_risk INTEGER
);
```

**Campos:**
- `id`: Identificador único (UUID)
- `type`: Tipo de amenaza (ENUM)
- `severity`: Nivel de severidad (ENUM)
- `status`: Estado de la amenaza (ENUM)
- `location`: Nombre del lugar
- `coordinates`: Coordenadas geográficas (PostGIS POINT)
- `description`: Descripción detallada
- `reported_by`: Usuario que reportó (FK)
- `verified_by`: Usuario que verificó (FK, opcional)
- `created_at`: Fecha de creación
- `updated_at`: Fecha de actualización
- `images`: Array de URLs de imágenes
- `affected_area`: Área afectada en km²
- `population_at_risk`: Población en riesgo

**Índices:**
- `idx_threats_coordinates` (GIST) en `coordinates`
- `idx_threats_type` en `type`
- `idx_threats_severity` en `severity`
- `idx_threats_status` en `status`
- `idx_threats_created_at` en `created_at DESC`

**Tipos de Amenaza:**
- `UNREGULATED_TOURISM`: Turismo No Regulado
- `ILLEGAL_MINING`: Minería Ilegal
- `DEFORESTATION`: Deforestación
- `FOREST_FIRE`: Incendio Forestal
- `UNAUTHORIZED_OCCUPATION`: Ocupación No Autorizada
- `OTHER`: Otra Amenaza

**Niveles de Severidad:**
- `LOW`: Baja
- `MEDIUM`: Media
- `HIGH`: Alta

**Estados:**
- `PENDING`: Pendiente de verificación
- `VERIFIED`: Verificada
- `CONFIRMED`: Confirmada
- `RESOLVED`: Resuelta
- `FALSE_ALARM`: Falsa Alarma

---

### 3. `alerts` - Alertas Tempranas

Sistema de alertas para amenazas críticas.

```sql
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type threat_type NOT NULL,
  priority alert_priority NOT NULL,
  status alert_status DEFAULT 'ACTIVE',
  location TEXT NOT NULL,
  coordinates GEOMETRY(POINT, 4326),
  description TEXT NOT NULL,
  affected_area NUMERIC(10, 2),
  population_at_risk INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id)
);
```

**Campos:**
- `id`: Identificador único
- `title`: Título de la alerta
- `type`: Tipo de amenaza relacionada
- `priority`: Nivel de prioridad (ENUM)
- `status`: Estado de la alerta (ENUM)
- `location`: Ubicación
- `coordinates`: Coordenadas (opcional)
- `description`: Descripción
- `affected_area`: Área afectada
- `population_at_risk`: Población en riesgo
- `created_at`: Fecha de creación
- `updated_at`: Fecha de actualización
- `acknowledged`: Si fue reconocida
- `acknowledged_by`: Usuario que reconoció
- `acknowledged_at`: Fecha de reconocimiento
- `resolved_at`: Fecha de resolución
- `resolved_by`: Usuario que resolvió

**Índices:**
- `idx_alerts_coordinates` (GIST) en `coordinates`
- `idx_alerts_priority` en `priority`
- `idx_alerts_status` en `status`
- `idx_alerts_created_at` en `created_at DESC`

**Prioridades:**
- `CRITICAL`: Crítica
- `HIGH`: Alta
- `MEDIUM`: Media
- `LOW`: Baja

**Estados:**
- `ACTIVE`: Activa
- `ACKNOWLEDGED`: Reconocida
- `RESOLVED`: Resuelta

---

### 4. `community_reports` - Reportes Comunitarios

Reportes enviados por la comunidad.

```sql
CREATE TABLE community_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  threat_type threat_type NOT NULL,
  location TEXT NOT NULL,
  coordinates GEOMETRY(POINT, 4326) NOT NULL,
  description TEXT NOT NULL,
  reporter_name TEXT NOT NULL,
  reporter_contact TEXT NOT NULL,
  images TEXT[],
  status threat_status DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ
);
```

**Campos:**
- `id`: Identificador único
- `threat_type`: Tipo de amenaza reportada
- `location`: Ubicación
- `coordinates`: Coordenadas exactas
- `description`: Descripción del reporte
- `reporter_name`: Nombre del reportante
- `reporter_contact`: Contacto del reportante
- `images`: Array de URLs de imágenes
- `status`: Estado del reporte
- `created_at`: Fecha de creación
- `updated_at`: Fecha de actualización
- `verified_by`: Usuario que verificó
- `verified_at`: Fecha de verificación

**Índices:**
- `idx_community_reports_coordinates` (GIST) en `coordinates`
- `idx_community_reports_status` en `status`
- `idx_community_reports_created_at` en `created_at DESC`

---

### 5. `environmental_variables` - Variables Ambientales

Datos de sensores y estaciones meteorológicas.

```sql
CREATE TABLE environmental_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variable_type TEXT NOT NULL,
  value NUMERIC(10, 4) NOT NULL,
  unit TEXT NOT NULL,
  location TEXT NOT NULL,
  coordinates GEOMETRY(POINT, 4326) NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  sensor_id TEXT,
  metadata JSONB
);
```

**Campos:**
- `id`: Identificador único
- `variable_type`: Tipo de variable (ej: TEMPERATURE, HUMIDITY)
- `value`: Valor medido
- `unit`: Unidad de medida
- `location`: Ubicación del sensor
- `coordinates`: Coordenadas del sensor
- `recorded_at`: Fecha/hora de registro
- `sensor_id`: ID del sensor (opcional)
- `metadata`: Metadatos adicionales en JSON

**Índices:**
- `idx_env_vars_coordinates` (GIST) en `coordinates`
- `idx_env_vars_type` en `variable_type`
- `idx_env_vars_recorded_at` en `recorded_at DESC`

**Variables Soportadas:**
- `WATER_LEVEL`: Nivel de Agua
- `TEMPERATURE`: Temperatura
- `HUMIDITY`: Humedad Relativa
- `PRECIPITATION`: Precipitación
- `WIND_SPEED`: Velocidad del Viento
- `WIND_DIRECTION`: Dirección del Viento
- `ATMOSPHERIC_PRESSURE`: Presión Atmosférica
- `SOLAR_RADIATION`: Radiación Solar
- `NDVI`: Índice de Vegetación
- `SOIL_MOISTURE`: Humedad del Suelo
- `CARBON_EMISSIONS`: Emisiones de Carbono

---

## 🔍 Funciones Espaciales

### `nearby_threats(lat, lng, radius_km)`

Encuentra amenazas cercanas a un punto dentro de un radio específico.

```sql
SELECT * FROM nearby_threats(10.2027, -84.2330, 10);
```

**Parámetros:**
- `lat`: Latitud del punto central
- `lng`: Longitud del punto central
- `radius_km`: Radio de búsqueda en kilómetros

**Retorna:**
- `id`: ID de la amenaza
- `type`: Tipo de amenaza
- `severity`: Nivel de severidad
- `location`: Ubicación
- `distance_km`: Distancia en kilómetros

---

### `threats_in_area(min_lat, min_lng, max_lat, max_lng)`

Encuentra amenazas dentro de un área rectangular (bounding box).

```sql
SELECT * FROM threats_in_area(10.0, -85.0, 11.0, -84.0);
```

**Parámetros:**
- `min_lat`: Latitud mínima
- `min_lng`: Longitud mínima
- `max_lat`: Latitud máxima
- `max_lng`: Longitud máxima

**Retorna:**
- `id`: ID de la amenaza
- `type`: Tipo de amenaza
- `severity`: Nivel de severidad
- `location`: Ubicación

---

## 🔐 Row Level Security (RLS)

Todas las tablas tienen RLS habilitado con las siguientes políticas:

### Políticas de Lectura (SELECT)
- ✅ Todos pueden ver: `threats`, `alerts`, `community_reports`, `environmental_variables`
- ✅ Usuarios pueden ver todos los perfiles: `users`

### Políticas de Escritura (INSERT)
- ✅ Usuarios autenticados pueden crear: `threats`
- ✅ Risk Managers pueden crear: `alerts`
- ✅ Cualquiera puede crear: `community_reports`
- ✅ Researchers pueden crear: `environmental_variables`

### Políticas de Actualización (UPDATE)
- ✅ Usuarios pueden actualizar su propio perfil: `users`
- ✅ Researchers y Admins pueden actualizar: `threats`
- ✅ Risk Managers pueden actualizar: `alerts`
- ✅ Researchers pueden actualizar: `community_reports`

---

## 🔄 Triggers

### `update_updated_at_column()`

Actualiza automáticamente el campo `updated_at` cuando se modifica un registro.

**Aplicado a:**
- `users`
- `threats`
- `alerts`
- `community_reports`

---

## 📦 Storage Buckets

### `reports` (Público)
- Almacena reportes generados (PDF, Excel, CSV)
- Acceso público para lectura
- Solo usuarios autenticados pueden subir

### `images` (Público)
- Almacena imágenes de amenazas y reportes
- Acceso público para lectura
- Usuarios pueden eliminar sus propias imágenes

### `attachments` (Privado)
- Almacena archivos adjuntos privados
- Solo el propietario puede ver/subir/eliminar

---

## 📈 Consultas Comunes

### Amenazas por Tipo y Severidad
```sql
SELECT type, severity, COUNT(*) as count
FROM threats
WHERE status != 'FALSE_ALARM'
GROUP BY type, severity
ORDER BY count DESC;
```

### Alertas Activas Críticas
```sql
SELECT *
FROM alerts
WHERE status = 'ACTIVE' AND priority = 'CRITICAL'
ORDER BY created_at DESC;
```

### Reportes Pendientes de Verificación
```sql
SELECT *
FROM community_reports
WHERE status = 'PENDING'
ORDER BY created_at ASC;
```

### Serie Temporal de Temperatura
```sql
SELECT recorded_at, value
FROM environmental_variables
WHERE variable_type = 'TEMPERATURE'
  AND location = 'Estación Poás'
  AND recorded_at >= NOW() - INTERVAL '7 days'
ORDER BY recorded_at ASC;
```

### Amenazas en Radio de 5km
```sql
SELECT *
FROM nearby_threats(10.2027, -84.2330, 5)
WHERE severity IN ('HIGH', 'MEDIUM');
```

---

## 🎯 Mejores Prácticas

1. **Siempre usar índices espaciales** para consultas geográficas
2. **Validar coordenadas** antes de insertar (rango válido)
3. **Usar transacciones** para operaciones múltiples
4. **Implementar soft deletes** si es necesario mantener historial
5. **Monitorear tamaño de arrays** (images) para evitar registros muy grandes
6. **Usar JSONB** para metadata flexible
7. **Configurar backups automáticos** en producción

---

**Esquema versión:** 1.0.0  
**Última actualización:** 2026-01-02