import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { dadosSuficientes, mediaAnterior, variacaoPercentual } from "@/lib/epi-compliance";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { AlertTriangle, BarChart3, Info, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ConsumoRow { periodo: string; setor: string; total: number; eventos: number }
interface RankingRow { epi_id: string; nome_equipamento: string; numero_ca: string; total: number; eventos: number }

const PERIODOS = [
  { value: "30", label: "Últimos 30 dias", bucket: "week" },
  { value: "90", label: "Últimos 90 dias", bucket: "month" },
  { value: "365", label: "Últimos 12 meses", bucket: "month" },
] as const;

const CORES = ["hsl(var(--primary))", "#0EA5E9", "#1D4ED8", "#38BDF8", "#1E3A8A", "#60A5FA", "#0369A1"];

export default function IndicadoresEpi() {
  const { perfil } = useAuth();
  const empresaId = perfil?.empresa_id;

  const [periodo, setPeriodo] = useState<string>("90");
  const [setorFiltro, setSetorFiltro] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [consumo, setConsumo] = useState<ConsumoRow[]>([]);
  const [ranking, setRanking] = useState<RankingRow[]>([]);

  const config = PERIODOS.find((p) => p.value === periodo) ?? PERIODOS[1];

  const load = useCallback(async () => {
    if (!empresaId) return;
    setLoading(true);
    setErro(null);
    const fim = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - Number(periodo));

    const [consumoRes, rankingRes] = await Promise.all([
      supabase.rpc("epi_consumo_por_setor", { _inicio: inicio.toISOString(), _fim: fim.toISOString(), _bucket: config.bucket }),
      supabase.rpc("epi_consumo_ranking", {
        _inicio: inicio.toISOString(),
        _fim: fim.toISOString(),
        _setor: setorFiltro === "todos" ? null : setorFiltro,
      }),
    ]);
    if (consumoRes.error || rankingRes.error) {
      setErro((consumoRes.error || rankingRes.error)!.message);
      setLoading(false);
      return;
    }
    setConsumo((consumoRes.data ?? []) as ConsumoRow[]);
    setRanking((rankingRes.data ?? []) as RankingRow[]);
    setLoading(false);
  }, [empresaId, periodo, setorFiltro, config.bucket]);

  useEffect(() => { void load(); }, [load]);

  const setores = useMemo(() => Array.from(new Set(consumo.map((r) => r.setor).filter(Boolean))).sort(), [consumo]);

  const chartData = useMemo(() => {
    const linhas = new Map<string, Record<string, number | string>>();
    for (const row of consumo) {
      if (setorFiltro !== "todos" && row.setor !== setorFiltro) continue;
      const label = format(new Date(row.periodo), config.bucket === "week" ? "dd/MM" : "MMM/yy", { locale: ptBR });
      const atual = linhas.get(label) ?? { periodo: label };
      atual[row.setor || "Sem setor"] = Number(row.total);
      linhas.set(label, atual);
    }
    return Array.from(linhas.values());
  }, [consumo, setorFiltro, config.bucket]);

  const seriesSetores = useMemo(() => {
    const s = new Set<string>();
    for (const row of consumo) {
      if (setorFiltro !== "todos" && row.setor !== setorFiltro) continue;
      s.add(row.setor || "Sem setor");
    }
    return Array.from(s).sort();
  }, [consumo, setorFiltro]);

  const totaisPorPeriodo = useMemo(
    () => chartData.map((linha) => seriesSetores.reduce((acc, key) => acc + Number(linha[key] ?? 0), 0)),
    [chartData, seriesSetores],
  );

  const totalGeral = totaisPorPeriodo.reduce((a, b) => a + b, 0);
  const ultimoIndice = totaisPorPeriodo.length - 1;
  const media = ultimoIndice > 0 ? mediaAnterior(totaisPorPeriodo, ultimoIndice) : null;
  const variacao = media !== null ? variacaoPercentual(totaisPorPeriodo[ultimoIndice], media) : null;
  const temDadosSuficientes = dadosSuficientes(totaisPorPeriodo.length);

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (erro) return (
    <div className="mx-auto max-w-[720px] rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
      <AlertTriangle className="mx-auto h-6 w-6 text-destructive" />
      <p className="mt-3 font-semibold text-foreground">Não foi possível carregar os indicadores</p>
      <p className="mt-1 text-sm text-muted-foreground">{erro}</p>
      <Button className="mt-4" onClick={() => void load()}>Tentar novamente</Button>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1240px] space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="app-eyebrow">Consumo de EPI</p>
          <h1 className="mt-1 text-[27px] font-bold tracking-tight text-foreground">Indicadores por setor</h1>
          <p className="mt-2 text-sm text-muted-foreground">Volume entregue por setor e equipamentos mais consumidos, somando entregas avulsas e de kit.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PERIODOS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={setorFiltro} onValueChange={setSetorFiltro}>
            <SelectTrigger className="w-[190px]"><SelectValue placeholder="Setor" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os setores</SelectItem>
              {setores.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {consumo.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Sem consumo registrado no período"
          description="Assim que as entregas de EPI forem registradas, os indicadores de consumo por setor aparecerão aqui."
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/80 bg-card p-5 shadow-card">
              <p className="app-eyebrow">Itens entregues</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{totalGeral}</p>
              <p className="mt-1 text-xs text-muted-foreground">no período selecionado</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-card p-5 shadow-card">
              <p className="app-eyebrow">Variação recente</p>
              {temDadosSuficientes && variacao !== null ? (
                <>
                  <p className={`mt-2 flex items-center gap-2 text-3xl font-bold tracking-tight ${variacao > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                    {variacao > 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                    {variacao > 0 ? "+" : ""}{variacao}%
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">último período vs. média anterior</p>
                </>
              ) : (
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Ainda não há histórico suficiente para comparar períodos com segurança.</p>
              )}
            </div>
            <div className="rounded-xl border border-border/80 bg-card p-5 shadow-card">
              <p className="app-eyebrow">Setores com consumo</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{seriesSetores.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">setores com entregas no período</p>
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-card p-5 shadow-card">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="app-eyebrow">Volume entregue</p>
                <h2 className="mt-1 text-sm font-bold text-foreground">Consumo por setor ao longo do tempo</h2>
              </div>
              <Badge variant="outline" className="text-[11px]">{config.bucket === "week" ? "Agrupado por semana" : "Agrupado por mês"}</Badge>
            </div>
            <div className="mt-4 h-[320px]" role="img" aria-label="Gráfico de barras com o consumo de EPI por setor ao longo do período">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="periodo" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {seriesSetores.map((setor, i) => (
                    <Bar key={setor} dataKey={setor} stackId="a" fill={CORES[i % CORES.length]} radius={i === seriesSetores.length - 1 ? [6, 6, 0, 0] : undefined} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-card">
            <div className="border-b border-border/80 p-5">
              <p className="app-eyebrow">Ranking</p>
              <h2 className="mt-1 text-sm font-bold text-foreground">Equipamentos mais consumidos</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/25">
                    <th className="px-4 py-3 text-left app-eyebrow">Equipamento</th>
                    <th className="px-4 py-3 text-left app-eyebrow">CA</th>
                    <th className="px-4 py-3 text-right app-eyebrow">Itens</th>
                    <th className="px-4 py-3 text-right app-eyebrow">Entregas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {ranking.map((r) => (
                    <tr key={r.epi_id} className="transition-colors hover:bg-primary-50/45">
                      <td className="px-4 py-3 font-semibold text-foreground">{r.nome_equipamento}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.numero_ca}</td>
                      <td className="px-4 py-3 text-right font-bold text-foreground">{r.total}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{r.eventos}</td>
                    </tr>
                  ))}
                  {ranking.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-10 text-center text-xs text-muted-foreground">Nenhuma entrega no período e filtro escolhidos.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-primary-100 bg-primary-50/60 p-3 text-xs text-primary-600">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Os indicadores consideram a quantidade de itens entregues. Valores financeiros não são exibidos porque o catálogo ainda não possui preço de custo cadastrado.</p>
          </div>
        </>
      )}
    </div>
  );
}
