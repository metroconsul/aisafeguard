import { Search, LogOut } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
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
    <header className="flex h-14 items-center gap-4 border-b border-border bg-card px-4">
      <SidebarTrigger className="text-muted-foreground" />

      <div className="flex flex-1 items-center justify-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
          <Input
            placeholder="Buscar funcionários, EPIs..."
            className="h-9 w-full border-border bg-background pl-9 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <NotificacoesPopover />

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {initials}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium leading-none text-foreground">{perfil?.nome_completo ?? "Usuário"}</p>
            <p className="text-xs text-muted-foreground capitalize">{perfil?.role ?? ""}</p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
          title="Sair"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
}
