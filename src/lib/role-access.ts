// Role-based access control configuration
// Maps each role to the routes they can access

const ROLE_ROUTES: Record<string, string[]> = {
  admin: [
    "/app",
    "/app/nova-entrega",
    "/app/documentos",
    "/app/funcionarios",
    "/app/epis",
    "/app/treinamentos",
    "/app/setores",
    "/app/integracoes",
    "/app/configuracoes",
    "/app/equipe",
    "/app/seguranca",
  ],
  tecnico_seguranca: [
    "/app",
    "/app/nova-entrega",
    "/app/documentos",
    "/app/funcionarios",
    "/app/epis",
    "/app/treinamentos",
    "/app/setores",
  ],
  rh: [
    "/app",
    "/app/documentos",
    "/app/funcionarios",
    "/app/treinamentos",
  ],
  almoxarifado: [
    "/app",
    "/app/nova-entrega",
    "/app/epis",
  ],
};

export function canAccessRoute(role: string | undefined, route: string): boolean {
  if (!role) return false;
  const allowed = ROLE_ROUTES[role];
  if (!allowed) return false;
  // Exact match or sub-route (e.g. /app/funcionarios/123)
  return allowed.some((r) => route === r || route.startsWith(r + "/"));
}

export function filterMenuItems<T extends { url: string }>(
  role: string | undefined,
  items: T[]
): T[] {
  if (!role) return [];
  return items.filter((item) => canAccessRoute(role, item.url));
}
