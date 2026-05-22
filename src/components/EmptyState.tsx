import { type LucideIcon } from "lucide-react";
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
        "border-2 border-dashed border-gray-200 rounded-xl bg-slate-50/50 p-12 m-4 flex flex-col items-center justify-center text-center",
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
        <Icon className="h-6 w-6 text-gray-400" strokeWidth={1.75} />
      </div>
      <p className="mt-4 text-lg font-bold text-gray-700">{title}</p>
      {description && <p className="mt-1 text-sm text-gray-500 max-w-sm">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}