import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Building2, Users, HardHat, ChevronRight } from "lucide-react";
import SetorDetail from "@/components/SetorDetail";

interface Setor {
  id: string;
  nome: string;
  descricao: string | null;
  funcionarios_count: number;
  epis_count: number;
}

export default function Setores() {
  const { perfil } = useAuth();
  const [setores, setSetores] = useState<Setor[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedSetorId, setSelectedSetorId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", descricao: "" });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    // Load setores with counts
    const { data: setoresData } = await supabase
      .from("setores")
      .select("id, nome, descricao")
      .order("nome");

    if (!setoresData) return;

    // Get funcionarios count per setor
    const { data: funcData } = await supabase
      .from("funcionarios")
      .select("setor_id");

    // Get epis count per setor
    const { data: episData } = await supabase
      .from("setores_epis")
      .select("setor_id");

    const enriched: Setor[] = setoresData.map((s) => ({
      ...s,
      funcionarios_count: funcData?.filter((f) => f.setor_id === s.id).length || 0,
      epis_count: episData?.filter((e) => e.setor_id === s.id).length || 0,
    }));

    setSetores(enriched);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!perfil?.empresa_id || !form.nome.trim()) {
      toast.error("Preencha o nome do setor.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("setores").insert({
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || null,
      empresa_id: perfil.empresa_id,
    });
    setLoading(false);
    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }
    toast.success("Setor cadastrado!");
    setForm({ nome: "", descricao: "" });
    setOpen(false);
    load();
  };

  if (selectedSetorId) {
    const setor = setores.find((s) => s.id === selectedSetorId);
    return (
      <SetorDetail
        setorId={selectedSetorId}
        setorNome={setor?.nome || ""}
        onBack={() => {
          setSelectedSetorId(null);
          load();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Setores</h1>
          <p className="text-sm text-muted-foreground">
            Matriz de risco — {setores.length} setores cadastrados
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1.5 h-4 w-4" /> Novo Setor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Setor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Nome do Setor</Label>
                <Input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Ex: Produção, Administrativo..."
                />
              </div>
              <div className="space-y-1">
                <Label>Descrição</Label>
                <Textarea
                  value={form.descricao}
                  onChange={(e) =>
                    setForm({ ...form, descricao: e.target.value })
                  }
                  placeholder="Descrição opcional do setor"
                  rows={3}
                />
              </div>
              <Button onClick={handleAdd} disabled={loading} className="w-full">
                {loading ? "Salvando..." : "Cadastrar Setor"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Setor
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Funcionários
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                EPIs Obrigatórios
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {setores.map((s) => (
              <tr
                key={s.id}
                className="hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => setSelectedSetorId(s.id)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{s.nome}</p>
                      {s.descricao && (
                        <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                          {s.descricao}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" />
                    {s.funcionarios_count}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="gap-1">
                    <HardHat className="h-3 w-3" />
                    {s.epis_count}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <ChevronRight className="h-4 w-4 text-muted-foreground inline" />
                </td>
              </tr>
            ))}
            {setores.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Nenhum setor cadastrado. Crie o primeiro setor para montar sua
                  matriz de risco.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
