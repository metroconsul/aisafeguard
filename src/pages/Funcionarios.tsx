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
    <div>
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Funcionários</h1>
        <p className="text-sm text-gray-500 mt-1">
          {data.length} {data.length === 1 ? "registro" : "registros"} · {setores.length} {setores.length === 1 ? "setor" : "setores"}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-6">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar funcionário..."
            className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-4 py-3 shadow-sm text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-200 transition-colors">
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

      <div className="mt-6 flex gap-6 overflow-x-auto pb-8 pt-4 w-full">
        {colunas.map((col) => (
          <div
            key={col.id}
            className="min-w-[320px] max-w-[320px] bg-slate-100/70 border border-slate-200 rounded-2xl flex flex-col max-h-[calc(100vh-280px)]"
          >
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{col.nome}</h2>
              <span className="bg-slate-200 text-gray-600 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                {col.funcionarios.length}
              </span>
            </div>
            <div className="p-4 flex flex-col gap-4 flex-1 overflow-y-auto">
              {col.funcionarios.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">Nenhum funcionário</p>
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
