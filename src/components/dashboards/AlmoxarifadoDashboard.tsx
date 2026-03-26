import { useEffect, useState } from "react";
import { Package, AlertTriangle, Clock, PackagePlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { KpiCard } from "@/components/KpiCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface EntregaHoje {
  id: string;
  funcionario: string;
  epi: string;
  status: string;
}

interface TopEpi {
  nome: string;
  quantidade: number;
}

export function AlmoxarifadoDashboard() {
  const { perfil } = useAuth();
  const navigate = useNavigate();
  const [entregasHoje, setEntregasHoje] = useState(0);
  const [estoqueBaixo, setEstoqueBaixo] = useState(0);
  const [episVencendo, setEpisVencendo] = useState(0);
  const [entregasMes, setEntregasMes] = useState(0);
  const [topEpis, setTopEpis] = useState<TopEpi[]>([]);
  const [ultimasHoje, setUltimasHoje] = useState<EntregaHoje[]>([]);

  useEffect(() => {
    if (!perfil?.empresa_id) return;
    const empresaId = perfil.empresa_id;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Entregas hoje
    supabase
      .from("entregas")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .gte("data_entrega", todayStart)
      .then(({ count }) => setEntregasHoje(count ?? 0));

    // Estoque baixo (≤5 unidades)
    supabase
      .from("epis")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .lte("quantidade_estoque", 5)
      .then(({ count }) => setEstoqueBaixo(count ?? 0));

    // EPIs vencendo no estoque
    supabase
      .from("epis")
      .select("id, dias_validade, created_at")
      .eq("empresa_id", empresaId)
      .then(({ data }) => {
        if (!data) return setEpisVencendo(0);
        const in30 = new Date();
        in30.setDate(in30.getDate() + 30);
        const vencendo = data.filter((epi) => {
          if (!epi.created_at) return false;
          const venc = new Date(epi.created_at);
          venc.setDate(venc.getDate() + epi.dias_validade);
          return venc <= in30 && venc > now;
        });
        setEpisVencendo(vencendo.length);
      });

    // Total de entregas no mês
    supabase
      .from("entregas")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .gte("data_entrega", startOfMonth)
      .then(({ count }) => setEntregasMes(count ?? 0));

    // Top 5 EPIs mais consumidos na semana
    supabase
      .from("entregas")
      .select("epis(nome_equipamento)")
      .eq("empresa_id", empresaId)
      .gte("data_entrega", startOfWeek.toISOString())
      .then(({ data: rows }) => {
        if (!rows || rows.length === 0) { setTopEpis([]); return; }
        const counts: Record<string, number> = {};
        rows.forEach((r) => {
          const epi = r.epis as unknown as { nome_equipamento: string } | null;
          const nome = epi?.nome_equipamento ?? "Outros";
          counts[nome] = (counts[nome] || 0) + 1;
        });
        const sorted = Object.entries(counts)
          .map(([nome, quantidade]) => ({ nome, quantidade }))
          .sort((a, b) => b.quantidade - a.quantidade)
          .slice(0, 5);
        setTopEpis(sorted);
      });

    // Últimas entregas de hoje
    supabase
      .from("entregas")
      .select("id, status_assinatura, funcionarios(nome), epis(nome_equipamento)")
      .eq("empresa_id", empresaId)
      .gte("data_entrega", todayStart)
      .order("data_entrega", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (!data) return;
        setUltimasHoje(
          data.map((row) => {
            const func = row.funcionarios as unknown as { nome: string } | null;
            const epi = row.epis as unknown as { nome_equipamento: string } | null;
            return {
              id: row.id,
              funcionario: func?.nome ?? "—",
              epi: epi?.nome_equipamento ?? "—",
              status: row.status_assinatura ?? "Pendente",
            };
          })
        );
      });
  }, [perfil?.empresa_id]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Dashboard — Almoxarifado</h1>
        <p className="text-sm text-muted-foreground">Foco em operação e estoque</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Entregas Hoje" value={entregasHoje} icon={Package} />
        <KpiCard title="EPIs Estoque Baixo" value={estoqueBaixo} icon={AlertTriangle} alert={estoqueBaixo > 0} />
        <KpiCard title="EPIs Vencendo (Estoque)" value={episVencendo} icon={Clock} alert={episVencendo > 0} />
        <KpiCard title="Total Entregas (Mês)" value={entregasMes} icon={Package} />
      </div>

      {/* Botão grande de nova entrega */}
      <Button
        size="lg"
        onClick={() => navigate("/app/nova-entrega")}
        className="w-full sm:w-auto gap-2 text-base py-6"
      >
        <PackagePlus className="h-5 w-5" /> Nova Entrega de EPI
      </Button>

      {/* Top 5 EPIs da semana */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-foreground">Top 5 EPIs Mais Consumidos</h3>
          <p className="text-xs text-muted-foreground">Semana atual</p>
        </div>
        {topEpis.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            Nenhuma entrega esta semana
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topEpis} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: "hsl(215, 16%, 47%)" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="nome" tick={{ fontSize: 11, fill: "hsl(215, 16%, 47%)" }} axisLine={false} tickLine={false} width={120} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(214, 32%, 91%)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "12px" }} />
              <Bar dataKey="quantidade" fill="hsl(239, 84%, 67%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Entregas de hoje */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Entregas Realizadas Hoje</h3>
        {ultimasHoje.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma entrega hoje</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Funcionário</th>
                  <th className="pb-3 font-medium text-muted-foreground">EPI</th>
                  <th className="pb-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ultimasHoje.map((e) => (
                  <tr key={e.id}>
                    <td className="py-3 font-medium text-foreground">{e.funcionario}</td>
                    <td className="py-3 text-foreground">{e.epi}</td>
                    <td className="py-3">
                      <Badge
                        variant={e.status === "Assinado" ? "default" : "outline"}
                        className={
                          e.status === "Assinado"
                            ? "bg-success/10 text-success border-success/20"
                            : "bg-warning/10 text-warning border-warning/20"
                        }
                      >
                        {e.status === "Assinado" ? "Assinado" : "Aguardando"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
