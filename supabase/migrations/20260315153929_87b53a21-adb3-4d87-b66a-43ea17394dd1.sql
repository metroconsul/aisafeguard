
-- Create notificacoes table
CREATE TABLE public.notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  mensagem text NOT NULL,
  lida boolean NOT NULL DEFAULT false,
  tipo text NOT NULL DEFAULT 'info',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Tenant isolation notificacoes select"
  ON public.notificacoes FOR SELECT TO authenticated
  USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Tenant isolation notificacoes insert"
  ON public.notificacoes FOR INSERT TO authenticated
  WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Tenant isolation notificacoes update"
  ON public.notificacoes FOR UPDATE TO authenticated
  USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Tenant isolation notificacoes delete"
  ON public.notificacoes FOR DELETE TO authenticated
  USING (empresa_id = get_user_empresa_id());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes;
