# Redesign Funcionários — Kanban por Setor

Substituir a tabela atual em `src/pages/Funcionarios.tsx` por um Kanban Board sofisticado, agrupando funcionários pelo setor (`setor_id` → `setores.nome`, com fallback para o campo legado `setor`). Apenas UI/UX — sem mudanças de schema, RLS ou regras de negócio.

## Estrutura da página

```text
┌─────────────────────────────────────────────────────────────┐
│  Funcionários                                                │
│  N registros · X setores                                     │
│                                                              │
│  [🔍 Buscar funcionário...        ]      [+ Novo Funcionário]│
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  →    │
│  │LOGÍSTICA5│ │ OBRAS  12│ │ ADMIN   3│ │SEM SETOR2│        │
│  │          │ │          │ │          │ │          │        │
│  │ [card]   │ │ [card]   │ │ [card]   │ │ [card]   │        │
│  │ [card]   │ │ [card]   │ │ [card]   │ │          │        │
│  │ ...      │ │ ...      │ │          │ │          │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Header e ações globais

- Wrapper externo: `bg-slate-50 min-h-full -m-* p-6` (compatível com o padding existente do `AppLayout`).
- Título: `text-3xl font-extrabold text-gray-900 tracking-tight` + subtítulo `text-sm text-gray-500` com contagem total e nº de setores.
- Barra de ações `flex items-center justify-between gap-4 mt-6`:
  - Busca: `<Input>` customizado com ícone `Search` à esquerda; classes: `w-96 bg-white border-gray-200 rounded-xl px-4 py-3 shadow-sm focus-visible:ring-indigo-500`.
  - Botão "+ Novo Funcionário" (mantém o `Dialog` existente): `bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-200`.

## Container do Kanban

- `mt-6 flex gap-6 overflow-x-auto pb-8 pt-4 w-full` com scroll horizontal suave.
- Agrupamento client-side: gera uma coluna por setor existente em `setores` + coluna final "Sem setor" para funcionários sem `setor_id`. Filtro de busca aplicado por `nome`, `matricula`, `cargo` antes do agrupamento.

## Coluna (setor)

- Container: `min-w-[320px] max-w-[320px] bg-slate-100/70 border border-slate-200 rounded-2xl flex flex-col max-h-[calc(100vh-280px)]`.
- Header: `p-4 border-b border-slate-200 flex justify-between items-center`.
  - Título: `text-sm font-bold text-gray-700 uppercase tracking-wider`.
  - Badge de contagem: `bg-slate-200 text-gray-600 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center`.
- Área de cards: `p-4 flex flex-col gap-4 flex-1 overflow-y-auto`.
- Empty state da coluna: texto sutil "Nenhum funcionário" em `text-xs text-slate-400 text-center py-8`.

## Card do funcionário

Componente novo `src/components/funcionarios/FuncionarioKanbanCard.tsx`.

- Base: `bg-white rounded-xl p-5 shadow-sm border border-gray-100 cursor-grab hover:shadow-md hover:border-indigo-300 hover:-translate-y-0.5 transition-all duration-200 relative` — clique navega para `/app/funcionarios/:id`.
- Topo (`flex justify-between items-start`):
  - Matrícula: `text-xs font-semibold text-slate-400` (ex: `#1234`).
  - Status "Ativo": badge `bg-green-50 text-green-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase` com ponto verde (`w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse`).
- Corpo:
  - Nome: `text-base font-bold text-gray-900 mt-2`.
  - Cargo: `text-sm font-medium text-indigo-600 mt-0.5`.
- Rodapé: `mt-4 pt-3 border-t border-slate-50 flex justify-between items-center`.
  - Botão WhatsApp (ícone `MessageCircle` da lucide): `flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors`, abre `https://wa.me/<telefone>` quando disponível, senão desabilitado.
  - Botão de perfil: ícone `Eye` em `text-gray-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-slate-50` que navega para o detalhe.

## Detalhes técnicos

- Edita `src/pages/Funcionarios.tsx`: remove blocos mobile-table e desktop-table, mantém Dialog de cadastro e carregamento de dados (`load()`, `funcionarios`/`setores`).
- Adiciona estado `query` (busca) e memo `colunas` (`{ setor, funcionarios[] }[]`).
- Mobile (<640px): mesma estrutura Kanban com scroll horizontal — colunas continuam `min-w-[320px]`, garantindo UX consistente (sem reverter para tabela).
- Sem drag-and-drop por enquanto (o card já comunica "arrastável" via `cursor-grab` e hover; mover funcionário entre setores fica fora do escopo desta etapa visual).
- Tokens: usado Tailwind direto conforme especificado pelo usuário; sem alterações em `index.css`/`tailwind.config.ts`.

## Arquivos

- Editar: `src/pages/Funcionarios.tsx`
- Criar: `src/components/funcionarios/FuncionarioKanbanCard.tsx`
