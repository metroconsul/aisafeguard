# Landing page Ava Safeguard — nova direção clara e premium

Reescrever apenas a camada visual de `src/pages/LandingPage.tsx` (e, por consistência, `src/pages/SobrePortal.tsx` só no que compartilha tokens), migrando do tema navy escuro para painéis brancos sobre cinza muito claro, cantos amplos, sombras suaves, composição modular e animações no scroll. Nenhuma rota, query, edge function ou lógica de lead é alterada.

## Conteúdo real que será preservado

- Marca: **Ava Safeguard**, ícone `ShieldCheck`, azul institucional `#00378A` + acento ciano `#4dd8ff`.
- Proposta de valor e headline atuais (SST e RH sem papel para construção civil e indústria).
- CTA principal: **Começar Agora** / **Agendar Demo** → abre o `LeadModal` que envia para a edge function `send-lead-email` (mantido intacto).
- Navegação: Funcionalidades, Automações, Preços + link "Portal do Colaborador" (`/sobre-o-portal`).
- Personas RBAC (Administrador, Técnico SST, RH, Almoxarifado), automações (EPI, holerite, admissão, auditoria), admissão em 3 passos, 3 planos de preço, 3 FAQs, footer com colunas e legais.

## Estrutura nova da página

1. **Navbar** — painel branco flutuante `rounded-full`/`rounded-[28px]` sobre fundo cinza, marca à esquerda, links ao centro, "Portal do Colaborador" como link secundário e CTA pill primário. Mobile: menu acessível com CTA sempre visível.
2. **Hero central** — headline com `clamp()` e tracking negativo, subtítulo cinza, CTA duplo. No centro, o mockup do dashboard já existente (KPIs, barras, anel de conformidade) redesenhado em card branco elevado. Ao redor, 5 elementos orbitais reais do produto: chip de assinatura de EPI, cartão de ponto, bolha de WhatsApp, badge LGPD/auditoria e mini card de admissão. Entrada em camadas (centro → orbitais → texto) e flutuação sutil.
3. **Fluxo principal (Automações)** — bloco de texto central + composição orgânica com o mockup de mensagens e chips de status, com stagger e parallax de 12–24px.
4. **Bento grid de capacidades** — título central e grid assimétrica: 3 cards menores (personas RBAC) na primeira linha, 2 cards maiores abaixo (Cofre digital com assinatura auditável; Admissão digital em 3 passos, reaproveitando os passos atuais). Miniaturas coerentes com o app (listas de documentos, chips de status, barras — só o que o produto realmente mostra). Cada card sobe ~24px ao entrar, delay 60–100ms.
5. **Compatibilidade & automações** (substitui "Integrações") — como o projeto não tem catálogo de integrações com ativos próprios, esta seção mostra os canais e conexões que realmente existem: WhatsApp via automação n8n, e-mail transacional, portal do colaborador (CPF+PIN), assinatura digital auditável e exportação/cofre de documentos. Carrossel acessível: autoplay suave, pausa no hover e no foco, setas com label, swipe, indicador de item ativo, item ativo com escala/contraste maiores e descrição abaixo.
6. **Depoimentos** — não existem depoimentos reais no projeto. Em vez de inventar, esta seção fica como um slider preparado, alimentado por um array vazio no topo do arquivo (`const depoimentos: Depoimento[] = []`), com comentário `TODO: substituir por depoimentos reais`. Enquanto vazio, a seção não é renderizada; assim que você fornecer nome, cargo, empresa, nota e texto (e avatar autorizado), o slider aparece com setas, teclado, swipe e indicador. Em seu lugar hoje entra o bloco de FAQ atual, já reestilizado.
7. **Footer expressivo** — painel claro com frase institucional, colunas de navegação, legais, redes sociais e wordmark gigante "Ava Safeguard" em ciano de baixo contraste, cortado pelas bordas do painel, entrando com escala e blur suaves.

Preços e FAQ permanecem, reestilizados no novo padrão (card destacado do plano Pro passa a usar azul institucional sólido em vez do gradiente navy).

## Tokens e motion

- Tokens centralizados no topo do arquivo: `bg #F4F6FA`, superfície `#FFFFFF`, tinta `#101114`, cinza `#6F8CAA`, primária `#00378A`, acento `#4dd8ff`, semânticas de estado; radius 20px (cards) / 28px (painéis); sombras `soft` e `float`; container 1180px; gap de seção `clamp(96px, 13vw, 160px)`.
- Tipografia: Plus Jakarta Sans (já carregada), headline 700/800, body 400, CTA 600.
- Motion com Framer Motion (já no projeto): `whileInView` com `once: true`, translateY 24px, stagger 60–100ms, flutuação 3–6s, hover elevando 4–8px, parallax leve via `useScroll`. Tudo desligado sob `prefers-reduced-motion: reduce` (hook `useReducedMotion`).

## Acessibilidade e responsividade

Alvos de toque ≥44px, foco visível, `aria-label` nos controles do carrossel, `alt` em imagens, estados nunca só por cor. Desktop com orbitais; tablet com dispersão reduzida; mobile empilhado, bento em coluna, headline menor e orbitais não essenciais ocultos.

## O que ainda depende de você

- Depoimentos reais (nome, cargo, empresa, nota, texto, avatar autorizado).
- Screenshots reais do produto, caso queira substituir os mockups desenhados em código.
- Logos/ativos de integrações, se quiser transformar a seção 5 em vitrine de parceiros.
