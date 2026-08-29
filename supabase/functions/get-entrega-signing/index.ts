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
      .select("id, data_entrega, status_assinatura, funcionario_id, kit_id, quantidade, origem, funcionarios(nome, telefone_whatsapp), epis(nome_equipamento, numero_ca), epi_kits(nome)")
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

    // Quando a entrega faz parte de um kit, devolve os demais itens pendentes
    // do mesmo kit para que o colaborador possa assinar item a item ou o kit completo.
    let itens: Array<Record<string, unknown>> = [
      {
        id: data.id,
        nome_equipamento: epi?.nome_equipamento ?? "",
        numero_ca: epi?.numero_ca ?? "",
        quantidade: (data as any).quantidade ?? 1,
        status_assinatura: data.status_assinatura,
      },
    ];

    if ((data as any).kit_id) {
      const { data: siblings } = await supabase
        .from("entregas")
        .select("id, quantidade, status_assinatura, data_entrega, epis(nome_equipamento, numero_ca)")
        .eq("kit_id", (data as any).kit_id)
        .eq("funcionario_id", (data as any).funcionario_id)
        .is("cancelado_em", null)
        .order("data_entrega", { ascending: true });

      const pendentes = (siblings ?? []).filter(
        (s: any) => s.status_assinatura !== "Assinado" || s.id === data.id
      );
      if (pendentes.length > 0) {
        itens = pendentes.map((s: any) => ({
          id: s.id,
          nome_equipamento: s.epis?.nome_equipamento ?? "",
          numero_ca: s.epis?.numero_ca ?? "",
          quantidade: s.quantidade ?? 1,
          status_assinatura: s.status_assinatura,
        }));
      }
    }

    return new Response(
      JSON.stringify({
        entrega: {
          id: data.id,
          data_entrega: data.data_entrega,
          status_assinatura: data.status_assinatura,
          origem: (data as any).origem ?? "avulsa",
          kit_id: (data as any).kit_id ?? null,
          kit_nome: ((data as any).epi_kits as any)?.nome ?? null,
          funcionario: { nome: func?.nome ?? "", telefone_whatsapp: func?.telefone_whatsapp ?? null },
          epi: { nome_equipamento: epi?.nome_equipamento ?? "", numero_ca: epi?.numero_ca ?? "" },
          itens,
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