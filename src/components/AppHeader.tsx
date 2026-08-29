import { LogOut, Search, Sparkles } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { NotificacoesPopover } from "@/components/NotificacoesPopover";

export function AppHeader() {
  const { perfil, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const initials = perfil?.nome_completo
    ? perfil.nome_completo
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "??";

  const roleLabel = perfil?.role?.replace(/_/g, " ") ?? "usuário";

  return (
    <header className="sticky top-0 z-30 flex h-[68px] items-center gap-3 border-b border-border/80 bg-card/95 px-4 backdrop-blur sm:px-6">
      <SidebarTrigger className="h-9 w-9 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" />

      <div className="hidden flex-1 items-center sm:flex">
        <div className="group relative w-full max-w-[360px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/65 transition-colors group-focus-within:text-primary" strokeWidth={1.8} />
          <input
            placeholder="Buscar funcionários, EPIs..."
            aria-label="Busca global"
            className="h-10 w-full rounded-lg border border-border/80 bg-muted/40 py-2.5 pl-10 pr-12 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/65 focus:border-secondary/60 focus:bg-card focus:ring-2 focus:ring-secondary/15"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground sm:inline-flex">
            /
          </span>
        </div>
      </div>

      <div className="flex-1 sm:flex-none" />

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-2 rounded-lg border border-secondary/15 bg-secondary/5 px-2.5 py-1.5 lg:flex">
          <Sparkles className="h-3.5 w-3.5 text-secondary-400" strokeWidth={1.8} />
          <span className="text-xs font-medium text-secondary-500">Operação em tempo real</span>
        </div>

        <NotificacoesPopover />

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-xs font-bold text-primary-600 ring-1 ring-primary-100">
            {initials}
          </div>
          <div className="hidden min-w-0 md:block">
            <p className="max-w-[150px] truncate text-sm font-semibold leading-tight text-foreground">
              {perfil?.nome_completo ?? "Usuário"}
            </p>
            <p className="mt-0.5 text-[11px] capitalize text-muted-foreground">{roleLabel}</p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-all duration-150 hover:bg-destructive/10 hover:text-destructive active:scale-[0.97]"
          title="Sair"
          aria-label="Sair"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </div>
    </header>
  );
}
