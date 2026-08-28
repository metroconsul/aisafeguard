import { useNavigate } from "react-router-dom";
import { ArrowLeftRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRestaurantSettings } from "@/hooks/useRestaurantSettings";

/**
 * Seletor de produto — só é renderizado quando a empresa possui os dois produtos.
 * Trocar de produto apenas navega: não altera empresa, sessão nem permissões.
 */
export function ProductSwitcher({ current }: { current: "safeguard" | "restaurant" }) {
  const navigate = useNavigate();
  const { brand } = useRestaurantSettings();

  const options = [
    { key: "safeguard" as const, label: "Ava Safeguard", to: "/app" },
    { key: "restaurant" as const, label: brand.BRAND_NAME, to: "/restaurant/dashboard" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ArrowLeftRight className="h-3.5 w-3.5" strokeWidth={1.8} />
          <span className="hidden sm:inline">
            {options.find((o) => o.key === current)?.label}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Trocar de produto</DropdownMenuLabel>
        {options.map((o) => (
          <DropdownMenuItem key={o.key} onClick={() => navigate(o.to)} className="gap-2">
            {o.key === current ? <Check className="h-4 w-4" /> : <span className="w-4" />}
            {o.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
