
-- 1. Update documents table for cartao_ponto and ASO fields
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_doc_category_check;
ALTER TABLE public.documents ADD CONSTRAINT documents_doc_category_check 
  CHECK (doc_category IN ('admissao', 'rescisao', 'aso', 'holerite', 'epi', 'treinamento_nr', 'laudo_empresa', 'cartao_ponto'));

ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS aso_type TEXT CHECK (aso_type IN ('admissional', 'periodico', 'demissional', 'retorno_trabalho', 'mudanca_risco'));
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS health_status TEXT CHECK (health_status IN ('apto', 'inapto'));

-- 2. Create admission_requests table
CREATE TABLE public.admission_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  candidate_name TEXT NOT NULL,
  candidate_cpf TEXT,
  candidate_phone TEXT,
  status TEXT DEFAULT 'aguardando_envio' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Validation trigger instead of CHECK for status
CREATE OR REPLACE FUNCTION public.validate_admission_request_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('aguardando_envio', 'em_analise', 'aprovado', 'reprovado') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_admission_request_status
  BEFORE INSERT OR UPDATE ON public.admission_requests
  FOR EACH ROW EXECUTE FUNCTION public.validate_admission_request_status();

-- 3. Create admission_documents table
CREATE TABLE public.admission_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admission_id UUID NOT NULL REFERENCES public.admission_requests(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  status TEXT DEFAULT 'pendente' NOT NULL,
  feedback_rh TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.validate_admission_document_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('pendente', 'aprovado', 'rejeitado') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_admission_document_status
  BEFORE INSERT OR UPDATE ON public.admission_documents
  FOR EACH ROW EXECUTE FUNCTION public.validate_admission_document_status();

-- 4. Enable RLS
ALTER TABLE public.admission_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admission_documents ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies for admission_requests
CREATE POLICY "Tenant isolation admission_requests select"
  ON public.admission_requests FOR SELECT TO authenticated
  USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Tenant isolation admission_requests insert"
  ON public.admission_requests FOR INSERT TO authenticated
  WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Tenant isolation admission_requests update"
  ON public.admission_requests FOR UPDATE TO authenticated
  USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Tenant isolation admission_requests delete"
  ON public.admission_requests FOR DELETE TO authenticated
  USING (empresa_id = get_user_empresa_id());

-- Anon can read by token (for public onboarding page)
CREATE POLICY "Anon can read admission by token"
  ON public.admission_requests FOR SELECT TO anon
  USING (true);

-- Anon can update status (candidate submitting docs changes to em_analise)
CREATE POLICY "Anon can update admission status"
  ON public.admission_requests FOR UPDATE TO anon
  USING (true)
  WITH CHECK (status IN ('aguardando_envio', 'em_analise'));

-- 6. RLS policies for admission_documents
CREATE POLICY "Tenant isolation admission_documents select"
  ON public.admission_documents FOR SELECT TO authenticated
  USING (admission_id IN (SELECT id FROM public.admission_requests WHERE empresa_id = get_user_empresa_id()));

CREATE POLICY "Tenant isolation admission_documents update"
  ON public.admission_documents FOR UPDATE TO authenticated
  USING (admission_id IN (SELECT id FROM public.admission_requests WHERE empresa_id = get_user_empresa_id()));

CREATE POLICY "Tenant isolation admission_documents delete"
  ON public.admission_documents FOR DELETE TO authenticated
  USING (admission_id IN (SELECT id FROM public.admission_requests WHERE empresa_id = get_user_empresa_id()));

-- Anon can insert documents (candidate uploading)
CREATE POLICY "Anon can insert admission_documents"
  ON public.admission_documents FOR INSERT TO anon
  WITH CHECK (admission_id IS NOT NULL AND doc_type IS NOT NULL AND file_url IS NOT NULL);

-- Anon can read their admission documents
CREATE POLICY "Anon can read admission_documents"
  ON public.admission_documents FOR SELECT TO anon
  USING (true);

-- Authenticated can insert admission_documents
CREATE POLICY "Tenant isolation admission_documents insert"
  ON public.admission_documents FOR INSERT TO authenticated
  WITH CHECK (admission_id IN (SELECT id FROM public.admission_requests WHERE empresa_id = get_user_empresa_id()));

-- 7. Storage bucket for admission documents
INSERT INTO storage.buckets (id, name, public) VALUES ('admission-docs', 'admission-docs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload admission docs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'admission-docs');

CREATE POLICY "Anyone can read admission docs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'admission-docs');
