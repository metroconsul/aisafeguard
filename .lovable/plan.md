## Redesign completo de Nova Entrega de EPI

Reescrita visual + funcional da página `/app/nova-entrega` para uma experiência tipo "kit do dia": comboboxes com busca para Funcionário/Obra, grid visual de EPIs com seleção múltipla, e CTA grande no rodapé. Mantém o webhook e o registro em `entregas`.

### Mudança funcional importante (escopo)

A página atual permite **1 EPI por entrega**. O grid de seleção múltipla implica registrar **N entregas de uma vez** (uma por EPI selecionado), cada uma gerando seu próprio link de assinatura. Vou:
- Inserir uma linha em `entregas` por EPI selecionado (mesmo funcionário/obra)
- Disparar o webhook para cada uma
- Mostrar a lista de links gerados no estado de sucesso (ao invés de um único link)

Se preferir manter "1 EPI por vez", me avise — basta usar `RadioGroup` no lugar do toggle de seleção múltipla.

### Estrutura do redesign

`src/pages/NovaEntrega.tsx` reescrita:

**Container:** `bg-white rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 p-8 max-w-5xl mx-auto`

**Header dentro do container:** título `text-2xl font-extrabold text-gray-900` + subtítulo `text-sm text-gray-500`

**Seção 1 — Seleção (grid 2 colunas em md+):**
- Combobox de Funcionário (busca por nome) e Combobox de Obra. Usar shadcn `Popover` + `Command` para busca real, mas estilizar o trigger como input:
  - Trigger: `w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center gap-2`
  - Ícone `Search` à esquerda em `text-gray-400 w-4 h-4`
  - Placeholder: "Buscar funcionário…" / "Buscar obra…"
  - Label acima: `text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2`

**Seção 2 — Grid de EPIs:**
- Subtítulo: "Selecione os Equipamentos" — `text-xl font-bold text-gray-900 mt-10 mb-4`. À direita do subtítulo um contador discreto "X disponíveis".
- Grid: `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5`
- Card EPI (componente local `EpiCard`):
  - Padrão: `flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-gray-100 bg-white cursor-pointer hover:border-indigo-300 hover:shadow-md hover:-translate-y-1 transition-all duration-200 relative`
  - Selecionado: `border-2 border-indigo-600 bg-indigo-50/50` + ícone `Check` em `absolute top-3 right-3 w-6 h-6 bg-indigo-600 text-white rounded-full p-1 shadow-sm`
  - Slot de foto: `w-24 h-24 bg-slate-50 rounded-xl mb-3 flex items-center justify-center` com ícone selecionado por categoria — mapa por nome do EPI (capacete → `HardHat`, óculos → `Glasses`, luva → `Hand`, bota → `Footprints`, fallback → `Shield`), `w-10 h-10 text-slate-400`
  - Nome: `text-sm font-bold text-gray-800 text-center line-clamp-2`
  - Estoque: badge `text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-md mt-2` — como a tabela `epis` não tem campo de estoque, mostrar o número do CA como subtítulo (`CA 12345`) no mesmo estilo de badge cinza, e omitir "em estoque" para não inventar dado. (Se quiser estoque real, posso adicionar coluna `quantidade_estoque` em `epis` numa próxima iteração.)
- Estado vazio (sem EPIs cadastrados): usar `EmptyState` existente com ícone `HardHat` e ação "+ Cadastrar EPI" → `/app/epis`

**Seção 3 — Rodapé:**
- Separador: `<div className="h-px w-full bg-gray-100 my-8" />`
- Linha flex com:
  - Esquerda: contador "X EPI(s) selecionado(s)" em `text-sm font-semibold text-gray-700` + sub-linha "Funcionário: Nome • Obra: Nome" em `text-xs text-gray-500`
  - Direita: botão "Gerar Entrega" — `bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-indigo-200/50 transition-all flex items-center gap-2` com ícone `Send` e contagem. Disabled quando sem funcionário/obra/EPIs ou enquanto `loading`.

**Estado de sucesso (após gerar):**
- Substituir o grid por um painel verde claro com `CheckCircle2` grande, título "Entregas geradas!" e lista das entregas (nome do EPI + link copiável). Botão "Registrar nova entrega" reseta o estado.

### Lógica (sem mudar contratos)

- State: `funcId`, `obra`, `selectedEpiIds: Set<string>`, `loading`, `geradas: { epiNome: string; link: string }[]`
- Submit faz `Promise.all` de inserts em `entregas` (loop por EPI selecionado), calcula `data_vencimento` por EPI, dispara `triggerWebhook` para cada, popula `geradas`
- Mantém `useAuth`/`empresa_id` igual ao atual

### Arquivos

- `src/pages/NovaEntrega.tsx` — reescrita completa
- (Opcional) extrair `EpiCard` inline no mesmo arquivo para não criar componente avulso — manter o arquivo único

Sem mudanças de banco, RLS, edge functions ou rotas.
