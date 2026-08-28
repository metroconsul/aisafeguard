// Camada de acesso por produto (entitlements).
// Fail-closed: sem registro habilitado em empresa_produtos, o produto não existe para a empresa.

export const PRODUCT_KEYS = {
  safeguard: "safeguard_industrial",
  restaurant: "restaurant_operations",
} as const;

export type ProductKey = (typeof PRODUCT_KEYS)[keyof typeof PRODUCT_KEYS];

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
