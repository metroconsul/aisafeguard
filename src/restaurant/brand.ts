/**
 * Tokens de marca do produto de restaurantes.
 * Nome definitivo ainda a definir — placeholder configurável por empresa
 * através de restaurant_product_settings / empresa_produtos.brand_config.
 * Nenhum componente deve hardcodar nome, logo ou cor.
 */

export interface BrandTokens {
  BRAND_NAME: string;
  BRAND_TAGLINE: string;
  BRAND_LOGO: string | null;
  BRAND_FAVICON: string | null;
  PRIMARY_COLOR: string;
  SECONDARY_COLOR: string;
  ACCENT_COLOR: string;
  TEXT_COLOR: string;
  SURFACE_COLOR: string;
  PORTAL_BRAND_NAME: string;
}

export const DEFAULT_BRAND: BrandTokens = {
  BRAND_NAME: "Escala",
  BRAND_TAGLINE: "Operação de Turnos",
  BRAND_LOGO: null,
  BRAND_FAVICON: null,
  PRIMARY_COLOR: "#0F172A",
  SECONDARY_COLOR: "#1E293B",
  ACCENT_COLOR: "#2563EB",
  TEXT_COLOR: "#0F172A",
  SURFACE_COLOR: "#F4F6FA",
  PORTAL_BRAND_NAME: "Minha Escala",
};

export interface BrandSource {
  brand_name?: string | null;
  brand_logo_url?: string | null;
  primary_color?: string | null;
  accent_color?: string | null;
  portal_brand_name?: string | null;
}

export function resolveBrand(source?: BrandSource | null): BrandTokens {
  if (!source) return DEFAULT_BRAND;
  return {
    ...DEFAULT_BRAND,
    BRAND_NAME: source.brand_name || DEFAULT_BRAND.BRAND_NAME,
    BRAND_LOGO: source.brand_logo_url || DEFAULT_BRAND.BRAND_LOGO,
    PRIMARY_COLOR: source.primary_color || DEFAULT_BRAND.PRIMARY_COLOR,
    ACCENT_COLOR: source.accent_color || DEFAULT_BRAND.ACCENT_COLOR,
    PORTAL_BRAND_NAME: source.portal_brand_name || DEFAULT_BRAND.PORTAL_BRAND_NAME,
  };
}
