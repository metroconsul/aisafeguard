// Configure sua URL do n8n webhook aqui
export const WEBHOOK_URL = "https://n8n.your-domain.com/webhook/epi-delivery";

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
