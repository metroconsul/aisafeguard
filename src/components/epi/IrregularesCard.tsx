import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react";

interface Linha {
  funcionario_id: string;
  nome: string;
  cargo: string | null;
  vencidos: number;
  pendentes: number;
}

export function IrregularesCard() {
  const { perfil } = useAuth();
  const navigate = useNavigate();
  const empresaId = perfil?.empresa_id;
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [linhas, setLinhas] = useState<Linha[]>([]);

  const load = useCallback(async () => {
    if (!empresaId) return;
    setLoading(true);
    setErro(null);
    const { data, error } = await supabase
      .from("funcionario_epi_requisitos")
      .select("funcionario_id, status, obrigatorio, funcionarios(nome, cargo)")
      .eq("empresa_id", empresaId)
      .eq("obrigatorio", true)
      .in("status", ["pending", "partial", "expired"]);
    if (error) { setErro(error.message); setLoading(false); return; }

    const mapa = new Map<string, Linha>();
    for (const row of (data ?? []) as unknown as {
      funcionario_id: string; status: string; funcionarios: { nome: string; cargo: string | null } | null;
    }[]) {
      const atual = mapa.get(row.funcionario_id) ?? {
        funcionario_id: row.funcionario_id,
        nome: row.funcionarios?.nome ?? "Colaborador",
        cargo: row.funcionarios?.cargo ?? null,
        vencidos: 0,
        pendentes: 0,
      };
      if (row.status === "expired") atual.vencidos += 1; else atual.pendentes += 1;
      mapa.set(row.funcionario_id, atual);
    }
    setLinhas(Array.from(mapa.values()).sort((a, b) => b.vencidos - a.vencidos || b.pendentes - a.pendentes));
    setLoading(false);
  }, [empresaId]);

  useEffect(() => { void load(); }, [load]);

  return (
    <section className="rounded-xl border border-border/80 bg-card p-5 shadow-card" aria-labelledby="irregulares-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="app-eyebrow">Conformidade de EPI</p>
          <h2 id="irregulares-heading" className="mt-1 text-base font-bold text-foreground">Colaboradores irregulares</h2>
          <p className="mt-1 text-xs text-muted-foreground">Itens obrigatórios do kit vencidos ou ainda não entregues.</p>
        </div>
        {!loading && linhas.length > 0 && (
          <Badge className="border-destructive/30 bg-destructive/10 text-destructive">{linhas.length} a regularizar</Badge>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : erro ? (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p className="font-semibold text-foreground">Não foi possível carregar a conformidade</p>
          <p className="mt-1 text-xs text-muted-foreground">{erro}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => void load()}>Tentar novamente</Button>
        </div>
      ) : linhas.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={ShieldCheck}
            title="Todos os colaboradores estão regulares"
            description="Nenhum item obrigatório de kit está vencido ou pendente de entrega neste momento."
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {linhas.slice(0, 8).map((l) => (
            <li key={l.funcionario_id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/15 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{l.nome}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {l.cargo ?? "Cargo não informado"} ·{" "}
                  {l.vencidos > 0 && <span className="font-medium text-destructive">{l.vencidos} vencido{l.vencidos > 1 ? "s" : ""}</span>}
                  {l.vencidos > 0 && l.pendentes > 0 && " · "}
                  {l.pendentes > 0 && <span className="font-medium text-amber-600">{l.pendentes} pendente{l.pendentes > 1 ? "s" : ""}</span>}
                </p>
              </div>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate(`/app/funcionarios/${l.funcionario_id}`)}>
                <ShieldAlert className="h-3.5 w-3.5" />Regularizar
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
