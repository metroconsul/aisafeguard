import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Epi = Tables<"epis">;

export default function Epis() {
  const { perfil } = useAuth();
  const [data, setData] = useState<Epi[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome_equipamento: "", numero_ca: "", dias_validade: "", quantidade_estoque: "" });

  const load = () => {
    supabase.from("epis").select("*").order("nome_equipamento").then(({ data }) => {
      if (data) setData(data);
    });
  };

  useEffect(() => {
    load();

    const channel = supabase
      .channel("epis-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "epis" },
        () => { load(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

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
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">EPIs</h1>
          <p className="text-sm text-muted-foreground">{data.length} equipamentos cadastrados</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1.5 h-4 w-4" /> Adicionar</Button>
          </DialogTrigger>
          <DialogContent>
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
              <div className="space-y-1">
                <Label>Dias de Validade</Label>
                <Input type="number" value={form.dias_validade} onChange={(e) => setForm({ ...form, dias_validade: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Quantidade em Estoque</Label>
                <Input type="number" value={form.quantidade_estoque} onChange={(e) => setForm({ ...form, quantidade_estoque: e.target.value })} />
              </div>
              <Button onClick={handleAdd} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <table className="w-full text-sm">
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
                <td className="px-4 py-3 tabular-nums text-foreground">{e.quantidade_estoque}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Nenhum EPI cadastrado</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
