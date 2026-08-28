import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Repeat } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { canManageRestaurant } from "@/lib/product-access";
import { REGIME_PRESETS } from "@/lib/escala/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type Tipo = "6x1" | "5x2" | "12x36" | "personalizado";

interface Regime {
  id: string;
  nome: string;
  tipo: Tipo;
  dias_trabalho: number;
  dias_folga: number;
  carga_semanal_horas: number;
  intervalo_minimo_horas: number;
  ciclo_dias: number | null;
  origem_regra: string;
  observacao: string | null;
  ativo: boolean;
}

const base = {
  nome: "",
  tipo: "5x2" as Tipo,
  dias_trabalho: 5,
  dias_folga: 2,
  carga_semanal_horas: 44,
  intervalo_minimo_horas: 11,
  ciclo_dias: 7,
  origem_regra: "configuracao_empresa",
  observacao: "",
};

export default function RestaurantRegimes() {
  const { perfil } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const empresaId = perfil?.empresa_id;
  const podeEditar = canManageRestaurant(perfil?.role);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(base);

  const { data: regimes = [], isLoading } = useQuery({
    queryKey: ["restaurant-regimes", empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurant_regimes")
        .select("*")
        .eq("empresa_id", empresaId!)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as Regime[];
    },
  });

  const aplicarPreset = (tipo: Tipo) => {
    if (tipo === "personalizado") {
      setForm((f) => ({ ...f, tipo }));
      return;
    }
    const p = REGIME_PRESETS[tipo];
    setForm((f) => ({
      ...f,
      tipo,
      nome: f.nome || tipo,
      dias_trabalho: p.dias_trabalho,
      dias_folga: p.dias_folga,
      carga_semanal_horas: p.carga_semanal_horas,
      intervalo_minimo_horas: p.intervalo_minimo_horas,
      ciclo_dias: p.ciclo_dias ?? 7,
    }));
  };

  const salvar = useMutation({
    mutationFn: async () => {
      if (!form.nome.trim()) throw new Error("Informe o nome do regime.");
      const payload = { ...form, nome: form.nome.trim(), empresa_id: empresaId!, criado_por: perfil?.id };
      if (editId) {
        const { error } = await supabase.from("restaurant_regimes").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("restaurant_regimes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: editId ? "Regime atualizado" : "Regime criado" });
      setOpen(false);
      setEditId(null);
      setForm(base);
      qc.invalidateQueries({ queryKey: ["restaurant-regimes", empresaId] });
    },
    onError: (e: Error) =>
      toast({ title: "Não foi possível salvar", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Regimes de jornada</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Parâmetros configuráveis por empresa. Os valores sugeridos não substituem a análise de um
            profissional habilitado.
          </p>
        </div>
        {podeEditar && (
          <Button
            className="gap-2"
            onClick={() => {
              setEditId(null);
              setForm(base);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Novo regime
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : regimes.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="Nenhum regime configurado"
          description="Configure 6x1, 5x2, 12x36 ou um regime personalizado da sua operação."
          actionLabel={podeEditar ? "Novo regime" : undefined}
          onAction={podeEditar ? () => setOpen(true) : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {regimes.map((r) => (
            <Card key={r.id} className={r.ativo ? "" : "opacity-60"}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{r.nome}</p>
                    <p className="text-xs text-muted-foreground">Origem: {r.origem_regra}</p>
                  </div>
                  <Badge variant="secondary">{r.tipo}</Badge>
                </div>
                <dl className="grid grid-cols-2 gap-2 text-xs">
                  <div><dt className="text-muted-foreground">Trabalho</dt><dd className="font-medium">{r.dias_trabalho} dia(s)</dd></div>
                  <div><dt className="text-muted-foreground">Folga</dt><dd className="font-medium">{r.dias_folga} dia(s)</dd></div>
                  <div><dt className="text-muted-foreground">Carga semanal</dt><dd className="font-medium">{r.carga_semanal_horas}h</dd></div>
                  <div><dt className="text-muted-foreground">Intervalo mínimo</dt><dd className="font-medium">{r.intervalo_minimo_horas}h</dd></div>
                </dl>
                {podeEditar && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditId(r.id);
                      setForm({
                        nome: r.nome,
                        tipo: r.tipo,
                        dias_trabalho: r.dias_trabalho,
                        dias_folga: r.dias_folga,
                        carga_semanal_horas: Number(r.carga_semanal_horas),
                        intervalo_minimo_horas: Number(r.intervalo_minimo_horas),
                        ciclo_dias: r.ciclo_dias ?? 7,
                        origem_regra: r.origem_regra,
                        observacao: r.observacao ?? "",
                      });
                      setOpen(true);
                    }}
                  >
                    Editar
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Editar regime" : "Novo regime"}</DialogTitle>
            <DialogDescription>
              Escolha um modelo como ponto de partida e ajuste os parâmetros da sua operação.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Modelo</Label>
              <Select value={form.tipo} onValueChange={(v) => aplicarPreset(v as Tipo)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="6x1">6x1</SelectItem>
                  <SelectItem value="5x2">5x2</SelectItem>
                  <SelectItem value="12x36">12x36</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rnome">Nome</Label>
              <Input id="rnome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Salão 5x2" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Dias de trabalho</Label>
                <Input type="number" min={1} value={form.dias_trabalho} onChange={(e) => setForm({ ...form, dias_trabalho: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Dias de folga</Label>
                <Input type="number" min={0} value={form.dias_folga} onChange={(e) => setForm({ ...form, dias_folga: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Carga semanal (h)</Label>
                <Input type="number" min={1} value={form.carga_semanal_horas} onChange={(e) => setForm({ ...form, carga_semanal_horas: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Intervalo mínimo (h)</Label>
                <Input type="number" min={0} value={form.intervalo_minimo_horas} onChange={(e) => setForm({ ...form, intervalo_minimo_horas: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Ciclo (dias)</Label>
                <Input type="number" min={1} value={form.ciclo_dias} onChange={(e) => setForm({ ...form, ciclo_dias: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Origem da regra</Label>
                <Input value={form.origem_regra} onChange={(e) => setForm({ ...form, origem_regra: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Observação</Label>
              <Input value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} />
            </div>
            {editId && (
              <label className="flex items-center gap-3 text-sm">
                <Switch
                  checked
                  disabled
                />
                Regimes não são excluídos: desative pela lista quando necessário.
              </label>
            )}
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
