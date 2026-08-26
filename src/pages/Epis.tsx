import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, Clock3, HardHat, Package, Pencil, Plus, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Epi = Tables<"epis">;

export default function Epis() {
  const { user, perfil, loading } = useAuth();
  const [data, setData] = useState<Epi[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ nome_equipamento: "", numero_ca: "", dias_validade: "", quantidade_estoque: "" });
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingStockValue, setEditingStockValue] = useState("");

  const isAlmoxarifado = perfil?.role === "almoxarifado";
  const canAddEpi = !isAlmoxarifado;

  const load = useCallback(async () => {
    if (!user || !perfil?.empresa_id) return;
    const { data: rows, error } = await supabase.from("epis").select("*").eq("empresa_id", perfil.empresa_id).order("nome_equipamento");
    if (error) { toast.error("Falha ao carregar EPIs: " + error.message); return; }
    setData(rows || []);
  }, [user, perfil?.empresa_id]);

  useEffect(() => {
    if (loading || !user || !perfil?.empresa_id) { setData([]); return; }
    void load();
    const channel = supabase.channel(`epis-realtime-${perfil.empresa_id}`).on("postgres_changes", { event: "*", schema: "public", table: "epis", filter: `empresa_id=eq.${perfil.empresa_id}` }, () => { void load(); }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loading, user, perfil?.empresa_id, load]);

  const handleAdd = async () => {
    if (!perfil?.empresa_id) return toast.error("Perfil não carregado.");
    const { error } = await supabase.from("epis").insert({ nome_equipamento: form.nome_equipamento, numero_ca: form.numero_ca, dias_validade: parseInt(form.dias_validade) || 0, quantidade_estoque: parseInt(form.quantidade_estoque) || 0, empresa_id: perfil.empresa_id });
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("EPI adicionado!");
    setForm({ nome_equipamento: "", numero_ca: "", dias_validade: "", quantidade_estoque: "" }); setOpen(false); await load();
  };

  const handleUpdateStock = async (epiId: string) => {
    const qty = parseInt(editingStockValue);
    if (isNaN(qty) || qty < 0) return toast.error("Quantidade inválida");
    const { error } = await supabase.from("epis").update({ quantidade_estoque: qty }).eq("id", epiId);
    if (error) { toast.error("Erro ao atualizar estoque: " + error.message); return; }
    toast.success("Estoque atualizado!"); setEditingStockId(null); await load();
  };

  const filteredData = useMemo(() => data.filter((epi) => `${epi.nome_equipamento} ${epi.numero_ca}`.toLowerCase().includes(query.toLowerCase())), [data, query]);
  const lowStock = data.filter((epi) => (epi.quantidade_estoque ?? 0) <= 5).length;
  const expiring = data.filter((epi) => (epi.dias_validade ?? 0) > 0 && (epi.dias_validade ?? 0) <= 30).length;

  const renderStockCell = (epi: Epi) => {
    if (editingStockId === epi.id) return <div className="flex items-center gap-1"><Input type="number" min={0} value={editingStockValue} onChange={(e) => setEditingStockValue(e.target.value)} className="h-8 w-20 text-sm" onKeyDown={(e) => { if (e.key === "Enter") void handleUpdateStock(epi.id); if (e.key === "Escape") setEditingStockId(null); }} autoFocus /><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => void handleUpdateStock(epi.id)}><Check className="h-3.5 w-3.5 text-success" /></Button><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingStockId(null)}><X className="h-3.5 w-3.5 text-destructive" /></Button></div>;
    const quantity = epi.quantidade_estoque ?? 0;
    return <div className="flex items-center gap-2"><span className={quantity <= 5 ? "font-bold text-amber-600" : "font-semibold text-foreground"}>{quantity}</span>{quantity <= 5 && <span className="status-warning">Baixo</span>}{isAlmoxarifado && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingStockId(epi.id); setEditingStockValue(String(quantity)); }}><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></Button>}</div>;
  };

  return (
    <div className="mx-auto max-w-[1240px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="app-eyebrow">Controle de equipamentos</p><h1 className="mt-1 text-[27px] font-bold tracking-tight text-foreground">EPIs</h1><p className="mt-2 text-sm text-muted-foreground">Catálogo, validade e disponibilidade do estoque.</p></div>{canAddEpi && <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button><Plus className="h-4 w-4" />Novo EPI</Button></DialogTrigger><DialogContent className="max-w-[95vw] sm:max-w-lg"><DialogHeader><DialogTitle className="text-lg">Cadastrar equipamento</DialogTitle></DialogHeader><div className="space-y-4"><div className="space-y-1.5"><Label>Nome do equipamento</Label><Input value={form.nome_equipamento} onChange={(e) => setForm({ ...form, nome_equipamento: e.target.value })} placeholder="Ex.: Capacete de segurança" /></div><div className="space-y-1.5"><Label>Número CA</Label><Input value={form.numero_ca} onChange={(e) => setForm({ ...form, numero_ca: e.target.value })} placeholder="Ex.: 12345" /></div><div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label>Dias de validade</Label><Input type="number" value={form.dias_validade} onChange={(e) => setForm({ ...form, dias_validade: e.target.value })} /></div><div className="space-y-1.5"><Label>Estoque inicial</Label><Input type="number" value={form.quantidade_estoque} onChange={(e) => setForm({ ...form, quantidade_estoque: e.target.value })} /></div></div><Button onClick={() => void handleAdd()} className="w-full">Salvar equipamento</Button></div></DialogContent></Dialog>}</div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><div className="data-summary"><div className="summary-icon blue"><Package className="h-4 w-4" /></div><div><span>Total cadastrado</span><strong>{data.length}</strong><small>equipamentos no catálogo</small></div></div><div className="data-summary"><div className="summary-icon amber"><AlertTriangle className="h-4 w-4" /></div><div><span>Estoque baixo</span><strong>{lowStock}</strong><small>itens com até 5 unidades</small></div></div><div className="data-summary"><div className="summary-icon cyan"><Clock3 className="h-4 w-4" /></div><div><span>Validade curta</span><strong>{expiring}</strong><small>itens com até 30 dias</small></div></div></div>

      <div className="overflow-hidden rounded-lg border border-border/80 bg-card shadow-card"><div className="flex flex-col gap-3 border-b border-border/80 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="app-eyebrow">Inventário</p><h2 className="mt-1 text-sm font-bold text-foreground">Equipamentos cadastrados</h2></div><div className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar equipamento ou CA..." className="h-9 pl-9" /></div></div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-sm"><thead><tr className="border-b border-border/80 bg-muted/25"><th className="px-4 py-3 text-left app-eyebrow">Equipamento</th><th className="px-4 py-3 text-left app-eyebrow">CA</th><th className="px-4 py-3 text-left app-eyebrow">Validade</th><th className="px-4 py-3 text-left app-eyebrow">Disponibilidade</th><th className="px-4 py-3 text-right app-eyebrow">Ação</th></tr></thead><tbody className="divide-y divide-border/70">{filteredData.map((e) => <tr key={e.id} className="transition-colors hover:bg-primary-50/45"><td className="px-4 py-3"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-50 text-primary-500"><HardHat className="h-4 w-4" strokeWidth={1.8} /></div><div><p className="font-semibold text-foreground">{e.nome_equipamento}</p><p className="mt-1 text-[10px] text-muted-foreground">Cadastro ativo</p></div></div></td><td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.numero_ca}</td><td className="px-4 py-3 text-xs text-foreground">{e.dias_validade} dias</td><td className="px-4 py-3">{renderStockCell(e)}</td><td className="px-4 py-3 text-right"><Button variant="ghost" size="sm" className="text-xs text-primary-500">Ver detalhes</Button></td></tr>)}{filteredData.length === 0 && <tr><td colSpan={5} className="px-4 py-14 text-center"><div className="mx-auto flex max-w-xs flex-col items-center"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Search className="h-4 w-4" /></div><p className="mt-3 text-sm font-semibold text-foreground">Nenhum equipamento encontrado</p><p className="mt-1 text-xs text-muted-foreground">Ajuste a busca ou cadastre um novo equipamento.</p></div></td></tr>}</tbody></table></div></div>
    </div>
  );
}
