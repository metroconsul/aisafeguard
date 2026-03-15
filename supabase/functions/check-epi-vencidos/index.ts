import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Get all empresas
    const { data: empresas } = await supabase.from("empresas").select("id, nome_fantasia");
    if (!empresas?.length) {
      return new Response(JSON.stringify({ message: "Nenhuma empresa encontrada" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalNotificacoes = 0;

    for (const empresa of empresas) {
      // Get setores with required EPIs for this empresa
      const { data: setoresEpis } = await supabase
        .from("setores_epis")
        .select("setor_id, epi_id")
        .eq("empresa_id", empresa.id);

      if (!setoresEpis?.length) continue;

      // Build map: setor_id -> required epi_ids
      const setorEpisMap: Record<string, string[]> = {};
      for (const se of setoresEpis) {
        if (!setorEpisMap[se.setor_id]) setorEpisMap[se.setor_id] = [];
        setorEpisMap[se.setor_id].push(se.epi_id);
      }

      const setorIds = Object.keys(setorEpisMap);

      // Get funcionarios in these setores
      const { data: funcionarios } = await supabase
        .from("funcionarios")
        .select("id, nome, setor_id")
        .eq("empresa_id", empresa.id)
        .in("setor_id", setorIds);

      if (!funcionarios?.length) continue;

      // Get setores names
      const { data: setores } = await supabase
        .from("setores")
        .select("id, nome")
        .in("id", setorIds);

      const setorNomeMap: Record<string, string> = {};
      for (const s of setores || []) {
        setorNomeMap[s.id] = s.nome;
      }

      // Get all active entregas for this empresa
      const { data: entregas } = await supabase
        .from("entregas")
        .select("funcionario_id, epi_id, data_vencimento, status_assinatura")
        .eq("empresa_id", empresa.id);

      const now = new Date();

      // Check each funcionario
      const irregulares: { nome: string; setor: string; episFaltando: number }[] = [];
      const vencidos: { nome: string; setor: string; episVencidos: number }[] = [];

      for (const func of funcionarios) {
        if (!func.setor_id) continue;
        const requiredEpis = setorEpisMap[func.setor_id] || [];
        if (!requiredEpis.length) continue;

        const funcEntregas = (entregas || []).filter(
          (e) => e.funcionario_id === func.id
        );

        let episFaltando = 0;
        let episVencidos = 0;

        for (const epiId of requiredEpis) {
          const entrega = funcEntregas.find((e) => e.epi_id === epiId);
          if (!entrega) {
            episFaltando++;
          } else if (new Date(entrega.data_vencimento) < now) {
            episVencidos++;
          }
        }

        const setorNome = setorNomeMap[func.setor_id] || "Desconhecido";

        if (episFaltando > 0) {
          irregulares.push({ nome: func.nome, setor: setorNome, episFaltando });
        }
        if (episVencidos > 0) {
          vencidos.push({ nome: func.nome, setor: setorNome, episVencidos });
        }
      }

      // Generate consolidated notifications
      const notificacoes: {
        empresa_id: string;
        titulo: string;
        mensagem: string;
        tipo: string;
      }[] = [];

      if (irregulares.length > 0) {
        const totalFaltando = irregulares.reduce((s, i) => s + i.episFaltando, 0);
        const detalhes = irregulares
          .slice(0, 5)
          .map((i) => `${i.nome} (${i.setor}): ${i.episFaltando} EPI(s)`)
          .join("; ");
        const extra = irregulares.length > 5 ? ` e mais ${irregulares.length - 5} funcionário(s)` : "";

        notificacoes.push({
          empresa_id: empresa.id,
          titulo: `⚠️ ${irregulares.length} funcionário(s) sem EPI obrigatório`,
          mensagem: `${detalhes}${extra}. Total de ${totalFaltando} EPI(s) faltando.`,
          tipo: "alerta",
        });
      }

      if (vencidos.length > 0) {
        const totalVencidos = vencidos.reduce((s, v) => s + v.episVencidos, 0);
        const detalhes = vencidos
          .slice(0, 5)
          .map((v) => `${v.nome} (${v.setor}): ${v.episVencidos} EPI(s)`)
          .join("; ");
        const extra = vencidos.length > 5 ? ` e mais ${vencidos.length - 5} funcionário(s)` : "";

        notificacoes.push({
          empresa_id: empresa.id,
          titulo: `🔴 ${vencidos.length} funcionário(s) com EPI vencido`,
          mensagem: `${detalhes}${extra}. Total de ${totalVencidos} EPI(s) vencido(s).`,
          tipo: "alerta",
        });
      }

      if (notificacoes.length > 0) {
        await supabase.from("notificacoes").insert(notificacoes);
        totalNotificacoes += notificacoes.length;
      }
    }

    return new Response(
      JSON.stringify({ success: true, notificacoes_geradas: totalNotificacoes }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
