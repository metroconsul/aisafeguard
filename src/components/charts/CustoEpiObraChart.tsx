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
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Entregas de EPI por Obra</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Distribuição no mês atual</p>
        </div>
        <div className="flex gap-2">
          <span className="rounded-full bg-primary-500 px-3 py-1 text-xs font-medium text-white">Mês atual</span>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">Por obra</span>
        </div>
      </div>
      {data.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title="Sem entregas neste mês"
          description="Quando houver entregas por obra, o ranking aparecerá aqui."
        />
      ) : (
        <div className="mt-4">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#6F8CAA" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="obra" tick={{ fontSize: 11, fill: "#6F8CAA" }} axisLine={false} tickLine={false} width={100} />
              <Tooltip cursor={{ fill: "rgba(0,55,138,0.06)" }} contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", boxShadow: "0 12px 32px -8px rgba(0,55,138,0.12)", fontSize: "12px", padding: "8px 12px" }} />
              <Bar dataKey="entregas" fill="#00378A" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
