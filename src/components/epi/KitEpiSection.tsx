import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_META, TONE_CLASS, motivoPrincipal, resumoRequisitos, type RequisitoStatus } from "@/lib/epi-compliance";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { Boxes, Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Requisito {
  id: string;
  epi_id: string;
  quantidade_necessaria: number;
  quantidade_entregue: number;
  obrigatorio: boolean;
  status: string;
  proxima_vencimento: string | null;
  epis?: { nome_equipamento: string; numero_ca: string } | null;
}

interface Props {
  funcionarioId: string;
  cargoNome?: string | null;
  canRegister?: boolean;
}

export function KitEpiSection({ funcionarioId, cargoNome, canRegister = true }: Props) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [reqs, setReqs] = useState<Requisito[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setErro(null);
    const { data, error } = await supabase
      .from("funcionario_epi_requisitos")
      .select("id, epi_id, quantidade_necessaria, quantidade_entregue, obrigatorio, status, proxima_vencimento, epis(nome_equipamento, numero_ca)")
      .eq("funcionario_id", funcionarioId)
      .order("status");
    if (error) { setErro(error.message); setLoading(false); return; }
    setReqs((data ?? []) as unknown as Requisito[]);
    setLoading(false);
  }, [funcionarioId]);

  useEffect(() => { void load(); }, [load]);

  const resumo = resumoRequisitos(reqs.map((r) => ({ status: r.status as RequisitoStatus, obrigatorio: r.obrigatorio })));
  const irregular = resumo.irregular;

  return (
    <section className="rounded-xl border border-border/80 bg-card p-5 shadow-card" aria-labelledby="kit-epi-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="app-eyebrow">Kit de EPI do cargo</p>
          <h2 id="kit-epi-heading" className="mt-1 text-base font-bold text-foreground">
            {cargoNome ? `Padrão para ${cargoNome}` : "Padrão do cargo"}
          </h2>
        </div>
        {!loading && reqs.length > 0 && (
          <Badge className={irregular ? TONE_CLASS.danger : TONE_CLASS.success}>
            {irregular ? (
              <span className="flex items-center gap-1.5"><ShieldAlert className="h-3.5 w-3.5" />Irregular</span>
            ) : (
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" />Regular</span>
            )}
          </Badge>
        )}
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
                    {canRegister && r.status !== "valid" && r.status !== "waived" && (
                      <Button size="sm" variant="outline" onClick={() => navigate(`/app/nova-entrega?funcionario=${funcionarioId}&epi=${r.epi_id}`)}>
                        {r.status === "expired" ? "Renovar" : "Registrar entrega"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
