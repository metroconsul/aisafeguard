import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { logEpiAudit } from "@/lib/epi-audit";
import { validarItemKit } from "@/lib/epi-compliance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { AlertTriangle, Boxes, Info, Loader2, Package, Plus, Trash2 } from "lucide-react";

interface Cargo { id: string; nome: string; setor_id: string | null; ativo: boolean }
interface Kit { id: string; cargo_id: string; nome: string; versao: number; ativo: boolean }
interface KitItem {
  id: string;
  kit_id: string;
  epi_id: string;
  quantidade_necessaria: number;
  validade_valor: number;
  validade_unidade: string;
  obrigatorio: boolean;
  epis?: { nome_equipamento: string; numero_ca: string } | null;
}
interface Epi { id: string; nome_equipamento: string; numero_ca: string; dias_validade: number }

export default function KitsEpi() {
  const { perfil } = useAuth();
  const empresaId = perfil?.empresa_id;
  const canEdit = perfil?.role === "admin" || perfil?.role === "tecnico_seguranca";

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [setores, setSetores] = useState<{ id: string; nome: string }[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [itens, setItens] = useState<KitItem[]>([]);
  const [epis, setEpis] = useState<Epi[]>([]);
  const [selectedKitId, setSelectedKitId] = useState<string | null>(null);

  const [filtroSetor, setFiltroSetor] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  const [novoKitOpen, setNovoKitOpen] = useState(false);
  const [novoKitCargo, setNovoKitCargo] = useState("");
  const [novoCargoNome, setNovoCargoNome] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [novoItem, setNovoItem] = useState({ epi_id: "", quantidade: "1", validade_valor: "", validade_unidade: "days", obrigatorio: true });
  const [itemParaRemover, setItemParaRemover] = useState<KitItem | null>(null);

  const load = useCallback(async () => {
    if (!empresaId) return;
    setLoading(true);
    setErro(null);
    const [cargosRes, setoresRes, kitsRes, episRes] = await Promise.all([
      supabase.from("cargos").select("id, nome, setor_id, ativo").eq("empresa_id", empresaId).order("nome"),
      supabase.from("setores").select("id, nome").eq("empresa_id", empresaId).order("nome"),
      supabase.from("epi_kits").select("id, cargo_id, nome, versao, ativo").eq("empresa_id", empresaId).order("nome"),
      supabase.from("epis").select("id, nome_equipamento, numero_ca, dias_validade").eq("empresa_id", empresaId).order("nome_equipamento"),
    ]);
    const firstError = cargosRes.error || setoresRes.error || kitsRes.error || episRes.error;
    if (firstError) { setErro(firstError.message); setLoading(false); return; }
    setCargos(cargosRes.data ?? []);
    setSetores(setoresRes.data ?? []);
    setKits(kitsRes.data ?? []);
    setEpis(episRes.data ?? []);
    setLoading(false);
  }, [empresaId]);

  useEffect(() => { void load(); }, [load]);

  const loadItens = useCallback(async (kitId: string) => {
    const { data, error } = await supabase
      .from("epi_kit_itens")
      .select("id, kit_id, epi_id, quantidade_necessaria, validade_valor, validade_unidade, obrigatorio, epis(nome_equipamento, numero_ca)")
      .eq("kit_id", kitId)
      .eq("ativo", true)
      .order("created_at");
    if (error) { toast.error("Falha ao carregar itens do kit."); return; }
    setItens((data ?? []) as unknown as KitItem[]);
  }, []);

  useEffect(() => { if (selectedKitId) void loadItens(selectedKitId); else setItens([]); }, [selectedKitId, loadItens]);

  const kitsVisiveis = useMemo(() => {
    return kits.filter((k) => {
      const cargo = cargos.find((c) => c.id === k.cargo_id);
      if (filtroSetor !== "todos" && cargo?.setor_id !== filtroSetor) return false;
      if (filtroStatus === "ativos" && !k.ativo) return false;
      if (filtroStatus === "inativos" && k.ativo) return false;
      return true;
    });
  }, [kits, cargos, filtroSetor, filtroStatus]);

  const selectedKit = kits.find((k) => k.id === selectedKitId) ?? null;
  const cargoDoKit = cargos.find((c) => c.id === selectedKit?.cargo_id);
  const cargoNome = (id: string) => cargos.find((c) => c.id === id)?.nome ?? "Cargo removido";

  const handleCriarKit = async () => {
    if (!empresaId) return;
    let cargoId = novoKitCargo;
    setSalvando(true);
    try {
      if (!cargoId) {
        const nome = novoCargoNome.trim();
        if (!nome) { toast.error("Informe o cargo do kit."); return; }
        const { data, error } = await supabase.from("cargos").insert({ empresa_id: empresaId, nome }).select("id").single();
        if (error || !data) { toast.error("Erro ao criar cargo: " + (error?.message ?? "")); return; }
        cargoId = data.id;
        await logEpiAudit({ empresaId, entity: "cargo", entityId: cargoId, action: "create", newValue: { nome } });
      }
      const nomeKit = `Kit padrão — ${cargos.find((c) => c.id === cargoId)?.nome ?? novoCargoNome.trim()}`;
      const { data, error } = await supabase
        .from("epi_kits")
        .insert({ empresa_id: empresaId, cargo_id: cargoId, nome: nomeKit })
        .select("id, cargo_id, nome, versao, ativo")
        .single();
      if (error || !data) {
        toast.error(error?.message.includes("epi_kits_one_active_per_cargo") ? "Este cargo já possui um kit ativo." : "Erro ao criar kit.");
        return;
      }
      await logEpiAudit({ empresaId, entity: "epi_kit", entityId: data.id, action: "create", newValue: data });
      toast.success("Kit criado. Adicione os equipamentos.");
      setNovoKitOpen(false);
      setNovoKitCargo("");
      setNovoCargoNome("");
      await load();
      setSelectedKitId(data.id);
    } finally {
      setSalvando(false);
    }
  };

  const handleToggleKit = async (kit: Kit) => {
    if (!empresaId) return;
    const { error } = await supabase.from("epi_kits").update({ ativo: !kit.ativo }).eq("id", kit.id);
    if (error) { toast.error("Erro ao alterar o kit: " + error.message); return; }
    await logEpiAudit({ empresaId, entity: "epi_kit", entityId: kit.id, action: kit.ativo ? "deactivate" : "activate", oldValue: { ativo: kit.ativo }, newValue: { ativo: !kit.ativo } });
    toast.success(kit.ativo ? "Kit desativado." : "Kit ativado e sincronizado com os colaboradores do cargo.");
    await load();
  };

  const handleAddItem = async () => {
    if (!selectedKit || !empresaId) return;
    const quantidade = Number(novoItem.quantidade);
    const validadeValor = Number(novoItem.validade_valor);
    const erroValidacao = validarItemKit({
      epiId: novoItem.epi_id,
      quantidade,
      validadeValor,
      itensExistentes: itens.map((i) => ({ epiId: i.epi_id })),
    });
    if (erroValidacao) { toast.error(erroValidacao); return; }
    setSalvando(true);
    const { data, error } = await supabase.from("epi_kit_itens").insert({
      kit_id: selectedKit.id,
      empresa_id: empresaId,
      epi_id: novoItem.epi_id,
      quantidade_necessaria: quantidade,
      validade_valor: validadeValor,
      validade_unidade: novoItem.validade_unidade,
      obrigatorio: novoItem.obrigatorio,
    }).select("id").single();
    setSalvando(false);
    if (error) { toast.error("Erro ao adicionar item: " + error.message); return; }
    await logEpiAudit({ empresaId, entity: "epi_kit_item", entityId: data?.id, action: "create", newValue: novoItem });
    toast.success("Item adicionado. Os colaboradores deste cargo foram sincronizados.");
    setNovoItem({ epi_id: "", quantidade: "1", validade_valor: "", validade_unidade: "days", obrigatorio: true });
    await loadItens(selectedKit.id);
  };

  const handleUpdateItem = async (item: KitItem, patch: Partial<KitItem>) => {
    if (!empresaId) return;
    const { error } = await supabase.from("epi_kit_itens").update(patch as never).eq("id", item.id);
    if (error) { toast.error("Erro ao atualizar item: " + error.message); return; }
    await logEpiAudit({ empresaId, entity: "epi_kit_item", entityId: item.id, action: "update", oldValue: item, newValue: patch });
    await loadItens(item.kit_id);
  };

  const handleRemoveItem = async () => {
    if (!itemParaRemover || !empresaId) return;
    const item = itemParaRemover;
    setItemParaRemover(null);
    const { error } = await supabase.from("epi_kit_itens").update({ ativo: false }).eq("id", item.id);
    if (error) { toast.error("Erro ao remover item: " + error.message); return; }
    await logEpiAudit({ empresaId, entity: "epi_kit_item", entityId: item.id, action: "remove", oldValue: item });
    toast.success("Item removido do kit. As entregas já realizadas foram preservadas.");
    await loadItens(item.kit_id);
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (erro) return (
    <div className="mx-auto max-w-[720px] rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
      <AlertTriangle className="mx-auto h-6 w-6 text-destructive" />
      <p className="mt-3 font-semibold text-foreground">Não foi possível carregar os kits</p>
      <p className="mt-1 text-sm text-muted-foreground">{erro}</p>
      <Button className="mt-4" onClick={() => void load()}>Tentar novamente</Button>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1240px] space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="app-eyebrow">Padrão por cargo</p>
          <h1 className="mt-1 text-[27px] font-bold tracking-tight text-foreground">Kits de EPI</h1>
          <p className="mt-2 text-sm text-muted-foreground">Defina os equipamentos obrigatórios de cada cargo e a vida útil de cada item.</p>
        </div>
        {canEdit && (
          <Button onClick={() => setNovoKitOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Novo kit</Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={filtroSetor} onValueChange={setFiltroSetor}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Setor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os setores</SelectItem>
            {setores.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Ativos e inativos</SelectItem>
            <SelectItem value="ativos">Somente ativos</SelectItem>
            <SelectItem value="inativos">Somente inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {kits.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="Nenhum kit configurado"
          description="Crie o kit padrão de um cargo para que os colaboradores herdem automaticamente os equipamentos obrigatórios."
          actionLabel={canEdit ? "Criar primeiro kit" : undefined}
          onAction={canEdit ? () => setNovoKitOpen(true) : undefined}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-2">
            {kitsVisiveis.length === 0 && (
              <p className="rounded-xl border border-dashed border-border/80 px-4 py-8 text-center text-xs text-muted-foreground">Nenhum kit para os filtros escolhidos.</p>
            )}
            {kitsVisiveis.map((k) => (
              <button
                key={k.id}
                onClick={() => setSelectedKitId(k.id)}
                className={[
                  "w-full rounded-xl border p-4 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-card-hover",
                  selectedKitId === k.id ? "border-primary-300 bg-primary-50/60 shadow-card" : "border-border/80 bg-card shadow-card",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{cargoNome(k.cargo_id)}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{k.nome}</p>
                  </div>
                  <Badge className={k.ativo ? "border-emerald-200 bg-emerald-500/10 text-emerald-700" : "border-border bg-muted text-muted-foreground"}>
                    {k.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">Versão {k.versao}</p>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-border/80 bg-card p-5 shadow-card">
            {!selectedKit ? (
              <div className="py-16 text-center">
                <Package className="mx-auto h-8 w-8 text-muted-foreground/60" />
                <p className="mt-3 text-sm font-semibold text-foreground">Selecione um kit</p>
                <p className="mt-1 text-xs text-muted-foreground">Escolha um cargo à esquerda para ver e editar os equipamentos.</p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 pb-4">
                  <div>
                    <p className="app-eyebrow">{cargoDoKit?.nome ?? "Cargo"}</p>
                    <h2 className="mt-1 text-lg font-bold text-foreground">{selectedKit.nome}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">Versão vigente {selectedKit.versao} · {itens.length} {itens.length === 1 ? "item" : "itens"}</p>
                  </div>
                  {canEdit && (
                    <Button variant="outline" onClick={() => void handleToggleKit(selectedKit)}>
                      {selectedKit.ativo ? "Desativar kit" : "Ativar kit"}
                    </Button>
                  )}
                </div>

                <div className="mt-4 flex items-start gap-2 rounded-lg border border-primary-100 bg-primary-50/60 p-3 text-xs text-primary-600">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>Alterações no kit valem para as próximas pendências dos colaboradores deste cargo. Entregas já registradas e assinadas não são alteradas.</p>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-border/80 bg-muted/25">
                        <th className="px-3 py-3 text-left app-eyebrow">Equipamento</th>
                        <th className="px-3 py-3 text-left app-eyebrow">CA</th>
                        <th className="px-3 py-3 text-left app-eyebrow">Qtd.</th>
                        <th className="px-3 py-3 text-left app-eyebrow">Vida útil</th>
                        <th className="px-3 py-3 text-left app-eyebrow">Obrigatório</th>
                        {canEdit && <th className="px-3 py-3 text-right app-eyebrow">Ação</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/70">
                      {itens.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-3 font-semibold text-foreground">{item.epis?.nome_equipamento ?? "—"}</td>
                          <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{item.epis?.numero_ca ?? "—"}</td>
                          <td className="px-3 py-3">
                            {canEdit ? (
                              <Input
                                type="number" min={1} defaultValue={item.quantidade_necessaria} className="h-8 w-20"
                                onBlur={(e) => {
                                  const v = Number(e.target.value);
                                  if (!Number.isInteger(v) || v <= 0) { toast.error("Quantidade inválida."); e.target.value = String(item.quantidade_necessaria); return; }
                                  if (v !== item.quantidade_necessaria) void handleUpdateItem(item, { quantidade_necessaria: v });
                                }}
                              />
                            ) : item.quantidade_necessaria}
                          </td>
                          <td className="px-3 py-3">
                            {canEdit ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number" min={1} defaultValue={item.validade_valor} className="h-8 w-20"
                                  onBlur={(e) => {
                                    const v = Number(e.target.value);
                                    if (!Number.isInteger(v) || v <= 0) { toast.error("Vida útil inválida."); e.target.value = String(item.validade_valor); return; }
                                    if (v !== item.validade_valor) void handleUpdateItem(item, { validade_valor: v });
                                  }}
                                />
                                <Select value={item.validade_unidade} onValueChange={(v) => void handleUpdateItem(item, { validade_unidade: v })}>
                                  <SelectTrigger className="h-8 w-[104px]"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="days">dias</SelectItem>
                                    <SelectItem value="months">meses</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : `${item.validade_valor} ${item.validade_unidade === "months" ? "meses" : "dias"}`}
                          </td>
                          <td className="px-3 py-3">
                            {canEdit ? (
                              <Switch checked={item.obrigatorio} onCheckedChange={(v) => void handleUpdateItem(item, { obrigatorio: v })} />
                            ) : (item.obrigatorio ? "Sim" : "Não")}
                          </td>
                          {canEdit && (
                            <td className="px-3 py-3 text-right">
                              <Button variant="ghost" size="icon" onClick={() => setItemParaRemover(item)} aria-label={`Remover ${item.epis?.nome_equipamento ?? "item"}`}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                      {itens.length === 0 && (
                        <tr><td colSpan={canEdit ? 6 : 5} className="px-3 py-10 text-center text-xs text-muted-foreground">Nenhum equipamento neste kit ainda.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {canEdit && (
                  <div className="mt-5 rounded-xl border border-border/80 bg-muted/20 p-4">
                    <p className="app-eyebrow">Adicionar equipamento</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      <div className="lg:col-span-2">
                        <Label className="text-xs text-muted-foreground">Equipamento</Label>
                        <Select
                          value={novoItem.epi_id}
                          onValueChange={(v) => {
                            const epi = epis.find((e) => e.id === v);
                            setNovoItem((p) => ({ ...p, epi_id: v, validade_valor: p.validade_valor || String(epi?.dias_validade ?? "") }));
                          }}
                        >
                          <SelectTrigger><SelectValue placeholder="Selecione do catálogo" /></SelectTrigger>
                          <SelectContent>
                            {epis.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome_equipamento} (CA {e.numero_ca})</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Quantidade</Label>
                        <Input type="number" min={1} value={novoItem.quantidade} onChange={(e) => setNovoItem({ ...novoItem, quantidade: e.target.value })} />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Vida útil</Label>
                        <div className="flex gap-2">
                          <Input type="number" min={1} value={novoItem.validade_valor} onChange={(e) => setNovoItem({ ...novoItem, validade_valor: e.target.value })} />
                          <Select value={novoItem.validade_unidade} onValueChange={(v) => setNovoItem({ ...novoItem, validade_unidade: v })}>
                            <SelectTrigger className="w-[104px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="days">dias</SelectItem>
                              <SelectItem value="months">meses</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-end gap-3">
                        <div className="flex items-center gap-2">
                          <Switch checked={novoItem.obrigatorio} onCheckedChange={(v) => setNovoItem({ ...novoItem, obrigatorio: v })} id="obrigatorio" />
                          <Label htmlFor="obrigatorio" className="text-xs">Obrigatório</Label>
                        </div>
                      </div>
                    </div>
                    <Button className="mt-3 gap-2" onClick={() => void handleAddItem()} disabled={salvando}>
                      {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Adicionar ao kit
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <Dialog open={novoKitOpen} onOpenChange={setNovoKitOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader><DialogTitle>Novo kit de EPI</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Cargo já cadastrado</Label>
              <Select value={novoKitCargo} onValueChange={(v) => { setNovoKitCargo(v); setNovoCargoNome(""); }}>
                <SelectTrigger><SelectValue placeholder="Selecione o cargo" /></SelectTrigger>
                <SelectContent>
                  {cargos.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Ou crie um cargo novo</Label>
              <Input value={novoCargoNome} onChange={(e) => { setNovoCargoNome(e.target.value); setNovoKitCargo(""); }} placeholder="Ex.: Eletricista de manutenção" />
            </div>
            <Button className="w-full" onClick={() => void handleCriarKit()} disabled={salvando}>
              {salvando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Criar kit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!itemParaRemover} onOpenChange={(o) => !o && setItemParaRemover(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover este item do kit?</AlertDialogTitle>
            <AlertDialogDescription>
              O item deixa de ser exigido nas próximas verificações deste cargo. As entregas e assinaturas já registradas continuam no histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleRemoveItem()}>Remover item</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
