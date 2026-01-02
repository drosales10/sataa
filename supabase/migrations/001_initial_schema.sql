-- ============================================================================
-- MIGRACIÓN INICIAL - ESQUEMA DE BASE DE DATOS
-- ============================================================================

-- Habilitar extensión PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Crear tipos ENUM
CREATE TYPE threat_type AS ENUM (
  'UNREGULATED_TOURISM',
  'ILLEGAL_MINING',
  'DEFORESTATION',
  'FOREST_FIRE',
  'UNAUTHORIZED_OCCUPATION',
  'OTHER'
);

CREATE TYPE severity_level AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE threat_status AS ENUM ('PENDING', 'VERIFIED', 'CONFIRMED', 'RESOLVED', 'FALSE_ALARM');
CREATE TYPE alert_priority AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
CREATE TYPE alert_status AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED');
CREATE TYPE user_role AS ENUM ('RESEARCHER', 'RISK_MANAGER', 'COMMUNITY_MONITOR', 'PUBLIC', 'ADMIN');

-- ============================================================================
-- TABLA: users
-- ============================================================================
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

-- Índices
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================================
-- TABLA: threats (Amenazas)
-- ============================================================================
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

-- Índices espaciales y regulares
CREATE INDEX idx_threats_coordinates ON threats USING GIST(coordinates);
CREATE INDEX idx_threats_type ON threats(type);
CREATE INDEX idx_threats_severity ON threats(severity);
CREATE INDEX idx_threats_status ON threats(status);
CREATE INDEX idx_threats_created_at ON threats(created_at DESC);

-- ============================================================================
-- TABLA: alerts (Alertas)
-- ============================================================================
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

-- Índices
CREATE INDEX idx_alerts_coordinates ON alerts USING GIST(coordinates);
CREATE INDEX idx_alerts_priority ON alerts(priority);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);

-- ============================================================================
-- TABLA: community_reports (Reportes Comunitarios)
-- ============================================================================
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

-- Índices
CREATE INDEX idx_community_reports_coordinates ON community_reports USING GIST(coordinates);
CREATE INDEX idx_community_reports_status ON community_reports(status);
CREATE INDEX idx_community_reports_created_at ON community_reports(created_at DESC);

-- ============================================================================
-- TABLA: environmental_variables (Variables Ambientales)
-- ============================================================================
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

-- Índices
CREATE INDEX idx_env_vars_coordinates ON environmental_variables USING GIST(coordinates);
CREATE INDEX idx_env_vars_type ON environmental_variables(variable_type);
CREATE INDEX idx_env_vars_recorded_at ON environmental_variables(recorded_at DESC);

-- ============================================================================
-- FUNCIONES DE CONSULTA ESPACIAL
-- ============================================================================

-- Función: Encontrar amenazas cercanas a un punto
CREATE OR REPLACE FUNCTION nearby_threats(
  lat NUMERIC,
  lng NUMERIC,
  radius_km NUMERIC
)
RETURNS TABLE (
  id UUID,
  type threat_type,
  severity severity_level,
  location TEXT,
  distance_km NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.type,
    t.severity,
    t.location,
    ROUND(
      ST_Distance(
        t.coordinates::geography,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
      ) / 1000,
      2
    ) AS distance_km
  FROM threats t
  WHERE ST_DWithin(
    t.coordinates::geography,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
    radius_km * 1000
  )
  AND t.status != 'FALSE_ALARM'
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Función: Amenazas dentro de un área rectangular
CREATE OR REPLACE FUNCTION threats_in_area(
  min_lat NUMERIC,
  min_lng NUMERIC,
  max_lat NUMERIC,
  max_lng NUMERIC
)
RETURNS TABLE (
  id UUID,
  type threat_type,
  severity severity_level,
  location TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.type,
    t.severity,
    t.location
  FROM threats t
  WHERE ST_Contains(
    ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326),
    t.coordinates
  )
  AND t.status != 'FALSE_ALARM';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS PARA ACTUALIZAR updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_threats_updated_at
  BEFORE UPDATE ON threats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at
  BEFORE UPDATE ON alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_reports_updated_at
  BEFORE UPDATE ON community_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE threats ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE environmental_variables ENABLE ROW LEVEL SECURITY;

-- Políticas para users
CREATE POLICY "Users can view all profiles" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para threats
CREATE POLICY "Anyone can view threats" ON threats
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create threats" ON threats
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Researchers and admins can update threats" ON threats
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('RESEARCHER', 'RISK_MANAGER', 'ADMIN')
    )
  );

-- Políticas para alerts
CREATE POLICY "Anyone can view alerts" ON alerts
  FOR SELECT USING (true);

CREATE POLICY "Risk managers can create alerts" ON alerts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('RISK_MANAGER', 'RESEARCHER', 'ADMIN')
    )
  );

CREATE POLICY "Risk managers can update alerts" ON alerts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('RISK_MANAGER', 'ADMIN')
    )
  );

-- Políticas para community_reports
CREATE POLICY "Anyone can view community reports" ON community_reports
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create community reports" ON community_reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Researchers can update community reports" ON community_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('RESEARCHER', 'RISK_MANAGER', 'ADMIN')
    )
  );

-- Políticas para environmental_variables
CREATE POLICY "Anyone can view environmental data" ON environmental_variables
  FOR SELECT USING (true);

CREATE POLICY "Researchers can insert environmental data" ON environmental_variables
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('RESEARCHER', 'ADMIN')
    )
  );