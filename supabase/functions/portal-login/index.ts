import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { cpf, pin } = await req.json();

    if (!cpf || !pin) {
      return new Response(
        JSON.stringify({ error: "CPF e PIN são obrigatórios" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Normalize CPF: remove formatting
    const cpfClean = cpf.replace(/\D/g, "");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase
      .from("funcionarios")
      .select("id, nome, cargo, setor, empresa_id, cpf")
      .eq("cpf", cpfClean)
      .eq("access_pin", pin)
      .eq("status", "ativo")
      .single();

    if (error || !data) {
      return new Response(
        JSON.stringify({ error: "CPF ou PIN inválido" }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Also fetch empresa info for display
    const { data: empresa } = await supabase
      .from("empresas")
      .select("nome_fantasia, logo_url")
      .eq("id", data.empresa_id)
      .single();

    return new Response(
      JSON.stringify({
        employee: {
          id: data.id,
          nome: data.nome,
          cargo: data.cargo,
          setor: data.setor,
          empresa_id: data.empresa_id,
          empresa_nome: empresa?.nome_fantasia ?? "",
          empresa_logo: empresa?.logo_url ?? null,
        },
      }),
      { headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
