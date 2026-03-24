-- Add status column to perfis for invite tracking
ALTER TABLE public.perfis ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ativo';

-- Create user_roles table for RBAC (separate from perfis as per security guidelines)
CREATE TYPE public.app_role AS ENUM ('admin', 'tecnico_seguranca', 'rh', 'almoxarifado');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles without recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user role name
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view roles in same empresa"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT p.id FROM public.perfis p
      WHERE p.empresa_id = get_user_empresa_id()
    )
  );

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all perfis in same empresa (for team management)
CREATE POLICY "Admins can view empresa perfis"
  ON public.perfis FOR SELECT
  TO authenticated
  USING (empresa_id = get_user_empresa_id());