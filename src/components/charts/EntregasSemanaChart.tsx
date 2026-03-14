import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { entregasSemanaData } from "@/lib/mock-data";

export function EntregasSemanaChart() {
  const today = new Date().getDay(); // 0=Sun

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Entregas na Semana</h3>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">54</p>
          <span className="text-xs text-success">+12 em relação à semana anterior</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={entregasSemanaData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" vertical={false} />
          <XAxis dataKey="dia" tick={{ fontSize: 12, fill: "hsl(215, 16%, 47%)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "hsl(215, 16%, 47%)" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid hsl(214, 32%, 91%)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="entregas" radius={[4, 4, 0, 0]}>
            {entregasSemanaData.map((_, index) => (
              <Cell
                key={index}
                fill={index === today ? "hsl(239, 84%, 67%)" : "hsl(239, 84%, 67%, 0.3)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
