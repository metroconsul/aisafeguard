import { supabase } from "@/integrations/supabase/client";

/**
 * Trilha de auditoria do módulo de EPI.
 * Falhas de auditoria nunca devem quebrar a ação principal do usuário.
 */
export async function logEpiAudit(params: {
  empresaId: string;
  entity: string;
  entityId?: string | null;
  action: string;
  oldValue?: unknown;
  newValue?: unknown;
}) {
  try {
    const { data: auth } = await supabase.auth.getUser();
    await supabase.from("epi_audit_log").insert({
      empresa_id: params.empresaId,
      actor_id: auth.user?.id ?? null,
      entity: params.entity,
      entity_id: params.entityId ?? null,
      action: params.action,
      old_value: (params.oldValue ?? null) as never,
      new_value: (params.newValue ?? null) as never,
    });
  } catch (e) {
    console.warn("Falha ao registrar auditoria de EPI:", e);
  }
}
