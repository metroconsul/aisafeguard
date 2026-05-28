import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { triggerWebhook } from "@/lib/webhook";
import { toast } from "sonner";
import {
  Search, Check, Send, CheckCircle2, Copy, ExternalLink,
  HardHat, Glasses, Hand, Footprints, Shield, ShieldCheck,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface Funcionario { id: string; nome: string; telefone_whatsapp: string | null; }
interface Epi { id: string; nome_equipamento: string; numero_ca: string; dias_validade: number; }

const OBRAS = [
  { value: "Sede", label: "Sede" },
  { value: "Filial", label: "Filial" },
  { value: "Campo / Obra Externa", label: "Campo / Obra Externa" },
];

function iconForEpi(nome: string) {
  const n = nome.toLowerCase();
  if (n.includes("capacete")) return HardHat;
  if (n.includes("óculos") || n.includes("oculos")) return Glasses;
  if (n.includes("luva")) return Hand;
  if (n.includes("bota") || n.includes("calçado") || n.includes("calcado")) return Footprints;
  return Shield;
}

function SearchCombobox({
  label, placeholder, items, value, onChange,
}: {
  label: string;
  placeholder: string;
  items: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = items.find((i) => i.value === value);
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-full bg-slate-50 border border-slate-200 text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm font-medium flex items-center gap-2 outline-none"
          >
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <span className={cn("truncate", !selected && "text-gray-400 font-normal")}>
              {selected ? selected.label : placeholder}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
          <Command>
            <CommandInput placeholder={placeholder} />
            <CommandList>
              <CommandEmpty>Nenhum resultado.</CommandEmpty>
              <CommandGroup>
                {items.map((it) => (
                  <CommandItem
                    key={it.value}
                    value={it.label}
                    onSelect={() => { onChange(it.value); setOpen(false); }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === it.value ? "opacity-100 text-indigo-600" : "opacity-0")} />
                    {it.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default function NovaEntrega() {
  const { perfil } = useAuth();
  const navigate = useNavigate();
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [epis, setEpis] = useState<Epi[]>([]);
  const [funcId, setFuncId] = useState("");
  const [obra, setObra] = useState("");
  const [selectedEpis, setSelectedEpis] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [geradas, setGeradas] = useState<{ epiNome: string; link: string }[]>([]);

  useEffect(() => {
    if (!perfil?.empresa_id) return;
    supabase.from("funcionarios").select("id, nome, telefone_whatsapp")
      .eq("empresa_id", perfil.empresa_id).order("nome")
      .then(({ data }) => { if (data) setFuncionarios(data); });
    supabase.from("epis").select("id, nome_equipamento, numero_ca, dias_validade")
      .eq("empresa_id", perfil.empresa_id).order("nome_equipamento")
      .then(({ data }) => { if (data) setEpis(data); });
  }, [perfil?.empresa_id]);

  const funcItems = useMemo(() => funcionarios.map((f) => ({ value: f.id, label: f.nome })), [funcionarios]);
  const selectedFunc = funcionarios.find((f) => f.id === funcId);

  const toggleEpi = (id: string) => {
    setSelectedEpis((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!funcId) return toast.error("Selecione um funcionário.");
    if (!obra) return toast.error("Selecione uma obra.");
    if (selectedEpis.size === 0) return toast.error("Selecione ao menos um EPI.");
    if (!perfil?.empresa_id || !selectedFunc) return;
    setLoading(true);

    const results: { epiNome: string; link: string }[] = [];
    for (const epiId of selectedEpis) {
      const epi = epis.find((e) => e.id === epiId);
      if (!epi) continue;
      const dataVencimento = new Date();
      dataVencimento.setDate(dataVencimento.getDate() + epi.dias_validade);

      const { data, error } = await supabase
        .from("entregas")
        .insert({
          funcionario_id: funcId,
          epi_id: epiId,
          data_vencimento: dataVencimento.toISOString(),
          empresa_id: perfil.empresa_id,
        })
        .select().single();

      if (error || !data) {
        toast.error(`Erro ao registrar ${epi.nome_equipamento}`);
        continue;
      }
      // Sempre usa o domínio público para que o funcionário acesse pelo celular sem login Lovable
      const PUBLIC_BASE_URL = "https://aisafeguard.lovable.app";
      const linkAssinatura = `${PUBLIC_BASE_URL}/assinar/${data.id}`;
      // Envia link do Portal do Colaborador (com redirect para a tela de EPIs após login)
      const linkPortal = `${PUBLIC_BASE_URL}/portal/login?next=${encodeURIComponent("/portal/epis")}`;
      results.push({ epiNome: epi.nome_equipamento, link: linkAssinatura });
      await triggerWebhook({
        nome_funcionario: selectedFunc.nome,
        telefone_whatsapp: selectedFunc.telefone_whatsapp || "",
        nome_epi: epi.nome_equipamento,
        link_assinatura: linkPortal,
      });
    }

    setGeradas(results);
    setLoading(false);
    if (results.length > 0) toast.success(`${results.length} entrega(s) registrada(s)!`);
  };

  const reset = () => {
    setGeradas([]); setFuncId(""); setObra(""); setSelectedEpis(new Set());
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Nova Entrega de EPI</h1>
        <p className="mt-1 text-sm text-gray-500">Selecione o funcionário, a obra e os equipamentos a entregar.</p>
      </div>

      {geradas.length === 0 ? (
        <>
          {/* Seção 1: seleção */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SearchCombobox
              label="Funcionário"
              placeholder="Buscar funcionário…"
              items={funcItems}
              value={funcId}
              onChange={setFuncId}
            />
            <SearchCombobox
              label="Obra / Centro de Custo"
              placeholder="Buscar obra…"
              items={OBRAS}
              value={obra}
              onChange={setObra}
            />
          </div>

          {/* Seção 2: grid de EPIs */}
          <div className="flex items-end justify-between mt-10 mb-4">
            <h2 className="text-xl font-bold text-gray-900">Selecione os Equipamentos</h2>
            <span className="text-xs font-medium text-gray-500">{epis.length} disponíveis</span>
          </div>

          {epis.length === 0 ? (
            <EmptyState
              icon={HardHat}
              title="Nenhum EPI cadastrado"
              description="Cadastre os equipamentos da sua empresa para começar a registrar entregas."
              actionLabel="+ Cadastrar EPI"
              onAction={() => navigate("/app/epis")}
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {epis.map((epi) => {
                const Icon = iconForEpi(epi.nome_equipamento);
                const isSelected = selectedEpis.has(epi.id);
                return (
                  <button
                    type="button"
                    key={epi.id}
                    onClick={() => toggleEpi(epi.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-2xl border-2 bg-white cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-200 relative text-left",
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/50"
                        : "border-gray-100 hover:border-indigo-300",
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-indigo-600 text-white rounded-full p-1 shadow-sm">
                        <Check className="w-full h-full" strokeWidth={3} />
                      </div>
                    )}
                    <div className="w-24 h-24 bg-slate-50 rounded-xl mb-3 flex items-center justify-center">
                      <Icon className="w-10 h-10 text-slate-400" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-bold text-gray-800 text-center line-clamp-2">{epi.nome_equipamento}</p>
                    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-md mt-2">
                      CA {epi.numero_ca}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Rodapé */}
          <div className="h-px w-full bg-gray-100 my-8" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-700">
                {selectedEpis.size} EPI{selectedEpis.size === 1 ? "" : "s"} selecionado{selectedEpis.size === 1 ? "" : "s"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedFunc ? `Funcionário: ${selectedFunc.nome}` : "Funcionário não selecionado"}
                {" • "}
                {obra ? `Obra: ${obra}` : "Obra não selecionada"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !funcId || !obra || selectedEpis.size === 0}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:shadow-none text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-indigo-200/50 transition-all flex items-center gap-2 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              {loading ? "Gerando…" : `Gerar Entrega${selectedEpis.size > 0 ? ` (${selectedEpis.size})` : ""}`}
            </button>
          </div>
        </>
      ) : (
        <div>
          <div className="flex flex-col items-center text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-emerald-600" />
            </div>
            <h2 className="mt-4 text-2xl font-extrabold text-gray-900">Entregas geradas!</h2>
            <p className="mt-1 text-sm text-gray-500">
              {geradas.length} link{geradas.length === 1 ? "" : "s"} de assinatura pronto{geradas.length === 1 ? "" : "s"} para enviar.
            </p>
          </div>

          <div className="space-y-3 mt-6">
            {geradas.map((g, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-gray-100">
                <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{g.epiNome}</p>
                  <p className="text-xs text-gray-500 truncate font-mono">{g.link}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(g.link); toast.success("Link copiado!"); }}
                  className="p-2 rounded-lg hover:bg-white text-gray-600"
                  title="Copiar link"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <a
                  href={g.link} target="_blank" rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-white text-gray-600"
                  title="Abrir link"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>

          <div className="h-px w-full bg-gray-100 my-8" />
          <button
            type="button"
            onClick={reset}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200/50 transition-all"
          >
            Registrar nova entrega
          </button>
        </div>
      )}
    </div>
  );
}
