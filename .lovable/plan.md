# Fase 0 — Auditoria somente leitura + plano do produto de restaurantes

Nenhum arquivo, tabela, política ou função foi alterado. Abaixo o relatório da auditoria e o plano proposto.

## Limitações registradas (sem alegações falsas)

- **Não existe branch/snapshot/backup acionável por mim neste projeto.** O estado de Git é gerenciado pela plataforma e eu não posso criar `feature/restaurant-product-isolated`. O versionamento disponível é o histórico automático de versões do Lovable (restaurável pelo usuário).
- Só existe um banco (produção). Não há ambiente de desenvolvimento separado. Por isso todas as migrações propostas são **aditivas** (apenas `CREATE`), sem `DROP`/`ALTER` destrutivo e sem seed.
- Volume atual verificado no banco: 2 empresas, 5 funcionários, 5 registros de ponto, 23 entregas de EPI.

## Arquitetura atual verificada

- Painel: `AuthProvider` (Supabase Auth) → `ProtectedRoute` → `AppLayout` (`AppSidebar` + `AppHeader`), rotas aninhadas em `/app/*` (`src/App.tsx`).
- Autorização de rota no frontend por `src/lib/role-access.ts` (`admin`, `tecnico_seguranca`, `rh`, `almoxarifado`), com `user_roles` + `has_role()` no banco.
- Portal: `PortalAuthProvider` com login CPF+PIN via edge function `portal-login`, token em `localStorage`, todo acesso a dados passando por `portal-api` (service role + `requirePortalSession`). Ações existentes: `list_documents`, `count_pending_holerites`, `list_nrs_vencendo`, `list_entregas`, `list_time_entries_today`, `get_meu_kit`, `submit_time_entry`, `submit_epi_request`, `sign_document`, `get_signed_url`, `logout`.
- Multiempresa: todas as tabelas de domínio usam `empresa_id` com RLS `empresa_id = get_user_empresa_id()`. `time_entries` tem SELECT/INSERT/DELETE por empresa e **nenhuma** política de UPDATE.
- **Não existe hoje nenhuma tabela de produto/entitlement/feature flag** — precisa ser criada.

## Relatório Fase 0

| Item | Conteúdo |
| --- | --- |
| Arquivos preservados | `Epis.tsx`, `KitsEpi.tsx`, `IndicadoresEpi.tsx`, `NovaEntrega.tsx`, `Assinar.tsx`, `EntregaDetailModal.tsx`, `PortalEpis.tsx`, `Holerites.tsx`, `PortalHolerites.tsx`, `Admissoes.tsx`, `OnboardingPublico.tsx`, `CartaoPonto.tsx`, `PortalPontos.tsx`, `AppLayout.tsx`, `AppSidebar.tsx`, `AppHeader.tsx`, todas as edge functions atuais exceto `portal-api` |
| Arquivos compartilhados (alteração mínima) | `src/App.tsx` (só adicionar rotas), `src/lib/role-access.ts` (só adicionar rotas novas), `supabase/functions/portal-api/index.ts` (só adicionar novas `action`s), `tailwind.config.ts` (só adicionar tokens de marca) |
| Arquivos novos | `src/lib/product-access.ts`, `src/hooks/useProdutos.ts`, `src/restaurant/brand.ts`, `src/components/restaurant/RestaurantShell.tsx` + sidebar/header, `src/components/RequireProduct.tsx`, `src/pages/restaurant/*` (Dashboard, Turnos, Regimes, Escala, Conformidade, Historico, Configuracoes), `src/pages/portal/restaurant/PortalEscala.tsx`, `src/lib/escala/*` (projeção + validações), testes em `src/test/escala-*.test.ts` |
| Tabelas preservadas (intocadas) | `empresas`, `perfis`, `user_roles`, `funcionarios`, `setores`, `cargos`, `epis`, `entregas`, `epi_*`, `documents`, `admission_*`, `time_entries`, `notificacoes`, `portal_sessions`, `signature_logs`, tabelas de e-mail |
| Tabelas novas | `empresa_produtos`, `restaurant_product_settings`, `restaurant_turnos`, `restaurant_regimes`, `restaurant_modelos_escala`, `restaurant_modelo_escala_itens`, `restaurant_escalas`, `restaurant_escala_blocos`, `restaurant_ajustes_escala`, `restaurant_solicitacoes_troca`, `restaurant_alertas_jornada`, `restaurant_escala_ciencia`, `restaurant_time_entry_context`, `restaurant_notificacao_eventos` |
| Migrações propostas | M1 `empresa_produtos` + `restaurant_product_settings` (produto novo **desabilitado** para todas as empresas, sem backfill de linhas); M2 catálogos (`turnos`, `regimes`); M3 modelos + itens; M4 escalas + blocos + ajustes; M5 trocas + alertas + ciência; M6 `restaurant_time_entry_context` + `restaurant_notificacao_eventos`. Cada uma: só `CREATE TABLE/INDEX/POLICY/GRANT` + trigger `update_updated_at_column` já existente. Reversão = `DROP TABLE` apenas das tabelas criadas naquela migração (nenhum dado do Safeguard envolvido) |
| Riscos | (1) `portal-api` é compartilhada — mitigação: apenas novos `case`, nada removido, e cada novo case checa produto habilitado; (2) rotas `/restaurant/*` novas não colidem com `/app/*`; (3) risco de aparecer menu novo para empresa sem produto — mitigação: flag desabilitada por padrão + `RequireProduct` + RLS por `empresa_produtos`; (4) `time_entries` não será alterada nesta fase |
| Plano de rollback | Por checkpoint: remover rotas/arquivos novos (isolados) e, se necessário, `DROP TABLE` das tabelas `restaurant_*`/`empresa_produtos`. Nenhuma migração toca dados existentes, então rollback não causa perda de dados do Safeguard |
| Testes de regressão | Login do painel; login CPF+PIN; `/app/epis`, `/app/nova-entrega`, assinatura; Holerites; Admissões; ponto no Portal (`submit_time_entry`); notificações; `role-access` inalterado para papéis atuais; empresa sem o produto recebendo acesso negado em `/restaurant/*`; testes unitários de projeção idempotente, múltiplos blocos, 6x1/5x2/12x36 e alertas; execução da suíte `vitest` atual (23 testes de EPI devem continuar passando) |

