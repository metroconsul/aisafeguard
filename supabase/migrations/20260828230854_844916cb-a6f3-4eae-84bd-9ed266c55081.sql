-- Consumo: SECURITY INVOKER (RLS de entregas garante o isolamento)
CREATE OR REPLACE FUNCTION public.epi_consumo_por_setor(_inicio timestamptz, _fim timestamptz, _bucket text DEFAULT 'month')
RETURNS TABLE(periodo timestamptz, setor text, total bigint, eventos bigint)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT date_trunc(CASE WHEN _bucket IN ('month','quarter','year','week','day') THEN _bucket ELSE 'month' END,
                    COALESCE(e.data_entrega, e.created_at)) AS periodo,
         COALESCE(e.setor_snapshot, 'Sem setor') AS setor,
         SUM(e.quantidade)::bigint AS total,
         COUNT(*)::bigint AS eventos
  FROM public.entregas e
  WHERE e.cancelado_em IS NULL
    AND COALESCE(e.data_entrega, e.created_at) >= _inicio
    AND COALESCE(e.data_entrega, e.created_at) < _fim
  GROUP BY 1, 2
  ORDER BY 1, 2
$$;

CREATE OR REPLACE FUNCTION public.epi_consumo_ranking(_inicio timestamptz, _fim timestamptz, _setor text DEFAULT NULL)
RETURNS TABLE(epi_id uuid, nome_equipamento text, numero_ca text, total bigint, eventos bigint)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT p.id, p.nome_equipamento, p.numero_ca, SUM(e.quantidade)::bigint, COUNT(*)::bigint
  FROM public.entregas e
  JOIN public.epis p ON p.id = e.epi_id
  WHERE e.cancelado_em IS NULL
    AND COALESCE(e.data_entrega, e.created_at) >= _inicio
    AND COALESCE(e.data_entrega, e.created_at) < _fim
    AND (_setor IS NULL OR COALESCE(e.setor_snapshot,'Sem setor') = _setor)
  GROUP BY p.id, p.nome_equipamento, p.numero_ca
  ORDER BY 4 DESC
$$;

-- Funcoes internas: nao expor na API
REVOKE ALL ON FUNCTION public.sync_requisitos_funcionario(uuid) FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.recalc_requisitos_funcionario(uuid) FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.trg_funcionario_cargo_sync() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.trg_entrega_recalc() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.epi_calc_vencimento(timestamptz, integer, text) FROM anon;
REVOKE ALL ON FUNCTION public.epi_consumo_por_setor(timestamptz, timestamptz, text) FROM anon;
REVOKE ALL ON FUNCTION public.epi_consumo_ranking(timestamptz, timestamptz, text) FROM anon;

-- Sincronizar pendencias quando o kit muda
CREATE OR REPLACE FUNCTION public.trg_kit_item_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_kit uuid; f record;
BEGIN
  v_kit := COALESCE(NEW.kit_id, OLD.kit_id);
  FOR f IN
    SELECT fu.id FROM public.funcionarios fu
    JOIN public.epi_kits k ON k.cargo_id = fu.cargo_id AND k.empresa_id = fu.empresa_id
    WHERE k.id = v_kit
  LOOP
    PERFORM public.sync_requisitos_funcionario(f.id);
  END LOOP;
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.trg_kit_item_sync() FROM anon, authenticated, PUBLIC;
CREATE TRIGGER epi_kit_itens_sync
AFTER INSERT OR UPDATE OR DELETE ON public.epi_kit_itens
FOR EACH ROW EXECUTE FUNCTION public.trg_kit_item_sync();

CREATE OR REPLACE FUNCTION public.trg_kit_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE f record;
BEGIN
  FOR f IN SELECT id FROM public.funcionarios WHERE cargo_id = NEW.cargo_id AND empresa_id = NEW.empresa_id LOOP
    PERFORM public.sync_requisitos_funcionario(f.id);
  END LOOP;
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.trg_kit_sync() FROM anon, authenticated, PUBLIC;
CREATE TRIGGER epi_kits_sync
AFTER INSERT OR UPDATE OF ativo, versao ON public.epi_kits
FOR EACH ROW EXECUTE FUNCTION public.trg_kit_sync();