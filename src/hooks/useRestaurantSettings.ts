import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { resolveBrand, type BrandTokens } from "@/restaurant/brand";

export interface RestaurantSettings {
  empresa_id: string;
  brand_name: string;
  brand_logo_url: string | null;
  primary_color: string;
  accent_color: string;
  portal_brand_name: string;
  carga_semanal_max_horas: number;
  intervalo_minimo_horas: number;
  permite_troca_turno: boolean;
  exige_ciencia_escala: boolean;
  origem_regra: string;
}

export function useRestaurantSettings() {
  const { perfil } = useAuth();
  const empresaId = perfil?.empresa_id;

  const query = useQuery({
    queryKey: ["restaurant-settings", empresaId],
    enabled: !!empresaId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurant_product_settings")
        .select("*")
        .eq("empresa_id", empresaId!)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as RestaurantSettings | null) ?? null;
    },
  });

  const settings = query.data ?? null;
  const brand: BrandTokens = resolveBrand(settings);

  return { settings, brand, loading: query.isLoading, refetch: query.refetch };
}
