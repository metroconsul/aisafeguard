import { corsHeaders, generateToken, getServiceClient, jsonResponse, readJson } from "../_shared/portal-session.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await readJson(req);
    const cpf = (body.cpf as string | undefined) ?? "";
    const pin = (body.pin as string | undefined) ?? "";

    if (!cpf || !pin) {
      return jsonResponse({ error: "CPF e PIN são obrigatórios" }, 400);
    }

    const cpfClean = cpf.replace(/\D/g, "");
    const pinClean = String(pin).replace(/\D/g, "");
    if (cpfClean.length !== 11 || pinClean.length < 4 || pinClean.length > 6) {
      return jsonResponse({ error: "CPF ou PIN inválido" }, 400);
    }

    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from("funcionarios")
      .select("id, nome, cargo, setor, empresa_id, cpf")
      .eq("cpf", cpfClean)
      .eq("access_pin", pinClean)
      .eq("status", "ativo")
      .single();

    if (error || !data) {
      return jsonResponse({ error: "CPF ou PIN inválido" }, 401);
    }

    const { data: empresa } = await supabase
      .from("empresas")
      .select("nome_fantasia, logo_url")
      .eq("id", data.empresa_id)
      .single();

    const { data: produto } = await supabase
      .from("empresa_produtos")
      .select("product_key")
      .eq("empresa_id", data.empresa_id)
      .eq("enabled", true)
      .maybeSingle();

    // Cria sessão (válida por 30 dias)
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const ua = req.headers.get("user-agent") ?? null;

    const { error: sessErr } = await supabase.from("portal_sessions").insert({
      token,
      funcionario_id: data.id,
      empresa_id: data.empresa_id,
      expires_at: expiresAt,
      ip_address: ip,
      user_agent: ua,
    });
    if (sessErr) {
      return jsonResponse({ error: "Falha ao criar sessão" }, 500);
    }

    return jsonResponse({
      session_token: token,
      expires_at: expiresAt,
      employee: {
        id: data.id,
        nome: data.nome,
        cargo: data.cargo,
        setor: data.setor,
        empresa_id: data.empresa_id,
        empresa_nome: empresa?.nome_fantasia ?? "",
        empresa_logo: empresa?.logo_url ?? null,
        product_key: produto?.product_key ?? "safeguard_industrial",
      },
    });
  } catch (err) {
    return jsonResponse({ error: "Erro interno do servidor" }, 500);
  }
});
