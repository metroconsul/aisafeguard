import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PRODUCT_HOME, PRODUCT_KEYS, type ProductKey } from "@/lib/product-access";
import { navLog } from "@/lib/nav-telemetry";

export interface EmpresaProduto {
  id: string;
  product_key: string;
  enabled: boolean;
  brand_config: Record<string, unknown> | null;
}

/**
 * Produto da empresa do usuário autenticado.
 * Uma empresa possui exatamente um produto habilitado — nunca os dois.
 */
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
      if (error) {
        navLog("entitlement", "useProdutos", `Erro ao ler empresa_produtos: ${error.message}`, {
          empresaId,
          code: error.code,
        });
        throw error;
      }
      const rows = (data ?? []) as unknown as EmpresaProduto[];
      navLog("entitlement", "useProdutos", "empresa_produtos carregado", {
        empresaId,
        rows: rows.map((r) => ({ key: r.product_key, enabled: r.enabled })),
      });
      return rows;
    },
  });

  const produtos = query.data ?? [];
  const ativo = produtos.find((p) => p.enabled);
  const productKey = (ativo?.product_key ?? null) as ProductKey | null;

  // Loga apenas quando o estado do entitlement realmente muda (evita ruído por render).
  const lastLogged = useRef<string | null>(null);
  useEffect(() => {
    const signature = `${empresaId ?? "sem-empresa"}|${query.isLoading}|${productKey ?? "nenhum"}`;
    if (lastLogged.current === signature) return;
    lastLogged.current = signature;
    navLog(
      "entitlement",
      "useProdutos",
      empresaId
        ? `Entitlement: produto=${productKey ?? "nenhum"} loading=${query.isLoading}`
        : "Sem empresa_id no perfil — entitlement indefinido",
      { empresaId: empresaId ?? null, productKey, loading: query.isLoading },
    );
  }, [empresaId, productKey, query.isLoading]);

  return {
    produtos,
    loading: query.isLoading,
    productKey,
    home: productKey ? PRODUCT_HOME[productKey] : null,
    isSafeguard: productKey === PRODUCT_KEYS.safeguard,
    isRestaurant: productKey === PRODUCT_KEYS.restaurant,
    refetch: query.refetch,
  };
}
