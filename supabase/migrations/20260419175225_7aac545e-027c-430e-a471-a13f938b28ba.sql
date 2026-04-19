
CREATE TABLE public.time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  funcionario_id UUID NOT NULL,
  tipo TEXT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  latitude NUMERIC,
  longitude NUMERIC,
  accuracy NUMERIC,
  address_reference TEXT,
  device_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_time_entries_empresa_recorded ON public.time_entries (empresa_id, recorded_at DESC);
CREATE INDEX idx_time_entries_funcionario_recorded ON public.time_entries (funcionario_id, recorded_at DESC);

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- Portal do colaborador (sem Supabase Auth — usa CPF+PIN custom)
CREATE POLICY "Anon can insert time_entries"
ON public.time_entries
FOR INSERT
TO anon
WITH CHECK (
  funcionario_id IS NOT NULL
  AND empresa_id IS NOT NULL
  AND tipo = ANY (ARRAY['entrada','saida_almoco','volta_almoco','saida'])
);

CREATE POLICY "Anon can read time_entries"
ON public.time_entries
FOR SELECT
TO anon
USING (true);

-- Dashboard RH/Admin (autenticado, isolamento por empresa)
CREATE POLICY "Tenant isolation time_entries select"
ON public.time_entries
FOR SELECT
TO authenticated
USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Tenant isolation time_entries insert"
ON public.time_entries
FOR INSERT
TO authenticated
WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Tenant isolation time_entries delete"
ON public.time_entries
FOR DELETE
TO authenticated
USING (empresa_id = get_user_empresa_id());
