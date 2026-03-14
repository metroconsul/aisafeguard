import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { entregasPorSetorData } from "@/lib/mock-data";

const COLORS: Record<string, string> = {
  Produção: "hsl(239, 84%, 67%)",
  Manutenção: "hsl(187, 85%, 53%)",
  Elétrica: "hsl(217, 91%, 60%)",
  Laboratório: "hsl(142, 71%, 45%)",
  Logística: "hsl(215, 16%, 47%)",
};

export function EntregasSetorChart() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Entregas por Setor</h3>
          <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={entregasPorSetorData} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" vertical={false} />
          <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "hsl(215, 16%, 47%)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "hsl(215, 16%, 47%)" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid hsl(214, 32%, 91%)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              fontSize: "12px",
            }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
          {Object.keys(COLORS).map((key) => (
            <Bar key={key} dataKey={key} stackId="a" fill={COLORS[key]} radius={key === "Logística" ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
