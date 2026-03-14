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

type Funcionario = Tables<"funcionarios">;

export default function Funcionarios() {
  const { perfil } = useAuth();
  const [data, setData] = useState<Funcionario[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", matricula: "", cargo: "", setor: "", telefone_whatsapp: "" });

  const load = () => {
    supabase.from("funcionarios").select("*").order("nome").then(({ data }) => {
      if (data) setData(data);
    });
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!perfil?.empresa_id) {
      toast.error("Perfil não carregado.");
      return;
    }
    const { error } = await supabase.from("funcionarios").insert({
      ...form,
      empresa_id: perfil.empresa_id,
    });
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Funcionário adicionado!");
    setForm({ nome: "", matricula: "", cargo: "", setor: "", telefone_whatsapp: "" });
    setOpen(false);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Funcionários</h1>
          <p className="text-sm text-muted-foreground">{data.length} registros</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1.5 h-4 w-4" /> Adicionar</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Funcionário</DialogTitle></DialogHeader>
            <div className="space-y-3">
              {(["nome", "matricula", "cargo", "setor", "telefone_whatsapp"] as const).map((field) => (
                <div key={field} className="space-y-1">
                  <Label className="capitalize">{field.replace("_", " ")}</Label>
                  <Input
                    value={form[field]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  />
                </div>
              ))}
              <Button onClick={handleAdd} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Matrícula</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cargo</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Setor</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">WhatsApp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((f) => (
              <tr key={f.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">{f.nome}</td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">{f.matricula}</td>
                <td className="px-4 py-3 text-foreground">{f.cargo}</td>
                <td className="px-4 py-3 text-foreground">{f.setor}</td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">{f.telefone_whatsapp || "—"}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nenhum funcionário cadastrado</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
