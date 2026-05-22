## Redesign agressivo do Dashboard — Glassmorphism sutil + tipografia pesada

Aplicar as regras de Tailwind especificadas em todos os componentes do Dashboard principal. Sem mudar dados nem queries.

### 1. Fundo da página
`src/index.css` → atualizar `--background` para `bg-slate-50` (`210 40% 98%`) para dar contraste real com os cards brancos.

### 2. KpiCard (`src/components/KpiCard.tsx`)
Reescrever o wrapper e tipografia:
- Container: `bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100/50 p-6`
- Estado `alert`: trocar shadow por `shadow-xl shadow-red-200/60 border-red-200/60` e manter linha vermelha superior
- Título: `text-sm font-semibold text-gray-500 uppercase tracking-wider`
- Número: `text-5xl font-extrabold text-gray-900 tracking-tight mt-4 tabular-nums` (vermelho quando alert)
- Ícone: bolinha `w-14 h-14 rounded-full flex items-center justify-center bg-indigo-50`, ícone `w-7 h-7 text-indigo-600` (vermelho 50/600 quando alert)
- Badge de trend reposicionado abaixo do número para não competir

### 3. EmptyState (`src/components/EmptyState.tsx`)
Envolver conteúdo numa caixa pontilhada:
- Wrapper interno: `border-2 border-dashed border-gray-200 rounded-xl bg-slate-50/50 p-12 flex flex-col items-center justify-center m-4`
- Título: `text-lg font-bold text-gray-700`
- Descrição: `text-sm text-gray-500 mt-1`
- Ícone em círculo `w-14 h-14 rounded-full bg-white` com ícone `text-gray-400`

### 4. Cards dos gráficos e tabela
Aplicar o mesmo padrão de card em:
- `EntregasSemanaChart.tsx`
- `CustoEpiObraChart.tsx`
- `UltimasEntregasTable.tsx`

Substituir `rounded-2xl bg-card p-6 shadow-elevated` por `bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100/50 p-6`. Títulos dos cards passam a `text-base font-bold text-gray-900`.

### 5. AppSidebar (`src/components/AppSidebar.tsx`)
- Garantir `border-r-0` (já está) e fundo branco puro: `bg-white` no `<Sidebar>` para a separação ficar só pela diferença com o `bg-slate-50` do main
- Item ativo: `rounded-xl bg-indigo-50 text-indigo-700 font-bold` com ícone `text-indigo-700`
- Item inativo: `rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900`

Também atualizar `--sidebar-border` para transparente/igual ao fundo para zerar qualquer divisor remanescente.

### 6. AdminDashboard (`src/components/dashboards/AdminDashboard.tsx`)
- Título da página: `text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900`
- Subtítulo: `text-base text-gray-500 mt-1`
- Aumentar gap para `gap-6`

### Não em escopo
- Outras páginas (Funcionários, Holerites, etc.) — só o Dashboard principal e seus componentes compartilhados
- Lógica de dados, queries Supabase, edge functions, rotas

### Observação
Como o usuário pediu cores Tailwind hardcoded (`bg-indigo-50`, `text-gray-900`, etc.), vou usá-las diretamente nestes componentes específicos, abrindo exceção à regra de tokens semânticos só para este redesign agressivo do dashboard.
