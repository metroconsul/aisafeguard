import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Aceita entrega_id via query string (GET) ou JSON body (POST)
    let entregaId: string | null = null;
    const url = new URL(req.url);
    entregaId = url.searchParams.get("entrega_id") || url.searchParams.get("id");

    if (!entregaId && (req.method === "POST" || req.method === "PUT")) {
      try {
        const body = await req.json();
        entregaId = body.entrega_id || body.id || null;
      } catch {
        // sem body — segue
      }
    }

    if (!entregaId) {
      return new Response(
        JSON.stringify({ error: "entrega_id é obrigatório (query ?entrega_id=... ou body { entrega_id })" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase
      .from("entregas")
      .select("id, status_assinatura, data_entrega, funcionarios(nome, telefone_whatsapp), epis(nome_equipamento, numero_ca)")
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
        JSON.stringify({ error: "Entrega não encontrada", entrega_id: entregaId }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const status = data.status_assinatura ?? "Pendente";
    const assinado = status === "Assinado";

    return new Response(
      JSON.stringify({
        entrega_id: data.id,
        status_assinatura: status,
        assinado,
        data_entrega: data.data_entrega,
        data_assinatura: null,
        funcionario: data.funcionarios,
        epi: data.epis,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});