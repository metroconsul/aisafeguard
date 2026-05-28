-- Restaurar policies anônimas TEMPORARIAMENTE (telas PortalDocumentos/PortalEpis/PortalPontos/RegistroPontoCard ainda usam acesso direto)

GRANT SELECT ON public.funcionarios TO anon;
GRANT SELECT, UPDATE ON public.documents TO anon;
GRANT SELECT ON public.epis TO anon;
GRANT SELECT, INSERT ON public.time_entries TO anon;
GRANT INSERT ON public.epi_solicitacoes TO anon;
GRANT INSERT ON public.signature_logs TO anon;

CREATE POLICY "Anon can read funcionarios for signing" ON public.funcionarios FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read documents for portal" ON public.documents FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can update documents for signing" ON public.documents FOR UPDATE TO anon
  USING (COALESCE(signature_status, '') <> 'assinado')
  WITH CHECK (signature_status = ANY(ARRAY['assinado','pendente','nao_aplicavel']));
CREATE POLICY "Anon can read epis for signing" ON public.epis FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read time_entries" ON public.time_entries FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert time_entries" ON public.time_entries FOR INSERT TO anon
  WITH CHECK (funcionario_id IS NOT NULL AND empresa_id IS NOT NULL AND tipo = ANY(ARRAY['entrada','saida_almoco','volta_almoco','saida']));
CREATE POLICY "Anon can insert epi_solicitacoes" ON public.epi_solicitacoes FOR INSERT TO anon
  WITH CHECK (funcionario_id IS NOT NULL AND empresa_id IS NOT NULL AND epi_id IS NOT NULL);
CREATE POLICY "Anon can insert signature_logs" ON public.signature_logs FOR INSERT TO anon
  WITH CHECK (empresa_id IS NOT NULL AND funcionario_id IS NOT NULL AND COALESCE(action_type, '') <> '');