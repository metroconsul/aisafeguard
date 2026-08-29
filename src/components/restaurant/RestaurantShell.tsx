import { Outlet, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Clock3,
  LayoutDashboard,
  Repeat,
  Settings,
  ShieldCheck,
  History,
  LogOut,
  UtensilsCrossed,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useRestaurantSettings } from "@/hooks/useRestaurantSettings";

const navItems = [
  { title: "Visão geral", url: "/restaurant/dashboard", icon: LayoutDashboard },
  { title: "Escala", url: "/restaurant/escala", icon: CalendarDays },
  { title: "Turnos", url: "/restaurant/turnos", icon: Clock3 },
  { title: "Regimes", url: "/restaurant/regimes", icon: Repeat },
  { title: "Conformidade", url: "/restaurant/conformidade", icon: ShieldCheck },
  { title: "Histórico", url: "/restaurant/historico", icon: History },
  { title: "Configurações", url: "/restaurant/configuracoes", icon: Settings },
];

export function RestaurantShell() {
  const { perfil, empresa, signOut } = useAuth();
  const { brand } = useRestaurantSettings();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/turnos/login", { replace: true });
  };

  return (
    <div
      className="flex min-h-screen w-full"
      style={{
        // Tokens de marca aplicados por CSS vars — sem hardcode em componentes
        ["--brand-primary" as string]: brand.PRIMARY_COLOR,
        ["--brand-accent" as string]: brand.ACCENT_COLOR,
        backgroundColor: brand.SURFACE_COLOR,
      }}
    >
      <aside
        className="hidden w-[258px] shrink-0 flex-col border-r border-white/10 lg:flex"
        style={{ backgroundColor: "var(--brand-primary)" }}
      >
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-white/10 ring-1 ring-white/15">
            {brand.BRAND_LOGO ? (
              <img src={brand.BRAND_LOGO} alt={brand.BRAND_NAME} className="h-full w-full object-contain" />
            ) : (
              <UtensilsCrossed className="h-5 w-5 text-white" strokeWidth={1.8} />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[16px] font-bold tracking-tight text-white">{brand.BRAND_NAME}</p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-white/40">
              {brand.BRAND_TAGLINE}
            </p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 px-3 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              className="flex h-10 items-center rounded-lg px-3 text-sm font-medium text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white"
              activeClassName="bg-white/[0.14] font-semibold text-white"
            >
              <item.icon className="mr-3 h-[18px] w-[18px]" strokeWidth={1.8} />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 px-4 py-3">
          <p className="truncate text-sm font-medium text-white">{empresa?.nome_fantasia ?? "Operação"}</p>
          <p className="truncate text-[11px] text-white/50">{perfil?.nome_completo}</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[64px] items-center gap-3 border-b border-border/70 bg-card/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <UtensilsCrossed className="h-5 w-5 text-foreground" strokeWidth={1.8} />
            <span className="text-sm font-semibold">{brand.BRAND_NAME}</span>
          </div>
          <div className="flex-1" />
          <button
            onClick={handleSignOut}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            title="Sair"
            aria-label="Sair"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </header>

        <div className="border-b border-border/60 bg-card/60 px-4 py-2 sm:px-6 lg:hidden">
          <nav className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground"
                activeClassName="bg-muted font-semibold text-foreground"
              >
                {item.title}
              </NavLink>
            ))}
          </nav>
        </div>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
