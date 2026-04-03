import { supabase } from "@/integrations/supabase/client";

// Webhook de entrega de EPI — via Edge Function proxy (evita CORS)
interface WebhookPayload {
  nome_funcionario: string;
  telefone_whatsapp: string;
  nome_epi: string;
  link_assinatura: string;
}

export async function triggerWebhook(payload: WebhookPayload) {
  try {
    const { data, error } = await supabase.functions.invoke("webhook-epi-delivery", {
      body: payload,
    });
    if (error) {
      console.error("Webhook EPI error:", error);
      return false;
    }
    console.log("Webhook EPI triggered:", data);
    return true;
  } catch (error) {
    console.error("Webhook EPI error:", error);
    return false;
  }
}

// Webhook de confirmação de assinatura — via Edge Function proxy
export const SIGNATURE_WEBHOOK_URL = "https://n8n-n8n.nd25qi.easypanel.host/webhook/Pdf-Confirmação";

interface SignatureWebhookPayload {
  id_entrega: string;
  nome_funcionario: string;
  telefone_whatsapp: string;
  nome_epi: string;
  data_assinatura: string;
  imagem_assinatura: string;
}

export async function triggerSignatureWebhook(payload: SignatureWebhookPayload) {
  try {
    const response = await fetch(SIGNATURE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: "assinatura_confirmada", ...payload }),
    });
    console.log("Signature webhook triggered:", response.status);
    return response.ok;
  } catch (error) {
    console.error("Signature webhook error:", error);
    return false;
  }
}

// Webhook de convite de usuário (n8n)
export const INVITE_WEBHOOK_URL = "https://n8n-n8n.nd25qi.easypanel.host/webhook/team-invite";

interface InviteWebhookPayload {
  nome: string;
  email: string;
  empresa_nome: string;
  senha: string;
  cargo?: string;
}

export async function triggerInviteWebhook(payload: InviteWebhookPayload) {
  try {
    const response = await fetch(INVITE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: "convite_usuario", ...payload }),
    });
    console.log("Invite webhook triggered:", response.status);
    return response.ok;
  } catch (error) {
    console.error("Invite webhook error:", error);
    return false;
  }
}
