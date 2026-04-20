

## Plano: Alertas WhatsApp + Relatório PDF Mensal de Ponto

### Parte 1 — Alerta WhatsApp ao RH em batidas anômalas

**Detecção (no momento do INSERT em `time_entries`):**
Após salvar a batida no `RegistroPontoCard.tsx`, classificar como anômala se:
- **Fim de semana**: sábado ou domingo
- **Atraso**: tipo `entrada` após 08:15
- **Hora extra**: tipo `saida` após 18:30
- **Volta tardia do almoço**: `volta_almoco` após 13:15

Se anômala → chamar nova Edge Function `notify-ponto-anomalia` (passa funcionario_id, tipo, recorded_at, motivo, lat/lng).

**Edge Function `notify-ponto-anomalia`:**
1. Busca dados do funcionário e da empresa (nome, setor, telefone do RH em `integracao_whatsapp`)
2. Monta mensagem: `⚠️ Alerta de Ponto — {Nome} ({Setor}) registrou {tipo} às {hora} — Motivo: {atraso/hora extra/fim de semana}. Localização: maps.google.com/?q={lat,lng}`
3. POST para o webhook n8n existente: `https://nextage-n8n.brbss6.easypanel.host/webhook/notify-ponto-anomalia` (novo path no n8n, mesmo padrão dos outros)
4. Insere também em `notificacoes` (sino do dashboard) com `tipo='alerta'`

**Configuração**: parâmetros (horário esperado de entrada/saída/almoço) ficam hardcoded na v1 com defaults razoáveis (08:00 / 12:00-13:00 / 18:00, tolerância 15min). Configurabilidade fica para v2.

### Parte 2 — Relatório PDF mensal de cartão de ponto

**Edge Function `gerar-cartao-ponto-mensal`:**

Input: `{ empresa_id, mes, ano, funcionario_ids?: [] }` (se omitido, gera para todos com batidas no período).

Para cada funcionário:
1. Busca todas batidas do mês ordenadas por data
2. Agrupa por dia → calcula horas trabalhadas (entrada→saída_almoco + volta_almoco→saída) e total mensal
3. Gera PDF com `jsPDF` (já no Edge runtime via esm.sh) contendo:
   - **Cabeçalho**: logo empresa + "Cartão de Ponto — {Mês}/{Ano}" + dados do funcionário (nome, matrícula, cargo, setor)
   - **Tabela diária**: Data | Dia semana | Entrada | Saída Almoço | Volta Almoço | Saída | Horas | Observações (atraso/HE)
   - **Resumo**: Total horas trabalhadas | Atrasos | Horas extras | Faltas
   - **Rodapé com linha de assinatura**: "Declaro que as marcações acima conferem com minha jornada"
4. Upload no bucket `employee_vault` em `{empresa_id}/{funcionario_id}/cartao-ponto-{ano}-{mes}.pdf`
5. INSERT em `documents` com `doc_category='cartao_ponto'`, `signature_status='pendente'`, `reference_period='MM/YYYY'` → entra automaticamente no fluxo existente de assinatura digital + notificação WhatsApp já implementado
6. Retorna `{ gerados: N, erros: [] }`

**UI no Dashboard (`CartaoPonto.tsx` aba "Monitoramento em Tempo Real"):**
- Botão no topo "Gerar Cartões do Mês" → abre modal com selects de Mês/Ano e checkbox "Apenas funcionários com batidas"
- Confirmar → invoca `gerar-cartao-ponto-mensal` → toast progresso → ao final atualiza aba "Cartões Mensais" automaticamente

### Arquivos a alterar/criar
- `supabase/functions/notify-ponto-anomalia/index.ts` (novo) + entry em `config.toml`
- `supabase/functions/gerar-cartao-ponto-mensal/index.ts` (novo) + entry em `config.toml`
- `src/components/portal/RegistroPontoCard.tsx` — após INSERT, detectar anomalia e invocar edge function (fire-and-forget)
- `src/pages/CartaoPonto.tsx` — botão + modal "Gerar Cartões do Mês" na aba Monitoramento
- `src/components/GerarCartoesMensaisModal.tsx` (novo)

### Observações
- **Não toca em `notify-ponto`** existente (esse é só para envio de PDFs já assinados)
- **Webhook n8n**: você precisará criar 1 novo workflow no n8n com path `notify-ponto-anomalia` e ativar
- **PDF gerado** entra no mesmo ciclo de cartões mensais que já existe → assinatura digital + envio WhatsApp herdados automaticamente
- **Horários esperados** começam fixos (08:00/12:00/13:00/18:00 + 15min tolerância). Se quiser configurar por empresa/setor, fica para próxima iteração

