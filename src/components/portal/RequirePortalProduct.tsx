import { Navigate } from "react-router-dom";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { PRODUCT_KEYS, type ProductKey } from "@/lib/product-access";

/**
 * Isola as telas do portal por produto da empresa do colaborador.
 * Rotas do outro nicho não ficam acessíveis.
 */
export function RequirePortalProduct({
  product,
  children,
}: {
  product: ProductKey;
  children: React.ReactNode;
}) {
  const { employee } = usePortalAuth();
  const current = (employee?.product_key ?? PRODUCT_KEYS.safeguard) as ProductKey;
  if (current !== product) return <Navigate to="/portal" replace />;
  return <>{children}</>;
}
