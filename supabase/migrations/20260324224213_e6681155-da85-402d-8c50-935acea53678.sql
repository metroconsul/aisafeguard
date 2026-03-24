CREATE POLICY "Admins can update empresa perfis"
ON public.perfis
FOR UPDATE
TO authenticated
USING (
  empresa_id = get_user_empresa_id()
  AND has_role(auth.uid(), 'admin')
)
WITH CHECK (
  empresa_id = get_user_empresa_id()
  AND has_role(auth.uid(), 'admin')
);