import { useEffect, useState } from "react";
import { Users, PackageCheck, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { KpiCard } from "@/components/KpiCard";
import { CustoEpiObraChart } from "@/components/charts/CustoEpiObraChart";
import { EntregasSemanaChart } from "@/components/charts/EntregasSemanaChart";
import { UltimasEntregasTable } from "@/components/UltimasEntregasTable";
import { InsightsCard } from "@/components/dashboards/InsightsCard";
import { AtividadeRecenteCard } from "@/components/dashboards/AtividadeRecenteCard";

type Trend = { value: string; positive: boolean } | null;

function calcTrend(atual: number, anterior: number): Trend {
  if (!anterior) return null;
  const delta = ((atual - anterior) / anterior) * 100;
  if (!isFinite(delta)) return null;
  return { value: `${Math.abs(delta).toFixed(1)}%`, positive: delta >= 0 };
}

export function AdminDashboard() {
  const { perfil } = useAuth();
  const [funcAtivos, setFuncAtivos] = useState(0);
  const [funcTrend, setFuncTrend] = useState<Trend>(null);
  const [custoEpiMes, setCustoEpiMes] = useState(0);
  const [entregasTrend, setEntregasTrend] = useState<Trend>(null);
  const [taxaAssinaturas, setTaxaAssinaturas] = useState("0%");
  const [taxaTrend, setTaxaTrend] = useState<Trend>(null);
  const [alertaCritico, setAlertaCritico] = useState(0);

  useEffect(() => {
    if (!perfil?.empresa_id) return;
    const empresaId = perfil.empresa_id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    // Funcionários ativos
    supabase
      .from("funcionarios")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .eq("status", "ativo")
      .then(({ count }) => setFuncAtivos(count ?? 0));

    // Funcionários ativos admitidos até o fim do mês anterior (base de comparação)
    supabase
      .from("funcionarios")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .eq("status", "ativo")
      .lt("created_at", startOfMonth)
      .then(({ count: anterior }) => {
        supabase
          .from("funcionarios")
          .select("id", { count: "exact", head: true })
          .eq("empresa_id", empresaId)
          .eq("status", "ativo")
          .then(({ count: atual }) => setFuncTrend(calcTrend(atual ?? 0, anterior ?? 0)));
      });

    // Entregas do mês e do mês anterior
    Promise.all([
      supabase
        .from("entregas")
        .select("id", { count: "exact", head: true })
        .eq("empresa_id", empresaId)
        .gte("data_entrega", startOfMonth),
      supabase
        .from("entregas")
        .select("id", { count: "exact", head: true })
        .eq("empresa_id", empresaId)
        .gte("data_entrega", startOfPrevMonth)
        .lt("data_entrega", startOfMonth),
    ]).then(([mes, mesAnterior]) => {
      setCustoEpiMes(mes.count ?? 0);
      setEntregasTrend(calcTrend(mes.count ?? 0, mesAnterior.count ?? 0));
    });

    // Taxa de assinaturas global + comparação com o mês anterior
    Promise.all([
      supabase.from("entregas").select("id, status_assinatura").eq("empresa_id", empresaId),
      supabase
        .from("entregas")
        .select("id, status_assinatura")
        .eq("empresa_id", empresaId)
        .lt("created_at", startOfMonth),
    ]).then(([todas, ateMesAnterior]) => {
      const taxa = (rows: { status_assinatura: string | null }[] | null) => {
        if (!rows || rows.length === 0) return null;
        return (rows.filter((e) => e.status_assinatura === "Assinado").length / rows.length) * 100;
      };
      const atual = taxa(todas.data);
      const anterior = taxa(ateMesAnterior.data);
      setTaxaAssinaturas(atual === null ? "0%" : `${atual.toFixed(1)}%`);
      if (atual !== null && anterior !== null && anterior > 0) {
        setTaxaTrend(calcTrend(atual, anterior));
      } else {
        setTaxaTrend(null);
      }
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

  const dataFormatada = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Visão panorâmica e estratégica</p>
        </div>
        <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium capitalize text-primary-500">
          {dataFormatada} • Tempo real
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Funcionários Ativos" value={funcAtivos} icon={Users} tone="primary" trend={funcTrend} delayMs={0} />
        <KpiCard title="Entregas de EPI (Mês)" value={custoEpiMes} icon={PackageCheck} tone="secondary" trend={entregasTrend} delayMs={75} />
        <KpiCard title="Taxa de Assinaturas" value={taxaAssinaturas} icon={CheckCircle2} tone="warning" trend={taxaTrend} delayMs={150} />
        <KpiCard
          title="Alerta Crítico (30 dias)"
          value={alertaCritico}
          icon={AlertTriangle}
          tone="destructive"
          alert={alertaCritico > 0}
          trend={null}
          delayMs={225}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <CustoEpiObraChart />
        </div>
        <div className="lg:col-span-2">
          <InsightsCard />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <UltimasEntregasTable />
        </div>
        <div className="lg:col-span-2 space-y-5">
          <EntregasSemanaChart />
          <AtividadeRecenteCard />
        </div>
      </div>
    </div>
  );
}
