-- Function for updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

-- Table
CREATE TABLE public.integracao_whatsapp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    numero TEXT NOT NULL,
    email TEXT,
    instancia TEXT,
    instance_id TEXT,
    status TEXT DEFAULT 'pendente',
    vinculado_em TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- Trigger
CREATE TRIGGER update_integracao_whatsapp_updated_at
    BEFORE UPDATE ON public.integracao_whatsapp
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.integracao_whatsapp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation whatsapp select" ON public.integracao_whatsapp
    FOR SELECT TO authenticated USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Tenant isolation whatsapp insert" ON public.integracao_whatsapp
    FOR INSERT TO authenticated WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Tenant isolation whatsapp update" ON public.integracao_whatsapp
    FOR UPDATE TO authenticated USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Tenant isolation whatsapp delete" ON public.integracao_whatsapp
    FOR DELETE TO authenticated USING (empresa_id = get_user_empresa_id());