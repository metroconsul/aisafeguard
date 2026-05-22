import { useEffect, useState } from "react";
import { Users, DollarSign, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { KpiCard } from "@/components/KpiCard";
import { CustoEpiObraChart } from "@/components/charts/CustoEpiObraChart";
import { EntregasSemanaChart } from "@/components/charts/EntregasSemanaChart";
import { UltimasEntregasTable } from "@/components/UltimasEntregasTable";

export function AdminDashboard() {
  const { perfil } = useAuth();
  const [funcAtivos, setFuncAtivos] = useState(0);
  const [custoEpiMes, setCustoEpiMes] = useState(0);
  const [taxaAssinaturas, setTaxaAssinaturas] = useState("0%");
  const [alertaCritico, setAlertaCritico] = useState(0);

  useEffect(() => {
    if (!perfil?.empresa_id) return;
    const empresaId = perfil.empresa_id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    // Funcionários ativos
    supabase
      .from("funcionarios")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .eq("status", "ativo")
      .then(({ count }) => setFuncAtivos(count ?? 0));

    // Custo EPI mês (contagem de entregas como proxy)
    supabase
      .from("entregas")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .gte("data_entrega", startOfMonth)
      .then(({ count }) => setCustoEpiMes(count ?? 0));

    // Taxa de assinaturas global
    supabase
      .from("entregas")
      .select("id, status_assinatura")
      .eq("empresa_id", empresaId)
      .then(({ data }) => {
        if (!data || data.length === 0) return setTaxaAssinaturas("0%");
        const assinadas = data.filter((e) => e.status_assinatura === "Assinado").length;
        setTaxaAssinaturas(`${((assinadas / data.length) * 100).toFixed(1)}%`);
      });

    // Alerta crítico: ASOs + NRs vencendo
    const in30Str = in30Days.toISOString().split("T")[0];
    Promise.all([
      supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("empresa_id", empresaId)
        .in("doc_category", ["aso_exames", "aso"])
        .not("expiration_date", "is", null)
        .lte("expiration_date", in30Str),
      supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("empresa_id", empresaId)
        .eq("doc_category", "treinamento_nr")
        .not("expiration_date", "is", null)
        .lte("expiration_date", in30Str),
    ]).then(([asos, nrs]) => {
      setAlertaCritico((asos.count ?? 0) + (nrs.count ?? 0));
    });
  }, [perfil?.empresa_id]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Visão panorâmica e estratégica</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Funcionários Ativos" value={funcAtivos} icon={Users} />
        <KpiCard title="Entregas de EPI (Mês)" value={custoEpiMes} icon={DollarSign} />
        <KpiCard title="Taxa Global de Assinaturas" value={taxaAssinaturas} icon={CheckCircle2} />
        <KpiCard
          title="Alerta Crítico (30 dias)"
          value={alertaCritico}
          icon={AlertTriangle}
          alert={alertaCritico > 0}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <CustoEpiObraChart />
        </div>
        <div className="lg:col-span-2">
          <EntregasSemanaChart />
        </div>
      </div>

      <UltimasEntregasTable />
    </div>
  );
}
