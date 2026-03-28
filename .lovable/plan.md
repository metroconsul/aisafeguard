

# Plano: Módulo de Gestão e Disparo de Holerites

## Resumo

Criar a página `/app/holerites` com gestão completa de holerites (upload, disparo, auditoria de assinaturas) acessível para Admin e RH, incluindo Edge Function para notificação via n8n.

## Mudanças

### 1. Rota e Permissões

**`src/lib/role-access.ts`** — Adicionar `/app/holerites` nas rotas de `admin` e `rh`.

**`src/components/AppSidebar.tsx`** — Adicionar item "Holerites" no menu (ícone `FileText`), no grupo "Geral".

**`src/App.tsx`** — Adicionar rota `<Route path="/holerites" element={<Holerites />} />` dentro das rotas protegidas.

### 2. Página Principal (`src/pages/Holerites.tsx`)

- **Header**: Título + botão "Novo Disparo de Holerite" + botão secundário "Gerar Relatório de Fechamento"
- **Filtro**: Select de Mês/Ano de referência (últimos 12 meses)
- **KPIs**: 3 cards — Total Emitido, Assinados (verde), Pendentes (amarelo/vermelho)
- **Tabela de Auditoria**: Colunas: Funcionário, Setor, PDF, Status (badge), Data/Hora + IP da assinatura, Ações (Visualizar PDF, Reenviar WhatsApp)
- Dados puxados da tabela `documents` filtrados por `doc_category = 'holerite'` e `reference_period` = mês selecionado
- Joins com `funcionarios` para nome/setor/telefone

### 3. Modal de Novo Disparo (`src/components/NovoHoleriteModal.tsx`)

- Select Mês/Ano de Referência (obrigatório)
- Select Destinatário: "Um Funcionário" (busca) ou "Envio em Lote"
- Input File drag & drop para PDF
- Checkbox "Notificar via WhatsApp" (marcado por padrão)
- Fluxo no submit:
  1. Upload do PDF para bucket `employee_vault`
  2. Insert na tabela `documents` (doc_category='holerite', signature_status='pendente')
  3. Invoke Edge Function `notify-holerite` com payload
  4. Toast de sucesso/erro com loading state

### 4. Edge Function (`supabase/functions/notify-holerite/index.ts`)

- CORS headers padrão
- Recebe payload: `document_id`, `employee_id`, `employee_name`, `phone`, `reference_period`, `action`
- Faz POST para `Deno.env.get('N8N_WEBHOOK_URL')` (fallback string vazia)
- Adiciona `portal_url: 'https://aisafeguard.lovable.app/portal'` ao payload
- Retorna `{ success: true }` ou erro com status 400
- `verify_jwt = false` no config.toml

### 5. Relatório de Fechamento

- Botão "Gerar Relatório de Fechamento do Mês" abre `window.print()` com uma view formatada listando todos os funcionários e status de assinatura do mês selecionado (CSS `@media print`)

### 6. Banco de Dados

Nenhuma migração necessária — a tabela `documents` já possui todos os campos necessários (`doc_category`, `signature_status`, `reference_period`, `signed_at`, `signature_ip`, `file_url`, `funcionario_id`, `empresa_id`). A tabela `signature_logs` já existe para auditoria.

### 7. Secret

Será necessário adicionar o secret `N8N_WEBHOOK_URL` para a Edge Function (usando `add_secret`).

## Arquivos Criados/Editados

| Arquivo | Ação |
|---|---|
| `src/pages/Holerites.tsx` | Criar |
| `src/components/NovoHoleriteModal.tsx` | Criar |
| `supabase/functions/notify-holerite/index.ts` | Criar |
| `src/lib/role-access.ts` | Editar (add rota) |
| `src/components/AppSidebar.tsx` | Editar (add menu) |
| `src/App.tsx` | Editar (add rota) |
| `supabase/config.toml` | Editar (add function config) |

