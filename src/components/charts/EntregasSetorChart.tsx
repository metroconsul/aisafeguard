import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const COLORS: Record<string, string> = {
  Produção: "hsl(239, 84%, 67%)",
  Manutenção: "hsl(187, 85%, 53%)",
  Elétrica: "hsl(217, 91%, 60%)",
  Laboratório: "hsl(142, 71%, 45%)",
  Logística: "hsl(215, 16%, 47%)",
};

interface ChartRow {
  mes: string;
  [setor: string]: string | number;
}

export function EntregasSetorChart() {
  const { perfil } = useAuth();
  const [data, setData] = useState<ChartRow[]>([]);
  const [setores, setSetores] = useState<string[]>([]);

  useEffect(() => {
    if (!perfil?.empresa_id) return;

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    supabase
      .from("entregas")
      .select("data_entrega, funcionarios(setor)")
      .eq("empresa_id", perfil.empresa_id)
      .gte("data_entrega", sixMonthsAgo.toISOString())
      .then(({ data: rows }) => {
        if (!rows || rows.length === 0) {
          setData([]);
          setSetores([]);
          return;
        }

        const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const buckets: Record<string, Record<string, number>> = {};
        const allSetores = new Set<string>();

        rows.forEach((row) => {
          if (!row.data_entrega) return;
          const d = new Date(row.data_entrega);
          const mesKey = meses[d.getMonth()];
          const func = row.funcionarios as unknown as { setor: string } | null;
          const setor = func?.setor ?? "Outros";
          allSetores.add(setor);
          if (!buckets[mesKey]) buckets[mesKey] = {};
          buckets[mesKey][setor] = (buckets[mesKey][setor] || 0) + 1;
        });

        const setoresList = Array.from(allSetores);
        setSetores(setoresList);

        const now = new Date();
        const chartData: ChartRow[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const mesKey = meses[d.getMonth()];
          const row: ChartRow = { mes: mesKey };
          setoresList.forEach((s) => { row[s] = buckets[mesKey]?.[s] || 0; });
          chartData.push(row);
        }
        setData(chartData);
      });
  }, [perfil?.empresa_id]);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">Entregas por Setor</h3>
        <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
      </div>
      {data.length === 0 ? (
        <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
          Nenhuma entrega registrada
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" vertical={false} />
            <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "hsl(215, 16%, 47%)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "hsl(215, 16%, 47%)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(214, 32%, 91%)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "12px" }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
            {setores.map((key, i) => (
              <Bar key={key} dataKey={key} stackId="a" fill={COLORS[key] || `hsl(${(i * 60) % 360}, 70%, 55%)`} radius={i === setores.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
