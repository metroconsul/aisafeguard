import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Atualiza um cartão de ponto (documents.doc_category = 'cartao_ponto') como assinado.
 * Body: { document_id, funcionario_id, empresa_id, ip_address?, user_agent? }
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Use POST" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const documentId: string | undefined = body.document_id;
    const funcionarioId: string | undefined = body.funcionario_id;
    const empresaId: string | undefined = body.empresa_id;
    const ipAddress: string | undefined = body.ip_address;
    const userAgent: string | undefined = body.user_agent;

    if (!documentId || !funcionarioId || !empresaId) {
      return new Response(
        JSON.stringify({ error: "document_id, funcionario_id e empresa_id são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("documents")
      .update({ signature_status: "assinado", signed_at: now, signature_ip: ipAddress ?? null })
      .eq("id", documentId)
      .eq("doc_category", "cartao_ponto")
      .select("id, signature_status, signed_at")
      .maybeSingle();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!data) {
      return new Response(JSON.stringify({ error: "Cartão de ponto não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("signature_logs").insert({
      funcionario_id: funcionarioId,
      empresa_id: empresaId,
      document_id: documentId,
      action_type: "assinatura_ponto",
      ip_address: ipAddress ?? null,
      user_agent: userAgent ?? null,
      signed_at: now,
    });

    return new Response(JSON.stringify({ success: true, document: data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});