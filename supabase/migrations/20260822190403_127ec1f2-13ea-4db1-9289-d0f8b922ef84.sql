-- 1. Remove anonymous access to sensitive tables (portal now uses portal-api edge function)
DROP POLICY IF EXISTS "Anon can read admission_documents" ON public.admission_documents;
DROP POLICY IF EXISTS "Anon can insert admission_documents" ON public.admission_documents;
DROP POLICY IF EXISTS "Anon can read admission by token" ON public.admission_requests;
DROP POLICY IF EXISTS "Anon can update admission status" ON public.admission_requests;
DROP POLICY IF EXISTS "Anon can read documents for portal" ON public.documents;
DROP POLICY IF EXISTS "Anon can update documents for signing" ON public.documents;
DROP POLICY IF EXISTS "Anon can read funcionarios for signing" ON public.funcionarios;
DROP POLICY IF EXISTS "Anon can read time_entries" ON public.time_entries;
DROP POLICY IF EXISTS "Anon can insert time_entries" ON public.time_entries;
DROP POLICY IF EXISTS "Anon can insert epi_solicitacoes" ON public.epi_solicitacoes;
DROP POLICY IF EXISTS "Anon can insert signature_logs" ON public.signature_logs;
DROP POLICY IF EXISTS "Anon can read epis for signing" ON public.epis;

-- 2. Storage: prevent anonymous listing of the public logos bucket
--    (public buckets still serve individual files without an RLS policy)
DROP POLICY IF EXISTS "Public can view logos" ON storage.objects;

-- 3. Restrict SECURITY DEFINER functions to the backend service only
REVOKE ALL ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.email_queue_dispatch() FROM anon, authenticated;

-- 4. Role/tenant helpers are only needed by signed-in users (used inside RLS policies)
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE ALL ON FUNCTION public.get_user_role(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.get_user_empresa_id() FROM anon;