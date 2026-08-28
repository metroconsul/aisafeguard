import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, Pencil, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { canManageRestaurant } from "@/lib/product-access";
import { duracaoTurnoHoras, turnosSobrepostos, validarTurno, type TurnoDef } from "@/lib/escala/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/EmptyState";

interface Turno extends TurnoDef {
  cor: string;
  ativo: boolean;
}

const vazio = { nome: "", hora_inicio: "10:00", hora_fim: "15:00", cruza_meia_noite: false, cor: "#2563EB" };

export default function RestaurantTurnos() {
  const { perfil } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const empresaId = perfil?.empresa_id;
  const podeEditar = canManageRestaurant(perfil?.role);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(vazio);

  const { data: turnos = [], isLoading } = useQuery({
    queryKey: ["restaurant-turnos", empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurant_turnos")
        .select("id, nome, hora_inicio, hora_fim, cruza_meia_noite, cor, ativo")
        .eq("empresa_id", empresaId!)
        .order("hora_inicio");
      if (error) throw error;
      return (data ?? []) as unknown as Turno[];
    },
  });

  const salvar = useMutation({
    mutationFn: async () => {
      const erros = validarTurno(form);
      if (erros.length) throw new Error(erros[0]);
      const payload = {
        empresa_id: empresaId!,
        nome: form.nome.trim(),
        hora_inicio: form.hora_inicio,
        hora_fim: form.hora_fim,
        cruza_meia_noite: form.cruza_meia_noite,
        cor: form.cor,
        criado_por: perfil?.id,
      };
      if (editId) {
        const { error } = await supabase.from("restaurant_turnos").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("restaurant_turnos").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: editId ? "Turno atualizado" : "Turno criado" });
      setOpen(false);
      setEditId(null);
      setForm(vazio);
      qc.invalidateQueries({ queryKey: ["restaurant-turnos", empresaId] });
    },
    onError: (e: Error) =>
      toast({ title: "Não foi possível salvar", description: e.message, variant: "destructive" }),
  });

  const alternarAtivo = useMutation({
    mutationFn: async (t: Turno) => {
      const { error } = await supabase.from("restaurant_turnos").update({ ativo: !t.ativo }).eq("id", t.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["restaurant-turnos", empresaId] }),
  });

  const abrirEdicao = (t: Turno) => {
    setEditId(t.id);
    setForm({
      nome: t.nome,
      hora_inicio: t.hora_inicio.slice(0, 5),
      hora_fim: t.hora_fim.slice(0, 5),
      cruza_meia_noite: t.cruza_meia_noite,
      cor: t.cor,
    });
    setOpen(true);
  };

  const sobrepostos = (t: Turno) =>
    turnos.filter((o) => o.id !== t.id && o.ativo && turnosSobrepostos(t, o)).map((o) => o.nome);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Turnos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Blocos reutilizáveis como Almoço, Jantar e Fechamento.
          </p>
        </div>
        {podeEditar && (
          <Button
            onClick={() => {
              setEditId(null);
              setForm(vazio);
              setOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> Novo turno
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : turnos.length === 0 ? (
        <EmptyState
          icon={Clock3}
          title="Nenhum turno cadastrado"
          description="Comece cadastrando os blocos de trabalho da operação."
          actionLabel={podeEditar ? "Novo turno" : undefined}
          onAction={podeEditar ? () => setOpen(true) : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {turnos.map((t) => {
            const conflitos = sobrepostos(t);
            return (
              <Card key={t.id} className={t.ativo ? "" : "opacity-60"}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="h-8 w-1.5 rounded-full" style={{ backgroundColor: t.cor }} />
                      <div>
                        <p className="font-semibold leading-tight">{t.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.hora_inicio.slice(0, 5)} – {t.hora_fim.slice(0, 5)}
                          {t.cruza_meia_noite && " (dia seguinte)"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{duracaoTurnoHoras(t).toFixed(1)}h</Badge>
                  </div>

                  {conflitos.length > 0 && (
                    <p className="text-[11px] text-amber-600">
                      Sobrepõe: {conflitos.join(", ")}
                    </p>
                  )}

                  {podeEditar && (
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Switch checked={t.ativo} onCheckedChange={() => alternarAtivo.mutate(t)} />
                        {t.ativo ? "Ativo" : "Inativo"}
                      </label>
                      <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => abrirEdicao(t)}>
                        <Pencil className="h-3.5 w-3.5" /> Editar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Editar turno" : "Novo turno"}</DialogTitle>
            <DialogDescription>
              Turnos que terminam no dia seguinte devem ser marcados como cruzando a meia-noite.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Almoço"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ini">Início</Label>
                <Input id="ini" type="time" value={form.hora_inicio} onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fim">Fim</Label>
                <Input id="fim" type="time" value={form.hora_fim} onChange={(e) => setForm({ ...form, hora_fim: e.target.value })} />
              </div>
            </div>
            <label className="flex items-center gap-3 text-sm">
              <Switch
                checked={form.cruza_meia_noite}
                onCheckedChange={(v) => setForm({ ...form, cruza_meia_noite: v })}
              />
              Termina no dia seguinte (cruza meia-noite)
            </label>
            <div className="space-y-1.5">
              <Label htmlFor="cor">Cor</Label>
              <Input id="cor" type="color" value={form.cor} onChange={(e) => setForm({ ...form, cor: e.target.value })} className="h-10 w-24 p-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
              {salvar.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
