# Kits de EPI por cargo + Indicadores de consumo

## O que já existe hoje (verificado no projeto)

- `funcionarios`: cargo é **texto livre** (`cargo`), setor tem FK (`setor_id`) e também texto legado (`setor`).
- `epis`: nome, CA, `dias_validade`, `quantidade_estoque`. **Não existe campo de custo/preço.**
- `entregas`: funcionário, EPI, datas de entrega/vencimento, assinatura. **Não tem quantidade, nem origem, nem snapshot de setor/cargo.**
- `setores_epis`: vínculo setor → EPI (matriz já usada em Setores).
- `time_entries` + `portal-api` (ações `submit_time_entry`, `list_entregas`, etc.) — o ponto do colaborador passa por essa edge function.
- Assinatura de EPI: `/assinar/:id` + `update-signature`, disparada pelo Portal (`/portal/epis`).
- Papéis: admin, tecnico_seguranca, rh, almoxarifado (`src/lib/role-access.ts`).
- WhatsApp é **manual** por decisão anterior (`EnviarLembreteButton`) — não voltaremos a automatizar disparos sem pedido.

## Decisões que proponho

1. **Cargos passam a ser tabela** (`cargos`), com backfill a partir dos textos distintos já existentes em `funcionarios.cargo`. O campo texto continua preenchido (compatibilidade), mais um novo `cargo_id`.
2. **`entregas` ganha colunas** `quantidade` (default 1), `origem` (`manual`/`kit`), `setor_snapshot`, `cargo_snapshot`, `kit_id`, `kit_item_id`, `registrado_por`. Backfill de snapshot nas entregas antigas com o setor/cargo atual do funcionário (única leitura possível hoje).
3. **Política de irregularidade** inicia em `none` para empresas existentes (não bloquear ninguém silenciosamente); `alert` como sugestão na tela.
4. **Custo por EPI**: não será exibido (não há campo confiável). Deixo o serviço preparado.
5. **WhatsApp**: entra apenas como lembrete manual de item vencendo, reaproveitando o botão existente — sem cron de disparo automático.

## Entrega em 4 ondas

### Onda 1 — Modelo de dados
Migração única com: `cargos`, `epi_kits`, `epi_kit_itens`, `funcionario_epi_requisitos`, `epi_excecoes_ponto`, `epi_policy` (em `empresas` ou tabela própria), `epi_audit_log`, colunas novas em `entregas`, índices para agregação, GRANTs e RLS por `empresa_id` (`get_user_empresa_id()`), e função `sync_requisitos_funcionario(uuid)` idempotente + trigger na mudança de cargo.

### Onda 2 — Kits e integração com a entrega
- Tela **Kits de EPI** (dentro do módulo EPI): lista por cargo/setor/status, criar/editar/ativar, tabela editável de itens (EPI do catálogo, quantidade, vida útil dias/meses, obrigatório), validação de duplicidade/valores, aviso de impacto e sincronização de colaboradores.
- `NovaEntrega` passa a gravar quantidade, origem, snapshots e vínculo com kit; assinatura segue o fluxo atual sem mudança.
- Seção **Kit de EPI do cargo** no perfil do colaborador: badge geral, resumo, item a item com entregue/necessário, CA, última entrega, próximo vencimento, status e ação "Registrar / Renovar" pré-preenchida.

### Onda 3 — Irregularidade, política e Portal
- Bloco **Colaboradores irregulares** no dashboard, com filtros (setor, cargo, motivo, exceção, período) e estados vazio/carregando/erro.
- Configuração **Política de irregularidade de EPI** com explicação em texto claro, confirmação extra para bloqueio rígido e registro em auditoria.
- Aprovação de exceção por gestor (nunca pelo próprio colaborador).
- Portal: tela **Meu Kit de EPI** (linguagem simples, urgência primeiro) e aviso contextual antes de bater ponto.
- `portal-api`: `submit_time_entry` valida a política **no servidor** e devolve mensagem funcional de bloqueio; novas ações `get_meu_kit` e `get_epi_compliance`.

### Onda 4 — Indicadores de consumo
- Tela **Indicadores de Consumo** com filtros de período/setor/item/cargo.
- Consumo por setor no tempo (usando snapshot de setor da entrega), destaque de variação vs. média dos períodos anteriores com tooltip de valor/média/variação e aviso quando os dados são poucos.
- Ranking de itens (quantidade, nº de eventos, participação) e cards de resumo executivo.
- Agregação via RPC/view no banco, não em render.

## Detalhes técnicos

- Vencimento: `days` soma dias; `months` soma meses de calendário preservando o dia, com clamp para o último dia do mês (fev/30-31).
- Status do requisito é **derivado** (pending/partial/valid/expired/waived), nunca digitado.
- Auditoria em `epi_audit_log`: kits, itens, mudança de cargo/sincronização, entregas, exceções, política.
- Visual e motion: tokens e componentes atuais do Ava Safeguard (fundo claro, cards arredondados, sombras suaves), fade-in curto nos cards, `prefers-reduced-motion` respeitado, status sempre cor + texto + ícone.
- Testes (vitest) nos pontos puros: cálculo de vencimento, derivação de status, sincronização idempotente, agregação por snapshot, ranking/filtros.

## Fica pendente de decisão do administrador da empresa

- Modo de política por empresa (começa em "apenas alerta/sem bloqueio").
- Antecedência do lembrete de vencimento.
- Se cargos devem ser amarrados a um setor fixo ou livres.
