import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "@/components/EmptyState";

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface DiaData { dia: string; entregas: number }

export function EntregasSemanaChart() {
  const { perfil } = useAuth();
  const [data, setData] = useState<DiaData[]>(DIAS.map((d) => ({ dia: d, entregas: 0 })));
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!perfil?.empresa_id) return;

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    supabase
      .from("entregas")
      .select("data_entrega")
      .eq("empresa_id", perfil.empresa_id)
      .gte("data_entrega", startOfWeek.toISOString())
      .then(({ data: rows }) => {
        const counts = Array(7).fill(0);
        (rows ?? []).forEach((r) => {
          if (r.data_entrega) counts[new Date(r.data_entrega).getDay()]++;
        });
        setData(DIAS.map((d, i) => ({ dia: d, entregas: counts[i] })));
        setTotal(counts.reduce((a, b) => a + b, 0));
      });
  }, [perfil?.empresa_id]);

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100/50 p-6">
      <div className="mb-4">
        <h3 className="text-base font-bold text-gray-900">Entregas na Semana</h3>
        <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-foreground">{total}</p>
      </div>
      {total === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Sem entregas esta semana"
          description="As entregas registradas aparecerão neste gráfico em tempo real."
        />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="entregasGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(239 84% 67%)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="hsl(239 84% 67%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="dia" tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }} axisLine={false} tickLine={false} width={28} />
            <Tooltip
              cursor={{ stroke: "hsl(239 84% 67%)", strokeWidth: 1, strokeDasharray: "3 3" }}
              contentStyle={{
                borderRadius: "10px",
                border: "none",
                boxShadow: "0 10px 24px -8px rgba(17,24,39,.18)",
                fontSize: "12px",
                padding: "8px 12px",
              }}
            />
            <Area
              type="monotone"
              dataKey="entregas"
              stroke="hsl(239 84% 67%)"
              strokeWidth={2.5}
              fill="url(#entregasGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
