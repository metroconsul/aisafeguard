-- CP2: restaurant scheduling module (additive only)

-- 1. TURNOS
CREATE TABLE public.restaurant_turnos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  hora_inicio time NOT NULL,
  hora_fim time NOT NULL,
  cruza_meia_noite boolean NOT NULL DEFAULT false,
  cor text NOT NULL DEFAULT '#2563EB',
  ativo boolean NOT NULL DEFAULT true,
  criado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_rt_empresa ON public.restaurant_turnos(empresa_id, ativo);
CREATE UNIQUE INDEX idx_rt_nome ON public.restaurant_turnos(empresa_id, lower(nome));

-- 2. REGIMES
CREATE TABLE public.restaurant_regimes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  tipo text NOT NULL DEFAULT 'personalizado',
  dias_trabalho integer NOT NULL DEFAULT 5,
  dias_folga integer NOT NULL DEFAULT 2,
  carga_semanal_horas numeric NOT NULL DEFAULT 44,
  intervalo_minimo_horas numeric NOT NULL DEFAULT 11,
  ciclo_dias integer,
  origem_regra text NOT NULL DEFAULT 'configuracao_empresa',
  observacao text,
  ativo boolean NOT NULL DEFAULT true,
  criado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rr_tipo_check CHECK (tipo IN ('6x1','5x2','12x36','personalizado'))
);
CREATE INDEX idx_rr_empresa ON public.restaurant_regimes(empresa_id, ativo);
CREATE UNIQUE INDEX idx_rr_nome ON public.restaurant_regimes(empresa_id, lower(nome));

-- 3. MODELOS
CREATE TABLE public.restaurant_modelos_escala (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  regime_id uuid REFERENCES public.restaurant_regimes(id) ON DELETE SET NULL,
  vigencia_inicio date NOT NULL DEFAULT CURRENT_DATE,
  vigencia_fim date,
  status text NOT NULL DEFAULT 'rascunho',
  versao integer NOT NULL DEFAULT 1,
  criado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rme_status_check CHECK (status IN ('rascunho','ativo','arquivado'))
);
CREATE INDEX idx_rme_empresa ON public.restaurant_modelos_escala(empresa_id, status);

CREATE TABLE public.restaurant_modelo_escala_itens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  modelo_id uuid NOT NULL REFERENCES public.restaurant_modelos_escala(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  funcionario_id uuid REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  setor_id uuid REFERENCES public.setores(id) ON DELETE SET NULL,
  dia_semana integer NOT NULL,
  turno_id uuid REFERENCES public.restaurant_turnos(id) ON DELETE CASCADE,
  ordem integer NOT NULL DEFAULT 1,
  folga boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rmei_dia_check CHECK (dia_semana BETWEEN 0 AND 6),
  CONSTRAINT rmei_turno_check CHECK (folga OR turno_id IS NOT NULL)
);
CREATE INDEX idx_rmei_modelo ON public.restaurant_modelo_escala_itens(modelo_id, dia_semana);
CREATE INDEX idx_rmei_empresa_func ON public.restaurant_modelo_escala_itens(empresa_id, funcionario_id);
CREATE UNIQUE INDEX idx_rmei_unico ON public.restaurant_modelo_escala_itens(modelo_id, funcionario_id, dia_semana, ordem);

-- 4. ESCALAS
CREATE TABLE public.restaurant_escalas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  funcionario_id uuid NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  data date NOT NULL,
  status text NOT NULL DEFAULT 'rascunho',
  origem text NOT NULL DEFAULT 'projecao',
  modelo_id uuid REFERENCES public.restaurant_modelos_escala(id) ON DELETE SET NULL,
  regime_id uuid REFERENCES public.restaurant_regimes(id) ON DELETE SET NULL,
  folga boolean NOT NULL DEFAULT false,
  versao_publicada integer,
  publicado_em timestamptz,
  publicado_por uuid,
  editado_manualmente boolean NOT NULL DEFAULT false,
  observacao text,
  criado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT re_status_check CHECK (status IN ('rascunho','publicada','cancelada')),
  CONSTRAINT re_origem_check CHECK (origem IN ('projecao','manual','troca','substituicao')),
  CONSTRAINT re_unica UNIQUE (empresa_id, funcionario_id, data)
);
CREATE INDEX idx_re_empresa_data ON public.restaurant_escalas(empresa_id, data);
CREATE INDEX idx_re_func_data ON public.restaurant_escalas(funcionario_id, data);
CREATE INDEX idx_re_status ON public.restaurant_escalas(empresa_id, status, data);

