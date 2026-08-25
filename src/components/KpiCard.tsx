import { ArrowUp, ArrowDown, type LucideIcon } from "lucide-react";
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

const toneStyles: Record<KpiTone, string> = {
  primary: "bg-primary-50 text-primary-500",
  secondary: "bg-secondary-50 text-secondary-400",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  success: "bg-success/10 text-success",
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

  return (
    <div
      className={cn(
        "animate-fade-in-up rounded-xl border bg-card p-5 opacity-0 shadow-card transition-all duration-200 hover:shadow-card-hover",
        alert ? "border-destructive/20" : "border-border",
      )}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", toneStyles[resolvedTone])}>
          <Icon className="h-5 w-5" strokeWidth={1.9} />
        </div>
      </div>

      <p
        className={cn(
          "animate-counter mt-2 text-3xl font-extrabold tracking-tight tabular-nums",
          alert ? "text-destructive" : "text-foreground",
        )}
      >
        {value}
      </p>

      <div className="mt-3 flex items-center gap-2">
        {trend ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
              trend.positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
            )}
          >
            {trend.positive ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
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
