import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

import { toast } from "sonner";
import { Check, CheckCircle2, Copy, ExternalLink, Footprints, Glasses, Hand, HardHat, Search, Send, Shield, ShieldCheck } from "lucide-react";
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

function SearchCombobox({ label, placeholder, items, value, onChange }: { label: string; placeholder: string; items: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = items.find((i) => i.value === value);
  return (
    <div>
      <label className="app-eyebrow mb-2 block">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" className="flex h-11 w-full items-center gap-2 rounded-lg border border-border/80 bg-muted/30 px-3.5 text-left text-sm font-medium text-foreground outline-none transition-all hover:border-primary-200 focus:border-secondary/60 focus:ring-2 focus:ring-secondary/15">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground/70" strokeWidth={1.8} />
            <span className={cn("truncate", !selected && "font-normal text-muted-foreground")}>{selected ? selected.label : placeholder}</span>
            <span className="ml-auto text-xs text-muted-foreground">⌄</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder={placeholder} />
            <CommandList>
              <CommandEmpty>Nenhum resultado.</CommandEmpty>
              <CommandGroup>
                {items.map((it) => (
                  <CommandItem key={it.value} value={it.label} onSelect={() => { onChange(it.value); setOpen(false); }}>
                    <Check className={cn("mr-2 h-4 w-4", value === it.value ? "text-primary opacity-100" : "opacity-0")} />
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
  const [searchParams] = useSearchParams();
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [epis, setEpis] = useState<Epi[]>([]);
  const [funcId, setFuncId] = useState(searchParams.get("funcionario") ?? "");
  const [obra, setObra] = useState("");
  const [selectedEpis, setSelectedEpis] = useState<Set<string>>(() => {
    const epiParam = searchParams.get("epi");
    return epiParam ? new Set([epiParam]) : new Set<string>();
  });
  const [loading, setLoading] = useState(false);
  const [geradas, setGeradas] = useState<{ epiNome: string; link: string }[]>([]);

  useEffect(() => {
    if (!perfil?.empresa_id) return;
    supabase.from("funcionarios").select("id, nome, telefone_whatsapp, cargo, setor, setor_id").eq("empresa_id", perfil.empresa_id).order("nome").then(({ data }) => { if (data) setFuncionarios(data as Funcionario[]); });
    supabase.from("epis").select("id, nome_equipamento, numero_ca, dias_validade").eq("empresa_id", perfil.empresa_id).order("nome_equipamento").then(({ data }) => { if (data) setEpis(data); });
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
    const { data: auth } = await supabase.auth.getUser();
    const results: { epiNome: string; link: string }[] = [];
    for (const epiId of selectedEpis) {
      const epi = epis.find((e) => e.id === epiId);
      if (!epi) continue;
      const dataVencimento = new Date();
      dataVencimento.setDate(dataVencimento.getDate() + epi.dias_validade);
      const { data, error } = await supabase.from("entregas").insert({
        funcionario_id: funcId,
        epi_id: epiId,
        data_vencimento: dataVencimento.toISOString(),
        empresa_id: perfil.empresa_id,
        quantidade: 1,
        origem: "avulsa",
        cargo_snapshot: selectedFunc.cargo ?? null,
        setor_snapshot: selectedFunc.setor ?? null,
        setor_id_snapshot: selectedFunc.setor_id ?? null,
        registrado_por: auth.user?.id ?? null,
      }).select().single();
      if (error || !data) { toast.error(`Erro ao registrar ${epi.nome_equipamento}`); continue; }
      const PUBLIC_BASE_URL = "https://aisafeguard.lovable.app";
      const linkAssinatura = `${PUBLIC_BASE_URL}/assinar/${data.id}`;
      results.push({ epiNome: epi.nome_equipamento, link: linkAssinatura });
    }
    setGeradas(results);
    setLoading(false);
    if (results.length > 0) toast.success("Entrega registrada e disponibilizada no portal.");
  };


  const reset = () => { setGeradas([]); setFuncId(""); setObra(""); setSelectedEpis(new Set()); };

  return (
    <div className="mx-auto max-w-[1180px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="app-eyebrow">Operação de EPI</p><h1 className="mt-1 text-[27px] font-bold tracking-tight text-foreground">Nova entrega</h1><p className="mt-2 text-sm text-muted-foreground">Registre os equipamentos e disponibilize a assinatura no portal do funcionário.</p></div>
        <div className="rounded-lg border border-primary-100 bg-card px-3 py-2 text-xs font-semibold text-primary-500 shadow-card">Fluxo guiado · 3 etapas</div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[190px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-border/80 bg-card p-4 shadow-card lg:self-start">
          <p className="app-eyebrow">Novo registro</p>
          <div className="mt-5 space-y-1">
            <div className="flex items-start gap-3 rounded-lg bg-primary-50 px-3 py-3"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-500 text-xs font-bold text-white">1</span><div><p className="text-xs font-bold text-primary-600">Destino</p><p className="mt-1 text-[10px] leading-relaxed text-primary-500/70">Quem vai receber</p></div></div>
            <div className="flex items-start gap-3 rounded-lg px-3 py-3"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">2</span><div><p className="text-xs font-bold text-foreground">Equipamentos</p><p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">Selecione os EPIs</p></div></div>
            <div className="flex items-start gap-3 rounded-lg px-3 py-3"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">3</span><div><p className="text-xs font-bold text-foreground">Revisão</p><p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">Confirme e envie</p></div></div>
          </div>
          <div className="mt-8 border-t border-border/70 pt-4"><div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><ShieldCheck className="h-4 w-4 text-secondary-400" />Assinatura auditável</div><p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">Cada entrega gera um registro digital para sua operação.</p></div>
        </aside>

        <div className="overflow-hidden rounded-lg border border-border/80 bg-card shadow-card">
          {geradas.length === 0 ? (
            <>
              <div className="border-b border-border/80 px-5 py-5"><p className="app-eyebrow">Etapa 1 · Destino</p><h2 className="mt-1 text-lg font-bold text-foreground">Quem vai receber?</h2><p className="mt-1 text-xs text-muted-foreground">Defina o funcionário e a obra antes de escolher os equipamentos.</p></div>
              <div className="border-b border-border/80 px-5 py-5"><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><SearchCombobox label="Funcionário" placeholder="Buscar funcionário..." items={funcItems} value={funcId} onChange={setFuncId} /><SearchCombobox label="Obra / centro de custo" placeholder="Buscar obra..." items={OBRAS} value={obra} onChange={setObra} /></div></div>
              <div className="px-5 py-5"><div className="mb-4 flex items-end justify-between gap-3"><div><p className="app-eyebrow">Etapa 2 · Equipamentos</p><h2 className="mt-1 text-lg font-bold text-foreground">Selecione os EPIs</h2></div><span className="text-xs font-medium text-muted-foreground">{epis.length} disponíveis</span></div>
                {epis.length === 0 ? <EmptyState icon={HardHat} title="Nenhum EPI cadastrado" description="Cadastre os equipamentos da sua empresa para começar a registrar entregas." actionLabel="Cadastrar EPI" onAction={() => navigate("/app/epis")} /> : <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{epis.map((epi) => { const Icon = iconForEpi(epi.nome_equipamento); const isSelected = selectedEpis.has(epi.id); return <button type="button" key={epi.id} onClick={() => toggleEpi(epi.id)} className={cn("group relative rounded-lg border p-3 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-secondary/70 hover:shadow-card-hover", isSelected ? "border-secondary bg-secondary/5 ring-2 ring-secondary/10" : "border-border/80 bg-card")}>{isSelected && <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-md bg-secondary text-white"><Check className="h-3 w-3" strokeWidth={3} /></span>}<div className="flex h-16 items-center justify-center rounded-md bg-muted/45 text-primary-500"><Icon className="h-8 w-8" strokeWidth={1.5} /></div><p className="mt-3 line-clamp-2 text-xs font-bold text-foreground">{epi.nome_equipamento}</p><div className="mt-2 flex items-center justify-between gap-2"><span className="rounded bg-muted px-1.5 py-1 text-[10px] font-semibold text-muted-foreground">CA {epi.numero_ca}</span><span className="text-[10px] text-muted-foreground">{epi.dias_validade}d</span></div></button>; })}</div>}
              </div>
              <div className="flex flex-col gap-3 border-t border-border/80 bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold text-foreground">{selectedEpis.size} EPI{selectedEpis.size === 1 ? "" : "s"} selecionado{selectedEpis.size === 1 ? "" : "s"}</p><p className="mt-1 text-[11px] text-muted-foreground">{selectedFunc ? selectedFunc.nome : "Funcionário não selecionado"} · {obra || "Obra não selecionada"}</p></div><button type="button" onClick={handleSubmit} disabled={loading || !funcId || !obra || selectedEpis.size === 0} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-primary-600 hover:shadow-md disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"><Send className="h-3.5 w-3.5" strokeWidth={1.8} />{loading ? "Gerando..." : `Revisar entrega${selectedEpis.size > 0 ? ` (${selectedEpis.size})` : ""}`}</button></div>
            </>
          ) : (
            <div className="p-6 sm:p-8"><div className="flex flex-col items-center text-center"><div className="flex h-14 w-14 items-center justify-center rounded-xl bg-success/10 text-success"><CheckCircle2 className="h-7 w-7" strokeWidth={1.8} /></div><p className="app-eyebrow mt-5">Registro concluído</p><h2 className="mt-1 text-2xl font-bold text-foreground">Entrega registrada</h2><p className="mt-2 text-sm text-muted-foreground">O EPI foi disponibilizado no portal do funcionário e está aguardando assinatura.</p></div><div className="mt-7 space-y-2">{geradas.map((g, i) => <div key={i} className="flex items-center gap-3 rounded-lg border border-border/80 bg-muted/20 p-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-500"><ShieldCheck className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-foreground">{g.epiNome}</p><p className="truncate font-mono text-[10px] text-muted-foreground">{g.link}</p></div><button type="button" onClick={() => { navigator.clipboard.writeText(g.link); toast.success("Link copiado!"); }} className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-card hover:text-primary" title="Copiar link de assinatura"><Copy className="h-4 w-4" /></button><a href={g.link} target="_blank" rel="noopener noreferrer" className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-card hover:text-primary" title="Abrir link"><ExternalLink className="h-4 w-4" /></a></div>)}</div><button type="button" onClick={reset} className="mt-7 h-10 w-full rounded-lg bg-primary-500 text-xs font-bold text-white shadow-sm transition-colors hover:bg-primary-600">Registrar nova entrega</button></div>
          )}
        </div>
      </div>
    </div>
  );
}
