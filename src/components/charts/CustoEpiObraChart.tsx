import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ChartRow {
  obra: string;
  entregas: number;
}

export function CustoEpiObraChart() {
  const { perfil } = useAuth();
  const [data, setData] = useState<ChartRow[]>([]);

  useEffect(() => {
    if (!perfil?.empresa_id) return;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    supabase
      .from("documents")
      .select("worksite")
      .eq("empresa_id", perfil.empresa_id)
      .eq("doc_category", "epi")
      .gte("created_at", startOfMonth)
      .then(({ data: rows }) => {
        if (!rows || rows.length === 0) { setData([]); return; }
        const counts: Record<string, number> = {};
        rows.forEach((r) => {
          const obra = r.worksite || "Sem Obra";
          counts[obra] = (counts[obra] || 0) + 1;
        });
        setData(Object.entries(counts).map(([obra, entregas]) => ({ obra, entregas })).sort((a, b) => b.entregas - a.entregas));
      });
  }, [perfil?.empresa_id]);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">Entregas de EPI por Obra</h3>
        <p className="text-xs text-muted-foreground">Mês atual</p>
      </div>
      {data.length === 0 ? (
        <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
          Nenhum dado disponível
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12, fill: "hsl(215, 16%, 47%)" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="obra" tick={{ fontSize: 11, fill: "hsl(215, 16%, 47%)" }} axisLine={false} tickLine={false} width={100} />
            <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(214, 32%, 91%)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "12px" }} />
            <Bar dataKey="entregas" fill="hsl(239, 84%, 67%)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
