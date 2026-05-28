import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

/**
 * Retorna o status de assinatura de um cartão de ponto (documents).
 * GET ?document_id=<uuid>  (ou POST { document_id })
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    let documentId: string | null = null;
    if (req.method === "GET") {
      const url = new URL(req.url);
      documentId = url.searchParams.get("document_id");
    } else if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      documentId = body.document_id ?? null;
    } else {
      return new Response(JSON.stringify({ error: "Use GET ou POST" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!documentId) {
      return new Response(
        JSON.stringify({ error: "document_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase
      .from("documents")
      .select("id, title, reference_period, signature_status, signed_at, signature_ip, funcionario_id, empresa_id, file_url, doc_category")
      .eq("id", documentId)
      .eq("doc_category", "cartao_ponto")
      .maybeSingle();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: "Cartão de ponto não encontrado", document_id: documentId }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        document_id: data.id,
        title: data.title,
        reference_period: data.reference_period,
        signature_status: data.signature_status,
        assinado: data.signature_status === "assinado",
        signed_at: data.signed_at,
        signature_ip: data.signature_ip,
        funcionario_id: data.funcionario_id,
        empresa_id: data.empresa_id,
        file_url: data.file_url,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});