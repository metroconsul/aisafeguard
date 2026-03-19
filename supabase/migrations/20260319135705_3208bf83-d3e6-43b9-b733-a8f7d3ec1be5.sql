
-- Allow funcionario_id to be nullable for company-level documents (laudos)
ALTER TABLE public.documents ALTER COLUMN funcionario_id DROP NOT NULL;
