import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const N8N_WEBHOOK =
  "https://nextage-n8n.brbss6.easypanel.host/webhook/notify-ponto-anomalia";

const TIPO_LABEL: Record<string, string> = {
  entrada: "Entrada",
  saida_almoco: "Saída p/ Almoço",
  volta_almoco: "Retorno do Almoço",
  saida: "Saída",
};

interface Payload {
  funcionario_id: string;
  tipo: string;
  recorded_at: string;
  motivo: string;
  latitude?: number | null;
  longitude?: number | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as Payload;
    if (!body.funcionario_id || !body.tipo || !body.motivo) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios ausentes" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Funcionário + Empresa
    const { data: func } = await supabase
      .from("funcionarios")
      .select("id, nome, setor, empresa_id, empresas(nome_fantasia)")
      .eq("id", body.funcionario_id)
      .maybeSingle();

    if (!func) {
      return new Response(JSON.stringify({ error: "Funcionário não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // RH WhatsApp
    const { data: rhContacts } = await supabase
      .from("integracao_whatsapp")
      .select("nome, numero")
      .eq("empresa_id", func.empresa_id)
      .eq("status", "vinculado");

    const hora = new Date(body.recorded_at).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
    const empresaNome =
      (func.empresas as any)?.nome_fantasia || "Empresa";

    const mapsUrl =
      body.latitude && body.longitude
        ? `https://www.google.com/maps?q=${body.latitude},${body.longitude}`
        : null;

    const mensagem =
      `⚠️ *Alerta de Ponto* — ${empresaNome}\n\n` +
      `👷 *${func.nome}* (${func.setor})\n` +
      `🕒 ${TIPO_LABEL[body.tipo] || body.tipo} às *${hora}*\n` +
      `📋 Motivo: *${body.motivo}*` +
      (mapsUrl ? `\n📍 Localização: ${mapsUrl}` : "");

    // Notificação no sino
    await supabase.from("notificacoes").insert({
      empresa_id: func.empresa_id,
      tipo: "alerta",
      titulo: `Ponto fora do padrão — ${func.nome}`,
      mensagem,
    });

    // Webhook n8n (fire and forget, mas aguarda resposta para log)
    let webhookOk = false;
    let webhookErr: string | null = null;
    try {
      const r = await fetch(N8N_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresa_id: func.empresa_id,
          empresa_nome: empresaNome,
          funcionario_id: func.id,
          funcionario_nome: func.nome,
          setor: func.setor,
          tipo: body.tipo,
          tipo_label: TIPO_LABEL[body.tipo] || body.tipo,
          recorded_at: body.recorded_at,
          hora,
          motivo: body.motivo,
          latitude: body.latitude,
          longitude: body.longitude,
          maps_url: mapsUrl,
          mensagem,
          contatos_rh: rhContacts || [],
        }),
      });
      webhookOk = r.ok;
      if (!r.ok) webhookErr = `Webhook ${r.status}: ${await r.text()}`;
    } catch (e: any) {
      webhookErr = e.message;
    }

    return new Response(
      JSON.stringify({
        success: true,
        webhook_ok: webhookOk,
        webhook_error: webhookErr,
        contatos_rh: (rhContacts || []).length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
