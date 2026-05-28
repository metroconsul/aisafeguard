import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-portal-token",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function getServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export interface PortalSession {
  funcionario_id: string;
  empresa_id: string;
  token: string;
}

/**
 * Lê o token enviado no header (x-portal-token) ou body.portal_token,
 * valida na tabela portal_sessions, retorna a sessão.
 * Devolve null se inválido/expirado.
 */
export async function requirePortalSession(
  req: Request,
  body: Record<string, unknown> | null,
  supabase: SupabaseClient,
): Promise<PortalSession | Response> {
  const headerToken = req.headers.get("x-portal-token");
  const bodyToken = (body && typeof body.portal_token === "string") ? body.portal_token : null;
  const token = headerToken || bodyToken;

  if (!token || typeof token !== "string" || token.length < 20) {
    return jsonResponse({ error: "Sessão inválida" }, 401);
  }

  const { data, error } = await supabase
    .from("portal_sessions")
    .select("token, funcionario_id, empresa_id, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (error || !data) {
    return jsonResponse({ error: "Sessão inválida" }, 401);
  }

  if (new Date(data.expires_at).getTime() < Date.now()) {
    return jsonResponse({ error: "Sessão expirada" }, 401);
  }

  // Atualiza last_seen_at em background (sem await)
  supabase
    .from("portal_sessions")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("token", token)
    .then(() => {});

  return {
    funcionario_id: data.funcionario_id,
    empresa_id: data.empresa_id,
    token: data.token,
  };
}

export function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}