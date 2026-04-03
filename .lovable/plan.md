

## Plano: Adicionar status de notificação WhatsApp aos Holerites

### Contexto
O n8n precisa fazer um callback para marcar o holerite como "enviado" após disparar o WhatsApp. Como você usa Lovable Cloud (sem acesso direto ao dashboard Supabase), faremos tudo por aqui.

### Etapas

**1. Migration — adicionar coluna `notification_status`**
- Usar a ferramenta de migration do Lovable Cloud para executar:
  ```sql
  ALTER TABLE documents ADD COLUMN IF NOT EXISTS notification_status TEXT DEFAULT 'pendente';
  ```

**2. Configurar o node do n8n**
- No último node "Callback Supabase — Marcar Enviado", configurar como HTTP Request:
  - **Method**: PATCH
  - **URL**: `https://ffndxwyviafznftdxnib.supabase.co/rest/v1/documents?id=eq.{{ $json.document_id }}`
  - **Headers**:
    - `apikey`: a chave `anon` do projeto (`eyJhbGci...Gh3ZA`)
    - `Authorization`: `Bearer <mesma chave anon>`
    - `Content-Type`: `application/json`
    - `Prefer`: `return=minimal`
  - **Body**: `{ "notification_status": "enviado" }`

> Como a tabela `documents` tem RLS, pode ser necessário usar a **service_role key** em vez da anon key. Vou verificar as políticas RLS existentes para confirmar.

**3. Atualizar a UI (Holerites.tsx)**
- Adicionar uma coluna "Notificação WhatsApp" na tabela de auditoria
- Exibir badge verde "Enviado" ou badge amarelo "Pendente" conforme o valor de `notification_status`

**4. (Opcional) Criar Edge Function de callback**
- Se preferir não expor chaves diretamente no n8n, podemos criar uma Edge Function `/callback-holerite` que recebe o `document_id` e faz o update internamente. O n8n chamaria essa função sem precisar de credenciais do banco.

### Recomendação
A opção 4 (Edge Function de callback) é mais segura — evita colocar chaves do banco no n8n. O n8n chamaria apenas a URL da Edge Function passando o `document_id`.

