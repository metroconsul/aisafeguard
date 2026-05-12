ALTER TABLE public.time_entries
  ADD CONSTRAINT time_entries_funcionario_id_fkey
  FOREIGN KEY (funcionario_id) REFERENCES public.funcionarios(id) ON DELETE CASCADE;

ALTER TABLE public.time_entries
  ADD CONSTRAINT time_entries_empresa_id_fkey
  FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER PUBLICATION supabase_realtime ADD TABLE public.time_entries;
ALTER TABLE public.time_entries REPLICA IDENTITY FULL;