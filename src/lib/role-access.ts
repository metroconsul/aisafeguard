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
    "/app/funcionarios",
    "/app/epis",
    "/app/treinamentos",
    "/app/setores",
    "/app/documentos",
  ],
  rh: [
    "/app",
    "/app/funcionarios",
    "/app/documentos",
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
  // NOTE: Treating "/app" as a prefix would accidentally allow every /app/* route.
  return allowed.some((r) => {
    if (r === "/app") return route === "/app";
    return route === r || route.startsWith(r + "/");
  });
}

export function filterMenuItems<T extends { url: string }>(
  role: string | undefined,
  items: T[]
): T[] {
  if (!role) return [];
  return items.filter((item) => {
    if (item.url === "/app") return canAccessRoute(role, "/app");
    return canAccessRoute(role, item.url);
  });
}
