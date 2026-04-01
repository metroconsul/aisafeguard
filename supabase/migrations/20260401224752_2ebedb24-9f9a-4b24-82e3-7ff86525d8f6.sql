
-- Fix search_path on validation functions
CREATE OR REPLACE FUNCTION public.validate_admission_request_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('aguardando_envio', 'em_analise', 'aprovado', 'reprovado') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_admission_document_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('pendente', 'aprovado', 'rejeitado') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

-- Fix overly permissive anon UPDATE policy
DROP POLICY IF EXISTS "Anon can update admission status" ON public.admission_requests;
CREATE POLICY "Anon can update admission status"
  ON public.admission_requests FOR UPDATE TO anon
  USING (status = 'aguardando_envio')
  WITH CHECK (status = 'em_analise');
