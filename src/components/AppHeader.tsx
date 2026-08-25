import { Search, LogOut } from "lucide-react";
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
    ? perfil.nome_completo.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  return (
    <header className="flex h-16 items-center gap-2 border-b border-border bg-card px-3 sm:gap-4 sm:px-5">
      <SidebarTrigger className="text-muted-foreground" />

      <div className="hidden flex-1 items-center sm:flex">
        <div className="relative w-full max-w-[320px]">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" strokeWidth={1.75} />
          <input
            placeholder="Buscar funcionários, EPIs..."
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-11 pr-4 text-sm shadow-sm outline-none transition-all duration-150 placeholder:text-muted-foreground/60 focus:border-transparent focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex-1 sm:flex-none" />

      <div className="flex items-center gap-2 sm:gap-3">
        <NotificacoesPopover />

        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-600">
            {initials}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium leading-none text-foreground">{perfil?.nome_completo ?? "Usuário"}</p>
            <p className="text-[11px] capitalize text-muted-foreground">{perfil?.role ?? ""}</p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
          title="Sair"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}
