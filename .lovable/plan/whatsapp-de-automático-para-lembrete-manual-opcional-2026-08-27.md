# WhatsApp: de automático para lembrete manual opcional

## Auditoria (o que existe hoje)

Confirmado por leitura do código:

- `src/pages/NovaEntrega.tsx` (linha 112) chama `triggerWebhook(...)` para cada EPI logo após inserir a entrega — este é o disparo automático de WhatsApp a ser removido.
- `src/lib/webhook.ts` expõe `triggerWebhook` (invoca a edge function `webhook-epi-delivery`), além de `triggerSignatureWebhook` e `triggerInviteWebhook`.
- `src/pages/Integracoes.tsx` + rota `/app/integracoes` (`src/App.tsx` linha 88) + item "WhatsApp" na sidebar (`src/components/AppSidebar.tsx`, `integrationItems`) + `/app/integracoes` em `admin` dentro de `src/lib/role-access.ts`.
- `src/hooks/useIntegracoes.ts` e `src/components/QRCodeModal.tsx` só são usados por essa página.
- `src/components/EntregaDetailModal.tsx` já carrega funcionário (com telefone), EPI e `status_assinatura` — é o lugar natural para a ação manual.
- Outros webhooks (`triggerInviteWebhook` em GestaoEquipe, notify-holerite, notify-ponto, onboarding) permanecem intactos.

## O que muda

### 1. Nova Entrega sem WhatsApp
- Remover a chamada de `triggerWebhook` e o import correspondente. Todo o resto (insert em `entregas`, link `/assinar/:id`, portal, estoque) fica igual.
- Ajustar o texto de sucesso para: "Entrega registrada — O EPI foi disponibilizado no portal do funcionário e está aguardando assinatura."
- Manter/garantir a ação secundária "Copiar link de assinatura" por entrega gerada. Nenhum modal pedindo conexão de WhatsApp.

### 2. Lembrete manual (ação contextual)
Novo componente `src/components/EnviarLembreteButton.tsx`, usado dentro de `EntregaDetailModal`:
- Aparece só quando `status_assinatura !== "Assinado"` e o papel do usuário for `admin` ou `almoxarifado` (via `perfil.role` do `AuthContext`). Nunca no portal do funcionário.
- Clique abre um `AlertDialog` de confirmação mostrando nome do funcionário, telefone e prévia da mensagem:
  "Olá, [nome]. A entrega de [EPI] já está disponível no seu portal. Quando puder, acesse o link para revisar e assinar: [link]."
- Só após confirmar chama `triggerWebhook` com o **payload atual, sem alteração** (`entrega_id`, `nome_funcionario`, `telefone_whatsapp`, `nome_epi`, `link_assinatura` = link do portal) — n8n segue compatível.
- Estados: idle, confirmando, enviando (botão desabilitado + spinner), enviado (com cooldown de 60s bloqueando reenvio), erro com mensagem compreensível.
- Se o funcionário não tiver telefone válido: botão desabilitado com dica "Sem telefone cadastrado" e apenas "Copiar link" disponível.
- Falha no envio nunca altera o status da entrega nem invalida a entrega.
- Registro no histórico: insere em `notificacoes` (`tipo: "lembrete_whatsapp"`) com data/hora e nome do usuário que acionou.

### 3. Remoção da página de sincronização
- Deletar `src/pages/Integracoes.tsx`, `src/hooks/useIntegracoes.ts`, `src/components/QRCodeModal.tsx`.
- Remover a rota `/app/integracoes` e o import em `src/App.tsx`.
- Remover o grupo "Integrações"/item WhatsApp da sidebar e o ícone `MessageCircle` não usado.
- Remover `/app/integracoes` de `role-access.ts`.
- Revisar textos que apresentem o WhatsApp como conexão obrigatória.

Sem preferência nova de configuração: o recurso fica restrito por papel, evitando criar tela nova.

## Preservado sem alterações
Tabela `integracao_whatsapp` e a edge function `whatsapp-proxy` permanecem no banco/backend (sem uso no app, mas sem remoção destrutiva). Edge functions `webhook-epi-delivery`, `notify-ponto`, `notify-holerite`, `onboarding-public`, `signup-onboarding`, `update-signature` e todas as demais automações internas (ponto, geolocalização, admissões, holerites, treinamentos, estoque, auditoria, storage) ficam intactas.

## Verificação
Build + lint + testes existentes, e checagem visual do fluxo de Nova Entrega e do modal de detalhe da entrega no preview.
