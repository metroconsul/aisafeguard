import { useEffect, useState } from "react";
import { Package, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { KpiCard } from "@/components/KpiCard";
import { EntregasSetorChart } from "@/components/charts/EntregasSetorChart";
import { EntregasSemanaChart } from "@/components/charts/EntregasSemanaChart";
import { DistribuicaoEpiChart } from "@/components/charts/DistribuicaoEpiChart";
import { UltimasEntregasTable } from "@/components/UltimasEntregasTable";

export default function Dashboard() {
  const { perfil } = useAuth();
  const [entregasMes, setEntregasMes] = useState(0);
  const [episVencidos, setEpisVencidos] = useState(0);
  const [taxaAssinaturas, setTaxaAssinaturas] = useState("0%");

  useEffect(() => {
    if (!perfil?.empresa_id) return;

    const empresaId = perfil.empresa_id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Entregas no mês
    supabase
      .from("entregas")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .gte("data_entrega", startOfMonth)
      .then(({ count }) => setEntregasMes(count ?? 0));

    // EPIs vencidos / a vencer (dias_validade já passou baseado no created_at)
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

    // Taxa de assinaturas
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
  }, [perfil?.empresa_id]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Gestão de Conformidade em Tempo Real</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard title="Entregas no Mês" value={entregasMes} icon={Package} />
        <KpiCard
          title="EPIs Vencidos / A Vencer"
          value={episVencidos}
          icon={AlertTriangle}
          alert={episVencidos > 0}
        />
        <KpiCard title="Taxa de Assinaturas" value={taxaAssinaturas} icon={CheckCircle2} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <EntregasSetorChart />
        </div>
        <div className="lg:col-span-2">
          <EntregasSemanaChart />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <DistribuicaoEpiChart />
        </div>
        <div className="lg:col-span-3">
          <UltimasEntregasTable />
        </div>
      </div>
    </div>
  );
}
