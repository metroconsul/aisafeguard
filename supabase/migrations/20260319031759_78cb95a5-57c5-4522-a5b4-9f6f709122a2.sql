
-- Add status column to funcionarios
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ativo';

-- Create documents table
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id uuid NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  title text NOT NULL,
  doc_category text NOT NULL DEFAULT 'admissao',
  file_url text,
  expiration_date date,
  signature_status text NOT NULL DEFAULT 'nao_aplicavel',
  zapsign_token text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for documents
CREATE POLICY "Tenant isolation documents select" ON public.documents FOR SELECT TO authenticated USING (empresa_id = get_user_empresa_id());
CREATE POLICY "Tenant isolation documents insert" ON public.documents FOR INSERT TO authenticated WITH CHECK (empresa_id = get_user_empresa_id());
CREATE POLICY "Tenant isolation documents update" ON public.documents FOR UPDATE TO authenticated USING (empresa_id = get_user_empresa_id());
CREATE POLICY "Tenant isolation documents delete" ON public.documents FOR DELETE TO authenticated USING (empresa_id = get_user_empresa_id());

-- Create employee_vault storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('employee_vault', 'employee_vault', false) ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for employee_vault
CREATE POLICY "Authenticated users can upload to employee_vault" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'employee_vault');
CREATE POLICY "Authenticated users can read from employee_vault" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'employee_vault');
CREATE POLICY "Authenticated users can delete from employee_vault" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'employee_vault');