## Checkpoints propostos (paro em cada um)

1. **CP1** — M1: `empresa_produtos` + `restaurant_product_settings`, RLS, auditoria de ativação. Flag padrão desativada; nenhuma empresa recebe o produto.
2. **CP2** — M2..M6: tabelas de escala com RLS, índices por empresa/colaborador/período e testes de isolamento.
3. **CP3** — Camada de acesso: `useProdutos`, `RequireProduct`, seletor de produto (só quando a empresa tem 2 produtos), `RestaurantShell` com marca por tokens, rotas `/restaurant/*` registradas mas inacessíveis sem a flag.
4. **CP4** — `/restaurant/turnos` e `/restaurant/regimes` (validação de horário, cruzamento de meia-noite, sobreposição, regimes configuráveis por empresa).
5. **CP5** — `/restaurant/escala`: modelo semanal, projeção idempotente (chave única empresa+colaborador+data+turno), versionamento e publicação com auditoria; nunca sobrescreve ajuste manual sem confirmação.
6. **CP6** — `/restaurant/conformidade`: alertas operacionais configuráveis (carga semanal, intervalo entre jornadas, sobreposição, cobertura, ponto sem escala), com texto explícito de que não são conclusões jurídicas.
7. **CP7** — Ponto contextualizado via `restaurant_time_entry_context` (sem alterar `time_entries`), planejado vs realizado.
8. **CP8** — `/portal/restaurant/escala` via novas actions em `portal-api` (escala própria, ciência por versão, solicitação de troca; colaborador não aprova a própria troca).
9. **CP9** — WhatsApp: eventos idempotentes em `restaurant_notificacao_eventos`, templates próprios, mensagens de EPI intocadas.
10. **CP10** — Regressão completa + ativação manual por empresa autorizada. Uniformes/Enxoval fica atrás de flag desativada, fora deste lote.

## Detalhes técnicos

- `empresa_produtos(empresa_id, product_key, enabled, brand_config jsonb, ativado_por, created_at, updated_at)` com unique `(empresa_id, product_key)`; ausência de linha = produto desabilitado (fail-closed), portanto nenhum backfill.
- Função `public.empresa_tem_produto(_empresa_id uuid, _product_key text)` `STABLE SECURITY DEFINER`, usada nas policies das tabelas `restaurant_*`: `empresa_id = get_user_empresa_id() AND empresa_tem_produto(empresa_id, 'restaurant_operations')`.
- GRANTs em toda tabela nova: `SELECT/INSERT/UPDATE/DELETE` para `authenticated` (escrita restrita por papel), `ALL` para `service_role`; sem `anon`.
- Portal continua sem acesso direto às tabelas: leitura da escala só por `portal-api` com service role, filtrando `funcionario_id` da sessão.
- Marca do produto novo centralizada em `src/restaurant/brand.ts` (`BRAND_NAME`, `BRAND_LOGO`, cores etc.) + CSS vars; nenhum texto de EPI/CA/NR no shell novo. Nome definitivo da marca ainda a definir — usarei um placeholder configurável até você informar.
