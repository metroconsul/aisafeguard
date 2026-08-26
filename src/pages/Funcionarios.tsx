import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import FuncionarioKanbanCard from "@/components/funcionarios/FuncionarioKanbanCard";

interface Funcionario {
  id: string;
  nome: string;
  matricula: string;
  cargo: string;
  setor: string;
  setor_id: string | null;
  telefone_whatsapp: string | null;
  cpf: string | null;
  setor_obj?: { nome: string } | null;
}

interface Setor {
  id: string;
  nome: string;
}

export default function Funcionarios() {
  const { perfil } = useAuth();
  const [data, setData] = useState<Funcionario[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ nome: "", matricula: "", cargo: "", setor: "", setor_id: "", telefone_whatsapp: "", cpf: "" });

  const load = () => {
    supabase.from("funcionarios").select("*, setores:setor_id(nome)").order("nome").then(({ data }) => {
      if (data) setData(data.map((f: any) => ({ ...f, setor_obj: f.setores })));
    });
    supabase.from("setores").select("id, nome").order("nome").then(({ data }) => {
      if (data) setSetores(data);
    });
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!perfil?.empresa_id) {
      toast.error("Perfil não carregado.");
      return;
    }
    const { setor_id, ...rest } = form;
    const { error } = await supabase.from("funcionarios").insert({
      ...rest,
      setor_id: setor_id || null,
      empresa_id: perfil.empresa_id,
    });
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Funcionário adicionado!");
    setForm({ nome: "", matricula: "", cargo: "", setor: "", setor_id: "", telefone_whatsapp: "", cpf: "" });
    setOpen(false);
    load();
  };

  const colunas = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? data.filter((f) =>
          [f.nome, f.matricula, f.cargo, f.setor_obj?.nome, f.setor]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q)),
        )
      : data;

    const cols = setores.map((s) => ({
      id: s.id,
      nome: s.nome,
      funcionarios: filtered.filter((f) => f.setor_id === s.id),
    }));
    const semSetor = filtered.filter((f) => !f.setor_id);
    if (semSetor.length > 0 || setores.length === 0) {
      cols.push({ id: "__none__", nome: "Sem setor", funcionarios: semSetor });
    }
    return cols;
  }, [data, setores, query]);

  return (
    <div className="mx-auto max-w-[1500px]">
      <div>
        <p className="app-eyebrow">Cadastro e operação</p>
        <h1 className="mt-1 text-[26px] font-bold tracking-tight text-foreground">Funcionários</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.length} {data.length === 1 ? "registro" : "registros"} · {setores.length} {setores.length === 1 ? "setor" : "setores"}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="group relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/65 transition-colors group-focus-within:text-primary" strokeWidth={1.8} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar funcionário..."
            className="h-10 w-full rounded-lg border border-border/80 bg-card py-2.5 pl-10 pr-4 text-sm text-foreground shadow-card outline-none transition-all placeholder:text-muted-foreground/65 focus:border-secondary/60 focus:ring-2 focus:ring-secondary/15"
          />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-600 hover:shadow-md active:scale-[0.98]">
              <Plus className="h-4 w-4" /> Novo Funcionário
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-lg">
            <DialogHeader><DialogTitle>Novo Funcionário</DialogTitle></DialogHeader>
            <div className="space-y-3">
              {(["nome", "matricula", "cargo", "telefone_whatsapp", "cpf"] as const).map((field) => (
                <div key={field} className="space-y-1">
                  <Label className="capitalize">{field.replace(/_/g, " ")}</Label>
                  <Input
                    value={form[field]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  />
                </div>
              ))}
              <div className="space-y-1">
                <Label>Setor</Label>
                <Select value={form.setor_id} onValueChange={(v) => setForm({ ...form, setor_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
                  <SelectContent>
                    {setores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAdd} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 flex w-full gap-4 overflow-x-auto pb-8 pt-2">
        {colunas.map((col) => (
          <div
            key={col.id}
            className="flex min-h-[360px] max-h-[calc(100vh-280px)] min-w-[320px] max-w-[320px] flex-col rounded-lg border border-border/80 bg-card shadow-card"
          >
            <div className="flex items-center justify-between border-b border-border/80 px-4 py-4">
              <h2 className="text-xs font-bold uppercase tracking-[0.1em] text-foreground">{col.nome}</h2>
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-xs font-bold tabular-nums text-muted-foreground">
                {col.funcionarios.length}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
              {col.funcionarios.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border/80 px-3 py-8 text-center text-xs text-muted-foreground">Nenhum funcionário neste setor</p>
              ) : (
                col.funcionarios.map((f) => (
                  <FuncionarioKanbanCard
                    key={f.id}
                    id={f.id}
                    nome={f.nome}
                    matricula={f.matricula}
                    cargo={f.cargo}
                    telefone_whatsapp={f.telefone_whatsapp}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
