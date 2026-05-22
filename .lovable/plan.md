## Redesign do Dashboard SafeGuard — Nível UX/UI Sênior

Aplicar uma camada de polimento profissional sobre o dashboard atual: novo design system, KPIs com personalidade, gráfico moderno, empty states elegantes e sidebar refinada. Mudanças focadas em apresentação — sem alterar lógica de dados nem queries Supabase.

### 1. Design tokens globais (`src/index.css` + `tailwind.config.ts`)

Atualizar as variáveis HSL no `:root`:

- `--background`: cinza frio sutil (`220 14% 96%` ≈ #F3F4F6) — fim do branco puro de fundo
- `--card`: branco puro (`0 0% 100%`)
- `--foreground`: cinza muito escuro (`222 47% 11%` ≈ #111827)
- `--muted-foreground`: cinza médio (`220 9% 46%` ≈ #6B7280)
- `--primary`: Indigo-500 (`239 84% 67%` — já está, manter)
- `--border`: cinza muito sutil, usado apenas como fallback
- Nova sombra elevada: `--shadow-elevated: 0 4px 6px -1px rgba(0,0,0,.05), 0 2px 4px -1px rgba(0,0,0,.03)`
- Nova sombra para alerta: `--shadow-alert: 0 0 0 1px hsl(var(--destructive)/.15), 0 8px 24px -6px hsl(var(--destructive)/.25)`

Tailwind: registrar `shadow-elevated` e `shadow-alert` em `boxShadow`. Manter Inter (já carregada) com `font-feature-settings` mais limpos.

### 2. KpiCard (`src/components/KpiCard.tsx`)

Refazer:
- Remover `border border-border`. Usar somente `bg-card shadow-elevated rounded-2xl p-6`.
- Ícone: dentro de um círculo `h-10 w-10 rounded-full bg-primary/10`, ícone em `text-primary` sólido (h-5 w-5). Posicionado à esquerda ou topo direito conforme grid.
- Título em `text-sm text-muted-foreground font-medium`.
- Número grande: `text-3xl md:text-4xl font-bold tabular-nums text-foreground`.
- Badge de tendência (já existe a prop `trend`) refinado: pill `rounded-full bg-success/10 text-success px-2 py-1 text-xs`, com `TrendingUp/Down` em 12px.
- Estado de alerta (`alert` true): trocar `shadow-elevated` por `shadow-alert` + fina linha superior `border-t-2 border-destructive` (radius mantido via `before` ou wrapper) e número em `text-destructive`.

### 3. Card de gráfico — Entregas na Semana (`src/components/charts/EntregasSemanaChart.tsx`)

Substituir `BarChart` por `AreaChart` spline:
- `<defs>` com `linearGradient` id="entregasGradient" — stop topo `hsl(239 84% 67%)` opacity 0.35, stop base opacity 0.
- `<Area type="monotone" dataKey="entregas" stroke="hsl(239 84% 67%)" strokeWidth={2.5} fill="url(#entregasGradient)" />`
- Remover `CartesianGrid`. Eixos com `axisLine={false}`, `tickLine={false}`, ticks em `text-muted-foreground` 11px.
- Tooltip com `rounded-lg`, sem borda, `shadow-elevated`, fundo branco.
- Container: `bg-card shadow-elevated rounded-2xl p-6` (sem border). Header com título em `text-base font-semibold` e número total em `text-3xl font-bold`.

Aplicar a mesma estética nos outros charts já existentes (`CustoEpiObraChart`, `DistribuicaoEpiChart`, `EntregasSetorChart`) só onde houver borda/grid pesado — manter os tipos de gráfico originais para não mexer em semântica de dados, apenas refinar wrappers e cores.

### 4. Empty States

Criar componente novo `src/components/EmptyState.tsx`:
- Props: `icon: LucideIcon`, `title: string`, `description?: string`, `actionLabel?: string`, `onAction?: () => void`.
- Layout vertical centralizado, padding `py-12`. Ícone em círculo `h-14 w-14 rounded-full bg-muted` com ícone `text-muted-foreground/60`. Título `text-sm font-medium`. Descrição `text-xs text-muted-foreground`. Botão `variant="outline"` discreto.

Aplicar em:
- `UltimasEntregasTable.tsx` quando `entregas.length === 0` (ícone `ClipboardList`, ação "+ Registrar Entrega" → navega para `/app/nova-entrega`)
- `EntregasSemanaChart.tsx` quando `total === 0` (ícone `BarChart3`, sem ação)
- `CustoEpiObraChart.tsx` em estado vazio análogo

### 5. UltimasEntregasTable

- Remover bordas externas; usar `shadow-elevated rounded-2xl p-6`.
- Trocar `divide-border` por linhas mais sutis (`divide-muted`), cabeçalho com `text-xs uppercase tracking-wide text-muted-foreground`.
- Aumentar padding vertical das linhas (`py-4`).
- Botão "Ver Todas" como link em primary, mantendo função.

### 6. AppSidebar (`src/components/AppSidebar.tsx`)

- Remover `border-r border-sidebar-border` do `<Sidebar>` e `border-t` do footer. Usar separação por whitespace.
- `SidebarGroupLabel`: já está sutil, ok.
- Itens inativos: `text-muted-foreground hover:text-foreground hover:bg-muted/60`.
- Item ativo: `bg-primary/10 text-primary font-medium` (já existe) + ícone em `text-primary`. Adicionar `rounded-lg` mais arredondado.
- Bloco do rodapé (empresa): trocar `bg-accent` por `bg-muted/50` sem borda.

### 7. AppLayout / página Dashboard

- `AppLayout.tsx`: aumentar padding do `<main>` para `p-4 sm:p-6 md:p-8` para dar mais respiro.
- `AdminDashboard.tsx`: aumentar gaps do grid (`gap-4 sm:gap-6`) e título da página para `text-2xl md:text-3xl font-bold tracking-tight`. Subtítulo em `text-sm text-muted-foreground mt-1`.

### Escopo e não-escopo

- **Em escopo**: tokens, KpiCard, EntregasSemanaChart, UltimasEntregasTable, EmptyState novo, AppSidebar, AppLayout, AdminDashboard.
- **Não em escopo**: dashboards de outros papéis (RH/Técnico/Almoxarifado) e demais páginas — o usuário pediu o "Dashboard principal". Posso estender depois se quiser.
- **Sem mudanças** em queries Supabase, RLS, edge functions, rotas ou contratos de dados.

### Resultado esperado

Dashboard com fundo cinza frio, cards brancos flutuantes (sem bordas), KPIs com ícones em badge roxo, gráfico de área com gradiente, empty states amigáveis e sidebar mais limpa — transmitindo a sensação de produto sênior B2B.
