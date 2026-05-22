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
        "relative overflow-hidden rounded-2xl bg-white p-6 border transition-shadow",
        alert
          ? "shadow-xl shadow-red-200/60 border-red-200/60"
          : "shadow-xl shadow-gray-200/50 border-gray-100/50",
      )}
    >
      {alert && <div className="absolute inset-x-0 top-0 h-[3px] bg-red-500" />}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">{title}</p>
          <p
            className={cn(
              "mt-4 text-5xl font-extrabold tabular-nums tracking-tight",
              alert ? "text-red-600" : "text-gray-900",
            )}
          >
            {value}
          </p>
          {trend && (
            <span
              className={cn(
                "mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold",
                trend.positive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700",
              )}
            >
              {trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trend.value}
            </span>
          )}
          {subtitle && <p className="mt-2 text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-full",
            alert ? "bg-red-50" : "bg-indigo-50",
          )}
        >
          <Icon className={cn("h-7 w-7", alert ? "text-red-600" : "text-indigo-600")} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
