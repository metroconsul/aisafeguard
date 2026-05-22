import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "@/components/EmptyState";
import { PackageOpen } from "lucide-react";

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
    <div className="rounded-2xl bg-card p-6 shadow-elevated">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground">Entregas de EPI por Obra</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Mês atual</p>
      </div>
      {data.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title="Sem entregas neste mês"
          description="Quando houver entregas por obra, o ranking aparecerá aqui."
        />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 93%)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="obra" tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }} axisLine={false} tickLine={false} width={100} />
            <Tooltip cursor={{ fill: "hsl(239 84% 67% / 0.06)" }} contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 10px 24px -8px rgba(17,24,39,.18)", fontSize: "12px", padding: "8px 12px" }} />
            <Bar dataKey="entregas" fill="hsl(239, 84%, 67%)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
