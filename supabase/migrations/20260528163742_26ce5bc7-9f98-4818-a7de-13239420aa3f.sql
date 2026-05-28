-- =====================================================
-- 1. PORTAL SESSIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.portal_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  funcionario_id uuid NOT NULL,
  empresa_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  user_agent text,
  ip_address text
);

CREATE INDEX IF NOT EXISTS portal_sessions_token_idx ON public.portal_sessions(token);
CREATE INDEX IF NOT EXISTS portal_sessions_funcionario_idx ON public.portal_sessions(funcionario_id);

-- Service role only
GRANT ALL ON public.portal_sessions TO service_role;
-- nenhum grant para anon/authenticated

ALTER TABLE public.portal_sessions ENABLE ROW LEVEL SECURITY;

-- Sem políticas: bloqueia tudo exceto service role (que bypassa RLS).

-- =====================================================
-- 2. REMOVER POLÍTICAS ANÔNIMAS DAS TABELAS SENSÍVEIS
-- =====================================================
DROP POLICY IF EXISTS "Anon can read funcionarios for signing" ON public.funcionarios;
DROP POLICY IF EXISTS "Anon can read documents for portal" ON public.documents;
DROP POLICY IF EXISTS "Anon can update documents for signing" ON public.documents;
DROP POLICY IF EXISTS "Anon can read epis for signing" ON public.epis;
DROP POLICY IF EXISTS "Anon can insert time_entries" ON public.time_entries;
DROP POLICY IF EXISTS "Anon can read time_entries" ON public.time_entries;
DROP POLICY IF EXISTS "Anon can insert epi_solicitacoes" ON public.epi_solicitacoes;
DROP POLICY IF EXISTS "Anon can insert signature_logs" ON public.signature_logs;

-- Revoke privilégios diretos do role anon
REVOKE ALL ON public.funcionarios FROM anon;
REVOKE ALL ON public.documents FROM anon;
REVOKE ALL ON public.epis FROM anon;
REVOKE ALL ON public.time_entries FROM anon;
REVOKE ALL ON public.epi_solicitacoes FROM anon;
REVOKE ALL ON public.signature_logs FROM anon;
REVOKE ALL ON public.entregas FROM anon;

-- =====================================================
-- 3. STORAGE: ISOLAMENTO POR EMPRESA EM fichas-pdf
-- =====================================================
DROP POLICY IF EXISTS "Public read access on fichas-pdf" ON storage.objects;
DROP POLICY IF EXISTS "fichas-pdf insert authenticated" ON storage.objects;
DROP POLICY IF EXISTS "fichas-pdf tenant select" ON storage.objects;
DROP POLICY IF EXISTS "fichas-pdf tenant insert" ON storage.objects;
DROP POLICY IF EXISTS "fichas-pdf tenant update" ON storage.objects;
DROP POLICY IF EXISTS "fichas-pdf tenant delete" ON storage.objects;

CREATE POLICY "fichas-pdf tenant select"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'fichas-pdf' AND (storage.foldername(name))[1] = (get_user_empresa_id())::text);

CREATE POLICY "fichas-pdf tenant insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'fichas-pdf' AND (storage.foldername(name))[1] = (get_user_empresa_id())::text);

CREATE POLICY "fichas-pdf tenant update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'fichas-pdf' AND (storage.foldername(name))[1] = (get_user_empresa_id())::text);

CREATE POLICY "fichas-pdf tenant delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'fichas-pdf' AND (storage.foldername(name))[1] = (get_user_empresa_id())::text);

-- Tornar fichas-pdf privado (URLs públicas existentes pararão de funcionar; acessar via signed URL)
UPDATE storage.buckets SET public = false WHERE id = 'fichas-pdf';

-- =====================================================
-- 4. STORAGE: TRANCAR admission-docs PARA LEITURA
-- =====================================================
DROP POLICY IF EXISTS "Anyone can read admission docs" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload admission docs" ON storage.objects;
DROP POLICY IF EXISTS "admission-docs tenant select" ON storage.objects;
DROP POLICY IF EXISTS "admission-docs anon insert" ON storage.objects;

-- Autenticados (RH) podem ler arquivos da sua empresa
-- Caminho usado pelo onboarding: admissao/{funcionario_id}/...
-- Como funcionario.empresa_id não está no path, usamos uma checagem via subselect.
CREATE POLICY "admission-docs auth select empresa"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'admission-docs'
    AND EXISTS (
      SELECT 1 FROM public.funcionarios f
      WHERE f.id::text = (storage.foldername(name))[2]
        AND f.empresa_id = get_user_empresa_id()
    )
  );

-- Anon pode fazer upload SOMENTE para o padrão admissao/{uuid}/...
CREATE POLICY "admission-docs anon insert path-restricted"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (
    bucket_id = 'admission-docs'
    AND (storage.foldername(name))[1] = 'admissao'
    AND (storage.foldername(name))[2] ~ '^[0-9a-f-]{36}$'
  );

-- Tornar admission-docs privado também
UPDATE storage.buckets SET public = false WHERE id = 'admission-docs';