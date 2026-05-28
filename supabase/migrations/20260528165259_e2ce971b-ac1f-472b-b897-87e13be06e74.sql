-- 1) Garantir bucket privado
UPDATE storage.buckets SET public = false WHERE id = 'admission-docs';

-- 2) Limpar quaisquer policies prévias do bucket admission-docs em storage.objects
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname ILIKE '%admission%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- 3) Policies restritivas: só service_role pode ler/escrever no bucket admission-docs
CREATE POLICY "admission_docs_service_only_select"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'admission-docs');

CREATE POLICY "admission_docs_service_only_insert"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'admission-docs');

CREATE POLICY "admission_docs_service_only_update"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'admission-docs')
WITH CHECK (bucket_id = 'admission-docs');

CREATE POLICY "admission_docs_service_only_delete"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'admission-docs');

-- 4) Usuários autenticados do mesmo tenant podem LER arquivos do seu próprio empresa_id
CREATE POLICY "admission_docs_tenant_read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'admission-docs'
  AND (storage.foldername(name))[1] = public.get_user_empresa_id()::text
);