-- ============================================================================
-- SCRIPT DE POBLACIÓN DE BASE DE DATOS - SUPABASE
-- ============================================================================
-- Este script inserta datos de prueba en todas las tablas
-- Ejecutar después de las migraciones en el SQL Editor de Supabase
-- ============================================================================

-- PASO 1: Crear usuarios de prueba en auth.users
-- Nota: Las contraseñas deben ser hasheadas con bcrypt
-- Para desarrollo, usa estas contraseñas: 'demo123'

-- Insertar usuarios en auth.users (tabla de autenticación de Supabase)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES
  -- Usuario Researcher
  (
    '550e8400-e29b-41d4-a716-446655440001',
    '00000000-0000-0000-0000-000000000000',
    'researcher@smyeg.com',
    '$2a$10$XqXJ7qGPGFX4TZBzQhQh5.VPYSJz1zQlQZQlxJQlxJQlxJQlxJQlxJ', -- Placeholder, cambiar con hash real
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Dr. Ana García","role":"RESEARCHER"}',
    false,
    'authenticated'
  ),
  -- Usuario Risk Manager
  (
    '550e8400-e29b-41d4-a716-446655440002',
    '00000000-0000-0000-0000-000000000000',
    'manager@smyeg.com',
    '$2a$10$XqXJ7qGPGFX4TZBzQhQh5.VPYSJz1zQlQZQlxJQlxJQlxJQlxJQlxJ',
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Carlos Mendoza","role":"RISK_MANAGER"}',
    false,
    'authenticated'
  ),
  -- Usuario Community Monitor
  (
    '550e8400-e29b-41d4-a716-446655440003',
    '00000000-0000-0000-0000-000000000000',
    'monitor@smyeg.com',
    '$2a$10$XqXJ7qGPGFX4TZBzQhQh5.VPYSJz1zQlQZQlxJQlxJQlxJQlxJQlxJ',
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"María González","role":"COMMUNITY_MONITOR"}',
    false,
    'authenticated'
  ),
  -- Usuario Público
  (
    '550e8400-e29b-41d4-a716-446655440004',
    '00000000-0000-0000-0000-000000000000',
    'public@smyeg.com',
    '$2a$10$XqXJ7qGPGFX4TZBzQhQh5.VPYSJz1zQlQZQlxJQlxJQlxJQlxJQlxJ',
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Usuario Público","role":"PUBLIC"}',
    false,
    'authenticated'
  )
ON CONFLICT (id) DO NOTHING;

