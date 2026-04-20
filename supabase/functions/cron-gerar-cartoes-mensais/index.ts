// Cron entrypoint: dispara no dia 1 de cada mês e gera os cartões de ponto
// para o mês ANTERIOR, em todas as empresas que tiveram batidas no período.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Permite override via body { mes, ano } para reprocessar manualmente
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    let mes: number;
    let ano: number;
    if (body?.mes && body?.ano) {
      mes = Number(body.mes);
      ano = Number(body.ano);
    } else {
      // Mês anterior (no fuso de São Paulo aproximado via UTC-3)
      const now = new Date();
      const ref = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      ref.setUTCMonth(ref.getUTCMonth() - 1);
      mes = ref.getUTCMonth() + 1;
      ano = ref.getUTCFullYear();
    }

    const startDate = new Date(ano, mes - 1, 1).toISOString();
    const endDate = new Date(ano, mes, 0, 23, 59, 59).toISOString();

    // Descobre empresas com batidas no período
    const { data: entries, error: entriesErr } = await supabase
      .from("time_entries")
      .select("empresa_id")
      .gte("recorded_at", startDate)
      .lte("recorded_at", endDate);

    if (entriesErr) throw entriesErr;

    const empresaIds = Array.from(
      new Set((entries || []).map((e: any) => e.empresa_id).filter(Boolean))
    );

    const resultados: any[] = [];
    for (const empresa_id of empresaIds) {
      try {
        const { data, error } = await supabase.functions.invoke(
          "gerar-cartao-ponto-mensal",
          { body: { empresa_id, mes, ano } }
        );
        if (error) throw error;
        resultados.push({ empresa_id, ...data });
      } catch (err: any) {
        resultados.push({ empresa_id, erro: err.message });
      }
    }

    return new Response(
      JSON.stringify({
        executado_em: new Date().toISOString(),
        periodo: `${String(mes).padStart(2, "0")}/${ano}`,
        empresas: empresaIds.length,
        resultados,
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
