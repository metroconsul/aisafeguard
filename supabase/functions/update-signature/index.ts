import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Recebe o resultado da assinatura (n8n / fluxos externos) e atualiza
 * a tabela `entregas` com status_assinatura e imagem_assinatura.
 *
 * Body esperado (JSON):
 * {
 *   "entrega_id": "uuid",            // obrigatório
 *   "status_assinatura": "Assinado", // opcional (default "Assinado")
 *   "imagem_assinatura": "data:image/png;base64,...", // opcional
 *   "foto_assinatura": "data:image/jpeg;base64,..."  // opcional
 * }
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Use POST" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const entregaId: string | undefined = body.entrega_id || body.id;
    const statusAssinatura: string = body.status_assinatura || "Assinado";
    const imagemAssinatura: string | undefined = body.imagem_assinatura;
    const fotoAssinatura: string | undefined = body.foto_assinatura;
    const cpfInformado: string | undefined = body.cpf;

    if (!entregaId) {
      return new Response(
        JSON.stringify({ error: "entrega_id é obrigatório no body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["Assinado", "Pendente"].includes(statusAssinatura)) {
      return new Response(
        JSON.stringify({ error: "status_assinatura deve ser 'Assinado' ou 'Pendente'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Quando vier da tela pública de assinatura (status Assinado + imagem),
    // validar o CPF informado contra o cadastro do funcionário.
    if (statusAssinatura === "Assinado" && imagemAssinatura) {
      const { data: entregaInfo } = await supabase
        .from("entregas")
        .select("funcionarios(cpf)")
        .eq("id", entregaId)
        .maybeSingle();
      const cpfCadastro = ((entregaInfo?.funcionarios as any)?.cpf || "").replace(/\D/g, "");
      const cpfLimpo = (cpfInformado || "").replace(/\D/g, "");
      if (!cpfCadastro || cpfLimpo.length !== 11 || cpfLimpo !== cpfCadastro) {
        return new Response(
          JSON.stringify({ error: "CPF informado não confere com o cadastro do funcionário" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const updatePayload: Record<string, unknown> = {
      status_assinatura: statusAssinatura,
    };
    if (imagemAssinatura) updatePayload.imagem_assinatura = imagemAssinatura;
    if (fotoAssinatura) updatePayload.foto_assinatura = fotoAssinatura;

    const { data, error } = await supabase
      .from("entregas")
      .update(updatePayload)
      .eq("id", entregaId)
      .select("id, status_assinatura, imagem_assinatura, foto_assinatura, funcionario_id, epi_id, empresa_id")
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

    // Espelha no documents (Ficha EPI) quando ficou assinado
    if (statusAssinatura === "Assinado") {
      await supabase
        .from("documents")
        .update({ signature_status: "assinado", signed_at: new Date().toISOString() })
        .eq("funcionario_id", data.funcionario_id)
        .eq("doc_category", "epi");
    }

    return new Response(
      JSON.stringify({ success: true, entrega: data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});