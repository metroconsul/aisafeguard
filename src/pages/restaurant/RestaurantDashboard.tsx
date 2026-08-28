import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CalendarDays, Clock3, TriangleAlert, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRestaurantSettings } from "@/hooks/useRestaurantSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { addDias } from "@/lib/escala/core";

export default function RestaurantDashboard() {
  const { perfil } = useAuth();
  const { brand } = useRestaurantSettings();
  const empresaId = perfil?.empresa_id;
  const hoje = new Date().toISOString().slice(0, 10);
  const fim = addDias(hoje, 6);

  const { data, isLoading } = useQuery({
    queryKey: ["restaurant-dashboard", empresaId, hoje],
    enabled: !!empresaId,
    queryFn: async () => {
      const [escalas, turnos, alertas, trocas] = await Promise.all([
        supabase
          .from("restaurant_escalas")
          .select("id, data, status, folga, funcionario_id")
          .eq("empresa_id", empresaId!)
          .gte("data", hoje)
          .lte("data", fim),
        supabase.from("restaurant_turnos").select("id").eq("empresa_id", empresaId!).eq("ativo", true),
        supabase
          .from("restaurant_alertas_jornada")
          .select("id, tipo, severidade, mensagem, data:periodo_inicio")
          .eq("empresa_id", empresaId!)
          .eq("status", "aberto")
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("restaurant_solicitacoes_troca")
          .select("id")
          .eq("empresa_id", empresaId!)
          .eq("status", "pendente"),
      ]);
      return {
        escalas: escalas.data ?? [],
        turnos: turnos.data?.length ?? 0,
        alertas: alertas.data ?? [],
        trocasPendentes: trocas.data?.length ?? 0,
      };
    },
  });

  const escalas = data?.escalas ?? [];
  const publicadas = escalas.filter((e) => e.status === "publicada").length;
  const colaboradores = new Set(escalas.map((e) => e.funcionario_id)).size;

  const kpis = [
    { label: "Turnos cadastrados", value: data?.turnos ?? 0, icon: Clock3, to: "/restaurant/turnos" },
    { label: "Escalas na semana", value: escalas.length, icon: CalendarDays, to: "/restaurant/escala" },
    { label: "Colaboradores escalados", value: colaboradores, icon: Users, to: "/restaurant/escala" },
    { label: "Alertas abertos", value: data?.alertas.length ?? 0, icon: TriangleAlert, to: "/restaurant/conformidade" },
  ];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {brand.BRAND_NAME}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Visão geral da operação
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Próximos 7 dias · {hoje.split("-").reverse().join("/")} a {fim.split("-").reverse().join("/")}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.label} to={k.to}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
                  <k.icon className="h-5 w-5 text-foreground" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-2xl font-bold leading-none">{isLoading ? "—" : k.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{k.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Alertas operacionais</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/restaurant/conformidade">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.alertas.length ?? 0) === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum alerta aberto no momento.
              </p>
            ) : (
              data!.alertas.map((a) => (
                <div key={a.id} className="flex items-start gap-3 rounded-lg border border-border/70 p-3">
                  <Badge variant={a.severidade === "critico" ? "destructive" : "secondary"}>
                    {a.severidade}
                  </Badge>
                  <p className="text-sm text-foreground">{a.mensagem}</p>
                </div>
              ))
            )}
            <p className="pt-2 text-[11px] text-muted-foreground">
              Alertas são indicadores operacionais configuráveis, não conclusões jurídicas.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Situação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Escalas publicadas</span>
              <span className="font-semibold">{publicadas}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Rascunhos</span>
              <span className="font-semibold">{escalas.length - publicadas}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Trocas pendentes</span>
              <span className="font-semibold">{data?.trocasPendentes ?? 0}</span>
            </div>
            <Button asChild className="mt-2 w-full">
              <Link to="/restaurant/escala">Abrir escala</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
