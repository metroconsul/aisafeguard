import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-card p-6 transition-shadow",
        alert ? "shadow-alert" : "shadow-elevated",
      )}
    >
      {alert && <div className="absolute inset-x-0 top-0 h-[2px] bg-destructive" />}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="mt-3 flex items-end gap-2">
            <span
              className={cn(
                "text-3xl md:text-4xl font-bold tabular-nums tracking-tight",
                alert ? "text-destructive" : "text-foreground",
              )}
            >
              {value}
            </span>
            {trend && (
              <span
                className={cn(
                  "mb-1.5 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
                  trend.positive
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive",
                )}
              >
                {trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {trend.value}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-2 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
            alert ? "bg-destructive/10" : "bg-primary/10",
          )}
        >
          <Icon className={cn("h-5 w-5", alert ? "text-destructive" : "text-primary")} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
