
-- Add access_pin column to funcionarios
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS access_pin TEXT;

-- Create EPI trade request table
CREATE TABLE IF NOT EXISTS public.epi_solicitacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID NOT NULL,
  empresa_id UUID NOT NULL,
  epi_id UUID NOT NULL,
  motivo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.epi_solicitacoes ENABLE ROW LEVEL SECURITY;

-- Anon policies for portal users
CREATE POLICY "Anon can insert epi_solicitacoes" ON public.epi_solicitacoes FOR INSERT TO anon WITH CHECK (funcionario_id IS NOT NULL AND empresa_id IS NOT NULL AND epi_id IS NOT NULL);
CREATE POLICY "Anon can read epi_solicitacoes" ON public.epi_solicitacoes FOR SELECT TO anon USING (true);

-- Authenticated tenant isolation
CREATE POLICY "Tenant isolation epi_solicitacoes select" ON public.epi_solicitacoes FOR SELECT TO authenticated USING (empresa_id = get_user_empresa_id());
CREATE POLICY "Tenant isolation epi_solicitacoes update" ON public.epi_solicitacoes FOR UPDATE TO authenticated USING (empresa_id = get_user_empresa_id());

-- Anon can read documents for portal (holerites, NRs, etc.)
CREATE POLICY "Anon can read documents for portal" ON public.documents FOR SELECT TO anon USING (true);
