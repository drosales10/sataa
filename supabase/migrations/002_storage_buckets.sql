-- ============================================================================
-- CONFIGURACIÓN DE STORAGE BUCKETS
-- ============================================================================

-- Crear buckets para almacenamiento de archivos
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('reports', 'reports', true),
  ('images', 'images', true),
  ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- POLÍTICAS DE STORAGE
-- ============================================================================

-- Bucket: reports (público para lectura)
CREATE POLICY "Anyone can view reports"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'reports');

CREATE POLICY "Authenticated users can upload reports"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'reports' 
    AND auth.role() = 'authenticated'
  );

-- Bucket: images (público para lectura)
CREATE POLICY "Anyone can view images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'images' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Bucket: attachments (privado)
CREATE POLICY "Users can view own attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'attachments' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload own attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'attachments' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own attachments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'attachments' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );