-- ============ CARGOS ============
CREATE TABLE public.cargos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  setor_id uuid REFERENCES public.setores(id) ON DELETE SET NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX cargos_empresa_nome_key ON public.cargos (empresa_id, lower(nome));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cargos TO authenticated;
GRANT ALL ON public.cargos TO service_role;
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cargos_select" ON public.cargos FOR SELECT TO authenticated USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "cargos_insert" ON public.cargos FOR INSERT TO authenticated WITH CHECK (empresa_id = public.get_user_empresa_id() AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tecnico_seguranca') OR public.has_role(auth.uid(),'rh')));
CREATE POLICY "cargos_update" ON public.cargos FOR UPDATE TO authenticated USING (empresa_id = public.get_user_empresa_id() AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tecnico_seguranca') OR public.has_role(auth.uid(),'rh'))) WITH CHECK (empresa_id = public.get_user_empresa_id());
CREATE TRIGGER cargos_updated_at BEFORE UPDATE ON public.cargos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.funcionarios ADD COLUMN cargo_id uuid REFERENCES public.cargos(id) ON DELETE SET NULL;

INSERT INTO public.cargos (empresa_id, nome, setor_id)
SELECT DISTINCT f.empresa_id, btrim(f.cargo), NULL::uuid
FROM public.funcionarios f
WHERE f.empresa_id IS NOT NULL AND btrim(coalesce(f.cargo,'')) <> ''
ON CONFLICT DO NOTHING;

UPDATE public.funcionarios f
SET cargo_id = c.id
FROM public.cargos c
WHERE c.empresa_id = f.empresa_id AND lower(c.nome) = lower(btrim(f.cargo)) AND f.cargo_id IS NULL;

-- ============ ENTREGAS: quantidade / origem / snapshots ============
ALTER TABLE public.entregas
  ADD COLUMN quantidade integer NOT NULL DEFAULT 1,
  ADD COLUMN origem text NOT NULL DEFAULT 'manual',
  ADD COLUMN setor_snapshot text,
  ADD COLUMN cargo_snapshot text,
  ADD COLUMN setor_id_snapshot uuid,
  ADD COLUMN kit_id uuid,
  ADD COLUMN kit_item_id uuid,
  ADD COLUMN registrado_por uuid,
  ADD COLUMN cancelado_em timestamptz;

UPDATE public.entregas e
SET setor_snapshot = COALESCE(s.nome, f.setor),
    setor_id_snapshot = f.setor_id,
    cargo_snapshot = f.cargo
FROM public.funcionarios f
LEFT JOIN public.setores s ON s.id = f.setor_id
WHERE f.id = e.funcionario_id AND e.setor_snapshot IS NULL;

CREATE INDEX entregas_empresa_data_idx ON public.entregas (empresa_id, data_entrega);
CREATE INDEX entregas_setor_snapshot_idx ON public.entregas (empresa_id, setor_id_snapshot);
CREATE INDEX entregas_func_epi_idx ON public.entregas (funcionario_id, epi_id);

-- ============ KITS ============
CREATE TABLE public.epi_kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  cargo_id uuid NOT NULL REFERENCES public.cargos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  versao integer NOT NULL DEFAULT 1,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX epi_kits_one_active_per_cargo ON public.epi_kits (empresa_id, cargo_id) WHERE ativo;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.epi_kits TO authenticated;
GRANT ALL ON public.epi_kits TO service_role;
ALTER TABLE public.epi_kits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "epi_kits_select" ON public.epi_kits FOR SELECT TO authenticated USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "epi_kits_write" ON public.epi_kits FOR INSERT TO authenticated WITH CHECK (empresa_id = public.get_user_empresa_id() AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tecnico_seguranca')));
CREATE POLICY "epi_kits_update" ON public.epi_kits FOR UPDATE TO authenticated USING (empresa_id = public.get_user_empresa_id() AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tecnico_seguranca'))) WITH CHECK (empresa_id = public.get_user_empresa_id());
CREATE TRIGGER epi_kits_updated_at BEFORE UPDATE ON public.epi_kits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.epi_kit_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id uuid NOT NULL REFERENCES public.epi_kits(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  epi_id uuid NOT NULL REFERENCES public.epis(id) ON DELETE RESTRICT,
  quantidade_necessaria integer NOT NULL DEFAULT 1 CHECK (quantidade_necessaria > 0),
  validade_valor integer NOT NULL CHECK (validade_valor > 0),
  validade_unidade text NOT NULL DEFAULT 'days' CHECK (validade_unidade IN ('days','months')),
  obrigatorio boolean NOT NULL DEFAULT true,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX epi_kit_itens_unique_epi ON public.epi_kit_itens (kit_id, epi_id) WHERE ativo;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.epi_kit_itens TO authenticated;
GRANT ALL ON public.epi_kit_itens TO service_role;
ALTER TABLE public.epi_kit_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "epi_kit_itens_select" ON public.epi_kit_itens FOR SELECT TO authenticated USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "epi_kit_itens_insert" ON public.epi_kit_itens FOR INSERT TO authenticated WITH CHECK (empresa_id = public.get_user_empresa_id() AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tecnico_seguranca')));
CREATE POLICY "epi_kit_itens_update" ON public.epi_kit_itens FOR UPDATE TO authenticated USING (empresa_id = public.get_user_empresa_id() AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tecnico_seguranca'))) WITH CHECK (empresa_id = public.get_user_empresa_id());
CREATE POLICY "epi_kit_itens_delete" ON public.epi_kit_itens FOR DELETE TO authenticated USING (empresa_id = public.get_user_empresa_id() AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tecnico_seguranca')));
CREATE TRIGGER epi_kit_itens_updated_at BEFORE UPDATE ON public.epi_kit_itens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.entregas ADD CONSTRAINT entregas_kit_fk FOREIGN KEY (kit_id) REFERENCES public.epi_kits(id) ON DELETE SET NULL;
ALTER TABLE public.entregas ADD CONSTRAINT entregas_kit_item_fk FOREIGN KEY (kit_item_id) REFERENCES public.epi_kit_itens(id) ON DELETE SET NULL;

-- ============ REQUISITOS POR FUNCIONARIO ============
CREATE TABLE public.funcionario_epi_requisitos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  funcionario_id uuid NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  kit_id uuid NOT NULL REFERENCES public.epi_kits(id) ON DELETE CASCADE,
  kit_versao integer NOT NULL DEFAULT 1,
  kit_item_id uuid NOT NULL REFERENCES public.epi_kit_itens(id) ON DELETE CASCADE,
  epi_id uuid NOT NULL REFERENCES public.epis(id) ON DELETE CASCADE,
  quantidade_necessaria integer NOT NULL DEFAULT 1,
  quantidade_entregue integer NOT NULL DEFAULT 0,
  obrigatorio boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','partial','valid','expired','waived')),
  ultima_entrega_id uuid REFERENCES public.entregas(id) ON DELETE SET NULL,
  proxima_vencimento timestamptz,
  resolvido_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX fer_unique ON public.funcionario_epi_requisitos (funcionario_id, kit_item_id);
CREATE INDEX fer_empresa_status_idx ON public.funcionario_epi_requisitos (empresa_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.funcionario_epi_requisitos TO authenticated;
GRANT ALL ON public.funcionario_epi_requisitos TO service_role;
ALTER TABLE public.funcionario_epi_requisitos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fer_select" ON public.funcionario_epi_requisitos FOR SELECT TO authenticated USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "fer_update" ON public.funcionario_epi_requisitos FOR UPDATE TO authenticated USING (empresa_id = public.get_user_empresa_id() AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tecnico_seguranca'))) WITH CHECK (empresa_id = public.get_user_empresa_id());
CREATE TRIGGER fer_updated_at BEFORE UPDATE ON public.funcionario_epi_requisitos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ POLITICA DE IRREGULARIDADE ============
CREATE TABLE public.epi_policies (
  empresa_id uuid PRIMARY KEY REFERENCES public.empresas(id) ON DELETE CASCADE,
  modo text NOT NULL DEFAULT 'none' CHECK (modo IN ('none','alert','hard_block')),
  aviso_antecedencia_dias integer NOT NULL DEFAULT 15 CHECK (aviso_antecedencia_dias >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.epi_policies TO authenticated;
GRANT ALL ON public.epi_policies TO service_role;
ALTER TABLE public.epi_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "epi_policies_select" ON public.epi_policies FOR SELECT TO authenticated USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "epi_policies_insert" ON public.epi_policies FOR INSERT TO authenticated WITH CHECK (empresa_id = public.get_user_empresa_id() AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "epi_policies_update" ON public.epi_policies FOR UPDATE TO authenticated USING (empresa_id = public.get_user_empresa_id() AND public.has_role(auth.uid(),'admin')) WITH CHECK (empresa_id = public.get_user_empresa_id());
CREATE TRIGGER epi_policies_updated_at BEFORE UPDATE ON public.epi_policies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.epi_policies (empresa_id, modo) SELECT id, 'none' FROM public.empresas ON CONFLICT DO NOTHING;

-- ============ EXCECOES DE PONTO ============
CREATE TABLE public.epi_excecoes_ponto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  funcionario_id uuid NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  data_referencia date NOT NULL,
  turno text,
  motivo text NOT NULL,
  observacao text,
  aprovado_por uuid NOT NULL,
  aprovado_em timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX epi_excecoes_unique ON public.epi_excecoes_ponto (funcionario_id, data_referencia, coalesce(turno,''));
GRANT SELECT, INSERT ON public.epi_excecoes_ponto TO authenticated;
GRANT ALL ON public.epi_excecoes_ponto TO service_role;
ALTER TABLE public.epi_excecoes_ponto ENABLE ROW LEVEL SECURITY;
CREATE POLICY "epi_excecoes_select" ON public.epi_excecoes_ponto FOR SELECT TO authenticated USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "epi_excecoes_insert" ON public.epi_excecoes_ponto FOR INSERT TO authenticated WITH CHECK (
  empresa_id = public.get_user_empresa_id()
  AND aprovado_por = auth.uid()
  AND funcionario_id <> auth.uid()
  AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tecnico_seguranca') OR public.has_role(auth.uid(),'rh'))
);

-- ============ AUDITORIA ============
CREATE TABLE public.epi_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  actor_id uuid,
  entity text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX epi_audit_empresa_idx ON public.epi_audit_log (empresa_id, created_at DESC);
GRANT SELECT, INSERT ON public.epi_audit_log TO authenticated;
GRANT ALL ON public.epi_audit_log TO service_role;
ALTER TABLE public.epi_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "epi_audit_select" ON public.epi_audit_log FOR SELECT TO authenticated USING (empresa_id = public.get_user_empresa_id() AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "epi_audit_insert" ON public.epi_audit_log FOR INSERT TO authenticated WITH CHECK (empresa_id = public.get_user_empresa_id() AND actor_id = auth.uid());

-- ============ CALCULO DE VENCIMENTO ============
CREATE OR REPLACE FUNCTION public.epi_calc_vencimento(_base timestamptz, _valor integer, _unidade text)
RETURNS timestamptz LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE WHEN _unidade = 'months' THEN _base + make_interval(months => _valor)
              ELSE _base + make_interval(days => _valor) END
$$;

-- ============ SINCRONIZACAO IDEMPOTENTE DE REQUISITOS ============
CREATE OR REPLACE FUNCTION public.sync_requisitos_funcionario(_funcionario_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  f record;
  k record;
BEGIN
  SELECT id, empresa_id, cargo_id INTO f FROM public.funcionarios WHERE id = _funcionario_id;
  IF f.id IS NULL OR f.empresa_id IS NULL THEN RETURN; END IF;

  SELECT * INTO k FROM public.epi_kits
   WHERE empresa_id = f.empresa_id AND cargo_id = f.cargo_id AND ativo LIMIT 1;

  IF k.id IS NOT NULL THEN
    INSERT INTO public.funcionario_epi_requisitos
      (empresa_id, funcionario_id, kit_id, kit_versao, kit_item_id, epi_id, quantidade_necessaria, obrigatorio)
    SELECT f.empresa_id, f.id, k.id, k.versao, i.id, i.epi_id, i.quantidade_necessaria, i.obrigatorio
    FROM public.epi_kit_itens i
    WHERE i.kit_id = k.id AND i.ativo
    ON CONFLICT (funcionario_id, kit_item_id) DO UPDATE
      SET quantidade_necessaria = EXCLUDED.quantidade_necessaria,
          obrigatorio = EXCLUDED.obrigatorio,
          kit_versao = EXCLUDED.kit_versao;

    -- remove requisitos de itens desativados/removidos do kit vigente
    DELETE FROM public.funcionario_epi_requisitos r
     WHERE r.funcionario_id = f.id AND r.kit_id = k.id
       AND NOT EXISTS (SELECT 1 FROM public.epi_kit_itens i WHERE i.id = r.kit_item_id AND i.ativo);
  END IF;

  -- requisitos de kits que nao pertencem mais ao cargo atual saem da lista vigente
  DELETE FROM public.funcionario_epi_requisitos r
   WHERE r.funcionario_id = f.id AND (k.id IS NULL OR r.kit_id <> k.id);

  PERFORM public.recalc_requisitos_funcionario(_funcionario_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.recalc_requisitos_funcionario(_funcionario_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; last_e record; qty integer; venc timestamptz; new_status text;
BEGIN
  FOR r IN SELECT * FROM public.funcionario_epi_requisitos WHERE funcionario_id = _funcionario_id LOOP
    IF r.status = 'waived' THEN CONTINUE; END IF;

    SELECT e.id, e.data_vencimento, e.data_entrega, e.quantidade
      INTO last_e
      FROM public.entregas e
     WHERE e.funcionario_id = _funcionario_id AND e.epi_id = r.epi_id AND e.cancelado_em IS NULL
     ORDER BY COALESCE(e.data_entrega, e.created_at) DESC LIMIT 1;

    IF last_e.id IS NULL THEN
      qty := 0; venc := NULL; new_status := 'pending';
    ELSE
      SELECT COALESCE(SUM(e.quantidade),0) INTO qty
        FROM public.entregas e
       WHERE e.funcionario_id = _funcionario_id AND e.epi_id = r.epi_id AND e.cancelado_em IS NULL
         AND COALESCE(e.data_entrega, e.created_at) >= COALESCE(last_e.data_entrega, now()) - interval '1 day';
      venc := last_e.data_vencimento;
      IF venc IS NOT NULL AND venc <= now() THEN new_status := 'expired';
      ELSIF qty < r.quantidade_necessaria THEN new_status := 'partial';
      ELSE new_status := 'valid';
      END IF;
    END IF;

    UPDATE public.funcionario_epi_requisitos
       SET quantidade_entregue = qty,
           ultima_entrega_id = last_e.id,
           proxima_vencimento = venc,
           status = new_status,
           resolvido_em = CASE WHEN new_status = 'valid' THEN now() ELSE NULL END
     WHERE id = r.id;
  END LOOP;
END;
$$;

-- triggers de sincronizacao
CREATE OR REPLACE FUNCTION public.trg_funcionario_cargo_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.sync_requisitos_funcionario(NEW.id);
  RETURN NEW;
END;
$$;
CREATE TRIGGER funcionarios_sync_requisitos
AFTER INSERT OR UPDATE OF cargo_id ON public.funcionarios
FOR EACH ROW EXECUTE FUNCTION public.trg_funcionario_cargo_sync();

CREATE OR REPLACE FUNCTION public.trg_entrega_recalc()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.recalc_requisitos_funcionario(COALESCE(NEW.funcionario_id, OLD.funcionario_id));
  RETURN NULL;
END;
$$;
CREATE TRIGGER entregas_recalc_requisitos
AFTER INSERT OR UPDATE OR DELETE ON public.entregas
FOR EACH ROW EXECUTE FUNCTION public.trg_entrega_recalc();

-- ============ AGREGACAO DE CONSUMO ============
CREATE OR REPLACE FUNCTION public.epi_consumo_por_setor(_inicio timestamptz, _fim timestamptz, _bucket text DEFAULT 'month')
RETURNS TABLE(periodo timestamptz, setor text, total bigint, eventos bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT date_trunc(CASE WHEN _bucket IN ('month','quarter','year','week','day') THEN _bucket ELSE 'month' END,
                    COALESCE(e.data_entrega, e.created_at)) AS periodo,
         COALESCE(e.setor_snapshot, 'Sem setor') AS setor,
         SUM(e.quantidade)::bigint AS total,
         COUNT(*)::bigint AS eventos
  FROM public.entregas e
  WHERE e.empresa_id = public.get_user_empresa_id()
    AND e.cancelado_em IS NULL
    AND COALESCE(e.data_entrega, e.created_at) >= _inicio
    AND COALESCE(e.data_entrega, e.created_at) < _fim
  GROUP BY 1, 2
  ORDER BY 1, 2
$$;

CREATE OR REPLACE FUNCTION public.epi_consumo_ranking(_inicio timestamptz, _fim timestamptz, _setor text DEFAULT NULL)
RETURNS TABLE(epi_id uuid, nome_equipamento text, numero_ca text, total bigint, eventos bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.nome_equipamento, p.numero_ca, SUM(e.quantidade)::bigint, COUNT(*)::bigint
  FROM public.entregas e
  JOIN public.epis p ON p.id = e.epi_id
  WHERE e.empresa_id = public.get_user_empresa_id()
    AND e.cancelado_em IS NULL
    AND COALESCE(e.data_entrega, e.created_at) >= _inicio
    AND COALESCE(e.data_entrega, e.created_at) < _fim
    AND (_setor IS NULL OR COALESCE(e.setor_snapshot,'Sem setor') = _setor)
  GROUP BY p.id, p.nome_equipamento, p.numero_ca
  ORDER BY 4 DESC
$$;

GRANT EXECUTE ON FUNCTION public.epi_consumo_por_setor(timestamptz, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.epi_consumo_ranking(timestamptz, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_requisitos_funcionario(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recalc_requisitos_funcionario(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.epi_calc_vencimento(timestamptz, integer, text) TO authenticated;