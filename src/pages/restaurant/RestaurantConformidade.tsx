import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { canManageRestaurant } from "@/lib/product-access";
import { useRestaurantSettings } from "@/hooks/useRestaurantSettings";
import {
  addDias,
  analisarCobertura,
  analisarJornada,
  type Alerta,
  type EscalaComBlocos,
} from "@/lib/escala/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/EmptyState";

function segundaDaSemana(): string {
  const d = new Date();
  const u = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  u.setUTCDate(u.getUTCDate() - ((u.getUTCDay() + 6) % 7));
  return u.toISOString().slice(0, 10);
}

export default function RestaurantConformidade() {
  const { perfil } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { settings } = useRestaurantSettings();
  const empresaId = perfil?.empresa_id;
  const podeEditar = canManageRestaurant(perfil?.role);
  const [inicio] = useState(segundaDaSemana());
  const fim = addDias(inicio, 27);

  const regras = {
    carga_semanal_max_horas: Number(settings?.carga_semanal_max_horas ?? 44),
    intervalo_minimo_horas: Number(settings?.intervalo_minimo_horas ?? 11),
  };

  const { data: escalas = [], isLoading } = useQuery({
    queryKey: ["restaurant-conformidade", empresaId, inicio],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurant_escalas")
        .select("funcionario_id, data, folga, restaurant_escala_blocos(inicio_previsto, fim_previsto, turno_nome_snapshot)")
        .eq("empresa_id", empresaId!)
        .gte("data", inicio)
        .lte("data", fim);
      if (error) throw error;
      return (data ?? []) as unknown as (EscalaComBlocos & {
        restaurant_escala_blocos: { inicio_previsto: string; fim_previsto: string; turno_nome_snapshot: string | null }[];
      })[];
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

  const nome = (id: string | null) =>
    id ? funcionarios.find((f) => f.id === id)?.nome ?? "Colaborador" : "Operação";

  const alertas = useMemo<Alerta[]>(() => {
    const entrada: EscalaComBlocos[] = escalas.map((e) => ({
      funcionario_id: e.funcionario_id,
      data: e.data,
      folga: e.folga,
      blocos: e.restaurant_escala_blocos,
    }));
    return [...analisarJornada(entrada, regras), ...analisarCobertura(entrada, inicio, addDias(inicio, 6))];
  }, [escalas, regras.carga_semanal_max_horas, regras.intervalo_minimo_horas, inicio]);

  const registrar = useMutation({
    mutationFn: async () => {
      if (!empresaId) return;
      if (alertas.length === 0) throw new Error("Nenhum alerta para registrar.");
      const { error } = await supabase.from("restaurant_alertas_jornada").insert(
        alertas.map((a) => ({
          empresa_id: empresaId,
          funcionario_id: a.funcionario_id,
          tipo: a.tipo,
          severidade: a.severidade,
          mensagem: a.mensagem,
          detalhe: (a.detalhe ?? {}) as never,
          periodo_inicio: a.data ?? inicio,
          periodo_fim: a.data ?? fim,
        }))
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["restaurant-alertas-registrados", empresaId] });
      toast({ title: "Alertas registrados no histórico" });
    },
    onError: (e: Error) => toast({ title: "Não foi possível registrar", description: e.message, variant: "destructive" }),
  });

  const porTipo = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of alertas) m.set(a.tipo, (m.get(a.tipo) ?? 0) + 1);
    return [...m.entries()];
  }, [alertas]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Conformidade operacional</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Limites configurados: carga semanal {regras.carga_semanal_max_horas}h · intervalo mínimo{" "}
            {regras.intervalo_minimo_horas}h · origem {settings?.origem_regra ?? "configuracao_empresa"}
          </p>
        </div>
        {podeEditar && alertas.length > 0 && (
          <Button variant="outline" onClick={() => registrar.mutate()} disabled={registrar.isPending}>
            Registrar no histórico
          </Button>
        )}
      </div>

      <Card className="border-border/70 bg-muted/30">
        <CardContent className="p-4 text-xs leading-relaxed text-muted-foreground">
          Os alertas abaixo são <strong>indicadores operacionais</strong> calculados a partir dos parâmetros
          definidos pela própria empresa. Não constituem parecer jurídico nem conclusão automática sobre
          conformidade legal — a validação deve ser feita por profissional habilitado.
        </CardContent>
      </Card>

      {porTipo.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {porTipo.map(([tipo, qtd]) => (
            <Badge key={tipo} variant="secondary">
              {tipo.replace(/_/g, " ")}: {qtd}
            </Badge>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alertas do período ({alertas.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : alertas.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="Nenhum alerta no período"
              description="As escalas atuais estão dentro dos limites configurados."
            />
          ) : (
            alertas.map((a, i) => (
              <div key={i} className="flex flex-wrap items-center gap-3 rounded-lg border border-border/70 p-3">
                <Badge variant={a.severidade === "critico" ? "destructive" : "secondary"}>{a.severidade}</Badge>
                <span className="text-sm font-medium">{nome(a.funcionario_id)}</span>
                <span className="text-sm text-muted-foreground">{a.mensagem}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
