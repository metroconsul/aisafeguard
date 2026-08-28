-- CP1: product entitlements (additive only)

CREATE TABLE public.empresa_produtos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  product_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  brand_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  ativado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT empresa_produtos_key_check CHECK (product_key IN ('safeguard_industrial','restaurant_operations')),
  CONSTRAINT empresa_produtos_unique UNIQUE (empresa_id, product_key)
);
CREATE INDEX idx_empresa_produtos_empresa ON public.empresa_produtos(empresa_id);
CREATE INDEX idx_empresa_produtos_enabled ON public.empresa_produtos(empresa_id, product_key) WHERE enabled;

GRANT SELECT, INSERT, UPDATE ON public.empresa_produtos TO authenticated;
GRANT ALL ON public.empresa_produtos TO service_role;
ALTER TABLE public.empresa_produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "empresa_produtos_select" ON public.empresa_produtos
  FOR SELECT TO authenticated USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "empresa_produtos_insert" ON public.empresa_produtos
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id() AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "empresa_produtos_update" ON public.empresa_produtos
  FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id() AND public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE TRIGGER empresa_produtos_updated_at BEFORE UPDATE ON public.empresa_produtos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- entitlement helper (fail-closed: no row => disabled)
CREATE OR REPLACE FUNCTION public.empresa_tem_produto(_empresa_id uuid, _product_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.empresa_produtos
    WHERE empresa_id = _empresa_id AND product_key = _product_key AND enabled
  )
$$;
REVOKE ALL ON FUNCTION public.empresa_tem_produto(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.empresa_tem_produto(uuid, text) TO authenticated, service_role;

-- audit trail for product activation
CREATE TABLE public.empresa_produto_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  product_key text NOT NULL,
  action text NOT NULL,
  actor_id uuid,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_empresa_produto_audit_empresa ON public.empresa_produto_audit(empresa_id, created_at DESC);

GRANT SELECT, INSERT ON public.empresa_produto_audit TO authenticated;
GRANT ALL ON public.empresa_produto_audit TO service_role;
ALTER TABLE public.empresa_produto_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "empresa_produto_audit_select" ON public.empresa_produto_audit
  FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id() AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "empresa_produto_audit_insert" ON public.empresa_produto_audit
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id());

-- per-company settings for the restaurant product
CREATE TABLE public.restaurant_product_settings (
  empresa_id uuid NOT NULL PRIMARY KEY REFERENCES public.empresas(id) ON DELETE CASCADE,
  brand_name text NOT NULL DEFAULT 'Escala',
  brand_logo_url text,
  primary_color text NOT NULL DEFAULT '#0F172A',
  accent_color text NOT NULL DEFAULT '#2563EB',
  portal_brand_name text NOT NULL DEFAULT 'Minha Escala',
  carga_semanal_max_horas numeric NOT NULL DEFAULT 44,
  intervalo_minimo_horas numeric NOT NULL DEFAULT 11,
  permite_troca_turno boolean NOT NULL DEFAULT true,
  exige_ciencia_escala boolean NOT NULL DEFAULT true,
  origem_regra text NOT NULL DEFAULT 'configuracao_empresa',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.restaurant_product_settings TO authenticated;
GRANT ALL ON public.restaurant_product_settings TO service_role;
ALTER TABLE public.restaurant_product_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "restaurant_settings_select" ON public.restaurant_product_settings
  FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id()
         AND public.empresa_tem_produto(empresa_id, 'restaurant_operations'));
CREATE POLICY "restaurant_settings_insert" ON public.restaurant_product_settings
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id()
              AND public.empresa_tem_produto(empresa_id, 'restaurant_operations')
              AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "restaurant_settings_update" ON public.restaurant_product_settings
  FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id()
         AND public.empresa_tem_produto(empresa_id, 'restaurant_operations')
         AND public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE TRIGGER restaurant_product_settings_updated_at BEFORE UPDATE ON public.restaurant_product_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
