import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";

const dt = (iso: string) => new Date(iso).toLocaleString("pt-BR");

export default function RestaurantHistorico() {
  const { perfil } = useAuth();
  const empresaId = perfil?.empresa_id;

  const { data, isLoading } = useQuery({
    queryKey: ["restaurant-historico", empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const [ajustes, alertas, ciencias, notificacoes] = await Promise.all([
        supabase
          .from("restaurant_ajustes_escala")
          .select("id, tipo, motivo, created_at, funcionario_id, new_value")
          .eq("empresa_id", empresaId!)
          .order("created_at", { ascending: false })
          .limit(60),
        supabase
          .from("restaurant_alertas_jornada")
          .select("id, tipo, severidade, mensagem, status, created_at")
          .eq("empresa_id", empresaId!)
          .order("created_at", { ascending: false })
          .limit(40),
        supabase
          .from("restaurant_escala_ciencia")
          .select("id, funcionario_id, periodo_inicio, periodo_fim, visualizado_em, versao")
          .eq("empresa_id", empresaId!)
          .order("visualizado_em", { ascending: false })
          .limit(40),
        supabase
          .from("restaurant_notificacao_eventos")
          .select("id, evento, canal, status, dedupe_key, created_at")
          .eq("empresa_id", empresaId!)
          .order("created_at", { ascending: false })
          .limit(40),
      ]);
      return {
        ajustes: ajustes.data ?? [],
        alertas: alertas.data ?? [],
        ciencias: ciencias.data ?? [],
        notificacoes: notificacoes.data ?? [],
      };
    },
  });

  const { data: funcionarios = [] } = useQuery({
    queryKey: ["restaurant-func-nomes", empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data } = await supabase.from("funcionarios").select("id, nome").eq("empresa_id", empresaId!);
      return data ?? [];
    },
  });
  const nome = (id: string | null) => (id ? funcionarios.find((f) => f.id === id)?.nome ?? "—" : "—");

  const vazio = !isLoading && (data?.ajustes.length ?? 0) === 0 && (data?.alertas.length ?? 0) === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Histórico e auditoria</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Publicações, ajustes manuais, ciência dos colaboradores e envios de notificação.
        </p>
      </div>

      {vazio ? (
        <EmptyState icon={History} title="Nada registrado ainda" description="As ações na escala aparecerão aqui." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Ajustes e publicações</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(data?.ajustes ?? []).map((a) => (
                <div key={a.id} className="rounded-lg border border-border/70 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary">{a.tipo.replace(/_/g, " ")}</Badge>
                    <span className="text-[11px] text-muted-foreground">{dt(a.created_at)}</span>
                  </div>
                  <p className="mt-1.5 text-muted-foreground">
                    {a.funcionario_id ? nome(a.funcionario_id) : "Semana inteira"}
                    {a.motivo ? ` · ${a.motivo}` : ""}
                  </p>
                </div>
              ))}
              {(data?.ajustes.length ?? 0) === 0 && <p className="text-sm text-muted-foreground">Sem registros.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Alertas registrados</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(data?.alertas ?? []).map((a) => (
                <div key={a.id} className="rounded-lg border border-border/70 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={a.severidade === "critico" ? "destructive" : "secondary"}>{a.tipo.replace(/_/g, " ")}</Badge>
                    <span className="text-[11px] text-muted-foreground">{dt(a.created_at)}</span>
                  </div>
                  <p className="mt-1.5 text-muted-foreground">{a.mensagem}</p>
                </div>
              ))}
              {(data?.alertas.length ?? 0) === 0 && <p className="text-sm text-muted-foreground">Sem registros.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Ciência da escala</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(data?.ciencias ?? []).map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-border/70 p-3 text-sm">
                  <span>{nome(c.funcionario_id)}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {c.periodo_inicio} → {c.periodo_fim} · {dt(c.visualizado_em)}
                  </span>
                </div>
              ))}
              {(data?.ciencias.length ?? 0) === 0 && <p className="text-sm text-muted-foreground">Sem registros.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Notificações (idempotentes)</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(data?.notificacoes ?? []).map((n) => (
                <div key={n.id} className="rounded-lg border border-border/70 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary">{n.evento}</Badge>
                    <span className="text-[11px] text-muted-foreground">{dt(n.created_at)}</span>
                  </div>
                  <p className="mt-1.5 truncate text-[11px] text-muted-foreground">
                    {n.canal} · {n.status} · {n.dedupe_key}
                  </p>
                </div>
              ))}
              {(data?.notificacoes.length ?? 0) === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum envio registrado.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