CREATE TABLE public.restaurant_escala_blocos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  escala_id uuid NOT NULL REFERENCES public.restaurant_escalas(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  turno_id uuid REFERENCES public.restaurant_turnos(id) ON DELETE SET NULL,
  ordem integer NOT NULL DEFAULT 1,
  inicio_previsto timestamptz NOT NULL,
  fim_previsto timestamptz NOT NULL,
  turno_nome_snapshot text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reb_unico UNIQUE (escala_id, ordem)
);
CREATE INDEX idx_reb_escala ON public.restaurant_escala_blocos(escala_id);
CREATE INDEX idx_reb_empresa_periodo ON public.restaurant_escala_blocos(empresa_id, inicio_previsto);

-- 5. AJUSTES
CREATE TABLE public.restaurant_ajustes_escala (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  escala_id uuid REFERENCES public.restaurant_escalas(id) ON DELETE CASCADE,
  funcionario_id uuid REFERENCES public.funcionarios(id) ON DELETE SET NULL,
  tipo text NOT NULL,
  motivo text,
  substituto_id uuid REFERENCES public.funcionarios(id) ON DELETE SET NULL,
  old_value jsonb,
  new_value jsonb,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rae_tipo_check CHECK (tipo IN ('alteracao','folga','ausencia','substituicao','cancelamento','publicacao'))
);
CREATE INDEX idx_rae_empresa ON public.restaurant_ajustes_escala(empresa_id, created_at DESC);
CREATE INDEX idx_rae_escala ON public.restaurant_ajustes_escala(escala_id);

-- 6. TROCAS
CREATE TABLE public.restaurant_solicitacoes_troca (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  solicitante_id uuid NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  destinatario_id uuid REFERENCES public.funcionarios(id) ON DELETE SET NULL,
  escala_origem_id uuid REFERENCES public.restaurant_escalas(id) ON DELETE CASCADE,
  escala_destino_id uuid REFERENCES public.restaurant_escalas(id) ON DELETE SET NULL,
  turno_origem_id uuid REFERENCES public.restaurant_turnos(id) ON DELETE SET NULL,
  turno_proposto_id uuid REFERENCES public.restaurant_turnos(id) ON DELETE SET NULL,
  motivo text,
  status text NOT NULL DEFAULT 'pendente',
  aprovador_id uuid,
  decidido_em timestamptz,
  decisao_observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rst_status_check CHECK (status IN ('pendente','aprovada','recusada','cancelada'))
);
CREATE INDEX idx_rst_empresa_status ON public.restaurant_solicitacoes_troca(empresa_id, status, created_at DESC);
CREATE INDEX idx_rst_solicitante ON public.restaurant_solicitacoes_troca(solicitante_id);

