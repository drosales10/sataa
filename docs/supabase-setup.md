# Guía de Configuración de Supabase - Sistema SMyEG

Esta guía detalla cómo configurar Supabase como backend para el Sistema de Monitoreo y Evaluación Geoespacial (SMyEG).

## 📋 Requisitos Previos

- Cuenta de Supabase (gratuita o de pago)
- Node.js 18+ instalado
- Git instalado

---

## 🚀 Paso 1: Crear Proyecto en Supabase

1. **Acceder a Supabase Dashboard**
   - Ir a https://supabase.com
   - Iniciar sesión o crear una cuenta

2. **Crear Nuevo Proyecto**
   - Click en "New Project"
   - Nombre del proyecto: `smyeg-production` (o el nombre que prefieras)
   - Contraseña de base de datos: Generar una contraseña segura (guárdala)
   - Región: Seleccionar la más cercana a tus usuarios
   - Plan: Free tier es suficiente para desarrollo

3. **Esperar Inicialización**
   - El proyecto tarda ~2 minutos en estar listo

---

## 🔑 Paso 2: Obtener Credenciales

1. **Ir a Project Settings**
   - Click en el ícono de engranaje (⚙️) en la barra lateral
   - Seleccionar "API"

2. **Copiar Credenciales**
   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Configurar Variables de Entorno**
   - Editar `/workspace/shadcn-ui/.env.local`
   ```env
   VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

## 🗄️ Paso 3: Ejecutar Migraciones de Base de Datos

### Opción A: Usando Supabase CLI (Recomendado)

1. **Instalar Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Iniciar Sesión**
   ```bash
   supabase login
   ```

3. **Link al Proyecto**
   ```bash
   cd /workspace/shadcn-ui
   supabase link --project-ref xxxxxxxxxxxxx
   ```

4. **Ejecutar Migraciones**
   ```bash
   supabase db push
   ```

### Opción B: Usando SQL Editor (Manual)

1. **Ir a SQL Editor**
   - En Supabase Dashboard, click en "SQL Editor"

2. **Ejecutar Migración 001**
   - Copiar contenido de `supabase/migrations/001_initial_schema.sql`
   - Pegar en SQL Editor
   - Click en "Run"

3. **Ejecutar Migración 002**
   - Copiar contenido de `supabase/migrations/002_storage_buckets.sql`
   - Pegar en SQL Editor
   - Click en "Run"

---

## 🔐 Paso 4: Configurar Autenticación

1. **Ir a Authentication Settings**
   - Click en "Authentication" en la barra lateral
   - Click en "Providers"

2. **Habilitar Proveedores**
   - **Email**: Ya está habilitado por defecto
   - **Google OAuth** (opcional):
     - Habilitar toggle
     - Configurar Client ID y Client Secret de Google Cloud Console
   - **GitHub OAuth** (opcional):
     - Habilitar toggle
     - Configurar Client ID y Client Secret de GitHub

3. **Configurar Email Templates**
   - Ir a "Email Templates"
   - Personalizar plantillas de:
     - Confirmación de registro
     - Recuperación de contraseña
     - Cambio de email

---

## 📦 Paso 5: Configurar Storage

Los buckets ya fueron creados en la migración 002, pero verifica:

1. **Ir a Storage**
   - Click en "Storage" en la barra lateral

2. **Verificar Buckets**
   - `reports` (público) ✅
   - `images` (público) ✅
   - `attachments` (privado) ✅

3. **Configurar CORS** (si es necesario)
   - En cada bucket, ir a "Settings"
   - Agregar dominio permitido: `http://localhost:5173` (desarrollo)
   - Agregar dominio de producción cuando despliegues

---

## 🧪 Paso 6: Verificar Instalación

1. **Verificar Extensión PostGIS**
   ```sql
   SELECT PostGIS_Version();
   ```
   Debe retornar la versión de PostGIS (ej: "3.3.2")

2. **Verificar Tablas**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```
   Debe mostrar: `users`, `threats`, `alerts`, `community_reports`, `environmental_variables`

3. **Verificar Funciones Espaciales**
   ```sql
   SELECT nearby_threats(10.2027, -84.2330, 10);
   ```
   Debe ejecutarse sin errores (puede retornar vacío si no hay datos)

---

## 🔄 Paso 7: Poblar Base de Datos con Datos de Prueba

```sql
-- Insertar usuario de prueba
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'test@smyeg.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);

-- Insertar perfil de usuario
INSERT INTO users (id, email, full_name, role, organization)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'test@smyeg.com'),
  'test@smyeg.com',
  'Usuario de Prueba',
  'RESEARCHER',
  'Universidad Nacional'
);

