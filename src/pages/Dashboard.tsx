import { useEffect, useState } from "react";
import { Package, AlertTriangle, CheckCircle2, Stethoscope, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { KpiCard } from "@/components/KpiCard";
import { EntregasSetorChart } from "@/components/charts/EntregasSetorChart";
import { EntregasSemanaChart } from "@/components/charts/EntregasSemanaChart";
import { DistribuicaoEpiChart } from "@/components/charts/DistribuicaoEpiChart";
import { CustoEpiObraChart } from "@/components/charts/CustoEpiObraChart";
import { UltimasEntregasTable } from "@/components/UltimasEntregasTable";

export default function Dashboard() {
  const { perfil } = useAuth();
  const [entregasMes, setEntregasMes] = useState(0);
  const [episVencidos, setEpisVencidos] = useState(0);
  const [taxaAssinaturas, setTaxaAssinaturas] = useState("0%");
  const [asosVencendo, setAsosVencendo] = useState(0);
  const [nrsVencendo, setNrsVencendo] = useState(0);

  useEffect(() => {
    if (!perfil?.empresa_id) return;

    const empresaId = perfil.empresa_id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    supabase
      .from("entregas")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .gte("data_entrega", startOfMonth)
      .then(({ count }) => setEntregasMes(count ?? 0));

    supabase
      .from("epis")
      .select("id, dias_validade, created_at")
      .eq("empresa_id", empresaId)
      .then(({ data }) => {
        if (!data) return setEpisVencidos(0);
        const vencidos = data.filter((epi) => {
          if (!epi.created_at) return false;
          const vencimento = new Date(epi.created_at);
          vencimento.setDate(vencimento.getDate() + epi.dias_validade);
          return vencimento <= now;
        });
        setEpisVencidos(vencidos.length);
      });

    supabase
      .from("entregas")
      .select("id, status_assinatura")
      .eq("empresa_id", empresaId)
      .then(({ data }) => {
        if (!data || data.length === 0) return setTaxaAssinaturas("0%");
        const assinadas = data.filter((e) => e.status_assinatura === "Assinado").length;
        const taxa = ((assinadas / data.length) * 100).toFixed(1);
        setTaxaAssinaturas(`${taxa}%`);
      });

    // ASOs vencendo em 30 dias
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .in("doc_category", ["aso_exames", "aso"])
      .not("expiration_date", "is", null)
      .lte("expiration_date", in30Days.toISOString().split("T")[0])
      .then(({ count }) => setAsosVencendo(count ?? 0));

    // NRs/Treinamentos vencendo em 30 dias
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .eq("doc_category", "treinamento_nr")
      .not("expiration_date", "is", null)
      .lte("expiration_date", in30Days.toISOString().split("T")[0])
      .then(({ count }) => setNrsVencendo(count ?? 0));
  }, [perfil?.empresa_id]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Gestão de Conformidade em Tempo Real</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
        <KpiCard title="Entregas no Mês" value={entregasMes} icon={Package} />
        <KpiCard
          title="EPIs Vencidos / A Vencer"
          value={episVencidos}
          icon={AlertTriangle}
          alert={episVencidos > 0}
        />
        <KpiCard title="Taxa de Assinaturas" value={taxaAssinaturas} icon={CheckCircle2} />
      </div>

      {/* Alert Section */}
      {(asosVencendo > 0 || nrsVencendo > 0) && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-destructive uppercase tracking-wider">
            ⚠ Atenção Crítica — Vencimentos (30 dias)
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border-2 border-destructive/30 bg-destructive/5 p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                <Stethoscope className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive tabular-nums">{asosVencendo}</p>
                <p className="text-xs font-medium text-destructive/80">ASOs Vencendo</p>
              </div>
            </div>
            <div className="rounded-xl border-2 border-destructive/30 bg-destructive/5 p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                <GraduationCap className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive tabular-nums">{nrsVencendo}</p>
                <p className="text-xs font-medium text-destructive/80">NRs / Treinamentos Vencendo</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <EntregasSetorChart />
        </div>
        <div className="lg:col-span-2">
          <EntregasSemanaChart />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <DistribuicaoEpiChart />
        </div>
        <div className="lg:col-span-3">
          <CustoEpiObraChart />
        </div>
      </div>

      <UltimasEntregasTable />
    </div>
  );
}
