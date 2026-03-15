import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, AlertTriangle, CheckCircle, Info, CheckCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  tipo: string;
  created_at: string;
}

function tempoRelativo(data: string) {
  const agora = new Date();
  const criado = new Date(data);
  const diff = Math.floor((agora.getTime() - criado.getTime()) / 1000);
  if (diff < 60) return "agora mesmo";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `há ${Math.floor(diff / 86400)}d`;
  return criado.toLocaleDateString("pt-BR");
}

const tipoConfig: Record<string, { icon: typeof AlertTriangle; color: string; bg: string }> = {
  alerta: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
  sucesso: { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-500/10" },
};

export function NotificacoesPopover() {
  const { perfil } = useAuth();
  const navigate = useNavigate();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [open, setOpen] = useState(false);

  const marcarComoLida = async (notificacao: Notificacao) => {
    if (!notificacao.lida) {
      await supabase.from("notificacoes").update({ lida: true }).eq("id", notificacao.id);
      setNotificacoes((prev) => prev.map((n) => n.id === notificacao.id ? { ...n, lida: true } : n));
    }
    setOpen(false);
    // Navigate to setores page for EPI alerts
    if (notificacao.tipo === "alerta") {
      navigate("/setores");
    }
  };

  const fetchNotificacoes = async () => {
    const { data } = await supabase
      .from("notificacoes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setNotificacoes(data);
  };

  useEffect(() => {
    if (perfil) fetchNotificacoes();
  }, [perfil]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("notificacoes-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notificacoes" },
        () => fetchNotificacoes()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  const marcarTodasComoLidas = async () => {
    const { error } = await supabase
      .from("notificacoes")
      .update({ lida: true })
      .eq("lida", false);
    if (!error) {
      setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent">
          <Bell className="h-4 w-4" strokeWidth={1.5} />
          {naoLidas > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {naoLidas > 9 ? "9+" : naoLidas}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" sideOffset={8}>
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h4 className="text-sm font-semibold text-foreground">Notificações</h4>
          {naoLidas > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto gap-1 px-2 py-1 text-xs text-muted-foreground"
              onClick={marcarTodasComoLidas}
            >
              <CheckCheck className="h-3 w-3" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-80">
          {notificacoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="mb-2 h-8 w-8 opacity-30" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notificacoes.map((n) => {
                const config = tipoConfig[n.tipo] ?? tipoConfig.info;
                const Icon = config.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => marcarComoLida(n)}
                    className={cn(
                      "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 cursor-pointer",
                      !n.lida && "bg-accent/40"
                    )}
                  >
                    <div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full", config.bg)}>
                      <Icon className={cn("h-3.5 w-3.5", config.color)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-sm leading-tight", !n.lida ? "font-semibold text-foreground" : "text-muted-foreground")}>
                        {n.titulo}
                      </p>
                      <p className="mt-0.5 text-xs leading-snug text-muted-foreground line-clamp-2">
                        {n.mensagem}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground/60">
                        {tempoRelativo(n.created_at)}
                      </p>
                    </div>
                    {!n.lida && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
