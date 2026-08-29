import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { calcVencimento, STATUS_META, TONE_CLASS, motivoPrincipal, resumoRequisitos, type RequisitoStatus, type ValidadeUnidade } from "@/lib/epi-compliance";
import { logEpiAudit } from "@/lib/epi-audit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { Boxes, Copy, Loader2, PackageCheck, ShieldAlert, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Requisito {
  id: string;
  epi_id: string;
  kit_id: string;
  kit_item_id: string;
  quantidade_necessaria: number;
  quantidade_entregue: number;
  obrigatorio: boolean;
  status: string;
  proxima_vencimento: string | null;
  epis?: { nome_equipamento: string; numero_ca: string } | null;
  epi_kit_itens?: { validade_valor: number; validade_unidade: string } | null;
}

interface Props {
  funcionarioId: string;
  cargoNome?: string | null;
  canRegister?: boolean;
}

const PENDENTES: RequisitoStatus[] = ["pending", "partial", "expired"];

export function KitEpiSection({ funcionarioId, cargoNome, canRegister = true }: Props) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [reqs, setReqs] = useState<Requisito[]>([]);
  const [entregando, setEntregando] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErro(null);
    const { data, error } = await supabase
      .from("funcionario_epi_requisitos")
      .select("id, epi_id, kit_id, kit_item_id, quantidade_necessaria, quantidade_entregue, obrigatorio, status, proxima_vencimento, epis(nome_equipamento, numero_ca), epi_kit_itens(validade_valor, validade_unidade)")
      .eq("funcionario_id", funcionarioId)
      .order("status");
    if (error) { setErro(error.message); setLoading(false); return; }
    setReqs((data ?? []) as unknown as Requisito[]);
    setLoading(false);
  }, [funcionarioId]);

  useEffect(() => { void load(); }, [load]);

  const resumo = resumoRequisitos(reqs.map((r) => ({ status: r.status as RequisitoStatus, obrigatorio: r.obrigatorio })));
  const irregular = resumo.irregular;
  const pendentes = reqs.filter((r) => PENDENTES.includes(r.status as RequisitoStatus));

  const copiarLinkPortal = async () => {
    const link = `${window.location.origin}/portal/login?next=/portal/epis`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link do Portal copiado — envie ao colaborador para assinar.");
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  };

  const entregar = async (itens: Requisito[], escopo: string) => {
    if (itens.length === 0) return;
    setEntregando(escopo);
    try {
      const { data: func, error: funcErr } = await supabase
        .from("funcionarios")
        .select("id, empresa_id, cargo, setor, setor_id")
        .eq("id", funcionarioId)
        .maybeSingle();
      if (funcErr) throw funcErr;
      if (!func?.empresa_id) throw new Error("Colaborador sem empresa vinculada.");

      const { data: userRes } = await supabase.auth.getUser();
      const agora = new Date();

      const rows = itens.map((r) => {
        const faltante = Math.max(1, r.quantidade_necessaria - (r.status === "expired" ? 0 : r.quantidade_entregue));
        const validade = r.epi_kit_itens;
        const venc = validade
          ? calcVencimento(agora, validade.validade_valor, (validade.validade_unidade as ValidadeUnidade) ?? "days")
          : calcVencimento(agora, 90, "days");
        return {
          funcionario_id: funcionarioId,
          epi_id: r.epi_id,
          empresa_id: func.empresa_id,
          quantidade: faltante,
          origem: "kit",
          kit_id: r.kit_id,
          kit_item_id: r.kit_item_id,
          data_entrega: agora.toISOString(),
          data_vencimento: venc.toISOString(),
          status_assinatura: "Pendente",
          cargo_snapshot: func.cargo ?? null,
          setor_snapshot: func.setor ?? null,
          setor_id_snapshot: func.setor_id ?? null,
          registrado_por: userRes?.user?.id ?? null,
        };
      });

      const { data: inseridas, error } = await supabase.from("entregas").insert(rows).select("id");
      if (error) throw error;

      await logEpiAudit({
        empresa_id: func.empresa_id,
        entity: "entregas",
        entity_id: inseridas?.[0]?.id ?? null,
        action: "entrega_kit",
        new_value: { funcionario_id: funcionarioId, itens: rows.length, origem: "kit" },
      });

      toast.success(`${rows.length} entrega(s) registrada(s). Pendente(s) de assinatura no Portal.`);
      await load();
    } catch (e) {
      toast.error((e as Error).message || "Erro ao registrar entrega do kit");
    }
    setEntregando(null);
  };

  return (
    <section className="rounded-xl border border-border/80 bg-card p-5 shadow-card" aria-labelledby="kit-epi-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="app-eyebrow">Kit de EPI do cargo</p>
          <h2 id="kit-epi-heading" className="mt-1 text-base font-bold text-foreground">
            {cargoNome ? `Padrão para ${cargoNome}` : "Padrão do cargo"}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!loading && reqs.length > 0 && (
            <Badge className={irregular ? TONE_CLASS.danger : TONE_CLASS.success}>
              {irregular ? (
                <span className="flex items-center gap-1.5"><ShieldAlert className="h-3.5 w-3.5" />Irregular</span>
              ) : (
                <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" />Regular</span>
              )}
            </Badge>
          )}
          {canRegister && pendentes.length > 0 && (
            <>
              <Button size="sm" onClick={() => void entregar(pendentes, "kit")} disabled={entregando !== null}>
                {entregando === "kit" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <PackageCheck className="mr-1.5 h-4 w-4" />}
                Entregar kit completo ({pendentes.length})
              </Button>
              <Button size="sm" variant="outline" onClick={() => void copiarLinkPortal()}>
                <Copy className="mr-1.5 h-4 w-4" />Link do Portal
              </Button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : erro ? (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p className="font-semibold text-foreground">Não foi possível carregar o kit</p>
          <p className="mt-1 text-xs text-muted-foreground">{erro}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => void load()}>Tentar novamente</Button>
        </div>
      ) : reqs.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={Boxes}
            title="Nenhum kit vinculado a este cargo"
            description="Configure um kit de EPI para o cargo deste colaborador e as pendências serão geradas automaticamente."
            actionLabel={canRegister ? "Configurar kits" : undefined}
            onAction={canRegister ? () => navigate("/app/kits-epi") : undefined}
          />
        </div>
      ) : (
        <>
          {irregular && (
            <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs font-medium text-destructive">
              {motivoPrincipal(reqs.map((r) => ({ status: r.status as RequisitoStatus, obrigatorio: r.obrigatorio })))}
            </p>
          )}
          <div className="mt-4 space-y-2">
            {reqs.map((r) => {
              const meta = STATUS_META[(r.status as RequisitoStatus) in STATUS_META ? (r.status as RequisitoStatus) : "pending"];
              return (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/15 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {r.epis?.nome_equipamento ?? "Equipamento"}
                      {!r.obrigatorio && <span className="ml-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">opcional</span>}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      CA {r.epis?.numero_ca ?? "—"} · {r.quantidade_entregue}/{r.quantidade_necessaria} entregue
                      {r.proxima_vencimento ? ` · vence ${format(new Date(r.proxima_vencimento), "dd/MM/yyyy", { locale: ptBR })}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={TONE_CLASS[meta.tone]}>{meta.label}</Badge>
                    {canRegister && PENDENTES.includes(r.status as RequisitoStatus) && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={entregando !== null}
                        onClick={() => void entregar([r], r.id)}
                      >
                        {entregando === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : r.status === "expired" ? "Renovar" : "Entregar"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            As entregas do kit ficam pendentes de assinatura e aparecem no Portal do Colaborador em <strong>Meus EPIs</strong>.
          </p>
        </>
      )}
    </section>
  );
}
