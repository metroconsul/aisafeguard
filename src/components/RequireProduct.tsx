import { Navigate } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProdutos } from "@/hooks/useProdutos";
import {
  PRODUCT_HOME,
  PRODUCT_KEYS,
  type ProductKey,
  canViewRestaurant,
} from "@/lib/product-access";
import { Button } from "@/components/ui/button";

interface Props {
  product: ProductKey;
  children: React.ReactNode;
}

/**
 * Guard de produto no frontend. A proteção real é feita por RLS
 * (empresa_tem_produto) — aqui garantimos que a conta só veja o produto dela.
 */
export function RequireProduct({ product, children }: Props) {
  const { perfil, loading: authLoading } = useAuth();
  const { productKey, loading } = useProdutos();

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Conta pertence ao outro produto → nunca libera, apenas volta para o dela.
  if (productKey && productKey !== product) {
    return <Navigate to={PRODUCT_HOME[productKey]} replace />;
  }

  if (!productKey) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <ShieldAlert className="h-6 w-6 text-muted-foreground" strokeWidth={1.8} />
          </div>
          <h1 className="text-lg font-semibold text-foreground">Acesso não habilitado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Nenhum produto está habilitado para a sua empresa. Fale com o administrador da conta
            para solicitar a ativação.
          </p>
          <Button asChild className="mt-6">
            <a href="/login">Voltar ao login</a>
          </Button>
        </div>
      </div>
    );
  }

  const roleOk = product === PRODUCT_KEYS.restaurant ? canViewRestaurant(perfil?.role) : true;
  if (!roleOk) return <Navigate to={PRODUCT_HOME[product]} replace />;

  return <>{children}</>;
}
