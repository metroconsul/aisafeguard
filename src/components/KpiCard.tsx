import { TrendingUp, TrendingDown } from "lucide-react";
import { type LucideIcon } from "lucide-react";

export interface KpiCardProps {
  title: string;
  value: string | number;
  trend?: { value: string; positive: boolean };
  icon: LucideIcon;
  alert?: boolean;
  subtitle?: string;
}

export function KpiCard({ title, value, trend, icon: Icon, alert, subtitle }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <div className="mt-3 flex items-end gap-2">
        <span className={`text-3xl font-semibold tabular-nums ${alert ? "text-destructive" : "text-foreground"}`}>
          {value}
        </span>
        {trend && (
          <span
            className={`mb-1 flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
              trend.positive
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {trend.positive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend.value}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
