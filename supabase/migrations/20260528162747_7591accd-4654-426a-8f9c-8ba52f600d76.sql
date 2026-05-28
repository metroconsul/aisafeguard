
-- ============================================================
-- A. STORAGE TENANT ISOLATION
-- ============================================================

-- logos: path = {empresa_id}/file
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete logos" ON storage.objects;

CREATE POLICY "logos tenant insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos' AND (storage.foldername(name))[1] = public.get_user_empresa_id()::text);

CREATE POLICY "logos tenant update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'logos' AND (storage.foldername(name))[1] = public.get_user_empresa_id()::text);

CREATE POLICY "logos tenant delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'logos' AND (storage.foldername(name))[1] = public.get_user_empresa_id()::text);

-- employee_vault: path = {category}/{empresa_id}/{funcionario_id}/file
DROP POLICY IF EXISTS "Authenticated users can upload to employee_vault" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update employee_vault" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from employee_vault" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read from employee_vault" ON storage.objects;

CREATE POLICY "employee_vault tenant select"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'employee_vault' AND (storage.foldername(name))[2] = public.get_user_empresa_id()::text);

CREATE POLICY "employee_vault tenant insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'employee_vault' AND (storage.foldername(name))[2] = public.get_user_empresa_id()::text);

CREATE POLICY "employee_vault tenant update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'employee_vault' AND (storage.foldername(name))[2] = public.get_user_empresa_id()::text);

CREATE POLICY "employee_vault tenant delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'employee_vault' AND (storage.foldername(name))[2] = public.get_user_empresa_id()::text);

-- company_vault: path = {empresa_id}/file
DROP POLICY IF EXISTS "Authenticated users can upload to company_vault" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from company_vault" ON storage.objects;
DROP POLICY IF EXISTS "Public can read company_vault" ON storage.objects;

CREATE POLICY "company_vault tenant select"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'company_vault' AND (storage.foldername(name))[1] = public.get_user_empresa_id()::text);

CREATE POLICY "company_vault tenant insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'company_vault' AND (storage.foldername(name))[1] = public.get_user_empresa_id()::text);

CREATE POLICY "company_vault tenant delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'company_vault' AND (storage.foldername(name))[1] = public.get_user_empresa_id()::text);

-- fichas-pdf: require authenticated for upload (was public)
DROP POLICY IF EXISTS "Allow uploads to fichas-pdf" ON storage.objects;
CREATE POLICY "fichas-pdf insert authenticated"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'fichas-pdf');

-- ============================================================
-- B. SECURITY DEFINER function EXECUTE permissions
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_empresa_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_empresa_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;

-- ============================================================
-- C. Realtime — remove tables that leak cross-tenant
-- ============================================================
-- (tables can be re-added later with proper realtime.messages policies)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'time_entries'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.time_entries';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'epis'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.epis';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notificacoes'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.notificacoes';
  END IF;
END $$;
