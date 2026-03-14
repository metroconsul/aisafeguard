
-- 1. Create empresas table
CREATE TABLE public.empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_fantasia text NOT NULL,
  cnpj text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- 2. Create perfis table
CREATE TABLE public.perfis (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome_completo text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- 3. Add empresa_id to existing tables
ALTER TABLE public.funcionarios ADD COLUMN empresa_id uuid REFERENCES public.empresas(id);
ALTER TABLE public.epis ADD COLUMN empresa_id uuid REFERENCES public.empresas(id);
ALTER TABLE public.entregas ADD COLUMN empresa_id uuid REFERENCES public.empresas(id);

-- 4. Security definer function to get user's empresa_id
CREATE OR REPLACE FUNCTION public.get_user_empresa_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa_id FROM public.perfis WHERE id = auth.uid()
$$;

-- 5. Drop existing permissive policies
DROP POLICY IF EXISTS "Allow all access to entregas" ON public.entregas;
DROP POLICY IF EXISTS "Allow all access to epis" ON public.epis;
DROP POLICY IF EXISTS "Allow all access to funcionarios" ON public.funcionarios;

-- 6. RLS policies for empresas
CREATE POLICY "Users can view own empresa" ON public.empresas
  FOR SELECT TO authenticated
  USING (id = public.get_user_empresa_id());

CREATE POLICY "Users can insert empresa" ON public.empresas
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 7. RLS policies for perfis
CREATE POLICY "Users can view own perfil" ON public.perfis
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert own perfil" ON public.perfis
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own perfil" ON public.perfis
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- 8. RLS policies for funcionarios
CREATE POLICY "Tenant isolation funcionarios select" ON public.funcionarios
  FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Tenant isolation funcionarios insert" ON public.funcionarios
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Tenant isolation funcionarios update" ON public.funcionarios
  FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Tenant isolation funcionarios delete" ON public.funcionarios
  FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

-- 9. RLS policies for epis
CREATE POLICY "Tenant isolation epis select" ON public.epis
  FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Tenant isolation epis insert" ON public.epis
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Tenant isolation epis update" ON public.epis
  FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Tenant isolation epis delete" ON public.epis
  FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

-- 10. RLS policies for entregas
CREATE POLICY "Tenant isolation entregas select" ON public.entregas
  FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Tenant isolation entregas insert" ON public.entregas
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Tenant isolation entregas update" ON public.entregas
  FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Tenant isolation entregas delete" ON public.entregas
  FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

-- 11. Allow anon access to entregas for signature page (public link)
CREATE POLICY "Anon can view entregas for signing" ON public.entregas
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "Anon can update entregas for signing" ON public.entregas
  FOR UPDATE TO anon
  USING (true);

-- 12. Allow anon to read funcionarios/epis for signature page joins
CREATE POLICY "Anon can read funcionarios for signing" ON public.funcionarios
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "Anon can read epis for signing" ON public.epis
  FOR SELECT TO anon
  USING (true);
