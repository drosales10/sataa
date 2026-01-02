-- ============================================================================
-- Migración: Tabla de Caché para Métricas de Google Earth Engine
-- ============================================================================

-- Tabla para cachear resultados de GEE
CREATE TABLE IF NOT EXISTS gee_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  data JSONB NOT NULL,
  aoi_id TEXT,
  analysis_year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar búsquedas
CREATE INDEX idx_gee_cache_key ON gee_cache(cache_key);
CREATE INDEX idx_gee_cache_created ON gee_cache(created_at);
CREATE INDEX idx_gee_cache_aoi ON gee_cache(aoi_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en cada UPDATE
CREATE TRIGGER update_gee_cache_updated_at
BEFORE UPDATE ON gee_cache
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Función para limpiar caché antiguo (> 7 días)
CREATE OR REPLACE FUNCTION clean_old_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM gee_cache
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Comentarios para documentación
COMMENT ON TABLE gee_cache IS 'Caché de métricas ambientales calculadas por Google Earth Engine';
COMMENT ON COLUMN gee_cache.cache_key IS 'Clave única para identificar el caché (ej: metrics_aoi123_2024)';
COMMENT ON COLUMN gee_cache.data IS 'Datos JSON de las métricas ambientales';
COMMENT ON COLUMN gee_cache.aoi_id IS 'ID del AOI asociado';
COMMENT ON COLUMN gee_cache.analysis_year IS 'Año de análisis de las métricas';
