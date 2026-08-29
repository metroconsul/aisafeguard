// Camada de acesso por produto (entitlements).
// Regra: uma empresa possui exatamente UM produto habilitado.
// Fail-closed: sem registro habilitado em empresa_produtos, nenhum produto é liberado.

import { supabase } from "@/integrations/supabase/client";

export const PRODUCT_KEYS = {
  safeguard: "safeguard_industrial",
  restaurant: "restaurant_operations",
} as const;

export type ProductKey = (typeof PRODUCT_KEYS)[keyof typeof PRODUCT_KEYS];

/** Home administrativa de cada produto. */
export const PRODUCT_HOME: Record<ProductKey, string> = {
  [PRODUCT_KEYS.safeguard]: "/app",
  [PRODUCT_KEYS.restaurant]: "/restaurant/dashboard",
};

export const PRODUCT_LABEL: Record<ProductKey, string> = {
  [PRODUCT_KEYS.safeguard]: "Ava Safeguard",
  [PRODUCT_KEYS.restaurant]: "Escala — Operação de Turnos",
};

/** Login/cadastro de cada produto (portas separadas por nicho). */
export const PRODUCT_LOGIN: Record<ProductKey, string> = {
  [PRODUCT_KEYS.safeguard]: "/login",
  [PRODUCT_KEYS.restaurant]: "/turnos/login",
};

export const RESTAURANT_ROUTES = [
  "/restaurant",
  "/restaurant/dashboard",
  "/restaurant/escala",
  "/restaurant/turnos",
  "/restaurant/regimes",
  "/restaurant/conformidade",
  "/restaurant/historico",
  "/restaurant/configuracoes",
] as const;

// Papéis que podem gerenciar a operação de escalas no shell de restaurantes.
const RESTAURANT_MANAGER_ROLES = ["admin", "rh"] as const;
const RESTAURANT_VIEWER_ROLES = ["admin", "rh", "tecnico_seguranca", "almoxarifado"] as const;

export function canViewRestaurant(role: string | undefined): boolean {
  return !!role && (RESTAURANT_VIEWER_ROLES as readonly string[]).includes(role);
}

export function canManageRestaurant(role: string | undefined): boolean {
  return !!role && (RESTAURANT_MANAGER_ROLES as readonly string[]).includes(role);
}

/**
 * Descobre o produto da empresa do usuário autenticado.
 * A RLS de empresa_produtos já limita a leitura à própria empresa.
 */
export async function fetchProductKey(): Promise<ProductKey | null> {
  const { data, error } = await supabase
    .from("empresa_produtos")
    .select("product_key")
    .eq("enabled", true)
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data.product_key as ProductKey;
}
