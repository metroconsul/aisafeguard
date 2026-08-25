# Ava Safeguard — Refatoração visual completa

Aplicar a nova identidade (azul institucional Ava, fonte Inter, cantos arredondados, micro-animações) em todo o produto: app interno, portal do colaborador, landing, login e pitch. Nenhuma lógica de negócio, rota, query ou tipo de dado é alterada — exceto os novos blocos do Dashboard que o usuário pediu com dados reais.

## 1. Fundação de design

- `tailwind.config.ts`: substituir a paleta atual (indigo/roxo) pelos tokens exatos da Ava — escalas `primary` 50→900 (#00378A), `secondary` (#0082B8), `accent`, `background #F7FBFF`, `foreground #221E1E`, `muted`, `border`, `destructive/success/warning/info`, `sidebar` (azul sólido) e `chart 1-5`. Adicionar `borderRadius` (sm 6 / md 8 / lg 12 / xl 16), `boxShadow` (card, card-hover, elevated, inner-glow), keyframes e animações (`fade-in-up`, `scale-in`, `slide-in-right`, `counter`, `shimmer`), `fontFamily` Inter.
- `src/index.css`: alinhar as variáveis HSL das mesmas cores (usadas pelos componentes shadcn), remover os tokens indigo antigos e sombras roxas.
- `index.html`: garantir Inter (400–800) e ajustar título/descrição para "Ava Safeguard".

Como os componentes shadcn leem tokens semânticos, boa parte das telas herda o novo tema automaticamente; as classes cruas de indigo/roxo encontradas em `KpiCard`, `AppSidebar`, `Funcionarios`, `FuncionarioKanbanCard`, `NovaEntrega`, `GestaoEquipe` e `Admissoes` serão trocadas manualmente.

## 2. Sidebar premium industrial

`AppSidebar` / `AppLayout` / `AppHeader`: fundo azul sólido `primary-500`, borda direita translúcida, logo "Ava Safeguard" com subtítulo "GESTÃO INDUSTRIAL", labels de seção em maiúsculas 10px, item ativo com `bg-white/12`, borda esquerda ciano de 3px e `shadow-inner-glow`, itens inativos `text-white/60` com hover; rodapé com avatar da empresa em borda ciano. Header com busca em card branco arredondado 320px e badge de data.

## 3. Dashboard

- Cabeçalho: H1 + subtítulo + badge de data ("Terça-feira, 3 de Junho • Tempo real") + busca.
- 4 KPI cards no novo padrão (ícone em quadrado colorido, número `text-3xl font-extrabold`, entrada escalonada `fade-in-up`).
- **Trend real**: cada KPI ganha comparação com o mês anterior via consultas equivalentes às atuais, mas filtradas pelo mês passado (funcionários criados, entregas, taxa de assinatura, alertas). Sem base de comparação → exibe "—".
- **Card "Insights" (novo, dados reais)**: consultas agregadas ao banco (ASOs/NRs vencendo em 30 dias, entregas pendentes de assinatura, holerites não assinados, EPIs com estoque baixo) transformadas em 3–4 insights com link para a página correspondente.
- **Feed "Atividade Recente" (novo, dados reais)**: últimos eventos combinando entregas, registros de ponto, documentos assinados e notificações, ordenados por data com tempo relativo ("há 2 min").
- Gráficos: containers brancos com pills de filtro, grid suave, paleta `chart-1..5`, área com gradiente de opacidade.
- `UltimasEntregasTable`: header com "Ver todas", cabeçalho `bg-muted/50`, zebra, hover azul suave, avatar com iniciais e badges de status padronizados.

## 4. Páginas do app

- **Holerites / Cartão de Ponto**: trio de cards de status (Assinados com gradiente sutil de success), botão primário de disparo, tabs em pílula sobre `bg-muted`.
- **Nova Entrega**: labels em caixa alta, inputs `rounded-xl` com ring ciano, cards de equipamento com estado selecionado em `secondary`, botão "Gerar Entrega" grande.
- **Admissões e Funcionários (Kanban)**: colunas `min-w-[280px]` sobre `bg-muted/30` com borda superior colorida por estágio, badge de contagem, cards com hover/drag states e badge de setor azul.
- **Perfil do Funcionário**: header card com avatar `rounded-2xl`, nome/cargo/email, botão outline "Editar Perfil", grid de dados 2 colunas com labels e separadores suaves.
- **Setores, EPIs, Treinamentos, Cofre, Equipe, Segurança, Configurações, Integrações**: aplicar o mesmo sistema (cards, tabelas, badges, botões, empty states, modais).

## 5. Componentes globais

`button`, `input`, `dialog`, `badge`, `card`, `table`, `tabs`, `toast`/`sonner` e `EmptyState` recebem as variantes descritas: raio `xl`, sombras novas, overlay `bg-foreground/40 backdrop-blur-sm`, toasts com ícone colorido e `slide-in-right`, skeletons com `shimmer`.

## 6. Portal, landing, login e pitch

- Portal do colaborador (login, home, EPIs, holerites, pontos, documentos, bottom tab bar): azul institucional, cards brancos, badges de status no novo padrão, mantendo a autenticação CPF+PIN intacta.
- Login/Cadastro, Assinar, Onboarding público, SobrePortal, Unsubscribe: mesma paleta e tipografia.
- Landing page: manter a estrutura, migrar do neon/dark atual para o azul Ava (sem gradientes coloridos), texto "Ava Safeguard".
- `/pitch`: manter os slides, ajustar cores para os azuis institucionais e o novo nome.

## 7. Renomeação

Trocar "SafeGuard" por "Ava Safeguard" nos textos visíveis (sidebar, landing, login, portal, pitch, SobrePortal, Unsubscribe, index.html). Nomes de arquivos, variáveis, buckets e chaves permanecem intactos.

## Notas técnicas

- Nenhuma alteração em `src/integrations/supabase/*`, edge functions, migrações ou webhooks.
- Os novos blocos do Dashboard usam apenas `select` de leitura nas tabelas já existentes (`entregas`, `documents`, `time_entries`, `notificacoes`, `funcionarios`, `epis`), respeitando `empresa_id` e RLS.
- Verificação final: build/typecheck e QA visual das telas principais (dashboard, sidebar, kanban, holerites, portal) via preview.