-- Insertar amenazas de prueba
INSERT INTO threats (type, severity, status, location, coordinates, description, reported_by)
VALUES
  (
    'FOREST_FIRE',
    'HIGH',
    'CONFIRMED',
    'Parque Nacional Volcán Poás',
    ST_SetSRID(ST_MakePoint(-84.2330, 10.2027), 4326),
    'Incendio forestal detectado en zona norte del parque',
    (SELECT id FROM users WHERE email = 'test@smyeg.com')
  ),
  (
    'ILLEGAL_MINING',
    'MEDIUM',
    'VERIFIED',
    'Reserva Biológica Bosque Nuboso',
    ST_SetSRID(ST_MakePoint(-84.8000, 10.3000), 4326),
    'Actividad minera ilegal reportada por guardaparques',
    (SELECT id FROM users WHERE email = 'test@smyeg.com')
  );

-- Insertar alertas de prueba
INSERT INTO alerts (title, type, priority, status, location, coordinates, description)
VALUES
  (
    'Alerta Crítica: Incendio Activo',
    'FOREST_FIRE',
    'CRITICAL',
    'ACTIVE',
    'Parque Nacional Volcán Poás',
    ST_SetSRID(ST_MakePoint(-84.2330, 10.2027), 4326),
    'Incendio forestal en expansión. Evacuación recomendada.'
  );

-- Insertar variables ambientales de prueba
INSERT INTO environmental_variables (variable_type, value, unit, location, coordinates)
VALUES
  (
    'TEMPERATURE',
    28.5,
    '°C',
    'Estación Meteorológica Poás',
    ST_SetSRID(ST_MakePoint(-84.2330, 10.2027), 4326)
  ),
  (
    'HUMIDITY',
    75.0,
    '%',
    'Estación Meteorológica Poás',
    ST_SetSRID(ST_MakePoint(-84.2330, 10.2027), 4326)
  );
```

---

## 🧪 Paso 8: Probar Integración en la Aplicación

1. **Reiniciar Servidor de Desarrollo**
   ```bash
   cd /workspace/shadcn-ui
   pnpm run dev
   ```

2. **Verificar Conexión**
   - Abrir consola del navegador (F12)
   - Buscar mensajes de error de Supabase
   - Si no hay errores, la conexión es exitosa

3. **Probar Autenticación**
   - Ir a página de login
   - Intentar iniciar sesión con `test@smyeg.com` / `password123`

4. **Verificar Datos en Tiempo Real**
   - Abrir dos pestañas del navegador
   - Crear una amenaza en una pestaña
   - Verificar que aparece automáticamente en la otra

---

## 🔒 Paso 9: Seguridad y Row Level Security (RLS)

Las políticas RLS ya están configuradas en la migración. Verifica:

1. **Políticas de Lectura**
   - Todos pueden ver amenazas, alertas y reportes ✅
   - Solo usuarios autenticados pueden ver sus propios attachments ✅

2. **Políticas de Escritura**
   - Solo usuarios autenticados pueden crear amenazas ✅
   - Solo Risk Managers pueden crear alertas ✅
   - Cualquiera puede crear reportes comunitarios ✅

3. **Políticas de Actualización**
   - Solo Researchers y Admins pueden actualizar amenazas ✅
   - Solo Risk Managers pueden actualizar alertas ✅

---

## 📊 Paso 10: Monitoreo y Mantenimiento

1. **Dashboard de Supabase**
   - Monitorear uso de API
   - Revisar logs de errores
   - Verificar uso de storage

2. **Backups Automáticos**
   - Supabase hace backups diarios automáticamente
   - En plan Pro: backups cada hora

3. **Límites del Plan Free**
   - 500 MB de base de datos
   - 1 GB de storage
   - 50,000 usuarios activos mensuales
   - 2 GB de ancho de banda

---

## 🚨 Solución de Problemas

### Error: "Invalid API key"
- Verificar que las variables de entorno estén correctamente configuradas
- Reiniciar servidor de desarrollo

### Error: "PostGIS extension not found"
- Ejecutar en SQL Editor: `CREATE EXTENSION IF NOT EXISTS postgis;`

### Error: "Row Level Security policy violation"
- Verificar que el usuario esté autenticado
- Revisar políticas RLS en la tabla correspondiente

### Error: "Storage bucket not found"
- Ejecutar migración 002 nuevamente
- Verificar en Storage que los buckets existen

---

## 📚 Recursos Adicionales

- [Documentación oficial de Supabase](https://supabase.com/docs)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)

---

## ✅ Checklist de Configuración

- [ ] Proyecto creado en Supabase
- [ ] Variables de entorno configuradas
- [ ] Migraciones ejecutadas
- [ ] PostGIS habilitado
- [ ] Autenticación configurada
- [ ] Storage buckets creados
- [ ] Datos de prueba insertados
- [ ] Aplicación conectada exitosamente
- [ ] RLS verificado
- [ ] Realtime funcionando

---

**¡Configuración completada!** 🎉

Tu aplicación SMyEG ahora está conectada a Supabase con todas las funcionalidades de backend.