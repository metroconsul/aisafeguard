import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-border/80 bg-muted/25 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-card text-primary shadow-card ring-1 ring-border/70">
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </div>
      <p className="mt-4 text-sm font-semibold text-foreground">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
