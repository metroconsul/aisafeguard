import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface DiaData { dia: string; entregas: number }

export function EntregasSemanaChart() {
  const { perfil } = useAuth();
  const [data, setData] = useState<DiaData[]>(DIAS.map((d) => ({ dia: d, entregas: 0 })));
  const [total, setTotal] = useState(0);
  const today = new Date().getDay();

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
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">Entregas na Semana</h3>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{total}</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" vertical={false} />
          <XAxis dataKey="dia" tick={{ fontSize: 12, fill: "hsl(215, 16%, 47%)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "hsl(215, 16%, 47%)" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(214, 32%, 91%)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "12px" }} />
          <Bar dataKey="entregas" radius={[4, 4, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={index === today ? "hsl(239, 84%, 67%)" : "hsl(239, 84%, 67%, 0.3)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
