import { Package, AlertTriangle, CheckCircle2 } from "lucide-react";
import { KpiCard } from "@/components/KpiCard";
import { EntregasSetorChart } from "@/components/charts/EntregasSetorChart";
import { EntregasSemanaChart } from "@/components/charts/EntregasSemanaChart";
import { DistribuicaoEpiChart } from "@/components/charts/DistribuicaoEpiChart";
import { UltimasEntregasTable } from "@/components/UltimasEntregasTable";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Gestão de Conformidade em Tempo Real</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          title="Entregas no Mês"
          value={127}
          trend={{ value: "15.8%", positive: true }}
          icon={Package}
        />
        <KpiCard
          title="EPIs Vencidos / A Vencer"
          value={8}
          trend={{ value: "3 novos", positive: false }}
          icon={AlertTriangle}
          alert
        />
        <KpiCard
          title="Taxa de Assinaturas"
          value="86.5%"
          trend={{ value: "4.2%", positive: true }}
          icon={CheckCircle2}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <EntregasSetorChart />
        </div>
        <div className="lg:col-span-2">
          <EntregasSemanaChart />
        </div>
      </div>

      {/* Bottom Row */}
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
