import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

/**
 * Retorna dados públicos de uma entrega para a tela de assinatura.
 * NÃO retorna CPF nem dados sensíveis — apenas o necessário para exibir e assinar.
 * A validação de CPF é feita server-side em `update-signature`.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let entregaId = url.searchParams.get("id") || url.searchParams.get("entrega_id");
    if (!entregaId && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      entregaId = body.entrega_id || body.id;
    }

    if (!entregaId || !/^[0-9a-fA-F-]{36}$/.test(entregaId)) {
      return new Response(
        JSON.stringify({ error: "entrega_id inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase
      .from("entregas")
      .select("id, data_entrega, status_assinatura, funcionarios(nome, telefone_whatsapp), epis(nome_equipamento, numero_ca)")
      .eq("id", entregaId)
      .maybeSingle();

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: "Entrega não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const func = data.funcionarios as any;
    const epi = data.epis as any;

    return new Response(
      JSON.stringify({
        entrega: {
          id: data.id,
          data_entrega: data.data_entrega,
          status_assinatura: data.status_assinatura,
          funcionario: { nome: func?.nome ?? "", telefone_whatsapp: func?.telefone_whatsapp ?? null },
          epi: { nome_equipamento: epi?.nome_equipamento ?? "", numero_ca: epi?.numero_ca ?? "" },
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});