-- PASO 2: Crear perfiles de usuario en tabla users
INSERT INTO users (id, email, full_name, role, organization, created_at, updated_at) VALUES
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'researcher@smyeg.com',
    'Dr. Ana García',
    'RESEARCHER',
    'Universidad Central de Venezuela',
    NOW(),
    NOW()
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002',
    'manager@smyeg.com',
    'Carlos Mendoza',
    'RISK_MANAGER',
    'INPARQUES',
    NOW(),
    NOW()
  ),
  (
    '550e8400-e29b-41d4-a716-446655440003',
    'monitor@smyeg.com',
    'María González',
    'COMMUNITY_MONITOR',
    'Comunidad La Paragua',
    NOW(),
    NOW()
  ),
  (
    '550e8400-e29b-41d4-a716-446655440004',
    'public@smyeg.com',
    'Usuario Público',
    'PUBLIC',
    NULL,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- PASO 3: Insertar amenazas (threats)
INSERT INTO threats (
  type, severity, status, location, coordinates, 
  description, reported_by, verified_by, created_at, updated_at
) VALUES
  (
    'FOREST_FIRE',
    'HIGH',
    'CONFIRMED',
    'Parque Nacional Canaima',
    ST_SetSRID(ST_MakePoint(-62.5, 6.5), 4326),
    'Incendio forestal detectado en la zona norte del parque. Se requiere intervención inmediata de brigadas forestales.',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440001',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  ),
  (
    'ILLEGAL_MINING',
    'HIGH',
    'VERIFIED',
    'Río Caroní',
    ST_SetSRID(ST_MakePoint(-62.8, 6.2), 4326),
    'Actividad minera ilegal detectada. Deforestación significativa y contaminación del agua.',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440001',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '3 days'
  ),
  (
    'DEFORESTATION',
    'MEDIUM',
    'VERIFIED',
    'Cuenca del Orinoco',
    ST_SetSRID(ST_MakePoint(-63.5, 6.0), 4326),
    'Contaminación del agua por vertidos industriales sin tratar en zona de deforestación.',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '5 days'
  ),
  (
    'DEFORESTATION',
    'HIGH',
    'CONFIRMED',
    'Reserva Forestal Imataca',
    ST_SetSRID(ST_MakePoint(-61.5, 7.0), 4326),
    'Deforestación masiva para agricultura. Pérdida de hábitat de especies protegidas.',
    '550e8400-e29b-41d4-a716-446655440001',
    NULL,
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days'
  ),
  (
    'UNREGULATED_TOURISM',
    'HIGH',
    'PENDING',
    'Amazonas',
    ST_SetSRID(ST_MakePoint(-65.0, 5.5), 4326),
    'Reporte de turismo no regulado con impacto en ecosistemas frágiles y especies en peligro.',
    '550e8400-e29b-41d4-a716-446655440003',
    NULL,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  );

-- PASO 4: Insertar alertas (alerts)
INSERT INTO alerts (
  title, type, priority, status, location, coordinates,
  description, affected_area, population_at_risk, acknowledged, created_at
) VALUES
  (
    'Alerta Crítica: Incendio Forestal Activo',
    'FOREST_FIRE',
    'CRITICAL',
    'ACTIVE',
    'Parque Nacional Canaima',
    ST_SetSRID(ST_MakePoint(-62.5, 6.5), 4326),
    'Incendio forestal en expansión rápida. Evacuación recomendada para comunidades cercanas.',
    25.5,
    500,
    true,
    NOW() - INTERVAL '1 hour'
  ),
  (
    'Alerta Alta: Contaminación de Agua',
    'DEFORESTATION',
    'HIGH',
    'ACTIVE',
    'Río Caroní',
    ST_SetSRID(ST_MakePoint(-62.8, 6.2), 4326),
    'Niveles elevados de mercurio detectados en el agua. No apta para consumo humano.',
    NULL,
    2000,
    false,
    NOW() - INTERVAL '3 hours'
  ),
  (
    'Monitoreo: Actividad Minera Sospechosa',
    'ILLEGAL_MINING',
    'MEDIUM',
    'ACKNOWLEDGED',
    'Zona Protegida',
    ST_SetSRID(ST_MakePoint(-63.0, 6.0), 4326),
    'Movimiento inusual de maquinaria cerca de área protegida.',
    NULL,
    NULL,
    true,
    NOW() - INTERVAL '1 day'
  );

-- PASO 5: Insertar variables ambientales (environmental_variables)
INSERT INTO environmental_variables (
  variable_type, value, unit, location, coordinates, recorded_at, sensor_id
) VALUES
  -- Temperatura
  ('TEMPERATURE', 28.5, '°C', 'Estación Meteorológica Canaima', ST_SetSRID(ST_MakePoint(-62.5, 6.5), 4326), NOW() - INTERVAL '1 hour', 'SENSOR-001'),
  ('TEMPERATURE', 29.2, '°C', 'Estación Meteorológica Canaima', ST_SetSRID(ST_MakePoint(-62.5, 6.5), 4326), NOW() - INTERVAL '2 hours', 'SENSOR-001'),
  ('TEMPERATURE', 27.8, '°C', 'Estación Meteorológica Canaima', ST_SetSRID(ST_MakePoint(-62.5, 6.5), 4326), NOW() - INTERVAL '3 hours', 'SENSOR-001'),
  
  -- Humedad
  ('HUMIDITY', 75.0, '%', 'Estación Meteorológica Canaima', ST_SetSRID(ST_MakePoint(-62.5, 6.5), 4326), NOW() - INTERVAL '1 hour', 'SENSOR-002'),
  ('HUMIDITY', 72.5, '%', 'Estación Meteorológica Canaima', ST_SetSRID(ST_MakePoint(-62.5, 6.5), 4326), NOW() - INTERVAL '2 hours', 'SENSOR-002'),
  
  -- Precipitación
  ('PRECIPITATION', 12.5, 'mm', 'Estación Meteorológica Canaima', ST_SetSRID(ST_MakePoint(-62.5, 6.5), 4326), NOW() - INTERVAL '1 day', 'SENSOR-003'),
  ('PRECIPITATION', 8.2, 'mm', 'Estación Meteorológica Canaima', ST_SetSRID(ST_MakePoint(-62.5, 6.5), 4326), NOW() - INTERVAL '2 days', 'SENSOR-003'),
  
  -- Calidad del agua
  ('WATER_QUALITY', 7.2, 'pH', 'Río Caroní - Punto A', ST_SetSRID(ST_MakePoint(-62.8, 6.2), 4326), NOW() - INTERVAL '1 hour', 'SENSOR-004'),
  ('WATER_QUALITY', 6.8, 'pH', 'Río Caroní - Punto A', ST_SetSRID(ST_MakePoint(-62.8, 6.2), 4326), NOW() - INTERVAL '12 hours', 'SENSOR-004'),
  
  -- Calidad del aire
  ('AIR_QUALITY', 85.0, 'AQI', 'Ciudad Bolívar', ST_SetSRID(ST_MakePoint(-63.5, 8.1), 4326), NOW() - INTERVAL '1 hour', 'SENSOR-005'),
  ('AIR_QUALITY', 92.0, 'AQI', 'Ciudad Bolívar', ST_SetSRID(ST_MakePoint(-63.5, 8.1), 4326), NOW() - INTERVAL '2 hours', 'SENSOR-005');

-- PASO 6: Insertar reportes comunitarios (community_reports)
INSERT INTO community_reports (
  threat_type, description, location, coordinates,
  reporter_name, reporter_contact, status, created_at
) VALUES
  (
    'FOREST_FIRE',
    'Se observa humo denso proveniente del área boscosa cercana a la comunidad. Posible inicio de incendio.',
    'Comunidad La Paragua',
    ST_SetSRID(ST_MakePoint(-62.7, 6.3), 4326),
    'Juan Pérez',
    'juan.perez@email.com / +58-414-1234567',
    'PENDING',
    NOW() - INTERVAL '2 hours'
  ),
  (
    'ILLEGAL_MINING',
    'Se escuchan ruidos de maquinaria pesada durante la noche en zona donde no deberían haber equipos.',
    'Comunidad El Dorado',
    ST_SetSRID(ST_MakePoint(-63.2, 6.1), 4326),
    'Carmen Rodríguez',
    'carmen.r@email.com / +58-414-9876543',
    'VERIFIED',
    NOW() - INTERVAL '12 hours'
  ),
  (
    'DEFORESTATION',
    'El agua del río tiene un color amarillento y olor fuerte. Los peces están muriendo. Posible deforestación cercana.',
    'Comunidad Río Claro',
    ST_SetSRID(ST_MakePoint(-62.9, 6.4), 4326),
    'Pedro González',
    'pedro.g@email.com / +58-414-5551234',
    'VERIFIED',
    NOW() - INTERVAL '1 day'
  );

-- Verificar datos insertados
SELECT 'Users created:' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Threats created:', COUNT(*) FROM threats
UNION ALL
SELECT 'Alerts created:', COUNT(*) FROM alerts
UNION ALL
SELECT 'Environmental variables created:', COUNT(*) FROM environmental_variables
UNION ALL
SELECT 'Community reports created:', COUNT(*) FROM community_reports;

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 1. Los hash de contraseñas son placeholders. En producción, usa Supabase Auth
--    para crear usuarios con: supabase.auth.signUp()
--
-- 2. Para login directo en desarrollo, puedes usar la tabla auth.users directamente
--    o mejor aún, crear los usuarios mediante el Dashboard de Supabase
--
-- 3. Las coordenadas están en formato WGS84 (SRID 4326)
--
-- 4. Ajusta las fechas según necesites con INTERVAL
--
-- 5. Este script es idempotente gracias a ON CONFLICT DO NOTHING
-- ============================================================================
