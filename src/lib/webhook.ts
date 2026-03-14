// Configure sua URL do n8n webhook aqui
export const WEBHOOK_URL = "https://n8n-n8n.is8ujj.easypanel.host/webhook/Epis";
export const SIGNATURE_WEBHOOK_URL = "https://n8n-n8n.is8ujj.easypanel.host/webhook/Pdf-Confirmação";

interface WebhookPayload {
  nome_funcionario: string;
  telefone_whatsapp: string;
  nome_epi: string;
  link_assinatura: string;
}

export async function triggerWebhook(payload: WebhookPayload) {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log("Webhook triggered:", response.status);
    return response.ok;
  } catch (error) {
    console.error("Webhook error:", error);
    return false;
  }
}

// Webhook de confirmação de assinatura
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
    const response = await fetch(WEBHOOK_URL, {
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
