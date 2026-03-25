ALTER POLICY "Users can insert empresa"
ON public.empresas
WITH CHECK (auth.uid() IS NOT NULL);

ALTER POLICY "Anon can update entregas for signing"
ON public.entregas
USING (status_assinatura IS DISTINCT FROM 'Assinado')
WITH CHECK (status_assinatura IN ('Assinado', 'Pendente'));

ALTER POLICY "Anon can update documents for signing"
ON public.documents
USING (COALESCE(signature_status, '') <> 'assinado')
WITH CHECK (signature_status IN ('assinado', 'pendente', 'nao_aplicavel'));

ALTER POLICY "Anon can insert signature_logs"
ON public.signature_logs
WITH CHECK (
  empresa_id IS NOT NULL
  AND funcionario_id IS NOT NULL
  AND COALESCE(action_type, '') <> ''
);