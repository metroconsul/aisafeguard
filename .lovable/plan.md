# Pitch SafeGuard — Deck de Sociedade

Objetivo: material completo para você apresentar a plataforma a um sócio potencial que entraria bancando a VPS das automações (n8n + WhatsApp).

Entrega em duas frentes: uma rota `/pitch` navegável dentro do app (para apresentar ao vivo, em tela cheia) e um arquivo `.pptx` editável em Documentos (para enviar por WhatsApp/e-mail).

## Estrutura do deck (16 slides)

1. Capa — SafeGuard: gestão de EPI, RH e ponto para construtoras
2. O problema — multas de NR-6, fichas de EPI em papel, ponto manual, ASO/NR vencidos sem aviso
3. A solução — plataforma web + Portal do Colaborador no celular + automações WhatsApp
4. Como funciona — fluxo em 3 camadas (App → Backend → n8n/WhatsApp)
5. Módulo EPI — cadastro, entrega multi-seleção, assinatura digital, alerta de vencimento
6. Módulo Ponto — registro pelo celular com geolocalização, cartão mensal automático, assinatura, alerta de anomalia
7. Módulo RH — holerites com confirmação de recebimento, cofre de documentos da empresa e do colaborador
8. Módulo Admissão — onboarding digital do candidato por link público, upload de documentos, kanban de aprovação
9. Portal do Colaborador — login por CPF + PIN, pendências, EPIs, holerites, pontos, documentos
10. Automações (o que a VPS destrava) — os 7 fluxos n8n já construídos e testados
11. Compliance e prova jurídica — trilha de assinatura com IP, data/hora e imagem da assinatura
12. Arquitetura e segurança — multi-tenant, RBAC de 4 papéis, isolamento por empresa, storage privado com URL assinada
13. O que já está pronto — inventário do que foi construído (páginas, funções de backend, fluxos)
14. Mercado e modelo de receita — SaaS por colaborador/mês, ticket e cenários (números estimados, marcados para você ajustar)
15. Custos e o papel do sócio — custo de VPS/infra, o que a entrada dele resolve, break-even estimado
16. Proposta e próximos passos — divisão de responsabilidades, roadmap de 90 dias, pedido claro

## Conteúdo real, sem invenção

Todo o inventário de features e automações sai do próprio código (páginas, edge functions, webhooks n8n, tabelas). Nos slides 14 e 15 os valores de preço, custo de VPS e break-even entram como **estimativas marcadas visualmente** (ex.: `[ESTIMADO — ajustar]`), para você trocar pelos seus números antes de apresentar.

## Detalhes técnicos

- Rota `/pitch` pública (fora do `/app`), estilo Dark Premium da landing (#000c24 + verde neon, Plus Jakarta Sans), slides em 1920x1080 com scale-to-fit, navegação por setas/clique, contador de slides e modo tela cheia.
- Componentes novos em `src/components/pitch/` + `src/pages/Pitch.tsx`; rota registrada em `src/App.tsx`. Nenhuma alteração em lógica de negócio, banco ou edge functions.
- Deck `.pptx` gerado com pptxgenjs, paleta escura alinhada à marca, salvo em Documentos como `SafeGuard-Pitch-Socio.pptx`, com validação e revisão visual slide a slide.
