import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Check, X } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Epi = Tables<"epis">;

export default function Epis() {
  const { user, perfil, loading } = useAuth();
  const [data, setData] = useState<Epi[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome_equipamento: "", numero_ca: "", dias_validade: "", quantidade_estoque: "" });
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingStockValue, setEditingStockValue] = useState("");

  const isAlmoxarifado = perfil?.role === "almoxarifado";
  const canAddEpi = !isAlmoxarifado;

  const load = useCallback(async () => {
    if (!user || !perfil?.empresa_id) return;

    const { data, error } = await supabase
      .from("epis")
      .select("*")
      .eq("empresa_id", perfil.empresa_id)
      .order("nome_equipamento");

    if (error) {
      toast.error("Falha ao carregar EPIs: " + error.message);
      return;
    }

    setData(data || []);
  }, [user, perfil?.empresa_id]);

  useEffect(() => {
    if (loading || !user || !perfil?.empresa_id) {
      setData([]);
      return;
    }

    void load();

    const channel = supabase
      .channel(`epis-realtime-${perfil.empresa_id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "epis",
          filter: `empresa_id=eq.${perfil.empresa_id}`,
        },
        () => { load(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loading, user, perfil?.empresa_id, load]);

  const handleAdd = async () => {
    if (!perfil?.empresa_id) {
      toast.error("Perfil não carregado.");
      return;
    }
    const { error } = await supabase.from("epis").insert({
      nome_equipamento: form.nome_equipamento,
      numero_ca: form.numero_ca,
      dias_validade: parseInt(form.dias_validade) || 0,
      quantidade_estoque: parseInt(form.quantidade_estoque) || 0,
      empresa_id: perfil.empresa_id,
    });
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("EPI adicionado!");
    setForm({ nome_equipamento: "", numero_ca: "", dias_validade: "", quantidade_estoque: "" });
    setOpen(false);
    await load();
  };

  const handleUpdateStock = async (epiId: string) => {
    const qty = parseInt(editingStockValue);
    if (isNaN(qty) || qty < 0) {
      toast.error("Quantidade inválida");
      return;
    }
    const { error } = await supabase
      .from("epis")
      .update({ quantidade_estoque: qty })
      .eq("id", epiId);
    if (error) { toast.error("Erro ao atualizar estoque: " + error.message); return; }
    toast.success("Estoque atualizado!");
    setEditingStockId(null);
    await load();
  };

  const startEditStock = (epi: Epi) => {
    setEditingStockId(epi.id);
    setEditingStockValue(String(epi.quantidade_estoque ?? 0));
  };

  const cancelEditStock = () => {
    setEditingStockId(null);
    setEditingStockValue("");
  };

  const renderStockCell = (epi: Epi) => {
    if (editingStockId === epi.id) {
      return (
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min={0}
            value={editingStockValue}
            onChange={(e) => setEditingStockValue(e.target.value)}
            className="h-8 w-20 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleUpdateStock(epi.id);
              if (e.key === "Escape") cancelEditStock();
            }}
            autoFocus
          />
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleUpdateStock(epi.id)}>
            <Check className="h-3.5 w-3.5 text-success" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEditStock}>
            <X className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5">
        <span>{epi.quantidade_estoque}</span>
        {isAlmoxarifado && (
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEditStock(epi)}>
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">EPIs</h1>
          <p className="text-sm text-muted-foreground">{data.length} equipamentos cadastrados</p>
        </div>
        {canAddEpi && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto"><Plus className="mr-1.5 h-4 w-4" /> Adicionar</Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-lg">
              <DialogHeader><DialogTitle>Novo EPI</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Nome do Equipamento</Label>
                  <Input value={form.nome_equipamento} onChange={(e) => setForm({ ...form, nome_equipamento: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Número CA</Label>
                  <Input value={form.numero_ca} onChange={(e) => setForm({ ...form, numero_ca: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Dias de Validade</Label>
                    <Input type="number" value={form.dias_validade} onChange={(e) => setForm({ ...form, dias_validade: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Estoque</Label>
                    <Input type="number" value={form.quantidade_estoque} onChange={(e) => setForm({ ...form, quantidade_estoque: e.target.value })} />
                  </div>
                </div>
                <Button onClick={handleAdd} className="w-full">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Mobile: card layout */}
      <div className="block sm:hidden space-y-3">
        {data.map((e) => (
          <div key={e.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
            <p className="font-medium text-foreground">{e.nome_equipamento}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
              <span>CA: {e.numero_ca}</span>
              <span>Validade: {e.dias_validade} dias</span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              <span className="mr-1">Estoque:</span>
              {renderStockCell(e)}
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">Nenhum EPI cadastrado</p>
        )}
      </div>

      {/* Desktop: table layout */}
      <div className="hidden sm:block rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Equipamento</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">CA</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Validade (dias)</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estoque</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((e) => (
                <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{e.nome_equipamento}</td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{e.numero_ca}</td>
                  <td className="px-4 py-3 tabular-nums text-foreground">{e.dias_validade}</td>
                  <td className="px-4 py-3 tabular-nums text-foreground">{renderStockCell(e)}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Nenhum EPI cadastrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
