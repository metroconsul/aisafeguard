
The user wants to add geolocation-based time clock functionality. Let me explore the relevant existing files to understand the current architecture before planning.
<lov-tool-use id="toolu_vrtx_014DqampfyQSLpaPWpjbUGRr" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/CartaoPonto.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01LPdcn9ktChwJJvcMG3SgMb" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/portal/PortalLayout.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01JLqLpQseJ8JBAg6PEyu88b" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/portal/BottomTabBar.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_011Dhkgafcaae9ukMhFqk3C6" name="code--view" integration-id="code" data="{\"file_path\": \"src/App.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01Mw6TMwYY3BY2PVmcn1CBeL" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/CartaoPonto.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01XUtwzxVcTLzG1C1CDSrXmK" name="code--view" integration-id="code" data="{\"file_path\": \"src/App.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01DEdrWm36dbPz1Bcrm8pp6c" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/portal/BottomTabBar.tsx\"}">
</lov-tool-use>
Tenho contexto suficiente. Importante: o schema proposto pelo usuário usa `employees` table, mas o projeto usa `funcionarios`. Auth do portal é via CPF+PIN custom (não `auth.uid()`), então a RLS sugerida não funciona — precisa adaptar.

<lov-plan>
## Plano: Bater Ponto com Geolocalização

### Análise crítica do SQL proposto
O schema sugerido tem 2 problemas que precisam ser ajustados antes de criar:
1. **Tabela errada**: o projeto usa `funcionarios` (não `employees`).
2. **RLS incompatível**: o Portal do Colaborador NÃO usa Supabase Auth — autentica via CPF+PIN com Edge Function (`portal-login`) e armazena no localStorage. Logo, `auth.uid()` será `null` no portal e a policy proposta **bloquearia tudo**. Vou usar o mesmo padrão das outras tabelas do portal: policies `anon` permissivas para insert/select, e tenant isolation por `empresa_id` para o Dashboard RH.

### 1. Banco de dados (migration)

Criar tabela `time_entries`:
- `id`, `empresa_id`, `funcionario_id` (não `employee_id`, para manter consistência)
- `tipo` text (entrada / saida_almoco / volta_almoco / saida)
- `recorded_at` timestamptz default now() — **horário do servidor**, não confiar no celular
- `latitude`, `longitude`, `accuracy` numeric
- `address_reference` text, `device_info` text
- Index em `(empresa_id, recorded_at desc)` e `(funcionario_id, recorded_at desc)`

RLS:
- **anon insert**: permitido se `funcionario_id` e `empresa_id` não nulos (portal mobile)
- **anon select**: `true` (portal lê próprias batidas via filtro client-side por funcionario_id)
- **authenticated select/delete**: tenant isolation via `empresa_id = get_user_empresa_id()` (RH vê tudo da empresa)

### 2. Portal Colaborador — `PortalHome.tsx`

Adicionar Card "Registro de Jornada" no topo (antes de Pendências):
- Relógio digital grande (HH:mm:ss) atualizado a cada 1s via `setInterval`
- Data por extenso abaixo
- Botão circular grande gradient primary com ícone `MapPin`: "Registrar Ponto Agora"
- Detecção automática do próximo tipo de batida baseada nas batidas de hoje (entrada → saida_almoco → volta_almoco → saida → entrada do próximo dia)
- Lista compacta "Últimas batidas de hoje" abaixo (horário + tipo + badge verde)

Fluxo do clique:
1. Chama `navigator.geolocation.getCurrentPosition` (high accuracy)
2. Se negado/erro → toast vermelho: "Acesso ao GPS é obrigatório"
3. Modal de confirmação mostrando: tipo da batida, hora atual, coordenadas + precisão (`±15m`)
4. Confirmar → INSERT em `time_entries` com `recorded_at` omitido (default `now()` do servidor)
5. Sucesso → tela/toast com check verde: "Ponto batido às HH:mm" + atualiza lista

`device_info`: capturar `navigator.userAgent` resumido.

### 3. Dashboard RH — `CartaoPonto.tsx`

Envolver conteúdo atual com `Tabs`:
- **Aba "Cartões Mensais"**: tabela atual existente (PDFs assinados)
- **Aba "Monitoramento em Tempo Real"** (nova):
  - Filtro de data (default: hoje)
  - KPIs: Total batidas hoje / Funcionários presentes / Atrasos (opcional v2)
  - Tabela: Funcionário | Setor | Horário | Tipo (badge colorido) | Precisão GPS | Ações
  - Botão "Ver Localização" → abre `https://www.google.com/maps?q=lat,lng` em nova aba
  - Auto-refresh a cada 30s via `refetchInterval` do react-query

### Arquivos a alterar/criar
- `supabase/migrations/...` — nova tabela `time_entries` + RLS
- `src/pages/portal/PortalHome.tsx` — card de registro de ponto
- `src/pages/CartaoPonto.tsx` — adicionar Tabs com aba Monitoramento
- `src/components/portal/RegistroPontoCard.tsx` (novo) — extrair lógica do botão+relógio+modal

### Observações
- Sem alteração nos webhooks n8n nesta etapa (o usuário não pediu disparo automático ao bater ponto — pode ser sugerido depois).
- Segurança: o horário gravado é sempre do servidor (`now()`), impedindo manipulação pelo celular. As coordenadas servem para auditoria pelo RH.
