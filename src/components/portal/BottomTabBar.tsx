import { NavLink } from "react-router-dom";
import { Home, HardHat, FileText, FolderOpen, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/portal", icon: Home, label: "Início", end: true },
  { to: "/portal/epis", icon: HardHat, label: "EPIs", end: false },
  { to: "/portal/holerites", icon: FileText, label: "Holerites", end: false },
  { to: "/portal/pontos", icon: Clock, label: "Pontos", end: false },
  { to: "/portal/documentos", icon: FolderOpen, label: "Docs", end: false },
];

export function BottomTabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-area-bottom">
      <div className="mx-auto flex max-w-md items-stretch">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            <tab.icon className="h-5 w-5" strokeWidth={1.8} />
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
