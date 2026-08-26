import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type KpiTone = "primary" | "secondary" | "warning" | "destructive" | "success";

export interface KpiCardProps {
  title: string;
  value: string | number;
  trend?: { value: string; positive: boolean } | null;
  icon: LucideIcon;
  alert?: boolean;
  subtitle?: string;
  tone?: KpiTone;
  delayMs?: number;
  trendLabel?: string;
}

const toneStyles: Record<KpiTone, { icon: string; value: string; line: string }> = {
  primary: { icon: "bg-primary-50 text-primary-500", value: "text-foreground", line: "bg-primary-500" },
  secondary: { icon: "bg-secondary-50 text-secondary-400", value: "text-foreground", line: "bg-secondary-400" },
  warning: { icon: "bg-warning/10 text-warning", value: "text-foreground", line: "bg-warning" },
  destructive: { icon: "bg-destructive/10 text-destructive", value: "text-destructive", line: "bg-destructive" },
  success: { icon: "bg-success/10 text-success", value: "text-foreground", line: "bg-success" },
};

export function KpiCard({
  title,
  value,
  trend,
  icon: Icon,
  alert,
  subtitle,
  tone,
  delayMs = 0,
  trendLabel = "vs mês anterior",
}: KpiCardProps) {
  const resolvedTone: KpiTone = tone ?? (alert ? "destructive" : "primary");
  const styles = toneStyles[resolvedTone];

  return (
    <div
      className={cn(
        "group relative animate-fade-in-up overflow-hidden rounded-lg border bg-card p-5 opacity-0 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover",
        alert ? "border-destructive/25" : "border-border/80",
      )}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className={cn("absolute inset-x-0 top-0 h-0.5 opacity-80", styles.line)} />
      <div className="flex items-start justify-between gap-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{title}</p>
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", styles.icon)}>
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </div>
      </div>

      <p className={cn("mt-3 text-[30px] font-bold leading-none tracking-tight tabular-nums", styles.value)}>{value}</p>

      <div className="mt-4 flex min-h-5 items-center gap-2">
        {trend ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold",
              trend.positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
            )}
          >
            {trend.positive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {trend.value}
          </span>
        ) : (
          <span className="text-xs font-semibold text-muted-foreground">—</span>
        )}
        <span className="text-xs text-muted-foreground">{trendLabel}</span>
      </div>

      {subtitle && <p className="mt-2 text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
