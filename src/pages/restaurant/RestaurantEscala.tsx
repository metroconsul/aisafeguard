import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ChevronLeft, ChevronRight, Send, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { canManageRestaurant } from "@/lib/product-access";
import { useRestaurantSettings } from "@/hooks/useRestaurantSettings";
import {
  addDias,
  analisarJornada,
  blocoDeTurno,
  listarDatas,
  projetarModelo,
  type EscalaComBlocos,
  type ModeloItem,
  type TurnoDef,
} from "@/lib/escala/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/EmptyState";

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function segundaDaSemana(base = new Date()): string {
  const d = new Date(Date.UTC(base.getFullYear(), base.getMonth(), base.getDate()));
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

const fmt = (d: string) => d.slice(8, 10) + "/" + d.slice(5, 7);

interface EscalaRow {
  id: string;
  funcionario_id: string;
  data: string;
  folga: boolean;
  status: string;
  editado_manualmente: boolean;
  origem: string;
  restaurant_escala_blocos: {
    id: string;
    turno_id: string | null;
    turno_nome_snapshot: string | null;
    ordem: number;
    inicio_previsto: string;
    fim_previsto: string;
  }[];
}

export default function RestaurantEscala() {
  const { perfil } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { settings } = useRestaurantSettings();
  const empresaId = perfil?.empresa_id;
  const podeEditar = canManageRestaurant(perfil?.role);

  const [semana, setSemana] = useState(() => segundaDaSemana());
  const fimSemana = addDias(semana, 6);
  const dias = listarDatas(semana, fimSemana);

  const [celula, setCelula] = useState<{ funcionarioId: string; data: string } | null>(null);
  const [selTurnos, setSelTurnos] = useState<string[]>([]);
  const [folga, setFolga] = useState(false);
  const [modeloId, setModeloId] = useState<string>("");
  const [aplicarOpen, setAplicarOpen] = useState(false);

  const { data: funcionarios = [] } = useQuery({
    queryKey: ["restaurant-funcionarios", empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("funcionarios")
        .select("id, nome, cargo, setor, status")
        .eq("empresa_id", empresaId!)
        .order("nome");
      if (error) throw error;
      return (data ?? []).filter((f) => f.status !== "inativo");
    },
  });

  const { data: turnos = [] } = useQuery({
    queryKey: ["restaurant-turnos-ativos", empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurant_turnos")
        .select("id, nome, hora_inicio, hora_fim, cruza_meia_noite, cor")
        .eq("empresa_id", empresaId!)
        .eq("ativo", true)
        .order("hora_inicio");
      if (error) throw error;
      return (data ?? []) as unknown as (TurnoDef & { cor: string })[];
    },
  });

  const { data: modelos = [] } = useQuery({
    queryKey: ["restaurant-modelos", empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurant_modelos_escala")
        .select("id, nome, versao, status")
        .eq("empresa_id", empresaId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: escalas = [], isLoading } = useQuery({
    queryKey: ["restaurant-escalas", empresaId, semana],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurant_escalas")
        .select(
          "id, funcionario_id, data, folga, status, editado_manualmente, origem, restaurant_escala_blocos(id, turno_id, turno_nome_snapshot, ordem, inicio_previsto, fim_previsto)"
        )
        .eq("empresa_id", empresaId!)
        .gte("data", semana)
        .lte("data", fimSemana);
      if (error) throw error;
      return (data ?? []) as unknown as EscalaRow[];
    },
  });

  const mapa = useMemo(() => {
    const m = new Map<string, EscalaRow>();
    for (const e of escalas) m.set(`${e.funcionario_id}|${e.data}`, e);
    return m;
  }, [escalas]);

  const regras = {
    carga_semanal_max_horas: Number(settings?.carga_semanal_max_horas ?? 44),
    intervalo_minimo_horas: Number(settings?.intervalo_minimo_horas ?? 11),
  };

  const alertas = useMemo(() => {
    const entrada: EscalaComBlocos[] = escalas.map((e) => ({
      funcionario_id: e.funcionario_id,
      data: e.data,
      folga: e.folga,
      blocos: e.restaurant_escala_blocos.map((b) => ({
        inicio_previsto: b.inicio_previsto,
        fim_previsto: b.fim_previsto,
        turno_nome_snapshot: b.turno_nome_snapshot,
      })),
    }));
    return analisarJornada(entrada, regras);
  }, [escalas, regras.carga_semanal_max_horas, regras.intervalo_minimo_horas]);

  const alertasPorFuncionario = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of alertas) {
      if (!a.funcionario_id) continue;
      m.set(a.funcionario_id, (m.get(a.funcionario_id) ?? 0) + 1);
    }
    return m;
  }, [alertas]);

  const abrirCelula = (funcionarioId: string, data: string) => {
    if (!podeEditar) return;
    const atual = mapa.get(`${funcionarioId}|${data}`);
    setSelTurnos(atual?.restaurant_escala_blocos.map((b) => b.turno_id!).filter(Boolean) ?? []);
    setFolga(atual?.folga ?? false);
    setCelula({ funcionarioId, data });
  };

  const salvarCelula = useMutation({
    mutationFn: async () => {
      if (!celula || !empresaId) return;
      const { funcionarioId, data } = celula;
      const existente = mapa.get(`${funcionarioId}|${data}`);
      let escalaId = existente?.id;

      if (escalaId) {
        const { error } = await supabase
          .from("restaurant_escalas")
          .update({ folga, editado_manualmente: true, origem: "manual" })
          .eq("id", escalaId);
        if (error) throw error;
      } else {
        const { data: inserida, error } = await supabase
          .from("restaurant_escalas")
          .insert({
            empresa_id: empresaId,
            funcionario_id: funcionarioId,
            data,
            folga,
            origem: "manual",
            editado_manualmente: true,
            status: "rascunho",
            criado_por: perfil?.id,
          })
          .select("id")
          .single();
        if (error) throw error;
        escalaId = inserida.id;
      }

      await supabase.from("restaurant_escala_blocos").delete().eq("escala_id", escalaId!);

      if (!folga && selTurnos.length > 0) {
        const linhas = selTurnos
          .map((id) => turnos.find((t) => t.id === id))
          .filter((t): t is TurnoDef & { cor: string } => !!t)
          .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
          .map((t, idx) => ({
            empresa_id: empresaId,
            escala_id: escalaId!,
            ...blocoDeTurno(data, t, idx + 1),
          }));
        const { error } = await supabase.from("restaurant_escala_blocos").insert(linhas);
        if (error) throw error;
      }

      await supabase.from("restaurant_ajustes_escala").insert({
        empresa_id: empresaId,
        escala_id: escalaId!,
        funcionario_id: funcionarioId,
        tipo: existente ? "edicao_manual" : "criacao_manual",
        actor_id: perfil?.id,
        old_value: existente
          ? { folga: existente.folga, turnos: existente.restaurant_escala_blocos.map((b) => b.turno_nome_snapshot) }
          : null,
        new_value: { folga, turnos: selTurnos },
      });
    },
    onSuccess: () => {
      setCelula(null);
      qc.invalidateQueries({ queryKey: ["restaurant-escalas", empresaId, semana] });
      toast({ title: "Escala atualizada" });
    },
    onError: (e: Error) =>
      toast({ title: "Não foi possível salvar", description: e.message, variant: "destructive" }),
  });

  const aplicarModelo = useMutation({
    mutationFn: async () => {
      if (!modeloId || !empresaId) throw new Error("Selecione um modelo.");
      const { data: itens, error } = await supabase
        .from("restaurant_modelo_escala_itens")
        .select("id, funcionario_id, dia_semana, turno_id, ordem, folga")
        .eq("modelo_id", modeloId);
      if (error) throw error;

      const projecao = projetarModelo({
        itens: (itens ?? []).filter((i) => i.funcionario_id) as ModeloItem[],
        turnos,
        inicio: semana,
        fim: fimSemana,
        existentes: escalas.map((e) => ({
          funcionario_id: e.funcionario_id,
          data: e.data,
          status: e.status as "rascunho" | "publicada" | "cancelada",
          editado_manualmente: e.editado_manualmente,
        })),
      });

      for (const alvo of [...projecao.criar, ...projecao.atualizar]) {
        const existente = mapa.get(`${alvo.funcionario_id}|${alvo.data}`);
        let escalaId = existente?.id;
        if (escalaId) {
          await supabase
            .from("restaurant_escalas")
            .update({ folga: alvo.folga, origem: "modelo", modelo_id: modeloId })
            .eq("id", escalaId);
          await supabase.from("restaurant_escala_blocos").delete().eq("escala_id", escalaId);
        } else {
          const { data: nova, error: insErr } = await supabase
            .from("restaurant_escalas")
            .insert({
              empresa_id: empresaId,
              funcionario_id: alvo.funcionario_id,
              data: alvo.data,
              folga: alvo.folga,
              origem: "modelo",
              modelo_id: modeloId,
              status: "rascunho",
              criado_por: perfil?.id,
            })
            .select("id")
            .single();
          if (insErr) throw insErr;
          escalaId = nova.id;
        }
        if (alvo.blocos.length > 0) {
          const { error: bErr } = await supabase.from("restaurant_escala_blocos").insert(
            alvo.blocos.map((b) => ({ empresa_id: empresaId, escala_id: escalaId!, ...b }))
          );
          if (bErr) throw bErr;
        }
      }
      return projecao;
    },
    onSuccess: (p) => {
      setAplicarOpen(false);
      qc.invalidateQueries({ queryKey: ["restaurant-escalas", empresaId, semana] });
      toast({
        title: "Modelo aplicado",
        description: `${p!.criar.length} criada(s), ${p!.atualizar.length} atualizada(s), ${p!.preservadas.length} preservada(s) por já estarem publicadas ou editadas manualmente.`,
      });
    },
    onError: (e: Error) =>
      toast({ title: "Não foi possível aplicar", description: e.message, variant: "destructive" }),
  });

  const salvarComoModelo = useMutation({
    mutationFn: async () => {
      if (!empresaId) return;
      if (escalas.length === 0) throw new Error("Monte a semana antes de salvar como modelo.");
      const nomeModelo = `Semana de ${fmt(semana)}`;
      const { data: modelo, error } = await supabase
        .from("restaurant_modelos_escala")
        .insert({
          empresa_id: empresaId,
          nome: nomeModelo,
          vigencia_inicio: semana,
          status: "ativo",
          criado_por: perfil?.id,
        })
        .select("id")
        .single();
      if (error) throw error;

      const itens = escalas.flatMap((e) => {
        const dow = new Date(`${e.data}T00:00:00Z`).getUTCDay();
        if (e.folga || e.restaurant_escala_blocos.length === 0) {
          return [
            {
              empresa_id: empresaId,
              modelo_id: modelo.id,
              funcionario_id: e.funcionario_id,
              dia_semana: dow,
              turno_id: null,
              ordem: 1,
              folga: true,
            },
          ];
        }
        return e.restaurant_escala_blocos
          .sort((a, b) => a.ordem - b.ordem)
          .map((b, idx) => ({
            empresa_id: empresaId,
            modelo_id: modelo.id,
            funcionario_id: e.funcionario_id,
            dia_semana: dow,
            turno_id: b.turno_id,
            ordem: idx + 1,
            folga: false,
          }));
      });

      const { error: itErr } = await supabase.from("restaurant_modelo_escala_itens").insert(itens);
      if (itErr) throw itErr;
      return nomeModelo;
    },
    onSuccess: (n) => {
      qc.invalidateQueries({ queryKey: ["restaurant-modelos", empresaId] });
      toast({ title: "Modelo criado", description: `"${n}" pode ser aplicado em outras semanas.` });
    },
    onError: (e: Error) =>
      toast({ title: "Não foi possível criar o modelo", description: e.message, variant: "destructive" }),
  });

  const publicar = useMutation({

    mutationFn: async () => {
      if (!empresaId) return;
      const ids = escalas.filter((e) => e.status !== "publicada").map((e) => e.id);
      if (ids.length === 0) throw new Error("Nenhuma escala em rascunho nesta semana.");
      const { error } = await supabase
        .from("restaurant_escalas")
        .update({
          status: "publicada",
          publicado_em: new Date().toISOString(),
          publicado_por: perfil?.id,
        })
        .in("id", ids);
      if (error) throw error;
      await supabase.from("restaurant_ajustes_escala").insert({
        empresa_id: empresaId,
        tipo: "publicacao",
        actor_id: perfil?.id,
        new_value: { semana, total: ids.length },
      });
      return ids.length;
    },
    onSuccess: (n) => {
      qc.invalidateQueries({ queryKey: ["restaurant-escalas", empresaId, semana] });
      toast({ title: `${n} escala(s) publicada(s)`, description: "Os colaboradores já veem no portal." });
    },
    onError: (e: Error) =>
      toast({ title: "Não foi possível publicar", description: e.message, variant: "destructive" }),
  });

  const rascunhos = escalas.filter((e) => e.status !== "publicada").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Escala da semana</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {fmt(semana)} a {fmt(fimSemana)} · {escalas.length} escala(s), {rascunhos} em rascunho
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setSemana(addDias(semana, -7))} aria-label="Semana anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSemana(segundaDaSemana())}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={() => setSemana(addDias(semana, 7))} aria-label="Próxima semana">
            <ChevronRight className="h-4 w-4" />
          </Button>
          {podeEditar && (
            <>
              <Button variant="outline" className="gap-2" onClick={() => setAplicarOpen(true)}>
                <Wand2 className="h-4 w-4" /> Aplicar modelo
              </Button>
              <Button className="gap-2" onClick={() => publicar.mutate()} disabled={publicar.isPending || rascunhos === 0}>
                <Send className="h-4 w-4" /> Publicar semana
              </Button>
            </>
          )}
        </div>
      </div>

      {alertas.length > 0 && (
        <Card className="border-amber-300/70 bg-amber-50/60">
          <CardContent className="p-4 text-sm text-amber-900">
            {alertas.length} alerta(s) operacional(is) nesta semana conforme os limites configurados
            (carga {regras.carga_semanal_max_horas}h, intervalo {regras.intervalo_minimo_horas}h). Consulte a aba
            Conformidade para detalhes. Indicadores operacionais, não conclusões jurídicas.
          </CardContent>
        </Card>
      )}

      {turnos.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Cadastre turnos primeiro"
          description="A escala é montada a partir dos turnos ativos da operação."
        />
      ) : funcionarios.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Nenhum colaborador ativo" description="Cadastre colaboradores para montar a escala." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="sticky left-0 z-10 bg-muted/40 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Colaborador
                </th>
                {dias.map((d) => (
                  <th key={d} className="px-2 py-3 text-center text-xs font-semibold text-muted-foreground">
                    <span className="block">{DIAS[new Date(`${d}T00:00:00Z`).getUTCDay()]}</span>
                    <span className="block text-[11px] font-normal">{fmt(d)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {funcionarios.map((f) => (
                <tr key={f.id} className="border-b border-border/60 last:border-0">
                  <td className="sticky left-0 z-10 bg-card px-4 py-3">
                    <p className="font-medium leading-tight">{f.nome}</p>
                    <p className="text-[11px] text-muted-foreground">{f.cargo}</p>
                    {(alertasPorFuncionario.get(f.id) ?? 0) > 0 && (
                      <span className="mt-1 inline-block text-[10px] font-medium text-amber-600">
                        {alertasPorFuncionario.get(f.id)} alerta(s)
                      </span>
                    )}
                  </td>
                  {dias.map((d) => {
                    const e = mapa.get(`${f.id}|${d}`);
                    return (
                      <td key={d} className="p-1.5 align-top">
                        <button
                          type="button"
                          onClick={() => abrirCelula(f.id, d)}
                          disabled={!podeEditar}
                          className="flex min-h-[58px] w-full flex-col gap-1 rounded-lg border border-dashed border-border/70 p-1.5 text-left transition-colors hover:border-border hover:bg-muted/50 disabled:cursor-default disabled:hover:bg-transparent"
                        >
                          {e?.folga && <Badge variant="secondary" className="w-fit text-[10px]">Folga</Badge>}
                          {e?.restaurant_escala_blocos
                            .sort((a, b) => a.ordem - b.ordem)
                            .map((b) => (
                              <span
                                key={b.id}
                                className="w-fit rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white"
                                style={{
                                  backgroundColor:
                                    turnos.find((t) => t.id === b.turno_id)?.cor ?? "#475569",
                                }}
                              >
                                {b.turno_nome_snapshot}
                              </span>
                            ))}
                          {e && e.status === "publicada" && (
                            <span className="text-[9px] uppercase tracking-wide text-emerald-600">publicada</span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {isLoading && <p className="p-4 text-sm text-muted-foreground">Carregando…</p>}
        </div>
      )}

      {/* Editar célula */}
      <Dialog open={!!celula} onOpenChange={(v) => !v && setCelula(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escala do dia</DialogTitle>
            <DialogDescription>
              {celula && `${funcionarios.find((f) => f.id === celula.funcionarioId)?.nome} · ${fmt(celula.data)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <label className="flex items-center gap-3 text-sm">
              <Switch checked={folga} onCheckedChange={(v) => { setFolga(v); if (v) setSelTurnos([]); }} />
              Marcar como folga
            </label>
            <div className="space-y-2">
              <Label>Turnos do dia</Label>
              {turnos.map((t) => (
                <label key={t.id} className="flex items-center gap-3 rounded-lg border border-border/70 p-2.5 text-sm">
                  <Checkbox
                    checked={selTurnos.includes(t.id)}
                    disabled={folga}
                    onCheckedChange={(v) =>
                      setSelTurnos((prev) => (v ? [...prev, t.id] : prev.filter((id) => id !== t.id)))
                    }
                  />
                  <span className="h-4 w-1.5 rounded-full" style={{ backgroundColor: t.cor }} />
                  <span className="font-medium">{t.nome}</span>
                  <span className="text-xs text-muted-foreground">
                    {t.hora_inicio.slice(0, 5)}–{t.hora_fim.slice(0, 5)}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCelula(null)}>Cancelar</Button>
            <Button onClick={() => salvarCelula.mutate()} disabled={salvarCelula.isPending}>
              {salvarCelula.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Aplicar modelo */}
      <Dialog open={aplicarOpen} onOpenChange={setAplicarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aplicar modelo na semana</DialogTitle>
            <DialogDescription>
              A geração é idempotente: escalas já publicadas ou editadas manualmente são preservadas.
            </DialogDescription>
          </DialogHeader>
          {modelos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum modelo cadastrado ainda. Monte a semana manualmente e crie um modelo depois.
            </p>
          ) : (
            <Select value={modeloId} onValueChange={setModeloId}>
              <SelectTrigger><SelectValue placeholder="Selecione o modelo" /></SelectTrigger>
              <SelectContent>
                {modelos.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.nome} · v{m.versao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAplicarOpen(false)}>Cancelar</Button>
            <Button onClick={() => aplicarModelo.mutate()} disabled={aplicarModelo.isPending || !modeloId}>
              {aplicarModelo.isPending ? "Aplicando…" : "Aplicar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
