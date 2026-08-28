import { useCallback, useEffect, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { STATUS_META, TONE_CLASS, type RequisitoStatus } from "@/lib/epi-compliance";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HardHat, Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Requisito {
  id: string;
  quantidade_necessaria: number;
  quantidade_entregue: number;
  obrigatorio: boolean;
  status: string;
  proxima_vencimento: string | null;
  epis?: { nome_equipamento: string; numero_ca: string } | null;
}

export function MeuKitCard() {
  const { employee, portalApi } = usePortalAuth();
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [reqs, setReqs] = useState<Requisito[]>([]);
  const [modo, setModo] = useState<string>("none");

  const load = useCallback(async () => {
    if (!employee) return;
    setLoading(true);
    setErro(null);
    try {
      const r = await portalApi<{ requisitos: Requisito[]; policy: { modo: string } }>("get_meu_kit");
      setReqs(r.requisitos ?? []);
      setModo(r.policy?.modo ?? "none");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar seu kit");
    }
    setLoading(false);
  }, [employee, portalApi]);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center rounded-2xl border border-border bg-card py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (erro) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-semibold text-foreground">Não foi possível carregar seu kit</p>
        <p className="mt-1 text-xs text-muted-foreground">{erro}</p>
        <Button size="sm" variant="outline" className="mt-3" onClick={() => void load()}>Tentar novamente</Button>
      </div>
    );
  }

  if (reqs.length === 0) return null;

  const pendentes = reqs.filter((r) => r.obrigatorio && ["pending", "partial", "expired"].includes(r.status));
  const irregular = pendentes.length > 0;

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm" aria-labelledby="meu-kit-heading">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <HardHat className="h-5 w-5 text-primary" />
          <h2 id="meu-kit-heading" className="text-base font-bold text-foreground">Meu kit de EPI</h2>
        </div>
        <Badge className={irregular ? TONE_CLASS.danger : TONE_CLASS.success}>
          {irregular ? (
            <span className="flex items-center gap-1"><ShieldAlert className="h-3.5 w-3.5" />Pendências</span>
          ) : (
            <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" />Em dia</span>
          )}
        </Badge>
      </div>

      {irregular && (
        <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs leading-relaxed text-destructive">
          {modo === "hard_block"
            ? "Procure seu supervisor para receber os equipamentos. O registro de ponto está bloqueado até a regularização."
            : "Você tem equipamentos obrigatórios pendentes. Procure seu supervisor para regularizar."}
        </p>
      )}

      <ul className="mt-3 space-y-2">
        {reqs.map((r) => {
          const key = (r.status as RequisitoStatus) in STATUS_META ? (r.status as RequisitoStatus) : "pending";
          const meta = STATUS_META[key];
          return (
            <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{r.epis?.nome_equipamento ?? "Equipamento"}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {r.quantidade_entregue}/{r.quantidade_necessaria} recebido
                  {r.proxima_vencimento ? ` · troca em ${format(new Date(r.proxima_vencimento), "dd/MM/yyyy", { locale: ptBR })}` : ""}
                </p>
              </div>
              <Badge className={`${TONE_CLASS[meta.tone]} shrink-0 text-[11px]`}>{meta.portalLabel}</Badge>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
