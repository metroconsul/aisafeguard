import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const FILLS = [
  "hsl(239, 84%, 67%)",
  "hsl(187, 85%, 53%)",
  "hsl(217, 91%, 60%)",
  "hsl(142, 71%, 45%)",
  "hsl(215, 16%, 47%)",
  "hsl(38, 92%, 50%)",
];

interface PieData { name: string; value: number; fill: string }

export function DistribuicaoEpiChart() {
  const { perfil } = useAuth();
  const [data, setData] = useState<PieData[]>([]);

  useEffect(() => {
    if (!perfil?.empresa_id) return;

    supabase
      .from("entregas")
      .select("epis(nome_equipamento)")
      .eq("empresa_id", perfil.empresa_id)
      .then(({ data: rows }) => {
        if (!rows || rows.length === 0) { setData([]); return; }
        const counts: Record<string, number> = {};
        rows.forEach((r) => {
          const epi = r.epis as unknown as { nome_equipamento: string } | null;
          const nome = epi?.nome_equipamento ?? "Outros";
          counts[nome] = (counts[nome] || 0) + 1;
        });
        setData(
          Object.entries(counts).map(([name, value], i) => ({
            name,
            value,
            fill: FILLS[i % FILLS.length],
          }))
        );
      });
  }, [perfil?.empresa_id]);

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Distribuição de EPIs por Tipo</h3>
        <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
          Nenhuma entrega registrada
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <h3 className="mb-4 text-sm font-semibold text-foreground">Distribuição de EPIs por Tipo</h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="value" strokeWidth={0}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(214, 32%, 91%)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "12px" }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap gap-3 justify-center">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
            <span className="text-xs text-muted-foreground">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
