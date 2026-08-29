CREATE UNIQUE INDEX IF NOT EXISTS empresa_produtos_um_ativo_por_empresa
  ON public.empresa_produtos (empresa_id)
  WHERE enabled;