-- 7. ALERTAS
CREATE TABLE public.restaurant_alertas_jornada (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  funcionario_id uuid REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  escala_id uuid REFERENCES public.restaurant_escalas(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  severidade text NOT NULL DEFAULT 'aviso',
  status text NOT NULL DEFAULT 'aberto',
  periodo_inicio date,
  periodo_fim date,
  detalhe jsonb NOT NULL DEFAULT '{}'::jsonb,
  mensagem text NOT NULL,
  resolvido_em timestamptz,
  resolvido_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT raj_tipo_check CHECK (tipo IN ('conflito','excesso_horas','intervalo_insuficiente','sobreposicao','sem_cobertura','ponto_sem_escala')),
  CONSTRAINT raj_sev_check CHECK (severidade IN ('info','aviso','critico')),
  CONSTRAINT raj_status_check CHECK (status IN ('aberto','resolvido','ignorado'))
);
CREATE INDEX idx_raj_empresa ON public.restaurant_alertas_jornada(empresa_id, status, severidade);
CREATE INDEX idx_raj_func_periodo ON public.restaurant_alertas_jornada(funcionario_id, periodo_inicio);

-- 8. CIENCIA
CREATE TABLE public.restaurant_escala_ciencia (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  funcionario_id uuid NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  modelo_id uuid REFERENCES public.restaurant_modelos_escala(id) ON DELETE SET NULL,
  periodo_inicio date NOT NULL,
  periodo_fim date NOT NULL,
  versao integer NOT NULL DEFAULT 1,
  visualizado_em timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rec_unico UNIQUE (funcionario_id, periodo_inicio, periodo_fim, versao)
);
CREATE INDEX idx_rec_empresa ON public.restaurant_escala_ciencia(empresa_id, periodo_inicio);

-- 9. PONTO x ESCALA (sem alterar time_entries)
CREATE TABLE public.restaurant_time_entry_context (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  time_entry_id uuid NOT NULL REFERENCES public.time_entries(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  funcionario_id uuid NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  escala_id uuid REFERENCES public.restaurant_escalas(id) ON DELETE SET NULL,
  escala_bloco_id uuid REFERENCES public.restaurant_escala_blocos(id) ON DELETE SET NULL,
  sem_escala boolean NOT NULL DEFAULT false,
  desvio_minutos integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rtec_unico UNIQUE (time_entry_id)
);
CREATE INDEX idx_rtec_empresa ON public.restaurant_time_entry_context(empresa_id, created_at DESC);
CREATE INDEX idx_rtec_escala ON public.restaurant_time_entry_context(escala_id);

-- 10. EVENTOS DE NOTIFICACAO (idempotencia)
CREATE TABLE public.restaurant_notificacao_eventos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  funcionario_id uuid REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  evento text NOT NULL,
  dedupe_key text NOT NULL,
  canal text NOT NULL DEFAULT 'whatsapp',
  status text NOT NULL DEFAULT 'pendente',
  tentativas integer NOT NULL DEFAULT 0,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  erro text,
  enviado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rne_evento_check CHECK (evento IN ('escala_publicada','alteracao_ultima_hora','troca_aprovada','troca_recusada')),
  CONSTRAINT rne_status_check CHECK (status IN ('pendente','enviado','falha')),
  CONSTRAINT rne_dedupe UNIQUE (empresa_id, dedupe_key)
);
CREATE INDEX idx_rne_empresa_status ON public.restaurant_notificacao_eventos(empresa_id, status);

-- RLS + GRANTS + POLICIES
DO $do$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'restaurant_turnos','restaurant_regimes','restaurant_modelos_escala','restaurant_modelo_escala_itens',
    'restaurant_escalas','restaurant_escala_blocos','restaurant_ajustes_escala','restaurant_solicitacoes_troca',
    'restaurant_alertas_jornada','restaurant_escala_ciencia','restaurant_time_entry_context',
    'restaurant_notificacao_eventos'
  ]
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format($f$CREATE POLICY %I ON public.%I FOR SELECT TO authenticated
      USING (empresa_id = public.get_user_empresa_id()
             AND public.empresa_tem_produto(empresa_id, 'restaurant_operations'))$f$, t || '_select', t);
    EXECUTE format($f$CREATE POLICY %I ON public.%I FOR INSERT TO authenticated
      WITH CHECK (empresa_id = public.get_user_empresa_id()
             AND public.empresa_tem_produto(empresa_id, 'restaurant_operations'))$f$, t || '_insert', t);
    EXECUTE format($f$CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated
      USING (empresa_id = public.get_user_empresa_id()
             AND public.empresa_tem_produto(empresa_id, 'restaurant_operations'))
      WITH CHECK (empresa_id = public.get_user_empresa_id())$f$, t || '_update', t);
    EXECUTE format($f$CREATE POLICY %I ON public.%I FOR DELETE TO authenticated
      USING (empresa_id = public.get_user_empresa_id()
             AND public.empresa_tem_produto(empresa_id, 'restaurant_operations')
             AND (public.has_role(auth.uid(), 'admin'::app_role)
                  OR public.has_role(auth.uid(), 'rh'::app_role)))$f$, t || '_delete', t);
  END LOOP;
END
$do$;

-- updated_at triggers
DO $do$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'restaurant_turnos','restaurant_regimes','restaurant_modelos_escala','restaurant_modelo_escala_itens',
    'restaurant_escalas','restaurant_escala_blocos','restaurant_solicitacoes_troca',
    'restaurant_alertas_jornada','restaurant_time_entry_context','restaurant_notificacao_eventos'
  ]
  LOOP
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t || '_updated_at', t);
  END LOOP;
END
$do$;
