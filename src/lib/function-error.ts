import { FunctionsHttpError } from "@supabase/supabase-js";

/**
 * Edge Functions que respondem 4xx fazem o supabase-js lançar
 * "Edge Function returned a non-2xx status code", escondendo a mensagem real.
 * Este helper lê o corpo da resposta e devolve um texto legível em português.
 */
export async function readFunctionError(error: unknown, fallback: string): Promise<string> {
  let raw = "";

  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      raw = String(body?.error ?? body?.message ?? "");
    } catch {
      raw = "";
    }
  } else if (error && typeof error === "object" && "message" in error) {
    raw = String((error as { message?: string }).message ?? "");
  }

  return translateFunctionError(raw) || fallback;
}

export function translateFunctionError(raw: string): string {
  if (!raw) return "";
  const lower = raw.toLowerCase();
  if (lower.includes("already been registered") || lower.includes("already registered")) {
    return "Este email já possui uma conta. Faça login ou use outro email.";
  }
  if (lower.includes("password") && lower.includes("weak")) {
    return "Senha muito fraca. Use uma senha mais forte.";
  }
  if (lower.includes("invalid email")) {
    return "Email inválido.";
  }
  if (lower.includes("non-2xx")) return "";
  return raw;
}
