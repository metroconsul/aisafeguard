import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PRODUCT_KEYS, type ProductKey } from "@/lib/product-access";

export interface EmpresaProduto {
  id: string;
  product_key: string;
  enabled: boolean;
  brand_config: Record<string, unknown> | null;
}

/** Produtos habilitados para a empresa do usuário autenticado. */
export function useProdutos() {
  const { perfil } = useAuth();
  const empresaId = perfil?.empresa_id;

  const query = useQuery({
    queryKey: ["empresa-produtos", empresaId],
    enabled: !!empresaId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresa_produtos")
        .select("id, product_key, enabled, brand_config")
        .eq("empresa_id", empresaId!);
      if (error) throw error;
      return (data ?? []) as unknown as EmpresaProduto[];
    },
  });

  const produtos = query.data ?? [];
  const has = (key: ProductKey) => produtos.some((p) => p.product_key === key && p.enabled);

  // O Safeguard industrial é o produto base do projeto: continua ativo mesmo sem registro,
  // garantindo que nenhuma empresa existente perca acesso.
  const hasSafeguard = true;
  const hasRestaurant = has(PRODUCT_KEYS.restaurant);

  return {
    produtos,
    loading: query.isLoading,
    hasSafeguard,
    hasRestaurant,
    hasBoth: hasSafeguard && hasRestaurant,
    refetch: query.refetch,
  };
}
