
-- Create setores table
CREATE TABLE public.setores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.setores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation setores select" ON public.setores
  FOR SELECT TO authenticated USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Tenant isolation setores insert" ON public.setores
  FOR INSERT TO authenticated WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Tenant isolation setores update" ON public.setores
  FOR UPDATE TO authenticated USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Tenant isolation setores delete" ON public.setores
  FOR DELETE TO authenticated USING (empresa_id = get_user_empresa_id());

-- Create setores_epis junction table (the matrix)
CREATE TABLE public.setores_epis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setor_id UUID NOT NULL REFERENCES public.setores(id) ON DELETE CASCADE,
  epi_id UUID NOT NULL REFERENCES public.epis(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(setor_id, epi_id)
);

ALTER TABLE public.setores_epis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation setores_epis select" ON public.setores_epis
  FOR SELECT TO authenticated USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Tenant isolation setores_epis insert" ON public.setores_epis
  FOR INSERT TO authenticated WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Tenant isolation setores_epis delete" ON public.setores_epis
  FOR DELETE TO authenticated USING (empresa_id = get_user_empresa_id());

-- Add setor_id FK to funcionarios (nullable for backward compat)
ALTER TABLE public.funcionarios ADD COLUMN setor_id UUID REFERENCES public.setores(id) ON DELETE SET NULL;
