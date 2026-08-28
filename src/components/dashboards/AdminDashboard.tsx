import { useEffect, useState } from "react";
import { Activity, AlertTriangle, ArrowUpRight, CheckCircle2, PackageCheck, Plus, ShieldCheck, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { CustoEpiObraChart } from "@/components/charts/CustoEpiObraChart";
import { EntregasSemanaChart } from "@/components/charts/EntregasSemanaChart";
import { UltimasEntregasTable } from "@/components/UltimasEntregasTable";
import { InsightsCard } from "@/components/dashboards/InsightsCard";
import { AtividadeRecenteCard } from "@/components/dashboards/AtividadeRecenteCard";
import { useNavigate } from "react-router-dom";
import { IrregularesCard } from "@/components/epi/IrregularesCard";

 type Trend = { value: string; positive: boolean } | null;

function calcTrend(atual: number, anterior: number): Trend {
  if (!anterior) return null;
  const delta = ((atual - anterior) / anterior) * 100;
  if (!isFinite(delta)) return null;
  return { value: `${Math.abs(delta).toFixed(1)}%`, positive: delta >= 0 };
}

function MetricTile({ label, value, helper, icon: Icon }: { label: string; value: string | number; helper: string; icon: typeof Users }) {
  return (
    <div className="border-l border-white/15 pl-4 first:border-l-0 first:pl-0">
      <div className="flex items-center gap-2 text-white/60">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em]">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums text-white">{value}</p>
      <p className="mt-1 text-[10px] text-white/50">{helper}</p>
    </div>
  );
}

export function AdminDashboard() {
  const { perfil } = useAuth();
  const navigate = useNavigate();
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

    supabase.from("funcionarios").select("id", { count: "exact", head: true }).eq("empresa_id", empresaId).eq("status", "ativo").then(({ count }) => setFuncAtivos(count ?? 0));
    supabase.from("funcionarios").select("id", { count: "exact", head: true }).eq("empresa_id", empresaId).eq("status", "ativo").lt("created_at", startOfMonth).then(({ count: anterior }) => {
      supabase.from("funcionarios").select("id", { count: "exact", head: true }).eq("empresa_id", empresaId).eq("status", "ativo").then(({ count: atual }) => setFuncTrend(calcTrend(atual ?? 0, anterior ?? 0)));
    });

    Promise.all([
      supabase.from("entregas").select("id", { count: "exact", head: true }).eq("empresa_id", empresaId).gte("data_entrega", startOfMonth),
      supabase.from("entregas").select("id", { count: "exact", head: true }).eq("empresa_id", empresaId).gte("data_entrega", startOfPrevMonth).lt("data_entrega", startOfMonth),
    ]).then(([mes, mesAnterior]) => {
      setCustoEpiMes(mes.count ?? 0);
      setEntregasTrend(calcTrend(mes.count ?? 0, mesAnterior.count ?? 0));
    });

    Promise.all([
      supabase.from("entregas").select("id, status_assinatura").eq("empresa_id", empresaId),
      supabase.from("entregas").select("id, status_assinatura").eq("empresa_id", empresaId).lt("created_at", startOfMonth),
    ]).then(([todas, ateMesAnterior]) => {
      const taxa = (rows: { status_assinatura: string | null }[] | null) => {
        if (!rows || rows.length === 0) return null;
        return (rows.filter((e) => e.status_assinatura === "Assinado").length / rows.length) * 100;
      };
      const atual = taxa(todas.data);
      const anterior = taxa(ateMesAnterior.data);
      setTaxaAssinaturas(atual === null ? "0%" : `${atual.toFixed(1)}%`);
      setTaxaTrend(atual !== null && anterior !== null && anterior > 0 ? calcTrend(atual, anterior) : null);
    });

    const in30Str = in30Days.toISOString().split("T")[0];
    Promise.all([
      supabase.from("documents").select("id", { count: "exact", head: true }).eq("empresa_id", empresaId).in("doc_category", ["aso_exames", "aso"]).not("expiration_date", "is", null).lte("expiration_date", in30Str),
      supabase.from("documents").select("id", { count: "exact", head: true }).eq("empresa_id", empresaId).eq("doc_category", "treinamento_nr").not("expiration_date", "is", null).lte("expiration_date", in30Str),
    ]).then(([asos, nrs]) => setAlertaCritico((asos.count ?? 0) + (nrs.count ?? 0)));
  }, [perfil?.empresa_id]);

  const dataFormatada = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const trendText = (trend: Trend, fallback: string) => trend ? `${trend.positive ? "↑" : "↓"} ${trend.value} ${fallback}` : fallback;

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="app-eyebrow">Centro de controle</p>
          <h1 className="mt-1 text-[27px] font-bold tracking-tight text-foreground">Visão geral</h1>
          <p className="mt-2 text-sm text-muted-foreground">O que precisa da sua atenção hoje.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-lg border border-primary-100 bg-card px-3 py-2 text-xs font-semibold capitalize text-primary-500 shadow-card sm:inline-flex">{dataFormatada}</span>
          <Button onClick={() => navigate("/app/nova-entrega")} className="h-10 px-4"><Plus className="h-4 w-4" />Nova entrega</Button>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl bg-primary-500 shadow-elevated">
        <div className="grid gap-8 p-6 text-white lg:grid-cols-[1.05fr_.95fr] lg:p-8">
          <div className="flex flex-col justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md bg-white/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-secondary-200"><span className="h-1.5 w-1.5 rounded-full bg-secondary-300" />Operação monitorada</div>
              <h2 className="mt-5 max-w-md text-3xl font-bold leading-tight tracking-[-0.04em]">Sua operação está protegida.</h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/65">Acompanhe os principais sinais de SST, RH e distribuição de EPIs antes que virem pendências.</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-white/70"><Activity className="h-4 w-4 text-secondary-300" />Dados atualizados em tempo real</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.07] p-5 lg:p-6">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/50">Índice de assinaturas</p><p className="mt-2 text-5xl font-bold tracking-[-0.06em]">{taxaAssinaturas}</p></div><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary-400/15 text-secondary-200"><ShieldCheck className="h-5 w-5" strokeWidth={1.8} /></div></div>
            <div className="mt-5 grid grid-cols-3 gap-4"><MetricTile label="Ativos" value={funcAtivos} helper={trendText(funcTrend, "pessoas") } icon={Users} /><MetricTile label="Entregas" value={custoEpiMes} helper={trendText(entregasTrend, "este mês")} icon={PackageCheck} /><MetricTile label="Alertas" value={alertaCritico} helper={alertaCritico ? "requer atenção" : "sem críticos"} icon={AlertTriangle} /></div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-black/10 px-6 py-3.5 text-xs text-white/60 lg:px-8"><span>Última atualização: agora</span><button onClick={() => navigate("/app/seguranca")} className="inline-flex items-center gap-1 font-bold text-secondary-200 transition-colors hover:text-white">Ver central de segurança <ArrowUpRight className="h-3.5 w-3.5" /></button></div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_.85fr]"><CustoEpiObraChart /><InsightsCard /></div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_.85fr]"><IrregularesCard /><AtividadeRecenteCard /></div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_.85fr]"><UltimasEntregasTable /><div className="space-y-4"><EntregasSemanaChart /></div></div>
    </div>
  );
}
